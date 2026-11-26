//===== 3. సాధనాలు (చేతులు) 15 సాధనాలు

async function handleTools(text){

const t = text.toLowerCase();

// 1. సమయం

if(/\btime\b/.test(t)||t.includes ('')||t.includes (''))

return 'సమయం '+new Date().toLocaleTimeString()+', బాస్.';

// 2. వాతావరణం

if(t.includes ('weather')||t.includes ('')) {

return await new Promise(res=>{

navigator.geolocation.getCurrentPosition(async p=>{

try{

const r=await fetch('https://api.open-meteo.com/v1/forecast?

అక్షాంశం=${p.coords.latitude]&రేఖాంశం=${p.coords.longitude}ot_weather=true");

const d=await r.json();

res('ఇప్పుడు ${d.current_weather.temperature) డిగ్రీల సెల్సియస్ ఉంది, బాస్.");

}catch(e){ res ('వాతావరణ సేవ లోపం, బాస్.'); }

}, ()=> res('వాతావరణం కోసం నాకు స్థాన అనుమతి కావాలి, బాస్.'));

});

}

// 3. టైమర్

const m=t.match(/(\d+)\s* (సెకన్లు? | సెకన్లు? | నిమిషాలు? | నిమిషాలు? |గంటలు?|గంటలు?)/i);

if((t.includes('టైమర్')||t.includes ('')) &&m) {

const amount=parseInt(m[1]); const unit=m[2].toLowerCase();

const factor=/^(hours?|hrs?|h)/.test(unit)?3600000:/^(seconds? | secs?|s)/.test(unit)?1000:60000;

const duration=amount*factor;

setTimeout(()=>speak( ! ${amount} ${unit} ."), duration);

return Timer set for ${amount} ${unit}.';

}

// 4. Translate

if(t.includes ('translate')){

const q=text.replace(/translate (this)?/1,'').trim()||'hello';

try{

const r=await fetch('https://api.mymemory.translated.net/get?

q='+encodeURICcomponent(q)+'&langpair=en|te');

}

const d=await r.json(); return 'In Telugu: '+d.responseData.translatedText;

}catch(e){ return 'అనువాద లోపం, బాస్.'; }

// 5. YouTube Play

if(t.includes('play')||t.includes('youtube ')){

const q=text.replace(/play youtube (search)?/i,'').trim();

if(q){ window.open('https://www.youtube.com/results?search_query='+encodeURIComponent(q));

return 'Searching YouTube for '+q+', Boss.'; }

}

}

return null; // Tool match 5 Gemini Brain 3 3
