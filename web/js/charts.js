// ============================================================
// charts.js - Chart.js 차트 초기화
// ============================================================

// Chart.js 전역 기본값 (다크 테마)
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.07)';
Chart.defaults.font.family = "'Noto Sans KR', sans-serif";

const GOLD     = '#d4af37';
const RED      = '#e74c3c';
const POSITIVE = '#10b981';
const NEUTRAL  = 'rgba(255,255,255,0.15)';

const instances = {};

function getOrCreate(id, config) {
  if (instances[id]) {
    instances[id].destroy();
  }
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  instances[id] = new Chart(canvas, config);
  return instances[id];
}

export const initCharts = {

  // 요일별 막대 차트
  weekday(id, data) {
    const labels = ['월', '화', '수', '목', '금', '토', '일'];
    const values = labels.map(d => data[d] || 0);
    const maxIdx = values.indexOf(Math.max(...values));

    getOrCreate(id, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: values.map((_, i) =>
            i === maxIdx ? GOLD : 'rgba(255,255,255,0.12)'
          ),
          borderColor: values.map((_, i) =>
            i === maxIdx ? GOLD : 'rgba(255,255,255,0.2)'
          ),
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { font: { size: 10 } },
          },
        },
        animation: { duration: 800, easing: 'easeOutCubic' },
      },
    });
  },

  // 월별 라인/에리어 차트
  monthly(id, data) {
    const labels = Object.keys(data);
    const values = Object.values(data);

    getOrCreate(id, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: GOLD,
          backgroundColor: 'rgba(212,175,55,0.12)',
          borderWidth: 2.5,
          pointBackgroundColor: GOLD,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              callback: (_, i) => labels[i]?.slice(5) + '월',
              font: { size: 10 },
            },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { font: { size: 10 } },
          },
        },
        animation: { duration: 1000, easing: 'easeOutCubic' },
      },
    });
  },

  // 밤샘 도넛 차트
  overnight(id, overnight, rest) {
    getOrCreate(id, {
      type: 'doughnut',
      data: {
        labels: ['밤샘 (0~5시)', '일반'],
        datasets: [{
          data: [overnight, rest],
          backgroundColor: ['rgba(99,102,241,0.85)', 'rgba(255,255,255,0.08)'],
          borderColor:     ['rgba(99,102,241,1)',    'rgba(255,255,255,0.1)'],
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw}판`,
            },
          },
        },
        animation: { animateRotate: true, duration: 1000 },
      },
    });
  },
};

export function destroyChart(id) {
  if (instances[id]) {
    instances[id].destroy();
    delete instances[id];
  }
}
