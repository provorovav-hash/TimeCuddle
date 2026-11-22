(function () {
  "use strict";

  const W = 1280;
  const H = 720;
  const GROUND = 620;
  const TOWER_X = 640;
  const A = VO.Art;
  const TIME_LIMIT = 300;
  const MIN_HEAVY = 5;
  const PART_PATTERN = ["brick", "brick", "brick", "roof", "brick", "spire", "brick", "flag"];

  const HEAVY_COLORS = ["#5b8ed6", "#68b8c9", "#8b7bd3", "#66a6c9", "#7f8fd6"];
  const LIGHT_COLORS = ["#ef8d8f", "#f2bd5f", "#7ed0b0", "#c79bea", "#f3a1bd"];

  const INTRO_LINES = [
    ["mama", "Ребята, посмотрите на Мишку! Он так хочет достать до звёздочки на самом высоком облачке. Давайте построим для него огромную Лего-башню до самого неба! Время пошло!", 4.4],
    ["ilya", "Смотри, у нас у обоих есть тяжёлые блоки, крыши и шпили! Сначала строим башню из блоков, а потом поставим крышу.", 3.6],
    ["alisa", "А на крышу — красивый шпиль, а потом флажок! Побежали строить вместе!", 3.2],
  ];

  function rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function noteFreq(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function makePlayer(kind, x) {
    const h = kind === "ilya" ? 88 : 102;
    return {
      kind,
      x,
      feetY: GROUND,
      w: kind === "ilya" ? 48 : 52,
      h,
      vy: 0,
      vx: 0,
      dir: kind === "ilya" ? 1 : -1,
      onGround: true,
      animTime: 0,
      carry: null,
      hugPose: 0,
    };
  }

  function makePart(side, index) {
    const type = PART_PATTERN[index % PART_PATTERN.length];
    if (type === "brick") {
      const w = 100 + (index % 3) * 16;
      return {
        side,
        kind: "heavy",
        type: "brick",
        w,
        h: 38,
        color: HEAVY_COLORS[index % HEAVY_COLORS.length],
      };
    }
    if (type === "roof") return { side, kind: "light", type, w: 104, h: 34, color: LIGHT_COLORS[index % LIGHT_COLORS.length] };
    if (type === "spire") return { side, kind: "light", type, w: 34, h: 58, color: LIGHT_COLORS[index % LIGHT_COLORS.length] };
    return { side, kind: "light", type: "flag", w: 58, h: 64, color: LIGHT_COLORS[index % LIGHT_COLORS.length] };
  }

  function create() {
    const s = {
      phase: "intro",
      time: TIME_LIMIT,
      timeMax: TIME_LIMIT,
      introT: 0,
      elapsed: 0,
      heightM: 0,
      floors: 0,
      placed: 0,
      milestones: new Set(),
      collapseT: 0,
      tower: { top: GROUND, blocks: [] },
      players: {
        ilya: makePlayer("ilya", 180),
        alisa: makePlayer("alisa", 1100),
      },
      parts: { left: [], right: [] },
      partIndex: { left: 2, right: 2 },
      spawn: { left: 0.2, right: 0.6 },
      stage: "base",
      heavyCount: 0,
      hasRoof: false,
      hasSpire: false,
      hasFlag: false,
      hasTop: false,
      hint: "",
      hintT: 0,
      falling: [],
      prevAction: { Space: false, Enter: false },
      line: null,
      lineT: 0,
      lineQueue: [],
      camera: 0,
      climaxT: 0,
      hugT: 0,
      bearClimb: 0,
      bearX: TOWER_X - 180,
      starTaken: false,
      hugged: false,
      rewarded: false,
      rewardShown: false,
      hugPress: { Space: -10, Enter: -10 },
      particles: [],
      firstHeavy: false,
      firstLight: false,
      lastPlaceAt: -10,
      lastPlaceBy: "",
      highSaid: false,
      dropSaid: false,
    };
    s.parts.left.push(makePart("left", 0));
    s.parts.left.push(makePart("left", 1));
    s.parts.right.push(makePart("right", 0));
    s.parts.right.push(makePart("right", 1));
    updateParts(s, 0);
    for (const l of INTRO_LINES) enqueue(s, l[0], l[1], l[2]);
    return s;
  }

  function enqueue(s, speaker, text, dur) {
    s.lineQueue.push({ speaker, text, dur: dur || 2.8 });
  }

  function say(s, speaker, text, dur) {
    if (s.phase === "reward") return;
    if (s.line || s.lineQueue.length) return;
    enqueue(s, speaker, text, dur || 2.7);
  }

  function updateLine(s, dt) {
    if (s.line) {
      s.lineT -= dt;
      if (s.lineT <= 0) s.line = null;
    }
    if (!s.line && s.lineQueue.length) {
      const next = s.lineQueue.shift();
      s.line = next;
      s.lineT = next.dur;
      VO.Sound.speak(next.text, next.speaker);
    }
  }

  function addParticles(s, x, y, color, count, speed, kind) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      s.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        life: 0.6 + Math.random() * 0.7,
        size: 2 + Math.random() * 4,
        color,
        kind: kind || "dot",
      });
    }
  }

  function updateParticles(s, dt) {
    for (const p of s.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 380 * dt;
      p.vx *= Math.pow(0.2, dt);
    }
    s.particles = s.particles.filter((p) => p.life > 0);
  }

  function showHint(s, text) {
    s.hint = text;
    s.hintT = 2.4;
  }

  function refreshStage(s) {
    const blocks = s.tower.blocks;
    s.heavyCount = blocks.filter((b) => b.kind === "heavy").length;
    s.hasRoof = blocks.some((b) => b.type === "roof");
    s.hasSpire = blocks.some((b) => b.type === "spire");
    s.hasFlag = blocks.some((b) => b.type === "flag");
    s.hasTop = s.hasSpire || s.hasFlag;
    if (!s.hasRoof) s.stage = s.heavyCount >= MIN_HEAVY ? "roof" : "base";
    else if (!s.hasSpire) s.stage = "spire";
    else if (!s.hasFlag) s.stage = "flag";
    else s.stage = "done";
  }

  function knockDecorations(s) {
    let removed = 0;
    while (s.tower.blocks.length) {
      const b = s.tower.blocks[s.tower.blocks.length - 1];
      if (b.kind !== "light") break;
      s.tower.blocks.pop();
      s.tower.top += b.h;
      s.falling.push({
        x: b.x + b.w / 2,
        y: b.y + b.h / 2,
        w: b.w,
        h: b.h,
        type: b.type,
        color: b.color,
        rot: 0,
        spin: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random()),
        vx: (Math.random() - 0.5) * 130,
        vy: -90 - Math.random() * 80,
        life: 2.4,
      });
      removed++;
    }
    if (removed > 0) {
      VO.Sound.push();
      addParticles(s, TOWER_X, s.tower.top, "#ffd8a8", 14, 130, "dot");
      showHint(s, "Тяжёлый блок сбросил украшение!");
    }
    refreshStage(s);
    return removed;
  }

  function rejectCarried(s, p, text) {
    if (!p.carry) return;
    addParticles(s, p.x, p.feetY - 24, p.carry.color, 8, 90, "dot");
    p.carry = null;
    VO.Sound.bump();
    showHint(s, text);
  }

  function tryPlacePart(s, p) {
    if (!p.carry) return;
    const part = p.carry;
    if (part.kind === "heavy") {
      knockDecorations(s);
      p.carry = null;
      addBlock(s, part, p.kind);
      return;
    }
    if (part.type === "roof") {
      if (s.heavyCount < MIN_HEAVY) {
        rejectCarried(s, p, `Сначала постройте башню из ${MIN_HEAVY} тяжёлых блоков!`);
        return;
      }
      if (s.hasRoof) {
        rejectCarried(s, p, "Крыша уже стоит. Теперь шпиль, потом флажок!");
        return;
      }
      p.carry = null;
      addBlock(s, part, p.kind);
      return;
    }
    if (!s.hasRoof) {
      rejectCarried(s, p, "Сначала поставьте крышу!");
      return;
    }
    if (part.type === "spire") {
      if (s.hasSpire) {
        rejectCarried(s, p, "Шпиль уже стоит. Теперь поставьте флажок!");
        return;
      }
      if (s.hasFlag) {
        rejectCarried(s, p, "Флажок уже стоит. Постройка завершается!");
        return;
      }
      p.carry = null;
      addBlock(s, part, p.kind);
      return;
    }
    if (part.type === "flag") {
      if (!s.hasSpire) {
        rejectCarried(s, p, "Сначала поставьте шпиль, потом флажок!");
        return;
      }
      if (s.hasFlag) {
        rejectCarried(s, p, "Флажок уже стоит.");
        return;
      }
      p.carry = null;
      addBlock(s, part, p.kind);
      return;
    }
    rejectCarried(s, p, "Эту деталь сюда не поставить.");
  }

  function collapseTower(s) {
    if (s.collapseT > 0) return;
    s.collapseT = 1.6;
    for (const b of s.tower.blocks) {
      s.falling.push({
        x: b.x + b.w / 2,
        y: b.y + b.h / 2,
        w: b.w,
        h: b.h,
        type: b.type,
        kind: b.kind,
        color: b.color,
        rot: 0,
        spin: (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2),
        vx: (Math.random() - 0.5) * 180,
        vy: -80 - Math.random() * 130,
        life: 2.2,
      });
    }
    s.tower.blocks = [];
    s.tower.top = GROUND;
    s.floors = 0;
    s.placed = 0;
    s.heavyCount = 0;
    s.hasRoof = false;
    s.hasSpire = false;
    s.hasFlag = false;
    s.hasTop = false;
    s.stage = "base";
    s.heightM = 0;
    s.highSaid = false;
    s.milestones.clear();
    s.camera = 0;
    VO.Sound.push();
    VO.Sound.land();
    enqueue(s, "mama", "Ой! Сорок этажей — башня не выдержала! Все сначала, ребята!", 3.4);
    enqueue(s, "ilya", "Ничего, сейчас построим ещё лучше!", 2);
  }

  const FLOOR_VOICE = {
    9: "Это высотный дом!",
    18: "Это супервысотка!",
    27: "Это башня-великан!",
    36: "Это небоскрёб!",
  };

  function addBlock(s, part, ownerKind) {
    const now = s.elapsed;
    const prevBy = s.lastPlaceBy;
    const prevAt = s.lastPlaceAt;
    const by = ownerKind || "ilya";
    const nextFloor = part.kind === "heavy" ? s.floors + 1 : null;
    const block = {
      kind: part.kind,
      type: part.type,
      color: part.color,
      w: part.w,
      h: part.h,
      x: TOWER_X - part.w / 2,
      y: s.tower.top - part.h,
      landT: 0,
      floor: nextFloor,
      windows: !!nextFloor && (nextFloor % 3 === 0 || nextFloor % 5 === 0),
    };
    s.tower.blocks.push(block);
    s.tower.top -= part.h;
    s.placed++;
    if (part.kind === "heavy") s.floors++;
    refreshStage(s);
    s.heightM = s.floors;
    const idx = s.tower.blocks.length;
    const semis = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88];
    const n = semis[Math.min(semis.length - 1, idx - 1)];
    VO.Sound.tone(noteFreq(n), 0.22, "triangle", 0.032);
    VO.Sound.tone(noteFreq(n + 12), 0.18, "sine", 0.012);
    VO.Sound.land();
    addParticles(s, TOWER_X, s.tower.top + part.h, part.color, 12, 110);
    s.lastPlaceAt = now;
    s.lastPlaceBy = by;
    if (part.kind === "heavy" && !s.firstHeavy) {
      s.firstHeavy = true;
      const who = by === "alisa" ? "Алисы" : "Илюши";
      say(s, "mama", `Первый пошёл! Какой прочный фундамент получается у ${who}!`, 3);
    } else if (part.kind === "light" && !s.firstLight) {
      s.firstLight = true;
      const who = by === "alisa" ? "Алиса" : "Илюша";
      say(s, "mama", `Ух ты, ${who} принёс красивое украшение! Башня становится сказочной!`, 3);
    } else if (prevBy && prevBy !== by && now - prevAt < 4) {
      say(s, "mama", "Вот это скорость! Настоящая семейная стройка!", 2.6);
    }
    if (part.kind === "heavy" && s.floors > 0 && s.floors % 9 === 0 && !s.milestones.has(s.floors)) {
      s.milestones.add(s.floors);
      const phrase = FLOOR_VOICE[s.floors] || `Уже ${s.floors} этажей!`;
      enqueue(s, "mama", phrase, 2.8);
    }
    if (part.kind === "heavy" && s.floors >= 40) {
      collapseTower(s);
      return;
    }
    if (s.stage === "done" && s.floors < 40) startClimax(s, "complete");
  }

  function dropCarried(s, p) {
    if (!p.carry) return;
    const part = p.carry;
    p.carry = null;
    addParticles(s, p.x, p.feetY - 20, part.color, 8, 90, "dot");
    VO.Sound.soapPop();
    if (!s.dropSaid) {
      s.dropSaid = true;
      say(s, "mama", "Ничего страшного, облачко поймало детальку. Попробуем ещё раз!", 3);
    }
  }

  function placeCarried(s, p) {
    if (!p.carry) return;
    if (!p.onGround && Math.abs(p.x - TOWER_X) < 100) {
      tryPlacePart(s, p);
    } else {
      dropCarried(s, p);
    }
  }

  function nearestPart(s, p) {
    const list = p.kind === "ilya" ? s.parts.left : s.parts.right;
    let best = null;
    let bestD = 72;
    for (const part of list) {
      const d = Math.abs(part.x - p.x);
      if (d < bestD) { bestD = d; best = part; }
    }
    return best;
  }

  function tryPick(s, p) {
    if (p.carry) return;
    if (!p.onGround) return;
    const part = nearestPart(s, p);
    if (!part) return;
    const list = p.kind === "ilya" ? s.parts.left : s.parts.right;
    const i = list.indexOf(part);
    if (i >= 0) list.splice(i, 1);
    p.carry = part;
    VO.Sound.pickup();
  }

  function updatePlayer(s, p, dt, input, jumpCode, actionCode) {
    if (s.phase === "hug" || s.phase === "reward") return;
    if (s.collapseT > 0) {
      p.vx = 0;
      return;
    }
    const left = p.kind === "ilya" ? "KeyA" : "ArrowLeft";
    const right = p.kind === "ilya" ? "KeyD" : "ArrowRight";
    const speed = 270;
    p.vx = 0;
    if (input.isDown(left)) p.vx -= speed;
    if (input.isDown(right)) p.vx += speed;
    if (p.vx !== 0) p.dir = p.vx > 0 ? 1 : -1;
    p.x = clamp(p.x + p.vx * dt, 72, 1208);
    p.animTime += dt;
    if (input.justPressed(jumpCode) && p.onGround) {
      p.vy = -640;
      p.onGround = false;
      VO.Sound.land();
    }
    p.vy += 1750 * dt;
    p.feetY += p.vy * dt;
    if (p.feetY >= GROUND) {
      p.feetY = GROUND;
      p.vy = 0;
      p.onGround = true;
    }
    if (input.justPressed(actionCode)) tryPick(s, p);
    if (s.prevAction[actionCode] && !input.isDown(actionCode)) placeCarried(s, p);
    s.prevAction[actionCode] = input.isDown(actionCode);
  }

  function updateParts(s, dt) {
    s.spawn.left -= dt;
    s.spawn.right -= dt;
    if (s.spawn.left <= 0 && s.parts.left.length < 3) {
      s.spawn.left = 1.8 + Math.random() * 0.7;
      s.parts.left.push(makePart("left", s.partIndex.left++));
    }
    if (s.spawn.right <= 0 && s.parts.right.length < 3) {
      s.spawn.right = 2.1 + Math.random() * 0.8;
      s.parts.right.push(makePart("right", s.partIndex.right++));
    }
    for (const side of ["left", "right"]) {
      for (let i = 0; i < s.parts[side].length; i++) {
        const part = s.parts[side][i];
        const baseX = side === "left" ? 170 : 1110;
        part.x = baseX + ((i * 47) % 96) - 48;
        part.bob = Math.sin(s.elapsed * 4 + i) * 2;
      }
    }
  }

  function startClimax(s, reason) {
    if (s.phase !== "playing") return;
    s.phase = "climax";
    s.climaxT = 0;
    s.time = 0;
    s.line = null;
    s.lineQueue = [];
    VO.Sound.stopSpeech();
    VO.Sound.celebrate();
    if (reason === "complete") {
      enqueue(s, "mama", "Ура! Башня построена по всем правилам: фундамент, крыша, шпиль и флажок на месте! Мишка, поднимайся к звёздочке!", 3.8);
      enqueue(s, "ilya", "Получилось! Мы строили вместе — и всё получилось!", 2.8);
      enqueue(s, "alisa", "Мишка уже карабкается! Скорее наверх, обниматься!", 2.6);
    } else if (reason === "height") {
      enqueue(s, "mama", "Ура-а-а! Какая высокая башня! Мишка, держись крепче!", 3.2);
      enqueue(s, "ilya", "Огого, я еле допрыгиваю до верхушки!", 2.6);
      enqueue(s, "alisa", "Мишка уже карабкается! Скорее наверх!", 2.4);
    } else {
      enqueue(s, "mama", "Ух ты, какая высокая башня! Мишка уже карабкается к звёздочке!", 3.2);
      enqueue(s, "ilya", "Огого, я еле допрыгиваю до верхушки!", 2.6);
      enqueue(s, "alisa", "Мишка уже карабкается! Скорее наверх!", 2.4);
    }
  }

  function beginHug(s) {
    s.phase = "hug";
    s.hugT = 0;
    s.camera = Math.max(0, 260 - s.tower.top);
    const p1 = s.players.ilya;
    const p2 = s.players.alisa;
    p1.x = TOWER_X - 42;
    p2.x = TOWER_X + 42;
    p1.feetY = s.tower.top;
    p2.feetY = s.tower.top;
    p1.onGround = true;
    p2.onGround = true;
    p1.vy = 0;
    p2.vy = 0;
    p1.hugPose = 1;
    p2.hugPose = 1;
    s.line = null;
    s.lineQueue = [];
    enqueue(s, "mama", "Ура-а-а! Вы сделали это! Мишка достал до звёздочки! Вы самая дружная и быстрая команда строителей на свете!", 4.2);
    enqueue(s, "bear", "Пип-пип! Спасибо, ребята!", 2.4);
    enqueue(s, "ilya", "Алиса, иди сюда скорее!", 2);
    enqueue(s, "alisa", "Бегу!", 1.8);
    enqueue(s, "ilya", "Время обнимашек!", 2.2);
    enqueue(s, "mama", "А теперь зажмите Пробел и Enter вместе — время обнимашек!", 3);
  }

  function startReward(s) {
    if (s.phase === "reward") return;
    s.phase = "reward";
    s.rewarded = true;
    s.hugged = true;
    s.line = null;
    s.lineQueue = [];
    VO.Sound.celebrate();
    VO.Sound.speak("Отличная работа! А теперь — засыпайте, сладких вам снов.", "mama");
    for (let i = 0; i < 8; i++) {
      addParticles(s, TOWER_X + (Math.random() - 0.5) * 300, 160 + Math.random() * 220, [ "#f7ca5c", "#ef8d8f", "#79c8ef", "#b7e58b" ][i % 4], 30, 220, i % 3 ? "confetti" : "star");
    }
  }

  function updateFalling(s, dt) {
    for (const f of s.falling) {
      f.life -= dt;
      f.vy += 620 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.spin * dt;
    }
    s.falling = s.falling.filter((f) => f.life > 0);
  }

  function update(s, dt, input) {
    if (!s) return;
    s.elapsed += dt;
    updateParticles(s, dt);
    updateFalling(s, dt);
    updateLine(s, dt);
    if (s.hintT > 0) s.hintT -= dt;
    if (s.phase === "intro") {
      if (!s.line && !s.lineQueue.length) {
        s.phase = "playing";
        s.time = TIME_LIMIT;
      }
      return;
    }
    if (s.phase === "playing") {
      s.time = Math.max(0, s.time - dt);
      if (s.collapseT > 0) s.collapseT = Math.max(0, s.collapseT - dt);
      updateParts(s, dt);
      updatePlayer(s, s.players.ilya, dt, input, "KeyW", "Space");
      updatePlayer(s, s.players.alisa, dt, input, "ArrowUp", "Enter");
      if (s.time <= 0) startClimax(s, "time");
      return;
    }
    if (s.phase === "climax") {
      s.climaxT += dt;
      const targetCam = Math.max(0, 260 - s.tower.top);
      s.camera += (targetCam - s.camera) * Math.min(1, dt * 1.5);
      s.bearClimb = clamp((s.climaxT - 0.8) / 4.2, 0, 1);
      s.bearX = TOWER_X;
      if (s.bearClimb >= 0.98 && !s.starTaken) {
        s.starTaken = true;
        addParticles(s, TOWER_X + 142, Math.min(150, s.tower.top - 60), "#ffe58a", 55, 230, "star");
      }
      if (s.climaxT > 6.2) beginHug(s);
      return;
    }
    if (s.phase === "hug") {
      s.hugT += dt;
      s.camera += (Math.max(0, 260 - s.tower.top) - s.camera) * Math.min(1, dt * 1.5);
      if (s.hugT > 0.5) {
        if (input.justPressed("Space")) s.hugPress.Space = s.hugT;
        if (input.justPressed("Enter")) s.hugPress.Enter = s.hugT;
        const both = Math.abs(s.hugPress.Space - s.hugPress.Enter) < 0.75 &&
          s.hugPress.Space > 0 && s.hugPress.Enter > 0;
        if (both) startReward(s);
      }
      return;
    }
  }

  function drawBrick(ctx, x, y, w, h, color, studs, windows) {
    ctx.save();
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, color);
    grad.addColorStop(1, shade(color, -18));
    ctx.fillStyle = grad;
    rr(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(54, 49, 77, 0.28)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = shade(color, 18);
    const n = studs || Math.max(2, Math.round(w / 38));
    const sw = Math.min(18, w / (n + 1));
    for (let i = 0; i < n; i++) {
      const sx = x + (w / (n + 1)) * (i + 1);
      ctx.beginPath();
      ctx.ellipse(sx, y + 5, sw * 0.36, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (windows) {
      const count = w > 120 ? 3 : 2;
      const winW = Math.min(17, (w - 20) / (count * 2));
      const winH = Math.min(12, h * 0.3);
      for (let i = 0; i < count; i++) {
        const wx = x + w * ((i + 1) / (count + 1)) - winW / 2;
        const wy = y + h * 0.46;
        ctx.fillStyle = "#fff1a8";
        rr(ctx, wx, wy, winW, winH, 2.5);
        ctx.fill();
        ctx.strokeStyle = "rgba(91, 72, 69, 0.55)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "rgba(111, 184, 220, 0.65)";
        rr(ctx, wx + 2, wy + 2, winW - 4, winH * 0.38, 1.5);
        ctx.fill();
      }
    }
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    rr(ctx, x + 5, y + 12, w - 10, 4, 2);
    ctx.fill();
    ctx.restore();
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt;
    let g = ((n >> 8) & 255) + amt;
    let b = (n & 255) + amt;
    r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  function drawRoof(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(80, 55, 78, 0.3)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.23)";
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h - 4);
    ctx.lineTo(x + w / 2, y + 7);
    ctx.lineTo(x + w / 2, y + h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSpire(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(80, 55, 78, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#ffe58a";
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFlag(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.strokeStyle = "#8a6a55";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + h);
    ctx.lineTo(x + 8, y + 4);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 7);
    ctx.lineTo(x + w, y + 19);
    ctx.lineTo(x + 10, y + 31);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(80, 55, 78, 0.25)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  function drawPart(ctx, part, x, y, scale) {
    const sc = scale || 1;
    if (part.kind === "heavy") {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      drawBrick(ctx, -part.w / 2, -part.h, part.w, part.h, part.color, 3);
      ctx.restore();
    } else if (part.type === "roof") {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      drawRoof(ctx, -part.w / 2, -part.h, part.w, part.h, part.color);
      ctx.restore();
    } else if (part.type === "spire") {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      drawSpire(ctx, -part.w / 2, -part.h, part.w, part.h, part.color);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      drawFlag(ctx, -part.w / 2, -part.h, part.w, part.h, part.color);
      ctx.restore();
    }
  }

  function drawTower(ctx, s, t) {
    const x = TOWER_X;
    // фундамент
    A.fillRR(ctx, x - 104, GROUND - 10, 208, 18, 6, "#bda98d");
    A.fillRR(ctx, x - 92, GROUND - 20, 184, 12, 5, "#d8c3a4");
    for (const b of s.tower.blocks) {
      if (b.kind === "heavy") drawBrick(ctx, b.x, b.y, b.w, b.h, b.color, 3, b.windows);
      else if (b.type === "roof") drawRoof(ctx, b.x, b.y, b.w, b.h, b.color);
      else if (b.type === "spire") drawSpire(ctx, b.x, b.y, b.w, b.h, b.color);
      else drawFlag(ctx, b.x, b.y, b.w, b.h, b.color);
      if (b.landT != null) b.landT += 0.016;
    }
    // облачко-цель и звёздочка
    const starX = TOWER_X + 142;
    const starY = Math.min(150, s.tower.top - 60);
    A.drawCloud(ctx, starX, starY + 38, 150, 52, "rgba(255,255,255,0.82)", { shine: false });
    if (!s.starTaken) {
      A.glow(ctx, starX, starY, 52, "rgba(255, 226, 133, 0.55)", 0.8);
      A.sparkle(ctx, starX, starY, 24, "#ffe38a", 1, Math.sin(t) * 0.1);
      A.sparkle(ctx, starX, starY, 11, "#fff8d4", 1, -Math.sin(t) * 0.2);
    } else {
      A.sparkle(ctx, starX, starY, 10, "#ffe38a", 0.25, t);
    }
  }

  function drawPlayer(ctx, s, p, t) {
    const drawP = {
      kind: p.kind,
      x: p.x - p.w / 2,
      y: p.feetY - p.h,
      w: p.w,
      h: p.h,
      dir: p.dir,
      onGround: p.onGround,
      vx: p.vx,
      animTime: p.animTime,
      hugPose: p.hugPose,
    };
    A.drawCharacter(ctx, drawP, t);
    if (p.carry) {
      const carryY = p.feetY - p.h - 14;
      drawPart(ctx, p.carry, p.x, carryY, 0.72);
    }
  }

  function drawConveyor(ctx, side, s, t) {
    const x = side === "left" ? 58 : 1022;
    const w = 200;
    const label = "БЛОКИ · КРЫШИ · ШПИЛИ";
    const color = side === "left" ? "rgba(91, 142, 214, 0.16)" : "rgba(239, 141, 143, 0.16)";
    A.fillRR(ctx, x - 30, GROUND - 54, w + 60, 62, 18, "rgba(88, 76, 79, 0.18)");
    A.fillRR(ctx, x - 26, GROUND - 66, w + 52, 16, 8, "#b9a58c");
    A.fillRR(ctx, x - 12, GROUND - 58, w + 24, 10, 5, "#d8c7ab");
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = "rgba(103, 88, 84, 0.34)";
      ctx.lineWidth = 2;
      const tx = x + 15 + i * 54 + (t * 24) % 54;
      ctx.beginPath();
      ctx.moveTo(tx, GROUND - 58);
      ctx.lineTo(tx + 18, GROUND - 48);
      ctx.stroke();
    }
    ctx.fillStyle = side === "left" ? "rgba(55, 90, 150, 0.8)" : "rgba(150, 74, 87, 0.8)";
    ctx.font = '700 10px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, GROUND - 78);
    ctx.fillStyle = color;
    rr(ctx, x - 22, GROUND - 50, w + 44, 38, 12);
    ctx.fill();
    for (const part of s.parts[side]) {
      drawPart(ctx, part, part.x, GROUND - 2 + (part.bob || 0), 1);
    }
    // подсказка-стрелка
    ctx.fillStyle = "rgba(70, 60, 72, 0.36)";
    ctx.font = '700 10px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillText(side === "left" ? "Илюша: Пробел" : "Алиса: Enter", x + w / 2, GROUND + 18);
  }

  function drawBear(ctx, s, t) {
    let x = s.phase === "intro" ? TOWER_X : s.bearX;
    let y = GROUND;
    if (s.phase === "climax" || s.phase === "hug" || s.phase === "reward") {
      x = TOWER_X - 8;
      y = GROUND + (s.tower.top - GROUND) * s.bearClimb;
      if (s.phase === "hug" || s.phase === "reward") y = s.tower.top;
    }
    const scale = 0.34;
    const sad = s.phase === "intro";
    ctx.save();
    A.drawToyBear(ctx, x, y, scale, t);
    if (sad) {
      ctx.fillStyle = "rgba(92, 76, 91, 0.52)";
      ctx.font = '700 11px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("...", x, y - 42);
    }
    ctx.restore();
  }

  function drawDialogueHint(ctx, s) {
    if (s.phase === "playing") {
      for (const p of [s.players.ilya, s.players.alisa]) {
        if (p.carry && Math.abs(p.x - TOWER_X) < 130) {
          ctx.fillStyle = "rgba(28, 26, 48, 0.68)";
          rr(ctx, p.x - 86, p.feetY - p.h - 72, 172, 26, 10);
          ctx.fill();
          ctx.fillStyle = "#fff2c9";
          ctx.font = '700 11px "Comic Sans MS", "Segoe UI", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText("Прыгай и отпусти кнопку!", p.x, p.feetY - p.h - 55);
        }
      }
    }
    if (s.phase === "hug") {
      ctx.fillStyle = "rgba(28, 26, 48, 0.62)";
      rr(ctx, 380, 286, 520, 54, 18);
      ctx.fill();
      ctx.fillStyle = "#fff2c9";
      ctx.font = '700 16px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Пробел + Enter — время обнимашек!", 640, 319);
    }
  }

  function drawFalling(ctx, s) {
    for (const f of s.falling) {
      ctx.save();
      ctx.globalAlpha = clamp(f.life / 0.9, 0, 1);
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      drawPart(ctx, f, 0, 0, 1);
      ctx.restore();
    }
  }

  function draw(ctx, s, t) {
    if (!s) return;
    // Небо.
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, "#8dd8f7");
    sky.addColorStop(0.55, "#c3e7f5");
    sky.addColorStop(1, "#ffe6b7");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    A.glow(ctx, 1060, 100, 110, "rgba(255, 238, 155, 0.48)", 0.8);
    ctx.fillStyle = "#ffe58c";
    ctx.beginPath();
    ctx.arc(1060, 100, 44, 0, Math.PI * 2);
    ctx.fill();
    A.drawCloud(ctx, 180, 100, 220, 74, "rgba(255,255,255,0.55)", { shine: false });
    A.drawCloud(ctx, 780, 62, 190, 62, "rgba(255,255,255,0.45)", { shine: false });
    A.drawCloud(ctx, 1030, 270, 150, 44, "rgba(255,255,255,0.32)", { shine: false });
    ctx.fillStyle = "rgba(74, 65, 91, 0.48)";
    ctx.font = '700 11px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    const stageText =
      s.stage === "base" ? `Фундамент: ${s.heavyCount}/${MIN_HEAVY} блоков`
        : s.stage === "roof" ? "Теперь поставьте крышу"
          : s.stage === "spire" ? "Теперь поставьте шпиль"
            : s.stage === "flag" ? "Теперь поставьте флажок"
              : "Башня готова!";
    ctx.fillText(`${stageText} · возьми деталь, прыгни у башни и отпусти кнопку`, 640, 82);
    if (s.hintT > 0 && s.hint) {
      ctx.globalAlpha = Math.min(1, s.hintT);
      const hw = Math.max(280, s.hint.length * 7 + 36);
      ctx.fillStyle = "rgba(34, 29, 55, 0.74)";
      rr(ctx, 640 - hw / 2, 100, hw, 30, 12);
      ctx.fill();
      ctx.fillStyle = "#ffe7a8";
      ctx.font = '700 11px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.fillText(s.hint, 640, 119);
      ctx.globalAlpha = 1;
    }

    // Далёкий город.
    ctx.fillStyle = "rgba(107, 147, 166, 0.3)";
    for (let i = 0; i < 12; i++) {
      const bx = 50 + i * 105;
      const bh = 45 + (i % 4) * 22;
      ctx.fillRect(bx, GROUND - 130 - bh, 62, bh);
      ctx.fillRect(bx + 12, GROUND - 130 - bh - 16, 38, 16);
    }

    ctx.save();
    ctx.translate(0, s.camera);

    // Земля и стройплощадка.
    ctx.fillStyle = "#8bbf78";
    ctx.fillRect(-20, GROUND - 6, W + 40, 24);
    ctx.fillStyle = "#705443";
    ctx.fillRect(-20, GROUND + 16, W + 40, H - GROUND);
    ctx.fillStyle = "rgba(255, 225, 167, 0.2)";
    for (let i = 0; i < 15; i++) ctx.fillRect(30 + i * 88, GROUND + 38 + (i % 3) * 18, 34, 4);

    // Забор.
    for (let i = 0; i < 13; i++) {
      const fx = 20 + i * 100;
      A.fillRR(ctx, fx, GROUND - 92, 7, 86, 3, "#bda58e");
      ctx.fillStyle = i % 2 ? "#f1d27f" : "#eeb1a1";
      ctx.fillRect(fx + 7, GROUND - 84, 84, 36);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(fx + 7, GROUND - 84, 84, 6);
    }
    ctx.fillStyle = "#6e5a53";
    ctx.font = '700 12px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("ВЕСЁЛАЯ СТРОЙКА", 640, GROUND + 42);

    drawTower(ctx, s, t);
    drawFalling(ctx, s);
    drawConveyor(ctx, "left", s, t);
    drawConveyor(ctx, "right", s, t);
    drawBear(ctx, s, t);
    drawPlayer(ctx, s, s.players.ilya, t);
    drawPlayer(ctx, s, s.players.alisa, t);
    drawDialogueHint(ctx, s);

    // Частицы.
    for (const p of s.particles) {
      ctx.globalAlpha = clamp(p.life / 0.7, 0, 1);
      if (p.kind === "star") A.sparkle(ctx, p.x, p.y, p.size * 1.5, p.color, 1, p.life * 8);
      else if (p.kind === "confetti") {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size * 1.6);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  const Tower = { create, update, draw, GROUND, TOWER_X, TIME_LIMIT };
  VO.Tower = Tower;
})();
