//! The key step's shared part (architect m_28532): the TUI's first run and
//! `/provider` (onboarding.rs) and the desktop's `provider_use`
//! (ambient/core/setup.rs) both call it, one path:
//!
//! - which model a picked provider runs: bise_catalog's `roles::pick_for`;
//! - its live check: one tiny real call ([`crate::keycheck`]), with the
//!   key pasted, the key found (env, auth.json, an old .env) or the
//!   sign-in's token (the ChatGPT plan);
//! - what a check that works saves: the pasted key (`login`'s own code,
//!   auth.json 0600), then main's model when `roles::model_to_write` says
//!   so ([`save_model`]); a failed key is never written;
//! - what it says: main's model and what runs the small jobs and auto's
//!   checker ([`works_lines`], the catalog's words).
//!
//! [`use_provider`] is the whole of it for the desktop, blocking (the core
//! runs it on its own thread); the TUI runs its own screens around the
//! same pieces.

use crate::keycheck::{Call, Fail, Why};
use bise_catalog::auth::{EnvFile, From, Keys, Store};
use bise_proto::app_rows::{CheckWhy, KeyFrom};
use bise_proto::words::settings;

/// An environment lookup (the real one, or a map in the tests).
pub(crate) type Env<'a> = &'a dyn Fn(&str) -> Option<String>;

/// Write `model` as main's model in config.toml (`[roles] main`, BISE-298;
/// the rest of the file kept, the old `model` key dropped).
pub(crate) fn save_model(home: &bise_home::Home, model: &str) -> std::io::Result<()> {
    let file = home.config_file();
    let text = std::fs::read_to_string(&file).unwrap_or_default();
    if let Some(dir) = file.parent() {
        std::fs::create_dir_all(dir)?;
    }
    std::fs::write(&file, bise_catalog::roles::with_role(&text, bise_catalog::roles::MAIN, model))
}

/// A pasted key, cleaned: trimmed, quotes off; None when it can't be one
/// (empty, spaces or control characters inside): the catalog's rule
/// (`auth_cli::clean_key`), the one the TUI's key step, `/setup`'s key
/// card and the desktop's `provider_use` all apply.
pub(crate) fn clean_key(s: &str) -> Option<String> {
    bise_catalog::auth_cli::clean_key(s).ok()
}

/// A model's id without its provider.
pub(crate) fn short_model(m: &str) -> String {
    bise_catalog::split_name(m).map_or(m.to_string(), |(_, id)| id.to_string())
}

/// The word on the roles one key runs (one key, every role):
/// `small jobs and auto's checker use claude-haiku-4-5.`; Jev:
/// `small jobs use gemini-3.8-flash. auto's checker: Jev, by OpenRouter.`
/// `checker`: auto's checker model as the screen resolved it. None: no
/// small jobs model.
pub(crate) fn helpers_line(setup: &bise_catalog::Setup, checker: &str) -> Option<String> {
    let small = setup.small_model.clone();
    if small.is_empty() {
        return None;
    }
    let short = short_model(&small);
    Some(match bise_catalog::roles::jev_of(checker) {
        Some((via, _)) => {
            let by = setup.catalog.provider(via).map_or(via.to_string(), |p| p.name.clone());
            settings::first_small_jev(&short, by)
        }
        None if checker == small => settings::first_small_checker(&short),
        None if checker == bise_catalog::roles::CHECKER_OFF || checker.is_empty() => settings::first_small(&short),
        None => settings::first_small_and(&short, short_model(checker)),
    })
}

/// Auto's checker in `setup`: its own pick, else the rule of the keys
/// ready (`roles::checker_default`, the TUI's `/models` rule).
pub(crate) fn checker_of(setup: &bise_catalog::Setup, keys: &Keys) -> String {
    let (m, src) = setup.role_model(bise_catalog::roles::CLASSIFY);
    if src != bise_catalog::roles::Source::Auto {
        return m;
    }
    let ready = |pid: &str| setup.catalog.provider(pid).is_some_and(|p| keys.ready(p));
    bise_catalog::roles::checker_default(&setup.small_model, &ready)
}

