// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from "next-auth/jwt"

// Update the publicRoutes array to include necessary frontend API routes
const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/api/auth/callback/google",
  "/",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/session",
  // Add frontend API routes that should be public
  "/api/settings/policy",  // Add this line
  "/api/settings/rooms",  // Add this line
  "/api/hotelDetails", 
  "/api/rooms",
  "/terms-and-conditions",
  "/privacy-policy",
  "/api/crm",  // Add this line
  // Add other frontend API routes as needed
]

// Add security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
}

// Rate limiting
const rateLimit = new Map()
const RATE_LIMIT_DURATION = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10000 // Max requests per minute

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname

    // Handle API routes first
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/hotelDetails') {
        // Check if it's a client-side request
        const isClientSideRequest = request.headers.get('sec-fetch-site') === 'same-origin';
        
        // Allow GET and client-side PUT requests without API key
        if (request.method === 'GET' || 
            (request.method === 'PUT' && isClientSideRequest)) {
          return NextResponse.next();
        }
        
        // For non-client-side PUT requests, require API key
        if (request.method === 'PUT') {
          const apiKey = request.headers.get('x-api-key')
          if (!apiKey || apiKey !== process.env.API_KEY) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized - Invalid API Key' }), {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                ...securityHeaders,
                'WWW-Authenticate': 'API-Key'
              }
            })
          }
          return NextResponse.next();
        }
        
        // Reject other methods
        return new NextResponse(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders,
            'Allow': 'GET, PUT'
          }
        })
      }

      // Skip auth checks for these specific endpoints
      if (pathname.startsWith('/api/auth/') || 
          pathname.startsWith('/api/settings/policy')) {
        return NextResponse.next()
      }

      // Skip API key check for policy endpoint
      if (pathname === '/api/settings/policy') {
        return NextResponse.next()
      }

      // Check if it's a client-side request
      const isClientSideRequest = request.headers.get('sec-fetch-site') === 'same-origin'

      // Allow client-side requests without API key
      if (isClientSideRequest) {
        return NextResponse.next()
      }

      // Check API key for external requests
      const apiKey = request.headers.get('x-api-key')
      if (!apiKey || apiKey !== process.env.API_KEY) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized - Invalid API Key' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders,
            'WWW-Authenticate': 'API-Key'
          }
        })
      }
    }

    const ip = request.ip ?? 'anonymous'
    
    // Rate limiting check
    const now = Date.now()
    const rateKey = `${ip}:${now - (now % RATE_LIMIT_DURATION)}`
    const currentRequests = rateLimit.get(rateKey) ?? 0

    if (currentRequests >= MAX_REQUESTS) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          ...securityHeaders
        }
      })
    }

    rateLimit.set(rateKey, currentRequests + 1)
    
    // Clean up old rate limit entries - fixed version
    const currentWindow = now - (now % RATE_LIMIT_DURATION)
    Array.from(rateLimit.keys()).forEach(key => {
      if (!key.includes(String(currentWindow))) {
        rateLimit.delete(key)
      }
    })

    // Skip middleware for static files and API routes
    if (
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    // Allow public routes
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Protected routes authentication check
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

      // Session validation checks
      if (token) {
        const now = Date.now()
        const expireTime = ((token.exp as number) ?? 0) * 1000 // Convert to milliseconds
        const lastActivity = Number(token.lastActivity ?? 0)
        const inactiveTime = now - lastActivity
        const isExpired = now >= expireTime
        const isInactive = inactiveTime > 5 * 60 * 60 * 1000 // 5 hours

        if (isExpired || isInactive) {
          const response = NextResponse.redirect(new URL('/login', request.url))
          // Clear all cookies
          response.cookies.delete('next-auth.session-token')
          response.cookies.delete('next-auth.csrf-token')
          response.cookies.delete('next-auth.callback-url')
          response.cookies.delete('__Secure-next-auth.session-token')
          response.cookies.delete('__Host-next-auth.csrf-token')
          return response
        }
      }  else {
        // No token found - redirect to login
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname))
        return NextResponse.redirect(loginUrl)
      }
 
    // Add session validation
    if (pathname.startsWith('/dashboard')) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      })

      if (!token || (typeof token.exp === 'number' && Date.now() / 1000 > token.exp)) {
        // Clear session cookies
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('next-auth.session-token')
        response.cookies.delete('next-auth.csrf-token')
        return response
      }
    }

    // Check dashboard access
    if (pathname.startsWith('/dashboard')) {
      const response = NextResponse.next()
      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return response
    }

    // Add CSRF protection for non-GET requests
    if (request.method !== 'GET' && !request.headers.get('x-csrf-token')) {
      return new NextResponse('Invalid CSRF token', { 
        status: 403,
        headers: securityHeaders
      })
    }

    const response = NextResponse.next()
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response

  } catch (error) {
    console.error("Middleware error:", error)
    const response = NextResponse.redirect(new URL("/login", request.url))
    
    // Add security headers to error response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Clear all auth cookies on error
    response.cookies.delete("next-auth.session-token")
    response.cookies.delete("next-auth.csrf-token")
    response.cookies.delete("next-auth.callback-url")
    response.cookies.delete("__Secure-next-auth.session-token")
    response.cookies.delete("__Host-next-auth.csrf-token")
    
    return response
  }
}

export const config = {
  matcher: [
    // Match API routes
    '/api/:path*',
    // Match all pages except static files
    '/((?!api|_next/static|_next/image|favicon.ico|public/|assets/|static/).*)',
  ]
}


