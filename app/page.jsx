"use client";

import { useState, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";

import { CardFooter } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useEffect, useRef } from "react";

import { ethers } from "ethers";
import LoadingSpinner from "./components/LoadingSpinner";

const BACKEND_ROUTE = "http://localhost:8080/api/routes/";

const mainContractAbi = require("./MainContract.json").abi;
const mainContractAddress = "0x66fBf1B71095d821610B3Ccd84586da92E785757";

export default function Home() {
  // AGENTS STATE
  const [expandedAgents, setExpandedAgents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [newAgent, setNewAgent] = useState({
    name: "",
    address: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dialogId = useId();

  const toggleAgent = (agentId) => {
    setExpandedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const fetchAgents = async () => {
    const response = await fetch(BACKEND_ROUTE + "list-agents", {
      method: "POST",
    });
    const data = await response.json();

    const agents = data.map((agent) => ({
      id: agent.id,
      model_id: agent.model_id,
      icon: "/placeholder.svg?height=40&width=40",
      address: agent.public_key,
      shapleyValue: null,
      contributions: [],
      status: "idle",
    }));
    setAgents(agents);
  };

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
      };
      setAgents([...agents, newAgentObj]);
      setNewAgent({ name: "", address: "" });
      setIsDialogOpen(false);
    }
  };

  // CHAT STATE
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi, I'm Artemis! 👋 I'm your Copilot for Flare, ready to help you with operations like generating wallets, sending tokens, and executing token swaps. \n\n⚠️ While I aim to be accurate, never risk funds you can't afford to lose.",
      type: "bot",
      timeElapsed: "0.0",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  // const [shapleyValues, setShapleyValues] = useState(null);
  const messagesEndRef = useRef(null);

  const [signer, setSigner] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [awaitingCreateAccount, setAwaitingCreateAccount] = useState(false);
  const [newAccountInfo, setNewAccountInfo] = useState({
    amount: 0,
    address: "",
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseIfPossible = (text, key) => {
    try {
      return JSON.parse(text)[key];
    } catch (error) {
      return text;
    }
  };

  const handleSendMessage = async (text) => {
    try {
      const response = await fetch(BACKEND_ROUTE + "chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // system_message: "Give definitive answers, don't be vague or ambiguous. Even if you don't know the answer.",
          message: text,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      console.log("RESPONSES", data);

      if (data.response_data) {
        setAgents((prevAgents) =>
          prevAgents.map((agent) => ({
            ...agent,

            status: "active",
            shapleyValue: JSON.parse(data.shapley_values)[agent.model_id],

            contributions: [
              ...agent.contributions,
              {
                id: prevAgents.length + 1,
                iteration: 0,
                message: parseIfPossible(
                  JSON.parse(data.response_data).iteration_0[agent.model_id],
                  "reason"
                ),
                timestamp: new Date().toISOString(),
              },
              {
                id: prevAgents.length + 2,
                iteration: 1,
                message: parseIfPossible(
                  JSON.parse(data.response_data).iteration_1[agent.model_id],
                  "reason"
                ),
                timestamp: new Date().toISOString(),
              },
              {
                id: prevAgents.length + 3,
                iteration: 2,
                message: parseIfPossible(
                  JSON.parse(data.response_data).iteration_2[agent.model_id],
                  "reason"
                ),
                timestamp: new Date().toISOString(),
              },
              // {
              //   id: prevAgents.length + 4,
              //   message: "ITERATION 3: (based on consensus) " + JSON.parse(data.response_data).iteration_3[agent.model_id],
              //   timestamp: new Date().toISOString()
              // }
            ],
          }))
        );
      }

      if (data.response.includes("Account created with")) {
        setAwaitingCreateAccount(true);
        setNewAccountInfo({ amount: data.amount, address: data.address });
      }

      // Check if response contains a transaction preview

      if (data.response.includes("Transaction Preview:")) {
        setAwaitingConfirmation(true);
        setPendingTransaction(text);
      }

      return data;
    } catch (error) {
      console.error("Error:", error);
      return "Sorry, there was an error processing your request. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: messageText, type: "user" },
    ]);

    // Handle transaction confirmation
    if (awaitingConfirmation) {
      if (messageText.toUpperCase() === "CONFIRM") {
        setAwaitingConfirmation(false);
        const response = await handleSendMessage(pendingTransaction);
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, text: response.response, type: "bot" },
        ]);
      } else {
        setAwaitingConfirmation(false);
        setPendingTransaction(null);
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: "Transaction cancelled. How else can I help you?",
            type: "bot",
          },
        ]);
      }
    } else {
      const response = await handleSendMessage(messageText);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: response.response,
          type: "bot",
          timeElapsed: response.time_elapsed,
          confidence: response.confidence_score,
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleConfirmTransaction = async () => {
    if (awaitingConfirmation) {
      setAwaitingConfirmation(false);
      const response = await handleSendMessage(pendingTransaction);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: response.response,
          type: "bot",
          timeElapsed: response.time_elapsed,
          confidence: response.confidence_score,
        },
      ]);
    }
  };

  const [isLoadingCreateAccount, setIsLoadingCreateAccount] = useState(false);
  const sendCreateAccountTransaction = async () => {
    if (awaitingCreateAccount) {
      if (account === null) {
        alert("Please connect your wallet first");
        return;
      }

      setIsLoadingCreateAccount(true);
      setAwaitingCreateAccount(false);
      setNewAccountInfo({ amount: 0, address: "" });

      console.log(
        "SENDING CREATE ACCOUNT TRANSACTION: ",
        newAccountInfo,
        isLoadingCreateAccount
      );

      // Convert amount to wei (or the appropriate unit)
      const amountInWei = ethers.utils.parseUnits(newAccountInfo.amount, 18); // Adjust 18 to your token's decimals

      const Erc20Abi = [
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function approve(address spender, uint256 amount) public returns (bool)",
      ];
      const wethAddress = "0xC67DCE33D7A8efA5FfEB961899C73fe01bCe9273";

      const wethContract = new ethers.Contract(wethAddress, Erc20Abi, signer);

      const allowance = await wethContract.allowance(
        account,
        mainContractAddress
      );

      console.log("ALLOWANCE: ", allowance);
      if (allowance < amountInWei) {
        let tx = await wethContract.approve(mainContractAddress, amountInWei);
        let txRec = await tx.wait();

        console.log("WETH TRANSACTION: ", txRec);
      }

      // Create contract instance
      const contract = new ethers.Contract(
        mainContractAddress,
        mainContractAbi,
        signer
      );

      // Call the transfer function
      let transaction = await contract.registerWallet(amountInWei);
      let txRec1 = await transaction.wait();

      console.log("TRANSACTION: ", txReceipt);

      const AttestationToken = require("./mockToken.json");

      console.log("ATTESATION TOKEN: ", AttestationToken);

      const header = ethers.utils.arrayify(AttestationToken.Header);
      const payload = ethers.utils.arrayify(AttestationToken.Payload);
      const signature = ethers.utils.arrayify(AttestationToken.Signature);

      transaction = await contract.activateWallet(
        header,
        payload,
        signature,
        newAccountInfo.address,
        {
          gasLimit: 3000000,
        }
      );
      let txRec2 = await transaction.wait();

      txLink1 =
        "https://coston2-explorer.flare.network/tx/" + txRec1.transactionHash;
      txLink2 =
        "https://coston2-explorer.flare.network/tx/" + txRec2.transactionHash;

      const markdownString = `Account successfully created - [Register wallet transaction](${txLink1})  [Activate wallet transaction](${txLink2})`;

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: markdownString,
          type: "bot",
        },
      ]);

      setIsLoadingCreateAccount(false);
    }
  };

  // Custom components for ReactMarkdown
  const MarkdownComponents = {
    // Override paragraph to remove default margins
    p: ({ children }) => <span className="inline">{children}</span>,
    // Style code blocks
    code: ({ node, inline, className, children, ...props }) =>
      inline ? (
        <code className="bg-gray-200 rounded px-1 py-0.5 text-sm">
          {children}
        </code>
      ) : (
        <pre className="bg-gray-200 rounded p-2 my-2 overflow-x-auto">
          <code {...props} className="text-sm">
            {children}
          </code>
        </pre>
      ),
    // Style links
    a: ({ node, children, ...props }) => (
      <a {...props} className="text-pink-600 hover:underline" target="_blank">
        {children}
      </a>
    ),
  };

  const FLARE_NETWORK_PARAMS = {
    chainId: "0x72", // 14 in decimal (Coston2 Testnet)
    chainName: "Coston2",
    rpcUrls: ["https://coston2-api.flare.network/ext/C/rpc"],
    nativeCurrency: { name: "C2FLR", symbol: "C2FLR", decimals: 18 },
    blockExplorerUrls: ["https://coston2-explorer.flare.network/"],
  };

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);

  // Check if MetaMask is installed
  useEffect(() => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install it.");
    }
  }, []);

  // Request account access
  const connectWallet = async () => {
    try {
      if (!window.ethereum) return setError("MetaMask not available");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setSigner(provider.getSigner());

      setError(null);
      switchToFlare();
    } catch (err) {
      setError("Failed to connect wallet");
    }
  };

  // Switch to Flare Network
  const switchToFlare = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [FLARE_NETWORK_PARAMS],
      });
      fetchBalance();
    } catch (err) {
      setError("Failed to switch to Flare Network");
    }
  };

  // Fetch balance
  const fetchBalance = async () => {
    if (!account || !window.ethereum) return;
    try {
      const balanceWei = await window.ethereum.request({
        method: "eth_getBalance",
        params: [account, "latest"],
      });
      setBalance((parseInt(balanceWei, 16) / 1e18).toFixed(4) + " C2FLR");
    } catch (err) {
      setError("Failed to fetch balance");
    }
  };

  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Consensus Learning Agents
      </h1>
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h2>Flare Network + MetaMask Integration</h2>
        {account ? (
          <>
            <p>
              <strong>Connected Address:</strong> {account}
            </p>
            <p>
              <strong>Balance:</strong> {balance ?? "Loading..."}
            </p>
          </>
        ) : (
          <button
            onClick={connectWallet}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Connect MetaMask
          </button>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        <div className="lg:col-span-5">
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
                      <Label
                        htmlFor={`name-${dialogId}`}
                        className="text-right"
                      >
                        Name
                      </Label>
                      <Input
                        id={`name-${dialogId}`}
                        value={newAgent.name}
                        onChange={(e) =>
                          setNewAgent({ ...newAgent, name: e.target.value })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor={`address-${dialogId}`}
                        className="text-right"
                      >
                        Address
                      </Label>
                      <Input
                        id={`address-${dialogId}`}
                        value={newAgent.address}
                        onChange={(e) =>
                          setNewAgent({ ...newAgent, address: e.target.value })
                        }
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      className="bg-[#e61f57] hover:bg-[#e61f57]/90"
                      onClick={handleAddAgent}
                    >
                      Add Agent
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Accordion
                type="multiple"
                value={expandedAgents}
                className="space-y-4"
              >
                {agents.map((agent) => (
                  <AccordionItem
                    key={agent.id}
                    value={`agent-${agent.id}`}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center p-3">
                      <Avatar className="mr-3">
                        {/* <AvatarImage src={agent.icon} alt={agent.name} /> */}
                        <AvatarFallback>
                          <b>{agent.model_id.substring(0, 2)}</b>
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{agent.model_id}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {agent.address.slice(0, 7)}...
                          {agent.address.slice(-7)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end mr-2">
                        <Badge
                          variant={
                            agent.status === "active" ? "default" : "secondary"
                          }
                          className={`mb-1 ${
                            agent.status === "active"
                              ? "bg-[#e61f57] hover:bg-[#e61f57]/90"
                              : ""
                          }`}
                        >
                          {agent.status}
                        </Badge>
                        {agent.shapleyValue && (
                          <div className="text-md font-medium">
                            Shapley:{" "}
                            <span className="text-[#e61f57]">
                              {agent.shapleyValue.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                      <AccordionTrigger
                        onClick={() => toggleAgent(`agent-${agent.id}`)}
                        className="p-0 hover:no-underline"
                      >
                        <span className="sr-only">Toggle</span>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className="pt-0">
                      <div className="border-t p-3">
                        <h4 className="text-sm font-semibold mb-2">
                          Contributions
                        </h4>
                        <div className="space-y-3">
                          {agent.contributions.length > 0 ? (
                            agent.contributions.map((contribution) => (
                              <div
                                key={contribution.id}
                                className="bg-muted rounded-md p-2"
                              >
                                <span className="text-xs text-muted-foreground mb-2">
                                  Iteration {contribution.iteration}
                                </span>
                                <p className="text-sm mb-1">
                                  {" "}
                                  {contribution.message}
                                </p>
                                <time
                                  className="text-xs text-muted-foreground mb-2"
                                  dateTime={contribution.timestamp}
                                >
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
                            <div className="text-sm text-muted-foreground">
                              No contributions yet
                            </div>
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
        <div className="lg:col-span-7">
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
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex gap-3 max-w-[80%] ${
                          message.type === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          {message.type === "user" ? (
                            <>
                              {/* <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" /> */}
                              <AvatarFallback>
                                <b>U</b>
                              </AvatarFallback>
                            </>
                          ) : (
                            <>
                              {/* <AvatarImage src="/placeholder.svg?height=32&width=32" alt="System" /> */}
                              <AvatarFallback>
                                <b>S</b>
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 ${
                            message.type === "user"
                              ? "bg-[#e61f57] text-white"
                              : "bg-muted"
                          }`}
                        >
                          <ReactMarkdown
                            components={MarkdownComponents}
                            className="text-md break-words whitespace-pre-wrap"
                          >
                            {message.text}
                          </ReactMarkdown>
                          {/* ============ CONFIRM TRANSACTION ============= */}
                          {message.type === "bot" &&
                            message.text.includes("Transaction Preview:") && (
                              <>
                                <Button
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => handleConfirmTransaction()}
                                  disabled={!awaitingConfirmation}
                                >
                                  ✅ Confirm transaction
                                </Button>
                                <br />
                              </>
                            )}
                          {/* {message.text} */}
                          {message.timeElapsed && (
                            <span className="text-gray-500 inline">
                              Time elapsed:{" "}
                              {Number(message.timeElapsed).toFixed(2)}s{" "}
                            </span>
                          )}
                          {message.confidence && (
                            <span className="text-gray-500 inline">
                              | Consensus confidence:{" "}
                              {Number(message.confidence).toFixed(2)}
                            </span>
                          )}
                          {/* ============ CREATE ACCOUNT ============= */}
                          {message.text.includes("Account created with") &&
                            awaitingCreateAccount && (
                              <div>
                                <Button
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => {
                                    sendCreateAccountTransaction();
                                  }}
                                >
                                  ✅ Create and fund account
                                </Button>
                                <br />
                              </div>
                            )}
                          {message.text.includes("Account created with") &&
                            awaitingCreateAccount && (
                              <>
                                {isLoadingCreateAccount}
                                {isLoadingCreateAccount && <LoadingSpinner />}
                              </>
                            )}

                          {/* ============ END CREATE ACCOUNT ============= */}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <Avatar className="h-8 w-8">
                        {/* <AvatarImage src="/placeholder.svg?height=32&width=32" alt="System" /> */}
                        <AvatarFallback>
                          <b>S</b>
                        </AvatarFallback>
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
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#e61f57] hover:bg-[#e61f57]/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