/// "it works"'s lines: main's model, then what runs the small jobs and
/// auto's checker.
pub(crate) fn works_lines(setup: &bise_catalog::Setup, checker: &str) -> Vec<String> {
    let mut v = Vec::new();
    if !setup.model.is_empty() {
        v.push(settings::first_main_uses(&setup.model));
    }
    v.extend(helpers_line(setup, checker));
    v
}

/// A check's failure on the wire: its kind and the words that go with it
/// (the reason for unreachable, what to set for config).
pub(crate) fn why_of(f: &Fail) -> (CheckWhy, String) {
    match &f.why {
        Why::WrongKey => (CheckWhy::WrongKey, f.said.clone()),
        Why::NoCredit => (CheckWhy::NoCredit, f.said.clone()),
        Why::Model => (CheckWhy::Model, f.said.clone()),
        Why::NoAccess => (CheckWhy::NoAccess, f.said.clone()),
        Why::Unreachable(e) => (CheckWhy::Unreachable, if f.said.is_empty() { e.clone() } else { format!("{e}: {}", f.said) }),
        Why::NoUrl(e) | Why::Configuration(e) => (CheckWhy::Config, e.clone()),
    }
}

/// Where a found key is, typed for the wire (never the key).
pub(crate) fn key_from(from: &From, home: Option<&std::path::Path>) -> KeyFrom {
    match from {
        From::Env(n) => KeyFrom::Env { var: n.clone() },
        From::AuthFile => KeyFrom::AuthFile,
        From::EnvFile(p, _) => KeyFrom::EnvFile { path: bise_catalog::auth::tilde(p, home) },
    }
}

/// The check's call for `model` (a chat model, "provider/id") with `key`.
pub(crate) fn call_of(setup: &bise_catalog::Setup, provider: &str, model: &str, key: &str) -> Call {
    let r = setup.catalog.resolve(model);
    Call {
        provider: provider.to_string(),
        api: r.api,
        base_url: r.base_url,
        model: r.id,
        key: key.to_string(),
        key_command: String::new(),
        headers: r.caps.headers.into_iter().collect(),
        headers_env: r.caps.headers_env,
        voice: false,
    }
}

