import { isDemo } from '../services/data-service.js';
import { icons } from '../components/ui.js';

export function renderAuthPage({ navigate }) {
  const page = document.createElement('div');
  page.className = 'auth-page';
  
  let mode = 'login';
  
  const render = () => {
    page.innerHTML = `
      <div class="auth-left">
        <div class="auth-hero" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 60px; position: relative; z-index: 2; background: #000; overflow: hidden;">
          <div style="position: relative; z-index: 10; text-align: left;">
            <div style="background: #f97316; width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(249, 115, 22, 0.2)">⛽</div>
            <h1 style="font-family: 'Syne', sans-serif; font-weight: 800; font-size: 48px; letter-spacing: -2px; line-height: 0.9; color: #fff; margin-bottom: 5px;">Fuel<span style="color: #f97316;">gest</span></h1>
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 6px; color: #666; font-weight: 700; margin-bottom: 30px;">Angola</p>
            <p style="font-size: 18px; color: #888; font-weight: 500; max-width: 320px; line-height: 1.5;">Gestão inteligente para o mercado de combustíveis angolano.</p>
          </div>
          
          <!-- Masterpiece Illustration - Far Right -->
          <div style="position: absolute; bottom: 0; right: -80px; width: 100%; height: 100%; background: url('assets/worker_final.png') no-repeat bottom right; background-size: contain; z-index: 1; opacity: 1; pointer-events: none;"></div>
          
          <!-- Subtle Gradient to prevent overlap -->
          <div style="position: absolute; inset: 0; background: linear-gradient(to right, #000 40%, transparent 90%); z-index: 2;"></div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-header">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px;">
            <div style="background: #f97316; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;">⛽</div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -1px; line-height: 1; color: #fff;">Fuel<span style="color: #f97316;">gest</span></span>
              <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 4px; color: #666; font-weight: 700; margin-top: 2px;">Angola</span>
            </div>
          </div>
          <h2>${mode === 'login' ? 'Bem-vindo de volta' : 'Recuperar senha'}</h2>
          <p>${mode === 'login' ? 'Aceda à sua conta para continuar' : 'Insira o seu email para recuperar a senha'}</p>
        </div>
        <div id="auth-alert"></div>
        <form id="auth-form" class="form-grid">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" id="email" required placeholder="email@empresa.ao">
          </div>
          ${mode === 'login' ? `
            <div class="form-group">
              <label class="form-label">Senha</label>
              <input class="form-input" type="password" id="password" required placeholder="••••••••">
            </div>
          ` : ''}
          <button class="btn btn-primary" type="submit" style="margin-top:8px" id="submit-btn">
            ${mode === 'login' ? 'Entrar' : 'Enviar email'}
          </button>
        </form>
        <div style="margin-top:20px;display:flex;justify-content:space-between;alignItems:center">
          ${mode === 'login'
            ? `<button class="auth-link" id="toggle-mode">Esqueci a senha</button>`
            : `<button class="auth-link" id="toggle-mode">${icons.back} Voltar ao login</button>`
          }
          ${!isDemo() ? `<button class="auth-link" id="goto-setup" style="color:var(--amber)">Configurar Sistema 🚀</button>` : ''}
        </div>
        <div class="divider"></div>
        <p style="font-size:11px;color:var(--text3);text-align:center">FuelgestAngola v2.1 · Dados isolados por empresa · Conformidade ANPG</p>
      </div>
    `;

    if (page.querySelector('#goto-setup')) {
      page.querySelector('#goto-setup').onclick = () => navigate('setup');
    }

    page.querySelector('#toggle-mode').onclick = () => {
      mode = mode === 'login' ? 'reset' : 'login';
      render();
    };

    page.querySelector('#auth-form').onsubmit = async (e) => {
      e.preventDefault();
      const email = page.querySelector('#email').value;
      const password = mode === 'login' ? page.querySelector('#password').value : null;
      const alert = page.querySelector('#auth-alert');
      const btn = page.querySelector('#submit-btn');
      
      alert.innerHTML = '';
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> A processar...';

      if (isDemo()) {
        if (mode === 'login') {
          const demoUser = { id: 'demo_user', name: 'Gestor Demo', email, role: 'admin', companyId: 'demo_comp' };
          localStorage.setItem('demo_users', JSON.stringify([demoUser]));
          localStorage.setItem('demo_companies', JSON.stringify([{ id: 'demo_comp', name: 'Empresa Demo Lda', nif: '123456789', active: true }]));
          localStorage.setItem('demo_auth', JSON.stringify(demoUser));
          window.dispatchEvent(new Event('demo-auth-changed'));
        } else {
          alert.innerHTML = '<div class="alert alert-success">Email de recuperação enviado (Simulação)!</div>';
          btn.disabled = false;
          btn.innerHTML = 'Enviar email';
        }
        return;
      }

      // Real Firebase Auth
      try {
        const { auth, signInWithEmailAndPassword, sendPasswordResetEmail } = await import('../services/data-service.js');
        if (mode === 'login') {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await sendPasswordResetEmail(auth, email);
          alert.innerHTML = '<div class="alert alert-success">Email de recuperação enviado!</div>';
        }
      } catch (err) {
        const msgs = {
          'auth/user-not-found': 'Utilizador não encontrado.',
          'auth/wrong-password': 'Senha incorreta.',
          'auth/invalid-credential': 'Credenciais inválidas.',
          'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
        };
        alert.innerHTML = `<div class="alert alert-error">${msgs[err.code] || 'Erro de autenticação.'}</div>`;
      }
      btn.disabled = false;
      btn.innerHTML = mode === 'login' ? 'Entrar' : 'Enviar email';
    };
  };

  render();
  return page;
}
