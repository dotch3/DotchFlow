// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { User, Activity, Award, BarChart2, Gem, Flame, Zap, ChevronRight } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import * as api from '../api/client';
import useAuthStore from '../store/authStore';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGamificationStatus()
      .then(r => setGamification(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const radarData = gamification ? [
    { subject: 'Streak', value: Math.min(100, gamification.streak_count * 5) },
    { subject: 'Nível', value: Math.min(100, gamification.level * 10) },
    { subject: 'XP', value: Math.min(100, gamification.xp_progress) },
    { subject: 'Coins', value: Math.min(100, (gamification.dotch_coins || 0) / 10) },
    { subject: 'Checkin', value: gamification.checked_in_today ? 100 : 30 },
  ] : [];

  const getLevelTitle = (lvl) => {
    if (!lvl) return t('profile.beginner', 'Iniciante');
    if (lvl >= 20) return t('profile.financialMaster', 'Mestre Financeiro');
    if (lvl >= 15) return t('profile.specialist', 'Especialista');
    if (lvl >= 10) return t('profile.advanced', 'Avançado');
    if (lvl >= 5) return t('profile.intermediate', 'Intermediário');
    return t('profile.beginner', 'Iniciante');
  };

  const tierColor = (lvl) => {
    if (!lvl) return 'var(--color-text-tertiary)';
    if (lvl >= 20) return '#F59E0B';
    if (lvl >= 15) return '#A78BFA';
    if (lvl >= 10) return '#3B82F6';
    if (lvl >= 5) return '#10B981';
    return 'var(--color-text-tertiary)';
  };

  const achievements = [
    { icon: '🎯', label: '1ª Meta', done: true },
    { icon: '🔥', label: '7 dias', done: (gamification?.streak_count || 0) >= 7 },
    { icon: '⚡', label: 'Nível 5', done: (gamification?.level || 1) >= 5 },
    { icon: '💎', label: '100 coins', done: (gamification?.dotch_coins || 0) >= 100 },
    { icon: '📈', label: 'Primeira Receita', done: false },
    { icon: '🏆', label: 'Nível 10', done: (gamification?.level || 1) >= 10 },
    { icon: '🔥', label: '30 dias', done: (gamification?.streak_count || 0) >= 30 },
    { icon: '👑', label: 'Mestre', done: (gamification?.level || 1) >= 20 },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t('profile.title', 'Perfil')}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          {t('profile.subtitle', 'Suas informações e conquistas')}
        </p>
      </div>

      {/* Profile Card */}
      <div className="card p-5 text-center fade-in-up">
        <div 
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
          style={{ 
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #8B5CF6 100%)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
          }}
        >
          {user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        
        <p className="font-semibold text-lg mb-1">{user?.email}</p>
        <p className="text-sm font-medium mb-4" style={{ color: tierColor(gamification?.level) }}>
          {getLevelTitle(gamification?.level)}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--color-primary-light)' }}>
              {gamification?.level || 1}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{t('profile.level', 'Nível')}</p>
          </div>
          <div className="text-center" style={{ borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
            <p className="text-xl font-bold flex items-center justify-center gap-1" style={{ color: '#F59E0B' }}>
              <Gem size={14} />{gamification?.dotch_coins || 0}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{t('profile.coins', 'Coins')}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold flex items-center justify-center gap-1" style={{ color: '#F59E0B' }}>
              <Flame size={14} />{gamification?.streak_count || 0}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{t('profile.streak', 'Sequência')}</p>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      {gamification && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Activity size={16} style={{ color: 'var(--color-primary-light)' }} />
              {t('profile.progress', 'Progresso')}
            </h3>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {gamification.xp_points} XP {t('profile.total', 'total')}
            </span>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.level')} {gamification.level}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{gamification.xp_to_next_level - gamification.xp_progress} {t('profile.toNext', 'para próximo')}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill progress-fill-primary" 
                style={{ width: `${Math.min(100, (gamification.xp_progress / gamification.xp_to_next_level) * 100)}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Radar */}
      {radarData.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <BarChart2 size={16} style={{ color: 'var(--color-primary-light)' }} />
            {t('profile.statistics', 'Estatísticas')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
              <Radar 
                dataKey="value" 
                stroke="var(--color-primary)" 
                fill="var(--color-primary)" 
                fillOpacity={0.25} 
                strokeWidth={2} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Achievements */}
      <div className="card p-4">
        <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
          <Award size={16} style={{ color: 'var(--color-warning)' }} />
          {t('profile.achievements', 'Conquistas')}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {achievements.map((a, i) => (
            <div 
              key={i} 
              className="text-center p-3 rounded-xl transition-all hover-lift"
              style={{ 
                background: a.done ? 'var(--color-primary-muted)' : 'var(--color-bg-tertiary)',
                opacity: a.done ? 1 : 0.5
              }}
            >
              <p className="text-xl mb-1">{a.icon}</p>
              <p className="text-xs" style={{ color: a.done ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
                {a.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Account Section */}
      <div className="space-y-2">
        <div className="card p-4 flex items-center justify-between hover-lift cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-muted)' }}>
              <User size={18} style={{ color: 'var(--color-primary-light)' }} />
            </div>
            <div>
              <p className="font-medium text-sm">{t('profile.accountData', 'Dados da Conta')}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{t('profile.emailPrefs', 'Email e preferências')}</p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
        </div>

        <button 
          onClick={logout}
          className="w-full card p-4 flex items-center justify-between hover-lift"
          style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-danger-muted)' }}>
              <Zap size={18} style={{ color: 'var(--color-danger)' }} />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm" style={{ color: 'var(--color-danger)' }}>{t('auth.logout', 'Sair da Conta')}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{t('profile.logoutDesc', 'Encerrar sessão')}</p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--color-danger)' }} />
        </button>
      </div>
    </div>
  );
}