'use client';

import { useEffect } from 'react';
import { SessionSync } from '@/lib/auth/session-sync';

export default function AuthClearPage() {
  useEffect(() => {
    // Clear all sessions when this page is accessed
    console.log('🧹 AuthClear: Limpando todas as sessões...');
    SessionSync.clearAllSessions();
    
    // Redirect to main domain after clearing
    const protocol = window.location.protocol;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000';
    window.location.href = `${protocol}//${mainDomain}`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Clearing sessions...</p>
      </div>
    </div>
  );
}
