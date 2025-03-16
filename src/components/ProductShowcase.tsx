
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProductShowcaseProps {
  className?: string;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ className }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const elements = useRef<HTMLDivElement[]>([]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const currentElements = elements.current;
    
    currentElements.forEach((el) => {
      observer.observe(el);
    });
    
    return () => {
      currentElements.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, []);
  
  const addToRefs = (el: HTMLDivElement) => {
    if (el && !elements.current.includes(el)) {
      elements.current.push(el);
    }
  };
  
  return (
    <section
      ref={sectionRef}
      className={cn("py-24 bg-white dark:bg-black", className)}
    >
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="feature-chip mb-4">Our Products</span>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-6">
            Designed for Everyone
          </h2>
          <p className="text-lg text-foreground/80">
            Discover our range of innovative products designed to enhance your everyday experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Premium Experience",
              description: "Crafted with attention to every detail for maximum comfort and usability.",
              imageUrl: "https://images.unsplash.com/photo-1605464315542-bda3e2f4e605?auto=format&fit=crop&q=80&w=880&ixlib=rb-4.0.3",
              delay: 0
            },
            {
              title: "Innovative Design",
              description: "Pushing boundaries with thoughtful design that anticipates your needs.",
              imageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&q=80&w=1021&ixlib=rb-4.0.3",
              delay: 0.2
            },
            {
              title: "Seamless Integration",
              description: "Works perfectly with your existing ecosystem for a unified experience.",
              imageUrl: "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&q=80&w=1170&ixlib=rb-4.0.3",
              delay: 0.4
            }
          ].map((product, i) => (
            <div
              key={i}
              ref={addToRefs}
              className="animate-on-scroll neo-morph overflow-hidden transition-all duration-300 hover:shadow-elevation transform hover:-translate-y-1"
              style={{ transitionDelay: `${product.delay}s` }}
            >
              <div className="blur-load h-60 bg-gray-100 overflow-hidden">
                <img 
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                  onLoad={(e) => {
                    e.currentTarget.parentElement?.classList.add('loaded');
                  }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium mb-2">{product.title}</h3>
                <p className="text-foreground/70">{product.description}</p>
                <button className="mt-4 text-primary font-medium flex items-center gap-1 transition-colors hover:text-primary/80">
                  Learn more
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path 
                      d="M6 12L10 8L6 4" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
