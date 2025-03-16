
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const authFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const Auth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/dashboard');
      }
    };
    
    checkSession();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);
  
  const form = useForm({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });
  
  const handleSubmit = async (values: z.infer<typeof authFormSchema>) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      let authResponse;
      
      if (activeTab === "login") {
        // Log in
        authResponse = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
      } else {
        // Sign up
        authResponse = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });
      }
      
      const { error } = authResponse;
      
      if (error) {
        throw error;
      }
      
      if (activeTab === "signup") {
        // For signup, we'll let the auth state change redirect the user
        toast.success("Account created successfully! You can now log in.");
        setActiveTab("login");
      } else {
        // For login, we'll let the auth state change redirect the user
        toast.success("Logged in successfully!");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      let errorMessage = "An unexpected error occurred";
      
      // Handle common auth errors with user-friendly messages
      if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please check your email to confirm your account before logging in";
      } else if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password";
      } else if (error.message.includes("already registered")) {
        errorMessage = "This email is already registered. Please log in instead";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {activeTab === "login" ? "Log in to your account" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-center">
            {activeTab === "login" 
              ? "Enter your credentials to access your dashboard" 
              : "Enter your details to create a new account"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Signup</TabsTrigger>
            </TabsList>
            
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="example@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>
                        {activeTab === "signup" && "Password must be at least 6 characters"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading 
                    ? (activeTab === "login" ? "Logging in..." : "Signing up...") 
                    : (activeTab === "login" ? "Log in" : "Sign up")}
                </Button>
              </form>
            </Form>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground mt-2">
            {activeTab === "login" 
              ? "Don't have an account? Click Signup above" 
              : "Already have an account? Click Login above"}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
