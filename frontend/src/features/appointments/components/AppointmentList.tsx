import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/components/ui/table';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { Button } from '@/shared/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Eye 
} from 'lucide-react';
import { useAppointments } from '../hooks/useAppointments';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';

export const AppointmentList = () => {
  const { appointments, isLoading, error, deleteAppointment } = useAppointments();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell>{appointment.customerName}</TableCell>
            <TableCell>{appointment.title}</TableCell>
            <TableCell>
              {new Date(appointment.appointmentDate).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {appointment.appointmentTime}
            </TableCell>
            <TableCell>
              <Badge 
                variant={
                  appointment.status === AppointmentStatus.COMPLETED ? 'default' : 
                  appointment.status === AppointmentStatus.CONFIRMED ? 'secondary' : 
                  'destructive'
                }
              >
                {appointment.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  title="Edit Appointment"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  title="Delete Appointment"
                  onClick={() => deleteAppointment(Number(appointment.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
