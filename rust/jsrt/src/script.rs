//! bend-jsrt's script mode, for `bise office run|inspect|check` (plan §2,
//! §9.2; architect m_23769, m_23785):
//!
//! ```text
//! bend-jsrt script  <file.ts> --bundle <office.js> --root <dir>... [--host]
//! bend-jsrt inspect <file>    --bundle <office.js> --root <dir>... [--host]
//! bend-jsrt check   <file>    --bundle <office.js> --root <dir>... [--host]
//! ```
//!
//! - The bundle (`office/dist/office.js`, read from the app root the
//!   harness names) is the module `@bise/office`; the script is an ES
//!   module that may import it and nothing else. `inspect` and `check`
//!   are a script made here.
//! - A 1 GB heap and a 5 minute cap (no 10 s rounds: no replay here).
//! - Two ops only, `run.read` and `run.write`, behind the door
//!   ([`crate::door`]): no net, no env, no subprocess. Relative paths are
//!   this process's folder's.
//! - No timers (architect m_23800): no `setTimeout`, `setImmediate`,
//!   `queueMicrotask`; the script's promises settle in one microtask drain.
//! - stdout is `bise_proto::office::JsrtEv` lines; with `--host`, each
//!   `wrote` waits for the harness's `answer` on stdin (it told the hub).

use std::io::{BufRead, Write};
use std::path::PathBuf;
use std::sync::mpsc;
use std::time::Duration;

use bise_proto::office::{HarnessCmd, JsrtEv};
use deno_core::v8;

use crate::door::{self, Door};

const HEAP_BYTES: usize = 1024 * 1024 * 1024;
const CAP: Duration = Duration::from_secs(5 * 60);
const PRELUDE: &str = include_str!("script_prelude.js");
const OFFICE: &str = "@bise/office";

/// The parsed command line.
#[derive(Debug, PartialEq)]
pub struct Args {
    pub mode: Mode,
    pub file: String,
    pub bundle: PathBuf,
    pub roots: Vec<PathBuf>,
    pub host: bool,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Mode {
    Script,
    Inspect,
    Check,
}

pub fn parse(args: &[String]) -> Result<Args, String> {
    let usage = "usage: bend-jsrt script|inspect|check <file> --bundle <office.js> --root <dir>... [--host]";
    let mode = match args.first().map(String::as_str) {
        Some("script") => Mode::Script,
        Some("inspect") => Mode::Inspect,
        Some("check") => Mode::Check,
        _ => return Err(usage.into()),
    };
    let (mut file, mut bundle, mut roots, mut host) = (None, None, Vec::new(), false);
    let mut it = args[1..].iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--bundle" => bundle = it.next().map(PathBuf::from),
            "--root" => roots.extend(it.next().map(PathBuf::from)),
            "--host" => host = true,
            f if file.is_none() && !f.starts_with("--") => file = Some(f.to_string()),
            _ => return Err(usage.into()),
        }
    }
    match (file, bundle) {
        (Some(file), Some(bundle)) if !roots.is_empty() => Ok(Args { mode, file, bundle, roots, host }),
        _ => Err(usage.into()),
    }
}

/// The script `inspect` and `check` run on `file`.
fn builtin(mode: Mode, file: &str) -> String {
    let what = if mode == Mode::Inspect { "f.inspect()" } else { "f.check()" };
    format!(
        r#"import {{ sheets, slides, docs, run, kindOf }} from "{OFFICE}";
const bytes = await run.read({path});
const kind = kindOf(bytes);
if (!kind) throw new Error({path} + " is not an xlsx, pptx or docx file");
const f = await ({{ xlsx: sheets, pptx: slides, docx: docs }})[kind].open(bytes);
console.log(JSON.stringify({what}));
"#,
        path = json_str(file)
    )
}

fn json_str(s: &str) -> String {
    serde_json::Value::String(s.to_string()).to_string()
}

fn emit(ev: &JsrtEv) {
    let mut out = std::io::stdout().lock();
    let _ = writeln!(out, "{}", ev.to_value());
    let _ = out.flush();
}

/// The script failed: say it and exit 1.
fn fail(message: &str) -> ! {
    emit(&JsrtEv::Error { message: message.to_string() });
    std::process::exit(1);
}

