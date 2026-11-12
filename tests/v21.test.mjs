// v2.1（便利さ・使いやすさ・わかりやすさの 検品から）：ひくい 画面で かさならない・効果音だけ けす・前の きろく・
// ながい なまえ・まどの 下に 空白が でない・ピクセの 1 かいだけの 案内・ホーム画面の なまえ
import { openApp, groupsData, sleep } from "./lib/app.mjs";

const overlap = (a, b) => a.bottom > b.top && b.bottom > a.top && a.right > b.left && b.right > a.left;

export default {
  async "グループが ない 画面：X の 中のような ひくい 画面でも ボタンが セリフと かさならない"(t) {
    for (const height of [600, 520, 844]) {
      const { server, p } = await openApp(t, { height });
      const r = await p.ev(`(() => { const box = (id) => document.getElementById(id).getBoundingClientRect().toJSON(); return { add: box("empty-add"), dialog: box("dialog"), npc: box("npc") }; })()`);
      t.ok(!overlap(r.add, r.dialog) && !overlap(r.add, r.npc), `${height}px で かさなる：${JSON.stringify(r)}`);
      t.ok(r.add.top >= r.dialog.bottom, `${height}px で ボタンが セリフより 上に ある`);
      t.eq(await p.ev(`document.querySelector(".empty-head")?.textContent`), "あなただけの空間を作ろう", "見出しが ない");
      t.eq(await p.ev(`document.getElementById("empty-add").textContent`), "＋ グループを つくる", "ボタンが ひらがなで ない");
      t.noErrors(p);
      await server.close();
    }
  },

  async "効果音だけ オフに できる（BGM は そのまま）。ひらきなおしても オフ"(t) {
    const { server, p } = await openApp(t);
    await p.ev(`gear.open("bgm")`);
    await sleep(100);
    t.eq(await p.ev(`document.getElementById("tab-bgm").textContent`), "おと", "タブの なまえが おと で ない");
    await p.click("#se-switch");
    t.eq(await p.ev(`[settings.state.se, settings.state.bgm, document.getElementById("se-switch").getAttribute("aria-checked"), document.getElementById("se-switch").textContent]`), [false, true, "false", "OFF"], "効果音が オフに ならない");
    t.eq(await p.ev(`sound.volumes().se`), 0, "効果音の 音量が 0 に ならない");
    await p.goto(await p.ev("location.href"), 400);
    t.eq(await p.ev(`[settings.state.se, sound.volumes().se]`), [false, 0], "ひらきなおすと もどる");
    await p.ev(`gear.open("bgm")`);
    await p.click("#se-switch");
    t.eq(await p.ev(`[settings.state.se, sound.volumes().se]`), [true, 1], "オンに もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "記録：◀ ▶ で 昨日・先週・先月へ さかのぼれる。いちばん ふるい 記録より 前には 行かない"(t) {
    const LOG = {
      v: 1,
      // 2026-11-10 は 火曜。今週は 11/9〜、先週は 11/2〜11/8
      days: { "2026-11-10": { youtube: 3 }, "2026-11-09": { youtube: 2 }, "2026-11-08": { spotify: 5 }, "2026-10-31": { line: 7 } },
      names: { youtube: "YOUTUBE", spotify: "SPOTIFY", line: "LINE" },
      groups: {},
    };
    const { server, p } = await openApp(t, { query: "?date=2026-11-10", storage: { "warpix-v2-log": LOG } });
    await p.ev(`gear.open("log")`);
    await sleep(100);
    const v = () => p.ev(`({ when: document.getElementById("log-when").textContent, total: document.getElementById("log-total").textContent, older: !document.getElementById("log-older").disabled, newer: !document.getElementById("log-newer").disabled })`);
    t.eq(await v(), { when: "11/9〜11/15", total: "5", older: true, newer: false }, "今週 が ちがう");
    await p.click("#log-older");
    t.eq(await v(), { when: "11/2〜11/8", total: "5", older: true, newer: true }, "先週 が ちがう");
    t.eq(await p.ev(`[...document.querySelectorAll("#log-week-bars .bar-n")].map((x) => x.textContent).join(",")`), "0,0,0,0,0,0,5", "先週の 曜日ごと が ちがう");
    await p.click("#log-older");
    t.eq(await v(), { when: "10/26〜11/1", total: "7", older: false, newer: true }, "2 週 前 が ちがう（ここより 前は ない）");
    await p.click("#log-newer");
    await p.click("#log-newer");
    t.eq((await v()).when, "11/9〜11/15", "▶ で もどれない");
    await p.ev(`document.querySelector('[data-range="today"]').click()`);
    await p.click("#log-older");
    t.eq(await v(), { when: "11/9（月）", total: "2", older: true, newer: true }, "昨日 が ちがう");
    await p.ev(`document.querySelector('[data-range="month"]').click()`);
    t.eq((await v()).when, "2026年11月", "日・週・月を かえたら いまに もどらない");
    await p.click("#log-older");
    t.eq(await v(), { when: "2026年10月", total: "7", older: false, newer: true }, "先月 が ちがう");
    await p.ev(`document.querySelector('[data-range="year"]').click()`);
    t.eq(await v(), { when: "2026年", total: "17", older: false, newer: false }, "今年 が ちがう");
    t.eq(await p.ev(`[...document.querySelectorAll(".seg button")].map((b) => b.textContent).join(",")`), "日,週,月,年,ぜんぶ", "ボタンの 名前が ちがう");
    await p.ev(`document.querySelector('[data-range="all"]').click()`);
    t.ok(await p.ev(`document.getElementById("log-nav").hidden`), "全部 で ◀ ▶ が でる");
    t.noErrors(p);
    await server.close();
  },

  async "自分の リンクの 名前は 16 文字まで。ながい 名前は 文字を ちいさく"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", []]]) } });
    t.eq(await p.ev(`document.getElementById("mylink-name").maxLength`), 16, "16 文字に なって いない");
    const c = await p.ev(`(() => { const c = CASSETTES.addMine({ label: "ABCDEFGHIJKLMNOPQRS", url: "https://example.com/a", icon: "star" }); CASSETTES.addLink(CASSETTES.current().id, c.id); const d = CASSETTES.addMine({ label: "すきなバンドのこうしきサイト", url: "https://example.com/b", icon: "star" }); CASSETTES.addLink(CASSETTES.current().id, d.id); const e = CASSETTES.addMine({ label: "NOTE", url: "https://example.com/c", icon: "star" }); CASSETTES.addLink(CASSETTES.current().id, e.id); groups.render(); return [c.label, d.label]; })()`);
    t.eq(c, ["ABCDEFGHIJKLMNOP", "すきなバンドのこうしきサイト"], "16 文字で きれない");
    const cls = await p.ev(`[...document.querySelectorAll(".links .pixel-btn")].map((a) => [...a.classList].filter((x) => x.startsWith("len-")).join(""))`);
    t.eq(cls, ["len-l", "len-l", ""], "ながさで 文字の 大きさが かわらない");
    const fit = await p.ev(`[...document.querySelectorAll(".links .pixel-btn")].every((a) => a.scrollWidth <= a.clientWidth + 1)`);
    t.ok(fit, "ながい 名前が ボタンから はみだす");
    t.noErrors(p);
    await server.close();
  },

  async "メニューの アプリ：下まで スクロールしても まど ごと うごかない（下に 空白が でない）。クレジットは All rights reserved だけ"(t) {
    const { server, p } = await openApp(t, { height: 664 });
    await p.ev(`gear.open("about")`);
    await sleep(200);
    await p.ev(`document.querySelector("#gear .win-scroll").scrollTop = 99999`);
    const r = await p.ev(`(() => { const d = document.getElementById("gear"); return { dlg: d.scrollHeight - d.clientHeight, out: [...d.querySelectorAll(".sr-only")].some((e) => e.getBoundingClientRect().top > d.getBoundingClientRect().bottom + 2 && !e.closest(".win-scroll")) }; })()`);
    t.ok(r.dlg <= 0, `まど ごと スクロール できる（${r.dlg}px）`);
    const credit = await p.ev(`document.querySelector(".about-credit").textContent`);
    t.ok(credit.includes("All rights reserved") && !credit.includes("Claude"), `クレジットが ちがう：${credit}`);
    t.ok(!/ふつうは/.test(await p.ev(`document.getElementById("panel-about").textContent`)), "「ふつうは」が のこる");
    t.ok(!/□に↑/.test(await p.ev(`document.body.innerHTML`)), "「□に↑」が のこる");
    t.noErrors(p);
    await server.close();
  },

  async "ピクセの 案内：グループを つくって リンクを 入れたら 1 かいだけ「おすと ワープ」、2 つめの グループで スワイプ"(t) {
    const { server, p } = await openApp(t);
    t.ok((await p.text()).includes("「グループを つくる」"), "グループが ない ときに 案内しない");
    const make = async (name) => {
      await p.click("#add-group");
      await sleep(150);
      await p.ev(`document.getElementById("group-name").value = ${JSON.stringify(name)}; document.getElementById("group-form").requestSubmit()`);
      await sleep(200);
      await p.ev(`document.getElementById("add-tab-shelf").click(); document.querySelector('.cas-item[data-id="youtube"]').click(); document.getElementById("add-done").click()`);
    };
    await make("A");
    t.ok((await p.text()).includes("おすと ワープ"), "リンクを 入れた あとの 案内が ない");
    await make("B");
    t.ok((await p.text()).includes("スワイプ"), "2 つめの グループで スワイプの 案内が ない");
    await make("C");
    const last = await p.text();
    t.ok(!last.includes("スワイプ") && !last.includes("おすと ワープ"), "おなじ 案内を 2 かい いう");
    t.noErrors(p);
    await server.close();
  },

  async "タブ：グループが 8 つ・ながい 名前でも はみださず、よこに スクロール。えらんだ タブが 見える ところに"(t) {
    const names = ["すきなバンド", "いつもの", "推し", "YouTuber", "まんがアプリまとめ", "しごと", "ゲーム", "ニュース"];
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData(names.map((n) => [n, ["line"]]), 6) } });
    const r = await p.ev(`(() => { const t = document.getElementById("group-tabs"); const on = document.getElementById("group-sign").getBoundingClientRect(); const box = t.getBoundingClientRect(); return { vscroll: t.scrollHeight > t.clientHeight, oy: getComputedStyle(t).overflowY, scroll: t.scrollWidth > t.clientWidth, seen: on.left >= box.left && on.right <= box.right, page: document.documentElement.scrollWidth <= innerWidth, title: document.getElementById("group-title").textContent }; })()`);
    t.eq(r, { vscroll: false, oy: "hidden", scroll: true, seen: true, page: true, title: "ゲーム" }, "タブが おかしい（たてに うごく など）");
    await p.click("#group-sign");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("edit-dialog").open`), "えらんで いる タブを おしても 編集が ひらかない");
    t.noErrors(p);
    await server.close();
  },

  async "v2.1.2：説明書の ホーム画面は iPhone と Android の りょうほう・新しい 版は まんなかの まど（とじる ボタン なし）・はいけいに 服の はなしが ない"(t) {
    const { server, p } = await openApp(t, { mobile: true });
    const lines = await p.ev(`manual.homeHow().map((x) => x.split("：")[0])`);
    t.eq(lines, ["iPhone", "Android"], "説明書の ホーム画面が 片方 だけ");
    const d = await p.ev(`(() => { const d = document.getElementById("update-dialog"); return { dialog: d?.tagName, close: !!d?.querySelector(".about-close"), btn: document.getElementById("update-btn")?.textContent }; })()`);
    t.eq(d, { dialog: "DIALOG", close: false, btn: "こうしん する" }, "新しい 版の まどが ちがう");
    t.ok(!(await p.ev(`document.getElementById("panel-sky").textContent`)).includes("服"), "はいけいに 服の はなしが のこる");
    t.noErrors(p);
    await server.close();
  },

  async "ホーム画面の 名前は WARPIX LINK"(t) {
    const { server, p } = await openApp(t);
    const m = await p.ev(`fetch("manifest.webmanifest").then((r) => r.json())`);
    t.eq(m.short_name, "WARPIX LINK", "manifest の short_name");
    t.eq(await p.ev(`document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content`), "WARPIX LINK", "iPhone の 名前");
    t.noErrors(p);
    await server.close();
  },
};
