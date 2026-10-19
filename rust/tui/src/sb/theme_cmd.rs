//! `/theme [auto|light|dark]` (moved out of sb.rs unchanged: its line
//! limit). Its test stays with sb.rs's command tests.

use super::*;

/// `/theme [auto|light|dark]`: switch the palette now and keep it for
/// the next launches (`choose`: `theme_detect::choose`, a fake in tests
/// so they never write the real home). No argument: say which one is in
/// use.
pub(super) fn theme_command(
    arg: Option<&str>,
    choose: impl Fn(crate::theme_detect::Choice) -> (crate::theme::Mode, Result<(), String>),
) -> Ev {
    use crate::theme_detect::Choice;
    let name = |m| if m == crate::theme::Mode::Light { "light" } else { "dark" };
    match arg.map(Choice::parse) {
        None => Ev::Info(format!("theme: {}. /theme auto, light or dark to change it.", name(crate::theme::mode()))),
        Some(Some(c)) => match choose(c) {
            (m, Ok(())) => Ev::Info(format!("theme: {}.", name(m))),
            (m, Err(e)) => Ev::Warn(format!("theme: {}, for now: i couldn't save it ({}).", name(m), e)),
        },
        Some(None) => Ev::Warn("/theme takes auto, light or dark.".into()),
    }
}
