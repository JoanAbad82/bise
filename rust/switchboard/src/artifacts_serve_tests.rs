use super::*;
use std::collections::BTreeMap;

fn recipe() -> Serve {
    Serve { argv: vec!["node".into(), "vite".into()], cwd: "/w/app".into(), port: 5173 }
}

fn version(serve: Option<Serve>, copy: Option<&str>) -> Version {
    Version { v: 2, target: "http://127.0.0.1:5173/app".into(), serve, copy: copy.map(Into::into), ..Default::default() }
}

#[test]
fn only_a_local_link_with_a_port_has_one() {
    assert_eq!(local_port("http://127.0.0.1:5173/app"), Some(5173));
    assert_eq!(local_port("http://localhost:3000"), Some(3000));
    assert_eq!(local_port("http://0.0.0.0:8000?x=1"), Some(8000));
    assert_eq!(local_port("http://[::1]:4000/"), Some(4000));
    assert_eq!(local_port("http://127.0.0.1/app"), None, "no port");
    assert_eq!(local_port("https://bims.vercel.app:443/"), None, "not local");
    assert_eq!(local_port("/w/site/index.html"), None);
}

#[test]
fn the_listener_is_the_lowest_pid_on_the_port() {
    let ports = BTreeMap::from([(30, vec![5173]), (12, vec![3000, 5173]), (5, vec![8000])]);
    assert_eq!(listener(&ports, 5173), Some(12));
    assert_eq!(listener(&ports, 9999), None);
}

#[test]
fn a_static_site_is_the_folder_whose_index_has_the_same_bytes() {
    let files = BTreeMap::from([("/w/app/index.html", b"<p>src</p>".to_vec()), ("/w/app/dist/index.html", b"<p>built</p>".to_vec())]);
    let read = |p: &Path| files.get(p.to_str().unwrap()).cloned();
    assert_eq!(static_root(b"<p>built</p>", Path::new("/w/app"), read), Some(PathBuf::from("/w/app/dist")));
    assert_eq!(static_root(b"<p>src</p>", Path::new("/w/app"), read), Some(PathBuf::from("/w/app")));
    assert_eq!(static_root(b"<p>made by a script</p>", Path::new("/w/app"), read), None, "a dev server's own html: not static");
    assert_eq!(static_root(b"", Path::new("/w/app"), read), None);
}

#[test]
fn argv_reads_from_procargs2_and_cmdline() {
    let mut buf = 3i32.to_ne_bytes().to_vec();
    buf.extend_from_slice(b"/usr/bin/python3\0\0\0\0python3\0-m\0http.server\0PATH=/bin\0");
    assert_eq!(procargs2(&buf), Some(vec!["python3".to_string(), "-m".into(), "http.server".into()]));
    assert_eq!(procargs2(&0i32.to_ne_bytes()), None);
    assert_eq!(procargs2(b"\x01"), None, "short");
    assert_eq!(cmdline(b"node\0my app/vite.js\0--port\x005173\0"), vec!["node", "my app/vite.js", "--port", "5173"]);
    assert!(cmdline(b"").is_empty());
}

#[test]
fn the_port_is_ours_only_with_the_same_argv_and_folder() {
    let s = recipe();
    assert_eq!(holder(&s, None), Holder::Free);
    assert_eq!(holder(&s, Some((s.argv.clone(), s.cwd.clone()))), Holder::Ours);
    let other = (vec!["node".to_string(), "vite".into()], "/w/other-agent".to_string());
    assert_eq!(holder(&s, Some(other.clone())), Holder::Other { argv: other.0, cwd: other.1 }, "another agent's vite on the same default port");
}

/// The door's law: its own server first, then bise's copy, never another
/// server's site, a start only when its folder is there.
#[test]
fn the_door_goes_to_its_server_its_copy_or_starts_it() {
    let (s, ours, free) = (recipe(), Holder::Ours, Holder::Free);
    let other = Holder::Other { argv: vec!["ruby".into()], cwd: "/x".into() };
    let live = version(Some(s.clone()), None);
    assert_eq!(decide("site", &live, Some(&ours), true, &["docs", "a.html"]), Open::Go("http://127.0.0.1:5173/app/docs/a.html".into()));
    assert_eq!(decide("site", &live, Some(&free), true, &[]), Open::Start);
    assert_eq!(decide("site", &live, Some(&free), false, &[]), Open::Why(Why::FolderGone { cwd: "/w/app".into() }));
    assert!(matches!(decide("site", &live, Some(&other), true, &[]), Open::Why(Why::Taken { port: 5173, .. })));
    let kept = version(Some(s), Some("v2/dist"));
    assert_eq!(decide("site", &kept, Some(&free), false, &[]), Open::Copy("/a/site/2/".into()), "a static site's copy outlives its folder");
    assert_eq!(decide("site", &kept, Some(&other), true, &[]), Open::Copy("/a/site/2/".into()));
    assert_eq!(decide("site", &kept, Some(&ours), true, &[]), Open::Go("http://127.0.0.1:5173/app".into()));
    // a link bise knows no way to start: the link, as before
    assert_eq!(decide("site", &version(None, None), None, false, &[]), Open::Go("http://127.0.0.1:5173/app".into()));
}

#[test]
fn only_a_local_link_bise_can_serve_has_a_door() {
    assert!(has_door(&version(Some(recipe()), None)));
    assert!(has_door(&version(None, Some("v2/dist"))));
    assert!(!has_door(&version(None, None)));
    assert!(!has_door(&Version { target: "/w/site".into(), copy: Some("v1/site".into()), ..Default::default() }));
    assert_eq!(live_href("bims"), "/a/bims/live");
}

#[test]
fn the_why_page_escapes_what_it_shows() {
    let html = why_html("<b>", Some(&recipe()), &Why::Exited { tail: "Error: <boom>".into() });
    assert!(html.contains("&lt;b&gt; did not open") && html.contains("Error: &lt;boom&gt;") && html.contains("<code>node vite</code>"), "{html}");
}
