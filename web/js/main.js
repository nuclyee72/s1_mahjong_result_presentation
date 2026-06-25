// ============================================================
// main.js - 슬라이드 엔진, 파티클, 데이터 로드, 슬라이드 렌더링
// ============================================================

import { initCharts, destroyChart } from './charts.js';
import { openPlayerModal }          from './player.js';

// ============================================================
// 데이터 로드
// ============================================================
let DATA = null;

async function loadData() {
  const res  = await fetch('data/stats.json');
  DATA = await res.json();
}

// ============================================================
// 파티클 시스템
// ============================================================
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: 55 }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    size:    Math.random() * 2.5 + 0.5,
    vx:      (Math.random() - 0.5) * 0.25,
    vy:      (Math.random() - 0.5) * 0.25,
    alpha:   Math.random() * 0.25 + 0.04,
    type:    Math.random() > 0.6 ? 'diamond' : 'circle',
    color:   Math.random() > 0.65
               ? 'rgba(201,160,0,'
               : Math.random() > 0.5
                 ? 'rgba(192,57,43,'
                 : 'rgba(255,255,255,',
  }));

  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color + p.alpha + ')';

      if (p.type === 'diamond') {
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    requestAnimationFrame(tick);
  })();
}

// ============================================================
// 유틸리티
// ============================================================
function fmt(n, sign = false) {
  const s = Math.abs(n).toLocaleString('ko-KR');
  if (sign) return (n >= 0 ? '+' : '-') + s;
  return s;
}

function scoreColor(n) {
  return n > 0 ? 'var(--positive)' : n < 0 ? 'var(--negative)' : 'var(--neutral)';
}

function countUp(el, target, duration = 1200, suffix = '') {
  const start = performance.now();
  const isFloat = !Number.isInteger(target);
  (function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const cur  = isFloat
      ? (target * ease).toFixed(2)
      : Math.round(target * ease);
    el.textContent = cur + suffix;
    if (t < 1) requestAnimationFrame(step);
    else el.classList.add('count-done');
  })(performance.now());
}

// ============================================================
// 슬라이드 렌더링 함수들
// ============================================================

// ──── Slide 0: 타이틀 ────
function renderTitle() {
  const o  = DATA.season1.overall;
  const po = DATA.preseason.overall;

  document.getElementById('title-period').textContent =
    `${o.date_start} ~ ${o.date_end}`;

  document.getElementById('ts-games').textContent    = o.total_games + '판';
  document.getElementById('ts-players').textContent  = o.total_players + '명';
  document.getElementById('ts-overnight').textContent = o.overnight_rate + '%';

  // 상위 플레이어 칩
  const container = document.getElementById('title-players');
  container.innerHTML = '';
  DATA.season1.rankings.slice(0, 15).forEach(r => {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.textContent = r.player;
    chip.addEventListener('click', () => openPlayerModal(r.player, DATA));
    container.appendChild(chip);
  });
}

