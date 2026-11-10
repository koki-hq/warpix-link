// ⚙️ せってい（v2.0）：タブ・ワープの きろく・背景・BGM・データの ひっこし・アプリに ついて
import { openApp, groupsData, sleep } from "./lib/app.mjs";

const LOG = {
  v: 1,
  // 2026-11-10 は かようび。こんしゅうは 11/9（げつ）〜
  days: {
    "2026-11-10": { "https://a.com/": 3, "https://b.com/": 1 },
    "2026-11-09": { "https://a.com/": 2 },
    "2026-11-08": { "https://b.com/": 5 },
    "2026-10-31": { "https://c.com/": 7 },
  },
  names: { "https://a.com/": "エー", "https://b.com/": "ビー", "https://c.com/": "シー" },
  groups: { "https://a.com/": "G1", "https://b.com/": "G1", "https://c.com/": "G2" },
};
const logView = (p) => p.ev(`({
  label: document.getElementById("log-label").textContent,
  total: document.getElementById("log-total").textContent,
  top: document.getElementById("log-top").textContent,
  week: !document.getElementById("log-week").hidden,
  bars: [...document.querySelectorAll("#log-week-bars .day .bar-n")].map((x) => x.textContent),
  rank: [...document.querySelectorAll("#log-rank li")].map((li) => li.querySelector(".rank-name")?.textContent + ":" + li.querySelector(".rank-n")?.textContent.replace("かい", "")),
})`);

