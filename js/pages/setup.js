import {
  auth,
  db,
  createUserWithEmailAndPassword,
  setDoc,
  doc,
  collection,
  addDoc
} from '../services/data-service.js';
import { createToast } from '../components/ui.js';

export function renderSetupPage({ navigate }) {
  const page = document.createElement('div');
  page.className = 'auth-page';

  page.innerHTML = `
    <div class="auth-right" style="width:100%;max-width:500px;margin:auto">
      <div class="auth-form-header">
        <img src="assets/logo.png" alt="Logo" style="height:65px;width:auto;margin-bottom:20px">
        <h2>🚀 Configuração Inicial</h2>
        <p>Crie a sua empresa e o utilizador administrador para começar.</p>
      </div>
      <form id="setup-form" class="form-grid">
        <div class="section-label">Dados da Empresa</div>
        <div class="form-group">
          <label class="form-label">Nome da Empresa</label>
          <input class="form-input" id="c-name" required placeholder="Ex: Fuelgest Angola Lda">
        </div>
        
        <div class="divider"></div>
        <div class="section-label">Dados do Administrador</div>
        <div class="form-group">
          <label class="form-label">Seu Nome</label>
          <input class="form-input" id="u-name" required placeholder="Seu Nome Completo">
        </div>
        <div class="form-group">
          <label class="form-label">Email de Acesso</label>
          <input class="form-input" type="email" id="u-email" required placeholder="admin@empresa.ao">
        </div>
        <div class="form-group">
          <label class="form-label">Senha</label>
          <input class="form-input" type="password" id="u-pass" required placeholder="Mínimo 6 caracteres">
        </div>
        
        <button class="btn btn-primary" type="submit" id="setup-btn" style="margin-top:20px">
          Criar Sistema e Entrar
        </button>
      </form>
      <button class="auth-link" id="back-login" style="margin-top:20px">Voltar ao Login</button>
    </div>
  `;

  page.querySelector('#back-login').onclick = () => navigate('dashboard');

  page.querySelector('#setup-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = page.querySelector('#setup-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> A configurar...';

    const cName = page.querySelector('#c-name').value;
    const uName = page.querySelector('#u-name').value;
    const uEmail = page.querySelector('#u-email').value;
    const uPass = page.querySelector('#u-pass').value;

    try {
      // 1. Criar Usuário no Auth
      const cred = await createUserWithEmailAndPassword(auth, uEmail, uPass);
      const uid = cred.user.uid;

      // 2. Criar Empresa no Firestore
      const companyRef = await addDoc(collection(db, 'companies'), {
        name: cName,
        nif: 'Pendente',
        active: true,
        createdAt: new Date()
      });
      const companyId = companyRef.id;

      // 3. Criar Perfil do Usuário
      await setDoc(doc(db, 'users', uid), {
        name: uName,
        email: uEmail,
        role: 'admin',
        companyId: companyId,
        createdAt: new Date()
      });

      createToast('Sistema configurado com sucesso!', 'success');
      window.location.reload(); // Recarregar para entrar no dashboard
    } catch (err) {
      console.error(err);
      createToast('Erro: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = 'Criar Sistema e Entrar';
    }
  };

  return page;
}
