// グループ（v2.0）：＋ → タイトル（ひっす・12 文字まで）→ きりかえ・へんしゅう・じゅんばん・けす
import { openApp, groupsData, sleep } from "./lib/app.mjs";

const view = (p) => p.ev(`({
  empty: !document.getElementById("empty").hidden,
  bar: !document.getElementById("group-bar").hidden,
  title: document.getElementById("group-title").textContent,
  dots: document.querySelectorAll("#group-dots .dot").length,
  on: [...document.querySelectorAll("#group-dots .dot")].findIndex((d) => d.classList.contains("on")),
  tiles: [...document.querySelectorAll(".links a.tile .tile-name")].map((x) => x.textContent),
  saved: JSON.parse(localStorage.getItem("warpix-v2-groups") || "[]").map((g) => g.title),
})`);

export default {
  async "まんなかの「グループを つくる」→ なまえ（から だと エラー、12 文字まで）→ できる"(t) {
    const { server, p } = await openApp(t);
    await p.click("#empty-add");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("group-dialog").open`), "グループの まどが ひらかない");
    t.ok(await p.ev(`document.activeElement.id === "group-name"`), "なまえの らんに カーソルが ない");
    await p.ev(`document.getElementById("group-form").requestSubmit()`);
    t.ok(await p.ev(`!document.getElementById("group-error").hidden && document.getElementById("group-dialog").open`), "から でも つくれて しまう");
    t.eq(await p.ev(`document.getElementById("group-name").maxLength`), 12, "12 文字の せいげんが ない");
    await p.ev(`(() => { const i = document.getElementById("group-name"); i.value = "すきなバンド"; i.dispatchEvent(new Event("input")); })()`);
    t.eq(await p.ev(`document.getElementById("group-count").textContent`), "6 / 12 文字", "文字の かずが でない");
    await p.ev(`document.getElementById("group-form").requestSubmit()`);
    await sleep(200);
    const v = await view(p);
    t.ok(!v.empty && v.bar, "グループの だんが でない");
    t.eq(v.title, "すきなバンド", "タイトルが ちがう");
    t.eq(v.saved, ["すきなバンド"], "ほぞん されて いない");
    t.ok(await p.ev(`!!document.getElementById("add-link")`), "「＋ リンクを ついか」が ない");
    t.ok((await p.text()).includes("リンク"), `ピクセが つぎを おしえない：${await p.text()}`);
    // 12 文字を こえた ぶんは きる（貼りつけ など）
    await p.ev(`groups.addGroup("あいうえおかきくけこさしすせそ")`);
    t.eq((await view(p)).saved[1], "あいうえおかきくけこさし", "12 文字で きれない");
    t.noErrors(p);
    await server.close();
  },

  async "右上の ＋ でも つくれる。◀ ▶ で きりかえ（ぐるっと まわる）、ほぞん される"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["a1"]], ["B", ["b1", "b2"]], ["C", []]]) } });
    t.eq((await view(p)).title, "A", "さいしょの グループで ない");
    await p.click("#group-next");
    let v = await view(p);
    t.eq([v.title, v.on, v.tiles], ["B", 1, ["b1", "b2"]], "▶ で つぎへ いかない");
    await p.click("#group-prev");
    await p.click("#group-prev");
    v = await view(p);
    t.eq(v.title, "C", "◀ で さいごへ まわらない");
    t.ok(await p.ev(`document.getElementById("links").getBoundingClientRect().height > 200 && !!document.getElementById("add-link")`), "から の グループに ＋ が ない");
    await p.goto(await p.ev("location.href"), 500);
    t.eq((await view(p)).title, "C", "ひらきなおすと えらんだ グループが もどる");
    const r = await p.ev(`(() => { const b = document.getElementById("group-prev").getBoundingClientRect(); return [b.width, b.height]; })()`);
    t.ok(r[0] >= 52 && r[1] >= 52, `◀ ▶ が ちいさい（${r}）`);
    await p.click("#add-group");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("group-dialog").open`), "右上の ＋ で グループの まどが ひらかない");
    t.noErrors(p);
    await server.close();
  },

  async "✏️ で へんしゅう：なまえを かえる・リンクの じゅんばん・けす・グループの じゅんばん・グループを けす"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["a1", "a2", "a3"]], ["B", ["b1"]]]) } });
    await p.ev(`window.confirm = () => true`);
    await p.click("#group-edit");
    await sleep(200);
    t.ok(await p.ev(`document.getElementById("edit-dialog").open`), "へんしゅうの まどが ひらかない");
    t.eq(await p.ev(`document.getElementById("edit-name").value`), "A", "いまの なまえが はいって いない");
    // なまえ：から は だめ
    await p.ev(`document.getElementById("edit-name").value = "  "; document.getElementById("edit-form").requestSubmit()`);
    t.ok(await p.ev(`!document.getElementById("edit-error").hidden`), "から の なまえで ほぞん できて しまう");
    // リンクの じゅんばん（a1 を したへ）
    await p.ev(`document.querySelector('#edit-links li [data-act="down"]').click()`);
    t.eq((await view(p)).tiles, ["a2", "a1", "a3"], "リンクが したへ うごかない");
    // けす
    await p.ev(`document.querySelectorAll('#edit-links li [data-act="del"]')[2].click()`);
    t.eq((await view(p)).tiles, ["a2", "a1"], "リンクが きえない");
    // グループの じゅんばん（A を うしろへ）
    await p.click("#edit-next");
    let v = await view(p);
    t.eq([v.saved, v.title, v.on], [["B", "A"], "A", 1], "グループの じゅんばんが かわらない");
    // なまえを かえる
    await p.ev(`document.getElementById("edit-name").value = "あたらしい"; document.getElementById("edit-form").requestSubmit()`);
    await sleep(100);
    v = await view(p);
    t.eq(v.title, "あたらしい", "なまえが かわらない");
    t.ok(await p.ev(`!document.getElementById("edit-dialog").open`), "ほぞんで まどが とじない");
    // グループを けす → のこりは B
    await p.click("#group-edit");
    await sleep(100);
    await p.ev(`document.getElementById("edit-delete").click()`);
    v = await view(p);
    t.eq([v.saved, v.title], [["B"], "B"], "グループが きえない");
    // さいごの 1 つも けすと、まんなかの「グループを つくる」に もどる
    await p.click("#group-edit");
    await sleep(100);
    await p.ev(`document.getElementById("edit-delete").click()`);
    v = await view(p);
    t.ok(v.empty && !v.bar, "ぜんぶ けしても「グループを つくる」に もどらない");
    t.noErrors(p);
    await server.close();
  },

  async "けす まえに たしかめる（いいえ なら けさない）"(t) {
    const { server, p } = await openApp(t, { storage: { "warpix-v2-groups": groupsData([["A", ["a1"]]]) } });
    await p.ev(`window.confirm = () => false`);
    await p.click("#group-edit");
    await sleep(100);
    await p.ev(`document.querySelector('#edit-links [data-act="del"]').click(); document.getElementById("edit-delete").click()`);
    const v = await view(p);
    t.eq([v.saved, v.tiles], [["A"], ["a1"]], "たしかめずに けした");
    t.noErrors(p);
    await server.close();
  },
};
