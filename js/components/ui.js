export const icons = {
  dashboard: '⊞', companies: '🏢', stations: '⛽', tanks: '🛢', pumps: '⚙',
  sales: '💳', receipts: '📦', stock: '📊', reports: '📋', users: '👥',
  logout: '⏏', edit: '✏', delete: '🗑', add: '＋', close: '✕',
  fuel: '⛽', alert: '⚠', check: '✓', arrow: '→', back: '←',
  settings: '⚙', audit: '📜', diff: '⚖', info: 'ⓘ', search: '🔍', save: '💾'
};

export function createToast(msg, type = 'info') {
  const container = document.querySelector('.toasts') || (() => {
    const el = document.createElement('div');
    el.className = 'toasts';
    document.body.appendChild(el);
    return el;
  })();
  
  const id = Date.now();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.id = `toast-${id}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ⓘ';
  toast.innerHTML = `<span>${icon}</span> ${msg}`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

export function openModal({ title, body, footer, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="btn btn-ghost btn-icon close-modal">${icons.close}</button>
    </div>
    <div class="modal-body"></div>
    ${footer ? `<div class="modal-footer"></div>` : ''}
  `;
  
  const bodyContainer = modal.querySelector('.modal-body');
  if (typeof body === 'string') bodyContainer.innerHTML = body;
  else bodyContainer.appendChild(body);
  
  if (footer) {
    const footerContainer = modal.querySelector('.modal-footer');
    if (typeof footer === 'string') footerContainer.innerHTML = footer;
    else footerContainer.appendChild(footer);
  }
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const close = () => {
    overlay.remove();
    if (onClose) onClose();
  };
  
  modal.querySelector('.close-modal').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  
  return { overlay, modal, close };
}

export function openConfirm({ title, message, onConfirm }) {
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost';
  cancelBtn.textContent = 'Cancelar';
  
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-danger';
  confirmBtn.textContent = 'Confirmar';
  
  footer.appendChild(cancelBtn);
  footer.appendChild(confirmBtn);
  
  const { close } = openModal({
    title: title || 'Confirmar',
    body: `<p style="color:var(--text2)">${message}</p>`,
    footer
  });
  
  cancelBtn.onclick = close;
  confirmBtn.onclick = () => {
    onConfirm();
    close();
  };
}

export function renderLoading(msg = 'A carregar...') {
  return `
    <div class="loading-screen">
      <div class="spinner"></div>
      <p>${msg}</p>
    </div>
  `;
}

export function renderEmptyState(icon, title, p) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${p}</p>
    </div>
  `;
}
