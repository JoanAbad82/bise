//! bise ambient's Rust core (docs/ambient-app.md §2-§4): `bise
//! ambient-core --workspace <ws>` is the child of the macOS app, one JSON
//! object per line on stdin (the app's commands) and stdout (events for
//! the capsule). It is a client of the workspace's hub like the TUI
//! (`hub.sock`, hello, `input` to main, `/answer` for cards), runs voice
//! mode's pieces (the mic only while fn is held, the voice role's
//! listener, Voxtral TTS on a speaker opened at the first spoken answer)
//! and puts the app's front-window shots in the image store as markers.
//!
//! `bise ambient` launches the app (`scripts/ambient.sh open`, amb-mac's).

mod core;
mod hub;
mod plain;
mod speech;
#[cfg(test)]
mod tests;

pub use self::core::{Cmd, Core, Ports};
pub use self::hub::{Connect, Hub, HubIn};

use std::io::{self, BufRead, Write};
use std::sync::mpsc::{self, RecvTimeoutError};
use std::time::{Duration, Instant};

/// The core's clock: the levels at ~30 Hz.
pub const TICK: Duration = Duration::from_millis(33);
/// Between two attempts to reach a hub that went away.
const RETRY: Duration = Duration::from_millis(500);

/// What the run loop waits on.
pub enum In {
    Line(String),
    Hub(HubIn),
    /// stdin closed: the app is gone
    Eof,
}

/// The real ports: the default mic (opened per talk, never by a test),
/// the voice role's listener, Voxtral TTS, the default output device.
/// Not the voice-processing unit of voice mode: it keeps the mic open
/// for as long as the speaker is, and the capsule promises the mic is on
/// only while fn is held (SPEC §5.8).
fn live_ports(user_kind: fn(&str) -> bool) -> Ports {
    use crate::voicemode::{audio, config, listen, tts};
    let cfg = config::load();
    let language = cfg.language.clone();
    Ports {
        mic: Box::new(audio::CpalMic),
        listener: Box::new(listen::listener_for),
        synth: Box::new(tts::VoxtralTts),
        open_speaker: Box::new(audio::open_speaker),
        listen_job: Box::new(config::listen_job),
        say_job: Box::new(|| config::say_job(&config::load())),
        language,
        store_image: Box::new(bend_images::store_file),
        user_kind,
    }
}

/// Write events to stdout, one line each; false: the app is gone.
fn write_out(out: &mut impl Write, evs: Vec<serde_json::Value>) -> bool {
    for e in evs {
        if writeln!(out, "{e}").is_err() {
            return false;
        }
    }
    out.flush().is_ok()
}

/// The loop of a core: stdin lines and hub events in, ticks, events out.
/// Returns when stdin closes (or stdout does).
pub fn run(core: &mut Core, rx: mpsc::Receiver<In>, out: &mut impl Write) {
    let mut last_tick = Instant::now();
    loop {
        let wait = TICK.saturating_sub(last_tick.elapsed());
        match rx.recv_timeout(wait) {
            Ok(In::Line(l)) => {
                if l.trim().is_empty() {
                    continue;
                }
                match Cmd::parse(&l) {
                    Ok(c) => core.cmd(c, Instant::now()),
                    Err(e) => eprintln!("ambient-core: {e}: {l}"),
                }
            }
            Ok(In::Hub(h)) => core.hub(h),
            Ok(In::Eof) | Err(RecvTimeoutError::Disconnected) => break,
            Err(RecvTimeoutError::Timeout) => {}
        }
        if last_tick.elapsed() >= TICK {
            last_tick = Instant::now();
            core.tick(last_tick);
        }
        if !write_out(out, core.take_out()) {
            break;
        }
    }
    core.shutdown();
    let _ = write_out(out, core.take_out());
}

/// `bise ambient-core --workspace <ws>`: `connect` reaches the
/// workspace's hub (the binary's: the first call may start it),
/// `user_kind` is the hub's (`switchboard::model::user_kind`).
pub fn core_main(workspace: String, connect: Connect, user_kind: fn(&str) -> bool) -> i32 {
    let (tx, rx) = mpsc::channel::<In>();
    let hub = Hub::start(connect, tx.clone(), In::Hub, RETRY);
    std::thread::spawn(move || {
        for l in io::stdin().lock().lines().map_while(Result::ok) {
            if tx.send(In::Line(l)).is_err() {
                return;
            }
        }
        let _ = tx.send(In::Eof);
    });
    let mut core = Core::new(workspace, hub, live_ports(user_kind));
    run(&mut core, rx, &mut io::stdout().lock());
    0
}

/// `bise ambient [--workspace <ws>]`: the app opens on this workspace
/// (or the running one switches to it): `scripts/ambient.sh open` of the
/// app root builds it when its sources changed. Its exit code.
pub fn launch_main(workspace: &std::path::Path, exe: &std::path::Path, app_root: &std::path::Path) -> i32 {
    let script = app_root.join("scripts/ambient.sh");
    if !script.exists() {
        eprintln!("bise ambient needs the macOS app's sources ({} is missing): run it from a bise checkout.", script.display());
        return 1;
    }
    let st = std::process::Command::new(&script)
        .arg("open")
        .arg("--workspace")
        .arg(workspace)
        .arg("--bise")
        .arg(exe)
        // the core's app root (repl-live): `open` drops this env, the
        // script hands it to the app with --env
        .env("BISE_APP_ROOT", app_root)
        .current_dir(app_root)
        .status();
    match st {
        Ok(s) => s.code().unwrap_or(1),
        Err(e) => {
            eprintln!("bise ambient: {}: {}", script.display(), e);
            1
        }
    }
}

