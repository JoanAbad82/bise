//! His attached files read back from an answer's text (R41, architect
//! m_14049): [`split`], the fold's `Ctx.attached`. The text is the one
//! render's (`bise_proto::parts::render`: a `files` list becomes his parts
//! in `crate::parts_in::of_files`, architect m_21764 A): his words, his
//! images' markers, then the list after `parts::FILES_HEADER`. Pure.

use bise_proto::parts::FILES_HEADER;
use bise_proto::thread::Attached;

/// The answer's words, images and other files (a
/// [`bise_proto::thread::Attached`], the fold's `Ctx.attached`):
/// `split(render(of_files(t, files)))` is (t, its images, its other
/// files), and a text with no marker and no list is its words.
/// Why it exists (R41, architect m_14049): sb-core's `answered` line carries
/// the rendered answer (his words with the markers and the list), so the
/// thread fold reads the words and the files back here, through the one
/// marker parser (`bend_images::markers`) and the one [`FILES_HEADER`]. The
/// cleaner fix is a typed answered record from sb-core (words and files
/// apart): on the list if that line is ever touched. An image is its name
/// and his source path only, never the store's b64 path.
pub fn split(text: &str) -> Attached {
    // the list: the render's last part, `FILES_HEADER` then one path per line
    let (head, files) = match text.rfind(FILES_HEADER).filter(|&i| i == 0 || text[..i].ends_with("\n\n")) {
        Some(i) => {
            let list: Vec<String> = text[i + FILES_HEADER.len()..].lines().map(str::trim).filter(|l| !l.is_empty()).map(str::to_string).collect();
            if list.iter().all(|p| p.starts_with('/')) { (&text[..i], list) } else { (text, Vec::new()) }
        }
        None => (text, Vec::new()),
    };
    let ms = bend_images::markers(head);
    let mut words = String::with_capacity(head.len());
    let mut last = 0usize;
    for m in &ms {
        words.push_str(&head[last..m.start]);
        last = m.end;
    }
    words.push_str(&head[last..]);
    let images = ms.into_iter().map(|m| bise_proto::thread::ImageRef { name: m.name, path: m.path }).collect();
    let words = if words.trim().is_empty() { String::new() } else { words.trim_end().to_string() };
    Attached { words, images, files }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parts_in::{of_files, Look, Stored};
    use bise_proto::parts::render;

    fn look(p: &str) -> Look {
        match p {
            "/Users/ana/Desktop/shot.png" | "/w/a.png" => Look::Image(Stored { b64: "/store/ab.b64".into(), mime: "image/png".into() }),
            "/w/notes.md" | "/w/q3.pdf" => Look::File,
            _ => Look::Skip,
        }
    }

    fn rendered(text: &str, files: &[&str]) -> String {
        let files: Vec<String> = files.iter().map(|f| f.to_string()).collect();
        render(&of_files(text, &files, &mut look))
    }

    /// Law (architect m_14049): split reads the render back.
    #[test]
    fn split_reads_render_back() {
        use bise_proto::thread::ImageRef;
        let img = ImageRef { name: "shot.png".into(), path: "/Users/ana/Desktop/shot.png".into() };
        for words in ["the balance on the cart page", "two lines\nof words", ""] {
            let s = split(&rendered(words, &["/Users/ana/Desktop/shot.png", "/w/notes.md"]));
            assert_eq!(s, Attached { words: words.into(), images: vec![img.clone()], files: vec!["/w/notes.md".into()] }, "{words:?}");
            let s = split(&rendered(words, &["/Users/ana/Desktop/shot.png"]));
            assert_eq!(s, Attached { words: words.into(), images: vec![img.clone()], files: vec![] }, "{words:?}");
            assert!(!s.words.contains("<image") && !s.words.contains("b64"));
        }
        // no files: the words unchanged
        for t in ["v2", "see [files he attached:] below", "a\n\nb"] {
            assert_eq!(split(&rendered(t, &[])), Attached::plain(t), "{t:?}");
        }
    }

    /// architect m_21764 A: a files list as parts renders byte for byte
    /// what the old `attached::render` wrote (these texts are its tests').
    #[test]
    fn a_files_list_renders_as_it_always_did() {
        let marker = |name: &str, path: &str| format!("<image name=\"{name}\" path=\"{path}\" mime=\"image/png\" b64=\"/store/ab.b64\">");
        let a = marker("a.png", "/w/a.png");
        assert_eq!(rendered("summarize these", &["/w/notes.md", "/w/a.png", "/w/q3.pdf"]), format!("summarize these\n\n{a}\n\n[files he attached:]\n/w/notes.md\n/w/q3.pdf"));
        // a relative, a missing or a repeated path is left out
        assert_eq!(rendered("look", &["notes.md", "/w/gone.txt", "/w/notes.md", "/w/notes.md", " "]), "look\n\n[files he attached:]\n/w/notes.md");
        assert_eq!(rendered("look", &["/w/gone.txt"]), "look");
        assert_eq!(rendered("look", &[]), "look");
        // two images: one per line; files without words are the whole text
        let shot = marker("shot.png", "/Users/ana/Desktop/shot.png");
        assert_eq!(rendered("x", &["/w/a.png", "/Users/ana/Desktop/shot.png"]), format!("x\n\n{a}\n{shot}"));
        assert_eq!(rendered("  ", &["/w/a.png"]), a);
        // the same image twice: one look, one marker; a relative path never looked at
        let mut asked = Vec::new();
        let files = ["/w/a.png".to_string(), " /w/a.png".to_string(), "rel".to_string()];
        let twice = render(&of_files("", &files, &mut |p| {
            asked.push(p.to_string());
            look(p)
        }));
        assert_eq!((twice, asked), (a, vec!["/w/a.png".to_string()]));
    }
}
