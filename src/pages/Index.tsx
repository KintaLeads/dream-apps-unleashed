
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import HeroSection from '@/components/HeroSection';
import ProductShowcase from '@/components/ProductShowcase';
import FeatureHighlights from '@/components/FeatureHighlights';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

const Index: React.FC = () => {
  // Initialize animation observers for scroll animations
  useEffect(() => {
    const handleScroll = () => {
      const animatedElements = document.querySelectorAll('.animate-on-scroll');
      
      animatedElements.forEach((element) => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight * 0.85) {
          element.classList.add('visible');
        }
      });
    };
    
    // Initial check for elements in viewport
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Set page title
  useEffect(() => {
    document.title = "Telegram Content Processor | Process and Forward Messages";
  }, []);
  
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="fixed top-4 right-4 z-50">
        <Link to="/dashboard">
          <Button>
            Open Dashboard
          </Button>
        </Link>
      </div>
      <HeroSection />
      <ProductShowcase />
      <FeatureHighlights />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
