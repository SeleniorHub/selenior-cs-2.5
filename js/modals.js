// CRUD via modais: clientes, reuniões, metas, objetivos e action items.

// ── MODAL CLIENTE ──
function openClientModal(id=null){
  editingClientId=id;
  const cl=id?clients.find(c=>c.id===id):null;
  document.getElementById('mc-title').textContent=id?'Editar cliente':'Novo cliente';
  document.getElementById('mc-nome').value=cl?cl.nome:'';
  document.getElementById('mc-nicho').value=cl?cl.nicho:'';
  document.getElementById('mc-fase').value=cl?cl.fase:'Onboarding';
  document.getElementById('mc-churn').value=cl?cl.churn:'baixo';
  document.getElementById('mc-data-inicio').value=cl?cl.dataInicio:'';
  document.getElementById('mc-mrr').value=cl?cl.mrr:'';
  document.getElementById('mc-custo').value=cl?cl.custo||'':'';
  document.getElementById('mc-indicador').value=cl?cl.indicador:'';
  document.getElementById('mc-comissao-val').value=cl?cl.comissaoVal:'';
  document.getElementById('mc-comissao-tipo').value=cl?cl.comissaoTipo:'pct';
  populateCpEditor(cl?cl.checkpoints||[]:[], cl?cl.done||[]:[]);
  document.getElementById('mc-nota').value=cl?cl.nota:'';
  document.getElementById('mc-depo').value=cl?cl.depoimento:'';
  document.getElementById('mc-status').value=cl?cl.status||'ativo':'ativo';
  document.getElementById('mc-data-fim').value=cl?cl.dataFim||'':'';
  toggleDataFim(document.getElementById('mc-status').value);
  document.getElementById('modal-client').classList.add('open');
}
function closeClientModal(){document.getElementById('modal-client').classList.remove('open');}
function toggleDataFim(status){document.getElementById('mc-data-fim-group').style.display=status==='churned'?'block':'none';}

