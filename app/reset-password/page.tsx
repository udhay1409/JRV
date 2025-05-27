"use client";

import { useState, useEffect, Suspense } from "react";
import { Input } from "../../Components/ui/input";
import { Buttons } from "@/Components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "../../Components/ui/use-toast";
import { CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import { Label } from "../../Components/ui/label";
import Link from "next/link";
import { validatePassword } from "../../utils/passwordValidation";
import { getHotelDetails } from "../../lib/hotelDetails";
import Image from "next/image";

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-1.5">
    <div
      className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
        met ? "bg-green-400" : "bg-red-400"
      }`}
    />
    <span
      className={`transition-colors duration-200 ${
        met ? "text-green-400" : "text-red-400"
      }`}
    >
      {text}
    </span>
  </div>
);

const ResetPasswordContent = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [hotelLogo, setHotelLogo] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid reset link. Please request a new one.",
      });
      router.push("/forgot-password");
    }
  }, [token, toast, router]);

  useEffect(() => {
    async function fetchHotelDetails() {
      const hotelData = await getHotelDetails();
      if (hotelData?.logo) {
        setHotelLogo(hotelData.logo);
      }
    }
    fetchHotelDetails();
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const { errors } = validatePassword(newPassword);
    setPasswordErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      toast({
        title: "Invalid Password",
        description: "Please ensure your password meets all requirements",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
        });
        setTimeout(() => router.push("/login"), 3000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "An error occurred. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
    setLoading(false);
  };

  if (!token) return null;

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
                    src={hotelLogo}                    alt="Mahal Logo"
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
            <h2 className="mb-6 text-4xl font-bold">Reset Your Password</h2>
            <p className="mb-12 text-lg">
              Follow these steps to secure your account.
            </p>

            <div className="w-full max-w-sm space-y-4">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                    1
                  </span>
                  <span className="text-lg">Enter new password</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
                    2
                  </span>
                  <span className="text-lg">Confirm password</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
                    3
                  </span>
                  <span className="text-lg">Access your account</span>
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
            {isSubmitted ? (
              <div className="text-center">
                <div className="mb-8 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="mb-2 text-3xl font-bold text-white">
                  Password Reset Successful
                </h2>
                <p className="mb-8 text-gray-400">
                  Your password has been reset successfully. You will be
                  redirected to the login page shortly.
                </p>
                <Link
                  href="/login"
                  className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-black hover:bg-gray-100 transition-colors"
                >
                  Return to Login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="mb-2 text-3xl font-bold text-white">
                  Reset Password
                </h2>
                <p className="mb-8 text-gray-400">
                  Enter your new password below to reset your account.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {/* New Password Input */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-gray-200"
                      >
                        New Password
                      </Label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={handlePasswordChange}
                          className={`h-12 w-full pl-10 pr-12 bg-gray-900/50 border ${
                            passwordErrors.length > 0
                              ? "border-red-500"
                              : "border-gray-800"
                          } text-white placeholder:text-gray-500 focus:border-hotel-primary focus:ring-2 focus:ring-hotel-primary/20 rounded-lg transition-all duration-200`}
                          placeholder="Enter new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none focus:text-gray-300 transition-colors"
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

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-gray-200"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 w-full pl-10 pr-12 bg-gray-900/50 border border-gray-800 text-white placeholder:text-gray-500 focus:border-hotel-primary focus:ring-2 focus:ring-hotel-primary/20 rounded-lg transition-all duration-200"
                          placeholder="Confirm new password"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none focus:text-gray-300 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
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
                        Resetting Password...
                      </div>
                    ) : (
                      "Reset Password"
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Update the loading state to match the theme
export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="w-8 h-8 border-t-2 border-hotel-primary rounded-full animate-spin"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

