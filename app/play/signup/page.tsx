"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { ArrowLeft, Sparkles } from "lucide-react"

export default function SignupPage() {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "https://puzzleword.vercel.app/play/dashboard",
        },
      })

      if (error) throw error

      setStep("otp")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      })

      if (error) throw error

      if (password) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        })
        if (updateError) {
          console.error("[v0] Password update error:", updateError)
        }
      }

      router.push("/play/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignup = async (provider: "google" | "facebook") => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} signup failed`)
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-600 opacity-20 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-600 opacity-20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 sm:mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-300 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              Brain Training Made Fun
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Join the Challenge</h1>
            <p className="text-gray-400">
              {step === "email" ? "Create your account to save progress" : "Enter the code sent to your email"}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10">
            {step === "email" ? (
              <>
                <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-sm sm:text-base">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-indigo-500 h-11 sm:h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white text-sm sm:text-base">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-indigo-500 h-11 sm:h-12 text-base"
                    />
                  </div>
                  {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-11 sm:h-12 text-base sm:text-lg font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending OTP..." : "Continue with Email"}
                  </Button>
                </form>

                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-transparent px-2 text-gray-400">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleSocialSignup("google")}
                      disabled={isLoading}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-11 text-base"
                    >
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSocialSignup("facebook")}
                      disabled={isLoading}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-11 text-base"
                    >
                      Facebook
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-sm text-gray-400">
                    Already have an account?{" "}
                    <button
                      onClick={() => router.push("/play/login")}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Sign In
                    </button>
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/")}
                    className="gap-2 text-gray-400 hover:text-white hover:bg-white/5 w-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleOtpVerify} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="otp" className="text-white text-center block text-base">
                    Verification Code
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="bg-white/10 border-white/20 text-white text-lg h-12 w-12" />
                        <InputOTPSlot index={1} className="bg-white/10 border-white/20 text-white text-lg h-12 w-12" />
                        <InputOTPSlot index={2} className="bg-white/10 border-white/20 text-white text-lg h-12 w-12" />
                        <InputOTPSlot index={3} className="bg-white/10 border-white/20 text-white text-lg h-12 w-12" />
                        <InputOTPSlot index={4} className="bg-white/10 border-white/20 text-white text-lg h-12 w-12" />
                        <InputOTPSlot index={5} className="bg-white/10 border-white/20 text-white text-lg h-12 w-12" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-sm text-gray-400 text-center">
                    Check your email at <strong className="text-indigo-400">{email}</strong>
                  </p>
                </div>
                {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 text-lg font-medium"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify & Sign Up"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-white/5"
                  onClick={() => setStep("email")}
                >
                  Change Email
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
