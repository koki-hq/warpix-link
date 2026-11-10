// ---------- メニュー（v2.0、左上の 3 本線）：タブで わける ----------
// 本人「BGMオンオフとか　セレクトとかは　全部　歯車ボタンの中にいれる」「タブで分かれるようにね」。のちに 歯車 → 3 本線（「メニューボタンとして　そっちの方があってるわ」）。
// きろく（ワープの きろく）・はいけい・BGM・ひっこし（データの ひっこし、v1 の ふっかつの じゅもん）・アプリ（この アプリに ついて）。
// 中の 文字は よみやすい 文字（本人「わかりやすいフォントにしようか」）
const gear = (() => {
  const $ = (id) => document.getElementById(id);
  const dialog = $("gear");
  const tabs = [...dialog.querySelectorAll("[role=tab]")];
  const panels = Object.fromEntries(tabs.map((t) => [t.dataset.tab, $(`panel-${t.dataset.tab}`)]));
  let tab = "log";
  let range = "week";

  function select(id, focus = false) {
    tab = id;
    for (const t of tabs) {
      const on = t.dataset.tab === id;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[t.dataset.tab].hidden = !on;
      if (on && focus) t.focus();
    }
    renderers[id]?.();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => {
      select(t.dataset.tab);
      sound.sfx.hover();
    });
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      select(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true);
    });
  });

  // ---------- きろく ----------
  const RANGES = { today: "きょう", week: "こんしゅう", month: "こんげつ", all: "ぜんぶ" };
  function renderLog() {
    for (const b of panels.log.querySelectorAll("[data-range]")) b.setAttribute("aria-pressed", String(b.dataset.range === range));
    const q = warpLog.query(range);
    $("log-label").textContent = `${RANGES[range]}の ワープ`;
    $("log-total").textContent = q.total;
    $("log-top").textContent = q.rank[0]?.name ?? "—";
    const week = $("log-week");
    week.hidden = !q.week;
    if (q.week) {
      const max = Math.max(1, ...q.week.map((d) => d.n));
      $("log-week-bars").innerHTML = q.week
        .map((d) => `<div class="day${d.today ? " today" : ""}" aria-hidden="true"><span class="bar-n">${d.n}</span><span class="wbar" style="height:${Math.round((d.n / max) * 64)}px"></span><span class="bar-day">${d.label}</span></div>`)
        .join("");
      $("log-week-bars").setAttribute("aria-label", q.week.map((d) => `${d.label} ${d.n}かい`).join("、"));
    }
    const max = Math.max(1, ...q.rank.map((r) => r.n));
    $("log-rank").innerHTML = q.rank.length
      ? q.rank
          .slice(0, 10)
          .map((r) => { const c = CASSETTES.byId(r.id); return `<li><span class="icon" aria-hidden="true">${c ? pixelSvg(CASSETTES.iconOf(c)) : ""}</span><span class="rank-main"><span class="rank-name${/[^\x00-\x7f]/.test(r.name) ? " jp" : ""}">${esc(r.name)}</span><span class="rank-group">${esc(r.group)}</span><span class="rank-bar" style="width:${Math.max(4, Math.round((r.n / max) * 100))}%"></span></span><span class="rank-n">${r.n}<span class="sr-only">かい</span></span></li>`; })
          .join("")
      : `<li class="log-empty">まだ ${RANGES[range]}の きろくは ありません。<br>リンクを おすと、ここに たまって いきます。</li>`;
  }
  panels.log.addEventListener("click", (e) => {
    const b = e.target.closest("[data-range]");
    if (!b) return;
    range = b.dataset.range;
    renderLog();
    sound.sfx.hover();
  });
  $("log-clear").addEventListener("click", () => {
    if (!confirm("ワープの きろくを ぜんぶ けしますか？ もとには もどせません。")) return;
    warpLog.clear();
    renderLog();
  });

  // ---------- 背景 ----------
  function renderSky() {
    for (const b of panels.sky.querySelectorAll("[data-sky]")) b.setAttribute("aria-pressed", String(b.dataset.sky === settings.state.sky));
  }
  panels.sky.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sky]");
    if (!b) return;
    settings.set({ sky: b.dataset.sky });
    renderSky();
    sound.sfx.select();
  });

  // ---------- BGM ----------
  function renderBgm() {
    const s = settings.state;
    $("bgm-switch").setAttribute("aria-checked", String(s.bgm));
    $("bgm-switch").textContent = s.bgm ? "BGM ON" : "BGM OFF";
    $("bgm-vol").value = s.bgmVol;
    $("se-vol").value = s.seVol;
    $("bgm-vol-n").textContent = s.bgmVol;
    $("se-vol-n").textContent = s.seVol;
  }
  $("bgm-switch").addEventListener("click", () => {
    settings.set({ bgm: !settings.state.bgm });
    if (settings.state.bgm) sound.bgmPlay();
    else sound.bgmStop();
    renderBgm();
  });
  $("bgm-vol").addEventListener("input", (e) => {
    settings.set({ bgmVol: Number(e.target.value) });
    renderBgm();
  });
  $("se-vol").addEventListener("input", (e) => {
    settings.set({ seVol: Number(e.target.value) });
    renderBgm();
  });
  $("se-vol").addEventListener("change", () => sound.sfx.select());

  // ---------- データの ひっこし ----------
  // グループ・リンク・きろく・せってい（warpix-v2- で はじまる もの）を 1 つの コードに する。どこにも おくらない
  const PREFIX = "WARPIX2-";
  const toB64 = (bytes) => {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  };
  const fromB64 = (text) => Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
  const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  const canZip = typeof CompressionStream === "function";
  function collect() {
    const data = {};
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("warpix-v2-")) data[k] = localStorage.getItem(k);
    } catch {}
    return data;
  }
  async function encode(data = collect()) {
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 2, data }));
    return canZip ? `${PREFIX}z${toB64(await through(bytes, new CompressionStream("deflate-raw")))}` : `${PREFIX}j${toB64(bytes)}`;
  }
  async function decode(code) {
    try {
      const text = String(code).replace(/\s+/g, "");
      if (!text.startsWith(PREFIX)) return null;
      const kind = text[PREFIX.length];
      let bytes = fromB64(text.slice(PREFIX.length + 1));
      if (kind === "z") bytes = await through(bytes, new DecompressionStream("deflate-raw"));
      else if (kind !== "j") return null;
      const box = JSON.parse(new TextDecoder().decode(bytes));
      if (box?.v !== 2 || typeof box.data !== "object" || !box.data) return null;
      if (!Object.entries(box.data).every(([k, v]) => k.startsWith("warpix-v2-") && typeof v === "string")) return null;
      return box.data;
    } catch {
      return null;
    }
  }
  const moveMsg = $("move-msg");
  const say = (text, ok = true) => {
    moveMsg.textContent = text;
    moveMsg.classList.toggle("bad", !ok);
  };
  $("move-copy").addEventListener("click", async () => {
    const code = await encode();
    try {
      await navigator.clipboard.writeText(code);
      say("コードを コピーしました。メモアプリや メールで、あたらしい スマホに わたしてください。");
    } catch {
      $("move-input").value = code;
      $("move-input").select();
      say("コピー できなかったので、したの らんに いれました。えらんで コピーしてください。", false);
    }
  });
  $("move-file").addEventListener("click", async () => {
    const code = await encode();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    a.download = `warpix-link-${ymdOf(today())}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say("ファイルに ほぞんしました。");
  });
  async function take(text) {
    const data = await decode(text);
    if (!data) return say("コードが ちがうみたいです。さいごまで まるごと はりつけてください。", false);
    if (!confirm("いまの グループ・リンク・きろくを、コードの ものに いれかえますか？")) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("warpix-v2-")).forEach((k) => localStorage.removeItem(k));
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
    } catch {
      return say("ほぞん できませんでした。ブラウザの せっていを たしかめてください。", false);
    }
    say("うけとりました。よみなおします。");
    setTimeout(() => location.reload(), 600);
  }
  $("move-take").addEventListener("click", () => take($("move-input").value));
  $("move-open").addEventListener("click", () => $("move-file-input").click());
  $("move-file-input").addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (f) take(await f.text());
    e.target.value = "";
  });

  // ---------- アプリに ついて ----------
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const kind = () => `${ios ? "iPhone・iPad" : /Android/.test(navigator.userAgent) ? "Android" : "パソコン"}${pocket.standalone() ? "（ホームがめんの アプリ）" : "（ブラウザ）"}`;
  async function version() {
    try {
      return (await (await fetch("sw.js")).text()).match(/warpix-v(\d+\.\d+(?:\.\d+)?)/)?.[1]?.replace(/\.0$/, "") ?? "?";
    } catch {
      return "?";
    }
  }
  async function renderAbout() {
    const v = await version();
    $("about-version").textContent = `v${v}`;
    const body = ["ピクセへ", "", "（ここに かいてね）", "", "", "──", `WARPIX LINK v${v}`, kind()].join("\n");
    $("otegami").href = `mailto:pixe@warpix.app?subject=${encodeURIComponent("ピクセに おてがみ")}&body=${encodeURIComponent(body)}`;
  }
  $("about-manual").addEventListener("click", () => {
    dialog.close();
    manual.open();
  });
  $("about-reset").addEventListener("click", () => {
    if (!confirm("グループ・リンク・じぶんの リンク・きろく・せっていを ぜんぶ けして、はじめからに しますか？ もとには もどせません。")) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("warpix-v2-")).forEach((k) => localStorage.removeItem(k));
    } catch {}
    location.reload();
  });

  const renderers = { log: renderLog, sky: renderSky, bgm: renderBgm, about: renderAbout };

  function open(id = tab) {
    moveMsg.textContent = "";
    select(id);
    dialog.showModal();
    sound.sfx.select();
  }
  $("menu-btn").addEventListener("click", () => open());
  $("gear-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());

  return { open, select, encode, decode, tab: () => tab };
})();
