// ---------- ピクセの ガイド：2 日目から、1 日 1 つだけ「きょうの ヒント」 ----------
// まだ使ったことのない機能を、あいさつの最後にそっと教える。使ったことのある機能はとばす。
// ひみつのコマンドの答えは言わない。ぜんぶ伝えおわったら、もう言わない。
const guide = (() => {
  const KEY = "warpix-guide";
  const preview = new URLSearchParams(location.search).has("date");
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymd = (() => { const d = today(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; })();
  const state = store.get(KEY, null) ?? { last: null, told: [] };
  const save = () => !preview && store.set(KEY, state);

  // [名前, ヒント, もう使ったか]
  const has = (id) => achievements.has(id);
  const TIPS = [
    ["diary", "ひだりうえの DIARY に、ぼくの にっきと\nずかんが あるよ。のぞいてみて。", () => has("diary")],
    ["compose", "みぎうえの ♪ で、ぼくと いっしょに\nさっきょく できるよ。", () => has("composer") || store.get("warpix-song", null)],
    ["omikuji", "いちばん したの「おみくじ」、\nまいにち 1かい ひけるよ。", () => has("omikuji")],
    ["invaders", "INSERT COIN を おすと、\nミニゲームで あそべるよ。", () => has("invader") || has("invader-pro")],
    ["wardrobe", "じっせきの まどの WARDROBE で、\nぼくの ぼうしを かえられるよ。", () => has("fashion")],
    ["postcard", "ノートの「ポストカード」で、\nぼくの えはがきが つくれるよ。", () => has("postcard")],
    ["settings", "おとが おおきかったら、いちばん したの\n「せってい」で かえられるよ。", () => store.get("warpix-settings", null)],
    ["adventure", "ぼくが「そとに でてみたい」って きいたら、\n「いいよ」って いってみて。", () => has("adventure")],
    ["simple", "リンクだけ みたい ひは、\nみぎうえの SIMPLE で しずかに なるよ。", () => store.get("warpix-simple", null) === "on"],
  ];

  // きょう言うヒント（なければ null）
  function pick() {
    if (state.last === ymd) return null;
    if ((grow.state.days?.length ?? 0) < 2) return null; // はじめての日は、あいさつだけ
    return TIPS.find(([id, , used]) => !state.told.includes(id) && !used()) ?? null;
  }

  const tip = pick();
  if (tip) {
    const [id, text] = tip;
    npc.addIntro(`きょうの ヒント：\n${text}`);
    state.last = ymd;
    state.told.push(id);
    save();
  }

  return { pick, tips: TIPS.map(([id]) => id), state };
})();
