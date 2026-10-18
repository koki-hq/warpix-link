// オンライン機能（ほかの訪問者と同じ空）の設定。空のままならオンライン機能は動かない。
// url と key は「ブラウザに載せてよい公開用の値」（Supabase の Project URL と anon / publishable キー）。
// service_role や secret と書かれたキーは、絶対にここに書かないこと。
// 製作所だより（WARPIX製作所の ホームページの おしらせ）。news.js が よむ
window.WARPIX_NEWS ??= "https://warpix.app/news.json";
// ひっこし（move.js）：ふるい じゅうしょ（from）で ひらいたら、あたらしい じゅうしょ（to）へ きろくごと さそう
window.WARPIX_MOVE ??= { from: "koki-hq.github.io", to: "https://link.warpix.app/" };

window.WARPIX_ONLINE = {
  url: "https://zjyzaisimszjldnacxle.supabase.co",
  key: "sb_publishable_giKwovyrft455Vy2fgw5JQ_aUdrjfUR",
};
