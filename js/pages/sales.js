import { col, addItem, updateItem, deleteItem } from '../services/data-service.js';
import { renderLoading, renderEmptyState, openModal, createToast, icons } from '../components/ui.js';

export async function renderSalesPage({ company, stations }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company || stations.length === 0) {
    page.innerHTML = renderEmptyState('⛽', 'Nenhum Posto', 'Adicione postos para registar vendas.');
    return page;
  }

  let selectedStation = stations[0].id;
  let sales = [], pumps = [], tanks = [];
  let filterDate = '';

  const render = async () => {
    page.innerHTML = renderLoading('A carregar vendas...');
    
    try {
      const base = `companies/${company.id}/stations/${selectedStation}`;
      sales = await col(`${base}/sales`);
      pumps = await col(`${base}/pumps`);
      tanks = await col(`${base}/tanks`);
      const products = await col(`companies/${company.id}/products`);
      
      sales.sort((a,b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return db - da;
      });

      const filtered = filterDate ? sales.filter(s => {
        const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        return d.toISOString().split('T')[0] === filterDate;
      }) : sales;

      const fmt = v => v?.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) || '0,00';
      const fmtDate = d => { try { const dt = d?.toDate ? d.toDate() : new Date(d); return dt.toLocaleString('pt-AO', { hour:'2-digit', minute:'2-digit' }); } catch { return '—'; }};

      page.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div style="display:flex;gap:12px;align-items:center">
            <select class="form-select station-select" style="width:auto">
              ${stations.map(st => `<option value="${st.id}" ${selectedStation === st.id ? 'selected' : ''}>${st.name}</option>`).join('')}
            </select>
            <input type="date" class="form-input date-filter" style="width:auto" value="${filterDate}">
          </div>
          <button class="btn btn-primary add-sale-btn">${icons.add} Registar Venda</button>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Data/Hora</th><th>Bomba</th><th>Litros</th><th>P. Unit</th><th>Total</th><th>Pagamento</th><th>Ações</th></tr></thead>
              <tbody>
                ${filtered.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text3)">Nenhuma venda registada</td></tr>' : filtered.map(s => `
                  <tr>
                    <td style="font-size:11px">${fmtDate(s.date)}</td>
                    <td><span class="chip">Bomba #${pumps.find(p => p.id === s.pumpId)?.number || '?'}</span></td>
                    <td class="td-mono">${s.liters?.toFixed(2)} L</td>
                    <td class="td-mono">AOA ${fmt(s.pricePerLiter)}</td>
                    <td class="td-mono" style="color:var(--accent);font-weight:700">AOA ${fmt(s.total)}</td>
                    <td><span class="badge badge-gray">${s.paymentMethod}</span></td>
                    <td>
                      <button class="btn btn-ghost btn-xs delete-sale" data-id="${s.id}">${icons.delete}</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Event Listeners
      page.querySelector('.station-select').onchange = (e) => { selectedStation = e.target.value; render(); };
      page.querySelector('.date-filter').onchange = (e) => { filterDate = e.target.value; render(); };
      page.querySelector('.add-sale-btn').onclick = () => showSaleModal();
      page.querySelectorAll('.delete-sale').forEach(b => b.onclick = () => handleDelete(b.dataset.id));

    } catch (e) {
      console.error(e);
      page.innerHTML = '<div class="alert alert-error">Erro ao carregar vendas</div>';
    }
  };

  const showSaleModal = () => {
    const formHtml = `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Bomba *</label>
          <select class="form-input" id="modal-pump" required>
            <option value="">Selecionar bomba...</option>
            ${pumps.map(p => `<option value="${p.id}">Bomba #${p.number} (${p.product})</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Contador Inicial</label><input class="form-input" type="number" id="modal-read-init" placeholder="0.00"></div>
          <div class="form-group"><label class="form-label">Contador Final</label><input class="form-input" type="number" id="modal-read-end" placeholder="0.00"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Litros Calculados</label><input class="form-input" type="number" step="0.01" id="modal-liters" placeholder="Ex: 50.00"></div>
          <div class="form-group">
            <label class="form-label">Preço Unit. (AOA)</label>
            <input class="form-input" type="number" id="modal-price" readonly style="background:var(--surface3);cursor:not-allowed;font-weight:700;color:var(--accent)">
          </div>
        </div>
        <div id="modal-total-display" style="padding:16px;background:rgba(245,158,11,.1);border-radius:8px;text-align:center;display:none">
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase">Total da Venda</div>
          <div style="font-size:24px;font-weight:800;color:var(--accent)" id="total-val">AOA 0,00</div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Pagamento</label>
            <select class="form-input" id="modal-pay">
              ${['Numerário','Multicaixa','Transferência','Crédito'].map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Data/Hora</label><input class="form-input" type="datetime-local" id="modal-date"></div>
        </div>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `<button class="btn btn-ghost">Cancelar</button><button class="btn btn-primary" id="save-sale-btn">Registar Venda</button>`;

    const { modal, close } = openModal({ title: 'Registar Venda', body: formHtml, footer });
    
    const readInit = modal.querySelector('#modal-read-init');
    const readEnd = modal.querySelector('#modal-read-end');
    const litersInput = modal.querySelector('#modal-liters');
    const priceInput = modal.querySelector('#modal-price');
    const pumpSelect = modal.querySelector('#modal-pump');
    const totalDisplay = modal.querySelector('#modal-total-display');
    const totalVal = modal.querySelector('#total-val');

    const products = await col(`companies/${company.id}/products`);

    const updatePrice = () => {
      const pumpId = pumpSelect.value;
      const pump = pumps.find(p => p.id === pumpId);
      if (pump) {
        const prod = products.find(p => p.name.toLowerCase() === pump.product.toLowerCase());
        priceInput.value = prod ? prod.price : 0;
        if (!prod) createToast(`Preço não definido para ${pump.product}`, 'warn');
      } else {
        priceInput.value = '';
      }
      updateTotals();
    };

    pumpSelect.onchange = updatePrice;

    const updateTotals = () => {
      const init = parseFloat(readInit.value) || 0;
      const end = parseFloat(readEnd.value) || 0;
      if (end >= init && end > 0) {
        litersInput.value = (end - init).toFixed(2);
      }
      const l = parseFloat(litersInput.value) || 0;
      const p = parseFloat(priceInput.value) || 0;
      if (l > 0 && p > 0) {
        totalDisplay.style.display = 'block';
        totalVal.textContent = `AOA ${(l * p).toLocaleString('pt-AO', { minimumFractionDigits:2 })}`;
      } else {
        totalDisplay.style.display = 'none';
      }
    };

    readInit.oninput = updateTotals;
    readEnd.oninput = updateTotals;
    litersInput.oninput = updateTotals;
    priceInput.oninput = updateTotals;

    modal.querySelector('.btn-ghost').onclick = close;
    modal.querySelector('#save-sale-btn').onclick = async () => {
      const pumpId = modal.querySelector('#modal-pump').value;
      const liters = parseFloat(litersInput.value);
      const price = parseFloat(priceInput.value);
      const pay = modal.querySelector('#modal-pay').value;
      const dateVal = modal.querySelector('#modal-date').value;

      if (!pumpId || !liters || !price) return createToast('Preencha os campos obrigatórios', 'error');

      const pump = pumps.find(p => p.id === pumpId);
      const tank = tanks.find(t => t.product === pump.product);

      const saleData = {
        pumpId, liters, pricePerLiter: price, total: liters * price,
        paymentMethod: pay, date: dateVal ? new Date(dateVal) : new Date(),
        product: pump.product,
        readInit: parseFloat(readInit.value) || 0,
        readEnd: parseFloat(readEnd.value) || 0
      };

      try {
        const base = `companies/${company.id}/stations/${selectedStation}`;
        await addItem(`${base}/sales`, saleData, company.id, 'user', `Venda registada: ${liters}L`);
        if (tank) {
          await updateItem(`${base}/tanks/${tank.id}`, { volume: tank.volume - liters }, company.id, 'user', `Saída stock (Venda): ${liters}L`);
        }
        createToast('Venda registada com sucesso', 'success');
        close();
        render();
      } catch (e) {
        createToast('Erro ao registar venda', 'error');
      }
    };
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta venda?')) return;
    try {
      await deleteItem(`companies/${company.id}/stations/${selectedStation}/sales/${id}`, company.id, 'user', 'Eliminação de venda');
      createToast('Venda eliminada', 'success');
      render();
    } catch { createToast('Erro ao eliminar', 'error'); }
  };

  await render();
  return page;
}
