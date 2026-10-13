//! The reasoning effort (BISE-135): the words a model takes and the one it
//! runs with. The one owner of the family lists: the hand-off file
//! carries them to the Bend runtime ([`crate::Setup::handoff_toml`] writes
//! each provider's), which keeps no list of its own. A model's list, first
//! wins: config.toml > the provider's API (`live_efforts`) > models.toml's
//! `efforts` > its family's.
use crate::Resolved;

/// The reasoning efforts of the Anthropic family: `none` turns thinking
/// off; the others are output_config.effort (adaptive) or the size of the
/// thinking budget (budget; xhigh there is high's budget).
pub const ANTHROPIC_EFFORTS: [&str; 6] = ["none", "low", "medium", "high", "xhigh", "max"];

/// The reasoning efforts of the OpenAI-compatible families
/// (`reasoning_effort`, sent as is).
pub const CHAT_EFFORTS: [&str; 4] = ["none", "low", "medium", "high"];

/// The effort a reasoning model gets when nobody picks one: today's.
pub const DEFAULT_EFFORT: &str = "high";

/// The family list of a wire family (`api`).
pub fn family_efforts(api: &str) -> &'static [&'static str] {
    if api == "anthropic" {
        &ANTHROPIC_EFFORTS
    } else {
        &CHAT_EFFORTS
    }
}

/// An effort word: letters, digits, '-' or '_' (a provider may take its
/// own, "minimal", "xhigh"...).
pub fn is_effort_word(w: &str) -> bool {
    !w.is_empty() && w.len() <= 20 && w.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

/// "none, low,high" -> ["none", "low", "high"]; empty when a word is not
/// an effort word.
pub fn effort_list(s: &str) -> Vec<String> {
    let l: Vec<String> = s.split(',').map(|w| w.trim().to_string()).filter(|w| !w.is_empty()).collect();
    if l.iter().all(|w| is_effort_word(w)) {
        l
    } else {
        Vec::new()
    }
}

impl Resolved {
    /// The reasoning efforts the model takes, in order: its `efforts` key
    /// (the API's list or the table's), else its family's
    /// ([`family_efforts`]); none for a model that does not reason (an
    /// Anthropic one with `thinking = "none"` included). The Bend runtime
    /// computes the same from the hand-off (runtime/provider-pure.bend
    /// `efforts`).
    pub fn efforts(&self) -> Vec<String> {
        if !self.caps.reasoning || (self.api == "anthropic" && self.caps.thinking == "none") {
            return Vec::new();
        }
        let own = effort_list(&self.caps.efforts);
        if !own.is_empty() {
            return own;
        }
        family_efforts(&self.api).iter().map(|w| w.to_string()).collect()
    }

    /// The effort nobody picked: its `effort` key when it takes it, else
    /// high, else the last of its list; "" when it takes none.
    pub fn default_effort(&self) -> String {
        let l = self.efforts();
        let has = |w: &str| l.iter().any(|x| x == w);
        if has(&self.caps.effort) {
            self.caps.effort.clone()
        } else if has(DEFAULT_EFFORT) {
            DEFAULT_EFFORT.into()
        } else {
            l.last().cloned().unwrap_or_default()
        }
    }

    /// The effort a call runs with when `asked` is asked ("" = nothing
    /// asked): `asked` when the model takes it, else its default.
    pub fn effort_for(&self, asked: &str) -> String {
        let asked = asked.trim();
        if self.efforts().iter().any(|w| w == asked) {
            asked.to_string()
        } else {
            self.default_effort()
        }
    }
}
