/* analysis.js — deep analysis page with radar chart + per-question breakdown */
(function(){
'use strict';
var finalScore, dimPct, answerMap, activeQueue, quizMode;
var SECTION_COLORS={basic:'#7dd3fc',social:'#0ea5e9',identity:'#10b981'};

/* Helper: correct question bank based on quiz mode */
function getBank(){
  return (quizMode==='quick' && window.QUICK_QUESTION_BANK)
    ? window.QUICK_QUESTION_BANK
    : window.QUESTION_BANK;
}

function loadResult(){
  try{ var r=sessionStorage.getItem('ls_result'); if(r) return JSON.parse(r); }catch(e){}
  /* Fallback: try localStorage for persisted results (survives browser close) */
  try{ var d=localStorage.getItem('ls_result_latest'); if(d) return JSON.parse(d); }catch(e){}
  try{ var d=localStorage.getItem('ls_result_deep'); if(d) return JSON.parse(d); }catch(e){}
  try{ var d=localStorage.getItem('ls_result_quick'); if(d) return JSON.parse(d); }catch(e){}
  return null; // will show no-result state
}

function getVerdict(s){if(s>110)return'exceptional';if(s>=90)return'excellent';if(s>=70)return'high';if(s>=50)return'mid';if(s>=35)return'mid-low';return'low';}
function getRank(s){if(s>110)return Math.max(1,Math.round(3-(s-110)*0.05));var t=(s-50)/20,sig=1/(1+Math.exp(-t));return Math.round(sig*92+4);}

/* ── Radar chart (pure canvas, no lib) ── */
function drawRadar(canvas, scores, colors){
  var ctx=canvas.getContext('2d');
  // Use logical size for drawing, canvas element size handles display scaling
  var W=canvas.width, H=canvas.height, cx=W/2, cy=H/2;
  // Keep R small enough that labels at R+40 never exceed the canvas bounds
  var R=Math.min(W,H)*0.30; // 30% of canvas size leaves ample label room
  var labels=['基础信息','社会生活方向','个人认同'], n=labels.length;
  var lang=window.I18N_CURRENT||'zh-CN';
  if(lang==='zh-TW') labels=['基礎資訊','社會生活方向','個人認同'];

  ctx.clearRect(0,0,W,H);

  // Grid rings
  for(var ring=1;ring<=5;ring++){
    var r=R*ring/5;
    ctx.beginPath();
    for(var i=0;i<n;i++){
      var angle=Math.PI*2*i/n-Math.PI/2;
      var x=cx+r*Math.cos(angle), y=cy+r*Math.sin(angle);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle='rgba(14,165,233,0.13)'; ctx.lineWidth=1; ctx.stroke();
  }

  // Axes
  for(var i=0;i<n;i++){
    var angle=Math.PI*2*i/n-Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+R*Math.cos(angle),cy+R*Math.sin(angle));
    ctx.strokeStyle='rgba(14,165,233,0.20)'; ctx.lineWidth=1; ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  for(var i=0;i<n;i++){
    var angle=Math.PI*2*i/n-Math.PI/2;
    var v=Math.max(0.05,Math.min(100,scores[i]||0))/100;
    var x=cx+R*v*Math.cos(angle), y=cy+R*v*Math.sin(angle);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fillStyle='rgba(14,165,233,0.14)'; ctx.fill();
  ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=2.5; ctx.stroke();

  // Dots
  for(var i=0;i<n;i++){
    var angle=Math.PI*2*i/n-Math.PI/2;
    var v=Math.max(0.05,Math.min(100,scores[i]||0))/100;
    var x=cx+R*v*Math.cos(angle), y=cy+R*v*Math.sin(angle);
    ctx.beginPath(); ctx.arc(x,y,4.5,0,Math.PI*2);
    ctx.fillStyle='#0284c7'; ctx.fill();
    ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.stroke();
  }

  // Labels — set textAlign per-label based on horizontal position
  var LABEL_DIST = R + 38; // distance from center to label anchor
  ctx.font='600 12px "Noto Sans SC", sans-serif';
  ctx.fillStyle='#334155';
  ctx.textBaseline='middle';
  for(var i=0;i<n;i++){
    var angle=Math.PI*2*i/n-Math.PI/2;
    var lx=cx+LABEL_DIST*Math.cos(angle);
    var ly=cy+LABEL_DIST*Math.sin(angle);
    // Align based on horizontal position to keep text within canvas
    if(lx < cx-4)      ctx.textAlign='right';
    else if(lx > cx+4) ctx.textAlign='left';
    else                ctx.textAlign='center';
    // Score value below label
    var scoreVal=Math.round(scores[i]||0);
    ctx.fillStyle='#334155';
    ctx.fillText(labels[i], lx, ly-8);
    ctx.font='700 11px "Noto Sans SC", sans-serif';
    ctx.fillStyle='#0284c7';
    ctx.fillText(scoreVal, lx, ly+8);
    ctx.font='600 12px "Noto Sans SC", sans-serif';
    ctx.fillStyle='#334155';
  }
  ctx.textBaseline='alphabetic';

  // Center score
  ctx.textAlign='center';
  ctx.font='900 20px "Noto Sans SC", sans-serif';
  ctx.fillStyle='#0284c7';
  ctx.fillText(finalScore,cx,cy+6);
  ctx.font='400 10px "Noto Sans SC", sans-serif';
  ctx.fillStyle='#94a3b8';
  ctx.fillText('/ 150',cx,cy+20);
}

/* ── Dimension deep dives ── */
var DIM_DEEP={
  'zh-CN':{
    basic:{
      low:'你的基础维度得分偏低，这通常意味着在健康管理、城市资源、教育背景等方面存在一定劣势。但请记住：这些是起点，而非终点。许多成功人士都来自不利的起始条件。',
      mid:'你的基础维度处于中等水平，这是一个非常常见也相对稳健的状态。这意味着你有足够的基础来实现进一步发展。',
      high:'你的基础维度得分优秀，表明你在生命基础层面（健康、教育、居住环境）具备强有力的支撑系统。这为你的发展提供了坚实的底座。',
    },
    social:{
      low:'社会生活方向维度得分较低，可能反映在职业、收入或人际网络方面的挑战。这个维度是最可以通过努力改变的，也是提升潜力最大的。',
      mid:'你的社会生活方向处于社会平均线附近，既有资源，也有提升空间。关键在于如何把现有资源变成下一阶段的跳板。',
      high:'你的社会生活方向得分相当出色，在职业、财务或社交影响力方面有显著优势。这种优势如果能持续转化，将带来复利效应。',
    },
    identity:{
      low:'个人认同维度得分较低，意味着在价值观清晰度、人生目标感、心理韧性等方面还有较大的成长空间。这个维度最终决定你"用什么姿态"面对人生。',
      mid:'你的个人认同处于探索与建立的阶段。你已有初步的自我认知，但还未形成稳定、清晰的内在体系。这是大多数人在30岁前的正常状态。',
      high:'你的个人认同得分优秀，显示出清晰的价值观、稳健的心理状态和明确的人生方向。这是内在力量的体现，也是持续行动的基础。',
    },
  },
  'zh-TW':{
    basic:{
      low:'你的基礎維度得分偏低，這通常意味著在健康管理、城市資源、教育背景等方面存在一定劣勢。但請記住：這些是起點，而非終點。',
      mid:'你的基礎維度處於中等水平，這是一個非常常見也相對穩健的狀態。這意味著你有足夠的基礎來實現進一步發展。',
      high:'你的基礎維度得分優秀，表明你在生命基礎層面（健康、教育、居住環境）具備強有力的支撐系統。',
    },
    social:{
      low:'社會生活方向維度得分較低，可能反映在職業、收入或人際網路方面的挑戰。這個維度是最可以透過努力改變的。',
      mid:'你的社會生活方向處於社會平均線附近，既有資源，也有提升空間。關鍵在於如何把現有資源變成下一階段的跳板。',
      high:'你的社會生活方向得分相當出色，在職業、財務或社交影響力方面有顯著優勢。這種優勢如果能持續轉化，將帶來複利效應。',
    },
    identity:{
      low:'個人認同維度得分較低，意味著在價值觀清晰度、人生目標感、心理韌性等方面還有較大的成長空間。',
      mid:'你的個人認同處於探索與建立的階段。你已有初步的自我認知，但還未形成穩定、清晰的內在體系。',
      high:'你的個人認同得分優秀，顯示出清晰的價值觀、穩健的心理狀態和明確的人生方向。',
    },
  },
};

function dimTier(s){ if(s<40)return'low'; if(s<70)return'mid'; return'high'; }

function buildDimDeep(lang){
  var c=document.getElementById('dimDeepRows'); if(!c) return; c.innerHTML='';
  var conf=[
    {key:'basic',    label_cn:'基础信息',label_tw:'基礎資訊',  icon:'🧬',color:'#7dd3fc'},
    {key:'social',   label_cn:'社会生活方向',label_tw:'社會生活方向',  icon:'🏙️',color:'#0ea5e9'},
    {key:'identity', label_cn:'个人认同',label_tw:'個人認同',  icon:'💡',color:'#10b981'},
  ];
  conf.forEach(function(d){
    var score=dimPct&&dimPct[d.key]!=null?dimPct[d.key]:0;
    var t=dimTier(score);
    var deepTexts=(DIM_DEEP[lang]||DIM_DEEP['zh-CN'])[d.key];
    var text=deepTexts[t];
    var label=lang==='zh-TW'?d.label_tw:d.label_cn;
    var pct=score;

    var card=document.createElement('div'); card.className='dim-deep-card';
    card.innerHTML=
      '<div class="ddc-header" style="border-left:4px solid '+d.color+'">'+
        '<span class="ddc-icon">'+d.icon+'</span>'+
        '<div class="ddc-meta">'+
          '<span class="ddc-label">'+label+'</span>'+
          '<span class="ddc-score" style="color:'+d.color+'">'+score+'<small> / 150</small></span>'+
        '</div>'+
        '<div class="ddc-bar-wrap"><div class="ddc-bar-track"><div class="ddc-bar-fill" data-pct="'+pct+'" style="width:0;background:'+d.color+'"></div></div></div>'+
      '</div>'+
      '<div class="ddc-body">'+text+'</div>'+
      buildQSummary(d.key, lang)+
    '';
    c.appendChild(card);
  });
  setTimeout(function(){
    document.querySelectorAll('.ddc-bar-fill').forEach(function(f){ f.style.width=f.dataset.pct+'%'; });
  },400);
}

function buildQSummary(sectionKey, lang){
  if(!answerMap||!getBank()) return '';
  var items=[];
  getBank().forEach(function(q){
    if(q.section!==sectionKey||!q.scorable||!answerMap[q.id]) return;
    var oi=answerMap[q.id].questionIdx;
    var opt=q.options[oi];
    /* Guard against undefined option (stale answer from branching) */
    if(!opt) return;
    var maxOpt=Math.max.apply(null,q.options.map(function(o){return o.score||0;}));
    items.push({q:q, oi:oi, opt:opt, score:opt.score||0, max:maxOpt});
  });
  if(!items.length) return '';
  var rows=items.map(function(item){
    var qText=lang==='zh-TW'?item.q.tw:item.q.cn;
    /* Use stored optionText from answerMap to avoid undefined */
    var oText = (lang==='zh-TW'
      ? (answerMap[item.q.id].optionText_tw||item.opt.tw||item.opt.cn)
      : (answerMap[item.q.id].optionText_cn||item.opt.cn||item.opt.tw)) || '';
    /* noImprove questions: show raw score. Others: show percentage bar but hide raw number */
    var isNoImprove=!!item.q.noImprove;
    var pct=item.max>0 ? Math.round(item.score/item.max*100) : 0;
    var color=pct>=75?'#10b981':pct>=50?'#f59e0b':'#ef4444';
    var scoreDisplay = isNoImprove
      ? '<div class="qs-pct qs-raw" style="color:#6366f1">'+item.score+'分</div>'
      : '<div class="qs-bar"><div class="qs-fill" style="width:'+pct+'%;background:'+color+'"></div></div>';
    return '<div class="qs-row">'+
      '<div class="qs-q">'+qText+'</div>'+
      '<div class="qs-a">'+oText+'</div>'+
      scoreDisplay+
      '</div>';
  }).join('');
  return '<div class="qs-wrap">'+rows+'</div>';
}

/* ── Q breakdown ── */
var activeFilter='all';
function buildQBreakdown(lang){
  var c=document.getElementById('qBreakdownRows'); if(!c||!answerMap||!getBank()) return;
  c.innerHTML='';
  /* Fix: 7 letters to cover all question options including 7-option income/net worth questions */
  var letters=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];
  var shown=0;
  getBank().forEach(function(q,qi){
    if(!answerMap[q.id]) return;
    if(activeFilter!=='all'&&q.section!==activeFilter) return;

    var aData=answerMap[q.id];
    var oi=aData.questionIdx;
    /* Guard: if oi is out of range (e.g. branched question with stale answer) skip */
    if(oi===undefined||oi===null||!q.options[oi]) return;
    var opt=q.options[oi];

    var maxScore=Math.max.apply(null,q.options.map(function(o){return o.score||0;}));
    var qText=lang==='zh-TW'?q.tw:q.cn;
    var mc=SECTION_COLORS[q.section]||'#7dd3fc';

    /* Score display logic:
       - noImprove questions (A1 age, A4 birthplace): show raw option score directly, no comparison
       - All other scorable questions: show score chip but HIDE individual option scores
       - Non-scorable questions: no score display at all */
    var isNoImprove = !!q.noImprove;
    var scorePct = q.scorable&&maxScore>0 ? Math.round((opt.score||0)/maxScore*100) : 50;
    var scoreColor = scorePct>=75?'#10b981':scorePct>=50?'#f59e0b':'#ef4444';
    var scoreChipHtml = '';
    if(isNoImprove && q.scorable){
      /* Raw score display for age/birthplace — no percentage, just the raw number */
      scoreChipHtml='<span class="qb-score-chip qb-score-raw" style="color:#6366f1;background:#6366f118">'+(lang==='zh-TW'?'原始分：':'原始分：')+(opt.score||0)+'</span>';
    } else if(q.scorable){
      scoreChipHtml='<span class="qb-score-chip" style="color:'+scoreColor+';background:'+scoreColor+'18">'+(lang==='zh-TW'?'得分 ':'得分 ')+(opt.score||0)+' / '+maxScore+'</span>';
    }

    var card=document.createElement('div'); card.className='qb-card'; card.dataset.section=q.section;

    /* Build options list:
       - Selected option: highlighted, show "你的选择" tag
       - Other options: show text only — NO individual scores (per spec: hide all option scores) */
    var optsHtml=q.options.map(function(o,i){
      /* Guard: option text can be undefined for 6/7-option questions if letters array was short */
      var text=(lang==='zh-TW'?o.tw:o.cn)||'';
      var isSel=i===oi;
      /* Best-option marker only shown on selected item for context; never shows score number */
      var isBest=o.score===maxScore&&o.score>0&&!isNoImprove;
      return '<div class="qb-opt'+(isSel?' qb-opt--sel':'')+(isBest&&isSel?' qb-opt--best':'')+'">'+
        '<span class="qb-letter">'+(letters[i]||'?')+'</span>'+
        '<span class="qb-otext">'+text+'</span>'+
        (isSel?'<span class="qb-you">'+(lang==='zh-TW'?'你的選擇':'你的选择')+'</span>':'')+
        /* Intentionally omit score numbers per requirement */
        '</div>';
    }).join('');

    card.innerHTML=
      '<div class="qb-header">'+
        '<span class="qb-num" style="background:'+mc+'18;color:'+mc+'">'+(shown+1)+'</span>'+
        '<span class="qb-section-dot" style="background:'+mc+'"></span>'+
        '<span class="qb-section-name">'+(lang==='zh-TW'?(q.section==='basic'?'基礎資訊':q.section==='social'?'社會生活方向':'個人認同'):(q.section==='basic'?'基础信息':q.section==='social'?'社会生活方向':'个人认同'))+'</span>'+
        scoreChipHtml+
      '</div>'+
      '<div class="qb-q">'+qText+'</div>'+
      '<div class="qb-opts">'+optsHtml+'</div>';
    c.appendChild(card);
    shown++;
  });
  if(shown===0) c.innerHTML='<div class="empty-note">'+(lang==='zh-TW'?'此篩選條件下無題目。':'此筛选条件下无题目。')+'</div>';
}

/* ── Insights ── */
var INSIGHTS={
  'zh-CN':[
    {
      test:function(){ return dimPct&&dimPct.basic>70&&dimPct.social<50; },
      icon:'⚠️', color:'#f59e0b',
      title:'潜力未被充分释放',
      text:'你的基础条件（健康、教育、环境）优于大多数人，但社会生活方向还未跟上基础的水平。这说明你的外部资源转化效率有待提升。建议认真检视你的职业路径和人际策略——你拥有比你意识到的更多的起点优势，关键在于将它系统化地变为现实。',
    },
    {
      test:function(){ return dimPct&&dimPct.identity>75&&dimPct.social<55; },
      icon:'💭', color:'#0ea5e9',
      title:'思考者，但行动不足',
      text:'你有很强的自我认知和理想主义色彩，但在社会生活方向和实际成就方面还没有完全体现出来。内在世界的丰富很宝贵，但需要找到"将想法变现"的转换机制。建议：每周设定一个30分钟的"执行时段"，专门用于推进你脑海中已经有答案的事。',
    },
    {
      test:function(){ return dimPct&&dimPct.social>70&&dimPct.identity<50; },
      icon:'🏃', color:'#ef4444',
      title:'外部成功，内在空洞',
      text:'你在社会生活方向维度表现突出，但个人认同得分较低——这是一个经典的"成功陷阱"。职业上升和财富积累往往掩盖了对意义感和价值观的忽视。警惕：没有内在锚点的外部成功往往在中年危机时轰然倒塌。建议每季度花一天做一次"人生复盘"。',
    },
    {
      test:function(){ return finalScore>90; },
      icon:'🌟', color:'#10b981',
      title:'高均衡者',
      text:'你在三个维度都保持了较高水平，这是极少数人能达到的状态。维持这种均衡比实现它更难。你最大的风险是"高原期"——需要不断主动引入新的挑战来避免停滞。在这个阶段，你应该开始思考如何将自身积累的经验系统化传递给他人。',
    },
    {
      test:function(){ return finalScore<35; },
      icon:'🌱', color:'#7dd3fc',
      title:'起步者，潜力巨大',
      text:'低分不代表差，而代表巨大的成长空间。你现在的状态是一张白纸，每一步努力都会直接反映在分数上。研究表明，起点低的人往往因为感受到更明显的进步而获得更强的内在动力。关键是：不要和终点比较，要和昨天的自己比较。',
    },
    {
      test:function(){ var d=dimPct; if(!d) return false; var v=[d.basic,d.social,d.identity]; var max=Math.max.apply(null,v),min=Math.min.apply(null,v); return max-min>40; },
      icon:'⚖️', color:'#f59e0b',
      title:'发展极度不均衡',
      text:'你的三个维度之间差距超过40分，说明你在某一方面有明显优势，但也有明显短板。这种不均衡长期来看会成为瓶颈。建议优先补强最弱的维度——木桶理论在个人发展中同样有效，最短的那块木板决定了你能盛多少水。',
    },
    /* ── 净资产相关洞察（对应B4的15个选项，oi 0-14）
       oi 0  = 负债
       oi 1  = 0-100元
       oi 2  = 100-1000元
       oi 3  = 1000-5000元
       oi 4  = 5000-1万元
       oi 5  = 1万-2万元
       oi 6  = 2万-10万元
       oi 7  = 10万-25万元
       oi 8  = 25万-50万元
       oi 9  = 50万-100万元
       oi 10 = 100万-500万元
       oi 11 = 500万-1000万元
       oi 12 = 1000万-1亿元
       oi 13/14 = 1亿+/10亿+
    ── */
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        return answerMap.B4.questionIdx===0;
      },
      icon:'💸', color:'#ef4444',
      title:'负债状态：优先止血，再谈积累',
      text:'你目前处于净负债状态。这并不少见，但它意味着你的财务系统在持续失血，必须在积累之前先解决这个问题。行动清单：① 列出所有负债，按利率高低排序；② 优先偿还高息消费贷和信用卡；③ 维持最低生活保障的同时，不新增非必要负债；④ 一旦负债缩减至可控范围，立即建立1个月的应急储备。负债本身不是问题——没有计划才是。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=1&&oi<=2; /* 0-1000元：几乎为零 */
      },
      icon:'🌱', color:'#ef4444',
      title:'净资产几乎为零：从第一步开始',
      text:'净资产接近于零，但这正是积累的起点。在这个阶段，习惯比金额更重要。关键行动：① 建立"先存后花"反射——每次收入到账立即转走10%，哪怕只有几十元；② 消除所有非必要的循环支出（订阅、外卖惯性等）；③ 把精力放在提升收入上，而非省钱——收入弹性远大于支出压缩空间。第一个1万元是最难的。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=3&&oi<=4; /* 1000-1万元：极早期 */
      },
      icon:'🌿', color:'#f59e0b',
      title:'小额净资产：建立财务肌肉记忆',
      text:'你有了第一批净资产，但还非常脆弱——一次意外支出就可能归零。这个阶段的核心任务是建立财务系统的韧性。建议：① 把现有积蓄放入货币基金或活期理财（稳定、可随时取用）；② 建立记账习惯，了解钱去哪里；③ 开始学习最基础的个人财务知识（预算、复利）。现在每多存1元，未来的复利效果都是数倍的。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=5&&oi<=6; /* 1万-10万元：起步期 */
      },
      icon:'💡', color:'#f59e0b',
      title:'初步积累：从储蓄者到理财者的转变',
      text:'拥有1万至10万净资产，你已经完成了从"零"到"有"的第一步。这个阶段的关键转变是：从被动储蓄变为主动理财。建议：① 建立3-6个月应急储备（余额宝等货币基金）；② 在应急储备之外开始定投宽基指数基金（每月固定金额）；③ 了解自己的消费结构，设定储蓄率目标（20%以上为佳）。时间复利的窗口正在打开。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=7&&oi<=8; /* 10万-50万：成长期 */
      },
      icon:'📊', color:'#7dd3fc',
      title:'10-50万净资产：进入资产配置意识阶段',
      text:'10万至50万净资产，你已经越过了绝大多数同龄人"月光"的阶段，开始有了真正的财务缓冲。这个阶段要完成思维升级：① 应急储备已经到位，余量资金可以承担更高风险换取更高回报；② 开始学习股票型基金和ETF的基本逻辑；③ 评估是否需要购买意外险和医疗险来保护已有积累；④ 如果有购房计划，开始研究目标城市的房价与首付能力。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===9; /* 50万-100万 */
      },
      icon:'🏠', color:'#7dd3fc',
      title:'50-100万净资产：接近首套房门槛的关键区',
      text:'50万至100万净资产，这是很多城市首套房首付的区间，也是财务决策开始真正复杂的阶段。核心问题：买房还是继续投资？建议：① 如果购房是刚需，评估月供压力与收入比（建议不超过40%）；② 如果不急着买房，这个量级已经可以进行多元资产配置（50%权益+30%固收+20%现金）；③ 考虑购买定期寿险和重疾险，保护已有资产；④ 开始建立投资记录和收益追踪习惯。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===10; /* 100万-500万 */
      },
      icon:'🏗️', color:'#10b981',
      title:'百万净资产：从储蓄型转向资产配置型',
      text:'净资产达到100万至500万，你已迈过了一个心理门槛——财富积累的飞轮开始转动。下一阶段的核心不再是"多存钱"，而是"让钱更有效地工作"。建议：① 建立正式的资产配置框架（目标年化回报率是多少？能承受多大波动？）；② 房产占比过高的话，考虑是否需要增加流动资产；③ 购买足额寿险/重疾险，保护资产不被医疗风险一次性清零；④ 学习税务筹划基础知识，合法降低税负。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===11; /* 500万-1000万 */
      },
      icon:'📈', color:'#10b981',
      title:'千万门槛：财富管理逻辑的根本转变',
      text:'净资产接近1000万，你正在进入一个全新的财富管理维度。在这个量级，财富的增长逻辑从"赚钱存钱"转向"系统性保值增值"。关键行动：① 重新审视资产结构——房产/股权/现金/固收的比例是否符合你的风险承受能力和流动性需求？② 开始思考税务规划（个人持有vs公司架构）；③ 考虑是否需要专业的财富管理顾问；④ 为家庭成员的意外风险建立充足的保障层。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===12; /* 1000万-1亿 */
      },
      icon:'🏛️', color:'#6366f1',
      title:'千万至亿级：高净值财富的护城河建设',
      text:'净资产1000万至1亿，你已进入高净值群体——中国约有200万个家庭到达这个区间。在这个层级，财富最大的威胁不是赚不够，而是"失去"：税务风险、法律纠纷、家庭变故、健康意外。建议：① 建立正式的家族财富保护架构（信托/控股公司）；② 持有充足的流动资产（不低于净资产的20%）；③ 聘请专业私人财富顾问，而非依赖银行理财经理；④ 开始认真规划财富的代际传承。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=13; /* 1亿+ */
      },
      icon:'🌍', color:'#0284c7',
      title:'亿级资产：财富的使命与边界',
      text:'净资产超过1亿，你已进入极少数人才能到达的财富层级。在这里，财富管理的核心命题变了——不再是"如何积累更多"，而是"如何让财富持续产生意义"。这个层级的挑战：① 个人努力的边际贡献下降，系统、团队和品牌的价值上升；② 财富的传承与社会影响成为真正的战略问题；③ 健康、关系和精神资本是任何财富都无法买回的东西——投入精力保护它们；④ 思考你的财富能为社会解决什么问题，这是一个真正值得花精力的问题。',
    },
    /* 健康与财富组合洞察 */
    {
      test:function(){
        var healthQ=answerMap&&answerMap.A8;
        var sleepQ=answerMap&&answerMap.A9;
        if(!healthQ||!sleepQ) return false;
        return healthQ.questionIdx<=1&&sleepQ.questionIdx<=1&&dimPct&&dimPct.social>65;
      },
      icon:'⚕️', color:'#ef4444',
      title:'用健康换取的成就，迟早要还回去',
      text:'你的社会生活方向维度表现不错，但健康和睡眠状况堪忧。这是一个危险的组合——许多职场高成就者在40岁前后因健康问题而被迫中断事业。建议立即评估你的睡眠债务，将"7小时睡眠"设为不可协商的底线。身体是最贵的"生产工具"，投资在它身上的回报率是最高的。',
    },
    /* 社交与认同组合洞察 */
    {
      test:function(){
        return dimPct&&dimPct.identity>70&&dimPct.basic>65&&dimPct.social<50&&finalScore<60;
      },
      icon:'🔮', color:'#0ea5e9',
      title:'内外倒置的成长轨迹',
      text:'你的内在认知（价值观、目标感）和基础条件都不差，但社会生活方向得分明显拖后腿。这通常意味着一个问题：认知走在了行动前面，或者你在用内在满足感回避外部挑战。建议检视你的职业选择——是真正的内心热爱，还是对竞争的规避？',
    },
  ],
  'zh-TW':[
    {
      test:function(){ return dimPct&&dimPct.basic>70&&dimPct.social<50; },
      icon:'⚠️', color:'#f59e0b',
      title:'潛力未被充分釋放',
      text:'你的基礎條件（健康、教育、環境）優於大多數人，但社會生活方向還未跟上基礎的水平。這說明你的外部資源轉化效率有待提升。建議認真檢視你的職業路徑和人際策略——你擁有比你意識到的更多的起點優勢，關鍵在於將它系統化地變為現實。',
    },
    {
      test:function(){ return dimPct&&dimPct.identity>75&&dimPct.social<55; },
      icon:'💭', color:'#0ea5e9',
      title:'思考者，但行動不足',
      text:'你有很強的自我認知和理想主義色彩，但在社會生活方向和實際成就方面還沒有完全體現出來。建議：每週設定一個30分鐘的「執行時段」，專門用於推進你腦海中已經有答案的事。',
    },
    {
      test:function(){ return dimPct&&dimPct.social>70&&dimPct.identity<50; },
      icon:'🏃', color:'#ef4444',
      title:'外部成功，內在空洞',
      text:'你在社會生活方向維度表現突出，但個人認同得分較低——這是一個經典的「成功陷阱」。建議每季度花一天做一次「人生復盤」，確保外部成就和內在意義保持對齊。',
    },
    {
      test:function(){ return finalScore>90; },
      icon:'🌟', color:'#10b981',
      title:'高均衡者',
      text:'你在三個維度都保持了較高水平，這是非常罕見的狀態。你最大的風險是「高原期」——需要不斷主動引入新的挑戰來避免停滯。在這個階段，你應該開始思考如何將自身積累的經驗系統化傳遞給他人。',
    },
    {
      test:function(){ return finalScore<35; },
      icon:'🌱', color:'#7dd3fc',
      title:'起步者，潛力巨大',
      text:'低分不代表差，而代表巨大的成長空間。關鍵是：不要和終點比較，要和昨天的自己比較。每一步努力都會直接反映在分數上。',
    },
    {
      test:function(){ var d=dimPct; if(!d) return false; var v=[d.basic,d.social,d.identity]; var max=Math.max.apply(null,v),min=Math.min.apply(null,v); return max-min>40; },
      icon:'⚖️', color:'#f59e0b',
      title:'發展極度不均衡',
      text:'你的三個維度之間差距超過40分。最短的那塊木板決定了你能盛多少水。建議優先補強最弱的維度，而非繼續強化已強的維度。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        return answerMap.B4.questionIdx===0;
      },
      icon:'💸', color:'#ef4444',
      title:'負債狀態：優先止血，再談積累',
      text:'你目前處於淨負債狀態。必須在積累之前先解決這個問題。行動清單：① 列出所有負債，按利率高低排序；② 優先償還高息消費貸和信用卡；③ 不新增非必要負債；④ 負債縮減至可控範圍後，立即建立1個月應急儲備。負債本身不是問題——沒有計劃才是。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=1&&oi<=2;
      },
      icon:'🌱', color:'#ef4444',
      title:'淨資產幾乎為零：從第一步開始',
      text:'淨資產接近於零，但這正是積累的起點。在這個階段，習慣比金額更重要。關鍵行動：① 建立「先存後花」反射——每次收入到賬立即轉走10%；② 消除所有非必要的循環支出；③ 把精力放在提升收入上——收入彈性遠大於支出壓縮空間。第一個1萬元是最難的。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=3&&oi<=4; /* 1000-1萬元：極早期 */
      },
      icon:'🌿', color:'#f59e0b',
      title:'小額淨資產：建立財務肌肉記憶',
      text:'你有了第一批淨資產，但還非常脆弱——一次意外支出就可能歸零。這個階段的核心任務是建立財務系統的韌性。建議：① 把現有積蓄放入貨幣基金或活期理財（穩定、可隨時取用）；② 建立記帳習慣，了解錢去哪裡；③ 開始學習最基礎的個人財務知識（預算、複利）。現在每多存1元，未來的複利效果都是數倍的。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=5&&oi<=6; /* 1萬-10萬元：起步期 */
      },
      icon:'💡', color:'#f59e0b',
      title:'初步積累：從儲蓄者到理財者的轉變',
      text:'擁有1萬至10萬淨資產，你已經完成了從「零」到「有」的第一步。這個階段的關鍵轉變是：從被動儲蓄變為主動理財。建議：① 建立3-6個月應急儲備（貨幣基金）；② 在應急儲備之外開始定投寬基指數基金（每月固定金額）；③ 了解自己的消費結構，設定儲蓄率目標（20%以上為佳）。時間複利的窗口正在打開。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=7&&oi<=9;
      },
      icon:'📊', color:'#7dd3fc',
      title:'10萬至100萬：進入資產配置意識階段',
      text:'10萬至100萬淨資產，你已越過大多數同齡人「月光」的階段，開始有了真正的財務緩衝。思維升級：① 應急儲備到位後，餘量資金可承擔更高風險；② 開始學習股票型基金和ETF的基本邏輯；③ 評估是否需要購買意外險和醫療險；④ 如有購房計劃，研究首付能力與月供壓力。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=10&&oi<=11;
      },
      icon:'🏗️', color:'#10b981',
      title:'百萬至千萬：從儲蓄型轉向資產配置型',
      text:'淨資產100萬至1000萬，財富積累的飛輪開始轉動。核心不再是「多存錢」，而是「讓錢更有效地工作」：① 建立正式的資產配置框架；② 房產佔比過高的話，考慮增加流動資產；③ 購買足額壽險/重疾險；④ 學習稅務籌劃基礎知識，合法降低稅負。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===12;
      },
      icon:'🏛️', color:'#6366f1',
      title:'千萬至億級：高淨值財富的護城河建設',
      text:'淨資產1000萬至1億，財富最大的威脅不是賺不夠，而是「失去」：稅務風險、法律糾紛、健康意外。建議：① 建立正式的家族財富保護架構；② 持有充足的流動資產（不低於20%）；③ 聘請專業私人財富顧問；④ 開始規劃財富的代際傳承。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        return answerMap.B4.questionIdx>=13;
      },
      icon:'🌍', color:'#0284c7',
      title:'億級資產：財富的使命與邊界',
      text:'淨資產超過1億，財富管理的核心命題變了——不再是「如何積累更多」，而是「如何讓財富持續產生意義」。健康、關係和精神資本是任何財富都無法買回的東西——投入精力保護它們。思考你的財富能為社會解決什麼問題。',
    },
  ],
};

