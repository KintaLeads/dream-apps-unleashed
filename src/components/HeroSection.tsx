
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ className }) => {
  const [scrollY, setScrollY] = useState(0);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Handle parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollY(position);
      
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translateY(${position * 0.3}px)`;
      }
      
      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${position * 0.1}px)`;
        contentRef.current.style.opacity = `${1 - position / 700}`;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <section 
      className={cn("relative min-h-screen flex items-center justify-center overflow-hidden", className)}
    >
      <div 
        ref={parallaxRef} 
        className="parallax-bg bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-black"
      />
      
      <div 
        ref={contentRef}
        className="container relative z-10 px-4 flex flex-col items-center justify-center py-24 text-center"
      >
        <span className="feature-chip mb-4 animate-slide-down">
          Introducing
        </span>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-6 animate-blur-in" style={{ animationDelay: '0.1s' }}>
          Design Meets Innovation
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-foreground/80 mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          A perfect balance of form and function, crafted with attention to every detail 
          to create extraordinary experiences.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <button className="apple-button">
            Explore Features
          </button>
          
          <button className="px-5 py-2.5 rounded-full bg-secondary text-foreground font-medium 
           transition-all duration-300 hover:bg-secondary/80 active:scale-[0.98]">
            Learn More
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-foreground/50"
        >
          <path 
            d="M7 10L12 15L17 10" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
