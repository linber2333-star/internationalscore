/* ============================================================
   PATCH: Replace your existing drawShareCard() in result.js
   with this entire function.
   ============================================================ */

function drawShareCard() {
  var canvas = document.getElementById('shareCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width;   // 640
  var H = canvas.height;  // 360

  /* ── Detect gender + score for theme ── */
  var answers = {};
  try { answers = JSON.parse(localStorage.getItem('ls_result_quick') || localStorage.getItem('ls_result_deep') || '{}'); } catch(e){}
  var gender = (answers.gender || answers.q_gender || '').toLowerCase();
  var isFemale = gender === 'female' || gender === 'f' || gender === '女';

  var score = 0;
  try { score = parseInt(localStorage.getItem('ls_last_score') || '0', 10); } catch(e){}
  var isGold = score >= 100;

  /* ── Theme palettes ── */
  var theme;
  if (isGold) {
    theme = {
      bg1: '#2a1a00',
      bg2: '#5c3a00',
      accent1: '#ffd700',
      accent2: '#ffb300',
      accent3: '#ffe066',
      shimmer1: '#fff3b0',
      shimmer2: '#ffd700',
      scoreColor: '#fff8dc',
      textColor: '#fff8dc',
      subColor: 'rgba(255,248,220,0.75)',
      pillBg: 'rgba(255,215,0,0.18)',
      pillBorder: 'rgba(255,215,0,0.55)',
      dotColors: ['#ffd700','#ffb300','#ffe066','#fff3b0','#e6a800'],
      shapeColors: ['rgba(255,215,0,0.18)','rgba(255,179,0,0.14)','rgba(255,224,102,0.13)'],
      starColor: 'rgba(255,215,0,0.55)',
      badgeBg: 'linear-gradient(135deg,#ffd700,#ffb300)',
      badgeText: '#2a1a00',
    };
  } else if (isFemale) {
    theme = {
      bg1: '#1a0a14',
      bg2: '#3d1a2e',
      accent1: '#f472b6',
      accent2: '#ec4899',
      accent3: '#fbcfe8',
      shimmer1: '#fff0f7',
      shimmer2: '#f9a8d4',
      scoreColor: '#fff0f7',
      textColor: '#fff0f7',
      subColor: 'rgba(255,240,247,0.72)',
      pillBg: 'rgba(244,114,182,0.16)',
      pillBorder: 'rgba(244,114,182,0.5)',
      dotColors: ['#f472b6','#ec4899','#fbcfe8','#fce7f3','#db2777'],
      shapeColors: ['rgba(244,114,182,0.16)','rgba(236,72,153,0.12)','rgba(251,207,232,0.12)'],
      starColor: 'rgba(244,114,182,0.5)',
      badgeBg: 'linear-gradient(135deg,#f472b6,#ec4899)',
      badgeText: '#fff0f7',
    };
  } else {
    theme = {
      bg1: '#060f1e',
      bg2: '#0f2a4a',
      accent1: '#38bdf8',
      accent2: '#0284c7',
      accent3: '#7dd3fc',
      shimmer1: '#e0f2fe',
      shimmer2: '#7dd3fc',
      scoreColor: '#e0f2fe',
      textColor: '#e0f2fe',
      subColor: 'rgba(224,242,254,0.72)',
      pillBg: 'rgba(56,189,248,0.14)',
      pillBorder: 'rgba(56,189,248,0.45)',
      dotColors: ['#38bdf8','#0284c7','#7dd3fc','#bae6fd','#0ea5e9'],
      shapeColors: ['rgba(56,189,248,0.14)','rgba(2,132,199,0.12)','rgba(125,211,252,0.11)'],
      starColor: 'rgba(56,189,248,0.48)',
      badgeBg: 'linear-gradient(135deg,#38bdf8,#0284c7)',
      badgeText: '#e0f2fe',
    };
  }

  /* ── Background gradient ── */
  var bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, theme.bg1);
  bgGrad.addColorStop(1, theme.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  /* ══════════════════════════════════════════
     CUTE GEOMETRIC PATTERN LAYER
  ══════════════════════════════════════════ */

  /* Seeded pseudo-random for deterministic layout */
  var _seed = 42;
  function rand() { _seed = (_seed * 1664525 + 1013904223) & 0xffffffff; return ((_seed >>> 0) / 0xffffffff); }
  function randRange(a, b) { return a + rand() * (b - a); }

  ctx.save();

  /* 1. Soft radial glow spots */
  [[W * 0.15, H * 0.2, 120], [W * 0.78, H * 0.75, 100], [W * 0.6, H * 0.1, 80]].forEach(function(g) {
    var rg = ctx.createRadialGradient(g[0], g[1], 0, g[0], g[1], g[2]);
    rg.addColorStop(0, isGold ? 'rgba(255,200,0,0.13)' : isFemale ? 'rgba(244,114,182,0.12)' : 'rgba(56,189,248,0.11)');
    rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(g[0], g[1], g[2], 0, Math.PI * 2);
    ctx.fill();
  });

  /* 2. Floating dots (circles) */
  var dotPositions = [];
  for (var i = 0; i < 28; i++) {
    dotPositions.push([randRange(0, W), randRange(0, H), randRange(2, 5.5)]);
  }
  dotPositions.forEach(function(d, i) {
    ctx.beginPath();
    ctx.arc(d[0], d[1], d[2], 0, Math.PI * 2);
    ctx.fillStyle = theme.dotColors[i % theme.dotColors.length].replace(')', ', 0.55)').replace('rgb(', 'rgba(').replace('#', '');
    // simpler: just use opacity
    ctx.globalAlpha = 0.45 + rand() * 0.35;
    ctx.fillStyle = theme.dotColors[i % theme.dotColors.length];
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  /* 3. 4-pointed stars / sparkles */
  function drawSparkle(x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    for (var p = 0; p < 4; p++) {
      var angle = (p * Math.PI) / 2;
      var innerAngle = angle + Math.PI / 4;
      if (p === 0) {
        ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      } else {
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.lineTo(Math.cos(innerAngle) * r * 0.28, Math.sin(innerAngle) * r * 0.28);
    }
    ctx.closePath();
    ctx.restore();
  }

  var sparkleSpecs = [
    [W*0.07, H*0.12, 14, 0.2],  [W*0.92, H*0.08, 10, 0.5],
    [W*0.85, H*0.88, 13, -0.3], [W*0.13, H*0.82, 9,  0.8],
    [W*0.5,  H*0.06, 11, 0.1],  [W*0.35, H*0.92, 8,  -0.5],
    [W*0.68, H*0.5,  7,  0.3],  [W*0.22, H*0.45, 6,  0.6],
    [W*0.9,  H*0.45, 9,  -0.2], [W*0.55, H*0.78, 7,  0.4],
  ];
  sparkleSpecs.forEach(function(s) {
    ctx.save();
    ctx.globalAlpha = 0.6 + rand() * 0.3;
    ctx.fillStyle = theme.starColor.replace('0.48', (0.5 + rand() * 0.35).toFixed(2))
                                   .replace('0.50', (0.5 + rand() * 0.35).toFixed(2))
                                   .replace('0.55', (0.5 + rand() * 0.35).toFixed(2));
    drawSparkle(s[0], s[1], s[2], s[3]);
    ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = 1;

  /* 4. Hollow diamond outlines */
  function drawDiamond(x, y, w, h, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(0, h / 2);
    ctx.lineTo(-w / 2, 0);
    ctx.closePath();
    ctx.restore();
  }

  var diamondSpecs = [
    [W*0.04, H*0.5,  18, 22, 0.15, 0.4],
    [W*0.96, H*0.3,  14, 18, -0.2, 0.35],
    [W*0.5,  H*0.95, 16, 20, 0.1,  0.38],
    [W*0.25, H*0.08, 12, 15, 0.3,  0.3],
    [W*0.78, H*0.15, 10, 13, -0.1, 0.32],
    [W*0.15, H*0.62, 8,  10, 0.25, 0.28],
    [W*0.88, H*0.62, 11, 14, 0.0,  0.33],
  ];
  diamondSpecs.forEach(function(d) {
    ctx.save();
    ctx.globalAlpha = d[5];
    ctx.strokeStyle = theme.accent1;
    ctx.lineWidth = 1.2;
    drawDiamond(d[0], d[1], d[2], d[3], d[4]);
    ctx.stroke();
    ctx.restore();
  });
  ctx.globalAlpha = 1;

  /* 5. Small cute triangles */
  function drawTriangle(x, y, size, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.866, size * 0.5);
    ctx.lineTo(-size * 0.866, size * 0.5);
    ctx.closePath();
    ctx.restore();
  }

  var triSpecs = [
    [W*0.1,  H*0.35, 7,  0.3,  0.25],
    [W*0.88, H*0.5,  6,  -0.5, 0.22],
    [W*0.45, H*0.88, 8,  0.8,  0.28],
    [W*0.7,  H*0.08, 5,  0.1,  0.20],
    [W*0.3,  H*0.18, 6,  -0.3, 0.23],
    [W*0.62, H*0.65, 5,  0.6,  0.20],
  ];
  triSpecs.forEach(function(t) {
    ctx.save();
    ctx.globalAlpha = t[4];
    ctx.fillStyle = theme.accent3;
    drawTriangle(t[0], t[1], t[2], t[3]);
    ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = 1;

  /* 6. Tiny cross / plus marks */
  function drawCross(x, y, size, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(-size, 0); ctx.lineTo(size, 0);
    ctx.moveTo(0, -size); ctx.lineTo(0, size);
    ctx.restore();
  }

  var crossSpecs = [
    [W*0.18, H*0.25, 5, 0.2,  0.35],
    [W*0.82, H*0.75, 4, 0.5,  0.30],
    [W*0.55, H*0.15, 5, 0.0,  0.33],
    [W*0.38, H*0.78, 4, 0.3,  0.28],
    [W*0.72, H*0.38, 5, -0.2, 0.32],
    [W*0.08, H*0.7,  4, 0.6,  0.28],
  ];
  crossSpecs.forEach(function(c) {
    ctx.save();
    ctx.globalAlpha = c[4];
    ctx.strokeStyle = theme.shimmer2;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    drawCross(c[0], c[1], c[2], c[3]);
    ctx.stroke();
    ctx.restore();
  });
  ctx.globalAlpha = 1;

  /* 7. Gold-only: diagonal shimmer stripe */
  if (isGold) {
    var shimGrad = ctx.createLinearGradient(0, 0, W, H);
    shimGrad.addColorStop(0, 'transparent');
    shimGrad.addColorStop(0.38, 'transparent');
    shimGrad.addColorStop(0.47, 'rgba(255,248,176,0.07)');
    shimGrad.addColorStop(0.53, 'rgba(255,248,176,0.13)');
    shimGrad.addColorStop(0.62, 'rgba(255,248,176,0.07)');
    shimGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shimGrad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();

  /* ══════════════════════════════════════════
     CARD CONTENT
  ══════════════════════════════════════════ */

  /* Left panel vertical accent bar */
  var barGrad = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.9);
  barGrad.addColorStop(0, theme.accent1);
  barGrad.addColorStop(1, theme.accent2);
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(32, H * 0.1, 4, H * 0.8, 2);
  ctx.fill();

  /* Score circle */
  var cx = 160, cy = H / 2, cr = 76;

  // Outer glow ring
  var glowGrad = ctx.createRadialGradient(cx, cy, cr - 10, cx, cy, cr + 28);
  glowGrad.addColorStop(0, isGold ? 'rgba(255,215,0,0.22)' : isFemale ? 'rgba(244,114,182,0.20)' : 'rgba(56,189,248,0.18)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, cr + 28, 0, Math.PI * 2);
  ctx.fill();

  // Track ring
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.strokeStyle = isGold ? 'rgba(255,215,0,0.18)' : isFemale ? 'rgba(244,114,182,0.18)' : 'rgba(56,189,248,0.18)';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Score arc
  var scoreRatio = Math.min(score, 150) / 150;
  ctx.beginPath();
  ctx.arc(cx, cy, cr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * scoreRatio);
  var arcGrad = ctx.createLinearGradient(cx - cr, cy, cx + cr, cy);
  arcGrad.addColorStop(0, theme.accent1);
  arcGrad.addColorStop(1, theme.accent2);
  ctx.strokeStyle = arcGrad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Score text
  ctx.fillStyle = theme.scoreColor;
  ctx.font = 'bold 46px Quicksand, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(score, cx, cy + 14);

  ctx.fillStyle = theme.subColor;
  ctx.font = '13px Quicksand, sans-serif';
  ctx.fillText('/ 150', cx, cy + 34);

  // Gold crown above circle
  if (isGold) {
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑', cx, cy - cr - 10);
  }

  /* ── Right panel text ── */
  var lang = (window.I18N_CURRENT || localStorage.getItem('ls_lang') || 'zh-CN');
  var dict = window.I18N && window.I18N[lang] ? window.I18N[lang] : {};

  var brandName = dict['brandName'] || 'LifeScore';
  var totalLabel = dict['result.total'] || '综合评分';

  // Domain tag pill
  var pillX = 295, pillY = 52, pillW = 188, pillH = 26, pillR = 13;
  ctx.fillStyle = theme.pillBg;
  ctx.strokeStyle = theme.pillBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY - pillH + 6, pillW, pillH, pillR);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.accent1;
  ctx.font = '11px Quicksand, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('lifescore.space', pillX + pillW / 2, pillY - 1);

  // Brand name
  ctx.fillStyle = theme.textColor;
  ctx.font = 'bold 28px Quicksand, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(brandName, 295, 112);

  // Score label
  ctx.fillStyle = theme.subColor;
  ctx.font = '13px Quicksand, sans-serif';
  ctx.fillText(totalLabel, 295, 134);

  // Verdict / tier
  var verdictKey = score > 110 ? 'result.exceptional'
    : score >= 90  ? 'result.excellent'
    : score >= 70  ? 'result.high'
    : score >= 50  ? 'result.mid'
    : score >= 35  ? 'result.mid-low'
    : 'result.low';
  var verdict = dict[verdictKey] || verdictKey;

  // Verdict badge
  var vbX = 295, vbY = 158, vbW = 110, vbH = 28;
  var vbGrad = ctx.createLinearGradient(vbX, vbY, vbX + vbW, vbY + vbH);
  vbGrad.addColorStop(0, theme.accent1);
  vbGrad.addColorStop(1, theme.accent2);
  ctx.fillStyle = vbGrad;
  ctx.beginPath();
  ctx.roundRect(vbX, vbY, vbW, vbH, 14);
  ctx.fill();

  ctx.fillStyle = isGold ? '#2a1a00' : '#fff';
  ctx.font = 'bold 13px Quicksand, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(verdict, vbX + vbW / 2, vbY + 18);

  // Divider
  ctx.strokeStyle = isGold ? 'rgba(255,215,0,0.2)' : isFemale ? 'rgba(244,114,182,0.2)' : 'rgba(56,189,248,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(295, 205); ctx.lineTo(W - 36, 205);
  ctx.stroke();

  // CTA text
  var ctaText = lang.startsWith('zh')
    ? '扫码了解你的人生评分'
    : lang === 'es-US'
    ? 'Escanea para ver tu puntuación'
    : lang === 'en-PH'
    ? 'Scan to see your score'
    : 'Scan to discover your LifeScore';

  ctx.fillStyle = theme.subColor;
  ctx.font = '12px Quicksand, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(ctaText, 295, 228);

  // Footer URL
  ctx.fillStyle = theme.accent1;
  ctx.font = 'bold 12px Quicksand, sans-serif';
  ctx.fillText('lifescore.space', 295, 310);

  // Star accent next to URL
  ctx.font = '11px serif';
  ctx.fillText('✦', 295 + ctx.measureText('lifescore.space').width + 8, 310);

  /* ── Gold shimmer text overlay ── */
  if (isGold) {
    var goldTextGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldTextGrad.addColorStop(0, '#ffd700');
    goldTextGrad.addColorStop(0.5, '#fff8dc');
    goldTextGrad.addColorStop(1, '#ffb300');

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.font = 'bold 96px Quicksand, sans-serif';
    ctx.fillStyle = goldTextGrad;
    ctx.textAlign = 'center';
    ctx.fillText('★', W / 2, H / 2 + 40);
    ctx.restore();
  }
}
/* ── END PATCH ── */
