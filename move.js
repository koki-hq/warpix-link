// ---------- ピクセの ひっこし（v1.36）：あたらしい じゅうしょ link.warpix.app へ、きろくごと ----------
// ふるい じゅうしょ（koki-hq.github.io）で ひらくと、あたらしい おうちが できていれば ピクセが さそう。
// 「ひっこす」で きろくを ふっかつの じゅもんに して、あたらしい じゅうしょの #move= に のせて はこぶ（どこにも おくらない）。
// あたらしい じゅうしょでは、まだ きろくが なければ そのまま いれて よみなおし、あれば きいてから。
// （#move= は index.html の さいしょで ひろって、URL から けしてある → window.WARPIX_MOVE_IN）
const move = (() => {
  const { from, to } = window.WARPIX_MOVE ?? {};
  const OUT = "warpix-moved-out"; // もう ひっこした しるし（ふるい じゅうしょ がわ）
  const $ = (id) => document.getElementById(id);
  const dlg = $("move");
  const yes = $("move-yes");
  const no = $("move-no");
  let onYes = null;

  function ask({ text, addr = "", ok, cancel, go }) {
    $("move-text").textContent = text;
    $("move-addr").textContent = addr;
    $("move-addr").hidden = !addr;
    yes.textContent = ok ?? "";
    yes.hidden = !ok;
    no.textContent = cancel;
    onYes = go;
    dlg.showModal();
    (ok ? yes : no).focus();
  }
  // いつもの ページは PRESS START の あと、シンプルモードは すぐ
  function later(fn) {
    if (simple.on || document.body.classList.contains("booted")) fn();
    else on("boot", () => setTimeout(fn, 600));
  }

  yes.addEventListener("click", () => onYes?.());
  no.addEventListener("click", () => dlg.close());
  $("move-close").addEventListener("click", () => dlg.close());

  // ---------- ふるい じゅうしょ：あたらしい おうちが できていたら さそう ----------
  async function ready() {
    try {
      const res = await fetch(new URL("manifest.webmanifest", to), { cache: "no-store" });
      return res.ok && Boolean((await res.json()).name);
    } catch {
      return false;
    }
  }
  if (from && to && location.host === from) {
    ready().then((ok) => {
      if (!ok) return;
      const addr = new URL(to).host;
      later(() =>
        store.get(OUT, false)
          ? ask({
              text: "ぼくは もう あたらしい おうちに いるよ。\nこっちには もう こないから、あいに きてね。",
              addr,
              ok: "あたらしい おうちへ",
              cancel: "あとで",
              go: () => location.assign(to),
            })
          : ask({
              text: "あたらしい おうちが できたよ！\nきろくを ぜんぶ もって、いっしょに ひっこそう。",
              addr,
              ok: "きろくごと ひっこす",
              cancel: "あとで",
              go: async () => {
                const code = await save.encode();
                store.set(OUT, true);
                sound.sfx.coin?.();
                location.assign(`${to}#move=${code}`);
              },
            })
      );
    });
  }

  // ---------- あたらしい じゅうしょ：とどいた にもつを ほどく ----------
  const incoming = window.WARPIX_MOVE_IN;
  function unpack(box) {
    if (!save.restore(box.data)) return false;
    location.reload();
    return true;
  }
  const broken = () =>
    ask({
      text: "にもつが とちゅうで こわれちゃった……\nふるい おうちで ふっかつの じゅもんを コピーして、\n「このページについて」で いれてね。",
      cancel: "わかった",
    });
  if (incoming) {
    save.decode(incoming.code).then((box) => {
      if (!box) return later(broken);
      // まっさらな ブラウザなら、きかずに そのまま（ひっこしの ひの あいさつは save.js）
      if (!incoming.had) return unpack(box) || later(broken);
      later(() =>
        ask({
          text: `ふるい おうちから にもつが とどいたよ（${box.at ?? "いつか"} の きろく）。\nこの ブラウザの いまの きろくと いれかえる？`,
          ok: "いれかえる",
          cancel: "いまの まま",
          go: () => unpack(box) || broken(),
        })
      );
    });
  }

  return { ready };
})();
