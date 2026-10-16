// ---------- せってい：音量、動きを減らす、よみやすい もじ、キー操作の一覧 ----------
// 設定はこのブラウザに保存する。動き・文字は <head> の中で描く前に切りかえ、変えたときはページを読みなおす。
const settings = (() => {
  const KEY = "warpix-settings";
  const state = { bgm: 100, se: 100, motion: "auto", font: "pixel", voice: "off", ...store.get(KEY, {}) };
  const save = () => store.set(KEY, state);

  // 音量はすぐに反映（0〜100 → 0〜1）
  const applyVolumes = () => sound.setVolumes({ bgm: state.bgm / 100, se: state.se / 100 });
  applyVolumes();

  const dialog = document.getElementById("settings");
  const bgm = document.getElementById("set-bgm");
  const se = document.getElementById("set-se");
  const bgmOut = document.getElementById("set-bgm-out");
  const seOut = document.getElementById("set-se-out");
  const motion = document.getElementById("set-motion");
  const font = document.getElementById("set-font");
  const note = document.getElementById("settings-note");
  const osReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function render() {
    bgm.value = state.bgm;
    se.value = state.se;
    bgmOut.textContent = String(state.bgm);
    seOut.textContent = String(state.se);
    motion.checked = state.motion === "reduce" || osReduce;
    motion.disabled = osReduce; // OS で減らしているときは、いつも減らす
    font.checked = state.font === "plain";
    note.textContent = osReduce ? "※ OS の せっていで「うごきを へらす」に なっているので、いつも へらします。" : "";
  }

  bgm.addEventListener("input", () => {
    state.bgm = Number(bgm.value);
    bgmOut.textContent = String(state.bgm);
    applyVolumes();
    save();
  });
  se.addEventListener("input", () => {
    state.se = Number(se.value);
    seOut.textContent = String(state.se);
    applyVolumes();
    save();
  });
  // 指をはなしたときに、いまの大きさの効果音を 1 回だけ鳴らす
  se.addEventListener("change", () => sound.sfx.coin());

  // 動き・文字は、ページを読みなおして切りかえる（動いている演出をまるごと止める・変えるため）
  const reloadWith = (change) => {
    Object.assign(state, change);
    save();
    location.reload();
  };
  motion.addEventListener("change", () => reloadWith({ motion: motion.checked ? "reduce" : "auto" }));
  font.addEventListener("change", () => reloadWith({ font: font.checked ? "plain" : "pixel" }));

  // ほかの ファイルが、ひらく ときに じぶんの ぶんを かきなおせるように
  const openHooks = [];
  function open() {
    render();
    openHooks.forEach((fn) => fn());
    dialog.showModal();
  }
  document.getElementById("settings-btn").addEventListener("click", open);
  document.getElementById("settings-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
  cheats.add("settings", open);

  return { state, open, save, onOpen: (fn) => openHooks.push(fn) };
})();
