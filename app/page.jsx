export default function Home() {
  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-6 text-center">Consensus Learning Agents</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-1">
          <AgentList />
        </div>
        <div className="lg:col-span-2">
          <ChatInterface />
        </div>
      </div>
    </main>
  )
}

import { AgentList } from "@/components/agent-list"
import { ChatInterface } from "@/components/chat-interface"

