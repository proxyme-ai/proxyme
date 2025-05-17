import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableCell, 
  TableBody, 
  Table 
} from "@/components/ui/table";
import { 
  Shield, 
  Clock, 
  Ban, 
  ExternalLink,
  AlertTriangle,
  User,
  Link as LinkIcon,
  FileText
} from "lucide-react";
import { format, isPast, formatDistanceToNowStrict } from "date-fns";

export default function DelegationsList({ 
  tokens = [], 
  services = [], 
  agents = [], 
  onRevoke,
  isLoading = false
}) {
  const getServiceById = (id) => {
    return services.find(service => service.id === id) || { name: 'Unknown Service', logo_url: null };
  };
  
  const getAgentById = (id) => {
    return agents.find(agent => agent.id === id) || { name: 'Unknown Agent' };
  };
  
  const getTokenStatus = (token) => {
    if (token.is_revoked) return { text: "Revoked", color: "bg-red-100 text-red-700 border-red-300" };
    if (isPast(new Date(token.expires_at))) return { text: "Expired", color: "bg-amber-100 text-amber-700 border-amber-300" };
    return { text: "Active", color: "bg-green-100 text-green-700 border-green-300" };
  };
  
  const handleRevoke = async (tokenId) => {
    if (confirm("Are you sure you want to revoke this delegation? The agent will immediately lose access for this service.")) {
      onRevoke(tokenId);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-blue-600" />
            My Delegated Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="animate-pulse p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (tokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-blue-600" />
            My Delegated Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-gray-500">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No Delegations Yet</h3>
            <p className="mt-1">
              You haven't delegated access to any AI agents for external services.
            </p>
            <p className="mt-1">Go to 'Integrations' to create your first delegation.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Shield className="h-5 w-5 text-blue-600" />
          My Delegated Tokens
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Expires / Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map(token => {
              const agent = getAgentById(token.agent_id);
              const service = getServiceById(token.target_service_id);
              const status = getTokenStatus(token);
              const tokenIsInactive = token.is_revoked || isPast(new Date(token.expires_at));

              return (
                <TableRow key={token.id} className={tokenIsInactive ? "opacity-60" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-100 p-1.5 rounded-full">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-gray-500">{token.scope.length} scope(s)</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {service.logo_url ? (
                        <img src={service.logo_url} alt={service.name} className="h-6 w-6 rounded object-contain bg-white p-0.5" />
                      ) : (
                        <div className="bg-gray-100 p-1.5 rounded-full"><LinkIcon className="h-4 w-4 text-gray-600" /></div>
                      )}
                      <span>{service.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600" title={token.delegation_purpose}>
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{token.delegation_purpose}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <Badge variant="outline" className={`text-xs ${status.color}`}>
                        {status.text}
                      </Badge>
                      <span className="text-xs text-gray-500 mt-1">
                        {isPast(new Date(token.expires_at)) 
                          ? `Expired ${formatDistanceToNowStrict(new Date(token.expires_at), { addSuffix: true })}`
                          : `Expires in ${formatDistanceToNowStrict(new Date(token.expires_at))}`
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        // onClick={() => alert(`Details for token: ${token.token_id}`)} // Placeholder for details view
                        title="View Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button> */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" 
                        onClick={() => handleRevoke(token.id)}
                        disabled={tokenIsInactive}
                        title="Revoke Token"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {tokens.some(token => !token.is_revoked && !isPast(new Date(token.expires_at))) && (
          <div className="p-4 text-sm flex items-start gap-3 bg-blue-50 border-t border-blue-100">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700">
              Review active delegations regularly. Revoke any access that is no longer necessary to maintain security.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
