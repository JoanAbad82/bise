//! What a project's model calls cost (`usage/read`, the `usage` event;
//! cost-pause): per agent and per model, today and this week. The hub
//! sums the usage lines of the transcripts (switchboard's usage_ledger)
//! and prices them from its catalog; the words come filled
//! (`words::usage_words`), so every client says the same.

use serde::{Deserialize, Serialize};

/// Tokens of some calls and what they cost.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct UsageSum {
    /// every input token, the cached ones included
    pub input: u64,
    pub output: u64,
    /// input tokens read back from the provider's cache
    pub cache_read: u64,
    /// input tokens written to the provider's cache
    pub cache_write: u64,
    /// the model calls counted
    pub calls: u64,
    /// USD of the calls whose model has prices in the hub's catalog (an
    /// estimate: models.toml's prices)
    pub cost_usd: f64,
    /// the calls left out of `cost_usd` (no prices for their model)
    pub unpriced: u64,
    /// the calls on a plan (the ChatGPT sign-in): tokens, no money
    #[serde(default)]
    pub plan: u64,
    /// "~$1.23 · 1.2M", "— · 40k" when nothing is priced, "your ChatGPT
    /// plan · 40k" when all ran on a plan (`words::usage_words`)
    pub words: String,
}

/// One row: an agent, a model, or the whole project.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS))]
pub struct UsageRow {
    /// the agent's name, the model's `provider/model` id, or "" for the
    /// whole project
    pub name: String,
    /// an agent's row: the models it called this week, joined by ", "
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub models: String,
    /// since the hub's local midnight
    pub today: UsageSum,
    /// the last 7 local days, today included
    pub week: UsageSum,
}
