/* ============================================================
   i18n.js — Four-locale translations
   Locales: zh-CN · zh-TW · en-US · es-US
   ============================================================ */
window.I18N = {
  'zh-CN': {
    langLabel: '🇺🇸 美国 · 简体中文',
    brandName: '人生评分',
    'nav.home': '首页', 'nav.analysis': '评分分析', 'nav.database': '数据库',
    'nav.more': '更多测试', 'nav.about': '关于我们',
    scoreUnit: '分', badge: '你的专属人生评分',
    'stat.free': '完全免费', 'stat.unlimited': '无限次使用',
    'hero.privacy': '我们承诺不泄露任何用户隐私，并全力做好隐私保护工作。',
    'hero.line1': '立刻开始测试', 'hero.line2': '你的人生评分',
    'hero.sub': '通过科学的维度分析，了解你在健康、财富、社会生活方向与个人价值方面的综合表现，获取专属提升建议。',
    'btn.start': '开始测试', 'btn.indepth': '深度测试', 'btn.viewResult': '查看我的结果',
    'btn.indepth.note': '想要更准确的结果？深度测试约需 15–20 分钟。',
    'btn.more': '了解更多',
    'stat.done': '已完成测试', 'stat.rating': '用户评分', 'stat.time': '完成时间',
    'tag.health': '健康', 'tag.wealth': '财富', 'tag.relation': '关系',
    'tag.achieve': '成就', 'tag.happy': '幸福',
    'feat1.title': '多维度分析', 'feat1.desc': '覆盖基础信息、社会生活方向与个人认同',
    'feat2.title': '智能跳题', 'feat2.desc': '根据你的情况自动调整问题',
    'feat3.title': '隐私保护', 'feat3.desc': '数据加密，匿名处理',
    'feat4.title': '个性化报告', 'feat4.desc': '专属改善建议与路径',
    'hero.score.label': '上次评分', 'hero.score.retake': '重新测试',
    'hero.score.none': '尚未测试',
    'footer.brand': '人生评分测试', 'footer.tagline': '了解自己，超越自己',
    'footer.col1': '产品', 'footer.l1a': '人生评分', 'footer.l1b': '评分分析', 'footer.l1c': '更多测试',
    'footer.col2': '资源', 'footer.l2a': '数据库', 'footer.l2b': '帮助中心', 'footer.l2c': '博客',
    'footer.col3': '公司', 'footer.l3a': '关于我们', 'footer.l3b': '联系我们', 'footer.l3c': '隐私政策',
    'footer.copy': '© 2025 人生评分测试. 保留所有权利。',
    'footer.terms': '服务条款', 'footer.privacy': '隐私政策', 'footer.cookie': 'Cookie 政策',
    'quiz.title': '人生评分测试',
    'quiz.progress': '已完成',
    'quiz.section.basic': '基础信息',
    'quiz.section.social': '社会与生活',
    'quiz.section.identity': '个人认同',
    'quiz.section.bonus': '卓越加分',
    'quiz.prev': '上一页', 'quiz.next': '下一页', 'quiz.submit': '查看结果',
    'quiz.skip': '跳过（不适用）',
    'quiz.note.gender': '性别不计入评分，仅用于个性化题目',
    'quiz.answered': '已作答',
    'quiz.keyboardHint': '选择后自动进入下一题 · 按方向键翻页',
    'quiz.pageComplete': '本页全部完成，继续下一页',
    'quiz.mode.short': '精简测试', 'quiz.mode.full': '深度测试',
    'result.title': '你的人生评分', 'result.subtitle': '评分报告',
    'result.total': '综合评分',
    'result.dim.basic': '基础维度', 'result.dim.social': '社会生活方向', 'result.dim.identity': '个人认同',
    'result.retake': '重新测试', 'result.share': '分享结果',
    'result.analysis': '维度解析', 'result.tip': '提升建议',
    'result.rank': '超越了', 'result.rankSuffix': '的用户',
    'result.saved': '你的评分已保存到首页',
    'result.low': '起步阶段', 'result.mid-low': '发展中',
    'result.mid': '稳健均衡', 'result.high': '优秀出色',
    'result.excellent': '卓越领先', 'result.exceptional': '卓越传奇',
    'result.viewAnalysis': '查看深度分析',
    'result.highlights': '亮点回顾', 'result.improve': '提升空间', 'result.nextSteps': '行动计划',
    'analysis.tag': '深度分析报告', 'analysis.title': '你的人生评分解读',
    'analysis.dimDeep': '维度深度解读', 'analysis.qBreakdown': '题目回顾与解析',
    'analysis.insights': '个性化洞察', 'analysis.filter.all': '全部',
    'analysis.cta.text': '定期重测，追踪自己的成长轨迹。',
    'analysis.noResult.title': '尚无测试结果',
    'analysis.noResult.desc': '完成人生评分测试后，你的专属深度分析报告将显示在这里。',
    'share.title': '分享你的结果',
    'share.copy': '复制文字', 'share.weibo': '微博', 'share.wechat': '微信朋友圈',
    'share.qzone': 'QQ空间', 'share.rednote': '小红书', 'share.douyin': '抖音',
    'share.kuaishou': '快手', 'share.save': '保存图片',
    'share.card.brand': 'LifeScore · 人生评分测试', 'share.card.tagline': '测测你的人生值多少分',
    'share.wechatTip': '请截图后分享到微信朋友圈',
    'sponsor.title': '喜欢我们的测试？你的支持让我们走得更远！',
    'sponsor.sub': '你的每一份赞助都将直接用于题库扩展、算法优化与服务器维护。感谢你！',
    'sponsor.qr.paypal': 'PayPal', 'sponsor.qr.crypto': 'USDT 加密',
    'sponsor.qr.wise': 'Wise 转账', 'sponsor.qr.bank': '银行转账',
    'sponsor.tap': '点击赞助',
    'sponsor.title2': '看完报告觉得有收获？请开发者喝杯咖啡',
    'sponsor.modal.sub': '扫码完成赞助，感谢你的支持！',
    'sponsor.modal.placeholder': '请将收款二维码图片放入 assets/ 文件夹',
    'sponsor.modal.hint': '金额随心，一杯奶茶的价格即可给我们很大鼓励 ☕',
    'moretests.title': '选择你的测试版本',
    'moretests.sub': '快速版帮你在8分钟内了解综合评分；深度版通过100+个问题给出更精准的多维分析。',
    'moretests.badge.quick': '⚡ 快速版', 'moretests.badge.deep': '🔬 深度版',
    'moretests.quick.title': '快速人生评分',
    'moretests.quick.desc': '约50道核心问题，覆盖健康、财富、人际关系与价值观，6-8分钟完成。',
    'moretests.quick.time': '约 6–8 分钟', 'moretests.quick.qcount': '约 50 题',
    'moretests.quick.feature': '核心维度覆盖', 'moretests.quick.cta': '开始快速测试',
    'moretests.deep.title': '深度人生评分',
    'moretests.deep.desc': '100+个问题，按身份智能展示个性化题目，涵盖亲密关系、职业成就等专项模块。',
    'moretests.deep.time': '约 15–25 分钟', 'moretests.deep.qcount': '70–105 题（因人而异）',
    'moretests.deep.feature': '含亲密关系、职业成就加分题',
    'moretests.deep.overwrite': '⚡ 深度测试结果将覆盖快速测试结果',
    'winner.banner': '🏆 恭喜你，你是真正的人生赢家！',
    'deepnotice.title': '好事值得等待', 'deepnotice.cta': '先体验快速测试 →', 'deepnotice.wait': '好的，我等着',
    'deepnotice.text': '深度测试正在进行重大升级——我们正在优化每一道题目并重新校准评分模型。在此期间，快速测试同样能为你提供准确、深入的评分结果。💛',
    'bonus.label': '卓越加分',
    'youth.tip': '🌱 给年轻的你\n\n你才刚刚开始。在美国这片土地上，你拥有的机会比任何一代人都多——关键在于你今天选择成为什么样的人。\n\n去探索，去尝试，去犯错，去成长。你的人生，才刚刚开幕。',
    'popup.title': '选择您的语言', 'popup.subtitle': '您可以随时在页面顶部更改语言',
    'lang.clearWarning': '切换语言将清除你之前的测试记录和结果。确定要继续吗？',
        'moretests.deep.cta': '开始深度测试', 'btn.more.tests': '更多测试',
  },
  'zh-TW': {
    langLabel: '🇺🇸 美國 · 繁體中文',
    brandName: '人生評分',
    'nav.home': '首頁', 'nav.analysis': '評分分析', 'nav.database': '數據庫',
    'nav.more': '更多測試', 'nav.about': '關於我們',
    scoreUnit: '分', badge: '你的專屬人生評分',
    'stat.free': '完全免費', 'stat.unlimited': '無限次使用',
    'hero.privacy': '我們承諾不洩露任何用戶隱私，並全力做好隱私保護工作。',
    'hero.line1': '立刻開始測試', 'hero.line2': '你的人生評分',
    'hero.sub': '透過科學的維度分析，了解你在健康、財富、社會生活方向與個人價值方面的綜合表現，獲取專屬提升建議。',
    'btn.start': '開始測試', 'btn.indepth': '深度測試', 'btn.viewResult': '查看我的結果',
    'btn.indepth.note': '想要更準確的結果？深度測試約需 15–20 分鐘。',
    'btn.more': '了解更多',
    'stat.done': '已完成測試', 'stat.rating': '用戶評分', 'stat.time': '完成時間',
    'tag.health': '健康', 'tag.wealth': '財富', 'tag.relation': '關係',
    'tag.achieve': '成就', 'tag.happy': '幸福',
    'feat1.title': '多維度分析', 'feat1.desc': '覆蓋基礎資訊、社會生活方向與個人認同',
    'feat2.title': '智能跳題', 'feat2.desc': '根據你的情況自動調整問題',
    'feat3.title': '隱私保護', 'feat3.desc': '數據加密，匿名處理',
    'feat4.title': '個性化報告', 'feat4.desc': '專屬改善建議與路徑',
    'hero.score.label': '上次評分', 'hero.score.retake': '重新測試',
    'hero.score.none': '尚未測試',
    'footer.brand': '人生評分測試', 'footer.tagline': '了解自己，超越自己',
    'footer.col1': '產品', 'footer.l1a': '人生評分', 'footer.l1b': '評分分析', 'footer.l1c': '更多測試',
    'footer.col2': '資源', 'footer.l2a': '數據庫', 'footer.l2b': '幫助中心', 'footer.l2c': '部落格',
    'footer.col3': '公司', 'footer.l3a': '關於我們', 'footer.l3b': '聯繫我們', 'footer.l3c': '隱私政策',
    'footer.copy': '© 2025 人生評分測試. 保留所有權利。',
    'footer.terms': '服務條款', 'footer.privacy': '隱私政策', 'footer.cookie': 'Cookie 政策',
    'quiz.title': '人生評分測試',
    'quiz.progress': '已完成',
    'quiz.section.basic': '基礎資訊', 'quiz.section.social': '社會與生活',
    'quiz.section.identity': '個人認同', 'quiz.section.bonus': '卓越加分',
    'quiz.prev': '上一頁', 'quiz.next': '下一頁', 'quiz.submit': '查看結果',
    'quiz.skip': '跳過（不適用）',
    'quiz.note.gender': '性別不計入評分，僅用於個性化題目',
    'quiz.answered': '已作答',
    'quiz.keyboardHint': '選擇後自動進入下一題 · 按方向鍵翻頁',
    'quiz.pageComplete': '本頁全部完成，繼續下一頁',
    'quiz.mode.short': '精簡測試', 'quiz.mode.full': '深度測試',
    'result.title': '你的人生評分', 'result.subtitle': '評分報告',
    'result.total': '綜合評分',
    'result.dim.basic': '基礎維度', 'result.dim.social': '社會生活方向', 'result.dim.identity': '個人認同',
    'result.retake': '重新測試', 'result.share': '分享結果',
    'result.analysis': '維度解析', 'result.tip': '提升建議',
    'result.rank': '超越了', 'result.rankSuffix': '的用戶',
    'result.saved': '你的評分已保存到首頁',
    'result.low': '起步階段', 'result.mid-low': '發展中',
    'result.mid': '穩健均衡', 'result.high': '優秀出色',
    'result.excellent': '卓越領先', 'result.exceptional': '卓越傳奇',
    'result.viewAnalysis': '查看深度分析',
    'result.highlights': '亮點回顧', 'result.improve': '提升空間', 'result.nextSteps': '行動計劃',
    'analysis.tag': '深度分析報告', 'analysis.title': '你的人生評分解讀',
    'analysis.dimDeep': '維度深度解讀', 'analysis.qBreakdown': '題目回顧與解析',
    'analysis.insights': '個性化洞察', 'analysis.filter.all': '全部',
    'analysis.cta.text': '定期重測，追蹤自己的成長軌跡。',
    'analysis.noResult.title': '尚無測試結果',
    'analysis.noResult.desc': '完成人生評分測試後，你的專屬深度分析報告將顯示在這裡。',
    'share.title': '分享你的結果',
    'share.copy': '複製文字', 'share.weibo': '微博', 'share.wechat': '微信朋友圈',
    'share.qzone': 'QQ空間', 'share.rednote': '小紅書', 'share.douyin': '抖音',
    'share.kuaishou': '快手', 'share.save': '保存圖片',
    'share.card.brand': 'LifeScore · 人生評分測試', 'share.card.tagline': '測測你的人生值多少分',
    'share.wechatTip': '請截圖後分享到微信朋友圈',
    'sponsor.title': '喜歡我們的測試？你的支持讓我們走得更遠！',
    'sponsor.sub': '你的每一份贊助都將直接用於題庫擴展、算法優化與服務器維護。感謝你！',
    'sponsor.qr.paypal': 'PayPal', 'sponsor.qr.crypto': 'USDT 加密',
    'sponsor.qr.wise': 'Wise 轉帳', 'sponsor.qr.bank': '銀行轉帳',
    'sponsor.tap': '點擊贊助',
    'sponsor.title2': '看完報告覺得有收穫？請開發者喝杯咖啡',
    'sponsor.modal.sub': '掃碼完成贊助，感謝你的支持！',
    'sponsor.modal.placeholder': '請將收款二維碼圖片放入 assets/ 資料夾',
    'sponsor.modal.hint': '金額隨心，一杯珍珠奶茶的價格即可給我們很大鼓勵 ☕',
    'moretests.title': '選擇你的測試版本',
    'moretests.sub': '快速版幫你在8分鐘內了解綜合評分；深度版通過100+個問題給出更精準的多維分析。',
    'moretests.badge.quick': '⚡ 快速版', 'moretests.badge.deep': '🔬 深度版',
    'moretests.quick.title': '快速人生評分',
    'moretests.quick.desc': '約50道核心問題，覆蓋健康、財富、人際關係與價值觀，6-8分鐘完成。',
    'moretests.quick.time': '約 6–8 分鐘', 'moretests.quick.qcount': '約 50 題',
    'moretests.quick.feature': '核心維度覆蓋', 'moretests.quick.cta': '開始快速測試',
    'moretests.deep.title': '深度人生評分',
    'moretests.deep.desc': '100+個問題，按身份智能展示個性化題目，涵蓋親密關係、職業成就等專項模組。',
    'moretests.deep.time': '約 15–25 分鐘', 'moretests.deep.qcount': '70–105 題（因人而異）',
    'moretests.deep.feature': '含親密關係、職業成就加分題',
    'moretests.deep.overwrite': '⚡ 深度測試結果將覆蓋快速測試結果',
    'winner.banner': '🏆 恭喜你，你是真正的人生贏家！',
    'deepnotice.title': '好事值得等待', 'deepnotice.cta': '先體驗快速測試 →', 'deepnotice.wait': '好的，我等著',
    'deepnotice.text': '深度測試正在進行重大升級——我們正在優化每一道題目並重新校準評分模型。在此期間，快速測試同樣能為你提供準確、深入的評分結果。💛',
    'bonus.label': '卓越加分',
    'youth.tip': '🌱 給年輕的你\n\n你才剛剛開始。在美國這片土地上，你擁有的機會比任何一代人都多——關鍵在於你今天選擇成為什麼樣的人。\n\n去探索，去嘗試，去犯錯，去成長。你的人生，才剛剛開幕。',
    'popup.title': '選擇您的語言', 'popup.subtitle': '您可以隨時在頁面頂部更改語言',
    'lang.clearWarning': '切換語言將清除你之前的測試記錄和結果。確定要繼續嗎？',
        'moretests.deep.cta': '開始深度測試', 'btn.more.tests': '更多測試',
  },
  'en-US': {
    langLabel: '🇺🇸 United States · English',
    brandName: 'LifeScore',
    'nav.home': 'Home', 'nav.analysis': 'Score Analysis', 'nav.database': 'Database',
    'nav.more': 'More Tests', 'nav.about': 'About',
    scoreUnit: 'pts', badge: 'Your Personal LifeScore',
    'stat.free': 'Completely Free', 'stat.unlimited': 'Unlimited Retakes',
    'hero.privacy': "We're committed to protecting your privacy. Your data is never sold or shared.",
    'hero.line1': 'Take the Test Now', 'hero.line2': 'Your LifeScore',
    'hero.sub': 'Use science-backed dimension analysis to understand your performance in health, wealth, relationships, and personal values — then get a customized action plan.',
    'btn.start': 'Start Test', 'btn.indepth': 'In-Depth Test', 'btn.viewResult': 'View My Results',
    'btn.indepth.note': 'Want a more precise result? The in-depth test takes 15–20 minutes.',
    'btn.more': 'Learn More',
    'stat.done': 'Tests Completed', 'stat.rating': 'User Rating', 'stat.time': 'Avg. Completion',
    'tag.health': 'Health', 'tag.wealth': 'Wealth', 'tag.relation': 'Relationships',
    'tag.achieve': 'Achievement', 'tag.happy': 'Happiness',
    'feat1.title': 'Multi-Dimension Analysis', 'feat1.desc': 'Covers background, social life, and personal identity',
    'feat2.title': 'Smart Question Routing', 'feat2.desc': 'Questions adapt automatically to your situation',
    'feat3.title': 'Privacy Protected', 'feat3.desc': 'Encrypted and fully anonymous',
    'feat4.title': 'Personalized Report', 'feat4.desc': 'Tailored improvement advice and roadmap',
    'hero.score.label': 'Last Score', 'hero.score.retake': 'Retake Test',
    'hero.score.none': 'Not tested yet',
    'footer.brand': 'LifeScore Test', 'footer.tagline': 'Know yourself. Grow yourself.',
    'footer.col1': 'Product', 'footer.l1a': 'LifeScore', 'footer.l1b': 'Score Analysis', 'footer.l1c': 'More Tests',
    'footer.col2': 'Resources', 'footer.l2a': 'Database', 'footer.l2b': 'Help Center', 'footer.l2c': 'Blog',
    'footer.col3': 'Company', 'footer.l3a': 'About Us', 'footer.l3b': 'Contact', 'footer.l3c': 'Privacy Policy',
    'footer.copy': '© 2025 LifeScore Test. All rights reserved.',
    'footer.terms': 'Terms of Service', 'footer.privacy': 'Privacy Policy', 'footer.cookie': 'Cookie Policy',
    'quiz.title': 'LifeScore Test',
    'quiz.progress': 'Completed',
    'quiz.section.basic': 'Background', 'quiz.section.social': 'Social & Life',
    'quiz.section.identity': 'Personal Identity', 'quiz.section.bonus': 'Elite Bonus',
    'quiz.prev': 'Previous', 'quiz.next': 'Next', 'quiz.submit': 'See My Results',
    'quiz.skip': 'Skip (not applicable)',
    'quiz.note.gender': 'Gender is not scored — used only to personalize questions',
    'quiz.answered': 'Answered',
    'quiz.keyboardHint': 'Selection auto-advances · Arrow keys to change pages',
    'quiz.pageComplete': 'Page complete — continue to the next',
    'quiz.mode.short': 'Quick Test', 'quiz.mode.full': 'In-Depth Test',
    'result.title': 'Your LifeScore', 'result.subtitle': 'Score Report',
    'result.total': 'Overall Score',
    'result.dim.basic': 'Baseline', 'result.dim.social': 'Social & Life', 'result.dim.identity': 'Personal Identity',
    'result.retake': 'Retake Test', 'result.share': 'Share Results',
    'result.analysis': 'Dimension Breakdown', 'result.tip': 'Improvement Tips',
    'result.rank': 'You scored higher than', 'result.rankSuffix': 'of users',
    'result.saved': 'Your score has been saved to the home page',
    'result.low': 'Just Getting Started', 'result.mid-low': 'Building Up',
    'result.mid': 'Steady & Balanced', 'result.high': 'Above Average',
    'result.excellent': 'Outstanding', 'result.exceptional': 'Legendary',
    'result.viewAnalysis': 'View Deep Analysis',
    'result.highlights': 'Your Highlights', 'result.improve': 'Room to Grow', 'result.nextSteps': 'Action Plan',
    'analysis.tag': 'Deep Analysis Report', 'analysis.title': 'Your LifeScore Decoded',
    'analysis.dimDeep': 'Dimension Deep Dive', 'analysis.qBreakdown': 'Question Review & Insights',
    'analysis.insights': 'Personalized Insights', 'analysis.filter.all': 'All',
    'analysis.cta.text': 'Retest regularly to track your personal growth.',
    'analysis.noResult.title': 'No Results Yet',
    'analysis.noResult.desc': 'Complete the LifeScore test and your personalized deep analysis report will appear here.',
    'share.title': 'Share Your Results',
    'share.copy': 'Copy Text', 'share.weibo': 'Weibo', 'share.wechat': 'WeChat',
    'share.qzone': 'QZone', 'share.rednote': 'RedNote', 'share.douyin': 'TikTok',
    'share.kuaishou': 'Kwai', 'share.save': 'Save Image',
    'share.card.brand': 'Life Score · LifeScore Test',
    'share.card.cta': 'Find out your LifeScore',
    'share.wechatTip': 'Take a screenshot to share on social media',
    'sponsor.title': 'Finding this useful? Help keep LifeScore free!',
    'sponsor.sub': 'Every contribution goes directly toward expanding the question bank, improving the algorithm, and keeping the servers running. Thank you!',
    'sponsor.qr.paypal': 'PayPal', 'sponsor.qr.crypto': 'USDT Crypto',
    'sponsor.qr.wise': 'Wise', 'sponsor.qr.bank': 'Bank Transfer',
    'sponsor.tap': 'Tap to Sponsor',
    'sponsor.title2': 'Got value from this report? Buy the developer a coffee ☕',
    'sponsor.modal.sub': 'Scan to donate — thank you for your support!',
    'sponsor.modal.placeholder': 'Place the QR image in the assets/ folder',
    'sponsor.modal.hint': 'Any amount helps — even the price of a coffee goes a long way ☕',
    'moretests.title': 'Choose Your Test',
    'moretests.sub': 'The Quick version gives you an overall score in 8 minutes; the In-Depth version uses 100+ questions for a more precise multi-dimensional analysis.',
    'moretests.badge.quick': '⚡ Quick', 'moretests.badge.deep': '🔬 In-Depth',
    'moretests.quick.title': 'Quick LifeScore',
    'moretests.quick.desc': 'About 50 core questions covering health, wealth, relationships, and values — done in 6–8 minutes.',
    'moretests.quick.time': '~6–8 minutes', 'moretests.quick.qcount': '~50 questions',
    'moretests.quick.feature': 'Core dimension coverage', 'moretests.quick.cta': 'Start Quick Test',
    'moretests.deep.title': 'In-Depth LifeScore',
    'moretests.deep.desc': '100+ questions with smart branching — covers relationships, career achievement, and personal identity.',
    'moretests.deep.time': '~15–25 minutes', 'moretests.deep.qcount': '70–105 questions (varies)',
    'moretests.deep.feature': 'Includes relationship & career bonus questions',
    'moretests.deep.overwrite': '⚡ In-Depth results will replace Quick Test results',
    'winner.banner': '🏆 Congratulations — you are a true LifeScore champion!',
    'deepnotice.title': 'Worth the Wait', 'deepnotice.cta': 'Try the Quick Test first →', 'deepnotice.wait': "Got it, I'll wait",
    'deepnotice.text': "The In-Depth Test is undergoing a major upgrade — we're refining every question and recalibrating the scoring model. The Quick Test will give you an accurate, insightful score in the meantime. 💛",
    'bonus.label': 'Elite Bonus',
    'youth.tip': "🌱 To the younger you\n\nYou're just getting started. In America, you have more opportunity than almost any generation before — what matters is who you choose to become today.\n\nGo explore, try things, make mistakes, and grow. Your story is just beginning.",
    'popup.title': 'Choose Your Language', 'popup.subtitle': 'You can change your language at any time from the top of the page',
    'lang.clearWarning': 'Changing the language will clear your previous test answers and results. Are you sure you want to continue?',
        'moretests.deep.cta': 'Start In-Depth Test', 'btn.more.tests': 'More Tests',
  },
  'en-PH': {
    langLabel: '🇵🇭 Pilipinas · English',
    brandName: 'LifeScore',
    'nav.home': 'Home', 'nav.analysis': 'Score Analysis', 'nav.database': 'Database',
    'nav.more': 'More Tests', 'nav.about': 'About',
    scoreUnit: 'pts', badge: 'Your Personal LifeScore',
    'stat.free': 'Completely Free', 'stat.unlimited': 'Unlimited Retakes',
    'hero.privacy': "We're committed to protecting your privacy. Your data is never sold or shared.",
    'hero.line1': 'Take the Test Now', 'hero.line2': 'Your LifeScore',
    'hero.sub': "Get a science-backed picture of where you stand in health, finances, relationships, and personal values — then receive a customized action plan built for life in the Philippines.",
    'btn.start': 'Start Test', 'btn.indepth': 'In-Depth Test', 'btn.viewResult': 'View My Results',
    'btn.indepth.note': 'Want a more detailed result? The in-depth test takes 15–20 minutes.',
    'btn.more': 'Learn More',
    'stat.done': 'Tests Completed', 'stat.rating': 'User Rating', 'stat.time': 'Avg. Completion',
    'tag.health': 'Health', 'tag.wealth': 'Wealth', 'tag.relation': 'Relationships',
    'tag.achieve': 'Achievement', 'tag.happy': 'Happiness',
    'feat1.title': 'Multi-Dimension Analysis', 'feat1.desc': 'Covers background, social life, and personal identity',
    'feat2.title': 'Smart Question Routing', 'feat2.desc': 'Questions adapt automatically to your situation',
    'feat3.title': 'Privacy Protected', 'feat3.desc': 'Encrypted and fully anonymous',
    'feat4.title': 'Personalised Report', 'feat4.desc': 'Tailored advice and a clear improvement roadmap',
    'hero.score.label': 'Last Score', 'hero.score.retake': 'Retake Test',
    'hero.score.none': 'Not tested yet',
    'footer.brand': 'LifeScore PH', 'footer.tagline': 'Know yourself. Grow yourself.',
    'footer.col1': 'Product', 'footer.l1a': 'LifeScore', 'footer.l1b': 'Score Analysis', 'footer.l1c': 'More Tests',
    'footer.col2': 'Resources', 'footer.l2a': 'Database', 'footer.l2b': 'Help Center', 'footer.l2c': 'Blog',
    'footer.col3': 'Company', 'footer.l3a': 'About Us', 'footer.l3b': 'Contact', 'footer.l3c': 'Privacy Policy',
    'footer.copy': '© 2025 LifeScore PH. All rights reserved.',
    'footer.terms': 'Terms of Service', 'footer.privacy': 'Privacy Policy', 'footer.cookie': 'Cookie Policy',
    'quiz.title': 'LifeScore PH',
    'quiz.progress': 'Completed',
    'quiz.section.basic': 'Background', 'quiz.section.social': 'Social & Life',
    'quiz.section.identity': 'Personal Identity', 'quiz.section.bonus': 'Elite Bonus',
    'quiz.prev': 'Previous', 'quiz.next': 'Next', 'quiz.submit': 'See My Results',
    'quiz.skip': 'Skip (not applicable)',
    'quiz.note.gender': 'Gender is not scored — used only to personalise questions',
    'quiz.answered': 'Answered',
    'quiz.keyboardHint': 'Selection auto-advances · Arrow keys to change pages',
    'quiz.pageComplete': 'Page complete — continue to the next',
    'quiz.mode.short': 'Quick Test', 'quiz.mode.full': 'In-Depth Test',
    'result.title': 'Your LifeScore', 'result.subtitle': 'Score Report',
    'result.total': 'Overall Score',
    'result.dim.basic': 'Baseline', 'result.dim.social': 'Social & Life', 'result.dim.identity': 'Personal Identity',
    'result.retake': 'Retake Test', 'result.share': 'Share Results',
    'result.analysis': 'Dimension Breakdown', 'result.tip': 'Improvement Tips',
    'result.rank': 'You scored higher than', 'result.rankSuffix': 'of users',
    'result.saved': 'Your score has been saved to the home page',
    'result.low': 'Just Getting Started', 'result.mid-low': 'Building Up',
    'result.mid': 'Steady & Balanced', 'result.high': 'Above Average',
    'result.excellent': 'Outstanding', 'result.exceptional': 'Legendary',
    'result.viewAnalysis': 'View Deep Analysis',
    'result.highlights': 'Your Highlights', 'result.improve': 'Room to Grow', 'result.nextSteps': 'Action Plan',
    'analysis.tag': 'Deep Analysis Report', 'analysis.title': 'Your LifeScore Decoded',
    'analysis.dimDeep': 'Dimension Deep Dive', 'analysis.qBreakdown': 'Question Review & Insights',
    'analysis.insights': 'Personalised Insights', 'analysis.filter.all': 'All',
    'analysis.cta.text': 'Retest regularly to track your personal growth.',
    'analysis.noResult.title': 'No Results Yet',
    'analysis.noResult.desc': 'Complete the LifeScore test and your personalised deep analysis report will appear here.',
    'share.title': 'Share Your Results',
    'share.copy': 'Copy Text', 'share.weibo': 'Weibo', 'share.wechat': 'WeChat',
    'share.qzone': 'QZone', 'share.rednote': 'RedNote', 'share.douyin': 'TikTok',
    'share.kuaishou': 'Kwai', 'share.save': 'Save Image',
    'share.card.brand': 'Life Score · LifeScore PH',
    'share.card.cta': 'Find out your LifeScore',
    'share.wechatTip': 'Take a screenshot to share on social media',
    'sponsor.title': 'Finding this useful? Help keep LifeScore free!',
    'sponsor.sub': 'Every contribution goes directly toward expanding the question bank, improving the algorithm, and keeping the servers running. Salamat!',
    'sponsor.qr.paypal': 'PayPal', 'sponsor.qr.crypto': 'USDT Crypto',
    'sponsor.qr.wise': 'Wise', 'sponsor.qr.bank': 'Bank Transfer',
    'sponsor.tap': 'Tap to Sponsor',
    'sponsor.title2': 'Got value from this report? Buy the developer a coffee ☕',
    'sponsor.modal.sub': 'Scan to donate — thank you for your support!',
    'sponsor.modal.placeholder': 'Place the QR image in the assets/ folder',
    'sponsor.modal.hint': 'Any amount helps — even the price of a milk tea goes a long way ☕',
    'moretests.title': 'Choose Your Test',
    'moretests.sub': 'The Quick version gives you an overall score in 8 minutes; the In-Depth version uses 100+ questions for a more precise multi-dimensional analysis.',
    'moretests.badge.quick': '⚡ Quick', 'moretests.badge.deep': '🔬 In-Depth',
    'moretests.quick.title': 'Quick LifeScore PH',
    'moretests.quick.desc': 'About 50 core questions covering health, finances, relationships, and values — done in 6–8 minutes. Questions are tailored to Philippine life.',
    'moretests.quick.time': '~6–8 minutes', 'moretests.quick.qcount': '~50 questions',
    'moretests.quick.feature': 'Localised for the Philippines', 'moretests.quick.cta': 'Start Quick Test',
    'moretests.deep.title': 'In-Depth LifeScore',
    'moretests.deep.desc': '100+ questions with smart branching — covers relationships, career achievement, and personal identity.',
    'moretests.deep.time': '~15–25 minutes', 'moretests.deep.qcount': '70–105 questions (varies)',
    'moretests.deep.feature': 'Includes relationship & career bonus questions',
    'moretests.deep.overwrite': '⚡ In-Depth results will replace Quick Test results',
    'winner.banner': '🏆 Congratulations — you are a true LifeScore champion! 🇵🇭',
    'deepnotice.title': 'Worth the Wait', 'deepnotice.cta': 'Try the Quick Test first →', 'deepnotice.wait': "Got it, I'll wait",
    'deepnotice.text': "The In-Depth Test is getting a major upgrade — every question is being refined and the scoring model recalibrated. The Quick Test will give you an accurate, insightful score in the meantime. 💛",
    'bonus.label': 'Elite Bonus',
    'youth.tip': "🌱 To the younger you\n\nYou're just getting started — and you're doing it in one of the most resilient, tight-knit cultures in the world. The Philippines will challenge you with real obstacles: traffic, cost of living, limited capital, family obligations. But it will also give you something most countries can't — a community that shows up for you.\n\nBuild your skills. Honor your family. And carve out a future that's also yours.",
    'popup.title': 'Choose Your Language', 'popup.subtitle': 'You can change your language at any time from the top of the page',
    'lang.clearWarning': 'Changing the language will clear your previous test answers and results. Are you sure you want to continue?',
    'moretests.deep.cta': 'Start In-Depth Test', 'btn.more.tests': 'More Tests',
  },
  'es-US': {
    langLabel: '🇺🇸 Estados Unidos · Español',
    brandName: 'LifeScore',
    'nav.home': 'Inicio', 'nav.analysis': 'Análisis', 'nav.database': 'Base de datos',
    'nav.more': 'Más pruebas', 'nav.about': 'Acerca de',
    scoreUnit: 'pts', badge: 'Tu LifeScore personal',
    'stat.free': 'Completamente gratis', 'stat.unlimited': 'Usos ilimitados',
    'hero.privacy': 'Nos comprometemos a proteger tu privacidad. Tus datos nunca se venden ni comparten.',
    'hero.line1': 'Haz la prueba ahora', 'hero.line2': 'Tu LifeScore',
    'hero.sub': 'Analiza tu rendimiento en salud, finanzas, relaciones y valores personales usando un sistema basado en evidencia — y obtén un plan de acción personalizado.',
    'btn.start': 'Comenzar prueba', 'btn.indepth': 'Prueba profunda', 'btn.viewResult': 'Ver mis resultados',
    'btn.indepth.note': '¿Quieres un resultado más preciso? La prueba profunda toma 15–20 minutos.',
    'btn.more': 'Más información',
    'stat.done': 'Pruebas completadas', 'stat.rating': 'Valoración', 'stat.time': 'Tiempo promedio',
    'tag.health': 'Salud', 'tag.wealth': 'Finanzas', 'tag.relation': 'Relaciones',
    'tag.achieve': 'Logros', 'tag.happy': 'Felicidad',
    'feat1.title': 'Análisis multidimensional', 'feat1.desc': 'Cubre información básica, vida social e identidad personal',
    'feat2.title': 'Preguntas inteligentes', 'feat2.desc': 'Se adaptan automáticamente a tu situación',
    'feat3.title': 'Privacidad protegida', 'feat3.desc': 'Encriptado y completamente anónimo',
    'feat4.title': 'Informe personalizado', 'feat4.desc': 'Consejos y hoja de ruta personalizados',
    'hero.score.label': 'Último puntaje', 'hero.score.retake': 'Repetir prueba',
    'hero.score.none': 'Sin prueba aún',
    'footer.brand': 'Prueba LifeScore', 'footer.tagline': 'Conócete. Supérate.',
    'footer.col1': 'Producto', 'footer.l1a': 'LifeScore', 'footer.l1b': 'Análisis', 'footer.l1c': 'Más pruebas',
    'footer.col2': 'Recursos', 'footer.l2a': 'Base de datos', 'footer.l2b': 'Centro de ayuda', 'footer.l2c': 'Blog',
    'footer.col3': 'Empresa', 'footer.l3a': 'Acerca de', 'footer.l3b': 'Contacto', 'footer.l3c': 'Privacidad',
    'footer.copy': '© 2025 LifeScore Test. Todos los derechos reservados.',
    'footer.terms': 'Términos de servicio', 'footer.privacy': 'Política de privacidad', 'footer.cookie': 'Cookies',
    'quiz.title': 'Prueba LifeScore',
    'quiz.progress': 'Completado',
    'quiz.section.basic': 'Información básica', 'quiz.section.social': 'Social y vida',
    'quiz.section.identity': 'Identidad personal', 'quiz.section.bonus': 'Puntos élite',
    'quiz.prev': 'Anterior', 'quiz.next': 'Siguiente', 'quiz.submit': 'Ver mis resultados',
    'quiz.skip': 'Omitir (no aplica)',
    'quiz.note.gender': 'El género no se puntúa — solo sirve para personalizar preguntas',
    'quiz.answered': 'Respondida',
    'quiz.keyboardHint': 'La selección avanza automáticamente · Flechas para navegar páginas',
    'quiz.pageComplete': 'Página completa — continúa a la siguiente',
    'quiz.mode.short': 'Prueba rápida', 'quiz.mode.full': 'Prueba profunda',
    'result.title': 'Tu LifeScore', 'result.subtitle': 'Reporte de resultados',
    'result.total': 'Puntaje general',
    'result.dim.basic': 'Base', 'result.dim.social': 'Social y vida', 'result.dim.identity': 'Identidad personal',
    'result.retake': 'Repetir prueba', 'result.share': 'Compartir resultados',
    'result.analysis': 'Desglose por dimensión', 'result.tip': 'Consejos para mejorar',
    'result.rank': 'Superaste al', 'result.rankSuffix': 'de los usuarios',
    'result.saved': 'Tu puntaje fue guardado en la página de inicio',
    'result.low': 'Apenas comenzando', 'result.mid-low': 'En desarrollo',
    'result.mid': 'Estable y equilibrado', 'result.high': 'Por encima del promedio',
    'result.excellent': 'Sobresaliente', 'result.exceptional': 'Legendario',
    'result.viewAnalysis': 'Ver análisis profundo',
    'result.highlights': 'Tus fortalezas', 'result.improve': 'Áreas de mejora', 'result.nextSteps': 'Plan de acción',
    'analysis.tag': 'Reporte de análisis profundo', 'analysis.title': 'Tu LifeScore analizado',
    'analysis.dimDeep': 'Análisis profundo por dimensión', 'analysis.qBreakdown': 'Revisión de respuestas',
    'analysis.insights': 'Perspectivas personalizadas', 'analysis.filter.all': 'Todas',
    'analysis.cta.text': 'Repite la prueba regularmente para seguir tu crecimiento.',
    'analysis.noResult.title': 'Aún no hay resultados',
    'analysis.noResult.desc': 'Completa la prueba LifeScore y tu reporte de análisis personalizado aparecerá aquí.',
    'share.title': 'Comparte tus resultados',
    'share.copy': 'Copiar texto', 'share.weibo': 'Weibo', 'share.wechat': 'WeChat',
    'share.qzone': 'QZone', 'share.rednote': 'RedNote', 'share.douyin': 'TikTok',
    'share.kuaishou': 'Kwai', 'share.save': 'Guardar imagen',
    'share.card.brand': 'Life Score · Prueba LifeScore',
    'share.card.cta': 'Descubre tu LifeScore',
    'share.wechatTip': 'Toma una captura de pantalla para compartir en redes sociales',
    'sponsor.title': '¿Te fue útil? ¡Ayúdanos a mantener LifeScore gratuito!',
    'sponsor.sub': 'Cada contribución se destina a ampliar el banco de preguntas, mejorar el algoritmo y mantener los servidores.',
    'sponsor.qr.paypal': 'PayPal', 'sponsor.qr.crypto': 'USDT Cripto',
    'sponsor.qr.wise': 'Wise', 'sponsor.qr.bank': 'Transferencia Bancaria',
    'sponsor.tap': 'Toca para donar',
    'sponsor.title2': '¿Este reporte te fue útil? Invítale un café al desarrollador ☕',
    'sponsor.modal.sub': 'Escanea el código QR para donar — ¡gracias por tu apoyo!',
    'sponsor.modal.placeholder': 'Coloca la imagen QR en la carpeta assets/',
    'sponsor.modal.hint': 'Cualquier cantidad ayuda — hasta el precio de un café marca la diferencia ☕',
    'moretests.title': 'Elige tu prueba',
    'moretests.sub': 'La versión rápida te da un puntaje general en 8 minutos; la versión profunda usa 100+ preguntas para un análisis más preciso.',
    'moretests.badge.quick': '⚡ Rápida', 'moretests.badge.deep': '🔬 Profunda',
    'moretests.quick.title': 'LifeScore Rápido',
    'moretests.quick.desc': 'Unas 50 preguntas esenciales sobre salud, finanzas, relaciones y valores — listo en 6–8 minutos.',
    'moretests.quick.time': '~6–8 minutos', 'moretests.quick.qcount': '~50 preguntas',
    'moretests.quick.feature': 'Cobertura de dimensiones clave', 'moretests.quick.cta': 'Comenzar prueba rápida',
    'moretests.deep.title': 'LifeScore Profundo',
    'moretests.deep.desc': '100+ preguntas con ramificación inteligente — incluye relaciones, logros profesionales e identidad.',
    'moretests.deep.time': '~15–25 minutos', 'moretests.deep.qcount': '70–105 preguntas (varía)',
    'moretests.deep.feature': 'Incluye preguntas de relaciones y carrera profesional',
    'moretests.deep.overwrite': '⚡ Los resultados de la prueba profunda reemplazarán los de la prueba rápida',
    'winner.banner': '🏆 ¡Felicitaciones — eres un verdadero campeón de LifeScore!',
    'deepnotice.title': 'Vale la pena esperar', 'deepnotice.cta': 'Probar la prueba rápida →', 'deepnotice.wait': 'Entendido, esperaré',
    'deepnotice.text': 'La prueba profunda está siendo actualizada — estamos refinando cada pregunta y recalibrando el modelo de puntuación. Mientras tanto, la prueba rápida te dará un resultado preciso e informativo. 💛',
    'bonus.label': 'Puntos Élite',
    'youth.tip': '🌱 Para el tú más joven\n\nRecién estás comenzando. En Estados Unidos tienes más oportunidades que casi cualquier generación anterior — lo que importa es en quién eliges convertirte hoy.\n\nSal a explorar, intenta cosas, comete errores y crece. Tu historia recién comienza.',
    'popup.title': 'Elige tu idioma', 'popup.subtitle': 'Puedes cambiar el idioma en cualquier momento desde la parte superior de la página',
    'lang.clearWarning': 'Cambiar el idioma eliminará tus respuestas y resultados anteriores. ¿Estás seguro de que deseas continuar?',
        'moretests.deep.cta': 'Comenzar prueba profunda', 'btn.more.tests': 'Más pruebas',
  },
};

