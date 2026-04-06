import { auth } from './lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAuth = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  const role = req.auth?.user?.role;

  if (isAuthPage) {
    if (isAuth) {
      const redirectPath = role === 'SHOPKEEPER' ? '/dashboard/shopkeeper' : '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
    return NextResponse.next();
  }

  if (!isAuth && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Protect shopkeeper routes from customers
  if (isAuth && req.nextUrl.pathname.startsWith('/dashboard/shopkeeper') && role !== 'SHOPKEEPER') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
