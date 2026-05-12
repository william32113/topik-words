const APP_VERSION = "v1.12";
const STORAGE_KEY = "topik-words-state-v3";
const LEGACY_STORAGE_KEYS = ["topik-words-state-v2", "topik-words-state-v1"];
const AUTO_UPDATE_KEY = "topik-words-auto-update";
const PROGRESS_SCHEMA_VERSION = 1;
const MAX_FAMILIARITY = 5;
const REVIEW_DELAY_MS = 24 * 60 * 60 * 1000;
const WORDS_PER_PAGE = 12;

const topicDefinitions = [
  {
    id: "daily",
    label: "日常作息",
    description: "先學今天、現在、吃飯、睡覺這類每天都會遇到的字。",
    terms: ["오늘", "내일", "지금", "아침", "점심", "저녁", "밥", "물", "자다", "일어나다", "가다", "오다"]
  },
  {
    id: "school",
    label: "學校上課",
    description: "把去學校、上課、老師、同學相關的高頻字集中練。",
    terms: ["학교", "학생", "선생님", "교실", "공부", "책", "공책", "교과서", "문제", "시험"]
  },
  {
    id: "food",
    label: "吃飯點餐",
    description: "從餐廳和咖啡店最常遇到的名詞與動作開始。",
    terms: ["식당", "커피", "차", "물", "밥", "김치", "갈비", "설탕", "숟가락", "젓가락", "먹다", "마시다"]
  },
  {
    id: "transport",
    label: "交通移動",
    description: "學會搭車、走路、換乘、出發這些外出必備字。",
    terms: ["버스", "지하철", "택시", "기차", "비행기", "길", "거리", "걷다", "걸어가다", "갈아타다", "오다", "가다"]
  },
  {
    id: "shopping",
    label: "購物付款",
    description: "把價格、商店、衣服和買東西時常用的字先練熟。",
    terms: ["가게", "가격", "돈", "시장", "백화점", "옷", "치마", "바지", "사다", "입다", "카드", "가방"]
  },
  {
    id: "family",
    label: "家人朋友",
    description: "先建立介紹自己、家人和朋友時最容易用到的字。",
    terms: ["가족", "엄마", "아버지", "아빠", "언니", "누나", "형", "동생", "친구", "이름", "집", "같이"]
  }
];

const politeExampleOverrides = {
  "학교에 가다": "학교에 가요.",
  "가게에 가다": "가게에 가요.",
  "집에 오다": "집에 와요.",
  "밥을 먹다": "밥을 먹어요.",
  "물을 마시다": "물을 마셔요.",
  "버스를 기다리다": "버스를 기다려요.",
  "버스를 타다": "버스를 타요.",
  "공부를 하다": "공부해요.",
  "교실에 들어가다": "교실에 들어가요.",
  "친구를 만나다": "친구를 만나요.",
  "옷을 갈아입다": "옷을 갈아입어요.",
  "기차를 갈아타다": "기차를 갈아타요.",
  "길을 건너다": "길을 건너요.",
  "길을 건너가다": "길을 건너가요.",
  "학교에 걸어가다": "학교에 걸어가요.",
  "집에 걸어오다": "집에 걸어와요.",
  "갈비를 먹다": "갈비를 먹어요.",
  "갈비탕을 먹다": "갈비탕을 먹어요.",
  "감기약을 먹다": "감기약을 먹어요.",
  "눈을 감다": "눈을 감아요.",
  "머리를 감다": "머리를 감아요.",
  "거울을 보다": "거울을 봐요.",
  "경치가 좋다": "경치가 좋아요.",
  "손가락이 가늘다": "손가락이 가늘어요.",
  "가격이 비싸다": "가격이 비싸요.",
  "거리가 가깝다": "거리가 가까워요.",
  "짐이 가볍다": "짐이 가벼워요.",
  "같이 살다": "같이 살아요.",
  "돈을 갚다": "돈을 갚아요.",
  "한국에 계시다": "한국에 계세요."
};

const directPoliteForms = {
  "가다": "가요",
  "오다": "와요",
  "보다": "봐요",
  "주다": "줘요",
  "자다": "자요",
  "사다": "사요",
  "타다": "타요",
  "메다": "메요",
  "하다": "해요",
  "되다": "돼요",
  "있다": "있어요",
  "없다": "없어요",
  "마시다": "마셔요",
  "기다리다": "기다려요",
  "가르치다": "가르쳐요",
  "걸리다": "걸려요",
  "만나다": "만나요",
  "먹다": "먹어요",
  "입다": "입어요",
  "감다": "감아요",
  "걷다": "걸어요",
  "읽다": "읽어요",
  "듣다": "들어요",
  "갈아타다": "갈아타요",
  "갈아입다": "갈아입어요",
  "가져오다": "가져와요",
  "가져가다": "가져가요",
  "계시다": "계세요",
  "가깝다": "가까워요",
  "가볍다": "가벼워요",
  "귀엽다": "귀여워요",
  "좋다": "좋아요",
  "같다": "같아요",
  "괜찮다": "괜찮아요",
  "비싸다": "비싸요"
};

const state = {
  words: [],
  selectedLevel: "topik1",
  filter: "all",
  search: "",
  currentPage: 1,
  favorites: new Set(),
  progress: {},
  progressSchemaVersion: PROGRESS_SCHEMA_VERSION,
  speech: {
    voices: [],
    initialized: false
  },
  flashcards: {
    mode: "all",
    deck: [],
    index: 0,
    revealed: false
  },
  quiz: {
    deck: [],
    index: 0,
    score: 0,
    answered: false
  },
  recall: {
    title: "中文 -> 韓文",
    deck: [],
    index: 0,
    revealed: false
  }
};

const levelLabels = {
  topik1: "TOPIK 1",
  topik2: "TOPIK 2",
  topik3: "TOPIK 3",
  topik4: "TOPIK 4",
  topik5: "TOPIK 5",
  topik6: "TOPIK 6"
};

