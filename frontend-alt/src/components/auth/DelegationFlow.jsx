
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"; // Added missing Badge import
import { 
  AlertCircle, 
  Lock, 
  Shield, 
  User, 
  Check, 
  Clock, 
  Link as LinkIcon,
  Key,
  MessageSquare,
  FileText,
  ChevronRight,
  Loader2
} from "lucide-react";
import { format, addDays } from "date-fns";
import { Agent } from "@/api/entities";
import { ServiceIntegration } from "@/api/entities";
import { DelegatedToken } from "@/api/entities";
import { User as UserEntity } from "@/api/entities";

export default function DelegationFlow({ onComplete, onCancel, initialService }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedService, setSelectedService] = useState(null); 
  const [selectedScopes, setSelectedScopes] = useState([]);
  const [delegationPurpose, setDelegationPurpose] = useState("");
  const [expireDays, setExpireDays] = useState(7);
  
  const [componentIsLoading, setComponentIsLoading] = useState(true); 
  const [currentStepIsLoading, setCurrentStepIsLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [newToken, setNewToken] = useState(null);
  
  const [activeStep, setActiveStep] = useState(0); 

  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
    }
    loadInitialData();
  }, [initialService]); 

  useEffect(() => {
    if (initialService && currentUser && !componentIsLoading && activeStep === 0) {
      setActiveStep(1); 
    }
  }, [initialService, currentUser, componentIsLoading, activeStep]);

  const goToNext = () => setActiveStep(prev => Math.min(prev + 1, 4));
  const goToPrevious = () => setActiveStep(prev => Math.max(prev - 1, 0));
  
  const loadInitialData = async () => {
    console.log("DelegationFlow: loadInitialData - Start");
    setComponentIsLoading(true);
    setError(null);
    try {
      const user = await UserEntity.me();
      console.log("DelegationFlow: UserEntity.me() response:", JSON.stringify(user));
      if (!user || typeof user.id === 'undefined') { 
          throw new Error("Critical: Current user data or user ID is missing after fetch.");
      }
      setCurrentUser(user);

      const agents = await Agent.filter({ status: "active" });
      setAvailableAgents(agents);

      const services = await ServiceIntegration.filter({ is_active: true });
      setAvailableServices(services);

      console.log("DelegationFlow: loadInitialData - Success");
    } catch (err) {
      console.error("DelegationFlow: Failed to load initial data:", err);
      setError("Failed to load essential data: " + err.message + ". Please refresh or try again.");
      setCurrentUser(null); 
    } finally {
      setComponentIsLoading(false);
      console.log("DelegationFlow: loadInitialData - End, componentIsLoading:", false);
    }
  };
  
  const handleAgentSelection = (agentId) => {
    const agent = availableAgents.find(a => a.id === agentId);
    setSelectedAgent(agent);
  };
  
  const handleServiceSelection = (serviceId) => {
    const service = availableServices.find(s => s.id === serviceId);
    setSelectedService(service);
    setSelectedScopes([]); 
  };
  
  const handleScopeToggle = (scopeId) => {
    setSelectedScopes(prev => 
      prev.includes(scopeId) ? prev.filter(id => id !== scopeId) : [...prev, scopeId]
    );
  };
  
  const validateCurrentStep = () => {
    setError(null); 
    switch (activeStep) {
      case 0: 
        if (!selectedAgent) { setError("Please select an AI agent."); return false; }
        return true;
      case 1: 
        if (!selectedService) { setError("Please select a target service."); return false; }
        return true;
      case 2: 
        if (!delegationPurpose.trim()) { setError("Please define the purpose for this delegation."); return false; }
        if (selectedService && (selectedService.available_scopes?.length || 0) > 0 && selectedScopes.length === 0) { 
          setError("Please select at least one permission scope for the service."); return false; 
        }
        return true;
      case 3: 
        if (!currentUser || typeof currentUser.id === 'undefined') { setError("User data error. Cannot proceed."); return false; }
        if (!selectedAgent || typeof selectedAgent.id === 'undefined') { setError("Agent data error. Cannot proceed."); return false; }
        if (!selectedService || typeof selectedService.id === 'undefined') { setError("Service data error. Cannot proceed."); return false; }
        return true;
      default:
        return true;
    }
  };
  
  const handleNext = () => {
    if (validateCurrentStep()) {
      goToNext();
    }
  };

  const generateToken = async () => {
    console.log("DelegationFlow: generateToken - Attempting. Current states:", 
      { currentUser, selectedAgent, selectedService }
    );

    if (!validateCurrentStep()) { 
        console.error("DelegationFlow: generateToken - Validation failed before API call.");
        return;
    }

    if (!currentUser || typeof currentUser.id === 'undefined') {
      setError("Critical error: User data is missing or invalid. Cannot generate token.");
      console.error("DelegationFlow: generateToken - currentUser is invalid:", currentUser);
      return;
    }
    if (!selectedAgent || typeof selectedAgent.id === 'undefined') {
      setError("Critical error: Selected agent data is missing or invalid. Cannot generate token.");
      console.error("DelegationFlow: generateToken - selectedAgent is invalid:", selectedAgent);
      return;
    }
    if (!selectedService || typeof selectedService.id === 'undefined') {
      setError("Critical error: Selected service data is missing or invalid. Cannot generate token.");
      console.error("DelegationFlow: generateToken - selectedService is invalid:", selectedService);
      return;
    }

    setCurrentStepIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const expiresAt = addDays(now, expireDays);
      const tokenId = `dtk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      console.log("DelegationFlow: generateToken - All checks passed. Principal ID:", currentUser.id, "Agent ID:", selectedAgent.id, "Service ID:", selectedService.id);

      const tokenData = {
        token_id: tokenId,
        principal_id: currentUser.id, 
        principal_id_token_ref: `user_ref_${currentUser.id.substring(0,8)}`,
        agent_id: selectedAgent.id, 
        agent_id_token_ref: `agent_ref_${selectedAgent.id.substring(0,8)}`,
        scope: selectedScopes,
        delegation_purpose: delegationPurpose,
        issued_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        target_service_id: selectedService.id, 
        is_revoked: false,
        usage_count: 0,
        audit_trail: [{
          timestamp: now.toISOString(),
          action: "delegation_token_issued",
          resource_accessed: selectedService.name, 
          result: "success",
          details: `Token issued for agent '${selectedAgent.name}' by user '${currentUser.full_name}' for service '${selectedService.name}'.`
        }]
      };
      
      const createdToken = await DelegatedToken.create(tokenData);
      
      await Agent.update(selectedAgent.id, { 
        last_active: now.toISOString(), 
        access_log: [
          ...(selectedAgent.access_log || []),
          { 
            timestamp: now.toISOString(), 
            action: "delegation_token_received", 
            resource: `service/${selectedService.name}`, 
            success: true 
          }
        ],
        system_description: selectedAgent.system_description || "AI Agent with delegation capabilities"  
      });
      
      setNewToken(createdToken);
      goToNext(); 
      
    } catch (err) {
      console.error("DelegationFlow: Failed to generate delegation token during API calls:", err);
      setError(`Failed to generate delegation token: ${err.message || "An unexpected error occurred."}`);
    } finally {
      setCurrentStepIsLoading(false);
    }
  };
  
  // Initial Component Loading State
  if (componentIsLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg text-gray-700">Loading delegation setup...</p>
            <p className="text-sm text-gray-500">Fetching essential data.</p>
        </div>
    );
  }

  // Critical Error State (e.g., user data failed to load)
  if (!currentUser && !componentIsLoading) { // If loading is done, but currentUser is still null
      return (
          <div className="p-4">
               <Alert variant="destructive" className="my-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                      <strong>Critical Error:</strong> {error || "Could not load your user information."} <br/> This component cannot function without user data. Please refresh the page or contact support.
                  </AlertDescription>
              </Alert>
              <Button onClick={onCancel} variant="outline" className="mt-4">Close</Button>
          </div>
      );
  }

  const renderAgentSelection = () => (
    <div className="space-y-4">
      <Label className="text-lg font-medium">Select AI Agent</Label>
      <p className="text-sm text-gray-500 mb-4">Choose the AI agent you want to delegate authority to.</p>
      {currentStepIsLoading && availableAgents.length === 0 && <div className="flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Loading agents...</div>}
      {!currentStepIsLoading && availableAgents.length === 0 && (
          <Alert variant="default" className="bg-slate-50 border-slate-200">
            <User className="h-4 w-4 text-slate-600" />
            <AlertDescription className="text-slate-700">
              No active AI agents found. You'll need to create an agent first.
            </AlertDescription>
          </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {availableAgents.map(agent => (
          <div 
            key={agent.id}
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md ${
              selectedAgent?.id === agent.id 
                ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-500/70' 
                : 'border-gray-200 bg-white hover:border-blue-400'
            }`}
            onClick={() => handleAgentSelection(agent.id)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2.5 rounded-full">
                <User className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-base text-gray-800">{agent.name}</p>
                <p className="text-xs text-gray-600 line-clamp-1" title={agent.system_description}>
                  {agent.system_description || "No description."}
                </p>
              </div>
              {selectedAgent?.id === agent.id && (
                <Check className="ml-auto h-5 w-5 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderServiceSelection = () => (
    <div className="space-y-4">
      <Label className="text-lg font-medium">Select Target Service</Label>
      <p className="text-sm text-gray-500 mb-4">Choose the external service this agent will interact with on your behalf.</p>
      {currentStepIsLoading && availableServices.length === 0 && <div className="flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Loading services...</div>}
      {!currentStepIsLoading && availableServices.length === 0 && (
          <Alert variant="default" className="bg-slate-50 border-slate-200">
            <LinkIcon className="h-4 w-4 text-slate-600" />
            <AlertDescription className="text-slate-700">
                No services configured. An administrator needs to add service integrations first.
            </AlertDescription>
          </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {availableServices.map(service => (
          <div 
            key={service.id}
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md ${
              selectedService?.id === service.id 
                ? 'border-purple-600 bg-purple-50 shadow-md ring-2 ring-purple-500/70' 
                : 'border-gray-200 bg-white hover:border-purple-400'
            }`}
            onClick={() => handleServiceSelection(service.id)}
          >
            <div className="flex items-center gap-3">
              {service.logo_url ? (
                <img src={service.logo_url} alt={service.name} className="h-8 w-8 rounded-md object-contain bg-white p-0.5 border" />
              ) : (
                <div className="bg-gray-100 p-2.5 rounded-full">
                  <LinkIcon className="h-5 w-5 text-purple-700" />
                </div>
              )}
              <div>
                <p className="font-semibold text-base text-gray-800">{service.name}</p>
                <p className="text-xs text-gray-600">
                  {service.service_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              {selectedService?.id === service.id && (
                <Check className="ml-auto h-5 w-5 text-purple-600 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderPurposeAndScopes = () => {
    if (!selectedService) return <Alert className="bg-yellow-50 border-yellow-200 text-yellow-700"><AlertCircle className="h-4 w-4"/>Please select a service in the previous step to define purpose and scopes.</Alert>;
    
    return (
      <div className="space-y-6">
        <div>
          <Label htmlFor="delegationPurpose" className="text-lg font-medium flex items-center gap-2 mb-1">
            <MessageSquare className="h-5 w-5 text-gray-600"/>
            Delegation Purpose
          </Label>
          <p className="text-sm text-gray-500 mb-2">Describe what you want <strong>{selectedAgent?.name || 'the agent'}</strong> to achieve with <strong>{selectedService.name}</strong>. This helps in auditing and understanding the delegation.</p>
          <Textarea
            id="delegationPurpose"
            placeholder={`e.g., 'Allow ${selectedAgent?.name || 'agent'} to read my project tasks in Plane to provide daily summaries.'`}
            value={delegationPurpose}
            onChange={(e) => setDelegationPurpose(e.target.value)}
            className="min-h-[80px] bg-white"
          />
        </div>
        
        <div>
          <Label className="text-lg font-medium flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-gray-600" />
            Permission Scopes for {selectedService.name}
          </Label>
           <p className="text-sm text-gray-500 mb-2">
            Select the specific actions the agent is allowed to perform. These are structured permissions based on your purpose.
          </p>
        </div>
        
        {(selectedService.available_scopes?.length || 0) === 0 ? (
            <Alert variant="default" className="bg-blue-50 border-blue-200">
                <FileText className="h-4 w-4 text-blue-700" />
                <AlertDescription className="text-blue-700">This service has no specific scopes defined by the administrator. The agent will be granted general access as configured for this service integration if you proceed.</AlertDescription>
            </Alert>
        ) : (
            <div className="space-y-3 border rounded-lg p-4 max-h-60 overflow-y-auto bg-white pr-2">
            {selectedService.available_scopes?.map((scope) => (
                <div key={scope.scope_id} className="flex items-start space-x-3 p-2.5 hover:bg-gray-50 rounded-md transition-colors">
                <Checkbox 
                    id={scope.scope_id}
                    checked={selectedScopes.includes(scope.scope_id)}
                    onCheckedChange={() => handleScopeToggle(scope.scope_id)}
                    className="mt-1 border-gray-400"
                />
                <div className="flex-1">
                    <label 
                    htmlFor={scope.scope_id} 
                    className="text-sm font-medium leading-none cursor-pointer text-gray-800"
                    >
                    {scope.scope_id.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <span className={`ml-2 text-xs py-0.5 px-1.5 rounded-full font-normal border ${
                        scope.permission_level === 'read' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                        scope.permission_level === 'write' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        scope.permission_level === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                        {scope.permission_level}
                    </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">{scope.description}</p>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>
    );
  };
  
  const renderReviewConfirm = () => {
    console.log("DelegationFlow: renderReviewConfirm - Current states:", 
      { currentUser, selectedAgent, selectedService }
    );

    if (!currentUser || typeof currentUser.id === 'undefined' || 
        !selectedAgent || typeof selectedAgent.id === 'undefined' || 
        !selectedService || typeof selectedService.id === 'undefined') {
      console.error("DelegationFlow: renderReviewConfirm - Critical data missing:", 
        { hasCurrentUser: !!currentUser, hasAgent: !!selectedAgent, hasService: !!selectedService });
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A problem occurred loading review data. Please go back and ensure an agent and service are correctly selected. If the problem persists, refresh the page.
          </AlertDescription>
          <Button onClick={goToPrevious} variant="outline" className="mt-3 w-full">
            <ChevronRight className="mr-2 h-4 w-4 rotate-180"/> Go Back
          </Button>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-5">
        <Label className="text-xl font-semibold text-gray-800">Review Delegation Details</Label>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-6 space-y-3 text-sm">
            {[
                {label: "Principal (You)", value: `${currentUser.full_name || 'N/A'} (${currentUser.email || 'N/A'})`},
                {label: "AI Agent", value: selectedAgent.name || 'N/A'},
                {label: "Target Service", value: selectedService.name || 'N/A'},
                {label: "Purpose", value: delegationPurpose, preWrap: true},
                {label: "Token Expires", value: `${format(addDays(new Date(), expireDays), "PPP")} (${expireDays} days)`},
            ].map(item => (
                 <div key={item.label} className="flex justify-between items-start pb-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-500 font-medium w-1/3">{item.label}:</span>
                    <span className={`font-normal text-gray-700 w-2/3 text-right ${item.preWrap ? 'whitespace-pre-wrap' : ''}`}>{item.value}</span>
                </div>
            ))}

            <div className="pt-2">
              <p className="text-gray-500 font-medium mb-2">Granted Scopes:</p>
              {selectedScopes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {selectedScopes.map(scope => (
                    <Badge key={scope} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 font-normal">
                      {scope.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 text-right">General access (no specific scopes selected/available for this service).</p>
              )}
            </div>
          </CardContent>
        </Card>
         <div className="space-y-1.5">
          <Label htmlFor="expireDaysSelect" className="text-sm font-medium text-gray-700">Confirm Expiration Period</Label>
          <Select inputId="expireDaysSelect" value={expireDays.toString()} onValueChange={(value) => setExpireDays(parseInt(value))}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select expiration period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 day</SelectItem>
              <SelectItem value="7">7 days (Recommended)</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Alert className="bg-amber-50 border-amber-200 text-amber-700">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            By clicking "Create Delegation Token", you grant <strong>{selectedAgent.name || 'the selected agent'}</strong> the specified permissions to act on your behalf with <strong>{selectedService.name || 'the selected service'}</strong>. This delegation can be revoked at any time from the Integrations dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  };
  
  const renderSuccess = () => (
    <div className="space-y-6 text-center py-8">
      <div className="mx-auto bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center border-4 border-green-200/80 shadow-md">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      <div>
        <h3 className="text-2xl font-semibold text-gray-800">Delegation Token Established!</h3>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          You've successfully created a delegation token for <strong>{selectedAgent?.name || 'the agent'}</strong> to interact with <strong>{selectedService?.name || 'the service'}</strong>.
        </p>
      </div>
      <Card className="mt-6 text-left bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
            <Key className="h-5 w-5 text-gray-600"/>
            Delegation Token Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2.5 text-sm">
           <div className="flex justify-between items-center p-2 border rounded-md bg-gray-50">
            <span className="text-gray-500">Token ID (JTI):</span>
            <span className="font-mono text-xs text-gray-700 truncate" title={newToken?.token_id}>{newToken?.token_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Purpose:</span>
            <span className="font-medium text-gray-700 truncate max-w-[60%]" title={newToken?.delegation_purpose}>{newToken?.delegation_purpose}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expires:</span>
            <span className="font-medium text-gray-700">
              {newToken?.expires_at && format(new Date(newToken.expires_at), "PPp")}
            </span>
          </div>
          <Alert variant="default" className="mt-4 text-xs bg-blue-50 border-blue-200 text-blue-700">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              This token ID is for your reference. The actual token is managed securely. You can revoke this delegation via the Integrations dashboard at any time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
  
  const steps = [
    { title: "Agent", description: "Select AI agent", component: renderAgentSelection, icon: User },
    { title: "Service", description: "Choose target service", component: renderServiceSelection, icon: LinkIcon },
    { title: "Scope", description: "Define purpose & permissions", component: renderPurposeAndScopes, icon: Shield },
    { title: "Review", description: "Confirm delegation", component: renderReviewConfirm, icon: FileText },
    { title: "Complete", description: "Token Issued", component: renderSuccess, icon: Check }
  ];
  
  return (
    <div className="space-y-5 p-1">
      {/* Stepper UI */}
      <div className="flex mb-6 border-b border-gray-200 -mx-1">
        {steps.map((step, index) => (
          <button
            key={index} 
            onClick={() => !currentStepIsLoading && activeStep > index && setActiveStep(index)}
            disabled={currentStepIsLoading || (activeStep <= index && index !== activeStep)}
            className={`flex-1 px-2 py-3 text-center border-b-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-t-md transition-colors duration-150 ease-in-out
              ${ index === activeStep 
                ? "border-blue-600 text-blue-600 font-semibold" 
                : index < activeStep 
                  ? "border-green-500 text-green-700 hover:bg-green-50" 
                  : "border-transparent text-gray-400 hover:text-gray-500"
            } ${activeStep > index && !currentStepIsLoading ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 sm:mb-0 text-xs font-bold transition-colors duration-150 ease-in-out shrink-0
                ${ index === activeStep 
                  ? "bg-blue-600 text-white" 
                  : index < activeStep 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200 text-gray-500"
              }`}>
                {index < activeStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="text-xs sm:text-sm">{step.title}</div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Display general error if set */}
      {error && activeStep < 4 && (
         <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}
      
      <div className="min-h-[350px] px-1 py-2">
         {steps[activeStep]?.component()} 
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
        {activeStep < 4 ? (
          <>
            <Button 
              variant="outline" 
              onClick={activeStep === 0 ? onCancel : goToPrevious}
              disabled={currentStepIsLoading || (activeStep === 0 && !!initialService && !currentUser) } // Disable back if initialService & no user yet
              className="bg-white"
            >
              {activeStep === 0 ? "Cancel" : "Back"}
            </Button>
            
            {activeStep === 3 ? ( 
              <Button 
                onClick={generateToken} 
                disabled={currentStepIsLoading || !currentUser || !selectedAgent || !selectedService}
                className="bg-green-600 hover:bg-green-700"
              >
                {currentStepIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStepIsLoading ? "Creating..." : "Create Delegation Token"}
                {!currentStepIsLoading && <Shield className="ml-2 h-4 w-4"/>}
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={currentStepIsLoading || 
                    (activeStep === 0 && !selectedAgent) || 
                    (activeStep === 1 && !selectedService) ||
                    (activeStep === 2 && (!delegationPurpose.trim() || (selectedService && (selectedService.available_scopes?.length || 0) > 0 && selectedScopes.length === 0)))
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next <ChevronRight className="ml-1 h-4 w-4"/>
              </Button>
            )}
          </>
        ) : ( 
          <Button 
            onClick={onComplete} 
            className="ml-auto bg-blue-600 hover:bg-blue-700"
          >
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
