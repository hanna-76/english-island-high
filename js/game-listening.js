/* ============================================================
 * game-listening.js —— 听音找图（高档版：含动态难度调整）
 *
 * 功能说明：
 *   1. 播放单词发音，儿童从 2~4 张图中点选答案
 *   2. 三个关卡难度：简单(2图) / 中等(3图) / 困难(4图)
 *   3. 动态难度调整：连续答对3题自动升级，连续答错2题自动降级
 *   4. 颜色主题用纯颜色块显示，其他主题用 emoji
 *   5. 加 locked 锁和 timer 管理，防止答题跳转bug
 *
 * 难度调整规则（可测试复现）：
 *   - 初始难度由传入参数决定（easy/normal/hard）
 *   - 连续答对 3 题：难度 +1（easy→normal→hard）
 *   - 连续答错 2 题：难度 -1（hard→normal→easy）
 *   - 答对/答错打断连续计数时，streak 重置
 * ============================================================ */

const GameListening = {
  /* ---------- 状态变量 ---------- */
  questions: [],       // 本轮题目列表
  index: 0,            // 当前题号（从0开始）
  correct: 0,          // 本轮答对数量
  theme: null,         // 当前主题对象
  level: "easy",       // 当前难度：easy=2图, normal=3图, hard=4图
  onFinish: null,      // 游戏结束回调函数 (correct, total)
  locked: false,       // 答题锁：防止一题内重复点击
  timer: null,         // 定时器ID：用于清除旧的 setTimeout
  streak: 0,           // 连续答对/答错计数（正数=连续答对，负数=连续答错）
  paused: false,       // 暂停状态

  /* ==========================================================
   * start(theme, level, onFinish)
   * 开始一轮听音找图游戏。
   * ========================================================== */
  start(theme, level, onFinish) {
    this.theme = theme;
    this.level = level || "easy";
    this.onFinish = onFinish;
    this.index = 0;
    this.correct = 0;
    this.locked = false;
    this.streak = 0;
    this.paused = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }

    const wordPool = theme.words;
    this.questions = sample(wordPool, Math.min(10, wordPool.length));
    this.renderQuestion();
  },

  /* ==========================================================
   * optionCount()
   * 根据当前难度返回每题显示几张图。
   * ========================================================== */
  optionCount() {
    if (this.level === "easy")   return 2;
    if (this.level === "normal") return 3;
    return 4;
  },

  /* ==========================================================
   * adjustLevel(isCorrect)
   * 动态难度调整：根据连续答题情况调整难度。
   *
   * 规则：
   *   - 连续答对 3 题：难度 +1（升级）
   *   - 连续答错 2 题：难度 -1（降级）
   *   - 难度边界：最低 easy，最高 hard
   * ========================================================== */
  adjustLevel(isCorrect) {
    if (isCorrect) {
      if (this.streak < 0) this.streak = 0;
      this.streak++;
      if (this.streak >= 3) {
        if (this.level === "easy") {
          this.level = "normal";
        } else if (this.level === "normal") {
          this.level = "hard";
        }
        this.streak = 0;
      }
    } else {
      if (this.streak > 0) this.streak = 0;
      this.streak--;
      if (this.streak <= -2) {
        if (this.level === "hard") {
          this.level = "normal";
        } else if (this.level === "normal") {
          this.level = "easy";
        }
        this.streak = 0;
      }
    }
  },

  /* ==========================================================
   * renderQuestion()
   * 渲染当前题目界面。
   * ========================================================== */
  renderQuestion() {
    this.locked = false;
    const q = this.questions[this.index];
    const total = this.questions.length;

    App.showProgress(this.index + 1, total);

    // 根据难度调整提示：easy显示英文单词文字，normal/hard不显示文字（纯听音）
    const showText = this.level === "easy";
    const hintText = showText
      ? `<p class="q-cn">${q.en}</p>`
      : `<p class="q-cn" style="color:#999;font-size:14px">🔊 听发音，选正确图片</p>`;

    const stage = document.getElementById("stage");
    stage.innerHTML = `
      <div class="q-hint">
        ${hintText}
        <button class="btn-replay" id="btnReplay" aria-label="重播发音">
          🔊 再听一次
        </button>
      </div>
      <div class="img-options" id="imgOptions"></div>
    `;

    AudioManager.speak(q.en);

    document.getElementById("btnReplay").onclick = () => {
      AudioManager.speak(q.en);
    };

    const distractors = sample(
      this.theme.words.filter(w => w.en !== q.en),
      this.optionCount() - 1
    );
    const options = shuffle([q, ...distractors]);

    const box = document.getElementById("imgOptions");
    box.innerHTML = "";
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "img-card";
      btn.innerHTML = renderWordImage(opt);
      btn.onclick = () => this.handlePick(btn, opt, q);
      box.appendChild(btn);
    });
  },

  /* ==========================================================
   * handlePick(btnEl, picked, answer)
   * 处理用户点击图片选项。
   * ========================================================== */
  handlePick(btnEl, picked, answer) {
    if (this.locked) return;
    this.locked = true;

    if (this.timer) { clearTimeout(this.timer); this.timer = null; }

    const isCorrect = picked.en === answer.en;
    this.adjustLevel(isCorrect);

    if (isCorrect) {
      this.correct++;
      btnEl.classList.add("right");
      AudioManager.speak("correct! great job!");
      if (Store.removeWrong) Store.removeWrong(answer.en);
      this.disableAllCards();
      this.timer = setTimeout(() => this.next(), 1000);
    } else {
      btnEl.classList.add("wrong");
      if (Store.recordWrong) Store.recordWrong(answer);
      AudioManager.speak("try again! listen carefully");
      this.disableAllCards();

      // 根据难度调整答错提示：
      // easy：高亮正确答案 + 播放发音 + 显示文字
      // normal：高亮正确答案 + 播放发音
      // hard：不高亮、不播放发音，直接下一题（让孩子自己思考）
      if (this.level === "hard") {
        this.timer = setTimeout(() => this.next(), 1200);
      } else {
        this.timer = setTimeout(() => {
          const cards = document.querySelectorAll(".img-card");
          cards.forEach(c => {
            if (c.querySelector(".emoji") && c.querySelector(".emoji").textContent === answer.emoji) {
              c.classList.add("right");
            }
            if (c.querySelector(".color-block") && answer.color) {
              const cb = c.querySelector(".color-block");
              if (cb.style.background === answer.color || cb.style.backgroundColor === answer.color) {
                c.classList.add("right");
              }
            }
          });
          // easy难度额外显示正确答案文字
          if (this.level === "easy") {
            const hint = document.querySelector(".q-hint .q-cn");
            if (hint) hint.innerHTML = `✅ 正确答案：<strong>${answer.en}</strong>`;
          }
          AudioManager.speak(answer.en);
        }, 800);

        this.timer = setTimeout(() => this.next(), 2200);
      }
    }
  },

  /* ==========================================================
   * disableAllCards()
   * 禁用当前所有图片选项卡片。
   * ========================================================== */
  disableAllCards() {
    const cards = document.querySelectorAll(".img-card");
    cards.forEach(c => {
      c.disabled = true;
      c.style.opacity = "0.85";
    });
  },

  /* ==========================================================
   * next()
   * 进入下一题，或全部做完后触发结束回调。
   * ========================================================== */
  next() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.index++;
    if (this.index >= this.questions.length) {
      if (this.onFinish) this.onFinish(this.correct, this.questions.length);
    } else {
      this.renderQuestion();
    }
  },

  /* ==========================================================
   * pause() / resume()
   * 暂停/继续游戏。
   * ========================================================== */
  pause() {
    this.paused = true;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.locked = true;
  },

  resume() {
    this.paused = false;
    this.locked = false;
  }
};
