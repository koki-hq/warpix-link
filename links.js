// ---------- グループと リンク（v2.0）：画面・グループを つくる・リンクを 追加・へんしゅう ----------
// リンクの ボタンは v1 の まま（ドットの わく・シアンの アイコン・英字）を 2 列に。iPhone の 1 画面に おさめる。
// 本人「リンクを追加したいだけなのに　入れ替えとか　既存から選択とか　ごちゃごちゃしてる」→ 3 つに わけた：
//   つくる：右上の ＋ → なまえ → そのまま リンクを 追加へ
//   追加：「＋ リンクを 追加」→ たなから えらぶ（おすと 追加、もう いちど おすと とりけし）／じぶんで つくる
//   へんしゅう：グループの かんばんを おす → なまえ・ならべかえ・はずす・グループの じゅんばん・けす
const groups = (() => {
  const C = CASSETTES;
  const $ = (id) => document.getElementById(id);
  const linksEl = $("links");
  const emptyEl = $("empty");
  const barEl = $("group-bar");

  const labelHtml = (c) => esc(c.label);
  // ながい なまえは もじを ちいさく（v2.1：なまえは 16 もじまで。英字は ドットの 文字が はばを とる）
  const sizeClass = (c) => {
    const n = Array.from(c.label).length;
    return C.jp(c) ? (n > 10 ? " len-l" : n > 6 ? " len-m" : "") : n > 10 ? " len-l" : n > 8 ? " len-m" : "";
  };
  const iconHtml = (c) => pixelSvg(C.iconOf(c));

  // ---------- 画面 ----------
  function render() {
    const g = C.current();
    const list = C.groups();
    document.body.classList.toggle("no-groups", !g);
    emptyEl.hidden = !!g;
    barEl.hidden = !g;
    linksEl.hidden = !g;
    if (!g) {
      linksEl.innerHTML = "";
      return;
    }
    $("group-title").textContent = g.title;
    $("group-sign").setAttribute("aria-label", `グループ「${g.title}」を編集`);
    $("group-dots").innerHTML = list.map((_, i) => `<span class="${i === C.at() ? "on" : ""}"></span>`).join("");
    $("group-prev").disabled = list.length < 2;
    $("group-next").disabled = list.length < 2;
    const tiles = g.ids.map((id) => {
      const c = C.byId(id);
      const app = C.appOf(c);
      return `<a class="pixel-btn${C.jp(c) ? " jp-label" : ""}${sizeClass(c)}" href="${esc(c.url)}" target="_blank" rel="noopener" data-id="${esc(c.id)}"${app ? ` data-app="${esc(app)}"` : ""}><span class="icon" aria-hidden="true">${iconHtml(c)}</span><span class="link-label">${labelHtml(c)}</span><span class="sr-only">（新しいタブで開く）</span></a>`;
    });
    if (g.ids.length < C.MAX_LINKS) tiles.push(`<button class="link-add" id="link-add" type="button" aria-haspopup="dialog">＋ リンクを追加</button>`);
    linksEl.innerHTML = tiles.join("");
    linksEl.setAttribute("aria-label", `${g.title} のリンク`);
  }

  function go(dir) {
    if (C.groups().length < 2) return;
    C.switchTo(C.at() + dir);
    render();
    sound.sfx.hover();
  }
  $("group-prev").addEventListener("click", () => go(-1));
  $("group-next").addEventListener("click", () => go(1));
  // よこに スワイプでも きりかえ
  let touch = null;
  linksEl.addEventListener("touchstart", (e) => (touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null), { passive: true });
  linksEl.addEventListener("touchend", (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40) go(dx < 0 ? 1 : -1);
  }, { passive: true });
  addEventListener("keydown", (e) => {
    if (document.querySelector("dialog[open]") || e.target.closest?.("input, textarea")) return;
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  // リンクを おす：きろくして、ピクセと ワープ（リンクは ふつうに あたらしい タブで ひらく）
  linksEl.addEventListener("click", (e) => {
    if (e.target.closest("#link-add")) return openAdd();
    const a = e.target.closest("a.pixel-btn");
    if (!a) return;
    const c = C.byId(a.dataset.id);
    const g = C.current();
    if (!c || !g) return;
    warpLog.record({ id: c.id, name: c.label, group: g.title });
    warpDive.dive(a, c.id);
  });

  // まどの そとを おすと とじる
  const closeOnBackdrop = (d) => d.addEventListener("click", (e) => e.target === d && d.close());

  // ---------- グループを つくる ----------
  const groupDialog = $("group-dialog");
  const groupName = $("group-name");
  function openGroup() {
    groupName.value = "";
    $("group-error").hidden = true;
    groupDialog.showModal();
    sound.sfx.select();
    groupName.focus();
  }
  $("add-group").addEventListener("click", openGroup);
  $("empty-add").addEventListener("click", openGroup);
  groupName.addEventListener("input", () => ($("group-error").hidden = true));
  $("group-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const g = C.addGroup(groupName.value);
    if (!g) {
      $("group-error").hidden = false;
      groupName.focus();
      return;
    }
    groupDialog.close();
    render();
    sound.sfx.coin();
    pixe.say("いい なまえ！\nつぎは リンクを 追加しよう。");
    openAdd();
  });
  $("group-cancel").addEventListener("click", () => groupDialog.close());
  $("group-close").addEventListener("click", () => groupDialog.close());
  closeOnBackdrop(groupDialog);

  // ---------- リンクを 追加 ----------
  const addDialog = $("add-dialog");
  const shelvesEl = $("add-shelves");
  const addMsg = $("add-msg");
  let addTab = "shelf";
  let backToEdit = false;
  let pickedIcon = "star";
  let editingId = null; // つくった リンクを かえて いる ときの id（したの「かえる」）

  function renderCount() {
    const g = C.current();
    $("add-group-name").textContent = g?.title ?? "";
    $("add-count").textContent = g ? `${g.ids.length} / ${C.MAX_LINKS}` : "";
  }
  function cassette(c, inGroup) {
    return `<button type="button" class="cas-item${inGroup ? " picked" : ""}" data-id="${esc(c.id)}" aria-pressed="${inGroup}"><span class="cas-check" aria-hidden="true">${inGroup ? "✓" : ""}</span><span class="icon" aria-hidden="true">${iconHtml(c)}</span><span class="cas-name${C.jp(c) ? " jp" : ""}">${labelHtml(c)}</span></button>`;
  }
  function renderShelves() {
    const g = C.current();
    const has = new Set(g?.ids ?? []);
    const mine = C.mine();
    shelvesEl.innerHTML = C.SHELVES.map((sh) => {
      const items = sh.id === "mine" ? mine : C.LIST.filter((c) => c.shelf === sh.id);
      const body = items.length
        ? items.map((c) => cassette(c, has.has(c.id))).join("")
        : `<button type="button" class="cas-make" data-make="1"><span aria-hidden="true">＋</span>作る</button>`;
      return `<section class="cas-shelf"><h3>▾ ${esc(sh.name)}${sh.id === "mine" ? ` <small>${mine.length} / ${C.MINE_MAX}</small>` : ""}</h3><div class="cas-grid">${body}</div></section>`;
    }).join("");
    renderCount();
  }
  function selectTab(tab) {
    addTab = tab;
    for (const [id, name] of [["add-tab-shelf", "shelf"], ["add-tab-make", "make"]]) {
      $(id).setAttribute("aria-selected", String(tab === name));
      $(id).tabIndex = tab === name ? 0 : -1;
    }
    $("add-shelf").hidden = tab !== "shelf";
    $("add-make").hidden = tab !== "make";
    addMsg.textContent = "";
    if (tab === "make") renderMake();
    else renderShelves();
  }
  function openAdd({ fromEdit = false, tab = "shelf" } = {}) {
    if (!C.current()) return;
    backToEdit = fromEdit;
    editingId = null;
    $("mylink-name").value = "";
    $("mylink-url").value = "";
    if (editDialog.open) editDialog.close();
    selectTab(tab);
    addDialog.showModal();
    sound.sfx.select();
  }
  $("add-tab-shelf").addEventListener("click", () => selectTab("shelf"));
  $("add-tab-make").addEventListener("click", () => selectTab("make"));
  for (const id of ["add-tab-shelf", "add-tab-make"]) {
    $(id).addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      selectTab(addTab === "shelf" ? "make" : "shelf");
      $(addTab === "shelf" ? "add-tab-shelf" : "add-tab-make").focus();
    });
  }
  shelvesEl.addEventListener("click", (e) => {
    if (e.target.closest("[data-make]")) return selectTab("make");
    const b = e.target.closest(".cas-item[data-id]");
    const g = C.current();
    if (!b || !g) return;
    const c = C.byId(b.dataset.id);
    if (g.ids.includes(c.id)) {
      C.removeLink(g.id, c.id);
      addMsg.textContent = `「${c.label}」を取り消しました`;
      sound.sfx.hover();
    } else if (g.ids.length >= C.MAX_LINKS) {
      addMsg.textContent = `いっぱいです。1つのグループに${C.MAX_LINKS}こまでです`;
      return;
    } else {
      C.addLink(g.id, c.id);
      addMsg.textContent = `「${c.label}」を追加しました`;
      sound.sfx.select();
    }
    const y = $("add-shelf").scrollTop;
    renderShelves();
    $("add-shelf").scrollTop = y;
    shelvesEl.querySelector(`.cas-item[data-id="${CSS.escape(c.id)}"]`)?.focus();
    render();
  });

  // じぶんで つくる（v1.61 じぶんの リンク：なまえ・アドレス・アイコン）
  const iconsEl = $("mylink-icons");
  function renderMake() {
    iconsEl.innerHTML = Object.entries(C.MINE_ICONS)
      .map(([k, v]) => `<button type="button" role="radio" class="mylink-icon" data-icon="${k}" aria-checked="${k === pickedIcon}" aria-label="${esc(v.name)}">${pixelSvg(v.rows)}</button>`)
      .join("");
    $("mylink-error").hidden = true;
    const editing = editingId && C.byId(editingId);
    $("mylink-editing").hidden = !editing;
    if (editing) $("mylink-editing-name").textContent = editing.label;
    const mine = C.mine();
    $("mylink-list").innerHTML = mine.length
      ? `<h3>作ったリンク</h3>${mine.map((c) => `<div class="mylink-row"><span class="icon" aria-hidden="true">${iconHtml(c)}</span><span class="mylink-row-name">${esc(c.label)}</span><button type="button" class="mini" data-edit="${esc(c.id)}" aria-label="${esc(c.label)} を変える"${c.id === editingId ? ' aria-pressed="true"' : ""}>変える</button><button type="button" class="mini danger" data-del="${esc(c.id)}" aria-label="${esc(c.label)} を消す">消す</button></div>`).join("")}`
      : "";
    renderCount();
  }
  iconsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-icon]");
    if (!b) return;
    pickedIcon = b.dataset.icon;
    for (const x of iconsEl.querySelectorAll("[data-icon]")) x.setAttribute("aria-checked", String(x === b));
  });
  // つくった リンクを かえる（v2.0.2、本人「名前とかアイコンとかリンクとか」「かえる　とかの方がいいかな　けす　に合わせて」）。
  // かえる を おすと うえの 欄に いまの なまえ・アドレス・アイコンが はいり、けってい で ほぞん。はいって いる グループ ぜんぶに かわる
  function startEdit(c) {
    editingId = c.id;
    $("mylink-name").value = c.label;
    $("mylink-url").value = c.url;
    pickedIcon = C.MINE_ICONS[c.iconKey] ? c.iconKey : "star";
    renderMake();
    $("mylink-name").focus();
    $("add-make").scrollTop = 0;
  }
  function stopEdit() {
    editingId = null;
    $("mylink-name").value = "";
    $("mylink-url").value = "";
    renderMake();
  }
  $("mylink-stop").addEventListener("click", () => {
    stopEdit();
    $("mylink-name").focus();
  });
  $("mylink-list").addEventListener("click", async (e) => {
    const ed = e.target.closest("[data-edit]");
    if (ed) {
      const c = C.byId(ed.dataset.edit);
      if (c) startEdit(c);
      return;
    }
    const b = e.target.closest("[data-del]");
    if (!b) return;
    const c = C.byId(b.dataset.del);
    if (!c || !(await ask(`「${c.label}」を消しますか？ 入っているグループからも外れます。`))) return;
    if (editingId === c.id) editingId = null;
    C.removeMine(c.id);
    renderMake();
    render();
  });
  // じぶんの リンクを つくって、いまの グループに 追加する（かえて いる ときは ほぞん）。できたら true
  function makeLink() {
    const err = $("mylink-error");
    const name = $("mylink-name").value.trim();
    const url = $("mylink-url").value.trim();
    const g = C.current();
    let msg = null;
    if (!name) msg = "名前を入れてください。";
    else msg = C.checkMine(url, editingId);
    if (!editingId) {
      if (!msg && C.mine().length >= C.MINE_MAX) msg = `自分のリンクは${C.MINE_MAX}こまでです。`;
      if (!msg && g.ids.length >= C.MAX_LINKS) msg = `このグループはもう${C.MAX_LINKS}こでいっぱいです。`;
    }
    if (msg) {
      err.textContent = msg;
      err.hidden = false;
      return false;
    }
    if (editingId) {
      const c = C.updateMine(editingId, { label: name, url, icon: pickedIcon });
      if (!c) return false;
      stopEdit();
      sound.sfx.coin();
      pixe.say(`「${c.label}」、かえたよ！`);
      return true;
    }
    const c = C.addMine({ label: name, url, icon: pickedIcon });
    if (!c) return false;
    C.addLink(g.id, c.id);
    $("mylink-name").value = "";
    $("mylink-url").value = "";
    sound.sfx.coin();
    pixe.say(`「${c.label}」、できたね！`);
    return true;
  }
  $("mylink-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (makeLink()) closeAdd();
  });
  function closeAdd() {
    addDialog.close();
    render();
    if (backToEdit) return openEdit();
    // はじめての ときだけ、つぎに できる ことを ピクセが ひとこと（v2.1）
    const g = C.current();
    if (g?.ids.length && !pixe.tip("warp", "リンクを おすと ワープ！\nなまえを おすと へんしゅう できるよ。") && C.groups().length >= 2)
      pixe.tip("swipe", "よこに スワイプしても\nグループを きりかえられるよ。");
  }
  // けってい：つくる タブで なにか かいて あれば つくってから とじる
  $("add-done").addEventListener("click", () => {
    if (addTab === "make" && ($("mylink-name").value.trim() || $("mylink-url").value.trim())) {
      if (!makeLink()) return;
    }
    closeAdd();
  });
  $("add-close").addEventListener("click", closeAdd);
  addDialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeAdd();
  });
  addDialog.addEventListener("click", (e) => e.target === addDialog && closeAdd());

  // ---------- グループを へんしゅう（かんばんを おす） ----------
  const editDialog = $("edit-dialog");
  const editName = $("edit-name");
  const rowsEl = $("edit-rows");
  function renderEdit() {
    const g = C.current();
    if (!g) return;
    $("edit-count").textContent = `${g.ids.length} / ${C.MAX_LINKS}`;
    rowsEl.innerHTML = g.ids.length
      ? g.ids
          .map((id, i) => {
            const c = C.byId(id);
            return `<li data-id="${esc(id)}"><span class="icon" aria-hidden="true">${iconHtml(c)}</span><span class="edit-row-name${C.jp(c) ? " jp" : ""}">${labelHtml(c)}</span><button type="button" class="mini" data-act="up" aria-label="${labelHtml(c)} を上へ" ${i === 0 ? "disabled" : ""}>▲</button><button type="button" class="mini" data-act="down" aria-label="${labelHtml(c)} を下へ" ${i === g.ids.length - 1 ? "disabled" : ""}>▼</button><button type="button" class="mini danger" data-act="out" aria-label="${labelHtml(c)} を外す">外す</button></li>`;
          })
          .join("")
      : `<li class="edit-empty">まだリンクがありません</li>`;
    $("edit-add").hidden = g.ids.length >= C.MAX_LINKS;
    const n = C.groups().length;
    $("edit-prev").disabled = C.at() === 0;
    $("edit-next").disabled = C.at() === n - 1;
  }
  function openEdit() {
    const g = C.current();
    if (!g) return;
    editName.value = g.title;
    $("edit-error").hidden = true;
    $("edit-msg").textContent = "";
    renderEdit();
    if (!editDialog.open) editDialog.showModal();
    sound.sfx.select();
  }
  $("group-sign").addEventListener("click", openEdit);
  rowsEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const g = C.current();
    const id = b.closest("li").dataset.id;
    const act = b.dataset.act;
    if (act === "up" || act === "down") C.moveLink(g.id, id, act === "up" ? -1 : 1);
    if (act === "out") {
      C.removeLink(g.id, id);
      $("edit-msg").textContent = `「${C.byId(id).label}」を外しました`;
    }
    renderEdit();
    render();
    rowsEl.querySelector(`li[data-id="${CSS.escape(id)}"] [data-act="${act}"]:not(:disabled)`)?.focus();
  });
  $("edit-add").addEventListener("click", () => openAdd({ fromEdit: true }));
  $("edit-prev").addEventListener("click", () => {
    C.moveGroup(C.current().id, -1);
    renderEdit();
    render();
  });
  $("edit-next").addEventListener("click", () => {
    C.moveGroup(C.current().id, 1);
    renderEdit();
    render();
  });
  $("edit-delete").addEventListener("click", async () => {
    const g = C.current();
    if (!(await ask(`グループ「${g.title}」を消しますか？`))) return;
    C.removeGroup(g.id);
    editDialog.close();
    render();
    if (!C.current()) pixe.say(pixe.guide());
  });
  // けってい：なまえを ほぞんして とじる（から なら とじない）
  function saveEdit() {
    const g = C.current();
    if (!g) return editDialog.close();
    if (!C.rename(g.id, editName.value)) {
      $("edit-error").hidden = false;
      editName.focus();
      return;
    }
    editDialog.close();
    render();
  }
  $("edit-done").addEventListener("click", saveEdit);
  editName.addEventListener("input", () => ($("edit-error").hidden = true));
  editName.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), saveEdit()));
  $("edit-close").addEventListener("click", () => editDialog.close());
  closeOnBackdrop(editDialog);

  render();
  return { render, openGroup, openAdd, openEdit };
})();
