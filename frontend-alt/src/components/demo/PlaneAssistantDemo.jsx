import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Loader2, Send, BrainCog, CircleCheck, Calendar, Tags, ArrowRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    content: "Hi! I'm your AI Project Assistant. I can help manage your tasks in services like Plane. Would you like to see how I can connect to Plane?",
    type: "request_init"
  },
];

const USER_AGREES_MESSAGES = [
  {
    id: 2,
    role: "user",
    content: "Yes, show me how to connect to Plane.",
  },
  {
    id: 3,
    role: "assistant",
    content: "Great! To connect to Plane, I need you to delegate specific permissions to me. This ensures I only access what's necessary.",
    type: "info"
  },
  {
    id: 4,
    role: "assistant",
    content: "Here's what's typically needed for project management in Plane:",
    type: "request_permissions_info",
    permissions: [
      { scope: "projects.read", reason: "To see your project structure" },
      { scope: "issues.read", reason: "To check existing tasks" },
      { scope: "issues.write", reason: "To create and update tasks for you" },
    ]
  },
  {
    id: 5,
    role: "assistant",
    content: "You can grant these permissions on the 'Integrations' page. Select 'Plane Project Management', then choose an agent to delegate access to.",
    type: "guidance",
    link: createPageUrl("Integrations"),
    linkText: "Go to Integrations"
  }
];

const Message = ({ message, onUserAgree }) => {
  const isAssistant = message.role === "assistant";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isAssistant ? 'bg-blue-100' : 'bg-purple-100'
      }`}>
        {isAssistant ? (
          <Bot className="w-5 h-5 text-blue-600" />
        ) : (
          <MessageSquare className="w-5 h-5 text-purple-600" />
        )}
      </div>
      
      <div className={`flex-1 space-y-2 ${isAssistant ? 'pr-8' : 'pl-8'}`}>
        {message.type === 'request_init' && isAssistant ? (
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
            <p className="text-gray-700">{message.content}</p>
            <Button 
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
              onClick={onUserAgree}
            >
              Yes, let's connect Plane <ArrowRight className="w-4 h-4 ml-2"/>
            </Button>
          </div>
        ) : message.type === 'request_permissions_info' ? (
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
            <p className="text-gray-700">{message.content}</p>
            <div className="space-y-2">
              {message.permissions.map((perm, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-gray-50 p-2 rounded">
                  <Badge variant="outline" className="mt-0.5 whitespace-nowrap bg-blue-50 border-blue-200 text-blue-700">
                    {perm.scope}
                  </Badge>
                  <span className="text-sm text-gray-600">{perm.reason}</span>
                </div>
              ))}
            </div>
          </div>
        ) : message.type === 'guidance' ? (
           <div className="bg-green-50 border border-green-200 rounded-lg shadow-sm p-4 space-y-3">
            <p className="text-green-800">{message.content}</p>
            <Link to={message.link}>
              <Button 
                variant="outline"
                className="w-full mt-2 border-green-600 text-green-700 hover:bg-green-100"
              >
                {message.linkText} <ExternalLink className="w-4 h-4 ml-2"/>
              </Button>
            </Link>
          </div>
        ) : (
          <div className={`p-3 rounded-lg shadow-sm ${
            isAssistant 
              ? 'bg-white border text-gray-700' 
              : 'bg-purple-600 text-white'
          }`}>
            <p>{message.content}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function PlaneAssistantDemo() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  
  const handleUserAgree = () => {
    setIsTyping(true);
    // Add user's agreement message
    const currentMessages = [...messages, USER_AGREES_MESSAGES[0]];
    setMessages(currentMessages);

    let messageIndex = 1; // Start from the first assistant response after user agrees
    
    const addNextMessage = () => {
      if (messageIndex < USER_AGREES_MESSAGES.length) {
        setMessages(prev => [...prev, USER_AGREES_MESSAGES[messageIndex]]);
        messageIndex++;
        if (messageIndex < USER_AGREES_MESSAGES.length) {
           setTimeout(addNextMessage, 700); // Delay for next assistant message
        } else {
          setIsTyping(false); // All messages shown
        }
      }
    };

    setTimeout(() => {
       addNextMessage(); // Start assistant's response sequence
    }, 500); // Initial delay after user message
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-md shadow-xl border-gray-200/70">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Bot className="w-6 h-6 text-blue-600" />
          AI Assistant Delegation Demo
        </CardTitle>
        <CardDescription className="text-gray-600">
          See how an AI agent requests permissions for a service like Plane.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 h-[400px] overflow-y-auto">
        <AnimatePresence>
          {messages.map((msg) => (
            <Message 
              key={msg.id} 
              message={msg} 
              onUserAgree={handleUserAgree}
            />
          ))}
        </AnimatePresence>
        
        {isTyping && messages[messages.length-1]?.role === 'user' && ( // Show typing only after user message and before assistant responds
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 pt-2"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 pr-8">
              <div className="bg-white rounded-lg shadow-sm border p-3 inline-block">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
      {/* Footer can be removed or simplified as interaction is guided now */}
       <CardFooter className="border-t p-3">
        <p className="text-xs text-gray-500 text-center w-full">
          This is a simulated interaction to demonstrate the delegation concept.
        </p>
      </CardFooter>
    </Card>
  );
}
