import { col, addItem } from '../services/data-service.js';
import { renderLoading, renderEmptyState, openModal, createToast, icons } from '../components/ui.js';

export async function renderStockPage({ company, stations }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company || stations.length === 0) {
    page.innerHTML = renderEmptyState('📊', 'Nenhum Posto', 'Adicione postos primeiro.');
    return page;
  }

  let selectedStation = stations[0].id;

  const render = async () => {
    page.innerHTML = renderLoading('A carregar stock...');
    try {
      const base = `companies/${company.id}/stations/${selectedStation}`;
      const tanks = await col(`${base}/tanks`);
      const readings = await col(`${base}/stockReadings`);
      
      readings.sort((a,b) => (b.date?.toDate?.() || new Date(b.date)) - (a.date?.toDate?.() || new Date(a.date)));

      const fmtDate = d => { try { const dt = d?.toDate ? d.toDate() : new Date(d); return dt.toLocaleString('pt-AO'); } catch { return '—'; }};

      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div style="display:flex;gap:12px;align-items:center">
            <select class="form-select station-select" style="width:auto">
              ${stations.map(st => `<option value="${st.id}" ${selectedStation === st.id ? 'selected' : ''}>${st.name}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary add-btn">${icons.add} Nova Medição Física</button>
        </div>

        <div class="dash-grid three" style="margin-bottom:24px">
          ${tanks.length === 0 ? '<p style="color:var(--text3);grid-column:1/-1;text-align:center">Nenhum tanque cadastrado.</p>' : tanks.map(t => {
            const pct = t.capacity > 0 ? (t.volume / t.capacity) * 100 : 0;
            const color = pct < 20 ? 'red' : pct < 50 ? 'amber' : 'green';
            return `
              <div class="card">
                <div class="card-header"><span class="card-title">${t.product}</span></div>
                <div class="stat-value ${color}" style="font-size:20px">${t.volume?.toLocaleString()} L</div>
                <div class="stat-sub">Stock Teórico (Sistema)</div>
                <div class="progress-bar" style="margin-top:12px"><div class="progress-fill ${color}" style="width:${pct}%"></div></div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Histórico de Medições Físicas</span></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Data/Hora</th><th>Tanque</th><th>Medição (L)</th><th>Teórico (L)</th><th>Diferença</th><th>Responsável</th></tr></thead>
              <tbody>
                ${readings.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3)">Nenhuma medição registada</td></tr>' : readings.map(r => {
                  const diff = r.physicalVolume - r.theoreticalVolume;
                  return `
                    <tr>
                      <td style="font-size:11px">${fmtDate(r.date)}</td>
                      <td>${r.product}</td>
                      <td class="td-mono">${r.physicalVolume?.toLocaleString()} L</td>
                      <td class="td-mono">${r.theoreticalVolume?.toLocaleString()} L</td>
                      <td class="td-mono" style="color:${diff < 0 ? 'var(--red)' : 'var(--green)'}">${diff > 0 ? '+' : ''}${diff?.toLocaleString()} L</td>
                      <td>${r.responsible || '—'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      page.querySelector('.station-select').onchange = (e) => { selectedStation = e.target.value; render(); };
      page.querySelector('.add-btn').onclick = () => showModal(tanks);
    } catch { page.innerHTML = '<div class="alert alert-error">Erro ao carregar stock</div>'; }
  };

  const showModal = (tanks) => {
    const formHtml = `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Tanque *</label>
          <select class="form-input" id="s-tank">
            <option value="">Selecionar...</option>
            ${tanks.map(t => `<option value="${t.id}" data-vol="${t.volume}" data-prod="${t.product}">${t.product} (Atual: ${t.volume} L)</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Volume Medido Fisicamente (L) *</label><input class="form-input" type="number" id="s-phys"></div>
        <div class="form-group"><label class="form-label">Responsável</label><input class="form-input" id="s-resp"></div>
      </div>
    `;
    const footer = `<button class="btn btn-ghost">Cancelar</button><button class="btn btn-primary" id="save-s-btn">Registar Medição</button>`;
    const { modal, close } = openModal({ title: 'Nova Medição de Stock', body: formHtml, footer });
    
    modal.querySelector('.btn-ghost').onclick = close;
    modal.querySelector('#save-s-btn').onclick = async () => {
      const sel = modal.querySelector('#s-tank');
      const opt = sel.options[sel.selectedIndex];
      if (!opt.value) return createToast('Selecione um tanque', 'error');
      
      const data = {
        tankId: opt.value,
        product: opt.dataset.prod,
        physicalVolume: parseFloat(modal.querySelector('#s-phys').value) || 0,
        theoreticalVolume: parseFloat(opt.dataset.vol) || 0,
        responsible: modal.querySelector('#s-resp').value,
        date: new Date()
      };
      
      try {
        await addItem(`companies/${company.id}/stations/${selectedStation}/stockReadings`, data, company.id, 'user', `Medição de stock: ${data.product}`);
        createToast('Medição registada', 'success');
        close();
        render();
      } catch { createToast('Erro ao guardar', 'error'); }
    };
  };

  await render();
  return page;
}
