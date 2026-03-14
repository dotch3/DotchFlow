// src/components/Layout.jsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, Receipt, Target, Store, User, 
  LogOut, Wallet, TrendingUp, Zap, Tag
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/transactions', icon: Receipt, label: 'Gastos' },
  { path: '/categories', icon: Tag, label: 'Categorias' },
  { path: '/goals', icon: Target, label: 'Metas' },
  { path: '/store', icon: Store, label: 'Loja' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50" 
              style={{ 
                background: 'rgba(10, 10, 15, 0.85)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--color-border)'
              }}>
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" 
                 style={{ 
                   background: 'linear-gradient(135deg, var(--color-primary) 0%, #8B5CF6 100%)',
                   boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
                 }}>
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-lg" style={{ 
                fontFamily: 'var(--font-display)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>DotchFlow</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" 
                     style={{ background: 'var(--color-primary-muted)' }}>
                  <Wallet size={12} className="text-amber-400" />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    R$ {(user.dotch_coins || 0).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" 
                     style={{ background: 'var(--color-bg-tertiary)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-primary-light)' }}>
                    Nv. {user.level || 1}
                  </span>
                </div>
              </div>
            )}
            <button 
              onClick={logout}
              className="icon-btn"
              style={{ width: 36, height: 36 }}
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24 min-h-screen">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50" 
           style={{ 
             background: 'rgba(10, 10, 15, 0.9)',
             backdropFilter: 'blur(20px)',
             borderTop: '1px solid var(--color-border)'
           }}>
        <div className="max-w-2xl mx-auto px-2 safe-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link 
                  key={path} 
                  to={path}
                  className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200"
                  style={{
                    color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-tertiary)',
                    background: isActive ? 'var(--color-primary-muted)' : 'transparent',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                  }}
                >
                  <Icon 
                    size={20} 
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className="transition-transform duration-200"
                    style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
                  />
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.02em'
                  }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}