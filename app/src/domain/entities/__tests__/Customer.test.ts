import { Customer, CustomerType, CommonStatus } from '../Customer';

describe('Customer', () => {
  let customer: Customer;
  const defaultCustomerId = 1;
  const defaultCustomerData = {
    id: defaultCustomerId,
    name: 'Max Mustermann',
    email: 'max@example.com',
    phone: '0123456789',
    address: 'Musterstraße 1',
    postalCode: '12345',
    city: 'Musterstadt',
    country: 'Deutschland',
    type: CustomerType.PRIVATE,
    status: CommonStatus.ACTIVE,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };
  
  beforeEach(() => {
    customer = new Customer(defaultCustomerData);
  });
  
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const emptyCustomer = new Customer();
      
      expect(emptyCustomer.name).toBe('');
      expect(emptyCustomer.country).toBe('Deutschland');
      expect(emptyCustomer.newsletter).toBe(false);
      expect(emptyCustomer.status).toBe(CommonStatus.ACTIVE);
      expect(emptyCustomer.type).toBe(CustomerType.PRIVATE);
    });
    
    it('should initialize with provided values', () => {
      expect(customer.id).toBe(defaultCustomerId);
      expect(customer.name).toBe('Max Mustermann');
      expect(customer.email).toBe('max@example.com');
      expect(customer.phone).toBe('0123456789');
      expect(customer.address).toBe('Musterstraße 1');
      expect(customer.postalCode).toBe('12345');
      expect(customer.city).toBe('Musterstadt');
      expect(customer.country).toBe('Deutschland');
      expect(customer.type).toBe(CustomerType.PRIVATE);
      expect(customer.status).toBe(CommonStatus.ACTIVE);
    });
  });
  
  describe('getFullAddress', () => {
    it('should return formatted full address', () => {
      expect(customer.getFullAddress()).toBe('Musterstraße 1, 12345 Musterstadt, Deutschland');
    });
    
    it('should handle missing address parts', () => {
      customer.address = undefined;
      expect(customer.getFullAddress()).toBe('12345 Musterstadt, Deutschland');
      
      customer.postalCode = undefined;
      expect(customer.getFullAddress()).toBe('Musterstadt, Deutschland');
      
      customer.city = undefined;
      expect(customer.getFullAddress()).toBe('Deutschland');
    });
    
    it('should correctly format address when city is present but postalCode is not', () => {
      customer.postalCode = undefined;
      expect(customer.getFullAddress()).toBe('Musterstraße 1, Musterstadt, Deutschland');
    });
  });
  
  describe('getContactInfo', () => {
    it('should return contact information', () => {
      const contactInfo = customer.getContactInfo();
      expect(contactInfo).toEqual({
        email: 'max@example.com',
        phone: '0123456789'
      });
    });
    
    it('should handle missing contact information', () => {
      customer.email = undefined;
      customer.phone = undefined;
      
      const contactInfo = customer.getContactInfo();
      expect(contactInfo).toEqual({
        email: undefined,
        phone: undefined
      });
    });
  });
  
  describe('status related methods', () => {
    it('isActive should return true for active customers', () => {
      customer.status = CommonStatus.ACTIVE;
      expect(customer.isActive()).toBe(true);
    });
    
    it('isActive should return false for inactive customers', () => {
      customer.status = CommonStatus.INACTIVE;
      expect(customer.isActive()).toBe(false);
    });
    
    it('updateStatus should update the status and audit data', () => {
      const updatedBy = 2;
      jest.spyOn(customer, 'updateAuditData');
      
      customer.updateStatus(CommonStatus.INACTIVE, updatedBy);
      
      expect(customer.status).toBe(CommonStatus.INACTIVE);
      expect(customer.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('deactivate should set status to INACTIVE', () => {
      const updatedBy = 2;
      jest.spyOn(customer, 'updateStatus');
      
      customer.deactivate(updatedBy);
      
      expect(customer.updateStatus).toHaveBeenCalledWith(CommonStatus.INACTIVE, updatedBy);
    });
    
    it('activate should set status to ACTIVE', () => {
      const updatedBy = 2;
      jest.spyOn(customer, 'updateStatus');
      
      customer.activate(updatedBy);
      
      expect(customer.updateStatus).toHaveBeenCalledWith(CommonStatus.ACTIVE, updatedBy);
    });
    
    it('softDelete should set status to DELETED', () => {
      const updatedBy = 2;
      jest.spyOn(customer, 'updateStatus');
      
      customer.softDelete(updatedBy);
      
      expect(customer.updateStatus).toHaveBeenCalledWith(CommonStatus.DELETED, updatedBy);
    });
  });
  
  describe('type related methods', () => {
    it('isBusiness should return true for business customers', () => {
      customer.type = CustomerType.BUSINESS;
      expect(customer.isBusiness()).toBe(true);
    });
    
    it('isBusiness should return false for private customers', () => {
      customer.type = CustomerType.PRIVATE;
      expect(customer.isBusiness()).toBe(false);
    });
  });
  
  describe('update', () => {
    it('should update only defined properties', () => {
      const updateData = {
        name: 'Erika Musterfrau',
        email: 'erika@example.com'
      };
      
      const originalPhone = customer.phone;
      const originalAddress = customer.address;
      
      jest.spyOn(customer, 'updateAuditData');
      const updatedBy = 2;
      
      customer.update(updateData, updatedBy);
      
      expect(customer.name).toBe(updateData.name);
      expect(customer.email).toBe(updateData.email);
      // Properties not in updateData should remain unchanged
      expect(customer.phone).toBe(originalPhone);
      expect(customer.address).toBe(originalAddress);
      expect(customer.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should return the customer instance for chaining', () => {
      const result = customer.update({ name: 'New Name' });
      expect(result).toBe(customer);
    });
  });
  
  describe('updateNewsletterSubscription', () => {
    it('should update newsletter subscription and audit data', () => {
      jest.spyOn(customer, 'updateAuditData');
      const updatedBy = 2;
      
      customer.newsletter = false;
      customer.updateNewsletterSubscription(true, updatedBy);
      
      expect(customer.newsletter).toBe(true);
      expect(customer.updateAuditData).toHaveBeenCalledWith(updatedBy);
    });
    
    it('should return the customer instance for chaining', () => {
      const result = customer.updateNewsletterSubscription(true);
      expect(result).toBe(customer);
    });
  });
  
  describe('email validation', () => {
    it('should validate correct email formats', () => {
      customer.email = 'test@example.com';
      expect(customer.isValidEmail()).toBe(true);
      
      customer.email = 'user.name+tag@example.co.uk';
      expect(customer.isValidEmail()).toBe(true);
    });
    
    it('should reject invalid email formats', () => {
      customer.email = 'not-an-email';
      expect(customer.isValidEmail()).toBe(false);
      
      customer.email = 'missing@domain';
      expect(customer.isValidEmail()).toBe(false);
      
      customer.email = '@missing-username.com';
      expect(customer.isValidEmail()).toBe(false);
    });
    
    it('should consider empty email as valid', () => {
      customer.email = undefined;
      expect(customer.isValidEmail()).toBe(true);
      
      customer.email = '';
      expect(customer.isValidEmail()).toBe(true);
    });
  });
  
  describe('toObject', () => {
    it('should convert to plain object with extended properties', () => {
      const obj = customer.toObject();
      
      // Base properties
      expect(obj).toHaveProperty('id', customer.id);
      expect(obj).toHaveProperty('createdAt', customer.createdAt);
      expect(obj).toHaveProperty('updatedAt', customer.updatedAt);
      
      // Customer specific properties
      expect(obj).toHaveProperty('name', customer.name);
      expect(obj).toHaveProperty('email', customer.email);
      expect(obj).toHaveProperty('phone', customer.phone);
      expect(obj).toHaveProperty('address', customer.address);
      expect(obj).toHaveProperty('postalCode', customer.postalCode);
      expect(obj).toHaveProperty('city', customer.city);
      expect(obj).toHaveProperty('country', customer.country);
      expect(obj).toHaveProperty('status', customer.status);
      expect(obj).toHaveProperty('type', customer.type);
      expect(obj).toHaveProperty('newsletter', customer.newsletter);
      
      // Computed properties
      expect(obj).toHaveProperty('fullAddress', customer.getFullAddress());
    });
  });
});
