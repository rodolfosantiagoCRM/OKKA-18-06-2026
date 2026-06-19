'use client';

import React from 'react';
import Link from 'next/link';
import { useVisitas } from '@/hooks/useVisitas';
import { useLeads } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';
import { Lead, Project, Visita } from '@/types/database.types';

// ─── Dados Mock ──────────────────────────────────────────────────────────────

const MOCK_LEADS: Lead[] = [
  { id: 'l1', nome: 'Roberto Mendonça', email: 'roberto@email.com', telefone: '(41) 99999-1111', cidade: 'Curitiba', area_m2: 80, status: 'Qualificado', criado_em: '2026-06-08T14:30:00Z' },
  { id: 'l2', nome: 'Clarice Lispector', email: 'clarice@email.com', telefone: '(41) 99999-2222', cidade: 'Curitiba', area_m2: 45, status: 'Novo', criado_em: '2026-06-11T09:15:00Z' },
  { id: 'l3', nome: 'Julio Cortázar', email: 'julio@email.com', telefone: '(41) 99999-3333', cidade: 'Curitiba', area_m2: 110, status: 'Em Contato', criado_em: '2026-06-14T11:00:00Z' },
  { id: 'l4', nome: 'Gabriel García Márquez', email: 'gabriel@email.com', telefone: '(41) 99999-4444', cidade: 'Curitiba', area_m2: 60, status: 'Novo', criado_em: '2026-06-15T16:20:00Z' },
  { id: 'l5', nome: 'Jorge Luis Borges', email: 'borges@email.com', telefone: '(11) 98888-5555', cidade: 'São Paulo', area_m2: 150, status: 'Perdido', criado_em: '2026-06-05T10:00:00Z' },
  { id: 'l6', nome: 'Machado de Assis', email: 'machado@email.com', telefone: '(21) 97777-6666', cidade: 'Rio de Janeiro', area_m2: 95, status: 'Novo', criado_em: '2026-06-16T18:45:00Z' },
];

const MOCK_PROJECTS: Project[] = [
  { id: 'p1', lead_id: 'l1', status_projeto: 'Instalação', endereco: 'Rua das Palmeiras, 405 - Cond. Royal', valor_total: 12500, criado_em: '2026-06-10T00:00:00Z', leads: MOCK_LEADS[0] },
  { id: 'p2', lead_id: 'l2', status_projeto: 'Preparação', endereco: 'Av. Batel, 1200 - Apto 402', valor_total: 8000, criado_em: '2026-06-12T00:00:00Z', leads: MOCK_LEADS[1] },
  { id: 'p3', lead_id: 'l3', status_projeto: 'Orçamento', endereco: 'Rua Desembargador Motta, 882 - Mercês', valor_total: 15400, criado_em: '2026-06-15T00:00:00Z', leads: MOCK_LEADS[2] },
  { id: 'p4', lead_id: 'l4', status_projeto: 'Teste de Carga', endereco: 'Al. Julia da Costa, 150 - Cabral', valor_total: 9800, criado_em: '2026-06-16T00:00:00Z', leads: MOCK_LEADS[3] },
];

