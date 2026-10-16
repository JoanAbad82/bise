//! `sb notify --artifact <id>[#<item>]` (card-links, architect m_27431):
//! main's card linked to what it is about, one `artifact` link
//! ([`bise_proto::rows::ArtLink`]) for any kind; a page link fills the
//! card's older `page` too (pm's B m_6008, the shape of a step card's
//! `page`), so an older client keeps its chip. `--page <id>[#<item>]` is
//! the same link. A task asks on its page (a question block makes the
//! linked card, notif-artifact); `sb notify` is main's (sb-core).
//! `sb notify --open <n>=<artifact>[#<anchor>]` (notif-open, architect
//! m_24679): its option n opens that artifact in the app, nothing sent.
//! One link per card, `{page?, artifact?, opens?}`, kept until the card
//! closes.

use crate::pages::Pages;
use bise_proto::rows::OptAct;
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

/// Where the hub keeps its cards' links, so they survive a restart like
/// the cards themselves (step cards reload theirs from steps.json).
pub fn file(state: &Path) -> PathBuf {
    state.join("card_links.json")
}

/// The links saved by [`save`], each `{page?, opens?}`; none when the
/// file is missing or broken. A link an older hub saved (the page's
/// `{id, url, ...}` itself) reads as its `page`.
pub fn load(path: &Path) -> BTreeMap<u64, Value> {
    let Ok(text) = std::fs::read_to_string(path) else { return BTreeMap::new() };
    let Ok(Value::Object(m)) = serde_json::from_str::<Value>(&text) else { return BTreeMap::new() };
    m.into_iter()
        .filter_map(|(k, v)| Some((k.parse().ok()?, v)).filter(|(_, v): &(u64, Value)| v.is_object()))
        .map(|(k, v)| if v.get("id").is_some() && v.get("url").is_some() { (k, json!({"page": v})) } else { (k, v) })
        .collect()
}

/// A card's `opens` as the hub's snapshot carries them: `{"<n>": <act>}`
/// (bise_proto::rows::opens_of reads them back).
pub fn opens_json(opens: &[(u32, OptAct)]) -> Value {
    Value::Object(opens.iter().filter_map(|(n, a)| Some((n.to_string(), serde_json::to_value(a).ok()?))).collect())
}

/// `--open`'s `<n>=<artifact>[#<anchor>]`: the option, the artifact and
/// where in it. Err: the usage line.
pub fn parse_open(spec: &str) -> Result<(u32, String, Option<String>), String> {
    let usage = || format!("--open expects <n>=<artifact>[#<anchor>], not {spec:?}");
    let (n, target) = spec.split_once('=').ok_or_else(usage)?;
    let n: u32 = n.trim().parse().ok().filter(|n| *n > 0).ok_or_else(usage)?;
    let (id, at) = match target.trim().split_once('#') {
        Some((id, at)) => (id.trim(), Some(at.trim()).filter(|a| !a.is_empty())),
        None => (target.trim(), None),
    };
    if id.is_empty() {
        return Err(usage());
    }
    Ok((n, id.to_string(), at.map(str::to_string)))
}

/// Option `n`'s act for `--open <n>=<id>[#<at>]`, checked: `art` is the
/// artifact by id (its kind, its link when it has one), the anchor
/// resolves on a page (its latest version). Err: the line the agent reads.
pub fn open_act(pages: Option<&Pages>, art: &dyn Fn(&str) -> Option<crate::artifacts::Meta>, spec: &str) -> Result<(u32, OptAct), String> {
    let (n, id, at) = parse_open(spec)?;
    let page = pages.and_then(|p| p.store.meta(&id).map(|m| (p, m)));
    let url = match (&page, art(&id)) {
        (Some((p, m)), _) => {
            let url = p.url(&id);
            match &at {
                None => Some(url),
                Some(a) => {
                    let html = p.store.html(&id, m.version()).unwrap_or_default();
                    block_of(&html, a).ok_or_else(|| format!("page {id:?} has no block or item {a:?} in v{} (--open {spec})", m.version()))?;
                    Some(format!("{url}#{a}"))
                }
            }
        }
        (None, Some(a)) => a.current().map(|v| v.target.clone()).filter(|t| t.starts_with("http://") || t.starts_with("https://")),
        (None, None) => return Err(format!("no artifact {id:?} (sb artifact list): --open {spec}")),
    };
    Ok((n, OptAct::artifact(&id, at.as_deref(), url.as_deref())))
}


