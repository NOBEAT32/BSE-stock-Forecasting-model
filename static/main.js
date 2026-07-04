// =========================================================
// main.js — BSE Stock Forecasting Dashboard
// =========================================================

// ---- GLOBAL CHART DEFAULTS ----
Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#1f2d45';
Chart.defaults.font.family = "'Space Grotesk', sans-serif";
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = '#1a2235';
Chart.defaults.plugins.tooltip.borderColor = '#1f2d45';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.titleColor = '#e2e8f0';
Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';

// ---- ACCENT COLORS ----
const C = {
    purple: '#a78bfa',
    green: '#34d399',
    blue: '#60a5fa',
    pink: '#f472b6',
    orange: '#fb923c',
    red: '#f87171',
    muted: '#64748b',
};

// ---- ACTIVE CHART INSTANCES (for destroy on re-render) ----
const charts = {};

function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// =========================================================
// 1. HISTORICAL PRICE CHART
// =========================================================
async function loadHistorical(period = '1Y') {
    const loader = document.getElementById('histLoader');
    loader.classList.remove('hidden');

    try {
        const res = await fetch(`/api/historical?period=${period}`);
        const data = await res.json();

        destroyChart('historical');
        const ctx = document.getElementById('historicalChart').getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, 'rgba(167,139,250,0.25)');
        gradient.addColorStop(1, 'rgba(167,139,250,0.00)');

        charts['historical'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [{
                    label: 'Close Price (₹)',
                    data: data.prices,
                    borderColor: C.purple,
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    pointRadius: 0,
                    tension: 0.3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#1f2d45' },
                        ticks: {
                            maxTicksLimit: 8,
                            maxRotation: 0,
                        }
                    },
                    y: {
                        grid: { color: '#1f2d45' },
                        ticks: {
                            callback: v => '₹' + v.toLocaleString('en-IN')
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Historical chart error:', e);
    } finally {
        loader.classList.add('hidden');
    }
}

// Period button listeners
document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadHistorical(btn.dataset.period);
    });
});


// =========================================================
// 2. MODEL COMPARISON CHARTS
// =========================================================
async function loadMetricCharts() {
    const res = await fetch('/api/metrics');
    const results = await res.json();

    const models = results.map(r => r.Model);
    const colors = [C.red, C.orange, C.green, C.blue, C.purple];

    const barOpts = (label, unit = '') => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.parsed.y}${unit}`
                }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#1f2d45' } }
        }
    });

    // RMSE
    destroyChart('rmse');
    charts['rmse'] = new Chart(
        document.getElementById('rmseChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: models,
            datasets: [{
                label: 'RMSE',
                data: results.map(r => r.RMSE),
                backgroundColor: colors,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            ...barOpts('RMSE', ' ₹'),
            plugins: {
                ...barOpts().plugins,
                title: { display: true, text: 'RMSE  (lower is better ↓)', color: '#e2e8f0', font: { size: 13, weight: '500' } }
            }
        }
    }
    );

    // MAPE
    destroyChart('mape');
    charts['mape'] = new Chart(
        document.getElementById('mapeChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: models,
            datasets: [{
                label: 'MAPE',
                data: results.map(r => r.MAPE),
                backgroundColor: colors,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            ...barOpts('MAPE', '%'),
            plugins: {
                ...barOpts().plugins,
                title: { display: true, text: 'MAPE %  (lower is better ↓)', color: '#e2e8f0', font: { size: 13, weight: '500' } }
            }
        }
    }
    );

    // MAE
    destroyChart('mae');
    charts['mae'] = new Chart(
        document.getElementById('maeChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: models,
            datasets: [{
                label: 'MAE',
                data: results.map(r => r.MAE),
                backgroundColor: colors,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            ...barOpts('MAE', ' ₹'),
            plugins: {
                ...barOpts().plugins,
                title: { display: true, text: 'MAE  (lower is better ↓)', color: '#e2e8f0', font: { size: 13, weight: '500' } }
            }
        }
    }
    );

    // Directional Accuracy
    const dirResults = results.filter(r => r.Directional_Acc);
    destroyChart('dir');
    charts['dir'] = new Chart(
        document.getElementById('dirChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: dirResults.map(r => r.Model),
            datasets: [
                {
                    label: 'Directional Accuracy',
                    data: dirResults.map(r => r.Directional_Acc),
                    backgroundColor: [C.orange, C.green, C.blue, C.purple],
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Random Baseline (50%)',
                    data: dirResults.map(() => 50),
                    type: 'line',
                    borderColor: C.red,
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#1f2d45' }, min: 40, max: 80 }
            },
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Directional Accuracy %  (higher is better ↑)', color: '#e2e8f0', font: { size: 13, weight: '500' } },
                tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}%` } }
            }
        }
    }
    );
}


// =========================================================
// 3. FORECAST CHARTS
// =========================================================

