//! The desktop's settings pages: the nav, general, voice, context and
//! privacy, quiet moments, the keys page and the keychain row
//! (apps/desktop/src/settings/pages.tsx).

crate::words! { settings:
    /// the nav's page: general
    page_general = "general";
    /// general's hero sentence (designer m_39021)
    page_general_sub = "how bise starts, updates and looks.";
    /// the nav's page: setup
    page_setup = "setup";
    /// setup's hero sentence
    page_setup_sub = "what's set up and what's left: a model, the permissions, your first project.";
    /// the nav's page: voice
    page_voice = "voice and fn";
    /// voice's hero sentence
    page_voice_sub = "how bise hears you and answers: hold fn to talk from any app, ctrl+r to dictate in the composer.";
    /// the nav's page: context and privacy
    page_privacy = "context and privacy";
    /// privacy's hero sentence
    page_privacy_sub = "what bise sees when you hold fn, and what it never sends.";
    /// the nav's page: quiet moments
    page_quiet = "quiet moments";
    /// quiet's hero sentence
    page_quiet_sub = "when bise keeps quiet: in a call, while you share your screen, in full screen.";
    /// the nav's page: models
    page_models = "models";
    /// models' hero sentence
    page_models_sub = "the models your agents use, and how you pay for them: a plan, a key, or both.";
    /// the nav's page: approvals
    page_approvals = "approvals";
    /// approvals' hero sentence
    page_approvals_sub = "what runs without asking, and what waits for your yes.";
    /// the nav's page: projects
    page_projects = "projects";
    /// projects' hero sentence
    page_projects_sub = "the folders bise works in. each one has its own main.";
    /// the nav's page: plugins
    page_plugins = "plugins";
    /// plugins' line under its title
    page_plugins_sub = "what your agents can use besides the repo: skills, tools, servers. /plugins in the terminal.";
    /// the nav's page: computer use
    page_computer = "computer use";
    /// computer use's hero sentence
    page_computer_sub = "your browser and your Mac apps, for your agents: set it up once, then see what they did.";
    /// the nav's page: keys
    page_keys = "keys";
    /// keys' hero sentence
    page_keys_sub = "your keys and sign-ins. they stay on this Mac.";

    /// general: the macOS notifications row's label
    notify_label = "macOS notifications";
    /// notifications never asked
    notify_never = "questions can reach you when bise isn't in front";
    /// notifications never asked: its button
    notify_turn_on = "turn on";
    /// notifications asked once, the answer in System Settings
    notify_asked = "macOS asked you; your answer is in System Settings";
    /// notifications on
    notify_on = "questions reach you when bise isn't in front";
    /// notifications on: its chip
    notify_on_chip = "on";
    /// notifications off in macOS
    notify_off = "off in macOS: questions wait in bise until you look";
    /// a button that opens macOS's System Settings (notifications, a denied permission)
    open_system_settings = "open System Settings";
    /// general: the theme row
    theme_label = "appearance";
    /// general: the theme row's line
    theme_sub = "light, dark, or as macOS";
    /// a theme: as macOS
    theme_system = "system";
    /// a theme: light
    theme_light = "light";
    /// a theme: dark
    theme_dark = "dark";

    /// voice: hold fn
    voice_fn_hold = "hold fn to talk";
    /// voice: hold fn's line
    voice_fn_hold_sub = "your words go when you let go";
    /// voice: fn twice
    voice_fn_twice = "fn fn: hands-free";
    /// voice: fn twice's line
    voice_fn_twice_sub = "talk without holding; fn again stops";
    /// voice: the language row
    voice_language = "what bise hears";
    /// voice: the language row's line
    voice_language_sub = "the language of your voice";
    /// a voice language: let the model guess
    lang_auto = "auto";
    /// a voice language: English
    lang_en = "English";
    /// a voice language: French
    lang_fr = "Français";

    /// quiet: the first group's title
    quiet_wait = "notifications wait";
    /// quiet: during a call
    quiet_call = "during a call";
    /// quiet: during a call's line
    quiet_call_sub = "Zoom, Meet, FaceTime: the pearl blushes, nothing shows";
    /// quiet: during a share
    quiet_share = "while you share your screen";
    /// quiet: during a share's line
    quiet_share_sub = "never a notification during a share";
    /// quiet: full screen
    quiet_fullscreen = "in full screen";
    /// quiet: full screen's line
    quiet_fullscreen_sub = "Keynote, a game, a video";
    /// quiet: focus mode
    quiet_focus = "in focus mode";
    /// quiet: focus mode's line
    quiet_focus_sub = "follows macOS focus";
    /// quiet: the second group's title
    quiet_then = "then";
    /// quiet: the batch row
    quiet_batch = "they come together";
    /// quiet: the batch row's line
    quiet_batch_sub = "“2 questions · 1 min”, one at a time";
    /// quiet: how often a batch comes
    quiet_batch_min = "at most every";
    /// quiet: how often's line
    quiet_batch_min_sub = "to group the rest";
    /// quiet: a batch's minutes
    minutes(n) = "{n} min";
    /// quiet: the away card
    quiet_away = "while you were away";
    /// quiet: the away card's line
    quiet_away_sub = "one notification when you open your Mac again";

    /// privacy: the first group's title
    privacy_hold = "when you hold fn";
    /// privacy: the screenshot
    privacy_shot = "a screenshot of the window in front";
    /// privacy: the screenshot's line
    privacy_shot_sub = "never the whole screen";
    /// privacy: the tab's URL
    privacy_url = "the tab's URL and title";
    /// privacy: the tab's URL's line
    privacy_url_sub = "Chrome, Safari, Arc";
    /// privacy: the open file
    privacy_file = "the open file and your selection";
    /// privacy: the open file's line
    privacy_file_sub = "VS Code, Cursor, Xcode, Zed";
    /// privacy: the window's text
    privacy_window_text = "the text of the window";
    /// privacy: the window's text's line
    privacy_window_text_sub = "mails, docs, tickets: bise sees what you see";
    /// privacy: the second group's title
    privacy_kept = "kept";
    /// privacy: the images row (D14: every image of the store, designer m_23410)
    privacy_shots = "images";
    /// privacy: the images row's line
    privacy_shots_sub = "pasted, made by agents or taken with fn · deleted after";
    /// privacy: how long images are kept
    days(n) = one "{n} day" | "{n} days";
    /// privacy: the excluded apps' group
    privacy_apps = "never sent to an agent";
    /// privacy: the excluded apps' help
    privacy_apps_help = "fn reads nothing in these apps: no title, URL, file, selection, text or capture.";
    /// privacy: the row that adds an app
    privacy_another_app = "another app";
    /// privacy: its button
    privacy_add = "add…";
    /// privacy: the bundle id field
    privacy_app_id = "its bundle id (com.example.app), then ⏎";

    /// keys: the terminal's key, when it differs
    key_terminal(keys) = "terminal: {keys}";
    /// keys: the chip under the list
    keys_same = "/help and /shortcuts in the terminal list the same keys";

    /// keys page: the keychain group
    keychain_title = "your keys and sign-ins";
    /// keys page: the keychain row
    keychain_label = "keep them in the macOS keychain";
    /// keys page: the keychain switch's label
    keychain_switch = "keep your keys and sign-ins in the macOS keychain";
    /// keys page: the move under way
    keychain_moving = "moving them…";
    /// keys page: they are in the keychain
    keychain_on = "on: your keys and sign-ins are in the macOS keychain.";
    /// keys page: they are in files
    keychain_off = "off: they're in files in ~/.bise. same switch as /keychain in the terminal.";
}
