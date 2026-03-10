import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SettingContainer } from "../ui/SettingContainer";
import { ResetButton } from "../ui/ResetButton";
import { useSettings } from "../../hooks/useSettings";
import { LANGUAGES, LANGUAGE_PRESETS } from "../../lib/constants/languages";

interface LanguageSelectorProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
  supportedLanguages?: string[];
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  descriptionMode = "tooltip",
  grouped = false,
  supportedLanguages,
}) => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, resetSetting, isUpdating } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLanguages: string[] =
    (getSetting("selected_languages") as string[] | undefined) || ["auto"];

  const isAutoMode =
    selectedLanguages.length === 1 && selectedLanguages[0] === "auto";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const availableLanguages = useMemo(() => {
    if (!supportedLanguages || supportedLanguages.length === 0)
      return LANGUAGES;
    return LANGUAGES.filter(
      (lang) =>
        lang.value === "auto" || supportedLanguages.includes(lang.value),
    );
  }, [supportedLanguages]);

  const filteredLanguages = useMemo(
    () =>
      availableLanguages.filter((language) =>
        language.label.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, availableLanguages],
  );

  const activePreset = LANGUAGE_PRESETS.find(
    (preset) =>
      preset.languages.length === selectedLanguages.length &&
      preset.languages.every((l) => selectedLanguages.includes(l)),
  );

  const handleLanguageToggle = async (languageCode: string) => {
    if (isUpdating("selected_languages")) return;

    if (languageCode === "auto") {
      await updateSetting("selected_languages", ["auto"]);
      return;
    }

    const isSelected = selectedLanguages.includes(languageCode);

    let newLanguages: string[];
    if (isSelected) {
      newLanguages = selectedLanguages.filter((l) => l !== languageCode);
      if (newLanguages.length === 0) {
        newLanguages = ["auto"];
      }
    } else {
      newLanguages = selectedLanguages.filter((l) => l !== "auto");
      newLanguages.push(languageCode);
    }

    await updateSetting("selected_languages", newLanguages);
  };

  const handleRemoveLanguage = async (languageCode: string) => {
    if (isUpdating("selected_languages")) return;

    const newLanguages = selectedLanguages.filter((l) => l !== languageCode);
    if (newLanguages.length === 0) {
      await updateSetting("selected_languages", ["auto"]);
    } else {
      await updateSetting("selected_languages", newLanguages);
    }
  };

  const handlePresetClick = async (presetLanguages: string[]) => {
    if (isUpdating("selected_languages")) return;
    await updateSetting("selected_languages", [...presetLanguages]);
  };

  const handleReset = async () => {
    await resetSetting("selected_languages");
  };

  const handleToggle = () => {
    if (isUpdating("selected_languages")) return;
    setIsOpen(!isOpen);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && filteredLanguages.length > 0) {
      handleLanguageToggle(filteredLanguages[0].value);
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const getLanguageLabel = (code: string): string => {
    return (
      LANGUAGES.find((lang) => lang.value === code)?.label ||
      t("settings.general.language.auto")
    );
  };

  return (
    <SettingContainer
      title={t("settings.general.language.title")}
      description={t("settings.general.language.description")}
      descriptionMode={descriptionMode}
      grouped={grouped}
    >
      <div className="flex flex-col gap-2">
        {/* Presets */}
        {LANGUAGE_PRESETS.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-mid-gray/70">
              {t("settings.general.language.presets")}:
            </span>
            {LANGUAGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-all duration-150 ${
                  activePreset?.id === preset.id
                    ? "bg-logo-primary/20 border-logo-primary text-logo-primary"
                    : "border-mid-gray/40 bg-mid-gray/10 hover:bg-logo-primary/10 hover:border-logo-primary"
                } ${isUpdating("selected_languages") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => handlePresetClick(preset.languages)}
                disabled={isUpdating("selected_languages")}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Selected chips + dropdown trigger */}
        <div className="flex items-center space-x-1">
          <div className="relative flex-1" ref={dropdownRef}>
            {/* Chip area / trigger */}
            <button
              type="button"
              className={`w-full px-2 py-1 text-sm bg-mid-gray/10 border border-mid-gray/80 rounded min-w-[200px] text-start flex items-center justify-between transition-all duration-150 ${
                isUpdating("selected_languages")
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-logo-primary/10 cursor-pointer hover:border-logo-primary"
              }`}
              onClick={handleToggle}
              disabled={isUpdating("selected_languages")}
            >
              <div className="flex flex-wrap gap-1 flex-1">
                {isAutoMode ? (
                  <span className="text-sm font-semibold">
                    {t("settings.general.language.auto")}
                  </span>
                ) : (
                  selectedLanguages.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-logo-primary/20 border border-logo-primary"
                    >
                      {getLanguageLabel(code)}
                      <span
                        role="button"
                        tabIndex={0}
                        className="ml-1 hover:text-logo-primary cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLanguage(code);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            handleRemoveLanguage(code);
                          }
                        }}
                        aria-label="remove"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    </span>
                  ))
                )}
              </div>
              <svg
                className={`w-4 h-4 ms-2 shrink-0 transition-transform duration-200 ${
                  isOpen ? "transform rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isOpen && !isUpdating("selected_languages") && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-mid-gray/80 rounded shadow-lg z-50 max-h-60 overflow-hidden">
                {/* Search input */}
                <div className="p-2 border-b border-mid-gray/80">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    placeholder={t(
                      "settings.general.language.searchPlaceholder",
                    )}
                    className="w-full px-2 py-1 text-sm bg-mid-gray/10 border border-mid-gray/40 rounded focus:outline-none focus:ring-1 focus:ring-logo-primary focus:border-logo-primary"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {filteredLanguages.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-mid-gray text-center">
                      {t("settings.general.language.noResults")}
                    </div>
                  ) : (
                    filteredLanguages.map((language) => {
                      const isSelected =
                        language.value === "auto"
                          ? isAutoMode
                          : selectedLanguages.includes(language.value);

                      return (
                        <button
                          key={language.value}
                          type="button"
                          className={`w-full px-2 py-1 text-sm text-start hover:bg-logo-primary/10 transition-colors duration-150 ${
                            isSelected
                              ? "bg-logo-primary/20 text-logo-primary font-semibold"
                              : ""
                          }`}
                          onClick={() =>
                            handleLanguageToggle(language.value)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{language.label}</span>
                            {isSelected && (
                              <svg
                                className="w-4 h-4 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          <ResetButton
            onClick={handleReset}
            disabled={isUpdating("selected_languages")}
          />
        </div>
      </div>
      {isUpdating("selected_languages") && (
        <div className="absolute inset-0 bg-mid-gray/10 rounded flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-logo-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </SettingContainer>
  );
};
