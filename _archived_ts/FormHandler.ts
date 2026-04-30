/* ============================================================
 * FormHandler.ts
 *
 * Bridge between raw questionnaire form submissions (Chinese
 * option strings) and the RuleEngine.
 *
 * Usage:
 *   const result = processQuestionnaireSubmit({
 *     QK1: '26 - 35岁',
 *     QK2: '男性',
 *     QKC5: '总体健康，偶有小病。',
 *     ...
 *   });
 *   console.log(result.dimensions);
 *   // { health: 72, wealth: 45, social: 63, mind: 58, composite: 59 }
 *
 * The function:
 *   1. Takes a plain object of raw CN string answers
 *   2. Maps them to option indices via OPTION_MAPS
 *   3. Builds a UserProfileState
 *   4. Calls evaluateRules with all 4 batches
 *   5. Returns clamped [0,100] dimension scores for a radar chart
 * ============================================================ */

import type { UserProfileState, ScoringRule, EvaluationResult } from './RuleEngine';
import { evaluateRules } from './RuleEngine';
import {
  rulesConfigBatch1,
  rulesConfigBatch2,
  rulesConfigBatch3,
  rulesConfigBatch4,
  rulesConfigBatch5,
  rulesConfigBatch6,
} from './rulesConfig';

// ════════════════════════════════════════════════════════════
//   1. Option maps — CN string → option index
// ════════════════════════════════════════════════════════════

/**
 * For each question ID, maps the Chinese option text (prefix
 * match) to the 0-based option index.  This is the single
 * source of truth for translating user-facing strings back
 * to machine-readable indices.
 *
 * Convention: use the shortest unique prefix of each option
 * so minor punctuation differences don't break the lookup.
 */
