
import { Company, User, CompanyStatus, UserRole, Product } from './types';
import { supabase } from './supabaseClient';
import { GoogleGenAI, Type } from "@google/genai";

const mapCompany = (data: any): Company => ({
  id: data.id,
  name: data.name,
  subdomain: (data.subdomain || '').toLowerCase(),
  status: data.status,
  createdAt: data.created_at || data.createdAt,
  logoUrl: data.logo_url || data.logoUrl,
  heroUrl: data.hero_url || data.heroUrl,
  whatsapp: data.whatsapp || ''
});

const mapUser = (data: any): User => ({
  id: data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  tenantId: data.tenant_id || data.tenantId,
  createdAt: data.created_at || data.createdAt,
});

export const updateCompany = async (id: string, updates: Partial<Company>) => {
  const dbPayload: any = {};
  if (updates.name !== undefined) dbPayload.name = updates.name;
  if (updates.whatsapp !== undefined) dbPayload.whatsapp = updates.whatsapp;
  if (updates.logoUrl !== undefined) dbPayload.logo_url = updates.logoUrl;
  if (updates.heroUrl !== undefined) dbPayload.hero_url = updates.heroUrl;

  const { data, error } = await supabase.from('companies').update(dbPayload).eq('id', id).select();
  if (error) throw new Error(`Erro ao salvar no banco: ${error.message}`);
  return data ? mapCompany(data[0]) : null;
};

export const getCompanies = async (): Promise<Company[]> => {
  const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapCompany);
};

export const getCompanyById = async (id: string): Promise<Company | null> => {
  const { data, error } = await supabase.from('companies').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapCompany(data);
};

export const updateCompanyStatus = async (id: string, status: CompanyStatus) => {
  const { error } = await supabase.from('companies').update({ status }).eq('id', id);
  if (error) throw error;
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return mapUser(data);
};

export const getProfiles = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapUser);
};

export const testDatabaseConnection = async () => {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  if (error && error.code !== 'PGRST116') throw error;
  return true;
};

export const analyzeProductImage = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: 'Analise esta imagem de produto e retorne JSON com: name, description, suggestedPrice.' },
      ],
    },
    config: { responseMimeType: "application/json" },
  });
  return JSON.parse(response.text || '{}');
};

export const uploadProductImage = async (tenantId: string, file: File): Promise<string> => {
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}`;
  const filePath = `${tenantId}/${fileName}`;
  const { error } = await supabase.storage.from('products').upload(filePath, file);
  if (error) throw error;
  return supabase.storage.from('products').getPublicUrl(filePath).data.publicUrl;
};

export const getTenantProducts = async (tenantId: string): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id,
    tenantId: d.tenant_id,
    name: d.name,
    price: d.price,
    description: d.description,
    imageUrl: d.image_url
  }));
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  const { data, error } = await supabase.from('products').insert([{
    tenant_id: product.tenantId,
    name: product.name,
    price: product.price,
    description: product.description,
    image_url: product.imageUrl
  }]).select().single();
  if (error) throw error;
  return { id: data.id, ...product };
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  const { error } = await supabase.from('products').update({
    name: product.name,
    price: product.price,
    description: product.description,
    image_url: product.imageUrl
  }).eq('id', id);
  if (error) throw error;
};

export const deleteProduct = async (id: string) => {
  // 1. Verificar se estamos autenticados antes de tentar
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão expirada. Faça login novamente.");

  console.log("Iniciando exclusão do produto:", id);

  // 2. Tentar deletar e pedir o retorno da linha deletada
  const { data, error, status } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select();
    
  if (error) {
    console.error("Erro SQL detectado:", error);
    throw new Error(`Erro do Banco (${error.code}): ${error.message}`);
  }
  
  // 3. Verificar se houve "delete silencioso" (retorna 200 mas não deleta nada)
  if (!data || data.length === 0) {
    console.warn("Delete ignorado pelo RLS. Status HTTP:", status);
    throw new Error("O banco ignorou o pedido de exclusão (Bloqueio de RLS). Rode o script 'Fix Nuclear' no Setup Master.");
  }
  
  return true;
};

export const getCompanyBySubdomain = async (subdomain: string): Promise<{data: Company | null, error: any}> => {
  const { data, error } = await supabase.from('companies').select('*').eq('subdomain', subdomain.toLowerCase()).maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? mapCompany(data) : null, error: null };
};

export const registerCompanyAndAdmin = async (companyName: string, subdomain: string, adminName: string, adminEmail: string, userId: string) => {
  const { data: companyData, error: companyError } = await supabase.from('companies').insert([{
    name: companyName,
    subdomain: subdomain.toLowerCase(),
    status: CompanyStatus.ACTIVE
  }]).select().single();
  if (companyError) throw companyError;
  const { error: profileError } = await supabase.from('profiles').insert([{
    id: userId,
    name: adminName,
    email: adminEmail,
    role: UserRole.ADMIN,
    tenant_id: companyData.id
  }]);
  if (profileError) throw profileError;
};

export const registerSuperAdminProfile = async (name: string, email: string, userId: string) => {
  const { error } = await supabase.from('profiles').upsert([{ id: userId, name, email, role: UserRole.SUPER_ADMIN }]);
  if (error) throw error;
};
