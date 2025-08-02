import { koreanPatterns } from './korean';
import { englishPatterns } from './english';
import { chinesePatterns } from './chinese';
import { japanesePatterns } from './japanese';
import { spanishPatterns } from './spanish';
import { frenchPatterns } from './french';
import { LanguagePatterns, Language } from '../../backend/src/types';

export const allPatterns: Record<Language, LanguagePatterns> = {
  korean: koreanPatterns,
  english: englishPatterns,
  chinese: chinesePatterns,
  japanese: japanesePatterns,
  spanish: spanishPatterns,
  french: frenchPatterns
};

export const getPatternsByLanguage = (language: Language): LanguagePatterns => {
  return allPatterns[language];
};

export const getPatternsByLanguages = (languages: Language[]): LanguagePatterns[] => {
  return languages.map(language => allPatterns[language]);
};

export {
  koreanPatterns,
  englishPatterns,
  chinesePatterns,
  japanesePatterns,
  spanishPatterns,
  frenchPatterns
};