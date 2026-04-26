import { updateItem, getCompanyData } from '../services/data-service.js';
import { createToast, icons } from '../components/ui.js';

export async function renderSettingsPage({ company, refreshApp }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company) {
    page.innerHTML = '<div class="empty-state"><h3>Selecione uma empresa</h3></div>';
    return page;
  }

  const render = () => {
    page.innerHTML = `
      <div style="margin-bottom:20px"><div class="section-label">Configuração</div><h2 style="font-family:Syne,sans-serif;font-size:20px;font-weight:700">Definições da Empresa</h2></div>
      <div class="card" style="max-width:600px">
        <form id="settings-form" class="form-grid">
          <div class="form-group"><label class="form-label">Nome da Empresa</label><input class="form-input" id="s-name" value="${company.name || ''}"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">NIF</label><input class="form-input" id="s-nif" value="${company.nif || ''}"></div>
            <div class="form-group"><label class="form-label">Telefone</label><input class="form-input" id="s-phone" value="${company.phone || ''}"></div>
          </div>
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="s-email" value="${company.email || ''}"></div>
          <div class="form-group"><label class="form-label">Endereço</label><textarea class="form-textarea" id="s-addr">${company.address || ''}</textarea></div>
          <button class="btn btn-primary" type="submit" id="save-settings-btn">Guardar Alterações</button>
        </form>
      </div>
    `;

    page.querySelector('#settings-form').onsubmit = async (e) => {
      e.preventDefault();
      const btn = page.querySelector('#save-settings-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> a guardar...';

      const data = {
        name: page.querySelector('#s-name').value,
        nif: page.querySelector('#s-nif').value,
        phone: page.querySelector('#s-phone').value,
        email: page.querySelector('#s-email').value,
        address: page.querySelector('#s-addr').value
      };

      try {
        await updateItem(`companies/${company.id}`, data, company.id, 'user', 'Actualização de dados da empresa');
        createToast('Definições actualizadas', 'success');
        refreshApp();
      } catch {
        createToast('Erro ao guardar', 'error');
      }
      btn.disabled = false;
      btn.innerHTML = 'Guardar Alterações';
    };
  };

  render();
  return page;
}
