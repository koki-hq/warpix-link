// ピクセの ポストカード：ノートから作って、保存できる画像が出る
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export default {
  async "ノートの「ポストカード」で、1200x630 の画像ができて保存できる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.clear()`);
    await p.goto(server.url);
    await p.boot();
    await p.click("#room-btn");
    await t.sleep(300);
    await p.click("#postcard-btn");
    await t.sleep(1500);
    const s = await p.ev(`(() => { const img = document.querySelector(".postcard-img"); const a = document.querySelector(".postcard-save"); return { w: img?.naturalWidth, h: img?.naturalHeight, download: a?.getAttribute("download"), href: a?.href.startsWith("blob:"), alt: img?.alt }; })()`);
    t.eq([s.w, s.h], [1200, 630], "画像の大きさ");
    t.ok(s.download?.startsWith("warpix-pixe-") && s.download.endsWith(".png"), `保存のファイル名: ${s.download}`);
    t.ok(s.href, "保存用のリンクがない");
    t.ok(s.alt?.includes("ちびピクセ"), "画像の説明（alt）に今の姿の名前がない");
    t.ok(await p.ev(`achievements.has("postcard")`), "実績「ポストカード」がない");
    t.ok(await p.ev(`!document.getElementById("diary").open`), "ノートが閉じない");
    // できた画像そのものを保存して、見た目を確かめられるようにする
    const png = await p.ev(`postcard.render().then((cv) => cv.toDataURL("image/png").split(",")[1])`);
    mkdirSync(t.OUT, { recursive: true });
    writeFileSync(join(t.OUT, "postcard-image.png"), Buffer.from(png, "base64"));
    await p.key("Escape");
    t.ok(await p.ev(`!document.querySelector(".postcard")`), "Esc で閉じない");
    t.noErrors(p);
    await server.close();
  },
};
