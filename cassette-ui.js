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
    shelvesEl.innerHTML = CASSETTES.SHELVES.map(
      (s) => `<section class="cas-shelf" aria-labelledby="cas-shelf-${s.id}">
        <h3 id="cas-shelf-${s.id}">${s.name}</h3>
        <div class="cas-grid">${CASSETTES.LIST.filter((c) => c.shelf === s.id)
          .map((c) => {
            const at = cur.indexOf(c.id);
            return `<button type="button" class="cas-item${at >= 0 ? " in" : ""}" data-id="${c.id}" aria-label="${c.label}${at >= 0 ? `（${at + 1}ばんめに はいってる）` : ""}">
              <span class="icon" data-icon="${c.id}"></span><span class="cas-name${CASSETTES.jp(c) ? " jp" : ""}" aria-hidden="true">${c.label}</span>${at >= 0 ? `<span class="cas-at" aria-hidden="true">${at + 1}</span>` : ""}</button>`;
          })
          .join("")}</div>
      </section>`
    ).join("");
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

  shelvesEl.addEventListener("click", (e) => {
    const b = e.target.closest(".cas-item");
    if (!b) return;
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

  return { open, openMenu };
})();
