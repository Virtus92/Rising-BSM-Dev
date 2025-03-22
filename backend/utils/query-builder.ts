export class QueryBuilder {
  private conditions: any = {};
  
  constructor() {}
  
  /**
   * Add a simple filter condition
   */
  addFilter(field: string, value: any, operator: 'equals' | 'contains' | 'startsWith' | 'in' = 'equals'): QueryBuilder {
    if (value === undefined || value === null || value === '') {
      return this;
    }
    
    switch (operator) {
      case 'contains':
        this.conditions[field] = { contains: value, mode: 'insensitive' };
        break;
      case 'startsWith':
        this.conditions[field] = { startsWith: value, mode: 'insensitive' };
        break;
      case 'in':
        this.conditions[field] = { in: Array.isArray(value) ? value : [value] };
        break;
      case 'equals':
      default:
        this.conditions[field] = value;
    }
    
    return this;
  }
  
  /**
   * Add a date range filter
   */
  addDateRange(field: string, date: string | Date, withTime: boolean = false): QueryBuilder {
    if (!date) {
      return this;
    }
    
    if (withTime) {
      // Full date-time range (e.g., entire day)
      this.conditions[field] = {
        gte: new Date(`${date}T00:00:00`),
        lt: new Date(`${date}T23:59:59`)
      };
    } else {
      // Date-only comparison
      const parsedDate = typeof date === 'string' ? new Date(date) : date;
      const startDate = new Date(parsedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(parsedDate);
      endDate.setHours(23, 59, 59, 999);
      
      this.conditions[field] = {
        gte: startDate,
        lte: endDate
      };
    }
    
    return this;
  }
  
  /**
   * Add a date range between two dates
   */
  addDateRangeBetween(field: string, startDate?: string | Date, endDate?: string | Date): QueryBuilder {
    if (!startDate && !endDate) {
      return this;
    }
    
    if (!this.conditions[field]) {
      this.conditions[field] = {};
    }
    
    if (startDate) {
      const parsedStartDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
      const start = new Date(parsedStartDate);
      start.setHours(0, 0, 0, 0);
      this.conditions[field].gte = start;
    }
    
    if (endDate) {
      const parsedEndDate = typeof endDate === 'string' ? new Date(endDate) : endDate;
      const end = new Date(parsedEndDate);
      end.setHours(23, 59, 59, 999);
      this.conditions[field].lte = end;
    }
    
    return this;
  }
  
  /**
   * Add a search condition across multiple fields
   */
  addSearch(search: string, fields: string[]): QueryBuilder {
    if (!search || !fields.length) {
      return this;
    }
    
    const orConditions = fields.map(field => ({
      [field]: { contains: search, mode: 'insensitive' }
    }));
    
    if (!this.conditions.OR) {
      this.conditions.OR = orConditions;
    } else {
      this.conditions.OR = [...this.conditions.OR, ...orConditions];
    }
    
    return this;
  }
  
  /**
   * Add a complex OR condition
   */
  addOr(conditions: any[]): QueryBuilder {
    if (!conditions.length) {
      return this;
    }
    
    if (!this.conditions.OR) {
      this.conditions.OR = conditions;
    } else {
      this.conditions.OR = [...this.conditions.OR, ...conditions];
    }
    
    return this;
  }
  
  /**
   * Add a complex AND condition
   */
  addAnd(conditions: any[]): QueryBuilder {
    if (!conditions.length) {
      return this;
    }
    
    if (!this.conditions.AND) {
      this.conditions.AND = conditions;
    } else {
      this.conditions.AND = [...this.conditions.AND, ...conditions];
    }
    
    return this;
  }
  
  /**
   * Add a NULL check condition
   */
  addNullCheck(field: string, isNull: boolean): QueryBuilder {
    this.conditions[field] = isNull ? null : { not: null };
    return this;
  }
  
  /**
   * Add a number range condition
   */
  addNumberRange(field: string, min?: number, max?: number): QueryBuilder {
    if (min === undefined && max === undefined) {
      return this;
    }
    
    if (!this.conditions[field]) {
      this.conditions[field] = {};
    }
    
    if (min !== undefined) {
      this.conditions[field].gte = min;
    }
    
    if (max !== undefined) {
      this.conditions[field].lte = max;
    }
    
    return this;
  }
  
  /**
   * Add a raw condition (use with caution)
   */
  addRaw(condition: any): QueryBuilder {
    this.conditions = {
      ...this.conditions,
      ...condition
    };
    
    return this;
  }
  
  /**
   * Build and return the final query conditions
   */
  build(): any {
    return this.conditions;
  }
}
