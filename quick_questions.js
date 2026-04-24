/* ============================================================
   quick_questions.js — Quick Test v4

   Changelog v4:
   - Full structural rewrite per new question spec
   - Status options expanded: A(Studying) B(Employed) C(Entrepreneur)
     D(Unemployed) E(Retired) F(Seriously Ill) G(Post-Accident)
     H(Restricted Movement) I(Full-time Caregiver)
   - Academic sub-branch (AA): HS / College / Bachelor / Masters+
   - English (en) field added to all questions and options
   - Bonus questions fully replaced with SSR-level spec
   - QUICK_IMPROVE_ADVICE updated with en field

   Status index map (QK3):
     0 = Studying (A)      1 = Employed (B)       2 = Entrepreneur (C)
     3 = Unemployed (D)    4 = Retired (E)         5 = Seriously Ill (F)
     6 = Post-Accident (G) 7 = Restricted (H)      8 = Caregiver (I)

   Academic stage index (QKA_STAGE, shown if QK3===0):
     0 = High School & below   1 = College/Vocational
     2 = Bachelor's            3 = Master's & above

   Age index (QK1):
     0 = ≤18   1 = 18-25   2 = 26-35   3 = 36-45   4 = 46-55
     5 = 56-65  6 = 66-75  7 = 76-85   8 = 85-100  9 = 101+

   Note: "Retired" option should be hidden by quiz engine when QK1 ≤ 2.
   ============================================================ */
