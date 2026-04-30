/* analysis.js — deep analysis page with radar chart + per-question breakdown */
(function(){
'use strict';
var finalScore, finalScorePrecise, dimPct, answerMap, activeQueue, quizMode;

/* Format a float score to 3 decimal places, stripping trailing
   zeros so "60.000" displays as "60" and "60.500" as "60.5". */
function formatScorePrecise(v){
  if (typeof v !== 'number' || !isFinite(v)) return '0';
  return v.toFixed(3).replace(/\.?0+$/, '');
}
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
  try{ var d1=localStorage.getItem('ls_result_latest'); if(d1) return JSON.parse(d1); }catch(e){}
  try{ var d2=localStorage.getItem('ls_result_deep'); if(d2) return JSON.parse(d2); }catch(e){}
  try{ var d3=localStorage.getItem('ls_result_quick'); if(d3) return JSON.parse(d3); }catch(e){}
  return null; // will show no-result state
}

function getVerdict(s){if(s>110)return'exceptional';if(s>=90)return'excellent';if(s>=70)return'high';if(s>=50)return'mid';if(s>=35)return'mid-low';return'low';}
function getRank(s){if(s>110)return Math.max(1,Math.round(3-(s-110)*0.05));var t=(s-50)/20,sig=1/(1+Math.exp(-t));return Math.round(sig*92+4);}

/* ── Radar chart (brutalist B&W — thick black lines, transparent fill) ── */
function drawRadar(canvas, scores, colors){
  var dpr=window.devicePixelRatio||1;
  var rect=canvas.getBoundingClientRect();
  var cssW=Math.floor(rect.width||canvas.width);
  var cssH=Math.floor(rect.height||canvas.height);
  if(canvas.width!==cssW*dpr||canvas.height!==cssH*dpr){
    canvas.width=cssW*dpr; canvas.height=cssH*dpr;
  }
  var ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,cssW*dpr,cssH*dpr);
  ctx.save(); ctx.scale(dpr,dpr);
  var W=cssW, H=cssH, cx=W/2, cy=H/2;
  var R=Math.min(W,H)*0.30;
  var labels=['基础信息','社会生活方向','个人认同'], n=labels.length;
  var lang=window.I18N_CURRENT||'zh-CN';
  if(lang==='zh-TW') labels=['基礎資訊','社會生活方向','個人認同'];

  // Grid rings — thin black hairlines
  for(var ring=1;ring<=5;ring++){
    var r=R*ring/5;
    ctx.beginPath();
    for(var i=0;i<n;i++){
      var angle=Math.PI*2*i/n-Math.PI/2;
      var x=cx+r*Math.cos(angle), y=cy+r*Math.sin(angle);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle = ring === 5 ? '#000000' : 'rgba(0,0,0,0.18)';
    ctx.lineWidth = ring === 5 ? 2 : 1;
    ctx.stroke();
  }

  // Axes — thin black lines from center to outer ring
  for(var i=0;i<n;i++){
    var angle=Math.PI*2*i/n-Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+R*Math.cos(angle),cy+R*Math.sin(angle));
    ctx.strokeStyle='rgba(0,0,0,0.30)'; ctx.lineWidth=1; ctx.stroke();
  }

  // Data polygon — TRANSPARENT fill, THICK BLACK stroke
  ctx.beginPath();
  for(var i=0;i<n;i++){
    var angle=Math.PI*2*i/n-Math.PI/2;
    var v=Math.max(0.05,Math.min(100,scores[i]||0))/100;
    var x=cx+R*v*Math.cos(angle), y=cy+R*v*Math.sin(angle);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fillStyle='transparent'; ctx.fill();
  ctx.strokeStyle='#000000'; ctx.lineWidth=4; ctx.lineJoin='miter'; ctx.stroke();

  // Data dots — solid black SQUARES (not circles)
  for(var i=0;i<n;i++){
    var angle=Math.PI*2*i/n-Math.PI/2;
    var v=Math.max(0.05,Math.min(100,scores[i]||0))/100;
    var x=cx+R*v*Math.cos(angle), y=cy+R*v*Math.sin(angle);
    ctx.fillStyle='#000000';
    ctx.fillRect(x-5, y-5, 10, 10);
    ctx.strokeStyle='#FFFFFF'; ctx.lineWidth=1.5;
    ctx.strokeRect(x-5, y-5, 10, 10);
  }

  // Labels — monospace, all black, uppercase context
  var LABEL_DIST = R + 26;
  ctx.font='700 11px "Space Mono", monospace';
  ctx.fillStyle='#000000';
  ctx.textBaseline='middle';
  for(var i=0;i<n;i++){
    var angle=Math.PI*2*i/n-Math.PI/2;
    var lx=cx+LABEL_DIST*Math.cos(angle);
    var ly=cy+LABEL_DIST*Math.sin(angle);
    ctx.textAlign='center';
    var scoreVal=Math.round(scores[i]||0);
    ctx.font='700 11px "Space Mono", monospace';
    ctx.fillStyle='#000000';
    ctx.fillText(labels[i], lx, ly-9);
    ctx.font='900 14px "Archivo Black", "Noto Sans SC", sans-serif';
    ctx.fillText(scoreVal, lx, ly+9);
  }
  ctx.textBaseline='alphabetic';

  // Center score — display font on transparent (the surrounding inverted box handles bg)
  ctx.textAlign='center';
  ctx.font='900 22px "Archivo Black", "Noto Sans SC", sans-serif';
  ctx.fillStyle='#000000';
  ctx.fillText(formatScorePrecise(finalScorePrecise),cx,cy+4);
  ctx.font='700 10px "Space Mono", monospace';
  ctx.fillStyle='#000000';
  ctx.fillText('/ 150',cx,cy+20);
  ctx.restore();
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
          '<span class="ddc-score" style="color:'+d.color+'">'+score+'<small> / 100</small></span>'+
        '</div>'+
        '<div class="ddc-bar-wrap"><div class="ddc-bar-track"><div class="ddc-bar-fill" data-pct="'+pct+'" style="width:0;background:'+d.color+'"></div></div></div>'+
      '</div>'+
      '<div class="ddc-body">'+text+'</div>'+
    '';
    c.appendChild(card);
  });
  setTimeout(function(){
    document.querySelectorAll('.ddc-bar-fill').forEach(function(f){ f.style.width=f.dataset.pct+'%'; });
  },400);
}

