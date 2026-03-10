use std::collections::HashMap;

use once_cell::sync::Lazy;

/// Sample sentences per language code used to bias Whisper's initial_prompt
/// for better code-switching recognition.
static LANGUAGE_SAMPLES: Lazy<HashMap<&str, &str>> = Lazy::new(|| {
    let mut m = HashMap::new();
    m.insert(
        "en",
        "Hello, how are you doing today? I think we should check the project status.",
    );
    m.insert("tl", "Kumusta ka na? Ano na ang balita sa project natin?");
    m.insert(
        "es",
        "Hola, ¿cómo estás? Creo que deberíamos revisar el estado del proyecto.",
    );
    m.insert(
        "fr",
        "Bonjour, comment allez-vous? Je pense qu'on devrait vérifier l'état du projet.",
    );
    m.insert(
        "ja",
        "こんにちは、お元気ですか？プロジェクトの状況を確認しましょう。",
    );
    m.insert(
        "ko",
        "안녕하세요, 잘 지내세요? 프로젝트 상태를 확인해 봅시다.",
    );
    m.insert("zh", "你好，你怎么样？我觉得我们应该检查一下项目的状态。");
    m.insert(
        "de",
        "Hallo, wie geht es Ihnen? Ich denke, wir sollten den Projektstatus überprüfen.",
    );
    m.insert(
        "pt",
        "Olá, como você está? Acho que devemos verificar o status do projeto.",
    );
    m.insert(
        "it",
        "Ciao, come stai? Penso che dovremmo controllare lo stato del progetto.",
    );
    m.insert(
        "ru",
        "Привет, как дела? Думаю, нам стоит проверить статус проекта.",
    );
    m.insert(
        "hi",
        "नमस्ते, आप कैसे हैं? मुझे लगता है हमें प्रोजेक्ट की स्थिति जांचनी चाहिए।",
    );
    m.insert(
        "vi",
        "Xin chào, bạn khỏe không? Tôi nghĩ chúng ta nên kiểm tra tình trạng dự án.",
    );
    m.insert(
        "ar",
        "مرحبا، كيف حالك؟ أعتقد أنه يجب علينا التحقق من حالة المشروع.",
    );
    m.insert("th", "สวัสดี สบายดีไหม? ฉันคิดว่าเราควรตรวจสอบสถานะโปรเจกต์");
    m
});

/// Optimized prompts for specific language pair combinations (code-switching).
/// These contain mixed-language text that demonstrates natural switching patterns.
static PAIR_PROMPTS: Lazy<HashMap<(&str, &str), &str>> = Lazy::new(|| {
    let mut m = HashMap::new();
    // Taglish (Tagalog + English)
    m.insert(
        ("en", "tl"),
        "Okay so ang gagawin natin is i-open yung settings tapos click mo yung button sa right side. Pagkatapos, i-check mo kung nag-update na. Sige, let me know kung may problem pa.",
    );
    // Spanglish (Spanish + English)
    m.insert(
        ("en", "es"),
        "So básicamente what we need to do es revisar el código and make sure que todo funciona bien antes del deadline.",
    );
    // Hinglish (Hindi + English)
    m.insert(
        ("en", "hi"),
        "So basically humein ye check karna hai ki project ka status kya hai and then we can decide next steps.",
    );
    m
});

/// Returns an initial prompt for Whisper based on the selected languages.
///
/// - For a single language or "auto": returns `None` (no biasing needed).
/// - For two or more languages: returns a combined prompt with sample text
///   to bias Whisper toward recognizing code-switching patterns.
///
/// The returned prompt is kept under ~200 tokens to stay within Whisper's
/// 224-token initial_prompt limit.
pub fn get_initial_prompt(languages: &[String]) -> Option<String> {
    // No biasing for single language or auto
    if languages.len() < 2 {
        return None;
    }
    if languages.len() == 1 && languages[0] == "auto" {
        return None;
    }

    // Normalize and sort for consistent lookup
    let mut normalized: Vec<&str> = languages.iter().map(|l| normalize_lang_code(l)).collect();
    normalized.sort();
    normalized.dedup();

    if normalized.len() < 2 {
        return None;
    }

    // Check for an optimized pair prompt first (try both orderings)
    if normalized.len() == 2 {
        let pair = (normalized[0], normalized[1]);
        if let Some(prompt) = PAIR_PROMPTS.get(&pair) {
            return Some(prompt.to_string());
        }
        // Try reverse
        let pair_rev = (normalized[1], normalized[0]);
        if let Some(prompt) = PAIR_PROMPTS.get(&pair_rev) {
            return Some(prompt.to_string());
        }
    }

    // Fall back to combining individual language samples
    let mut parts: Vec<&str> = Vec::new();
    for lang in &normalized {
        if let Some(sample) = LANGUAGE_SAMPLES.get(lang) {
            parts.push(sample);
        }
    }

    if parts.is_empty() {
        return None;
    }

    // Join samples, keeping total reasonably short
    let combined = parts.join(" ");

    // Rough token estimate: ~4 chars per token for English, less for CJK
    // Truncate to ~800 chars to stay well under 224 tokens
    if combined.chars().count() > 800 {
        // Truncate at char boundary, then trim to avoid splitting mid-word
        let truncated: String = combined.chars().take(800).collect();
        let trimmed = truncated.trim_end();
        Some(trimmed.to_string())
    } else {
        Some(combined)
    }
}

