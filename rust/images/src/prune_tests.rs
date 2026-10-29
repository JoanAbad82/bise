use super::*;

const H1: &str = "0123456789abcdef0123456789abcdef";
const H2: &str = "fedcba9876543210fedcba9876543210";
const SHA: &str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const NOW: u64 = 1_800_000_000_000;

fn e(name: &str, age_ms: u64) -> (String, u64) {
    (name.to_string(), NOW - age_ms)
}

fn set(xs: &[&str]) -> BTreeSet<String> {
    xs.iter().map(|s| s.to_string()).collect()
}

#[test]
fn names_are_classified() {
    assert_eq!(classify(&format!("{H1}.png")), Name::Image(H1.into()));
    assert_eq!(classify(&format!("{H1}.b64")), Name::Image(H1.into()));
    assert_eq!(classify(&format!("{SHA}.webp")), Name::Image(SHA.into()));
    assert_eq!(classify(&format!("tmp-{H1}.png")), Name::Tmp);
    assert_eq!(classify(&format!("{H1}.b64.tmp")), Name::Tmp);
    assert_eq!(classify(&format!("{SHA}.png.123.tmp")), Name::Tmp);
    for foreign in ["notes.txt", "shot.png", &format!("{H1}.txt"), &format!("{}.png", &H1[..31]), ".DS_Store"] {
        assert_eq!(classify(foreign), Name::Foreign, "{foreign}");
    }
}

#[test]
fn a_hash_goes_after_the_setting_and_not_before() {
    let day = DAY_MS;
    for keep in [1u64, 7, 30] {
        let es = [e(&format!("{H1}.png"), keep * day + 1), e(&format!("{H2}.png"), keep * day)];
        assert_eq!(doomed(&es, NOW, keep, &BTreeSet::new()), vec![format!("{H1}.png")], "keep {keep}");
    }
    // the setting changes what is kept: 10 days old goes at 7, stays at 30
    let es = [e(&format!("{H1}.png"), 10 * day)];
    assert_eq!(doomed(&es, NOW, 7, &BTreeSet::new()).len(), 1);
    assert!(doomed(&es, NOW, 30, &BTreeSet::new()).is_empty());
    // 0 counts as one day, never "delete at once"
    let fresh = [e(&format!("{H1}.png"), day / 2)];
    assert!(doomed(&fresh, NOW, 0, &BTreeSet::new()).is_empty());
}

#[test]
fn an_image_and_its_b64_go_together() {
    let old = 40 * DAY_MS;
    // the .b64 was touched (a re-paste): the old image stays with it
    let es = [e(&format!("{H1}.png"), old), e(&format!("{H1}.b64"), DAY_MS)];
    assert!(doomed(&es, NOW, 7, &BTreeSet::new()).is_empty());
    let es = [e(&format!("{H1}.png"), old), e(&format!("{H1}.b64"), old)];
    assert_eq!(doomed(&es, NOW, 7, &BTreeSet::new()), vec![format!("{H1}.png"), format!("{H1}.b64")]);
}

#[test]
fn a_named_hash_stays_whatever_its_age() {
    let old = 400 * DAY_MS;
    let es = [e(&format!("{H1}.png"), old), e(&format!("{H1}.b64"), old), e(&format!("{H2}.jpg"), old)];
    assert_eq!(doomed(&es, NOW, 1, &set(&[H1])), vec![format!("{H2}.jpg")]);
}

#[test]
fn leftovers_go_after_a_day_and_foreign_files_never() {
    let es = [
        e(&format!("tmp-{H1}.png"), DAY_MS + 1),
        e(&format!("{H2}.b64.tmp"), DAY_MS - 1),
        e("notes.txt", 999 * DAY_MS),
        e(".DS_Store", 999 * DAY_MS),
    ];
    assert_eq!(doomed(&es, NOW, 30, &BTreeSet::new()), vec![format!("tmp-{H1}.png")]);
}

/// The law: a hub touches what it names at least every TOUCH_EVERY_MS
/// (late by at most TOUCH_SLACK_MS); with keep_days >= 1 no prune, by any
/// hub, at any time, dooms such an image.
#[test]
fn named_by_a_live_hub_never_goes() {
    const { assert!(TOUCH_EVERY_MS + TOUCH_SLACK_MS < DAY_MS) };
    let last_touch = TOUCH_EVERY_MS + TOUCH_SLACK_MS;
    for keep in 0..=60u64 {
        for age in [0, 1, TOUCH_EVERY_MS, last_touch] {
            let es = [e(&format!("{H1}.png"), age), e(&format!("{H1}.b64"), age)];
            // the pruning hub is another one: its own named set is empty
            assert!(doomed(&es, NOW, keep, &BTreeSet::new()).is_empty(), "keep {keep} age {age}");
        }
    }
}

#[test]
fn texts_name_hashes_in_markers_and_paths() {
    let marker = format!("<image name=\"[Image #1]\" path=\"shot.png\" mime=\"image/png\" b64=\"/h/.bise/images/{H1}.b64\">");
    let text = format!("look {marker} and /Users/me/.bise/images/{SHA}.png, not {H2}.png nor /x/{H2}.txt");
    assert_eq!(named(&text), set(&[H1, SHA]));
    assert!(named("").is_empty());
    assert!(named("/ /. /abc.png").is_empty());
}

fn tmpdir(tag: &str) -> std::path::PathBuf {
    let d = std::env::temp_dir().join(format!("bend-images-prune-{tag}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&d);
    std::fs::create_dir_all(&d).expect("tmp dir");
    d
}

#[test]
fn prune_and_touch_on_disk() {
    let d = tmpdir("disk");
    let now = ms(SystemTime::now());
    let old = at_ms(now - 10 * DAY_MS);
    for n in [format!("{H1}.png"), format!("{H1}.b64"), format!("{H2}.png"), format!("{SHA}.jpg"), "keep.txt".into()] {
        std::fs::write(d.join(&n), "x").expect("write");
        touch_file(&d.join(&n), old);
    }
    std::fs::write(d.join(format!("{H2}.b64")), "x").expect("write");
    // H1 is named by this hub, SHA was touched by another one
    touch(&d, &set(&[SHA]));
    assert_eq!(prune(&d, now, 7, &set(&[H1])).expect("prune"), 0, "H2's .b64 is fresh");
    touch_file(&d.join(format!("{H2}.b64")), old);
    assert_eq!(prune(&d, now, 7, &set(&[H1])).expect("prune"), 2);
    let mut left: Vec<String> =
        std::fs::read_dir(&d).expect("dir").map(|e| e.expect("e").file_name().into_string().expect("utf8")).collect();
    left.sort();
    let mut want = vec![format!("{H1}.b64"), format!("{H1}.png"), format!("{SHA}.jpg"), "keep.txt".to_string()];
    want.sort();
    assert_eq!(left, want);
    assert_eq!(prune(&d.join("none"), now, 7, &BTreeSet::new()).expect("missing store"), 0);
    let _ = std::fs::remove_dir_all(&d);
}
