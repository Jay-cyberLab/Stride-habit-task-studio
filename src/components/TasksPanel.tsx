import React, { useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Check, Minus, Plus, Search, Trash2 } from 'lucide-react';
import { Task, TaskCategory, TaskPriority, TaskStatusFilter } from '../types';
import { filterAndSortTasks, validateTaskInput } from '../utils/tasks';

interface TasksPanelProps {
  tasks: Task[];
  todayStr: string;
  globalSearchQuery?: string;
  onClearGlobalSearch?: () => void;
  onAddTask: (input: {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate?: string;
  }) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  onDeleteTask: (taskId: string) => void;
  onClearCompleted: () => void;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Personal', 'Health', 'Learning', 'Finance'];
const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];

function PriorityMeta({ priority }: { priority: TaskPriority }) {
  if (priority === 'high') {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-danger-text">
        <ArrowUp className="h-3 w-3" aria-hidden="true" />
        <span>High priority</span>
      </span>
    );
  }
  if (priority === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-warn-text">
        <Minus className="h-3 w-3" aria-hidden="true" />
        <span>Medium priority</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-ink-muted">
      <ArrowDown className="h-3 w-3" aria-hidden="true" />
      <span>Low priority</span>
    </span>
  );
}

export function TasksPanel({
  tasks,
  todayStr,
  globalSearchQuery = '',
  onClearGlobalSearch,
  onAddTask,
  onToggleTask,
  onUpdateTaskPriority,
  onDeleteTask,
  onClearCompleted,
}: TasksPanelProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const localFilteredTasks = filterAndSortTasks(tasks, {
    category: categoryFilter,
    priority: priorityFilter,
    status: statusFilter,
    search: searchQuery,
  });

  const filteredTasks = globalSearchQuery.trim()
    ? filterAndSortTasks(localFilteredTasks, {
        category: 'All',
        priority: 'all',
        status: 'all',
        search: globalSearchQuery,
      })
    : localFilteredTasks;

  const completedCount = tasks.filter((t) => t.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateTaskInput({ title });
    if (error) {
      setFormError(error);
      return;
    }

    onAddTask({
      title: title.trim(),
      category,
      priority,
      dueDate: dueDate || undefined,
    });
    setTitle('');
    setDueDate('');
    setFormError(null);
  };

  const resetFilters = () => {
    setCategoryFilter('All');
    setPriorityFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    onClearGlobalSearch?.();
  };

  const hasActiveFilters =
    categoryFilter !== 'All' ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim() !== '' ||
    globalSearchQuery.trim() !== '';

  return (
    <section
      aria-labelledby="tasks-section-heading"
      className="rounded-xl border border-line bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 id="tasks-section-heading" className="font-display text-lg font-semibold text-ink">
            To-Do List
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted tabular-nums">
            {tasks.length - completedCount} open · {completedCount} completed
          </p>
        </div>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="text-xs font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline whitespace-nowrap"
          >
            Clear completed
          </button>
        )}
      </div>

      {/* Quick Add Task Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-2.5" noValidate>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="new-task-title" className="sr-only">
              Task title
            </label>
            <input
              id="new-task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Add a task (e.g., Submit Q4 budget)..."
              className="w-full min-h-[42px] rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-fg transition-colors hover:bg-cta-hover whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Task</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div>
            <label htmlFor="new-task-category" className="sr-only">
              Category
            </label>
            <select
              id="new-task-category"
              aria-label="Task category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full sm:w-auto min-h-[38px] rounded-lg border border-line bg-subtle px-2.5 py-1.5 text-xs font-medium text-ink-secondary focus:border-accent focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="new-task-priority" className="sr-only">
              Priority
            </label>
            <select
              id="new-task-priority"
              aria-label="Task priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full sm:w-auto min-h-[38px] rounded-lg border border-line bg-subtle px-2.5 py-1.5 text-xs font-medium text-ink-secondary focus:border-accent focus:outline-none"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="new-task-due" className="sr-only">
              Due date
            </label>
            <input
              id="new-task-due"
              type="date"
              aria-label="Due date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full sm:w-auto min-h-[38px] rounded-lg border border-line bg-subtle px-2.5 py-1.5 font-mono text-xs text-ink-secondary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {formError && (
          <p
            role="alert"
            className="flex items-center gap-1.5 rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs font-medium text-danger-text"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </p>
        )}
      </form>

      {/* Filter & Search Bar */}
      <div className="mt-5 space-y-2.5 border-t border-line pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search tasks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full min-h-[36px] rounded-lg border border-line bg-subtle py-1.5 pr-3 pl-8 text-xs text-ink placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:outline-none"
            />
          </div>

          <div
            className="inline-flex w-full sm:w-auto items-center rounded-lg bg-subtle p-1"
            role="group"
            aria-label="Filter tasks by status"
          >
            {(['all', 'active', 'completed'] as TaskStatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                aria-pressed={statusFilter === status}
                className={`flex-1 sm:flex-initial rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Priority Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex w-full sm:w-auto items-center gap-1 overflow-x-auto rounded-lg bg-subtle p-1"
            role="group"
            aria-label="Filter tasks by category"
          >
            <button
              type="button"
              onClick={() => setCategoryFilter('All')}
              aria-pressed={categoryFilter === 'All'}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === 'All'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                aria-pressed={categoryFilter === cat}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            className="flex w-full sm:w-auto items-center gap-1 overflow-x-auto rounded-lg bg-subtle p-1"
            role="group"
            aria-label="Filter tasks by priority"
          >
            <button
              type="button"
              onClick={() => setPriorityFilter('all')}
              aria-pressed={priorityFilter === 'all'}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                priorityFilter === 'all'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Any Priority
            </button>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                aria-pressed={priorityFilter === p}
                className={`rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                  priorityFilter === p
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-ink">
            {tasks.length === 0 ? 'Your task list is empty' : 'No tasks match your filters'}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {tasks.length === 0
              ? 'Add a categorized task with a priority tag above.'
              : 'Try adjusting your category, priority, or search filter.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-subtle"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line" data-testid="tasks-list">
          {filteredTasks.map((task) => {
            const nextPriority: TaskPriority =
              task.priority === 'high' ? 'medium' : task.priority === 'medium' ? 'low' : 'high';
            return (
              <li
                key={task.id}
                className="group flex items-start justify-between gap-2 py-3 first:pt-2 last:pb-1"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? `Mark "${task.title}" as incomplete`
                        : `Mark "${task.title}" as complete`
                    }
                    aria-pressed={task.completed}
                    className="flex min-h-[44px] min-w-[44px] -my-1.5 -ml-2 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                        task.completed
                          ? 'border-accent bg-accent text-accent-fg'
                          : 'border-line-strong bg-surface text-transparent hover:border-ink-muted'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  </button>

                  <div className="min-w-0 pt-0.5">
                    <p
                      className={`text-sm font-medium leading-snug break-words ${
                        task.completed ? 'text-ink-muted line-through' : 'text-ink'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ink-muted">
                      <span className="font-medium text-ink-secondary">{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => onUpdateTaskPriority(task.id, nextPriority)}
                        title="Click to cycle priority"
                        aria-label={`Change priority for "${task.title}", currently ${task.priority}`}
                        className="rounded px-0.5 transition-colors hover:bg-subtle"
                      >
                        <PriorityMeta priority={task.priority} />
                      </button>
                      {task.dueDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">Due {task.dueDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  aria-label={`Delete "${task.title}"`}
                  className="flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger-text"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
