/* quiz.js — 3-per-page engine, multi-select, auto-advance
   Bug fixes:
   - Snapshot page contents before rebuildQueue() to prevent mid-answer queue mutation
   - Single auto-advance timer with cancel-on-new-selection
   - Render lock to prevent concurrent double-renders
*/
(function () {
  'use strict';
  var PER_PAGE = 3;
  var answers = {}, activeQueue = [], pages = [], currentPage = 0;
  var isReviewing = false;

  /* Render lock: prevents a queued setTimeout render from firing after a
     newer render has already started */
  var renderGeneration = 0;

  /* Single pending auto-advance timer — cancelled on every new selection */
  var autoAdvanceTimer = null;

  var cardArea, btnPrev, btnNext, btnNextLabel, headerFill, headerLabel,
      progressCount, sectionLabel, sectionDot, pageDots, pageCompleteBanner;

  var SECTION_META = {
    basic:    { i18n:'quiz.section.basic',    color:'#0e8ee8' },
    social:   { i18n:'quiz.section.social',   color:'#7c3aed' },
    identity: { i18n:'quiz.section.identity', color:'#059669' },
    bonus:    { i18n:'quiz.section.bonus',     color:'#d97706' },
  };

  /* ── Queue helpers ── */

  /* frozenPages: a map of { pageIndex -> [qid, qid, qid] } for every page
     that has already been RENDERED to the user.  Once a page renders, its
     question composition is permanently locked — answering questions on it
     can never change which questions appear on that same page.

     WHY: Answering mid-page questions (e.g. B1 job-status inserting B1s,
     or B5 marital-status inserting B6) mutates pages[] while the user is
     still on that page. Locking each page at render time eliminates this
     entire class of navigation-freeze bugs across ALL pages, not just page 0.

     RULE: pages[i] for i <= currentPage always come from frozenPages[i].
     pages[i] for i >  currentPage are rebuilt dynamically each time. */
  var frozenPages = {};   /* { index: [qid,...] } — grows as user advances */

  function rebuildQueue() {
    var fa = flatAnswers();
    /* Use quick bank for quick mode, full bank for deep mode */
    var _bank = (window.QUIZ_MODE === 'quick' && window.QUICK_QUESTION_BANK)
      ? window.QUICK_QUESTION_BANK
      : window.QUESTION_BANK;
    activeQueue = _bank.filter(function(q) {
      /* Short mode: only include questions in SHORT_QUIZ_IDS */
      if (IS_SHORT_MODE && window.SHORT_QUIZ_IDS && !window.SHORT_QUIZ_IDS.has(q.id)) return false;
      return typeof q.showIf === 'function' ? q.showIf(fa) : true;
    }).map(function(q) { return q.id; });

    /* Collect all QIDs that are frozen (already shown to user) */
    var frozenSet = {};
    Object.keys(frozenPages).forEach(function(pi) {
      frozenPages[pi].forEach(function(id){ frozenSet[id] = true; });
    });

    /* Build pages: frozen pages keep their locked composition,
       future pages are rebuilt from the remaining active queue */
    var highestFrozen = -1;
    Object.keys(frozenPages).forEach(function(pi){
      var n = parseInt(pi, 10);
      if (n > highestFrozen) highestFrozen = n;
    });

    pages = [];
    for (var pi = 0; pi <= highestFrozen; pi++) {
      pages.push(frozenPages[pi] ? frozenPages[pi].slice() : []);
    }

    /* Remaining active questions not yet frozen */
    var remaining = activeQueue.filter(function(id){ return !frozenSet[id]; });
    for (var i = 0; i < remaining.length; i += PER_PAGE) {
      pages.push(remaining.slice(i, i + PER_PAGE));
    }
  }

  /* SHORT MODE: if URL param ?mode=short is set, only include SHORT_QUIZ_IDS questions */
  var IS_SHORT_MODE = (typeof URLSearchParams !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mode') === 'short');

  /* Called from renderPage — freeze the page being rendered if not already frozen */
  function freezePageIfNeeded(pageIdx) {
    if (!frozenPages[pageIdx]) {
      frozenPages[pageIdx] = (pages[pageIdx] || []).slice();
    }
  }

  function flatAnswers() {
    var s = {};
    Object.keys(answers).forEach(function(k) {
      var v = answers[k];
      s[k] = Array.isArray(v) ? (v[0] !== undefined ? v[0] : undefined) : v;
    });
    return s;
  }

  function getQ(id) {
    var _bank = (window.QUIZ_MODE === 'quick' && window.QUICK_QUESTION_BANK)
      ? window.QUICK_QUESTION_BANK
      : window.QUESTION_BANK;
    return _bank.find(function(q){ return q.id === id; });
  }

  function isAnswered(qid) {
    var a = answers[qid];
    if (a === undefined || a === null) return false;
    if (Array.isArray(a)) return a.length > 0;
    return true;
  }

  /* ── Render page ── */
  function renderPage(pageIdx, direction) {
    /* Bump generation so any pending setTimeout from a previous render
       knows it is stale and should not proceed */
    var gen = ++renderGeneration;

    var qids = pages[pageIdx] || [];
    var lang  = window.I18N_CURRENT || 'zh-CN';
    var isEn  = (lang === 'en-US' || lang === 'en-PH');
    var isEs  = (lang === 'es-US');
    var isTW  = (lang === 'zh-TW');
    var letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];

    /* Section label */
    var sc = {};
    qids.forEach(function(qid){
      var q = getQ(qid);
      if (q) { var s = q.section; sc[s] = (sc[s]||0)+1; }
    });
    var dom = Object.keys(sc).length
      ? Object.keys(sc).reduce(function(a,b){ return (sc[a]||0)>=(sc[b]||0)?a:b; })
      : 'basic';
    var meta = SECTION_META[dom] || SECTION_META.basic;
    if (sectionLabel) { sectionLabel.setAttribute('data-i18n', meta.i18n); sectionLabel.textContent = window.t(meta.i18n); }
    if (sectionDot)   sectionDot.style.background = meta.color;

    /* Progress */
    var done  = activeQueue.filter(function(qid){ return isAnswered(qid); }).length;
    var total = activeQueue.length;
    var pct   = total > 0 ? Math.round(done / total * 100) : 0;
    if (headerFill)    headerFill.style.width    = pct + '%';
    if (headerLabel)   headerLabel.textContent   = pct + '%';
    if (progressCount) {
      var _isEN2 = (lang === 'en-US' || lang === 'en-PH' || lang === 'es-US');
      progressCount.textContent = _isEN2
        ? (lang === 'es-US' ? 'Pág. '+(pageIdx+1)+' de '+pages.length : 'Page '+(pageIdx+1)+' of '+pages.length)
        : ('第 '+(pageIdx+1)+' 页 · 共 '+pages.length+' 页');
    }

    /* Scroll to top */
    window.scrollTo({ top: 0, behavior: 'instant' });

    /* Animate out existing cards */
    var existing = cardArea.querySelectorAll('.q-card');
    var outClass = direction >= 0 ? 'slide-out-left' : 'slide-out-right';
    existing.forEach(function(c){ c.classList.add(outClass); });
    var delay = existing.length > 0 ? 260 : 0;

    setTimeout(function() {
      /* Stale render check: if another renderPage call fired after us, abort */
      if (gen !== renderGeneration) return;

      /* Freeze this page's composition so mid-page answers can never mutate it */
      freezePageIfNeeded(pageIdx);
      /* Re-read from frozen record — qids is now guaranteed stable */
      qids = frozenPages[pageIdx] ? frozenPages[pageIdx].slice() : qids;

      cardArea.innerHTML = '';

      qids.forEach(function(qid, ci) {
        var q = getQ(qid);
        if (!q) return;
        /* Dynamic question text — supports all 4 locales via qlang() */
        var _fa = flatAnswers();
        var qText = (typeof window.qlangFn === 'function') ? window.qlangFn(q, _fa) : window.qlang(q);
        var sel     = answers[qid];
        var gNum    = activeQueue.indexOf(qid) + 1;
        var mc      = (SECTION_META[q.section] || SECTION_META.basic).color;
        var isMulti = !!q.multi;

        var _isEN = (lang === 'en-US' || lang === 'en-PH' || lang === 'es-US');
        var noteHtml   = (q.note && !q.noNote && !q.hideNote) ? '<div class="q-note">'+(window.qlang ? window.qlang(q.note) : (lang==='zh-TW'?q.note.tw:q.note.cn))+'</div>' : '';
        var nsBadge    = q.scorable ? '' : '<span class="q-noscore-badge">'+(_isEN ? (lang==='es-US'?'Sin puntaje':'Not scored') : (lang==='zh-TW'?'不計分':'不计分'))+'</span>';
        var multiBadge = isMulti ? '<span class="q-multi-badge">'+(_isEN ? (lang==='es-US'?'Múltiple':'Multi-select') : (lang==='zh-TW'?'多選':'多选'))+'</span>' : '';
        var bonusBadge = q.bonus ? '<span class="q-bonus-badge">⭐ '+(_isEN ? (lang==='es-US'?'Puntos élite':'Bonus') : (lang==='zh-TW'?'加分題':'加分题'))+'</span>' : '';

        var selArr   = isMulti ? (Array.isArray(sel) ? sel : []) : [];
        var optsHtml = q.options.map(function(o, i) {
          var text = (typeof window.qlang === 'function') ? window.qlang(o) : (lang === 'zh-TW' ? o.tw : o.cn);
          var isSel = isMulti ? selArr.indexOf(i) >= 0 : sel === i;
          var cls   = isMulti ? 'q-option q-option--multi' : 'q-option';
          return '<div class="'+cls+(isSel?' selected':'')+
            '" data-qid="'+qid+'" data-oi="'+i+'" data-multi="'+isMulti+
            '" tabindex="0" role="'+(isMulti?'checkbox':'button')+'" aria-checked="'+isSel+'">'+
            '<div class="opt-letter'+(isSel?' sel':'')+'">'+
              (isMulti
                ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
                : (letters[i] || '?'))+
            '</div>'+
            (isMulti ? '' : '<div class="opt-letter-txt">'+(letters[i]||'?')+'</div>')+
            '<div class="opt-text">'+text+'</div>'+
            (!isMulti ? '<div class="opt-check'+(isSel?'':' hidden')+'">'+
              (isSel ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '')+
            '</div>' : '')+
            '</div>';
        }).join('');

        var answered = isAnswered(qid);
        var card = document.createElement('div');
        card.className = 'q-card' + (answered ? ' answered-card' : '') + (q.bonus ? ' q-card--bonus' : '');
        card.id = 'card-' + qid;
        card.style.animationDelay = (ci * 0.07) + 's';
        card.innerHTML =
          '<div class="qc-accent" style="background:'+mc+'"></div>'+
          '<div class="q-card-inner">'+
            '<div class="q-meta"><div class="q-num-badge" style="background:'+mc+'18;color:'+mc+'">'+gNum+'</div>'+nsBadge+multiBadge+bonusBadge+'</div>'+
            '<div class="q-text">'+qText+'</div>'+
            noteHtml+
            '<div class="q-options" id="opts-'+qid+'">'+optsHtml+'</div>'+
            (answered ? '<div class="q-answered-indicator"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> <span>'+window.t('quiz.answered')+'</span></div>' : '') +
          '</div>';

        var inClass = direction >= 0 ? 'slide-in-right' : 'slide-in-left';
        card.classList.add(inClass);
        cardArea.appendChild(card);
        setTimeout(function(){ card.classList.remove('slide-in-right', 'slide-in-left'); }, 380);

        /* Bind option events — capture qid/isMulti in closure */
        card.querySelectorAll('.q-option').forEach(function(opt) {
          (function(capturedQid, capturedOi, capturedMulti) {
            function h() {
              if (capturedMulti) toggleMultiOption(capturedQid, capturedOi);
              else               selectOption(capturedQid, capturedOi);
            }
            opt.addEventListener('click', h);
            opt.addEventListener('keydown', function(e){
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); h(); }
            });
          })(qid, parseInt(opt.dataset.oi, 10), opt.dataset.multi === 'true');
        });
      });

      updatePageDots();
      updateNav();
      updateBanner();
    }, delay);
  }

  /* ── Single-select ── */
  function selectOption(qid, oi) {
    /* Cancel any pending auto-advance from a previous selection */
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }

    answers[qid] = oi;

    /* Snapshot the page contents BEFORE rebuilding the queue.
       This is critical: rebuildQueue() may add/remove questions (e.g. when gender
       is answered, A3h or A3hf appear), changing pages[currentPage] under our feet.
       We use the snapshot to decide scroll-to-next and page-complete logic. */
    var pageQidsBefore = (pages[currentPage] || []).slice();

    rebuildQueue();

    /* Keep currentPage in bounds after potential queue shrink */
    if (currentPage >= pages.length) currentPage = pages.length - 1;

    /* Update visual state of the answered card */
    updateCardUI(qid, oi);
    updateProgressUI();
    updateNav();
    updatePageDots();
    updateBanner();

    /* Find the next unanswered question ON THE CURRENT RENDERED PAGE
       (use snapshot so we reference what's actually on screen) */
    var nextUnanswered = null;
    for (var i = 0; i < pageQidsBefore.length; i++) {
      var cid = pageQidsBefore[i];
      if (cid !== qid && !isAnswered(cid)) { nextUnanswered = cid; break; }
    }

    if (nextUnanswered) {
      /* Scroll to the next unanswered card on this page */
      (function(target) {
        setTimeout(function() {
          var nc = document.getElementById('card-' + target);
          if (nc) {
            var top = nc.getBoundingClientRect().top + window.scrollY - 110;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        }, 200);
      })(nextUnanswered);
    } else {
      /* All cards on this (frozen) page are answered.
         The current page is always frozen — queueChanged is impossible.
         Just auto-advance when not reviewing. */
      if (!isReviewing && currentPage < pages.length - 1) {
        autoAdvanceTimer = setTimeout(function() {
          autoAdvanceTimer = null;
          goToPage(currentPage + 1, 1, false);
        }, 600);
      }
    }
  }

  /* ── Multi-select toggle ── */
  function toggleMultiOption(qid, oi) {
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }

    var q   = getQ(qid);
    var cur = Array.isArray(answers[qid]) ? answers[qid].slice() : [];
    var opt = q.options[oi];

    if (opt.exclusive) {
      cur = [oi];
    } else {
      cur = cur.filter(function(i){ return q.options[i] && !q.options[i].exclusive; });
      var pos = cur.indexOf(oi);
      if (pos >= 0) cur.splice(pos, 1); else cur.push(oi);
    }
    answers[qid] = cur;

    /* Update multi-option visuals */
    var optsContainer = document.getElementById('opts-' + qid);
    if (optsContainer) {
      optsContainer.querySelectorAll('.q-option--multi').forEach(function(el, i) {
        var isSel = cur.indexOf(i) >= 0;
        el.classList.toggle('selected', isSel);
        el.setAttribute('aria-checked', isSel);
        var ltr = el.querySelector('.opt-letter');
        if (ltr) ltr.classList.toggle('sel', isSel);
      });
    }

    var card = document.getElementById('card-' + qid);
    if (card && cur.length > 0) {
      card.classList.add('answered-card');
      if (!card.querySelector('.q-answered-indicator')) {
        var ind = document.createElement('div');
        ind.className = 'q-answered-indicator';
        ind.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> <span>'+window.t('quiz.answered')+'</span>';
        var inner = card.querySelector('.q-card-inner');
        if (inner) inner.appendChild(ind);
      }
    }

    var pageQidsBefore = (pages[currentPage] || []).slice();
    rebuildQueue();
    if (currentPage >= pages.length) currentPage = pages.length - 1;
    updateProgressUI(); updateNav(); updatePageDots(); updateBanner();

    /* If exclusive option selected and page NOT complete, scroll to next unanswered */
    if (opt && opt.exclusive && !isPageComplete(currentPage)) {
      for (var _ei = 0; _ei < pageQidsBefore.length; _ei++) {
        var _cid = pageQidsBefore[_ei];
        if (_cid !== qid && !isAnswered(_cid)) {
          (function(target) {
            setTimeout(function() {
              var nc = document.getElementById('card-' + target);
              if (nc) {
                var top = nc.getBoundingClientRect().top + window.scrollY - 110;
                window.scrollTo({ top: top, behavior: 'smooth' });
              }
            }, 200);
          })(_cid);
          break;
        }
      }
    }

    if (isPageComplete(currentPage) && !isReviewing) {
      /* If user selected an exclusive option ("does not conform"), always auto-advance
         immediately regardless of noAutoAdvance flag */
      var justAnsweredQ = getQ(qid);
      var selectedExclusive = opt && opt.exclusive;
      if (selectedExclusive) {
        /* Exclusive = "none of the above" — advance immediately like single-select */
        if (currentPage < pages.length - 1) {
          autoAdvanceTimer = setTimeout(function(){ autoAdvanceTimer=null; goToPage(currentPage+1,1,false); }, 400);
        }
      } else if (justAnsweredQ && justAnsweredQ.noAutoAdvance) {
        /* Non-exclusive multi-select: don't auto-advance, user presses Next */
      } else if (currentPage < pages.length - 1) {
        autoAdvanceTimer = setTimeout(function(){ autoAdvanceTimer=null; goToPage(currentPage+1,1,false); }, 600);
      }
    }
  }

  /* ── Visual update helpers ── */
  function updateCardUI(qid, oi) {
    var card = document.getElementById('card-' + qid);
    if (!card) return;
    var svg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    card.querySelectorAll('.q-option').forEach(function(opt, i) {
      var isSel = i === oi;
      opt.classList.toggle('selected', isSel);
      var l = opt.querySelector('.opt-letter'); if (l) l.classList.toggle('sel', isSel);
      var c = opt.querySelector('.opt-check');
      if (c) { c.classList.toggle('hidden', !isSel); c.innerHTML = isSel ? svg : ''; }
    });
    card.classList.add('answered-card');
    if (!card.querySelector('.q-answered-indicator')) {
      var ind = document.createElement('div');
      ind.className = 'q-answered-indicator';
      ind.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> <span>'+window.t('quiz.answered')+'</span>';
      var inner = card.querySelector('.q-card-inner');
      if (inner) inner.appendChild(ind);
    }
  }

  function updateProgressUI() {
    var done = activeQueue.filter(function(qid){ return isAnswered(qid); }).length;
    var pct  = activeQueue.length > 0 ? Math.round(done / activeQueue.length * 100) : 0;
    if (headerFill)  headerFill.style.width    = pct + '%';
    if (headerLabel) headerLabel.textContent   = pct + '%';
  }

  function isPageComplete(idx) {
    return (pages[idx] || []).every(function(qid){ return isAnswered(qid); });
  }

  function updateBanner() {
    if (pageCompleteBanner)
      pageCompleteBanner.classList.toggle('show', isPageComplete(currentPage));
  }

  function updatePageDots() {
    if (!pageDots) return;
    pageDots.innerHTML = '';
    pages.forEach(function(_, i) {
      var d = document.createElement('div');
      d.className = 'qdot' +
        (i === currentPage ? ' qdot--current' : '') +
        (isPageComplete(i) ? ' qdot--done' : '');
      if (i <= currentPage || isPageComplete(i)) {
        d.style.cursor = 'pointer';
        (function(pi) {
          d.addEventListener('click', function() {
            if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
            isReviewing = (pi < currentPage);
            goToPage(pi, pi >= currentPage ? 1 : -1, false);
          });
        })(i);
      }
      pageDots.appendChild(d);
    });
  }

  function updateNav() {
    if (!btnPrev || !btnNext || !btnNextLabel) return;
    var comp    = isPageComplete(currentPage);
    var isLast  = currentPage === pages.length - 1;
    var allDone = activeQueue.every(function(qid){ return isAnswered(qid); });
    btnPrev.disabled = currentPage === 0;
    btnNext.classList.toggle('ready', comp);
    var isSubmit = comp && isLast && allDone;
    btnNextLabel.textContent = isSubmit ? window.t('quiz.submit') : window.t('quiz.next');
    btnNextLabel.setAttribute('data-i18n', isSubmit ? 'quiz.submit' : 'quiz.next');
  }

  function goToPage(idx, dir, fromBtn) {
    if (idx < 0 || idx >= pages.length) return;
    if (fromBtn && dir > 0) isReviewing = false;
    currentPage = idx;
    renderPage(idx, dir);
  }

  /* ── Submit ── */
  function submitQuiz() {
    var activeSet = new Set(activeQueue);
    /* computeMaxScores ignores bonus questions — they're tallied separately */
    var dimRaw    = { basic:0, social:0, identity:0 };
    /* Temporarily point QUESTION_BANK to the active bank for scoring functions */
    var _origBank = window.QUESTION_BANK;
    if (window.QUIZ_MODE === 'quick' && window.QUICK_QUESTION_BANK) {
      window.QUESTION_BANK = window.QUICK_QUESTION_BANK;
    }
    var dimMax    = window.computeMaxScores(activeSet);
    var answerMap = {};

    var _submitBank = (window.QUIZ_MODE === 'quick' && window.QUICK_QUESTION_BANK)
      ? window.QUICK_QUESTION_BANK
      : window.QUESTION_BANK;
    _submitBank.forEach(function(q) {
      if (!activeSet.has(q.id) || !isAnswered(q.id)) return;
      var raw = answers[q.id];
      var score = 0, optText_cn, optText_tw, optText_en, optText_es, oi;

      if (q.multi) {
        score      = window.computeMultiScore(q, raw);
        var arr    = Array.isArray(raw) ? raw : [];
        optText_cn = arr.map(function(i){ return q.options[i] ? q.options[i].cn : ''; }).join('、');
        optText_tw = arr.map(function(i){ return q.options[i] ? q.options[i].tw : ''; }).join('、');
        optText_en = arr.map(function(i){ return q.options[i] ? (q.options[i].en||q.options[i].cn||'') : ''; }).join(', ');
        optText_es = arr.map(function(i){ return q.options[i] ? (q.options[i].es||q.options[i].en||q.options[i].cn||'') : ''; }).join(', ');
        oi         = arr[0] !== undefined ? arr[0] : 0;
      } else {
        oi         = raw;
        var opt    = q.options[oi];
        score      = q.scorable ? (opt.score || 0) : 0;
        optText_cn = opt.cn; optText_tw = opt.tw;
        optText_en = opt.en || opt.cn || '';
        optText_es = opt.es || opt.en || opt.cn || '';
      }

      answerMap[q.id] = {
        questionIdx: oi,
        selectedIndices: Array.isArray(raw) ? raw : [raw],
        score: q.scorable ? score : null,
        optionText_cn: optText_cn, optionText_tw: optText_tw,
        optionText_en: optText_en, optionText_es: optText_es,
        section: q.section,
        bonus: q.bonus || false,
      };
      /* Bonus questions are tallied via computeBonusScore; skip from dimRaw */
      if (q.scorable && !q.bonus) dimRaw[q.section] += score;
    });

    /* ── Step 1: per-dimension percentage (raw score / max possible) ── */
    var dimPct = {};
    Object.keys(dimRaw).forEach(function(d) {
      dimPct[d] = dimMax[d] > 0 ? dimRaw[d] / dimMax[d] : 0.5;
    });

    /* ── Step 2: weighted composite raw percentage (0–1) ── */
    var W = window.DIM_WEIGHTS;
    var compositeRaw =
      (dimPct.basic    || 0) * W.basic    +
      (dimPct.social   || 0) * W.social   +
      (dimPct.identity || 0) * W.identity;

    /* ── Step 3: apply curve  f(x) = 8 + 92 * x^1.2 → range [8, 100] ── */
    var baseScore = window.applyCurve(compositeRaw);

    /* ── Step 3b: under-18 / student score clamping
       A child/teen cannot fairly be penalised for lacking assets, career,
       or adult social standing. Clamp base score to [55, 70]. ── */
    if (answers['A1'] === 0 || answers['A0'] === 0 || answers['QK1'] === 0 || answers['QK3'] === 0) {
      baseScore = Math.max(55, Math.min(70, baseScore));
    }

    /* ── Step 4: add bonus points (0–50), hard cap at 150 ── */
    var bonusScore = window.computeBonusScore(answerMap);
    /* Restore original QUESTION_BANK */
    window.QUESTION_BANK = _origBank;
    var finalScore = Math.min(150, Math.round(baseScore + bonusScore));

    /* dimPct for display: convert back to 0-100 percentages */
    var dimPctDisplay = {};
    Object.keys(dimPct).forEach(function(d) {
      dimPctDisplay[d] = Math.round(window.applyCurve(dimPct[d]));
    });

    /* dimPctRaw: raw 0-100 percentages (before curve) for breakdown math */
    var dimPctRaw = {};
    Object.keys(dimPct).forEach(function(d) {
      dimPctRaw[d] = Math.round(dimPct[d] * 100);
    });

    try {
      localStorage.setItem('ls_last_score', finalScore);
      var _dateLocale = {'zh-TW':'zh-TW','zh-CN':'zh-CN','en-US':'en-US','en-PH':'en-PH','es-US':'es-US'}[window.I18N_CURRENT] || 'en-US';
      localStorage.setItem('ls_last_date', new Date().toLocaleDateString(_dateLocale));
    } catch(e) {}
    var resultPayload = {
      finalScore:  finalScore,
      baseScore:   Math.round(baseScore),
      bonusScore:  bonusScore,
      dimPct:      dimPctDisplay,
      dimPctRaw:   dimPctRaw,
      answerMap:   answerMap,
      activeQueue: activeQueue.slice(),
      lang:        window.I18N_CURRENT || 'zh-CN',
      quizMode:    window.QUIZ_MODE || 'quick',
      savedAt:     Date.now(),  /* unix ms — used by more-tests.html to compare recency */
    };
    try {
      /* Deep mode result always overwrites quick result */
      sessionStorage.setItem('ls_result', JSON.stringify(resultPayload));
      if (window.QUIZ_MODE === 'deep') {
        localStorage.setItem('ls_result_deep', JSON.stringify(resultPayload));
        /* Also overwrite the quick result key so analysis sees latest */
        localStorage.setItem('ls_result_latest', JSON.stringify(resultPayload));
      } else {
        localStorage.setItem('ls_result_quick', JSON.stringify(resultPayload));
        /* Only write latest if no deep result exists */
        if (!localStorage.getItem('ls_result_deep')) {
          localStorage.setItem('ls_result_latest', JSON.stringify(resultPayload));
        }
      }
    } catch(e) {}

    document.body.style.transition = 'opacity .4s ease';
    document.body.style.opacity    = '0';
    setTimeout(function(){ window.location.href = 'result.html'; }, 420);
  }

  /* ── i18n patch ── */
  function patchI18n() {
    var orig = window.applyI18n;
    window.applyI18n = function(lang) {
      orig(lang);
      if (pages.length > 0) renderPage(currentPage, 0);
    };
  }

  /* ── Keyboard shortcuts ── */
  function setupKeyboard() {
    document.addEventListener('keydown', function(e) {
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 7) {
        var qids = pages[currentPage] || [];
        for (var i = 0; i < qids.length; i++) {
          if (!isAnswered(qids[i])) {
            var q = getQ(qids[i]);
            if (q && n <= q.options.length) {
              if (q.multi) toggleMultiOption(qids[i], n - 1);
              else          selectOption(qids[i], n - 1);
              break;
            }
          }
        }
      }
      if (e.key === 'ArrowRight' && isPageComplete(currentPage) && currentPage < pages.length - 1) {
        if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
        isReviewing = false;
        goToPage(currentPage + 1, 1, true);
      }
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
        isReviewing = true;
        goToPage(currentPage - 1, -1, false);
      }
    });
  }

  /* ── Shared UI setup ── */
  function setupLangSwitcher() {
    var ls = document.getElementById('langSwitcher'); if (!ls) return;
    ls.addEventListener('click', function(e){ e.stopPropagation(); ls.classList.toggle('open'); });
    document.addEventListener('click', function(){ ls.classList.remove('open'); });
    document.querySelectorAll('.lang-option').forEach(function(o) {
      o.addEventListener('click', function(e){
        e.stopPropagation(); window.applyI18n(o.dataset.lang); ls.classList.remove('open');
      });
    });
  }

  function setupParticles() {
    var pc = document.getElementById('particles'); if (!pc) return;
    for (var i = 0; i < 10; i++) {
      var p = document.createElement('div'); p.className = 'particle';
      var s = Math.random() * 6 + 3;
      p.style.cssText = 'width:'+s+'px;height:'+s+'px;left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;--dur:'+(Math.random()*14+8)+'s;--delay:'+(Math.random()*12)+'s;--op:'+(Math.random()*.1+.03).toFixed(2)+';';
      pc.appendChild(p);
    }
  }

  /* ── Init ── */
  function init() {
    cardArea           = document.getElementById('cardArea');
    btnPrev            = document.getElementById('btnPrev');
    btnNext            = document.getElementById('btnNext');
    btnNextLabel       = document.getElementById('btnNextLabel');
    headerFill         = document.getElementById('headerProgressFill');
    headerLabel        = document.getElementById('headerProgressLabel');
    progressCount      = document.getElementById('progressCount');
    sectionLabel       = document.getElementById('sectionLabel');
    sectionDot         = document.getElementById('sectionDot');
    pageDots           = document.getElementById('pageDots');
    pageCompleteBanner = document.getElementById('pageCompleteBanner');

    if (!cardArea) { console.error('quiz.js: #cardArea not found'); return; }

    btnPrev.addEventListener('click', function() {
      if (currentPage > 0) {
        if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
        isReviewing = true;
        goToPage(currentPage - 1, -1, false);
      }
    });
    btnNext.addEventListener('click', function() {
      if (!isPageComplete(currentPage)) return;
      if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
      var isLast  = currentPage === pages.length - 1;
      var allDone = activeQueue.every(function(qid){ return isAnswered(qid); });
      if (isLast && allDone) {
        submitQuiz();
      } else if (!isLast) {
        isReviewing = false;
        goToPage(currentPage + 1, 1, true);
      }
    });

    patchI18n();
    setupKeyboard();
    setupLangSwitcher();
    setupParticles();
    /* Show mode indicator in header */
    var modeBadge = document.getElementById('quizModeBadge');
    if (modeBadge) {
      if (IS_SHORT_MODE) {
        modeBadge.textContent = window.t('quiz.mode.short');
        modeBadge.style.display = 'inline-block';
      } else {
        modeBadge.textContent = window.t('quiz.mode.full');
        modeBadge.style.display = 'inline-block';
      }
    }
    window.applyI18n();
    rebuildQueue();

    if (activeQueue.length === 0) {
      cardArea.innerHTML = '<p style="padding:40px;color:red;text-align:center">题目加载失败，请刷新页面。</p>';
      return;
    }

    /* Page 0 is frozen immediately at init with the baseline question set
       (no answers given yet — all showIf run with empty state).
       frozenPages grows as each page renders, permanently locking it. */
    frozenPages[0] = activeQueue.slice(0, PER_PAGE);
    rebuildQueue(); /* rebuild so pages[] is consistent with frozenPages[0] */

    renderPage(0, 1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
