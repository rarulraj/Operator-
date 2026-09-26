"use client";

import {
  CheckSquare,
  ChevronLeft,
  Folder,
  FolderPlus,
  List,
  ListOrdered,
  Pin,
  Plus,
  Search,
  SquarePen,
  StickyNote,
  Table,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createFolderAction,
  createNoteAction,
  deleteFolderAction,
  emptyTrashAction,
  noteToTaskAction,
  purgeNoteAction,
  restoreNoteAction,
  saveNoteAction,
  trashNoteAction,
} from "@/app/actions";
import {
  NOTES_ALL,
  NOTES_INBOX,
  NOTES_TRASH,
  allTags,
  displayTitle,
  folderNoteCount,
  formatNoteDate,
  formatNoteDateFull,
  snippet,
  titleFromBody,
  visibleNotes,
  type NotesFilter,
} from "@/lib/notes";
import type { NoteFolder, NoteItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NotesClient({
  notes: initialNotes,
  folders: initialFolders,
}: {
  notes: NoteItem[];
  folders: NoteFolder[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [folders, setFolders] = useState(initialFolders);
  const [filter, setFilter] = useState<NotesFilter>(NOTES_ALL);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNotes.find((n) => !n.deletedAt)?.id ?? null,
  );
  const [mobileEditor, setMobileEditor] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);

  const list = useMemo(
    () => visibleNotes(notes, filter, query, "edited"),
    [notes, filter, query],
  );
  const selected = notes.find((n) => n.id === selectedId) ?? null;
  const tags = useMemo(() => allTags(notes), [notes]);
  const inTrash = filter === NOTES_TRASH;
  const trashCount = notes.filter((n) => n.deletedAt).length;
  const allCount = notes.filter((n) => !n.deletedAt).length;

  useEffect(() => {
    if (selectedId && !list.some((n) => n.id === selectedId) && list[0]) {
      setSelectedId(list[0].id);
    }
  }, [list, selectedId]);

  async function createNote() {
    if (inTrash) setFilter(NOTES_ALL);
    const folderId =
      filter === NOTES_ALL ||
      filter === NOTES_INBOX ||
      filter === NOTES_TRASH ||
      filter.startsWith("tag:")
        ? null
        : filter;
    const note = await createNoteAction(folderId);
    setNotes((ns) => [note, ...ns]);
    setSelectedId(note.id);
    setMobileEditor(true);
  }

  const createNoteRef = useRef(createNote);
  createNoteRef.current = createNote;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        void createNoteRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function patchLocal(id: string, patch: Partial<NoteItem>) {
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  async function trashSelected() {
    if (!selected) return;
    if (inTrash) {
      await purgeNoteAction(selected.id);
      setNotes((ns) => ns.filter((n) => n.id !== selected.id));
      setSelectedId(null);
      return;
    }
    const deletedAt = new Date().toISOString();
    patchLocal(selected.id, { deletedAt });
    await trashNoteAction(selected.id);
  }

  const pinned = list.filter((n) => n.pinned && !n.deletedAt);
  const rest = list.filter((n) => !n.pinned || n.deletedAt);

  return (
    <div className="apple-notes flex h-full min-h-0 w-full overflow-hidden">
      {/* Folders */}
      <aside className="an-sidebar hidden w-[210px] shrink-0 flex-col border-r border-ink-800 md:flex">
        <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          On My Mac
        </div>
        <FolderRow
          active={filter === NOTES_ALL}
          icon={<StickyNote size={15} fill="#f2b83b" stroke="#b45309" />}
          label="Notes"
          count={allCount}
          onClick={() => setFilter(NOTES_ALL)}
        />
        {folders.map((f) => (
          <FolderRow
            key={f.id}
            active={filter === f.id}
            icon={<Folder size={15} fill="#f2b83b" stroke="#b45309" />}
            label={f.name}
            count={folderNoteCount(notes, f.id)}
            onClick={() => setFilter(f.id)}
            onDelete={() => {
              void deleteFolderAction(f.id);
              setFolders((fs) => fs.filter((x) => x.id !== f.id));
              setNotes((ns) =>
                ns.map((n) => (n.folderId === f.id ? { ...n, folderId: null } : n)),
              );
              if (filter === f.id) setFilter(NOTES_ALL);
            }}
          />
        ))}
        {addingFolder ? (
          <form
            className="px-3 py-1"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!folderName.trim()) {
                setAddingFolder(false);
                return;
              }
              const f = await createFolderAction(folderName);
              setFolders((fs) => [...fs, f]);
              setFolderName("");
              setAddingFolder(false);
              setFilter(f.id);
            }}
          >
            <input
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onBlur={() => {
                if (!folderName.trim()) setAddingFolder(false);
              }}
              placeholder="New Folder"
              className="w-full rounded-md border border-ink-700 bg-ink-850 px-2 py-1 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600"
            />
          </form>
        ) : (
          <button
            onClick={() => setAddingFolder(true)}
            className="mx-2 mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-zinc-500 hover:bg-ink-800 hover:text-zinc-300"
          >
            <FolderPlus size={14} /> New Folder
          </button>
        )}
        {tags.length > 0 && (
          <>
            <div className="mt-3 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Tags
            </div>
            {tags.map((t) => (
              <FolderRow
                key={t}
                active={filter === `tag:${t}`}
                icon={<span className="text-[13px] font-semibold text-xp">#</span>}
                label={t}
                onClick={() => setFilter(`tag:${t}`)}
              />
            ))}
          </>
        )}
        <div className="mt-auto border-t border-ink-800 py-1">
          <FolderRow
            active={filter === NOTES_TRASH}
            icon={<Trash2 size={15} className="text-zinc-500" />}
            label="Recently Deleted"
            count={trashCount}
            onClick={() => setFilter(NOTES_TRASH)}
          />
          {inTrash && trashCount > 0 && (
            <button
              onClick={async () => {
                await emptyTrashAction();
                setNotes((ns) => ns.filter((n) => !n.deletedAt));
                setSelectedId(null);
              }}
              className="mx-2 mb-1 w-[calc(100%-1rem)] rounded-md px-2 py-1 text-left text-[12px] text-red-400 hover:bg-ink-800"
            >
              Erase All
            </button>
          )}
        </div>
      </aside>

      {/* List */}
      <section
        className={cn(
          "an-list flex w-full shrink-0 flex-col border-r border-ink-800 md:w-[280px]",
          mobileEditor && "hidden md:flex",
        )}
      >
        <div className="flex items-center gap-2 border-b border-ink-800 px-3 py-2">
          <div className="relative min-w-0 flex-1">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="an-search w-full rounded-[10px] bg-ink-850 py-[7px] pl-8 pr-3 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none"
            />
          </div>
          <button
            onClick={() => void createNote()}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-xp hover:bg-ink-800"
            aria-label="New note"
            title="New Note (⌘N)"
          >
            <SquarePen size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.length === 0 && (
            <p className="px-4 py-10 text-center text-[13px] text-zinc-500">
              No Notes
            </p>
          )}
          {pinned.length > 0 && (
            <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Pinned
            </div>
          )}
          {pinned.map((n) => (
            <NoteRow
              key={n.id}
              note={n}
              active={n.id === selectedId}
              onClick={() => {
                setSelectedId(n.id);
                setMobileEditor(true);
              }}
            />
          ))}
          {pinned.length > 0 && rest.length > 0 && (
            <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Notes
            </div>
          )}
          {rest.map((n) => (
            <NoteRow
              key={n.id}
              note={n}
              active={n.id === selectedId}
              onClick={() => {
                setSelectedId(n.id);
                setMobileEditor(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* Editor */}
      <section
        className={cn(
          "an-editor min-w-0 flex-1 flex-col",
          mobileEditor ? "flex" : "hidden md:flex",
        )}
      >
        <div className="flex items-center gap-1 border-b border-ink-800 px-2 py-1.5">
          <button
            onClick={() => setMobileEditor(false)}
            className="mr-1 rounded-md p-1.5 text-xp md:hidden"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          {selected && !inTrash && (
            <>
              <ToolBtn
                title="Checklist"
                onClick={() => document.execCommand("insertHTML", false, CHECK_HTML)}
              >
                <CheckSquare size={16} />
              </ToolBtn>
              <ToolBtn
                title="Title"
                onClick={() => document.execCommand("formatBlock", false, "h1")}
              >
                <Type size={16} />
              </ToolBtn>
              <ToolBtn
                title="Bulleted list"
                onClick={() => document.execCommand("insertUnorderedList")}
              >
                <List size={16} />
              </ToolBtn>
              <ToolBtn
                title="Numbered list"
                onClick={() => document.execCommand("insertOrderedList")}
              >
                <ListOrdered size={16} />
              </ToolBtn>
              <ToolBtn
                title="Table"
                onClick={() => document.execCommand("insertHTML", false, TABLE_HTML)}
              >
                <Table size={16} />
              </ToolBtn>
              <span className="mx-1 h-4 w-px bg-ink-700" />
              <ToolBtn
                title={selected.pinned ? "Unpin" : "Pin"}
                onClick={() => {
                  const pinnedNext = !selected.pinned;
                  patchLocal(selected.id, { pinned: pinnedNext });
                  void saveNoteAction(selected.id, { pinned: pinnedNext });
                }}
              >
                <Pin size={16} fill={selected.pinned ? "#f2b83b" : "none"} />
              </ToolBtn>
              <ToolBtn
                title="Add to Tasks"
                onClick={() => void noteToTaskAction(selected.id)}
              >
                <Plus size={16} />
              </ToolBtn>
              <div className="ml-auto" />
              <ToolBtn title="Delete" onClick={() => void trashSelected()}>
                <Trash2 size={16} />
              </ToolBtn>
            </>
          )}
          {selected && inTrash && (
            <>
              <button
                onClick={async () => {
                  patchLocal(selected.id, { deletedAt: null });
                  await restoreNoteAction(selected.id);
                  setFilter(NOTES_ALL);
                }}
                className="rounded-md px-2 py-1 text-[13px] text-xp hover:bg-ink-800"
              >
                Recover
              </button>
              <button
                onClick={() => void trashSelected()}
                className="ml-auto rounded-md px-2 py-1 text-[13px] text-red-400 hover:bg-ink-800"
              >
                Erase
              </button>
            </>
          )}
        </div>
        {selected ? (
          <NoteEditor
            key={selected.id}
            note={selected}
            readOnly={inTrash}
            onChange={(patch) => {
              patchLocal(selected.id, { ...patch, updatedAt: new Date().toISOString() });
              void saveNoteAction(selected.id, patch);
            }}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-[15px] text-zinc-600">
            No notes
          </div>
        )}
      </section>
    </div>
  );
}

const CHECK_HTML =
  '<ul class="an-checks"><li class="an-item" data-checked="false"><br></li></ul>';
const TABLE_HTML =
  '<table class="an-table"><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table>';

function FolderRow({
  active,
  icon,
  label,
  count,
  onClick,
  onDelete,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group mx-2 flex items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[13px]",
        active
          ? "bg-ink-700 font-semibold text-zinc-100"
          : "text-zinc-300 hover:bg-ink-800",
      )}
    >
      <span className="flex w-5 justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" && (
        <span className="text-[11px] tabular-nums text-zinc-500">{count || ""}</span>
      )}
      {onDelete && (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="hidden text-red-400 group-hover:inline"
        >
          ×
        </span>
      )}
    </button>
  );
}

function ToolBtn({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded-md p-1.5 text-zinc-400 hover:bg-ink-800 hover:text-zinc-200"
    >
      {children}
    </button>
  );
}

function NoteRow({
  note,
  active,
  onClick,
}: {
  note: NoteItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "an-row w-full px-2 py-0.5 text-left",
        active && "an-row-selected",
      )}
    >
      <div className="an-row-inner flex items-start gap-1 px-3 py-2">
        {note.pinned && (
          <Pin size={10} className="mt-1 shrink-0 text-xp" fill="#f2b83b" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold tracking-tight text-zinc-100">
            {displayTitle(note)}
          </div>
          <div className="mt-0.5 truncate text-[13px] text-zinc-500">
            <span className="font-semibold text-zinc-300">
              {formatNoteDate(note.updatedAt || note.createdAt)}
            </span>{" "}
            {snippet(note)}
          </div>
        </div>
      </div>
    </button>
  );
}

function initialEditorHtml(note: NoteItem): string {
  const body = (note.body || "").trim();
  if (body) return note.body;
  if (note.text) {
    return `<p>${escapeHtml(note.text).replace(/\n/g, "<br>")}</p>`;
  }
  if (note.title?.trim()) return `<p>${escapeHtml(note.title)}</p>`;
  return "";
}

function NoteEditor({
  note,
  readOnly,
  onChange,
}: {
  note: NoteItem;
  readOnly: boolean;
  onChange: (patch: { title?: string; body?: string }) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = initialEditorHtml(note);
    }
  }, [note.id]);

  function flush() {
    const html = bodyRef.current?.innerHTML ?? "";
    onChange({ title: titleFromBody(html), body: html });
  }

  function schedule() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), 400);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="px-10 pt-6 text-center text-[12px] leading-none text-zinc-500">
        {formatNoteDateFull(note.updatedAt || note.createdAt)}
      </div>
      <div
        ref={bodyRef}
        contentEditable={!readOnly}
        data-placeholder="Start writing…"
        className="an-body flex-1 px-10 pb-24 pt-5"
        onInput={schedule}
        onBlur={() => flush()}
        onClick={(e) => {
          const item = (e.target as HTMLElement).closest(".an-item") as HTMLElement | null;
          if (!item || readOnly) return;
          const rect = item.getBoundingClientRect();
          if (e.clientX - rect.left > 26) return;
          e.preventDefault();
          item.dataset.checked = item.dataset.checked === "true" ? "false" : "true";
          flush();
        }}
        onPaste={(e) => {
          const file = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
          if (!file) return;
          e.preventDefault();
          const blob = file.getAsFile();
          if (!blob) return;
          const reader = new FileReader();
          reader.onload = () => {
            document.execCommand(
              "insertHTML",
              false,
              `<img src="${reader.result as string}" alt="" />`,
            );
            schedule();
          };
          reader.readAsDataURL(blob);
        }}
      />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
