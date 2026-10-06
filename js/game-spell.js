/* ============================================================
 * game-spell.js —— 拼单词（6~8岁核心玩法）
 *
 * 功能说明：
 *   1. 显示图片提示 + 播放单词发音
 *   2. 下方显示打乱顺序的字母按钮
 *   3. 儿童按顺序点击字母，拼出正确单词
 *   4. 拼对：播放鼓励语音，进入下一题
 *   5. 拼错：字母槽变红抖动，可重新拼写
 *   6. 每轮 10 题
 *   7. 颜色主题用纯颜色块显示，其他主题用 emoji
 *   8. 答错的词自动记录到错题本
 *
 * 状态变量：
 *   questions  - 本轮题目列表
 *   index      - 当前题号
 *   correct    - 本轮答对数量
 *   theme      - 当前主题对象
 *   onFinish   - 结束回调 (correct, total)
 *   userInput  - 用户当前输入的字母数组
 * ============================================================ */
const GameSpell = {
  questions: [],
  index: 0,
  correct: 0,
  theme: null,
  onFinish: null,
  difficulty: "easy",  // easy / normal / hard
  streak: 0,  // 连续答对/答错计数

  // 根据难度获取单词长度范围和干扰字母数
  getWordLengthRange() {
    if (this.difficulty === "easy") return { min: 3, max: 3, extras: 2 };
    if (this.difficulty === "normal") return { min: 4, max: 5, extras: 3 };
    return { min: 6, max: 8, extras: 4 };
  },

  // 动态难度调整：连续答对3题升级，连续答错2题降级
  adjustDifficulty(isCorrect) {
    if (isCorrect) {
      this.streak = Math.max(0, this.streak) + 1;
      if (this.streak >= 3 && this.difficulty !== "hard") {
        this.difficulty = this.difficulty === "easy" ? "normal" : "hard";
        this.streak = 0;
      }
    } else {
      this.streak = Math.min(0, this.streak) - 1;
      if (this.streak <= -2 && this.difficulty !== "easy") {
        this.difficulty = this.difficulty === "hard" ? "normal" : "easy";
        this.streak = 0;
      }
    }
  },

  start(theme, difficulty, onFinish) {
    this.theme = theme;
    this.onFinish = onFinish;
    this.difficulty = difficulty || "easy";
    this.index = 0;
    this.correct = 0;
    this.streak = 0;
    this.loadQuestions();
    this.renderQuestion();
  },

  // 根据当前难度加载题目
  loadQuestions() {
    const range = this.getWordLengthRange();
    const pool = this.theme.words.filter(w => w.en.length >= range.min && w.en.length <= range.max);
    this.questions = sample(pool.length > 0 ? pool : this.theme.words, Math.min(10, pool.length > 0 ? pool.length : this.theme.words.length));
  },

  renderQuestion() {
    const q = this.questions[this.index];
    const total = this.questions.length;
    App.showProgress(this.index + 1, total);

    // 根据难度调整提示
    let hintText = `拼出这个单词：${q.zh}`;
    if (this.difficulty === "easy") {
      const firstTwo = q.en.substring(0, 2).toUpperCase();
      hintText += ` <br/><small style="color:#ff9800">💡 提示：前两个字母是 "${firstTwo}"，共${q.en.length}个字母</small>`;
    } else if (this.difficulty === "normal") {
      hintText += ` <br/><small style="color:#999">💡 提示：第一个字母是 "${q.en[0].toUpperCase()}"</small>`;
    }

    const stage = document.getElementById("stage");
    stage.innerHTML = `
      <div class="spell-box">
        <div class="spell-emoji">${renderWordImage(q)}</div>
        <p class="q-cn">${hintText}</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;flex-wrap:wrap">
          <button class="btn-replay" id="btnReplay">🔊 听发音</button>
          <button class="btn-replay" id="btnClear" style="background:#fff3e0;color:#e65100;border-color:#ffcc80">🔄 清空重选</button>
        </div>
        <div class="spell-slots" id="slots"></div>
        <div class="spell-letters" id="letters"></div>
        <p style="font-size:12px;color:#999;margin-top:8px">💡 点击已填的字母槽可取消该位置及之后的字母</p>
      </div>
    `;

    AudioManager.speak(q.en);
    document.getElementById("btnReplay").onclick = () => AudioManager.speak(q.en);
    // 清空重选按钮
    document.getElementById("btnClear").onclick = () => this.clearAll();

    // 空格槽
    const slots = document.getElementById("slots");
    this.slotEls = [];
    for (let i = 0; i < q.en.length; i++) {
      const s = document.createElement("div");
      s.className = "slot";
      // 点击空格槽：从该位置开始清空，恢复字母按钮
      s.onclick = () => this.clearFromSlot(i);
      slots.appendChild(s);
      this.slotEls.push(s);
    }

    // 打乱的字母：正确字母 + 干扰字母（根据难度）
    const range = this.getWordLengthRange();
    const correctLetters = q.en.split("");
    const extras = sample("abcdefghijklmnopqrstuvwxyz".split(""), range.extras);
    const letters = shuffle([...correctLetters, ...extras]);

    const lettersBox = document.getElementById("letters");
    this.pickedCount = 0;
    this.currentWord = q;
    this.letterBtns = [];  // 保存所有字母按钮引用，用于取消时恢复

    letters.forEach((letter, idx) => {
      const btn = document.createElement("button");
      btn.className = "letter-btn";
      btn.textContent = letter;
      btn.onclick = () => this.pickLetter(btn, letter, idx);
      lettersBox.appendChild(btn);
      this.letterBtns.push(btn);
    });
  },

  // 从指定位置开始清空空格槽，恢复对应的字母按钮
  clearFromSlot(slotIndex) {
    // 从 slotIndex 到末尾，清空所有已填字母
    for (let i = slotIndex; i < this.pickedCount; i++) {
      this.slotEls[i].textContent = "";
      this.slotEls[i].classList.remove("right", "wrong");
    }
    // 恢复对应的字母按钮（通过按钮的 usedIndex 属性找到）
    this.letterBtns.forEach(btn => {
      if (btn.usedSlotIndex >= slotIndex) {
        btn.disabled = false;
        btn.classList.remove("used");
        btn.usedSlotIndex = -1;
      }
    });
    this.pickedCount = slotIndex;
  },

  // 清空所有已选字母，重新开始本题
  clearAll() {
    this.clearFromSlot(0);
  },

  pickLetter(btn, letter, btnIndex) {
    // 填入下一个空格
    const slot = this.slotEls[this.pickedCount];
    if (!slot || btn.disabled) return;

    slot.textContent = letter;
    btn.disabled = true;
    btn.classList.add("used");
    btn.usedSlotIndex = this.pickedCount;  // 记录该字母填入了哪个槽
    this.pickedCount++;

    // 填满了？
    if (this.pickedCount >= this.currentWord.en.length) {
      const answer = this.currentWord.en;
      const typed = [...this.slotEls].map(s => s.textContent).join("");
      if (typed === answer) {
        this.correct++;
        this.adjustDifficulty(true);
        this.slotEls.forEach(s => s.classList.add("right"));
        AudioManager.speak(answer + "! spell great!");
        if (Store.removeWrong) Store.removeWrong(answer);
        setTimeout(() => this.next(), 1200);
      } else {
        this.adjustDifficulty(false);
        this.slotEls.forEach(s => s.classList.add("wrong"));
        AudioManager.speak("try again!");
        if (Store.recordWrong) Store.recordWrong(this.currentWord);
        setTimeout(() => {
          // 重置本题
          this.renderQuestion();
        }, 1200);
      }
    }
  },

  next() {
    this.index++;
    if (this.index >= this.questions.length) {
      if (this.onFinish) this.onFinish(this.correct, this.questions.length);
    } else {
      // 难度可能变化，重新加载符合当前难度的题目
      if (this.index % 3 === 0) this.loadQuestions();
      this.renderQuestion();
    }
  }
};
