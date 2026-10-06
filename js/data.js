/* ============================================================
 * data.js —— 题库模块（词汇 + 短句 + 工具函数）
 *
 * 词汇库（THEMES）：
 *   8 个主题，合计 160 个词汇
 *   - animals   动物（20词）
 *   - fruits    水果（20词）
 *   - colors    颜色（15词，含color字段用于颜色块渲染）
 *   - food      食物（18词）
 *   - vehicles  交通工具（20词）
 *   - body      身体（20词）
 *   - family    家庭（20词）
 *   - actions   动作（27词）
 *
 * 短句库（SENTENCES）：
 *   30 个短句/情境表达，覆盖 8 个主题
 *   每个句子包含：id, theme, parts（拆分成分）, audio（完整发音）, hint（中文提示）
 *   用于句子排序和情境选择两种任务
 *
 * 工具函数：
 *   getThemesByLevel(level)    - 根据档次获取主题列表
 *   getSentencesByLevel(level)  - 根据档次获取句子列表
 *   sample(arr, n)              - 从数组随机取n个不重复元素
 *   shuffle(arr)                - 打乱数组顺序
 *   renderWordImage(word, size) - 渲染单词图片（颜色主题用颜色块，其他用emoji）
 *
 * 单词数据结构：
 *   { en: "cat", zh: "猫", emoji: "🐱", color: "#e53935" }
 *   - en:    英文单词
 *   - zh:    中文释义
 *   - emoji: emoji图标（非颜色主题用）
 *   - color: 颜色值（仅颜色主题有，用于CSS颜色块渲染）
 * ============================================================ */
// ---------- 低档：3 个主题，每个 10 个词 ----------
// 中档在此基础上增加 2 个主题（食物、交通工具）
// 高档再增加 3 个主题（身体、家庭、动作）+ 短句

