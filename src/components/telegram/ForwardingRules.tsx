
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, X, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

type ApiCredential = {
  id: string;
  nickname: string;
  api_name: string;
  status: string;
};

type SourceChannel = {
  id: string;
  channel_name: string;
};

type TargetChannel = {
  id: string;
  channel_name: string;
};

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
  api_credential_id: string | null;
  source_channel?: SourceChannel;
  target_channel?: TargetChannel;
};

const ForwardingRules: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingRule, setEditingRule] = useState<ForwardingRule | null>(null);
  
  const [newRule, setNewRule] = useState<Omit<ForwardingRule, 'id' | 'source_channel' | 'target_channel'>>({
    source_channel_id: '',
    target_channel_id: '',
    replace_usernames: true,
    remove_links: true,
    remove_stickers: true,
    remove_forwarded: true,
    default_username: '@channel_user',
    is_active: true,
    api_credential_id: null
  });

  // Query to fetch forwarding rules
  const { data: rules, isLoading: isLoadingRules } = useQuery({
    queryKey: ['forwardingRules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_forwarding_rules')
        .select(`
          *,
          source_channel:source_channel_id(id, channel_name),
          target_channel:target_channel_id(id, channel_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ForwardingRule[];
    }
  });

  // Query to fetch source channels for dropdown
  const { data: sourceChannels, isLoading: isLoadingSourceChannels } = useQuery({
    queryKey: ['sourceChannels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_source_channels')
        .select('id, channel_name')
        .order('channel_name', { ascending: true });
      
      if (error) throw error;
      return data as SourceChannel[];
    }
  });

  // Query to fetch target channels for dropdown
  const { data: targetChannels, isLoading: isLoadingTargetChannels } = useQuery({
    queryKey: ['targetChannels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_target_channels')
        .select('id, channel_name')
        .order('channel_name', { ascending: true });
      
      if (error) throw error;
      return data as TargetChannel[];
    }
  });

  // Query to fetch API credentials for dropdown
  const { data: apiCredentials, isLoading: isLoadingApiCredentials } = useQuery({
    queryKey: ['apiCredentials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_credentials')
        .select('id, nickname, api_name, status')
        .eq('status', 'connected')
        .order('nickname', { ascending: true });
      
      if (error) throw error;
      return data as ApiCredential[];
    }
  });

  // Mutation to add a new rule
  const addRuleMutation = useMutation({
    mutationFn: async (rule: Omit<ForwardingRule, 'id' | 'source_channel' | 'target_channel'>) => {
      const { data, error } = await supabase
        .from('telegram_forwarding_rules')
        .insert([rule])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forwardingRules'] });
      setIsAdding(false);
      setNewRule({
        source_channel_id: '',
        target_channel_id: '',
        replace_usernames: true,
        remove_links: true,
        remove_stickers: true,
        remove_forwarded: true,
        default_username: '@channel_user',
        is_active: true,
        api_credential_id: null
      });
      toast.success('Forwarding rule added successfully');
    },
    onError: (error) => {
      toast.error(`Error adding rule: ${error.message}`);
    }
  });

  // Mutation to update a rule
  const updateRuleMutation = useMutation({
    mutationFn: async (rule: ForwardingRule) => {
      const { data, error } = await supabase
        .from('telegram_forwarding_rules')
        .update({
          source_channel_id: rule.source_channel_id,
          target_channel_id: rule.target_channel_id,
          replace_usernames: rule.replace_usernames,
          remove_links: rule.remove_links,
          remove_stickers: rule.remove_stickers,
          remove_forwarded: rule.remove_forwarded,
          default_username: rule.default_username,
          is_active: rule.is_active,
          api_credential_id: rule.api_credential_id
        })
        .eq('id', rule.id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forwardingRules'] });
      setEditingRule(null);
      toast.success('Forwarding rule updated successfully');
    },
    onError: (error) => {
      toast.error(`Error updating rule: ${error.message}`);
    }
  });

  // Mutation to delete a rule
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('telegram_forwarding_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forwardingRules'] });
      toast.success('Forwarding rule deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting rule: ${error.message}`);
    }
  });

  const handleAddRule = () => {
    if (!newRule.source_channel_id || !newRule.target_channel_id) {
      toast.error('Source and target channels are required');
      return;
    }
    
    addRuleMutation.mutate(newRule);
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;
    
    if (!editingRule.source_channel_id || !editingRule.target_channel_id) {
      toast.error('Source and target channels are required');
      return;
    }
    
    updateRuleMutation.mutate(editingRule);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRuleMutation.mutate(id);
    }
  };

  const toggleRuleStatus = (rule: ForwardingRule) => {
    updateRuleMutation.mutate({
      ...rule,
      is_active: !rule.is_active
    });
  };

  // Helper function to get credential nickname
  const getCredentialNickname = (credentialId: string | null) => {
    if (!credentialId || !apiCredentials) return "No account selected";
    const credential = apiCredentials.find(cred => cred.id === credentialId);
    return credential?.nickname || "Unknown account";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Forwarding Rules</h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" /> Add Rule
        </Button>
      </div>

      {isAdding && (
        <div className="bg-card p-4 rounded-lg border mb-6">
          <h3 className="text-lg font-medium mb-4">Add New Forwarding Rule</h3>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="api_credential">Telegram Account *</Label>
                <Select 
                  value={newRule.api_credential_id || ''} 
                  onValueChange={(value) => setNewRule({...newRule, api_credential_id: value || null})}
                >
                  <SelectTrigger id="api_credential">
                    <SelectValue placeholder="Select Telegram Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiCredentials?.map(credential => (
                      <SelectItem key={credential.id} value={credential.id}>
                        {credential.nickname || credential.api_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {apiCredentials?.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No connected accounts found. Connect a Telegram account in Settings first.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="source_channel">Source Channel *</Label>
                <Select 
                  value={newRule.source_channel_id} 
                  onValueChange={(value) => setNewRule({...newRule, source_channel_id: value})}
                >
                  <SelectTrigger id="source_channel">
                    <SelectValue placeholder="Select source channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceChannels?.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.channel_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target_channel">Target Channel *</Label>
                <Select 
                  value={newRule.target_channel_id} 
                  onValueChange={(value) => setNewRule({...newRule, target_channel_id: value})}
                >
                  <SelectTrigger id="target_channel">
                    <SelectValue placeholder="Select target channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetChannels?.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.channel_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="default_username">Default Username</Label>
              <Input 
                id="default_username"
                value={newRule.default_username}
                onChange={(e) => setNewRule({...newRule, default_username: e.target.value})}
                placeholder="Default username to replace with"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="replace_usernames" 
                  checked={newRule.replace_usernames}
                  onCheckedChange={(checked) => setNewRule({...newRule, replace_usernames: checked})}
                />
                <Label htmlFor="replace_usernames">Replace Usernames</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="remove_links" 
                  checked={newRule.remove_links}
                  onCheckedChange={(checked) => setNewRule({...newRule, remove_links: checked})}
                />
                <Label htmlFor="remove_links">Remove Links</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="remove_stickers" 
                  checked={newRule.remove_stickers}
                  onCheckedChange={(checked) => setNewRule({...newRule, remove_stickers: checked})}
                />
                <Label htmlFor="remove_stickers">Remove Stickers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="remove_forwarded" 
                  checked={newRule.remove_forwarded}
                  onCheckedChange={(checked) => setNewRule({...newRule, remove_forwarded: checked})}
                />
                <Label htmlFor="remove_forwarded">Remove Forwarded Messages</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsAdding(false);
                setNewRule({
                  source_channel_id: '',
                  target_channel_id: '',
                  replace_usernames: true,
                  remove_links: true,
                  remove_stickers: true,
                  remove_forwarded: true,
                  default_username: '@channel_user',
                  is_active: true,
                  api_credential_id: null
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddRule}>
                Add Rule
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoadingRules || isLoadingSourceChannels || isLoadingTargetChannels || isLoadingApiCredentials ? (
        <div className="text-center p-4">Loading rules...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Telegram Account</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Processing Options</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules && rules.length > 0 ? (
                rules.map(rule => (
                  <TableRow key={rule.id} className={!rule.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      {editingRule?.id === rule.id ? (
                        <Select 
                          value={editingRule.api_credential_id || ''} 
                          onValueChange={(value) => setEditingRule({...editingRule, api_credential_id: value || null})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Telegram Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {apiCredentials?.map(credential => (
                              <SelectItem key={credential.id} value={credential.id}>
                                {credential.nickname || credential.api_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        getCredentialNickname(rule.api_credential_id)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRule?.id === rule.id ? (
                        <Select 
                          value={editingRule.source_channel_id} 
                          onValueChange={(value) => setEditingRule({...editingRule, source_channel_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source channel" />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceChannels?.map(channel => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.channel_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        rule.source_channel?.channel_name || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRule?.id === rule.id ? (
                        <Select 
                          value={editingRule.target_channel_id} 
                          onValueChange={(value) => setEditingRule({...editingRule, target_channel_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target channel" />
                          </SelectTrigger>
                          <SelectContent>
                            {targetChannels?.map(channel => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.channel_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        rule.target_channel?.channel_name || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRule?.id === rule.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              checked={editingRule.replace_usernames}
                              onCheckedChange={(checked) => setEditingRule({...editingRule, replace_usernames: checked})}
                            />
                            <Label>Replace Usernames</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch 
                              checked={editingRule.remove_links}
                              onCheckedChange={(checked) => setEditingRule({...editingRule, remove_links: checked})}
                            />
                            <Label>Remove Links</Label>
                          </div>
                          <Input 
                            value={editingRule.default_username}
                            onChange={(e) => setEditingRule({...editingRule, default_username: e.target.value})}
                            placeholder="Default username"
                            className="mt-2"
                          />
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className="flex flex-col space-y-1">
                            {rule.replace_usernames && <span>• Replace usernames with {rule.default_username}</span>}
                            {rule.remove_links && <span>• Remove links</span>}
                            {rule.remove_stickers && <span>• Remove stickers</span>}
                            {rule.remove_forwarded && <span>• Remove forwarded</span>}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRuleStatus(rule)}
                        />
                        <span>{rule.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingRule?.id === rule.id ? (
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingRule(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleUpdateRule}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingRule(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteRule(rule.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No forwarding rules found. Add one to get started.
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

export default ForwardingRules;
