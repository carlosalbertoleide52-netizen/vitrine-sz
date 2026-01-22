
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getCompanies, updateCompanyStatus, getProfiles } from '../../store';
import { Company, CompanyStatus, User } from '../../types';
import { Users, Building2, BarChart3, Search, CheckCircle, XCircle, ShieldCheck, RefreshCcw, Mail, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SuperAdminDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [comps, profs] = await Promise.all([getCompanies(), getProfiles()]);
      setCompanies(comps);
      setProfiles(profs);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleStatus = async (id: string) => {
    const company = companies.find(c => c.id === id);
    if (company) {
      const newStatus = company.status === CompanyStatus.ACTIVE ? CompanyStatus.INACTIVE : CompanyStatus.ACTIVE;
      try {
        await updateCompanyStatus(id, newStatus);
        await loadData();
      } catch (error) {
        console.error("Error updating company status:", error);
      }
    }
  };

  const stats = [
    { label: 'Total de Empresas', value: companies.length, icon: <Building2 className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'Lojistas Ativos', value: profiles.length, icon: <Users className="text-emerald-600" />, color: 'bg-emerald-50' },
    { label: 'Faturamento Ref.', value: `R$ ${(companies.length * 149.9).toFixed(2)}`, icon: <BarChart3 className="text-amber-600" />, color: 'bg-amber-50' },
  ];

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = profiles.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Carregando Ecossistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-['Inter']">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 pb-20">
        
        {/* Banner de Status Master */}
        <div className="mb-10 bg-gradient-to-r from-blue-700 to-indigo-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div>
              <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Painel Master de Controle</p>
              <h2 className="text-3xl font-black tracking-tighter leading-none">Bem-vindo, Comandante.</h2>
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex gap-3 relative z-10">
             <div className="px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
               <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Sistema Estável</p>
             </div>
             <button onClick={loadData} className="p-2 bg-white text-blue-900 rounded-full hover:rotate-180 transition-all duration-500 shadow-xl active:scale-90">
               <RefreshCcw size={18} />
             </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
              <div className={`w-16 h-16 rounded-[1.5rem] ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Control */}
        <div className="flex gap-4 mb-8 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('companies')}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'companies' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Empresas
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Usuários
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder={activeTab === 'companies' ? "Buscar empresa ou subdomínio..." : "Buscar por nome ou e-mail..."} 
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 placeholder:text-slate-300 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
          {activeTab === 'companies' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Negócio</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Web</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação Master</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCompanies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-blue-600 text-sm">
                             {c.name[0]}
                           </div>
                           <div>
                             <p className="font-black text-slate-900 text-lg tracking-tight leading-tight">{c.name}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Desde {new Date(c.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                         <span className="font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl text-sm border border-indigo-100">
                           {c.subdomain}.vitrine.com
                         </span>
                      </td>
                      <td className="px-10 py-7">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          c.status === CompanyStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${c.status === CompanyStatus.ACTIVE ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                          {c.status === CompanyStatus.ACTIVE ? 'Operando' : 'Suspenso'}
                        </span>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <button 
                          onClick={() => toggleStatus(c.id)}
                          className={`p-4 rounded-2xl transition-all shadow-lg active:scale-90 ${
                            c.status === CompanyStatus.ACTIVE 
                            ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-red-500/10' 
                            : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-emerald-500/10'
                          }`}
                        >
                          {c.status === CompanyStatus.ACTIVE ? <XCircle size={22} /> : <CheckCircle size={22} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map(u => (
                <div key={u.id} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Users size={80} />
                   </div>
                   <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center font-black text-slate-900 text-xl mb-6">
                     {u.name[0]}
                   </div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{u.name}</h3>
                   <div className="space-y-3">
                      <p className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                        <Mail size={14} className="text-blue-500" /> {u.email}
                      </p>
                      <p className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                        <Calendar size={14} className="text-blue-500" /> Registrado em {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                      <div className="pt-4">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          u.role === 'SUPER_ADMIN' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
