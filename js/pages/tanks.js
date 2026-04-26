import { col, addItem, updateItem, deleteItem } from '../services/data-service.js';
import { renderLoading, renderEmptyState, openModal, createToast, icons } from '../components/ui.js';

export async function renderTanksPage({ company, stations }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company || stations.length === 0) {
    page.innerHTML = renderEmptyState('⛽', 'Nenhum Posto', 'Adicione postos primeiro.');
    return page;
  }

  let selectedStation = stations[0].id;
  let tanks = [];

  const render = async () => {
    page.innerHTML = renderLoading('A carregar tanques...');
    try {
      tanks = await col(`companies/${company.id}/stations/${selectedStation}/tanks`);
      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div style="display:flex;gap:12px;align-items:center">
            <select class="form-select station-select" style="width:auto">
              ${stations.map(st => `<option value="${st.id}" ${selectedStation === st.id ? 'selected' : ''}>${st.name}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary add-btn">${icons.add} Novo Tanque</button>
        </div>
        <div class="dash-grid three">
          ${tanks.length === 0 ? '<p style="color:var(--text3);grid-column:1/-1;text-align:center">Nenhum tanque neste posto.</p>' : tanks.map(t => {
            const pct = t.capacity > 0 ? (t.volume / t.capacity) * 100 : 0;
            const color = pct < 20 ? 'red' : pct < 50 ? 'amber' : 'green';
            return `
              <div class="card">
                <div class="card-header">
                  <span class="card-title">${t.product}</span>
                  <span class="badge badge-gray">ID: ${t.number || '—'}</span>
                </div>
                <div class="tank-indicator" style="background:transparent;border:none;padding:0">
                  <div class="progress-bar"><div class="progress-fill ${color}" style="width:${pct}%"></div></div>
                  <div class="tank-info" style="margin-top:8px">
                    <span>${t.volume?.toLocaleString()} L</span>
                    <span>Cap: ${t.capacity?.toLocaleString()} L</span>
                  </div>
                </div>
                <div style="display:flex;gap:4px;margin-top:16px;justify-content:flex-end">
                  <button class="btn btn-ghost btn-xs edit-btn" data-id="${t.id}">${icons.edit}</button>
                  <button class="btn btn-danger btn-xs delete-btn" data-id="${t.id}">${icons.delete}</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      page.querySelector('.station-select').onchange = (e) => { selectedStation = e.target.value; render(); };
      page.querySelector('.add-btn').onclick = () => showModal();
      page.querySelectorAll('.edit-btn').forEach(b => b.onclick = () => showModal(tanks.find(t => t.id === b.dataset.id)));
      page.querySelectorAll('.delete-btn').forEach(b => b.onclick = () => handleDelete(b.dataset.id));
    } catch { page.innerHTML = '<div class="alert alert-error">Erro ao carregar tanques</div>'; }
  };

  const showModal = (editing = null) => {
    const formHtml = `
      <div class="form-grid">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nº Tanque</label><input class="form-input" id="t-num" value="${editing?.number || ''}"></div>
          <div class="form-group"><label class="form-label">Produto *</label>
            <select class="form-input" id="t-prod">
              ${['Gasolina', 'Gasóleo', 'Petróleo'].map(p => `<option value="${p}" ${editing?.product === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Capacidade (L) *</label><input class="form-input" type="number" id="t-cap" value="${editing?.capacity || ''}"></div>
          <div class="form-group"><label class="form-label">Volume Atual (L) *</label><input class="form-input" type="number" id="t-vol" value="${editing?.volume || ''}"></div>
        </div>
      </div>
    `;
    const footer = `<button class="btn btn-ghost">Cancelar</button><button class="btn btn-primary" id="save-t-btn">${editing ? 'Actualizar' : 'Criar'}</button>`;
    const { modal, close } = openModal({ title: editing ? 'Editar Tanque' : 'Novo Tanque', body: formHtml, footer });
    
    modal.querySelector('.btn-ghost').onclick = close;
    modal.querySelector('#save-t-btn').onclick = async () => {
      const data = { 
        number: modal.querySelector('#t-num').value, 
        product: modal.querySelector('#t-prod').value,
        capacity: parseFloat(modal.querySelector('#t-cap').value) || 0,
        volume: parseFloat(modal.querySelector('#t-vol').value) || 0
      };
      if (!data.product || !data.capacity) return createToast('Campos obrigatórios em falta', 'error');
      try {
        const base = `companies/${company.id}/stations/${selectedStation}/tanks`;
        if (editing) await updateItem(`${base}/${editing.id}`, data, company.id, 'user', `Editou tanque: ${data.product}`);
        else await addItem(base, data, company.id, 'user', `Criou tanque: ${data.product}`);
        createToast(editing ? 'Tanque actualizado' : 'Tanque criado', 'success');
        close();
        render();
      } catch { createToast('Erro ao guardar', 'error'); }
    };
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este tanque?')) return;
    try {
      await deleteItem(`companies/${company.id}/stations/${selectedStation}/tanks/${id}`, company.id, 'user', 'Eliminou tanque');
      createToast('Tanque eliminado', 'success');
      render();
    } catch { createToast('Erro ao eliminar', 'error'); }
  };

  await render();
  return page;
}
