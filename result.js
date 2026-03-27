/* result.js — comprehensive result display with fixed improve logic + share modal */
(function(){
'use strict';

/* ── locale helper ── */
function ql(cn, tw, en, es) {
  var l = window.I18N_CURRENT || 'zh-CN';
  if (l === 'en-US') return en || cn;
  if (l === 'es-US') return es || en || cn;
  if (l === 'zh-TW') return tw || cn;
  return cn;
}
var CIRC = 2 * Math.PI * 90;
var finalScore, dimPct, dimPctRaw, answerMap, activeQueue, resultLang, baseScore, bonusScore, quizMode;

/* Helper: return the correct question bank based on quiz mode */
function getBank(){
  return (quizMode==='quick' && window.QUICK_QUESTION_BANK)
    ? window.QUICK_QUESTION_BANK
    : window.QUESTION_BANK;
}

function loadResult(){
  try{ var r=sessionStorage.getItem('ls_result'); if(r) return JSON.parse(r); }catch(e){}
  return null;
}

function getVerdict(s){
  if(s>110) return'exceptional';  /* bonus tier: >110 */
  if(s>=90) return'excellent';
  if(s>=70) return'high';
  if(s>=50) return'mid';
  if(s>=35) return'mid-low';
  return'low';
}
function getRank(s){
  /* For scores >110, extrapolate into top 1% */
  if(s>110) return Math.max(1, Math.round(3 - (s-110)*0.05));
  var t=(s-50)/20, sig=1/(1+Math.exp(-t)); return Math.round(sig*92+4);
}

/* ── Animate circle ── */
function animateCircle(){
  var rcFill=document.getElementById('rcFill'), rcScore=document.getElementById('rcScore');
  if(!rcFill||!rcScore) return;
  setTimeout(function(){ rcFill.style.strokeDashoffset=CIRC*(1-Math.min(finalScore,150)/150); },80);
  var dur=2000, t0=null;
  function step(ts){ if(!t0) t0=ts+350; if(ts<t0){ requestAnimationFrame(step); return; }
    var p=Math.min((ts-t0)/dur,1), e=1-Math.pow(1-p,3); rcScore.textContent=Math.round(e*finalScore); if(p<1) requestAnimationFrame(step); }
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
  var t;
  if(lang==='en-US') t=['Needs Work','Developing','Fair','Good','Excellent','Outstanding'];
  else if(lang==='es-US') t=['Por mejorar','En desarrollo','Aceptable','Bueno','Excelente','Sobresaliente'];
  else if(lang==='zh-TW') t=['待提升','發展中','尚可','良好','優秀','卓越'];
  else t=['待提升','发展中','尚可','良好','优秀','卓越'];
  if(s<17)return t[0]; if(s<34)return t[1]; if(s<50)return t[2]; if(s<67)return t[3]; if(s<84)return t[4]; return t[5];
}
function buildDims(lang){
  var c=document.getElementById('dimRows'); if(!c) return; c.innerHTML='';
  DIM_CONF.forEach(function(d){
    var score=dimPct&&dimPct[d.key]!=null?dimPct[d.key]:0;
    var row=document.createElement('div'); row.className='dim-row';
    row.innerHTML='<div class="dim-meta"><span class="dim-name"><span class="dim-icon">'+d.icon+'</span><span data-i18n="'+d.i18n+'">'+window.t(d.i18n)+'</span></span>'+
      '<span class="dim-score-val" style="color:'+d.color+'">'+score+'<span class="dim-score-unit"> / 150</span></span></div>'+
      '<div class="dim-track"><div class="dim-fill" data-pct="'+score+'" style="width:0;background:'+d.color+'"></div></div>'+
      '<div class="dim-tier-row"><span class="dim-tier-badge" style="color:'+d.color+';background:'+d.color+'18">'+tier(score,lang)+'</span>'+buildMini(score)+'</div>';
    c.appendChild(row);
  });
  setTimeout(function(){ document.querySelectorAll('.dim-fill').forEach(function(f){ f.style.width=f.dataset.pct+'%'; }); },600);
}
function buildMini(score){
  var bars=''; for(var i=0;i<5;i++) bars+='<div class="mini-bar'+(score>=(i+1)*20?' filled':'')+'"></div>';
  return '<div class="mini-bars">'+bars+'</div>';
}

/* ── Score breakdown ── */
function buildBreakdown(){
  var el=document.getElementById('scoreBreakdown'); if(!el) return;
  var lang=window.I18N_CURRENT||'zh-CN';
  var _isEN=(lang==='en-US'||lang==='es-US');
  var _bonusLabel=_isEN?(lang==='es-US'?'Puntos élite':'Bonus'):(lang==='zh-TW'?'加分題':'加分题');
  var _totalLabel=_isEN?(lang==='es-US'?'Puntaje total':'Total Score'):(lang==='zh-TW'?'綜合分數':'综合分数');
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
      '<span class="br-name">'+_bonusLabel+'</span>'+
      '<span class="br-score"></span><span class="br-x"></span>'+
      '<span class="br-weight"></span><span class="br-eq"></span>'+
      '<span class="br-contrib">+'+bonusScore+'</span></div>';
  }
  el.innerHTML='<div class="breakdown-grid">'+rows+bonusRow+
    '<div class="breakdown-total"><span>'+_totalLabel+'</span><span class="bt-score">'+finalScore+'</span></div></div>';
}

/* ── Highlights ── */
var SECTION_COLORS={basic:'#7dd3fc',social:'#0ea5e9',identity:'#10b981'};
function buildHighlights(lang){
  var c=document.getElementById('highlightRows'); if(!c||!answerMap) return; c.innerHTML='';
  var scored=[];
  getBank().forEach(function(q){
    if(!q.scorable||!answerMap[q.id]) return;
    var oi=answerMap[q.id].questionIdx, opt=q.options[oi];
    if(opt&&opt.score>=3) scored.push({q:q, score:opt.score, oi:oi, opt:opt});
  });
  scored.sort(function(a,b){ return b.score-a.score; });
  var top=scored.slice(0,4);
  if(!top.length){ c.innerHTML='<div class="empty-note">'+(lang==='en-US'?'Keep going — your highlights are building up.':(lang==='es-US'?'¡Sigue adelante — tus fortalezas están creciendo!':(lang==='zh-TW'?'繼續努力，亮點正在積累中。':'继续努力，亮点正在积累中。')))+'</div>'; return; }
  top.forEach(function(item){
    var row=document.createElement('div'); row.className='highlight-row';
    var qText=window.qlang?window.qlang(item.q):(lang==='zh-TW'?item.q.tw:item.q.cn);
    var oText;
    if(lang==='en-US') oText=answerMap[item.q.id].optionText_en||answerMap[item.q.id].optionText_cn;
    else if(lang==='es-US') oText=answerMap[item.q.id].optionText_es||answerMap[item.q.id].optionText_en||answerMap[item.q.id].optionText_cn;
    else if(lang==='zh-TW') oText=answerMap[item.q.id].optionText_tw;
    else oText=answerMap[item.q.id].optionText_cn;
    if(!oText) oText=answerMap[item.q.id].optionText_cn;
    var mc=SECTION_COLORS[item.q.section]||'#7dd3fc';
    var _scoreLabel=lang==='en-US'?'pts':(lang==='es-US'?'pts':'分');
    row.innerHTML='<div class="hl-score-dot" style="background:'+mc+'">'+item.score*25+'<small>'+_scoreLabel+'</small></div>'+
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
  var UNCONTROLLABLE_IDS = new Set(['A1','A3h','A3hf','QK1','QK4m','QK4f','QK5m','QK5f','A4','QKC8']);

  /* Advice texts — cn/tw pairs per question ID */
  var ADVICE={
    /* ── Basic / Health ── */
    A3:{
      cn:'体型改善不靠意志力，靠系统。本周只做一件事：把每天的主食量减少1/4，并增加一次30分钟以上的快走。6周后重新评估。',
      tw:'體型改善不靠意志力，靠系統。本週只做一件事：把每天的主食量減少1/4，並增加一次30分鐘以上的快走。6週後重新評估。',
      en:'Body composition improves through systems, not willpower. This week do one thing: reduce your main carb portions by 1/4 and add one 30-minute brisk walk. Reassess in 6 weeks.',
      es:'La composición corporal mejora con sistemas, no con fuerza de voluntad. Esta semana haz una cosa: reduce tus porciones de carbohidratos principales en 1/4 y añade una caminata rápida de 30 minutos. Reevalúa en 6 semanas.',
    },
    A6:{
      cn:'提升学历不一定要全日制——在职研究生、行业认证（PMP/CPA/CFA等）投入产出比更高，且不耽误收入。先研究你行业的"含金量最高"证书。',
      tw:'提升學歷不一定要全日制——在職研究生、行業認證（PMP/CPA/CFA等）投入產出比更高，且不耽誤收入。先研究你行業的「含金量最高」證書。',
      en:'Upgrading your credentials doesn\'t require going full-time. Part-time grad programs and industry certifications (PMP, CPA, CFA, AWS) have better ROI and don\'t interrupt income. Research the highest-value credential in your industry first.',
      es:'Mejorar tus credenciales no requiere dedicación completa. Los programas de posgrado a tiempo parcial y las certificaciones de la industria (PMP, CPA, CFA, AWS) tienen mejor ROI y no interrumpen los ingresos.',
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
      cn:'应急储备的建立方式：从下月薪资日起，自动转走固定金额（哪怕 $50）到一个单独账户，命名为"紧急备用金"，设置无法随意取用的规则。',
      tw:'應急儲備的建立方式：從下月薪資日起，自動轉走固定金額（哪怕 $50）到一個單獨帳戶，命名為「緊急備用金」，設置無法隨意取用的規則。',
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
    var nextText=window.qlang?window.qlang(nextOpt):(lang==='zh-TW'?nextOpt.tw:nextOpt.cn);

    /* 每档专属建议 */
    var adviceMap={
      0:{cn:'第一步是止血：清点所有负债，按利率排序，优先偿还信用卡和消费贷。暂缓任何投资，先建立1个月的最低应急储备。',
         tw:'第一步是止血：清點所有負債，按利率排序，優先償還信用卡和消費貸。暫緩任何投資，先建立1個月的最低應急儲備。', en:'Step one: stop the bleeding. List every debt, sort by interest rate, and pay off credit cards and personal loans first. Pause investing. Build just one month of emergency reserves first.', es:'Paso uno: detener el sangrado. Lista todas las deudas, ordénalas por tasa de interés y paga primero las tarjetas de crédito y préstamos personales. Pausa las inversiones. Construye primero una reserva de emergencia de un mes.'},
      1:{cn:'从0到有：本月建立"先存后花"反射——发薪后立即转走10%（哪怕100元）到独立账户，命名为"未来基金"，不动它。',
         tw:'從0到有：本月建立「先存後花」反射——發薪後立即轉走10%（哪怕100元）到獨立帳戶，命名為「未來基金」，不動它。', en:'Zero to something: this month, set up auto-transfer — move 10% of your paycheck into a separate account labeled \'Future Fund\' the moment it hits. The habit matters more than the amount.', es:'De cero a algo: este mes, configura una transferencia automática — mueve el 10% de tu cheque a una cuenta separada llamada \'Fondo Futuro\' en cuanto llegue. El hábito importa más que la cantidad.'},
      2:{cn:'积累早期的关键是提高储蓄率，而非投资收益率。目标：把每月结余提高到收入的15%以上，同时消除最主要的1项不必要支出。',
         tw:'積累早期的關鍵是提高儲蓄率，而非投資收益率。目標：把每月結餘提高到收入的15%以上，同時消除最主要的1項不必要支出。', en:'In the early accumulation phase, savings rate matters more than investment returns. Goal: push your monthly surplus above 15% of income while eliminating your biggest unnecessary expense.', es:'En la fase de acumulación temprana, la tasa de ahorro importa más que el rendimiento de la inversión. Meta: lleva tu excedente mensual por encima del 15% de tus ingresos mientras eliminas tu mayor gasto innecesario.'},
      3:{cn:'到1万元后，建立应急储备（3个月生活费放货币基金），余量开始定投宽基指数基金，门槛低、长期稳健。',
         tw:'到1萬元後，建立應急儲備（3個月生活費放貨幣基金），餘量開始定投寬基指數基金，門檻低、長期穩健。', en:'Once you reach $2,000–$5,000: build an emergency fund (3 months of expenses in a high-yield savings account), then start auto-investing the rest into a low-cost index fund.', es:'Una vez que alcances $2,000–$5,000: construye un fondo de emergencia (3 meses de gastos en una cuenta de ahorros de alto rendimiento), luego comienza a invertir automáticamente el resto en un fondo índice de bajo costo.'},
      4:{cn:'2万到10万阶段：应急储备到位后，考虑增加储蓄率到20%+。同时了解你可用的税优账户（401k/Roth IRA 等）。',
         tw:'2萬到10萬階段：應急儲備到位後，考慮增加儲蓄率到20%+。同時了解你可用的稅優帳戶（個人養老金等）。', en:'$5K–$20K phase: once your emergency fund is solid, increase savings rate to 20%+. Maximize your 401(k) match and explore opening a Roth IRA.', es:'Fase de $5K–$20K: una vez que tu fondo de emergencia esté sólido, aumenta la tasa de ahorro al 20%+. Maximiza tu aportación con match del 401(k) y considera abrir un Roth IRA.'},
      5:{cn:'10万到25万：这个阶段可以开始考虑资产配置——货币基金应急+股票型基金长期增值+保险保障。不要把所有钱放在一个篮子里。',
         tw:'10萬到25萬：這個階段可以開始考慮資產配置——貨幣基金應急+股票型基金長期增值+保險保障。不要把所有錢放在一個籃子裡。', en:'$20K–$50K: start thinking about asset allocation — HYSA for emergencies + broad index funds for long-term growth + term life and disability insurance for protection. Don\'t put all eggs in one basket.', es:'De $20K a $50K: empieza a pensar en asignación de activos — HYSA para emergencias + fondos índice amplios para crecimiento a largo plazo + seguro de vida a término y por discapacidad. No pongas todos los huevos en una canasta.'},
      6:{cn:'25万到50万：评估房产是否在你的计划中。如果是，计算距目标首付还需多少月并制定计划；如果不是，开始建立正式的投资组合框架。',
         tw:'25萬到50萬：評估房產是否在你的計劃中。如果是，計算距目標首付還需多少月並制定計劃；如果不是，開始建立正式的投資組合框架。', en:'$50K–$150K: evaluate whether homeownership fits your timeline. If yes, calculate how many months to your down payment and build a savings plan. If not, build your formal investment portfolio framework.', es:'De $50K a $150K: evalúa si la compra de casa encaja en tu cronograma. Si es así, calcula cuántos meses faltan para tu pago inicial. Si no, construye tu marco formal de cartera de inversiones.'},
      7:{cn:'50万到100万：购买足额寿险和重疾险，保护已有积累不被意外医疗清零。同时评估资产结构：现金/基金/房产的比例是否合理？',
         tw:'50萬到100萬：購買足額壽險和重疾險，保護已有積累不被意外醫療清零。同時評估資產結構：現金/基金/房產的比例是否合理？', en:'$150K–$300K: buy adequate term life and disability insurance to protect your accumulated wealth from being wiped out by a medical event. Review your asset mix: cash / index funds / real estate — is the ratio right?', es:'De $150K a $300K: compra seguro de vida a término y por discapacidad adecuados para proteger tu patrimonio acumulado de un evento médico. Revisa tu mezcla de activos: efectivo / fondos índice / bienes raíces — ¿es la proporción correcta?'},
      8:{cn:'100万到500万：这是从"储蓄型"向"配置型"转变的关键节点。考虑引入专业理财规划，了解股权类资产和固收资产的平衡配比。',
         tw:'100萬到500萬：這是從「儲蓄型」向「配置型」轉變的關鍵節點。考慮引入專業理財規劃，了解股權類資產和固收資產的平衡配比。', en:'$300K–$1M: this is the pivot from \'saver\' to \'investor\'. Consider working with a fee-only financial planner. Understand the balance between equity assets and fixed income at your stage.', es:'De $300K a $1M: este es el pivote de \'ahorrador\' a \'inversionista\'. Considera trabajar con un planificador financiero de solo honorarios. Entiende el equilibrio entre activos de renta variable y renta fija en tu etapa.'},
      9:{cn:'500万到1000万：税务规划开始变得重要。了解个人持有与公司架构在税负上的差异；同时确保流动资产占比不低于净资产的20%。',
         tw:'500萬到1000萬：稅務規劃開始變得重要。了解個人持有與公司架構在稅負上的差異；同時確保流動資產佔比不低於淨資產的20%。', en:'$1M–$3M: tax planning becomes critical. Understand the differences between personal holdings and LLC/trust structures. Ensure liquid assets represent at least 20% of your net worth.', es:'De $1M a $3M: la planificación fiscal se vuelve crítica. Entiende las diferencias entre tenencias personales y estructuras LLC/fideicomiso. Asegúrate de que los activos líquidos representen al menos el 20% de tu patrimonio neto.'},
      10:{cn:'1000万到1亿：在这个量级，财富最大的威胁是"失去"而非"不够多"——税务、法律、健康、家庭变故。建立完整的家族财富保护框架。',
          tw:'1000萬到1億：在這個量級，財富最大的威脅是「失去」而非「不夠多」——稅務、法律、健康、家庭變故。建立完整的家族財富保護框架。', en:'$3M+: at this scale, wealth\'s biggest threat is loss, not insufficient growth — taxes, legal exposure, health crises, family changes. Build a comprehensive wealth protection framework.', es:'Más de $3M: a esta escala, la mayor amenaza para la riqueza es la pérdida, no el crecimiento insuficiente — impuestos, exposición legal, crisis de salud, cambios familiares. Construye un marco integral de protección del patrimonio.'},
    };
    var advice=adviceMap[oi];
    return {
      nextText: nextText,
      advice: advice ? (lang==='en-US'?(advice.en||advice.cn):(lang==='es-US'?(advice.es||advice.en||advice.cn):(lang==='zh-TW'?advice.tw:advice.cn))) : null,
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
    var am=answerMap[item.q.id];
    var txt;
    if(lang==='en-US') txt=(am&&am.optionText_en)||item.opt.en||item.opt.cn||'';
    else if(lang==='es-US') txt=(am&&am.optionText_es)||(am&&am.optionText_en)||item.opt.es||item.opt.en||item.opt.cn||'';
    else if(lang==='zh-TW') txt=(am&&am.optionText_tw)||item.opt.tw||'';
    else txt=(am&&am.optionText_cn)||item.opt.cn||'';
    if(!txt) return '';
    if(lang==='en-US') return 'Quick win: You answered "'+txt+'". Pick one small actionable step, commit to it for 14 days, then decide your next move.';
    if(lang==='es-US') return 'Accion rapida: Respondiste "'+txt+'". Elige un paso ejecutable y comprometete 14 dias seguidos - luego decide tu proximo movimiento.';
    return lang==='zh-TW'
      ? '建議實作：你目前選擇「'+txt+'」。先從可執行的小步驟開始，連續實踐１４天並記錄變化，再決定下一步加碼。'
      : '建议实操：你当前选择“'+txt+'”。先从一个可执行的小步骤开始，连续实践１４天并记录变化，再决定下一步加码。';
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
      var b4r=getB4NextStep(oi, lang||window.I18N_CURRENT||'zh-CN');
      if(!b4r) return;
      gap=1; nextText=b4r.nextText; advText=b4r.advice;
      low.push({q:q,oi:oi,opt:opt,nextText:nextText,gap:gap,advText:advText,score:(opt.score||0)});
    } else {
      var next=getNextStep(q, oi);
      if(!next.opt) return;
      gap=next.score-(opt.score||0);
      if(gap<1) return;
      if(lang==='en-US') nextText=next.opt.en||next.opt.cn;
      else if(lang==='es-US') nextText=next.opt.es||next.opt.en||next.opt.cn;
      else if(lang==='zh-TW') nextText=next.opt.tw||next.opt.cn;
      else nextText=next.opt.cn;
      var advObj=ADVICE[q.id] || (window.QUICK_IMPROVE_ADVICE && window.QUICK_IMPROVE_ADVICE[q.id]);
      if(advObj){
        if(lang==='en-US') advText=advObj.en||advObj.cn;
        else if(lang==='es-US') advText=advObj.es||advObj.en||advObj.cn;
        else if(lang==='zh-TW') advText=advObj.tw||advObj.cn;
        else advText=advObj.cn;
      } else { advText=fallbackAdviceByOption({q:q,opt:opt}); }
      low.push({q:q,oi:oi,opt:opt,nextText:nextText,gap:gap,advText:advText,score:(opt.score||0)});
    }
  });
  low.sort(function(a,b){ return b.gap-a.gap; });
  var worst=low.slice(0,5);

  if(!worst.length){
    c.innerHTML='<div class="empty-note">'+(lang==='en-US'?'All areas are balanced — no obvious weak spots.':(lang==='es-US'?'Todas las áreas están equilibradas — sin puntos débiles evidentes.':(lang==='zh-TW'?'各項表現均衡，沒有明顯短板。':'各项表现均衡，没有明显短板。')))+'</div>';
    return;
  }
  worst.forEach(function(item){
    var row=document.createElement('div'); row.className='improve-row';
    var qText=window.qlang?window.qlang(item.q):(lang==='zh-TW'?item.q.tw:item.q.cn);
    var curText;
    if(lang==='en-US') curText=answerMap[item.q.id].optionText_en||answerMap[item.q.id].optionText_cn;
    else if(lang==='es-US') curText=answerMap[item.q.id].optionText_es||answerMap[item.q.id].optionText_en||answerMap[item.q.id].optionText_cn;
    else if(lang==='zh-TW') curText=answerMap[item.q.id].optionText_tw||item.opt.tw;
    else curText=answerMap[item.q.id].optionText_cn||item.opt.cn;
    var _curLabel=lang==='en-US'?'Your answer: ':(lang==='es-US'?'Tu respuesta: ':(lang==='zh-TW'?'你的回答：':'你的回答：'));
    row.innerHTML=
      '<div class="imp-gap">↑'+item.gap+'</div>'+
      '<div class="imp-content">'+
        '<div class="imp-q">'+qText+'</div>'+
        '<div class="imp-current"><span class="imp-label">'+_curLabel+'</span>'+curText+'</div>'+
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
  'en-US':{
    low:"Your LifeScore is in the starting-out range — and that's a launchpad, not a ceiling. Three priorities worth tackling now:\n\n① Build your foundation — consistent sleep and moving your body 3 times a week will raise every other score. These aren't optional extras, they're the infrastructure.\n② Get clear on direction — spend one afternoon writing out what your life looks like in 5 years. Specific scenes, not vague wishes. Your brain commits to what it can visualize.\n③ Reconnect with one key person — reach out to someone you respect but haven't talked to in over 6 months. Real relationships are compounding assets.\n\nA 1% improvement each day adds up to 37× growth in a year.",
    'mid-low':"You've built a real foundation, but some important areas have been on the back burner. Time to address them:\n\n① Name your biggest gap — look at your \"Room to Grow\" section and pick the single item you're most capable of changing right now.\n② Design your environment — don't rely on willpower alone. Put your phone across the room at night, schedule workouts like meetings.\n③ Invest in relationships — reach out deeply to 3 people per month. Quality beats quantity every time.\n\nThe gap between you today and you in 6 months of focused effort is larger than you think.",
    mid:"You're solid — above average in most areas. But \"steady\" can quietly become \"stagnant.\" Time to level up:\n\n① Double down on your strongest dimension — turn your best area into a true competitive edge with a 90-day external milestone.\n② Push past your comfort zone — sign up for something slightly beyond your current ability (public speaking, a new skill, a race).\n③ Get a raise or make a move — if your income has been flat for over a year, that's a signal. Research your market rate and negotiate or explore new options.\n④ Build a public presence — write one post or article per week in your field. Six months of consistency creates real visibility.\n\nYou're one real leveling-up decision away from \"Outstanding.\"",
    high:"You're already ahead of most people. The next phase isn't about doing more — it's about doing better.\n\n① Cut low-value commitments — audit every obligation and eliminate anything that won't matter in 3 years. Protect your time ruthlessly.\n② Start multiplying your impact — you're capable of influencing others now. Think about how to systematically share your experience and knowledge.\n③ Build a 10-year vision — not just annual goals. People who operate on longer time horizons make fundamentally different decisions.\n④ Invest in your inner life — achievement and fulfillment aren't the same thing. Explore what actually makes you feel alive beyond the scoreboard.\n\nYou're good. The question now: what kind of person do you want to be, and what will you leave behind?",
    excellent:"You're in rare territory. Standard advice doesn't apply here. What's actually useful:\n\n① Think at the mission level — is your life goal big enough? Are you working on something larger than yourself?\n② Systematize your knowledge — the frameworks and judgment you've built have enormous value to others. Write them down, teach them, pass them on.\n③ Guard against complacency — the biggest risk at high achievement is pride and the slow death of curiosity. Stay genuinely humble. Keep learning hard things.\n④ Protect deep rest — real vacations and genuine mental stillness are the fuel for sustained excellence. Don't optimize them away.\n\nYour existence itself is an inspiration to the people around you.",
    exceptional:"You've scored over 100 — entering the elite bonus tier. This means you've not only excelled across all standard dimensions, but also hold externally verifiable credentials in elite education, professional achievement, entrepreneurial impact, or competitive excellence.\n\nYour challenge is no longer \"how to improve\" — it's \"how to choose.\" Your time and focus are your scarcest resources. The right question: which allocation of your unique advantages creates the greatest positive impact?\n\nConsider writing your \"life legacy list\" — if today were your last working day, what have you already left the world? Make that answer the strategic core of your next 3 years.",
  },
  'es-US':{
    low:"Tu LifeScore está en la etapa de inicio — y eso es un punto de partida, no un techo. Tres prioridades para atacar ahora:\n\n① Construye tu base — dormir bien y moverte 3 veces por semana eleva todos los demás puntajes. No son extras opcionales, son la infraestructura.\n② Clarifica tu dirección — dedica una tarde a escribir cómo luce tu vida en 5 años. Escenas concretas, no deseos vagos. Tu cerebro se compromete con lo que puede visualizar.\n③ Reconecta con alguien importante — escríbele a alguien que respetas pero con quien no has hablado en más de 6 meses. Las relaciones reales son activos que se capitalizan.\n\nUna mejora del 1% diario equivale a 37 veces de crecimiento en un año.",
    'mid-low':"Ya tienes una base sólida, pero algunas áreas importantes han estado en espera. Es hora de atenderlas:\n\n① Identifica tu mayor brecha — mira la sección \"Áreas de mejora\" y elige el ítem que más puedes cambiar ahora mismo.\n② Diseña tu entorno — no dependas solo de la fuerza de voluntad. Pon el teléfono lejos por las noches, agenda los entrenamientos como reuniones.\n③ Invierte en relaciones — conéctate profundamente con 3 personas al mes. La calidad supera la cantidad siempre.\n\nLa diferencia entre tú hoy y tú en 6 meses de esfuerzo enfocado es mayor de lo que crees.",
    mid:"Estás sólido — por encima del promedio en la mayoría de áreas. Pero \"estable\" puede convertirse en \"estancado.\" Momento de subir de nivel:\n\n① Duplica tu dimensión más fuerte — convierte tu mejor área en una ventaja competitiva real con un hito medible en 90 días.\n② Sal de tu zona de confort — inscríbete en algo ligeramente por encima de tu nivel actual (hablar en público, una nueva habilidad, una carrera).\n③ Consigue un aumento o muévete — si tu ingreso ha estado plano más de un año, eso es una señal. Investiga tu valor de mercado y negocia o explora nuevas opciones.\n④ Construye presencia pública — escribe una publicación por semana en tu área. Seis meses de consistencia crean visibilidad real.\n\nEstás a una decisión seria de pasar a \"Sobresaliente.\"",
    high:"Ya estás por delante de la mayoría. La siguiente fase no es hacer más — es hacer mejor.\n\n① Corta compromisos de bajo valor — audita cada obligación y elimina lo que no importará en 3 años. Protege tu tiempo con determinación.\n② Empieza a multiplicar tu impacto — ya puedes influir en otros. Piensa cómo compartir tu experiencia y conocimiento de forma sistemática.\n③ Construye una visión a 10 años — no solo metas anuales. Quienes operan en horizontes más largos toman decisiones fundamentalmente diferentes.\n④ Invierte en tu vida interior — logros y plenitud no son lo mismo. Explora qué te hace sentir vivo más allá del marcador.\n\nEstás bien. La pregunta ahora: ¿qué tipo de persona quieres ser y qué dejarás atrás?",
    excellent:"Estás en territorio poco frecuente. Los consejos estándar no aplican aquí. Lo que realmente es útil:\n\n① Piensa a nivel de misión — ¿tu objetivo de vida es suficientemente grande? ¿Estás trabajando en algo más grande que tú mismo?\n② Sistematiza tu conocimiento — los marcos y el juicio que has desarrollado tienen enorme valor para otros. Escríbelos, enséñalos, transfiérelos.\n③ Guárdate de la complacencia — el mayor riesgo en el alto rendimiento es el orgullo y la muerte lenta de la curiosidad. Mantente genuinamente humilde. Sigue aprendiendo cosas difíciles.\n④ Protege el descanso profundo — las vacaciones reales y la calma mental son el combustible de la excelencia sostenida.\n\nTu existencia misma es una inspiración para quienes te rodean.",
    exceptional:"Has superado los 100 puntos — entrando al nivel élite de bonificación. Esto significa que no solo destacas en todas las dimensiones estándar, sino que también tienes credenciales verificables en educación de élite, logros profesionales, impacto emprendedor o excelencia competitiva.\n\nTu desafío ya no es \"cómo mejorar\" — es \"cómo elegir.\" Tu tiempo y enfoque son tus recursos más escasos. La pregunta correcta: ¿qué asignación de tus ventajas únicas crea el mayor impacto positivo?\n\nConsidera escribir tu \"lista de legado\" — si hoy fuera tu último día de trabajo, ¿qué has dejado ya al mundo? Haz que esa respuesta sea el núcleo estratégico de tus próximos 3 años.",
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
       desc:'研究你所在行业和城市的薪资分位数（可用LinkedIn Salary / Glassdoor / Levels.fyi 查询），如果你低于中位数，制定一个3个月计划：更新简历、建立目标公司清单、开始面试。不要等涨薪——主动出击的人平均薪资增幅是被动等待者的3倍。'},
      {icon:'✍️', title:'开始持续内容输出',
       desc:'在LinkedIn、Medium 或 Substack选一个平台，每周发布1篇你的专业思考或行业洞察。不需要完美，需要持续。6个月后你会有一个真实可见的"专业人设"，这是最高效的被动机会吸引器。'},
      {icon:'📊', title:'启动投资理财计划',
       desc:'如果你还没有系统投资，现在开始：① 确保有6个月应急储备；② 开通指数基金账户（如 Fidelity/Vanguard），设置每月定投（哪怕 $50 起）；③ 了解你所在国家的税收优惠账户（如个人养老金账户）。时间在投资中的价值比本金更重要。'},
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
  'en-US':{
    low:[
      {icon:'🌅', title:'Fix Your Sleep First',
       desc:'This week: stop scrolling by 10 pm, charge your phone outside the bedroom. Sleep deprivation cuts your executive function, mood, and memory by up to 30%. Zero cost, immediate results.'},
      {icon:'📋', title:'Write Your "5-Year Scene"',
       desc:'Take a blank page and finish this sentence: "In 5 years, I\'m living in _____, doing _____, with _____." Write at least 200 words. The more specific, the more real it feels to your brain.'},
      {icon:'🤝', title:'Reach Out to One Key Person',
       desc:'Open your contacts and find someone you genuinely respect but haven\'t talked to in 6+ months. Send a real message — not a group forward. Real relationships are the highest-ROI investment most people neglect.'},
      {icon:'💰', title:'Automate 10% Before You Spend',
       desc:'Starting this paycheck: set up an auto-transfer on payday — move 5–10% to a separate savings account before you see it. The savings rate matters more than the amount. It trains the habit that builds wealth.'},
      {icon:'📖', title:'10 Minutes of Real Reading Daily',
       desc:'Pick one book related to your goals. Read 10 pages every night before bed. No notes required. Over a year that\'s 3,650 pages — equivalent to 10–15 books. Compound curiosity is real.'},
    ],
    'mid-low':[
      {icon:'🔍', title:'Diagnose Your Biggest Gap',
       desc:'Look at your "Room to Grow" section. Pick the lowest-scoring area you actually have control over. Write: "In 30 days I will ___." Don\'t try to fix everything — one focused breakthrough creates momentum for the rest.'},
      {icon:'💰', title:'Build a Monthly Money Review',
       desc:'Last day of every month: spend 20 minutes reviewing how much came in, went out, was saved, and invested. Set a target savings rate (aim for 20%+). You don\'t need to track every purchase — just know the ratios.'},
      {icon:'🏃', title:'Put Workouts on Your Calendar',
       desc:'Choose 3 fixed times per week and block "workout 30 min" on your calendar like a meeting. Research shows scheduling exercise triples follow-through vs. relying on motivation alone. The goal isn\'t weight — it\'s cognitive function and mood.'},
      {icon:'🧩', title:'Learn One Marketable Skill',
       desc:'Pick a skill with stable demand that genuinely interests you (data analysis, design, copywriting, coding, a second language). Dedicate weekends to it for 3 months. Skills aren\'t for your resume — they\'re for having an independent unit of value.'},
      {icon:'👥', title:'Invest Deeply in 3 Relationships',
       desc:'Pick 3 people in your network worth investing in. Reach out meaningfully once a month — not a text, but a call, a meeting, or helping them solve something real. Relationship ROI compounds over years.'},
    ],
    mid:[
      {icon:'🎯', title:'Find Your Strongest Dimension and Amplify It',
       desc:'From your highest-scoring areas, identify your single best skill. Set a 90-day externally verifiable milestone — finish a project, publish a professional post, earn a certification. Strength stacked on strength creates true differentiation.'},
      {icon:'💼', title:'Negotiate a Raise or Make a Move',
       desc:'Research salaries for your role on LinkedIn, Glassdoor, or Indeed. If you\'re below the median for your area and experience, build a 3-month plan: update your resume, identify target companies, start interviewing. People who advocate for themselves earn 3× more over a career than those who wait.'},
      {icon:'✍️', title:'Start Publishing Consistently',
       desc:'Choose LinkedIn, a personal blog, or a newsletter. Post one professional insight or industry observation per week. Don\'t aim for perfect — aim for consistent. After 6 months you\'ll have a real visible reputation that attracts opportunities passively.'},
      {icon:'📊', title:'Launch an Investment Plan',
       desc:'If you haven\'t started yet: ① Build a 6-month emergency fund (high-yield savings account). ② Open a brokerage and contribute monthly to a diversified index fund. ③ Max out tax-advantaged accounts first (401k match, Roth IRA). Time in market beats timing the market.'},
      {icon:'🌿', title:'Design a "Deep Work" Block',
       desc:'Block at least 90 minutes each day with all notifications off, dedicated to your single most important task. Research shows deep-focus work produces 5× the quality of fragmented work. Learn to substitute depth for length.'},
    ],
    high:[
      {icon:'🔭', title:'Write Your Personal 10-Year Strategy',
       desc:'Spend a quiet weekend writing a personal long-term document: career (who do you want to become?), finances (net worth target?), relationships (what to build or protect?), health (what state to maintain?). This isn\'t a wish list — it\'s a real strategy with priorities, trade-offs, and resource allocation.'},
      {icon:'👥', title:'Start Systematically Developing Others',
       desc:'Choose 1–2 people who are 5–10 years behind you with real potential. Give them structured mentorship — not occasional Q&A. Teaching others is the fastest way to verify your own knowledge, and the most durable path to genuine influence.'},
      {icon:'🧘', title:'Build an "Inner Investment" Practice',
       desc:'10 minutes of mindfulness daily, one full phone-free outdoor session per week. High achievers most often neglect inner stillness — but it\'s the energy source behind all sustained output. Manage your attention and energy, not just your time.'},
      {icon:'🔗', title:'Strategically Upgrade Your Network',
       desc:'Identify 3 people you deeply respect but haven\'t built a real connection with. Create a genuine value-exchange opportunity — not a dinner, but helping them solve a real problem or co-advancing a project. Top-tier connections aren\'t accumulated, they\'re created.'},
      {icon:'💡', title:'Ruthlessly Eliminate Low-Value Commitments',
       desc:'List every obligation in your life (projects, social events, subscriptions, habitual tasks). Filter with one question: will this matter to me in 3 years? Eliminate what fails the test. Reinvest that time and energy into your highest-leverage activities.'},
    ],
    excellent:[
      {icon:'🌍', title:'Write a Personal Mission Statement',
       desc:'Answer three questions: What unique abilities, resources, or experiences do I have? What problems in the world need them? What price am I willing to pay? Distill the answers into a single sentence under 50 words. This is your north star for every decision at this level.'},
      {icon:'📖', title:'Systematize Your Knowledge',
       desc:'The methodology and judgment you\'ve built has enormous transmission value. Consider: write a book (even self-published), create a structured course, build a small learning community, or let yourself be interviewed in depth. Knowledge that isn\'t shared disappears with you.'},
      {icon:'⚖️', title:'Actively Protect Your Core Relationships',
       desc:'At high-achievement levels, intimate relationships are the most easily neglected asset. Schedule at least one phone-free, work-free dedicated session each week with the people who matter most. This isn\'t a sacrifice — it\'s maintenance on your highest-value asset.'},
      {icon:'🏥', title:'Invest in Premium Health Management',
       desc:'Book a comprehensive health screening (not a standard checkup). Build quarterly health data tracking. Consider a nutrition coach or personal trainer. Your body is the hardware running all your achievements — maintain it proactively, because repair costs far more.'},
      {icon:'🌱', title:'Do One Thing With No Return Calculation',
       desc:'Choose a cause that has nothing to do with your professional interests — purely from inner conviction — and commit time or resources to it systematically (not just a donation). This isn\'t charity. It\'s a genuine answer to the question: "Why am I alive?"'},
    ],
    exceptional:[
      {icon:'🏆', title:'Document Your Frameworks',
       desc:'The decision frameworks and judgment models you\'ve built have extreme value to others. Systematize them — write a book, build a course, start a podcast. Knowledge not transmitted disappears.'},
      {icon:'🌐', title:'Build Cross-Domain Connections',
       desc:'Actively build real connections with top people outside your field. The next breakthrough almost always comes from an unexpected intersection.'},
      {icon:'🎓', title:'Strategically Develop Your Successors',
       desc:'Identify 3–5 people with the potential to surpass you and give them systematic guidance. Your influence compounds geometrically through them.'},
      {icon:'🧘', title:'Protect Your Mental Stillness',
       desc:'Create a protected no-agenda time block — no deliverables, just being. Loneliness and loss of meaning are the most common hidden risks at extreme achievement levels.'},
      {icon:'📜', title:'Define Your Life Legacy',
       desc:'Write: if today were your last working day, what have you already left the world? Make that answer the strategic core of the next 3 years.'},
    ],
  },
  'es-US':{
    low:[
      {icon:'🌅', title:'Primero, repara tu sueño',
       desc:'Esta semana: deja de mirar pantallas a las 10 pm y carga el teléfono fuera del cuarto. La falta de sueño reduce tu función ejecutiva, estado de ánimo y memoria hasta en un 30%. Costo cero, resultados inmediatos.'},
      {icon:'📋', title:'Escribe tu "Escena de 5 años"',
       desc:'Toma una hoja en blanco y completa: "En 5 años, vivo en _____, haciendo _____, con _____." Escribe al menos 200 palabras. Cuanto más específico, más real lo siente tu cerebro — y más se compromete.'},
      {icon:'🤝', title:'Reconecta con una persona clave',
       desc:'Abre tus contactos y encuentra a alguien que respetas de verdad pero con quien no has hablado en 6+ meses. Envía un mensaje genuino, no un reenvío masivo. Las relaciones reales son la inversión de mayor retorno que la mayoría descuida.'},
      {icon:'💰', title:'Automatiza el 10% antes de gastar',
       desc:'Desde este cheque: configura una transferencia automática el día de pago — mueve el 5–10% a una cuenta de ahorros separada antes de verlo. La tasa de ahorro importa más que el monto. Entrena el hábito que construye riqueza.'},
      {icon:'📖', title:'10 minutos de lectura real cada día',
       desc:'Elige un libro relacionado con tus metas. Lee 10 páginas cada noche antes de dormir. Sin tomar notas. En un año son 3,650 páginas — equivalente a 10–15 libros. La curiosidad compuesta es real.'},
    ],
    'mid-low':[
      {icon:'🔍', title:'Diagnostica tu mayor brecha',
       desc:'Mira la sección "Áreas de mejora". Elige el área de menor puntaje que realmente puedes controlar. Escribe: "En 30 días haré ___." No intentes arreglarlo todo — un avance enfocado crea momentum para el resto.'},
      {icon:'💰', title:'Crea una revisión financiera mensual',
       desc:'El último día de cada mes: dedica 20 minutos a revisar cuánto entró, salió, se ahorró e invirtió. Establece una tasa de ahorro objetivo (apunta al 20%+). No necesitas rastrear cada compra — solo conoce las proporciones.'},
      {icon:'🏃', title:'Pon los entrenamientos en tu calendario',
       desc:'Elige 3 horarios fijos por semana y bloquea "entreno 30 min" en tu calendario como una reunión. La investigación muestra que programar el ejercicio triplica el cumplimiento vs. depender de la motivación. La meta no es el peso — son la función cognitiva y el estado de ánimo.'},
      {icon:'🧩', title:'Aprende una habilidad con valor de mercado',
       desc:'Elige una habilidad con demanda estable que te interese genuinamente (análisis de datos, diseño, escritura, programación, un segundo idioma). Dedica los fines de semana durante 3 meses. Las habilidades no son para tu currículum — son para tener una unidad independiente de valor.'},
      {icon:'👥', title:'Invierte profundamente en 3 relaciones',
       desc:'Elige 3 personas en tu red que valen la pena. Conéctate significativamente una vez al mes — no un mensaje, sino una llamada, una reunión o ayudarlos a resolver algo real. El retorno de las relaciones se capitaliza durante años.'},
    ],
    mid:[
      {icon:'🎯', title:'Encuentra tu dimensión más fuerte y amplíala',
       desc:'De tus áreas de mayor puntaje, identifica tu mejor habilidad. Establece un hito verificable externamente en 90 días — termina un proyecto, publica un artículo profesional, obtén una certificación. La fortaleza apilada sobre fortaleza crea diferenciación real.'},
      {icon:'💼', title:'Negocia un aumento o muévete',
       desc:'Investiga salarios para tu rol en LinkedIn, Glassdoor o Indeed. Si estás por debajo de la mediana para tu área y experiencia, construye un plan de 3 meses: actualiza tu perfil, identifica empresas objetivo, comienza a entrevistarte. Quienes abogan por sí mismos ganan 3× más a lo largo de su carrera.'},
      {icon:'✍️', title:'Empieza a publicar consistentemente',
       desc:'Elige LinkedIn, un blog personal o un boletín. Publica una reflexión profesional o perspectiva de tu industria por semana. No apuntes a la perfección — apunta a la consistencia. Después de 6 meses tendrás una reputación visible que atrae oportunidades de forma pasiva.'},
      {icon:'📊', title:'Lanza un plan de inversión',
       desc:'Si aún no has empezado: ① Construye un fondo de emergencia de 6 meses (cuenta de ahorro de alto rendimiento). ② Abre una cuenta de corretaje y contribuye mensualmente a un fondo indexado diversificado. ③ Maximiza primero las cuentas con ventajas fiscales (401k con match del empleador, Roth IRA). El tiempo en el mercado supera intentar predecirlo.'},
      {icon:'🌿', title:'Diseña un bloque de "trabajo profundo"',
       desc:'Bloquea al menos 90 minutos cada día con todas las notificaciones apagadas, dedicado a tu tarea más importante. La investigación muestra que el trabajo de enfoque profundo produce calidad 5× superior al trabajo fragmentado. Aprende a sustituir profundidad por duración.'},
    ],
    high:[
      {icon:'🔭', title:'Escribe tu estrategia personal a 10 años',
       desc:'Dedica un fin de semana tranquilo a escribir un documento personal de largo plazo: carrera (¿quién quieres llegar a ser?), finanzas (¿meta de patrimonio neto?), relaciones (¿qué construir o proteger?), salud (¿qué estado mantener?). Esto no es una lista de deseos — es una estrategia real con prioridades y compromisos.'},
      {icon:'👥', title:'Empieza a desarrollar sistemáticamente a otros',
       desc:'Elige 1–2 personas que están 5–10 años detrás de ti con potencial real. Dales mentoría estructurada — no solo Q&A ocasional. Enseñar a otros es la forma más rápida de verificar tu propio conocimiento y el camino más duradero hacia influencia genuina.'},
      {icon:'🧘', title:'Construye una práctica de inversión interior',
       desc:'10 minutos de mindfulness diario, una sesión semanal al aire libre sin teléfono. Los altos rendidores más frecuentemente descuidan la quietud interior — pero es la fuente de energía detrás de todo output sostenido. Gestiona tu atención y energía, no solo tu tiempo.'},
      {icon:'🔗', title:'Actualiza estratégicamente tu red',
       desc:'Identifica 3 personas que respetas profundamente pero con quienes no has construido una conexión real. Crea una oportunidad genuina de intercambio de valor — no una cena, sino ayudarlos a resolver un problema real o avanzar juntos en un proyecto.'},
      {icon:'💡', title:'Elimina sin piedad los compromisos de bajo valor',
       desc:'Lista cada obligación en tu vida. Filtra con una pregunta: ¿esto me importará en 3 años? Elimina lo que no pasa el filtro. Reinvierte ese tiempo y energía en tus actividades de mayor apalancamiento.'},
    ],
    excellent:[
      {icon:'🌍', title:'Escribe una declaración de misión personal',
       desc:'Responde tres preguntas: ¿Qué habilidades, recursos o experiencias únicas tengo? ¿Qué problemas del mundo las necesitan? ¿Qué precio estoy dispuesto a pagar? Destila las respuestas en una sola frase de menos de 50 palabras. Este es tu norte para cada decisión en este nivel.'},
      {icon:'📖', title:'Sistematiza tu conocimiento',
       desc:'La metodología y el juicio que has desarrollado tienen enorme valor de transmisión. Considera: escribir un libro, crear un curso estructurado, construir una comunidad de aprendizaje, o dejarte entrevistar en profundidad. El conocimiento que no se comparte desaparece contigo.'},
      {icon:'⚖️', title:'Protege activamente tus relaciones clave',
       desc:'En niveles de alto rendimiento, las relaciones íntimas son el activo más fácilmente descuidado. Agenda al menos una sesión semanal sin teléfono ni trabajo con las personas que más importan. Esto no es sacrificio — es mantenimiento de tu activo de mayor valor.'},
      {icon:'🏥', title:'Invierte en gestión de salud premium',
       desc:'Agenda un chequeo médico completo (no el estándar). Construye un seguimiento trimestral de datos de salud. Considera un entrenador de nutrición o entrenador personal. Tu cuerpo es el hardware que ejecuta todos tus logros — mantenlo proactivamente.'},
      {icon:'🌱', title:'Haz una cosa sin calcular el retorno',
       desc:'Elige una causa que no tenga nada que ver con tus intereses profesionales — puramente por convicción interna — y comprométete sistemáticamente. Esto no es caridad. Es una respuesta genuina a la pregunta: "¿Por qué estoy vivo?"'},
    ],
    exceptional:[
      {icon:'🏆', title:'Documenta tus marcos de pensamiento',
       desc:'Los marcos de decisión que has desarrollado tienen valor extremo para otros. Sistematizalos — escribe un libro, crea un curso, inicia un podcast. El conocimiento no transmitido desaparece.'},
      {icon:'🌐', title:'Construye conexiones entre dominios',
       desc:'Construye activamente conexiones reales con personas destacadas fuera de tu campo. El próximo avance importante casi siempre viene de una intersección inesperada.'},
      {icon:'🎓', title:'Desarrolla estratégicamente a tus sucesores',
       desc:'Identifica 3–5 personas con potencial de superarte y dales guía sistemática. Tu influencia se multiplica geométricamente a través de ellos.'},
      {icon:'🧘', title:'Protege tu quietud mental',
       desc:'Crea un bloque de tiempo protegido sin agenda — sin deliverables, solo existir. La soledad y la pérdida de sentido son los riesgos ocultos más comunes en niveles de logro extremo.'},
      {icon:'📜', title:'Define tu legado de vida',
       desc:'Escribe: si hoy fuera tu último día de trabajo, ¿qué has dejado ya al mundo? Haz que esa respuesta sea el núcleo estratégico de los próximos 3 años.'},
    ],
  },
};

/* ── English TIPS ── */
TIPS['en-US']={
  low:"Your overall score is in the early stages — and that's your starting line, not your finish line.\n\n① Build the foundation — Start with sleep and physical activity. Consistent sleep and 3 workouts a week are the base for everything else.\n② Get clear on direction — Spend a weekend seriously thinking about the life you want. Write down 3 specific, achievable goals for the next year.\n③ Build real connections — Reach out to one important person and genuinely reconnect. Relationships compound over time.\n\nEvery 1% improvement, sustained for a year, leads to 37× growth.",
  'mid-low':"You have a solid foundation in several areas, but some important dimensions haven't gotten the attention they deserve.\n\n① Find your biggest weak spot — Look at your \"Room to Grow\" section above. That's where your highest-leverage work is.\n② Build systems, not willpower — Put your phone outside the bedroom. Block reading time in your calendar daily.\n③ Invest in relationships — Reach out to 3 people worth investing in, deeply, every month. Depth beats breadth.\n\nThe version of you that's been seriously working for 6 months will be almost unrecognizable.",
  mid:"You're in the upper-middle of the mainstream — steady and balanced. But 'steady' can also mean stagnant.\n\n① From balance to excellence — Pick your single strongest dimension and build it into a genuine competitive edge.\n② Break your comfort zone — Sign up for a challenge that's slightly beyond your comfort level.\n③ Financial jump — If your income has been flat for over a year, seriously explore a career move or side income.\n④ Build your personal brand — Publish consistently in a niche. Let the right people find you.\n\nYou're one serious decision away from 'Outstanding'.",
  high:"Your score is genuinely impressive — you're ahead of most people. The question now isn't 'do more' — it's 'do better.'\n\n① Strategic focus — Cut low-value commitments. Concentrate your energy on the highest-leverage activities.\n② Build influence — You're capable of impacting others. Think about how to systematize and share what you know.\n③ Long-term thinking — Create a 10-year vision, not just annual targets. Your decision horizon should extend further.\n④ Inner depth — Beyond external achievement, explore your values and what a meaningful life looks like to you.\n\nYou're already doing well. The real question now: who do you want to become?",
  excellent:"You're at the top tier — a place very few people reach.\n\nStandard advice doesn't apply here. What you need:\n\n① Mission-level thinking — Is your life's purpose big enough? Are you working on something larger than yourself?\n② Legacy and influence — Systematically transfer your knowledge, experience, and resources to others.\n③ Guard against complacency — High achievers' biggest risk is stopping learning. Stay humble. Keep updating.\n④ Deep rest — Ensure you have real downtime and inner calm. That's the fuel for sustained excellence.\n\nYour very existence is the best motivation for the people around you.",
  exceptional:"Your score has exceeded 100, placing you in the elite bonus tier. This means you haven't just excelled across all standard dimensions — you have externally verifiable credentials in elite education, professional achievement, entrepreneurial impact, or competitive mastery.\n\nYour challenge is no longer 'how do I improve?' — it's 'how do I choose?'. Your time and energy are your scarcest resource. How do you deploy your unique advantages for maximum positive impact?\n\nWrite your 'Life Legacy List' — if today were your last working day, what have you left behind for the world? Make that answer the strategic core of your next 3 years.",
};
TIPS['es-US']={
  low:"Tu puntaje está en la etapa inicial — y eso es tu línea de partida, no de llegada.\n\n① Construye la base — Empieza con el sueño y la actividad física. Dormir bien y hacer ejercicio 3 veces por semana son el cimiento de todo.\n② Define tu dirección — Dedica un fin de semana a pensar en la vida que quieres. Escribe 3 metas concretas alcanzables en el próximo año.\n③ Construye conexiones reales — Contacta a una persona importante y reconecta genuinamente. Las relaciones se acumulan con el tiempo.\n\nCada mejora del 1%, sostenida por un año, produce un crecimiento de 37×.",
  'mid-low':"Tienes una base sólida en varias áreas, pero algunas dimensiones importantes no han recibido la atención que merecen.\n\n① Encuentra tu mayor punto débil — Revisa tu sección 'Áreas de mejora'. Ahí está tu trabajo de mayor impacto.\n② Construye sistemas, no fuerza de voluntad — Pon el teléfono fuera del dormitorio. Bloquea tiempo de lectura en tu calendario.\n③ Invierte en relaciones — Contacta en profundidad a 3 personas valiosas cada mes. La profundidad supera a la amplitud.\n\nLa versión de ti que lleva 6 meses trabajando en serio será casi irreconocible.",
  mid:"Estás en la parte alta del promedio — estable y equilibrado. Pero 'estable' también puede significar estancado.\n\n① Del equilibrio a la excelencia — Elige tu dimensión más fuerte y conviértela en una ventaja competitiva real.\n② Sal de tu zona de confort — Inscríbete en un desafío que esté levemente fuera de tu comodidad.\n③ Salto financiero — Si tu ingreso ha sido plano por más de un año, explora seriamente un cambio de carrera o ingreso secundario.\n④ Construye tu marca personal — Publica consistentemente en un nicho. Deja que las personas correctas te encuentren.\n\nEstás a una decisión seria de 'Sobresaliente'.",
  high:"Tu puntaje es genuinamente impresionante — estás por delante de la mayoría. Ahora la pregunta no es 'hacer más' — es 'hacerlo mejor.'\n\n① Enfoque estratégico — Elimina compromisos de bajo valor. Concentra tu energía en las actividades de mayor impacto.\n② Construye influencia — Eres capaz de impactar a otros. Piensa en cómo sistematizar y compartir lo que sabes.\n③ Pensamiento a largo plazo — Crea una visión a 10 años, no solo metas anuales.\n④ Profundidad interior — Más allá del logro externo, explora tus valores y qué significa una vida significativa para ti.\n\nYa lo estás haciendo bien. La pregunta real ahora: ¿en quién quieres convertirte?",
  excellent:"Estás en el nivel más alto — un lugar al que muy pocas personas llegan.\n\nLos consejos estándar no aplican aquí. Lo que necesitas:\n\n① Pensamiento de misión — ¿Es tu propósito de vida lo suficientemente grande? ¿Estás trabajando en algo más grande que tú mismo?\n② Legado e influencia — Transfiere sistemáticamente tu conocimiento, experiencia y recursos a otros.\n③ Prevén la complacencia — El mayor riesgo de los de alto rendimiento es dejar de aprender. Mantente humilde.\n④ Descanso profundo — Asegúrate de tener tiempo real de descanso. Eso es el combustible para la excelencia sostenida.\n\nTu propia existencia es la mejor motivación para las personas a tu alrededor.",
  exceptional:"Tu puntaje ha superado los 100 puntos, ubicándote en el nivel élite. Esto significa que no solo has sobresalido en todas las dimensiones estándar — tienes credenciales verificables externamente en educación de élite, logros profesionales, impacto emprendedor o dominio competitivo.\n\nTu desafío ya no es '¿cómo mejorar?' — es '¿cómo elegir?'. Tu tiempo y energía son tu recurso más escaso. ¿Cómo despliegas tus ventajas únicas para el máximo impacto positivo?\n\nEscribe tu 'Lista de Legado de Vida' — si hoy fuera tu último día de trabajo, ¿qué has dejado al mundo? Convierte esa respuesta en el núcleo estratégico de tus próximos 3 años.",
};

/* ── English ACTION_PLANS ── */
ACTION_PLANS['en-US']={
  low:[
    {icon:'🌅', title:'Step 1: Fix Your Sleep',
     desc:"Execute this week: turn your phone off by 10:30 PM and charge it outside the bedroom. Sleep deprivation simultaneously reduces your executive function, emotional stability, and memory by 30%. This is zero-cost and produces immediate results."},
    {icon:'📋', title:'Write Your "5-Year Self-Portrait"',
     desc:"Grab a piece of paper and start with: 'In 5 years, where am I, what am I doing, and who's around me?' Fill the whole page. Don't write a wish list — paint a complete scene. The more specific the picture, the more your brain believes it's achievable."},
    {icon:'🤝', title:'Reach Out to One Important Person',
     desc:"Open your contacts and find someone you genuinely respect but haven't spoken to in over 6 months. Send them a real, personal message — not a group greeting. Your network isn't a pile of business cards; it's accumulated genuine connection."},
    {icon:'💰', title:"Build a 'Save First' Savings Reflex",
     desc:"Starting this month: the day after payday, set up an automatic transfer of 5–10% of your income to a separate, untouchable account. The amount doesn't matter as much as the habit. Your savings rate — not the dollar amount — determines how fast you reach financial freedom."},
    {icon:'📖', title:'10 Minutes a Day of High-Quality Reading',
     desc:"Pick a book related to your career or goals. Read 10 pages before bed every night. You don't need to finish it — you just need to feed your brain quality information before sleep. That's 3,650 pages a year, roughly 10–15 books."},
  ],
  'mid-low':[
    {icon:'🔍', title:'Diagnose Your Biggest Weak Spot',
     desc:"Review the 3 lowest-scoring questions in your 'Room to Grow' section. Pick the one you're most confident you can change, and write: 'I will accomplish ___ within 30 days.' Don't try to change everything at once — a single breakthrough creates momentum for everything else."},
    {icon:'💰', title:'Build a Monthly Financial Snapshot',
     desc:"On the last day of every month, take 20 minutes: How much did I earn? Spend? Save? Invest? Set a savings rate target (20% is a solid starting point). You don't need to track every transaction — just know the rough breakdown by category. Financial clarity is the prerequisite for building wealth."},
    {icon:'🏃', title:'Put Exercise on Your Calendar',
     desc:"Pick 3 fixed times each week and block 30 minutes of movement — even just a brisk walk. Research shows scheduled exercise is 3× more consistent than relying on willpower. The real value of exercise isn't weight loss — it's boosting dopamine and cognitive sharpness."},
    {icon:'🧩', title:'Learn One Marketable Skill',
     desc:"Choose a skill with stable market demand that genuinely interests you (data analysis, design, writing, coding, a language). Use your weekends to study systematically for 3 months. Skills aren't for your résumé — they're a unit of value you can deliver independently."},
    {icon:'👥', title:'Go Deep with 3 Key Relationships',
     desc:"From your network, choose 3 people most worth investing in. Reach out at least once a month in a real way — a phone call, a meetup, or solving an actual problem for them. Not a text. Relationship ROI is long-term, but it compounds higher than almost anything else."},
  ],
  mid:[
    {icon:'🎯', title:'Identify Your Core Strength and Amplify It',
     desc:"From your highest-scoring dimension, find your single strongest capability and set a 90-day externally-verifiable milestone (complete a project, publish a piece of work, earn a certification). Stacking strength on strength is the only path to genuine differentiation."},
    {icon:'💼', title:'Negotiate a Raise — or Start Interviewing',
     desc:"Research salary percentiles for your role and city (LinkedIn Salary, Glassdoor). If you're below the median, build a 3-month plan: update your résumé, create a target company list, start interviewing. Don't wait for a raise — people who actively pursue pay increases earn 3× more than those who wait."},
    {icon:'✍️', title:'Start Publishing Your Thinking',
     desc:"Pick one platform (LinkedIn, Substack, X) and publish one substantive post per week — your professional insights, lessons learned, analysis. It doesn't need to be perfect, just consistent. In 6 months you'll have a visible 'professional identity' that passively attracts the right opportunities."},
    {icon:'📊', title:'Launch an Investment Plan',
     desc:"If you haven't started investing systematically: ① Ensure you have a 6-month emergency fund; ② Open a brokerage account and set up automatic monthly contributions to a low-cost index fund (even $50/month to start); ③ Max your 401(k) match if you have one — that's an instant 50–100% return. Time in the market beats everything."},
    {icon:'🌿', title:"Design a 'Deep Work' Block",
     desc:"Carve out at least 90 minutes of uninterruptible time every day — notifications off, doing only your most important task. Research shows flow-state work quality is 5× higher than scattered work. Learn to replace long low-efficiency hours with short deep-work sessions."},
  ],
  high:[
    {icon:'🔭', title:"Write Your '10-Year Personal Strategy Document'",
     desc:"Spend a quiet weekend writing a 1,000-word personal long-range plan covering: Career (who do you want to become?), Finances (asset target?), Relationships (what needs building or protecting?), Health (what state do you want to maintain?). This isn't a wish list — it's a real strategy with priorities, tradeoffs, and resource allocation."},
    {icon:'👥', title:'Start Systematically Developing Others',
     desc:"Choose 1–2 people 5–10 years younger with genuine potential. Give them structured mentorship — not occasional Q&A. Developing others is the best way to pressure-test your own knowledge system, and it's the longest-lasting path to real influence."},
    {icon:'🧘', title:"Build an 'Inner Investment' Practice",
     desc:"10 minutes of mindfulness meditation daily, plus one fully offline outdoor activity per week. High achievers consistently overlook inner calm — but it's the energy source for all sustained output. Don't just manage time. Manage your attention and energy."},
    {icon:'🔗', title:'Strategically Upgrade Your Network',
     desc:"Audit your existing connections. Identify 3 people you respect deeply but haven't truly connected with. Create a real value-exchange opportunity — not a dinner, but helping them solve an actual problem or collaborating on something meaningful. Elite networks aren't accumulated — they're built."},
    {icon:'💡', title:"Do a 'Low-Value Commitments' Purge",
     desc:"List every regular commitment you have (work projects, social obligations, subscriptions, habitual tasks). Filter with one criterion: Will this still matter to me in 3 years? Cut everything that doesn't pass. The time and energy you free up should be reinvested in your highest-leverage activities."},
  ],
  excellent:[
    {icon:'🌍', title:"Write a Personal Mission Statement",
     desc:"Answer three questions: What unique abilities, resources, or experiences do I have? What problems in the world need them? What price am I willing to pay? Condense your answers into a 50-word personal mission. At this level, this is the north star for every major decision you make."},
    {icon:'📖', title:'Systematize and Share Your Knowledge',
     desc:"The frameworks and decision-making methods you've accumulated have enormous value to others. Consider: write a book (even self-published), build a structured course, create a learning community, or record a deep-form interview. Knowledge that isn't shared disappears with you."},
    {icon:'⚖️', title:'Actively Protect Your Core Relationships',
     desc:"At high-achievement levels, intimate relationships are the most easily neglected. Schedule at least one phone-free, work-free session per week for the most important people in your life — partner, children, parents. This isn't sacrifice; it's maintaining your highest-value asset."},
    {icon:'🏥', title:'Invest in Top-Tier Health Management',
     desc:"Schedule a comprehensive executive physical (not just a standard checkup) and build quarterly health data tracking. Consider working with a registered dietitian and a personal trainer. Your body is the hardware for all your achievements — maintain it while it's healthy."},
    {icon:'🌱', title:"Do Something That Doesn't Pay",
     desc:"Choose one philanthropic or mission-driven direction completely unrelated to your business interests and invest your time systematically (not just money). This isn't charity — it's an honest answer to the question you'll eventually face: 'Why did I live?'"},
  ],
  exceptional:[
    {icon:'🏆', title:'Document Your Methodology',
     desc:"The judgment frameworks and decision-making patterns you've built have exceptional value to others. Systematize them — write a book, build a course, or start a podcast. Knowledge that isn't passed on disappears with its owner."},
    {icon:'🌐', title:'Global Perspective and Cross-Domain Connections',
     desc:"Actively build real relationships with top practitioners outside your field. The next major breakthrough almost always comes from an unexpected intersection of domains."},
    {icon:'🎓', title:'Strategically Develop Successors',
     desc:"Identify 3–5 high-potential people capable of surpassing you. Give them structured guidance and real resources. Your influence compounds geometrically through them."},
    {icon:'🧘', title:'Deliberately Maintain Inner Calm',
     desc:"Protect a zone of purposeless time — not for any output, just for being. At extreme achievement levels, loneliness and loss of meaning are the most common hidden risks."},
    {icon:'📜', title:'Define Your Life Legacy',
     desc:"Write: if today were your last working day, what have you already left behind for the world? Make that answer the strategic core of your next 3 years."},
  ],
};

/* ── Spanish ACTION_PLANS ── */
ACTION_PLANS['es-US']={
  low:[
    {icon:'🌅', title:'Paso 1: Arregla tu sueño',
     desc:"Ejecuta esta semana: apaga tu teléfono a las 10:30 PM y cárgalo fuera del dormitorio. La falta de sueño reduce simultáneamente tu función ejecutiva, estabilidad emocional y memoria en un 30%. Costo cero, resultados inmediatos."},
    {icon:'📋', title:'Escribe tu "Retrato Personal a 5 Años"',
     desc:"Toma una hoja y empieza con: 'En 5 años, ¿dónde estoy, qué estoy haciendo y quién está a mi lado?' Llena toda la página. No hagas una lista de deseos — pinta una escena completa. Cuanto más específica, más cree tu cerebro que es alcanzable."},
    {icon:'🤝', title:'Contacta a una persona importante',
     desc:"Abre tus contactos y encuentra a alguien que genuinamente respetes pero con quien no hayas hablado en más de 6 meses. Envíale un mensaje real y personal — no un saludo masivo. Tu red no es una pila de tarjetas de visita; es conexión genuina acumulada."},
    {icon:'💰', title:"Construye el reflejo de 'Ahorrar primero'",
     desc:"A partir de este mes: el día después de recibir tu pago, configura una transferencia automática del 5–10% de tus ingresos a una cuenta separada e intocable. La cantidad importa menos que el hábito. Tu tasa de ahorro — no la cifra — determina qué tan rápido alcanzas la libertad financiera."},
    {icon:'📖', title:'10 minutos al día de lectura de calidad',
     desc:"Elige un libro relacionado con tu carrera o metas. Lee 10 páginas antes de dormir cada noche. No necesitas terminarlo — solo necesitas nutrir tu cerebro con información de calidad antes de dormir. Eso son 3.650 páginas al año, aproximadamente 10–15 libros."},
  ],
  'mid-low':[
    {icon:'🔍', title:'Diagnostica tu mayor punto débil',
     desc:"Revisa las 3 preguntas con menor puntaje en tu sección 'Áreas de mejora'. Elige la que más confianza tengas en cambiar y escribe: 'Lograré ___ en 30 días.' No intentes cambiar todo a la vez — un solo avance crea impulso para todo lo demás."},
    {icon:'💰', title:'Construye un resumen financiero mensual',
     desc:"El último día de cada mes, dedica 20 minutos: ¿Cuánto gané? ¿Gasté? ¿Ahorré? ¿Invertí? Establece una meta de tasa de ahorro (20% es un buen punto de partida). No necesitas rastrear cada transacción — solo conocer el desglose aproximado por categoría."},
    {icon:'🏃', title:'Pon el ejercicio en tu calendario',
     desc:"Elige 3 horarios fijos cada semana y bloquea 30 minutos de movimiento — incluso una caminata rápida. Las investigaciones muestran que el ejercicio programado es 3× más constante que depender de la fuerza de voluntad."},
    {icon:'🧩', title:'Aprende una habilidad comercializable',
     desc:"Elige una habilidad con demanda estable en el mercado que te interese genuinamente (análisis de datos, diseño, escritura, programación, idiomas). Usa tus fines de semana para estudiarla sistemáticamente durante 3 meses."},
    {icon:'👥', title:'Profundiza en 3 relaciones clave',
     desc:"De tu red, elige a 3 personas que más valga la pena invertir. Contáctalas al menos una vez al mes de forma real — una llamada, un encuentro, o resolver un problema concreto para ellos. No un mensaje de texto."},
  ],
  mid:[
    {icon:'🎯', title:'Identifica tu fortaleza principal y amplificala',
     desc:"De tu dimensión con mayor puntaje, encuentra tu capacidad más fuerte y establece un hito verificable externamente en 90 días (completar un proyecto, publicar un trabajo, obtener una certificación)."},
    {icon:'💼', title:'Negocia un aumento — o empieza a entrevistar',
     desc:"Investiga los percentiles salariales para tu rol y ciudad (LinkedIn, Glassdoor). Si estás por debajo de la mediana, construye un plan de 3 meses: actualiza tu currículum, crea una lista de empresas objetivo, empieza a entrevistar."},
    {icon:'✍️', title:'Empieza a publicar tu pensamiento',
     desc:"Elige una plataforma (LinkedIn, Substack) y publica una entrada sustancial por semana — tus perspectivas profesionales, lecciones aprendidas. En 6 meses tendrás una 'identidad profesional' visible que atrae pasivamente las oportunidades correctas."},
    {icon:'📊', title:'Lanza un plan de inversión',
     desc:"Si no has empezado a invertir sistemáticamente: ① Asegúrate de tener un fondo de emergencia de 6 meses; ② Abre una cuenta de corretaje y configura contribuciones automáticas mensuales a un fondo indexado de bajo costo; ③ Maximiza tu 401(k) si tienes uno — eso es un retorno inmediato del 50–100%."},
    {icon:'🌿', title:"Diseña un bloque de 'Trabajo profundo'",
     desc:"Reserva al menos 90 minutos de tiempo ininterrumpible cada día — notificaciones apagadas, haciendo solo tu tarea más importante. La calidad del trabajo en estado de flujo es 5× mayor que el trabajo disperso."},
  ],
  high:[
    {icon:'🔭', title:"Escribe tu 'Documento de Estrategia Personal a 10 Años'",
     desc:"Dedica un fin de semana tranquilo a escribir un plan personal a largo plazo que cubra: Carrera, Finanzas, Relaciones y Salud. No es una lista de deseos — es una estrategia real con prioridades y asignación de recursos."},
    {icon:'👥', title:'Desarrolla sistemáticamente a otros',
     desc:"Elige 1–2 personas 5–10 años más jóvenes con potencial genuino. Dales mentoría estructurada — no solo responder preguntas ocasionales. Desarrollar a otros es la mejor forma de poner a prueba tu propio sistema de conocimiento."},
    {icon:'🧘', title:"Construye una práctica de 'inversión interior'",
     desc:"10 minutos de meditación de mindfulness diariamente, más una actividad al aire libre completamente desconectada por semana. Los de alto rendimiento invariablemente descuidan la calma interior — pero es la fuente de energía para todo output sostenido."},
    {icon:'🔗', title:'Actualiza estratégicamente tu red',
     desc:"Identifica 3 personas que respetas profundamente pero con quienes no te has conectado verdaderamente. Crea una oportunidad real de intercambio de valor — no una cena, sino ayudarles a resolver un problema real."},
    {icon:'💡', title:"Haz una purga de 'compromisos de bajo valor'",
     desc:"Lista todos tus compromisos regulares y filtra con un criterio: ¿Esto seguirá importándome en 3 años? Elimina todo lo que no pase la prueba. El tiempo y energía liberados deberían reinvertirse en tus actividades de mayor impacto."},
  ],
  excellent:[
    {icon:'🌍', title:"Escribe una declaración de misión personal",
     desc:"Responde tres preguntas: ¿Qué habilidades, recursos o experiencias únicas tengo? ¿Qué problemas del mundo las necesitan? ¿Qué precio estoy dispuesto a pagar? Condensa tus respuestas en una misión personal de 50 palabras."},
    {icon:'📖', title:'Sistematiza y comparte tu conocimiento',
     desc:"Los marcos y métodos de toma de decisiones que has acumulado tienen un valor enorme para otros. Considera: escribir un libro, construir un curso estructurado, crear una comunidad de aprendizaje. El conocimiento que no se comparte desaparece contigo."},
    {icon:'⚖️', title:'Protege activamente tus relaciones clave',
     desc:"En niveles de alto rendimiento, las relaciones íntimas son las más fácilmente descuidadas. Programa al menos una sesión semanal sin teléfono ni trabajo para las personas más importantes de tu vida."},
    {icon:'🏥', title:'Invierte en gestión de salud de primer nivel',
     desc:"Programa un chequeo ejecutivo completo y construye seguimiento trimestral de datos de salud. Considera trabajar con un dietista registrado y un entrenador personal. Tu cuerpo es el hardware de todos tus logros."},
    {icon:'🌱', title:"Haz algo que no te pague",
     desc:"Elige una dirección filantrópica completamente desvinculada de tus intereses comerciales e invierte tu tiempo sistemáticamente. Esta es una respuesta honesta a la pregunta que eventualmente enfrentarás: '¿Por qué viví?'"},
  ],
  exceptional:[
    {icon:'🏆', title:'Documenta tu metodología',
     desc:"Los marcos de juicio y patrones de toma de decisiones que has construido tienen un valor excepcional para otros. Sistematízalos — escribe un libro, construye un curso o comienza un podcast."},
    {icon:'🌐', title:'Perspectiva global y conexiones entre dominios',
     desc:"Construye activamente relaciones reales con los mejores profesionales fuera de tu campo. El próximo gran avance casi siempre viene de una intersección inesperada de dominios."},
    {icon:'🎓', title:'Desarrolla sucesores estratégicamente',
     desc:"Identifica 3–5 personas de alto potencial capaces de superarte. Dales orientación estructurada y recursos reales. Tu influencia se multiplica geométricamente a través de ellos."},
    {icon:'🧘', title:'Mantén deliberadamente la calma interior',
     desc:"Protege una zona de tiempo sin propósito — no para ningún output, sino solo para existir. En niveles de logro extremo, la soledad y la pérdida de sentido son los riesgos ocultos más comunes."},
    {icon:'📜', title:'Define tu legado de vida',
     desc:"Escribe: si hoy fuera tu último día de trabajo, ¿qué has dejado ya al mundo? Convierte esa respuesta en el núcleo estratégico de tus próximos 3 años."},
  ],
};

/* ── Payment modal config ── */
var PAYMENT_CONFIG = {
  wechat:  { name_cn:'微信支付', name_tw:'微信支付', name_en:'WeChat Pay', name_es:'WeChat Pay', color:'#07c160', fallback:'💚', logoSrc:'assets/logo-wechat.png', qrSrc:'assets/qr-wechat.png' },
  alipay:  { name_cn:'支付宝',   name_tw:'支付寶',   name_en:'Alipay', name_es:'Alipay', color:'#1677ff', fallback:'💙', logoSrc:'assets/logo-alipay.png', qrSrc:'assets/qr-alipay.png' },
  crypto:  { name_cn:'加密支付', name_tw:'加密支付', name_en:'Crypto', name_es:'Criptomonedas', color:'#f0b90b', fallback:'🟡', logoSrc:'assets/logo-crypto.png', qrSrc:'assets/qr-crypto.png' },
  qq:      { name_cn:'QQ 钱包',  name_tw:'QQ 錢包',  name_en:'QQ Wallet', name_es:'QQ Wallet', color:'#12b7f5', fallback:'💜', logoSrc:'assets/logo-qq.png',    qrSrc:'assets/qr-qq.png' },
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
    var name = lang==='en-US' ? (cfg.name_en||cfg.name_cn) : lang==='es-US' ? (cfg.name_es||cfg.name_en||cfg.name_cn) : lang==='zh-TW' ? cfg.name_tw : cfg.name_cn;

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

  /* Bind all .sponsor-logo-btn buttons (covers both cards) */
  document.querySelectorAll('.sponsor-logo-btn').forEach(function(btn){
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
  var verdict=getVerdict(finalScore), rank=getRank(finalScore);
  var rankEl=document.getElementById('resultRank'), vEl=document.getElementById('resultVerdict');
  if(rankEl) rankEl.innerHTML=window.t('result.rank')+' <strong>'+rank+'%</strong> '+window.t('result.rankSuffix');
  if(vEl) vEl.textContent=window.t('result.'+verdict);
  var tipEl=document.getElementById('tipText');

  /* ── Under-18 special encouragement ────────────────────────────────────────
     Youth users see a completely different, warm and motivational message
     instead of the standard adult-world tips. The score floor is 80 for them,
     and the tip should reflect that this is a starting line, not a verdict.
  ── */
  var isUnder18 = (answerMap && answerMap.A1 && answerMap.A1.questionIdx === 0) ||
                  (answerMap && answerMap.QK1 && answerMap.QK1.questionIdx === 0);
  if(isUnder18){
    var youthTip = window.t('youth.tip');
    if(tipEl) tipEl.textContent = youthTip;
    /* Show the under-18 banner highlight */
    var u18El = document.getElementById('under18Banner');
    if(u18El){ u18El.style.display='block'; }
    /* Still show bonus badge if earned */
    var bonusScore=0;
    try{ var rd=sessionStorage.getItem('ls_result'); if(rd) bonusScore=JSON.parse(rd).bonusScore||0; }catch(e){}
    var bonusEl=document.getElementById('bonusBadge');
    if(bonusEl){
      if(bonusScore>0){ bonusEl.textContent='+'+bonusScore+' '+window.t('bonus.label'); bonusEl.style.display='inline-flex'; }
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
      bonusEl.textContent='+'+ bonusScore +' '+window.t('bonus.label');
      bonusEl.style.display='inline-flex';
    } else { bonusEl.style.display='none'; }
  }
}

/* ══════════════════════════════════════════════════════
   DATA VISUALIZATION — Radar, Score Bars, Dim Comparison
   ══════════════════════════════════════════════════════ */

function drawResultRadar(canvas){
  if(!canvas||!dimPct) return;
  var ctx=canvas.getContext('2d');
  var W=canvas.width, H=canvas.height, cx=W/2, cy=H/2+10, R=Math.min(W,H)*0.26;
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
  ctx.fillText(finalScore,cx,cy+6);
  ctx.font='400 10px sans-serif'; ctx.fillStyle='#94a3b8'; ctx.fillText('/ 150',cx,cy+22);
}

function drawProfessionalRadar(canvas){
  if(!canvas) return;
  var pd=computeProfessionalDims();
  var ctx=canvas.getContext('2d');
  var W=canvas.width, H=canvas.height, cx=W/2, cy=H/2+4, R=Math.min(W,H)*0.33;
  var lang=window.I18N_CURRENT||'zh-CN';
  var labels=lang==='zh-TW'
    ? ['社交能力','創造力','幸福感']
    : ['Social Ability','Creativity','Well-being'];
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
  ctx.fillText(finalScore, cx, cy-28);
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
    {label:ql('基础维度','基礎維度','Baseline','Base'), value:dimPct.basic||0, color:'#38bdf8'},
    {label:ql('社会生活方向','社會生活方向','Social & Life','Social y Vida'), value:dimPct.social||0, color:'#0ea5e9'},
    {label:ql('个人认同','個人認同','Personal Identity','Identidad Personal'), value:dimPct.identity||0, color:'#f59e0b'},
  ];
  if(bonusScore>0) data.push({label:ql('加分题','加分題','Elite Bonus','Puntos Élite'), value:bonusScore*2, color:'#10b981'});

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
  ctx.fillText(finalScore, cx, cy-4);
  ctx.font='500 11px sans-serif'; ctx.fillStyle='#a1a1aa';
  ctx.fillText(ql('总分','總分','Total','Total'), cx, cy+16);

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
   PERSONALIZED INSIGHTS — Pattern detection on answers
   ══════════════════════════════════════════════════════ */

function buildInsights(lang){
  var c=document.getElementById('insightRows'); if(!c||!answerMap) return; c.innerHTML='';
  var isTW=lang==='zh-TW';
  var rows=[];
  var bank=getBank();

  /* Helper: get answer option index for a QK id, or -1 if not answered */
  function a(id){ return answerMap[id]?answerMap[id].questionIdx:-1; }

  /* ── Dimension imbalance ── */
  if(dimPct){
    var vals=[dimPct.basic||0,dimPct.social||0,dimPct.identity||0];
    var mx=Math.max.apply(null,vals), mn=Math.min.apply(null,vals);
    if(mx-mn>25){
      rows.push({cls:'warn',icon:'⚖️',
        title:ql('维度发展不均衡','維度發展不均衡','Uneven Dimension Development','Desarrollo dimensional desigual'),
        body:ql('你最强和最弱的维度之间差距超过25分。短板效应会限制整体上限——建议优先补强最弱的维度，找出最弱维度中得分最低的2个问题，制定一个30天的集中改善计划。','你最強和最弱的維度之間差距超過25分。建議優先補強最弱的維度，找出得分最低的2個問題，制定30天集中改善計劃。','Your strongest and weakest dimensions are over 25 points apart. The weak-link effect caps your overall ceiling — prioritize strengthening your lowest dimension. Find its 2 lowest-scoring questions and build a 30-day focused improvement plan.',"Tu dimensión más fuerte y la más débil están a más de 25 puntos de distancia. El efecto del eslabón débil limita tu techo general — prioriza fortalecer tu dimensión más débil.")
      });
    }
    if(mn>70){
      rows.push({cls:'good',icon:'🌟',
        title:ql('三维度均衡发展','三維度均衡發展','Three Dimensions in Balance','Tres dimensiones equilibradas'),
        body:ql('你的三个维度均在70分以上，展现出难得的均衡性——没有明显短板拖后腿。下一步建议：选择你最有热情的1个维度，打造成真正的核心优势。','你的三個維度均在70分以上，展現出難得的均衡性。下一步建議：選擇你最有熱情的1個維度，打造成真正的核心優勢。','All three of your dimensions are above 70 — a rare, well-balanced profile. No obvious weak links. Next step: pick the one dimension you\'re most passionate about and invest extra energy to build it into a true competitive edge.','Las tres dimensiones están por encima de 70 — un perfil equilibrado poco común. Próximo paso: elige la dimensión que más te apasiona e invierte energía extra para convertirla en una ventaja competitiva real.')
      });
    }
  }

  /* ── Health + Habits pattern ── */
  var habitsScore=a('QK14'), visionScore=a('QK15a'), healthScore=a('QK15b');
  if(habitsScore>=3 || (visionScore>=3 && healthScore>=2)){
    rows.push({cls:'warn',icon:'🏥',
      title:ql('健康风险预警','健康風險預警','Health Risk Warning','Alerta de riesgo de salud'),
      body:ql('你的健康相关指标多项偏低，包括不良习惯、视力或慢性健康问题。健康是所有其他维度的"地基"——地基动摇，上层建筑再好也会塌。建议本月内完成一次全面体检，同时从最容易改变的1个不良习惯开始，用30天养成替代行为。','你的健康相關指標多項偏低，包括不良習慣、視力或慢性健康問題。健康是所有其他維度的"地基"——地基動搖，上層建築再好也會塌。建議本月內完成一次全面體檢，同時從最容易改變的1個不良習慣開始，用30天養成替代行為。','Several of your health indicators are low — unhealthy habits, vision issues, or chronic conditions. Health is the foundation everything else rests on. Action this month: schedule a comprehensive physical, and pick the single easiest bad habit to change. Replace it with a better behavior for 30 days.','Varios de tus indicadores de salud son bajos — hábitos poco saludables, problemas de visión o condiciones crónicas. La salud es la base sobre la que descansa todo lo demás. Acción este mes: programa un chequeo médico completo y elige el hábito malo más fácil de cambiar. Reemplázalo con un comportamiento mejor durante 30 días.')
    });
  }

  /* ── Financial stress pattern ── */
  var savings=a('QK19'), runway=a('QK20');
  if(savings===0 && runway<=1){
    rows.push({cls:'warn',icon:'💸',
      title:ql('财务安全垫极薄','財務安全墊極薄','Dangerously Thin Financial Cushion','Colchón financiero peligrosamente delgado'),
      body:ql('你的储蓄水平和财务跑道同时处于最低区间，这意味着任何突发事件（失业、疾病、意外）都可能造成严重财务危机。紧急行动：本月起暂停所有非必要消费，启动"50/30/20预算法"强制储蓄。目标：3个月内建立至少1个月的应急储备。','你的儲蓄水平和財務跑道同時處於最低區間，這意味著任何突發事件（失業、疾病、意外）都可能造成嚴重財務危機。緊急行動：本月起暫停所有非必要消費，啟動"50/30/20預算法"強制儲蓄。目標：3個月內建立至少1個月的應急儲備。','Your savings and financial runway are both at the very bottom. Any unexpected event — job loss, illness, accident — could trigger a serious financial crisis. Emergency action: pause all non-essential spending this month, apply the 50/30/20 budget rule, and build at least one month of emergency reserves within 3 months.','Tus ahorros y tu pista financiera están en el nivel más bajo. Cualquier evento inesperado podría desencadenar una crisis financiera grave. Acción de emergencia: pausa todos los gastos no esenciales este mes, aplica la regla presupuestaria 50/30/20 y construye al menos un mes de reservas de emergencia en 3 meses.')
    });
  }

  /* ── Work-life imbalance ── */
  var overtime=a('QK12'), stress=a('QK13');
  if(overtime>=3 && stress>=3){
    rows.push({cls:'warn',icon:'🔥',
      title:ql('严重的工作-生活失衡','嚴重的工作-生活失衡','Severe Work-Life Imbalance','Grave desequilibrio trabajo-vida'),
      body:ql('你同时报告了高加班时长和高工作压力，这是职业倦怠的典型前兆。研究表明，长期超负荷工作不会提升产出，反而会导致决策质量下降、免疫力降低和人际关系恶化。本周就做一件事：设定一个"每日停工时间"（比如晚上8点），超过后完全不看工作消息，坚持7天。','你同時報告了高加班時長和高工作壓力，這是職業倦怠的典型前兆。研究表明，長期超負荷工作不會提升產出，反而會導致決策質量下降、免疫力降低和人際關係惡化。本週就做一件事：設定一個"每日停工時間"（比如晚上8點），超過後完全不看工作消息，堅持7天。','You reported both heavy overtime and high work pressure — the classic precursor to burnout. Research shows chronic overwork reduces output quality, weakens your immune system, and damages relationships. One thing to do this week: set a hard daily \'shutdown time\' (e.g. 8 PM) and enforce a complete work-message blackout after that. Hold it for 7 days.','Reportaste tanto horas extra intensas como alta presión laboral — el precursor clásico del burnout. Una cosa esta semana: establece una \'hora de cierre\' diaria estricta (ej. 8 PM) y aplica un bloqueo total de mensajes de trabajo después de esa hora. Mantenlo 7 días.')
    });
  }

  /* ── Social isolation ── */
  var confide=a('QK33'), parents=a('QK28a'), siblings=a('QK28b');
  if(confide===4 || (confide===-1 && parents>=2 && siblings>=2)){
    rows.push({cls:'purple',icon:'🫂',
      title:ql('社交支持系统薄弱','社交支持系統薄弱','Weak Social Support System','Sistema de apoyo social débil'),
      body:ql('你缺乏可以倾诉的对象，同时家庭关系也不够亲密。社交孤立是心理健康最大的隐形杀手——它对寿命的负面影响相当于每天抽15根烟。建议：本月尝试加入一个兴趣社群（线上或线下），或者约一位老朋友进行一次真正的深度对话。','你缺乏可以傾訴的對象，同時家庭關係也不夠親密。社交孤立是心理健康最大的隱形殺手——它對壽命的負面影響相當於每天抽15根菸。建議：本月嘗試加入一個興趣社群（線上或線下），或者約一位老朋友進行一次真正的深度對話。','You lack people to confide in, and family relationships are strained. Social isolation is the biggest invisible threat to mental health — its effect on longevity is equivalent to smoking 15 cigarettes a day. This month: join one interest community (online or in person), or reach out to an old friend for a genuine, deep conversation.','Te faltan personas en quienes confiar y las relaciones familiares son tensas. El aislamiento social es la mayor amenaza invisible para la salud mental. Este mes: únete a una comunidad de intereses (en línea o en persona), o contacta a un viejo amigo para una conversación genuina y profunda.')
    });
  }

  /* ── Strong internal identity ── */
  var curiosity=a('QK34'), persist=a('QK35'), emotion=a('QK36'), agency=a('QK37');
  if(curiosity<=1 && persist<=1 && emotion<=1){
    rows.push({cls:'good',icon:'💎',
      title:ql('强大的内在驱动力','強大的內在驅動力','Powerful Inner Drive','Fuerte impulso interior'),
      body:ql('你在好奇心、坚持力和情绪管理方面都表现出色。这三项能力的组合被心理学家称为"成长型人格"——拥有它的人在面对挫折时恢复速度更快，长期成就的上限更高。建议：利用这个优势去挑战一个你一直犹豫要不要开始的大项目。','你在好奇心、堅持力和情緒管理方面都表現出色。這三項能力的組合被心理學家稱為"成長型人格"——擁有它的人在面對挫折時恢復速度更快，長期成就的上限更高。建議：利用這個優勢去挑戰一個你一直猶豫要不要開始的大項目。','You score strongly on curiosity, persistence, and emotional regulation. Psychologists call this combination a \'growth personality\' — people who have it bounce back from setbacks faster and achieve more over the long run. Use this edge to tackle the big project you\'ve been hesitating to start.','Obtienes puntuaciones altas en curiosidad, persistencia y regulación emocional. Los psicólogos llaman a esta combinación \'personalidad de crecimiento\'. Usa esta ventaja para enfrentar el gran proyecto que has dudado en comenzar.')
    });
  }

  /* ── High income but low savings ── */
  var income=a('QK7');
  if(income>=3 && savings<=1){
    rows.push({cls:'warn',icon:'🕳️',
      title:ql('高收入低储蓄陷阱','高收入低儲蓄陷阱','High Income, Low Savings Trap','Trampa de altos ingresos y bajos ahorros'),
      body:ql('你的收入水平不低，但储蓄却很少——这是典型的"收入膨胀"陷阱：收入增长被同比例的消费升级完全吞噬。解决方案不是"少花钱"，而是在收入到账的那一刻就自动转走固定比例。建议设置月薪20%的自动转存到一个不易取用的账户。','你的收入水平不低，但儲蓄卻很少——這是典型的"收入膨脹"陷阱：收入增長被同比例的消費升級完全吞噬。解決方案不是"少花錢"，而是在收入到賬的那一刻就自動轉走固定比例。建議設置月薪20%的自動轉存到一個不易取用的帳戶。','Your income is solid, but savings are minimal — classic lifestyle inflation: every raise gets absorbed by upgraded spending. The fix isn\'t \'spend less\'; it\'s auto-transferring a fixed percentage the moment your paycheck hits. Set up a 20% automatic transfer to a hard-to-touch savings account today.','Tus ingresos son sólidos, pero los ahorros son mínimos — inflación de estilo de vida clásica. La solución no es \'gastar menos\'; es transferir automáticamente un porcentaje fijo en el momento en que llega tu cheque. Configura una transferencia automática del 20% a una cuenta de difícil acceso hoy.')
    });
  }

  /* ── Good base, untapped social ── */
  if(dimPct && dimPct.basic>75 && dimPct.social<55){
    rows.push({cls:'purple',icon:'🚀',
      title:ql('基础优秀但潜力未释放','基礎優秀但潛力未釋放','Strong Foundation, Untapped Potential','Base sólida, potencial sin aprovechar'),
      body:ql('你的基础条件（健康、教育、环境）优于大多数人，但社会生活方向维度还未跟上。这说明你的外部资源转化效率有待提升——你拥有比你意识到的更多的起点优势。建议：认真审视你的职业路径，考虑是否需要一次主动的职业跃升（跳槽、谈薪或创业）。','你的基礎條件（健康、教育、環境）優於大多數人，但社會生活方向維度還未跟上。這說明你的外部資源轉化效率有待提升——你擁有比你意識到的更多的起點優勢。建議：認真審視你的職業路徑，考慮是否需要一次主動的職業躍升（跳槽、談薪或創業）。','Your baseline (health, education, environment) is stronger than most people\'s, but your Social & Life dimension hasn\'t caught up. You have more starting-line advantages than you realize — the conversion efficiency just needs work. Seriously review your career path: do you need a proactive leap — a new job, a raise negotiation, or a side business?','Tu base (salud, educación, entorno) es más sólida que la de la mayoría, pero tu dimensión Social y Vida no ha alcanzado ese nivel. Tienes más ventajas de partida de las que reconoces. Revisa seriamente tu trayectoria profesional: ¿necesitas un salto proactivo — un nuevo trabajo, negociar un aumento o un negocio secundario?')
    });
  }

  /* ── Romantic distress pattern ── */
  var romantic=a('QK23');
  if(romantic>=5 && romantic<=8){
    rows.push({cls:'warn',icon:'💔',
      title:ql('亲密关系正在经历严重危机','親密關係正在經歷嚴重危機','Relationship in Serious Crisis','Relación en crisis grave'),
      body:ql('你的感情状态显示关系正处于高压或破裂状态。这会像漏水的水管一样持续消耗你在其他所有维度的精力和判断力。最重要的第一步不是"解决问题"，而是为自己找到一个安全的情绪出口——约一位信任的朋友深聊，或预约一次心理咨询。在做任何重大关系决定之前，先让自己的情绪回到基准线。','你的感情狀態顯示關係正處於高壓或破裂狀態。這會像漏水的水管一樣持續消耗你在其他所有維度的精力和判斷力。最重要的第一步不是"解決問題"，而是為自己找到一個安全的情緒出口——約一位信任的朋友深聊，或預約一次心理諮詢。在做任何重大關係決定之前，先讓自己的情緒回到基準線。','Your relationship status signals high strain or near-breakdown. This drains your energy and judgment in every other dimension — like a constant leak. The most important first step isn\'t \'solving the problem\': it\'s finding a safe emotional outlet. Talk to a trusted friend or book a therapy session. Before any major relationship decision, get your emotional baseline back first.','Tu estado de relación señala alta tensión o cercanía a una ruptura. Esto drena tu energía en cada otra dimensión. El primer paso más importante no es \'resolver el problema\': es encontrar una salida emocional segura. Habla con un amigo de confianza o reserva una sesión de terapia. Antes de cualquier decisión importante de relación, recupera primero tu línea de base emocional.')
    });
  }

  /* ── Youth potential pattern (under-25 with high curiosity/persistence) ── */
  if(a('QK1')<=1 && curiosity<=1 && persist<=1){
    rows.push({cls:'good',icon:'🌅',
      title:ql('年轻且拥有稀缺的成长型特质','年輕且擁有稀缺的成長型特質','Young With Rare Growth Mindset','Joven con mentalidad de crecimiento poco común'),
      body:ql('你在25岁之前就展现出了强烈的好奇心和坚持力——这两项特质的组合在同龄人中极为罕见。研究表明，这种"成长型人格"在30岁后会转化为显著的职业和收入优势。你现在最需要做的不是追求稳定，而是大胆试错：尝试不同的行业、城市和生活方式，因为你的试错成本在人生中处于最低点，而学习回报率处于最高点。','你在25歲之前就展現出了強烈的好奇心和堅持力——這兩項特質的組合在同齡人中極為罕見。研究表明，這種"成長型人格"在30歲後會轉化為顯著的職業和收入優勢。你現在最需要做的不是追求穩定，而是大膽試錯：嘗試不同的行業、城市和生活方式，因為你的試錯成本在人生中處於最低點，而學習回報率處於最高點。','You\'re showing strong curiosity and persistence before 25 — that combination is rare among your peers. Research shows this \'growth personality\' translates into significant career and income advantages after 30. What you need most right now isn\'t stability — it\'s bold experimentation. Try different industries, cities, and lifestyles. Your cost of failure is at its lifetime low; your learning rate is at its peak.','Muestras fuerte curiosidad y persistencia antes de los 25 — esa combinación es poco común entre tus pares. Lo que más necesitas ahora no es estabilidad — es experimentación audaz. Prueba diferentes industrias, ciudades y estilos de vida. Tu costo de error está en el mínimo de tu vida; tu tasa de aprendizaje está en su punto máximo.')
    });
  }

  /* ── Career stagnation: high income but low agency/satisfaction ── */
  if(income>=3 && (agency>=3 || a('QK39')>=3)){
    rows.push({cls:'purple',icon:'🔒',
      title:ql('高收入陷阱：金色牢笼效应','高收入陷阱：金色牢籠效應','High Income Trap: The Golden Cage','Trampa de altos ingresos: La jaula dorada'),
      body:ql('你的收入不低，但你对人生的掌控感或成就感却很弱。这是经典的"金色牢笼"——高薪让你不敢离开，但工作本身正在消磨你的生命力。建议做一个"最坏情况演练"：如果你明天辞职，最坏的结果是什么？你能承受吗？通常你会发现，真实的风险远小于你想象的。然后制定一个6个月的"逃离计划"——不是明天就辞职，而是系统性地为自己创造选择权。','你的收入不低，但你對人生的掌控感或成就感卻很弱。這是經典的"金色牢籠"——高薪讓你不敢離開，但工作本身正在消磨你的生命力。建議做一個"最壞情況演練"：如果你明天辭職，最壞的結果是什麼？你能承受嗎？通常你會發現，真實的風險遠小於你想像的。然後制定一個6個月的"逃離計劃"——不是明天就辭職，而是系統性地為自己創造選擇權。','You earn well, but your sense of control or fulfillment is low — the classic golden cage. High pay makes you afraid to leave, but the work itself is slowly draining your vitality. Run a \'worst-case drill\': if you quit tomorrow, what\'s the worst outcome? Can you survive it? Usually the real risk is far smaller than imagined. Then build a 6-month \'options plan\' — not quitting tomorrow, but systematically creating freedom of choice.','Ganas bien, pero tu sentido de control o realización es bajo — la jaula dorada clásica. Realiza un \'simulacro del peor caso\': si renunciaras mañana, ¿cuál sería el peor resultado? Luego construye un \'plan de opciones\' de 6 meses — no renunciar mañana, sino crear sistemáticamente libertad de elección.')
    });
  }

  /* ── Retirement risk: retired with low quality ── */
  var retireQuality=a('QK8b');
  if(a('QK3')===4 && retireQuality>=3){
    rows.push({cls:'warn',icon:'🏚️',
      title:ql('退休生活质量预警','退休生活質量預警','Retirement Quality Warning','Alerta de calidad de jubilación'),
      body:ql('你的退休生活质量评分偏低。退休后最常见的三大问题是：社交圈急剧缩小、日常结构感消失、以及"被需要感"的丧失。建议本月做3件事：①加入一个每周固定聚会的社区团体（太极/书法/棋牌）②设定每天的"小目标"时间表（哪怕只是散步+读报）③每周至少和子女或老朋友进行一次15分钟以上的通话。这些看似简单的行动，能显著提升退休生活的幸福感。','你的退休生活質量評分偏低。退休後最常見的三大問題是：社交圈急劇縮小、日常結構感消失、以及"被需要感"的喪失。建議本月做3件事：①加入一個每週固定聚會的社區團體（太極/書法/棋牌）②設定每天的"小目標"時間表（哪怕只是散步+讀報）③每週至少和子女或老朋友進行一次15分鐘以上的通話。這些看似簡單的行動，能顯著提升退休生活的幸福感。','Your retirement quality score is low. The three most common post-retirement problems are: social circle shrinking rapidly, loss of daily structure, and loss of feeling needed. This month, do 3 things: ① Join a weekly community group (walking club, book club, pickleball) ② Set a daily \'small goals\' schedule ③ Call a family member or old friend for at least 15 minutes each week. These simple actions significantly improve retirement well-being.','Tu puntaje de calidad de jubilación es bajo. Los tres problemas más comunes post-jubilación son: círculo social que se reduce rápidamente, pérdida de estructura diaria y pérdida de sentirse necesitado. Este mes, haz 3 cosas: ① Únete a un grupo comunitario semanal ② Establece un horario diario de \'pequeñas metas\' ③ Llama a un familiar o viejo amigo al menos 15 minutos cada semana.')
    });
  }

  /* ── Age-specific: 56–75 targeted analysis ── */
  if(a('QK1')>=5 && a('QK1')<=6){
    var s561=a('QKS56_1'), s562=a('QKS56_2'), s563=a('QKS56_3');
    if(s561>=2 || s562>=2 || s563>=2){
      rows.push({cls:'warn',icon:'🧭',
        title:ql('56–75岁阶段：转换期风险提示','56–75歲階段：轉換期風險提示','Ages 56–75: Transition Risk Alert','Edades 56–75: Alerta de riesgo de transición'),
        body:ql('你正处在“工作—退休—家庭角色”快速重构的阶段。若健康管理、现金流安排与社交节律任一失衡，后续风险会明显放大。建议优先把三件事流程化：固定健康追踪、每月现金流盘点、每周社交活动安排。','你正處在「工作—退休—家庭角色」快速重構的階段。若健康管理、現金流安排與社交節律任一失衡，後續風險會明顯放大。建議優先把三件事流程化：固定健康追蹤、每月現金流盤點、每週社交活動安排。','You are in the rapid restructuring phase of work → retirement → family roles. If health management, cash flow, or social rhythm gets off-balance, downstream risks multiply. Systematize 3 things now: regular health monitoring, monthly cash flow review, weekly social activities.','Estás en la fase de reestructuración de trabajo → jubilación → roles familiares. Sistematiza 3 cosas: monitoreo regular de salud, revisión mensual del flujo de caja, actividades sociales semanales.')
      });
    } else {
      rows.push({cls:'good',icon:'✅',
        title:ql('56–75岁阶段：结构稳定','56–75歲階段：結構穩定','Ages 56–75: Structurally Stable','Edades 56–75: Estructuralmente estable'),
        body:ql('你在过渡期的健康、财务与社交三项关键结构相对稳定。下一步可聚焦在“低风险高回报”：维持规律节奏、提升日常幸福感，并把经验转化为家庭与社群价值。','你在過渡期的健康、財務與社交三項關鍵結構相對穩定。下一步可聚焦在「低風險高回報」：維持規律節奏、提升日常幸福感、並把經驗轉化為家庭與社群價值。','Your health, finances, and social structure are relatively stable during this transition. Focus on low-risk, high-return moves: maintain regular routines, improve daily well-being, and convert your experience into value for family and community.','Tu salud, finanzas y estructura social son relativamente estables en esta transición. Enfócate en movimientos de bajo riesgo y alto retorno: mantén rutinas regulares, mejora el bienestar diario y convierte tu experiencia en valor para familia y comunidad.')
      });
    }
  }

  /* ── Age-specific: 76–100 targeted analysis ── */
  if(a('QK1')>=7 && a('QK1')<=8){
    var s761=a('QKS76_1'), s762=a('QKS76_2'), s763=a('QKS76_3');
    if(s761>=2 || s762>=2 || s763>=2){
      rows.push({cls:'warn',icon:'🛡️',
        title:ql('76–100岁阶段：安全与连续性优先','76–100歲階段：安全與連續性優先','Ages 76–100: Safety & Continuity First','Edades 76–100: Seguridad y continuidad primero'),
        body:ql('此年龄段最重要的不是“再提升多少”，而是“稳定地过好每一天”。若行动独立性、就医连续性或情绪安稳感偏弱，建议立刻补齐：居家防跌倒、紧急联络机制、规律陪伴与复诊节奏。','此年齡段最重要的不是「再提升多少」，而是「穩定地過好每一天」。若行動獨立性、就醫連續性或情緒安穩感偏弱，建議立刻補齊：居家防跌倒、緊急聯絡機制、規律陪伴與復診節奏。','At this age the priority isn\'t \'how much more to improve\' — it\'s \'living each day steadily and well.\' If functional independence, healthcare continuity, or emotional stability are weak, address them now: home fall prevention, emergency contact systems, and regular medical check-ins.','En esta edad la prioridad no es \'cuánto más mejorar\' — es \'vivir cada día de forma estable\'. Si la independencia funcional, la continuidad médica o la estabilidad emocional son débiles, abórdalas de inmediato.')
      });
    } else {
      rows.push({cls:'good',icon:'🌿',
        title:ql('76–100岁阶段：高质量稳定状态','76–100歲階段：高品質穩定狀態','Ages 76–100: High-Quality Stable State','Edades 76–100: Estado estable de alta calidad'),
        body:ql('你在这一阶段维持了难得的功能稳定与心理平和。建议继续保持“低波动日常”：固定作息、适度活动、稳定社交触点，让生活质量可持续。','你在這一階段維持了難得的功能穩定與心理平和。建議繼續保持「低波動日常」：固定作息、適度活動、穩定社交觸點，讓生活品質可持續。','You have maintained rare functional stability and mental calm. Keep your low-volatility daily routine: fixed schedule, moderate activity, stable social touchpoints. This is how quality of life stays sustainable.','Has mantenido una estabilidad funcional y calma mental poco comunes. Mantén tu rutina diaria de baja volatilidad: horario fijo, actividad moderada, contactos sociales estables. Así la calidad de vida se mantiene sostenible.')
      });
    }
  }

  /* ── Sedentary + screen addiction combo ── */
  if(answerMap['QK14'] && Array.isArray(answerMap['QK14'].selectedIndices)){
    var habits14=answerMap['QK14'].selectedIndices;
    var hasSedentary=habits14.indexOf(1)>=0, hasScreen=habits14.indexOf(6)>=0, hasLateNight=habits14.indexOf(4)>=0;
    if(hasSedentary && (hasScreen || hasLateNight)){
      rows.push({cls:'warn',icon:'📱',
        title:ql('久坐+屏幕成瘾：慢性健康定时炸弹','久坐+螢幕成癮：慢性健康定時炸彈','Sedentary + Screen Addiction: Slow-Burn Health Bomb','Sedentarismo + pantallas: bomba de tiempo para tu salud'),
        body:ql('你同时存在久坐和屏幕过度使用的问题，这个组合会加速颈椎退化、视力下降和睡眠质量恶化。立即可执行的解法：在手机上设置每小时震动一次的提醒，每次站起来做2分钟的拉伸（特别是颈部和髋部）。同时，把手机的屏幕设为晚上10点后自动变灰阶——这会让你的大脑自然失去刷屏的冲动。','你同時存在久坐和螢幕過度使用的問題，這個組合會加速頸椎退化、視力下降和睡眠質量惡化。立即可執行的解法：在手機上設置每小時震動一次的提醒，每次站起來做2分鐘的拉伸（特別是頸部和髖部）。同時，把手機的螢幕設為晚上10點後自動變灰階——這會讓你的大腦自然失去刷屏的衝動。','You have both a sedentary lifestyle and excessive screen use — a combination that accelerates cervical degeneration, vision decline, and sleep quality erosion. Immediately actionable fix: set an hourly phone vibration reminder to stand and stretch for 2 minutes (focus on neck and hips). Also, enable grayscale mode on your phone after 10 PM — your brain naturally loses the urge to scroll.','Tienes tanto un estilo de vida sedentario como uso excesivo de pantallas. Solución inmediatamente ejecutable: configura una vibración horaria en tu teléfono para pararte y estirarte 2 minutos. Además, activa el modo escala de grises en tu teléfono después de las 10 PM — tu cerebro pierde naturalmente el impulso de hacer scroll.')
      });
    }
  }

  /* ── High identity, low social — Thinker pattern ── */
  if(dimPct && dimPct.identity>75 && dimPct.social<55){
    rows.push({cls:'purple',icon:'💭',
      title:ql('思考者，但行动力不足','思考者，但行動力不足','Thinker Without Enough Action','Pensador sin suficiente acción'),
      body:ql('你的内在认知和价值观非常成熟，但还没有充分转化为外部成就。你可能有完美主义倾向——总觉得"还没准备好"。解药：每周设定一个30分钟的"执行时段"，专门用于推进你脑海中已经有答案但一直没动手的事。完成度比完美度重要得多。','你的內在認知和價值觀非常成熟，但還沒有充分轉化為外部成就。你可能有完美主義傾向——總覺得"還沒準備好"。解藥：每週設定一個30分鐘的"執行時段"，專門用於推進你腦海中已經有答案但一直沒動手的事。完成度比完美度重要得多。','Your inner clarity and values are mature, but they haven\'t fully converted into external results. You may have perfectionist tendencies — always feeling \'not ready yet.\' The antidote: schedule one 30-minute \'execution window\' each week, dedicated entirely to moving forward the one thing you already know the answer to. Done beats perfect, every time.','Tu claridad interior y tus valores son maduros, pero no se han convertido plenamente en resultados externos. Puede que tengas tendencias perfeccionistas. El antídoto: programa una \'ventana de ejecución\' de 30 minutos cada semana, dedicada a avanzar en lo que ya sabes que debes hacer. Lo hecho supera a lo perfecto, siempre.')
    });
  }

  /* ── Overall high scorer ── */
  if(finalScore>=85 && !bonusScore){
    rows.push({cls:'good',icon:'⭐',
      title:ql('你正处于人生高点——但要警惕高原效应','你正處於人生高點——但要警惕高原效應','At Your Peak — Watch Out for the Plateau Effect','En tu punto máximo — cuidado con el efecto meseta'),
      body:ql('85分以上的基础分意味着你在大多数维度都表现出色。但高分者最大的风险不是"退步"，而是"停滞"——当一切都"还不错"的时候，人会失去主动突破的动力。建议：给自己设定一个"舒适区之外"的90天挑战——可以是学一门新语言、尝试一个新运动、或者主动承接一个超出你当前能力的项目。保持成长的引擎运转。','85分以上的基礎分意味著你在大多數維度都表現出色。但高分者最大的風險不是"退步"，而是"停滯"——當一切都"還不錯"的時候，人會失去主動突破的動力。建議：給自己設定一個"舒適區之外"的90天挑戰——可以是學一門新語言、嘗試一個新運動、或者主動承接一個超出你當前能力的項目。保持成長的引擎運轉。','A base score above 85 means you\'re doing well across most dimensions. But the biggest risk for high scorers isn\'t regression — it\'s stagnation. When everything is \'pretty good,\' people lose the impulse to push further. Set yourself a 90-day out-of-comfort-zone challenge: learn a new language, try a new sport, or proactively take on a project beyond your current level. Keep the growth engine running.','Una puntuación base superior a 85 significa que te está yendo bien en la mayoría de dimensiones. Pero el mayor riesgo para los que puntúan alto no es el retroceso — es el estancamiento. Establece un desafío de 90 días fuera de tu zona de confort: aprende un nuevo idioma, prueba un nuevo deporte, o asume proactivamente un proyecto más allá de tu nivel actual.')
    });
  }

  /* ── Low emotional management + high stress combo ── */
  if(emotion>=3 && (stress>=2 || overtime>=2)){
    rows.push({cls:'warn',icon:'🌊',
      title:ql('情绪管理+高压力：燃尽综合症风险','情緒管理+高壓力：燃盡綜合症風險','Poor Emotional Control + High Stress: Burnout Risk','Mal control emocional + alta presión: riesgo de burnout'),
      body:ql('你的情绪管理能力偏弱，同时又处于高压环境中——这是心理健康危机的典型前兆组合。不要等到崩溃才行动。本周做2件事：①下载一个冥想App（如潮汐/小睡眠），每天睡前做5分钟呼吸练习②找一位你信任的人，花15分钟把你最近的压力说出来——不需要解决方案，只是说出来本身就有疗愈效果。','你的情緒管理能力偏弱，同時又處於高壓環境中——這是心理健康危機的典型前兆組合。不要等到崩潰才行動。本週做2件事：①下載一個冥想App（如潮汐/小睡眠），每天睡前做5分鐘呼吸練習②找一位你信任的人，花15分鐘把你最近的壓力說出來——不需要解決方案，只是說出來本身就有療癒效果。','Poor emotional regulation combined with a high-pressure environment is the classic precursor to a mental health crisis. Don\'t wait until you crash to act. This week, do 2 things: ① Download a meditation app (Calm, Headspace, Insight Timer) and do 5 minutes of breathing before bed ② Tell one person you trust about your recent stress for 15 minutes — no solutions needed, just saying it out loud has therapeutic value.','La regulación emocional deficiente combinada con un entorno de alta presión es el precursor clásico de una crisis de salud mental. Esta semana, haz 2 cosas: ① Descarga una app de meditación (Calm, Headspace) y haz 5 minutos de respiración antes de dormir ② Cuéntale a alguien de confianza sobre tu estrés reciente durante 15 minutos — solo decirlo en voz alta tiene valor terapéutico.')
    });
  }

  /* ── Weighted low-score personalized feedback (covers all answered scores) ── */
  var weighted = [];
  bank.forEach(function(q){
    if(!q.scorable||q.bonus||q.multi||!answerMap[q.id]) return;
    var oi=answerMap[q.id].questionIdx;
    var opt=q.options[oi];
    if(!opt) return;
    var maxScore=Math.max.apply(null,q.options.map(function(o){ return o.score||0; }));
    if(maxScore<=0) return;
    var pct=(opt.score||0)/maxScore;
    var weight=q.section==='social'?1.15:q.section==='identity'?1.05:1.0;
    weighted.push({
      q:q,
      opt:opt,
      pct:pct,
      weight:weight,
      impact:(1-pct)*weight
    });
  });
  weighted.sort(function(a,b){ return b.impact-a.impact; });
  weighted.slice(0,3).forEach(function(w){
    var qText=window.qlang?window.qlang(w.q):(isTW?(w.q.tw||w.q.cn):(w.q.cn||w.q.tw));
    var oText=window.qlang?window.qlang(w.opt):(isTW?(w.opt.tw||w.opt.cn):(w.opt.cn||w.opt.tw));
    var scorePct=Math.round(w.pct*100);
    var secTxt=ql(
      w.q.section==='basic'?'健康/基础':w.q.section==='social'?'生存/社会':'内在/情绪',
      w.q.section==='basic'?'健康/基礎':w.q.section==='social'?'生存/社會':'內在/情緒',
      w.q.section==='basic'?'Health/Baseline':w.q.section==='social'?'Social/Life':'Identity/Inner',
      w.q.section==='basic'?'Salud/Base':w.q.section==='social'?'Social/Vida':'Identidad/Interior'
    );
    rows.push({
      cls:'warn',
      icon:'🧩',
      title:ql('基于得分权重的个性化提示','基於得分權重的個人化提示','Personalized Insight Based on Score Weight','Perspectiva personalizada basada en el peso del puntaje'),
      body:ql(
        '在"'+qText+'"你的当前选项是"'+oText+'"，完成度约'+scorePct+'%，属于"'+secTxt+'"维度，建议优先改善。',
        '在「'+qText+'」你的當前選項是「'+oText+'」，完成度約'+scorePct+'%，屬於「'+secTxt+'」維度，建議優先改善。',
        '"'+qText+'" — your answer "'+oText+'" scores '+scorePct+'% in the "'+secTxt+'" dimension. This is dragging your overall score. Prioritize improving it.',
        '"'+qText+'" — tu respuesta "'+oText+'" obtiene '+scorePct+'% en la dimensión "'+secTxt+'". Está bajando tu puntaje. Prioriza mejorarlo.'
      )
    });
  });

  /* Render */
  if(!rows.length){
    rows.push({cls:'good',icon:'📊',
      title:ql('整体表现稳健','整體表現穩健','Overall Performance Stable','Desempeño general estable'),
      body:ql('你的各项指标没有触发特定的模式预警，整体处于健康稳定的状态。建议：选择你最感兴趣的1个维度继续深耕，并定期重测追踪自己的成长轨迹。','你的各項指標沒有觸發特定的模式預警，整體處於健康穩定的狀態。建議：選擇你最感興趣的1個維度繼續深耕，並定期重測追蹤自己的成長軌跡。','None of your indicators triggered specific pattern warnings — you\'re in a healthy, stable state overall. Recommendation: pick the one dimension you\'re most excited about and go deeper. Retest periodically to track your growth.','Ninguno de tus indicadores activó advertencias de patrones específicos — estás en un estado general saludable y estable. Recomendación: elige la dimensión que más te emociona y profundiza. Retoma la prueba periódicamente para seguir tu crecimiento.')
    });
  }
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
    animal:'🦅', name_cn:'鹰', name_tw:'鷹', name_en:'Eagle', name_es:'Águila', tier:'S',
    title_cn:'S级 · 天际之鹰', title_tw:'S級 · 天際之鷹', title_en:'S Tier · Sky Eagle', title_es:'Nivel S · Águila del Cielo',
    traits_cn:['战略视野','极致执行力','资源整合者','精神自由'], traits_en:['Strategic Vision','Elite Execution','Resource Master','Inner Freedom'], traits_es:['Visión Estratégica','Ejecución Élite','Maestro de Recursos','Libertad Interior'],
    traits_tw:['戰略視野','極致執行力','資源整合者','精神自由'],
    desc_cn:'你是极少数站在人生金字塔顶端的人。鹰是所有鸟类中视野最广的——它可以在3000米高空看清地面上一只兔子的动作。你就像这只鹰：你不仅看得远，而且在关键时刻能以俯冲式的精准执行力锁定目标。你的人生不是"一帆风顺"——事实上，鹰的羽毛每10年必须经历一次痛苦的重生脱换——但你选择了在每一次危机中蜕变而非退缩。你拥有罕见的组合：清晰的价值观、强大的情绪掌控力、和持续创造价值的系统能力。你最大的风险不是失败，而是高处不胜寒的孤独。记住：即使是鹰，也需要在风暴中找到气流来借力。你的下一个挑战不是飞得更高，而是带领更多人看到你所看到的风景。',
    desc_tw:'你是極少數站在人生金字塔頂端的人。鷹是所有鳥類中視野最廣的——它可以在3000米高空看清地面上一隻兔子的動作。你就像這隻鷹：你不僅看得遠，而且在關鍵時刻能以俯衝式的精準執行力鎖定目標。你的人生不是「一帆風順」——事實上，鷹的羽毛每10年必須經歷一次痛苦的重生脫換——但你選擇了在每一次危機中蛻變而非退縮。你擁有罕見的組合：清晰的價值觀、強大的情緒掌控力、和持續創造價值的系統能力。你最大的風險不是失敗，而是高處不勝寒的孤獨。記住：即使是鷹，也需要在風暴中找到氣流來借力。你的下一個挑戰不是飛得更高，而是帶領更多人看到你所看到的風景。',
    desc_en:'You are among the rare few who stand at the peak. The eagle has the widest field of vision of any bird — it can spot a rabbit from 10,000 feet. You operate with the same clarity: you see far, and when it matters most, you execute with predatory precision. Your life wasn\'t easy — eagles shed their feathers in a painful renewal every decade — but you chose transformation over retreat at every crisis. You have a rare combination: clear values, powerful emotional control, and systems that keep creating value. Your greatest risk isn\'t failure; it\'s the loneliness of altitude. Even eagles need to find updrafts in storms. Your next challenge isn\'t flying higher — it\'s helping more people see what you can see.',
    desc_es:'Estás entre los pocos que se encuentran en la cima. El águila tiene el campo de visión más amplio de cualquier ave. Operas con la misma claridad: ves lejos y ejecutas con precisión. Tu mayor riesgo no es el fracaso; es la soledad de la altura. Tu próximo desafío no es volar más alto — es ayudar a más personas a ver lo que tú puedes ver.',
  },
  A: {
    animal:'🐺', name_cn:'狼', name_tw:'狼', name_en:'Wolf', name_es:'Lobo', tier:'A',
    title_cn:'A级 · 原野之狼', title_tw:'A級 · 原野之狼', title_en:'A Tier · Wolf of the Plains', title_es:'Nivel A · Lobo de la Pradera',
    traits_cn:['目标驱动','社群领袖','适应力强','行动果断'], traits_en:['Goal-Driven','Community Leader','Highly Adaptable','Decisive'], traits_es:['Orientado a metas','Líder comunitario','Muy adaptable','Decisivo'],
    traits_tw:['目標驅動','社群領袖','適應力強','行動果斷'],
    desc_cn:'你是一匹狼——不是孤狼，而是狼群中的头狼。狼是自然界中最懂得"平衡个人能力与团队协作"的动物：它们独自狩猎时足够强悍，而在群体中又能做出最优的战术配合。你目前的人生状态展现了类似的模式：你有明确的目标、不错的执行力、和相对健康的社交支撑系统。你的财务状况稳健，健康习惯尚可，内心也有清晰的价值锚点。但狼的故事也有另一面——它们永远在奔跑。你可能时常感到"还不够"的焦虑，即使已经超越了大多数人。你现在需要做的不是继续加速，而是学会在奔跑中抬头看路，确认你追逐的方向仍然是你真正想去的地方。你的终极进化方向是：从"追猎者"变成"领地的守护者"——不仅为自己而战，也为你在乎的人创造安全感。',
    desc_tw:'你是一匹狼——不是孤狼，而是狼群中的頭狼。狼是自然界中最懂得「平衡個人能力與團隊協作」的動物：牠們獨自狩獵時足夠強悍，而在群體中又能做出最優的戰術配合。你目前的人生狀態展現了類似的模式：你有明確的目標、不錯的執行力、和相對健康的社交支撐系統。你的財務狀況穩健，健康習慣尚可，內心也有清晰的價值錨點。但狼的故事也有另一面——牠們永遠在奔跑。你可能時常感到「還不夠」的焦慮，即使已經超越了大多數人。你現在需要做的不是繼續加速，而是學會在奔跑中抬頭看路，確認你追逐的方向仍然是你真正想去的地方。',
    desc_en:'You are a wolf — not a lone wolf, but the alpha. Wolves are nature\'s masters of balancing individual strength with team coordination: fierce enough to hunt alone, smart enough to lead a pack with perfect tactical cooperation. Your current life shows this pattern: clear goals, solid execution, and a relatively healthy social support system. But the wolf\'s story has another side — they never stop running. You may often feel \'not enough\' anxiety even when you\'ve surpassed most people. What you need now isn\'t to accelerate further — it\'s to lift your head while running and confirm that the direction you\'re chasing is still where you actually want to go.',
    desc_es:'Eres un lobo — no un lobo solitario, sino el alfa. Los lobos son maestros del equilibrio entre fuerza individual y coordinación de equipo. Tu patrón de vida actual muestra esto: metas claras, buena ejecución y un sistema de apoyo social relativamente saludable. Lo que necesitas ahora no es acelerar más — es levantar la cabeza mientras corres y confirmar que la dirección que persigues es adonde realmente quieres ir.',
  },
  B: {
    animal:'🐎', name_cn:'马', name_tw:'馬', name_en:'Horse', name_es:'Caballo', tier:'B',
    title_cn:'B级 · 草原之马', title_tw:'B級 · 草原之馬', title_en:'B Tier · Prairie Horse', title_es:'Nivel B · Caballo de Pradera',
    traits_cn:['稳步前进','耐力持久','忠诚可靠','潜力未尽'], traits_en:['Steady Progress','Lasting Endurance','Loyal & Reliable','Untapped Potential'], traits_es:['Progreso constante','Resistencia duradera','Leal y confiable','Potencial sin explotar'],
    traits_tw:['穩步前進','耐力持久','忠誠可靠','潛力未盡'],
    desc_cn:'你是一匹草原上的马——稳健、有耐力、值得信赖。马不是最快的动物，但它是唯一能在长途跋涉中保持节奏而不崩溃的物种。你的人生正是这样：你可能不是每个维度的佼佼者，但你在大多数方面都维持着"足够好"的状态。这是绝大多数人的位置，但也是最容易陷入"还行吧"惯性的位置。马的历史告诉我们一件事：同样的一匹马，套上不同的鞍具、遇到不同的骑手，命运天差地别。你现在的"B级"不是你的天花板，而是你的发射台。你目前最缺的不是能力，而是一个清晰的、值得全力以赴的目标。当马知道自己要去哪里的时候，它可以跑到不可思议的速度。给自己设定一个90天的挑战：在你最弱的维度中，选1个最想改变的点，全力突破。你会惊讶于自己的潜力。',
    desc_tw:'你是一匹草原上的馬——穩健、有耐力、值得信賴。馬不是最快的動物，但牠是唯一能在長途跋涉中保持節奏而不崩潰的物種。你的人生正是這樣：你可能不是每個維度的佼佼者，但你在大多數方面都維持著「足夠好」的狀態。這是絕大多數人的位置，但也是最容易陷入「還行吧」慣性的位置。你目前最缺的不是能力，而是一個清晰的、值得全力以赴的目標。當馬知道自己要去哪裡的時候，牠可以跑到不可思議的速度。給自己設定一個90天的挑戰：在你最弱的維度中，選1個最想改變的點，全力突破。',
    desc_en:'You are a horse — steady, enduring, trustworthy. The horse isn\'t the fastest animal, but it\'s the only one that can maintain its rhythm across a long journey without breaking down. Your life is like this: you may not lead every dimension, but you sustain \'good enough\' across most. This is where most people are — but it\'s also where it\'s easiest to fall into comfortable inertia. The same horse, with different gear and a different rider, can have a completely different destiny. Your current \'B tier\' isn\'t your ceiling; it\'s your launch pad. What you\'re missing isn\'t ability — it\'s one clear, worthy target to go all-in on. Set yourself a 90-day challenge in your weakest dimension and commit fully. You\'ll surprise yourself.',
    desc_es:'Eres un caballo — estable, resistente, confiable. El caballo no es el animal más rápido, pero es el único que puede mantener su ritmo en un largo viaje sin derrumbarse. Tu \'nivel B\' actual no es tu techo; es tu plataforma de lanzamiento. Establece un desafío de 90 días en tu dimensión más débil y comprométete completamente. Te sorprenderás.',
  },
  C: {
    animal:'🦊', name_cn:'狐', name_tw:'狐', name_en:'Fox', name_es:'Zorro', tier:'C',
    title_cn:'C级 · 丛林之狐', title_tw:'C級 · 叢林之狐', title_en:'C Tier · Forest Fox', title_es:'Nivel C · Zorro del Bosque',
    traits_cn:['机敏灵活','逆境求生','独立性强','需要方向'], traits_en:['Sharp & Agile','Thrives Under Pressure','Fiercely Independent','Needs Direction'], traits_es:['Ágil e inteligente','Prospera bajo presión','Muy independiente','Necesita dirección'],
    traits_tw:['機敏靈活','逆境求生','獨立性強','需要方向'],
    desc_cn:'你是一只狐狸——聪明、灵活、独立，但正在一片并不完全友好的丛林中寻找自己的位置。狐狸是自然界最会"以小博大"的动物：它们体型不大，但靠着敏锐的观察力和灵活的策略，在狼群和熊的领地缝隙中活得有声有色。你的人生状态和这只狐狸很像：你可能在某些维度（尤其是财务或社会生活方向）处于起步阶段，但你并不缺乏潜力——你缺乏的是一个系统性的突破路径。你身上最大的资产不是现有的分数，而是你的适应能力和独立精神。很多"高分者"一旦失去现有优势就会崩溃，而你正因为一直在不完美的条件下生存，反而锻造了罕见的韧性。你现在的任务是：停止在多个方向上分散精力，选定一个战场，用你的灵活性集中突破。狐狸不需要变成狼——它需要找到最适合自己的猎场。',
    desc_tw:'你是一隻狐狸——聰明、靈活、獨立，但正在一片並不完全友好的叢林中尋找自己的位置。狐狸是自然界最會「以小博大」的動物：牠們體型不大，但靠著敏銳的觀察力和靈活的策略，在狼群和熊的領地縫隙中活得有聲有色。你可能在某些維度處於起步階段，但你並不缺乏潛力。你身上最大的資產不是現有的分數，而是你的適應能力和獨立精神。你現在的任務是：停止在多個方向上分散精力，選定一個戰場，用你的靈活性集中突破。狐狸不需要變成狼——牠需要找到最適合自己的獵場。',
    desc_en:'You are a fox — sharp, flexible, independent, finding your place in a jungle that isn\'t always friendly. Foxes are nature\'s greatest \'big results from small resources\' specialists: not the biggest, but sharp enough to thrive in the gaps between wolves and bears using observation and adaptable strategy. You may be in the early stages in some dimensions — especially financially or socially — but you don\'t lack potential. Your biggest asset isn\'t your current score; it\'s your adaptability and independent spirit. Many high scorers collapse the moment their advantages disappear — you\'ve been forged by imperfect conditions, giving you rare resilience. Your task now: stop spreading energy in multiple directions. Choose one battlefield and concentrate your flexibility there. A fox doesn\'t need to become a wolf — it needs to find the perfect hunting ground.',
    desc_es:'Eres un zorro — inteligente, flexible, independiente. Los zorros son los mejores especialistas de la naturaleza en \'grandes resultados con pocos recursos\'. Tu mayor activo no es tu puntaje actual; es tu adaptabilidad y espíritu independiente. Tu tarea ahora: deja de dispersar energía en múltiples direcciones. Elige un campo de batalla y concentra allí tu flexibilidad. Un zorro no necesita convertirse en lobo — necesita encontrar el territorio de caza perfecto.',
  },
  D: {
    animal:'🐢', name_cn:'龟', name_tw:'龜', name_en:'Turtle', name_es:'Tortuga', tier:'D',
    title_cn:'D级 · 深潜之龟', title_tw:'D級 · 深潛之龜', title_en:'D Tier · Deep-Diving Turtle', title_es:'Nivel D · Tortuga de las Profundidades',
    traits_cn:['厚积薄发','防御坚固','内敛沉稳','蓄势待起'], traits_en:['Slow Build, Big Burst','Strong Defenses','Calm & Reserved','Gathering Strength'], traits_es:['Acumulación lenta, gran impulso','Defensas sólidas','Calmado y reservado','Acumulando fuerzas'],
    traits_tw:['厚積薄發','防禦堅固','內斂沉穩','蓄勢待起'],
    desc_cn:'你是一只龟——而龟，是地球上最古老的幸存者之一。在恐龙灭绝的灾难中，龟活了下来。在冰河期的极端环境中，龟活了下来。在每一次看似不可能生存的条件下，龟都凭借一个策略活了下来：缩进壳里，保存能量，等待时机。你现在的状态正是如此。你的分数不高，这意味着你可能在健康、财务、关系或心理状态方面正面临真实的困难。但这里有一个绝大多数人不知道的事实：所有最戏剧性的人生逆转故事，都从比你现在更低的起点开始。龟的壳不是弱点——它是进化了2亿年的完美防护。你此刻需要的不是和别人比较，而是找到你的"壳"——那个让你在困难时刻也能感到安全的最小稳定结构。它可以是一个固定的作息、一份哪怕微薄但稳定的收入、或者一个你信任的人。先稳住，再出发。记住龟赛跑的故事：不是因为龟跑得快，而是因为龟从不停下来。',
    desc_tw:'你是一隻龜——而龜，是地球上最古老的倖存者之一。在恐龍滅絕的災難中，龜活了下來。你現在的狀態正是如此。你的分數不高，這意味著你可能在健康、財務、關係或心理狀態方面正面臨真實的困難。但所有最戲劇性的人生逆轉故事，都從比你現在更低的起點開始。你此刻需要的是找到你的「殼」——那個讓你在困難時刻也能感到安全的最小穩定結構。它可以是一個固定的作息、一份哪怕微薄但穩定的收入、或者一個你信任的人。先穩住，再出發。記住龜賽跑的故事：不是因為龜跑得快，而是因為龜從不停下來。',
    desc_en:'You are a turtle — and turtles are among Earth\'s oldest survivors. They outlasted the dinosaurs, survived ice ages, made it through every seemingly impossible condition using one strategy: retreat into the shell, conserve energy, wait for the right moment. Your situation may be similar. Your score is lower, which means you may be facing real challenges in health, finances, relationships, or mental state. But here\'s something most people don\'t know: every dramatic life-turnaround story starts from a lower point than where you are. The turtle\'s shell isn\'t a weakness — it\'s 200 million years of perfect protection. What you need right now isn\'t comparison — it\'s your \'shell\': the minimum stable structure that lets you feel safe even in hard times. It could be a fixed daily routine, a modest but steady income, or one person you trust. Stabilize first, then launch. Remember the race: not because the turtle is fast, but because the turtle never stops.',
    desc_es:'Eres una tortuga — y las tortugas son de los supervivientes más antiguos de la Tierra. Tu caparazón no es una debilidad — es protección perfecta de 200 millones de años. Lo que necesitas ahora no es comparación — es tu \'caparazón\': la estructura mínima estable que te permite sentirte seguro incluso en tiempos difíciles. Estabilízate primero, luego lanza. Recuerda la carrera: no porque la tortuga sea rápida, sino porque la tortuga nunca se detiene.',
  },
};

function getPersona(){
  if(finalScore>=120) return PERSONAS.S;
  if(finalScore>=85) return PERSONAS.A;
  if(finalScore>=55) return PERSONAS.B;
  if(finalScore>=35) return PERSONAS.C;
  return PERSONAS.D;
}

function buildPersona(lang){
  var p=getPersona();
  var isTW=lang==='zh-TW';
  var el=document.getElementById('personaAnimal'); if(el) el.textContent=p.animal;
  var tier=document.getElementById('personaTier'); if(tier) tier.textContent='TIER '+p.tier;
  var name=document.getElementById('personaName'); if(name) name.textContent=ql(p.title_cn,p.title_tw,p.title_en,p.title_es);
  var desc=document.getElementById('personaDesc'); if(desc) desc.textContent=ql(p.desc_cn,p.desc_tw,p.desc_en||p.desc_cn,p.desc_es||p.desc_cn);
  var traits=document.getElementById('personaTraits');
  if(traits){
    var lang2=window.I18N_CURRENT||'zh-CN'; var arr=lang2==='en-US'?(p.traits_en||p.traits_cn):lang2==='es-US'?(p.traits_es||p.traits_en||p.traits_cn):(isTW?p.traits_tw:p.traits_cn);
    traits.innerHTML=arr.map(function(t){ return '<span class="persona-trait">'+t+'</span>'; }).join('');
  }
}


/* ══════════════════════════════════════════════════════ */

function updateContent(){
  var lang=window.I18N_CURRENT||'zh-CN';
  buildRankVerdict(lang); buildDims(lang); buildBreakdown();
  var proRadar=document.getElementById('proRadarCanvas');
  if(proRadar) drawProfessionalRadar(proRadar);
  /* Persona */
  buildPersona(lang);
  /* Insights */
  buildInsights(lang);
  buildHighlights(lang); buildImprovements(lang); buildNextSteps(lang);
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
  var sn=document.getElementById('scScoreNum'); if(sn) sn.textContent=finalScore;
  var sv=document.getElementById('scVerdict');
  if(sv){ var v=getVerdict(finalScore); sv.textContent=window.t('result.'+v); }

  var sd=document.getElementById('scDims');
  if(sd&&dimPct){
    sd.innerHTML=DIM_CONF.map(function(d){
      var s=dimPct[d.key]||0;
      return '<div class="sc-dim"><span>'+d.icon+'</span> '+window.t(d.i18n)+' <strong>'+s+'</strong></div>';
    }).join('');
  }
}

function getShareText(lang){
  var v=getVerdict(finalScore);
  var label=window.t('result.'+v);
  if(lang==='en-US') return 'I scored '+finalScore+'/150 ('+label+') on the LifeScore test! Find out yours →';
  if(lang==='es-US') return '¡Obtuve '+finalScore+'/150 ('+label+') en la prueba LifeScore! Descubre el tuyo →';
  return lang==='zh-TW'
    ? '我在人生評分測試中獲得了 '+finalScore+'/150 分（'+label+'）！快來測測你的分數 →'
    : '我在人生评分测试中获得了 '+finalScore+'/150 分（'+label+'）！快来测测你的分数 →';
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
  var url  = encodeURIComponent('https://lifescore.com.cn');
  var encodedText = encodeURIComponent(text);

  /* 微博 */
  var wb=document.getElementById('sp-weibo');
  if(wb) wb.href='https://service.weibo.com/share/share.php?url='+url+'&title='+encodedText;

  /* QQ空间 */
  var qz=document.getElementById('sp-qzone');
  if(qz) qz.href='https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url='+url+'&title='+encodedText;

  /* 小红书/抖音/快手 — no deep-link API; show screenshot hint */
  ['sp-rednote','sp-douyin','sp-kuaishou'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){ el.href='#'; el.addEventListener('click', function(e){
      e.preventDefault();
      if(wechatHint){ wechatHint.style.display='flex'; }
    }); }
  });

  /* 微信 */
  var wx=document.getElementById('sp-wechat');
  if(wx){ wx.addEventListener('click', function(){
    if(wechatHint) wechatHint.style.display='flex';
  }); }

  /* 复制文字 */
  var copyBtn=document.getElementById('sp-copy');
  if(copyBtn){ copyBtn.addEventListener('click', function(){
    var t=getShareText(window.I18N_CURRENT||'zh-CN');
    if(navigator.clipboard){ navigator.clipboard.writeText(t).then(function(){
      var sp=copyBtn.querySelector('span:last-child'); if(sp){ var o=sp.textContent; var _copied=window.I18N_CURRENT==='zh-TW'?'已複製！':(window.I18N_CURRENT==='en-US'?'Copied!':(window.I18N_CURRENT==='es-US'?'¡Copiado!':'已复制！')); sp.textContent=_copied; setTimeout(function(){sp.textContent=o;},2000); }
    }); } else {
      var ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      var sp=copyBtn.querySelector('span:last-child'); if(sp){ var o=sp.textContent; var _copied=window.I18N_CURRENT==='zh-TW'?'已複製！':(window.I18N_CURRENT==='en-US'?'Copied!':(window.I18N_CURRENT==='es-US'?'¡Copiado!':'已复制！')); sp.textContent=_copied; setTimeout(function(){sp.textContent=o;},2000); }
    }
  }); }

  /* ── 保存图片 (Save Image) ──────────────────────────────────────────────
     Uses html2canvas (loaded from CDN) to rasterise the share card element,
     then triggers a PNG download.  html2canvas is loaded lazily the first
     time the user clicks "Save Image" so it doesn't slow down initial load.

     If html2canvas is unavailable (offline / blocked), we fall back to asking
     the user to long-press / screenshot the card manually.
  ── */
  var saveBtn=document.getElementById('sp-save');
  if(saveBtn){
    saveBtn.addEventListener('click', function(){
      var card=document.getElementById('shareCard');
      if(!card) return;

      var sp=saveBtn.querySelector('span:last-child');
      var origLabel=sp?sp.textContent:'';
      if(sp) sp.textContent=(window.I18N_CURRENT==='zh-TW'?'生成中…':'生成中…');
      saveBtn.disabled=true;

      function doCapture(){
        html2canvas(card, {
          scale: 3,               /* 3× for retina-sharp export */
          useCORS: true,
          backgroundColor: null,  /* keep card gradient */
          logging: false,
        }).then(function(canvas){
          var link=document.createElement('a');
          link.download='lifescore-result.png';
          link.href=canvas.toDataURL('image/png');
          link.click();
          if(sp) sp.textContent=origLabel;
          saveBtn.disabled=false;
        }).catch(function(){
          fallbackSave();
        });
      }

      function fallbackSave(){
        if(sp) sp.textContent=origLabel;
        saveBtn.disabled=false;
        if(wechatHint){
          wechatHint.style.display='flex';
          var hint=wechatHint.querySelector('span');
          if(hint) hint.textContent=(window.I18N_CURRENT==='zh-TW'
            ?'无法自动保存，请长按图片或截图保存。'
            :'无法自动保存，请长按图片或截图保存。');
        }
      }

      /* Lazy-load html2canvas from CDN if not already loaded */
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
    window.location.replace('quiz-quick.html');
    return;
  }
  finalScore=data.finalScore; dimPct=data.dimPct; dimPctRaw=data.dimPctRaw||{}; answerMap=data.answerMap||{};
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
