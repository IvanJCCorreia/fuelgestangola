import { col } from '../services/data-service.js';
import { renderLoading, renderEmptyState } from '../components/ui.js';

export async function renderDashboard({ company, stations }) {
  const page = document.createElement('div');
  page.className = 'page-content';
  
  if (!company || stations.length === 0) {
    page.innerHTML = renderEmptyState('⛽', 'Configuração Pendente', 'Adicione uma empresa e postos para visualizar o dashboard.');
    return page;
  }

  page.innerHTML = renderLoading('A carregar dashboard...');

  try {
    const today = new Date(); today.setHours(0,0,0,0);
    let salesDay = 0, salesTotal = 0, receiptsDay = 0, allSales = [], allTanks = [];
    const salesByStation = {};

    for (const st of stations) {
      salesByStation[st.name] = 0;
      const base = `companies/${company.id}/stations/${st.id}`;
      // Sales
      const salesData = await col(`${base}/sales`);
      salesData.forEach(s => {
        const val = (s.total || 0);
        salesTotal += val;
        salesByStation[st.name] += val;
        const sDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        if (sDate >= today) salesDay += val;
        allSales.push({ ...s, stationName: st.name });
      });
      // Tanks
      const tanksData = await col(`${base}/tanks`);
      tanksData.forEach(t => allTanks.push({ ...t, stationName: st.name }));
    }

    const tanksLow = allTanks.filter(t => t.capacity > 0 && (t.volume / t.capacity) < 0.2).length;
    allSales.sort((a, b) => {
      const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const db_ = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return db_ - da;
    });

    const fmt = v => v?.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) || '0,00';
    const fmtDate = d => { try { const dt = d?.toDate ? d.toDate() : new Date(d); return dt.toLocaleDateString('pt-AO'); } catch { return '—'; }};

    page.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card amber">
          <div class="stat-label">Vendas Hoje</div>
          <div class="stat-value amber">AOA ${fmt(salesDay)}</div>
          <div class="stat-sub">Valor total do dia</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Vendas Total</div>
          <div class="stat-value green">AOA ${fmt(salesTotal)}</div>
          <div class="stat-sub">Acumulado</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-label">Postos Ativos</div>
          <div class="stat-value blue">${stations.length}</div>
          <div class="stat-sub">Postos registados</div>
        </div>
        <div class="stat-card" style="border-color: ${tanksLow > 0 ? 'rgba(239,68,68,.3)' : 'var(--border)'}">
          <div class="stat-label">Alertas Stock</div>
          <div class="stat-value ${tanksLow > 0 ? 'red' : 'green'}">${tanksLow}</div>
          <div class="stat-sub">Tanques com stock baixo (<20%)</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">📊 Comparativo de Vendas por Posto (AOA)</span></div>
        <div style="height:300px;position:relative">
          <canvas id="stationsChart"></canvas>
        </div>
      </div>

      <div class="dash-grid" style="margin-bottom:20px">
        <div class="card">
          <div class="card-header"><span class="card-title">🛢 Estado dos Tanques</span></div>
          <div class="tanks-list" style="display:flex;flex-direction:column;gap:10px">
            ${allTanks.length === 0 ? '<p style="color:var(--text3);text-align:center;padding:20px">Nenhum tanque</p>' : allTanks.map(t => {
              const pct = t.capacity > 0 ? Math.min(100, (t.volume / t.capacity) * 100) : 0;
              const color = pct < 20 ? 'red' : pct < 50 ? 'amber' : 'green';
              return `
                <div class="tank-indicator">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <div class="tank-name">${t.product} — ${t.stationName}</div>
                    <span class="badge badge-${color === 'amber' ? 'amber' : color === 'red' ? 'red' : 'green'}">${pct.toFixed(0)}%</span>
                  </div>
                  <div class="progress-bar"><div class="progress-fill ${color}" style="width:${pct}%"></div></div>
                  <div class="tank-info">
                    <span>${t.volume?.toLocaleString()} L restantes</span>
                    <span>Cap: ${t.capacity?.toLocaleString()} L</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">💳 Últimas Vendas</span></div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead><tr><th>Posto</th><th>Litros</th><th>Total</th><th>Data</th></tr></thead>
              <tbody>
                ${allSales.length === 0 ? '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text3)">Nenhuma venda</td></tr>' : allSales.slice(0, 8).map(s => `
                  <tr>
                    <td><span class="chip">${s.stationName}</span></td>
                    <td class="td-mono">${s.liters?.toFixed(2)} L</td>
                    <td class="td-mono" style="color:var(--accent)">${fmt(s.total)}</td>
                    <td style="color:var(--text3);font-size:11px">${fmtDate(s.date)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      ${tanksLow > 0 ? `
        <div class="alert alert-warn">
          ⚠ <strong>${tanksLow} tanque(s) com stock crítico</strong> — Nível abaixo de 20%. Considere efectuar uma recepção de combustível.
        </div>
      ` : ''}
    `;

    // Initialize Chart
    setTimeout(() => {
      const ctx = document.getElementById('stationsChart');
      if (ctx && window.Chart) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: Object.keys(salesByStation),
            datasets: [{
              label: 'Vendas Totais (AOA)',
              data: Object.values(salesByStation),
              backgroundColor: 'rgba(245, 158, 11, 0.7)',
              borderColor: '#f59e0b',
              borderWidth: 1,
              borderRadius: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `AOA ${context.parsed.y.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`
                }
              }
            },
            scales: {
              y: { 
                beginAtZero: true, 
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#71717a' }
              },
              x: { 
                grid: { display: false },
                ticks: { color: '#71717a' }
              }
            }
          }
        });
      }
    }, 100);
  } catch (e) {
    console.error(e);
    page.innerHTML = '<div class="alert alert-error">Erro ao carregar dashboard</div>';
  }

  return page;
}
