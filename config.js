// オンライン機能（ほかの訪問者と同じ空）の設定。空のままならオンライン機能は動かない。
// url と key は「ブラウザに載せてよい公開用の値」（Supabase の Project URL と anon / publishable キー）。
// service_role や secret と書かれたキーは、絶対にここに書かないこと。
// （v1.59 まで：製作所だより の ばしょ。いまは つかって いない）
window.WARPIX_NEWS ??= "https://warpix.app/news.json";
// ひっこし（move.js）：ふるい じゅうしょ（from）で ひらいたら、あたらしい じゅうしょ（to）へ きろくごと さそう
window.WARPIX_MOVE ??= { from: "koki-hq.github.io", to: "https://link.warpix.app/" };

// きた ひとの かず（count.js、v1.65）：Cloudflare Web Analytics の トークン（ページに のせて いい 公開の 値）
window.WARPIX_COUNT ??= { token: "", host: "link.warpix.app" };

window.WARPIX_ONLINE = {
  url: "https://zjyzaisimszjldnacxle.supabase.co",
  key: "sb_publishable_giKwovyrft455Vy2fgw5JQ_aUdrjfUR",
};
