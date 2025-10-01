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

function uiLoading(x){[btnRand,btnSent,btnNoun].forEach(b=>b.disabled=x);elSpin.classList.toggle('show',x)}
function setErr(t){elErr.textContent=t||'';elErr.classList.toggle('show',!!t)}
function reset(){elSent.textContent='—';elNoun.textContent='—';setErr('')}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function firstLineLower(t){return (t||'').split('\n')[0].trim().toLowerCase()}
function mapSent(s){if(s.includes('positive'))return '👍';if(s.includes('negative'))return '👎';if(s.includes('neutral'))return '❓';return '❓'}
function mapNoun(s){if(s.startsWith('high'))return '🟢';if(s.startsWith('medium'))return '🟡';if(s.startsWith('low'))return '🔴';return '🔴'}

document.addEventListener('DOMContentLoaded',()=>{
  Papa.parse('reviews_test.tsv',{download:true,header:true,delimiter:'\t',complete:r=>{reviews=(r.data||[]).filter(x=>(x.text||'').trim())}});
  const saved=localStorage.getItem('hfApiToken');if(saved){tokenInput.value=saved}
});

tokenInput.addEventListener('input',e=>{
  const v=e.target.value.trim();
  if(v) localStorage.setItem('hfApiToken',v); else localStorage.removeItem('hfApiToken')
});

btnRand.addEventListener('click',()=>{
  if(!reviews.length){setErr('No data loaded.');return}
  const row=pick(reviews);elReview.textContent=row.text||'';reset()
});

btnSent.addEventListener('click',async()=>{
  const txt=elReview.textContent.trim();if(!txt){setErr('Select a review first.');return}
  reset();uiLoading(true);
  const prompt='Return only one word in lowercase on the first line: positive, negative, or neutral. Classify this review: '+txt;
  const out=await callApi(prompt);
  if(out.ok){elSent.textContent=mapSent(firstLineLower(out.text))}else setErr(out.err);
  uiLoading(false)
});

btnNoun.addEventListener('click',async()=>{
  const txt=elReview.textContent.trim();if(!txt){setErr('Select a review first.');return}
  reset();uiLoading(true);
  const prompt='Return only one word in lowercase on the first line: high (if nouns>15), medium (6-15), or low (<6). Count nouns (common+proper; exclude pronouns/verbs/adjectives) in this review: '+txt;
  const out=await callApi(prompt);
  if(out.ok){elNoun.textContent=mapNoun(firstLineLower(out.text))}else setErr(out.err);
  uiLoading(false)
});

async function callApi(prompt){
  try{
    const url='https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3';
    const headers={'Content-Type':'application/json','Accept':'application/json'};
    const tok=(tokenInput.value||'').trim();
    if(tok) headers.Authorization='Bearer '+tok;
    const body={inputs:prompt,parameters:{max_new_tokens:8,temperature:0,return_full_text:false},options:{wait_for_model:true}};
    const res=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
    if(!res.ok){
      if(res.status===402||res.status===429) return {ok:false,err:'Rate limited or payment required. Try later or add a valid token.'};
      if(res.status===401) return {ok:false,err:'Unauthorized. Add a valid token.'};
      return {ok:false,err:'API error '+res.status}
    }
    const data=await res.json();
    if(data&&data.error) return {ok:false,err:String(data.error)};
    let text='';
    if(Array.isArray(data)&&data[0]?.generated_text) text=data[0].generated_text;
    else if(data.generated_text) text=data.generated_text;
    if(!text) return {ok:false,err:'Empty response'};
    return {ok:true,text}
  }catch(e){return {ok:false,err:'Network error'}}
}
