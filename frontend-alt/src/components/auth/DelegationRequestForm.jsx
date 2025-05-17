import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Shield, Clock, AlertCircle } from "lucide-react";
import { Agent } from "@/api/entities";
import { DelegationRequest } from "@/api/entities";

export default function DelegationRequestForm({ currentAgentId, onRequestSubmitted }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [purpose, setPurpose] = useState("");
  const [expirationHours, setExpirationHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadAgents();
  }, []);
  
  const loadAgents = async () => {
    try {
      const agentList = await Agent.list();
      // Filter out the current agent and inactive agents
      const filteredAgents = agentList.filter(agent => 
        agent.id !== currentAgentId && agent.status === "active"
      );
      setAgents(filteredAgents);
    } catch (err) {
      setError("Failed to load agents: " + err.message);
    }
  };
  
  const handlePermissionChange = (permission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };
  
  const submitRequest = async () => {
    if (!selectedAgentId) {
      setError("Please select an agent");
      return;
    }
    
    if (selectedPermissions.length === 0) {
      setError("Please select at least one permission");
      return;
    }
    
    if (!purpose.trim()) {
      setError("Please specify the purpose for this delegation");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create expiration date
      const now = new Date();
      const expirationTime = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);
      
      // Create the delegation request
      const requestData = {
        requesting_agent_id: currentAgentId,
        requested_permissions: selectedPermissions,
        purpose: purpose,
        status: "pending",
        expiration_time: expirationTime.toISOString(),
        approving_agent_id: selectedAgentId
      };
      
      const createdRequest = await DelegationRequest.create(requestData);
      
      // Update the current agent's access log
      const currentAgent = await Agent.get(currentAgentId);
      const updatedAccessLog = [
        ...(currentAgent.access_log || []),
        {
          timestamp: now.toISOString(),
          action: "delegation_requested",
          resource: `agent/${selectedAgentId}`,
          success: true
        }
      ];
      
      await Agent.update(currentAgentId, {
        last_active: now.toISOString(),
        access_log: updatedAccessLog
      });
      
      onRequestSubmitted(createdRequest);
    } catch (err) {
      setError("Failed to submit delegation request: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-500" />
          Request Authentication Delegation
        </CardTitle>
        <CardDescription>
          Request permissions from another agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="agent">Delegate From Agent</Label>
          <div className="flex items-center gap-3">
            <User className="text-gray-500 h-5 w-5" />
            <div className="flex-1">
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            placeholder="Explain why you need these permissions..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expiration">Request Expiration</Label>
          <div className="flex items-center gap-3">
            <Clock className="text-gray-500 h-5 w-5" />
            <div className="flex-1">
              <Select value={expirationHours.toString()} onValueChange={(value) => setExpirationHours(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label>Requested Permissions</Label>
          <div className="flex items-start gap-3">
            <Shield className="text-gray-500 h-5 w-5 mt-0.5" />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="request_read_data"
                  checked={selectedPermissions.includes("read_data")}
                  onCheckedChange={() => handlePermissionChange("read_data")}
                />
                <label htmlFor="request_read_data" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Read Data
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="request_write_data"
                  checked={selectedPermissions.includes("write_data")}
                  onCheckedChange={() => handlePermissionChange("write_data")}
                />
                <label htmlFor="request_write_data" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Write Data
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="request_execute_actions"
                  checked={selectedPermissions.includes("execute_actions")}
                  onCheckedChange={() => handlePermissionChange("execute_actions")}
                />
                <label htmlFor="request_execute_actions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Execute Actions
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="request_delegate_auth"
                  checked={selectedPermissions.includes("delegate_auth")}
                  onCheckedChange={() => handlePermissionChange("delegate_auth")}
                />
                <label htmlFor="request_delegate_auth" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Delegate Authentication
                </label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={submitRequest} 
          disabled={isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </CardFooter>
    </Card>
  );
}
