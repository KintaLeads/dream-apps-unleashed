import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ApiCredential = {
  id: string;
  api_name: string;
  api_key: string;
  api_secret: string | null;
  nickname: string | null;
  session_data: string | null;
  status: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
  api_type?: string | null;
};

const credentialsFormSchema = z.object({
  nickname: z.string().optional(),
  api_name: z.string().default("telegram"),
  api_key: z.string().min(1, "API ID is required"),
  api_secret: z.string().min(1, "API Hash is required"),
});

const phoneFormSchema = z.object({
  phone_number: z.string().min(1, "Phone number is required"),
});

const verificationFormSchema = z.object({
  verification_code: z.string().min(1, "Verification code is required"),
});

interface SettingsProps {
  bypassMode?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ bypassMode = false }) => {
  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentCredential, setCurrentCredential] = useState<ApiCredential | null>(null);
  const [connectionState, setConnectionState] = useState<{
    phoneCodeHash?: string;
    sessionString?: string;
    phoneNumber?: string;
  }>({});
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [demoCredentials, setDemoCredentials] = useState<ApiCredential[]>([]);

  const { data: apiCredentials, isLoading, error, refetch } = useQuery({
    queryKey: ['api-credentials'],
    queryFn: async () => {
      if (bypassMode) {
        return demoCredentials;
      }
      
      const { data, error } = await supabase.from('api_credentials').select('*');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as ApiCredential[];
    },
    enabled: !bypassMode || demoCredentials.length > 0,
  });

  const form = useForm({
    resolver: zodResolver(credentialsFormSchema),
    defaultValues: {
      nickname: '',
      api_name: 'telegram',
      api_key: '',
      api_secret: '',
    }
  });

  const phoneForm = useForm({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phone_number: '',
    }
  });

  const verificationForm = useForm({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      verification_code: '',
    }
  });

  const onSubmit = async (values: any) => {
    try {
      const newCredential = {
        id: crypto.randomUUID(),
        api_name: values.api_name,
        api_key: values.api_key,
        api_secret: values.api_secret,
        nickname: values.nickname || `Telegram Account ${new Date().toLocaleDateString()}`,
        status: 'pending',
        session_data: null,
        created_at: new Date().toISOString(),
      };
      
      if (bypassMode) {
        setDemoCredentials([...demoCredentials, newCredential]);
        toast.success('API credentials added successfully (Demo Mode)');
      } else {
        const { error } = await supabase.from('api_credentials').insert([{
          api_name: values.api_name,
          api_key: values.api_key,
          api_secret: values.api_secret,
          nickname: values.nickname || `Telegram Account ${new Date().toLocaleDateString()}`,
          status: 'pending',
        }]);

        if (error) throw error;
        toast.success('API credentials added successfully');
      }
      
      form.reset();
      setIsAddingCredential(false);
      refetch();
    } catch (error: any) {
      if (error.message?.includes("row-level security")) {
        toast.error("Error adding credentials due to security restrictions. Please implement authentication for production use.");
      } else {
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  const handleConnect = async (credential: ApiCredential) => {
    setCurrentCredential(credential);
    setShowPhoneDialog(true);
  };

  const initiateConnection = async (values: any) => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      
      if (bypassMode) {
        setTimeout(() => {
          setConnectionState({
            phoneCodeHash: "demo_hash_123",
            sessionString: "demo_session_string",
            phoneNumber: values.phone_number,
          });
          setShowPhoneDialog(false);
          setShowVerificationDialog(true);
          toast.success('Verification code sent to your phone (Demo Mode)');
          setConnectionStatus('verification_needed');
        }, 1500);
        return;
      }
      
      const response = await fetch(`${window.location.origin}/functions/v1/telegram-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiId: currentCredential?.api_key,
          apiHash: currentCredential?.api_secret,
          phoneNumber: values.phone_number,
          sessionString: currentCredential?.session_data || '',
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      if (result.action === 'code_requested') {
        setConnectionState({
          phoneCodeHash: result.phoneCodeHash,
          sessionString: result.sessionString,
          phoneNumber: values.phone_number,
        });
        setShowPhoneDialog(false);
        setShowVerificationDialog(true);
        toast.success('Verification code sent to your phone');
        setConnectionStatus('verification_needed');
      } else if (result.action === 'session_valid') {
        await updateSessionInDb(result.sessionString, 'connected');
        setShowPhoneDialog(false);
        toast.success('Connected to Telegram successfully');
        setConnectionStatus('connected');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(`Connection error: ${error.message}`);
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const verifyCode = async (values: any) => {
    try {
      setIsVerifying(true);
      setConnectionStatus('verifying');
      
      if (bypassMode) {
        setTimeout(async () => {
          await updateSessionInDb("demo_session_updated", 'connected');
          setShowVerificationDialog(false);
          toast.success('Successfully authenticated with Telegram (Demo Mode)');
          setConnectionStatus('connected');
          setIsVerifying(false);
        }, 1500);
        return;
      }
      
      const response = await fetch(`${window.location.origin}/functions/v1/telegram-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiId: currentCredential?.api_key,
          apiHash: currentCredential?.api_secret,
          phoneNumber: connectionState.phoneNumber,
          phoneCodeHash: connectionState.phoneCodeHash,
          verificationCode: values.verification_code,
          sessionString: connectionState.sessionString,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      await updateSessionInDb(result.sessionString, 'connected');
      
      setShowVerificationDialog(false);
      toast.success('Successfully authenticated with Telegram');
      setConnectionStatus('connected');
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(`Verification error: ${error.message}`);
      setConnectionStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const updateSessionInDb = async (sessionString: string, status: string) => {
    if (!currentCredential) return;
    
    try {
      if (bypassMode) {
        setDemoCredentials(demoCredentials.map(cred => 
          cred.id === currentCredential.id 
            ? { ...cred, session_data: sessionString, status: status } 
            : cred
        ));
      } else {
        const { error } = await supabase
          .from('api_credentials')
          .update({ 
            session_data: sessionString,
            status: status,
          })
          .eq('id', currentCredential.id);
        
        if (error) throw error;
      }
      
      refetch();
    } catch (error: any) {
      console.error('Database update error:', error);
      if (bypassMode) {
        toast.warning(`Demo mode: Changes would be persisted in a real database.`);
      } else {
        toast.error(`Error updating session data: ${error.message}`);
      }
    }
  };

  const testConnection = async (credential: ApiCredential) => {
    try {
      setCurrentCredential(credential);
      setConnectionStatus('testing');
      
      if (bypassMode) {
        setTimeout(async () => {
          toast.success(`Successfully retrieved 5 channels (Demo Mode)`);
          setConnectionStatus('connected');
        }, 1500);
        return;
      }
      
      const response = await fetch(`${window.location.origin}/functions/v1/telegram-fetch-channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiId: credential.api_key,
          apiHash: credential.api_secret,
          sessionString: credential.session_data,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      if (result.sessionString !== credential.session_data) {
        await updateSessionInDb(result.sessionString, 'connected');
      }
      
      toast.success(`Successfully retrieved ${result.channels.length} channels`);
      setConnectionStatus('connected');
    } catch (error: any) {
      console.error('Test connection error:', error);
      toast.error(`Connection test failed: ${error.message}`);
      setConnectionStatus('error');
      
      await updateSessionInDb(credential.session_data || '', 'error');
    }
  };

  const deleteCredential = async (credentialId: string) => {
    try {
      if (bypassMode) {
        setDemoCredentials(demoCredentials.filter(cred => cred.id !== credentialId));
        toast.success('Credential deleted successfully (Demo Mode)');
      } else {
        const { error } = await supabase
          .from('api_credentials')
          .delete()
          .eq('id', credentialId);
        
        if (error) throw error;
        toast.success('Credential deleted successfully');
      }
      
      refetch();
    } catch (error: any) {
      toast.error(`Error deleting credential: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'connected':
        return <Badge variant="outline" className="bg-green-500 text-white">Connected</Badge>;
      case 'pending':
        return <Badge variant="secondary">Not Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  useEffect(() => {
    if (!showPhoneDialog && !showVerificationDialog) {
      setConnectionState({});
    }
  }, [showPhoneDialog, showVerificationDialog]);

  return (
    <div className="space-y-8">
      {bypassMode && (
        <Alert className="mb-6 border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800">Demo Mode Active</AlertTitle>
          <AlertDescription className="text-amber-700">
            You're running in demo mode without database persistence.
            Your changes will be stored in memory only for this session.
            For production use, please implement authentication.
          </AlertDescription>
        </Alert>
      )}
    
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Manage your API credentials for Telegram integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading credentials...</div>
          ) : error && !bypassMode ? (
            <div className="text-center py-4 text-red-500">
              Error loading credentials. Please try again.
            </div>
          ) : apiCredentials && apiCredentials.length > 0 ? (
            <div className="space-y-4">
              {apiCredentials.map((credential) => (
                <Card key={credential.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <h3 className="font-medium">{credential.nickname || 'Unnamed Credential'}</h3>
                        <div className="ml-2">
                          {getStatusBadge(credential.status)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{credential.api_name}</p>
                    </div>
                    <div className="flex space-x-2">
                      {credential.status === 'connected' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => testConnection(credential)}
                          disabled={connectionStatus === 'testing'}
                        >
                          {connectionStatus === 'testing' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testing
                            </>
                          ) : 'Test Connection'}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConnect(credential)}
                          disabled={isConnecting}
                        >
                          {isConnecting && currentCredential?.id === credential.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting
                            </>
                          ) : 'Connect'}
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteCredential(credential.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No API credentials found.</p>
              <p className="mb-4">Add your Telegram API credentials to start using the application.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Sheet open={isAddingCredential} onOpenChange={setIsAddingCredential}>
            <SheetTrigger asChild>
              <Button>Add API Credentials</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add API Credentials</SheetTitle>
                <SheetDescription>
                  Enter your Telegram API credentials to connect to the Telegram API
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nickname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nickname (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="My Telegram Account" {...field} />
                          </FormControl>
                          <FormDescription>
                            A friendly name to identify this API credential
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="api_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Type</FormLabel>
                          <FormControl>
                            <Input value="telegram" disabled {...field} />
                          </FormControl>
                          <FormDescription>
                            The type of API (currently only Telegram is supported)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="api_key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API ID</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your Telegram API ID from my.telegram.org
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="api_secret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Hash</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="your-api-hash" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your Telegram API Hash from my.telegram.org
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddingCredential(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Save Credentials</Button>
                    </div>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Help & Documentation</CardTitle>
          <CardDescription>
            Learn how to obtain and use Telegram API credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">How to get your Telegram API credentials</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Visit <a href="https://my.telegram.org/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">my.telegram.org</a></li>
                <li>Log in with your Telegram account</li>
                <li>Click on "API development tools"</li>
                <li>Fill in the required information (app title, short name, etc.)</li>
                <li>Your API ID and Hash will be generated</li>
                <li>Enter these credentials in the settings above</li>
              </ol>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Connection Process</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Add your API ID and Hash in the credentials section</li>
                <li>Click "Connect" on your credential to start the authentication process</li>
                <li>Enter your phone number (with country code, e.g., +1234567890)</li>
                <li>Receive a verification code via Telegram and enter it when prompted</li>
                <li>Once connected, you can test the connection to ensure it's working correctly</li>
              </ol>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Important Notes</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Keep your API credentials secure and do not share them</li>
                <li>Using Telegram API to mass-forward messages may be against Telegram's Terms of Service</li>
                <li>Use this tool responsibly and in accordance with Telegram's policies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to Telegram</DialogTitle>
            <DialogDescription>
              Enter your phone number to start the authentication process
            </DialogDescription>
          </DialogHeader>
          
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(initiateConnection)} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter your phone number with country code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPhoneDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : 'Connect'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Telegram Code</DialogTitle>
            <DialogDescription>
              Enter the verification code sent to your Telegram account
            </DialogDescription>
          </DialogHeader>
          
          <Form {...verificationForm}>
            <form onSubmit={verificationForm.handleSubmit(verifyCode)} className="space-y-4">
              <FormField
                control={verificationForm.control}
                name="verification_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the 5-digit code sent to your Telegram app
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700">Check your Telegram app</AlertTitle>
                <AlertDescription className="text-blue-600">
                  The verification code has been sent to the Telegram app on your device
                </AlertDescription>
              </Alert>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowVerificationDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : 'Verify'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
