/* ============================================================
 * app.js —— 主应用模块（页面路由 + 关卡控制 + 结算 + 学习报告）
 *
 * 功能说明：
 *   1. 页面路由：首页 → 年龄选择 → 任务选择 → 主题选择 → 游戏 → 结算
 *   2. 关卡控制：根据年龄组和任务类型启动对应游戏
 *   3. 进度条：实时显示当前题数/总题数
 *   4. 结算页：显示星星、正确率、错题复习入口
 *   5. 学习报告页：总览数据 + 各主题正确率柱状图
 *   6. 暂停/继续：游戏中可暂停，弹出暂停遮罩
 *   7. 退出确认：退出关卡前弹出确认对话框，防止误触
 *   8. 主题解锁：正确率≥60%自动解锁下一个主题
 *   9. 错题复习：结算页可一键进入错题复习模式
 *
 * 页面结构（对应 index.html 中的 screen）：
 *   screenHome     - 首页（档次选择 + 开始按钮 + 学习报告入口）
 *   screenAge      - 年龄组选择（3~5 / 6~8 / 9~12）
 *   screenTask     - 任务类型选择（听音/配对/拼词/句子/情境）
 *   screenTheme    - 主题选择（8个主题，含锁定状态）
 *   screenGame     - 游戏进行中（进度条 + 题目区 + 暂停遮罩）
 *   screenResult   - 结算页（星星 + 成绩 + 错题复习）
 *   screenReport   - 学习报告页（数据统计 + 主题正确率）
 * ============================================================ */
