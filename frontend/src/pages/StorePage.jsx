// src/pages/StorePage.jsx
import { useState, useEffect } from 'react';
import { Store, Lock, Check, Sparkles, Crown, Star, Gem } from 'lucide-react';
import * as api from '../api/client';
import useAuthStore from '../store/authStore';

const RARITY_COLORS = {
  common: { 
    bg: 'rgba(107, 114, 128, 0.1)', 
    border: 'rgba(107, 114, 128, 0.2)', 
    text: '#9CA3AF', 
    label: 'Comum',
    gradient: 'linear-gradient(135deg, #4B5563 0%, #6B7280 100%)'
  },
  rare: { 
    bg: 'rgba(59, 130, 246, 0.1)', 
    border: 'rgba(59, 130, 246, 0.25)', 
    text: '#60A5FA', 
    label: 'Raro',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'
  },
  epic: { 
    bg: 'rgba(124, 58, 237, 0.1)', 
    border: 'rgba(124, 58, 237, 0.25)', 
    text: '#A78BFA', 
    label: 'Épico',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)'
  },
  legendary: { 
    bg: 'rgba(245, 158, 11, 0.1)', 
    border: 'rgba(245, 158, 11, 0.25)', 
    text: '#FCD34D', 
    label: 'Lendário',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)'
  },
};

const RARITY_ICONS = {
  common: Star,
  rare: Gem,
  epic: Sparkles,
  legendary: Crown,
};

export default function StorePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(null);
  const [msg, setMsg] = useState(null);
  const { user, refreshUser } = useAuthStore();

  const load = async () => {
    setLoading(true);
    try { 
      const r = await api.getStore(); 
      setItems(r.items || []); 
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUnlock = async (item) => {
    if (item.is_unlocked) return;
    if (user.dotch_coins < item.price) {
      setMsg({ type: 'error', text: `Você precisa de ${item.price} coins mas tem apenas ${user.dotch_coins}` });
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    setUnlocking(item.id);
    try {
      const r = await api.unlockItem(item.id);
      setMsg({ type: 'success', text: r.message || 'Item desbloqueado!' });
      refreshUser();
      load();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Erro ao desbloquear' });
      setTimeout(() => setMsg(null), 3000);
    }
    setUnlocking(null);
  };

  const grouped = items.reduce((acc, item) => {
    const type = item.item_type || 'outros';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  const typeLabels = { 
    theme: '🎨 Temas', 
    badge: '🏅 Emblemas', 
    avatar_frame: '🖼️ Molduras', 
    others: '⭐ Outros' 
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pt-2 fade-in-up">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Loja</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          Use suas coins para desbloquear itens
        </p>
      </div>

      {/* Coins Balance */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
               style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)' }}>
            <Gem size={24} className="text-white" />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Seu saldo</p>
            <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
              {user?.dotch_coins || 0}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>coins</p>
        </div>
      </div>

      {/* Message Toast */}
      {msg && (
        <div 
          className="p-4 rounded-xl text-sm font-medium fade-in-up"
          style={{
            background: msg.type === 'success' ? 'var(--color-accent-muted)' : 'var(--color-danger-muted)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: msg.type === 'success' ? 'var(--color-accent)' : 'var(--color-danger)',
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Store Items */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-40 w-full" />)}
        </div>
      ) : (
        Object.entries(grouped).map(([type, typeItems]) => (
          <div key={type}>
            <h2 className="text-sm font-semibold mb-3" style={{ 
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {typeLabels[type] || type}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {typeItems.map((item, index) => {
                const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                const RarityIcon = RARITY_ICONS[item.rarity] || Star;
                const isUnlocking = unlocking === item.id;
                const canAfford = (user?.dotch_coins || 0) >= item.price;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleUnlock(item)}
                    disabled={item.is_unlocked || isUnlocking}
                    className="card p-4 text-left relative overflow-hidden hover-lift fade-in-up"
                    style={{ 
                      animationDelay: `${index * 0.05}s`,
                      opacity: !canAfford && !item.is_unlocked ? 0.6 : 1,
                      borderColor: item.is_unlocked ? 'rgba(16, 185, 129, 0.3)' : rarity.border
                    }}
                  >
                    {/* Rarity Glow */}
                    {!item.is_unlocked && (
                      <div 
                        className="absolute inset-0 opacity-30"
                        style={{ background: rarity.gradient }}
                      />
                    )}
                    
                    {/* Content */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span 
                          className="text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1"
                          style={{ 
                            background: rarity.bg, 
                            color: rarity.text,
                            border: `1px solid ${rarity.border}`
                          }}
                        >
                          <RarityIcon size={10} />
                          {rarity.label}
                        </span>
                        
                        {item.is_unlocked ? (
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--color-accent)' }}
                          >
                            <Check size={12} className="text-white" />
                          </div>
                        ) : !canAfford ? (
                          <Lock size={14} style={{ color: 'var(--color-text-muted)' }} />
                        ) : null}
                      </div>

                      <div className="text-3xl mb-2">{item.icon || '⭐'}</div>
                      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>
                          {item.description}
                        </p>
                      )}

                      <div className="mt-auto">
                        {item.is_unlocked ? (
                          <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
                            ✓ Desbloqueado
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Gem size={14} className="text-amber-400" />
                            <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>
                              {item.price}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Loading Overlay */}
                    {isUnlocking && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'rgba(0, 0, 0, 0.7)' }}
                      >
                        <div 
                          className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Loja vazia
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Novos itens em breve!
          </p>
        </div>
      )}
    </div>
  );
}