export default {
  async "⚙️ で ひらく。5 つの タブ（きろく・背景・BGM・ひっこし・アプリ）、キーの ← → でも うごく"(t) {
    const { server, p } = await openApp(t);
    await p.click("#gear-btn");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("gear").open`), "⚙️ で ひらかない");
    t.eq(await p.ev(`[...document.querySelectorAll("#gear [role=tab]")].map((b) => b.textContent)`), ["きろく", "背景", "BGM", "ひっこし", "アプリ"], "タブが ちがう");
    const shown = () => p.ev(`[...document.querySelectorAll("#gear .panel")].filter((x) => !x.hidden).map((x) => x.id)`);
    t.eq(await shown(), ["panel-log"], "さいしょは きろく で ない");
    await p.click("#tab-bgm");
    t.eq(await shown(), ["panel-bgm"], "タブで きりかわらない");
    t.eq(await p.ev(`document.getElementById("tab-bgm").getAttribute("aria-selected")`), "true", "えらんだ タブの しるしが ない");
    await p.ev(`document.getElementById("tab-bgm").focus()`);
    await p.key("ArrowRight");
    t.eq(await shown(), ["panel-move"], "→ キーで つぎの タブへ いかない");
    t.ok(await p.ev(`document.getElementById("gear").getBoundingClientRect().height >= innerHeight - 1`), "せっていが 画面 いっぱいで ない");
    await p.click("#gear-close");
    t.ok(await p.ev(`!document.getElementById("gear").open`), "✕ で とじない");
    t.noErrors(p);
    await server.close();
  },

  async "ワープの きろく：きょう・こんしゅう（げつようから、ようびごと）・こんげつ・ぜんぶ、けす"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-10", storage: { "warpix-v2-log": LOG } });
    await p.ev(`window.confirm = () => true; gear.open("log")`);
    await sleep(200);
    let v = await logView(p);
    t.eq([v.label, v.total, v.top, v.week], ["こんしゅうの ワープ", "6", "エー", true], "こんしゅう が ちがう");
    t.eq(v.bars, ["2", "4", "0", "0", "0", "0", "0"], "ようびごと が ちがう");
    t.eq(v.rank, ["エー:5", "ビー:1"], "よく行った サイト が ちがう");
    await p.ev(`document.querySelector('[data-range="today"]').click()`);
    v = await logView(p);
    t.eq([v.total, v.week, v.rank], ["4", false, ["エー:3", "ビー:1"]], "きょう が ちがう");
    await p.ev(`document.querySelector('[data-range="month"]').click()`);
    v = await logView(p);
    t.eq([v.total, v.rank], ["11", ["ビー:6", "エー:5"]], "こんげつ が ちがう");
    await p.ev(`document.querySelector('[data-range="all"]').click()`);
    v = await logView(p);
    t.eq([v.total, v.rank[0]], ["18", "シー:7"], "ぜんぶ が ちがう");
    t.ok(await p.ev(`document.querySelector("#log-rank li .rank-group").textContent === "G2"`), "グループの なまえが でない");
    await p.ev(`document.getElementById("log-clear").click()`);
    v = await logView(p);
    t.eq(v.total, "0", "けせない");
    t.ok(await p.ev(`!!document.querySelector("#log-rank .log-empty")`), "から の ときの ことばが でない");
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-v2-log")).days`), {}, "ほぞんした きろくが のこる");
    t.noErrors(p);
    await server.close();
  },

  async "にちようは まだ こんしゅう、げつようから あたらしい しゅう"(t) {
    for (const [date, total] of [["2026-11-15", 6], ["2026-11-16", 0]]) {
      const { server, p, b } = await openApp(t, { query: `?date=${date}`, storage: { "warpix-v2-log": LOG } });
      t.eq(await p.ev(`warpLog.query("week").total`), total, `${date} の こんしゅう が ちがう`);
      await b.close();
      await server.close();
    }
  },

  async "背景：ひる・ゆうがた・よる を えらぶと すぐ かわって、ひらきなおしても そのまま（さいしょは よる）"(t) {
    const { server, p } = await openApp(t);
    t.eq(await p.ev(`document.documentElement.dataset.sky`), "night", "さいしょが よる で ない");
    await p.ev(`gear.open("sky")`);
    await sleep(100);
    for (const sky of ["day", "evening"]) {
      await p.click(`.sky-card[data-sky="${sky}"]`);
      t.eq(await p.ev(`document.documentElement.dataset.sky`), sky, `${sky} に かわらない`);
      t.eq(await p.ev(`document.querySelector('.sky-card[data-sky="${sky}"]').getAttribute("aria-pressed")`), "true", `${sky} の しるしが ない`);
    }
    const bg = await p.ev(`getComputedStyle(document.getElementById("sky")).backgroundImage`);
    t.ok(bg.includes("gradient"), "空が かわって いない");
    await p.goto(await p.ev("location.href"), 400);
    t.eq(await p.ev(`document.documentElement.dataset.sky`), "evening", "ひらきなおすと もどる");
    t.ok(await p.ev(`getComputedStyle(document.querySelector(".sun")).display !== "none"`), "ゆうがたに たいようが でない");
    t.noErrors(p);
    await server.close();
  },

  async "BGM：オンオフ・効果音・おおきさ・曲 3 つ（えらぶと ON に なって ながれる）、ほぞん される"(t) {
    const { server, p } = await openApp(t);
    await p.ev(`gear.open("bgm")`);
    await sleep(100);
    t.eq(await p.ev(`[...document.querySelectorAll("[data-song] b")].map((b) => b.textContent)`), ["いつもの", "ゆっくり さんぽ", "はずむ ワープ"], "曲が 3 つ ない");
    await p.click("#bgm-switch");
    t.eq(await p.ev(`[settings.state.bgm, document.getElementById("bgm-switch").getAttribute("aria-checked"), document.getElementById("bgm-switch").textContent]`), [false, "false", "OFF"], "BGM が OFF に ならない");
    await p.click('[data-song="slow"]');
    t.eq(await p.ev(`[settings.state.song, settings.state.bgm, sound.songId(), sound.playing()]`), ["slow", true, "slow", true], "曲を えらんでも かわらない・ながれない");
    await p.click("#se-switch");
    await p.ev(`(() => { const v = document.getElementById("volume"); v.value = 30; v.dispatchEvent(new Event("input")); })()`);
    t.eq(await p.ev(`sound.volumes()`), { bgm: 0.3, se: 0 }, "おおきさ・効果音が きかない");
    await p.goto(await p.ev("location.href"), 400);
    t.eq(await p.ev(`[settings.state.song, settings.state.se, settings.state.volume, sound.songId()]`), ["slow", false, 30, "slow"], "ひらきなおすと もどる");
    // 3 きょく とも 4 小節（ゆっくりは 8）で、bass の かずが あう
    t.ok(await p.ev(`Object.values(sound.songs).every((s) => s.lead.length === s.bass.length * 8)`), "曲の ながさが あわない");
    t.noErrors(p);
    await server.close();
  },

  async "データの ひっこし：コードを つくって、べつの ブラウザで うけとると そっくり もどる。へんな コードは だめ"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-10", storage: { "warpix-v2-groups": groupsData([["すきなバンド", ["公式"]]]), "warpix-v2-log": LOG, "warpix-v2-settings": { sky: "day", bgm: false, se: true, volume: 40, song: "bouncy" }, "warpix-pixe": { v1: true } } });
    await p.ev(`gear.open("move")`);
    await p.click("#move-make");
    await sleep(300);
    const code = await p.ev(`document.getElementById("move-code").value`);
    t.ok(code.startsWith("WARPIX2-"), `コードが できない：${code.slice(0, 20)}`);
    t.ok(await p.ev(`!document.getElementById("move-msg").hidden`), "つくった あとの ことばが でない");
    const decoded = await p.ev(`gear.decode(${JSON.stringify(code)}).then((d) => Object.keys(d).sort())`);
    t.eq(decoded, ["warpix-v2-groups", "warpix-v2-log", "warpix-v2-mail", "warpix-v2-pixe", "warpix-v2-settings"].filter((k) => decoded.includes(k)), "v2 の キー だけで ない");
    t.ok(!decoded.includes("warpix-pixe"), "v1 の きろくまで はいった");

    // べつの ブラウザ（まっさら）で うけとる
    const other = await openApp(t);
    const q = other.p;
    await q.ev(`window.confirm = () => true; gear.open("move")`);
    await q.ev(`document.getElementById("move-input").value = "へんな コード"`);
    await q.click("#move-take");
    await sleep(200);
    t.ok(await q.ev(`document.getElementById("move-msg").classList.contains("bad")`), "へんな コードで エラーが でない");
    await q.ev(`document.getElementById("move-input").value = ${JSON.stringify(code)}`);
    await q.click("#move-take");
    await sleep(1800);
    t.eq(await q.ev(`[document.getElementById("group-title").textContent, document.documentElement.dataset.sky, settings.state.song, warpLog.query("all").total]`), ["すきなバンド", "day", "bouncy", 18], "そっくり もどらない");
    t.noErrors(p, q);
    await server.close();
    await other.server.close();
  },

  async "アプリ：つかいかたを もう いちど・ピクセに おてがみ（版と きかいの しゅるい）・データの はなし"(t) {
    const { server, p } = await openApp(t);
    await p.ev(`gear.open("about")`);
    await sleep(400);
    const href = await p.ev(`decodeURIComponent(document.getElementById("otegami").href)`);
    t.ok(href.startsWith("mailto:pixe@warpix.app") && /WARPIX LINK v2\.\d/.test(href), `おてがみの したがきが ちがう：${href}`);
    t.ok(/^v2\.\d/.test(await p.ev(`document.getElementById("about-version").textContent`)), "版が でない");
    const text = await p.ev(`document.getElementById("panel-about").textContent`);
    for (const w of ["グループ", "12 こ", "このブラウザの中だけ", "Cloudflare", "Google Fonts"]) t.ok(text.includes(w), `「${w}」の はなしが ない`);
    for (const w of ["じゅもん", "Supabase", "てんき", "カード", "ROOM", "パーティ"]) t.ok(!text.includes(w), `ひきざんした「${w}」が のこって いる`);
    await p.click("#about-manual");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("manual").open && !document.getElementById("gear").open`), "つかいかたが ひらかない");
    t.noErrors(p);
    await server.close();
  },
};