const OPTION_MAPS: Record<string, string[]> = {
  // ── Demographics ──
  QK1: [
    '18岁及以下', '18 - 25岁', '26 - 35岁', '36 - 45岁', '46 - 55岁',
    '56 - 65岁', '66 - 75岁', '76 - 85岁', '85 - 100岁', '101岁及以上',
  ],
  QK2: ['男性', '女性'],
  QK3: [
    '在校学生', '在职', '创业者', '待业', '退休',
    '重病中', '重大事故', '行动受限', '全职照护',
  ],
  QK4m: ['165cm 以下', '165 - 170', '170 - 175', '175 - 180', '180 - 185', '185cm 以上'],
  QK4f: ['155cm 以下', '155 - 160', '160 - 165', '165 - 170', '170 - 175', '175cm 以上'],
  QK5m: ['55kg 以下', '55 - 70', '70 - 85', '85 - 100', '100kg 以上'],
  QK5f: ['45kg 以下', '45 - 55', '55 - 65', '65 - 80', '80kg 以上'],

  // ── Common Health/Living ──
  QKC1: ['完全自信', '偶尔在意', '经常焦虑', '极度不安全感'],
  QKC2: ['极高', '高', '中等', '低', '极低'],
  QKC3: ['以上均无', '长期大量吸烟', '长期频繁熬夜', '沉迷短视频', '饮食极度不规律'],
  QKC4: ['视力完好', '轻度近视', '重度近视', '视力明显受损', '法定失明'],
  QKC5: ['极度健壮', '总体健康', '亚健康', '确诊慢性病', '目前正在接受', '危重疾病'],
  QKC6: ['完全清白', '仅有轻微违规', '有过严重违法', '有轻微违法记录', '有严重违法犯罪'],
  QKC7: [
    '庄园级', '豪华住宅', '自有房产', '家庭房产', '独立租住', '与熟人合租',
    '与陌生人合租', '单人宿舍', '多人宿舍', '借住亲友', '帐篷', '医院病房', '露宿街头',
  ],
  QKC8: ['交通不便的偏远', '交通便利的现代化', '小城镇', '大型县城', '省会', '一线城市'],
  QKC8b: ['非常关注', '比较关注', '偶尔关注', '完全不关注'],
  QKC8c: ['价格', '口味', '健康', '均衡'],
  QKC9: ['储备非常充足', '储备健康', '有基础储备', '储备偏少', '处于净负债'],
  QKC11: ['顶级商业保险', '全面覆盖', '基础商业险', '仅有基本医疗', '完全没有保险'],

  // ── Relationships ──
  QKB1: [
    '从未谈过恋爱', '正在恋爱中', '曾恋爱过', '已婚，关系甜蜜',
    '已婚，关系平淡', '已婚，濒临破裂', '我曾出轨。', '我曾出轨且被发现',
    '我的伴侣曾出轨', '离异', '再婚', '丧偶',
  ],
  QKB2: ['非常好', '不错', '疏远', '有毒', '家人已离世，生前关系良好', '家人已离世，生前关系一般'],
  QKB4: ['有。', '没有。'],
  QKB5: ['大量投入', '较多投入', '适度投入', '投入较少', '零投入', '孩子已经长大'],
  QKB5d: ['引导型', '民主型', '保护型', '权威型', '放任型', '控制型'],
  QKB6: ['非常亲密', '友好', '疏远', '敌对', '独生子女'],
  QKB7: ['如果明天需要一大笔', '我能从亲戚处', '可能能借到一小笔', '如果我落难'],

  // ── Skills & Psychology ──
  QKD1: ['我是语言天才', '我可以用第二语言进行深度', '我可以完全掌握', '我勉强可以', '虽然学过', '只会说母语', '连普通话'],
  QKD1b: ['是，完美无缺', '我能用一门非母语', '没有'],
  QKD7: ['轻松，我有钢铁般', '通常可以', '很少，我依靠动力', '从不，每个新计划'],
  QKD8: ['极度稳定', '总体良好', '易激动', '破坏性'],
  QKD9: ['100%是', '大部分是', '大部分不是', '完全不是'],
  QKD12: ['完全可以', '大部分时候', '一般，经常走神', '很难'],
  QKD13: ['坚定支持者', '持开放态度', '持怀疑态度', '强烈反对'],
  QKD14: ['是的，我主动寻求', '有时候', '很少', '从不'],
  QKD15: ['我善于从各种媒体', '我能接受来自不同角度', '我对所有信息都非常谨慎', '相比争议性的意见', '我信奉"眼见为实"', '我倾向于相信非官方', '我从不关心'],

  // ── Traits & Conditions ──
  QKT1: ['从未有过', '偶尔会有伤害', '曾经有过自残', '目前有自残'],
  QKT2: ['没有任何已知', '有轻微过敏', '有中度过敏', '有严重过敏'],
  QKT3: ['没有，我的心理', '偶尔会有焦虑', '被诊断有轻度', '被诊断有中度', '被诊断有严重'],
  QKT14: ['完全没有，色彩', '轻微色弱', '中度色弱', '较严重色盲', '严重色盲'],

  // ── Employed ──
  QKAB1: ['每天工作8-10小时，周末双休', '每天工作8-10小时，每周只', '休息对我来说', '几乎不间断', '极度轻松'],
  QKAB2: ['高度匹配', '部分匹配', '完全不匹配'],
  QKAB4: ['大量结余', '小额结余', '月光', '入不敷出'],
  QKAB5: ['每周3次以上', '偶尔运动', '很少运动', '业余时间太紧'],
  QKAB6: ['有，我已经获得晋升', '有，路径清晰', '停滞不前', '行业萎缩'],
  QKAB7: ['毫无压力', '需要1-3个月', '非常焦虑', '致命打击'],
  QKAB8: [
    '航天', '国家级别公务', '法官', '计算机顶级', '医生', '教授',
    '科研人员', '大型企业', '持有合法飞行', '高门槛体育',
    '警官', '高级经理', '工商管理硕士', '知名演员', '歌手',
    '职业运动员', '有粉丝基础', '政府职员', '戏曲', '美术', '影视',
    '我不从事以上',
  ],

  // ── Entrepreneur ──
  QKAC1: ['稳定盈利', '基本实现收支', '暂未正式盈利', '亏损中', '极高负债'],
  QKAC2: ['40小时以内', '40-60小时', '60-80小时', '80小时以上'],
  QKAC3: ['客户粘性极高', '客户粘性高', '有一定客户基础', '刚获得首批', '仍处于冷启动'],
  QKAC4: ['被认证的企业家', '任意行业创始人', '小型个体', '副业尝试者'],

  // ── Caregiver ──
  QKAI3: ['极度支持', '有一定支持', '中立', '负面支持'],
  QKAI4: ['40%-50%以上', '20%-30%', '5%-10%', '0%'],

  // ── Student HS ──
  QKA_STAGE: ['高中及以下', '大专', '全日制本科', '硕士及以上'],
  QKA_HS1: ['充满热情', '适应良好', '枯燥机械', '极度痛苦'],
  QKA_HS2: ['完全没有，社交', '偶有小摩擦', '正遭受长期情感', '正遭受身体暴力'],
  QKA_HS3: ['每周4次', '每周2-3次', '每周1次', '几乎从不'],
  QKA_HS4: ['非常自由', '正常管理', '严格高压', '极度压制'],
  QKA_HS5: ['我是社交核心', '我有稳定的小圈子', '我被边缘化', '我被主动排斥'],
  QKA_HS11: ['很少，我动力很强', '偶尔，但能调整', '经常，学习感觉', '持续，我已经'],
  QKA_HS12: ['完全不，我有清晰', '有点迷茫', '非常焦虑', '对未来的恐惧'],

  // ── Student College/Bachelor+ ──
  QKA_BC1: ['从未，我的心理', '偶尔情绪低落', '频繁出现', '是，我曾经历'],
  QKA_BC2: ['名列前茅', '中上水平', '一般，勉强及格', '严重吃力'],
  QKA_BC3: ['肯定，我的专业', '大概率', '不太可能', '完全不可能'],
  QKA_BC4: ['有，顶级', '有，普通', '没有，但成绩', '没有，成绩太低'],
  QKA_BC5: ['有，我担任核心', '有，我担任小型', '没有，但我积极', '没有，我不参与'],
  QKA_BC7: ['流利', '熟练', '基础', '零基础'],
};

