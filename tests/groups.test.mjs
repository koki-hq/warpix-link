// グループ（v2.0）：＋ → なまえ（ひっす・12 もじ）→ そのまま リンクを 追加。◀ ▶ で きりかえ。かんばんを おすと へんしゅう
import { openApp, groupsData, sleep } from "./lib/app.mjs";

const view = (p) => p.ev(`({
  empty: !document.getElementById("empty").hidden,
  bar: !document.getElementById("group-bar").hidden,
  title: document.getElementById("group-title").textContent,
  on: [...document.querySelectorAll("#group-dots span")].findIndex((d) => d.classList.contains("on")),
  dots: document.querySelectorAll("#group-dots span").length,
  links: [...document.querySelectorAll(".links .pixel-btn")].map((a) => a.dataset.id),
  saved: (JSON.parse(localStorage.getItem("warpix-v2-groups") || "null")?.list ?? []).map((g) => g.title),
})`);

export default {
  async "まんなかの「グループを つくる」→ なまえ（から だと エラー・12 もじ）→ つぎは リンクを 追加の まど"(t) {
    const { server, p } = await openApp(t);
    await p.click("#empty-add");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("group-dialog").open && document.activeElement.id === "group-name"`), "グループの まどが ひらかない");
    await p.ev(`document.getElementById("group-form").requestSubmit()`);
    t.ok(await p.ev(`!document.getElementById("group-error").hidden && document.getElementById("group-dialog").open`), "から でも つくれて しまう");
    t.eq(await p.ev(`document.getElementById("group-name").maxLength`), 12, "12 もじの せいげんが ない");
    await p.ev(`document.getElementById("group-name").value = "すきなバンド"; document.getElementById("group-form").requestSubmit()`);
    await sleep(300);
    const v = await view(p);
    t.ok(!v.empty && v.bar && v.title === "すきなバンド", `グループが できない：${JSON.stringify(v)}`);
    t.eq(v.saved, ["すきなバンド"], "ほぞん されて いない");
    t.ok(await p.ev(`document.getElementById("add-dialog").open && !document.getElementById("group-dialog").open`), "つぎに リンクを 追加の まどが ひらかない");
    t.eq(await p.ev(`document.getElementById("add-group-name").textContent`), "すきなバンド", "どの グループに 追加か でない");
    await p.ev(`document.getElementById("add-done").click()`);
    t.ok(await p.ev(`!!document.getElementById("link-add")`), "から の グループに「＋ リンクを 追加」が ない");
    t.eq(await p.ev(`CASSETTES.addGroup("あいうえおかきくけこさしすせそ").title`), "あいうえおかきくけこさし", "12 もじで きれない");
    t.noErrors(p);
    await server.close();
  },

  async "右上の ＋ でも つくれる。◀ ▶ で きりかえ（ぐるっと まわる）、ひらきなおしても そのまま"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]], ["B", ["spotify", "twitter"]], ["C", []]]) } });
    t.eq((await view(p)).title, "A", "さいしょの グループで ない");
    await p.click("#group-next");
    let v = await view(p);
    t.eq([v.title, v.on, v.links], ["B", 1, ["spotify", "twitter"]], "▶ で つぎへ いかない");
    await p.click("#group-prev");
    await p.click("#group-prev");
    t.eq((await view(p)).title, "C", "◀ で さいごへ まわらない");
    await p.goto(await p.ev("location.href"), 500);
    t.eq((await view(p)).title, "C", "ひらきなおすと えらんだ グループが もどる");
    // ◀ ▶ は わく なしで おおきい・メニューと ＋ は おなじ おおきさ
    const r = await p.ev(`(() => { const s = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; }; return { prev: s("group-prev"), menu: s("menu-btn"), add: s("add-group"), sign: s("group-sign") }; })()`);
    t.ok(r.prev[0] >= 44 && r.prev[1] >= 44, `◀ ▶ が ちいさい（${r.prev}）`);
    t.eq(r.menu, r.add, "メニューと ＋ の おおきさが ちがう");
    await p.click("#add-group");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("group-dialog").open`), "右上の ＋ で グループの まどが ひらかない");
    t.noErrors(p);
    await server.close();
  },

  async "かんばんを おすと へんしゅう：なまえ・ならべかえ・はずす・グループの じゅんばん・けす"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube", "spotify", "twitter"]], ["B", ["line"]]]) } });
    await p.ev(`window.WARPIX_ASK = true`);
    await p.click("#group-sign");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("edit-dialog").open`), "かんばんを おしても へんしゅうが ひらかない");
    t.eq(await p.ev(`document.getElementById("edit-name").value`), "A", "いまの なまえが はいって いない");
    await p.ev(`document.querySelector('#edit-rows li [data-act="down"]').click()`);
    t.eq((await view(p)).links, ["spotify", "youtube", "twitter"], "▼ で したへ うごかない");
    await p.ev(`document.querySelectorAll('#edit-rows li [data-act="out"]')[2].click()`);
    t.eq((await view(p)).links, ["spotify", "youtube"], "はずせない");
    await p.click("#edit-next");
    let v = await view(p);
    t.eq([v.saved, v.title, v.on], [["B", "A"], "A", 1], "グループの じゅんばんが かわらない");
    // なまえ：から は だめ、けってい で ほぞんして とじる
    await p.ev(`document.getElementById("edit-name").value = " "; document.getElementById("edit-done").click()`);
    t.ok(await p.ev(`!document.getElementById("edit-error").hidden && document.getElementById("edit-dialog").open`), "から の なまえで とじた");
    await p.ev(`document.getElementById("edit-name").value = "あたらしい"; document.getElementById("edit-done").click()`);
    v = await view(p);
    t.ok(v.title === "あたらしい" && (await p.ev(`!document.getElementById("edit-dialog").open`)), "なまえが かわらない・とじない");
    // ＋ リンクを 追加 → おわったら へんしゅうに もどる
    await p.click("#group-sign");
    await sleep(100);
    await p.ev(`document.getElementById("edit-add").click()`);
    t.ok(await p.ev(`document.getElementById("add-dialog").open && !document.getElementById("edit-dialog").open`), "へんしゅうから 追加へ いかない");
    await p.ev(`document.getElementById("add-done").click()`);
    t.ok(await p.ev(`document.getElementById("edit-dialog").open`), "追加の あと へんしゅうに もどらない");
    // けす：のこりは B、ぜんぶ けすと まんなかの「グループを つくる」
    await p.ev(`document.getElementById("edit-delete").click()`);
    t.eq((await view(p)).saved, ["B"], "グループが きえない");
    await p.click("#group-sign");
    await sleep(100);
    await p.ev(`document.getElementById("edit-delete").click()`);
    v = await view(p);
    t.ok(v.empty && !v.bar, "ぜんぶ けしても「グループを つくる」に もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "けす まえに アプリの まどで たしかめる（やめる なら けさない・けす なら けす）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["youtube"]]]) } });
    // ブラウザの confirm は つかわない（iPhone で BGM が とまる、v2.0.2）
    await p.ev(`window.confirm = () => { throw new Error("confirm を つかった"); }`);
    await p.click("#group-sign");
    await sleep(100);
    await p.ev(`document.getElementById("edit-delete").click()`);
    await sleep(100);
    t.ok(await p.ev(`document.getElementById("ask-dialog").open && document.getElementById("ask-text").textContent.includes("A")`), "たしかめる まどが でない");
    await p.click("#ask-no");
    await sleep(100);
    t.eq((await view(p)).saved, ["A"], "やめる なのに けした");
    t.ok(await p.ev(`!document.getElementById("ask-dialog").open && document.getElementById("edit-dialog").open`), "やめる で へんしゅうに もどらない");
    await p.ev(`document.getElementById("edit-delete").click()`);
    await sleep(100);
    await p.click("#ask-yes");
    await sleep(100);
    t.eq((await view(p)).saved, [], "けす で けせない");
    t.noErrors(p);
    await server.close();
  },
};
