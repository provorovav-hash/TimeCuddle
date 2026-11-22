/* ==========================================================================
   ВремяОбнимашки — четыре сна, их правила и маленькие чудеса
   ========================================================================== */

(function () {
  "use strict";

  const VO = (window.VO = window.VO || {});
  const A = VO.Art;
  const S = VO.Scenery;
  const { TAU, clamp, lerp } = A;

  const GROUND = 600;
  const CX = (p) => p.x + p.w / 2;
  const BOTTOM = (p) => p.y + p.h;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  function nearPoint(p, x, y, r) {
    return dist(CX(p), BOTTOM(p) - 30, x, y) < r;
  }

  function keycap(ctx, x, y, label, w, h, accent) {
    A.fillRR(ctx, x, y, w, h, 5, "rgba(255, 253, 245, 0.98)");
    ctx.strokeStyle = accent || "rgba(75, 70, 105, 0.28)";
    ctx.lineWidth = 1.2;
    A.rr(ctx, x, y, w, h, 5);
    ctx.stroke();
    ctx.fillStyle = accent || "#5a5675";
    ctx.font = '700 8.5px "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
  }

  function drawPrompt(ctx, t, x, y, text, keys, opts) {
    const o = opts || {};
    const accent = o.accent || "#4d4869";
    const keyList = keys && keys.length ? keys : [];
    ctx.save();
    ctx.font = '700 12.5px "Segoe UI", "Trebuchet MS", sans-serif';
    const tw = ctx.measureText(text).width;
    let kw = 0;
    for (const k of keyList) kw += Math.max(28, ctx.measureText(k).width + 13) + 4;
    const padX = 12;
    const gap = keyList.length ? 8 : 0;
    const w = tw + kw + gap + padX * 2;
    const h = 31;
    const bob = Math.sin(t * 2.3) * 2;
    let bx = x - w / 2;
    let by = y - h + bob;
    bx = clamp(bx, 16, 1280 - w - 16);
    by = clamp(by, 96, 560);

    // Хвостик.
    ctx.beginPath();
    ctx.moveTo(x - 5, by + h - 1);
    ctx.lineTo(x + 5, by + h - 1);
    ctx.lineTo(x, by + h + 7);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 250, 238, 0.97)";
    ctx.fill();

    ctx.shadowColor = "rgba(9, 10, 32, 0.24)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    A.fillRR(ctx, bx, by, w, h, 11, "rgba(255, 250, 238, 0.97)");
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = o.border || "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.4;
    A.rr(ctx, bx, by, w, h, 11);
    ctx.stroke();

    // Цветная искорка слева.
    A.sparkle(ctx, bx + 8, by + h / 2, 3.6, o.sparkColor || "#ffd27a", 0.9, t * 0.2);

    ctx.fillStyle = accent;
    ctx.font = '700 12.5px "Segoe UI", "Trebuchet MS", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let tx = bx + padX + 8;
    ctx.fillText(text, tx, by + h / 2 + 0.5);
    tx += tw + gap;
    for (const k of keyList) {
      const ww = Math.max(28, ctx.measureText(k).width + 13);
      keycap(ctx, tx, by + (h - 19) / 2, k, ww, 19, o.keyColor || "#5a5675");
      tx += ww + 4;
    }
    ctx.restore();
  }

  function drawRoundRing(ctx, p, progress, color) {
    const x = CX(p);
    const y = p.y - 16;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 249, 228, 0.3)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = color || "#ffd27a";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(progress, 0, 1));
    ctx.stroke();
    ctx.restore();
  }

  // Мягкая темнота с «окнами» света.
  let darkCanvas = null;
  let darkCtx = null;

  function nightLights(ctx, lights, alpha) {
    if (!darkCanvas) {
      darkCanvas = document.createElement("canvas");
      darkCanvas.width = 1280;
      darkCanvas.height = 720;
      darkCtx = darkCanvas.getContext("2d");
    }
    darkCtx.clearRect(0, 0, 1280, 720);
    darkCtx.fillStyle = `rgba(6, 8, 25, ${alpha})`;
    darkCtx.fillRect(0, 0, 1280, 720);
    darkCtx.globalCompositeOperation = "destination-out";
    for (const l of lights) {
      const g = darkCtx.createRadialGradient(l.x, l.y, l.r * 0.15, l.x, l.y, l.r);
      g.addColorStop(0, "rgba(0,0,0,0.98)");
      g.addColorStop(0.55, "rgba(0,0,0,0.82)");
      g.addColorStop(0.82, "rgba(0,0,0,0.35)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      darkCtx.fillStyle = g;
      darkCtx.beginPath();
      darkCtx.arc(l.x, l.y, l.r, 0, TAU);
      darkCtx.fill();
    }
    darkCtx.globalCompositeOperation = "source-over";
    ctx.drawImage(darkCanvas, 0, 0);
  }

  function drawLightBeam(ctx, from, to, width, alpha, t) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 5) return;
    const nx = -dy / len;
    const ny = dx / len;
    const a = alpha == null ? 0.55 : alpha;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    g.addColorStop(0, `rgba(255, 244, 190, ${a * 0.64})`);
    g.addColorStop(0.45, `rgba(255, 228, 145, ${a * 0.34})`);
    g.addColorStop(1, "rgba(255, 220, 130, 0.03)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(from.x + nx * 5, from.y + ny * 5);
    ctx.lineTo(to.x + nx * width, to.y + ny * width);
    ctx.quadraticCurveTo(to.x + nx * width * 0.25, to.y + ny * width * 0.25, to.x - nx * width, to.y - ny * width);
    ctx.lineTo(from.x - nx * 5, from.y - ny * 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 248, 207, ${a * 0.44})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Искры вдоль луча.
    for (let i = 0; i < 7; i++) {
      const p = (i / 7 + (t * 0.14) % 0.14) % 1;
      const x = from.x + dx * p + Math.sin(t * 2 + i) * 6;
      const y = from.y + dy * p + Math.cos(t * 1.7 + i) * 6;
      A.sparkle(ctx, x, y, 1.8 + (i % 2), "#fff4bd", a * (0.45 + 0.4 * Math.sin(t * 3 + i)), t + i);
    }
    ctx.restore();
  }

  function drawColorBeam(ctx, from, to, width, alpha, color, t) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 5) return;
    const nx = -dy / len;
    const ny = dx / len;
    const a = alpha == null ? 0.55 : alpha;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    g.addColorStop(0, color);
    g.addColorStop(0.5, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = a;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(from.x + nx * 5, from.y + ny * 5);
    ctx.lineTo(to.x + nx * width, to.y + ny * width);
    ctx.quadraticCurveTo(to.x + nx * width * 0.25, to.y + ny * width * 0.25, to.x - nx * width, to.y - ny * width);
    ctx.lineTo(from.x - nx * 5, from.y - ny * 5);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = a * 0.75;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const p = (i / 7 + (t * 0.14) % 0.14) % 1;
      const x = from.x + dx * p + Math.sin(t * 2 + i) * 6;
      const y = from.y + dy * p + Math.cos(t * 1.7 + i) * 6;
      A.sparkle(ctx, x, y, 1.8 + (i % 2), color, a * (0.4 + 0.4 * Math.sin(t * 3 + i)), t + i);
    }
    ctx.restore();
  }

  function drawFireflies(ctx, t, fireflies) {
    for (const f of fireflies) {
      if (f.collected) continue;
      const x = f.x + Math.sin(t * 1.2 + f.x * 0.03) * 8;
      const y = f.y + Math.cos(t * 1.5 + f.y * 0.02) * 9;
      A.drawFirefly(ctx, x, y, t + f.x, 1);
      if (!f.hintShown) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "rgba(255, 239, 177, 0.5)";
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.arc(x, y, 22 + Math.sin(t * 2) * 2, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function collectFireflies(level, game) {
    for (const f of level.fireflies) {
      if (f.collected) continue;
      for (const p of [game.ilya, game.alisa]) {
        if (dist(CX(p), BOTTOM(p) - 30, f.x, f.y) < 48) {
          f.collected = true;
          VO.Sound.firefly();
          game.burst(f.x, f.y, {
            count: 18,
            colors: ["#ffe9a0", "#fff5c8", "#ffc96f"],
            speed: 150,
            gravity: -40,
            kind: "spark",
            life: 1.1,
            size: 3,
          });
          game.collectFirefly(f);
          break;
        }
      }
    }
  }

  function baseLevel(config) {
    return Object.assign(
      {
        seen: new Set(),
        t: 0,
        fireflies: [],
        fireflyScore: 0,
        once(key) {
          if (this.seen.has(key)) return false;
          this.seen.add(key);
          return true;
        },
        intro: [],
        getPortal() {
          return null;
        },
        actionContext() {
          return null;
        },
        isNearInteractable() {
          return false;
        },
        preUpdate() {},
        postUpdate() {},
        drawBack() {},
        drawFront() {},
        onDoorHug() {},
      },
      config
    );
  }

  // =======================================================================
  // СОН 1
  // =======================================================================

  function makeSocks() {
    const level = baseLevel({
      id: "socks",
      index: 0,
      title: "Остров разбросанных носков",
      shortTitle: "Остров носков",
      toy: "bear",
      toyName: "Мишка",
      completeEyebrow: "Сон первый — пройден!",
      completeTitle: "Мишка вернулся домой!",
      completeText:
        "Какая дружная команда! Вы построили мостик, разбудили бабочку и помогли друг другу. Мишка снова с вами.",
      spawn: {
        ilya: { x: 125, y: GROUND - 94 },
        alisa: { x: 188, y: GROUND - 72 },
      },
      solids: [
        { x: 0, y: GROUND, w: 460, h: 120 },
        { x: 700, y: GROUND, w: 580, h: 120 },
        // Верх горы из носков — под ним можно пройти, как под мягким навесом.
        { x: 860, y: 355, w: 180, h: 115 },
        // Нижний уступ, с которого Алиса прыгает на вершину.
        { x: 820, y: 455, w: 40, h: 15 },
        // Шкаф-замок.
        { x: 1148, y: 292, w: 122, h: 308 },
      ],
      oneWays: [
        { x: 792, y: 455, w: 70, h: 12 },
      ],
      pushables: [
        { x: 372, y: 500, w: 110, h: 100, kind: "cube", locked: false, vel: 0 },
      ],
      fireflies: [
        { x: 332, y: 472, collected: false },
        { x: 584, y: 462, collected: false },
        { x: 816, y: 414, collected: false },
      ],
      intro: [
        {
          speaker: "mama",
          text: "В Стране Снов наступил вечер. Но где же любимый Мишка Илюши и Алисы? Без него сон не начнётся. Давайте поможем ребятам его найти!",
        },
        { speaker: "alisa", text: "Илюша, тут так темно... Я держусь за твою ленточку!" },
        { speaker: "ilya", text: "Не бойся, я рядом. Смотри, впереди что-то светится!" },
      ],
    });

    level.flags = {
      flashlight: false,
      bridged: false,
      riverTalked: false,
      crossed: false,
      butterfly: false,
      key: false,
      wardrobe: false,
      portal: false,
      doorHugged: false,
    };
    level.bridgeProgress = 0;
    level.wardrobeOpen = 0;
    level.doorOpen = 0;
    level.butterflyIntensity = 0;
    level.lightGrace = 0;
    level.platform = { x: 650, y: 520, w: 150, h: 13, oneWay: true, disabled: true };
    level.bridge = { x: 452, y: 586, w: 266, h: 12, oneWay: true, disabled: true };
    level.portalVisible = false;

    level.init = function (game) {
      game.ilya.hasFlashlight = false;
      game.ilya.flashlightOn = false;
      game.alisa.hasKey = false;
      game.ilya.dir = 1;
      game.alisa.dir = 1;
    };

    level.preUpdate = function (dt, game) {
      const ilya = game.ilya;
      const hand = {
        x: CX(ilya) + 25 * ilya.dir,
        y: BOTTOM(ilya) - 57,
      };
      const d = dist(hand.x, hand.y, 710, 302);
      const canLight = ilya.hasFlashlight && ilya.flashlightOn && d < 430;
      if (canLight) this.lightGrace = 1.05;
      else this.lightGrace = Math.max(0, this.lightGrace - dt);
      this.butterflyActive = this.lightGrace > 0;
      this.butterflyInBeam = canLight;
      this.butterflyIntensity = lerp(this.butterflyIntensity, canLight ? 1 : this.butterflyActive ? 0.5 : 0, 1 - Math.exp(-dt * 7));

      this.platform.disabled = !this.butterflyActive;
      const targetY = this.butterflyActive ? 522 + Math.sin(this.t * 1.7) * 7 : 498;
      this.platform.y = lerp(this.platform.y, targetY, 1 - Math.exp(-dt * 6));

      if (this.flags.bridged) this.bridgeProgress = Math.min(1, this.bridgeProgress + dt * 1.7);
      this.bridge.disabled = this.bridgeProgress < 0.6;

      this.wardrobeOpen = lerp(this.wardrobeOpen, this.flags.wardrobe ? 1 : 0, 1 - Math.exp(-dt * 4));
      this.doorOpen = lerp(this.doorOpen, this.flags.doorHugged ? 1 : 0, 1 - Math.exp(-dt * 3));
    };

    level.postUpdate = function (dt, game) {
      const ilya = game.ilya;
      const alisa = game.alisa;
      this.t += dt;

      // Фонарик.
      if (!this.flags.flashlight && nearPoint(ilya, 246, 560, 60)) {
        this.flags.flashlight = true;
        ilya.hasFlashlight = true;
        VO.Sound.pickup();
        game.burst(246, 552, {
          count: 26,
          colors: ["#ffe9a3", "#fff6cf", "#ffc76c"],
          speed: 180,
          gravity: -80,
          kind: "spark",
          life: 1.3,
          size: 3,
        });
        game.toast("Волшебный фонарик у Илюши! Зажмите Пробел, чтобы светить.", "✦", 4200);
        game.sayMany([
          {
            speaker: "ilya",
            text: "Ой, Алиса, смотри! Мой игрушечный фонарик светит как настоящий! Только свет у него... волшебный, с искорками!",
          },
          { speaker: "alisa", text: "Ух ты, здорово! Посвети вперёд, там темно, мне немножко боязно!" },
        ]);
      }

      // Первый взгляд на реку. Говорим один раз и только до мостика.
      if (
        this.flags.flashlight &&
        !this.flags.bridged &&
        !this.flags.riverTalked &&
        !this.once("river") &&
        (CX(ilya) > 390 || CX(alisa) > 390)
      ) {
        this.flags.riverTalked = true;
        game.sayMany([
          {
            speaker: "alisa",
            text: "Ой, Илюша, тут глубокая синяя река из одеяла! Мои ножки промокнут, я не умею плавать по одеялам!",
          },
          {
            speaker: "ilya",
            text: "Не бойся, Алиса! Я хоть и младше, но я сильный. Смотри, какой большой кубик. Сейчас я его подвину... Раз, два, взяли! Прыгай на кубик!",
          },
        ]);
      }

      // Кубик доехал до реки и превращается в мостик.
      if (!this.flags.bridged) {
        const cube = this.pushables[0];
        if (cube.x + cube.w / 2 >= 535) {
          cube.locked = true;
          cube.hidden = true;
          this.flags.bridged = true;
          this.flags.riverTalked = true;
          this.bridgeProgress = 0.001;
          this.bridge.disabled = true;
          VO.Sound.correct();
          game.burst(cube.x + cube.w / 2, cube.y + 25, {
            count: 38,
            colors: ["#ffd6df", "#ffe6b4", "#c8b7ff", "#fff6d0"],
            speed: 230,
            gravity: 120,
            kind: "star",
            life: 1.6,
            size: 3.5,
          });
          game.toast("Получился мягкий мостик! Можно переходить реку.", "✧", 3800);
          VO.Sound.stopSpeech();
          game.sayNow("alisa", "Ура, получился мостик! Спасибо, Илюша! Ты хоть и младше, но очень сильный.");
          game.addCameraKick?.(5);
        }
      }

      // Алиса перешла реку.
      if (!this.flags.crossed && this.flags.bridged && alisa.onGround && CX(alisa) > 716) {
        this.flags.crossed = true;
        game.sayMany([
          {
            speaker: "alisa",
            text: "Тут высоко, я не допрыгну до ключика! А на стене какая-то странная картинка с бабочкой...",
          },
          {
            speaker: "ilya",
            text: "Хм... А давай я посвечу на неё фонариком? Смотри, она зашевелила крылышками и стала мягкой полкой! Прыгай скорее, а я подержу свет!",
          },
        ]);
      }

      // Бабочка ожила.
      if (this.butterflyInBeam && !this.flags.butterfly) {
        this.flags.butterfly = true;
        VO.Sound.sparkle();
        game.burst(710, 302, {
          count: 34,
          colors: ["#ffe3a0", "#ffb8cd", "#c6b9ff", "#fff8d2"],
          speed: 170,
          gravity: -45,
          kind: "star",
          life: 1.8,
          size: 3.2,
        });
        game.toast("Бабочка проснулась! Светящаяся полка ждёт Алису.", "✧", 3800);
        game.say("alisa", "Ура! Полка светится! Я запрыгну, а ты, Илюша, не отпускай Пробел!");
      }

      // Ключ.
      if (!this.flags.key) {
        const keyRect = { x: 896, y: 294, w: 40, h: 48 };
        if (rectsOverlap(alisa, keyRect)) {
          this.flags.key = true;
          alisa.hasKey = true;
          VO.Sound.key();
          game.burst(916, 315, {
            count: 34,
            colors: ["#ffe08b", "#fff4c7", "#ffc65c"],
            speed: 200,
            gravity: -20,
            kind: "star",
            life: 1.5,
            size: 3.2,
          });
          game.toast("Ключик у Алисы! Теперь можно открыть шкаф-замок.", "✦", 3800);
          game.say("alisa", "Оп! Поймала ключик! Бегу открывать шкаф!");
        }
      }

      // Шкаф.
      if (
        this.flags.key &&
        !this.flags.wardrobe &&
        nearPoint(alisa, 1100, 535, 108) &&
        game.justPressed("Enter")
      ) {
        this.flags.wardrobe = true;
        this.flags.portal = true;
        this.portalVisible = true;
        alisa.hasKey = false;
        VO.Sound.door();
        game.burst(1120, 470, {
          count: 45,
          colors: ["#ffe6a4", "#fff5cc", "#ffc06d", "#c9b7ff"],
          speed: 220,
          gravity: 30,
          kind: "star",
          life: 2,
          size: 3.5,
        });
        game.toast("Шкаф-замок открылся! Мишка нашёлся, а в комнате появилась Волшебная Дверь.", "☁", 5000);
        game.say("mama", "Какая дружная команда! Вы нашли Мишку! Теперь обнимитесь, чтобы открыть дверь в следующий сон.");
      }

      // Лишний раз подсказываем про шкаф, если Алиса замешкалась.
      if (this.flags.key && !this.flags.wardrobe && !this.once("wardrobeHint") && this.t > 2) {
        game.toast("Алиса, подойди к шкафу-замку и нажми Enter.", "✦", 3600);
      }

      collectFireflies(this, game);

      if (this.flags.portal && !this.once("portalReady")) {
        game.toast("Волшебная Дверь Сна открыта! Встаньте рядом и зажмите Пробел + Enter.", "♡", 5200);
      }
    };

    level.actionContext = function (p, game) {
      if (p.kind !== "ilya" || !p.hasFlashlight) return null;
      const hand = { x: CX(p) + 25 * p.dir, y: BOTTOM(p) - 57 };
      if (dist(hand.x, hand.y, 710, 302) < 430) return "shine";
      return null;
    };

    level.isNearInteractable = function (p) {
      return p.kind === "alisa" && this.flags.key && !this.flags.wardrobe && nearPoint(p, 1100, 535, 108);
    };

    level.getObjective = function () {
      if (!this.flags.flashlight) return "Илюша, найди волшебный фонарик";
      if (!this.flags.bridged) return "Постройте мостик: Илюша толкает кубик к реке";
      if (!this.flags.key) return "Алиса — за ключиком, Илюша — свети на бабочку";
      if (!this.flags.wardrobe) return "Алиса, открой шкаф-замок ключиком";
      return "Встаньте рядом и зажмите Пробел + Enter";
    };

    level.getPortal = function () {
      if (!this.portalVisible) return null;
      return { cx: 1060, cy: 512, r: 122, x: 1000, y: 345, w: 120, h: 255 };
    };

    level.onDoorHug = function (game) {
      this.flags.doorHugged = true;
      VO.Sound.door();
      game.burst(1060, 450, {
        count: 70,
        colors: ["#ffe9aa", "#ffb9cd", "#c7b7ff", "#fff8d7"],
        speed: 250,
        gravity: 20,
        kind: "star",
        life: 2.2,
        size: 4,
      });
      game.say("both", "Ура! Время обнимашек!");
    };

    level.drawBack = function (ctx, t, game) {
      S.drawSockRoom(ctx, t);
      S.drawBlanketRiver(ctx, t);

      // Призрачный мостик-подсказка.
      if (!this.flags.bridged) {
        ctx.save();
        ctx.globalAlpha = 0.28 + 0.12 * Math.sin(t * 2);
        ctx.strokeStyle = "#ffe9b8";
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 7]);
        A.rr(ctx, 454, 580, 262, 18, 9);
        ctx.stroke();
        ctx.setLineDash([]);
        // Стрелка к цели.
        const cx = 575;
        ctx.beginPath();
        ctx.moveTo(cx - 10, 570);
        ctx.lineTo(cx + 10, 570);
        ctx.lineTo(cx, 580);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 233, 184, 0.6)";
        ctx.fill();
        ctx.restore();
      }

      S.drawBridge(ctx, this.bridgeProgress, t);
      S.drawSockMountain(ctx, t);

      // Мягкий проход под горой.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(862, 600);
      ctx.lineTo(862, 508);
      ctx.quadraticCurveTo(862, 474, 906, 470);
      ctx.lineTo(996, 470);
      ctx.quadraticCurveTo(1038, 476, 1038, 512);
      ctx.lineTo(1038, 600);
      ctx.closePath();
      const cave = ctx.createLinearGradient(0, 470, 0, 600);
      cave.addColorStop(0, "rgba(82, 54, 82, 0.9)");
      cave.addColorStop(0.55, "rgba(111, 70, 91, 0.86)");
      cave.addColorStop(1, "rgba(142, 94, 106, 0.8)");
      ctx.fillStyle = cave;
      ctx.fill();
      // Тёплый свет и подушечки внутри прохода.
      const warm = ctx.createLinearGradient(0, 600, 0, 500);
      warm.addColorStop(0, "rgba(255, 214, 160, 0.22)");
      warm.addColorStop(1, "rgba(255, 214, 160, 0)");
      ctx.fillStyle = warm;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 212, 196, 0.18)";
      ctx.lineWidth = 4;
      ctx.stroke();
      A.glow(ctx, 950, 585, 58, "rgba(255, 222, 150, 0.22)", 0.7);
      // Уютные искорки в глубине прохода.
      for (let i = 0; i < 5; i++) {
        A.sparkle(ctx, 900 + i * 27, 552 - (i % 2) * 22 + Math.sin(t * 1.3 + i) * 3, 1.8, "#ffe6b0", 0.35 + 0.2 * Math.sin(t * 2 + i), t + i);
      }
      ctx.strokeStyle = "rgba(255, 235, 211, 0.16)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(890, 590);
      ctx.quadraticCurveTo(950, 575, 1010, 592);
      ctx.stroke();
      // фестончики входа
      ctx.strokeStyle = "rgba(255, 227, 213, 0.3)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(868 + i * 21, 472);
        ctx.quadraticCurveTo(874 + i * 21, 486, 870 + i * 21, 496);
        ctx.stroke();
      }
      // Табличка у прохода.
      ctx.save();
      ctx.translate(952, 455);
      A.fillRR(ctx, -46, -12, 92, 23, 11, "rgba(255, 244, 222, 0.88)");
      ctx.fillStyle = "#8f6473";
      ctx.font = '700 9.5px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("мягкий проход", 0, 0);
      ctx.restore();
      ctx.restore();

      S.drawButterflyDrawing(ctx, t, this.butterflyActive, this.butterflyIntensity);
      S.drawButterflyPlatform(ctx, t, this.butterflyActive, this.platform.x + this.platform.w / 2, this.platform.y, this.butterflyIntensity);

      S.drawWardrobe(ctx, t, this.wardrobeOpen);
      S.drawMagicDoor(ctx, t, this.portalVisible ? 1 : 0, this.doorOpen);
      S.drawBearCloud(ctx, t, this.wardrobeOpen);
      S.drawSockKeySpot(ctx, t);

      // Ключ.
      if (!this.flags.key) {
        const bob = Math.sin(t * 2.1) * 4;
        A.drawKey(ctx, 916, 316 + bob, 1.15, -0.15, true);
        for (let i = 0; i < 3; i++) {
          A.sparkle(ctx, 916 + Math.cos(t + i * 2.1) * 28, 312 + Math.sin(t * 1.3 + i * 2.1) * 22, 2.2, "#fff0b1", 0.7, t + i);
        }
      }

      // Кубик.
      const cube = this.pushables[0];
      if (!this.flags.bridged) {
        A.drawPillowCube(ctx, cube.x, cube.y, cube.w, cube.h, t, {});
        // Мягкое свечение цели.
        ctx.save();
        ctx.globalAlpha = 0.32 + 0.14 * Math.sin(t * 2.2);
        A.glow(ctx, 580, 586, 52, "rgba(255, 226, 159, 0.55)", 0.7);
        ctx.restore();
      }

      // Фонарик.
      if (!this.flags.flashlight) {
        A.drawFlashlightItem(ctx, 246, 572, t);
      }

      drawFireflies(ctx, t, this.fireflies);
    };

    level.drawFront = function (ctx, t, game) {
      const celebrating = game.state === "celebrating" || game.state === "levelcomplete";
      const lights = [];
      lights.push({ x: CX(game.ilya) + 5, y: BOTTOM(game.ilya) - 52, r: 205 });
      lights.push({ x: CX(game.alisa), y: BOTTOM(game.alisa) - 42, r: 185 });
      if (this.flags.flashlight) {
        nightLights(ctx, lights, celebrating ? 0.02 : 0.1);
        A.glow(ctx, CX(game.ilya), BOTTOM(game.ilya) - 52, 70, "rgba(255, 228, 139, 0.18)", 0.55);
      } else {
        nightLights(ctx, lights, 0.46);
        A.glow(ctx, 246, 560, 58 + Math.sin(t * 2) * 7, "rgba(255, 229, 139, 0.55)", 0.7);
      }

      const ilya = game.ilya;
      if (ilya.flashlightOn && ilya.hasFlashlight) {
        const from = { x: CX(ilya) + 25 * ilya.dir, y: BOTTOM(ilya) - 57 };
        let to = null;
        if (this.butterflyInBeam) {
          to = { x: 710, y: 302 };
        } else {
          to = { x: from.x + 285 * ilya.dir, y: from.y - 35 };
        }
        drawLightBeam(ctx, from, to, this.butterflyInBeam ? 78 : 56, this.butterflyInBeam ? 0.62 : 0.3, t);
        A.glow(ctx, from.x, from.y, 24, "rgba(255, 245, 193, 0.75)", 0.8);
      }

      // Подсказки.
      if (!this.flags.flashlight) {
        drawPrompt(ctx, t, 246, 532, "Фонарик", ["WASD"], {
          accent: "#8a623e",
          keyColor: "#8a623e",
          sparkColor: "#ffe3a1",
        });
      } else if (!this.flags.bridged) {
        const cube = this.pushables[0];
        if (game.ilya && Math.abs(CX(game.ilya) - (cube.x + cube.w / 2)) < 210) {
          drawPrompt(ctx, t, cube.x + cube.w / 2, cube.y - 18, "Толкай кубик", ["D"], {
            accent: "#9a4f68",
            keyColor: "#9a4f68",
            sparkColor: "#ffc2d1",
          });
        }
      } else if (!this.flags.key && game.alisa && CX(game.alisa) > 690) {
        drawPrompt(ctx, t, 710, 250, "Держи Пробел — свети", ["Пробел"], {
          accent: "#8a623e",
          keyColor: "#8a623e",
          sparkColor: "#ffe3a1",
        });
      }

      if (
        this.butterflyActive &&
        !this.flags.key &&
        game.alisa &&
        CX(game.alisa) > 680 &&
        BOTTOM(game.alisa) > 475
      ) {
        drawPrompt(ctx, t, 725, 466, "Прыгай на полку", ["↑"], {
          accent: "#8a623e",
          keyColor: "#8a623e",
          sparkColor: "#ffe3a1",
        });
      }

      if (this.flags.key && !this.flags.wardrobe && nearPoint(game.alisa, 1100, 535, 128)) {
        drawPrompt(ctx, t, 1090, 430, "Открой шкаф", ["Enter"], {
          accent: "#8f5270",
          keyColor: "#8f5270",
          sparkColor: "#ffc1d2",
        });
      }

      const portal = this.getPortal();
      if (portal && !this.flags.doorHugged) {
        const near =
          Math.abs(CX(game.ilya) - portal.cx) < 165 ||
          Math.abs(CX(game.alisa) - portal.cx) < 150;
        if (near) {
          drawPrompt(ctx, t, portal.cx, 300, "Обнимитесь", ["Пробел", "Enter"], {
            accent: "#8b5674",
            keyColor: "#8b5674",
            sparkColor: "#ffc3d5",
            border: "rgba(255, 214, 197, 0.95)",
          });
        }
      }
    };

    return level;
  }

  // =======================================================================
  // СОН 2
  // =======================================================================

  function makeLego() {
    const bridge = { x: 378, y: 585, w: 244, h: 12, disabled: true };
    const trampoline = { x: 780, y: 470, w: 120, h: 14, disabled: true };
    const roof = { x: 900, y: 330, w: 361, h: 14 };

    const level = baseLevel({
      id: "lego",
      index: 1,
      title: "Остров потерянных деталек Лего",
      shortTitle: "Остров деталек",
      toy: "train",
      toyName: "Лего-поезд",
      completeEyebrow: "Сон второй — пройден!",
      completeTitle: "Поезд готов к отправлению!",
      completeText:
        "Колесо на месте! Илюша починил поезд, а Алиса своими мыльными пузырями помогла достать деталь и усыпила тучку. Пора обняться и ехать дальше.",
      spawn: {
        ilya: { x: 96, y: GROUND - 94 },
        alisa: { x: 160, y: GROUND - 72 },
      },
      solids: [
        { x: 0, y: GROUND, w: 380, h: 120 },
        { x: 620, y: GROUND, w: 660, h: 120 },
        // Корпус поезда — на его крышу можно забраться с розовой тучки.
        { x: 1015, y: 330, w: 246, h: 270 },
      ],
      oneWays: [bridge, trampoline, roof],
      pushables: [],
      fireflies: [
        { x: 300, y: 480, collected: false },
        { x: 430, y: 540, collected: false },
        { x: 650, y: 500, collected: false },
        { x: 900, y: 540, collected: false },
        { x: 1130, y: 275, collected: false },
      ],
      intro: [
        {
          speaker: "mama",
          text: "Ого, ребята попали на Остров деталек! Посмотрите, Лего-поезд не может отправиться в путь, потому что растерял свои части. Поможем ему?",
        },
        { speaker: "ilya", text: "Смотри, какой красивый поезд! Только у него не хватает колеса..." },
        { speaker: "alisa", text: "А вон у края блестит какая-то баночка! Я посмотрю!" },
      ],
    });

    level.bridge = bridge;
    level.trampoline = trampoline;

    level.flags = {
      jar: false,
      bridgeStarted: false,
      bridgeBuilt: false,
      cloudStarted: false,
      cloudWrapped: false,
      cloudTalked: false,
      wheel: false,
      repaired: false,
      doorHugged: false,
    };
    level.bridgeProgress = 0;
    level.doorProgress = 0;
    level.blowCharge = 0;
    level.cloudBlowCharge = 0;
    level.sleepCooldown = 0;
    level.portalVisible = false;

    level.allFireflies = function () {
      return this.fireflies.every((f) => f.collected);
    };

    level.bubble = {
      active: false,
      phase: "idle",
      t: 0,
      x: 0,
      y: 0,
      r: 0,
      beam: 0,
    };
    level.cloudBubble = {
      active: false,
      t: 0,
      x: 0,
      y: 0,
      r: 0,
      sx: 0,
      sy: 0,
    };
    level.cloud = {
      state: "sleepy",
      x: 820,
      y: 365,
      wrapT: 0,
      turnT: 0,
    };

    level.init = function (game) {
      game.ilya.hasFlashlight = true;
      game.ilya.flashlightOn = false;
      game.ilya.hasWheel = false;
      game.ilya.hasBubbles = false;
      game.alisa.hasBubbles = false;
      game.alisa.blowing = false;
      game.alisa.hasKey = false;
    };

    level.inBridgeSpot = function (p) {
      return p.onGround && CX(p) > 300 && CX(p) < 374 && BOTTOM(p) > 570;
    };
    level.inCloudSpot = function (p) {
      return p.onGround && CX(p) > 632 && CX(p) < 692 && BOTTOM(p) > 570;
    };
    level.nearTrain = function (p) {
      return nearPoint(p, 1000, 535, 108);
    };

    level.startBridgeBubble = function (game) {
      const a = game.alisa;
      this.flags.bridgeStarted = true;
      this.blowCharge = 0;
      const b = this.bubble;
      b.active = true;
      b.phase = "descend";
      b.t = 0;
      b.sx = CX(a) + 22;
      b.sy = BOTTOM(a) - 56;
      b.x = b.sx;
      b.y = b.sy;
      b.r = 5;
      b.beam = 0;
      a.blowing = true;
      VO.Sound.bubble();
      game.toast("Пузырь полетел в ямку за синим кубиком!", "◌", 3800);
      game.sayMany([
        { speaker: "alisa", text: "Смотри, пузырь опускается прямо к синей детальке!" },
        { speaker: "ilya", text: "Ух ты! А давай проверим, смогут ли они поднять её для моста?" },
      ]);
    };

    level.startCloudBubble = function (game) {
      const a = game.alisa;
      this.flags.cloudStarted = true;
      this.cloudBlowCharge = 0;
      const b = this.cloudBubble;
      b.active = true;
      b.t = 0;
      b.sx = CX(a) + 20;
      b.sy = BOTTOM(a) - 58;
      b.x = b.sx;
      b.y = b.sy;
      b.r = 5;
      a.blowing = true;
      VO.Sound.bubble();
      game.toast("Пузырь полетел к тучке-Сплюшке!", "◌", 3600);
      game.say("alisa", "Сейчас я поймаю эту тучку в мыльный замок! Хлоп!");
    };

    level.popBridgeBubble = function (game) {
      if (this.flags.bridgeBuilt) return;
      this.flags.bridgeBuilt = true;
      this.bubble.phase = "pop";
      this.bubble.t = 0;
      this.bridgeProgress = 0.001;
      this.bridge.disabled = true;
      VO.Sound.soapPop();
      game.addCameraKick?.(7);
      game.burst(500, 548, {
        count: 46,
        colors: ["#e9fbff", "#bdefff", "#ffd4e8", "#fff0b8", "#c8c3ff"],
        speed: 230,
        gravity: 80,
        kind: "star",
        life: 1.4,
        size: 3.4,
      });
      game.burst(500, 585, {
        count: 26,
        colors: ["#7fc5ff", "#a9dcff", "#fff0c2"],
        speed: 150,
        gravity: 90,
        kind: "dot",
        life: 1.1,
        size: 4,
      });
      game.toast("Плип! Синий кубик встал точно на место — мост готов!", "◌", 4200);
      game.sayNow("alisa", "Ура! Точно в цель! Ты прямо как настоящий строитель!");
    };

    level.finishCloud = function (game) {
      this.cloud.state = "trampoline";
      this.cloud.x = 840;
      this.cloud.y = 476;
      this.cloudBubble.active = false;
      this.trampoline.disabled = false;
      VO.Sound.boing();
      game.burst(840, 455, {
        count: 38,
        colors: ["#ffd6e3", "#ffe9b4", "#d2f6ff", "#fff7dc"],
        speed: 180,
        gravity: -20,
        kind: "star",
        life: 1.5,
        size: 3.2,
      });
      game.toast("Тучка стала розовой и мягкой! Илюша, прыгай на неё!", "☁", 4600);
      game.say(
        "ilya",
        "Ого, она теперь похожа на розовую сахарную вату! Смотри, она стала такой мягкой, что на неё можно прыгнуть. Оп-ля!"
      );
    };

    level.preUpdate = function (dt, game) {
      this.t += dt;
      this.sleepCooldown = Math.max(0, this.sleepCooldown - dt);
      game.alisa.blowing = this.blowCharge > 0.01 || this.cloudBlowCharge > 0.01;

      // Пузырь с синим кубиком.
      const b = this.bubble;
      if (b.active) {
        if (b.phase === "descend") {
          b.t += dt;
          const p = Math.min(1, b.t / 0.85);
          b.x = A.lerp(b.sx, 500, A.easeInOut(p));
          b.y = A.lerp(b.sy, 690, A.easeInOut(p));
          b.r = A.lerp(5, 118, A.easeOut(p));
          if (p >= 1) {
            b.phase = "lift";
            b.t = 0;
            VO.Sound.bubble();
            game.toast("Пузырь подхватил синий кубик и поднимает его!", "◌", 3800);
            game.say("alisa", "Ой-ой, деталька улетает слишком высоко в небо! Илюша, сделай что-нибудь!");
          }
        } else if (b.phase === "lift") {
          b.t += dt;
          const p = Math.min(1, b.t / 1.15);
          b.x = 500;
          b.y = A.lerp(690, 550, A.easeInOut(p));
          b.r = 118;
          if (p >= 1) {
            b.phase = "hover";
            b.t = 0;
            game.toast("Пузырь на уровне моста! Илюша, свети на него фонариком.", "✦", 4200);
            game.say("ilya", "Сейчас я её поймаю... Точнее, лопну пузырь моим фонариком! Направляю луч... Ловись, кубик!");
          }
        } else if (b.phase === "hover") {
          b.t += dt;
          b.x = 500;
          b.y = 550 + Math.sin(this.t * 2.2) * 4;
          b.r = 118 + Math.sin(this.t * 3) * 1.5;
        } else if (b.phase === "pop") {
          b.t += dt;
          b.r = 118 + b.t * 145;
          if (b.t > 0.55) b.active = false;
        }
      }

      // Мост.
      if (this.flags.bridgeBuilt) {
        this.bridgeProgress = Math.min(1, this.bridgeProgress + dt * 1.65);
      }
      this.bridge.disabled = this.bridgeProgress < 0.6;

      // Мыльный пузырь с тучкой.
      const cb = this.cloudBubble;
      if (cb.active) {
        if (this.cloud.state === "sleepy") {
          cb.t += dt;
          const p = Math.min(1, cb.t / 0.85);
          cb.x = A.lerp(cb.sx, this.cloud.x, A.easeInOut(p));
          cb.y = A.lerp(cb.sy, this.cloud.y, A.easeInOut(p));
          cb.r = A.lerp(5, 98, A.easeOut(p));
          if (p >= 1) {
            this.cloud.state = "wrapped";
            this.cloud.wrapT = 0;
            this.flags.cloudWrapped = true;
            VO.Sound.soapPop();
            game.burst(this.cloud.x, this.cloud.y, {
              count: 28,
              colors: ["#e9fbff", "#ffd8e5", "#fff1bd", "#d6efff"],
              speed: 170,
              gravity: -30,
              kind: "star",
              life: 1.2,
              size: 3,
            });
            game.say("alisa", "Хлоп! Тучка внутри пузыря! Она больше не зевает.");
          }
        } else if (this.cloud.state === "wrapped") {
          this.cloud.wrapT += dt;
          cb.x = this.cloud.x;
          cb.y = this.cloud.y;
          cb.r = 98 + Math.sin(this.t * 3) * 2;
          if (this.cloud.wrapT > 1.2) {
            this.cloud.state = "turning";
            this.cloud.turnT = 0;
          }
        } else if (this.cloud.state === "turning") {
          this.cloud.turnT += dt;
          const p = Math.min(1, this.cloud.turnT / 1.5);
          this.cloud.x = A.lerp(820, 840, A.easeInOut(p));
          this.cloud.y = A.lerp(365, 476, A.easeInOut(p));
          cb.x = this.cloud.x;
          cb.y = this.cloud.y;
          cb.r = A.lerp(98, 68, p);
          if (p >= 1) this.finishCloud(game);
        }
      } else if (this.cloud.state === "sleepy") {
        this.cloud.x = 820 + Math.sin(this.t * 0.75) * 14;
        this.cloud.y = 365 + Math.sin(this.t * 1.25) * 6;
      } else if (this.cloud.state === "trampoline") {
        this.cloud.x = 840 + Math.sin(this.t * 1.4) * 2;
        this.cloud.y = 476 + Math.sin(this.t * 2.2) * 1.5;
      }

      this.trampoline.disabled = this.cloud.state !== "trampoline";
      this.doorProgress = A.lerp(this.doorProgress, this.flags.repaired ? 1 : 0, 1 - Math.exp(-dt * 4));
    };

    level.postUpdate = function (dt, game) {
      const ilya = game.ilya;
      const alisa = game.alisa;

      // Баночка с пузырями.
      if (!this.flags.jar && nearPoint(alisa, 270, 560, 62)) {
        this.flags.jar = true;
        alisa.hasBubbles = true;
        VO.Sound.plastic();
        game.burst(270, 548, {
          count: 30,
          colors: ["#e6fbff", "#ffd6e5", "#fff2bb", "#c6f0ff"],
          speed: 150,
          gravity: -25,
          kind: "star",
          life: 1.4,
          size: 3,
        });
        game.toast("У Алисы баночка с волшебными мыльными пузырями!", "◌", 4400);
        game.sayMany([
          {
            speaker: "alisa",
            text: "Илюша, смотри, что у меня есть! Мыльные пузыри! Если я дую, они получаются огромными-преогромными!",
          },
          {
            speaker: "ilya",
            text: "Ух ты! А давай проверим, смогут ли они поднять вон ту синюю детальку для моста? Она упала в ямку!",
          },
        ]);
      }

      // Знакомство с тучкой. Говорим один раз и двумя короткими репликами.
      if (
        this.flags.bridgeBuilt &&
        this.cloud.state === "sleepy" &&
        !this.flags.cloudTalked &&
        !this.once("cloudIntro") &&
        (CX(ilya) > 620 || CX(alisa) > 620)
      ) {
        this.flags.cloudTalked = true;
        VO.Sound.stopSpeech();
        game.sayNow("ilya", "Ой, Алиса, стой! Там летает тучка-Сплюшка.");
        game.say("ilya", "Она так зевает, что у меня уже глаза закрываются.");
      }

      const inBridge = this.inBridgeSpot(alisa);
      const inCloud = this.inCloudSpot(alisa);

      // Заряд пузыря для моста.
      if (
        this.flags.jar &&
        !this.flags.bridgeStarted &&
        !this.bubble.active &&
        inBridge &&
        game.isDown("Enter")
      ) {
        this.blowCharge = Math.min(0.7, this.blowCharge + dt);
        if (this.blowCharge >= 0.35) this.startBridgeBubble(game);
      } else {
        this.blowCharge = Math.max(0, this.blowCharge - dt * 2);
      }

      // Заряд пузыря для тучки.
      if (
        this.flags.jar &&
        this.flags.bridgeBuilt &&
        !this.flags.cloudStarted &&
        this.cloud.state === "sleepy" &&
        inCloud &&
        game.isDown("Enter")
      ) {
        this.cloudBlowCharge = Math.min(0.7, this.cloudBlowCharge + dt);
        if (this.cloudBlowCharge >= 0.35) this.startCloudBubble(game);
      } else {
        this.cloudBlowCharge = Math.max(0, this.cloudBlowCharge - dt * 2);
      }

      // Луч фонарика лопает пузырь.
      if (this.bubble.active && this.bubble.phase === "hover") {
        const hand = { x: CX(ilya) + 25 * ilya.dir, y: BOTTOM(ilya) - 57 };
        const inRange = dist(hand.x, hand.y, this.bubble.x, this.bubble.y) < 540;
        if (ilya.flashlightOn && inRange) {
          this.bubble.beam = Math.min(1, this.bubble.beam + dt);
          if (this.bubble.beam > 0.35) this.popBridgeBubble(game);
        } else {
          this.bubble.beam = Math.max(0, this.bubble.beam - dt * 1.6);
        }
      }

      // Сонная тучка не пускает дальше, пока её не поймали.
      if (this.cloud.state !== "trampoline") {
        for (const p of [ilya, alisa]) {
          if (p.rescue > 0) continue;
          if (p.x + p.w > 724 && p.x < 900) {
            p.x = 724 - p.w;
            p.vx = -190;
            p.dir = -1;
            if (this.sleepCooldown <= 0) {
              this.sleepCooldown = 3;
              VO.Sound.sleepy();
              game.burst(p.x + p.w / 2 + 20, p.y + 40, {
                count: 8,
                colors: ["#d8dcf3", "#f4e7ff", "#c9d7ff"],
                speed: 45,
                gravity: -18,
                kind: "dot",
                life: 1.2,
                size: 4,
              });
              if (this.once("sleepy")) {
                game.say(
                  "alisa",
                  "Не засыпай, Илюша! Нам нельзя спать посреди дороги! Я сейчас поймаю эту тучку в мыльный замок!"
                );
              }
              game.toast("Тучка-Сплюшка зевает — дальше не пройти. Алиса, поймай её в пузырь!", "z", 3800);
            }
          }
        }
      }

      // Тучка-батут.
      if (this.cloud.state === "trampoline") {
        for (const p of [ilya, alisa]) {
          if (p.onGround && p.groundPlatform === this.trampoline) {
            p.vy = -1070;
            p.onGround = false;
            p.groundPlatform = null;
            p.jumping = false;
            VO.Sound.boing();
            game.burst(p.x + p.w / 2, p.y + p.h, {
              count: 13,
              colors: ["#ffe2eb", "#fff1c0", "#c9f4ff"],
              speed: 100,
              gravity: 25,
              kind: "dot",
              life: 0.8,
              size: 3,
            });
            if (this.once("bounce")) {
              game.say("ilya", "Оп-ля!");
              game.toast("Держи D и лети к крыше поезда за колесом!", "↑", 3800);
            }
          }
        }
      }

      // Колесо на крыше.
      if (
        !this.flags.wheel &&
        ilya.onGround &&
        BOTTOM(ilya) <= 345 &&
        Math.abs(CX(ilya) - 1132) < 82
      ) {
        this.flags.wheel = true;
        ilya.hasWheel = true;
        VO.Sound.plastic();
        VO.Sound.pickup();
        game.burst(1132, 288, {
          count: 34,
          colors: ["#ffe08b", "#fff4c7", "#ffc65c", "#d6efff"],
          speed: 180,
          gravity: -10,
          kind: "star",
          life: 1.5,
          size: 3.2,
        });
        game.toast("Колесо от поезда у Илюши! Спускайся и почини поезд.", "◉", 4200);
        game.sayNow("ilya", "Я достал колесо от поезда!");
      }

      // Починка поезда.
      if (
        this.flags.wheel &&
        !this.flags.repaired &&
        this.nearTrain(ilya) &&
        game.justPressed("Space")
      ) {
        this.flags.repaired = true;
        this.flags.doorHugged = false;
        this.portalVisible = false;
        ilya.hasWheel = false;
        this.doorProgress = 0;
        VO.Sound.toot();
        game.addCameraKick?.(5);
        game.burst(1080, 286, {
          count: 48,
          colors: ["#fff0b0", "#ffd7e4", "#c6f4ff", "#fff8df"],
          speed: 220,
          gravity: -10,
          kind: "star",
          life: 1.8,
          size: 3.6,
        });
        // След Волшебной Двери, летящей от трубы к месту у поезда.
        for (const [bx, by] of [[1010, 375], [880, 415], [760, 460]]) {
          game.burst(bx, by, {
            count: 16,
            colors: ["#fff4c4", "#ffd9e7", "#d4f4ff"],
            speed: 90,
            gravity: -18,
            kind: "star",
            life: 1.3,
            size: 2.7,
          });
        }
        game.toast("Ту-ту! Поезд починен. Но Дверь откроется, когда вы соберёте всех светлячков.", "☁", 5000);
        game.sayNow(
          "mama",
          "Поезд готов! Осталось собрать всех светлячков — и Волшебная Дверь проснётся."
        );
      }

      collectFireflies(this, game);

      if (this.flags.repaired && this.allFireflies() && !this.portalVisible) {
        this.portalVisible = true;
        this.doorProgress = 0;
        VO.Sound.door();
        game.burst(710, 420, {
          count: 38,
          colors: ["#fff0b0", "#ffd7e4", "#c6f4ff", "#fff8df"],
          speed: 150,
          gravity: -20,
          kind: "star",
          life: 1.6,
          size: 3.2,
        });
        game.toast("Все светлячки собраны! Волшебная Дверь открылась.", "✦", 4600);
        game.sayNow("mama", "Все светлячки собраны! Волшебная Дверь открыта — обнимитесь и отправляйтесь дальше.");
      }

      if (this.flags.repaired && this.portalVisible && !this.once("portalHint")) {
        game.toast("Волшебная Дверь ждёт у поезда. Встаньте рядом и зажмите Пробел + Enter.", "♡", 5000);
      }
    };

    level.actionContext = function (p, game) {
      if (p.kind === "alisa") {
        if (
          this.flags.jar &&
          !this.flags.bridgeStarted &&
          !this.flags.bridgeBuilt &&
          this.inBridgeSpot(p)
        ) {
          return "blow";
        }
        if (
          this.flags.jar &&
          this.flags.bridgeBuilt &&
          !this.flags.cloudStarted &&
          this.cloud.state === "sleepy" &&
          this.inCloudSpot(p)
        ) {
          return "blow";
        }
      }
      if (p.kind === "ilya") {
        if (
          this.bubble.active &&
          (this.bubble.phase === "descend" || this.bubble.phase === "lift" || this.bubble.phase === "hover")
        ) {
          const hand = { x: CX(p) + 25 * p.dir, y: BOTTOM(p) - 57 };
          if (dist(hand.x, hand.y, this.bubble.x, this.bubble.y) < 540) return "shine";
        }
        if (this.flags.wheel && !this.flags.repaired && this.nearTrain(p)) return "repair";
      }
      return null;
    };

    level.isNearInteractable = function (p) {
      if (p.kind === "alisa" && this.flags.jar && this.inBridgeSpot(p)) return true;
      if (p.kind === "alisa" && this.flags.jar && this.inCloudSpot(p) && this.cloud.state === "sleepy") return true;
      if (p.kind === "ilya" && this.flags.wheel && !this.flags.repaired && this.nearTrain(p)) return true;
      return false;
    };

    level.getObjective = function () {
      if (!this.flags.jar) return "Алиса, найди баночку с мыльными пузырями";
      if (!this.flags.bridgeBuilt) {
        if (this.bubble.active && this.bubble.phase === "hover") return "Илюша, свети фонариком на пузырь (Пробел)";
        if (this.flags.bridgeStarted) return "Пузырь поднимает синий кубик…";
        return "Алиса, зажми Enter и выдуй пузырь под синим кубиком";
      }
      if (this.cloud.state === "sleepy" || this.cloud.state === "wrapped" || this.cloud.state === "turning") {
        if (this.flags.cloudStarted) return "Пузырь поймал тучку — она становится мягкой…";
        return "Алиса, поймай тучку-Сплюшку в пузырь";
      }
      if (!this.flags.wheel) return "Илюша, прыгай на розовую тучку и достань колесо";
      if (!this.flags.repaired) return "Илюша, почини поезд у кабины (Пробел)";
      if (!this.allFireflies()) {
        const got = this.fireflies.filter((f) => f.collected).length;
        return `Соберите всех светлячков: ${got}/${this.fireflies.length}`;
      }
      return "Обнимитесь у Волшебной Двери: Пробел + Enter";
    };

    level.getPortal = function () {
      if (!this.portalVisible) return null;
      return { cx: 710, cy: 500, r: 122, x: 650, y: 345, w: 120, h: 255 };
    };

    level.onDoorHug = function (game) {
      this.flags.doorHugged = true;
      VO.Sound.door();
      VO.Sound.soapPop();
      game.addCameraKick?.(7);
      game.burst(710, 450, {
        count: 72,
        colors: ["#e9fbff", "#ffd4e8", "#fff0b8", "#c9f0ff", "#fff8df"],
        speed: 250,
        gravity: 20,
        kind: "star",
        life: 2.2,
        size: 4,
      });
      for (let i = 0; i < 8; i++) {
        game.burst(710 + (Math.random() - 0.5) * 100, 380 + Math.random() * 80, {
          count: 5,
          colors: ["#ffffff", "#c8f4ff", "#ffd6e8"],
          speed: 100,
          gravity: -40,
          kind: "dot",
          life: 1.6,
          size: 5,
        });
      }
      game.say("both", "Время обнимашек! Поехали в следующий сон!");
    };

    level.drawBack = function (ctx, t, game) {
      S.drawLegoIsland(ctx, t);
      S.drawLegoChasm(ctx, t, !this.bubble.active && !this.flags.bridgeBuilt);

      if (!this.flags.bridgeBuilt) {
        // Призрачный мост-подсказка.
        ctx.save();
        ctx.globalAlpha = 0.45 + 0.18 * Math.sin(t * 2);
        ctx.strokeStyle = "#fff1bd";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 7]);
        A.rr(ctx, 380, 580, 240, 18, 8);
        ctx.stroke();
        ctx.setLineDash([]);
        const cx = 500;
        ctx.beginPath();
        ctx.moveTo(cx - 10, 568);
        ctx.lineTo(cx + 10, 568);
        ctx.lineTo(cx, 578);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 241, 189, 0.7)";
        ctx.fill();
        ctx.restore();
      }

      S.drawLegoBridge(ctx, t, this.bridgeProgress);
      S.drawLegoTrain(ctx, t, {
        repaired: this.flags.repaired,
        wheelOnRoof: !this.flags.wheel,
      });
      S.drawSleepyCloud(ctx, t, this.cloud, this.cloud.state === "wrapped" || this.cloud.state === "turning");
      S.drawLegoDoor(ctx, t, this.portalVisible ? 1 : 0, this.doorProgress);
      if (!this.flags.jar) S.drawBubbleJar(ctx, 270, 570, t);

      drawFireflies(ctx, t, this.fireflies);
    };

    level.drawFront = function (ctx, t, game) {
      const ilya = game.ilya;
      const alisa = game.alisa;

      // Сонная дымка перед тучкой.
      if (this.cloud.state !== "trampoline") {
        ctx.save();
        const mist = ctx.createLinearGradient(690, 0, 910, 0);
        mist.addColorStop(0, "rgba(178, 195, 235, 0)");
        mist.addColorStop(0.45, "rgba(178, 195, 235, 0.18)");
        mist.addColorStop(1, "rgba(178, 195, 235, 0)");
        ctx.fillStyle = mist;
        ctx.fillRect(690, 250, 230, 380);
        const lowMist = ctx.createLinearGradient(0, 470, 0, 600);
        lowMist.addColorStop(0, "rgba(198, 211, 246, 0)");
        lowMist.addColorStop(1, "rgba(198, 211, 246, 0.18)");
        ctx.fillStyle = lowMist;
        ctx.fillRect(700, 470, 200, 130);
        ctx.fillStyle = "rgba(116, 125, 168, 0.35)";
        ctx.font = '700 13px "Comic Sans MS", "Segoe UI", sans-serif';
        for (let i = 0; i < 3; i++) {
          const a = 0.25 + 0.2 * Math.sin(t * 1.5 + i);
          ctx.globalAlpha = a;
          ctx.fillText("z", 790 + i * 24, 430 - ((t * 10 + i * 22) % 55));
        }
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 4; i++) {
          A.sparkle(ctx, 716 + i * 42, 520 + Math.sin(t * 1.4 + i) * 14, 2, "#e7e0ff", 0.45, t + i);
        }
        ctx.restore();
      }

      // Фонарик Илюши.
      if (ilya.flashlightOn && ilya.hasFlashlight) {
        const from = { x: CX(ilya) + 25 * ilya.dir, y: BOTTOM(ilya) - 57 };
        let target = null;
        if (this.bubble.active && this.bubble.phase !== "pop") {
          target = { x: this.bubble.x, y: this.bubble.y };
        } else {
          target = { x: from.x + 270 * ilya.dir, y: from.y - 30 };
        }
        drawLightBeam(ctx, from, target, this.bubble.active ? 70 : 50, this.bubble.active ? 0.58 : 0.26, t);
        A.glow(ctx, from.x, from.y, 22, "rgba(255, 246, 195, 0.8)", 0.8);
      }

      // Пузырь с кубиком.
      const b = this.bubble;
      if (b.active) {
        const alpha = b.phase === "pop" ? Math.max(0, 1 - b.t / 0.55) : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        S.drawSoapBubble(ctx, b.x, b.y, b.r, t, 0);
        if (b.phase !== "pop") {
          ctx.save();
          A.glow(ctx, 500, b.y + 27, 80, "rgba(131, 216, 255, 0.26)", 0.7);
          S.legoBrick(ctx, 400, b.y + 14, 200, 26, S.LEGO.blue, 6);
          ctx.restore();
        }
        if (b.phase === "hover") {
          const pulse = 0.5 + 0.5 * Math.sin(t * 5);
          ctx.strokeStyle = `rgba(255, 244, 190, ${0.35 + pulse * 0.4})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 6]);
          ctx.lineDashOffset = -t * 18;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r + 12, 0, TAU);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }

      // Летящий пузырь к тучке.
      if (this.cloudBubble.active && this.cloud.state === "sleepy") {
        S.drawSoapBubble(ctx, this.cloudBubble.x, this.cloudBubble.y, this.cloudBubble.r, t, 2);
      }

      // Подсказки.
      if (!this.flags.jar && alisa && CX(alisa) < 420) {
        drawPrompt(ctx, t, 270, 520, "Баночка с пузырями", [], {
          accent: "#7a5f95",
          keyColor: "#7a5f95",
          sparkColor: "#d7f6ff",
        });
      }

      if (this.flags.jar && !this.flags.bridgeBuilt && !this.flags.bridgeStarted && this.inBridgeSpot(alisa)) {
        drawPrompt(ctx, t, 345, 500, "Зажми Enter — пузырь", ["Enter"], {
          accent: "#5e7fa8",
          keyColor: "#5e7fa8",
          sparkColor: "#c5f1ff",
        });
      }

      if (this.bubble.active && this.bubble.phase === "hover") {
        drawPrompt(ctx, t, 500, 450, "Свети на пузырь", ["Пробел"], {
          accent: "#9a6a3e",
          keyColor: "#9a6a3e",
          sparkColor: "#ffe6a6",
        });
      }

      if (this.cloud.state === "sleepy" && this.flags.bridgeBuilt && !this.flags.cloudStarted && this.inCloudSpot(alisa)) {
        drawPrompt(ctx, t, 665, 500, "Поймай тучку", ["Enter"], {
          accent: "#6f5f95",
          keyColor: "#6f5f95",
          sparkColor: "#e3d6ff",
        });
      }

      if (this.cloud.state === "trampoline" && !this.flags.wheel) {
        drawPrompt(ctx, t, 840, 410, "Прыгай на тучку", ["↑"], {
          accent: "#9a5e7d",
          keyColor: "#9a5e7d",
          sparkColor: "#ffd9e7",
        });
      }

      if (this.flags.wheel && !this.flags.repaired && this.nearTrain(ilya)) {
        drawPrompt(ctx, t, 1000, 465, "Починить поезд", ["Пробел"], {
          accent: "#9b763b",
          keyColor: "#9b763b",
          sparkColor: "#ffe4a2",
        });
      }

      const portal = this.getPortal();
      if (portal && !this.flags.doorHugged) {
        const near =
          Math.abs(CX(ilya) - portal.cx) < 155 ||
          Math.abs(CX(alisa) - portal.cx) < 145;
        if (near) {
          drawPrompt(ctx, t, portal.cx, 315, "Обнимитесь", ["Пробел", "Enter"], {
            accent: "#7c5f8e",
            keyColor: "#7c5f8e",
            sparkColor: "#ffd8e7",
          });
        }
      }
    };

    return level;
  }


  // =======================================================================
  // СОН 3
  // =======================================================================

  const PAD_DEFS = [
    { x: 290, shape: "circle", color: "red", w: 108 },
    { x: 470, shape: "star", color: "blue", w: 108 },
    { x: 650, shape: "triangle", color: "yellow", w: 108 },
    { x: 830, shape: "square", color: "green", w: 108 },
    { x: 1010, shape: "heart", color: "purple", w: 108 },
    { x: 1175, shape: "diamond", color: "orange", w: 108 },
  ];

  const ROUNDS = [
    [
      { shape: "circle", color: "red" },
      { shape: "star", color: "blue" },
    ],
    [
      { shape: "square", color: "green" },
      { shape: "triangle", color: "yellow" },
    ],
    [
      { shape: "heart", color: "purple" },
      { shape: "diamond", color: "orange" },
    ],
  ];

  const COLOR_FORMS = {
    red: { m: "красный", f: "красная", n: "красное" },
    yellow: { m: "жёлтый", f: "жёлтая", n: "жёлтое" },
    blue: { m: "синий", f: "синяя", n: "синее" },
    green: { m: "зелёный", f: "зелёная", n: "зелёное" },
    purple: { m: "фиолетовый", f: "фиолетовая", n: "фиолетовое" },
    orange: { m: "оранжевый", f: "оранжевая", n: "оранжевое" },
  };
  const SHAPE_GENDER = {
    circle: "m",
    triangle: "m",
    square: "m",
    star: "f",
    heart: "n",
    diamond: "m",
  };

  function describeSpec(spec) {
    const gender = SHAPE_GENDER[spec.shape] || "m";
    const color = COLOR_FORMS[spec.color] ? COLOR_FORMS[spec.color][gender] : S.shapeColorRus[spec.color];
    return `${color} ${S.shapeRus[spec.shape]}`;
  }

  function makeBooks() {
    const level = baseLevel({
      id: "books",
      index: 2,
      title: "Лес книжных страниц",
      shortTitle: "Лес страниц",
      toy: "elephant",
      toyName: "Слонёнок",
      completeEyebrow: "Сон третий — пройден!",
      completeTitle: "Слонёнок нашёлся!",
      completeText:
        "Вы прочитали книгу снов, нашли все фигуры и обнялись. Слонёнок снова с вами, а впереди — последний, самый цветной сон.",
      spawn: {
        ilya: { x: 105, y: GROUND - 94 },
        alisa: { x: 165, y: GROUND - 72 },
      },
      solids: [{ x: 0, y: GROUND, w: 1280, h: 120 }],
      oneWays: [],
      pushables: [],
      fireflies: [
        { x: 366, y: 492, collected: false },
        { x: 756, y: 462, collected: false },
        { x: 1080, y: 462, collected: false },
      ],
      intro: [
        {
          speaker: "mama",
          text: "Третий сон — Лес книжных страниц. Чтобы найти Слонёнка, прочитайте книгу снов и встаньте на нужные фигуры.",
        },
        { speaker: "ilya", text: "Тут написано: красный круг. Это для меня!" },
        { speaker: "alisa", text: "А для меня — синяя звезда! Смотрите, какая красивая." },
      ],
    });

    level.solved = 0;
    level.roundIndex = 0;
    level.transition = 0;
    level.dwell = 0;
    level.portalVisible = false;
    level.flags = { doorHugged: false };
    level.pads = PAD_DEFS.map((p) => ({ ...p, y: GROUND }));
    level.wrongDwell = 0;
    level.lastWrong = -10;
    level.lastWrongPad = null;
    level.announcedRound = -1;

    level.init = function (game) {
      game.ilya.hasFlashlight = false;
      game.ilya.flashlightOn = false;
      game.alisa.hasKey = false;
    };

    level.currentSpecs = function () {
      return ROUNDS[Math.min(this.roundIndex, ROUNDS.length - 1)];
    };

    level.targetFor = function (playerKind) {
      const specs = this.currentSpecs();
      return playerKind === "ilya" ? specs[0] : specs[1];
    };

    level.padUnder = function (p) {
      if (!p.onGround) return null;
      const cx = CX(p);
      for (const pad of this.pads) {
        if (Math.abs(cx - pad.x) < pad.w / 2 + 2) return pad;
      }
      return null;
    };

    level.isCorrectPad = function (p, pad) {
      if (!pad) return false;
      const target = this.targetFor(p.kind);
      return target && pad.shape === target.shape && pad.color === target.color;
    };

    level.preUpdate = function (dt) {
      if (this.transition > 0) {
        this.transition -= dt;
        if (this.transition <= 0) {
          if (this.solved >= 3) {
            this.portalVisible = true;
          } else {
            this.roundIndex = this.solved;
            this.dwell = 0;
            this.announceRoundSoon = true;
          }
        }
      }
      this.portalVisible = this.portalVisible || this.solved >= 3;
    };

    level.postUpdate = function (dt, game) {
      this.t += dt;
      const ilya = game.ilya;
      const alisa = game.alisa;

      // Подсказки-названия следующей страницы.
      if (this.announceRoundSoon && this.transition <= 0) {
        this.announceRoundSoon = false;
        const specs = this.currentSpecs();
        game.say(
          "mama",
          `Страница ${this.solved + 1} из 3. Илюша — ${describeSpec(specs[0])}, Алиса — ${describeSpec(specs[1])}.`
        );
      }

      collectFireflies(this, game);

      if (this.solved >= 3) {
        if (!this.once("allDone")) {
          game.toast("Все страницы прочитаны! Слонёнок нашёлся, а Дверь Сна открылась.", "✦", 5000);
        }
        return;
      }

      const ilyaPad = this.padUnder(ilya);
      const alisaPad = this.padUnder(alisa);
      const ilyaOk = this.isCorrectPad(ilya, ilyaPad);
      const alisaOk = this.isCorrectPad(alisa, alisaPad);

      // Мягкая подсказка, если выбран не тот коврик.
      let wrongPad = null;
      let wrongPlayer = null;
      if (ilyaPad && !ilyaOk) {
        wrongPad = ilyaPad;
        wrongPlayer = "ilya";
      } else if (alisaPad && !alisaOk) {
        wrongPad = alisaPad;
        wrongPlayer = "alisa";
      }
      if (wrongPad && this.transition <= 0) {
        if (this.lastWrongPad !== wrongPad) {
          this.lastWrongPad = wrongPad;
          this.wrongDwell = 0;
        }
        this.wrongDwell += dt;
        if (this.wrongDwell > 0.55 && this.t - this.lastWrong > 3.2) {
          this.lastWrong = this.t;
          this.wrongDwell = 0;
          const target = this.targetFor(wrongPlayer);
          const need = describeSpec(target);
          const got = describeSpec(wrongPad);
          const needWord = SHAPE_GENDER[target.shape] === "f" ? "нужна" : SHAPE_GENDER[target.shape] === "n" ? "нужно" : "нужен";
          game.toast(`Это ${got}. ${wrongPlayer === "ilya" ? "Илюше" : "Алисе"} ${needWord} ${need}.`, "✧", 2600);
          VO.Sound.wrong();
        }
      } else {
        this.wrongDwell = 0;
        this.lastWrongPad = null;
      }

      if (this.transition > 0) {
        this.dwell = 0;
        return;
      }

      if (ilyaOk && alisaOk) {
        this.dwell += dt;
        if (this.dwell >= 0.85) {
          this.solved += 1;
          this.dwell = 0;
          this.transition = 1.5;
          VO.Sound.correct();
          game.hearts(CX(ilya), BOTTOM(ilya) - 100, 8);
          game.hearts(CX(alisa), BOTTOM(alisa) - 84, 8);
          game.burst(640, 500, {
            count: 54,
            colors: ["#ffe5a2", "#ffbdd1", "#c7b7ff", "#fff4d2"],
            speed: 260,
            gravity: 40,
            kind: "star",
            life: 1.9,
            size: 3.8,
          });
          const lines = [
            "Как дружно! Первый фонарик зажёгся.",
            "Ещё одна страница прочитана! Второй фонарик горит.",
            "Все страницы прочитаны! Слонёнок нашёлся!",
          ];
          game.say("mama", lines[this.solved - 1] || lines[2]);
          if (this.solved >= 3) {
            this.portalVisible = true;
            game.toast("Волшебная Дверь Сна появилась! Обнимитесь рядом с ней.", "♡", 4800);
          }
        }
      } else {
        this.dwell = Math.max(0, this.dwell - dt * 2);
      }
    };

    level.getObjective = function () {
      if (this.solved >= 3) return "Обнимитесь у Волшебной Двери: Пробел + Enter";
      if (this.transition > 0) return "Страница прочитана! Смотрите следующую...";
      const specs = this.currentSpecs();
      return `${this.solved + 1}/3 · Илюша — ${describeSpec(specs[0])} · Алиса — ${describeSpec(specs[1])}`;
    };

    level.getPortal = function () {
      if (!this.portalVisible) return null;
      return { cx: 640, cy: 500, r: 128, x: 575, y: 345, w: 130, h: 255 };
    };

    level.onDoorHug = function (game) {
      this.flags.doorHugged = true;
      VO.Sound.door();
      game.burst(640, 430, {
        count: 80,
        colors: ["#ffe6aa", "#ffbad2", "#c8b8ff", "#fff9d8"],
        speed: 270,
        gravity: 20,
        kind: "star",
        life: 2.3,
        size: 4.2,
      });
      game.say("both", "Слонёнок с нами! Время обнимашек!");
    };

    level.drawBack = function (ctx, t, game) {
      S.drawBookForest(ctx, t);
      S.drawLanterns(ctx, t, this.solved);
      S.drawStoryBook(ctx, t, this.currentSpecs(), this.solved, 0);

      for (const pad of this.pads) {
        const ilyaPad = game.ilya && this.padUnder(game.ilya) === pad;
        const alisaPad = game.alisa && this.padUnder(game.alisa) === pad;
        const active = ilyaPad || alisaPad;
        const correct =
          (ilyaPad && this.isCorrectPad(game.ilya, pad) && this.transition <= 0) ||
          (alisaPad && this.isCorrectPad(game.alisa, pad) && this.transition <= 0);
        S.drawShapePad(ctx, pad, t, { active, correct });
      }

      S.drawElephantCloud(ctx, t, this.portalVisible ? 1 : 0);
      S.drawBookPortal(ctx, t, this.portalVisible ? 1 : 0, this.flags.doorHugged ? 1 : 0);
      drawFireflies(ctx, t, this.fireflies);
    };

    level.drawFront = function (ctx, t, game) {
      if (this.dwell > 0) {
        drawRoundRing(ctx, game.ilya, this.dwell / 0.85, "#ffd27a");
        drawRoundRing(ctx, game.alisa, this.dwell / 0.85, "#ffb8ce");
      }
      const portal = this.getPortal();
      if (portal && !this.flags.doorHugged) {
        const near =
          Math.abs(CX(game.ilya) - portal.cx) < 170 ||
          Math.abs(CX(game.alisa) - portal.cx) < 160;
        if (near) {
          drawPrompt(ctx, t, portal.cx, 325, "Обнимитесь", ["Пробел", "Enter"], {
            accent: "#8b5674",
            keyColor: "#8b5674",
            sparkColor: "#ffc3d5",
          });
        }
      }
    };

    return level;
  }

  function makeColoring() {
    const bridge = { x: 430, y: 585, w: 330, h: 12, disabled: true };
    const swing = { x: 840, y: 530, w: 280, h: 12 };
    const shelf = { x: 1110, y: 300, w: 170, h: 14 };
    const birdBack = { x: 910, y: 500, w: 220, h: 14, disabled: true };

    const level = baseLevel({
      id: "coloring",
      index: 3,
      title: "Поляна гигантских книжек-раскрасок",
      shortTitle: "Поляна раскрасок",
      toy: "bird",
      toyName: "Птица Счастья",
      completeEyebrow: "Сон четвёртый — пройден!",
      completeTitle: "Птица Счастья ожила!",
      completeText:
        "Дерево стало мостом, яблоко — катапультой, а синяя краска вернула птице крылья. Теперь Птица Счастья унесёт вас в самый добрый и цветной сон.",
      spawn: {
        ilya: { x: 100, y: GROUND - 94 },
        alisa: { x: 165, y: GROUND - 72 },
      },
      solids: [
        { x: 0, y: GROUND, w: 430, h: 120 },
        { x: 760, y: GROUND, w: 520, h: 120 },
      ],
      oneWays: [bridge, swing, shelf, birdBack],
      pushables: [],
      fireflies: [
        { x: 366, y: 500, collected: false },
        { x: 818, y: 480, collected: false },
        { x: 1190, y: 430, collected: false },
      ],
      intro: [
        {
          speaker: "mama",
          text: "Ой, куда это мы попали? Все картинки потеряли свои цвета! Кажется, тучки-Сплюшки стерли все краски в Книге Сказок. Илюша, Алиса, вашему фонарику и пузырям пора сотворить настоящее чудо!",
        },
      ],
    });

    level.bridgePlatform = bridge;
    level.swing = swing;
    level.shelf = shelf;
    level.birdBack = birdBack;
    level.colorOrder = ["green", "yellow", "red", "blue"];
    level.color = "green";
    level.colorName = "Зелёный";
    level.colorHex = "#66c98a";
    level.decor = [
      { id: "left-tree-1", kind: "tree", x: 110, y: 445, color: "green", name: "Дерево", focusX: 110, focusY: 375, painted: false },
      { id: "left-tree-2", kind: "tree", x: 190, y: 445, color: "green", name: "Дерево", focusX: 190, focusY: 375, painted: false },
      { id: "left-tree-3", kind: "tree", x: 275, y: 445, color: "green", name: "Дерево", focusX: 275, focusY: 375, painted: false },
      { id: "left-house", kind: "house", x: 350, y: 452, color: "yellow", name: "Домик", focusX: 385, focusY: 470, painted: false },
      { id: "left-grass", kind: "grass", x: 210, y: GROUND, color: "red", name: "Травка", focusX: 210, focusY: GROUND - 12, radius: 175, painted: false },
    ];
    level.decorGlow = null;
    level.flags = {
      treePainted: false,
      bridgeBuilt: false,
      applePainted: false,
      appleTalked: false,
      appleLanded: false,
      launched: false,
      puddlePainted: false,
      puddleHintSaid: false,
      birdAwake: false,
      birdLanded: false,
      doorHugged: false,
      leftPaintedSaid: false,
    };
    level.bridgeProgress = 0;
    level.boardAngle = 0;
    level.launchDelay = 0;
    level.blowCharge = 0;
    level.takeoff = 0;
    level.portalVisible = false;
    level.shelfNow = false;
    level.swingNow = false;
    level.apple = { x: 1070, y: 190, fall: 0 };
    level.puddleX = 890;
    level.launch = { active: false, t: 0, fromX: 0, fromY: 0 };
    level.bubble = {
      active: false,
      phase: "idle",
      t: 0,
      x: 0,
      y: 0,
      r: 0,
      blue: false,
      sx: 0,
      sy: 0,
    };
    level.bird = { x: 1195, y: 250, t: 0 };

    level.init = function (game) {
      game.ilya.hasFlashlight = true;
      game.ilya.flashlightOn = true;
      game.ilya.hasWheel = false;
      game.alisa.hasBubbles = true;
      game.alisa.hasKey = false;
      game.alisa.blowing = false;
      game.toast("Фонарик Илюши светит. W — прыжок, Пробел — сменить цвет. Раскрасьте домик и деревья слева.", "●", 6200);
      VO.Sound.paper();
    };

    level.leftPainted = function () {
      return this.decor.every((d) => d.painted);
    };

    level.nearestDecor = function (ilya) {
      let best = null;
      let bestD = Infinity;
      for (const d of this.decor) {
        if (d.painted) continue;
        const dd = Math.abs(CX(ilya) - d.focusX);
        if (dd < bestD) { bestD = dd; best = d; }
      }
      return best;
    };

    level.paintDecor = function (game, d) {
      if (d.painted) return;
      d.painted = true;
      VO.Sound.paint();
      game.addCameraKick?.(3);
      game.burst(d.focusX, d.focusY, {
        count: 22,
        colors: [this.colorHex, "#fff3c0", "#ffffff"],
        speed: 120,
        gravity: 35,
        kind: "star",
        life: 1,
        size: 2.8,
      });
      game.toast(`${d.name} раскрашен!`, "✿", 2200);
      if (this.leftPainted() && !this.flags.leftPaintedSaid) {
        this.flags.leftPaintedSaid = true;
        game.say("mama", "Как красиво стало слева! Теперь зелёный луч на большое дерево — оно станет мостом.");
      }
    };

    level.onShelf = function (p) {
      return (
        p.onGround &&
        Math.abs(BOTTOM(p) - this.shelf.y) < 12 &&
        CX(p) > this.shelf.x + 8 &&
        CX(p) < this.shelf.x + this.shelf.w - 8
      );
    };

    level.onSwingLeft = function (p) {
      return p.onGround && p.groundPlatform === this.swing && CX(p) < 980;
    };

    level.nearPuddle = function (p) {
      return BOTTOM(p) > 560 && CX(p) > 796 && CX(p) < 994;
    };

    level.cycleColor = function (game) {
      const i = this.colorOrder.indexOf(this.color);
      this.color = this.colorOrder[(i + 1) % this.colorOrder.length];
      const defs = {
        green: { name: "Зелёный", hex: "#66c98a" },
        yellow: { name: "Жёлтый", hex: "#f2c64f" },
        red: { name: "Красный", hex: "#ff6b6b" },
        blue: { name: "Синий", hex: "#5aa9ff" },
      };
      const d = defs[this.color];
      this.colorName = d.name;
      this.colorHex = d.hex;
      VO.Sound.plastic();
      game.burst(CX(game.ilya) + 25 * game.ilya.dir, BOTTOM(game.ilya) - 57, {
        count: 10,
        colors: [d.hex, "#fff6d8", "#ffffff"],
        speed: 95,
        gravity: -15,
        kind: "spark",
        life: 0.7,
        size: 2.4,
      });
    };

    level.paintTree = function (game) {
      if (this.flags.treePainted) return;
      this.flags.treePainted = true;
      this.bridgeProgress = 0.001;
      VO.Sound.paint();
      game.addCameraKick?.(6);
      game.burst(700, 300, {
        count: 44,
        colors: ["#74d995", "#a9e9a5", "#3fae73", "#fff0b8"],
        speed: 190,
        gravity: 60,
        kind: "star",
        life: 1.6,
        size: 3.4,
      });
      game.toast("Зелёный луч оживил дерево! Ветки тянутся через обрыв.", "✿", 4600);
      game.say(
        "ilya",
        "Алиса, смотри! Мой фонарик стал волшебной кисточкой! Ну-ка, посвечу на это прозрачное дерево... Раз, два, три, расти!"
      );
    };

    level.paintApple = function (game) {
      if (this.flags.applePainted) return;
      this.flags.applePainted = true;
      this.flags.appleTalked = true;
      this.apple.fall = 0;
      VO.Sound.paint();
      game.addCameraKick?.(5);
      game.burst(1070, 205, {
        count: 34,
        colors: ["#ff6b6b", "#ff9b8c", "#ffd3a8", "#fff0c2"],
        speed: 170,
        gravity: 70,
        kind: "star",
        life: 1.4,
        size: 3.2,
      });
      game.toast("Яблоко налилось красным и стало тяжёлым!", "●", 4000);
      VO.Sound.stopSpeech();
      game.sayNow(
        "ilya",
        "Понял! Яблоку нужен правильный цвет. Переключаю фонарик... Красный! Лови спелый витамин!"
      );
    };

    level.startLaunch = function (game) {
      if (this.launch.active || this.flags.launched) return;
      this.flags.launched = true;
      this.flags.appleTalked = true;
      this.launch.active = true;
      this.launch.t = 0;
      this.launch.fromX = game.alisa.x;
      this.launch.fromY = game.alisa.y;
      game.alisa.onGround = false;
      game.alisa.groundPlatform = null;
      game.alisa.vx = 0;
      game.alisa.vy = 0;
      VO.Sound.boing();
      game.addCameraKick?.(5);
      game.toast("Качели-катапульта подбросили Алису к книге!", "↑", 4200);
      VO.Sound.stopSpeech();
      game.sayNow("alisa", "Ух ты-ы-ы! Я лечу! Оп! Я на самой верхней полке прямо у Книжки со сказками!");
    };

    level.paintPuddle = function (game) {
      if (this.flags.puddlePainted) return;
      this.flags.puddlePainted = true;
      this.bubble.blue = true;
      VO.Sound.paint();
      game.burst(890, 575, {
        count: 32,
        colors: ["#5aa9ff", "#9fd8ff", "#d9f3ff", "#fff4c4"],
        speed: 160,
        gravity: 20,
        kind: "star",
        life: 1.4,
        size: 3.2,
      });
      game.toast("Лужица стала синей волшебной краской!", "≈", 4000);
      game.say("ilya", "Краска готова! Алиса, выдувай пузырь и лови синий цвет!");
    };

    level.startBubble = function (game) {
      if (this.bubble.active || this.flags.birdAwake) return;
      this.blowCharge = 0;
      const b = this.bubble;
      b.active = true;
      b.phase = "down";
      b.t = 0;
      b.blue = false;
      b.sx = CX(game.alisa) + 18;
      b.sy = BOTTOM(game.alisa) - 58;
      b.x = b.sx;
      b.y = b.sy;
      b.r = 8;
      game.alisa.blowing = true;
      VO.Sound.bubble();
      game.toast("Пузырь опускается к синей лужице…", "◌", 3400);
      game.say("alisa", "Сейчас... Дую-дую-выдуваю! Пиу!");
    };

    level.preUpdate = function (dt, game) {
      this.t += dt;

      if (this.flags.doorHugged) {
        this.takeoff += dt;
        const lift = Math.min(310, this.takeoff * 105);
        this.bird.x = 1020 + Math.sin(this.t * 2.4) * 3;
        this.bird.y = 500 - lift;
        game.ilya.y = 406 - lift;
        game.alisa.y = 428 - lift;
        game.ilya.onGround = false;
        game.alisa.onGround = false;
        game.ilya.groundPlatform = null;
        game.alisa.groundPlatform = null;
        return;
      }

      if (this.flags.treePainted) {
        this.bridgeProgress = Math.min(1, this.bridgeProgress + dt * 1.45);
      }
      this.bridgePlatform.disabled = this.bridgeProgress < 0.9;
      if (!this.flags.bridgeBuilt && this.bridgeProgress >= 0.9) {
        this.flags.bridgeBuilt = true;
        game.say("alisa", "Ого! Дерево ожило и сделало для нас мостик! Бежим скорее, я первая!");
      }

      if (this.flags.applePainted && !this.flags.appleLanded) {
        this.apple.fall += dt;
        const p = Math.min(1, this.apple.fall / 0.9);
        this.apple.y = A.lerp(190, 510, p * p);
        if (p >= 1) {
          this.flags.appleLanded = true;
          this.launchDelay = 0.42;
          VO.Sound.land();
          VO.Sound.push();
          game.addCameraKick?.(6);
          game.burst(1070, 525, {
            count: 20,
            colors: ["#ff8c7e", "#ffd1a1", "#fff0c2"],
            speed: 120,
            gravity: 80,
            kind: "dot",
            life: 0.9,
            size: 3,
          });
        }
      }

      if (this.launchDelay > 0) this.launchDelay = Math.max(0, this.launchDelay - dt);

      const targetAngle = this.flags.appleLanded ? 0.24 : 0;
      this.boardAngle = A.lerp(this.boardAngle, targetAngle, 1 - Math.exp(-dt * 5));

      if (this.launch.active) {
        this.launch.t += dt;
        const p = Math.min(1, this.launch.t / 1.12);
        const e = A.easeInOut(p);
        game.alisa.x = A.lerp(this.launch.fromX, 1130, e);
        game.alisa.y = A.lerp(this.launch.fromY, this.shelf.y - game.alisa.h, e) - Math.sin(Math.PI * p) * 92;
        game.alisa.vx = 0;
        game.alisa.vy = 0;
        game.alisa.onGround = false;
        game.alisa.groundPlatform = null;
        if (p >= 1) {
          this.launch.active = false;
          game.alisa.x = 1130;
          game.alisa.y = this.shelf.y - game.alisa.h;
          game.alisa.onGround = true;
          game.alisa.groundPlatform = this.shelf;
          this.shelfNow = true;
          VO.Sound.land();
          game.say("alisa", "Тут сидит нарисованная птичка, она не может летать, потому что она не раскрашена. А твой фонарик досюда не достает!");
          game.toast("Алиса у Книги Сказок. Илюша, ищи синюю краску внизу!", "✦", 4800);
        }
      }

      this.shelfNow = this.onShelf(game.alisa);
      this.swingNow = this.onSwingLeft(game.alisa);

      // Алиса остаётся на полке, пока птичка не раскрашена и не слетела вниз.
      if (this.flags.launched && !this.launch.active && !this.flags.birdLanded) {
        game.alisa.x = 1130;
        game.alisa.y = this.shelf.y - game.alisa.h;
        game.alisa.vx = 0;
        game.alisa.vy = 0;
        game.alisa.onGround = true;
        game.alisa.groundPlatform = this.shelf;
        if (game.justPressed("ArrowUp") && !this.once("alisaWaitBird")) {
          game.toast("Алиса ждёт, пока птичка раскрасится и слетит вниз.", "✦", 3200);
        }
      }

      if (this.flags.birdAwake) {
        this.bird.t += dt;
        if (this.bird.t < 1.1) {
          this.bird.x = 1195;
          this.bird.y = 250;
        } else if (this.bird.t < 2.75) {
          const p = (this.bird.t - 1.1) / 1.65;
          this.bird.x = A.lerp(1195, 1020, A.easeInOut(p));
          this.bird.y = A.lerp(250, 500, A.easeInOut(p)) - Math.sin(Math.PI * p) * 90;
        } else if (!this.flags.birdLanded) {
          this.flags.birdLanded = true;
          this.portalVisible = true;
          this.birdBack.disabled = false;
          this.bird.x = 1020;
          this.bird.y = 500;
          VO.Sound.door();
          VO.Sound.chirp();
          game.addCameraKick?.(6);
          game.burst(1020, 470, {
            count: 58,
            colors: ["#5aa9ff", "#9fd8ff", "#fff0b8", "#ffd4e8", "#ffffff"],
            speed: 220,
            gravity: 10,
            kind: "star",
            life: 2,
            size: 3.8,
          });
          game.say(
            "mama",
            "Какая красота! Птица Счастья снова синяя и готова отнести вас в самый добрый, самый цветной сон. Обнимитесь на прощание с этим удивительным миром!"
          );
          game.toast("Птица Счастья опустилась на поляну. Запрыгните к ней на спину!", "♡", 5200);
        } else {
          this.bird.x = 1020 + Math.sin(this.t * 1.6) * 2;
          this.bird.y = 500 + Math.sin(this.t * 2.1) * 1.5;
        }
      }

      const b = this.bubble;
      if (b.active) {
        if (b.phase === "down") {
          b.t += dt;
          const p = Math.min(1, b.t / 1.25);
          b.x = A.lerp(b.sx, this.puddleX || 890, A.easeInOut(p));
          b.y = A.lerp(b.sy, 565, A.easeInOut(p));
          b.r = A.lerp(8, 46, A.easeOut(p));
          if (p >= 1) {
            b.phase = "absorb";
            b.t = 0;
            b.blue = true;
            VO.Sound.soapPop();
            game.burst(890, 560, {
              count: 20,
              colors: ["#5aa9ff", "#a8ddff", "#ffffff"],
              speed: 95,
              gravity: -30,
              kind: "dot",
              life: 0.9,
              size: 3.2,
            });
            game.say("alisa", "Поймала! Теперь вверх, к птичке!");
          }
        } else if (b.phase === "absorb") {
          b.t += dt;
          b.x = 890;
          b.y = 552;
          b.r = 46 + Math.sin(this.t * 8) * 2;
          if (b.t > 0.45) {
            b.phase = "up";
            b.t = 0;
          }
        } else if (b.phase === "up") {
          b.t += dt;
          const p = Math.min(1, b.t / 1.35);
          b.x = A.lerp(890, 1195, A.easeInOut(p));
          b.y = A.lerp(552, 250, A.easeInOut(p));
          b.r = 46;
          if (p >= 1) {
            b.phase = "pop";
            b.t = 0;
            this.flags.birdAwake = true;
            this.bird.t = 0;
            VO.Sound.chirp();
            game.addCameraKick?.(4);
            game.burst(1195, 245, {
              count: 40,
              colors: ["#5aa9ff", "#a8ddff", "#fff0b8", "#ffd4e8"],
              speed: 180,
              gravity: 30,
              kind: "star",
              life: 1.5,
              size: 3.4,
            });
            game.say("alisa", "Хлоп! Птица Счастья стала синей и ожила!");
          }
        } else if (b.phase === "pop") {
          b.t += dt;
          b.r = 46 + b.t * 90;
          if (b.t > 0.5) b.active = false;
        }
      }

      game.alisa.blowing = this.blowCharge > 0.01 || (b.active && b.phase !== "pop");
    };

    level.postUpdate = function (dt, game) {
      const ilya = game.ilya;
      const alisa = game.alisa;

      if (game.justPressed("Space")) this.cycleColor(game);
      ilya.flashlightOn = true;
      this.decorGlow = this.leftPainted() ? null : this.nearestDecor(ilya);

      if (!this.leftPainted()) {
        const cx = CX(ilya);
        const colorNames = { green: "зелёный", yellow: "жёлтый", red: "красный", blue: "синий" };
        for (const d of this.decor) {
          if (d.painted) continue;
          const reach = d.kind === "grass" ? d.radius : 82;
          if (Math.abs(cx - d.focusX) > reach) continue;
          if (this.color === d.color) {
            this.paintDecor(game, d);
          } else if (this.once("decor-wrong-" + d.id)) {
            game.toast(`${d.name}: нужен ${colorNames[d.color]} луч. Нажми Пробел.`, "●", 3000);
          }
        }
      }

      if (!this.leftPainted() && CX(ilya) > 236 && CX(ilya) < 430 && this.color === "green" && this.once("treeLocked")) {
        game.toast("Сначала раскрасьте домик и деревья в левой части поляны.", "●", 3800);
      }

      if (this.leftPainted() && !this.flags.treePainted && CX(ilya) > 236 && CX(ilya) < 430 && ilya.dir > 0) {
        if (this.color === "green") this.paintTree(game);
        else if (this.once("treeWrong")) {
          game.toast("Дереву нужен зелёный луч. Нажми Пробел, чтобы сменить цвет.", "●", 3600);
        }
      }

      if (this.onSwingLeft(alisa) && !this.flags.appleTalked && !this.once("swingLine")) {
        this.flags.appleTalked = true;
        game.say(
          "alisa",
          "Илюша, я стою на качелях, но они не двигаются. Посмотри наверх, там на ветке нарисовано гигантское яблоко, но оно совсем прозрачное и легкое, как облачко."
        );
      }

      if (
        this.flags.treePainted &&
        !this.flags.applePainted &&
        CX(ilya) > 760 &&
        this.color === "red"
      ) {
        if (this.onSwingLeft(alisa)) this.paintApple(game);
        else if (this.once("appleWait")) {
          game.toast("Сначала Алиса должна встать на качели. Прыгай, Алиса!", "↑", 4200);
        }
      }

      if (
        this.flags.appleLanded &&
        !this.flags.launched &&
        !this.launch.active &&
        this.launchDelay <= 0 &&
        this.onSwingLeft(alisa) &&
        !this.onShelf(alisa)
      ) {
        this.startLaunch(game);
      }

      if (this.onShelf(alisa) && !this.flags.puddlePainted && !this.flags.puddleHintSaid) {
        this.flags.puddleHintSaid = true;
        game.say(
          "ilya",
          "Алиса, используй пузыри! Смотри, внизу есть лужица с волшебной синей краской. Пусти туда пузырек!"
        );
      }

      if (
        this.onShelf(alisa) &&
        !this.flags.puddlePainted &&
        this.nearPuddle(ilya)
      ) {
        if (this.color === "blue") this.paintPuddle(game);
        else if (this.once("puddleWrong")) {
          game.toast("Краске нужен синий луч. Нажми Пробел ещё раз.", "●", 3600);
        }
      }

      if (
        this.onShelf(alisa) &&
        this.flags.puddlePainted &&
        !this.flags.birdAwake &&
        !this.bubble.active &&
        game.isDown("Enter")
      ) {
        this.blowCharge = Math.min(0.7, this.blowCharge + dt);
        if (this.blowCharge >= 0.35) this.startBubble(game);
      } else {
        this.blowCharge = Math.max(0, this.blowCharge - dt * 2);
      }

      collectFireflies(this, game);

      if (this.flags.birdLanded && !this.once("birdPrompt")) {
        game.toast("Запрыгните на спину Птицы Счастья и обнимитесь: Пробел + Enter.", "♡", 5000);
      }
    };

    level.actionContext = function (p) {
      if (p.kind === "ilya") return "paint";
      if (
        p.kind === "alisa" &&
        this.onShelf(p) &&
        this.flags.puddlePainted &&
        !this.flags.birdAwake
      ) {
        return "blow";
      }
      return null;
    };

    level.isNearInteractable = function (p) {
      if (p.kind === "ilya") return true;
      if (p.kind === "alisa" && this.onShelf(p) && this.flags.puddlePainted) return true;
      return false;
    };

    level.getObjective = function () {
      if (!this.leftPainted()) return "Илюша: раскрасьте домик, деревья и травку слева (Пробел — цвет)";
      if (!this.flags.treePainted) return "Илюша: зелёный луч на большое дерево (Пробел — сменить цвет)";
      if (!this.flags.bridgeBuilt) return "Дерево становится живым мостом…";
      if (!this.flags.applePainted) {
        if (!this.swingNow) return "Алиса: запрыгни на качели (↑)";
        return "Илюша: красный луч на яблоко (Пробел — сменить цвет)";
      }
      if (!this.shelfNow) {
        return this.flags.launched
          ? "Алиса летит к Книге сказок…"
          : "Яблоко падает — Алиса взлетает к книге…";
      }
      if (!this.flags.puddlePainted) return "Илюша: синий луч на лужицу краски";
      if (!this.flags.birdAwake) return "Алиса: выдуй пузырь и поймай синюю краску (Enter)";
      if (!this.flags.birdLanded) return "Птица Счастья расправляет крылья…";
      return "Запрыгните на спину птицы и обнимитесь: Пробел + Enter";
    };

    level.getPortal = function () {
      if (!this.portalVisible) return null;
      return { cx: 1020, cy: 455, r: 105, x: 930, y: 285, w: 180, h: 315 };
    };

    level.onDoorHug = function (game) {
      this.flags.doorHugged = true;
      VO.Sound.door();
      VO.Sound.celebrate();
      game.addCameraKick?.(8);
      game.burst(1020, 420, {
        count: 86,
        colors: ["#5aa9ff", "#9fd8ff", "#ffd4e8", "#fff0b8", "#ffffff", "#c8b8ff"],
        speed: 280,
        gravity: 15,
        kind: "star",
        life: 2.4,
        size: 4.2,
      });
      game.say("both", "Время обнимашек! Добрых снов всем-всем-всем!");
    };

    level.drawBack = function (ctx, t, game) {
      S.drawColoringWorld(ctx, t);
      S.drawColoringLeftScenery(ctx, t, this.decor, this.decorGlow);
      S.drawColoringChasm(ctx, t);
      S.drawColoringTree(ctx, t, this.flags.treePainted, this.bridgeProgress);
      S.drawColoringSwing(ctx, t, {
        applePainted: this.flags.applePainted,
        appleY: this.apple.y,
        appleLanded: this.flags.appleLanded,
        angle: this.boardAngle,
      });
      S.drawColoringShelf(ctx, t);
      S.drawColoringDoor(ctx, t, this.portalVisible ? 1 : 0, this.flags.doorHugged ? 1 : 0);
      if (this.flags.birdAwake) {
        S.drawColoringBird(ctx, this.bird.x, this.bird.y, 1.05, t, true, Math.sin(t * 6));
      } else {
        S.drawColoringBird(ctx, 1195, 245, 0.7, t, false, 0);
      }
      S.drawColoringPuddle(ctx, t, this.flags.puddlePainted);
      drawFireflies(ctx, t, this.fireflies);
    };

    level.drawFront = function (ctx, t, game) {
      if (this.flags.doorHugged) return;
      const ilya = game.ilya;
      const alisa = game.alisa;
      const from = { x: CX(ilya) + 25 * ilya.dir, y: BOTTOM(ilya) - 57 };

      let target = { x: from.x + 290 * ilya.dir, y: from.y - 45 };
      const leftTarget = this.leftPainted() ? null : this.nearestDecor(ilya);
      if (leftTarget) target = { x: leftTarget.focusX, y: leftTarget.focusY };
      else if (!this.flags.treePainted) target = { x: 700, y: 300 };
      else if (!this.flags.applePainted && this.flags.treePainted) target = { x: 1070, y: this.apple.y };
      else if (!this.flags.puddlePainted && this.flags.appleLanded) target = { x: 890, y: 570 };

      drawColorBeam(ctx, from, target, 74, 0.5, this.colorHex, t);
      A.glow(ctx, from.x, from.y, 22, this.colorHex, 0.7);
      if (leftTarget && Math.abs(CX(ilya) - leftTarget.focusX) < 145) {
        A.glow(ctx, leftTarget.focusX, leftTarget.focusY, 72, this.colorHex, 0.7);
      }

      if (this.bubble.active) {
        S.drawColorBubble(ctx, this.bubble.x, this.bubble.y, this.bubble.r, t, this.bubble.blue ? "#5aa9ff" : "rgba(225,250,255,0.9)");
      }

      if (leftTarget && Math.abs(CX(ilya) - leftTarget.focusX) < 145 && this.color !== leftTarget.color) {
        const colorNames = { green: "зелёный", yellow: "жёлтый", red: "красный", blue: "синий" };
        drawPrompt(ctx, t, leftTarget.focusX, leftTarget.focusY - 62, `Нужен ${colorNames[leftTarget.color]} луч`, ["Пробел"], {
          accent: "#7a6450",
          keyColor: "#7a6450",
          sparkColor: "#ffe8b3",
        });
      }

      if (!leftTarget && !this.flags.treePainted && CX(ilya) > 180 && this.color !== "green") {
        drawPrompt(ctx, t, 700, 230, "Смени на зелёный", ["Пробел"], {
          accent: "#3f7d58",
          keyColor: "#3f7d58",
          sparkColor: "#b9f0c6",
        });
      }

      if (!this.flags.applePainted && !this.flags.appleLanded && this.flags.treePainted) {
        if (!this.swingNow) {
          drawPrompt(ctx, t, 980, 455, "Алиса, на качели", ["↑"], {
            accent: "#6d5d78",
            keyColor: "#6d5d78",
            sparkColor: "#ffd9c6",
          });
        } else if (this.color !== "red") {
          drawPrompt(ctx, t, 1070, 145, "Красный луч на яблоко", ["Пробел"], {
            accent: "#9a4b55",
            keyColor: "#9a4b55",
            sparkColor: "#ffc2b8",
          });
        }
      }

      if (this.onShelf(alisa) && !this.flags.puddlePainted && this.color !== "blue") {
        drawPrompt(ctx, t, 890, 505, "Синий луч на лужицу", ["Пробел"], {
          accent: "#416d9d",
          keyColor: "#416d9d",
          sparkColor: "#b9e2ff",
        });
      }

      if (this.onShelf(alisa) && this.flags.puddlePainted && !this.flags.birdAwake) {
        drawPrompt(ctx, t, 1160, 185, "Выдуй пузырь", ["Enter"], {
          accent: "#4f6d9a",
          keyColor: "#4f6d9a",
          sparkColor: "#c8ecff",
        });
      }

      if (this.flags.birdLanded && !this.flags.doorHugged) {
        drawPrompt(ctx, t, 1020, 390, "На спину птицы", ["W", "↑"], {
          accent: "#4f6d9a",
          keyColor: "#4f6d9a",
          sparkColor: "#d7efff",
        });
        const portal = this.getPortal();
        if (
          portal &&
          BOTTOM(ilya) < 540 &&
          BOTTOM(alisa) < 540 &&
          (Math.abs(CX(ilya) - portal.cx) < 150 || Math.abs(CX(alisa) - portal.cx) < 150)
        ) {
          drawPrompt(ctx, t, portal.cx, 265, "Обнимитесь", ["Пробел", "Enter"], {
            accent: "#5e6385",
            keyColor: "#5e6385",
            sparkColor: "#ffd8e7",
          });
        }
      }
    };

    return level;
  }


  // -----------------------------------------------------------------------
  // Общие маленькие помощники
  // -----------------------------------------------------------------------

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  const LEVEL_FACTORIES = [makeSocks, makeLego, makeBooks, makeColoring];

  VO.LEVELS = LEVEL_FACTORIES;
  VO.LEVEL_META = [
    { title: "Остров разбросанных носков", toy: "bear" },
    { title: "Остров потерянных деталек Лего", toy: "train" },
    { title: "Лес книжных страниц", toy: "elephant" },
    { title: "Поляна гигантских книжек-раскрасок", toy: "bird" },
  ];
})();
