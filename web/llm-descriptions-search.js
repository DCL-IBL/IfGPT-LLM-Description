/* IfGPT – LLM descriptions search (version 2026-10-31). Loads data from the files in the same repository folder. */
(function(){
/* Data files: the default is the GitHub repository; change to other URLs if the files are hosted elsewhere */
const DATA = {
  models: 'https://raw.githubusercontent.com/DCL-IBL/IfGPT-LLM-Description/main/LLMDescription-2026-10-31/web/llm_descriptions_linked.json',
  terms:  'https://raw.githubusercontent.com/DCL-IBL/IfGPT-LLM-Description/main/LLMDescription-2026-10-31/web/dictionary_terms.json',
  links:  'https://raw.githubusercontent.com/DCL-IBL/IfGPT-LLM-Description/main/LLMDescription-2026-10-31/web/llm_term_links.json'
};
window.IfGPT={selAll:function(n){document.querySelectorAll('input[name="'+n+'"]:not(:disabled)').forEach(function(c){c.checked=true;});},clrAll:function(n){document.querySelectorAll('input[name="'+n+'"]').forEach(function(c){c.checked=false;});}};
const PAGE_SIZE = 15;
let MODELS = [], RESULTS = [], currentPage = 1, loaded = false;
const TERMS = {}, TERM_MODELS = {}, BY_NAME = {};
const TERM_RE = /\[\[t:([\d.]+)\|([^\]]+)\]\]/g;
const STATUS = {'потвърден':['засвидетелстван','st-att'],'проверен':['проверен от експерт','st-ver'],'*':['непроверен','st-unv']};

function el(id){ return document.getElementById(id); }
function vals(name){ return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(c=>c.value); }
function msg(t){ el('results-list').innerHTML = '<div class="state-msg">' + t + '</div>'; }

async function load(){
  try {
    const [m, t, l] = await Promise.all([DATA.models, DATA.terms, DATA.links].map(u => fetch(u).then(r => { if(!r.ok) throw new Error(u + ' (' + r.status + ')'); return r.json(); })));
    MODELS = m.models;
    MODELS.forEach(x => { BY_NAME[x.name] = x; });
    t.terms.forEach(x => { TERMS[x.id] = x; });
    Object.assign(TERM_MODELS, l.term_models);
    loaded = true;
    loadLists();
  } catch(e){
    el('fam-list').innerHTML = '<div class="checkbox-item" style="color:#a32020">Грешка при зареждане на данните: ' + e.message + '</div>';
  }
}

/* ── dictionary ── */
function termTitle(t){ return t ? (t.en_term + (t.en_abbreviation ? ' (' + t.en_abbreviation + ')' : '')) : ''; }
function statusBadge(st){ const v = STATUS[st] || STATUS['*']; const b = document.createElement('span'); b.className = 'st-badge ' + v[1]; b.textContent = v[0]; return b; }
function openTerm(id){
  const t = TERMS[id]; if(!t) return;
  const box = el('term-content'); box.innerHTML = '';
  const h = document.createElement('h2'); h.textContent = t.bg_term || ''; h.appendChild(statusBadge(t.bg_status)); box.appendChild(h);
  const en = document.createElement('div'); en.className = 'term-en'; en.textContent = termTitle(t) + (t.domain ? ' · ' + t.domain : ''); box.appendChild(en);
  function row(label, value, isLink){
    if(!value) return;
    const d = document.createElement('div'); d.className = 'term-row';
    const l = document.createElement('div'); l.className = 'term-label'; l.textContent = label;
    const v = document.createElement('div');
    if(isLink){ const a = document.createElement('a'); a.href = value; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = value; a.style.wordBreak = 'break-all'; v.appendChild(a); }
    else v.textContent = value;
    d.append(l, v); box.appendChild(d);
  }
  row('Определение', t.bg_definition);
  row('Definition', t.en_definition);
  row('Варианти', t.bg_variants);
  row('Източници, в които е засвидетелстван', t.bg_sources);
  row('Връзка към източник на български', t.bg_url, true);
  row('Връзка към източник на английски', t.en_url, true);
  const md = document.createElement('div'); md.className = 'term-row term-models';
  const lab = document.createElement('div'); lab.className = 'term-label'; lab.textContent = 'Модели, в чиито описания се използва';
  const list = document.createElement('div');
  const names = (TERM_MODELS[id] || []).filter(n => BY_NAME[n] && (BY_NAME[n].verified === 'VERIFIED' || el('f-unv').checked))
    .sort((a,b) => (BY_NAME[a].family + a).localeCompare(BY_NAME[b].family + b));
  if(!names.length) list.textContent = '—';
  names.forEach((n, i) => {
    const a = document.createElement('a'); a.textContent = n;
    a.onclick = function(){ closeTerm(); el('f-name').value = n; App.search(); };
    list.appendChild(a); if(i < names.length - 1) list.appendChild(document.createTextNode(', '));
  });
  md.append(lab, list); box.appendChild(md);
  el('term-modal').classList.add('open');
}
function closeTerm(){ el('term-modal').classList.remove('open'); }
el('term-close').onclick = closeTerm;
el('term-modal').onclick = function(e){ if(e.target === el('term-modal')) closeTerm(); };
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeTerm(); });

