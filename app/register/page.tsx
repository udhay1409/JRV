
"use client";

import { useState, useEffect } from "react";
import { useToast } from "../../Components/ui/use-toast"
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, User, CheckCircle } from "lucide-react";
import { Input } from "@/Components/ui/input"
import { Label } from "../../Components/ui/label"
import { Buttons } from "../../Components/ui/button"
import { validatePassword } from "../../utils/passwordValidation"
import { getHotelDetails } from "../../lib/hotelDetails"
import Image from "next/image"

// Add this helper component
const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
      met ? 'bg-green-400' : 'bg-red-400'
    }`} />
    <span className={`transition-colors duration-200 ${
      met ? 'text-green-400' : 'text-red-400'
    }`}>
      {text}
    </span>
  </div>
)

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    const { errors } = validatePassword(newPassword)
    setPasswordErrors(errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

        // Validate password before submission
        const { isValid, errors } = validatePassword(password)
        if (!isValid) {
          toast({
            title: "Invalid Password",
            description: "Please ensure your password meets all requirements",
            variant: "destructive",
          })
          return
        }
        
    if (!name || !email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setRegistered(true)
        toast({
          title: "Registration Successful",
          description:
            "A verification email has been sent to your registered email address. Please verify your email to complete the registration process.",
          variant: "default",
        })
      } else {
        toast({
          title: "Registration Error",
          description: data.error || "An unexpected error occurred during registration",
          variant: "destructive",
        })
        console.error("Registration error:", data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      console.error("Registration error:", error)
    } finally {
      setLoading(false)
    }
  }


  if (registered) {
    return (
      <div className="flex min-h-screen bg-black">
        <div className="flex w-full items-center justify-center p-6">
          <div className="w-full max-w-md rounded-[40px] p-12">
            <div className="mx-auto max-w-sm text-center">
              <div className="mb-8 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-3xl font-bold text-white">Registration Successful</h2>
              <p className="mb-8 text-gray-400">Please check your email to verify your account.</p>
              <p className="mb-8 text-gray-400">
                A verification email has been sent to <strong className="text-white">{email}</strong>
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
      <div className="h-full w-full overflow-hidden rounded-[40px] bg-gradient-to-b from-blue-400 via-blue-600 to-black">
        <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
          {hotelLogo && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2">
              <div className="relative w-28 h-28">                <Image
                  src={hotelLogo}
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
          <h2 className="mb-6 text-4xl font-bold">Get Started with Us</h2>
          <p className="mb-12 text-lg">Complete these easy steps to register your account.</p>

          <div className="w-full max-w-sm space-y-4">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">1</span>
                <span className="text-lg">Create your account</span>
              </div>
            </div>
            <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">2</span>
                <span className="text-lg">Verify your email</span>
              </div>
            </div>
            <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">3</span>
                <span className="text-lg">Start managing your hotel</span>
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
          {hotelLogo && (
            <div className="mb-4 flex justify-center">
              <div className="relative w-24 h-24">
                <Image
                  src={hotelLogo}                  alt="Mahal Logo"
                  fill
                  sizes="96px"
                  priority
                  className="object-contain drop-shadow-xl filter opacity-90 transition-opacity duration-300 hover:opacity-100"
                />
              </div>
            </div>
          )}
         {/*  <h2 className="mb-2 text-3xl font-bold text-white">Create Account</h2> */}
          {/* <p className="mb-8 text-gray-400">Enter your details to get started with our platform.</p> */}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-200">
                  Full Name
                </Label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 w-full pl-10 bg-gray-900/50 border border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email Input */}
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

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                  Password
                </Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`h-12 w-full pl-10 pr-12 bg-gray-900/50 border ${
                      passwordErrors.length > 0 ? 'border-red-500' : 'border-gray-800'
                    } text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all duration-200`}
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none focus:text-gray-300 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {/* Password Requirements List */}
                <div className="mt-2">
                  {password && (
                    <div className="text-xs space-y-1.5">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <RequirementItem
                          met={password.length >= 8}
                          text="8+ characters"
                        />
                        <RequirementItem
                          met={/[A-Z]/.test(password)}
                          text="Uppercase letter"
                        />
                        <RequirementItem
                          met={/[a-z]/.test(password)}
                          text="Lowercase letter"
                        />
                        <RequirementItem
                          met={/\d/.test(password)}
                          text="Number"
                        />
                        <RequirementItem
                          met={/[@$!%*?&]/.test(password)}
                          text="Special character"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Buttons
              type="submit"
              className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2" />
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </Buttons>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
)
}