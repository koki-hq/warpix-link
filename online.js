// ---------- ほかの訪問者と同じ空（Supabase Realtime） ----------
// - いま見ている人のピクセが、空にふわふわ浮かぶ（Presence）
// - だれかがピクセをつつくと、ほかの人の画面でもそのピクセが跳ねる（Broadcast）
// - 浮かんでいるピクセをクリックすると、その人に「てを ふる」
// - 世界中でつつかれた回数などを数える（counters テーブルと bump 関数）
// 送るのはランダムな番号と帽子の種類だけ。名前や場所は送らない。
const online = (() => {
  const cfg = window.WARPIX_ONLINE ?? {};
  const countEl = document.getElementById("online-count");
  const recordEl = document.getElementById("world-record");
  if (!cfg.url || !cfg.key) return { enabled: false };

  const SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
  const MAX_GHOSTS = 8;
  const me = Math.random().toString(36).slice(2, 10);
  const ghosts = new Map(); // id → 要素
  const pending = { pokes: 0, warps: 0, ufos: 0 };
  let client = null;
  let channel = null;
  let hat = null;
  let metSomeone = false;
  let peopleNow = 1;
  // ほかのファイル（raid.js など）が受け取りたい合図。接続する前に登録してもらう
  const listeners = {};

  function loadSdk() {
    return new Promise((resolve, reject) => {
      if (window.supabase) return resolve();
      const s = document.createElement("script");
      s.src = SDK;
      s.onload = resolve;
      s.onerror = reject;
      document.head.append(s);
    });
  }

  // 番号から、空のどこに浮かぶかを決める（同じ人はいつも同じ場所）。
  // リンクボタンの上にかぶらないよう、広い画面では左右の余白、せまい画面ではタイトルの上の帯に浮かべる
  function spot(id) {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; // >>> で符号なしのまま
    const r1 = (h % 1000) / 1000;
    const r2 = ((h >>> 10) % 1000) / 1000;
    const margin = (innerWidth - 480) / 2;
    if (margin > 72) {
      const x = 16 + r1 * (margin - 72);
      return { left: `${h & 1 ? x : innerWidth - x - 32}px`, top: `${15 + r2 * 70}vh` };
    }
    // HUD（左上、幅 112px まで）と月・BGM ボタン（右上）のあいだ。上のボタンの列（〜46px）より下に浮かべる
    return { left: `${128 + r1 * Math.max(0, innerWidth - 128 - 128)}px`, top: `${50 + r2 * 36}px` };
  }

  function ghostSvg(hatId) {
    const hats = { ...wardrobeHats() };
    // ほかの人のピクセなので、自分のピクセの成長（マントなど）は着せない
    return pixelSvg(dress(NPC.idle, hatId && hats[hatId] ? hats[hatId] : null, []));
  }

  // きせかえの帽子データを借りる（world.js の wardrobe が持っている）
  function wardrobeHats() {
    return wardrobe.hats?.() ?? {};
  }

  let othersHats = []; // いま おなじ そらに いる ほかの ひとの ぼうし（開店の よるの せいざで つかう、v1.42）
  function render(state) {
    const ids = Object.keys(state).filter((id) => id !== me);
    othersHats = ids.map((id) => state[id][0]?.hat ?? null);
    countEl.hidden = false;
    countEl.querySelector("b").textContent = String(ids.length + 1);
    peopleNow = ids.length + 1;

    // いなくなった人のピクセを消す
    for (const [id, el] of ghosts) {
      if (!state[id]) {
        el.classList.add("leaving");
        setTimeout(() => el.remove(), 400);
        ghosts.delete(id);
      }
    }
    // 新しく来た人のピクセを出す
    for (const id of ids.slice(0, MAX_GHOSTS)) {
      const info = state[id][0] ?? {};
      let el = ghosts.get(id);
      if (!el) {
        el = document.createElement("button");
        el.type = "button";
        el.className = "ghost";
        emit("seen", { id: "visitor" });
        el.setAttribute("aria-label", "ほかの ひとの ピクセに てを ふる");
        const { left, top } = spot(id);
        el.style.left = left;
        el.style.top = top;
        el.style.animationDelay = `${-(parseFloat(left) % 7) / 3}s`;
        el.addEventListener("click", (e) => wave(id, el, e));
        document.body.append(el);
        ghosts.set(id, el);
      }
      if (el.dataset.hat !== String(info.hat)) {
        el.dataset.hat = String(info.hat);
        el.innerHTML = ghostSvg(info.hat);
      }
    }
    if (ids.length && !metSomeone) {
      metSomeone = true;
      achievements.unlock("online");
      const tell = () => {
        if (!npc.ready() || playing()) return setTimeout(tell, 4000);
        npc.say([
          ids.length === 1 ? "あれ？ いま ほかにも\nだれかが みてる！" : `いま ${ids.length + 1}にんで\nおなじ そらを みてる！`,
          "そらに うかんでる ピクセを\nクリックすると てを ふれるよ。",
        ]);
      };
      tell();
    }
  }

  function bounce(el) {
    el.classList.remove("hop");
    void el.offsetWidth;
    el.classList.add("hop");
  }

  function wave(id, el, e) {
    bounce(el);
    sound.sfx.coin();
    score.add(10, e.clientX, e.clientY);
    channel?.send({ type: "broadcast", event: "wave", payload: { from: me, to: id } });
    achievements.unlock("hello");
  }

  async function loadCounters() {
    if (!client) return;
    const { data, error } = await client.from("counters").select("id, value");
    if (error || !data) return;
    recordEl.hidden = false;
    for (const row of data) {
      const el = recordEl.querySelector(`[data-counter="${row.id}"]`);
      if (el) el.textContent = Number(row.value).toLocaleString("ja-JP");
    }
  }

  // つついた回数などは、まとめて 3 秒ごとに送る（1 回で増やせるのは 20 まで）
  async function flush() {
    if (!client) return;
    for (const k of Object.keys(pending)) {
      const n = Math.min(pending[k], 20);
      if (!n) continue;
      pending[k] -= n;
      await client.rpc("bump", { counter: k, n }).catch(() => {});
    }
  }

  async function connect() {
    try {
      await loadSdk();
    } catch {
      return; // オフラインなど。オンライン機能なしでそのまま遊べる
    }
    client = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
    channel = client.channel("warpix-sky", { config: { presence: { key: me }, broadcast: { self: false } } });
    channel
      .on("presence", { event: "sync" }, () => render(channel.presenceState()))
      .on("broadcast", { event: "poke" }, ({ payload }) => {
        const el = ghosts.get(payload.from);
        if (el) bounce(el);
      })
      .on("broadcast", { event: "wave" }, ({ payload }) => {
        if (payload.to !== me) return;
        const el = ghosts.get(payload.from);
        if (el) bounce(el);
        npc.jump();
        sound.sfx.coin();
        npc.say(["だれかが てを\nふって くれた！", "……ぼくも ふりかえして みよう。"]);
        achievements.unlock("hello");
      });
    for (const [event, fns] of Object.entries(listeners)) {
      channel.on("broadcast", { event }, ({ payload }) => fns.forEach((fn) => fn(payload)));
    }
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") channel.track({ hat });
    });
    hat = wardrobe.currentId();
    setInterval(flush, 3000);
    loadCounters();
  }

  on("boot", connect);
  on("hat", ({ id }) => {
    hat = id;
    channel?.track({ hat });
  });
  on("poke", () => {
    pending.pokes++;
    channel?.send({ type: "broadcast", event: "poke", payload: { from: me } });
  });
  on("warp", () => pending.warps++);
  on("ufo-down", () => pending.ufos++);
  on("notebook-tab", ({ which }) => which === "trophy" && loadCounters());
  addEventListener("pagehide", () => {
    flush();
    channel?.untrack();
  });

  return {
    enabled: true,
    me,
    // いま同じ空を見ている人数（自分をふくむ）
    count: () => peopleNow,
    // じぶんと、いま おなじ そらに いる ひとの ぼうし
    hats: () => [hat, ...othersHats],
    listen(event, fn) {
      (listeners[event] ??= []).push(fn);
    },
    send(event, payload) {
      channel?.send({ type: "broadcast", event, payload: { ...payload, from: me } });
    },
  };
})();
