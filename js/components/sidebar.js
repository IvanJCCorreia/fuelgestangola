import { icons } from './ui.js';

export function renderSidebar({ currentPage, user, profile, company, onNavigate, onLogout }) {
  const navGroups = [
    { label: 'Principal', items: [
      { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    ]},
    { label: 'Operações', items: [
      { id: 'sales', label: 'Vendas', icon: icons.sales },
      { id: 'receipts', label: 'Recepção', icon: icons.receipts },
      { id: 'stock', label: 'Estoque', icon: icons.stock },
      { id: 'differences', label: 'Diferenças', icon: icons.diff },
    ]},
    { label: 'Gestão', items: [
      { id: 'stations', label: 'Postos', icon: icons.stations },
      { id: 'tanks', label: 'Tanques', icon: icons.tanks },
      { id: 'pumps', label: 'Bombas', icon: icons.pumps },
      { id: 'products', label: 'Tabela de Preços', icon: icons.settings },
    ]},
    { label: 'Análise', items: [
      { id: 'reports', label: 'Relatórios', icon: icons.reports },
    ]},
    ...(profile?.role === 'admin' ? [{ label: 'Administração', items: [
      { id: 'companies', label: 'Empresas', icon: icons.companies },
      { id: 'users', label: 'Utilizadores', icon: icons.users },
      { id: 'audit', label: 'Auditoria', icon: icons.audit },
    ]}] : []),
    { label: 'Sistema', items: [
      { id: 'settings', label: 'Definições', icon: icons.settings },
    ]},
  ];

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  
  sidebar.innerHTML = `
    <div class="sidebar-logo" style="padding: 30px 20px; border-bottom: 1px solid rgba(255,255,255,0.05)">
      <div class="logo-mark" style="display: flex; align-items: center; gap: 12px;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3)">⛽</div>
        <div style="display: flex; flex-direction: column;">
          <span style="font-family: 'Syne', sans-serif; font-weight: 800; font-size: 19px; letter-spacing: -0.5px; line-height: 1; color: #fff;">Fuel<span style="color: #f97316;">gest</span></span>
          <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; font-weight: 600; margin-top: 4px;">Angola</span>
        </div>
      </div>
    </div>
    ${company ? `
      <div class="company-selector">
        <div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-family:'JetBrains Mono,monospace',text-transform:'uppercase',letter-spacing:'.08em'">Empresa Activa</div>
        <div style="font-size:13px;font-weight:600;color:var(--accent);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${company.name}</div>
        <div style="font-size:11px;color:var(--text3)">${company.nif || 'NIF não configurado'}</div>
      </div>
    ` : ''}
    <nav class="sidebar-nav"></nav>
    <div class="sidebar-footer">
      <div class="user-chip">
        <div class="user-avatar">${user?.email?.[0]?.toUpperCase() || '?'}</div>
        <div class="user-info">
          <div class="user-name">${user?.email?.split('@')[0] || 'Usuário'}</div>
          <div class="user-role">${profile?.role || 'operator'}</div>
        </div>
        <span style="font-size:14px;color:var(--text3)">${icons.logout}</span>
      </div>
    </div>
  `;

  const nav = sidebar.querySelector('.sidebar-nav');
  navGroups.forEach(grp => {
    const grpEl = document.createElement('div');
    grpEl.className = 'nav-group';
    grpEl.innerHTML = `<div class="nav-group-label">${grp.label}</div>`;
    
    grp.items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = `nav-item ${currentPage === item.id ? 'active' : ''}`;
      itemEl.innerHTML = `
        <span style="font-size:16px">${item.icon}</span>
        <span>${item.label}</span>
      `;
      itemEl.onclick = () => onNavigate(item.id);
      grpEl.appendChild(itemEl);
    });
    nav.appendChild(grpEl);
  });

  sidebar.querySelector('.user-chip').onclick = onLogout;

  return sidebar;
}