const MOCK_VISITAS: Visita[] = [
  { id: 'v1', project_id: 'p1', data_visita: '2026-06-18', horario: '09:00', status_visita: 'Agendada', material_usado: ['Cabo Calefator 15W'], valor_gasto: 150, observacoes: 'Instalação da malha radiante - suíte master.', criado_em: '2026-06-18T00:00:00Z', projects: { ...MOCK_PROJECTS[0], leads: MOCK_LEADS[0] } },
  { id: 'v2', project_id: 'p2', data_visita: '2026-06-18', horario: '14:30', status_visita: 'Agendada', material_usado: [], valor_gasto: 0, observacoes: 'Teste de carga elétrica e calibração dos sensores.', criado_em: '2026-06-18T00:00:00Z', projects: { ...MOCK_PROJECTS[1], leads: MOCK_LEADS[1] } },
  { id: 'v3', project_id: 'p3', data_visita: '2026-06-19', horario: '10:00', status_visita: 'Agendada', material_usado: [], valor_gasto: 0, observacoes: 'Preparação do contrapiso.', criado_em: '2026-06-18T00:00:00Z', projects: { ...MOCK_PROJECTS[2], leads: MOCK_LEADS[2] } },
  { id: 'v4', project_id: 'p4', data_visita: '2026-06-21', horario: '11:00', status_visita: 'Agendada', material_usado: [], valor_gasto: 0, observacoes: 'Medição inicial e entrega técnica.', criado_em: '2026-06-18T00:00:00Z', projects: { ...MOCK_PROJECTS[3], leads: MOCK_LEADS[3] } },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  badge,
  iconBg,
  icon,
  pulse,
}: {
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  iconBg: string;
  icon: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 pointer-events-none" />
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          {icon}
        </div>
        {badge}
        {pulse && <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />}
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900">{value}</div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function DashboardHome() {
  const { visitas: dbVisitas } = useVisitas();
  const { leads: dbLeads } = useLeads();
  const { projects: dbProjects } = useProjects();

  const leads = dbLeads.length > 0 ? dbLeads : MOCK_LEADS;
  const projects = dbProjects.length > 0 ? dbProjects : MOCK_PROJECTS;
  const visitas = dbVisitas.length > 0 ? dbVisitas : MOCK_VISITAS;

  const hojeStr = '2026-06-18';
  const totalLeads = leads.length;
  const leadsNovos = leads.filter((l) => l.status === 'Novo').length;
  const emAndamento = projects.filter((p) =>
    ['Preparação', 'Instalação', 'Teste de Carga'].includes(p.status_projeto)
  ).length;
  const faturamento = projects.reduce((acc, p) => acc + p.valor_total, 0);
  const visitasHoje = visitas.filter((v) => v.data_visita === hojeStr && v.status_visita === 'Agendada').length;
  const materiaisPendentesCount = visitas.filter(
    (v) => !v.material_usado || v.material_usado.length === 0
  ).length;
  const visitasExecutadas = visitas.filter((v) => v.status_visita !== 'Agendada').length;
  const taxaConclusao = visitas.length > 0 ? Math.round((visitasExecutadas / visitas.length) * 100) : 0;

  const proximasVisitas = [...visitas]
    .sort((a, b) => `${a.data_visita}${a.horario}`.localeCompare(`${b.data_visita}${b.horario}`))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Visão Geral
            </span>
            <h1 className="text-3xl font-black tracking-tight mt-2 text-gray-900">
              Central OKKA
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Resumo operacional — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">Sistema Ativo</span>
          </div>
        </div>

        {/* ── KPI Grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="Total de Leads"
            value={totalLeads}
            iconBg="bg-blue-50 text-blue-500"
            badge={leadsNovos > 0 ? (
              <span className="text-[9px] font-bold bg-blue-100 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                +{leadsNovos} novos
              </span>
            ) : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <KpiCard
            label="Obras em Andamento"
            value={emAndamento}
            iconBg="bg-orange-50 text-orange-500"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <KpiCard
            label="Faturamento Total"
            value={<span className="text-xl">{formatCurrency(faturamento)}</span>}
            iconBg="bg-amber-50 text-amber-500"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KpiCard
            label="Visitas Hoje"
            value={visitasHoje}
            iconBg="bg-emerald-50 text-emerald-500"
            pulse={visitasHoje > 0}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <KpiCard
            label="Materiais Pendentes"
            value={materiaisPendentesCount}
            iconBg="bg-rose-50 text-rose-500"
            badge={materiaisPendentesCount > 0 ? (
              <span className="text-[9px] font-bold bg-rose-100 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">
                relatórios
              </span>
            ) : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <KpiCard
            label="Taxa de Eficiência"
            value={`${taxaConclusao}%`}
            iconBg="bg-teal-50 text-teal-500"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* ── Conteúdo Principal ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Próximas Visitas */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Próximas Visitas</h2>
                <p className="text-xs text-gray-400 mt-0.5">Agenda técnica dos próximos dias</p>
              </div>
              <Link
                href="/visitas"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg"
              >
                Ver Tudo →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {proximasVisitas.length === 0 ? (
                <p className="p-6 text-sm text-gray-400 italic text-center">Nenhuma visita agendada.</p>
              ) : (
                proximasVisitas.map((v) => {
                  const nome = v.projects?.leads?.nome || v.cliente || '—';
                  const endereco = v.projects?.endereco || v.endereco || '—';
                  const isHoje = v.data_visita === hojeStr;
                  return (
                    <div key={v.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/80 transition-colors">
                      <div className="shrink-0 text-center min-w-[52px]">
                        <span className={`text-[9px] font-black block rounded-lg px-2 py-1 ${isHoje ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {isHoje ? 'HOJE' : formatDate(v.data_visita)}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-600 mt-1 block">{v.horario.substring(0, 5)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{nome}</p>
                        <p className="text-xs text-gray-400 truncate">{endereco}</p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        v.status_visita === 'Realizada'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : v.status_visita === 'Cancelada'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {v.status_visita}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="flex flex-col gap-5">

            {/* Acessos Rápidos */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Acessos Rápidos</h2>
              <div className="space-y-2">
                {[
                  { href: '/leads', label: 'Gestão de Leads', sub: `${leadsNovos} novos aguardando`, iconBg: 'bg-blue-50 text-blue-500', hoverBorder: 'hover:border-blue-200' },
                  { href: '/projetos', label: 'Kanban de Projetos', sub: `${emAndamento} obras em andamento`, iconBg: 'bg-orange-50 text-orange-500', hoverBorder: 'hover:border-orange-200' },
                  { href: '/visitas', label: 'Visitas Técnicas', sub: `${visitasHoje} visitas hoje`, iconBg: 'bg-emerald-50 text-emerald-500', hoverBorder: 'hover:border-emerald-200' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 p-3 border border-gray-100 ${item.hoverBorder} rounded-xl transition-all group bg-gray-50 hover:bg-white hover:shadow-sm`}
                  >
                    <div className={`p-1.5 rounded-lg ${item.iconBg}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">{item.label}</p>
                      <p className="text-[10px] text-gray-400">{item.sub}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* Eficiência do Time */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Eficiência do Time</h2>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxa de Conclusão</span>
                  <span className="text-sm font-black text-emerald-600">{taxaConclusao}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                    style={{ width: `${taxaConclusao}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Pipeline de Leads</span>
                {(['Novo', 'Em Contato', 'Qualificado', 'Perdido'] as const).map((s) => {
                  const count = leads.filter((l) => l.status === s).length;
                  const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                  const colors: Record<string, string> = {
                    Novo: 'bg-blue-500',
                    'Em Contato': 'bg-amber-500',
                    Qualificado: 'bg-emerald-500',
                    Perdido: 'bg-rose-400',
                  };
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-20 shrink-0 font-medium">{s}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[s]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-gray-600 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
