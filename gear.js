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
  // 日・週・月・全部。◀ ▶ で 前の 日・週・月へ（v2.1、本人「過去の記録は参照できない作りか？」）
  const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
  let back = 0;
  const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  // 日付だけ（v2.1.1 で 日付を だし、v2.1.2 で「今日・先週」などの ことばは やめた。本人「書かなくてもわかる」）
  function when(q) {
    const s = new Date(`${q.from}T12:00:00`);
    const e = new Date(`${q.to}T12:00:00`);
    if (q.range === "today") return `${md(s)}（${WEEK[s.getDay()]}）`;
    if (q.range === "week") return `${md(s)}〜${md(e)}`;
    if (q.range === "month") return `${s.getFullYear()}年${s.getMonth() + 1}月`;
    if (q.range === "year") return `${s.getFullYear()}年`;
    return "全部";
  }
  function renderLog() {
    for (const b of panels.log.querySelectorAll("[data-range]")) b.setAttribute("aria-pressed", String(b.dataset.range === range));
    const q = warpLog.query(range, back);
    const label = when(q);
    $("log-nav").hidden = range === "all";
    $("log-when").textContent = label;
    $("log-older").disabled = !q.older;
    $("log-newer").disabled = back === 0;
    $("log-label").textContent = `${label} のワープ`;
    $("log-total").textContent = q.total;
    $("log-top").textContent = q.rank[0]?.name ?? "—";
    const week = $("log-week");
    week.hidden = !q.week;
    if (q.week) {
      const max = Math.max(1, ...q.week.map((d) => d.n));
      $("log-week-bars").innerHTML = q.week
        .map((d) => `<div class="day${d.today ? " today" : ""}" aria-hidden="true"><span class="bar-n">${d.n}</span><span class="wbar" style="height:${Math.round((d.n / max) * 64)}px"></span><span class="bar-day">${d.label}</span></div>`)
        .join("");
      $("log-week-bars").setAttribute("aria-label", q.week.map((d) => `${d.label} ${d.n}回`).join("、"));
    }
    const max = Math.max(1, ...q.rank.map((r) => r.n));
    $("log-rank").innerHTML = q.rank.length
      ? q.rank
          .slice(0, 10)
          .map((r) => { const c = CASSETTES.byId(r.id); return `<li><span class="icon" aria-hidden="true">${c ? pixelSvg(CASSETTES.iconOf(c)) : ""}</span><span class="rank-main"><span class="rank-name${/[^\x00-\x7f]/.test(r.name) ? " jp" : ""}">${esc(r.name)}</span><span class="rank-group">${esc(r.group)}</span><span class="rank-bar" style="width:${Math.max(4, Math.round((r.n / max) * 100))}%"></span></span><span class="rank-n">${r.n}<span class="sr-only">回</span></span></li>`; })
          .join("")
      : `<li class="log-empty">${label}の記録はありません。<br>リンクを押すと、ここにたまっていきます。</li>`;
  }
  $("log-older").addEventListener("click", () => {
    back++;
    renderLog();
    sound.sfx.hover();
  });
  $("log-newer").addEventListener("click", () => {
    back = Math.max(0, back - 1);
    renderLog();
    sound.sfx.hover();
  });
  panels.log.addEventListener("click", (e) => {
    const b = e.target.closest("[data-range]");
    if (!b) return;
    range = b.dataset.range;
    back = 0;
    renderLog();
    sound.sfx.hover();
  });
  $("log-clear").addEventListener("click", async () => {
    if (!(await ask("ワープの記録を全部消しますか？ 元には戻せません。"))) return;
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
    $("bgm-switch").textContent = s.bgm ? "ON" : "OFF";
    $("se-switch").setAttribute("aria-checked", String(s.se));
    $("se-switch").textContent = s.se ? "ON" : "OFF";
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
  // 効果音だけ けせる（v2.1、本人「効果音　オフのボタンも作った方がいい」）
  $("se-switch").addEventListener("click", () => {
    settings.set({ se: !settings.state.se });
    renderBgm();
    sound.sfx.select();
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
      say("コードをコピーしました。メモアプリやメールで、新しいスマホに渡してください。");
    } catch {
      $("move-input").value = code;
      $("move-input").select();
      say("コピーできなかったので、下の欄に入れました。選んでコピーしてください。", false);
    }
  });
  $("move-file").addEventListener("click", async () => {
    const code = await encode();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    a.download = `warpix-link-${ymdOf(today())}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say("ファイルに保存しました。");
  });
  async function take(text) {
    const data = await decode(text);
    if (!data) return say("コードが違うようです。最後までまるごと貼り付けてください。", false);
    if (!(await ask("今のグループ・リンク・記録を、コードのものに入れ替えますか？", "いれかえる"))) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("warpix-v2-")).forEach((k) => localStorage.removeItem(k));
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
    } catch {
      return say("保存できませんでした。ブラウザの設定を確かめてください。", false);
    }
    say("受け取りました。読み直します。");
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
  const kind = () => `${ios ? "iPhone・iPad" : /Android/.test(navigator.userAgent) ? "Android" : "パソコン"}${pocket.standalone() ? "（ホーム画面のアプリ）" : "（ブラウザ）"}`;
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
    const body = ["ピクセへ", "", "（ここに書いてね）", "", "", "──", `WARPIX LINK v${v}`, kind()].join("\n");
    $("otegami").href = `mailto:pixe@warpix.app?subject=${encodeURIComponent("ピクセにお手紙")}&body=${encodeURIComponent(body)}`;
  }
  $("about-manual").addEventListener("click", () => {
    dialog.close();
    manual.open();
  });
  $("about-reset").addEventListener("click", async () => {
    if (!(await ask("グループ・リンク・自分のリンク・記録・設定を全部消して、最初からにしますか？ 元には戻せません。"))) return;
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
