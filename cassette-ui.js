// ---------- カセット えらびの まど（v1.28） ----------
// うえに いまの 6 こ（スロット）、したに たな。スロットを えらんで、たなの カセットを おすと いれかわる。
// たなの カセットが もう ほかの スロットに あれば、その 2 つを いれかえる（いつも 6 こ、おなじ ものは ない）。
// v1.56：リンクの したの ボタンは「リンクの へんせい」。いれかえる・パーティを ふやす（6 こ ぜんぶ えらんで できる）・なまえ・けす。
// パーティが 2 つ いじょう ある とき だけ、リンクの うえに「◀ PARTY 1 ▶」。おすそわけ（v1.32）は やめた（「こじんの せかい だから」）
const cassetteUi = (() => {
  const dialog = document.getElementById("cassette");
  const title = document.getElementById("cassette-title");
  const note = dialog.querySelector(".about-note");
  const slotsEl = document.getElementById("cas-slots");
  const shelvesEl = document.getElementById("cas-shelves");
  const msg = document.getElementById("cas-msg");
  const makeBtn = document.getElementById("cas-make");
  const resetBtn = document.getElementById("cas-reset");
  let sel = 0;
  // さいしょから ぜんぶ ひらく（v1.63.2、本人「むしろ 開くのが 手間」）。たためるのは そのまま
  const openShelves = new Set(CASSETTES.SHELVES.map((s) => s.id));
  // あたらしい パーティを つくって いる とちゅう（6 こ そろうまで のこさない）
  let draft = null;

  const drawIcons = (root) =>
    root.querySelectorAll("[data-icon]").forEach((el) => {
      if (ICONS[el.dataset.icon]) el.innerHTML = pixelSvg(ICONS[el.dataset.icon]);
    });

  const ids = () => draft ?? CASSETTES.current();

  function render() {
    const cur = ids();
    slotsEl.innerHTML = cur
      .map((id, i) => {
        const c = id && CASSETTES.byId(id);
        return `<li><button type="button" class="cas-slot${c ? "" : " empty"}" data-slot="${i}" aria-pressed="${i === sel}" aria-label="${i + 1}ばんめ：${c ? c.label : "まだ えらんでないよ"}">
          <span class="cas-no" aria-hidden="true">${i + 1}</span>${c ? `<span class="icon" data-icon="${id}"></span><span class="cas-name${CASSETTES.jp(c) ? " jp" : ""}" aria-hidden="true">${c.label}</span>` : `<span class="cas-name jp" aria-hidden="true">？</span>`}</button></li>`;
      })
      .join("");
    const item = (c) => {
      const at = cur.indexOf(c.id);
      return `<button type="button" class="cas-item${at >= 0 ? " in" : ""}" data-id="${c.id}" aria-label="${c.label}${at >= 0 ? `（${at + 1}ばんめに はいってる）` : ""}">
              <span class="icon" data-icon="${c.id}"></span><span class="cas-name${CASSETTES.jp(c) ? " jp" : ""}" aria-hidden="true">${c.label}</span>${at >= 0 ? `<span class="cas-at" aria-hidden="true">${at + 1}</span>` : ""}</button>`;
    };
    // じぶんの リンク（v1.61）：みぎうえの えんぴつで なおす・けす、さいごに「＋ つくる」
    const mine = () => {
      const list = CASSETTES.mine();
      return `${list.map((c) => `<div class="cas-mine">${item(c)}<button type="button" class="cas-edit" data-edit="${c.id}" aria-label="${c.label} を なおす">✎</button></div>`).join("")}${
        list.length < CASSETTES.MINE_MAX ? `<button type="button" class="cas-add" id="cas-add"><span aria-hidden="true">＋</span><span class="cas-name jp">つくる</span></button>` : ""
      }`;
    };
    // たなは たためる（v1.62）。いま はいって いる かずを みだしに
    shelvesEl.innerHTML = CASSETTES.SHELVES.map((s) => {
      const items = s.id === "mine" ? CASSETTES.mine() : CASSETTES.LIST.filter((c) => c.shelf === s.id);
      const using = items.filter((c) => cur.includes(c.id)).length;
      const count = s.id === "mine" ? `${CASSETTES.mine().length} / ${CASSETTES.MINE_MAX}` : using ? `・${using}` : "";
      return `<details class="cas-shelf${s.id === "mine" ? " cas-shelf-mine" : ""}" data-shelf="${s.id}"${openShelves.has(s.id) ? " open" : ""}>
        <summary><h3 id="cas-shelf-${s.id}">${s.name}${count ? ` <small>${count}</small>` : ""}</h3></summary>
        <div class="cas-grid">${s.id === "mine" ? mine() : items.map(item).join("")}</div>
      </details>`;
    }).join("");
    if (draft) makeBtn.disabled = draft.some((id) => !id);
    drawIcons(dialog);
  }

  // ページの リンクを かきかえて、アイコンを かく
  function applyToPage() {
    CASSETTES.apply();
    drawIcons(document.querySelector(".links"));
    bar();
  }

  slotsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".cas-slot");
    if (!b) return;
    sel = Number(b.dataset.slot);
    sound.sfx.hover();
    render();
    msg.textContent = `${sel + 1}ばんめに なにを いれる？`;
    slotsEl.querySelector(`[data-slot="${sel}"]`).focus();
  });

  shelvesEl.addEventListener("toggle", (e) => {
    const d = e.target.closest?.("details[data-shelf]");
    if (d) d.open ? openShelves.add(d.dataset.shelf) : openShelves.delete(d.dataset.shelf);
  }, true);
  shelvesEl.addEventListener("click", (e) => {
    if (e.target.closest("#cas-add")) return mylink.open();
    const ed = e.target.closest(".cas-edit");
    if (ed) return mylink.open(ed.dataset.edit);
    const b = e.target.closest(".cas-item");
    if (!b) return;
    // おした カセットの たなは ひらいた まま
    const shelf = b.closest("details[data-shelf]")?.dataset.shelf;
    if (shelf) openShelves.add(shelf);
    const id = b.dataset.id;
    const c = CASSETTES.byId(id);
    if (draft) {
      // つくって いる とちゅう：ほかの ばしょに あれば いれかえ、いれたら つぎの あいて いる ばしょへ
      if (draft[sel] === id) return (msg.textContent = `${c.label} は もう ${sel + 1}ばんめに はいってるよ。`);
      const j = draft.indexOf(id);
      if (j >= 0) draft[j] = draft[sel];
      draft[sel] = id;
      sound.sfx.coin();
      const left = draft.filter((x) => !x).length;
      msg.textContent = left ? `${sel + 1}ばんめを ${c.label} に した。あと ${left} こ。` : "6 こ そろった！";
      const next = draft.findIndex((x) => !x);
      if (next >= 0) sel = next;
      render();
      shelvesEl.querySelector(`[data-id="${id}"]`).focus();
      return;
    }
    if (!CASSETTES.put(sel, id)) {
      msg.textContent = `${c.label} は もう ${sel + 1}ばんめに はいってるよ。`;
      return;
    }
    applyToPage();
    sound.sfx.coin();
    msg.textContent = `${sel + 1}ばんめを ${c.label} に した。`;
    emit("cassette", { slot: sel, id });
    achievements.unlock("cassette");
    grow.write("cassette", `リンクに ${c.label} の カセットを いれた。`);
    render();
    shelvesEl.querySelector(`[data-id="${id}"]`).focus();
  });

  resetBtn.addEventListener("click", () => {
    CASSETTES.reset();
    applyToPage();
    sound.sfx.coin();
    msg.textContent = "いつもの 6 こに もどした。";
    emit("cassette", { reset: true });
    render();
  });

  makeBtn.addEventListener("click", () => {
    if (!draft || draft.some((id) => !id) || !CASSETTES.addParty(draft)) return;
    draft = null;
    dialog.close();
    applyToPage();
    swapLook();
    sound.sfx.powerup();
    emit("cassette", { party: CASSETTES.at() });
    achievements.unlock("cassette");
  });

  function open({ fresh = false } = {}) {
    sel = 0;
    draft = fresh ? Array(6).fill(null) : null;
    const n = CASSETTES.parties().length;
    title.textContent = fresh ? `PARTY ${n + 1} を つくる` : n > 1 ? `${CASSETTES.parties()[CASSETTES.at()].label} の リンク` : "カセット えらび";
    note.textContent = fresh ? "6 こ ぜんぶ えらぶと できるよ。" : "リンクは いつも 6 こ。いれかえる ばしょを えらんで、たなの カセットを おしてね。";
    makeBtn.hidden = !fresh;
    resetBtn.hidden = fresh;
    msg.textContent = fresh ? "1ばんめに なにを いれる？" : "";
    render();
    dialog.showModal();
    slotsEl.querySelector(".cas-slot").focus();
  }
  // とちゅうで とじたら、つくりかけは のこさない
  dialog.addEventListener("close", () => (draft = null));

  // ---------- リンクの へんせい（メニュー） ----------
  const menu = document.getElementById("hensei");
  const nowEl = document.getElementById("hensei-now");
  const addBtn = document.getElementById("hensei-add");
  const renameBtn = document.getElementById("hensei-rename");
  const removeBtn = document.getElementById("hensei-remove");
  const nameForm = document.getElementById("hensei-name");
  const nameInput = document.getElementById("hensei-input");
  const menuMsg = document.getElementById("hensei-msg");
  let removeArmed = false;

  function renderMenu() {
    const list = CASSETTES.parties();
    const many = list.length > 1;
    nowEl.textContent = many ? `いまの パーティ：${list[CASSETTES.at()].label}（${list.length} / ${CASSETTES.MAX}）` : "";
    nowEl.hidden = !many;
    addBtn.hidden = list.length >= CASSETTES.MAX;
    renameBtn.hidden = !many;
    removeBtn.hidden = !many;
    removeBtn.textContent = removeArmed ? "ほんとうに けす？ もう いちど おしてね" : "この パーティを けす";
  }
  function openMenu() {
    removeArmed = false;
    nameForm.hidden = true;
    menuMsg.textContent = "";
    renderMenu();
    menu.showModal();
    document.getElementById("hensei-swap").focus();
  }
  document.getElementById("hensei-swap").addEventListener("click", () => {
    menu.close();
    open();
  });
  addBtn.addEventListener("click", () => {
    menu.close();
    open({ fresh: true });
  });
  renameBtn.addEventListener("click", () => {
    nameForm.hidden = false;
    nameInput.value = CASSETTES.parties()[CASSETTES.at()].name;
    nameInput.focus();
  });
  nameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    CASSETTES.rename(CASSETTES.at(), nameInput.value);
    nameForm.hidden = true;
    sound.sfx.select();
    menuMsg.textContent = `なまえを「${CASSETTES.parties()[CASSETTES.at()].label}」に した。`;
    renderMenu();
    bar();
  });
  removeBtn.addEventListener("click", () => {
    if (!removeArmed) {
      removeArmed = true;
      renderMenu();
      return;
    }
    const gone = CASSETTES.parties()[CASSETTES.at()].label;
    CASSETTES.removeParty(CASSETTES.at());
    removeArmed = false;
    applyToPage();
    swapLook();
    menuMsg.textContent = `${gone} を けした。`;
    renderMenu();
  });
  document.getElementById("hensei-close").addEventListener("click", () => menu.close());
  menu.addEventListener("click", (e) => e.target === menu && menu.close());

  // ---------- リンクの うえの きりかえ ----------
  const barEl = document.getElementById("party-bar");
  const barName = document.getElementById("party-name");
  function bar() {
    const list = CASSETTES.parties();
    barEl.hidden = list.length < 2;
    barName.textContent = list[CASSETTES.at()].label;
  }
  // ゲームの パーティ きりかえ みたいに、リンクが ぱっと ならびなおす
  function swapLook() {
    const links = document.querySelector(".links");
    links.classList.remove("party-swap");
    void links.offsetWidth;
    links.classList.add("party-swap");
  }
  function step(d) {
    // ぼうけんや ミニゲームの とちゅうは あしばが かわって しまう ので きりかえない
    if (playing()) return;
    const n = CASSETTES.parties().length;
    if (!CASSETTES.switchTo((CASSETTES.at() + d + n) % n)) return;
    applyToPage();
    swapLook();
    sound.sfx.select();
    emit("cassette", { party: CASSETTES.at() });
  }
  document.getElementById("party-prev").addEventListener("click", () => step(-1));
  document.getElementById("party-next").addEventListener("click", () => step(1));
  bar();

  // ---------- じぶんの リンクを つくる・なおす（v1.61） ----------
  const mylink = (() => {
    const dlg = document.getElementById("mylink");
    const titleEl = document.getElementById("mylink-title");
    const form = document.getElementById("mylink-form");
    const nameIn = document.getElementById("mylink-name");
    const urlIn = document.getElementById("mylink-url");
    const iconsEl = document.getElementById("mylink-icons");
    const msgEl = document.getElementById("mylink-msg");
    const delBtn = document.getElementById("mylink-delete");
    let editing = null;
    let icon = "star";
    let armed = false;
    function drawIcons() {
      iconsEl.innerHTML = Object.entries(CASSETTES.MINE_ICONS)
        .map(([k, v]) => `<button type="button" class="mylink-icon" data-icon-key="${k}" aria-pressed="${k === icon}" aria-label="${v.name}">${pixelSvg(v.rows)}</button>`)
        .join("");
    }
    function open(id = null) {
      const c = id ? CASSETTES.byId(id) : null;
      editing = c ? id : null;
      icon = c?.iconKey ?? "star";
      armed = false;
      titleEl.textContent = c ? "じぶんの リンクを なおす" : "じぶんの リンクを つくる";
      nameIn.value = c?.label ?? "";
      urlIn.value = c?.url ?? "https://";
      msgEl.textContent = "";
      delBtn.hidden = !c;
      delBtn.textContent = "この リンクを けす";
      drawIcons();
      dlg.showModal();
      nameIn.focus();
    }
    iconsEl.addEventListener("click", (e) => {
      const b = e.target.closest(".mylink-icon");
      if (!b) return;
      icon = b.dataset.iconKey;
      sound.sfx.hover();
      drawIcons();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const label = nameIn.value.trim();
      if (!label) return (msgEl.textContent = "なまえを いれてね。");
      const ng = CASSETTES.checkMine(urlIn.value, editing);
      if (ng) return (msgEl.textContent = ng);
      const wasEditing = editing;
      const c = editing ? CASSETTES.updateMine(editing, { label, url: urlIn.value, icon }) : CASSETTES.addMine({ label, url: urlIn.value, icon });
      if (!c) return (msgEl.textContent = "つくれなかった……");
      ICONS[c.id] = c.icon;
      dlg.close();
      sound.sfx.coin();
      applyToPage();
      render();
      msg.textContent = wasEditing ? `${c.label} を なおした。` : `${c.label} が できた！ いれる ばしょを えらんで おしてね。`;
    });
    // けすのは 2 かい おし。パーティに はいって いたら、どこかを いう
    delBtn.addEventListener("click", () => {
      if (!editing) return;
      if (!armed) {
        armed = true;
        const where = CASSETTES.partiesWith(editing);
        const many = CASSETTES.parties().length > 1;
        msgEl.textContent = where.length
          ? `${many ? `${where.join("・")} に` : "いまの リンクに"} はいってるよ。けすと、そこは いつもの リンクに もどるよ。もう いちど おすと けす。`
          : "ほんとうに けす？ もう いちど おしてね。";
        delBtn.textContent = "ほんとうに けす";
        return;
      }
      const name = CASSETTES.byId(editing)?.label;
      CASSETTES.removeMine(editing);
      dlg.close();
      applyToPage();
      render();
      msg.textContent = `${name} を けした。`;
    });
    document.getElementById("mylink-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => e.target === dlg && dlg.close());
    return { open };
  })();

  // ---------- すうじキーで ワープ（v1.35）：1〜6 で その ばんごうの リンクへ ----------
  // もじを うっている とき・まどや かさねた がめん（おみくじ・スタッフロール など）が ひらいている とき・
  // ミニゲームや ぼうけんの とちゅうは はんのう しない。シンプルモードでも つかえる
  document.addEventListener("keydown", (e) => {
    if (!/^[1-6]$/.test(e.key) || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    if (!simple.on && (!document.body.classList.contains("booted") || playing())) return;
    if (document.querySelector('dialog[open], [role="dialog"]:not(dialog):not([hidden])')) return;
    const a = document.querySelectorAll(".links .pixel-btn:not(.secret)")[Number(e.key) - 1];
    if (!a) return;
    e.preventDefault();
    a.focus({ preventScroll: true });
    a.click(); // ふつうに おしたのと おなじ（あたらしい タブで ひらいて、ピクセも とびこむ）
    achievements.unlock("keywarp");
  });

  document.getElementById("cassette-btn").addEventListener("click", openMenu);
  document.getElementById("cassette-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());

  return { open, openMenu, mylink };
})();
