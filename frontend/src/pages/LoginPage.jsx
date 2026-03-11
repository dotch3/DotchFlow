// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch { /* handled in store */ }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ 
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.12) 0%, var(--color-bg-primary) 60%)' 
      }}
    >
      <div className="w-full max-w-sm fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4"
            style={{ 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #8B5CF6 100%)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Zap size={32} className="text-white" />
          </div>
          <h1 
            className="text-3xl font-bold"
            style={{ 
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            DotchFlow
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Seu dinheiro, seu jogo.
          </p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Entrar
          </h2>

          {error && (
            <div 
              className="mb-4 p-3 rounded-xl text-sm"
              style={{ 
                background: 'var(--color-danger-muted)', 
                color: 'var(--color-danger-light)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                className="block text-xs font-medium mb-2" 
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail 
                  size={16} 
                  className="absolute left-3 top-1/2 -translate-y-1/2" 
                  style={{ color: 'var(--color-text-muted)' }} 
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input pl-10"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            
            <div>
              <label 
                className="block text-xs font-medium mb-2" 
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Senha
              </label>
              <div className="relative">
                <Lock 
                  size={16} 
                  className="absolute left-3 top-1/2 -translate-y-1/2" 
                  style={{ color: 'var(--color-text-muted)' }} 
                />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: 'var(--color-text-tertiary)' }}>
            Não tem conta?{' '}
            <Link 
              to="/register" 
              className="font-medium transition-colors hover-lift"
              style={{ color: 'var(--color-primary-light)' }}
            >
              Criar agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}