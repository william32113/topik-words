const STORAGE_KEY = "topik-words-state-v3";
const LEGACY_STORAGE_KEYS = ["topik-words-state-v2", "topik-words-state-v1"];
const PROGRESS_SCHEMA_VERSION = 1;
const MAX_FAMILIARITY = 5;
const REVIEW_DELAY_MS = 24 * 60 * 60 * 1000;

const state = {
  words: [],
  selectedLevel: "topik1",
  filter: "all",
  search: "",
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
  currentLevelLabel: document.querySelector("#currentLevelLabel"),
  nextStepLabel: document.querySelector("#nextStepLabel"),
  levelTabs: document.querySelector("#levelTabs"),
  searchInput: document.querySelector("#searchInput"),
  listSummary: document.querySelector("#listSummary"),
  wordList: document.querySelector("#wordList"),
  openFlashcard: document.querySelector("#openFlashcard"),
  openQuiz: document.querySelector("#openQuiz"),
  openReview: document.querySelector("#openReview"),
  overlay: document.querySelector("#overlay"),
  overlayContent: document.querySelector("#overlayContent"),
  closeOverlay: document.querySelector("#closeOverlay"),
  wordCardTemplate: document.querySelector("#wordCardTemplate")
};

let waitingServiceWorker = null;
let refreshingForUpdate = false;

async function init() {
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
  renderWordList();
  registerServiceWorker();
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || readLegacyState();
    if (!raw) return;

    const saved = JSON.parse(raw);
    state.selectedLevel = saved.selectedLevel || state.selectedLevel;
    state.filter = saved.filter || state.filter;
    state.search = saved.search || "";
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
    persistState();
    renderWordList();
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      persistState();
      renderFilters();
      renderWordList();
    });
  });

  els.openFlashcard.addEventListener("click", () => openFlashcards("all"));
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

function renderWordList() {
  const words = getVisibleWords();
  els.wordList.innerHTML = "";
  els.listSummary.textContent = `${levelLabels[state.selectedLevel]} 目前有 ${words.length} 個符合條件的單字`;

  if (!words.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "這個條件下目前沒有單字，可以換個級數、取消篩選，或先多做幾次練習。";
    els.wordList.appendChild(empty);
    return;
  }

  words.forEach((word) => {
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

function openDetail(word) {
  const progress = getProgress(word.id);
  setOverlayContent(`
    <header class="detail-header">
      <p class="word-level">${levelLabels[word.level]}</p>
      <h2 id="overlayTitle" class="detail-korean">${word.korean}</h2>
      <p class="detail-meta">${[word.pronunciation, word.partOfSpeech].filter(Boolean).join(" ・ ")}</p>
      <p class="detail-meaning">${word.chineseMeaning}</p>
    </header>
    <div class="detail-actions">
      <button class="primary-button" id="detailSpeak" type="button">播放發音</button>
      <button class="ghost-button" id="detailFavorite" type="button">${state.favorites.has(word.id) ? "取消收藏" : "加入收藏"}</button>
    </div>
    <section class="detail-block">
      <h3>學習狀態</h3>
      <p class="helper-text">熟悉度 ${progress.familiarity}/${MAX_FAMILIARITY} ・ 已練習 ${progress.reviewCount} 次 ・ ${formatReviewState(progress)}</p>
      <div class="familiarity-row">
        <button class="familiarity-button" type="button" data-score="0" data-word-id="${word.id}" data-action="set-hard">還不熟</button>
        <button class="familiarity-button" type="button" data-score="2" data-word-id="${word.id}" data-action="set-medium">普通</button>
        <button class="familiarity-button" type="button" data-score="4" data-word-id="${word.id}" data-action="set-good">很熟</button>
      </div>
    </section>
    <section class="detail-block">
      <h3>應用句子</h3>
      <p>${word.exampleKorean}</p>
      <p class="detail-example">${word.exampleChinese}</p>
    </section>
    <section class="detail-block">
      <h3>標籤</h3>
      <p class="detail-meta">${word.tags.join(", ")}</p>
    </section>
  `);

  document.querySelector("#detailSpeak").addEventListener("click", () => speak(word.korean));
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
  els.updateBannerText.textContent = "有新版本可更新，按一下就會切換到最新版。";
  els.updateBanner.classList.remove("hidden");
}

function applyPendingUpdate() {
  if (!waitingServiceWorker) return;
  els.updateBannerText.textContent = "正在更新到最新版...";
  waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
}

init().catch(() => {
  els.listSummary.textContent = "資料載入失敗。";
  els.wordList.innerHTML =
    '<div class="empty-state">讀取單字資料失敗，請確認檔案完整後重新整理。</div>';
});
