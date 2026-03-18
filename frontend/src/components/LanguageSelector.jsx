// src/components/LanguageSelector.jsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Loader2 } from 'lucide-react';
import { getSupportedLanguages } from '../i18n';
import { changeLanguage as apiChangeLanguage } from '../api/client';
import useAuthStore from '../store/authStore';

export default function LanguageSelector({ compact = false }) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { user, updateUser } = useAuthStore();

  const languages = getSupportedLanguages();
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode) => {
    setIsLoading(true);
    try {
      // If user is logged in, save to backend
      if (user) {
        const updatedUser = await apiChangeLanguage(langCode);
        updateUser({ language: updatedUser.language });
      } else {
        // Just change locally for non-logged in users
        localStorage.setItem('dotchflow_language', langCode);
        i18n.changeLanguage(langCode);
      }
      setIsOpen(false);
      // Refresh page to update all translations
      window.location.reload();
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-opacity-10 hover:bg-white"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <span className="text-base">{currentLang.flag}</span>
              <ChevronDown size={14} />
            </>
          )}
        </button>

        {isOpen && !isLoading && (
          <div 
            className="absolute right-0 mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[120px]"
            style={{ 
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isLoading}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  i18n.language === lang.code ? 'font-medium' : ''
                }`}
                style={{ 
                  color: i18n.language === lang.code ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  background: i18n.language === lang.code ? 'var(--color-primary-muted)' : 'transparent'
                }}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label 
        className="block text-sm font-medium"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {t('common.loading', 'Loading...')}
          </span>
        ) : (
          t('profile.language')
        )}
      </label>
      
      <div className="grid grid-cols-3 gap-2" ref={dropdownRef}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isLoading}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
              i18n.language === lang.code 
                ? 'ring-2 ring-offset-2' 
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{ 
              background: i18n.language === lang.code 
                ? 'var(--color-primary-muted)' 
                : 'var(--color-bg-secondary)',
              ringColor: i18n.language === lang.code ? 'var(--color-primary)' : 'transparent',
              color: 'var(--color-text-primary)',
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading && i18n.language === lang.code ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <span className="text-2xl">{lang.flag}</span>
            )}
            <span className="text-xs font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
