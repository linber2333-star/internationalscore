/* result.js — comprehensive result display with fixed improve logic + share modal */
(function(){
'use strict';
var CIRC = 2 * Math.PI * 90;
var finalScore, finalScorePrecise, dimPct, dimPctRaw, answerMap, activeQueue, resultLang, baseScore, bonusScore, quizMode;

/* Helper: return the unified question bank */
function getBank(){
  return window.QUESTION_BANK;
}

function loadResult(){
  try{ var r=sessionStorage.getItem('ls_result'); if(r) return JSON.parse(r); }catch(e){}
  try{ var k1=localStorage.getItem('ls_result_latest'); if(k1) return JSON.parse(k1); }catch(e){}
  try{ var k2=localStorage.getItem('ls_result_deep');   if(k2) return JSON.parse(k2); }catch(e){}
  try{ var k3=localStorage.getItem('ls_result_quick');  if(k3) return JSON.parse(k3); }catch(e){}
  return null;
}

/**
 * Grade thresholds for 150-point scale:
 * SSS (≥140), SS (≥125), S (≥110), A (≥90), B (≥75), C (≥60), D (≥40), F (<40)
 */
function getVerdict(s){
  if(s>=140) return'SSS';
  if(s>=125) return'SS';
  if(s>=110) return'S';
  if(s>=90) return'A';
  if(s>=75) return'B';
  if(s>=60) return'C';
  if(s>=40) return'D';
  return'F';
}

/**
 * Percentile rank for 150-point scale.
 * Calibrated so: 60 (baseline) ≈ 50th percentile, 115 ≈ 90th, 140 ≈ 99th
 */
function getRank(s){
  if(s>=140) return Math.max(1, Math.round(1 + (150-s)*0.1));
  if(s>=110) return Math.round(1 + (140-s)*0.3);
  // Sigmoid centered at 75 (midpoint between baseline 60 and target 90)
  var t=(s-75)/25, sig=1/(1+Math.exp(-t));
  return Math.max(1, Math.min(99, Math.round((1-sig)*90 + 5)));
}


/* ── Animate circle ── */
function formatScorePrecise(v){
  /* Format a float to 3 decimal places, but hide trailing zeros
     so "60.000" displays as "60" and "60.500" as "60.5". Keeps
     the UI clean while preserving the 3-decimal precision. */
  if (typeof v !== 'number' || !isFinite(v)) return '0';
  var s = v.toFixed(3);
  // Strip trailing zeros after the decimal, then strip a trailing dot
  s = s.replace(/\.?0+$/, '');
  return s;
}

function animateCircle(){
  var rcFill=document.getElementById('rcFill'), rcScore=document.getElementById('rcScore');
  if(!rcFill||!rcScore) return;
  setTimeout(function(){ rcFill.style.strokeDashoffset=CIRC*(1-Math.min(finalScore,150)/150); },80);
  var dur=2000, t0=null;
  function step(ts){ if(!t0) t0=ts+350; if(ts<t0){ requestAnimationFrame(step); return; }
    var p=Math.min((ts-t0)/dur,1), e=1-Math.pow(1-p,3);
    if (p < 1) {
      /* During animation: round to integer for smooth count-up feel */
      rcScore.textContent = Math.round(e * finalScore);
      requestAnimationFrame(step);
    } else {
      /* Final frame: snap to the precise 3-decimal value */
      rcScore.textContent = formatScorePrecise(finalScorePrecise);
    }
  }
  requestAnimationFrame(step);
}

/* ── Dim bars ── */
var DIM_CONF=[
  {key:'basic',    i18n:'result.dim.basic',    icon:'🧬', color:'#7dd3fc'},
  {key:'social',   i18n:'result.dim.social',   icon:'🏙️', color:'#0ea5e9'},
  {key:'identity', i18n:'result.dim.identity', icon:'💡', color:'#10b981'},
];

/* Professional 3-dimension ability chart */
function containsAny(text, words){
  if(!text) return false;
  return words.some(function(w){ return text.indexOf(w)>=0; });
}
function classifyProDimension(q){
  var id=q.id||'';
  var txt=(q.cn||'')+' '+(q.tw||'');
  if(containsAny(id,['B10','B11','B12','B17','B19','B20','B21','B22','QKB','QKD5','QK33'])) return 'socialAbility';
  if(containsAny(id,['C2','C3','C4','C5','C8','C10','C18','QKD4','QKD6','QKD7','QKD10','BON2'])) return 'creativity';
  if(containsAny(id,['A8','A9','A10','A11','A12','A13','D1','D2','D3','D4','D5','C6','C7','C9','A14','QK14','QK15','QKC3','QKC4','QKC5','QKD8'])) return 'wellbeing';
  if(containsAny(txt,['关系','社交','父母','家庭','信任','人脉','關係','社交'])) return 'socialAbility';
  if(containsAny(txt,['创新','创造','技能','想法','学习','創新','創造','學習'])) return 'creativity';
  if(containsAny(txt,['健康','睡眠','体能','情绪','压力','幸福','健康','睡眠','情緒'])) return 'wellbeing';
  return null;
}
function computeProfessionalDims(){
  var out={socialAbility:0,creativity:0,wellbeing:0};
  var accum={
    socialAbility:{sum:0,max:0},
    creativity:{sum:0,max:0},
    wellbeing:{sum:0,max:0},
  };
  getBank().forEach(function(q){
    if(!q.scorable||q.bonus||q.multi||!answerMap[q.id]) return;
    var dim=classifyProDimension(q);
    if(!dim) return;
    var oi=answerMap[q.id].questionIdx;
    var opt=q.options[oi];
    if(!opt) return;
    var maxScore=Math.max.apply(null,q.options.map(function(o){return o.score||0;}));
    accum[dim].sum+=(opt.score||0);
    accum[dim].max+=Math.max(1,maxScore);
  });
  Object.keys(out).forEach(function(k){
    out[k]=accum[k].max>0?Math.round(accum[k].sum/accum[k].max*100):0;
  });
  return out;
}
function tier(s,lang){
  var t=lang==='zh-TW'?['待提升','發展中','尚可','良好','優秀','卓越']:['待提升','发展中','尚可','良好','优秀','卓越'];
  if(s<17)return t[0]; if(s<34)return t[1]; if(s<50)return t[2]; if(s<67)return t[3]; if(s<84)return t[4]; return t[5];
}
/* Visual-satiety curve — maps a raw 0-100 score to a "visual width" so the
   neon ray reaches close to the right edge even at moderate scores. The
   raw numeric label is still shown unchanged; only the bar's CSS width
   uses this transformed value.
     raw 0   → 0%
     raw 20  → ~52%
     raw 40  → ~69%
     raw 60  → ~81%
     raw 80  → ~91%
     raw 100 → 100%
   Power curve x^0.4 — gentle climb at the top, no false fullness at zero. */
function visualPct(score){
  var s = Math.max(0, Math.min(100, +score || 0));
  if(s <= 0) return 0;
  return Math.min(100, Math.pow(s/100, 0.4) * 100);
}
function buildDims(lang){
  var c=document.getElementById('dimRows'); if(!c) return; c.innerHTML='';
  DIM_CONF.forEach(function(d){
    var score=dimPct&&dimPct[d.key]!=null?dimPct[d.key]:0;
    var vw = visualPct(score);
    var row=document.createElement('div'); row.className='dim-row';
    row.innerHTML='<div class="dim-meta"><span class="dim-name"><span class="dim-icon">'+d.icon+'</span><span data-i18n="'+d.i18n+'">'+window.t(d.i18n)+'</span></span>'+
      '<span class="dim-score-val" style="color:'+d.color+'">'+score+'</span></div>'+
      '<div class="dim-track"><div class="dim-fill" data-vw="'+vw+'" style="width:0;--dim-color:'+d.color+';background:linear-gradient(to right, transparent, '+d.color+');"></div></div>';
    c.appendChild(row);
  });
  setTimeout(function(){ document.querySelectorAll('.dim-fill').forEach(function(f){ f.style.width=f.dataset.vw+'%'; }); },600);
}

/* ── Score breakdown ── */
function buildBreakdown(){
  var el=document.getElementById('scoreBreakdown'); if(!el) return;
  var lang=window.I18N_CURRENT||'zh-CN';
  /* Compute raw weighted contributions and scale proportionally to baseScore
     so the displayed numbers always add up correctly */
  var rawContribs={}, rawTotal=0;
  DIM_CONF.forEach(function(d){
    var s=dimPct&&dimPct[d.key]!=null?dimPct[d.key]:0;
    var w=window.DIM_WEIGHTS[d.key];
    rawContribs[d.key]=s*w;
    rawTotal+=s*w;
  });
  var rows=DIM_CONF.map(function(d){
    var s=dimPct&&dimPct[d.key]!=null?dimPct[d.key]:0, w=window.DIM_WEIGHTS[d.key];
    var contrib=rawTotal>0?Math.round(rawContribs[d.key]/rawTotal*baseScore):0;
    return '<div class="breakdown-row"><span class="br-icon">'+d.icon+'</span>'+
      '<span class="br-name">'+window.t(d.i18n)+'</span>'+
      '<span class="br-score">'+s+'</span><span class="br-x">×</span>'+
      '<span class="br-weight">'+(w*100).toFixed(0)+'%</span><span class="br-eq">=</span>'+
      '<span class="br-contrib">'+contrib+'</span></div>';
  }).join('');
  var bonusRow='';
  if(bonusScore>0){
    bonusRow='<div class="breakdown-row"><span class="br-icon">⭐</span>'+
      '<span class="br-name">'+(lang==='zh-TW'?'加分題':'加分题')+'</span>'+
      '<span class="br-score"></span><span class="br-x"></span>'+
      '<span class="br-weight"></span><span class="br-eq"></span>'+
      '<span class="br-contrib">+'+bonusScore+'</span></div>';
  }
  el.innerHTML='<div class="breakdown-grid">'+rows+bonusRow+
    '<div class="breakdown-total"><span>'+(lang==='zh-TW'?'綜合分數':'综合分数')+'</span><span class="bt-score">'+formatScorePrecise(finalScorePrecise)+'</span></div></div>';
}

/* ── Highlights ── */
var SECTION_COLORS={basic:'#7dd3fc',social:'#0ea5e9',identity:'#10b981'};
function buildHighlights(lang){
  var c=document.getElementById('highlightRows'); if(!c||!answerMap) return; c.innerHTML='';
  var AGE_IDS = new Set(['A1','QK1','QKD13','QKC6','QKB3','QKT5','QKT1']);
  var scored=[];
  getBank().forEach(function(q){
    if(!q.scorable||!answerMap[q.id]) return;
    if(AGE_IDS.has(q.id)) return;
    var oi=answerMap[q.id].questionIdx, opt=q.options[oi];
    if(opt&&opt.score>=3) scored.push({q:q, score:opt.score, oi:oi, opt:opt});
  });
  scored.sort(function(a,b){ return b.score-a.score; });
  var top=scored.slice(0,4);
  if(!top.length){ c.innerHTML='<div class="empty-note">'+(lang==='zh-TW'?'繼續努力，亮點正在積累中。':'继续努力，亮点正在积累中。')+'</div>'; return; }
  top.forEach(function(item){
    var row=document.createElement('div'); row.className='highlight-row';
    var qText=lang==='zh-TW'?item.q.tw:item.q.cn;
    var oText=answerMap[item.q.id].optionText_cn; if(lang==='zh-TW') oText=answerMap[item.q.id].optionText_tw;
    var mc=SECTION_COLORS[item.q.section]||'#7dd3fc';
    row.innerHTML='<div class="hl-score-dot" style="background:'+mc+'">'+item.score*25+'<small>分</small></div>'+
      '<div class="hl-content"><div class="hl-q">'+qText+'</div><div class="hl-a">'+oText+'</div></div>'+
      '<div class="hl-stars">'+starHtml(item.score)+'</div>';
    c.appendChild(row);
  });
}

/* ── Improvement areas ──────────────────────────────────────────
   PRINCIPLES:
   1. Skip noImprove / improve:false / scorable:false / multi / bonus
   2. "Next step" = the option ONE score-level above the current one
      (incremental realism — never jumps to the theoretical maximum)
   3. Special bracket logic for B4 (net worth, 15 tiers): the next-step
      target is always only 1-2 brackets above the current one, never
      the maximum. A user at 5000-10000 yuan sees "10k-25k" not "1 billion+".
   4. Every question has a tailored, actionable ADVICE string.
──────────────────────────────────────────────────────────────── */
function buildImprovements(lang){
  var c=document.getElementById('improveRows'); if(!c||!answerMap) return; c.innerHTML='';
  var UNCONTROLLABLE_IDS = new Set(['A1','A3h','A3hf','QK1','QK4m','QK4f','QK5m','QK5f','A4','QKC8','QKD13','QKC6','QKB3','QKT5','QKT1']);

  /* Advice texts — cn/tw pairs per question ID */
  var ADVICE={
    /* ── Basic / Health ── */
    A3:{
      cn:'体型改善不靠意志力，靠系统。本周只做一件事：把每天的主食量减少1/4，并增加一次30分钟以上的快走。6周后重新评估。',
      tw:'體型改善不靠意志力，靠系統。本週只做一件事：把每天的主食量減少1/4，並增加一次30分鐘以上的快走。6週後重新評估。',
    },
    A6:{
      cn:'提升学历不一定要全日制——在职研究生、行业认证（PMP/CPA/CFA等）投入产出比更高，且不耽误收入。先研究你行业的"含金量最高"证书。',
      tw:'提升學歷不一定要全日制——在職研究生、行業認證（PMP/CPA/CFA等）投入產出比更高，且不耽誤收入。先研究你行業的「含金量最高」證書。',
    },
    A8:{
      cn:'做一次全面体检，拿到基线数据。90%的早期慢性问题可以通过改善睡眠、饮食和运动在6个月内逆转，代价远低于日后治疗。',
      tw:'做一次全面體檢，拿到基線數據。90%的早期慢性問題可以通過改善睡眠、飲食和運動在6個月內逆轉，代價遠低於日後治療。',
    },
    A9:{
      cn:'睡眠最快的改善方法：固定"起床时间"（哪怕周末），不固定入睡时间。同时，睡前90分钟不看任何发光屏幕。坚持2周后会有明显变化。',
      tw:'睡眠最快的改善方法：固定「起床時間」（哪怕週末），不固定入睡時間。同時，睡前90分鐘不看任何發光螢幕。堅持2週後會有明顯變化。',
    },
    A10:{
      cn:'运动的最大障碍不是时间，而是"启动阻力"。解法：把运动装备放在最显眼的地方，把运动时间预约进日历，像对待重要会议一样执行。',
      tw:'運動的最大障礙不是時間，而是「啟動阻力」。解法：把運動裝備放在最顯眼的地方，把運動時間預約進日曆，像對待重要會議一樣執行。',
    },
    A12:{
      cn:'不需要完美饮食——从减少一类高风险食物开始（通常是含糖饮料或外卖油炸食品）。每减少一类，坚持30天，再加下一类。',
      tw:'不需要完美飲食——從減少一類高風險食物開始（通常是含糖飲料或外賣油炸食品）。每減少一類，堅持30天，再加下一類。',
    },
    A13:{
      cn:'慢性疼痛往往是姿势或肌肉失衡造成的，不是"忍忍就好"。优先：预约一次骨科或物理治疗评估（费用几百元），找到根本原因。',
      tw:'慢性疼痛往往是姿勢或肌肉失衡造成的，不是「忍忍就好」。優先：預約一次骨科或物理治療評估（費用幾百元），找到根本原因。',
    },
    A14s:{
      cn:'如果学业压力持续影响你的睡眠或情绪超过2周，这已经是需要关注的信号。你的学校心理中心是免费资源，预约一次谈话不会有任何损失。',
      tw:'如果學業壓力持續影響你的睡眠或情緒超過2週，這已經是需要關注的信號。你的學校心理中心是免費資源，預約一次談話不會有任何損失。',
    },
    A14w:{
      cn:'工作压力的根源通常是"界限不清"。这周试验一件事：确定一个每天的"工作截止时间"，超过这个时间不看工作消息，执行7天后评估影响。',
      tw:'工作壓力的根源通常是「界限不清」。這週試驗一件事：確定一個每天的「工作截止時間」，超過這個時間不看工作消息，執行7天後評估影響。',
    },
    /* A14 is the merged dynamic question — same advice keys work via A14s/A14w lookup */
    A14:{
      cn:'工作/学业压力的根源通常是"界限不清"或"节奏失控"。这周试验一件事：确定一个每天的"停工时间"，超过这个时间不看任何相关信息，执行7天后评估影响。',
      tw:'工作/學業壓力的根源通常是「界限不清」或「節奏失控」。這週試驗一件事：確定一個每天的「停工時間」，超過這個時間不看任何相關信息，執行7天後評估影響。',
    },
    /* ── Location / Environment ── */
    A4:{
      cn:'出生环境不可改变，但当前环境可以选择。如果城市层级是你关注的成长瓶颈，可以制定一个"向更高层级城市迁移"的3年计划：技能积累→机会探索→决策执行。',
      tw:'出生環境不可改變，但當前環境可以選擇。如果城市層級是你關注的成長瓶頸，可以制定一個「向更高層級城市遷移」的3年計劃：技能積累→機會探索→決策執行。',
    },
    A5:{
      cn:'居住地对收入上限、机会密度和社交圈质量有直接影响。如果你考虑迁移到更大城市，最低成本路径是：先在当前城市积累可迁移的技能和人脉，再在目标城市找到第一份工作，而非裸辞后再找。',
      tw:'居住地對收入上限、機會密度和社交圈質量有直接影響。如果你考慮遷移到更大城市，最低成本路徑是：先在當前城市積累可遷移的技能和人脈，再在目標城市找到第一份工作，而非裸辭後再找。',
    },
    /* ── Intimate / Gender ── */
    G10:{
      cn:'安全感建立在一致性上——对方稳定、可预期的行为比激烈的情感表达更有效。如果安全感不足，和伴侣做一次"期望值对话"：我希望你在_____时做_____。',
      tw:'安全感建立在一致性上——對方穩定、可預期的行為比激烈的情感表達更有效。如果安全感不足，和伴侶做一次「期望值對話」：我希望你在_____時做_____。',
    },
    G11:{
      cn:'性生活满意度通常折射关系中更深层的连接质量。改善的起点不是技术层面，而是增加非性关系时的亲密感——身体接触、情感共鸣、共同经历。',
      tw:'性生活滿意度通常折射關係中更深層的連接質量。改善的起點不是技術層面，而是增加非性關係時的親密感——身體接觸、情感共鳴、共同經歷。',
    },
    G12:{
      cn:'外部压力对关系的伤害通常是间接的——它让双方都精疲力竭，从而缺乏耐心和亲密感。建立一个"关系保护时间"：每周至少一次，专门用于两个人，禁止谈论外部压力来源。',
      tw:'外部壓力對關係的傷害通常是間接的——它讓雙方都精疲力竭，從而缺乏耐心和親密感。建立一個「關係保護時間」：每週至少一次，專門用於兩個人，禁止談論外部壓力來源。',
    },
    G14:{
      cn:'建立亲密关系的障碍通常是可以系统解决的。最常见的三个：① 社交圈太小→主动拓展认识异性的场景；② 自信不足→从小行动积累证据；③ 没时间→先把它列为优先项，而非等其他事情都顺了再说。',
      tw:'建立親密關係的障礙通常是可以系統解決的。最常見的三個：① 社交圈太小→主動拓展認識異性的場景；② 自信不足→從小行動積累證據；③ 沒時間→先把它列為優先項，而非等其他事情都順了再說。',
    },
    BON_Y1:{
      cn:'竞赛获奖是结果，而非目标。真正重要的是：你在准备过程中是否形成了"系统性解决难题"的能力？这种元能力比任何奖项都有价值，它会在你余生中持续复利。',
      tw:'競賽獲獎是結果，而非目標。真正重要的是：你在準備過程中是否形成了「系統性解決難題」的能力？這種元能力比任何獎項都有價值，它會在你餘生中持續複利。',
    },
    BON_Y2:{
      cn:'独立项目的价值在于"自主创造"的体验——这会让你形成"我能做出有意义的东西"的底层信念。不要等条件成熟，找到你最感兴趣的方向，用最小可行的方式开始第一个项目。',
      tw:'獨立項目的價值在於「自主創造」的體驗——這會讓你形成「我能做出有意義的東西」的底層信念。不要等條件成熟，找到你最感興趣的方向，用最小可行的方式開始第一個項目。',
    },
    A15:{
      cn:'职业领域难短期切换，但技能可以叠加。在现有领域找到高价值的相邻方向（如行政→数据分析，服务业→用户体验）并深耕，是成本最低的路径。',
      tw:'職業領域難短期切換，但技能可以疊加。在現有領域找到高價值的相鄰方向並深耕，是成本最低的路徑。',
    },
    /* ── Social / Career ── */
    B1s:{
      cn:'晋升的关键不是"等待机会"，而是"提前做下一个职级的事"。今天就和你的直属上司约一次15分钟的对话：问他/她"我需要在哪些方面提升才能晋升？"',
      tw:'晉升的關鍵不是「等待機會」，而是「提前做下一個職級的事」。今天就和你的直屬上司約一次15分鐘的對話：問他/她「我需要在哪些方面提升才能晉升？」',
    },
    B3:{
      cn:'收入提升最快的两条路：① 在现工作中承担更高价值任务并争取加薪（谈薪成功率在准备充分时超过60%）；② 开始面试，了解自己的市场定价。两条路同时走。',
      tw:'收入提升最快的兩條路：① 在現工作中承擔更高價值任務並爭取加薪（談薪成功率在準備充分時超過60%）；② 開始面試，了解自己的市場定價。兩條路同時走。',
    },
    B3c:{
      cn:'自营/创业的月利润是检验商业模式的核心指标。如果长期亏损，优先问：每个客户带来的收入是否覆盖了服务成本（包括你的时间）？不能覆盖就要调整定价或精简业务线。',
      tw:'自營/創業的月利潤是檢驗商業模式的核心指標。如果長期虧損，優先問：每個客戶帶來的收入是否覆蓋了服務成本（包括你的時間）？不能覆蓋就要調整定價或精簡業務線。',
    },
    B3b:{
      cn:'建立第二收入来源最快的方式：把你现有的技能变成可销售的服务。找到5个可能付钱的潜在客户，给他们发一个简短的提案——哪怕只成功1个。',
      tw:'建立第二收入來源最快的方式：把你現有的技能變成可銷售的服務。找到5個可能付錢的潛在客戶，給他們發一個簡短的提案——哪怕只成功1個。',
    },
    B4b:{
      cn:'应急储备的建立方式：从下月薪资日起，自动转走固定金额（哪怕500元）到一个单独账户，命名为"紧急备用金"，设置无法随意取用的规则。',
      tw:'應急儲備的建立方式：從下月薪資日起，自動轉走固定金額（哪怕500元）到一個單獨帳戶，命名為「緊急備用金」，設置無法隨意取用的規則。',
    },
    B4c:{
      cn:'有多种负债时，用"雪球法"：先还利率最高的（信用卡>消费贷>房贷），每还清一项，把那笔钱全部加速还下一项。这是数学上最快的方式。',
      tw:'有多種負債時，用「雪球法」：先還利率最高的（信用卡>消費貸>房貸），每還清一項，把那筆錢全部加速還下一項。這是數學上最快的方式。',
    },
    B4e:{
      cn:'闲置资金放货币基金是第一步，不是终点。在应急储备到位后（3-6个月生活费），把额外的积蓄设置为每月定投宽基指数基金——门槛100元。',
      tw:'閒置資金放貨幣基金是第一步，不是終點。在應急儲備到位後（3-6個月生活費），把額外的積蓄設置為每月定投寬基指數基金——門檻100元。',
    },
    B4f:{
      cn:'投资亏损常源于两个错误：追求短期涨跌，和押注单一资产。解法很简单：指数基金+每月定投+5年不动，历史上这个组合的正收益概率超过90%。',
      tw:'投資虧損常源於兩個錯誤：追求短期漲跌，和押注單一資產。解法：指數基金+每月定投+5年不動，歷史上這個組合的正收益概率超過90%。',
    },
    B4g:{
      cn:'优先购买百万医疗险（年保费通常几百元，可住院报销）+意外险（年保费几十元）。这两项最便宜且最必要，能保护你的积累不被一次医疗事故清零。',
      tw:'優先購買百萬醫療險（年保費通常幾百元，可住院報銷）+意外險（年保費幾十元）。這兩項最便宜且最必要，能保護你的積累不被一次醫療事故清零。',
    },
    B5:{
      cn:'改善伴侣关系最有效的小行动：每周安排一次不看手机、不谈工作/钱的"两人专属时光"（哪怕只是散步30分钟），连续4周，关系质量会有可见变化。',
      tw:'改善伴侶關係最有效的小行動：每週安排一次不看手機、不談工作/錢的「兩人專屬時光」，連續4週，關係質量會有可見變化。',
    },
    B7:{
      cn:'增加可变现技能最快的路径：选一个和现有技能相邻、市场需求明确的方向，用3个月集中学习并输出1个可展示的成果（项目/文章/案例）。',
      tw:'增加可變現技能最快的路徑：選一個和現有技能相鄰、市場需求明確的方向，用3個月集中學習並輸出1個可展示的成果（項目/文章/案例）。',
    },
    B8:{
      cn:'外语能力最快的提升方法：每天30分钟"影子跟读法"——找一段你喜欢的外语音频，跟着大声重复，不追求理解。坚持90天，口语会有质变。',
      tw:'外語能力最快的提升方法：每天30分鐘「影子跟讀法」——找一段你喜歡的外語音頻，跟著大聲重複，不追求理解。堅持90天，口語會有質變。',
    },
    B9:{
      cn:'旅行的本质是打开认知边界。每年安排1次真正的"慢旅行"（在一个地方停留超过5天，和当地人互动）。它带来的思维重置，是任何培训课都无法替代的。',
      tw:'旅行的本質是打開認知邊界。每年安排1次真正的「慢旅行」（在一個地方停留超過5天，和當地人互動）。它帶來的思維重置，是任何培訓課都無法替代的。',
    },
    B10:{
      cn:'社交圈质量的提升来自你的投入质量。本月选3个你真正尊重的人，主动联系并"给"他们一些具体的价值（资讯/介绍/帮助），而非只是闲聊。',
      tw:'社交圈質量的提升來自你的投入質量。本月選3個你真正尊重的人，主動聯繫並「給」他們一些具體的價值（資訊/介紹/幫助），而非只是閒聊。',
    },
    B11:{
      cn:'建立声誉最快的方式：在你所在领域，每月系统输出一篇高质量的专业内容（文章/演讲/案例复盘）。6个月后，你在这个领域的"可见度"会发生根本变化。',
      tw:'建立聲譽最快的方式：在你所在領域，每月系統輸出一篇高質量的專業內容（文章/演講/案例復盤）。6個月後，你在這個領域的「可見度」會發生根本變化。',
    },
    B14:{
      cn:'改善居住条件的关键是建立专属储蓄：创建一个独立账户，设定月存金额，计算距目标首付还需多少个月。明确的时间表是最强的动力来源。',
      tw:'改善居住條件的關鍵是建立專屬儲蓄：創建一個獨立帳戶，設定月存金額，計算距目標首付還需多少個月。明確的時間表是最強的動力來源。',
    },
    B15:{
      cn:'才艺不仅是消遣，它是社交圈和个人标签的重要组成。选一个你有兴趣且可以在3个月内有所成果的方向（乐器/绘画/武术/编程），报班系统学，完成第一个作品。',
      tw:'才藝不僅是消遣，它是社交圈和個人標籤的重要組成。選一個你有興趣且可以在3個月內有所成果的方向，報班系統學，完成第一個作品。',
    },
    B16:{
      cn:'个人自由时间是被严重低估的资产。评估你的日程中哪些"必须做"实际上可以优化、外包或取消。通常每天都有至少30分钟被低价值任务消耗。',
      tw:'個人自由時間是被嚴重低估的資產。評估你的日程中哪些「必須做」實際上可以優化、外包或取消。通常每天都有至少30分鐘被低價值任務消耗。',
    },
    B17:{
      cn:'改善与父母关系最有效的行动：主动分享你的生活（哪怕是日常小事），问他们的近况，不等他们先联系你。每周一条消息，持续改变关系温度。',
      tw:'改善與父母關係最有效的行動：主動分享你的生活（哪怕是日常小事），問他們的近況，不等他們先聯繫你。每週一條消息，持續改變關係溫度。',
    },
    B18:{
      cn:'个人品牌从"有稳定输出"开始。选1个平台，每周发布1篇高质量内容（哪怕只有500字），坚持6个月，然后根据数据决定是否扩张。',
      tw:'個人品牌從「有穩定輸出」開始。選1個平台，每週發布1篇高質量內容（哪怕只有500字），堅持6個月，然後根據數據決定是否擴張。',
    },
    B19:{
      cn:'如果缺乏可倾诉的家人，这是一个需要正视的缺口。短期解法：找一个可以深度交流的朋友。长期解法：主动投入时间修复或建立家庭连接——先迈出那一步。',
      tw:'如果缺乏可傾訴的家人，這是一個需要正視的缺口。短期解法：找一個可以深度交流的朋友。長期解法：主動投入時間修復或建立家庭連接——先邁出那一步。',
    },
    B20:{
      cn:'友谊需要主动。如果你习惯等待，试着本周主动发起一次真实的聚会或通话——大多数情况下对方也在等你先联系。',
      tw:'友誼需要主動。如果你習慣等待，試著本週主動發起一次真實的聚會或通話——大多數情況下對方也在等你先聯繫。',
    },
    B21:{
      cn:'人际印象可以刻意改善。最快的方法：在接下来的每次对话中专注做一件事——"主动倾听"（不打断，给出反馈）。练习2周，效果立竿见影。',
      tw:'人際印象可以刻意改善。最快的方法：在接下來的每次對話中專注做一件事——「主動傾聽」（不打斷，給出反饋）。練習2週，效果立竿見影。',
    },
    /* ── Identity ── */
    C1:{
      cn:'价值观不清晰的代价是：每次面对重要决策都要从头想。花1小时写下你最骄傲的3个人生时刻+最后悔的3个决定。你的价值观就藏在里面。',
      tw:'價值觀不清晰的代價是：每次面對重要決策都要從頭想。花1小時寫下你最驕傲的3個人生時刻+最後悔的3個決定。你的價值觀就藏在裡面。',
    },
    C3:{
      cn:'目标不清晰的解法不是"想更清楚"，而是"行动来验证"。今天把你目前最模糊的方向写下来，然后在接下来30天里进行3次相关的实际行动，让现实给你反馈。',
      tw:'目標不清晰的解法不是「想更清楚」，而是「行動來驗證」。今天把你目前最模糊的方向寫下來，然後在接下來30天裡進行3次相關的實際行動，讓現實給你反饋。',
    },
    C5:{
      cn:'创造力是可以训练的肌肉。每天用5分钟做一件事：写下3个"如果...会怎样"的想法，不评判好坏，只是记录。坚持30天后你会发现思维方式在悄悄改变。',
      tw:'創造力是可以訓練的肌肉。每天用5分鐘做一件事：寫下3個「如果...會怎樣」的想法，不評判好壞，只是記錄。堅持30天後你會發現思維方式在悄悄改變。',
    },
    C6:{
      cn:'对生活状态不满时，先区分：是"外部条件不够"还是"内在状态出了问题"？两者的解法完全不同。前者需要改变行动，后者需要改变认知框架。',
      tw:'對生活狀態不滿時，先區分：是「外部條件不夠」還是「內在狀態出了問題」？兩者的解法完全不同。前者需要改變行動，後者需要改變認知框架。',
    },
    C7:{
      cn:'情绪韧性是可以通过练习提升的。从今天开始，每当出现强烈负面情绪，先做"10秒暂停"——深呼吸，暂不反应。这个简单的习惯会在3个月内显著改变你的情绪模式。',
      tw:'情緒韌性是可以通過練習提升的。從今天開始，每當出現強烈負面情緒，先做「10秒暫停」——深呼吸，暫不反應。這個簡單的習慣會在3個月內顯著改變你的情緒模式。',
    },
    C8:{
      cn:'建立阅读习惯最简单的方法：把阅读绑定到一个已有习惯（如通勤或吃午饭），在那个时间段只做阅读，不刷手机。每天20分钟，一年大约是15本书。',
      tw:'建立閱讀習慣最簡單的方法：把閱讀綁定到一個已有習慣（如通勤或吃午飯），在那個時間段只做閱讀，不刷手機。每天20分鐘，一年大約是15本書。',
    },
    C9:{
      cn:'信心来自证据，不来自自我暗示。选一件你一直想做但没有行动的事，今天做第一个最小可行步骤（可以只需要5分钟）。每一个完成的行动都是信心的燃料。',
      tw:'信心來自證據，不來自自我暗示。選一件你一直想做但沒有行動的事，今天做第一個最小可行步驟（可以只需要5分鐘）。每一個完成的行動都是信心的燃料。',
    },
    C10:{
      cn:'决策独立性来自信息积累。对于你近期最纠结的一个决定，花时间做独立调研（而非只听他人意见），然后记录下你自己的分析过程——即使最终决策一样，过程会让你越来越独立。',
      tw:'決策獨立性來自資訊積累。對於你近期最糾結的一個決定，花時間做獨立調研，記錄下你自己的分析過程——即使最終決策一樣，過程會讓你越來越獨立。',
    },
    C15:{
      cn:'坚持的关键是降低"启动阻力"，而非依赖意志力。把你想坚持的事缩减到"每天只要做5分钟"。不是"我要每天跑步"，而是"我要穿上跑鞋出门"。',
      tw:'堅持的關鍵是降低「啟動阻力」，而非依賴意志力。把你想堅持的事縮減到「每天只要做5分鐘」。不是「我要每天跑步」，而是「我要穿上跑鞋出門」。',
    },
    C18:{
      cn:'核心竞争力的培养需要先"定方向"：你想在什么领域让别人第一时间想到你？先定方向，再用每天30分钟系统投入。没有方向的努力是低效的。',
      tw:'核心競爭力的培養需要先「定方向」：你想在什麼領域讓別人第一時間想到你？先定方向，再用每天30分鐘系統投入。沒有方向的努力是低效的。',
    },
    C19:{
      cn:'生活主动性是可以刻意练习的。这周，在一个以前习惯随他人安排的场合里，主动提出你自己的意见或选择。每一次主动都是重写你的行为默认模式。',
      tw:'生活主動性是可以刻意練習的。這週，在一個以前習慣隨他人安排的場合裡，主動提出你自己的意見或選擇。每一次主動都是重寫你的行為默認模式。',
    },
    /* ── Health deep-dive ── */
    D1:{
      cn:'体检是最高性价比的健康投资。如果距上次体检超过2年，本周就预约——许多疾病在早期发现的治疗成本是晚期的1/10到1/100。',
      tw:'體檢是最高性價比的健康投資。如果距上次體檢超過2年，本週就預約——許多疾病在早期發現的治療成本是晚期的1/10到1/100。',
    },
    D3:{
      cn:'长期低精力往往不是"懒"，而是睡眠质量差、营养不足、久坐或慢性压力导致的。从今天开始，优先排查其中最可能的一个原因并做一项改变。',
      tw:'長期低精力往往不是「懶」，而是睡眠質量差、營養不足、久坐或慢性壓力導致的。從今天開始，優先排查其中最可能的一個原因並做一項改變。',
    },
    D4:{
      cn:'心理健康管理不等于"去看医生"。最低门槛的起点：每天睡前写3句日记（今天发生了什么 / 我有什么感受 / 明天我想做什么）。坚持2周，你会更了解自己。',
      tw:'心理健康管理不等於「去看醫生」。最低門檻的起點：每天睡前寫3句日記（今天發生了什麼 / 我有什麼感受 / 明天我想做什麼）。堅持2週，你會更了解自己。',
    },
    D5:{
      cn:'体能改善的最低门槛不是健身房，而是每天多走路。目标：每天7000步，持续4周，精力水平和情绪稳定性都会有可见变化。',
      tw:'體能改善的最低門檻不是健身房，而是每天多走路。目標：每天7000步，持續4週，精力水平和情緒穩定性都會有可見變化。',
    },
    /* ── Work ── */
    E1:{
      cn:'工作时长过长通常是"优先级不清晰"或"界限不清"的症状，而非勤劳。这周做一件事：列出今天所有任务，只保留真正重要的前3项，其余推迟或委托。',
      tw:'工作時長過長通常是「優先級不清晰」或「界限不清」的症狀，而非勤勞。這週做一件事：列出今天所有任務，只保留真正重要的前3項，其餘推遲或委託。',
    },
    E3:{
      cn:'工作生活平衡首先要"画边界"。这周确定一个"工作截止时间"并严格执行——超过这个时间不回任何工作消息，连续执行一周，观察工作是否因此受损（通常不会）。',
      tw:'工作生活平衡首先要「畫邊界」。這週確定一個「工作截止時間」並嚴格執行——超過這個時間不回任何工作消息，連續執行一週，觀察工作是否因此受損（通常不會）。',
    },
    E4:{
      cn:'手机通知是个人时间的最大杀手。今晚就设置：工作消息在下班后不震动（iOS"专注模式"/Android"勿扰模式"），手机放到卧室外充电。执行一周，评估睡眠质量变化。',
      tw:'手機通知是個人時間的最大殺手。今晚就設置：工作消息在下班後不震動，手機放到臥室外充電。執行一週，評估睡眠質量變化。',
    },
    /* ── Student ── */
    F1:{
      cn:'成绩提升的核心是"找到低效点"——你的分数主要输在哪几门课/哪类题型？先集中突破最弱的1门，比全面改进快得多。用一个月做这一件事。',
      tw:'成績提升的核心是「找到低效點」——你的分數主要輸在哪幾門課/哪類題型？先集中突破最弱的1門，比全面改進快得多。用一個月做這一件事。',
    },
    F3:{
      cn:'实习经历的价值远大于大多数课程。大一/大二就开始投递，哪怕是中小公司的短期实习，都会让你的简历和视野发生质变——而且越早投越容易拿到机会。',
      tw:'實習經歷的價值遠大於大多數課程。大一/大二就開始投遞，哪怕是中小公司的短期實習，都會讓你的簡歷和視野發生質變——而且越早投越容易拿到機會。',
    },
    F6:{
      cn:'方向不清晰时，行动是最快的解药。接下来30天：进行3次"信息性访谈"——找3个在你感兴趣方向工作的人，请他们喝咖啡聊1小时，问他们的真实经历。',
      tw:'方向不清晰時，行動是最快的解藥。接下來30天：進行3次「信息性訪談」——找3個在你感興趣方向工作的人，請他們喝咖啡聊1小時，問他們的真實經歷。',
    },
  };

  /* ── B4 专属次步逻辑：一次只进一个档位 ──
     不使用通用的 getNextStep，而是用专门的逻辑
     B4 oi 0-14: 每次只推进1档 */
  function getB4NextStep(oi, lang) {
    var QB=getBank();
    var q=QB.find(function(q){return q.id==='B4';});
    if(!q) return null;
    var maxOi=q.options.length-1;
    /* 已在最高档 */
    if(oi>=maxOi) return null;
    /* 向上一档 */
    var nextOi=oi+1;
    /* 如果当前和下一档分数相同，再往上 */
    while(nextOi<maxOi && q.options[nextOi].score===q.options[oi].score) nextOi++;
    var nextOpt=q.options[nextOi];
    if(!nextOpt) return null;
    var nextText=lang==='zh-TW'?nextOpt.tw:nextOpt.cn;

    /* 每档专属建议 */
    var adviceMap={
      0:{cn:'第一步是止血：清点所有负债，按利率排序，优先偿还信用卡和消费贷。暂缓任何投资，先建立1个月的最低应急储备。',
         tw:'第一步是止血：清點所有負債，按利率排序，優先償還信用卡和消費貸。暫緩任何投資，先建立1個月的最低應急儲備。'},
      1:{cn:'从0到有：本月建立"先存后花"反射——发薪后立即转走10%（哪怕100元）到独立账户，命名为"未来基金"，不动它。',
         tw:'從0到有：本月建立「先存後花」反射——發薪後立即轉走10%（哪怕100元）到獨立帳戶，命名為「未來基金」，不動它。'},
      2:{cn:'积累早期的关键是提高储蓄率，而非投资收益率。目标：把每月结余提高到收入的15%以上，同时消除最主要的1项不必要支出。',
         tw:'積累早期的關鍵是提高儲蓄率，而非投資收益率。目標：把每月結餘提高到收入的15%以上，同時消除最主要的1項不必要支出。'},
      3:{cn:'到1万元后，建立应急储备（3个月生活费放货币基金），余量开始定投宽基指数基金，门槛低、长期稳健。',
         tw:'到1萬元後，建立應急儲備（3個月生活費放貨幣基金），餘量開始定投寬基指數基金，門檻低、長期穩健。'},
      4:{cn:'2万到10万阶段：应急储备到位后，考虑增加储蓄率到20%+。同时了解你可用的税优账户（个人养老金等）。',
         tw:'2萬到10萬階段：應急儲備到位後，考慮增加儲蓄率到20%+。同時了解你可用的稅優帳戶（個人養老金等）。'},
      5:{cn:'10万到25万：这个阶段可以开始考虑资产配置——货币基金应急+股票型基金长期增值+保险保障。不要把所有钱放在一个篮子里。',
         tw:'10萬到25萬：這個階段可以開始考慮資產配置——貨幣基金應急+股票型基金長期增值+保險保障。不要把所有錢放在一個籃子裡。'},
      6:{cn:'25万到50万：评估房产是否在你的计划中。如果是，计算距目标首付还需多少月并制定计划；如果不是，开始建立正式的投资组合框架。',
         tw:'25萬到50萬：評估房產是否在你的計劃中。如果是，計算距目標首付還需多少月並制定計劃；如果不是，開始建立正式的投資組合框架。'},
      7:{cn:'50万到100万：购买足额寿险和重疾险，保护已有积累不被意外医疗清零。同时评估资产结构：现金/基金/房产的比例是否合理？',
         tw:'50萬到100萬：購買足額壽險和重疾險，保護已有積累不被意外醫療清零。同時評估資產結構：現金/基金/房產的比例是否合理？'},
      8:{cn:'100万到500万：这是从"储蓄型"向"配置型"转变的关键节点。考虑引入专业理财规划，了解股权类资产和固收资产的平衡配比。',
         tw:'100萬到500萬：這是從「儲蓄型」向「配置型」轉變的關鍵節點。考慮引入專業理財規劃，了解股權類資產和固收資產的平衡配比。'},
      9:{cn:'500万到1000万：税务规划开始变得重要。了解个人持有与公司架构在税负上的差异；同时确保流动资产占比不低于净资产的20%。',
         tw:'500萬到1000萬：稅務規劃開始變得重要。了解個人持有與公司架構在稅負上的差異；同時確保流動資產佔比不低於淨資產的20%。'},
      10:{cn:'1000万到1亿：在这个量级，财富最大的威胁是"失去"而非"不够多"——税务、法律、健康、家庭变故。建立完整的家族财富保护框架。',
          tw:'1000萬到1億：在這個量級，財富最大的威脅是「失去」而非「不夠多」——稅務、法律、健康、家庭變故。建立完整的家族財富保護框架。'},
    };
    var advice=adviceMap[oi];
    return {
      nextText: nextText,
      advice: advice ? (lang==='zh-TW'?advice.tw:advice.cn) : null,
    };
  }

  /* ── Generic next-step: find the option with the lowest score ABOVE current ── */
  function getNextStep(q, currentOi) {
    var currentScore = q.options[currentOi] ? (q.options[currentOi].score||0) : 0;
    var nextOpt=null, nextScore=Infinity, nextOi=-1;
    q.options.forEach(function(o, i) {
      if(i===currentOi) return;
      var s=o.score||0;
      if(s>currentScore && s<nextScore){ nextOpt=o; nextScore=s; nextOi=i; }
    });
    return {opt:nextOpt, oi:nextOi, score:nextScore};
  }

  function fallbackAdviceByOption(item){
    var txt=(lang==='zh-TW'
      ? (answerMap[item.q.id].optionText_tw||item.opt.tw||'')
      : (answerMap[item.q.id].optionText_cn||item.opt.cn||''));
    if(!txt) return '';
    return (lang==='zh-TW'
      ? ('建議實作：你目前選擇「'+txt+'」。先從可執行的小步驟開始，連續實踐14天並記錄變化，再決定下一步加碼。')
      : ('建议实操：你当前选择“'+txt+'”。先从一个可执行的小步骤开始，连续实践14天并记录变化，再决定下一步加码。'));
  }

  var low=[];
  getBank().forEach(function(q){
    if(!q.scorable||q.noImprove||q.improve===false||q.multi||q.bonus) return;
    if(UNCONTROLLABLE_IDS.has(q.id)) return;
    if(!answerMap[q.id]) return;
    var oi=answerMap[q.id].questionIdx;
    var opt=q.options[oi];
    if(!opt) return;
    var gap, nextText, advText;

    if(q.id==='B4'){
      /* B4 handled by specialist function */
      var b4r=getB4NextStep(oi, lang||window.I18N_CURRENT||'zh-CN');
      if(!b4r) return;
      gap=1; nextText=b4r.nextText; advText=b4r.advice;
      low.push({q:q,oi:oi,opt:opt,nextText:nextText,gap:gap,advText:advText,score:(opt.score||0)});
    } else {
      var next=getNextStep(q, oi);
      if(!next.opt) return;
      gap=next.score-(opt.score||0);
      if(gap<1) return;
      nextText=lang==='zh-TW'?next.opt.tw:next.opt.cn;
      var advObj=ADVICE[q.id] || (window.IMPROVE_ADVICE && window.IMPROVE_ADVICE[q.id]);
      advText=advObj?(lang==='zh-TW'?(advObj.tw||advObj.cn):advObj.cn):fallbackAdviceByOption({q:q,opt:opt});
      low.push({q:q,oi:oi,opt:opt,nextText:nextText,gap:gap,advText:advText,score:(opt.score||0)});
    }
  });

  low.sort(function(a,b){ return b.gap-a.gap; });
  var worst=low.slice(0,5);

  if(!worst.length){
    c.innerHTML='<div class="empty-note">'+(lang==='zh-TW'?'各項表現均衡，沒有明顯短板。':'各项表现均衡，没有明显短板。')+'</div>';
    return;
  }
  worst.forEach(function(item){
    var row=document.createElement('div'); row.className='improve-row';
    var qText=lang==='zh-TW'?item.q.tw:item.q.cn;
    var curText=lang==='zh-TW'
      ?(answerMap[item.q.id].optionText_tw||item.opt.tw)
      :(answerMap[item.q.id].optionText_cn||item.opt.cn);
    row.innerHTML=
      '<div class="imp-gap">↑'+item.gap+'</div>'+
      '<div class="imp-content">'+
        '<div class="imp-q">'+qText+'</div>'+
        '<div class="imp-current"><span class="imp-label">'+(lang==='zh-TW'?'現況：':'现况：')+'</span>'+curText+'</div>'+
        (item.advText?'<div class="imp-advice">'+item.advText+'</div>':'')+
      '</div>';
    c.appendChild(row);
  });
}

function starHtml(score){
  var out=''; for(var i=0;i<4;i++) out+='<svg width="12" height="12" viewBox="0 0 24 24" fill="'+(i<score?'#f59e0b':'none')+'" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  return out;
}

/* ── Tips ── */
var TIPS={
  'zh-CN':{
    low:'你目前的综合评分处于起步阶段。这不是终点，而是起跑线。以下是三个最值得优先关注的方向：\n\n① 建立基础 — 从健康和作息入手，规律睡眠和每周3次运动是一切提升的基础。\n② 明确方向 — 花一个周末认真思考你想要的生活，写下3个一年内可实现的具体目标。\n③ 建立连接 — 主动联系一位重要的人，建立或修复一段关键关系。\n\n每次进步哪怕只有1%，坚持一年就是37倍的成长。',
    'mid-low':'你已有不少值得珍视的基础，但某些重要维度还没有被认真对待。\n\n① 识别最大短板 — 对照上方"提升空间"中的问题，它们是最具性价比的突破口。\n② 建立可持续系统 — 靠环境设计而非意志力。睡前手机放床头外、每天固定时间读书。\n③ 社交投资 — 每个月深入联系3个值得投资的人，人脉靠深度不靠广度。\n\n现在的你和6个月后认真努力的你，会判若两人。',
    mid:'你处于大众水平的中间偏上，稳健均衡。但"稳健"有时也意味着停滞。\n\n① 从均衡走向卓越 — 选你最强的1个维度，将其打造成真正的核心竞争力。\n② 突破舒适区 — 报名一个略超能力的挑战（演讲、写作、新技能），逼自己成长。\n③ 财务跃升 — 如果收入停滞超过一年，认真考虑职业跃升或副业路径。\n④ 建立个人品牌 — 在某个垂直领域持续输出，让别人找到你。\n\n你离"优秀"只差一次认真的跃升决策。',
    high:'你的评分相当出色，已走在大多数人的前面。接下来，重要的不是"做更多"，而是"做得更精"。\n\n① 战略聚焦 — 砍掉低价值承诺，把精力集中在最高杠杆的事情上。\n② 影响力建设 — 你有能力影响他人了，开始思考如何将经验系统化传递。\n③ 长期思维 — 制定10年愿景，而非只是年度目标，你的决策周期应该更长。\n④ 内在深度 — 在外在成就之外，探索价值观和人生意义。成就感不等于幸福感。\n\n你已经很好了。接下来的问题是：你想成为什么样的人，并为世界留下什么。',
    excellent:'你处于顶尖水平，这是极少数人才能达到的状态。\n\n在这个阶段，常规建议已不适用。你需要的是：\n\n① 使命层面的思考 — 你的人生目标是否足够大？是否在为比自己更大的事情工作？\n② 传承与影响 — 将你的知识、经验、资源以系统化方式传递给他人。\n③ 预防退化 — 高成就者的主要风险是骄傲与停止学习。持续谦逊，持续更新认知。\n④ 深度休息 — 确保有真正的休假和内心平静，这是持续卓越的燃料。\n\n你的存在本身，就是对周围人最好的激励。',
    exceptional:'你的得分超过了100分，进入加分奖励区间。这意味着你不仅在所有常规维度出色，还在顶尖教育、专业成就、创业影响力或竞技艺术中拥有可被外部验证的卓越资历。\n\n你面临的挑战不再是「如何提升」，而是「如何选择」：你的时间和精力是最稀缺的资源，如何配置才能让你的独特优势产生最大正向影响？\n\n建议写下你的「人生遗产清单」——如果今天是你最后一个工作日，你为这个世界留下了什么？把答案变成你未来3年的战略核心。',
  },
  'zh-TW':{
    low:'你目前的綜合評分處於起步階段。以下是三個最值得優先關注的方向：\n\n① 建立基礎 — 從健康和作息入手，規律睡眠和每週3次運動是一切提升的基礎。\n② 明確方向 — 花一個週末認真思考你想要的生活，寫下3個一年內可實現的具體目標。\n③ 建立連接 — 主動聯繫一位重要的人，建立或修復一段關鍵關係。\n\n每次進步哪怕只有1%，堅持一年就是37倍的成長。',
    'mid-low':'你已有不少值得珍視的基礎，但某些重要維度還沒有被認真對待。\n\n① 識別最大短板 — 對照上方「提升空間」中的問題，它們是最具性價比的突破口。\n② 建立可持續系統 — 靠環境設計而非意志力。\n③ 社交投資 — 每個月深入聯繫3個值得投資的人。\n\n現在的你和6個月後認真努力的你，會判若兩人。',
    mid:'你處於大眾水平的中間偏上，穩健均衡。但「穩健」有時也意味著停滯。\n\n① 從均衡走向卓越 — 選你最強的1個維度，打造核心競爭力。\n② 突破舒適區 — 報名一個略超能力的挑戰，逼自己成長。\n③ 財務躍升 — 認真考慮職業躍升或副業路徑。\n④ 建立個人品牌 — 在某個垂直領域持續輸出。\n\n你離「優秀」只差一次認真的躍升決策。',
    high:'你的評分相當出色，已走在大多數人的前面。\n\n① 戰略聚焦 — 砍掉低價值承諾，把精力集中在最高槓桿的事情上。\n② 影響力建設 — 開始思考如何將經驗系統化傳遞。\n③ 長期思維 — 制定10年願景。\n④ 內在深度 — 探索價值觀和人生意義。\n\n你已經很好了。接下來的問題是：你想成為什麼樣的人。',
    excellent:'你處於頂尖水平，這是極少數人才能達到的狀態。\n\n① 使命層面的思考 — 你的人生目標是否足夠大？\n② 傳承與影響 — 將知識、經驗以系統化方式傳遞給他人。\n③ 預防退化 — 持續謙遜，持續更新認知。\n④ 深度休息 — 確保有真正的假期和內心平靜。\n\n你的存在本身，就是對周圍人最好的激勵。',
    exceptional:'你的得分超過了100分，進入加分獎勵區間。這意味著你不僅在所有常規維度出色，還在頂尖教育、專業成就、創業影響力或競技藝術中擁有可被外部驗證的卓越資歷。\n\n你面臨的挑戰不再是「如何提升」，而是「如何選擇」：把你最稀缺的時間和精力，配置在能讓獨特優勢產生最大正向影響的事情上。',
  },
};

/* ── Action plans — expanded ── */
var ACTION_PLANS={
  'zh-CN':{
    low:[
      {icon:'🌅', title:'第一步：修复睡眠',
       desc:'本周立刻执行：每天22:30前关掉手机，手机放在卧室门外充电。睡眠不足会让你的执行力、情绪和记忆力同时下降30%。这是零成本、立竿见影的升级。'},
      {icon:'📋', title:'写下你的"5年自画像"',
       desc:'用一张A4纸，以"5年后，我在哪里、在做什么、身边是谁"为开头，写满一面。不要用碎片化的愿望清单，而是描述一个完整的场景。越具体，大脑越相信它能实现。'},
      {icon:'🤝', title:'主动联系一个重要的人',
       desc:'打开手机通讯录，找一个你欣赏但已经超过6个月没联系的人，发一条真诚的消息——不是群发祝福，是真正说你想起了他/她。人脉不是名片堆，是真实情感的积累。'},
      {icon:'💰', title:'建立"先存后花"的储蓄反射',
       desc:'本月起，在发薪日的第二天，设置自动转账，将薪水的5%~10%转入一个单独的"不动账户"。不用多，重要的是习惯。储蓄率比储蓄金额更重要——它决定了你财务自由的速度。'},
      {icon:'📖', title:'每天10分钟，读有价值的内容',
       desc:'选一本和你职业或目标相关的书，每天睡前读10页。不需要读完，不需要做笔记——只需要让你的大脑在入睡前接触到高质量的信息。一年下来是3650页，相当于10~15本书。'},
    ],
    'mid-low':[
      {icon:'🔍', title:'诊断你的最大短板',
       desc:'回顾上方"提升空间"中得分最低的3个问题。选出你最有把握改变的1个，写下"我将在30天内做到___"。不要同时改变所有问题——专注突破一个，产生的正向反馈会自动推动其他改变。'},
      {icon:'💰', title:'建立月度财务检查表',
       desc:'每月最后一天，花20分钟回顾：收入了多少？花了多少？存了多少？投了多少？设一个目标储蓄率（建议20%起）。不需要记每笔开销，但要知道每类支出的大概比例。财务清晰度是财富积累的前提。'},
      {icon:'🏃', title:'把运动写进日历',
       desc:'每周选3个固定时间，把"运动30分钟"写进日历——哪怕只是快走。研究表明，把运动"预约化"比靠意志力坚持效率高3倍。运动的核心价值不是减肥，而是提升多巴胺和认知能力。'},
      {icon:'🧩', title:'学习一个可变现的新技能',
       desc:'选择一个市场需求稳定、你有兴趣的技能（数据分析/设计/写作/编程/外语），利用周末时间系统学习3个月。技能不是为了简历好看，而是为了有一个可以独立输出价值的能力单元。'},
      {icon:'👥', title:'深耕3段重要关系',
       desc:'从你的社交圈中选出3个最值得投资的人，每月至少深度联系一次（不是发消息，是打电话、见面、或者帮对方解决一个具体问题）。人际关系的投资回报期很长，但是复利最高的资产之一。'},
    ],
    mid:[
      {icon:'🎯', title:'锁定你的核心优势并放大',
       desc:'从你得分最高的维度中，找出你最强的1项能力，设定一个90天内可被外部验证的里程碑（比如完成一个项目、发表一篇专业文章、获得一个认证）。优势叠加优势，才能形成真正的差异化竞争力。'},
      {icon:'💼', title:'主动谈薪或跳槽',
       desc:'研究你所在行业和城市的薪资分位数（可用BOSS直聘/猎聘查询），如果你低于中位数，制定一个3个月计划：更新简历、建立目标公司清单、开始面试。不要等涨薪——主动出击的人平均薪资增幅是被动等待者的3倍。'},
      {icon:'✍️', title:'开始持续内容输出',
       desc:'在知乎、公众号或LinkedIn选一个平台，每周发布1篇你的专业思考或行业洞察。不需要完美，需要持续。6个月后你会有一个真实可见的"专业人设"，这是最高效的被动机会吸引器。'},
      {icon:'📊', title:'启动投资理财计划',
       desc:'如果你还没有系统投资，现在开始：① 确保有6个月应急储备；② 开通指数基金账户，设置每月定投（哪怕500元起）；③ 了解你所在国家的税收优惠账户（如个人养老金账户）。时间在投资中的价值比本金更重要。'},
      {icon:'🌿', title:'设计一个"深度工作"时间块',
       desc:'每天划出至少90分钟的"不可打扰时间"——关掉通知，专注做最重要的一件事。研究表明，进入心流状态的工作质量是普通状态的5倍。学会用深度工作替代长时间低效工作。'},
    ],
    high:[
      {icon:'🔭', title:'写你的"个人10年战略文档"',
       desc:'花一个安静的周末，写一份2000字的个人长期规划，涵盖：职业（想成为谁？）、财务（资产目标？）、关系（要建立或维护什么？）、健康（保持什么状态？）。这不是愿望清单，而是一份真正的战略——要有优先级、取舍和资源分配。'},
      {icon:'👥', title:'开始系统性地帮助他人成长',
       desc:'选择1~2个比你年轻5~10岁、有潜力的人，给予系统性指导（非偶尔答疑）。帮助他人成长是验证你自己知识体系的最好方式，同时也是建立真实影响力的最长效路径。'},
      {icon:'🧘', title:'建立"内在投资"习惯',
       desc:'每天10分钟冥想（推荐正念冥想），每周一次完全离线的户外时间。高成就者最常忽视的资产是内在平静——而它是所有持续输出的能量来源。不要只管理时间，也要管理注意力和精力。'},
      {icon:'🔗', title:'战略性地升级你的人脉圈',
       desc:'梳理你现有的人脉，找出3个你尊敬但还没有深度连接的人，主动创造一次真实的价值交换机会（不是请客吃饭，是帮对方解决一个实际问题，或者共同推进一个项目）。顶级人脉不是积累的，是创造的。'},
      {icon:'💡', title:'做一次彻底的"低价值承诺"清理',
       desc:'列出你所有的日常承诺（工作项目、社交活动、订阅服务、习惯性任务），用一个简单标准筛选：这件事3年后对我还重要吗？把不重要的一次性清除。释放出来的时间和精力，投入到真正高杠杆的事情上。'},
    ],
    excellent:[
      {icon:'🌍', title:'写一份"使命宣言"',
       desc:'思考并回答这三个问题：我有什么独特的能力/资源/经验？世界上有什么问题需要它们？我愿意为此付出什么代价？把答案提炼成一段50字以内的"个人使命"。这是你在这个层级所有决策的北极星。'},
      {icon:'📖', title:'系统化输出你的知识体系',
       desc:'你积累的方法论、判断框架和经验有巨大的传播价值。考虑：写一本书（哪怕自出版）、开设一门系统课程、建立一个小型学习社群，或者通过深度采访让你的思想被记录下来。知识不传播，价值就会随你一起消失。'},
      {icon:'⚖️', title:'主动保护你的核心关系',
       desc:'在高成就状态下，最容易被忽视的是亲密关系。每周安排至少一次不带手机、不讨论工作的"专属时间"，给你最重要的人（伴侣、孩子、父母）。这不是牺牲，而是对你最高价值资产的维护投资。'},
      {icon:'🏥', title:'投资最高级别的健康管理',
       desc:'预约一次全面精密体检（而非普通体检套餐），建立每季度一次的健康数据追踪。考虑聘请私人营养师和训练师。你的身体是你所有成就的硬件基础——在它还好的时候维护，代价远低于出问题后修复。'},
      {icon:'🌱', title:'做一件"不计回报"的事',
       desc:'选择一个与你的商业利益完全无关、纯粹基于内心认同的公益方向，系统性地投入时间或资源（而非只是捐款）。这不是慈善，而是对你内心深处"为什么活着"这个问题的一个真诚回应。'},
    ],
    exceptional:[
      {icon:'🏆', title:'记录你的方法论',
       desc:'你积累的判断框架和决策方法对他人有极高价值。系统化记录——写书、建课、播客均可。知识不传播，价值会随你一起消失。'},
      {icon:'🌐', title:'全球视野与跨界连接',
       desc:'主动建立与你领域之外顶尖人才的真实联系。下一个重要突破通常来自意想不到的交叉点。'},
      {icon:'🎓', title:'战略性培养接班人',
       desc:'找出3-5个有潜力超越你的年轻人，给予系统化指导。你的影响力通过他们产生几何级数放大。'},
      {icon:'🧘', title:'刻意维护内心平静',
       desc:'建立一个无目的时间保护区——不为任何产出，只是存在。极高成就状态下孤独感是最常见隐患。'},
      {icon:'📜', title:'定义你的人生遗产',
       desc:'写下：如果今天是你最后一个工作日，你已为世界留下了什么？把答案变成未来3年战略核心。'},
    ],
  },
  'zh-TW':{
    low:[
      {icon:'🌅', title:'第一步：修復睡眠',
       desc:'本週立刻執行：每天22:30前關掉手機，手機放在臥室門外充電。睡眠不足會讓你的執行力、情緒和記憶力同時下降30%。這是零成本、立竿見影的升級。'},
      {icon:'📋', title:'寫下你的「5年自畫像」',
       desc:'用一張A4紙，以「5年後，我在哪裡、在做什麼、身邊是誰」為開頭，寫滿一面。越具體，大腦越相信它能實現。'},
      {icon:'🤝', title:'主動聯繫一個重要的人',
       desc:'打開手機通訊錄，找一個你欣賞但已超過6個月沒聯繫的人，發一條真誠的訊息。人脈不是名片堆，是真實情感的積累。'},
      {icon:'💰', title:'建立「先存後花」的儲蓄反射',
       desc:'本月起，設置自動轉帳，將薪水的5%~10%轉入一個單獨的「不動帳戶」。儲蓄率比儲蓄金額更重要——它決定了你財務自由的速度。'},
      {icon:'📖', title:'每天10分鐘，讀有價值的內容',
       desc:'選一本和你職業或目標相關的書，每天睡前讀10頁。一年下來相當於10~15本書。'},
    ],
    'mid-low':[
      {icon:'🔍', title:'診斷你的最大短板',
       desc:'回顧「提升空間」中得分最低的3個問題，選出最有把握改變的1個，寫下「我將在30天內做到___」。'},
      {icon:'💰', title:'建立月度財務檢查表',
       desc:'每月最後一天，花20分鐘回顧收入、支出、儲蓄比例。設一個目標儲蓄率（建議20%起）。財務清晰度是財富積累的前提。'},
      {icon:'🏃', title:'把運動寫進日曆',
       desc:'每週選3個固定時間，把「運動30分鐘」寫進日曆。預約化的運動比靠意志力堅持效率高3倍。'},
      {icon:'🧩', title:'學習一個可變現的新技能',
       desc:'選擇市場需求穩定、你有興趣的技能，利用週末系統學習3個月。技能是可以獨立輸出價值的能力單元。'},
      {icon:'👥', title:'深耕3段重要關係',
       desc:'每月至少深度聯繫3個最值得投資的人（打電話、見面、幫對方解決具體問題）。'},
    ],
    mid:[
      {icon:'🎯', title:'鎖定你的核心優勢並放大',
       desc:'找出你最強的1項能力，設定90天內可被外部驗證的里程碑。優勢疊加優勢，才能形成真正的差異化競爭力。'},
      {icon:'💼', title:'主動談薪或跳槽',
       desc:'研究所在行業薪資分位數，如低於中位數，製定3個月計劃：更新履歷、建立目標公司清單、開始面試。'},
      {icon:'✍️', title:'開始持續內容輸出',
       desc:'每週發布1篇你的專業思考。6個月後你會有一個真實可見的「專業人設」，這是最高效的被動機會吸引器。'},
      {icon:'📊', title:'啟動投資理財計劃',
       desc:'確保有6個月應急儲備後，開設指數基金帳戶設置每月定投。時間在投資中的價值比本金更重要。'},
      {icon:'🌿', title:'設計「深度工作」時間塊',
       desc:'每天劃出至少90分鐘「不可打擾時間」。進入心流狀態的工作質量是普通狀態的5倍。'},
    ],
    high:[
      {icon:'🔭', title:'寫你的「個人10年戰略文件」',
       desc:'花一個安靜的週末，寫一份2000字的個人長期規劃，涵蓋職業、財務、關係、健康四個維度。'},
      {icon:'👥', title:'開始系統性地幫助他人成長',
       desc:'選擇1~2個有潛力的年輕人，給予系統性指導。幫助他人成長是驗證自己知識體系的最好方式。'},
      {icon:'🧘', title:'建立「內在投資」習慣',
       desc:'每天10分鐘冥想，每週一次完全離線的戶外時間。高成就者最常忽視的資產是內在平靜。'},
      {icon:'🔗', title:'戰略性地升級你的人脈圈',
       desc:'找出3個你尊敬但還沒有深度連接的人，主動創造真實的價值交換機會。'},
      {icon:'💡', title:'做一次徹底的「低價值承諾」清理',
       desc:'列出所有日常承諾，用「3年後對我還重要嗎？」篩選，清除不重要的，釋放時間投入高槓桿的事。'},
    ],
    excellent:[
      {icon:'🌍', title:'寫一份「使命宣言」',
       desc:'思考：我有什麼獨特的能力？世界上有什麼問題需要它們？提煉成一段50字以內的個人使命。'},
      {icon:'📖', title:'系統化輸出你的知識體系',
       desc:'考慮寫書、開課或建立學習社群。知識不傳播，價值就會隨你一起消失。'},
      {icon:'⚖️', title:'主動保護你的核心關係',
       desc:'每週安排至少一次不帶手機、不討論工作的「專屬時間」給最重要的人。'},
      {icon:'🏥', title:'投資最高級別的健康管理',
       desc:'預約全面精密體檢，建立每季度一次的健康數據追蹤。身體是所有成就的硬體基礎。'},
      {icon:'🌱', title:'做一件「不計回報」的事',
       desc:'選擇與商業利益完全無關的公益方向，系統性投入。這是對「為什麼活著」這個問題的真誠回應。'},
    ],
    exceptional:[
      {icon:'🏆', title:'記錄你的方法論',
       desc:'將你的判斷框架、決策方法系統化記錄。知識不傳播，價值會隨你一起消失。'},
      {icon:'🌐', title:'全球視野與跨界連結',
       desc:'主動建立與你領域之外頂尖人才的真實聯繫。下一個重要突破通常來自意想不到的交叉點。'},
      {icon:'🎓', title:'戰略性培養接班人',
       desc:'找出3-5個有潛力超越你的年輕人，給予系統化指導和資源投入。'},
      {icon:'🧘', title:'刻意維護內心平靜',
       desc:'建立一個無目的時間保護區。極高成就狀態下，孤獨感和意義感缺失是最常見隱患。'},
      {icon:'📜', title:'定義你的人生遺產',
       desc:'寫下：如果今天是你最後一個工作日，你已為世界留下了什麼？把答案變成未來3年戰略核心。'},
    ],
  },
};

/* ── Payment modal config ── */
var PAYMENT_CONFIG = {
  wechat:  { name_cn:'微信支付', name_tw:'微信支付', color:'#07c160', fallback:'💚', logoSrc:'assets/logo-wechat.png', qrSrc:'assets/qr-wechat.png' },
  alipay:  { name_cn:'支付宝',   name_tw:'支付寶',   color:'#1677ff', fallback:'💙', logoSrc:'assets/logo-alipay.png', qrSrc:'assets/qr-alipay.png' },
  crypto:  { name_cn:'加密支付', name_tw:'加密支付', color:'#f0b90b', fallback:'🟡', logoSrc:'assets/logo-crypto.png', qrSrc:'assets/qr-crypto.png' },
  qq:      { name_cn:'QQ 钱包',  name_tw:'QQ 錢包',  color:'#12b7f5', fallback:'💜', logoSrc:'assets/logo-qq.png',    qrSrc:'assets/qr-qq.png' },
};

/* ── Setup payment modal (logo click → QR popup) ── */
function setupPaymentModal(){
  var overlay    = document.getElementById('paymentModalOverlay');
  var closeBtn   = document.getElementById('paymentModalClose');
  var pmLogoImg  = document.getElementById('pmLogoImg');
  var pmLogoFb   = document.getElementById('pmLogoFallback');
  var pmName     = document.getElementById('pmPlatformName');
  var pmQrImg    = document.getElementById('pmQrImg');
  var pmQrPh     = document.getElementById('pmQrPlaceholder');
  var pmQrPhIcon = document.getElementById('pmQrPlaceholderIcon');
  var pmQrPhPath = document.getElementById('pmQrPlaceholderPath');
  if(!overlay) return;

  function openPayment(platform){
    var cfg = PAYMENT_CONFIG[platform];
    if(!cfg) return;
    var lang = window.I18N_CURRENT||'zh-CN';
    var name = lang==='zh-TW' ? cfg.name_tw : cfg.name_cn;

    /* Logo */
    if(pmLogoImg){ pmLogoImg.src=cfg.logoSrc; pmLogoImg.style.display=''; }
    if(pmLogoFb){ pmLogoFb.textContent=cfg.fallback; pmLogoFb.style.background=cfg.color; pmLogoFb.style.display='none'; }
    if(pmName) pmName.textContent = name;

    /* QR code */
    if(pmQrImg){ pmQrImg.src=cfg.qrSrc; pmQrImg.style.display=''; }
    if(pmQrPh){ pmQrPh.style.display='none'; }
    if(pmQrPhIcon) pmQrPhIcon.textContent = cfg.fallback;
    if(pmQrPhPath) pmQrPhPath.textContent = cfg.qrSrc;

    overlay.classList.add('open');
    document.body.style.overflow='hidden';
  }

  function closePayment(){
    overlay.classList.remove('open');
    document.body.style.overflow='';
  }

  if(closeBtn) closeBtn.addEventListener('click', closePayment);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) closePayment(); });

  /* Bind all .sponsor-logo-btn buttons (covers both cards with specific parent selectors) */
  document.querySelectorAll('#sponsorCard .sponsor-logo-btn, #sponsorCard2 .sponsor-logo-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ openPayment(btn.dataset.payment); });
  });
}

