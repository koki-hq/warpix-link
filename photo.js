// ---------- はいけい（v2.3 → v2.4）：ひる・ゆうがた・よる＋じぶんの がぞう 9 まいまで ----------
// 本人「自分だけの画像とかアップロードして追加とかもできるようにできたりする？」（v2.3）、
// 「１２枚にしようか最大枚数　だから９枚まで追加できる感じ　そしたら３列でも４列でも綺麗に見えるはず」（v2.4）。メニューは 3 れつ、グループの へんしゅうは 4 れつ。
// がぞうは メニューと グループで おなじ 一覧（グループで 入れた がぞうも メニューや ほかの グループで えらべる）。
// メニューの「はいけい」は 全部の グループ 共通。グループの へんしゅうの スイッチ「この グループだけの はいけい」が ON なら そちら。
// がぞうは この ブラウザの なか だけ（IndexedDB）。どこにも おくらない。トリミング（まんなかの わく、デザイン案 B）して 画面の 大きさで ほぞん。
// 見せかたは そのまま すこし くらく。ます目は かさねない（本人「写真すっきり見せたい」）。月・ほし・くもは うえに のこる
const photoBg = (() => {
  const C = CASSETTES;
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const skyBg = document.querySelector(".sky-bg");
  const MAX = 9; // v2.4：9 まい（ひる・ゆうがた・よると あわせて 12。3 れつでも 4 れつでも ぴったり、本人）
  const PRESETS = [
    ["day", "ひる"],
    ["evening", "ゆうがた"],
    ["night", "よる"],
  ];
  const isPhoto = (v) => /^p-[a-z0-9]+$/.test(v ?? "");

  // ---------- ほぞん（IndexedDB：がぞうの id → Blob、ならびは localStorage） ----------
  const DB = "warpix-v2-photos";
  let dbp = null;
  function db() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("no indexedDB"));
    return (dbp ??= new Promise((resolve, reject) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore("photos");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    }));
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction("photos", mode);
      const req = fn(t.objectStore("photos"));
      t.oncomplete = () => resolve(req?.result);
      t.onerror = () => reject(t.error);
    });
  }
  const getBlob = (id) => tx("readonly", (s) => s.get(id)).catch(() => null);
  const putBlob = (id, blob) => tx("readwrite", (s) => s.put(blob, id));
  const delBlob = (id) => tx("readwrite", (s) => s.delete(id)).catch(() => {});
  let list = (store.get(KEY.photos, []) ?? []).filter(isPhoto).slice(0, MAX);
  const saveList = () => store.set(KEY.photos, list);
  const newId = () => `p-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const urls = new Map(); // id → object URL
  async function urlOf(id) {
    if (urls.has(id)) return urls.get(id);
    const blob = await getBlob(id);
    if (!blob) return null;
    const u = URL.createObjectURL(blob);
    urls.set(id, u);
    return u;
  }
  function dropUrl(id) {
    const u = urls.get(id);
    if (u) URL.revokeObjectURL(u);
    urls.delete(id);
  }

  // v2.3 の グループの がぞう（グループの id で ほぞん）を 一覧へ うつす
  const migrated = (async () => {
    for (const g of C.groups()) {
      if (!g.bg?.photo) continue;
      const blob = await getBlob(g.id);
      if (blob && list.length < MAX) {
        const id = newId();
        await putBlob(id, blob).catch(() => {});
        list.push(id);
        saveList();
        C.setBg(g.id, { sky: g.bg.sky === "photo" ? id : g.bg.sky, photo: undefined });
      } else C.setBg(g.id, { sky: g.bg.sky === "photo" ? "night" : g.bg.sky, photo: undefined });
      await delBlob(g.id);
    }
  })().catch(() => {});

  // ---------- いま 見せる はいけい ----------
  // グループだけの はいけいが ON なら そちら、OFF なら メニューの はいけい
  const chosen = () => {
    const g = C.current();
    return g?.bg?.own ? g.bg.sky : settings.state.sky;
  };
  let applying = 0;
  async function apply() {
    const v = chosen();
    const n = ++applying;
    if (isPhoto(v)) {
      const u = await urlOf(v);
      if (n !== applying) return;
      if (u) {
        settings.showSky("night"); // 月・くもの いろは よるの もの
        skyBg.style.setProperty("--photo", `url("${u}")`);
        root.classList.add("has-photo");
        return;
      }
    }
    root.classList.remove("has-photo");
    skyBg.style.removeProperty("--photo");
    const g = C.current();
    settings.showSky(g?.bg?.own && !isPhoto(v) ? v : null);
  }

  // ---------- 一覧（メニューと グループの へんしゅうで おなじ もの） ----------
  // where：menu か group。選んで いるのが がぞうの ときだけ［かえる］［けす］（本人「デフォルトの３つ選択してる時は出ないようにしたほうが誤解がないかも」）
  const libs = { menu: { grid: $("menu-lib"), btns: $("menu-lib-btns") }, group: { grid: $("group-lib"), btns: $("group-lib-btns") } };
  const selectedOf = (where) => (where === "menu" ? settings.state.sky : C.current()?.bg?.sky ?? "night");
  async function renderLib(where) {
    const { grid, btns } = libs[where];
    const sel = selectedOf(where);
    const cards = PRESETS.map(([k, name]) => `<button type="button" role="radio" class="bg-card" data-bg="${k}" aria-checked="${sel === k}"><span class="sky-thumb" data-thumb="${k}"></span><b>${name}</b></button>`);
    for (const [i, id] of list.entries()) {
      const u = await urlOf(id);
      cards.push(`<button type="button" role="radio" class="bg-card" data-bg="${id}" aria-checked="${sel === id}"><span class="bg-photo" style="${u ? `background-image:url('${u}')` : ""}"></span><b>がぞう ${i + 1}</b></button>`);
    }
    if (list.length < MAX) cards.push(`<button type="button" class="bg-card bg-add" data-bg="add" aria-label="がぞうを ついか"><span class="bg-photo"><span aria-hidden="true">＋</span></span><b>ついか</b></button>`);
    grid.innerHTML = cards.join("");
    btns.hidden = !isPhoto(sel) || !list.includes(sel);
  }
  function choose(where, v) {
    if (where === "menu") settings.set({ sky: v });
    else if (C.current()) C.setBg(C.current().id, { sky: v });
    sound.sfx.select();
    renderAll();
    apply();
  }
  function renderAll() {
    renderLib("menu");
    if (C.current()) renderEdit();
  }
  let pickFor = null; // { where, replace }
  for (const where of ["menu", "group"]) {
    libs[where].grid.addEventListener("click", (e) => {
      const b = e.target.closest("[data-bg]");
      if (!b) return;
      if (b.dataset.bg === "add") {
        pickFor = { where, replace: null };
        return $("gbg-file").click();
      }
      choose(where, b.dataset.bg);
    });
    libs[where].btns.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-lib-act]");
      const id = selectedOf(where);
      if (!b || !isPhoto(id)) return;
      if (b.dataset.libAct === "change") {
        pickFor = { where, replace: id };
        return $("gbg-file").click();
      }
      if (!(await ask("この がぞうを 消しますか？ 使っている はいけいは よる に もどるよ。"))) return;
      await remove(id);
    });
  }
  // がぞうを けす：使って いる メニューと グループは よる に もどす
  async function remove(id) {
    list = list.filter((x) => x !== id);
    saveList();
    await delBlob(id);
    dropUrl(id);
    if (settings.state.sky === id) settings.set({ sky: "night" });
    for (const g of C.groups()) if (g.bg?.sky === id) C.setBg(g.id, { sky: "night" });
    renderAll();
    apply();
  }
  $("gbg-file").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) openTrim(f);
  });

  // ---------- グループの へんしゅう ----------
  const sw = $("gbg-switch");
  async function renderEdit() {
    const g = C.current();
    if (!g) return;
    const own = !!g.bg?.own;
    sw.setAttribute("aria-checked", String(own));
    sw.textContent = own ? "ON" : "OFF";
    $("gbg-off").hidden = own;
    $("gbg").hidden = !own;
    if (own) await renderLib("group");
  }
  sw.addEventListener("click", () => {
    const g = C.current();
    if (!g) return;
    C.setBg(g.id, { own: !g.bg?.own });
    sound.sfx.select();
    renderEdit();
    apply();
  });

  // ---------- トリミング（デザイン案 B：まんなかに 画面と おなじ かたちの わく） ----------
  const trim = $("trim-dialog");
  const stage = $("trim-stage");
  const img = $("trim-img");
  const zoomEl = $("trim-zoom");
  let view = null; // { W, H（わく）, SW, SH（画面）, iw, ih, s0, z, tx, ty }
  let trimUrl = null;
  // ボタンや セリフが くる ところ（いまの 画面から はかって、わくの 大きさに ちぢめる）
  function ghosts(k) {
    const sel = [".topbar", ".logo-row", ".npc", "#group-bar", "#links"];
    $("trim-ghosts").innerHTML = sel
      .map((q) => document.querySelector(q))
      .filter((el) => el && el.getClientRects().length)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `<span style="left:${r.left * k}px;top:${r.top * k}px;width:${r.width * k}px;height:${r.height * k}px"></span>`;
      })
      .join("");
  }
  function clamp() {
    const s = view.s0 * view.z;
    view.tx = Math.min(0, Math.max(view.W - view.iw * s, view.tx));
    view.ty = Math.min(0, Math.max(view.H - view.ih * s, view.ty));
  }
  function draw() {
    clamp();
    const s = view.s0 * view.z;
    img.style.width = `${view.iw * s}px`;
    img.style.height = `${view.ih * s}px`;
    img.style.transform = `translate(${view.tx}px, ${view.ty}px)`;
    zoomEl.value = Math.round(view.z * 100);
  }
  function zoomTo(z, cx = view.W / 2, cy = view.H / 2) {
    const s1 = view.s0 * view.z;
    view.z = Math.max(1, Math.min(4, z));
    const s2 = view.s0 * view.z;
    view.tx = cx - ((cx - view.tx) * s2) / s1;
    view.ty = cy - ((cy - view.ty) * s2) / s1;
    draw();
  }
  async function openTrim(file, target = pickFor ?? { where: C.current()?.bg?.own ? "group" : "menu", replace: null }) {
    pickFor = target;
    if (trimUrl) URL.revokeObjectURL(trimUrl);
    trimUrl = URL.createObjectURL(file);
    img.src = trimUrl;
    try {
      await img.decode();
    } catch {
      return ask("この がぞうは 開けなかったよ。べつの がぞうを 選んでね。", "とじる");
    }
    const SW = innerWidth;
    const SH = innerHeight;
    const k = Math.min((SH - 250) / SH, 0.78);
    const W = Math.round(SW * k);
    const H = Math.round(SH * k);
    stage.style.width = `${W}px`;
    stage.style.height = `${H}px`;
    ghosts(k);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const s0 = Math.max(W / iw, H / ih);
    view = { W, H, SW, SH, iw, ih, s0, z: 1, tx: (W - iw * s0) / 2, ty: (H - ih * s0) / 2 };
    draw();
    trim.showModal();
    sound.sfx.select();
  }
  const ptrs = new Map();
  let pinch = null;
  const local = (e) => {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture?.(e.pointerId);
    ptrs.set(e.pointerId, local(e));
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: view.z };
    }
  });
  stage.addEventListener("pointermove", (e) => {
    const p = ptrs.get(e.pointerId);
    if (!p || !view) return;
    const q = local(e);
    if (ptrs.size === 1) {
      view.tx += q.x - p.x;
      view.ty += q.y - p.y;
      p.x = q.x;
      p.y = q.y;
      return draw();
    }
    p.x = q.x;
    p.y = q.y;
    const [a, b] = [...ptrs.values()];
    if (pinch) zoomTo((pinch.z * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
  });
  const up = (e) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
  };
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", up);
  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const q = local(e);
      zoomTo(view.z * (e.deltaY < 0 ? 1.1 : 0.9), q.x, q.y);
    },
    { passive: false }
  );
  zoomEl.addEventListener("input", () => zoomTo(Number(zoomEl.value) / 100));
  function closeTrim() {
    trim.close();
    if (trimUrl) URL.revokeObjectURL(trimUrl);
    trimUrl = null;
    pickFor = null;
  }
  $("trim-no").addEventListener("click", closeTrim);
  trim.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeTrim();
  });
  // けってい：わくに 見えて いる ところを 画面の 大きさで 切りだして ほぞん（はば 900 まで、JPEG）。
  // あたらしい がぞうは 一覧の さいごに 足して、その場（メニュー か グループ）で えらぶ
  $("trim-yes").addEventListener("click", async () => {
    const target = pickFor;
    if (!view || !target) return closeTrim();
    const s = view.s0 * view.z;
    const k = Math.min(Math.min(devicePixelRatio || 1, 2), 900 / view.SW);
    const cv = document.createElement("canvas");
    cv.width = Math.round(view.SW * k);
    cv.height = Math.round(view.SH * k);
    cv.getContext("2d").drawImage(img, -view.tx / s, -view.ty / s, view.W / s, view.H / s, 0, 0, cv.width, cv.height);
    const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.82));
    closeTrim();
    const id = target.replace ?? newId();
    try {
      await putBlob(id, blob);
    } catch {
      return ask("がぞうを 保存できなかったよ。ブラウザの 設定を 確かめてね。", "とじる");
    }
    dropUrl(id);
    if (!list.includes(id)) {
      if (list.length >= MAX) return;
      list.push(id);
      saveList();
    }
    sound.sfx.coin();
    choose(target.where, id);
  });

  // ぜんぶ けす（アプリの きろくを ぜんぶ けす）
  function clearAll() {
    try {
      indexedDB.deleteDatabase(DB);
    } catch {}
  }

  migrated.then(apply);
  apply();
  return { apply, renderEdit, renderMenu: () => renderLib("menu"), clearAll, openTrim, urlOf, list: () => [...list], remove, MAX, ready: () => migrated };
})();
