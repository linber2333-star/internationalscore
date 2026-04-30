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

    /* Winner mode — golden homepage when last score > 100 */
    var lastScore = 0;
    try { lastScore = parseInt(localStorage.getItem('ls_last_score') || '0', 10); } catch(e){}
    if (lastScore > 100) {
      document.body.classList.add('winner-mode');
      var wb = document.getElementById('winnerBanner');
      if (wb) wb.style.display = 'block';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
