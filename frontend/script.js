// ===== 3. TOOLS (THE HANDS) — 15 TOOLS =====
async function handleTools(text) {
  const raw = text.trim();
  const t = raw.toLowerCase();

  // 1. Time
  if (/\btime\b/.test(t) || t.includes('టైమ్') || t.includes('సమయం')) {
    return 'The time is ' + new Date().toLocaleTimeString() + ', Boss.';
  }

  // 2. Date
  if (/\bdate\b|\btoday\b/.test(t) || t.includes('తేదీ')) {
    return 'Today is ' + new Date().toLocaleDateString() + ', Boss.';
  }

  // 3. Weather
  if (t.includes('weather') || t.includes('వాతావరణం')) {
    if (!navigator.geolocation) {
      return 'Geolocation is not supported on this device, Boss.';
    }
    return await new Promise((res) => {
      navigator.geolocation.getCurrentPosition(
        async (p) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current_weather=true`;
            const r = await fetch(url);
            const d = await r.json();
            res(`It is ${d.current_weather.temperature} degrees Celsius now, Boss.`);
          } catch (e) {
            res('Weather service error, Boss.');
          }
        },
        () => res('I need location permission for weather, Boss.')
      );
    });
  }

  // 4. Timer
  const m = t.match(/(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i);
  if ((t.includes('timer') || t.includes('టైమర్')) && m) {
    const amount = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    const factor = /^(hours?|hrs?|h)/.test(unit)
      ? 3600000
      : /^(seconds?|secs?|s)/.test(unit)
      ? 1000
      : 60000;
    const duration = amount * factor;
    setTimeout(() => {
      if (typeof speak === 'function') {
        speak(`టైమర్ పూర్తైంది! ${amount} ${unit} అయ్యాయి.`);
      }
      add(`J.A.R.V.I.S: Timer finished (${amount} ${unit}), Boss.`, 'ai');
    }, duration);
    return `Timer set for ${amount} ${unit}.`;
  }

  // 5. Translate (EN -> TE)
  if (t.startsWith('translate ') || t === 'translate') {
    const q = raw.replace(/^translate\s+(this\s+)?/i, '').trim() || 'hello';
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|te`;
      const r = await fetch(url);
      const d = await r.json();
      return 'In Telugu: ' + d.responseData.translatedText;
    } catch (e) {
      return 'Translate error, Boss.';
    }
  }

  // 6. YouTube Play / Search
  if (t.startsWith('play ') || t.startsWith('youtube ')) {
    const q = raw.replace(/^(play|youtube(\s+search)?)\s+/i, '').trim();
    if (q) {
      window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), '_blank');
      return 'Searching YouTube for ' + q + ', Boss.';
    }
  }

  // 7. Quick Math Calculator
  const calcMatch = t.match(/^(?:calc(?:ulate)?|math)\s+(.+)$/i);
  if (calcMatch && /^[0-9+\-*/().%\s]+$/.test(calcMatch[1])) {
    try {
      const result = Function(`"use strict"; return (${calcMatch[1]})`)();
      return `Result: ${result}, Boss.`;
    } catch (e) {
      return 'Could not calculate that expression, Boss.';
    }
  }

  // 8. Flip a Coin
  if (t.includes('flip a coin') || t.includes('coin flip') || t === 'flip') {
    return (Math.random() < 0.5 ? 'Heads' : 'Tails') + ', Boss.';
  }

  // 9. Roll a Dice
  if (t.includes('roll a dice') || t.includes('roll dice') || t === 'dice') {
    const roll = Math.floor(Math.random() * 6) + 1;
    return `You rolled a ${roll}, Boss.`;
  }

  // 10. Random Number
  const randMatch = t.match(/random(?:\s+number)?\s+(\d+)\s*(?:to|-)\s*(\d+)/);
  if (randMatch) {
    const min = Math.min(parseInt(randMatch[1], 10), parseInt(randMatch[2], 10));
    const max = Math.max(parseInt(randMatch[1], 10), parseInt(randMatch[2], 10));
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    return `Random number between ${min} and ${max}: ${num}, Boss.`;
  }

  // 11. Battery Status
  if (t.includes('battery')) {
    if ('getBattery' in navigator) {
      try {
        const bat = await navigator.getBattery();
        const pct = Math.round(bat.level * 100);
        return `Battery is at ${pct}% (${bat.charging ? 'charging' : 'not charging'}), Boss.`;
      } catch (e) {
        return 'Unable to read battery status, Boss.';
      }
    }
    return 'Battery API is not available in this browser, Boss.';
  }

  // 12. Network / Online Status
  if (t.includes('internet') || t.includes('connection') || t.includes('online status')) {
    return navigator.onLine
      ? 'Network connection is online, Boss.'
      : 'You appear to be offline, Boss.';
  }

  // 13. Clear Chat / Memory via Command
  if (t === 'clear memory' || t === 'wipe memory') {
    if (typeof clearBtn !== 'undefined' && clearBtn) {
      clearBtn.click();
      return null;
    }
  }

  // 14. Word & Character Counter
  const countMatch = raw.match(/^count\s+(.+)$/i);
  if (countMatch) {
    const sample = countMatch[1].trim();
    const words = sample ? sample.split(/\s+/).length : 0;
    return `${words} words, ${sample.length} characters, Boss.`;
  }

  // 15. Quick Greeting / Status Check
  if (t === 'status' || t === 'ping' || t.includes('are you there')) {
    return 'All core modules standing by, Boss.';
  }

  return null; // Falls back to Gemini Brain when no tool matches
}
