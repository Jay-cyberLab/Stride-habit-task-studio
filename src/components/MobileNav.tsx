import { BookLock, CheckSquare, Flame, LayoutGrid, Target } from 'lucide-react';
import { WorkspaceView } from '../types';

interface MobileNavProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
}

const ITEMS: { id: WorkspaceView; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutGrid },
  { id: 'habits', label: 'Habits', Icon: Target },
  { id: 'tasks', label: 'Tasks', Icon: CheckSquare },
  { id: 'streaks', label: 'Streaks', Icon: Flame },
  { id: 'diary', label: 'Diary', Icon: BookLock },
];

export function MobileNav({ activeView, onSelectView }: MobileNavProps) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid h-14 grid-cols-5 border-t border-line bg-surface/95 backdrop-blur-md md:hidden"
    >
      {ITEMS.map(({ id, label, Icon }) => {
        const isActive = activeView === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectView(id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-accent-text' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
