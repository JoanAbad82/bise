use super::*;

fn ok(html: &str) -> Vec<Block> {
    match lint(html) {
        Ok(b) => b,
        Err(e) => panic!("expected ok, got {e:#?}"),
    }
}

fn errs(html: &str) -> Vec<String> {
    match lint(html) {
        Ok(b) => panic!("expected errors, got {b:#?}"),
        Err(e) => e,
    }
}

fn has(errs: &[String], want: &str) {
    assert!(
        errs.iter().any(|e| e.contains(want)),
        "no line with {want:?} in {errs:#?}"
    );
}

const WEEKLY: &str = include_str!("../../../../apps/ambient/kit/examples/weekly-update.html");

#[test]
fn every_example_page_passes() {
    let dir =
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../apps/ambient/kit/examples");
    let mut n = 0;
    for f in std::fs::read_dir(&dir).unwrap() {
        let p = f.unwrap().path();
        if p.extension().is_some_and(|e| e == "html") {
            if let Err(e) = lint(&std::fs::read_to_string(&p).unwrap()) {
                panic!("{}: {e:#?}", p.display());
            }
            n += 1;
        }
    }
    assert!(n >= 3, "examples in {}: {n}", dir.display());
}

/// The page the bise-pages skill teaches passes the lint as written.
#[test]
fn the_skills_example_passes() {
    let skill = include_str!("../../../../prompts/skills/bise-pages/SKILL.md");
    let html = skill
        .split("```html\n")
        .nth(1)
        .and_then(|s| s.split("```").next())
        .expect("an html example");
    let blocks = ok(html);
    assert!(html.lines().count() <= 60, "about 50 lines");
    for kit in KINDS {
        assert!(
            blocks.iter().any(|b| &b.kit == kit),
            "the skill's example has no {kit}"
        );
    }
}

#[test]
fn the_weekly_update_has_every_kind() {
    let blocks = ok(WEEKLY);
    assert!(blocks.len() >= 5, "{blocks:#?}");
    for kit in KINDS {
        assert!(
            blocks.iter().any(|b| &b.kit == kit),
            "weekly update has no {kit}"
        );
    }
}

