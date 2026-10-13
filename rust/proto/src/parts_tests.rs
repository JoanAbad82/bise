//! The laws of his message's parts (msg-parts, architect m_17621):
//! render is the composers' template byte for byte, parse reads any
//! text back losslessly, and parse(render(p)) is p (canonical).

use super::*;

fn t(s: &str) -> Part {
    Part::Text { text: s.into() }
}

fn q(from: &str, text: &str) -> Part {
    Part::Quote { from: from.into(), text: text.into(), file: String::new(), new: String::new(), old: String::new() }
}

fn img(name: &str) -> Part {
    Part::Image { name: name.into(), source: "/Users/ana/Desktop/shot.png".into(), mime: "image/png".into(), b64_file: "/h/images/ab12.b64".into() }
}

/// Law 1: render writes what the composers wrote (the cases of the TUI's
/// quote.rs / pasted.rs / attach.rs tests and the desktop's message.ts
/// tests, their expected texts verbatim).
#[test]
fn render_is_the_composers_template() {
    // quote.rs: one quote, nothing after
    assert_eq!(render(&[q("main", "fn a() {}\n  b")]), "<selection from=\"main\">\nfn a() {}\n  b\n</selection>");
    // quote.rs: a quote then his words
    assert_eq!(render(&[q("you", "q"), t("look here")]), "<selection from=\"you\">\nq\n</selection>\nlook here");
    // quote.rs (diff quote): from, file, new, old; a quote in the from
    let d = Part::Quote { from: "t1 vs main".into(), text: " fn a() {\n-    x\n+    y".into(), file: "src/a \"b\".rs".into(), new: "12-14".into(), old: "11".into() };
    assert_eq!(render(&[d]), "<selection from=\"t1 vs main\" file=\"src/a 'b'.rs\" new=\"12-14\" old=\"11\">\n fn a() {\n-    x\n+    y\n</selection>");
    // only new lines
    let d = Part::Quote { from: "PR #7".into(), text: "x".into(), file: "x.rs".into(), new: "3".into(), old: String::new() };
    assert!(render(&[d]).starts_with("<selection from=\"PR #7\" file=\"x.rs\" new=\"3\">\n"));
    // a closing tag inside a quote is broken
    assert_eq!(render(&[q("main", "a </selection> b")]), "<selection from=\"main\">\na </selection > b\n</selection>");
    // message.ts pure.test: a quote, a paste in the words, an image label in the words
    let parts = [q("main", "fn main()"), t("what about "), Part::Paste { n: 2, text: "a\nb".into() }, t(" and [Image #3]?")];
    assert_eq!(render(&parts), "<selection from=\"main\">\nfn main()\n</selection>\nwhat about <pasted n=\"2\" lines=\"2\">\na\nb\n</pasted> and [Image #3]?");
    // pasted.rs: lines counts a last newline out; a closing tag broken
    assert_eq!(paste_tag(1, "a\nb\n"), "<pasted n=\"1\" lines=\"2\">\na\nb\n\n</pasted>");
    assert_eq!(paste_tag(4, "x </pasted> y"), "<pasted n=\"4\" lines=\"1\">\nx </pasted > y\n</pasted>");
    // the image store's marker (bend_images::marker), in place
    assert_eq!(
        render(&[t("look "), img("[Image #1]"), t(" here")]),
        "look <image name=\"[Image #1]\" path=\"/Users/ana/Desktop/shot.png\" mime=\"image/png\" b64=\"/h/images/ab12.b64\"> here"
    );
    // the hub's attached::render list: after a blank line, or alone
    assert_eq!(render(&[t("v2"), Part::File { path: "/w/notes.md".into() }, Part::File { path: "/w/q3.pdf".into() }]), "v2\n\n[files he attached:]\n/w/notes.md\n/w/q3.pdf");
    assert_eq!(render(&[Part::File { path: "/w/notes.md".into() }]), "[files he attached:]\n/w/notes.md");
    // several quotes, one per line, in order; no words
    assert_eq!(render(&[q("main", "a"), q("perf", "b")]), "<selection from=\"main\">\na\n</selection>\n<selection from=\"perf\">\nb\n</selection>");
    // nothing
    assert_eq!(render(&[]), "");
}

/// His screenshot's case (the "you answered main" row): a quote of
/// main's words, then his.
#[test]
fn his_card_answer_reads_as_a_quote_and_his_words() {
    let sent = "<selection from=\"main\">\namb-core a été tué au milieu de son tour (SIGKILL).\n</selection>\nSon process prenait tout mon CPU!";
    assert_eq!(parse(sent), vec![q("main", "amb-core a été tué au milieu de son tour (SIGKILL)."), t("Son process prenait tout mon CPU!")]);
    assert_eq!(words(&parse(sent)), "Son process prenait tout mon CPU!");
}

