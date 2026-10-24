//! The TUI's `/provider` (onboarding/provider.rs) and its sign-ins
//! (onboarding/signin.rs: the designer's lines, docs/subscriptions-design.md),
//! and the Claude plan lines of `bise login anthropic`, `bise auth status`
//! and `bise doctor` (its monthly API credits, detect.rs).

crate::words! { settings:
    /// a key not removed
    prov_remove_failed(glyph, why) = "{glyph} couldn't remove it: {why}";
    /// a key removed, another source still gives one
    prov_removed_other(from) = "✓ removed. {from} still gives me a key.";
    /// a key removed
    prov_removed(provider) = "✓ removed the {provider} key.";
    /// the model not saved
    prov_write_failed(glyph, why) = "{glyph} couldn't write config.toml: {why}";
    /// signing out
    prov_signing_out = "signing out…";
    /// a key's source: saved by bise
    prov_saved = "saved in bise";
    /// a key's source: a variable or a file
    prov_from(source) = "from {source}";
    /// a provider with no key to set
    prov_no_key = "no key needed";
    /// a provider not set up
    prov_not_set_up = "not set up";
    /// the plan signed in
    prov_signed_in = "signed in";
    /// the plan signed out
    prov_signed_out = "signed out";
    /// the plan's sign-in expired
    prov_expired = "sign-in expired · ⏎ sign in again";
    /// the roles: none
    prov_no_role = "no role uses it yet. /models picks one.";
    /// the roles: one
    prov_role_one(role) = "{role} uses it. /models changes that.";
    /// the roles: more
    prov_role_more(roles, last) = "{roles} and {last} use it. /models changes that.";
    /// providers' names past three
    prov_more_names(names, n) = "{names} and {n} more";
    /// the list's title
    prov_title = "providers";
    /// the list's line
    prov_sub = "the keys i can use. enter sets one up or changes it.";
    /// the list's filter, empty
    prov_filter = "type to filter";
    /// the list: no match
    prov_none = "  no provider matches.";
    /// the list's last row
    prov_more = "more providers…";
    /// the keys in files (macOS)
    prov_keychain = "keys are kept in files in ~/.bise · /keychain keeps them in the macOS keychain";
    /// key bar: the list
    bar_choose_open = "↑↓ choose   ⏎ open   esc back";
    /// a provider's menu: no key needed
    prov_no_key_mark = "✓ no key needed";
    /// a provider's menu: ready
    prov_ready(from) = "✓ ready · {from}";
    /// a provider's menu: a key set elsewhere
    prov_change_there = "change it where you set it, or paste one here.";
    /// a menu item: paste
    prov_item_paste = "paste a new key";
    /// a menu item: the keys page
    prov_item_keys = "open the keys page";
    /// a menu item: billing
    prov_item_billing = "open billing";
    /// a menu item: remove
    prov_item_remove = "remove the key";
    /// a menu item: sign in
    prov_item_sign_in = "sign in again or switch account";
    /// a menu item: sign out
    prov_item_sign_out = "sign out";
    /// a menu item: the plan's usage
    prov_item_usage = "your plan's usage on chatgpt.com ↗";
    /// remove: no role stops
    prov_stop_none(provider) = "agents on {provider} models stop until you add one again.";
    /// remove: one role stops
    prov_stop_one(role, provider) = "{role} uses {provider}. without the key it stops.";
    /// remove: roles stop
    prov_stop_more(roles, last, provider) = "{roles} and {last} use {provider}. without the key they stop.";
    /// remove: the ask
    prov_remove_ask(provider) = "remove the {provider} key saved in bise?";
    /// remove: another source
    prov_still_gives(from) = "{from} still gives me a key.";
    /// key bar: remove
    bar_remove = "⏎ remove   esc keep it";
    /// the plan answered, no account known
    prov_chatgpt_answered = "ChatGPT answered.";
    /// the plan ready
    prov_plan_ready = "your ChatGPT plan is ready. /models picks the roles it runs.";
    /// key bar: ok
    bar_ok = "⏎ ok";
    /// a model ready, the one he wanted
    prov_switches(provider, model) = "{provider} is ready. enter switches to {model}.";
    /// main's default model changed
    prov_default_now(model) = "main's default model is now {model}.";
    /// a key ready
    prov_key_ready(provider) = "{provider} is ready. agents use the key from their next message.";

    /// sign-in: esc, or 5 minutes without an answer
    signin_unfinished = "▲ the sign-in wasn't finished. try again, or pick another way.";
    /// sign-in: plan use refused
    signin_denied = "▲ ChatGPT signed you in but didn't let bise use your plan. try again and allow it, or pick another way.";
    /// the plan's limit reached
    signin_limit = "▲ your ChatGPT plan's limit for bise is reached. your usage is at chatgpt.com/settings/usage, or switch model with /model.";
    /// the limit line's words that link to the usage page
    signin_limit_link = "chatgpt.com/settings/usage";
    /// plan use off
    signin_plan_off = "▲ ChatGPT plan use is off for bise. turn it on in your ChatGPT settings, or pick another provider in /provider.";
    /// the plan's usage unchecked
    signin_unchecked = "▲ ChatGPT couldn't check your plan's usage. try again in a moment, or switch model with /model.";
    /// the sign-in expired
    signin_expired = "▲ your ChatGPT sign-in expired. sign in again in /provider, or run bise login chatgpt.";
    /// OpenRouter gave no key
    signin_or_denied = "▲ OpenRouter didn't give bise a key. try again, or pick another way.";
    /// no ChatGPT provider
    signin_no_chatgpt = "▲ this bise has no ChatGPT provider yet.";
    /// sign-out stopped
    signin_stopped = "it stopped";
    /// signed out
    signin_signed_out = "✓ signed out of ChatGPT.";
    /// signed out, not confirmed
    signin_signed_out_here = "✓ signed out here. ChatGPT didn't confirm: to be sure, remove bise in your ChatGPT settings.";
    /// sign-out failed
    signin_sign_out_failed(why) = "▲ couldn't sign out: {why}";

    /// `bise doctor` and `bise auth status`: Claude Code signed in with a
    /// Claude plan (detect.rs, presence only)
    claude_code_seen(cli) = "Claude plan found in Claude Code. Max and Team include monthly API credits bise can use: {cli} login anthropic shows how.";
    /// `bise login anthropic`: the row's label for a Claude plan's credits
    login_claude_plan = "on Max or Team?";
    /// `bise login anthropic`: what to do with the plan's credits
    login_claude_credits = "your plan's monthly API credits pay for this key: on claude.ai, Settings › Billing › API credits › Link organization, then make the key in that Console organization. Pro has none.";
    /// `bise login anthropic`: the help article's row label
    login_claude_how = "how it works";
}
