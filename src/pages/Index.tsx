
import React from "react";
import { Link } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import FeatureHighlights from "@/components/FeatureHighlights";
import ProductShowcase from "@/components/ProductShowcase";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="text-2xl font-bold">Telegram Content Processor</div>
        <div>
          {user ? (
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button>Login / Signup</Button>
            </Link>
          )}
        </div>
      </header>
      
      <HeroSection />
      <FeatureHighlights />
      <ProductShowcase />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
