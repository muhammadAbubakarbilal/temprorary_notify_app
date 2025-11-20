'use client';

import { Suspense } from 'react';
import SignInForm from './signin-form';

export const dynamic = 'force-dynamic';
export const revalidate = false;

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}

