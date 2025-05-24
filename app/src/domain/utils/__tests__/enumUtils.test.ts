import { 
  isValidEnumValue, 
  getValidEnumValue, 
  stringToEnum, 
  getValidStatus,
  getValidCustomerType,
  getValidAppointmentStatus,
  getValidRequestStatus,
  getValidNotificationType
} from '../enumUtils';
import { 
  CommonStatus, 
  CustomerType, 
  AppointmentStatus, 
  RequestStatus, 
  NotificationType 
} from '@/domain/enums/CommonEnums';

describe('EnumUtils', () => {
  // Define a test enum to use in tests
  enum TestEnum {
    VALUE_A = 'a',
    VALUE_B = 'b',
    VALUE_C = 'c'
  }

  describe('isValidEnumValue', () => {
    it('should return true for valid enum values', () => {
      expect(isValidEnumValue(TestEnum, 'a')).toBe(true);
      expect(isValidEnumValue(TestEnum, 'b')).toBe(true);
      expect(isValidEnumValue(TestEnum, 'c')).toBe(true);
    });

    it('should return false for invalid enum values', () => {
      expect(isValidEnumValue(TestEnum, 'd')).toBe(false);
      expect(isValidEnumValue(TestEnum, 'VALUE_A')).toBe(false); // This is the key, not the value
      expect(isValidEnumValue(TestEnum, 123)).toBe(false);
      expect(isValidEnumValue(TestEnum, {})).toBe(false);
    });

    it('should return false for null or undefined values', () => {
      expect(isValidEnumValue(TestEnum, null)).toBe(false);
      expect(isValidEnumValue(TestEnum, undefined)).toBe(false);
    });

    it('should work with real application enums', () => {
      expect(isValidEnumValue(CommonStatus, CommonStatus.ACTIVE)).toBe(true);
      expect(isValidEnumValue(CommonStatus, 'invalid-status')).toBe(false);
      
      expect(isValidEnumValue(CustomerType, CustomerType.INDIVIDUAL)).toBe(true);
      expect(isValidEnumValue(CustomerType, 'invalid-type')).toBe(false);
    });
  });

  describe('getValidEnumValue', () => {
    it('should return the input value if valid', () => {
      expect(getValidEnumValue(TestEnum, 'a', TestEnum.VALUE_C)).toBe('a');
      expect(getValidEnumValue(TestEnum, 'b', TestEnum.VALUE_C)).toBe('b');
    });

    it('should return the default value if input is invalid', () => {
      expect(getValidEnumValue(TestEnum, 'd', TestEnum.VALUE_C)).toBe('c');
      expect(getValidEnumValue(TestEnum, null, TestEnum.VALUE_C)).toBe('c');
      expect(getValidEnumValue(TestEnum, undefined, TestEnum.VALUE_C)).toBe('c');
    });

    it('should work with real application enums', () => {
      expect(getValidEnumValue(CommonStatus, CommonStatus.ACTIVE, CommonStatus.INACTIVE))
        .toBe(CommonStatus.ACTIVE);
      
      expect(getValidEnumValue(CommonStatus, 'invalid', CommonStatus.INACTIVE))
        .toBe(CommonStatus.INACTIVE);
    });
  });

  describe('stringToEnum', () => {
    it('should convert a valid string to the enum value', () => {
      expect(stringToEnum(TestEnum, 'a', TestEnum.VALUE_C)).toBe('a');
      expect(stringToEnum(TestEnum, 'b', TestEnum.VALUE_C)).toBe('b');
    });

    it('should return the default value if string is invalid', () => {
      expect(stringToEnum(TestEnum, 'd', TestEnum.VALUE_C)).toBe('c');
      expect(stringToEnum(TestEnum, '', TestEnum.VALUE_C)).toBe('c');
    });

    it('should return the default value if string is undefined', () => {
      expect(stringToEnum(TestEnum, undefined, TestEnum.VALUE_C)).toBe('c');
    });

    it('should work with real application enums', () => {
      expect(stringToEnum(CommonStatus, 'ACTIVE', CommonStatus.INACTIVE))
        .toBe(CommonStatus.ACTIVE);
      
      expect(stringToEnum(AppointmentStatus, 'PLANNED', AppointmentStatus.CANCELLED))
        .toBe(AppointmentStatus.PLANNED);
    });
  });

  describe('getValidStatus', () => {
    it('should return valid CommonStatus values', () => {
      expect(getValidStatus(CommonStatus.ACTIVE)).toBe(CommonStatus.ACTIVE);
      expect(getValidStatus(CommonStatus.INACTIVE)).toBe(CommonStatus.INACTIVE);
      expect(getValidStatus(CommonStatus.DELETED)).toBe(CommonStatus.DELETED);
    });

    it('should return default value (INACTIVE) for invalid inputs', () => {
      expect(getValidStatus('invalid')).toBe(CommonStatus.INACTIVE);
      expect(getValidStatus(null)).toBe(CommonStatus.INACTIVE);
      expect(getValidStatus(undefined)).toBe(CommonStatus.INACTIVE);
    });
  });

  describe('getValidCustomerType', () => {
    it('should return valid CustomerType values', () => {
      expect(getValidCustomerType(CustomerType.INDIVIDUAL)).toBe(CustomerType.INDIVIDUAL);
      expect(getValidCustomerType(CustomerType.BUSINESS)).toBe(CustomerType.BUSINESS);
    });

    it('should return default value (INDIVIDUAL) for invalid inputs', () => {
      expect(getValidCustomerType('invalid')).toBe(CustomerType.INDIVIDUAL);
      expect(getValidCustomerType(null)).toBe(CustomerType.INDIVIDUAL);
      expect(getValidCustomerType(undefined)).toBe(CustomerType.INDIVIDUAL);
    });
  });

  describe('getValidAppointmentStatus', () => {
    it('should return valid AppointmentStatus values', () => {
      expect(getValidAppointmentStatus(AppointmentStatus.PLANNED)).toBe(AppointmentStatus.PLANNED);
      expect(getValidAppointmentStatus(AppointmentStatus.COMPLETED)).toBe(AppointmentStatus.COMPLETED);
      expect(getValidAppointmentStatus(AppointmentStatus.CANCELLED)).toBe(AppointmentStatus.CANCELLED);
    });

    it('should return default value (PLANNED) for invalid inputs', () => {
      expect(getValidAppointmentStatus('invalid')).toBe(AppointmentStatus.PLANNED);
      expect(getValidAppointmentStatus(null)).toBe(AppointmentStatus.PLANNED);
      expect(getValidAppointmentStatus(undefined)).toBe(AppointmentStatus.PLANNED);
    });
  });

  describe('getValidRequestStatus', () => {
    it('should return valid RequestStatus values', () => {
      expect(getValidRequestStatus(RequestStatus.NEW)).toBe(RequestStatus.NEW);
      expect(getValidRequestStatus(RequestStatus.IN_PROGRESS)).toBe(RequestStatus.IN_PROGRESS);
      expect(getValidRequestStatus(RequestStatus.COMPLETED)).toBe(RequestStatus.COMPLETED);
      expect(getValidRequestStatus(RequestStatus.CANCELLED)).toBe(RequestStatus.CANCELLED);
    });

    it('should return default value (NEW) for invalid inputs', () => {
      expect(getValidRequestStatus('invalid')).toBe(RequestStatus.NEW);
      expect(getValidRequestStatus(null)).toBe(RequestStatus.NEW);
      expect(getValidRequestStatus(undefined)).toBe(RequestStatus.NEW);
    });
  });

  describe('getValidNotificationType', () => {
    it('should return valid NotificationType values', () => {
      expect(getValidNotificationType(NotificationType.INFO)).toBe(NotificationType.INFO);
      expect(getValidNotificationType(NotificationType.WARNING)).toBe(NotificationType.WARNING);
      expect(getValidNotificationType(NotificationType.ERROR)).toBe(NotificationType.ERROR);
      expect(getValidNotificationType(NotificationType.SUCCESS)).toBe(NotificationType.SUCCESS);
    });

    it('should return default value (INFO) for invalid inputs', () => {
      expect(getValidNotificationType('invalid')).toBe(NotificationType.INFO);
      expect(getValidNotificationType(null)).toBe(NotificationType.INFO);
      expect(getValidNotificationType(undefined)).toBe(NotificationType.INFO);
    });
  });
});