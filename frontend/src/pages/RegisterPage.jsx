// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, Lock } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(email, password);
    } catch { /* handled in store */ }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, #0F0F1A 60%)' }}>
      <div className="w-full max-w-md fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4 pulse-glow"
               style={{ background: 'linear-gradient(135deg, #7C3AED, #F59E0B)' }}>
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">DotchFlow</h1>
          <p className="text-gray-400 mt-1 text-sm">Comece sua jornada financeira</p>
        </div>

        <div className="glass p-8">
          <h2 className="text-xl font-bold mb-6">Criar conta</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-red-400"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                       className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                       style={{ background: '#242438', border: '1px solid rgba(124,58,237,0.2)', color: '#F9FAFB' }}
                       placeholder="seu@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                       className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                       style={{ background: '#242438', border: '1px solid rgba(124,58,237,0.2)', color: '#F9FAFB' }}
                       placeholder="Mínimo 6 caracteres" />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
                    className="w-full py-3 rounded-xl font-semibold transition-all text-white"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? 'Criando conta...' : 'Começar minha jornada 🎮'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Já tem conta?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
