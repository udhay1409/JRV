"use client"

import { useState, useEffect } from "react"
import { Input } from "../../Components/ui/input"
import { Buttons } from "../../Components/ui/button"
import { useToast } from "../../Components/ui/use-toast"
import { CheckCircle, Mail } from "lucide-react"
import { Label } from "../../Components/ui/label"
import Link from "next/link"
import { getHotelDetails } from "../../lib/hotelDetails"
import Image from "next/image"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [hotelLogo, setHotelLogo] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchHotelDetails() {
      const hotelData = await getHotelDetails()
      if (hotelData?.logo) {
        setHotelLogo(hotelData.logo)
      }
    }
    fetchHotelDetails()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (response.ok) {
        setIsSubmitted(true)
        toast({
          title: "Success",
          description: "Password reset email sent. Please check your inbox.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "An error occurred. Please try again.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
    }

    setLoading(false)
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen bg-black">
        <div className="flex w-full items-center justify-center p-6">
          <div className="w-full max-w-md rounded-[40px] p-12">
            <div className="mx-auto max-w-sm text-center">
              <div className="mb-8 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-3xl font-bold text-white">Check Your Email</h2>
              <p className="mb-8 text-gray-400">
                We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-black hover:bg-gray-100 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left Section */}
      <div className="relative hidden w-1/2 p-8 lg:block">
        <div className="h-full w-full overflow-hidden rounded-[40px] bg-gradient-to-b from-hotel-primary via-hotel-primary/80 to-black">
          <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
            {hotelLogo && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2">
                <div className="relative w-28 h-28">
                  <Image
                    src={hotelLogo}
                    alt="Hotel Logo"
                    fill
                    sizes="(max-width: 768px) 96px, 112px"
                    priority
                    className="object-contain drop-shadow-2xl filter brightness-0 invert opacity-90"
                  />
                </div>
              </div>
            )}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold">Hotel Management</h1>
            </div>
            <h2 className="mb-6 text-4xl font-bold">Password Recovery</h2>
            <p className="mb-12 text-lg">Follow these steps to reset your password.</p>

            <div className="w-full max-w-sm space-y-4">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">1</span>
                  <span className="text-lg">Enter your email</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">2</span>
                  <span className="text-lg">Check your inbox</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">3</span>
                  <span className="text-lg">Reset your password</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex w-full items-center justify-center bg-black p-6 lg:w-1/2">
        <div className="w-full max-w-md rounded-[40px] p-12">
          <div className="mx-auto max-w-sm">
            <h2 className="mb-2 text-3xl font-bold text-white">Forgot Password?</h2>
            <p className="mb-8 text-gray-400">Enter your email to receive a password reset link</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                    Email Address
                  </Label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full pl-10 bg-gray-900/50 border border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              <Buttons
                type="submit"
                className="h-12 w-full bg-gradient-to-r from-hotel-primary to-hotel-primary/80 hover:from-hotel-primary/90 hover:to-hotel-primary text-white font-medium rounded-lg shadow-lg hover:shadow-hotel-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2" />
                    Sending...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Buttons>

              <p className="text-center text-sm text-gray-400">
                Remember your password?{" "}
                <Link 
                  href="/login" 
                  className="text-hotel-primary hover:text-hotel-primary/80 font-medium transition-colors hover:underline"
                >
                  Back to Login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

