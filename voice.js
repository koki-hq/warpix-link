// ---------- ピクセの こえ：ピクセの セリフを、ブラウザの よみあげで しゃべる ----------
// 「せってい」で えらんだ ときだけ。にほんごの こえを たかめに して、こうかおんの おおきさで。
// ブラウザに よみあげが ない ときは、せっていの スイッチを つかえなくする。
const voice = (() => {
  const synth = window.speechSynthesis;
  const supported = !!synth && typeof SpeechSynthesisUtterance === "function";
  let speaking = false;

  const enabled = () => supported && settings.state.voice === "on" && !simple.on;

  // しゃべる ための もじ：かいぎょうは くぎりに、きごうは よまない
  const clean = (line) =>
    line
      .replace(/\n+/g, "、")
      .replace(/[♪★☆♥〜~]/g, "")
      .replace(/…+/g, "、")
      .replace(/、(\s*、)+/g, "、")
      .replace(/([。！？])、/g, "$1")
      .replace(/^[、\s]+|[、\s]+$/g, "")
      .trim();

  // にほんごの こえ。もじを そとに おくらない、その きかいの なかの こえ（localService）を さきに えらぶ
  function pickVoice() {
    const ja = (synth.getVoices?.() ?? []).filter((v) => /^ja/i.test(v.lang));
    const local = ja.filter((v) => v.localService !== false);
    const pool = local.length ? local : ja;
    return pool.find((v) => /female|haruka|kyoko|nanami|sayaka|ayumi/i.test(v.name)) ?? pool[0] ?? null;
  }

  function say(line) {
    if (!supported) return;
    const text = clean(line);
    synth.cancel();
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.pitch = 1.8;
    u.rate = 1.1;
    u.volume = Math.max(0, Math.min(1, settings.state.se / 100));
    const v = pickVoice();
    if (v) u.voice = v;
    speaking = true;
    u.onend = u.onerror = () => (speaking = false);
    synth.speak(u);
  }

  on("npc-line", ({ line }) => {
    if (enabled() && !document.hidden) say(line);
  });
  // うらに したら とめる
  document.addEventListener("visibilitychange", () => document.hidden && supported && synth.cancel());

  // しゃべっている あいだは、もじおくりの ピコピコ音を ならさない
  const blip = sound.sfx.text;
  sound.sfx.text = () => {
    if (!(enabled() && speaking)) blip();
  };

  // せっていの スイッチ
  const box = document.getElementById("set-voice");
  if (!supported) {
    box.disabled = true;
    document.getElementById("set-voice-note").textContent = "※ この ブラウザでは こえが でません。";
  }
  box.addEventListener("change", () => {
    settings.state.voice = box.checked ? "on" : "off";
    settings.save();
    if (box.checked) {
      say("こんにちは！ ぼくの こえ、きこえる？");
      achievements.unlock("voice");
    } else if (supported) synth.cancel();
  });
  settings.onOpen(() => (box.checked = enabled()));

  return { say, clean, supported, isOn: enabled };
})();