function buildInsights(lang){
  var c=document.getElementById('insightRows'); if(!c) return; c.innerHTML='';
  var pool=INSIGHTS[lang]||INSIGHTS['zh-CN'];
  var shown=0;
  pool.forEach(function(ins){
    if(!ins.test()) return;
    var card=document.createElement('div'); card.className='insight-card';
    card.style.borderLeft='4px solid '+ins.color;
    card.innerHTML='<div class="ic-header"><span class="ic-icon">'+ins.icon+'</span><span class="ic-title" style="color:'+ins.color+'">'+ins.title+'</span></div>'+
      '<div class="ic-text">'+ins.text+'</div>';
    c.appendChild(card);
    shown++;
  });
  if(!shown){
    var def=document.createElement('div'); def.className='insight-card';
    def.style.borderLeft='4px solid #94a3b8';
    def.innerHTML='<div class="ic-header"><span class="ic-icon">📊</span><span class="ic-title">'+( lang==='zh-TW'?'整體表現均衡':'整体表现均衡')+'</span></div>'+
      '<div class="ic-text">'+(lang==='zh-TW'?'你的各維度發展較為均衡，沒有觸發特定的模式洞察。繼續保持這種均衡，並選擇最感興趣的維度深耕。':'你的各维度发展较为均衡，没有触发特定的模式洞察。继续保持这种均衡，并选择最感兴趣的维度深耕。')+'</div>';
    c.appendChild(def);
  }
}

