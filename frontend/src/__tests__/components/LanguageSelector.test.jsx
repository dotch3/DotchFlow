// frontend/src/__tests__/components/LanguageSelector.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageSelector from '../../components/LanguageSelector';
import i18n from '../../i18n';

// Mock i18n
vi.mock('../../i18n', () => ({
  changeLanguage: vi.fn(),
  getSupportedLanguages: vi.fn(() => [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
  ]),
  t: vi.fn((key) => key),
}));

// Mock api
vi.mock('../../api/client', () => ({
  changeLanguage: vi.fn(() => Promise.resolve({ language: 'en' })),
}));

// Mock useAuthStore
vi.mock('../../store/authStore', () => ({
  default: () => ({
    user: { id: 1, language: 'en' },
    updateUser: vi.fn(),
  }),
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with current language button', () => {
    render(<LanguageSelector compact />);
    // Component should render without errors
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('opens dropdown on click', async () => {
    render(<LanguageSelector compact />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Verify dropdown appears (at least one element with language name)
    await waitFor(() => {
      expect(screen.getByText('English')).toBeDefined();
    });
  });
});