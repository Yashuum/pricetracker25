'use strict';

const $ = id => document.getElementById(id);

const state = {
  data: null,
  inBrowser: false,
  chart: null
};

function fmt(n) {
  return n.toLocaleString('en-IN');
}

function fmtDate(s) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtShortDate(s) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

async function loadData() {
  const res = await fetch('price-data.json?v=' + Date.now());
  if (!res.ok) throw new Error('Failed to fetch price data');
  return res.json();
}

function renderTracker(data) {
  const sym = data.currencySymbol;
  const cur = data.currentPrice;
  const low = data.lowestPrice;
  const hist = data.history;
  const prev = hist.length >= 2 ? hist[hist.length - 2].price : cur;

  $('currency-sym').textContent = sym;
  $('current-price').textContent = fmt(cur);
  $('last-updated').textContent = fmtDate(data.lastUpdated);
  $('low-price').textContent = sym + fmt(low);
  $('low-date').textContent = fmtDate(data.lowestPriceDate);

  const diff = cur - prev;
  const deltaEl = $('price-delta');
  if (diff > 0) {
    deltaEl.textContent = '▲ ' + sym + fmt(diff);
    deltaEl.className = 'price-delta up';
  } else if (diff < 0) {
    deltaEl.textContent = '▼ ' + sym + fmt(Math.abs(diff));
    deltaEl.className = 'price-delta down';
  } else {
    deltaEl.textContent = 'No change';
    deltaEl.className = 'price-delta flat';
  }

  const aboveLow = cur - low;
  $('vs-low').textContent = aboveLow === 0 ? 'At low!' : sym + fmt(aboveLow);
  const pct = ((aboveLow / low) * 100).toFixed(1);
  $('vs-low-pct').textContent = aboveLow === 0 ? 'Best price recorded' : '+' + pct + '% above lowest';

  const links = $('buy-links');
  links.innerHTML = '';
  (data.buyLinks || []).forEach(l => {
    const a = document.createElement('a');
    a.className = 'buy-link';
    a.href = l.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = l.label;
    links.appendChild(a);
  });

  renderChart(data);
}

function renderChart(data) {
  const hist = data.history;
  const labels = hist.map(h => fmtShortDate(h.date));
  const prices = hist.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min) * 0.15 || 1000;

  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }

  const ctx = $('price-chart').getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 140);
  gradient.addColorStop(0, 'rgba(62, 207, 142, 0.18)');
  gradient.addColorStop(1, 'rgba(62, 207, 142, 0)');

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: prices,
        borderColor: '#3ecf8e',
        borderWidth: 2,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#3ecf8e',
        pointHoverBorderColor: '#0a0a0a',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#181818',
          borderColor: '#2a2a2a',
          borderWidth: 1,
          titleColor: '#888',
          bodyColor: '#f0f0f0',
          titleFont: { size: 11, family: '-apple-system' },
          bodyFont: { size: 14, weight: '700', family: '-apple-system' },
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: items => items[0].label,
            label: item => '₹' + fmt(item.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#444',
            font: { size: 10 },
            maxTicksLimit: 6,
            maxRotation: 0
          }
        },
        y: {
          min: min - pad,
          max: max + pad,
          grid: { color: '#1a1a1a', drawBorder: false },
          border: { display: false },
          ticks: {
            color: '#444',
            font: { size: 10 },
            maxTicksLimit: 4,
            callback: v => '₹' + (v >= 100000 ? (v / 1000).toFixed(0) + 'K' : fmt(v))
          }
        }
      }
    }
  });
}

function showTracker() {
  $('tracker-view').style.display = 'flex';
  $('browser-view').style.display = 'none';
  state.inBrowser = false;
  resetBrowser();
}

function showBrowser() {
  $('tracker-view').style.display = 'none';
  $('browser-view').style.display = 'flex';
  state.inBrowser = true;
  setTimeout(() => $('browser-input').focus(), 100);
}

function resetBrowser() {
  const frame = $('browser-frame');
  frame.src = 'about:blank';
  $('browser-input').value = '';
  $('browser-placeholder').classList.remove('hidden');
}

function navigate(query) {
  if (!query.trim()) return;
  $('browser-placeholder').classList.add('hidden');

  let url;
  try {
    const u = new URL(query.startsWith('http') ? query : 'https://' + query);
    url = u.href;
  } catch {
    url = 'https://www.google.com/search?q=' + encodeURIComponent(query) + '&safe=active';
  }

  const frame = $('browser-frame');
  frame.src = url;
  $('browser-input').value = query;
  $('browser-input').blur();
}

function bindEvents() {
  $('search-btn').addEventListener('click', showBrowser);

  $('back-to-tracker').addEventListener('click', showTracker);

  $('browser-go').addEventListener('click', () => navigate($('browser-input').value));

  $('browser-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') navigate($('browser-input').value);
  });

  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => navigate(chip.dataset.q));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.inBrowser) {
      resetBrowser();
    }
  });

  window.addEventListener('pageshow', () => {
    if (state.inBrowser) showTracker();
  });
}

async function init() {
  try {
    state.data = await loadData();
    renderTracker(state.data);
  } catch (err) {
    console.error('PrivEx: failed to load price data', err);
    $('current-price').textContent = 'Error';
    $('last-updated').textContent = 'Could not load data';
  }

  bindEvents();

  const overlay = $('loading-overlay');
  overlay.classList.add('gone');
  setTimeout(() => overlay.remove(), 350);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', init);
