import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { RequestService } from '@/infrastructure/clients/RequestService';
import { useToast } from '@/shared/hooks/useToast';
import { Loader2 } from 'lucide-react';

// Validierungsschema für das Formular
const formSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
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
 * Formular zur Konvertierung einer Kontaktanfrage in einen Kunden
 */
export const ConvertToCustomerForm: React.FC<ConvertToCustomerFormProps> = ({
  request,
  onClose,
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [showAppointmentFields, setShowAppointmentFields] = useState(false);
  const { toast } = useToast();

  // Default-Werte aus der Anfrage
  const defaultValues: Partial<FormValues> = {
    name: request.name,
    email: request.email,
    phone: request.phone || '',
    company: '',
    country: 'Deutschland',
    type: 'private',
    newsletter: false,
    createAppointment: false,
    appointmentTitle: `Termin mit ${request.name}`,
    appointmentDescription: request.message,
  };

  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const watchCreateAppointment = form.watch('createAppointment');
  // Wenn sich createAppointment ändert, aktualisiere den State
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
      
      // Call the service directly
      const response = await RequestService.convertToCustomer(convertData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: data.createAppointment 
            ? "Customer created with appointment" 
            : "Customer created successfully",
          variant: "success"
        });
        onClose();
      } else {
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
        description: "An unexpected error occurred",
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
          {/* Kundendaten */}
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="E-Mail" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma</FormLabel>
                  <FormControl>
                    <Input placeholder="Firma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="Adresse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PLZ</FormLabel>
                    <FormControl>
                      <Input placeholder="PLZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stadt</FormLabel>
                    <FormControl>
                      <Input placeholder="Stadt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Land</FormLabel>
                  <FormControl>
                    <Input placeholder="Land" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kundentyp</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kundentyp auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">Privatkunde</SelectItem>
                      <SelectItem value="business">Geschäftskunde</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newsletter"
              render={({ field }) => (
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
                      Kunde erhält Newsletter und Angebote
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Notiz */}
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notiz</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notiz zur Konvertierung (optional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          {/* Termin erstellen */}
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
                  <FormLabel>Termin erstellen</FormLabel>
                  <FormDescription>
                    Erstellen Sie direkt einen Termin für diesen Kunden
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Terminfelder (nur anzeigen, wenn Termin erstellt werden soll) */}
          {showAppointmentFields && (
            <div className="space-y-3 mt-3 border p-3 rounded-md">
              <FormField
                control={form.control}
                name="appointmentTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termintitel</FormLabel>
                    <FormControl>
                      <Input placeholder="Termintitel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum</FormLabel>
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uhrzeit</FormLabel>
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dauer (Minuten)</FormLabel>
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ort</FormLabel>
                      <FormControl>
                        <Input placeholder="Ort" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="appointmentDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Terminbeschreibung"
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
            Abbrechen
          </Button>
          <Button type="submit" disabled={isConverting}>
            {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            In Kunden konvertieren
          </Button>
        </div>
      </form>
    </Form>
  );
};
