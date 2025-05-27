'use client';

import { SessionProvider } from "next-auth/react";

export function ClientSessionProvider({ children }) {
  return (
    <SessionProvider 
      // Refetch session every 5 minutes
      refetchInterval={300}
      // Disable window focus refetch in production for better security and performance
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}