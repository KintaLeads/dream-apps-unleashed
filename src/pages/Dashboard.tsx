import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import ChannelList from "@/components/telegram/ChannelList";
import ForwardingRules from "@/components/telegram/ForwardingRules";
import ProcessingHistory from "@/components/telegram/ProcessingHistory";
import Settings from "@/components/telegram/Settings";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, InfoIcon } from "lucide-react";
import { toast } from "sonner";

// Create a custom QueryClient that handles errors gracefully
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
  const [hasUnassignedRules, setHasUnassignedRules] = useState(false);
  
  const { data: apiCredentials, error: credentialsError, refetch } = useQuery({
    queryKey: ['dashboard-api-credentials'],
    queryFn: async () => {
      try {
        console.log("Fetching Telegram API credentials");
        
        const { data, error } = await supabase
          .from('api_credentials')
          .select('*')
          .eq('status', 'connected');
        
        if (error) {
          console.error("Error fetching credentials:", error);
          throw error;
        }
        
        console.log("Credentials fetched successfully:", data ? data.length : 0, "connected accounts found");
        return data || [];
      } catch (err) {
        console.error("Unexpected error in credentials fetch:", err);
        throw err;
      }
    }
  });
  
  // Check for rules without API credential assigned
  const { data: unassignedRules } = useQuery({
    queryKey: ['unassigned-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_forwarding_rules')
        .select('id')
        .is('api_credential_id', null)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: hasConnectedAccount // Only run this query if there's at least one connected account
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

  useEffect(() => {
    if (unassignedRules && unassignedRules.length > 0) {
      setHasUnassignedRules(true);
    } else {
      setHasUnassignedRules(false);
    }
  }, [unassignedRules]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Telegram Content Processor</h1>
          <p className="text-muted-foreground mt-2">
            Process and forward messages from private Telegram channels
          </p>
        </div>
      </div>
      
      {credentialsError && (
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

      {hasUnassignedRules && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unassigned forwarding rules detected</AlertTitle>
          <AlertDescription>
            You have active forwarding rules without a Telegram account assigned. 
            Please edit these rules in the Forwarding Rules tab and assign an account to each rule.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="channels" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="rules">Forwarding Rules</TabsTrigger>
          <TabsTrigger value="history">Processing History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="channels" className="mt-4">
          <ChannelList />
        </TabsContent>
        
        <TabsContent value="rules" className="mt-4">
          <ForwardingRules />
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <ProcessingHistory />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <Settings />
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
