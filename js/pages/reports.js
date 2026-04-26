import { col } from '../services/data-service.js';
import { renderLoading, renderEmptyState, icons } from '../components/ui.js';

export async function renderReportsPage({ company, stations }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company || stations.length === 0) {
    page.innerHTML = renderEmptyState('📋', 'Nenhum Posto', 'Adicione postos primeiro.');
    return page;
  }

  let selectedStation = stations[0].id;
  let dateFrom = new Date(new Date().setDate(today().getDate() - 7)).toISOString().split('T')[0];
  let dateTo = new Date().toISOString().split('T')[0];
  let reportData = null;
  let loading = false;

  function today() { return new Date(); }

  const render = async () => {
    page.innerHTML = `
      <div style="margin-bottom:20px"><div class="section-label">Análise</div><h2 style="font-family:Syne,sans-serif;font-size:20px;font-weight:700">Relatórios Operacionais</h2></div>
      
      <div class="card" style="margin-bottom:24px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;align-items:flex-end">
          <div class="form-group">
            <label class="form-label">Posto</label>
            <select class="form-input" id="rep-station">
              ${stations.map(st => `<option value="${st.id}" ${selectedStation === st.id ? 'selected' : ''}>${st.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data Início</label>
            <input class="form-input" type="date" id="rep-from" value="${dateFrom}">
          </div>
          <div class="form-group">
            <label class="form-label">Data Fim</label>
            <input class="form-input" type="date" id="rep-to" value="${dateTo}">
          </div>
          <button class="btn btn-primary" id="gen-rep-btn" ${loading ? 'disabled' : ''}>
            ${loading ? '<span class="spinner"></span> Gerando...' : '📋 Gerar Relatório'}
          </button>
        </div>
      </div>

      <div id="report-result">
        ${reportData ? renderReportContent(reportData) : '<div class="empty-state"><p>Selecione os parâmetros e clique em Gerar Relatório.</p></div>'}
      </div>
    `;

    page.querySelector('#gen-rep-btn').onclick = generateReport;
    page.querySelector('#rep-station').onchange = (e) => selectedStation = e.target.value;
    page.querySelector('#rep-from').onchange = (e) => dateFrom = e.target.value;
    page.querySelector('#rep-to').onchange = (e) => dateTo = e.target.value;
  };

  async function generateReport() {
    loading = true;
    render();
    try {
      const base = `companies/${company.id}/stations/${selectedStation}`;
      const sales = await col(`${base}/sales`);
      const receipts = await col(`${base}/fuelReceipts`);
      
      const from = new Date(dateFrom); from.setHours(0,0,0,0);
      const to = new Date(dateTo); to.setHours(23,59,59,999);

      const filteredSales = sales.filter(s => {
        const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        return d >= from && d <= to;
      });

      const filteredReceipts = receipts.filter(r => {
        const d = r.date?.toDate ? r.date.toDate() : new Date(r.date);
        return d >= from && d <= to;
      });

      const revenue = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
      const liters = filteredSales.reduce((acc, s) => acc + (s.liters || 0), 0);
      
      const byPayment = filteredSales.reduce((acc, s) => {
        acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + (s.total || 0);
        return acc;
      }, {});

      reportData = { revenue, liters, salesCount: filteredSales.length, receiptsCount: filteredReceipts.length, byPayment, sales: filteredSales };
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar relatório');
    }
    loading = false;
    render();
  }

  function renderReportContent(data) {
    const fmt = v => v?.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) || '0,00';
    return `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card amber"><div class="stat-label">Receita Total</div><div class="stat-value amber">AOA ${fmt(data.revenue)}</div><div class="stat-sub">${data.salesCount} transacções</div></div>
        <div class="stat-card green"><div class="stat-label">Litros Vendidos</div><div class="stat-value green">${data.liters.toFixed(2)} L</div></div>
        <div class="stat-card blue"><div class="stat-label">Recepções</div><div class="stat-value blue">${data.receiptsCount}</div><div class="stat-sub">Entradas de stock</div></div>
      </div>

      <div class="dash-grid">
        <div class="card">
          <div class="card-header"><span class="card-title">Receita por Forma de Pagamento</span></div>
          ${Object.entries(data.byPayment).map(([m, v]) => `
            <div class="report-metric">
              <span class="report-metric-label">${m}</span>
              <span class="report-metric-value">AOA ${fmt(v)}</span>
            </div>
          `).join('')}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Resumo de Litros</span></div>
          <p style="color:var(--text3);font-size:13px">Relatório detalhado por produto e bomba disponível na exportação PDF (Brevemente).</p>
        </div>
      </div>
    `;
  }

  await render();
  return page;
}
