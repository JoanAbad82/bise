//! The reasoning-effort lists the providers' APIs give (effort-table step
//! 2), pure: parse each API's answer, keep them in a store (the text of
//! `<cache>/efforts.json`), say when a provider is due for a fetch, and
//! lay them over the catalog's table. The HTTP and the file are the
//! caller's (`live_fetch`). The order of a model's list, first wins:
//! config.toml > the API's list (this) > models.toml's `efforts` > its
//! family's ([`crate::ANTHROPIC_EFFORTS`], [`crate::CHAT_EFFORTS`]).
//!
//! The APIs (checked 2026-10-13):
//! - Anthropic `GET /v1/models`: `data[].capabilities.effort.<word>.supported`;
//!   bise adds `none` first (thinking off), a word of its own.
//! - OpenRouter `GET /api/v1/models`: `data[].reasoning.supported_efforts`.
//! - ChatGPT `/models` (chatgpt.rs fetches it): `models[].supported_reasoning_levels[].effort`.
use std::collections::BTreeMap;

use serde_json::{json, Value};

use crate::{is_effort_word, Catalog};

/// A provider's list is fetched again after a day.
pub const TTL_MS: u64 = 24 * 3600 * 1000;

/// The providers whose API gives each model's list (ChatGPT's comes with
/// its model list, chatgpt.rs).
pub const FETCHED: [&str; 2] = ["anthropic", "openrouter"];

/// The words in bise's order, weakest first; a word bise does not know
/// goes after the known ones, in the API's order.
pub fn ordered(words: impl IntoIterator<Item = String>) -> Vec<String> {
    const RANK: [&str; 7] = ["none", "minimal", "low", "medium", "high", "xhigh", "max"];
    let mut l: Vec<String> = Vec::new();
    for w in words {
        let w = w.trim().to_string();
        if is_effort_word(&w) && !l.contains(&w) {
            l.push(w);
        }
    }
    let rank = |w: &String| RANK.iter().position(|r| r == w).unwrap_or(RANK.len());
    l.sort_by_key(rank); // stable: the unknown ones keep their order
    l
}

/// Anthropic's `/v1/models` answer: ("anthropic/<id>", none + its
/// supported words), only the models that take an effort.
pub fn parse_anthropic(v: &Value) -> Vec<(String, Vec<String>)> {
    data(v)
        .filter_map(|m| {
            let id = m.get("id")?.as_str()?;
            let e = m.get("capabilities")?.get("effort")?.as_object()?;
            let words: Vec<String> = e
                .iter()
                .filter(|(_, x)| x.get("supported").and_then(Value::as_bool) == Some(true))
                .map(|(w, _)| w.clone())
                .collect();
            (!words.is_empty()).then(|| (format!("anthropic/{id}"), ordered(std::iter::once("none".to_string()).chain(words))))
        })
        .collect()
}

/// OpenRouter's `/api/v1/models` answer: ("openrouter/<id>", its
/// supported_efforts), only the models that list some.
pub fn parse_openrouter(v: &Value) -> Vec<(String, Vec<String>)> {
    data(v)
        .filter_map(|m| {
            let id = m.get("id")?.as_str()?;
            let l = m.get("reasoning")?.get("supported_efforts")?.as_array()?;
            let words = ordered(l.iter().filter_map(|w| w.as_str().map(String::from)));
            (!words.is_empty()).then(|| (format!("openrouter/{id}"), words))
        })
        .collect()
}

/// One model of ChatGPT's list: its levels (`supported_reasoning_levels`
/// from the API, `efforts` in bise's cache of it).
pub fn chatgpt_levels(m: &Value) -> Vec<String> {
    let api = m.get("supported_reasoning_levels").and_then(Value::as_array).map(|l| {
        l.iter().filter_map(|x| x.get("effort").or(Some(x)).and_then(Value::as_str).map(String::from)).collect::<Vec<_>>()
    });
    let cached = || m.get("efforts").and_then(Value::as_array).map(|l| l.iter().filter_map(|x| x.as_str().map(String::from)).collect());
    ordered(api.or_else(cached).unwrap_or_default())
}

/// ChatGPT's model list (its `/models` answer, or bise's cache of it):
/// the listed models (`visibility == "list"`), in the server's order.
pub fn plan_models(v: &Value) -> Vec<crate::chatgpt::PlanModel> {
    let all = v.get("models").and_then(Value::as_array).into_iter().flatten();
    all.filter(|m| m.get("visibility").and_then(Value::as_str).is_none_or(|x| x == "list"))
        .filter_map(|m| {
            let slug = m.get("slug").and_then(Value::as_str)?.to_string();
            let display_name = m.get("display_name").and_then(Value::as_str).unwrap_or(&slug).to_string();
            Some(crate::chatgpt::PlanModel { slug, display_name, efforts: chatgpt_levels(m) })
        })
        .collect()
}

fn data(v: &Value) -> impl Iterator<Item = &Value> {
    v.get("data").and_then(Value::as_array).into_iter().flatten()
}

/// What `<cache>/efforts.json` holds: when each provider was fetched
/// (ms) and each model's list ("provider/id" -> words).
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Store {
    pub fetched: BTreeMap<String, u64>,
    pub models: BTreeMap<String, Vec<String>>,
}

impl Store {
    /// None: not a store (the caller keeps the file it has).
    pub fn parse(text: &str) -> Option<Store> {
        let v: Value = serde_json::from_str(text).ok()?;
        let fetched = v.get("fetched")?.as_object()?.iter().filter_map(|(p, t)| Some((p.clone(), t.as_u64()?))).collect();
        let models = v
            .get("models")?
            .as_object()?
            .iter()
            .map(|(m, l)| (m.clone(), ordered(l.as_array().into_iter().flatten().filter_map(|w| w.as_str().map(String::from)))))
            .filter(|(_, l)| !l.is_empty())
            .collect();
        Some(Store { fetched, models })
    }

    pub fn to_json(&self) -> String {
        json!({"version": 1, "fetched": self.fetched, "models": self.models}).to_string()
    }

    /// The provider's fetch is older than a day, or never was.
    pub fn due(&self, provider: &str, now_ms: u64) -> bool {
        self.fetched.get(provider).is_none_or(|t| now_ms.saturating_sub(*t) >= TTL_MS)
    }

    /// A new fetch of `provider`: its lists replace the old ones.
    pub fn with(mut self, provider: &str, now_ms: u64, lists: Vec<(String, Vec<String>)>) -> Store {
        let prefix = format!("{provider}/");
        self.models.retain(|m, _| !m.starts_with(&prefix));
        self.models.extend(lists.into_iter().filter(|(m, l)| m.starts_with(&prefix) && !l.is_empty()));
        self.fetched.insert(provider.to_string(), now_ms);
        self
    }
}

impl Catalog {
    /// The APIs' lists over the table, before config.toml applies (so
    /// it wins): a listed model only (the API lists hundreds bise does
    /// not show).
    pub fn with_live(mut self, live: &[(String, Vec<String>)]) -> Catalog {
        for (name, words) in live {
            if let Some(m) = self.models.iter_mut().find(|m| m.name() == *name) {
                m.caps.efforts = Some(words.join(","));
            }
        }
        self
    }
}
