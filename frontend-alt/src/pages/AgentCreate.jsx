import React, { useState } from 'react';
import { Agent } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, UserPlus, ArrowLeft, AlertCircle, Shield, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Textarea } from "@/components/ui/textarea";

export default function AgentCreate() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [systemDescription, setSystemDescription] = useState(''); // Add state for system description
  const [permissions, setPermissions] = useState([]);
  const [expirationDate, setExpirationDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handlePermissionChange = (permission) => {
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter(p => p !== permission));
    } else {
      setPermissions([...permissions, permission]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Agent name is required");
      return;
    }
    
    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }
    
    if (!systemDescription.trim()) {
      setError("System description is required");
      return;
    }
    
    if (permissions.length === 0) {
      setError("At least one permission must be selected");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const currentUser = await User.me();
      
      // In a real system, the API key would be encrypted before storage
      const newAgent = {
        name: name,
        api_key: apiKey, // In production, this should be encrypted
        system_description: systemDescription, // Add the system description field
        permissions: permissions,
        status: "active",
        created_by_agent: null, // This is a top-level agent
        delegation_chain: [],
        expiration_date: expirationDate ? expirationDate.toISOString() : null,
        last_active: new Date().toISOString(),
        access_log: [
          {
            timestamp: new Date().toISOString(),
            action: "agent_created",
            resource: "system",
            success: true
          }
        ]
      };
      
      await Agent.create(newAgent);
      navigate(createPageUrl("Dashboard"));
    } catch (err) {
      setError("Failed to create agent: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Create New AI Agent
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="Enter agent name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="systemDescription" className="flex items-center gap-1">
                  System Description <Info className="h-4 w-4 text-gray-400" />
                </Label>
                <Textarea
                  id="systemDescription"
                  placeholder="Describe what this AI agent does (e.g., 'Project management assistant that helps organize tasks and priorities')"
                  value={systemDescription}
                  onChange={(e) => setSystemDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  This description helps identify what the agent's purpose is and will be used for agent identification.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  placeholder="Enter secure API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                />
                <p className="text-xs text-gray-500">
                  This key will be used for agent authentication. Store it securely.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Expiration Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expirationDate ? format(expirationDate, "PPP") : "Select expiration date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expirationDate}
                      onSelect={setExpirationDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  Permissions
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="read_data"
                      checked={permissions.includes("read_data")}
                      onCheckedChange={() => handlePermissionChange("read_data")}
                    />
                    <label htmlFor="read_data" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Read Data
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="write_data"
                      checked={permissions.includes("write_data")}
                      onCheckedChange={() => handlePermissionChange("write_data")}
                    />
                    <label htmlFor="write_data" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Write Data
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="execute_actions"
                      checked={permissions.includes("execute_actions")}
                      onCheckedChange={() => handlePermissionChange("execute_actions")}
                    />
                    <label htmlFor="execute_actions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Execute Actions
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="delegate_auth"
                      checked={permissions.includes("delegate_auth")}
                      onCheckedChange={() => handlePermissionChange("delegate_auth")}
                    />
                    <label htmlFor="delegate_auth" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Delegate Authentication
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="admin"
                      checked={permissions.includes("admin")}
                      onCheckedChange={() => handlePermissionChange("admin")}
                    />
                    <label htmlFor="admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Admin Access
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Agent"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
