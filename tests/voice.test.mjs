// ピクセの こえ：せっていで えらぶと、ピクセの セリフを よみあげる（テストでは にせものの よみあげで、音は でない）
const FAKE = `
  window.__spoken = [];
  window.__cancels = 0;
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
    speak(u) { __spoken.push({ text: u.text, lang: u.lang, pitch: u.pitch, volume: u.volume, voice: u.voice?.name }); setTimeout(() => u.onend?.(), 30); },
    cancel() { __cancels++; },
    getVoices: () => [{ name: "English", lang: "en-US", localService: true }, { name: "Google 日本語", lang: "ja-JP", localService: false }, { name: "Microsoft Haruka", lang: "ja-JP", localService: true }],
  } });`;
const NONE = `Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });`;

async function page(t, source = FAKE) {
  const server = await t.startServer();
  const b = await t.launchBrowser();
  const p = await b.firstPage();
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source });
  return { server, p };
}

export default {
  async "さいしょは しゃべらない。せっていで オンに すると しゃべり、ひらきなおしても のこる"(t) {
    const { server, p } = await page(t);
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    t.eq(await p.ev(`__spoken.length`), 0, "オフなのに しゃべった");
    await p.ev(`document.getElementById("settings-btn").click()`);
    await t.sleep(200);
    t.ok(await p.ev(`!document.getElementById("set-voice").checked && !document.getElementById("set-voice").disabled`), "スイッチの はじめの ようす");
    await p.ev(`document.getElementById("set-voice").click()`);
    t.eq(await p.ev(`__spoken.at(-1)`), { text: "こんにちは！ ぼくの こえ、きこえる？", lang: "ja-JP", pitch: 1.8, volume: 1, voice: "Microsoft Haruka" }, "おためしの こえ");
    t.ok(await p.ev(`achievements.has("voice")`), "実績「ピクセの こえ」がない");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-settings")).voice`), "on", "ほぞん");
    // こうかおんの おおきさで しゃべる
    await p.ev(`(() => { const r = document.getElementById("set-se"); r.value = 50; r.dispatchEvent(new Event("input")); })()`);
    await p.ev(`document.getElementById("settings").close()`);
    await p.ev(`npc.say(["ふあぁ……\\nちょっと ねむい。♪"])`);
    t.eq(await p.ev(`__spoken.at(-1)`), { text: "ふあぁ、ちょっと ねむい。", lang: "ja-JP", pitch: 1.8, volume: 0.5, voice: "Microsoft Haruka" }, "セリフの よみかた");
    // ひらきなおすと、あいさつから しゃべる
    await p.goto(server.url);
    await p.boot();
    const texts = await p.ev(`__spoken.map((s) => s.text)`);
    t.ok(texts.length >= 2 && texts.every((x) => !x.includes("\n")), `あいさつを しゃべらない: ${JSON.stringify(texts)}`);
    // うらに したら とめる
    const before = await p.ev(`__cancels`);
    await p.send("Emulation.setFocusEmulationEnabled", { enabled: false });
    await p.ev(`Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange"))`);
    t.ok((await p.ev(`__cancels`)) > before, "うらに しても とまらない");
    t.noErrors(p);
    await server.close();
  },

  async "よみあげが ない ブラウザでは スイッチを つかえない。シンプルモードでは しゃべらない"(t) {
    let { server, p } = await page(t, NONE);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.ev(`document.getElementById("settings-btn").click()`);
    t.ok(await p.ev(`document.getElementById("set-voice").disabled && document.getElementById("set-voice-note").textContent.includes("こえが でません")`), "つかえない ことが わからない");
    t.noErrors(p);
    await server.close();
    await t.closeAll();
    ({ server, p } = await page(t));
    await p.goto(server.url + "?away=0");
    await p.ev(`localStorage.setItem("warpix-settings", JSON.stringify({ voice: "on" }))`);
    await p.goto(server.url + "?simple=1");
    await t.sleep(1500);
    await p.ev(`npc.say(["しゃべらないで"])`);
    t.eq(await p.ev(`__spoken.length`), 0, "シンプルモードで しゃべった");
    t.noErrors(p);
    await server.close();
  },

  async "ことばの そうじ"(t) {
    const { server, p } = await page(t);
    await p.goto(server.url);
    const r = await p.ev(`[voice.clean("……ふん。"), voice.clean("♪♪♪"), voice.clean("おかえり！\\n\\nまってたよ。"), voice.clean("ピクセ「BGM に したよ！」")]`);
    t.eq(r, ["ふん。", "", "おかえり！まってたよ。", "ピクセ「BGM に したよ！」"], "そうじの けっか");
    t.noErrors(p);
    await server.close();
  },
};
