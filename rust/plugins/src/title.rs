//! A plugin's display name when its source gives none (ui-review #5,
//! architect m_41511): `google_calendar` -> `Google Calendar`. Pure; the
//! catalog applies it once, where a row gets its title, so every reader
//! (the summary, the desktop, the TUI) shows the same name.

/// Words plain capitalization gets wrong, lowercase -> as people write them.
const WORDS: &[(&str, &str)] = &[
    ("ai", "AI"),
    ("api", "API"),
    ("aws", "AWS"),
    ("crm", "CRM"),
    ("github", "GitHub"),
    ("gitlab", "GitLab"),
    ("hubspot", "HubSpot"),
    ("mcp", "MCP"),
    ("pdf", "PDF"),
    ("sql", "SQL"),
    ("url", "URL"),
];

/// `name` as people read it: split on `_ - .`, each word capitalized (or
/// as [`WORDS`] writes it), joined by spaces. A name with a capital or a
/// space already is someone's own casing: kept as is.
pub fn display_name(name: &str) -> String {
    let name = name.trim();
    if name.chars().any(|c| c.is_uppercase() || c == ' ') {
        return name.to_string();
    }
    name.split(['_', '-', '.'])
        .filter(|w| !w.is_empty())
        .map(|w| match WORDS.iter().find(|(k, _)| *k == w) {
            Some((_, v)) => (*v).to_string(),
            None => {
                let mut cs = w.chars();
                cs.next().map(|c| c.to_uppercase().chain(cs).collect()).unwrap_or_default()
            }
        })
        .collect::<Vec<String>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::display_name;

    #[test]
    fn ids_read_as_names() {
        for (name, title) in [
            ("google_calendar", "Google Calendar"),
            ("outlook", "Outlook"),
            ("bise-stats", "Bise Stats"),
            ("image.generation", "Image Generation"),
            ("github", "GitHub"),
            ("mcp_api_url", "MCP API URL"),
            ("open_ai", "Open AI"),
            ("Linear", "Linear"),
            ("HubSpot CRM", "HubSpot CRM"),
            ("  airtable ", "Airtable"),
            ("", ""),
            ("__", ""),
        ] {
            assert_eq!(display_name(name), title, "{name:?}");
        }
    }
}