function getAvailableLevels() {
  const discovered = [...new Set(state.words.map((word) => word.level))];
  return discovered.length ? discovered : Object.keys(levelLabels);
}

const els = {
  updateBanner: document.querySelector("#updateBanner"),
  updateBannerText: document.querySelector("#updateBannerText"),
  applyUpdate: document.querySelector("#applyUpdate"),
  wordCount: document.querySelector("#wordCount"),
  dueCount: document.querySelector("#dueCount"),
  masteredCount: document.querySelector("#masteredCount"),
  favoriteCount: document.querySelector("#favoriteCount"),
  reviewedCount: document.querySelector("#reviewedCount"),
  currentVersion: document.querySelector("#currentVersion"),
  latestVersion: document.querySelector("#latestVersion"),
  versionStatus: document.querySelector("#versionStatus"),
  versionApplyUpdate: document.querySelector("#versionApplyUpdate"),
  autoUpdateEnabled: document.querySelector("#autoUpdateEnabled"),
  currentLevelLabel: document.querySelector("#currentLevelLabel"),
  nextStepLabel: document.querySelector("#nextStepLabel"),
  levelTabs: document.querySelector("#levelTabs"),
  searchInput: document.querySelector("#searchInput"),
  listSummary: document.querySelector("#listSummary"),
  pageSummary: document.querySelector("#pageSummary"),
  pageNumbers: document.querySelector("#pageNumbers"),
  prevPage: document.querySelector("#prevPage"),
  nextPage: document.querySelector("#nextPage"),
  wordList: document.querySelector("#wordList"),
  openFlashcard: document.querySelector("#openFlashcard"),
  openRecall: document.querySelector("#openRecall"),
  openQuiz: document.querySelector("#openQuiz"),
  openReview: document.querySelector("#openReview"),
  themeList: document.querySelector("#themeList"),
  overlay: document.querySelector("#overlay"),
  overlayContent: document.querySelector("#overlayContent"),
  closeOverlay: document.querySelector("#closeOverlay"),
  wordCardTemplate: document.querySelector("#wordCardTemplate")
};

let waitingServiceWorker = null;
let refreshingForUpdate = false;
let autoUpdateEnabled = true;
let latestAvailableVersion = APP_VERSION;

async function init() {
  restoreUpdatePreference();
  renderVersionInfo();
  const versionPromise = loadLatestVersion();
  restoreState();
  bindEvents();
  await loadWords();
  normalizeProgress();
  if (!getAvailableLevels().includes(state.selectedLevel)) {
    state.selectedLevel = getAvailableLevels()[0];
  }
  setupSpeechSynthesis();
  renderLevelTabs();
  renderFilters();
  renderDashboard();
  renderThemeList();
  renderWordList();
  await versionPromise;
  registerServiceWorker();
}

function renderVersionInfo() {
  els.currentVersion.textContent = APP_VERSION;
  els.latestVersion.textContent = latestAvailableVersion;
  els.versionStatus.textContent = "\u6b63\u5728\u78ba\u8a8d\u7dda\u4e0a\u6700\u65b0\u7248\u672c...";
  if (els.autoUpdateEnabled) {
    els.autoUpdateEnabled.checked = autoUpdateEnabled;
  }
  syncVersionUpdateButton();
}

async function loadLatestVersion() {
  try {
    const response = await fetch(`version.json?ts=${Date.now()}`, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("version fetch failed");
    }

    const payload = await response.json();
    const latestVersion = payload.version || APP_VERSION;
    latestAvailableVersion = latestVersion;
    els.latestVersion.textContent = latestVersion;

    if (latestVersion === APP_VERSION) {
      els.versionStatus.textContent = getVersionStatusMessage("latest", latestVersion);
    } else {
      els.versionStatus.textContent = getVersionStatusMessage("update-available", latestVersion);
    }

    syncVersionUpdateButton();
  } catch {
    latestAvailableVersion = "\u7121\u6cd5\u78ba\u8a8d";
    els.latestVersion.textContent = "\u7121\u6cd5\u78ba\u8a8d";
    els.versionStatus.textContent = getVersionStatusMessage("check-failed");
    syncVersionUpdateButton();
  }
}

function syncVersionUpdateButton() {
  if (!els.versionApplyUpdate) return;
  const shouldShow =
    latestAvailableVersion !== APP_VERSION && latestAvailableVersion !== "\u7121\u6cd5\u78ba\u8a8d";
  els.versionApplyUpdate.classList.toggle("hidden", !shouldShow);
}

function restoreUpdatePreference() {
  try {
    const saved = localStorage.getItem(AUTO_UPDATE_KEY);
    if (saved === null) {
      autoUpdateEnabled = true;
      return;
    }
    autoUpdateEnabled = saved === "true";
  } catch {
    autoUpdateEnabled = true;
  }
}

function persistUpdatePreference() {
  localStorage.setItem(AUTO_UPDATE_KEY, String(autoUpdateEnabled));
}

function getVersionStatusMessage(mode, latestVersion = APP_VERSION) {
  if (mode === "latest") {
    return autoUpdateEnabled
      ? `目前已是最新版本 ${APP_VERSION}，自動更新已開啟。`
      : `目前已是最新版本 ${APP_VERSION}，自動更新已關閉。`;
  }

  if (mode === "update-available") {
    return autoUpdateEnabled
      ? `目前載入 ${APP_VERSION}，線上最新是 ${latestVersion}。已開啟自動更新，也可以按按鈕手動更新。`
      : `目前載入 ${APP_VERSION}，線上最新是 ${latestVersion}。自動更新已關閉，請按按鈕手動更新。`;
  }

  return `目前載入 ${APP_VERSION}，暫時無法確認線上最新版本。`;
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || readLegacyState();
    if (!raw) return;

    const saved = JSON.parse(raw);
    state.selectedLevel = saved.selectedLevel || state.selectedLevel;
    state.filter = saved.filter || state.filter;
    state.search = saved.search || "";
    state.currentPage = Number.isFinite(saved.currentPage) && saved.currentPage > 0 ? saved.currentPage : 1;
    state.favorites = new Set(saved.favorites || []);
    state.progress = saved.progress || {};
    state.progressSchemaVersion = saved.progressSchemaVersion || 0;
    migrateProgressState();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function readLegacyState() {
  for (const key of LEGACY_STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value) {
      return value;
    }
  }
  return null;
}

