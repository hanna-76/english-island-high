/* ============================================================
 * audio.js —— 音频模块（英语发音控制）
 *
 * 发音方案：
 *   主方案：有道翻译 TTS 在线接口
 *     URL: https://dict.youdao.com/dictvoice?audio=单词&type=2
 *     type=1 英式发音，type=2 美式发音
 *     优点：不依赖浏览器语音合成，微信/安卓浏览器/iOS 都能发音
 *
 *   备用方案：浏览器 Web Speech API（语音合成）
 *     当在线接口加载失败时自动回退
 *     优先选择 en-US 女声发音人
 *
 * 功能说明：
 *   1. speak(text, onEnd) - 朗读一段英文
 *   2. stop() - 停止当前朗读
 *   3. toggleMute() - 切换静音状态，持久化到 localStorage
 *   4. init() - 初始化，读取静音状态，预加载发音人
 *
 * 状态变量：
 *   muted  - 是否静音
 *   rate   - 语速（备用方案用，0.85 儿童模式放慢）
 *   voice  - 选中的英语发音人（备用方案用）
 *   audio  - HTML5 Audio 对象（主方案用）
 *   ttsType - TTS发音类型（1=英式，2=美式）
 * ============================================================ */
const AudioManager = {
  muted: false,
  rate: 0.85,
  voice: null,
  audio: null,
  ttsType: 2,

  init() {
    this.muted = localStorage.getItem("ei_muted") === "1";
    this.audio = new Audio();
    this.audio.preload = "auto";

    const pickVoice = () => {
      const voices = window.speechSynthesis
        ? window.speechSynthesis.getVoices()
        : [];
      this.voice =
        voices.find(v => /en[-_]US/i.test(v.lang) && /female|samantha|zira|google us english/i.test(v.name)) ||
        voices.find(v => /en[-_]US/i.test(v.lang)) ||
        voices.find(v => /^en/i.test(v.lang)) ||
        null;
    };
    pickVoice();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = pickVoice;
    }
  },

  speak(text, onEnd) {
    if (this.muted) {
      if (onEnd) onEnd();
      return;
    }
    this.stop();

    const encodedText = encodeURIComponent(text);
    const url = `https://dict.youdao.com/dictvoice?audio=${encodedText}&type=${this.ttsType}`;

    this.audio.onended = null;
    this.audio.onerror = null;

    this.audio.onended = () => {
      if (onEnd) onEnd();
    };

    this.audio.onerror = () => {
      this.speakFallback(text, onEnd);
    };

    try {
      this.audio.src = url;
      this.audio.play().catch(() => {
        this.speakFallback(text, onEnd);
      });
    } catch (e) {
      this.speakFallback(text, onEnd);
    }
  },

  speakFallback(text, onEnd) {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = this.rate;
    if (this.voice) utter.voice = this.voice;
    if (onEnd) {
      utter.onend = onEnd;
      utter.onerror = onEnd;
    }
    window.speechSynthesis.speak(utter);
  },

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("ei_muted", this.muted ? "1" : "0");
    if (this.muted) this.stop();
    return this.muted;
  }
};