// ════════════════════════════════════════════════════════════
//   2. String → index resolver
// ════════════════════════════════════════════════════════════

/**
 * Given a question ID and a raw Chinese answer string, find
 * the matching option index by prefix match.
 *
 * Returns the index, or -1 if not found.
 */
function resolveOptionIndex(qid: string, rawAnswer: string): number {
  const map = OPTION_MAPS[qid];
  if (!map) return -1;

  const trimmed = rawAnswer.trim();

  // Exact prefix match (most options are unique by first few chars)
  for (let i = 0; i < map.length; i++) {
    if (trimmed.startsWith(map[i]) || trimmed.includes(map[i])) {
      return i;
    }
  }
  return -1;
}

// ════════════════════════════════════════════════════════════
//   3. Raw form → UserProfileState
// ════════════════════════════════════════════════════════════

/**
 * Convert raw form answers (qid → CN string) into a
 * UserProfileState that the rule engine understands.
 *
 * Multi-select questions (QKC3) accept comma-separated
 * or array values.
 */
function buildStateFromForm(
  rawAnswers: Record<string, string | string[]>,
): UserProfileState {
  const state: UserProfileState = {};
  state.traits = new Set<string>();

  // Engine-mapped fields (semantic string values)
  const ENGINE_MAPS: Record<string, { field: string; values: string[] }> = {
    QK1:   { field: 'ageRange', values: ['under_18','18_25','26_35','36_45','46_55','56_65','66_75','76_85','86_100','over_100'] },
    QK2:   { field: 'gender', values: ['male', 'female'] },
    QK3:   { field: 'primaryStatus', values: ['student','employed','entrepreneur','unemployed','retired','critically_ill','post_accident','restricted_mobility','caregiver'] },
    QKC5:  { field: 'overallHealth', values: ['excellent','good','subhealthy','chronic','severe','severe'] },
    QKC9:  { field: 'savingsBand', values: ['abundant','healthy','moderate','paycheck_to_paycheck','net_debt'] },
    QKB1:  { field: 'relationship', values: ['never_dated','dating','previously_dated','married_happy','married_neutral','married_collapsing','cheated_hidden','cheated_caught','partner_cheated','divorced','remarried','widowed'] },
    QKB2:  { field: 'familySupport', values: ['excellent','decent','distant','toxic','deceased_good','deceased_neutral'] },
    QKB6:  { field: 'siblingRelation', values: ['very_close','friendly','estranged','hostile','only_child'] },
    QKB7:  { field: 'emergencyFunds', values: ['easy_300k','family_decent_amount','small_loan_only','nothing'] },
    QKC6:  { field: 'criminalRecord', values: ['clean','minor','undetected_serious','minor_with_impact','major'] },
    QKD13: { field: 'tcmAttitude', values: ['staunch_supporter','open_minded','skeptical_respectful','strongly_opposed'] },
    QKD15: { field: 'informationLiteracy', values: ['high','high','medium_high','medium','medium','low','none'] },
    QKB5d: { field: 'parentingStyle', values: ['guiding','democratic','protective','authoritarian','permissive','controlling'] },
  };

  // Height/weight as raw strings for estimateBMI
  const HEIGHT_QS = ['QK4m', 'QK4f'];
  const WEIGHT_QS = ['QK5m', 'QK5f'];

  for (const [qid, rawVal] of Object.entries(rawAnswers)) {
    const raw = Array.isArray(rawVal) ? rawVal[0] : rawVal;
    if (!raw) continue;

    // Multi-select handling
    if (qid === 'QKC3') {
      const items = Array.isArray(rawVal) ? rawVal : raw.split(/[,，、]/);
      const indices: number[] = [];
      for (const item of items) {
        const idx = resolveOptionIndex(qid, item.trim());
        if (idx >= 0) indices.push(idx);
      }
      (state as any)[qid] = indices;
      continue;
    }

    const idx = resolveOptionIndex(qid, raw);
    if (idx < 0) continue;

    // Store raw index for rules that read (state as any).QKxx
    (state as any)[qid] = idx;

    // Map to semantic engine fields
    if (ENGINE_MAPS[qid]) {
      const em = ENGINE_MAPS[qid];
      if (em.values[idx] !== undefined) {
        (state as any)[em.field] = em.values[idx];
      }
    }

    // Height/weight raw strings for BMI
    if (HEIGHT_QS.includes(qid)) {
      state.heightRange = OPTION_MAPS[qid][idx];
    }
    if (WEIGHT_QS.includes(qid)) {
      state.weightRange = OPTION_MAPS[qid][idx];
    }

    // Children boolean
    if (qid === 'QKB4') {
      state.hasChildren = idx === 0;
    }
  }

  // ── Pass 0: Derive Traits from extreme answers ──
  const T = state.traits!;

  // Wealth / Financial
  if (state.savingsBand === 'abundant')             T.add('FINANCIAL_SHIELD');
  if ((state as any).QKC9 === 0)                    T.add('FINANCIAL_SHIELD');
  if ((state as any).QKC11 === 0)                   { T.add('TOP_INSURANCE'); T.add('FINANCIAL_SHIELD'); }
  if ((state as any).QKAD1 === 0)                   T.add('FINANCIALLY_FREE');
  if ((state as any).QKBON_AC1 === 0)               T.add('SAVINGS_DISCIPLINE');
  if ((state as any).QKBON_AC2 === 0)               T.add('BUSINESS_MOAT');
  if ((state as any).QKBON_AC5 === 0)               T.add('TIME_FREEDOM');
  if ((state as any).QKBON_AE2 === 0)               T.add('GENERATIONAL_WEALTH');

  // Health / Physical
  if ((state as any).QKBON_G8 === 0)                T.add('EXTREME_ENDURANCE');
  if (state.overallHealth === 'chronic')             T.add('CHRONIC_CONDITION');
  if (state.overallHealth === 'severe')              { T.add('CHRONIC_CONDITION'); T.add('CRITICALLY_ILL'); }
  if (state.primaryStatus === 'critically_ill')      T.add('CRITICALLY_ILL');
  if ((state as any).hasChronicCondition)            T.add('CHRONIC_CONDITION');

  // Mind / Identity
  if ((state as any).QKBON_S1 === 0)                T.add('IRON_DISCIPLINE');
  if ((state as any).QKD7 === 0)                     T.add('IRON_DISCIPLINE');
  if ((state as any).QKBON_G7 === 0)                T.add('MASTER_SKILL');
  if ((state as any).QKD1b === 0)                    T.add('POLYGLOT');
  if ((state as any).QKBON_AE4 === 0)               T.add('TECH_SAVVY_ELDER');
  if ((state as any).QKBON_AE5 === 0)               T.add('SPIRITUAL_INDEPENDENCE');
  if ((state as any).QKT1 === 3)                     T.add('SELF_HARM_ACTIVE');
  if ((state as any).QKT3 === 4)                     T.add('SEVERE_MENTAL_ILLNESS');

  // Social / Relationships
  if (state.familySupport === 'toxic')               T.add('TOXIC_FAMILY');
  if (state.siblingRelation === 'hostile')            T.add('HOSTILE_SIBLINGS');
  if (state.relationship === 'married_collapsing')   T.add('MARRIAGE_COLLAPSING');
  if (state.emergencyFunds === 'nothing')            T.add('SOCIAL_ISOLATION');
  if ((state as any).QKBON_G1 === 0)                T.add('PUBLIC_FIGURE');
  if ((state as any).QKBON_AE3 === 0)               T.add('IRREPLACEABLE_CONSULTANT');

  // Career
  if ((state as any).QKAB8 === 0)                    T.add('TOP_PROFESSION');
  if ((state as any).QKAB7 === 3)                    T.add('JOB_VULNERABLE');

  // Burnout (entrepreneur: losing money + 80h+)
  if (((state as any).QKAC1 === 3 || (state as any).QKAC1 === 4) &&
      (state as any).QKAC2 === 3) {
    T.add('BURNOUT_RISK');
  }

  return state;
}

