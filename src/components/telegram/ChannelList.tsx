
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, X, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Channel = {
  id: string;
  channel_name: string;
  channel_id: string | null;
  description: string | null;
  is_active: boolean;
};

type ChannelType = 'source' | 'target';

const ChannelList: React.FC = () => {
  const queryClient = useQueryClient();
  const [channelType, setChannelType] = useState<ChannelType>('source');
  const [newChannel, setNewChannel] = useState({ channel_name: '', channel_id: '', description: '' });
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const tableName = channelType === 'source' ? 'telegram_source_channels' : 'telegram_target_channels';

  // Query to fetch channels
  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels', channelType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Channel[];
    }
  });

  // Mutation to add a new channel
  const addChannelMutation = useMutation({
    mutationFn: async (newChannel: Omit<Channel, 'id' | 'is_active'>) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ ...newChannel, is_active: true }])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelType] });
      setIsAdding(false);
      setNewChannel({ channel_name: '', channel_id: '', description: '' });
      toast.success(`${channelType} channel added successfully`);
    },
    onError: (error) => {
      toast.error(`Error adding channel: ${error.message}`);
    }
  });

  // Mutation to update a channel
  const updateChannelMutation = useMutation({
    mutationFn: async (channel: Channel) => {
      const { data, error } = await supabase
        .from(tableName)
        .update({
          channel_name: channel.channel_name,
          channel_id: channel.channel_id,
          description: channel.description
        })
        .eq('id', channel.id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelType] });
      setEditingChannel(null);
      toast.success(`${channelType} channel updated successfully`);
    },
    onError: (error) => {
      toast.error(`Error updating channel: ${error.message}`);
    }
  });

  // Mutation to delete a channel
  const deleteChannelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelType] });
      toast.success(`${channelType} channel deleted successfully`);
    },
    onError: (error) => {
      toast.error(`Error deleting channel: ${error.message}`);
    }
  });

  const handleAddChannel = () => {
    if (!newChannel.channel_name.trim()) {
      toast.error('Channel name is required');
      return;
    }
    
    addChannelMutation.mutate(newChannel);
  };

  const handleUpdateChannel = () => {
    if (!editingChannel?.channel_name.trim()) {
      toast.error('Channel name is required');
      return;
    }
    
    updateChannelMutation.mutate(editingChannel);
  };

  const handleDeleteChannel = (id: string) => {
    if (confirm('Are you sure you want to delete this channel?')) {
      deleteChannelMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-x-4">
          <Button 
            variant={channelType === 'source' ? 'default' : 'outline'} 
            onClick={() => setChannelType('source')}
          >
            Source Channels
          </Button>
          <Button 
            variant={channelType === 'target' ? 'default' : 'outline'} 
            onClick={() => setChannelType('target')}
          >
            Target Channels
          </Button>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" /> 
          Add {channelType} Channel
        </Button>
      </div>

      {isAdding && (
        <div className="bg-card p-4 rounded-lg border mb-6">
          <h3 className="text-lg font-medium mb-4">Add New {channelType.charAt(0).toUpperCase() + channelType.slice(1)} Channel</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="channel_name">Channel Name *</Label>
              <Input 
                id="channel_name"
                value={newChannel.channel_name}
                onChange={(e) => setNewChannel({...newChannel, channel_name: e.target.value})}
                placeholder="Enter channel name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="channel_id">Channel ID</Label>
              <Input 
                id="channel_id"
                value={newChannel.channel_id}
                onChange={(e) => setNewChannel({...newChannel, channel_id: e.target.value})}
                placeholder="Enter channel ID (optional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={newChannel.description}
                onChange={(e) => setNewChannel({...newChannel, description: e.target.value})}
                placeholder="Enter channel description (optional)"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsAdding(false);
                setNewChannel({ channel_name: '', channel_id: '', description: '' });
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddChannel}>
                Add Channel
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-4">Loading channels...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel Name</TableHead>
                <TableHead>Channel ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels && channels.length > 0 ? (
                channels.map(channel => (
                  <TableRow key={channel.id}>
                    <TableCell>
                      {editingChannel?.id === channel.id ? (
                        <Input 
                          value={editingChannel.channel_name}
                          onChange={(e) => setEditingChannel({...editingChannel, channel_name: e.target.value})}
                        />
                      ) : (
                        channel.channel_name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingChannel?.id === channel.id ? (
                        <Input 
                          value={editingChannel.channel_id || ''}
                          onChange={(e) => setEditingChannel({...editingChannel, channel_id: e.target.value})}
                        />
                      ) : (
                        channel.channel_id || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingChannel?.id === channel.id ? (
                        <Textarea 
                          value={editingChannel.description || ''}
                          onChange={(e) => setEditingChannel({...editingChannel, description: e.target.value})}
                        />
                      ) : (
                        channel.description || '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingChannel?.id === channel.id ? (
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingChannel(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleUpdateChannel}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingChannel(channel)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteChannel(channel.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No {channelType} channels found. Add one to get started.
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

export default ChannelList;
