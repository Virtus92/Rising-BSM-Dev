/**
 * Trend utilities for analyzing changes in metrics over time
 */
import { toDate } from './date-utils';

/**
 * Trend direction
 */
export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  NEUTRAL = 'NEUTRAL'
}

/**
 * Trend information for a metric
 */
export interface TrendInfo {
  /** Current value */
  current: number;
  /** Previous value */
  previous: number;
  /** Percentage change (positive or negative) */
  percentChange: number;
  /** Direction of trend */
  direction: TrendDirection;
  /** Whether this trend is positive (improvement) */
  isPositive: boolean;
}

/**
 * Options for trend calculation
 */
export interface TrendOptions {
  /** If true, higher values are considered positive (default true) */
  higherIsBetter?: boolean;
  /** Threshold for considering a trend neutral (default 0.05 or 5%) */
  neutralThreshold?: number;
}

/**
 * Calculate trend information between current and previous values
 * 
 * @param current - Current value
 * @param previous - Previous value 
 * @param options - Trend calculation options
 * @returns Trend information
 */
export function calculateTrend(
  current: number,
  previous: number,
  options: TrendOptions = {}
): TrendInfo {
  // Set defaults
  const higherIsBetter = options.higherIsBetter ?? true;
  const neutralThreshold = options.neutralThreshold ?? 0.05; // 5%
  
  // Calculate percent change
  let percentChange = 0;
  if (previous !== 0) {
    percentChange = (current - previous) / previous;
  } else if (current !== 0) {
    percentChange = 1; // 100% increase from zero
  }
  
  // Determine direction
  let direction = TrendDirection.NEUTRAL;
  const absChange = Math.abs(percentChange);
  
  if (absChange >= neutralThreshold) {
    direction = percentChange > 0 ? TrendDirection.UP : TrendDirection.DOWN;
  }
  
  // Determine if trend is positive
  // If higher is better, UP is positive
  // If lower is better, DOWN is positive
  let isPositive = false;
  
  if (direction === TrendDirection.UP && higherIsBetter) {
    isPositive = true;
  } else if (direction === TrendDirection.DOWN && !higherIsBetter) {
    isPositive = true;
  }
  
  return {
    current,
    previous,
    percentChange,
    direction,
    isPositive
  };
}

/**
 * Calculate trends for a dataset between two time periods
 * 
 * @param currentPeriodItems - Items in current period
 * @param previousPeriodItems - Items in previous period
 * @param countFn - Function to count/measure items (default counts all)
 * @param options - Trend calculation options
 * @returns Trend information
 */
export function calculateDatasetTrend<T>(
  currentPeriodItems: T[],
  previousPeriodItems: T[],
  countFn: (items: T[]) => number = (items) => items.length,
  options: TrendOptions = {}
): TrendInfo {
  const current = countFn(currentPeriodItems);
  const previous = countFn(previousPeriodItems);
  
  return calculateTrend(current, previous, options);
}

/**
 * Split a dataset into current and previous period based on date
 * 
 * @param allItems - All items to analyze
 * @param dateExtractor - Function to extract date from an item
 * @param currentPeriodStart - Start of current period
 * @param currentPeriodEnd - End of current period (defaults to now)
 * @param previousPeriodStart - Start of previous period (calculated if not provided)
 * @param previousPeriodEnd - End of previous period (calculated if not provided)
 * @returns Object with current and previous period items
 */
export function splitByTimePeriod<T>(
  allItems: T[],
  dateExtractor: (item: T) => Date | string | null | undefined,
  currentPeriodStart: Date | string,
  currentPeriodEnd: Date | string = new Date(),
  previousPeriodStart?: Date | string,
  previousPeriodEnd?: Date | string
): { currentPeriod: T[], previousPeriod: T[] } {
  // Convert dates to Date objects
  const curStart = toDate(currentPeriodStart) || new Date();
  const curEnd = toDate(currentPeriodEnd) || new Date();
  
  // Calculate previous period if not provided
  // Default to same duration as current period
  let prevStart: Date;
  let prevEnd: Date;
  
  if (previousPeriodStart && previousPeriodEnd) {
    prevStart = toDate(previousPeriodStart) || new Date(0);
    prevEnd = toDate(previousPeriodEnd) || new Date(0);
  } else {
    // Calculate duration of current period
    const currentDuration = curEnd.getTime() - curStart.getTime();
    
    // Calculate previous period
    prevEnd = new Date(curStart.getTime() - 1); // 1ms before current period start
    prevStart = new Date(prevEnd.getTime() - currentDuration);
  }
  
  // Split items into periods
  const currentPeriod = allItems.filter(item => {
    const date = toDate(dateExtractor(item));
    if (!date) return false;
    
    return date >= curStart && date <= curEnd;
  });
  
  const previousPeriod = allItems.filter(item => {
    const date = toDate(dateExtractor(item));
    if (!date) return false;
    
    return date >= prevStart && date <= prevEnd;
  });
  
  return { currentPeriod, previousPeriod };
}

/**
 * Calculate trend for a specific metric from a dataset
 * 
 * @param allItems - All items to analyze
 * @param dateExtractor - Function to extract date from an item
 * @param metricExtractor - Function to calculate the metric value from a set of items
 * @param currentPeriodStart - Start of current period
 * @param currentPeriodEnd - End of current period (defaults to now)
 * @param options - Trend calculation options
 * @returns Trend information
 */
export function calculateMetricTrend<T>(
  allItems: T[],
  dateExtractor: (item: T) => Date | string | null | undefined,
  metricExtractor: (items: T[]) => number,
  currentPeriodStart: Date | string,
  currentPeriodEnd: Date | string = new Date(),
  options: TrendOptions = {}
): TrendInfo {
  // Split items by period
  const { currentPeriod, previousPeriod } = splitByTimePeriod(
    allItems,
    dateExtractor,
    currentPeriodStart,
    currentPeriodEnd
  );
  
  // Calculate metrics for each period
  const current = metricExtractor(currentPeriod);
  const previous = metricExtractor(previousPeriod);
  
  // Calculate trend
  return calculateTrend(current, previous, options);
}