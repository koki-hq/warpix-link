// ---------- v1.4：アプリになる・オフライン・ゲームのコントローラー ----------

// ---------- ホーム画面に追加（PWA）とオフライン ----------
const pocket = (() => {
  const standalone = () =>
    matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  let deferred = null;

  // file:// で開いたときは登録できないので、http(s) のときだけ
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  // Chrome / Android：インストールできるタイミングを覚えておき、ピクセから聞く
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
  });
  addEventListener("appinstalled", () => {
    deferred = null;
    achievements.unlock("pocket");
    npc.say(["ぼくを ホームがめんに\nつれていって くれたんだ！", "これで いつでも あえるね。"]);
  });

  async function install() {
    if (standalone()) {
      npc.say(["もう アプリに なってるよ！\nここは ホームがめんの ぼく。"]);
      return;
    }
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      if (outcome !== "accepted") npc.say(["そっか、また こんどね。"]);
      return;
    }
    npc.say(
      isIOS
        ? ["Safari の きょうゆうボタン（□に↑）から\n「ホームがめんに ついか」してね。", "そしたら ぼくが アイコンに なるよ！"]
        : ["ブラウザの メニューから\n「アプリを インストール」してね。", "（ブラウザに よっては できないかも）"]
    );
  }

  on("boot", () => {
    // ホーム画面から開いてくれたとき
    // はじめての ときだけ きく。そのあとは ときどき ひとこと（v1.50）
    if (standalone()) {
      const first = !achievements.has("pocket");
      achievements.unlock("pocket");
      if (first) npc.addIntro("ホームがめんから きてくれたんだ！\nアプリの ぼく、どう？");
      else if (grow.firstToday && Math.random() < 0.15) npc.addIntro(["ポケットの なか、\nあったかいね。", "アイコンの なかで\nまってたよ。"][Math.floor(Math.random() * 2)]);
    }
    // しばらくして、インストールできそうならおさそい
    setTimeout(function offer() {
      if (!deferred || standalone()) return;
      if (!npc.ready() || playing() || npc.isAway()) return setTimeout(offer, 10000);
      // 1 かい ひらいて 1 つ まで。こたえたら 1 しゅうかん あけて、2 かい ことわられたら おわり（v1.52）
      if (!npc.mayAsk("install") || !npc.turn()) return;
      npc.ask("ぼくを ホームがめんに\nつれていける みたい！", ["つれていく", "あとで"]).then((i) => {
        if (i >= 0) npc.answered("install", i === 0);
        if (i === 0) install();
        else if (i === 1) npc.say(["わかった！"]);
      });
    }, 90000);
  });

  addEventListener("offline", () =>
    npc.say(["あれ、オフライン みたい。", "でも だいじょうぶ、\nぼくは ここに いるよ！"])
  );
  addEventListener("online", () => npc.say(["つながった！\nおかえり、インターネット。"]));

  cheats.add("install", install);
  return { install, standalone, canInstall: () => Boolean(deferred) && !standalone() };
})();

// ---------- ゲームのコントローラー（Gamepad API） ----------
(() => {
  // 標準配置のボタン番号
  const BTN = { a: 0, b: 1, select: 8, start: 9, up: 12, down: 13, left: 14, right: 15 };
  const held = {};
  let polling = false;
  let greeted = false;
  let fromPad = false; // コントローラーで押したリンクかどうか

  const focusables = () => {
    const choices = [...document.querySelectorAll(".dialog-choices button")];
    if (choices.length) return choices;
    const dialog = document.querySelector("#diary[open]");
    if (dialog) return [...dialog.querySelectorAll("button:not(:disabled), input")].filter((el) => el.getClientRects().length);
    return [...document.querySelectorAll(".pixel-btn:not([hidden]), .coin-slot")];
  };

  function move(dir) {
    const list = focusables();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement);
    const next = list[(i + dir + list.length) % list.length] ?? list[0];
    next.focus({ focusVisible: true });
    next.scrollIntoView({ block: "nearest" });
  }

  // ゲーム側のキー入力に流しこむ（ミニゲーム・冒険・コナミコマンドがそのまま動く）
  function key(type, k) {
    const target = document.activeElement || document.body;
    target.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));
  }

  // コントローラーではポップアップが止められやすいので、リンクは自分で開く
  document.addEventListener(
    "click",
    (e) => {
      if (!fromPad) return;
      const a = e.target.closest?.("a[href]");
      if (!a) return;
      e.preventDefault();
      const win = open(a.href, "_blank", "noopener");
      if (!win) location.assign(a.href); // 別タブが無理なら、このタブでワープ
    },
    true
  );

  function press(name) {
    const started = document.body.classList.contains("booted");
    if (!started) {
      if (name === "a" || name === "start") document.getElementById("start-btn").click();
      return;
    }
    const arrows = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };

    if (playing()) {
      if (arrows[name]) key("keydown", arrows[name]);
      if (name === "a" || name === "start") key("keydown", " ");
      if (name === "b" || name === "select") key("keydown", "Escape");
      return;
    }

    // ふつうの画面：十字キーでフォーカス移動。コナミコマンドにも届くようにキーも流す
    if (arrows[name]) {
      key("keydown", arrows[name]);
      if (name === "up" || name === "left") move(-1);
      else move(1);
    }
    if (name === "a") {
      key("keydown", "a");
      const el = document.activeElement;
      if (el && el !== document.body && el.click) {
        fromPad = true;
        el.click();
        fromPad = false;
      }
    }
    if (name === "b") {
      key("keydown", "b");
      document.querySelector("#diary[open]")?.close();
    }
    if (name === "start") {
      // START で おへやの「じっせき」を ひらく・とじる
      const dialog = document.getElementById("diary");
      if (dialog.open) dialog.close();
      else room.open("trophy");
    }
  }

  function release(name) {
    const arrows = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
    if (arrows[name]) key("keyup", arrows[name]);
    if (name === "a" || name === "start") key("keyup", " ");
  }

  function poll() {
    const pads = [...navigator.getGamepads()].filter(Boolean);
    if (!pads.length) {
      polling = false;
      return;
    }
    const pad = pads[0];
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    const state = {
      a: pad.buttons[BTN.a]?.pressed,
      b: pad.buttons[BTN.b]?.pressed,
      select: pad.buttons[BTN.select]?.pressed,
      start: pad.buttons[BTN.start]?.pressed,
      up: pad.buttons[BTN.up]?.pressed || ay < -0.6,
      down: pad.buttons[BTN.down]?.pressed || ay > 0.6,
      left: pad.buttons[BTN.left]?.pressed || ax < -0.6,
      right: pad.buttons[BTN.right]?.pressed || ax > 0.6,
    };
    for (const [name, on] of Object.entries(state)) {
      if (on && !held[name]) press(name);
      if (!on && held[name]) release(name);
      held[name] = !!on;
    }
    requestAnimationFrame(poll);
  }

  addEventListener("gamepadconnected", (e) => {
    achievements.unlock("gamepad");
    if (!greeted) {
      greeted = true;
      npc.say([
        "コントローラー みつけた！",
        "じゅうじキーで えらんで、\nAボタンで ワープ。STARTで じっせき。",
      ]);
    }
    if (!polling) {
      polling = true;
      requestAnimationFrame(poll);
    }
    emit("gamepad", { id: e.gamepad.id });
  });
})();
