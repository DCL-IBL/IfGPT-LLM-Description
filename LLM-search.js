const CFG = {
  uri: 'neo4j+s://8fab59d8.databases.neo4j.io',
  user: 'neo4j',
  password: 'HPa7HpbVTKwadDVkSZbbjvb5-5gxJPaAgWIP68xbcbk'
};
const PAGE_SIZE = 15;
let driver = null;
let currentPage = 1;
let totalResults = 0;
let lastQuery = null;

// ── Connection ──────────────────────────────────────────
async function connect() {
  try {
    driver = neo4j.driver(CFG.uri, neo4j.auth.basic(CFG.user, CFG.password));
    await driver.verifyConnectivity();
    await ldmodels();
  } catch(e) {
    console.error('Connection error:', e.message);
  }
}

// ── Load dropdowns & checkboxes on init ─────────────────
async function ldmodels() {
  const s = driver.session({ defaultAccessMode: neo4j.session.READ });

  // Families
  const rf = await s.run(
    "MATCH (n:LLM) WHERE n.verified IN ['VERIFIED'] RETURN DISTINCT n.family AS fam ORDER BY fam"
  );
  // → populate #fam-list checkboxes

  // Licenses
  const rl = await s.run(
    "MATCH (n:LLM) WHERE n.verified IN ['VERIFIED'] AND n.license IS NOT NULL RETURN DISTINCT n.license AS lic"
  );
  // → classify with classifyLicense(), populate #lic-list checkboxes

  // Model name dropdown
  const rn = await s.run(
    "MATCH (n:LLM) WHERE n.verified IN ['VERIFIED'] RETURN n.name AS name, n.parameters AS params ORDER BY n.family, n.name"
  );
  // → populate #f-name <select>

  await s.close();
}

// ── License classifier ───────────────────────────────────
function classifyLicense(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes('llama'))      return 'Llama';
  if (s.includes('gemma'))      return 'Gemma';
  if (s.includes('mistral'))    return 'Mistral';
  if (s.includes('deepseek'))   return 'DeepSeek';
  if (s.includes('qwen'))       return 'Qwen';
  if (s.includes('phi'))        return 'Phi';
  if (s.includes('falcon'))     return 'Falcon';
  if (s.includes('mit'))        return 'MIT';
  if (s.includes('apache'))     return 'Apache 2.0';
  if (s.includes('cc-by') || s.includes('cc by')) return 'Creative Commons';
  if (s.includes('openrail'))   return 'OpenRAIL';
  if (s.includes('bigscience')) return 'BigScience';
  if (s.includes('open') || s.includes('free') || s.includes('permissive')) return 'Свободен лиценз';
  if (s.includes('proprietary') || s.includes('commercial') ||
      s.includes('paid') || s.includes('anthropic') ||
      s.includes('openai') || s.includes('google') || s.includes('microsoft'))
    return 'Платен лиценз';
  return 'Друг';
}

