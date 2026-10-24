// ---------- サービスワーカー：オフラインでもピクセに会えるように ----------
// 公開するたびに VERSION を上げると、新しいファイルを取り直す
const VERSION = "warpix-v1.55.0";
const FONT_CACHE = "warpix-fonts";
const FILES = [
  "./",
  "index.html",
  "style.css",
  "fonts/dotgothic16.woff2",
  "config.js",
  "script.js",
  "game.js",
  "extras.js",
  "adventure.js",
  "world.js",
  "season.js",
  "device.js",
  "weather.js",
  "online.js",
  "raid.js",
  "tsubuyaki.js",
  "grow.js",
  "favorite.js",
  "compose.js",
  "omikuji.js",
  "zukan.js",
  "stamp.js",
  "atelier.js",
  "dream.js",
  "sky.js",
  "settings.js",
  "postcard.js",
  "hide.js",
  "voice.js",
  "rest.js",
  "news.js",
  "save.js",
  "move.js",
  "rta.js",
  "ticket.js",
  "opening.js",
  "kojo.js",
  "card.js",
  "satogaeri.js",
  "otegami.js",
  "warp.js",
  "cassette.js",
  "cassette-ui.js",
  "tonight.js",
  "letter.js",
  "guide.js",
  "about.js",
  "manual.js",
  "prologue.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 自分のファイル：キャッシュをすぐ返し、裏で新しいものに更新しておく
  // （おなじ github.io でも、ほかの リポジトリ＝製作所だより などは ふつうに ネットへ）
  if (url.origin === location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname)) {
    e.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const hit = await cache.match(req, { ignoreSearch: true });
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || fresh;
      })
    );
    return;
  }

  // Google Fonts：一度取ったらキャッシュから（オフラインでもドット文字のまま）
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") cache.put(req, res.clone());
        return res;
      })
    );
  }
  // それ以外（天気、オンライン機能）はふつうにネットへ
});