/* The scoring function explainer previously rendered here has been
   moved to database.html. The analysis page now shows personalized
   results only. See window.LSScoringRegistry and database.html. */


/* ── Insights ── */
var INSIGHTS={
  'zh-CN':[
    {
      test:function(){ return dimPct&&dimPct.basic>70&&dimPct.social<50; },
      icon:'⚠️', color:'#f59e0b',
      title:'潜力未被充分释放',
      text:'说实话，你的底子比大多数人都好——健康、教育、成长环境，这些牌都不差。但奇怪的是，你在职业发展和社会影响力上，还没把这些好牌打出去。这不是能力问题，更像是一个转化率的问题：你拥有的资源远超你正在使用的。也许你需要的不是更多的准备，而是一次认真的行动——重新审视你的职业选择和人际圈子，问自己一个尖锐的问题：如果我的起点比大多数人好，为什么我的现状没有体现出来？',
    },
    {
      test:function(){ return dimPct&&dimPct.identity>75&&dimPct.social<55; },
      icon:'💭', color:'#0ea5e9',
      title:'思考者，但行动不足',
      text:'你是那种想得很深、看得很透的人——价值观清晰，对人生有自己的理解。但问题是，你脑子里的蓝图和现实生活之间，隔着一堵叫做执行的墙。你可能已经在心里规划了无数次完美的人生路径，却迟迟没有迈出第一步。这不是因为你懒，而是因为你对不够完美的行动有一种本能的抗拒。但真相是：一个60分的行动，永远比一个100分的计划更有价值。试着每周拿出半小时，只做一件你早就知道该做的事——不追求完美，只追求完成。',
    },
    {
      test:function(){ return dimPct&&dimPct.social>70&&dimPct.identity<50; },
      icon:'🏃', color:'#ef4444',
      title:'外部成功，内在空洞',
      text:'从外面看，你过得不错——收入、职位、社会关系都拿得出手。但你自己心里清楚，这些成就并没有带来你想象中的满足感。你甚至可能在某些深夜问过自己：我这么努力到底是为了什么？这不是矫情，这是一个信号——你的外在成就已经跑得太快，内心的意义感没跟上。很多事业有成的人会在四十岁前后突然遭遇一场意义危机，所有的头衔和数字突然变得空洞。不要等到那一天。每个季度给自己一天安静的时间，不带手机，认真想想：如果明天不需要赚钱了，我想过什么样的生活？',
    },
    {
      test:function(){ return finalScore>90; },
      icon:'🌟', color:'#10b981',
      title:'高均衡者',
      text:'能在健康、社会发展和内在认同三个方向同时保持高水平，这真的很少见——你不是某一项突出，而是全面地活得很好。但恰恰因为太稳了，你现在面临的最大敌人反而是舒适区。当一切都不错的时候，人很容易失去继续突破的动力，开始进入维持模式。而真正的卓越者和普通优秀者的分水岭，恰恰就在这里。你现在应该做的，不是继续优化自己，而是开始思考一个更大的问题：你能帮助谁？把你走过的路变成一套可以传递的方法论——这既是对他人的贡献，也是你自己持续成长的最好方式。',
    },
    {
      test:function(){ return finalScore<35; },
      icon:'🌱', color:'#7dd3fc',
      title:'起步者，潜力巨大',
      text:'分数不高，我知道看到这个数字可能会有点沮丧。但我想告诉你一个很多人不知道的事实：起点低，反而是一种隐藏的优势。因为你每做出一点改变，进步的感受都会特别强烈和真实——而这种看得见的进步，恰恰是驱动人持续行动的最强燃料。那些起点高的人往往因为进步微小而失去动力，但你不会。你现在需要做的只有一件事：停止和别人比较，只和昨天的自己比较。今晚早睡30分钟，明天多走2000步，这周主动联系一个重要的人——每一个微小的行动，都会在你的人生里产生你现在还无法想象的复利效应。',
    },
    {
      test:function(){ var d=dimPct; if(!d) return false; var v=[d.basic,d.social,d.identity]; var max=Math.max.apply(null,v),min=Math.min.apply(null,v); return max-min>40; },
      icon:'⚖️', color:'#f59e0b',
      title:'发展极度不均衡',
      text:'你的三个维度之间拉开了一条很大的裂缝——某些方面你做得相当出色，但另一些方面明显拖了后腿。这种极度不均衡短期内可能感觉不到问题，但长期来看它会变成一个隐形天花板：你最强的那项能力能把你带到的高度，最终会被你最弱的那项能力封死。就像一个体能极好但情绪管理很差的运动员，他的天赋最终会被他的脾气毁掉。现在最值得投入精力的，不是继续强化你本来就强的方向，而是把最弱的那个维度拉到及格线以上。补短板的回报率，在你目前这个阶段，远远高于拉长板。',
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
      text:'负债这件事，很多人不好意思承认，但它其实比你想象的常见得多。问题不在于你现在欠着钱——问题在于你有没有一个明确的止血计划。如果没有计划，负债就像一个伤口在持续流血，不管你赚多少都填不满。现在要做的很简单但必须立刻开始：把所有欠的钱列出来，按利率从高到低排队——信用卡和消费贷排在最前面，房贷排在最后。集中火力先干掉利率最高的那笔，同时从今天起不新增任何非必要的借贷。负债不可怕，没有还债路线图才可怕。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=1&&oi<=2; /* 0-1000元：几乎为零 */
      },
      icon:'🌱', color:'#ef4444',
      title:'净资产几乎为零：从第一步开始',
      text:'账户里几乎没有余额——这个现实可能让你焦虑，但换个角度看，你正站在一个干净的起跑线上。在这个阶段，存多少钱不重要，重要的是你能不能养成先存后花的反射：每次钱进来，第一件事不是花，而是先转走一小部分放到一个你不会轻易碰的地方——哪怕只有50块钱。这个习惯一旦建立，你的财务轨迹就会开始悄悄改变。同时别忘了：在这个阶段你最大的杠杆不是省钱，而是赚钱。收入的上升空间远远大于支出的压缩空间。把精力花在怎么让自己更值钱上面，比纠结要不要少点一杯奶茶有用一百倍。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=3&&oi<=4; /* 1000-1万元：极早期 */
      },
      icon:'🌿', color:'#f59e0b',
      title:'小额净资产：建立财务肌肉记忆',
      text:'你已经有了第一笔积蓄，虽然金额不大，但这意味着你已经迨过了从零到有的那道坎——很多人卡在这一步卡了好几年。现在最需要做的事情是保护好这笔钱：把它放到随时能取但不会随手花掉的地方，比如货币基金。然后开始做一件听起来无聊但极其有用的事——记账。不是记每一笔，而是每个月结束时花十分钟看一眼：我的钱到底去哪了？当你开始清楚地看见自己的消费结构，很多不必要的支出会自然消失。记住，你现在存下的每一块钱，在未来二十年的复利作用下，价值是今天的好几倍。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=5&&oi<=6; /* 1万-10万元：起步期 */
      },
      icon:'💡', color:'#f59e0b',
      title:'初步积累：从储蓄者到理财者的转变',
      text:'手里有了1万到10万的积蓄——恭喜你，你已经完成了理财旅程中最难的一步：从零开始。现在你面临的是一个心态上的转变：从存钱升级到让钱替你工作。第一件事是确保你有一笔3到6个月生活费的应急储备，放在随时能取的地方，这是你的安全垫。在安全垫之外的钱，可以开始每月固定投一点宽基指数基金——不需要懂股票，不需要看行情，只需要设定好自动扣款然后忘掉它。时间复利的窗口正在为你打开，而你越早开始，这扇窗口给你的回报就越大。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=7&&oi<=8; /* 10万-50万：成长期 */
      },
      icon:'📊', color:'#7dd3fc',
      title:'10-50万净资产：进入资产配置意识阶段',
      text:'10万到50万——你已经甩开了身边大多数月光族，拥有了一笔真正意义上的财务缓冲。这个阶段你要做的事情不再是多存钱这么简单了，而是要开始认真想一个问题：我这笔钱除了躺在那里，还能怎么更聪明地为我工作？应急储备已经到位的话，多出来的钱可以开始学着做资产配置了——了解一下股票型基金和ETF是怎么回事，不需要变成投资专家，只需要明白基本的逻辑。同时有两件事值得现在就做：考虑给自己买一份意外险和医疗险来保护已有的积累，以及如果你有购房打算，是时候认真研究目标城市的房价和你的首付能力了。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===9; /* 50万-100万 */
      },
      icon:'🏠', color:'#7dd3fc',
      title:'50-100万净资产：接近首套房门槛的关键区',
      text:'50万到100万——你正站在一个很多人梦寐以求的位置上。在不少城市，这个数字已经够得上首套房的首付了。但也正因如此，你现在面临的决策变得前所未有的复杂：买房还是继续投资？这个问题没有标准答案，但有几个思考框架可以帮你：如果买房是刚需，先算清楚月供占收入的比例——超过40%的话你的生活质量会被严重压缩。如果不急着买房，这个量级的资金已经可以做真正意义上的多元配置了。同时别忘了一件容易被忽略的事：给自己买一份定期寿险和重疾险——你花了好几年才积累到这个数字，不要让一次意外就把它清零。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===10; /* 100万-500万 */
      },
      icon:'🏗️', color:'#10b981',
      title:'百万净资产：从储蓄型转向资产配置型',
      text:'突破了一百万——这不仅是一个数字，更是一个心理门槛。你已经从攒钱的阶段进入了管钱的阶段，财富积累的飞轮开始有了自己的转速。但这个阶段也是最容易犯错的时候，因为你的资产规模已经大到一个错误决策可能让你倒退好几年。现在你需要认真考虑几件事：你的钱是不是太集中在房产上了？如果房产占比超过70%，你的资产其实是高度不流动的——遇到急需用钱的情况会非常被动。同时这个量级的资产已经值得你开始了解税务筹划的基础知识。还有一件容易被忽视的事：确保你的保险额度跟上了你的资产规模——100万的积蓄如果被一场大病清零，那才是真正的灾难。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===11; /* 500万-1000万 */
      },
      icon:'📈', color:'#10b981',
      title:'千万门槛：财富管理逻辑的根本转变',
      text:'接近千万净资产，你的财富已经进入了一个完全不同的游戏——这个量级的钱，靠赚得多花得少已经不够了，你需要的是系统性的保值增值策略。这意味着你得认真审视你的整个资产结构：房产、股权、现金、固收各占多少比例？这个比例是你主动设计的，还是自然堆积形成的？如果是后者，现在是时候坐下来重新规划了。另外你需要开始思考一个问题：个人持有和公司架构之间的税负差异，可能每年给你省下一笔不小的钱。如果你还没有一位专业的财富管理顾问，现在是寻找的好时机——注意，是真正的独立顾问，而不是银行的理财经理。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===12; /* 1000万-1亿 */
      },
      icon:'🏛️', color:'#6366f1',
      title:'千万至亿级：高净值财富的护城河建设',
      text:'千万到亿级——你已经站在了大多数人一辈子都到不了的位置上。但在这个层级，财富游戏的规则发生了根本性的改变：你最大的敌人不再是赚得不够多，而是失去。一场突如其来的税务稽查、一次法律纠纷、一个家庭变故——任何一件都可能让你的财富一夜之间缩水几成。所以你现在最重要的事不是让钱变得更多，而是给它修一道足够高的护城河：考虑设立正式的家族信托或控股公司来保护资产；确保你的流动资产不低于总净资产的20%——很多富人破产不是因为穷，而是因为有钱但拿不出来；开始认真规划财富的代际传承。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=13; /* 1亿+ */
      },
      icon:'🌍', color:'#0284c7',
      title:'亿级资产：财富的使命与边界',
      text:'净资产过亿——在这个位置上，关于怎么赚更多钱的建议对你已经毫无意义了。你面对的是一个完全不同的命题：你的财富能为这个世界做什么？这不是道德说教，而是一个真实的战略问题——当个人努力的边际贡献越来越小的时候，你的影响力必须通过系统、团队和品牌来放大，否则你最终会被自己的财富困住而不是被它解放。同时有一件事你比任何人都清楚但可能一直在回避：健康、亲密关系和内心的平静，是任何数字都买不回来的东西。你见过太多身家过亿却活得并不幸福的人。不要让自己成为其中之一。',
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
      text:'你在事业和社会发展上做得不错，但你的身体正在替你的成就买单——健康指标和睡眠质量都亮了红灯。我见过太多这样的故事：一个人花了十年拼命往上爬，结果在三十八九岁的某一天身体突然发出一声巨响——可能是一次体检报告上的异常数字，可能是一次凌晨的急诊。然后所有积累的东西都被按下了暂停键。你现在可能觉得自己还抗得住，但抗得住和健康之间的距离比你想象的近得多。今晚开始，把睡奇7小时当成和完成KPI一样不可协商的底线。你的身体不是消耗品，它是你所有成就的硬件基础——一旦硬件崩溃，上面运行的所有软件都会跟着停摆。',
    },
    /* 社交与认同组合洞察 */
    {
      test:function(){
        return dimPct&&dimPct.identity>70&&dimPct.basic>65&&dimPct.social<50&&finalScore<60;
      },
      icon:'🔮', color:'#0ea5e9',
      title:'内外倒置的成长轨迹',
      text:'你是一个有想法、有认知深度的人，基础条件也不差——按理说，你应该在社会发展上走得更远。但现实是，你的职业成就和收入水平远远没有匹配上你的内在潜力。这里面藏着一个值得深挖的问题：你是真的选择了一条忠于内心的路，还是在用我追求的不是世俗成功来回避那些让你不舒服的竞争和挑战？这两者表面上看起来一模一样，但底层动机完全不同。诚实地问自己这个问题，答案可能会让你不太舒服——但那个不舒服的地方，恰恰就是你下一个突破口。',
    },
  ],
  'zh-TW':[
    {
      test:function(){ return dimPct&&dimPct.basic>70&&dimPct.social<50; },
      icon:'⚠️', color:'#f59e0b',
      title:'潛力未被充分釋放',
      text:'說實話，你的底子比大多數人都好——健康、教育、成長環境，這些牌都不差。但奇怪的是，你在職業發展和社會影響力上，還沒把這些好牌打出去。這不是能力問題，更像是一個轉化率的問題：你擁有的資源遠超你正在使用的。也許你需要的不是更多的準備，而是一次認真的行動——重新審視你的職業選擇和人際圈子，問自己一個尖銳的問題：如果我的起點比大多數人好，為什麼我的現狀沒有體現出來？',
    },
    {
      test:function(){ return dimPct&&dimPct.identity>75&&dimPct.social<55; },
      icon:'💭', color:'#0ea5e9',
      title:'思考者，但行動不足',
      text:'你是那種想得很深、看得很透的人——價值觀清晰，對人生有自己的理解。但問題是，你腦子裡的藍圖和現實生活之間，隔著一堵叫做執行的牆。你可能已經在心裡規劃了無數次完美的人生路徑，却遲遲沒有邁出第一步。這不是因為你懶，而是因為你對不夠完美的行動有一種本能的抗拒。但真相是：一個60分的行動，永遠比一個100分的計畫更有價值。試著每週拿出半小時，只做一件你早就知道該做的事——不追求完美，只追求完成。',
    },
    {
      test:function(){ return dimPct&&dimPct.social>70&&dimPct.identity<50; },
      icon:'🏃', color:'#ef4444',
      title:'外部成功，內在空洞',
      text:'從外面看，你過得不錯——收入、職位、社會關係都拿得出手。但你自己心裡清楚，這些成就並沒有帶來你想像中的滿足感。你甚至可能在某些深夜問過自己：我這麼努力到底是為了什麼？這不是矯情，這是一個信號——你的外在成就已經跑得太快，內心的意義感沒跟上。不要等到四十歲前後的意義危機才開始面對。每個季度給自己一天安靜的時間，認真想想：如果明天不需要賺錢了，我想過什麼樣的生活？',
    },
    {
      test:function(){ return finalScore>90; },
      icon:'🌟', color:'#10b981',
      title:'高均衡者',
      text:'能在三個維度同時保持高水準，這真的很少見——你不是某一項突出，而是全面地活得很好。但恰恰因為太穩了，你現在面臨的最大敵人反而是舒適區。當一切都不錯的時候，人很容易失去繼續突破的動力。你現在應該做的，不是繼續優化自己，而是開始思考一個更大的問題：你能幫助誰？把你走過的路變成一套可以傳遞的方法論——這既是對他人的貢獻，也是你自己持續成長的最好方式。',
    },
    {
      test:function(){ return finalScore<35; },
      icon:'🌱', color:'#7dd3fc',
      title:'起步者，潛力巨大',
      text:'分數不高，我知道看到這個數字可能會有點氮喪。但我想告訴你一個很多人不知道的事實：起點低，反而是一種隱藏的優勢。因為你每做出一點改變，進步的感受都會特別強烈和真實——而這種看得見的進步，恰恰是驅動人持續行動的最強燃料。你現在需要做的只有一件事：停止和別人比較，只和昨天的自己比較。今晚早睡30分鐘，明天多走2000步，這週主動聯繫一個重要的人——每一個微小的行動，都會在你的人生裡產生你現在還無法想像的複利效應。',
    },
    {
      test:function(){ var d=dimPct; if(!d) return false; var v=[d.basic,d.social,d.identity]; var max=Math.max.apply(null,v),min=Math.min.apply(null,v); return max-min>40; },
      icon:'⚖️', color:'#f59e0b',
      title:'發展極度不均衡',
      text:'你的三個維度之間拉開了一條很大的裂縫——某些方面你做得相當出色，但另一些方面明顯拖了後腿。這種極度不均衡短期內可能感覺不到問題，但長期來看它會變成一個隱形天花板：你最強的那項能力能把你帶到的高度，最終會被你最弱的那項能力封死。現在最值得投入精力的，不是繼續強化你本來就強的方向，而是把最弱的那個維度拉到及格線以上。補短板的回報率，在你目前這個階段，遠遠高於拉長板。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        return answerMap.B4.questionIdx===0;
      },
      icon:'💸', color:'#ef4444',
      title:'負債狀態：優先止血，再談積累',
      text:'負債這件事，很多人不好意思承認，但它其實比你想像的常見得多。問題不在於你現在欠著錢——問題在於你有沒有一個明確的止血計畫。如果沒有計畫，負債就像一個傷口在持續流血。現在要做的很簡單但必須立刻開始：把所有欠的錢列出來，按利率從高到低排隊——信用卡和消費貸排在最前面，房貸排在最後。集中火力先幹掉利率最高的那筆，同時從今天起不新增任何非必要的借貸。負債不可怕，沒有還債路線圖才可怕。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=1&&oi<=2;
      },
      icon:'🌱', color:'#ef4444',
      title:'淨資產幾乎為零：從第一步開始',
      text:'帳戶裡幾乎沒有餘額——這個現實可能讓你焦慮，但換個角度看，你正站在一個乾淨的起跑線上。在這個階段，存多少錢不重要，重要的是你能不能養成先存後花的反射：每次錢進來，第一件事不是花，而是先轉走一小部分放到一個你不會輕易碰的地方——哪怕只有50塊錢。這個習慣一旦建立，你的財務軌跡就會開始悄悄改變。同時別忘了：在這個階段你最大的槓桿不是省錢，而是賺錢。收入的上升空間遠遠大於支出的壓縮空間。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=3&&oi<=4; /* 1000-1萬元：極早期 */
      },
      icon:'🌿', color:'#f59e0b',
      title:'小額淨資產：建立財務肌肉記憶',
      text:'你已經有了第一筆積蓄，雖然金額不大，但這意味著你已經邁過了從零到有的那道坎——很多人卡在這一步卡了好幾年。現在最需要做的事情是保護好這筆錢：把它放到隨時能取但不會隨手花掉的地方，比如貨幣基金。然後開始做一件聽起來無聊但極其有用的事——記帳。不是記每一筆，而是每個月結束時花十分鐘看一眼：我的錢到底去哪了？當你開始清楚地看見自己的消費結構，很多不必要的支出會自然消失。記住，你現在存下的每一塊錢，在未來二十年的複利作用下，價值是今天的好幾倍。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=5&&oi<=6; /* 1萬-10萬元：起步期 */
      },
      icon:'💡', color:'#f59e0b',
      title:'初步積累：從儲蓄者到理財者的轉變',
      text:'手裡有了1萬到10萬的積蓄——恭喜你，你已經完成了理財旅程中最難的一步：從零開始。現在你面臨的是一個心態上的轉變：從存錢升級到讓錢替你工作。第一件事是確保你有一筆3到6個月生活費的應急儲備，放在隨時能取的地方。在安全墊之外的錢，可以開始每月固定投一點寬基指數基金——不需要懂股票，不需要看行情，只需要設定好自動扣款然後忘掉它。時間複利的窗口正在為你打開，而你越早開始，這扁窗口給你的回報就越大。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=7&&oi<=9;
      },
      icon:'📊', color:'#7dd3fc',
      title:'10萬至100萬：進入資產配置意識階段',
      text:'10萬到100萬——你已經甩開了身邊大多數月光族，擁有了一筆真正意義上的財務緩衝。這個階段你要做的事情不再是多存錢這麼簡單了，而是要開始認真想一個問題：我這筆錢除了躺在那裡，還能怎麼更聯明地為我工作？應急儲備已經到位的話，多出來的錢可以開始學著做資產配置——了解一下股票型基金和ETF是怎麼回事。同時有兩件事值得現在就做：考慮給自己買一份意外險和醫療險來保護已有的積累，以及如果你有購房打算，是時候認真研究目標城市的房價和你的首付能力了。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi>=10&&oi<=11;
      },
      icon:'🏗️', color:'#10b981',
      title:'百萬至千萬：從儲蓄型轉向資產配置型',
      text:'突破了一百萬——這不僅是一個數字，更是一個心理門檻。你已經從攒錢的階段進入了管錢的階段，財富積累的飛輪開始有了自己的轉速。但這個階段也是最容易犯錯的時候。現在你需要認真考慮：你的錢是不是太集中在房產上了？同時這個量級的資產已經值得你開始了解稅務籌劃的基礎知識。還有一件容易被忽視的事：確保你的保險額度跟上了你的資產規模——百萬積蓄如果被一場大病清零，那才是真正的災難。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        var oi=answerMap.B4.questionIdx;
        return oi===12;
      },
      icon:'🏛️', color:'#6366f1',
      title:'千萬至億級：高淨值財富的護城河建設',
      text:'千萬到億級——你已經站在了大多數人一輩子都到不了的位置上。但在這個層級，財富遊戲的規則發生了根本性的改變：你最大的敵人不再是賺得不夠多，而是失去。一場突如其來的稅務稽查、一次法律糾紛、一個家庭變故——任何一件都可能讓你的財富一夜之間縮水幾成。所以你現在最重要的事不是讓錢變得更多，而是給它修一道足夠高的護城河：考慮設立正式的家族信託或控股公司來保護資產；確保你的流動資產不低於總淨資產的20%；開始認真規劃財富的代際傳承。',
    },
    {
      test:function(){
        if(!answerMap||!answerMap.B4) return false;
        return answerMap.B4.questionIdx>=13;
      },
      icon:'🌍', color:'#0284c7',
      title:'億級資產：財富的使命與邊界',
      text:'淨資產過億——在這個位置上，關於怎麼賺更多錢的建議對你已經毫無意義了。你面對的是一個完全不同的命題：你的財富能為這個世界做什麼？這不是道德說教，而是一個真實的戰略問題——當個人努力的邊際貢獻越來越小的時候，你的影響力必須通過系統、團隊和品牌來放大。同時有一件事你比任何人都清楚但可能一直在迴避：健康、親密關係和內心的平靜，是任何數字都買不回來的東西。你見過太多身家過億卻活得並不幸福的人。不要讓自己成為其中之一。',
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
  document.querySelectorAll('#analysisSponsorCard .sponsor-logo-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ openPayment(btn.dataset.payment); });
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

  finalScore=data.finalScore;
  finalScorePrecise=(typeof data.finalScorePrecise==='number')?data.finalScorePrecise:data.finalScore;
  dimPct=data.dimPct; answerMap=data.answerMap||{};
  activeQueue=data.activeQueue||[];
  quizMode=data.quizMode||'deep';

  /* Set retake link to match the quiz mode the user originally took */
  var retakeLink=document.getElementById('anRetakeLink');
  if(retakeLink){
    retakeLink.href = data.quizMode==='deep' ? 'quiz.html' : 'quiz-quick.html';
  }

  // Fill hero
  var sn=document.getElementById('anScoreNum'); if(sn) sn.textContent=formatScorePrecise(finalScorePrecise);
  var dateEl=document.getElementById('anDate');
  var stored=null; try{stored=localStorage.getItem('ls_last_date');}catch(e){}
  if(dateEl) dateEl.textContent=(window.I18N_CURRENT==='zh-TW'?'測試日期：':'测试日期：')+(stored||new Date().toLocaleDateString());

  patchI18n(); setupLangSwitcher(); setupMobileNav(); setupParticles(); setupPaymentModal();
  window.applyI18n();
  renderAll();

  document.body.style.opacity='0'; document.body.style.transition='opacity .5s ease';
  requestAnimationFrame(function(){ document.body.style.opacity='1'; });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
})();
