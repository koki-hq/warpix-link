// ---------- 1きせいの きっぷ（v1.41）：正式な 開店（SNS で ひろめる 日）より まえに きてくれた ひとへの きねんひん ----------
// はじめて きた 日（grow.state.born）が CUTOFF より まえなら「1きせい」。あとから きた ひとは もう もらえない。
// じっせきや ずかんには いれない（あとから きた ひとが ぜんぶ そろえられなく なるので）。
// ROOM の にっきの プロフィール、ポストカード、ぼうけんの きろくカードに「1きせい」の しるし。
const ticket = (() => {
  const CUTOFF = "2026-11-01"; // この 日より まえに はじめて きた ひと。正式な 開店の 日が きまったら そこに あわせる
  const KEY = "warpix-ticket";
  const has = () => typeof grow !== "undefined" && grow.state.born < CUTOFF;
  const since = () => `${Number(grow.state.born.slice(5, 7))}/${Number(grow.state.born.slice(8, 10))}`;
  const peek = () => /[?&]date=/.test(location.search);

  // はじめて わたす ときだけ、ピクセが ひとこと
  on("boot", () => {
    if (!has() || store.get(KEY, null) || peek() || simple.on) return;
    store.set(KEY, { got: grow.state.born });
    npc.addIntro("……あっ、きみは 1きせい だね！\nまだ だれも しらない ころに きてくれた。");
    npc.addIntro("とくべつな きっぷを わたすよ。\nROOM の にっきに はさんで おいたね。");
    grow.write("ticket", "1きせいの きっぷを わたした。さいしょの おきゃくさん。", { force: true });
  });

  return { has, since, CUTOFF };
})();