/// Normalizes language codes for lookup (e.g., "zh-Hans" → "zh", "pt-BR" → "pt").
fn normalize_lang_code(code: &str) -> &str {
    match code {
        "zh-Hans" | "zh-Hant" => "zh",
        _ => code.split(&['-', '_'][..]).next().unwrap_or(code),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_single_language_returns_none() {
        assert!(get_initial_prompt(&["en".to_string()]).is_none());
    }

    #[test]
    fn test_auto_returns_none() {
        assert!(get_initial_prompt(&["auto".to_string()]).is_none());
    }

    #[test]
    fn test_taglish_returns_pair_prompt() {
        let result = get_initial_prompt(&["tl".to_string(), "en".to_string()]);
        assert!(result.is_some());
        let prompt = result.unwrap();
        assert!(prompt.contains("gagawin"));
        assert!(prompt.contains("settings"));
    }

    #[test]
    fn test_taglish_order_independent() {
        let a = get_initial_prompt(&["en".to_string(), "tl".to_string()]);
        let b = get_initial_prompt(&["tl".to_string(), "en".to_string()]);
        assert_eq!(a, b);
    }

    #[test]
    fn test_unknown_pair_falls_back_to_samples() {
        let result = get_initial_prompt(&["de".to_string(), "fr".to_string()]);
        assert!(result.is_some());
        let prompt = result.unwrap();
        assert!(prompt.contains("Hallo"));
        assert!(prompt.contains("Bonjour"));
    }

    #[test]
    fn test_chinese_variant_normalized() {
        let result = get_initial_prompt(&["zh-Hans".to_string(), "en".to_string()]);
        assert!(result.is_some());
    }

    #[test]
    fn test_empty_languages_returns_none() {
        assert!(get_initial_prompt(&[]).is_none());
    }

    #[test]
    fn test_duplicate_languages_deduplicated() {
        // Two identical languages after dedup → single language → None
        let result = get_initial_prompt(&["en".to_string(), "en".to_string()]);
        assert!(result.is_none());
    }

    #[test]
    fn test_three_languages_combines_samples() {
        let result =
            get_initial_prompt(&["en".to_string(), "fr".to_string(), "de".to_string()]);
        assert!(result.is_some());
        let prompt = result.unwrap();
        assert!(prompt.contains("Hello"));
        assert!(prompt.contains("Bonjour"));
        assert!(prompt.contains("Hallo"));
    }

    #[test]
    fn test_unknown_language_code_returns_none() {
        // Two unknown codes → no samples → None
        let result = get_initial_prompt(&["xx".to_string(), "yy".to_string()]);
        assert!(result.is_none());
    }

    #[test]
    fn test_one_known_one_unknown_returns_some() {
        let result = get_initial_prompt(&["en".to_string(), "xx".to_string()]);
        // Only one sample found → parts has 1 entry → not empty → Some
        assert!(result.is_some());
    }

    #[test]
    fn test_spanglish_pair_prompt() {
        let result = get_initial_prompt(&["en".to_string(), "es".to_string()]);
        assert!(result.is_some());
        let prompt = result.unwrap();
        assert!(prompt.contains("básicamente"));
    }

    #[test]
    fn test_hinglish_pair_prompt() {
        let result = get_initial_prompt(&["en".to_string(), "hi".to_string()]);
        assert!(result.is_some());
        let prompt = result.unwrap();
        assert!(prompt.contains("humein"));
    }

    #[test]
    fn test_normalize_lang_code_with_region() {
        assert_eq!(normalize_lang_code("pt-BR"), "pt");
        assert_eq!(normalize_lang_code("en-US"), "en");
    }

    #[test]
    fn test_normalize_lang_code_with_underscore() {
        assert_eq!(normalize_lang_code("zh_CN"), "zh");
    }

    #[test]
    fn test_normalize_zh_hant() {
        assert_eq!(normalize_lang_code("zh-Hant"), "zh");
    }

    #[test]
    fn test_normalize_plain_code() {
        assert_eq!(normalize_lang_code("en"), "en");
        assert_eq!(normalize_lang_code("tl"), "tl");
    }

    #[test]
    fn test_combined_prompt_truncated_to_at_most_800_chars() {
        // All 15 languages combined exceed 800 chars, so the prompt gets truncated
        let all_langs: Vec<String> = vec![
            "en", "tl", "es", "fr", "ja", "ko", "zh", "de", "pt", "it", "ru", "hi", "vi",
            "ar", "th",
        ]
        .into_iter()
        .map(String::from)
        .collect();
        let result = get_initial_prompt(&all_langs);
        assert!(result.is_some());
        let prompt = result.unwrap();
        // Truncation at 800 chars then trimmed — result is at most 800 chars
        assert!(prompt.chars().count() <= 800);
        assert!(prompt.chars().count() > 700); // still substantial
    }
}
