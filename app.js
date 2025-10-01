let reviews=[];
const elReview=document.getElementById('review');
const elSent=document.getElementById('sentiment');
const elNoun=document.getElementById('noun');
const elErr=document.getElementById('error');
const elSpin=document.getElementById('spinner');
const btnRand=document.getElementById('btn-rand');
const btnSent=document.getElementById('btn-sent');
const btnNoun=document.getElementById('btn-noun');
const tokenInput=document.getElementById('api-token');

let tokenOK=false; // кэш результата валидации токена

function uiLoading(x){[btnRand,btnSent,btnNoun].forEach(b=>b.disabled=x);elSpin.classList.toggle('show',x)}
function setErr(t){elErr.textContent=t||'';elErr.classList.toggle('show',!!t)}
function reset(){elSent.textContent='—';elNoun.textContent='—';setErr('')}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function firstLineLower(t){return (t||'').split('\n')[0].trim().toLowerCase()}
function mapSent(s){if(s.includes('positive'))return '👍';if(s.includes('negative'))return '👎';if(s.includes('neutral'))return '❓';return '❓'}
function mapNoun(s){if(s.startsWith('high'))return '🟢';if(s.startsWith('medium'))return '🟡';if(s.startsWith('low'))return '🔴';return '🔴'}
function getToken(){return (tokenInput.value||'').trim()}

document.addEventListener('DOMContentLoaded',()=>{
  Papa.parse('reviews_test.tsv',{download:true,header:true,delimiter:'\t',complete:r=>{reviews=(r.data||[]).filter(x=>(x.text||'').trim())}});
  const saved=localStorage.getItem('hfApiToken');if(saved){tokenInput.value=saved}
});

tokenInput.addEventListener('input',e=>{
  const v=e.target.value.trim();
  tokenOK=false; // сбрасываем флаг — токен изменился
  if(v) localStorage.setItem('hfApiToken',v); else localStorage.removeItem('hfApiToken')
});

btnRand.addEventListener('click',()=>{
  if(!reviews.length){setErr('No data loaded.');return}
  const row=pick(reviews);elReview.textContent=row.text||'';reset()
});

btnSent.addEventListener('click',async()=>{
  const txt=elReview.textContent.trim();if(!txt){setErr('Select a review first.');return}
  reset();uiLoading(true);
  const prompt='return only one word in lowercase on the first line: positive, negative, or neutral. classify this review: '+txt;
  const out=await ensureTokenThenCall(prompt);
  if(out.ok){elSent.textContent=mapSent(firstLineLower(out.text))}else setErr(out.err);
  uiLoading(false)
});

btnNoun.addEventListener('click',async()=>{
  const txt=elReview.textContent.trim();if(!txt){setErr('Select a review first.');return}
  reset();uiLoading(true);
  const prompt='return only one word in lowercase on the first line: high (if nouns>15), medium (6-15), or low (<6). count only nouns (common+proper; exclude pronouns/verbs/adjectives) in this review: '+txt;
  const out=await ensureTokenThenCall(prompt);
  if(out.ok){elNoun.textContent=mapNoun(firstLineLower(out.text))}else setErr(out.err);
  uiLoading(false)
});

// Валидируем токен один раз (или при изменении)
async function validateTokenOnce(){
  if(tokenOK) return {ok:true};
  const tok=getToken();
  if(!tok) return {ok:false,err:'Enter your Hugging Face token.'};
  try{
    const r=await fetch('https://huggingface.co/api/whoami',{
      headers:{'Authorization':'Bearer '+tok,'Accept':'application/json'}
    });
    if(!r.ok){
      const msg=await r.text();
      return {ok:false,err:'Token check failed: '+r.status+' '+msg};
    }
    tokenOK=true;
    return {ok:true};
  }catch(_){
    return {ok:false,err:'Network error while checking token.'};
  }
}

async function ensureTokenThenCall(prompt){
  const check=await validateTokenOnce();
  if(!check.ok) return check;
  return callApi(prompt);
}

async function callApi(prompt){
  try{
    const url='https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3';
    const headers={'Content-Type':'application/json','Accept':'application/json'};
    const tok=getToken();
    if(!tok) return {ok:false,err:'Enter your Hugging Face token.'};
    headers.Authorization='Bearer '+tok;

    const body={inputs:prompt,parameters:{max_new_tokens:8,temperature:0,return_full_text:false},options:{wait_for_model:true}};
    const res=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
    const raw=await res.text(); // читаем как текст для лучшей диагностики
    if(!res.ok){
      if(res.status===402||res.status===429) return {ok:false,err:'Rate limited or payment required. '+raw};
      if(res.status===401) return {ok:false,err:'Unauthorized (401). Check token permissions and value. '+raw};
      return {ok:false,err:'API error '+res.status+' '+raw}
    }
    let data;
    try{data=JSON.parse(raw)}catch(_){return {ok:false,err:'Bad JSON from API: '+raw}}
    if(data&&data.error) return {ok:false,err:String(data.error)};
    let text='';
    if(Array.isArray(data)&&data[0]?.generated_text) text=data[0].generated_text;
    else if(data.generated_text) text=data.generated_text;
    if(!text) return {ok:false,err:'Empty response: '+raw};
    return {ok:true,text}
  }catch(_){
    return {ok:false,err:'Network error'}
  }
}
