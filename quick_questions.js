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
      id: 'QK1', section: 'basic', scorable: true, noImprove: true,
      en: 'What is your current age group?',
      cn: '你目前的年龄段是？',
      tw: '你目前的年齡段是？',
      options: [
        { en: '18 and below',    cn: '18岁及以下',    tw: '18歲及以下',    score: 2 },
        { en: '18 – 25',         cn: '18 - 25岁',     tw: '18 - 25歲',     score: 3 },
        { en: '26 – 35',         cn: '26 - 35岁',     tw: '26 - 35歲',     score: 4 },
        { en: '36 – 45',         cn: '36 - 45岁',     tw: '36 - 45歲',     score: 4 },
        { en: '46 – 55',         cn: '46 - 55岁',     tw: '46 - 55歲',     score: 3 },
        { en: '56 – 65',         cn: '56 - 65岁',     tw: '56 - 65歲',     score: 2 },
        { en: '66 – 75',         cn: '66 - 75岁',     tw: '66 - 75歲',     score: 2 },
        { en: '76 – 85',         cn: '76 - 85岁',     tw: '76 - 85歲',     score: 1 },
        { en: '85 – 100',        cn: '85 - 100岁',    tw: '85 - 100歲',    score: 1 },
        { en: '101 and above',   cn: '101岁及以上',   tw: '101歲及以上',   score: 1 },
      ],
    },

    { /* QK2 — Gender */
      id: 'QK2', section: 'basic', scorable: false, noImprove: true,
      en: 'What is your gender?',
      cn: '你的性别是？',
      tw: '你的性別是？',
      note: {
        en: 'Gender is not scored — used only to personalise questions.',
        cn: '性别不计入评分，仅用于个性化题目',
        tw: '性別不計入評分，僅用於個性化題目',
      },
      options: [
        { en: 'Male',   cn: '男性', tw: '男性', score: 0 },
        { en: 'Female', cn: '女性', tw: '女性', score: 0 },
      ],
    },

    { /* QK4m — Height Male */
      id: 'QK4m', section: 'basic', scorable: true, noImprove: true,
      showIf: function(s){ return s.QK2 === 0; },
      en: 'What is your approximate height? (Male)',
      cn: '你的身高大概在哪个范围？（男性）',
      tw: '你的身高大概在哪個範圍？（男性）',
      options: [
        { en: 'Below 165 cm',      cn: '165cm 以下',      tw: '165cm 以下',      score: 0 },
        { en: '165 – 170 cm',      cn: '165 - 170cm',     tw: '165 - 170cm',     score: 1 },
        { en: '170 – 175 cm',      cn: '170 - 175cm',     tw: '170 - 175cm',     score: 2 },
        { en: '175 – 180 cm',      cn: '175 - 180cm',     tw: '175 - 180cm',     score: 3 },
        { en: '180 – 185 cm',      cn: '180 - 185cm',     tw: '180 - 185cm',     score: 4 },
        { en: '185 cm and above',  cn: '185cm 以上',      tw: '185cm 以上',      score: 4 },
      ],
    },

    { /* QK4f — Height Female */
      id: 'QK4f', section: 'basic', scorable: true, noImprove: true,
      showIf: function(s){ return s.QK2 === 1; },
      en: 'What is your approximate height? (Female)',
      cn: '你的身高大概在哪个范围？（女性）',
      tw: '你的身高大概在哪個範圍？（女性）',
      options: [
        { en: 'Below 155 cm',      cn: '155cm 以下',      tw: '155cm 以下',      score: 0 },
        { en: '155 – 160 cm',      cn: '155 - 160cm',     tw: '155 - 160cm',     score: 1 },
        { en: '160 – 165 cm',      cn: '160 - 165cm',     tw: '160 - 165cm',     score: 2 },
        { en: '165 – 170 cm',      cn: '165 - 170cm',     tw: '165 - 170cm',     score: 3 },
        { en: '170 – 175 cm',      cn: '170 - 175cm',     tw: '170 - 175cm',     score: 4 },
        { en: '175 cm and above',  cn: '175cm 以上',      tw: '175cm 以上',      score: 4 },
      ],
    },

    { /* QK5m — Weight Male */
      id: 'QK5m', section: 'basic', scorable: true,
      showIf: function(s){ return s.QK2 === 0; },
      en: 'What is your approximate weight? (Male)',
      cn: '你目前的体重大概在哪个范围？（男性）',
      tw: '你目前的體重大概在哪個範圍？（男性）',
      options: [
        { en: 'Below 55 kg (underweight)',          cn: '55kg 以下（偏瘦）',       tw: '55kg 以下（偏瘦）',       score: 1 },
        { en: '55 – 70 kg (lean / normal)',         cn: '55 - 70kg（偏轻/正常）',  tw: '55 - 70kg（偏輕/正常）',  score: 3 },
        { en: '70 – 85 kg (normal / athletic)',     cn: '70 - 85kg（正常/健壮）',  tw: '70 - 85kg（正常/健壯）',  score: 4 },
        { en: '85 – 100 kg (overweight)',           cn: '85 - 100kg（偏重）',      tw: '85 - 100kg（偏重）',      score: 2 },
        { en: '100 kg and above (obese)',           cn: '100kg 以上（超重）',       tw: '100kg 以上（超重）',       score: 1 },
      ],
    },

    { /* QK5f — Weight Female */
      id: 'QK5f', section: 'basic', scorable: true,
      showIf: function(s){ return s.QK2 === 1; },
      en: 'What is your approximate weight? (Female)',
      cn: '你目前的体重大概在哪个范围？（女性）',
      tw: '你目前的體重大概在哪個範圍？（女性）',
      options: [
        { en: 'Below 45 kg (underweight)',          cn: '45kg 以下（偏瘦）',       tw: '45kg 以下（偏瘦）',       score: 1 },
        { en: '45 – 55 kg (lean / normal)',         cn: '45 - 55kg（偏轻/正常）',  tw: '45 - 55kg（偏輕/正常）',  score: 3 },
        { en: '55 – 65 kg (normal / healthy)',      cn: '55 - 65kg（正常/健康）',  tw: '55 - 65kg（正常/健康）',  score: 4 },
        { en: '65 – 80 kg (overweight)',            cn: '65 - 80kg（偏重）',       tw: '65 - 80kg（偏重）',       score: 2 },
        { en: '80 kg and above (obese)',            cn: '80kg 以上（超重）',        tw: '80kg 以上（超重）',        score: 1 },
      ],
    },

    /* ═══════════════════════════════════════════
       SECTION 2 — CURRENT STATUS (branching root)
       ═══════════════════════════════════════════ */

    { /* QK3 — Primary status */
      id: 'QK3', section: 'basic', scorable: false, noImprove: true,
      en: 'What is your current primary status?',
      cn: '你目前的主要身份是？',
      tw: '你目前的主要身份是？',
      note: {
        en: 'This shapes which questions follow. Not scored directly.',
        cn: '此选项影响后续问题，不计入评分',
        tw: '此選項影響後續問題，不計入評分',
      },
      options: [
        /* 0 */ { en: 'A. Studying',                             cn: '在校学生',              tw: '在校學生',              score: 0 },
        /* 1 */ { en: 'B. Employed (full-time / part-time)',     cn: '在职（全职/兼职）',     tw: '在職（全職/兼職）',     score: 0 },
        /* 2 */ { en: 'C. Entrepreneur / Business owner',        cn: '创业者 / 企业主',       tw: '創業者 / 企業主',       score: 0 },
        /* 3 */ { en: 'D. Unemployed / Job-seeking',             cn: '待业 / 求职中',         tw: '待業 / 求職中',         score: 0 },
        /* 4 */ { en: 'E. Retired',                              cn: '退休',                  tw: '退休',                  score: 0 },
        /* 5 */ { en: 'F. Seriously Ill',                        cn: '重病中',                tw: '重病中',                score: 0 },
        /* 6 */ { en: 'G. In Treatment Post-Major Accident',     cn: '重大事故后治疗中',      tw: '重大事故後治療中',      score: 0 },
        /* 7 */ { en: 'H. Restricted Movement',                  cn: '行动受限中',            tw: '行動受限中',            score: 0 },
        /* 8 */ { en: 'I. Full-time Caregiver',                  cn: '全职照护者',            tw: '全職照護者',            score: 0 },
      ],
      // Note for quiz engine: hide option index 4 (Retired) when QK1 <= 2
    },


    /* ═══════════════════════════════════════════
       SECTION 3A — STUDYING (A): ACADEMIC STAGE
       ═══════════════════════════════════════════ */

    { /* QKA_STAGE — Academic stage */
      id: 'QKA_STAGE', section: 'basic', scorable: true, noImprove: true,
      showIf: function(s){ return s.QK3 === 0; },
      en: 'What is your current academic stage?',
      cn: '你目前就读的学业阶段是？',
      tw: '你目前就讀的學業階段是？',
      options: [
        /* 0 */ { en: 'A. High school and below',                cn: '高中及以下',          tw: '高中及以下',          score: 1 },
        /* 1 */ { en: 'B. College / Vocational skill training',  cn: '大专 / 职业技术学校',  tw: '大專 / 職業技術學校',  score: 2 },
        /* 2 */ { en: "C. Bachelor's degree",                    cn: '全日制本科（学士）',   tw: '全日制本科（學士）',   score: 3 },
        /* 3 */ { en: "D. Master's degree and above",            cn: '硕士及以上',           tw: '碩士及以上',           score: 4 },
      ],
    },


    /* ─── AAA: High School & below ─── */

    { /* QKA_HS1 */
      id: 'QKA_HS1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Do you find your study life interesting?',
      cn: '你觉得自己的学习生活有趣吗？',
      tw: '你覺得自己的學習生活有趣嗎？',
      options: [
        { en: 'Full of passion — I actively explore knowledge beyond the textbook.', cn: '充满热情，我主动探索课本以外的知识。', tw: '充滿熱情，我主動探索課本以外的知識。', score: 4 },
        { en: 'Adapting well — I find joy in some subjects or activities.', cn: '适应良好，在部分科目或活动中能找到乐趣。', tw: '適應良好，在部分科目或活動中能找到樂趣。', score: 3 },
        { en: 'Dull and mechanical — I study just to pass exams and graduate.', cn: '枯燥机械，只是为了考试和毕业而学。', tw: '枯燥機械，只是為了考試和畢業而學。', score: 1 },
        { en: 'Extremely painful — constant mental exhaustion and a desire to quit.', cn: '极度痛苦，长期精神疲惫，时常想放弃。', tw: '極度痛苦，長期精神疲憊，時常想放棄。', score: 0 },
      ],
    },

    { /* QKA_HS2 */
      id: 'QKA_HS2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Are you currently experiencing school violence (including emotional abuse or ostracisation)?',
      cn: '你目前是否遭受校园暴力（包括情感伤害/被孤立）？',
      tw: '你目前是否遭受校園暴力（包括情感傷害/被孤立）？',
      options: [
        { en: 'Absolutely not — my social environment is safe and friendly.', cn: '完全没有，社交环境安全友善。', tw: '完全沒有，社交環境安全友善。', score: 4 },
        { en: 'Occasional minor frictions or jokes, nothing I cannot handle.', cn: '偶有小摩擦或玩笑，尚在可控范围。', tw: '偶有小摩擦或玩笑，尚在可控範圍。', score: 3 },
        { en: 'Currently experiencing long-term emotional abuse, isolation, or rumours.', cn: '正遭受长期情感霸凌、孤立或谣言。', tw: '正遭受長期情感霸凌、孤立或謠言。', score: 1 },
        { en: 'Currently experiencing physical violence, extortion, or severe cyberbullying.', cn: '正遭受身体暴力、敲诈或严重网络霸凌。', tw: '正遭受身體暴力、敲詐或嚴重網路霸凌。', score: 0 },
      ],
    },

    { /* QKA_HS3 */
      id: 'QKA_HS3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'How many times a week do you release stress through sports or hobbies?',
      cn: '你每周通过运动或爱好减压的频率是？',
      tw: '你每週透過運動或愛好減壓的頻率是？',
      options: [
        { en: '4 or more times.',  cn: '每周4次及以上。', tw: '每週4次及以上。', score: 4 },
        { en: '2 – 3 times.',      cn: '每周2-3次。',     tw: '每週2-3次。',     score: 3 },
        { en: '1 time.',           cn: '每周1次。',       tw: '每週1次。',       score: 2 },
        { en: 'Rarely or never.',  cn: '几乎从不。',      tw: '幾乎從不。',      score: 0 },
      ],
    },

    { /* QKA_HS4 */
      id: 'QKA_HS4', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Does your school enforce strict management?',
      cn: '你所在学校的管理是否严格？',
      tw: '你所在學校的管理是否嚴格？',
      options: [
        { en: 'Very free — university-style self-management.', cn: '非常自由，类似大学自主管理。', tw: '非常自由，類似大學自主管理。', score: 4 },
        { en: 'Normal — basic discipline but retains personal space.', cn: '正常管理，基本纪律但保留个人空间。', tw: '正常管理，基本紀律但保留個人空間。', score: 3 },
        { en: 'Strict high-pressure management (e.g. militarised, tight schedules).', cn: '严格高压（如军事化、密集时间表）。', tw: '嚴格高壓（如軍事化、密集時間表）。', score: 1 },
        { en: 'Extremely oppressive — severe privacy invasion, constant surveillance.', cn: '极度压制，严重侵犯隐私并全程监控。', tw: '極度壓制，嚴重侵犯隱私並全程監控。', score: 0 },
      ],
    },

    { /* QKA_HS5 */
      id: 'QKA_HS5', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Are you popular among your classmates?',
      cn: '你在同学中受欢迎吗？',
      tw: '你在同學中受歡迎嗎？',
      options: [
        { en: 'I am a social hub — many friends, frequently invited out.', cn: '我是社交核心，朋友众多，常被邀约。', tw: '我是社交核心，朋友眾多，常被邀約。', score: 4 },
        { en: 'I have a stable small circle and get along well with everyone.', cn: '我有稳定的小圈子，整体相处融洽。', tw: '我有穩定的小圈子，整體相處融洽。', score: 3 },
        { en: 'I am invisible/marginalised — people do not hate me but rarely notice me.', cn: '我被边缘化，大家不讨厌我但很少关注我。', tw: '我被邊緣化，大家不討厭我但很少關注我。', score: 1 },
        { en: 'I am actively rejected or intentionally isolated by the group.', cn: '我被主动排斥或刻意孤立。', tw: '我被主動排斥或刻意孤立。', score: 0 },
      ],
    },

    { /* QKA_HS6 */
      id: 'QKA_HS6', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Does your family respect your privacy?',
      cn: '你的家人尊重你的隐私吗？',
      tw: '你的家人尊重你的隱私嗎？',
      options: [
        { en: 'Completely — they knock, never check my phone or diary.', cn: '完全尊重，敲门进来，从不翻手机或日记。', tw: '完全尊重，敲門進來，從不翻手機或日記。', score: 4 },
        { en: 'Mostly — with occasional over-questioning out of care.', cn: '大多数时候尊重，偶尔以关心之名过问。', tw: '大多數時候尊重，偶爾以關心之名過問。', score: 3 },
        { en: 'Frequently — they go through my belongings or interfere with my friendships.', cn: '经常翻我的物品或干涉我的朋友关系。', tw: '經常翻我的物品或干涉我的朋友關係。', score: 1 },
        { en: 'Zero — I am under constant surveillance and control.', cn: '零隐私，被全面监控和管控。', tw: '零隱私，被全面監控和管控。', score: 0 },
      ],
    },

    { /* QKA_HS7 */
      id: 'QKA_HS7', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Are your hobbies allowed by your school or family?',
      cn: '你的爱好被学校或家人允许吗？',
      tw: '你的愛好被學校或家人允許嗎？',
      options: [
        { en: 'Fully supported — they even provide funding or resources.', cn: '完全支持，甚至提供资金或资源。', tw: '完全支持，甚至提供資金或資源。', score: 4 },
        { en: 'Not interfered with — as long as it does not affect my grades.', cn: '不干涉，只要不影响学习就行。', tw: '不干涉，只要不影響學習就行。', score: 3 },
        { en: 'Considered a waste of time and frequently discouraged verbally.', cn: '被认为是浪费时间，经常被言语否定。', tw: '被認為是浪費時間，經常被言語否定。', score: 1 },
        { en: 'Strictly forbidden — items have been confiscated or destroyed.', cn: '被严禁，物品曾被没收或损毁。', tw: '被嚴禁，物品曾被沒收或損毀。', score: 0 },
      ],
    },

    { /* QKA_HS8 */
      id: 'QKA_HS8', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Are you willing to spend time with your family?',
      cn: '你愿意花时间陪伴家人吗？',
      tw: '你願意花時間陪伴家人嗎？',
      options: [
        { en: 'Very willing — my family is my safe haven.', cn: '非常愿意，家是我的避风港。', tw: '非常願意，家是我的避風港。', score: 4 },
        { en: 'Normal — warm moments mixed with generation-gap friction.', cn: '一般，有温馨时刻，也有代沟摩擦。', tw: '一般，有溫馨時刻，也有代溝摩擦。', score: 3 },
        { en: 'Try to avoid — spending time together causes stress or arguments.', cn: '尽量回避，相处会有压力或争吵。', tw: '盡量回避，相處會有壓力或爭吵。', score: 1 },
        { en: 'Extremely resistant — doing everything to escape the house ASAP.', cn: '极度抗拒，想方设法尽早离开家。', tw: '極度抗拒，想方設法盡早離開家。', score: 0 },
      ],
    },

    { /* QKA_HS9 */
      id: 'QKA_HS9', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'How many days a week do you sleep for less than 7 hours?',
      cn: '你一周有几天睡眠不足7小时？',
      tw: '你一週有幾天睡眠不足7小時？',
      options: [
        { en: '0 days — I sleep 7+ hours every day.', cn: '0天，每天睡满7小时以上。', tw: '0天，每天睡滿7小時以上。', score: 4 },
        { en: '1 – 2 days.',                          cn: '1-2天。',                 tw: '1-2天。',                 score: 3 },
        { en: '3 – 5 days.',                          cn: '3-5天。',                 tw: '3-5天。',                 score: 1 },
        { en: '6 – 7 days (severe chronic sleep deprivation).', cn: '6-7天（严重慢性睡眠剥夺）。', tw: '6-7天（嚴重慢性睡眠剝奪）。', score: 0 },
      ],
    },

    { /* QKA_HS10 */
      id: 'QKA_HS10', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Are you willing to share your family life with your friends?',
      cn: '你愿意和朋友分享你的家庭生活吗？',
      tw: '你願意和朋友分享你的家庭生活嗎？',
      options: [
        { en: 'Yes — I openly and happily talk about my family.', cn: '愿意，我开心地分享家庭情况。', tw: '願意，我開心地分享家庭情況。', score: 4 },
        { en: 'Sometimes — I share general things but keep private matters hidden.', cn: '有时，分享一些一般内容，私事保留。', tw: '有時，分享一些一般內容，私事保留。', score: 3 },
        { en: 'Rarely — I prefer to keep my family life completely separate.', cn: '很少，我刻意把家庭生活与朋友隔开。', tw: '很少，我刻意把家庭生活與朋友隔開。', score: 2 },
        { en: 'Never — my family situation is a source of shame or deep distress.', cn: '从不，家庭是我的羞耻或深深的痛苦。', tw: '從不，家庭是我的羞恥或深深的痛苦。', score: 0 },
      ],
    },

    { /* QKA_HS11 */
      id: 'QKA_HS11', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Do you frequently feel tired of studying?',
      cn: '你是否经常感到厌学？',
      tw: '你是否經常感到厭學？',
      options: [
        { en: 'Rarely — I am highly motivated.',              cn: '很少，我动力很强。',             tw: '很少，我動力很強。',             score: 4 },
        { en: 'Occasionally — but I can adjust and keep going.', cn: '偶尔，但能调整后继续。',       tw: '偶爾，但能調整後繼續。',         score: 3 },
        { en: 'Often — studying feels like a heavy burden.',  cn: '经常，学习感觉是沉重的负担。',    tw: '經常，學習感覺是沉重的負擔。',    score: 1 },
        { en: 'Constantly — I have completely given up on my studies.', cn: '持续，我已经完全放弃学业。', tw: '持續，我已經完全放棄學業。', score: 0 },
      ],
    },

    { /* QKA_HS12 */
      id: 'QKA_HS12', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 0; },
      en: 'Do you feel completely at a loss about your future?',
      cn: '你是否对未来感到完全迷茫？',
      tw: '你是否對未來感到完全迷茫？',
      options: [
        { en: 'Not at all — I have clear goals and a plan.', cn: '完全不，我有清晰的目标和计划。', tw: '完全不，我有清晰的目標和計劃。', score: 4 },
        { en: 'A little confused — but I know the general direction.', cn: '有点迷茫，但大方向还是清楚的。', tw: '有點迷茫，但大方向還是清楚的。', score: 3 },
        { en: 'Very anxious — I have no idea what I will do.', cn: '非常焦虑，完全不知道自己该做什么。', tw: '非常焦慮，完全不知道自己該做什麼。', score: 1 },
        { en: 'Completely paralysed by fear of the future — I have given up planning.', cn: '对未来的恐惧完全让我瘫痪，已放弃规划。', tw: '對未來的恐懼完全讓我癱瘓，已放棄規劃。', score: 0 },
      ],
    },


    /* ─── AAB / AAC: College + Bachelor (shared questions) ─── */

    { /* QKA_BC1 — Depression */
      id: 'QKA_BC1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      en: 'Have you ever felt depressed?',
      cn: '你是否曾经历过抑郁状态？',
      tw: '你是否曾經歷過憂鬱狀態？',
      options: [
        { en: 'Never — my mental state is very healthy.', cn: '从未，我的心理状态非常健康。', tw: '從未，我的心理狀態非常健康。', score: 4 },
        { en: 'Occasionally feeling down, but I recover quickly.', cn: '偶尔情绪低落，但能很快恢复。', tw: '偶爾情緒低落，但能很快恢復。', score: 3 },
        { en: 'Frequently experiencing prolonged periods of low mood.', cn: '频繁出现持续性低落情绪。', tw: '頻繁出現持續性低落情緒。', score: 1 },
        { en: 'Yes — I have experienced or am experiencing clinical depression.', cn: '是，我曾经历或正经历临床抑郁症。', tw: '是，我曾經歷或正在經歷臨床憂鬱症。', score: 0 },
      ],
    },

    { /* QKA_BC2 — Study status */
      id: 'QKA_BC2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      en: 'What is your current study status?',
      cn: '你目前的学业状况如何？',
      tw: '你目前的學業狀況如何？',
      options: [
        { en: 'Top of the class — excelling in almost everything.', cn: '名列前茅，几乎全面领先。', tw: '名列前茅，幾乎全面領先。', score: 4 },
        { en: 'Above average — performing solidly.', cn: '中上水平，表现稳定扎实。', tw: '中上水平，表現穩定扎實。', score: 3 },
        { en: 'Average — just doing enough to pass.', cn: '一般，勉强及格。', tw: '一般，勉強及格。', score: 2 },
        { en: 'Struggling heavily — at risk of failing or dropping out.', cn: '严重吃力，面临不及格或退学风险。', tw: '嚴重吃力，面臨不及格或退學風險。', score: 0 },
      ],
    },

    { /* QKA_BC3 — Job relevance */
      id: 'QKA_BC3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      en: 'Will your studies help you find a suitable job?',
      cn: '你的学业能帮你找到合适的工作吗？',
      tw: '你的學業能幫你找到合適的工作嗎？',
      options: [
        { en: 'Definitely — my major has high demand and clear career paths.', cn: '肯定，我的专业需求旺盛且职业路径清晰。', tw: '肯定，我的專業需求旺盛且職業路徑清晰。', score: 4 },
        { en: 'Likely — it provides a good foundation for various fields.', cn: '大概率，能为多个领域打好基础。', tw: '大概率，能為多個領域打好基礎。', score: 3 },
        { en: 'Unlikely — the skills are mismatched with market needs.', cn: '不太可能，技能与市场需求不匹配。', tw: '不太可能，技能與市場需求不匹配。', score: 1 },
        { en: 'Absolutely not — my degree is practically useless for employment.', cn: '完全不可能，我的学位对就业几乎毫无用处。', tw: '完全不可能，我的學位對就業幾乎毫無用處。', score: 0 },
      ],
    },

    { /* QKA_BC4 — Scholarship */
      id: 'QKA_BC4', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      en: 'Have you received a scholarship?',
      cn: '你是否获得过奖学金？',
      tw: '你是否獲得過獎學金？',
      options: [
        { en: 'Yes — top-tier or national-level scholarship.', cn: '有，顶级或国家级奖学金。', tw: '有，頂級或國家級獎學金。', score: 4 },
        { en: 'Yes — standard or minor scholarship.', cn: '有，普通或小额奖学金。', tw: '有，普通或小額獎學金。', score: 3 },
        { en: 'No — but my grades are decent.', cn: '没有，但成绩还不错。', tw: '沒有，但成績還不錯。', score: 2 },
        { en: 'No — my grades are too low to qualify.', cn: '没有，成绩太低无法获得资格。', tw: '沒有，成績太低無法獲得資格。', score: 0 },
      ],
    },

    { /* QKA_BC5 — Leadership role */
      id: 'QKA_BC5', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      en: 'Do you hold an important role (e.g. student council, club president)?',
      cn: '你是否担任重要职务（如学生会、社团会长等）？',
      tw: '你是否擔任重要職務（如學生會、社團會長等）？',
      options: [
        { en: 'Yes — I hold a core leadership position.', cn: '有，我担任核心领导职务。', tw: '有，我擔任核心領導職務。', score: 4 },
        { en: 'Yes — I hold a minor or departmental role.', cn: '有，我担任小型或院系级职务。', tw: '有，我擔任小型或院系級職務。', score: 3 },
        { en: 'No — but I actively participate as a member.', cn: '没有，但我积极参与为成员。', tw: '沒有，但我積極參與為成員。', score: 2 },
        { en: 'No — I do not participate in any extracurriculars.', cn: '没有，我不参与任何课外活动。', tw: '沒有，我不參與任何課外活動。', score: 1 },
      ],
    },

    { /* QKA_BC6 — Mental clarity */
      id: 'QKA_BC6', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      en: 'Do you feel your mind is clear enough when studying?',
      cn: '你学习时思维是否足够清晰？',
      tw: '你學習時思維是否足夠清晰？',
      options: [
        { en: 'Extremely sharp — I grasp concepts quickly.', cn: '极度清晰，我能快速掌握知识点。', tw: '極度清晰，我能快速掌握知識點。', score: 4 },
        { en: 'Generally clear — though complex topics take time.', cn: '总体清晰，遇到复杂知识需要时间消化。', tw: '總體清晰，遇到複雜知識需要時間消化。', score: 3 },
        { en: 'Often foggy — I struggle to concentrate.', cn: '经常脑雾，难以集中注意力。', tw: '經常腦霧，難以集中注意力。', score: 1 },
        { en: 'Completely blank — I cannot process academic information at all.', cn: '完全空白，根本无法处理学业信息。', tw: '完全空白，根本無法處理學業資訊。', score: 0 },
      ],
    },

    { /* QKA_BC7 — Foreign language proficiency */
      id: 'QKA_BC7', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && (s.QKA_STAGE === 1 || s.QKA_STAGE === 2 || s.QKA_STAGE === 3); },
      en: 'What is your foreign language proficiency? (e.g. English, if not your native language)',
      cn: '你的外语（如英语）水平如何？',
      tw: '你的外語（如英語）水平如何？',
      options: [
        { en: 'Fluent — can read original texts and hold deep academic/business conversations.', cn: '流利，能读原版文献并进行深度学术/商业交流。', tw: '流利，能讀原版文獻並進行深度學術/商業交流。', score: 4 },
        { en: 'Proficient — hold advanced certificates, handle daily professional tasks.', cn: '熟练，持有高级证书，能应对日常专业任务。', tw: '熟練，持有高級證書，能應對日常專業任務。', score: 3 },
        { en: 'Basic — passed exams but struggle with real-world communication.', cn: '基础，通过了考试但实际交流困难。', tw: '基礎，通過了考試但實際交流困難。', score: 2 },
        { en: 'Zero/Poor — cannot use the language to acquire information at all.', cn: '零基础/很差，完全无法用该语言获取信息。', tw: '零基礎/很差，完全無法用該語言獲取資訊。', score: 0 },
      ],
    },


    /* ─── AAD: Master's & above (extra questions, then merges with BC) ─── */

    { /* QKA_D1 — Research direction */
      id: 'QKA_D1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 3; },
      en: 'Do you currently have a clear research direction, thesis topic, or project?',
      cn: '你目前有清晰的研究方向、论文题目或课题吗？',
      tw: '你目前有清晰的研究方向、論文題目或課題嗎？',
      options: [
        { en: 'Yes — confirmed and progressing smoothly.', cn: '有，已确定且进展顺利。', tw: '有，已確定且進展順利。', score: 4 },
        { en: 'Exploring options — have a general idea.', cn: '正在探索，有大致方向。', tw: '正在探索，有大致方向。', score: 3 },
        { en: 'Completely lost — no direction yet.', cn: '完全迷茫，尚无方向。', tw: '完全迷茫，尚無方向。', score: 1 },
        { en: 'Facing severe roadblocks — considering changing topics or quitting.', cn: '面临严重阻碍，考虑换题或退学。', tw: '面臨嚴重阻礙，考慮換題或退學。', score: 0 },
      ],
    },

    { /* QKA_D2 — Funding / supervisor support */
      id: 'QKA_D2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 3; },
      en: 'Does your research project have stable funding or support from your supervisor\'s lab?',
      cn: '你的科研项目是否有稳定的经费或导师支持？',
      tw: '你的科研項目是否有穩定的經費或導師支持？',
      options: [
        { en: 'Abundant funding and state-of-the-art equipment.', cn: '充裕经费和顶尖设备。', tw: '充裕經費和頂尖設備。', score: 4 },
        { en: 'Adequate support — enough to get by.', cn: '支持足够，勉强能推进。', tw: '支持足夠，勉強能推進。', score: 3 },
        { en: 'Lack of support — requiring self-funding or frequent delays.', cn: '缺乏支持，需自费或频繁延误。', tw: '缺乏支持，需自費或頻繁延誤。', score: 1 },
        { en: 'Zero support — entirely abandoned by the supervisor or system.', cn: '零支持，被导师或体制完全放弃。', tw: '零支持，被導師或體制完全放棄。', score: 0 },
      ],
    },

    { /* QKA_D3 — Publications / patents */
      id: 'QKA_D3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 0 && s.QKA_STAGE === 3; },
      en: 'Have you published core journal papers or produced important patents?',
      cn: '你是否发表过核心期刊论文或产出重要专利？',
      tw: '你是否發表過核心期刊論文或產出重要專利？',
      options: [
        { en: 'Yes — top-tier publications as first author.', cn: '有，顶级刊物第一作者。', tw: '有，頂級刊物第一作者。', score: 4 },
        { en: 'Yes — standard publications meeting graduation requirements.', cn: '有，达到毕业要求的普通发表。', tw: '有，達到畢業要求的普通發表。', score: 3 },
        { en: 'No — but currently submitting or writing.', cn: '没有，但正在投稿或撰写中。', tw: '沒有，但正在投稿或撰寫中。', score: 2 },
        { en: 'No — and no prospects of doing so soon.', cn: '没有，且暂无发表前景。', tw: '沒有，且暫無發表前景。', score: 0 },
      ],
    },


    /* ─── AB: Employed ─── */

    { /* QKAB1 — Work shifts / hours */
      id: 'QKAB1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      en: 'Which situation describes your current work shifts and hours?',
      cn: '以下哪种情况符合你目前的工作班次和时长？',
      tw: '以下哪種情況符合你目前的工作班次和時長？',
      options: [
        { en: 'Regular day shift, one day off per week.',              cn: '正常白班，每周休一天。',           tw: '正常白班，每週休一天。',           score: 3 },
        { en: 'Regular day shift, weekends off.',                      cn: '正常白班，周末双休。',              tw: '正常白班，週末雙休。',              score: 4 },
        { en: 'Long-term night shift.',                                cn: '长期夜班。',                        tw: '長期夜班。',                        score: 1 },
        { en: 'Day and night reversed (irregular schedule).',          cn: '昼夜颠倒（不规律）。',              tw: '晝夜顛倒（不規律）。',              score: 1 },
        { en: 'High-intensity overtime — working over 55 hours/week.', cn: '高强度加班，每周超过55小时。',      tw: '高強度加班，每週超過55小時。',      score: 0 },
        { en: 'Free/Flexible schedule.',                               cn: '自由/弹性上班。',                   tw: '自由/彈性上班。',                   score: 4 },
      ],
    },

    { /* QKAB2 — Job-skill match */
      id: 'QKAB2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      en: 'Does your job content match your core skills?',
      cn: '你的工作内容是否与你的核心技能匹配？',
      tw: '你的工作內容是否與你的核心技能匹配？',
      options: [
        { en: 'Highly matched — I can fully utilise my strengths.', cn: '高度匹配，能充分发挥我的优势。', tw: '高度匹配，能充分發揮我的優勢。', score: 4 },
        { en: 'Partially matched — I am learning on the job.', cn: '部分匹配，边做边学。', tw: '部分匹配，邊做邊學。', score: 2 },
        { en: 'Completely mismatched — purely mechanical labour.', cn: '完全不匹配，纯粹机械劳动。', tw: '完全不匹配，純粹機械勞動。', score: 0 },
      ],
    },

    { /* QKAB3 — Labor intensity */
      id: 'QKAB3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      en: 'How is your overall labour intensity and work pressure?',
      cn: '你的总体劳动强度和工作压力如何？',
      tw: '你的總體勞動強度和工作壓力如何？',
      options: [
        { en: 'Extremely relaxed — actual work is less than 4 hours a day.', cn: '极度轻松，实际工作不足4小时/天。', tw: '極度輕鬆，實際工作不足4小時/天。', score: 4 },
        { en: 'Moderate & Healthy — busy but manageable, can fully disconnect after work.', cn: '适中健康，忙碌可控，下班能完全脱离。', tw: '適中健康，忙碌可控，下班能完全脫離。', score: 3 },
        { en: 'High-pressure drain — constantly on call, causing health issues.', cn: '高压耗损，随时待命，已出现健康问题。', tw: '高壓耗損，隨時待命，已出現健康問題。', score: 1 },
        { en: 'Extreme exploitation — severely burning out, on the verge of physical collapse.', cn: '极度剥削，严重燃尽，濒临身体崩溃。', tw: '極度剝削，嚴重燃盡，瀕臨身體崩潰。', score: 0 },
      ],
    },

    { /* QKAB4 — Daily income balance */
      id: 'QKAB4', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      en: 'What is your daily after-tax income balance after deducting rent/mortgage and basic food?',
      cn: '扣除房租/房贷和基本餐食后，你每日税后收入结余如何？',
      tw: '扣除房租/房貸和基本餐食後，你每日稅後收入結餘如何？',
      options: [
        { en: 'Abundant surplus — free to save and invest.',   cn: '大量结余，可自由储蓄和投资。',   tw: '大量結餘，可自由儲蓄和投資。',   score: 4 },
        { en: 'Small surplus — can occasionally buy expensive items.', cn: '小额结余，偶尔能购买贵重物品。', tw: '小額結餘，偶爾能購買貴重物品。', score: 3 },
        { en: 'Paycheck to paycheck — barely covers survival.', cn: '月光，勉强维持生存。', tw: '月光，勉強維持生存。', score: 1 },
        { en: 'Expenses exceed income — in debt.', cn: '入不敷出，负债中。', tw: '入不敷出，負債中。', score: 0 },
      ],
    },

    { /* QKAB5 — Exercise and nutrition */
      id: 'QKAB5', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      en: 'Can you guarantee regular moderate-to-high intensity exercise and focused nutrition in your spare time?',
      cn: '你能保证在业余时间定期进行中高强度运动并注重饮食营养吗？',
      tw: '你能保證在業餘時間定期進行中高強度運動並注重飲食營養嗎？',
      options: [
        { en: 'Over 3 times a week with a structured diet.', cn: '每周3次以上，有系统性饮食管理。', tw: '每週3次以上，有系統性飲食管理。', score: 4 },
        { en: 'Occasional exercise — diet depends on mood.', cn: '偶尔运动，饮食随心情而定。', tw: '偶爾運動，飲食隨心情而定。', score: 2 },
        { en: 'Rarely exercise — rely heavily on fast food / takeout.', cn: '很少运动，严重依赖外卖快餐。', tw: '很少運動，嚴重依賴外賣快餐。', score: 1 },
        { en: 'Spare time is too tight to manage anything.', cn: '业余时间太紧，根本没余力顾及。', tw: '業餘時間太緊，根本沒餘力顧及。', score: 0 },
      ],
    },

    { /* QKAB6 — Promotion / growth opportunity */
      id: 'QKAB6', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      en: 'Has there been a clear opportunity for promotion, salary increase, or skill improvement in your role or industry over the past year?',
      cn: '过去一年，你的职位或行业是否出现清晰的晋升、加薪或技能提升机会？',
      tw: '過去一年，你的職位或行業是否出現清晰的晉升、加薪或技能提升機會？',
      options: [
        { en: 'Yes — I have already received a promotion or significant raise.', cn: '有，我已经获得晋升或大幅加薪。', tw: '有，我已經獲得晉升或大幅加薪。', score: 4 },
        { en: 'Yes — the path is clear and I am actively working towards it.', cn: '有，路径清晰，我正积极努力中。', tw: '有，路徑清晰，我正積極努力中。', score: 3 },
        { en: 'Stagnant — no chance for a raise, doing repetitive tasks.', cn: '停滞不前，无加薪机会，重复性工作。', tw: '停滯不前，無加薪機會，重複性工作。', score: 1 },
        { en: 'The industry is shrinking — facing imminent layoffs or pay cuts.', cn: '行业萎缩，面临即将裁员或降薪。', tw: '行業萎縮，面臨即將裁員或降薪。', score: 0 },
      ],
    },

    { /* QKAB7 — Job market resilience */
      id: 'QKAB7', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1; },
      en: 'If you lose your current job tomorrow, can your current abilities allow you to cope calmly?',
      cn: '如果明天失去这份工作，你目前的能力能让你从容应对吗？',
      tw: '如果明天失去這份工作，你目前的能力能讓你從容應對嗎？',
      options: [
        { en: 'No pressure — I can easily find a better job or have a strong side business.', cn: '毫无压力，能轻松找到更好的工作或有强大的副业。', tw: '毫無壓力，能輕鬆找到更好的工作或有強大的副業。', score: 4 },
        { en: 'Need a 1–3 month transition, but confident in finding good work.', cn: '需要1-3个月过渡，但对找到好工作有信心。', tw: '需要1-3個月過渡，但對找到好工作有信心。', score: 3 },
        { en: 'Very anxious — it would be hard to match my current income elsewhere.', cn: '非常焦虑，很难在别处匹配现有收入。', tw: '非常焦慮，很難在別處匹配現有收入。', score: 1 },
        { en: 'Fatal blow — my skills lack market value, my life would halt immediately.', cn: '致命打击，我的技能缺乏市场价值，生活会立即停摆。', tw: '致命打擊，我的技能缺乏市場價值，生活會立即停擺。', score: 0 },
      ],
    },


    /* ─── AC: Entrepreneur ─── */

    { /* QKAC1 — Cash flow stage */
      id: 'QKAC1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 2; },
      en: "What stage is your business/project's cash flow in?",
      cn: '你的业务/项目目前处于哪个现金流阶段？',
      tw: '你的業務/項目目前處於哪個現金流階段？',
      options: [
        { en: 'Stable profit and maintaining growth.', cn: '稳定盈利并保持增长。', tw: '穩定盈利並保持增長。', score: 4 },
        { en: 'Basically achieving break-even.', cn: '基本实现收支平衡。', tw: '基本實現收支平衡。', score: 2 },
        { en: 'Operating at a loss — relying on savings or financing.', cn: '亏损中，靠积蓄或融资维持。', tw: '虧損中，靠積蓄或融資維持。', score: 1 },
        { en: 'Extremely high debt — facing the risk of a broken capital chain.', cn: '极高负债，面临资金链断裂风险。', tw: '極高負債，面臨資金鏈斷裂風險。', score: 0 },
      ],
    },

    { /* QKAC2 — Weekly hours */
      id: 'QKAC2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 2; },
      en: 'How many hours on average do you work for your business each week?',
      cn: '你平均每周为自己的业务工作多少小时？',
      tw: '你平均每週為自己的業務工作多少小時？',
      options: [
        { en: 'Under 40 hours (the system runs relatively maturely).', cn: '40小时以内（运营体系相对成熟）。', tw: '40小時以內（運營體系相對成熟）。', score: 4 },
        { en: '40 – 60 hours.',                                        cn: '40-60小时。',                     tw: '40-60小時。',                     score: 3 },
        { en: '60 – 80 hours.',                                        cn: '60-80小时。',                     tw: '60-80小時。',                     score: 1 },
        { en: 'Over 80 hours (working year-round, deeply tied to the business).', cn: '80小时以上（全年无休，高度绑定业务）。', tw: '80小時以上（全年無休，高度綁定業務）。', score: 0 },
      ],
    },

    { /* QKAC3 — Customer stickiness */
      id: 'QKAC3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 2; },
      en: 'Does your product/service currently have a stable core customer base or regular repurchases?',
      cn: '你的产品/服务目前是否有稳定的核心客户群或定期复购？',
      tw: '你的產品/服務目前是否有穩定的核心客戶群或定期復購？',
      options: [
        { en: 'High customer stickiness — stable positive feedback and conversion.', cn: '客户粘性高，正向反馈和转化稳定。', tw: '客戶黏性高，正向反饋和轉化穩定。', score: 4 },
        { en: 'Some customers — but high churn rate.', cn: '有一些客户，但流失率高。', tw: '有一些客戶，但流失率高。', score: 2 },
        { en: 'Still in the cold start phase — very few transactions.', cn: '仍处于冷启动阶段，交易极少。', tw: '仍處於冷啟動階段，交易極少。', score: 1 },
      ],
    },


    /* ─── AD: Unemployed ─── */

    { /* QKAD1 — Savings runway */
      id: 'QKAD1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 3; },
      en: 'Without lowering your current basic living standards, how long can your savings or passive income support you?',
      cn: '在不降低基本生活水准的前提下，你的储蓄或被动收入能支撑多久？',
      tw: '在不降低基本生活水準的前提下，你的儲蓄或被動收入能支撐多久？',
      options: [
        { en: 'Over 2 years / already achieved financial freedom.', cn: '2年以上/已实现财务自由。', tw: '2年以上/已實現財務自由。', score: 4 },
        { en: 'Half a year to 2 years.',                           cn: '半年到2年。',             tw: '半年到2年。',             score: 3 },
        { en: '3 months to half a year.',                          cn: '3个月到半年。',            tw: '3個月到半年。',            score: 1 },
        { en: 'Could break at any moment — highly dependent on others for support.', cn: '随时可能断炊，高度依赖他人资助。', tw: '隨時可能斷炊，高度依賴他人資助。', score: 0 },
      ],
    },

    { /* QKAD2 — Regular schedule */
      id: 'QKAD2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 3; },
      en: 'Do you currently maintain a regular schedule and arrange fixed tasks during the day?',
      cn: '你目前是否保持规律作息并为白天安排固定任务？',
      tw: '你目前是否保持規律作息並為白天安排固定任務？',
      options: [
        { en: 'Extremely regular schedule with clear to-do lists every day.', cn: '非常规律，每天有清晰的待办清单。', tw: '非常規律，每天有清晰的待辦清單。', score: 4 },
        { en: 'Occasionally regular — mostly random.',              cn: '偶尔规律，大多数时候随意。', tw: '偶爾規律，大多數時候隨意。', score: 2 },
        { en: 'Long-term reversed schedule — spending over 5 hours a day on short videos or phone.', cn: '长期昼夜颠倒，每天超过5小时刷短视频或手机。', tw: '長期晝夜顛倒，每天超過5小時刷短視頻或手機。', score: 0 },
      ],
    },


    /* ─── AE: Retired ─── */

    { /* QKAE1 — Pension adequacy */
      id: 'QKAE1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 4; },
      en: 'Can your monthly fixed pension/passive income cover daily medical and living expenses?',
      cn: '你每月的固定养老金/被动收入是否能覆盖日常医疗和生活支出？',
      tw: '你每月的固定養老金/被動收入是否能覆蓋日常醫療和生活支出？',
      options: [
        { en: 'Abundant — can support travel or hobbies.', cn: '充裕，还能支持旅游和兴趣爱好。', tw: '充裕，還能支持旅遊和興趣愛好。', score: 4 },
        { en: 'Just covers basic living and basic medical needs.', cn: '刚好覆盖基本生活和基本医疗。', tw: '剛好覆蓋基本生活和基本醫療。', score: 3 },
        { en: 'Requires regular subsidies from children.', cn: '需要子女定期补贴。', tw: '需要子女定期補貼。', score: 1 },
        { en: 'Relatively tight — feeling pressure when seeing a doctor.', cn: '比较紧张，看病都有压力。', tw: '比較緊張，看病都有壓力。', score: 0 },
      ],
    },

    { /* QKAE2 — Physical independence */
      id: 'QKAE2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 4; },
      en: 'How much does your current physical condition affect your independent daily life?',
      cn: '你目前的身体状况对日常自理生活的影响有多大？',
      tw: '你目前的身體狀況對日常自理生活的影響有多大？',
      options: [
        { en: 'Completely independent — can participate in moderate-intensity activities (brisk walking, dancing).', cn: '完全自理，可参加中等强度活动（快走、跳舞）。', tw: '完全自理，可參加中等強度活動（快走、跳舞）。', score: 4 },
        { en: 'Have chronic diseases but well-controlled by medication — fully self-sufficient.', cn: '有慢性病但药物控制良好，完全自理。', tw: '有慢性病但藥物控制良好，完全自理。', score: 3 },
        { en: 'Require assistance from others for daily living.', cn: '日常生活需要他人协助。', tw: '日常生活需要他人協助。', score: 1 },
        { en: 'Bedridden long-term.', cn: '长期卧床。', tw: '長期臥床。', score: 0 },
      ],
    },


    /* ─── AF / AG: Seriously Ill / Post-Accident ─── */

    { /* QKAF1 — Sleep disruption from pain */
      id: 'QKAF1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 5 || s.QK3 === 6; },
      en: 'How many days a week are you unable to sleep peacefully (less than 5 hours) due to physical pain or severe discomfort?',
      cn: '你一周有几天因身体疼痛或严重不适而无法安睡（少于5小时）？',
      tw: '你一週有幾天因身體疼痛或嚴重不適而無法安睡（少於5小時）？',
      options: [
        { en: 'Almost zero — pain is well managed.', cn: '几乎没有，疼痛得到良好控制。', tw: '幾乎沒有，疼痛得到良好控制。', score: 4 },
        { en: '1 – 2 days.',                         cn: '1-2天。',                    tw: '1-2天。',                    score: 3 },
        { en: '3 – 5 days.',                         cn: '3-5天。',                    tw: '3-5天。',                    score: 1 },
        { en: 'Almost every day.',                   cn: '几乎每天。',                 tw: '幾乎每天。',                 score: 0 },
      ],
    },

    { /* QKAF2 — Caregiver presence */
      id: 'QKAF2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 5 || s.QK3 === 6; },
      en: 'During treatment or restricted mobility, do you have a regular caregiver nearby?',
      cn: '在治疗或行动受限期间，你身边是否有固定的照护者？',
      tw: '在治療或行動受限期間，你身邊是否有固定的照護者？',
      options: [
        { en: 'Yes — professional or full-time family care support.', cn: '有，专业或全职家人照护。', tw: '有，專業或全職家人照護。', score: 4 },
        { en: 'Yes — rotating shifts of care, barely maintaining.', cn: '有，轮班照护，勉强维持。', tw: '有，輪班照護，勉強維持。', score: 2 },
        { en: 'Lack of care — mostly enduring it alone.', cn: '缺乏照护，大多数时候独自忍受。', tw: '缺乏照護，大多數時候獨自忍受。', score: 0 },
      ],
    },

    { /* QKAF3 — Physical independence (same as AE) */
      id: 'QKAF3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 5 || s.QK3 === 6; },
      en: 'How much does your current physical condition affect your independent daily life?',
      cn: '你目前的身体状况对日常自理生活的影响有多大？',
      tw: '你目前的身體狀況對日常自理生活的影響有多大？',
      options: [
        { en: 'Completely independent — can participate in moderate-intensity activities.', cn: '完全自理，可参加中等强度活动。', tw: '完全自理，可參加中等強度活動。', score: 4 },
        { en: 'Have chronic diseases but well-controlled — fully self-sufficient.', cn: '有慢性病但药物控制良好，完全自理。', tw: '有慢性病但藥物控制良好，完全自理。', score: 3 },
        { en: 'Require assistance from others for daily living.', cn: '日常生活需要他人协助。', tw: '日常生活需要他人協助。', score: 1 },
        { en: 'Bedridden long-term.', cn: '长期卧床。', tw: '長期臥床。', score: 0 },
      ],
    },


    /* ─── AH: Restricted Movement ─── */

    { /* QKAH1 — Duration */
      id: 'QKAH1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 7; },
      en: 'How long is this restricted mobility status expected to last?',
      cn: '这次行动受限的状态预计会持续多久？',
      tw: '這次行動受限的狀態預計會持續多久？',
      options: [
        { en: 'Short-term — will return to normal within a few months.', cn: '短期，数月内可恢复正常。', tw: '短期，數月內可恢復正常。', score: 3 },
        { en: 'Medium-to-long term — ranging from a year to several years.', cn: '中长期，从一年到数年不等。', tw: '中長期，從一年到數年不等。', score: 1 },
        { en: 'Permanent or indefinitely restricted.', cn: '永久或无限期受限。', tw: '永久或無限期受限。', score: 0 },
      ],
    },

    { /* QKAH2 — Communication frequency */
      id: 'QKAH2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 7; },
      en: 'During the restriction period, what is your frequency of effective communication with the outside world?',
      cn: '在受限期间，你与外界（社会、亲属或网络）的有效沟通频率如何？',
      tw: '在受限期間，你與外界（社會、親屬或網路）的有效溝通頻率如何？',
      options: [
        { en: 'Can communicate smoothly every day — continuous access to new information.', cn: '每天顺畅沟通，持续获取新信息。', tw: '每天順暢溝通，持續獲取新資訊。', score: 4 },
        { en: 'Fixed opportunities a few times a week for limited communication.', cn: '每周几次固定机会进行有限沟通。', tw: '每週幾次固定機會進行有限溝通。', score: 3 },
        { en: 'Occasional letters or very brief contacts monthly.', cn: '偶尔书信或每月极简短联系。', tw: '偶爾書信或每月極簡短聯繫。', score: 1 },
        { en: 'Completely isolated from the world — in an information black hole.', cn: '与外界完全隔绝，处于信息真空中。', tw: '與外界完全隔絕，處於資訊真空中。', score: 0 },
      ],
    },


    /* ─── AI: Full-time Caregiver ─── */

    { /* QKAI1 — Off-duty rest */
      id: 'QKAI1', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 8; },
      en: 'Do you have at least one or two days a week of completely "off-duty" rest time?',
      cn: '你每周是否有至少一两天完全"下班"的休息时间？',
      tw: '你每週是否有至少一兩天完全「下班」的休息時間？',
      options: [
        { en: 'Yes — a partner/elder takes over completely; I have absolute free days.', cn: '有，伴侣/长辈完全接手，我有绝对自由的天数。', tw: '有，伴侶/長輩完全接手，我有絕對自由的天數。', score: 4 },
        { en: 'Only fragmented hours daily (e.g. when the child sleeps).', cn: '只有每天的零散几小时（如孩子睡着时）。', tw: '只有每天的零散幾小時（如孩子睡著時）。', score: 2 },
        { en: 'Very rarely — someone occasionally helps for a short while.', cn: '极少，偶尔有人短暂帮忙。', tw: '極少，偶爾有人短暫幫忙。', score: 1 },
        { en: 'Absolutely none — on call 24/7 year-round.', cn: '完全没有，全年24/7随时待命。', tw: '完全沒有，全年24/7隨時待命。', score: 0 },
      ],
    },

    { /* QKAI2 — Additional income */
      id: 'QKAI2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 8; },
      en: 'Do you have additional income channels?',
      cn: '你是否有额外的收入渠道？',
      tw: '你是否有額外的收入渠道？',
      options: [
        { en: 'Stable side-business/investments — partially financially independent.', cn: '稳定副业/投资，部分财务独立。', tw: '穩定副業/投資，部分財務獨立。', score: 4 },
        { en: 'Only relying on my pre-marriage savings.', cn: '只依靠婚前积蓄。', tw: '只依靠婚前積蓄。', score: 2 },
        { en: 'Zero personal income — must ask partner/family for every expense.', cn: '零个人收入，每笔开销都要向伴侣/家人开口。', tw: '零個人收入，每筆開銷都要向伴侶/家人開口。', score: 0 },
      ],
    },

    { /* QKAI3 — Family support */
      id: 'QKAI3', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 8; },
      en: "Does your family's support make your life easier?",
      cn: '家人的支持是否让你的生活更轻松？',
      tw: '家人的支持是否讓你的生活更輕鬆？',
      options: [
        { en: 'Extremely supportive — they provide both financial and emotional backing.', cn: '极度支持，经济和情感都有充分后盾。', tw: '極度支持，經濟和情感都有充分後盾。', score: 4 },
        { en: 'Somewhat supportive — they help when asked but do not take initiative.', cn: '有一定支持，叫了才帮但不主动。', tw: '有一定支持，叫了才幫但不主動。', score: 3 },
        { en: 'Neutral — they do not help much but do not cause trouble.', cn: '中立，帮不上忙但也不添麻烦。', tw: '中立，幫不上忙但也不添麻煩。', score: 2 },
        { en: 'Negative support — they constantly criticise or drain my energy.', cn: '负面支持，持续批评或消耗我的精力。', tw: '負面支持，持續批評或消耗我的精力。', score: 0 },
      ],
    },

    { /* QKAI4 — Partner childcare share */
      id: 'QKAI4', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 8; },
      en: 'What proportion of childcare and daily chores does your partner share?',
      cn: '你的伴侣承担了多少育儿和日常家务？',
      tw: '你的伴侶承擔了多少育兒和日常家務？',
      options: [
        { en: '40%–50%+ — active participant, provides great emotional value.', cn: '40%-50%以上，积极参与，情感价值高。', tw: '40%-50%以上，積極參與，情感價值高。', score: 4 },
        { en: '20%–30% — helps out after work, but I make core decisions.', cn: '20%-30%，下班后帮忙，但核心决策由我做。', tw: '20%-30%，下班後幫忙，但核心決策由我做。', score: 3 },
        { en: '5%–10% — occasionally plays with kids, barely touches chores.', cn: '5%-10%，偶尔陪孩子玩，几乎不碰家务。', tw: '5%-10%，偶爾陪孩子玩，幾乎不碰家務。', score: 1 },
        { en: '0% — absent parenting, adds to the workload and conflict.', cn: '0%，缺席型育儿，还增加负担和矛盾。', tw: '0%，缺席型育兒，還增加負擔和矛盾。', score: 0 },
      ],
    },


    /* ═══════════════════════════════════════════
       SECTION 4 — COMMON (all statuses)
       ═══════════════════════════════════════════ */

    { /* QKC1 — Appearance anxiety — hidden for age 56+ */
      id: 'QKC1', section: 'basic', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 < 5; },
      en: 'Are you anxious about your appearance?',
      cn: '你是否为自己的外表感到焦虑？',
      tw: '你是否為自己的外表感到焦慮？',
      options: [
        { en: 'Completely confident — I rely on health and fitness.', cn: '完全自信，靠健康和体魄说话。', tw: '完全自信，靠健康和體魄說話。', score: 4 },
        { en: 'Occasionally care — spend moderately on grooming.', cn: '偶尔在意，在仪容上适度投入。', tw: '偶爾在意，在儀容上適度投入。', score: 3 },
        { en: 'Frequently anxious — spend heavily on beauty treatments or diets.', cn: '经常焦虑，在美容/减肥上大量花费。', tw: '經常焦慮，在美容/減肥上大量花費。', score: 1 },
        { en: 'Extremely insecure — it is affecting my social life and mental health.', cn: '极度不安全感，已影响社交生活和心理健康。', tw: '極度不安全感，已影響社交生活和心理健康。', score: 0 },
      ],
    },

    { /* QKC2 — Monthly income — open for Employed, Entrepreneur, Retired */
      id: 'QKC2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK3 === 1 || s.QK3 === 2 || s.QK3 === 4; },
      en: 'What is your approximate average monthly income (including all sources of revenue and bonuses)?',
      cn: '你的月收入大概是多少？',
      tw: '你的月收入大概是多少？',
      options: [
        { en: 'Extremely High — top 1% / high net worth.', cn: '极高（前1% / 高净值）。', tw: '極高（前1% / 高淨值）。', score: 4 },
        { en: 'High — solid upper-middle class.',          cn: '高（扎实的中上阶层）。', tw: '高（扎實的中上階層）。', score: 3 },
        { en: 'Moderate — stable and self-sufficient in daily life.', cn: '中等（日常稳定，可自给自足）。', tw: '中等（日常穩定，可自給自足）。', score: 2 },
        { en: 'Low — floating around the survival line.', cn: '低（徘徊在生存线附近）。', tw: '低（徘徊在生存線附近）。', score: 1 },
        { en: 'Extremely Low — facing severe financial pressure.', cn: '极低（面临严重的经济压力）。', tw: '極低（面臨嚴重的經濟壓力）。', score: 0 },
      ],
    },

    { /* QKC3 — Bad habits (multi-select) */
      id: 'QKC3', section: 'basic', scorable: true, multi: true, noAutoAdvance: true,
      scoreMode: 'multi_negative',
      en: 'Which of the following bad habits apply to you? (Multiple choice)',
      cn: '以下不良习惯哪些适用于你？（可多选）',
      tw: '以下不良習慣哪些適用於你？（可多選）',
      options: [
        { en: 'None of the above — highly disciplined.',                                  cn: '以上均无，高度自律。',                         tw: '以上均無，高度自律。',                         score: 4, exclusive: true },
        { en: 'Chain smoking or alcoholism.',                                              cn: '长期大量吸烟或酗酒。',                           tw: '長期大量吸菸或酗酒。',                           score: 0, negative: true },
        { en: 'Frequently staying up late on a long-term basis.',                          cn: '长期频繁熬夜。',                                 tw: '長期頻繁熬夜。',                                 score: 0, negative: true },
        { en: 'Addiction to short videos, adult content, or instant dopamine hits.',       cn: '沉迷短视频、成人内容或即时多巴胺刺激。',         tw: '沉迷短視頻、成人內容或即時多巴胺刺激。',         score: 0, negative: true },
        { en: 'Extremely irregular diet — heavy reliance on junk food.',                   cn: '饮食极度不规律，严重依赖垃圾食品。',             tw: '飲食極度不規律，嚴重依賴垃圾食品。',             score: 0, negative: true },
      ],
    },

    { /* QKC4 — Vision */
      id: 'QKC4', section: 'basic', scorable: true,
      en: 'What is your current vision status?',
      cn: '你目前的视力状况如何？',
      tw: '你目前的視力狀況如何？',
      options: [
        { en: 'Perfect vision — no glasses needed.',                              cn: '视力完好，无需眼镜。',                  tw: '視力完好，無需眼鏡。',                  score: 4 },
        { en: 'Mild myopia/astigmatism — does not affect daily life much.',       cn: '轻度近视/散光，日常影响不大。',          tw: '輕度近視/散光，日常影響不大。',          score: 3 },
        { en: 'Severe myopia/astigmatism — highly dependent on glasses/contacts.', cn: '重度近视/散光，高度依赖眼镜/隐形眼镜。', tw: '重度近視/散光，高度依賴眼鏡/隱形眼鏡。', score: 1 },
        { en: 'Vision impairment that significantly affects daily functioning.',  cn: '视力损伤，严重影响日常活动。',           tw: '視力損傷，嚴重影響日常活動。',           score: 0 },
      ],
    },

    { /* QKC5 — Overall health */
      id: 'QKC5', section: 'basic', scorable: true,
      en: 'What is your overall health status?',
      cn: '你目前的整体健康状况如何？',
      tw: '你目前的整體健康狀況如何？',
      options: [
        { en: 'Extremely strong — highly energetic, rarely get sick.',         cn: '极度健壮，精力充沛，极少生病。',         tw: '極度健壯，精力充沛，極少生病。',         score: 4 },
        { en: 'Generally healthy — minor ailments occasionally.',              cn: '总体健康，偶有小病。',                   tw: '總體健康，偶有小病。',                   score: 3 },
        { en: 'Sub-health — e.g. overweight, chronic back pain, fatigue.',     cn: '亚健康，如超重、慢性腰背痛、疲劳。',     tw: '亞健康，如超重、慢性腰背痛、疲勞。',     score: 2 },
        { en: 'Diagnosed with chronic diseases requiring long-term medication.', cn: '确诊慢性病，需长期用药。',              tw: '確診慢性病，需長期用藥。',              score: 1 },
        { en: 'Suffering from a major illness affecting life expectancy.',     cn: '正与严重疾病抗争，影响预期寿命。',       tw: '正與嚴重疾病抗爭，影響預期壽命。',       score: 0 },
      ],
    },

    { /* QKC6 — Criminal record */
      id: 'QKC6', section: 'social', scorable: true, noImprove: true,
      en: 'Do you have any prior criminal record or history of legal convictions?',
      cn: '你是否有犯罪记录？',
      tw: '你是否有犯罪記錄？',
      options: [
        { en: 'No.',                   cn: '没有。',      tw: '沒有。',      score: 4 },
        { en: 'Yes — a minor offence.', cn: '有，轻微违法。', tw: '有，輕微違法。', score: 2 },
        { en: 'Yes — a major felony.', cn: '有，重大罪行。', tw: '有，重大罪行。', score: 0 },
      ],
    },

    { /* QKC7 — Living environment */
      id: 'QKC7', section: 'basic', scorable: true, noImprove: true,
      en: 'What is your current living environment?',
      cn: '你目前的居住环境是？',
      tw: '你目前的居住環境是？',
      options: [
        { en: 'Multi-person dormitory.',                        cn: '多人宿舍。',              tw: '多人宿舍。',              score: 1 },
        { en: 'Single / private dormitory.',                   cn: '单人宿舍。',              tw: '單人宿舍。',              score: 2 },
        { en: 'Shared apartment with strangers.',              cn: '与陌生人合租公寓。',      tw: '與陌生人合租公寓。',      score: 2 },
        { en: 'Shared apartment with acquaintances.',          cn: '与熟人合租公寓。',        tw: '與熟人合租公寓。',        score: 3 },
        { en: 'Exclusively rented apartment.',                 cn: '独立租住公寓。',          tw: '獨立租住公寓。',          score: 3 },
        { en: 'Self-owned property.',                          cn: '自有房产。',              tw: '自有房產。',              score: 4 },
        { en: 'Family-owned property.',                        cn: '家庭房产（父母/长辈）。',  tw: '家庭房產（父母/長輩）。',  score: 4 },
        { en: 'Luxury residence.',                             cn: '豪华住宅。',              tw: '豪華住宅。',              score: 4 },
      ],
    },

    { /* QKC8 — City tier */
      id: 'QKC8', section: 'basic', scorable: true, noImprove: true,
      en: 'How would you classify the tier of the city you currently reside in? (e.g., Tier 1, New Tier 1, Tier 2, etc.)',
      cn: '你目前居住的城市是哪个层级？',
      tw: '你目前居住的城市是哪個層級？',
      options: [
        { en: 'Village',                   cn: '乡村',     tw: '鄉村',     score: 0 },
        { en: 'Small Town',                cn: '小镇',     tw: '小鎮',     score: 1 },
        { en: 'Prefecture-level City',     cn: '地级市',   tw: '地級市',   score: 2 },
        { en: 'Coastal City',              cn: '沿海城市', tw: '沿海城市', score: 3 },
        { en: 'Major City',                cn: '大城市',   tw: '大城市',   score: 3 },
        { en: 'First-tier City',           cn: '一线城市', tw: '一線城市', score: 4 },
      ],
    },

    { /* QKC9 — Savings level */
      id: 'QKC9', section: 'social', scorable: true,
      en: 'What is your current savings level?',
      cn: '你目前的储蓄水平是？',
      tw: '你目前的儲蓄水平是？',
      options: [
        { en: 'Very strong reserves — can handle long emergencies and major family expenses with little stress.', cn: '储备非常充足，长期突发情况和家庭大额支出都能从容应对。', tw: '儲備非常充足，長期突發情況和家庭大額支出都能從容應對。', score: 4 },
        { en: 'Healthy reserves — daily life is stable, and medium-to-large unexpected costs are manageable.',      cn: '储备健康，日常稳定，遇到中大型意外开支也能承受。',         tw: '儲備健康，日常穩定，遇到中大型意外開支也能承受。',         score: 3 },
        { en: 'Basic reserves — can handle short disruptions but not prolonged pressure.',                            cn: '有基础储备，可应对短期波动，但难以承受长期压力。',         tw: '有基礎儲備，可應對短期波動，但難以承受長期壓力。',         score: 2 },
        { en: 'Very limited reserves — often close to paycheck-to-paycheck.',                                        cn: '储备偏少，常接近月光状态。',                               tw: '儲備偏少，常接近月光狀態。',                               score: 1 },
        { en: 'Net debt position.',                                                                                   cn: '处于净负债状态。',                                       tw: '處於淨負債狀態。',                                       score: 0 },
      ],
    },

    { /* QKC10 — Financial runway */
      id: 'QKC10', section: 'social', scorable: true,
      en: 'If you lost all sources of income today, how long could your savings sustain you?',
      cn: '如果今天失去所有收入来源，你的储蓄能维持你多久？',
      tw: '如果今天失去所有收入來源，你的儲蓄能維持你多久？',
      options: [
        { en: 'Over 5 years / indefinitely.',    cn: '5年以上/无限期。', tw: '5年以上/無限期。', score: 4 },
        { en: '1 to 5 years.',                   cn: '1-5年。',          tw: '1-5年。',          score: 3 },
        { en: '6 months to 1 year.',             cn: '6个月到1年。',     tw: '6個月到1年。',     score: 2 },
        { en: '1 to 6 months.',                  cn: '1-6个月。',        tw: '1-6個月。',        score: 1 },
        { en: 'Less than a month.',              cn: '不足一个月。',     tw: '不足一個月。',     score: 0 },
      ],
    },

    { /* QKC11 — Insurance */
      id: 'QKC11', section: 'social', scorable: true,
      en: 'Do you have protective insurance? (Health, critical illness, accident, etc.)',
      cn: '你是否有保障性保险？（健康险、重疾险、意外险等）',
      tw: '你是否有保障性保險？（健康險、重疾險、意外險等）',
      options: [
        { en: 'Comprehensive coverage — critical illness, medical, accident, and life.', cn: '全面覆盖，含重疾、医疗、意外和寿险。', tw: '全面覆蓋，含重疾、醫療、意外和壽險。', score: 4 },
        { en: 'Basic commercial coverage — medical or critical illness.',               cn: '基础商业险，医疗险或重疾险。',         tw: '基礎商業險，醫療險或重疾險。',         score: 3 },
        { en: 'Only basic government/social insurance.',                                cn: '仅有基本政府/社会保险。',              tw: '僅有基本政府/社會保險。',              score: 2 },
        { en: 'Completely uninsured.',                                                  cn: '完全没有保险。',                       tw: '完全沒有保險。',                       score: 0 },
      ],
    },

    { /* QKC12 — Investment risk tolerance — hidden for Studying+HS (QK3===0 && QKA_STAGE===0) */
      id: 'QKC12', section: 'social', scorable: true,
      showIf: function(s){ return !(s.QK3 === 0 && s.QKA_STAGE === 0); },
      en: 'How is your investment and financial risk tolerance?',
      cn: '你的投资和财务风险承受能力如何？',
      tw: '你的投資和財務風險承受能力如何？',
      options: [
        { en: 'Very high — hold diversified assets, can handle major market dips.',    cn: '非常高，持有多元化资产，能承受大幅回撤。',   tw: '非常高，持有多元化資產，能承受大幅回撤。',   score: 4 },
        { en: 'Moderate — prefer low-risk mutual funds or deposits.',                  cn: '中等，倾向低风险基金或存款。',                tw: '中等，傾向低風險基金或存款。',                score: 3 },
        { en: 'Low — keep everything in cash, afraid of any loss.',                    cn: '低，全部持有现金，害怕任何损失。',            tw: '低，全部持有現金，害怕任何損失。',            score: 2 },
        { en: 'Reckless — frequently engage in unsuitable high-risk trading without understanding the downside.', cn: '鲁莽，经常在不了解风险的情况下参与高风险交易。', tw: '魯莽，經常在不了解風險的情況下參與高風險交易。', score: 0 },
      ],
    },


    /* ═══════════════════════════════════════════
       SECTION B — RELATIONSHIPS
       ═══════════════════════════════════════════ */

    { /* QKB1 — Relationship / marriage status */
      id: 'QKB1', section: 'social', scorable: true,
      en: 'What is your current relationship and marriage status?',
      cn: '你目前的感情与婚姻状况是？',
      tw: '你目前的感情與婚姻狀況是？',
      options: [
        /* 0 BA */ { en: 'A. Never been in a relationship.',                  cn: '从未谈过恋爱。',           tw: '從未談過戀愛。',           score: 1 },
        /* 1 BB */ { en: 'B. Currently in a relationship.',                   cn: '正在恋爱中。',             tw: '正在戀愛中。',             score: 3 },
        /* 2 BC */ { en: 'C. Dated before — currently single.',               cn: '曾恋爱过，目前单身。',     tw: '曾戀愛過，目前單身。',     score: 2 },
        /* 3 BD */ { en: 'D. Married — relationship is happy and sweet.',     cn: '已婚，关系甜蜜幸福。',     tw: '已婚，關係甜蜜幸福。',     score: 4 },
        /* 4 BE */ { en: 'E. Married — relationship is plain/routine.',        cn: '已婚，关系平淡例行。',     tw: '已婚，關係平淡例行。',     score: 3 },
        /* 5 BF */ { en: 'F. Married — on the verge of breaking up.',         cn: '已婚，濒临破裂。',         tw: '已婚，瀕臨破裂。',         score: 1 },
        /* 6 BG */ { en: 'G. I have cheated.',                                cn: '我曾出轨。',               tw: '我曾出軌。',               score: 0 },
        /* 7 BH */ { en: 'H. I have cheated and was caught.',                 cn: '我曾出轨且被发现。',       tw: '我曾出軌且被發現。',       score: 0 },
        /* 8 BI */ { en: 'I. My partner has cheated.',                        cn: '我的伴侣曾出轨。',         tw: '我的伴侶曾出軌。',         score: 1 },
        /* 9 BJ */ { en: 'J. Divorced — currently unmarried.',                cn: '离异，目前未婚。',         tw: '離異，目前未婚。',         score: 1 },
        /* 10 BK*/ { en: 'K. Remarried.',                                     cn: '再婚。',                   tw: '再婚。',                   score: 3 },
        /* 11 BL*/ { en: 'L. Widowed.',                                       cn: '丧偶。',                   tw: '喪偶。',                   score: 1 },
      ],
    },

    { /* QKB2 — Relationship with parents */
      id: 'QKB2', section: 'social', scorable: true,
      en: 'How is your relationship with your parents?',
      cn: '你和父母的关系如何？',
      tw: '你和父母的關係如何？',
      options: [
        { en: 'Excellent — mutual respect, like mature friends.', cn: '非常好，相互尊重，像成熟的朋友。', tw: '非常好，相互尊重，像成熟的朋友。', score: 4 },
        { en: 'Good — regular contact and care, but lack deep connection.', cn: '不错，定期联系关心，但缺乏深度连接。', tw: '不錯，定期聯繫關心，但缺乏深度連接。', score: 3 },
        { en: 'Distant — maintain surface-level peace, avoid meeting.', cn: '疏远，维持表面和平，尽量不见面。', tw: '疏遠，維持表面和平，盡量不見面。', score: 1 },
        { en: 'Toxic — filled with control, manipulation, or constant draining.', cn: '有毒，充满控制、操纵或持续消耗。', tw: '有毒，充滿控制、操縱或持續消耗。', score: 0 },
        { en: 'Parents are deceased, and the relationship was good when they were alive.', cn: '父母已离世，生前关系良好。', tw: '父母已離世，生前關係良好。', score: 3 },
        { en: 'Parents are deceased, and the relationship was average when they were alive.', cn: '父母已离世，生前关系一般。', tw: '父母已離世，生前關係一般。', score: 2 },
      ],
    },

    { /* QKB3 — Sex life — conditional on relationship status */
      id: 'QKB3', section: 'social', scorable: true,
      showIf: function(s){
        return s.QKB1 !== undefined && [1,3,4,5,6,7,8,10].indexOf(s.QKB1) !== -1;
      },
      en: 'Are you satisfied with your sex life?',
      cn: '你对自己的性生活满意吗？',
      tw: '你對自己的性生活滿意嗎？',
      options: [
        { en: 'Highly satisfied — frequency and quality are great.',      cn: '非常满意，频率和质量都很好。', tw: '非常滿意，頻率和質量都很好。', score: 4 },
        { en: 'Generally satisfied — though it could be better.',         cn: '大体满意，但还有提升空间。',   tw: '大體滿意，但還有提升空間。',   score: 3 },
        { en: 'Unsatisfied — frequent mismatches or low frequency.',      cn: '不满意，频繁不匹配或频率极低。', tw: '不滿意，頻繁不匹配或頻率極低。', score: 1 },
        { en: 'Non-existent or a source of major conflict/pain.',         cn: '基本没有，或是重大冲突/痛苦的来源。', tw: '基本沒有，或是重大衝突/痛苦的來源。', score: 0 },
      ],
    },

    { /* QKB4 — Children */
      id: 'QKB4', section: 'social', scorable: false, noImprove: true,
      showIf: function(s){
        return s.QKB1 !== undefined && s.QKB1 !== 0;
      },
      en: 'Do you have children?',
      cn: '你有孩子吗？',
      tw: '你有孩子嗎？',
      options: [
        { en: 'Yes.', cn: '有。', tw: '有。', score: 0 },
        { en: 'No.',  cn: '没有。', tw: '沒有。', score: 0 },
      ],
    },

    { /* QKB5 — Childcare effort — if children (QKB4 === 0) */
      id: 'QKB5', section: 'social', scorable: true,
      showIf: function(s){ return s.QKB4 === 0; },
      en: 'How much personal effort do you invest in raising your children?',
      cn: '你在养育孩子上投入了多少个人精力？',
      tw: '你在養育孩子上投入了多少個人精力？',
      options: [
        { en: 'Massive effort — heavily involved in education and daily care.', cn: '大量投入，深度参与教育和日常照顾。', tw: '大量投入，深度參與教育和日常照顧。', score: 4 },
        { en: 'Moderate effort — share the load equally with partner/helpers.', cn: '适度投入，与伴侣/帮手平均分担。', tw: '適度投入，與伴侶/幫手平均分擔。', score: 3 },
        { en: 'Low effort — mostly rely on partner or grandparents.', cn: '投入较少，主要依靠伴侣或祖父母。', tw: '投入較少，主要依靠伴侶或祖父母。', score: 1 },
        { en: 'Zero effort — completely absent from the child\'s life.', cn: '零投入，完全缺席孩子的生活。', tw: '零投入，完全缺席孩子的生活。', score: 0 },
      ],
    },

    { /* QKB6 — Siblings */
      id: 'QKB6', section: 'social', scorable: true,
      en: 'How is your relationship with your siblings?',
      cn: '你和兄弟姐妹的关系如何？',
      tw: '你和兄弟姊妹的關係如何？',
      options: [
        { en: 'Very close — we support each other constantly.', cn: '非常亲密，持续相互支持。', tw: '非常親密，持續相互支持。', score: 4 },
        { en: 'Friendly — we catch up during holidays.', cn: '友好，节假日时互相联系。', tw: '友好，節假日時互相聯繫。', score: 3 },
        { en: 'Distant — we rarely speak.', cn: '疏远，很少联系。', tw: '疏遠，很少聯繫。', score: 1 },
        { en: 'Hostile — ongoing conflicts or cut ties.', cn: '敌对，持续冲突或已断绝往来。', tw: '敵對，持續衝突或已斷絕往來。', score: 0 },
        { en: 'I am an only child.', cn: '独生子女。', tw: '獨生子女。', score: 2 },
      ],
    },


    /* ═══════════════════════════════════════════
       SECTION C — SKILLS, EXPERIENCES & PSYCHOLOGY
       ═══════════════════════════════════════════ */

    { /* QKD1 — Foreign languages */
      id: 'QKD1', section: 'identity', scorable: true,
      en: 'How many foreign languages do you master?',
      cn: '你掌握了几门外语？',
      tw: '你掌握了幾門外語？',
      options: [
        { en: '3 or more — can use as working languages.', cn: '3门及以上，可作为工作语言。', tw: '3門及以上，可作為工作語言。', score: 4 },
        { en: '2 — highly proficient.',                    cn: '2门，高度熟练。',              tw: '2門，高度熟練。',              score: 3 },
        { en: '1 — fluent communication.',                 cn: '1门，流利交流。',              tw: '1門，流利交流。',              score: 2 },
        { en: 'None — only speak my mother tongue.',       cn: '无，只说母语。',               tw: '無，只說母語。',               score: 0 },
      ],
    },

    { /* QKD2 — Domestic travel */
      id: 'QKD2', section: 'identity', scorable: true,
      en: 'What is your domestic travel experience like?',
      cn: '你的国内旅行经历如何？',
      tw: '你的國內旅行經歷如何？',
      options: [
        { en: 'Traveled extensively across many regions and cities nationwide.', cn: '几乎走遍了全国多个区域与城市。', tw: '幾乎走遍了全國多個區域與城市。', score: 4 },
        { en: 'Visited several major cities or tourist hubs.',             cn: '去过几个主要城市或旅游热点。', tw: '去過幾個主要城市或旅遊熱點。', score: 3 },
        { en: 'Rarely travel — only been to a few nearby places.',        cn: '很少出行，只去过附近几个地方。', tw: '很少出行，只去過附近幾個地方。', score: 1 },
        { en: 'Never left my home region.',                                cn: '从未离开过常住区域。', tw: '從未離開過常住區域。', score: 0 },
      ],
    },

    { /* QKD3 — Overseas travel */
      id: 'QKD3', section: 'identity', scorable: true,
      en: 'What is your overseas travel experience like?',
      cn: '你的海外旅行经历如何？',
      tw: '你的海外旅行經歷如何？',
      options: [
        { en: 'Globetrotter — visited multiple continents and diverse cultures.', cn: '环球旅行者，到访多个洲和多元文化。', tw: '環球旅行者，到訪多個洲和多元文化。', score: 4 },
        { en: 'Visited several neighbouring or popular countries.',               cn: '去过几个邻国或热门国家。', tw: '去過幾個鄰國或熱門國家。', score: 3 },
        { en: 'Been abroad once or twice on guided tours.',                        cn: '出境一两次，参加过跟团旅游。', tw: '出境一兩次，參加過跟團旅遊。', score: 2 },
        { en: "Never been abroad / don't have a passport.",                       cn: '从未出境/没有护照。', tw: '從未出境/沒有護照。', score: 0 },
      ],
    },

    { /* QKD4 — Professional skills (multi-select) */
      id: 'QKD4', section: 'identity', scorable: true, multi: true, noAutoAdvance: true,
      en: 'Which of the following professional skills or achievements apply to you? (Multiple choice)',
      cn: '以下哪些专业技能或成就适用于你？（可多选）',
      tw: '以下哪些專業技能或成就適用於你？（可多選）',
      options: [
        { en: 'Hold licensed or certified professional credentials (e.g. CPA, legal, medical, teaching, engineering).', cn: '持有职业资质或专业证书（如会计、法律、医疗、教师、工程类）。', tw: '持有職業資質或專業證書（如會計、法律、醫療、教師、工程類）。', score: 4 },
        { en: 'Can independently complete paid projects with a proven portfolio (coding/design/operations/content).', cn: '可独立完成有偿项目，并有可验证作品（编程/设计/运营/内容等）。', tw: '可獨立完成有償項目，並有可驗證作品（編程/設計/運營/內容等）。', score: 3 },
        { en: 'Skilled in practical trades/services with stable demand (repair, culinary, beauty, logistics, etc.).', cn: '掌握稳定市场需求的实用技能（维修、餐饮、美业、物流等）。', tw: '掌握穩定市場需求的實用技能（維修、餐飲、美業、物流等）。', score: 3 },
        { en: 'Have reliable workplace productivity skills (Excel, presentations, communication, coordination).', cn: '具备稳定职场基础能力（Excel、演示、沟通协作等）。', tw: '具備穩定職場基礎能力（Excel、演示、溝通協作等）。', score: 2 },
        { en: 'Have basic digital or AI-assisted working ability (office automation, basic data handling).', cn: '具备基础数字化/AI辅助工作能力（办公自动化、基础数据处理）。', tw: '具備基礎數位化/AI輔助工作能力（辦公自動化、基礎數據處理）。', score: 2 },
        { en: 'No specific marketable skills.', cn: '没有特定的市场化技能。', tw: '沒有特定的市場化技能。', score: 0, exclusive: true },
      ],
    },

    { /* QKD5 — Confide (multi-select) */
      id: 'QKD5', section: 'identity', scorable: true, multi: true, noAutoAdvance: true,
      en: 'When facing difficulties, who can you confide in? (Multiple choice)',
      cn: '遇到困难时，你可以向谁倾诉？（可多选）',
      tw: '遇到困難時，你可以向誰傾訴？（可多選）',
      options: [
        { en: 'Unconditionally supportive partner/family.', cn: '无条件支持的伴侣/家人。', tw: '無條件支持的伴侶/家人。', score: 4 },
        { en: '2–3 absolute lifelong confidants.', cn: '2-3个绝对的终生知己。', tw: '2-3個絕對的終生知己。', score: 3 },
        { en: 'Paid professional therapists.', cn: '付费专业心理咨询师。', tw: '付費專業心理諮詢師。', score: 2 },
        { en: 'Strangers on the internet / forums.', cn: '网上的陌生人/论坛。', tw: '網上的陌生人/論壇。', score: 1 },
        { en: 'Nobody — I have to digest it all by myself.', cn: '没有人，只能独自消化。', tw: '沒有人，只能獨自消化。', score: 0, exclusive: true },
      ],
    },

    { /* QKD6 — Curiosity */
      id: 'QKD6', section: 'identity', scorable: true,
      en: 'Do you maintain a strong curiosity about the world?',
      cn: '你是否保持对世界的强烈好奇心？',
      tw: '你是否保持對世界的強烈好奇心？',
      options: [
        { en: 'Absolutely — I constantly self-learn new hard skills without being forced.', cn: '绝对，我持续自驱学习新的硬核技能。', tw: '絕對，我持續自驅學習新的硬核技能。', score: 4 },
        { en: 'Somewhat — I buy books/courses but often abandon them halfway.', cn: '有一些，我买书/课程，但经常半途而废。', tw: '有一些，我買書/課程，但經常半途而廢。', score: 2 },
        { en: 'Barely — I have zero energy to explore new things after work.', cn: '几乎没有，下班后完全没有精力探索新事物。', tw: '幾乎沒有，下班後完全沒有精力探索新事物。', score: 1 },
        { en: 'Completely lost interest in learning anything new.', cn: '完全失去了学习任何新事物的兴趣。', tw: '完全失去了學習任何新事物的興趣。', score: 0 },
      ],
    },

    { /* QKD7 — Persistence */
      id: 'QKD7', section: 'identity', scorable: true,
      en: 'Do you possess the self-discipline and persistence to commit to a single task or project for a duration exceeding six months?',
      cn: '你能坚持做一件事超过六个月吗？',
      tw: '你能堅持做一件事超過六個月嗎？',
      options: [
        { en: 'Easily — I have iron discipline; my goals become non-negotiable habits.', cn: '轻松，我有钢铁般的自律，目标成为不可妥协的习惯。', tw: '輕鬆，我有鋼鐵般的自律，目標成為不可妥協的習慣。', score: 4 },
        { en: 'Usually — if I see positive feedback or results.', cn: '通常可以，如果能看到正向反馈或结果。', tw: '通常可以，如果能看到正向反饋或結果。', score: 3 },
        { en: 'Rarely — I rely on motivation which fades quickly.', cn: '很少，我依靠动力，但动力消退得很快。', tw: '很少，我依靠動力，但動力消退得很快。', score: 1 },
        { en: 'Never — I abandon every new plan within a few weeks.', cn: '从不，每个新计划都在几周内放弃。', tw: '從不，每個新計劃都在幾週內放棄。', score: 0 },
      ],
    },

    { /* QKD8 — Emotional management */
      id: 'QKD8', section: 'identity', scorable: true,
      en: 'How is your emotional management ability?',
      cn: '你的情绪管理能力如何？',
      tw: '你的情緒管理能力如何？',
      options: [
        { en: 'Extremely stable — I remain calm and objective in crises.', cn: '极度稳定，危机中保持冷静和客观。', tw: '極度穩定，危機中保持冷靜和客觀。', score: 4 },
        { en: 'Generally good — I process negative emotions quickly.', cn: '总体良好，能快速处理负面情绪。', tw: '總體良好，能快速處理負面情緒。', score: 3 },
        { en: 'Volatile — easily triggered but I apologise afterwards.', cn: '易激动，容易被触发，但事后会道歉。', tw: '易激動，容易被觸發，但事後會道歉。', score: 1 },
        { en: "Destructive — my anger/sadness regularly damages my life and relationships.", cn: '破坏性，我的愤怒/悲伤经常损害生活和关系。', tw: '破壞性，我的憤怒/悲傷經常損害生活和關係。', score: 0 },
      ],
    },

    { /* QKD9 — Life agency — hidden for under 18 */
      id: 'QKD9', section: 'identity', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 !== 0; },
      en: 'Do you feel your current life is the result of your own choices?',
      cn: '你是否觉得目前的生活是自己选择的结果？',
      tw: '你是否覺得目前的生活是自己選擇的結果？',
      options: [
        { en: '100% yes — I take full ownership of my path.', cn: '100%是，我完全掌控自己的人生路径。', tw: '100%是，我完全掌控自己的人生路徑。', score: 4 },
        { en: 'Mostly yes — though circumstances played a part.', cn: '大部分是，尽管环境也起了一定作用。', tw: '大部分是，儘管環境也起了一定作用。', score: 3 },
        { en: 'Mostly no — I feel pushed along by society and family.', cn: '大部分不是，感觉被社会和家庭推着走。', tw: '大部分不是，感覺被社會和家庭推著走。', score: 1 },
        { en: 'Completely no — I am a victim of my environment/fate.', cn: '完全不是，我是环境/命运的受害者。', tw: '完全不是，我是環境/命運的受害者。', score: 0 },
      ],
    },

    { /* QKD10 — Rules attitude */
      id: 'QKD10', section: 'identity', scorable: true, noImprove: true,
      en: 'What is your underlying attitude towards rules and systems?',
      cn: '你对规则和制度的底层态度是什么？',
      tw: '你對規則和制度的底層態度是什麼？',
      options: [
        { en: 'Rule-maker mindset — I understand the logic and leverage rules to my advantage.', cn: '规则制定者思维，理解逻辑并利用规则为己所用。', tw: '規則制定者思維，理解邏輯並利用規則為己所用。', score: 4 },
        { en: 'Follower mindset — I strictly obey, believing conformity is the safest path.', cn: '遵从者思维，严格遵守，认为合规是最安全的路。', tw: '遵從者思維，嚴格遵守，認為合規是最安全的路。', score: 2 },
        { en: 'Opportunist mindset — I comply on the surface but exploit loopholes privately.', cn: '机会主义者思维，表面顺从但私下钻漏洞。', tw: '機會主義者思維，表面順從但私下鑽漏洞。', score: 2 },
        { en: 'Rebel mindset — I view all rules as oppressive and instinctively resist.', cn: '叛逆者思维，认为所有规则都是压迫，本能地抵制。', tw: '叛逆者思維，認為所有規則都是壓迫，本能地抵制。', score: 1 },
      ],
    },

    { /* QKD11 — Life success reflection — hidden for under 18 */
      id: 'QKD11', section: 'identity', scorable: true, noImprove: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 !== 0; },
      en: 'Looking back at your life so far, do you consider yourself a successful person?',
      cn: '回顾你迄今为止的人生，你认为自己是一个成功的人吗？',
      tw: '回顧你迄今為止的人生，你認為自己是一個成功的人嗎？',
      options: [
        { en: 'Yes, absolutely — I have achieved my core desires and am proud of myself.', cn: '是的，完全如此，我实现了核心愿望，为自己骄傲。', tw: '是的，完全如此，我實現了核心願望，為自己驕傲。', score: 4 },
        { en: 'Somewhat — I am doing okay, but still far from my ideal state.', cn: '有一些，我做得还可以，但距理想状态还很远。', tw: '有一些，我做得還可以，但距理想狀態還很遠。', score: 3 },
        { en: 'No — I feel average or unaccomplished.', cn: '没有，感觉自己平庸或一事无成。', tw: '沒有，感覺自己平庸或一事無成。', score: 1 },
        { en: 'Definitely not — I consider my life a failure so far.', cn: '绝对不，我认为自己的人生迄今是失败的。', tw: '絕對不，我認為自己的人生迄今是失敗的。', score: 0 },
      ],
    },

    /* ═══════════════════════════════════════════
       SECTION C-AGE — 56–75 / 76–100 targeted modules
       ═══════════════════════════════════════════ */
    { /* QKS56_1 — 56-75: chronic condition management */
      id: 'QKS56_1', section: 'basic', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 5 && s.QK1 <= 6; },
      en: 'How well do you currently manage chronic health indicators (blood pressure, blood sugar, lipids, etc.)?',
      cn: '你目前对慢性健康指标（血压、血糖、血脂等）的管理情况如何？',
      tw: '你目前對慢性健康指標（血壓、血糖、血脂等）的管理情況如何？',
      options: [
        { en: 'Very well managed — regular monitoring and stable indicators.', cn: '管理非常到位，规律监测且指标稳定。', tw: '管理非常到位，規律監測且指標穩定。', score: 4 },
        { en: 'Generally managed — occasional fluctuation, mostly under control.', cn: '总体可控，偶有波动。', tw: '總體可控，偶有波動。', score: 3 },
        { en: 'Weak management — irregular checkups and frequent fluctuations.', cn: '管理较弱，检查不规律且波动频繁。', tw: '管理較弱，檢查不規律且波動頻繁。', score: 1 },
        { en: 'Poorly managed — no stable routine, risks already affecting life.', cn: '管理较差，无稳定方案，已明显影响生活。', tw: '管理較差，無穩定方案，已明顯影響生活。', score: 0 },
      ],
    },
    { /* QKS56_2 — 56-75: retirement/career transition security */
      id: 'QKS56_2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 5 && s.QK1 <= 6; },
      en: 'How secure is your current retirement transition plan (income, insurance, and family role)?',
      cn: '你当前的退休过渡安排（收入、保障与家庭角色）稳健程度如何？',
      tw: '你當前的退休過渡安排（收入、保障與家庭角色）穩健程度如何？',
      options: [
        { en: 'Highly secure — clear long-term arrangement and low uncertainty.', cn: '高度稳健，长期安排清晰，不确定性低。', tw: '高度穩健，長期安排清晰，不確定性低。', score: 4 },
        { en: 'Mostly secure — key areas covered, with manageable gaps.', cn: '基本稳健，核心安排已覆盖，仍有少量缺口。', tw: '基本穩健，核心安排已覆蓋，仍有少量缺口。', score: 3 },
        { en: 'Partially secure — several key items still unresolved.', cn: '部分稳健，仍有多项关键事项未落实。', tw: '部分穩健，仍有多項關鍵事項未落實。', score: 1 },
        { en: 'Insecure — major uncertainty around income/support/role.', cn: '不稳健，在收入/保障/角色方面存在明显不确定性。', tw: '不穩健，在收入/保障/角色方面存在明顯不確定性。', score: 0 },
      ],
    },
    { /* QKS56_3 — 56-75: social vitality */
      id: 'QKS56_3', section: 'identity', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 5 && s.QK1 <= 6; },
      en: 'How active is your social and life rhythm at this stage?',
      cn: '你在这一年龄阶段的社交与生活节律活跃度如何？',
      tw: '你在這一年齡階段的社交與生活節律活躍度如何？',
      options: [
        { en: 'Very active — stable social ties and regular meaningful activities.', cn: '非常活跃，关系稳定且有规律的高质量活动。', tw: '非常活躍，關係穩定且有規律的高品質活動。', score: 4 },
        { en: 'Moderately active — occasional social/contact and personal projects.', cn: '中等活跃，仍保持一定社交与个人安排。', tw: '中等活躍，仍保持一定社交與個人安排。', score: 3 },
        { en: 'Low activity — social range shrinking and daily rhythm weakening.', cn: '活跃度偏低，社交圈收缩，生活节奏变弱。', tw: '活躍度偏低，社交圈收縮，生活節奏變弱。', score: 1 },
        { en: 'Very low activity — frequent isolation and lack of daily structure.', cn: '活跃度很低，经常孤立且日常缺乏结构。', tw: '活躍度很低，經常孤立且日常缺乏結構。', score: 0 },
      ],
    },
    { /* QKS76_1 — 76-100: functional independence */
      id: 'QKS76_1', section: 'basic', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 7 && s.QK1 <= 8; },
      en: 'What is your current level of functional independence in daily life?',
      cn: '你当前在日常生活中的自理与行动独立程度如何？',
      tw: '你當前在日常生活中的自理與行動獨立程度如何？',
      options: [
        { en: 'Highly independent — can handle most daily activities safely.', cn: '独立性很高，可安全完成大多数日常活动。', tw: '獨立性很高，可安全完成大多數日常活動。', score: 4 },
        { en: 'Mostly independent — needs occasional assistance in specific tasks.', cn: '基本独立，个别事项需协助。', tw: '基本獨立，個別事項需協助。', score: 3 },
        { en: 'Limited independence — requires regular support in multiple tasks.', cn: '独立性受限，多项日常事务需要固定协助。', tw: '獨立性受限，多項日常事務需要固定協助。', score: 1 },
        { en: 'Low independence — relies heavily on long-term care support.', cn: '独立性较低，长期依赖照护支持。', tw: '獨立性較低，長期依賴照護支持。', score: 0 },
      ],
    },
    { /* QKS76_2 — 76-100: safety and medical continuity */
      id: 'QKS76_2', section: 'social', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 7 && s.QK1 <= 8; },
      en: 'How complete is your current safety and medical continuity arrangement (fall prevention, emergency contact, regular follow-up)?',
      cn: '你当前在居家安全与医疗连续性（防跌倒、紧急联系人、规律复诊）方面是否完善？',
      tw: '你當前在居家安全與醫療連續性（防跌倒、緊急聯絡人、規律複診）方面是否完善？',
      options: [
        { en: 'Comprehensive and stable — clear routines and contingency plans in place.', cn: '体系完善且稳定，有明确流程和应急预案。', tw: '體系完善且穩定，有明確流程和應急預案。', score: 4 },
        { en: 'Mostly complete — key items covered, minor gaps remain.', cn: '大体完善，关键事项已覆盖，仍有少量缺口。', tw: '大體完善，關鍵事項已覆蓋，仍有少量缺口。', score: 3 },
        { en: 'Partially complete — important links are still weak.', cn: '部分完善，关键环节仍较薄弱。', tw: '部分完善，關鍵環節仍較薄弱。', score: 1 },
        { en: 'Incomplete — significant safety/medical continuity risks exist.', cn: '尚不完善，存在明显安全或就医连续性风险。', tw: '尚不完善，存在明顯安全或就醫連續性風險。', score: 0 },
      ],
    },
    { /* QKS76_3 — 76-100: emotional security */
      id: 'QKS76_3', section: 'identity', scorable: true,
      showIf: function(s){ return s.QK1 !== undefined && s.QK1 >= 7 && s.QK1 <= 8; },
      en: 'How emotionally secure and at peace do you feel in your current life stage?',
      cn: '你在当前人生阶段的情绪安稳感与内在平和度如何？',
      tw: '你在當前人生階段的情緒安穩感與內在平和度如何？',
      options: [
        { en: 'Very stable — emotionally calm with clear sense of meaning and belonging.', cn: '非常稳定，内心平和，意义感与归属感明确。', tw: '非常穩定，內心平和，意義感與歸屬感明確。', score: 4 },
        { en: 'Generally stable — occasional worry but manageable overall.', cn: '总体稳定，偶有担忧但可调节。', tw: '總體穩定，偶有擔憂但可調節。', score: 3 },
        { en: 'Often uneasy — frequent loneliness, worry, or emotional lows.', cn: '安稳感偏弱，孤独/焦虑/低落出现频率较高。', tw: '安穩感偏弱，孤獨/焦慮/低落出現頻率較高。', score: 1 },
        { en: 'Very fragile — persistent emotional distress affecting quality of life.', cn: '安稳感较弱，持续情绪困扰已影响生活质量。', tw: '安穩感較弱，持續情緒困擾已影響生活品質。', score: 0 },
      ],
    },


    /* ═══════════════════════════════════════════
       SECTION BONUS — SSR LEVEL
       ═══════════════════════════════════════════ */

    /* ── General Bonus (all users) ── */

    { id: 'QKBON_G1', section: 'bonus', scorable: true, bonus: true,
      en: 'Have you ever become a widely discussed public figure?',
      cn: '你是否曾成为一个被广泛讨论的公众人物？',
      tw: '你是否曾成為一個被廣泛討論的公眾人物？',
      options: [
        { en: 'Yes — known nationally or globally for my achievements or actions.', cn: '是，因成就/行动被全国或全球认可。', tw: '是，因成就/行動被全國或全球認可。', score: 10 },
        { en: 'Yes — highly famous within a specific industry or local community.', cn: '是，在某行业或地区内具有较高知名度。', tw: '是，在某行業或地區內具有較高知名度。', score: 4 },
        { en: 'No — I am a private citizen.', cn: '没有，我是普通市民。', tw: '沒有，我是普通市民。', score: 0 },
      ],
    },

    { id: 'QKBON_G2', section: 'bonus', scorable: true, bonus: true,
      en: 'Have you maintained an elite physique (Men <15% / Women <22% body fat) with outstanding muscle mass and cardio fitness for over 3 consecutive years, without relying on banned substances?',
      cn: '你是否连续3年以上保持精英体脂率（男性<15%/女性<22%）、出色的肌肉量和心肺适能，且未依赖违禁物质？',
      tw: '你是否連續3年以上保持精英體脂率（男性<15%/女性<22%）、出色的肌肉量和心肺適能，且未依賴違禁物質？',
      options: [
        { en: 'Yes — my physique and metrics are elite.', cn: '是，我的体型和各项指标达到精英水平。', tw: '是，我的體型和各項指標達到精英水平。', score: 10 },
        { en: 'I am very fit, but have not maintained those exact extreme metrics for 3 years.', cn: '我非常健壮，但未严格维持那些极端指标满3年。', tw: '我非常健壯，但未嚴格維持那些極端指標滿3年。', score: 3 },
        { en: 'No.', cn: '没有。', tw: '沒有。', score: 0 },
      ],
    },

    { id: 'QKBON_G3', section: 'bonus', scorable: true, bonus: true,
      en: 'Have you ever survived a deadly disaster through extreme good luck?',
      cn: '你是否曾凭极大的幸运在致命灾难中幸存？',
      tw: '你是否曾憑極大的幸運在致命災難中倖存？',
      options: [
        { en: 'Yes — survived a near-zero survival rate event (major accident, severe disease crisis, etc.) unharmed.', cn: '是，在近乎零生还率的事件中（重大事故、重病危机等）毫发无损。', tw: '是，在近乎零生還率的事件中（重大事故、重病危機等）毫髮無損。', score: 10 },
        { en: 'Escaped a highly dangerous situation safely.', cn: '安全脱离了高度危险的处境。', tw: '安全脫離了高度危險的處境。', score: 4 },
        { en: 'No such extreme experiences.', cn: '没有此类极端经历。', tw: '沒有此類極端經歷。', score: 0 },
      ],
    },

    { id: 'QKBON_G4', section: 'bonus', scorable: true, bonus: true,
      en: 'How is the "hardcore rescue capability" of your social circle?',
      cn: '你社交圈的"硬核救援能力"如何？',
      tw: '你社交圈的「硬核救援能力」如何？',
      options: [
        { en: 'If I needed a large emergency sum tomorrow (e.g. around RMB 300,000), I could borrow it quickly from trusted contacts.', cn: '如果明天需要一大笔应急资金（如约30万元人民币），我能很快从可信的人际关系中借到。', tw: '如果明天需要一大筆應急資金（如約30萬元人民幣），我能很快從可信的人際關係中借到。', score: 10 },
        { en: 'I could scrape together a decent emergency fund from relatives.', cn: '我能从亲戚处凑到一笔体面的应急资金。', tw: '我能從親戚處湊到一筆體面的應急資金。', score: 4 },
        { en: 'Nobody would lend me a dime if I fell.', cn: '如果我落难，没人愿意借给我一分钱。', tw: '如果我落難，沒人願意借給我一分錢。', score: 0 },
      ],
    },

    { id: 'QKBON_G5', section: 'bonus', scorable: true, bonus: true,
      en: 'Do you possess high-value information acquisition habits?',
      cn: '你是否具备高价值的信息获取习惯？',
      tw: '你是否具備高價值的資訊獲取習慣？',
      options: [
        { en: 'Yes — reading hard-core reports/books daily to capture information asymmetry.', cn: '是，每天阅读硬核报告/书籍，捕捉信息不对称优势。', tw: '是，每天閱讀硬核報告/書籍，捕捉資訊不對稱優勢。', score: 6 },
        { en: 'I listen to educational podcasts/videos regularly.', cn: '我定期收听教育性播客/视频。', tw: '我定期收聽教育性播客/視頻。', score: 2 },
        { en: 'No — entirely fed by algorithm-driven entertainment and gossip.', cn: '没有，完全被算法驱动的娱乐和八卦投喂。', tw: '沒有，完全被演算法驅動的娛樂和八卦投喂。', score: 0 },
      ],
    },

    { id: 'QKBON_G6', section: 'bonus', scorable: true, bonus: true,
      en: 'Have you ever suffered a catastrophe that would destroy an ordinary person, but ultimately cleared it entirely on your own and reached a height greater than before?',
      cn: '你是否曾遭受足以摧毁普通人的灾难，但最终完全靠自己度过，并达到比之前更高的高度？',
      tw: '你是否曾遭受足以摧毀普通人的災難，但最終完全靠自己度過，並達到比之前更高的高度？',
      options: [
        { en: 'Yes — a legendary comeback from the abyss (massive debt, severe illness, total ban — cleared and surpassed former peak).', cn: '是，从深渊的传奇逆袭（巨额债务、重病、全面封禁——清清楚楚且超越了从前的巅峰）。', tw: '是，從深淵的傳奇逆襲（巨額負債、重病、全面封禁——清清楚楚且超越了從前的巔峰）。', score: 10 },
        { en: 'I survived a major crisis, but am still recovering to my former level.', cn: '我熬过了一场重大危机，但仍在恢复到从前水平的路上。', tw: '我熬過了一場重大危機，但仍在恢復到從前水平的路上。', score: 3 },
        { en: "I haven't faced a crisis of that magnitude.", cn: '我尚未面对过这种程度的危机。', tw: '我尚未面對過這種程度的危機。', score: 0 },
      ],
    },

    { id: 'QKBON_G7', section: 'bonus', scorable: true, bonus: true,
      en: 'Have you invested a massive amount of deliberate practice into a highly specific professional skill and achieved an objective national/industry-top qualification or ranking?',
      cn: '你是否对某项高度细分的专业技能投入了大量刻意练习，并取得了客观认可的国家级/行业顶级资质或排名？',
      tw: '你是否對某項高度細分的專業技能投入了大量刻意練習，並取得了客觀認可的國家級/行業頂級資質或排名？',
      options: [
        { en: 'Yes — I am an undisputed master/top-tier expert in a niche.', cn: '是，我在某细分领域是无可争议的大师/顶级专家。', tw: '是，我在某細分領域是無可爭議的大師/頂級專家。', score: 10 },
        { en: 'I am highly skilled, but not at the absolute national/industry peak.', cn: '我技艺精湛，但尚未达到绝对的国家/行业顶峰。', tw: '我技藝精湛，但尚未達到絕對的國家/行業頂峰。', score: 3 },
        { en: 'No.', cn: '没有。', tw: '沒有。', score: 0 },
      ],
    },

    { id: 'QKBON_G8', section: 'bonus', scorable: true, bonus: true,
      en: 'Have you completed extreme physical challenges? (e.g. full marathon, triathlon, climbing peaks over 6,000 metres)',
      cn: '你是否完成过极限体能挑战？（如全程马拉松、铁人三项、攀登6000米以上山峰）',
      tw: '你是否完成過極限體能挑戰？（如全程馬拉松、鐵人三項、攀登6000米以上山峰）',
      options: [
        { en: 'Yes — multiple times or officially certified.', cn: '是，多次完成或获得官方认证。', tw: '是，多次完成或獲得官方認證。', score: 10 },
        { en: 'Training for one, or completed half-marathons/lesser peaks.', cn: '正在训练中，或已完成半程马拉松/较低山峰。', tw: '正在訓練中，或已完成半程馬拉松/較低山峰。', score: 4 },
        { en: 'No.', cn: '没有。', tw: '沒有。', score: 0 },
      ],
    },

    /* ── Student Bonus ── */

    { id: 'QKBON_S1', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 0; },
      en: 'Facing heavy academic pressure, were you still able to maintain extremely strict discipline — keeping up systematic fitness training at least 3–4 times a week and strictly managing daily nutrition — for over two consecutive years?',
      cn: '面对繁重的学业压力，你是否仍能保持极度严格的自律——每周至少3-4次系统性健身训练、严格管理每日营养——并持续两年以上？',
      tw: '面對繁重的學業壓力，你是否仍能保持極度嚴格的自律——每週至少3-4次系統性健身訓練、嚴格管理每日營養——並持續兩年以上？',
      options: [
        { en: 'Yes — iron discipline; my physique and energy crushed my peers.', cn: '是，钢铁纪律，体型和精力完全碾压同龄人。', tw: '是，鋼鐵紀律，體型和精力完全輾壓同齡人。', score: 8 },
        { en: 'I tried, but broke my routine during exam weeks.', cn: '我尝试了，但在考试周会打破规律。', tw: '我嘗試了，但在考試週會打破規律。', score: 2 },
        { en: 'No — entirely sacrificed health for studying.', cn: '没有，完全牺牲健康来学习。', tw: '沒有，完全犧牲健康來學習。', score: 0 },
      ],
    },

    { id: 'QKBON_S2', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 0; },
      en: 'During your university years (or earlier), without affecting your core grades, did you achieve 100% self-sufficiency for tuition and living expenses through legal business acumen or hardcore skills, and even save a considerable amount?',
      cn: '在大学期间（或更早），在不影响核心成绩的前提下，你是否通过合法的商业头脑或硬核技能实现100%的学费和生活费自给，甚至存下一笔可观的资金？',
      tw: '在大學期間（或更早），在不影響核心成績的前提下，你是否通過合法的商業頭腦或硬核技能實現100%的學費和生活費自給，甚至存下一筆可觀的資金？',
      options: [
        { en: 'Yes — completely financially independent as a student.', cn: '是，作为学生完全财务独立。', tw: '是，作為學生完全財務獨立。', score: 8 },
        { en: 'Made good pocket money, but still needed some family help for tuition.', cn: '赚到了不少零花钱，但学费仍需家里帮忙。', tw: '賺到了不少零花錢，但學費仍需家裡幫忙。', score: 3 },
        { en: 'No — fully supported by family.', cn: '没有，完全依靠家庭资助。', tw: '沒有，完全依靠家庭資助。', score: 0 },
      ],
    },

    { id: 'QKBON_S3', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 0; },
      en: 'Have you defeated competitors from top-tier universities to win an absolute hardcore top-three award in a national or international core academic/skill competition; or published a top-tier academic paper as a core author during your undergraduate years?',
      cn: '你是否在全国或国际核心学术/技能竞赛中击败顶尖高校对手，获得绝对硬核的前三名；或在本科期间以核心作者身份发表顶级学术论文？',
      tw: '你是否在全國或國際核心學術/技能競賽中擊敗頂尖高校對手，獲得絕對硬核的前三名；或在本科期間以核心作者身份發表頂級學術論文？',
      options: [
        { en: 'Yes — I have an undeniable elite academic/skill credential.', cn: '是，我拥有无可辩驳的精英学术/技能资质。', tw: '是，我擁有無可辯駁的精英學術/技能資質。', score: 10 },
        { en: 'Won provincial or standard university awards.', cn: '获得过省级或普通校级奖项。', tw: '獲得過省級或普通校級獎項。', score: 3 },
        { en: 'No such achievements.', cn: '没有此类成就。', tw: '沒有此類成就。', score: 0 },
      ],
    },

    /* ── Employed Bonus ── */

    { id: 'QKBON_AB1', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 1; },
      en: 'Are you able to use two or more non-native languages to conduct high-pressure professional Q&A and negotiations seamlessly in extremely formal overseas business meetings or executive interviews?',
      cn: '你是否能在极正式的海外商务会议或高管面试中，无缝使用两种或两种以上非母语语言进行高压专业问答和谈判？',
      tw: '你是否能在極正式的海外商務會議或高管面試中，無縫使用兩種或兩種以上非母語語言進行高壓專業問答和談判？',
      options: [
        { en: 'Yes — flawless multilingual business domination.', cn: '是，完美无缺的多语言商务主导力。', tw: '是，完美無缺的多語言商務主導力。', score: 10 },
        { en: 'I can do it in one non-native language, but not two.', cn: '我能用一门非母语完成，但不能做到两门。', tw: '我能用一門非母語完成，但不能做到兩門。', score: 3 },
        { en: 'No.', cn: '没有。', tw: '沒有。', score: 0 },
      ],
    },

    { id: 'QKBON_AB2', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 1; },
      en: 'Regardless of your absolute income, have you ever continuously, for over 5 years, strictly allocated over 50% of your net after-tax income to forced savings or solid investments, never interrupting it due to consumption impulses?',
      cn: '无论绝对收入多少，你是否曾连续5年以上，严格将税后净收入的50%以上强制储蓄或稳健投资，从未因消费冲动中断？',
      tw: '無論絕對收入多少，你是否曾連續5年以上，嚴格將稅後淨收入的50%以上強制儲蓄或穩健投資，從未因消費衝動中斷？',
      options: [
        { en: 'Yes — absolute financial discipline for 5+ years.', cn: '是，5年以上的绝对财务纪律。', tw: '是，5年以上的絕對財務紀律。', score: 8 },
        { en: 'I save a lot, but not 50% strictly for 5 continuous years.', cn: '我储蓄不少，但未严格做到连续5年50%。', tw: '我儲蓄不少，但未嚴格做到連續5年50%。', score: 2 },
        { en: 'No.', cn: '没有。', tw: '沒有。', score: 0 },
      ],
    },

    /* ── Entrepreneur Bonus ── */

    { id: 'QKBON_AC1', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 2; },
      en: 'Have you ever continuously, for over 5 years, strictly allocated over 50% of your net after-tax income to forced savings or solid investments, never interrupting it?',
      cn: '你是否曾连续5年以上，严格将税后净收入的50%以上强制储蓄或稳健投资，从未中断？',
      tw: '你是否曾連續5年以上，嚴格將稅後淨收入的50%以上強制儲蓄或穩健投資，從未中斷？',
      options: [
        { en: 'Yes — absolute financial discipline for 5+ years.', cn: '是，5年以上的绝对财务纪律。', tw: '是，5年以上的絕對財務紀律。', score: 8 },
        { en: 'I save a lot, but not 50% strictly for 5 continuous years.', cn: '我储蓄不少，但未严格做到连续5年50%。', tw: '我儲蓄不少，但未嚴格做到連續5年50%。', score: 2 },
        { en: 'No.', cn: '没有。', tw: '沒有。', score: 0 },
      ],
    },

    { id: 'QKBON_AC2', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 2; },
      en: 'Does your product or service build such a strong "moat" in a niche area that competitors with much deeper pockets are forced to copy your model, yet still cannot steal your core customers?',
      cn: '你的产品或服务是否在某细分领域建立了如此强大的"护城河"，以至于资金更雄厚的竞争对手被迫复制你的模式，但仍无法抢走你的核心客户？',
      tw: '你的產品或服務是否在某細分領域建立了如此強大的「護城河」，以至於資金更雄厚的競爭對手被迫複製你的模式，但仍無法搶走你的核心客戶？',
      options: [
        { en: 'Yes — absolute market dominance and pricing power in my niche.', cn: '是，在我的细分市场拥有绝对主导地位和定价权。', tw: '是，在我的細分市場擁有絕對主導地位和定價權。', score: 10 },
        { en: 'Strong brand, but still fighting tough price wars.', cn: '品牌强，但仍在激烈的价格战中搏杀。', tw: '品牌強，但仍在激烈的價格戰中搏殺。', score: 4 },
        { en: 'No moat — easily replaceable.', cn: '没有护城河，很容易被替代。', tw: '沒有護城河，很容易被替代。', score: 0 },
      ],
    },

    { id: 'QKBON_AC3', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 2; },
      en: 'Have you ever successfully sold the business (or shares) you founded at a high price (M&A/Acquisition), or extracted enough massive cash through business dividends that you never need to work for money again?',
      cn: '你是否曾以高价成功出售所创业务（或股份），或通过业务分红提取了足够多的巨额现金，使你再也不需要为钱工作？',
      tw: '你是否曾以高價成功出售所創業務（或股份），或通過業務分紅提取了足夠多的巨額現金，使你再也不需要為錢工作？',
      options: [
        { en: 'Yes — successfully cashed out to achieve complete financial freedom.', cn: '是，成功套现，实现完全财务自由。', tw: '是，成功套現，實現完全財務自由。', score: 10 },
        { en: 'Cashed out some — bought a house/car, but still need to work eventually.', cn: '套现了一部分，买了房/车，但最终还是需要工作。', tw: '套現了一部分，買了房/車，但最終還是需要工作。', score: 4 },
        { en: 'No — all wealth is still "paper wealth" tied up in the company.', cn: '没有，所有财富仍是被锁在公司里的"纸面财富"。', tw: '沒有，所有財富仍是被鎖在公司裡的「紙面財富」。', score: 0 },
      ],
    },

    { id: 'QKBON_AC4', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 2; },
      en: 'Did your project ever encounter a "fatal disaster" that would bankrupt 95% of companies, and you not only avoided bankruptcy but successfully pivoted within a year to earn even more than before?',
      cn: '你的项目是否曾遭遇足以让95%的公司破产的"致命灾难"，而你不仅避免了破产，还在一年内成功转型并赚得比以前更多？',
      tw: '你的項目是否曾遭遇足以讓95%的公司破產的「致命災難」，而你不僅避免了破產，還在一年內成功轉型並賺得比以前更多？',
      options: [
        { en: 'Yes — a miraculous pivot from the brink of death.', cn: '是，从鬼门关的奇迹般的转身。', tw: '是，從鬼門關的奇蹟般的轉身。', score: 10 },
        { en: 'Survived a tough spot, but did not pivot to earn more within a year.', cn: '熬过了艰难时期，但未能在一年内转型并赚得更多。', tw: '熬過了艱難時期，但未能在一年內轉型並賺得更多。', score: 3 },
        { en: 'No.', cn: '没有遭遇过。', tw: '沒有遭遇過。', score: 0 },
      ],
    },

    { id: 'QKBON_AC5', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 2; },
      en: 'Is your business system perfected to the point where you can completely cut off work contact to vacation for 3 months, and the company not only survives but revenue continues to grow automatically?',
      cn: '你的业务系统是否完善到可以完全断开工作联系休假3个月，而公司不仅存活，收入还能自动持续增长？',
      tw: '你的業務系統是否完善到可以完全斷開工作聯繫休假3個月，而公司不僅存活，收入還能自動持續增長？',
      options: [
        { en: 'Yes — I have built a true automated asset, enjoying ultimate time freedom.', cn: '是，我打造了真正的自动化资产，享受终极时间自由。', tw: '是，我打造了真正的自動化資產，享受終極時間自由。', score: 10 },
        { en: 'I can leave for a week or two, but 3 months would cause chaos.', cn: '我可以离开一两周，但3个月肯定会一团糟。', tw: '我可以離開一兩週，但3個月肯定會一團糟。', score: 4 },
        { en: 'No — I am the ultimate bottleneck; if I stop, the business stops.', cn: '没有，我是终极瓶颈，我停则业务停。', tw: '沒有，我是終極瓶頸，我停則業務停。', score: 0 },
      ],
    },

    /* ── Retired Bonus ── */

    { id: 'QKBON_AE1', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 4; },
      en: 'After retiring, do you maintain extremely high competitive fitness — even capable of completing full marathons, triathlons, or surpassing untrained young people in systematic strength training?',
      cn: '退休后，你是否保持着极高的竞技体能——甚至能完成全程马拉松、铁人三项，或在系统力量训练中超越未经训练的年轻人？',
      tw: '退休後，你是否保持著極高的競技體能——甚至能完成全程馬拉松、鐵人三項，或在系統力量訓練中超越未經訓練的年輕人？',
      options: [
        { en: 'Yes — no chronic diseases, frequently participate in athletic competitions, and my physique amazes young people.', cn: '是，无慢性病，频繁参加运动竞技，体型让年轻人惊叹。', tw: '是，無慢性病，頻繁參加運動競技，體型讓年輕人驚嘆。', score: 8 },
        { en: 'Very tough body — can handle intense long-distance travel or regular moderate exercise without issue.', cn: '体魄非常强健，能轻松应对高强度长途旅行或定期中等运动。', tw: '體魄非常強健，能輕鬆應對高強度長途旅行或定期中等運動。', score: 4 },
        { en: 'Basically healthy — but limited to gentle activities like walking or Tai Chi.', cn: '基本健康，但仅限于散步、太极等轻柔活动。', tw: '基本健康，但僅限於散步、太極等輕柔活動。', score: 0 },
      ],
    },

    { id: 'QKBON_AE2', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 4; },
      en: 'Is your financial situation not only worry-free for yourself but also equipped with powerful "downward compatibility" — fully covering top-tier education for grandchildren, providing stress-free core assets for children, or even setting up family trusts or foundations?',
      cn: '你的财务状况是否不仅对自己无忧，还具备强大的"向下兼容"能力——完全覆盖孙辈顶级教育费用、为子女提供无压力的核心资产（如全款房产），甚至建立家族信托或慈善基金？',
      tw: '你的財務狀況是否不僅對自己無憂，還具備強大的「向下兼容」能力——完全覆蓋孫輩頂級教育費用、為子女提供無壓力的核心資產（如全款房產），甚至建立家族信託或慈善基金？',
      options: [
        { en: 'Yes — I am the undisputed financial bedrock of the dynasty.', cn: '是，我是家族无可争议的财务基石。', tw: '是，我是家族無可爭議的財務基石。', score: 10 },
        { en: 'I can give generous gifts/subsidies, but cannot buy houses outright for them.', cn: '我能给予慷慨的礼物/补贴，但无法为他们全款购房。', tw: '我能給予慷慨的禮物/補貼，但無法為他們全款購房。', score: 4 },
        { en: 'No — I just have enough to sustain my own retirement.', cn: '没有，我只够维持自己的退休生活。', tw: '沒有，我只夠維持自己的退休生活。', score: 0 },
      ],
    },

    { id: 'QKBON_AE3', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 4; },
      en: 'After retiring, are you still re-hired at a high salary as a core consultant by top institutions due to your extremely scarce professional experience, or can your professional opinions still directly influence decisions in important fields?',
      cn: '退休后，你是否因极稀缺的专业经验而被顶级机构高薪聘为核心顾问，或你的专业意见仍能直接影响重要领域的决策？',
      tw: '退休後，你是否因極稀缺的專業經驗而被頂級機構高薪聘為核心顧問，或你的專業意見仍能直接影響重要領域的決策？',
      options: [
        { en: 'Yes — I am treated as an irreplaceable industry oracle.', cn: '是，我被视为不可替代的行业智慧源泉。', tw: '是，我被視為不可替代的行業智慧源泉。', score: 8 },
        { en: 'Occasionally asked back for minor consulting or guest lecturing.', cn: '偶尔被请回做小型咨询或客座讲座。', tw: '偶爾被請回做小型諮詢或客座講座。', score: 3 },
        { en: 'No — completely disconnected from my former professional world.', cn: '没有，与以前的职业世界完全脱节。', tw: '沒有，與以前的職業世界完全脫節。', score: 0 },
      ],
    },

    { id: 'QKBON_AE4', section: 'bonus', scorable: true, bonus: true,
      // Only show for age > 60, i.e. QK1 >= 5 (56-65 and above)
      showIf: function(s){ return s.QK3 === 4 && s.QK1 !== undefined && s.QK1 >= 5; },
      en: 'After turning 60, did you completely abandon the excuse that "old people cannot learn", mastering the latest cutting-edge productivity tools (like proficiently using AI or running social media accounts with hundreds of thousands of followers), and holding deep insights into complex new tech and business models?',
      cn: '60岁后，你是否彻底抛弃了"老人不能学习"的借口，掌握了最前沿的生产力工具（如熟练使用AI创作或独立运营粉丝数十万的社交媒体账号），并对复杂的新技术和商业模式持有深刻独到的见解？',
      tw: '60歲後，你是否徹底拋棄了「老人不能學習」的藉口，掌握了最前沿的生產力工具（如熟練使用AI創作或獨立運營粉絲數十萬的社交媒體帳號），並對複雜的新技術和商業模式持有深刻獨到的見解？',
      options: [
        { en: 'Yes — I am a senior tech geek; my cognitive agility crushes many young people.', cn: '是，我是资深科技极客，认知敏锐度碾压许多年轻人。', tw: '是，我是資深科技極客，認知敏銳度輾壓許多年輕人。', score: 8 },
        { en: 'I am proficient with smartphones and basic modern apps, staying relevant.', cn: '我熟练使用智能手机和基础现代应用，保持与时代同步。', tw: '我熟練使用智慧型手機和基礎現代應用，保持與時代同步。', score: 2 },
        { en: 'No — I strongly resist or fear learning complex new digital tools.', cn: '没有，我强烈抵制或惧怕学习复杂的新数字工具。', tw: '沒有，我強烈抵制或懼怕學習複雜的新數位工具。', score: 0 },
      ],
    },

    { id: 'QKBON_AE5', section: 'bonus', scorable: true, bonus: true,
      showIf: function(s){ return s.QK3 === 4; },
      en: 'Have you completely broken free from psychological dependence on "children\'s companionship," "others\' opinions," or "past achievements," capable of living absolutely fulfilled, with a tranquil and joyful heart, without interfering in the younger generation\'s lives?',
      cn: '你是否已完全摆脱对"子女陪伴"、"他人评价"或"过去成就"的心理依赖，能够绝对自足地生活——每天都充实满足、内心平静喜悦，且完全不干涉年轻一代的生活？',
      tw: '你是否已完全擺脫對「子女陪伴」、「他人評價」或「過去成就」的心理依賴，能夠絕對自足地生活——每天都充實滿足、內心平靜喜悅，且完全不干涉年輕一代的生活？',
      options: [
        { en: 'Yes — ultimate spiritual self-sufficiency and peace.', cn: '是，极致的精神自足与内心平静。', tw: '是，極致的精神自足與內心平靜。', score: 8 },
        { en: 'Mostly peaceful — but occasionally lonely or annoyed by family matters.', cn: '大多平静，但偶尔会感到孤独或被家事烦扰。', tw: '大多平靜，但偶爾會感到孤獨或被家事煩擾。', score: 3 },
        { en: 'No — highly dependent on my children for emotional validation; easily resentful if ignored.', cn: '没有，高度依赖子女的情感认可，被忽视时容易心生怨念。', tw: '沒有，高度依賴子女的情感認可，被忽視時容易心生怨念。', score: 0 },
      ],
    },

  ]; // end QUICK_QUESTION_BANK


  /* ═══════════════════════════════════════════════════════════════
     QUICK_IMPROVE_ADVICE — keyed by question ID → { en, cn, tw }
     ═══════════════════════════════════════════════════════════════ */
  window.QUICK_IMPROVE_ADVICE = {

    /* ── Physical ── */
    QK5m: {
      en: 'Weight management is about building systems, not starving. This week, do one thing only: reduce your main carb portion by a quarter at each meal and take a 20-minute walk after dinner. Reassess in 6 weeks.',
      cn: '体重管理的核心不是节食，而是建立系统。本周只做一件事：把每天的主食量减少1/4，并在饭后散步20分钟。6周后重新评估体重变化。',
      tw: '體重管理的核心不是節食，而是建立系統。本週只做一件事：把每天的主食量減少1/4，並在飯後散步20分鐘。6週後重新評估體重變化。',
    },
    QK5f: {
      en: 'Weight management is about building systems, not starving. This week, do one thing only: reduce your main carb portion by a quarter at each meal and take a 20-minute walk after dinner. Reassess in 6 weeks.',
      cn: '体重管理的核心不是节食，而是建立系统。本周只做一件事：把每天的主食量减少1/4，并在饭后散步20分钟。6周后重新评估体重变化。',
      tw: '體重管理的核心不是節食，而是建立系統。本週只做一件事：把每天的主食量減少1/4，並在飯後散步20分鐘。6週後重新評估體重變化。',
    },
    QKC1: {
      en: 'Appearance anxiety usually stems from comparing yourself to others. Try the "mirror exercise": every morning, name 3 qualities you genuinely admire about yourself (not limited to looks). Also, cut down on social-media "beauty comparison" content. Your self-perception will noticeably improve within 30 days.',
      cn: '外貌焦虑往往源于和他人的比较。试试"镜子练习"：每天早晨对着镜子说出自己身上3个你欣赏的特质（不限于外貌）。同时减少社交媒体上的颜值对比内容，你的自我感知会在30天内明显改善。',
      tw: '外貌焦慮往往源於和他人的比較。試試「鏡子練習」：每天早晨對著鏡子說出自己身上3個你欣賞的特質（不限於外貌）。同時減少社交媒體上的顏值對比內容，你的自我感知會在30天內明顯改善。',
    },

    /* ── Status-specific ── */
    QKA_HS1: {
      en: 'If studying feels painful, try linking one subject to something you already love. Find one YouTube channel, podcast, or book that makes a single topic click. Curiosity is contagious — start with just 15 minutes of self-directed exploration per day.',
      cn: '如果学习感到痛苦，试着把某门课和你已经喜欢的事情联系起来。找一个能让某个话题豁然开朗的YouTube频道、播客或书。好奇心是会传染的——每天只需15分钟自主探索。',
      tw: '如果學習感到痛苦，試著把某門課和你已經喜歡的事情聯繫起來。找一個能讓某個話題豁然開朗的YouTube頻道、播客或書。好奇心是會傳染的——每天只需15分鐘自主探索。',
    },
    QKA_HS2: {
      en: 'If you are experiencing school violence, you do not have to endure it silently. Tell a trusted adult — a teacher, counsellor, or family member — today. Document incidents in writing with dates. Your safety is non-negotiable.',
      cn: '如果你正遭受校园暴力，不必默默忍受。今天就告诉一位你信任的成年人——老师、辅导员或家人。用文字记录事件和日期。你的安全是不可妥协的。',
      tw: '如果你正遭受校園暴力，不必默默忍受。今天就告訴一位你信任的成年人——老師、輔導員或家人。用文字記錄事件和日期。你的安全是不可妥協的。',
    },
    QKA_HS3: {
      en: 'Stress release is not optional — it is maintenance. Schedule 2 fixed exercise or hobby slots this week, like a class you cannot skip. Even 30 minutes of movement resets your stress hormones for up to 6 hours.',
      cn: '减压不是可选项，而是维护保养。本周安排2个固定运动或爱好时段，就像不能缺席的课一样。哪怕30分钟的运动也能让你的压力荷尔蒙重置长达6小时。',
      tw: '減壓不是可選項，而是維護保養。本週安排2個固定運動或愛好時段，就像不能缺席的課一樣。哪怕30分鐘的運動也能讓你的壓力荷爾蒙重置長達6小時。',
    },
    QKA_HS9: {
      en: 'Chronic sleep deprivation cuts your memory consolidation by up to 40%. One change: set a fixed wake-up time every day (yes, weekends too). Your brain will begin to self-regulate sleep onset within 2 weeks.',
      cn: '慢性睡眠剥夺会使你的记忆巩固效率降低多达40%。只做一个改变：每天设定固定的起床时间（包括周末）。两周内你的大脑将开始自我调节入睡时间。',
      tw: '慢性睡眠剝奪會使你的記憶鞏固效率降低多達40%。只做一個改變：每天設定固定的起床時間（包括週末）。兩週內你的大腦將開始自我調節入睡時間。',
    },
    QKA_HS12: {
      en: 'Paralysis about the future is often decision paralysis in disguise. Try the "2-year test": what is one skill or experience that would clearly open more doors in 2 years? Focus on just that. Direction comes from movement, not from waiting for clarity.',
      cn: '对未来的麻痹感通常是决策瘫痪的伪装。试试"2年测试"：有哪一个技能或经历能在2年内明确为你打开更多大门？只专注于那一个。方向来自行动，而不是等待清晰。',
      tw: '對未來的麻痹感通常是決策癱瘓的偽裝。試試「2年測試」：有哪一個技能或經歷能在2年內明確為你打開更多大門？只專注於那一個。方向來自行動，而不是等待清晰。',
    },
    QKA_BC1: {
      en: 'If you are experiencing frequent or clinical depression, please seek a professional. In the meantime, the most evidence-backed single daily habit is 30 minutes of moderate aerobic exercise — it has measurable antidepressant effects equivalent to some medications.',
      cn: '如果你频繁经历或正处于临床抑郁中，请立即寻求专业帮助。与此同时，最有循证依据的日常习惯是：每天30分钟中等强度有氧运动——其抗抑郁效果与部分药物相当。',
      tw: '如果你頻繁經歷或正處於臨床憂鬱中，請立即尋求專業幫助。與此同時，最有循證依據的日常習慣是：每天30分鐘中等強度有氧運動——其抗憂鬱效果與部分藥物相當。',
    },
    QKA_BC2: {
      en: 'Academic performance is mostly about system, not talent. The single highest-leverage change: switch from passive re-reading to active recall (close the book and write down everything you remember from a chapter). This raises retention by 200%–300%.',
      cn: '学业成绩主要取决于系统，而非天赋。单一最高杠杆的改变：从被动重读切换到主动回忆（合上书，写下你记住的章节内容）。这能将记忆保留率提高200%-300%。',
      tw: '學業成績主要取決於系統，而非天賦。單一最高槓桿的改變：從被動重讀切換到主動回憶（合上書，寫下你記住的章節內容）。這能將記憶保留率提高200%-300%。',
    },
    QKA_D1: {
      en: 'Research direction paralysis is common. Schedule a 30-minute meeting with your supervisor this week — not to report progress, but to ask: "What are the two most impactful open problems in our field right now?" Hearing an expert frame the landscape immediately cuts the fog.',
      cn: '研究方向瘫痪很常见。本周安排一次30分钟的导师会面——不是汇报进展，而是问："我们领域目前最有影响力的两个开放性问题是什么？"听专家描绘全景会立即驱散迷雾。',
      tw: '研究方向癱瘓很常見。本週安排一次30分鐘的導師會面——不是匯報進展，而是問：「我們領域目前最有影響力的兩個開放性問題是什麼？」聽專家描繪全景會立即驅散迷霧。',
    },
    QKAB3: {
      en: 'High pressure is burning your most valuable resource: cognitive bandwidth. This week, test one boundary: turn off all work notifications at a fixed time (e.g. 8 PM) and hold that line for 7 days. If this causes a work crisis, that is information telling you the role itself needs renegotiating.',
      cn: '高压正在燃烧你最宝贵的资源：认知带宽。本周测试一个边界：在固定时间（如晚8点）关闭所有工作通知，并坚守7天。如果这引发工作危机，那是在告诉你这个职位本身需要重新谈判。',
      tw: '高壓正在燃燒你最寶貴的資源：認知頻寬。本週測試一個邊界：在固定時間（如晚8點）關閉所有工作通知，並堅守7天。如果這引發工作危機，那是在告訴你這個職位本身需要重新談判。',
    },
    QKAB7: {
      en: 'Your job market resilience is your most important career insurance. This week, take 1 hour to update your résumé and post one visible piece of work (article, project, portfolio item) publicly. Every month, do one "market temperature check" — one coffee chat or application — to stay calibrated.',
      cn: '你的就业市场韧性是你最重要的职业保险。本周花1小时更新简历，并公开发布一件可见的工作成果（文章、项目、作品集）。每月做一次"市场温度测试"——一次咖啡交流或投递——保持校准。',
      tw: '你的就業市場韌性是你最重要的職業保險。本週花1小時更新履歷，並公開發布一件可見的工作成果（文章、項目、作品集）。每月做一次「市場溫度測試」——一次咖啡交流或投遞——保持校準。',
    },
    QKAC1: {
      en: 'Cash flow problems are almost always a distribution problem before they are a revenue problem. This week, map every outgoing expense and mark each as "essential/contractual," "operational/flexible," or "discretionary/cuttable." Cut 20% of the third category immediately.',
      cn: '现金流问题在成为收入问题之前，几乎总是分配问题。本周列出每一项支出，并标注为"必要/合同性"、"运营/灵活性"或"可自由支配/可削减"。立即削减第三类的20%。',
      tw: '現金流問題在成為收入問題之前，幾乎總是分配問題。本週列出每一項支出，並標注為「必要/合約性」、「運營/靈活性」或「可自由支配/可削減」。立即削減第三類的20%。',
    },
    QKAD1: {
      en: 'Less than 6 months of runway is a financial emergency. Stop all non-essential spending immediately. Then do one thing this week: make a list of 5 income-generating actions you can take within 30 days — freelance work, selling assets, consulting. Start with whichever is fastest.',
      cn: '少于6个月的财务跑道是一个财务紧急情况。立即停止所有非必要支出。然后本周做一件事：列出5个30天内可以采取的创收行动——自由职业、出售资产、咨询服务。从最快的那个开始。',
      tw: '少於6個月的財務跑道是一個財務緊急情況。立即停止所有非必要支出。然後本週做一件事：列出5個30天內可以採取的創收行動——自由職業、出售資產、諮詢服務。從最快的那個開始。',
    },
    QKAD2: {
      en: 'An unstructured day is the enemy of motivation and mental health. Tomorrow, write just three "anchor tasks" (non-negotiable, time-specific items) for the day. The structure itself reduces anxiety and creates forward momentum.',
      cn: '毫无结构的一天是动力和心理健康的敌人。明天，只为这一天写下三个"锚定任务"（不可妥协、有时间节点的事项）。结构本身能减轻焦虑并产生前进动力。',
      tw: '毫無結構的一天是動力和心理健康的敵人。明天，只為這一天寫下三個「錨定任務」（不可妥協、有時間節點的事項）。結構本身能減輕焦慮並產生前進動力。',
    },
    QKAE1: {
      en: 'Financial pressure in retirement is solvable through structured review. This week, sit down and map your fixed monthly income vs. fixed monthly costs. Then identify the one largest discretionary cost you could reduce by 30%. Small structural cuts compound significantly over years.',
      cn: '退休后的财务压力可以通过系统梳理来解决。本周坐下来，列出每月固定收入与固定支出的对比表。然后找出一项你可以减少30%的最大可自由支配开支。小幅结构性削减会随着时间显著复利积累。',
      tw: '退休後的財務壓力可以通過系統梳理來解決。本週坐下來，列出每月固定收入與固定支出的對比表。然後找出一項你可以減少30%的最大可自由支配開支。小幅結構性削減會隨著時間顯著複利積累。',
    },
    QKAI1: {
      en: 'Caregiver burnout is real and progressive. This week, identify one person who could cover for you for 3 consecutive hours. Even one protected block per week of genuine rest (not just "child is asleep") is medically significant for your long-term sustainability.',
      cn: '照护者倦怠是真实存在且会逐渐加重的。本周找出一个能连续替你照看3小时的人。每周哪怕一次受保护的真正休息时段（不只是"孩子睡着了"的间隙），在医学上对你的长期可持续性都意义重大。',
      tw: '照護者倦怠是真實存在且會逐漸加重的。本週找出一個能連續替你照看3小時的人。每週哪怕一次受保護的真正休息時段（不只是「孩子睡著了」的間隙），在醫學上對你的長期可持續性都意義重大。',
    },

    /* ── Health & Lifestyle ── */
    QKC3: {
      en: 'Do not try to break all habits at once — that almost always fails. Pick the one habit causing you the most harm, and use the substitution method: replace one instance of it per day with a 10-minute walk. Only one habit, for 30 days. Then tackle the next.',
      cn: '不要试图同时改变所有习惯——这注定失败。选择对你伤害最大的一个，用"替代法"处理它：每天用10分钟散步替代一次该习惯。只改1个，坚持30天，再处理下一个。',
      tw: '不要試圖同時改變所有習慣——這注定失敗。選擇對你傷害最大的一個，用「替代法」處理它：每天用10分鐘散步替代一次該習慣。只改1個，堅持30天，再處理下一個。',
    },
    QKC4: {
      en: 'To protect your vision from further deterioration, follow the 20-20-20 rule strictly: every 20 minutes, look at something 20 feet away for 20 seconds. Get a monitor light bar to reduce glare, and increase your phone font size. Annual professional eye exams are essential.',
      cn: '为防止视力进一步恶化，严格执行"20-20-20法则"：每20分钟看20英尺外的物体20秒。购买屏幕挂灯减少眩光，调大手机字体。每年进行一次专业验光。',
      tw: '為防止視力進一步惡化，嚴格執行「20-20-20法則」：每20分鐘看20英尺外的物體20秒。購買螢幕掛燈減少眩光，調大手機字體。每年進行一次專業驗光。',
    },
    QKC5: {
      en: 'Improving chronic health starts with getting a baseline. Book a comprehensive health check this month to get your blood pressure, blood sugar, and cholesterol numbers. 90% of early chronic issues can be reversed within 6 months by fixing sleep (consistent wake time), diet (less processed food), and movement (7,000 steps/day).',
      cn: '改善慢性健康问题的起点是获取基线数据。本月预约一次全面体检，拿到血压、血糖、血脂等指标。90%的早期慢性问题可通过改善睡眠（固定起床时间）、饮食（减少精加工食品）和运动（每天7000步）在6个月内逆转。',
      tw: '改善慢性健康問題的起點是獲取基線數據。本月預約一次全面體檢，拿到血壓、血糖、血脂等指標。90%的早期慢性問題可通過改善睡眠（固定起床時間）、飲食（減少精加工食品）和運動（每天7000步）在6個月內逆轉。',
    },

    /* ── Finance ── */
    QKC9: {
      en: 'Insufficient savings is almost always a systems problem, not an income problem. Starting next payday, auto-transfer 10–20% of your income to a separate savings account the moment it arrives, before you can spend it. Name it "Future Fund." The 50/30/20 budget rule is a proven starting framework.',
      cn: '储蓄不足几乎总是系统性问题，而非收入问题。从下次发薪日起，收到工资的瞬间自动转走10-20%到独立储蓄账户，命名为"未来基金"。50/30/20预算法则是经过验证的入门框架。',
      tw: '儲蓄不足幾乎總是系統性問題，而非收入問題。從下次發薪日起，收到薪資的瞬間自動轉走10-20%到獨立儲蓄帳戶，命名為「未來基金」。50/30/20預算法則是經過驗證的入門框架。',
    },
    QKC10: {
      en: 'Less than 3 months of runway is a financial emergency signal. Pause all non-essential spending and investments. This week: list every expense from the past 3 months, flag anything you can cut, and redirect 100% of those savings into an emergency fund. Target: 3 months of living expenses within 90 days.',
      cn: '不足3个月的财务跑道是危险信号。暂停所有非必要支出和投资。本周：列出过去3个月所有支出，标记可以削减的项目，将节省下来的100%存入应急账户。目标：90天内攒够3个月生活费。',
      tw: '不足3個月的財務跑道是危險信號。暫停所有非必要支出和投資。本週：列出過去3個月所有支出，標記可以削減的項目，將節省下來的100%存入應急帳戶。目標：90天內攢夠3個月生活費。',
    },
    QKC11: {
      en: 'Being uninsured is the biggest single financial risk most people carry. The minimum first step: purchase a catastrophic medical plan and an accident policy. These are typically the cheapest and most essential — they protect everything you have built from being wiped out by one bad event.',
      cn: '没有保险是大多数人面临的最大单一财务风险。最低成本的第一步：购买一份大额医疗险和意外险。这两项通常最便宜且最必要——能保护你的全部积累不被一次意外医疗清零。',
      tw: '沒有保險是大多數人面臨的最大單一財務風險。最低成本的第一步：購買一份大額醫療險和意外險。這兩項通常最便宜且最必要——能保護你的全部積累不被一次意外醫療清零。',
    },
    QKC12: {
      en: 'Reckless investing destroys wealth faster than almost anything else. The first rule: if you do not understand the instrument deeply enough to explain it in 2 minutes to a stranger, do not put money in it. Move whatever is in high-risk positions into a diversified index fund and stop checking prices daily.',
      cn: '鲁莽的投资几乎比任何事都更快地摧毁财富。第一原则：如果你对某投资工具的理解不足以在2分钟内向陌生人解释清楚，就不要投钱进去。将高风险仓位转移至多元化指数基金，并停止每天查看价格。',
      tw: '魯莽的投資幾乎比任何事都更快地摧毀財富。第一原則：如果你對某投資工具的理解不足以在2分鐘內向陌生人解釋清楚，就不要投錢進去。將高風險倉位轉移至多元化指數基金，並停止每天查看價格。',
    },

    /* ── Relationships ── */
    QKB1: {
      en: 'Whatever your relationship status, the most important investment is in your own emotional readiness. This week, reflect on one honest question: "What pattern from my past relationships am I still carrying?" Journalling on this for 15 minutes often reveals more than months of passive waiting.',
      cn: '无论你的感情状况如何，最重要的投资是你自身的情感准备。本周反思一个诚实的问题："我过去感情中的什么模式我仍在重复？"用15分钟写日记往往比被动等待数月更有收获。',
      tw: '無論你的感情狀況如何，最重要的投資是你自身的情感準備。本週反思一個誠實的問題：「我過去感情中的什麼模式我仍在重複？」用15分鐘寫日記往往比被動等待數月更有收獲。',
    },
    QKB2: {
      en: 'Toxic parental relationships are a heavy emotional burden. Short-term strategy: establish a "safe distance" — reduce contact frequency while improving quality (e.g. one high-quality monthly video call instead of daily conflict). Long-term: 3–5 sessions of family therapy can open communication channels no amount of arguing ever could.',
      cn: '有毒的父母关系是沉重的情感包袱。短期策略：设定"安全距离"——降低联系频率但提升质量（如每月一次高质量视频通话，而非每日冲突性接触）。长期：3-5次家庭心理治疗能打开任何争吵都无法开启的沟通渠道。',
      tw: '有毒的父母關係是沉重的情感包袱。短期策略：設定「安全距離」——降低聯繫頻率但提升質量（如每月一次高質量視頻通話，而非每日衝突性接觸）。長期：3-5次家庭心理治療能打開任何爭吵都無法開啟的溝通渠道。',
    },
    QKB3: {
      en: 'Sexual satisfaction usually reflects deeper connection quality. The real starting point is not technique — it is increasing daily non-sexual intimacy: more physical touch (hugs, holding hands), emotional sharing, and new shared experiences. Schedule one "just us" night per week with no phones, no kids, no work talk.',
      cn: '性生活满意度通常反映更深层的连接质量。真正的起点不是技巧，而是增加日常非性亲密感：更多身体接触（拥抱、牵手）、情感分享和共同的新体验。每周安排一次"只属于两个人"的夜晚，无手机、无孩子、无工作话题。',
      tw: '性生活滿意度通常反映更深層的連接質量。真正的起點不是技巧，而是增加日常非性親密感：更多身體接觸（擁抱、牽手）、情感分享和共同的新體驗。每週安排一次「只屬於兩個人」的夜晚，無手機、無孩子、無工作話題。',
    },
    QKB5: {
      en: 'Parenting investment imbalance erodes both your personal development and your partnership. This week, sit down together and write out every childcare task on paper, then explicitly assign each one to a person and a day. Consider bringing in outside help (occasional babysitter or daycare) to reclaim high-value personal time.',
      cn: '育儿精力不均衡会侵蚀你的个人发展和伴侣关系。本周坐下来一起把所有育儿任务列在纸上，然后明确分配给具体的人和具体的天。考虑引入外部帮助（临时保姆或托儿所）来夺回高价值个人时间。',
      tw: '育兒精力不均衡會侵蝕你的個人發展和伴侶關係。本週坐下來一起把所有育兒任務列在紙上，然後明確分配給具體的人和具體的天。考慮引入外部幫助（臨時保姆或托兒所）來奪回高價值個人時間。',
    },
    QKB6: {
      en: 'Sibling estrangement often starts with one unaddressed grievance from years ago. You do not need to resolve everything at once. Start with one small, genuine gesture on the next holiday — a short, sincere message with no expectations. If they respond, gradually increase interaction. You will have done your part regardless.',
      cn: '兄弟姐妹的疏远往往源于多年前一个未解决的积怨。不需要一次解决所有问题。在下个节日从一个小而真诚的举动开始——发一条简短、真诚的信息，不带任何期待。如果对方回应了，逐步增加互动。无论如何，你已尽到了自己的责任。',
      tw: '兄弟姊妹的疏遠往往源於多年前一個未解決的積怨。不需要一次解決所有問題。在下個節日從一個小而真誠的舉動開始——發一條簡短、真誠的訊息，不帶任何期待。如果對方回應了，逐步增加互動。無論如何，你已盡到了自己的責任。',
    },

    /* ── Skills & Psychology ── */
    QKD1: {
      en: 'The most efficient way to learn a language is not vocabulary lists — it is the shadowing method: spend 30 minutes daily choosing a target-language audio (podcast, TED talk), and shadow it out loud, copying rhythm and intonation before you even focus on meaning. After 90 days, your speaking instinct transforms.',
      cn: '学语言最高效的方法不是背单词，而是"影子跟读法"：每天花30分钟选一段目标语言音频（播客、TED演讲），跟着大声重复，在关注意义之前先模仿节奏和语调。坚持90天，你的口语本能会发生质变。',
      tw: '學語言最高效的方法不是背單詞，而是「影子跟讀法」：每天花30分鐘選一段目標語言音頻（播客、TED演講），跟著大聲重複，在關注意義之前先模仿節奏和語調。堅持90天，你的口語本能會發生質變。',
    },
    QKD2: {
      en: 'Travel is not a luxury — it is a cognitive investment. Plan one "slow travel" trip per quarter: stay in one place for 3+ days and actually talk to locals. Low-cost approaches: off-peak timing, nearby destinations, and hostels or home-stays instead of hotels.',
      cn: '旅行不是奢侈品，而是认知投资。每季度安排一次"慢旅行"：在一个地方停留3天以上，真正与当地人交流。低成本方式：淡季出行、周边目的地、青旅或民宿代替酒店。',
      tw: '旅行不是奢侈品，而是認知投資。每季度安排一次「慢旅行」：在一個地方停留3天以上，真正與當地人交流。低成本方式：淡季出行、周邊目的地、青旅或民宿代替酒店。',
    },
    QKD4: {
      en: 'Lacking marketable skills is a long-term risk, not a permanent state. Choose one skill adjacent to your current work or interests and spend 3 months producing one concrete, shareable output (portfolio piece, project, article). That single output is your entry ticket to a new opportunity.',
      cn: '缺乏可变现技能是一个长期风险，而非永久状态。选择一个与你现有工作或兴趣相邻的技能，用3个月产出一个具体可分享的成果（作品集、项目、文章）。那个单一成果就是你进入新机会的入场券。',
      tw: '缺乏可變現技能是一個長期風險，而非永久狀態。選擇一個與你現有工作或興趣相鄰的技能，用3個月產出一個具體可分享的成果（作品集、項目、文章）。那個單一成果就是你進入新機會的入場券。',
    },
    QKD5: {
      en: 'Lacking people to confide in means stress accumulates silently inside you. This week, identify 3 people in your contacts you trust. Reach out to one of them — not necessarily to talk about heavy problems; even casual conversation rebuilds the social muscle. Social connection requires regular exercise, just like physical health.',
      cn: '缺乏倾诉对象意味着压力在你内心默默积累。本周找出通讯录中3个你信任的人，主动联系其中一个——不一定要倾诉重大问题，日常闲聊也能重建社交肌肉。社交连接需要定期锻炼，就像身体健康一样。',
      tw: '缺乏傾訴對象意味著壓力在你內心默默積累。本週找出通訊錄中3個你信任的人，主動聯繫其中一個——不一定要傾訴重大問題，日常閒聊也能重建社交肌肉。社交連接需要定期鍛煉，就像身體健康一樣。',
    },
    QKD6: {
      en: 'Curiosity decay is a form of early cognitive ageing. Force yourself to do one "first time" every week — read from a field you have never touched, cook a new dish, take a different route home. You do not have to love it. Just experience it. After 30 days, notice how your world feels bigger.',
      cn: '好奇心衰退是一种早期认知老化。强迫自己每周做一件"第一次"的事——阅读你从未接触过的领域，做一道新菜，走一条不同的路回家。不必喜欢它。只需体验它。30天后，你会感到世界变大了。',
      tw: '好奇心衰退是一種早期認知老化。強迫自己每週做一件「第一次」的事——閱讀你從未接觸過的領域，做一道新菜，走一條不同的路回家。不必喜歡它。只需體驗它。30天後，你會感到世界變大了。',
    },
    QKD7: {
      en: 'Persistence is not about willpower — it is about lowering the activation cost. Shrink your target habit to its absolute minimum version: not "exercise every day" but "put on my shoes and step outside." Do that minimum for 21 consecutive days. The flywheel will carry you forward from there.',
      cn: '坚持不是关于意志力，而是降低启动成本。把目标习惯缩减到绝对最小版本：不是"每天运动"，而是"穿上鞋子走出门"。连续做21天这个最小动作。之后飞轮会自动带你前进。',
      tw: '堅持不是關於意志力，而是降低啟動成本。把目標習慣縮減到絕對最小版本：不是「每天運動」，而是「穿上鞋子走出門」。連續做21天這個最小動作。之後飛輪會自動帶你前進。',
    },
    QKD8: {
      en: 'Weak emotional management damages work, relationships, and decision quality equally. Start an "emotion log" tonight: spend 3 minutes before bed writing down the strongest emotion you felt today, the trigger event, and your reaction. After 2 weeks, you will begin to see your emotions arriving before you are swept away by them.',
      cn: '情绪管理能力弱会同等地损害工作、关系和决策质量。今晚开始一本"情绪日记"：睡前花3分钟写下今天最强烈的情绪、触发事件和你的反应。坚持2周后，你会开始在被情绪淹没之前"看见"它到来。',
      tw: '情緒管理能力弱會同等地損害工作、關係和決策質量。今晚開始一本「情緒日記」：睡前花3分鐘寫下今天最強烈的情緒、觸發事件和你的反應。堅持2週後，你會開始在被情緒淹沒之前「看見」它到來。',
    },
    QKD9: {
      en: 'Feeling like your life is not your own is a belief that must be challenged through action. This week, do one "micro-sovereignty act" — in one situation where you normally let others decide, assert your own preference instead (even just choosing where to eat). Each deliberate choice rewrites your behavioural default.',
      cn: '觉得人生不属于自己是一个必须通过行动挑战的信念。本周做一个"微型主权行为"——在一个通常让他人做决定的场合，坚持表达你自己的偏好（哪怕只是选择去哪吃饭）。每一次刻意选择都在重写你的行为默认值。',
      tw: '覺得人生不屬於自己是一個必須通過行動挑戰的信念。本週做一個「微型主權行為」——在一個通常讓他人做決定的場合，堅持表達你自己的偏好（哪怕只是選擇去哪吃飯）。每一次刻意選擇都在重寫你的行為默認值。',
    },
    QKD11: {
      en: 'When dissatisfied with your life\'s achievements, stop comparing yourself to an endpoint and compare yourself to who you were a year ago instead. Take a sheet of paper and list everything you completed in the past 12 months — however small. You have gone further than you think. Then write 3 things on the back that would make you proud if completed in the next 12 months.',
      cn: '对人生成就感到不满时，停止与终点比较，改为与一年前的自己比较。拿一张纸，列出过去12个月完成的所有事情——无论多小。你走的比你以为的更远。然后在背面写3件如果在接下来12个月内完成会让你感到骄傲的事。',
      tw: '對人生成就感到不滿時，停止與終點比較，改為與一年前的自己比較。拿一張紙，列出過去12個月完成的所有事情——無論多小。你走的比你以為的更遠。然後在背面寫3件如果在接下來12個月內完成會讓你感到驕傲的事。',
    },
    QKS56_1: {
      en: 'For 56–75, health outcomes are mostly determined by consistency, not intensity. Build a fixed weekly rhythm for monitoring and movement. A simple plan that you can execute every week beats an aggressive plan that breaks after two weeks.',
      cn: '对56–75岁人群而言，健康结果更多取决于持续性而非强度。建立固定的监测与运动节律。能每周执行的简单方案，胜过两周就中断的激进方案。',
      tw: '對56–75歲人群而言，健康結果更多取決於持續性而非強度。建立固定的監測與運動節律。能每週執行的簡單方案，勝過兩週就中斷的激進方案。',
    },
    QKS56_2: {
      en: 'This age stage benefits from "risk-first planning": ensure medical continuity, stable cash flow, and clear family role boundaries before pursuing additional returns. Security first creates real freedom.',
      cn: '这一阶段更适合“先控风险再扩收益”：先确保就医连续性、现金流稳定和家庭角色边界，再追求额外收益。安全感先到位，才有真正自由。',
      tw: '這一階段更適合「先控風險再擴收益」：先確保就醫連續性、現金流穩定和家庭角色邊界，再追求額外收益。安全感先到位，才有真正自由。',
    },
    QKS56_3: {
      en: 'A shrinking social rhythm often predicts faster decline than people expect. Protect at least two recurring weekly social touchpoints (neighbors, friends, groups, volunteering) as non-negotiable routines.',
      cn: '社交节律下降的长期影响常被低估。请把每周至少两次固定社交触点（邻里、朋友、社群、志愿活动）设为不可取消的基本安排。',
      tw: '社交節律下降的長期影響常被低估。請把每週至少兩次固定社交觸點（鄰里、朋友、社群、志願活動）設為不可取消的基本安排。',
    },
    QKS76_1: {
      en: 'For 76–100, preserving functional independence is the highest-return objective. Prioritize fall prevention, lower-limb strength, and home safety modifications over high-intensity goals.',
      cn: '对76–100岁人群，维持功能独立是回报最高的目标。优先防跌倒、下肢力量与居家安全改造，而非追求高强度目标。',
      tw: '對76–100歲人群，維持功能獨立是回報最高的目標。優先防跌倒、下肢力量與居家安全改造，而非追求高強度目標。',
    },
    QKS76_2: {
      en: 'Medical continuity should be process-based, not memory-based. Keep a visible checklist for meds, follow-ups, emergency contacts, and critical reports so family/caregivers can coordinate quickly.',
      cn: '医疗连续性应依靠流程而非记忆。把用药、复诊、紧急联系人和关键检查报告做成可见清单，方便家属/照护者快速协同。',
      tw: '醫療連續性應依靠流程而非記憶。把用藥、複診、緊急聯絡人和關鍵檢查報告做成可見清單，方便家屬/照護者快速協同。',
    },
    QKS76_3: {
      en: 'Emotional stability at this stage depends on predictable connection and meaning. Keep a light daily structure (rest, movement, social touchpoint, enjoyable task) to reduce loneliness and anxiety.',
      cn: '这一阶段的情绪稳定，依赖可预测的连接与意义感。建议维持轻量日程结构（休息、活动、社交触点、愉悦任务），降低孤独与焦虑风险。',
      tw: '這一階段的情緒穩定，依賴可預測的連結與意義感。建議維持輕量日程結構（休息、活動、社交觸點、愉悅任務），降低孤獨與焦慮風險。',
    },
  };


  /* Expose IDs set */
  var idSet = {};
  window.QUICK_QUESTION_BANK.forEach(function(q){ idSet[q.id] = true; });
  window.QUICK_IDS = idSet;

})();
