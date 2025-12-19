import Link from 'next/link';
import { Trophy, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
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
              <Link href="/coach" className="text-gray-300 hover:text-white text-sm md:text-base">AI Coach</Link>
              <Link href="/about" className="text-white font-semibold text-sm md:text-base">About Matt</Link>
            </nav>
            {/* Mobile menu */}
            <div className="sm:hidden flex gap-2">
              <Link href="/" className="text-gray-300 hover:text-white text-sm">Home</Link>
              <Link href="/videos" className="text-gray-300 hover:text-white text-sm">Videos</Link>
              <Link href="/coach" className="text-gray-300 hover:text-white text-sm">Coach</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero - Mobile First */}
      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
            About <span className="text-boxing-red">Matt Goddard</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12">
            "The Boxing Locker" - 7-0 Pro, National Champion
          </p>
        </div>
      </section>

      {/* Bio - Mobile First */}
      <section className="container mx-auto px-4 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl mb-3 sm:mb-4">20+ Years of Ring Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-300 text-base sm:text-lg">
                  Matt Goddard brings over two decades of professional boxing experience to every 
                  training session. With an undefeated 7-0 professional record and a National 
                  Championship title, Matt has dedicated his career to mastering the art and science 
                  of boxing.
                </p>
                <p className="text-gray-300 text-base sm:text-lg">
                  His approach combines technical precision with practical wisdom, focusing on 
                  biomechanics and what he calls the "Value of Looks" - understanding that proper 
                  form isn't just about aesthetics, but about efficiency, power, and injury prevention.
                </p>
                <p className="text-gray-300 text-base sm:text-lg">
                  Through The Boxing Locker, Matt shares his extensive knowledge through 600+ 
                  technical videos, bridging the gap between free social content and premium 
                  training programs.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Achievements - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardHeader>
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-champion-gold mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">7-0 Professional Record</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Undefeated professional boxing career
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-champion-gold mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">National Champion</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Achieved National Championship status
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Separator className="bg-gray-800 my-6 sm:my-8" />

          {/* Philosophy - Mobile First */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl mb-4 sm:mb-6">The Five Boxing Philosophies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {[
                  { name: 'Brain', desc: 'Strategic thinking and fight IQ' },
                  { name: 'Legs', desc: 'Footwork, movement, and positioning' },
                  { name: 'Hands', desc: 'Technique, speed, and power' },
                  { name: 'Heart', desc: 'Courage, determination, and will' },
                  { name: 'Ego', desc: 'Confidence balanced with humility' },
                ].map((philosophy) => (
                  <div key={philosophy.name} className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-boxing-red flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm sm:text-base">{philosophy.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold mb-1 text-white">{philosophy.name}</h3>
                      <p className="text-sm sm:text-base text-gray-400">{philosophy.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA - Mobile First */}
          <div className="mt-8 sm:mt-12 text-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/videos">Explore Video Library</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
