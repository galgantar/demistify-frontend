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

// Sample data for agents
const initialAgents = [
  {
    id: 1,
    name: "Agent Alpha",
    icon: "/placeholder.svg?height=40&width=40",
    address: "0x1a2b3c4d5e6f...",
    shapleyValue: 0.8734,
    contributions: [
      { id: 1, message: "Proposed solution for gradient descent optimization", timestamp: "2025-03-08T14:30:00Z" },
      {
        id: 2,
        message: "Identified convergence issue in distributed learning algorithm",
        timestamp: "2025-03-07T09:15:00Z",
      },
    ],
    status: "active",
  },
  {
    id: 2,
    name: "Agent Beta",
    icon: "/placeholder.svg?height=40&width=40",
    address: "0x7g8h9i0j1k2l...",
    shapleyValue: 0.6521,
    contributions: [
      { id: 3, message: "Suggested parameter tuning for improved accuracy", timestamp: "2025-03-08T10:45:00Z" },
      { id: 4, message: "Validated Alpha's solution with 98% confidence", timestamp: "2025-03-08T16:20:00Z" },
    ],
    status: "active",
  },
  {
    id: 3,
    name: "Agent Gamma",
    icon: "/placeholder.svg?height=40&width=40",
    address: "0xm3n4o5p6q7r...",
    shapleyValue: 0.4298,
    contributions: [
      { id: 5, message: "Introduced novel feature extraction technique", timestamp: "2025-03-06T11:30:00Z" },
      {
        id: 6,
        message: "Disagreed with Beta's parameter values, suggested alternatives",
        timestamp: "2025-03-08T12:10:00Z",
      },
    ],
    status: "idle",
  },
  {
    id: 4,
    name: "Agent Delta",
    icon: "/placeholder.svg?height=40&width=40",
    address: "0xs9t8u7v6w5x...",
    shapleyValue: 0.3142,
    contributions: [
      { id: 7, message: "Performed cross-validation on consensus model", timestamp: "2025-03-07T15:40:00Z" },
    ],
    status: "active",
  },
  {
    id: 5,
    name: "Agent Epsilon",
    icon: "/placeholder.svg?height=40&width=40",
    address: "0xy4z3a2b1c0d...",
    shapleyValue: 0.2875,
    contributions: [
      { id: 8, message: "Detected potential overfitting in current model", timestamp: "2025-03-08T08:25:00Z" },
      { id: 9, message: "Proposed regularization technique to address overfitting", timestamp: "2025-03-08T09:15:00Z" },
    ],
    status: "idle",
  },
]

export function AgentList() {
  const [expandedAgents, setExpandedAgents] = useState([])
  const [agents, setAgents] = useState(initialAgents)
  const [newAgent, setNewAgent] = useState({
    name: "",
    address: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const dialogId = useId()

  const toggleAgent = (agentId) => {
    setExpandedAgents((prev) => (prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]))
  }

  const handleAddAgent = () => {
    if (newAgent.name && newAgent.address) {
      const newAgentObj = {
        id: agents.length + 1,
        name: newAgent.name,
        icon: "/placeholder.svg?height=40&width=40",
        address: newAgent.address,
        shapleyValue: 0.1, // Fixed initial value
        contributions: [],
        status: "active",
      }
      setAgents([...agents, newAgentObj])
      setNewAgent({ name: "", address: "" })
      setIsDialogOpen(false)
    }
  }

  return (
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
                  <AvatarFallback>{agent.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{agent.address}</div>
                </div>
                <div className="flex flex-col items-end mr-2">
                  <Badge
                    variant={agent.status === "active" ? "default" : "secondary"}
                    className={`mb-1 ${agent.status === "active" ? "bg-[#e61f57] hover:bg-[#e61f57]/90" : ""}`}
                  >
                    {agent.status}
                  </Badge>
                  <div className="text-xs font-medium">
                    Shapley: <span className="text-[#e61f57]">{agent.shapleyValue.toFixed(4)}</span>
                  </div>
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
  )
}