const THEMES = [
  {
    id: "animals",
    name: "动物",
    icon: "🐾",
    words: [
      { en: "cat",    zh: "猫",   emoji: "🐱" },
      { en: "dog",    zh: "狗",   emoji: "🐶" },
      { en: "duck",   zh: "鸭子", emoji: "🦆" },
      { en: "rabbit", zh: "兔子", emoji: "🐰" },
      { en: "fish",   zh: "鱼",   emoji: "🐟" },
      { en: "bird",   zh: "鸟",   emoji: "🐦" },
      { en: "bear",   zh: "熊",   emoji: "🐻" },
      { en: "panda",  zh: "熊猫", emoji: "🐼" },
      { en: "monkey", zh: "猴子", emoji: "🐵" },
      { en: "elephant", zh: "大象", emoji: "🐘" },
      { en: "tiger",   zh: "老虎", emoji: "🐯" },
      { en: "lion",    zh: "狮子", emoji: "🦁" },
      { en: "horse",   zh: "马",   emoji: "🐴" },
      { en: "cow",     zh: "奶牛", emoji: "🐮" },
      { en: "pig",     zh: "猪",   emoji: "🐷" },
      { en: "sheep",   zh: "绵羊", emoji: "🐑" },
      { en: "chicken", zh: "鸡",   emoji: "🐔" },
      { en: "frog",    zh: "青蛙", emoji: "🐸" },
      { en: "bee",     zh: "蜜蜂", emoji: "🐝" }
    ]
  },
  {
    id: "fruits",
    name: "水果",
    icon: "🍎",
    words: [
      { en: "apple",  zh: "苹果", emoji: "🍎" },
      { en: "banana", zh: "香蕉", emoji: "🍌" },
      { en: "orange", zh: "橙子", emoji: "🍊" },
      { en: "grape",  zh: "葡萄", emoji: "🍇" },
      { en: "watermelon", zh: "西瓜", emoji: "🍉" },
      { en: "strawberry", zh: "草莓", emoji: "🍓" },
      { en: "peach",  zh: "桃子", emoji: "🍑" },
      { en: "pear",   zh: "梨",   emoji: "🍐" },
      { en: "lemon",  zh: "柠檬", emoji: "🍋" },
      { en: "cherry", zh: "樱桃", emoji: "🍒" },
      { en: "mango",  zh: "芒果", emoji: "🥭" },
      { en: "pineapple", zh: "菠萝", emoji: "🍍" },
      { en: "coconut", zh: "椰子", emoji: "🥥" },
      { en: "kiwi",   zh: "猕猴桃", emoji: "🥝" },
      { en: "melon",  zh: "甜瓜", emoji: "🍈" },
      { en: "plum",   zh: "李子", emoji: "🫐" },
      { en: "date",   zh: "枣",   emoji: "🌴" },
      { en: "fig",    zh: "无花果", emoji: "🍃" },
      { en: "avocado", zh: "牛油果", emoji: "🥑" }
    ]
  },
  {
    id: "colors",
    name: "颜色",
    icon: "🎨",
    words: [
      { en: "red",    zh: "红色", emoji: "🔴", color: "#e53935" },
      { en: "blue",   zh: "蓝色", emoji: "🔵", color: "#1e88e5" },
      { en: "yellow", zh: "黄色", emoji: "🟡", color: "#fdd835" },
      { en: "green",  zh: "绿色", emoji: "🟢", color: "#43a047" },
      { en: "purple", zh: "紫色", emoji: "🟣", color: "#8e24aa" },
      { en: "orange", zh: "橙色", emoji: "🟠", color: "#fb8c00" },
      { en: "pink",   zh: "粉色", emoji: "🌸", color: "#f48fb1" },
      { en: "black",  zh: "黑色", emoji: "⚫", color: "#212121" },
      { en: "white",  zh: "白色", emoji: "⚪", color: "#fafafa" },
      { en: "brown",  zh: "棕色", emoji: "🟤", color: "#6d4c41" },
      { en: "gray",   zh: "灰色", emoji: "🐘", color: "#9e9e9e" },
      { en: "gold",   zh: "金色", emoji: "🏆", color: "#ffd700" },
      { en: "silver", zh: "银色", emoji: "🥈", color: "#c0c0c0" },
      { en: "navy",   zh: "藏青", emoji: "🌊", color: "#1a237e" }
    ]
  },
  // ===== 中档新增：食物、交通工具 =====
  {
    id: "food",
    name: "食物",
    icon: "🍔",
    words: [
      { en: "bread",  zh: "面包", emoji: "🍞" },
      { en: "milk",   zh: "牛奶", emoji: "🥛" },
      { en: "egg",    zh: "鸡蛋", emoji: "🥚" },
      { en: "cake",   zh: "蛋糕", emoji: "🍰" },
      { en: "rice",   zh: "米饭", emoji: "🍚" },
      { en: "noodle", zh: "面条", emoji: "🍜" },
      { en: "candy",  zh: "糖果", emoji: "🍬" },
      { en: "icecream", zh: "冰淇淋", emoji: "🍦" },
      { en: "cheese", zh: "奶酪", emoji: "🧀" },
      { en: "juice",  zh: "果汁", emoji: "🧃" },
      { en: "cookie", zh: "饼干", emoji: "🍪" },
      { en: "pizza",  zh: "披萨", emoji: "🍕" },
      { en: "hamburger", zh: "汉堡", emoji: "🍔" },
      { en: "hotdog", zh: "热狗", emoji: "🌭" },
      { en: "fries",  zh: "薯条", emoji: "🍟" },
      { en: "soup",   zh: "汤",   emoji: "🍲" },
      { en: "salad",  zh: "沙拉", emoji: "🥗" },
      { en: "sandwich", zh: "三明治", emoji: "🥪" },
      { en: "donut",  zh: "甜甜圈", emoji: "🍩" },
      { en: "popcorn", zh: "爆米花", emoji: "🍿" },
      { en: "chocolate", zh: "巧克力", emoji: "🍫" },
      { en: "yogurt",  zh: "酸奶", emoji: "🥛" },
      { en: "butter",  zh: "黄油", emoji: "🧈" }
    ]
  },
  {
    id: "vehicles",
    name: "交通工具",
    icon: "🚗",
    words: [
      { en: "car",     zh: "汽车", emoji: "🚗" },
      { en: "bus",     zh: "公交车", emoji: "🚌" },
      { en: "bike",    zh: "自行车", emoji: "🚲" },
      { en: "train",   zh: "火车", emoji: "🚆" },
      { en: "plane",   zh: "飞机", emoji: "✈️" },
      { en: "ship",    zh: "轮船", emoji: "🚢" },
      { en: "taxi",    zh: "出租车", emoji: "🚕" },
      { en: "truck",   zh: "卡车", emoji: "🚚" },
      { en: "motorcycle", zh: "摩托车", emoji: "🏍️" },
      { en: "subway",  zh: "地铁", emoji: "🚇" },
      { en: "boat",    zh: "小船", emoji: "⛵" },
      { en: "rocket",  zh: "火箭", emoji: "🚀" },
      { en: "ambulance", zh: "救护车", emoji: "🚑" },
      { en: "police",  zh: "警车", emoji: "🚓" },
      { en: "fireengine", zh: "消防车", emoji: "🚒" },
      { en: "helicopter", zh: "直升机", emoji: "🚁" },
      { en: "scooter", zh: "滑板车", emoji: "🛴" },
      { en: "tractor", zh: "拖拉机", emoji: "🚜" },
      { en: "van",    zh: "面包车", emoji: "🚐" },
      { en: "jeep",   zh: "吉普车", emoji: "🚙" }
    ]
  },
  // ===== 高档新增：身体、家庭、动作 =====
  {
    id: "body",
    name: "身体",
    icon: "👤",
    words: [
      { en: "head",    zh: "头",   emoji: "🗣️" },
      { en: "eye",     zh: "眼睛", emoji: "👁️" },
      { en: "nose",    zh: "鼻子", emoji: "👃" },
      { en: "mouth",   zh: "嘴巴", emoji: "👄" },
      { en: "ear",     zh: "耳朵", emoji: "👂" },
      { en: "hand",    zh: "手",   emoji: "✋" },
      { en: "foot",    zh: "脚",   emoji: "🦶" },
      { en: "hair",    zh: "头发", emoji: "💇" },
      { en: "face",    zh: "脸",   emoji: "😊" },
      { en: "teeth",   zh: "牙齿", emoji: "🦷" },
      { en: "arm",     zh: "手臂", emoji: "💪" },
      { en: "leg",     zh: "腿",   emoji: "🦵" },
      { en: "finger",  zh: "手指", emoji: "👆" },
      { en: "tooth",   zh: "牙齿", emoji: "🦷" },
      { en: "knee",    zh: "膝盖", emoji: "🦵" },
      { en: "elbow",   zh: "手肘", emoji: "💪" },
      { en: "shoulder", zh: "肩膀", emoji: "🧍" },
      { en: "back",    zh: "后背", emoji: "🔙" },
      { en: "neck",    zh: "脖子", emoji: "🧣" },
      { en: "tongue",  zh: "舌头", emoji: "👅" }
    ]
  },
  {
    id: "family",
    name: "家庭",
    icon: "👨‍👩‍👧",
    words: [
      { en: "father",  zh: "爸爸", emoji: "👨" },
      { en: "mother",  zh: "妈妈", emoji: "👩" },
      { en: "brother", zh: "兄弟", emoji: "👦" },
      { en: "sister",  zh: "姐妹", emoji: "👧" },
      { en: "baby",    zh: "宝宝", emoji: "👶" },
      { en: "grandpa", zh: "爷爷", emoji: "👴" },
      { en: "grandma", zh: "奶奶", emoji: "👵" },
      { en: "uncle",   zh: "叔叔", emoji: "🧔" },
      { en: "aunt",    zh: "阿姨", emoji: "👩" },
      { en: "family",  zh: "家庭", emoji: "👨‍👩‍👧‍👦" },
      { en: "son",     zh: "儿子", emoji: "👦" },
      { en: "daughter", zh: "女儿", emoji: "👧" },
      { en: "cousin",  zh: "堂兄妹", emoji: "🧒" },
      { en: "parents", zh: "父母", emoji: "👫" },
      { en: "friend",  zh: "朋友", emoji: "🤝" },
      { en: "grandpa", zh: "爷爷", emoji: "👴" },
      { en: "grandma", zh: "奶奶", emoji: "👵" },
      { en: "nephew",  zh: "侄子", emoji: "👦" },
      { en: "niece",   zh: "侄女", emoji: "👧" },
      { en: "twins",   zh: "双胞胎", emoji: "👯" }
    ]
  },
  {
    id: "actions",
    name: "动作",
    icon: "🏃",
    words: [
      { en: "run",     zh: "跑",   emoji: "🏃" },
      { en: "jump",    zh: "跳",   emoji: "🤸" },
      { en: "walk",    zh: "走",   emoji: "🚶" },
      { en: "swim",    zh: "游泳", emoji: "🏊" },
      { en: "dance",   zh: "跳舞", emoji: "💃" },
      { en: "sing",    zh: "唱歌", emoji: "🎤" },
      { en: "read",    zh: "读书", emoji: "📖" },
      { en: "write",   zh: "写字", emoji: "✏️" },
      { en: "eat",     zh: "吃",   emoji: "🍽️" },
      { en: "drink",   zh: "喝",   emoji: "🥤" },
      { en: "sleep",   zh: "睡觉", emoji: "😴" },
      { en: "play",    zh: "玩",   emoji: "🎮" },
      { en: "climb",   zh: "爬",   emoji: "🧗" },
      { en: "fly",     zh: "飞",   emoji: "🦅" },
      { en: "draw",    zh: "画画", emoji: "🎨" },
      { en: "cook",    zh: "做饭", emoji: "👨‍🍳" },
      { en: "clean",   zh: "打扫", emoji: "🧹" },
      { en: "wash",    zh: "洗",   emoji: "🧼" },
      { en: "drive",   zh: "开车", emoji: "🚗" },
      { en: "ride",    zh: "骑",   emoji: "🚲" },
      { en: "laugh",   zh: "笑",   emoji: "😄" },
      { en: "cry",     zh: "哭",   emoji: "😢" },
      { en: "think",   zh: "思考", emoji: "🤔" },
      { en: "listen",  zh: "听",   emoji: "👂" },
      { en: "watch",   zh: "看",   emoji: "👀" }
    ]
  }
];

