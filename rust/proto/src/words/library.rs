//! The artifacts library's UI words (see [`super`]: the rules, how to read
//! them): the folders the desktop's artifacts page and the terminal's
//! `/artifacts` share (page artifacts-gallery v7, blocks `spec` and `tips`;
//! the designer agent signed them, m_39646). The folder column and its
//! crumb, the project scope, the move-to picker, the folder ops' menus and
//! dialogs, the selection bar, the search across folders, the empty pages
//! and the tip of every mark. Clock times, day names and the `·` joins stay
//! TS / Rust fns.

crate::words! { library:
    // ---- the hero (the page's sentence and its facts line, parts joined by ' · ')
    /// the artifacts page's hero sentence, folders on
    say = "what your agents made for you to look at, in folders: each task files its work, you move what you like.";
    /// facts: how many, from where, in how many folders: `893 from 6 projects, in 9 folders`
    count_from(n, from, inside) = "{n} from {from}, {inside}";
    /// facts: the projects part, `6 projects`
    projects_n(n) = one "{n} project" | "{n} projects";
    /// facts: the folders part, `in 9 folders`
    in_folders(n) = one "in {n} folder" | "in {n} folders";
    /// facts: how many have no folder, `23 unfiled`
    unfiled_n(n) = "{n} unfiled";

    // ---- the folder column (200 px) and its crumb under 900 px
    /// the column's first row: every artifact, the folders as tiles
    all_artifacts = "all artifacts";
    /// the column's row of the newest, whatever their folder
    recent = "recent";
    /// the column's row of what has no folder
    unfiled = "unfiled";
    /// the column's head over the folders
    folders = "folders";
    /// the column's last row: makes a folder inline
    new_folder = "+ new folder";
    /// a theme's folded task rows, `11 more`
    n_more(n) = "{n} more";
    /// a folder's count under a project filter, `14 of 74`
    of_total(n, total) = "{n} of {total}";
    /// the new-folder field's placeholder
    folder_name = "folder name";
    /// the page's crumb root and the title-bar path's first part
    crumb_root = "artifacts";

    // ---- the project scope, at the left of the search field
    /// the scope's word when no project is picked
    all_projects = "all projects";
    /// the scope menu's foot: the typed way
    scope_hint(example) = "type a name in the search: \"in:{example}\"";
    /// the recent cards' head under a project filter, `recent in ai-docs`
    recent_in(project) = "recent in {project}";
    /// the scope chip's ×
    scope_clear(project) = "show every project, not only {project}";

    // ---- tiles and headers
    /// the tiles' sort on all artifacts
    recent_first = "recent first";
    /// a theme's header, `412 artifacts from 15 tasks`
    theme_count(n, tasks) = one "{n} artifact from {tasks} tasks" | "{n} artifacts from {tasks} tasks";
    /// a theme's header, how its folders came
    theme_filed = "filed by main when each task started";
    /// a task folder's header, `amb-home's work`
    work_of(agent) = "{agent}'s work";
    /// a task folder's header, `and 2 more agents`
    and_more_agents(n) = one "and {n} more agent" | "and {n} more agents";
    /// a folder he made, in its header
    made_by_you = "a folder you made";
    /// the unfiled page's sentence
    unfiled_say = "what has no folder yet: what you added yourself, and what came before folders.";
    /// the unfiled page's one action
    sort_with_main = "sort them with main";

    // ---- the empty pages: one sentence each, one action at most
    /// first run: the title
    first_title = "nothing here yet";
    /// first run: what fills it
    first_say = "when an agent makes a page, a doc, a deck or shots for you, it lands here, in its task's folder. you can also drop a file on this page.";
    /// a new folder: the title
    empty_folder_title = "empty for now";
    /// a new folder: what fills it
    empty_folder_say(name) = "drag artifacts here from any folder, or press m on one. an agent you tell \"file it in {name}\" puts its work here.";
    /// nothing unfiled: the title
    no_unfiled_title = "everything is in a folder";
    /// nothing unfiled: what fills it
    no_unfiled_say = "what you add yourself waits here until you give it one.";
    /// the archived ones (a), none
    none_archived = "nothing archived. esc goes back.";
    /// a project filter that leaves a folder empty
    none_from(project) = "nothing from {project} in this folder.";

    // ---- moving: the m picker, the drop, the toast
    /// the picker's title for one, `move "agent view fixes" to…`
    move_to(name) = "move \"{name}\" to…";
    /// the picker's title for several, `move 3 artifacts to…`
    move_n_to(n) = one "move {n} artifact to…" | "move {n} artifacts to…";
    /// the picker's field placeholder
    type_folder = "type a folder";
    /// the picker's group of every folder
    all_folders = "all folders";
    /// the picker's row that makes the typed folder, `+ new folder "pa"`
    new_folder_named(name) = "+ new folder \"{name}\"";
    /// the picker's keys line: ⏎
    key_move = "move";
    /// the picker's keys line: the digits, `1-3 pick`
    key_pick = "pick";
    /// the picker's keys line: →
    key_open = "open";
    /// the picker's keys line: esc
    key_back = "back";
    /// the picker's keys line: ⌘⏎
    key_new = "new folder";
    /// the toast after a move he made by hand, `✓ moved agent view fixes to page heroes`
    moved(what, to) = "✓ moved {what} to {to}";
    /// the toast's what for several, `3 artifacts`
    n_artifacts(n) = one "{n} artifact" | "{n} artifacts";
    /// the toast's undo
    undo = "undo";

    // ---- the menus
    /// a card's menu: open it
    menu_open = "open";
    /// a card's menu: Quick Look
    menu_look = "quick look";
    /// a card's menu: its versions
    menu_versions = "versions";
    /// a card's menu: copy its link
    menu_copy = "copy link";
    /// a card's menu: show in Finder
    menu_finder = "show in Finder";
    /// a card's menu: move it
    menu_move = "move to…";
    /// a card's menu, a folder's menu: rename it
    menu_rename = "rename";
    /// a folder's menu
    menu_new_inside = "new folder inside";
    /// a folder's menu
    menu_merge = "merge into…";
    /// a folder's menu
    menu_delete = "delete folder…";

    // ---- the selection bar
    /// how many he picked, `3 picked`
    picked(n) = "{n} picked";
    /// the bar's action
    put_in_message = "put in a message";
    /// the bar's action
    archive = "archive";

    // ---- merge and delete
    /// the merge picker's title, `merge "page heroes" into…`
    merge_into(name) = "merge \"{name}\" into…";
    /// the merge picker's foot, `its 22 artifacts move there; "page heroes" goes away. ⌘Z undoes it.`
    merge_say(n, name) = one "its {n} artifact moves there; \"{name}\" goes away. ⌘Z undoes it." | "its {n} artifacts move there; \"{name}\" goes away. ⌘Z undoes it.";
    /// the delete dialog's question, `delete "page heroes"?`
    delete_q(name) = "delete \"{name}\"?";
    /// the delete dialog's sentence (nothing else is deleted)
    delete_say(n) = one "its {n} artifact moves to unfiled. its file, versions and notes stay." | "its {n} artifacts move to unfiled. their files, versions and notes stay.";
    /// the delete dialog's cancel
    cancel = "cancel";
    /// the delete dialog's action
    delete_folder = "delete folder";

    // ---- search across folders
    /// the results' head, `17 found for "dark"`
    found(n, q) = "{n} found for \"{q}\"";
    /// the results' head, where it looked and its keys
    found_where = "in all folders · ⏎ opens the first, esc clears";
    /// a group's more, `all 6 ›`
    all_n(n) = "all {n} ›";
    /// the kind chips' first, `all 17`
    all_kinds = "all";
    /// no result: the head
    nothing_found(q) = "nothing found for \"{q}\"";
    /// no result: the title
    nothing_called(q) = "nothing called \"{q}\"";
    /// no result: where it looked
    looked_in = "i looked in names, folders, agents and kinds.";
    /// no result: the nearest, `the closest: bise pitch investisseurs, in launch, at v2.`
    closest(name, folder, v) = "the closest: {name}, in {folder}, at v{v}.";
    /// no result: open the nearest
    open_it(name) = "open {name}";
    /// no result: clear the words
    clear_search = "clear the search";

    // ---- the kind chips (words, never a glyph), with their counts
    /// a kind chip
    kind_shots = "shots";
    /// a kind chip
    kind_pages = "pages";
    /// a kind chip
    kind_docs = "docs";
    /// a kind chip
    kind_sheets = "sheets";
    /// a kind chip
    kind_slides = "slides";
    /// a kind chip
    kind_videos = "videos";
    /// a kind chip
    kind_sounds = "sounds";
    /// a kind chip
    kind_3d = "3D";
    /// a kind chip
    kind_links = "links";
    /// a kind chip
    kind_files = "files";

    // ---- the tips (page block `tips`): every mark explains itself
    /// the pink dot on a folder, `new inside: 3 since you last looked`
    tip_new_dot(n) = "new inside: {n} since you last looked";
    /// the ▦ toggle
    tip_cards = "show as cards";
    /// the ☰ toggle
    tip_list = "show as a list";
    /// a folder's count on hover, `48 artifacts`
    tip_count(n) = one "{n} artifact" | "{n} artifacts";
    /// a folder's ··· in its header
    tip_folder_more = "more: rename, merge, delete…";
    /// the crumb under 900 px
    tip_crumb = "the folders";
}