// ════════════════════════════════════════════════════════════
//   4. All rules combined
// ════════════════════════════════════════════════════════════

const allRules: ScoringRule[] = [
  ...rulesConfigBatch1,
  ...rulesConfigBatch2,
  ...rulesConfigBatch3,
  ...rulesConfigBatch4,
  ...rulesConfigBatch5,
  ...rulesConfigBatch6,
];

// ════════════════════════════════════════════════════════════
//   5. Public API
// ════════════════════════════════════════════════════════════

export interface QuestionnaireResult {
  /** Clamped [0, 100] dimension scores — ready for radar chart */
  dimensions: {
    health: number;
    wealth: number;
    social: number;
    mind: number;
    composite: number;
  };
  /** Full evaluation audit trail */
  evaluation: EvaluationResult;
  /** The built state object for debugging */
  state: UserProfileState;
}

/**
 * Process a raw questionnaire form submission end-to-end.
 *
 * @param rawFormAnswers  Plain object: question ID → Chinese option string
 *                        Multi-select: comma-separated string or string[]
 * @returns               Radar-chart-ready dimension scores + audit trail
 */
export function processQuestionnaireSubmit(
  rawFormAnswers: Record<string, string | string[]>,
): QuestionnaireResult {
  // Step 1–2: Map raw strings → UserProfileState
  const state = buildStateFromForm(rawFormAnswers);

  // Step 3: Run the Dual-Track pipeline.
  // IMPORTANT: evaluateRules internally performs Pass 1 (applyDefaultWeights),
  // Pass 2 (complex rules), and Pass 3 (trait interceptor).  Do NOT call
  // applyDefaultWeights here — doing so would double every Pass 1 delta.
  const evaluation = evaluateRules(state, allRules);

  // Step 4: Return radar-ready scores
  return {
    dimensions: evaluation.dimensions,
    evaluation,
    state,
  };
}

