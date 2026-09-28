const $=s=>document.querySelector(s);
const app=$("#app");
const questions=window.QUESTIONS;
const exams=window.EXAMS;
let state={page:"home",filter:{},queue:[],idx:0,answered:{},wrong:JSON.parse(localStorage.getItem("math_wrong")||"[]"),stats:JSON.parse(localStorage.getItem("math_stats")||'{"solved":0,"correct":0}' )};

function save(){localStorage.setItem("math_wrong",JSON.stringify(state.wrong));localStorage.setItem("math_stats",JSON.stringify(state.stats))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function nav(p){state.page=p;render();scrollTo(0,0)}
function cardExam(e){return `<div class="card exam-card"><div><div class="kicker">${e.date}</div><h3>${esc(e.label)}</h3><div class="muted">${esc(e.scope)}</div></div><div><a class="btn small" target="_blank" href="${e.official}">공식 자료 ↗</a></div></div>`}
function home(){
 const solved=state.stats.solved, acc=solved?Math.round(state.stats.correct/solved*100):0;
 app.innerHTML=`<section class="hero">
  <div><div class="kicker">MATH ARCHIVE / BETA</div><h1>수학 기출을<br>원하는 만큼, 원하는 방식으로.</h1><p>시험별로 풀고, 단원으로 섞고, 난이도로 좁히고, 틀린 문제를 다시 푼다. 문제은행을 ‘자료실’이 아니라 학습 도구로 만드는 프로젝트.</p>
  <div class="toolbar"><button class="btn" data-go="bank">문제 골라 풀기</button><button class="btn secondary" data-go="exams">시험 찾아보기</button></div></div>
  <div class="card hero-card"><div><div class="kicker">MY RECORD</div><div class="big-number">${acc}%</div><div class="muted">누적 정답률</div></div><div class="grid grid-2"><div><b>${solved}</b><div class="muted">풀이</div></div><div><b>${state.wrong.length}</b><div class="muted">오답</div></div></div></div>
 </section>
 <section class="section"><div class="section-head"><h2>최근 시험</h2><button class="btn secondary small" data-go="exams">전체 보기</button></div><div class="grid grid-3">${exams.slice(0,3).map(cardExam).join("")}</div></section>
 <section class="section"><div class="section-head"><h2>지금 가능한 것</h2></div><div class="grid grid-4">
 ${["시험 전체 풀기","단원·난이도 조합","오답 다시 풀기","풀이 기록 저장"].map((x,i)=>`<div class="card"><div class="kicker">0${i+1}</div><h3>${x}</h3><div class="muted">브라우저에 기록을 저장해 다음에도 이어서 볼 수 있습니다.</div></div>`).join("")}</div></section>`;
}
function examsPage(){
 app.innerHTML=`<div class="section-head"><div><div class="kicker">EXAMS</div><h1>시험별 기출</h1></div></div><p class="muted">현재 카탈로그에는 최근 평가원 시험을 우선 등록해 두었습니다. 공식 자료 버튼은 EBSi 자료실로 연결됩니다.</p><div class="grid grid-3">${exams.map(cardExam).join("")}</div>`;
}
function bankPage(){
 const units=[...new Set(questions.map(q=>q.unit))], subs=[...new Set(questions.map(q=>q.subject))];
 app.innerHTML=`<div class="kicker">QUESTION BANK</div><h1>조건별 문제 풀기</h1>
 <div class="card">
  <div class="filters">
   <select id="fsub"><option value="">과목 전체</option>${subs.map(x=>`<option>${x}</option>`).join("")}</select>
   <select id="funit"><option value="">단원 전체</option>${units.map(x=>`<option>${x}</option>`).join("")}</select>
   <select id="fdiff"><option value="">난이도 전체</option>${[1,2,3,4,5].map(x=>`<option value="${x}">${x} / 5</option>`).join("")}</select>
   <select id="fscore"><option value="">배점 전체</option><option value="2">2점</option><option value="3">3점</option><option value="4">4점</option></select>
  </div>
  <div class="toolbar"><input id="fsearch" placeholder="문제 제목 검색"><button class="btn" id="make">이 조건으로 풀기</button><button class="btn secondary" id="hard">고난도 5개</button></div>
 </div><div id="results"></div>`;
 const update=()=>{
  const s=$("#fsub").value,u=$("#funit").value,d=$("#fdiff").value,sc=$("#fscore").value,t=$("#fsearch").value.trim();
  const arr=questions.filter(q=>(!s||q.subject===s)&&(!u||q.unit===u)&&(!d||q.difficulty==d)&&(!sc||q.score==sc)&&(!t||q.title.includes(t)));
  $("#results").innerHTML=`<div class="question-list">${arr.map(q=>`<div class="qrow"><div class="qnum">${q.id.split("-").pop()}</div><div><div class="qtitle">${esc(q.title)}</div><div class="qmeta">${q.subject} · ${q.unit} · 난이도 ${q.difficulty}/5 · ${q.score}점</div></div><button class="btn small" data-solve="${q.id}">풀기</button></div>`).join("")||'<div class="empty">조건에 맞는 문제가 없습니다.</div>'}</div>`;
 };
 ["fsub","funit","fdiff","fscore","fsearch"].forEach(id=>$("#"+id).addEventListener("input",update));
 $("#make").onclick=()=>start(questions.filter(q=>{const s=$("#fsub").value,u=$("#funit").value,d=$("#fdiff").value,sc=$("#fscore").value;return(!s||q.subject===s)&&(!u||q.unit===u)&&(!d||q.difficulty==d)&&(!sc||q.score==sc)}));
 $("#hard").onclick=()=>start([...questions].sort((a,b)=>b.difficulty-a.difficulty).slice(0,5));
 update();
}
function start(arr){if(!arr.length){alert("문제가 없습니다.");return}state.queue=arr;state.idx=0;nav("solve")}
function solvePage(){
 const q=state.queue[state.idx];
 if(!q){nav("home");return}
 const answered=state.answered[q.id];
 app.innerHTML=`<div class="solve-shell"><div class="section-head"><div><div class="kicker">${q.subject} · ${q.unit}</div><h1>문제 ${state.idx+1} / ${state.queue.length}</h1></div><div class="muted">난이도 ${q.difficulty}/5 · ${q.score}점</div></div>
 <div class="progress"><i style="width:${(state.idx/state.queue.length)*100}%"></i></div>
 <div class="question"><h2>${esc(q.title)}</h2><div class="statement">${esc(q.text)}</div><div class="choices">${q.choices.map((c,i)=>`<button class="choice ${answered?(i+1===q.answer?"correct":(answered.choice===i+1?"wrong":"")):""}" data-choice="${i+1}" ${answered?"disabled":""}>${i+1}. ${esc(c)}</button>`).join("")}</div>
 <div id="feedback"></div><div class="answer-box">${!answered?`<button class="btn secondary" id="mark">오답으로 표시</button>`:""}<button class="btn" id="next">${state.idx+1===state.queue.length?"끝내기":"다음 문제"}</button></div></div></div>`;
 document.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>answer(q,+b.dataset.choice));
 if(answered) $("#feedback").innerHTML=`<div class="result ${answered.correct?"good":"bad"}">${answered.correct?"정답입니다.":"오답입니다."} <span class="muted">${esc(q.note)}</span></div>`;
 if($("#mark"))$("#mark").onclick=()=>markWrong(q);
 $("#next").onclick=()=>{state.idx++;solvePage()};
}
function answer(q,c){
 if(state.answered[q.id])return;
 const correct=c===q.answer;state.answered[q.id]={choice:c,correct};state.stats.solved++;if(correct)state.stats.correct++;
 if(!correct&&!state.wrong.includes(q.id))state.wrong.push(q.id);save();solvePage();
}
function markWrong(q){if(!state.wrong.includes(q.id))state.wrong.push(q.id);save();alert("오답노트에 추가했습니다.")}
function wrongPage(){
 const arr=questions.filter(q=>state.wrong.includes(q.id));
 app.innerHTML=`<div class="kicker">WRONG NOTE</div><h1>오답노트</h1><p class="muted">틀렸거나 직접 표시한 문제입니다.</p><div class="question-list">${arr.map(q=>`<div class="qrow"><div class="qnum">!</div><div><div class="qtitle">${esc(q.title)}</div><div class="qmeta">${q.subject} · ${q.unit} · 난이도 ${q.difficulty}/5</div></div><button class="btn small" data-solve="${q.id}">다시 풀기</button></div>`).join("")||'<div class="empty">아직 오답이 없습니다.</div>'}</div>`;
}
function statsPage(){
 const s=state.stats,acc=s.solved?Math.round(s.correct/s.solved*100):0;
 app.innerHTML=`<div class="kicker">MY RECORD</div><h1>풀이 기록</h1><div class="grid grid-3 section"><div class="stat"><span class="muted">푼 문제</span><strong>${s.solved}</strong></div><div class="stat"><span class="muted">정답</span><strong>${s.correct}</strong></div><div class="stat"><span class="muted">정답률</span><strong>${acc}%</strong></div></div>
 <div class="section card"><h3>현재 데이터셋</h3><p class="muted">${questions.length}개 데모 문제 · 실제 기출 카탈로그 ${exams.length}개. 다음 단계에서 실제 기출 데이터셋을 추가하는 구조입니다.</p></div>`;
}
function render(){
 if(state.page==="home")home(); else if(state.page==="exams")examsPage(); else if(state.page==="bank")bankPage(); else if(state.page==="solve")solvePage(); else if(state.page==="wrong")wrongPage(); else statsPage();
 document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>nav(b.dataset.page));
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>nav(b.dataset.go));
 document.querySelectorAll("[data-solve]").forEach(b=>b.onclick=()=>{const q=questions.find(x=>x.id===b.dataset.solve);start([q])});
}
Promise.all([fetch("data/questions.json").then(r=>r.json()),fetch("data/exams.json").then(r=>r.json())]).then(([q,e])=>{window.QUESTIONS=q;window.EXAMS=e;render()});
