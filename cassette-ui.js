// ---------- カセット えらびの まど（v1.28） ----------
// うえに いまの 6 こ（スロット）、したに たな。スロットを えらんで、たなの カセットを おすと いれかわる。
// たなの カセットが もう ほかの スロットに あれば、その 2 つを いれかえる（いつも 6 こ、おなじ ものは ない）。
const cassetteUi = (() => {
  const dialog = document.getElementById("cassette");
  const slotsEl = document.getElementById("cas-slots");
  const shelvesEl = document.getElementById("cas-shelves");
  const msg = document.getElementById("cas-msg");
  let sel = 0;

  const drawIcons = (root) =>
    root.querySelectorAll("[data-icon]").forEach((el) => {
      if (ICONS[el.dataset.icon]) el.innerHTML = pixelSvg(ICONS[el.dataset.icon]);
    });

  function render() {
    const cur = CASSETTES.current();
    slotsEl.innerHTML = cur
      .map((id, i) => {
        const c = CASSETTES.byId(id);
        return `<li><button type="button" class="cas-slot" data-slot="${i}" aria-pressed="${i === sel}" aria-label="${i + 1}ばんめ：${c.label}">
          <span class="cas-no" aria-hidden="true">${i + 1}</span><span class="icon" data-icon="${id}"></span><span class="cas-name${CASSETTES.jp(c) ? " jp" : ""}" aria-hidden="true">${c.label}</span></button></li>`;
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
    drawIcons(dialog);
  }

  // ページの リンクを かきかえて、アイコンを かく
  function applyToPage() {
    CASSETTES.apply();
    drawIcons(document.querySelector(".links"));
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

  document.getElementById("cas-reset").addEventListener("click", () => {
    CASSETTES.reset();
    applyToPage();
    sound.sfx.coin();
    msg.textContent = "いつもの 6 こに もどした。";
    emit("cassette", { reset: true });
    render();
  });

  function open() {
    sel = 0;
    msg.textContent = "";
    render();
    dialog.showModal();
    slotsEl.querySelector(".cas-slot").focus();
  }

  // ---------- おすそわけ（v1.32）：いまの 6 こを URL で ともだちに わたす ----------
  const shareMsg = document.getElementById("cas-share-msg");
  document.getElementById("cas-share").addEventListener("click", async () => {
    const url = CASSETTES.shareUrl();
    const done = (text) => {
      shareMsg.textContent = text;
      achievements.unlock("cassette-share");
    };
    try {
      if (navigator.share) {
        await navigator.share({ title: "WARPIX-LINK の カセット", text: "ぼくの 6 この リンク、つかってみて！", url });
        return done("おすそわけ したよ。");
      }
    } catch (err) {
      if (err?.name === "AbortError") return; // じぶんで やめた
    }
    try {
      await navigator.clipboard.writeText(url);
      done("URL を コピーしたよ。ともだちに おくってね。");
    } catch {
      done(`この URL を おくってね：${url}`);
    }
  });

  // ---------- とどいた カセット（?cassette=…） ----------
  const gift = document.getElementById("cas-gift");
  const params = new URLSearchParams(location.search);
  const incoming = CASSETTES.parse(params.get("cassette"));
  if (params.has("cassette")) {
    // ひらきなおしても なんども きかない ように、URL から けしておく
    params.delete("cassette");
    const q = params.toString();
    history.replaceState(null, "", `${location.pathname}${q ? `?${q}` : ""}${location.hash}`);
  }
  function offer() {
    document.getElementById("cas-gift-slots").innerHTML = incoming
      .map((id, i) => {
        const c = CASSETTES.byId(id);
        return `<li><span class="cas-slot static" aria-label="${i + 1}ばんめ：${c.label}"><span class="cas-no" aria-hidden="true">${i + 1}</span><span class="icon" data-icon="${id}"></span><span class="cas-name${CASSETTES.jp(c) ? " jp" : ""}" aria-hidden="true">${c.label}</span></span></li>`;
      })
      .join("");
    drawIcons(gift);
    gift.showModal();
    document.getElementById("cas-gift-yes").focus();
  }
  if (incoming && incoming.join() !== CASSETTES.current().join()) {
    // いつもの ページは PRESS START の あと、シンプルモードは すぐ
    if (simple.on) offer();
    else on("boot", () => setTimeout(offer, 600));
  }
  document.getElementById("cas-gift-yes").addEventListener("click", () => {
    CASSETTES.set(incoming);
    applyToPage();
    sound.sfx.coin();
    emit("cassette", { gift: true });
    achievements.unlock("cassette-share");
    grow.write("cassette-gift", "ともだちの カセットを いれた。");
    gift.close();
  });
  document.getElementById("cas-gift-no").addEventListener("click", () => gift.close());
  document.getElementById("cas-gift-close").addEventListener("click", () => gift.close());

  document.getElementById("cassette-btn").addEventListener("click", open);
  document.getElementById("cassette-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());

  return { open };
})();
