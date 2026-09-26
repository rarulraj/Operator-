import { NotesClient } from "@/components/notes-client";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const state = await getStore().getState();

  return (
    <div className="apple-notes-shell">
      <NotesClient notes={state.notes} folders={state.noteFolders} />
    </div>
  );
}
