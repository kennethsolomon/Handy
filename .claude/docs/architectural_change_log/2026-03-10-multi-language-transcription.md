# Multi-Language Transcription Support

**Date:** 2026-03-10
**Type:** Feature Addition / Schema Change
**Branch:** feat/multi-language-transcription

## Summary

Added multi-language selection and code-switching support to the transcription pipeline, enabling users to select multiple languages simultaneously and bias Whisper's decoder for mixed-language speech.

## What Changed

- **New module:** `src-tauri/src/prompt_bank.rs` — language sample bank and initial prompt generation
- **Settings schema:** `selected_language: String` → `selected_languages: Vec<String>` with serde backward compat
- **New setting:** `custom_initial_prompt: Option<String>` for power users
- **Transcription logic:** Multi-language branch in Whisper/SenseVoice engine selection
- **Frontend:** LanguageSelector rewritten as multi-select with presets

## Before & After

| Aspect | Before | After |
|--------|--------|-------|
| Language selection | Single dropdown (`String`) | Multi-select with chips (`Vec<String>`) |
| Whisper initial_prompt | Unused | Auto-generated from prompt bank or custom |
| Code-switching | Not supported | Supported via language pair presets |
| Settings migration | N/A | Custom serde deserializer handles old `String` format |

## Affected Components

- `settings.rs` — schema + deserialization
- `transcription.rs` — engine parameter selection
- `actions.rs` — post-processing language context
- `shortcut/mod.rs` — new Tauri commands with input validation
- `LanguageSelector.tsx` — complete rewrite
- `ModelSettingsCard.tsx` — advanced options section
- `settingsStore.ts` — new updaters
- `bindings.ts` — new command bindings

## Migration / Compatibility

- **Backward compatible:** Old settings with `"selected_language": "en"` are automatically migrated to `["en"]` via custom serde visitor
- **No breaking changes** to existing behavior — single language selection works identically
