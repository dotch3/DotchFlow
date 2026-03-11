// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { 
  Flame, TrendingUp, TrendingDown, Wallet, 
  Target, Calendar, ChevronRight, Sparkles 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useAuthStore from '../store/authStore';
import * as api from '../api/client';

const COLORS = {
  essential: '#6366F1',
  priority: '#10B981', 
  lifestyle: '#F59E0B'
};

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="stat-card fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" 
                style={{ background: trend > 0 ? 'var(--color-accent-muted)' : 'var(--color-danger-muted)', 
                         color: trend > 0 ? 'var(--color-accent)' : 'var(--color-danger)' }}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>}
    </div>
  );
}

function XPBar({ xp_progress, xp_to_next_level, level }) {
  const pct = Math.min(100, Math.round((xp_progress / xp_to_next_level) * 100));
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
               style={{ background: 'linear-gradient(135deg, var(--color-primary), #8B5CF6)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <span className="font-semibold text-sm">Nível {level}</span>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Progresso até o próximo nível</p>
          </div>
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--color-primary-light)' }}>{pct}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill progress-fill-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{xp_progress} XP</span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{xp_to_next_level} XP</span>
      </div>
    </div>
  );
}

function HealthScore({ health }) {
  if (!health) return null;
  
  const data = [
    { name: 'Essencial', value: parseFloat(health.breakdown?.essential?.percent || 0), color: COLORS.essential },
    { name: 'Prioridade', value: parseFloat(health.breakdown?.priority?.percent || 0), color: COLORS.priority },
    { name: 'Estilo', value: parseFloat(health.breakdown?.lifestyle?.percent || 0), color: COLORS.lifestyle },
  ].filter(d => d.value > 0);

  const scoreColor = health.health_score >= 75 ? 'var(--color-accent)' : 
                     health.health_score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
  
  const scoreLabel = health.health_score >= 75 ? 'Excelente' : 
                     health.health_score >= 50 ? 'Bom' : 'Atenção';

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base">Saúde Financeira</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: scoreColor }}>{health.health_score}</span>
          <span className="text-xs" style={{ color: scoreColor }}>/100</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={40}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.name}</span>
              </div>
              <span className="text-sm font-medium">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <p className="text-xs text-center" style={{ color: scoreColor }}>{scoreLabel}</p>
      </div>
    </div>
  );
}

function ForecastChart({ forecast }) {
  if (!forecast?.forecast) return null;

  const fmtBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const isPositive = forecast.projected_end_of_month >= 0;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base">Projeção 30 dias</h3>
        <div className="text-right">
          <p className="text-sm font-medium" style={{ color: isPositive ? 'var(--color-accent)' : 'var(--color-danger)' }}>
            {fmtBRL(forecast.projected_end_of_month)}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>fim do mês</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={forecast.forecast.filter((_, i) => i % 4 === 0)}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} 
            tickFormatter={(d) => d.slice(5)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} 
            tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={{ 
              background: 'var(--color-bg-elevated)', 
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              fontSize: 12
            }}
            formatter={(v) => [fmtBRL(v), 'Saldo']}
          />
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="#6366F1" 
            strokeWidth={2.5}
            fill="url(#balanceGrad)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button className="card p-3 flex flex-col items-center gap-2 hover-lift">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-muted)' }}>
          <TrendingUp size={18} className="text-emerald-400" />
        </div>
        <span className="text-xs font-medium">Receita</span>
      </button>
      <button className="card p-3 flex flex-col items-center gap-2 hover-lift">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-danger-muted)' }}>
          <TrendingDown size={18} className="text-red-400" />
        </div>
        <span className="text-xs font-medium">Despesa</span>
      </button>
      <button className="card p-3 flex flex-col items-center gap-2 hover-lift">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-muted)' }}>
          <Target size={18} className="text-indigo-400" />
        </div>
        <span className="text-xs font-medium">Meta</span>
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuthStore();
  const [gamification, setGamification] = useState(null);
  const [health, setHealth] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinMsg, setCheckinMsg] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getGamificationStatus(),
      api.getHealth(),
      api.getForecast(),
    ]).then(([g, h, f]) => {
      setGamification(g);
      setHealth(h);
      setForecast(f);
    }).catch(console.error);
  }, []);

  const handleCheckin = async () => {
    setCheckinLoading(true);
    try {
      const result = await api.checkin();
      setCheckinMsg(result.message);
      setGamification(prev => prev ? {
        ...prev,
        xp_points: result.xp_points,
        dotch_coins: result.dotch_coins,
        level: result.level,
        streak_count: result.streak_count,
        checked_in_today: true,
      } : prev);
      refreshUser();
      setTimeout(() => setCheckinMsg(null), 4000);
    } catch (err) {
      setCheckinMsg(err.response?.data?.error || 'Erro');
      setTimeout(() => setCheckinMsg(null), 3000);
    }
    setCheckinLoading(false);
  };

  const fmtBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const userName = user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="space-y-5">
      {/* Welcome Section */}
      <div className="pt-2 fade-in-up">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Olá, <span style={{ color: 'var(--color-primary-light)' }}>{userName}</span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Continue assim! Você está no caminho certo.
        </p>
      </div>

      {/* XP Progress */}
      {gamification && (
        <XPBar
          xp_progress={gamification.xp_progress}
          xp_to_next_level={gamification.xp_to_next_level}
          level={gamification.level}
        />
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icon={Wallet} 
          label="Saldo Total" 
          value={fmtBRL(health?.balance)} 
          sub={health?.period}
          color="#6366F1" 
        />
        <StatCard 
          icon={Flame} 
          label="Sequência" 
          value={`${gamification?.streak_count || 0} dias`} 
          sub="consecutivos"
          color="#F59E0B" 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Receitas" 
          value={fmtBRL(health?.total_income)} 
          sub="este mês"
          color="#10B981" 
        />
        <StatCard 
          icon={TrendingDown} 
          label="Despesas" 
          value={fmtBRL(health?.total_expense)} 
          sub="este mês"
          color="#EF4444" 
        />
      </div>

      {/* Daily Checkin */}
      <div className="card p-4 fade-in-up">
        {checkinMsg && (
          <p className="text-sm font-medium mb-3 text-center" 
             style={{ color: 'var(--color-primary-light)' }}>
            {checkinMsg}
          </p>
        )}
        <button
          onClick={handleCheckin}
          disabled={checkinLoading || gamification?.checked_in_today}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover-lift"
          style={{
            background: gamification?.checked_in_today 
              ? 'var(--color-bg-tertiary)' 
              : 'linear-gradient(135deg, var(--color-primary) 0%, #8B5CF6 100%)',
            color: gamification?.checked_in_today ? 'var(--color-text-tertiary)' : 'white',
            border: gamification?.checked_in_today ? '1px solid var(--color-border)' : 'none',
            cursor: gamification?.checked_in_today ? 'not-allowed' : 'pointer',
            boxShadow: gamification?.checked_in_today ? 'none' : '0 4px 20px rgba(99, 102, 241, 0.3)'
          }}
        >
          {gamification?.checked_in_today 
            ? '✓ Check-in realizado hoje!' 
            : checkinLoading 
              ? 'Processando...' 
              : '⚡ Fazer Check-in Diário'}
        </button>
        {!gamification?.checked_in_today && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>
            +50 XP • +10 DotchCoins
          </p>
        )}
      </div>

      {/* Health Score */}
      <HealthScore health={health} />

      {/* Forecast Chart */}
      <ForecastChart forecast={forecast} />
    </div>
  );
}