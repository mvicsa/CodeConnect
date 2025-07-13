import { Metadata } from "next";
import ChatInterface from "@/components/ChatInterface";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat page for user interactions",
};

const Chat = () => {
  return (
    <div className="w-full">
      <ChatInterface />
    </div>
  );
};

export default Chat;