function migrateProgressState() {
  if (!state.progress || typeof state.progress !== "object") {
    state.progress = {};
  }

  for (const [wordId, progress] of Object.entries(state.progress)) {
    state.progress[wordId] = migrateSingleProgress(progress);
  }

  state.progressSchemaVersion = PROGRESS_SCHEMA_VERSION;
}

function migrateSingleProgress(progress) {
  const base = createEmptyProgress();
  if (!progress || typeof progress !== "object") {
    return base;
  }

  return {
    familiarity: Number.isFinite(progress.familiarity) ? progress.familiarity : base.familiarity,
    correctCount: Number.isFinite(progress.correctCount) ? progress.correctCount : base.correctCount,
    wrongCount: Number.isFinite(progress.wrongCount) ? progress.wrongCount : base.wrongCount,
    reviewCount: Number.isFinite(progress.reviewCount) ? progress.reviewCount : base.reviewCount,
    lastReviewedAt: progress.lastReviewedAt || base.lastReviewedAt,
    nextReviewAt: progress.nextReviewAt || base.nextReviewAt
  };
}

function persistState() {
  const serializable = {
    selectedLevel: state.selectedLevel,
    filter: state.filter,
    search: state.search,
    currentPage: state.currentPage,
    favorites: [...state.favorites],
    progress: state.progress,
    progressSchemaVersion: state.progressSchemaVersion
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

function bindEvents() {
  els.searchInput.value = state.search;
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    state.currentPage = 1;
    persistState();
    renderWordList();
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      state.currentPage = 1;
      persistState();
      renderFilters();
      renderWordList();
    });
  });

  els.prevPage?.addEventListener("click", () => {
    if (state.currentPage <= 1) return;
    state.currentPage -= 1;
    persistState();
    renderWordList();
  });

  els.nextPage?.addEventListener("click", () => {
    const totalPages = getWordListPageCount();
    if (state.currentPage >= totalPages) return;
    state.currentPage += 1;
    persistState();
    renderWordList();
  });

  els.openFlashcard.addEventListener("click", () => openFlashcards("all"));
  els.openRecall.addEventListener("click", () => openRecallStudy(getStudyWords("all"), `${levelLabels[state.selectedLevel]} 中文 -> 韓文`));
  els.openQuiz.addEventListener("click", openQuiz);
  els.openReview.addEventListener("click", () => openFlashcards("review"));
  els.closeOverlay.addEventListener("click", closeOverlay);

  els.overlay.addEventListener("click", (event) => {
    if (event.target === els.overlay) {
      closeOverlay();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.overlay.classList.contains("hidden")) {
      closeOverlay();
    }
  });

  document.addEventListener(
    "pointerdown",
    () => {
      primeSpeechSynthesis();
    },
    { once: true }
  );

  els.applyUpdate.addEventListener("click", applyPendingUpdate);
  els.versionApplyUpdate?.addEventListener("click", applyPendingUpdate);

  els.autoUpdateEnabled?.addEventListener("change", (event) => {
    autoUpdateEnabled = event.target.checked;
    persistUpdatePreference();
    renderVersionInfo();

    const latestVersion = els.latestVersion.textContent || APP_VERSION;
    els.versionStatus.textContent =
      latestVersion === APP_VERSION
        ? getVersionStatusMessage("latest", latestVersion)
        : getVersionStatusMessage("update-available", latestVersion);

    if (waitingServiceWorker && autoUpdateEnabled) {
      applyPendingUpdate();
    }
  });
}

async function loadWords() {
  const response = await fetch("data/sample_topik_vocab.json", { cache: "no-cache" });
  state.words = await response.json();
  els.wordCount.textContent = String(state.words.length);
}

function normalizeProgress() {
  const validWordIds = new Set(state.words.map((word) => word.id));

  for (const wordId of Object.keys(state.progress)) {
    if (!validWordIds.has(wordId)) {
      delete state.progress[wordId];
    }
  }

  state.words.forEach((word) => {
    if (!state.progress[word.id]) {
      state.progress[word.id] = createEmptyProgress();
    }
  });
  persistState();
}

function createEmptyProgress() {
  return {
    familiarity: 0,
    correctCount: 0,
    wrongCount: 0,
    reviewCount: 0,
    lastReviewedAt: null,
    nextReviewAt: null
  };
}

function getProgress(wordId) {
  if (!state.progress[wordId]) {
    state.progress[wordId] = createEmptyProgress();
  }
  return state.progress[wordId];
}

function renderLevelTabs() {
  els.levelTabs.innerHTML = "";

  getAvailableLevels().forEach((level) => {
    const label = levelLabels[level] || level.toUpperCase();
    const button = document.createElement("button");
    button.className = `level-tab${state.selectedLevel === level ? " is-active" : ""}`;
    button.textContent = label;
    button.type = "button";
    button.addEventListener("click", () => {
      state.selectedLevel = level;
      state.currentPage = 1;
      persistState();
      renderLevelTabs();
      renderDashboard();
      renderWordList();
    });
    els.levelTabs.appendChild(button);
  });
}

function renderFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });
}

