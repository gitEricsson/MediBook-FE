import type { UserRole } from '@/types/domain';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  content: T[];
}

export interface PageableQuery {
  page?: number;
  size?: number;
  sort?: string[];
}

export function unwrapApiResponse<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

export function normalizeUserRole(role: string): UserRole {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'admin';
    case 'ROLE_DOCTOR':
      return 'doctor';
    case 'ROLE_PATIENT':
    default:
      return 'patient';
  }
}

export function toPageableParams(pageable: PageableQuery): Record<string, string | number | string[]> {
  const params: Record<string, string | number | string[]> = {
    page: pageable.page ?? 0,
    size: pageable.size ?? 20,
  };
  if (pageable.sort && pageable.sort.length > 0) {
    params.sort = pageable.sort; // pass as string[]
  }
  return params;
}

