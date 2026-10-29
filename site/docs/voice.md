---
title: voice and fn
description: talk to bise instead of typing. in bise desktop, hold fn from any app. in bise terminal, ctrl+r dictates, and ctrl+r twice starts voice mode.
---

::: desktop hold fn, fn fn, fn space
## fn, from any app

| key | what it does |
|---|---|
| `hold fn` | talk to bise, with what is in front of you; your words go when you let go |
| `fn fn` | hands-free: talk without holding; `fn` again stops |
| `fn space` | the spotlight: find an agent, or ask bise by typing |

bise's answer shows in a small panel over the app you're in; a long one offers the rest in the window. with bise's window in front, `fn fn` starts [voice mode](#voice-mode) with the agent in view.

when you hold `fn`, bise adds what is in front of you to your question: a screenshot of the window in front (never the whole screen), the tab's URL and title (Chrome, Safari, Arc), the open file and your selection (VS Code, Cursor, Xcode, Zed), and the text of the window. settings › context and privacy turns each one off, says how long images are kept, and lists the apps `fn` never reads.

`fn` needs three macOS permissions, asked the first time you hold it: see [permissions for fn](desktop#permissions-for-fn). settings › voice and fn turns hold and `fn fn` on or off, and sets the language bise hears.

in the composer, `ctrl+r` dictates, as below.
:::

## dictation

`ctrl+r` in the composer records; any key stops and keeps the text in the composer, ready to edit and send. `esc` or `ctrl+c` stops and drops it.

dictation and `fn` need a speech-to-text model, the **voice** role. with a Mistral or an OpenAI key, bise picks one for you. settings › voice and fn in bise desktop, `/voice` in bise terminal, show what is set and change it.

| provider | models | key |
|---|---|---|
| Mistral | `mistral/voxtral-mini-transcribe-3`, `mistral/voxtral-small-transcribe-3` | `MISTRAL_API_KEY` |
| OpenAI | `openai/gpt-transcribe`, `openai/gpt-4o-mini-transcribe`, `openai/gpt-4o-transcribe`, `openai/whisper-1` | `OPENAI_API_KEY` |
| Groq | `groq/whisper-large-v3-turbo`, `groq/whisper-large-v3` | `GROQ_API_KEY` |
| ElevenLabs | `elevenlabs/scribe_v2`, `elevenlabs/scribe_v1` | `ELEVENLABS_API_KEY` |
| Deepgram | `deepgram/nova-3` | `DEEPGRAM_API_KEY` |

in a terminal, `bise models voice` lists them with the state of each key.

## voice mode

voice mode is a spoken conversation with the agent in view: you talk, and it answers out loud.

::: desktop fn fn, with bise in front
with bise's window in front, `fn fn` starts voice mode with the agent in view, or ends it. with no thread in view, bise's own thread opens and voice mode starts there.
:::

::: terminal ctrl+r twice
`ctrl+r` twice starts voice mode.

| key | in voice mode |
|---|---|
| `space` | send now |
| `hold space` | keep the floor, or cut in when it talks on speakers |
| `m` | mute |
| `tab` | type instead |
| `esc` | leave voice mode (`ctrl+c` too) |
:::

with headphones it listens hands-free. on speakers you hold `space` while you talk, so it doesn't hear itself. today only Mistral's voice model speaks, so voice mode needs a Mistral key.

by default it reads aloud what needs you and what you asked. the first time, voice mode says who hears you: your audio goes to the speech-to-text provider, and the text it speaks goes to Mistral.

## settings

`/voice` in bise terminal changes all of these; bise desktop's settings › voice and fn has the language. they live in `[voice]`:

```toml title="~/.bise/config.toml"
[roles]
voice = "mistral/voxtral-mini-transcribe-3"   # dictation's model

[voice]
language = "fr"                          # unset: detected
vocabulary = ["bise", "config.toml"]     # words to spell right
listen = "auto"                          # auto (hands-free with headphones, hold on speakers), hands-free, hold
tts_voice = "…"                          # the voice it speaks with; unset: the default voice
speed = 1.0                              # 0.8 to 1.6
read_aloud = "needs"                     # needs (what needs you + what you asked), all, nothing
sounds = true
```

`BISE_VOICE_MODEL` sets the dictation model for one session.
