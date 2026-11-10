// ---------- グループと リンク（v2.0）：この アプリの しゅやく ----------
// 本人「パーティがあって　リンクがあるって感じ　パーティが重要」→ なまえは「グループ」。
// ながれ：＋（グループを ついか）→ タイトル（ひっす・12 文字まで）→ グループの なかの「＋」で リンクを ついか。
// 1 グループ 12 こ まで（2 列 × 6 段。iPhone SE でも 1 画面）。リンクの アイコンは ファビコンを つかわない
// （そとに URL を おくらない）。なまえの あたまの 1 文字と、URL で きまる 色
const groups = (() => {
  const MAX_LINKS = 12;
  const MAX_TITLE = 12;
  const MAX_NAME = 16;
  const COLORS = ["#ff4fa3", "#3ee8ff", "#ffd84a", "#7cf08a", "#b48cff", "#ff9a52"];

  let list = store.get(KEY.groups, []);
  if (!Array.isArray(list)) list = [];
  let current = Number(store.get(KEY.current, 0)) || 0;
  const save = () => {
    store.set(KEY.groups, list);
    store.set(KEY.current, current);
  };
  const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const clampCurrent = () => (current = list.length ? ((current % list.length) + list.length) % list.length : 0);
  clampCurrent();

  // ---------- URL と なまえ ----------
  function normalizeUrl(raw) {
    let s = String(raw ?? "").trim();
    if (!s) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s}`;
    try {
      const u = new URL(s);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      if (!u.hostname.includes(".") && u.hostname !== "localhost") return null;
      return u.href;
    } catch {
      return null;
    }
  }
  const siteName = (url) => new URL(url).hostname.replace(/^www\./, "");
  const colorOf = (url) => {
    let h = 0;
    for (const ch of url) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return COLORS[h % COLORS.length];
  };
  const initialOf = (name) => (Array.from(name.trim())[0] ?? "?").toUpperCase();
  const cut = (s, n) => Array.from(String(s).trim()).slice(0, n).join("");

  // ---------- データの そうさ ----------
  const byId = (id) => list.find((g) => g.id === id);
  function addGroup(title) {
    const t = cut(title, MAX_TITLE);
    if (!t) return null;
    const g = { id: newId(), title: t, links: [] };
    list.push(g);
    current = list.length - 1;
    save();
    return g;
  }
  function renameGroup(id, title) {
    const t = cut(title, MAX_TITLE);
    const g = byId(id);
    if (!g || !t) return false;
    g.title = t;
    save();
    return true;
  }
  function removeGroup(id) {
    const i = list.findIndex((g) => g.id === id);
    if (i < 0) return;
    list.splice(i, 1);
    if (current >= i && current > 0) current--;
    clampCurrent();
    save();
  }
  function moveGroup(id, dir) {
    const i = list.findIndex((g) => g.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    current = j;
    save();
  }
  function addLink(gid, { url, name }) {
    const g = byId(gid);
    const u = normalizeUrl(url);
    if (!g || !u || g.links.length >= MAX_LINKS) return null;
    const link = { id: newId(), url: u, name: cut(name, MAX_NAME) || siteName(u) };
    g.links.push(link);
    save();
    return link;
  }
  function updateLink(gid, lid, { url, name }) {
    const l = byId(gid)?.links.find((x) => x.id === lid);
    const u = normalizeUrl(url);
    if (!l || !u) return false;
    l.url = u;
    l.name = cut(name, MAX_NAME) || siteName(u);
    save();
    return true;
  }
  function removeLink(gid, lid) {
    const g = byId(gid);
    if (!g) return;
    g.links = g.links.filter((l) => l.id !== lid);
    save();
  }
  function moveLink(gid, lid, dir) {
    const g = byId(gid);
    const i = g?.links.findIndex((l) => l.id === lid) ?? -1;
    const j = i + dir;
    if (i < 0 || j < 0 || j >= g.links.length) return;
    [g.links[i], g.links[j]] = [g.links[j], g.links[i]];
    save();
  }

  // ---------- 画面 ----------
  const $ = (id) => document.getElementById(id);
  const emptyEl = $("empty");
  const barEl = $("group-bar");
  const titleEl = $("group-title");
  const dotsEl = $("group-dots");
  const linksEl = $("links");

  function render() {
    clampCurrent();
    const g = list[current];
    document.body.classList.toggle("no-groups", !g);
    emptyEl.hidden = !!g;
    barEl.hidden = !g;
    linksEl.hidden = !g;
    if (!g) {
      linksEl.innerHTML = "";
      return;
    }
    titleEl.textContent = g.title;
    dotsEl.innerHTML = list.map((_, i) => `<span class="dot${i === current ? " on" : ""}"></span>`).join("");
    dotsEl.setAttribute("aria-label", `${list.length} この うち ${current + 1} ばんめ`);
    const many = list.length > 1;
    $("group-prev").disabled = !many;
    $("group-next").disabled = !many;
    const tiles = g.links.map(
      (l) => `<a class="tile" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" data-id="${l.id}"><span class="tile-icon" style="background:${colorOf(l.url)}" aria-hidden="true">${esc(initialOf(l.name))}</span><span class="tile-name">${esc(l.name)}</span><span class="sr-only">（あたらしい タブで ひらく）</span></a>`
    );
    if (g.links.length < MAX_LINKS) tiles.push(`<button type="button" class="tile tile-add" id="add-link">＋ リンクを ついか</button>`);
    linksEl.innerHTML = tiles.join("");
    linksEl.setAttribute("aria-label", `${g.title} の リンク`);
  }

  function go(dir) {
    if (list.length < 2) return;
    current = (current + dir + list.length) % list.length;
    save();
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
    if (e.target.closest("#add-link")) return openLinkDialog();
    const a = e.target.closest("a.tile");
    if (!a) return;
    const g = list[current];
    const l = g.links.find((x) => x.id === a.dataset.id);
    if (!l) return;
    warpLog.record({ url: l.url, name: l.name, group: g.title });
    warpDive.dive(a, l.name);
  });

  // ---------- まど：グループを つくる ----------
  const groupDialog = $("group-dialog");
  const groupInput = $("group-name");
  const groupCount = $("group-count");
  const groupError = $("group-error");
  const countTitle = () => (groupCount.textContent = `${Array.from(groupInput.value.trim()).length} / ${MAX_TITLE} 文字`);
  function openGroupDialog() {
    groupInput.value = "";
    groupError.hidden = true;
    countTitle();
    groupDialog.showModal();
    sound.sfx.select();
    groupInput.focus();
  }
  groupInput.addEventListener("input", () => {
    groupError.hidden = true;
    countTitle();
  });
  $("group-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const g = addGroup(groupInput.value);
    if (!g) {
      groupError.hidden = false;
      groupInput.focus();
      return;
    }
    groupDialog.close();
    render();
    sound.sfx.coin();
    pixe.say("いい なまえ！\nつぎは リンクを いれてみよう。");
  });
  $("group-cancel").addEventListener("click", () => groupDialog.close());
  $("add-group").addEventListener("click", openGroupDialog);
  $("empty-add").addEventListener("click", openGroupDialog);

  // ---------- まど：リンクを ついか・なおす ----------
  const linkDialog = $("link-dialog");
  const urlInput = $("link-url");
  const nameInput = $("link-name");
  const linkError = $("link-error");
  const preview = $("link-preview");
  let editing = null; // { gid, lid } なおす とき
  function showPreview() {
    const u = normalizeUrl(urlInput.value);
    const name = cut(nameInput.value, MAX_NAME) || (u ? siteName(u) : "");
    preview.hidden = !u;
    if (!u) return;
    preview.querySelector(".tile-icon").style.background = colorOf(u);
    preview.querySelector(".tile-icon").textContent = initialOf(name);
    preview.querySelector(".tile-name").textContent = name;
  }
  function openLinkDialog(link = null) {
    const g = list[current];
    if (!g) return;
    editing = link ? { gid: g.id, lid: link.id } : null;
    $("link-title").textContent = link ? "リンクを なおす" : "リンクを ついか";
    $("link-group").textContent = g.title;
    $("link-save").textContent = link ? "ほぞん" : "ついか";
    urlInput.value = link?.url ?? "";
    nameInput.value = link?.name ?? "";
    linkError.hidden = true;
    showPreview();
    if (editDialog.open) editDialog.close();
    linkDialog.showModal();
    sound.sfx.select();
    urlInput.focus();
  }
  urlInput.addEventListener("input", () => {
    linkError.hidden = true;
    showPreview();
  });
  nameInput.addEventListener("input", showPreview);
  $("link-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const g = list[current];
    if (!normalizeUrl(urlInput.value)) {
      linkError.hidden = false;
      urlInput.focus();
      return;
    }
    const before = list.reduce((s, x) => s + x.links.length, 0);
    if (editing) updateLink(editing.gid, editing.lid, { url: urlInput.value, name: nameInput.value });
    else addLink(g.id, { url: urlInput.value, name: nameInput.value });
    linkDialog.close();
    render();
    sound.sfx.coin();
    if (editing) openEditDialog();
    else pixe.say(before === 0 ? "やった！ おすと\nいっしょに ワープできるよ。" : "ふえたね！");
  });
  $("link-cancel").addEventListener("click", () => {
    linkDialog.close();
    if (editing) openEditDialog();
  });

  // ---------- まど：グループを へんしゅう（✏️） ----------
  const editDialog = $("edit-dialog");
  const editName = $("edit-name");
  const editList = $("edit-links");
  function renderEdit() {
    const g = list[current];
    if (!g) return;
    $("edit-count").textContent = `リンク ${g.links.length} / ${MAX_LINKS}`;
    editList.innerHTML = g.links.length
      ? g.links
          .map(
            (l, i) => `<li data-id="${l.id}"><span class="tile-icon" style="background:${colorOf(l.url)}" aria-hidden="true">${esc(initialOf(l.name))}</span><span class="edit-link-name">${esc(l.name)}</span><span class="edit-link-btns"><button type="button" class="mini" data-act="up" aria-label="${esc(l.name)} を うえへ" ${i === 0 ? "disabled" : ""}>↑</button><button type="button" class="mini" data-act="down" aria-label="${esc(l.name)} を したへ" ${i === g.links.length - 1 ? "disabled" : ""}>↓</button><button type="button" class="mini" data-act="edit" aria-label="${esc(l.name)} を なおす">なおす</button><button type="button" class="mini danger" data-act="del" aria-label="${esc(l.name)} を けす">けす</button></span></li>`
          )
          .join("")
      : `<li class="edit-empty">まだ リンクは ありません</li>`;
    $("edit-prev").disabled = current === 0;
    $("edit-next").disabled = current === list.length - 1;
  }
  function openEditDialog() {
    const g = list[current];
    if (!g) return;
    editName.value = g.title;
    $("edit-error").hidden = true;
    renderEdit();
    if (!editDialog.open) editDialog.showModal();
    sound.sfx.select();
  }
  $("group-edit").addEventListener("click", openEditDialog);
  $("edit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const g = list[current];
    if (!renameGroup(g.id, editName.value)) {
      $("edit-error").hidden = false;
      editName.focus();
      return;
    }
    render();
    editDialog.close();
  });
  editName.addEventListener("input", () => ($("edit-error").hidden = true));
  editList.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const g = list[current];
    const lid = b.closest("li").dataset.id;
    const link = g.links.find((l) => l.id === lid);
    const act = b.dataset.act;
    if (act === "up" || act === "down") {
      moveLink(g.id, lid, act === "up" ? -1 : 1);
      renderEdit();
      render();
      editList.querySelector(`li[data-id="${lid}"] [data-act="${act}"]:not(:disabled)`)?.focus();
    } else if (act === "edit") {
      openLinkDialog(link);
    } else if (act === "del") {
      if (!confirm(`「${link.name}」を けしますか？`)) return;
      removeLink(g.id, lid);
      renderEdit();
      render();
    }
  });
  $("edit-prev").addEventListener("click", () => {
    moveGroup(list[current].id, -1);
    renderEdit();
    render();
  });
  $("edit-next").addEventListener("click", () => {
    moveGroup(list[current].id, 1);
    renderEdit();
    render();
  });
  $("edit-delete").addEventListener("click", () => {
    const g = list[current];
    if (!confirm(`グループ「${g.title}」と、その なかの リンク ${g.links.length} こを けしますか？`)) return;
    removeGroup(g.id);
    editDialog.close();
    render();
    if (!list.length) pixe.say("まだ リンクが ないね。\nいっしょに つくろう！");
  });
  $("edit-close").addEventListener("click", () => editDialog.close());

  // まどの そとを おすと とじる（グループ・リンク・へんしゅう）
  for (const d of [groupDialog, linkDialog, editDialog]) d.addEventListener("click", (e) => e.target === d && d.close());

  function reload() {
    list = store.get(KEY.groups, []);
    if (!Array.isArray(list)) list = [];
    current = Number(store.get(KEY.current, 0)) || 0;
    render();
  }

  render();
  return {
    list: () => list,
    current: () => current,
    render,
    reload,
    addGroup,
    addLink,
    normalizeUrl,
    siteName,
    MAX_LINKS,
    MAX_TITLE,
    openGroupDialog,
    openLinkDialog,
    openEditDialog,
  };
})();
