import { col, addItem, updateItem, deleteItem } from '../services/data-service.js';
import { renderLoading, renderEmptyState, openModal, createToast, icons } from '../components/ui.js';

export async function renderReceiptsPage({ company, stations }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company || stations.length === 0) {
    page.innerHTML = renderEmptyState('📦', 'Nenhum Posto', 'Adicione postos primeiro.');
    return page;
  }

  let selectedStation = stations[0].id;
  let receipts = [], tanks = [];

  const render = async () => {
    page.innerHTML = renderLoading('A carregar recepções...');
    try {
      const base = `companies/${company.id}/stations/${selectedStation}`;
      receipts = await col(`${base}/fuelReceipts`);
      tanks = await col(`${base}/tanks`);
      
      receipts.sort((a,b) => (b.date?.toDate?.() || new Date(b.date)) - (a.date?.toDate?.() || new Date(a.date)));

      const fmt = v => v?.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) || '0,00';
      const fmtDate = d => { try { const dt = d?.toDate ? d.toDate() : new Date(d); return dt.toLocaleDateString('pt-AO'); } catch { return '—'; }};

      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div style="display:flex;gap:12px;align-items:center">
            <select class="form-select station-select" style="width:auto">
              ${stations.map(st => `<option value="${st.id}" ${selectedStation === st.id ? 'selected' : ''}>${st.name}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary add-btn">${icons.add} Registar Recepção</button>
        </div>
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Produto</th><th>Quantidade</th><th>Guia Nº</th><th>Motorista</th><th>Ações</th></tr></thead>
              <tbody>
                ${receipts.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3)">Nenhuma recepção registada</td></tr>' : receipts.map(r => `
                  <tr>
                    <td>${fmtDate(r.date)}</td>
                    <td><span class="badge badge-amber">${r.product}</span></td>
                    <td class="td-mono">${r.quantity?.toLocaleString()} L</td>
                    <td class="td-mono">${r.guideNumber || '—'}</td>
                    <td>${r.driverName || '—'}</td>
                    <td><button class="btn btn-ghost btn-xs delete-btn" data-id="${r.id}">${icons.delete}</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      page.querySelector('.station-select').onchange = (e) => { selectedStation = e.target.value; render(); };
      page.querySelector('.add-btn').onclick = () => showModal();
      page.querySelectorAll('.delete-btn').forEach(b => b.onclick = () => handleDelete(b.dataset.id));
    } catch { page.innerHTML = '<div class="alert alert-error">Erro ao carregar recepções</div>'; }
  };

  const showModal = () => {
    const formHtml = `
      <div class="form-grid">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Produto *</label>
            <select class="form-input" id="r-prod">
              <option value="">Selecionar...</option>
              ${tanks.map(t => `<option value="${t.product}">${t.product}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Quantidade (L) *</label><input class="form-input" type="number" id="r-qty"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nº Guia</label><input class="form-input" id="r-guide"></div>
          <div class="form-group"><label class="form-label">Motorista</label><input class="form-input" id="r-driver"></div>
        </div>
        <div class="form-group"><label class="form-label">Data</label><input class="form-input" type="date" id="r-date" value="${new Date().toISOString().split('T')[0]}"></div>
      </div>
    `;
    const footer = `<button class="btn btn-ghost">Cancelar</button><button class="btn btn-primary" id="save-r-btn">Registar</button>`;
    const { modal, close } = openModal({ title: 'Registar Recepção de Combustível', body: formHtml, footer });
    
    modal.querySelector('.btn-ghost').onclick = close;
    modal.querySelector('#save-r-btn').onclick = async () => {
      const data = {
        product: modal.querySelector('#r-prod').value,
        quantity: parseFloat(modal.querySelector('#r-qty').value) || 0,
        guideNumber: modal.querySelector('#r-guide').value,
        driverName: modal.querySelector('#r-driver').value,
        date: new Date(modal.querySelector('#r-date').value)
      };
      if (!data.product || !data.quantity) return createToast('Campos obrigatórios em falta', 'error');
      try {
        const base = `companies/${company.id}/stations/${selectedStation}`;
        await addItem(`${base}/fuelReceipts`, data, company.id, 'user', `Recepção registada: ${data.quantity}L (${data.product})`);
        const tank = tanks.find(t => t.product === data.product);
        if (tank) await updateItem(`${base}/tanks/${tank.id}`, { volume: tank.volume + data.quantity }, company.id, 'user', `Entrada stock (Recepção): ${data.quantity}L`);
        createToast('Recepção registada', 'success');
        close();
        render();
      } catch { createToast('Erro ao guardar', 'error'); }
    };
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta recepção?')) return;
    try {
      await deleteItem(`companies/${company.id}/stations/${selectedStation}/fuelReceipts/${id}`, company.id, 'user', 'Eliminou recepção');
      createToast('Recepção eliminada', 'success');
      render();
    } catch { createToast('Erro ao eliminar', 'error'); }
  };

  await render();
  return page;
}
