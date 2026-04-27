import { Form } from '@prisma/client';
import { PaginatedResult, PaginationParams } from '@shared/types/paginated.type';

export interface FindFormsFilter {
  tenantId: string;
  type?: string;
  status?: string;
  createdById?: string;
}

export interface IFormRepository {
  findById(id: string, tenantId: string): Promise<Form | null>;
  findAll(filter: FindFormsFilter, pagination: PaginationParams): Promise<PaginatedResult<Form>>;
  create(data: Partial<Form>): Promise<Form>;
  update(id: string, tenantId: string, data: Partial<Form>): Promise<Form>;
  softDelete(id: string, tenantId: string): Promise<void>;
  incrementVersion(id: string, tenantId: string): Promise<Form>;
}

export const FORM_REPOSITORY = Symbol('IFormRepository');