function renderDashboard() {
  els.favoriteCount.textContent = String(state.favorites.size);
  els.reviewedCount.textContent = String(getReviewedCount());
  els.currentLevelLabel.textContent = levelLabels[state.selectedLevel];
  els.dueCount.textContent = String(getDueWords().length);
  els.masteredCount.textContent = String(getMasteredCount());
  els.nextStepLabel.textContent = getDueWords().length > 0 ? "先練待複習字卡" : "可以開始新單字";
}

function renderThemeList() {
  els.themeList.innerHTML = "";

  topicDefinitions.forEach((topic) => {
    const words = getTopicWords(topic);
    const card = document.createElement("article");
    card.className = "theme-card";
    card.innerHTML = `
      <span class="theme-badge">${topic.label}</span>
      <h4>${topic.label}</h4>
      <p>${topic.description}</p>
      <div class="theme-card__meta">目前可練 ${words.length} 個字</div>
      <div class="theme-card__actions">
        <button class="ghost-button" type="button" data-topic-action="browse" data-topic-id="${topic.id}">看這個主題</button>
        <button class="primary-button" type="button" data-topic-action="recall" data-topic-id="${topic.id}">開始回想練習</button>
      </div>
    `;

    card.querySelectorAll("[data-topic-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const selectedTopic = topicDefinitions.find((entry) => entry.id === button.dataset.topicId);
        if (!selectedTopic) return;
        const topicWords = getTopicWords(selectedTopic);

        if (button.dataset.topicAction === "browse") {
          openTopicOverview(selectedTopic, topicWords);
          return;
        }

        openRecallStudy(topicWords, `${selectedTopic.label} 中文 -> 韓文`);
      });
    });

    els.themeList.appendChild(card);
  });
}

function getTopicWords(topic) {
  const lookup = new Set(topic.terms);
  return state.words.filter((word) => word.level === "topik1" && lookup.has(word.korean));
}

function getVisibleWords() {
  return state.words
    .filter((word) => word.level === state.selectedLevel)
    .filter((word) => {
      if (state.filter === "favorites") {
        return state.favorites.has(word.id);
      }
      if (state.filter === "review") {
        return isDueForReview(word.id);
      }
      return true;
    })
    .filter((word) => {
      if (!state.search) return true;
      const query = state.search.toLowerCase();
      return (
        word.korean.toLowerCase().includes(query) ||
        (word.pronunciation || "").toLowerCase().includes(query) ||
        word.chineseMeaning.toLowerCase().includes(query)
      );
    });
}

function getWordListPageCount() {
  return Math.max(1, Math.ceil(getVisibleWords().length / WORDS_PER_PAGE));
}

function getVisiblePageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function renderWordList() {
  const words = getVisibleWords();
  const totalPages = Math.max(1, Math.ceil(words.length / WORDS_PER_PAGE));
  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }
  const pageStart = (state.currentPage - 1) * WORDS_PER_PAGE;
  const pageWords = words.slice(pageStart, pageStart + WORDS_PER_PAGE);
  els.wordList.innerHTML = "";
  if (els.pageSummary) {
    els.pageSummary.textContent = `第 ${state.currentPage} / ${totalPages} 頁 ・ 每頁 ${WORDS_PER_PAGE} 個`;
  }
  if (els.pageNumbers) {
    els.pageNumbers.innerHTML = "";
    const pageNumbers = getVisiblePageNumbers(state.currentPage, totalPages);

    pageNumbers.forEach((pageNumber) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `ghost-button page-number${pageNumber === state.currentPage ? " is-active" : ""}`;
      button.textContent = String(pageNumber);
      button.addEventListener("click", () => {
        if (pageNumber === state.currentPage) return;
        state.currentPage = pageNumber;
        persistState();
        renderWordList();
      });
      els.pageNumbers.appendChild(button);
    });
  }
  if (els.prevPage) {
    els.prevPage.disabled = state.currentPage <= 1;
  }
  if (els.nextPage) {
    els.nextPage.disabled = state.currentPage >= totalPages;
  }
  els.listSummary.textContent = `${levelLabels[state.selectedLevel]} 目前有 ${words.length} 個符合條件的單字`;

  if (!words.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "這個條件下目前沒有單字，可以換個級數、取消篩選，或先多做幾次練習。";
    els.wordList.appendChild(empty);
    return;
  }

  pageWords.forEach((word) => {
    const progress = getProgress(word.id);
    const fragment = els.wordCardTemplate.content.cloneNode(true);
    const level = fragment.querySelector(".word-level");
    const korean = fragment.querySelector(".word-korean");
    const pronunciation = fragment.querySelector(".word-pronunciation");
    const meaning = fragment.querySelector(".word-meaning");
    const score = fragment.querySelector(".word-score");
    const reviewState = fragment.querySelector(".word-review-state");
    const favoriteButton = fragment.querySelector(".favorite-button");
    const pronounceButton = fragment.querySelector(".pronounce-button");
    const detailButton = fragment.querySelector(".detail-button");

    level.textContent = levelLabels[word.level];
    korean.textContent = word.korean;
    pronunciation.textContent = word.pronunciation || "";
    meaning.textContent = word.chineseMeaning;
    score.textContent = `熟悉度 ${progress.familiarity}/${MAX_FAMILIARITY}`;
    reviewState.textContent = formatReviewState(progress);
    favoriteButton.textContent = state.favorites.has(word.id) ? "♥" : "♡";
    favoriteButton.classList.toggle("is-favorite", state.favorites.has(word.id));

    favoriteButton.addEventListener("click", () => {
      toggleFavorite(word.id);
      renderDashboard();
      renderWordList();
    });
    pronounceButton.addEventListener("click", () => speak(word.korean));
    detailButton.addEventListener("click", () => openDetail(word));

    els.wordList.appendChild(fragment);
  });
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  persistState();
}

function getExampleContent(word) {
  const korean = buildPoliteExample(word);
  const chinese = buildExampleChinese(word);
  return { korean, chinese };
}