// ════════════════════════════════════════════════════════════
//   6. MOCK TEST — run with: npx ts-node FormHandler.ts
// ════════════════════════════════════════════════════════════

function runMockTest(): void {
  console.log('═══════════════════════════════════════════');
  console.log('  FormHandler Mock Test');
  console.log('═══════════════════════════════════════════\n');

  // Simulated user: 28yo employed male, healthy, good finances,
  // happily married, no addictions, iron discipline
  const mockAnswers: Record<string, string | string[]> = {
    QK1:    '26 - 35岁',
    QK2:    '男性',
    QK3:    '在职（全职/兼职）',
    QK4m:   '175 - 180cm',
    QK5m:   '70 - 85kg正常/健壮',
    QKC1:   '完全自信，靠健康和体魄说话。',
    QKC2:   '高（扎实的中上阶层）。',
    QKC3:   '以上均无，高度自律。',
    QKC4:   '轻度近视/散光，日常影响不大。',
    QKC5:   '总体健康，偶有小病。',
    QKC6:   '完全清白，没有任何违法犯罪记录。',
    QKC7:   '自有房产。',
    QKC8:   '省会城区或大型城市城区。',
    QKC8b:  '比较关注，尽量吃得均衡但不会刻意计算。',
    QKC8c:  '均衡，追求口味、健康和合理价格的综合平衡。',
    QKC9:   '储备健康，日常稳定，遇到中大型意外开支也能承受。',
    QKC11:  '全面覆盖，含重疾、医疗、意外和寿险。',
    QKB1:   '已婚，关系甜蜜幸福。',
    QKB2:   '非常好，相互尊重，像成熟的朋友。',
    QKB4:   '有。',
    QKB5:   '较多投入，积极参与孩子的重要成长环节',
    QKB5d:  '引导型，尊重孩子的独立性',
    QKB6:   '友好，节假日时互相联系。',
    QKB7:   '我能从亲戚处凑到一笔体面的应急资金。',
    QKT1:   '从未有过，我珍视并爱护自己的身体。',
    QKT2:   '没有任何已知的过敏。',
    QKT3:   '没有，我的心理健康状态良好。',
    QKT14:  '完全没有，色彩辨别能力正常。',
    QKD1:   '我可以完全掌握第二语言来应对学习任务或商务安排。',
    QKD1b:  '是，完美无缺的多语言商务主导力。',
    QKD7:   '轻松，我有钢铁般的自律，目标成为不可妥协的习惯。',
    QKD8:   '极度稳定，危机中保持冷静和客观。',
    QKD9:   '100%是，我完全掌控自己的人生路径。',
    QKD12:  '完全可以，能连续深度专注数小时，几乎不受干扰。',
    QKD13:  '持开放态度，认为中医有价值，可以作为现代医学的补充。',
    QKD14:  '是的，我主动寻求经过评估的风险，享受突破边界。',
    QKD15:  '我善于从各种媒体和日常生活中寻找信息，并具备辨别真伪的能力。',
    QKAB1:  '每天工作8-10小时，周末双休。',
    QKAB2:  '高度匹配，能充分发挥我的优势。',
    QKAB4:  '大量结余，可自由储蓄和投资。',
    QKAB5:  '每周3次以上，有系统性饮食管理。',
    QKAB6:  '有，我已经获得晋升或大幅加薪。',
    QKAB7:  '毫无压力，能轻松找到更好的工作或有强大的副业。',
    QKAB8:  '计算机顶级研发人员',
  };

  const result = processQuestionnaireSubmit(mockAnswers);

  console.log('📊 DIMENSION SCORES (Radar Chart Ready):');
  console.log('   Health:    ', result.dimensions.health);
  console.log('   Wealth:    ', result.dimensions.wealth);
  console.log('   Social:    ', result.dimensions.social);
  console.log('   Mind:      ', result.dimensions.mind);
  console.log('   Composite: ', result.dimensions.composite);

  console.log('\n📋 RULES SUMMARY:');
  console.log('   Total rules: ', result.evaluation.totalRules);
  console.log('   Fired:       ', result.evaluation.fired.length);
  console.log('   Skipped:     ', result.evaluation.skipped.length);
  console.log('   Errored:     ', result.evaluation.errored.length);

  console.log('\n✅ FIRED RULES:');
  for (const r of result.evaluation.fired) {
    console.log('   ✓', r.ruleId);
  }

  if (result.evaluation.skipped.length > 0) {
    console.log('\n⏭️  SKIPPED RULES:');
    for (const id of result.evaluation.skipped) {
      console.log('   ○', id);
    }
  }

  if (result.evaluation.errored.length > 0) {
    console.log('\n❌ ERRORED RULES:');
    for (const id of result.evaluation.errored) {
      console.log('   ✗', id);
    }
  }

  // ── Test 2: Struggling user ──
  console.log('\n\n═══════════════════════════════════════════');
  console.log('  Mock Test 2: Struggling Profile');
  console.log('═══════════════════════════════════════════\n');

  const struggleAnswers: Record<string, string | string[]> = {
    QK1:   '26 - 35岁',
    QK2:   '男性',
    QK3:   '待业 / 求职中',
    QK4m:  '165cm 以下',
    QK5m:  '100kg 以上超重',
    QKC1:  '极度不安全感，已影响社交生活和心理健康。',
    QKC3:  ['长期频繁熬夜', '沉迷短视频、成人内容或即时多巴胺刺激。'],
    QKC4:  '重度近视/散光，高度依赖眼镜/隐形眼镜。',
    QKC5:  '亚健康，如超重、慢性腰背痛、持续性疲劳。',
    QKC7:  '与陌生人合租公寓。',
    QKC8:  '小城镇/县城，或较偏远的城市区域。',
    QKC8b: '完全不关注，怎么方便或好吃就怎么来。',
    QKC9:  '储备偏少，常接近月光状态。',
    QKC11: '完全没有保险。',
    QKB1:  '从未谈过恋爱。',
    QKB2:  '有毒，充满控制、操纵或持续消耗。',
    QKB6:  '敌对，持续冲突或已断绝往来。',
    QKB7:  '如果我落难，没人愿意借给我一分钱。',
    QKT1:  '偶尔会有伤害自己的念头，但从未付诸行动。',
    QKT2:  '有严重过敏（如花生、海鲜、青霉素），可能危及生命。',
    QKT3:  '被诊断有中度心理问题，需要持续治疗或药物辅助。',
    QKT14: '中度色弱/色盲',
    QKD7:  '从不，每个新计划都在几周内放弃。',
    QKD8:  '破坏性，我的愤怒/悲伤经常损害生活和关系。',
    QKD9:  '完全不是，我是环境/命运的受害者。',
    QKD15: '我从不关心这些，也从来没有想过。',
  };

  const result2 = processQuestionnaireSubmit(struggleAnswers);

  console.log('📊 DIMENSION SCORES (Struggling):');
  console.log('   Health:    ', result2.dimensions.health);
  console.log('   Wealth:    ', result2.dimensions.wealth);
  console.log('   Social:    ', result2.dimensions.social);
  console.log('   Mind:      ', result2.dimensions.mind);
  console.log('   Composite: ', result2.dimensions.composite);
  console.log('   Fired:     ', result2.evaluation.fired.length, '/', result2.evaluation.totalRules);
}

// Auto-run if executed directly
if (typeof globalThis !== 'undefined' && (globalThis as any).__RUN_MOCK_TEST__) {
  runMockTest();
}

// Export for direct invocation
export { runMockTest };
