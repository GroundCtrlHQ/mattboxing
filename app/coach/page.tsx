import Link from 'next/link';
import { CoachingForm } from '@/components/CoachingForm';

export default function CoachPage() {
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
              <Link href="/coach" className="text-white font-semibold text-sm md:text-base">AI Coach</Link>
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-white text-center">
            AI Boxing Coach
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 text-center">
            Get personalized coaching from Matt Goddard based on your needs
          </p>
        </div>
      </section>

      {/* Coaching Form */}
      <section className="container mx-auto px-4 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto">
          <CoachingForm />
        </div>
      </section>
    </main>
  );
}

