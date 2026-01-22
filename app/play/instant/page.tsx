"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Sparkles, Zap, Languages } from "lucide-react"

export default function InstantPlayPage() {
  const router = useRouter()
  const [lang, setLang] = useState<"en" | "bn">("en")

  const translations = {
    en: {
      title: "How to Play",
      steps: [
        {
          title: "Find the Missing Letter",
          desc: "Look at the word with a blank space and select the correct missing letter",
        },
        {
          title: "Choose From 4 Options",
          desc: "Tap one of the four letter choices to fill in the blank",
        },
        {
          title: "Earn Points & See Fireworks!",
          desc: "Get 10 points for each correct answer and enjoy celebration animations",
        },
      ],
      modeTitle: "Playing in Easy Mode",
      modeDesc: "You'll solve 5 word puzzles. Sign up to unlock Medium and Hard modes with timers!",
      startGame: "Start Game",
      backHome: "Back to Home",
    },
    bn: {
      title: "কীভাবে খেলবেন",
      steps: [
        {
          title: "হারানো অক্ষর খুঁজুন",
          desc: "খালি জায়গা সহ শব্দটি দেখুন এবং সঠিক হারানো অক্ষরটি নির্বাচন করুন",
        },
        {
          title: "৪টি অপশন থেকে বেছে নিন",
          desc: "খালি স্থান পূরণ করতে চারটি অক্ষরের পছন্দগুলির মধ্যে একটিতে ট্যাপ করুন",
        },
        {
          title: "পয়েন্ট অর্জন করুন এবং আতশবাজি দেখুন!",
          desc: "প্রতিটি সঠিক উত্তরের জন্য ১০ পয়েন্ট পান এবং উদযাপন অ্যানিমেশন উপভোগ করুন",
        },
      ],
      modeTitle: "সহজ মোডে খেলছেন",
      modeDesc: "আপনি ৫টি শব্দ ধাঁধা সমাধান করবেন। টাইমার সহ মাধ্যম এবং কঠিন মোড আনলক করতে সাইন আপ করুন!",
      startGame: "খেলা শুরু করুন",
      backHome: "হোমে ফিরে যান",
    },
  }

  const t = translations[lang]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="max-w-2xl w-full bg-white/10 backdrop-blur-md border-white/20 text-white relative">
            <div className="absolute top-4 right-4 z-10">
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => setLang(lang === "en" ? "bn" : "en")}
                >
                    <Languages className="mr-2 h-4 w-4" />
                    {lang === "en" ? "বাংলা" : "English"}
                </Button>
            </div>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">{t.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {t.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        index === 0 ? "bg-indigo-500/30" : index === 1 ? "bg-purple-500/30" : "bg-pink-500/30"
                    }`}>
                    <span className="text-lg font-bold">{index + 1}</span>
                    </div>
                    <div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-300">
                        {step.desc}
                    </p>
                    </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4 rounded-lg border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <h3 className="font-semibold">{t.modeTitle}</h3>
              </div>
              <p className="text-sm text-gray-300">
                {t.modeDesc}
              </p>
            </div>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={() => router.push("/play/demo")}
            >
              <Zap className="mr-2 h-5 w-5" />
              {t.startGame}
            </Button>

            <Button variant="ghost" className="w-full text-gray-400 hover:text-white" onClick={() => router.push("/")}>
              {t.backHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
