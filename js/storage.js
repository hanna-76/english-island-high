/* ============================================================
 * storage.js —— 本地存储模块（localStorage）
 *
 * 功能说明：
 *   1. 记录学习数据：完成轮数、总答题数、答对数
 *   2. 记录各主题/各玩法最高分（bestScore）
 *   3. 错题本：答错的词自动收录，答对自动移除
 *   4. 已解锁主题：正确率≥60%自动解锁下一个主题
 *   5. 静音状态持久化
 *   6. 所有数据存储在 localStorage，关闭浏览器后不丢失
 *
 * 数据结构：
 *   {
 *     totalRounds: number,      // 完成轮数
 *     totalAnswered: number,    // 总答题数
 *     totalCorrect: number,     // 总答对数
 *     bestScore: {theme_task: score},  // 各主题各玩法最高分
 *     wrongWords: [{en, zh, emoji}],   // 错题本
 *     unlockedThemes: [themeId]         // 已解锁主题ID列表
 *   }
 * ============================================================ */
const Store = {
  KEY: "english_island_data_v1",

  // 读取全部数据（没有则返回默认结构）
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 忽略损坏数据 */ }
    return {
      bestScore: {},        // { "animals_listen": 8 }
      unlockedThemes: ["animals"],  // 已解锁主题
      wrongWords: [],       // 错题单词列表
      totalRounds: 0,       // 完成总轮数
      totalCorrect: 0,      // 总答对数
      totalAnswered: 0      // 总答题数
    };
  },

  // 保存全部数据
  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) { /* 存储空间不足时静默失败 */ }
  },

  // 记录一轮结果
  recordRound(themeId, taskType, correct, total) {
    const data = this.load();
    const key = themeId + "_" + taskType;
    // 最高分只升不降
    if (!data.bestScore[key] || correct > data.bestScore[key]) {
      data.bestScore[key] = correct;
    }
    data.totalRounds += 1;
    data.totalCorrect += correct;
    data.totalAnswered += total;
    this.save(data);
    return data;
  },

  // 记录一个错词
  recordWrong(wordObj) {
    const data = this.load();
    // 同一单词不重复记录
    if (!data.wrongWords.find(w => w.en === wordObj.en)) {
      data.wrongWords.push(wordObj);
      this.save(data);
    }
  },

  // 掌握一个词（从错词本中移除）
  removeWrong(wordEn) {
    const data = this.load();
    data.wrongWords = data.wrongWords.filter(w => w.en !== wordEn);
    this.save(data);
  },

  // 解锁主题
  unlockTheme(themeId) {
    const data = this.load();
    if (!data.unlockedThemes.includes(themeId)) {
      data.unlockedThemes.push(themeId);
      this.save(data);
    }
  },

  // 获取错题本
  getWrongWords() {
    return this.load().wrongWords;
  },

  // 获取整体正确率
  getAccuracy() {
    const data = this.load();
    if (data.totalAnswered === 0) return 0;
    return Math.min(100, Math.round((data.totalCorrect / data.totalAnswered) * 100));
  }
};
