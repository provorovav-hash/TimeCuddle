(function () {
  "use strict";

  const W = 1280;
  const H = 720;
  const STEP = 92;
  const FIRST_SUMMIT_Y = -STEP * 20;
  const SECOND_SUMMIT_Y = -STEP * 50;
  const GRAVITY = 1650;
  const JUMP = -660;
  const LAVA_START = 55;
  const LAVA_SPEED = 17.55;
  const A = VO.Art;

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
    return {
      kind, x, y: 0, vy: 0, w: 34, h: 72,
      onGround: true, platform: null, dir: 1,
      blocks: 2, special: null, stuck: false, stuckT: 0,
      hold: 0, wasAction: false, placed: false, anim: 0,
      color: kind === "ilya" ? "#6fb6e8" : "#ffa7c5",
    };
  }

  function create() {
    const s = {
      phase: "play",
      camera: 0,
      lavaY: LAVA_START,
      freezeT: 0,
      time: 0,
      players: {
        ilya: makePlayer("ilya", 300),
        alisa: makePlayer("alisa", 390),
      },
      platforms: buildPlatforms(),
      walls: [],
      particles: [],
      basket: { x: 640, y: FIRST_SUMMIT_Y - 4 },
      basket2: { x: 640, y: SECOND_SUMMIT_Y - 4 },
      secondVisible: false,
      flying: {
        x: 565, y: FIRST_SUMMIT_Y - 105, w: 150, h: 18,
        type: "flying", flying: true, rider: null, taken: false, owner: "ilya",
      },
      flying2: {
        x: 735, y: FIRST_SUMMIT_Y - 105, w: 150, h: 18,
        type: "flying", flying: true, rider: null, taken: false, owner: "alisa",
      },
      starship: {
        x: 950, y: SECOND_SUMMIT_Y - 48, w: 160, h: 50,
        riding: false, cooldown: 0,
      },
      starshipCargo: 0,
      fallingBlocks: [],
      lavaPushT: 0,
      rideSaid: false,
      landSaid: false,
      starLineSaid: false,
      allStarsSaid: false,
      stars: [
        { x: 300, y: SECOND_SUMMIT_Y - 150, lit: false },
        { x: 510, y: SECOND_SUMMIT_Y - 210, lit: false },
        { x: 720, y: SECOND_SUMMIT_Y - 160, lit: false },
        { x: 950, y: SECOND_SUMMIT_Y - 230, lit: false },
        { x: 1160, y: SECOND_SUMMIT_Y - 170, lit: false },
        { x: 400, y: SECOND_SUMMIT_Y - 320, lit: false },
        { x: 660, y: SECOND_SUMMIT_Y - 370, lit: false },
        { x: 1030, y: SECOND_SUMMIT_Y - 330, lit: false },
      ],
      spaceBlocks: [
        { x: 350, y: SECOND_SUMMIT_Y - 260, w: 58, h: 58, gone: false },
        { x: 620, y: SECOND_SUMMIT_Y - 300, w: 58, h: 58, gone: false },
        { x: 900, y: SECOND_SUMMIT_Y - 270, w: 58, h: 58, gone: false },
        { x: 1080, y: SECOND_SUMMIT_Y - 210, w: 58, h: 58, gone: false },
        { x: 470, y: SECOND_SUMMIT_Y - 420, w: 58, h: 58, gone: false },
        { x: 820, y: SECOND_SUMMIT_Y - 450, w: 58, h: 58, gone: false },
      ],
      line: null, lineT: 0, lineEnded: false, lineMinT: 0, lineQueue: [],
      objective: "Поднимайтесь к Воздушному Шару и стройте мосты",
      lastPlace: { ilya: null, alisa: null },
      popT: 0,
      popX: 0,
      popY: 0,
      finaleT: 0,
      rewardShown: false,
      hint: "Короткое нажатие — добыть блок · удержание — поставить · S/↓ — спрыгнуть с мостика",
      hintT: 8,
    };
    addWalls(s);
    s.platforms.push(s.flying);
    s.platforms.push(s.flying2);
    enqueue(s, "mama", "Ого, Вулкан проснулся! Это карамельная лава! Скорее наверх, к Воздушному Шару!", 3.6);
    enqueue(s, "ilya", "Алиса, ломай блоки!", 1.7);
    enqueue(s, "alisa", "Илюша, строим мост из блоков!", 1.9);
    return s;
  }

  function addWalls(s) {
    for (let i = 1; i < s.platforms.length; i++) {
      const plat = s.platforms[i];
      if (plat.summit) continue;
      const even = i % 2 === 0;
      const spots = even
        ? [plat.x + 24, plat.x + plat.w - 66]
        : [plat.x + plat.w / 2 - 21];
      for (let j = 0; j < spots.length; j++) {
        if (spots[j] < 20 || spots[j] > W - 70) continue;
        s.walls.push({
          x: spots[j],
          y: plat.y - 42,
          w: 42,
          h: 42,
          type: (i + j) % 2 ? "sand" : "stone",
          mineable: true,
        });
      }
    }
  }

  function buildPlatforms() {
    const list = [{ x: 0, y: 0, w: W, h: 22, type: "ground", gold: false }];
    for (let i = 1; i <= 20; i++) {
      const y = -i * STEP;
      let x = i % 2 === 0 ? 300 : 420;
      let w = 400;
      if (i === 6) { x = 220; w = 300; }
      if (i === 12) { x = 650; w = 260; }
      if (i === 20) { x = 0; w = W; }
      const plat = { x, y, w, h: 20, type: "stone", gold: false };
      if (i === 20) {
        plat.type = "summit";
        plat.summit = true;
        plat.firstBalloon = true;
      }
      if (i === 2) { plat.type = "jelly"; plat.special = true; }
      if (i === 5) { plat.type = "ice"; plat.special = true; }
      if (i === 8) { plat.type = "marshmallow"; plat.special = true; }
      if (i === 11) { plat.type = "popcorn"; plat.special = true; }
      if (i === 14) { plat.type = "magnet"; plat.special = true; }
      list.push(plat);
    }
    // Выше первого шара готовых мостиков нет: дети строят их сами.
    list.push({
      x: 0, y: SECOND_SUMMIT_Y, w: W, h: 24,
      type: "summit", summit: true, secondSummit: true,
    });
    return list;
  }

  function enqueue(s, speaker, text, dur) {
    s.lineQueue.push({ speaker, text, dur: dur || 2.8 });
  }
  function say(s, speaker, text, dur) {
    if (s.phase === "reward") return;
    if (s.line || s.lineQueue.length) return;
    enqueue(s, speaker, text, dur);
  }
  function updateLine(s, dt) {
    if (s.line) {
      s.lineT -= dt;
      s.lineMinT = Math.max(0, s.lineMinT - dt);
      if (s.lineT <= 0 || (s.lineEnded && s.lineMinT <= 0)) s.line = null;
    }
    if (!s.line && s.lineQueue.length) {
      const next = s.lineQueue.shift();
      s.line = next;
      s.lineEnded = false;
      s.lineMinT = Math.min(3.2, Math.max(2.1, next.text.length * 0.02 + 1.5));
      const fallback = Math.max(6, next.text.length * 0.1 + 4);
      const started = VO.Sound.speak(next.text, next.speaker, {
        force: true,
        onend: () => { if (s.line === next) s.lineEnded = true; },
        onerror: () => { if (s.line === next) s.lineEnded = true; },
      });
      s.lineT = started ? fallback : Math.max(3, next.text.length * 0.045 + 1.2);
      if (!started) s.lineEnded = true;
    }
  }

  function burst(s, x, y, colors, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 35 + Math.random() * 100;
      s.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25,
        life: 0.7 + Math.random() * 0.6, size: 3 + Math.random() * 4,
        color: colors[i % colors.length],
      });
    }
  }

  function screenY(s, y) { return y - s.camera + 570; }

  function currentPlatform(platforms, p) {
    for (const plat of platforms) {
      if (p.y === plat.y && p.x + 18 > plat.x && p.x - 18 < plat.x + plat.w) return plat;
    }
    return null;
  }

  function nearestPlatform(s, p) {
    const candidates = s.platforms.filter((pl) =>
      pl.y < s.lavaY - 45 && pl.y > p.y - 620 && !pl.summit
    );
    candidates.sort((a, b) => {
      const da = Math.abs(a.y - p.y) * 1.7 + Math.abs(a.x + a.w / 2 - p.x);
      const db = Math.abs(b.y - p.y) * 1.7 + Math.abs(b.x + b.w / 2 - p.x);
      return da - db;
    });
    return candidates[0] || s.platforms[0];
  }

  function rescueStuck(s, p, byPartner) {
    if (!p.stuck) return;
    const plat = nearestPlatform(s, p);
    p.x = clamp(plat.x + plat.w / 2, 80, W - 80);
    p.y = plat.y;
    p.vy = 0;
    p.stuck = false;
    p.stuckT = 0;
    p.onGround = true;
    p.platform = plat;
    burst(s, p.x, p.y, ["#ffcf7a", "#ffd9e1", "#ffe68a"], 24);
    VO.Sound.soapPop();
    if (!byPartner) say(s, "mama", "Карамель сама вытолкнула тебя на пенку! Скорее дальше!", 2.4);
    else say(s, "mama", "Чпок! Вот это взаимовыручка! Скорее наверх!", 2.2);
  }

  function explodePopcorn(s, x, y) {
    let cleared = 0;
    for (const w of s.walls) {
      if (w.gone) continue;
      if (dist(x, y, w.x + w.w / 2, w.y + w.h / 2) < 190) {
        w.gone = true;
        cleared++;
      }
    }
    burst(s, x, y, ["#fff8d4", "#ffe68a", "#ff9f6e"], 34);
    VO.Sound.celebrate();
    say(s, "mama", cleared > 0 ? "Поп! Попкорн разнёс завал и открыл короткую тропинку!" : "Поп! Попкорн весело хлопнул!", 2.4);
  }

  function mineAt(s, p) {
    // Спасение партнёра важнее добычи.
    const other = s.players[p.kind === "ilya" ? "alisa" : "ilya"];
    if (other.stuck && dist(p.x, p.y, other.x, other.y) < 130) {
      rescueStuck(s, other, true);
      return;
    }
    let target = null;
    for (const w of s.walls) {
      if (!w.gone && Math.abs(p.x - (w.x + w.w / 2)) < 95 && Math.abs(p.y - w.y) < 90) { target = w; break; }
    }
    if (!target) {
      for (const pl of s.platforms) {
        if (!pl.special || pl.taken) continue;
        if (Math.abs(p.x - (pl.x + pl.w / 2)) < 110 && Math.abs(p.y - pl.y) < 90) { target = pl; break; }
      }
    }
    if (!target) {
      say(s, p.kind, p.blocks > 0 ? "Держи кнопку дольше — поставишь блок!" : "Подойди ближе к блоку и ударь киркой!", 1.8);
      return;
    }
    if (target.special) {
      target.taken = true;
      if (target.type === "popcorn") {
        explodePopcorn(s, target.x + target.w / 2, target.y - 30);
        return;
      }
      p.special = target.type;
      burst(s, target.x + target.w / 2, target.y - 20, ["#ffe68a", "#ffd3e1", "#9fd8ff"], 18);
      VO.Sound.sparkle();
      say(s, p.kind, `В рюкзаке ${specialName(target.type)}! Поставь его там, где пригодится.`, 2.4);
      return;
    }
    target.gone = true;
    p.blocks++;
    burst(s, target.x + target.w / 2, target.y - 20, ["#e2bd79", "#b98450", "#fff0bb"], 14);
    VO.Sound.plastic();
  }

  function specialName(type) {
    return {
      jelly: "желейный батут",
      ice: "сладкий лёд",
      marshmallow: "зефирный лифт",
      popcorn: "блок-хлопушка",
      magnet: "магнитный кристалл",
    }[type] || "особый блок";
  }

  function placeAt(s, p) {
    if (p.blocks <= 0 && !p.special) {
      say(s, p.kind, "Рюкзак пуст — сломай блок киркой!", 1.8);
      return;
    }
    const isSpecial = !!p.special;
    const type = p.special || "placed";
    const bx = clamp(p.x + p.dir * 46, 30, W - 30);
    const by = p.onGround ? p.y : p.y + 8;
    const aboveFirst = by < FIRST_SUMMIT_Y;
    const w = isSpecial ? 78 : aboveFirst ? 128 : 64;
    if (isSpecial) p.special = null; else p.blocks--;
    const plat = { x: bx - w / 2, y: by, w, h: 18, type, gold: false, special: isSpecial, placed: true };
    s.platforms.push(plat);
    const other = p.kind === "ilya" ? "alisa" : "ilya";
    const last = s.lastPlace[other];
    if (!isSpecial && last && s.time - last.t < 1.5 && Math.abs(last.x - bx) < 180 && Math.abs(last.y - by) < 100) {
      plat.gold = true;
      plat.w = 128;
      plat.x = bx - 64;
      say(s, "mama", "Супер-Мост! Блоки Илюши и Алисы загорелись золотом!", 2.5);
    }
    s.lastPlace[p.kind] = { t: s.time, x: bx, y: by };
    burst(s, bx, by, ["#ffd36e", "#ffe68a", "#9fd8ff"], 16);
    VO.Sound.land();
    if (aboveFirst && !isSpecial) {
      say(s, "mama", "Мостик выше первого шара получил дополнительные блоки — путь на высоту 50 открыт!", 2.6);
    }
    if (isSpecial) {
      if (type === "ice" && Math.abs(by - s.lavaY) < 135) {
        s.freezeT = 5;
        say(s, "mama", "Ледяной куб заморозил карамель на 5 секунд! Бегите!", 2.5);
      } else if (type === "magnet") {
        for (let i = 1; i <= 3; i++) {
          s.platforms.push({
            x: bx + i * 70 - 35, y: by, w: 76, h: 18,
            type: "bridge", gold: true, placed: true,
          });
        }
        say(s, "mama", "Магнитный кристалл собрал золотой мостик!", 2.3);
      } else if (type === "popcorn") {
        s.popT = 0.9;
        s.popX = bx;
        s.popY = by;
      } else {
        say(s, p.kind, `Поставил ${specialName(type)}!`, 1.8);
      }
    }
  }

  function handleAction(s, p) {
    if (p.stuck) return;
    if (s.freezeT > 0 && p.special === "ice") {
      // Ничего: лёд всё равно можно ставить.
    }
    mineAt(s, p);
  }

  function explodeFlying(s, p) {
    const plat = p.platform;
    if (!plat || !plat.flying) return;
    plat.taken = true;
    p.platform = null;
    p.onGround = false;
    p.vy = 90;
    burst(s, plat.x + plat.w / 2, plat.y, ["#ffd36e", "#ffe68a", "#ff9f6e"], 30);
    VO.Sound.celebrate();
    say(s, "mama", "Летающий мостик взорвался! Падай на ближайший мостик!", 2.2);
  }

  function landStarship(s) {
    const ship = s.starship;
    ship.riding = false;
    ship.cooldown = 2.5;
    ship.x = clamp(ship.x, 220, W - 220);
    ship.y = SECOND_SUMMIT_Y - 48;
    for (const kind of ["ilya", "alisa"]) {
      const p = s.players[kind];
      p.x = ship.x + (kind === "ilya" ? -34 : 34);
      p.y = SECOND_SUMMIT_Y;
      p.vy = 0;
      p.onGround = true;
      p.platform = s.platforms.find((pl) => pl.secondSummit) || null;
    }
    if (!s.landSaid) {
      s.landSaid = true;
      enqueue(s, "mama", "Звездолёт сел на зелёную платформу. Можно спрыгнуть вниз!", 2.3);
    }
  }

  function updateStarship(s, dt, input) {
    const ship = s.starship;
    ship.cooldown = Math.max(0, ship.cooldown - dt);
    if (ship.riding) {
      const speed = 210;
      let dx = 0, dy = 0;
      if (input.isDown("KeyA") || input.isDown("ArrowLeft")) dx -= speed * dt;
      if (input.isDown("KeyD") || input.isDown("ArrowRight")) dx += speed * dt;
      if (input.isDown("KeyW") || input.isDown("ArrowUp")) dy -= 130 * dt;
      if (input.isDown("KeyS") || input.isDown("ArrowDown")) dy += 130 * dt;
      const allLit = s.stars.every((star) => star.lit);
      const lowest = allLit
        ? Math.min(0, s.lavaY - 18)
        : Math.min(SECOND_SUMMIT_Y - 20, s.lavaY - 40);
      ship.x = clamp(ship.x + dx, 60, W - 60);
      ship.y = clamp(ship.y + dy, SECOND_SUMMIT_Y - 620, lowest);
      s.players.ilya.x = ship.x - 38;
      s.players.ilya.y = ship.y;
      s.players.ilya.onGround = false;
      s.players.ilya.platform = null;
      s.players.alisa.x = ship.x + 38;
      s.players.alisa.y = ship.y;
      s.players.alisa.onGround = false;
      s.players.alisa.platform = null;

      for (const star of s.stars) {
        if (!star.lit && dist(ship.x, ship.y, star.x, star.y) < 145) {
          star.lit = true;
          burst(s, star.x, star.y, ["#fff4c4", "#ffe68a", "#9fd8ff"], 20);
          VO.Sound.sparkle();
          if (!s.starLineSaid) {
            s.starLineSaid = true;
            enqueue(s, "mama", "Звёздочка засветилась и улыбается!", 2);
          }
        }
      }
      if (s.stars.every((star) => star.lit) && !s.allStarsSaid) {
        s.allStarsSaid = true;
        enqueue(s, "mama", "Все звёздочки проснулись! Теперь звездолёт может спуститься к самой лаве.", 2.8);
      }
      for (const block of s.spaceBlocks) {
        if (!block.gone && dist(ship.x, ship.y, block.x + block.w / 2, block.y + block.h / 2) < 120) {
          block.gone = true;
          s.starshipCargo++;
          burst(s, block.x + block.w / 2, block.y + block.h / 2, ["#ffd36e", "#ff9f6e", "#fff4c4"], 26);
          VO.Sound.celebrate();
        }
      }
      if (input.justPressed("Space") || input.justPressed("Enter")) {
        if (s.starshipCargo > 0) throwStarshipBlock(s);
        else landStarship(s);
      }
      return;
    }
    if (!s.secondVisible || ship.cooldown > 0) return;
    const ilya = s.players.ilya;
    const alisa = s.players.alisa;
    const bothNear = ["ilya", "alisa"].every((kind) => {
      const p = s.players[kind];
      return Math.abs(p.x - ship.x) < 155 && Math.abs(p.y - SECOND_SUMMIT_Y) < 70;
    });
    if (bothNear) {
      ship.riding = true;
      ship.y = SECOND_SUMMIT_Y - 110;
      if (!s.rideSaid) {
        s.rideSaid = true;
        enqueue(s, "mama", "Звездолёт взлетает!", 1.8);
      }
    }
  }

  function throwStarshipBlock(s) {
    if (s.starshipCargo <= 0) return;
    s.starshipCargo--;
    s.fallingBlocks.push({
      x: s.starship.x,
      y: s.starship.y + 28,
      vy: 60,
      w: 38,
      h: 38,
    });
    VO.Sound.bump();
  }

  function updateFallingBlocks(s, dt) {
    for (const b of s.fallingBlocks) {
      if (b.dead) continue;
      const prevY = b.y;
      b.vy += 900 * dt;
      b.y += b.vy * dt;
      for (const plat of s.platforms) {
        if (plat.taken || plat.gone || plat.summit || plat.type === "ground") continue;
        if (!(plat.placed || plat.type === "bridge" || plat.gold)) continue;
        if (prevY <= plat.y && b.y >= plat.y &&
          b.x + b.w / 2 > plat.x && b.x - b.w / 2 < plat.x + plat.w) {
          plat.taken = true;
          b.dead = true;
          burst(s, b.x, plat.y, ["#ffd36e", "#ff9f6e", "#fff4c4"], 24);
          VO.Sound.celebrate();
          break;
        }
      }
      if (!b.dead && b.y >= s.lavaY) {
        b.dead = true;
        s.lavaPushT = 3;
        burst(s, b.x, s.lavaY, ["#ffcf5c", "#ff8f4d", "#fff4c4"], 28);
        VO.Sound.soapPop();
      }
    }
    s.fallingBlocks = s.fallingBlocks.filter((b) => !b.dead);
  }

  function updatePlayer(s, p, dt, input, cfg) {
    if (p.stuck) {
      p.stuckT += dt;
      p.vy = 0;
      if (p.stuckT > 3.2) rescueStuck(s, p, false);
      return;
    }
    const left = cfg.left, right = cfg.right, jump = cfg.jump, action = cfg.action;
    if (p.platform && p.platform.flying && !p.platform.taken) {
      const plat = p.platform;
      if (input.justPressed(action)) {
        explodeFlying(s, p);
        return;
      }
      const lift = 128;
      if (input.isDown(jump)) plat.y -= lift * dt;
      if (input.isDown(cfg.drop)) plat.y += lift * dt;
      if (input.isDown(left)) plat.x -= 190 * dt;
      if (input.isDown(right)) plat.x += 190 * dt;
      plat.y = clamp(plat.y, SECOND_SUMMIT_Y - 30, Math.min(0, s.lavaY - 40));
      plat.x = clamp(plat.x, 30, W - plat.w - 30);
      p.x = plat.x + plat.w / 2;
      p.y = plat.y;
      p.vy = 0;
      p.onGround = true;
      p.anim += dt;
      return;
    }
    if (input.justPressed(cfg.drop) && p.onGround && p.platform) {
      p.y += 7;
      p.vy = 95;
      p.onGround = false;
      p.platform = null;
      VO.Sound.bump();
      return;
    }
    let speed = 230;
    if (p.platform && p.platform.type === "ice") speed = 460;
    if (input.isDown(left)) { p.x -= speed * dt; p.dir = -1; }
    if (input.isDown(right)) { p.x += speed * dt; p.dir = 1; }
    const actionDown = input.isDown(action);
    if (input.justPressed(action)) {
      p.hold = 0;
      p.placed = false;
    }
    if (actionDown && !p.wasAction) p.wasAction = true;
    if (actionDown) {
      p.hold += dt;
      if (p.hold >= 0.5 && !p.placed) {
        p.placed = true;
        placeAt(s, p);
      }
    }
    if (!actionDown && p.wasAction) {
      p.wasAction = false;
      if (!p.placed) handleAction(s, p);
    }
    if (input.justPressed(jump) && p.onGround) {
      p.vy = JUMP;
      p.onGround = false;
      p.platform = null;
      VO.Sound.land();
    }
    const prevY = p.y;
    p.vy += GRAVITY * dt;
    p.y += p.vy * dt;
    p.anim += dt;

    let landed = null;
    if (p.vy >= 0) {
      for (const plat of s.platforms) {
        if (plat.taken || plat.gone) continue;
        const fell = prevY <= plat.y + 4 && p.y >= plat.y;
        const over = p.x + 17 > plat.x && p.x - 17 < plat.x + plat.w;
        if (fell && over) {
          if (!landed || plat.y < landed.y) landed = plat;
        }
      }
      if (!landed && p.y >= s.lavaY && s.freezeT > 0) {
        p.y = s.lavaY;
        p.vy = 0;
        p.onGround = true;
        p.platform = null;
      }
    }
    if (landed) {
      p.y = landed.y;
      p.vy = 0;
      const wasAir = !p.onGround;
      p.onGround = true;
      p.platform = landed;
      if (wasAir) {
        if (landed.type === "jelly") {
          p.vy = -1050;
          p.onGround = false;
          p.platform = null;
          VO.Sound.boing();
          burst(s, p.x, p.y, ["#b6f58b", "#e7ffb0", "#8dffcc"], 18);
          say(s, "mama", "Боинг-пружин! Желейный блок подбросил на четыре блока!", 2.1);
        } else if (landed.type === "marshmallow" && !landed.liftT) {
          landed.liftT = 3;
          landed.liftBase = landed.y;
          VO.Sound.boing();
          say(s, "mama", "Зефирный лифт поднимается! Встаньте вдвоём!", 2.2);
        }
      }
    } else {
      p.onGround = false;
      if (!p.platform) p.platform = null;
    }
    if (p.y >= s.lavaY && s.freezeT <= 0) {
      p.stuck = true;
      p.stuckT = 0;
      p.y = s.lavaY;
      p.vy = 0;
      p.onGround = false;
      p.platform = null;
      VO.Sound.sleepy();
      enqueue(s, p.kind, p.kind === "ilya" ? "Ой-ой! Я наступил в карамельку!" : "Ой, я влипла в ириску!", 2);
      if (p.kind === "ilya") enqueue(s, "alisa", "Держись! Сейчас вытащу!", 1.8);
      say(s, "mama", "Держись! Второй игрок может вытащить тебя, или лава сама вытолкнет!", 2.6);
    }
    p.x = clamp(p.x, 40, W - 40);
  }

  function updatePlatforms(s, dt) {
    for (const plat of s.platforms) {
      if (plat.liftT > 0) {
        plat.liftT -= dt;
        const dy = -58 * dt;
        plat.y += dy;
        for (const p of Object.values(s.players)) {
          if (p.platform === plat) {
            p.y += dy;
          }
        }
      }
    }
  }

  function startFinale(s, basket) {
    s.phase = "finale";
    s.finaleT = 0;
    s.finalBasket = basket || s.basket;
    s.line = null;
    s.lineQueue = [];
    VO.Sound.celebrate();
    enqueue(s, "alisa", "Ура, мы успели!", 1.8);
    enqueue(s, "ilya", "Обнимаемся!", 1.5);
    enqueue(s, "mama", "Поехали! Настоящие чемпионы-строители!", 2.6);
  }

  function update(s, dt, input) {
    if (!s) return;
    s.time += dt;
    updateLine(s, dt);
    s.freezeT = Math.max(0, s.freezeT - dt);
    if (s.popT > 0) {
      s.popT -= dt;
      if (s.popT <= 0) explodePopcorn(s, s.popX, s.popY);
    }
    if (s.hintT > 0) s.hintT -= dt;
    for (const p of s.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
    }
    s.particles = s.particles.filter((p) => p.life > 0);

    if (s.phase === "finale") {
      s.finaleT += dt;
      if (s.finalBasket) s.finalBasket.y -= 16 * dt;
      if (s.finaleT > 1.2 && s.finaleT < 1.3) {
        VO.Sound.hug();
      }
      if (s.finaleT > 2.6 && !s.rewardShown) {
        s.rewardShown = true;
        s.phase = "reward";
      }
      return;
    }
    if (s.phase !== "play") return;

    if (s.lavaPushT > 0) {
      s.lavaPushT = Math.max(0, s.lavaPushT - dt);
      s.lavaY += LAVA_SPEED * 1.15 * dt;
    } else if (s.freezeT <= 0) {
      s.lavaY -= LAVA_SPEED * dt;
    }
    updatePlatforms(s, dt);
    updateFallingBlocks(s, dt);
    if (!s.starship.riding) {
      updatePlayer(s, s.players.ilya, dt, input, { left: "KeyA", right: "KeyD", jump: "KeyW", drop: "KeyS", action: "Space" });
      updatePlayer(s, s.players.alisa, dt, input, { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", drop: "ArrowDown", action: "Enter" });
    }
    updateStarship(s, dt, input);

    const avg = (s.players.ilya.y + s.players.alisa.y) / 2;
    s.camera += (avg - 20 - s.camera) * Math.min(1, dt * 2.4);
    const ilya = s.players.ilya;
    const alisa = s.players.alisa;
    const height = clamp(Math.round(-Math.min(ilya.y, alisa.y) / STEP), 0, 50);
    s.secondVisible = height >= 50;
    if (ilya.stuck) s.objective = "Илюша влип в карамель — вытащите его!";
    else if (alisa.stuck) s.objective = "Алиса влипла в карамель — вытащите её!";
    else if (s.starship.riding) {
      s.objective = s.starshipCargo > 0
        ? `Звездолёт: блоков ${s.starshipCargo} · Пробел/Enter — бросок на лаву`
        : "Звездолёт: Пробел/Enter — посадка на зелёную платформу";
    }
    else if (height < 20) s.objective = "Поднимайтесь к первому Воздушному Шару, стройте мосты";
    else if (height < 50) s.objective = `Высота ${height}/50 — второй шар появится на 50`;
    else s.objective = "Второй шар на высоте 50! Обнимитесь в корзине";

    const firstReady =
      Math.abs(ilya.x - s.basket.x) < 110 && Math.abs(alisa.x - s.basket.x) < 110 &&
      Math.abs(ilya.y - FIRST_SUMMIT_Y) < 50 && Math.abs(alisa.y - FIRST_SUMMIT_Y) < 50;
    const secondReady = s.secondVisible &&
      Math.abs(ilya.x - s.basket2.x) < 110 && Math.abs(alisa.x - s.basket2.x) < 110 &&
      Math.abs(ilya.y - SECOND_SUMMIT_Y) < 50 && Math.abs(alisa.y - SECOND_SUMMIT_Y) < 50;
    if (!s.starship.riding && (firstReady || secondReady) && input.isDown("Space") && input.isDown("Enter")) {
      startFinale(s, secondReady ? s.basket2 : s.basket);
    }
  }

  function drawBackground(ctx, s) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#7f6bd4");
    g.addColorStop(0.35, "#e39a87");
    g.addColorStop(0.7, "#8f5964");
    g.addColorStop(1, "#3e2f4f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = i % 3 ? "rgba(255, 224, 144, 0.55)" : "rgba(255, 255, 255, 0.35)";
      ctx.fillRect((i * 199) % W, 40 + (i * 83) % 300, 2, 2);
    }
    // Дальний вулкан.
    ctx.fillStyle = "rgba(78, 57, 91, 0.5)";
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.lineTo(180, 250);
    ctx.lineTo(360, 430);
    ctx.lineTo(560, 170);
    ctx.lineTo(760, 430);
    ctx.lineTo(980, 230);
    ctx.lineTo(1280, 520);
    ctx.lineTo(1280, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();
  }

  function drawLava(ctx, s) {
    const ly = screenY(s, s.lavaY);
    if (ly > H + 40) return;
    const g = ctx.createLinearGradient(0, ly, 0, H);
    g.addColorStop(0, s.freezeT > 0 ? "#bfefff" : "#ffcf5c");
    g.addColorStop(0.5, s.freezeT > 0 ? "#8fd8ff" : "#ff8f4d");
    g.addColorStop(1, s.freezeT > 0 ? "#6cbfe8" : "#c94e53");
    ctx.fillStyle = g;
    ctx.fillRect(0, ly, W, H - ly);
    ctx.strokeStyle = s.freezeT > 0 ? "#e8fbff" : "#ffe68a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 32) {
      const y = ly + Math.sin(x * 0.025 + s.time * 2.2) * 7;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (s.freezeT > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      for (let x = 20; x < W; x += 90) {
        ctx.fillRect(x, ly + 12, 48, 8);
      }
    } else {
      for (let i = 0; i < 16; i++) {
        const bx = (i * 137 + s.time * 35) % W;
        const by = ly + 18 + (i * 47) % Math.max(20, H - ly);
        ctx.fillStyle = "rgba(255, 240, 169, 0.55)";
        ctx.fillRect(bx, by, 6 + (i % 3) * 3, 6 + (i % 3) * 3);
      }
    }
  }

  function drawPlatform(ctx, s, plat) {
    if (plat.taken || plat.gone) return;
    const y = screenY(s, plat.y);
    if (y > H + 60 || y < -100) return;
    const isSpecial = plat.type !== "stone" && plat.type !== "ground" && plat.type !== "placed" && plat.type !== "bridge" && plat.type !== "summit";
    let color = "#8d7a72";
    if (plat.type === "ground") color = "#6d5a57";
    if (plat.type === "placed") color = "#b98450";
    if (plat.type === "bridge") color = "#e8b84f";
    if (plat.type === "summit") color = "#74b96e";
    if (plat.type === "jelly") color = "#8fe66f";
    if (plat.type === "ice") color = "#9fdcff";
    if (plat.type === "marshmallow") color = "#ffe3e8";
    if (plat.type === "popcorn") color = "#e96161";
    if (plat.type === "magnet") color = "#a982e8";
    if (plat.flying) color = plat.owner === "alisa" ? "#ffb6d2" : "#ffe08a";
    if (plat.gold) color = "#ffd86a";
    ctx.fillStyle = color;
    ctx.fillRect(plat.x, y, plat.w, plat.h);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(plat.x, y, plat.w, 5);
    ctx.strokeStyle = "rgba(52, 33, 47, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(plat.x, y, plat.w, plat.h);
    if (plat.type === "jelly") {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(plat.x + 22 + i * 35, y + 8, 8, 8);
      }
    } else if (plat.type === "ice") {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.moveTo(plat.x + 16, y + 12);
      ctx.lineTo(plat.x + 35, y + 4);
      ctx.lineTo(plat.x + 50, y + 14);
      ctx.stroke();
    } else if (plat.type === "marshmallow") {
      ctx.fillStyle = "rgba(255,170,190,0.55)";
      ctx.fillRect(plat.x + 12, y + 7, plat.w - 24, 6);
    } else if (plat.type === "popcorn") {
      ctx.fillStyle = "#fff8d4";
      for (let i = 0; i < 5; i++) ctx.fillRect(plat.x + 12 + i * 14, y - 8 - (i % 2) * 5, 8, 8);
    } else if (plat.type === "magnet") {
      ctx.strokeStyle = "#f0ddff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(plat.x + plat.w / 2, y + 10, 14, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = "#fff2ff";
      ctx.fillRect(plat.x + 14, y + 8, 7, 12);
      ctx.fillRect(plat.x + plat.w - 21, y + 8, 7, 12);
    }
    if (plat.flying) {
      A.glow(ctx, plat.x + plat.w / 2, y + 8, 100,
        plat.owner === "alisa" ? "rgba(255, 182, 210, 0.5)" : "rgba(255, 224, 131, 0.45)", 0.7);
      ctx.fillStyle = "#dff7ff";
      ctx.fillRect(plat.x - 28, y + 2, 22, 7);
      ctx.fillRect(plat.x + plat.w + 6, y + 2, 22, 7);
      ctx.fillStyle = "#fff4c4";
      ctx.font = '700 10px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(plat.owner === "alisa" ? "МОСТИК А" : "МОСТИК И", plat.x + plat.w / 2, y - 10);
    }
  }

  function drawWall(ctx, s, w) {
    if (w.gone) return;
    const y = screenY(s, w.y);
    if (y > H + 50 || y < -60) return;
    ctx.fillStyle = w.type === "sand" ? "#e0bc7b" : "#8f9aa0";
    ctx.fillRect(w.x, y, w.w, w.h);
    ctx.strokeStyle = "rgba(70, 48, 40, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, y, w.w, w.h);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(w.x + 5, y + 5, w.w - 10, 5);
  }

  function drawPlayer(ctx, s, p) {
    const x = p.x;
    const y = screenY(s, p.y);
    if (y < -100 || y > H + 80) return;
    if (p.stuck) {
      ctx.fillStyle = "#ffcf7a";
      ctx.fillRect(x - 28, y - 18, 56, 20);
      ctx.fillStyle = p.color;
      ctx.fillRect(x - 20, y - 50, 40, 34);
      ctx.fillStyle = "#ffe1bd";
      ctx.fillRect(x - 16, y - 82, 32, 32);
      ctx.fillStyle = "#fff5c2";
      ctx.font = '700 15px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Ой! Влип!", x, y - 96);
      return;
    }
    const bob = Math.sin(p.anim * 8) * 1.5;
    ctx.fillStyle = p.kind === "ilya" ? "#345e9b" : "#9e426d";
    ctx.fillRect(x - 13, y - 15, 10, 15);
    ctx.fillRect(x + 4, y - 15, 10, 15);
    ctx.fillStyle = p.color;
    ctx.fillRect(x - 18, y - 52 + bob, 36, 38);
    ctx.fillStyle = "#ffe1bd";
    ctx.fillRect(x - 15, y - 84 + bob, 30, 32);
    ctx.fillStyle = p.kind === "ilya" ? "#6b4b36" : "#e2bc69";
    ctx.fillRect(x - 17, y - 90 + bob, 34, 11);
    ctx.fillStyle = "#42353b";
    ctx.fillRect(x - 8, y - 70 + bob, 5, 5);
    ctx.fillRect(x + 5, y - 70 + bob, 5, 5);
    ctx.strokeStyle = "#bfe9ff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x + (p.kind === "ilya" ? 17 : -17), y - 40);
    ctx.lineTo(x + (p.kind === "ilya" ? 32 : -32), y - 58);
    ctx.stroke();
    ctx.fillStyle = "#dff7ff";
    ctx.fillRect(x + (p.kind === "ilya" ? 26 : -38), y - 66, 16, 8);
    if (p.special) {
      ctx.fillStyle = "#ffe68a";
      ctx.fillRect(x - 24, y - 48, 8, 8);
    }
  }

  function drawSkyDecor(ctx, s) {
    // Неподвижные звёздочки и облачка между первым и вторым шаром:
    // по ним видно, как летающие мостики двигаются вверх-вниз.
    for (let i = 0; i < 18; i++) {
      const wy = FIRST_SUMMIT_Y - 110 - i * 145;
      if (wy < SECOND_SUMMIT_Y + 80) break;
      const y = screenY(s, wy);
      if (y < -60 || y > H + 40) continue;
      const x = 110 + (i * 227) % 1060;
      if (i % 2 === 0) {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = i % 4 === 0 ? "#fff2bd" : "#cdd8ff";
        const size = i % 4 === 0 ? 4 : 3;
        ctx.fillRect(x - size / 2, y - 1, size, size);
        ctx.fillRect(x - 1, y - size / 2, size, size);
      } else {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#fff7e4";
        ctx.fillRect(x - 25, y, 50, 10);
        ctx.fillRect(x - 12, y - 7, 27, 10);
        ctx.fillRect(x + 10, y - 4, 18, 8);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawStars(ctx, s) {
    if (!s.secondVisible && !s.starship.riding) return;
    for (const star of s.stars) {
      const y = screenY(s, star.y);
      if (y < -90 || y > H + 40) continue;
      A.glow(ctx, star.x, y, star.lit ? 90 : 45,
        star.lit ? "rgba(255, 244, 188, 0.65)" : "rgba(255, 244, 188, 0.22)", 0.7);
      ctx.fillStyle = star.lit ? "#fff4b0" : "#b9a6d6";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 18 : 8;
        const px = star.x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      if (star.lit) {
        ctx.strokeStyle = "#9a684e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(star.x - 6, y - 2, 3, Math.PI, 0);
        ctx.arc(star.x + 6, y - 2, 3, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(star.x, y + 3, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    }
  }

  function drawSpaceBlocks(ctx, s) {
    if (!s.secondVisible && !s.starship.riding) return;
    for (const b of s.spaceBlocks) {
      if (b.gone) continue;
      const y = screenY(s, b.y);
      if (y < -80 || y > H + 40) continue;
      ctx.fillStyle = "#6f5b82";
      ctx.fillRect(b.x, y, b.w, b.h);
      ctx.fillStyle = "#9d86b5";
      ctx.fillRect(b.x + 6, y + 6, b.w - 12, 8);
      ctx.strokeStyle = "rgba(255, 222, 147, 0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, y, b.w, b.h);
    }
  }

  function drawFallingBlocks(ctx, s) {
    for (const b of s.fallingBlocks) {
      const y = screenY(s, b.y);
      if (y < -60 || y > H + 60) continue;
      ctx.save();
      ctx.translate(b.x, y);
      ctx.rotate(s.time * 3);
      ctx.fillStyle = "#7d5f9e";
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.fillStyle = "#d9a9ff";
      ctx.fillRect(-b.w / 2 + 5, -b.h / 2 + 5, b.w - 10, 7);
      ctx.restore();
    }
  }

  function drawStarship(ctx, s) {
    if (!s.secondVisible && !s.starship.riding) return;
    const ship = s.starship;
    const y = screenY(s, ship.y);
    if (y < -120 || y > H + 80) return;
    ctx.save();
    A.glow(ctx, ship.x, y, 100, "rgba(159, 216, 255, 0.42)", 0.75);
    ctx.fillStyle = "#dff7ff";
    ctx.beginPath();
    ctx.ellipse(ship.x, y, 74, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8fc8ff";
    ctx.beginPath();
    ctx.ellipse(ship.x, y - 10, 42, 24, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd36e";
    ctx.fillRect(ship.x - 72, y - 4, 28, 8);
    ctx.fillRect(ship.x + 44, y - 4, 28, 8);
    ctx.fillStyle = "#ff9fc4";
    ctx.fillRect(ship.x - 38, y - 14, 16, 10);
    ctx.fillRect(ship.x + 22, y - 14, 16, 10);
    ctx.fillStyle = "#4b3b55";
    ctx.beginPath();
    ctx.arc(ship.x - 30, y - 11, 2, 0, Math.PI * 2);
    ctx.arc(ship.x + 30, y - 11, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBasketAt(ctx, s, basket) {
    const by = screenY(s, basket.y);
    if (by < -100 || by > H + 100) return;
    ctx.fillStyle = "#9a6b42";
    ctx.fillRect(basket.x - 58, by - 55, 116, 55);
    ctx.strokeStyle = "#5b3b2f";
    ctx.lineWidth = 4;
    ctx.strokeRect(basket.x - 58, by - 55, 116, 55);
    ctx.fillStyle = "#ffd36e";
    ctx.fillRect(basket.x - 44, by - 50, 88, 8);
    ctx.fillStyle = basket === s.basket2 ? "#7fd7ff" : "#ff7d9c";
    ctx.beginPath();
    ctx.arc(basket.x, by - 120, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd36e";
    ctx.fillRect(basket.x - 10, by - 185, 20, 20);
    A.glow(ctx, basket.x, by - 120, 120, "rgba(255, 224, 131, 0.35)", 0.7);
  }

  function drawBasket(ctx, s) {
    drawBasketAt(ctx, s, s.basket);
    if (s.secondVisible) drawBasketAt(ctx, s, s.basket2);
  }

  function drawEffects(ctx, s) {
    for (const p of s.particles) {
      const y = screenY(s, p.y);
      ctx.globalAlpha = clamp(p.life / 0.8, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawHint(ctx, s) {
    if (s.hintT <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.hintT);
    ctx.fillStyle = "rgba(37, 27, 45, 0.6)";
    rr(ctx, 300, 86, 680, 36, 12);
    ctx.fill();
    ctx.fillStyle = "#fff1c1";
    ctx.font = '700 13px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Короткое — добыть · удержание — поставить · S/↓ — спрыгнуть · летающий: W/S/A/D, Пробел/Enter — взрыв", 640, 109);
    ctx.restore();
  }

  function draw(ctx, s, t) {
    if (!s) return;
    drawBackground(ctx, s);
    drawSkyDecor(ctx, s);
    drawStars(ctx, s);
    drawLava(ctx, s);
    for (const plat of s.platforms) drawPlatform(ctx, s, plat);
    for (const w of s.walls) drawWall(ctx, s, w);
    drawSpaceBlocks(ctx, s);
    drawFallingBlocks(ctx, s);
    drawBasket(ctx, s);
    drawStarship(ctx, s);
    drawPlayer(ctx, s, s.players.ilya);
    drawPlayer(ctx, s, s.players.alisa);
    drawEffects(ctx, s);
    drawHint(ctx, s);
    if (s.phase === "finale" || s.phase === "reward") {
      ctx.fillStyle = "rgba(255, 236, 176, 0.2)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff6d8";
      ctx.font = '700 26px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Шар взлетает!", 640, 180);
    }
  }

  VO.Volcano = { create, update, draw };
})();
