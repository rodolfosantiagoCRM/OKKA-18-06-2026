export interface Profile {
  id: string;
  name: string;
  role: 'admin' | 'tecnico';
  created_at: string;
}

export interface Lead {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  cidade: string;
  area_m2: number | null;
  status: 'Novo' | 'Em Contato' | 'Qualificado' | 'Perdido';
  criado_em: string;
}

export interface Project {
  id: string;
  lead_id: string | null;
  status_projeto: 'Orçamento' | 'Preparação' | 'Instalação' | 'Teste de Carga' | 'Concluído';
  endereco: string;
  valor_total: number;
  criado_em: string;
  leads?: Lead | null;
}

export interface Visita {
  id: string;
  project_id: string;
  data_visita: string; // YYYY-MM-DD
  horario: string; // HH:MM
  status_visita: 'Agendada' | 'Realizada' | 'Cancelada';
  material_usado: string[];
  valor_gasto: number;
  observacoes: string | null;
  criado_em: string;
  cliente?: string; // Propriedade opcional para dados de mockup local
  endereco?: string; // Propriedade opcional para dados de mockup local
  projects?: Project & { leads?: Lead | null } | null;
}
