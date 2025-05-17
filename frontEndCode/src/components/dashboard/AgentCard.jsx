import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Shield, 
  Clock, 
  AlertCircle, 
  Info, 
  Zap,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Agent } from "@/api/entities";

export default function AgentCard({ agent, onClick, onDelete }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'revoked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const isExpired = agent.expiration_date ? new Date(agent.expiration_date) < new Date() : false;
  
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent card click
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await Agent.delete(agent.id);
      setIsDeleteDialogOpen(false);
      if (onDelete) onDelete(agent.id);
    } catch (err) {
      console.error("Failed to delete agent:", err);
      // You might want to show an error toast or message here
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full" onClick={onClick}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-1">
            <CardTitle className="text-xl font-semibold">{agent.name}</CardTitle>
            <Badge className={`text-xs ${getStatusColor(agent.status)}`}>
              {agent.status}
            </Badge>
          </div>
          <CardDescription className="text-xs text-gray-500 line-clamp-2" title={agent.system_description}>
            {agent.system_description || "No system description provided."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div className="text-sm">
              <div className="flex items-center gap-1.5 mb-1 text-gray-600 font-medium">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Capabilities:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.slice(0,3).map((cap, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                    {cap.replace(/_/g, ' ')}
                  </Badge>
                ))}
                {agent.capabilities.length > 3 && <Badge variant="outline" className="text-xs bg-gray-100">+{agent.capabilities.length - 3} more</Badge>}
              </div>
            </div>
          )}
          
          {agent.last_active && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Last active: {formatDistanceToNow(new Date(agent.last_active), { addSuffix: true })}
            </div>
          )}
          
          {isExpired && (
            <div className="flex items-center text-xs text-amber-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              Platform API Key Expired
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-3 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-0 h-8 px-2"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button variant="link" size="sm" className="gap-1 text-blue-600 px-0">
            View Details <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{agent.name}"? This action cannot be undone.
              All delegated tokens for this agent will be invalidated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Agent"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}