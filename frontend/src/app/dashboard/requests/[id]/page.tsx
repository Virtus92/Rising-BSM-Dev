'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { RequestDetail } from '@/features/requests/components/RequestDetail';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * Dashboard page for request details
 */

/**
 * Dashboard-Seite für die Detailansicht einer Kontaktanfrage
 */
export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = parseInt(params.id as string);

  if (isNaN(requestId)) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Ungültige Anfrage-ID</h1>
        <Button onClick={() => router.push('/dashboard/requests')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  const handleBack = () => {
    router.push('/dashboard/requests');
  };

  return (
    <div className="container mx-auto py-6">
      <RequestDetail id={requestId} onBack={handleBack} />
    </div>
  );
}