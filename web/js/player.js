// ============================================================
// player.js - 개인 통계 모달 렌더링
// ============================================================

function fmt(n, sign = false) {
  const s = Math.abs(n).toLocaleString('ko-KR');
  if (sign) return (n >= 0 ? '+' : '-') + s;
  return s;
}

function pct(v) { return Math.round((v || 0) * 100) + '%'; }

function scoreColor(n) {
  return n > 0 ? 'var(--positive)' : n < 0 ? 'var(--negative)' : 'var(--neutral)';
}

function gradeClass(g) {
  const map = { '플래티넘': 'platinum', '골드': 'gold', '실버': 'silver', '브론즈': 'bronze' };
  return map[g] || 'bronze';
}

// 순위 분포 바
function rankBar(label, count, total, colorClass) {
  const w = total > 0 ? Math.round(count / total * 100) : 0;
  return `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-size:0.72rem;color:var(--text-muted);min-width:22px">${label}</span>
      <div style="flex:1;height:8px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden">
        <div class="modal-bar-fill" style="height:100%;border-radius:99px;width:${w}%;background:${colorClass};--bar-delay:${label === '1위' ? 0.1 : label === '2위' ? 0.2 : label === '3위' ? 0.3 : 0.4}s"></div>
      </div>
      <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-secondary);min-width:28px;text-align:right">${count}회</span>
    </div>
  `;
}

