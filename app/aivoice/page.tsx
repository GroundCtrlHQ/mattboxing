import Link from 'next/link';
import { VoiceCoachInterface } from '@/components/VoiceCoachInterface';

export default function AIVoicePage() {
  return (
    <main className="min-h-screen bg-charcoal">
      {/* Header - Mobile First */}
      <header className="border-b border-gray-800 sticky top-0 bg-charcoal z-50">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-boxing-red">
              The Boxing Locker
            </Link>
            <nav className="hidden sm:flex gap-4 md:gap-6">
              <Link href="/" className="text-gray-300 hover:text-white text-sm md:text-base">Home</Link>
              <Link href="/videos" className="text-gray-300 hover:text-white text-sm md:text-base">Videos</Link>
              <Link href="/about" className="text-gray-300 hover:text-white text-sm md:text-base">About Matt</Link>
              <Link href="/coach" className="text-gray-300 hover:text-white text-sm md:text-base">AI Coach</Link>
              <Link href="/aivoice" className="text-white font-semibold text-sm md:text-base">Voice Coach</Link>
            </nav>
            {/* Mobile menu */}
            <div className="sm:hidden flex gap-2">
              <Link href="/videos" className="text-gray-300 hover:text-white text-sm">Videos</Link>
              <Link href="/about" className="text-gray-300 hover:text-white text-sm">About</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Page Header - Mobile First */}
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-4 mb-6">
            {/* Freya's Image - Circular Bubble */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-boxing-red shadow-2xl bg-gradient-to-br from-boxing-red/20 to-transparent p-1">
                <img 
                  src="/Freya.png" 
                  alt="Freya Mills - Boxing Coach" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {/* Decorative ring */}
              <div className="absolute -inset-2 rounded-full border-2 border-boxing-red/30 animate-pulse"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-white text-center">
              Voice Coaching with Freya Mills
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 text-center">
              Have a real-time conversation with Freya's AI coach and get a personalised training plan
            </p>
          </div>
        </div>
      </section>

      {/* Voice Coach Interface */}
      <section className="container mx-auto px-4 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto">
          <VoiceCoachInterface />
        </div>
      </section>
    </main>
  );
}

