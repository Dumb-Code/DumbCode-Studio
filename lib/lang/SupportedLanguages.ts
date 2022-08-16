const SupportedLanguages = ["en", "de"] as const

export type SupportedLanguage = typeof SupportedLanguages[number]

export const isSupportedLanguage = (language: string): language is SupportedLanguage => {
  return SupportedLanguages.includes(language as SupportedLanguage)
}

export default SupportedLanguages