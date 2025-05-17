import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Calendar, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function TokenDisplay({ token }) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(token.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!token) return null;
  
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-700">Authentication Token Generated</CardTitle>
        <CardDescription>
          This token will only be shown once. Make sure to copy it now.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-white rounded-md border border-blue-200 font-mono text-sm break-all">
          {token.token}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
              <Calendar className="h-4 w-4" />
              <span>Issued</span>
            </div>
            <div className="text-sm font-medium">
              {format(new Date(token.issued_at), "PPp")}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
              <Calendar className="h-4 w-4" />
              <span>Expires</span>
            </div>
            <div className="text-sm font-medium">
              {format(new Date(token.expires_at), "PPp")}
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <Shield className="h-4 w-4" />
            <span>Permissions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {token.scope.map((permission, index) => (
              <Badge key={index} variant="outline" className="bg-white">
                {permission.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
        
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertDescription className="text-xs">
            Store this token securely. It grants access based on the permissions shown above.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full gap-2" 
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy to Clipboard
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}