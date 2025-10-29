// Shared language constants for all translation screens

export const SOURCE_LANGUAGES = [
  { code: 'auto', name: 'Auto Detect', flag: '🌐', fullName: 'Auto Detect' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', fullName: 'Vietnamese' },
  { code: 'en', name: 'English', flag: '🇬🇧', fullName: 'English' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', fullName: 'Spanish' },
  { code: 'fr', name: 'French', flag: '🇫🇷', fullName: 'French' },
  { code: 'de', name: 'German', flag: '🇩🇪', fullName: 'German' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', fullName: 'Japanese' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', fullName: 'Korean' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', fullName: 'Chinese' },
  { code: 'th', name: 'Thai', flag: '🇹🇭', fullName: 'Thai' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', fullName: 'Indonesian' },
];

export const TARGET_LANGUAGES = SOURCE_LANGUAGES.filter(l => l.code !== 'auto');

// Map language codes to full names for API calls
export const LANGUAGE_NAME_MAP = {
  'vi': 'Vietnamese',
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'th': 'Thai',
  'id': 'Indonesian',
};

// Get language name by code
export const getLanguageName = (code) => {
  return LANGUAGE_NAME_MAP[code] || code;
};

// Get language by code
export const getLanguageByCode = (code) => {
  return SOURCE_LANGUAGES.find(l => l.code === code) || SOURCE_LANGUAGES[0];
};