/// Card → link, written whole (a temp file, then a rename).
pub fn save(path: &Path, links: &BTreeMap<u64, Value>) -> Result<(), String> {
    let m: serde_json::Map<String, Value> = links.iter().map(|(k, v)| (k.to_string(), v.clone())).collect();
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, Value::Object(m).to_string()).map_err(|e| format!("{}: {e}", tmp.display()))?;
    std::fs::rename(&tmp, path).map_err(|e| format!("{}: {e}", path.display()))
}

/// The card's `page` for `spec` (`<id>`, `<id>#<block>` or
/// `<id>#<item>`): {id, url} for the page, {id, block, url#block} for a
/// block, {id, block, item, url#item} for an item (`<li data-id>`, any
/// kit), found on the page's latest version. Err: the line the agent reads.
pub fn link(pages: &Pages, spec: &str) -> Result<Value, String> {
    let (id, item) = match spec.trim().split_once('#') {
        Some((id, item)) => (id.trim(), Some(item.trim()).filter(|i| !i.is_empty())),
        None => (spec.trim(), None),
    };
    let meta = pages.store.meta(id).ok_or_else(|| format!("no page {id:?} (sb page list)"))?;
    let url = pages.url(id);
    // the card's chip, '↗ <title> · page · v<n>' (notif-artifact)
    let (title, v) = (meta.title.clone(), meta.version());
    let Some(item) = item else { return Ok(json!({"id": id, "url": url, "title": title, "v": v})) };
    let html = pages.store.html(id, v).unwrap_or_default();
    match block_of(&html, item) {
        Some(b) if b == item => Ok(json!({"id": id, "block": b, "url": format!("{url}#{item}"), "title": title, "v": v})),
        Some(b) => Ok(json!({"id": id, "block": b, "item": item, "url": format!("{url}#{item}"), "title": title, "v": v})),
        None => Err(format!("page {id:?} has no block or item {item:?} in v{v}")),
    }
}

/// The `artifact` link of a card's `page` link (snapshot shape): kind
/// `page`, its item or block as an [`Anchor::Block`]. None: not a page
/// link (no id).
///
/// [`Anchor::Block`]: bise_proto::anchor::Anchor::Block
pub fn art_of_page(page: &Value) -> Option<Value> {
    let id = page.get("id").and_then(Value::as_str).filter(|i| !i.is_empty())?;
    let s = |k: &str| page.get(k).and_then(Value::as_str).filter(|x| !x.is_empty());
    let mut a = json!({"id": id, "kind": "page", "title": s("title").unwrap_or(id)});
    if let Some(v) = page.get("v").and_then(Value::as_u64) {
        a["v"] = json!(v);
    }
    if let Some(u) = s("url") {
        a["url"] = json!(u);
    }
    if let Some(at) = s("item").or(s("block")) {
        a["at"] = json!({"kind": "block", "block": at});
    }
    Some(a)
}

