import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, LockOpen, Pencil, Search, Trash2 } from 'lucide-react';
import { DiaryEntry, DiaryMood } from '../types';
import { formatReadableDate } from '../utils/date';
import {
  filterAndSortDiaryEntries,
  hashDiaryPassword,
  validateDiaryEntryInput,
  validatePasswordSetup,
} from '../utils/diary';
import { DiaryAuthRecord } from '../utils/storage';

interface DiaryPanelProps {
  entries: DiaryEntry[];
  authRecord: DiaryAuthRecord | null;
  isUnlocked: boolean;
  todayStr: string;
  onUnlock: () => void;
  onLock: () => void;
  onSaveAuth: (record: DiaryAuthRecord) => void;
  onResetDiary: () => void;
  onSaveEntry: (input: {
    id?: string;
    date: string;
    title: string;
    content: string;
    mood: DiaryMood;
  }) => void;
  onDeleteEntry: (entryId: string) => void;
}

const MOODS: DiaryMood[] = ['Calm', 'Grateful', 'Focused', 'Reflective', 'Stressed'];

function createSalt(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DiaryPanel({
  entries,
  authRecord,
  isUnlocked,
  todayStr,
  onUnlock,
  onLock,
  onSaveAuth,
  onResetDiary,
  onSaveEntry,
  onDeleteEntry,
}: DiaryPanelProps) {
  // Auth / lock state
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [changePwError, setChangePwError] = useState<string | null>(null);
  const [changePwSuccess, setChangePwSuccess] = useState<string | null>(null);

  // Entry composer state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState(todayStr);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryMood, setEntryMood] = useState<DiaryMood>('Calm');
  const [entryContent, setEntryContent] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entrySavedNotice, setEntrySavedNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePasswordSetup(passwordInput, confirmPasswordInput);
    if (err) {
      setAuthError(err);
      return;
    }
    const salt = createSalt();
    const passwordHash = await hashDiaryPassword(passwordInput, salt);
    onSaveAuth({
      salt,
      passwordHash,
      updatedAt: new Date().toISOString(),
    });
    setPasswordInput('');
    setConfirmPasswordInput('');
    setAuthError(null);
    onUnlock();
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authRecord) return;
    if (!passwordInput) {
      setAuthError('Please enter your diary password.');
      return;
    }
    const attemptHash = await hashDiaryPassword(passwordInput, authRecord.salt);
    if (attemptHash !== authRecord.passwordHash) {
      setAuthError('Incorrect password. Please try again.');
      return;
    }
    setPasswordInput('');
    setAuthError(null);
    onUnlock();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authRecord) return;
    const currentHash = await hashDiaryPassword(currentPw, authRecord.salt);
    if (currentHash !== authRecord.passwordHash) {
      setChangePwError('Current password is incorrect.');
      return;
    }
    const validationErr = validatePasswordSetup(newPw, confirmNewPw);
    if (validationErr) {
      setChangePwError(validationErr);
      return;
    }
    const salt = createSalt();
    const passwordHash = await hashDiaryPassword(newPw, salt);
    onSaveAuth({
      salt,
      passwordHash,
      updatedAt: new Date().toISOString(),
    });
    setCurrentPw('');
    setNewPw('');
    setConfirmNewPw('');
    setChangePwError(null);
    setChangePwSuccess('Diary password updated.');
    setShowChangePassword(false);
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateDiaryEntryInput({ title: entryTitle, content: entryContent });
    if (err) {
      setEntryError(err);
      return;
    }
    onSaveEntry({
      id: editingEntryId ?? undefined,
      date: entryDate || todayStr,
      title: entryTitle.trim() || formatReadableDate(entryDate || todayStr),
      content: entryContent.trim(),
      mood: entryMood,
    });
    setEditingEntryId(null);
    setEntryTitle('');
    setEntryContent('');
    setEntryMood('Calm');
    setEntryDate(todayStr);
    setEntryError(null);
    setEntrySavedNotice('Entry saved to your private diary.');
    window.setTimeout(() => setEntrySavedNotice(null), 3000);
  };

  const handleStartEdit = (entry: DiaryEntry) => {
    setEditingEntryId(entry.id);
    setEntryDate(entry.date);
    setEntryTitle(entry.title);
    setEntryMood(entry.mood);
    setEntryContent(entry.content);
    setEntryError(null);
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEntryTitle('');
    setEntryContent('');
    setEntryMood('Calm');
    setEntryDate(todayStr);
    setEntryError(null);
  };

  // State 1: First-time password setup
  if (!authRecord) {
    return (
      <section
        aria-labelledby="diary-setup-heading"
        className="mx-auto max-w-lg rounded-xl border border-line bg-surface p-6 sm:p-8"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id="diary-setup-heading" className="mt-4 font-display text-xl font-semibold text-ink">
          Set Up Your Personal Diary
        </h2>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Create a password to lock your daily thoughts. Your diary remains locked whenever you reload or step away.
        </p>

        <form onSubmit={handleSetupPassword} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="diary-setup-password" className="block text-sm font-medium text-ink-secondary">
              Create Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="diary-setup-password"
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="At least 4 characters"
                className="w-full min-h-[42px] rounded-lg border border-line-strong bg-surface pr-11 pl-3.5 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute top-1/2 right-1.5 flex min-h-[36px] min-w-[36px] -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="diary-setup-confirm" className="block text-sm font-medium text-ink-secondary">
              Confirm Password
            </label>
            <input
              id="diary-setup-confirm"
              type={showPassword ? 'text' : 'password'}
              value={confirmPasswordInput}
              onChange={(e) => {
                setConfirmPasswordInput(e.target.value);
                if (authError) setAuthError(null);
              }}
              placeholder="Re-enter password"
              className="mt-1.5 w-full min-h-[42px] rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
          </div>

          {authError && (
            <p
              role="alert"
              className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs font-medium text-danger-text"
            >
              {authError}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-fg transition-colors hover:bg-cta-hover"
          >
            <LockOpen className="h-4 w-4" aria-hidden="true" />
            <span>Create &amp; Unlock Diary</span>
          </button>
        </form>
      </section>
    );
  }

  // State 2: Locked Diary Gate
  if (!isUnlocked) {
    return (
      <section
        aria-labelledby="diary-locked-heading"
        className="mx-auto max-w-lg rounded-xl border border-line bg-surface p-6 sm:p-8"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-subtle text-ink">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id="diary-locked-heading" className="mt-4 font-display text-xl font-semibold text-ink">
          Personal Diary Locked
        </h2>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Enter your password to read and write your private daily reflections.
        </p>

        <form onSubmit={handleUnlockSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="diary-unlock-password" className="block text-sm font-medium text-ink-secondary">
              Diary Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="diary-unlock-password"
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="Enter password"
                autoFocus
                className="w-full min-h-[42px] rounded-lg border border-line-strong bg-surface pr-11 pl-3.5 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute top-1/2 right-1.5 flex min-h-[36px] min-w-[36px] -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {authError && (
            <p
              role="alert"
              className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs font-medium text-danger-text"
            >
              {authError}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-fg transition-colors hover:bg-cta-hover"
          >
            <LockOpen className="h-4 w-4" aria-hidden="true" />
            <span>Unlock Diary</span>
          </button>
        </form>

        <div className="mt-5 border-t border-line pt-4">
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Forgot password? Reset diary
            </button>
          ) : (
            <div className="space-y-2 rounded-lg border border-danger-border bg-danger-bg p-3">
              <p className="text-xs text-danger-text">
                Resetting removes your current diary password and clears saved diary entries. Continue?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetDiary();
                    setShowResetConfirm(false);
                    setPasswordInput('');
                    setAuthError(null);
                  }}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // State 3: Unlocked Personal Diary Workspace
  const visibleEntries = filterAndSortDiaryEntries(entries, searchQuery);

  return (
    <div className="space-y-6" data-testid="diary-unlocked-workspace">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Personal Diary</h2>
          <p className="text-xs text-ink-muted tabular-nums">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · Password protected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowChangePassword((prev) => !prev);
              setChangePwError(null);
              setChangePwSuccess(null);
            }}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-hover-surface"
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Change Password</span>
          </button>

          <button
            type="button"
            onClick={onLock}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-cta px-3.5 py-1.5 text-xs font-medium text-cta-fg transition-colors hover:bg-cta-hover"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Lock Diary</span>
          </button>
        </div>
      </div>

      {changePwSuccess && (
        <p className="rounded-lg border border-line bg-surface px-4 py-2.5 text-xs font-medium text-accent-text">
          {changePwSuccess}
        </p>
      )}

      {showChangePassword && (
        <form
          onSubmit={handleChangePassword}
          className="rounded-xl border border-line bg-surface p-5 space-y-3"
          noValidate
        >
          <h3 className="font-display text-sm font-semibold text-ink">Update Diary Password</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="diary-current-pw" className="block text-xs font-medium text-ink-secondary">
                Current Password
              </label>
              <input
                id="diary-current-pw"
                type="password"
                value={currentPw}
                onChange={(e) => {
                  setCurrentPw(e.target.value);
                  if (changePwError) setChangePwError(null);
                }}
                className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="diary-new-pw" className="block text-xs font-medium text-ink-secondary">
                New Password
              </label>
              <input
                id="diary-new-pw"
                type="password"
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value);
                  if (changePwError) setChangePwError(null);
                }}
                className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="diary-confirm-new-pw" className="block text-xs font-medium text-ink-secondary">
                Confirm New Password
              </label>
              <input
                id="diary-confirm-new-pw"
                type="password"
                value={confirmNewPw}
                onChange={(e) => {
                  setConfirmNewPw(e.target.value);
                  if (changePwError) setChangePwError(null);
                }}
                className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          {changePwError && (
            <p role="alert" className="text-xs font-medium text-danger-text">
              {changePwError}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-cta px-3.5 py-2 text-xs font-medium text-cta-fg hover:bg-cta-hover"
            >
              Update Password
            </button>
            <button
              type="button"
              onClick={() => setShowChangePassword(false)}
              className="rounded-lg border border-line bg-surface px-3.5 py-2 text-xs font-medium text-ink-secondary hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Entry Editor */}
        <section
          aria-labelledby="diary-composer-heading"
          className="rounded-xl border border-line bg-surface p-4 sm:p-6 lg:col-span-6"
        >
          <h3 id="diary-composer-heading" className="font-display text-base font-semibold text-ink">
            {editingEntryId ? 'Edit Journal Entry' : 'Write Today’s Thoughts'}
          </h3>

          <form onSubmit={handleEntrySubmit} className="mt-4 space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="diary-entry-date" className="block text-xs font-medium text-ink-secondary">
                  Date
                </label>
                <input
                  id="diary-entry-date"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 font-mono text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="diary-entry-title" className="block text-xs font-medium text-ink-secondary">
                  Title (optional)
                </label>
                <input
                  id="diary-entry-title"
                  type="text"
                  value={entryTitle}
                  onChange={(e) => {
                    setEntryTitle(e.target.value);
                    if (entryError) setEntryError(null);
                  }}
                  placeholder="e.g., Sunday Reflection"
                  className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-ink-secondary">Mood</span>
              <div className="mt-1.5 flex flex-wrap gap-1 rounded-lg bg-subtle p-1" role="group" aria-label="Select mood">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setEntryMood(mood)}
                    aria-pressed={entryMood === mood}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      entryMood === mood
                        ? 'bg-surface text-ink shadow-xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="diary-entry-content" className="block text-xs font-medium text-ink-secondary">
                Daily Thoughts
              </label>
              <textarea
                id="diary-entry-content"
                rows={7}
                value={entryContent}
                onChange={(e) => {
                  setEntryContent(e.target.value);
                  if (entryError) setEntryError(null);
                }}
                placeholder="Write freely about your day, lessons learned, or what is on your mind..."
                className="mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
              />
            </div>

            {entryError && (
              <p
                role="alert"
                className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs font-medium text-danger-text"
              >
                {entryError}
              </p>
            )}

            {entrySavedNotice && (
              <p className="text-xs font-medium text-accent-text">{entrySavedNotice}</p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="min-h-[42px] rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-fg transition-colors hover:bg-cta-hover"
              >
                {editingEntryId ? 'Update Entry' : 'Save Entry'}
              </button>
              {editingEntryId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="min-h-[42px] rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-secondary hover:text-ink"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Entries Archive */}
        <section
          aria-labelledby="diary-entries-heading"
          className="rounded-xl border border-line bg-surface p-4 sm:p-6 lg:col-span-6"
        >
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 id="diary-entries-heading" className="font-display text-base font-semibold text-ink">
              Saved Entries
            </h3>
            <div className="relative w-full sm:w-56">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search diary entries"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="w-full min-h-[36px] rounded-lg border border-line bg-subtle py-1.5 pr-3 pl-8 text-xs text-ink placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:outline-none"
              />
            </div>
          </div>

          {visibleEntries.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-ink">
                {entries.length === 0 ? 'No diary entries yet' : 'No entries match your search'}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {entries.length === 0
                  ? 'Write your first reflection on the left.'
                  : 'Try clearing your search filter.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line" data-testid="diary-entries-list">
              {visibleEntries.map((entry) => (
                <li key={entry.id} className="py-4 first:pt-4 last:pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-ink">{entry.title}</h4>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-muted">
                        <span className="font-mono tabular-nums">{entry.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{entry.mood}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(entry)}
                        aria-label={`Edit diary entry "${entry.title}"`}
                        className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        aria-label={`Delete diary entry "${entry.title}"`}
                        className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-ink-muted hover:bg-danger-bg hover:text-danger-text"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
                    {entry.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
