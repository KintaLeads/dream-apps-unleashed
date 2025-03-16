
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type ApiCredential = {
  id: string;
  api_name: string;
  api_key: string;
  api_secret: string | null;
  nickname: string | null;
};

const Settings = () => {
  const [isAddingCredential, setIsAddingCredential] = useState(false);

  const { data: apiCredentials, isLoading, error, refetch } = useQuery({
    queryKey: ['api-credentials'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_credentials').select('*');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as ApiCredential[];
    }
  });

  const form = useForm({
    defaultValues: {
      nickname: '',
      api_name: 'telegram',
      api_key: '',
      api_secret: '',
    }
  });

  const onSubmit = async (values: any) => {
    try {
      const { error } = await supabase.from('api_credentials').insert([{
        api_name: values.api_name,
        api_key: values.api_key,
        api_secret: values.api_secret,
        nickname: values.nickname,
      }]);

      if (error) throw error;

      toast.success('API credentials added successfully');
      form.reset();
      setIsAddingCredential(false);
      refetch();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="space-y-8">
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
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              Error loading credentials. Please try again.
            </div>
          ) : apiCredentials && apiCredentials.length > 0 ? (
            <div className="space-y-4">
              {apiCredentials.map((credential) => (
                <Card key={credential.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{credential.nickname || 'Unnamed Credential'}</h3>
                      <p className="text-sm text-muted-foreground">{credential.api_name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Delete</Button>
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
    </div>
  );
};

export default Settings;
