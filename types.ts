
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  COLLAB = 'COLLAB'
}

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  status: CompanyStatus;
  createdAt: string;
  logoUrl?: string;
  heroUrl?: string;
  whatsapp?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
}
