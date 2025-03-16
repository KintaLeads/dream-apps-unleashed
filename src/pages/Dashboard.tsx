
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import ChannelList from "@/components/telegram/ChannelList";
import ForwardingRules from "@/components/telegram/ForwardingRules";
import MessageProcessor from "@/components/telegram/MessageProcessor";
import ProcessingHistory from "@/components/telegram/ProcessingHistory";
import Settings from "@/components/telegram/Settings";

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("channels");
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Telegram Content Processor</h1>
        <p className="text-muted-foreground mt-2">
          Process and forward messages from private Telegram channels
        </p>
      </div>
      
      <Tabs defaultValue="channels" value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          <Settings />
        </TabsContent>
      </Tabs>
      
      <Toaster />
    </div>
  );
};

export default Dashboard;
