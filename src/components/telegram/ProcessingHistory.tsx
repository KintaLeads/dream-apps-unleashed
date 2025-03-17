
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';

type MessageLog = {
  id: string;
  created_at: string;
  source_text: string;
  processed_text: string;
  source_channel: {
    id: string;
    channel_name: string;
  };
  target_channel: {
    id: string;
    channel_name: string;
  };
  rule: {
    id: string;
    default_username: string;
  };
  usernames_replaced: string[] | null;
  links_removed: string[] | null;
};

const ProcessingHistory: React.FC = () => {
  // Query to fetch message logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['messageLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_message_logs')
        .select(`
          *,
          source_channel:source_channel_id(id, channel_name),
          target_channel:target_channel_id(id, channel_name),
          rule:rule_id(id, default_username)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as MessageLog[];
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Text copied to clipboard'))
      .catch(() => toast.error('Failed to copy text'));
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Message History</h2>
      
      {isLoading ? (
        <div className="text-center p-4">Loading history...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Source Channel</TableHead>
                <TableHead>Target Channel</TableHead>
                <TableHead>Processed Text</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs && logs.length > 0 ? (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      {log.source_channel?.channel_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {log.target_channel?.channel_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.processed_text}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px]">
                          <DialogHeader>
                            <DialogTitle>Message Details</DialogTitle>
                            <DialogDescription>
                              Processed on {formatDate(log.created_at)}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium">Original Text</p>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => copyToClipboard(log.source_text)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-sm p-2 bg-muted rounded h-40 overflow-y-auto whitespace-pre-wrap">
                                  {log.source_text}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium">Processed Text</p>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => copyToClipboard(log.processed_text)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-sm p-2 bg-muted rounded h-40 overflow-y-auto whitespace-pre-wrap">
                                  {log.processed_text}
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(log.processed_text)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No message history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ProcessingHistory;