function buildNextSteps(lang){
  var c=document.getElementById('nextStepsRows'); if(!c) return;
  var verdict=getVerdict(finalScore);
  var plans=(ACTION_PLANS[lang]||ACTION_PLANS['zh-CN'])[verdict]||ACTION_PLANS['zh-CN'].mid;
  c.innerHTML='';
  plans.forEach(function(p,i){
    var row=document.createElement('div'); row.className='action-row';
    row.innerHTML='<div class="action-step">0'+(i+1)+'</div>'+
      '<div class="action-icon">'+p.icon+'</div>'+
      '<div class="action-body"><div class="action-title">'+p.title+'</div><div class="action-desc">'+p.desc+'</div></div>';
    c.appendChild(row);
  });
}

function buildRankVerdict(lang){
  var verdict=getVerdict(finalScore);
  var rankEl=document.getElementById('resultRank'), vEl=document.getElementById('resultVerdict');
  if(rankEl){ rankEl.innerHTML=''; rankEl.style.display='none'; }
  if(vEl) vEl.textContent = (lang==='zh-TW' ? '你的人生評分為：' : '你的人生评分为：');
  var tipEl=document.getElementById('tipText');

  /* ── Under-18 special encouragement ────────────────────────────────────────
     Youth users see a completely different, warm and motivational message
     instead of the standard adult-world tips. The score floor is 80 for them,
     and the tip should reflect that this is a starting line, not a verdict.
  ── */
  var isUnder18 = (answerMap && answerMap.A1 && answerMap.A1.questionIdx === 0) ||
                  (answerMap && answerMap.QK1 && answerMap.QK1.questionIdx === 0);
  if(isUnder18){
    var youthTip = lang==='zh-TW'
      ? '🌱 給未滿18歲的你\n\n你才剛剛開始。\n\n此刻的評分，是你在一個最受限制的人生階段交出的答卷——沒有完整的財務自主、沒有職業積累、也沒有太多的選擇權。這些不是你的問題，而是年齡本來的樣子。\n\n真正重要的是：你今天好奇什麼、認真對待什麼、選擇成為什麼樣的人。這些，才是決定你未來20年的真實變量。\n\n你現在擁有最珍貴的資源——時間和可塑性。今天認真投入的每一個習慣，都在悄悄為你未來的人生疊加複利。\n\n去探索，去嘗試，去犯錯，去成長。你的人生，才剛剛開幕。'
      : '🌱 给未满18岁的你\n\n你才刚刚开始。\n\n此刻的评分，是你在一个最受限制的人生阶段交出的答卷——没有完整的财务自主、没有职业积累、也没有太多的选择权。这些不是你的问题，而是年龄本来的样子。\n\n真正重要的是：你今天好奇什么、认真对待什么、选择成为什么样的人。这些，才是决定你未来20年的真实变量。\n\n你现在拥有最珍贵的资源——时间和可塑性。今天认真投入的每一个习惯，都在悄悄为你未来的人生叠加复利。\n\n去探索，去尝试，去犯错，去成长。你的人生，才刚刚开幕。';
    if(tipEl) tipEl.textContent = youthTip;
    /* Show the under-18 banner highlight */
    var u18El = document.getElementById('under18Banner');
    if(u18El){ u18El.style.display='block'; }
    /* Still show bonus badge if earned */
    var bonusScore=0;
    try{ var rd=sessionStorage.getItem('ls_result'); if(rd) bonusScore=JSON.parse(rd).bonusScore||0; }catch(e){}
    var bonusEl=document.getElementById('bonusBadge');
    if(bonusEl){
      if(bonusScore>0){ bonusEl.textContent='+'+bonusScore+' '+(lang==='zh-TW'?'卓越加分':'卓越加分'); bonusEl.style.display='inline-flex'; }
      else { bonusEl.style.display='none'; }
    }
    return;
  }

  if(tipEl) tipEl.textContent=((TIPS[lang]||TIPS['zh-CN'])[verdict])||((TIPS['zh-CN'])[verdict])||'';
  /* Bonus badge: show earned bonus points if any */
  var bonusScore=0;
  try{ var rd=sessionStorage.getItem('ls_result'); if(rd) bonusScore=JSON.parse(rd).bonusScore||0; }catch(e){}
  var bonusEl=document.getElementById('bonusBadge');
  if(bonusEl){
    if(bonusScore>0){
      bonusEl.textContent='+'+ bonusScore +' '+(lang==='zh-TW'?'卓越加分':'卓越加分');
      bonusEl.style.display='inline-flex';
    } else { bonusEl.style.display='none'; }
  }
}

