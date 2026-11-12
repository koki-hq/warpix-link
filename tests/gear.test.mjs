// メニュー（v2.0、左上）：タブ・ワープの きろく・はいけい・BGM・データの ひっこし・アプリに ついて
import { openApp, groupsData, sleep } from "./lib/app.mjs";

const LOG = {
  v: 1,
  // 2026-11-10 は かようび。こんしゅうは 11/9（げつ）〜
  days: {
    "2026-11-10": { youtube: 3, spotify: 1 },
    "2026-11-09": { youtube: 2 },
    "2026-11-08": { spotify: 5 },
    "2026-10-31": { line: 7 },
  },
  names: { youtube: "YOUTUBE", spotify: "SPOTIFY", line: "LINE" },
  groups: { youtube: "G1", spotify: "G1", line: "G2" },
};
const logView = (p) => p.ev(`({
  label: document.getElementById("log-label").textContent,
  total: document.getElementById("log-total").textContent,
  top: document.getElementById("log-top").textContent,
  week: !document.getElementById("log-week").hidden,
  bars: [...document.querySelectorAll("#log-week-bars .day .bar-n")].map((x) => x.textContent),
  rank: [...document.querySelectorAll("#log-rank li")].map((li) => li.querySelector(".rank-name")?.textContent + ":" + li.querySelector(".rank-n")?.textContent.replace("回", "")),
})`);

