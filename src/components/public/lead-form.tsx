'use client';

import React, { useState } from 'react';
import { leadsService } from '@/services/leadsService';

export default function LeadForm() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
    area_m2: '',
    endereco: '',
    numero: '',
    tipo_servico: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await leadsService.createLead({
        nome: formData.nome,
        email: formData.email || null,
        telefone: formData.telefone,
        cidade: formData.cidade,
        area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : null,
        endereco_obra: formData.endereco ? `${formData.endereco}${formData.numero ? `, ${formData.numero}` : ''}` : null,
        numero: formData.numero || null,
        tipo_servico: formData.tipo_servico || null,
      });

      setSuccess(true);
      setFormData({ nome: '', email: '', telefone: '', cidade: '', area_m2: '', endereco: '', numero: '', tipo_servico: '' });
    } catch (err: any) {
      console.error('Falha ao enviar lead:', err);
      setError(err.message || 'Ocorreu um erro ao enviar seus dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-slate-200">Solicitação Enviada!</h4>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Agradecemos seu contato. Nossa equipe analisará as dimensões informadas e retornará em até 24 horas úteis.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium underline cursor-pointer"
        >
          Enviar outra solicitação
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Nome Completo
        </label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          required
          placeholder="Ex: João Silva"
          className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-650 outline-none transition-all text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="telefone" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Telefone / WhatsApp
          </label>
          <input
            type="tel"
            id="telefone"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            required
            placeholder="(00) 00000-0000"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-650 outline-none transition-all text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="nome@email.com"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-650 outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="cidade" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cidade / UF
          </label>
          <input
            type="text"
            id="cidade"
            name="cidade"
            value={formData.cidade}
            onChange={handleChange}
            required
            placeholder="Ex: Curitiba / PR"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-650 outline-none transition-all text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="area_m2" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Área estimada (m²)
          </label>
          <input
            type="number"
            id="area_m2"
            name="area_m2"
            value={formData.area_m2}
            onChange={handleChange}
            required
            min="5"
            placeholder="Ex: 120"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-650 outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="space-y-1.5 sm:col-span-8">
          <label htmlFor="endereco" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Endereço (Rua, Avenida)
          </label>
          <input
            type="text"
            id="endereco"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            placeholder="Ex: Av. Sete de Setembro"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-650 outline-none transition-all text-sm"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-4">
          <label htmlFor="numero" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Número
          </label>
          <input
            type="text"
            id="numero"
            name="numero"
            value={formData.numero}
            onChange={handleChange}
            placeholder="Ex: 405"
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-650 outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tipo_servico" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Tipo de Serviço
        </label>
        <div className="relative">
          <select
            id="tipo_servico"
            name="tipo_servico"
            value={formData.tipo_servico}
            onChange={handleChange}
            required
            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="" disabled>Selecione o serviço desejado</option>
            <option value="Instalação Sistemas Solares">Instalação Sistemas Solares</option>
            <option value="Limpeza de placas Solares">Limpeza de placas Solares</option>
            <option value="Aquecimento de piso">Aquecimento de piso</option>
            <option value="Carregamento Veicular">Carregamento Veicular</option>
          </select>
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 mt-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-xl shadow-orange-500/15 flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          'Solicitar Análise Gratuita'
        )}
      </button>
    </form>
  );
}
