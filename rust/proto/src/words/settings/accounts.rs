//! The desktop's models page and its neighbours: his accounts and keys
//! (accounts.tsx), which model does what (roles.tsx), the setup check
//! (check.tsx), plugins (plugins.tsx) and computer use (computer.tsx).

crate::words! { settings:
    /// a key the provider refused, with no words of its own
    key_refused = "the provider refused this key";
    /// an expired sign-in, nothing waiting on it
    expired_alone = "your sign-in expired: sign in again";
    /// an expired sign-in: one agent waits on it
    expired_waits(names) = "your sign-in expired: {names} waits";
    /// an expired sign-in: agents wait on it
    expired_wait(names) = "your sign-in expired: {names} wait";
    /// the names of more than 3 agents: two, and how many more
    names_more(names, more) = "{names} and {more} more";
    /// a subscription's line: sign in for the model that waits
    sign_in_for(model) = "sign in for {model}";
    /// a subscription's line: not signed in
    sign_in_browser = "sign in with your browser";
    /// a subscription's chip: signed in
    signed_in = "signed in";
    /// a subscription's button: expired
    sign_in_again = "sign in again";
    /// a subscription's button; the setup check's act for a model
    sign_in = "sign in";
    /// the terminal onboarding's pay step: the key option (a list in bise's lowercase)
    api_key = "an API key";
    /// settings › models: the key row's title (a row title, sentence case; ui-review m_43805)
    api_key_row = "An API key";
    /// the key row's line, no key yet
    api_key_sub = "Anthropic, OpenAI, Mistral…";
    /// the key row's chip: a key is set
    key_added = "added";
    /// the key row's remove
    key_remove = "remove";
    /// the key row's button
    key_add = "Add a key";
    /// a model waits for its provider's setup
    model_needs(model, provider) = "{model} needs {provider}: sign in or add its key here, then it's set.";
    /// a sign-in under way: copy its link
    signing_copy = "copy the link";
    /// a sign-in under way: cancel it
    cancel = "cancel";
    /// the key field's placeholder
    key_paste = "paste your key, then ⏎";
    /// the key field: ⏎ with nothing typed
    key_first = "paste a key first";
    /// the key field: the provider refused it
    key_check(why) = "{why}. check it, then ⏎ again";
    /// the key field: the core checks it
    key_checking = "checking the key with the provider…";
    /// the key field's help
    key_stays = "it stays on this Mac; esc cancels";

    /// a role's model: set in settings
    role_set_here = "set here";
    /// a role's model: from his environment
    role_from_env = "from your environment";
    /// a role's model: follows another role
    role_follows(role) = "follows {role}";
    /// a role's model: the default
    role_default = "the default";
    /// a role's picker label
    role_model(role) = "{role}'s model";
    /// a role's picker: back to the role it follows
    role_as(role) = "as {role}";
    /// a model whose provider needs its setup first
    role_setup_first(provider) = "{provider}: set up first";
    /// the roles' group
    roles_title = "Which model does what";
    /// the roles' help
    roles_help = "the terminal's /models shows the same";

    /// setup check: the microphone
    perm_mic = "microphone";
    /// setup check: what fn loses without the microphone
    perm_mic_lost = "fn can't hear you without it";
    /// setup check: accessibility
    perm_accessibility = "accessibility";
    /// setup check: what fn loses without accessibility
    perm_accessibility_lost = "fn works only in bise’s own windows without it";
    /// setup check: screen recording
    perm_screen = "screen recording";
    /// setup check: what fn loses without screen recording
    perm_screen_lost = "fn sends your words without a capture without it";
    /// setup check: a permission allowed
    perm_allowed = "allowed";
    /// setup check: a permission denied
    perm_denied(lost) = "denied: {lost}";
    /// setup check: a permission not asked
    perm_not_asked = "not asked yet";
    /// setup check: ask a permission
    perm_allow = "allow";
    /// setup check: the model row
    check_model = "a model";
    /// setup check: a model signed out
    check_signed_out(label) = "{label}: signed out, sign in again";
    /// setup check: no model at all
    check_no_model = "no subscription or key yet: agents can’t answer";
    /// setup check: bise's home
    check_home = "bise’s home";
    /// setup check: bise's home not known yet
    check_home_unknown = "not known yet: check again in a moment";
    /// setup check: bise's home gone
    check_home_gone(path) = "{path} is gone: restart bise and it makes it again";
    /// setup check: a check with no fix
    check_needs_you = "needs you";
    /// setup check: nothing left
    check_all_set = "all set.";
    /// setup check: what is left
    check_left(n) = one "{n} thing needs you." | "{n} things need you.";
    /// setup check: read them again
    check_again = "check again";

    /// plugins: log out
    log_out = "log out";

    /// computer use: the switch's row
    cu_label = "Agents may drive Chrome and your apps";
    /// computer use: on and ready
    cu_ready = "ready: step by step, and you can take the wheel";
    /// computer use: on, not ready
    cu_set_up = "set it up below";
    /// computer use: off
    cu_off = "off: agents never touch your browser or apps";
    /// computer use: the switch's label
    cu_switch = "computer use";
    /// computer use: the first check
    cu_checking = "checking Chrome and its extension…";
    /// computer use: the web steps' group
    cu_web = "In Chrome";
    /// computer use: the apps' steps' group
    cu_apps = "For apps";
    /// computer use: remove it
    cu_uninstall = "Turn off and remove its files";
}
