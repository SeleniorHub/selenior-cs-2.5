// Autenticação, sessão e bootstrap da aplicação.

async function tryLogin(){
  const pwd=document.getElementById('pwd-input').value;
  if(!pwd) return;
  const btn=document.getElementById('login-btn');
  btn.disabled=true;btn.textContent='Verificando...';
  try{
    const hash=await sha256(pwd);
    const res=await fetch(SCRIPT_URL+'?auth='+hash);
    const json=await res.json();
    if(!json.ok||!json.role) throw new Error('unauthorized');
    authHash=hash;mode=json.role;saveSession();
    enterApp(json.data);
  }catch(e){
    const er=document.getElementById('login-error');
    er.style.display='block';setTimeout(()=>er.style.display='none',2500);
  }finally{
    btn.disabled=false;btn.textContent='Entrar';
  }
}

function saveSession(){
  localStorage.setItem(SESSION_KEY,JSON.stringify({mode,authHash,expires:Date.now()+SESSION_TTL}));
}

function loadSession(){
  try{
    const s=JSON.parse(localStorage.getItem(SESSION_KEY));
    if(s&&s.mode&&s.authHash&&s.expires>Date.now()){
      mode=s.mode;authHash=s.authHash;return true;
    }
  }catch(e){}
  return false;
}

function enterApp(initialData){
  document.getElementById('login-screen').style.display='none';
  const app=document.getElementById('app');
  app.style.display='flex';
  app.classList.add('open');
  const badge=document.getElementById('mode-badge');
  badge.textContent=mode==='admin'?'Admin':'Visualização';
  badge.className='mode-badge '+(mode==='admin'?'mode-admin':'mode-view');
  const isAdmin=mode==='admin';
  document.getElementById('add-btn-top').style.display='none';
  document.getElementById('add-row-btn').style.display=isAdmin?'flex':'none';
  document.getElementById('topbar-context').textContent='Panorama';
  if(initialData){applyData(initialData);setSyncStatus('ok','Atualizado às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}));}
  else loadData();
  if(mode==='viewer')setInterval(loadData,60000);
}

function logout(){
  mode=null;authHash=null;
  localStorage.removeItem(SESSION_KEY);
  const app=document.getElementById('app');
  app.style.display='none';
  app.classList.remove('open');
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('pwd-input').value='';
}

function handleUnauthorized(){
  showToast('Sessão expirada. Faça login novamente.',true);
  logout();
}

// Bootstrap
document.getElementById('pwd-input').addEventListener('keydown',e=>{if(e.key==='Enter')tryLogin();});
window.addEventListener('load',()=>{
  const vEl=document.getElementById('app-version');
  if(vEl) vEl.textContent='v'+VERSION;
  if(loadSession())enterApp();
});
