"use client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { useState, useEffect, useRef } from "react"

const BACKEND_ROUTE = 'http://localhost:80/api/routes/chat/'

export function ChatInterface() {
  
  const [messages, setMessages] = useState([
    { 
      id: 1,
      text: "Hi, I'm Artemis! 👋 I'm your Copilot for Flare, ready to help you with operations like generating wallets, sending tokens, and executing token swaps. \n\n⚠️ While I aim to be accurate, never risk funds you can't afford to lose.",
      type: 'bot' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [shapleyValues, setShapleyValues] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    try {
      const response = await fetch(BACKEND_ROUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            system_message: "Give definitive answers, don't be vague or ambiguous. Even if you don't know the answer.",
            user_message: text
          }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Check if response contains a transaction preview
      if (data.response.includes('Transaction Preview:')) {
        setAwaitingConfirmation(true);
        setPendingTransaction(text);
      }

      if (data.shapley_values) {
        setShapleyValues(data.shapley_values);
      }
      
      return data.response;
    } catch (error) {
      console.error('Error:', error);
      return 'Sorry, there was an error processing your request. Please try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setMessages(prev => [...prev, { id: prev.length + 1, text: messageText, type: 'user' }]);

    // Handle transaction confirmation
    if (awaitingConfirmation) {
      if (messageText.toUpperCase() === 'CONFIRM') {
        setAwaitingConfirmation(false);
        const response = await handleSendMessage(pendingTransaction);
        setMessages(prev => [...prev, { text: response, type: 'bot' }]);
      } else {
        setAwaitingConfirmation(false);
        setPendingTransaction(null);
        setMessages(prev => [...prev, { 
          text: 'Transaction cancelled. How else can I help you?', 
          type: 'bot' 
        }]);
      }
    } else {
      const response = await handleSendMessage(messageText);
      setMessages(prev => [...prev, { id: prev.length + 1, text: response, type: 'bot' }]);
    }

    setIsLoading(false);
  };

  // Custom components for ReactMarkdown
  const MarkdownComponents = {
    // Override paragraph to remove default margins
    p: ({ children }) => <span className="inline">{children}</span>,
    // Style code blocks
    code: ({ node, inline, className, children, ...props }) => (
      inline ? 
        <code className="bg-gray-200 rounded px-1 py-0.5 text-sm">{children}</code> :
        <pre className="bg-gray-200 rounded p-2 my-2 overflow-x-auto">
          <code {...props} className="text-sm">{children}</code>
        </pre>
    ),
    // Style links
    a: ({ node, children, ...props }) => (
      <a {...props} className="text-pink-600 hover:underline">{children}</a>
    )
  };

  return (
    <Card className="h-[calc(100vh-150px)] flex flex-col">
      <CardHeader>
        <CardTitle>Consensus Learning Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Start a conversation with the consensus learning system
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8">
                    {message.type === "user" ? (
                      <>
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                        <AvatarFallback>U</AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="System" />
                        <AvatarFallback>S</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className={`rounded-lg p-3 ${message.type === "user" ? "bg-[#e61f57] text-white" : "bg-muted"}`}>
                    {message.text}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="System" />
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"></div>
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce delay-75"></div>
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Ask about consensus learning..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading} className="bg-[#e61f57] hover:bg-[#e61f57]/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

