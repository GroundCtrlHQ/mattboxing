'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mic, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface FeatureBubble {
  id: string;
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
  position: { top: string; left: string };
  color: string;
  gradient: string;
}

const features: FeatureBubble[] = [
  {
    id: 'voice',
    title: 'Voice Coach',
    description: 'Real-time voice coaching with Freya Mills',
    link: '/aivoice',
    icon: <Mic className="w-5 h-5" />,
    position: { top: '25%', left: '20%' },
    color: 'boxing-red',
    gradient: 'from-red-500 to-red-600'
  },
  {
    id: 'coach',
    title: 'AI Coach',
    description: 'Get your personalised training plan',
    link: '/coach',
    icon: <FileText className="w-5 h-5" />,
    position: { top: '55%', left: '75%' },
    color: 'champion-gold',
    gradient: 'from-yellow-400 to-yellow-500'
  },
  {
    id: 'chat',
    title: 'Chat',
    description: 'Text conversation with Matt',
    link: '/chat',
    icon: <MessageSquare className="w-5 h-5" />,
    position: { top: '80%', left: '30%' },
    color: 'blue-500',
    gradient: 'from-blue-500 to-blue-600'
  }
];

export function MattFeatureShowcase() {
  const [activeBubble, setActiveBubble] = useState<string | null>(null);

  return (
    <section className="container mx-auto px-4 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-white text-center">
          Explore Our Features
        </h3>
        
        <div className="relative w-full max-w-3xl mx-auto">
          {/* Matt's Image with White Background */}
          <div className="relative rounded-3xl overflow-hidden bg-white shadow-2xl border-4 border-gray-200">
            <Image
              src="/mattgoddard2.avif"
              alt="Matt Goddard - Boxing Coach"
              width={800}
              height={1000}
              className="w-full h-auto object-contain"
              priority
            />
            
            {/* Cute Feature Bubbles */}
            {features.map((feature) => (
              <div
                key={feature.id}
                className="absolute z-10"
                style={{
                  top: feature.position.top,
                  left: feature.position.left,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  onMouseEnter={() => setActiveBubble(feature.id)}
                  onMouseLeave={() => setActiveBubble(null)}
                  className="group relative"
                >
                  {/* Dot Bubble with Pulse - Black for top, White for bottom */}
                  <Link
                    href={feature.link}
                    className="relative block"
                  >
                    {/* Double size dot - black for voice (top), white for coach/chat (bottom) */}
                    {feature.id === 'voice' ? (
                      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black group-hover:scale-150 transition-transform duration-300 cursor-pointer animate-pulse shadow-lg">
                        {/* Outer ring for visibility on white */}
                        <div className="absolute -inset-1 rounded-full border border-black/20"></div>
                      </div>
                    ) : (
                      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white group-hover:scale-150 transition-transform duration-300 cursor-pointer animate-pulse shadow-lg border-2 border-gray-300">
                        {/* Outer ring for visibility on black */}
                        <div className="absolute -inset-1 rounded-full border border-white/30"></div>
                      </div>
                    )}
                  </Link>
                  
                  {/* Glassmorphic Card on Hover */}
                  {activeBubble === feature.id && (
                    <div 
                      className="absolute z-50"
                      style={{
                        top: 'calc(100% + 16px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <div className="relative w-72 sm:w-80">
                        {/* Glassmorphic Card with better text visibility */}
                        <div className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                          {/* Gradient Border Effect */}
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-30 -z-10 blur-xl`}></div>
                          
                          <div className="flex items-start gap-4 relative z-10">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                              <div className="text-white">
                                {feature.icon}
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold text-xl mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {feature.title}
                              </h4>
                              <p className="text-gray-100 text-sm mb-4 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                {feature.description}
                              </p>
                              
                              {/* CTA */}
                              <Link
                                href={feature.link}
                                className={`inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r ${feature.gradient} hover:shadow-lg transition-all duration-300 group/btn`}
                              >
                                Explore
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                              </Link>
                            </div>
                          </div>
                        </div>
                        
                        {/* Arrow Pointer */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-black/80 backdrop-blur-xl border-l border-t border-white/30 rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

