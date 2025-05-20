import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { CustomerClient } from '@/features/customers/lib/clients/CustomerClient';
import { useToast } from '@/shared/hooks/useToast';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { RequestClient } from '../lib/clients/RequestClient';

// Form validation schema
const formSchema = z.object({
  customerId: z.string().min(1, 'You must select a customer'),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LinkToCustomerFormProps {
  requestId: number;
  onClose: () => void;
}

/**
 * Form for linking a request to an existing customer
 */
export const LinkToCustomerForm: React.FC<LinkToCustomerFormProps> = ({
  requestId,
  onClose,
}) => {
  const [isLinking, setIsLinking] = useState(false);
  const [customers, setCustomers] = useState<{id: number, name: string}[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      note: '',
    },
  });

  // Load customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoadingCustomers(true);
        const response = await CustomerClient.getCustomers({
          limit: 100,
          sortBy: 'name',
          sortDirection: 'asc'
        });
        
        if (response.success && response.data) {
          const customerData = response.data.data || response.data;
          if (Array.isArray(customerData)) {
            setCustomers(customerData.map(c => ({ 
              id: c.id, 
              name: c.name 
            })));
          }
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customers',
          variant: 'error'
        });
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [toast]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLinking(true);
      
      const customerId = parseInt(data.customerId);
      if (isNaN(customerId)) {
        toast({
          title: 'Error',
          description: 'Invalid customer ID',
          variant: 'error'
        });
        return;
      }
      
      const response = await RequestClient.linkToCustomer(
        requestId,
        customerId,
        data.note
      );
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Request linked to customer successfully',
          variant: 'success'
        });
        onClose();
        window.location.reload(); // Direct page reload to ensure state is refreshed
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to link customer',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to link customer:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'error'
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="customerId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Customer</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoadingCustomers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCustomers ? (
                    <SelectItem value="loading" disabled>
                      Loading customers...
                    </SelectItem>
                  ) : customers.length > 0 ? (
                    customers.map((customer) => (
                      <SelectItem 
                        key={customer.id} 
                        value={String(customer.id)}
                      >
                        {customer.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No customers found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Note (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add a note about linking this request"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLinking || isLoadingCustomers}
        >
          {isLinking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Linking...
            </>
          ) : (
            'Link to Customer'
          )}
        </Button>
      </div>
    </form>
  );
};
