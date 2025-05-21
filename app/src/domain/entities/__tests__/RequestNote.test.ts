import { RequestNote } from '../RequestNote';

describe('RequestNote', () => {
  let requestNote: RequestNote;
  const defaultId = 1;
  const defaultRequestNoteValues = {
    id: defaultId,
    requestId: 123,
    userId: 456,
    userName: 'John Doe',
    text: 'This is a note about the contact request.',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    requestNote = new RequestNote(defaultRequestNoteValues);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyNote = new RequestNote();
      
      expect(emptyNote.requestId).toBe(0);
      expect(emptyNote.userId).toBe(0);
      expect(emptyNote.userName).toBe('');
      expect(emptyNote.text).toBe('');
    });
    
    it('should initialize with provided values', () => {
      expect(requestNote.id).toBe(defaultId);
      expect(requestNote.requestId).toBe(123);
      expect(requestNote.userId).toBe(456);
      expect(requestNote.userName).toBe('John Doe');
      expect(requestNote.text).toBe('This is a note about the contact request.');
    });
  });
  
  describe('updateText method', () => {
    it('should update the text and audit data', () => {
      const newText = 'Updated note text';
      const updatedBy = 789;
      
      jest.spyOn(requestNote, 'updateAuditData');
      
      requestNote.updateText(newText, updatedBy);
      
      expect(requestNote.text).toBe(newText);
      expect(requestNote.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should return the instance for chaining', () => {
      const result = requestNote.updateText('New text');
      expect(result).toBe(requestNote);
    });
  });
  
  describe('toObject method', () => {
    it('should convert to plain object with all properties', () => {
      const obj = requestNote.toObject();
      
      // Base properties
      expect(obj).toHaveProperty('id', requestNote.id);
      expect(obj).toHaveProperty('createdAt', requestNote.createdAt);
      expect(obj).toHaveProperty('updatedAt', requestNote.updatedAt);
      
      // RequestNote specific properties
      expect(obj).toHaveProperty('requestId', requestNote.requestId);
      expect(obj).toHaveProperty('userId', requestNote.userId);
      expect(obj).toHaveProperty('userName', requestNote.userName);
      expect(obj).toHaveProperty('text', requestNote.text);
    });
  });
});