import React, { useState } from 'react';
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
export const CreateAppointmentForm: React.FC<CreateAppointmentFormProps> = ({
  request,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
        // Pass date and time separately as expected by the backend
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
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
      
      // Make the API call directly with fetch
      const response = await fetch(`/api/requests/${request.id}/appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: 'Appointment created successfully',
          variant: 'success'
        });
        onClose();
      } else {
        console.error("API Error:", result);
        toast({
          title: 'Error',
          description: result.message || 'Failed to create appointment',
          variant: 'error'
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
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Appointment
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