/* ══════════════════════════════════════════════════════
   DATA VISUALIZATION — Radar, Score Bars, Dim Comparison
   ══════════════════════════════════════════════════════ */

function drawResultRadar(canvas){
  if(!canvas||!dimPct) return;
  var dpr=window.devicePixelRatio||1;
  var rect=canvas.getBoundingClientRect();
  var cssW=Math.floor(rect.width||canvas.width);
  var cssH=Math.floor(rect.height||canvas.height);
  if(canvas.width!==cssW*dpr||canvas.height!==cssH*dpr){
    canvas.width=cssW*dpr; canvas.height=cssH*dpr;
  }
  var ctx=canvas.getContext('2d');
  ctx.save(); ctx.scale(dpr,dpr);
  var W=cssW, H=cssH, cx=W/2, cy=H/2+10, R=Math.min(W,H)*0.26;
  var lang=window.I18N_CURRENT||'zh-CN';
  var labels=lang==='zh-TW'?['基礎資訊','社會生活方向','個人認同']:['基础信息','社会生活方向','个人认同'];
  var scores=[dimPct.basic||0, dimPct.social||0, dimPct.identity||0];
  var n=3;
  ctx.clearRect(0,0,W,H);

  /* Grid rings */
  for(var ring=1;ring<=5;ring++){
    var r=R*ring/5;
    ctx.beginPath();
    for(var i=0;i<n;i++){
      var a=Math.PI*2*i/n-Math.PI/2;
      i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
    }
    ctx.closePath(); ctx.strokeStyle='rgba(14,165,233,0.12)'; ctx.lineWidth=1; ctx.stroke();
    if(ring===5){ ctx.font='400 10px sans-serif'; ctx.fillStyle='#94a3b8'; ctx.textAlign='right'; ctx.fillText(ring*20, cx-6, cy-r+12); }
  }

  /* Axes */
  for(var i=0;i<n;i++){
    var a=Math.PI*2*i/n-Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));
    ctx.strokeStyle='rgba(14,165,233,0.18)'; ctx.lineWidth=1; ctx.stroke();
  }

  /* Data polygon */
  ctx.beginPath();
  for(var i=0;i<n;i++){
    var a=Math.PI*2*i/n-Math.PI/2, v=Math.max(0.05,Math.min(100,scores[i]))/100;
    var x=cx+R*v*Math.cos(a), y=cy+R*v*Math.sin(a);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.closePath(); ctx.fillStyle='rgba(14,165,233,0.15)'; ctx.fill();
  ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=2.5; ctx.stroke();

  /* Dots + labels */
  var LDIST=R+38;
  ctx.textBaseline='middle';
  for(var i=0;i<n;i++){
    var a=Math.PI*2*i/n-Math.PI/2, v=Math.max(0.05,Math.min(100,scores[i]))/100;
    var dx=cx+R*v*Math.cos(a), dy=cy+R*v*Math.sin(a);
    ctx.beginPath(); ctx.arc(dx,dy,5,0,Math.PI*2); ctx.fillStyle='#0284c7'; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    var lx=cx+LDIST*Math.cos(a), ly=cy+LDIST*Math.sin(a);
    ctx.textAlign=lx<cx-4?'right':lx>cx+4?'left':'center';
    ctx.font='600 12px Quicksand,sans-serif'; ctx.fillStyle='#334155'; ctx.fillText(labels[i],lx,ly-8);
    ctx.font='700 13px Quicksand,sans-serif'; ctx.fillStyle='#0284c7'; ctx.fillText(Math.round(scores[i]),lx,ly+10);
  }
  ctx.textBaseline='alphabetic';

  /* Center score */
  ctx.textAlign='center'; ctx.font='900 22px Quicksand,sans-serif'; ctx.fillStyle='#0284c7';
  ctx.fillText(formatScorePrecise(finalScorePrecise),cx,cy+6);
  ctx.font='400 10px sans-serif'; ctx.fillStyle='#94a3b8'; ctx.fillText('/ 150',cx,cy+22);
  ctx.restore();
}

