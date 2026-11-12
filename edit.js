// ---------- へんしゅう ちゅう（v2.2）：リンクを 長押しで はいる ----------
// 本人「タップで リンクに飛ぶ、長押しで リンクを編集する、ドラッグ&ドロップで並び順とか変えたり」。
// デザイン案 A：iPhone の ホーム画面と おなじ（ゆらゆら・左上の ✕ で はずす・つかんで ならべかえ・おすと へんしゅう）。
// 上に ピンクの おび「へんしゅう ちゅう［おわる］」。ふだんの「おすと ワープ」と はっきり わける
const editMode = (() => {
  const C = CASSETTES;
  const $ = (id) => document.getElementById(id);
  const linksEl = $("links");
  const band = $("edit-band");
  const HOLD = 500; // 長押しの ながさ（ミリ秒）
  let on = false;
  let press = null; // { x, y, timer, fired }

  function enter() {
    if (on) return;
    on = true;
    document.body.classList.add("editing");
    band.hidden = false;
    // 画面は つくりなおさない（長押しの ゆびが つかんで いる リンクを そのまま ドラッグ できる ように）
    for (const a of linksEl.querySelectorAll("a.pixel-btn")) if (!a.querySelector(".tile-x")) a.insertAdjacentHTML("beforeend", `<span class="tile-x" aria-hidden="true">✕</span>`);
    sound.sfx.select();
    navigator.vibrate?.(15);
    // ピクセも へんしゅうの はなしを（長押しで リンクの しょうかいが 出て しまって いた。v2.2.1）。2 かいめ から みじかく
    if (!pixe.tip("edit", "ドラッグで ならびかえ、\nおすと へんしゅう できるよ。")) pixe.say("へんしゅう ちゅう！");
  }
  function exit() {
    if (!on) return;
    on = false;
    document.body.classList.remove("editing");
    band.hidden = true;
    groups.render();
    sound.sfx.select();
  }
  $("edit-end").addEventListener("click", exit);
  // リンクの そと（はいけい・メニュー・＋ など）を おしても おわる（v2.2.1、本人「背景とか…メニューとかタップしたりしたら解除されるように」）。
  // タブ（グループの きりかえ）と まどの なかは おわらない
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!on || e.target.closest(".links .pixel-btn, #edit-band, dialog, .group-tabs")) return;
      exit();
    },
    true
  );
  addEventListener("keydown", (e) => e.key === "Escape" && on && !document.querySelector("dialog[open]") && exit());

  // 長押しで はいる（うごいたら スクロールや スワイプなので やめる）
  linksEl.addEventListener("pointerdown", (e) => {
    if (on || e.button !== 0 || !e.target.closest("a.pixel-btn")) return;
    press = { x: e.clientX, y: e.clientY, fired: false };
    press.timer = setTimeout(() => {
      press.fired = true;
      enter();
    }, HOLD);
  });
  addEventListener("pointermove", (e) => {
    if (press && !press.fired && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) {
      clearTimeout(press.timer);
      press = null;
    }
  });
  // 長押しで はいった あとの click を 1 かい だけ のむ（click が こなければ つぎの ために すぐ わすれる）
  const release = () => {
    if (!press) return;
    if (!press.fired) {
      clearTimeout(press.timer);
      press = null;
    } else setTimeout(() => (press = null), 0);
  };
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);
  // 長押しの あと・へんしゅう ちゅうは、ゆびを うごかしても 画面を スクロールさせない（iPhone が ドラッグを とちゅうで やめない ように）
  linksEl.addEventListener("touchmove", (e) => (on || press?.fired) && e.cancelable && e.preventDefault(), { passive: false });
  // リンクを つかんで うごかすと ブラウザの「リンクを ドラッグ」に なって とちゅうで とまるので、それは させない
  linksEl.addEventListener("dragstart", (e) => e.target.closest?.("a.pixel-btn") && e.preventDefault());
  // 長押しの メニュー（iPhone の リンクの プレビュー・Android の メニュー）は 出さない
  linksEl.addEventListener("contextmenu", (e) => e.target.closest("a.pixel-btn") && e.preventDefault());

  // へんしゅう ちゅうの タップ：✕ で はずす、ほかは へんしゅうの まど。リンクは ひらかない
  linksEl.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("a.pixel-btn");
      if (press?.fired) {
        // 長押しで はいった その ゆびを はなした ときの click
        press = null;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!on) return;
      e.preventDefault();
      e.stopPropagation();
      if (!a) return;
      const g = C.current();
      const c = C.byId(a.dataset.id);
      if (!g || !c) return;
      if (e.target.closest(".tile-x")) {
        C.removeLink(g.id, c.id);
        sound.sfx.hover();
        groups.render();
        if (!C.current()?.ids.length) exit();
        return;
      }
      openSheet(c);
    },
    true
  );

  // つかんで ならべかえ（へんしゅう ちゅう だけ。長押しの まま うごかしても そのまま ドラッグに なる）
  makeSortable(linksEl, {
    item: "a.pixel-btn",
    canStart: () => on,
    onEnd: (ids) => {
      C.setLinkOrder(C.current().id, ids);
      groups.render();
    },
  });

  // ---------- リンクの へんしゅう（下から でる まど） ----------
  const sheet = $("link-sheet");
  const iconsEl = $("sheet-icons");
  let editing = null;
  let icon = "star";
  function renderIcons() {
    iconsEl.innerHTML = Object.entries(C.MINE_ICONS)
      .map(([k, v]) => `<button type="button" role="radio" class="mylink-icon" data-icon="${k}" aria-checked="${k === icon}" aria-label="${esc(v.name)}">${pixelSvg(v.rows)}</button>`)
      .join("");
  }
  function openSheet(c) {
    editing = c;
    $("sheet-title").textContent = `「${c.label}」を へんしゅう`;
    $("sheet-mine").hidden = !c.mine;
    $("sheet-shelf").hidden = !!c.mine;
    $("sheet-save").hidden = !c.mine;
    $("sheet-error").hidden = true;
    if (c.mine) {
      $("sheet-name").value = c.label;
      $("sheet-url").value = c.url;
      icon = C.MINE_ICONS[c.iconKey] ? c.iconKey : "star";
      renderIcons();
    }
    sheet.showModal();
    sound.sfx.select();
  }
  iconsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-icon]");
    if (!b) return;
    icon = b.dataset.icon;
    for (const x of iconsEl.querySelectorAll("[data-icon]")) x.setAttribute("aria-checked", String(x === b));
  });
  function save() {
    const c = editing;
    if (!c?.mine) return sheet.close();
    const name = $("sheet-name").value.trim();
    const url = $("sheet-url").value.trim();
    const msg = !name ? "名前を入力してね。" : C.checkMine(url, c.id);
    if (msg) {
      $("sheet-error").textContent = msg;
      $("sheet-error").hidden = false;
      return;
    }
    C.updateMine(c.id, { label: name, url, icon });
    sheet.close();
    groups.render();
    sound.sfx.coin();
  }
  $("sheet-save").addEventListener("click", save);
  $("sheet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    save();
  });
  $("sheet-out").addEventListener("click", () => {
    const g = C.current();
    if (g && editing) C.removeLink(g.id, editing.id);
    sheet.close();
    groups.render();
    sound.sfx.hover();
    if (!C.current()?.ids.length) exit();
  });
  $("sheet-close").addEventListener("click", () => sheet.close());
  sheet.addEventListener("click", (e) => e.target === sheet && sheet.close());

  return { enter, exit, on: () => on, openSheet };
})();
