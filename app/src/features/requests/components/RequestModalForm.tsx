'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { RequestResponseDto, UpdateRequestDto } from '@/domain/dtos/RequestDtos';

// Import the actual form content from RequestForm
import RequestForm from './RequestForm';

export interface RequestModalFormProps {
  initialData?: Partial<RequestResponseDto>;
  onSubmit: (data: UpdateRequestDto) => Promise<any>;
  mode: 'create' | 'edit';
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  onCancel: () => void;
}

/**
 * Modal version of RequestForm without Card wrapper
 * For use inside FormModal or Dialog components
 */
export default function RequestModalForm(props: RequestModalFormProps) {
  // We'll render the RequestForm but style it to work better in a modal
  // by overriding the Card styles
  return (
    <div className="request-modal-form">
      <style jsx global>{`
        .request-modal-form .w-full.border.shadow-sm {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }
        .request-modal-form .w-full.border.shadow-sm > form > div:first-child {
          padding-top: 0 !important;
        }
        .request-modal-form .w-full.border.shadow-sm > form > div:last-child {
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          margin-top: 1.5rem !important;
        }
      `}</style>
      <RequestForm 
        {...props}
        title="" // Remove title as FormModal provides it
        description="" // Remove description as FormModal provides it
      />
    </div>
  );
}