function buildPoliteExample(word) {
  const seed = normalizeExampleSeed(word.exampleKorean);

  if (!seed || seed === "-" || seed === "?") {
    return fallbackExample(word);
  }

  if (politeExampleOverrides[seed]) {
    return politeExampleOverrides[seed];
  }

  if (seed.endsWith("?.") || seed.endsWith("?")) {
    return ensureSentencePunctuation(seed);
  }

  return ensureSentencePunctuation(convertExampleSeedToPolite(seed) || fallbackExample(word));
}

function normalizeExampleSeed(example) {
  return String(example || "").replace(/\s+/g, " ").trim();
}

function convertExampleSeedToPolite(seed) {
  if (/^[?-?]+$/.test(seed) && !seed.endsWith("?")) {
    return `${seed}??`;
  }

  const parts = seed.split(" ");
  const last = parts.at(-1);
  if (!last) return "";

  if (last.endsWith("?")) {
    parts[parts.length - 1] = conjugateDictionaryForm(last);
    return parts.join(" ");
  }

  return seed;
}

function conjugateDictionaryForm(word) {
  if (directPoliteForms[word]) {
    return directPoliteForms[word];
  }

  if (!word.endsWith("?")) {
    return word;
  }

  const stem = word.slice(0, -1);
  const lastChar = stem.at(-1);
  if (!lastChar || !/[?-?]/.test(lastChar)) {
    return `${stem}?`;
  }

  const code = lastChar.charCodeAt(0) - 0xac00;
  const jong = code % 28;
  const jung = Math.floor(code / 28) % 21;
  const brightVowels = new Set([0, 8]);

  if (jong === 0 && (jung === 0 || jung === 8)) {
    return `${stem}?`;
  }

  return `${stem}${brightVowels.has(jung) ? "??" : "??"}`;
}

function fallbackExample(word) {
  if (word.korean.endsWith("?")) {
    return conjugateDictionaryForm(word.korean);
  }

  return `${word.korean}??`;
}

function buildExampleChinese(word) {
  const raw = String(word.exampleChinese || "").trim();
  if (!raw || raw === "-") {
    return `\u548c\u300c${word.chineseMeaning}\u300d\u6709\u95dc\u7684\u5e38\u7528\u53e5\u5b50\u3002`;
  }
  if (/[。！？!?]$/.test(raw)) {
    return raw.replace(/\?$/, "？").replace(/!$/, "！");
  }

  const exampleKorean = String(word.exampleKorean || "").trim();
  if (exampleKorean.endsWith("?")) {
    return `${raw}？`;
  }
  if (exampleKorean.endsWith("!")) {
    return `${raw}！`;
  }
  return `${raw}。`;
}

function ensureSentencePunctuation(text) {
  return text.trim().replace(/[.?]+$/, "") + ".";
}

function openDetail(word) {
  const progress = getProgress(word.id);
  const example = getExampleContent(word);
  setOverlayContent(`
    <header class="detail-header">
      <p class="word-level">${levelLabels[word.level]}</p>
      <h2 id="overlayTitle" class="detail-korean">${word.korean}</h2>
      <p class="detail-meta">${[word.pronunciation, word.partOfSpeech].filter(Boolean).join(" | ")}</p>
      <p class="detail-meaning">${word.chineseMeaning}</p>
    </header>
    <div class="detail-actions">
      <button class="primary-button" id="detailSpeak" type="button">\u64ad\u653e\u55ae\u5b57\u767c\u97f3</button>
      <button class="ghost-button" id="detailExampleSpeak" type="button">\u64ad\u653e\u4f8b\u53e5\u767c\u97f3</button>
      <button class="ghost-button" id="detailFavorite" type="button">${state.favorites.has(word.id) ? "\u53d6\u6d88\u6536\u85cf" : "\u52a0\u5165\u6536\u85cf"}</button>
    </div>
    <section class="detail-block">
      <h3>\u5b78\u7fd2\u9032\u5ea6</h3>
      <p class="helper-text">\u719f\u6089\u5ea6 ${progress.familiarity}/${MAX_FAMILIARITY} | \u7df4\u7fd2\u6b21\u6578 ${progress.reviewCount} \u6b21 | ${formatReviewState(progress)}</p>
      <div class="familiarity-row">
        <button class="familiarity-button" type="button" data-score="0" data-word-id="${word.id}" data-action="set-hard">\u4e0d\u719f</button>
        <button class="familiarity-button" type="button" data-score="2" data-word-id="${word.id}" data-action="set-medium">\u666e\u901a</button>
        <button class="familiarity-button" type="button" data-score="4" data-word-id="${word.id}" data-action="set-good">\u719f\u6089</button>
      </div>
    </section>
    <section class="detail-block">
      <h3>\u4f8b\u53e5</h3>
      <p>${example.korean}</p>
      <p class="detail-example">${example.chinese}</p>
    </section>
  `);

  document.querySelector("#detailSpeak").addEventListener("click", () => speak(word.korean));
  document.querySelector("#detailExampleSpeak").addEventListener("click", () => speak(example.korean));
  document.querySelector("#detailFavorite").addEventListener("click", () => {
    toggleFavorite(word.id);
    renderDashboard();
    renderWordList();
    openDetail(word);
  });

  document.querySelectorAll("[data-action^='set-']").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "set-hard") {
        applyReviewResult(word.id, "hard");
      } else if (action === "set-medium") {
        applyReviewResult(word.id, "medium");
      } else {
        applyReviewResult(word.id, "easy");
      }
      renderDashboard();
      renderWordList();
      openDetail(word);
    });
  });

  openOverlay();
}

