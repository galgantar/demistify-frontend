import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    system: `You are an AI coordinator for a consensus learning system. 
    You help users understand the contributions of different AI agents in the system.
    The system has multiple agents (Alpha, Beta, Gamma, Delta, Epsilon) that work together to solve machine learning problems.
    Each agent has its own specialty and contributes to the consensus model in different ways.
    Provide helpful information about how the agents work together, their contributions, and the consensus learning process.`,
  })

  return result.toDataStreamResponse()
}

