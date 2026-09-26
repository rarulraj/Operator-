import { ChatClient } from "@/components/chat-client";
import { getStore } from "@/lib/store";
import { isOpenAiConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const state = await getStore().getState();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">AI Chat</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Talk to your coach. Tell it about your life: people, plans, constraints,
          numbers. Save the durable facts as context. Everything saved here feeds
          every insight, classification, quest, and weekly review.
        </p>
      </div>
      <ChatClient
        chat={state.chat}
        contextNotes={state.contextNotes}
        aiConfigured={isOpenAiConfigured()}
      />
    </div>
  );
}