// ──── Slide 1: 개요 & 프리시즌 비교 ────
function renderOverview() {
  const s1 = DATA.season1.overall;
  const pre = DATA.preseason.overall;
  const s1r = DATA.season1.rankings;
  const prer = DATA.preseason.rankings;

  const compareItems = [
    { label: '총 게임 수',  s1: s1.total_games + '판',  pre: pre.total_games + '판',  up: s1.total_games > pre.total_games },
    { label: '참가 인원',   s1: s1.total_players + '명', pre: pre.total_players + '명', up: s1.total_players > pre.total_players },
    { label: '밤샘 비율',   s1: s1.overnight_rate + '%', pre: pre.overnight_rate + '%', up: s1.overnight_rate > pre.overnight_rate },
    {
      label: '최다 판수 1위',
      s1:  s1r.slice(0).sort((a,b) => b.games - a.games)[0]?.player + ` (${s1r.slice(0).sort((a,b)=>b.games-a.games)[0]?.games}판)`,
      pre: prer.slice(0).sort((a,b) => b.games - a.games)[0]?.player + ` (${prer.slice(0).sort((a,b)=>b.games-a.games)[0]?.games}판)`,
      up: true,
    },
  ];

  const makeRows = (items, isCurrent) => items.map(item => `
    <div class="compare-row">
      <div class="compare-row-label">${item.label}</div>
      <div class="compare-row-value">${isCurrent ? item.s1 : item.pre}</div>
    </div>
  `).join('');

  document.getElementById('pre-rows').innerHTML = makeRows(compareItems, false);
  document.getElementById('s1-rows').innerHTML  = makeRows(compareItems, true);

  // 하이라이트 카드
  const topPlayer = s1r[0];
  const mostGames = s1r.slice(0).sort((a,b)=>b.games-a.games)[0];
  const bestAvgRank = s1r.filter(r=>r.games>=20).sort((a,b)=>a.avg_rank-b.avg_rank)[0];
  const bestTopRate = s1r.filter(r=>r.games>=20).sort((a,b)=>b.top2_rate-a.top2_rate)[0];

  const highlights = [
    { icon: '🏆', value: topPlayer?.player,      label: '시즌 1위' },
    { icon: '🎮', value: mostGames?.games + '판', label: '최다 게임 ('+mostGames?.player+')' },
    { icon: '🎯', value: (bestAvgRank?.avg_rank||0).toFixed(2)+'위', label: '최고 평균순위 ('+bestAvgRank?.player+')' },
    { icon: '⭐', value: Math.round((bestTopRate?.top2_rate||0)*100)+'%',  label: '최고 연대율 ('+bestTopRate?.player+')' },
  ];

  document.getElementById('overview-highlights').innerHTML = highlights.map(h => `
    <div class="highlight-card">
      <div class="highlight-icon">${h.icon}</div>
      <div class="highlight-value">${h.value}</div>
      <div class="highlight-label">${h.label}</div>
    </div>
  `).join('');
}

// ──── Slide 2: 게임 패턴 ────
let patternChartsInited = false;