function openTopicOverview(topic, words) {
  const preview = words
    .slice(0, 12)
    .map(
      (word) => `
        <article class="word-card">
          <div class="word-main">
            <div>
              <p class="word-level">${levelLabels[word.level]}</p>
              <h3 class="word-korean">${word.korean}</h3>
              <p class="word-pronunciation">${word.pronunciation || ""}</p>
            </div>
          </div>
          <p class="word-meaning">${word.chineseMeaning}</p>
        </article>
      `
    )
    .join("");

  setOverlayContent(`
    <div class="study-deck">
      <div>
        <p class="study-progress">生活主題</p>
        <h2 id="overlayTitle" class="study-title">${topic.label}</h2>
        <p class="helper-text">${topic.description}</p>
      </div>
      <div class="study-toolbar">
        <button class="primary-button" id="topicRecall" type="button">開始中文 -> 韓文</button>
      </div>
      <div class="word-list">${preview || '<div class="empty-state">這個主題目前還沒有可用單字。</div>'}</div>
    </div>
  `);

  document.querySelector("#topicRecall")?.addEventListener("click", () => {
    openRecallStudy(words, `${topic.label} 中文 -> 韓文`);
  });

  openOverlay();
}

function getStudyWords(mode = "all") {
  const visible = getVisibleWords();
  if (mode === "review") {
    const dueVisible = visible.filter((word) => isDueForReview(word.id));
    if (dueVisible.length) return dueVisible;
    return state.words.filter((word) => word.level === state.selectedLevel && isDueForReview(word.id));
  }
  if (visible.length) return visible;
  return state.words.filter((word) => word.level === state.selectedLevel);
}

function openFlashcards(mode) {
  const deck = shuffle([...getStudyWords(mode)]);
  state.flashcards.mode = mode;
  state.flashcards.deck = deck;
  state.flashcards.index = 0;
  state.flashcards.revealed = false;
  renderFlashcards();
  openOverlay();
}

function renderFlashcards() {
  const { deck, index, revealed, mode } = state.flashcards;

  if (!deck.length) {
    setOverlayContent(`
      <div class="study-empty">
        <h2 id="overlayTitle" class="study-title">目前沒有可練習的字卡</h2>
        <p class="helper-text">你可以先切回全部單字，或先做幾輪小測驗建立進度。</p>
      </div>
    `);
    return;
  }

  const word = deck[index];
  const progress = getProgress(word.id);
  setOverlayContent(`
    <div class="study-deck">
      <div>
        <p class="study-progress">第 ${index + 1} / ${deck.length} 張 ・ ${mode === "review" ? "重複練習" : "抽認卡"}</p>
        <h2 id="overlayTitle" class="study-title">抽認卡模式</h2>
      </div>
      <section class="flashcard">
        <div>
          <h3>${word.korean}</h3>
          <p>${word.pronunciation || ""}</p>
          <p>${revealed ? word.chineseMeaning : "先想一下意思，再按下方按鈕揭曉。"}</p>
          <p class="helper-text">目前熟悉度 ${progress.familiarity}/${MAX_FAMILIARITY}</p>
        </div>
      </section>
      <div class="study-toolbar">
        <button class="ghost-button" id="flashSpeak" type="button">播放發音</button>
        <button class="primary-button" id="flashReveal" type="button">${revealed ? "顯示評分" : "顯示意思"}</button>
      </div>
      <div class="${revealed ? "" : "hidden"}" id="flashRatingBlock">
        <p class="helper-text">這張卡你現在熟到什麼程度？</p>
        <div class="familiarity-row">
          <button class="familiarity-button" data-score="0" id="flashHard" type="button">還不熟</button>
          <button class="familiarity-button" data-score="2" id="flashMedium" type="button">普通</button>
          <button class="familiarity-button" data-score="4" id="flashEasy" type="button">很熟</button>
        </div>
      </div>
    </div>
  `);

  document.querySelector("#flashSpeak").addEventListener("click", () => speak(word.korean));
  document.querySelector("#flashReveal").addEventListener("click", () => {
    state.flashcards.revealed = true;
    renderFlashcards();
  });
  document.querySelector("#flashHard").addEventListener("click", () => rateFlashcard(word.id, "hard"));
  document.querySelector("#flashMedium").addEventListener("click", () => rateFlashcard(word.id, "medium"));
  document.querySelector("#flashEasy").addEventListener("click", () => rateFlashcard(word.id, "easy"));
}

function rateFlashcard(wordId, result) {
  applyReviewResult(wordId, result);
  advanceFlashcardDeck();
  renderDashboard();
  renderWordList();
  renderFlashcards();
}

function advanceFlashcardDeck() {
  if (state.flashcards.index + 1 < state.flashcards.deck.length) {
    state.flashcards.index += 1;
  } else {
    state.flashcards.deck = shuffle([...state.flashcards.deck]);
    state.flashcards.index = 0;
  }
  state.flashcards.revealed = false;
}

function openQuiz() {
  const source = shuffle([...getStudyWords("all")]).slice(0, 10);
  state.quiz.deck = source;
  state.quiz.index = 0;
  state.quiz.score = 0;
  state.quiz.answered = false;
  renderQuiz();
  openOverlay();
}

function openRecallStudy(sourceWords, title) {
  const deck = shuffle([...sourceWords]).slice(0, 12);
  state.recall.title = title;
  state.recall.deck = deck;
  state.recall.index = 0;
  state.recall.revealed = false;
  renderRecallStudy();
  openOverlay();
}

