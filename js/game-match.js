/* ============================================================
 * game-match.js —— 词图配对（6~8岁核心玩法）
 *
 * 功能说明：
 *   1. 左边显示图片列，右边显示打乱顺序的英文单词列
 *   2. 儿童先点左边图片，再点右边单词，进行配对
 *   3. 配对成功：两张卡片变绿并禁用，播放单词发音
 *   4. 配对失败：两张卡片变红抖动，0.6秒后恢复
 *   5. 每轮 5 组配对，每组 5 对，合计 25 题
 *   6. 颜色主题用纯颜色块显示，其他主题用 emoji
 *   7. 答错的词自动记录到错题本
 *
 * 状态变量：
 *   questions    - 当前组的配对词列表（5个词）
 *   index        - 当前组序号（0~4）
 *   correct      - 本轮答对总数
 *   theme        - 当前主题对象
 *   onFinish     - 结束回调 (correct, total)
 *   pickedImg    - 当前选中的图片卡片 {btn, word}
 *   pickedWord   - 当前选中的单词卡片 {btn, word}
 *   totalRounds  - 总包数（5组）
 *   matchedInRound - 当前组已配对数
 * ============================================================ */
const GameMatch = {
  questions: [],
  index: 0,
  correct: 0,
  theme: null,
  onFinish: null,
  pickedImg: null,
  pickedWord: null,
  totalRounds: 5,
  matchedInRound: 0,
  difficulty: "easy",  // easy / normal / hard
  streak: 0,  // 连续答对/答错计数（正=连续答对，负=连续答错）
  wrongInRound: 0,  // 当前组答错次数

  // 根据难度获取每组配对数
  getPairsPerRound() {
    if (this.difficulty === "easy") return 3;
    if (this.difficulty === "normal") return 4;
    return 5;
  },

  // 动态难度调整：连续答对3组升级，连续答错2组降级
  adjustDifficulty(allCorrect) {
    if (allCorrect) {
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
    this.matchedInRound = 0;
    this.streak = 0;
    this.wrongInRound = 0;
    const pairs = this.getPairsPerRound();
    this.questions = sample(theme.words, Math.min(pairs, theme.words.length));
    this.renderRound();
  },

  renderRound() {
    const pairWords = this.questions;
    this.pickedImg = null;
    this.pickedWord = null;

    // 进度条：总进度 = 已完成配对数 / 总配对数
    const totalPairs = this.totalRounds * this.questions.length;
    const donePairs = this.index * this.questions.length + this.matchedInRound;
    App.showProgress(donePairs, totalPairs);

    const stage = document.getElementById("stage");
    stage.innerHTML = `
      <p class="q-cn">把图片和单词连起来！</p>
      <div class="match-board">
        <div class="match-col" id="imgCol"></div>
        <div class="match-col" id="wordCol"></div>
      </div>
    `;

    const imgCol = document.getElementById("imgCol");
    const wordCol = document.getElementById("wordCol");

    pairWords.forEach((w) => {
      const imgBtn = document.createElement("button");
      imgBtn.className = "match-img";
      imgBtn.dataset.en = w.en;
      imgBtn.innerHTML = renderWordImage(w, "small");
      imgBtn.onclick = () => this.pickImg(imgBtn, w);
      imgCol.appendChild(imgBtn);
    });

    shuffle(pairWords).forEach(w => {
      const wBtn = document.createElement("button");
      wBtn.className = "match-word";
      wBtn.dataset.en = w.en;
      wBtn.textContent = w.en;
      wBtn.onclick = () => this.pickWord(wBtn, w);
      wordCol.appendChild(wBtn);
    });
  },

  pickImg(btn, word) {
    document.querySelectorAll(".match-img").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    this.pickedImg = { btn, word };
    this.checkPair();
  },

  pickWord(btn, word) {
    document.querySelectorAll(".match-word").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    this.pickedWord = { btn, word };
    this.checkPair();
  },

  checkPair() {
    if (!this.pickedImg || !this.pickedWord) return;

    if (this.pickedImg.word.en === this.pickedWord.word.en) {
      // 配对成功
      this.correct++;
      this.matchedInRound++;
      this.pickedImg.btn.classList.add("matched");
      this.pickedWord.btn.classList.add("matched");
      AudioManager.speak(this.pickedImg.word.en + " !");
      this.pickedImg.btn.disabled = true;
      this.pickedWord.btn.disabled = true;
      this.pickedImg = null;
      this.pickedWord = null;

      // 更新进度条
      const totalPairs = this.totalRounds * this.questions.length;
      const donePairs = this.index * this.questions.length + this.matchedInRound;
      App.showProgress(donePairs, totalPairs);

      // 这一组全配对完？
      const remaining = document.querySelectorAll(".match-img:not(.matched)");
      if (remaining.length === 0) {
        setTimeout(() => {
          // 动态难度调整：本组全对则streak+，有答错则streak-
          this.adjustDifficulty(this.wrongInRound === 0);
          this.index++;
          this.matchedInRound = 0;
          this.wrongInRound = 0;
          if (this.index >= this.totalRounds) {
            // 全部组做完，总题数 = 组数 × 每组对数
            if (this.onFinish) this.onFinish(this.correct, this.totalRounds * this.questions.length);
          } else {
            const pairs = this.getPairsPerRound();
            this.questions = sample(this.theme.words, Math.min(pairs, this.theme.words.length));
            this.renderRound();
          }
        }, 800);
      }
    } else {
      // 配对失败
      const wrongWord = this.pickedImg.word;
      this.pickedImg.btn.classList.add("wrong");
      this.pickedWord.btn.classList.add("wrong");
      AudioManager.speak("try again!");
      this.wrongInRound++;
      const img = this.pickedImg, w = this.pickedWord;

      // easy难度：答错后短暂高亮正确配对作为提示
      if (this.difficulty === "easy") {
        setTimeout(() => {
          document.querySelectorAll(".match-img").forEach(b => {
            if (b.dataset.en === wrongWord.en) b.classList.add("hint-right");
          });
          document.querySelectorAll(".match-word").forEach(b => {
            if (b.dataset.en === wrongWord.en) b.classList.add("hint-right");
          });
          setTimeout(() => {
            document.querySelectorAll(".hint-right").forEach(b => b.classList.remove("hint-right"));
          }, 1000);
        }, 600);
      }

      setTimeout(() => {
        img.btn.classList.remove("wrong", "selected");
        w.btn.classList.remove("wrong", "selected");
      }, 600);
      this.pickedImg = null;
      this.pickedWord = null;
      // 记录错词（在清空 pickedImg 之前保存了引用）
      if (Store.recordWrong && wrongWord) Store.recordWrong(wrongWord);
    }
  }
};
