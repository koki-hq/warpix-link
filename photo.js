// ---------- グループだけの はいけい（v2.3）：ひる・ゆうがた・よる・じぶんの がぞう ----------
// 本人「自分だけの画像とかアップロードして追加とかもできるようにできたりする？」。
// メニューの「はいけい」は 全部の グループ 共通の まま。グループの へんしゅうの スイッチ「この グループだけの はいけい」を ON に すると、
// そのグループだけ べつの 空か じぶんの がぞう（デザイン案、本人「はいけいでいいよ　そらだとわかりにくい」）。
// がぞうは この ブラウザの なか だけ（IndexedDB）。どこにも おくらない。トリミング（どこを 見せるか）して、画面の 大きさで ほぞん。
// 見せかたは そのまま すこし くらく（読める ように）。ます目は かさねない（本人「写真すっきり見せたい」）。月・ほし・くもは うえに のこる
const photoBg = (() => {
  const C = CASSETTES;
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const skyBg = document.querySelector(".sky-bg");

  // ---------- ほぞん（IndexedDB：グループの id → がぞう（Blob）） ----------
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
  const getPhoto = (gid) => tx("readonly", (s) => s.get(gid)).catch(() => null);
  const putPhoto = (gid, blob) => tx("readwrite", (s) => s.put(blob, gid));
  const delPhoto = (gid) => tx("readwrite", (s) => s.delete(gid)).catch(() => {});
  const urls = new Map(); // gid → object URL
  async function urlOf(gid) {
    if (urls.has(gid)) return urls.get(gid);
    const blob = await getPhoto(gid);
    if (!blob) return null;
    const u = URL.createObjectURL(blob);
    urls.set(gid, u);
    return u;
  }
  function dropUrl(gid) {
    const u = urls.get(gid);
    if (u) URL.revokeObjectURL(u);
    urls.delete(gid);
  }

  // ---------- いまの グループの はいけいを 画面に ----------
  let applying = 0;
  async function apply() {
    const g = C.current();
    const bg = g?.bg?.own ? g.bg : null;
    const n = ++applying;
    if (bg?.sky === "photo" && bg.photo) {
      const u = await urlOf(g.id);
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
    settings.showSky(bg && bg.sky !== "photo" ? bg.sky : null);
  }

  // ---------- グループの へんしゅうの「はいけい」 ----------
  const sw = $("gbg-switch");
  const box = $("gbg");
  const thumb = $("gbg-thumb");
  async function renderEdit() {
    const g = C.current();
    if (!g) return;
    const bg = g.bg ?? { own: false, sky: "night", photo: false };
    sw.setAttribute("aria-checked", String(bg.own));
    sw.textContent = bg.own ? "ON" : "OFF";
    $("gbg-off").hidden = bg.own;
    box.hidden = !bg.own;
    for (const b of box.querySelectorAll("[data-gbg]")) b.setAttribute("aria-checked", String(b.dataset.gbg === bg.sky));
    $("gbg-photo-btns").hidden = !bg.photo;
    const u = bg.photo ? await urlOf(g.id) : null;
    thumb.style.backgroundImage = u ? `url("${u}")` : "";
    thumb.classList.toggle("has", !!u);
  }
  sw.addEventListener("click", () => {
    const g = C.current();
    if (!g) return;
    C.setBg(g.id, { own: !g.bg?.own });
    sound.sfx.select();
    renderEdit();
    apply();
  });
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-gbg]");
    const g = C.current();
    if (!b || !g) return;
    // がぞうが まだ なければ、えらぶ ところから
    if (b.dataset.gbg === "photo" && !g.bg?.photo) return $("gbg-file").click();
    C.setBg(g.id, { sky: b.dataset.gbg });
    sound.sfx.select();
    renderEdit();
    apply();
  });
  $("gbg-pick").addEventListener("click", () => $("gbg-file").click());
  $("gbg-file").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) openTrim(f);
  });
  // けす：がぞうを けして、よるに もどす（スイッチは ON の まま）
  $("gbg-del").addEventListener("click", async () => {
    const g = C.current();
    if (!g || !(await ask("この グループの はいけいの がぞうを 消しますか？"))) return;
    await delPhoto(g.id);
    dropUrl(g.id);
    C.setBg(g.id, { photo: false, sky: g.bg?.sky === "photo" ? "night" : g.bg?.sky });
    renderEdit();
    apply();
  });

  // ---------- トリミング ----------
  const trim = $("trim-dialog");
  const stage = $("trim-stage");
  const img = $("trim-img");
  const zoomEl = $("trim-zoom");
  let view = null; // { W, H（わくの 大きさ）, SW, SH（画面の 大きさ）, k（わく ÷ 画面）, iw, ih, s0, z, tx, ty }
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
  // cx, cy を まんなかに して 大きさを かえる
  function zoomTo(z, cx = view.W / 2, cy = view.H / 2) {
    const s1 = view.s0 * view.z;
    view.z = Math.max(1, Math.min(4, z));
    const s2 = view.s0 * view.z;
    view.tx = cx - ((cx - view.tx) * s2) / s1;
    view.ty = cy - ((cy - view.ty) * s2) / s1;
    draw();
  }
  async function openTrim(file) {
    if (trimUrl) URL.revokeObjectURL(trimUrl);
    trimUrl = URL.createObjectURL(file);
    img.src = trimUrl;
    try {
      await img.decode();
    } catch {
      return ask("この がぞうは 開けなかったよ。べつの がぞうを 選んでね。", "とじる");
    }
    // わくは 画面と おなじ かたちで、まんなかに（上の 題・下の 説明と ボタンの ぶん を あける）
    const SW = innerWidth;
    const SH = innerHeight;
    const k = Math.min((SH - 250) / SH, (SW * 0.78) / SW);
    const W = Math.round(SW * k);
    const H = Math.round(SH * k);
    stage.style.width = `${W}px`;
    stage.style.height = `${H}px`;
    ghosts(k);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const s0 = Math.max(W / iw, H / ih);
    view = { W, H, SW, SH, k, iw, ih, s0, z: 1, tx: (W - iw * s0) / 2, ty: (H - ih * s0) / 2 };
    draw();
    trim.showModal();
    sound.sfx.select();
  }
  // ゆびで うごかす・2 本の ゆびで 大きく
  const ptrs = new Map();
  let pinch = null;
  // ゆびの いちは わくの なかの いちに なおす
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
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const q = local(e);
    zoomTo(view.z * (e.deltaY < 0 ? 1.1 : 0.9), q.x, q.y);
  }, { passive: false });
  zoomEl.addEventListener("input", () => zoomTo(Number(zoomEl.value) / 100));
  function closeTrim() {
    trim.close();
    if (trimUrl) URL.revokeObjectURL(trimUrl);
    trimUrl = null;
  }
  $("trim-no").addEventListener("click", closeTrim);
  trim.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeTrim();
  });
  // けってい：わくに 見えて いる ところを、画面の 大きさで 切りだして ほぞん（はば 900 まで、JPEG）
  $("trim-yes").addEventListener("click", async () => {
    const g = C.current();
    if (!g || !view) return closeTrim();
    const s = view.s0 * view.z;
    const k = Math.min(Math.min(devicePixelRatio || 1, 2), 900 / view.SW);
    const cv = document.createElement("canvas");
    cv.width = Math.round(view.SW * k);
    cv.height = Math.round(view.SH * k);
    cv.getContext("2d").drawImage(img, -view.tx / s, -view.ty / s, view.W / s, view.H / s, 0, 0, cv.width, cv.height);
    const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.82));
    closeTrim();
    try {
      await putPhoto(g.id, blob);
    } catch {
      return ask("がぞうを 保存できなかったよ。ブラウザの 設定を 確かめてね。", "とじる");
    }
    dropUrl(g.id);
    C.setBg(g.id, { own: true, sky: "photo", photo: true });
    sound.sfx.coin();
    await renderEdit();
    apply();
  });

  // グループを けしたら がぞうも けす
  async function forget(gid) {
    await delPhoto(gid);
    dropUrl(gid);
  }
  // ぜんぶ けす（アプリの きろくを ぜんぶ けす）
  function clearAll() {
    try {
      indexedDB.deleteDatabase(DB);
    } catch {}
  }

  apply();
  return { apply, renderEdit, forget, clearAll, openTrim, urlOf };
})();