// ---------- 高档：短句/情境表达库 ----------
// 用于"句子排序"和"情境选择"任务
const SENTENCES = [
  {
    id: "s1",
    theme: "animals",
    parts: ["I", "see", "a", "cat"],
    audio: "I see a cat.",
    hint: "我看到一只猫。"
  },
  {
    id: "s2",
    theme: "animals",
    parts: ["The", "dog", "is", "big"],
    audio: "The dog is big.",
    hint: "这只狗很大。"
  },
  {
    id: "s3",
    theme: "animals",
    parts: ["I", "like", "rabbits"],
    audio: "I like rabbits.",
    hint: "我喜欢兔子。"
  },
  {
    id: "s4",
    theme: "fruits",
    parts: ["I", "want", "an", "apple"],
    audio: "I want an apple.",
    hint: "我想要一个苹果。"
  },
  {
    id: "s5",
    theme: "fruits",
    parts: ["This", "is", "a", "banana"],
    audio: "This is a banana.",
    hint: "这是一根香蕉。"
  },
  {
    id: "s6",
    theme: "fruits",
    parts: ["The", "grape", "is", "purple"],
    audio: "The grape is purple.",
    hint: "葡萄是紫色的。"
  },
  {
    id: "s7",
    theme: "colors",
    parts: ["The", "sky", "is", "blue"],
    audio: "The sky is blue.",
    hint: "天空是蓝色的。"
  },
  {
    id: "s8",
    theme: "colors",
    parts: ["I", "like", "red"],
    audio: "I like red.",
    hint: "我喜欢红色。"
  },
  {
    id: "s9",
    theme: "colors",
    parts: ["The", "grass", "is", "green"],
    audio: "The grass is green.",
    hint: "草是绿色的。"
  },
  {
    id: "s10",
    theme: "food",
    parts: ["I", "am", "hungry"],
    audio: "I am hungry.",
    hint: "我饿了。"
  },
  {
    id: "s11",
    theme: "food",
    parts: ["I", "want", "some", "milk"],
    audio: "I want some milk.",
    hint: "我想要一些牛奶。"
  },
  {
    id: "s12",
    theme: "food",
    parts: ["The", "cake", "is", "yummy"],
    audio: "The cake is yummy.",
    hint: "蛋糕很好吃。"
  },
  {
    id: "s13",
    theme: "vehicles",
    parts: ["I", "go", "by", "bus"],
    audio: "I go by bus.",
    hint: "我坐公交车去。"
  },
  {
    id: "s14",
    theme: "vehicles",
    parts: ["The", "plane", "is", "fast"],
    audio: "The plane is fast.",
    hint: "飞机很快。"
  },
  {
    id: "s15",
    theme: "vehicles",
    parts: ["Let", "us", "go", "by", "train"],
    audio: "Let us go by train.",
    hint: "我们坐火车去吧。"
  },
  {
    id: "s16",
    theme: "body",
    parts: ["I", "have", "two", "eyes"],
    audio: "I have two eyes.",
    hint: "我有两只眼睛。"
  },
  {
    id: "s17",
    theme: "body",
    parts: ["Touch", "your", "nose"],
    audio: "Touch your nose.",
    hint: "摸你的鼻子。"
  },
  {
    id: "s18",
    theme: "body",
    parts: ["Wave", "your", "hand"],
    audio: "Wave your hand.",
    hint: "挥挥手。"
  },
  {
    id: "s19",
    theme: "family",
    parts: ["This", "is", "my", "mother"],
    audio: "This is my mother.",
    hint: "这是我妈妈。"
  },
  {
    id: "s20",
    theme: "family",
    parts: ["I", "love", "my", "family"],
    audio: "I love my family.",
    hint: "我爱我的家人。"
  },
  {
    id: "s21",
    theme: "family",
    parts: ["She", "is", "my", "sister"],
    audio: "She is my sister.",
    hint: "她是我姐姐/妹妹。"
  },
  {
    id: "s22",
    theme: "actions",
    parts: ["I", "can", "run"],
    audio: "I can run.",
    hint: "我会跑。"
  },
  {
    id: "s23",
    theme: "actions",
    parts: ["Let", "us", "play"],
    audio: "Let us play.",
    hint: "我们一起玩吧。"
  },
  {
    id: "s24",
    theme: "actions",
    parts: ["I", "like", "to", "sing"],
    audio: "I like to sing.",
    hint: "我喜欢唱歌。"
  },
  {
    id: "s25",
    theme: "actions",
    parts: ["Time", "to", "sleep"],
    audio: "Time to sleep.",
    hint: "该睡觉了。"
  },
  {
    id: "s26",
    theme: "animals",
    parts: ["The", "fish", "can", "swim"],
    audio: "The fish can swim.",
    hint: "鱼会游泳。"
  },
  {
    id: "s27",
    theme: "food",
    parts: ["Have", "some", "juice"],
    audio: "Have some juice.",
    hint: "喝点果汁吧。"
  },
  {
    id: "s28",
    theme: "colors",
    parts: ["I", "see", "a", "yellow", "star"],
    audio: "I see a yellow star.",
    hint: "我看到一颗黄色的星星。"
  },
  {
    id: "s29",
    theme: "family",
    parts: ["My", "dad", "is", "tall"],
    audio: "My dad is tall.",
    hint: "我爸爸很高。"
  },
  {
    id: "s30",
    theme: "vehicles",
    parts: ["The", "taxi", "is", "coming"],
    audio: "The taxi is coming.",
    hint: "出租车来了。"
  }
];

// ---------- 工具函数 ----------
// 根据档次获取主题数量：低档=3，中档=5，高档=全部
function getThemesByLevel(level) {
  if (level === "low")  return THEMES.slice(0, 3);
  if (level === "mid")  return THEMES.slice(0, 5);
  return THEMES; // high
}

// 根据档次获取句子数量（低档/中档不需要句子）
function getSentencesByLevel(level) {
  if (level === "high") return SENTENCES;
  return [];
}

// 从数组中随机取 n 个元素（不重复）
function sample(arr, n) {
  const copy = arr.slice();
  const result = [];
  while (result.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// 打乱数组顺序
function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* 渲染单词图片：颜色主题用纯颜色块，其他用emoji */
function renderWordImage(word, size) {
  if (word.color) {
    return '<div class="color-block" style="background:' + word.color + '"></div>';
  }
  return '<span class="emoji">' + word.emoji + '</span>';
}