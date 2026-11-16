import React, { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Habit, HabitCategory } from '../types';
import { validateHabitInput } from '../utils/habits';

interface HabitModalProps {
  isOpen: boolean;
  editingHabit: Habit | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    category: HabitCategory;
    targetCount: number;
    unit: string;
    accentColor: string;
  }) => void;
  onDelete?: (habitId: string) => void;
}

const CATEGORIES: HabitCategory[] = ['Health', 'Focus', 'Mindfulness', 'Fitness', 'Learning'];

const ACCENT_OPTIONS = [
  { label: 'Deep Teal', hex: '#0F766E' },
  { label: 'Ocean Blue', hex: '#0284C7' },
  { label: 'Indigo', hex: '#4338CA' },
  { label: 'Forest Green', hex: '#15803D' },
  { label: 'Amber', hex: '#D97706' },
];

const UNIT_PRESETS = ['times', 'min', 'glasses', 'pages', 'km', 'session'];

export function HabitModal({
  isOpen,
  editingHabit,
  onClose,
  onSave,
  onDelete,
}: HabitModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Health');
  const [targetCount, setTargetCount] = useState('1');
  const [unit, setUnit] = useState('times');
  const [accentColor, setAccentColor] = useState(ACCENT_OPTIONS[0].hex);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingHabit) {
      setTitle(editingHabit.title);
      setCategory(editingHabit.category);
      setTargetCount(String(editingHabit.targetCount));
      setUnit(editingHabit.unit);
      setAccentColor(editingHabit.accentColor);
    } else {
      setTitle('');
      setCategory('Health');
      setTargetCount('1');
      setUnit('times');
      setAccentColor(ACCENT_OPTIONS[0].hex);
    }
    setError(null);
  }, [isOpen, editingHabit]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTarget = Number(targetCount);
    const validationError = validateHabitInput({
      title,
      targetCount: numericTarget,
      unit,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave({
      title: title.trim(),
      category,
      targetCount: Math.round(numericTarget),
      unit: unit.trim(),
      accentColor,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="habit-modal-title"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-line pb-4">
          <h2 id="habit-modal-title" className="font-display text-lg font-semibold text-ink">
            {editingHabit ? 'Edit Habit Goal' : 'Create Daily Habit'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close habit dialog"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="habit-title-input" className="block text-sm font-medium text-ink-secondary">
              Habit Name
            </label>
            <input
              id="habit-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Morning Run, Drink Water, Read"
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="habit-category-select" className="block text-sm font-medium text-ink-secondary">
                Category
              </label>
              <select
                id="habit-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="habit-target-input" className="block text-sm font-medium text-ink-secondary">
                Daily Target
              </label>
              <input
                id="habit-target-input"
                type="number"
                min={1}
                max={999}
                value={targetCount}
                onChange={(e) => {
                  setTargetCount(e.target.value);
                  if (error) setError(null);
                }}
                className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 font-mono text-sm text-ink tabular-nums focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="habit-unit-input" className="block text-sm font-medium text-ink-secondary">
              Unit
            </label>
            <input
              id="habit-unit-input"
              type="text"
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., min, glasses, pages"
              className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {UNIT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setUnit(preset)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    unit === preset
                      ? 'bg-cta text-cta-fg'
                      : 'bg-subtle text-ink-secondary hover:bg-hover-surface hover:text-ink'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-ink-secondary">Progress Ring Accent</span>
            <div className="mt-2 flex items-center gap-2.5">
              {ACCENT_OPTIONS.map((opt) => {
                const selected = accentColor === opt.hex;
                return (
                  <button
                    key={opt.hex}
                    type="button"
                    aria-label={`Select ${opt.label} color`}
                    aria-pressed={selected}
                    onClick={() => setAccentColor(opt.hex)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      selected ? 'scale-110 border-ink ring-2 ring-ink/20' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: opt.hex }}
                  />
                );
              })}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs font-medium text-danger-text"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            {editingHabit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingHabit.id);
                  onClose();
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-danger-text transition-colors hover:bg-danger-bg"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Delete</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-subtle"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-fg transition-colors hover:bg-cta-hover"
              >
                {editingHabit ? 'Save Changes' : 'Create Habit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
