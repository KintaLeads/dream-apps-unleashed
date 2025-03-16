
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Clipboard, Copy } from 'lucide-react';
import { toast } from 'sonner';

type ForwardingRule = {
  id: string;
  source_channel_id: string;
  target_channel_id: string;
  replace_usernames: boolean;
  remove_links: boolean;
  remove_stickers: boolean;
  remove_forwarded: boolean;
  default_username: string;
  is_active: boolean;
  source_channel: {
    id: string;
    channel_name: string;
  };
  target_channel: {
    id: string;
    channel_name: string;
  };
};

const MessageProcessor: React.FC = () => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [sourceText, setSourceText] = useState<string>('');
  const [processedText, setProcessedText] = useState<string>('');
  const [detectedUsernames, setDetectedUsernames] = useState<string[]>([]);
  const [detectedLinks, setDetectedLinks] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Query to fetch active forwarding rules
  const { data: rules, isLoading: isLoadingRules } = useQuery({
    queryKey: ['activeForwardingRules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_forwarding_rules')
        .select(`
          *,
          source_channel:source_channel_id(id, channel_name),
          target_channel:target_channel_id(id, channel_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ForwardingRule[];
    }
  });

  // Mutation to save processed message
  const saveMessageMutation = useMutation({
    mutationFn: async (params: {
      sourceText: string;
      processedText: string;
      ruleId: string;
      sourceChannelId: string;
      targetChannelId: string;
      usernamesReplaced: string[];
      linksRemoved: string[];
    }) => {
      const { data, error } = await supabase
        .from('telegram_message_logs')
        .insert([{
          source_text: params.sourceText,
          processed_text: params.processedText,
          rule_id: params.ruleId,
          source_channel_id: params.sourceChannelId,
          target_channel_id: params.targetChannelId,
          usernames_replaced: params.usernamesReplaced.length > 0 ? params.usernamesReplaced : null,
          links_removed: params.linksRemoved.length > 0 ? params.linksRemoved : null,
          status: 'processed'
        }])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      toast.success('Message processed and saved to history');
    },
    onError: (error) => {
      toast.error(`Error saving message: ${error.message}`);
    }
  });

  const processMessage = () => {
    if (!sourceText.trim()) {
      toast.error('Please enter source text');
      return;
    }

    if (!selectedRuleId) {
      toast.error('Please select a forwarding rule');
      return;
    }

    const selectedRule = rules?.find(rule => rule.id === selectedRuleId);
    if (!selectedRule) {
      toast.error('Selected rule not found');
      return;
    }

    setIsProcessing(true);

    try {
      let processed = sourceText;
      const detectedUsers: string[] = [];
      const detectedURLs: string[] = [];

      // Process usernames (@username)
      if (selectedRule.replace_usernames) {
        const usernameRegex = /@([a-zA-Z0-9_]+)/g;
        const matches = processed.match(usernameRegex);
        
        if (matches) {
          detectedUsers.push(...matches);
          processed = processed.replace(usernameRegex, selectedRule.default_username);
        }
        setDetectedUsernames(detectedUsers);
      }

      // Process links (http, https)
      if (selectedRule.remove_links) {
        const linkRegex = /(https?:\/\/[^\s]+)/g;
        const matches = processed.match(linkRegex);
        
        if (matches) {
          detectedURLs.push(...matches);
          processed = processed.replace(linkRegex, '[Link removed]');
        }
        setDetectedLinks(detectedURLs);
      }

      // If remove stickers is enabled, remove text that resembles sticker indications
      if (selectedRule.remove_stickers) {
        // Simple pattern to detect sticker mentions
        processed = processed.replace(/\[sticker\]|\(sticker\)|sent a sticker/gi, '');
      }

      // If remove forwarded is enabled, remove "Forwarded from" text
      if (selectedRule.remove_forwarded) {
        processed = processed.replace(/Forwarded from [^\n]+/g, '');
      }

      // Clean up any double spaces or multiple newlines
      processed = processed.replace(/\s+/g, ' ').trim();
      processed = processed.replace(/\n\s*\n/g, '\n\n');

      setProcessedText(processed);

      // Log this processing
      saveMessageMutation.mutate({
        sourceText,
        processedText: processed,
        ruleId: selectedRule.id,
        sourceChannelId: selectedRule.source_channel_id,
        targetChannelId: selectedRule.target_channel_id,
        usernamesReplaced: detectedUsers,
        linksRemoved: detectedURLs
      });

    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Error processing message');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!processedText) return;
    
    navigator.clipboard.writeText(processedText)
      .then(() => toast.success('Processed text copied to clipboard'))
      .catch(() => toast.error('Failed to copy text'));
  };

  const resetForm = () => {
    setSourceText('');
    setProcessedText('');
    setDetectedUsernames([]);
    setDetectedLinks([]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Message Processor</h2>
      
      <div className="grid gap-6">
        <div className="space-y-4">
          <Label htmlFor="rule_select">Select Forwarding Rule</Label>
          <Select 
            value={selectedRuleId} 
            onValueChange={setSelectedRuleId}
          >
            <SelectTrigger id="rule_select" className="w-full">
              <SelectValue placeholder="Select a forwarding rule" />
            </SelectTrigger>
            <SelectContent>
              {rules?.map(rule => (
                <SelectItem key={rule.id} value={rule.id}>
                  {rule.source_channel.channel_name} → {rule.target_channel.channel_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="source_text">Source Text</Label>
            <Textarea 
              id="source_text"
              placeholder="Paste the message from Telegram here"
              className="min-h-[200px]"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="processed_text">Processed Text</Label>
              {processedText && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
              )}
            </div>
            <Textarea 
              id="processed_text"
              placeholder="Processed text will appear here"
              className="min-h-[200px]"
              value={processedText}
              readOnly
            />
          </div>
        </div>
        
        <div className="flex gap-4 justify-between items-start">
          <div className="space-y-2 flex-1">
            {detectedUsernames.length > 0 && (
              <div>
                <Label>Detected Usernames:</Label>
                <div className="text-sm bg-muted p-2 rounded mt-1">
                  {detectedUsernames.map((username, index) => (
                    <span key={index} className="inline-block m-1 px-2 py-1 bg-background rounded-full text-xs">
                      {username}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {detectedLinks.length > 0 && (
              <div>
                <Label>Detected Links:</Label>
                <div className="text-sm bg-muted p-2 rounded mt-1 overflow-hidden">
                  {detectedLinks.map((link, index) => (
                    <div key={index} className="truncate mb-1">
                      {link}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
            <Button onClick={processMessage} disabled={isProcessing || !sourceText || !selectedRuleId}>
              {isProcessing ? 'Processing...' : 'Process Message'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageProcessor;