/// What a `provider_use` came to.
#[derive(Clone, Debug, PartialEq)]
pub struct Used {
    pub id: String,
    pub name: String,
    pub model: String,
    pub pasted: bool,
    pub res: Result<Works, Failed>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Works {
    /// what the model answered (its first words; "" when none)
    pub answer: String,
    /// main's model now (written, or kept)
    pub main: String,
    pub lines: Vec<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Failed {
    pub why: CheckWhy,
    pub said: String,
    /// the page that fixes it: the keys page, the billing page
    pub url: Option<String>,
}

/// The I/O a `provider_use` needs besides files: the live check and a
/// sign-in's token (fakes in the tests).
#[derive(Clone, Copy)]
pub(crate) struct Ports {
    pub check: fn(&Call, Env) -> Result<String, Fail>,
    pub token: fn(&bise_catalog::auth_cli::Paths) -> Result<String, String>,
}

/// The real ones: the network call, the ChatGPT plan's token.
pub(crate) fn live_ports() -> Ports {
    Ports {
        check: crate::keycheck::check_answer,
        token: |p| bise_catalog::chatgpt::access_token(p).map_err(|e| e.to_string()),
    }
}

/// The model `id` would be checked with, as the core says it before the
/// check ("" when it has none).
pub(crate) fn model_for(home: &bise_home::Home, env: Env, id: &str) -> (String, String) {
    let setup = crate::onboarding::setup_of(env, home);
    let name = setup.catalog.provider(id).map_or(id.to_string(), |p| p.name.clone());
    (name, bise_catalog::roles::pick_for(&setup.catalog, id, &setup.model).unwrap_or_default())
}

/// Use provider `id`: check it live with `key` (None: the key found for
/// it, or its sign-in's token), then save the key and, when
/// `roles::model_to_write` says so, main's model. Blocking.
pub(crate) fn use_provider(home: &bise_home::Home, env: Env, id: &str, key: Option<String>, ports: &Ports) -> Used {
    let setup = crate::onboarding::setup_of(env, home);
    let paths = bise_catalog::auth_cli::Paths::of(home);
    let pasted = key.is_some();
    let fail = |name: &str, model: &str, why: CheckWhy, said: String, url: Option<String>| Used {
        id: id.to_string(),
        name: name.to_string(),
        model: model.to_string(),
        pasted,
        res: Err(Failed { why, said, url }),
    };
    let Some(p) = setup.catalog.provider(id).filter(|p| p.chats() && p.needs.is_empty()) else {
        return fail(id, "", CheckWhy::Config, settings::first_unknown_provider(id), None);
    };
    let keys_url = (!p.keys_url.is_empty()).then(|| p.keys_url.clone());
    let Some(model) = bise_catalog::roles::pick_for(&setup.catalog, id, &setup.model) else {
        return fail(&p.name, "", CheckWhy::Model, String::new(), keys_url);
    };
    let the_key = match key {
        Some(k) => match crate::firstkey::clean_key(&k) {
            Some(k) => k,
            None => return fail(&p.name, &model, CheckWhy::NoKey, String::new(), keys_url),
        },
        None if p.signs_in() => match (ports.token)(&paths) {
            Ok(t) => t,
            Err(e) => return fail(&p.name, &model, CheckWhy::WrongKey, e, None),
        },
        None => {
            let store = Store::read(&paths.auth_file).unwrap_or_default();
            let files = EnvFile::read_all(&paths.env_files);
            match (Keys { env, store: &store, files: &files }).find(&p.id, &p.key_env) {
                Some(f) => f.key,
                None => return fail(&p.name, &model, CheckWhy::NoKey, String::new(), keys_url),
            }
        }
    };
    let call = call_of(&setup, id, &model, &the_key);
    let test_url = env("BEND_PROVIDER_URL");
    let answer = match crate::keycheck::no_url(&call, &setup.catalog, test_url.as_deref()) {
        Some(f) => Err(f),
        None => (ports.check)(&call, env),
    };
    let answer = match answer {
        Ok(a) => a,
        Err(f) => {
            let (why, said) = why_of(&f);
            let url = match why {
                CheckWhy::NoCredit if !p.billing_url.is_empty() => Some(p.billing_url.clone()),
                CheckWhy::NoCredit | CheckWhy::WrongKey => keys_url,
                _ => None,
            };
            return fail(&p.name, &model, why, said, url);
        }
    };
    if pasted {
        if let Err(e) = bise_catalog::auth_cli::login(&paths, p, &the_key, env) {
            return fail(&p.name, &model, CheckWhy::Config, e, None);
        }
    }
    // main's model: written when it has none or can't run (never over one that runs)
    let store = Store::read(&paths.auth_file).unwrap_or_default();
    let files = EnvFile::read_all(&paths.env_files);
    let keys = Keys { env, store: &store, files: &files };
    let main_p = setup.catalog.resolve(&setup.model).provider;
    let main_runs = setup.catalog.provider(&main_p).is_some_and(|mp| keys.ready(mp));
    if let Some(m) = bise_catalog::roles::model_to_write(&setup.model, main_runs, &model) {
        if let Err(e) = save_model(home, &m) {
            return fail(&p.name, &model, CheckWhy::Config, settings::first_write_config(e), None);
        }
    }
    let now = crate::onboarding::setup_of(env, home);
    let checker = checker_of(&now, &keys);
    Used {
        id: id.to_string(),
        name: p.name.clone(),
        model,
        pasted,
        res: Ok(Works { answer, main: now.model.clone(), lines: works_lines(&now, &checker) }),
    }
}
