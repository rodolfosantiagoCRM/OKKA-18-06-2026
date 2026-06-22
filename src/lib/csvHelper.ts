/**
 * Utilitário para formatar matrizes de dados como CSV e disparar o download no navegador.
 * Adiciona o BOM UTF-8 para garantir que acentuação e caracteres especiais funcionem no Excel em português.
 */
export function downloadCSV(filename: string, headers: string[], rows: any[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      row
        .map(val => {
          if (val === null || val === undefined) return '""';
          if (Array.isArray(val)) {
            const arrStr = val.join('; ');
            return `"${arrStr.replace(/"/g, '""')}"`;
          }
          const str = String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
  ].join('\n');

  // Adiciona BOM (Byte Order Mark) para garantir suporte UTF-8 no Excel
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
