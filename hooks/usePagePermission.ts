import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PagePermission, SessionUser } from '../types/auth'

export function usePagePermission(pageName: string, action: 'view' | 'add' | 'edit' | 'delete' = 'view') {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const { data: session, status } = useSession()

  useEffect(() => {
    const checkPermissions = async () => {
      if (status === "loading") return;

      if (!session) {
        setHasPermission(false)
        return
      }

      const user = session.user as SessionUser

      // Hotel admin has full access
      if (!user.isEmployee) {
        setHasPermission(true)
        return
      }

      // Check employee permissions from session
      const permissions = (user.permissions || []) as PagePermission[]
      const pagePermission = permissions.find(
        (p: PagePermission) => p.page.toLowerCase().trim() === pageName.toLowerCase().trim()
      )
      
      setHasPermission(pagePermission ? Boolean(pagePermission.actions[action]) : false)
    }

    checkPermissions()
  }, [session, status, pageName, action])

  return hasPermission
}