window._LS_POPUP_SHOW = !localStorage.getItem('ls_lang');
window.I18N_CURRENT = localStorage.getItem('ls_lang') || 'zh-CN';

window.t = function(key) {
  var loc = window.I18N[window.I18N_CURRENT] || window.I18N['zh-CN'];
  return loc[key] || window.I18N['zh-CN'][key] || key;
};

/* qlang(obj) — picks the right localized string from a question/option object.
   Field priority:
     en-US → obj.en   (the existing 'en' field, already US-localized)
     es-US → obj.es   (new Spanish field added to quick_questions.js)
     zh-TW → obj.tw
     zh-CN → obj.cn   (default) */
window.qlang = function(obj) {
  if (!obj) return '';
  var l = window.I18N_CURRENT || 'zh-CN';
  if (l === 'en-US') return obj.en  || obj.cn || '';
  if (l === 'en-PH') return obj.ph  || obj.en || obj.cn || '';
  if (l === 'es-US') return obj.es  || obj.en || obj.cn || '';
  if (l === 'zh-TW') return obj.tw  || obj.cn || '';
  return obj.cn || '';
};

/* qlangFn(q, fnBase) — for questions that have dynamic text functions (cnFn / twFn).
   fnBase is e.g. '' to produce the question text. */
window.qlangFn = function(q, answers) {
  var l = window.I18N_CURRENT || 'zh-CN';
  if (l === 'en-US') {
    if (typeof q.enFn === 'function') return q.enFn(answers);
    return q.en || q.cn || '';
  }
  if (l === 'en-PH') {
    if (typeof q.phFn === 'function') return q.phFn(answers);
    return q.ph || q.en || q.cn || '';
  }
  if (l === 'es-US') {
    if (typeof q.esFn === 'function') return q.esFn(answers);
    return q.es || q.en || q.cn || '';
  }
  if (l === 'zh-TW') {
    if (typeof q.twFn === 'function') return q.twFn(answers);
    return q.tw || q.cn || '';
  }
  if (typeof q.cnFn === 'function') return q.cnFn(answers);
  return q.cn || '';
};