/// `--artifact <id>[#<item>]`: a page (its id) links like `--page`, its
/// `page` and its `artifact`; any other artifact its `artifact` alone,
/// `{id, kind, title, v, url?}` (`url` only for a link). Err: the line the
/// agent reads (no such artifact, an item on an artifact that is no page).
pub fn artifact(pages: Option<&Pages>, art: &dyn Fn(&str) -> Option<crate::artifacts::Meta>, spec: &str) -> Result<(Option<Value>, Value), String> {
    let (id, item) = match spec.trim().split_once('#') {
        Some((id, item)) => (id.trim(), Some(item.trim()).filter(|i| !i.is_empty())),
        None => (spec.trim(), None),
    };
    if let Some(p) = pages.filter(|p| p.store.meta(id).is_some()) {
        let page = link(p, spec)?;
        let a = art_of_page(&page).unwrap_or(Value::Null);
        return Ok((Some(page), a));
    }
    let m = art(id).ok_or_else(|| format!("no artifact {id:?} (sb artifact list)"))?;
    if let Some(i) = item {
        return Err(format!("{id:?} is a {}, not a page: no #{i} in it (sb notify --artifact {id})", m.kind));
    }
    let mut a = json!({"id": m.id, "kind": m.kind, "title": m.title});
    if let Some(v) = m.current() {
        a["v"] = json!(v.v);
        if v.target.starts_with("http://") || v.target.starts_with("https://") {
            a["url"] = json!(v.target);
        }
    }
    Ok((None, a))
}

