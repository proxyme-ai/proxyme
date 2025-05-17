import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkIcon, Settings, ExternalLink } from "lucide-react";

export default function ServiceCard({ service, onDelegate }) {
  const serviceTypeColors = {
    crm: "bg-blue-100 text-blue-800 border-blue-200",
    project_management: "bg-purple-100 text-purple-800 border-purple-200",
    finance: "bg-green-100 text-green-800 border-green-200",
    healthcare: "bg-red-100 text-red-800 border-red-200",
    productivity: "bg-amber-100 text-amber-800 border-amber-200",
    other: "bg-gray-100 text-gray-800 border-gray-200"
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {service.logo_url ? (
              <img src={service.logo_url} alt={service.name} className="h-10 w-10 rounded object-contain bg-gray-50 p-1" />
            ) : (
              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-gray-500" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Badge 
                  variant="outline" 
                  className={serviceTypeColors[service.service_type]}
                >
                  {service.service_type.replace(/_/g, ' ')}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant={service.is_active ? "default" : "secondary"}>
              {service.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-2 text-sm text-gray-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-700 font-medium">Available Scopes:</span>
            <span className="text-gray-600">{service.available_scopes?.length || 0}</span>
          </div>
          
          {service.available_scopes && service.available_scopes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {service.available_scopes.slice(0, 4).map((scope) => (
                <Badge key={scope.scope_id} variant="outline" className="text-xs whitespace-nowrap">
                  {scope.scope_id.replace(/[._]/g, ' ')}
                </Badge>
              ))}
              {service.available_scopes.length > 4 && (
                <Badge variant="outline" className="text-xs bg-gray-50">
                  +{service.available_scopes.length - 4} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between items-center">
        <Button variant="outline" size="sm" className="gap-1">
          <Settings className="h-4 w-4" />
          Configure
        </Button>
        <Button 
          onClick={() => onDelegate(service)} 
          className="gap-1 bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          Delegate Access
        </Button>
      </CardFooter>
    </Card>
  );
}