window.applyI18n = function(lang) {
  if (lang) window.I18N_CURRENT = lang;
  localStorage.setItem('ls_lang', window.I18N_CURRENT);
  document.documentElement.lang = window.I18N_CURRENT;
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var val = window.t(el.getAttribute('data-i18n'));
    if (val) el.textContent = val;
  });
  // Update lang label with JS-rendered flag
  var ll = document.getElementById('langLabel');
  if (ll) {
    var loc = window.LS_LOCALES.find(function(l) { return l.lang === window.I18N_CURRENT; });
    if (loc) {
      ll.innerHTML = window.renderFlag(loc.code) + ' ' + loc.country + ' · ' + loc.label;
    }
  }
  // Update dropdown options with JS flags
  window.updateLangDropdownFlags();
  document.querySelectorAll('.lang-option').forEach(function(o) {
    o.classList.toggle('active', o.dataset.lang === window.I18N_CURRENT);
  });
};

document.addEventListener('DOMContentLoaded', function() { window.applyI18n(); });

/* ══════════════════════════════════════════════════════════
   JS-BASED FLAG EMOJI RENDERING
   Uses SVG fallback for browsers that don't support flag emojis
══════════════════════════════════════════════════════════ */
(function() {
  // Test if browser supports flag emojis
  function supportsFlags() {
    var canvas = document.createElement('canvas');
    if (!canvas.getContext) return false;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'top';
    ctx.font = '32px Arial';
    ctx.fillText('🇺🇸', 0, 0);
    // Check if emoji rendered (non-blank)
    var data = ctx.getImageData(16, 16, 1, 1).data;
    return data[3] > 0;
  }

  var USE_SVG_FLAGS = !supportsFlags();

  // SVG flag for USA (simple fallback)
  var FLAG_SVG = {
    US: '<svg viewBox="0 0 60 40" width="24" height="16" style="vertical-align:middle;margin-right:4px;border-radius:2px;box-shadow:0 1px 2px rgba(0,0,0,0.1)"><rect width="60" height="40" fill="#fff"/><g fill="#bf0a30"><rect y="0" width="60" height="3.08"/><rect y="6.15" width="60" height="3.08"/><rect y="12.31" width="60" height="3.08"/><rect y="18.46" width="60" height="3.08"/><rect y="24.62" width="60" height="3.08"/><rect y="30.77" width="60" height="3.08"/><rect y="36.92" width="60" height="3.08"/></g><rect width="24" height="21.54" fill="#002868"/><g fill="#fff" font-size="3" font-family="Arial"><text x="2" y="4">★★★★★★</text><text x="4" y="7">★★★★★</text><text x="2" y="10">★★★★★★</text><text x="4" y="13">★★★★★</text><text x="2" y="16">★★★★★★</text><text x="4" y="19">★★★★★</text></g></svg>',
    PH: '<svg viewBox="0 0 60 30" width="24" height="12" style="vertical-align:middle;margin-right:4px;border-radius:2px;box-shadow:0 1px 2px rgba(0,0,0,0.1)"><rect width="60" height="15" fill="#0038A8"/><rect y="15" width="60" height="15" fill="#CE1126"/><polygon points="0,0 30,15 0,30" fill="#fff"/><circle cx="11" cy="15" r="3.5" fill="#FCD116"/><g fill="#FCD116"><polygon points="11,3 11.7,5.2 14,5.2 12.2,6.5 12.8,8.8 11,7.5 9.2,8.8 9.8,6.5 8,5.2 10.3,5.2"/><polygon points="11,27 11.7,24.8 14,24.8 12.2,23.5 12.8,21.2 11,22.5 9.2,21.2 9.8,23.5 8,24.8 10.3,24.8"/><polygon points="2,15 4.2,14.3 4.2,12 5.5,13.8 7.8,13.2 6.5,15 7.8,16.8 5.5,16.2 4.2,18 4.2,15.7"/></g></svg>'
  };

  // Render flag - returns HTML string
  window.renderFlag = function(code) {
    if (USE_SVG_FLAGS) {
      return FLAG_SVG[code] || '<span style="display:inline-block;width:24px;height:16px;background:#e2e8f0;border-radius:2px;vertical-align:middle;margin-right:4px"></span>';
    }
    // Use emoji with proper styling
    var emojiMap = { US: '🇺🇸', PH: '🇵🇭' };
    var emoji = emojiMap[code] || '🌐';
    return '<span style="font-size:20px;line-height:1;vertical-align:middle;margin-right:4px;font-family:\'Apple Color Emoji\',\'Segoe UI Emoji\',\'Noto Color Emoji\',\'Twemoji Mozilla\',sans-serif">' + emoji + '</span>';
  };

  // Locale data — order: USA English, USA Spanish, USA Simplified Chinese, USA Traditional Chinese, Philippines English
  window.LS_LOCALES = [
    { lang: 'en-US', code: 'US', country: 'USA',         label: 'English' },
    { lang: 'es-US', code: 'US', country: 'USA',         label: 'Español' },
    { lang: 'zh-CN', code: 'US', country: 'USA',         label: 'Simplified Chinese' },
    { lang: 'zh-TW', code: 'US', country: 'USA',         label: 'Traditional Chinese' },
    { lang: 'en-PH', code: 'PH', country: 'Philippines', label: 'English' },
  ];

  // Update lang dropdown options with JS-rendered flags
  window.updateLangDropdownFlags = function() {
    document.querySelectorAll('.lang-option').forEach(function(opt) {
      var langCode = opt.dataset.lang;
      var loc = window.LS_LOCALES.find(function(l) { return l.lang === langCode; });
      if (loc) {
        opt.innerHTML = window.renderFlag(loc.code) + ' ' + loc.country + ' · ' + loc.label;
      }
    });
  };
})();