#[test]
fn blocks_come_in_order_with_a_stable_hash() {
    let b = ok(
        r#"<section data-kit="heading" data-id="h"><h1>week 14</h1></section>
<section data-kit="prose" data-id="p1"><p>we shipped <strong>dark mode</strong>.</p></section>"#,
    );
    assert_eq!(
        b.iter()
            .map(|b| (b.id.as_str(), b.kit.as_str()))
            .collect::<Vec<_>>(),
        [("h", "heading"), ("p1", "prose")]
    );
    assert_eq!(b[0].hash.len(), 16);
    assert!(b[0].hash.chars().all(|c| c.is_ascii_hexdigit()));
    // fixed forever: FNV-1a 64 of the folded source, so meta.json stays comparable across builds
    assert_eq!(
        b[0].hash,
        format!(
            "{:016x}",
            fnv64(r#"<section data-kit="heading" data-id="h"><h1>week 14</h1>"#)
        )
    );
}

#[test]
fn the_hash_follows_the_content_not_the_indent() {
    let a = ok(r#"<section data-kit="prose" data-id="p1"><p>one two</p></section>"#);
    let b = ok("<section data-kit=\"prose\" data-id=\"p1\">\n   <p>one\n two</p>\n</section>\n");
    let c = ok(r#"<section data-kit="prose" data-id="p1"><p>one three</p></section>"#);
    let d =
        ok(r#"<section data-kit="callout" data-id="p1" data-tone="risk"><p>one two</p></section>"#);
    assert_eq!(a[0].hash, b[0].hash);
    assert_ne!(a[0].hash, c[0].hash);
    assert_ne!(a[0].hash, d[0].hash);
}

#[test]
fn style_in_any_form_fails_with_its_block() {
    let e = errs(
        r#"<section data-kit="table" data-id="t1"><table><tr><td style="color:red">1</td></tr></table></section>"#,
    );
    assert_eq!(
        e,
        ["t1: style= is not allowed: the kit draws every block, use data-tone"]
    );
    let e = errs(
        r#"<style>p{color:red}</style><section data-kit="prose" data-id="p1"><p>x</p></section>"#,
    );
    has(&e, "line 1: <style> is not allowed");
    assert_eq!(
        e.len(),
        1,
        "the css inside is skipped, not read as text: {e:#?}"
    );
    has(
        &errs(r#"<section data-kit="prose" data-id="p1" style="x"><p>x</p></section>"#),
        "p1: style= is not allowed",
    );
}

#[test]
fn code_and_embeds_fail() {
    let e = errs(
        r#"<section data-kit="prose" data-id="p1"><p onclick="x()">a</p><script>alert("<p>")</script>
<iframe src="https://x.com"></iframe><object></object><link rel=stylesheet href=a.css><a href="javascript:alert(1)">x</a>
<a href=" jav&#x61;script&colon;alert(1)">y</a><img src="https://x.com/a.png"><img src="//x.com/a.png"></section>"#,
    );
    has(&e, "p1: onclick= is not allowed");
    has(&e, "p1: <script> is not allowed");
    has(&e, "p1: <iframe> is not allowed");
    has(&e, "p1: <object> is not allowed");
    has(&e, "p1: <link> is not allowed");
    has(&e, "p1: javascript: links are not allowed");
    has(
        &e,
        "p1: an image from the network is not allowed: put it in the page as a data: src",
    );
    assert!(!e.iter().any(|l| l.contains("text outside")), "{e:#?}");
}

#[test]
fn outside_links_relative_and_data_images_are_fine() {
    ok(
        r##"<section data-kit="sources" data-id="s"><ol><li><a href="https://linear.app/acme/issue/A-1">A-1</a></li>
<li><a href="mailto:x@y.z">mail</a> <a href="/p/other">other page</a> <a href="#t1">t1</a></li></ol>
<p><img src="data:image/png;base64,iVBOR" alt="chart"><img src="chart.png" alt=""></p></section>"##,
    );
    has(
        &errs(
            r#"<section data-kit="prose" data-id="p"><p><img src="data:text/html,x"></p></section>"#,
        ),
        "data: images are not allowed",
    );
    has(
        &errs(
            r#"<section data-kit="prose" data-id="p"><p><a href="data:text/html,x">x</a></p></section>"#,
        ),
        "data: links are not allowed",
    );
}

#[test]
fn blocks_need_a_known_kind_and_one_id_each() {
    let e = errs(
        r#"<section data-kit="chart" data-id="c1"><p>x</p></section>
<section data-kit="prose"><p>x</p></section>
<section data-kit="prose" data-id="p1"><p>x</p></section>
<section data-kit="prose" data-id="p1"><p>y</p></section>
<section data-id="p2"><p>x</p></section>
<section data-kit="prose" data-id="no spaces"><p>x</p></section>"#,
    );
    has(&e, "c1: data-kit=\"chart\" is not a kit block: use prose, heading, callout, sources, table, question");
    has(&e, "line 2: a block without data-id");
    has(&e, "p1: this data-id is used twice");
    has(&e, "p2: <section> without data-kit");
    has(&e, "data-id=\"no spaces\" is not a valid id");
}

#[test]
fn everything_lives_in_a_block() {
    let e = errs(
        "<h1>hi</h1>\nloose words\n<section data-kit=\"prose\" data-id=\"p1\"><p>x</p></section>",
    );
    has(&e, "line 1: <h1> outside a block");
    has(&e, "line 1: text outside a block"); // the `hi` inside the stray h1
    has(&e, "line 2: text outside a block");
    has(&errs("<!doctype html><html><body><section data-kit=\"prose\" data-id=\"p\"><p>x</p></section></body></html>"),
        "<!doctype> is not allowed: write only the blocks");
    has(
        &errs(r#"<section data-kit="prose" data-id="p"><div>x</div><span>y</span></section>"#),
        "p: <div> is not allowed",
    );
    has(
        &errs(r#"<section data-kit="prose" data-id="p"><p>x</p>"#),
        "p: <section> is not closed",
    );
    has(
        &errs(
            r#"<section data-kit="prose" data-id="a"><section data-kit="prose" data-id="b"></section></section>"#,
        ),
        "a: a block inside a block",
    );
    has(&errs("  \n<!-- nothing -->\n"), "the page has no blocks");
}

#[test]
fn comments_and_bare_angles_are_text() {
    let b = ok("<!-- v2: the march numbers -->\n<section data-kit=\"prose\" data-id=\"p1\"><p>a < b, 3<4</p></section>");
    assert_eq!(b.len(), 1);
}

#[test]
fn values_are_data_attributes_the_kit_knows() {
    ok(r#"<section data-kit="callout" data-id="c" data-tone="risk"><p>x</p></section>"#);
    has(
        &errs(r#"<section data-kit="callout" data-id="c" data-tone="red"><p>x</p></section>"#),
        "c: data-tone=\"red\" is not a tone: use note, good, risk",
    );
    has(
        &errs(r#"<section data-kit="prose" data-id="c" data-color="red"><p>x</p></section>"#),
        "c: data-color is not a kit attribute",
    );
    has(
        &errs(r#"<section data-kit="prose" data-id="c"><p data-x="1">x</p></section>"#),
        "c: data-x is not a kit attribute: only blocks take data- attributes",
    );
    has(
        &errs(r#"<section data-kit="prose" data-id="c" class="big"><p>x</p></section>"#),
        "c: class= is not allowed",
    );
    has(
        &errs(r#"<section data-kit="prose" data-id="c"><p align="center">x</p></section>"#),
        "c: align= is not allowed on <p>",
    );
    ok(
        r#"<section data-kit="table" data-id="t"><table><tr><th scope="col" colspan="2">a</th></tr></table></section>"#,
    );
}

#[test]
fn each_kind_has_what_it_needs() {
    has(
        &errs(r#"<section data-kit="heading" data-id="h"><p>x</p></section>"#),
        "h: a heading block needs its title as <h1>",
    );
    has(
        &errs(r#"<section data-kit="table" data-id="t"><p>x</p></section>"#),
        "t: a table block needs a <table>",
    );
    has(
        &errs(r#"<section data-kit="question" data-id="q"><p>which?</p></section>"#),
        "q: a question block needs its options",
    );
    has(
        &errs(r#"<section data-kit="sources" data-id="s"><ul><li>a mail</li></ul></section>"#),
        "s: a sources block needs links",
    );
    ok(
        r#"<section data-kit="question" data-id="q" data-answer="2"><p>which?</p><ol><li>a</li><li>b</li></ol></section>"#,
    );
}

#[test]
fn too_big_is_one_line() {
    let big = format!(
        "<section data-kit=\"prose\" data-id=\"p\"><p>{}</p></section>",
        "x".repeat(MAX_BYTES)
    );
    let e = errs(&big);
    assert_eq!(e.len(), 1);
    has(&e, "over the 1024 KB limit");
}

#[test]
fn one_line_per_problem() {
    let e = errs(
        r#"<section data-kit="prose" data-id="p"><p style="a">1</p><p style="b">2</p></section>"#,
    );
    assert_eq!(e.len(), 1, "{e:#?}");
}
