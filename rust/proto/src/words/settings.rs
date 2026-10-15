//! The settings area's UI words (see [`super`]: the rules, how to read
//! them): settings, setup and onboarding, models and providers, plugins,
//! updates. Split in parts (architect m_27109), each a `words! { settings: }`
//! block, so a key is `settings.<name>` whatever its part.

use super::Word;

mod accounts;
mod keys;
mod pages;
mod projects;
mod update;

pub use accounts::*;
pub use keys::*;
pub use pages::*;
pub use projects::*;
pub use update::*;

const PARTS: &[&[Word]] = &[pages::WORDS, accounts::WORDS, projects::WORDS, update::WORDS, keys::WORDS];

/// This area's words, in order (bise_proto::words::ALL).
pub const WORDS: &[Word] = &super::concat::<{ super::count(PARTS) }>(PARTS);
