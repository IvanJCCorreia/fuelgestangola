import { col, addItem, isDemo } from '../services/data-service.js';
import { renderLoading, renderEmptyState, openModal, createToast, icons } from '../components/ui.js';

export async function renderUsersPage({ company }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  const render = async () => {
    page.innerHTML = renderLoading('A carregar utilizadores...');
    try {
      const users = await col('users');
      const roleColors = { admin: 'purple', manager: 'blue', operator: 'green' };
      
      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div><div class="section-label">Administração</div><h2 style="font-family:Syne,sans-serif;font-size:20px;font-weight:700">Utilizadores</h2></div>
          <button class="btn btn-primary add-btn">${icons.add} Novo Utilizador</button>
        </div>
        <div class="table-wrap card">
          <table>
            <thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Empresa ID</th><th>Ações</th></tr></thead>
            <tbody>
              ${users.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:20px">Nenhum utilizador registado</td></tr>' : users.map(u => `
                <tr>
                  <td><div style="font-weight:600">${u.name || '—'}</div></td>
                  <td>${u.email}</td>
                  <td><span class="badge badge-${roleColors[u.role] || 'gray'}">${u.role}</span></td>
                  <td class="td-mono" style="font-size:10px">${u.companyId || '—'}</td>
                  <td><button class="btn btn-ghost btn-xs">${icons.edit}</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      page.querySelector('.add-btn').onclick = () => showModal();
    } catch { page.innerHTML = '<div class="alert alert-error">Erro ao carregar utilizadores</div>'; }
  };

  const showModal = () => {
    const formHtml = `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Nome Completo</label><input class="form-input" id="u-name"></div>
        <div class="form-group"><label class="form-label">Email *</label><input class="form-input" type="email" id="u-email"></div>
        <div class="form-group"><label class="form-label">Senha *</label><input class="form-input" type="password" id="u-pass"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Função</label>
            <select class="form-input" id="u-role">
              <option value="operator">Operador</option>
              <option value="manager">Gerente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Empresa ID</label><input class="form-input" id="u-comp" value="${company?.id || ''}"></div>
        </div>
      </div>
    `;
    const footer = `<button class="btn btn-ghost">Cancelar</button><button class="btn btn-primary" id="save-u-btn">Criar Utilizador</button>`;
    const { modal, close } = openModal({ title: 'Novo Utilizador', body: formHtml, footer });
    
    modal.querySelector('.btn-ghost').onclick = close;
    modal.querySelector('#save-u-btn').onclick = async () => {
      const email = modal.querySelector('#u-email').value;
      const pass = modal.querySelector('#u-pass').value;
      if (!email || !pass) return createToast('Email e Senha são obrigatórios', 'error');

      if (isDemo()) {
        const data = { name: modal.querySelector('#u-name').value, email, role: modal.querySelector('#u-role').value, companyId: modal.querySelector('#u-comp').value };
        await addItem('users', data);
        createToast('Utilizador criado (Demo)', 'success');
        close();
        render();
        return;
      }

      try {
        const { auth, createUserWithEmailAndPassword, db, doc, setDoc } = await import('../services/data-service.js');
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, 'users', cred.user.uid), { 
          name: modal.querySelector('#u-name').value, 
          email, 
          role: modal.querySelector('#u-role').value, 
          companyId: modal.querySelector('#u-comp').value,
          createdAt: new Date()
        });
        createToast('Utilizador criado com sucesso', 'success');
        close();
        render();
      } catch (e) {
        createToast(e.message, 'error');
      }
    };
  };

  await render();
  return page;
}
