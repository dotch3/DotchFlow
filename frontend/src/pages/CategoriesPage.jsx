// src/pages/CategoriesPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, X, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as api from '../api/client';
import useAuthStore from '../store/authStore';

// Common emoji icons for categories
const EMOJI_OPTIONS = [
  '🍔', '🚗', '🏠', '💊', '👕', '🎮', '📱', '✈️',
  '🎁', '💰', '📚', '🏋️', '🎵', '🎬', '☕', '🍺',
  '🛒', '💡', '📦', '🎯', '💳', '🏥', '📶', '🎓',
  '🐕', '🌿', '⚡', '💵', '📈', '🏦', '🎪', '🌴'
];

function CategoryModal({ onClose, onSaved, editCategory, t }) {
  const [name, setName] = useState(editCategory?.name || '');
  const [icon, setIcon] = useState(editCategory?.icon || '📁');
  const [monthlyLimit, setMonthlyLimit] = useState(editCategory?.monthly_limit?.toString() || '0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = {
        name,
        icon,
        monthly_limit: parseFloat(monthlyLimit) || 0
      };
      if (editCategory) {
        await api.updateCategory(editCategory.id, data);
      } else {
        await api.createCategory(data);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || t('errors.generic', 'Error saving'));
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-md card-elevated p-5 scale-in" style={{ borderRadius: 24 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {editCategory ? t('categories.edit', 'Edit Category') : t('categories.add', 'Add Category')}
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
          {/* Icon Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('categories.icon', 'Icon')}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: 'var(--color-bg-tertiary)', border: '2px solid var(--color-border)' }}
              >
                {icon}
              </button>
              <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {t('categories.clickToChange', 'Click to change')}
              </span>
            </div>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-3 p-3 rounded-xl grid grid-cols-8 gap-2 max-h-40 overflow-y-auto" 
                   style={{ background: 'var(--color-bg-tertiary)' }}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { setIcon(emoji); setShowEmojiPicker(false); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:scale-110 transition-transform"
                    style={{ 
                      background: icon === emoji ? 'var(--color-primary-muted)' : 'transparent'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('categories.name', 'Category Name')}
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={100}
              placeholder={t('categories.namePlaceholder', 'E.g. Food, Transport...')}
              className="input"
            />
          </div>

          {/* Monthly Limit Input */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('categories.monthlyLimit', 'Monthly Limit ($)')}
            </label>
            <input
              value={monthlyLimit}
              onChange={e => setMonthlyLimit(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="input"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {t('categories.limitHelp', 'Set a limit to control spending in this category')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="btn btn-primary w-full"
          >
            {loading ? t('common.loading', 'Saving...') : editCategory ? t('categories.update', 'Update Category') : t('categories.create', 'Create Category')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const { refreshUser } = useAuthStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getCategories();
      setCategories(r.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm(t('categories.confirmDelete', 'Delete this category?'))) return;
    await api.deleteCategory(id);
    refreshUser();
    load();
  };

  const handleEdit = (category) => {
    setEditCategory(category);
    setShowModal(true);
  };

  const fmtBRL = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

  // Calculate totals
  const totalLimit = categories.reduce((sum, c) => sum + (c.monthly_limit || 0), 0);
  const totalSpent = categories.reduce((sum, c) => sum + (c.monthly_spent || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t('categories.title', 'Categories')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {t('categories.subtitle', 'Organize your spending categories')}
          </p>
        </div>
        <button 
          onClick={() => { setEditCategory(null); setShowModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 rounded-2xl">
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {t('categories.totalLimit', 'Total Limit')}
          </p>
          <p className="text-xl font-bold" style={{ color: 'var(--color-primary-light)' }}>
            {fmtBRL(totalLimit)}
          </p>
        </div>
        <div className="card p-4 rounded-2xl">
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {t('categories.totalSpent', 'Total Spent')}
          </p>
          <p className="text-xl font-bold" style={{ color: 'var(--color-danger-light)' }}>
            {fmtBRL(totalSpent)}
          </p>
        </div>
      </div>

      {/* Category List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏷️</div>
          <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {t('categories.noCategories', 'No categories found')}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {t('categories.createFirst', 'Create your first category to organize your spending')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div 
              key={category.id} 
              className="list-item fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: 'var(--color-primary-muted)' }}
              >
                {category.icon}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {category.name}
                </p>
                {category.monthly_limit > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" 
                         style={{ background: 'var(--color-bg-tertiary)' }}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(category.usage_percent || 0, 100)}%`,
                          background: category.usage_percent > 100 
                            ? 'var(--color-danger)' 
                            : category.usage_percent > 80 
                              ? 'var(--color-warning)' 
                              : 'var(--color-accent)'
                        }}
                      />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {category.usage_percent || 0}%
                    </span>
                  </div>
                )}
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t('categories.limit', 'Limit')}: {fmtBRL(category.monthly_limit)}
                  {category.monthly_spent > 0 && (
                    <span> • {t('categories.spent', 'Spent')}: {fmtBRL(category.monthly_spent)}</span>
                  )}
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <button 
                  onClick={() => handleEdit(category)} 
                  className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(category.id)} 
                  className="p-2 rounded-lg transition-colors hover:bg-[var(--color-danger-muted)]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CategoryModal
          editCategory={editCategory}
          onClose={() => { setShowModal(false); setEditCategory(null); }}
          onSaved={() => { setShowModal(false); setEditCategory(null); refreshUser(); load(); }}
          t={t}
        />
      )}
    </div>
  );
}
