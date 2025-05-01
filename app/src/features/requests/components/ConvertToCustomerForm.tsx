import React, { useState } from 'react';
import { useForm, ControllerRenderProps, FieldPath } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';

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
  type: z.enum(['private', 'business']),
  newsletter: z.boolean(),
  note: z.string().optional(),
  createAppointment: z.boolean(),
  appointmentTitle: z.string().optional(),
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  appointmentDuration: z.coerce.number().optional(),
  appointmentLocation: z.string().optional(),
  appointmentDescription: z.string().optional(),
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
  const [showAppointmentFields, setShowAppointmentFields] = useState(false);
  const { toast } = useToast();

  // Default values from the request
  const defaultValues: Partial<FormValues> = {
    name: request.name,
    email: request.email,
    phone: request.phone || '',
    company: '',
    country: 'Germany',
    type: 'private',
    newsletter: false,
    createAppointment: false,
    appointmentTitle: `Appointment with ${request.name}`,
    appointmentDescription: request.message,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const watchCreateAppointment = form.watch('createAppointment');
  // Update state when createAppointment changes
  React.useEffect(() => {
    setShowAppointmentFields(watchCreateAppointment);
  }, [watchCreateAppointment]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsConverting(true);
      
      const convertData: ConvertToCustomerDto = {
        requestId: request.id,
        customerData: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          address: data.address,
          postalCode: data.postalCode,
          city: data.city,
          country: data.country,
          type: data.type,
          newsletter: data.newsletter,
        },
        note: data.note,
        createAppointment: data.createAppointment,
      };

      // If creating an appointment, add appointment data
      if (data.createAppointment) {
        if (!data.appointmentDate || !data.appointmentTime) {
          toast({
            title: "Error",
            description: "Appointment date and time are required",
            variant: "error"
          });
          setIsConverting(false);
          return;
        }

        convertData.appointmentData = {
          title: data.appointmentTitle || `Appointment with ${data.name}`,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          duration: data.appointmentDuration || 60,
          location: data.appointmentLocation,
          description: data.appointmentDescription,
        };
      }

      console.log("Sending conversion request:", convertData);
      
      // Call the API endpoint explicitly
      const response = await fetch(`/api/requests/${request.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(convertData),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Success",
          description: data.createAppointment 
            ? "Customer created with appointment" 
            : "Customer created successfully",
          variant: "success"
        });
        // Close dialog and trigger refresh
        onClose();
      } else {
        console.error("API Error:", result);
        toast({
          title: "Error",
          description: result.message || "Failed to convert request to customer",
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

  return (
    <Form {...form as any}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
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

          <Separator />

          {/* Create Appointment */}
          <FormField
            control={form.control}
            name="createAppointment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Create Appointment</FormLabel>
                  <FormDescription>
                    Create an appointment for this customer
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Appointment fields (only show if appointment should be created) */}
          {showAppointmentFields && (
            <div className="space-y-3 mt-3 border p-3 rounded-md">
              <FormField
                control={form.control}
                name="appointmentTitle"
                render={({ field }: { field: ControllerRenderProps<FormValues, "appointmentTitle"> }) => (
                  <FormItem>
                    <FormLabel>Appointment Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Appointment title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "appointmentDate"> }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointmentTime"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "appointmentTime"> }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="appointmentDuration"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "appointmentDuration"> }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointmentLocation"
                  render={({ field }: { field: ControllerRenderProps<FormValues, "appointmentLocation"> }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="appointmentDescription"
                render={({ field }: { field: ControllerRenderProps<FormValues, "appointmentDescription"> }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Appointment description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isConverting}>
            {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert to Customer
          </Button>
        </div>
      </form>
    </Form>
  );
};