struct State {
    door: Door,
    host: bool,
}

thread_local! {
    static STATE: std::cell::RefCell<Option<State>> = const { std::cell::RefCell::new(None) };
    static BUNDLE: std::cell::RefCell<Option<v8::Global<v8::Module>>> = const { std::cell::RefCell::new(None) };
}

fn with_state<T>(f: impl FnOnce(&State) -> T) -> T {
    STATE.with(|s| f(s.borrow().as_ref().expect("script state set")))
}

/// `run.write`'s end: the file is written; the harness tells the hub and
/// answers with its words.
fn tell_host(path: &str, artifact: bool) -> Result<String, String> {
    emit(&JsrtEv::Wrote { path: path.to_string(), artifact });
    let mut line = String::new();
    std::io::stdin().lock().read_line(&mut line).map_err(|e| format!("run.write: no answer from bise: {e}"))?;
    match HarnessCmd::decode(line.trim()) {
        Ok(HarnessCmd::Answer { ok: true, text }) => Ok(text),
        Ok(HarnessCmd::Answer { ok: false, text }) => Err(format!("run.write: {path} is written, but bise made no version of it: {text}")),
        Ok(HarnessCmd::Unknown { tag, .. }) => Err(format!("run.write: an answer bise does not know ({tag})")),
        Err(e) => Err(format!("run.write: a bad answer from bise ({e})")),
    }
}

fn op_read(path: &str) -> Result<Vec<u8>, String> {
    let real = with_state(|s| s.door.read(path))?;
    std::fs::read(&real).map_err(|e| format!("run.read: {path}: {e}"))
}

fn op_write(path: &str, bytes: &[u8], artifact: bool) -> Result<String, String> {
    let (target, host) = with_state(|s| (s.door.write(path, bytes.len() as u64), s.host));
    let target = target?;
    door::write_whole(&target, bytes)?;
    if host {
        tell_host(&target.to_string_lossy(), artifact)
    } else {
        Ok(String::new())
    }
}

fn arg_string(scope: &mut v8::PinScope, v: v8::Local<v8::Value>) -> String {
    v.to_string(scope).map(|s| s.to_rust_string_lossy(&**scope)).unwrap_or_default()
}

fn throw(scope: &mut v8::PinScope, message: &str) {
    let m = v8::String::new(scope, message).unwrap();
    let e = v8::Exception::error(scope, m);
    scope.throw_exception(e);
}

unsafe extern "C" fn native(info: *const v8::FunctionCallbackInfo) {
    let info = unsafe { &*info };
    let scope = std::pin::pin!(unsafe { v8::CallbackScope::new(info) });
    let mut scope = scope.init();
    let args = v8::FunctionCallbackArguments::from_function_callback_info(info);
    let name = arg_string(&mut scope, args.data());
    let mut rv = v8::ReturnValue::from_function_callback_info(info);
    match name.as_str() {
        "__office_log" => {
            let line = arg_string(&mut scope, args.get(0));
            emit(&JsrtEv::Log { line });
        }
        "__office_read" => {
            let path = arg_string(&mut scope, args.get(0));
            match op_read(&path) {
                Ok(bytes) => {
                    let len = bytes.len();
                    let store = v8::ArrayBuffer::new_backing_store_from_vec(bytes).make_shared();
                    let ab = v8::ArrayBuffer::with_backing_store(&scope, &store);
                    if let Some(a) = v8::Uint8Array::new(&scope, ab, 0, len) {
                        rv.set(a.into());
                    }
                }
                Err(e) => throw(&mut scope, &e),
            }
        }
        "__office_write" => {
            let path = arg_string(&mut scope, args.get(0));
            let Ok(view) = v8::Local::<v8::Uint8Array>::try_from(args.get(1)) else {
                return throw(&mut scope, "run.write(path, bytes): bytes must be a Uint8Array");
            };
            let mut bytes = vec![0u8; view.byte_length()];
            view.copy_contents(&mut bytes);
            let artifact = args.get(2).is_true();
            match op_write(&path, &bytes, artifact) {
                Ok(text) => {
                    if let Some(s) = v8::String::new(&scope, &text) {
                        rv.set(s.into());
                    }
                }
                Err(e) => throw(&mut scope, &e),
            }
        }
        _ => {}
    }
}