/* ── Payment modal (same config as result.js) ── */
var PAYMENT_CONFIG_AN = {
  wechat:  { name_cn:'微信支付', name_tw:'微信支付', color:'#07c160', fallback:'💚', logoSrc:'assets/logo-wechat.png', qrSrc:'assets/qr-wechat.png' },
  alipay:  { name_cn:'支付宝',   name_tw:'支付寶',   color:'#1677ff', fallback:'💙', logoSrc:'assets/logo-alipay.png', qrSrc:'assets/qr-alipay.png' },
  crypto:  { name_cn:'加密支付', name_tw:'加密支付', color:'#f0b90b', fallback:'🟡', logoSrc:'assets/logo-crypto.png', qrSrc:'assets/qr-crypto.png' },
  qq:      { name_cn:'QQ 钱包',  name_tw:'QQ 錢包',  color:'#12b7f5', fallback:'💜', logoSrc:'assets/logo-qq.png',    qrSrc:'assets/qr-qq.png' },
};

function setupPaymentModal(){
  var overlay    = document.getElementById('paymentModalOverlay');
  var closeBtn   = document.getElementById('paymentModalClose');
  var pmLogoImg  = document.getElementById('pmLogoImg');
  var pmLogoFb   = document.getElementById('pmLogoFallback');
  var pmName     = document.getElementById('pmPlatformName');
  var pmQrImg    = document.getElementById('pmQrImg');
  var pmQrPh     = document.getElementById('pmQrPlaceholder');
  var pmQrPhPath = document.getElementById('pmQrPlaceholderPath');
  if(!overlay) return;

  function openPayment(platform){
    var cfg = PAYMENT_CONFIG_AN[platform]; if(!cfg) return;
    var lang = window.I18N_CURRENT||'zh-CN';
    if(pmLogoImg){ pmLogoImg.src=cfg.logoSrc; pmLogoImg.style.display=''; }
    if(pmLogoFb){ pmLogoFb.textContent=cfg.fallback; pmLogoFb.style.background=cfg.color; pmLogoFb.style.display='none'; }
    if(pmName) pmName.textContent = lang==='zh-TW'?cfg.name_tw:cfg.name_cn;
    if(pmQrImg){ pmQrImg.src=cfg.qrSrc; pmQrImg.style.display=''; }
    if(pmQrPh) pmQrPh.style.display='none';
    if(pmQrPhPath) pmQrPhPath.textContent=cfg.qrSrc;
    overlay.classList.add('open'); document.body.style.overflow='hidden';
  }
  function closePayment(){ overlay.classList.remove('open'); document.body.style.overflow=''; }

  if(closeBtn) closeBtn.addEventListener('click', closePayment);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) closePayment(); });
  document.querySelectorAll('.sponsor-logo-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ openPayment(btn.dataset.payment); });
  });
}
function setupFilters(lang){
  document.querySelectorAll('.qbf-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      document.querySelectorAll('.qbf-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeFilter=btn.dataset.filter;
      buildQBreakdown(lang);
    });
  });
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
  for(var i=0;i<10;i++){
    var p=document.createElement('div'); p.className='particle';
    var s=Math.random()*7+3;
    p.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;--dur:'+(Math.random()*14+8)+'s;--delay:'+(Math.random()*12)+'s;--op:'+(Math.random()*.1+.03).toFixed(2)+';';
    pc.appendChild(p);
  }
}