function searchDict(){
  const q = el('dict-q').value.trim().toLowerCase(); const out = el('dict-results'); out.innerHTML = '';
  if(q.length < 2) return;
  const hits = Object.values(TERMS).filter(t => [t.bg_term, t.en_term, t.en_abbreviation, t.bg_variants].some(x => x && String(x).toLowerCase().includes(q))).slice(0, 40);
  if(!hits.length){ out.innerHTML = '<div class="dict-item"><em>Няма намерени термини</em></div>'; return; }
  hits.forEach(t => {
    const d = document.createElement('div'); d.className = 'dict-item';
    const b = document.createElement('strong'); b.textContent = t.bg_term;
    const sm = document.createElement('small'); sm.textContent = ' — ' + termTitle(t);
    d.append(b, sm, statusBadge(t.bg_status)); d.onclick = () => openTerm(t.id); out.appendChild(d);
  });
}
let dictTimer = null;
el('dict-q').addEventListener('input', function(){ clearTimeout(dictTimer); dictTimer = setTimeout(searchDict, 200); });

/* ── filter lists ── */
function classifyLicense(raw){
  if(!raw) return null; const s = raw.toLowerCase();
  if(s.includes('llama')) return 'Llama'; if(s.includes('gemma')) return 'Gemma'; if(s.includes('mistral')) return 'Mistral';
  if(s.includes('deepseek')) return 'DeepSeek'; if(s.includes('qwen') || s.includes('tongyi')) return 'Qwen'; if(s.includes('phi')) return 'Phi';
  if(s.includes('falcon')) return 'Falcon'; if(s.includes('mit')) return 'MIT'; if(s.includes('apache')) return 'Apache 2.0';
  if(s.includes('cc-by') || s.includes('cc by') || s.includes('creative commons')) return 'Creative Commons';
  if(s.includes('openrail')) return 'OpenRAIL';
  if(s.includes('платен') || s.includes('proprietary') || s.includes('комерсиален')) return 'Платен лиценз';
  if(s.includes('свободен') || s.includes('open') || s.includes('permissive')) return 'Свободен лиценз';
  return 'Друг';
}
function loadLists(){
  const fams = [...new Set(MODELS.map(m => m.family).filter(Boolean))].sort((a,b) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b));
  const famList = el('fam-list'); famList.innerHTML = '';
  fams.forEach((fam, i) => {
    const d = document.createElement('div'); d.className = 'checkbox-item';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'fam-' + i; cb.name = 'family'; cb.value = fam;
    const lb = document.createElement('label'); lb.setAttribute('for', 'fam-' + i); lb.textContent = fam === 'Other' ? 'Други' : fam;
    d.append(cb, lb); famList.appendChild(d);
  });
  const groups = {};
  MODELS.forEach(m => { const g = classifyLicense(m.license); if(g){ (groups[g] = groups[g] || new Set()).add(m.license); } });
  const order = ['Свободен лиценз', 'Платен лиценз'];
  const labels = Object.keys(groups).sort((a,b) => { const ai = order.indexOf(a), bi = order.indexOf(b);
    if(ai >= 0 && bi >= 0) return ai - bi; if(ai >= 0) return -1; if(bi >= 0) return 1; if(a === 'Друг') return 1; if(b === 'Друг') return -1; return a.localeCompare(b); });
  const licList = el('lic-list'); licList.innerHTML = '';
  labels.forEach((label, i) => {
    const d = document.createElement('div'); d.className = 'checkbox-item';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'lic-' + i; cb.name = 'license'; cb.value = JSON.stringify([...groups[label]]);
    const lb = document.createElement('label'); lb.setAttribute('for', 'lic-' + i); lb.textContent = label;
    d.append(cb, lb); licList.appendChild(d);
  });
  const sel = el('f-name'); sel.innerHTML = '<option value="">— Всички модели —</option>';
  [...MODELS].sort(cmp).forEach(m => { const o = document.createElement('option'); o.value = o.textContent = m.name; sel.appendChild(o); });
}

