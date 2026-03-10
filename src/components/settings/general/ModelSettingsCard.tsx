import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { LanguageSelector } from "../LanguageSelector";
import { TranslateToEnglish } from "../TranslateToEnglish";
import { useModelStore } from "../../../stores/modelStore";
import { useSettings } from "../../../hooks/useSettings";
import { ResetButton } from "../../ui/ResetButton";
import type { ModelInfo } from "@/bindings";

export const ModelSettingsCard: React.FC = () => {
  const { t } = useTranslation();
  const { currentModel, models } = useModelStore();
  const { getSetting, updateSetting, isUpdating } = useSettings();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const currentModelInfo = models.find((m: ModelInfo) => m.id === currentModel);

  const supportsLanguageSelection =
    currentModelInfo?.engine_type === "Whisper" ||
    currentModelInfo?.engine_type === "SenseVoice";
  const supportsInitialPrompt =
    currentModelInfo?.engine_type === "Whisper";
  const supportsTranslation = currentModelInfo?.supports_translation ?? false;
  const hasAnySettings = supportsLanguageSelection || supportsTranslation;

  const customInitialPrompt =
    (getSetting("custom_initial_prompt") as string | null | undefined) ?? "";

  // Don't render anything if no model is selected or no settings available
  if (!currentModel || !currentModelInfo || !hasAnySettings) {
    return null;
  }

  const handlePromptChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    await updateSetting(
      "custom_initial_prompt",
      value === "" ? null : value,
    );
  };

  const handlePromptReset = async () => {
    await updateSetting("custom_initial_prompt", null);
  };

  return (
    <SettingsGroup
      title={t("settings.modelSettings.title", {
        model: currentModelInfo.name,
      })}
    >
      {supportsLanguageSelection && (
        <LanguageSelector
          descriptionMode="tooltip"
          grouped={true}
          supportedLanguages={currentModelInfo.supported_languages}
        />
      )}
      {supportsTranslation && (
        <TranslateToEnglish descriptionMode="tooltip" grouped={true} />
      )}
      {supportsInitialPrompt && (
        <div className="px-4 py-2">
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-mid-gray hover:text-text transition-colors duration-150 cursor-pointer"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${advancedOpen ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {t("settings.general.language.advancedOptions")}
          </button>

          {advancedOpen && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">
                  {t("settings.general.language.initialPrompt.title")}
                </label>
                <ResetButton
                  onClick={handlePromptReset}
                  disabled={isUpdating("custom_initial_prompt")}
                />
              </div>
              <textarea
                value={customInitialPrompt}
                onChange={handlePromptChange}
                placeholder={t(
                  "settings.general.language.initialPrompt.placeholder",
                )}
                disabled={isUpdating("custom_initial_prompt")}
                className={`w-full px-2 py-1 text-sm bg-mid-gray/10 border border-mid-gray/80 rounded-md resize-y min-h-[60px] transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-logo-primary focus:border-logo-primary ${
                  isUpdating("custom_initial_prompt")
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-logo-primary/10 hover:border-logo-primary"
                }`}
              />
              <p className="text-xs text-mid-gray/70">
                {t("settings.general.language.initialPrompt.description")}
              </p>
            </div>
          )}
        </div>
      )}
    </SettingsGroup>
  );
};
