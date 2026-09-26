import type { TodoItem } from "./types";

export function todoNotes(todo: TodoItem): string {
  return todo.notes?.trim() ?? "";
}

/** Lower = more urgent. Pinned first, then newest. */
export function todoRank(todo: TodoItem): number {
  return todo.pinned ? 0 : 1;
}

export function sortOpenTodos<T extends TodoItem>(todos: T[]): T[] {
  return [...todos].sort(
    (a, b) =>
      todoRank(a) - todoRank(b) ||
      +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export function matchesQuery(todo: TodoItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    todo.title.toLowerCase().includes(q) ||
    todoNotes(todo).toLowerCase().includes(q)
  );
}
