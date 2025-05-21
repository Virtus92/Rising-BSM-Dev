import React, { useState } from 'react';
import { useForm, ControllerRenderProps, FieldPath, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { ConvertToCustomerDto, RequestDetailResponseDto } from '@/domain/dtos/RequestDtos';
import { useToast } from '@/shared/hooks/useToast';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { RequestService } from '@/features/requests/lib/services';
import { useRouter } from 'next/navigation';
import { CustomerType } from '@/domain/enums/CommonEnums';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string(),
  type: z.enum([
    CustomerType.PRIVATE, 
    CustomerType.BUSINESS, 
    CustomerType.INDIVIDUAL, 
    CustomerType.GOVERNMENT, 
    CustomerType.NON_PROFIT
  ]),
  newsletter: z.boolean(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConvertToCustomerFormProps {
  request: RequestDetailResponseDto;
  onClose: () => void;
}

/**
 * Form for converting a contact request to a customer
 */
export const ConvertToCustomerForm: React.FC<ConvertToCustomerFormProps> = ({
  request,
  onClose,
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCustomerId, setCreatedCustomerId] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Default values from the request
  const defaultValues: Partial<FormValues> = {
    name: request.name || '',
    email: request.email || '',
    phone: request.phone || '',
    company: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Germany',
    type: CustomerType.PRIVATE,
    newsletter: false,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsConverting(true);
      
      // Create the data object for conversion
      const convertData: ConvertToCustomerDto = {
        requestId: request.id,
        customerData: {
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone ? data.phone.trim() : undefined,
          company: data.company ? data.company.trim() : undefined,
          address: data.address ? data.address.trim() : undefined,
          postalCode: data.postalCode ? data.postalCode.trim() : undefined,
          city: data.city ? data.city.trim() : undefined,
          country: data.country.trim(),
          type: data.type,
          newsletter: data.newsletter,
        },
        note: data.note ? data.note.trim() : undefined,
        createAppointment: false, // Always false - appointments are only created from customers
      };

      // Use the RequestService to convert the request to a customer
      const response = await RequestService.convertToCustomer(convertData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Customer created successfully",
          variant: "success"
        });
        
        // Extract the customer ID from the response and save it
        if (response.data?.customer?.id) {
          setCreatedCustomerId(response.data.customer.id);
        }
        
        // Show success dialog
        setShowSuccess(true);
      } else {
        console.error("API Error:", response);
        toast({
          title: "Error",
          description: response.message || "Failed to convert request to customer",
          variant: "error"
        });
      }
    } catch (error) {
      console.error("Error converting to customer:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "error"
      });
    } finally {
      setIsConverting(false);
    }
  };
  
  // Handle navigation to the created customer
  const handleGoToCustomer = () => {
    if (createdCustomerId) {
      router.push(`/dashboard/customers/${createdCustomerId}`);
    } else {
      onClose();
      router.refresh();
    }
  };

  // If showing success UI
  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full mb-4">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Success!</h2>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
          The request has been converted to a customer successfully.
        </p>
        <Button onClick={handleGoToCustomer}>
          Go to Customer
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Customer Data */}
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: ControllerRenderProps<FormValues, "name"> }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: ControllerRenderProps<FormValues, "email"> }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }: { field: ControllerRenderProps<FormValues, "phone"> }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }: { field: ControllerRenderProps<FormValues, "company"> }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Company" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }: { field: ControllerRenderProps<FormValues, "address"> }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }: { field: ControllerRenderProps<FormValues, "postalCode"> }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Postal Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }: { field: ControllerRenderProps<FormValues, "city"> }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }: { field: ControllerRenderProps<FormValues, "country"> }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }: { field: ControllerRenderProps<FormValues, "type"> }) => (
                <FormItem>
                  <FormLabel>Customer Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CustomerType.PRIVATE}>Private</SelectItem>
                      <SelectItem value={CustomerType.BUSINESS}>Business</SelectItem>
                      <SelectItem value={CustomerType.INDIVIDUAL}>Individual</SelectItem>
                      <SelectItem value={CustomerType.GOVERNMENT}>Government</SelectItem>
                      <SelectItem value={CustomerType.NON_PROFIT}>Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newsletter"
              render={({ field }: { field: ControllerRenderProps<FormValues, "newsletter"> }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Newsletter</FormLabel>
                    <FormDescription>
                      Customer receives newsletters and offers
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Note */}
          <FormField
            control={form.control}
            name="note"
            render={({ field }: { field: ControllerRenderProps<FormValues, "note"> }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Note about conversion (optional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isConverting}
          >
            {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert to Customer
          </Button>
        </div>
      </div>
    </FormProvider>
  );
};