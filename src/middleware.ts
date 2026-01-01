import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                       req.nextUrl.pathname.startsWith('/register')
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')

    // Redirect to login if accessing dashboard without auth
    if (isDashboard && !isAuth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Redirect to dashboard if accessing auth pages while logged in
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => true, // Let the middleware function handle authorization
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