// ── Build dynamic WHERE clause ───────────────────────────
function buildQuery() {
  const conds = [], params = {};

  const families = vals('family');
  if (families.length) { conds.push('n.family IN $families'); params.families = families; }

  const name = document.getElementById('f-name').value.trim();
  if (name) { conds.push('toLower(n.name) CONTAINS toLower($name)'); params.name = name; }

  const licenses = vals('license');
  if (licenses.length) {
    const lc = licenses.map((l, i) => { params['lic'+i] = l; return `toLower(n.license) CONTAINS toLower($lic${i})`; });
    conds.push('(' + lc.join(' OR ') + ')');
  }

  const access = vals('access');
  if (access.length) {
    const ac = access.map(a => {
      if (a === 'ollama')      return 'n.ollama_link IS NOT NULL';
      if (a === 'huggingface') return 'n.huggingface_link IS NOT NULL';
      if (a === 'github')      return 'n.github_link IS NOT NULL';
      return null;
    }).filter(Boolean);
    if (ac.length) conds.push('(' + ac.join(' OR ') + ')');
  }

  const modality = vals('modality');
  if (modality.length) {
    const mc = modality.map((m, i) => { params['mod'+i] = m; return `$mod${i} IN n.input_modality_details`; });
    conds.push('(' + mc.join(' OR ') + ')');
  }

  const outModality = vals('out_modality');
  if (outModality.length) {
    const omc = outModality.map((m, i) => { params['omod'+i] = m; return `$omod${i} IN n.output_modality_details`; });
    conds.push('(' + omc.join(' OR ') + ')');
  }

  const sizes = vals('size');
  if (sizes.length) {
    const sc = sizes.map(s => {
      if (s === 'very-small') return "(n.parameters IS NOT NULL AND toFloat(replace(replace(n.parameters,'B',''),'T','')) < 1 AND NOT n.parameters ENDS WITH 'T')";
      if (s === 'small')      return "(n.parameters IS NOT NULL AND toFloat(replace(n.parameters,'B','')) >= 1 AND toFloat(replace(n.parameters,'B','')) < 7 AND NOT n.parameters ENDS WITH 'T')";
      if (s === 'medium')     return "(n.parameters IS NOT NULL AND toFloat(replace(n.parameters,'B','')) >= 7 AND toFloat(replace(n.parameters,'B','')) < 70 AND NOT n.parameters ENDS WITH 'T')";
      if (s === 'large')      return "(n.parameters IS NOT NULL AND toFloat(replace(n.parameters,'B','')) >= 70 AND toFloat(replace(n.parameters,'B','')) < 400 AND NOT n.parameters ENDS WITH 'T')";
      if (s === 'very-large') return "(n.parameters IS NOT NULL AND (n.parameters ENDS WITH 'T' OR toFloat(replace(n.parameters,'B','')) >= 400))";
      return null;
    }).filter(Boolean);
    if (sc.length) conds.push('(' + sc.join(' OR ') + ')');
  }

  const yearFrom = document.getElementById('f-year-from').value.trim();
  const yearTo   = document.getElementById('f-year-to').value.trim();
  if (yearFrom) { conds.push("toInteger(substring(n.published_date, size(n.published_date)-4, 4)) >= $yf"); params.yf = parseInt(yearFrom); }
  if (yearTo)   { conds.push("toInteger(substring(n.published_date, size(n.published_date)-4, 4)) <= $yt"); params.yt = parseInt(yearTo); }

  if (document.getElementById('f-bg').checked) {
    conds.push("(toLower(n.includes_bulgarian) CONTAINS 'да' OR toLower(n.includes_bulgarian) CONTAINS 'yes')");
  }

  // Always filter verified only
  conds.push("n.verified IN $verified");
  params.verified = ['VERIFIED'];

  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  return { where, params };
}

// Helper: get checked values for a named group of checkboxes
function vals(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(c => c.value);
}

// ── Count total matching results ─────────────────────────
async function fetchCount(where, params) {
  const s = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const r = await s.run(`MATCH (n:LLM)${where} RETURN count(n) as total`, params);
    return r.records[0].get('total').toNumber();
  } finally {
    await s.close();
  }
}

// ── Fetch one page of results ────────────────────────────
async function fetchPage(where, params, page) {
  const skip = (page - 1) * PAGE_SIZE;
  const p = Object.assign({}, params, { skip: neo4j.int(skip), limit: neo4j.int(PAGE_SIZE) });
  const s = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const r = await s.run(
      `MATCH (n:LLM)${where} RETURN n ORDER BY n.family, n.name SKIP $skip LIMIT $limit`, p
    );
    return r.records.map(rec => rec.get('n').properties);
  } finally {
    await s.close();
  }
}

// ── Search entry point ───────────────────────────────────
App.search = async function() {
  const q = buildQuery();
  lastQuery = q;
  totalResults = await fetchCount(q.where, q.params);
  document.getElementById('s-total').textContent = totalResults.toLocaleString('bg');
  await loadPage(1);
};

// ── Load & render a page ─────────────────────────────────
async function loadPage(page) {
  currentPage = page;
  document.getElementById('s-page').textContent = page;
  const nodes = await fetchPage(lastQuery.where, lastQuery.params, page);
  const list = document.getElementById('results-list');
  list.innerHTML = '';
  nodes.forEach(props => list.appendChild(renderCard(props)));
  renderPagination(totalResults, page, loadPage);
}

// ── JSON export (all results, batched by 100) ────────────
App.downloadJSON = async function() {
  const allNodes = [];
  const batchSize = 100;
  for (let skip = 0; skip < totalResults; skip += batchSize) {
    const p = Object.assign({}, lastQuery.params, { skip: neo4j.int(skip), limit: neo4j.int(batchSize) });
    const s = driver.session({ defaultAccessMode: neo4j.session.READ });
    const r = await s.run(
      `MATCH (n:LLM)${lastQuery.where} RETURN n ORDER BY n.family, n.name SKIP $skip LIMIT $limit`, p
    );
    await s.close();
    r.records.forEach(rec => {
      const props = rec.get('n').properties;
      const clean = {};
      for (const [k, v] of Object.entries(props)) {
        clean[k] = (v && typeof v === 'object' && v.toNumber) ? v.toNumber() : v;
      }
      allNodes.push(clean);
    });
  }
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), total: totalResults, models: allNodes }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'llm-models-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};

// ── Reset all filters ────────────────────────────────────
App.reset = function() {
  document.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
  ['f-name', 'f-year-from', 'f-year-to'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('f-bg').checked = false;
  document.getElementById('ifgpt-results').classList.add('hidden');
};
