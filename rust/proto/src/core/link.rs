//! The link's own requests (`{"t": <tag>, …}`, like an input): main.bend
//! answers them before any dispatch (its `tag_of`), so they are not
//! sb-core inputs and have no envelope. Any other tag is a step (an
//! [`super::In`]): its Bend fallback is `TStep`.

use super::core_kinds;

core_kinds! {
    /// One request of the hub to the sb-core process itself.
    pub enum Link, tag "t" {
        /// reset the hub's state (a new sb-core, a restart)
        Init = "init" => TInit { workspace: Str },
        /// one journal event (answers `{"skipped": true}` for a kind it
        /// does not know)
        Replay = "replay" => TReplay { ev: Json },
        /// a batch of journal events at boot (answers the skipped indexes)
        ReplayMany = "replay_many" => TReplayMany { evs: Jsons },
        /// answers `{}`
        Ping = "ping" => TPing {},
        /// the whole view
        ViewAll = "view_all" => TView {},
    }
}
