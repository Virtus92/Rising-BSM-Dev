'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import CustomerForm from '@/features/customers/components/CustomerForm';
import { CustomerService } from '@/features/customers/lib/services/CustomerService';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { AccessDenied } from '@/shared/components/AccessDenied';

export default function EditCustomerPage() {
  const params = useParams();
  const customerId = parseInt(params.id as string);
  const [customer, setCustomer] = useState<CustomerResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const canEditCustomer = true; // Bypass permission check

  // Fetch customer details
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await CustomerService.getCustomerById(customerId);
        
        if (response.success && response.data) {
          setCustomer(response.data);
        } else {
          setError(response.message || 'Failed to fetch customer details');
          toast({
            title: 'Error',
            description: response.message || 'Failed to fetch customer details',
            variant: 'error'
          });
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch customer details');
        toast({
          title: 'Error',
          description: 'Failed to fetch customer details',
          variant: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (canEditCustomer) {
      fetchCustomer();
    } else {
      setLoading(false);
    }
  }, [customerId, toast, canEditCustomer]);

  // Update customer handler
  const handleUpdateCustomer = async (data: any) => {
    try {
      const response = await CustomerService.updateCustomer(customerId, data);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Customer has been updated successfully',
          variant: 'success'
        });
        return response.data;
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update customer',
          variant: 'error'
        });
        return null;
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'error'
      });
      return null;
    }
  };

  if (!canEditCustomer) {
    return <AccessDenied resource="customers" action="edit" />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-red-500 text-center mb-4">
          {error || 'Customer not found'}
        </p>
        <button 
          onClick={() => router.push('/dashboard/customers')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomerForm 
        mode="edit" 
        initialData={customer} 
        onSubmit={handleUpdateCustomer} 
      />
    </div>
  );
}