function populateCpEditor(checkpoints,done){
  const doneNorm=(done||[]).map(s=>s.trim().toLowerCase());
  document.getElementById('mc-cp-list').innerHTML=(checkpoints||[]).map(cp=>{
    const isDone=doneNorm.includes(cp.trim().toLowerCase());
    const safe=cp.replace(/"/g,'&quot;');
    return`<div class="cp-editor-item${isDone?' cp-editor-item-done':''}" data-cptext="${safe}"><span class="cp-editor-status">${isDone?'✓':'○'}</span><span class="cp-editor-text">${cp}</span><button type="button" class="cp-editor-rm" onclick="this.closest('.cp-editor-item').remove()" title="Remover">✕</button></div>`;
  }).join('');
  document.getElementById('mc-cp-input').value='';
}

function addCheckpointItem(){
  const input=document.getElementById('mc-cp-input');
  const text=input.value.trim();if(!text)return;
  const item=document.createElement('div');
  item.className='cp-editor-item';item.dataset.cptext=text;
  item.innerHTML=`<span class="cp-editor-status">○</span><span class="cp-editor-text">${text}</span><button type="button" class="cp-editor-rm" onclick="this.closest('.cp-editor-item').remove()" title="Remover">✕</button>`;
  document.getElementById('mc-cp-list').appendChild(item);
  input.value='';input.focus();
}

async function saveClient(){
  const nome=document.getElementById('mc-nome').value.trim();
  if(!nome){showToast('Preencha o nome.',true);return;}
  const newCps=[...document.querySelectorAll('#mc-cp-list .cp-editor-item')].map(el=>el.dataset.cptext).filter(Boolean);
  const existingDone=editingClientId?(clients.find(c=>c.id===editingClientId)?.done||[]):[];
  const newDone=existingDone.filter(d=>newCps.some(cp=>cp.trim().toLowerCase()===d.trim().toLowerCase()));
  const cl={id:editingClientId||String(Date.now()),nome,nicho:document.getElementById('mc-nicho').value.trim(),fase:document.getElementById('mc-fase').value,churn:document.getElementById('mc-churn').value,dataInicio:document.getElementById('mc-data-inicio').value,mrr:document.getElementById('mc-mrr').value.trim(),custo:document.getElementById('mc-custo').value.trim(),indicador:document.getElementById('mc-indicador').value.trim(),comissaoVal:document.getElementById('mc-comissao-val').value.trim(),comissaoTipo:document.getElementById('mc-comissao-tipo').value,checkpoints:newCps,done:newDone,nota:document.getElementById('mc-nota').value.trim(),depoimento:document.getElementById('mc-depo').value.trim(),status:document.getElementById('mc-status').value,dataFim:document.getElementById('mc-data-fim').value};
  if(editingClientId){const i=clients.findIndex(c=>c.id===editingClientId);if(i>=0)clients[i]=cl;else clients.push(cl);}else clients.push(cl);
  closeClientModal();renderAll();if(currentClientId===editingClientId)renderClientView(editingClientId);
  setSyncStatus('syncing','Salvando...');
  try{await upsertRow('Clientes',clientToRow(cl));setSyncStatus('ok','Salvo');showToast('Salvo com sucesso.');setTimeout(loadData,1500);}
  catch(e){setSyncStatus('error','Erro');showToast('Erro ao salvar',true);}
}

async function deleteClient(id){
  if(!confirm('Remover este cliente?'))return;
  clients=clients.filter(c=>c.id!==id);goBack();renderAll();
  try{await deleteRow('Clientes',id);showToast('Removido.');}catch(e){showToast('Erro ao remover',true);}
}

// ── MODAL REUNIÃO ──
function populatePontosEditor(pontos){
  document.getElementById('mr-pontos-list').innerHTML=(pontos||[]).map(p=>{
    const safe=p.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return`<div class="cp-editor-item" data-ponto="${safe}"><span class="cp-editor-status">•</span><span class="cp-editor-text">${p}</span><button type="button" class="cp-editor-rm" onclick="this.closest('.cp-editor-item').remove()" title="Remover">✕</button></div>`;
  }).join('');
  const inp=document.getElementById('mr-pontos-input');if(inp)inp.value='';
}
function addPontoItem(){
  const input=document.getElementById('mr-pontos-input');
  const text=input.value.trim();if(!text)return;
  const item=document.createElement('div');
  item.className='cp-editor-item';item.dataset.ponto=text;
  item.innerHTML=`<span class="cp-editor-status">•</span><span class="cp-editor-text">${text}</span><button type="button" class="cp-editor-rm" onclick="this.closest('.cp-editor-item').remove()" title="Remover">✕</button>`;
  document.getElementById('mr-pontos-list').appendChild(item);
  input.value='';input.focus();
}

function openReuniaoModal(clienteId=null){
  editingReuniaoId=null;
  document.getElementById('mr-titulo').value='';document.getElementById('mr-data').value=new Date().toISOString().split('T')[0];
  document.getElementById('mr-duracao').value='';document.getElementById('mr-participantes').value='';
  document.getElementById('mr-resumo').value='';populatePontosEditor([]);
  document.getElementById('mr-title').textContent='Nova reunião';
  document.getElementById('mr-title').dataset.clienteId=clienteId||'';
  const grp=document.getElementById('mr-cliente-group');
  if(clienteId){
    grp.style.display='none';
  }else{
    grp.style.display='block';
    const sel=document.getElementById('mr-cliente-sel');
    const ativos=clients.filter(c=>(c.status||'ativo')==='ativo').sort((a,b)=>a.nome.localeCompare(b.nome));
    sel.innerHTML=ativos.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  }
  document.getElementById('modal-reuniao').classList.add('open');
}
function openReuniaoModalGlobal(){openReuniaoModal(null);}
function openReuniaoModalEdit(id){
  const r=reunioes.find(x=>x.id===id);if(!r)return;
  editingReuniaoId=id;
  document.getElementById('mr-titulo').value=r.titulo;
  document.getElementById('mr-data').value=r.data;
  document.getElementById('mr-duracao').value=r.duracao||'';
  document.getElementById('mr-participantes').value=r.participantes||'';
  document.getElementById('mr-resumo').value=r.resumo||'';
  populatePontosEditor(r.pontos||[]);
  document.getElementById('mr-title').textContent='Editar reunião';
  document.getElementById('mr-title').dataset.clienteId=r.clienteId;
  document.getElementById('mr-cliente-group').style.display='none';
  document.getElementById('modal-reuniao').classList.add('open');
}
function closeReuniaoModal(){editingReuniaoId=null;document.getElementById('modal-reuniao').classList.remove('open');}

async function saveReuniao(){
  const titulo=document.getElementById('mr-titulo').value.trim();if(!titulo){showToast('Preencha o título.',true);return;}
  let clienteId=document.getElementById('mr-title').dataset.clienteId;
  if(!clienteId) clienteId=document.getElementById('mr-cliente-sel').value;
  if(!clienteId){showToast('Selecione um cliente.',true);return;}
  const r={id:editingReuniaoId||String(Date.now()),clienteId,data:document.getElementById('mr-data').value,titulo,duracao:document.getElementById('mr-duracao').value.trim(),participantes:document.getElementById('mr-participantes').value.trim(),resumo:document.getElementById('mr-resumo').value.trim(),pontos:[...document.querySelectorAll('#mr-pontos-list .cp-editor-item')].map(el=>el.dataset.ponto).filter(Boolean),actionItemIds:''};
  if(editingReuniaoId){const i=reunioes.findIndex(x=>x.id===editingReuniaoId);if(i>=0)reunioes[i]=r;else reunioes.push(r);}else reunioes.push(r);
  closeReuniaoModal();
  if(currentClientId) renderClientView(currentClientId);else renderAll();
  try{await upsertRow('Reunioes',reuniaoToRow(r));showToast('Reunião salva.');setTimeout(loadData,1500);}catch(e){showToast('Erro ao salvar',true);}
}

// ── MODAL META ──
function openMetaModal(clienteId){
  editingMetaId=null;
  document.getElementById('mm-titulo').value='';document.getElementById('mm-mes').value='';
  document.getElementById('mm-status').value='Não iniciado';document.getElementById('mm-progresso').value=0;
  document.getElementById('mm-total').value=100;document.getElementById('mm-unidade').value='';
  document.getElementById('mm-title').textContent='Nova meta';
  document.getElementById('mm-title').dataset.clienteId=clienteId;
  document.getElementById('modal-meta').classList.add('open');
}
function openMetaModalEdit(id){
  const m=metas.find(x=>x.id===id);if(!m)return;
  editingMetaId=id;
  document.getElementById('mm-titulo').value=m.titulo;
  document.getElementById('mm-mes').value=m.mes||'';
  document.getElementById('mm-status').value=m.status;
  document.getElementById('mm-progresso').value=m.progresso;
  document.getElementById('mm-total').value=m.total;
  document.getElementById('mm-unidade').value=m.unidade||'';
  document.getElementById('mm-title').textContent='Editar meta';
  document.getElementById('mm-title').dataset.clienteId=m.clienteId;
  document.getElementById('modal-meta').classList.add('open');
}
function closeMetaModal(){editingMetaId=null;document.getElementById('modal-meta').classList.remove('open');}

async function saveMeta(){
  const titulo=document.getElementById('mm-titulo').value.trim();if(!titulo){showToast('Preencha o título.',true);return;}
  const clienteId=document.getElementById('mm-title').dataset.clienteId;
  const m={id:editingMetaId||String(Date.now()),clienteId,mes:document.getElementById('mm-mes').value.trim(),titulo,status:document.getElementById('mm-status').value,progresso:parseFloat(document.getElementById('mm-progresso').value)||0,total:parseFloat(document.getElementById('mm-total').value)||100,unidade:document.getElementById('mm-unidade').value.trim()};
  if(editingMetaId){const i=metas.findIndex(x=>x.id===editingMetaId);if(i>=0)metas[i]=m;else metas.push(m);}else metas.push(m);
  closeMetaModal();renderClientView(clienteId);
  try{await upsertRow('Metas',metaToRow(m));showToast('Meta salva.');setTimeout(loadData,1500);}catch(e){showToast('Erro ao salvar',true);}
}

async function deleteMeta(id){
  const m=metas.find(x=>x.id===id);if(!m)return;
  metas=metas.filter(x=>x.id!==id);renderClientView(m.clienteId);
  try{await deleteRow('Metas',id);showToast('Meta removida.');}catch(e){showToast('Erro',true);}
}

// ── MODAL OBJETIVO ──
function openObjModal(clienteId){
  editingObjId=null;
  document.getElementById('obj-modal-title').textContent='Novo objetivo';
  document.getElementById('mo-texto').value='';document.getElementById('mo-icone').value='';
  document.getElementById('modal-obj').dataset.clienteId=clienteId;
  document.getElementById('modal-obj').classList.add('open');
}
function openObjModalEdit(id){
  const o=objetivos.find(x=>x.id===id);if(!o)return;
  editingObjId=id;
  document.getElementById('obj-modal-title').textContent='Editar objetivo';
  document.getElementById('mo-texto').value=o.texto;
  document.getElementById('mo-icone').value=o.icone||'';
  document.getElementById('modal-obj').dataset.clienteId=o.clienteId;
  document.getElementById('modal-obj').classList.add('open');
}
function closeObjModal(){editingObjId=null;document.getElementById('modal-obj').classList.remove('open');}

async function saveObj(){
  const texto=document.getElementById('mo-texto').value.trim();if(!texto){showToast('Preencha a descrição.',true);return;}
  const clienteId=document.getElementById('modal-obj').dataset.clienteId;
  const o={id:editingObjId||String(Date.now()),clienteId,texto,icone:document.getElementById('mo-icone').value.trim()};
  if(editingObjId){const i=objetivos.findIndex(x=>x.id===editingObjId);if(i>=0)objetivos[i]=o;else objetivos.push(o);}
  else objetivos.push(o);
  closeObjModal();renderClientView(clienteId);
  try{await upsertRow('Objetivos',objToRow(o));showToast(editingObjId?'Objetivo atualizado.':'Objetivo salvo.');setTimeout(loadData,1500);}catch(e){showToast('Erro ao salvar',true);}
}

async function deleteObj(id){
  const o=objetivos.find(x=>x.id===id);if(!o)return;
  objetivos=objetivos.filter(x=>x.id!==id);renderClientView(o.clienteId);
  try{await deleteRow('Objetivos',id);showToast('Removido.');}catch(e){showToast('Erro',true);}
}

// ── MODAL ACTION ITEM ──
function openAIModal(clienteId){
  editingAIId=null;
  document.getElementById('ai-modal-title').textContent='Novo action item';
  document.getElementById('ai-texto').value='';document.getElementById('ai-resp').value='Leo';
  document.getElementById('ai-data-prazo').value='';
  const cl=clients.find(c=>c.id===clienteId);
  const clienteOpt=document.querySelector('#ai-resp option[value="Cliente"]');
  if(clienteOpt) clienteOpt.textContent=cl?cl.nome:'Cliente';
  const sel=document.getElementById('ai-reuniao');
  sel.innerHTML='<option value="">Nenhuma</option>';
  reunioes.filter(r=>r.clienteId===clienteId).forEach(r=>{sel.innerHTML+=`<option value="${r.id}">${r.titulo} (${new Date(r.data).toLocaleDateString('pt-BR')})</option>`;});
  document.getElementById('modal-ai').dataset.clienteId=clienteId;
  document.getElementById('modal-ai').classList.add('open');
}
function openAIModalEdit(id){
  const a=actionItems.find(x=>x.id===id);if(!a)return;
  editingAIId=id;
  document.getElementById('ai-modal-title').textContent='Editar action item';
  document.getElementById('ai-texto').value=a.texto;
  document.getElementById('ai-resp').value=a.responsavel||'Leo';
  document.getElementById('ai-data-prazo').value=a.dataPrazo||'';
  const cl=clients.find(c=>c.id===a.clienteId);
  const clienteOpt=document.querySelector('#ai-resp option[value="Cliente"]');
  if(clienteOpt) clienteOpt.textContent=cl?cl.nome:'Cliente';
  const sel=document.getElementById('ai-reuniao');
  sel.innerHTML='<option value="">Nenhuma</option>';
  reunioes.filter(r=>r.clienteId===a.clienteId).forEach(r=>{sel.innerHTML+=`<option value="${r.id}"${r.id===a.reuniaoId?' selected':''}>${r.titulo} (${new Date(r.data).toLocaleDateString('pt-BR')})</option>`;});
  document.getElementById('modal-ai').dataset.clienteId=a.clienteId;
  document.getElementById('modal-ai').classList.add('open');
}
function closeAIModal(){editingAIId=null;document.getElementById('modal-ai').classList.remove('open');}

async function saveAI(){
  const texto=document.getElementById('ai-texto').value.trim();if(!texto){showToast('Preencha a descrição.',true);return;}
  const clienteId=document.getElementById('modal-ai').dataset.clienteId;
  const existing=editingAIId?actionItems.find(x=>x.id===editingAIId):null;
  const a={id:editingAIId||String(Date.now()),clienteId,reuniaoId:document.getElementById('ai-reuniao').value||'',texto,responsavel:document.getElementById('ai-resp').value,prazo:'',dataPrazo:document.getElementById('ai-data-prazo').value,concluido:existing?existing.concluido:false};
  if(editingAIId){const i=actionItems.findIndex(x=>x.id===editingAIId);if(i>=0)actionItems[i]=a;else actionItems.push(a);}
  else actionItems.push(a);
  closeAIModal();
  if(currentClientId)renderClientView(currentClientId);else renderAll();
  try{await upsertRow('ActionItems',aiToRow(a));showToast(editingAIId?'Atualizado.':'Action item salvo.');setTimeout(loadData,1500);}catch(e){showToast('Erro ao salvar',true);}
}

async function toggleAI(id){
  const a=actionItems.find(x=>x.id===id);if(!a)return;
  a.concluido=!a.concluido;renderClientView(a.clienteId);
  try{await upsertRow('ActionItems',aiToRow(a));showToast(a.concluido?'Concluído!':'Reaberto.');}catch(e){showToast('Erro',true);}
}

async function deleteAI(id){
  const a=actionItems.find(x=>x.id===id);if(!a)return;
  actionItems=actionItems.filter(x=>x.id!==id);renderClientView(a.clienteId);
  try{await deleteRow('ActionItems',id);showToast('Removido.');}catch(e){showToast('Erro',true);}
}

// ── MODAL DOCUMENTO ──
function openDocModal(clienteId){
  document.getElementById('md-tipo').value='briefing';
  document.getElementById('md-nome').value='';
  document.getElementById('md-file').value='';
  document.getElementById('modal-doc').dataset.clienteId=clienteId;
  document.getElementById('modal-doc').classList.add('open');
}
function closeDocModal(){document.getElementById('modal-doc').classList.remove('open');}

// Auto-preenche o nome com o filename quando o arquivo é selecionado.
document.addEventListener('change',e=>{
  if(e.target&&e.target.id==='md-file'&&e.target.files[0]){
    const nomeInput=document.getElementById('md-nome');
    if(!nomeInput.value.trim()) nomeInput.value=e.target.files[0].name;
  }
});

async function saveDoc(){
  const fileInput=document.getElementById('md-file');
  const file=fileInput.files[0];
  if(!file){showToast('Selecione um arquivo.',true);return;}
  const clienteId=document.getElementById('modal-doc').dataset.clienteId;
  const tipo=document.getElementById('md-tipo').value;
  const nome=document.getElementById('md-nome').value.trim()||file.name;
  const btn=document.getElementById('md-save-btn');
  btn.disabled=true;btn.textContent='Enviando...';
  setSyncStatus('syncing','Enviando '+nome+'...');
  try{
    const base64=await readFileAsBase64(file);
    await apiPost_({action:'uploadDoc',clienteId,tipo,nome,mimeType:file.type||'application/octet-stream',base64});
    closeDocModal();
    showToast('Documento salvo.');
    await loadData();
  }catch(e){
    showToast('Erro ao enviar: '+(e.message||''),true);
    setSyncStatus('error','Erro');
  }finally{
    btn.disabled=false;btn.textContent='Upload';
  }
}

async function deleteDoc(id){
  if(!confirm('Remover este documento? O arquivo no Drive vai pra lixeira.'))return;
  const d=documentos.find(x=>x.id===id);if(!d)return;
  documentos=documentos.filter(x=>x.id!==id);renderClientView(d.clienteId);
  try{await apiPost_({action:'deleteDoc',id});showToast('Removido.');}catch(e){showToast('Erro ao remover',true);}
}

// ── MODAL HISTÓRICO MRR ──
function openHistMRRModal(clienteId,existingId=null){
  const existing=existingId?historicoMRR.find(h=>h.id===existingId):null;
  editingHistMRRId=existingId||null;
  editingHistMRRClienteId=clienteId;
  document.getElementById('hm-title').textContent=existing?'Editar registro':'Novo registro de MRR';
  document.getElementById('hm-mes').value=existing?existing.mes:new Date().toISOString().substring(0,7);
  document.getElementById('hm-mrr').value=existing?existing.mrr:'';
  document.getElementById('modal-hist-mrr').classList.add('open');
}
function closeHistMRRModal(){editingHistMRRId=null;editingHistMRRClienteId=null;document.getElementById('modal-hist-mrr').classList.remove('open');}

async function saveHistMRR(){
  const mes=document.getElementById('hm-mes').value.trim();
  const mrr=parseFloat(document.getElementById('hm-mrr').value)||0;
  if(!mes||!mrr){showToast('Preencha mês e valor.',true);return;}
  const h={id:editingHistMRRId||String(Date.now()),clienteId:editingHistMRRClienteId,mes,mrr};
  if(editingHistMRRId){const i=historicoMRR.findIndex(x=>x.id===editingHistMRRId);if(i>=0)historicoMRR[i]=h;else historicoMRR.push(h);}
  else historicoMRR.push(h);
  closeHistMRRModal();
  const cl=clients.find(c=>c.id===h.clienteId);
  if(currentClientId===h.clienteId&&cl)renderMRRHistory(cl);
  if(typeof renderDashboard==='function')renderDashboard();
  setSyncStatus('syncing','Salvando...');
  try{await upsertRow('HistoricoMRR',histMRRToRow(h));setSyncStatus('ok','Salvo');showToast('Registro salvo.');}
  catch(e){setSyncStatus('error','Erro');showToast('Erro ao salvar',true);}
}

async function deleteHistMRR(id){
  const h=historicoMRR.find(x=>x.id===id);if(!h)return;
  historicoMRR=historicoMRR.filter(x=>x.id!==id);
  const cl=clients.find(c=>c.id===h.clienteId);
  if(currentClientId===h.clienteId&&cl)renderMRRHistory(cl);
  if(typeof renderDashboard==='function')renderDashboard();
  try{await deleteRow('HistoricoMRR',id);showToast('Removido.');}catch(e){showToast('Erro ao remover',true);}
}
