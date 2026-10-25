//! `signals` on fixture projects: a DSN name, a host in a remote, a file
//! name, the families ranked by projects, the file cap, and a `.env`
//! next to its example never opened (the ports record every read).

use super::*;
use std::cell::RefCell;
use std::path::PathBuf;

fn project(name: &str, hosts: &[&str], files: &[&str], env: &[&str]) -> Inputs {
    Inputs {
        project: name.into(),
        hosts: hosts.iter().map(|s| s.to_string()).collect(),
        files: files.iter().map(|s| s.to_string()).collect(),
        env_keys: env.iter().map(|s| s.to_string()).collect(),
        capped: false,
    }
}

#[test]
fn a_dsn_name_a_remote_host_and_a_file_name_are_evidence() {
    let p = project("harness", &["github.com"], &["src/main.rs", "web/sentry.client.config.ts"], &["NEXT_PUBLIC_SENTRY_DSN", "STRIPE_SECRET_KEY"]);
    let e = reasons(&[p]);
    let by = |f: &str| e.iter().find(|x| x.family == f).cloned();
    assert_eq!(by("github").unwrap().seen, Seen::Host("github.com".into()));
    assert_eq!(by("sentry").unwrap().seen, Seen::File("sentry.client.config.ts".into()));
    assert_eq!(by("stripe").unwrap().seen, Seen::Env("STRIPE_SECRET_KEY".into()));
    assert!(by("slack").is_none());
}

#[test]
fn a_word_inside_a_key_counts_only_between_underscores() {
    let e = reasons(&[project("a", &[], &[], &["NONLINEAR_SOLVER", "SLACKER", "MY_SLACK_HOOK"])]);
    let families: Vec<&str> = e.iter().map(|x| x.family).collect();
    assert_eq!(families, vec!["slack"]);
}

#[test]
fn more_projects_first_and_a_project_counts_once() {
    let a = project("a", &["github.com"], &[".github/workflows/ci.yml"], &["SENTRY_DSN", "SENTRY_AUTH_TOKEN"]);
    let b = project("b", &[], &[".sentryclirc"], &[]);
    let c = project("c", &[], &[], &["SENTRY_DSN"]);
    let e = reasons(&[a, b, c]);
    assert_eq!(e[0].family, "sentry");
    assert_eq!(e[0].places, vec!["a", "b", "c"]);
    assert_eq!(e[0].seen, Seen::Env("SENTRY_DSN".into()), "the first project's name");
    assert_eq!(e[1].family, "github");
    assert_eq!(e[1].places, vec!["a"]);
}

#[test]
fn a_folder_says_the_folder() {
    let e = reasons(&[project("a", &[], &[".github/workflows/ci.yml"], &[])]);
    assert_eq!(e[0].seen, Seen::File(".github/".into()));
}

#[test]
fn a_connector_name_finds_its_family() {
    assert_eq!(family("sentry"), Some("sentry"));
    assert_eq!(family("datadog_eu"), Some("datadog"));
    assert_eq!(family("gmail"), None);
    assert_eq!(family("githubx"), None);
}

#[test]
fn hosts_of_remote_urls() {
    assert_eq!(host_of("git@github.com:a/b.git").as_deref(), Some("github.com"));
    assert_eq!(host_of("https://user:pw@GitLab.com/a/b").as_deref(), Some("gitlab.com"));
    assert_eq!(host_of("ssh://git@github.com/a/b").as_deref(), Some("github.com"));
    assert_eq!(host_of("/local/path"), None);
}

#[test]
fn env_keys_drop_the_values() {
    let k = env_keys("# c\nSENTRY_DSN=https://abc@o1.ingest.sentry.io/2\nexport STRIPE_KEY=sk_live_x\n  =nope\n1BAD=x\nnot a line\n");
    assert_eq!(k, vec!["SENTRY_DSN", "STRIPE_KEY"]);
}

/// A fixture repo: its remote, its tracked files (a `.env` among them, as
/// a careless repo has), the texts of its files; every read recorded.
struct Repo {
    remotes: &'static str,
    files: Vec<String>,
    reads: RefCell<Vec<PathBuf>>,
}

impl Repo {
    fn gather(&self) -> Inputs {
        let git = |args: &[&str]| match args {
            ["remote", "-v"] => Some(self.remotes.to_string()),
            ["ls-files", "-z"] => Some(self.files.join("\0")),
            _ => None,
        };
        let read = |p: &Path| {
            self.reads.borrow_mut().push(p.to_path_buf());
            let name = p.file_name()?.to_str()?;
            Some(match name {
                ".env" => "SLACK_BOT_TOKEN=xoxb-secret\n".to_string(),
                _ => "SENTRY_DSN=\nLINEAR_API_KEY=lin_example\n".to_string(),
            })
        };
        gather_with(Path::new("/repo"), "harness", &Ports { git: &git, read: &read })
    }
}

#[test]
fn gather_reads_remotes_names_and_example_keys_never_the_env() {
    let repo = Repo {
        remotes: "origin\tgit@github.com:acme/harness.git (fetch)\norigin\tgit@github.com:acme/harness.git (push)\n",
        files: vec![".env".into(), ".env.example".into(), "src/lib.rs".into(), ".sentryclirc".into()],
        reads: RefCell::new(Vec::new()),
    };
    let i = repo.gather();
    assert_eq!(i.hosts, vec!["github.com"]);
    assert_eq!(i.env_keys, vec!["SENTRY_DSN", "LINEAR_API_KEY"]);
    assert_eq!(*repo.reads.borrow(), vec![PathBuf::from("/repo/.env.example")], "only the example is opened");
    assert!(!i.env_keys.iter().any(|k| k.contains("SLACK")));
    assert!(!i.capped);
}

#[test]
fn a_huge_repo_matches_its_first_files_and_says_so() {
    let mut files: Vec<String> = (0..FILE_CAP).map(|n| format!("f{n}")).collect();
    files.push(".sentryclirc".into());
    let repo = Repo { remotes: "", files, reads: RefCell::new(Vec::new()) };
    let i = repo.gather();
    assert!(i.capped);
    assert_eq!(i.files.len(), FILE_CAP);
    assert!(reasons(&[i]).is_empty());
}

#[test]
fn env_examples_are_the_named_ones() {
    for f in [".env.example", "api/.env.sample", "env.example"] {
        assert!(is_env_example(f), "{f}");
    }
    for f in [".env", ".env.local", "api/.env.production", "example.txt"] {
        assert!(!is_env_example(f), "{f}");
    }
}
