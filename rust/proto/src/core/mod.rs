//! The seam between the hub and sb-core, typed (issue 25, debt D1 + D2):
//! every kind that crosses it is declared once, here.
//!
//! - [`In`] (tag `"t"`): one variant per input sb-core's dispatch knows
//!   (today's `in_tag` in bend/hub/core.bend, tag for tag), and [`Step`],
//!   the envelope the hub adds to each (`now`, `git`, `ans`);
//! - [`Link`] (tag `"t"`): the link's own requests that main.bend answers
//!   before any dispatch (`init`, `replay`, `replay_many`, `ping`,
//!   `view_all`);
//! - [`Answer`] (untagged): sb-core's answer line to each, a step's
//!   `{fx, dirty, view}` or its `{need}`, `{view}`, `{skipped}`,
//!   `{error}`, `{}` (`link::ANSWER`: its shapes, for the Bend encoders);
//! - [`Fx`] (tag `"fx"`): one variant per effect sb-core answers with;
//! - [`Feed`] (tag `"sb"`, DRAFT): the typed records of an agent's
//!   transcript, the hub's `sb <kind> : …` lines.
//!
//! Each field is today's JSON exactly: its name, whether it is written
//! when empty or none, null or absent. Each enum has `Unknown { tag, raw }`:
//! a tag this side doesn't know (a newer sb-core, an older hub) decodes,
//! never fails.
//!
//! From the declaration (the [`core_kinds!`] macro below) come the serde
//! types AND a [`Table`] of every kind and field; `tests/core_gen.rs`
//! writes sb-core's codecs from the tables (`bend/hub/gen/*.bend`: the
//! decode of `In` and `Link` into Bend records with the tag lookup, the
//! `Fx` and `Feed` encoders) and fails when they are stale. What stays
//! hand-written: the decision in sb-core and its law.
//!
//! A new kind: one row in its enum here, `BISE_PROTO_BLESS=1 cargo test
//! -p bise-proto --test core_gen`, then the Bend decision and its law.
//!
//! The wire rule binds here as everywhere (lib.rs): a field is only added,
//! a new tag only goes into an enum with `Unknown` (all four have it).

pub mod feed;
pub mod fx;
pub mod input;
pub mod link;

pub use feed::Feed;
pub use fx::Fx;
pub use input::{In, Step};
pub use link::{Answer, Link};

use serde::{Deserialize, Serialize};

/// How a field is on the wire, and so its Rust type, its serde attributes
/// and its Bend type, default and codec (tests/core_gen.rs).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FieldKind {
    /// `String`, always written; missing reads "".
    Str,
    /// `String`, written only when not empty (`parts`); missing reads "".
    StrOmit,
    /// `u64`, always written; missing reads 0 (Bend `Nat`).
    Nat,
    /// `bool`, always written; missing reads false.
    Bool,
    /// `Option<String>`, written as null when none (Bend `Maybe<String>`;
    /// a value that is not a string reads none).
    OptStr,
    /// `Option<String>`, absent when none.
    OptStrOmit,
    /// `Option<u64>`, written as null when none.
    OptNat,
    /// `Option<u64>`, absent when none.
    OptNatOmit,
    /// any JSON value, kept as is (Bend `J.Json`); missing reads null.
    Json,
    /// `Vec<String>`, always written; missing reads empty.
    Strs,
    /// `Option<Vec<String>>`, absent when none (a line's `fields`).
    OptStrsOmit,
    /// `Vec<u64>`, always written.
    Nats,
    /// `Vec<Value>`, always written.
    Jsons,
    /// `Vec<Delivered>`: a delivery's messages, `[{"id", "rel"}]`.
    Msgs,
    /// `u32`, the version of a record whose shape may change; always
    /// written, missing reads 1.
    Ver,
}

/// One field of a kind.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Field {
    pub name: &'static str,
    pub kind: FieldKind,
}

/// One kind: its tag, its Rust variant, its Bend constructor (two tags
/// may share one: `card_close` is `IConfirmClose`, as in `in_tag`), its
/// fields in wire order.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Kind {
    pub tag: &'static str,
    pub rust: &'static str,
    pub bend: &'static str,
    pub fields: &'static [Field],
}

/// Every kind of one enum, in declaration order.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Table {
    /// the enum's Rust name (`In`)
    pub name: &'static str,
    /// the JSON key of the tag (`t`, `fx`, `sb`)
    pub tag_key: &'static str,
    pub kinds: &'static [Kind],
}

impl Table {
    pub fn kind(&self, tag: &str) -> Option<&'static Kind> {
        self.kinds.iter().find(|k| k.tag == tag)
    }
}

/// One message of a delivery (`Fx::Deliver`'s `msgs`): its id and how
/// the recipient relates to its sender (`parent`, `child`, `peer`, ...).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Delivered {
    #[serde(default)]
    pub id: u64,
    #[serde(default)]
    pub rel: String,
}

/// serde's default of a [`FieldKind::Ver`] field.
pub fn v1() -> u32 {
    1
}