export default {
  async "左上の メニューで ひらく。5 つの タブ（きろく・はいけい・BGM・ひっこし・アプリ）、キーの ← → でも うごく"(t) {
    const { server, p } = await openApp(t);
    await p.click("#menu-btn");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("gear").open`), "メニューで ひらかない");
    t.eq(await p.ev(`[...document.querySelectorAll("#gear [role=tab]")].map((b) => b.textContent)`), ["きろく", "はいけい", "おと", "ひっこし", "アプリ"], "タブが ちがう");
    const shown = () => p.ev(`[...document.querySelectorAll("#gear .panel")].filter((x) => !x.hidden).map((x) => x.id)`);
    t.eq(await shown(), ["panel-log"], "さいしょは きろく で ない");
    await p.click("#tab-bgm");
    t.eq(await shown(), ["panel-bgm"], "タブで きりかわらない");
    t.eq(await p.ev(`document.getElementById("tab-bgm").getAttribute("aria-selected")`), "true", "えらんだ タブの しるしが ない");
    await p.ev(`document.getElementById("tab-bgm").focus()`);
    await p.key("ArrowRight");
    t.eq(await shown(), ["panel-move"], "→ キーで つぎの タブへ いかない");
    await p.click("#gear-close");
    t.ok(await p.ev(`!document.getElementById("gear").open`), "✕ で とじない");
    t.noErrors(p);
    await server.close();
  },

  async "ワープの きろく：きょう・こんしゅう（げつようから、ようびごと）・こんげつ・ぜんぶ、けす"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-10", storage: { "warpix-v2-log": LOG } });
    await p.ev(`window.WARPIX_ASK = true; gear.open("log")`);
    await sleep(200);
    let v = await logView(p);
    t.eq([v.label, v.total, v.top, v.week], ["11/9〜11/15 のワープ", "6", "YOUTUBE", true], "こんしゅう が ちがう");
    t.eq(v.bars, ["2", "4", "0", "0", "0", "0", "0"], "ようびごと が ちがう");
    t.eq(v.rank, ["YOUTUBE:5", "SPOTIFY:1"], "よく行った サイト が ちがう");
    await p.ev(`document.querySelector('[data-range="today"]').click()`);
    v = await logView(p);
    t.eq([v.total, v.week, v.rank], ["4", false, ["YOUTUBE:3", "SPOTIFY:1"]], "きょう が ちがう");
    await p.ev(`document.querySelector('[data-range="month"]').click()`);
    v = await logView(p);
    t.eq([v.total, v.rank], ["11", ["SPOTIFY:6", "YOUTUBE:5"]], "こんげつ が ちがう");
    await p.ev(`document.querySelector('[data-range="all"]').click()`);
    v = await logView(p);
    t.eq([v.total, v.rank[0]], ["18", "LINE:7"], "ぜんぶ が ちがう");
    t.ok(await p.ev(`document.querySelector("#log-rank li .rank-group").textContent === "G2" && !!document.querySelector("#log-rank li .icon svg")`), "グループの なまえ・アイコンが でない");
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
      await p.click(`#menu-lib .bg-card[data-bg="${sky}"]`);
      t.eq(await p.ev(`document.documentElement.dataset.sky`), sky, `${sky} に かわらない`);
      t.eq(await p.ev(`document.querySelector('#menu-lib .bg-card[data-bg="${sky}"]').getAttribute("aria-checked")`), "true", `${sky} の しるしが ない`);
    }
    const bg = await p.ev(`getComputedStyle(document.querySelector(".sky-bg")).backgroundImage`);
    t.ok(bg.includes("gradient"), "空が かわって いない");
    await p.goto(await p.ev("location.href"), 400);
    t.eq(await p.ev(`document.documentElement.dataset.sky`), "evening", "ひらきなおすと もどる");
    t.ok(await p.ev(`!!document.querySelector("#moon svg")`), "月が でない");
    t.noErrors(p);
    await server.close();
  },

  async "BGM：オン オフ・BGM と こうかおんの おおきさ、ほぞん される"(t) {
    const { server, p } = await openApp(t);
    await p.ev(`gear.open("bgm")`);
    await sleep(100);
    await p.click("#bgm-switch");
    t.eq(await p.ev(`[settings.state.bgm, document.getElementById("bgm-switch").getAttribute("aria-checked"), document.getElementById("bgm-switch").textContent]`), [false, "false", "OFF"], "BGM が OFF に ならない");
    await p.ev(`(() => { for (const [id, v] of [["bgm-vol", 30], ["se-vol", 0]]) { const x = document.getElementById(id); x.value = v; x.dispatchEvent(new Event("input")); } })()`);
    t.eq(await p.ev(`sound.volumes()`), { bgm: 0.3, se: 0 }, "おおきさが きかない");
    t.eq(await p.ev(`document.getElementById("bgm-vol-n").textContent`), "30", "かずが でない");
    await p.goto(await p.ev("location.href"), 400);
    t.eq(await p.ev(`[settings.state.bgm, settings.state.bgmVol, settings.state.seVol]`), [false, 30, 0], "ひらきなおすと もどる");
    t.noErrors(p);
    await server.close();
  },

  async "データの ひっこし：コードを つくって、べつの ブラウザで うけとると そっくり もどる。へんな コードは だめ"(t) {
    const { server, p } = await openApp(t, { query: "?date=2026-11-10", storage: { "warpix-v2-groups": groupsData([["すきなバンド", ["youtube", "my-1"]]]), "warpix-v2-mylinks": [{ id: "my-1", label: "こうしき", url: "https://band.example.jp/", icon: "music" }], "warpix-v2-log": LOG, "warpix-v2-settings": { sky: "day", bgm: false, bgmVol: 40, seVol: 100 }, "warpix-pixe": { v1: true } } });
    await p.ev(`gear.open("move")`);
    const code = await p.ev(`gear.encode()`);
    await p.click("#move-copy");
    await sleep(300);
    t.ok(code.startsWith("WARPIX2-"), `コードが できない：${code.slice(0, 20)}`);
    t.ok(await p.ev(`document.getElementById("move-msg").textContent.length > 0`), "コピーの あとの ことばが でない");
    const decoded = await p.ev(`gear.decode(${JSON.stringify(code)}).then((d) => Object.keys(d).sort())`);
    t.ok(["warpix-v2-groups", "warpix-v2-mylinks", "warpix-v2-log", "warpix-v2-settings"].every((k) => decoded.includes(k)) && decoded.every((k) => k.startsWith("warpix-v2-")), `v2 の キー だけで ない：${decoded}`);
    t.ok(!decoded.includes("warpix-pixe"), "v1 の きろくまで はいった");

    // べつの ブラウザ（まっさら）で うけとる
    const other = await openApp(t);
    const q = other.p;
    await q.ev(`window.WARPIX_ASK = true; gear.open("move")`);
    await q.ev(`document.getElementById("move-input").value = "へんな コード"`);
    await q.click("#move-take");
    await sleep(200);
    t.ok(await q.ev(`document.getElementById("move-msg").classList.contains("bad")`), "へんな コードで エラーが でない");
    await q.ev(`document.getElementById("move-input").value = ${JSON.stringify(code)}`);
    await q.click("#move-take");
    await sleep(1800);
    t.eq(await q.ev(`[document.getElementById("group-title").textContent, document.documentElement.dataset.sky, settings.state.bgmVol, warpLog.query("all").total, CASSETTES.current().ids, CASSETTES.mine().length]`), ["すきなバンド", "day", 40, 18, ["youtube", "my-1"], 1], "そっくり もどらない");
    t.noErrors(p, q);
    await server.close();
    await other.server.close();
  },

  async "アプリ：せつめいしょを もう いちど・ピクセに おてがみ（版と きかいの しゅるい）・データの はなし"(t) {
    const { server, p } = await openApp(t);
    await p.ev(`gear.open("about")`);
    await sleep(400);
    const href = await p.ev(`decodeURIComponent(document.getElementById("otegami").href)`);
    t.ok(href.startsWith("mailto:pixe@warpix.app") && /WARPIX LINK v2\.\d/.test(href), `おてがみの したがきが ちがう：${href}`);
    t.ok(/^v2\.\d/.test(await p.ev(`document.getElementById("about-version").textContent`)), "版が でない");
    const text = await p.ev(`document.getElementById("panel-about").textContent`);
    for (const w of ["グループ", "このブラウザの中だけ", "Cloudflare", "Google Fonts"]) t.ok(text.includes(w), `「${w}」の はなしが ない`);
    for (const w of ["じゅもん", "Supabase", "てんき", "カード", "ROOM", "パーティ"]) t.ok(!text.includes(w), `ひきざんした「${w}」が のこって いる`);
    await p.click("#about-manual");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("manual").open && !document.getElementById("gear").open`), "つかいかたが ひらかない");
    t.noErrors(p);
    await server.close();
  },
};
