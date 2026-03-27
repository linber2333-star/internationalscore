/* result.js — comprehensive result display with fixed improve logic + share modal */
(function(){
'use strict';
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
  var t=lang==='zh-TW'?['待提升','發展中','尚可','良好','優秀','卓越']:['待提升','发展中','尚可','良好','优秀','卓越'];
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
    '<div class="breakdown-total"><span>'+(lang==='zh-TW'?'綜合分數':'综合分数')+'</span><span class="bt-score">'+finalScore+'</span></div></div>';
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
  var UNCONTROLLABLE_IDS = new Set(['A1','A3h','A3hf','QK1','QK4m','QK4f','QK5m','QK5f','A4','QKC8']);

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
      var advObj=ADVICE[q.id] || (window.QUICK_IMPROVE_ADVICE && window.QUICK_IMPROVE_ADVICE[q.id]);
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
        '<div class="imp-best"><span class="imp-label">'+(lang==='zh-TW'?'下一步：':'下一步：')+'</span>'+item.nextText+'</div>'+
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
    var youthTip = lang==='zh-TW'
      ? '🌱 给未满18岁的你\n\n你才刚刚开始。\n\n此刻的评分，是你在一个最受限制的人生阶段交出的答卷——没有完整的财务自主、没有职业积累、也没有太多的选择权。这些不是你的问题，而是年龄本来的样子。\n\n真正重要的是：你今天好奇什么、认真对待什么、选择成为什么样的人。这些，才是决定你未来20年的真实变量。\n\n你现在拥有最珍贵的资源——时间和可塑性。今天认真投入的每一个习惯，都在悄悄为你未来的人生叠加复利。\n\n去探索，去尝试，去犯错，去成长。你的人生，才刚刚开幕。'
      : '🌱 給未滿18歲的你\n\n你才剛剛開始。\n\n此刻的評分，是你在一個最受限制的人生階段交出的答卷——沒有完整的財務自主、沒有職業積累、也沒有太多的選擇權。這些不是你的問題，而是年齡本來的樣子。\n\n真正重要的是：你今天好奇什麼、認真對待什麼、選擇成為什麼樣的人。這些，才是決定你未來20年的真實變量。\n\n你現在擁有最珍貴的資源——時間和可塑性。今天認真投入的每一個習慣，都在悄悄為你未來的人生疊加複利。\n\n去探索，去嘗試，去犯錯，去成長。你的人生，才剛剛開幕。';
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
  ctx.fillText(finalScore, cx, cy-4);
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
        title:isTW?'維度發展不均衡':'维度发展不均衡',
        body:isTW?'你最強和最弱的維度之間差距超過25分。短板效應會限制你的整體上限——建議優先補強最弱的維度，而非繼續加強已有的優勢。具體來說，找出最弱維度中得分最低的2個問題，制定一個30天的集中改善計劃。':'你最强和最弱的维度之间差距超过25分。短板效应会限制你的整体上限——建议优先补强最弱的维度，而非继续加强已有的优势。具体来说，找出最弱维度中得分最低的2个问题，制定一个30天的集中改善计划。'
      });
    }
    if(mn>70){
      rows.push({cls:'good',icon:'🌟',
        title:isTW?'三維度均衡發展':'三维度均衡发展',
        body:isTW?'你的三個維度均在70分以上，展現出難得的均衡性。這意味著你沒有明顯的短板拖後腿。下一步建議：選擇你最有熱情的1個維度，投入額外精力將其打造成真正的核心優勢。':'你的三个维度均在70分以上，展现出难得的均衡性。这意味着你没有明显的短板拖后腿。下一步建议：选择你最有热情的1个维度，投入额外精力将其打造成真正的核心优势。'
      });
    }
  }

  /* ── Health + Habits pattern ── */
  var habitsScore=a('QK14'), visionScore=a('QK15a'), healthScore=a('QK15b');
  if(habitsScore>=3 || (visionScore>=3 && healthScore>=2)){
    rows.push({cls:'warn',icon:'🏥',
      title:isTW?'健康風險預警':'健康风险预警',
      body:isTW?'你的健康相關指標多項偏低，包括不良習慣、視力或慢性健康問題。健康是所有其他維度的"地基"——地基動搖，上層建築再好也會塌。建議本月內完成一次全面體檢，同時從最容易改變的1個不良習慣開始，用30天養成替代行為。':'你的健康相关指标多项偏低，包括不良习惯、视力或慢性健康问题。健康是所有其他维度的"地基"——地基动摇，上层建筑再好也会塌。建议本月内完成一次全面体检，同时从最容易改变的1个不良习惯开始，用30天养成替代行为。'
    });
  }

  /* ── Financial stress pattern ── */
  var savings=a('QK19'), runway=a('QK20');
  if(savings===0 && runway<=1){
    rows.push({cls:'warn',icon:'💸',
      title:isTW?'財務安全墊極薄':'财务安全垫极薄',
      body:isTW?'你的儲蓄水平和財務跑道同時處於最低區間，這意味著任何突發事件（失業、疾病、意外）都可能造成嚴重財務危機。緊急行動：本月起暫停所有非必要消費，啟動"50/30/20預算法"強制儲蓄。目標：3個月內建立至少1個月的應急儲備。':'你的储蓄水平和财务跑道同时处于最低区间，这意味着任何突发事件（失业、疾病、意外）都可能造成严重财务危机。紧急行动：本月起暂停所有非必要消费，启动"50/30/20预算法"强制储蓄。目标：3个月内建立至少1个月的应急储备。'
    });
  }

  /* ── Work-life imbalance ── */
  var overtime=a('QK12'), stress=a('QK13');
  if(overtime>=3 && stress>=3){
    rows.push({cls:'warn',icon:'🔥',
      title:isTW?'嚴重的工作-生活失衡':'严重的工作-生活失衡',
      body:isTW?'你同時報告了高加班時長和高工作壓力，這是職業倦怠的典型前兆。研究表明，長期超負荷工作不會提升產出，反而會導致決策質量下降、免疫力降低和人際關係惡化。本週就做一件事：設定一個"每日停工時間"（比如晚上8點），超過後完全不看工作消息，堅持7天。':'你同时报告了高加班时长和高工作压力，这是职业倦怠的典型前兆。研究表明，长期超负荷工作不会提升产出，反而会导致决策质量下降、免疫力降低和人际关系恶化。本周就做一件事：设定一个"每日停工时间"（比如晚上8点），超过后完全不看工作消息，坚持7天。'
    });
  }

  /* ── Social isolation ── */
  var confide=a('QK33'), parents=a('QK28a'), siblings=a('QK28b');
  if(confide===4 || (confide===-1 && parents>=2 && siblings>=2)){
    rows.push({cls:'purple',icon:'🫂',
      title:isTW?'社交支持系統薄弱':'社交支持系统薄弱',
      body:isTW?'你缺乏可以傾訴的對象，同時家庭關係也不夠親密。社交孤立是心理健康最大的隱形殺手——它對壽命的負面影響相當於每天抽15根菸。建議：本月嘗試加入一個興趣社群（線上或線下），或者約一位老朋友進行一次真正的深度對話。':'你缺乏可以倾诉的对象，同时家庭关系也不够亲密。社交孤立是心理健康最大的隐形杀手——它对寿命的负面影响相当于每天抽15根烟。建议：本月尝试加入一个兴趣社群（线上或线下），或者约一位老朋友进行一次真正的深度对话。'
    });
  }

  /* ── Strong internal identity ── */
  var curiosity=a('QK34'), persist=a('QK35'), emotion=a('QK36'), agency=a('QK37');
  if(curiosity<=1 && persist<=1 && emotion<=1){
    rows.push({cls:'good',icon:'💎',
      title:isTW?'強大的內在驅動力':'强大的内在驱动力',
      body:isTW?'你在好奇心、堅持力和情緒管理方面都表現出色。這三項能力的組合被心理學家稱為"成長型人格"——擁有它的人在面對挫折時恢復速度更快，長期成就的上限更高。建議：利用這個優勢去挑戰一個你一直猶豫要不要開始的大項目。':'你在好奇心、坚持力和情绪管理方面都表现出色。这三项能力的组合被心理学家称为"成长型人格"——拥有它的人在面对挫折时恢复速度更快，长期成就的上限更高。建议：利用这个优势去挑战一个你一直犹豫要不要开始的大项目。'
    });
  }

  /* ── High income but low savings ── */
  var income=a('QK7');
  if(income>=3 && savings<=1){
    rows.push({cls:'warn',icon:'🕳️',
      title:isTW?'高收入低儲蓄陷阱':'高收入低储蓄陷阱',
      body:isTW?'你的收入水平不低，但儲蓄卻很少——這是典型的"收入膨脹"陷阱：收入增長被同比例的消費升級完全吞噬。解決方案不是"少花錢"，而是在收入到賬的那一刻就自動轉走固定比例。建議設置月薪20%的自動轉存到一個不易取用的帳戶。':'你的收入水平不低，但储蓄却很少——这是典型的"收入膨胀"陷阱：收入增长被同比例的消费升级完全吞噬。解决方案不是"少花钱"，而是在收入到账的那一刻就自动转走固定比例。建议设置月薪20%的自动转存到一个不易取用的账户。'
    });
  }

  /* ── Good base, untapped social ── */
  if(dimPct && dimPct.basic>75 && dimPct.social<55){
    rows.push({cls:'purple',icon:'🚀',
      title:isTW?'基礎優秀但潛力未釋放':'基础优秀但潜力未释放',
      body:isTW?'你的基礎條件（健康、教育、環境）優於大多數人，但社會生活方向維度還未跟上。這說明你的外部資源轉化效率有待提升——你擁有比你意識到的更多的起點優勢。建議：認真審視你的職業路徑，考慮是否需要一次主動的職業躍升（跳槽、談薪或創業）。':'你的基础条件（健康、教育、环境）优于大多数人，但社会生活方向维度还未跟上。这说明你的外部资源转化效率有待提升——你拥有比你意识到的更多的起点优势。建议：认真审视你的职业路径，考虑是否需要一次主动的职业跃升（跳槽、谈薪或创业）。'
    });
  }

  /* ── Romantic distress pattern ── */
  var romantic=a('QK23');
  if(romantic>=5 && romantic<=8){
    rows.push({cls:'warn',icon:'💔',
      title:isTW?'親密關係正在經歷嚴重危機':'亲密关系正在经历严重危机',
      body:isTW?'你的感情狀態顯示關係正處於高壓或破裂狀態。這會像漏水的水管一樣持續消耗你在其他所有維度的精力和判斷力。最重要的第一步不是"解決問題"，而是為自己找到一個安全的情緒出口——約一位信任的朋友深聊，或預約一次心理諮詢。在做任何重大關係決定之前，先讓自己的情緒回到基準線。':'你的感情状态显示关系正处于高压或破裂状态。这会像漏水的水管一样持续消耗你在其他所有维度的精力和判断力。最重要的第一步不是"解决问题"，而是为自己找到一个安全的情绪出口——约一位信任的朋友深聊，或预约一次心理咨询。在做任何重大关系决定之前，先让自己的情绪回到基准线。'
    });
  }

  /* ── Youth potential pattern (under-25 with high curiosity/persistence) ── */
  if(a('QK1')<=1 && curiosity<=1 && persist<=1){
    rows.push({cls:'good',icon:'🌅',
      title:isTW?'年輕且擁有稀缺的成長型特質':'年轻且拥有稀缺的成长型特质',
      body:isTW?'你在25歲之前就展現出了強烈的好奇心和堅持力——這兩項特質的組合在同齡人中極為罕見。研究表明，這種"成長型人格"在30歲後會轉化為顯著的職業和收入優勢。你現在最需要做的不是追求穩定，而是大膽試錯：嘗試不同的行業、城市和生活方式，因為你的試錯成本在人生中處於最低點，而學習回報率處於最高點。':'你在25岁之前就展现出了强烈的好奇心和坚持力——这两项特质的组合在同龄人中极为罕见。研究表明，这种"成长型人格"在30岁后会转化为显著的职业和收入优势。你现在最需要做的不是追求稳定，而是大胆试错：尝试不同的行业、城市和生活方式，因为你的试错成本在人生中处于最低点，而学习回报率处于最高点。'
    });
  }

  /* ── Career stagnation: high income but low agency/satisfaction ── */
  if(income>=3 && (agency>=3 || a('QK39')>=3)){
    rows.push({cls:'purple',icon:'🔒',
      title:isTW?'高收入陷阱：金色牢籠效應':'高收入陷阱：金色牢笼效应',
      body:isTW?'你的收入不低，但你對人生的掌控感或成就感卻很弱。這是經典的"金色牢籠"——高薪讓你不敢離開，但工作本身正在消磨你的生命力。建議做一個"最壞情況演練"：如果你明天辭職，最壞的結果是什麼？你能承受嗎？通常你會發現，真實的風險遠小於你想像的。然後制定一個6個月的"逃離計劃"——不是明天就辭職，而是系統性地為自己創造選擇權。':'你的收入不低，但你对人生的掌控感或成就感却很弱。这是经典的"金色牢笼"——高薪让你不敢离开，但工作本身正在消磨你的生命力。建议做一个"最坏情况演练"：如果你明天辞职，最坏的结果是什么？你能承受吗？通常你会发现，真实的风险远小于你想象的。然后制定一个6个月的"逃离计划"——不是明天就辞职，而是系统性地为自己创造选择权。'
    });
  }

  /* ── Retirement risk: retired with low quality ── */
  var retireQuality=a('QK8b');
  if(a('QK3')===4 && retireQuality>=3){
    rows.push({cls:'warn',icon:'🏚️',
      title:isTW?'退休生活質量預警':'退休生活质量预警',
      body:isTW?'你的退休生活質量評分偏低。退休後最常見的三大問題是：社交圈急劇縮小、日常結構感消失、以及"被需要感"的喪失。建議本月做3件事：①加入一個每週固定聚會的社區團體（太極/書法/棋牌）②設定每天的"小目標"時間表（哪怕只是散步+讀報）③每週至少和子女或老朋友進行一次15分鐘以上的通話。這些看似簡單的行動，能顯著提升退休生活的幸福感。':'你的退休生活质量评分偏低。退休后最常见的三大问题是：社交圈急剧缩小、日常结构感消失、以及"被需要感"的丧失。建议本月做3件事：①加入一个每周固定聚会的社区团体（太极/书法/棋牌）②设定每天的"小目标"时间表（哪怕只是散步+读报）③每周至少和子女或老朋友进行一次15分钟以上的通话。这些看似简单的行动，能显著提升退休生活的幸福感。'
    });
  }

  /* ── Age-specific: 56–75 targeted analysis ── */
  if(a('QK1')>=5 && a('QK1')<=6){
    var s561=a('QKS56_1'), s562=a('QKS56_2'), s563=a('QKS56_3');
    if(s561>=2 || s562>=2 || s563>=2){
      rows.push({cls:'warn',icon:'🧭',
        title:isTW?'56–75歲階段：轉換期風險提示':'56–75岁阶段：转换期风险提示',
        body:isTW
          ? '你正處在「工作—退休—家庭角色」快速重構的階段。若健康管理、現金流安排與社交節律任一失衡，後續風險會明顯放大。建議優先把三件事流程化：固定健康追蹤、每月現金流盤點、每週社交活動安排。'
          : '你正处在“工作—退休—家庭角色”快速重构的阶段。若健康管理、现金流安排与社交节律任一失衡，后续风险会明显放大。建议优先把三件事流程化：固定健康追踪、每月现金流盘点、每周社交活动安排。'
      });
    } else {
      rows.push({cls:'good',icon:'✅',
        title:isTW?'56–75歲階段：結構穩定':'56–75岁阶段：结构稳定',
        body:isTW
          ? '你在過渡期的健康、財務與社交三項關鍵結構相對穩定。下一步可聚焦在「低風險高回報」：維持規律節奏、提升日常幸福感、並把經驗轉化為家庭與社群價值。'
          : '你在过渡期的健康、财务与社交三项关键结构相对稳定。下一步可聚焦在“低风险高回报”：维持规律节奏、提升日常幸福感，并把经验转化为家庭与社群价值。'
      });
    }
  }

  /* ── Age-specific: 76–100 targeted analysis ── */
  if(a('QK1')>=7 && a('QK1')<=8){
    var s761=a('QKS76_1'), s762=a('QKS76_2'), s763=a('QKS76_3');
    if(s761>=2 || s762>=2 || s763>=2){
      rows.push({cls:'warn',icon:'🛡️',
        title:isTW?'76–100歲階段：安全與連續性優先':'76–100岁阶段：安全与连续性优先',
        body:isTW
          ? '此年齡段最重要的不是「再提升多少」，而是「穩定地過好每一天」。若行動獨立性、就醫連續性或情緒安穩感偏弱，建議立刻補齊：居家防跌倒、緊急聯絡機制、規律陪伴與復診節奏。'
          : '此年龄段最重要的不是“再提升多少”，而是“稳定地过好每一天”。若行动独立性、就医连续性或情绪安稳感偏弱，建议立刻补齐：居家防跌倒、紧急联络机制、规律陪伴与复诊节奏。'
      });
    } else {
      rows.push({cls:'good',icon:'🌿',
        title:isTW?'76–100歲階段：高品質穩定狀態':'76–100岁阶段：高质量稳定状态',
        body:isTW
          ? '你在這一階段維持了難得的功能穩定與心理平和。建議繼續保持「低波動日常」：固定作息、適度活動、穩定社交觸點，讓生活品質可持續。'
          : '你在这一阶段维持了难得的功能稳定与心理平和。建议继续保持“低波动日常”：固定作息、适度活动、稳定社交触点，让生活质量可持续。'
      });
    }
  }

  /* ── Sedentary + screen addiction combo ── */
  if(answerMap['QK14'] && Array.isArray(answerMap['QK14'].selectedIndices)){
    var habits14=answerMap['QK14'].selectedIndices;
    var hasSedentary=habits14.indexOf(1)>=0, hasScreen=habits14.indexOf(6)>=0, hasLateNight=habits14.indexOf(4)>=0;
    if(hasSedentary && (hasScreen || hasLateNight)){
      rows.push({cls:'warn',icon:'📱',
        title:isTW?'久坐+螢幕成癮：慢性健康定時炸彈':'久坐+屏幕成瘾：慢性健康定时炸弹',
        body:isTW?'你同時存在久坐和螢幕過度使用的問題，這個組合會加速頸椎退化、視力下降和睡眠質量惡化。立即可執行的解法：在手機上設置每小時震動一次的提醒，每次站起來做2分鐘的拉伸（特別是頸部和髖部）。同時，把手機的螢幕設為晚上10點後自動變灰階——這會讓你的大腦自然失去刷屏的衝動。':'你同时存在久坐和屏幕过度使用的问题，这个组合会加速颈椎退化、视力下降和睡眠质量恶化。立即可执行的解法：在手机上设置每小时震动一次的提醒，每次站起来做2分钟的拉伸（特别是颈部和髋部）。同时，把手机的屏幕设为晚上10点后自动变灰阶——这会让你的大脑自然失去刷屏的冲动。'
      });
    }
  }

  /* ── High identity, low social — Thinker pattern ── */
  if(dimPct && dimPct.identity>75 && dimPct.social<55){
    rows.push({cls:'purple',icon:'💭',
      title:isTW?'思考者，但行動力不足':'思考者，但行动力不足',
      body:isTW?'你的內在認知和價值觀非常成熟，但還沒有充分轉化為外部成就。你可能有完美主義傾向——總覺得"還沒準備好"。解藥：每週設定一個30分鐘的"執行時段"，專門用於推進你腦海中已經有答案但一直沒動手的事。完成度比完美度重要得多。':'你的内在认知和价值观非常成熟，但还没有充分转化为外部成就。你可能有完美主义倾向——总觉得"还没准备好"。解药：每周设定一个30分钟的"执行时段"，专门用于推进你脑海中已经有答案但一直没动手的事。完成度比完美度重要得多。'
    });
  }

  /* ── Overall high scorer ── */
  if(finalScore>=85 && !bonusScore){
    rows.push({cls:'good',icon:'⭐',
      title:isTW?'你正處於人生高點——但要警惕高原效應':'你正处于人生高点——但要警惕高原效应',
      body:isTW?'85分以上的基礎分意味著你在大多數維度都表現出色。但高分者最大的風險不是"退步"，而是"停滯"——當一切都"還不錯"的時候，人會失去主動突破的動力。建議：給自己設定一個"舒適區之外"的90天挑戰——可以是學一門新語言、嘗試一個新運動、或者主動承接一個超出你當前能力的項目。保持成長的引擎運轉。':'85分以上的基础分意味着你在大多数维度都表现出色。但高分者最大的风险不是"退步"，而是"停滞"——当一切都"还不错"的时候，人会失去主动突破的动力。建议：给自己设定一个"舒适区之外"的90天挑战——可以是学一门新语言、尝试一个新运动、或者主动承接一个超出你当前能力的项目。保持成长的引擎运转。'
    });
  }

  /* ── Low emotional management + high stress combo ── */
  if(emotion>=3 && (stress>=2 || overtime>=2)){
    rows.push({cls:'warn',icon:'🌊',
      title:isTW?'情緒管理+高壓力：燃盡綜合症風險':'情绪管理+高压力：燃尽综合症风险',
      body:isTW?'你的情緒管理能力偏弱，同時又處於高壓環境中——這是心理健康危機的典型前兆組合。不要等到崩潰才行動。本週做2件事：①下載一個冥想App（如潮汐/小睡眠），每天睡前做5分鐘呼吸練習②找一位你信任的人，花15分鐘把你最近的壓力說出來——不需要解決方案，只是說出來本身就有療癒效果。':'你的情绪管理能力偏弱，同时又处于高压环境中——这是心理健康危机的典型前兆组合。不要等到崩溃才行动。本周做2件事：①下载一个冥想App（如潮汐/小睡眠），每天睡前做5分钟呼吸练习②找一位你信任的人，花15分钟把你最近的压力说出来——不需要解决方案，只是说出来本身就有疗愈效果。'
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
    var qText=isTW?(w.q.tw||w.q.cn):(w.q.cn||w.q.tw);
    var oText=isTW?(w.opt.tw||w.opt.cn):(w.opt.cn||w.opt.tw);
    var scorePct=Math.round(w.pct*100);
    var secTxt=isTW
      ? (w.q.section==='basic'?'健康/基礎':w.q.section==='social'?'生存/社會':'內在/情緒')
      : (w.q.section==='basic'?'健康/基础':w.q.section==='social'?'生存/社会':'内在/情绪');
    rows.push({
      cls:'warn',
      icon:'🧩',
      title:isTW?'基於得分權重的個人化提示':'基于得分权重的个性化提示',
      body:(isTW
        ? ('在「'+qText+'」你的當前選項是「'+oText+'」，該題完成度約 '+scorePct+'%。此題屬於「'+secTxt+'」維度，對總體表現的拖累係數較高，建議優先改善。')
        : ('在“'+qText+'”你的当前选项是“'+oText+'”，该题完成度约 '+scorePct+'%。此题属于“'+secTxt+'”维度，对总体表现的拖累系数较高，建议优先改善。'))
    });
  });

  /* Render */
  if(!rows.length){
    rows.push({cls:'good',icon:'📊',
      title:isTW?'整體表現穩健':'整体表现稳健',
      body:isTW?'你的各項指標沒有觸發特定的模式預警，整體處於健康穩定的狀態。建議：選擇你最感興趣的1個維度繼續深耕，並定期重測追蹤自己的成長軌跡。':'你的各项指标没有触发特定的模式预警，整体处于健康稳定的状态。建议：选择你最感兴趣的1个维度继续深耕，并定期重测追踪自己的成长轨迹。'
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
    animal:'🦅', name_cn:'鹰', name_tw:'鷹', tier:'S',
    title_cn:'S级 · 天际之鹰', title_tw:'S級 · 天際之鷹',
    traits_cn:['战略视野','极致执行力','资源整合者','精神自由'],
    traits_tw:['戰略視野','極致執行力','資源整合者','精神自由'],
    desc_cn:'你是极少数站在人生金字塔顶端的人。鹰是所有鸟类中视野最广的——它可以在3000米高空看清地面上一只兔子的动作。你就像这只鹰：你不仅看得远，而且在关键时刻能以俯冲式的精准执行力锁定目标。你的人生不是"一帆风顺"——事实上，鹰的羽毛每10年必须经历一次痛苦的重生脱换——但你选择了在每一次危机中蜕变而非退缩。你拥有罕见的组合：清晰的价值观、强大的情绪掌控力、和持续创造价值的系统能力。你最大的风险不是失败，而是高处不胜寒的孤独。记住：即使是鹰，也需要在风暴中找到气流来借力。你的下一个挑战不是飞得更高，而是带领更多人看到你所看到的风景。',
    desc_tw:'你是極少數站在人生金字塔頂端的人。鷹是所有鳥類中視野最廣的——它可以在3000米高空看清地面上一隻兔子的動作。你就像這隻鷹：你不僅看得遠，而且在關鍵時刻能以俯衝式的精準執行力鎖定目標。你的人生不是「一帆風順」——事實上，鷹的羽毛每10年必須經歷一次痛苦的重生脫換——但你選擇了在每一次危機中蛻變而非退縮。你擁有罕見的組合：清晰的價值觀、強大的情緒掌控力、和持續創造價值的系統能力。你最大的風險不是失敗，而是高處不勝寒的孤獨。記住：即使是鷹，也需要在風暴中找到氣流來借力。你的下一個挑戰不是飛得更高，而是帶領更多人看到你所看到的風景。',
  },
  A: {
    animal:'🐺', name_cn:'狼', name_tw:'狼', tier:'A',
    title_cn:'A级 · 原野之狼', title_tw:'A級 · 原野之狼',
    traits_cn:['目标驱动','社群领袖','适应力强','行动果断'],
    traits_tw:['目標驅動','社群領袖','適應力強','行動果斷'],
    desc_cn:'你是一匹狼——不是孤狼，而是狼群中的头狼。狼是自然界中最懂得"平衡个人能力与团队协作"的动物：它们独自狩猎时足够强悍，而在群体中又能做出最优的战术配合。你目前的人生状态展现了类似的模式：你有明确的目标、不错的执行力、和相对健康的社交支撑系统。你的财务状况稳健，健康习惯尚可，内心也有清晰的价值锚点。但狼的故事也有另一面——它们永远在奔跑。你可能时常感到"还不够"的焦虑，即使已经超越了大多数人。你现在需要做的不是继续加速，而是学会在奔跑中抬头看路，确认你追逐的方向仍然是你真正想去的地方。你的终极进化方向是：从"追猎者"变成"领地的守护者"——不仅为自己而战，也为你在乎的人创造安全感。',
    desc_tw:'你是一匹狼——不是孤狼，而是狼群中的頭狼。狼是自然界中最懂得「平衡個人能力與團隊協作」的動物：牠們獨自狩獵時足夠強悍，而在群體中又能做出最優的戰術配合。你目前的人生狀態展現了類似的模式：你有明確的目標、不錯的執行力、和相對健康的社交支撐系統。你的財務狀況穩健，健康習慣尚可，內心也有清晰的價值錨點。但狼的故事也有另一面——牠們永遠在奔跑。你可能時常感到「還不夠」的焦慮，即使已經超越了大多數人。你現在需要做的不是繼續加速，而是學會在奔跑中抬頭看路，確認你追逐的方向仍然是你真正想去的地方。',
  },
  B: {
    animal:'🐎', name_cn:'马', name_tw:'馬', tier:'B',
    title_cn:'B级 · 草原之马', title_tw:'B級 · 草原之馬',
    traits_cn:['稳步前进','耐力持久','忠诚可靠','潜力未尽'],
    traits_tw:['穩步前進','耐力持久','忠誠可靠','潛力未盡'],
    desc_cn:'你是一匹草原上的马——稳健、有耐力、值得信赖。马不是最快的动物，但它是唯一能在长途跋涉中保持节奏而不崩溃的物种。你的人生正是这样：你可能不是每个维度的佼佼者，但你在大多数方面都维持着"足够好"的状态。这是绝大多数人的位置，但也是最容易陷入"还行吧"惯性的位置。马的历史告诉我们一件事：同样的一匹马，套上不同的鞍具、遇到不同的骑手，命运天差地别。你现在的"B级"不是你的天花板，而是你的发射台。你目前最缺的不是能力，而是一个清晰的、值得全力以赴的目标。当马知道自己要去哪里的时候，它可以跑到不可思议的速度。给自己设定一个90天的挑战：在你最弱的维度中，选1个最想改变的点，全力突破。你会惊讶于自己的潜力。',
    desc_tw:'你是一匹草原上的馬——穩健、有耐力、值得信賴。馬不是最快的動物，但牠是唯一能在長途跋涉中保持節奏而不崩潰的物種。你的人生正是這樣：你可能不是每個維度的佼佼者，但你在大多數方面都維持著「足夠好」的狀態。這是絕大多數人的位置，但也是最容易陷入「還行吧」慣性的位置。你目前最缺的不是能力，而是一個清晰的、值得全力以赴的目標。當馬知道自己要去哪裡的時候，牠可以跑到不可思議的速度。給自己設定一個90天的挑戰：在你最弱的維度中，選1個最想改變的點，全力突破。',
  },
  C: {
    animal:'🦊', name_cn:'狐', name_tw:'狐', tier:'C',
    title_cn:'C级 · 丛林之狐', title_tw:'C級 · 叢林之狐',
    traits_cn:['机敏灵活','逆境求生','独立性强','需要方向'],
    traits_tw:['機敏靈活','逆境求生','獨立性強','需要方向'],
    desc_cn:'你是一只狐狸——聪明、灵活、独立，但正在一片并不完全友好的丛林中寻找自己的位置。狐狸是自然界最会"以小博大"的动物：它们体型不大，但靠着敏锐的观察力和灵活的策略，在狼群和熊的领地缝隙中活得有声有色。你的人生状态和这只狐狸很像：你可能在某些维度（尤其是财务或社会生活方向）处于起步阶段，但你并不缺乏潜力——你缺乏的是一个系统性的突破路径。你身上最大的资产不是现有的分数，而是你的适应能力和独立精神。很多"高分者"一旦失去现有优势就会崩溃，而你正因为一直在不完美的条件下生存，反而锻造了罕见的韧性。你现在的任务是：停止在多个方向上分散精力，选定一个战场，用你的灵活性集中突破。狐狸不需要变成狼——它需要找到最适合自己的猎场。',
    desc_tw:'你是一隻狐狸——聰明、靈活、獨立，但正在一片並不完全友好的叢林中尋找自己的位置。狐狸是自然界最會「以小博大」的動物：牠們體型不大，但靠著敏銳的觀察力和靈活的策略，在狼群和熊的領地縫隙中活得有聲有色。你可能在某些維度處於起步階段，但你並不缺乏潛力。你身上最大的資產不是現有的分數，而是你的適應能力和獨立精神。你現在的任務是：停止在多個方向上分散精力，選定一個戰場，用你的靈活性集中突破。狐狸不需要變成狼——牠需要找到最適合自己的獵場。',
  },
  D: {
    animal:'🐢', name_cn:'龟', name_tw:'龜', tier:'D',
    title_cn:'D级 · 深潜之龟', title_tw:'D級 · 深潛之龜',
    traits_cn:['厚积薄发','防御坚固','内敛沉稳','蓄势待起'],
    traits_tw:['厚積薄發','防禦堅固','內斂沉穩','蓄勢待起'],
    desc_cn:'你是一只龟——而龟，是地球上最古老的幸存者之一。在恐龙灭绝的灾难中，龟活了下来。在冰河期的极端环境中，龟活了下来。在每一次看似不可能生存的条件下，龟都凭借一个策略活了下来：缩进壳里，保存能量，等待时机。你现在的状态正是如此。你的分数不高，这意味着你可能在健康、财务、关系或心理状态方面正面临真实的困难。但这里有一个绝大多数人不知道的事实：所有最戏剧性的人生逆转故事，都从比你现在更低的起点开始。龟的壳不是弱点——它是进化了2亿年的完美防护。你此刻需要的不是和别人比较，而是找到你的"壳"——那个让你在困难时刻也能感到安全的最小稳定结构。它可以是一个固定的作息、一份哪怕微薄但稳定的收入、或者一个你信任的人。先稳住，再出发。记住龟赛跑的故事：不是因为龟跑得快，而是因为龟从不停下来。',
    desc_tw:'你是一隻龜——而龜，是地球上最古老的倖存者之一。在恐龍滅絕的災難中，龜活了下來。你現在的狀態正是如此。你的分數不高，這意味著你可能在健康、財務、關係或心理狀態方面正面臨真實的困難。但所有最戲劇性的人生逆轉故事，都從比你現在更低的起點開始。你此刻需要的是找到你的「殼」——那個讓你在困難時刻也能感到安全的最小穩定結構。它可以是一個固定的作息、一份哪怕微薄但穩定的收入、或者一個你信任的人。先穩住，再出發。記住龜賽跑的故事：不是因為龜跑得快，而是因為龜從不停下來。',
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
  var name=document.getElementById('personaName'); if(name) name.textContent=isTW?p.title_tw:p.title_cn;
  var desc=document.getElementById('personaDesc'); if(desc) desc.textContent=isTW?p.desc_tw:p.desc_cn;
  var traits=document.getElementById('personaTraits');
  if(traits){
    var arr=isTW?p.traits_tw:p.traits_cn;
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
      var sp=copyBtn.querySelector('span:last-child'); if(sp){ var o=sp.textContent; sp.textContent=(window.I18N_CURRENT==='zh-TW'?'已複製！':'已复制！'); setTimeout(function(){sp.textContent=o;},2000); }
    }); } else {
      var ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      var sp=copyBtn.querySelector('span:last-child'); if(sp){ var o=sp.textContent; sp.textContent=(window.I18N_CURRENT==='zh-TW'?'已複製！':'已复制！'); setTimeout(function(){sp.textContent=o;},2000); }
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