function drawProfessionalRadar(canvas){
  if(!canvas) return;
  var dpr=window.devicePixelRatio||1;
  var rect=canvas.getBoundingClientRect();
  var cssW=Math.floor(rect.width||canvas.width);
  var cssH=Math.floor(rect.height||canvas.height);
  if(canvas.width!==cssW*dpr||canvas.height!==cssH*dpr){
    canvas.width=cssW*dpr; canvas.height=cssH*dpr;
  }
  var pd=computeProfessionalDims();
  var ctx=canvas.getContext('2d');
  ctx.save(); ctx.scale(dpr,dpr);
  var W=cssW, H=cssH, cx=W/2, cy=H/2+4, R=Math.min(W,H)*0.33;
  var lang=window.I18N_CURRENT||'zh-CN';
  var labels=lang==='zh-TW'
    ? ['社交能力','創造力','幸福感']
    : ['社交能力','创造力','幸福感'];
  var scores=[pd.socialAbility,pd.creativity,pd.wellbeing];
  var n=3;
  ctx.clearRect(0,0,W,H);

  for(var ring=1; ring<=5; ring++){
    var r=R*ring/5;
    ctx.beginPath();
    for(var i=0;i<n;i++){
      var a=Math.PI*2*i/n-Math.PI/2;
      var x=cx+r*Math.cos(a), y=cy+r*Math.sin(a);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle='rgba(14,165,233,0.13)';
    ctx.lineWidth=1;
    ctx.stroke();
  }
  for(var j=0;j<n;j++){
    var aa=Math.PI*2*j/n-Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(cx+R*Math.cos(aa),cy+R*Math.sin(aa));
    ctx.strokeStyle='rgba(14,165,233,0.2)';
    ctx.lineWidth=1;
    ctx.stroke();
  }
  ctx.beginPath();
  for(var k=0;k<n;k++){
    var ang=Math.PI*2*k/n-Math.PI/2;
    var v=Math.max(0.05,Math.min(100,scores[k]||0))/100;
    var px=cx+R*v*Math.cos(ang), py=cy+R*v*Math.sin(ang);
    k===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fillStyle='rgba(14,165,233,0.16)';
  ctx.fill();
  ctx.strokeStyle='#38bdf8';
  ctx.lineWidth=2.2;
  ctx.stroke();

  ctx.textBaseline='middle';
  var LDIST=R+28;
  for(var t=0;t<n;t++){
    var a2=Math.PI*2*t/n-Math.PI/2;
    var lx=cx+LDIST*Math.cos(a2), ly=cy+LDIST*Math.sin(a2);
    ctx.textAlign=lx<cx-4?'right':lx>cx+4?'left':'center';
    ctx.font='600 12px Quicksand,sans-serif';
    ctx.fillStyle='#334155';
    ctx.fillText(labels[t],lx,ly-8);
    ctx.font='700 12px Quicksand,sans-serif';
    ctx.fillStyle='#0284c7';
    ctx.fillText(Math.round(scores[t]),lx,ly+9);
  }
  ctx.textBaseline='alphabetic';
  ctx.restore();
}

/* ── Score Gauge (semicircle speedometer) ── */
function drawGauge(canvas){
  if(!canvas) return;
  var ctx=canvas.getContext('2d');
  var W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  var cx=W/2, cy=H*0.82, R=Math.min(W/2-30,H*0.7);
  var maxScore=150;
  var pct=Math.min(finalScore/maxScore,1);

  /* Background arc */
  ctx.beginPath(); ctx.arc(cx,cy,R,Math.PI,0);
  ctx.lineWidth=22; ctx.strokeStyle='#e4e4e7'; ctx.lineCap='round'; ctx.stroke();

  /* Colored arc — gradient segments */
  var colors=['#ef4444','#f59e0b','#38bdf8','#0ea5e9','#10b981'];
  var segments=5;
  for(var i=0;i<segments;i++){
    var segStart=Math.PI+Math.PI*(i/segments);
    var segEnd=Math.PI+Math.PI*((i+1)/segments);
    var segPct=(i+1)/segments;
    if(pct<(i/segments)) break;
    var endAngle=pct>=segPct?segEnd:Math.PI+Math.PI*pct;
    ctx.beginPath(); ctx.arc(cx,cy,R,segStart,endAngle);
    ctx.lineWidth=22; ctx.strokeStyle=colors[i]; ctx.lineCap='round'; ctx.stroke();
    if(pct<segPct) break;
  }

  /* Needle */
  var needleAngle=Math.PI+Math.PI*pct;
  var nx=cx+(R-35)*Math.cos(needleAngle), ny=cy+(R-35)*Math.sin(needleAngle);
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(nx,ny);
  ctx.lineWidth=3; ctx.strokeStyle='#27272a'; ctx.lineCap='round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,7,0,Math.PI*2); ctx.fillStyle='#27272a'; ctx.fill();

  /* Score text — score number well above, /150 well below with clear gap */
  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.font='900 28px Quicksand,sans-serif'; ctx.fillStyle='#18181b';
  ctx.fillText(formatScorePrecise(finalScorePrecise), cx, cy-28);
  ctx.textBaseline='top';
  ctx.font='500 11px Quicksand,sans-serif'; ctx.fillStyle='#a1a1aa';
  ctx.fillText('/ '+maxScore, cx, cy-8);

  /* Min/Max labels — below the arc ends, not overlapping score */
  ctx.font='500 11px sans-serif'; ctx.fillStyle='#a1a1aa'; ctx.textBaseline='top';
  ctx.textAlign='left'; ctx.fillText('0', cx-R, cy+10);
  ctx.textAlign='right'; ctx.fillText(maxScore, cx+R, cy+10);
}

/* ── Score Composition Donut ── */
function drawDonut(canvas){
  if(!canvas||!dimPct) return;
  var ctx=canvas.getContext('2d');
  var W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  var cx=W/2, cy=H*0.4, R=Math.min(W,H)*0.34;
  var lang=window.I18N_CURRENT||'zh-CN';
  var isTW=lang==='zh-TW';

  var data=[
    {label:isTW?'基礎維度':'基础维度', value:dimPct.basic||0, color:'#38bdf8'},
    {label:isTW?'社會生活方向':'社会生活方向', value:dimPct.social||0, color:'#0ea5e9'},
    {label:isTW?'個人認同':'个人认同', value:dimPct.identity||0, color:'#f59e0b'},
  ];
  if(bonusScore>0) data.push({label:isTW?'加分題':'加分题', value:bonusScore*2, color:'#10b981'});

  var total=0; data.forEach(function(d){ total+=d.value; });
  if(total===0) return;

  /* Draw arcs */
  var startAngle=-Math.PI/2;
  data.forEach(function(d){
    var slice=d.value/total*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,startAngle,startAngle+slice);
    ctx.closePath(); ctx.fillStyle=d.color; ctx.fill();
    startAngle+=slice;
  });

  /* Center hole */
  ctx.beginPath(); ctx.arc(cx,cy,R*0.58,0,Math.PI*2);
  ctx.fillStyle='#f4f4f5'; ctx.fill();

  /* Center text */
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='800 26px Quicksand,sans-serif'; ctx.fillStyle='#18181b';
  ctx.fillText(formatScorePrecise(finalScorePrecise), cx, cy-4);
  ctx.font='500 11px sans-serif'; ctx.fillStyle='#a1a1aa';
  ctx.fillText(isTW?'總分':'总分', cx, cy+16);

  /* Legend — laid out vertically below the donut */
  var ly=cy+R+28;
  var lineH=22;
  ctx.textBaseline='middle';
  data.forEach(function(d, idx){
    var rowY=ly+idx*lineH;
    var rowX=cx-70;
    /* Color dot */
    ctx.fillStyle=d.color;
    ctx.beginPath(); ctx.arc(rowX,rowY,5,0,Math.PI*2); ctx.fill();
    /* Label */
    ctx.textAlign='left'; ctx.font='600 12px Quicksand,sans-serif'; ctx.fillStyle='#52525b';
    ctx.fillText(d.label, rowX+12, rowY);
    /* Value */
    ctx.textAlign='right'; ctx.font='700 12px Quicksand,sans-serif'; ctx.fillStyle='#18181b';
    ctx.fillText(Math.round(d.value), cx+70, rowY);
  });
}

function drawDimComparison(canvas){
  if(!canvas||!dimPct) return;
  var ctx=canvas.getContext('2d');
  var W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  var lang=window.I18N_CURRENT||'zh-CN';
  var dims=[
    {key:'basic',label:lang==='zh-TW'?'基礎維度':'基础维度',color:'#7dd3fc'},
    {key:'social',label:lang==='zh-TW'?'社會生活方向':'社会生活方向',color:'#0ea5e9'},
    {key:'identity',label:lang==='zh-TW'?'個人認同':'个人认同',color:'#10b981'},
  ];
  var barH=28, gap=20, topPad=10, leftPad=80;
  var barW=W-leftPad-60;

  dims.forEach(function(d,i){
    var y=topPad+i*(barH+gap);
    var s=dimPct[d.key]||0;
    /* Label */
    ctx.font='600 12px sans-serif'; ctx.fillStyle='#334155'; ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillText(d.label, leftPad-10, y+barH/2);
    /* Track */
    ctx.fillStyle='#e2e8f0';
    roundRect(ctx, leftPad, y, barW, barH, 6); ctx.fill();
    /* Fill */
    ctx.fillStyle=d.color;
    var fw=barW*Math.min(s,100)/100;
    if(fw>12){ roundRect(ctx, leftPad, y, fw, barH, 6); ctx.fill(); }
    /* Score */
    ctx.textAlign='left'; ctx.fillStyle='#334155'; ctx.font='700 13px sans-serif';
    ctx.fillText(Math.round(s), leftPad+fw+8, y+barH/2);
  });
  ctx.textBaseline='alphabetic';
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}


/* ══════════════════════════════════════════════════════
   PERSONALIZED INSIGHTS — Deep pattern detection with authentic analysis
   ══════════════════════════════════════════════════════ */

function buildInsights(lang){
  var c=document.getElementById('insightRows'); if(!c||!answerMap) return; c.innerHTML='';
  var isTW=lang==='zh-TW';
  var rows=[];
  var bank=getBank();

  /* Helper: get answer option index for a QK id, or -1 if not answered */
  function a(id){ return answerMap[id]?answerMap[id].questionIdx:-1; }

  /* Helper: get weakest dimension */
  function getWeakestDim(){
    if(!dimPct) return null;
    var dims=[{k:'basic',v:dimPct.basic||0},{k:'social',v:dimPct.social||0},{k:'identity',v:dimPct.identity||0}];
    dims.sort(function(a,b){return a.v-b.v;});
    return dims[0].k;
  }

  /* Helper: get strongest dimension */
  function getStrongestDim(){
    if(!dimPct) return null;
    var dims=[{k:'basic',v:dimPct.basic||0},{k:'social',v:dimPct.social||0},{k:'identity',v:dimPct.identity||0}];
    dims.sort(function(a,b){return b.v-a.v;});
    return dims[0].k;
  }

  /* ════════════════════════════════════════════════════════
     CORE LIFE PATTERNS — Authentic psychological insights
     ════════════════════════════════════════════════════════ */

  /* ── Pattern 1: The Foundation Gap (basic strong, social weak) ── */
  if(dimPct && dimPct.basic>=70 && dimPct.social<=50){
    rows.push({cls:'purple',icon:'🌱',
      title:isTW?'起點優秀，但尚未全力奔跑':'起点优秀，但尚未全力奔跑',
      body:isTW
        ? '你的健康、教育、成長環境這些「起點條件」比大多數人都要好。這是一種幸運，但也是一種責任——你有責任讓這些好條件發揮出應有的價值。\n\n現實是：很多起點不如你的人，在職業和社會影響力上已經走在了前面。這不是因為他們更聰明或更努力，而是因為他們「不得不」全力奔跑。\n\n你可能一直在等待「準備好」的那一刻。但真相是：沒有人是真正準備好才出發的。那些看起來從容的人，只不過是邊走邊學。\n\n這個月試試看：主動承擔一個略超出你舒適區的任務，或者向老闆/客戶提出一個你過去不敢提的想法。你會發現，世界對你的反應比你想像的更友善。'
        : '你的健康、教育、成长环境这些「起点条件」比大多数人都要好。这是一种幸运，但也是一种责任——你有责任让这些好条件发挥出应有的价值。\n\n现实是：很多起点不如你的人，在职业和社会影响力上已经走在了前面。这不是因为他们更聪明或更努力，而是因为他们「不得不」全力奔跑。\n\n你可能一直在等待「准备好」的那一刻。但真相是：没有人是真正准备好才出发的。那些看起来从容的人，只不过是边走边学。\n\n这个月试试看：主动承担一个略超出你舒适区的任务，或者向老板/客户提出一个你过去不敢提的想法。你会发现，世界对你的反应比你想象的更友善。'
    });
  }

  /* ── Pattern 2: The Social Climber (social strong, identity weak) ── */
  if(dimPct && dimPct.social>=70 && dimPct.identity<=50){
    rows.push({cls:'warn',icon:'🏃',
      title:isTW?'外在成功，但內在正在掉隊':'外在成功，但内在正在掉队',
      body:isTW
        ? '你在職業、收入、社交圈這些「外在指標」上表現不錯。但你的內在認同維度顯示：你可能並不清楚自己真正想要什麼，或者正在做的一切是為了什麼。\n\n這是一個常見的陷阱：我們追逐社會定義的成功，卻忘了問自己「這是我想要的嗎」。結果是：擁有了別人羨慕的一切，卻感受不到真正的滿足。\n\n心理學家把這種狀態叫做「空心人」——看起來光鮮，內在卻是空的。如果不及時調整，這種狀態會隨著年齡增長變得越來越痛苦。\n\n建議：這個週末找一個安靜的地方，認真回答這三個問題：\n① 如果錢不是問題，我會選擇做什麼？\n② 什麼事情讓我感到真正的快樂（不是成就感，是快樂）？\n③ 我希望十年後的自己過著什麼樣的生活？\n\n這些問題沒有標準答案，但思考它們本身就是找回自己的開始。'
        : '你在职业、收入、社交圈这些「外在指标」上表现不错。但你的内在认同维度显示：你可能并不清楚自己真正想要什么，或者正在做的一切是为了什么。\n\n这是一个常见的陷阱：我们追逐社会定义的成功，却忘了问自己「这是我想要的吗」。结果是：拥有了别人羡慕的一切，却感受不到真正的满足。\n\n心理学家把这种状态叫做「空心人」——看起来光鲜，内在却是空的。如果不及时调整，这种状态会随着年龄增长变得越来越痛苦。\n\n建议：这个周末找一个安静的地方，认真回答这三个问题：\n① 如果钱不是问题，我会选择做什么？\n② 什么事情让我感到真正的快乐（不是成就感，是快乐）？\n③ 我希望十年后的自己过着什么样的生活？\n\n这些问题没有标准答案，但思考它们本身就是找回自己的开始。'
    });
  }

  /* ── Pattern 3: The Thinker\'s Trap (identity strong, social weak) ── */
  if(dimPct && dimPct.identity>=70 && dimPct.social<=50){
    rows.push({cls:'purple',icon:'💭',
      title:isTW?'想得很透，但做得太少':'想得很透，但做得太少',
      body:isTW
        ? '你對人生、價值觀、自我有很深的思考。這是一種難得的能力——大多數人一輩子都沒有認真想過這些問題。\n\n但問題是：思考本身不會改變現實。你可能已經在腦子裡規劃了無數次「理想人生」，但現實中的你，可能和五年前沒有太大區別。\n\n這不是因為你懶，而是因為「想清楚」和「做到」之間，隔著一個叫做「行動」的巨大鴻溝。而這個鴻溝，只有靠一次具體的行動才能跨越。\n\n建議：選一件你「早就知道該做但一直沒做」的小事——可能是更新履歷、報名一個課程、或者聯繫一個久未見面的朋友。\n\n不要想太多，現在就做。不需要完美，只需要完成。因為只有行動，才能把你腦子裡的藍圖變成現實。'
        : '你对人生、价值观、自我有很深的思考。这是一种难得的能力——大多数人一辈子都没有认真想过这些问题。\n\n但问题是：思考本身不会改变现实。你可能已经在脑子里规划了无数次「理想人生」，但现实中的你，可能和五年前没有太大区别。\n\n这不是因为你懒，而是因为「想清楚」和「做到」之间，隔着一个叫做「行动」的巨大鸿沟。而这个鸿沟，只有靠一次具体的行动才能跨越。\n\n建议：选一件你「早就知道该做但一直没做」的小事——可能是更新履历、报名一个课程、或者联系一个久未见面的朋友。\n\n不要想太多，现在就做。不需要完美，只需要完成。因为只有行动，才能把你脑子里的蓝图变成现实。'
    });
  }

  /* ── Pattern 4: The Balanced Achiever (all dimensions strong) ── */
  if(dimPct && dimPct.basic>=65 && dimPct.social>=65 && dimPct.identity>=65){
    rows.push({cls:'good',icon:'⭐',
      title:isTW?'難得的平衡者——但要小心舒適區':'难得的平衡者——但要小心舒适区',
      body:isTW
        ? '你在健康、職業、內在三個維度都維持著不錯的水準。這是一種很多人羨慕的狀態：沒有明顯的短板，生活整體上是順暢的。\n\n但這種狀態也有一個隱藏的風險：當一切都「還不錯」的時候，人會失去繼續突破的動力。你會開始習慣現狀，把「維持」當成目標，而不是「成長」。\n\n歷史上那些真正有所成就的人，往往不是因為他們起點多高，而是因為他們在「還不錯」的時候，選擇了繼續向前。\n\n建議：給自己設定一個「舒適區之外」的挑戰。可以是學習一項全新技能、嘗試一個完全不同的領域、或者主動承擔一個讓你感到緊張的項目。\n\n記住：成長從來不發生在舒適區裡。你已經證明了自己可以活得很好，現在是時候證明你可以活得精彩。'
        : '你在健康、职业、内在三个维度都维持着不错的水准。这是一种很多人羡慕的状态：没有明显的短板，生活整体上是顺畅的。\n\n但这种状态也有一个隐藏的风险：当一切都「还不错」的时候，人会失去继续突破的动力。你会开始习惯现状，把「维持」当成目标，而不是「成长」。\n\n历史上那些真正有所成就的人，往往不是因为他们起点多高，而是因为他们在「还不错」的时候，选择了继续向前。\n\n建议：给自己设定一个「舒适区之外」的挑战。可以是学习一项全新技能、尝试一个完全不同的领域、或者主动承担一个让你感到紧张的项目。\n\n记住：成长从不发生在舒适区里。你已经证明了自己可以活得很好，现在是时候证明你可以活得精彩。'
    });
  }

  /* ── Pattern 5: The Struggling Starter (all dimensions weak) ── */
  if(dimPct && dimPct.basic<=45 && dimPct.social<=45 && dimPct.identity<=45){
    rows.push({cls:'warn',icon:'🌧️',
      title:isTW?'此刻很難，但這不是終點':'此刻很难，但这不是终点',
      body:isTW
        ? '你的測試結果顯示，此刻的你可能正在經歷一段艱難的時期。健康、職業、內心狀態，似乎沒有一個維度是讓你滿意的。\n\n我想告訴你兩件事：\n\n第一，這種狀態是暫時的。幾乎每一個後來過得很好的人，都曾經有過類似的低谷時刻。低谷不代表你是失敗者，它只是人生的一個階段。\n\n第二，改變不需要從「全面改善」開始。事實上，試圖同時改變所有事情，往往會讓人更加沮喪。\n\n建議：只選一件事，一件最小的事，堅持做30天。可能是每天早睡半小時、每天散步20分鐘、或者每天存下10塊錢。\n\n不要小看這些微小的改變。它們的意義不在於改變本身，而在於證明給自己看：我可以。而這個「我可以」，會成為你走出低谷的第一步。'
        : '你的测试结果显示，此刻的你可能正在经历一段艰难的时期。健康、职业、内心状态，似乎没有一个维度是让你满意的。\n\n我想告诉你两件事：\n\n第一，这种状态是暂时的。几乎每一个后来过得很好的人，都曾经有过类似的低谷时刻。低谷不代表你是失败者，它只是人生的一个阶段。\n\n第二，改变不需要从「全面改善」开始。事实上，试图同时改变所有事情，往往会让人更加沮丧。\n\n建议：只选一件事，一件最小的事，坚持做30天。可能是每天早睡半小时、每天散步20分钟、或者每天存下10块钱。\n\n不要小看这些微小的改变。它们的意义不在于改变本身，而在于证明给自己看：我可以。而这个「我可以」，会成为你走出低谷的第一步。'
    });
  }

  /* ════════════════════════════════════════════════════════
     HEALTH & WELLNESS PATTERNS
     ════════════════════════════════════════════════════════ */

  /* ── Pattern 6: Health Neglect ── */
  var habitsScore=a('QK14'), visionScore=a('QK15a'), healthScore=a('QK15b');
  var sleepScore=a('QK16'), energyScore=a('QK17');
  var healthIssues=0;
  if(habitsScore>=3) healthIssues++;
  if(visionScore>=3) healthIssues++;
  if(healthScore>=2) healthIssues++;
  if(sleepScore>=3) healthIssues++;
  if(energyScore>=3) healthIssues++;

  if(healthIssues>=2){
    rows.push({cls:'warn',icon:'🏥',
      title:isTW?'你的身體正在發出警報':'你的身体正在发出警报',
      body:isTW
        ? '多個健康指標顯示，你的身體可能正在承受超出負荷的壓力。不良習慣、睡眠問題、慢性疲勞——這些不是「小毛病」，而是身體在用自己的方式告訴你：我需要被照顧了。\n\n很多人有一個誤區：覺得年輕就可以透支健康，等以後再補回來。但健康不是銀行存款，透支了可以還上。很多慢性病一旦形成，就是不可逆的。\n\n更重要的是：健康是所有其他維度的基礎。沒有好的身體，再高的收入、再成功的事業，都會失去意義。\n\n建議：本月內做三件事——\n① 預約一次全面體檢，了解自己的真實健康狀況\n② 選一個最容易改變的不良習慣（比如熬夜、久坐），用30天養成一個替代行為\n③ 每天給自己留15分鐘「什麼都不做」的時間，只是靜靜地坐著，讓大腦休息\n\n照顧好自己的身體，是對未來的自己最大的負責。'
        : '多个健康指标显示，你的身体可能正在承受超出负荷的压力。不良习惯、睡眠问题、慢性疲劳——这些不是「小毛病」，而是身体在用自己的方式告诉你：我需要被照顾了。\n\n很多人有一个误区：觉得年轻就可以透支健康，等以后再补回来。但健康不是银行存款，透支了可以还上。很多慢性病一旦形成，就是不可逆的。\n\n更重要的是：健康是所有其他维度的基础。没有好的身体，再高的收入、再成功的事业，都会失去意义。\n\n建议：本月内做三件事——\n① 预约一次全面体检，了解自己的真实健康状况\n② 选一个最容易改变的不良习惯（比如熬夜、久坐），用30天养成一个替代行为\n③ 每天给自己留15分钟「什么都不做」的时间，只是静静地坐着，让大脑休息\n\n照顾好自己的身体，是对未来的自己最大的负责。'
    });
  }

  /* ── Pattern 7: Energy Crisis ── */
  if(energyScore>=3 && sleepScore>=3){
    rows.push({cls:'warn',icon:'🔋',
      title:isTW?'你的能量正在枯竭':'你的能量正在枯竭',
      body:isTW
        ? '你報告了持續的疲勞感和睡眠問題。這不是「懶」或「不夠努力」，而是你的身心正在發出求救信號。\n\n長期的低能量狀態，往往不只是身體問題，而是生活方式整體失衡的結果。可能是工作壓力太大、可能是情緒消耗過多、也可能是你一直在做讓自己內耗的事。\n\n很多人面對這種狀態的反應是「撐下去」，覺得休息是浪費時間。但真相是：在能量枯竭的狀態下堅持，效率會低到可怕，而且會加速燃盡。\n\n建議：這週就做一件事——找到一個可以「真正休息」的方式。不是刷手機，不是看劇，而是讓大腦真正放鬆的事情。可能是散步、冥想、泡澡、或者只是發呆。\n\n每天給自己30分鐘這樣的時間，連續一週。你會驚訝地發現：當能量恢復了，很多事情會變得容易得多。'
        : '你报告了持续的疲劳感和睡眠问题。这不是「懒」或「不够努力」，而是你的身心正在发出求救信号。\n\n长期的低能量状态，往往不只是身体问题，而是生活方式整体失衡的结果。可能是工作压力太大、可能是情绪消耗过多、也可能是你一直在做让自己内耗的事。\n\n很多人面对这种状态的反应是「撑下去」，觉得休息是浪费时间。但真相是：在能量枯竭的状态下坚持，效率会低到可怕，而且会加速燃尽。\n\n建议：这周就做一件事——找到一个可以「真正休息」的方式。不是刷手机，不是看剧，而是让大脑真正放松的事情。可能是散步、冥想、泡澡、或者只是发呆。\n\n每天给自己30分钟这样的时间，连续一周。你会惊讶地发现：当能量恢复了，很多事情会变得容易得多。'
    });
  }

  /* ════════════════════════════════════════════════════════
     FINANCIAL PATTERNS
     ════════════════════════════════════════════════════════ */

  /* ── Pattern 8: Financial Vulnerability ── */
  var savings=a('QK19'), runway=a('QK20'), income=a('QK7');
  if(savings===0 && runway<=1){
    rows.push({cls:'warn',icon:'💸',
      title:isTW?'財務安全網幾乎為零':'财务安全网几乎为零',
      body:isTW
        ? '你的儲蓄水平和財務緩衝都處於極低區間。這意味著任何突發事件——失業、疾病、意外——都可能讓你陷入嚴重的財務困境。\n\n我知道，對很多人來說，「存錢」是一件說起來容易做起來難的事。房租、生活費、各種開銷，每個月的工資似乎總是不夠用。\n\n但這裡有一個你可能沒有想過的視角：存不下錢，往往不是因為賺太少，而是因為我們的消費習慣已經「自動化」了。很多支出，其實並不是真正的「必需」。\n\n建議：本月做一個簡單的實驗——\n① 記錄每一筆支出（不用很詳細，大概類別就行）\n② 月底回顧，找出三筆「花了但沒有真正帶來快樂」的錢\n③ 下個月，把這三筆錢自動轉到一個獨立帳戶，命名為「我的安全網」\n\n哪怕每個月只存下500塊，一年也有6000塊。這6000塊，可能就是你某次危機時的救命稻草。'
        : '你的储蓄水平和财务缓冲都处于极低区间。这意味着任何突发事件——失业、疾病、意外——都可能让你陷入严重的财务困境。\n\n我知道，对很多人来说，「存钱」是一件说起来容易做起来难的事。房租、生活费、各种开销，每个月的工资似乎总是不够用。\n\n但这里有一个你可能没有想过的视角：存不下钱，往往不是因为赚太少，而是因为我们的消费习惯已经「自动化」了。很多支出，其实并不是真正的「必需」。\n\n建议：本月做一个简单的实验——\n① 记录每一笔支出（不用很详细，大概类别就行）\n② 月底回顾，找出三笔「花了但没有真正带来快乐」的钱\n③ 下个月，把这三笔钱自动转到一个独立账户，命名为「我的安全网」\n\n哪怕每个月只存下500块，一年也有6000块。这6000块，可能就是你某次危机时的救命稻草。'
    });
  }

  /* ── Pattern 9: Income-Lifestyle Mismatch ── */
  if(income>=3 && savings<=1 && runway<=2){
    rows.push({cls:'warn',icon:'🕳️',
      title:isTW?'收入不錯，但錢總是留不住':'收入不错，但钱总是留不住',
      body:isTW
        ? '你的收入水平其實不算低，但儲蓄卻很少。這是一個很常見的現象，心理學家叫它「生活方式膨脹」——收入增加的同時，支出也同步增加，最後還是月月光。\n\n問題不在於你不會理財，而在於：我們的消費決策，很多時候是「自動駕駛」的。發了工資，先還信用卡、再交房租、然後各種訂閱服務自動扣款……還沒反應過來，錢就沒了。\n\n改變這種狀態的關鍵，不是「少花錢」，而是「改變花錢的順序」。\n\n建議：試試「先存後花」——\n發薪日的第二天，自動轉走薪水的10%到一個獨立帳戶（這個帳戶不要綁定任何支付工具）。\n\n10%聽起來不多，但如果你的月薪是8000，一年就是9600。更重要的是，你會開始建立「我有能力存錢」的信心。而這個信心，會讓存錢變得越來越容易。'
        : '你的收入水平其实不算低，但储蓄却很少。这是一个很常见的现象，心理学家叫它「生活方式膨胀」——收入增加的同时，支出也同步增加，最后还是月月光。\n\n问题不在于你不会理财，而在于：我们的消费决策，很多时候是「自动驾驶」的。发了工资，先还信用卡、再交房租、然后各种订阅服务自动扣款……还没反应过来，钱就没了。\n\n改变这种状态的关键，不是「少花钱」，而是「改变花钱的顺序」。\n\n建议：试试「先存后花」——\n发薪日的第二天，自动转走薪水的10%到一个独立账户（这个账户不要绑定任何支付工具）。\n\n10%听起来不多，但如果你的月薪是8000，一年就是9600。更重要的是，你会开始建立「我有能力存钱」的信心。而这个信心，会让存钱变得越来越容易。'
    });
  }

  /* ════════════════════════════════════════════════════════
     WORK & CAREER PATTERNS
     ════════════════════════════════════════════════════════ */

  /* ── Pattern 10: Burnout Risk ── */
  var overtime=a('QK12'), stress=a('QK13'), workLife=a('QK18');
  if((overtime>=3 && stress>=3) || (stress>=3 && workLife>=3)){
    rows.push({cls:'warn',icon:'🔥',
      title:isTW?'你離燃盡只差一步':'你离燃尽只差一步',
      body:isTW
        ? '高壓力、長工時、工作與生活失衡——這三個因素的組合，是職業倦怠的經典配方。\n\n倦怠不是「懶」或「不夠拼」，而是一種真實的身心耗竭狀態。它的症狀包括：持續疲勞、對工作失去熱情、效率下降、情緒低落、甚至身體出現各種不明原因的不適。\n\n很多人以為「撐過這段就好了」，但倦怠不會自己消失。如果不主動干預，它會持續惡化，最終可能導致嚴重的心理健康問題，甚至迫使你完全停下來。\n\n建議：本週就做這三件事——\n① 設定一個「每日停工時間」（比如晚上8點），超過這個時間，工作消息一律不回\n② 每天給自己留30分鐘「完全屬於自己」的時間，做一件與工作無關的事\n③ 找一個信任的人，告訴TA你現在的狀態。說出來本身就有療癒效果\n\n記住：休息不是獎勵，而是必需品。你不需要等到「完成所有事情」才休息，因為事情永遠做不完。'
        : '高压力、长工时、工作与生活失衡——这三个因素的组合，是职业倦怠的经典配方。\n\n倦怠不是「懒」或「不够拼」，而是一种真实的身心耗竭状态。它的症状包括：持续疲劳、对工作失去热情、效率下降、情绪低落、甚至身体出现各种不明原因的不适。\n\n很多人以为「撑过这段就好了」，但倦怠不会自己消失。如果不主动干预，它会持续恶化，最终可能导致严重的心理健康问题，甚至迫使你完全停下来。\n\n建议：本周就做这三件事——\n① 设定一个「每日停工时间」（比如晚上8点），超过这个时间，工作消息一律不回\n② 每天给自己留30分钟「完全属于自己」的时间，做一件与工作无关的事\n③ 找一个信任的人，告诉TA你现在的状态。说出来本身就有疗愈效果\n\n记住：休息不是奖励，而是必需品。你不需要等到「完成所有事情」才休息，因为事情永远做不完。'
    });
  }

  /* ── Pattern 11: Golden Cage ── */
  var satisfaction=a('QK39'), agency=a('QK37');
  if(income>=3 && (satisfaction>=3 || agency>=3)){
    rows.push({cls:'purple',icon:'🔒',
      title:isTW?'高薪的代價，你正在默默承受':'高薪的代价，你正在默默承受',
      body:isTW
        ? '你的收入不低，但你對工作的滿意度或掌控感卻很低。這是一個很多人正在經歷卻不敢承認的困境：高薪把你「困」在了一份並不喜歡的工作裡。\n\n這就是所謂的「金色牢籠」——看起來光鮮，實際上是一種隱形的囚禁。你不敢離開，因為怕找不到同樣薪水的工作；你不敢改變，因為怕失去現有的穩定。\n\n但這裡有一個你可能沒有想過的問題：如果繼續這樣下去，五年後的你會是什麼樣子？\n\n建議：做一個「最壞情況演練」——\n① 如果你明天辭職，最壞的結果是什麼？\n② 這個結果，你真的無法承受嗎？\n③ 為了避免這個結果，你現在可以做什麼準備？\n\n通常你會發現：真實的風險，遠小於你想像的。而「準備」這個行為本身，就會讓你感到更有掌控感。\n\n你不是一定要現在就辭職，但你應該開始為自己創造選擇權。'
        : '你的收入不低，但你对工作的满意度或掌控感却很低。这是一个很多人正在经历却不敢承认的困境：高薪把你「困」在了一份并不喜欢的工作里。\n\n这就是所谓的「金色牢笼」——看起来光鲜，实际上是一种隐形的囚禁。你不敢离开，因为怕找不到同样薪水的工作；你不敢改变，因为怕失去现有的稳定。\n\n但这里有一个你可能没有想过的问题：如果继续这样下去，五年后的你会是什么样子？\n\n建议：做一个「最坏情况演练」——\n① 如果你明天辞职，最坏的结果是什么？\n② 这个结果，你真的无法承受吗？\n③ 为了避免这个结果，你现在可以做什么准备？\n\n通常你会发现：真实的风险，远小于你想象的。而「准备」这个行为本身，就会让你感到更有掌控感。\n\n你不是一定要现在就辞职，但你应该开始为自己创造选择权。'
    });
  }

  /* ════════════════════════════════════════════════════════
     RELATIONSHIP PATTERNS
     ════════════════════════════════════════════════════════ */

  /* ── Pattern 12: Social Isolation ── */
  var confide=a('QK33'), friends=a('QK30'), familyClose=a('QK28a');
  if(confide===4 || (confide===-1 && friends>=3 && familyClose>=2)){
    rows.push({cls:'warn',icon:'🫂',
      title:isTW?'你身邊的人，可能比你想像的少':'你身边的人，可能比你想像的少',
      body:isTW
        ? '測試結果顯示，你可能缺乏可以真正傾訴的對象，同時與家人、朋友的連結也不夠緊密。\n\n在這個「社群媒體時代」，我們很容易有一種錯覺：認識很多人，有很多「朋友」。但真正的問題是：當你深夜難過的時候，你可以打電話給誰？當你遇到困難的時候，誰會毫不猶豫地幫你？\n\n研究顯示，社交孤立對健康的負面影響，相當於每天抽15根菸。我們是社會性動物，需要真實的連結才能健康生存。\n\n建議：本月嘗試做這三件事——\n① 聯繫一個很久沒見的老朋友，約出來喝杯咖啡，認真聊聊彼此的生活\n② 加入一個興趣社群（線上或線下都可以），認識一些有共同愛好的人\n③ 每週給家人打一次電話，不是為了「完成任務」，而是真正關心他們的近況\n\n建立關係需要時間，但第一步永遠是「主動」。你不需要有很多朋友，你只需要有幾個真正懂你的人。'
        : '测试结果显示，你可能缺乏可以真正倾诉的对象，同时与家人、朋友的连结也不够紧密。\n\n在这个「社交媒体时代」，我们很容易有一种错觉：认识很多人，有很多「朋友」。但真正的问题是：当你深夜难过的时候，你可以打电话给谁？当你遇到困难的时候，谁会毫不犹豫地帮你？\n\n研究显示，社交孤立对健康的负面影响，相当于每天抽15根烟。我们是社会性动物，需要真实的连结才能健康生存。\n\n建议：本月尝试做这三件事——\n① 联系一个很久没见的老朋友，约出来喝杯咖啡，认真聊聊彼此的生活\n② 加入一个兴趣社群（线上或线下都可以），认识一些有共同爱好的人\n③ 每周给家人打一次电话，不是为了「完成任务」，而是真正关心他们的近况\n\n建立关系需要时间，但第一步永远是「主动」。你不需要有很多朋友，你只需要有几个真正懂你的人。'
    });
  }

  /* ── Pattern 13: Relationship Crisis ── */
  var romantic=a('QK23'), relationshipStress=a('QK24');
  if((romantic>=5 && romantic<=8) || (romantic>=0 && romantic<=3 && relationshipStress>=3)){
    rows.push({cls:'warn',icon:'💔',
      title:isTW?'你的感情，可能正在消耗你':'你的感情，可能正在消耗你',
      body:isTW
        ? '測試結果顯示，你的親密關係可能正處於高壓狀態——無論是正在經歷危機，還是關係本身帶來了巨大的壓力。\n\n親密關係的問題有一個特點：它會像漏水的水管一樣，持續消耗你在其他所有維度的能量。你可能發現自己工作效率下降、情緒變得易怒、對其他事情也失去了興趣。\n\n很多人面對這種狀態的反應是「想辦法解決問題」，但這可能不是最好的第一步。當你處於高壓情緒中時，你的判斷力會受到嚴重影響，這時做出的決定往往會讓事情變得更糟。\n\n建議：在做任何重大決定之前，先做這三件事——\n① 找到一個安全的情緒出口：約一位信任的朋友深聊，或者預約一次心理諮詢\n② 每天給自己留30分鐘「與關係無關」的時間，做一件讓自己平靜的事\n③ 如果可能的話，和伴侶約定一個「冷靜期」——在這段時間裡，雙方都不討論敏感的話題\n\n記住：你的情緒健康比這段關係更重要。先讓自己回到基準線，再決定下一步該怎麼走。'
        : '测试结果显示，你的亲密关系可能正处于高压状态——无论是正在经历危机，还是关系本身带来了巨大的压力。\n\n亲密关系的问题有一个特点：它会像漏水的水管一样，持续消耗你在其他所有维度的能量。你可能发现自己工作效率下降、情绪变得易怒、对其他事情也失去了兴趣。\n\n很多人面对这种状态的反应是「想办法解决问题」，但这可能不是最好的第一步。当你处于高压情绪中时，你的判断力会受到严重影响，这时做出的决定往往会让事情变得更糟。\n\n建议：在做任何重大决定之前，先做这三件事——\n① 找到一个安全的情绪出口：约一位信任的朋友深聊，或者预约一次心理咨询\n② 每天给自己留30分钟「与关系无关」的时间，做一件让自己平静的事\n③ 如果可能的话，和伴侣约定一个「冷静期」——在这段时间里，双方都不讨论敏感的话题\n\n记住：你的情绪健康比这段关系更重要。先让自己回到基准线，再决定下一步该怎么走。'
    });
  }

  /* ════════════════════════════════════════════════════════
     INNER WORLD PATTERNS
     ════════════════════════════════════════════════════════ */

  /* ── Pattern 14: Growth Mindset ── */
  var curiosity=a('QK34'), persist=a('QK35'), emotion=a('QK36');
  if(curiosity<=1 && persist<=1 && emotion<=1){
    rows.push({cls:'good',icon:'💎',
      title:isTW?'你擁有稀缺的「成長型人格」':'你拥有稀缺的「成长型人格」',
      body:isTW
        ? '好奇心、堅持力、情緒穩定性——這三項能力的組合，在心理學中被稱為「成長型人格」。擁有它的人，在面對挫折時恢復更快，長期成就的上限也更高。\n\n更難得的是，這些特質很大程度上是天生的，或者是在早年形成的。這意味著你擁有一個很多人羨慕的「內在優勢」。\n\n但擁有優勢只是起點，關鍵是如何利用它。很多擁有成長型人格的人，因為太習慣自己的「穩定」，反而選擇了過於保守的路徑，最終沒有發揮出應有的潛力。\n\n建議：利用你的情緒穩定性和堅持力，去挑戰一個讓你感到興奮但有點害怕的目標。\n\n你的內在系統足夠強大，可以承受失敗和挫折。而這些失敗和挫折，會讓你成長得更快。不要浪費你的天賦。'
        : '好奇心、坚持力、情绪稳定性——这三项能力的组合，在心理学中被称为「成长型人格」。拥有它的人，在面对挫折时恢复更快，长期成就的上限也更高。\n\n更难得的是，这些特质很大程度上是天生的，或者是在早年形成的。这意味着你拥有一个很多人羡慕的「内在优势」。\n\n但拥有优势只是起点，关键是如何利用它。很多拥有成长型人格的人，因为太习惯自己的「稳定」，反而选择了过于保守的路径，最终没有发挥出应有的潜力。\n\n建议：利用你的情绪稳定性和坚持力，去挑战一个让你感到兴奋但有点害怕的目标。\n\n你的内在系统足够强大，可以承受失败和挫折。而这些失败和挫折，会让你成长得更快。不要浪费你的天赋。'
    });
  }

  /* ── Pattern 15: Emotional Struggle ── */
  if(emotion>=3 && (stress>=2 || overtime>=2)){
    rows.push({cls:'warn',icon:'🌊',
      title:isTW?'你的情緒正在超負荷運轉':'你的情绪正在超负荷运转',
      body:isTW
        ? '情緒管理能力偏弱，同時又處於高壓環境中——這是一個危險的組合。\n\n很多人有一個誤解：覺得情緒問題是「軟弱」的表現，應該靠意志力克服。但情緒和大腦的生理機制密切相關，當壓力持續超過負荷時，任何人都會出現情緒問題。這不是軟弱，這是正常的人類反應。\n\n問題在於：如果我們不及時處理，情緒問題會逐漸累積，最終可能發展成焦慮症、抑鬱症等更嚴重的心理健康問題。\n\n建議：本週就做這兩件事——\n① 下載一個冥想App（如潮汐、小睡眠、Headspace），每天睡前做5-10分鐘的呼吸練習。這不是「玄學」，而是經過科學驗證的情緒調節方法\n② 找一個你信任的人，花15分鐘把你最近的壓力說出來。不需要對方給解決方案，只是說出來本身就有療癒效果\n\n記住：照顧自己的情緒，和照顧自己的身體一樣重要。你不需要等到「崩潰」才求助。'
        : '情绪管理能力偏弱，同时又处于高压环境中——这是一个危险的组合。\n\n很多人有一个误解：觉得情绪问题是「软弱」的表现，应该靠意志力克服。但情绪和大脑的生理机制密切相关，当压力持续超过负荷时，任何人都会出现情绪问题。这不是软弱，这是正常的人类反应。\n\n问题在于：如果我们不及时处理，情绪问题会逐渐累积，最终可能发展成焦虑症、抑郁症等更严重的心理健康问题。\n\n建议：本周就做这两件事——\n① 下载一个冥想App（如潮汐、小睡眠、Headspace），每天睡前做5-10分钟的呼吸练习。这不是「玄学」，而是经过科学验证的情绪调节方法\n② 找一个你信任的人，花15分钟把你最近的压力说出来。不需要对方给解决方案，只是说出来本身就有疗愈效果\n\n记住：照顾自己的情绪，和照顾自己的身体一样重要。你不需要等到「崩溃」才求助。'
    });
  }

  /* ════════════════════════════════════════════════════════
     LIFE STAGE PATTERNS
     ════════════════════════════════════════════════════════ */

  /* ── Pattern 16: Young Explorer (under 25) ── */
  var age=a('QK1');
  if(age<=1 && curiosity<=2){
    rows.push({cls:'good',icon:'🌅',
      title:isTW?'25歲前，你的試錯成本最低':'25岁前，你的试错成本最低',
      body:isTW
        ? '你還年輕，而且擁有強烈的好奇心——這是人生中一個非常珍貴的組合。\n\n很多人25歲後最後悔的，不是「做錯了什麼」，而是「沒有嘗試過什麼」。因為一旦進入30歲，家庭、房貸、職業路徑的慣性，會讓改變變得越來越難。\n\n你現在擁有的最大資產，不是技能，不是經驗，而是「時間」和「可塑性」。你可以承受失敗，可以承受走彎路，因為你有足夠的時間重新開始。\n\n建議：趁著年輕，大膽去試——\n① 嘗試不同的行業、不同的城市、不同的生活方式\n② 不要急著「定下來」，先找到自己真正熱愛的事情\n③ 建立一些可以持續一生的好習慣（運動、閱讀、儲蓄）\n\n記住：25歲前的每一次「錯誤」，都是在為30歲後的正確選擇積累數據。不要害怕走彎路，害怕的是從來沒有出發。'
        : '你还年轻，而且拥有强烈的好奇心——这是人生中一个非常珍贵的组合。\n\n很多人25岁最后悔的，不是「做错了什么」，而是「没有尝试过什么」。因为一旦进入30岁，家庭、房贷、职业路径的惯性，会让改变变得越来越难。\n\n你现在拥有的最大资产，不是技能，不是经验，而是「时间」和「可塑性」。你可以承受失败，可以承受走弯路，因为你有足够的时间重新开始。\n\n建议：趁着年轻，大胆去试——\n① 尝试不同的行业、不同的城市、不同的生活方式\n② 不要急着「定下来」，先找到自己真正热爱的事情\n③ 建立一些可以持续一生的好习惯（运动、阅读、储蓄）\n\n记住：25岁前的每一次「错误」，都是在为30岁后的正确选择积累数据。不要害怕走弯路，害怕的是从来没有出发。'
    });
  }

  /* ── Pattern 17: Mid-life Transition (35-50) ── */
  if(age>=3 && age<=4 && dimPct && dimPct.social<=55 && dimPct.identity>=60){
    rows.push({cls:'purple',icon:'🌊',
      title:isTW?'35歲後，是時候問自己一些問題了':'35岁后，是时候问自己一些问题了',
      body:isTW
        ? '你可能已經在職場打滾了十幾年，有了穩定的收入和一定的社會地位。但與此同時，你可能也開始感到一種說不清的「空虛」——好像擁有了很多，卻不知道這一切是為了什麼。\n\n這不是「中年危機」的陳詞濫調，而是一個真實的人生階段：當外在的追求達到一定程度後，我們會自然開始追問內在的意義。\n\n這種追問可能會讓你感到不安，但它其實是一個禮物——它在提醒你：人生不只有一種活法，而你還有時間去選擇。\n\n建議：找一個安靜的週末，認真回答這些問題——\n① 如果明天我不需要為錢工作，我會選擇做什麼？\n② 什麼事情讓我感到真正的滿足（不是成就感，是滿足）？\n③ 我希望十年後的自己，過著什麼樣的生活？\n\n這些問題沒有標準答案，但思考它們，會幫助你找到下一個階段的方向。'
        : '你可能已经在职场打滚了十几年，有了稳定的收入和一定的社会地位。但与此同时，你可能也开始感到一种说不清的「空虚」——好像拥有了很多，却不知道这一切是为了什么。\n\n这不是「中年危机」的陈词滥调，而是一个真实的人生阶段：当外在的追求达到一定程度后，我们会自然开始追问内在的意义。\n\n这种追问可能会让你感到不安，但它其实是一个礼物——它在提醒你：人生不只有一种活法，而你还有时间去选择。\n\n建议：找一个安静的周末，认真回答这些问题——\n① 如果明天我不需要为钱工作，我会选择做什么？\n② 什么事情让我感到真正的满足（不是成就感，是满足）？\n③ 我希望十年后的自己，过着什么样的生活？\n\n这些问题没有标准答案，但思考它们，会帮助你找到下一个阶段的方向。'
    });
  }

  /* ════════════════════════════════════════════════════════
     LIFESTYLE PATTERNS
     ════════════════════════════════════════════════════════ */

  /* ── Pattern 18: Sedentary Lifestyle ── */
  if(answerMap['QK14'] && Array.isArray(answerMap['QK14'].selectedIndices)){
    var habits14=answerMap['QK14'].selectedIndices;
    var hasSedentary=habits14.indexOf(1)>=0;
    var hasScreen=habits14.indexOf(6)>=0;
    var hasLateNight=habits14.indexOf(4)>=0;
    if(hasSedentary && (hasScreen || hasLateNight)){
      rows.push({cls:'warn',icon:'📱',
        title:isTW?'現代生活的隱形殺手，正在影響你':'现代生活的隐形杀手，正在影响你',
        body:isTW
          ? '久坐、長時間盯著螢幕、熬夜——這三個習慣的組合，是現代都市人的「健康殺手三件套」。\n\n它們不會讓你立刻生病，但會在不知不覺中侵蝕你的健康：頸椎和腰椎開始僵硬、視力逐漸下降、睡眠質量變差、白天越來越沒精神。\n\n很多人知道這些習慣不好，但改變起來卻很難。問題在於：我們總是想「從明天開始徹底改變」，結果明天永遠沒有到來。\n\n建議：不要試圖一次性改變所有習慣，而是從最小的一步開始——\n① 在手機上設置每小時一次的提醒，每次站起來做2分鐘的拉伸（重點是頸部和腰部）\n② 晚上10點後，把手機螢幕設為灰階模式（這會讓你自然失去刷屏的慾望）\n③ 每天比現在早睡15分鐘，堅持一週後再提早15分鐘\n\n記住：改變不需要完美，只需要持續。哪怕每天只進步1%，一年後就是37倍的成長。'
          : '久坐、长时间盯着屏幕、熬夜——这三个习惯的组合，是现代都市人的「健康杀手三件套」。\n\n它们不会让你立刻生病，但会在不知不觉中侵蚀你的健康：颈椎和腰椎开始僵硬、视力逐渐下降、睡眠质量变差、白天越来越没精神。\n\n很多人知道这些习惯不好，但改变起来却很难。问题在于：我们总想「从明天开始彻底改变」，结果明天永远没有到来。\n\n建议：不要试图一次性改变所有习惯，而是从最小的一步开始——\n① 在手机上设置每小时一次的提醒，每次站起来做2分钟的拉伸（重点是颈部和腰部）\n② 晚上10点后，把手机屏幕设为灰阶模式（这会让你自然失去刷屏的欲望）\n③ 每天比现在早睡15分钟，坚持一周后再提早15分钟\n\n记住：改变不需要完美，只需要持续。哪怕每天只进步1%，一年后就是37倍的成长。'
      });
    }
  }

  /* ════════════════════════════════════════════════════════
     FALLBACK — When no specific patterns match
     ════════════════════════════════════════════════════════ */

  if(!rows.length){
    var weakest=getWeakestDim();
    var strongest=getStrongestDim();
    var dimNames={basic:isTW?'健康與基礎':'健康与基础',social:isTW?'職業與社交':'职业与社交',identity:isTW?'內在與認同':'内在与认同'};

    rows.push({cls:'good',icon:'📊',
      title:isTW?'你的整體狀態相對均衡':'你的整体状态相对均衡',
      body:isTW
        ? '測試結果顯示，你的各項指標沒有觸發特定的風險預警，整體處於相對穩定的狀態。\n\n這是一個不錯的起點，但「穩定」不代表「完美」。每個人都有自己的成長空間，關鍵是找到最值得投入精力的方向。\n\n從你的測試結果來看：\n• 你的「'+dimNames[strongest]+'」維度表現較好，這是你的優勢所在\n• 你的「'+dimNames[weakest]+'」維度相對較弱，可能是優先改善的方向\n\n建議：選擇一個你最感興趣、也最願意投入時間的維度，制定一個30天的改善計劃。不需要很宏大，只需要具體可行。\n\n記住：成長不是一蹴而就的，而是由無數個小進步累積而成。'
        : '测试结果显示，你的各项指标没有触发特定的风险预警，整体处于相对稳定的状态。\n\n这是一个不错的起点，但「稳定」不代表「完美」。每个人都有自己的成长空间，关键是找到最值得投入精力的方向。\n\n从你的测试结果来看：\n• 你的「'+dimNames[strongest]+'」维度表现较好，这是你的优势所在\n• 你的「'+dimNames[weakest]+'」维度相对较弱，可能是优先改善的方向\n\n建议：选择一个你最感兴趣、也最愿意投入时间的维度，制定一个30天的改善计划。不需要很宏大，只需要具体可行。\n\n记住：成长不是一蹴而就的，而是由无数个小进步累积而成。'
    });
  }

  /* ════════════════════════════════════════════════════════
     RENDER INSIGHTS
     ════════════════════════════════════════════════════════ */

  rows.forEach(function(r){
    var el=document.createElement('div');
    el.className='insight-row'+(r.cls==='warn'?' insight-row--warn':r.cls==='good'?' insight-row--good':r.cls==='purple'?' insight-row--purple':'');
    el.innerHTML='<div class="ir-title"><span>'+r.icon+'</span> '+r.title+'</div><div class="ir-body">'+r.body+'</div>';
    c.appendChild(el);
  });
}


/* ══════════════════════════════════════════════════════
   PERSONA / TIER SYSTEM — Animal Archetypes
   ══════════════════════════════════════════════════════ */

var PERSONAS = {
  S: {
    animal:'🍣', name_cn:'蓝鳍金枪鱼大腹', name_tw:'藍鰭金槍魚大腹', tier:'S',
    title_cn:'S级 · 奇迹般的蓝鳍金枪鱼大腹',
    title_tw:'S級 · 奇蹟般的藍鰭金槍魚大腹',
    quote_cn:'我这么顶级，跟蓝旗金枪鱼一样顶！',
    quote_tw:'我這麼頂級，跟藍旗金槍魚一樣頂！',
    traits_cn:['顶级稀缺','深海极品','一口千金','可遇不可求'],
    traits_tw:['頂級稀缺','深海極品','一口千金','可遇不可求'],
    desc_cn:'<span class="p-quote">你这么顶级，跟海里的蓝旗金枪鱼一样顶。</span>',
    desc_tw:'<span class="p-quote">你這麼頂級，跟海裡的藍旗金槍魚一樣頂。</span>',
  },
  A: {
    animal:'🥩', name_cn:'顶级和牛牛排', name_tw:'頂級和牛牛排', tier:'A',
    title_cn:'A级 · 香香的顶级和牛牛排',
    title_tw:'A級 · 香香的頂級和牛牛排',
    quote_cn:'万里挑一的油花是被时间养出来的，不是被催出来的——别急着证明熟度。',
    quote_tw:'萬里挑一的油花是被時間養出來的，不是被催出來的——別急著證明熟度。',
    traits_cn:['极致油花','入口即化','万里挑一','人见人爱'],
    traits_tw:['極致油花','入口即化','萬里挑一','人見人愛'],
    desc_cn:'<span class="p-quote">如果你是一种食物，那你就是它。这么鲜美的肉，万里挑一，万中挑一。</span>',
    desc_tw:'<span class="p-quote">如果你是一種食物，那你就是它。這麼鮮美的肉，萬里挑一，萬中挑一。</span>',
  },
  B: {
    animal:'🍰', name_cn:'贵水果大蛋糕', name_tw:'貴水果大蛋糕', tier:'B',
    title_cn:'B级 · 精品绝伦黑加仑树莓樱桃乱七八糟的贵水果大蛋糕',
    title_tw:'B級 · 精品絕倫黑加侖樹莓櫻桃亂七八糟的貴水果大蛋糕',
    quote_cn:'我的人生很甜美，很精致，还有点小贵。',
    quote_tw:'我的人生很甜美，很精緻，還有點小貴。',
    traits_cn:['真奶油','贵水果','丰饶质地'],
    traits_tw:['真奶油','貴水果','豐饒質地'],
    desc_cn:'<span class="p-quote">挺棒的，且不论那么多贵的离谱的水果，甚至还是动物奶油呢。</span>',
    desc_tw:'<span class="p-quote">挺棒的，且不論那麼多貴的離譜的水果，甚至還是動物奶油呢。</span>',
  },
  C: {
    animal:'🥯', name_cn:'街头小吃', name_tw:'街頭小吃', tier:'C',
    title_cn:'C级 · 油条豆腐脑煎饼肠粉你自己选一样吧',
    title_tw:'C級 · 油條豆腐腦煎餅腸粉你自己選一樣吧',
    quote_cn:'挺好的，味道赞价格赞，我在性价比这块儿谁都比不过。',
    quote_tw:'挺好的，味道讚價格贊，我在性價比這塊兒誰都比不過。。',
    traits_cn:['性价比之王','能量充足','皮实耐造'],
    traits_tw:['性價比之王','能量充足','皮實耐造'],
    desc_cn:'<span class="p-quote">挺好的，味道赞价格赞，性价比这块儿谁都比不过。</span>',
    desc_tw:'<span class="p-quote">挺好的，味道讚價格讚，性價比這塊兒誰都比不過。</span>',
  },
  D: {
    animal:'🍱', name_cn:'家常剩菜', name_tw:'家常剩菜', tier:'D',
    title_cn:'D级 · 冰箱里的家常剩菜',
    title_tw:'D級 · 冰箱裡的家常剩菜',
    quote_cn:'冰箱里有啥就吃啥，生活不易，珍惜食物吧，活着本身就是答案。',
    quote_tw:'冰箱裡有啥就吃啥，生活不易，珍惜食物吧，活著本身就是答案。',
    traits_cn:['实用至上','生存模式','有得吃','能续命'],
    traits_tw:['實用至上','生存模式','有得吃','能續命'],
    desc_cn:'<span class="p-quote">冰箱里有啥就吃啥，生活不易，珍惜食物吧。</span>',
    desc_tw:'<span class="p-quote">冰箱裡有啥就吃啥，生活不易，珍惜食物吧。</span>',
  },
  E: {
    animal:'🚽', name_cn:'马桶', name_tw:'馬桶', tier:'E',
    /* Tier E uses gender-dynamic title — resolved in getPersona().
       title_cn_m / title_tw_m → male  ("兄弟")
       title_cn_f / title_tw_f → female ("姐妹") */
    title_cn_m:'E级 · 兄弟',
    title_cn_f:'E级 · 姐妹',
    title_tw_m:'E級 · 兄弟',
    title_tw_f:'E級 · 姐妹',
    /* Neutral fallbacks for any consumer that bypasses getPersona(). */
    title_cn:'E级 · 朋友',
    title_tw:'E級 · 朋友',
    quote_cn:'什么都别说了，加油吧。',
    quote_tw:'什麽都別説了，加油吧。',
    traits_cn:['抗压神器'],
    traits_tw:['抗壓神器'],
    desc_cn:'<span class="p-quote">努力活着，最重要。</span>',
    desc_tw:'<span class="p-quote">努力活著，最重要。</span>',
  },
};

/* ── Tier E gender resolver ────────────────────────────────────────────
   Tier E (马桶 / Toilet) is the only tier whose title is gender-dynamic:
   "兄弟" (brother) for male, "姐妹" (sister) for female. This helper
   reads gender from answerMap and returns a shallow-copied PERSONAS.E
   with title_cn / title_tw resolved. All other personas are returned
   as-is from the dict.                                                  */
function resolveTierE(){
  var isFemale = false;
  if(typeof answerMap !== 'undefined' && answerMap){
    var gq = answerMap['QK2'] || answerMap['A0'] || answerMap['q_gender'];
    if(gq && gq.questionIdx === 1) isFemale = true;
  }
  var base = PERSONAS.E;
  var resolved = {};
  for(var k in base){ if(Object.prototype.hasOwnProperty.call(base, k)) resolved[k] = base[k]; }
  resolved.title_cn = isFemale ? base.title_cn_f : base.title_cn_m;
  resolved.title_tw = isFemale ? base.title_tw_f : base.title_tw_m;
  return resolved;
}

function getPersona(){
  if(finalScore>=120) return PERSONAS.S;
  if(finalScore>=85)  return PERSONAS.A;
  if(finalScore>=55)  return PERSONAS.B;
  if(finalScore>=35)  return PERSONAS.C;
  if(finalScore>=20)  return PERSONAS.D;
  return resolveTierE();
}

function buildPersona(lang){
  var p=getPersona();
  var isTW=lang==='zh-TW';

  /* Step 1: dynamic tier class on the card itself */
  var card=document.getElementById('personaCard');
  if(card) card.className='result-card persona-card persona-tier-'+String(p.tier).toLowerCase();

  var el=document.getElementById('personaAnimal'); if(el) el.textContent=p.animal;
  var tierEl=document.getElementById('personaTier'); if(tierEl) tierEl.textContent=p.tier+(isTW?'級':'级');
  var nameEl=document.getElementById('personaName'); if(nameEl) nameEl.textContent=isTW?p.title_tw:p.title_cn;
  /* Use innerHTML so <br> + <span class="p-quote"> in desc strings render */
  var desc=document.getElementById('personaDesc'); if(desc) desc.innerHTML=isTW?p.desc_tw:p.desc_cn;
  var traits=document.getElementById('personaTraits');
  if(traits){
    var arr=isTW?p.traits_tw:p.traits_cn;
    traits.innerHTML=arr.map(function(t){ return '<span class="persona-trait">'+t+'</span>'; }).join('');
  }

  /* ── Dimension mini-bars + stats: REMOVED for poster redesign.
        The food persona card now ends after the trait tags. */
  var dimsEl=document.getElementById('personaDims');
  if(dimsEl){ dimsEl.innerHTML=''; dimsEl.style.display='none'; }
  var nextTierEl=document.getElementById('personaNextTier');
  if(nextTierEl){ nextTierEl.innerHTML=''; nextTierEl.style.display='none'; }
  if(false && dimsEl && dimPct){
    var dimConf=[
      {key:'basic',   label_cn:'基础维度',     label_tw:'基礎維度',     color:'#7dd3fc'},
      {key:'social',  label_cn:'社会生活方向', label_tw:'社會生活方向', color:'#0ea5e9'},
      {key:'identity',label_cn:'个人认同',     label_tw:'個人認同',     color:'#10b981'},
    ];
    var strongest=null, weakest=null, sVal=-1, wVal=999;
    dimConf.forEach(function(d){
      var v=dimPct[d.key]||0;
      if(v>sVal){sVal=v;strongest=d;}
      if(v<wVal){wVal=v;weakest=d;}
    });

    var barsHtml=dimConf.map(function(d){
      var v=dimPct[d.key]||0;
      var vw=visualPct(v);
      return '<div class="pdim-row">'+
        '<div class="pdim-label">'+(isTW?d.label_tw:d.label_cn)+'</div>'+
        '<div class="pdim-track"><div class="pdim-fill" data-vw="'+vw+'" style="width:0;--dim-color:'+d.color+';background:linear-gradient(to right, transparent, '+d.color+');"></div></div>'+
        '<div class="pdim-val">'+v+'</div>'+
      '</div>';
    }).join('');

    /* Stats grid */
    var statsHtml=
      '<div class="persona-stats">'+
        '<div class="pstat-item"><div class="pstat-val">'+finalScore+'</div><div class="pstat-label">'+(isTW?'綜合分':'综合分')+'</div></div>'+
        '<div class="pstat-item"><div class="pstat-val">'+(bonusScore>0?'+'+bonusScore:'0')+'</div><div class="pstat-label">'+(isTW?'加分題':'加分题')+'</div></div>'+
      '</div>';

    dimsEl.innerHTML=barsHtml+statsHtml;
    setTimeout(function(){
      dimsEl.querySelectorAll('.pdim-fill').forEach(function(f){f.style.width=f.dataset.vw+'%';});
    },400);
  }

  /* ── Section preludes (CN/TW) ───────────────────────────────────────── */
  var pPersonaText = document.querySelector('.prelude-persona .sp-text');
  if(pPersonaText){
    pPersonaText.textContent = isTW
      ? '如果你是一種食物，那麼你就是'
      : '如果你是一种食物，那么你就是';
  }
  var pRankText = document.querySelector('.prelude-rank .sp-text');
  if(pRankText){
    pRankText.textContent = isTW
      ? '你的人生軍銜是——'
      : '你的人生军衔是——';
  }

  /* ── Tier classification — now lives in standalone #rankCard ──
        We tag #rankCard with a phase class so its decoupled CSS theme
        (junior / field / general) can render unobstructed by the food
        persona card's gradient. The inner #personaTierSection still
        holds the actual military progress bar markup. */
  var rankCard = document.getElementById('rankCard');
  if(rankCard){
    var phase;
    if(finalScore >= 101)      phase = 'general';   /* 少将 / 中将 / 一级上将 */
    else if(finalScore >= 51)  phase = 'field';     /* 少校 → 大校 */
    else                       phase = 'junior';    /* 列兵 → 上尉 */
    rankCard.className = 'result-card rank-card rank-phase-'+phase;
  }
  var tierSec=document.getElementById('personaTierSection');
  if(tierSec){
    renderMilitaryProgressBar(tierSec, finalScore, isTW);
  }

  /* ── Next tier preview — HIDDEN ── */
  var nextEl=document.getElementById('personaNextTier');
  if(nextEl){
    nextEl.style.display='none';
  }
}


/* ════════════════════════════════════════════════════════════════════════
   USER TIER SYSTEM — 11-rank military classification based on score
   ────────────────────────────────────────────────────────────────────────
   Only rank title + score band is used. No subtitles, no descriptions, no
   trait tags — the rank name itself is the label, and deep analysis is
   delegated to the LLM feedback layer.
   ════════════════════════════════════════════════════════════════════════ */

var USER_TIERS = {
  /* 一级上将 (136-150) — 万里挑一 */
  general: {
    id: 'general',
    cn: { title: '一级上将', desc: '万里挑一' },
    tw: { title: '一級上將', desc: '萬裡挑一' },
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    icon: '⭐',
    minScore: 136,
    maxScore: 150
  },
  /* 中将 (121-135) — 千里挑一 */
  lieutenantGeneral: {
    id: 'lieutenantGeneral',
    cn: { title: '中将', desc: '千里挑一' },
    tw: { title: '中將', desc: '千裡挑一' },
    color: '#E6B800',
    bgGradient: 'linear-gradient(135deg, #F5CF47 0%, #D4A017 100%)',
    icon: '🎖️',
    minScore: 121,
    maxScore: 135
  },
  /* 少将 (101-120) — 百里挑一 */
  majorGeneral: {
    id: 'majorGeneral',
    cn: { title: '少将', desc: '百里挑一' },
    tw: { title: '少將', desc: '百裡挑一' },
    color: '#C0C0C0',
    bgGradient: 'linear-gradient(135deg, #E8E8E8 0%, #A8A8A8 100%)',
    icon: '🎖️',
    minScore: 101,
    maxScore: 120
  },
  /* 大校 (81-100) — 人中翘楚 */
  seniorColonel: {
    id: 'seniorColonel',
    cn: { title: '大校', desc: '人中翘楚' },
    tw: { title: '大校', desc: '人中翹楚' },
    color: '#8E6F3E',
    bgGradient: 'linear-gradient(135deg, #C19A6B 0%, #8E6F3E 100%)',
    icon: '🏅',
    minScore: 81,
    maxScore: 100
  },
  /* 上校 (71-80) — 出类拔萃 */
  colonel: {
    id: 'colonel',
    cn: { title: '上校', desc: '出类拔萃' },
    tw: { title: '上校', desc: '出類拔萃' },
    color: '#6B8E23',
    bgGradient: 'linear-gradient(135deg, #9CB872 0%, #6B8E23 100%)',
    icon: '🏅',
    minScore: 71,
    maxScore: 80
  },
  /* 中校 (61-70) — 略胜一筹 */
  lieutenantColonel: {
    id: 'lieutenantColonel',
    cn: { title: '中校', desc: '略胜一筹' },
    tw: { title: '中校', desc: '略勝一籌' },
    color: '#4A7A2A',
    bgGradient: 'linear-gradient(135deg, #7CA55A 0%, #4A7A2A 100%)',
    icon: '🏅',
    minScore: 61,
    maxScore: 70
  },
  /* 少校 (51-60) — 芸芸众生 */
  major: {
    id: 'major',
    cn: { title: '少校', desc: '芸芸众生' },
    tw: { title: '少校', desc: '芸芸眾生' },
    color: '#2E7D32',
    bgGradient: 'linear-gradient(135deg, #66BB6A 0%, #2E7D32 100%)',
    icon: '🎗️',
    minScore: 51,
    maxScore: 60
  },
  /* 上尉 (41-50) — 平凡之辈 */
  captain: {
    id: 'captain',
    cn: { title: '上尉', desc: '平凡之辈' },
    tw: { title: '上尉', desc: '平凡之輩' },
    color: '#1976D2',
    bgGradient: 'linear-gradient(135deg, #64B5F6 0%, #1976D2 100%)',
    icon: '🎗️',
    minScore: 41,
    maxScore: 50
  },
  /* 中尉 (31-40) — 艰辛相伴 */
  firstLieutenant: {
    id: 'firstLieutenant',
    cn: { title: '中尉', desc: '艰辛相伴' },
    tw: { title: '中尉', desc: '艱辛相伴' },
    color: '#1565C0',
    bgGradient: 'linear-gradient(135deg, #5C9DD8 0%, #1565C0 100%)',
    icon: '🎗️',
    minScore: 31,
    maxScore: 40
  },
  /* 少尉 (21-30) — 步履维艰 */
  secondLieutenant: {
    id: 'secondLieutenant',
    cn: { title: '少尉', desc: '步履维艰' },
    tw: { title: '少尉', desc: '步履維艱' },
    color: '#0D47A1',
    bgGradient: 'linear-gradient(135deg, #4A8CCB 0%, #0D47A1 100%)',
    icon: '🎗️',
    minScore: 21,
    maxScore: 30
  },
  /* 列兵 (0-20) — 人生悲剧 */
  private: {
    id: 'private',
    cn: { title: '列兵', desc: '人生悲剧' },
    tw: { title: '列兵', desc: '人生悲劇' },
    color: '#616161',
    bgGradient: 'linear-gradient(135deg, #9E9E9E 0%, #616161 100%)',
    icon: '🪖',
    minScore: 0,
    maxScore: 20
  }
};

/* Get user tier based on score */
function getUserTier(score) {
  for (var key in USER_TIERS) {
    var tier = USER_TIERS[key];
    if (score >= tier.minScore && score <= tier.maxScore) {
      return tier;
    }
  }
  return USER_TIERS.private;
}

/* ══════════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════════════════════════════
   AI PAYLOAD AGGREGATOR — Step 1 of dynamic LLM feedback system
   ────────────────────────────────────────────────────────────────────────
   prepareAIPayload(state, scores)
   - state  : user's answer map ({qid: {questionIdx, optionText_cn, optionText_tw}})
              Falls back to module-level `answerMap` if not provided.
   - scores : computed score bundle ({finalScore, finalScorePrecise, dimPct, bonusScore})
              Falls back to module-level globals if not provided.

   Returns a structured object ready to serialize into an LLM prompt:
   {
     lang, totalScore (/150), totalScorePrecise, bonusScore,
     verdict (SSS..F),
     tier: {id, title, subtitle},
     persona: {animal, title, tier},
     tags: [...],                // combined persona + tier traits
     dimensions: {basic, social, identity} each {label, score (/100)},
     strongestDimension, weakestDimension,
     objectiveFacts: [...],      // user's immutable reality (profession,
                                 //   wealth, marital status, etc.) — context
                                 //   for the LLM, NOT behaviors to grade
     bestHabits: [top 2 highest-normalized actionable behaviors],
     worstHabits: [bottom 2 lowest-normalized actionable behaviors],
   }
   ════════════════════════════════════════════════════════════════════════ */
function prepareAIPayload(state, scores){
  state  = state  || answerMap || {};
  scores = scores || {};

  var lang  = window.I18N_CURRENT || 'zh-CN';
  var isTW  = lang === 'zh-TW';

  var total         = (typeof scores.finalScore         === 'number') ? scores.finalScore         : finalScore;
  var totalPrecise  = (typeof scores.finalScorePrecise  === 'number') ? scores.finalScorePrecise  : finalScorePrecise;
  var dims          = scores.dimPct || dimPct || {};
  var bonus         = (typeof scores.bonusScore         === 'number') ? scores.bonusScore         : (bonusScore || 0);

  /* ── Identity labels: verdict / tier / persona ───────────────────── */
  var verdict  = getVerdict(total);
  var persona  = getPersona();
  var tierData = getUserTier(total);

  /* ── Tags: persona title (Food Persona — drives AI tone) + traits ───
        Title is placed FIRST so the LLM picks it up as the dominant
        identity signal. See system-prompt section "Culinary Status". */
  var tags = [];
  var personaTitle = isTW ? persona.title_tw : persona.title_cn;
  if(personaTitle) tags.push(personaTitle);
  var personaTraits = isTW ? persona.traits_tw : persona.traits_cn;
  personaTraits.forEach(function(t){ if(tags.indexOf(t)<0) tags.push(t); });

  /* ── Dimensions (each /100) with localized labels ────────────────── */
  var DIM_LABELS = {
    basic:    {cn:'基础维度',     tw:'基礎維度'},
    social:   {cn:'社会生活方向', tw:'社會生活方向'},
    identity: {cn:'个人认同',     tw:'個人認同'},
  };
  var dimsOut = {};
  var strongestKey = null, weakestKey = null, sVal = -1, wVal = 101;
  Object.keys(DIM_LABELS).forEach(function(k){
    var v = (typeof dims[k] === 'number') ? dims[k] : 0;
    dimsOut[k] = { key:k, label: isTW?DIM_LABELS[k].tw:DIM_LABELS[k].cn, score: v };
    if(v > sVal){ sVal = v; strongestKey = k; }
    if(v < wVal){ wVal = v; weakestKey   = k; }
  });

  /* ── Habit ranking + factual bifurcation ────────────────────────────
     Two-bucket classification for every answered scorable single-choice
     question:

     • EXCLUDE_IDS — pure demographics the user has no control over
       (age, gender, birthplace, parents' background). These are dropped
       entirely — they don't even reach the LLM.

     • FACTUAL_IDS — the user's immutable REALITY/BACKGROUND
       (profession, income bracket, net worth, marital status, legal
       record, medical history, military service, highest degree). These
       get surfaced to the LLM as `objectiveFacts` — context that shapes
       the analysis, NOT behaviors the user should "improve."

     • Everything else — actionable behaviors/habits. These go into the
       `ranked` array and become `bestHabits` / `worstHabits`.

     This split prevents the LLM from reading a low score on a factual
     question (e.g., "didn't complete military service") as evidence of
     psychological defect.
  ─────────────────────────────────────────────────────────────────── */
  var EXCLUDE_IDS = new Set([
    /* Uncontrollable demographics — never sent to the LLM */
    'A1','A3h','A3hf','A4',
    'QK1','QK2','QK4m','QK4f','QK5m','QK5f',
    'QKC8','QKD13','QKC6','QKB3','QKT5','QKT1'
  ]);

  var FACTUAL_IDS = new Set([
    /* Profession / career identity
       NOTE: QKBON_AB8 is now a bonus question (see post-loop pass below
       for how its answer still reaches objectiveFacts). */
    'QKC1','A15',
    /* Income / wealth / financial position */
    'QK7','QKAB4','QKAB6','QKAG1','QKAI2','QKC2','QKC3',
    'B3','B3b','B3c','B4','B4b','B4c','B4e','B4f','B4g',
    'QK19','QK20',
    /* Legal / criminal record */
    'QKC6',
    /* Military service */
    'A_mil',
    /* Education / degree (one's own + parents) */
    'A6','B17b',
    /* Relationship / marital status (the fact of being married/single/etc.) */
    'QKB1',
    /* Medical / chronic health history (the fact, not ongoing behavior) */
    'A8',
    /* Housing tenure / living environment — reality, not habit */
    'A5','B14','A_home'
  ]);

  /* Bonus questions that represent the user's objective reality (not a
     behavior to grade). These are normally filtered out of the main loop
     because `q.bonus === true`, but their *answers* still belong in the
     `objectiveFacts` context surfaced to the LLM. */
  var BONUS_FACTUAL_IDS = new Set(['QKBON_AB8']);

  var objectiveFacts = [];
  var ranked = [];

  getBank().forEach(function(q){
    if(!q.scorable || q.bonus || q.multi) return;
    if(EXCLUDE_IDS.has(q.id)) return;
    var ans = state[q.id];
    if(!ans) return;
    var opt = q.options && q.options[ans.questionIdx];
    if(!opt) return;

    var questionText = isTW ? (q.tw || q.cn) : (q.cn || q.tw);
    var answerText   = isTW ? (ans.optionText_tw || ans.optionText_cn || '')
                            : (ans.optionText_cn || ans.optionText_tw || '');

    /* Factual question → objectiveFacts (no score, no ranking) */
    if(FACTUAL_IDS.has(q.id)){
      if(answerText){
        objectiveFacts.push({
          id:       q.id,
          section:  q.section || null,
          question: questionText,
          answer:   answerText,
        });
      }
      return;
    }

    /* Behavioral question → ranked pool for best/worst habits */
    if(typeof opt.score !== 'number') return;
    var maxScore = 0;
    q.options.forEach(function(o){ if((o.score||0) > maxScore) maxScore = o.score||0; });
    if(maxScore <= 0) return;

    ranked.push({
      id:         q.id,
      section:    q.section || null,
      question:   questionText,
      answer:     answerText,
      rawScore:   opt.score,
      maxScore:   maxScore,
      normalized: opt.score / maxScore,
    });
  });

  /* Post-loop pass: surface bonus questions that describe the user's
     objective reality (profession, etc.) as objectiveFacts. The score
     earned is NOT passed — only the textual fact. Skip the "none of
     these apply" opt-out answer (score === 0 with no factual content). */
  getBank().forEach(function(q){
    if(!q.bonus || !BONUS_FACTUAL_IDS.has(q.id)) return;
    var ans = state[q.id];
    if(!ans) return;
    var opt = q.options && q.options[ans.questionIdx];
    if(!opt) return;
    /* Skip the neutral "none" opt-out (always 0 points, no useful fact) */
    if((opt.score || 0) === 0) return;
    var questionText = isTW ? (q.tw || q.cn) : (q.cn || q.tw);
    var answerText   = isTW ? (ans.optionText_tw || ans.optionText_cn || '')
                            : (ans.optionText_cn || ans.optionText_tw || '');
    if(!answerText) return;
    objectiveFacts.push({
      id:       q.id,
      section:  'profession',  /* logical grouping, not bank section */
      question: questionText,
      answer:   answerText,
    });
  });

  function mapHabit(r){
    return {
      id:       r.id,
      section:  r.section,
      question: r.question,
      answer:   r.answer,
      score:    Math.round(r.normalized * 100),  /* % of max for this question */
    };
  }

  /* Best: sort desc by normalized, take top 2 */
  var bestSorted = ranked.slice().sort(function(a,b){
    if(b.normalized !== a.normalized) return b.normalized - a.normalized;
    return b.rawScore - a.rawScore;
  });
  var bestHabits = bestSorted.slice(0, 2).map(mapHabit);

  /* Worst: sort asc by normalized, take bottom 2.
     De-dupe against bestHabits so a tiny question bank doesn't double-list. */
  var bestIds = new Set(bestHabits.map(function(h){ return h.id; }));
  var worstSorted = ranked.slice().sort(function(a,b){
    if(a.normalized !== b.normalized) return a.normalized - b.normalized;
    return a.rawScore - b.rawScore;
  });
  var worstHabits = worstSorted
    .filter(function(r){ return !bestIds.has(r.id); })
    .slice(0, 2)
    .map(mapHabit);

  return {
    lang: lang,
    totalScore:        total,          /* out of 150 */
    totalScorePrecise: totalPrecise,
    bonusScore:        bonus,
    verdict:           verdict,        /* SSS / SS / S / A / B / C / D / F */
    tier: {
      id:    tierData.id,
      title: isTW ? tierData.tw.title : tierData.cn.title,
      minScore: tierData.minScore,
      maxScore: tierData.maxScore,
    },
    persona: {
      animal: persona.animal,
      title:  isTW ? persona.title_tw : persona.title_cn,
      tier:   persona.tier,
    },
    tags:               tags,
    dimensions:         dimsOut,
    strongestDimension: strongestKey ? dimsOut[strongestKey] : null,
    weakestDimension:   weakestKey   ? dimsOut[weakestKey]   : null,
    objectiveFacts:     objectiveFacts,
    bestHabits:         bestHabits,
    worstHabits:        worstHabits,
  };
}
/* Expose for downstream modules (Step 2+) and console debugging */
window.prepareAIPayload = prepareAIPayload;

/* ════════════════════════════════════════════════════════════════════════
   MILITARY PROGRESS BAR — Fog-of-War / Tech-Tree Timeline
   ────────────────────────────────────────────────────────────────────────
   Renders the user's rank journey as a horizontal continuous track with
   11 evenly-spaced nodes. Each node is styled by its index relative to
   the user's current rank:

     1. Achieved (idx < current)     → lit, bright, checkmark, opacity 1
     2. Current  (idx === current)   → glowing, enlarged, rank icon
     3. Pending  (idx === current+1) → rank name visible but dim + 🔒
     4. Fog      (idx > current+1)   → anonymous dot only, no name

   The colored fill bar stretches from the start of the track and stops
   exactly at the current node's center.

   Injected CSS is scoped under #milProg and guarded against double-insert.
   ════════════════════════════════════════════════════════════════════════ */

var RANK_ORDER = [
  'private','secondLieutenant','firstLieutenant','captain','major',
  'lieutenantColonel','colonel','seniorColonel','majorGeneral',
  'lieutenantGeneral','general'
];

function injectMilitaryProgressStyles(){
  if (document.getElementById('milProgressStyles')) return;
  var css = [
    /* ── Host ── */
    '#milProg{padding:4px 0;color:var(--rb-ink);}',

    /* ── Header: brutalist square icon + chunky title + sticker chip ── */
    '#milProg .mp-header{display:flex;align-items:center;gap:14px;margin-bottom:18px;}',
    '#milProg .mp-icon{flex:none;width:54px;height:54px;border-radius:0!important;display:flex;align-items:center;justify-content:center;font-size:26px;color:var(--rb-paper);background:var(--rb-ink)!important;background-image:none!important;border:3px solid var(--rb-ink);box-shadow:5px 5px 0 var(--rb-ink);}',
    '#milProg .mp-meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;}',
    '#milProg .mp-title{font-family:var(--font-sans);font-size:24px;font-weight:900;letter-spacing:-0.01em;line-height:1.1;text-transform:uppercase;color:var(--rb-ink)!important;}',
    '#milProg .mp-chip{align-self:flex-start;padding:4px 12px;border-radius:0!important;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;background:var(--rb-paper)!important;color:var(--rb-ink)!important;border:2px solid var(--rb-ink);}',

    /* ── Score line ── */
    '#milProg .mp-score{display:flex;align-items:baseline;gap:6px;margin-bottom:18px;font-family:var(--font-mono);font-variant-numeric:tabular-nums;}',
    '#milProg .mp-score-val{font-size:18px;font-weight:900;color:var(--rb-ink);}',
    '#milProg .mp-score-max{font-size:13px;color:var(--rb-ink);font-weight:700;opacity:0.55;}',

    /* ── SCROLLABLE TRACK WRAPPER ── */
    /* Outer wrap = scroll viewport; sits in a white brutalist box */
    '#milProg .mp-track-wrap{background:var(--rb-paper);border:3px solid var(--rb-ink);box-shadow:6px 6px 0 var(--rb-ink);padding:24px 0 24px;margin:8px 0 14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}',
    '#milProg .mp-track-wrap::-webkit-scrollbar{height:8px;}',
    '#milProg .mp-track-wrap::-webkit-scrollbar-thumb{background:var(--rb-ink);border-radius:0;}',
    /* Inner = actual rail + nodes; min-width keeps the journey roomy on mobile */
    '#milProg .mp-track-inner{position:relative;min-width:800px;padding:48px 32px 56px;}',

    /* Base rail — solid thick black bar */
    '#milProg .mp-rail{position:absolute;left:32px;right:32px;top:50%;height:6px;border-radius:0;background:var(--rb-ink);transform:translateY(-50%);overflow:hidden;}',
    '#milProg .mp-rail::after{display:none;}',
    /* Filled bar from start up to current node — solid color (no glow) */
    '#milProg .mp-fill{position:absolute;left:32px;top:50%;height:10px;border-radius:0;transform:translateY(-50%);width:0;background:var(--node-color,var(--rb-cyan));border:2px solid var(--rb-ink);box-shadow:none;transition:width 900ms cubic-bezier(.22,.8,.34,1);}',

    /* ── Node anchor ── */
    '#milProg .mp-node{position:absolute;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;}',

    /* Marker — sharp square, thick black border */
    '#milProg .mp-marker{width:18px;height:18px;border-radius:0!important;background:var(--rb-paper);border:3px solid var(--rb-ink);box-sizing:border-box;z-index:2;position:relative;}',

    /* Labels (above/below) */
    '#milProg .mp-label{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;text-align:center;font-family:var(--font-mono);font-size:11.5px;letter-spacing:0.06em;z-index:3;}',
    '#milProg .mp-node--above .mp-label{bottom:calc(50% + 18px);}',
    '#milProg .mp-node--below .mp-label{top:calc(50% + 18px);}',
    '#milProg .mp-label-name{font-weight:800;line-height:1.2;color:var(--rb-ink);text-transform:uppercase;}',
    '#milProg .mp-label-score{font-size:10px;color:var(--rb-ink);opacity:0.6;font-weight:700;margin-top:3px;font-variant-numeric:tabular-nums;letter-spacing:0.04em;}',

    /* ── State 1: achieved — STAR BADGES ── */
    '#milProg .mp-node--achieved .mp-marker{width:22px;height:22px;background:var(--rb-ink);border:2px solid var(--rb-ink);border-radius:50%!important;box-shadow:2px 2px 0 rgba(255,255,255,0.8);}',
    '#milProg .mp-node--achieved .mp-marker::before{content:"★";display:flex!important;align-items:center;justify-content:center;color:var(--rb-yellow);font-size:12px;position:absolute;inset:0;top:-1px;}',
    '#milProg .mp-node--achieved .mp-label-name{color:var(--rb-ink);}',

    /* ── State 2: current — MASSIVE square + hard shadow + jitter ── */
    '#milProg .mp-node--current .mp-marker{width:42px;height:42px;background:var(--node-color,var(--rb-cyan));border:4px solid var(--rb-ink);box-shadow:6px 6px 0 var(--rb-ink);animation:mpJitter 0.18s steps(2) infinite;}',
    '#milProg .mp-node--current .mp-marker::before{content:attr(data-icon);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;}',
    '#milProg .mp-node--current .mp-label-name{font-size:13px;font-weight:900;color:var(--rb-ink);text-transform:uppercase;letter-spacing:0.08em;}',
    '#milProg .mp-node--current .mp-label-desc{display:block;font-family:var(--font-mono);font-size:10.5px;font-weight:700;color:var(--rb-ink);opacity:0.7;margin-top:3px;letter-spacing:0.06em;}',
    '@keyframes mpJitter{0%{transform:translate(0,0);}25%{transform:translate(1px,-1px);}50%{transform:translate(-1px,1px);}75%{transform:translate(1px,1px);}100%{transform:translate(-1px,-1px);}}',

    /* ── State 3: pending — DASHED THICK BORDER + WHITE FILL ── */
    '#milProg .mp-node--pending .mp-marker{width:20px;height:20px;background:var(--rb-paper);border:3px dashed var(--rb-ink);opacity:1;}',
    '#milProg .mp-node--pending .mp-label{opacity:0.7;}',
    '#milProg .mp-node--pending .mp-label-name{color:var(--rb-ink);font-weight:700;}',
    '#milProg .mp-node--pending .mp-label-name::before{content:"[ ]";font-family:var(--font-mono);margin-right:4px;opacity:0.6;}',

    /* ── State 4: fog — tiny hairline square ── */
    '#milProg .mp-node--fog .mp-marker{width:10px;height:10px;background:var(--rb-paper);border:2px dashed var(--rb-ink);opacity:0.45;}',
    '#milProg .mp-node--fog .mp-label{display:none;}',
    '#milProg .mp-node--fog .mp-label-tick{display:block;position:absolute;left:50%;top:calc(50% + 14px);transform:translateX(-50%);color:var(--rb-ink);opacity:0.4;font-family:var(--font-mono);font-size:10px;letter-spacing:0.2em;font-weight:700;}',

    /* ════════════════════════════════════════════════════════════════
       PHASE BLOCK — brutalist white box inside colored card
       ════════════════════════════════════════════════════════════════ */
    '#milProg .mp-phase{margin-top:20px;padding:22px 24px;background:var(--rb-paper);border:3px solid var(--rb-ink);box-shadow:6px 6px 0 var(--rb-ink);'+
      'opacity:0;animation:mpPhaseFadeIn 700ms ease-out 400ms forwards;}',
    '@keyframes mpPhaseFadeIn{to{opacity:1;}}',

    /* Tagline — bold poster headline */
    '#milProg .mp-phase-tagline{font-family:var(--font-sans);font-size:20px;font-weight:900;line-height:1.25;letter-spacing:-0.005em;text-transform:uppercase;margin-bottom:12px;color:var(--rb-ink);'+
      '-webkit-background-clip:initial!important;-webkit-text-fill-color:initial!important;background:none!important;}',
    '#milProg .mp-phase-tagline::before{content:"// ";opacity:0.5;}',

    /* Body */
    '#milProg .mp-phase-body{font-family:var(--font-mono);font-size:13.5px;line-height:1.85;color:var(--rb-ink);margin-bottom:18px;letter-spacing:0.01em;}',

    /* Tag rows */
    '#milProg .mp-phase-tags{display:flex;flex-direction:column;gap:12px;}',
    '#milProg .mp-phase-tag-row{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;}',
    '#milProg .mp-phase-tag-label{flex-shrink:0;font-family:var(--font-mono);font-size:11px;font-weight:900;padding:5px 10px;border-radius:0!important;letter-spacing:0.16em;text-transform:uppercase;border:2px solid var(--rb-ink);}',
    '#milProg .mp-phase-tag-label--pro{background:var(--rb-green)!important;color:var(--rb-ink)!important;}',
    '#milProg .mp-phase-tag-label--con{background:var(--rb-magenta)!important;color:var(--rb-paper)!important;}',
    '#milProg .mp-phase-tag-list{display:flex;flex-wrap:wrap;gap:6px;flex:1;min-width:0;}',

    /* Warning-sticker tags — square corners, thick borders */
    '#milProg .mp-tag{display:inline-block;padding:5px 10px;font-family:var(--font-mono);font-size:11.5px;font-weight:700;line-height:1.4;border-radius:0!important;letter-spacing:0.04em;'+
      'background:var(--rb-paper)!important;color:var(--rb-ink)!important;border:2px solid var(--rb-ink)!important;'+
      'box-shadow:2px 2px 0 var(--rb-ink)!important;'+
      'transition:transform 120ms linear,box-shadow 120ms linear;}',
    '#milProg .mp-tag::before{content:"#";opacity:0.4;margin-right:3px;}',
    '#milProg .mp-tag--pro{background:var(--rb-green)!important;}',
    '#milProg .mp-tag--con{background:var(--rb-yellow)!important;}',

    /* Hover lift */
    '@media (hover:hover){',
      '#milProg .mp-tag:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--rb-ink)!important;}',
    '}',

    /* Mobile */
    '@media (max-width:640px){',
      '#milProg .mp-icon{width:46px;height:46px;font-size:22px;}',
      '#milProg .mp-title{font-size:20px;}',
      '#milProg .mp-track-inner{min-width:720px;padding:40px 24px 48px;}',
      '#milProg .mp-rail{left:24px;right:24px;}',
      '#milProg .mp-fill{left:24px;}',
      '#milProg .mp-phase{padding:18px 16px;}',
      '#milProg .mp-phase-tagline{font-size:17px;}',
      '#milProg .mp-phase-body{font-size:12.5px;line-height:1.75;}',
      '#milProg .mp-tag{font-size:11px;padding:4px 9px;}',
      '#milProg .mp-phase-tag-label{font-size:10px;padding:4px 9px;}',
    '}',
  ].join('');
  var styleEl = document.createElement('style');
  styleEl.id = 'milProgressStyles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

/* ════════════════════════════════════════════════════════════════════════
   RANK_PHASES — Barnum-effect phase copy
   ────────────────────────────────────────────────────────────────────────
   Below the progress bar we surface a 2-3 sentence "what this stage of
   life feels like" passage plus 2 short pros / 2 short cons. The copy
   is intentionally Barnum-flavoured: relatable, slightly ambiguous,
   emotionally resonant, easy to nod along to. Each phase has its own
   psychological centre of gravity:

     general — apex / loneliness of the summit / search for next battle
     field   — multi-front load / from doing-things-right to right-things
     junior  — raw potential / resilience / chaotic resource management
   ════════════════════════════════════════════════════════════════════════ */
var RANK_PHASES = {
  general: {
    cn: {
      tagline: '巅峰之上，目之所及皆是空气',
      body: '到了你这个位置，外部世界已经很难再给你出难题——大多数挑战的形状你都见过、解过、也输过几次。真正的难度从外部转向了内部：在没有人能给你建议的高度，下一场仗到底要不要打、为谁而打。',
      pros: ['对规则与系统了如指掌', '能从一片混沌里看出地形', '决策时已不被噪音干扰'],
      cons: ['在高处没有同辈，孤独是底色', '"做对的事"开始比"把事做对"更难'],
    },
    tw: {
      tagline: '巔峰之上，目之所及皆是空氣',
      body: '到了你這個位置，外部世界已經很難再給你出難題——大多數挑戰的形狀你都見過、解過、也輸過幾次。真正的難度從外部轉向了內部：在沒有人能給你建議的高度，下一場仗到底要不要打、為誰而打。',
      pros: ['對規則與系統了如指掌', '能從一片混沌裡看出地形', '決策時已不被噪音干擾'],
      cons: ['在高處沒有同輩，孤獨是底色', '「做對的事」開始比「把事做對」更難'],
    },
  },
  field: {
    cn: {
      tagline: '多线作战，承重一整代人',
      body: '你正在打一场没有间歇的多线战役——事业要往上、家庭要兼顾、身体在悄悄抗议、还要时不时回应身后那些把希望寄托在你身上的人。这是最辛苦也最值得尊敬的阶段：很多事情没人比你更适合扛，因为你恰好处在"还能扛得动"的那个窗口期。',
      pros: ['执行力与责任心都已被反复锤炼', '在现实世界里有真正的话语权', '能把复杂的事拆成可推进的步骤'],
      cons: ['长期硬扛，留给自己的余量越来越少', '"把事情做对"已不够，需要开始问"做的是不是对的事"'],
    },
    tw: {
      tagline: '多線作戰，承重一整代人',
      body: '你正在打一場沒有間歇的多線戰役——事業要往上、家庭要兼顧、身體在悄悄抗議、還要時不時回應身後那些把希望寄託在你身上的人。這是最辛苦也最值得尊敬的階段：很多事情沒人比你更適合扛，因為你恰好處在「還能扛得動」的那個窗口期。',
      pros: ['執行力與責任心都已被反覆錘鍊', '在現實世界裡有真正的話語權', '能把複雜的事拆成可推進的步驟'],
      cons: ['長期硬扛，留給自己的餘量越來越少', '「把事情做對」已不夠，需要開始問「做的是不是對的事」'],
    },
  },
  junior: {
    cn: {
      tagline: '原始素材最厚的阶段',
      body: '你身上最值钱的东西，恰恰是那些还没被磨平的东西——韧性、灵活度、对未来的可塑性、以及在被现实重击之后还愿意再爬起来的那股劲。这个阶段最大的风险不是失败，而是把宝贵的能量胡乱燃烧在不会复利的事情上。',
      pros: ['抗压与回弹能力远高于自己以为的', '没有沉没成本的包袱，转向成本极低', '对世界还保留着真诚的好奇心'],
      cons: ['资源有限时容易在多个方向同时分散精力', '把"忙"误认为"在前进"'],
    },
    tw: {
      tagline: '原始素材最厚的階段',
      body: '你身上最值錢的東西，恰恰是那些還沒被磨平的東西——韌性、靈活度、對未來的可塑性、以及在被現實重擊之後還願意再爬起來的那股勁。這個階段最大的風險不是失敗，而是把寶貴的能量胡亂燃燒在不會複利的事情上。',
      pros: ['抗壓與回彈能力遠高於自己以為的', '沒有沉沒成本的包袱，轉向成本極低', '對世界還保留著真誠的好奇心'],
      cons: ['資源有限時容易在多個方向同時分散精力', '把「忙」誤認為「在前進」'],
    },
  },
};

function getRankPhase(score){
  if(score >= 101) return 'general';
  if(score >= 51)  return 'field';
  return 'junior';
}

function renderMilitaryProgressBar(container, score, isTW){
  if (!container) return;
  injectMilitaryProgressStyles();

  var currentTier = getUserTier(score);
  var currentIdx  = RANK_ORDER.indexOf(currentTier.id);
  if (currentIdx < 0) currentIdx = 0;

  var tTitle = isTW ? currentTier.tw.title : currentTier.cn.title;
  var tDesc  = isTW ? currentTier.tw.desc  : currentTier.cn.desc;

  /* Fill bar width: percentage from first node to current node center. */
  var nMax    = RANK_ORDER.length - 1;
  var fillPct = nMax > 0 ? (currentIdx / nMax) * 100 : 0;
  var fogPct  = 100 - fillPct;

  /* ── Build timeline nodes (logic unchanged) ─────────────────────── */
  var nodesHtml = '';
  for (var i = 0; i < RANK_ORDER.length; i++){
    var t = USER_TIERS[RANK_ORDER[i]];
    var pos = nMax > 0 ? (i / nMax) * 100 : 0;
    var state;
    if (i < currentIdx)          state = 'achieved';
    else if (i === currentIdx)   state = 'current';
    else if (i === currentIdx+1) state = 'pending';
    else                         state = 'fog';

    var placement = (i % 2 === 0) ? 'above' : 'below';
    if (state === 'current') placement = 'above';

    var classes  = 'mp-node mp-node--'+state+' mp-node--'+placement;
    var styleVar = '--node-color:'+t.color;

    var labelHtml = '';
    var tickHtml  = '';

    if (state === 'achieved'){
      var achievedName = isTW ? t.tw.title : t.cn.title;
      labelHtml =
        '<div class="mp-label">'+
          '<div class="mp-label-name">'+achievedName+'</div>'+
          '<div class="mp-label-score">'+t.minScore+'-'+t.maxScore+'</div>'+
        '</div>';
    } else if (state === 'current'){
      var curName = isTW ? t.tw.title : t.cn.title;
      var curDesc = isTW ? t.tw.desc  : t.cn.desc;
      labelHtml =
        '<div class="mp-label">'+
          '<div class="mp-label-name">'+curName+'</div>'+
          '<div class="mp-label-desc">'+curDesc+'</div>'+
          '<div class="mp-label-score">'+t.minScore+'-'+t.maxScore+'</div>'+
        '</div>';
    } else if (state === 'pending'){
      var pendName = isTW ? t.tw.title : t.cn.title;
      labelHtml =
        '<div class="mp-label">'+
          '<div class="mp-label-name">'+pendName+'</div>'+
          '<div class="mp-label-score">'+t.minScore+'-'+t.maxScore+'</div>'+
        '</div>';
    } else {
      tickHtml = '<div class="mp-label-tick">···</div>';
    }

    var markerAttrs = (state === 'current') ? ' data-icon="'+t.icon+'"' : '';

    nodesHtml +=
      '<div class="'+classes+'" style="left:'+pos+'%;'+styleVar+'">'+
        '<div class="mp-marker"'+markerAttrs+'></div>'+
        labelHtml + tickHtml +
      '</div>';
  }

  var fillGrad = 'linear-gradient(90deg,' +
    'color-mix(in srgb,'+currentTier.color+' 55%,#ffffff 45%) 0%,' +
    currentTier.color + ' 100%)';

  /* ── Phase block — body now wrapped in heavy-border box ─────────── */
  var phaseKey  = getRankPhase(score);
  var phaseData = RANK_PHASES[phaseKey][isTW ? 'tw' : 'cn'];
  var prosLabel = isTW ? '優勢' : '优势';
  var consLabel = isTW ? '挑戰' : '挑战';
  var prosHtml  = phaseData.pros.map(function(p){
    return '<span class="mp-tag mp-tag--pro">'+p+'</span>';
  }).join('');
  var consHtml  = phaseData.cons.map(function(c){
    return '<span class="mp-tag mp-tag--con">'+c+'</span>';
  }).join('');

  /* Heavy-border container around the body text — sits on top of the
     animated pixel canvas, so the background is opaque-ish to keep the
     copy legible regardless of which palette is active. */
  var phaseBodyStyle =
    'background:rgba(255,255,255,0.85);'+
    'border:3px solid #000;'+
    'padding:16px;'+
    'font-family:var(--font-mono);'+
    'font-size:13.5px;'+
    'line-height:1.85;'+
    'color:var(--rb-ink);'+
    'margin-bottom:18px;'+
    'letter-spacing:0.01em;';

  var phaseHtml =
    '<div class="mp-phase mp-phase--'+phaseKey+'">'+
      '<div class="mp-phase-tagline">'+phaseData.tagline+'</div>'+
      '<div class="mp-phase-body" style="'+phaseBodyStyle+'">'+phaseData.body+'</div>'+
      '<div class="mp-phase-tags">'+
        '<div class="mp-phase-tag-row">'+
          '<span class="mp-phase-tag-label mp-phase-tag-label--pro">'+prosLabel+'</span>'+
          '<div class="mp-phase-tag-list">'+prosHtml+'</div>'+
        '</div>'+
        '<div class="mp-phase-tag-row">'+
          '<span class="mp-phase-tag-label mp-phase-tag-label--con">'+consLabel+'</span>'+
          '<div class="mp-phase-tag-list">'+consHtml+'</div>'+
        '</div>'+
      '</div>'+
    '</div>';

  container.id = container.id || 'personaTierSection';
  container.setAttribute('data-mil-prog','1');
  container.setAttribute('data-phase', phaseKey);

  /* ── New header: jumping icon (left) + massive h1 rank-name (right) ── */
  var rankIconStyle =
    'flex:none;width:90px;height:90px;'+
    'background:var(--rb-paper)!important;background-image:none!important;'+
    'border:4px solid var(--rb-ink);'+
    'box-shadow:6px 6px 0 var(--rb-ink);'+
    'display:flex;align-items:center;justify-content:center;'+
    'font-size:50px;color:var(--rb-ink);'+
    'animation:mpRankJitter 1s steps(2) infinite;';

  var rankNameStyle =
    'position:absolute;right:0;top:-10px;margin:0;text-align:right;'+
    'font-family:var(--font-sans);'+
    'font-style:italic;'+
    'font-size:clamp(80px,18vw,140px);'+
    'font-weight:900;'+
    'color:#B8860B !important;'+
    '-webkit-text-fill-color:#B8860B !important;'+
    'text-shadow:4px 4px 0 #000000, 8px 8px 0 rgba(0,0,0,0.2) !important;'+
    'letter-spacing:-0.05em;line-height:0.95;z-index:5;'+
    'width:2.2em;word-wrap:break-word;white-space:normal;';

  var taglineStyle =
    'display:inline-block;font-size:14px;font-weight:900;'+
    'background:var(--rb-ink);color:var(--rb-paper);'+
    'padding:6px 14px;margin-bottom:14px;letter-spacing:0.04em;';

  var headerStyle = 'display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;position:relative;min-height:100px;';

  container.style.position = 'static';
  container.style.padding = '0';

  /* ── Inject markup: pixel layer + foreground content ───────────── */
  container.innerHTML =
    /* (1) animated 8-bit pixel background forced to stretch */
    '<div class="pixel-bg-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none;">'+
      '<canvas id="pixelCanvas_mil" style="width: 100%; height: 100%; object-fit: cover; display: block; image-rendering: -moz-crisp-edges; image-rendering: -webkit-crisp-edges; image-rendering: pixelated; image-rendering: crisp-edges;"></canvas>'+
    '</div>'+
    /* (2) crisp foreground content layer with transferred padding */
    '<div id="milProg" class="mp-phase-host mp-phase-host--'+phaseKey+' card-content" style="position:relative; z-index:10; padding:28px 24px;">'+
      '<div class="mp-header" style="'+headerStyle+'">'+
        '<div class="mp-icon" style="'+rankIconStyle+'">'+
          '<!-- 占位：未来在此处解开注释并替换为专属勋章 JPG -->'+
          '<!-- <img src="assets/medal_placeholder.jpg" style="width:100%; height:100%; object-fit:cover; display:none;" /> -->'+
          '<span>'+currentTier.icon+'</span>'+
        '</div>'+
        '<h1 class="rank-name" style="'+rankNameStyle+'">'+tTitle+'</h1>'+
      '</div>'+
      '<div class="mp-tagline" style="'+taglineStyle+'">'+tDesc+'</div>'+
      '<div class="mp-score">'+
        '<span class="mp-score-val">'+score+'</span>'+
        '<span class="mp-score-max">/ 150</span>'+
      '</div>'+
      '<div class="mp-track-wrap" style="--fill-color:'+currentTier.color+';--fill-grad:'+fillGrad+';--fog-width:'+fogPct+'%">'+
        '<div class="mp-track-inner" style="--node-color:'+currentTier.color+'">'+
          '<div class="mp-rail"></div>'+
          '<div class="mp-fill" data-target="'+fillPct+'"></div>'+
          nodesHtml +
        '</div>'+
      '</div>'+
      phaseHtml +
    '</div>';

  /* Animate the fill bar after the DOM settles */
  setTimeout(function(){
    var fill = container.querySelector('.mp-fill');
    if (fill) fill.style.width = fillPct + '%';
  }, 60);

  /* ── 8-bit pixel-wave canvas (40×30, 12 FPS, phase-tinted palette) ── */
  (function startPixelCanvas(){
    var canvas = container.querySelector('#pixelCanvas_mil');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* Tiny internal grid; CSS scales it up into chunky retro pixels */
    var W = 40, H = 30;
    canvas.width  = W;
    canvas.height = H;

    /* Phase-driven 3-color palette: highlight / mid / base */
    var pal;
    if (phaseKey === 'general'){
      /* 将级 — 白 / 橙 / 金 */
      pal = { hi: '#FFFFFF', mid: '#FFA500', base: '#FFD93D' };
    } else if (phaseKey === 'field'){
      /* 校级 — 白 / 浅绿 / 深绿 */
      pal = { hi: '#FFFFFF', mid: '#7FE07F', base: '#1E8E3E' };
    } else {
      /* 尉级及以下 — 白 / 浅蓝 / 深蓝 */
      pal = { hi: '#FFFFFF', mid: '#7FD4FF', base: '#0066CC' };
    }

    var time = 0;
    function drawPixelWaves(){
      /* Auto-stop if a re-render replaced the canvas (innerHTML reset) */
      if (!canvas.isConnected) return;
      time += 0.2;
      for (var x = 0; x < W; x++){
        for (var y = 0; y < H; y++){
          /* Triangular noise — same model as demo.html */
          var noise = Math.sin((x * 0.3) + time) +
                      Math.cos((y * 0.4) + (time * 0.8)) +
                      Math.sin((x + y) * 0.2 - time);
          /* Posterize into 3 hard color stops */
          if (noise > 1.2)      ctx.fillStyle = pal.hi;
          else if (noise > 0.2) ctx.fillStyle = pal.mid;
          else                  ctx.fillStyle = pal.base;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      /* Lock to 12 FPS for that authentic chunky 8-bit jitter */
      setTimeout(function(){
        if (canvas.isConnected) requestAnimationFrame(drawPixelWaves);
      }, 1000 / 12);
    }
    drawPixelWaves();
  })();
}
window.renderMilitaryProgressBar = renderMilitaryProgressBar;

/* ════════════════════════════════════════════════════════════════════════
   DYNAMIC INSIGHTS RENDERER — seamless native section
   ────────────────────────────────────────────────────────────────────────
   Replaces the static insight / highlight / improve / tip / next-steps
   cards with a single dynamic section below the persona card.

   Flow:
     1. On result page load → auto-trigger fetchResultFromAI().
     2. Hash the payload. If a cached success exists in sessionStorage,
        render instantly with no typewriter (user has seen it before).
     3. Otherwise show a minimal loading state, POST /api/generate-result,
        then reveal each card and stream its body text character-by-character
        (ChatGPT-style) to simulate a real-time thought process.
     4. On failure (4xx / 5xx / network) show a soft error banner with
        a Retry button. Only successful responses are cached.

   Visual language: very light glassmorphism — no heavy gradients. Accent
   colors are used ONLY on the small icon badges; cards themselves share
   a uniform neutral surface.

   All markup + styles injected from JS — result.html requires no changes.
   ════════════════════════════════════════════════════════════════════════ */

var AI_ENDPOINT         = '/api/generate-result';
var AI_CACHE_PREFIX     = 'ls_ai_v1_';
var AI_SECTION_INJECTED = false;
var AI_STATIC_CARD_IDS  = ['insightsCard','highlightCard','improveCard','resultTip','nextStepsCard'];

/* Per-module metadata. `accent` drives the icon badge + number badge accent;
   `accentBg` is the pill/li tint; `gradient` is the two-stop gradient used
   on the card title for a vibrant, Dribbble-esque pop. */
var AI_MODULE_LABELS = {
  grade:       { cn:'分级评价',   tw:'分級評價',   icon:'🏅', accent:'#a78bfa', accentBg:'rgba(167,139,250,0.12)', gradient:'linear-gradient(135deg,#a78bfa 0%,#6366f1 100%)' },
  insight:     { cn:'个性化洞察', tw:'個性化洞察', icon:'🧠', accent:'#f472b6', accentBg:'rgba(244,114,182,0.12)', gradient:'linear-gradient(135deg,#f472b6 0%,#e11d48 100%)' },
  highlights:  { cn:'亮点回顾',   tw:'亮點回顧',   icon:'✨', accent:'#34d399', accentBg:'rgba(52,211,153,0.12)',  gradient:'linear-gradient(135deg,#34d399 0%,#0ea5e9 100%)' },
  weakness:    { cn:'提升空间',   tw:'提升空間',   icon:'🎯', accent:'#fbbf24', accentBg:'rgba(251,191,36,0.12)',  gradient:'linear-gradient(135deg,#fbbf24 0%,#f97316 100%)' },
  suggestions: { cn:'提升建议',   tw:'提升建議',   icon:'💡', accent:'#38bdf8', accentBg:'rgba(56,189,248,0.12)',  gradient:'linear-gradient(135deg,#38bdf8 0%,#6366f1 100%)' },
  actionPlan:  { cn:'行动计划',   tw:'行動計劃',   icon:'🗺️', accent:'#a78bfa', accentBg:'rgba(167,139,250,0.12)', gradient:'linear-gradient(135deg,#a78bfa 0%,#ec4899 100%)' },
};
var AI_ACTION_LABELS = {
  work:   { cn:'工作事业', tw:'工作事業', icon:'💼' },
  social: { cn:'社交人脉', tw:'社交人脈', icon:'🤝' },
  family: { cn:'家庭伴侣', tw:'家庭伴侶', icon:'🏡' },
};

/* Simple stable hash (djb2 variant) — only needs to change when payload changes. */
function aiHashString(str){
  var h = 5381, i = str.length;
  while (i) { h = (h * 33) ^ str.charCodeAt(--i); }
  return (h >>> 0).toString(36);
}

function aiEscapeHtml(s){
  if (s == null) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* Hide the legacy static cards that this section replaces. */
function aiHideStaticSections(){
  AI_STATIC_CARD_IDS.forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

/* Inject CSS once per page — scoped under #aiSection. Deliberately minimal:
   light glassmorphism, uniform card surface, accent color confined to the
   small icon badges. No large gradients, no gradient text. */
/* Active interval ID for the rotating loading status text. */
var AI_STATUS_INTERVAL = null;

function aiInjectStyles(){
  if (document.getElementById('aiSectionStyles')) return;
  var style = document.createElement('style');
  style.id = 'aiSectionStyles';
  style.textContent = [
    '#aiSection{margin:28px 0;display:flex;flex-direction:column;gap:24px;}',
    '#aiSection [hidden]{display:none!important;}',

    /* LOADING STATE */
    '#aiSection .ai-loading{display:flex;align-items:center;gap:22px;padding:32px 36px;background:var(--color-bg);border:3px solid var(--color-text);box-shadow:8px 8px 0 var(--color-text);border-radius:0;}',
    '#aiSection .ai-loading-orb{flex:none;width:40px;height:40px;background:var(--color-text);border-radius:0;animation:aiPixelSpin 1.2s steps(4) infinite;}',
    '@keyframes aiPixelSpin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}',
    '#aiSection .ai-loading-stack{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;}',
    '#aiSection .ai-loading-title{font-family:var(--font-sans);font-size:20px;font-weight:900;text-transform:uppercase;color:var(--color-text);letter-spacing:0.04em;}',
    '#aiSection .ai-loading-status{display:flex;align-items:center;gap:10px;font-family:var(--font-mono);}',
    '#aiSection .ai-status-dot{flex:none;width:12px;height:12px;background:var(--color-text);animation:ls-blink 1s steps(2) infinite;}',
    '#aiSection .ai-status-text{font-size:13px;font-weight:700;color:var(--color-text);text-transform:uppercase;}',

    /* ERROR BANNER */
    '#aiSection .ai-error{padding:24px 28px;background:#FF3D7F;border:3px solid var(--color-text);box-shadow:8px 8px 0 var(--color-text);border-radius:0;}',
    '#aiSection .ai-error-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;}',
    '#aiSection .ai-error-icon{font-size:20px;}',
    '#aiSection .ai-error-title{color:#fff;font-family:var(--font-sans);font-size:18px;font-weight:900;text-transform:uppercase;}',
    '#aiSection .ai-error-msg{color:#fff;font-family:var(--font-mono);font-size:14px;line-height:1.7;margin-bottom:18px;}',
    '#aiSection .ai-retry-btn{display:inline-flex;align-items:center;padding:10px 20px;border:3px solid var(--color-text);background:#fff;color:var(--color-text);font-family:var(--font-mono);font-size:13px;font-weight:900;text-transform:uppercase;cursor:pointer;box-shadow:4px 4px 0 var(--color-text);transition:all .1s linear;}',
    '#aiSection .ai-retry-btn:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--color-text);}',

    /* RESULTS CONTAINER & CARDS */
    '#aiSection .ai-results{display:flex;flex-direction:column;gap:24px;}',
    '#aiSection .ai-card{position:relative;padding:32px 34px;background:var(--color-bg);border:3px solid var(--color-text);box-shadow:8px 8px 0 var(--color-text);border-radius:0;opacity:0;transform:translateY(10px);transition:all .2s linear;}',
    '#aiSection .ai-card.is-revealed{opacity:1;transform:translateY(0);}',
    '#aiSection .ai-card:hover{transform:translate(-2px,-2px);box-shadow:10px 10px 0 var(--color-text);}',
    '#aiSection .ai-card::before{display:none;}',

    /* ── Card header (EMOJI NO BACKGROUND) ── */
    '#aiSection .ai-card-head{display:flex;align-items:center;gap:14px;margin-bottom:22px;}',
    '#aiSection .ai-card-icon{display:inline-flex;align-items:center;justify-content:center;font-size:28px;background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;width:auto!important;height:auto!important;margin-right:4px;border-radius:0;}',
    '#aiSection .ai-card-title{font-family:var(--font-sans);font-size:22px;font-weight:900;text-transform:uppercase;color:var(--color-text);}',

    /* ── Prose body (FONT ENLARGED) ── */
    '#aiSection .ai-card-body{font-family:var(--font-mono);font-size:16px;line-height:1.85;color:var(--color-text);white-space:pre-wrap;}',
    '#aiSection .ai-card-body::before{content:"> _ ";font-weight:900;}',

    /* CHECKLIST LIST */
    '#aiSection .ai-list{display:flex;flex-direction:column;gap:16px;margin:0;padding:0;}',
    '#aiSection .ai-li{position:relative;display:flex;gap:16px;align-items:flex-start;padding:20px;background:var(--color-bg);border:2px solid var(--color-text);box-shadow:4px 4px 0 var(--color-text);border-radius:0;opacity:0;transform:translateY(6px);transition:all .2s linear;}',
    '#aiSection .ai-li::before{display:none;}',
    '#aiSection .ai-li.is-revealed{opacity:1;transform:translateY(0);}',
    '#aiSection .ai-li:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--color-text);}',
    '#aiSection .ai-li-num{flex:none;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:var(--color-text);color:var(--color-bg);font-family:var(--font-mono);font-size:14px;font-weight:900;border-radius:0;box-shadow:2px 2px 0 var(--color-text);}',
    '#aiSection .ai-li-text{flex:1;min-width:0;font-family:var(--font-mono);font-size:16px;line-height:1.8;color:var(--color-text);white-space:pre-wrap;word-break:break-word;}',

    /* HIGHLIGHT PILL (PIXEL BG) */
    '#aiSection .ai-highlight-pill{display:inline-block;padding:4px 10px;border:2px solid var(--color-text);background-color:#333;background-image:conic-gradient(#4d4d4d 90deg, transparent 90deg, transparent 270deg, #4d4d4d 270deg);background-size:4px 4px;color:#fff;font-weight:900;font-family:var(--font-mono);letter-spacing:0.04em;box-shadow:2px 2px 0 var(--color-text);margin:0 4px;}',
    '#aiSection .ai-li-text .ai-highlight-pill, #aiSection .ai-card-body .ai-highlight-pill{white-space:normal;}',

    /* GRADE CARD (FONT ENLARGED) */
    '#aiSection .ai-grade-title{font-family:var(--font-sans);font-size:36px;font-weight:900;line-height:1.2;text-transform:uppercase;color:var(--color-text);margin:12px 0 20px;}',
    '#aiSection .ai-grade-desc{font-family:var(--font-mono);font-size:16px;line-height:1.85;color:var(--color-text);white-space:pre-wrap;}',
    '#aiSection .ai-grade-desc::before{content:"> _ ";font-weight:900;}',

    /* ACTION PLAN */
    '#aiSection .ai-ap-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}',
    '#aiSection .ai-ap-item{padding:24px;background:var(--color-bg);border:3px solid var(--color-text);box-shadow:6px 6px 0 var(--color-text);border-radius:0;transition:all .1s linear;}',
    '#aiSection .ai-ap-item:hover{transform:translate(-2px,-2px);box-shadow:8px 8px 0 var(--color-text);}',
    '#aiSection .ai-ap-head{display:flex;align-items:center;gap:10px;margin-bottom:16px;font-family:var(--font-mono);font-weight:900;font-size:14px;color:var(--color-text);text-transform:uppercase;}',
    '#aiSection .ai-ap-head span:first-child{font-size:22px;}',
    '#aiSection .ai-ap-body{font-family:var(--font-mono);font-size:16px;line-height:1.8;color:var(--color-text);white-space:pre-wrap;}',

    /* TYPEWRITER CARET */
    '#aiSection .tw-cursor{display:inline-block;width:10px;height:1.2em;background:var(--color-text);margin-left:6px;vertical-align:-0.2em;animation:ls-blink 1s steps(2) infinite;}',

    /* RESPONSIVE (FONTS ENLARGED) */
    '@media (max-width:820px){',
      '#aiSection .ai-ap-grid{grid-template-columns:1fr;}',
    '}',
    '@media (max-width:640px){',
      '#aiSection{gap:16px;}',
      '#aiSection .ai-loading{padding:24px 20px; flex-direction:column; text-align:center;}',
      '#aiSection .ai-loading-title{font-size:16px;}',
      '#aiSection .ai-status-text{font-size:12px;}',
      '#aiSection .ai-card{padding:24px 20px;}',
      '#aiSection .ai-card-title{font-size:18px;}',
      '#aiSection .ai-card-body,#aiSection .ai-li-text,#aiSection .ai-grade-desc,#aiSection .ai-ap-body{font-size:15px;}',
      '#aiSection .ai-grade-title{font-size:28px;}',
      '#aiSection .ai-li{padding:16px;gap:12px;}',
      '#aiSection .ai-ap-item{padding:20px;}',
    '}'
  ].join('');
  document.head.appendChild(style);
}

/* Inject the section DOM once, anchored after #personaCard.
   Loading state (orb + title + cycling status) is the default visible state. */
function aiInjectSection(){
  if (AI_SECTION_INJECTED) return;
  aiInjectStyles();
  var anchor = document.getElementById('personaCard');
  if (!anchor || !anchor.parentNode) return;

  var lang = window.I18N_CURRENT || 'zh-CN';
  var isTW = lang === 'zh-TW';
  var L = {
    loading:  isTW ? '正在為您生成專屬深度洞察' : '正在为您生成专属深度洞察',
    errTitle: isTW ? '生成失敗'                 : '生成失败',
    retry:    isTW ? '重試'                     : '重试',
  };

  var wrapper = document.createElement('div');
  wrapper.id = 'aiSection';
  wrapper.className = 'ai-section';
  wrapper.innerHTML =
    '<div class="ai-loading" id="aiLoading">' +
      '<div class="ai-loading-orb" aria-hidden="true"></div>' +
      '<div class="ai-loading-stack">' +
        '<div class="ai-loading-title" id="aiLoadingText">' + L.loading + '</div>' +
        '<div class="ai-loading-status">' +
          '<span class="ai-status-dot" aria-hidden="true"></span>' +
          '<span class="ai-status-text" id="aiLoadingStatus"></span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="ai-error" id="aiError" hidden>' +
      '<div class="ai-error-head">' +
        '<span class="ai-error-icon">⚠️</span>' +
        '<span class="ai-error-title" id="aiErrorTitle">' + L.errTitle + '</span>' +
      '</div>' +
      '<div class="ai-error-msg" id="aiErrorMsg"></div>' +
      '<button type="button" class="ai-retry-btn" id="btn-ai-retry">' +
        '<span id="aiRetryText">' + L.retry + '</span>' +
      '</button>' +
    '</div>' +
    '<div class="ai-results" id="aiResults" hidden></div>';

  anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);

  var retryBtn = document.getElementById('btn-ai-retry');
  if (retryBtn) retryBtn.addEventListener('click', fetchResultFromAI);

  AI_SECTION_INJECTED = true;
}

/* Refresh localized copy when language changes. */
function aiRefreshLabels(){
  if (!AI_SECTION_INJECTED) return;
  var isTW = (window.I18N_CURRENT || 'zh-CN') === 'zh-TW';
  var set = function(id, cn, tw){ var el=document.getElementById(id); if(el) el.textContent = isTW?tw:cn; };
  set('aiLoadingText', '正在为您生成专属深度洞察', '正在為您生成專屬深度洞察');
  set('aiErrorTitle',  '生成失败',                   '生成失敗');
  set('aiRetryText',   '重试',                       '重試');
  /* If status cycle is live, restart to re-localize immediately */
  if (AI_STATUS_INTERVAL) aiStatusStart();
}

/* ── Rotating loading status — cycles through phases while waiting ── */
function aiStatusStart(){
  var isTW = (window.I18N_CURRENT || 'zh-CN') === 'zh-TW';
  var list = isTW
    ? ['閱讀您的答題數據', '識別行為模式與關鍵特徵', '提煉臨床觀察', '生成個人化反饋', '最後潤色中']
    : ['阅读您的答题数据', '识别行为模式与关键特征', '提炼临床观察', '生成个性化反馈', '最后润色中'];
  var el = document.getElementById('aiLoadingStatus');
  if (!el) return;
  var idx = 0;
  el.textContent = list[0];
  el.style.opacity = 1;
  aiStatusStop();
  AI_STATUS_INTERVAL = setInterval(function(){
    if (!el.isConnected){ aiStatusStop(); return; }
    idx = (idx + 1) % list.length;
    el.style.opacity = 0;
    setTimeout(function(){
      if (!el.isConnected) return;
      el.textContent = list[idx];
      el.style.opacity = 1;
    }, 280);
  }, 2600);
}
function aiStatusStop(){
  if (AI_STATUS_INTERVAL){ clearInterval(AI_STATUS_INTERVAL); AI_STATUS_INTERVAL = null; }
}

/* ── State transitions ────────────────────────────────────────────── */
function aiShow(id){ var el = document.getElementById(id); if (el) el.hidden = false; }
function aiHide(id){ var el = document.getElementById(id); if (el) el.hidden = true; }

function aiStateLoading(){ aiShow('aiLoading'); aiHide('aiError'); aiHide('aiResults'); aiStatusStart(); }
function aiStateError(msg){
  aiStatusStop();
  aiHide('aiLoading'); aiHide('aiResults');
  var m = document.getElementById('aiErrorMsg');
  if (m) m.textContent = msg || ((window.I18N_CURRENT==='zh-TW')?'網絡異常，請稍後再試':'网络异常，请稍后再试');
  aiShow('aiError');
}
function aiStateSuccess(){ aiStatusStop(); aiHide('aiLoading'); aiHide('aiError'); aiShow('aiResults'); }

/* ── List detection — if the LLM prose contains a numbered list (1. 2. 3. or
      ①②③), return the items; otherwise return null to keep it as prose. ── */
function aiTrySplitList(text){
  if (!text) return null;
  var t = String(text).trim();
  if (t.length < 30) return null;

  function extract(markers){
    var items = [];
    for (var i = 0; i < markers.length; i++){
      var start = markers[i].pos + markers[i].len;
      var end   = (i + 1 < markers.length) ? markers[i + 1].pos : t.length;
      items.push(t.slice(start, end).trim());
    }
    for (var j = 0; j < items.length; j++){
      if (items[j].length < 10) return null;  /* items must be substantive */
    }
    return items;
  }

  /* Strategy 1: circled numerals ①②③... */
  var circled = '①②③④⑤⑥⑦⑧⑨';
  var markers = [];
  for (var k = 0; k < t.length; k++){
    var ci = circled.indexOf(t[k]);
    if (ci >= 0) markers.push({ pos: k, num: ci + 1, len: 1 });
  }
  var sequential = markers.length >= 2 && markers.every(function(m, i){ return m.num === i + 1; });
  if (sequential){
    var r1 = extract(markers);
    if (r1) return r1;
  }

  /* Strategy 2: arabic "N." at sentence boundaries (start, whitespace, or
     Chinese sentence-end punctuation). Requires the sequence to start at 1. */
  markers = [];
  var re = /(?:^|[\s\n。！？])([1-9])[.．、]\s*/g;
  var m;
  while ((m = re.exec(t)) !== null){
    var digitPos = m.index + m[0].indexOf(m[1]);
    var afterLen = m[0].length - (digitPos - m.index);
    markers.push({ pos: digitPos, num: parseInt(m[1], 10), len: afterLen });
  }
  sequential = markers.length >= 2 && markers.every(function(mm, i){ return mm.num === i + 1; });
  if (sequential){
    var r2 = extract(markers);
    if (r2) return r2;
  }

  return null;
}

/* ── Prose fallback — when no numbered markers are present but the field
      is expected to be list-shaped, split on Chinese sentence boundaries
      and group into roughly equal chunks. Keeps the content intact but
      restores visual rhythm. ── */
function aiFallbackSplitProse(text, targetCount){
  if (!text) return null;
  var t = String(text).trim();
  if (t.length < 80) return null;  /* short prose: render as-is */

  /* Split on 。！？ while keeping the delimiter attached to its sentence. */
  var sentences = [];
  var buf = '';
  for (var i = 0; i < t.length; i++){
    var c = t[i];
    buf += c;
    if (c === '。' || c === '！' || c === '？'){
      var s = buf.trim();
      if (s) sentences.push(s);
      buf = '';
    }
  }
  var tail = buf.trim();
  if (tail) sentences.push(tail);

  if (sentences.length < 2) return null;

  /* Group sentences into `targetCount` chunks of roughly equal char-length.
     Simple greedy: iterate sentences, start a new chunk once the running
     length exceeds total/target. */
  var target = Math.min(Math.max(targetCount || 2, 2), sentences.length);
  var totalLen = t.length;
  var idealLen = totalLen / target;
  var chunks = [];
  var curr = '';
  var currLen = 0;
  var chunksStarted = 0;
  for (var j = 0; j < sentences.length; j++){
    var s = sentences[j];
    var remaining = sentences.length - j;
    var chunksLeft = target - chunks.length;
    /* Force-push remaining sentences into current chunk if we've already
       filled (target-1) chunks. */
    if (chunksLeft <= 1){
      curr += (curr ? '' : '') + s;
      continue;
    }
    /* If current chunk exceeded ideal length AND we still have sentences
       left to fill remaining chunks, close current chunk and start new. */
    if (currLen >= idealLen && curr){
      chunks.push(curr.trim());
      curr = s;
      currLen = s.length;
    } else {
      curr += s;
      currLen += s.length;
    }
  }
  if (curr.trim()) chunks.push(curr.trim());

  /* Must yield at least 2 substantive chunks. */
  if (chunks.length < 2) return null;
  for (var k = 0; k < chunks.length; k++){
    if (chunks[k].length < 20) return null;
  }
  return chunks;
}

/* Target item counts per module, used by the fallback splitter. */
var AI_LIST_TARGETS = { insight: 3, highlights: 2, weakness: 2, suggestions: 3 };

/* ── Markdown tokenizer ───────────────────────────────────────────────
   Split text into a flat array of { type, chars } segments where type is
   either 'text' (plain) or 'pill' (was wrapped in **bold**). `chars` is
   the code-point-safe character array for the typewriter to consume.
   Unclosed ** is treated as literal text. Empty **  ** is skipped.
────────────────────────────────────────────────────────────────────── */
function aiTokenizeMarkdown(text){
  var t = String(text || '');
  var out = [];
  var i = 0;
  var buf = '';
  function flushText(){
    if (buf){ out.push({ type:'text', chars: Array.from(buf) }); buf = ''; }
  }
  while (i < t.length){
    if (t.charCodeAt(i) === 42 && t.charCodeAt(i + 1) === 42){
      /* Look for closing ** */
      var close = t.indexOf('**', i + 2);
      if (close < 0){
        /* No closing — treat the rest as literal text */
        buf += t.slice(i);
        i = t.length;
        break;
      }
      var inner = t.slice(i + 2, close);
      if (inner.length === 0){
        /* empty **** — drop */
        i = close + 2;
        continue;
      }
      flushText();
      out.push({ type:'pill', chars: Array.from(inner) });
      i = close + 2;
    } else {
      buf += t[i];
      i++;
    }
  }
  flushText();
  return out;
}

/* ── Typewriter engine (markdown-aware) ───────────────────────────────
   Each entry in `typers` is { el, text }.
   The engine tokenizes text into plain / pill segments, then streams
   them into `el` character by character. Pills render as animated
   <span class="ai-highlight-pill"> elements that fade in once the pill
   opens, and continue receiving characters as the typewriter advances.
────────────────────────────────────────────────────────────────────── */
function aiTypewrite(typers, onDone){
  var i = 0;
  var CHAR_MS        = 14;
  var CHAR_JITTER_MS = 6;
  var FIELD_PAUSE_MS = 140;
  var CARD_FADE_MS   = 220;
  var ROW_FADE_MS    = 180;

  function runOne(){
    if (i >= typers.length){ if (typeof onDone === 'function') onDone(); return; }
    var item = typers[i++];
    var el   = item.el;
    if (!el || !el.isConnected){ runOne(); return; }

    var waitForFade = 0;

    /* Reveal parent card if not yet shown. */
    var card = el.closest ? el.closest('.ai-card') : null;
    if (card && !card.classList.contains('is-revealed')){
      card.classList.add('is-revealed');
      waitForFade = Math.max(waitForFade, CARD_FADE_MS);
    }

    /* Reveal parent list-item row. */
    var row = el.closest ? el.closest('.ai-li') : null;
    if (row && !row.classList.contains('is-revealed')){
      row.classList.add('is-revealed');
      waitForFade = Math.max(waitForFade, ROW_FADE_MS);
    }

    /* Clear target and prepare a trailing caret. The caret is re-parented
       on each tick so it always sits at the end of whatever is currently
       being written (plain text or the inside of an open pill). */
    el.textContent = '';
    var caret = document.createElement('span');
    caret.className = 'tw-cursor';
    caret.setAttribute('aria-hidden','true');
    el.appendChild(caret);

    var segments = aiTokenizeMarkdown(item.text || '');
    var segIdx   = 0;    /* which segment we're currently streaming */
    var charIdx  = 0;    /* position within the current segment */
    var activeTextNode = null;  /* current Text node we're appending to */
    var activePillEl   = null;  /* current <span.ai-highlight-pill> (if inside pill) */

    function startSegment(){
      var seg = segments[segIdx];
      if (!seg) return;
      if (seg.type === 'pill'){
        activePillEl = document.createElement('span');
        activePillEl.className = 'ai-highlight-pill';
        activeTextNode = document.createTextNode('');
        activePillEl.appendChild(activeTextNode);
        el.insertBefore(activePillEl, caret);
      } else {
        activePillEl = null;
        activeTextNode = document.createTextNode('');
        el.insertBefore(activeTextNode, caret);
      }
    }

    function tick(){
      /* Done entirely? */
      if (segIdx >= segments.length){
        if (caret.parentNode) caret.parentNode.removeChild(caret);
        setTimeout(runOne, FIELD_PAUSE_MS);
        return;
      }
      var seg = segments[segIdx];
      /* Start a new segment's DOM container if just entering. */
      if (charIdx === 0) startSegment();

      if (charIdx < seg.chars.length){
        charIdx++;
        activeTextNode.data = seg.chars.slice(0, charIdx).join('');
        /* Keep the caret visually at the tail: if we're inside a pill, move
           caret after the pill so it trails outside the badge. If we're in
           plain text, caret is already positioned after the text node. */
        if (activePillEl && caret.parentNode === el){
          /* Ensure caret is immediately after the pill while we type inside it. */
          if (activePillEl.nextSibling !== caret){
            el.insertBefore(caret, activePillEl.nextSibling);
          }
        }
      }
      if (charIdx >= seg.chars.length){
        /* Advance to next segment on next tick. */
        segIdx++;
        charIdx = 0;
      }
      var delay = CHAR_MS + Math.random() * CHAR_JITTER_MS;
      setTimeout(tick, delay);
    }
    setTimeout(tick, waitForFade);
  }

  runOne();
}

/* Render markdown **bold** → pill spans for the instant (cache-restore) path.
   Returns a DocumentFragment that escapes all other HTML. */
function aiRenderMarkdown(text){
  var frag = document.createDocumentFragment();
  aiTokenizeMarkdown(text).forEach(function(seg){
    if (seg.type === 'pill'){
      var span = document.createElement('span');
      span.className = 'ai-highlight-pill';
      span.textContent = seg.chars.join('');
      frag.appendChild(span);
    } else {
      frag.appendChild(document.createTextNode(seg.chars.join('')));
    }
  });
  return frag;
}

/* Render the 6 modules into #aiResults.
   opts.skipTypewriter = true  → reveal fully and instantly (cache restore). */
function aiRenderResult(data, opts){
  opts = opts || {};
  var container = document.getElementById('aiResults');
  if (!container || !data) return;
  var isTW = (window.I18N_CURRENT || 'zh-CN') === 'zh-TW';
  var html = '';

  /* Helper to build a card's inline style (accent + tint + gradient). */
  function cardStyle(lab){
    return '--accent:' + lab.accent + ';--accent-bg:' + lab.accentBg + ';--grad:' + lab.gradient;
  }

  /* 1. Grade */
  var g    = data.grade || {};
  var gLab = AI_MODULE_LABELS.grade;
  html +=
    '<div class="ai-card ai-card-grade" style="' + cardStyle(gLab) + '">' +
      '<div class="ai-card-head">' +
        '<span class="ai-card-icon">' + gLab.icon + '</span>' +
        '<span class="ai-card-title">' + (isTW ? gLab.tw : gLab.cn) + '</span>' +
      '</div>' +
      '<div class="ai-grade-title">' + aiEscapeHtml(g.title || '') + '</div>' +
      '<div class="ai-grade-desc" data-raw="' + aiEscapeHtml(g.description || '') + '">' + aiEscapeHtml(g.description || '') + '</div>' +
    '</div>';

  /* 2-5. Text modules — auto-detect numbered lists and render as checklist.
         If LLM didn't use markers, fall back to sentence-boundary split so
         even prose still renders with visual rhythm. */
  ['insight','highlights','weakness','suggestions'].forEach(function(k){
    var lab  = AI_MODULE_LABELS[k];
    var text = data[k] || '';
    var listItems = aiTrySplitList(text) || aiFallbackSplitProse(text, AI_LIST_TARGETS[k]);

    var bodyHtml;
    if (listItems){
      bodyHtml = '<div class="ai-list">' +
        listItems.map(function(item, idx){
          var esc = aiEscapeHtml(item);
          return '<div class="ai-li">' +
            '<div class="ai-li-num">' + (idx + 1) + '</div>' +
            '<div class="ai-li-text" data-raw="' + esc + '">' + esc + '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    } else {
      var escText = aiEscapeHtml(text);
      bodyHtml = '<div class="ai-card-body" data-raw="' + escText + '">' + escText + '</div>';
    }

    html +=
      '<div class="ai-card" style="' + cardStyle(lab) + '">' +
        '<div class="ai-card-head">' +
          '<span class="ai-card-icon">' + lab.icon + '</span>' +
          '<span class="ai-card-title">' + (isTW ? lab.tw : lab.cn) + '</span>' +
        '</div>' +
        bodyHtml +
      '</div>';
  });

  /* 6. Action plan */
  var ap    = data.actionPlan || {};
  var apLab = AI_MODULE_LABELS.actionPlan;
  var apItems = ['work','social','family'].map(function(k){
    var sub = AI_ACTION_LABELS[k];
    var esc = aiEscapeHtml(ap[k] || '');
    return '<div class="ai-ap-item">' +
      '<div class="ai-ap-head"><span>' + sub.icon + '</span><span>' + (isTW ? sub.tw : sub.cn) + '</span></div>' +
      '<div class="ai-ap-body" data-raw="' + esc + '">' + esc + '</div>' +
    '</div>';
  }).join('');
  html +=
    '<div class="ai-card ai-card-actionplan" style="' + cardStyle(apLab) + '">' +
      '<div class="ai-card-head">' +
        '<span class="ai-card-icon">' + apLab.icon + '</span>' +
        '<span class="ai-card-title">' + (isTW ? apLab.tw : apLab.cn) + '</span>' +
      '</div>' +
      '<div class="ai-ap-grid">' + apItems + '</div>' +
    '</div>';

  container.innerHTML = html;
  aiStateSuccess();

  /* Instant path (cache restore): reveal everything immediately, render
     markdown pills from the raw text stored in data-raw. */
  if (opts.skipTypewriter){
    container.querySelectorAll('.ai-card').forEach(function(c){ c.classList.add('is-revealed'); });
    container.querySelectorAll('.ai-li').forEach(function(li){ li.classList.add('is-revealed'); });
    container.querySelectorAll('[data-raw]').forEach(function(el){
      el.textContent = '';
      el.appendChild(aiRenderMarkdown(el.getAttribute('data-raw') || ''));
    });
    return;
  }

  /* Streaming path: collect body-level text elements in reading order.
     Use the raw (unescaped) text from data-raw so the typewriter can see
     the ** markdown markers. */
  var typers = [];
  var pushTyper = function(el){
    if (!el) return;
    var raw = el.getAttribute('data-raw');
    typers.push({ el: el, text: raw != null ? raw : el.textContent });
    el.textContent = '';
  };

  /* Order: grade desc → 4 middle cards (list items or prose) → 3 action-plan bodies */
  pushTyper(container.querySelector('.ai-grade-desc'));

  container.querySelectorAll('.ai-card').forEach(function(card){
    if (card.classList.contains('ai-card-grade'))      return;
    if (card.classList.contains('ai-card-actionplan')) return;
    var liTexts = card.querySelectorAll('.ai-li-text');
    if (liTexts.length){
      liTexts.forEach(pushTyper);
    } else {
      pushTyper(card.querySelector('.ai-card-body'));
    }
  });

  container.querySelectorAll('.ai-ap-body').forEach(pushTyper);

  aiTypewrite(typers);
}

/* Restore from cache if a successful response exists for the current payload. */
function aiRestoreFromCache(){
  try {
    var payload = prepareAIPayload();
    var key = AI_CACHE_PREFIX + aiHashString(JSON.stringify(payload));
    var cached = sessionStorage.getItem(key);
    if (!cached) return false;
    var parsed = JSON.parse(cached);
    if (parsed && parsed.grade && parsed.actionPlan){
      aiRenderResult(parsed, { skipTypewriter: true });
      return true;
    }
  } catch (e){ /* fall through */ }
  return false;
}

/* Main: fetch → cache-check → API call → render with typewriter. */
function fetchResultFromAI(){
  var payload;
  try { payload = prepareAIPayload(); }
  catch (e){
    console.error('[fetchResultFromAI] payload build failed:', e);
    aiStateError((window.I18N_CURRENT==='zh-TW')?'無法構建請求數據':'无法构建请求数据');
    return;
  }

  var payloadJson = JSON.stringify(payload);
  var cacheKey    = AI_CACHE_PREFIX + aiHashString(payloadJson);

  /* Cache hit → render instantly, no typewriter, no API call. */
  try {
    var cached = sessionStorage.getItem(cacheKey);
    if (cached){
      var parsed = JSON.parse(cached);
      if (parsed && parsed.grade && parsed.actionPlan){
        aiRenderResult(parsed, { skipTypewriter: true });
        return;
      }
    }
  } catch (e){ /* ignore parse/storage errors */ }

  aiStateLoading();

  fetch(AI_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    payloadJson,
  }).then(function(res){
    return res.json().then(
      function(body){ return { ok: res.ok, status: res.status, body: body }; },
      function()    { return { ok: res.ok, status: res.status, body: null  }; }
    );
  }).then(function(r){
    if (!r.ok || !r.body || !r.body.ok || !r.body.data){
      var isTW = (window.I18N_CURRENT||'zh-CN')==='zh-TW';
      var msg  = (r.body && r.body.error)
        ? r.body.error
        : (isTW?'服務器響應異常 (HTTP ':'服务器响应异常 (HTTP ') + r.status + ')';
      aiStateError(msg);
      return;
    }
    /* Only cache on success. */
    try { sessionStorage.setItem(cacheKey, JSON.stringify(r.body.data)); }
    catch (e){ /* storage full / private mode — ignore */ }
    aiRenderResult(r.body.data);   /* fresh fetch → typewriter */
  }).catch(function(err){
    console.error('[fetchResultFromAI] network error:', err);
    var isTW = (window.I18N_CURRENT||'zh-CN')==='zh-TW';
    aiStateError(isTW?'網絡連接失敗，請檢查網絡後重試':'网络连接失败，请检查网络后重试');
  });
}

/* Expose for debugging / manual invocation. */
window.fetchResultFromAI = fetchResultFromAI;

/* ══════════════════════════════════════════════════════ */

function updateContent(){
  var lang=window.I18N_CURRENT||'zh-CN';
  buildRankVerdict(lang); buildDims(lang); buildBreakdown();
  var proRadar=document.getElementById('proRadarCanvas');
  if(proRadar) drawProfessionalRadar(proRadar);
  /* Persona (includes tier classification) */
  buildPersona(lang);

  /* ── Dynamic insights section replaces static insight / highlight /
        improve / tip / nextSteps cards. Auto-triggers on page load. ── */
  aiHideStaticSections();
  aiInjectSection();
  aiRefreshLabels();
  /* Cache hit → instant render. Cache miss → auto-trigger the fetch. */
  if (!aiRestoreFromCache()) fetchResultFromAI();

  buildShareCard(lang);
  /* Golden celebration for score > 100 */
  if(finalScore>100) triggerGoldenCelebration();
}

/* ══════════════════════════════════════════════════════
   GOLDEN CELEBRATION — confetti + golden theme for >100
   ══════════════════════════════════════════════════════ */
function triggerGoldenCelebration(){
  /* Apply golden theme to page */
  document.body.classList.add('golden-mode');

  /* Swap circle gradient to gold */
  var rcFill=document.getElementById('rcFill');
  if(rcFill) rcFill.style.stroke='url(#rcGradGold)';

  /* Fire confetti twice */
  setTimeout(function(){ launchConfetti(); },600);
  setTimeout(function(){ launchConfetti(); },2200);
}

function launchConfetti(){
  var canvas=document.getElementById('confettiCanvas');
  if(!canvas) return;
  canvas.style.display='block';
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  var ctx=canvas.getContext('2d');
  var particles=[];
  var colors=['#FFD700','#FFA500','#FF6347','#38bdf8','#10b981','#f59e0b','#ec4899','#fff'];
  var shapes=['rect','circle'];

  /* Create particles from both sides */
  for(var i=0;i<120;i++){
    var fromLeft=i%2===0;
    particles.push({
      x: fromLeft ? -10 : canvas.width+10,
      y: canvas.height*0.5 + (Math.random()-0.5)*canvas.height*0.4,
      vx: (fromLeft?1:-1)*(Math.random()*12+4),
      vy: -(Math.random()*14+4),
      gravity: 0.25,
      size: Math.random()*8+4,
      color: colors[Math.floor(Math.random()*colors.length)],
      shape: shapes[Math.floor(Math.random()*shapes.length)],
      rotation: Math.random()*360,
      rotSpeed: (Math.random()-0.5)*12,
      opacity: 1,
      decay: 0.008+Math.random()*0.006
    });
  }

  var startTime=Date.now();
  function animate(){
    var elapsed=Date.now()-startTime;
    if(elapsed>4000){ canvas.style.display='none'; ctx.clearRect(0,0,canvas.width,canvas.height); return; }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(function(p){
      p.x+=p.vx;
      p.vy+=p.gravity;
      p.y+=p.vy;
      p.vx*=0.98;
      p.rotation+=p.rotSpeed;
      p.opacity-=p.decay;
      if(p.opacity<=0) return;
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rotation*Math.PI/180);
      ctx.globalAlpha=Math.max(0,p.opacity);
      ctx.fillStyle=p.color;
      if(p.shape==='circle'){
        ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
      }
      ctx.restore();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ══════════════════════════════
   SHARE MODAL
   ══════════════════════════════ */
function buildShareCard(lang){
  var isTW = (lang === 'zh-TW');
  var persona = getPersona();        /* SINGLE source of truth — no more getVerdict here */
  var tier = persona.tier;           /* 'S' | 'A' | 'B' | 'C' | 'D' | 'E' */

  /* ── 1. Score number ─────────────────────────────────────── */
  var sn = document.getElementById('scScoreNum');
  if(sn) sn.textContent = finalScore;

  /* ── 2. Verdict slot → persona title (e.g. "S级 · 奇迹般的蓝鳍金枪鱼大腹") ── */
  var sv = document.getElementById('scVerdict');
  if(sv) sv.textContent = isTW ? persona.title_tw : persona.title_cn;

  /* ── 3. Dimension pills (only scDims innerHTML touched) ───── */
  var sd = document.getElementById('scDims');
  if(sd && dimPct){
    sd.innerHTML = DIM_CONF.map(function(d){
      var s = dimPct[d.key] || 0;
      return '<div class="sc-dim"><span>'+d.icon+'</span> '+window.t(d.i18n)+' <strong>'+s+'</strong></div>';
    }).join('');
  }

  var card = document.getElementById('shareCard');
  if(!card) return;

  /* ── 4. Safe persona block (quote + traits) ───────────────────
     NEVER wipe card.innerHTML — that would destroy the QR <img>.
     Remove only the previous persona block (if any), then rebuild it
     and insert it right after scVerdict. All styles inline for
     html2canvas reliability.                                      */
  var oldBlock = card.querySelector('#scPersonaBlock');
  if(oldBlock) oldBlock.remove();

  var isTierS = (tier === 'S');
  var isTierE = (tier === 'E');
  var quoteColor   = isTierS ? 'rgba(255,230,140,0.92)' : 'rgba(255,255,255,0.92)';
  var quoteBorder  = isTierS ? 'rgba(255,215,0,0.45)'   : 'rgba(255,255,255,0.35)';
  var traitBg      = isTierS ? 'rgba(255,215,0,0.14)'   : 'rgba(255,255,255,0.14)';
  var traitBorder  = isTierS ? 'rgba(255,215,0,0.38)'   : 'rgba(255,255,255,0.28)';
  var traitColor   = isTierS ? 'rgba(255,240,180,0.95)' : 'rgba(255,255,255,0.92)';

  var block = document.createElement('div');
  block.id = 'scPersonaBlock';
  block.className = 'sc-persona-block';
  block.setAttribute('style',
    'margin:10px 18px 8px;padding:8px 12px;'+
    'border-left:2px solid '+quoteBorder+';'+
    'display:flex;flex-direction:column;gap:8px;'+
    'position:relative;z-index:2;'
  );

  var q = document.createElement('div');
  q.className = 'sc-quote';
  q.setAttribute('style',
    'font-size:13px;line-height:1.55;font-style:italic;'+
    'color:'+quoteColor+';'+
    'letter-spacing:0.2px;'
  );
  q.textContent = '"' + (isTW ? persona.quote_tw : persona.quote_cn) + '"';
  block.appendChild(q);

  var traits = document.createElement('div');
  traits.className = 'sc-traits';
  traits.setAttribute('style',
    'display:flex;flex-wrap:wrap;gap:6px;'
  );
  var arr = isTW ? persona.traits_tw : persona.traits_cn;
  arr.forEach(function(t){
    var span = document.createElement('span');
    span.className = 'sc-trait';
    span.setAttribute('style',
      'display:inline-block;padding:3px 10px;border-radius:999px;'+
      'font-size:11px;line-height:1.3;'+
      'background:'+traitBg+';'+
      'border:1px solid '+traitBorder+';'+
      'color:'+traitColor+';'+
      'white-space:nowrap;'
    );
    span.textContent = t;
    traits.appendChild(span);
  });
  block.appendChild(traits);

  /* Insert after scVerdict — preserves QR, brand, score, dims, footer */
  if(sv && sv.parentNode === card){
    if(sv.nextSibling) card.insertBefore(block, sv.nextSibling);
    else card.appendChild(block);
  } else {
    card.appendChild(block);
  }

  /* ── 5. Tier-based theme class ───────────────────────────────
     Tier S        → black & gold ('sc-gold')
     Tier A/B/C/D  → blue for men, pink for women (default / 'sc-pink')
     Tier E        → no extra class (gender already encoded in title)  */
  var isFemale = false;
  if(answerMap){
    var gq = answerMap['QK2'] || answerMap['A0'] || answerMap['q_gender'];
    if(gq && gq.questionIdx === 1) isFemale = true;
  }

  card.classList.remove('sc-gold','sc-pink');
  if(isTierS)           card.classList.add('sc-gold');
  else if(isFemale)     card.classList.add('sc-pink');
  /* else: no class → original blue palette for men (tier A/B/C/D/E) */

  /* ── 6. Remove old SVG background if re-rendering ───────────── */
  var oldSvg = card.querySelector('.sc-geo-bg');
  if(oldSvg) oldSvg.remove();

  /* ── 7. Tier-driven SVG palette ─────────────────────────────── */
  var circleHi, circleLo, dotC, sparkC, accentStroke;
  if(isTierS){
    /* Black & gold epic */
    circleHi     = 'rgba(255,215,100,0.28)';
    circleLo     = 'rgba(255,180,40,0.09)';
    dotC         = 'rgba(255,220,120,0.30)';
    sparkC       = 'rgba(255,245,180,0.58)';
    accentStroke = 'rgba(255,215,0,0.38)';
  } else if(isFemale){
    /* Pink (tier A/B/C/D/E, female) */
    circleHi     = 'rgba(255,255,255,0.14)';
    circleLo     = 'rgba(255,200,230,0.06)';
    dotC         = 'rgba(255,255,255,0.15)';
    sparkC       = 'rgba(255,255,255,0.30)';
    accentStroke = 'rgba(255,255,255,0.18)';
  } else {
    /* Blue (tier A/B/C/D/E, male) */
    circleHi     = 'rgba(255,255,255,0.12)';
    circleLo     = 'rgba(200,230,255,0.05)';
    dotC         = 'rgba(255,255,255,0.13)';
    sparkC       = 'rgba(255,255,255,0.28)';
    accentStroke = 'rgba(255,255,255,0.15)';
  }

  /* ── 8. SVG background (pure <svg> injection — html2canvas safe) ── */
  var VB = '0 0 400 240';
  var svg = '<svg class="sc-geo-bg" xmlns="http://www.w3.org/2000/svg" viewBox="'+VB+'" preserveAspectRatio="xMidYMid slice">';

  svg += '<defs>';
  svg += '<radialGradient id="scBigArc" cx="85%" cy="-5%" r="55%">';
  svg += '<stop offset="0%" stop-color="'+circleHi+'"/>';
  svg += '<stop offset="60%" stop-color="'+circleLo+'"/>';
  svg += '<stop offset="100%" stop-color="transparent"/>';
  svg += '</radialGradient>';
  svg += '<radialGradient id="scSmArc" cx="10%" cy="110%" r="45%">';
  svg += '<stop offset="0%" stop-color="'+circleLo+'"/>';
  svg += '<stop offset="100%" stop-color="transparent"/>';
  svg += '</radialGradient>';
  svg += '</defs>';
  svg += '<rect width="400" height="240" fill="url(#scBigArc)"/>';
  svg += '<rect width="400" height="240" fill="url(#scSmArc)"/>';

  svg += '<circle cx="340" cy="20" r="110" fill="none" stroke="'+circleHi+'" stroke-width="1.5"/>';
  svg += '<circle cx="350" cy="10" r="75"  fill="none" stroke="'+circleHi+'" stroke-width="1"/>';
  svg += '<circle cx="30"  cy="220" r="55" fill="none" stroke="'+circleLo+'" stroke-width="1.2"/>';

  var _s = 42;
  function R(){ _s = (_s*1664525 + 1013904223) & 0xffffffff; return ((_s>>>0)/0xffffffff); }
  for(var i=0; i<16; i++){
    var dx = 20 + R()*360, dy = 15 + R()*210, dr = 1.2 + R()*2.2;
    svg += '<circle cx="'+dx.toFixed(1)+'" cy="'+dy.toFixed(1)+'" r="'+dr.toFixed(1)+'" fill="'+dotC+'"/>';
  }

  var spk = [[365,55,7],[25,30,5],[180,8,4],[15,180,5],[375,200,6],[200,230,4]];
  spk.forEach(function(s){
    var x=s[0], y=s[1], r=s[2], ir=r*0.25;
    var d = 'M'+x+','+(y-r)+' L'+(x+ir)+','+(y-ir)+' L'+(x+r)+','+y+
            ' L'+(x+ir)+','+(y+ir)+' L'+x+','+(y+r)+' L'+(x-ir)+','+(y+ir)+
            ' L'+(x-r)+','+y+' L'+(x-ir)+','+(y-ir)+'Z';
    svg += '<path d="'+d+'" fill="'+sparkC+'"/>';
  });

  svg += '<line x1="290" y1="0" x2="400" y2="110" stroke="'+accentStroke+'" stroke-width="0.8"/>';
  svg += '<line x1="310" y1="0" x2="400" y2="90"  stroke="'+accentStroke+'" stroke-width="0.5"/>';

  if(isTierS){
    svg += '<defs><linearGradient id="scGoldShim" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">';
    svg += '<stop offset="0%" stop-color="transparent"/>';
    svg += '<stop offset="32%" stop-color="transparent"/>';
    svg += '<stop offset="44%" stop-color="rgba(255,240,160,0.09)"/>';
    svg += '<stop offset="50%" stop-color="rgba(255,248,200,0.18)"/>';
    svg += '<stop offset="56%" stop-color="rgba(255,240,160,0.09)"/>';
    svg += '<stop offset="68%" stop-color="transparent"/>';
    svg += '<stop offset="100%" stop-color="transparent"/>';
    svg += '</linearGradient></defs>';
    svg += '<rect width="400" height="240" fill="url(#scGoldShim)"/>';
    svg += '<path d="M160,5 Q200,-15 240,5" fill="none" stroke="rgba(255,215,0,0.28)" stroke-width="1.5"/>';
    svg += '<path d="M140,12 Q200,-22 260,12" fill="none" stroke="rgba(255,215,0,0.18)" stroke-width="1"/>';
    svg += '<text x="200" y="20" text-anchor="middle" font-size="14" fill="rgba(255,215,0,0.4)">♛</text>';
  }

  svg += '</svg>';

  var wrap = document.createElement('div');
  wrap.innerHTML = svg;
  card.insertBefore(wrap.firstChild, card.firstChild);
}

function getShareText(lang){
  var persona = getPersona();
  var label = (lang==='zh-TW') ? persona.title_tw : persona.title_cn;
  var url = window.location.origin || 'https://lifescore.space';
  return lang==='zh-TW'
    ? '我在人生評分測試中獲得了 '+finalScore+'/150 分（'+label+'）！快來測測你的分數 → '+url
    : '我在人生评分测试中获得了 '+finalScore+'/150 分（'+label+'）！快来测测你的分数 → '+url;
}

function setupShareModal(){
  var btn=document.getElementById('shareBtn');
  var overlay=document.getElementById('shareModalOverlay');
  var modal=document.getElementById('shareModal');
  var closeBtn=document.getElementById('shareModalClose');
  var wechatHint=document.getElementById('wechatHint');
  if(!btn||!overlay) return;

  function openModal(){ overlay.classList.add('open'); document.body.style.overflow='hidden'; if(wechatHint) wechatHint.style.display='none'; }
  function closeModal(){ overlay.classList.remove('open'); document.body.style.overflow=''; }

  btn.addEventListener('click', openModal);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) closeModal(); });
  if(closeBtn) closeBtn.addEventListener('click', closeModal);

  var lang = window.I18N_CURRENT||'zh-CN';
  var text = getShareText(lang);
  var url  = encodeURIComponent(window.location.origin || 'https://lifescore.space');
  var encodedText = encodeURIComponent(text);

  function showScreenshotHint(){
    if(!wechatHint) return;
    wechatHint.style.display='flex';
    var hint=wechatHint.querySelector('span');
    if(hint){
      hint.textContent = (window.I18N_CURRENT==='zh-TW')
        ? '請長按保存圖片或截圖後分享'
        : '请长按保存图片或截图后分享';
    }
  }

  var wb=document.getElementById('sp-weibo');
  if(wb) wb.href='https://service.weibo.com/share/share.php?url='+url+'&title='+encodedText;

  var qz=document.getElementById('sp-qzone');
  if(qz) qz.href='https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url='+url+'&title='+encodedText;

  ['sp-wechat','sp-rednote','sp-douyin','sp-kuaishou'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    if(el.tagName==='A') el.setAttribute('href','javascript:void(0)');
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      showScreenshotHint();
    });
  });

  var copyBtn=document.getElementById('sp-copy');
  if(copyBtn){
    copyBtn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      var t=getShareText(window.I18N_CURRENT||'zh-CN');
      function flashCopied(){
        var sp=copyBtn.querySelector('span:last-child');
        if(sp){
          var o=sp.textContent;
          sp.textContent=(window.I18N_CURRENT==='zh-TW'?'已複製！':'已复制！');
          setTimeout(function(){ sp.textContent=o; },2000);
        }
      }
      if(navigator.clipboard){
        navigator.clipboard.writeText(t).then(flashCopied, flashCopied);
      } else {
        var ta=document.createElement('textarea');
        ta.value=t;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(_){}
        document.body.removeChild(ta);
        flashCopied();
      }
    });
  }

  var saveBtn=document.getElementById('sp-save');
  if(saveBtn){
    saveBtn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      var card=document.getElementById('shareCard');
      if(!card) return;

      var sp=saveBtn.querySelector('span:last-child');
      var origLabel=sp?sp.textContent:'';
      if(sp) sp.textContent=(window.I18N_CURRENT==='zh-TW'?'生成中…':'生成中…');
      saveBtn.disabled=true;

      function restoreBtn(){
        if(sp) sp.textContent=origLabel;
        saveBtn.disabled=false;
      }

      function showImageOverlay(dataUrl){
        var prior=document.getElementById('lsSaveImageOverlay');
        if(prior) prior.remove();

        var isTW = (window.I18N_CURRENT==='zh-TW');
        var labelText = isTW ? '長按圖片保存到相冊' : '长按图片保存到相册';
        var closeText = isTW ? '關閉' : '关闭';

        var ov=document.createElement('div');
        ov.id='lsSaveImageOverlay';
        ov.setAttribute('style',
          'position:fixed;inset:0;z-index:10000;'+
          'background:rgba(0,0,0,0.88);'+
          'display:flex;flex-direction:column;align-items:center;justify-content:center;'+
          'padding:24px 16px;box-sizing:border-box;'+
          'overflow-y:auto;-webkit-overflow-scrolling:touch;'
        );

        var closeX=document.createElement('button');
        closeX.type='button';
        closeX.setAttribute('aria-label', closeText);
        closeX.setAttribute('style',
          'position:absolute;top:14px;right:14px;'+
          'width:40px;height:40px;border-radius:50%;'+
          'background:rgba(255,255,255,0.14);'+
          'border:1px solid rgba(255,255,255,0.25);'+
          'color:#fff;font-size:22px;line-height:1;cursor:pointer;'+
          'display:flex;align-items:center;justify-content:center;'+
          '-webkit-tap-highlight-color:transparent;'
        );
        closeX.innerHTML='&times;';
        closeX.addEventListener('click', function(ev){
          ev.preventDefault(); ev.stopPropagation();
          ov.remove();
        });
        ov.appendChild(closeX);

        var img=document.createElement('img');
        img.src=dataUrl;
        img.alt='Life Score';
        img.setAttribute('style',
          'max-width:100%;max-height:72vh;'+
          'width:auto;height:auto;'+
          'border-radius:12px;'+
          'box-shadow:0 12px 40px rgba(0,0,0,0.55);'+
          'user-select:none;'+
          '-webkit-user-select:none;'+
          '-webkit-touch-callout:default;'
        );
        img.addEventListener('click', function(ev){ ev.stopPropagation(); });
        ov.appendChild(img);

        var label=document.createElement('div');
        label.setAttribute('style',
          'margin-top:18px;padding:10px 18px;'+
          'font-size:15px;line-height:1.5;font-weight:600;'+
          'color:#fff;text-align:center;'+
          'background:rgba(255,255,255,0.10);'+
          'border:1px solid rgba(255,255,255,0.18);'+
          'border-radius:999px;'+
          'max-width:92%;'
        );
        label.textContent=labelText;
        ov.appendChild(label);

        var closeBtn2=document.createElement('button');
        closeBtn2.type='button';
        closeBtn2.textContent=closeText;
        closeBtn2.setAttribute('style',
          'margin-top:14px;padding:10px 28px;'+
          'font-size:14px;font-weight:600;'+
          'color:rgba(255,255,255,0.85);'+
          'background:transparent;'+
          'border:1px solid rgba(255,255,255,0.30);'+
          'border-radius:999px;cursor:pointer;'+
          '-webkit-tap-highlight-color:transparent;'
        );
        closeBtn2.addEventListener('click', function(ev){
          ev.preventDefault(); ev.stopPropagation();
          ov.remove();
        });
        ov.appendChild(closeBtn2);

        ov.addEventListener('click', function(ev){
          if(ev.target===ov) ov.remove();
        });

        document.body.appendChild(ov);
      }

      function doCapture(){
        html2canvas(card, {
          scale: 3,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        }).then(function(canvas){
          var dataUrl=canvas.toDataURL('image/png');
          showImageOverlay(dataUrl);
          restoreBtn();
        }).catch(function(){
          fallbackSave();
        });
      }

      function fallbackSave(){
        restoreBtn();
        if(wechatHint){
          wechatHint.style.display='flex';
          var hint=wechatHint.querySelector('span');
          if(hint) hint.textContent=(window.I18N_CURRENT==='zh-TW'
            ? '無法自動生成，請長按卡片或截圖保存。'
            : '无法自动生成，请长按卡片或截图保存。');
        }
      }

      if(typeof html2canvas==='function'){
        doCapture();
      } else {
        var s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload=doCapture;
        s.onerror=fallbackSave;
        document.head.appendChild(s);
      }
    });
  }
}