/* ── filtering ── */
function cmp(a, b){ return (a.family || '').localeCompare(b.family || '') || (a.name || '').localeCompare(b.name || ''); }
function paramSize(p){
  if(!p) return null; const s = p.replace('~', '').trim(); const v = parseFloat(s);
  if(isNaN(v)) return null;
  if(/T$/.test(s)) return v * 1000; if(/M$/.test(s)) return v / 1000; if(/B$/.test(s)) return v; return null;
}
const SIZE = {'very-small': v => v < 1, 'small': v => v >= 1 && v < 7, 'medium': v => v >= 7 && v < 70, 'large': v => v >= 70 && v < 400, 'very-large': v => v >= 400};
function buildFilter(){
  const families = vals('family'), name = el('f-name').value.trim();
  const lics = [].concat(...vals('license').map(v => JSON.parse(v)));
  const access = vals('access'), chat = vals('chat_access'), api = vals('api_access'), dl = vals('download_access');
  const inMod = vals('modality'), outMod = vals('out_modality'), sizes = vals('size');
  const yf = parseInt(el('f-year-from').value), yt = parseInt(el('f-year-to').value);
  const bg = el('f-bg').checked, bgplus = el('f-bgplus').checked, unv = el('f-unv').checked;
  const LINK = {ollama: 'ollama_link', huggingface: 'huggingface_link', github: 'github_link', url: 'url'};
  return function(m){
    if(families.length && !families.includes(m.family)) return false;
    if(name && m.name !== name) return false;
    if(lics.length && !lics.includes(m.license)) return false;
    if(access.length && !access.some(a => m[LINK[a]])) return false;
    if(chat.length && !chat.includes(m.chat_access)) return false;
    if(api.length && !api.includes(m.api_access)) return false;
    if(dl.length && !dl.includes(m.download_access)) return false;
    if(inMod.length && !inMod.some(x => (m.input_modality_details || []).includes(x))) return false;
    if(outMod.length && !outMod.some(x => (m.output_modality_details || []).includes(x))) return false;
    if(sizes.length){ const v = paramSize(m.parameters); if(v === null || !sizes.some(s => SIZE[s](v))) return false; }
    const year = parseInt((m.published_date || '').slice(0, 4));
    if(!isNaN(yf) && !(year >= yf)) return false;
    if(!isNaN(yt) && !(year <= yt)) return false;
    const ib = m.includes_bulgarian || '';
    if(bgplus && !ib.startsWith('да+')) return false;
    if(bg && !ib.startsWith('да')) return false;
    if(!unv && m.verified !== 'VERIFIED') return false;
    return true;
  };
}

