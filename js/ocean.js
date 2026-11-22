(function () {
  "use strict";

  const W = 1280;
  const H = 720;
  const GROUND = 618;
  const TOTAL_FISH = 12;
  const A = VO.Art;

  const FISH_COLORS = [
    "#ffcf5c", "#ff8f8f", "#7fe0c1", "#b99af0",
    "#ffad66", "#8fd4ff", "#f28fbd", "#a8e06f",
    "#ffdb70", "#ffa6b8", "#77d9d0", "#c9a4ff",
  ];

  // Восемь круглых рыбок и четыре новых силуэта: карасик, щука,
  // рыбка-ангел и рыбка-меч.
  const FISH_SHAPES = [
    "round", "round", "round", "round", "round", "round", "round", "round",
    "crucian", "pike", "angel", "sword",
  ];

  const INTRO_LINES = [
    ["mama", "Ой, посмотрите, какая озорная Каракатица! Она испачкала весь океан чернилами. Илюша, Алиса, заряжайте свои водяные пушки! Давайте поможем рыбкам снова стать цветными!", 5.2],
    ["alisa", "Ой, сколько летит чёрных клякс! Буль-буль! Лови мою розовую торпеду! Пли!", 3.2],
    ["ilya", "Ого, Алиса, смотри, какая большая Клякса слева! Сейчас я её поймаю. Бум!", 3.2],
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
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  function makePlayer(kind, x) {
    const h = kind === "ilya" ? 92 : 102;
    return {
      kind,
      x,
      feetY: GROUND - 20,
      w: kind === "ilya" ? 50 : 54,
      h,
      vy: 0,
      vx: 0,
      dir: kind === "ilya" ? 1 : -1,
      aim: kind === "ilya" ? "right" : "left",
      onGround: true,
      animTime: 0,
      cooldown: 0,
    };
  }

  function createFish(index) {
    const dir = index % 2 ? 1 : -1;
    const shape = FISH_SHAPES[index % FISH_SHAPES.length];
    const longFish = shape === "pike" || shape === "sword";
    return {
      id: index,
      shape,
      color: FISH_COLORS[index % FISH_COLORS.length],
      x: 140 + ((index * 197) % 1000),
      y: 235 + (index % 5) * 58 + (index % 2 ? 16 : 0),
      r: longFish ? 20 : 24,
      dir,
      speed: 32 + Math.random() * 26,
      rescued: false,
      saved: false,
      wiggle: 0,
      bob: Math.random() * Math.PI * 2,
    };
  }

  function create() {
    const s = {
      phase: "intro",
      elapsed: 0,
      rescued: 0,
      total: TOTAL_FISH,
      hearts: 0,
      combo: 0,
      comboT: 0,
      players: {
        ilya: makePlayer("ilya", 360),
        alisa: makePlayer("alisa", 900),
      },
      blobs: [],
      balls: [],
      fish: [],
      splashes: [],
      particles: [],
      bubbles: [],
      line: null,
      lineT: 0,
      lineQueue: [],
      spawnT: 1.2,
      megaT: 0,
      finaleT: 0,
      hugPress: { Space: -10, Enter: -10 },
      rewardShown: false,
      firstPop: false,
      firstFish: false,
      megaSaid: false,
    };
    for (let i = 0; i < TOTAL_FISH; i++) s.fish.push(createFish(i));
    for (let i = 0; i < 4; i++) spawnBlob(s, true);
    for (let i = 0; i < 20; i++) {
      s.bubbles.push({ x: Math.random() * W, y: Math.random() * H, r: 2 + Math.random() * 7, speed: 10 + Math.random() * 24, phase: Math.random() * 6 });
    }
    for (const l of INTRO_LINES) enqueue(s, l[0], l[1], l[2]);
    return s;
  }

  function enqueue(s, speaker, text, dur) {
    s.lineQueue.push({ speaker, text, dur: dur || 3 });
  }

  function say(s, speaker, text, dur) {
    if (s.phase === "reward") return;
    if (s.line || s.lineQueue.length) return;
    enqueue(s, speaker, text, dur || 2.8);
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

  function spawnBlob(s, initial) {
    if (s.blobs.length >= 7) return;
    const r = 28 + Math.random() * 25;
    s.blobs.push({
      x: 100 + Math.random() * (W - 200),
      y: initial ? 110 + Math.random() * 280 : -r - Math.random() * 90,
      r,
      vy: 24 + Math.random() * 24,
      seed: Math.random() * 9,
      lastHit: null,
      dead: false,
    });
  }

  function addParticles(s, x, y, color, count, speed, kind) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      s.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 30,
        life: 0.55 + Math.random() * 0.65,
        size: 2 + Math.random() * 4,
        color,
        kind: kind || "dot",
      });
    }
  }

  function rescueFish(s, x, y, radius) {
    for (const f of s.fish) {
      if (f.rescued) continue;
      if (dist(x, y, f.x, f.y) < radius + f.r) {
        f.rescued = true;
        f.wiggle = 1;
        f.speed = Math.max(48, f.speed * 1.15);
        s.rescued++;
        s.hearts++;
        s.combo = 0;
        addParticles(s, f.x, f.y, f.color, 22, 150, "star");
        addParticles(s, f.x, f.y, "#ffe7a0", 10, 120, "heart");
        VO.Sound.fishRescue(s.rescued - 1);
        VO.Sound.fishChime();
        if (!s.firstFish) {
          s.firstFish = true;
          say(s, "ilya", "Ого, Алиса, смотри, рыбка под нашим взрывом стала ярко-цветной! Она снова улыбается!", 3.2);
        }
        if (s.rescued >= s.total) startFinale(s);
      }
    }
  }

  function explodeBlob(s, blob, owner, silent) {
    if (blob.dead) return;
    blob.dead = true;
    s.combo++;
    s.comboT = 1.25;
    const color = owner === "alisa" ? "#ff9fc4" : "#7fc9ff";
    s.splashes.push({ x: blob.x, y: blob.y, t: 0, max: 0.7, r: 0, maxR: 125, color });
    addParticles(s, blob.x, blob.y, color, 28, 210, "dot");
    addParticles(s, blob.x, blob.y, "#ffe7a0", 10, 180, "heart");
    rescueFish(s, blob.x, blob.y, 145);
    VO.Sound.inkPop(s.combo - 1);
    if (!s.firstPop) {
      s.firstPop = true;
      if (owner === "alisa") {
        say(s, "alisa", "Буль-буль! Моя розовая торпеда попала! Смотри, как красиво брызнуло!", 3);
      } else {
        say(s, "ilya", "Плюх! Вот это водичка! Клякса лопнула, как большой мыльный пузырь!", 3);
      }
    }
    if (!silent && s.combo >= 3) {
      say(s, "mama", "Вот это скорость! Кляксы лопаются одна за другой, как музыкальные нотки!", 2.8);
    }
  }

  function megaCombo(s, firstBlob, owner) {
    s.megaT = 1.8;
    const touched = s.blobs.filter((b) => !b.dead);
    for (const b of touched) {
      b.dead = true;
      s.splashes.push({ x: b.x, y: b.y, t: 0, max: 0.9, r: 0, maxR: 180, color: "#ffd76e" });
      addParticles(s, b.x, b.y, "#ffd76e", 18, 220, "star");
      addParticles(s, b.x, b.y, "#b7e6ff", 18, 220, "dot");
      rescueFish(s, b.x, b.y, 200);
    }
    s.blobs = [];
    s.combo += touched.length;
    s.comboT = 1.6;
    VO.Sound.megaBubble();
    VO.Sound.celebrate();
    if (!s.megaSaid) {
      s.megaSaid = true;
      say(s, "mama", "Вот это бабах! Настоящий радужный взрыв под водой! Вы отмыли сразу весь океан!", 3.6);
      say(s, "alisa", "Ура-а-а! Какая большая радуга получилась!", 2.6);
      say(s, "ilya", "Алиса, давай ещё раз вместе! Целимся в самую верхнюю... Три, два, один, огонь!", 3.2);
    }
    if (s.rescued >= s.total) startFinale(s);
  }

  function startFinale(s) {
    if (s.phase === "finale" || s.phase === "reward") return;
    s.phase = "finale";
    s.finaleT = 0;
    s.blobs = [];
    s.balls = [];
    s.line = null;
    s.lineQueue = [];
    VO.Sound.celebrate();
    enqueue(s, "mama", "Чудесно! Океан снова чистый и сияет всеми цветами радуги, а рыбки говорят вам спасибо. Плывите к берегу, пришло время обняться!", 4.2);
    enqueue(s, "alisa", "Ура! Все рыбки снова цветные!", 2.2);
    enqueue(s, "ilya", "Алиса, плыви сюда, я тебя поймаю!", 2.2);
  }

  function shoot(s, p, owner, t) {
    if (p.cooldown > 0) return;
    p.cooldown = owner === "alisa" ? 0.24 : 0.34;
    const sign = p.aim === "left" ? -1 : 1;
    const color = owner === "alisa" ? "#ff9fc4" : "#77c8ff";
    const nx = p.x + sign * 8;
    const ny = p.feetY - p.h * 0.62;
    s.balls.push({
      x: nx,
      y: ny,
      vx: sign * 250,
      vy: -650,
      r: owner === "alisa" ? 9 : 12,
      owner,
      color,
      life: 1.8,
      trail: [],
    });
    addParticles(s, nx, ny, color, 8, 100, "dot");
    VO.Sound.waterShot(owner);
  }

  function updatePlayers(s, dt, input) {
    for (const kind of ["ilya", "alisa"]) {
      const p = s.players[kind];
      const left = kind === "ilya" ? "KeyA" : "ArrowLeft";
      const right = kind === "ilya" ? "KeyD" : "ArrowRight";
      const aimLeft = kind === "ilya" ? "KeyW" : "ArrowUp";
      const aimRight = kind === "ilya" ? "KeyS" : "ArrowDown";
      const shot = kind === "ilya" ? "Space" : "Enter";
      const speed = 300;
      p.vx = 0;
      if (input.isDown(left)) p.vx -= speed;
      if (input.isDown(right)) p.vx += speed;
      p.x = clamp(p.x + p.vx * dt, 90, W - 90);
      if (p.vx !== 0) p.dir = p.vx > 0 ? 1 : -1;
      p.animTime += dt;
      if (input.isDown(aimLeft)) p.aim = "left";
      if (input.isDown(aimRight)) p.aim = "right";
      p.cooldown = Math.max(0, p.cooldown - dt);
      p.feetY = GROUND - 20 + Math.sin(s.elapsed * 1.6 + (kind === "ilya" ? 0 : 2)) * 3;
      if (input.justPressed(shot)) {
        if (s.phase === "finale" || s.phase === "reward") {
          // В финале кнопки используются только для объятий.
        } else {
          shoot(s, p, kind, s.elapsed);
        }
      }
    }
  }

  function updateFish(s, dt) {
    for (const f of s.fish) {
      f.x += f.dir * f.speed * dt;
      f.y += Math.sin(s.elapsed * 1.2 + f.bob) * 5 * dt;
      f.wiggle = Math.max(0, f.wiggle - dt);
      // Рыбки остаются в океане даже после раскраски: у края они
      // разворачиваются и снова плавают по рабочему полю.
      if (f.x < 70) {
        f.x = 70;
        f.dir = 1;
      } else if (f.x > W - 70) {
        f.x = W - 70;
        f.dir = -1;
      }
      f.y = clamp(f.y, 220, 530);
    }
  }

  function updateBlobs(s, dt) {
    s.spawnT -= dt;
    if (s.spawnT <= 0) {
      s.spawnT = 1.4 + Math.random() * 1.3;
      spawnBlob(s, false);
    }
    for (const b of s.blobs) {
      if (b.dead) continue;
      b.y += b.vy * dt;
      b.x += Math.sin(s.elapsed * 0.8 + b.seed) * 12 * dt;
      if (b.y > GROUND - 45) {
        b.y = -b.r;
        b.x = 100 + Math.random() * (W - 200);
      }
    }
    s.blobs = s.blobs.filter((b) => !b.dead);
  }

  function updateBalls(s, dt) {
    for (const ball of s.balls) {
      ball.life -= dt;
      ball.trail.push({ x: ball.x, y: ball.y, life: 0.3 });
      for (const tr of ball.trail) tr.life -= dt;
      while (ball.trail.length && ball.trail[0].life <= 0) ball.trail.shift();
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.life <= 0 || ball.y < -50 || ball.x < -40 || ball.x > W + 40) {
        ball.dead = true;
        continue;
      }
      for (const blob of s.blobs) {
        if (blob.dead) continue;
        if (dist(ball.x, ball.y, blob.x, blob.y) < ball.r + blob.r) {
          const otherBall = s.balls.find((b) =>
            b !== ball && !b.dead && b.owner !== ball.owner &&
            dist(b.x, b.y, blob.x, blob.y) < blob.r + 58
          );
          const recent = blob.lastHit && blob.lastHit.owner !== ball.owner &&
            s.elapsed - blob.lastHit.t < 0.42;
          if (otherBall || recent) {
            megaCombo(s, blob, ball.owner);
          } else {
            blob.lastHit = { owner: ball.owner, t: s.elapsed };
            explodeBlob(s, blob, ball.owner, false);
          }
          ball.dead = true;
          break;
        }
      }
    }
    s.balls = s.balls.filter((b) => !b.dead);
  }

  function updateParticles(s, dt) {
    for (const p of s.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 140 * dt;
    }
    s.particles = s.particles.filter((p) => p.life > 0);
    for (const sp of s.splashes) {
      sp.t += dt;
      sp.r = sp.maxR * (sp.t / sp.max);
    }
    s.splashes = s.splashes.filter((sp) => sp.t < sp.max);
    for (const b of s.bubbles) {
      b.y -= b.speed * dt;
      b.x += Math.sin(s.elapsed + b.phase) * 8 * dt;
      if (b.y < -20) { b.y = H + 20; b.x = Math.random() * W; }
    }
  }

  function update(s, dt, input) {
    if (!s) return;
    s.elapsed += dt;
    updateLine(s, dt);
    updateParticles(s, dt);
    if (s.phase === "intro") {
      updateFish(s, dt);
      updateBlobs(s, dt);
      if (!s.line && !s.lineQueue.length) s.phase = "playing";
      return;
    }
    if (s.phase === "playing") {
      updatePlayers(s, dt, input);
      updateFish(s, dt);
      updateBlobs(s, dt);
      updateBalls(s, dt);
      if (s.comboT > 0) {
        s.comboT -= dt;
        if (s.comboT <= 0) s.combo = 0;
      }
      if (s.megaT > 0) s.megaT -= dt;
      return;
    }
    if (s.phase === "finale") {
      s.finaleT += dt;
      updateFish(s, dt);
      const p1 = s.players.ilya;
      const p2 = s.players.alisa;
      p1.x += (W / 2 - 48 - p1.x) * Math.min(1, dt * 2);
      p2.x += (W / 2 + 48 - p2.x) * Math.min(1, dt * 2);
      if (s.finaleT > 0.7) {
        if (input.justPressed("Space")) s.hugPress.Space = s.finaleT;
        if (input.justPressed("Enter")) s.hugPress.Enter = s.finaleT;
        const both = Math.abs(s.hugPress.Space - s.hugPress.Enter) < 0.8 &&
          s.hugPress.Space > 0 && s.hugPress.Enter > 0;
        if (both) {
          s.phase = "reward";
          s.rewardShown = true;
          VO.Sound.celebrate();
          VO.Sound.megaBubble();
          addParticles(s, W / 2, 250, "#ffd76e", 80, 280, "star");
          addParticles(s, W / 2, 250, "#ff9fc4", 50, 230, "heart");
        }
      }
      return;
    }
  }

  function drawBackground(ctx, s) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#062b4e");
    g.addColorStop(0.5, "#0d5f83");
    g.addColorStop(1, "#139eb0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Лучи.
    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 5; i++) {
      const x = 120 + i * 260 + Math.sin(s.elapsed * 0.2 + i) * 22;
      const lg = ctx.createLinearGradient(x, 0, x + 110, H);
      lg.addColorStop(0, "rgba(255, 248, 183, 0.9)");
      lg.addColorStop(1, "rgba(255, 248, 183, 0)");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 80, 0);
      ctx.lineTo(x + 220, H);
      ctx.lineTo(x + 90, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Пузырьки.
    for (const b of s.bubbles) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "rgba(213, 249, 255, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Дно.
    const sand = ctx.createLinearGradient(0, GROUND - 20, 0, H);
    sand.addColorStop(0, "#e0c48f");
    sand.addColorStop(1, "#b6976c");
    ctx.fillStyle = sand;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 20);
    for (let i = 0; i <= 10; i++) {
      ctx.quadraticCurveTo(i * 128 + 64, GROUND + 4 + Math.sin(i * 1.7) * 8, (i + 1) * 128, GROUND + 18);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Кораллы и водоросли.
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 148;
      const sway = Math.sin(s.elapsed * 1.3 + i) * 5;
      ctx.strokeStyle = i % 2 ? "#ee8eb1" : "#79d7bb";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, GROUND + 18);
      ctx.quadraticCurveTo(x + sway, GROUND - 40, x + 8 + sway, GROUND - 100 - (i % 3) * 24);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + sway * 0.5, GROUND - 56);
      ctx.quadraticCurveTo(x - 22, GROUND - 80, x - 28, GROUND - 112);
      ctx.moveTo(x + 4, GROUND - 74);
      ctx.quadraticCurveTo(x + 30, GROUND - 96, x + 34, GROUND - 126);
      ctx.stroke();
    }
    // Ракушки.
    for (let i = 0; i < 5; i++) {
      const x = 160 + i * 240;
      A.glow(ctx, x, GROUND + 10, 22, "rgba(255, 236, 181, 0.18)", 0.4);
      ctx.fillStyle = "#f5d7c7";
      ctx.beginPath();
      ctx.arc(x, GROUND + 20, 16, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }

  function fishEye(ctx, x, y, size) {
    ctx.fillStyle = "#fffdf2";
    ctx.beginPath();
    ctx.arc(x, y, size * 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#42505c";
    ctx.beginPath();
    ctx.arc(x + 1, y, size * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function fishSmile(ctx, x, y, w) {
    ctx.strokeStyle = "rgba(66,80,92,0.75)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, w, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  function drawFish(ctx, f, t) {
    const col = f.rescued ? f.color : "#9ca9b4";
    const fin = f.rescued ? "#fff1b3" : "#8a98a4";
    const shape = f.shape || "round";
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.dir >= 0 ? 1 : -1, 1);
    const wag = Math.sin(t * 7 + f.bob) * 0.18 + (f.wiggle > 0 ? Math.sin(t * 18) * 0.3 : 0);
    ctx.rotate(wag * 0.16);
    A.glow(ctx, 0, 0, f.rescued ? 52 : 30, f.rescued ? f.color : "rgba(180,200,220,0.2)", f.rescued ? 0.5 : 0.2);

    if (shape === "crucian") {
      // Карасик: высокое круглое тело и большой веерный хвост.
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(-42, -27 - wag * 14, -34, 0);
      ctx.quadraticCurveTo(-42, 27 + wag * 14, -16, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, 23, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.rescued ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.ellipse(5, 3, 14, 11, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fin;
      ctx.beginPath();
      ctx.moveTo(-5, -17);
      ctx.quadraticCurveTo(2, -35, 15, -15);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2, 14);
      ctx.quadraticCurveTo(7, 28, 15, 12);
      ctx.closePath();
      ctx.fill();
      fishEye(ctx, 13, -6, 1);
      fishSmile(ctx, 11, 7, 4.2);
    } else if (shape === "pike") {
      // Щука: длинное тело, вытянутая мордочка и полоски.
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-25, 0);
      ctx.lineTo(-44, -17 - wag * 12);
      ctx.lineTo(-38, 0);
      ctx.lineTo(-44, 17 + wag * 12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-2, 0, 31, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(24, -7);
      ctx.lineTo(46, -2);
      ctx.lineTo(25, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = fin;
      ctx.beginPath();
      ctx.moveTo(-8, -9);
      ctx.quadraticCurveTo(3, -26, 17, -8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(1, 8);
      ctx.quadraticCurveTo(10, 21, 18, 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = f.rescued ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-12 + i * 9, -7);
        ctx.lineTo(-8 + i * 9, 7);
        ctx.stroke();
      }
      fishEye(ctx, 20, -3, 0.9);
      fishSmile(ctx, 29, 3, 3.8);
    } else if (shape === "angel") {
      // Рыбка-ангел: высокие плавники и изящное тело.
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-30, -20 - wag * 8);
      ctx.lineTo(-27, 0);
      ctx.lineTo(-31, 18 + wag * 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fin;
      ctx.beginPath();
      ctx.moveTo(-6, -17);
      ctx.quadraticCurveTo(-2, -44, 13, -16);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-5, 15);
      ctx.quadraticCurveTo(-7, 41, 12, 15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = f.rescued ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(8, -12);
      ctx.stroke();
      fishEye(ctx, 10, -5, 0.92);
      fishSmile(ctx, 8, 7, 3.8);
    } else if (shape === "sword") {
      // Рыбка-меч: стремительное тело и длинный носик.
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.quadraticCurveTo(-38, -18 - wag * 10, -39, 0);
      ctx.quadraticCurveTo(-38, 18 + wag * 10, -22, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(24, -5);
      ctx.lineTo(54, 0);
      ctx.lineTo(24, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = fin;
      ctx.beginPath();
      ctx.moveTo(-4, -11);
      ctx.quadraticCurveTo(5, -32, 20, -9);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, 9);
      ctx.quadraticCurveTo(12, 24, 20, 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = f.rescued ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(12, -6);
      ctx.stroke();
      fishEye(ctx, 16, -4, 0.9);
      fishSmile(ctx, 24, 3, 3.8);
    } else {
      // Круглая рыбка — прежний силуэт.
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-38, -16 - wag * 16);
      ctx.lineTo(-34, 14 + wag * 12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.rescued ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.ellipse(4, -2, 14, 8, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fin;
      ctx.beginPath();
      ctx.moveTo(-2, -12);
      ctx.quadraticCurveTo(10, -27, 18, -12);
      ctx.closePath();
      ctx.fill();
      fishEye(ctx, 14, -4, 1);
      fishSmile(ctx, 11, 5, 4);
    }

    if (f.rescued) {
      A.sparkle(ctx, 28, -20, 3, "#fff4bd", 0.7, t + f.id);
    }
    ctx.restore();
  }

  function drawBlob(ctx, b, t) {
    if (b.dead) return;
    const wob = Math.sin(t * 1.8 + b.seed) * 3;
    ctx.save();
    ctx.translate(b.x, b.y);
    A.glow(ctx, 0, 0, b.r * 2, "rgba(73, 53, 104, 0.32)", 0.5);
    ctx.fillStyle = "#342b4d";
    ctx.beginPath();
    ctx.ellipse(0, 0, b.r * 1.05, b.r * 0.9 + wob, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#453861";
    ctx.beginPath();
    ctx.ellipse(-b.r * 0.3, -b.r * 0.2, b.r * 0.5, b.r * 0.42, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Капли.
    ctx.fillStyle = "#342b4d";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-b.r * 0.55 + i * b.r * 0.55, b.r * 0.8, 4 + i, 7 + i, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Глаза.
    ctx.fillStyle = "#fff8de";
    ctx.beginPath();
    ctx.arc(-b.r * 0.28, -b.r * 0.08, 5, 0, Math.PI * 2);
    ctx.arc(b.r * 0.28, -b.r * 0.08, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#403654";
    ctx.beginPath();
    ctx.arc(-b.r * 0.25, -b.r * 0.06, 2.4, 0, Math.PI * 2);
    ctx.arc(b.r * 0.31, -b.r * 0.06, 2.4, 0, Math.PI * 2);
    ctx.fill();
    // Ротик.
    ctx.strokeStyle = "#8c7ca0";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, b.r * 0.2, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer(ctx, p, t) {
    const drawP = {
      kind: p.kind,
      x: p.x - p.w / 2,
      y: p.feetY - p.h,
      w: p.w,
      h: p.h,
      dir: p.dir,
      onGround: true,
      vx: p.vx,
      animTime: p.animTime,
      hugPose: 0,
    };
    // Маска для плавания.
    A.drawCharacter(ctx, drawP, t);
    const mx = p.x;
    const my = p.feetY - p.h * 0.72;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "rgba(175, 241, 255, 0.85)";
    ctx.fillStyle = "rgba(123, 218, 241, 0.25)";
    ctx.lineWidth = 2;
    rr(ctx, mx - 18, my - 9, 36, 17, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx - 18, my);
    ctx.lineTo(mx - 28, my - 3);
    ctx.stroke();
    ctx.restore();
    // Пушка.
    const sign = p.aim === "left" ? -1 : 1;
    const nx = mx + sign * 13;
    const ny = p.feetY - p.h * 0.58;
    ctx.save();
    ctx.strokeStyle = "#d7f7ff";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(mx + sign * 4, ny);
    ctx.lineTo(nx + sign * 18, ny - 19);
    ctx.stroke();
    ctx.fillStyle = p.kind === "ilya" ? "#6dc6ff" : "#ff9fc4";
    ctx.beginPath();
    ctx.arc(nx + sign * 22, ny - 23, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(221, 249, 255, 0.42)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.moveTo(nx + sign * 30, ny - 30);
    ctx.lineTo(nx + sign * 80, ny - 110);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawBalls(ctx, s) {
    for (const b of s.balls) {
      for (let i = 0; i < b.trail.length; i++) {
        const tr = b.trail[i];
        ctx.globalAlpha = Math.max(0, tr.life / 0.3) * 0.4;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, b.r * (0.3 + i / 10), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      A.glow(ctx, b.x, b.y, b.r * 3.4, b.color, 0.8);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSplashes(ctx, s) {
    for (const sp of s.splashes) {
      const p = clamp(sp.t / sp.max, 0, 1);
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = sp.color;
      ctx.lineWidth = 7 * (1 - p) + 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (1 - p) * 0.3;
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles(ctx, s) {
    for (const p of s.particles) {
      ctx.globalAlpha = clamp(p.life / 0.7, 0, 1);
      if (p.kind === "heart") {
        A.heart(ctx, p.x, p.y, p.size * 1.1, p.color, 0.8, p.life * 2);
      } else if (p.kind === "star") {
        A.sparkle(ctx, p.x, p.y, p.size * 1.4, p.color, 1, p.life * 7);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawRainbowGauge(ctx, s, t) {
    const count = s.rescued;
    const total = s.total;
    const x0 = 310;
    const x1 = 970;
    const y = 90;
    ctx.save();
    ctx.fillStyle = "rgba(15, 35, 61, 0.4)";
    rr(ctx, x0 - 18, y - 16, x1 - x0 + 36, 32, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 245, 202, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    const segW = (x1 - x0) / total;
    for (let i = 0; i < total; i++) {
      ctx.fillStyle = i < count ? FISH_COLORS[i] : "rgba(126, 181, 202, 0.2)";
      rr(ctx, x0 + i * segW + 3, y - 8, segW - 6, 16, 7);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255, 246, 214, 0.75)";
    ctx.font = '700 10px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("РАДУГА ДРУЖБЫ", 640, y - 22);
    ctx.restore();
  }

  function drawFinale(ctx, s, t) {
    ctx.save();
    ctx.fillStyle = "rgba(7, 29, 51, 0.22)";
    ctx.fillRect(0, 0, W, H);
    const p = 1 + Math.sin(t * 3) * 0.01;
    ctx.translate(640, 330);
    ctx.scale(p, p);
    A.glow(ctx, 0, 0, 160, "rgba(255, 224, 140, 0.4)", 0.8);
    A.sparkle(ctx, 0, -40, 30, "#ffe68a", 1, t);
    ctx.fillStyle = "rgba(255, 248, 222, 0.95)";
    ctx.font = '700 25px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Все рыбки снова цветные!", 0, 84);
    ctx.font = '700 16px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(255, 244, 211, 0.8)";
    ctx.fillText("Пробел + Enter — обнимашки", 0, 116);
    ctx.restore();
  }

  function draw(ctx, s, t) {
    if (!s) return;
    drawBackground(ctx, s);
    for (const f of s.fish) drawFish(ctx, f, t);
    for (const b of s.blobs) drawBlob(ctx, b, t);
    drawPlayer(ctx, s.players.ilya, t);
    drawPlayer(ctx, s.players.alisa, t);
    drawBalls(ctx, s);
    drawSplashes(ctx, s);
    drawParticles(ctx, s);
    drawRainbowGauge(ctx, s, t);

    if (s.megaT > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, s.megaT);
      A.glow(ctx, 640, 340, 380, "rgba(255, 225, 139, 0.25)", 0.7);
      ctx.restore();
    }

    if (s.combo >= 2) {
      ctx.save();
      const a = clamp(s.comboT / 1.4, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(17, 43, 68, 0.56)";
      rr(ctx, 520, 140, 240, 38, 16);
      ctx.fill();
      ctx.fillStyle = "#ffe68a";
      ctx.font = '700 18px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(`КОМБО ×${s.combo}!`, 640, 166);
      ctx.restore();
    }

    if (s.phase === "finale" || s.phase === "reward") drawFinale(ctx, s, t);
  }

  const Ocean = { create, update, draw, TOTAL_FISH };
  VO.Ocean = Ocean;
})();