/// Law 2: parse reads every text back: render(parse(t)) == t, whatever
/// t is (tags that look like the composer's but aren't stay text).
#[test]
fn parse_is_lossless() {
    let cases = [
        "",
        "hi",
        "  spaces  ",
        "<selection from=\"main\">",
        "<selection from=\"x\">\nno end",
        "hello <selection from=\"x\">\na\n</selection> not in front",
        " <selection from=\"main\">\na\n</selection>\nleading space",
        "<selection from=\"main\">\na\n</selection>\n",
        "<selection from=\"main\">\na\n</selection>\n\ntwo newlines",
        "<selection from=\"main\" x=\"1\">\na\n</selection>\nunknown attribute",
        "<selection from=\"main\">\na\n</selection><selection from=\"b\">\nc\n</selection>",
        "<selection from=\"main\">\na </selection > b\n</selection>\nbroken close inside",
        "<pasted n=\"1\" lines=\"9\">\na\n</pasted> wrong count",
        "<pasted n=\"1\" lines=\"1\">\na\n</pasted>",
        "<pasted n=\"x\" lines=\"1\">\na\n</pasted>",
        "a <image name=\"[Image #1]\" path=\"/p.png\" mime=\"image/png\" b64=\"/s.b64\"> b <image name=\"broken",
        "<image name=\"a\" path=\"b\" mime=\"c\" b64=\"d>e\">",
        "words\n\n[files he attached:]\n/w/a.md",
        "words\n[files he attached:]\n/w/a.md",
        "words\n\n[files he attached:]\nnot/absolute",
        "see [files he attached:] below",
        "[files he attached:]\n/a\n/b",
        "é <pasted n=\"2\" lines=\"2\">\nü\nß\n</pasted>\n<selection from=\"main\">\nlate\n</selection>",
    ];
    for c in cases {
        assert_eq!(render(&parse(c)), c, "{c:?}");
    }
    // a text with no tag is one text part, none when empty
    assert_eq!(parse("just words"), vec![t("just words")]);
    assert_eq!(parse(""), Vec::<Part>::new());
    // a tag that is not in front stays in the words
    assert!(parse("hello <selection from=\"x\">\na\n</selection>").iter().all(|p| matches!(p, Part::Text { .. })));
}

/// A small deterministic generator (no proptest in this crate).
struct Rng(u64);

impl Rng {
    fn next(&mut self, n: usize) -> usize {
        self.0 = self.0.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        ((self.0 >> 33) as usize) % n.max(1)
    }

    fn pick<'a>(&mut self, xs: &[&'a str]) -> &'a str {
        xs[self.next(xs.len())]
    }
}

const BITS: &[&str] = &["", "a", "é", "\n", " ", "\"", ">", "</selection>", "</pasted>", "<selection from=\"", "<pasted n=\"", "<image name=\"", "[files he attached:]", "/x", "two words", "\n\n"];

fn word(r: &mut Rng) -> String {
    (0..r.next(4)).map(|_| r.pick(BITS)).collect()
}

fn gen_parts(r: &mut Rng) -> Vec<Part> {
    let mut out = Vec::new();
    for _ in 0..r.next(3) {
        out.push(q(&word(r), &word(r)));
    }
    for _ in 0..r.next(5) {
        out.push(match r.next(3) {
            0 => t(&word(r)),
            1 => Part::Paste { n: r.next(20) as u32, text: word(r) },
            _ => Part::Image { name: word(r), source: word(r), mime: "image/png".into(), b64_file: word(r) },
        });
    }
    for _ in 0..r.next(2) {
        out.push(Part::File { path: format!("/w/{}", r.pick(&["a.md", "b c.pdf", "é.txt"])) });
    }
    out
}

/// A part the composers make: text that never starts or ends the words
/// with a newline after the quotes (message.ts and attach::expand trim
/// the words), quote and paste texts that don't end in a newline (the
/// tag's own newline would eat it), image attributes the marker keeps.
fn composer_like(parts: Vec<Part>) -> Vec<Part> {
    let clean = |s: &str| s.replace(['"', '>', '\n', '\r'], "");
    parts
        .into_iter()
        .map(|p| match p {
            Part::Quote { from, text, .. } => q(&clean(&from), text.trim_end_matches('\n')),
            Part::Paste { n, text } => Part::Paste { n, text: text.trim_end_matches('\n').to_string() },
            Part::Image { name, source, mime, b64_file } => Part::Image { name: clean(&name), source: clean(&source), mime, b64_file: clean(&b64_file) },
            p => p,
        })
        .collect()
}

