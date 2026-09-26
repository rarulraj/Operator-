import type { NoteFolder, NoteItem } from "./types";

export const NOTES_INBOX = "notes";
export const NOTES_ALL = "all";
export const NOTES_TRASH = "trash";
export const NOTES_TAG_PREFIX = "tag:";

export type NotesFilter = string; // folder id | all | notes | trash | tag:foo

export type NotesSort = "edited" | "created" | "title";

const TRASH_MS = 30 * 86_400_000;

export function blankNote(folderId: string | null = null): NoteItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "",
    body: "",
    folderId,
    pinned: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function blankFolder(name: string): NoteFolder {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Untitled Folder",
    createdAt: new Date().toISOString(),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Lift old scratchpad jots (`text`) into title + HTML body. */
export function migrateNote(raw: NoteItem): NoteItem {
  const createdAt = raw.createdAt || new Date().toISOString();
  let title = raw.title ?? "";
  let body = raw.body ?? "";
  if (!body && raw.text) {
    const text = raw.text.replace(/\r\n/g, "\n");
    const first = text.split("\n").find((l) => l.trim()) ?? "";
    title = first.slice(0, 120);
    body = `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
  }
  return {
    id: raw.id,
    title,
    body,
    folderId: raw.folderId ?? null,
    pinned: Boolean(raw.pinned),
    createdAt,
    updatedAt: raw.updatedAt || createdAt,
    deletedAt: raw.deletedAt ?? null,
  };
}

export function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-3]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u00a0/g, " ")
    .trim();
}

export function titleFromBody(html: string): string {
  const first = plainText(html).split("\n").find((l) => l.trim()) ?? "";
  return first.slice(0, 120);
}

export function displayTitle(note: NoteItem): string {
  return (note.title || titleFromBody(note.body) || "New Note").trim();
}

export function snippet(note: NoteItem, max = 90): string {
  const lines = plainText(note.body).split("\n").map((l) => l.trim()).filter(Boolean);
  const rest = lines.slice(1).join(" ");
  if (!rest) return "No additional text";
  return rest.length > max ? rest.slice(0, max - 1) + "…" : rest;
}

export function extractTags(note: NoteItem): string[] {
  const text = `${note.title} ${plainText(note.body)}`;
  const found = text.match(/#[\p{L}\p{N}_-]+/gu) ?? [];
  return [...new Set(found.map((t) => t.slice(1).toLowerCase()))];
}

export function allTags(notes: NoteItem[]): string[] {
  const set = new Set<string>();
  for (const n of notes) {
    if (n.deletedAt) continue;
    for (const t of extractTags(n)) set.add(t);
  }
  return [...set].sort();
}

export function formatNoteDateFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (now.getFullYear() === d.getFullYear()) {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function isTrashExpired(note: NoteItem, now = Date.now()): boolean {
  if (!note.deletedAt) return false;
  return now - +new Date(note.deletedAt) > TRASH_MS;
}

export function matchesNoteQuery(note: NoteItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    displayTitle(note).toLowerCase().includes(q) ||
    plainText(note.body).toLowerCase().includes(q)
  );
}

export function visibleNotes(
  notes: NoteItem[],
  filter: NotesFilter,
  query: string,
  sort: NotesSort,
): NoteItem[] {
  const trash = filter === NOTES_TRASH;
  let list = notes.filter((n) => (trash ? Boolean(n.deletedAt) : !n.deletedAt));
  if (filter === NOTES_INBOX) list = list.filter((n) => !n.folderId);
  else if (filter.startsWith(NOTES_TAG_PREFIX)) {
    const tag = filter.slice(NOTES_TAG_PREFIX.length);
    list = list.filter((n) => extractTags(n).includes(tag));
  } else if (filter !== NOTES_ALL && filter !== NOTES_TRASH) {
    list = list.filter((n) => n.folderId === filter);
  }
  list = list.filter((n) => matchesNoteQuery(n, query));
  list.sort((a, b) => {
    if (!trash && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "title") {
      return displayTitle(a).localeCompare(displayTitle(b), undefined, {
        sensitivity: "base",
      });
    }
    const ak = sort === "created" ? a.createdAt : a.updatedAt;
    const bk = sort === "created" ? b.createdAt : b.updatedAt;
    return +new Date(bk) - +new Date(ak);
  });
  return list;
}

export function folderNoteCount(
  notes: NoteItem[],
  folderId: string | null,
): number {
  return notes.filter((n) => !n.deletedAt && n.folderId === folderId).length;
}
