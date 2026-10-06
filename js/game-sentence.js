/* ============================================================
 * game-sentence.js —— 句子排序 + 情境选择（9~12岁核心玩法）
 *
 * 功能说明：
 *   模式一：句子排序
 *     1. 显示中文提示 + 播放完整句子发音
 *     2. 下方显示打乱顺序的句子成分（单词/短语）
 *     3. 儿童按正确语序点击成分，拼出完整句子
 *     4. 拼对：播放鼓励语音，进入下一题
 *     5. 拼错：成分变红，可重新排序
 *
 *   模式二：情境选择
 *     1. 显示一个情境描述（中文）
 *     2. 提供 3~4 个英文表达选项
 *     3. 儿童选择最适合该情境的表达
 *     4. 选对：播放鼓励语音
 *     5. 选错：显示正确答案
 *
 * 每轮 10 题，句子库共 30 个短句，覆盖 8 个主题
 * ============================================================ */
const GameSentence = {
  questions: [],
  index: 0,
  correct: 0,
  onFinish: null,
  current: null,
  placed: [],
  mode: "order",  // "order" 句子排序 / "scenario" 情境选择
  difficulty: "easy",  // easy / normal / hard
  streak: 0,  // 连续答对/答错计数

  // 根据难度获取句子长度范围
  getSentenceLengthRange() {
    if (this.difficulty === "easy") return { min: 2, max: 3 };
    if (this.difficulty === "normal") return { min: 4, max: 5 };
    return { min: 6, max: 10 };
  },

  // 根据难度获取情境选择选项数
  getScenarioOptionCount() {
    if (this.difficulty === "easy") return 2;
    if (this.difficulty === "normal") return 3;
    return 4;
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

  // ---------- 句子排序模式 ----------
  start(difficulty, onFinish) {
    this.mode = "order";
    this.onFinish = onFinish;
    this.difficulty = difficulty || "easy";
    this.index = 0;
    this.correct = 0;
    this.streak = 0;
    this.loadQuestions();
    this.renderQuestion();
  },

  // 根据当前难度加载句子题目
  loadQuestions() {
    const range = this.getSentenceLengthRange();
    const pool = SENTENCES.filter(s => s.parts.length >= range.min && s.parts.length <= range.max);
    this.questions = sample(pool.length > 0 ? pool : SENTENCES, Math.min(10, pool.length > 0 ? pool.length : SENTENCES.length));
  },

  renderQuestion() {
    this.current = this.questions[this.index];
    this.placed = [];
    const total = this.questions.length;
    App.showProgress(this.index + 1, total);

    // 根据难度调整提示
    let hintText = `听句子，把单词排正确：<br/><small>${this.current.hint}</small>`;
    if (this.difficulty === "easy") {
      hintText += ` <br/><small style="color:#ff9800">💡 提示：第一个单词是 "${this.current.parts[0]}"，共${this.current.parts.length}个词</small>`;
    } else if (this.difficulty === "normal") {
      hintText += ` <br/><small style="color:#999">💡 提示：共${this.current.parts.length}个单词</small>`;
    }

    const stage = document.getElementById("stage");
    stage.innerHTML = `
      <div class="sentence-box">
        <p class="q-cn">${hintText}</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;flex-wrap:wrap">
          <button class="btn-replay" id="btnReplay">🔊 再听一遍</button>
          <button class="btn-replay" id="btnClear" style="background:#fff3e0;color:#e65100;border-color:#ffcc80">🔄 清空重选</button>
        </div>
        <div class="sentence-answer" id="answerRow"></div>
        <div class="sentence-pool" id="poolRow"></div>
        <p style="font-size:12px;color:#999;margin-top:8px">💡 点击上方已选单词可取消，或点清空重选</p>
        <button class="btn-primary" id="btnCheck" style="margin-top:8px">✅ 检查</button>
      </div>
    `;

    AudioManager.speak(this.current.audio);
    document.getElementById("btnReplay").onclick = () => {
      AudioManager.speak(this.current.audio);
    };
    // 清空重选按钮
    document.getElementById("btnClear").onclick = () => this.clearAll();

    // 打乱的单词池：正确单词 + 干扰词（根据难度）
    // easy: 0个干扰词, normal: 1个干扰词, hard: 2个干扰词
    const distractorCount = this.difficulty === "easy" ? 0 : (this.difficulty === "normal" ? 1 : 2);
    const allWords = SENTENCES.flatMap(s => s.parts);
    const uniqueWords = [...new Set(allWords)];
    const correctWords = this.current.parts;
    const availableDistractors = uniqueWords.filter(w => !correctWords.includes(w));
    const distractors = sample(availableDistractors, Math.min(distractorCount, availableDistractors.length));
    const poolWords = shuffle([...correctWords, ...distractors]);

    const poolRow = document.getElementById("poolRow");
    poolWords.forEach(word => {
      const btn = document.createElement("button");
      btn.className = "word-chip";
      btn.textContent = word;
      btn.onclick = () => this.pickWord(btn, word);
      poolRow.appendChild(btn);
    });

    document.getElementById("btnCheck").onclick = () => this.check();
  },

  pickWord(btn, word) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.classList.add("used");
    const placedItem = { word, btn };
    this.placed.push(placedItem);

    const answerRow = document.getElementById("answerRow");
    const chip = document.createElement("span");
    chip.className = "word-chip placed";
    chip.textContent = word;
    chip.title = "点击取消";
    // 点已放置的单词可以撤回
    chip.onclick = () => {
      chip.remove();
      btn.disabled = false;
      btn.classList.remove("used");
      // 从 placed 数组中移除该项（用对象引用比较，准确移除）
      this.placed = this.placed.filter(p => p !== placedItem);
    };
    answerRow.appendChild(chip);
  },

  // 清空所有已选单词，重新开始本题
  clearAll() {
    const answerRow = document.getElementById("answerRow");
    answerRow.innerHTML = "";
    answerRow.classList.remove("right", "wrong");
    // 恢复所有单词池按钮
    this.placed.forEach(p => {
      p.btn.disabled = false;
      p.btn.classList.remove("used");
    });
    this.placed = [];
  },

  check() {
    const typed = this.placed.map(p => p.word).join(" ");
    const answer = this.current.parts.join(" ");
    const answerRow = document.getElementById("answerRow");

    if (typed === answer) {
      this.correct++;
      this.adjustDifficulty(true);
      answerRow.classList.add("right");
      AudioManager.speak(answer + "! perfect!");
      setTimeout(() => this.next(), 1200);
    } else {
      this.adjustDifficulty(false);
      answerRow.classList.add("wrong");
      AudioManager.speak("not quite, try again!");
      // 清空已放置，重来
      setTimeout(() => this.renderQuestion(), 1000);
    }
  },

  next() {
    this.index++;
    if (this.index >= this.questions.length) {
      if (this.onFinish) this.onFinish(this.correct, this.questions.length);
    } else {
      // 难度可能变化，每3题重新加载符合当前难度的题目
      if (this.index % 3 === 0) {
        if (this.mode === "scenario") this.loadScenarioQuestions();
        else this.loadQuestions();
      }
      if (this.mode === "scenario") this.renderScenario();
      else this.renderQuestion();
    }
  },

  // ---------- 情境选择模式 ----------
  /*
   * 情境选择玩法：
   *   1. 显示一个中文情境描述（如"你想说'我饿了'"）
   *   2. 给出4个英文句子选项，只有一个是正确的
   *   3. 儿童点击正确答案得分，答错显示正确答案
   *   4. 每轮10题
   */
  startScenario(difficulty, onFinish) {
    this.mode = "scenario";
    this.onFinish = onFinish;
    this.difficulty = difficulty || "easy";
    this.index = 0;
    this.correct = 0;
    this.streak = 0;
    this.loadScenarioQuestions();
    this.renderScenario();
  },

  // 根据当前难度加载情境选择题目
  loadScenarioQuestions() {
    this.questions = sample(SENTENCES, Math.min(10, SENTENCES.length));
  },

  // 渲染一道情境选择题
  renderScenario() {
    this.current = this.questions[this.index];
    const total = this.questions.length;
    App.showProgress(this.index + 1, total);

    // 停止上一题发音，自动播放当前题正确答案
    AudioManager.stop();
    setTimeout(() => AudioManager.speak(this.current.audio), 100);

    // 生成选项：1个正确 + 干扰（根据难度：简单2选项，中等3选项，困难4选项）
    const optionCount = this.getScenarioOptionCount();
    const distractorCount = optionCount - 1;
    const distractors = sample(
      SENTENCES.filter(s => s.id !== this.current.id),
      distractorCount
    );
    const options = shuffle([this.current, ...distractors]);

    const stage = document.getElementById("stage");
    stage.innerHTML = `
      <div class="scenario-box">
        <p class="q-cn">根据情境选正确的句子</p>
        <div class="scenario-desc">
          情境：${this.current.hint}
        </div>
        <button class="btn-replay" id="btnReplay">🔊 听正确答案</button>
        <div class="scenario-options" id="scenarioOptions"></div>
      </div>
    `;

    // 重播按钮：播放正确答案的发音
    document.getElementById("btnReplay").onclick = () => {
      AudioManager.speak(this.current.audio);
    };

    // 渲染4个选项
    const box = document.getElementById("scenarioOptions");
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "scenario-option";
      btn.textContent = opt.audio;
      btn.onclick = () => this.handleScenarioPick(btn, opt);
      box.appendChild(btn);
    });
  },

  // 处理情境选择的点击
  handleScenarioPick(btnEl, picked) {
    const correct = picked.id === this.current.id;

    if (correct) {
      // 答对：变绿、计分、播放鼓励
      this.correct++;
      this.adjustDifficulty(true);
      btnEl.classList.add("right");
      AudioManager.speak(this.current.audio + "! correct!");
      setTimeout(() => this.next(), 1200);
    } else {
      // 答错：变红，高亮正确答案，播放提示
      this.adjustDifficulty(false);
      btnEl.classList.add("wrong");
      AudioManager.speak("not quite! the answer is " + this.current.audio);
      // 找到正确答案的按钮并高亮
      const allBtns = document.querySelectorAll(".scenario-option");
      allBtns.forEach(b => {
        if (b.textContent === this.current.audio) {
          b.classList.add("right");
        }
      });
      setTimeout(() => this.next(), 2000);
    }
  }
};
