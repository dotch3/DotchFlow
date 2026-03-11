// src/pages/TransactionsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Trash2, Edit3, X, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import * as api from '../api/client';
import useAuthStore from '../store/authStore';

function TransactionModal({ onClose, onSaved, editTx }) {
  const [type, setType] = useState(editTx?.type || 'expense');
  const [description, setDescription] = useState(editTx?.description || '');
  const [amount, setAmount] = useState(editTx?.amount?.toString() || '');
  const [date, setDate] = useState(editTx?.date || new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState(editTx?.category_id || '');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCategories().then(r => setCategories(r.categories || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editTx) {
        await api.updateTransaction(editTx.id, { type, description, amount: parseFloat(amount), date, category_id: categoryId || null });
      } else {
        await api.createTransaction({ type, description, amount: parseFloat(amount), date, category_id: categoryId || null });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-md card-elevated p-5 scale-in" style={{ borderRadius: 24 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {editTx ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button 
            onClick={onClose} 
            className="icon-btn"
            style={{ width: 32, height: 32 }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" 
               style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger-light)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
            {[
              { value: 'income', label: 'Receita', icon: '↑', color: 'var(--color-accent)' },
              { value: 'expense', label: 'Despesa', icon: '↓', color: 'var(--color-danger)' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className="flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  background: type === opt.value ? opt.color : 'transparent',
                  color: type === opt.value ? '#fff' : 'var(--color-text-tertiary)'
                }}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className="input"
            />
          </div>

          <div>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Valor (R$)"
              className="input"
            />
          </div>

          <div>
            <input
              value={date}
              onChange={e => setDate(e.target.value)}
              type="date"
              className="input"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="input select"
              >
                <option value="">Sem categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Salvando...' : editTx ? 'Atualizar' : 'Adicionar Transação'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { refreshUser } = useAuthStore();

  // Handle URL params to open modal with pre-selected type
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'income' || type === 'expense') {
      setEditTx({ type }); // Will set the modal type
      setShowModal(true);
      // Clear the URL param after opening modal
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;
      const r = await api.getTransactions(params);
      setTransactions(r.transactions || []);
    } catch {}
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Excluir transação?')) return;
    await api.deleteTransaction(id);
    refreshUser();
    load();
  };

  const fmtBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'income', label: 'Receitas' },
    { value: 'expense', label: 'Despesas' }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Transações</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Gerencie seus registros financeiros
          </p>
        </div>
        <button 
          onClick={() => { setEditTx(null); setShowModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nova</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar transações..."
            className="input pl-10"
          />
        </div>
        <select 
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="input select"
          style={{ width: 'auto', minWidth: 110 }}
        >
          {filterOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💸</div>
          <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Nenhuma transação encontrada
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Adicione sua primeira transação para começar
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx, index) => (
            <div 
              key={tx.id} 
              className="list-item fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Icon */}
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: tx.type === 'income' 
                    ? 'var(--color-accent-muted)' 
                    : 'var(--color-danger-muted)' 
                }}
              >
                {tx.type === 'income' 
                  ? <ArrowUpRight size={20} className="text-emerald-400" />
                  : <ArrowDownRight size={20} className="text-red-400" />
                }
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {tx.description || (tx.type === 'income' ? 'Receita' : 'Despesa')}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {fmtDate(tx.date)}
                  {tx.category_name && (
                    <span> • {tx.category_name}</span>
                  )}
                </p>
              </div>
              
              {/* Amount & Actions */}
              <div className="text-right flex-shrink-0">
                <p 
                  className="font-semibold text-sm"
                  style={{ 
                    color: tx.type === 'income' 
                      ? 'var(--color-accent)' 
                      : 'var(--color-danger)' 
                  }}
                >
                  {tx.type === 'income' ? '+' : '-'}{fmtBRL(tx.amount)}
                </p>
                <div className="flex gap-1 mt-1.5 justify-end">
                  <button 
                    onClick={() => { setEditTx(tx); setShowModal(true); }} 
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(tx.id)} 
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-danger-muted)]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TransactionModal
          editTx={editTx}
          onClose={() => { setShowModal(false); setEditTx(null); }}
          onSaved={() => { setShowModal(false); setEditTx(null); refreshUser(); load(); }}
        />
      )}
    </div>
  );
}