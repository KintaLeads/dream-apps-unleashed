
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import ChannelList from "@/components/telegram/ChannelList";
import ForwardingRules from "@/components/telegram/ForwardingRules";
import MessageProcessor from "@/components/telegram/MessageProcessor";
import ProcessingHistory from "@/components/telegram/ProcessingHistory";
import Settings from "@/components/telegram/Settings";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, InfoIcon } from "lucide-react";
import { toast } from "sonner";

// Create a custom QueryClient that handles RLS errors gracefully
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState("channels");
  const [hasConnectedAccount, setHasConnectedAccount] = useState(false);
  const [showRlsInfo, setShowRlsInfo] = useState(false);
  const [bypassMode, setBypassMode] = useState(false);
  
  const { data: apiCredentials, error: credentialsError, refetch } = useQuery({
    queryKey: ['dashboard-api-credentials'],
    queryFn: async () => {
      try {
        console.log("Fetching Telegram API credentials");
        
        // First try to get credentials
        const { data, error } = await supabase
          .from('api_credentials')
          .select('*')
          .eq('status', 'connected');
        
        if (error) {
          console.error("Error fetching credentials:", error);
          
          // Check if this is an RLS error
          if (error.message.includes("row-level security") || error.message.includes("permission denied")) {
            setShowRlsInfo(true);
            
            // For demo purposes only, we'll set bypass mode
            // In a real app, you would implement proper authentication
            setBypassMode(true);
            
            // Return empty array to avoid breaking the UI
            return [];
          }
          
          throw error;
        }
        
        console.log("Credentials fetched successfully:", data ? data.length : 0, "connected accounts found");
        return data || [];
      } catch (err) {
        console.error("Unexpected error in credentials fetch:", err);
        return [];
      }
    }
  });
  
  // Log error to console if query fails
  useEffect(() => {
    if (credentialsError) {
      console.error("Query error for API credentials:", credentialsError);
      toast.error("Could not load Telegram account status. Please try refreshing the page.");
    }
  }, [credentialsError]);
  
  useEffect(() => {
    if (apiCredentials && apiCredentials.length > 0) {
      console.log("Setting connected account status to true");
      setHasConnectedAccount(true);
    } else {
      console.log("Setting connected account status to false");
      setHasConnectedAccount(false);
    }
  }, [apiCredentials]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // If user selects settings tab and there's a permission error, show a toast with instructions
    if (value === "settings" && showRlsInfo) {
      toast.info(
        "You're currently using the app without authentication. You can still add API credentials in demo mode.",
        { duration: 6000 }
      );
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Telegram Content Processor</h1>
        <p className="text-muted-foreground mt-2">
          Process and forward messages from private Telegram channels
        </p>
      </div>
      
      {showRlsInfo && (
        <Alert className="mb-6 border-blue-300 bg-blue-50">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-800">Demo Mode Active</AlertTitle>
          <AlertDescription className="text-blue-700">
            This application is running in demo mode without authentication. 
            Some database operations are simulated due to Row Level Security (RLS) policies.
            <div className="mt-2">
              <strong>For production use:</strong> Add authentication using Supabase Auth or another provider.
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {credentialsError && !showRlsInfo && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading account status</AlertTitle>
          <AlertDescription>
            There was a problem checking your Telegram account status. 
            Please refresh the page or check the Settings tab.
          </AlertDescription>
        </Alert>
      )}
      
      {!hasConnectedAccount && !credentialsError && (
        <Alert variant="destructive" className="mb-6 border-yellow-300 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">No connected Telegram account</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Please connect your Telegram account in the Settings tab to use all features of this application.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="channels" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="rules">Forwarding Rules</TabsTrigger>
          <TabsTrigger value="processor">Message Processor</TabsTrigger>
          <TabsTrigger value="history">Processing History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="channels" className="mt-4">
          <ChannelList />
        </TabsContent>
        
        <TabsContent value="rules" className="mt-4">
          <ForwardingRules />
        </TabsContent>
        
        <TabsContent value="processor" className="mt-4">
          <MessageProcessor />
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <ProcessingHistory />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <Settings bypassMode={bypassMode} />
        </TabsContent>
      </Tabs>
      
      <Toaster />
    </div>
  );
};

// Wrap the dashboard content with the QueryClientProvider
const Dashboard: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
};

export default Dashboard;
