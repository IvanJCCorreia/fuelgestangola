import { col } from '../services/data-service.js';
import { renderLoading, renderEmptyState, icons } from '../components/ui.js';

export async function renderAuditPage({ company }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company) {
    page.innerHTML = renderEmptyState('📜', 'Nenhuma Empresa', 'Selecione uma empresa para ver o log.');
    return page;
  }

  const render = async () => {
    page.innerHTML = renderLoading('A carregar logs...');
    try {
      const logs = await col(`companies/${company.id}/audit`);
      logs.sort((a,b) => (b.timestamp?.toDate?.() || new Date(b.timestamp)) - (a.timestamp?.toDate?.() || new Date(a.timestamp)));

      const fmtDate = d => { try { const dt = d?.toDate ? d.toDate() : new Date(d); return dt.toLocaleString('pt-AO'); } catch { return '—'; }};

      page.innerHTML = `
        <div style="margin-bottom:20px"><div class="section-label">Administração</div><h2 style="font-family:Syne,sans-serif;font-size:20px;font-weight:700">Log de Auditoria</h2></div>
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Data/Hora</th><th>Utilizador</th><th>Acção</th><th>Detalhes</th></tr></thead>
              <tbody>
                ${logs.length === 0 ? '<tr><td colspan="4" style="text-align:center;padding:20px">Nenhum log registado</td></tr>' : logs.map(l => `
                  <tr>
                    <td style="font-size:11px">${fmtDate(l.timestamp)}</td>
                    <td><span class="chip">${l.userId || 'Sistema'}</span></td>
                    <td style="font-weight:600">${l.action}</td>
                    <td style="font-size:11px;color:var(--text3);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title='${JSON.stringify(l.details)}'>
                      ${JSON.stringify(l.details)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch { page.innerHTML = '<div class="alert alert-error">Erro ao carregar auditoria</div>'; }
  };

  await render();
  return page;
}
