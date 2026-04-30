/* ============================================================
 * scoring-functions-registry.js
 *
 * Metadata registry for every scoring function in the LifeScore
 * engine. The Scoring Analysis page iterates this registry to
 * generate its explainer sections — Calculation Logic, Function
 * Mechanics, and Execution Processes.
 *
 * To add a new scoring function to the analysis page, add an
 * entry to SCORING_FUNCTIONS below. No page template changes
 * needed — the analysis page reads this file directly.
 *
 * Exposes: window.LSScoringRegistry
 * ============================================================ */
(function () {
  'use strict';

  /**
   * Each entry describes one scoring function.
   *
   * Fields:
   *   id               Stable unique identifier (used as DOM id)
   *   dimension        'health' | 'wealth' | 'social' | 'mind' | 'modifier'
   *   nameCn / nameTw  Display name per locale
   *   description      One-paragraph description in each locale.
   *                    This is the "one editable field" per function.
   *   logic            Calculation logic — what inputs drive what outputs,
   *                    in plain language. One object with cn/tw keys.
   *   mechanics        Function mechanics — the math shape and key
   *                    constants. One object with cn/tw keys.
   *   execution        Execution process — how/when the rule fires during
   *                    the engine pipeline (priority, ordering, edge cases).
   *                    One object with cn/tw keys.
   */
  var SCORING_FUNCTIONS = [
    // ──────────────────────────────────────────────────────────
    //   WEALTH DIMENSION
    // ──────────────────────────────────────────────────────────
    {
      id: 'wealth_dynamic_baseline',
      dimension: 'wealth',
      nameCn: '动态财富基线',
      nameTw: '動態財富基線',
      description: {
        cn: '通过年龄相关的二次曲线建立"预期储蓄水平"基线，用户当前储蓄与基线的差距决定分数。年轻人储蓄少不会被惩罚，中年人债务累累会受到严厉的非线性惩罚。',
        tw: '透過年齡相關的二次曲線建立「預期儲蓄水平」基線，使用者當前儲蓄與基線的差距決定分數。年輕人儲蓄少不會被懲罰，中年人債務累累會受到嚴厲的非線性懲罰。',
      },
      logic: {
        cn: '输入：年龄段（10 级）+ 储蓄水平（6 级）。将年龄映射到年龄中位数（如 26-35 → 30），将储蓄映射到归一化百分位（从负债 -0.20 到充裕 1.00）。然后对比用户实际百分位与同龄人预期百分位的差距。',
        tw: '輸入：年齡段（10 級）+ 儲蓄水平（6 級）。將年齡對應到年齡中位數（如 26-35 → 30），將儲蓄對應到歸一化百分位（從負債 -0.20 到充裕 1.00）。然後對比使用者實際百分位與同齡人預期百分位的差距。',
      },
      mechanics: {
        cn: '使用二次曲线 expected(age) = 0.75 − (0.70/1296) × (age − 58)² 作为生命周期预期财富基线，峰值在 58 岁。差距为负时应用二次惩罚 −18 × weight × gap²，差距为正时应用对数奖励 9 × log(1 + gap)。权重 adultEarningWeight 在 18 岁前为 0，到 35 岁线性升至 1.0，65 岁后缓降至 0.5。最终得分限制在 [−10, +14]。',
        tw: '使用二次曲線 expected(age) = 0.75 − (0.70/1296) × (age − 58)² 作為生命週期預期財富基線，峰值在 58 歲。差距為負時套用二次懲罰 −18 × weight × gap²，差距為正時套用對數獎勵 9 × log(1 + gap)。權重 adultEarningWeight 在 18 歲前為 0，到 35 歲線性升至 1.0，65 歲後緩降至 0.5。最終得分限制在 [−10, +14]。',
      },
      execution: {
        cn: '当状态中同时存在 ageRange 和 savingsBand 时触发。作为普通规则运行（优先级 0），在维度聚合之前贡献到 wealth 维度。18 岁以下直接返回 0（无惩罚无奖励）。无效输入返回 0，保证安全降级。',
        tw: '當狀態中同時存在 ageRange 和 savingsBand 時觸發。作為一般規則執行（優先級 0），在維度聚合之前貢獻到 wealth 維度。18 歲以下直接回傳 0（無懲罰無獎勵）。無效輸入回傳 0，保證安全降級。',
      },
      example: {
        cn: '示例：40 岁、净负债状态的用户。年龄中位数 = 40，预期基线 ≈ 0.575，实际百分位 = -0.20，差距 = -0.775，权重 = 1.0。应用二次惩罚：-18 × 1.0 × 0.775² ≈ -10.8，被下限钳制为 -10。结果：wealth 维度 -10 分。相比之下，同样 40 岁但储蓄充裕（百分位 1.0）的用户差距 = +0.425，对数奖励 = 9 × log(1.425) ≈ +3.2 分。',
        tw: '示例：40 歲、淨負債狀態的使用者。年齡中位數 = 40，預期基線 ≈ 0.575，實際百分位 = -0.20，差距 = -0.775，權重 = 1.0。套用二次懲罰：-18 × 1.0 × 0.775² ≈ -10.8，被下限鉗制為 -10。結果：wealth 維度 -10 分。相比之下，同樣 40 歲但儲蓄充裕（百分位 1.0）的使用者差距 = +0.425，對數獎勵 = 9 × log(1.425) ≈ +3.2 分。',
      },
    },

    {
      id: 'wealth_resilience_buff',
      dimension: 'wealth',
      nameCn: '社交圈应急资金缓冲',
      nameTw: '社交圈應急資金緩衝',
      description: {
        cn: '用户从信任网络中借到应急资金的能力，作为隐藏的安全网加到 Wealth 维度。强大的社交网络能给财富维度带来最多 +15 的加成。',
        tw: '使用者從信任網路中借到應急資金的能力，作為隱藏的安全網加到 Wealth 維度。強大的社交網路能給財富維度帶來最多 +15 的加成。',
      },
      logic: {
        cn: '输入：emergencyFunds（5 类）。easy_300k → +15；family_decent_amount → +8；small_loan_only → +2；nothing → -3；unspecified → 0。',
        tw: '輸入：emergencyFunds（5 類）。easy_300k → +15；family_decent_amount → +8；small_loan_only → +2；nothing → -3；unspecified → 0。',
      },
      mechanics: {
        cn: '纯查表函数，无插值、无平滑。四个真实类别 + 一个未指定类别，确保未应答时保持中性。负值惩罚表示社交孤立在财富维度的真实影响：没人愿意借钱是一个活跃的负信号，而不仅仅是缺少支持。',
        tw: '純查表函式，無插值、無平滑。四個真實類別 + 一個未指定類別，確保未應答時保持中性。負值懲罰表示社交孤立在財富維度的真實影響：沒人願意借錢是一個活躍的負信號，而不僅僅是缺少支援。',
      },
      execution: {
        cn: '优先级 20 — 在基础 wealth 规则之后执行，确保它真正"叠加"在基线上而不是被平均掉。即使其他 wealth 输入缺失，只要 emergencyFunds 存在就会触发。',
        tw: '優先級 20 — 在基礎 wealth 規則之後執行，確保它真正「疊加」在基線上而不是被平均掉。即使其他 wealth 輸入缺失，只要 emergencyFunds 存在就會觸發。',
      },
      example: {
        cn: '示例：用户选择"如果明天需要 30 万应急资金，我能很快借到"（QKB7 选项 0）。emergencyFunds = "easy_300k"，查表返回 +15。wealth 维度直接加 15 分。这个加成与基础储蓄水平独立 —— 即使此人储蓄一般，强大的社交救援网络仍能把他们从财务崩盘中拉回来。相反，选择"没人愿意借给我一分钱"的用户得到 -3 惩罚，表示社交孤立在财富维度的真实风险。',
        tw: '示例：使用者選擇「如果明天需要 30 萬應急資金，我能很快借到」（QKB7 選項 0）。emergencyFunds = "easy_300k"，查表回傳 +15。wealth 維度直接加 15 分。這個加成與基礎儲蓄水平獨立 —— 即使此人儲蓄一般，強大的社交救援網路仍能把他們從財務崩盤中拉回來。相反，選擇「沒人願意借給我一分錢」的使用者得到 -3 懲罰，表示社交孤立在財富維度的真實風險。',
      },
    },

    // ──────────────────────────────────────────────────────────
    //   HEALTH DIMENSION
    // ──────────────────────────────────────────────────────────
    {
      id: 'health_bmi',
      dimension: 'health',
      nameCn: 'BMI 健康调节',
      nameTw: 'BMI 健康調節',
      description: {
        cn: '从类别化的身高/体重区间估算 BMI，然后通过高斯衰减曲线映射为健康乘数。健康范围得到完整分数，偏离理想 BMI 越远衰减越快，但永远不会降到 0.5 以下。',
        tw: '從類別化的身高/體重區間估算 BMI，然後透過高斯衰減曲線對應為健康乘數。健康範圍得到完整分數，偏離理想 BMI 越遠衰減越快，但永遠不會降到 0.5 以下。',
      },
      logic: {
        cn: '输入：heightRange（字符串，如 "170 - 175cm"）+ weightRange（字符串，如 "70 - 85kg（正常/健壮）"）+ gender。通过正则解析区间中点（"170 - 175cm" → 172.5），开区间（"185cm 以上"）使用半带宽估算。然后用标准公式 BMI = kg / m² 计算。',
        tw: '輸入：heightRange（字串，如 "170 - 175cm"）+ weightRange（字串，如 "70 - 85kg（正常/健壯）"）+ gender。透過正規表達式解析區間中點（"170 - 175cm" → 172.5），開區間（"185cm 以上"）使用半帶寬估算。然後用標準公式 BMI = kg / m² 計算。',
      },
      mechanics: {
        cn: '使用高斯衰减 modifier = 0.5 + 0.5 × exp(−(bmi − center)² / (2σ²))，其中男性 center = 22.0，女性 center = 21.5，σ = 4.0。理想 BMI 得分 1.0，WHO 健康范围内保持在 0.93 以上，超重门槛（BMI 25）约 0.81，肥胖（BMI 30+）接近 0.5 下限。曲线对称，过轻与过重同等惩罚。',
        tw: '使用高斯衰減 modifier = 0.5 + 0.5 × exp(−(bmi − center)² / (2σ²))，其中男性 center = 22.0，女性 center = 21.5，σ = 4.0。理想 BMI 得分 1.0，WHO 健康範圍內保持在 0.93 以上，過重門檻（BMI 25）約 0.81，肥胖（BMI 30+）接近 0.5 下限。曲線對稱，過輕與過重同等懲罰。',
      },
      execution: {
        cn: '当状态中同时存在 heightRange 和 weightRange 时触发。乘数通过公式 delta = round(10 × mult − 10) 转换为 health 维度的有符号贡献：mult 1.0 → 0 分，mult 0.5 → -5 分。输入不可解析、超出合理范围（身高 < 50cm 或 > 250cm）时返回中性 1.0。',
        tw: '當狀態中同時存在 heightRange 和 weightRange 時觸發。乘數透過公式 delta = round(10 × mult − 10) 轉換為 health 維度的有符號貢獻：mult 1.0 → 0 分，mult 0.5 → -5 分。輸入不可解析、超出合理範圍（身高 < 50cm 或 > 250cm）時回傳中性 1.0。',
      },
      example: {
        cn: '示例：男性，身高 175-180cm，体重 70-85kg。解析中点：177.5cm / 77.5kg，BMI = 77.5 / 1.775² ≈ 24.6。男性理想中心 = 22.0，距离 = 2.6，高斯衰减 = exp(-2.6²/32) ≈ 0.81。乘数 = 0.5 + 0.5 × 0.81 ≈ 0.905。delta = round(10 × 0.905 − 10) = -1。结果：health 维度 -1 分。这个 BMI 在 WHO 健康范围的上限，函数给出温和的负分提醒但不惩罚。肥胖案例（BMI 30+）会触及 0.5 下限，产生 -5 分。',
        tw: '示例：男性，身高 175-180cm，體重 70-85kg。解析中點：177.5cm / 77.5kg，BMI = 77.5 / 1.775² ≈ 24.6。男性理想中心 = 22.0，距離 = 2.6，高斯衰減 = exp(-2.6²/32) ≈ 0.81。乘數 = 0.5 + 0.5 × 0.81 ≈ 0.905。delta = round(10 × 0.905 − 10) = -1。結果：health 維度 -1 分。這個 BMI 在 WHO 健康範圍的上限，函式給出溫和的負分提醒但不懲罰。肥胖案例（BMI 30+）會觸及 0.5 下限，產生 -5 分。',
      },
    },

    // ──────────────────────────────────────────────────────────
    //   SOCIAL DIMENSION
    // ──────────────────────────────────────────────────────────
    {
      id: 'social_resilience',
      dimension: 'social',
      nameCn: '压力恢复率',
      nameTw: '壓力恢復率',
      description: {
        cn: '基于家庭关系质量和伴侣支持水平计算用户从压力事件中恢复的速度。家庭"有毒"且伴侣"零支持"会同时触发累加惩罚，将恢复率压到 0.4，意味着从负面事件中恢复的速度是正常人的 40%。',
        tw: '基於家庭關係品質和伴侶支援水平計算使用者從壓力事件中恢復的速度。家庭「有毒」且伴侶「零支援」會同時觸發累加懲罰，將恢復率壓到 0.4，意味著從負面事件中恢復的速度是正常人的 40%。',
      },
      logic: {
        cn: '输入：familySupport（6 类，从 excellent 到 toxic）+ partnerSupport（5 类，包括"无伴侣"作为中性类别，区分于"有伴侣但零支持"）。计算加权混合：0.6 × familyFactor + 0.4 × partnerFactor，然后在家庭有毒且伴侣零支持时应用 0.65× 的累加惩罚。',
        tw: '輸入：familySupport（6 類，從 excellent 到 toxic）+ partnerSupport（5 類，包含「無伴侶」作為中性類別，區分於「有伴侶但零支援」）。計算加權混合：0.6 × familyFactor + 0.4 × partnerFactor，然後在家庭有毒且伴侶零支援時套用 0.65× 的累加懲罰。',
      },
      mechanics: {
        cn: '恢复率下限 0.3（没人真的"永远不恢复"），上限 1.0。家庭权重略高于伴侣（60/40），因为家庭关系是长期塑造压力反应的因素。"无伴侣"与"零支持"严格区分：独身是中性的，有伴侣却主动拒绝支持才是侵蚀性的。',
        tw: '恢復率下限 0.3（沒人真的「永遠不恢復」），上限 1.0。家庭權重略高於伴侶（60/40），因為家庭關係是長期塑造壓力反應的因素。「無伴侶」與「零支援」嚴格區分：獨身是中性的，有伴侶卻主動拒絕支援才是侵蝕性的。',
      },
      execution: {
        cn: '恢复率本身不直接贡献分数，而是作为元数据由其他规则引用（例如未来的心理健康规则或自我修复规则）。当前仅用于分析页面显示，向用户解释他们的社交系统如何缓冲压力。',
        tw: '恢復率本身不直接貢獻分數，而是作為元資料由其他規則引用（例如未來的心理健康規則或自我修復規則）。當前僅用於分析頁面顯示，向使用者解釋他們的社交系統如何緩衝壓力。',
      },
      example: {
        cn: '示例：用户家庭关系"有毒"（QKB2 选项 3），伴侣"零支持"（从 QKB1 推断）。family = "toxic" 因子 0.55，partner = "zero" 因子 0.70。加权混合 = 0.6 × 0.55 + 0.4 × 0.70 = 0.61。但两者同时处于灾难状态触发复合惩罚 × 0.65 = 0.397，四舍五入到 0.4。isLowResilience = true。这意味着此人从压力事件中恢复的速度是基线的 40%，未来任何涉及"恢复"的规则（心理健康、戒瘾复发等）都应该乘以这个比率。对比：家庭优秀 + 伴侣高支持 → 恢复率 1.0（完整基线）。',
        tw: '示例：使用者家庭關係「有毒」（QKB2 選項 3），伴侶「零支援」（從 QKB1 推斷）。family = "toxic" 因子 0.55，partner = "zero" 因子 0.70。加權混合 = 0.6 × 0.55 + 0.4 × 0.70 = 0.61。但兩者同時處於災難狀態觸發複合懲罰 × 0.65 = 0.397，四捨五入到 0.4。isLowResilience = true。這意味著此人從壓力事件中恢復的速度是基線的 40%，未來任何涉及「恢復」的規則（心理健康、戒癮復發等）都應該乘以這個比率。對比：家庭優秀 + 伴侶高支援 → 恢復率 1.0（完整基線）。',
      },
    },

    // ──────────────────────────────────────────────────────────
    //   FINAL SCORE MODIFIERS
    // ──────────────────────────────────────────────────────────
    {
      id: 'longevity_bonus',
      dimension: 'modifier',
      nameCn: '长寿奖励',
      nameTw: '長壽獎勵',
      description: {
        cn: '年龄超过 90 岁的用户获得 +20 分的复合分数加成。这不是某个维度的贡献，而是对长寿本身的元奖励，反映了达到这个年龄的综合生命成就。',
        tw: '年齡超過 90 歲的使用者獲得 +20 分的複合分數加成。這不是某個維度的貢獻，而是對長壽本身的元獎勵，反映了達到這個年齡的綜合生命成就。',
      },
      logic: {
        cn: '触发条件：ageRange 为 "86_100" 或 "over_100"。对复合分数加 20 分，不修改任何维度。',
        tw: '觸發條件：ageRange 為 "86_100" 或 "over_100"。對複合分數加 20 分，不修改任何維度。',
      },
      mechanics: {
        cn: '简单的条件加法。作为修正器（Modifier）而非规则（Rule）实现，因为它影响的是复合分数而非单个维度。',
        tw: '簡單的條件加法。作為修正器（Modifier）而非規則（Rule）實作，因為它影響的是複合分數而非單個維度。',
      },
      execution: {
        cn: '优先级 10 — 在维度聚合之后、在其他任何修正器之前运行。这确保长寿奖励基于原始的维度加权和，而不是被后续的乘法修正器（如疾病乘数）先行缩放。',
        tw: '優先級 10 — 在維度聚合之後、在其他任何修正器之前執行。這確保長壽獎勵基於原始的維度加權和，而不是被後續的乘法修正器（如疾病乘數）先行縮放。',
      },
      example: {
        cn: '示例：93 岁退休用户（QK1 = 8，对应 86-100 年龄段）。假设他的维度聚合后复合分数为 24。longevity_bonus 触发：composite = 24 + 20 = 44。如果他还同时是"行动受限"状态，illness_multiplier 会在长寿奖励之后应用：44 × 0.7 = 30.8 → 31。注意顺序的重要性：先加再乘，而不是先乘再加 —— 前者尊重他活到这个年龄的成就，后者会把奖励稀释掉。这就是为什么 longevity_bonus 的优先级（10）必须低于 illness_multiplier（100）。',
        tw: '示例：93 歲退休使用者（QK1 = 8，對應 86-100 年齡段）。假設他的維度聚合後複合分數為 24。longevity_bonus 觸發：composite = 24 + 20 = 44。如果他還同時是「行動受限」狀態，illness_multiplier 會在長壽獎勵之後套用：44 × 0.7 = 30.8 → 31。注意順序的重要性：先加再乘，而不是先乘再加 —— 前者尊重他活到這個年齡的成就，後者會把獎勵稀釋掉。這就是為什麼 longevity_bonus 的優先級（10）必須低於 illness_multiplier（100）。',
      },
    },

    {
      id: 'illness_multiplier',
      dimension: 'modifier',
      nameCn: '身份状态折扣',
      nameTw: '身份狀態折扣',
      description: {
        cn: '根据用户主要身份状态，对最终复合分数施加不同比例的折扣。重病/重大事故治疗中 → 20% 折扣（×0.80），行动受限 → 10% 折扣（×0.90），全职照护者 → 5% 折扣（×0.95）。',
        tw: '根據使用者主要身份狀態，對最終複合分數施加不同比例的折扣。重病/重大事故治療中 → 20% 折扣（×0.80），行動受限 → 10% 折扣（×0.90），全職照護者 → 5% 折扣（×0.95）。',
      },
      logic: {
        cn: '触发条件：primaryStatus 为 critically_ill（×0.80）、post_accident（×0.80）、restricted_mobility（×0.90）或 caregiver（×0.95）。操作：composite = composite × 对应系数。',
        tw: '觸發條件：primaryStatus 為 critically_ill（×0.80）、post_accident（×0.80）、restricted_mobility（×0.90）或 caregiver（×0.95）。操作：composite = composite × 對應係數。',
      },
      mechanics: {
        cn: '全局乘法修正器。不修改维度分数本身（以保留原始数据用于分析页面展示），只修改复合分数。',
        tw: '全域乘法修正器。不修改維度分數本身（以保留原始資料用於分析頁面展示），只修改複合分數。',
      },
      execution: {
        cn: '优先级 100 — 在几乎所有其他修正器之后运行。只有复合分数下限（优先级 1000）在它之后，以确保结果不会变成负数。',
        tw: '優先級 100 — 在幾乎所有其他修正器之後執行。只有複合分數下限（優先級 1000）在它之後，以確保結果不會變成負數。',
      },
      example: {
        cn: '示例：50 岁用户在 QK3 选择"重病"（选项 6）。假设他的维度聚合复合分数 = 100。isCriticallyIll = true 触发：composite = round(100 × 0.80) = 80。全职照护者则为 100 × 0.95 = 95。',
        tw: '示例：50 歲使用者在 QK3 選擇「重病」（選項 6）。假設他的維度聚合複合分數 = 100。isCriticallyIll = true 觸發：composite = round(100 × 0.80) = 80。全職照護者則為 100 × 0.95 = 95。',
      },
    },

    // ──────────────────────────────────────────────────────────
    //   MIND DIMENSION — Growth Multiplier
    // ──────────────────────────────────────────────────────────
    {
      id: 'mind_growth_multiplier',
      dimension: 'mind',
      nameCn: '成长乘数',
      nameTw: '成長乘數',
      description: {
        cn: '基于用户的两项认知元习惯——行为坚持力（QKD7）和信息筛选质量（QKD15）——计算一个 0.70 到 1.50 的乘数。该乘数将应用于技能习得和职业晋升相关的得分。核心洞察：天赋和机遇重要，但底层是两个元技能——坚持足够久让复利生效，以及筛选好的信息让复利方向正确。',
        tw: '基於使用者的兩項認知元習慣——行為堅持力（QKD7）和資訊篩選品質（QKD15）——計算一個 0.70 到 1.50 的乘數。該乘數將套用於技能習得和職業晉升相關的得分。核心洞察：天賦和機遇重要，但底層是兩個元技能——堅持足夠久讓複利生效，以及篩選好的資訊讓複利方向正確。',
      },
      logic: {
        cn: '输入：坚持力等级（4 级，来自 QKD7）+ 信息素养等级（7 级，来自 QKD15）。坚持力映射到 [0, 1]：钢铁自律 → 1.0，通常可以 → 0.7，依靠动力 → 0.3，快速放弃 → 0.0。信息素养映射到 [0, 1]：善于辨伪 → 1.0，多角度 → 0.85，谨慎逻辑 → 0.65，权威认证 → 0.45，眼见为实 → 0.20，非官方 → 0.10，从不关心 → 0.0。两个分数做 60/40 加权后线性映射到 [0.70, 1.50]。',
        tw: '輸入：堅持力等級（4 級，來自 QKD7）+ 資訊素養等級（7 級，來自 QKD15）。堅持力對應到 [0, 1]：鋼鐵自律 → 1.0，通常可以 → 0.7，依靠動力 → 0.3，快速放棄 → 0.0。資訊素養對應到 [0, 1]：善於辨偽 → 1.0，多角度 → 0.85，謹慎邏輯 → 0.65，權威認證 → 0.45，眼見為實 → 0.20，非官方 → 0.10，從不關心 → 0.0。兩個分數做 60/40 加權後線性對應到 [0.70, 1.50]。',
      },
      mechanics: {
        cn: '加权公式：composite = consistency × 0.60 + infoQuality × 0.40。坚持力权重更高（60%），因为持久力是更硬的约束——改善信息源相对容易，但建立自律是多年工程。最终乘数 = 0.70 + 0.80 × composite，其中 0.80 = 1.50 − 0.70。输出同时包含分级标签：exceptional（≥ 0.80）、strong（≥ 0.55）、moderate（≥ 0.30）、limited（< 0.30）。',
        tw: '加權公式：composite = consistency × 0.60 + infoQuality × 0.40。堅持力權重更高（60%），因為持久力是更硬的約束——改善資訊源相對容易，但建立自律是多年工程。最終乘數 = 0.70 + 0.80 × composite，其中 0.80 = 1.50 − 0.70。輸出同時包含分級標籤：exceptional（≥ 0.80）、strong（≥ 0.55）、moderate（≥ 0.30）、limited（< 0.30）。',
      },
      execution: {
        cn: '当 consistencyLevel 或 informationLiteracy 至少一个存在时触发。作为修正器运行（建议优先级 30），在 mind 维度聚合之后、illness_multiplier 之前应用。缺失的输入使用 0.5 中性值，确保只有一项数据时另一项不会拖向极端。两项都缺失时返回 1.0（中性，不影响分数）。',
        tw: '當 consistencyLevel 或 informationLiteracy 至少一個存在時觸發。作為修正器執行（建議優先級 30），在 mind 維度聚合之後、illness_multiplier 之前套用。缺失的輸入使用 0.5 中性值，確保只有一項資料時另一項不會拖向極端。兩項都缺失時回傳 1.0（中性，不影響分數）。',
      },
      example: {
        cn: '示例 1：钢铁自律 + 善于辨伪 → composite = 1.0 × 0.6 + 1.0 × 0.4 = 1.0 → 乘数 = 1.50（最高）。示例 2：快速放弃 + 眼见为实 → composite = 0.0 × 0.6 + 0.2 × 0.4 = 0.08 → 乘数 = 0.76（接近下限）。示例 3：通常可以 + 多角度接受 → composite = 0.7 × 0.6 + 0.85 × 0.4 = 0.76 → 乘数 = 1.31（强）。该乘数在 mind 维度聚合后应用，将所有基础 mind 规则的总和统一放大或缩小，因此钢铁自律配合高信息素养的用户能在该维度上获得显著的正向复利。',
        tw: '示例 1：鋼鐵自律 + 善於辨偽 → composite = 1.0 × 0.6 + 1.0 × 0.4 = 1.0 → 乘數 = 1.50（最高）。示例 2：快速放棄 + 眼見為實 → composite = 0.0 × 0.6 + 0.2 × 0.4 = 0.08 → 乘數 = 0.76（接近下限）。示例 3：通常可以 + 多角度接受 → composite = 0.7 × 0.6 + 0.85 × 0.4 = 0.76 → 乘數 = 1.31（強）。該乘數在 mind 維度聚合後套用，將所有基礎 mind 規則的總和統一放大或縮小，因此鋼鐵自律配合高資訊素養的使用者能在該維度上獲得顯著的正向複利。',
      },
    },

    // ──────────────────────────────────────────────────────────
    //   WEALTH — Business Score (Entrepreneur)
    // ──────────────────────────────────────────────────────────
    {
      id: 'wealth_business_score',
      dimension: 'wealth',
      nameCn: '创业者商业评分',
      nameTw: '創業者商業評分',
      description: {
        cn: '从现金流阶段、工作时长、客户粘性和创业通道四个维度综合评估创业者的商业健康度。副业尝试者有压缩权重，稳定盈利+超高粘性触发护城河乘数，亏损+超时工作触发倦怠惩罚。',
        tw: '從現金流階段、工作時長、客戶黏性和創業通道四個維度綜合評估創業者的商業健康度。副業嘗試者有壓縮權重，穩定盈利+超高黏性觸發護城河乘數，虧損+超時工作觸發倦怠懲罰。',
      },
      logic: {
        cn: '输入：cashFlowStage（5 类）、weeklyHours（4 类）、customerBase（5 类）、entrepreneurChannel（4 类）。各输入查表得分后加权合成 rawComposite = cashFlow + hours + customers，再乘以通道权重（认证企业家 1.0、创始人 0.85、个体经营 0.65、副业 0.45）。',
        tw: '輸入：cashFlowStage（5 類）、weeklyHours（4 類）、customerBase（5 類）、entrepreneurChannel（4 類）。各輸入查表得分後加權合成 rawComposite = cashFlow + hours + customers，再乘以通道權重（認證企業家 1.0、創始人 0.85、個體經營 0.65、副業 0.45）。',
      },
      mechanics: {
        cn: '护城河乘数：当 cashFlow = stable_profit 且 customerBase = ultra_sticky 时，得分 ×1.5。倦怠陷阱：当 cashFlow 为 losing_money 或 severe_debt 且 weeklyHours = over_80 时，得分 ×0.4 并设置 isBurnoutRisk = true（触发 Health 维度惩罚）。副业模式使用独立的小时计分表（上限 +2 而非 +4）。最终得分钳制在 [−10, +25]。',
        tw: '護城河乘數：當 cashFlow = stable_profit 且 customerBase = ultra_sticky 時，得分 ×1.5。倦怠陷阱：當 cashFlow 為 losing_money 或 severe_debt 且 weeklyHours = over_80 時，得分 ×0.4 並設置 isBurnoutRisk = true（觸發 Health 維度懲罰）。副業模式使用獨立的小時計分表（上限 +2 而非 +4）。最終得分鉗制在 [−10, +25]。',
      },
      execution: {
        cn: '当用户身份为 entrepreneur（QK3 = 2）且 QKAC1-QKAC4 均已回答时触发。作为 Batch 4 规则执行。倦怠标志会传递到 Health 维度产生额外 -5 惩罚。',
        tw: '當使用者身份為 entrepreneur（QK3 = 2）且 QKAC1-QKAC4 均已回答時觸發。作為 Batch 4 規則執行。倦怠標誌會傳遞到 Health 維度產生額外 -5 懲罰。',
      },
      example: {
        cn: '示例：稳定盈利 + 每周 <40h + 超高客户粘性 + 认证企业家。raw = 10 + 4 + 6 = 20，权重 ×1.0 = 20，护城河 ×1.5 = 30，钳制为 25。结果：wealth +25。反例：亏损 + 80h+ + 冷启动 + 创始人。raw = -2 + (-3) + 0 = -5，权重 ×0.85 = -4.25，倦怠 ×0.4 = -1.7，四舍五入 -2。结果：wealth -2，health 额外 -5。',
        tw: '示例：穩定盈利 + 每週 <40h + 超高客戶黏性 + 認證企業家。raw = 10 + 4 + 6 = 20，權重 ×1.0 = 20，護城河 ×1.5 = 30，鉗制為 25。結果：wealth +25。反例：虧損 + 80h+ + 冷啟動 + 創始人。raw = -2 + (-3) + 0 = -5，權重 ×0.85 = -4.25，倦怠 ×0.4 = -1.7，四捨五入 -2。結果：wealth -2，health 額外 -5。',
      },
    },

    // ──────────────────────────────────────────────────────────
    //   HEALTH — Vision Penalty (Non-linear)
    // ──────────────────────────────────────────────────────────
    {
      id: 'health_vision_penalty',
      dimension: 'health',
      nameCn: '视力非线性惩罚',
      nameTw: '視力非線性懲罰',
      description: {
        cn: '使用幂函数曲线替代线性惩罚，模拟轻度近视与严重视力损伤之间指数级增长的真实影响差距。每一级恶化的惩罚约是上一级的 2-3 倍。',
        tw: '使用冪函式曲線替代線性懲罰，模擬輕度近視與嚴重視力損傷之間指數級增長的真實影響差距。每一級惡化的懲罰約是上一級的 2-3 倍。',
      },
      logic: {
        cn: '输入：visionStatus（5 级严重度 0-4）。A = 视力完好（0），B = 轻度近视（1），C = 重度近视（2），D = 视力受损（3），E = 法定失明（4）。支持中文字符串前缀匹配、英文语义键和数字索引。',
        tw: '輸入：visionStatus（5 級嚴重度 0-4）。A = 視力完好（0），B = 輕度近視（1），C = 重度近視（2），D = 視力受損（3），E = 法定失明（4）。支持中文字串前綴匹配、英文語義鍵和數字索引。',
      },
      mechanics: {
        cn: '幂函数：penalty = base × x^γ，其中 base = 2.5，γ = 1.8。严重度 0 → 0，1 → -3，2 → -9，3 → -18，4 → -30。曲线加速度确保轻度近视只是轻微不便（-3），而法定失明是灾难性打击（-30）。未识别的非空字符串保守返回严重度 1（-3）。',
        tw: '冪函式：penalty = base × x^γ，其中 base = 2.5，γ = 1.8。嚴重度 0 → 0，1 → -3，2 → -9，3 → -18，4 → -30。曲線加速度確保輕度近視只是輕微不便（-3），而法定失明是災難性打擊（-30）。未識別的非空字串保守回傳嚴重度 1（-3）。',
      },
      execution: {
        cn: '当状态中存在 visionPenalty 或 QKC4 原始索引时触发。如果引擎派发器已设置 visionPenalty（通过 scoring-integration.js 的非线性值 [0, -3, -9, -18, -30]），直接使用。否则从原始索引通过内联幂公式计算。结果写入 _healthVision 字段。',
        tw: '當狀態中存在 visionPenalty 或 QKC4 原始索引時觸發。如果引擎派發器已設置 visionPenalty（透過 scoring-integration.js 的非線性值 [0, -3, -9, -18, -30]），直接使用。否則從原始索引透過內聯冪公式計算。結果寫入 _healthVision 欄位。',
      },
      example: {
        cn: '示例：用户选择"重度近视/散光，高度依赖眼镜，摘掉后严重模糊"（QKC4 选项 2）。严重度 x = 2，penalty = 2.5 × 2^1.8 = 2.5 × 3.48 ≈ 8.71，四舍五入 -9。结果：health 维度 -9 分。对比旧线性系统只会扣 -3 分。法定失明案例：x = 4，penalty = 2.5 × 4^1.8 ≈ 30.3，结果 -30 分。',
        tw: '示例：使用者選擇「重度近視/散光，高度依賴眼鏡，摘掉後嚴重模糊」（QKC4 選項 2）。嚴重度 x = 2，penalty = 2.5 × 2^1.8 = 2.5 × 3.48 ≈ 8.71，四捨五入 -9。結果：health 維度 -9 分。對比舊線性系統只會扣 -3 分。法定失明案例：x = 4，penalty = 2.5 × 4^1.8 ≈ 30.3，結果 -30 分。',
      },
    },

  ];

  window.LSScoringRegistry = {
    functions: SCORING_FUNCTIONS,
    /** Get a single function entry by id. */
    getById: function (id) {
      for (var i = 0; i < SCORING_FUNCTIONS.length; i++) {
        if (SCORING_FUNCTIONS[i].id === id) return SCORING_FUNCTIONS[i];
      }
      return null;
    },
    /** Get all functions that belong to a given dimension. */
    getByDimension: function (dimension) {
      return SCORING_FUNCTIONS.filter(function (f) { return f.dimension === dimension; });
    },
  };
})();
