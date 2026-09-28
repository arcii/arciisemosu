(() => {
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const state = { questions: [], solutions: [], exams: [], page: 'home', exam: null, subject: '공통', selectedChoice: '확률과 통계', index: 0, selectedBank: [] };
  const KEYS = {wrong:'semosu_wrong_v3', history:'semosu_history_v3'};
  const getStore = (k,d=[]) => { try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d} };
  const setStore = (k,v) => localStorage.setItem(k,JSON.stringify(v));
  const wrong = () => getStore(KEYS.wrong,[]);
  const history = () => getStore(KEYS.history,[]);
  const esc = s => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const qkey = q => `${q.exam}|${q.subject}|${q.question}`;
  const answerText = a => a || '';
  function toast(s){toastEl.textContent=s;toastEl.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toastEl.classList.remove('show'),1800)}
  function go(page){state.page=page;location.hash=page;render()}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b){e.preventDefault();go(b.dataset.page)}});
  function examLabel(id){return state.exams.find(e=>e.id===id)?.title||id}
  function makeExams(){
    return [
      {id:'2506',title:'2026학년도 6월 모의평가',short:'2025.06',kind:'6월 모의평가'},
      {id:'2509',title:'2026학년도 9월 모의평가',short:'2025.09',kind:'9월 모의평가'},
      {id:'2511',title:'2026학년도 대학수학능력시험',short:'2025.11',kind:'수능'},
      {id:'2606',title:'2027학년도 6월 모의평가',short:'2026.06',kind:'6월 모의평가'},
      {id:'2609',title:'2027학년도 9월 모의평가',short:'2026.09',kind:'9월 모의평가'}
    ];
  }
  function byKey(exam,subject,q){return state.questions.find(x=>x.exam===exam&&x.subject===subject&&x.question===q)}
  function solByKey(exam,subject,q){return state.solutions.find(x=>x.exam===exam&&x.section===subject&&x.q===q)}
  function subjectCount(exam,s){return state.questions.filter(q=>q.exam===exam&&q.subject===s).length}
  function subjectsForExam(exam){return ['공통','확률과 통계','미적분','기하'].filter(s=>subjectCount(exam,s))}
  function home(){
    app.innerHTML=`<section class="hero"><div class="eyebrow">MATH ARCHIVE · V3</div><h1>기출을 찾고,<br>바로 푼다.</h1><p>문제지 전체를 업로드할 필요 없이, 모든 문항이 번호별 이미지로 저장되어 있습니다.</p></section>
      <div class="grid">${state.exams.map(e=>`<article class="card exam-card clickable" data-open-exam="${e.id}"><div><div class="exam-year">${e.short}</div><div class="exam-title">${e.title}</div><div class="exam-meta">공통 22문항 · 선택과목 각 8문항</div></div><div>${subjectsForExam(e.id).map(s=>`<span class="pill">${s}</span>`).join('')}</div></article>`).join('')}</div>`;
    document.querySelectorAll('[data-open-exam]').forEach(x=>x.onclick=()=>{state.exam=x.dataset.openExam;state.subject='공통';state.index=0;go('exam')});
  }
  function exams(){
    app.innerHTML=`<h2 class="section-title">시험별</h2><div class="grid">${state.exams.map(e=>`<article class="card exam-card clickable" data-open-exam="${e.id}"><div class="exam-year">${e.short}</div><div class="exam-title">${e.title}</div><div class="exam-meta">${subjectsForExam(e.id).map(s=>`${s} ${subjectCount(e.id,s)}문항`).join(' · ')}</div></article>`).join('')}</div>`;
    document.querySelectorAll('[data-open-exam]').forEach(x=>x.onclick=()=>{state.exam=x.dataset.openExam;state.subject='공통';state.index=0;go('exam')});
  }
  function examPage(){
    if(!state.exam){go('exams');return}
    const selected = state.subject === '전체' ? state.selectedChoice : state.subject;
    let qs;
    if(state.subject === '전체') {
      const common=state.questions.filter(q=>q.exam===state.exam&&q.subject==='공통').sort((a,b)=>a.question-b.question);
      const choice=state.questions.filter(q=>q.exam===state.exam&&q.subject===selected).sort((a,b)=>a.question-b.question);
      qs=[...common,...choice];
    } else qs=state.questions.filter(q=>q.exam===state.exam&&q.subject===state.subject).sort((a,b)=>a.question-b.question);
    const idx=Math.min(state.index,qs.length-1), q=qs[idx];
    const sol=solByKey(q.exam,q.subject,q.question);
    const key=qkey(q); const isWrong=wrong().includes(key);
    app.innerHTML=`<section class="solve"><div class="solve-head"><div><div class="eyebrow">${examLabel(state.exam)}</div><div class="solve-title">${state.subject==='전체'?'전체 시험':q.subject} · ${q.question}번</div></div><button class="btn" id="backExam">시험 목록</button></div>
      <div class="tabs">${['전체',...subjectsForExam(state.exam)].map(s=>`<button class="tab ${s===state.subject?'active':''}" data-subject="${esc(s)}">${s}</button>`).join('')}</div>
      ${state.subject==='전체'?`<div class="toolbar"><span class="q-meta">전체 시험 모드 · 공통 22문항 + ${selected} 8문항</span><select id="choiceSelect"><option ${selected==='확률과 통계'?'selected':''}>확률과 통계</option><option ${selected==='미적분'?'selected':''}>미적분</option><option ${selected==='기하'?'selected':''}>기하</option></select></div>`:''}
      <div class="problem-wrap"><img class="problem-img" src="./${q.path}" alt="${esc(examLabel(q.exam))} ${esc(q.subject)} ${q.question}번 문제"></div>
      <div class="answer-box"><div class="q-meta">${q.score}점 · ${q.answer&&/^[①②③④⑤]$/.test(q.answer)?'5지선다형':'단답형'}</div><div style="height:10px"></div>
        ${/^[①②③④⑤]$/.test(q.answer)?`<div class="choices">${['①','②','③','④','⑤'].map(c=>`<button class="btn choice" data-choice="${c}">${c}</button>`).join('')}</div>`:`<div class="num-answer"><input id="numericAnswer" inputmode="numeric" placeholder="답 입력"><button class="btn primary" id="submitNum">제출</button></div>`}
        <div id="result"></div>
      </div>
      <div id="solutionArea"></div>
      <div class="nav-row"><button class="btn" id="prev" ${idx===0?'disabled':''}>← 이전</button><span class="q-meta">${idx+1} / ${qs.length}</span><button class="btn" id="next" ${idx===qs.length-1?'disabled':''}>다음 →</button></div>
    </section>`;
    document.getElementById('backExam').onclick=()=>go('exams');
    document.querySelectorAll('[data-subject]').forEach(b=>b.onclick=()=>{state.subject=b.dataset.subject;state.index=0;render()});
    document.getElementById('choiceSelect')?.addEventListener('change',e=>{state.selectedChoice=e.target.value;state.index=22;render()});
    const submit=value=>{
      const correct=String(value).trim()===String(q.answer).trim(); const h=history().filter(x=>x.key!==key);h.push({key,exam:q.exam,subject:q.subject,question:q.question,correct,at:Date.now()});setStore(KEYS.history,h);
      let w=wrong().filter(x=>x!==key);if(!correct)w.push(key);setStore(KEYS.wrong,w);showResult(correct,q,sol);
    };
    document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-choice]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');submit(b.dataset.choice)});
    document.getElementById('submitNum')?.addEventListener('click',()=>submit(document.getElementById('numericAnswer').value));
    document.getElementById('numericAnswer')?.addEventListener('keydown',e=>{if(e.key==='Enter')submit(e.target.value)});
    document.getElementById('prev').onclick=()=>{state.index--;render()};document.getElementById('next').onclick=()=>{state.index++;render()};
    if(isWrong) toast('오답노트에 저장된 문제입니다.');
  }
  function showResult(correct,q,sol,existing=false){
    const r=document.getElementById('result');r.className=`result ${correct?'correct':'wrong'}`;r.innerHTML=correct?`<b>정답입니다.</b> 답: ${esc(q.answer)}`:`<b>오답입니다.</b> 정답: ${esc(q.answer)}`;
    const area=document.getElementById('solutionArea');area.innerHTML=`<div class="solution"><h3>해설</h3><img src="./${sol.path}" alt="${esc(q.question)}번 해설"></div>`;
  }
  function bank(){
    const params=new URLSearchParams(location.hash.split('?')[1]||'');
    const exam=params.get('exam')||'all', subject=params.get('subject')||'all', score=params.get('score')||'all', query=params.get('q')||'';
    let qs=state.questions.filter(q=>(exam==='all'||q.exam===exam)&&(subject==='all'||q.subject===subject)&&(score==='all'||String(q.score)===score)&&(`${q.question}`.includes(query)||examLabel(q.exam).includes(query)));
    app.innerHTML=`<h2 class="section-title">문제은행</h2><div class="toolbar"><input id="search" value="${esc(query)}" placeholder="시험명 또는 문항번호"><select id="examFilter"><option value="all">모든 시험</option>${state.exams.map(e=>`<option value="${e.id}" ${exam===e.id?'selected':''}>${e.title}</option>`).join('')}</select><select id="subjectFilter"><option value="all">모든 과목</option>${['공통','확률과 통계','미적분','기하'].map(s=>`<option ${subject===s?'selected':''}>${s}</option>`).join('')}</select><select id="scoreFilter"><option value="all">모든 배점</option><option value="2" ${score==='2'?'selected':''}>2점</option><option value="3" ${score==='3'?'selected':''}>3점</option><option value="4" ${score==='4'?'selected':''}>4점</option></select></div><div class="q-meta" style="margin-bottom:12px">${qs.length}문항</div><div class="bank-list">${qs.map(q=>`<article class="q-card clickable" data-qkey="${esc(qkey(q))}"><div class="q-head"><span class="q-num">${q.question}번</span><span class="q-meta">${q.score}점</span></div><div class="q-meta">${examLabel(q.exam)} · ${q.subject}</div></article>`).join('')||'<div class="empty">조건에 맞는 문제가 없습니다.</div>'}</div>`;
    const apply=()=>{const qs2=new URLSearchParams({exam:document.getElementById('examFilter').value,subject:document.getElementById('subjectFilter').value,score:document.getElementById('scoreFilter').value,q:document.getElementById('search').value});location.hash='bank?'+qs2.toString();render()};
    ['examFilter','subjectFilter','scoreFilter'].forEach(id=>document.getElementById(id).onchange=apply);document.getElementById('search').onkeydown=e=>{if(e.key==='Enter')apply()};
    document.querySelectorAll('[data-qkey]').forEach(el=>el.onclick=()=>{const [ex,s,q]=el.dataset.qkey.split('|');state.exam=ex;state.subject=s;state.index=state.questions.filter(x=>x.exam===ex&&x.subject===s).sort((a,b)=>a.question-b.question).findIndex(x=>x.question===Number(q));go('exam')});
  }
  function wrongPage(){
    const keys=wrong();const qs=keys.map(k=>state.questions.find(q=>qkey(q)===k)).filter(Boolean);
    app.innerHTML=`<h2 class="section-title">오답노트</h2><div class="notice">틀린 문제는 브라우저에만 저장됩니다. 다른 기기와 동기화되지는 않습니다.</div>${qs.length?`<div class="grid">${qs.map(q=>`<article class="card wrong-row"><div><b>${examLabel(q.exam)} · ${q.subject} ${q.question}번</b><div class="q-meta">${q.score}점</div></div><button class="btn" data-wrong="${esc(qkey(q))}">다시 풀기</button></article>`).join('')}</div>`:'<div class="empty">현재 오답노트가 비어 있습니다.</div>'}`;
    document.querySelectorAll('[data-wrong]').forEach(b=>b.onclick=()=>{const [ex,s,q]=b.dataset.wrong.split('|');state.exam=ex;state.subject=s;state.index=state.questions.filter(x=>x.exam===ex&&x.subject===s).sort((a,b)=>a.question-b.question).findIndex(x=>x.question===Number(q));go('exam')});
  }
  function stats(){
    const h=history();const total=h.length, correct=h.filter(x=>x.correct).length, rate=total?Math.round(correct/total*100):0;
    app.innerHTML=`<h2 class="section-title">풀이기록</h2><div class="stats"><div class="stat">풀이 수<b>${total}</b></div><div class="stat">정답 수<b>${correct}</b></div><div class="stat">정답률<b>${rate}%</b></div><div class="stat">오답노트<b>${wrong().length}</b></div></div><div class="card" style="margin-top:14px"><h3>시험별 기록</h3>${state.exams.map(e=>{const a=h.filter(x=>x.exam===e.id);const c=a.filter(x=>x.correct).length;const p=a.length?Math.round(c/a.length*100):0;return `<div style="margin:15px 0"><div style="display:flex;justify-content:space-between"><span>${e.title}</span><span>${a.length}회 · ${p}%</span></div><div class="progress"><span style="width:${p}%"></span></div></div>`}).join('')}</div>`;
  }
  function render(){document.querySelectorAll('.topbar nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));if(state.page==='home')home();else if(state.page==='exams')exams();else if(state.page==='exam')examPage();else if(state.page==='bank')bank();else if(state.page==='wrong')wrongPage();else if(state.page==='stats')stats()}
  async function init(){
    try{
      const [q,s]=await Promise.all([fetch('./data/questions.json').then(r=>{if(!r.ok)throw Error('questions.json '+r.status);return r.json()}),fetch('./data/solutions.json').then(r=>{if(!r.ok)throw Error('solutions.json '+r.status);return r.json()})]);
      state.questions=q;state.solutions=s;state.exams=makeExams();const hash=location.hash.replace(/^#/,'');state.page=hash.startsWith('bank')?'bank':hash==='exams'?'exams':hash==='wrong'?'wrong':hash==='stats'?'stats':'home';render();
    }catch(err){console.error(err);app.innerHTML=`<div class="empty"><h2>문제 데이터를 불러오지 못했습니다.</h2><p>${esc(err.message)}</p><p class="muted">GitHub Pages에서는 index.html과 data 폴더가 같은 저장소 루트에 있어야 합니다.</p></div>`}
  }
  window.addEventListener('hashchange',()=>{const h=location.hash.replace(/^#/,'');state.page=h.startsWith('bank')?'bank':h==='exams'?'exams':h==='wrong'?'wrong':h==='stats'?'stats':h==='exam'?'exam':'home';render()});
  document.addEventListener('click',e=>{if(e.target.closest('.brand')){state.page='home';state.exam=null;state.index=0}});
  init();
})();
