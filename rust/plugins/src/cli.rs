//! `bise plugins ...`

use std::path::PathBuf;

use bise_home::style::Style;

use crate::{bridge, report, resolve, state};

pub const USAGE: &str = "usage:
  bise plugins [list] [--workspace DIR] [--json]
  bise plugins on|off ID          (a plugin or part id: docs, mistral:gmail, docs#skill:docs, linear#mcp:linear)
  bise plugins import-mcp NAME [--dry-run] < servers.json   (Claude Code's / Codex's MCP servers as one plugin)
  bise plugins add FOLDER|GIT-URL|--mcp NAME|--import AGENT [--yes]   (shows what it runs first: bise plugins add --help)
  bise plugins marketplace [list|add URL|remove URL|show URL]
  bise plugins login [SERVER]   log in to a remote MCP server in the browser (no SERVER: the list)
  bise plugins logout SERVER    forget its tokens
  bise plugins serve --dir DIR [--workspace DIR] [--parent PID]   (internal: the session bridge)

Roots: bise's built-in plugins (<app root>/plugins), ~/.agents/plugins (or $BEND_PLUGINS_HOME)
and <workspace>/.agents/plugins.
On/off state: ~/.bise/plugins.json. Changes apply at the next session start or /reload.";

fn val(args: &[String], k: &str) -> Option<String> {
    args.iter().position(|a| a == k).and_then(|i| args.get(i + 1)).cloned()
}

/// The workspace: `--workspace`, else `$BEND_WORKDIR`, else the cwd.
pub fn workspace(args: &[String]) -> PathBuf {
    val(args, "--workspace")
        .or_else(|| std::env::var("BEND_WORKDIR").ok().filter(|s| !s.is_empty()))
        .map(PathBuf::from)
        .or_else(|| std::env::current_dir().ok())
        .unwrap_or_else(|| PathBuf::from("."))
}

/// The static listing for a workspace (no server started).
pub fn listing(ws: &std::path::Path) -> String {
    report::text_with(&resolve::resolve(&resolve::Roots::standard(Some(ws))), None, Some(&crate::status::dir()))
}

/// Returns the process exit code.
pub fn main(args: &[String]) -> i32 {
    let sub = args.first().map(String::as_str).unwrap_or("list");
    let sub = if sub.starts_with("--") && sub != "--help" { "list" } else { sub };
    match sub {
        "list" => {
            let res = resolve::resolve(&resolve::Roots::standard(Some(&workspace(args))));
            if args.iter().any(|a| a == "--json") {
                println!("{}", serde_json::to_string_pretty(&report::json(&res)).unwrap_or_default());
            } else {
                print!("{}", report::text_with(&res, None, Some(&crate::status::dir())));
            }
            0
        }
        "on" | "off" => {
            let Some(id) = args.get(1) else {
                eprintln!("{}", USAGE);
                return 2;
            };
            let id = match crate::id::PluginId::parse(id) {
                Ok(id) => id,
                Err(e) => {
                    eprintln!("{}", Style::stderr().fail(&e));
                    return 2;
                }
            };
            let on = sub == "on";
            let path = state::state_path();
            match state::set(&path, &id, on) {
                Ok(changed) => {
                    // a real plugin (or its part) that no root holds: say so
                    let unknown = match id.owner() {
                        crate::id::PluginId::Plugin { name } => {
                            !resolve::resolve(&resolve::Roots::standard(Some(&workspace(args)))).plugins.iter().any(|p| &p.name == name)
                        }
                        _ => false,
                    };
                    let out = Style::stdout();
                    let what = format!("{} {}{}", id, if changed { "turned" } else { "already" }, if on { " on" } else { " off" });
                    println!("{}", out.ok(&what));
                    if unknown {
                        println!("{}", out.ask(&format!("no plugin named {} in the roots right now (bise plugins list)", id.owner())));
                    }
                    println!("{}", out.dim("it applies at the next session start, or /reload in one."));
                    0
                }
                Err(e) => {
                    eprintln!("{}", Style::stderr().fail(&format!("{}: {}", path.display(), e)));
                    1
                }
            }
        }
        "login" | "logout" => crate::login::main(&args[1..], &workspace(args), sub == "logout"),
        "add" => crate::add::main(&args[1..]),
        "marketplace" => crate::marketplace::main(&args[1..]),
        "import-mcp" => {
            let root = resolve::Roots::standard(None).user.unwrap_or_else(|| resolve::home().join(".agents/plugins"));
            crate::import::main(&args[1..], &root)
        }
        "serve" => {
            let Some(dir) = val(args, "--dir") else {
                eprintln!("{}", USAGE);
                return 2;
            };
            let parent = val(args, "--parent").and_then(|p| p.parse().ok());
            let ws = workspace(args);
            let opts = bridge::Opts {
                dir: PathBuf::from(dir),
                parent,
                roots: resolve::Roots::standard(Some(&ws)),
                status_dir: Some(crate::status::dir()),
                secrets_dir: Some(crate::oauth::store_dir()),
                ready_wait: bridge::READY_WAIT,
            };
            match bridge::serve(opts) {
                Ok(()) => 0,
                Err(e) => {
                    eprintln!("plugins serve: {}", e);
                    1
                }
            }
        }
        "help" | "-h" | "--help" => {
            println!("{}", USAGE);
            0
        }
        _ => {
            eprintln!("{}", USAGE);
            2
        }
    }
}
