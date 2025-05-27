
export async function resendVerificationEmail(email: string) {
    try {
      // First, try to resend verification for a regular user
      let response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
  
      let data = await response.json()
  
      // If the user is not found in the regular users, try superadmin
      if (response.status === 404) {
        console.log("User not found in regular users, trying superadmin")
        response = await fetch("/api/superadmin/resend-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })
  
        data = await response.json()
      }
  
      if (response.ok) {
        return { success: true, message: data.message }
      } else {
        console.error("Error response:", response.status, data)
        return { success: false, error: data.message || "Failed to resend verification email" }
      }
    } catch (error) {
      console.error("Error resending verification email:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }
  
  