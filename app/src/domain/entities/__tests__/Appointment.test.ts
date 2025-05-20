import { Appointment } from '../Appointment';
import { AppointmentStatus } from '../../enums/CommonEnums';
import { Customer, CustomerType, CommonStatus } from '../Customer';

describe('Appointment', () => {
  let appointment: Appointment;
  const defaultAppointmentId = 1;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const defaultAppointmentData = {
    id: defaultAppointmentId,
    title: 'Beratungsgespräch',
    customerId: 2,
    appointmentDate: tomorrow,
    duration: 60,
    location: 'Büro',
    description: 'Erstgespräch mit dem Kunden',
    status: AppointmentStatus.PLANNED,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    appointment = new Appointment(defaultAppointmentData);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyAppointment = new Appointment();
      
      expect(emptyAppointment.title).toBe('');
      expect(emptyAppointment.appointmentDate).toBeInstanceOf(Date);
      expect(emptyAppointment.status).toBe(AppointmentStatus.PLANNED);
      expect(emptyAppointment.notes).toEqual([]);
    });
    
    it('should initialize with provided values', () => {
      expect(appointment.id).toBe(defaultAppointmentId);
      expect(appointment.title).toBe('Beratungsgespräch');
      expect(appointment.customerId).toBe(2);
      expect(appointment.appointmentDate).toEqual(tomorrow);
      expect(appointment.duration).toBe(60);
      expect(appointment.location).toBe('Büro');
      expect(appointment.description).toBe('Erstgespräch mit dem Kunden');
      expect(appointment.status).toBe(AppointmentStatus.PLANNED);
    });
    
    it('should convert date strings to Date objects', () => {
      const dateString = '2023-06-15T10:00:00.000Z';
      const appointment = new Appointment({
        appointmentDate: dateString as any
      });
      
      expect(appointment.appointmentDate).toBeInstanceOf(Date);
      expect(appointment.appointmentDate.toISOString()).toBe(dateString);
    });
    
    it('should initialize customer and customerName from provided values', () => {
      const customer = new Customer({
        id: 2,
        name: 'Max Mustermann'
      });
      
      const appointmentWithCustomer = new Appointment({
        customer
      });
      
      expect(appointmentWithCustomer.customer).toBe(customer);
      expect(appointmentWithCustomer.customerName).toBe('Max Mustermann');
    });
  });
  
  describe('status related methods', () => {
    it('isConfirmed should return true for confirmed appointments', () => {
      appointment.status = AppointmentStatus.CONFIRMED;
      expect(appointment.isConfirmed()).toBe(true);
    });
    
    it('isConfirmed should return false for non-confirmed appointments', () => {
      appointment.status = AppointmentStatus.PLANNED;
      expect(appointment.isConfirmed()).toBe(false);
    });
    
    it('isCompleted should return true for completed appointments', () => {
      appointment.status = AppointmentStatus.COMPLETED;
      expect(appointment.isCompleted()).toBe(true);
    });
    
    it('isCompleted should return false for non-completed appointments', () => {
      appointment.status = AppointmentStatus.PLANNED;
      expect(appointment.isCompleted()).toBe(false);
    });
    
    it('isCancelled should return true for cancelled appointments', () => {
      appointment.status = AppointmentStatus.CANCELLED;
      expect(appointment.isCancelled()).toBe(true);
    });
    
    it('isCancelled should return false for non-cancelled appointments', () => {
      appointment.status = AppointmentStatus.PLANNED;
      expect(appointment.isCancelled()).toBe(false);
    });
    
    it('isRescheduled should return true for rescheduled appointments', () => {
      appointment.status = AppointmentStatus.RESCHEDULED;
      expect(appointment.isRescheduled()).toBe(true);
    });
    
    it('isRescheduled should return false for non-rescheduled appointments', () => {
      appointment.status = AppointmentStatus.PLANNED;
      expect(appointment.isRescheduled()).toBe(false);
    });
    
    it('updateStatus should update the status and audit data', () => {
      const updatedBy = 2;
      jest.spyOn(appointment, 'updateAuditData');
      
      appointment.updateStatus(AppointmentStatus.CONFIRMED, updatedBy);
      
      expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
      expect(appointment.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('confirm should set status to CONFIRMED', () => {
      const updatedBy = 2;
      jest.spyOn(appointment, 'updateStatus');
      
      appointment.confirm(updatedBy);
      
      expect(appointment.updateStatus).toHaveBeenCalledWith(AppointmentStatus.CONFIRMED, updatedBy);
    });
    
    it('complete should set status to COMPLETED', () => {
      const updatedBy = 2;
      jest.spyOn(appointment, 'updateStatus');
      
      appointment.complete(updatedBy);
      
      expect(appointment.updateStatus).toHaveBeenCalledWith(AppointmentStatus.COMPLETED, updatedBy);
    });
    
    it('cancel should set status to CANCELLED', () => {
      const updatedBy = 2;
      jest.spyOn(appointment, 'updateStatus');
      
      appointment.cancel(updatedBy);
      
      expect(appointment.updateStatus).toHaveBeenCalledWith(AppointmentStatus.CANCELLED, updatedBy);
    });
    
    it('reschedule should set status to RESCHEDULED', () => {
      const updatedBy = 2;
      jest.spyOn(appointment, 'updateStatus');
      
      appointment.reschedule(updatedBy);
      
      expect(appointment.updateStatus).toHaveBeenCalledWith(AppointmentStatus.RESCHEDULED, updatedBy);
    });
  });
  
  describe('update', () => {
    it('should update only defined properties', () => {
      const updateData = {
        title: 'Nachbesprechung',
        description: 'Besprechung der Ergebnisse'
      };
      
      const originalCustomerId = appointment.customerId;
      const originalLocation = appointment.location;
      
      jest.spyOn(appointment, 'updateAuditData');
      const updatedBy = 2;
      
      appointment.update(updateData, updatedBy);
      
      expect(appointment.title).toBe(updateData.title);
      expect(appointment.description).toBe(updateData.description);
      // Properties not in updateData should remain unchanged
      expect(appointment.customerId).toBe(originalCustomerId);
      expect(appointment.location).toBe(originalLocation);
      expect(appointment.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should convert appointmentDate string to Date object', () => {
      const dateString = '2023-06-15T10:00:00.000Z';
      appointment.update({
        appointmentDate: dateString as any
      });
      
      expect(appointment.appointmentDate).toBeInstanceOf(Date);
      expect(appointment.appointmentDate.toISOString()).toBe(dateString);
    });
    
    it('should return the appointment instance for chaining', () => {
      const result = appointment.update({ title: 'New Title' });
      expect(result).toBe(appointment);
    });
  });
  
  describe('time related methods', () => {
    it('isPast should return true for past appointments', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      appointment.appointmentDate = yesterday;
      
      expect(appointment.isPast()).toBe(true);
    });
    
    it('isPast should return false for future appointments', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      appointment.appointmentDate = tomorrow;
      
      expect(appointment.isPast()).toBe(false);
    });
    
    it('isToday should return true for appointments today', () => {
      const today = new Date();
      appointment.appointmentDate = today;
      
      expect(appointment.isToday()).toBe(true);
    });
    
    it('isToday should return false for appointments not today', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      appointment.appointmentDate = tomorrow;
      
      expect(appointment.isToday()).toBe(false);
    });
  });
  
  describe('customer related methods', () => {
    it('getCustomerName should return customer name from customer object', () => {
      const customer = new Customer({
        id: 2,
        name: 'Max Mustermann'
      });
      
      appointment.customer = customer;
      
      expect(appointment.getCustomerName()).toBe('Max Mustermann');
    });
    
    it('getCustomerName should return customerName property if no customer object', () => {
      appointment.customer = undefined;
      appointment.customerName = 'Max Mustermann';
      
      expect(appointment.getCustomerName()).toBe('Max Mustermann');
    });
    
    it('getCustomerName should return empty string if no customer info available', () => {
      appointment.customer = undefined;
      appointment.customerName = undefined;
      
      expect(appointment.getCustomerName()).toBe('');
    });
    
    it('getCustomer should return the customer object', () => {
      const customer = new Customer({
        id: 2,
        name: 'Max Mustermann'
      });
      
      appointment.customer = customer;
      
      expect(appointment.getCustomer()).toBe(customer);
    });
  });
  
  describe('toObject', () => {
    it('should convert to plain object with extended properties', () => {
      const obj = appointment.toObject();
      
      // Base properties
      expect(obj).toHaveProperty('id', appointment.id);
      expect(obj).toHaveProperty('createdAt', appointment.createdAt);
      expect(obj).toHaveProperty('updatedAt', appointment.updatedAt);
      
      // Appointment specific properties
      expect(obj).toHaveProperty('title', appointment.title);
      expect(obj).toHaveProperty('customerId', appointment.customerId);
      expect(obj).toHaveProperty('appointmentDate', appointment.appointmentDate);
      expect(obj).toHaveProperty('duration', appointment.duration);
      expect(obj).toHaveProperty('location', appointment.location);
      expect(obj).toHaveProperty('description', appointment.description);
      expect(obj).toHaveProperty('status', appointment.status);
      expect(obj).toHaveProperty('notes', appointment.notes);
    });
    
    it('should include customerName in the object', () => {
      const customer = new Customer({
        id: 2,
        name: 'Max Mustermann'
      });
      
      appointment.customer = customer;
      
      const obj = appointment.toObject();
      expect(obj).toHaveProperty('customerName', 'Max Mustermann');
    });
  });
});