function renderRecallStudy() {
  const { deck, index, revealed, title } = state.recall;
  const word = deck[index];

  if (!deck.length) {
    setOverlayContent(`
      <div class="study-empty">
        <h2 id="overlayTitle" class="study-title">目前沒有可練習的題目</h2>
        <p class="helper-text">先換個主題或級數，之後再回來做主動回想。</p>
      </div>
    `);
    return;
  }

  if (!word) {
    setOverlayContent(`
      <div class="study-deck">
        <h2 id="overlayTitle" class="study-title">${title}</h2>
        <p class="study-progress">這一輪已完成，可以再做一次加深記憶。</p>
        <div class="study-toolbar">
          <button class="primary-button" id="restartRecall" type="button">再練一次</button>
        </div>
      </div>
    `);
    document.querySelector("#restartRecall").addEventListener("click", () => openRecallStudy(deck, title));
    return;
  }

  const progress = getProgress(word.id);
  setOverlayContent(`
    <div class="study-deck">
      <div>
        <p class="study-progress">第 ${index + 1} / ${deck.length} 題 ・ ${title}</p>
        <h2 id="overlayTitle" class="study-title">先想韓文，再看答案</h2>
      </div>
      <section class="flashcard">
        <div class="study-deck__hint">
          <p class="study-label">中文意思</p>
          <h3>${word.chineseMeaning}</h3>
          <p class="helper-text">${word.exampleChinese || "先用自己的方式默念一次，再揭曉韓文。"}</p>
          <p>${revealed ? `${word.korean} ${word.pronunciation || ""}` : "先回想韓文，再按下方按鈕看答案。"}</p>
          <p class="helper-text">目前熟悉度 ${progress.familiarity}/${MAX_FAMILIARITY}</p>
        </div>
      </section>
      <div class="study-toolbar">
        <button class="ghost-button" id="recallSpeak" type="button">播放答案發音</button>
        <button class="primary-button" id="recallReveal" type="button">${revealed ? "顯示評分" : "看答案"}</button>
      </div>
      <div class="${revealed ? "" : "hidden"}" id="recallRatingBlock">
        <p class="helper-text">剛剛你在揭曉前有想起來嗎？</p>
        <div class="familiarity-row">
          <button class="familiarity-button" id="recallHard" type="button">沒想起來</button>
          <button class="familiarity-button" id="recallMedium" type="button">想了一下</button>
          <button class="familiarity-button" id="recallEasy" type="button">很快想起來</button>
        </div>
      </div>
    </div>
  `);

  document.querySelector("#recallSpeak").addEventListener("click", () => speak(word.korean));
  document.querySelector("#recallReveal").addEventListener("click", () => {
    state.recall.revealed = true;
    renderRecallStudy();
  });
  document.querySelector("#recallHard").addEventListener("click", () => rateRecall(word.id, "hard"));
  document.querySelector("#recallMedium").addEventListener("click", () => rateRecall(word.id, "medium"));
  document.querySelector("#recallEasy").addEventListener("click", () => rateRecall(word.id, "easy"));
}

function rateRecall(wordId, result) {
  applyReviewResult(wordId, result);
  state.recall.index += 1;
  state.recall.revealed = false;
  renderDashboard();
  renderWordList();
  renderRecallStudy();
}

function renderQuiz() {
  const { deck, index, score } = state.quiz;
  const word = deck[index];

  if (!deck.length) {
    setOverlayContent(`
      <div class="study-empty">
        <h2 id="overlayTitle" class="study-title">目前沒有可測驗的單字</h2>
        <p class="helper-text">先選個級數，或把篩選條件放寬後再試一次。</p>
      </div>
    `);
    return;
  }

  if (!word) {
    setOverlayContent(`
      <div class="study-deck">
        <h2 id="overlayTitle" class="study-title">小測驗完成</h2>
        <p class="study-progress">你答對了 ${score} / ${deck.length} 題。</p>
        <div class="study-toolbar">
          <button class="primary-button" id="restartQuiz" type="button">再測一次</button>
        </div>
      </div>
    `);
    document.querySelector("#restartQuiz").addEventListener("click", openQuiz);
    return;
  }

  const options = buildQuizOptions(word);
  setOverlayContent(`
    <div class="study-deck">
      <div>
        <p class="study-progress">第 ${index + 1} / ${deck.length} 題 ・ 目前 ${score} 分</p>
        <h2 id="overlayTitle" class="study-title">小測驗模式</h2>
      </div>
      <section class="flashcard">
        <div>
          <h3>${word.korean}</h3>
          <p>${word.pronunciation || ""}</p>
          <p>請選出正確的中文意思。</p>
        </div>
      </section>
      <div class="quiz-options">
        ${options
          .map(
            (option) =>
              `<button class="quiz-option" type="button" data-answer="${escapeAttribute(option)}">${option}</button>`
          )
          .join("")}
      </div>
      <div class="study-toolbar">
        <button class="ghost-button" id="quizSpeak" type="button">播放發音</button>
        <button class="primary-button hidden" id="quizNext" type="button">下一題</button>
      </div>
    </div>
  `);

  document.querySelector("#quizSpeak").addEventListener("click", () => speak(word.korean));
  document.querySelectorAll(".quiz-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.quiz.answered) return;

      const choice = button.dataset.answer;
      const isCorrect = choice === word.chineseMeaning;
      state.quiz.answered = true;

      applyReviewResult(word.id, isCorrect ? "easy" : "hard");
      if (isCorrect) {
        state.quiz.score += 1;
      }

      document.querySelectorAll(".quiz-option").forEach((optionButton) => {
        const optionValue = optionButton.dataset.answer;
        optionButton.classList.toggle("is-correct", optionValue === word.chineseMeaning);
        optionButton.classList.toggle("is-wrong", optionButton === button && !isCorrect);
      });

      renderDashboard();
      renderWordList();
      document.querySelector("#quizNext").classList.remove("hidden");
    });
  });

  document.querySelector("#quizNext").addEventListener("click", () => {
    state.quiz.index += 1;
    state.quiz.answered = false;
    renderQuiz();
  });
}

function buildQuizOptions(correctWord) {
  const distractors = shuffle(
    state.words
      .filter((word) => word.id !== correctWord.id)
      .map((word) => word.chineseMeaning)
  ).slice(0, 3);

  return shuffle([correctWord.chineseMeaning, ...distractors]);
}

