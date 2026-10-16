// ---------- きろくを まもる・ひっこす：きえにくく する、ピクセの ひとこと、ふっかつの じゅもん ----------
// じゅもんは この ブラウザの きろく（warpix- で はじまる もの）を ぜんぶ まとめて、ちぢめて、もじに したもの。
// べつの ブラウザで いれると、そっくり ひっこせる。どこにも おくらない。
const save = (() => {
  const PREFIX = "WARPIX1-";
  const MOVED = "warpix-moved"; // ひっこして きた しるし（つぎに ひらいた ときに ピクセが よろこぶ）
  const WARNED = "warpix-save-told";
  const SKIP = new Set([MOVED, "warpix-lastseen"]); // さいごに みていた じこくは もちはこばない（おるすばんが でてしまう）
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymd = (() => { const d = today(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; })();

  // ---------- きえにくく する（ブラウザに「けさないで」と おねがい） ----------
  const storage = navigator.storage;
  const persisted = async () => {
    try { return (await storage?.persisted?.()) ?? false; } catch { return false; }
  };
  async function persist() {
    try {
      if (await persisted()) return true;
      return (await storage?.persist?.()) ?? false;
    } catch {
      return false;
    }
  }
  // ホームがめんの アプリなら、だまって おねがいしておく（ブラウザが きく ときだけ きいてくれる）
  if (pocket.standalone()) persist();

  // ---------- じゅもん：つくる・よむ ----------
  const toB64 = (bytes) => {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  };
  const fromB64 = (text) => Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
  const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  const canZip = typeof CompressionStream === "function";

  function collect() {
    const data = {};
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("warpix-") && !SKIP.has(k)) data[k] = localStorage.getItem(k);
    } catch {}
    return data;
  }

  async function encode(data = collect()) {
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, at: ymd, data }));
    return canZip ? `${PREFIX}z${toB64(await through(bytes, new CompressionStream("deflate-raw")))}` : `${PREFIX}j${toB64(bytes)}`;
  }

  // まちがっていたら null
  async function decode(code) {
    try {
      const text = String(code).replace(/\s+/g, "");
      if (!text.startsWith(PREFIX)) return null;
      const kind = text[PREFIX.length];
      let bytes = fromB64(text.slice(PREFIX.length + 1));
      if (kind === "z") bytes = await through(bytes, new DecompressionStream("deflate-raw"));
      else if (kind !== "j") return null;
      const box = JSON.parse(new TextDecoder().decode(bytes));
      if (box?.v !== 1 || typeof box.data !== "object" || !box.data) return null;
      const entries = Object.entries(box.data);
      if (!entries.every(([k, v]) => k.startsWith("warpix-") && typeof v === "string")) return null;
      return { at: box.at, data: box.data, count: entries.length };
    } catch {
      return null;
    }
  }

  // いまの きろくを けして、じゅもんの きろくに いれかえる
  function restore(data) {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("warpix-")).forEach((k) => localStorage.removeItem(k));
      for (const [k, v] of Object.entries(data)) if (!SKIP.has(k)) localStorage.setItem(k, v);
      localStorage.setItem(MOVED, JSON.stringify(ymd));
      return true;
    } catch {
      return false;
    }
  }

  // ---------- ひっこして きた ひ ----------
  const moved = store.get(MOVED, null);
  if (moved) {
    try { localStorage.removeItem(MOVED); } catch {}
    npc.addIntro("……おもいだした！ ひさしぶり！\nひっこし、おつかれさま。");
    grow.write("moved", "ひっこしの ひ。ふっかつの じゅもんで、あたらしい ブラウザに きた。", { force: true });
  }

  // ---------- ピクセの ひとこと（いちどだけ） ----------
  // 3 日 あうように なったら。ホームがめんの アプリで ひらいている ときと、もう「けさないで」が きいている ときは いわない
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!moved && !store.get(WARNED, false) && (grow.state.days?.length ?? 0) >= 3 && !pocket.standalone() && !simple.on) {
    persisted().then((ok) => {
      if (ok) return;
      store.set(WARNED, true);
      npc.addIntro("ねえ、ぼくの きおくは この ブラウザの なかに\nしまってるんだ。けされたら、わすれちゃうかも……");
      npc.addIntro(
        ios
          ? "ホームがめんに いれて ひらくと、きえにくく なるよ。\n「このページについて」で ふっかつの じゅもんも つくれる。"
          : "「このページについて」で、ふっかつの じゅもんを\nつくっておくと あんしんだよ。"
      );
    });
  }

  // ---------- 「このページについて」の なかの ボタン ----------
  const $ = (id) => document.getElementById(id);
  const status = $("save-status");
  const input = $("save-input");
  const msg = $("save-msg");
  const loadBtn = $("save-load");
  const fileInput = $("save-file-input");
  const say = (line) => (msg.textContent = `ピクセ「${line}」`);

  async function showStatus() {
    status.textContent = (await persisted())
      ? "この ブラウザには「けさないで」と おねがい ずみ。それでも、キャッシュを けすと きえます。"
      : "";
  }
  $("about-btn").addEventListener("click", () => {
    msg.textContent = "";
    disarm();
    showStatus();
  });

  async function made() {
    achievements.unlock("spell");
    await persist();
    showStatus();
  }

  $("save-copy").addEventListener("click", async () => {
    const code = await encode();
    input.value = code;
    input.select();
    let copied = false;
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
    } catch {}
    say(copied ? "じゅもんを コピーしたよ。\nメモや じぶんあての メールに はっておいてね。" : "したの わくに じゅもんを だしたよ。\nぜんぶ えらんで コピーしてね。");
    made();
  });

  $("save-file").addEventListener("click", async () => {
    const code = await encode();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code + "\n"], { type: "text/plain" }));
    a.download = `warpix-save-${ymd}.txt`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say("セーブデータを ファイルに したよ。\nなくさないでね。");
    made();
  });

  $("save-open").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    input.value = (await file.text()).trim();
    disarm();
    tryLoad();
  });

  // 2 かい おしたら いれかえる（1 かいめは ピクセが たしかめる）
  let pending = null;
  let timer = 0;
  function disarm() {
    pending = null;
    clearTimeout(timer);
    loadBtn.textContent = "ふっかつ する";
  }
  input.addEventListener("input", disarm);

  async function tryLoad() {
    if (pending) {
      const ok = restore(pending.data);
      disarm();
      if (!ok) return say("あれ？ うまく かけなかった……\nもういちど ためしてみて。");
      say("ふっかつの じゅもん、となえるよ……！");
      setTimeout(() => location.reload(), 900);
      return;
    }
    const box = await decode(input.value);
    if (!box) {
      sound.sfx.text?.();
      return say("……じゅもんが ちがいます。");
    }
    pending = box;
    loadBtn.textContent = "ほんとに ふっかつ する（もういちど おす）";
    say(`${box.at ?? "いつか"} の きろくだね。\nいまの きろくは きえて、いれかわるよ。いい？`);
    clearTimeout(timer);
    timer = setTimeout(disarm, 10000);
  }
  loadBtn.addEventListener("click", tryLoad);

  return { encode, decode, restore, persist, persisted, collect };
})();
