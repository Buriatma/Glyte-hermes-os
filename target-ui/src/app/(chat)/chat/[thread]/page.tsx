import ChatBot from "@/components/chat-bot";

export default async function ThreadPage(props: {
  params: Promise<{ thread: string }> | { thread: string };
}) {
  const resolved = await Promise.resolve(props.params);
  const threadId = resolved.thread;
  return <ChatBot threadId={threadId} initialMessages={[]} key={threadId} />;
}
