"use client"

import { useState, useId } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"

import { CardFooter } from "@/components/ui/card"
import { Send } from "lucide-react"
import { useEffect, useRef } from "react"


const BACKEND_ROUTE = 'http://localhost:8080/api/routes/'


export default function Home() {
  
  // AGENTS STATE
  const [expandedAgents, setExpandedAgents] = useState([])
  const [agents, setAgents] = useState([])
  const [newAgent, setNewAgent] = useState({
    name: "",
    address: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const dialogId = useId()

  const toggleAgent = (agentId) => {
    setExpandedAgents((prev) => (prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]))
  }

  const fetchAgents = async () => {
    const response = await fetch(BACKEND_ROUTE + 'list-agents',
      {
        method: 'POST'
      }
    );
    const data = await response.json();

    const agents = data.map((agent) => ({
      id: agent.model_id,
      model_id: agent.model_id,
      icon: "/placeholder.svg?height=40&width=40",
      address: agent.public_key,
      shapleyValue: null,
      contributions: [],
      status: "active"
    }));
    setAgents(agents);
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleAddAgent = () => {
    if (newAgent.name && newAgent.address) {
      const newAgentObj = {
        id: agents.length + 1,
        name: newAgent.name,
        icon: "/placeholder.svg?height=40&width=40",
        address: newAgent.address,
        shapleyValue: 0.1, // Fixed initial value
        status: "active",
      }
      setAgents([...agents, newAgentObj])
      setNewAgent({ name: "", address: "" })
      setIsDialogOpen(false)
    }
  }

  // CHAT STATE
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
  // const [shapleyValues, setShapleyValues] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    try {
      const response = await fetch(BACKEND_ROUTE + 'chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            // system_message: "Give definitive answers, don't be vague or ambiguous. Even if you don't know the answer.",
            message: text
          }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      console.log("RESPONSES", data)

      // agents.forEach((agent) => {
      //   if (data.response_data[agent.id]) {
      //     setMessages(prev => [...prev, { 
      //       id: prev.length + 1,
      //       text: data.response_data[agent.id],
      //       type: 'bot'
      //     }]);
      //   }
      // });
      
      setAgents(prevAgents => 
        prevAgents.map(agent => ({
          ...agent,

          shapleyValue: data.shapley_values[agent.id],

          contributions: [
            ...agent.contributions,
            {
              id: prevAgents.length + 1,
              message: "ITERATION 0: " + data.response_data.iteration_0[agent.id],
              timestamp: new Date().toISOString()
            },
            {
              id: prevAgents.length + 2,
              message: "ITERATION 1: (based on consensus) " + data.response_data.iteration_1[agent.id],
              timestamp: new Date().toISOString()
            },
            {
              id: prevAgents.length + 3,
              message: "ITERATION 2: (based on consensus) " + data.response_data.iteration_2[agent.id],
              timestamp: new Date().toISOString()
            },
            {
              id: prevAgents.length + 4,
              message: "ITERATION 3: (based on consensus) " + data.response_data.iteration_3[agent.id],
              timestamp: new Date().toISOString()
            }
          ]
        }))
      );
      
      // Check if response contains a transaction preview
      if (data.response.includes('Transaction Preview:')) {
        setAwaitingConfirmation(true);
        setPendingTransaction(text);
      }

      // if (data.shapley_values) {
      //   setShapleyValues(data.shapley_values);
      // }
      
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
  
  
  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-6 text-center">Consensus Learning Agents</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-1">
          <Card className="h-[calc(100vh-150px)] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contributing Agents</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#e61f57] hover:bg-[#e61f57]/90">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Model
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Model</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`name-${dialogId}`} className="text-right">
                        Name
                      </Label>
                      <Input
                        id={`name-${dialogId}`}
                        value={newAgent.name}
                        onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`address-${dialogId}`} className="text-right">
                        Address
                      </Label>
                      <Input
                        id={`address-${dialogId}`}
                        value={newAgent.address}
                        onChange={(e) => setNewAgent({ ...newAgent, address: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button className="bg-[#e61f57] hover:bg-[#e61f57]/90" onClick={handleAddAgent}>
                      Add Agent
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" value={expandedAgents} className="space-y-4">
                {agents.map((agent) => (
                  <AccordionItem key={agent.id} value={`agent-${agent.id}`} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center p-3">
                      <Avatar className="mr-3">
                        <AvatarImage src={agent.icon} alt={agent.name} />
                        <AvatarFallback>{agent.model_id.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{agent.model_id}</div>
                        <div className="text-sm text-muted-foreground truncate">{agent.address}</div>
                      </div>
                      <div className="flex flex-col items-end mr-2">
                        <Badge
                          variant={agent.status === "active" ? "default" : "secondary"}
                          className={`mb-1 ${agent.status === "active" ? "bg-[#e61f57] hover:bg-[#e61f57]/90" : ""}`}
                        >
                          {agent.status}
                        </Badge>
                        { agent.shapleyValue && (
                          <div className="text-xs font-medium">
                            Shapley: <span className="text-[#e61f57]">{agent.shapleyValue.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                      <AccordionTrigger onClick={() => toggleAgent(`agent-${agent.id}`)} className="p-0 hover:no-underline">
                        <span className="sr-only">Toggle</span>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className="pt-0">
                      <div className="border-t p-3">
                        <h4 className="text-sm font-semibold mb-2">Contributions</h4>
                        <div className="space-y-3">
                          {agent.contributions.length > 0 ? (
                            agent.contributions.map((contribution) => (
                              <div key={contribution.id} className="bg-muted rounded-md p-2">
                                <p className="text-sm mb-1">{contribution.message}</p>
                                <time className="text-xs text-muted-foreground" dateTime={contribution.timestamp}>
                                  {new Intl.DateTimeFormat("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }).format(new Date(contribution.timestamp))}
                                </time>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No contributions yet</div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
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
        </div>
      </div>
    </main>
  )
}

