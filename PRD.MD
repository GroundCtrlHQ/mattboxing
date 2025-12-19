POC Project Brief: Boxing Coach AI (The Boxing Locker)1. Vision & Core ValueAn AI version of Matt Goddard (The Boxing Locker). This application serves as a high-fidelity "Digital Twin" of Matt, utilizing his 20+ years of ring experience and his library of 600+ technical videos to provide guided, form-driven coaching. It bridges the gap between his free social content and his premium TBL Training Plans and Skool Community.2. The 80/20 Feature Set (POC Scope)The Boxing Locker Visual Identity: A "Gym Dark" UI using Matt's specific palette: Charcoal Black (#0A0A0A), Boxing Red (#DC2626), and Champion Gold (#F59E0B) for premium/action cues.Guided Onboarding: Profile setup (Stance, Weight, Experience, Goals) stored in a serverless Neon DB.Form-Based Coaching (The Core): Logic-gated inquiries that mirror Matt's assessment process:Phase 1: Selection (Technique vs. Tactics vs. Training vs. Mindset).Phase 2: Granular Detail (e.g., Jab Variations -> Power vs. Speed vs. Range).Phase 3: Contextual Constraints (Gym vs. Home, Equipment availability)."Neural-Link" Video Integration (High Value):Deep Linking: AI doesn't just suggest a video; it identifies the specific timestamp (e.g., "See the hip rotation at 2:45") and embeds the YouTube player at that exact start time.Video Preview: A dedicated "Watch Matt Demonstrate" section within the AI response.AI Response Engine (OpenRouter): Powered by claude-3-5-sonnet to deliver Matt's technical voice—focusing on biomechanics and his signature "Value of Looks" philosophy.3. Tech StackFrontend: Next.js (App Router), Tailwind CSS, Lucide Icons, Shadcn UI.Database: Neon (PostgreSQL) — for profile persistence and session history.AI: OpenRouter (Model: anthropic/claude-3-5-sonnet) with a "Video Mapping" layer.Video: YouTube IFrame API (for timestamp-aware embedding).4. Database Schema (Neon)Table User {
  id String [pk]
  email String
  subscriptionTier String // Free/Pro/Elite
}

Table Profile {
  userId String [ref: > User.id]
  name String
  stance String // Orthodox/Southpaw/Switch
  experience String // Beginner/Intermediate/Pro
  weightKg Int
  heightCm Int
}

Table CoachingSession {
  id String [pk]
  userId String [ref: > User.id]
  category String // Technique/Tactics/Training
  formData Json // The specific inputs from the form
  aiResponse Text
  mappedVideoId String // YouTube ID
  mappedTimestamp Int // Seconds to start at
  createdAt DateTime
}
5. Implementation DetailsA. The "Neural-Link" LogicTo make this work in a POC without a massive search engine:We create a "Gold Standard" mapping file (JSON) of Matt's top 20 videos.Each video is tagged with topic, subtopic, and key_timestamps.The AI is instructed: "If the user asks about [X], recommend Video ID [Y] and mention the insight at timestamp [Z]."B. The "Matt Goddard" AI Prompt (OpenRouter)System Instructions:You are Matt Goddard, "The Boxing Locker" (7-0 Pro, National Champ).Voice: British, direct, technical, "no-nonsense" yet highly motivational.Philosophy: Focus on the "Five Boxing Philosophies": Brain, Legs, Hands, Heart, and Ego.Key Instruction: Whenever you recommend a technical fix, you MUST provide a "Video Visual" reference. Tell them exactly which part of the embedded video to watch to see the mechanic in action.C. UI/UX Style GuideAesthetic: "Premium Performance." Bold sans-serif typography (Inter/Impact style).Layout: The AI response appears on the left (or top on mobile), and the YouTube player slides in or appears below it once the "Demonstration" is mentioned.6. Success Criteria for Demo[ ] Stance Awareness: AI adjusts technical breakdown (e.g., "For you as a Southpaw...")[ ] Video Injection: A YouTube player appears automatically with the correct video ID based on the user's form selection.[ ] The "Aha" Moment: The AI refers to a specific time in the video that solves the user's exact form problem (e.g., "Notice how my rear heel lifts at 1:15...").