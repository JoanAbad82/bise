//! `POST /api/a/<id>/storage` (web-storage, architect m_46151): a site
//! artifact's localStorage, which bise's viewer (kit/office/site.js) sends
//! when the site's frame posts a write (kit/storage.js). server.rs's `/api`
//! arm checked the token and the origin; the map is read again and kept by
//! crate::artifacts_storage, under the page server's lock. The page server
//! seeds each html page of the copy with it (server.rs `artifact_file`).

use super::super::server::Response;
use super::super::Pages;
use super::notes::arts;
use serde_json::{json, Value};

/// Body `{"local": {"<key>": "<value>", …}}`, the whole map: kept for every
/// version of `id`. 404: no such artifact; 400: not that shape; 413: over
/// 5 MB.
pub fn post(pages: &Pages, id: &str, body: &[u8]) -> Response {
    let store = arts(pages);
    if store.get(id).is_none() {
        return Response::err(404, "no such artifact");
    }
    let Ok(v) = serde_json::from_slice::<Value>(body) else { return Response::err(400, "not JSON") };
    let Some(local) = v.get("local") else { return Response::err(400, "no local") };
    let kept = match crate::artifacts_storage::checked(local) {
        Ok(k) => k,
        Err(e) if local.is_object() => return Response::err(413, &e),
        Err(e) => return Response::err(400, &e),
    };
    match pages.locked(|_| crate::artifacts_storage::save(&store, id, &kept)) {
        Ok(()) => Response::json(200, &json!({"keys": kept.len()})),
        Err(e) => Response::err(500, &e),
    }
}
