'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RequestDetail } from '@/features/requests/components/RequestDetail';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface RequestDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * Dashboard-Seite für die Detailansicht einer Kontaktanfrage
 */
export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  const router = useRouter();
  const requestId = parseInt(params.id);

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

export function generateMetadata({ params }: RequestDetailPageProps) {
  return {
    title: `Anfrage #${params.id} | Rising BSM Dashboard`,
    description: 'Details zu einer Kontaktanfrage',
  };
}
