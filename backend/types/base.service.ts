export interface ServiceOptions {
  includeDeleted?: boolean;
}

export interface FindAllOptions extends ServiceOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FindOneOptions extends ServiceOptions {
  throwIfNotFound?: boolean;
}

export interface CreateOptions extends ServiceOptions {
  userId?: number;
}

export interface UpdateOptions extends ServiceOptions {
  userId?: number;
  throwIfNotFound?: boolean;
}

export interface DeleteOptions extends ServiceOptions {
  userId?: number;
  throwIfNotFound?: boolean;
  softDelete?: boolean;
}
