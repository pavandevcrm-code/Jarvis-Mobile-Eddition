// ===== 1. API KEY (Stored locally in browser) =====
let API_KEY = localStorage.getItem('jarvis_key');
if (!API_KEY) {
  API_KEY = prompt('Enter your Gemini API Key:');
  if (API_KEY) {
    API_KEY = API_KEY.trim();
    localStorage.setItem('jarvis_key', API_KEY);
  }
}

// ===== 2. SMART MODELS (Auto-fallback) =====
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
const chat = document.getElementById('chat');
const input = document.getElementById('msg');
const micBtn = document.getElementById('mic-btn');
const sendBtn = document.getElementById('send');

// ===== 3. GEMINI BRAIN (Auto-fallback) =====
async function callGemini(promptText) {
  if (!API_KEY) {
    throw new Error('Missing Gemini API Key. Refresh and enter your key.');
  }

  let lastErr;
  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });
      const data = await res.json();

      if (data.error) {
        lastErr = new Error(data.error.message);
        if (/high demand|temporar|quota|rate|unavailable|no longer available|deprecated|not found/i.test(data.error.message)) {
          continue;
        }
        throw lastErr;
      }

      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!replyText) {
        throw new Error('Empty response from Gemini.');
      }
      return replyText;
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
    chat.lastChild.innerText = 'J.A.R.V.I.S: ' + reply;
    speak(reply);
  } catch (e) {
    chat.lastChild.innerText = 'J.A.R.V.I.S: ERROR - ' + e.message;
  }
}

// ===== 4. SPEECH RECOGNITION (Voice Input) =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition && micBtn) {
  const rec = new SpeechRecognition();
  rec.lang = 'en-US'; // Change to 'te-IN' for Telugu voice input
  rec.interimResults = false;

  rec.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    add('YOU: ' + transcript, 'user');
    askGemini(transcript);
  };

  rec.onerror = (e) => {
    add('J.A.R.V.I.S: Mic error - ' + e.error, 'ai');
    micBtn.innerText = 'MIC';
  };

  rec.onend = () => {
    micBtn.innerText = 'MIC';
  };

  micBtn.onclick = () => {
    micBtn.innerText = 'LISTENING...';
    rec.start();
  };
} else if (micBtn) {
  micBtn.disabled = true;
  micBtn.title = 'Speech recognition not supported in this browser';
}

// ===== 5. TEXT-TO-SPEECH (Voice Reply) =====
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

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const cleanText = text.replace(/[*#`]/g, '');
  const u = new SpeechSynthesisUtterance(cleanText);
  u.rate = 1.05;
  u.pitch = 0.85;
  const v = voices.find((item) => item.lang.toLowerCase().startsWith('en'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

// ===== 6. TEXT SEND BUTTON =====
if (sendBtn) {
  sendBtn.onclick = () => {
    const t = input.value.trim();
    if (!t) return;
    add('YOU: ' + t, 'user');
    input.value = '';
    askGemini(t);
  };
}

function add(text, who) {
  const d = document.createElement('div');
  d.className = 'msg ' + who;
  d.innerText = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}
