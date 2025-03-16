
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface NewsletterProps {
  className?: string;
}

export const Newsletter: React.FC<NewsletterProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Thank you for subscribing to our newsletter!",
      });
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };
  
  return (
    <section className={cn("py-24 bg-white dark:bg-black relative overflow-hidden", className)}>
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/50 dark:to-blue-950/10 z-0"
        aria-hidden="true"
      />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto glass-morph rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <span className="feature-chip mb-4">Stay Updated</span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-6">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-lg text-foreground/80">
              Get the latest updates, news, and special offers delivered directly to your inbox.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 rounded-full px-5 py-3 border border-border bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "apple-button whitespace-nowrap",
                  isSubmitting && "opacity-70 cursor-not-allowed"
                )}
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
            
            <p className="text-xs text-center mt-4 text-foreground/60">
              By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