/* ── Shared UI ── */
function setupLangSwitcher(){
  var ls=document.getElementById('langSwitcher'); if(!ls) return;
  ls.addEventListener('click',function(e){ e.stopPropagation(); ls.classList.toggle('open'); });
  document.addEventListener('click',function(){ ls.classList.remove('open'); });
  document.querySelectorAll('.lang-option').forEach(function(o){
    o.addEventListener('click',function(e){ e.stopPropagation(); window.applyI18n(o.dataset.lang); ls.classList.remove('open'); });
  });
}
function setupMobileNav(){
  var mt=document.getElementById('menuToggle'),nav=document.getElementById('nav'); if(!mt||!nav) return;
  mt.addEventListener('click',function(){ var o=nav.classList.toggle('mobile-open'); mt.setAttribute('aria-expanded',o); });
}
function setupParticles(){
  var pc=document.getElementById('particles'); if(!pc) return;
  for(var i=0;i<12;i++){
    var p=document.createElement('div'); p.className='particle';
    var s=Math.random()*8+3;
    p.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;--dur:'+(Math.random()*14+8)+'s;--delay:'+(Math.random()*12)+'s;--op:'+(Math.random()*.1+.03).toFixed(2)+';';
    pc.appendChild(p);
  }
}

function patchI18n(){
  var orig=window.applyI18n;
  window.applyI18n=function(lang){ orig(lang); updateContent(); };
}

