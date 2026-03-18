// frontend/src/__tests__/store/authStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../i18n', () => ({
  default: {
    changeLanguage: vi.fn(),
    t: vi.fn((key) => key),
  },
  changeLanguage: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
}));

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(),
      removeItem: vi.fn(),
      getItem: vi.fn(),
    });
  });

  it('login successful - syncs language from user', async () => {
    const { default: useAuthStore } = await import('../../store/authStore');
    const api = await import('../../api/client');
    const i18n = await import('../../i18n');
    
    const mockUser = { id: 1, email: 'test@test.com', language: 'es' };
    api.login.mockResolvedValueOnce({ user: mockUser, token: 'abc123' });

    const store = useAuthStore.getState();
    await store.login('test@test.com', 'password');

    expect(api.login).toHaveBeenCalledWith('test@test.com', 'password');
    expect(localStorage.setItem).toHaveBeenCalledWith('dotchflow_token', 'abc123');
    expect(i18n.default.changeLanguage).toHaveBeenCalledWith('es');
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('login failed - sets error', async () => {
    const { default: useAuthStore } = await import('../../store/authStore');
    const api = await import('../../api/client');
    
    api.login.mockRejectedValueOnce({ 
      response: { data: { error: 'Invalid credentials' } } 
    });

    const store = useAuthStore.getState();
    await expect(store.login('test@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
    
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
  });

  it('register successful - syncs language', async () => {
    const { default: useAuthStore } = await import('../../store/authStore');
    const api = await import('../../api/client');
    const i18n = await import('../../i18n');
    
    const mockUser = { id: 2, email: 'new@test.com', language: 'pt-BR' };
    api.register.mockResolvedValueOnce({ user: mockUser, token: 'xyz789' });

    const store = useAuthStore.getState();
    await store.register('new@test.com', 'password123');

    expect(api.register).toHaveBeenCalledWith('new@test.com', 'password123');
    expect(i18n.default.changeLanguage).toHaveBeenCalledWith('pt-BR');
  });

  it('logout - clears state and localStorage', async () => {
    const { default: useAuthStore } = await import('../../store/authStore');
    
    useAuthStore.setState({ user: { id: 1 }, token: 'token123' });
    
    const store = useAuthStore.getState();
    store.logout();

    expect(localStorage.removeItem).toHaveBeenCalledWith('dotchflow_token');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('updateUser - updates user fields', async () => {
    const { default: useAuthStore } = await import('../../store/authStore');
    
    useAuthStore.setState({ user: { id: 1, email: 'test@test.com', language: 'en' } });
    
    const store = useAuthStore.getState();
    store.updateUser({ language: 'es', xp_points: 100 });

    expect(useAuthStore.getState().user.language).toBe('es');
    expect(useAuthStore.getState().user.xp_points).toBe(100);
  });
});
