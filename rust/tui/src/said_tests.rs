use super::*;

fn text(t: &str) -> Part {
    Part::Text { text: t.into() }
}

fn quote(from: &str, t: &str) -> Part {
    Part::Quote { from: from.into(), text: t.into(), file: String::new(), new: String::new(), old: String::new() }
}

#[test]
fn plain_words_have_no_parts_and_draw_from_their_text() {
    let s = Said::from("Son process prenait tout mon CPU!");
    assert!(s.parts.is_empty());
    assert_eq!(view(&s), View { body: s.text.clone(), ..View::default() });
    assert_eq!(s.words(), s.text);
}

// his screenshot's card answer: a quote of main then his words, read
// back from the old text once, drawn without a tag
#[test]
fn an_old_text_reads_as_its_parts_and_draws_without_a_tag() {
    let old = "<selection from=\"main\">\nle process\n</selection>\nSon process prenait tout mon CPU!";
    let s = Said::from(old);
    assert_eq!(s.parts, vec![quote("main", "le process"), text("Son process prenait tout mon CPU!")]);
    let v = view(&s);
    assert_eq!(v.quotes.len(), 1);
    assert_eq!((v.quotes[0].from.as_str(), v.quotes[0].text.as_str()), ("main", "le process"));
    assert_eq!(v.body, "Son process prenait tout mon CPU!");
    assert!(!v.body.contains('<'));
    assert_eq!(s.words(), "Son process prenait tout mon CPU!");
    // the model's text unchanged
    assert_eq!(s.text, old);
}

#[test]
fn a_paste_is_its_chip_mark_and_an_image_its_marker() {
    let img = Part::Image { name: "[Image #2]".into(), source: "/a/b.png".into(), mime: "image/png".into(), b64_file: "/s/x.b64".into(), caption: String::new() };
    let s = Said::of_parts(vec![text("look "), Part::Paste { n: 1, text: "a\nb".into() }, text(" and "), img.clone()]);
    assert_eq!(s.text, parts::render(&s.parts));
    let v = view(&s);
    assert_eq!(v.body, format!("look {MARK_OPEN}1{MARK_CLOSE} and {}", parts::image_marker("[Image #2]", "/a/b.png", "image/png", "/s/x.b64", "")));
    assert_eq!(v.pastes, vec![Pasted { n: 1, text: "a\nb".into() }]);
    assert!(v.quotes.is_empty());
    assert_eq!(s.words(), "look  and ");
}

#[test]
fn his_files_list_after_his_words() {
    let listed = |p: &str| Part::File { path: p.into(), name: String::new(), missing: false };
    let s = Said::of_parts(vec![text("see"), listed("/u/notes.md")]);
    assert_eq!(view(&s).body, format!("see\n\n{}\n/u/notes.md", parts::FILES_HEADER));
    let only = Said::of_parts(vec![listed("/u/a.md")]);
    assert_eq!(view(&only).body, format!("{}\n/u/a.md", parts::FILES_HEADER));
}

#[test]
fn words_alone_make_no_parts_and_a_view_reads_the_hubs_parts_as_sent() {
    assert!(Said::of_parts(vec![text("a"), text("b")]).parts.is_empty());
    assert_eq!(Said::of_parts(vec![text("a"), text("b")]).text, "ab");
    // the hub's parts win over what the text would parse to
    let s = Said::new("anything".into(), vec![quote("t1", "q"), text("w")]);
    assert_eq!(view(&s).quotes[0].from, "t1");
    assert_eq!(view(&s).body, "w");
}
