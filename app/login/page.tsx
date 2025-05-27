"use client"

import { useState, useEffect } from "react"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useToast } from "../../Components/ui/use-toast"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { resendVerificationEmail } from "../../lib/auth"
import { Buttons } from "../../Components/ui/button"
import { Input } from "../../Components/ui/input"
import { Label } from "../../Components/ui/label"
import { getHotelDetails } from "../../lib/hotelDetails"
import Image from "next/image"

const LoadingOverlay = ({ hotelLogo }: { hotelLogo: string | null }) => (
  <div className="fixed inset-0 backdrop-blur-lg bg-black/50 flex flex-col items-center justify-center z-50">
    <div className="relative w-32 h-32 mb-8">
      {/* Enhanced animated circles */}
      <div className="absolute inset-0 border-4 border-t-hotel-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-2 border-4 border-r-hotel-primary/80 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-reverse"></div>
      <div className="absolute inset-4 border-4 border-b-hotel-primary/60 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slow"></div>
      <div className="absolute inset-6 border-4 border-l-hotel-primary/40 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin-reverse-slow"></div>
      
      {/* Pulsing center */}
      <div className="absolute inset-0 flex items-center justify-center">
        {hotelLogo ? (
          <div className="relative w-16 h-16">
            <Image              src={hotelLogo}
              alt="Mahal Logo"
              fill
              className="object-contain animate-pulse filter brightness-0 invert"
            />
          </div>
        ) : (
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
        )}
      </div>
    </div>

    <h3 className="text-2xl font-medium text-white mb-3 animate-fade-in">Welcome Back</h3>
    <p className="text-gray-300 text-center max-w-xs animate-fade-in-delay">
      Preparing your personalized dashboard...
    </p>

    {/* Improved progress bar */}
    <div className="w-72 h-1.5 bg-gray-800/50 rounded-full mt-8 overflow-hidden backdrop-blur-sm">
      <div className="h-full w-full bg-gradient-to-r from-hotel-primary via-hotel-primary/80 to-hotel-primary rounded-full animate-progress-infinite"></div>
    </div>
  </div>
);

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [hotelLogo, setHotelLogo] = useState<string | null>(null)

  const { toast } = useToast()
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setRedirecting(true)
       // Determine redirect URL
       let redirectUrl = "/dashboard"
      if (session.user.isEmployee) {
        const permissions = session.user.permissions || []
        const firstAccessiblePage = permissions.find(p => p.actions.view)
        if (firstAccessiblePage?.url) {
          redirectUrl = firstAccessiblePage.url
        }
      }

      // Small delay to ensure animation is visible
      setTimeout(() => {
        router.replace(redirectUrl)
      }, 800)
    }
  }, [session, status, router])

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
      // Clear any existing sessions first
      localStorage.clear()
      sessionStorage.clear()

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/dashboard"
      })

      if (result?.error) {
        if (result.error === "Email not verified. Please verify your email before logging in.") {
          toast({
            variant: "destructive",
            title: "Email Not Verified",
            description: "Your email is not verified. Would you like to resend the verification email?",
            action: (
              <Buttons variant="outline" size="sm" onClick={() => handleResendVerification(email)}
               className="bg-white hover:bg-gray-100 text-black border-white hover:border-gray-100"
              >
                Resend
              </Buttons>
            ),
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
          })
        }
      } else if (result?.url) {
        // Don't set loading to false here, we want to show the redirect animation
        setRedirecting(true)
        router.push(result.url)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification(email: string) {
    try {
      const resendResult = await resendVerificationEmail(email)
      if (resendResult.success) {
        toast({
          title: "Verification Email Sent",
          description: resendResult.message || "Please check your inbox and verify your email to login.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: resendResult.error || "Failed to resend verification email. Please try again later.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while resending the verification email.",
      })
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn("google", {
        redirect: true,
        callbackUrl: "/auth/redirect"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during Google sign-in"
      })
      setLoading(false)
      setRedirecting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-black relative">
      {redirecting && <LoadingOverlay hotelLogo={hotelLogo} />}
      
      {/* Left Section */}
      <div className="relative hidden w-1/2 p-8 lg:block">
        <div className="h-full w-full overflow-hidden rounded-[40px] bg-gradient-to-b from-hotel-primary via-hotel-primary/80 to-black">
          <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
            {hotelLogo && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2">
                <div className="relative w-28 h-28">
                  <Image                    src={hotelLogo}
                    alt="Mahal Logo"
                    fill
                    sizes="(max-width: 768px) 96px, 112px"
                    priority
                    className="object-contain drop-shadow-2xl filter brightness-0 invert opacity-90"
                  />
                </div>
              </div>
            )}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold">Mahal Management</h1>
            </div>
            <h2 className="mb-6 text-4xl font-bold">Welcome Back</h2>
            <p className="mb-12 text-lg">
              Access your dashboard and manage your hotel operations efficiently
            </p>
            <div className="w-full max-w-sm space-y-4">
              {[
                { step: 1, text: "Sign in securely" },
                { step: 2, text: "Access your dashboard" },
                { step: 3, text: "Manage operations" }
              ].map((item, index) => (
                <div
                  key={item.step}
                  className={`rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                    index === 0 ? 'bg-white/15' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        index === 0 ? 'bg-white text-black' : 'bg-white/20 text-white'
                      } transition-colors duration-300`}
                    >
                      {item.step}
                    </span>
                    <span className="text-lg">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex w-full items-center justify-center bg-black p-6 lg:w-1/2">
        <div className="w-full max-w-md rounded-[40px] p-8 md:p-12">
          <div className="mx-auto max-w-sm">
            {hotelLogo && (
              <div className="mb-4 -mt-4 flex justify-center transition-transform duration-300 hover:scale-105">
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                  <Image                    src={hotelLogo}
                    alt="Mahal Logo"
                    fill
                    sizes="(max-width: 768px) 80px, 96px"
                    priority
                    className="object-contain drop-shadow-xl filter brightness-0 invert opacity-90"
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4"> {/* Reduced space */}
              <div className="space-y-4"> {/* Reduced space */}
                {/* Email Input */}
                <div className="space-y-1.5"> {/* Reduced space */}
                  <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                    Email Address
                  </Label>
                  <div className="relative flex items-center group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none transition-colors group-hover:text-hotel-primary" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full pl-10 bg-gray-900/50 border border-gray-800 text-white 
                        placeholder:text-gray-500 focus:border-hotel-primary focus:ring-2 focus:ring-hotel-primary/20 
                        rounded-lg transition-all duration-200 group-hover:border-gray-700"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5"> {/* Reduced space */}
                  <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                    Password
                  </Label>
                  <div className="relative flex items-center group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none transition-colors group-hover:text-hotel-primary" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full pl-10 pr-12 bg-gray-900/50 border border-gray-800 text-white 
                        placeholder:text-gray-500 focus:border-hotel-primary focus:ring-2 focus:ring-hotel-primary/20 
                        rounded-lg transition-all duration-200 group-hover:border-gray-700"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 
                        hover:text-gray-300 focus:outline-none focus:text-gray-300 
                        transition-colors p-1 rounded-full hover:bg-gray-800/50"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex items-center justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-hotel-primary hover:text-hotel-primary/80 
                      transition-colors hover:underline decoration-2 underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Rest of the form content with adjusted spacing */}
              <div className="space-y-4"> {/* Reduced space */}
                {/* Submit Button */}
                <Buttons
                  type="submit"
                  className="h-12 w-full bg-gradient-to-r from-hotel-primary to-hotel-primary/80 
                    hover:from-hotel-primary/90 hover:to-hotel-primary text-white font-medium 
                    rounded-lg shadow-lg hover:shadow-hotel-primary/20 transition-all 
                    duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </Buttons>

                {/* Separator */}
                <div className="relative py-2"> {/* Added vertical padding */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-4 text-gray-500 text-sm">or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Buttons
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="h-12 w-full border border-gray-800 bg-gray-900/30 
                    hover:bg-gray-800/50 transition-all duration-200 flex items-center 
                    justify-center gap-3 rounded-lg group relative hover:border-gray-700"
                >
                  <div className="flex items-center gap-3 text-base text-gray-100 group-hover:text-white">
                    <span className="bg-white p-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-110">
                      <FcGoogle className="h-5 w-5" />
                    </span>
                    <span className="font-medium">Continue with Google</span>
                  </div>
                  {loading && (
                    <div className="absolute right-4 w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                  )}
                </Buttons>

                {/* Sign up link */}
                {/* <p className="text-center text-sm text-gray-400 mt-4"> 
                  Don&apos;t have an account?{" "}
                  <Link 
                    href="/register" 
                    className="text-hotel-primary hover:text-hotel-primary/80 font-medium 
                      transition-colors hover:underline decoration-2 underline-offset-4"
                  >
                    Create an account
                  </Link>
                </p> */}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

