'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AcceptInvitationPage from '../../accept-invitation/[token]/page';

export default function InvitePage() {
  const params = useParams();
  
  // Reutilizar a mesma lógica da página accept-invitation
  return <AcceptInvitationPage />;
}
