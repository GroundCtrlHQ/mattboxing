import Link from 'next/link';
import { Play, Award, Target, MessageSquare, Mic, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MattFeatureShowcase } from '@/components/MattFeatureShowcase';

export default function Home() {
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
              <Link href="/aivoice" className="text-gray-300 hover:text-white text-sm md:text-base">Voice</Link>
              <Link href="/coach" className="text-gray-300 hover:text-white text-sm md:text-base">Coach</Link>
              <Link href="/chat" className="text-gray-300 hover:text-white text-sm md:text-base">Chat</Link>
              <Link href="/about" className="text-gray-300 hover:text-white text-sm md:text-base">About</Link>
            </nav>
            {/* Mobile menu button - can be enhanced with Sheet component later */}
            <div className="sm:hidden flex gap-2">
              <Link href="/videos" className="text-gray-300 hover:text-white text-sm">Videos</Link>
              <Link href="/aivoice" className="text-gray-300 hover:text-white text-sm">Voice</Link>
              <Link href="/coach" className="text-gray-300 hover:text-white text-sm">Coach</Link>
              <Link href="/chat" className="text-gray-300 hover:text-white text-sm">Chat</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile First */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
            Train with <span className="text-boxing-red">Matt Goddard</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-12 sm:mb-16 px-2">
            7-0 Pro, National Champion. 20+ years of ring experience.
          </p>
        </div>
      </section>

      {/* Interactive Feature Showcase */}
      <MattFeatureShowcase />

      {/* Main Features - 3 Prominent Cards */}
      <section className="container mx-auto px-4 pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Voice Coach Card */}
            <Link href="/aivoice" className="group">
              <Card className="h-full bg-gradient-to-br from-boxing-red/10 to-transparent border-boxing-red/30 hover:border-boxing-red hover:shadow-2xl hover:shadow-boxing-red/20 transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-boxing-red/20 flex items-center justify-center group-hover:bg-boxing-red/30 transition-colors">
                    <Mic className="w-8 h-8 text-boxing-red" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-white mb-2">Voice Coach</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    Real-time voice coaching with Freya Mills
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button className="bg-boxing-red hover:bg-red-700 text-white w-full">
                    Start Voice Session
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* AI Coach Card */}
            <Link href="/coach" className="group">
              <Card className="h-full bg-gradient-to-br from-champion-gold/10 to-transparent border-champion-gold/30 hover:border-champion-gold hover:shadow-2xl hover:shadow-champion-gold/20 transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-champion-gold/20 flex items-center justify-center group-hover:bg-champion-gold/30 transition-colors">
                    <FileText className="w-8 h-8 text-champion-gold" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-white mb-2">AI Coach</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    Get your personalised training plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button className="bg-champion-gold hover:bg-yellow-500 text-charcoal font-bold w-full">
                    Create Plan
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Chat Card */}
            <Link href="/chat" className="group">
              <Card className="h-full bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <MessageSquare className="w-8 h-8 text-blue-400" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-white mb-2">Chat</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    Text conversation with Matt
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full">
                    Start Chat
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Features - Mobile First */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Play className="w-10 h-10 sm:w-12 sm:h-12 text-boxing-red mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">600+ Videos</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Comprehensive library covering techniques, tactics, training, and mindset
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Award className="w-10 h-10 sm:w-12 sm:h-12 text-champion-gold mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Pro Experience</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                7-0 professional record and National Championship expertise
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader>
              <Target className="w-10 h-10 sm:w-12 sm:h-12 text-boxing-red mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">Form-Driven</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Focus on biomechanics and the "Value of Looks" philosophy
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Separator className="bg-gray-800" />

      {/* Stats - Mobile First */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-white px-2">
            The Five Boxing Philosophies
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {['Brain', 'Legs', 'Hands', 'Heart', 'Ego'].map((philosophy) => (
              <Card key={philosophy} className="py-3 sm:py-4">
                <CardContent className="p-0">
                  <p className="text-base sm:text-lg font-semibold text-champion-gold">{philosophy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
