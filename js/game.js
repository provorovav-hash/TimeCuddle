/* ==========================================================================
   ВремяОбнимашки: Хранители Снов — игровой движок
   Кооперативная игра для двоих на одной клавиатуре.
   ========================================================================== */

(function () {
  "use strict";

  const VO = window.VO;
  const A = VO.Art;
  const S = VO.Scenery;
  const Sound = VO.Sound;

  const W = 1280;
  const H = 720;
  const GROUND = 600;
  const TAU = Math.PI * 2;

  const PHYS = {
    gravity: 2250,
    maxFall: 1450,
    speed: { ilya: 292, alisa: 330 },
    jump: { ilya: 815, alisa: 760 },
    accelGround: 17,
    accelAir: 8,
  };

  const $ = (id) => document.getElementById(id);

  const stage = $("stage");
  const canvas = $("gameCanvas");
  const ctx = canvas.getContext("2d");

  const ui = {
    hud: $("hud"),
    dreamNumber: $("dreamNumber"),
    levelTitle: $("levelTitle"),
    dreamDots: $("dreamDots"),
    objectiveCard: $("objectiveCard"),
    objectiveText: $("objectiveText"),
    fireflyPill: $("fireflyPill"),
    fireflyCount: $("fireflyCount"),
    colorPill: $("colorPill"),
    colorDot: $("colorDot"),
    colorName: $("colorName"),
    friendshipHint: $("friendshipHint"),
    dialogue: $("dialogue"),
    dialogueName: $("dialogueName"),
    dialogueText: $("dialogueText"),
    dialogueNext: $("dialogueNext"),
    portraitCanvas: $("portraitCanvas"),
    toast: $("toast"),
    toastIcon: $("toastIcon"),
    toastText: $("toastText"),
    startScreen: $("startScreen"),
    menuDoor: $("menuDoor"),
    menuChest: $("menuChest"),
    menuAlbum: $("menuAlbum"),
    menuHint: $("menuHint"),
    howBtn: $("howBtn"),
    menuFullscreenBtn: $("menuFullscreenBtn"),
    dreamRulesBtn: $("dreamRulesBtn"),
    miniRulesBtn: $("miniRulesBtn"),
    rulesScreen: $("rulesScreen"),
    rulesClose: $("rulesClose"),
    rulesOk: $("rulesOk"),
    rulesEyebrow: $("rulesEyebrow"),
    rulesTitle: $("rulesTitle"),
    rulesList: $("rulesList"),
    howScreen: $("howScreen"),
    howCloseBtn: $("howCloseBtn"),
    howPlayBtn: $("howPlayBtn"),
    levelSelectScreen: $("levelSelectScreen"),
    levelSelectClose: $("levelSelectClose"),
    levelChoices: Array.from(document.querySelectorAll(".level-choice")),
    miniGamesScreen: $("miniGamesScreen"),
    miniClose: $("miniClose"),
    miniNote: $("miniNote"),
    rainbowHud: $("rainbowHud"),
    rainbowBackBtn: $("rainbowBackBtn"),
    rainbowTime: $("rainbowTime"),
    rainbowScore: $("rainbowScore"),
    rainbowZones: $("rainbowZones"),
    rainbowReward: $("rainbowReward"),
    rainbowRewardText: $("rainbowRewardText"),
    rainbowAgainBtn: $("rainbowAgainBtn"),
    rainbowMenuBtn: $("rainbowMenuBtn"),
    towerHud: $("towerHud"),
    towerBackBtn: $("towerBackBtn"),
    towerTime: $("towerTime"),
    towerHeight: $("towerHeight"),
    towerStage: $("towerStage"),
    towerBlocks: $("towerBlocks"),
    towerDialogue: $("towerDialogue"),
    towerSpeaker: $("towerSpeaker"),
    towerText: $("towerText"),
    towerReward: $("towerReward"),
    towerRewardText: $("towerRewardText"),
    towerAgainBtn: $("towerAgainBtn"),
    towerMenuBtn: $("towerMenuBtn"),
    oceanHud: $("oceanHud"),
    oceanBackBtn: $("oceanBackBtn"),
    oceanFish: $("oceanFish"),
    oceanHearts: $("oceanHearts"),
    oceanDialogue: $("oceanDialogue"),
    oceanSpeaker: $("oceanSpeaker"),
    oceanText: $("oceanText"),
    oceanReward: $("oceanReward"),
    oceanRewardText: $("oceanRewardText"),
    oceanAgainBtn: $("oceanAgainBtn"),
    oceanMenuBtn: $("oceanMenuBtn"),
    forestHud: $("forestHud"),
    forestBackBtn: $("forestBackBtn"),
    forestFlowers: $("forestFlowers"),
    forestDialogue: $("forestDialogue"),
    forestSpeaker: $("forestSpeaker"),
    forestText: $("forestText"),
    forestReward: $("forestReward"),
    forestRewardText: $("forestRewardText"),
    forestAgainBtn: $("forestAgainBtn"),
    forestMenuBtn: $("forestMenuBtn"),
    chaseHud: $("chaseHud"),
    chaseBackBtn: $("chaseBackBtn"),
    chaseRound: $("chaseRound"),
    chaseRole: $("chaseRole"),
    chaseTime: $("chaseTime"),
    chaseStars: $("chaseStars"),
    chaseDialogue: $("chaseDialogue"),
    chaseSpeaker: $("chaseSpeaker"),
    chaseText: $("chaseText"),
    chaseReward: $("chaseReward"),
    chaseRewardText: $("chaseRewardText"),
    chaseAgainBtn: $("chaseAgainBtn"),
    chaseMenuBtn: $("chaseMenuBtn"),
    volcanoHud: $("volcanoHud"),
    volcanoBackBtn: $("volcanoBackBtn"),
    volcanoHeight: $("volcanoHeight"),
    volcanoBlocks: $("volcanoBlocks"),
    volcanoLava: $("volcanoLava"),
    volcanoObjective: $("volcanoObjective"),
    volcanoDialogue: $("volcanoDialogue"),
    volcanoSpeaker: $("volcanoSpeaker"),
    volcanoText: $("volcanoText"),
    volcanoReward: $("volcanoReward"),
    volcanoRewardText: $("volcanoRewardText"),
    volcanoAgainBtn: $("volcanoAgainBtn"),
    volcanoMenuBtn: $("volcanoMenuBtn"),
    cubesHud: $("cubesHud"),
    cubesBackBtn: $("cubesBackBtn"),
    cubesPhase: $("cubesPhase"),
    cubesTime: $("cubesTime"),
    cubesWood: $("cubesWood"),
    cubesDecor: $("cubesDecor"),
    cubesHouse: $("cubesHouse"),
    cubesDialogue: $("cubesDialogue"),
    cubesSpeaker: $("cubesSpeaker"),
    cubesText: $("cubesText"),
    cubesReward: $("cubesReward"),
    cubesRewardText: $("cubesRewardText"),
    cubesAgainBtn: $("cubesAgainBtn"),
    cubesMenuBtn: $("cubesMenuBtn"),
    miniChoices: Array.from(document.querySelectorAll(".mini-choice")),
    stickerScreen: $("stickerScreen"),
    stickerClose: $("stickerClose"),
    stickerSlots: Array.from(document.querySelectorAll(".sticker-slot")),
    stickerChips: Array.from(document.querySelectorAll(".sticker-chip")),
    stickerNote: $("stickerNote"),
    stickerInfo: $("stickerInfo"),
    stickerInfoIcon: $("stickerInfoIcon"),
    stickerInfoText: $("stickerInfoText"),
    exitLockScreen: $("exitLockScreen"),
    goodnightScreen: $("goodnightScreen"),
    pauseScreen: $("pauseScreen"),
    pauseBtn: $("pauseBtn"),
    resumeBtn: $("resumeBtn"),
    restartLevelBtn: $("restartLevelBtn"),
    toMenuBtn: $("toMenuBtn"),
    completeScreen: $("completeScreen"),
    completeEyebrow: $("completeEyebrow"),
    completeTitle: $("completeTitle"),
    completeText: $("completeText"),
    completePraise: $("completePraise"),
    nextLevelBtn: $("nextLevelBtn"),
    replayBtn: $("replayBtn"),
    rewardCanvas: $("rewardCanvas"),
    endingScreen: $("endingScreen"),
    playAgainBtn: $("playAgainBtn"),
    endingMenuBtn: $("endingMenuBtn"),
    soundBtn: $("soundBtn"),
    voiceBtn: $("voiceBtn"),
    menuVoiceBtn: $("menuVoiceBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    fadeScreen: $("fadeScreen"),
  };

  const portraitCtx = ui.portraitCanvas.getContext("2d");
  const rewardCtx = ui.rewardCanvas.getContext("2d");

  const settings = { sound: true, voice: true };
  let progress = 0;
  const completedLevels = new Set();
  const completedMinigames = new Set();
  const placedStickers = new Set();
  let rainbow = null;
  let tower = null;
  let ocean = null;
  let forest = null;
  let chase = null;
  let cubes = null;
  let volcano = null;
  const menuState = {
    lamp: 0,
    starAt: -10,
    pokeIlya: -10,
    pokeAlisa: -10,
  };
  let exitHoldTimer = null;
  let menuGreetingTimer = null;
  let menuGreetingHeard = false;

  let state = "start";
  let level = null;
  let levelIndex = 0;
  let levelTime = 0;
  let globalTime = 0;
  let ilya = null;
  let alisa = null;
  let players = [];
  let particles = [];
  let fireflyTotal = 0;
  let firefliesCollected = 0;
  let cameraKick = 0;
  let introTimer = null;
  let lastFrame = performance.now();
  let lastObjective = "";
  let lastRescueToast = 0;
  let stepTimer = 0;
  let lastPushSound = 0;

  let hugTimer = 0;
  let hugCooldown = 0;
  let hugCharge = 0;
  let hugDoor = false;
  let hugCount = 0;
  let celebrationT = 0;
  let celebrationBurstTimer = 0;
  let fireworksTimer = 0;

  let toastTimer = 0;
  let objectivePopTimer = null;
  let fadeBusy = false;

  const keysDown = new Set();
  const keysPressed = new Set();
  const TRACKED = new Set([
    "KeyW", "KeyA", "KeyS", "KeyD", "KeyE",
    "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
    "Space", "Enter",
  ]);

  const keyEls = Array.from(document.querySelectorAll(".control-chip kbd[data-key]"));

  // -----------------------------------------------------------------------
  // Состояние и данные игры
  // -----------------------------------------------------------------------

  const game = {
    get state() {
      return state;
    },
    get time() {
      return levelTime;
    },
    say,
    sayMany,
    sayNow,
    toast,
    burst,
    hearts,
    collectFirefly,
    justPressed,
    isDown,
    addCameraKick(n) {
      cameraKick = Math.max(cameraKick, n || 4);
    },
  };
  game.ilya = null;
  game.alisa = null;
  game.players = [];
  game.level = null;

  // -----------------------------------------------------------------------
  // DOM и настройки
  // -----------------------------------------------------------------------

  function loadSettings() {
    try {
      const p = parseInt(localStorage.getItem("vo_progress") || "0", 10);
      progress = Number.isFinite(p) ? Math.max(0, Math.min(VO.LEVELS.length, p)) : 0;
      settings.sound = localStorage.getItem("vo_sound") !== "0";
      settings.voice = localStorage.getItem("vo_voice") !== "0";

      completedLevels.clear();
      const rawCompleted = localStorage.getItem("vo_completed");
      if (rawCompleted) {
        const arr = JSON.parse(rawCompleted);
        if (Array.isArray(arr)) {
          for (const i of arr) {
            if (Number.isInteger(i) && i >= 0 && i < VO.LEVELS.length) completedLevels.add(i);
          }
        }
      } else {
        // Совместимость со старыми сохранениями: прогресс означал число пройденных снов.
        for (let i = 0; i < Math.min(progress, VO.LEVELS.length); i++) completedLevels.add(i);
      }

      completedMinigames.clear();
      const rawMinigames = localStorage.getItem("vo_minigames");
      if (rawMinigames) {
        const arr = JSON.parse(rawMinigames);
        if (Array.isArray(arr)) {
          for (const id of arr) if (typeof id === "string") completedMinigames.add(id);
        }
      }

      placedStickers.clear();
      const rawPlaced = localStorage.getItem("vo_placed_stickers");
      if (rawPlaced) {
        const arr = JSON.parse(rawPlaced);
        if (Array.isArray(arr)) {
          for (const id of arr) if (typeof id === "string") placedStickers.add(id);
        }
      }
    } catch (_) {
      progress = 0;
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem("vo_sound", settings.sound ? "1" : "0");
      localStorage.setItem("vo_voice", settings.voice ? "1" : "0");
    } catch (_) {}
  }

  function saveProgress(value) {
    progress = Math.max(progress, Math.min(VO.LEVELS.length, value));
    try {
      localStorage.setItem("vo_progress", String(progress));
    } catch (_) {}
  }

  function saveCompletedLevel(index) {
    if (!Number.isInteger(index) || index < 0 || index >= VO.LEVELS.length) return;
    completedLevels.add(index);
    try {
      localStorage.setItem("vo_completed", JSON.stringify(Array.from(completedLevels)));
    } catch (_) {}
  }

  function saveCompletedMinigame(id) {
    if (!id) return;
    completedMinigames.add(id);
    try {
      localStorage.setItem("vo_minigames", JSON.stringify(Array.from(completedMinigames)));
    } catch (_) {}
  }

  function savePlacedStickers() {
    try {
      localStorage.setItem("vo_placed_stickers", JSON.stringify(Array.from(placedStickers)));
    } catch (_) {}
  }

  function updateSoundButtons() {
    ui.soundBtn.classList.toggle("is-off", !settings.sound);
    ui.voiceBtn.classList.toggle("is-off", !settings.voice);
    ui.soundBtn.title = settings.sound ? "Выключить музыку и звуки" : "Включить музыку и звуки";
    ui.voiceBtn.title = settings.voice ? "Выключить озвучку" : "Включить озвучку";
    ui.soundBtn.setAttribute("aria-label", settings.sound ? "Выключить музыку и звуки" : "Включить музыку и звуки");
    ui.voiceBtn.setAttribute("aria-label", settings.voice ? "Выключить озвучку" : "Включить озвучку");
    if (ui.menuVoiceBtn) {
      ui.menuVoiceBtn.textContent = settings.voice ? "🔊 Озвучка: вкл" : "🔇 Озвучка: выкл";
      ui.menuVoiceBtn.classList.toggle("is-off", !settings.voice);
      ui.menuVoiceBtn.setAttribute("aria-pressed", settings.voice ? "true" : "false");
      ui.menuVoiceBtn.title = settings.voice ? "Отключить голосовую озвучку" : "Включить голосовую озвучку";
    }
  }

  function ensureAudio() {
    Sound.musicEnabled = settings.sound;
    Sound.voiceEnabled = settings.voice;
    Sound.init();
    Sound.setMusicEnabled(settings.sound);
    Sound.setVoiceEnabled(settings.voice);
    if (state === "paused") Sound.setPaused(true);
  }

  // -----------------------------------------------------------------------
  // Аттракцион: стартовый экран и финал
  // -----------------------------------------------------------------------

  function showElement(el) {
    if (el) el.classList.remove("is-hidden");
  }

  function hideElement(el) {
    if (el) el.classList.add("is-hidden");
  }

  function hideMenus() {
    hideElement(ui.startScreen);
    hideElement(ui.howScreen);
    hideElement(ui.levelSelectScreen);
    hideElement(ui.miniGamesScreen);
    hideElement(ui.stickerScreen);
    hideElement(ui.rulesScreen);
    hideElement(ui.pauseScreen);
    hideElement(ui.completeScreen);
    hideElement(ui.endingScreen);
    hideElement(ui.exitLockScreen);
    hideElement(ui.goodnightScreen);
    hideElement(ui.rainbowHud);
    hideElement(ui.rainbowReward);
    hideElement(ui.towerHud);
    hideElement(ui.towerDialogue);
    hideElement(ui.towerReward);
    hideElement(ui.oceanHud);
    hideElement(ui.oceanDialogue);
    hideElement(ui.oceanReward);
    hideElement(ui.forestHud);
    hideElement(ui.forestDialogue);
    hideElement(ui.forestReward);
    hideElement(ui.chaseHud);
    hideElement(ui.chaseDialogue);
    hideElement(ui.chaseReward);
    hideElement(ui.cubesHud);
    hideElement(ui.cubesDialogue);
    hideElement(ui.cubesReward);
    hideElement(ui.volcanoHud);
    hideElement(ui.volcanoDialogue);
    hideElement(ui.volcanoReward);
  }

  function anyMenuOverlayOpen() {
    return (
      !ui.howScreen.classList.contains("is-hidden") ||
      !ui.levelSelectScreen.classList.contains("is-hidden") ||
      !ui.miniGamesScreen.classList.contains("is-hidden") ||
      !ui.stickerScreen.classList.contains("is-hidden") ||
      !ui.rulesScreen.classList.contains("is-hidden")
    );
  }

  function closeTopMenuOverlay() {
    if (!ui.rulesScreen.classList.contains("is-hidden")) { closeRules(); return true; }
    if (!ui.howScreen.classList.contains("is-hidden")) { hideHow(); return true; }
    if (!ui.levelSelectScreen.classList.contains("is-hidden")) { hideElement(ui.levelSelectScreen); return true; }
    if (!ui.miniGamesScreen.classList.contains("is-hidden")) { hideElement(ui.miniGamesScreen); return true; }
    if (!ui.stickerScreen.classList.contains("is-hidden")) { hideElement(ui.stickerScreen); Sound.stopSpeech(); return true; }
    return false;
  }

  function showMenuHint(text) {
    if (!ui.menuHint || !text) return;
    ui.menuHint.textContent = text;
  }

  function speakMenuGreeting(force) {
    if (state !== "start" || anyMenuOverlayOpen()) return;
    const text =
      "Привет, Илюша! Привет, Алиса! Нажмите на Волшебную Дверь, чтобы отправиться в сказку, или загляните в сундучок с мини-играми!";
    showMenuHint("Волшебная Дверь, сундук с играми или альбом с наклейками?");
    if (!settings.voice) {
      menuGreetingHeard = true;
      return;
    }
    if (!("speechSynthesis" in window)) {
      menuGreetingHeard = true;
      return;
    }
    if (menuGreetingHeard && !force) return;
    const synth = window.speechSynthesis;
    if (!force && (synth.speaking || synth.pending)) return;
    if (force) {
      try { synth.cancel(); } catch (_) {}
    }
    const started = Sound.speak(text, "mama", {
      force: !!force,
      onstart: () => { menuGreetingHeard = true; },
      onend: () => { menuGreetingHeard = true; },
    });
    if (!started && !("speechSynthesis" in window)) menuGreetingHeard = true;
  }

  function showStartScreen() {
    hideMenus();
    hideElement(ui.hud);
    hideElement(ui.dialogue);
    hideElement(ui.toast);
    hideElement(ui.friendshipHint);
    state = "start";
    level = null;
    game.level = null;
    rainbow = null;
    tower = null;
    ocean = null;
    forest = null;
    chase = null;
    cubes = null;
    volcano = null;
    ilya = null;
    alisa = null;
    players = [];
    game.ilya = null;
    game.alisa = null;
    game.players = [];
    cancelExitHold();
    showElement(ui.startScreen);
    keysDown.clear();
    keysPressed.clear();
    Sound.setPaused(false);
    if (Sound.setMood) Sound.setMood("lullaby");
    Sound.stopSpeech();
    showMenuHint("Нажми на Волшебную Дверь, чтобы отправиться в сказку");
    menuGreetingHeard = false;
    window.clearTimeout(menuGreetingTimer);
    menuGreetingTimer = window.setTimeout(() => speakMenuGreeting(false), 650);
  }

  function openLevelSelect() {
    if (state !== "start" && state !== "ending") return;
    ensureAudio();
    hideElement(ui.howScreen);
    hideElement(ui.miniGamesScreen);
    hideElement(ui.stickerScreen);
    renderLevelSelect();
    showElement(ui.levelSelectScreen);
    Sound.door();
    showMenuHint("Выбери сон — и в путь!");
    if (settings.voice) Sound.speak("Куда отправимся? Выбери сон.", "mama");
  }

  function openMiniGames() {
    if (state !== "start") return;
    ensureAudio();
    hideElement(ui.howScreen);
    hideElement(ui.levelSelectScreen);
    hideElement(ui.stickerScreen);
    if (ui.miniNote) ui.miniNote.textContent = "Шесть мини-игр уже ждут ребят: выбирайте, во что играть!";
    showElement(ui.miniGamesScreen);
    Sound.plastic();
    showMenuHint("Тут прячутся мини-игры!");
    if (settings.voice) Sound.speak("Тут прячутся наши мини-игры. Радужный сон, Лего-Башня, Подводная охота, Лесной оркестр и Лесные прятки уже ждут!", "mama");
  }

  function openStickers() {
    if (state !== "start") return;
    ensureAudio();
    Sound.stopSpeech();
    hideElement(ui.howScreen);
    hideElement(ui.levelSelectScreen);
    hideElement(ui.miniGamesScreen);
    resetStickerInfo();
    renderStickerRoom();
    showElement(ui.stickerScreen);
    Sound.firefly();
    showMenuHint("Тут живут наши наклейки!");
  }

  function renderLevelSelect() {
    for (const btn of ui.levelChoices) {
      const index = parseInt(btn.dataset.level || "-1", 10);
      btn.classList.toggle("is-done", completedLevels.has(index));
      if (completedLevels.has(index)) btn.setAttribute("aria-label", `${btn.querySelector("strong").textContent}: пройден`);
    }
  }

  const STICKER_LEVELS = { bear: 0, train: 1, elephant: 2, bird: 3 };
  const STICKER_NAMES = {
    bear: "Мишка",
    train: "Лего-поезд",
    elephant: "Слонёнок",
    bird: "Птица Счастья",
    tower: "Лего-Башня",
    rainbow: "Радужный сон",
    ocean: "Радужная рыбка",
    forest: "Лесной оркестр",
    bunny: "Зайчик-попрыгунчик",
    balloon: "Воздушный Шар",
  };

  const STICKER_INFO = {
    bear: {
      icon: "🐻",
      text: "Это Мишка с Острова носков. Он помог Илюше и Алисе открыть первый Волшебный Сон.",
    },
    train: {
      icon: "🚂",
      text: "Это Лего-поезд из второго сна. Илюша и Алиса вместе починили его и отправились дальше.",
    },
    elephant: {
      icon: "🐘",
      text: "Это Слонёнок из третьего сна. Он ждал ребят в Лесу книжных страниц.",
    },
    bird: {
      icon: "🕊️",
      text: "Это Птица Счастья из четвёртого сна. Она снова расправила крылья на Поляне раскрасок.",
    },
    tower: {
      icon: "🧱",
      text: "Это Лего-Башня из мини-игры. Мишка забрался по ней к звёздочке.",
    },
    rainbow: {
      icon: "🌈",
      text: "Это Радужный сон. Илюша и Алиса раскрасили волшебную открытку и разбудили радугу.",
    },
    ocean: {
      icon: "🐠",
      text: "Это Радужная рыбка из «Подводной охоты за кляксами». Океан снова стал цветным.",
    },
    forest: {
      icon: "🌸",
      text: "Это Лесной оркестр цветов. Цветы проснулись и запели вместе с ребятами.",
    },
    bunny: {
      icon: "🐇",
      text: "Это Зайчик-попрыгунчик из «Лесных пряток-догонялок». Он болел за Илюшу и Алису на весёлом забеге.",
    },
    balloon: {
      icon: "🎈",
      text: "Это Воздушный Шар с Вулканического острова. Илюша и Алиса построили мосты, поднялись к вершине и улетели от карамельной лавы.",
    },
  };

  function stickerEarned(id) {
    if (id === "rainbow") return completedMinigames.has("rainbow");
    if (id === "tower") return completedMinigames.has("tower");
    if (id === "ocean") return completedMinigames.has("ocean");
    if (id === "forest") return completedMinigames.has("forest");
    if (id === "bunny") return completedMinigames.has("chase");
    if (id === "balloon") return completedMinigames.has("volcano");
    return Number.isInteger(STICKER_LEVELS[id]) && completedLevels.has(STICKER_LEVELS[id]);
  }

  function resetStickerInfo() {
    if (!ui.stickerInfo) return;
    ui.stickerInfo.classList.remove("is-active");
    ui.stickerInfoIcon.textContent = "👆";
    ui.stickerInfoText.textContent = "Наведи курсор на наклейку — она расскажет о себе.";
  }

  function showStickerInfo(id, options) {
    const info = STICKER_INFO[id];
    if (!info || !ui.stickerInfo) return;
    const opts = options || {};
    const available = stickerEarned(id);
    const placed = available && placedStickers.has(id);
    let text;
    if (!available) {
      text = "Эта наклейка ещё спит. Пройди сон или мини-игру, и она появится в альбоме.";
    } else if (opts.fromAlbum && !placed) {
      text = "Эта наклейка ждёт в коробочке. Нажми на неё, чтобы приклеить в альбом.";
    } else {
      text = info.text;
    }
    ui.stickerInfoIcon.textContent = available ? (opts.fromAlbum && !placed ? "📦" : info.icon) : "💤";
    ui.stickerInfoText.textContent = text;
    ui.stickerInfo.classList.add("is-active");
    // Голос — только у наклеенной картинки в левой части альбома.
    if (opts.allowVoice && opts.fromAlbum && placed && settings.voice) {
      Sound.speak(text, "mama", { force: true });
    } else {
      Sound.stopSpeech();
    }
  }

  function renderStickerRoom() {
    let earned = 0;
    for (const slot of ui.stickerSlots) {
      const id = slot.dataset.sticker;
      const available = stickerEarned(id);
      const placed = available && placedStickers.has(id);
      slot.classList.toggle("has-sticker", placed);
      if (available) earned++;
      slot.setAttribute("aria-label", available ? `${STICKER_NAMES[id] || "Наклейка"}${placed ? " — наклеена" : " — можно наклеить"}` : "Наклейка ещё не заработана");
    }
    for (const chip of ui.stickerChips) {
      const id = chip.dataset.sticker;
      const available = stickerEarned(id);
      chip.classList.toggle("is-locked", !available);
      chip.classList.toggle("is-placed", available && placedStickers.has(id));
      chip.setAttribute("aria-disabled", available ? "false" : "true");
      chip.disabled = false;
    }
    if (ui.stickerNote) {
      ui.stickerNote.textContent = earned > 0
        ? `Заработано наклеек: ${earned}. Нажми на наклейку, чтобы приклеить её в альбом.`
        : "Пройди сон или мини-игру — и наклейка станет твоей.";
    }
  }

  function startChosenLevel(index) {
    if (state !== "start" && state !== "ending") return;
    ensureAudio();
    Sound.click();
    window.clearTimeout(menuGreetingTimer);
    hideElement(ui.levelSelectScreen);
    hideElement(ui.miniGamesScreen);
    hideElement(ui.stickerScreen);
    hideElement(ui.howScreen);
    transitionTo(() => {
      hideMenus();
      hideElement(ui.hud);
      loadLevel(index);
    }, 460);
  }

  function startRainbowGame() {
    if (!VO.Rainbow) return;
    if (state !== "start") return;
    ensureAudio();
    Sound.click();
    window.clearTimeout(menuGreetingTimer);
    hideElement(ui.miniGamesScreen);
    hideElement(ui.howScreen);
    transitionTo(() => {
      hideMenus();
      hideElement(ui.hud);
      hideElement(ui.dialogue);
      hideElement(ui.toast);
      hideElement(ui.friendshipHint);
      rainbow = VO.Rainbow.create();
      state = "rainbow";
      Sound.setMood("lego");
      showElement(ui.rainbowHud);
      updateRainbowHud();
    }, 420);
  }

  function updateRainbowHud() {
    if (!rainbow || !ui.rainbowTime) return;
    const totalSeconds = Math.max(0, Math.ceil(rainbow.time));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    ui.rainbowTime.textContent = `${m}:${String(s).padStart(2, "0")}`;
    ui.rainbowTime.parentElement.classList.toggle("is-low", totalSeconds <= 10);
    ui.rainbowScore.textContent = String(rainbow.score);
    ui.rainbowZones.textContent = `${rainbow.filled} / ${rainbow.total}`;
  }

  function updateRainbow(dt) {
    if (!rainbow) return;
    VO.Rainbow.update(rainbow, dt, { isDown, justPressed });
    updateRainbowHud();
    if (rainbow.phase === "reward" && !rainbow.rewardShown) {
      rainbow.rewardShown = true;
      saveCompletedMinigame("rainbow");
      ui.rainbowRewardText.textContent = `${rainbow.resultLine} Очки дружбы: ${rainbow.score}. Наклейка «Радужный сон» уже ждёт в альбоме!`;
      showElement(ui.rainbowReward);
    }
  }

  function endRainbowGame() {
    if (state !== "rainbow") return;
    rainbow = null;
    hideElement(ui.rainbowHud);
    hideElement(ui.rainbowReward);
    state = "start";
    showStartScreen();
  }

  function restartRainbowGame() {
    if (state !== "rainbow") return;
    hideElement(ui.rainbowReward);
    showElement(ui.rainbowHud);
    rainbow = VO.Rainbow.create();
    updateRainbowHud();
  }

  function startTowerGame() {
    if (!VO.Tower) return;
    if (state !== "start") return;
    ensureAudio();
    Sound.click();
    window.clearTimeout(menuGreetingTimer);
    hideElement(ui.miniGamesScreen);
    hideElement(ui.howScreen);
    transitionTo(() => {
      hideMenus();
      hideElement(ui.hud);
      hideElement(ui.dialogue);
      hideElement(ui.toast);
      hideElement(ui.friendshipHint);
      tower = VO.Tower.create();
      state = "tower";
      Sound.setMood("lego");
      showElement(ui.towerHud);
      updateTowerHud();
      syncTowerDialogue();
    }, 420);
  }

  function updateTowerHud() {
    if (!tower || !ui.towerTime) return;
    const total = Math.max(0, Math.ceil(tower.time));
    const m = Math.floor(total / 60);
    const s = total % 60;
    ui.towerTime.textContent = `${m}:${String(s).padStart(2, "0")}`;
    ui.towerTime.parentElement.classList.toggle("is-low", total <= 10);
    ui.towerHeight.textContent = `${tower.floors || 0} эт.`;
    ui.towerStage.textContent =
      tower.stage === "base" ? `Фундамент ${tower.heavyCount || 0}/5`
        : tower.stage === "roof" ? "Крыша"
          : tower.stage === "spire" ? "Шпиль"
            : tower.stage === "flag" ? "Флажок"
              : "Готово";
    ui.towerBlocks.textContent = String(tower.placed || 0);
  }

  function syncTowerDialogue() {
    if (!tower || !ui.towerDialogue) return;
    const line = tower.line;
    ui.towerDialogue.classList.toggle("is-hidden", !line);
    if (!line) return;
    const names = { mama: "Мама", ilya: "Илюша", alisa: "Алиса", bear: "Мишка" };
    ui.towerSpeaker.textContent = names[line.speaker] || "Мама";
    ui.towerText.textContent = line.text;
    ui.towerDialogue.classList.remove("is-ilya", "is-alisa", "is-bear");
    if (line.speaker === "ilya") ui.towerDialogue.classList.add("is-ilya");
    if (line.speaker === "alisa") ui.towerDialogue.classList.add("is-alisa");
    if (line.speaker === "bear") ui.towerDialogue.classList.add("is-bear");
  }

  function updateTowerGame(dt) {
    if (!tower) return;
    VO.Tower.update(tower, dt, { isDown, justPressed });
    updateTowerHud();
    syncTowerDialogue();
    if (tower.phase === "reward" && !tower.rewardShown) {
      tower.rewardShown = true;
      saveCompletedMinigame("tower");
      ui.towerRewardText.textContent =
        `Высота башни: ${tower.heightM || 0} м. Мишка достал звёздочку. Наклейка «Лего-Башня» уже в альбоме!`;
      showElement(ui.towerReward);
    }
  }

  function endTowerGame() {
    if (state !== "tower") return;
    tower = null;
    hideElement(ui.towerHud);
    hideElement(ui.towerDialogue);
    hideElement(ui.towerReward);
    state = "start";
    showStartScreen();
  }

  function restartTowerGame() {
    if (state !== "tower") return;
    hideElement(ui.towerReward);
    showElement(ui.towerHud);
    tower = VO.Tower.create();
    updateTowerHud();
    syncTowerDialogue();
  }

  function startOceanGame() {
    if (!VO.Ocean) return;
    if (state !== "start") return;
    ensureAudio();
    Sound.click();
    window.clearTimeout(menuGreetingTimer);
    hideElement(ui.miniGamesScreen);
    hideElement(ui.howScreen);
    transitionTo(() => {
      hideMenus();
      hideElement(ui.hud);
      hideElement(ui.dialogue);
      hideElement(ui.toast);
      hideElement(ui.friendshipHint);
      ocean = VO.Ocean.create();
      state = "ocean";
      Sound.setMood("lego");
      showElement(ui.oceanHud);
      updateOceanHud();
      syncOceanDialogue();
    }, 420);
  }

  function updateOceanHud() {
    if (!ocean || !ui.oceanFish) return;
    ui.oceanFish.textContent = `${ocean.rescued} / ${ocean.total}`;
    ui.oceanHearts.textContent = String(ocean.hearts);
  }

  function syncOceanDialogue() {
    if (!ocean || !ui.oceanDialogue) return;
    const line = ocean.line;
    ui.oceanDialogue.classList.toggle("is-hidden", !line);
    if (!line) return;
    const names = { mama: "Мама", ilya: "Илюша", alisa: "Алиса" };
    ui.oceanSpeaker.textContent = names[line.speaker] || "Мама";
    ui.oceanText.textContent = line.text;
    ui.oceanDialogue.classList.remove("is-ilya", "is-alisa");
    if (line.speaker === "ilya") ui.oceanDialogue.classList.add("is-ilya");
    if (line.speaker === "alisa") ui.oceanDialogue.classList.add("is-alisa");
  }

  function updateOceanGame(dt) {
    if (!ocean) return;
    VO.Ocean.update(ocean, dt, { isDown, justPressed });
    updateOceanHud();
    syncOceanDialogue();
    if (ocean.phase === "reward" && !ocean.rewardShownByGame) {
      ocean.rewardShownByGame = true;
      saveCompletedMinigame("ocean");
      ui.oceanRewardText.textContent =
        "Океан снова чистый и сияет всеми цветами радуги! Наклейка «Радужная рыбка» уже в альбоме.";
      showElement(ui.oceanReward);
    }
  }

  function endOceanGame() {
    if (state !== "ocean") return;
    ocean = null;
    hideElement(ui.oceanHud);
    hideElement(ui.oceanDialogue);
    hideElement(ui.oceanReward);
    state = "start";
    showStartScreen();
  }

  function restartOceanGame() {
    if (state !== "ocean") return;
    hideElement(ui.oceanReward);
    showElement(ui.oceanHud);
    ocean = VO.Ocean.create();
    updateOceanHud();
    syncOceanDialogue();
  }

  function startForestGame() {
    if (!VO.Forest) return;
    if (state !== "start") return;
    ensureAudio();
    Sound.click();
    window.clearTimeout(menuGreetingTimer);
    hideElement(ui.miniGamesScreen);
    hideElement(ui.howScreen);
    transitionTo(() => {
      hideMenus();
      hideElement(ui.hud);
      hideElement(ui.dialogue);
      hideElement(ui.toast);
      hideElement(ui.friendshipHint);
      forest = VO.Forest.create();
      state = "forest";
      Sound.setMood("rainbow");
      showElement(ui.forestHud);
      updateForestHud();
      syncForestDialogue();
    }, 420);
  }

  function updateForestHud() {
    if (!forest || !ui.forestFlowers) return;
    ui.forestFlowers.textContent = `${forest.opened} / ${forest.total}`;
  }

  function syncForestDialogue() {
    if (!forest || !ui.forestDialogue) return;
    const line = forest.line;
    ui.forestDialogue.classList.toggle("is-hidden", !line);
    if (!line) return;
    const names = { mama: "Мама", ilya: "Илюша", alisa: "Алиса" };
    ui.forestSpeaker.textContent = names[line.speaker] || "Мама";
    ui.forestText.textContent = line.text;
    ui.forestDialogue.classList.remove("is-ilya", "is-alisa");
    if (line.speaker === "ilya") ui.forestDialogue.classList.add("is-ilya");
    if (line.speaker === "alisa") ui.forestDialogue.classList.add("is-alisa");
  }

  function updateForestGame(dt) {
    if (!forest) return;
    VO.Forest.update(forest, dt, { isDown, justPressed });
    updateForestHud();
    syncForestDialogue();
    if (forest.phase === "reward" && !forest.rewardShownByGame) {
      forest.rewardShownByGame = true;
      saveCompletedMinigame("forest");
      ui.forestRewardText.textContent =
        "Все цветы раскрылись и запели! Наклейка «Лесной оркестр» уже в альбоме.";
      showElement(ui.forestReward);
    }
  }

  function endForestGame() {
    if (state !== "forest") return;
    forest = null;
    hideElement(ui.forestHud);
    hideElement(ui.forestDialogue);
    hideElement(ui.forestReward);
    state = "start";
    showStartScreen();
  }

  function restartForestGame() {
    if (state !== "forest") return;
    hideElement(ui.forestReward);
    showElement(ui.forestHud);
    forest = VO.Forest.create();
    updateForestHud();
    syncForestDialogue();
  }

  function startChaseGame() {
    if (!VO.Chase) return;
    if (state !== "start") return;
    ensureAudio();
    Sound.click();
    window.clearTimeout(menuGreetingTimer);
    hideElement(ui.miniGamesScreen);
    hideElement(ui.howScreen);
    transitionTo(() => {
      hideMenus();
      hideElement(ui.hud);
      hideElement(ui.dialogue);
      hideElement(ui.toast);
      hideElement(ui.friendshipHint);
      chase = VO.Chase.create();
      state = "chase";
      Sound.setMood("lego");
      showElement(ui.chaseHud);
      updateChaseHud();
      syncChaseDialogue();
    }, 420);
  }

  function updateChaseHud() {
    if (!chase || !ui.chaseRound) return;
    ui.chaseRound.textContent = `Раунд ${chase.round}/2`;
    const who = chase.chaser === "ilya" ? "Илюша" : "Алиса";
    ui.chaseRole.textContent =
      chase.phase === "rules" ? "Смотрите картинку"
        : chase.phase === "ready" ? "Оба — вместе!"
          : chase.phase === "finale" || chase.phase === "reward" ? "Обнимашки!"
            : `Водит ${who}`;
    const total = Math.max(0, Math.ceil(chase.time || 0));
    ui.chaseTime.textContent = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
    ui.chaseStars.textContent = `${chase.stars.ilya} : ${chase.stars.alisa}`;
    ui.chaseTime.parentElement.classList.toggle("is-low", chase.phase === "round" && total <= 10);
  }

  function syncChaseDialogue() {
    if (!chase || !ui.chaseDialogue) return;
    const line = chase.line;
    ui.chaseDialogue.classList.toggle("is-hidden", !line);
    if (!line) return;
    const names = { mama: "Мама", ilya: "Илюша", alisa: "Алиса" };
    ui.chaseSpeaker.textContent = names[line.speaker] || "Мама";
    ui.chaseText.textContent = line.text;
    ui.chaseDialogue.classList.remove("is-ilya", "is-alisa");
    if (line.speaker === "ilya") ui.chaseDialogue.classList.add("is-ilya");
    if (line.speaker === "alisa") ui.chaseDialogue.classList.add("is-alisa");
  }

  function updateChaseGame(dt) {
    if (!chase) return;
    VO.Chase.update(chase, dt, { isDown, justPressed });
    updateChaseHud();
    syncChaseDialogue();
    if (chase.phase === "reward" && !chase.rewardShownByGame) {
      chase.rewardShownByGame = true;
      saveCompletedMinigame("chase");
      ui.chaseRewardText.textContent =
        `Звёздочки Радости: Илюша ${chase.stars.ilya}, Алиса ${chase.stars.alisa}. Вместе — ${chase.stars.ilya + chase.stars.alisa}! Наклейка «Зайчик-попрыгунчик» уже в альбоме.`;
      showElement(ui.chaseReward);
    }
  }

  function endChaseGame() {
    if (state !== "chase") return;
    chase = null;
    hideElement(ui.chaseHud);
    hideElement(ui.chaseDialogue);
    hideElement(ui.chaseReward);
    state = "start";
    showStartScreen();
  }

  function restartChaseGame() {
    if (state !== "chase") return;
    hideElement(ui.chaseReward);
    showElement(ui.chaseHud);
    chase = VO.Chase.create();
    updateChaseHud();
    syncChaseDialogue();
  }

  function startCubesGame() {
    if (!VO.Cubes) return;
    if (state !== "start") return;
    ensureAudio();
    Sound.setMood("lego");
    transitionTo(() => {
      hideMenus();
      cubes = VO.Cubes.create();
      state = "cubes";
      showElement(ui.cubesHud);
      updateCubesHud();
      syncCubesDialogue();
    }, 420);
  }

  function cubesClock(seconds) {
    const total = Math.max(0, Math.ceil(seconds || 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  function updateCubesHud() {
    if (!cubes || !ui.cubesPhase) return;
    if (cubes.phase === "day") {
      ui.cubesPhase.textContent = "День";
      ui.cubesTime.textContent = cubesClock(cubes.dayTime);
    } else if (cubes.phase === "night") {
      ui.cubesPhase.textContent = "Ночь";
      ui.cubesTime.textContent = cubesClock(cubes.nightTime);
    } else {
      ui.cubesPhase.textContent = "Рассвет";
      ui.cubesTime.textContent = "0:00";
    }
    ui.cubesWood.textContent = String(cubes.resources.ilya);
    ui.cubesDecor.textContent = String(cubes.resources.alisa);
    ui.cubesHouse.textContent = `${cubes.house.walls}/6 · ${cubes.house.roofLayers || 0}/3`;
  }

  function syncCubesDialogue() {
    if (!cubes || !ui.cubesDialogue) return;
    const line = cubes.line;
    ui.cubesDialogue.classList.toggle("is-hidden", !line);
    if (!line) return;
    const names = { mama: "Мама", ilya: "Илюша", alisa: "Алиса" };
    ui.cubesSpeaker.textContent = names[line.speaker] || "Мама";
    ui.cubesText.textContent = line.text;
    ui.cubesDialogue.classList.remove("is-ilya", "is-alisa");
    if (line.speaker === "ilya") ui.cubesDialogue.classList.add("is-ilya");
    if (line.speaker === "alisa") ui.cubesDialogue.classList.add("is-alisa");
  }

  function updateCubesGame(dt) {
    if (!cubes) return;
    VO.Cubes.update(cubes, dt, { isDown, justPressed });
    updateCubesHud();
    syncCubesDialogue();
    if (cubes.phase === "reward" && !cubes.rewardShownByGame) {
      cubes.rewardShownByGame = true;
      saveCompletedMinigame("cubes");
      ui.cubesRewardText.textContent =
        "Солнышко снова взошло! Вы построили уютный кубический домик, пережили ночь и обнялись на крылечке. Наклейка «Кубический домик» уже в альбоме.";
      showElement(ui.cubesReward);
    }
  }

  function endCubesGame() {
    if (state !== "cubes") return;
    cubes = null;
    hideElement(ui.cubesHud);
    hideElement(ui.cubesDialogue);
    hideElement(ui.cubesReward);
    state = "start";
    showStartScreen();
  }

  function restartCubesGame() {
    if (state !== "cubes") return;
    hideElement(ui.cubesReward);
    showElement(ui.cubesHud);
    cubes = VO.Cubes.create();
    updateCubesHud();
    syncCubesDialogue();
  }

  function startVolcanoGame() {
    if (!VO.Volcano) return;
    if (state !== "start") return;
    ensureAudio();
    Sound.setMood("lego");
    transitionTo(() => {
      hideMenus();
      volcano = VO.Volcano.create();
      state = "volcano";
      showElement(ui.volcanoHud);
      updateVolcanoHud();
      syncVolcanoDialogue();
    }, 420);
  }

  function updateVolcanoHud() {
    if (!volcano || !ui.volcanoHeight) return;
    const minY = Math.min(volcano.players.ilya.y, volcano.players.alisa.y);
    ui.volcanoHeight.textContent = `${Math.max(0, Math.round(-minY / 92))} / 50`;
    const mark = (p) => `${p.blocks}${p.special ? "+★" : ""}`;
    ui.volcanoBlocks.textContent = `${mark(volcano.players.ilya)} / ${mark(volcano.players.alisa)}`;
    ui.volcanoLava.textContent = volcano.freezeT > 0
      ? `❄ ${Math.ceil(volcano.freezeT)}с`
      : "поднимается";
    ui.volcanoObjective.textContent = volcano.objective || "";
  }

  function syncVolcanoDialogue() {
    if (!volcano || !ui.volcanoDialogue) return;
    const line = volcano.line;
    ui.volcanoDialogue.classList.toggle("is-hidden", !line);
    if (!line) return;
    const names = { mama: "Мама", ilya: "Илюша", alisa: "Алиса" };
    ui.volcanoSpeaker.textContent = names[line.speaker] || "Мама";
    ui.volcanoText.textContent = line.text;
    ui.volcanoDialogue.classList.remove("is-ilya", "is-alisa");
    if (line.speaker === "ilya") ui.volcanoDialogue.classList.add("is-ilya");
    if (line.speaker === "alisa") ui.volcanoDialogue.classList.add("is-alisa");
  }

  function updateVolcanoGame(dt) {
    if (!volcano) return;
    VO.Volcano.update(volcano, dt, { isDown, justPressed });
    updateVolcanoHud();
    syncVolcanoDialogue();
    if (volcano.phase === "reward" && !volcano.rewardShownByGame) {
      volcano.rewardShownByGame = true;
      saveCompletedMinigame("volcano");
      ui.volcanoRewardText.textContent =
        "Воздушный Шар уносит вас от карамельной лавы! Вы построили путь к вершине и обнялись в корзине. Наклейка «Воздушный Шар» уже в альбоме.";
      showElement(ui.volcanoReward);
    }
  }

  function endVolcanoGame() {
    if (state !== "volcano") return;
    volcano = null;
    hideElement(ui.volcanoHud);
    hideElement(ui.volcanoDialogue);
    hideElement(ui.volcanoReward);
    state = "start";
    showStartScreen();
  }

  function restartVolcanoGame() {
    if (state !== "volcano") return;
    hideElement(ui.volcanoReward);
    showElement(ui.volcanoHud);
    volcano = VO.Volcano.create();
    updateVolcanoHud();
    syncVolcanoDialogue();
  }

  function goToMenu() {
    if (fadeBusy) return;
    transitionTo(() => {
      hideMenus();
      showStartScreen();
    }, 350);
  }

  function transitionTo(action, duration) {
    if (fadeBusy) return;
    fadeBusy = true;
    ui.fadeScreen.classList.add("is-active");
    stateBeforeTransition = state;
    state = "transition";
    window.setTimeout(() => {
      action();
      window.requestAnimationFrame(() => {
        ui.fadeScreen.classList.remove("is-active");
        window.setTimeout(() => {
          fadeBusy = false;
        }, 560);
      });
    }, duration || 480);
  }

  let stateBeforeTransition = "start";

  function showHow() {
    showElement(ui.howScreen);
    Sound.click();
  }

  function hideHow() {
    hideElement(ui.howScreen);
  }

  const DREAM_RULES = [
    {
      icon: "🧦",
      title: "Сон 1. Остров носков",
      text: "Илюша находит волшебный фонарик и толкает кубик-подушку к реке. Кубик становится мостиком, Алиса переходит реку, забирает ключик и открывает шкаф-замок.",
      goal: "Разбудить бабочку, найти Мишку и обняться у Волшебной Двери.",
    },
    {
      icon: "🚂",
      title: "Сон 2. Остров Лего",
      text: "Алиса ловит синий кубик в мыльный пузырь, а Илюша лопает пузырь фонариком. Затем тучка-Сплюшка становится розовым батутом, Илюша достаёт колесо с крыши поезда и чинит его.",
      goal: "Починить Лего-поезд, открыть Дверь Сна и обняться.",
    },
    {
      icon: "📖",
      title: "Сон 3. Лес книжных страниц",
      text: "Ребята читают книгу снов и встают на страницы с нужными цветами и фигурами. Илюша ищет свои подсказки, Алиса — свои. Так открываются три страницы и находится Слонёнок.",
      goal: "Пройти все страницы, найти Слонёнка и обняться у двери.",
    },
    {
      icon: "🎨",
      title: "Сон 4. Поляна раскрасок",
      text: "Сначала Илюша раскрашивает домик, деревья и травку в левой части поляны: деревья — зелёным, домик — жёлтым, травку — красным. Только потом зелёный луч оживляет большое дерево и строит мост. Красный делает яблоко тяжёлым, и качели-катапульта подбрасывают Алису к Книге Сказок. Синяя краска из лужицы возвращает Птице Счастья крылья.",
      goal: "Раскрасить мир, разбудить Птицу Счастья и обняться на её спине.",
    },
  ];

  const MINI_RULES = [
    {
      icon: "🌈",
      title: "Радужный сон · 5 минут",
      text: "Илюша двигает синюю искорку и красит синим и зелёным, Алиса — жёлтую искорку и красным и жёлтым. В особых зонах наведите обе искорки и нажмите Пробел + Enter вместе: получатся фиолетовый и салатовый цвета.",
      goal: "Раскрасить 13 зон, лопать тучки за +5 секунд и разбить золотое сердечко.",
    },
    {
      icon: "🧱",
      title: "Лего-Башня · 5 минут",
      text: "У Илюши и Алисы в наборе есть и тяжёлые блоки, и крыши, и шпили. Сначала сложите вместе 5 тяжёлых блоков, потом поставьте крышу, затем шпиль и флажок. Возьмите деталь, донесите до башни, прыгните и отпустите кнопку.",
      goal: "Как только фундамент, крыша, шпиль и флажок готовы, башня сразу завершается: Мишка лезет к звёздочке, а дети обнимаются.",
    },
    {
      icon: "🐠",
      title: "Подводная охота",
      text: "Илюша стреляет синим шаром (W/S — прицел, Пробел — выстрел), Алиса — розовым (↑/↓ — прицел, Enter — выстрел). Попадайте по чёрным Кляксам, чтобы брызги окрашивали серых рыбок: круглых, карасика, щуку, рыбку-ангела и рыбку-меч. Раскрашенные рыбки не уплывают насовсем — они остаются плавать в океане. Одновременное попадание в одну Кляксу запускает Радужный Мега-Шар.",
      goal: "Спасти всех 12 рыбок, заполнить радугу и обняться в финале.",
    },
    {
      icon: "🌸",
      title: "Лесной оркестр цветов",
      text: "Илюша двигается по лесенке на W/S и целится A/D, Алиса — по лиане на ↑/↓ и целится ←/→. Стреляйте волшебными семенами в серые бутоны: они раскрываются и играют ноты. Семечко, попавшее в раскрытый цветок или в светящуюся лужайку внизу, отскакивает вверх и может разбудить ещё один.",
      goal: "Раскрыть все 16 цветов; Главный Бутон раскрывается, когда в него одновременно попадут Илюша и Алиса, и будит только ближний круг цветов.",
    },
    {
      icon: "🐇",
      title: "Лесные прятки-догонялки",
      text: "Первый раунд водит Илюша, второй — Алиса; каждый длится 60 секунд. Илюша бегает на W/A/S/D и исчезает на Пробел, Алиса — на стрелках и Enter. Невидимость длится 3 секунды и перезаряжается 7 секунд.",
      goal: "Поймать убегающего или продержаться до конца; звёздочки обоих складываются в общую копилку.",
    },
    {
      icon: "🌋",
      title: "Остров Вулкана и Лавовые Мостики",
      text: "Оба героя одинаково ловкие: A/D и ←/→ — бег, W и ↑ — прыжок, S и ↓ — спрыгнуть с любой платформы или мостика. Короткое нажатие Пробела или Enter добывает блок, удержание 0.5 секунды ставит его. Выше первого шара готовых мостиков нет: стройте путь сами. У каждого есть летающий мостик. На второй зелёной платформе ждёт звездолёт для двоих: он подбирает несобранные блоки, звёздочки светятся. Пока звездолёт летит, Пробел/Enter сбрасывает блоки. Посадка на корку — автоматически на S/↓; после посадки Пробел/Enter высаживает героев, а рядом со звездолётом — сажает обратно. Лава поднимается до второго зелёного поля и останавливается.",
      goal: "Подняться к Воздушному Шару и обняться в корзине.",
    },
  ];

  function openRules(kind) {
    if (state !== "start" && state !== "ending") return;
    const data = kind === "mini" ? MINI_RULES : DREAM_RULES;
    ui.rulesEyebrow.textContent = kind === "mini" ? "Сундук с игрушками" : "Волшебная Дверь Сна";
    ui.rulesTitle.textContent = kind === "mini" ? "Правила мини-игр" : "Правила снов";
    ui.rulesList.innerHTML = data.map((item) => `
      <article class="rule-item">
        <div class="rule-icon" aria-hidden="true">${item.icon}</div>
        <div>
          <h3>${item.title}</h3>
          <p>${item.text}</p>
          <p class="rule-goal">Цель: ${item.goal}</p>
        </div>
      </article>
    `).join("");
    showElement(ui.rulesScreen);
    Sound.click();
  }

  function closeRules() {
    hideElement(ui.rulesScreen);
  }

  function beginExitHold() {
    if (state !== "start" || exitHoldTimer) return;
    if (anyMenuOverlayOpen()) return;
    showElement(ui.exitLockScreen);
    ui.exitLockScreen.classList.remove("is-counting");
    void ui.exitLockScreen.offsetWidth;
    ui.exitLockScreen.classList.add("is-counting");
    showMenuHint("Удерживай Esc, чтобы закрыть игру…");
    Sound.click();
    exitHoldTimer = window.setTimeout(completeExit, 3000);
  }

  function cancelExitHold() {
    if (exitHoldTimer) {
      window.clearTimeout(exitHoldTimer);
      exitHoldTimer = null;
    }
    if (ui.exitLockScreen) {
      ui.exitLockScreen.classList.remove("is-counting");
      hideElement(ui.exitLockScreen);
    }
  }

  function completeExit() {
    exitHoldTimer = null;
    ui.exitLockScreen.classList.remove("is-counting");
    hideElement(ui.exitLockScreen);
    hideMenus();
    hideElement(ui.hud);
    hideElement(ui.dialogue);
    hideElement(ui.toast);
    hideElement(ui.friendshipHint);
    state = "exited";
    Sound.setPaused(true);
    Sound.stopSpeech();
    showElement(ui.goodnightScreen);
    try {
      window.close();
    } catch (_) {}
  }

  function menuVoice(el) {
    if (!el) return;
    const text = el.dataset.voice;
    if (!text) return;
    const speak = () => {
      if (state !== "start") return;
      showMenuHint(text);
      if (settings.voice) Sound.speak(text, "mama");
    };
    el.addEventListener("mouseenter", speak);
    el.addEventListener("focus", speak);
  }

  function isMenuRoomPoint(x, y) {
    if (x >= 330 && x <= 445 && y >= 330 && y <= 490) return "lamp";
    if (x >= 455 && x <= 825 && y >= 150 && y <= 430) return "window";
    if (x >= 0 && x <= 370 && y >= 380 && y <= 630) return "ilya";
    if (x >= 915 && x <= 1280 && y >= 380 && y <= 630) return "alisa";
    return null;
  }

  function handleMenuStageClick(event) {
    if (state !== "start" || anyMenuOverlayOpen()) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    const hit = isMenuRoomPoint(x, y);
    if (!hit) return;
    if (hit === "lamp") {
      menuState.lamp = (menuState.lamp + 1) % 3;
      Sound.click();
      showMenuHint("Лампочка щёлкнула! Какой уютный свет.");
      if (settings.voice) Sound.speak("Лампочка щёлкнула! Какой уютный свет.", "mama");
    } else if (hit === "window") {
      menuState.starAt = globalTime;
      Sound.sparkle();
      showMenuHint("Смотри, за окном летит улыбающаяся звёздочка!");
      if (settings.voice) Sound.speak("Смотри, звёздочка летит!", "mama");
    } else if (hit === "ilya") {
      menuState.pokeIlya = globalTime;
      Sound.click();
      showMenuHint("Илюша сладко потягивается во сне.");
      if (settings.voice) Sound.speak("Илюша сладко потягивается во сне.", "mama");
    } else if (hit === "alisa") {
      menuState.pokeAlisa = globalTime;
      Sound.click();
      showMenuHint("Алиса тихонько сопит.");
      if (settings.voice) Sound.speak("Алиса тихонько сопит.", "mama");
    }
  }

  function handleMenuMouseMove(event) {
    if (state !== "start" || anyMenuOverlayOpen()) {
      canvas.style.cursor = "";
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    canvas.style.cursor = isMenuRoomPoint(x, y) ? "pointer" : "";
  }

  function handleStickerChoice(event) {
    const chip = event.currentTarget;
    const id = chip.dataset.sticker;
    if (!stickerEarned(id)) {
      Sound.click();
      showMenuHint("Сначала пройди сон — и наклейка появится.");
      if (ui.stickerNote) ui.stickerNote.textContent = "Сначала пройди сон — и наклейка появится.";
      if (settings.voice) Sound.speak("Сначала пройди сон, и наклейка появится.", "mama");
      window.setTimeout(() => {
        if (!ui.stickerScreen.classList.contains("is-hidden")) renderStickerRoom();
      }, 1800);
      return;
    }
    if (placedStickers.has(id)) placedStickers.delete(id);
    else placedStickers.add(id);
    savePlacedStickers();
    renderStickerRoom();
    Sound.sparkle();
    showMenuHint(placedStickers.has(id) ? `${STICKER_NAMES[id]} приклеен в альбом!` : `${STICKER_NAMES[id]} вернулся в коробочку.`);
  }

  function handleStickerSlot(event) {
    const slot = event.currentTarget;
    const id = slot.dataset.sticker;
    if (!placedStickers.has(id)) return;
    placedStickers.delete(id);
    savePlacedStickers();
    renderStickerRoom();
    Sound.click();
    showMenuHint(`${STICKER_NAMES[id]} вернулся в коробочку.`);
  }

  function togglePause() {
    if (state === "playing") pauseGame();
    else if (state === "paused") resumeGame();
  }

  function pauseGame() {
    if (state !== "playing") return;
    state = "paused";
    showElement(ui.pauseScreen);
    keysDown.clear();
    keysPressed.clear();
    Sound.setPaused(true);
    hideElement(ui.friendshipHint);
  }

  function resumeGame() {
    if (state !== "paused") return;
    hideElement(ui.pauseScreen);
    state = "playing";
    Sound.setPaused(false);
    keysDown.clear();
    keysPressed.clear();
  }

  function restartCurrentLevel() {
    if (!level) return;
    transitionTo(() => {
      hideElement(ui.pauseScreen);
      hideElement(ui.completeScreen);
      loadLevel(levelIndex);
    }, 380);
  }

  // -----------------------------------------------------------------------
  // Загрузка сна
  // -----------------------------------------------------------------------

  function makePlayer(kind, spawn) {
    const isIlya = kind === "ilya";
    return {
      kind,
      name: isIlya ? "Илюша" : "Алиса",
      x: spawn.x,
      y: spawn.y,
      w: isIlya ? 42 : 34,
      h: isIlya ? 94 : 72,
      vx: 0,
      vy: 0,
      dir: 1,
      onGround: false,
      coyote: 0,
      jumpBuffer: 0,
      jumping: false,
      animTime: Math.random() * 4,
      hasFlashlight: false,
      flashlightOn: false,
      hasKey: false,
      hasBubbles: false,
      hasWheel: false,
      blowing: false,
      crouching: false,
      pushing: false,
      hugPose: 0,
      rescue: 0,
      rescueT: 0,
      rescueFrom: null,
      rescueTo: null,
      groundPlatform: null,
      stepTimer: 0,
    };
  }

  function loadLevel(index) {
    window.clearTimeout(introTimer);
    levelIndex = Math.max(0, Math.min(VO.LEVELS.length - 1, index));
    level = VO.LEVELS[levelIndex]();
    levelTime = 0;
    particles = [];
    fireflyTotal = level.fireflies.length;
    firefliesCollected = 0;
    lastObjective = "";
    cameraKick = 0;
    hugTimer = 0;
    hugCooldown = 0;
    hugCharge = 0;
    hugDoor = false;
    celebrationT = 0;

    ilya = makePlayer("ilya", level.spawn.ilya);
    alisa = makePlayer("alisa", level.spawn.alisa);
    players = [ilya, alisa];
    game.ilya = ilya;
    game.alisa = alisa;
    game.players = players;
    game.level = level;

    level.init(game);
    hideMenus();
    hideElement(ui.dialogue);
    hideElement(ui.toast);
    hideElement(ui.friendshipHint);
    showElement(ui.hud);
    ui.pauseScreen.classList.add("is-hidden");
    ui.completeScreen.classList.add("is-hidden");

    state = "playing";
    Sound.setPaused(false);
    if (Sound.setMood) Sound.setMood(level.id === "lego" ? "lego" : "lullaby");
    Sound.stopSpeech();
    dialogue.clear();
    keysDown.clear();
    keysPressed.clear();

    updateHudLevel();
    updateObjective(true);
    updateFireflyHud();
    updateKeyHud();
    updateSoundButtons();

    introTimer = window.setTimeout(() => {
      if (state === "playing" && level) {
        for (const line of level.intro) say(line.speaker, line.text);
      }
    }, 700);
  }

  // -----------------------------------------------------------------------
  // Ввод
  // -----------------------------------------------------------------------

  function isDown(code) {
    return keysDown.has(code);
  }

  function justPressed(code) {
    return keysPressed.has(code);
  }

  function handleKeyDown(event) {
    const code = event.code;
    if (TRACKED.has(code)) event.preventDefault();

    if (state === "rainbow" && code === "Escape") {
      endRainbowGame();
      return;
    }

    if (state === "tower" && code === "Escape") {
      endTowerGame();
      return;
    }

    if (state === "ocean" && code === "Escape") {
      endOceanGame();
      return;
    }

    if (state === "forest" && code === "Escape") {
      endForestGame();
      return;
    }

    if (state === "chase" && code === "Escape") {
      endChaseGame();
      return;
    }
    if (state === "cubes" && code === "Escape") {
      endCubesGame();
      return;
    }
    if (state === "volcano" && code === "Escape") {
      endVolcanoGame();
      return;
    }

    if (code === "Escape" || code === "KeyP") {
      if (state === "start") {
        if (!ui.exitLockScreen.classList.contains("is-hidden")) return;
        if (closeTopMenuOverlay()) return;
        if (code === "Escape") {
          beginExitHold();
          return;
        }
        return;
      }
      if (state === "playing" || state === "paused") {
        togglePause();
        return;
      }
    }

    if (event.repeat) return;

    if (state === "start" && !ui.startScreen.classList.contains("is-hidden") && !anyMenuOverlayOpen()) {
      if (code === "Enter") {
        openLevelSelect();
        return;
      }
    }

    if (state === "levelcomplete" && (code === "Enter" || code === "Space")) {
      nextLevel();
      return;
    }

    if (state === "ending" && code === "Enter") {
      playAgain();
      return;
    }

    if (TRACKED.has(code)) {
      keysDown.add(code);
      keysPressed.add(code);
    }
  }

  function handleKeyUp(event) {
    if (event.code === "Escape") cancelExitHold();
    keysDown.delete(event.code);
  }

  function clearKeys() {
    keysDown.clear();
    keysPressed.clear();
  }

  function updateKeyHud() {
    for (const el of keyEls) {
      el.classList.toggle("is-down", keysDown.has(el.dataset.key));
    }
  }

  function handleJumpInput(dt) {
    for (const p of players) {
      const actionCode = p.kind === "ilya" ? "Space" : "Enter";
      const altCode = p.kind === "ilya" ? "KeyW" : "ArrowUp";
      const actionPressed = justPressed(actionCode);
      const altPressed = justPressed(altCode);
      let suppress = false;

      if (actionPressed) {
        const context = level && level.actionContext ? level.actionContext(p, game) : null;
        if (context) suppress = true;
        if (isNearPortal(p)) suppress = true;
      }

      if ((actionPressed && !suppress) || altPressed) {
        p.jumpBuffer = 0.15;
      }
      p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    }
  }

  // -----------------------------------------------------------------------
  // Физика
  // -----------------------------------------------------------------------

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function dynamicPlatforms() {
    if (!level) return [];
    const arr = [];
    if (level.bridge) arr.push(level.bridge);
    if (level.platform) arr.push(level.platform);
    return arr;
  }

  function oneWayPlatforms() {
    if (!level) return [];
    const arr = level.oneWays ? level.oneWays.slice() : [];
    if (level.bridge) arr.push(level.bridge);
    if (level.platform) arr.push(level.platform);
    return arr;
  }

  function solidBlocksPlayer(solid, p) {
    if (solid.blocks && solid.blocks !== p.kind) return false;
    if (solid.lowOnly && p.y + p.h <= 438) return false;
    return true;
  }

  function friendshipDistance() {
    if (!ilya || !alisa) return 0;
    return Math.hypot(
      (ilya.x + ilya.w / 2) - (alisa.x + alisa.w / 2),
      (ilya.y + ilya.h - 45) - (alisa.y + alisa.h - 45)
    );
  }

  function friendshipFactor() {
    const d = friendshipDistance();
    if (d <= 390) return 1;
    return A.lerp(1, 0.58, A.clamp((d - 390) / 280, 0, 1));
  }

  function isNearPortal(p) {
    if (!level || !p) return false;
    const portal = level.getPortal();
    if (!portal) return false;
    return Math.hypot(
      (p.x + p.w / 2) - portal.cx,
      (p.y + p.h - 30) - portal.cy
    ) < portal.r;
  }

  function catchPlayer(p) {
    if (p.rescue > 0) return;
    const safeX =
      level.id === "socks"
        ? p.x + p.w / 2 < 580
          ? 404
          : 742
        : level.id === "lego"
          ? !level.flags.bridgeBuilt
            ? 330
            : p.x + p.w / 2 < 500
              ? 330
              : 660
          : level.id === "coloring"
            ? p.x + p.w / 2 < 595
              ? 330
              : 790
            : A.clamp(p.x + p.w / 2, 70, 1210) - p.w / 2;
    p.rescue = 0.0001;
    p.rescueT = 0;
    p.rescueFrom = { x: p.x, y: p.y };
    p.rescueTo = { x: safeX, y: GROUND - p.h };
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
    p.groundPlatform = null;
    p.hugPose = 0;
    p.flashlightOn = false;
    p.pushing = false;
    VO.Sound.bump();
    burst(p.x + p.w / 2, p.y + p.h, {
      count: 16,
      colors: ["#fff7e4", "#dfe8ff", "#ffe4b5"],
      speed: 110,
      gravity: -25,
      kind: "dot",
      life: 0.9,
      size: 4,
    });
    if (levelTime - lastRescueToast > 1.8) {
      lastRescueToast = levelTime;
      toast(`Облачко подхватило ${p.kind === "ilya" ? "Илюшу" : "Алису"} и вернуло на мягкий пол.`, "☁", 2800);
    }
  }

  function updateRescuePlayer(p, dt) {
    p.rescueT += dt;
    const k = A.clamp(p.rescueT / 1.15, 0, 1);
    const e = A.easeInOut(k);
    p.x = A.lerp(p.rescueFrom.x, p.rescueTo.x, e);
    p.y = A.lerp(p.rescueFrom.y, p.rescueTo.y, e) - Math.sin(k * Math.PI) * 42;
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
    if (k >= 1) {
      p.x = p.rescueTo.x;
      p.y = p.rescueTo.y;
      p.rescue = 0;
      p.onGround = true;
      p.groundPlatform = null;
      VO.Sound.land();
    }
  }

  function pushCube(p, cube, dx, prevX) {
    if (cube.locked || cube.hidden) return false;
    if (p.kind !== "ilya" || !p.onGround) return false;
    if (!overlaps(p, cube)) return false;
    if (p.y + p.h <= cube.y + 6) return false;
    const dir = Math.sign(dx);
    if (dir === 0) return false;
    const wasBeside =
      dir > 0 ? prevX + p.w <= cube.x + 5 : prevX >= cube.x + cube.w - 5;
    if (!wasBeside) return false;

    const amount = dx * 0.8;
    cube.x = A.clamp(cube.x + amount, 24, 1140);
    p.x = dir > 0 ? cube.x - p.w : cube.x + cube.w;
    p.pushing = true;
    if (levelTime - lastPushSound > 0.34) {
      lastPushSound = levelTime;
      VO.Sound.push();
    }
    return true;
  }

  function movePlayerX(p, dt) {
    const prevX = p.x;
    const dx = p.vx * dt;
    p.x += dx;
    p.pushing = false;

    if (level && level.pushables) {
      for (const cube of level.pushables) {
        if (cube.hidden) continue;
        if (!overlaps(p, cube)) continue;
        if (!pushCube(p, cube, dx, prevX)) {
          // Обычная твёрдая преграда.
          if (dx > 0) p.x = cube.x - p.w;
          else if (dx < 0) p.x = cube.x + cube.w;
          else {
            const left = p.x + p.w - cube.x;
            const right = cube.x + cube.w - p.x;
            if (left < right) p.x = cube.x - p.w;
            else p.x = cube.x + cube.w;
          }
          p.vx = 0;
        }
      }
    }

    if (level && level.solids) {
      for (const solid of level.solids) {
        if (!solidBlocksPlayer(solid, p)) continue;
        if (!overlaps(p, solid)) continue;
        if (dx > 0) p.x = solid.x - p.w;
        else if (dx < 0) p.x = solid.x + solid.w;
        else {
          const left = p.x + p.w - solid.x;
          const right = solid.x + solid.w - p.x;
          if (left < right) p.x = solid.x - p.w;
          else p.x = solid.x + solid.w;
        }
        p.vx = 0;
      }
    }

    p.x = A.clamp(p.x, 6, W - p.w - 6);
  }

  function tryStepUp(p) {
    if (!p.onGround) return;
    const feet = p.y + p.h;
    for (const plat of oneWayPlatforms()) {
      if (!plat || plat.disabled) continue;
      if (p.x + p.w <= plat.x + 2 || p.x >= plat.x + plat.w - 2) continue;
      if (feet >= plat.y - 1 && feet <= plat.y + 17 && p.vy >= 0) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.groundPlatform = plat;
        return;
      }
    }
  }

  function movePlayerY(p, dt) {
    const prevBottom = p.y + p.h;
    p.vy = Math.min(PHYS.maxFall, p.vy + PHYS.gravity * dt);
    p.y += p.vy * dt;
    p.onGround = false;
    p.groundPlatform = null;

    if (level && level.solids) {
      for (const solid of level.solids) {
        if (!solidBlocksPlayer(solid, p)) continue;
        if (!overlaps(p, solid)) continue;
        if (p.vy > 0 && prevBottom <= solid.y + 8) {
          p.y = solid.y - p.h;
          p.vy = 0;
          p.onGround = true;
          p.groundPlatform = null;
        } else if (p.vy < 0) {
          p.y = solid.y + solid.h;
          p.vy = 0;
        } else {
          const topPen = p.y + p.h - solid.y;
          const bottomPen = solid.y + solid.h - p.y;
          if (topPen < bottomPen) {
            p.y = solid.y - p.h;
            p.vy = 0;
            p.onGround = true;
          } else {
            p.y = solid.y + solid.h;
            p.vy = 0;
          }
        }
      }
    }

    // На мягкие кубики и подушки тоже можно запрыгивать.
    if (level && level.pushables) {
      for (const cube of level.pushables) {
        if (cube.hidden || !overlaps(p, cube)) continue;
        if (p.vy > 0 && prevBottom <= cube.y + 9) {
          p.y = cube.y - p.h;
          p.vy = 0;
          p.onGround = true;
          p.groundPlatform = null;
        } else if (p.vy < 0) {
          p.y = cube.y + cube.h;
          p.vy = 0;
        } else {
          const topPen = p.y + p.h - cube.y;
          const bottomPen = cube.y + cube.h - p.y;
          if (topPen < bottomPen) {
            p.y = cube.y - p.h;
            p.vy = 0;
            p.onGround = true;
          } else {
            p.y = cube.y + cube.h;
            p.vy = 0;
          }
        }
      }
    }

    for (const plat of oneWayPlatforms()) {
      if (!plat || plat.disabled) continue;
      if (p.x + p.w <= plat.x + 2 || p.x >= plat.x + plat.w - 2) continue;
      if (p.vy >= 0 && prevBottom <= plat.y + 8 && p.y + p.h >= plat.y) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.groundPlatform = plat;
      }
    }

    // Мягкое возвращение, если кто-то всё-таки оступился в «глубокое» место.
    if (p.y > 655 && !p.rescue) catchPlayer(p);
  }

  function updatePlayer(p, dt) {
    if (p.rescue > 0) {
      updateRescuePlayer(p, dt);
      return;
    }

    const wasGrounded = p.onGround;
    if (wasGrounded) p.coyote = 0.1;
    else p.coyote = Math.max(0, p.coyote - dt);

    let dir = 0;
    if (p.kind === "ilya") {
      if (isDown("KeyA")) dir -= 1;
      if (isDown("KeyD")) dir += 1;
    } else {
      if (isDown("ArrowLeft")) dir -= 1;
      if (isDown("ArrowRight")) dir += 1;
    }
    if (dir !== 0) p.dir = dir;

    const factor = friendshipFactor();
    const crouchFactor = p.crouching ? 0.64 : 1;
    const targetSpeed = dir * PHYS.speed[p.kind] * factor * crouchFactor;
    const accel = wasGrounded ? PHYS.accelGround : PHYS.accelAir;
    p.vx = A.lerp(p.vx, targetSpeed, 1 - Math.exp(-accel * dt));
    if (dir === 0 && wasGrounded) p.vx *= Math.exp(-11 * dt);
    if (Math.abs(p.vx) < 1.2) p.vx = 0;

    // Прыжок.
    if (p.jumpBuffer > 0 && (wasGrounded || p.coyote > 0) && !p.crouching) {
      p.vy = -PHYS.jump[p.kind];
      p.jumpBuffer = 0;
      p.coyote = 0;
      p.jumping = true;
      p.onGround = false;
      p.groundPlatform = null;
      VO.Sound.jump(p.kind);
      game.burst(p.x + p.w / 2, p.y + p.h, {
        count: 5,
        colors: ["#fff7e1", "#ffe6bd"],
        speed: 55,
        gravity: 30,
        kind: "dot",
        life: 0.4,
        size: 2.6,
      });
    }

    const jumpHeld =
      p.kind === "ilya"
        ? isDown("Space") || isDown("KeyW")
        : isDown("Enter") || isDown("ArrowUp");
    if (p.jumping && !jumpHeld && p.vy < 0) p.vy += PHYS.gravity * 1.35 * dt;
    if (p.vy >= 0) p.jumping = false;
    const fastFall = p.kind === "ilya" ? isDown("KeyS") : isDown("ArrowDown");
    if (fastFall && p.vy > 0) p.vy += PHYS.gravity * 0.55 * dt;

    movePlayerX(p, dt);
    if (wasGrounded && p.vy >= 0) tryStepUp(p);
    movePlayerY(p, dt);

    if (p.onGround && Math.abs(p.vx) > 30) {
      p.animTime += dt * (0.75 + Math.abs(p.vx) / 235);
      p.stepTimer += dt;
      if (p.stepTimer > 0.27) {
        p.stepTimer = 0;
        VO.Sound.step();
      }
    } else {
      p.animTime += dt * 0.55;
    }

    if (!wasGrounded && p.onGround && p.vy === 0) {
      VO.Sound.land();
    }
    void stepTimer;
  }

  function carryPlayers() {
    for (const p of players) {
      const plat = p.groundPlatform;
      if (!plat || plat.disabled) {
        if (plat && plat.disabled) p.groundPlatform = null;
        continue;
      }
      const onTop = Math.abs(p.y + p.h - plat.y) < 18;
      const inX = p.x + p.w > plat.x + 1 && p.x < plat.x + plat.w - 1;
      if (p.onGround && onTop && inX) {
        p.y += plat.y - (plat.prevY == null ? plat.y : plat.prevY);
        p.x += (plat.x || 0) - (plat.prevX == null ? plat.x : plat.prevX);
      } else if (!inX || !onTop) {
        p.groundPlatform = null;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Объятия и завершение сна
  // -----------------------------------------------------------------------

  function actionHeld(p) {
    return p.kind === "ilya" ? isDown("Space") : isDown("Enter");
  }

  function canHug() {
    if (!ilya || !alisa || hugTimer > 0 || hugCooldown > 0) return false;
    if (!ilya.onGround || !alisa.onGround) return false;
    const d = Math.hypot(ilya.x + ilya.w / 2 - (alisa.x + alisa.w / 2), ilya.y - alisa.y);
    return d < 122;
  }

  function startHug() {
    const portal = level ? level.getPortal() : null;
    const nearPortal =
      !!portal && isNearPortal(ilya) && isNearPortal(alisa);
    hugTimer = 1.65;
    hugCooldown = 2.7;
    hugCharge = 0;
    hugDoor = nearPortal;
    hugCount += 1;
    ilya.hugPose = 1;
    alisa.hugPose = 1;
    ilya.dir = alisa.x >= ilya.x ? 1 : -1;
    alisa.dir = ilya.x >= alisa.x ? 1 : -1;
    ilya.vx = 0;
    alisa.vx = 0;

    VO.Sound.hug();
    game.hearts((ilya.x + alisa.x) / 2 + 20, Math.min(ilya.y, alisa.y) - 5, 14);

    if (nearPortal) {
      if (level.onDoorHug) level.onDoorHug(game);
    } else {
      const praises = [
        "Как здорово вы помогаете друг другу!",
        "Обнимашки — это тоже волшебство!",
        "Какая дружная команда!",
        "Отличная работа, Илюша и Алиса!",
        "Держитесь рядом — и всё получится!",
      ];
      if (hugCount % 2 === 1) {
        say("mama", praises[Math.floor(Math.random() * praises.length)]);
      }
    }
  }

  function updateHug(dt) {
    if (hugCooldown > 0) hugCooldown = Math.max(0, hugCooldown - dt);

    if (hugTimer > 0) {
      hugTimer = Math.max(0, hugTimer - dt);
      const mid = (ilya.x + ilya.w / 2 + (alisa.x + alisa.w / 2)) / 2;
      ilya.x = A.lerp(ilya.x, mid - 42, 1 - Math.exp(-dt * 10));
      alisa.x = A.lerp(alisa.x, mid + 2, 1 - Math.exp(-dt * 10));
      ilya.dir = 1;
      alisa.dir = -1;
      ilya.hugPose = 1;
      alisa.hugPose = 1;
      ilya.vx = 0;
      ilya.vy = 0;
      alisa.vx = 0;
      alisa.vy = 0;
      if (hugTimer <= 0) {
        ilya.hugPose = 0;
        alisa.hugPose = 0;
        if (hugDoor) beginCelebration();
      }
      return;
    }

    const near = canHug();
    const bothActions = near && actionHeld(ilya) && actionHeld(alisa);
    if (bothActions) hugCharge = Math.min(0.5, hugCharge + dt);
    else hugCharge = Math.max(0, hugCharge - dt * 2.4);

    if (hugCharge >= 0.5) startHug();
  }

  function beginCelebration() {
    if (state !== "playing") return;
    state = "celebrating";
    celebrationT = 0;
    celebrationBurstTimer = 0;
    hugTimer = 1.65;
    hugCharge = 0;
    hideElement(ui.friendshipHint);
    hideElement(ui.dialogue);
    Sound.stopSpeech();
    Sound.celebrate();
    ilya.hugPose = 1;
    alisa.hugPose = 1;
    ilya.dir = 1;
    alisa.dir = -1;
    ilya.vx = 0;
    ilya.vy = 0;
    alisa.vx = 0;
    alisa.vy = 0;
    const portal = level.getPortal();
    if (portal) {
      game.hearts(portal.cx, portal.cy - 40, 24);
      game.burst(portal.cx, portal.cy - 20, {
        count: 90,
        colors: ["#ffe6a5", "#ffbdd1", "#c5b5ff", "#fff8d8", "#aee6c4"],
        speed: 300,
        gravity: 15,
        kind: "star",
        life: 2.4,
        size: 4.2,
      });
    }
  }

  function updateCelebration(dt) {
    levelTime += dt;
    celebrationT += dt;
    hugTimer = Math.max(0, hugTimer - dt);

    if (level) {
      const dynamics = dynamicPlatforms();
      for (const d of dynamics) {
        d.prevY = d.y;
        d.prevX = d.x;
      }
      level.preUpdate(dt, game);
    }

    const portal = level.getPortal();
    if (portal) {
      const mid = portal.cx;
      ilya.x = A.lerp(ilya.x, mid - 52, 1 - Math.exp(-dt * 4));
      alisa.x = A.lerp(alisa.x, mid + 6, 1 - Math.exp(-dt * 4));
      if (Math.abs(ilya.y + ilya.h - alisa.y - alisa.h) < 50) {
        ilya.y = A.lerp(ilya.y, Math.min(ilya.y, alisa.y), 1 - Math.exp(-dt * 3));
      }
    }

    celebrationBurstTimer -= dt;
    if (celebrationBurstTimer <= 0) {
      celebrationBurstTimer = 0.58;
      const cx = portal ? portal.cx : 640;
      const cy = portal ? portal.cy - 60 : 340;
      burst(cx + (Math.random() * 380 - 190), cy - 30 + Math.random() * 170, {
        count: 28,
        colors: ["#ffe6a5", "#ffbdd1", "#c5b5ff", "#fff8d8", "#aee6c4"],
        speed: 220,
        gravity: 40,
        kind: "star",
        life: 1.7,
        size: 3.4,
      });
      if (Math.random() > 0.5) VO.Sound.sparkle();
    }

    updateParticles(dt);
    updateToast(dt);
    updateDialog(dt);
    cameraKick *= Math.exp(-dt * 5);

    if (celebrationT > 4.1) showComplete();
  }

  function showComplete() {
    state = "levelcomplete";
    hideElement(ui.dialogue);
    hideElement(ui.friendshipHint);
    hideElement(ui.toast);
    Sound.stopSpeech();
    ui.completeEyebrow.textContent = level.completeEyebrow;
    ui.completeTitle.textContent = level.completeTitle;
    ui.completeText.textContent = level.completeText;
    if (fireflyTotal > 0 && firefliesCollected >= fireflyTotal) {
      ui.completePraise.innerHTML = `<span>✦</span> Все светлячки собраны: ${firefliesCollected} из ${fireflyTotal}`;
    } else {
      ui.completePraise.innerHTML = `<span>♡</span> Обнимашки — лучшая награда`;
    }
    ui.nextLevelBtn.textContent = levelIndex < VO.LEVELS.length - 1 ? "Следующий сон" : "К финалу";
    showElement(ui.completeScreen);
    saveCompletedLevel(levelIndex);
    saveProgress(levelIndex + 1);
    drawRewardCanvas();
  }

  function nextLevel() {
    if (state !== "levelcomplete") return;
    if (levelIndex < VO.LEVELS.length - 1) {
      transitionTo(() => {
        hideElement(ui.completeScreen);
        loadLevel(levelIndex + 1);
      }, 400);
    } else {
      transitionTo(() => {
        hideElement(ui.completeScreen);
        showEnding();
      }, 420);
    }
  }

  function showEnding() {
    state = "ending";
    hideMenus();
    hideElement(ui.hud);
    hideElement(ui.dialogue);
    hideElement(ui.toast);
    hideElement(ui.friendshipHint);
    saveProgress(VO.LEVELS.length);
    Sound.setPaused(false);
    Sound.stopSpeech();
    keysDown.clear();
    keysPressed.clear();
    showElement(ui.endingScreen);
  }

  function playAgain() {
    if (state !== "ending") return;
    ensureAudio();
    transitionTo(() => {
      hideMenus();
      hideElement(ui.hud);
      loadLevel(0);
    }, 420);
  }

  // -----------------------------------------------------------------------
  // Частицы
  // -----------------------------------------------------------------------

  function burst(x, y, opts) {
    const o = opts || {};
    const count = o.count || 12;
    const colors = o.colors || ["#ffe6a5", "#ffbdd1", "#c5b5ff"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU;
      const speed = (o.speed || 150) * (0.35 + Math.random() * 0.85);
      const life = (o.life || 1.2) * (0.65 + Math.random() * 0.65);
      particles.push({
        x,
        y: y + (o.offsetY || 0),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (o.lift || 0),
        gravity: o.gravity == null ? 60 : o.gravity,
        life,
        maxLife: life,
        size: (o.size || 3) * (0.65 + Math.random() * 0.8),
        color: colors[Math.floor(Math.random() * colors.length)],
        kind: o.kind || "spark",
        rot: Math.random() * TAU,
        spin: (Math.random() - 0.5) * 6,
        alpha: 1,
      });
    }
    if (particles.length > 500) particles.splice(0, particles.length - 500);
  }

  function hearts(x, y, n) {
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 40 + Math.random() * 90;
      const life = 1.2 + Math.random() * 0.9;
      particles.push({
        x: x + (Math.random() - 0.5) * 34,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        gravity: -22,
        life,
        maxLife: life,
        size: 4 + Math.random() * 5,
        color: Math.random() > 0.5 ? "#ffb4c9" : "#ffd4a0",
        kind: "heart",
        rot: (Math.random() - 0.5) * 0.6,
        spin: (Math.random() - 0.5) * 2,
        alpha: 1,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= Math.exp(-dt * 0.65);
      p.rot += p.spin * dt;
      p.alpha = A.clamp(p.life / p.maxLife, 0, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const a = p.alpha * (0.55 + 0.45 * Math.sin(p.life * 9 + p.rot));
      if (p.kind === "heart") {
        A.heart(context(), p.x, p.y, p.size, p.color, a, p.rot);
      } else if (p.kind === "spark" || p.kind === "star") {
        A.sparkle(context(), p.x, p.y, p.size, p.color, a, p.rot);
      } else {
        const g = ctx;
        g.save();
        g.globalAlpha = a;
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x, p.y, p.size, 0, TAU);
        g.fill();
        g.restore();
      }
    }
  }

  function collectFirefly(f) {
    firefliesCollected = Math.min(fireflyTotal, firefliesCollected + 1);
    updateFireflyHud();
    if (firefliesCollected >= fireflyTotal && fireflyTotal > 0) {
      toast("Все светлячки-подсказки собраны! Алиса — настоящая звёздочка.", "✦", 3600);
      if (levelTime > 4) say("mama", "Все светлячки собраны! Алиса, ты настоящая звёздочка.");
    }
  }

  // -----------------------------------------------------------------------
  // Обновление игрового мира
  // -----------------------------------------------------------------------

  function updatePlaying(dt) {
    if (!level) return;
    levelTime += dt;

    alisa.crouching = false;

    const dynamics = dynamicPlatforms();
    for (const d of dynamics) {
      d.prevY = d.y;
      d.prevX = d.x;
    }

    if (level.preUpdate) level.preUpdate(dt, game);
    carryPlayers();

    ilya.flashlightOn =
      !!ilya.hasFlashlight && isDown("Space") && !ilya.crouching && state === "playing";

    handleJumpInput(dt);

    if (hugTimer <= 0) {
      updatePlayer(ilya, dt);
      updatePlayer(alisa, dt);
    }

    if (level.postUpdate) level.postUpdate(dt, game);

    updateHug(dt);
    updateParticles(dt);
    updateDialog(dt);
    updateToast(dt);
    updateHud();
    updateFriendshipHint();
    updateKeyHud();
    cameraKick *= Math.exp(-dt * 5);
  }

  // -----------------------------------------------------------------------
  // HUD, диалоги и подсказки
  // -----------------------------------------------------------------------

  function updateHudLevel() {
    ui.dreamNumber.textContent = `Сон ${levelIndex + 1}`;
    ui.levelTitle.textContent = level.title;
    ui.levelTitle.classList.toggle("is-long", level.title.length > 28);
    ui.levelTitle.classList.toggle("is-very-long", level.title.length > 32);
    ui.colorPill.classList.toggle("is-hidden", level.id !== "coloring");
    const dots = Array.from(ui.dreamDots.children);
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-done", i < levelIndex);
      dot.classList.toggle("is-active", i === levelIndex);
    });
    ui.fireflyPill.style.display = fireflyTotal > 0 ? "" : "none";
  }

  function updateObjective(force) {
    if (!level) return;
    const text = level.getObjective();
    if (text !== lastObjective || force) {
      lastObjective = text;
      ui.objectiveText.innerHTML = text;
      ui.objectiveCard.classList.remove("is-pop");
      void ui.objectiveCard.offsetWidth;
      ui.objectiveCard.classList.add("is-pop");
      window.clearTimeout(objectivePopTimer);
      objectivePopTimer = window.setTimeout(() => {
        ui.objectiveCard.classList.remove("is-pop");
      }, 620);
    }
  }

  function updateFireflyHud() {
    ui.fireflyCount.textContent = `${firefliesCollected} / ${fireflyTotal}`;
  }

  function updateColorHud() {
    if (!level || level.id !== "coloring" || !level.color) {
      ui.colorPill.classList.add("is-hidden");
      return;
    }
    ui.colorPill.classList.remove("is-hidden");
    ui.colorDot.style.background = level.colorHex || "#66c98a";
    ui.colorDot.style.boxShadow = `0 0 calc(9 * var(--u)) ${level.colorHex || "#66c98a"}`;
    ui.colorName.textContent = level.colorName || "Зелёный";
  }

  function updateHud() {
    updateObjective(false);
    updateFireflyHud();
    updateColorHud();
  }

  function updateFriendshipHint() {
    if (!ilya || !alisa) return;
    const far = friendshipDistance() > 445;
    ui.friendshipHint.classList.toggle("is-hidden", !far);
  }

  const dialogue = {
    queue: [],
    current: null,
    timer: 0,
    gap: 0,
    active: false,

    say(speaker, text) {
      if (!text) return;
      this.queue.push({ speaker, text });
      if (!this.current && this.gap <= 0) this.advance();
    },

    advance() {
      if (this.current) {
        this.hide();
        this.current = null;
        this.gap = 0.16;
        return;
      }
      if (!this.queue.length) return;
      const line = this.queue.shift();
      this.current = line;
      this.show(line);
    },

    show(line) {
      const names = { mama: "Мама", ilya: "Илюша", alisa: "Алиса", both: "Илюша и Алиса" };
      ui.dialogueName.textContent = names[line.speaker] || "Мама";
      ui.dialogueText.textContent = line.text;
      A.drawPortrait(portraitCtx, line.speaker);
      ui.dialogue.classList.remove("is-hidden");
      this.active = true;
      this.timer = A.clamp(3.6 + line.text.length * 0.05, 4.2, 10);
      Sound.speak(line.text, line.speaker);
    },

    hide() {
      ui.dialogue.classList.add("is-hidden");
      this.active = false;
    },

    update(dt) {
      if (state === "paused" || state === "start" || state === "ending" || state === "transition") return;
      if (this.current) {
        this.timer -= dt;
        if (this.timer <= 0) {
          this.current = null;
          this.hide();
          this.gap = 0.24;
        }
      } else if (this.gap > 0) {
        this.gap -= dt;
        if (this.gap <= 0 && this.queue.length) this.advance();
      }
    },

    next() {
      if (this.current) {
        this.current = null;
        this.hide();
        this.gap = 0.12;
        Sound.stopSpeech();
      } else if (this.queue.length) {
        this.advance();
      }
    },

    clear() {
      this.queue = [];
      this.current = null;
      this.gap = 0;
      this.timer = 0;
      this.hide();
    },
  };

  function say(speaker, text) {
    dialogue.say(speaker, text);
  }

  function sayNow(speaker, text) {
    dialogue.clear();
    if (text) dialogue.say(speaker, text);
  }

  function updateDialog(dt) {
    dialogue.update(dt);
  }

  function sayMany(lines) {
    for (const line of lines) {
      if (Array.isArray(line)) say(line[0], line[1]);
      else if (line && line.speaker) say(line.speaker, line.text);
    }
  }

  function toast(text, icon, duration) {
    ui.toastIcon.textContent = icon || "✦";
    ui.toastText.textContent = text;
    ui.toast.classList.remove("is-hidden");
    toastTimer = duration || 3000;
  }

  function updateToast(dt) {
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) ui.toast.classList.add("is-hidden");
    }
  }

  // -----------------------------------------------------------------------
  // Отрисовка
  // -----------------------------------------------------------------------

  function context() {
    return ctx;
  }

  function drawRescueClouds() {
    for (const p of players) {
      if (p.rescue > 0) {
        A.drawCloud(ctx, p.x + p.w / 2, p.y + p.h + 10, 96, 40, "rgba(255, 250, 238, 0.94)", { shadow: true });
        A.drawCloud(ctx, p.x + p.w / 2 - 20, p.y + p.h + 18, 58, 26, "rgba(255, 247, 232, 0.8)", { shine: false });
      }
    }
  }

  function drawPlayers() {
    if (!ilya || !alisa) return;
    A.drawCharacter(ctx, ilya, levelTime);
    A.drawCharacter(ctx, alisa, levelTime);
  }

  function drawFriendshipRibbon() {
    if (!ilya || !alisa) return;
    const ax = ilya.x + ilya.w / 2;
    const ay = ilya.y + ilya.h - 48;
    const bx = alisa.x + alisa.w / 2;
    const by = alisa.y + alisa.h - 40;
    const d = Math.hypot(bx - ax, by - ay);
    if (d < 8) return;
    const far = d > 445;
    const midX = (ax + bx) / 2;
    const midY = Math.max(ay, by) + 34 + Math.min(40, d * 0.05);
    const color1 = far ? "rgba(255, 160, 120, 0.82)" : "rgba(255, 181, 205, 0.8)";
    const color2 = far ? "rgba(255, 116, 100, 0.78)" : "rgba(151, 203, 255, 0.78)";
    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.save();
    ctx.lineCap = "round";
    ctx.setLineDash([2, 8]);
    ctx.lineDashOffset = -levelTime * 30;
    ctx.shadowColor = far ? "rgba(255, 130, 100, 0.6)" : "rgba(255, 202, 220, 0.55)";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(midX, midY, bx, by);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    // Бусинки-сердечки на ленте.
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      const x = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * midX + t * t * bx;
      const y = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * midY + t * t * by;
      A.heart(ctx, x, y, 2.7 + Math.sin(levelTime * 2 + i) * 0.5, far ? "#ffb08f" : "#ffd1df", 0.8, 0.2);
    }
    ctx.restore();
  }

  function drawHugEffects() {
    if (!ilya || !alisa) return;
    const mx = (ilya.x + ilya.w / 2 + alisa.x + alisa.w / 2) / 2;
    const my = Math.min(ilya.y, alisa.y) - 18;
    if (hugTimer > 0) {
      A.glow(ctx, mx, my + 60, 110, "rgba(255, 192, 208, 0.25)", 0.7);
      for (let i = 0; i < 3; i++) {
        const a = levelTime * 1.6 + i * 2.1;
        A.heart(ctx, mx + Math.cos(a) * (32 + i * 8), my - 15 + Math.sin(a * 1.3) * 18, 4.2, i % 2 ? "#ffd1a1" : "#ffb3c8", 0.85, Math.sin(a) * 0.3);
      }
    } else if (hugCharge > 0) {
      const k = hugCharge / 0.5;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 249, 231, 0.45)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(mx, my - 20, 17, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = "#ffc3d5";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(mx, my - 20, 17, -Math.PI / 2, -Math.PI / 2 + TAU * k);
      ctx.stroke();
      A.heart(ctx, mx, my - 20, 6 + k * 3, "#ffb3c8", 0.9, 0);
      ctx.restore();
    }
  }

  function drawRewardCanvas() {
    if (!level) return;
    S.drawReward(rewardCtx, level.toy, globalTime);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#12162f";
    ctx.fillRect(0, 0, W, H);

    if (state === "start") {
      S.drawMainMenuRoom(ctx, globalTime, menuState);
      return;
    }

    if (state === "rainbow") {
      if (rainbow) VO.Rainbow.draw(ctx, rainbow, globalTime);
      return;
    }

    if (state === "tower") {
      if (tower) VO.Tower.draw(ctx, tower, globalTime);
      return;
    }

    if (state === "ocean") {
      if (ocean) VO.Ocean.draw(ctx, ocean, globalTime);
      return;
    }

    if (state === "forest") {
      if (forest) VO.Forest.draw(ctx, forest, globalTime);
      return;
    }

    if (state === "chase") {
      if (chase) VO.Chase.draw(ctx, chase, globalTime);
      return;
    }
    if (state === "cubes") {
      if (cubes) VO.Cubes.draw(ctx, cubes, globalTime);
      return;
    }
    if (state === "volcano") {
      if (volcano) VO.Volcano.draw(ctx, volcano, globalTime);
      return;
    }

    if (state === "ending") {
      S.drawEndingScene(ctx, globalTime);
      return;
    }

    if (state === "exited") {
      ctx.fillStyle = "#0a0d1d";
      ctx.fillRect(0, 0, W, H);
      return;
    }

    if (!level) {
      S.drawMainMenuRoom(ctx, globalTime, menuState);
      return;
    }

    ctx.save();
    if (cameraKick > 0.15) {
      const k = Math.min(cameraKick, 5.5);
      ctx.translate(
        Math.sin(globalTime * 92) * k * 0.45,
        Math.cos(globalTime * 77) * k * 0.32
      );
    }

    level.drawBack(ctx, levelTime, game);
    drawRescueClouds();
    drawPlayers();
    drawFriendshipRibbon();
    level.drawFront(ctx, levelTime, game);
    drawHugEffects();
    drawParticles();
    S.drawVignette(ctx, level.id === "socks" ? 0.38 : level.id === "lego" ? 0.2 : 0.46);
    S.drawGrain(ctx);
    ctx.restore();

    if (state === "levelcomplete") drawRewardCanvas();
  }

  // -----------------------------------------------------------------------
  // Главный цикл
  // -----------------------------------------------------------------------

  function frame(now) {
    const raw = Math.min(0.06, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    globalTime += raw;
    const dt = Math.min(0.033, raw);

    if (state === "playing") {
      updatePlaying(dt);
    } else if (state === "rainbow") {
      updateRainbow(dt);
    } else if (state === "tower") {
      updateTowerGame(dt);
    } else if (state === "ocean") {
      updateOceanGame(dt);
    } else if (state === "forest") {
      updateForestGame(dt);
    } else if (state === "chase") {
      updateChaseGame(dt);
    } else if (state === "cubes") {
      updateCubesGame(dt);
    } else if (state === "volcano") {
      updateVolcanoGame(dt);
    } else if (state === "celebrating") {
      updateCelebration(dt);
    } else if (state === "levelcomplete") {
      updateParticles(dt);
      updateToast(dt);
      cameraKick *= Math.exp(-dt * 5);
    }

    render();
    keysPressed.clear();
    window.requestAnimationFrame(frame);
  }

  // -----------------------------------------------------------------------
  // Кнопки и служебные события
  // -----------------------------------------------------------------------

  function toggleSound() {
    settings.sound = !settings.sound;
    ensureAudio();
    Sound.setMusicEnabled(settings.sound);
    updateSoundButtons();
    saveSettings();
    if (settings.sound) Sound.click();
  }

  function toggleVoice() {
    settings.voice = !settings.voice;
    Sound.setVoiceEnabled(settings.voice);
    updateSoundButtons();
    saveSettings();
    if (!settings.voice) Sound.stopSpeech();
    else Sound.click();
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {}
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width) return;
    stage.style.setProperty("--u", `${rect.width / W}px`);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.round(W * dpr);
    const bh = Math.round(H * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  function bindEvents() {
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", () => {
      keysDown.clear();
      keysPressed.clear();
      cancelExitHold();
      if (state === "playing") pauseGame();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state === "playing") pauseGame();
    });

    ui.menuDoor.addEventListener("click", openLevelSelect);
    ui.menuChest.addEventListener("click", openMiniGames);
    ui.menuAlbum.addEventListener("click", openStickers);
    menuVoice(ui.menuDoor);
    menuVoice(ui.menuChest);
    menuVoice(ui.menuAlbum);
    ui.levelSelectClose.addEventListener("click", () => {
      hideElement(ui.levelSelectScreen);
      showMenuHint("Возвращайся, когда выберешь сон.");
      Sound.click();
    });
    for (const choice of ui.levelChoices) {
      menuVoice(choice);
      choice.addEventListener("click", () => {
        const index = parseInt(choice.dataset.level || "0", 10);
        startChosenLevel(index);
      });
    }
    ui.miniClose.addEventListener("click", () => {
      hideElement(ui.miniGamesScreen);
      showMenuHint("Возвращайся, когда захочешь построить башню или раскрасить сон.");
      Sound.click();
    });
    for (const choice of ui.miniChoices) {
      menuVoice(choice);
      choice.addEventListener("click", () => {
        if (choice.dataset.mini === "rainbow") {
          startRainbowGame();
          return;
        }
        if (choice.dataset.mini === "lego") {
          startTowerGame();
          return;
        }
        if (choice.dataset.mini === "ocean") {
          startOceanGame();
          return;
        }
        if (choice.dataset.mini === "forest") {
          startForestGame();
          return;
        }
        if (choice.dataset.mini === "chase") {
          startChaseGame();
          return;
        }
        if (choice.dataset.mini === "volcano") {
          startVolcanoGame();
          return;
        }
        const name = choice.querySelector("strong").textContent;
        Sound.click();
        if (ui.miniNote) ui.miniNote.textContent = `«${name}» ещё не готова.`;
        showMenuHint("Эта мини-игра ещё не готова.");
        if (settings.voice) Sound.speak(`«${name}» ещё не готова.`, "mama");
      });
    }
    ui.stickerClose.addEventListener("click", () => {
      hideElement(ui.stickerScreen);
      Sound.stopSpeech();
      showMenuHint("Наклейки ждут тебя в альбоме.");
      Sound.click();
    });
    for (const chip of ui.stickerChips) chip.addEventListener("click", handleStickerChoice);
    for (const slot of ui.stickerSlots) slot.addEventListener("click", handleStickerSlot);
    for (const slot of ui.stickerSlots) {
      slot.tabIndex = 0;
      slot.addEventListener("mouseenter", () => showStickerInfo(slot.dataset.sticker, { fromAlbum: true, allowVoice: true }));
      slot.addEventListener("focus", () => showStickerInfo(slot.dataset.sticker, { fromAlbum: true, allowVoice: false }));
    }
    for (const chip of ui.stickerChips) {
      chip.addEventListener("mouseenter", () => showStickerInfo(chip.dataset.sticker, { fromAlbum: false, allowVoice: false }));
      chip.addEventListener("focus", () => showStickerInfo(chip.dataset.sticker, { fromAlbum: false, allowVoice: false }));
    }
    ui.rainbowBackBtn.addEventListener("click", endRainbowGame);
    ui.rainbowAgainBtn.addEventListener("click", restartRainbowGame);
    ui.rainbowMenuBtn.addEventListener("click", endRainbowGame);
    ui.towerBackBtn.addEventListener("click", endTowerGame);
    ui.towerAgainBtn.addEventListener("click", restartTowerGame);
    ui.towerMenuBtn.addEventListener("click", endTowerGame);
    ui.oceanBackBtn.addEventListener("click", endOceanGame);
    ui.oceanAgainBtn.addEventListener("click", restartOceanGame);
    ui.oceanMenuBtn.addEventListener("click", endOceanGame);
    ui.forestBackBtn.addEventListener("click", endForestGame);
    ui.forestAgainBtn.addEventListener("click", restartForestGame);
    ui.forestMenuBtn.addEventListener("click", endForestGame);
    ui.chaseBackBtn.addEventListener("click", endChaseGame);
    ui.chaseAgainBtn.addEventListener("click", restartChaseGame);
    ui.chaseMenuBtn.addEventListener("click", endChaseGame);
    ui.volcanoBackBtn.addEventListener("click", endVolcanoGame);
    ui.volcanoAgainBtn.addEventListener("click", restartVolcanoGame);
    ui.volcanoMenuBtn.addEventListener("click", endVolcanoGame);

    ui.howBtn.addEventListener("click", showHow);
    ui.menuFullscreenBtn.addEventListener("click", toggleFullscreen);
    ui.dreamRulesBtn.addEventListener("click", () => openRules("dream"));
    ui.miniRulesBtn.addEventListener("click", () => openRules("mini"));
    ui.rulesClose.addEventListener("click", closeRules);
    ui.rulesOk.addEventListener("click", closeRules);
    ui.howCloseBtn.addEventListener("click", hideHow);
    ui.howPlayBtn.addEventListener("click", () => {
      hideHow();
      openLevelSelect();
    });
    ui.pauseBtn.addEventListener("click", togglePause);
    ui.resumeBtn.addEventListener("click", resumeGame);
    ui.restartLevelBtn.addEventListener("click", restartCurrentLevel);
    ui.toMenuBtn.addEventListener("click", goToMenu);
    ui.nextLevelBtn.addEventListener("click", nextLevel);
    ui.replayBtn.addEventListener("click", restartCurrentLevel);
    ui.playAgainBtn.addEventListener("click", playAgain);
    ui.endingMenuBtn.addEventListener("click", goToMenu);
    ui.soundBtn.addEventListener("click", toggleSound);
    ui.voiceBtn.addEventListener("click", toggleVoice);
    if (ui.menuVoiceBtn) ui.menuVoiceBtn.addEventListener("click", toggleVoice);
    ui.fullscreenBtn.addEventListener("click", toggleFullscreen);
    ui.dialogueNext.addEventListener("click", () => dialogue.next());
    ui.dialogue.addEventListener("click", (event) => {
      if (event.target === ui.dialogueNext) return;
      dialogue.next();
    });
    canvas.addEventListener("click", handleMenuStageClick);
    canvas.addEventListener("mousemove", handleMenuMouseMove);
    const unlockMenuAudio = () => {
      if (state !== "start") return;
      ensureAudio();
      if (!menuGreetingHeard) speakMenuGreeting(true);
    };
    window.addEventListener("pointerdown", unlockMenuAudio, { once: true });
    window.addEventListener("keydown", unlockMenuAudio, { once: true });

    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        if (state === "start" && !menuGreetingHeard && !anyMenuOverlayOpen()) {
          speakMenuGreeting(false);
        }
      });
    }

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(resize);
      ro.observe(stage);
    }
    window.addEventListener("resize", resize);
  }

  // -----------------------------------------------------------------------
  // Запуск
  // -----------------------------------------------------------------------

  function init() {
    loadSettings();
    updateSoundButtons();
    resize();
    bindEvents();
    showStartScreen();
    window.requestAnimationFrame((now) => {
      lastFrame = now;
      window.requestAnimationFrame(frame);
    });

    // Небольшой отладочный мостик — не показывается игрокам.
    window.__VO_DEBUG = {
      get state() { return state; },
      get level() { return level; },
      get game() { return game; },
      get players() { return players; },
      get rainbow() { return rainbow; },
      get tower() { return tower; },
      get ocean() { return ocean; },
      get forest() { return forest; },
      get chase() { return chase; },
      get menuGreetingHeard() { return menuGreetingHeard; },
      startRainbow: startRainbowGame,
      endRainbow: endRainbowGame,
      startTower: startTowerGame,
      endTower: endTowerGame,
      startOcean: startOceanGame,
      endOcean: endOceanGame,
      startForest: startForestGame,
      endForest: endForestGame,
      startChase: startChaseGame,
      endChase: endChaseGame,
      chase,
      get volcano() { return volcano; },
      startVolcano: startVolcanoGame,
      endVolcano: endVolcanoGame,
      startAt(i) {
        hideMenus();
        hideElement(ui.hud);
        ensureAudio();
        loadLevel(i);
      },
      teleport(kind, x, y) {
        const p = kind === "alisa" ? alisa : ilya;
        if (!p) return;
        p.x = x;
        p.y = y == null ? GROUND - p.h : y;
        p.vx = 0;
        p.vy = 0;
      },
      setFlag(key, value) {
        if (level && level.flags) level.flags[key] = value;
      },
      showComplete() {
        if (level) {
          state = "playing";
          showComplete();
        }
      },
    };
  }

  init();
})();
