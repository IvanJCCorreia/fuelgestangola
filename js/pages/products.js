import { col, addItem, updateItem, deleteItem } from '../services/data-service.js';
import { renderLoading, renderEmptyState, openModal, createToast, icons } from '../components/ui.js';

export async function renderProductsPage({ company }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company) return page;

  const render = async () => {
    page.innerHTML = renderLoading('A carregar produtos...');
    
    try {
      const products = await col(`companies/${company.id}/products`);
      
      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <h2 class="page-title">Tabela de Preços</h2>
          <button class="btn btn-primary add-product-btn">${icons.add} Novo Produto</button>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Produto</th><th>Preço Unitário (AOA)</th><th>Ações</th></tr></thead>
              <tbody>
                ${products.length === 0 ? '<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--text3)">Nenhum produto configurado</td></tr>' : products.map(p => `
                  <tr>
                    <td><span class="chip" style="font-weight:700;padding:6px 12px">${p.name}</span></td>
                    <td class="td-mono" style="font-size:16px;color:var(--accent);font-weight:700">
                      AOA ${p.price?.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style="display:flex;gap:8px">
                        <button class="btn btn-ghost btn-xs edit-product" data-id="${p.id}">${icons.edit}</button>
                        <button class="btn btn-ghost btn-xs delete-product" data-id="${p.id}">${icons.delete}</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      page.querySelector('.add-product-btn').onclick = () => showProductModal();
      page.querySelectorAll('.edit-product').forEach(b => {
        b.onclick = () => showProductModal(products.find(p => p.id === b.dataset.id));
      });
      page.querySelectorAll('.delete-product').forEach(b => {
        b.onclick = () => handleDelete(b.dataset.id);
      });

    } catch (e) {
      page.innerHTML = '<div class="alert alert-error">Erro ao carregar produtos</div>';
    }
  };

  const showProductModal = (product = null) => {
    const formHtml = `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Nome do Produto (Ex: Gasolina, Gasóleo)</label>
          <input class="form-input" id="prod-name" value="${product?.name || ''}" placeholder="Ex: Gasolina" required>
        </div>
        <div class="form-group">
          <label class="form-label">Preço por Litro (AOA)</label>
          <input class="form-input" type="number" step="0.01" id="prod-price" value="${product?.price || ''}" placeholder="0.00" required>
        </div>
        <p style="font-size:11px;color:var(--text3);margin-top:10px">
          ${icons.info} Este preço será aplicado automaticamente em todas as novas vendas.
        </p>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `<button class="btn btn-ghost">Cancelar</button><button class="btn btn-primary" id="save-prod-btn">${product ? 'Atualizar' : 'Criar'} Produto</button>`;

    const { modal, close } = openModal({ title: product ? 'Editar Produto' : 'Novo Produto', body: formHtml, footer });

    modal.querySelector('.btn-ghost').onclick = close;
    modal.querySelector('#save-prod-btn').onclick = async () => {
      const name = modal.querySelector('#prod-name').value;
      const price = parseFloat(modal.querySelector('#prod-price').value);

      if (!name || isNaN(price)) return createToast('Preencha os campos corretamente', 'error');

      try {
        if (product) {
          await updateItem(`companies/${company.id}/products/${product.id}`, { name, price }, company.id, 'user', `Preço alterado: ${name} -> ${price} AOA`);
        } else {
          await addItem(`companies/${company.id}/products`, { name, price }, company.id, 'user', `Novo produto: ${name} (${price} AOA)`);
        }
        createToast('Tabela de preços atualizada', 'success');
        close();
        render();
      } catch { createToast('Erro ao gravar produto', 'error'); }
    };
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este produto da tabela de preços?')) return;
    try {
      await deleteItem(`companies/${company.id}/products/${id}`, company.id, 'user', 'Produto removido');
      render();
    } catch { createToast('Erro ao eliminar', 'error'); }
  };

  await render();
  return page;
}
