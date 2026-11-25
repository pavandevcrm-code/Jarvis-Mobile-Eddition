// ===== 1. API KEY & SMART MODELS =====
let API_KEY = localStorage.getItem('jarvis_key');
if (!API_KEY) {
  API_KEY = prompt('Enter your Gemini API Key:');
  if (API_KEY) {
    API_KEY = API_KEY.trim();
    localStorage.setItem('jarvis_key', API_KEY);
  }
}

const MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
const chat = document.getElementById('chat');
const input = document.getElementById('msg');
const micBtn = document.getElementById('mic-btn');
const clearBtn = document.getElementById('clear-btn');
const camBtn = document.getElementById('cam-btn');
const imgInput = document.getElementById('img-input');
const sendBtn = document.getElementById('send');

// ===== 2. MEMORY SYSTEM =====
let MEMORY = [];
try {
  MEMORY = JSON.parse(localStorage.getItem('jarvis_memory') || '[]');
} catch (e) {
  MEMORY = [];
}

function saveMemory() {
  localStorage.setItem('jarvis_memory', JSON.stringify(MEMORY));
}

MEMORY.forEach((m) => {
  const prefix = m.role === 'user' ? 'YOU: ' : 'J.A.R.V.I.S: ';
  const roleClass = m.role === 'user' ? 'user' : 'ai';
  add(prefix + m.text, roleClass);
});

// ===== 3. GEMINI BRAIN (MEMORY INTEGRATED) =====
async function callGemini(promptText) {
  if (!API_KEY) {
    throw new Error('Missing Gemini API Key. Refresh and enter your key.');
  }

  const contents = MEMORY.slice(-12).map((m) => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));
  contents.push({ role: 'user', parts: [{ text: promptText }] });

  let lastErr;
  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });
      const data = await res.json();

      if (data.error) {
        lastErr = new Error(data.error.message);
        if (/high demand|temporar|quota|rate|unavailable|deprecated|not found/i.test(data.error.message)) {
          continue;
        }
        throw lastErr;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response from Gemini.');
      }
      return text;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All Gemini models failed.');
}

async function askGemini(promptText) {
  add('J.A.R.V.I.S: Thinking...', 'ai');
  try {
    const reply = await callGemini(promptText);
    MEMORY.push({ role: 'user', text: promptText });
    MEMORY.push({ role: 'model', text: reply });
    saveMemory();
    chat.lastChild.innerText = 'J.A.R.V.I.S: ' + reply;
    speak(reply);
  } catch (e) {
    chat.lastChild.innerText = 'J.A.R.V.I.S: ERROR - ' + e.message;
  }
}

// ===== 4. VISION ENGINE (EYES) =====
if (camBtn && imgInput) {
  camBtn.onclick = () => imgInput.click();

  imgInput.onchange = () => {
    const file = imgInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      const q = input.value.trim() || 'What do you see? Describe briefly.';
      add('YOU: [IMAGE] ' + q, 'user');
      input.value = '';
      imgInput.value = '';
      askVision(base64, file.type, q);
    };
    reader.readAsDataURL(file);
  };
}

async function askVision(base64, mime, q) {
  if (!API_KEY) {
    add('J.A.R.V.I.S: ERROR - Missing Gemini API Key.', 'ai');
    return;
  }

  add('J.A.R.V.I.S: Analyzing image...', 'ai');
  let lastErr;
  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: q },
              { inline_data: { mime_type: mime, data: base64 } }
            ]
          }]
        })
      });
      const data = await res.json();

      if (data.error) {
        lastErr = new Error(data.error.message);
        if (/high demand|temporar|quota|rate|unavailable|deprecated|not found/i.test(data.error.message)) {
          continue;
        }
        throw lastErr;
      }

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) {
        throw new Error('Empty vision response from Gemini.');
      }

      MEMORY.push({ role: 'user', text: `[Image sent: ${q}]` });
      MEMORY.push({ role: 'model', text: reply });
      saveMemory();
      chat.lastChild.innerText = 'J.A.R.V.I.S: ' + reply;
      speak(reply);
      return;
    } catch (e) {
      lastErr = e;
    }
  }

  const errMsg = lastErr ? lastErr.message : 'Vision request failed.';
  chat.lastChild.innerText = 'J.A.R.V.I.S: ERROR - ' + errMsg;
}

// ===== 5. VOICE & UTILS =====
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR && micBtn) {
  const rec = new SR();
  rec.lang = 'en-US';
  rec.onresult = (e) => {
    const t = e.results[0][0].transcript;
    add('YOU: ' + t, 'user');
    askGemini(t);
  };
  rec.onerror = (e) => {
    add('J.A.R.V.I.S: Mic error - ' + e.error, 'ai');
    micBtn.innerText = '🎤';
  };
  micBtn.onclick = () => {
    micBtn.innerText = 'LISTENING...';
    rec.start();
  };
  rec.onend = () => {
    micBtn.innerText = '🎤';
  };
}

let voices = [];
function loadVoices() {
  if ('speechSynthesis' in window) {
    voices = speechSynthesis.getVoices();
  }
}
loadVoices();
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(t) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const clean = t.replace(/[*#`]/g, '');
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 1.05;
  u.pitch = 0.85;
  const v = voices.find((item) => item.lang.toLowerCase().startsWith('en'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

if (sendBtn) {
  sendBtn.onclick = () => {
    const t = input.value.trim();
    if (!t) return;
    add('YOU: ' + t, 'user');
    input.value = '';
    askGemini(t);
  };
}

if (clearBtn) {
  clearBtn.onclick = () => {
    MEMORY = [];
    saveMemory();
    chat.innerHTML = '';
    add('SYSTEM: Memory cleared.', 'ai');
  };
}

function add(t, w) {
  const d = document.createElement('div');
  d.className = 'msg ' + w;
  d.innerText = t;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}