fn set_native(scope: &mut v8::PinScope, context: &v8::Local<v8::Context>, name: &str) {
    let key = v8::String::new(scope, name).unwrap();
    let builder: v8::FunctionBuilder<v8::Function> = v8::FunctionBuilder::new_raw(native).data(key.into());
    let f = builder.build(scope).unwrap();
    let _ = context.global(scope).set(scope, key.into(), f.into());
}

fn resolve<'s>(
    context: v8::Local<'s, v8::Context>,
    specifier: v8::Local<'s, v8::String>,
    _attributes: v8::Local<'s, v8::FixedArray>,
    _referrer: v8::Local<'s, v8::Module>,
) -> Option<v8::Local<'s, v8::Module>> {
    v8::callback_scope!(unsafe scope, context);
    let spec = specifier.to_rust_string_lossy(scope);
    if spec == OFFICE {
        return BUNDLE.with(|b| b.borrow().as_ref().map(|g| v8::Local::new(scope, g)));
    }
    let m = v8::String::new(scope, &format!("a script may only import \"{OFFICE}\", not \"{spec}\"")).unwrap();
    let e = v8::Exception::error(scope, m);
    scope.throw_exception(e);
    None
}

fn compile_module<'s>(scope: &mut v8::PinScope<'s, '_>, name: &str, code: &str) -> Result<v8::Local<'s, v8::Module>, String> {
    let code = v8::String::new(scope, code).ok_or("the source is too large")?;
    let res = v8::String::new(scope, name).unwrap();
    let origin = v8::ScriptOrigin::new(scope, res.into(), 0, 0, false, 0, None, false, false, true, None);
    let mut source = v8::script_compiler::Source::new(code, Some(&origin));
    v8::script_compiler::compile_module(scope, &mut source).ok_or_else(|| format!("{name} does not compile"))
}

/// TypeScript (or JS) -> an ES module's JS.
fn transpile_module(code: &str) -> Result<String, String> {
    use deno_ast::{EmitOptions, MediaType, ModuleSpecifier, ParseParams, TranspileModuleOptions, TranspileOptions};
    let parsed = deno_ast::parse_module(ParseParams {
        specifier: ModuleSpecifier::parse("file:///script.ts").map_err(|e| e.to_string())?,
        text: code.to_string().into(),
        media_type: MediaType::TypeScript,
        capture_tokens: false,
        maybe_syntax: None,
        scope_analysis: false,
    })
    .map_err(|e| e.to_string())?;
    parsed
        .transpile(&TranspileOptions::default(), &TranspileModuleOptions::default(), &EmitOptions::default())
        .map(|r| r.into_source().text)
        .map_err(|e| e.to_string())
}

/// The message of the exception a try-catch scope holds, or `fallback`;
/// past the cap, the cap's words.
macro_rules! caught {
    ($tc:expr, $fallback:expr) => {{
        if $tc.is_execution_terminating() {
            format!("the script ran past the {} minute cap", CAP.as_secs() / 60)
        } else {
            match $tc.exception() {
                Some(e) => exception_text($tc, e),
                None => $fallback.to_string(),
            }
        }
    }};
}

fn exception_text(scope: &mut v8::PinScope, e: v8::Local<v8::Value>) -> String {
    // an Error's stack names the line; anything else, its string
    if let Ok(obj) = v8::Local::<v8::Object>::try_from(e) {
        let key = v8::String::new(scope, "stack").unwrap();
        if let Some(stack) = obj.get(scope, key.into()).filter(|s| s.is_string()) {
            return arg_string(scope, stack);
        }
    }
    arg_string(scope, e)
}

pub fn main(args: &[String]) -> ! {
    let a = parse(args).unwrap_or_else(|e| fail(&e));
    let base = std::env::current_dir().unwrap_or_else(|e| fail(&format!("no current folder: {e}")));
    let door = Door::new(&a.roots, &base).unwrap_or_else(|e| fail(&e));
    let bundle = std::fs::read_to_string(&a.bundle)
        .unwrap_or_else(|e| fail(&format!("the office bundle {} can't be read: {e}", a.bundle.display())));
    let source = match a.mode {
        Mode::Script => std::fs::read_to_string(&a.file).unwrap_or_else(|e| fail(&format!("{}: {e}", a.file))),
        m => builtin(m, &a.file),
    };
    let js = transpile_module(&source).unwrap_or_else(|e| fail(&format!("SyntaxError: {e}")));
    STATE.with(|s| *s.borrow_mut() = Some(State { door, host: a.host }));
    run(&bundle, &js, &a.file);
}

