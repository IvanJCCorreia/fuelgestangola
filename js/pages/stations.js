import { col, addItem, updateItem, deleteItem } from '../services/data-service.js';
import { renderLoading, renderEmptyState, openModal, createToast, icons } from '../components/ui.js';

export async function renderStationsPage({ company, refreshStations }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company) {
    page.innerHTML = renderEmptyState('🏢', 'Nenhuma Empresa', 'Selecione uma empresa primeiro.');
    return page;
  }

  const render = async () => {
    page.innerHTML = renderLoading('A carregar postos...');
    try {
      const stations = await col(`companies/${company.id}/stations`);
      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div><div class="section-label">Gestão</div><h2 style="font-family:Syne,sans-serif;font-size:20px;font-weight:700">Postos de Abastecimento</h2></div>
          <button class="btn btn-primary add-btn">${icons.add} Novo Posto</button>
        </div>
        <div class="dash-grid three">
          ${stations.length === 0 ? '<p style="color:var(--text3);grid-column:1/-1;text-align:center">Nenhum posto cadastrado.</p>' : stations.map(st => `
            <div class="card">
              <div class="card-header"><span class="card-title">${st.name}</span></div>
              <p style="font-size:12px;color:var(--text3);margin-bottom:12px">${st.address || 'Sem endereço'}</p>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span class="badge badge-green">Activo</span>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-ghost btn-xs edit-btn" data-id="${st.id}">${icons.edit}</button>
                  <button class="btn btn-danger btn-xs delete-btn" data-id="${st.id}">${icons.delete}</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      page.querySelector('.add-btn').onclick = () => showModal();
      page.querySelectorAll('.edit-btn').forEach(b => b.onclick = () => showModal(stations.find(s => s.id === b.dataset.id)));
      page.querySelectorAll('.delete-btn').forEach(b => b.onclick = () => handleDelete(b.dataset.id));
    } catch { page.innerHTML = '<div class="alert alert-error">Erro ao carregar postos</div>'; }
  };

  const showModal = (editing = null) => {
    const formHtml = `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Nome do Posto *</label><input class="form-input" id="st-name" value="${editing?.name || ''}" placeholder="Ex: Posto Marginal"></div>
        <div class="form-group"><label class="form-label">Endereço</label><input class="form-input" id="st-addr" value="${editing?.address || ''}"></div>
        <div class="form-group"><label class="form-label">Gerente Responsável</label><input class="form-input" id="st-manager" value="${editing?.manager || ''}"></div>
      </div>
    `;
    const footer = `<button class="btn btn-ghost">Cancelar</button><button class="btn btn-primary" id="save-st-btn">${editing ? 'Actualizar' : 'Criar'}</button>`;
    const { modal, close } = openModal({ title: editing ? 'Editar Posto' : 'Novo Posto', body: formHtml, footer });
    
    modal.querySelector('.btn-ghost').onclick = close;
    modal.querySelector('#save-st-btn').onclick = async () => {
      const data = { name: modal.querySelector('#st-name').value, address: modal.querySelector('#st-addr').value, manager: modal.querySelector('#st-manager').value };
      if (!data.name) return createToast('O nome é obrigatório', 'error');
      try {
        const base = `companies/${company.id}/stations`;
        if (editing) await updateItem(`${base}/${editing.id}`, data, company.id, 'user', `Editou posto: ${data.name}`);
        else await addItem(base, data, company.id, 'user', `Criou posto: ${data.name}`);
        createToast(editing ? 'Posto actualizado' : 'Posto criado', 'success');
        close();
        refreshStations();
        render();
      } catch { createToast('Erro ao guardar', 'error'); }
    };
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este posto?')) return;
    try {
      await deleteItem(`companies/${company.id}/stations/${id}`, company.id, 'user', 'Eliminou posto');
      createToast('Posto eliminado', 'success');
      refreshStations();
      render();
    } catch { createToast('Erro ao eliminar', 'error'); }
  };

  await render();
  return page;
}
