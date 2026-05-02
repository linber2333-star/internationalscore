/* ============================================================
   script.js — Homepage: all DOM access deferred to init()
   ============================================================ */
(function () {
  'use strict';

  /* ── Previous score badge ── */
  function renderScoreBadge() {
    var badge = document.getElementById('scoreBadge');
    if (!badge) return;
    var score, date;
    try { score = localStorage.getItem('ls_last_score'); date = localStorage.getItem('ls_last_date'); } catch(e){}

    if (score !== null && score !== undefined) {
      badge.innerHTML =
        '<div class="score-badge-inner">' +
          '<div class="score-badge-label" data-i18n="hero.score.label">' + window.t('hero.score.label') + '</div>' +
          '<div class="score-badge-num">' + score + '<span>/150</span></div>' +
          (date ? '<div class="score-badge-date">' + date + '</div>' : '') +
          '<a href="quiz-quick.html" class="score-badge-retake" data-i18n="hero.score.retake">' + window.t('hero.score.retake') + '</a>' +
        '</div>';
      badge.classList.add('has-score');
    } else {
      badge.innerHTML = '<span class="score-badge-none" data-i18n="hero.score.none">' + window.t('hero.score.none') + '</span>';
      badge.classList.remove('has-score');
    }
  }

  /* ── Arc animation ── */
  function animateArc() {
    var arcFill   = document.getElementById('arcFill');
    var arcNumber = document.getElementById('arcNumber');
    if (!arcFill || !arcNumber) return;

    var savedScore;
    try { savedScore = parseInt(localStorage.getItem('ls_last_score') || '0', 10); } catch(e){ savedScore = 0; }
    var TARGET = savedScore > 0 ? savedScore : 78;
    var CIRC   = 534;
    var animated = false;

    var scoreDisplay = document.querySelector('.score-display');
    if (!scoreDisplay) return;

    var obs = new IntersectionObserver(function(entries) {
      if (!entries[0].isIntersecting || animated) return;
      animated = true;
      arcFill.style.strokeDashoffset = CIRC * (1 - Math.min(TARGET,150) / 150);

      var dur = 2400, delay = 800;
      var startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts + delay;
        if (ts < startTime) { requestAnimationFrame(step); return; }
        var p = Math.min((ts - startTime) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        arcNumber.textContent = Math.round(e * TARGET);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    obs.observe(scoreDisplay);
  }

  /* ── Feature cards ── */
  function setupFeatureCards() {
    document.querySelectorAll('.feature-card').forEach(function(card) {
      card.style.animationPlayState = 'paused';
      new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) { card.style.animationPlayState = 'running'; }
      }, { threshold: 0.15 }).observe(card);
    });
  }

  /* ── Start button ripple ── */
  function setupStartBtn() {
    var startBtn = document.getElementById('startBtn');
    if (!startBtn) return;
    var st = document.createElement('style');
    st.textContent = '@keyframes rippleAnim{to{transform:scale(30);opacity:0}}';
    document.head.appendChild(st);
    startBtn.addEventListener('click', function(e) {
      var r   = this.getBoundingClientRect();
      var rpl = document.createElement('span');
      rpl.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,.3);width:10px;height:10px;top:'+(e.clientY-r.top-5)+'px;left:'+(e.clientX-r.left-5)+'px;pointer-events:none;transform:scale(0);animation:rippleAnim .6s ease-out forwards;';
      this.appendChild(rpl);
      setTimeout(function(){ if(rpl.parentNode) rpl.parentNode.removeChild(rpl); }, 650);
    });
  }

  /* ── Lang switcher ── */
  function setupLangSwitcher() {
    var ls = document.getElementById('langSwitcher');
    if (!ls) return;
    ls.addEventListener('click', function(e) { e.stopPropagation(); ls.classList.toggle('open'); });
    document.addEventListener('click', function() { ls.classList.remove('open'); });
    document.querySelectorAll('.lang-option').forEach(function(opt) {
      opt.addEventListener('click', function(e) {
        e.stopPropagation();
        window.applyI18n(opt.dataset.lang);
        ls.classList.remove('open');
        renderScoreBadge();
      });
    });
  }

  /* ── Mobile nav ── */
  function setupMobileNav() {
    var mt  = document.getElementById('menuToggle');
    var nav = document.getElementById('nav');
    if (!mt || !nav) return;
    mt.addEventListener('click', function() {
      var open = nav.classList.toggle('mobile-open');
      mt.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav-link').forEach(function(l) {
      l.addEventListener('click', function() {
        nav.classList.remove('mobile-open');
        mt.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Scroll header shadow ── */
  function setupScrollHeader() {
    var header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', function() {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ── Parallax rings ── */
  function setupParallax() {
    var rings = document.querySelectorAll('.ring');
    if (!rings.length) return;
    window.addEventListener('mousemove', function(e) {
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      var dx = (e.clientX - cx) / cx, dy = (e.clientY - cy) / cy;
      rings.forEach(function(r, i) {
        var s = (i + 1) * 5;
        r.style.marginLeft = (dx * s) + 'px';
        r.style.marginTop  = (dy * s) + 'px';
      });
    }, { passive: true });
  }

  /* ── Particles ── */
  function setupParticles() {
    var pc = document.getElementById('particles');
    if (!pc) return;
    for (var i = 0; i < 20; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      var s = Math.random() * 10 + 4;
      p.style.cssText = 'width:'+s+'px;height:'+s+'px;left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;--dur:'+(Math.random()*12+8)+'s;--delay:'+(Math.random()*15)+'s;--op:'+(Math.random()*.2+.07).toFixed(2)+';';
      pc.appendChild(p);
    }
  }

  /* ── View Result button (enabled only after completing a test) ── */
  function setupViewResultBtn() {
    var btn = document.getElementById('viewResultBtn');
    if (!btn) return;
    var hasResult = false;
    try {
      hasResult = !!(localStorage.getItem('ls_result_latest')
        || localStorage.getItem('ls_result_deep')
        || localStorage.getItem('ls_result_quick'));
    } catch(e){}
    if (hasResult) {
      btn.disabled = false;
      btn.classList.add('enabled');
    } else {
      btn.disabled = true;
      btn.classList.remove('enabled');
    }
  }

  /* ── Init ── */
  function init() {
    setupScrollHeader();
    setupLangSwitcher();
    setupMobileNav();
    setupStartBtn();
    setupParticles();
    setupFeatureCards();
    setupParallax();
    animateArc();
    renderScoreBadge();
    setupViewResultBtn();

    /* Winner mode — golden homepage when last score >= 100 */
    var lastScore = 0;
    try { lastScore = parseInt(localStorage.getItem('ls_last_score') || '0', 10); } catch(e){}
    if (lastScore >= 100) {
      document.body.classList.add('winner-mode');
      var wb = document.getElementById('winnerBanner');
      if (wb) wb.style.display = 'block';
      /* Fire confetti twice for full brutalist celebration */
      setTimeout(function(){ launchConfetti(); },  600);
      setTimeout(function(){ launchConfetti(); }, 2200);
    }
  }

  /* ══════════════════════════════════════════════════════
     BRUTALIST CONFETTI — squares & sharp rectangles only,
     palette restricted to Gold / Orange / Black (+ pure
     White as a high-contrast accent so the gold particles
     remain readable when they overlap each other).
     Ported from result.js with shape/palette adjustments
     to match the homepage Neo-Brutalism aesthetic.
     ══════════════════════════════════════════════════════ */
  function launchConfetti() {
    var canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var colors = ['#FFD700', '#f59e0b', '#FFA500', '#000000', '#FFFFFF'];

    /* Create particles from both sides — symmetric burst */
    for (var i = 0; i < 140; i++) {
      var fromLeft = i % 2 === 0;
      /* Brutalist shapes only: square OR sharp horizontal/vertical rectangle.
         No circles, no soft shapes. */
      var aspectRoll = Math.random();
      var shape;
      if      (aspectRoll < 0.55) shape = 'square';     /* 1:1 */
      else if (aspectRoll < 0.80) shape = 'rect-wide';  /* 2:1 */
      else                        shape = 'rect-tall';  /* 1:2 */
      particles.push({
        x:        fromLeft ? -10 : canvas.width + 10,
        y:        canvas.height * 0.5 + (Math.random() - 0.5) * canvas.height * 0.4,
        vx:       (fromLeft ? 1 : -1) * (Math.random() * 12 + 4),
        vy:      -(Math.random() * 14 + 4),
        gravity:  0.25,
        size:     Math.random() * 10 + 6,
        color:    colors[Math.floor(Math.random() * colors.length)],
        shape:    shape,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        opacity:  1,
        decay:    0.008 + Math.random() * 0.006,
      });
    }

    var startTime = Date.now();
    function animate() {
      var elapsed = Date.now() - startTime;
      if (elapsed > 4000) {
        canvas.style.display = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function(p) {
        p.x  += p.vx;
        p.vy += p.gravity;
        p.y  += p.vy;
        p.vx *= 0.98;
        p.rotation += p.rotSpeed;
        p.opacity  -= p.decay;
        if (p.opacity <= 0) return;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        var w, h;
        if      (p.shape === 'rect-wide') { w = p.size * 1.6; h = p.size * 0.7; }
        else if (p.shape === 'rect-tall') { w = p.size * 0.7; h = p.size * 1.6; }
        else                              { w = p.size;       h = p.size; }
        ctx.fillRect(-w / 2, -h / 2, w, h);
        /* Thick black outline gives the brutalist hard-edge look on every
           non-black particle. Black particles get no outline (would be
           invisible). */
        if (p.color !== '#000000') {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(-w / 2, -h / 2, w, h);
        }
        ctx.restore();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