fn run(bundle: &str, js: &str, name: &str) -> ! {
    crate::init_v8();
    let params = v8::CreateParams::default().heap_limits(0, HEAP_BYTES);
    let mut isolate = v8::Isolate::new(params);
    let handle = isolate.thread_safe_handle();
    let (stop, stopped) = mpsc::channel::<()>();
    std::thread::spawn(move || {
        if stopped.recv_timeout(CAP).is_err() {
            handle.terminate_execution();
        }
    });
    v8::scope!(let hs, &mut isolate);
    let context = v8::Context::new(hs, Default::default());
    let scope = &mut v8::ContextScope::new(hs, context);
    v8::tc_scope!(let tc, scope);
    for n in ["__office_log", "__office_read", "__office_write"] {
        set_native(tc, &context, n);
    }

    // the prelude: console, the host
    let code = v8::String::new(tc, PRELUDE).unwrap();
    let ran = v8::Script::compile(tc, code, None).and_then(|s| s.run(tc));
    if ran.is_none() {
        let m = caught!(tc, "the prelude failed");
        fail(&m);
    }

    // the bundle, then the script that imports it
    let office = compile_module(tc, OFFICE, bundle).unwrap_or_else(|e| {
        let m = caught!(tc, &e);
        fail(&m)
    });
    let global = v8::Global::new(tc, office);
    BUNDLE.with(|b| *b.borrow_mut() = Some(global));
    let module = compile_module(tc, name, js).unwrap_or_else(|e| {
        let m = caught!(tc, &e);
        fail(&m)
    });
    if module.instantiate_module(tc, resolve).is_none() {
        let m = caught!(tc, "the script's imports failed");
        fail(&m);
    }
    let Some(done) = module.evaluate(tc) else {
        let m = caught!(tc, "the script failed");
        fail(&m);
    };
    let promise = v8::Local::<v8::Promise>::try_from(done).ok();

    // nothing but microtasks can settle it: one drain
    tc.perform_microtask_checkpoint();
    if tc.has_caught() || tc.is_execution_terminating() {
        let m = caught!(tc, "the script failed");
        fail(&m);
    }
    if let Some(p) = promise.filter(|p| p.state() == v8::PromiseState::Rejected) {
        let e = p.result(tc);
        let m = exception_text(tc, e);
        fail(&m);
    }
    let _ = stop.send(());
    match promise.map(|p| p.state()) {
        Some(v8::PromiseState::Pending) => fail("the script waits for something that never comes (a promise nothing settles: script mode has no timers)"),
        _ => {
            emit(&JsrtEv::Done);
            std::process::exit(0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn argv(xs: &[&str]) -> Vec<String> {
        xs.iter().map(|x| x.to_string()).collect()
    }

    #[test]
    fn parses_the_three_modes() {
        let a = parse(&argv(&["script", "s.ts", "--bundle", "/b/office.js", "--root", "/w", "--root", "/t", "--host"])).unwrap();
        assert_eq!(a, Args { mode: Mode::Script, file: "s.ts".into(), bundle: "/b/office.js".into(), roots: vec!["/w".into(), "/t".into()], host: true });
        assert_eq!(parse(&argv(&["check", "q3.pptx", "--bundle", "b", "--root", "/w"])).unwrap().mode, Mode::Check);
        for bad in [&["run", "s.ts"][..], &["script", "s.ts", "--root", "/w"], &["script", "s.ts", "--bundle", "b"], &["inspect", "--bundle", "b", "--root", "/w"]] {
            assert!(parse(&argv(bad)).is_err(), "{bad:?}");
        }
    }

    #[test]
    fn the_builtin_scripts_quote_the_path() {
        let s = builtin(Mode::Check, "a \"b\".xlsx");
        assert!(s.contains(r#"run.read("a \"b\".xlsx")"#) && s.contains("f.check()"), "{s}");
        assert!(builtin(Mode::Inspect, "x.docx").contains("f.inspect()"));
    }
}
