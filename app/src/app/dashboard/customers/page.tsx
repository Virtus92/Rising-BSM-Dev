'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerList } from '@/features/customers/components/CustomerList';
import CustomerForm from '@/features/customers/components/CustomerForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
// Make sure we're using the client-side service
import { CustomerService } from '@/features/customers/lib/services/CustomerService.client';
import { CreateCustomerDto, CustomerResponseDto, UpdateCustomerDto } from '@/domain/dtos/CustomerDtos';
import { useToast } from '@/shared/hooks/useToast';

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile devices
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Direct handling of modal opening based on URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check URL parameters from the hook
      const modalParam = searchParams?.get('modal');
      
      // Check if modal should be opened
      const shouldOpenModal = modalParam === 'new';
      
      if (shouldOpenModal) {
        setIsDialogOpen(true);
        
        // Update the URL to remove the query parameters without page reload
        const params = new URLSearchParams(window.location.search);
        let shouldUpdateUrl = false;
        
        if (params.has('modal')) {
          params.delete('modal');
          shouldUpdateUrl = true;
        }
        
        if (shouldUpdateUrl) {
          const newUrl = window.location.pathname + 
                        (params.toString() ? `?${params.toString()}` : '');
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [searchParams]);

  // Handle customer creation
  const handleCreateCustomer = async (data: CreateCustomerDto | UpdateCustomerDto): Promise<CustomerResponseDto | null> => {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    
    try {
      // Format and validate the data before sending
      const formattedData: CreateCustomerDto = {
        ...data,
        // Ensure required name property is never undefined
        name: data.name || '',
        // Field mapping happens in the CustomerService, but we'll ensure it here too
        postalCode: data.zipCode || data.postalCode
      };

      const response = await CustomerService.createCustomer(formattedData);
      
      if (response.success) {
        setSuccess(true);
        setError(null);
        
        // Add customer note if there's one entered
        if (data.notes && response.data?.id) {
          try {
            // Add a delay to ensure the customer is properly created first
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const noteResponse = await CustomerService.addCustomerNote(
              response.data.id, 
              data.notes
            );
            
            if (noteResponse.success) {
              console.log('Note added successfully', noteResponse);
            } else {
              console.error('Failed to add note:', noteResponse.message);
            }
          } catch (noteError) {
            console.error('Error adding note:', noteError);
          }
        }
        
        // Show success toast
        toast({
          title: 'Success',
          description: 'Customer created successfully',
          variant: 'success'
        });
        
        // Close dialog after a delay
        setTimeout(() => {
          setIsDialogOpen(false);
          // Redirect to the customer detail page
          if (response.data?.id) {
            router.push(`/dashboard/customers/${response.data.id}`);
          } else {
            // Fallback to reload if for some reason we don't have an ID
            window.location.reload();
          }
        }, 1500);
        
        return response.data || null;
      } else {
        setError(response.message || 'Failed to create customer');
        setSuccess(false);
        return null;
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('An unexpected error occurred');
      setSuccess(false);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create customer click
  const handleCreateClick = () => {
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setError(null);
    setSuccess(false);
  };
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <CustomerList onCreateClick={handleCreateClick} />
      </div>
      
      {/* Create Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className={`${isMobile ? 'sm:max-w-[100%] p-4' : 'sm:max-w-[600px]'} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10 pb-4">
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Enter the customer's information below</DialogDescription>
          </DialogHeader>
          
          <CustomerForm
            initialData={{}}
            onSubmit={handleCreateCustomer}
            mode="create"
            isLoading={isSubmitting}
            error={error}
            success={success}
            title="Add New Customer"
            description="Create a new customer account"
            submitLabel="Create Customer"
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
