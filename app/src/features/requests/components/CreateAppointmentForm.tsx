import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
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
import { RequestDetailResponseDto } from '@/domain/dtos/RequestDtos';
import { useToast } from '@/shared/hooks/useToast';
import { format, addDays } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { AppointmentService } from '@/features/appointments/lib/services';
import { RequestService } from '@/features/requests/lib/services';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  appointmentDate: z.string().min(1, 'Date is required'),
  appointmentTime: z.string().min(1, 'Time is required'),
  duration: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.string(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateAppointmentFormProps {
  request: RequestDetailResponseDto;
  onClose: () => void;
}

/**
 * Form for creating an appointment from a request
 */
/**
 * Form for creating an appointment from a request
 */
export const CreateAppointmentForm: React.FC<CreateAppointmentFormProps> = ({
  request,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Default values
  const tomorrow = addDays(new Date(), 1);
  const defaultValues: Partial<FormValues> = {
    title: `Appointment with ${request.name}`,
    appointmentDate: format(tomorrow, 'yyyy-MM-dd'),
    appointmentTime: '10:00',
    duration: 60,
    location: 'Office',
    description: request.message || '',
    status: 'planned',
    note: '',
  };
  
  // Debug default values
  console.log('Default values:', defaultValues);

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  /**
   * Create the appointment directly through the API using fetch
   */
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      // Create appointment data object with the correct format expected by the API
      const appointmentData = {
        title: data.title,
        duration: data.duration,
        location: data.location,
        description: data.description,
        status: data.status,
        note: data.note
      };
      
      console.log("Creating appointment for request:", {
        requestId: request.id,
        appointmentData
      });
      
      // Format the date and time correctly
      try {
        const dateObj = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
        // Validate the date object
        if (isNaN(dateObj.getTime())) {
          console.error('Invalid date:', {
            date: data.appointmentDate,
            time: data.appointmentTime,
            combined: `${data.appointmentDate}T${data.appointmentTime}`
          });
          toast({
            title: "Error",
            description: `Invalid date or time format. Date: ${data.appointmentDate}, Time: ${data.appointmentTime}. Expected YYYY-MM-DD for date and HH:MM for time.`,
            variant: "error"
          });
          setIsSubmitting(false);
          return;
        }
        
        // Additional safety check for date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^\d{2}:\d{2}$/;
        
        if (!dateRegex.test(data.appointmentDate) || !timeRegex.test(data.appointmentTime)) {
          console.error('Format validation failed:', {
            date: data.appointmentDate,
            time: data.appointmentTime,
            dateValid: dateRegex.test(data.appointmentDate),
            timeValid: timeRegex.test(data.appointmentTime)
          });
          
          toast({
            title: "Error",
            description: "Please ensure the date is in YYYY-MM-DD format and time is in HH:MM format",
            variant: "error"
          });
          setIsSubmitting(false);
          return;
        }
        
        console.log("Combined date and time:", dateObj.toISOString());
        
        // Create a properly formatted appointment data object
        const formattedAppointmentData = {
          ...appointmentData,
          appointmentDate: dateObj.toISOString(), // Use ISO string format for the API
          customerId: request.customerId // Include customer ID if available
        };
        
        console.log("Sending appointment data:", formattedAppointmentData);
      
        // Use RequestService to create an appointment from a request
        const response = await RequestService.createAppointment(
          request.id,
          formattedAppointmentData
        );
        
        console.log("Appointment creation response:", response);
      
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Appointment created successfully',
            variant: 'success'
          });
          onClose();
          // Force a router refresh to show the updated data
          router.refresh();
        } else {
          console.error("API Error:", response);
          toast({
            title: 'Error',
            description: response.message || 'Failed to create appointment',
            variant: 'error'
          });
        }
      } catch (dateError) {
        console.error("Error with date formatting:", dateError);
        toast({
          title: "Error",
          description: "Invalid date format: " + (dateError instanceof Error ? dateError.message : "Unknown error"),
          variant: "error"
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-4">
        <FormField
          control={methods.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Appointment title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={methods.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={methods.control}
            name="appointmentTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time *</FormLabel>
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
            control={methods.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes) *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={methods.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Appointment location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={methods.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description of the appointment"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={methods.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The default status for new appointments is "Planned"
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={methods.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Internal note about the appointment (optional)"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This note will be added as a comment to the request
              </FormDescription>
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
            onClick={methods.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Appointment
          </Button>
        </div>
      </div>
    </FormProvider>
  );
};
