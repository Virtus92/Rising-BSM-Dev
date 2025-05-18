import React, { useState, useEffect } from 'react';
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
export const LinkToCustomerForm: React.FC<LinkToCustomerFormProps> = ({
  requestId,
  onClose,
}) => {
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<any>(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Function to fetch customers directly without React Query
  const fetchCustomers = async (query: string) => {
    try {
      setIsLoadingCustomers(true);
      const response = await CustomerClient.getCustomers({
        search: query,
        limit: 10,
        sortBy: 'name',
        sortDirection: 'asc'
      });
      setCustomers(response);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Fetch customers on initial load and when search query changes
  useEffect(() => {
    fetchCustomers(searchQuery);
  }, [searchQuery]);

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

  // Debug logging to diagnose customer selection issues
  useEffect(() => {
    if (customers) {
      console.log('Customer data loaded:', {
        hasData: !!customers,
        customerCount: customers?.data?.data?.length || customers?.data?.length || 0,
        selectedId: selectedCustomerId,
        selectedCustomer
      });
    }
  }, [customers, selectedCustomerId, selectedCustomer]);

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
                      onClick={() => {
                        // Make sure the popover opens when clicked
                        setOpen(true);
                        // Fetch customers if they haven't been fetched yet
                        if (!customers) {
                          fetchCustomers('');
                        }
                      }}
                      className={cn(
                        "w-full justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
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
                        {/* Improved customer rendering with better data handling */}
                        {Array.isArray(customers?.data?.data) 
                          ? customers.data.data.map((customer: any) => (
                            <CommandItem
                              value={customer.name || `customer-${customer.id}`}
                              key={customer.id}
                              onSelect={() => {
                                console.log("Customer selected:", customer);
                                form.setValue("customerId", customer.id);
                                setOpen(false);
                              }}
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.name}</span>
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
                                console.log("Customer selected:", customer);
                                form.setValue("customerId", customer.id);
                                setOpen(false);
                              }}
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.name}</span>
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
                        {/* Show a message if no customers are available but not loading */}
                        {!isLoadingCustomers && 
                          !Array.isArray(customers?.data?.data) && 
                          !Array.isArray(customers?.data) && (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              Click to search for customers
                            </div>
                        )}
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
