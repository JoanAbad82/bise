//! The desktop's projects page and its add sheet (projects.tsx,
//! AddSheet.tsx, add.ts).

crate::words! { settings:
    /// a project's line: its folder is gone
    project_gone(path) = "{path} · its folder is gone";
    /// a project's line: what is wrong with it
    project_down(path, why) = "{path} · {why}";
    /// a project's rename field
    project_name_field = "its name in bise, then ⏎";
    /// a project's remove, asked: yes
    project_remove = "remove";
    /// a project's remove, asked: no
    project_keep = "keep";
    /// a project's move up
    project_up = "move up";
    /// a project's move down
    project_down_move = "move down";
    /// a project's rename
    project_rename = "rename";
    /// a project's remove, asked once
    project_remove_ask(name) = "remove {name} from bise? its folder and its git history stay.";
    /// the add button; the add sheet's head
    add_project = "add a project";
    /// the projects page's add button, under the list (designer m_41841)
    add_project_more = "Add a project…";
    /// a project row's ⋯: its name in words (aria-label, tip)
    project_menu(name) = "{name}: rename, move, remove";

    /// the add sheet's line under its head
    add_sub = "a folder, a git repo. its main starts right away.";
    /// the add sheet's cancel
    add_cancel = "cancel";
    /// the add sheet's path field
    add_path = "a folder's path";
    /// the add sheet's folder panel
    add_choose = "choose…";
    /// the add sheet: look in his folders again
    add_rescan = "look again";
    /// the add sheet's switch
    add_land = "main may land on main";
    /// the add sheet's switch, on
    add_land_on = "main commits to main once the tests pass, without asking you";
    /// the add sheet's switch, off
    add_land_off = "otherwise your repo's flow decides: a pull request or an approval";
    /// the core can't start projects (CoreEv broken, as CoreLine says it)
    add_broken(reason) = "▲ bise can't start your projects: {reason}.";
    /// the scan refused
    scan_failed(why) = "▲ the look in your folders failed: {why}";
    /// the scan found nothing new
    scan_nothing = "nothing new in your folders";
    /// the scan found repos
    scan_found(n) = "found in your folders · {n}";
    /// the core didn't answer the scan
    no_answer(s) = "▲ bise didn't answer in {s} s";
    /// the scan under way
    scan_looking = "looking in your folders…";
    /// the add button, nothing to add
    add = "add";
    /// the add button, one project
    add_one(name) = "add {name}";
    /// the add button, projects
    add_many(n) = "add {n} projects";
    /// the add refused
    add_failed(names, why) = "▲ couldn't add {names}: {why}";
    /// the core didn't answer the add
    add_no_answer(s, names) = "▲ bise didn't answer in {s} s: {names} isn't added";
    /// the add under way, one project
    adding_one(name) = "adding {name}… its main starts there";
    /// the add under way, projects
    adding_many(n) = "adding {n} projects…";
    /// an age (a found repo's day, an approval rule's): today
    age_today = "today";
    /// an age: yesterday
    age_yesterday = "yesterday";
    /// an age: days ago
    age_days(n) = "{n} days ago";
    /// an age: weeks ago
    age_weeks(n) = "{n} weeks ago";
    /// an age: months ago
    age_months(n) = "{n} months ago";
    /// an age: years ago
    age_years(n) = "{n} years ago";
    /// a found repo's line
    found_sub(path, when) = "{path} · {when}";
    /// a found repo's line, a git repo
    found_sub_git(path, when) = "{path} · git · {when}";
}