/// Declares one enum of the seam: the serde enum (tag `$tag_key`, one
/// newtype variant per kind around a struct of the same name, declared
/// next to it, plus `Unknown { tag, raw }`), its `TAGS`, its [`Table`],
/// `decode`/`to_value`/`encode`/`tag`.
///
/// ```text
/// core_kinds! {
///     /// docs
///     pub enum In, tag "t" {
///         /// docs
///         Req = "req" => IReq { token: Nat, from: Str, req: Json },
///     }
/// }
/// ```
///
/// `=> IReq` is the Bend constructor. A field is `name: FieldKind`.
macro_rules! core_kinds {
    (
        $(#[$em:meta])*
        pub enum $Enum:ident, tag $tag_key:literal {
            $(
                $(#[$vm:meta])*
                $Var:ident = $tag:literal => $bend:ident { $( $(#[$fm:meta])* $f:ident : $k:ident ),* $(,)? }
            ),* $(,)?
        }
    ) => {
        $(
            $crate::core::core_fields! { [$(#[$vm])*] $Var { $( $(#[$fm])* $f : $k ),* } }
        )*

        $(#[$em])*
        #[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
        #[serde(tag = $tag_key)]
        pub enum $Enum {
            $(
                $(#[$vm])*
                #[serde(rename = $tag)]
                $Var($Var),
            )*
            /// a tag this side doesn't know: kept whole
            #[serde(skip)]
            Unknown { tag: String, raw: serde_json::Value },
        }

        impl $Enum {
            /// every known tag
            pub const TAGS: &'static [&'static str] = &[$($tag),*];

            /// every kind and its fields (the Bend generator reads it)
            pub const TABLE: $crate::core::Table = $crate::core::Table {
                name: stringify!($Enum),
                tag_key: $tag_key,
                kinds: &[$(
                    $crate::core::Kind {
                        tag: $tag,
                        rust: stringify!($Var),
                        bend: stringify!($bend),
                        fields: &[$( $crate::core::Field { name: stringify!($f), kind: $crate::core::FieldKind::$k } ),*],
                    }
                ),*],
            };

            /// One JSON value: a known tag as its kind (an error when its
            /// fields don't fit: a bug of the sender), any other as `Unknown`.
            pub fn decode(v: serde_json::Value) -> Result<$Enum, String> {
                $crate::decode(v, $tag_key, Self::TAGS, |tag, raw| $Enum::Unknown { tag, raw })
            }

            /// One line.
            pub fn decode_line(line: &str) -> Result<$Enum, String> {
                Self::decode($crate::parse(line)?)
            }

            /// Its JSON value (`Unknown`: the value it was read from).
            pub fn to_value(&self) -> serde_json::Value {
                match self {
                    $Enum::Unknown { raw, .. } => raw.clone(),
                    k => serde_json::to_value(k).expect("a core kind always serializes"),
                }
            }

            /// Its JSON text, one line.
            pub fn encode(&self) -> String {
                self.to_value().to_string()
            }

            /// Its tag.
            pub fn tag(&self) -> &str {
                match self {
                    $( $Enum::$Var(_) => $tag, )*
                    $Enum::Unknown { tag, .. } => tag,
                }
            }
        }
    };
}

pub(crate) use core_kinds;

/// The struct of one kind, each field with the serde attributes of its
/// [`FieldKind`] (a TT muncher: an attribute can't come from a macro
/// call, so each field is matched on its kind and written out).
macro_rules! core_fields {
    ([$($m:tt)*] $name:ident { $($fields:tt)* }) => {
        $crate::core::core_fields!(@go [$($m)*] $name [] $($fields)*);
    };
    (@go [$($m:tt)*] $name:ident [$($done:tt)*]) => {
        $($m)*
        #[derive(Clone, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
        pub struct $name { $($done)* }
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : Str $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: String,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : StrOmit $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default, skip_serializing_if = "String::is_empty")] pub $f: String,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : Nat $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: u64,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : Bool $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: bool,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : OptStr $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: Option<String>,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : OptStrOmit $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default, skip_serializing_if = "Option::is_none")] pub $f: Option<String>,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : OptNat $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: Option<u64>,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : OptNatOmit $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default, skip_serializing_if = "Option::is_none")] pub $f: Option<u64>,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : Json $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: serde_json::Value,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : Strs $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: Vec<String>,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : OptStrsOmit $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default, skip_serializing_if = "Option::is_none")] pub $f: Option<Vec<String>>,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : Nats $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: Vec<u64>,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : Jsons $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: Vec<serde_json::Value>,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : Msgs $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default)] pub $f: Vec<$crate::core::Delivered>,] $($($rest)*)?);
    };
    (@go $m:tt $name:ident [$($done:tt)*] $(#[$fm:meta])* $f:ident : Ver $(, $($rest:tt)*)?) => {
        $crate::core::core_fields!(@go $m $name [$($done)* $(#[$fm])* #[serde(default = "crate::core::v1")] pub $f: u32,] $($($rest)*)?);
    };
}

pub(crate) use core_fields;

#[cfg(test)]
mod tests;
