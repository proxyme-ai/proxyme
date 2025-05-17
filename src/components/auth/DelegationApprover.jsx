
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DelegationRequest } from "@/api/entities";
import { AuthToken } from "@/api/entities";
import { Agent } from "@/api/entities";
import { format } from "date-fns";

export default function DelegationApprover({ request, onProcessed, currentAgentId }) {
  const [requestingAgent, setRequestingAgent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (request) {
      loadRequestingAgent();
    }
  }, [request]);
  
  const loadRequestingAgent = async () => {
    try {
      const agent = await Agent.get(request.requesting_agent_id);
      setRequestingAgent(agent);
    } catch (err) {
      setError("Failed to load requesting agent details");
    }
  };
  
  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const now = new Date();
      
      // Generate a new token
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default 24 hours
      
      // Generate a simpler unique token string
      const tokenString = `delegated_token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create the token record
      const tokenData = {
        token: tokenString,
        agent_id: request.requesting_agent_id,
        issued_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        scope: request.requested_permissions,
        is_delegate: true,
        parent_token_id: currentAgentId, // Not a real token ID but agent ID for simplicity
        request_ip: "system-generated", // In a real system, you'd get the actual IP
        is_revoked: false
      };
      
      const createdToken = await AuthToken.create(tokenData);
      
      // Update the delegation request
      await DelegationRequest.update(request.id, {
        status: "approved",
        approval_time: now.toISOString(),
        created_token_id: createdToken.id
      });
      
      // Update the approving agent's access log
      const approvingAgent = await Agent.get(currentAgentId);
      
      // Make sure to include the required system_description field
      const approvingAgentUpdates = {
        last_active: now.toISOString(),
        access_log: [
          ...(approvingAgent.access_log || []),
          {
            timestamp: now.toISOString(),
            action: "delegation_approved",
            resource: `agent/${request.requesting_agent_id}`,
            success: true
          }
        ],
        // Include system_description if it exists, or provide a default
        system_description: approvingAgent.system_description || "AI Agent with delegation capabilities"
      };
      
      await Agent.update(currentAgentId, approvingAgentUpdates);
      
      // Update the requesting agent's delegation chain
      // Also include the system_description field
      const updatedDelegationChain = [
        ...(requestingAgent.delegation_chain || []),
        currentAgentId
      ];
      
      await Agent.update(requestingAgent.id, {
        delegation_chain: updatedDelegationChain,
        system_description: requestingAgent.system_description || "AI Agent with delegation capabilities"
      });
      
      onProcessed({
        request: { ...request, status: "approved" },
        token: createdToken
      });
    } catch (err) {
      setError("Failed to approve request: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeny = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const now = new Date();
      
      // Update the delegation request
      await DelegationRequest.update(request.id, {
        status: "denied",
        approval_time: now.toISOString()
      });
      
      // Update the approving agent's access log
      const approvingAgent = await Agent.get(currentAgentId);
      
      // Include system_description when updating
      await Agent.update(currentAgentId, {
        last_active: now.toISOString(),
        access_log: [
          ...(approvingAgent.access_log || []),
          {
            timestamp: now.toISOString(),
            action: "delegation_denied",
            resource: `agent/${request.requesting_agent_id}`,
            success: true
          }
        ],
        system_description: approvingAgent.system_description || "AI Agent with delegation capabilities"
      });
      
      onProcessed({
        request: { ...request, status: "denied" },
        token: null
      });
    } catch (err) {
      setError("Failed to deny request: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!request || !requestingAgent) return null;
  
  // Check if request is expired
  const isExpired = new Date(request.expiration_time) < new Date();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          Delegation Request
        </CardTitle>
        <CardDescription>
          Review and process this authentication delegation request
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isExpired && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This request has expired and can no longer be processed.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="font-medium">{requestingAgent.name}</span>
            <Badge variant="outline" className="ml-auto">
              {requestingAgent.status}
            </Badge>
          </div>
          
          <div className="bg-gray-50 rounded-md p-3 border text-sm">
            <p>{request.purpose}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
              <Shield className="h-4 w-4" />
              <span>Requested Permissions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {request.requested_permissions.map((permission, index) => (
                <Badge key={index} variant="secondary">
                  {permission.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Expires at</span>
            </div>
            <div className="text-sm">
              {format(new Date(request.expiration_time), "PPp")}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleDeny}
          disabled={isProcessing || isExpired}
        >
          <XCircle className="h-4 w-4" />
          Deny
        </Button>
        <Button 
          className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
          onClick={handleApprove}
          disabled={isProcessing || isExpired}
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </Button>
      </CardFooter>
    </Card>
  );
}
