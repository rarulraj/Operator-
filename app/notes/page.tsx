import { NotesClient } from "@/components/notes-client";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const state = await getStore().getState();
  const notes = [...state.notes].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Notes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The field journal. Quick thoughts, ideas, things to remember — no XP, no
          structure, no judgment. Just get it down; every note is saved to disk the
          moment you add it.
        </p>
      </div>
      <NotesClient notes={notes} />
    </div>
  );
}
