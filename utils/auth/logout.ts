
import { signOut } from "next-auth/react"

export const handleLogout = async () => {
  try {
    // Clear all storage
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear cookies first
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })

    // Sign out from NextAuth
    await signOut({ 
      callbackUrl: "/login",
      redirect: true
    })
  } catch (error) {
    console.error('Logout error:', error)
    // Force redirect on error
    window.location.href = '/login'
  }
}