const App = {
  level: "high",   // 当前档次：low / mid / high
  taskType: null,  // listening / match / spell / sentence / scenario
  difficulty: "easy",  // 当前难度：easy / normal / hard

  init() {
    AudioManager.init();
    this.bindGlobalButtons();
    this.showHome();
  },

  // 设置难度
  setDifficulty(diff) {
    this.difficulty = diff;
    document.querySelectorAll(".difficulty-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.diff === diff);
    });
  },

  // 顶部通用按钮：静音（绑定所有页面的静音按钮）
  bindGlobalButtons() {
    const updateAllIcons = () => {
      document.querySelectorAll("#btnMute").forEach(btn => {
        btn.textContent = AudioManager.muted ? "🔇" : "🔊";
      });
    };
    document.querySelectorAll("#btnMute").forEach(btn => {
      btn.onclick = () => {
        AudioManager.toggleMute();
        updateAllIcons();
      };
    });
    updateAllIcons();
  },

  // ---------- 页面切换 ----------
  showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  },

  // ---------- 首页 ----------
  showHome() {
    this.showScreen("screenHome");
    // 更新错题复习按钮显示
    const wrongBtn = document.getElementById("btnWrongReview");
    if (wrongBtn) {
      const wrong = Store.getWrongWords();
      if (wrong.length > 0) {
        wrongBtn.style.display = "";
        wrongBtn.textContent = `📕 错题复习（${wrong.length}个词）`;
      } else {
        wrongBtn.style.display = "none";
      }
    }
  },

  // ---------- 选择玩法（直接显示所有玩法） ----------
  showTaskSelect() {
    this.showScreen("screenTask");
    // 高档显示所有玩法
    document.getElementById("taskListen").style.display = "";
    document.getElementById("taskMatch").style.display = "";
    document.getElementById("taskSpell").style.display = "";
    document.getElementById("taskSentence").style.display = "";
    document.getElementById("taskScenario").style.display = "";
  },

  pickTask(task) {
    this.taskType = task;
    this.showThemeSelect();
  },

  // ---------- 选择主题 ----------
  showThemeSelect() {
    this.showScreen("screenTheme");
    const wrap = document.getElementById("themeGrid");
    wrap.innerHTML = "";
    const themes = getThemesByLevel(this.level);
    const unlocked = this.level === "low" ? themes.map(t => t.id) :
                     (Store.load().unlockedThemes || [themes[0].id]);

    themes.forEach(t => {
      const locked = !unlocked.includes(t.id);
      const btn = document.createElement("button");
      btn.className = "theme-card" + (locked ? " locked" : "");
      btn.innerHTML = `
        <span class="emoji">${t.icon}</span>
        <span>${t.name}</span>
        ${locked ? "<small>🔒 通关后解锁</small>" : `<small>${t.words.length} 词</small>`}
      `;
      if (!locked) btn.onclick = () => this.startGame(t);
      wrap.appendChild(btn);
    });
  },

  // ---------- 开始游戏 ----------
  startGame(theme) {
    const finish = (correct, total) => this.showResult(theme, correct, total);
    const diff = this.difficulty;

    if (this.taskType === "listening" || !this.taskType) {
      GameListening.start(theme, diff, finish);
    } else if (this.taskType === "match") {
      GameMatch.start(theme, diff, finish);
    } else if (this.taskType === "spell") {
      GameSpell.start(theme, diff, finish);
    } else if (this.taskType === "sentence") {
      GameSentence.start(diff, finish);
    } else if (this.taskType === "scenario") {
      GameSentence.startScenario(diff, finish);
    }
    this.showScreen("screenGame");
  },

  // ---------- 进度条 ----------
  showProgress(cur, total) {
    const bar = document.getElementById("progressBar");
    bar.style.width = (cur / total * 100) + "%";
  },

  // ---------- 结算页 ----------
  showResult(theme, correct, total) {
    // 记录到本地存储
    let accuracy = 0;
    if (typeof Store.recordRound === "function" && this.level !== "low") {
      Store.recordRound(theme ? theme.id : "sentence", this.taskType || "listen", correct, total);
      Store.unlockThemeAfterRound(theme, correct, total);
    }
    if (total > 0) accuracy = Math.round(correct / total * 100);

    // 星星数量：1~3 颗
    let stars = 1;
    if (accuracy >= 80) stars = 3;
    else if (accuracy >= 60) stars = 2;

    let starStr = "";
    for (let i = 0; i < 3; i++) {
      starStr += i < stars ? "⭐" : "☆";
    }

    this.showScreen("screenResult");
    document.getElementById("resultText").innerHTML = `
      <div class="stars">${starStr}</div>
      <p class="result-score">${correct} / ${total} 正确</p>
      <p class="result-acc">正确率 ${accuracy}%</p>
    `;

    // 错题复习入口（中高档）
    const wrongBox = document.getElementById("wrongReviewBox");
    if (this.level !== "low") {
      const wrong = Store.getWrongWords();
      if (wrong.length > 0) {
        wrongBox.style.display = "block";
        wrongBox.textContent = `📕 错题本：${wrong.length} 个词待复习`;
        wrongBox.onclick = () => App.reviewWrong();
      } else {
        wrongBox.style.display = "none";
      }
    } else {
      wrongBox.style.display = "none";
    }
  },

  // 错题复习：用听音找图模式跑错词
  reviewWrong() {
    const wrong = Store.getWrongWords();
    if (wrong.length === 0) return;
    const fakeTheme = {
      id: "review", name: "错题复习", icon: "📕",
      words: wrong
    };
    this.taskType = "listening";
    GameListening.start(fakeTheme, "easy", (c, t) => {
      this.showResult(fakeTheme, c, t);
    });
    this.showScreen("screenGame");
  },

  // 退出确认
  confirmExit() {
    if (confirm("确定要退出当前关卡吗？进度会丢失哦~")) {
      // 退出时恢复暂停状态
      document.getElementById("pauseOverlay").style.display = "none";
      this.showHome();
    }
  },

  // ---------- 暂停/继续 ----------
  togglePause() {
    const overlay = document.getElementById("pauseOverlay");
    const btnPause = document.getElementById("btnPause");
    if (overlay.style.display === "none" || !overlay.style.display) {
      // 暂停游戏
      overlay.style.display = "flex";
      btnPause.textContent = "▶️";
      // 暂停当前游戏（如果是听音找图）
      if (this.taskType === "listening" || !this.taskType) {
        GameListening.pause();
      }
      AudioManager.stop();
    } else {
      // 继续游戏
      overlay.style.display = "none";
      btnPause.textContent = "⏸️";
      if (this.taskType === "listening" || !this.taskType) {
        GameListening.resume();
      }
    }
  },

  // ---------- 学习报告页 ----------
  showReport() {
    this.showScreen("screenReport");
    const data = Store.load();
    const content = document.getElementById("reportContent");

    // 如果没有任何游戏记录，显示空状态
    if (data.totalRounds === 0) {
      content.innerHTML = '<div class="report-empty">还没有学习记录，快去玩一局吧！</div>';
      return;
    }

    // 总览数据
    const accuracy = Store.getAccuracy();
    let html = `
      <div class="report-box">
        <div class="report-title">🏆 学习总览</div>
        <div class="report-summary">
          <div class="report-stat">
            <div class="num">${data.totalRounds}</div>
            <div class="label">完成轮数</div>
          </div>
          <div class="report-stat">
            <div class="num">${accuracy}%</div>
            <div class="label">总正确率</div>
          </div>
          <div class="report-stat">
            <div class="num">${data.wrongWords.length}</div>
            <div class="label">待复习词</div>
          </div>
        </div>
        <div class="report-title" style="font-size:16px">📈 各主题正确率</div>
    `;

    // 各主题正确率（从 bestScore 中统计）
    const themes = getThemesByLevel(this.level);
    let hasThemeData = false;
    themes.forEach(t => {
      // 找出该主题所有玩法的最高分，计算平均正确率
      const scores = [];
      Object.keys(data.bestScore).forEach(key => {
        if (key.startsWith(t.id + "_")) {
          scores.push(data.bestScore[key]);
        }
      });
      if (scores.length > 0) {
        hasThemeData = true;
        // 正确率限制在 0~100% 之间
        const avg = Math.min(100, Math.round(scores.reduce((a,b) => a+b, 0) / scores.length / 10 * 100));
        html += `
          <div class="report-theme-row">
            <div class="report-theme-name">${t.icon} ${t.name}</div>
            <div class="report-theme-bar">
              <div class="report-theme-fill" style="width:${avg}%"></div>
            </div>
            <div class="report-theme-pct">${avg}%</div>
          </div>
        `;
      }
    });

    if (!hasThemeData) {
      html += '<div class="report-empty">暂无主题数据</div>';
    }

    html += '</div>';
    content.innerHTML = html;
  }
};

// 给 Store 补一个：通关后解锁下一个主题
Store.unlockThemeAfterRound = function (theme, correct, total) {
  if (!theme) return;
  const accuracy = total > 0 ? correct / total : 0;
  if (accuracy >= 0.6) {
    const themes = getThemesByLevel(App.level);
    const idx = themes.findIndex(t => t.id === theme.id);
    if (idx >= 0 && idx + 1 < themes.length) {
      Store.unlockTheme(themes[idx + 1].id);
    }
  }
};

// 页面加载完成后启动
window.addEventListener("DOMContentLoaded", () => App.init());
