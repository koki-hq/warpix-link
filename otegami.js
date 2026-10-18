// ---------- ピクセに おてがみ（v1.47）：「このページについて」から、メールの アプリで pixe@warpix.app へ ----------
// 事務所の「ピクセの おたより箱」の いりぐち。アプリからは なにも おくらない（メールを おくるかは かいた 人が きめる）。
// したがきに いまの 版と きかいの しゅるいを いれておく（バグの ときに どこで おきたか わかる ように。けしても いい）。
const otegami = (() => {
  const link = document.getElementById("otegami");
  const TO = "pixe@warpix.app";
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const kind = () => `${ios ? "iPhone・iPad" : /Android/.test(navigator.userAgent) ? "Android" : "パソコン"}${pocket.standalone() ? "（ホームがめんの アプリ）" : "（ブラウザ）"}`;

  async function version() {
    try {
      return (await (await fetch("sw.js")).text()).match(/warpix-v(\d+\.\d+(?:\.\d+)?)/)?.[1]?.replace(/\.0$/, "") ?? "?";
    } catch {
      return "?";
    }
  }

  async function href() {
    const body = ["ピクセへ", "", "（ここに かいてね）", "", "", "──", `warpix-link v${await version()}`, kind()].join("\n");
    return `mailto:${TO}?subject=${encodeURIComponent("ピクセに おてがみ")}&body=${encodeURIComponent(body)}`;
  }

  // まどを ひらいた ときに したがきを つくっておく（おした ときに まつと、ブラウザが メールを ひらかない ことが ある）
  document.getElementById("about-btn").addEventListener("click", async () => {
    link.href = await href();
  });
  link.addEventListener("click", () => {
    emit("seen", { id: "otegami" });
    grow.write("otegami", "ピクセに おてがみを かいて もらった。", { force: true });
  });

  return { href, kind };
})();
