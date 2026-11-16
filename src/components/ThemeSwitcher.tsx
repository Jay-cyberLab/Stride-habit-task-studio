import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Palette } from 'lucide-react';
import { APP_THEMES } from '../data/seed';
import { AppThemeId } from '../types';

interface ThemeSwitcherProps {
  activeTheme: AppThemeId;
  onSelectTheme: (theme: AppThemeId) => void;
}

export function ThemeSwitcher({ activeTheme, onSelectTheme }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTheme = APP_THEMES.find((t) => t.id === activeTheme) ?? APP_THEMES[0];

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Theme: ${currentTheme.name}. Change color theme`}
        className="inline-flex min-h-[40px] items-center gap-1.5 lg:gap-2 rounded-lg border border-line bg-surface px-2 lg:px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-subtle whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Palette className="hidden lg:block h-4 w-4 text-ink-muted" aria-hidden="true" />
        <span className="inline-flex items-center -space-x-1" aria-hidden="true">
          {currentTheme.swatches.map((hex, idx) => (
            <span
              key={idx}
              className="h-3 w-3 rounded-full border border-line-strong"
              style={{ backgroundColor: hex }}
            />
          ))}
        </span>
        <span className="hidden lg:inline">{currentTheme.name}</span>
        <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Select color theme"
          className="fixed inset-x-3 top-[68px] z-50 rounded-xl border border-line bg-surface p-1.5 shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-64"
        >
          {APP_THEMES.map((theme) => {
            const isSelected = theme.id === activeTheme;
            return (
              <button
                key={theme.id}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  onSelectTheme(theme.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isSelected ? 'bg-subtle text-ink' : 'text-ink-secondary hover:bg-subtle/60 hover:text-ink'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex shrink-0 items-center -space-x-1" aria-hidden="true">
                    {theme.swatches.map((hex, idx) => (
                      <span
                        key={idx}
                        className="h-3.5 w-3.5 rounded-full border border-line-strong"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">{theme.name}</p>
                    <p className="truncate text-[11px] text-ink-muted">{theme.description}</p>
                  </div>
                </div>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
