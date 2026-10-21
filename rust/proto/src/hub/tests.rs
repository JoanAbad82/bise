//! HubEv / HubCmd: unknown tags kept, bad fields refused, a small event (moved out of hub.rs).

use super::*;

#[test]
fn unknown_tags_are_kept_and_bad_fields_are_errors() {
    let e = HubEv::decode(r#"{"ev":"weather","project":"p","to":"q"}"#).unwrap();
    assert!(matches!(&e, HubEv::Unknown { tag, .. } if tag == "weather"));
    assert_eq!(e.encode(), r#"{"ev":"weather","project":"p","to":"q"}"#);
    assert!(HubEv::decode(r#"{"ev":"typing","project":"p"}"#).is_err(), "a known tag without its fields");
    assert!(HubEv::decode(r#"{"project":"p"}"#).is_err());
    let c = HubCmd::decode(r#"{"cmd":"approve","project":"p","card":3}"#).unwrap();
    assert!(matches!(c, HubCmd::Unknown { .. }), "approve is answer's path: not a command");
    // unknown fields are ignored
    let t = HubEv::decode(r#"{"ev":"typing","project":"p","agent":"a","text":"x","new":1}"#).unwrap();
    assert_eq!(t, HubEv::Typing { project: "p".into(), agent: "a".into(), text: "x".into() });
    assert_eq!(t.tag(), "typing");
}

/// hub-skew (architect m_11314): a hub older than `cmds` says none, a
/// newer one lists its tags.
#[test]
fn a_welcome_without_cmds_is_an_older_hub() {
    let old = HubEv::decode(r#"{"ev":"welcome","project":"p","proto":1,"workspace":"/w","name":"w"}"#).unwrap();
    assert!(matches!(&old, HubEv::Welcome { cmds, .. } if cmds.is_empty()));
    let new = HubEv::decode(r#"{"ev":"welcome","project":"p","proto":1,"workspace":"/w","name":"w","cmds":["subscribe","slash"]}"#).unwrap();
    assert!(matches!(&new, HubEv::Welcome { cmds, .. } if cmds == &["subscribe", "slash"]));
    // an older client's hello is no command any more: Unknown, refused
    let hello = HubCmd::decode(r#"{"cmd":"hello","proto":1,"typed_only":true}"#).unwrap();
    assert!(matches!(&hello, HubCmd::Unknown { tag, .. } if tag == "hello"));
}

