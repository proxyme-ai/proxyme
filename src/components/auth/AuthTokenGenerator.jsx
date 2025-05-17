
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Key, Shield, AlertCircle } from "lucide-react";
import { AuthToken } from "@/api/entities";
import { Agent } from "@/api/entities";

export default function AuthTokenGenerator({ agent, onTokenGenerated }) {
  const [expirationHours, setExpirationHours] = useState(24);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  const handlePermissionChange = (permission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const generateToken = async () => {
    if (selectedPermissions.length === 0) {
      setError("Please select at least one permission");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Create expiration date
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);
      
      // Generate a simpler unique token string
      const tokenString = `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create the token record
      const tokenData = {
        token: tokenString,
        agent_id: agent.id,
        issued_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        scope: selectedPermissions,
        is_delegate: false,
        request_ip: "system-generated", // In a real system, you'd get the actual IP
        is_revoked: false
      };
      
      const createdToken = await AuthToken.create(tokenData);
      
      // Log this in the agent's access log 
      // and include the required system_description field
      const updatedAccessLog = [
        ...(agent.access_log || []),
        {
          timestamp: now.toISOString(),
          action: "token_generated",
          resource: "auth_token",
          success: true
        }
      ];
      
      await Agent.update(agent.id, {
        last_active: now.toISOString(),
        access_log: updatedAccessLog,
        // Make sure to include system_description field
        system_description: agent.system_description || "AI Agent with delegation capabilities"
      });
      
      onTokenGenerated(createdToken);
    } catch (err) {
      setError("Failed to generate token: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-500" />
          Generate Authentication Token
        </CardTitle>
        <CardDescription>
          Create a new authentication token for {agent?.name || 'this agent'}
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
          <Label htmlFor="expiration">Token Expiration</Label>
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
                  <SelectItem value="720">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label>Permissions</Label>
          <div className="flex items-start gap-3">
            <Shield className="text-gray-500 h-5 w-5 mt-0.5" />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="read_data"
                  checked={selectedPermissions.includes("read_data")}
                  onCheckedChange={() => handlePermissionChange("read_data")}
                />
                <label htmlFor="read_data" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Read Data
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="write_data"
                  checked={selectedPermissions.includes("write_data")}
                  onCheckedChange={() => handlePermissionChange("write_data")}
                />
                <label htmlFor="write_data" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Write Data
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="execute_actions"
                  checked={selectedPermissions.includes("execute_actions")}
                  onCheckedChange={() => handlePermissionChange("execute_actions")}
                />
                <label htmlFor="execute_actions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Execute Actions
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="delegate_auth"
                  checked={selectedPermissions.includes("delegate_auth")}
                  onCheckedChange={() => handlePermissionChange("delegate_auth")}
                />
                <label htmlFor="delegate_auth" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Delegate Authentication
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="admin"
                  checked={selectedPermissions.includes("admin")}
                  onCheckedChange={() => handlePermissionChange("admin")}
                />
                <label htmlFor="admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Admin Access
                </label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={generateToken} 
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isGenerating ? "Generating..." : "Generate Token"}
        </Button>
      </CardFooter>
    </Card>
  );
}