// ---- Prophet ----
async function loadProphetForecast(days = 30) {
    const loader = document.getElementById('forecastLoader');
    loader.classList.remove('hidden');

    try {
        const res = await fetch(`/api/forecast/prophet?days=${days}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        destroyChart('forecast');
        const ctx = document.getElementById('forecastChart').getContext('2d');

        const gradFut = ctx.createLinearGradient(0, 0, 0, 320);
        gradFut.addColorStop(0, 'rgba(167,139,250,0.20)');
        gradFut.addColorStop(1, 'rgba(167,139,250,0.00)');

        // Combine dates for x-axis
        const allDates = [...data.hist_dates, ...data.fut_dates];
        const histLen = data.hist_dates.length;
        const futLen = data.fut_dates.length;

        // Pad arrays with null so lines don't connect across boundary
        const histPrices = [...data.hist_prices, ...Array(futLen).fill(null)];
        const futPrices = [...Array(histLen - 1).fill(null), data.hist_prices[histLen - 1], ...data.fut_yhat];
        const upperBand = [...Array(histLen - 1).fill(null), data.hist_prices[histLen - 1], ...data.fut_upper];
        const lowerBand = [...Array(histLen - 1).fill(null), data.hist_prices[histLen - 1], ...data.fut_lower];

        charts['forecast'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allDates,
                datasets: [
                    {
                        label: 'Historical',
                        data: histPrices,
                        borderColor: C.blue,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.3,
                        fill: false,
                    },
                    {
                        label: `${days}-Day Forecast`,
                        data: futPrices,
                        borderColor: C.purple,
                        borderWidth: 2.5,
                        borderDash: [6, 3],
                        pointRadius: 0,
                        tension: 0.3,
                        fill: false,
                    },
                    {
                        label: '95% CI Upper',
                        data: upperBand,
                        borderColor: 'transparent',
                        backgroundColor: 'rgba(167,139,250,0.12)',
                        pointRadius: 0,
                        fill: '+1',
                        tension: 0.3,
                    },
                    {
                        label: '95% CI Lower',
                        data: lowerBand,
                        borderColor: 'transparent',
                        backgroundColor: 'rgba(167,139,250,0.12)',
                        pointRadius: 0,
                        fill: false,
                        tension: 0.3,
                    },
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        filter: item => item.datasetIndex <= 1,
                        callbacks: {
                            label: ctx => ctx.parsed.y !== null
                                ? ` ₹${ctx.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                : null
                        }
                    }
                },
                scales: {
                    x: { grid: { color: '#1f2d45' }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
                    y: { grid: { color: '#1f2d45' }, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } }
                }
            }
        });
    } catch (e) {
        console.error('Prophet forecast error:', e);
        document.getElementById('forecastLoader').textContent = 'Error loading forecast.';
        return;
    } finally {
        loader.classList.add('hidden');
    }
}

// ---- LSTM ----
async function loadLSTMForecast() {
    const loader = document.getElementById('forecastLoader');
    loader.classList.remove('hidden');

    try {
        const res = await fetch('/api/forecast/lstm');
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        destroyChart('forecast');
        const ctx = document.getElementById('forecastChart').getContext('2d');

        charts['forecast'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [
                    {
                        label: 'LSTM Predicted',
                        data: data.predicted,
                        borderColor: C.blue,
                        borderWidth: 2,
                        borderDash: [5, 3],
                        pointRadius: 0,
                        tension: 0.3,
                        fill: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        }
                    }
                },
                scales: {
                    x: { grid: { color: '#1f2d45' }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
                    y: { grid: { color: '#1f2d45' }, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } }
                }
            }
        });
    } catch (e) {
        console.error('LSTM forecast error:', e);
        document.getElementById('forecastLoader').textContent = 'Error loading LSTM forecast.';
        return;
    } finally {
        loader.classList.add('hidden');
    }
}

// ---- XGBoost ----
async function loadXGBForecast() {
    const loader = document.getElementById('forecastLoader');
    loader.classList.remove('hidden');

    try {
        const res = await fetch('/api/forecast/xgboost');
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        destroyChart('forecast');
        const ctx = document.getElementById('forecastChart').getContext('2d');

        charts['forecast'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [
                    {
                        label: 'Actual',
                        data: data.actual,
                        borderColor: C.green,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.3,
                        fill: false,
                    },
                    {
                        label: 'XGBoost Predicted',
                        data: data.predicted,
                        borderColor: C.orange,
                        borderWidth: 2,
                        borderDash: [5, 3],
                        pointRadius: 0,
                        tension: 0.3,
                        fill: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        }
                    }
                },
                scales: {
                    x: { grid: { color: '#1f2d45' }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
                    y: { grid: { color: '#1f2d45' }, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } }
                }
            }
        });
    } catch (e) {
        console.error('XGBoost forecast error:', e);
        document.getElementById('forecastLoader').textContent = 'Error loading XGBoost forecast.';
        return;
    } finally {
        loader.classList.add('hidden');
    }
}


// =========================================================
// 4. TAB SWITCHING (Prophet / LSTM / XGBoost)
// =========================================================
let activeTab = 'prophet';

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;

        // Show/hide prophet horizon controls
        document.getElementById('prophetControls').style.display =
            activeTab === 'prophet' ? 'flex' : 'none';

        if (activeTab === 'prophet') {
            const activeDays = document.querySelector('.horizon-btn.active')?.dataset.days || 30;
            loadProphetForecast(activeDays);
        } else if (activeTab === 'lstm') {
            loadLSTMForecast();
        } else if (activeTab === 'xgboost') {
            loadXGBForecast();
        }
    });
});


// =========================================================
// 5. HORIZON BUTTONS (Prophet only)
// =========================================================
document.querySelectorAll('.horizon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.horizon-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadProphetForecast(parseInt(btn.dataset.days));
    });
});


// =========================================================
// 6. INIT — load everything on page ready
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Default period button
    document.querySelector('[data-period="1Y"]')?.classList.add('active');
    document.querySelectorAll('.period-btn:not([data-period="1Y"])').forEach(b => b.classList.remove('active'));

    loadHistorical('1Y');
    loadMetricCharts();
    loadProphetForecast(30);
});