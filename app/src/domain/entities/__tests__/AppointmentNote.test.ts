import { AppointmentNote } from '../AppointmentNote';

describe('AppointmentNote', () => {
  let appointmentNote: AppointmentNote;
  const defaultId = 1;
  const defaultAppointmentNoteValues = {
    id: defaultId,
    appointmentId: 123,
    userId: 456,
    userName: 'John Doe',
    text: 'This is a note about the appointment.',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    appointmentNote = new AppointmentNote(defaultAppointmentNoteValues);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyNote = new AppointmentNote();
      
      expect(emptyNote.appointmentId).toBe(0);
      expect(emptyNote.userId).toBe(0);
      expect(emptyNote.userName).toBe('');
      expect(emptyNote.text).toBe('');
    });
    
    it('should initialize with provided values', () => {
      expect(appointmentNote.id).toBe(defaultId);
      expect(appointmentNote.appointmentId).toBe(123);
      expect(appointmentNote.userId).toBe(456);
      expect(appointmentNote.userName).toBe('John Doe');
      expect(appointmentNote.text).toBe('This is a note about the appointment.');
    });
  });
  
  describe('updateText method', () => {
    it('should update the text and audit data', () => {
      const newText = 'Updated note text';
      const updatedBy = 789;
      
      jest.spyOn(appointmentNote, 'updateAuditData');
      
      appointmentNote.updateText(newText, updatedBy);
      
      expect(appointmentNote.text).toBe(newText);
      expect(appointmentNote.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should return the instance for chaining', () => {
      const result = appointmentNote.updateText('New text');
      expect(result).toBe(appointmentNote);
    });
  });
  
  describe('toObject method', () => {
    it('should convert to plain object with all properties', () => {
      const obj = appointmentNote.toObject();
      
      // Base properties
      expect(obj).toHaveProperty('id', appointmentNote.id);
      expect(obj).toHaveProperty('createdAt', appointmentNote.createdAt);
      expect(obj).toHaveProperty('updatedAt', appointmentNote.updatedAt);
      
      // AppointmentNote specific properties
      expect(obj).toHaveProperty('appointmentId', appointmentNote.appointmentId);
      expect(obj).toHaveProperty('userId', appointmentNote.userId);
      expect(obj).toHaveProperty('userName', appointmentNote.userName);
      expect(obj).toHaveProperty('text', appointmentNote.text);
    });
  });
});