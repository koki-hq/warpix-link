// ---------- きた ひとの かず（v1.65）----------
// Cloudflare Web Analytics：クッキー なし、ひとりずつは おわない。なんにん きたか だけ。
// SNS の プロフィールの 入口（/x/ /ig/ /tt/ /yt/）も これを よんでから 本体へ うつる。
// トークンと ホストは config.js（WARPIX_COUNT）。テストでは 空なので なにも しない
(() => {
  const cfg = window.WARPIX_COUNT ?? {};
  if (!cfg.token || location.hostname !== cfg.host) return;
  const s = document.createElement("script");
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.dataset.cfBeacon = JSON.stringify({ token: cfg.token, spa: false });
  document.head.append(s);
})();
