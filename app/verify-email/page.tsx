"use client";

import { Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "../../Components/ui/alert";
import { useToast } from "../../Components/ui/use-toast";
import { CircleX, SquareCheckBig, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useCallback } from "react";
import { Buttons } from "@/Components/ui/button";

const VerifyEmailContent = () => {
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [verified, setVerified] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const searchParams = useSearchParams();
  const verifyToken = searchParams.get("verifyToken");
  const id = searchParams.get("id");

  const initialized = React.useRef(false);

  const verifyEmail = useCallback(async () => {
    if (!verifyToken || !id) {
      setError("Invalid URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/verify-email?verifyToken=${verifyToken}&id=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setVerified(true);
        toast({
          title: "Email Verified",
          description: "Your email has been verified successfully. You can now log in.",
          variant: "default",
        });
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.message || "Verification failed");
      }
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [verifyToken, id, router, toast]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      verifyEmail();
    }
  }, [verifyEmail]);

  const resendVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: "Verification email resent", description: "Please check your inbox" });
      } else {
        setError(data.message || "Failed to resend verification email");
      }
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="animate-spin mr-2" />
        <h1>Processing your request. Please wait...</h1>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md">
        {verified && (
          <Alert variant="default" className="mb-5">
            <SquareCheckBig color="green" />
            <AlertTitle>Email Verified!</AlertTitle>
            <AlertDescription>
              Your email has been verified successfully. You will be redirected to the login page shortly.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-5">
            <CircleX color="red" />
            <AlertTitle>Email Verification Failed!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Buttons onClick={resendVerification} className="mt-4">
            Resend Verification Email
          </Buttons>
        )}
      </div>
    </div>
  );
};

export default function VerifyEmail() {
  return (
    <Suspense 
      fallback={
        <div className="flex justify-center items-center h-screen">
          <RefreshCw className="animate-spin mr-2" />
          <h1>Loading...</h1>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

