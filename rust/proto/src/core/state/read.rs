//! How the generated types read a JSON object: as sb-core reads it
//! (gen/state-codec.bend's `rd.*`): a missing key, or a value of another
//! type, reads the field's default.

use serde::de::DeserializeOwned;
use serde_json::{Map, Value};

/// An object's fields: anything else is an error (a row that is not an
/// object is skipped by its reader).
pub(super) type Obj = Map<String, Value>;

/// The value under `key`, its default when missing or of another type.
pub(super) fn field<T: DeserializeOwned + Default>(o: &Obj, key: &str) -> T {
    o.get(key).and_then(|v| T::deserialize(v).ok()).unwrap_or_default()
}

/// A flag's key is written only when true (`Wire::Flag`).
#[allow(dead_code)]
pub(super) fn is_false(b: &bool) -> bool {
    !*b
}

/// The word under `key` ("" when missing or not a string).
pub(super) fn word<'a>(o: &'a Obj, key: &str) -> &'a str {
    o.get(key).and_then(Value::as_str).unwrap_or("")
}
