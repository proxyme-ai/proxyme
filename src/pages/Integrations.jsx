
import React, { useState, useEffect } from 'react';
import { ServiceIntegration } from "@/api/entities";
import { Agent } from "@/api/entities";
import { User } from "@/api/entities";
import { DelegatedToken } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  AlertCircle, 
  Plus, 
  SearchIcon, 
  Link2, 
  Shield,
  RefreshCw,
  Filter
} from "lucide-react";

import ServiceCard from "../components/integrations/ServiceCard";
import DelegationsList from "../components/dashboard/DelegationsList";
import DelegationFlow from "../components/auth/DelegationFlow";

export default function IntegrationsPage() {
  const [services, setServices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("services");
  const [showDelegationFlow, setShowDelegationFlow] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      const currentUser = await User.me();
      
      // Load services
      const servicesList = await ServiceIntegration.list();
      setServices(servicesList);
      
      // Load agents
      const agentsList = await Agent.filter({ status: "active" });
      setAgents(agentsList);
      
      // Load delegated tokens
      const tokensList = await DelegatedToken.filter({ principal_id: currentUser.id });
      setTokens(tokensList);
      
    } catch (err) {
      setError("Failed to load data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelegateAccess = (service) => {
    setSelectedService(service);
    setShowDelegationFlow(true);
  };
  
  const handleDelegationComplete = () => {
    setShowDelegationFlow(false);
    setSelectedService(null);
    loadData(); // Refresh data
  };
  
  const handleRevokeToken = async (tokenId) => {
    try {
      setIsLoading(true);
      
      // Update token to revoked status
      await DelegatedToken.update(tokenId, {
        is_revoked: true,
        revocation_reason: "User initiated revocation"
      });
      
      await loadData();
    } catch (err) {
      setError("Failed to revoke token: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.service_type.replace(/_/g, ' ').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeTokens = tokens.filter(token => !token.is_revoked);
  
  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 p-8 md:p-10 mb-8">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Service Integrations
            </h1>
            <p className="text-purple-100 md:text-lg max-w-2xl">
              Connect your AI agents to external services with secure delegation tokens.
              Maintain full control over access permissions and monitor agent activities.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                variant="outline"
                className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={loadData}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button className="gap-2 bg-white text-purple-600 hover:bg-purple-50">
                <Plus className="w-4 h-4" />
                Add Service
              </Button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute right-0 top-0 -mt-20 -mr-20 opacity-50">
            <Link2 className="w-64 h-64 text-purple-400/20" />
          </div>
          <div className="absolute left-0 bottom-0 opacity-10">
            <div className="w-32 h-32 rounded-full bg-white/20" />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60">
          <Tabs defaultValue="services" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b">
              <TabsList className="bg-gray-100/80">
                <TabsTrigger value="services" className="gap-2">
                  <Link2 className="w-4 h-4" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="delegations" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Delegations {activeTokens.length > 0 ? `(${activeTokens.length})` : ""}
                </TabsTrigger>
              </TabsList>
              
              {activeTab === "services" && (
                <div className="relative w-full md:w-auto mt-4 md:mt-0">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full md:w-[300px] bg-white/80"
                  />
                </div>
              )}
              
              {activeTab === "delegations" && (
                <Button variant="outline" size="sm" className="gap-2 mt-4 md:mt-0">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              )}
            </div>
            
            <TabsContent value="services" className="mt-0 p-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="animate-pulse bg-white rounded-lg h-52" />
                  ))}
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map(service => (
                    <ServiceCard 
                      key={service.id} 
                      service={service} 
                      onDelegate={handleDelegateAccess}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Link2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-xl font-medium text-gray-700">No services found</h3>
                  <p className="text-gray-500 mt-1">
                    {searchQuery ? "Try a different search term" : "Add a service integration to get started"}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="delegations" className="mt-0 p-4">
              <DelegationsList 
                tokens={tokens}
                services={services}
                agents={agents}
                onRevoke={handleRevokeToken}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Dialog open={showDelegationFlow} onOpenChange={setShowDelegationFlow}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-blue-600" />
              Create Delegation Token
            </DialogTitle>
          </DialogHeader>
          
          <DelegationFlow 
            onComplete={handleDelegationComplete}
            onCancel={() => setShowDelegationFlow(false)}
            initialService={selectedService}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
