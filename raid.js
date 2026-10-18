// ---------- みんなでマザーシップ（レイド） ----------
// 時計の 0・10・20…分ちょうどに、そのとき見ている全員の空へ「同じ」マザーシップが来る。
// HP はみんなで共有。だれかが撃つたびに、全員の画面で減る（Supabase の同じ空で知らせ合う）。
// データベースは使わない。オンライン機能がないときは来ない。
const raid = (() => {
  const PERIOD = 10 * 60 * 1000; // 10 分おき（v1.30.1 で 5 分から。のんびり かくし要素を さがす あいだに なんども こないように）
  const DURATION = 60 * 1000; // 60 秒以内に倒す
  const WARN = 10 * 1000; // 10 秒前に予告
  const HP_PER_PLAYER = 30;
  const slotOf = (t) => Math.floor(t / PERIOD);
  const startOf = (slot) => slot * PERIOD;
  const next = () => startOf(slotOf(Date.now()) + 1);

  // ---------- しゅうらいの よる（v1.40）：まいつき さいしょの にちようびの 21:00（日本時間）は だい マザーシップ ----------
  // SNS で 予告して、その じかんに みんなで あつまる 日。HP は 3 ばい、3 ぷんかん、きんいろ
  const JST = 9 * 60 * 60 * 1000;
  const NIGHT_HOUR = 21;
  const jst = (t) => new Date(t + JST); // getUTC… で 日本の 日付・じこくが よめる
  const isNightDay = (t) => { const d = jst(t); return d.getUTCDay() === 0 && d.getUTCDate() <= 7; };
  const isNight = (slot) => { const d = jst(startOf(slot)); return isNightDay(startOf(slot)) && d.getUTCHours() === NIGHT_HOUR && d.getUTCMinutes() === 0; };
  const durationOf = (slot) => (isNight(slot) ? 3 * 60 * 1000 : DURATION);
  const hpPerPlayer = (slot) => (isNight(slot) ? HP_PER_PLAYER * 3 : HP_PER_PLAYER);
  // つぎの しゅうらいの よる（その 時刻）
  function nextNight(from = Date.now()) {
    const d = jst(from);
    for (let m = 0; m < 3; m++) {
      const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m, 1));
      const sunday = 1 + ((7 - first.getUTCDay()) % 7);
      const at = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), sunday, NIGHT_HOUR) - JST;
      if (at + 3 * 60 * 1000 > from) return at;
    }
    return null;
  }

  if (!online.enabled) return { next: () => null, nextNight, isNight };

  let cur = null; // { slot, hp, max, hits, players, el, ... }
  let warned = -1;
  let done = -1;
  let outbox = 0; // まだ送っていない自分の攻撃
  let missedTimer = 0;

  const visible = () =>
    document.body.classList.contains("booted") && !simple.on && !document.hidden && !game.isOpen() && !dozing();

  // ---------- 表示 ----------
  function build() {
    const el = document.createElement("div");
    el.className = "raid";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "みんなで マザーシップ");
    const night = isNight(cur.slot);
    el.classList.toggle("night", night);
    el.innerHTML = `
      <p class="raid-title">${night ? "しゅうらいの よる！ だい マザーシップ" : "RAID! みんなで マザーシップ"}</p>
      <div class="raid-bar"><span class="raid-fill"></span></div>
      <p class="raid-info"><span class="raid-hp">HP ---</span><span class="raid-people"></span><span class="raid-time"></span></p>
      <button type="button" class="raid-ship" aria-label="マザーシップを うつ">${pixelSvg(MOTHERSHIP)}</button>`;
    el.querySelector(".raid-ship").addEventListener("click", hit);
    document.body.append(el);
    return el;
  }

  function render() {
    if (!cur) return;
    const { el, hp, max } = cur;
    el.querySelector(".raid-hp").textContent = hp === null ? "HP ---" : `HP ${hp}/${max}`;
    el.querySelector(".raid-fill").style.width = hp === null ? "100%" : `${(hp / max) * 100}%`;
    el.querySelector(".raid-people").textContent = `${Math.max(cur.players.size, online.count())}にん`;
    const left = Math.max(0, Math.ceil((startOf(cur.slot) + durationOf(cur.slot) - Date.now()) / 1000));
    el.querySelector(".raid-time").textContent = `のこり ${left}びょう`;
  }

  // ほかの人の攻撃は、マザーシップのどこかに小さな火花で見せる
  function spark() {
    const ship = cur?.el.querySelector(".raid-ship");
    if (!ship) return;
    const s = document.createElement("span");
    s.className = "raid-spark";
    s.innerHTML = pixelSvg(BOOM);
    s.style.left = `${10 + Math.random() * 75}%`;
    s.style.top = `${Math.random() * 60}%`;
    ship.append(s);
    setTimeout(() => s.remove(), 350);
  }

  function flash() {
    const ship = cur.el.querySelector(".raid-ship");
    ship.classList.remove("hurt");
    void ship.offsetWidth;
    ship.classList.add("hurt");
  }

  // ---------- 始まり・終わり ----------
  function join(slot) {
    emit("seen", { id: "raid" });
    cur = { slot, hp: null, max: null, owner: null, hits: 0, players: new Set([online.me]), el: null };
    cur.el = build();
    render();
    sound.sfx.rumble();
    // すでに始まっていれば、だれかが今の HP を教えてくれる
    online.send("raid-ask", { slot });
    // だれも答えなければ、自分が人数ぶんの HP で始める
    clearTimeout(missedTimer);
    missedTimer = setTimeout(() => {
      if (!cur || cur.slot !== slot || cur.hp !== null) return;
      const max = hpPerPlayer(slot) * Math.max(1, online.count());
      adopt(max, max, online.me);
      online.send("raid-state", { slot, hp: max, max });
    }, 700 + Math.random() * 900);
    if (npc.isAway()) return;
    if (isNight(slot)) npc.say(["しゅうらいの よるだ！\nきんいろの だい マザーシップ！", "3ぷん いないに\nみんなで うちおとそう！"]);
    else npc.say(["きた！ みんなの そらに\nマザーシップ！", "60びょう いないに\nみんなで うちおとそう！"]);
  }

  function adopt(hp, max, owner) {
    cur.hp = hp;
    cur.max = max;
    cur.owner = owner;
    render();
  }

  function finish() {
    if (!cur) return;
    done = cur.slot;
    const el = cur.el;
    cur = null;
    setTimeout(() => el.remove(), 1000);
    return el;
  }

  function win() {
    if (!cur || done === cur.slot) return;
    // うった 人 だけで なく、その とき おなじ そらに いた 人も なかま（HP も その 人数で きまる。v1.46）
    const players = Math.max(cur.players.size, online.count(), 1);
    const mine = cur.hits;
    const night = isNight(cur.slot);
    const el = finish();
    el.classList.add("down");
    el.querySelector(".raid-ship").innerHTML = pixelSvg(BOOM) + pixelSvg(BOOM) + pixelSvg(BOOM);
    [0, 180, 360, 540].forEach((d) => setTimeout(sound.sfx.boom, d));
    stars.warp(2000);
    if (mine > 0 && night) {
      score.add(20000, innerWidth / 2, 160);
      achievements.unlock("raid");
      achievements.unlock("raid-night");
      emit("raid-win", { players, hits: mine, night: true });
      grow.write("raid-night", `しゅうらいの よるに、${players}にんで だい マザーシップを たおした。`, { force: true });
      npc.say([`しゅうらいの よるを\n${players}にんで のりきった！`, `きみは ${mine}かい うった。\nらいげつも あつまろうね！`]);
    } else if (mine > 0) {
      score.add(5000, innerWidth / 2, 160);
      achievements.unlock("raid");
      emit("raid-win", { players, hits: mine });
      npc.say([`みんなで たおした！\n${players}にんの ヒーロー！`, `きみは ${mine}かい うった。\nかっこよかった！`]);
    } else {
      npc.say(["だれかが マザーシップを\nたおした！ すごい！"]);
    }
  }

  function escape() {
    if (!cur) return;
    const el = finish();
    el.classList.add("escape");
    npc.say(["にげられた……", "つぎは 10ぷんご！\nまた みんなで あつまろう。"]);
  }

  // ---------- 攻撃 ----------
  function hit(e) {
    if (!cur || cur.hp === null || cur.hp <= 0) return;
    cur.hp--;
    cur.hits++;
    outbox++;
    flash();
    sound.sfx.hit();
    score.add(100, e.clientX, e.clientY);
    render();
    if (cur.hp <= 0) {
      flushOutbox();
      online.send("raid-down", { slot: cur.slot });
      win();
    }
  }

  // 攻撃はまとめて 0.25 秒ごとに送る（たくさん連打しても送りすぎない）
  function flushOutbox() {
    if (!outbox || !cur) return;
    online.send("raid-hit", { slot: cur.slot, n: outbox });
    outbox = 0;
  }
  setInterval(flushOutbox, 250);

  // ---------- 合図を受け取る ----------
  online.listen("raid-ask", (p) => {
    if (cur && cur.slot === p.slot && cur.hp !== null) online.send("raid-state", { slot: cur.slot, hp: cur.hp, max: cur.max });
  });
  online.listen("raid-state", (p) => {
    if (!cur || cur.slot !== p.slot) return;
    cur.players.add(p.from);
    if (cur.hp === null) adopt(p.hp, p.max, p.from);
    // ふたりが同時に始めてしまったときは、大きい HP と、進んでいるほうの残りにそろえる
    else if (p.max !== cur.max || p.hp < cur.hp) adopt(Math.min(cur.hp, p.hp), Math.max(cur.max, p.max), cur.owner);
  });
  online.listen("raid-hit", (p) => {
    if (!cur || cur.slot !== p.slot) return;
    cur.players.add(p.from);
    if (cur.hp === null) return;
    cur.hp = Math.max(0, cur.hp - p.n);
    for (let i = 0; i < Math.min(p.n, 4); i++) setTimeout(spark, i * 60);
    render();
    if (cur.hp <= 0) win();
  });
  online.listen("raid-down", (p) => {
    if (cur && cur.slot === p.slot) win();
  });

  // ---------- 1 秒ごとに時計を見る ----------
  setInterval(() => {
    const now = Date.now();
    const slot = slotOf(now);
    const into = now - startOf(slot);

    // 予告（10 秒前）
    if (next() - now <= WARN && warned !== slot + 1 && visible() && npc.ready()) {
      warned = slot + 1;
      npc.say(isNight(slot + 1)
        ? ["……そらが きんいろに ひかってる。", "しゅうらいの よるが\nはじまる……！"]
        : ["……そらが ざわざわ してる。", "みんなの そらに\nなにか くる……！"]);
    }

    if (cur) {
      if (cur.slot !== slot || into >= durationOf(cur.slot)) escape();
      else render();
      return;
    }
    if (into < durationOf(slot) && done !== slot && visible()) join(slot);
  }, 1000);

  // 実績画面の WORLD RECORD に、次のレイドまでの時間を出す
  const nextEl = document.getElementById("raid-next");
  setInterval(() => {
    const ms = next() - Date.now();
    nextEl.textContent = cur ? "いま！" : `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  }, 1000);

  // しゅうらいの よるの 日は、ひらいた ときに ピクセが 予告する（21 じ まえ だけ、1 日 1 かい）
  on("boot", () => {
    const now = Date.now();
    const at = nextNight(now);
    if (!at || !isNightDay(now) || now >= at || simple.on) return;
    const day = jst(now).toISOString().slice(0, 10);
    if (store.get("warpix-raid-night-told", null) === day) return;
    store.set("warpix-raid-night-told", day);
    npc.addIntro("こんや 21じ、きんいろの\nだい マザーシップが くるって……！");
    npc.addIntro("しゅうらいの よるだよ。\nみんなで あつまろう！");
  });

  return { next, nextNight, isNight, active: () => !!cur };
})();
