// Envia e-mail de recuperação de senha para santfelicee@gmail.com
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xpzvwcrpfejygvflwkkk.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwenZ3Y3JwZmVqeWd2Zmx3a2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDIyNjAsImV4cCI6MjA5NzI3ODI2MH0.zQ2p1iARXvVCESxD5s6UmR6X1knFO2f5-Aom0p-lzBA';

const supabase = createClient(supabaseUrl, anonKey);

async function sendReset() {
  const email = 'santfelicee@gmail.com';
  // A URL de redirecionamento após o reset — ajuste se o app estiver em outro domínio
  const redirectTo = 'https://okka-18-06-2026.vercel.app/login';

  console.log(`Enviando e-mail de recuperação para: ${email}`);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error('Erro:', error.message);
  } else {
    console.log('');
    console.log('✅ E-mail de recuperação enviado com sucesso!');
    console.log(`Verifique a caixa de entrada de ${email}`);
    console.log('Clique no link do e-mail e defina uma nova senha.');
    console.log('Depois é só fazer login no CRM normalmente.');
  }
}

sendReset().catch(console.error);
