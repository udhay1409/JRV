
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  cookies()
  
  // Clear all auth-related cookies
  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  )

  // Clear employee token
  response.cookies.delete("token")

  // Clear NextAuth session cookies
  response.cookies.delete("next-auth.session-token")
  response.cookies.delete("next-auth.csrf-token")
  response.cookies.delete("next-auth.callback-url")
  
  // Clear any other auth-related cookies
  response.cookies.delete("__Secure-next-auth.session-token")
  response.cookies.delete("__Host-next-auth.csrf-token")

  return response
}