export function openPlayerModal(playerName, DATA) {
  const d = DATA?.season1?.players?.[playerName];
  if (!d) {
    // 데이터 없는 플레이어
    const modal   = document.getElementById('player-modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <div style="color:var(--text-muted);text-align:center;padding:4rem 0">
        <div style="font-size:2rem;margin-bottom:1rem">🀄</div>
        <div><strong style="color:var(--text-primary)">${playerName}</strong></div>
        <div style="margin-top:0.5rem;font-size:0.85rem">통계 데이터 없음 (${DATA?.config?.min_games}판 미만)</div>
      </div>
    `;
    modal.classList.add('open');
    return;
  }

  // 시즌 1 랭킹 찾기
  const rank = DATA.season1.rankings.find(r => r.player === playerName);
  const pre  = d.preseason_stats;

  // 배지
  const allBadges = [
    ...(d.badges?.season1  || []),
    ...(d.badges?.preseason|| []),
    ...(d.badges?.special  || []),
  ];

  // VS 통계: 이기기 쉬운/어려운 상대
  const vsArr = Object.entries(d.vs_stats || {}).filter(([,v]) => v.games >= 3);
  const bestVs  = vsArr.sort((a,b) => a[1].my_avg_rank - b[1].my_avg_rank)[0];
  const worstVs = vsArr.sort((a,b) => b[1].my_avg_rank - a[1].my_avg_rank)[0];

  // 점수 diff: 프리시즌 비교
  const scoreDiff = pre ? d.total_score - (pre.total_score || 0) : null;
  const avgRankDiff = pre ? (d.avg_rank - pre.avg_rank).toFixed(2) : null;

  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <!-- 헤더 -->
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border-subtle)">
      <div>
        <div style="font-family:var(--font-mono);font-size:0.65rem;letter-spacing:0.2em;color:var(--gold-mid);margin-bottom:0.3rem">
          ${rank ? rank.rank + '위 · 시즌 1' : '시즌 1'}
        </div>
        <div style="font-family:var(--font-display);font-size:2rem;line-height:1">${playerName}</div>
        <div style="font-family:var(--font-mono);font-size:1.4rem;font-weight:700;margin-top:0.3rem;color:${scoreColor(d.total_score)}">
          ${fmt(d.total_score, true)}
        </div>
      </div>
    </div>

    <!-- 핵심 스탯 그리드 -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-bottom:1.5rem">
      ${[
        { label: '총 판수',    value: d.games + '판' },
        { label: '평균 점수',  value: fmt(Math.round(d.avg_score), true) },
        { label: '평균 순위',  value: d.avg_rank.toFixed(2) + '위' },
        { label: '연대율',     value: pct(d.top2_rate) },
        { label: '라스회피',   value: pct(d.last_avoid_rate) },
        { label: '토비율',     value: pct(d.tobi_rate) },
      ].map(s => `
        <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:0.75rem;padding:0.85rem;text-align:center">
          <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:0.3rem">${s.label}</div>
          <div style="font-family:var(--font-mono);font-size:1rem;font-weight:700">${s.value}</div>
        </div>
      `).join('')}
    </div>

    <!-- 순위 분포 -->
    <div style="margin-bottom:1.5rem">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.75rem;letter-spacing:0.05em">순위 분포</div>
      ${rankBar('1위', d.rank_counts?.['1st'] || 0, d.games, 'var(--gold-mid)')}
      ${rankBar('2위', d.rank_counts?.['2nd'] || 0, d.games, 'var(--silver)')}
      ${rankBar('3위', d.rank_counts?.['3rd'] || 0, d.games, 'var(--bronze)')}
      ${rankBar('4위', d.rank_counts?.['4th'] || 0, d.games, 'var(--negative)')}
    </div>

    <!-- 기록 -->
    <div style="margin-bottom:1.5rem">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.75rem;letter-spacing:0.05em">개인 기록</div>
      <div style="display:flex;flex-direction:column;gap:0.4rem">
        ${[
          { label: '최고 점수',        value: fmt(d.best_score) + '점',          sub: d.best_game_date },
          { label: '최저 점수',        value: fmt(d.worst_score, true) + '점',    sub: d.worst_game_date },
          { label: '가장 많이 한 날',   value: d.most_active_day?.games + '판',   sub: d.most_active_day?.date },
          { label: '연속 참가일',      value: d.max_streak_days + '일',           sub: '최대 연속 참가' },
          { label: '연속 1위',         value: d.max_consec_1st + '연속',          sub: '최장 기록' },
          { label: '연속 꼴찌',        value: d.max_consec_4th + '연속',          sub: '최장 기록' },
          { label: '연속 연대',        value: d.max_consec_top2 + '연속',         sub: '1위+2위 연속' },
          { label: '토비 횟수',        value: d.tobi_count + '번',               sub: pct(d.tobi_rate) + ' 비율' },
        ].map(r => `
          <div class="modal-stat-row" style="display:flex;justify-content:space-between;align-items:center;padding:0.45rem 0;border-bottom:1px solid var(--border-subtle)">
            <span style="font-size:0.8rem;color:var(--text-muted)">${r.label}</span>
            <span style="display:flex;flex-direction:column;align-items:flex-end">
              <span style="font-family:var(--font-mono);font-size:0.85rem;font-weight:600">${r.value}</span>
              <span style="font-size:0.65rem;color:var(--text-muted)">${r.sub || ''}</span>
            </span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 자주 함께 한 사람 -->
    ${d.top_partners?.length ? `
    <div style="margin-bottom:1.5rem">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.75rem;letter-spacing:0.05em">자주 함께 한 사람</div>
      <div style="display:flex;flex-direction:column;gap:0.35rem">
        ${d.top_partners.slice(0, 5).map((p, i) => `
          <div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0;border-bottom:1px solid var(--border-subtle)">
            <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);min-width:18px">${i+1}</span>
            <span style="flex:1;font-size:0.85rem">${p.name}</span>
            <span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gold-mid)">${p.games}판</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 상대 승률 -->
    ${vsArr.length ? `
    <div style="margin-bottom:1.5rem">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.75rem;letter-spacing:0.05em">상대별 평균 순위 (3판↑)</div>
      <div style="display:flex;flex-direction:column;gap:0.3rem;max-height:200px;overflow-y:auto">
        ${vsArr.sort((a,b)=>a[1].my_avg_rank-b[1].my_avg_rank).map(([opp, vs]) => `
          <div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0;border-bottom:1px solid var(--border-subtle)">
            <span style="flex:1;font-size:0.82rem">${opp}</span>
            <span style="font-size:0.7rem;color:var(--text-muted)">${vs.games}판</span>
            <span style="font-family:var(--font-mono);font-size:0.82rem;color:${vs.my_avg_rank < vs.opp_avg_rank ? 'var(--positive)' : vs.my_avg_rank > vs.opp_avg_rank ? 'var(--negative)' : 'var(--neutral)'}">
              나 ${vs.my_avg_rank.toFixed(1)}위
            </span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 프리시즌 비교 -->
    ${pre ? `
    <div style="margin-bottom:1.5rem;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:0.75rem;padding:1rem">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.75rem;letter-spacing:0.05em">📊 프리시즌 비교</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem">
        ${[
          { label: '총 판수',   cur: d.games,    pre: pre.games,               unit: '판', better: 'more' },
          { label: '평균 순위', cur: d.avg_rank, pre: pre.avg_rank, deci: 2,    unit: '위', better: 'less' },
          { label: '연대율',    cur: pct(d.top2_rate), pre: pct(pre.top2_rate), unit: '',  better: 'more' },
          { label: '라스회피',  cur: pct(d.last_avoid_rate), pre: pct(pre.last_avoid_rate), unit: '', better: 'more' },
        ].map(item => {
          const numCur = typeof item.cur === 'number' ? item.cur : parseFloat(item.cur);
          const numPre = typeof item.pre === 'number' ? item.pre : parseFloat(item.pre);
          const improved = item.better === 'more' ? numCur > numPre : numCur < numPre;
          const arrow = numCur === numPre ? '' : improved ? ' ▲' : ' ▼';
          const ac = numCur === numPre ? 'var(--neutral)' : improved ? 'var(--positive)' : 'var(--negative)';
          return `
            <div style="padding:0.4rem">
              <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:0.2rem">${item.label}</div>
              <div style="font-family:var(--font-mono);font-size:0.85rem">
                <span style="color:${ac}">${item.cur}${arrow}</span>
                <span style="font-size:0.65rem;color:var(--text-muted);margin-left:0.3rem">← ${item.pre}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 배지 -->
    ${allBadges.length ? `
    <div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.75rem;letter-spacing:0.05em">🎖️ 보유 배지</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
        ${allBadges.map(b => {
          const cls = gradeClass(b.grade);
          return `
            <div class="badge-${cls}" style="padding:0.3rem 0.7rem;border-radius:99px;font-size:0.72rem;border:1px solid;display:inline-flex;align-items:center;gap:0.3rem">
              ${b.name}
            </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : ''}
  `;

  document.getElementById('player-modal').classList.add('open');
}