(function () {
  'use strict';

  window.QUICK_QUESTION_BANK = [

    /* ═══════════════════════════════════════════
       SECTION 1 — DEMOGRAPHICS & PHYSICAL
       ═══════════════════════════════════════════ */

    { /* QK1 — Age */
      id: 'QK1', section: 'basic', scorable: false, noImprove: true,
      cn: '你目前的年龄段是？',
      tw: '你目前的年齡段是？',
      note: {
        cn: '年龄用于个性化评估，不直接计分',
        tw: '年齡用於個性化評估，不直接計分',
      },
      options: [
        { cn: '18岁及以下',    tw: '18歲及以下',    score: 0 },
        { cn: '18 - 25岁',     tw: '18 - 25歲',     score: 0 },
        { cn: '26 - 35岁',     tw: '26 - 35歲',     score: 0 },
        { cn: '36 - 45岁',     tw: '36 - 45歲',     score: 0 },
        { cn: '46 - 55岁',     tw: '46 - 55歲',     score: 0 },
        { cn: '56 - 65岁',     tw: '56 - 65歲',     score: 0 },
        { cn: '66 - 75岁',     tw: '66 - 75歲',     score: 0 },
        { cn: '76 - 85岁',     tw: '76 - 85歲',     score: 0 },
        { cn: '85 - 100岁',    tw: '85 - 100歲',    score: 0 },
        { cn: '101岁及以上',   tw: '101歲及以上',   score: 0 },
      ],
    },

    { /* QK2 — Gender */
      id: 'QK2', section: 'basic', scorable: false, noImprove: true,
      cn: '你的性别是？',
      tw: '你的性別是？',
      note: {
        cn: '性别不计入评分，仅用于个性化题目',
        tw: '性別不計入評分，僅用於個性化題目',
      },
      options: [
        { cn: '男性', tw: '男性', score: 0 },
        { cn: '女性', tw: '女性', score: 0 },
      ],
    },

    { /* QK4m — Height Male */
      id: 'QK4m', section: 'basic', scorable: false, noImprove: true,
      showIf: function(s){ return s.QK2 === 0; },
      cn: '你的身高大概在哪个范围？（男性）',
      tw: '你的身高大概在哪個範圍？（男性）',
      note: {
        cn: '身高用于BMI评估，不直接计分',
        tw: '身高用於BMI評估，不直接計分',
      },
      options: [
        { cn: '165cm 以下',      tw: '165cm 以下',      score: 0 },
        { cn: '165 - 170cm',     tw: '165 - 170cm',     score: 0 },
        { cn: '170 - 175cm',     tw: '170 - 175cm',     score: 0 },
        { cn: '175 - 180cm',     tw: '175 - 180cm',     score: 0 },
        { cn: '180 - 185cm',     tw: '180 - 185cm',     score: 0 },
        { cn: '185cm 以上',      tw: '185cm 以上',      score: 0 },
      ],
    },

    { /* QK4f — Height Female */
      id: 'QK4f', section: 'basic', scorable: false, noImprove: true,
      showIf: function(s){ return s.QK2 === 1; },
      cn: '你的身高大概在哪个范围？（女性）',
      tw: '你的身高大概在哪個範圍？（女性）',
      note: {
        cn: '身高用于BMI评估，不直接计分',
        tw: '身高用於BMI評估，不直接計分',
      },
      options: [
        { cn: '155cm 以下',      tw: '155cm 以下',      score: 0 },
        { cn: '155 - 160cm',     tw: '155 - 160cm',     score: 0 },
        { cn: '160 - 165cm',     tw: '160 - 165cm',     score: 0 },
        { cn: '165 - 170cm',     tw: '165 - 170cm',     score: 0 },
        { cn: '170 - 175cm',     tw: '170 - 175cm',     score: 0 },
        { cn: '175cm 以上',      tw: '175cm 以上',      score: 0 },
      ],
    },

    { /* QK5m — Weight Male */
      id: 'QK5m', section: 'basic', scorable: false,
      showIf: function(s){ return s.QK2 === 0; },
      cn: '你目前的体重大概在哪个范围？（男性）',
      tw: '你目前的體重大概在哪個範圍？（男性）',
      note: {
        cn: '体重用于BMI评估，不直接计分',
        tw: '體重用於BMI評估，不直接計分',
      },
      options: [
        { cn: '55kg 以下',     tw: '55kg 以下',     score: 0 },
        { cn: '55 - 70kg',     tw: '55 - 70kg',     score: 0 },
        { cn: '70 - 85kg',     tw: '70 - 85kg',     score: 0 },
        { cn: '85 - 100kg',    tw: '85 - 100kg',    score: 0 },
        { cn: '100kg 以上',    tw: '100kg 以上',    score: 0 },
      ],
    },

    { /* QK5f — Weight Female */
      id: 'QK5f', section: 'basic', scorable: false,
      showIf: function(s){ return s.QK2 === 1; },
      cn: '你目前的体重大概在哪个范围？（女性）',
      tw: '你目前的體重大概在哪個範圍？（女性）',
      note: {
        cn: '体重用于BMI评估，不直接计分',
        tw: '體重用於BMI評估，不直接計分',
      },
      options: [
        { cn: '45kg 以下 — 偏瘦',        tw: '45kg 以下 — 偏瘦',        score: 0 },
        { cn: '45 - 55kg — 偏轻 / 正常', tw: '45 - 55kg — 偏輕 / 正常', score: 0 },
        { cn: '55 - 65kg — 正常 / 健康', tw: '55 - 65kg — 正常 / 健康', score: 0 },
        { cn: '65 - 80kg — 偏重',         tw: '65 - 80kg — 偏重',         score: 0 },
        { cn: '80kg 以上 — 超重',         tw: '80kg 以上 — 超重',         score: 0 },
      ],
    },

    /* ═══════════════════════════════════════════
       SECTION 2 — CURRENT STATUS (branching root)
       ═══════════════════════════════════════════ */

    { /* QK3 — Primary status */
      id: 'QK3', section: 'basic', scorable: false, noImprove: true,
      cn: '你目前的主要身份是？',
      tw: '你目前的主要身份是？',
      note: {
        cn: '此选项影响后续问题，不计入评分',
        tw: '此選項影響後續問題，不計入評分',
      },
      options: [
        /* 0 */ { cn: '在校学生',              tw: '在校學生',              score: 0 },
        /* 1 */ { cn: '在职（全职/兼职）',     tw: '在職（全職/兼職）',     score: 0 },
        /* 2 */ { cn: '创业者 / 企业主',       tw: '創業者 / 企業主',       score: 0 },
        /* 3 */ { cn: '待业中（暂时离职休整）', tw: '待業中（暫時離職休整）', score: 0 },
        /* 4 */ { cn: '求职中（积极寻找工作）', tw: '求職中（積極尋找工作）', score: 0 },
        /* 5 */ { cn: '退休',                  tw: '退休',                  score: 0 },
        /* 6 */ { cn: '重病中',                tw: '重病中',                score: 0 },
        /* 7 */ { cn: '重大事故后治疗中',      tw: '重大事故後治療中',      score: 0 },
        /* 8 */ { cn: '行动受限中',            tw: '行動受限中',            score: 0 },
        /* 9 */ { cn: '全职照护者',            tw: '全職照護者',            score: 0 },
      ],
      // Note for quiz engine: hide option index 5 (Retired) when QK1 <= 2
    },


    /* ═══════════════════════════════════════════
       SECTION 3A — STUDYING (A): ACADEMIC STAGE
       ═══════════════════════════════════════════ */

    { /* QKA_STAGE — Academic stage — NO SCORING */
      id: 'QKA_STAGE', section: 'basic', scorable: false, noImprove: true,
      showIf: function(s){ return s.QK3 === 0; },
      cn: '你目前就读的学业阶段是？',
      tw: '你目前就讀的學業階段是？',
      note: {
        cn: '学业阶段不计入评分，仅用于个性化题目',
        tw: '學業階段不計入評分，僅用於個性化題目',
      },
      options: [
        /* 0 */ { cn: '高中及以下',          tw: '高中及以下',          score: 0 },
        /* 1 */ { cn: '大专 / 职业技术学校',  tw: '大專 / 職業技術學校',  score: 0 },
        /* 2 */ { en: "C. Bachelor's degree",                    cn: '全日制本科（学士）',   tw: '全日制本科（學士）',   score: 0 },
        /* 3 */ { en: "D. Master's degree and above",            cn: '硕士及以上',           tw: '碩士及以上',           score: 0 },
      ],
    },


    /* ─── AAA: High School & below ─── */

    { /* QKA_HS1 */
      id: 'QKA_HS1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你觉得自己的学习生活有趣吗？',
      tw: '你覺得自己的學習生活有趣嗎？',
      options: [
        { cn: '充满热情，我主动探索课本以外的知识。', tw: '充滿熱情，我主動探索課本以外的知識。', score: 4 },
        { cn: '适应良好，在部分科目或活动中能找到乐趣。', tw: '適應良好，在部分科目或活動中能找到樂趣。', score: 3 },
        { cn: '枯燥机械，只是为了考试和毕业而学。', tw: '枯燥機械，只是為了考試和畢業而學。', score: 1 },
        { cn: '极度痛苦，长期精神疲惫，时常想放弃。', tw: '極度痛苦，長期精神疲憊，時常想放棄。', score: 0 },
      ],
    },

    { /* QKA_HS2 */
      id: 'QKA_HS2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你目前是否遭受校园暴力（包括情感伤害/被孤立）？',
      tw: '你目前是否遭受校園暴力（包括情感傷害/被孤立）？',
      options: [
        { cn: '完全没有，社交环境安全友善。', tw: '完全沒有，社交環境安全友善。', score: 4 },
        { cn: '偶有小摩擦或玩笑，尚在可控范围。', tw: '偶有小摩擦或玩笑，尚在可控範圍。', score: 3 },
        { cn: '正遭受长期情感霸凌、孤立或谣言。', tw: '正遭受長期情感霸凌、孤立或謠言。', score: 1 },
        { cn: '正遭受身体暴力、敲诈或严重网络霸凌。', tw: '正遭受身體暴力、敲詐或嚴重網路霸凌。', score: 0 },
      ],
    },

    { /* QKA_HS3 */
      id: 'QKA_HS3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你每周通过运动或爱好减压的频率是？',
      tw: '你每週透過運動或愛好減壓的頻率是？',
      options: [
        { cn: '每周4次及以上。', tw: '每週4次及以上。', score: 4 },
        { cn: '每周2-3次。',     tw: '每週2-3次。',     score: 3 },
        { cn: '每周1次。',       tw: '每週1次。',       score: 2 },
        { cn: '几乎从不。',      tw: '幾乎從不。',      score: 0 },
      ],
    },

    { /* QKA_HS4 */
      id: 'QKA_HS4', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你所在学校的管理是否严格？',
      tw: '你所在學校的管理是否嚴格？',
      options: [
        { cn: '非常自由，类似大学自主管理。', tw: '非常自由，類似大學自主管理。', score: 4 },
        { cn: '正常管理，基本纪律但保留个人空间。', tw: '正常管理，基本紀律但保留個人空間。', score: 3 },
        { cn: '严格高压（如军事化、密集时间表）。', tw: '嚴格高壓（如軍事化、密集時間表）。', score: 1 },
        { cn: '极度压制，严重侵犯隐私并全程监控。', tw: '極度壓制，嚴重侵犯隱私並全程監控。', score: 0 },
      ],
    },

    { /* QKA_HS5 */
      id: 'QKA_HS5', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你在同学中受欢迎吗？',
      tw: '你在同學中受歡迎嗎？',
      options: [
        { cn: '我是社交核心，朋友众多，常被邀约。', tw: '我是社交核心，朋友眾多，常被邀約。', score: 4 },
        { cn: '我有稳定的小圈子，整体相处融洽。', tw: '我有穩定的小圈子，整體相處融洽。', score: 3 },
        { cn: '我被边缘化，大家不讨厌我但很少关注我。', tw: '我被邊緣化，大家不討厭我但很少關注我。', score: 1 },
        { cn: '我被主动排斥或刻意孤立。', tw: '我被主動排斥或刻意孤立。', score: 0 },
      ],
    },

    { /* QKA_HS6 */
      id: 'QKA_HS6', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你的家人尊重你的隐私吗？',
      tw: '你的家人尊重你的隱私嗎？',
      options: [
        { cn: '完全尊重，敲门进来，从不翻手机或日记。', tw: '完全尊重，敲門進來，從不翻手機或日記。', score: 4 },
        { cn: '大多数时候尊重，偶尔以关心之名过问。', tw: '大多數時候尊重，偶爾以關心之名過問。', score: 3 },
        { cn: '经常翻我的物品或干涉我的朋友关系。', tw: '經常翻我的物品或干涉我的朋友關係。', score: 1 },
        { cn: '零隐私，被全面监控和管控。', tw: '零隱私，被全面監控和管控。', score: 0 },
      ],
    },

    { /* QKA_HS7 */
      id: 'QKA_HS7', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你的爱好被学校或家人允许吗？',
      tw: '你的愛好被學校或家人允許嗎？',
      options: [
        { cn: '完全支持，甚至提供资金或资源。', tw: '完全支持，甚至提供資金或資源。', score: 4 },
        { cn: '不干涉，只要不影响学习就行。', tw: '不干涉，只要不影響學習就行。', score: 3 },
        { cn: '被认为是浪费时间，经常被言语否定。', tw: '被認為是浪費時間，經常被言語否定。', score: 1 },
        { cn: '被严禁，物品曾被没收或损毁。', tw: '被嚴禁，物品曾被沒收或損毀。', score: 0 },
      ],
    },

    { /* QKA_HS8 */
      id: 'QKA_HS8', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你愿意花时间陪伴家人吗？',
      tw: '你願意花時間陪伴家人嗎？',
      options: [
        { cn: '非常愿意，家是我的避风港。', tw: '非常願意，家是我的避風港。', score: 4 },
        { cn: '一般，有温馨时刻，也有代沟摩擦。', tw: '一般，有溫馨時刻，也有代溝摩擦。', score: 3 },
        { cn: '尽量回避，相处会有压力或争吵。', tw: '盡量回避，相處會有壓力或爭吵。', score: 1 },
        { cn: '极度抗拒，想方设法尽早离开家。', tw: '極度抗拒，想方設法盡早離開家。', score: 0 },
      ],
    },

    { /* QKA_HS9 */
      id: 'QKA_HS9', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你一周有几天睡眠不足7小时？',
      tw: '你一週有幾天睡眠不足7小時？',
      options: [
        { cn: '0天，每天睡满7小时以上。', tw: '0天，每天睡滿7小時以上。', score: 4 },
        { cn: '1-2天。',                 tw: '1-2天。',                 score: 3 },
        { cn: '3-5天。',                 tw: '3-5天。',                 score: 1 },
        { cn: '6-7天（严重慢性睡眠剥夺）。', tw: '6-7天（嚴重慢性睡眠剝奪）。', score: 0 },
      ],
    },

    { /* QKA_HS10 */
      id: 'QKA_HS10', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你愿意和朋友分享你的家庭生活吗？',
      tw: '你願意和朋友分享你的家庭生活嗎？',
      options: [
        { cn: '愿意，我开心地分享家庭情况。', tw: '願意，我開心地分享家庭情況。', score: 4 },
        { cn: '有时，分享一些一般内容，私事保留。', tw: '有時，分享一些一般內容，私事保留。', score: 3 },
        { cn: '很少，我刻意把家庭生活与朋友隔开。', tw: '很少，我刻意把家庭生活與朋友隔開。', score: 2 },
        { cn: '从不，家庭是我的羞耻或深深的痛苦。', tw: '從不，家庭是我的羞恥或深深的痛苦。', score: 0 },
      ],
    },

    { /* QKA_HS11 */
      id: 'QKA_HS11', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你是否经常感到厌学？',
      tw: '你是否經常感到厭學？',
      options: [
        { cn: '很少，我动力很强。',             tw: '很少，我動力很強。',             score: 4 },
        { cn: '偶尔，但能调整后继续。',       tw: '偶爾，但能調整後繼續。',         score: 3 },
        { cn: '经常，学习感觉是沉重的负担。',    tw: '經常，學習感覺是沉重的負擔。',    score: 1 },
        { cn: '持续，我已经完全放弃学业。', tw: '持續，我已經完全放棄學業。', score: 0 },
      ],
    },

    { /* QKA_HS12 */
      id: 'QKA_HS12', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      cn: '你是否对未来感到完全迷茫？',
      tw: '你是否對未來感到完全迷茫？',
      options: [
        { cn: '完全不，我有清晰的目标和计划。', tw: '完全不，我有清晰的目標和計劃。', score: 4 },
        { cn: '有点迷茫，但大方向还是清楚的。', tw: '有點迷茫，但大方向還是清楚的。', score: 3 },
        { cn: '非常焦虑，完全不知道自己该做什么。', tw: '非常焦慮，完全不知道自己該做什麼。', score: 1 },
        { cn: '对未来的恐惧完全让我瘫痪，已放弃规划。', tw: '對未來的恐懼完全讓我癱瘓，已放棄規劃。', score: 0 },
      ],
    },


    /* ─── AAB / AAC: College + Bachelor (shared questions) ─── */

    { /* QKA_BC1 — Depression */
      id: 'QKA_BC1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      cn: '你是否曾经历过抑郁状态？',
      tw: '你是否曾經歷過憂鬱狀態？',
      options: [
        { cn: '从未，我的心理状态非常健康。', tw: '從未，我的心理狀態非常健康。', score: 4 },
        { cn: '偶尔情绪低落，但能很快恢复。', tw: '偶爾情緒低落，但能很快恢復。', score: 3 },
        { cn: '频繁出现持续性低落情绪。', tw: '頻繁出現持續性低落情緒。', score: 1 },
        { cn: '是，我曾经历或正经历临床抑郁症。', tw: '是，我曾經歷或正在經歷臨床憂鬱症。', score: 0 },
      ],
    },

    { /* QKA_BC2 — Study status */
      id: 'QKA_BC2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      cn: '你目前的学业状况如何？',
      tw: '你目前的學業狀況如何？',
      options: [
        { cn: '名列前茅，几乎全面领先。', tw: '名列前茅，幾乎全面領先。', score: 4 },
        { cn: '中上水平，表现稳定扎实。', tw: '中上水平，表現穩定扎實。', score: 3 },
        { cn: '一般，勉强及格。', tw: '一般，勉強及格。', score: 2 },
        { cn: '严重吃力，面临不及格或退学风险。', tw: '嚴重吃力，面臨不及格或退學風險。', score: 0 },
      ],
    },

    { /* QKA_BC3 — Job relevance */
      id: 'QKA_BC3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      cn: '你的学业能帮你找到合适的工作吗？',
      tw: '你的學業能幫你找到合適的工作嗎？',
      options: [
        { cn: '肯定，我的专业需求旺盛且职业路径清晰。', tw: '肯定，我的專業需求旺盛且職業路徑清晰。', score: 4 },
        { cn: '大概率，能为多个领域打好基础。', tw: '大概率，能為多個領域打好基礎。', score: 3 },
        { cn: '不太可能，技能与市场需求不匹配。', tw: '不太可能，技能與市場需求不匹配。', score: 1 },
        { cn: '完全不可能，我的学位对就业几乎毫无用处。', tw: '完全不可能，我的學位對就業幾乎毫無用處。', score: 0 },
      ],
    },

    { /* QKA_BC4 — Scholarship */
      id: 'QKA_BC4', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      cn: '你是否获得过奖学金？',
      tw: '你是否獲得過獎學金？',
      options: [
        { cn: '有，顶级或国家级奖学金。', tw: '有，頂級或國家級獎學金。', score: 4 },
        { cn: '有，普通或小额奖学金。', tw: '有，普通或小額獎學金。', score: 3 },
        { cn: '没有，但成绩还不错。', tw: '沒有，但成績還不錯。', score: 2 },
        { cn: '没有，成绩太低无法获得资格。', tw: '沒有，成績太低無法獲得資格。', score: 0 },
      ],
    },

    { /* QKA_BC5 — Leadership role */
      id: 'QKA_BC5', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      cn: '你是否担任重要职务（如学生会、社团会长等）？',
      tw: '你是否擔任重要職務（如學生會、社團會長等）？',
      options: [
        { cn: '有，我担任核心领导职务。', tw: '有，我擔任核心領導職務。', score: 4 },
        { cn: '有，我担任小型或院系级职务。', tw: '有，我擔任小型或院系級職務。', score: 3 },
        { cn: '没有，但我积极参与为成员。', tw: '沒有，但我積極參與為成員。', score: 2 },
        { cn: '没有，我不参与任何课外活动。', tw: '沒有，我不參與任何課外活動。', score: 1 },
      ],
    },

    { /* QKA_BC6 — Mental clarity */
      id: 'QKA_BC6', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      cn: '你学习时思维是否足够清晰？',
      tw: '你學習時思維是否足夠清晰？',
      options: [
        { cn: '极度清晰，我能快速掌握知识点。', tw: '極度清晰，我能快速掌握知識點。', score: 4 },
        { cn: '总体清晰，遇到复杂知识需要时间消化。', tw: '總體清晰，遇到複雜知識需要時間消化。', score: 3 },
        { cn: '经常脑雾，难以集中注意力。', tw: '經常腦霧，難以集中注意力。', score: 1 },
        { cn: '完全空白，根本无法处理学业信息。', tw: '完全空白，根本無法處理學業資訊。', score: 0 },
      ],
    },

    { /* QKA_BC7 — Foreign language proficiency */
      id: 'QKA_BC7', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      cn: '你的外语（如英语）水平如何？',
      tw: '你的外語（如英語）水平如何？',
      options: [
        { cn: '流利，能读原版文献并进行深度学术/商业交流。', tw: '流利，能讀原版文獻並進行深度學術/商業交流。', score: 4 },
        { cn: '熟练，持有高级证书，能应对日常专业任务。', tw: '熟練，持有高級證書，能應對日常專業任務。', score: 3 },
        { cn: '基础，通过了考试但实际交流困难。', tw: '基礎，通過了考試但實際交流困難。', score: 2 },
        { cn: '零基础/很差，完全无法用该语言获取信息。', tw: '零基礎/很差，完全無法用該語言獲取資訊。', score: 0 },
      ],
    },


    /* ─── AAD: Master's & above (extra questions, then merges with BC) ─── */

    { /* QKA_D1 — Research direction */
      id: 'QKA_D1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 3; },
      cn: '你目前有清晰的研究方向、论文题目或课题吗？',
      tw: '你目前有清晰的研究方向、論文題目或課題嗎？',
      options: [
        { cn: '有，已确定且进展顺利。', tw: '有，已確定且進展順利。', score: 4 },
        { cn: '正在探索，有大致方向。', tw: '正在探索，有大致方向。', score: 3 },
        { cn: '完全迷茫，尚无方向。', tw: '完全迷茫，尚無方向。', score: 1 },
        { cn: '面临严重阻碍，考虑换题或退学。', tw: '面臨嚴重阻礙，考慮換題或退學。', score: 0 },
      ],
    },

    { /* QKA_D2 — Funding / supervisor support */
      id: 'QKA_D2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 3; },
      cn: '你的科研项目是否有稳定的经费或导师支持？',
      tw: '你的科研項目是否有穩定的經費或導師支持？',
      options: [
        { cn: '充裕经费和顶尖设备。', tw: '充裕經費和頂尖設備。', score: 4 },
        { cn: '支持足够，勉强能推进。', tw: '支持足夠，勉強能推進。', score: 3 },
        { cn: '缺乏支持，需自费或频繁延误。', tw: '缺乏支持，需自費或頻繁延誤。', score: 1 },
        { cn: '零支持，被导师或体制完全放弃。', tw: '零支持，被導師或體制完全放棄。', score: 0 },
      ],
    },

    { /* QKA_D3 — Publications / patents */
      id: 'QKA_D3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 3; },
      cn: '你是否发表过核心期刊论文或产出重要专利？',
      tw: '你是否發表過核心期刊論文或產出重要專利？',
      options: [
        { cn: '有，顶级刊物第一作者。', tw: '有，頂級刊物第一作者。', score: 4 },
        { cn: '有，达到毕业要求的普通发表。', tw: '有，達到畢業要求的普通發表。', score: 3 },
        { cn: '没有，但正在投稿或撰写中。', tw: '沒有，但正在投稿或撰寫中。', score: 2 },
        { cn: '没有，且暂无发表前景。', tw: '沒有，且暫無發表前景。', score: 0 },
      ],
    },


    /* ─── AB: Employed ─── */

    /* QKAB8 (specific-profession question) moved to bonus section —
       see QKBON_AB8 later in this file. */

    { /* QKAB1 — Work shifts / hours */
      id: 'QKAB1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      cn: '以下哪种情况符合你目前的工作班次和时长？',
      tw: '以下哪種情況符合你目前的工作班次和時長？',
      options: [
        { cn: '每天工作8-10小时，周末双休。',                                       tw: '每天工作8-10小時，週末雙休。',                                       score: 4 },
        { cn: '每天工作8-10小时，每周只休息一天。',                                  tw: '每天工作8-10小時，每週只休息一天。',                                  score: 3 },
        { cn: '休息对我来说极为少见。',                                              tw: '休息對我來說極為少見。',                                              score: 1 },
        { cn: '几乎不间断地工作。',                                                  tw: '幾乎不間斷地工作。',                                                  score: 0 },
        { cn: '极度轻松，每天工作很少，有大量个人时间。',                            tw: '極度輕鬆，每天工作很少，有大量個人時間。',                            score: 4 },
      ],
    },

    { /* QKAB2 — Job-skill match */
      id: 'QKAB2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      cn: '你的工作内容是否与你的核心技能匹配？',
      tw: '你的工作內容是否與你的核心技能匹配？',
      options: [
        { cn: '高度匹配，能充分发挥我的优势。', tw: '高度匹配，能充分發揮我的優勢。', score: 4 },
        { cn: '部分匹配，边做边学。', tw: '部分匹配，邊做邊學。', score: 2 },
        { cn: '完全不匹配，纯粹机械劳动。', tw: '完全不匹配，純粹機械勞動。', score: 0 },
      ],
    },

    { /* QKAB4 — Daily income balance */
      id: 'QKAB4', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      cn: '扣除房租/房贷和基本餐食后，你每日税后收入结余如何？',
      tw: '扣除房租/房貸和基本餐食後，你每日稅後收入結餘如何？',
      options: [
        { cn: '大量结余，可自由储蓄和投资。',                   tw: '大量結餘，可自由儲蓄和投資。',                   score: 4 },
        { cn: '够用，也能存下钱应对未来开销。',                  tw: '夠用，也能存下錢應對未來開銷。',                  score: 3 },
        { cn: '月光，勉强维持生存。', tw: '月光，勉強維持生存。', score: 1 },
        { cn: '入不敷出，负债中。', tw: '入不敷出，負債中。', score: 0 },
      ],
    },

    { /* QKAB5 — Exercise and nutrition */
      id: 'QKAB5', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      cn: '你能保证在业余时间定期进行中高强度运动并注重饮食营养吗？',
      tw: '你能保證在業餘時間定期進行中高強度運動並注重飲食營養嗎？',
      options: [
        { cn: '每周3次以上，有系统性饮食管理。', tw: '每週3次以上，有系統性飲食管理。', score: 4 },
        { cn: '偶尔运动，饮食随心情而定。', tw: '偶爾運動，飲食隨心情而定。', score: 2 },
        { cn: '很少运动，严重依赖外卖快餐。', tw: '很少運動，嚴重依賴外賣快餐。', score: 1 },
        { cn: '业余时间太紧，根本没余力顾及。', tw: '業餘時間太緊，根本沒餘力顧及。', score: 0 },
      ],
    },

    { /* QKAB6 — Promotion / growth opportunity */
      id: 'QKAB6', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      cn: '过去一年，你的职位或行业是否出现清晰的晋升、加薪或技能提升机会？',
      tw: '過去一年，你的職位或行業是否出現清晰的晉升、加薪或技能提升機會？',
      options: [
        { cn: '有，我已经获得晋升或大幅加薪。', tw: '有，我已經獲得晉升或大幅加薪。', score: 4 },
        { cn: '有，路径清晰，我正积极努力中。', tw: '有，路徑清晰，我正積極努力中。', score: 3 },
        { cn: '停滞不前，无加薪机会，重复性工作。', tw: '停滯不前，無加薪機會，重複性工作。', score: 1 },
        { cn: '行业萎缩，面临即将裁员或降薪。', tw: '行業萎縮，面臨即將裁員或降薪。', score: 0 },
      ],
    },

    { /* QKAB7 — Job market resilience */
      id: 'QKAB7', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      cn: '如果明天失去这份工作，你目前的能力能让你从容应对吗？',
      tw: '如果明天失去這份工作，你目前的能力能讓你從容應對嗎？',
      options: [
        { cn: '毫无压力，能轻松找到更好的工作或有强大的副业。', tw: '毫無壓力，能輕鬆找到更好的工作或有強大的副業。', score: 4 },
        { cn: '需要1-3个月过渡，但对找到好工作有信心。', tw: '需要1-3個月過渡，但對找到好工作有信心。', score: 3 },
        { cn: '非常焦虑，很难在别处匹配现有收入。', tw: '非常焦慮，很難在別處匹配現有收入。', score: 1 },
        { cn: '致命打击，我的技能缺乏市场价值，生活会立即停摆。', tw: '致命打擊，我的技能缺乏市場價值，生活會立即停擺。', score: 0 },
      ],
    },


    /* ─── AC: Entrepreneur ─── */

    { /* QKAC1 — Cash flow stage */
      id: 'QKAC1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 2; },
      cn: '你的业务/项目目前处于哪个现金流阶段？',
      tw: '你的業務/項目目前處於哪個現金流階段？',
      options: [
        { cn: '稳定盈利并保持增长。', tw: '穩定盈利並保持增長。', score: 4 },
        { cn: '基本实现收支平衡。', tw: '基本實現收支平衡。', score: 2 },
        { cn: '暂未正式盈利结算（仍在产品研发、市场验证或前期投入阶段）。', tw: '暫未正式盈利結算（仍在產品研發、市場驗證或前期投入階段）。', score: 1 },
        { cn: '亏损中，靠积蓄或融资维持。', tw: '虧損中，靠積蓄或融資維持。', score: 1 },
        { cn: '极高负债，面临资金链断裂风险。', tw: '極高負債，面臨資金鏈斷裂風險。', score: 0 },
      ],
    },

    { /* QKAC2 — Weekly hours */
      id: 'QKAC2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 2; },
      cn: '你平均每周为自己的业务工作多少小时？',
      tw: '你平均每週為自己的業務工作多少小時？',
      options: [
        { cn: '40小时以内。', tw: '40小時以內。', score: 4 },
        { cn: '40-60小时。', tw: '40-60小時。', score: 3 },
        { cn: '60-80小时。', tw: '60-80小時。', score: 1 },
        { cn: '80小时以上（全年无休，高度绑定业务）。', tw: '80小時以上（全年無休，高度綁定業務）。', score: 0 },
      ],
    },

    { /* QKAC3 — Customer stickiness */
      id: 'QKAC3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 2; },
      cn: '你的产品/服务目前是否有稳定的核心客户群或定期复购？',
      tw: '你的產品/服務目前是否有穩定的核心客戶群或定期復購？',
      options: [
        { cn: '客户粘性极高，拥有忠实粉丝群体，复购率超过50%，口碑传播效果显著。', tw: '客戶黏性極高，擁有忠實粉絲群體，復購率超過50%，口碑傳播效果顯著。', score: 4 },
        { cn: '客户粘性高，有稳定的核心客户群，定期复购，正向反馈和转化稳定。', tw: '客戶黏性高，有穩定的核心客戶群，定期復購，正向反饋和轉化穩定。', score: 3 },
        { cn: '有一定客户基础，但流失率较高，需要持续投入获客成本。', tw: '有一定客戶基礎，但流失率較高，需要持續投入獲客成本。', score: 2 },
        { cn: '刚获得首批客户，仍在验证产品市场契合度，复购情况尚不明确。', tw: '剛獲得首批客戶，仍在驗證產品市場契合度，復購情況尚不明確。', score: 1 },
        { cn: '仍处于冷启动阶段，几乎没有实际交易，主要靠Demo或意向客户。', tw: '仍處於冷啟動階段，幾乎沒有實際交易，主要靠Demo或意向客戶。', score: 0 },
      ],
    },

    { /* QKAC4 — Entrepreneur type */
      id: 'QKAC4', section: 'social', scorable: true, noImprove: true,
      showIf: function(s){ return s.QK3 === 2; },
      cn: '你正在建立的组织或秩序，属于以下哪个通道？',
      tw: '你正在建立的組織或秩序，屬於以下哪個通道？',
      options: [
        { cn: '被认证的企业家，资本市场绝对认可商业大鳄。', tw: '被認證的企業家，資本市場絕對認可商業大鱷。', score: 4 },
        { cn: '任意行业创始人，未知或传统商业领域拓荒者。', tw: '任意行業創始人，未知或傳統商業領域拓荒者。', score: 3 },
        { cn: '小型个体经营者，独立服务提供者。', tw: '小型個體經營者，獨立服務提供者。', score: 2 },
        { cn: '副业尝试者，尚未全职投入。', tw: '副業嘗試者，尚未全職投入。', score: 1 },
      ],
    },


    /* ─── AD: Unemployed ─── */

    { /* QKAD1 — Savings runway */
      id: 'QKAD1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 3 || s.QK3 === 4; },
      cn: '在不降低基本生活水准的前提下，你的储蓄或被动收入能支撑多久？',
      tw: '在不降低基本生活水準的前提下，你的儲蓄或被動收入能支撐多久？',
      options: [
        { cn: '2年以上。',                                  tw: '2年以上。',                                  score: 4 },
        { cn: '半年到2年。',                                tw: '半年到2年。',                                score: 3 },
        { cn: '3个月到半年。',                               tw: '3個月到半年。',                               score: 2 },
        { cn: '1个月到3个月。',                              tw: '1個月到3個月。',                              score: 1 },
        { cn: '随时可能断炊，高度依赖他人资助。',            tw: '隨時可能斷炊，高度依賴他人資助。',            score: 0 },
      ],
    },

    { /* QKAD2 — Regular schedule */
      id: 'QKAD2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 3 || s.QK3 === 4; },
      cn: '你目前是否保持规律作息并为白天安排固定任务？',
      tw: '你目前是否保持規律作息並為白天安排固定任務？',
      options: [
        { cn: '非常规律，每天有清晰的待办清单。', tw: '非常規律，每天有清晰的待辦清單。', score: 4 },
        { cn: '偶尔规律，大多数时候随意。', tw: '偶爾規律，大多數時候隨意。', score: 2 },
        { cn: '作息不规律。', tw: '作息不規律。', score: 0 },
      ],
    },

    { /* QKAD3 — Unemployed status type */
      id: 'QKAD3', section: 'social', scorable: true, noImprove: true,
      showIf: function(s){ return s.QK3 === 3 || s.QK3 === 4; },
      cn: '你当前的无业状态，本质上属于以下哪种处境？',
      tw: '你目前的無業狀態，本質上屬於以下哪種處境？',
      options: [
        { cn: '大型财富继承人', tw: '大型財富繼承人', score: 4 },
        { cn: '正在积极求职中，有明确的职业规划', tw: '正在積極求職中，有明確的職業規劃', score: 3 },
        { cn: '暂时休息调整，有充足的储蓄支撑', tw: '暫時休息調整，有充足的儲蓄支撐', score: 3 },
        { cn: '处于职业转型期，正在学习新技能', tw: '處於職業轉型期，正在學習新技能', score: 2 },
        { cn: '长期找不到工作，经济压力较大', tw: '長期找不到工作，經濟壓力較大', score: 1 },
        { cn: '潜藏中的违法者', tw: '潛藏中的違法者', score: 0 },
        { cn: '正在服刑的罪犯', tw: '正在服刑的罪犯', score: 0 },
        { cn: '无家可归的流浪者', tw: '無家可歸的流浪者', score: 0 },
      ],
    },


    /* ─── AE: Retired ─── */

    { /* QKAE1 — Pension adequacy */
      id: 'QKAE1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 5; },
      cn: '你每月的固定养老金/被动收入是否能覆盖日常医疗和生活支出？',
      tw: '你每月的固定養老金/被動收入是否能覆蓋日常醫療和生活支出？',
      options: [
        { cn: '充裕，还能支持旅游和兴趣爱好。', tw: '充裕，還能支持旅遊和興趣愛好。', score: 4 },
        { cn: '刚好覆盖基本生活和基本医疗。', tw: '剛好覆蓋基本生活和基本醫療。', score: 3 },
        { cn: '需要子女定期补贴。', tw: '需要子女定期補貼。', score: 1 },
        { cn: '比较紧张，看病都有压力。', tw: '比較緊張，看病都有壓力。', score: 0 },
      ],
    },

    { /* QKAE2 — Physical independence */
      id: 'QKAE2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 5; },
      cn: '你目前的身体状况对日常自理生活的影响有多大？',
      tw: '你目前的身體狀況對日常自理生活的影響有多大？',
      options: [
        { cn: '完全自理，可参加中等强度活动（快走、跳舞）。', tw: '完全自理，可參加中等強度活動（快走、跳舞）。', score: 4 },
        { cn: '有慢性病但药物控制良好，完全自理。', tw: '有慢性病但藥物控制良好，完全自理。', score: 3 },
        { cn: '日常生活需要他人协助。', tw: '日常生活需要他人協助。', score: 1 },
        { cn: '长期卧床。', tw: '長期臥床。', score: 0 },
      ],
    },


    /* ─── AF / AG: Seriously Ill / Post-Accident ─── */

    { /* QKAF1 — Sleep disruption from pain */
      id: 'QKAF1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 6 || s.QK3 === 7; },
      cn: '你一周有几天因身体疼痛或严重不适而无法安睡（少于5小时）？',
      tw: '你一週有幾天因身體疼痛或嚴重不適而無法安睡（少於5小時）？',
      options: [
        { cn: '几乎没有，疼痛得到良好控制。', tw: '幾乎沒有，疼痛得到良好控制。', score: 4 },
        { cn: '1-2天。',                    tw: '1-2天。',                    score: 3 },
        { cn: '3-5天。',                    tw: '3-5天。',                    score: 1 },
        { cn: '几乎每天。',                 tw: '幾乎每天。',                 score: 0 },
      ],
    },

    { /* QKAF2 — Caregiver presence */
      id: 'QKAF2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 6 || s.QK3 === 7; },
      cn: '在治疗或行动受限期间，你身边是否有固定的照护者？',
      tw: '在治療或行動受限期間，你身邊是否有固定的照護者？',
      options: [
        { cn: '有，专业或全职家人照护。', tw: '有，專業或全職家人照護。', score: 4 },
        { cn: '有，轮班照护，勉强维持。', tw: '有，輪班照護，勉強維持。', score: 2 },
        { cn: '缺乏照护，大多数时候独自忍受。', tw: '缺乏照護，大多數時候獨自忍受。', score: 0 },
      ],
    },

    { /* QKAF3 — Physical independence (same as AE) */
      id: 'QKAF3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 6 || s.QK3 === 7; },
      cn: '你目前的身体状况对日常自理生活的影响有多大？',
      tw: '你目前的身體狀況對日常自理生活的影響有多大？',
      options: [
        { cn: '完全自理，可参加中等强度活动。', tw: '完全自理，可參加中等強度活動。', score: 4 },
        { cn: '有慢性病但药物控制良好，完全自理。', tw: '有慢性病但藥物控制良好，完全自理。', score: 3 },
        { cn: '日常生活需要他人协助。', tw: '日常生活需要他人協助。', score: 1 },
        { cn: '长期卧床。', tw: '長期臥床。', score: 0 },
      ],
    },


    /* ─── AH: Restricted Movement ─── */

    { /* QKAH1 — Duration */
      id: 'QKAH1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 8; },
      cn: '这次行动受限的状态预计会持续多久？',
      tw: '這次行動受限的狀態預計會持續多久？',
      options: [
        { cn: '短期，数月内可恢复正常。', tw: '短期，數月內可恢復正常。', score: 3 },
        { cn: '中长期，从一年到数年不等。', tw: '中長期，從一年到數年不等。', score: 1 },
        { cn: '永久或无限期受限。', tw: '永久或無限期受限。', score: 0 },
      ],
    },

    { /* QKAH2 — Communication frequency */
      id: 'QKAH2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 8; },
      cn: '在受限期间，你与外界（社会、亲属或网络）的有效沟通频率如何？',
      tw: '在受限期間，你與外界（社會、親屬或網路）的有效溝通頻率如何？',
      options: [
        { cn: '每天顺畅沟通，持续获取新信息。', tw: '每天順暢溝通，持續獲取新資訊。', score: 4 },
        { cn: '每周几次固定机会进行有限沟通。', tw: '每週幾次固定機會進行有限溝通。', score: 3 },
        { cn: '偶尔书信或每月极简短联系。', tw: '偶爾書信或每月極簡短聯繫。', score: 1 },
        { cn: '与外界完全隔绝，处于信息真空中。', tw: '與外界完全隔絕，處於資訊真空中。', score: 0 },
      ],
    },


    /* ─── AI: Full-time Caregiver ─── */

    { /* QKAI1 — Off-duty rest */
      id: 'QKAI1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 9; },
      cn: '你每周是否有至少一两天完全"下班"的休息时间？',
      tw: '你每週是否有至少一兩天完全「下班」的休息時間？',
      options: [
        { cn: '有，伴侣/长辈完全接手，我有绝对自由的天数。', tw: '有，伴侶/長輩完全接手，我有絕對自由的天數。', score: 4 },
        { cn: '只有每天的零散几小时（如孩子睡着时）。', tw: '只有每天的零散幾小時（如孩子睡著時）。', score: 2 },
        { cn: '极少，偶尔有人短暂帮忙。', tw: '極少，偶爾有人短暫幫忙。', score: 1 },
        { cn: '完全没有，全年24/7随时待命。', tw: '完全沒有，全年24/7隨時待命。', score: 0 },
      ],
    },

    { /* QKAI2 — Additional income */
      id: 'QKAI2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 9; },
      cn: '你是否有额外的收入渠道？',
      tw: '你是否有額外的收入渠道？',
      options: [
        { cn: '稳定副业/投资，部分财务独立。', tw: '穩定副業/投資，部分財務獨立。', score: 4 },
        { cn: '婚后仅靠不稳定的副业维持收入。', tw: '婚後僅靠不穩定的副業維持收入。', score: 3 },
        { cn: '只依靠婚前积蓄。', tw: '只依靠婚前積蓄。', score: 2 },
        { cn: '零个人收入，每笔开销都要向伴侣/家人开口。', tw: '零個人收入，每筆開銷都要向伴侶/家人開口。', score: 0 },
      ],
    },

    { /* QKAI3 — Family support */
      id: 'QKAI3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 9; },
      cn: '家人的支持是否让你的生活更轻松？',
      tw: '家人的支持是否讓你的生活更輕鬆？',
      options: [
        { cn: '极度支持，经济和情感都有充分后盾。', tw: '極度支持，經濟和情感都有充分後盾。', score: 4 },
        { cn: '有一定支持，叫了才帮但不主动。', tw: '有一定支持，叫了才幫但不主動。', score: 3 },
        { cn: '中立，帮不上忙但也不添麻烦。', tw: '中立，幫不上忙但也不添麻煩。', score: 2 },
        { cn: '负面支持，持续批评或消耗我的精力。', tw: '負面支持，持續批評或消耗我的精力。', score: 0 },
      ],
    },

    { /* QKAI4 — Partner childcare share */
      id: 'QKAI4', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 9; },
      cn: '你的伴侣承担了多少育儿和日常家务？',
      tw: '你的伴侶承擔了多少育兒和日常家務？',
      options: [
        { cn: '40%-50%以上，积极参与，情感价值高。', tw: '40%-50%以上，積極參與，情感價值高。', score: 4 },
        { cn: '20%-30%，下班后帮忙，但核心决策由我做。', tw: '20%-30%，下班後幫忙，但核心決策由我做。', score: 3 },
        { cn: '5%-10%，偶尔陪孩子玩，几乎不碰家务。', tw: '5%-10%，偶爾陪孩子玩，幾乎不碰家務。', score: 1 },
        { cn: '0%，缺席型育儿，还增加负担和矛盾。', tw: '0%，缺席型育兒，還增加負擔和矛盾。', score: 0 },
      ],
    },


    /* ═══════════════════════════════════════════
       SECTION 4 — COMMON (all statuses)
       ═══════════════════════════════════════════ */

    { /* QKC1 — Appearance anxiety — hidden for age 56+ */
      id: 'QKC1', section: 'basic', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 < 5; },
      cn: '你是否为自己的外表感到焦虑？',
      tw: '你是否為自己的外表感到焦慮？',
      options: [
        { cn: '完全自信，靠健康和体魄说话。', tw: '完全自信，靠健康和體魄說話。', score: 4 },
        { cn: '偶尔在意，在仪容上适度投入。', tw: '偶爾在意，在儀容上適度投入。', score: 3 },
        { cn: '经常焦虑，在美容/减肥上大量花费。', tw: '經常焦慮，在美容/減肥上大量花費。', score: 1 },
        { cn: '极度不安全感，已影响社交生活和心理健康。', tw: '極度不安全感，已影響社交生活和心理健康。', score: 0 },
      ],
    },

    { /* QKC2 — Monthly income — open for Employed, Entrepreneur, Retired */
      id: 'QKC2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1 || s.QK3 === 2 || s.QK3 === 5; },
      cn: '你的月收入属于以下哪个标准？',
      tw: '你的月收入屬於以下哪個標準？',
      options: [
        {
          cn: '极高（前1% / 高净值）。', tw: '極高（前1% / 高淨值）。', score: 4,
          desc: {
            cn: '完全财务自由，可随意支配资产，有底气和能力对一切说不。家人无需为任何社会负担、医疗、就业或教育问题担忧。',
            tw: '完全財務自由，可隨意支配資產，有底氣和能力對一切說不。家人無需為任何社會負擔、醫療、就業或教育問題擔憂。',
          },
        },
        {
          cn: '高（扎实的中上阶层）。', tw: '高（扎實的中上階層）。', score: 3,
          desc: {
            cn: '生活质量较高，储蓄与投资有余裕，偶发大额支出不构成威胁，整体方向可控。',
            tw: '生活質量較高，儲蓄與投資有餘裕，偶發大額支出不構成威脅，整體方向可控。',
          },
        },
        {
          cn: '中等（日常稳定，可自给自足）。', tw: '中等（日常穩定，可自給自足）。', score: 2,
          desc: {
            cn: '收支基本平衡，能覆盖日常生活所需，但大额意外支出会带来压力，未来规划空间有限。',
            tw: '收支基本平衡，能覆蓋日常生活所需，但大額意外支出會帶來壓力，未來規劃空間有限。',
          },
        },
        {
          cn: '低（徘徊在生存线附近）。', tw: '低（徘徊在生存線附近）。', score: 1,
          desc: {
            cn: '收入勉强覆盖基本开销，几乎没有储蓄空间，任何突发状况都可能造成资金缺口。',
            tw: '收入勉強覆蓋基本開銷，幾乎沒有儲蓄空間，任何突發狀況都可能造成資金缺口。',
          },
        },
        {
          cn: '极低（面临严重的经济压力）。', tw: '極低（面臨嚴重的經濟壓力）。', score: 0,
          desc: {
            cn: '长期入不敷出或依赖他人援助，经济压力严重影响日常决策与心理健康。',
            tw: '長期入不敷出或依賴他人援助，經濟壓力嚴重影響日常決策與心理健康。',
          },
        },
      ],
    },

    { /* QKC3 — Bad habits (multi-select) */
      id: 'QKC3', section: 'basic', scorable: true, multi: true, noAutoAdvance: true,
      scoreMode: 'multi_negative',
      cn: '以下不良习惯哪些适用于你？（可多选）',
      tw: '以下不良習慣哪些適用於你？（可多選）',
      options: [
        { cn: '以上均无。',                                     tw: '以上均無。',                                     score: 4, exclusive: true },
        { cn: '长期大量吸烟或酗酒。',                           tw: '長期大量吸菸或酗酒。',                           score: 0, negative: true },
        { cn: '长期频繁熬夜。',                                 tw: '長期頻繁熬夜。',                                 score: 0, negative: true },
        { cn: '沉迷短视频、成人内容或即时多巴胺刺激。',         tw: '沉迷短視頻、成人內容或即時多巴胺刺激。',         score: 0, negative: true },
        { cn: '饮食极度不规律，严重依赖垃圾食品。',             tw: '飲食極度不規律，嚴重依賴垃圾食品。',             score: 0, negative: true },
      ],
    },

    { /* QKC4 — Vision */
      id: 'QKC4', section: 'basic', scorable: false,
      cn: '你目前的视力状况如何？',
      tw: '你目前的視力狀況如何？',
      note: {
        cn: '视力状况由评估引擎单独处理',
        tw: '視力狀況由評估引擎單獨處理',
      },
      options: [
        { cn: '视力完好，无需任何矫正工具。',                                    tw: '視力完好，無需任何矯正工具。',                                    score: 0 },
        { cn: '轻度近视/散光，佩戴眼镜后日常生活几乎无影响。',                    tw: '輕度近視/散光，佩戴眼鏡後日常生活幾乎無影響。',                    score: 0 },
        { cn: '重度近视/散光，高度依赖眼镜或隐形眼镜，摘掉后严重模糊。',          tw: '重度近視/散光，高度依賴眼鏡或隱形眼鏡，摘掉後嚴重模糊。',          score: 0 },
        { cn: '视力明显受损，即使佩戴眼镜仍有困难，已影响日常独立活动。',          tw: '視力明顯受損，即使佩戴眼鏡仍有困難，已影響日常獨立活動。',          score: 0 },
        { cn: '法定失明或接近完全失明，需要他人协助或辅助设备才能生活。',          tw: '法定失明或接近完全失明，需要他人協助或輔助設備才能生活。',          score: 0 },
      ],
    },

    { /* QKC5 — Overall health */
      id: 'QKC5', section: 'basic', scorable: false,
      cn: '你目前的整体健康状况如何？',
      tw: '你目前的整體健康狀況如何？',
      note: {
        cn: '健康状况由评估引擎单独处理',
        tw: '健康狀況由評估引擎單獨處理',
      },
      options: [
        { cn: '极度健壮，精力充沛，极少生病。',                                                 tw: '極度健壯，精力充沛，極少生病。',                                                 score: 0 },
        { cn: '总体健康，偶有小病。',                                                           tw: '總體健康，偶有小病。',                                                           score: 0 },
        { cn: '亚健康，如超重、慢性腰背痛、持续性疲劳。',                                         tw: '亞健康，如超重、慢性腰背痛、持續性疲勞。',                                         score: 0 },
        { cn: '确诊慢性病，需长期用药。',                                                       tw: '確診慢性病，需長期用藥。',                                                       score: 0 },
        { cn: '目前正在接受重大事故或严重伤害的治疗中（住院/康复中）。',                            tw: '目前正在接受重大事故或嚴重傷害的治療中（住院/康復中）。',                            score: 0 },
        { cn: '危重疾病，正在与危及生命的疾病抗争（如癌症、器官衰竭、ICU重症等）。',                tw: '危重疾病，正在與危及生命的疾病抗爭（如癌症、器官衰竭、ICU重症等）。',                score: 0 },
      ],
    },

    { /* QKC6 — Criminal record (privacy-protected) */
      id: 'QKC6', section: 'social', scorable: true, noImprove: true,
      cn: '你是否有违法犯罪记录？',
      tw: '你是否有違法犯罪記錄？',
      subText: { cn: '🔒 本题完全匿名，答案仅用于评分计算，不会被存储、分享或关联到你的身份。', tw: '🔒 本題完全匿名，答案僅用於評分計算，不會被儲存、分享或關聯到你的身份。' },
      options: [
        { cn: '完全清白，没有任何违法犯罪记录。',                                                                                             tw: '完全清白，沒有任何違法犯罪記錄。',                                                                                             score: 4 },
        { cn: '仅有轻微违规，对人生没有实质影响（如交通罚款、已结案的小纠纷等）。',                                                             tw: '僅有輕微違規，對人生沒有實質影響（如交通罰款、已結案的小糾紛等）。',                                                             score: 3 },
        { cn: '有过严重违法行为但未被发现/没有官方记录。',                                                                                     tw: '有過嚴重違法行為但未被發現/沒有官方記錄。',                                                                                     score: 2 },
        { cn: '有轻微违法记录，并对生活产生了一定影响（如证件吊销、驾照吊销、资格证书撤销等）。',                                                tw: '有輕微違法記錄，並對生活產生了一定影響（如證件吊銷、駕照吊銷、資格證書撤銷等）。',                                                score: 1 },
        { cn: '有严重违法犯罪记录，对人生产生了重大影响（如入狱经历、职业发展受限、影响子女未来发展路径等）。',                                    tw: '有嚴重違法犯罪記錄，對人生產生了重大影響（如入獄經歷、職業發展受限、影響子女未來發展路徑等）。',                                    score: 0 },
      ],
    },

    { /* QKC7 — Living environment */
      id: 'QKC7', section: 'basic', scorable: true, noImprove: true,
      cn: '你目前的居住环境是？',
      tw: '你目前的居住環境是？',
      options: [
        { cn: '庄园级独栋建筑（别墅庄园、私人庄园等）。', tw: '莊園級獨棟建築（別墅莊園、私人莊園等）。', score: 4 },
        { cn: '豪华住宅。',              tw: '豪華住宅。',              score: 4 },
        { cn: '自有房产。',              tw: '自有房產。',              score: 4 },
        { cn: '家庭房产（父母/长辈）。',  tw: '家庭房產（父母/長輩）。',  score: 4 },
        { cn: '独立租住公寓。',          tw: '獨立租住公寓。',          score: 3 },
        { cn: '与熟人合租公寓。',        tw: '與熟人合租公寓。',        score: 3 },
        { cn: '与陌生人合租公寓。',      tw: '與陌生人合租公寓。',      score: 2 },
        { cn: '单人宿舍。',              tw: '單人宿舍。',              score: 2 },
        { cn: '多人宿舍。',              tw: '多人宿舍。',              score: 1 },
        { cn: '借住亲友家。',            tw: '借住親友家。',            score: 1 },
        { cn: '目前住在帐篷里。',        tw: '目前住在帳篷裡。',        score: 0 },
        { cn: '医院病房（长期住院中）。', tw: '醫院病房（長期住院中）。', score: 0 },
        { cn: '露宿街头（无家可归）。',   tw: '露宿街頭（無家可歸）。',   score: 0 },
      ],
    },

    { /* QKC8 — City tier */
      id: 'QKC8', section: 'basic', scorable: true, noImprove: true,
      cn: '你目前居住的地区属于哪种类型？',
      tw: '你目前居住的地區屬於哪種類型？',
      options: [
        { cn: '交通不便的偏远乡村。',                     tw: '交通不便的偏遠鄉村。',                     score: 0 },
        { cn: '交通便利的现代化村镇。',                   tw: '交通便利的現代化村鎮。',                   score: 1 },
        { cn: '小城镇/县城，或较偏远的城市区域。',         tw: '小城鎮/縣城，或較偏遠的城市區域。',         score: 2 },
        { cn: '大型县城或一般城市城区。',                 tw: '大型縣城或一般城市城區。',                 score: 2 },
        { cn: '省会城区或大型城市城区。',                 tw: '省會城區或大型城市城區。',                 score: 3 },
        { cn: '一线城市。',                                     tw: '一線城市。',                                     score: 4 },
      ],
    },

    { /* QKC8b — Diet & nutrition structure */
      id: 'QKC8b', section: 'basic', scorable: true,
      cn: '你是否关注饮食的营养结构？',
      tw: '你是否關注飲食的營養結構？',
      options: [
        { cn: '非常关注，会围绕均衡的宏量营养素、维生素和微量元素来规划饮食。', tw: '非常關注，會圍繞均衡的宏量營養素、維生素和微量元素來規劃飲食。', score: 4 },
        { cn: '比较关注，尽量吃得均衡但不会刻意计算。',                           tw: '比較關注，盡量吃得均衡但不會刻意計算。',                           score: 3 },
        { cn: '偶尔关注，了解基本知识但很少落实。',                                tw: '偶爾關注，了解基本知識但很少落實。',                                score: 1 },
        { cn: '完全不关注，怎么方便或好吃就怎么来。',                              tw: '完全不關注，怎麼方便或好吃就怎麼來。',                              score: 0 },
      ],
    },

    { /* QKC8c — Eating out core factors — hidden for 76+ */
      id: 'QKC8c', section: 'basic', scorable: true,
      showIf: function(s){ return s.QK1 === undefined || s.QK1 < 7; },
      cn: '你每次外出就餐时，核心考虑因素是什么？',
      tw: '你每次外出就餐時，核心考慮因素是什麼？',
      options: [
        { cn: '价格，优先考虑实惠和性价比。',             tw: '價格，優先考慮實惠和性價比。',             score: 1 },
        { cn: '口味，追求最好吃的，其他因素次要。',       tw: '口味，追求最好吃的，其他因素次要。',       score: 1 },
        { cn: '健康，根据营养、食材和烹饪方式来选择。',   tw: '健康，根據營養、食材和烹飪方式來選擇。',   score: 2 },
        { cn: '均衡，追求口味、健康和合理价格的综合平衡。', tw: '均衡，追求口味、健康和合理價格的綜合平衡。', score: 3 },
      ],
    },

    { /* QKC9 — Savings level for employed/entrepreneur/retired */
      id: 'QKC9', section: 'social', scorable: true,
      showIf: function(s){ return (s.QKC5 === undefined || s.QKC5 < 4) && s.QK3 !== 3; },
      cn: '除了每月的收入，你是否有额外的储备资金？',
      tw: '除了每月的收入，你是否有額外的儲備資金？',
      options: [
        { cn: '储备非常充足，长期突发情况和家庭大额支出都能从容应对。', tw: '儲備非常充足，長期突發情況和家庭大額支出都能從容應對。', score: 4 },
        { cn: '储备健康，日常稳定，遇到中大型意外开支也能承受。',         tw: '儲備健康，日常穩定，遇到中大型意外開支也能承受。',         score: 3 },
        { cn: '有基础储备，可应对短期波动，但难以承受长期压力。',         tw: '有基礎儲備，可應對短期波動，但難以承受長期壓力。',         score: 2 },
        { cn: '储备偏少，常接近月光状态。',                               tw: '儲備偏少，常接近月光狀態。',                               score: 1 },
        { cn: '处于净负债状态。',                                       tw: '處於淨負債狀態。',                                       score: 0 },
      ],
    },

    { /* QKC9_unemployed — Savings level for unemployed */
      id: 'QKC9_unemployed', section: 'social', scorable: true,
      showIf: function(s){ return (s.QKC5 === undefined || s.QKC5 < 4) && (s.QK3 === 3 || s.QK3 === 4); },
      cn: '储备资金情况如何？',
      tw: '儲備資金情況如何？',
      options: [
        { cn: '储备非常充足，长期突发情况和家庭大额支出都能从容应对。', tw: '儲備非常充足，長期突發情況和家庭大額支出都能從容應對。', score: 4 },
        { cn: '储备健康，日常稳定，遇到中大型意外开支也能承受。',         tw: '儲備健康，日常穩定，遇到中大型意外開支也能承受。',         score: 3 },
        { cn: '有基础储备，可应对短期波动，但难以承受长期压力。',         tw: '有基礎儲備，可應對短期波動，但難以承受長期壓力。',         score: 2 },
        { cn: '储备偏少，常接近月光状态。',                               tw: '儲備偏少，常接近月光狀態。',                               score: 1 },
        { cn: '处于净负债状态。',                                       tw: '處於淨負債狀態。',                                       score: 0 },
      ],
    },

    { /* QKC9_med — Savings vs medical expenses (shown only when critically ill or major accident) */
      id: 'QKC9_med', section: 'social', scorable: true,
      showIf: function(s){ return s.QKC5 !== undefined && s.QKC5 >= 4; },
      cn: '面对当前的治疗，你的储蓄是否足以覆盖医疗费用？',
      tw: '面對當前的治療，你的儲蓄是否足以覆蓋醫療費用？',
      options: [
        { cn: '完全覆盖，储蓄和/或保险可以从容应对全部治疗费用，没有经济压力。',          tw: '完全覆蓋，儲蓄和/或保險可以從容應對全部治療費用，沒有經濟壓力。',          score: 4 },
        { cn: '大部分可覆盖，能维持当前治疗，但长期或高端治疗可能造成经济紧张。',         tw: '大部分可覆蓋，能維持當前治療，但長期或高端治療可能造成經濟緊張。',         score: 3 },
        { cn: '部分可覆盖，需要向亲友借款或贷款才能继续治疗。',                           tw: '部分可覆蓋，需要向親友借款或貸款才能繼續治療。',                           score: 2 },
        { cn: '勉强支撑，医疗费用已造成严重经济困难，正在考虑放弃部分治疗。',              tw: '勉強支撐，醫療費用已造成嚴重經濟困難，正在考慮放棄部分治療。',              score: 1 },
        { cn: '无力承担，已负债或无法继续必要的医疗。',                                   tw: '無力承擔，已負債或無法繼續必要的醫療。',                                   score: 0 },
      ],
    },

    { /* QKC11 — Insurance — hidden for 85+ (commercial insurance age-limited) */
      id: 'QKC11', section: 'social', scorable: true,
      showIf: function(s){ return s.QK1 === undefined || s.QK1 < 8; },
      cn: '你是否有保障性保险？（健康险、重疾险、意外险等）',
      tw: '你是否有保障性保險？（健康險、重疾險、意外險等）',
      options: [
        { cn: '顶级商业保险，高端私立医疗、全球覆盖、VIP医院通道等。',               tw: '頂級商業保險，高端私立醫療、全球覆蓋、VIP醫院通道等。',               score: 4 },
        { cn: '全面覆盖，含重疾、医疗、意外和寿险。',                               tw: '全面覆蓋，含重疾、醫療、意外和壽險。',                               score: 4 },
        { cn: '基础商业险，医疗险或重疾险。',                                       tw: '基礎商業險，醫療險或重疾險。',                                       score: 3 },
        { cn: '仅有基本医疗保险（政府/社会医保，无商业补充）。',                      tw: '僅有基本醫療保險（政府/社會醫保，無商業補充）。',                      score: 1 },
        { cn: '完全没有保险。',                                                     tw: '完全沒有保險。',                                                     score: 0 },
      ],
    },



    /* ═══════════════════════════════════════════
       SECTION B — RELATIONSHIPS
       ═══════════════════════════════════════════ */

    { /* QKB1 — Relationship / marriage status */
      id: 'QKB1', section: 'social', scorable: true,
      cn: '你目前的感情与婚姻状况是？',
      tw: '你目前的感情與婚姻狀況是？',
      options: [
        /* 0 BA */ { cn: '从未谈过恋爱。',           tw: '從未談過戀愛。',           score: 1 },
        /* 1 BB */ { cn: '正在恋爱中。',             tw: '正在戀愛中。',             score: 3 },
        /* 2 BC */ { cn: '曾恋爱过，目前单身。',     tw: '曾戀愛過，目前單身。',     score: 2 },
        /* 3 BD */ { cn: '已婚，关系甜蜜幸福。',     tw: '已婚，關係甜蜜幸福。',     score: 4 },
        /* 4 BE */ { cn: '已婚，关系平淡例行。',     tw: '已婚，關係平淡例行。',     score: 3 },
        /* 5 BF */ { cn: '已婚，濒临破裂。',         tw: '已婚，瀕臨破裂。',         score: 1 },
        /* 6 BG */ { cn: '我曾出轨。',               tw: '我曾出軌。',               score: 0 },
        /* 7 BH */ { cn: '我曾出轨且被发现。',       tw: '我曾出軌且被發現。',       score: 0 },
        /* 8 BI */ { cn: '我的伴侣曾出轨。',         tw: '我的伴侶曾出軌。',         score: 1 },
        /* 9 BJ */ { cn: '离异，目前未婚。',         tw: '離異，目前未婚。',         score: 1 },
        /* 10 BK*/ { cn: '再婚。',                   tw: '再婚。',                   score: 3 },
        /* 11 BL*/ { cn: '丧偶。',                   tw: '喪偶。',                   score: 1 },
      ],
    },

    { /* QKB2 — Family relationship (under 76) */
      id: 'QKB2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK1 === undefined || s.QK1 < 7; },
      cn: '你和家人（父母或其他监护人）的关系如何？',
      tw: '你和家人（父母或其他監護人）的關係如何？',
      options: [
        { cn: '非常好，相互尊重，像成熟的朋友。', tw: '非常好，相互尊重，像成熟的朋友。', score: 4 },
        { cn: '不错，定期联系关心，但缺乏深度连接。', tw: '不錯，定期聯繫關心，但缺乏深度連接。', score: 3 },
        { cn: '疏远，维持表面和平，尽量不见面。', tw: '疏遠，維持表面和平，盡量不見面。', score: 1 },
        { cn: '令人窒息，充满控制、操纵或持续消耗。', tw: '令人窒息，充滿控制、操縱或持續消耗。', score: 0 },
        { cn: '家人已离世，生前关系良好。', tw: '家人已離世，生前關係良好。', score: 3 },
        { cn: '家人已离世，生前关系一般。', tw: '家人已離世，生前關係一般。', score: 2 },
      ],
    },

    { /* QKB2_elder — Family relationship (76+ retrospective — parents almost certainly deceased) */
      id: 'QKB2_elder', section: 'social', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 7; },
      cn: '回顾你与子女/最亲近家人的关系，你觉得如何？',
      tw: '回顧你與子女/最親近家人的關係，你覺得如何？',
      options: [
        { cn: '非常亲密，子女/家人经常陪伴，彼此尊重。', tw: '非常親密，子女/家人經常陪伴，彼此尊重。', score: 4 },
        { cn: '关系不错，偶有联系，但见面不多。', tw: '關係不錯，偶有聯繫，但見面不多。', score: 3 },
        { cn: '比较疏远，主要靠电话维持基本联系。', tw: '比較疏遠，主要靠電話維持基本聯繫。', score: 1 },
        { cn: '几乎没有联系，或关系紧张冷淡。', tw: '幾乎沒有聯繫，或關係緊張冷淡。', score: 0 },
        { cn: '没有在世的亲近家人。', tw: '沒有在世的親近家人。', score: 1 },
      ],
    },

    { /* QKB3 — Sex life — conditional on relationship status, hidden for 76+ */
      id: 'QKB3', section: 'social', scorable: true,
      showIf: function(s){
        if(s.QK1 !== undefined && s.QK1 >= 7) return false;
        return s.QKB1 !== undefined && [1,3,4,5,6,7,8,10].indexOf(s.QKB1) !== -1;
      },
      cn: '你对自己的性生活满意吗？',
      tw: '你對自己的性生活滿意嗎？',
      options: [
        { cn: '非常满意，频率和质量都很好。', tw: '非常滿意，頻率和質量都很好。', score: 4 },
        { cn: '大体满意，但还有提升空间。',   tw: '大體滿意，但還有提升空間。',   score: 3 },
        { cn: '不满意，频繁不匹配或频率极低。', tw: '不滿意，頻繁不匹配或頻率極低。', score: 1 },
        { cn: '基本没有，或是重大冲突/痛苦的来源。', tw: '基本沒有，或是重大衝突/痛苦的來源。', score: 0 },
      ],
    },

    { /* QKB4 — Children */
      id: 'QKB4', section: 'social', scorable: false, noImprove: true,
      showIf: function(s){
        return s.QKB1 !== undefined && s.QKB1 !== 0;
      },
      cn: '你有孩子吗？',
      tw: '你有孩子嗎？',
      options: [
        { cn: '有。', tw: '有。', score: 0 },
        { cn: '没有。', tw: '沒有。', score: 0 },
      ],
    },

    { /* QKB5b — Relationship with children */
      id: 'QKB5b', section: 'social', scorable: true,
      showIf: function(s){ return s.QKB4 === 0; },
      cn: '你和孩子的关系如何？',
      tw: '你和孩子的關係如何？',
      options: [
        { cn: '非常亲密，彼此信任、无话不谈，像朋友一样。', tw: '非常親密，彼此信任、無話不談，像朋友一樣。', score: 4 },
        { cn: '关系不错，有基本的关心和沟通，但不算特别亲近。', tw: '關係不錯，有基本的關心和溝通，但不算特別親近。', score: 3 },
        { cn: '关系一般，交流较少，感觉有距离感。', tw: '關係一般，交流較少，感覺有距離感。', score: 1 },
        { cn: '关系紧张或冷淡，经常冲突或几乎不联系。', tw: '關係緊張或冷淡，經常衝突或幾乎不聯繫。', score: 0 },
        { cn: '孩子还太小，暂时不涉及这个问题。', tw: '孩子還太小，暫時不涉及這個問題。', score: 3 },
      ],
    },

    { /* QKB5d — Behavioral logic toward children — hidden for 76+ (children are adults) */
      id: 'QKB5d', section: 'social', scorable: true, noImprove: true,
      showIf: function(s){ return s.QKB4 === 0 && (s.QK1 === undefined || s.QK1 < 7); },
      cn: '你觉得自己对孩子的行为逻辑更接近哪一种？',
      tw: '你覺得自己對孩子的行為邏輯更接近哪一種？',
      options: [
        { cn: '引导型，尊重孩子的独立性，以引导和启发为主，给予充分的成长空间。', tw: '引導型，尊重孩子的獨立性，以引導和啟發為主，給予充分的成長空間。', score: 4 },
        { cn: '民主型，与孩子平等沟通，共同协商决定，注重培养责任感。', tw: '民主型，與孩子平等溝通，共同協商決定，注重培養責任感。', score: 4 },
        { cn: '保护型，关爱有加，但有时会过度保护或包办，担心孩子受挫。', tw: '保護型，關愛有加，但有時會過度保護或包辦，擔心孩子受挫。', score: 2 },
        { cn: '权威型，严格管教，要求服从，注重纪律和规矩。', tw: '權威型，嚴格管教，要求服從，注重紀律和規矩。', score: 2 },
        { cn: '放任型，基本不管，让孩子自己解决一切问题。', tw: '放任型，基本不管，讓孩子自己解決一切問題。', score: 1 },
        { cn: '控制型，强烈干预孩子的每个选择，将自己的意愿强加于孩子。', tw: '控制型，強烈干預孩子的每個選擇，將自己的意願強加於孩子。', score: 0 },
      ],
    },

    { /* QKB6 — Siblings */
      id: 'QKB6', section: 'social', scorable: true,
      cn: '你和兄弟姐妹的关系如何？',
      tw: '你和兄弟姊妹的關係如何？',
      options: [
        { cn: '非常亲密，持续相互支持。', tw: '非常親密，持續相互支持。', score: 4 },
        { cn: '友好，节假日时互相联系。', tw: '友好，節假日時互相聯繫。', score: 3 },
        { cn: '疏远，很少联系。', tw: '疏遠，很少聯繫。', score: 1 },
        { cn: '敌对，持续冲突或已断绝往来。', tw: '敵對，持續衝突或已斷絕往來。', score: 0 },
        { cn: '独生子女。', tw: '獨生子女。', score: 2 },
      ],
    },


    /* ═══════════════════════════════════════════
       SECTION C — SKILLS, EXPERIENCES & PSYCHOLOGY
       ═══════════════════════════════════════════ */

    { /* QKD1 — Foreign language proficiency — hidden for 76+ */
      id: 'QKD1', section: 'identity', scorable: true,
      showIf: function(s){ return s.QK1 === undefined || s.QK1 < 7; },
      cn: '你的外语能力处于什么水平？',
      tw: '你的外語能力處於什麼水平？',
      options: [
        { cn: '我是语言天才，可以轻松驾驭多门语言，完全没有压力。', tw: '我是語言天才，可以輕鬆駕馭多門語言，完全沒有壓力。', score: 4 },
        { cn: '我可以用第二语言进行深度讨论（如涉及政治、哲学或科学话题）。', tw: '我可以用第二語言進行深度討論（如涉及政治、哲學或科學話題）。', score: 4 },
        { cn: '我可以完全掌握第二语言来应对学习任务或商务安排。', tw: '我可以完全掌握第二語言來應對學習任務或商務安排。', score: 3 },
        { cn: '我勉强可以用第二语言进行日常聊天和处理生活问题。', tw: '我勉強可以用第二語言進行日常聊天和處理生活問題。', score: 2 },
        { cn: '虽然学过第二语言，但完全不敢开口对话和听力交流。', tw: '雖然學過第二語言，但完全不敢開口對話和聽力交流。', score: 1 },
        { cn: '只会说母语，没有掌握其他语言的能力。', tw: '只會說母語，沒有掌握其他語言的能力。', score: 0 },
        { cn: '连普通话都说不好。', tw: '連國語都說不好。', score: 0 },
      ],
    },

    { /* QKD2 — Travel time (no children / children unknown) */
      id: 'QKD2', section: 'identity', scorable: true,
      showIf: function(s){ return s.QKB4 === undefined || s.QKB4 !== 0; },
      cn: '你过去或现在，是否有足够的时间去旅行？',
      tw: '你過去或現在，是否有足夠的時間去旅行？',
      options: [
        { cn: '我目前保持着旅行习惯，每年都会安排出行。', tw: '我目前保持著旅行習慣，每年都會安排出行。', score: 4 },
        { cn: '我过去去过国内很多地方，但现在已经没有足够时间继续旅行了。', tw: '我過去去過國內很多地方，但現在已經沒有足夠時間繼續旅行了。', score: 3 },
        { cn: '我一直想去旅行，但被各种原因拖住了。', tw: '我一直想去旅行，但被各種原因拖住了。', score: 1 },
        { cn: '完全没有长途旅行经历（出省）。', tw: '完全沒有長途旅行經歷（出省）。', score: 0 },
        { cn: '我对旅行完全没有兴趣。', tw: '我對旅行完全沒有興趣。', score: 1 },
      ],
    },

    { /* QKD2_parent — Travel time (has children) */
      id: 'QKD2_parent', section: 'identity', scorable: true,
      showIf: function(s){ return s.QKB4 === 0; },
      cn: '你过去或现在，是否有足够的时间去旅行？',
      tw: '你過去或現在，是否有足夠的時間去旅行？',
      options: [
        { cn: '我有足够的时间旅行，而且总是带着妻子、孩子和老人一起出行。', tw: '我有足夠的時間旅行，而且總是帶著妻子、孩子和老人一起出行。', score: 4 },
        { cn: '我目前保持着旅行习惯，每年都会安排出行。', tw: '我目前保持著旅行習慣，每年都會安排出行。', score: 4 },
        { cn: '我过去去过国内很多地方，但现在已经没有足够时间继续旅行了。', tw: '我過去去過國內很多地方，但現在已經沒有足夠時間繼續旅行了。', score: 3 },
        { cn: '我一直想去旅行，但被各种原因拖住了。', tw: '我一直想去旅行，但被各種原因拖住了。', score: 1 },
        { cn: '完全没有长途旅行经历（出省）。', tw: '完全沒有長途旅行經歷（出省）。', score: 0 },
        { cn: '我对旅行完全没有兴趣。', tw: '我對旅行完全沒有興趣。', score: 1 },
      ],
    },

    { /* QKD3_minor — Overseas travel (under 18, no work option) */
      id: 'QKD3_minor', section: 'identity', scorable: true, multi: true, noAutoAdvance: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 === 0; },
      cn: '你的海外旅行经历如何？（可多选，部分选项为单选）',
      tw: '你的海外旅行經歷如何？（可多選，部分選項為單選）',
      options: [
        { cn: '我是环球旅行者，足迹遍布世界各地。', tw: '我是環球旅行者，足跡遍佈世界各地。', score: 4, exclusive: true },
        { cn: '我去过1-3个需要签证的发达国家。', tw: '我去過1-3個需要簽證的發達國家。', score: 2 },
        { cn: '我有海外留学经历。', tw: '我有海外留學經歷。', score: 2 },
        { cn: '我持有签证或满足其他门槛国家的旅行条件，但尚未出发。', tw: '我持有簽證或滿足其他門檻國家的旅行條件，但尚未出發。', score: 1 },
        { cn: '我去过一些免签国家。', tw: '我去過一些免簽國家。', score: 1 },
        { cn: '我从未出过国。', tw: '我從未出過國。', score: 0, exclusive: true },
        { cn: '我不喜欢任何海外旅行。', tw: '我不喜歡任何海外旅行。', score: 0, exclusive: true },
      ],
    },

    { /* QKD3 — Overseas travel (18+, includes work option) */
      id: 'QKD3', section: 'identity', scorable: true, multi: true, noAutoAdvance: true,
      showIf: function(s){ return s.QK1 === undefined || s.QK1 >= 1; },
      cn: '你的海外旅行经历如何？（可多选，部分选项为单选）',
      tw: '你的海外旅行經歷如何？（可多選，部分選項為單選）',
      options: [
        { cn: '我是环球旅行者，足迹遍布世界各地。', tw: '我是環球旅行者，足跡遍佈世界各地。', score: 4, exclusive: true },
        { cn: '我去过1-3个需要签证的发达国家。', tw: '我去過1-3個需要簽證的發達國家。', score: 2 },
        { cn: '我有海外工作经历。', tw: '我有海外工作經歷。', score: 2 },
        { cn: '我有海外留学经历。', tw: '我有海外留學經歷。', score: 2 },
        { cn: '我持有签证或满足其他门槛国家的旅行条件，但尚未出发。', tw: '我持有簽證或滿足其他門檻國家的旅行條件，但尚未出發。', score: 1 },
        { cn: '我去过一些免签国家。', tw: '我去過一些免簽國家。', score: 1 },
        { cn: '我从未出过国。', tw: '我從未出過國。', score: 0, exclusive: true },
        { cn: '我不喜欢任何海外旅行。', tw: '我不喜歡任何海外旅行。', score: 0, exclusive: true },
      ],
    },

    { /* QKD4 — Professional skills (multi-select) — hidden for 76+ (no longer career-relevant) */
      id: 'QKD4', section: 'identity', scorable: true, multi: true, noAutoAdvance: true,
      showIf: function(s){ return s.QK1 === undefined || s.QK1 < 7; },
      cn: '以下哪些专业技能或成就适用于你？（可多选）',
      tw: '以下哪些專業技能或成就適用於你？（可多選）',
      options: [
        { cn: '持有职业资质或专业证书（如会计、法律、医疗、教师、工程类）。', tw: '持有職業資質或專業證書（如會計、法律、醫療、教師、工程類）。', score: 4 },
        { cn: '可独立完成有偿项目，并有可验证作品（编程/设计/运营/内容等）。', tw: '可獨立完成有償項目，並有可驗證作品（編程/設計/運營/內容等）。', score: 3 },
        { cn: '掌握稳定市场需求的实用技能（维修、餐饮、美业、物流等）。', tw: '掌握穩定市場需求的實用技能（維修、餐飲、美業、物流等）。', score: 3 },
        { cn: '具备蓝领技术专长（焊接、电工、水暖、机械操作、建筑施工等），靠手艺吃饭。', tw: '具備藍領技術專長（焊接、電工、水暖、機械操作、建築施工等），靠手藝吃飯。', score: 3 },
        { cn: '运营自媒体且拥有一定量的粉丝/关注者。', tw: '運營自媒體且擁有一定量的粉絲/關注者。', score: 3 },
        { cn: '能够独立产出原创高质量内容（文章、视频、音乐、艺术作品等）。', tw: '能夠獨立產出原創高品質內容（文章、影片、音樂、藝術作品等）。', score: 3 },
        { cn: '具备稳定职场基础能力（Excel、演示、沟通协作等）。', tw: '具備穩定職場基礎能力（Excel、演示、溝通協作等）。', score: 2 },
        { cn: '具备基础数字化/AI辅助工作能力（办公自动化、基础数据处理）。', tw: '具備基礎數位化/AI輔助工作能力（辦公自動化、基礎數據處理）。', score: 2 },
        { cn: '没有特定的市场化技能。', tw: '沒有特定的市場化技能。', score: 0, exclusive: true },
      ],
    },

    { /* QKD7 — Persistence */
      id: 'QKD7', section: 'identity', scorable: true,
      cn: '你能坚持做一件事超过六个月吗？',
      tw: '你能堅持做一件事超過六個月嗎？',
      options: [
        { cn: '轻松，我有钢铁般的自律，目标成为不可妥协的习惯。', tw: '輕鬆，我有鋼鐵般的自律，目標成為不可妥協的習慣。', score: 4 },
        { cn: '通常可以，如果能看到正向反馈或结果。', tw: '通常可以，如果能看到正向反饋或結果。', score: 3 },
        { cn: '很少，我依靠动力，但动力消退得很快。', tw: '很少，我依靠動力，但動力消退得很快。', score: 1 },
        { cn: '从不，每个新计划都在几周内放弃。', tw: '從不，每個新計劃都在幾週內放棄。', score: 0 },
      ],
    },

    { /* QKD8 — Emotional management */
      id: 'QKD8', section: 'identity', scorable: true,
      cn: '你的情绪管理能力如何？',
      tw: '你的情緒管理能力如何？',
      options: [
        { cn: '极度稳定，危机中保持冷静和客观。', tw: '極度穩定，危機中保持冷靜和客觀。', score: 4 },
        { cn: '总体良好，能快速处理负面情绪。', tw: '總體良好，能快速處理負面情緒。', score: 3 },
        { cn: '易激动，容易被触发，但事后会道歉。', tw: '易激動，容易被觸發，但事後會道歉。', score: 1 },
        { en: "Destructive — my anger/sadness regularly damages my life and relationships.", cn: '破坏性，我的愤怒/悲伤经常损害生活和关系。', tw: '破壞性，我的憤怒/悲傷經常損害生活和關係。', score: 0 },
      ],
    },

    { /* QKD9 — Life agency — hidden for under 18 */
      id: 'QKD9', section: 'identity', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 !== 0; },
      cn: '你是否觉得目前的生活是自己选择的结果？',
      tw: '你是否覺得目前的生活是自己選擇的結果？',
      options: [
        { cn: '100%是，我完全掌控自己的人生路径。', tw: '100%是，我完全掌控自己的人生路徑。', score: 4 },
        { cn: '大部分是，尽管环境也起了一定作用。', tw: '大部分是，儘管環境也起了一定作用。', score: 3 },
        { cn: '大部分不是，感觉被社会和家庭推着走。', tw: '大部分不是，感覺被社會和家庭推著走。', score: 1 },
        { cn: '完全不是，我是环境/命运的受害者。', tw: '完全不是，我是環境/命運的受害者。', score: 0 },
      ],
    },

    { /* QKD12 — Sustained focus — hidden for 76+ (cognitive decline sensitivity) */
      id: 'QKD12', section: 'identity', scorable: true,
      showIf: function(s){ return s.QK1 === undefined || s.QK1 < 7; },
      cn: '你能否在做事时持续保持专注而不分心？',
      tw: '你能否在做事時持續保持專注而不分心？',
      options: [
        { cn: '完全可以，能连续深度专注数小时，几乎不受干扰。',   tw: '完全可以，能連續深度專注數小時，幾乎不受干擾。',   score: 4 },
        { cn: '大部分时候可以，但需要偶尔短暂休息。',               tw: '大部分時候可以，但需要偶爾短暫休息。',               score: 3 },
        { cn: '一般，经常走神，需要反复把自己拉回来。',             tw: '一般，經常走神，需要反覆把自己拉回來。',             score: 1 },
        { cn: '很难，几乎无法长时间集中注意力。',                   tw: '很難，幾乎無法長時間集中注意力。',                   score: 0 },
      ],
    },

    { /* QKD14 — Risk appetite — hidden for 76+ (investment/career oriented) */
      id: 'QKD14', section: 'identity', scorable: true,
      showIf: function(s){ return s.QK1 === undefined || s.QK1 < 7; },
      cn: '你是否热衷于挑战高风险的事情？',
      tw: '你是否熱衷於挑戰高風險的事情？',
      options: [
        { cn: '是的，我主动寻求经过评估的风险，享受突破边界。',                   tw: '是的，我主動尋求經過評估的風險，享受突破邊界。',                   score: 4 },
        { cn: '有时候，当回报明显大于风险时我会尝试。',                           tw: '有時候，當回報明顯大於風險時我會嘗試。',                           score: 3 },
        { cn: '很少，我更喜欢稳定，只在必要时才冒险。',                           tw: '很少，我更喜歡穩定，只在必要時才冒險。',                           score: 2 },
        { cn: '从不，我回避一切风险，只做安全熟悉的事。',                         tw: '從不，我迴避一切風險，只做安全熟悉的事。',                         score: 1 },
      ],
    },

    { /* QKD15 — Information acquisition habits */
      id: 'QKD15', section: 'identity', scorable: true, noImprove: true,
      cn: '你是否具备高价值的信息获取习惯？',
      tw: '你是否具備高價值的資訊獲取習慣？',
      options: [
        { cn: '我善于从各种媒体和日常生活中寻找信息，并具备辨别真伪的能力。', tw: '我善於從各種媒體和日常生活中尋找資訊，並具備辨別真偽的能力。', score: 4 },
        { cn: '我能接受来自不同角度的信息，对我来说，一个问题有两种不同的声音是正常的。', tw: '我能接受來自不同角度的資訊，對我來說，一個問題有兩種不同的聲音是正常的。', score: 4 },
        { cn: '我对所有信息都非常谨慎，逻辑推理对我来说很重要。', tw: '我對所有資訊都非常謹慎，邏輯推理對我來說很重要。', score: 3 },
        { cn: '相比争议性的意见，我最可能接受权威认证的信息。', tw: '相比爭議性的意見，我最可能接受權威認證的資訊。', score: 2 },
        { cn: '我信奉"眼见为实"。', tw: '我信奉「眼見為實」。', score: 1 },
        { cn: '我倾向于相信非官方的说法。', tw: '我傾向於相信非官方的說法。', score: 0 },
        { cn: '我从不关心这些，也从来没有想过。', tw: '我從不關心這些，也從來沒有想過。', score: 0 },
      ],
    },

    { /* QKB7 — Social circle rescue capability (moved from bonus) */
      id: 'QKB7', section: 'social', scorable: true,
      cn: '你社交圈的"硬核救援能力"如何？',
      tw: '你社交圈的「硬核救援能力」如何？',
      options: [
        { cn: '如果明天需要一大笔应急资金（如约30万元人民币），我能很快从可信的人际关系中借到。', tw: '如果明天需要一大筆應急資金（如約30萬元人民幣），我能很快從可信的人際關係中借到。', score: 4 },
        { cn: '我能从亲戚处凑到一笔体面的应急资金。', tw: '我能從親戚處湊到一筆體面的應急資金。', score: 3 },
        { cn: '可能能借到一小笔钱，但远不足以应对重大紧急情况。', tw: '可能能借到一小筆錢，但遠不足以應對重大緊急情況。', score: 1 },
        { cn: '如果我落难，没人愿意借给我一分钱。', tw: '如果我落難，沒人願意借給我一分錢。', score: 0 },
      ],
    },


    /* ═══════════════════════════════════════════
       SECTION C-TRAITS — Personal Traits & Conditions (all statuses)
       ═══════════════════════════════════════════ */

    { /* QKT1 — Self-harm tendency */
      id: 'QKT1', section: 'identity', scorable: true,
      cn: '你是否有自残倾向？',
      tw: '你是否有自殘傾向？',
      options: [
        { cn: '从未有过，我珍视并爱护自己的身体。', tw: '從未有過，我珍視並愛護自己的身體。', score: 4 },
        { cn: '偶尔会有伤害自己的念头，但从未付诸行动。', tw: '偶爾會有傷害自己的念頭，但從未付諸行動。', score: 2 },
        { cn: '曾经有过自残行为，但现在已经停止。', tw: '曾經有過自殘行為，但現在已經停止。', score: 1 },
        { cn: '目前有自残行为，或经常想要伤害自己。', tw: '目前有自殘行為，或經常想要傷害自己。', score: 0 },
      ],
    },

    { /* QKT2 — Allergies */
      id: 'QKT2', section: 'basic', scorable: true,
      cn: '你是否对某些食物、物质或环境存在过敏反应？',
      tw: '你是否對某些食物、物質或環境存在過敏反應？',
      options: [
        { cn: '没有任何已知的过敏。', tw: '沒有任何已知的過敏。', score: 4 },
        { cn: '有轻微过敏（如花粉、尘螨），但症状可控。', tw: '有輕微過敏（如花粉、塵蟎），但症狀可控。', score: 3 },
        { cn: '有中度过敏（如某些食物、药物），需要避免接触。', tw: '有中度過敏（如某些食物、藥物），需要避免接觸。', score: 2 },
        { cn: '有严重过敏（如花生、海鲜、青霉素），可能危及生命。', tw: '有嚴重過敏（如花生、海鮮、青黴素），可能危及生命。', score: 0 },
      ],
    },

    { /* QKT3 — Mental health conditions */
      id: 'QKT3', section: 'identity', scorable: true,
      cn: '你是否被诊断或怀疑自己存在某种精神或心理健康问题？',
      tw: '你是否被診斷或懷疑自己存在某種精神或心理健康問題？',
      options: [
        { cn: '没有，我的心理健康状态良好。', tw: '沒有，我的心理健康狀態良好。', score: 4 },
        { cn: '偶尔会有焦虑或情绪低落，但属于正常范围。', tw: '偶爾會有焦慮或情緒低落，但屬於正常範圍。', score: 3 },
        { cn: '被诊断有轻度心理问题（如轻度焦虑、抑郁倾向），正在管理。', tw: '被診斷有輕度心理問題（如輕度焦慮、憂鬱傾向），正在管理。', score: 2 },
        { cn: '被诊断有中度心理问题，需要持续治疗或药物辅助。', tw: '被診斷有中度心理問題，需要持續治療或藥物輔助。', score: 1 },
        { cn: '被诊断有严重精神疾病（如双相、精神分裂、重度抑郁），严重影响生活。', tw: '被診斷有嚴重精神疾病（如雙相、精神分裂、重度憂鬱），嚴重影響生活。', score: 0 },
      ],
    },

    { /* QKT4 — Sense of humor */
      id: 'QKT4', section: 'identity', scorable: true,
      cn: '你认为自己是一个有幽默感的人吗？',
      tw: '你認為自己是一個有幽默感的人嗎？',
      options: [
        { cn: '是的，我擅长发现生活中的趣味，能让周围的人开心。', tw: '是的，我擅長發現生活中的趣味，能讓周圍的人開心。', score: 4 },
        { cn: '还可以，我能理解大多数笑话，偶尔也能逗笑别人。', tw: '還可以，我能理解大多數笑話，偶爾也能逗笑別人。', score: 3 },
        { cn: '一般，我不太擅长讲笑话，但能欣赏别人的幽默。', tw: '一般，我不太擅長講笑話，但能欣賞別人的幽默。', score: 2 },
        { cn: '不太有，我经常get不到笑点，或被认为太严肃。', tw: '不太有，我經常get不到笑點，或被認為太嚴肅。', score: 1 },
        { cn: '完全没有，我对幽默无感，甚至觉得很多笑话很无聊。', tw: '完全沒有，我對幽默無感，甚至覺得很多笑話很無聊。', score: 0 },
      ],
    },

    { /* QKT5 — Attractiveness to opposite sex */
      id: 'QKT5', section: 'identity', scorable: true,
      cn: '你自认为对异性的吸引力如何？',
      tw: '你自認為對異性的吸引力如何？',
      options: [
        { cn: '非常有吸引力，经常收到明确的示好和追求。', tw: '非常有吸引力，經常收到明確的示好和追求。', score: 4 },
        { cn: '有一定吸引力，偶尔会被搭讪或表达好感。', tw: '有一定吸引力，偶爾會被搭訕或表達好感。', score: 3 },
        { cn: '一般水平，不算出众但也不差。', tw: '一般水平，不算出眾但也不差。', score: 2 },
        { cn: '吸引力较弱，很少收到异性的主动关注。', tw: '吸引力較弱，很少收到異性的主動關注。', score: 1 },
        { cn: '几乎没有吸引力，长期缺乏异性的关注和兴趣。', tw: '幾乎沒有吸引力，長期缺乏異性的關注和興趣。', score: 0 },
      ],
    },

    { /* QKT14 — Color blindness */
      id: 'QKT14', section: 'basic', scorable: true,
      cn: '你是否患有色弱或色盲？',
      tw: '你是否患有色弱或色盲？',
      options: [
        { cn: '完全没有，色彩辨别能力正常。', tw: '完全沒有，色彩辨別能力正常。', score: 4 },
        { cn: '轻微色弱，某些相近颜色区分有困难，但不影响生活。', tw: '輕微色弱，某些相近顏色區分有困難，但不影響生活。', score: 3 },
        { cn: '中度色弱/色盲，部分颜色无法区分，某些场景会受影响。', tw: '中度色弱/色盲，部分顏色無法區分，某些場景會受影響。', score: 2 },
        { cn: '较严重色盲，红绿色或其他常见颜色组合无法区分。', tw: '較嚴重色盲，紅綠色或其他常見顏色組合無法區分。', score: 1 },
        { cn: '严重色盲，几乎无法分辨颜色，只能看到明暗。', tw: '嚴重色盲，幾乎無法分辨顏色，只能看到明暗。', score: 0 },
      ],
    },

    { /* QKT16 — Language expression ability */
      id: 'QKT16', section: 'identity', scorable: true,
      cn: '你的语言表达能力如何？',
      tw: '你的語言表達能力如何？',
      options: [
        { cn: '非常出色，表达清晰有条理，能准确传达复杂想法。', tw: '非常出色，表達清晰有條理，能準確傳達複雜想法。', score: 4 },
        { cn: '良好，能正常表达，偶尔会有词不达意的情况。', tw: '良好，能正常表達，偶爾會有詞不達意的情況。', score: 3 },
        { cn: '一般，有时表达不够清晰，需要重复或解释。', tw: '一般，有時表達不夠清晰，需要重複或解釋。', score: 2 },
        { cn: '较差，经常说不清楚，别人难以理解我的意思。', tw: '較差，經常說不清楚，別人難以理解我的意思。', score: 1 },
        { cn: '很差，有口吃或严重的表达障碍，沟通很困难。', tw: '很差，有口吃或嚴重的表達障礙，溝通很困難。', score: 0 },
      ],
    },

    /* ═══════════════════════════════════════════
       SECTION C-AGE — 56–75 / 76–100 targeted modules
       ═══════════════════════════════════════════ */
    { /* QKS56_1 — 56-75: chronic condition management */
      id: 'QKS56_1', section: 'basic', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 5 && s.QK1 <= 6; },
      cn: '你目前对慢性健康指标（血压、血糖、血脂等）的管理情况如何？',
      tw: '你目前對慢性健康指標（血壓、血糖、血脂等）的管理情況如何？',
      options: [
        { cn: '管理非常到位，规律监测且指标稳定。', tw: '管理非常到位，規律監測且指標穩定。', score: 4 },
        { cn: '总体可控，偶有波动。', tw: '總體可控，偶有波動。', score: 3 },
        { cn: '管理较弱，检查不规律且波动频繁。', tw: '管理較弱，檢查不規律且波動頻繁。', score: 1 },
        { cn: '管理较差，无稳定方案，已明显影响生活。', tw: '管理較差，無穩定方案，已明顯影響生活。', score: 0 },
      ],
    },
    { /* QKS56_2 — 56-75: retirement/career transition security */
      id: 'QKS56_2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 5 && s.QK1 <= 6; },
      cn: '你当前的退休过渡安排（收入、保障与家庭角色）稳健程度如何？',
      tw: '你當前的退休過渡安排（收入、保障與家庭角色）穩健程度如何？',
      options: [
        { cn: '高度稳健，长期安排清晰，不确定性低。', tw: '高度穩健，長期安排清晰，不確定性低。', score: 4 },
        { cn: '基本稳健，核心安排已覆盖，仍有少量缺口。', tw: '基本穩健，核心安排已覆蓋，仍有少量缺口。', score: 3 },
        { cn: '部分稳健，仍有多项关键事项未落实。', tw: '部分穩健，仍有多項關鍵事項未落實。', score: 1 },
        { cn: '不稳健，在收入/保障/角色方面存在明显不确定性。', tw: '不穩健，在收入/保障/角色方面存在明顯不確定性。', score: 0 },
      ],
    },
    { /* QKS56_3 — 56-75: social vitality */
      id: 'QKS56_3', section: 'identity', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 5 && s.QK1 <= 6; },
      cn: '你在这一年龄阶段的社交与生活节律活跃度如何？',
      tw: '你在這一年齡階段的社交與生活節律活躍度如何？',
      options: [
        { cn: '非常活跃，关系稳定且有规律的高质量活动。', tw: '非常活躍，關係穩定且有規律的高品質活動。', score: 4 },
        { cn: '中等活跃，仍保持一定社交与个人安排。', tw: '中等活躍，仍保持一定社交與個人安排。', score: 3 },
        { cn: '活跃度偏低，社交圈收缩，生活节奏变弱。', tw: '活躍度偏低，社交圈收縮，生活節奏變弱。', score: 1 },
        { cn: '活跃度很低，经常孤立且日常缺乏结构。', tw: '活躍度很低，經常孤立且日常缺乏結構。', score: 0 },
      ],
    },
    { /* QKS76_1 — 76-100: functional independence */
      id: 'QKS76_1', section: 'basic', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 7 && s.QK1 <= 8; },
      cn: '你当前在日常生活中的自理与行动独立程度如何？',
      tw: '你當前在日常生活中的自理與行動獨立程度如何？',
      options: [
        { cn: '独立性很高，可安全完成大多数日常活动。', tw: '獨立性很高，可安全完成大多數日常活動。', score: 4 },
        { cn: '基本独立，个别事项需协助。', tw: '基本獨立，個別事項需協助。', score: 3 },
        { cn: '独立性受限，多项日常事务需要固定协助。', tw: '獨立性受限，多項日常事務需要固定協助。', score: 1 },
        { cn: '独立性较低，长期依赖照护支持。', tw: '獨立性較低，長期依賴照護支持。', score: 0 },
      ],
    },
    { /* QKS76_2 — 76-100: safety and medical continuity */
      id: 'QKS76_2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 7 && s.QK1 <= 8; },
      cn: '你当前在居家安全与医疗连续性（防跌倒、紧急联系人、规律复诊）方面是否完善？',
      tw: '你當前在居家安全與醫療連續性（防跌倒、緊急聯絡人、規律複診）方面是否完善？',
      options: [
        { cn: '体系完善且稳定，有明确流程和应急预案。', tw: '體系完善且穩定，有明確流程和應急預案。', score: 4 },
        { cn: '大体完善，关键事项已覆盖，仍有少量缺口。', tw: '大體完善，關鍵事項已覆蓋，仍有少量缺口。', score: 3 },
        { cn: '部分完善，关键环节仍较薄弱。', tw: '部分完善，關鍵環節仍較薄弱。', score: 1 },
        { cn: '尚不完善，存在明显安全或就医连续性风险。', tw: '尚不完善，存在明顯安全或就醫連續性風險。', score: 0 },
      ],
    },
    { /* QKS76_3 — 76-100: emotional security */
      id: 'QKS76_3', section: 'identity', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 7 && s.QK1 <= 8; },
      cn: '你在当前人生阶段的情绪安稳感与内在平和度如何？',
      tw: '你在當前人生階段的情緒安穩感與內在平和度如何？',
      options: [
        { cn: '非常稳定，内心平和，意义感与归属感明确。', tw: '非常穩定，內心平和，意義感與歸屬感明確。', score: 4 },
        { cn: '总体稳定，偶有担忧但可调节。', tw: '總體穩定，偶有擔憂但可調節。', score: 3 },
        { cn: '安稳感偏弱，孤独/焦虑/低落出现频率较高。', tw: '安穩感偏弱，孤獨/焦慮/低落出現頻率較高。', score: 1 },
        { cn: '安稳感较弱，持续情绪困扰已影响生活质量。', tw: '安穩感較弱，持續情緒困擾已影響生活品質。', score: 0 },
      ],
    },


    /* ═══════════════════════════════════════════
       SECTION BONUS — SSR LEVEL
       ═══════════════════════════════════════════ */

    /* ── General Bonus (all users) ── */

    { /* QKBON_AB8 — Elite Achievement Badges bonus (employed / entrepreneur / on-break).
         Refactored from exhaustive job-title list to 3 broad impact/scarcity tiers
         to fix point inflation and avoid the taxonomy trap. */
      id: 'QKBON_AB8', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 1 || s.QK3 === 2 || s.QK3 === 3; },
      cn: '你是否属于以下特定职业？',
      tw: '你是否屬於以下特定職業？',
      options: [
        /* A · +15 — National-Level / Top-Tier Core Contributors */
        {
          cn: '高级别公职人员或顶尖科研人员（航天、国家级公职、前沿科技顶级研发等）',
          tw: '高級別公職人員或頂尖科研人員（航太、國家級公職、前沿科技頂級研發等）',
          score: 15
        },
        /* B · +10 — High Social Influence / Executive Power */
        {
          cn: '高社会影响力或决策者（大型企业高层、知名公众人物、高级司法人员等）',
          tw: '高社會影響力或決策者（大型企業高層、知名公眾人物、高級司法人員等）',
          score: 10
        },
        /* C · +5 — High-Barrier Scarce Professionals */
        {
          cn: '极高执业壁垒的稀缺专业人士（执业医师、高校教授、持照飞行员、职业运动员等）',
          tw: '極高執業壁壘的稀缺專業人士（執業醫師、高校教授、持照飛行員、職業運動員等）',
          score: 5
        },
        /* D · +0 — None of the above */
        {
          cn: '暂不属于以上特定高壁垒区间',
          tw: '暫不屬於以上特定高壁壘區間',
          score: 0
        },
      ],
    },

    { id: 'QKBON_G1', section: 'bonus', scorable: true, bonus: true,
      cn: '你是否曾成为一个被广泛讨论的公众人物？',
      tw: '你是否曾成為一個被廣泛討論的公眾人物？',
      options: [
        { cn: '是，我在全球或全国范围内广为人知（如知名企业家、政治人物、国际明星等）。', tw: '是，我在全球或全國範圍內廣為人知（如知名企業家、政治人物、國際明星等）。', score: 10 },
        { cn: '是，我在某个行业或领域内有很高的知名度和影响力。', tw: '是，我在某個行業或領域內有很高的知名度和影響力。', score: 6 },
        { cn: '是，我在地方/区域范围内有一定的公众知名度（如地方媒体报道、区域性公众人物）。', tw: '是，我在地方/區域範圍內有一定的公眾知名度（如地方媒體報導、區域性公眾人物）。', score: 4 },
        { cn: '是，我在网络上有一定影响力（如自媒体大V、拥有大量粉丝的内容创作者）。', tw: '是，我在網路上有一定影響力（如自媒體大V、擁有大量粉絲的內容創作者）。', score: 4 },
        { cn: '曾短暂受到公众关注（如因某事件被报道、短暂走红），但已回归普通生活。', tw: '曾短暫受到公眾關注（如因某事件被報導、短暫走紅），但已回歸普通生活。', score: 2 },
        { cn: '没有，我是普通市民。', tw: '沒有，我是普通市民。', score: 0 },
      ],
    },

    { id: 'QKBON_G3', section: 'bonus', scorable: true, bonus: true,
      cn: '你是否曾凭极大的幸运在致命灾难中幸存？',
      tw: '你是否曾憑極大的幸運在致命災難中倖存？',
      options: [
        { cn: '是，在近乎零生还率的事件中（重大事故、重病危机等）毫发无损。', tw: '是，在近乎零生還率的事件中（重大事故、重病危機等）毫髮無損。', score: 10 },
        { cn: '安全脱离了高度危险的处境。', tw: '安全脫離了高度危險的處境。', score: 4 },
        { cn: '没有此类极端经历。', tw: '沒有此類極端經歷。', score: 0 },
      ],
    },

    { id: 'QKBON_G7', section: 'bonus', scorable: true, bonus: true,
      cn: '你是否对某项高度细分的专业技能投入了大量刻意练习，并取得了客观认可的资质或排名？',
      tw: '你是否對某項高度細分的專業技能投入了大量刻意練習，並取得了客觀認可的資質或排名？',
      options: [
        { cn: '是，我在某细分领域是无可争议的国家级/世界级大师或顶级专家。', tw: '是，我在某細分領域是無可爭議的國家級/世界級大師或頂級專家。', score: 10 },
        { cn: '我获得了国家级专业认证或在全国性比赛/评选中名列前茅。', tw: '我獲得了國家級專業認證或在全國性比賽/評選中名列前茅。', score: 8 },
        { cn: '我在省级/区域级别获得了专业认可或奖项。', tw: '我在省級/區域級別獲得了專業認可或獎項。', score: 6 },
        { cn: '我在行业内被同行公认为资深专家，拥有丰富实战经验和口碑。', tw: '我在行業內被同行公認為資深專家，擁有豐富實戰經驗和口碑。', score: 5 },
        { cn: '我持有高含金量的行业证书或通过了高难度的专业考试。', tw: '我持有高含金量的行業證書或通過了高難度的專業考試。', score: 4 },
        { cn: '我技艺精湛，投入了大量练习，但尚未获得正式的高级认可或排名。', tw: '我技藝精湛，投入了大量練習，但尚未獲得正式的高級認可或排名。', score: 2 },
        { cn: '没有。', tw: '沒有。', score: 0 },
      ],
    },


    { id: 'QKBON_G8', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return (s.QKC5 === undefined || s.QKC5 < 4) && s.QK3 !== 5; },
      cn: '你是否完成过极限体能挑战？（如全程马拉松、铁人三项、长距离骑行、百公里越野、登山探险等）',
      tw: '你是否完成過極限體能挑戰？（如全程馬拉松、鐵人三項、長距離騎行、百公里越野、登山探險等）',
      options: [
        { cn: '多次完成极限挑战并获得官方认证（如3次以上全马、完赛大铁、百公里越野等）。', tw: '多次完成極限挑戰並獲得官方認證（如3次以上全馬、完賽大鐵、百公里越野等）。', score: 10 },
        { cn: '完成过全程马拉松（42.195公里）或同等难度的官方认证赛事。', tw: '完成過全程馬拉松（42.195公里）或同等難度的官方認證賽事。', score: 8 },
        { cn: '完成过半程马拉松（21公里）或奥运标准铁人三项（51.5公里）。', tw: '完成過半程馬拉松（21公里）或奧運標準鐵人三項（51.5公里）。', score: 6 },
        { cn: '完成过超长距离骑行（200公里以上）或登山探险（海拔5000米以上）。', tw: '完成過超長距離騎行（200公里以上）或登山探險（海拔5000米以上）。', score: 6 },
        { cn: '正在系统训练中，已完成10公里以上跑步或短距离铁人三项。', tw: '正在系統訓練中，已完成10公里以上跑步或短距離鐵人三項。', score: 4 },
        { cn: '有定期运动习惯，但尚未挑战过长距离耐力项目。', tw: '有定期運動習慣，但尚未挑戰過長距離耐力項目。', score: 2 },
        { cn: '没有进行过系统的体能训练或挑战。', tw: '沒有進行過系統的體能訓練或挑戰。', score: 0 },
      ],
    },

    { id: 'QKBON_G8_pre', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QKC5 !== undefined && s.QKC5 >= 4 && s.QK3 !== 5; },
      cn: '在你患病/受伤之前，你是否完成过极限体能挑战？（如全程马拉松、铁人三项、长距离骑行、百公里越野、登山探险等）',
      tw: '在你患病/受傷之前，你是否完成過極限體能挑戰？（如全程馬拉松、鐵人三項、長距離騎行、百公里越野、登山探險等）',
      options: [
        { cn: '多次完成极限挑战并获得官方认证（如3次以上全马、完赛大铁、百公里越野等）。', tw: '多次完成極限挑戰並獲得官方認證（如3次以上全馬、完賽大鐵、百公里越野等）。', score: 10 },
        { cn: '完成过全程马拉松（42.195公里）或同等难度的官方认证赛事。', tw: '完成過全程馬拉松（42.195公里）或同等難度的官方認證賽事。', score: 8 },
        { cn: '完成过半程马拉松（21公里）或奥运标准铁人三项（51.5公里）。', tw: '完成過半程馬拉松（21公里）或奧運標準鐵人三項（51.5公里）。', score: 6 },
        { cn: '完成过超长距离骑行（200公里以上）或登山探险（海拔5000米以上）。', tw: '完成過超長距離騎行（200公里以上）或登山探險（海拔5000米以上）。', score: 6 },
        { cn: '当时正在系统训练中，已完成10公里以上跑步或短距离铁人三项。', tw: '當時正在系統訓練中，已完成10公里以上跑步或短距離鐵人三項。', score: 4 },
        { cn: '当时有定期运动习惯，但尚未挑战过长距离耐力项目。', tw: '當時有定期運動習慣，但尚未挑戰過長距離耐力項目。', score: 2 },
        { cn: '当时没有进行过系统的体能训练或挑战。', tw: '當時沒有進行過系統的體能訓練或挑戰。', score: 0 },
      ],
    },

    /* ── Student Bonus ── */

    { id: 'QKBON_S1', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 0; },
      cn: '面对繁重的学业压力，你是否仍能保持极度严格的自律，按计划学习、每周有系统性健身训练、严格管理每日营养等，并持续一年以上？',
      tw: '面對繁重的學業壓力，你是否仍能保持極度嚴格的自律，按計劃學習、每週有系統性健身訓練、嚴格管理每日營養等，並持續一年以上？',
      options: [
        { cn: '是，钢铁纪律，学习、健身、饮食全面自律超过一年，状态远超同龄人。', tw: '是，鋼鐵紀律，學習、健身、飲食全面自律超過一年，狀態遠超同齡人。', score: 8 },
        { cn: '大部分时间能坚持，偶尔在考试周或压力大时会短暂放松，但很快恢复。', tw: '大部分時間能堅持，偶爾在考試週或壓力大時會短暫放鬆，但很快恢復。', score: 5 },
        { cn: '我在学习上能保持自律，但健身和饮食管理做得不够好。', tw: '我在學習上能保持自律，但健身和飲食管理做得不夠好。', score: 3 },
        { cn: '我尝试过自律计划，但总是坚持不到一个月就放弃了。', tw: '我嘗試過自律計劃，但總是堅持不到一個月就放棄了。', score: 1 },
        { cn: '没有，完全没有自律习惯，学习和生活都比较随意。', tw: '沒有，完全沒有自律習慣，學習和生活都比較隨意。', score: 0 },
      ],
    },

    { id: 'QKBON_S3', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 0; },
      cn: '你是否在全国或国际核心学术/技能竞赛中击败顶尖高校对手，获得绝对硬核的前十名；或在本科期间以核心作者身份发表顶级学术论文？',
      tw: '你是否在全國或國際核心學術/技能競賽中擊敗頂尖高校對手，獲得絕對硬核的前十名；或在本科期間以核心作者身份發表頂級學術論文？',
      options: [
        { cn: '是，国际级竞赛前十名，或在顶级期刊以第一/通讯作者发表论文。', tw: '是，國際級競賽前十名，或在頂級期刊以第一/通訊作者發表論文。', score: 10 },
        { cn: '全国级核心竞赛前十名（如ACM-ICPC、数学联赛、蓝桥杯全国决赛等）。', tw: '全國級核心競賽前十名（如ACM-ICPC、數學聯賽、藍橋杯全國決賽等）。', score: 8 },
        { cn: '在核心期刊或重要会议以共同作者身份发表过学术论文。', tw: '在核心期刊或重要會議以共同作者身份發表過學術論文。', score: 6 },
        { cn: '全国级竞赛获奖（前十名以外），或省级竞赛前三名。', tw: '全國級競賽獲獎（前十名以外），或省級競賽前三名。', score: 4 },
        { cn: '获得过省级奖项或普通校际竞赛奖项。', tw: '獲得過省級獎項或普通校際競賽獎項。', score: 2 },
        { cn: '参与过相关竞赛或科研项目，但未获得正式奖项。', tw: '參與過相關競賽或科研項目，但未獲得正式獎項。', score: 1 },
        { cn: '没有此类成就。', tw: '沒有此類成就。', score: 0 },
      ],
    },

    /* ── Employed Bonus ── */

    /* ── Entrepreneur Bonus ── */

    { id: 'QKBON_AC2', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 2; },
      cn: '你的产品或服务是否在某细分领域建立了如此强大的"护城河"，以至于资金更雄厚的竞争对手被迫复制你的模式，但仍无法抢走你的核心客户？',
      tw: '你的產品或服務是否在某細分領域建立了如此強大的「護城河」，以至於資金更雄厚的競爭對手被迫複製你的模式，但仍無法搶走你的核心客戶？',
      options: [
        { cn: '是，在我的细分市场拥有绝对主导地位和定价权。', tw: '是，在我的細分市場擁有絕對主導地位和定價權。', score: 10 },
        { cn: '品牌强，但仍在激烈的价格战中搏杀。', tw: '品牌強，但仍在激烈的價格戰中搏殺。', score: 4 },
        { cn: '没有护城河，很容易被替代。', tw: '沒有護城河，很容易被替代。', score: 0 },
      ],
    },

    { id: 'QKBON_AC5', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 2; },
      cn: '你的业务系统是否完善到可以完全断开工作联系休假3个月，而公司不仅存活，收入还能自动持续增长？',
      tw: '你的業務系統是否完善到可以完全斷開工作聯繫休假3個月，而公司不僅存活，收入還能自動持續增長？',
      options: [
        { cn: '是，我打造了真正的自动化资产，享受终极时间自由。', tw: '是，我打造了真正的自動化資產，享受終極時間自由。', score: 10 },
        { cn: '我可以离开一两周，但3个月肯定会一团糟。', tw: '我可以離開一兩週，但3個月肯定會一團糟。', score: 4 },
        { cn: '没有，我是终极瓶颈，我停则业务停。', tw: '沒有，我是終極瓶頸，我停則業務停。', score: 0 },
      ],
    },

    /* ── Retired Bonus ── */

    { id: 'QKBON_AE1', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 5; },
      cn: '退休后，你是否保持着极高的竞技体能，甚至能完成全程马拉松、铁人三项，或在系统力量训练中超越未经训练的年轻人？',
      tw: '退休後，你是否保持著極高的競技體能，甚至能完成全程馬拉松、鐵人三項，或在系統力量訓練中超越未經訓練的年輕人？',
      options: [
        { cn: '是，无慢性病，频繁参加运动竞技，体型让年轻人惊叹。', tw: '是，無慢性病，頻繁參加運動競技，體型讓年輕人驚嘆。', score: 8 },
        { cn: '体魄非常强健，能轻松应对高强度长途旅行或定期中等运动。', tw: '體魄非常強健，能輕鬆應對高強度長途旅行或定期中等運動。', score: 4 },
        { cn: '基本健康，但仅限于散步、太极等轻柔活动。', tw: '基本健康，但僅限於散步、太極等輕柔活動。', score: 0 },
      ],
    },

    { id: 'QKBON_AE2', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 5; },
      cn: '你的财务状况是否不仅对自己无忧，还具备强大的"向下兼容"能力，完全覆盖孙辈顶级教育费用、为子女提供无压力的核心资产（如全款房产），甚至建立家族信托或慈善基金？',
      tw: '你的財務狀況是否不僅對自己無憂，還具備強大的「向下兼容」能力，完全覆蓋孫輩頂級教育費用、為子女提供無壓力的核心資產（如全款房產），甚至建立家族信託或慈善基金？',
      options: [
        { cn: '是，我是家族无可争议的财务基石。', tw: '是，我是家族無可爭議的財務基石。', score: 10 },
        { cn: '我能给予慷慨的礼物/补贴，但无法为他们全款购房。', tw: '我能給予慷慨的禮物/補貼，但無法為他們全款購房。', score: 4 },
        { cn: '没有，我只够维持自己的退休生活。', tw: '沒有，我只夠維持自己的退休生活。', score: 0 },
      ],
    },

    { id: 'QKBON_AE3', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 5; },
      cn: '退休后，你是否因极稀缺的专业经验而被顶级机构高薪聘为核心顾问，或你的专业意见仍能直接影响重要领域的决策？',
      tw: '退休後，你是否因極稀缺的專業經驗而被頂級機構高薪聘為核心顧問，或你的專業意見仍能直接影響重要領域的決策？',
      options: [
        { cn: '是，我被视为不可替代的行业智慧源泉。', tw: '是，我被視為不可替代的行業智慧源泉。', score: 8 },
        { cn: '偶尔被请回做小型咨询或客座讲座。', tw: '偶爾被請回做小型諮詢或客座講座。', score: 3 },
        { cn: '没有，与以前的职业世界完全脱节。', tw: '沒有，與以前的職業世界完全脫節。', score: 0 },
      ],
    },

    { id: 'QKBON_AE4', section: 'bonus', scorable: true, bonus: true,
      // Only show for age > 60, i.e. QK1 >= 5 (56-65 and above)
      showIf: function(s){ return s.QK3 === 5 && s.QK1 !== undefined && s.QK1 >= 5; },
      cn: '60岁后，你是否彻底抛弃了"老人不能学习"的借口，掌握了最前沿的生产力工具（如熟练使用AI创作或独立运营粉丝数十万的社交媒体账号），并对复杂的新技术和商业模式持有深刻独到的见解？',
      tw: '60歲後，你是否徹底拋棄了「老人不能學習」的藉口，掌握了最前沿的生產力工具（如熟練使用AI創作或獨立運營粉絲數十萬的社交媒體帳號），並對複雜的新技術和商業模式持有深刻獨到的見解？',
      options: [
        { cn: '是，我是资深科技极客，认知敏锐度碾压许多年轻人。', tw: '是，我是資深科技極客，認知敏銳度輾壓許多年輕人。', score: 8 },
        { cn: '我熟练使用智能手机和基础现代应用，保持与时代同步。', tw: '我熟練使用智慧型手機和基礎現代應用，保持與時代同步。', score: 2 },
        { cn: '没有，我强烈抵制或惧怕学习复杂的新数字工具。', tw: '沒有，我強烈抵制或懼怕學習複雜的新數位工具。', score: 0 },
      ],
    },

    { id: 'QKBON_AE5', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 5; },
      cn: '你是否已完全摆脱对"子女陪伴"、"他人评价"或"过去成就"的心理依赖，能够绝对自足地生活，每天都充实满足、内心平静喜悦，且完全不干涉年轻一代的生活？',
      tw: '你是否已完全擺脫對「子女陪伴」、「他人評價」或「過去成就」的心理依賴，能夠絕對自足地生活，每天都充實滿足、內心平靜喜悅，且完全不干涉年輕一代的生活？',
      options: [
        { cn: '是，极致的精神自足与内心平静。', tw: '是，極致的精神自足與內心平靜。', score: 8 },
        { cn: '大多平静，但偶尔会感到孤独或被家事烦扰。', tw: '大多平靜，但偶爾會感到孤獨或被家事煩擾。', score: 3 },
        { cn: '没有，高度依赖子女的情感认可，被忽视时容易心生怨念。', tw: '沒有，高度依賴子女的情感認可，被忽視時容易心生怨念。', score: 0 },
      ],
    },

  ]; // end QUICK_QUESTION_BANK


  /* ═══════════════════════════════════════════════════════════════
     QUICK_IMPROVE_ADVICE — keyed by question ID → { en, cn, tw }
     ═══════════════════════════════════════════════════════════════ */
  window.QUICK_IMPROVE_ADVICE = {

    /* ── Physical ── */
    QK5m: {
      cn: '体重管理的核心不是节食，而是建立系统。本周只做一件事：把每天的主食量减少1/4，并在饭后散步20分钟。6周后重新评估体重变化。',
      tw: '體重管理的核心不是節食，而是建立系統。本週只做一件事：把每天的主食量減少1/4，並在飯後散步20分鐘。6週後重新評估體重變化。',
    },
    QK5f: {
      cn: '体重管理的核心不是节食，而是建立系统。本周只做一件事：把每天的主食量减少1/4，并在饭后散步20分钟。6周后重新评估体重变化。',
      tw: '體重管理的核心不是節食，而是建立系統。本週只做一件事：把每天的主食量減少1/4，並在飯後散步20分鐘。6週後重新評估體重變化。',
    },
    QKC1: {
      cn: '外貌焦虑往往源于和他人的比较。试试"镜子练习"：每天早晨对着镜子说出自己身上3个你欣赏的特质（不限于外貌）。同时减少社交媒体上的颜值对比内容，你的自我感知会在30天内明显改善。',
      tw: '外貌焦慮往往源於和他人的比較。試試「鏡子練習」：每天早晨對著鏡子說出自己身上3個你欣賞的特質（不限於外貌）。同時減少社交媒體上的顏值對比內容，你的自我感知會在30天內明顯改善。',
    },

    /* ── Status-specific ── */
    QKA_HS1: {
      cn: '如果学习感到痛苦，试着把某门课和你已经喜欢的事情联系起来。找一个能让某个话题豁然开朗的YouTube频道、播客或书。好奇心是会传染的，每天只需15分钟自主探索。',
      tw: '如果學習感到痛苦，試著把某門課和你已經喜歡的事情聯繫起來。找一個能讓某個話題豁然開朗的YouTube頻道、播客或書。好奇心是會傳染的，每天只需15分鐘自主探索。',
    },
    QKA_HS2: {
      cn: '如果你正遭受校园暴力，不必默默忍受。今天就告诉一位你信任的成年人，老师、辅导员或家人。用文字记录事件和日期。你的安全是不可妥协的。',
      tw: '如果你正遭受校園暴力，不必默默忍受。今天就告訴一位你信任的成年人，老師、輔導員或家人。用文字記錄事件和日期。你的安全是不可妥協的。',
    },
    QKA_HS3: {
      cn: '减压不是可选项，而是维护保养。本周安排2个固定运动或爱好时段，就像不能缺席的课一样。哪怕30分钟的运动也能让你的压力荷尔蒙重置长达6小时。',
      tw: '減壓不是可選項，而是維護保養。本週安排2個固定運動或愛好時段，就像不能缺席的課一樣。哪怕30分鐘的運動也能讓你的壓力荷爾蒙重置長達6小時。',
    },
    QKA_HS9: {
      cn: '慢性睡眠剥夺会使你的记忆巩固效率降低多达40%。只做一个改变：每天设定固定的起床时间（包括周末）。两周内你的大脑将开始自我调节入睡时间。',
      tw: '慢性睡眠剝奪會使你的記憶鞏固效率降低多達40%。只做一個改變：每天設定固定的起床時間（包括週末）。兩週內你的大腦將開始自我調節入睡時間。',
    },
    QKA_HS12: {
      cn: '对未来的麻痹感通常是决策瘫痪的伪装。试试"2年测试"：有哪一个技能或经历能在2年内明确为你打开更多大门？只专注于那一个。方向来自行动，而不是等待清晰。',
      tw: '對未來的麻痹感通常是決策癱瘓的偽裝。試試「2年測試」：有哪一個技能或經歷能在2年內明確為你打開更多大門？只專注於那一個。方向來自行動，而不是等待清晰。',
    },
    QKA_BC1: {
      cn: '如果你频繁经历或正处于临床抑郁中，请立即寻求专业帮助。与此同时，最有循证依据的日常习惯是：每天30分钟中等强度有氧运动，其抗抑郁效果与部分药物相当。',
      tw: '如果你頻繁經歷或正處於臨床憂鬱中，請立即尋求專業幫助。與此同時，最有循證依據的日常習慣是：每天30分鐘中等強度有氧運動，其抗憂鬱效果與部分藥物相當。',
    },
    QKA_BC2: {
      cn: '学业成绩主要取决于系统，而非天赋。单一最高杠杆的改变：从被动重读切换到主动回忆（合上书，写下你记住的章节内容）。这能将记忆保留率提高200%-300%。',
      tw: '學業成績主要取決於系統，而非天賦。單一最高槓桿的改變：從被動重讀切換到主動回憶（合上書，寫下你記住的章節內容）。這能將記憶保留率提高200%-300%。',
    },
    QKA_D1: {
      cn: '研究方向瘫痪很常见。本周安排一次30分钟的导师会面，不是汇报进展，而是问："我们领域目前最有影响力的两个开放性问题是什么？"听专家描绘全景会立即驱散迷雾。',
      tw: '研究方向癱瘓很常見。本週安排一次30分鐘的導師會面，不是匯報進展，而是問：「我們領域目前最有影響力的兩個開放性問題是什麼？」聽專家描繪全景會立即驅散迷霧。',
    },
    QKAB3: {
      cn: '高压正在燃烧你最宝贵的资源：认知带宽。本周测试一个边界：在固定时间（如晚8点）关闭所有工作通知，并坚守7天。如果这引发工作危机，那是在告诉你这个职位本身需要重新谈判。',
      tw: '高壓正在燃燒你最寶貴的資源：認知頻寬。本週測試一個邊界：在固定時間（如晚8點）關閉所有工作通知，並堅守7天。如果這引發工作危機，那是在告訴你這個職位本身需要重新談判。',
    },
    QKAB7: {
      cn: '你的就业市场韧性是你最重要的职业保险。本周花1小时更新简历，并公开发布一件可见的工作成果（文章、项目、作品集）。每月做一次"市场温度测试"，一次咖啡交流或投递，保持校准。',
      tw: '你的就業市場韌性是你最重要的職業保險。本週花1小時更新履歷，並公開發布一件可見的工作成果（文章、項目、作品集）。每月做一次「市場溫度測試」，一次咖啡交流或投遞，保持校準。',
    },
    QKAC1: {
      cn: '现金流问题在成为收入问题之前，几乎总是分配问题。本周列出每一项支出，并标注为"必要/合同性"、"运营/灵活性"或"可自由支配/可削减"。立即削减第三类的20%。',
      tw: '現金流問題在成為收入問題之前，幾乎總是分配問題。本週列出每一項支出，並標注為「必要/合約性」、「運營/靈活性」或「可自由支配/可削減」。立即削減第三類的20%。',
    },
    QKAD1: {
      cn: '少于6个月的财务跑道是一个财务紧急情况。立即停止所有非必要支出。然后本周做一件事：列出5个30天内可以采取的创收行动，自由职业、出售资产、咨询服务。从最快的那个开始。',
      tw: '少於6個月的財務跑道是一個財務緊急情況。立即停止所有非必要支出。然後本週做一件事：列出5個30天內可以採取的創收行動，自由職業、出售資產、諮詢服務。從最快的那個開始。',
    },
    QKAD2: {
      cn: '毫无结构的一天是动力和心理健康的敌人。明天，只为这一天写下三个"锚定任务"（不可妥协、有时间节点的事项）。结构本身能减轻焦虑并产生前进动力。',
      tw: '毫無結構的一天是動力和心理健康的敵人。明天，只為這一天寫下三個「錨定任務」（不可妥協、有時間節點的事項）。結構本身能減輕焦慮並產生前進動力。',
    },
    QKAE1: {
      cn: '退休后的财务压力可以通过系统梳理来解决。本周坐下来，列出每月固定收入与固定支出的对比表。然后找出一项你可以减少30%的最大可自由支配开支。小幅结构性削减会随着时间显著复利积累。',
      tw: '退休後的財務壓力可以通過系統梳理來解決。本週坐下來，列出每月固定收入與固定支出的對比表。然後找出一項你可以減少30%的最大可自由支配開支。小幅結構性削減會隨著時間顯著複利積累。',
    },
    QKAI1: {
      cn: '照护者倦怠是真实存在且会逐渐加重的。本周找出一个能连续替你照看3小时的人。每周哪怕一次受保护的真正休息时段（不只是"孩子睡着了"的间隙），在医学上对你的长期可持续性都意义重大。',
      tw: '照護者倦怠是真實存在且會逐漸加重的。本週找出一個能連續替你照看3小時的人。每週哪怕一次受保護的真正休息時段（不只是「孩子睡著了」的間隙），在醫學上對你的長期可持續性都意義重大。',
    },

    /* ── Health & Lifestyle ── */
    QKC3: {
      cn: '不要试图同时改变所有习惯，这注定失败。选择对你伤害最大的一个，用"替代法"处理它：每天用10分钟散步替代一次该习惯。只改1个，坚持30天，再处理下一个。',
      tw: '不要試圖同時改變所有習慣，這注定失敗。選擇對你傷害最大的一個，用「替代法」處理它：每天用10分鐘散步替代一次該習慣。只改1個，堅持30天，再處理下一個。',
    },
    QKC4: {
      cn: '为防止视力进一步恶化，严格执行"20-20-20法则"：每20分钟看20英尺外的物体20秒。购买屏幕挂灯减少眩光，调大手机字体。每年进行一次专业验光。',
      tw: '為防止視力進一步惡化，嚴格執行「20-20-20法則」：每20分鐘看20英尺外的物體20秒。購買螢幕掛燈減少眩光，調大手機字體。每年進行一次專業驗光。',
    },
    QKC5: {
      cn: '改善慢性健康问题的起点是获取基线数据。本月预约一次全面体检，拿到血压、血糖、血脂等指标。90%的早期慢性问题可通过改善睡眠（固定起床时间）、饮食（减少精加工食品）和运动（每天7000步）在6个月内逆转。',
      tw: '改善慢性健康問題的起點是獲取基線數據。本月預約一次全面體檢，拿到血壓、血糖、血脂等指標。90%的早期慢性問題可通過改善睡眠（固定起床時間）、飲食（減少精加工食品）和運動（每天7000步）在6個月內逆轉。',
    },

    /* ── Finance ── */
    QKC9: {
      cn: '储蓄不足几乎总是系统性问题，而非收入问题。从下次发薪日起，收到工资的瞬间自动转走10-20%到独立储蓄账户，命名为"未来基金"。50/30/20预算法则是经过验证的入门框架。',
      tw: '儲蓄不足幾乎總是系統性問題，而非收入問題。從下次發薪日起，收到薪資的瞬間自動轉走10-20%到獨立儲蓄帳戶，命名為「未來基金」。50/30/20預算法則是經過驗證的入門框架。',
    },
    QKC10: {
      cn: '不足3个月的财务跑道是危险信号。暂停所有非必要支出和投资。本周：列出过去3个月所有支出，标记可以削减的项目，将节省下来的100%存入应急账户。目标：90天内攒够3个月生活费。',
      tw: '不足3個月的財務跑道是危險信號。暫停所有非必要支出和投資。本週：列出過去3個月所有支出，標記可以削減的項目，將節省下來的100%存入應急帳戶。目標：90天內攢夠3個月生活費。',
    },
    QKC11: {
      cn: '没有保险是大多数人面临的最大单一财务风险。最低成本的第一步：购买一份大额医疗险和意外险。这两项通常最便宜且最必要，能保护你的全部积累不被一次意外医疗清零。',
      tw: '沒有保險是大多數人面臨的最大單一財務風險。最低成本的第一步：購買一份大額醫療險和意外險。這兩項通常最便宜且最必要，能保護你的全部積累不被一次意外醫療清零。',
    },
    QKC12: {
      cn: '鲁莽的投资几乎比任何事都更快地摧毁财富。第一原则：如果你对某投资工具的理解不足以在2分钟内向陌生人解释清楚，就不要投钱进去。将高风险仓位转移至多元化指数基金，并停止每天查看价格。',
      tw: '魯莽的投資幾乎比任何事都更快地摧毀財富。第一原則：如果你對某投資工具的理解不足以在2分鐘內向陌生人解釋清楚，就不要投錢進去。將高風險倉位轉移至多元化指數基金，並停止每天查看價格。',
    },

    /* ── Relationships ── */
    QKB1: {
      cn: '无论你的感情状况如何，最重要的投资是你自身的情感准备。本周反思一个诚实的问题："我过去感情中的什么模式我仍在重复？"用15分钟写日记往往比被动等待数月更有收获。',
      tw: '無論你的感情狀況如何，最重要的投資是你自身的情感準備。本週反思一個誠實的問題：「我過去感情中的什麼模式我仍在重複？」用15分鐘寫日記往往比被動等待數月更有收獲。',
    },
    QKB2: {
      cn: '有毒的父母关系是沉重的情感包袱。短期策略：设定"安全距离"，降低联系频率但提升质量（如每月一次高质量视频通话，而非每日冲突性接触）。长期：3-5次家庭心理治疗能打开任何争吵都无法开启的沟通渠道。',
      tw: '有毒的父母關係是沉重的情感包袱。短期策略：設定「安全距離」，降低聯繫頻率但提升質量（如每月一次高質量視頻通話，而非每日衝突性接觸）。長期：3-5次家庭心理治療能打開任何爭吵都無法開啟的溝通渠道。',
    },
    QKB3: {
      cn: '性生活满意度通常反映更深层的连接质量。真正的起点不是技巧，而是增加日常非性亲密感：更多身体接触（拥抱、牵手）、情感分享和共同的新体验。每周安排一次"只属于两个人"的夜晚，无手机、无孩子、无工作话题。',
      tw: '性生活滿意度通常反映更深層的連接質量。真正的起點不是技巧，而是增加日常非性親密感：更多身體接觸（擁抱、牽手）、情感分享和共同的新體驗。每週安排一次「只屬於兩個人」的夜晚，無手機、無孩子、無工作話題。',
    },
    QKB5: {
      cn: '育儿精力不均衡会侵蚀你的个人发展和伴侣关系。本周坐下来一起把所有育儿任务列在纸上，然后明确分配给具体的人和具体的天。考虑引入外部帮助（临时保姆或托儿所）来夺回高价值个人时间。',
      tw: '育兒精力不均衡會侵蝕你的個人發展和伴侶關係。本週坐下來一起把所有育兒任務列在紙上，然後明確分配給具體的人和具體的天。考慮引入外部幫助（臨時保姆或托兒所）來奪回高價值個人時間。',
    },
    QKB6: {
      cn: '兄弟姐妹的疏远往往源于多年前一个未解决的积怨。不需要一次解决所有问题。在下个节日从一个小而真诚的举动开始，发一条简短、真诚的信息，不带任何期待。如果对方回应了，逐步增加互动。无论如何，你已尽到了自己的责任。',
      tw: '兄弟姊妹的疏遠往往源於多年前一個未解決的積怨。不需要一次解決所有問題。在下個節日從一個小而真誠的舉動開始，發一條簡短、真誠的訊息，不帶任何期待。如果對方回應了，逐步增加互動。無論如何，你已盡到了自己的責任。',
    },

    /* ── Skills & Psychology ── */
    QKD1: {
      cn: '学语言最高效的方法不是背单词，而是"影子跟读法"：每天花30分钟选一段目标语言音频（播客、TED演讲），跟着大声重复，在关注意义之前先模仿节奏和语调。坚持90天，你的口语本能会发生质变。',
      tw: '學語言最高效的方法不是背單詞，而是「影子跟讀法」：每天花30分鐘選一段目標語言音頻（播客、TED演講），跟著大聲重複，在關注意義之前先模仿節奏和語調。堅持90天，你的口語本能會發生質變。',
    },
    QKD2: {
      cn: '旅行不是奢侈品，而是认知投资。每季度安排一次"慢旅行"：在一个地方停留3天以上，真正与当地人交流。低成本方式：淡季出行、周边目的地、青旅或民宿代替酒店。',
      tw: '旅行不是奢侈品，而是認知投資。每季度安排一次「慢旅行」：在一個地方停留3天以上，真正與當地人交流。低成本方式：淡季出行、周邊目的地、青旅或民宿代替酒店。',
    },
    QKD4: {
      cn: '缺乏可变现技能是一个长期风险，而非永久状态。选择一个与你现有工作或兴趣相邻的技能，用3个月产出一个具体可分享的成果（作品集、项目、文章）。那个单一成果就是你进入新机会的入场券。',
      tw: '缺乏可變現技能是一個長期風險，而非永久狀態。選擇一個與你現有工作或興趣相鄰的技能，用3個月產出一個具體可分享的成果（作品集、項目、文章）。那個單一成果就是你進入新機會的入場券。',
    },
    QKD7: {
      cn: '坚持不是关于意志力，而是降低启动成本。把目标习惯缩减到绝对最小版本：不是"每天运动"，而是"穿上鞋子走出门"。连续做21天这个最小动作。之后飞轮会自动带你前进。',
      tw: '堅持不是關於意志力，而是降低啟動成本。把目標習慣縮減到絕對最小版本：不是「每天運動」，而是「穿上鞋子走出門」。連續做21天這個最小動作。之後飛輪會自動帶你前進。',
    },
    QKD8: {
      cn: '情绪管理能力弱会同等地损害工作、关系和决策质量。今晚开始一本"情绪日记"：睡前花3分钟写下今天最强烈的情绪、触发事件和你的反应。坚持2周后，你会开始在被情绪淹没之前"看见"它到来。',
      tw: '情緒管理能力弱會同等地損害工作、關係和決策質量。今晚開始一本「情緒日記」：睡前花3分鐘寫下今天最強烈的情緒、觸發事件和你的反應。堅持2週後，你會開始在被情緒淹沒之前「看見」它到來。',
    },
    QKD9: {
      cn: '觉得人生不属于自己是一个必须通过行动挑战的信念。本周做一个"微型主权行为"，在一个通常让他人做决定的场合，坚持表达你自己的偏好（哪怕只是选择去哪吃饭）。每一次刻意选择都在重写你的行为默认值。',
      tw: '覺得人生不屬於自己是一個必須通過行動挑戰的信念。本週做一個「微型主權行為」，在一個通常讓他人做決定的場合，堅持表達你自己的偏好（哪怕只是選擇去哪吃飯）。每一次刻意選擇都在重寫你的行為默認值。',
    },
    QKD11: {
      cn: '对人生成就感到不满时，停止与终点比较，改为与一年前的自己比较。拿一张纸，列出过去12个月完成的所有事情，无论多小。你走的比你以为的更远。然后在背面写3件如果在接下来12个月内完成会让你感到骄傲的事。',
      tw: '對人生成就感到不滿時，停止與終點比較，改為與一年前的自己比較。拿一張紙，列出過去12個月完成的所有事情，無論多小。你走的比你以為的更遠。然後在背面寫3件如果在接下來12個月內完成會讓你感到驕傲的事。',
    },
    QKS56_1: {
      cn: '对56–75岁人群而言，健康结果更多取决于持续性而非强度。建立固定的监测与运动节律。能每周执行的简单方案，胜过两周就中断的激进方案。',
      tw: '對56–75歲人群而言，健康結果更多取決於持續性而非強度。建立固定的監測與運動節律。能每週執行的簡單方案，勝過兩週就中斷的激進方案。',
    },
    QKS56_2: {
      cn: '这一阶段更适合“先控风险再扩收益”：先确保就医连续性、现金流稳定和家庭角色边界，再追求额外收益。安全感先到位，才有真正自由。',
      tw: '這一階段更適合「先控風險再擴收益」：先確保就醫連續性、現金流穩定和家庭角色邊界，再追求額外收益。安全感先到位，才有真正自由。',
    },
    QKS56_3: {
      cn: '社交节律下降的长期影响常被低估。请把每周至少两次固定社交触点（邻里、朋友、社群、志愿活动）设为不可取消的基本安排。',
      tw: '社交節律下降的長期影響常被低估。請把每週至少兩次固定社交觸點（鄰里、朋友、社群、志願活動）設為不可取消的基本安排。',
    },
    QKS76_1: {
      cn: '对76–100岁人群，维持功能独立是回报最高的目标。优先防跌倒、下肢力量与居家安全改造，而非追求高强度目标。',
      tw: '對76–100歲人群，維持功能獨立是回報最高的目標。優先防跌倒、下肢力量與居家安全改造，而非追求高強度目標。',
    },
    QKS76_2: {
      cn: '医疗连续性应依靠流程而非记忆。把用药、复诊、紧急联系人和关键检查报告做成可见清单，方便家属/照护者快速协同。',
      tw: '醫療連續性應依靠流程而非記憶。把用藥、複診、緊急聯絡人和關鍵檢查報告做成可見清單，方便家屬/照護者快速協同。',
    },
    QKS76_3: {
      cn: '这一阶段的情绪稳定，依赖可预测的连接与意义感。建议维持轻量日程结构（休息、活动、社交触点、愉悦任务），降低孤独与焦虑风险。',
      tw: '這一階段的情緒穩定，依賴可預測的連結與意義感。建議維持輕量日程結構（休息、活動、社交觸點、愉悅任務），降低孤獨與焦慮風險。',
    },
  };


  /* Expose IDs set */
  var idSet = {};
  window.QUICK_QUESTION_BANK.forEach(function(q){ idSet[q.id] = true; });
  window.QUICK_IDS = idSet;

  /* ════════════════════════════════════════════════════════════
     Scoring helpers — bundled here so pages that load ONLY
     quick_questions.js (and not questions.js) still have working
     computeMaxScores / computeBonusScore / computeMultiScore /
     DIM_WEIGHTS / applyCurve.  Each is installed ONLY if not already
     present on window — so when both banks are loaded, the versions
     from questions.js (which resolve the active bank dynamically)
     take precedence and no collision occurs.
     ════════════════════════════════════════════════════════════ */

  function _quickActiveBank() {
    if (window.QUIZ_MODE === 'quick' && Array.isArray(window.QUICK_QUESTION_BANK)) {
      return window.QUICK_QUESTION_BANK;
    }
    return window.QUESTION_BANK || window.QUICK_QUESTION_BANK || [];
  }

  if (!window.DIM_WEIGHTS) {
    window.DIM_WEIGHTS = { basic: 0.25, social: 0.45, identity: 0.30 };
  }

  if (!window.applyCurve) {
    window.applyCurve = function(rawPct) {
      var x = Math.max(0, Math.min(1, rawPct || 0));
      return 8 + 92 * Math.pow(x, 1.2);
    };
  }

  if (!window.computeMaxScores) {
    window.computeMaxScores = function(activeIds) {
      var dimMax = { basic:0, social:0, identity:0 };
      _quickActiveBank().forEach(function(q) {
        if (!q.scorable || q.bonus) return;
        if (!activeIds.has(q.id)) return;
        if (!q.options || !q.options.length) return;
        var mx = Math.max.apply(null, q.options.map(function(o){ return o.score||0; }));
        if (dimMax[q.section] !== undefined) dimMax[q.section] += mx;
      });
      return dimMax;
    };
  }

  if (!window.computeBonusScore) {
    window.computeBonusScore = function(answerMap) {
      var total = 0;
      _quickActiveBank().forEach(function(q) {
        if (!q.bonus || !q.scorable) return;
        if (!answerMap || !answerMap[q.id]) return;
        var oi  = answerMap[q.id].questionIdx;
        var opt = q.options && q.options[oi];
        if (opt) total += (opt.score || 0);
      });
      return Math.min(50, total);
    };
  }

  if (!window.computeMultiScore) {
    window.computeMultiScore = function(q, selectedIndices) {
      if (!selectedIndices || selectedIndices.length === 0) return 0;
      var hasExclusive = false;
      selectedIndices.forEach(function(i) {
        if (q.options[i] && q.options[i].exclusive) hasExclusive = true;
      });
      if (hasExclusive) {
        var excOpt = q.options.find(function(o){ return o.exclusive; });
        return excOpt ? excOpt.score : 0;
      }
      if (q.scoreMode === 'multi_negative') {
        var maxScore = Math.max.apply(null, q.options.map(function(o){ return o.score||0; }));
        var penalty  = 0;
        selectedIndices.forEach(function(i) {
          if (q.options[i] && q.options[i].negative) penalty++;
        });
        return Math.max(0, maxScore - penalty);
      }
      var best = 0;
      selectedIndices.forEach(function(i) {
        if (q.options[i] && (q.options[i].score||0) > best) best = q.options[i].score||0;
      });
      return best;
    };
  }

})();