function applyReviewResult(wordId, result) {
  const progress = getProgress(wordId);
  progress.reviewCount += 1;
  progress.lastReviewedAt = new Date().toISOString();

  if (result === "hard") {
    progress.familiarity = Math.max(0, progress.familiarity - 1);
    progress.wrongCount += 1;
    progress.nextReviewAt = new Date().toISOString();
  } else if (result === "medium") {
    progress.familiarity = Math.min(MAX_FAMILIARITY, progress.familiarity + 1);
    progress.nextReviewAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  } else {
    progress.familiarity = Math.min(MAX_FAMILIARITY, progress.familiarity + 2);
    progress.correctCount += 1;
    progress.nextReviewAt = new Date(Date.now() + REVIEW_DELAY_MS).toISOString();
  }

  persistState();
}

function isDueForReview(wordId) {
  const progress = getProgress(wordId);
  if (!progress.reviewCount) return false;
  if (!progress.nextReviewAt) return true;
  return new Date(progress.nextReviewAt).getTime() <= Date.now();
}

function getDueWords() {
  return state.words.filter((word) => word.level === state.selectedLevel && isDueForReview(word.id));
}

function getReviewedCount() {
  return Object.values(state.progress).filter((progress) => progress.reviewCount > 0).length;
}

function getMasteredCount() {
  return Object.values(state.progress).filter((progress) => progress.familiarity >= 4).length;
}

function formatReviewState(progress) {
  if (!progress.reviewCount) return "還沒開始練習";
  if (progress.nextReviewAt && new Date(progress.nextReviewAt).getTime() <= Date.now()) {
    return "現在適合複習";
  }
  if (progress.familiarity >= 4) {
    return "已經很熟";
  }
  return "已建立進度";
}

function setOverlayContent(html) {
  els.overlayContent.innerHTML = html;
}

function openOverlay() {
  els.overlay.classList.remove("hidden");
  els.overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeOverlay() {
  els.overlay.classList.add("hidden");
  els.overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setupSpeechSynthesis() {
  if (!("speechSynthesis" in window)) return;

  loadVoices();

  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
  } else {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function loadVoices() {
  if (!("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    state.speech.voices = voices;
  }
  return state.speech.voices;
}

function primeSpeechSynthesis() {
  if (!("speechSynthesis" in window) || state.speech.initialized) return;

  state.speech.initialized = true;

  try {
    window.speechSynthesis.resume();
    const warmup = new SpeechSynthesisUtterance("");
    warmup.volume = 0;
    window.speechSynthesis.speak(warmup);
    window.speechSynthesis.cancel();
  } catch {
    state.speech.initialized = false;
  }
}

function getPreferredKoreanVoice() {
  const voices = loadVoices();
  return (
    voices.find((voice) => voice.lang === "ko-KR") ||
    voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ko")) ||
    null
  );
}

function speak(text, attempt = 0) {
  if (!("speechSynthesis" in window)) {
    alert("這個瀏覽器目前不支援語音播放。");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const preferredVoice = getPreferredKoreanVoice();

  utterance.lang = preferredVoice?.lang || "ko-KR";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  utterance.volume = 1;

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onerror = () => {
    if (attempt < 1) {
      window.setTimeout(() => speak(text, attempt + 1), 180);
    } else {
      alert("語音播放失敗，請再按一次試試看。");
    }
  };

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    window.setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, attempt === 0 ? 40 : 0);
  } catch {
    if (attempt < 1) {
      window.setTimeout(() => speak(text, attempt + 1), 180);
    } else {
      alert("語音播放失敗，請確認裝置語音功能可用。");
    }
  }
}

function shuffle(array) {
  const clone = [...array];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function escapeAttribute(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        if (registration.waiting) {
          promptForUpdate(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              promptForUpdate(installingWorker);
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshingForUpdate) return;
          refreshingForUpdate = true;
          window.location.reload();
        });

        return registration.update();
      })
      .catch(() => {});
  }
}

function promptForUpdate(worker) {
  waitingServiceWorker = worker;
  syncVersionUpdateButton();
  els.updateBannerText.textContent = autoUpdateEnabled
    ? "\u5df2\u5075\u6e2c\u5230\u65b0\u7248\u672c\uff0c\u6b63\u5728\u5617\u8a66\u81ea\u52d5\u66f4\u65b0\uff1b\u4f60\u4e5f\u53ef\u4ee5\u6309\u6309\u9215\u624b\u52d5\u66f4\u65b0\u3002"
    : "\u6709\u65b0\u7248\u672c\u53ef\u66f4\u65b0\uff0c\u8acb\u6309\u4e00\u4e0b\u624b\u52d5\u5207\u63db\u5230\u6700\u65b0\u7248\u3002";
  els.updateBanner.classList.remove("hidden");

  if (autoUpdateEnabled) {
    window.setTimeout(() => applyPendingUpdate(), 150);
  }
}

async function forceRefreshToLatestVersion() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch {}

  const targetUrl = new URL(window.location.href);
  targetUrl.searchParams.set("refresh", String(Date.now()));
  window.location.replace(targetUrl.toString());
}

async function applyPendingUpdate() {
  if (!waitingServiceWorker) {
    els.updateBannerText.textContent = "\u6b63\u5728\u91cd\u65b0\u8f09\u5165\u6700\u65b0\u7248\u672c...";
    els.versionApplyUpdate?.classList.add("hidden");
    await forceRefreshToLatestVersion();
    return;
  }
  els.updateBannerText.textContent = "\u6b63\u5728\u66f4\u65b0\u5230\u6700\u65b0\u7248\u672c...";
  els.versionApplyUpdate?.classList.add("hidden");
  waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
}

init().catch(() => {
  renderVersionInfo();
  loadLatestVersion();
  els.listSummary.textContent = "資料載入失敗。";
  els.wordList.innerHTML =
    '<div class="empty-state">讀取單字資料失敗，請確認檔案完整後重新整理。</div>';
});
