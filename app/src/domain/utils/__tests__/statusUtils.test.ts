import {
  getRequestStatusLabel,
  getRequestStatusClass,
  getAppointmentStatusLabel,
  getAppointmentStatusClass
} from '../statusUtils';
import { RequestStatus, AppointmentStatus } from '@/domain/enums/CommonEnums';

describe('StatusUtils', () => {
  describe('getRequestStatusLabel', () => {
    it('should return the correct label for each request status', () => {
      expect(getRequestStatusLabel(RequestStatus.NEW)).toBe('New');
      expect(getRequestStatusLabel(RequestStatus.IN_PROGRESS)).toBe('In Progress');
      expect(getRequestStatusLabel(RequestStatus.COMPLETED)).toBe('Completed');
      expect(getRequestStatusLabel(RequestStatus.CANCELLED)).toBe('Cancelled');
    });

    it('should return "Unknown" for invalid status', () => {
      // @ts-ignore - Deliberately testing invalid input
      expect(getRequestStatusLabel('invalid-status')).toBe('Unknown');
      // @ts-ignore - Deliberately testing invalid input
      expect(getRequestStatusLabel(null)).toBe('Unknown');
      // @ts-ignore - Deliberately testing invalid input
      expect(getRequestStatusLabel(undefined)).toBe('Unknown');
    });
  });

  describe('getRequestStatusClass', () => {
    it('should return the correct CSS class for each request status', () => {
      expect(getRequestStatusClass(RequestStatus.NEW)).toBe('bg-blue-100 text-blue-800');
      expect(getRequestStatusClass(RequestStatus.IN_PROGRESS)).toBe('bg-yellow-100 text-yellow-800');
      expect(getRequestStatusClass(RequestStatus.COMPLETED)).toBe('bg-green-100 text-green-800');
      expect(getRequestStatusClass(RequestStatus.CANCELLED)).toBe('bg-red-100 text-red-800');
    });

    it('should return a default CSS class for invalid status', () => {
      // @ts-ignore - Deliberately testing invalid input
      expect(getRequestStatusClass('invalid-status')).toBe('bg-gray-100 text-gray-800');
      // @ts-ignore - Deliberately testing invalid input
      expect(getRequestStatusClass(null)).toBe('bg-gray-100 text-gray-800');
      // @ts-ignore - Deliberately testing invalid input
      expect(getRequestStatusClass(undefined)).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('getAppointmentStatusLabel', () => {
    it('should return the correct label for each appointment status', () => {
      expect(getAppointmentStatusLabel(AppointmentStatus.PLANNED)).toBe('Planned');
      expect(getAppointmentStatusLabel(AppointmentStatus.CONFIRMED)).toBe('Confirmed');
      expect(getAppointmentStatusLabel(AppointmentStatus.COMPLETED)).toBe('Completed');
      expect(getAppointmentStatusLabel(AppointmentStatus.CANCELLED)).toBe('Cancelled');
    });

    it('should return "Unknown" for invalid status', () => {
      // @ts-ignore - Deliberately testing invalid input
      expect(getAppointmentStatusLabel('invalid-status')).toBe('Unknown');
      // @ts-ignore - Deliberately testing invalid input
      expect(getAppointmentStatusLabel(null)).toBe('Unknown');
      // @ts-ignore - Deliberately testing invalid input
      expect(getAppointmentStatusLabel(undefined)).toBe('Unknown');
    });
  });

  describe('getAppointmentStatusClass', () => {
    it('should return the correct CSS class for each appointment status', () => {
      expect(getAppointmentStatusClass(AppointmentStatus.PLANNED)).toBe('bg-blue-100 text-blue-800');
      expect(getAppointmentStatusClass(AppointmentStatus.CONFIRMED)).toBe('bg-green-100 text-green-800');
      expect(getAppointmentStatusClass(AppointmentStatus.COMPLETED)).toBe('bg-purple-100 text-purple-800');
      expect(getAppointmentStatusClass(AppointmentStatus.CANCELLED)).toBe('bg-red-100 text-red-800');
    });

    it('should return a default CSS class for invalid status', () => {
      // @ts-ignore - Deliberately testing invalid input
      expect(getAppointmentStatusClass('invalid-status')).toBe('bg-gray-100 text-gray-800');
      // @ts-ignore - Deliberately testing invalid input
      expect(getAppointmentStatusClass(null)).toBe('bg-gray-100 text-gray-800');
      // @ts-ignore - Deliberately testing invalid input
      expect(getAppointmentStatusClass(undefined)).toBe('bg-gray-100 text-gray-800');
    });
  });
});