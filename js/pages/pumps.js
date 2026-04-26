import { col, addItem, updateItem, deleteItem } from '../services/data-service.js';
import { renderLoading, renderEmptyState, openModal, createToast, icons } from '../components/ui.js';

export async function renderPumpsPage({ company, stations }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company || stations.length === 0) {
    page.innerHTML = renderEmptyState('⛽', 'Nenhum Posto', 'Adicione postos primeiro.');
    return page;
  }

  let selectedStation = stations[0].id;
  let pumps = [];

  const render = async () => {
    page.innerHTML = renderLoading('A carregar bombas...');
    try {
      pumps = await col(`companies/${company.id}/stations/${selectedStation}/pumps`);
      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div style="display:flex;gap:12px;align-items:center">
            <select class="form-select station-select" style="width:auto">
              ${stations.map(st => `<option value="${st.id}" ${selectedStation === st.id ? 'selected' : ''}>${st.name}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary add-btn">${icons.add} Nova Bomba</button>
        </div>
        <div class="dash-grid three">
          ${pumps.length === 0 ? '<p style="color:var(--text3);grid-column:1/-1;text-align:center">Nenhuma bomba neste posto.</p>' : pumps.map(p => `
            <div class="card">
              <div class="card-header">
                <span class="card-title">Bomba #${p.number}</span>
                <span class="badge badge-amber">${p.product}</span>
              </div>
              <div style="font-size:12px;color:var(--text2);margin-bottom:16px">Fabricante: ${p.brand || '—'}</div>
              <div style="display:flex;gap:4px;justify-content:flex-end">
                <button class="btn btn-ghost btn-xs edit-btn" data-id="${p.id}">${icons.edit}</button>
                <button class="btn btn-danger btn-xs delete-btn" data-id="${p.id}">${icons.delete}</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      page.querySelector('.station-select').onchange = (e) => { selectedStation = e.target.value; render(); };
      page.querySelector('.add-btn').onclick = () => showModal();
      page.querySelectorAll('.edit-btn').forEach(b => b.onclick = () => showModal(pumps.find(p => p.id === b.dataset.id)));
      page.querySelectorAll('.delete-btn').forEach(b => b.onclick = () => handleDelete(b.dataset.id));
    } catch { page.innerHTML = '<div class="alert alert-error">Erro ao carregar bombas</div>'; }
  };

  const showModal = (editing = null) => {
    const formHtml = `
      <div class="form-grid">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nº Bomba *</label><input class="form-input" id="p-num" value="${editing?.number || ''}"></div>
          <div class="form-group"><label class="form-label">Produto *</label>
            <select class="form-input" id="p-prod">
              ${['Gasolina 91', 'Gasóleo', 'Gasolina 95', 'LPG'].map(prod => `<option value="${prod}" ${editing?.product === prod ? 'selected' : ''}>${prod}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Marca/Fabricante</label><input class="form-input" id="p-brand" value="${editing?.brand || ''}"></div>
      </div>
    `;
    const footer = `<button class="btn btn-ghost">Cancelar</button><button class="btn btn-primary" id="save-p-btn">${editing ? 'Actualizar' : 'Criar'}</button>`;
    const { modal, close } = openModal({ title: editing ? 'Editar Bomba' : 'Nova Bomba', body: formHtml, footer });
    
    modal.querySelector('.btn-ghost').onclick = close;
    modal.querySelector('#save-p-btn').onclick = async () => {
      const data = { number: modal.querySelector('#p-num').value, product: modal.querySelector('#p-prod').value, brand: modal.querySelector('#p-brand').value };
      if (!data.number || !data.product) return createToast('Campos obrigatórios em falta', 'error');
      try {
        const base = `companies/${company.id}/stations/${selectedStation}/pumps`;
        if (editing) await updateItem(`${base}/${editing.id}`, data, company.id, 'user', `Editou bomba: ${data.number}`);
        else await addItem(base, data, company.id, 'user', `Criou bomba: ${data.number}`);
        createToast(editing ? 'Bomba actualizada' : 'Bomba criada', 'success');
        close();
        render();
      } catch { createToast('Erro ao guardar', 'error'); }
    };
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta bomba?')) return;
    try {
      await deleteItem(`companies/${company.id}/stations/${selectedStation}/pumps/${id}`, company.id, 'user', 'Eliminou bomba');
      createToast('Bomba eliminada', 'success');
      render();
    } catch { createToast('Erro ao eliminar', 'error'); }
  };

  await render();
  return page;
}
