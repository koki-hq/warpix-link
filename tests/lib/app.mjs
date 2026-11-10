// v2.0 の テストで つかう 道具：まっさらな ページを ひらく、グループと リンクを いれておく
import * as harness from "./harness.mjs";

// ひらく。storage を わたすと、その きろくを いれてから ひらきなおす（localStorage の キー → あたい）
export async function openApp(t, { width = 390, height = 844, query = "", storage = null, mobile = true } = {}) {
  const server = await t.startServer();
  const b = await t.launchBrowser({ width, height });
  const p = await b.firstPage();
  await p.size(width, height, mobile);
  await p.goto(server.url + query, 300);
  await p.ev(`localStorage.clear()`);
  if (storage) await p.ev(`(() => { const s = ${JSON.stringify(storage)}; for (const k in s) localStorage.setItem(k, typeof s[k] === "string" ? s[k] : JSON.stringify(s[k])); })()`);
  await p.goto(server.url + query, 600);
  return { server, b, p };
}

// グループと リンクの きろく（KEY.groups の なかみ）：[[なまえ, [たなの id…]], …]
export function groupsData(spec, at = 0) {
  return { at, list: spec.map(([title, ids], i) => ({ id: `g${i}`, title, ids })) };
}

export const BAND = ["youtube", "spotify", "twitter", "instagram", "tiktok", "ytmusic", "applemusic", "line", "discord", "soundcloud", "niconico", "booth"];

// 新しい タブを ひらかない ように、リンクを おした ときの うごきだけ とめる（きろくと ワープは そのまま）
export const noNavigate = (p) => p.ev(`document.addEventListener("click", (e) => { if (e.target.closest(".links a.pixel-btn")) e.preventDefault(); }, true)`);

export const sleep = harness.sleep;
