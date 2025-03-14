"use client";

import "@mantine/core/styles.css";
import { useState, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import ReactMarkdown from "react-markdown";
import { Progress } from '@mantine/core';
import { Accordion as MantineAccordion, Text as MantineText } from '@mantine/core';

import { ethers } from "ethers";
import LoadingSpinner from "./components/LoadingSpinner";

import { createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({
  /** Put your mantine theme override here */
});

const BACKEND_ROUTE = "http://localhost:80/api/routes/";
// const BACKEND_ROUTE = "http://34.70.53.63:80/api/routes/";

const mainContractAbi = require("./MainContract.json").abi;
const mainContractAddress = "0xe4438A002095Ffa8FC46C3fFfA1Aadcea1b04542";

export default function Home() {
  // AGENTS STATE
  const [expandedAgents, setExpandedAgents] = useState([])
  const [agents, setAgents] = useState([])
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
      text: "Hi there! I'm DemistiFI! 👋 Secured by a [Trusted Execution Environment](https://en.wikipedia.org/wiki/Trusted_execution_environment) and driven by a consensus learning algorithm, I work on your behalf to make things smoother. 💡 Need help with Flare transactions? I’ve got you covered on [Kinetic](https://kinetic.market) 🔄 and [Blaze Swap](https://www.blazeswap.io) 🔥!",
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
    header: "",
    payload: "",
    signature: "",
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseIfPossible = (text) => {
    try {
      return JSON.parse(text);
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

    //   const data = {
    //     "response": "Transaction Preview: Lending 1 USDC\nReason: Market data shows FLR/USD is stagnant with zero volatility, making swaps unprofitable. Lending USDC is optimal for passive yield. I refined this decision by ensuring full utilization of USDC while maintaining minimal liquidity. Previous inputs suggested lending USDC, and I improved clarity by emphasizing FLR’s lack of movement and the importance of maximizing returns safely.\n",
    //     "shapley_values": "{\"anthropic/claude-2.1\": 0.2194710576213677, \"openai/gpt-4-turbo\": 0.3899651713456507, \"openai/chatgpt-4o-latest\": 0.39056377103298157}",
    //     "response_data": "{\"iteration_0\": {\"anthropic/claude-2.1\": {\"operation\": \"\", \"token_a\": \"\", \"token_b\": \"\", \"amount\": 0.0, \"reason\": \".\\n\\nBased on the information provided, there is no clear optimal trade to make at this time. The FLR and USDC prices have been completely stable over the past 8 hours shown. With no price movements, volatility is 0%, so there is no apparent opportunity to capitalize on token swaps or lending. \\n\\nI would recommend holding the current portfolio and continuing to monitor the markets for future opportunities when price movements become more favorable. Making a trade now would likely incur unnecessary fees and provide little expected profit.\"}, \"openai/gpt-4-turbo\": {\"operation\": \"LEND\", \"token_a\": \"USDC\", \"token_b\": \"FLR\", \"amount\": 1.29, \"reason\": \"Lending USDC in the FLR pool offers a higher APY compared to holding, optimizing earnings from stable assets in a low-volatility environment.\"}, \"openai/chatgpt-4o-latest\": {\"operation\": \"LEND\", \"token_a\": \"USDC\", \"token_b\": \"FLR\", \"amount\": 1.29, \"reason\": \"Since FLR/USD is moving sideways with no volatility, swapping is not optimal. Instead, lending USDC is preferable as it can generate passive yield while avoiding exposure to FLR\\u2019s stagnant price action. The amount chosen is nearly the full USDC balance to maximize returns while maintaining some liquidity.\"}}, \"aggregate_0\": {\"operation\": \"LEND\", \"token_a\": \"USDC\", \"token_b\": \"FLR\", \"amount\": 1.29, \"reason\": \"Since FLR/USD is moving sideways with no volatility, swapping is not optimal. Instead, lending USDC is preferable as it can generate passive yield while avoiding exposure to FLR\\u2019s stagnant price action. The amount chosen is nearly the full USDC balance to maximize returns while maintaining some liquidity.\"}, \"shapley_0\": {\"anthropic/claude-2.1\": 0.3333333333333333, \"openai/gpt-4-turbo\": 0.3333333333333333, \"openai/chatgpt-4o-latest\": 0.3333333333333333}, \"weight_0\": 1.0, \"iteration_1\": {\"anthropic/claude-2.1\": {\"operation\": \"SWAP\", \"token_a\": \"USDC\", \"token_b\": \"FLR\", \"amount\": 1.294968, \"reason\": \"I am swapping all my USDC to FLR even though FLR price has been completely flat with no volatility. I expect this stagnation to suddenly reverse and for FLR to moonshot. The swap allows me to maximize my FLR holdings for the impending pump.\"}, \"openai/gpt-4-turbo\": {\"operation\": \"LEND\", \"token_a\": \"USDC\", \"token_b\": \"FLR\", \"amount\": 1.29, \"reason\": \"Lending USDC is optimal given the current market stability of FLR, which shows no volatility or significant price movement. This strategy avoids the risks associated with FLR's stagnant market by utilizing USDC to generate a steady yield. The chosen amount leverages nearly the entire USDC balance to maximize potential returns while retaining minimal liquidity for flexibility. This decision refines previous suggestions by emphasizing risk avoidance and yield optimization in a stable market environment.\"}, \"openai/chatgpt-4o-latest\": {\"operation\": \"LEND\", \"token_a\": \"USDC\", \"token_b\": \"FLR\", \"amount\": 1.29, \"reason\": \"Market data shows FLR/USD is stagnant with zero volatility, making swaps unprofitable. Lending USDC is optimal for passive yield. I refined this decision by ensuring full utilization of USDC while maintaining minimal liquidity. Previous inputs suggested lending USDC, and I improved clarity by emphasizing FLR\\u2019s lack of movement and the importance of maximizing returns safely.\"}}, \"aggregate_1\": {\"operation\": \"LEND\", \"token_a\": \"USDC\", \"token_b\": \"FLR\", \"amount\": 1.29, \"reason\": \"Market data shows FLR/USD is stagnant with zero volatility, making swaps unprofitable. Lending USDC is optimal for passive yield. I refined this decision by ensuring full utilization of USDC while maintaining minimal liquidity. Previous inputs suggested lending USDC, and I improved clarity by emphasizing FLR\\u2019s lack of movement and the importance of maximizing returns safely.\"}, \"shapley_1\": {\"anthropic/claude-2.1\": -0.09003869739346212, \"openai/gpt-4-turbo\": 0.5439064675267691, \"openai/chatgpt-4o-latest\": 0.5461322298666931}, \"weight_1\": 0.36787944117144233}",
    //     "time_elapsed": "26.101043939590454",
    //     "confidence_score": "[0.5279331186220363, 1.0]"
    // }

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
                type: "iteration",
                id: prevAgents.length + 1,
                iteration: 0,
                message: 
                  JSON.parse(data.response_data).iteration_0[agent.model_id].reason,
                timestamp: new Date().toISOString(),
              },
              {
                type: "aggregated",
                id: prevAgents.length + 2,
                iteration: 1,
                message: JSON.parse(data.response_data).aggregate_0.reason,
                timestamp: new Date().toISOString()
              },
              {
                type: "iteration",
                id: prevAgents.length + 3,
                iteration: 1,
                message: JSON.parse(data.response_data).iteration_1[agent.model_id].reason,
                timestamp: new Date().toISOString(),
              },
              {
                type: "aggregated",
                id: prevAgents.length + 4,
                iteration: -1,
                message: parseIfPossible(JSON.parse(data.response_data).aggregate_1, "reason"),
                timestamp: new Date().toISOString()
              },

              

              // {
              //   type: "iteration",
              //   id: prevAgents.length + 5,
              //   iteration: 2,
              //   message: parseIfPossible(JSON.parse(data.response_data).iteration_2[agent.model_id], "reason"),
              //   timestamp: new Date().toISOString()
              // },
              // {
              //   type: "aggregated",
              //   id: prevAgents.length + 6,
              //   iteration: -1,
              //   message: parseIfPossible(JSON.parse(data.response_data).aggregate_2, "reason"),
              //   timestamp: new Date().toISOString()
              // },
              // {
              //   id: prevAgents.length + 4,
              //   message: "ITERATION 3: (based on consensus) " + JSON.parse(data.response_data).iteration_3[agent.model_id],
              //   timestamp: new Date().toISOString()
              // }
            ],
          }))
        );
      }

      if (data.response.includes("Account created and ready")) {
        setAwaitingCreateAccount(true);
        setNewAccountInfo({
          amount: data.amount,
          address: data.address,
          header: data.header,
          payload: data.payload,
          signature: data.signature,
        });
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
          confidences: parseIfPossible(response.confidence_score),
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
        },
      ]);
    }
  };

  const [isLoadingCreateAccount, setIsLoadingCreateAccount] = useState(false);
  const sendCreateAccountTransaction = async () => {
    if (awaitingCreateAccount) {
      const timeStart = new Date();
      
      if (account === null) {
        alert("Please connect your wallet first");
        return;
      }

      setIsLoadingCreateAccount(true);

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

      console.log("TRANSACTION: ", txRec1);

      const AttestationToken = require("./mockToken.json");

      const header = ethers.utils.arrayify(newAccountInfo.header);
      const payload = ethers.utils.arrayify(newAccountInfo.payload);
      const signature = ethers.utils.arrayify(newAccountInfo.signature);

      console.log("HEADER: ", header);
      console.log("PAYLOAD: ", payload);
      console.log("SIGNATURE: ", signature);

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

      const txLink1 =
        "https://coston2-explorer.flare.network/tx/" + txRec1.transactionHash;
      const txLink2 =
        "https://coston2-explorer.flare.network/tx/" + txRec2.transactionHash;

      const markdownString = `Account successfully created 🎉 \n\n[Register wallet transaction](${txLink1}) \n [Activate wallet transaction](${txLink2})`;

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: markdownString,
          type: "bot",
          timeElapsed: String((new Date() - timeStart) / 1000),
        },
      ]);

      setNewAccountInfo({
        amount: 0,
        address: "",
        header: "",
        payload: "",
        signature: "",
      });
      setAwaitingCreateAccount(false);
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
      await fetchBalance();
    } catch (err) {
      setError("Failed to switch to Flare Network");
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [account]);

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
    <MantineProvider theme={theme}>
    <main className="container mx-auto p-4 min-h-screen flex flex-col">
      <div className='flex flex-row gap-4 justify-between items-center'>
      <MantineText
          style={{fontSize: "40px", fontWeight: 900, fontFamily: "satoshi"}}
          variant="gradient"
          gradient={{ from: '#862f4c', to: '#e61f57', deg: 90 }}
        >
          DemistiFI
        </MantineText>
        <div style={{ textAlign: "center", padding: "20px"}}>
          {account ? (
            <div className='flex flex-col items-start'>
              <p>
                <strong>Address:</strong> {account ? `${account.slice(0, 5)}...${account.slice(-5)}` : "N/A"}
              </p>
              <p>
                <strong>Balance:</strong> {balance ?? "Loading..."}
              </p>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              color='grey'
              variant='outline'
            >
              🦊 {'  '} Connect MetaMask
            </Button>
          )}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
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
                              
                              contribution.type === "iteration" ? 
                              <div key={contribution.id} className="bg-muted rounded-md p-2">
                                <span className="text-md text-muted-foreground mb-2 font-semibold">Iteration {contribution.iteration}</span>
                                <p className="text-sm mb-1 mt-1"> {contribution.message}</p>
                                <time className="text-xs text-muted-foreground mb-2" dateTime={contribution.timestamp}>
                                  {new Intl.DateTimeFormat("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }).format(new Date(contribution.timestamp))}
                                </time>
                              </div>
                              :
                              <div key={contribution.id} className="bg-muted rounded-md p-2">
                                <span className="text-md text-muted-foreground mb-2 font-semibold">Aggregated response</span>
                                <MantineAccordion chevronPosition="left" className="mt-2">
                                  <MantineAccordion.Item key={"aggregation"} value={"aggregation"} className="border rounded-lg overflow-hidden">
                                    <MantineAccordion.Control><p className="text-sm">Aggregated response</p></MantineAccordion.Control>
                                    <MantineAccordion.Panel>{contribution.message}</MantineAccordion.Panel>
                                  </MantineAccordion.Item>
                                </MantineAccordion>
                                <time className="text-xs text-muted-foreground mb-2" dateTime={contribution.timestamp}>
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
 
            <div className="w-4/5 mx-auto flex flex-col items-left">
              {agents.map((agent, index) => (
                agent.shapleyValue && (
                  <div key={index}>
                  <span className="text-md font-medium mb-2">Shapley {index + 1}</span>
                  <Progress.Root key={agent.id} size="xl" radius="md" className='mb-4'>
                    <Progress.Section value={agent.shapleyValue * 120} color="#e61f57">
                      <Progress.Label>{agent.shapleyValue.toFixed(4)}</Progress.Label>
                    </Progress.Section>
                  </Progress.Root>
                  </div>
                )
              ))}
            </div>
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
                          className={`rounded-lg p-3 max-w-[90%] min-w-[90%] ${
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
                          {/* ============ CREATE ACCOUNT ============= */}
                          {message.text.includes("Account created and ready") &&
                            awaitingCreateAccount && (
                              <div>
                                <Button
                                  variant="outline"
                                  className="mt-2"
                                  disabled={isLoadingCreateAccount}
                                  onClick={() => {
                                    sendCreateAccountTransaction();
                                  }}
                                >
                                  💰 Fund account
                                </Button>
                                <br />
                              </div>
                            )}
                          {message.text.includes("Account created and ready") &&
                            awaitingCreateAccount && (
                              <div className="my-2">
                                {isLoadingCreateAccount && <LoadingSpinner />}
                              </div>
                            )}

                          {/* ============ END CREATE ACCOUNT ============= */}
                          {message.confidences && (
                            <div className="mt-3">
                              <div className="flex flex-row gap-2 m-auto">
                              <span className="text-md">Confidence round 1:</span>
                              <Progress.Root size="xl" radius="md" className='w-[60%] my-auto' style={{backgroundColor: "#cdcdcd"}}>
                              <Progress.Section value={message.confidences[0] * 120} color="#e61f57">
                                <Progress.Label>{message.confidences[0].toFixed(4)}</Progress.Label>
                              </Progress.Section>
                              </Progress.Root>
                              </div>
                              <div className="flex flex-row gap-2">
                              <span className="text-md">Confidence round 2:</span>
                              <Progress.Root size="xl" radius="md" className='w-[60%] my-auto'>
                                <Progress.Section value={message.confidences[1] * 120} color="#e61f57">
                                  <Progress.Label>{message.confidences[1].toFixed(4)}</Progress.Label>
                                </Progress.Section>
                              </Progress.Root>
                              </div>
                            </div>
                          )}
                          {message.timeElapsed && (
                            <span className="text-gray-500 inline">
                              Time elapsed:{" "}
                              {Number(message.timeElapsed).toFixed(2)}s{" "}
                            </span>
                          )}
                        </div>
                      </div>
                      <div ref={messagesEndRef} />
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
          <div className="flex flex-row gap-4 justify-end mt-3 align-center">
            <p className='text-l' style={{lineHeight: "30px"}}>Powered by:</p>
            <img src="/flare-flr-logo.png" alt="Flare FLR Logo" className="h-8" />
            <img src="/GCP-logo.png" alt="GCP logo" className="h-8" />
          </div>
        </div>
      </div>
    </main>
    </MantineProvider>
  );
}
