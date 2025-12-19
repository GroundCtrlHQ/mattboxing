import { ChatInterface } from '@/components/ChatInterface';
import { getAllSessions } from '@/lib/chat-sessions';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ sessionId?: string[] }>;
}) {
  const { sessionId: sessionIdArray } = await params;
  const sessionId = sessionIdArray?.[0] || null;
  const sessions = await getAllSessions(20);

  return <ChatInterface initialSessionId={sessionId} sessions={sessions} />;
}

