import { 
  onAuthStateChanged, 
  auth, 
  getUserProfile, 
  getCompanyData, 
  col, 
  signOut,
  isDemo
} from './services/data-service.js';
import { renderSidebar } from './components/sidebar.js';
import { createToast, renderLoading } from './components/ui.js';

console.log("🚀 FuelgestApp: Inicializando...");
// Descomente a linha abaixo se quiser um alerta visual no navegador
// alert("O JavaScript começou a carregar!");

// Page Imports
import { renderAuthPage } from './pages/auth.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderCompaniesPage } from './pages/companies.js';
import { renderStationsPage } from './pages/stations.js';
import { renderTanksPage } from './pages/tanks.js';
import { renderPumpsPage } from './pages/pumps.js';
import { renderSalesPage } from './pages/sales.js';
import { renderReceiptsPage } from './pages/receipts.js';
import { renderStockPage } from './pages/stock.js';
import { renderDifferencesPage } from './pages/differences.js';
import { renderReportsPage } from './pages/reports.js';
import { renderUsersPage } from './pages/users.js';
import { renderAuditPage } from './pages/audit.js';
import { renderSettingsPage } from './pages/settings.js';
import { renderSetupPage } from './pages/setup.js';
import { renderProductsPage } from './pages/products.js';

class App {
  constructor() {
    this.appEl = document.getElementById('app');
    this.user = null;
    this.profile = null;
    this.company = null;
    this.companies = [];
    this.stations = [];
    this.currentPage = 'dashboard';
    this.loading = true;
    
    this.init();
  }

  async init() {
    try {
      this.renderInitialLoading();
      
      if (isDemo()) {
        this.setupDemoAuth();
      } else {
        onAuthStateChanged(auth, async (u) => {
          this.user = u;
          if (u) {
            await this.loadSessionData(u.uid);
          } else {
            this.resetSession();
          }
          this.loading = false;
          this.render();
        });
      }
    } catch (error) {
      console.error("❌ Erro fatal na inicialização:", error);
      this.appEl.innerHTML = `
        <div class="loading-screen" style="color:var(--red);padding:20px;text-align:center">
          <div style="font-size:48px;margin-bottom:20px">⚠️</div>
          <h2 style="margin-bottom:10px">Erro ao carregar o sistema</h2>
          <p style="font-size:13px;max-width:400px;margin:0 auto 20px;color:var(--text2)">${error.message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
        </div>
      `;
    }
  }

  setupDemoAuth() {
    const check = async () => {
      const u = JSON.parse(localStorage.getItem('demo_auth'));
      this.user = u ? { email: u.email, uid: u.id } : null;
      if (u) {
        this.profile = u;
        this.company = await getCompanyData(u.companyId);
        this.companies = await col('companies');
        await this.loadStations();
      }
      this.loading = false;
      this.render();
    };
    check();
    window.addEventListener('demo-auth-changed', check);
  }

  async loadSessionData(uid) {
    this.profile = await getUserProfile(uid);
    if (this.profile?.companyId) {
      this.company = await getCompanyData(this.profile.companyId);
      await this.loadStations();
    }
    if (this.profile?.role === 'admin') {
      this.companies = await col('companies');
    }
  }

  async loadStations() {
    if (this.company) {
      this.stations = await col(`companies/${this.company.id}/stations`);
    }
  }

  resetSession() {
    this.user = null;
    this.profile = null;
    this.company = null;
    this.companies = [];
    this.stations = [];
    this.currentPage = 'dashboard';
  }

  async navigate(page) {
    this.currentPage = page;
    this.render();
  }

  async handleLogout() {
    if (isDemo()) {
      localStorage.removeItem('demo_auth');
      window.dispatchEvent(new Event('demo-auth-changed'));
    } else {
      await signOut(auth);
    }
    this.navigate('dashboard');
  }

  renderInitialLoading() {
    this.appEl.innerHTML = `
      <div class="loading-screen">
        <div style="font-size:48px;margin-bottom:16px">⛽</div>
        <div class="spinner" style="width:32px;height:32px"></div>
        <p>A inicializar FuelgestAngola...</p>
      </div>
    `;
  }

  render() {
    if (this.loading) return;
    if (!this.user) {
      this.appEl.innerHTML = '';
      if (this.currentPage === 'setup') {
        this.appEl.appendChild(renderSetupPage({ navigate: (p) => this.navigate(p) }));
      } else {
        this.appEl.appendChild(renderAuthPage({ navigate: (p) => this.navigate(p) }));
      }
      return;
    }

    this.appEl.innerHTML = '';
    const shell = document.createElement('div');
    shell.className = 'app-shell';
    
    const sidebar = renderSidebar({
      currentPage: this.currentPage,
      user: this.user,
      profile: this.profile,
      company: this.company,
      onNavigate: (p) => this.navigate(p),
      onLogout: () => this.handleLogout()
    });
    
    const main = document.createElement('div');
    main.className = 'main';
    
    const topbar = this.renderTopbar();
    const content = document.createElement('div');
    content.id = 'page-content-root';
    
    main.appendChild(topbar);
    main.appendChild(content);
    
    shell.appendChild(sidebar);
    shell.appendChild(main);
    
    this.appEl.appendChild(shell);
    this.renderPage(content);
  }

  renderTopbar() {
    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    
    const titles = {
      dashboard:'Dashboard', companies:'Empresas', stations:'Postos', tanks:'Tanques',
      pumps:'Bombas', sales:'Vendas', receipts:'Recepção de Combustível', stock:'Estoque',
      differences:'Diferenças', reports:'Relatórios', users:'Utilizadores', audit:'Auditoria',
      settings: 'Definições', products: 'Tabela de Preços'
    };

    topbar.innerHTML = `
      <h1 class="page-title">${titles[this.currentPage] || 'Fuelgest'}</h1>
      <div class="topbar-actions">
        ${this.profile?.role === 'admin' && this.companies.length > 0 ? `
          <select class="form-select company-switcher" style="width:auto;font-size:12px">
            <option value="">Trocar empresa...</option>
            ${this.companies.map(c => `<option value="${c.id}" ${this.company?.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        ` : ''}
        <div style="font-size:12px;color:var(--text3)">
          ${new Date().toLocaleDateString('pt-AO', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}
        </div>
      </div>
    `;

    const switcher = topbar.querySelector('.company-switcher');
    if (switcher) {
      switcher.onchange = async (e) => {
        const id = e.target.value;
        if (!id) return;
        this.company = await getCompanyData(id);
        await this.loadStations();
        this.render();
      };
    }

    return topbar;
  }

  async renderPage(container) {
    const pages = {
      dashboard: renderDashboard,
      companies: renderCompaniesPage,
      stations: renderStationsPage,
      tanks: renderTanksPage,
      pumps: renderPumpsPage,
      sales: renderSalesPage,
      receipts: renderReceiptsPage,
      stock: renderStockPage,
      differences: renderDifferencesPage,
      reports: renderReportsPage,
      users: renderUsersPage,
      audit: renderAuditPage,
      settings: renderSettingsPage,
      setup: renderSetupPage,
      products: renderProductsPage
    };

    const renderer = pages[this.currentPage];
    if (renderer) {
      const pageEl = await renderer({
        user: this.user,
        profile: this.profile,
        company: this.company,
        stations: this.stations,
        refreshStations: () => this.loadStations(),
        refreshApp: () => this.render(),
        navigate: (p) => this.navigate(p)
      });
      container.appendChild(pageEl);
    } else {
      container.innerHTML = `<div class="page-content"><div class="empty-state"><h3>Página não encontrada</h3></div></div>`;
    }
  }
}

window.app = new App();
