import React from 'react';
import LeadForm from '@/components/public/lead-form';
import WhatsAppButton from '@/components/public/whatsapp-button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      {/* Header / Nav */}
      <header className="fixed top-0 left-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              OKKA
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold px-2 py-0.5 border border-slate-800 rounded bg-slate-900">
              Piso Aquecido
            </span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
            <a href="#tecnologia" className="hover:text-orange-400 transition-colors">Tecnologia</a>
            <a href="/login" className="text-orange-400 hover:text-orange-350 transition-colors font-semibold">Acessar CRM ➔</a>
          </nav>
          <a
            href="#orcamento"
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-orange-500/20"
          >
            Solicitar Orçamento
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(226,91,60,0.08)_0%,transparent_60%)] pointer-events-none" />
        
        <div className="max-w-4xl text-center space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            O Futuro da Climatização Residencial
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight md:leading-none">
            Conforto térmico invisível,{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-500 to-rose-600 bg-clip-text text-transparent">
              sofisticação que se sente.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Sistemas de calefação por piso radiante elétrico ou hidráulico de alta performance. Calor uniforme, sustentável e sob medida para o seu lar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#orcamento"
              className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-xl shadow-orange-500/10 text-center"
            >
              Simular Projeto
            </a>
            <a
              href="#tecnologia"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 hover:border-slate-700 font-semibold rounded-xl transition-all text-center"
            >
              Conhecer Tecnologia
            </a>
          </div>
        </div>
      </section>

      {/* Seção Tecnologia */}
      <section id="tecnologia" className="py-20 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold">Tecnologia Inteligente de Aquecimento</h2>
            <p className="text-slate-400">Nossas malhas térmicas e termostatos inteligentes trabalham em conjunto para criar a melhor experiência residencial.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-900 hover:border-orange-500/20 transition-all space-y-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Eficiência Térmica</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Instalação direta sob o acabamento, garantindo que 99% da energia seja convertida em calor radiante.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-900 hover:border-orange-500/20 transition-all space-y-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Controle IoT por App</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Termostatos digitais com Wi-Fi para programação de horários e controle completo por smartphone ou Alexa.</p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-900 hover:border-orange-500/20 transition-all space-y-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Segurança Avançada</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Dupla isolação contra umidade (grau de proteção IPX7) e malha de aterramento para proteção total de sua família.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Captura / Lead Section */}
      <section id="orcamento" className="py-20 bg-slate-900/40 relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          
          {/* Informações da Esquerda */}
          <div className="md:col-span-6 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Solicite uma análise técnica personalizada
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Descubra a viabilidade e o custo estimado de instalação do piso aquecido para o seu imóvel. Nossa equipe de engenharia avaliará as especificações técnicas da sua obra.
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Dimensionamento Inteligente</h4>
                  <p className="text-sm text-slate-400">Projetos sob medida otimizados para menor consumo de energia.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Instalação Ágil</h4>
                  <p className="text-sm text-slate-400">Visitas técnicas qualificadas que reduzem em até 30% o tempo de obra.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário à Direita */}
          <div className="md:col-span-6">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
              
              <h3 className="text-xl font-bold text-slate-100 mb-6">Fale com um especialista</h3>

              {/* Renderiza o Lead Capture Form Component */}
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-center text-sm text-slate-500">
        <p>© 2026 OKKA Piso Aquecido. Todos os direitos reservados. Projetos residenciais de alto padrão.</p>
      </footer>

      {/* Renderiza o Botão Flutuante do WhatsApp */}
      <WhatsAppButton />
    </div>
  );
}
