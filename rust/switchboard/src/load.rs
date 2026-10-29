//! The machine's load, one definition for the hub (send-fast step 6,
//! architect m_36171): the 1-minute load average per core, at least 1,
//! at most [`MAX_FACTOR`]. The same factor as tests/wait.py's
//! `load_factor` (which caps at 4 for a test's waits; the hub sees load
//! 100 on 12 cores). What scales with it: a REPL start's no-progress
//! limit (crate::repl_start), a stall that counts as a crash or not
//! (sb-core's `IExited`), the idle recycle's hold (crate::recycle).
//! A test sets it with the test setting `SB_LOAD_FACTOR` (a file
//! holding the factor; the hub's tests run it as a process), never from
//! the real machine.

/// The highest factor: past it, the machine is just "very loaded".
pub const MAX_FACTOR: f64 = 8.0;

/// From this factor the machine is loaded: a stalled start does not
/// count as a crash, the idle recycle waits.
pub const LOADED: f64 = 2.0;

/// `load1` (the 1-minute load average) on `cpus` cores, as a factor in
/// [1, MAX_FACTOR]. No cores known: one.
pub fn factor_of(load1: f64, cpus: usize) -> f64 {
    let f = load1 / cpus.max(1) as f64;
    if f.is_nan() {
        return 1.0;
    }
    f.clamp(1.0, MAX_FACTOR)
}

/// The factor is high enough that slowness is the machine's, not the
/// REPL's.
pub fn is_loaded(factor: f64) -> bool {
    factor >= LOADED
}

/// The machine's factor now (in a test, the number in the file
/// `SB_LOAD_FACTOR` names, read each time: a test moves the load); 1
/// when the load can't be read.
pub fn factor() -> f64 {
    if let Some(f) = bise_home::env::test_setting("SB_LOAD_FACTOR") {
        let n = std::fs::read_to_string(f).ok().and_then(|s| s.trim().parse::<f64>().ok());
        return n.unwrap_or(1.0).clamp(1.0, MAX_FACTOR);
    }
    let mut avg = [0f64; 3];
    // SAFETY: getloadavg writes at most `nelem` doubles into `avg`.
    let n = unsafe { libc::getloadavg(avg.as_mut_ptr(), 1) };
    if n < 1 {
        return 1.0;
    }
    let cpus = std::thread::available_parallelism().map(|n| n.get()).unwrap_or(1);
    factor_of(avg[0], cpus)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_factor_is_the_load_per_core_between_1_and_8() {
        assert_eq!(factor_of(6.0, 12), 1.0, "under one per core: 1");
        assert_eq!(factor_of(24.0, 12), 2.0);
        assert_eq!(factor_of(90.0, 12), 7.5);
        assert_eq!(factor_of(400.0, 12), MAX_FACTOR, "capped");
        assert_eq!(factor_of(5.0, 0), 5.0, "no cores known: one");
        assert_eq!(factor_of(f64::NAN, 12), 1.0);
    }

    #[test]
    fn loaded_from_two_per_core() {
        assert!(!is_loaded(1.0) && !is_loaded(1.99));
        assert!(is_loaded(2.0) && is_loaded(7.5));
    }
}
