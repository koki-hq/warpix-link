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
  const tileHtml = (id, editing) => {
    const c = C.byId(id);
    const app = C.appOf(c);
    return `<a class="pixel-btn${C.jp(c) ? " jp-label" : ""}${sizeClass(c)}" href="${esc(c.url)}" target="_blank" rel="noopener" data-id="${esc(c.id)}"${app ? ` data-app="${esc(app)}"` : ""}><span class="icon" aria-hidden="true">${iconHtml(c)}</span><span class="link-label">${labelHtml(c)}</span>${editing ? `<span class="tile-x" aria-hidden="true">✕</span>` : ""}<span class="sr-only">${editing ? "（押すと編集）" : "（新しいタブで開く）"}</span></a>`;
  };
  // keep（v2.5）：ドラッグ ちゅうの リンクは けさずに、まわりだけ その グループの リンクに かえる（ゆびが はなれない ように）。
  // その グループに おなじ リンクが あれば その ばしょ、なければ さいごに
  function render({ keep = null } = {}) {
    const g = C.current();
    const list = C.groups();
    document.body.classList.toggle("no-groups", !g);
    emptyEl.hidden = !!g;
    barEl.hidden = !g;
    linksEl.hidden = !g;
    if (!g) {
      linksEl.innerHTML = "";
      if (typeof photoBg !== "undefined") photoBg.apply();
      return;
    }
    renderTabs(list);
    const editing = document.body.classList.contains("editing");
    if (keep && linksEl.contains(keep)) {
      for (const ch of [...linksEl.children]) if (ch !== keep) ch.remove();
      const i = g.ids.indexOf(keep.dataset.id);
      const before = i < 0 ? g.ids : g.ids.slice(0, i);
      const after = i < 0 ? [] : g.ids.slice(i + 1);
      keep.insertAdjacentHTML("beforebegin", before.map((id) => tileHtml(id, editing)).join(""));
      keep.insertAdjacentHTML("afterend", after.map((id) => tileHtml(id, editing)).join(""));
      if (typeof photoBg !== "undefined") photoBg.apply();
      linksEl.setAttribute("aria-label", `${g.title} のリンク`);
      return;
    }
    const tiles = g.ids.map((id) => tileHtml(id, editing));
    if (g.ids.length < C.MAX_LINKS && !editing) tiles.push(`<button class="link-add" id="link-add" type="button" aria-haspopup="dialog">＋ リンクを 追加</button>`);
    linksEl.innerHTML = tiles.join("");
    if (typeof photoBg !== "undefined") photoBg.apply();
    linksEl.setAttribute("aria-label", `${g.title} のリンク`);
  }

  // ---------- タブ（v2.1）：ぜんぶの グループを ならべる。◀ ▶ と てんてん の かわり ----------
  // 本人「塗りつぶしの方がわかりやすい」。えらんで いる タブには ✎（ペン先は 左下）。おおい ときは よこに スクロール、えらんだ タブを まんなかへ
  const PEN = ["......##.", ".....####", "....####.", "...####..", "..####...", ".####....", ".###.....", "##.......", "#........"];
  const tabsEl = $("group-tabs");
  function renderTabs(list) {
    const at = C.at();
    tabsEl.innerHTML =
      list
        .map((g, i) =>
          i === at
            ? `<button type="button" class="group-tab on" id="group-sign" aria-current="true" aria-haspopup="dialog" aria-label="グループ「${esc(g.title)}」を編集"><span class="group-title" id="group-title">${esc(g.title)}</span><span class="pen" aria-hidden="true">${pixelSvg(PEN)}</span></button>`
            : `<button type="button" class="group-tab" data-i="${i}">${esc(g.title)}</button>`
        )
        .join("") + `<button type="button" class="group-tab plus" id="group-new" aria-label="グループを つくる">＋</button>`;
    centerTab();
  }
  // えらんで いる タブを まんなかへ。文字（ドットの フォント）が あとから とどくと タブの はばが かわるので、とどいた ときと 画面の おおきさが かわった ときにも
  function centerTab() {
    const on = $("group-sign");
    if (!on) return;
    const left = on.getBoundingClientRect().left - tabsEl.getBoundingClientRect().left + tabsEl.scrollLeft - (tabsEl.clientWidth - on.offsetWidth) / 2;
    tabsEl.scrollTo({ left: Math.max(0, left), behavior: "instant" });
  }
  document.fonts?.ready.then(centerTab);
  document.fonts?.addEventListener?.("loadingdone", centerTab);
  addEventListener("resize", centerTab);
  tabsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".group-tab");
    if (!b) return;
    if (b.id === "group-sign") return openEdit();
    if (b.id === "group-new") return quickGroup();
    C.switchTo(Number(b.dataset.i));
    render();
    sound.sfx.hover();
  });

  function go(dir) {
    if (C.groups().length < 2) return;
    C.switchTo(C.at() + dir);
    render();
    sound.sfx.hover();
  }
  // よこに スワイプでも きりかえ
  let touch = null;
  linksEl.addEventListener("touchstart", (e) => (touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null), { passive: true });
  linksEl.addEventListener("touchend", (e) => {
    if (!touch || document.body.classList.contains("editing")) return (touch = null);
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
  // 上限（v2.5）：まんなかの まどで しらせる。「上限に 達したよ」の あとに どう すれば いいか
  const groupsFull = () => {
    if (C.groups().length < C.MAX_GROUPS) return false;
    tell(`グループの数が上限（${C.MAX_GROUPS}こ）に達したよ。使わないグループを消すと、また作れるよ。`);
    return true;
  };
  function openGroup() {
    if (groupsFull()) return;
    groupName.value = "";
    groupName.placeholder = C.nextName(); // から なら この なまえ（v2.5）
    groupDialog.showModal();
    sound.sfx.select();
    groupName.focus();
  }
  $("add-group").addEventListener("click", openGroup);
  $("empty-add").addEventListener("click", openGroup);
  $("group-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const g = C.addGroup(groupName.value);
    if (!g) return;
    groupDialog.close();
    render();
    sound.sfx.coin();
    pixe.say("いい なまえ！\nつぎは リンクを 追加しよう。");
    openAdd();
  });
  $("group-cancel").addEventListener("click", () => groupDialog.close());
  $("group-close").addEventListener("click", () => groupDialog.close());
  closeOnBackdrop(groupDialog);

  // タブの となりの ＋ は ワンタップで すぐ できる（v2.5、本人「ワンタップでグループ作れる感じ」）。リンクの まどは ひらかない。
  // へんしゅう ちゅうは タブを おしても おわらないので、つくったら おわる
  function quickGroup() {
    if (typeof editMode !== "undefined" && editMode.on()) editMode.exit();
    if (groupsFull()) return;
    const g = C.addGroup("");
    render();
    sound.sfx.coin();
    pixe.say(`「${g.title}」が できたよ！`);
  }

  // ---------- リンクを 追加 ----------
  const addDialog = $("add-dialog");
  const shelvesEl = $("add-shelves");
  const addMsg = $("add-msg");
  let addTab = "make";
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
    // リストは こちらで よういした もの だけ（v2.5：自分の リンクは「じぶんで つくる」の 一覧へ）
    shelvesEl.innerHTML = C.SHELVES.filter((sh) => sh.id !== "mine").map((sh) => {
      const items = C.LIST.filter((c) => c.shelf === sh.id);
      return `<section class="cas-shelf"><h3>▾ ${esc(sh.name)}</h3><div class="cas-grid">${items.map((c) => cassette(c, has.has(c.id))).join("")}</div></section>`;
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
  // v2.2：「じぶんで つくる」が さき（本人「じぶんでつくる方を押したいから」）
  function openAdd({ fromEdit = false, tab = "make" } = {}) {
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
  // おすと 追加、もう いちど おすと とりけし（リスト・作った リンク おなじ）
  function toggle(c) {
    const g = C.current();
    if (!c || !g) return false;
    if (g.ids.includes(c.id)) {
      C.removeLink(g.id, c.id);
      addMsg.textContent = `「${c.label}」を取り消しました`;
      sound.sfx.hover();
    } else if (g.ids.length >= C.MAX_LINKS) {
      addMsg.textContent = `いっぱいです。1つのグループに${C.MAX_LINKS}こまでです`;
      return false;
    } else {
      C.addLink(g.id, c.id);
      addMsg.textContent = `「${c.label}」を追加しました`;
      sound.sfx.select();
    }
    render();
    return true;
  }
  shelvesEl.addEventListener("click", (e) => {
    const b = e.target.closest(".cas-item[data-id]");
    if (!b) return;
    const c = C.byId(b.dataset.id);
    if (!toggle(c)) return;
    const y = $("add-shelf").scrollTop;
    renderShelves();
    $("add-shelf").scrollTop = y;
    shelvesEl.querySelector(`.cas-item[data-id="${CSS.escape(c.id)}"]`)?.focus();
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
    // 作った リンク（v2.5）：おすと いまの グループに 追加。べつの グループにも 入れやすく（本人「リストから選ぶの中にあるの気づかなくて」）。
    // あたらしく つくる が うえ、一覧は した（本人「リンク増えるから」）
    const mine = C.mine();
    const has = new Set(C.current()?.ids ?? []);
    $("mylink-list").innerHTML = mine.length
      ? `<h3>作ったリンク <small>${mine.length}こ</small></h3><p class="win-note">押すと追加。もう一度押すと取り消せるよ。</p>${mine.map((c) => `<div class="mylink-row"><button type="button" class="mylink-pick${has.has(c.id) ? " picked" : ""}" data-pick="${esc(c.id)}" aria-pressed="${has.has(c.id)}"><span class="cas-check" aria-hidden="true">${has.has(c.id) ? "✓" : ""}</span><span class="icon" aria-hidden="true">${iconHtml(c)}</span><span class="mylink-row-name">${esc(c.label)}</span></button><button type="button" class="mini" data-edit="${esc(c.id)}" aria-label="${esc(c.label)} を変える"${c.id === editingId ? ' aria-pressed="true"' : ""}>かえる</button><button type="button" class="mini danger" data-del="${esc(c.id)}" aria-label="${esc(c.label)} を消す">けす</button></div>`).join("")}`
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
    const pk = e.target.closest("[data-pick]");
    if (pk) {
      const id = pk.dataset.pick;
      if (toggle(C.byId(id))) {
        const y = $("add-make").scrollTop;
        renderMake();
        $("add-make").scrollTop = y;
        $("mylink-list").querySelector(`[data-pick="${CSS.escape(id)}"]`)?.focus();
      }
      return;
    }
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
    if (!name) msg = "名前を入力してね。";
    else msg = C.checkMine(url, editingId);
    if (!editingId) {
      if (!msg && C.mine().length >= C.MINE_MAX) {
        tell(`自分のリンクの数が上限（${C.MINE_MAX}こ）に達したよ。使わないリンクを消すと、また作れるよ。`);
        return false;
      }
      if (!msg && g.ids.length >= C.MAX_LINKS) msg = `このグループはもう${C.MAX_LINKS}こでいっぱいです。`;
    }
    // もう 作った アドレスなら 下の 一覧の その 行を ひからせる（v2.5）
    const norm = (u) => (C.cleanUrl(u) ?? "").replace(/\/+$/, "").toLowerCase();
    const twin = msg && C.mine().find((c) => c.id !== editingId && norm(c.url) === norm(url));
    if (twin) msg = "もう作ってあるよ。下の一覧から押してね。";
    if (msg) {
      err.textContent = msg;
      err.hidden = false;
      if (twin) {
        const row = $("mylink-list").querySelector(`[data-pick="${CSS.escape(twin.id)}"]`)?.closest(".mylink-row");
        if (row) {
          row.classList.remove("flash");
          void row.offsetWidth;
          row.classList.add("flash");
          row.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
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
    if (g?.ids.length && !pixe.tip("warp", "リンクを おすと ワープ！\nグループの タブを おすと\nへんしゅう できるよ。") && C.groups().length >= 2)
      pixe.tip("swipe", "よこに スワイプしても\nグループを きりかえられるよ。");
    if (g?.ids.length) setTimeout(() => invite.first(), 1600);
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
            return `<li data-id="${esc(id)}"><button type="button" class="grip" aria-label="${labelHtml(c)} の順番（↑↓キーでも動かせます）">≡</button><span class="icon" aria-hidden="true">${iconHtml(c)}</span><span class="edit-row-name${C.jp(c) ? " jp" : ""}">${labelHtml(c)}</span><button type="button" class="mini danger" data-act="out" aria-label="${labelHtml(c)} を外す">はずす</button></li>`;
          })
          .join("")
      : `<li class="edit-empty">まだリンクがありません</li>`;
    $("edit-add").hidden = g.ids.length >= C.MAX_LINKS;
    const cur = g.id;
    $("group-rows").innerHTML = C.groups()
      .map((x) => `<li data-id="${esc(x.id)}"${x.id === cur ? ' class="on"' : ""}><button type="button" class="grip" aria-label="${esc(x.title)} の順番（↑↓キーでも動かせます）">≡</button><span class="edit-row-name jp">${esc(x.title)}</span><button type="button" class="mini danger" data-del-group="${esc(x.id)}" aria-label="グループ「${esc(x.title)}」を消す">けす</button></li>`)
      .join("");
  }
  // ≡ を つかんで ならべかえ（v2.2、本人「前へ　とか　後ろへ　とかも　こっちが頭で想像しなきゃいけない」）。キーボードは ↑ ↓
  makeSortable(rowsEl, {
    item: "li[data-id]",
    handle: ".grip",
    hold: 400,
    onEnd: (ids) => {
      C.setLinkOrder(C.current().id, ids);
      renderEdit();
      render();
    },
  });
  makeSortable($("group-rows"), {
    item: "li[data-id]",
    handle: ".grip",
    hold: 400,
    onEnd: (ids) => {
      C.setGroupOrder(ids);
      renderEdit();
      render();
    },
  });
  function gripKeys(listEl, move) {
    listEl.addEventListener("keydown", (e) => {
      const b = e.target.closest(".grip");
      if (!b || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      e.preventDefault();
      const id = b.closest("li").dataset.id;
      move(id, e.key === "ArrowUp" ? -1 : 1);
      renderEdit();
      render();
      listEl.querySelector(`li[data-id="${CSS.escape(id)}"] .grip`)?.focus();
    });
  }
  gripKeys(rowsEl, (id, d) => C.moveLink(C.current().id, id, d));
  gripKeys($("group-rows"), (id, d) => {
    const list = C.groups().map((x) => x.id);
    const i = list.indexOf(id);
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    C.setGroupOrder(list);
  });
  function openEdit() {
    const g = C.current();
    if (!g) return;
    editName.value = g.title;
    $("edit-error").hidden = true;
    $("edit-msg").textContent = "";
    renderEdit();
    photoBg.renderEdit();
    if (!editDialog.open) editDialog.showModal();
    sound.sfx.select();
  }
  rowsEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const g = C.current();
    const id = b.closest("li").dataset.id;
    const act = b.dataset.act;
    if (act === "out") {
      C.removeLink(g.id, id);
      $("edit-msg").textContent = `「${C.byId(id).label}」を外しました`;
    }
    renderEdit();
    render();
    rowsEl.querySelector(`li[data-id="${CSS.escape(id)}"] [data-act="${act}"]:not(:disabled)`)?.focus();
  });
  $("edit-add").addEventListener("click", () => openAdd({ fromEdit: true }));
  // グループを けす：一覧の 行ごとに（v2.2.1、本人「複数のグループけせるようにすれば？リンクとかと同じく」）。いま ひらいて いる グループを けしたら まどを とじる
  $("group-rows").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-del-group]");
    if (!b) return;
    const gid = b.dataset.delGroup;
    const g = C.groups().find((x) => x.id === gid);
    if (!g || !(await ask(`グループ「${g.title}」を消しますか？`))) return;
    const wasCurrent = C.current()?.id === gid;
    C.removeGroup(gid);
    render();
    if (wasCurrent || !C.current()) {
      editDialog.close();
      if (!C.current()) pixe.say(pixe.guide());
      return;
    }
    renderEdit();
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
  return { render, openGroup, openAdd, openEdit, iconHtml };
})();
