import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { useQuery } from '@tanstack/react-query';
import { CustomerClient } from '@/features/customers/lib/clients/CustomerClient';
import { useToast } from '@/shared/hooks/useToast';
import { Loader2, Search } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { CheckIcon } from 'lucide-react';
import { RequestService } from '@/features/requests/lib/services';
import { cn } from '@/shared/utils/cn';

// Form validation schema
const formSchema = z.object({
  customerId: z.number({
    required_error: 'You must select a customer',
  }),
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
/**
 * Form for linking a request to an existing customer
 */
export const LinkToCustomerForm: React.FC<LinkToCustomerFormProps> = ({
  requestId,
  onClose,
}) => {
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Customer search - Always enabled, search with empty string will return all customers
  // limited by the limit parameter
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => CustomerClient.getCustomers({ 
      search: searchQuery, 
      limit: 10,
      sortBy: 'name',
      sortDirection: 'asc'
    }),
    enabled: true, // Always enabled
  });

  // Fix: Explicitly type the useForm result to match the expected type for Form component
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: '',
    },
  });

  const selectedCustomerId = form.watch('customerId');
  
  // Handle the PaginationResult structure
  // Helper function to safely find customer by ID
  const findCustomerById = (id: number): any => {
    if (!id) return null;
    
    // Try the nested data structure first
    if (customers?.data?.data && Array.isArray(customers.data.data)) {
      const found = customers.data.data.find((c: any) => c.id === id);
      if (found) return found;
    }
    
    // Try the direct data array next
    if (customers?.data && Array.isArray(customers.data)) {
      const found = customers.data.find((c: any) => c.id === id);
      if (found) return found;
    }
    
    return null;
  };
  
  // Use our safer helper function
  const selectedCustomer = findCustomerById(selectedCustomerId);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLinking(true);
      
      console.log("Linking request to customer:", { 
        requestId, 
        customerId: data.customerId, 
        note: data.note 
      });
      
      // Use the RequestService to link the request to a customer
      const response = await RequestService.linkToCustomer(
        requestId,
        data.customerId,
        data.note
      );
      
      console.log("Link response:", response);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Request successfully linked to customer",
          variant: "success"
        });
        onClose();
        // Force a router refresh to show the updated data
        router.refresh();
      } else {
        console.error("API Error:", response);
        toast({
          title: "Error",
          description: response.message || "Failed to link customer",
          variant: "error"
        });
      }
    } catch (error) {
      console.error("Error linking customer:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "error"
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    // Use FormProvider instead of the Form component with form tag nesting
    <FormProvider {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Customer</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? selectedCustomer
                          ? selectedCustomer.name
                          : "Select customer"
                        : "Select customer"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search customers..." 
                      onValueChange={(value) => {
                        setSearchQuery(value);
                      }}
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingCustomers ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Searching...
                          </div>
                        ) : (
                          "No customers found."
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {Array.isArray(customers?.data?.data) 
                        ? customers.data.data.map((customer: any) => (
                          <CommandItem
                            value={customer.name || `customer-${customer.id}`}
                            key={customer.id}
                            onSelect={() => {
                              form.setValue("customerId", customer.id);
                              setOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{customer.name}</span>
                              {customer.email && (
                                <span className="text-xs text-muted-foreground">
                                  {customer.email}
                                </span>
                              )}
                            </div>
                            <CheckIcon
                              className={cn(
                                "ml-auto h-4 w-4",
                                customer.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))
                        : Array.isArray(customers?.data)
                          ? customers.data.map((customer: any) => (
                            <CommandItem
                              value={customer.name || `customer-${customer.id}`}
                              key={customer.id}
                              onSelect={() => {
                                form.setValue("customerId", customer.id);
                                setOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{customer.name}</span>
                                {customer.email && (
                                  <span className="text-xs text-muted-foreground">
                                    {customer.email}
                                  </span>
                                )}
                              </div>
                              <CheckIcon
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  customer.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))
                          : null
                      }
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Note about linking (optional)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isLinking || !selectedCustomerId}
          >
            {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Link to Customer
          </Button>
        </div>
      </div>
    </FormProvider>
  );
};