/// The block of `target` in a fragment: a block's own id (`<section
/// data-id>`) is itself; an item's (`<li data-id>`) is the section around
/// it. None: no such id.
pub fn block_of(html: &str, target: &str) -> Option<String> {
    let id_of = |head: &str| {
        ["data-id=\"", "data-id='"].iter().find_map(|k| {
            let at = head.find(k)? + k.len();
            let q = k.chars().last()?;
            head[at..].split(q).next().map(str::to_string)
        })
    };
    let mut rest = html;
    while let Some(i) = rest.find("<section") {
        let sec = &rest[i..];
        let end = sec.find("</section>").map_or(sec.len(), |e| e + "</section>".len());
        let (block, after) = (&sec[..end], &sec[end..]);
        rest = after;
        let head = &block[..block.find('>').unwrap_or(block.len())];
        let Some(bid) = id_of(head) else { continue };
        if bid == target {
            return Some(bid);
        }
        let mut items = block.split("<li").skip(1).filter_map(|li| li.find('>').map(|g| &li[..g]));
        if items.any(|h| id_of(h).as_deref() == Some(target)) {
            return Some(bid);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pages::store::Publish;

    const HTML: &str = r#"<section data-kit="review" data-id="comments" data-verb="reply"><ol>
<li data-id="hn-41">tptacek asks about the sandbox</li>
<li data-id='x-7'>a quote</li></ol></section>
<section data-kit="checklist" data-id="next"><ol><li data-id="s1">post the thread</li></ol></section>"#;

    #[test]
    fn the_links_survive_a_restart() {
        let d = std::env::temp_dir().join(format!("sb-card-links-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        let f = file(&d);
        assert!(load(&f).is_empty(), "no file: no links");
        let links = BTreeMap::from([
            (7, json!({"page": {"id": "launch-watch", "block": "comments", "item": "hn-41", "url": "http://h/p/launch-watch#hn-41"}})),
            (8, json!({"opens": {"1": {"act": "open", "artifact": "w", "url": "http://h/p/w"}}})),
            (9, json!({"page": {"id": "w", "url": "http://h/p/w"}})),
        ]);
        save(&f, &links).unwrap();
        assert_eq!(load(&f), links);
        // an older hub's link (the page itself) reads as its page
        std::fs::write(&f, r#"{"9": {"id": "w", "url": "http://h/p/w"}}"#).unwrap();
        assert_eq!(load(&f)[&9], links[&9]);
        assert!(!f.with_extension("json.tmp").exists(), "no temp file left");
        save(&f, &BTreeMap::new()).unwrap();
        assert!(load(&f).is_empty(), "all closed: none");
        std::fs::write(&f, "{not json").unwrap();
        assert!(load(&f).is_empty(), "a broken file: none, the hub starts");
        std::fs::write(&f, r#"{"x": {"id": "a"}, "3": "nope", "4": {"id": "b"}}"#).unwrap();
        assert_eq!(load(&f).keys().copied().collect::<Vec<_>>(), vec![4], "only card numbers with a link");
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn an_item_is_in_the_block_around_it_a_block_is_itself() {
        assert_eq!(block_of(HTML, "hn-41").as_deref(), Some("comments"));
        assert_eq!(block_of(HTML, "x-7").as_deref(), Some("comments"));
        assert_eq!(block_of(HTML, "s1").as_deref(), Some("next"));
        assert_eq!(block_of(HTML, "next").as_deref(), Some("next"));
        assert_eq!(block_of(HTML, "hn-4"), None, "a prefix of an id is not the id");
        assert_eq!(block_of(HTML, "nope"), None);
    }

    #[test]
    fn a_card_links_its_page_its_block_or_its_item_like_a_step_card() {
        let d = std::env::temp_dir().join(format!("sb-card-link-{}", std::process::id()));
        let p = Pages::new(&d, 47123, &d);
        let pb = Publish { agent: "watch".into(), id: Some("launch-watch".into()), html: HTML.into(), ..Default::default() };
        p.publish(&pb, 1, &|_| false).unwrap();
        let u = "http://127.0.0.1:47123/p/launch-watch";
        let t = p.store.meta("launch-watch").unwrap().title;
        assert_eq!(link(&p, "launch-watch").unwrap(), json!({"id": "launch-watch", "url": u, "title": t, "v": 1}));
        assert_eq!(
            link(&p, "launch-watch#hn-41").unwrap(),
            json!({"id": "launch-watch", "block": "comments", "item": "hn-41", "url": format!("{u}#hn-41"), "title": t, "v": 1})
        );
        assert_eq!(
            link(&p, " launch-watch#next ").unwrap(),
            json!({"id": "launch-watch", "block": "next", "url": format!("{u}#next"), "title": t, "v": 1})
        );
        assert_eq!(link(&p, "launch-watch#").unwrap()["url"], u, "an empty item: the page");
        assert!(link(&p, "launch-watch#gone").unwrap_err().contains("no block or item \"gone\""));
        assert!(link(&p, "nope#hn-41").unwrap_err().contains("no page \"nope\""));
        let _ = std::fs::remove_dir_all(d);
    }

    /// notif-open (architect m_24679): `--open <n>=<artifact>[#<anchor>]`
    /// gives option n an act that opens the artifact in the app, its url
    /// beside for a client that can't; a page's anchor is checked on its
    /// latest version; a missing artifact or anchor, a bad spec, refused
    /// with the words the agent reads.
    #[test]
    fn an_option_opens_an_artifact_checked_before_the_card_opens() {
        let d = std::env::temp_dir().join(format!("sb-card-open-{}", std::process::id()));
        let p = Pages::new(&d, 47124, &d.join("kit"));
        let pb = Publish { agent: "watch".into(), id: Some("launch-watch".into()), html: HTML.into(), ..Default::default() };
        p.publish(&pb, 1, &|_| false).unwrap();
        let u = "http://127.0.0.1:47124/p/launch-watch";
        let none = |_: &str| None;
        assert_eq!(open_act(Some(&p), &none, "1=launch-watch#hn-41").unwrap(), (1, OptAct::artifact("launch-watch", Some("hn-41"), Some(&format!("{u}#hn-41")))));
        assert_eq!(open_act(Some(&p), &none, " 2 = launch-watch ").unwrap(), (2, OptAct::artifact("launch-watch", None, Some(u))));
        assert!(open_act(Some(&p), &none, "1=launch-watch#gone").unwrap_err().contains("no block or item \"gone\""));
        assert!(open_act(Some(&p), &none, "1=nope").unwrap_err().contains("no artifact \"nope\" (sb artifact list)"));
        assert!(open_act(None, &none, "1=launch-watch").is_err(), "no pages, no such artifact");
        // an artifact that is no page: its link when it has one
        let meta = |t: &str| crate::artifacts::Meta {
            id: "plan".into(), title: "plan".into(), kind: "doc".into(), agent: "a".into(), by: "a".into(), created_ms: 0, source: t.into(), cwd: String::new(),
            versions: vec![crate::artifacts::Version { v: 1, at_ms: 0, target: t.into(), ..Default::default() }],
        };
        assert_eq!(open_act(None, &|id: &str| (id == "plan").then(|| meta("/w/plan.md")), "3=plan").unwrap(), (3, OptAct::artifact("plan", None, None)));
        assert_eq!(open_act(None, &|_: &str| Some(meta("https://x.test/a")), "1=plan").unwrap().1, OptAct::artifact("plan", None, Some("https://x.test/a")));
        for bad in ["1", "=plan", "0=plan", "x=plan", "1=", "1=#a"] {
            assert!(parse_open(bad).unwrap_err().contains("--open expects <n>=<artifact>[#<anchor>]"), "{bad}");
        }
        assert_eq!(opens_json(&[(1, OptAct::artifact("w", Some("b"), None))]), json!({"1": {"act": "open", "artifact": "w", "at": "b"}}));
        let _ = std::fs::remove_dir_all(d);
    }

    /// card-links (architect m_27431): `--artifact` links any artifact in
    /// one `artifact` link; a page id is `--page`'s link plus its
    /// `artifact`; an item only on a page; a missing one refused.
    #[test]
    fn a_card_links_any_artifact_a_page_too() {
        let d = std::env::temp_dir().join(format!("sb-card-art-{}", std::process::id()));
        let p = Pages::new(&d, 47125, &d.join("kit"));
        let pb = Publish { agent: "bims".into(), id: Some("bims-office".into()), html: HTML.into(), ..Default::default() };
        p.publish(&pb, 1, &|_| false).unwrap();
        let u = "http://127.0.0.1:47125/p/bims-office";
        let t = p.store.meta("bims-office").unwrap().title;
        let meta = |t: &str| crate::artifacts::Meta {
            id: "les-bims-prototype".into(), title: "les bims · prototype".into(), kind: "site".into(), agent: "bims".into(), by: "bims".into(), created_ms: 0, source: t.into(), cwd: String::new(),
            versions: vec![crate::artifacts::Version { v: 2, at_ms: 0, target: t.into(), ..Default::default() }],
        };
        let file = |id: &str| (id == "les-bims-prototype").then(|| meta("/w/bims.html"));
        let (page, a) = artifact(Some(&p), &file, "bims-office#hn-41").unwrap();
        assert_eq!(page.unwrap(), link(&p, "bims-office#hn-41").unwrap(), "a page: --page's link");
        assert_eq!(a, json!({"id": "bims-office", "kind": "page", "title": t, "v": 1, "url": format!("{u}#hn-41"), "at": {"kind": "block", "block": "hn-41"}}));
        let al: bise_proto::rows::ArtLink = serde_json::from_value(a).unwrap();
        assert_eq!(al.at, Some(bise_proto::anchor::Anchor::Block { block: "hn-41".into(), quote: String::new() }));
        assert_eq!(
            artifact(Some(&p), &file, "les-bims-prototype").unwrap(),
            (None, json!({"id": "les-bims-prototype", "kind": "site", "title": "les bims · prototype", "v": 2}))
        );
        let link_ = |_: &str| Some(meta("https://bims.test/"));
        assert_eq!(artifact(None, &link_, "les-bims-prototype").unwrap().1["url"], "https://bims.test/", "a link opens outside the app too");
        assert!(artifact(Some(&p), &file, "les-bims-prototype#look").unwrap_err().contains("is a site, not a page"));
        assert!(artifact(Some(&p), &file, "nope").unwrap_err().contains("no artifact \"nope\""));
        assert!(artifact(Some(&p), &file, "bims-office#gone").unwrap_err().contains("no block or item \"gone\""));
        // the snapshot's page links (a page question's card) get theirs
        assert_eq!(art_of_page(&json!({"id": "w", "url": "http://h/p/w#q1", "block": "q1"})).unwrap(), json!({"id": "w", "kind": "page", "title": "w", "url": "http://h/p/w#q1", "at": {"kind": "block", "block": "q1"}}));
        assert_eq!(art_of_page(&json!({"url": "x"})), None);
        let _ = std::fs::remove_dir_all(d);
    }
}
