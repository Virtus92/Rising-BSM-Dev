/**
 * Statistics utilities for generating time-based analytics data
 */
import { toDate, isDate } from './date-utils';

/**
 * Standard time period for statistics
 */
export interface TimeStatisticsPeriod {
  /** Display label for the period */
  period: string;
  /** Start date of this period (ISO string or Date object) */
  startDate: string | Date;
  /** End date of this period (ISO string or Date object) */
  endDate: string | Date;
  /** The year of this period */
  year: number;
  /** Count of items in this period */
  count: number;
}

/**
 * Creates a date range for a specific month and year
 * 
 * @param year - The year
 * @param month - The month (0-11)
 * @returns Object with start and end dates
 */
export function getMonthDateRange(year: number, month: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

/**
 * Creates a date range for a specific week
 * 
 * @param date - A date within the week
 * @param startDay - First day of the week (0 = Sunday, 1 = Monday, etc.)
 * @returns Object with start and end dates
 */
export function getWeekDateRange(date: Date, startDay: number = 1): { startDate: Date; endDate: Date } {
  const currentDay = date.getDay();
  const diff = (currentDay < startDay ? 7 : 0) + currentDay - startDay;
  
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - diff);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Creates a date range for a specific year
 * 
 * @param year - The year
 * @returns Object with start and end dates
 */
export function getYearDateRange(year: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  return { startDate, endDate };
}

/**
 * Gets the week number of a date
 * 
 * @param date - The date
 * @returns Week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Determines if a date falls within a date range
 * 
 * @param date - The date to check
 * @param startDate - Start of the range
 * @param endDate - End of the range
 * @returns Whether the date is within the range
 */
export function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean {
  const dateObj = toDate(date);
  const startObj = toDate(startDate);
  const endObj = toDate(endDate);
  
  if (!dateObj || !startObj || !endObj) return false;
  
  return dateObj >= startObj && dateObj <= endObj;
}

/**
 * Generates monthly statistics for a dataset
 * 
 * @param items - Array of items to analyze
 * @param dateExtractor - Function to extract date from an item
 * @param months - Number of months to include
 * @param startDate - Starting date (defaults to current date)
 * @returns Array of statistics periods
 */
export function generateMonthlyStats<T>(
  items: T[],
  dateExtractor: (item: T) => Date | string | null | undefined,
  months: number = 12,
  startDate: Date = new Date()
): TimeStatisticsPeriod[] {
  const result: TimeStatisticsPeriod[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDate = new Date(startDate);
  
  // Start from current month and go back specified number of months
  for (let i = 0; i < months; i++) {
    // Calculate month (counting backwards from current month)
    const monthIndex = (currentDate.getMonth() - i + 12) % 12;
    const yearOffset = Math.floor((currentDate.getMonth() - i) / 12);
    const year = currentDate.getFullYear() - yearOffset;
    
    // Get date range for this month
    const { startDate: monthStart, endDate: monthEnd } = getMonthDateRange(year, monthIndex);
    
    // Count items in this month
    const itemsInPeriod = items.filter(item => {
      const itemDate = dateExtractor(item);
      if (!itemDate) return false;
      
      return isDateInRange(itemDate, monthStart, monthEnd);
    });
    
    // Create month label
    const periodLabel = `${monthNames[monthIndex]} ${year}`;
    
    // Add to stats in reverse order (oldest first)
    result.unshift({
      period: periodLabel,
      year,
      count: itemsInPeriod.length,
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString()
    });
  }
  
  return result;
}

/**
 * Generates weekly statistics for a dataset
 * 
 * @param items - Array of items to analyze
 * @param dateExtractor - Function to extract date from an item
 * @param weeks - Number of weeks to include
 * @param startDate - Starting date (defaults to current date)
 * @returns Array of statistics periods
 */
export function generateWeeklyStats<T>(
  items: T[],
  dateExtractor: (item: T) => Date | string | null | undefined,
  weeks: number = 12,
  startDate: Date = new Date()
): TimeStatisticsPeriod[] {
  const result: TimeStatisticsPeriod[] = [];
  const now = new Date(startDate);
  
  // Start from current week and go back specified number of weeks
  for (let i = 0; i < weeks; i++) {
    // Calculate date range for this week
    // Start with current date and move back i weeks
    const weekEndDate = new Date(now);
    weekEndDate.setDate(now.getDate() - (i * 7));
    
    const { startDate: weekStart, endDate: weekEnd } = getWeekDateRange(weekEndDate);
    
    // Get week number
    const weekNumber = getWeekNumber(weekEnd);
    
    // Count items in this week
    const itemsInPeriod = items.filter(item => {
      const itemDate = dateExtractor(item);
      if (!itemDate) return false;
      
      return isDateInRange(itemDate, weekStart, weekEnd);
    });
    
    // Create week label
    const periodLabel = `Week ${weekNumber}`;
    
    // Add to stats in reverse order (oldest first)
    result.unshift({
      period: periodLabel,
      year: weekEnd.getFullYear(),
      count: itemsInPeriod.length,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString()
    });
  }
  
  return result;
}

/**
 * Generates yearly statistics for a dataset
 * 
 * @param items - Array of items to analyze
 * @param dateExtractor - Function to extract date from an item
 * @param years - Number of years to include
 * @param startDate - Starting date (defaults to current date)
 * @returns Array of statistics periods
 */
export function generateYearlyStats<T>(
  items: T[],
  dateExtractor: (item: T) => Date | string | null | undefined,
  years: number = 5,
  startDate: Date = new Date()
): TimeStatisticsPeriod[] {
  const result: TimeStatisticsPeriod[] = [];
  const currentYear = startDate.getFullYear();
  
  // Start from current year and go back specified number of years
  for (let i = 0; i < years; i++) {
    const year = currentYear - i;
    
    // Get date range for this year
    const { startDate: yearStart, endDate: yearEnd } = getYearDateRange(year);
    
    // Count items in this year
    const itemsInPeriod = items.filter(item => {
      const itemDate = dateExtractor(item);
      if (!itemDate) return false;
      
      return isDateInRange(itemDate, yearStart, yearEnd);
    });
    
    // Create year label
    const periodLabel = year.toString();
    
    // Add to stats in reverse order (oldest first)
    result.unshift({
      period: periodLabel,
      year,
      count: itemsInPeriod.length,
      startDate: yearStart.toISOString(),
      endDate: yearEnd.toISOString()
    });
  }
  
  return result;
}