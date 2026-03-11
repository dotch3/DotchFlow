// src/pages/GoalsPage.jsx
import { useState, useEffect } from 'react';
import { Plus, X, Target, PlusCircle, Calendar, PiggyBank } from 'lucide-react';
import * as api from '../api/client';
import useAuthStore from '../store/authStore';

function GoalCard({ goal, onDeposit, fmtBRL }) {
  const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
  const isComplete = pct >= 100;
  
  return (
    <div className="card p-4 hover-lift fade-in-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
               style={{ background: isComplete ? 'var(--color-accent-muted)' : 'var(--color-primary-muted)' }}>
            {goal.icon || '🎯'}
          </div>
          <div>
            <p className="font-semibold text-base">{goal.name}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {goal.deadline 
                ? `Prazo: ${new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : 'Sem prazo definido'}
            </p>
          </div>
        </div>
        <span className="badge" style={{ 
          background: isComplete ? 'var(--color-accent-muted)' : 'var(--color-primary-muted)',
          color: isComplete ? 'var(--color-accent)' : 'var(--color-primary-light)'
        }}>
          {Math.round(pct)}%
        </span>
      </div>

      <div className="progress-bar mb-3">
        <div 
          className={`progress-fill ${isComplete ? 'progress-fill-success' : 'progress-fill-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm">
            <span className="font-semibold" style={{ color: isComplete ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
              {fmtBRL(goal.current_amount)}
            </span>
            <span style={{ color: 'var(--color-text-tertiary)' }}> / {fmtBRL(goal.target_amount)}</span>
          </p>
          {goal.monthly_needed && !isComplete && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {fmtBRL(goal.monthly_needed)}/mês
            </p>
          )}
        </div>
        {isComplete ? (
          <span className="badge badge-success">Concluído!</span>
        ) : (
          <button 
            onClick={() => onDeposit(goal)}
            className="btn btn-secondary text-xs py-2"
          >
            <PlusCircle size={14} />
            Depositar
          </button>
        )}
      </div>
    </div>
  );
}

function CreateGoalModal({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const emojis = ['🎯', '🏠', '✈️', '💻', '🚗', '💍', '📚', '🏋️', '🎓', '💰', '⌚', '👶'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createGoal({ name, icon, target_amount: parseFloat(targetAmount), deadline: deadline || undefined });
      onSaved();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-md card-elevated p-5 scale-in" style={{ borderRadius: 24 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            Nova Meta
          </h2>
          <button onClick={onClose} className="icon-btn" style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
              Ícone
            </label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className="w-10 h-10 text-xl rounded-xl transition-all"
                  style={{ 
                    background: icon === e ? 'var(--color-primary-muted)' : 'var(--color-bg-tertiary)',
                    border: icon === e ? '2px solid var(--color-primary)' : '2px solid transparent'
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Nome da meta"
              className="input"
            />
          </div>
          
          <div>
            <input
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              required
              type="number"
              min="1"
              step="0.01"
              placeholder="Valor da meta (R$)"
              className="input"
            />
          </div>
          
          <div>
            <input
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              type="date"
              className="input"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Criando...' : '🎯 Criar Meta'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DepositModal({ goal, onClose, onSaved, fmtBRL }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const remaining = goal.target_amount - goal.current_amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.depositGoal(goal.id, parseFloat(amount));
      onSaved();
    } catch {}
    setLoading(false);
  };

  const quickAmounts = [50, 100, 200, 500];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-md card-elevated p-5 scale-in" style={{ borderRadius: 24 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{goal.icon}</span>
            <h2 className="font-semibold text-lg">{goal.name}</h2>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>
        
        <div className="p-3 rounded-xl mb-4" style={{ background: 'var(--color-bg-tertiary)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Falta para completar</p>
          <p className="text-xl font-bold" style={{ color: 'var(--color-primary-light)' }}>
            {fmtBRL(remaining)}
          </p>
        </div>
        
        {/* Quick Amounts */}
        <div className="flex gap-2 mb-4">
          {quickAmounts.map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount(val.toString())}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ 
                background: amount === val.toString() ? 'var(--color-primary-muted)' : 'var(--color-bg-tertiary)',
                color: amount === val.toString() ? 'var(--color-primary-light)' : 'var(--color-text-tertiary)'
              }}
            >
              R$ {val}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Valor a depositar (R$)"
            className="input"
          />
          
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Depositando...' : '💰 Depositar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [depositGoal, setDepositGoal] = useState(null);
  const { refreshUser } = useAuthStore();

  const load = async () => {
    setLoading(true);
    try { 
      const r = await api.getGoals(); 
      setGoals(r.goals || []); 
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fmtBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const activeGoals = goals.filter(g => g.status !== 'concluido');
  const completedGoals = goals.filter(g => g.status === 'concluido');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Metas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Acompanhe seus objetivos financeiros
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">Nova</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} style={{ color: 'var(--color-primary-light)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Ativas</span>
          </div>
          <p className="text-2xl font-bold">{activeGoals.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank size={16} style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Concluídas</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>{completedGoals.length}</p>
        </div>
      </div>

      {/* Goals List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 w-full" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Nenhuma meta ainda
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            Crie sua primeira meta e comece a poupar!
          </p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus size={16} />
            Criar Meta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g, i) => (
            <GoalCard 
              key={g.id} 
              goal={g} 
              fmtBRL={fmtBRL} 
              onDeposit={setDepositGoal}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGoalModal 
          onClose={() => setShowCreate(false)} 
          onSaved={() => { setShowCreate(false); refreshUser(); load(); }} 
        />
      )}
      {depositGoal && (
        <DepositModal 
          goal={depositGoal} 
          fmtBRL={fmtBRL}
          onClose={() => setDepositGoal(null)} 
          onSaved={() => { setDepositGoal(null); refreshUser(); load(); }} 
        />
      )}
    </div>
  );
}