/// Law 3: parse(render(p)) == canonical(p) for the parts a composer
/// makes; and Law 2 again on every generated text.
#[test]
fn parse_reads_render_back() {
    let mut r = Rng(17_598);
    let mut checked = 0;
    for _ in 0..4000 {
        let parts = composer_like(gen_parts(&mut r));
        let text = render(&parts);
        assert_eq!(render(&parse(&text)), text, "lossless: {text:?}");
        // the words of a composer never start with a newline after a
        // quote, and never hold a files' list or a tag of their own
        let words = super::words(&parts);
        let plain_words = !words.starts_with('\n')
            && !words.contains(FILES_HEADER)
            && !words.contains("<selection from=\"")
            && !words.contains("<pasted n=\"")
            && !words.contains("<image name=\"")
            && !words.ends_with('\n');
        let quotes_plain = parts.iter().all(|p| match p {
            Part::Quote { text, .. } | Part::Paste { text, .. } => !text.contains("\n</selection>") && !text.contains("\n</pasted>") && !text.ends_with('\n'),
            _ => true,
        });
        let has_body = parts.iter().any(|p| matches!(p, Part::Text { text } if !text.is_empty()) || matches!(p, Part::Paste { .. } | Part::Image { .. }));
        let quotes = parts.iter().any(|p| matches!(p, Part::Quote { .. }));
        let files = parts.iter().any(|p| matches!(p, Part::File { .. }));
        // a quote with no words but files: the list's blank line reads as words
        if plain_words && quotes_plain && !(quotes && files && !has_body) {
            assert_eq!(parse(&text), canonical(&parts), "{text:?}");
            checked += 1;
        }
    }
    assert!(checked > 500, "the generator must reach the law: {checked}");
}

/// Old entries: a TUI message as sent before parts reads as its parts.
#[test]
fn an_old_tui_message_reads_as_its_parts() {
    let sent = "<selection from=\"you\">\n ▣ shot.png C'est embêtant ✓✓\n</selection>\nah ça a <pasted n=\"2\" lines=\"2\">\nx\ny\n</pasted> et <image name=\"[Image #3]\" path=\"/d/s.png\" mime=\"image/png\" b64=\"/i/3.b64\">";
    let parts = parse(sent);
    assert_eq!(
        parts,
        vec![
            q("you", " ▣ shot.png C'est embêtant ✓✓"),
            t("ah ça a "),
            Part::Paste { n: 2, text: "x\ny".into() },
            t(" et "),
            Part::Image { name: "[Image #3]".into(), source: "/d/s.png".into(), mime: "image/png".into(), b64_file: "/i/3.b64".into() },
        ]
    );
}

/// The wire: tagged by `kind`, empty attributes left out, an unknown
/// kind kept whole (a newer client's part survives an older reader).
#[test]
fn parts_on_the_wire() {
    let v = serde_json::to_value([q("main", "a"), t("b"), Part::File { path: "/f".into() }]).unwrap();
    assert_eq!(v, serde_json::json!([{"kind": "quote", "from": "main", "text": "a"}, {"kind": "text", "text": "b"}, {"kind": "file", "path": "/f"}]));
    let back: Vec<Part> = serde_json::from_value(serde_json::json!([{"kind": "voice", "secs": 3}, {"kind": "text", "text": "b"}])).unwrap();
    assert!(matches!(&back[0], Part::Unknown(v) if v["kind"] == "voice"));
    assert_eq!(back[1], t("b"));
    assert_eq!(serde_json::to_value(&back[0]).unwrap(), serde_json::json!({"kind": "voice", "secs": 3}));
    assert_eq!(render(&back), "b");
}

/// page-answer-row (architect m_20833): a page's message carries one page
/// part whose text is the model's whole text, so render gives it back
/// byte for byte; parse never makes one; canonical keeps it; on the wire
/// it is `kind: page` with its notes.
#[test]
fn a_page_part_renders_as_the_hubs_text() {
    let text = "you sent 1 note on your page \"efforts\" (effort-lists v4, http://x/p/effort-lists):\n1. on q-live: pick: la table\n<page-notes page=\"effort-lists\" version=\"4\">[]</page-notes>\n\n[from the page: answer on the page; one short line at most]";
    let note = PageNote { block: "q-live".into(), kind: "pick".into(), text: "la table".into(), card: 516, asked: "Est-ce que bise lit les listes ?".into(), ..PageNote::default() };
    let p = Part::Page { text: text.into(), to: "main".into(), page: "effort-lists".into(), title: "efforts".into(), version: 4, notes: vec![note.clone()] };
    assert_eq!(render(std::slice::from_ref(&p)), text);
    assert_eq!(canonical(std::slice::from_ref(&p)), vec![p.clone()]);
    assert!(!parse(text).iter().any(|x| matches!(x, Part::Page { .. })), "parse never makes a page part");
    assert_eq!(words(std::slice::from_ref(&p)), "", "his words come from the notes, never the template");
    let v = serde_json::to_value(&p).unwrap();
    assert_eq!(v["kind"], "page");
    assert_eq!(v["notes"][0], serde_json::json!({"block": "q-live", "kind": "pick", "text": "la table", "card": 516, "asked": "Est-ce que bise lit les listes ?"}));
    assert_eq!(serde_json::from_value::<Part>(v).unwrap(), p);
    let s = page_of(std::slice::from_ref(&p)).unwrap();
    assert_eq!((s.to, s.title, s.notes), ("main", "efforts", &[note][..]));
    assert!(page_of(&[t("x")]).is_none());
}
