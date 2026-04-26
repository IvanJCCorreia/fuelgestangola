import { col, addItem, updateItem, deleteItem } from '../services/data-service.js';
import { renderLoading, renderEmptyState, openModal, createToast, icons } from '../components/ui.js';

export async function renderCompaniesPage({ user }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  const render = async () => {
    page.innerHTML = renderLoading('A carregar empresas...');
    try {
      const companies = await col('companies');
      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div><div class="section-label">Administração</div><h2 style="font-family:Syne,sans-serif;font-size:20px;font-weight:700">Gestão de Empresas</h2></div>
          <button class="btn btn-primary add-btn">${icons.add} Nova Empresa</button>
        </div>
        <div class="table-wrap card">
          <table>
            <thead><tr><th>Empresa</th><th>NIF</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              ${companies.length === 0 ? '<tr><td colspan="4" style="text-align:center;padding:20px">Nenhuma empresa registada</td></tr>' : companies.map(c => `
                <tr>
                  <td>
                    <div style="font-weight:600">${c.name}</div>
                    <div style="font-size:11px;color:var(--text3)">${c.email || ''}</div>
                  </td>
                  <td class="td-mono">${c.nif}</td>
                  <td><span class="badge badge-${c.active ? 'green' : 'red'}">${c.active ? 'Activa' : 'Inactiva'}</span></td>
                  <td>
                    <div style="display:flex;gap:4px">
                      <button class="btn btn-ghost btn-xs edit-btn" data-id="${c.id}">${icons.edit}</button>
                      <button class="btn btn-danger btn-xs delete-btn" data-id="${c.id}">${icons.delete}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      page.querySelector('.add-btn').onclick = () => showModal();
      page.querySelectorAll('.edit-btn').forEach(b => b.onclick = () => showModal(companies.find(c => c.id === b.dataset.id)));
      page.querySelectorAll('.delete-btn').forEach(b => b.onclick = () => handleDelete(b.dataset.id));
    } catch { page.innerHTML = '<div class="alert alert-error">Erro ao carregar empresas</div>'; }
  };

  const showModal = (editing = null) => {
    const formHtml = `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Nome da Empresa *</label><input class="form-input" id="c-name" value="${editing?.name || ''}"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">NIF *</label><input class="form-input" id="c-nif" value="${editing?.nif || ''}"></div>
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="c-email" value="${editing?.email || ''}"></div>
        </div>
        <div class="form-group" style="flex-direction:row;align-items:center;gap:10px">
          <input type="checkbox" id="c-active" ${editing ? (editing.active ? 'checked' : '') : 'checked'}>
          <label class="form-label" for="c-active">Empresa Activa</label>
        </div>
      </div>
    `;
    const footer = `<button class="btn btn-ghost">Cancelar</button><button class="btn btn-primary" id="save-c-btn">${editing ? 'Actualizar' : 'Criar'}</button>`;
    const { modal, close } = openModal({ title: editing ? 'Editar Empresa' : 'Nova Empresa', body: formHtml, footer });
    
    modal.querySelector('.btn-ghost').onclick = close;
    modal.querySelector('#save-c-btn').onclick = async () => {
      const data = { 
        name: modal.querySelector('#c-name').value, 
        nif: modal.querySelector('#c-nif').value,
        email: modal.querySelector('#c-email').value,
        active: modal.querySelector('#c-active').checked
      };
      if (!data.name || !data.nif) return createToast('Campos obrigatórios em falta', 'error');
      try {
        if (editing) await updateItem(`companies/${editing.id}`, data, editing.id, 'admin', 'Actualização de Empresa');
        else await addItem('companies', data, 'admin', 'admin', 'Criação de Empresa');
        createToast(editing ? 'Empresa actualizada' : 'Empresa criada', 'success');
        close();
        render();
      } catch { createToast('Erro ao guardar', 'error'); }
    };
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta empresa? Todos os dados associados serão perdidos.')) return;
    try {
      await deleteItem(`companies/${id}`, 'admin', 'admin', 'Eliminação de Empresa');
      createToast('Empresa eliminada', 'success');
      render();
    } catch { createToast('Erro ao eliminar', 'error'); }
  };

  await render();
  return page;
}