/* ── rendering ── */
function isUnknown(v){ const l = (v || '').toLowerCase(); return !l || l.startsWith('неоповестен') || l.includes('не е оповестен') || l.includes('неизвестно'); }
function formatDate(d){ const m = (d || '').match(/^(\d{4})\.(\d{2})\.(\d{2})$/); if(m) return m[3] + '.' + m[2] + '.' + m[1]; const m2 = (d || '').match(/^(\d{4})\.(\d{2})$/); return m2 ? m2[2] + '.' + m2[1] : d; }
function addText(text, container){
  text.split(/(https?:\/\/[^\s,;)]+)/g).forEach(part => {
    if(/^https?:\/\//.test(part)){ const a = document.createElement('a'); a.href = part; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = part; a.style.wordBreak = 'break-all'; container.appendChild(a); }
    else if(part) container.appendChild(document.createTextNode(part));
  });
}
function renderLinked(text, container, found){
  let last = 0, m; TERM_RE.lastIndex = 0;
  while((m = TERM_RE.exec(text)) !== null){
    addText(text.slice(last, m.index), container);
    const t = TERMS[m[1]];
    if(t){
      const a = document.createElement('a'); a.className = 'term-link'; a.href = '#'; a.textContent = m[2]; a.title = termTitle(t);
      const id = m[1]; a.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openTerm(id); };
      container.appendChild(a); if(found) found.add(id);
    } else container.appendChild(document.createTextNode(m[2]));
    last = TERM_RE.lastIndex;
  }
  addText(text.slice(last), container);
}
const FIELDS = [
  ['family','Семейство'], ['abbreviation','Абревиатура'], ['full_name','Пълно име'], ['creator','Създател'],
  ['license','Тип лиценз'], ['published_date','Дата на публикуване'], ['modality','Модалност'],
  ['input_modality_details','Модалност на входящите данни'], ['output_modality_details','Модалност на изходящите данни'],
  ['parameters','Размер в брой параметри'], ['parameters_description','Параметри – подробности'], ['architecture','Архитектура на модела'],
  ['context_length','Дължина на контекста'], ['includes_bulgarian','Включва ли се български'], ['languages_description','Заложени езици'],
  ['applications_description','Предназначение на модела'], ['training_data','Тренировъчни данни'], ['training_methods','Начин на обучение'],
  ['benchmarks_description','Резултати от оценяване'], ['unique_methods_description','Допълнителни методи и особености на модела'],
  ['fine_tuning','Фина настройка'], ['publications_description','Публикации, описващи модела'], ['other_details','Допълнителна информация']
];
function renderCard(props){
  const card = document.createElement('div'); card.className = 'result-item';
  const hdr = document.createElement('div'); hdr.className = 'result-header';
  const left = document.createElement('div'); left.className = 'result-header-left';
  const nm = document.createElement('div'); nm.className = 'result-title'; nm.style.marginBottom = '0'; nm.textContent = (props.name || '—').replace(/\s*\([^)]*\)\s*$/, '');
  left.appendChild(nm);
  if(props.family){ const b = document.createElement('span'); b.className = 'result-tag'; b.textContent = props.family; left.appendChild(b); }
  if(props.parameters && !isUnknown(props.parameters)){ const b = document.createElement('span'); b.className = 'result-tag'; b.textContent = props.parameters; left.appendChild(b); }
  if(props.verified !== 'VERIFIED'){ const b = document.createElement('span'); b.className = 'result-tag'; b.style.background = '#fff3cd'; b.textContent = 'в процес на проверка'; left.appendChild(b); }
  const tog = document.createElement('div'); tog.className = 'toggle-btn'; tog.textContent = '+';
  hdr.append(left, tog); card.appendChild(hdr);
  const body = document.createElement('div'); body.className = 'result-body';
  const badges = [];
  [['chat_access','Чат'],['api_access','API'],['download_access','Изтегляне']].forEach(([k,label]) => {
    const v = props[k]; if(!v) return;
    const b = document.createElement('div'); b.className = 'access-badge ' + (v === 'безплатен' ? 'access-free' : v === 'платен' ? 'access-paid' : 'access-no');
    const l = document.createElement('span'); l.className = 'access-label'; l.textContent = label + ':';
    const s = document.createElement('span'); s.textContent = '\u00a0' + (v === 'не' ? 'Няма' : v.charAt(0).toUpperCase() + v.slice(1));
    b.append(l, s); badges.push(b);
  });
  if(badges.length){
    const box = document.createElement('div'); box.className = 'detail-section';
    const t = document.createElement('div'); t.className = 'detail-section-title'; t.textContent = 'Типове достъп';
    const r = document.createElement('div'); r.className = 'access-row'; badges.forEach(b => r.appendChild(b));
    box.append(t, r); body.appendChild(box);
  }
  const found = new Set();
  FIELDS.forEach(([key, label]) => {
    let val = props[key + '_linked'] || props[key];
    if(!val || (Array.isArray(val) && !val.length)) return;
    if(Array.isArray(val)) val = val.join(', ');
    val = String(val).trim();
    if(!val || (key === 'parameters' && isUnknown(val))) return;
    if(key === 'published_date') val = formatDate(val);
    const sec = document.createElement('div'); sec.className = 'detail-section';
    const t = document.createElement('div'); t.className = 'detail-section-title'; t.textContent = label;
    const v = document.createElement('div'); v.className = 'detail-section-value'; renderLinked(val, v, found);
    sec.append(t, v); body.appendChild(sec);
  });
  ['applications_details_linked','unique_methods_details_linked'].forEach(k => {
    (props[k] || []).forEach(x => { let m; TERM_RE.lastIndex = 0; while((m = TERM_RE.exec(x)) !== null) found.add(m[1]); });
  });
  if(found.size){
    const sec = document.createElement('div'); sec.className = 'detail-section';
    const t = document.createElement('div'); t.className = 'detail-section-title'; t.textContent = 'Термини от речника в описанието';
    const c = document.createElement('div'); c.className = 'term-chips';
    [...found].filter(id => TERMS[id]).sort((a,b) => TERMS[a].bg_term.localeCompare(TERMS[b].bg_term, 'bg')).forEach(id => {
      const ch = document.createElement('span'); ch.className = 'term-chip'; ch.textContent = TERMS[id].bg_term; ch.title = termTitle(TERMS[id]);
      ch.onclick = function(e){ e.stopPropagation(); openTerm(id); }; c.appendChild(ch);
    });
    sec.append(t, c); body.appendChild(sec);
  }
  const lr = document.createElement('div'); lr.className = 'result-links';
  [['url','Директна връзка'],['ollama_link','Ollama'],['github_link','GitHub'],['huggingface_link','Hugging Face']].forEach(([k,label]) => {
    const raw = (props[k] || '').trim(); const url = /^https?:\/\//i.test(raw.split(' ')[0]) ? raw.split(' ')[0] : '';
    const a = document.createElement('a'); a.textContent = label;
    if(url){ a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; } else { a.href = '#'; a.className = 'link-inactive'; a.onclick = e => e.preventDefault(); }
    lr.appendChild(a);
  });
  if(props.last_accessed){ const d = document.createElement('div'); d.style.cssText = 'width:100%;margin-top:4px;font-size:12px;color:#aaa'; d.textContent = 'Последна проверка: ' + formatDate(props.last_accessed); lr.appendChild(d); }
  body.appendChild(lr); card.appendChild(body);
  hdr.addEventListener('click', function(){ const open = body.classList.toggle('open'); tog.textContent = open ? '\u00d7' : '+'; });
  return card;
}
function renderPagination(total, current){
  const pages = Math.ceil(total / PAGE_SIZE);
  function btn(c, label, n, active, disabled){ const b = document.createElement('button'); b.className = 'pg-btn' + (active ? ' active' : ''); b.textContent = label; b.disabled = !!disabled; b.onclick = () => showPage(n); c.appendChild(b); }
  [el('pagination-top'), el('pagination-bot')].forEach(c => {
    c.innerHTML = ''; if(pages <= 1) return;
    btn(c, '\u2190', current - 1, false, current === 1);
    const start = Math.max(1, current - 2), end = Math.min(pages, current + 2);
    if(start > 1){ btn(c, '1', 1); if(start > 2) c.appendChild(document.createTextNode(' … ')); }
    for(let i = start; i <= end; i++) btn(c, String(i), i, i === current);
    if(end < pages){ if(end < pages - 1) c.appendChild(document.createTextNode(' … ')); btn(c, String(pages), pages); }
    btn(c, '\u2192', current + 1, false, current === pages);
  });
}
function showPage(page){
  currentPage = page; el('s-page').textContent = page;
  const list = el('results-list'); list.innerHTML = '';
  if(!RESULTS.length){ msg('Няма резултати за тези филтри'); renderPagination(0, 1); return; }
  RESULTS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).forEach(p => list.appendChild(renderCard(p)));
  renderPagination(RESULTS.length, page);
  el('ifgpt-results').scrollIntoView({behavior: 'smooth', block: 'start'});
}
window.App = {};
App.search = function(){
  if(!loaded){ alert('Данните все още се зареждат'); return; }
  el('ifgpt-results').classList.remove('hidden');
  RESULTS = MODELS.filter(buildFilter()).sort(cmp);
  el('s-total').textContent = RESULTS.length.toLocaleString('bg'); el('btn-json').disabled = RESULTS.length === 0;
  showPage(1);
};
App.reset = function(){
  document.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
  ['f-name','f-year-from','f-year-to'].forEach(id => el(id).value = '');
  el('ifgpt-results').classList.add('hidden'); el('pagination-top').innerHTML = ''; el('pagination-bot').innerHTML = '';
};
App.downloadJSON = function(){
  const models = RESULTS.map(m => { const c = {}; for(const [k,v] of Object.entries(m)){ if(!k.endsWith('_linked')) c[k] = v; } return c; });
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), total: models.length, models }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'llm-models-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
};
load();
})();
