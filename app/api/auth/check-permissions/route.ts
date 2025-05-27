import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/options"
import { PagePermission, SessionUser } from "../../../../types/auth"

export async function POST(request: Request) {
  try {
    const { page, action = 'view' } = await request.json()
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ success: false, hasPermission: false }, { status: 401 })
    }

    const user = session.user as SessionUser

    // Hotel admin has full access
    if (!user.isEmployee) {
      return NextResponse.json({ success: true, hasPermission: true })
    }

    // Check employee permissions from session
    const permissions = user.permissions || []
    const pagePermission = permissions.find(
      (p: PagePermission) => p.page.toLowerCase().trim() === page.toLowerCase().trim()
    )

    const hasPermission = pagePermission ? Boolean(pagePermission.actions[action]) : false

    return NextResponse.json({ success: true, hasPermission })
  } catch (error) {
    console.error("Permission check error:", error)
    return NextResponse.json({ success: false, hasPermission: false }, { status: 500 })
  }
}