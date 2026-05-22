// Types for Roles, Permissions, and User Management System

export type UserRole = 'SUPERADMIN' | 'owner' | 'admin' | 'manager' | 'seller' | 'viewer' | 'accountant';

export interface Permission {
  permission_key: string;
  is_allowed: boolean;
}

export interface PermissionGroup {
  category: string;
  permissions: Permission[];
}

export interface PermissionSchema {
  [category: string]: string[];
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_key: string;
  is_allowed: boolean;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permission_key: string;
  is_allowed: boolean;
}

export interface User {
  id: string;
  business_id: string | null;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
  last_login_at?: string;
  last_login_ip?: string;
  full_name?: string;
}

export interface Business {
  id: string;
  ruc: string;
  business_name: string;
  commercial_name?: string;
  email: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_end_date?: string;
  max_users: number;
  max_products: number;
  max_invoices_monthly: number;
  current_users: number;
  current_products: number;
  current_invoices_month: number;
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  suspended_at?: string;
  suspended_reason?: string;
  owner_id?: string;
  settings?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}

export interface GlobalMetrics {
  total_businesses: number;
  active_businesses: number;
  total_users: number;
  total_sales: number;
  total_revenue: number;
}

export type PermissionKey = 
  | 'products.create' | 'products.read' | 'products.update' | 'products.delete'
  | 'sales.create' | 'sales.read' | 'sales.update' | 'sales.delete' | 'sales.view_others'
  | 'customers.create' | 'customers.read' | 'customers.update' | 'customers.delete'
  | 'inventory.read' | 'inventory.adjust' | 'inventory.audit'
  | 'reports.sales' | 'reports.inventory' | 'reports.financial' | 'reports.export'
  | 'users.create' | 'users.read' | 'users.update' | 'users.delete' | 'users.change_role'
  | 'invoices.create' | 'invoices.read' | 'invoices.void' | 'invoices.download'
  | 'dashboard.view' | 'dashboard.export'
  | 'settings.read' | 'settings.update';

export interface UserWithPermissions extends User {
  permissions?: Record<PermissionKey, boolean>;
}

export interface PermissionsSchemaResponse {
  [category: string]: string[];
}

export interface ChangeOwnerRequest {
  new_owner_id: string;
}

export interface SetBusinessStatusRequest {
  is_active: boolean;
  reason?: string;
}

export interface AssignSubscriptionRequest {
  plan_name: 'Micro' | 'Startup' | 'Business' | 'Enterprise';
  days_valid: number;
}
  total_users: number;
  total_sales: number;
  total_revenue: number;
}

export interface CreateEmployeeRequest {
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  role: UserRole;
  password?: string;
}

export interface UpdateEmployeeRoleRequest {
  role: UserRole;
}

export interface AssignPermissionsRequest {
  permissions: Record<string, boolean>;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: 'Super Admin',
  owner: 'Dueño',
  admin: 'Administrador',
  manager: 'Gerente',
  seller: 'Vendedor',
  viewer: 'Visualizador',
  accountant: 'Contador',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPERADMIN: 'bg-purple-100 text-purple-800',
  owner: 'bg-emerald-100 text-emerald-800',
  admin: 'bg-blue-100 text-blue-800',
  manager: 'bg-indigo-100 text-indigo-800',
  seller: 'bg-amber-100 text-amber-800',
  viewer: 'bg-gray-100 text-gray-800',
  accountant: 'bg-cyan-100 text-cyan-800',
};