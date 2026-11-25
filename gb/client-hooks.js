// GameBull hooks into the client's page. A classic script the build puts right AFTER their yokocho.js, so their files
// stay exactly as delivered. Their game functions (start, next, settle, finish, updateClock, render, soundUI) are
// global function declarations: this file wraps them on window, and their own calls go through the wrappers. Their
// top-level consts (state, audio, game, $) are shared with every classic script and only read here (state's fields are
// set only where their own start() would set them). The GameBull shell (main.tsx, a module) talks only to
// window.SYClient below.
//
// A GameBull run (tournament / Score Challenge / solo / room), the client's design kept:
//  - their own start(): their score 0, their 6 throws (their HUD "x6"), their 15 s clock, their mug at the entrance.
//    Their page calls start() by itself as soon as their first pictures are in (their Promise.all(...).then); in the
//    GameBull build that call only marks their game as loaded (the GameBull lobby is up then), and the shell calls
//    their start() when a run begins;
//  - a challenge time limit (or ?devSeconds) other than their 15 s starts their clock with the difference already used
//    (their clock code, timer and 5..1 warning tones unchanged: their start() reads performance.now() once for their
//    deadline, and that one reading is moved by the difference);
//  - their swipe, physics and scoring (ordinary stop 1..100, the 300-point end zone, 0 at the wall), their celebration
//    and break effects, their sounds are kept; the GameBull seed is only logged (their game has no randomness that
//    decides a score: the throw is decided by the swipe);
//  - their round end is their own finish(): their clock at 0 (a throw still sliding then gets their 0) or their 6th throw
//    settled. "0" is held 0.7 s by the shell on a time-up, then the GameBull board replaces their result dialog.
//    Challenge target: their score reaches it -> no new throw -> their own finish() 0.9 s later -> the board;
//  - their result dialog (<dialog id="result">: score, self-best, the six throws, their replay button) never shows:
//    the GameBull board replaces it (playbook trap W16: showModal() would sit in the browser's top layer, above every
//    GameBull screen). Their finish() still writes their own per-browser best (their localStorage key), as delivered.
(function () {
  "use strict";
  var hooks = { onLock: null, onEnd: null };   // set by the shell
  var RUN = 15;            // their 15 s (start(): state.deadline=performance.now()+15000; checked at build time)
  var THROWS = 6;          // their 6 throws (start(): state.lives=6; checked at build time)
  var R = null;            // the current GameBull run, null under the lobby
  var last = null;         // the last run's facts
  var ready = false, readyWaiters = [];
  var log = function (m) { console.log("[SY-GB] " + m); };
  var el = function (id) { return document.getElementById(id); };

  var clientStart = window.start, clientFinish = window.finish, clientSettle = window.settle;

  // ---- one reading of their clock, moved (their start() reads performance.now() exactly once, for their deadline) ----
  function withClockShift(ms, fn) {
    var real = performance.now;
    performance.now = function () { delete performance.now; return real.call(performance) + ms; };
    try { return fn(); } finally { if (Object.prototype.hasOwnProperty.call(performance, "now")) delete performance.now; }
  }

  function markReady(how) {
    if (ready) return;
    ready = true;
    log("Their game is loaded (" + how + "); parked under the GameBull lobby (their round has not started).");
    readyWaiters.splice(0).forEach(function (f) { f(); });
  }

  // ---- their automatic start: only marks their game as loaded; a GameBull run calls their start() itself ----
  window.start = function () { markReady("their first storefront and mug pictures are in"); };
  // If their pictures were already in before this file ran (their start() ran first), their round is parked here.
  if (state.phase !== "title" || state.running) {
    state.running = false; state.phase = "title";
    markReady("their round had started before the hooks; parked");
  }

  // ---- their result dialog never opens (W16) ----
  var clientShowModal = HTMLDialogElement.prototype.showModal, dialogLogged = false;
  HTMLDialogElement.prototype.showModal = function () {
    if (this.id === "result") {
      if (!dialogLogged) { dialogLogged = true; log("Their result dialog is not shown (the GameBull board replaces it)."); }
      return;
    }
    return clientShowModal.apply(this, arguments);
  };

  // ---- their throws: what each one scored, from their own settle() ----
  window.settle = function (crashed) {
    var out = clientSettle.apply(this, arguments);
    if (R && R.live && !R.ended) {
      var i = state.results.length - 1, pts = state.results[i];
      R.kinds[i] = crashed ? "wall" : pts === 300 ? "zone" : "ordinary";
      checkTarget();
    }
    return out;
  };
  // Challenge target: checked on their score as soon as a throw has settled (their HUD shows it at that moment); no new
  // throw is taken from then on, and the round ends 0.9 s later through their own finish().
  function checkTarget() {
    if (!R || !R.live || R.ended || R.locked || !(R.target > 0) || state.score < R.target || !state.running) return;
    R.locked = true; R.why = "target";
    log("Challenge target " + R.target + " reached: their score " + state.score + "; no new throw, ending in 0.9 s.");
    hooks.onLock && hooks.onLock("target");
    setTimeout(endNow, 900);
  }
  function endNow() {
    if (!R || R.ended) return;
    window.finish();     // their own finish() (through the wrapper below)
  }
  // After the run is locked (target reached), their game takes no new swipe: their pointerdown never sees it.
  window.addEventListener("pointerdown", function (e) {
    if (R && R.locked && !R.ended && e.target && e.target.closest && e.target.closest("#game")) { e.stopImmediatePropagation(); }
  }, true);

  // ---- their round end: their own finish() ----
  window.finish = function () {
    var was = state.phase === "over";
    var out = clientFinish.apply(this, arguments);
    if (!was && R && R.live && !R.ended) roundOver();
    return out;
  };
  function roundOver() {
    R.ended = true; R.locked = true;
    var why = R.why || (state.remaining <= 0 ? "time" : "throws");
    var res = state.results.slice(), throwsTaken = res.length;
    var rows = [];
    for (var i = 0; i < throwsTaken; i++) {
      var p = res[i];
      rows.push({ n: i + 1, points: p == null ? 0 : p, kind: p == null ? "cut" : R.kinds[i] || (p === 300 ? "zone" : p === 0 ? "wall" : "ordinary") });
    }
    var sum = rows.reduce(function (a, r) { return a + r.points; }, 0);
    last = { reason: why, total: state.score, throws: rows, maxThrows: THROWS,
      playMs: Math.round(Math.min(performance.now(), R.deadline) - R.startedAt) };
    log("Round over (" + why + "): " + throwsTaken + " of " + THROWS + " throws: " +
      rows.map(function (r) { return r.n + ":" + r.points + (r.kind === "zone" ? " (300 zone)" : r.kind === "wall" ? " (wall)" : r.kind === "cut" ? " (time up while sliding)" : ""); }).join(", ") +
      "; their score " + state.score + "; " + (sum === state.score ? "score check ok (throws = their score)." : "SCORE CHECK FAILED: throws give " + sum + "."));
    if (why !== "target") hooks.onLock && hooks.onLock(why === "time" ? "clock" : "throws");
    hooks.onEnd && hooks.onEnd(last);
  }

  // ---- sound ----
  // GameBull mute = their own sound button (#mute-toggle: music and effects together, as their onclick does). Their
  // default is muted (their README: "The game starts muted"; their handoff: "Initial mute is intentional"), so GameBull
  // keeps it muted until the player chooses, and remembers the player's choice (their page does not save it).
  // Their sounds play only in a GameBull run: not under the lobby, the board or the end panel.
  var MUTE_KEY = "JokkiSuberi_Muted";
  var pref = true, saved = null;
  try { saved = localStorage.getItem(MUTE_KEY); } catch (e) { /* private mode */ }
  pref = saved !== "0";
  log("Sound " + (pref ? "OFF" : "ON") + (saved === null ? " (their default: muted, until the player chooses)." : " (the player's choice)."));
  function savePref() { try { localStorage.setItem(MUTE_KEY, pref ? "1" : "0"); } catch (e) { /* private mode */ } }
  function gateOpen() { return !!R && R.live && !R.silent; }
  ["resumeMusic", "effect", "celebrate", "sample", "startSlide", "resumeSlide"].forEach(function (m) {
    var f = audio[m];
    audio[m] = function () { if (!gateOpen()) return; return f.apply(audio, arguments); };
  });
  function stopTheirSound() {
    try { audio.pauseMusic(); audio.stop(); audio.silenceSamples(); audio.stopSlide(); } catch (e) { /* not started */ }
  }
  function applyPref() {      // their own switch, as their mute button sets it
    var on = !pref;
    if (audio.music !== on || audio.sfx !== on) { audio.setMusic(on); audio.setSfx(on); }
    window.soundUI();
  }
  // Their mute button in a run: their onclick runs first (registered before this file), then the choice is remembered.
  el("mute-toggle").addEventListener("click", function () {
    pref = !audio.music && !audio.sfx; savePref();
    log("Their sound button: " + (pref ? "muted" : "sound on") + " (remembered).");
  });
  // iPhone / Safari: a Web Audio context starts only inside a tap, and a GameBull run starts after a server call,
  // outside the tap (trap W1). So every tap (the lobby's Join, the challenge's Start, their own swipes) also creates /
  // resumes their audio context inside the gesture when the player has sound on; the lobby stays silent (their music
  // flag is set only when a run starts). Audio session "playback" (iOS 16.4+, trap W2): the silent switch does not mute.
  try { if (navigator.audioSession) { navigator.audioSession.type = "playback"; log("Audio session set to playback."); } } catch (e) { /* n/a */ }
  var unlocked = false;
  function unlockTap() {
    try {
      if (pref) return;
      audio.init();
      var c = audio.ctx; if (!c) return;
      var ok = function () { if (!unlocked && c.state === "running") { unlocked = true; log("Game sound unlocked by a tap (Web Audio running)."); } };
      if (c.state === "running") ok(); else c.resume().then(ok).catch(function () {});
    } catch (e) { /* no Web Audio */ }
  }
  ["touchend", "pointerup", "click", "keydown"].forEach(function (t) { document.addEventListener(t, unlockTap, { capture: true, passive: true }); });

  // ---- free spots on their page (page pixels), measured from their own elements ----
  function box(r) { return r ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height } : null; }
  function rectOf(sel) { var e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null; }

  window.SYClient = {
    hooks: hooks,
    // Resolves when their game has loaded (their first storefront and mug pictures: their own start gate).
    whenReady: function () { return new Promise(function (res) { if (ready) res(); else readyWaiters.push(res); }); },
    isReady: function () { return ready; },
    // Under the lobby: their round is stopped (no clock, no input), their sounds are stopped and blocked.
    park: function () {
      if (R && R.live && !R.ended) { R.silent = true; state.running = false; }
      R = null;
      if (state.phase !== "over") state.phase = "title";
      stopTheirSound();
    },
    // Their board for a run, frozen (no clock, no input yet): their mug at the entrance, their HUD at 0 points, x6 and the
    // run's seconds. opt.seconds = the run length (their 15 s, a challenge limit or ?devSeconds); opt.target = challenge
    // target (0 = none).
    prepare: function (opt) {
      opt = opt || {};
      var secs = opt.seconds > 0 ? opt.seconds : RUN;
      R = { seconds: secs, target: opt.target || 0, live: false, locked: false, ended: false, silent: false, why: null,
        kinds: [], startedAt: -1, deadline: 0 };
      last = null;
      state.running = false; state.score = 0; state.lives = THROWS; state.results = [];
      try { window.yokochoEffects && window.yokochoEffects.clearCelebration && window.yokochoEffects.clearCelebration(); } catch (e) { /* n/a */ }
      window.next();                       // their own reset of the mug, camera, arrow and message (phase "ready")
      state.phase = "title";               // ...but no swipe until their start()
      el("timer").textContent = secs + "秒"; el("timer").classList.remove("urgent");
      log("Their board is set: " + secs + " s run" + (R.target ? ", challenge target " + R.target : "") + "; waiting for their start().");
    },
    // Their start(): their clock, score, throws and swipe. A run length other than their 15 s moves the one clock reading
    // their start() takes by the difference, so their deadline is exactly the run's length from now.
    go: function () {
      if (!R || R.live) return;
      var shift = (RUN - R.seconds) * 1000;
      var t0 = performance.now();
      withClockShift(-shift, function () { clientStart(); });
      window.updateClock();                // their own clock function: shows the run's seconds at once
      R.live = true; R.startedAt = t0; R.deadline = state.deadline;
      applyPref();
      log("Their start(): " + R.seconds + " s on their clock (deadline in " + Math.round(state.deadline - t0) + " ms" +
        (shift ? "; " + (shift > 0 ? shift / 1000 + " s of their 15 s used up front" : -shift / 1000 + " s added to their 15 s") : "") +
        "), " + THROWS + " throws; sound " + (pref ? "off" : "on") + ".");
    },
    start: function (opt) { window.SYClient.prepare(opt); window.SYClient.go(); },
    // Under the results board: their sounds stopped, nothing new from their page until the next run.
    silence: function () {
      if (R) R.silent = true;
      stopTheirSound();
      log("Game audio stopped under the results board (their music and effects stopped and blocked).");
    },
    totalScore: function () { return R && !R.ended ? state.score : last ? last.total : 0; },   // their HUD score
    throwsLeft: function () { return state.lives; },
    remaining: function () { return R && R.live && !R.ended ? Math.max(0, state.deadline - performance.now()) / 1000 : 0; },
    isLive: function () { return !!R && R.live && !R.ended; },
    canThrow: function () { return !!R && R.live && !R.locked && state.running && state.phase === "ready" && !state.drag; },
    // Their clock digits (#timer: "15秒"), in page pixels, and a switch that hides them while the GameBull 10..1 is
    // drawn over them.
    clock: function () {
      var t = el("timer"); if (!t) return null;
      var r = t.getBoundingClientRect(); if (!r.width) return null;
      return { left: r.left, top: r.top, width: r.width, height: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2,
        fontPx: parseFloat(getComputedStyle(t).fontSize) || 20 };
    },
    hideClock: function (hide) { var t = el("timer"); if (t) { var v = hide ? "hidden" : ""; if (t.style.visibility !== v) t.style.visibility = v; } },
    // Free spots: their whole 9:16 game box, their HUD bar (header), their sound button, the strip of their top bar under
    // their sound button (above their storefronts), and their floor strip under their course map (their wooden floor
    // and stools: background only).
    spots: function () {
      var g = rectOf("#game"); if (!g || !g.width) return null;
      var hdr = rectOf("#game header"), mute = rectOf("#mute-toggle"), scene = rectOf("#world-scene"), route = rectOf("#route");
      var under = mute && scene ? { left: mute.left - mute.width * 0.25, top: mute.bottom + 2, right: Math.min(g.right - 2, mute.right + mute.width * 0.25), bottom: scene.top - 2 } : null;
      if (under) { under.width = under.right - under.left; under.height = under.bottom - under.top; }
      var floor = route ? { left: g.left, top: route.bottom + 4, right: g.right, bottom: g.bottom - 4 } : null;
      if (floor) { floor.width = floor.right - floor.left; floor.height = floor.bottom - floor.top; }
      return { game: box(g), header: box(hdr), mute: box(mute), underMute: under, floor: floor };
    },
    muted: function () { return pref; },
    setMuted: function (v) {
      pref = !!v; savePref();
      if (gateOpen()) applyPref(); else if (pref) stopTheirSound();
    },
    // Localhost autoplay only (gamebull/ui/DevAuto.tsx, every frame): swipes through their own pointer handlers on #game
    // (pointerdown, pointermove, pointerup), with the swipe length worked out from their own launch formula so the mug
    // stops where it aims: their 300 end zone 35 %, an ordinary stop 55 %, the wall 10 %. Their code decides every throw.
    autoStep: function () {
      var g = el("game"); if (!g) return;
      var r = g.getBoundingClientRect(), y = r.top + r.height * 0.55, x0 = r.left + r.width * 0.85;
      var fire = function (type, x) { g.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", isPrimary: true, bubbles: true, cancelable: true })); };
      if (auto && auto.down) {
        var dt = Math.max(0.08, (performance.now() - auto.t) / 1000);
        if (dt < 0.14) return;
        var strength = Math.min(1.8, Math.max(0.15, Math.sqrt(Math.max(0, auto.aim - 21) / (1900 - 21))));
        var dx = strength / (1.7 + 0.23 / dt);
        fire("pointermove", x0 - dx * r.width * 0.5);
        fire("pointerup", x0 - dx * r.width);
        log("[DEV] autoplay swipe: aiming at " + Math.round(auto.aim) + " (strength " + strength.toFixed(3) + ").");
        auto = null; return;
      }
      if (!window.SYClient.canThrow()) return;
      var k = Math.random();
      auto = { down: true, t: performance.now(), aim: k < 0.35 ? 1960 : k < 0.9 ? 300 + Math.random() * 1590 : 2100 };
      try { fire("pointerdown", x0); } catch (e) { /* their setPointerCapture on a synthetic pointer */ }
    },
  };
  var auto = null;
  window.dispatchEvent(new Event("syclient-ready"));
})();
