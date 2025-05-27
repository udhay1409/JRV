
"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Loader from "../../../Components/Loader/Loader"
interface Permission {
  module: string;
  actions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  url?: string;
}

export default function AuthRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        if (status === "loading") return

        if (status === "authenticated" && session?.user) {
          if (session.user.isEmployee) {
            const permissions = session.user.permissions || []
            const firstAccessiblePage = permissions.find((p: Permission) => p.actions.view)

            if (firstAccessiblePage) {
              // Use the url property if available, otherwise fallback to module
              const pagePath =
                firstAccessiblePage.url ||
                (firstAccessiblePage.module && `/dashboard/${firstAccessiblePage.module.toLowerCase()}`)

              if (pagePath) {
                router.replace(pagePath)
              } else {
                router.replace("/dashboard/unauthorized")
              }
            } else {
              router.replace("/dashboard/unauthorized")
            }
          } else {
            // For hotel admin
            await router.replace("/dashboard")
          }
        } else if (status === "unauthenticated") {
          await router.replace("/login")
        }
      } catch (error) {
        console.error("Redirect error:", error)
        // Fallback to dashboard on error
        await router.replace("/dashboard")
      }
    }

    handleRedirect()
  }, [session, status, router])

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Loader />
    </div>
  )
}