function patchI18n(){
  var orig=window.applyI18n;
  window.applyI18n=function(lang){ orig(lang); if(finalScore!=null) renderAll(); };
}

function renderAll(){
  var lang=window.I18N_CURRENT||'zh-CN';
  var canvas=document.getElementById('radarCanvas');
  if(canvas&&dimPct) drawRadar(canvas,[dimPct.basic||0,dimPct.social||0,dimPct.identity||0]);

  buildDimDeep(lang);
  buildQBreakdown(lang);
  buildInsights(lang);

  var vEl=document.getElementById('anVerdictText');
  if(vEl){ var v=getVerdict(finalScore); vEl.textContent=window.t('result.'+v); }
}

function init(){
  var data=loadResult();
  var wrap=document.getElementById('analysisWrap');
  var noRes=document.getElementById('noResultState');

  // Always start at the very top
  window.scrollTo(0, 0);

  if(!data){
    if(wrap) wrap.style.display='none';
    if(noRes) noRes.style.display='flex';
    setupLangSwitcher(); setupMobileNav(); setupParticles();
    window.applyI18n();
    return;
  }

  finalScore=data.finalScore; dimPct=data.dimPct; answerMap=data.answerMap||{};
  activeQueue=data.activeQueue||[];
  quizMode=data.quizMode||'deep';

  /* Set retake link to match the quiz mode the user originally took */
  var retakeLink=document.getElementById('anRetakeLink');
  if(retakeLink){
    retakeLink.href = data.quizMode==='deep' ? 'quiz.html' : 'quiz-quick.html';
  }

  // Fill hero
  var sn=document.getElementById('anScoreNum'); if(sn) sn.textContent=finalScore;
  var dateEl=document.getElementById('anDate');
  var stored=null; try{stored=localStorage.getItem('ls_last_date');}catch(e){}
  if(dateEl) dateEl.textContent=(window.I18N_CURRENT==='zh-TW'?'測試日期：':'测试日期：')+(stored||new Date().toLocaleDateString());

  patchI18n(); setupLangSwitcher(); setupMobileNav(); setupParticles(); setupPaymentModal();
  setupFilters(window.I18N_CURRENT||'zh-CN');
  window.applyI18n();
  renderAll();

  document.body.style.opacity='0'; document.body.style.transition='opacity .5s ease';
  requestAnimationFrame(function(){ document.body.style.opacity='1'; });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
})();