/* ══════════════════════════════════════════════════════════
   COUNTRY / LANGUAGE SELECTION POPUP
   Shows automatically on first visit (no ls_lang in localStorage).
   Uses JS-rendered flag emojis for cross-browser compatibility.
══════════════════════════════════════════════════════════ */
(function() {
  function injectPopupStyles() {
    if (document.getElementById('ls-popup-styles')) return;
    var style = document.createElement('style');
    style.id = 'ls-popup-styles';
    style.textContent = [
      '.ls-popup-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;animation:lsFadeIn .25s ease}',
      '.ls-popup-overlay.ls-hidden{display:none}',
      '@keyframes lsFadeIn{from{opacity:0}to{opacity:1}}',
      '.ls-popup-box{background:#fff;border-radius:20px;padding:36px 32px 28px;max-width:420px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.18);animation:lsSlideUp .3s cubic-bezier(.34,1.56,.64,1)}',
      '@keyframes lsSlideUp{from{transform:translateY(28px);opacity:0}to{transform:translateY(0);opacity:1}}',
      '.ls-popup-logo{display:flex;align-items:center;gap:8px;margin-bottom:20px}',
      '.ls-popup-logo-mark{width:32px;height:32px;background:linear-gradient(135deg,#38bdf8,#0284c7);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;flex-shrink:0}',
      '.ls-popup-title{font-size:20px;font-weight:700;color:#0f172a;margin:0 0 4px}',
      '.ls-popup-sub{font-size:13px;color:#64748b;margin:0 0 20px}',
      '.ls-locale-list{display:flex;flex-direction:column;gap:8px}',
      '.ls-locale-btn{display:flex;align-items:center;gap:10px;padding:14px 16px;border:1.5px solid #e2e8f0;border-radius:12px;background:#f8fafc;cursor:pointer;transition:all .18s;font-size:14px;font-family:inherit;text-align:left;width:100%}',
      '.ls-locale-btn:hover,.ls-locale-btn:focus{border-color:#0284c7;background:#eff9ff;outline:none}',
      '.ls-locale-flag{flex-shrink:0;display:flex;align-items:center}',
      '.ls-locale-country{font-weight:600;color:#1e293b;font-size:14px}',
      '.ls-locale-lang{font-size:13px;color:#0284c7;font-weight:600;margin-left:auto}',
      '.ls-popup-skip{margin-top:14px;text-align:center}',
      '.ls-popup-skip button{background:none;border:none;color:#94a3b8;font-size:12px;cursor:pointer;padding:4px 8px;font-family:inherit}',
      '.ls-popup-skip button:hover{color:#64748b}',
      '@media(max-width:440px){.ls-popup-box{padding:28px 20px 22px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function buildPopup() {
    var overlay = document.createElement('div');
    overlay.className = 'ls-popup-overlay';
    overlay.id = 'lsLangPopup';

    var box = document.createElement('div');
    box.className = 'ls-popup-box';

    var logoHtml = '<div class="ls-popup-logo"><div class="ls-popup-logo-mark">LS</div></div>';
    var titleHtml = '<div class="ls-popup-title">Choose Your Language</div>';
    var subHtml = '<div class="ls-popup-sub">You can change your language at any time from the top of the page.</div>';

    var listHtml = '<div class="ls-locale-list">';
    window.LS_LOCALES.forEach(function(loc) {
      listHtml += '<button class="ls-locale-btn" data-lang="' + loc.lang + '" aria-label="' + loc.country + ' - ' + loc.label + '">' +
        '<span class="ls-locale-flag">' + window.renderFlag(loc.code) + '</span>' +
        '<span class="ls-locale-country">' + loc.country + '</span>' +
        '<span class="ls-locale-lang">' + loc.label + '</span>' +
        '</button>';
    });
    listHtml += '</div>';

    var skipHtml = '<div class="ls-popup-skip"><button id="lsPopupSkip">Continue without selecting</button></div>';

    box.innerHTML = logoHtml + titleHtml + subHtml + listHtml + skipHtml;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Bind locale buttons
    overlay.querySelectorAll('.ls-locale-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var lang = btn.getAttribute('data-lang');
        window.applyI18n(lang);
        overlay.classList.add('ls-hidden');
      });
    });

    var skipBtn = document.getElementById('lsPopupSkip');
    if (skipBtn) skipBtn.addEventListener('click', function() {
      // Default to en-US if skipped without selection
      if (!localStorage.getItem('ls_lang')) window.applyI18n('en-US');
      overlay.classList.add('ls-hidden');
    });

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        if (!localStorage.getItem('ls_lang')) window.applyI18n('en-US');
        overlay.classList.add('ls-hidden');
      }
    });
  }

  function maybeShowPopup() {
    if (!window._LS_POPUP_SHOW) return;
    injectPopupStyles();
    buildPopup();
    // Update lang dropdown flags on all pages
    window.updateLangDropdownFlags();
  }

  // Also update dropdown flags even when popup doesn't show
  function initDropdownFlags() {
    if (typeof window.updateLangDropdownFlags === 'function') {
      window.updateLangDropdownFlags();
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      maybeShowPopup();
      initDropdownFlags();
    });
  } else {
    maybeShowPopup();
    initDropdownFlags();
  }
})();