function renderPattern() {
  if (patternChartsInited) return;
  patternChartsInited = true;

  const o = DATA.season1.overall;

  // 요일별 차트
  initCharts.weekday('chart-weekday', o.by_weekday);
  // 월별 차트
  initCharts.monthly('chart-monthly', o.by_month);
  // 밤샘 도넛
  initCharts.overnight('chart-overnight', o.overnight_games, o.total_games - o.overnight_games);
  document.getElementById('overnight-pct').textContent = o.overnight_rate + '%';

  // 밤샘 상세
  const nightHours   = [0,1,2,3,4,5].reduce((s,h)=>s+(o.by_hour[String(h).padStart(2,'0')]||0), 0);
  const morningHours = [6,7,8,9,10,11].reduce((s,h)=>s+(o.by_hour[String(h).padStart(2,'0')]||0), 0);
  document.getElementById('overnight-detail').innerHTML = `
    <div class="overnight-stat"><span class="overnight-stat-label">밤샘 게임 수</span><span class="overnight-stat-value">${o.overnight_games}판</span></div>
    <div class="overnight-stat"><span class="overnight-stat-label">새벽~오전 (6~11시)</span><span class="overnight-stat-value">${morningHours}판</span></div>
    <div class="overnight-stat"><span class="overnight-stat-label">낮/오후/저녁</span><span class="overnight-stat-value">${o.total_games - nightHours - morningHours}판</span></div>
  `;

  // 시험기간 바
  const examEl = document.getElementById('exam-bars');
  const maxDaily = Math.max(...o.exam_periods.map(e => Math.max(e.daily_avg, e.non_exam_daily_avg)));

  examEl.innerHTML = o.exam_periods.map(ep => `
    <div class="exam-bar-row">
      <div class="exam-bar-header">
        <span class="exam-bar-name">${ep.name} (${ep.start} ~ ${ep.end})</span>
        <span class="exam-bar-values">시험기간 ${ep.daily_avg}판/일 vs 평상시 ${ep.non_exam_daily_avg}판/일</span>
      </div>
      <div class="exam-bar-tracks">
        <div style="display:flex;align-items:center;gap:8px;font-size:0.7rem;color:var(--negative);">
          <span>시험기간</span>
          <div class="exam-bar-track" style="flex:1">
            <div class="exam-bar-fill exam-period"
                 style="width:${maxDaily>0?ep.daily_avg/maxDaily*100:0}%"></div>
          </div>
          <span>${ep.games}판</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:0.7rem;color:var(--positive);">
          <span>평상시 &nbsp;</span>
          <div class="exam-bar-track" style="flex:1">
            <div class="exam-bar-fill non-exam"
                 style="width:${maxDaily>0?ep.non_exam_daily_avg/maxDaily*100:0}%"></div>
          </div>
          <span>-판</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ──── Slide 3: 최종 순위 ────
function renderRankings() {
  const rankings = DATA.season1.rankings;

  // 포디움 (1~3위)
  const podium = document.getElementById('podium');
  const top3   = [rankings[1], rankings[0], rankings[2]]; // 2nd, 1st, 3rd
  const podiumClasses = ['second', 'first', 'third'];
  const podiumLabels  = ['🥈 2위', '🥇 1위', '🥉 3위'];

  podium.innerHTML = top3.map((r, i) => {
    if (!r) return '';
    const cls   = podiumClasses[i];
    const crown = cls === 'first' ? '<div class="podium-crown">👑</div>' : '';
    const col   = scoreColor(r.total_score);
    return `
      <div class="podium-slot ${cls}" data-player="${r.player}">
        <div class="podium-card" onclick="window.__openPlayer('${r.player}')">
          ${crown}
          <div class="podium-rank-badge">${podiumLabels[i]}</div>
          <div class="podium-name">${r.player}</div>
          <div class="podium-score" style="color:${col}">${fmt(r.total_score, true)}</div>
          <div class="podium-mini">${r.games}판 · 평균${r.avg_rank.toFixed(2)}위</div>
        </div>
        <div class="podium-block">${cls.toUpperCase()}</div>
      </div>
    `;
  }).join('');

  // 4위
  const r4 = rankings[3];
  if (r4) {
    document.getElementById('fourth-slot').innerHTML = `
      <div class="fourth-card" onclick="window.__openPlayer('${r4.player}')">
        <span class="fourth-rank">4위</span>
        <span class="fourth-name">${r4.player}</span>
        <span class="fourth-score" style="color:${scoreColor(r4.total_score)}">${fmt(r4.total_score, true)}</span>
        <span class="fourth-rank" style="margin-left:auto">${r4.games}판</span>
      </div>
    `;
  }

  // 전체 리스트 (5위부터)
  const rankColors = { 0: 'gold', 1: 'silver', 2: 'bronze' };
  document.getElementById('rank-list').innerHTML = rankings.map((r, i) => `
    <div class="rank-list-item ${i < 3 ? 'top3' : ''}"
         onclick="window.__openPlayer('${r.player}')">
      <span class="rli-rank ${rankColors[i] || ''}">${r.rank}위</span>
      <span class="rli-name">${r.player}</span>
      <span class="rli-score" style="color:${scoreColor(r.total_score)}">${fmt(r.total_score, true)}</span>
      <span class="rli-games">${r.games}판</span>
      <span class="rli-avgrank">평균 ${r.avg_rank.toFixed(2)}위</span>
    </div>
  `).join('');
}

// ──── Slide 4: 거미줄 그래프 ────
let networkInited = false;

function renderNetwork() {
  if (networkInited) return;
  networkInited = true;

  const canvas   = document.getElementById('co-play-canvas');
  const wrap     = document.getElementById('co-play-canvas-wrap');
  canvas.width   = wrap.clientWidth;
  canvas.height  = wrap.clientHeight;

  const matrix   = DATA.co_play_matrix;
  const players  = DATA.co_play_players.slice(0, 20); // 상위 20명만
  const ctx      = canvas.getContext('2d');
  let highlighted = null;
  let animProg    = 0;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const R  = Math.min(cx, cy) * 0.72;
  const nr = 22; // 노드 반경

  // 플레이어 위치 계산
  const positions = players.map((_, i) => {
    const angle = (2 * Math.PI * i / players.length) - Math.PI / 2;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });

  // 최대값
  let maxVal = 1;
  players.forEach(p => players.forEach(q => {
    if (p !== q && matrix[p]?.[q]) maxVal = Math.max(maxVal, matrix[p][q]);
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 엣지 그리기
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const cnt = (matrix[players[i]]?.[players[j]]) || 0;
        if (cnt === 0) continue;

        const hl  = highlighted === players[i] || highlighted === players[j];
        const dim = highlighted && !hl;

        const alpha = dim ? 0.04 : (hl ? 0.85 : 0.18);
        const lw    = (cnt / maxVal) * 6 + 0.5;

        ctx.save();
        ctx.globalAlpha = alpha * animProg;
        ctx.strokeStyle = hl ? '#d4af37' : '#ffffff';
        ctx.lineWidth   = hl ? lw * 1.8 : lw;
        ctx.beginPath();
        ctx.moveTo(positions[i].x, positions[i].y);
        ctx.lineTo(positions[j].x, positions[j].y);
        ctx.stroke();

        // 강조 상태면 판수 라벨 표시
        if (hl) {
          const mx = (positions[i].x + positions[j].x) / 2;
          const my = (positions[i].y + positions[j].y) / 2;
          ctx.fillStyle   = '#f0d060';
          ctx.font        = 'bold 11px Noto Sans KR';
          ctx.textAlign   = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = animProg;
          ctx.fillText(`${cnt}판`, mx, my);
        }
        ctx.restore();
      }
    }

    // 노드 그리기
    players.forEach((p, i) => {
      const pos = positions[i];
      const hl  = highlighted === p;
      const dim = highlighted && !hl;

      ctx.save();
      ctx.globalAlpha = dim ? 0.25 : 1;

      // 원
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nr, 0, Math.PI * 2);

      if (hl) {
        ctx.fillStyle   = '#d4af37';
        ctx.shadowColor = '#d4af37';
        ctx.shadowBlur  = 18;
      } else {
        ctx.fillStyle = 'rgba(22,22,50,0.92)';
      }
      ctx.fill();

      ctx.strokeStyle = hl ? '#f0d060' : 'rgba(201,160,0,0.35)';
      ctx.lineWidth   = hl ? 2.5 : 1.5;
      ctx.shadowBlur  = 0;
      ctx.stroke();

      // 이름
      ctx.fillStyle = hl ? '#0a0a1a' : '#e2e8f0';
      ctx.font      = `${hl ? 'bold ' : ''}${Math.min(12, 24 / Math.max(1, p.length * 0.7))}px Noto Sans KR`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p, pos.x, pos.y);

      ctx.restore();
    });
  }

  // 애니메이션 진입
  const animate = () => {
    animProg = Math.min(1, animProg + 0.025);
    draw();
    if (animProg < 1) requestAnimationFrame(animate);
  };
  animate();

  // 히트 테스트
  const hitTest = (mx, my) => {
    for (let i = 0; i < players.length; i++) {
      const dx = mx - positions[i].x, dy = my - positions[i].y;
      if (dx * dx + dy * dy < nr * nr) return players[i];
    }
    return null;
  };

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const p    = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    highlighted = (highlighted === p) ? null : p;
    draw();
    updateSidebar(highlighted);
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    canvas.style.cursor = hitTest(e.clientX - rect.left, e.clientY - rect.top) ? 'pointer' : 'default';
  });

  // 창 크기 변경
  window.addEventListener('resize', () => {
    canvas.width  = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    draw();
  });

  function updateSidebar(player) {
    const nameEl    = document.getElementById('network-selected-name');
    const listEl    = document.getElementById('network-partner-list');

    if (!player) {
      nameEl.textContent = '—';
      listEl.innerHTML   = '<div class="network-placeholder">그래프에서 플레이어를 클릭하세요</div>';
      return;
    }

    nameEl.textContent = player;
    const partners = players
      .filter(p => p !== player && matrix[player]?.[p])
      .sort((a, b) => (matrix[player][b] || 0) - (matrix[player][a] || 0))
      .slice(0, 10);

    listEl.innerHTML = partners.map((p, i) => `
      <div class="partner-row">
        <span class="partner-rank">${i+1}</span>
        <span class="partner-name">${p}</span>
        <span class="partner-games">${matrix[player][p]}판</span>
      </div>
    `).join('') || '<div class="network-placeholder">데이터 없음</div>';
  }
}

// ──── Slide 5: 특수 기록 ────
function renderRecords() {
  const rankings = DATA.season1.rankings;
  const players  = DATA.season1.players;

  // 계산
  const sorted = Object.entries(players).sort((a,b)=>b[1].total_score-a[1].total_score);

  const mostGames = Object.entries(players).sort((a,b)=>b[1].games-a[1].games)[0];
  const bestTop   = sorted[0];
  const topRate   = Object.entries(players).filter(([,d])=>d.games>=20).sort((a,b)=>b[1].first_rate-a[1].first_rate)[0];
  const bestAvg   = Object.entries(players).filter(([,d])=>d.games>=20).sort((a,b)=>a[1].avg_rank-b[1].avg_rank)[0];
  const streakDay = Object.entries(players).sort((a,b)=>b[1].max_streak_days-a[1].max_streak_days)[0];
  const consec1   = Object.entries(players).sort((a,b)=>b[1].max_consec_1st-a[1].max_consec_1st)[0];
  const consec4   = Object.entries(players).sort((a,b)=>b[1].max_consec_4th-a[1].max_consec_4th)[0];
  const bestScore = Object.entries(players).sort((a,b)=>b[1].best_score-a[1].best_score)[0];
  const tobiKing  = Object.entries(players).filter(([,d])=>d.games>=20).sort((a,b)=>b[1].tobi_rate-a[1].tobi_rate)[0];
  const tobiZero  = Object.entries(players).filter(([,d])=>d.games>=20).sort((a,b)=>a[1].tobi_rate-b[1].tobi_rate)[0];
  const bigDay    = Object.entries(players).sort((a,b)=>b[1].most_active_day.games-a[1].most_active_day.games)[0];

  const records = [
    { icon:'🎮', label:'최다 판수', value: mostGames?.[1].games+'판',   player: mostGames?.[0], detail: '시즌 전체 기간' },
    { icon:'👑', label:'최고 총점', value: fmt(bestTop?.[1].total_score,true), player: bestTop?.[0], detail: bestTop?.[1].games+'판 참가' },
    { icon:'🏹', label:'최고 1위율', value: Math.round((topRate?.[1].first_rate||0)*100)+'%', player: topRate?.[0], detail: topRate?.[1].rank_counts?.['1st']+'번 1위 / '+topRate?.[1].games+'판' },
    { icon:'📐', label:'최고 평균순위', value: bestAvg?.[1].avg_rank.toFixed(2)+'위', player: bestAvg?.[0], detail: bestAvg?.[1].games+'판 기준 (20판↑)' },
    { icon:'📅', label:'최장 연속 참가일', value: streakDay?.[1].max_streak_days+'일', player: streakDay?.[0], detail: '연속 참가 최장 기록' },
    { icon:'🔥', label:'최장 연속 1위', value: consec1?.[1].max_consec_1st+'연속', player: consec1?.[0], detail: '연속 TOP 최장 기록' },
    { icon:'💀', label:'최장 연속 꼴찌', value: consec4?.[1].max_consec_4th+'연속', player: consec4?.[0], detail: '연속 라스 최장 기록' },
    { icon:'⚡', label:'단판 최고 점수', value: fmt(bestScore?.[1].best_score), player: bestScore?.[0], detail: bestScore?.[1].best_game_date },
    { icon:'💸', label:'최고 토비율', value: Math.round((tobiKing?.[1].tobi_rate||0)*100)+'%', player: tobiKing?.[0], detail: tobiKing?.[1].tobi_count+'번 토비 / '+tobiKing?.[1].games+'판' },
    { icon:'🛡️', label:'최저 토비율', value: Math.round((tobiZero?.[1].tobi_rate||0)*100)+'%', player: tobiZero?.[0], detail: tobiZero?.[1].tobi_count+'번 토비 / '+tobiZero?.[1].games+'판' },
    { icon:'📆', label:'하루 최다 판수', value: bigDay?.[1].most_active_day.games+'판', player: bigDay?.[0], detail: bigDay?.[1].most_active_day.date },
  ];

  document.getElementById('records-grid').innerHTML = records.map(r => `
    <div class="record-card" onclick="window.__openPlayer('${r.player}')">
      <div class="record-icon">${r.icon}</div>
      <div class="record-label">${r.label}</div>
      <div class="record-value">${r.value}</div>
      <div class="record-player">${r.player || '-'}</div>
      <div class="record-detail">${r.detail || ''}</div>
    </div>
  `).join('');
}

// ──── Slide 6: 시상 ────
let awardsRevealed = false;

function renderAwards() {
  awardsRevealed = false;

  const season1Awards = DATA.badges.season1_awards;
  const rankings      = DATA.season1.rankings;
  const players       = DATA.season1.players;

  // 시즌 1 배지 + 특별 어워드 조합
  const gradeOrder = { '플래티넘': 0, '골드': 1, '실버': 2, '브론즈': 3 };
  const gradeMap   = { '플래티넘': 'platinum', '골드': 'gold', '실버': 'silver', '브론즈': 'bronze' };
  const gradeEmoji = { '플래티넘': '💎', '골드': '🏆', '실버': '🥈', '브론즈': '🎖️' };

  // 특별 어워드 추가 (계산된 스탯 기반)
  const top = rankings[0];
  const sorted = Object.entries(players).filter(([,d])=>d.games>=20);
  const bestAvg   = sorted.sort((a,b)=>a[1].avg_rank-b[1].avg_rank)[0];
  const topRate   = [...sorted].sort((a,b)=>b[1].top2_rate-a[1].top2_rate)[0];
  const laAvoid   = [...sorted].sort((a,b)=>b[1].last_avoid_rate-a[1].last_avoid_rate)[0];
  const consec1   = Object.entries(players).sort((a,b)=>b[1].max_consec_1st-a[1].max_consec_1st)[0];
  const mostNight = Object.entries(players).filter(([,d])=>d.games>=10).sort((a,b)=>b[1].overnight_rate-a[1].overnight_rate)[0];

  const specialAwards = [
    {
      grade: '플래티넘', name: '시즌 MVP',
      player: top?.player,
      desc: `총점 ${fmt(top?.total_score,true)} · ${top?.games}판 참가 · 시즌 1위`,
    },
    {
      grade: '골드', name: '평균순위 최강',
      player: bestAvg?.[0],
      desc: `평균 순위 ${bestAvg?.[1].avg_rank.toFixed(2)}위 (20판↑ 기준)`,
    },
    {
      grade: '골드', name: '연대의 귀재',
      player: topRate?.[0],
      desc: `연대율 ${Math.round((topRate?.[1].top2_rate||0)*100)}% (1위+2위 비율)`,
    },
    {
      grade: '골드', name: '라스회피 마스터',
      player: laAvoid?.[0],
      desc: `라스회피율 ${Math.round((laAvoid?.[1].last_avoid_rate||0)*100)}%`,
    },
    {
      grade: '실버', name: '연속 TOP 챔피언',
      player: consec1?.[0],
      desc: `${consec1?.[1].max_consec_1st}연속 1위 달성`,
    },
    {
      grade: '실버', name: '밤샘왕',
      player: mostNight?.[0],
      desc: `밤샘 비율 ${Math.round((mostNight?.[1].overnight_rate||0)*100)}%`,
    },
  ];

  // DB 배지도 추가
  const sorted_s1 = season1Awards.sort((a,b)=>gradeOrder[a.grade]-gradeOrder[b.grade]);

  const allAwards = [
    ...specialAwards,
    ...sorted_s1.map(b => ({
      grade: b.grade,
      name: b.name,
      player: b.player,
      desc: b.granted_at?.split('T')[0] + ' 수여',
    })),
  ];

  document.getElementById('awards-grid').innerHTML = allAwards.map((a, i) => {
    const cls   = gradeMap[a.grade] || 'bronze';
    const emoji = gradeEmoji[a.grade] || '🎖️';
    return `
      <div class="award-card ${cls}-card" data-delay="${i * 180}">
        <div class="award-grade-pill badge-${cls}">${a.grade}</div>
        <div class="award-icon">${emoji}</div>
        <div class="award-name">${a.name}</div>
        <div class="award-winner ${cls}">${a.player || '-'}</div>
        <div class="award-detail">${a.desc || ''}</div>
      </div>
    `;
  }).join('');

  // 순차 reveal
  revealAwardCards();

  document.getElementById('reveal-all-btn').onclick = () => {
    document.querySelectorAll('.award-card:not(.revealed)').forEach(c => c.classList.add('revealed'));
    awardsRevealed = true;
  };
}

function revealAwardCards() {
  document.querySelectorAll('.award-card').forEach(card => {
    const delay = parseInt(card.dataset.delay || '0');
    setTimeout(() => card.classList.add('revealed'), delay);
  });
}

// ============================================================
// 슬라이드 진입/이탈 핸들러
// ============================================================
const slideHandlers = {
  0: renderTitle,
  1: renderOverview,
  2: renderPattern,
  3: renderRankings,
  4: renderNetwork,
  5: renderRecords,
  6: () => { renderAwards(); },
};

// ============================================================
// 슬라이드 엔진
// ============================================================
const TOTAL_SLIDES = 7;
let currentIndex = 0;
let isAnimating  = false;

function goTo(index, direction = 'forward') {
  if (isAnimating || index === currentIndex || index < 0 || index >= TOTAL_SLIDES) return;
  isAnimating = true;

  const slides   = document.querySelectorAll('.slide');
  const curSlide = slides[currentIndex];
  const nxtSlide = slides[index];

  // 다음 슬라이드 초기 위치 설정
  nxtSlide.style.transform = direction === 'forward' ? 'translateX(100%)' : 'translateX(-100%)';
  nxtSlide.style.opacity   = '0';
  nxtSlide.style.zIndex    = '2';

  requestAnimationFrame(() => requestAnimationFrame(() => {
    curSlide.style.transform = direction === 'forward' ? 'translateX(-100%)' : 'translateX(100%)';
    curSlide.style.opacity   = '0';

    nxtSlide.style.transform = 'translateX(0)';
    nxtSlide.style.opacity   = '1';
    nxtSlide.classList.add('active');

    setTimeout(() => {
      curSlide.classList.remove('active');
      curSlide.style.transform = '';
      curSlide.style.opacity   = '';
      curSlide.style.zIndex    = '';
      nxtSlide.style.zIndex    = '';

      currentIndex = index;
      isAnimating  = false;

      updateUI();
      slideHandlers[index]?.();
    }, 680);
  }));
}

function next() { goTo(currentIndex + 1, 'forward'); }
function prev() { goTo(currentIndex - 1, 'backward'); }

function updateUI() {
  // 진행 바
  document.getElementById('progress-fill').style.width =
    `${((currentIndex + 1) / TOTAL_SLIDES) * 100}%`;

  // 카운터
  document.getElementById('cur-num').textContent = currentIndex + 1;
  document.getElementById('tot-num').textContent = TOTAL_SLIDES;

  // 도트
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentIndex));

  // 버튼
  document.getElementById('prev-btn').disabled = currentIndex === 0;
  document.getElementById('next-btn').disabled = currentIndex === TOTAL_SLIDES - 1;
}

function setupNavigation() {
  // 총 슬라이드 수만큼 도트 생성
  const dotNav = document.getElementById('dot-nav');
  for (let i = 0; i < TOTAL_SLIDES; i++) {
    const dot = document.createElement('button');
    dot.className    = 'dot' + (i === 0 ? ' active' : '');
    dot.dataset.slide = i;
    dot.setAttribute('aria-label', `슬라이드 ${i + 1}`);
    dot.addEventListener('click', () => goTo(i, i > currentIndex ? 'forward' : 'backward'));
    dotNav.appendChild(dot);
  }

  document.getElementById('prev-btn').addEventListener('click', prev);
  document.getElementById('next-btn').addEventListener('click', next);

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (document.getElementById('player-modal').classList.contains('open')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  next();
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')    prev();
    if (e.key === 'Escape') closePlayerModal();
  });

  // 터치 스와이프
  let tx = 0, ty = 0;
  document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });
}

// ============================================================
// 플레이어 모달 (player.js와 연동)
// ============================================================
function closePlayerModal() {
  const modal = document.getElementById('player-modal');
  modal.classList.remove('open');
}

// 전역 바인딩
window.__openPlayer = (name) => openPlayerModal(name, DATA);

document.getElementById('modal-backdrop').addEventListener('click', closePlayerModal);
document.getElementById('modal-close').addEventListener('click', closePlayerModal);

// ============================================================
// 진입점
// ============================================================
async function main() {
  initParticles();
  setupNavigation();

  try {
    await loadData();
    updateUI();
    slideHandlers[0]?.();   // 타이틀 렌더링
  } catch (err) {
    console.error('데이터 로드 실패:', err);
    document.querySelector('.title-main').innerHTML =
      '데이터 로드 실패<br><span style="font-size:1rem;color:var(--negative)">stats.json을 확인하세요</span>';
  }
}

main();
