import { Company, CompanyStatus } from './types';

const STATUS_ALIASES: Record<string, CompanyStatus> = {
  active: CompanyStatus.ACTIVE,
  ativo: CompanyStatus.ACTIVE,
  suspended: CompanyStatus.SUSPENDED,
  suspenso: CompanyStatus.SUSPENDED,
  canceled: CompanyStatus.CANCELED,
  cancelled: CompanyStatus.CANCELED,
  cancelado: CompanyStatus.CANCELED,
  delinquent: CompanyStatus.DELINQUENT,
  inadimplente: CompanyStatus.DELINQUENT,
  test: CompanyStatus.TEST,
  teste: CompanyStatus.TEST,
  inactive: CompanyStatus.INACTIVE,
  inativo: CompanyStatus.INACTIVE,
  pending: CompanyStatus.INACTIVE,
};

export const ALLOWED_STOREFRONT_STATUS: CompanyStatus[] = [CompanyStatus.ACTIVE];
export const BLOCKED_STOREFRONT_STATUS: CompanyStatus[] = [
  CompanyStatus.SUSPENDED,
  CompanyStatus.CANCELED,
  CompanyStatus.DELINQUENT,
  CompanyStatus.INACTIVE,
  CompanyStatus.TEST,
];

export const normalizeCompanyStatus = (status: string | null | undefined): CompanyStatus => {
  const normalized = (status || '').trim().toLowerCase();
  return STATUS_ALIASES[normalized] || CompanyStatus.INACTIVE;
};

export const canAccessStorefront = (status: string | null | undefined): boolean => {
  return normalizeCompanyStatus(status) === CompanyStatus.ACTIVE;
};

export const isStorefrontBlocked = (status: string | null | undefined): boolean => {
  return !canAccessStorefront(status);
};

export const withNormalizedCompanyStatus = (company: Company): Company => ({
  ...company,
  status: normalizeCompanyStatus(company.status),
});
