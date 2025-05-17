import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Shield, Clock, User, Lock, Key } from "lucide-react";

export default function ActivityLog({ logs = [] }) {
  const getActionIcon = (action) => {
    switch (action) {
      case 'token_generated': return <Key className="h-4 w-4" />;
      case 'delegation_requested': return <User className="h-4 w-4" />;
      case 'delegation_approved': return <Shield className="h-4 w-4 text-green-500" />;
      case 'delegation_denied': return <Shield className="h-4 w-4 text-red-500" />;
      default: return <Lock className="h-4 w-4" />;
    }
  };
  
  const getActionLabel = (action) => {
    switch (action) {
      case 'token_generated': return 'Token Generated';
      case 'delegation_requested': return 'Delegation Requested';
      case 'delegation_approved': return 'Delegation Approved';
      case 'delegation_denied': return 'Delegation Denied';
      default: return action.replace(/_/g, ' ');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No activity recorded yet
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                <div className="bg-gray-100 p-2 rounded-full">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{getActionLabel(log.action)}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Resource: {log.resource}
                  </p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(log.timestamp), "MMM d, h:mm a")}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}