import { col } from '../services/data-service.js';
import { renderLoading, renderEmptyState, icons } from '../components/ui.js';

export async function renderDifferencesPage({ company, stations }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company || stations.length === 0) {
    page.innerHTML = renderEmptyState('⚖', 'Nenhum Posto', 'Adicione postos primeiro.');
    return page;
  }

  let selectedStation = stations[0].id;

  const render = async () => {
    page.innerHTML = renderLoading('A analisar diferenças...');
    try {
      const base = `companies/${company.id}/stations/${selectedStation}`;
      const readings = await col(`${base}/stockReadings`);
      
      const fmtDate = d => { try { const dt = d?.toDate ? d.toDate() : new Date(d); return dt.toLocaleString('pt-AO'); } catch { return '—'; }};

      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div style="display:flex;gap:12px;align-items:center">
            <select class="form-select station-select" style="width:auto">
              ${stations.map(st => `<option value="${st.id}" ${selectedStation === st.id ? 'selected' : ''}>${st.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Análise de Quebras e Sobras</span></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Produto</th><th>Stock Sistema</th><th>Medição Real</th><th>Diferença</th><th>Estado</th></tr></thead>
              <tbody>
                ${readings.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3)">Nenhuma medição para análise</td></tr>' : readings.map(r => {
                  const diff = r.physicalVolume - r.theoreticalVolume;
                  const pct = r.theoreticalVolume > 0 ? (diff / r.theoreticalVolume) * 100 : 0;
                  const status = Math.abs(pct) < 0.5 ? 'Aceitável' : diff < 0 ? 'Quebra Crítica' : 'Sobra Excessiva';
                  const color = Math.abs(pct) < 0.5 ? 'green' : 'red';
                  return `
                    <tr>
                      <td style="font-size:11px">${fmtDate(r.date)}</td>
                      <td>${r.product}</td>
                      <td class="td-mono">${r.theoreticalVolume?.toLocaleString()} L</td>
                      <td class="td-mono">${r.physicalVolume?.toLocaleString()} L</td>
                      <td class="td-mono" style="color:${diff < 0 ? 'var(--red)' : 'var(--green)'}">${diff > 0 ? '+' : ''}${diff?.toLocaleString()} L (${pct.toFixed(2)}%)</td>
                      <td><span class="badge badge-${color}">${status}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div style="margin-top:20px" class="alert alert-info">
          💡 <strong>Nota:</strong> Diferenças até 0.5% são geralmente consideradas dentro da margem de erro operacional (evaporação, calibração). Valores superiores devem ser investigados.
        </div>
      `;
      page.querySelector('.station-select').onchange = (e) => { selectedStation = e.target.value; render(); };
    } catch { page.innerHTML = '<div class="alert alert-error">Erro ao analisar dados</div>'; }
  };

  await render();
  return page;
}