function init(){
  var data=loadResult();
  if(!data){
    window.location.replace('index.html');
    return;
  }
  finalScore=data.finalScore;
  finalScorePrecise=(typeof data.finalScorePrecise==='number')?data.finalScorePrecise:data.finalScore;
  dimPct=data.dimPct; dimPctRaw=data.dimPctRaw||{}; answerMap=data.answerMap||{};
  activeQueue=data.activeQueue||[]; resultLang=data.lang||'zh-CN';
  baseScore=data.baseScore||finalScore; bonusScore=data.bonusScore||0;
  quizMode=data.quizMode||'deep';

  /* Set retake button to match the quiz mode the user originally took */
  var retakeBtn=document.getElementById('btnRetake');
  if(retakeBtn){
    var retakeHref = data.quizMode==='deep' ? 'quiz.html' : 'quiz-quick.html';
    retakeBtn.setAttribute('onclick', "window.location.href='"+retakeHref+"'");
  }

  window.scrollTo(0,0);
  patchI18n();
  window.applyI18n();
  animateCircle();
  updateContent();
  setupLangSwitcher(); setupMobileNav(); setupParticles(); setupShareModal(); setupPaymentModal();

  document.body.style.opacity='0'; document.body.style.transition='opacity .5s ease';
  requestAnimationFrame(function(){ document.body.style.opacity='1'; });

  var toast=document.getElementById('savedToast');
  if(toast) setTimeout(function(){ toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); },3000); },1000);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
})();
