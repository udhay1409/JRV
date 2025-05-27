'use client'

import { ClientSessionProvider } from "../auth/ClientSessionProvider"
import { Toaster } from "@/Components/ui/toaster"
import { AutoLogoutHandler } from "../auth/AutoLogoutHandler"
import { AdminSettingsProvider } from "../../context/AdminSettingsContext"
import NavigationWrapper from "../layout/NavigationWrapper"

export default function ClientProviders({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AdminSettingsProvider>
      <ClientSessionProvider>
        <AutoLogoutHandler />
        <Toaster />
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </ClientSessionProvider>
    </AdminSettingsProvider>
  )
}
