
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Shield, 
  User, 
  Key, 
  ShieldCheck, 
  Menu, 
  X, 
  Home, 
  UserPlus,
  LogOut, 
  GitBranch,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (pageName) => {
    const pageUrl = createPageUrl(pageName);
    return location.pathname === pageUrl;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Auth Protocol</span>
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="p-4">
          <nav className="space-y-1">
            <Link
              to={createPageUrl("Dashboard")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                isActive("Dashboard") 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            
            <Link
              to={createPageUrl("Integrations")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                isActive("Integrations") 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Link2 className="w-5 h-5" />
              Integrations
            </Link>
            
            <Link
              to={createPageUrl("AgentCreate")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                isActive("AgentCreate") 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <UserPlus className="w-5 h-5" />
              New Agent
            </Link>
          </nav>
          
          <div className="mt-8">
            <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Documentation
            </h2>
            <nav className="mt-2 space-y-1">
              <a
                href="#"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Key className="w-5 h-5" />
                API Reference
              </a>
              <a
                href="#"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <GitBranch className="w-5 h-5" />
                Protocol Specs
              </a>
              <a
                href="#"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <ShieldCheck className="w-5 h-5" />
                Security Best Practices
              </a>
            </nav>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 text-gray-700">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@example.com</p>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut className="w-5 h-5 text-gray-500" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Auth Protocol</span>
            </h1>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Add a radial gradient background effect */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-80" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_50%)]" />
    </div>
  );
}
