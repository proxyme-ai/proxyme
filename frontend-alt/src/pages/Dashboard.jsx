
import React, { useState, useEffect } from 'react';
import { Agent } from "@/api/entities";
import { AuthToken } from "@/api/entities";
import { DelegationRequest } from "@/api/entities";
import { ServiceIntegration } from "@/api/entities"; // Added
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  AlertCircle, 
  Plus, 
  UserPlus, 
  Key, 
  ShieldCheck, 
  BellRing, 
  ListFilter, 
  Users,
  Shield,
  Clock,
  ArrowRight, // Added
  Link2,
  Zap // Added
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import AgentCard from "../components/dashboard/AgentCard";
import ActivityLog from "../components/dashboard/ActivityLog";
import AuthTokenGenerator from "../components/auth/AuthTokenGenerator";
import TokenDisplay from "../components/auth/TokenDisplay";
import DelegationRequestForm from "../components/auth/DelegationRequestForm";
import DelegationApprover from "../components/auth/DelegationApprover";
import PlaneAssistantDemo from "../components/demo/PlaneAssistantDemo";

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newToken, setNewToken] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("agents");
  const [tokenFlowActive, setTokenFlowActive] = useState(false);
  const [delegationFlowActive, setDelegationFlowActive] = useState(false); // This is for agent-to-agent
  // const [selectedService, setSelectedService] = useState(null); // Not needed directly for demo anymore
  const [isLoading, setIsLoading] = useState(false);

  // const services = [ // This will be loaded from ServiceIntegration entity
  //   {
  //     id: "1",
  //     name: "Plane Project Management",
  //     description: "Manage projects and tasks in Plane.",
  //   },
  // ];
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const agentList = await Agent.list();
      setAgents(agentList);
      
      const requestsList = await DelegationRequest.filter({ status: "pending" });
      setPendingRequests(requestsList);
      
      // Pre-select an agent if list is not empty and no agent is selected
      if (agentList.length > 0 && !selectedAgent) {
         // setSelectedAgent(agentList[0]); // Let user click to select or initiate token flow
      }
      
      setIsLoading(false);
    } catch (err) {
      setError("Failed to load data: " + err.message);
      setIsLoading(false);
    }
  };
  
  const handleAgentDeleted = (agentId) => {
    setAgents(agents.filter(a => a.id !== agentId));
    if (selectedAgent && selectedAgent.id === agentId) {
      setSelectedAgent(null);
      setTokenFlowActive(false); // Close token flow if selected agent is deleted
      setNewToken(null);
    }
  };
  
  const handleNewTokenGenerated = (token) => {
    setNewToken(token);
  };
  
  const handleTokenFlowComplete = () => {
    setNewToken(null);
    setTokenFlowActive(false);
    // loadData(); // Not strictly necessary unless token generation modifies agent list
  };
  
  const handleDelegationRequestSubmitted = () => { // Agent-to-Agent delegation
    setDelegationFlowActive(false);
    loadData(); // Refresh pending requests
  };
  
  const handleDelegationProcessed = (result) => { // Agent-to-Agent delegation
    if (result.token) {
      setNewToken(result.token); // This might be confusing if it's an AuthToken, not DelegatedToken
    }
    setSelectedRequest(null);
    setPendingRequests(pendingRequests.filter(req => req.id !== result.request.id));
  };
  
  const startTokenGenerationForAgent = (agent) => {
    setSelectedAgent(agent);
    setDelegationFlowActive(false); // Ensure other flows are closed
    setNewToken(null); // Clear any previous token
    setTokenFlowActive(true); // Open direct AuthToken generation flow
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-slate-50 to-sky-50">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-10 mb-8 text-white">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              AI Agent Delegation Platform
            </h1>
            <p className="text-blue-100 md:text-lg max-w-3xl mb-6">
              Securely empower your AI agents. Create agents, delegate access to services, and manage their authentication tokens with robust audit trails.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={createPageUrl("AgentCreate")}>
                <Button
                  variant="outline"
                  className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <UserPlus className="w-5 h-5" />
                  Create New Agent
                </Button>
              </Link>
              <Link to={createPageUrl("Integrations")}>
                <Button
                  className="gap-2 bg-sky-400 hover:bg-sky-500 text-white"
                >
                  <Link2 className="w-5 h-5" />
                  Manage Service Delegations
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute right-0 top-0 -mt-16 -mr-16 opacity-20">
            <Shield className="w-64 h-64 text-blue-300" />
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {pendingRequests.length > 0 && !tokenFlowActive && !delegationFlowActive && (
          <Alert className="mb-6 bg-amber-50/80 backdrop-blur-sm border-amber-300 shadow-sm">
            <BellRing className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-amber-700">
              You have {pendingRequests.length} pending agent-to-agent delegation request{pendingRequests.length > 1 ? 's' : ''}. 
              <Button 
                variant="link" 
                className="p-0 h-auto ml-1 text-amber-700 hover:text-amber-800 underline"
                onClick={() => {
                  setActiveTab("delegations");
                  setTokenFlowActive(false);
                  setDelegationFlowActive(false);
                }}
              >
                Review now
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Demo and Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-3">
            {!tokenFlowActive && !delegationFlowActive && !newToken && !selectedRequest && (
              <PlaneAssistantDemo />
            )}
          </div>
          <div className="lg:col-span-2 space-y-6">
            {selectedAgent && tokenFlowActive && !newToken && (
              <AuthTokenGenerator 
                agent={selectedAgent} 
                onTokenGenerated={handleNewTokenGenerated}
              />
            )}
            {newToken && ( // This can display AuthToken or DelegatedToken based on flow
              <TokenDisplay 
                token={newToken} // Assuming TokenDisplay can handle different token structures or we show a generic one
                onDone={handleTokenFlowComplete}
              />
            )}
             {delegationFlowActive && !newToken && ( // Agent-to-agent delegation form
              <DelegationRequestForm 
                  currentAgentId={selectedAgent?.id} // Requires an agent to be selected to request from another
                  onRequestSubmitted={handleDelegationRequestSubmitted}
              />
            )}

            {/* Quick Actions or Summary Card */}
            {!tokenFlowActive && !delegationFlowActive && !newToken && (
                 <Card className="bg-white/80 backdrop-blur-md shadow-lg border-gray-200/70">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                            <Zap className="w-5 h-5 text-blue-500" /> Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full gap-2" onClick={() => setDelegationFlowActive(true)} disabled={!selectedAgent}>
                            <Users className="w-4 h-4" /> Request Agent-to-Agent Delegation
                        </Button>
                         <p className="text-xs text-gray-500">Select an agent from the list below to enable actions like generating a direct auth token or requesting delegation from another agent.</p>
                    </CardContent>
                </Card>
            )}
          </div>
        </div>
        
        {/* Agents List and Delegation Requests Tabs */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/70 p-1 sm:p-2 md:p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-4 bg-slate-100/90">
              <TabsTrigger value="agents" className="gap-2 text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                My AI Agents ({agents.length})
              </TabsTrigger>
              <TabsTrigger value="delegations" className="gap-2 text-sm sm:text-base">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                Agent Delegation Requests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="agents" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {agents.map(agent => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent} 
                    onClick={() => startTokenGenerationForAgent(agent)} // Updated to new handler
                    onDelete={handleAgentDeleted}
                  />
                ))}
                {agents.length === 0 && !isLoading && (
                  <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-slate-50">
                    <UserPlus className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-1">No Agents Created Yet</h3>
                    <p className="text-gray-500 mb-4 max-w-md text-center">
                      Create AI agents to represent your automated systems. You can then delegate permissions to them for various services.
                    </p>
                    <Link to={createPageUrl("AgentCreate")}>
                      <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        Create Your First Agent
                      </Button>
                    </Link>
                  </div>
                )}
                 {isLoading && [...Array(3)].map((_, i) => ( // Loading skeleton for agents
                    <Card key={i} className="animate-pulse bg-gray-200/50 h-60 rounded-lg"/>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="delegations" className="space-y-6">
              {/* Content for Agent-to-Agent Delegation Requests */}
              {selectedRequest ? (
                <DelegationApprover 
                  request={selectedRequest}
                  onProcessed={handleDelegationProcessed}
                  currentAgentId={selectedAgent?.id} // The agent doing the approving
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pendingRequests.map(request => (
                    <Card 
                      key={request.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow bg-white border"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex justify-between items-center">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Shield className="h-4 w-4 text-amber-600" />
                            Agent Delegation Request
                          </div>
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            Pending
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-1">
                        <p className="text-sm text-gray-600 line-clamp-2">{request.purpose}</p>
                         <p className="text-xs text-gray-500">From: <span className="font-medium">{agents.find(a => a.id === request.requesting_agent_id)?.name || 'Unknown Agent'}</span></p>
                        <div className="flex items-center gap-1 pt-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            Requested: {format(new Date(request.created_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {pendingRequests.length === 0 && !isLoading && (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-slate-50">
                      <ShieldCheck className="h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium text-gray-700">No Pending Agent Requests</h3>
                      <p className="text-gray-500 max-w-md text-center">
                        When one of your agents requests delegation from another, those requests will appear here for your approval.
                      </p>
                    </div>
                  )}
                   {isLoading && !pendingRequests.length && [...Array(2)].map((_, i) => ( // Loading skeleton
                    <Card key={i} className="animate-pulse bg-gray-200/50 h-40 rounded-lg"/>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar for Activity Log - consider if needed or integrate elsewhere */}
        {/* {selectedAgent && (
          <div className="mt-6">
             <ActivityLog logs={selectedAgent.access_log || []} />
          </div>
        )} */}
        
      </div>
    </div>
  );
}
