// src/i18n/index.js — Backend internationalization
const locales = {
  en: require('./locales/en.json'),
  es: require('./locales/es.json'),
  'pt-BR': require('./locales/pt-BR.json')
};

const DEFAULT_LANGUAGE = 'pt-BR';

/**
 * Get the user's language from the database
 * @param {number} userId - User ID
 * @returns {Promise<string>} Language code
 */
async function getUserLanguage(userId) {
  if (!userId) return DEFAULT_LANGUAGE;
  
  try {
    const { queryOne, getDatabase } = require('../infra/database/db');
    const db = await getDatabase();
    const user = queryOne(db, 'SELECT language FROM users WHERE id = ?', [userId]);
    return user?.language || DEFAULT_LANGUAGE;
  } catch (err) {
    console.error('Error getting user language:', err);
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Get language from request
 * Checks: 1) userId (authenticated), 2) Accept-Language header, 3) default
 * @param {object} req - Express request object
 * @returns {Promise<string>} Language code
 */
async function getRequestLanguage(req) {
  // If user is authenticated, use their preference
  if (req.userId) {
    return await getUserLanguage(req.userId);
  }
  
  // Check Accept-Language header for non-authenticated routes
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,pt-BR;q=0.8")
    const preferredLanguages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase());
    
    for (const lang of preferredLanguages) {
      if (locales[lang]) return lang;
      // Handle en-US, pt-BR variants
      if (lang === 'en' || lang.startsWith('en-')) return 'en';
      if (lang === 'es' || lang.startsWith('es-')) return 'es';
      if (lang.startsWith('pt')) return 'pt-BR';
    }
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Translate a key to the user's language
 * @param {string} key - Dot-separated key (e.g., 'errors.invalidEmail')
 * @param {object} params - Parameters for interpolation
 * @param {string} language - Language code (optional, will be fetched from request if not provided)
 * @param {object} req - Express request object (optional, used to get user language)
 * @returns {Promise<string>} Translated string
 */
async function t(key, params = {}, language = null, req = null) {
  // Get language from request if not provided
  if (!language && req) {
    language = await getRequestLanguage(req);
  }
  language = language || DEFAULT_LANGUAGE;
  
  const locale = locales[language] || locales[DEFAULT_LANGUAGE];
  
  // Navigate to the nested key
  const keys = key.split('.');
  let value = locale;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  // Fallback to default language if key not found
  if (value === undefined && language !== DEFAULT_LANGUAGE) {
    value = locales[DEFAULT_LANGUAGE];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
  }
  
  // Return key if translation not found
  if (value === undefined) {
    console.warn(`Translation not found for key: ${key}`);
    return key;
  }
  
  // Interpolate parameters
  if (typeof value === 'string' && params && Object.keys(params).length > 0) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }
  
  return value;
}

/**
 * Create a translate function bound to a specific request
 * Use this in routes to easily translate messages
 * @param {object} req - Express request object
 * @returns {Function} Bound translate function
 */
function createTranslator(req) {
  return async (key, params = {}) => t(key, params, null, req);
}

module.exports = {
  t,
  createTranslator,
  getUserLanguage,
  getRequestLanguage,
  DEFAULT_LANGUAGE,
  locales
};
