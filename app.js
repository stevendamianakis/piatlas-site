/* PIAtlas project page. Renders the matrix, the detail panel and the figures from taxonomy.js.
 * Entries are addressable as #F1, #F1.T2 or #F1.T2.S1. */
(function () {
  'use strict';

  const grid = document.getElementById('matrix-grid');
  if (typeof TAXONOMY === 'undefined') {
    grid.innerHTML = '<p class="loading">The taxonomy data (taxonomy.js) did not load.</p>';
    return;
  }

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const ILLUS = typeof ILLUSTRATIONS !== 'undefined' ? ILLUSTRATIONS : {};
  const CODE = 'F[1-6](?:\\.T\\d+(?:\\.S\\d+)?)?';
  const ID_RE = new RegExp('^' + CODE + '$');
  const LINK_RE = new RegExp('\\[\\[(' + CODE + ')\\]\\]|(^|[^\\w.\\-/#&])(' + CODE + ')(?!\\w)', 'g');
  const LEVEL = { class: 'Class', technique: 'Technique', 'sub-technique': 'Sub-technique' };
  const CHEVRON = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3.3 1.8 6.6 5 3.3 8.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------------------------------------------------------------- index
  const byId = new Map();
  const techniques = [];
  TAXONOMY.forEach(c => {
    byId.set(c.id, c);
    c.children.forEach(t => {
      byId.set(t.id, t);
      techniques.push(t);
      t.children.forEach(s => byId.set(s.id, s));
    });
  });
  const classOf = id => id.split('.')[0];
  const techOf = id => id.split('.').slice(0, 2).join('.');

  const incByCode = new Map();
  INCIDENTS.forEach((inc, i) => {
    inc.idx = i;
    inc.codes.forEach(code => {
      if (!incByCode.has(code)) incByCode.set(code, []);
      incByCode.get(code).push(inc);
    });
  });
  const cited = id => incByCode.get(id) || [];
  const isWild = e => cited(e.id).length > 0 ||
    (e.level === 'technique' && e.children.some(s => cited(s.id).length > 0));

  // ---------------------------------------------------------------- text helpers
  const esc = s => String(s).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  function chip(id, label) {
    const e = byId.get(id);
    if (!e) return esc(id);
    return `<a class="chip" data-c="${classOf(id)}" href="#${id}" title="${esc(e.name)}">${esc(label || id)}</a>`;
  }

  /* `code` -> <code>, [[F1.T2]] -> link chip; bare codes such as F3.T8 become chips too
     unless bare is false (worked examples never contain codes). */
  function rich(text, { bare = true } = {}) {
    return String(text).split(/(`[^`]*`)/g).map(part => {
      if (part.length > 1 && part[0] === '`' && part[part.length - 1] === '`') {
        return `<code>${esc(part.slice(1, -1))}</code>`;
      }
      return esc(part).replace(LINK_RE, (m, a, pre, b) => a ? chip(a) : (bare ? pre + chip(b) : m));
    }).join('');
  }

  function segHTML(segs) {
    return segs.map(s => {
      const inner = rich(s.t, { bare: false })
        .replace(/&lt;payload&gt;/g, '<span class="payload">&lt;payload&gt;</span>');
      return s.c ? `<span class="hl" data-c="${s.c}">${inner}<sup>${s.c}</sup></span>` : inner;
    }).join('');
  }

  const displayExample = ex => /^[a-z]/.test(ex) ? ex[0].toUpperCase() + ex.slice(1) : ex;
  // Hyphenation points for long capitalized words. Browsers do not auto-hyphenate capitalized words,
  // so fitNames() adds these soft hyphens to a word only when the word alone is wider than its cell.
  const SOFT = Object.fromEntries([
    'Trans|for|ma|tion', 'Re|spon|si|bil|ity', 'Re|struc|tur|ing', 'Se|ri|al|iza|tion', 'Trans|po|si|tion',
    'Con|tra|dic|tion', 'Clar|ifi|ca|tion', 'Frag|men|ta|tion', 'Hy|po|thet|icals', 'Ma|nipu|la|tion',
    'Hy|po|thet|ical', 'Per|tur|ba|tion', 'Un|re|strict|ed', 'Su|per|ses|sion', 'De|clar|ative',
    'Sup|pres|sion', 'Dis|trac|tors', 'Coun|ter|feit', 'Con|di|tion|al', 'In|struc|tion', 'Rec|ip|roc|ity',
    'Re|place|ment', 'Ob|fus|ca|tion', 'Util|itar|ian', 'En|dorse|ment', 'En|gi|neer|ing', 'Con|se|quence',
    'Com|po|si|tion', 'Repe|ti|tion', 'De|lim|it|ers', 'Ob|li|ga|tion', 'Struc|tur|al', 'Ho|mo|glyphs',
    'Fab|ri|cat|ed', 'Pseu|do|code', 'Struc|tured', 'Simu|la|tion', 'Po|si|tion|al', 'Le|git|imacy',
    'Im|por|tance', 'Com|mit|ment',
    'Em|bed|ding', 'Char|ac|ter', 'Exe|cu|tion', 'Switch|ing', 'Re|word|ing', 'Sur|ro|gate',
    'Au|thor|ity', 'Emo|tion|al', 'Chal|lenge', 'Rea|son|ing', 'Ex|cep|tion', 'Cog|ni|tive',
    'Nor|mal|ity', 'Re|quest|er', 'Leet|speak', 'Emer|gen|cy', 'As|sis|tant', 'In|cen|tive',
    'Hyp|oc|risy', 'Clas|si|cal', 'Al|ter|nate', 'In|vis|ible', 'Re|trieved', 'Eu|phe|mism',
    'Ter|mi|nal', 'Co|er|cion', 'Over|load', 'Bound|ary', 'Dia|logue', 'Docu|ment', 'Lan|guage',
    'In|di|rect', 'Al|lu|sion', 'Meta|da|ta', 'Re|search', 'Re|quired', 'Ver|ba|tim', 'Em|pha|sis',
    'Phras|ing', 'Sce|nar|io', 'Busi|ness', 'Sym|pa|thy', 'En|cod|ing', 'Ar|gu|ment', 'Of|fi|cial',
    'Se|cu|rity', 'Scar|city', 'Stan|dard', 'Dis|guise', 'In|vert|ed', 'Func|tion', 'Re|sponse',
    'Capi|tals', 'Pho|net|ic', 'Vari|able', 'Se|man|tic', 'Spoof|ing', 'Script|ed', 'Flat|tery',
    'Se|quence', 'Over|ride', 'Dead|line', 'Com|mand'
  ].map(w => [w.replace(/\|/g, ''), w.replace(/\|/g, '\u00AD')]));
  const measure = document.createElement('canvas').getContext('2d');
  function fitNames() {
    $$('.col-name, .cell .nm', grid).forEach(nm => {
      const name = nm.dataset.name;
      if (!name || !nm.offsetParent) return;
      const avail = nm.clientWidth;
      if (!avail) return;
      const cs = getComputedStyle(nm);
      measure.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      // measure a word together with an attached hyphen ("Structured-"), where the line can break
      const text = name.replace(/\b([A-Z][a-z]{6,})\b(-?)/g, (m, w, hy) =>
        (SOFT[w] && measure.measureText(w + hy).width > avail ? SOFT[w] : w) + hy);
      if (nm.textContent !== text) nm.textContent = text;
    });
  }

  // incident marker: a dot in the cell's top-right corner of the matrix, inline after names in lists
  const WILD_SR = '<span class="sr-only">, named in a disclosed incident</span>';
  const wildDot = e => isWild(e) ? '<span class="wild" aria-hidden="true"></span>' + WILD_SR : '';
  const wildMark = e => isWild(e) ? '<span class="wild-inline" aria-hidden="true"></span>' + WILD_SR : '';

  // ---------------------------------------------------------------- matrix
  function renderMatrix() {
    grid.innerHTML = TAXONOMY.map(c => `
      <section class="col" data-c="${c.id}" aria-labelledby="h-${c.id}">
        <div class="col-head">
          <a class="col-title" id="h-${c.id}" href="#${c.id}" data-id="${c.id}">
            <span class="badge">${c.id}</span><span class="col-name" data-name="${esc(c.name)}">${esc(c.name)}</span>
          </a>
          <div class="col-count">${c.children.length} techniques</div>
        </div>
        <ol class="techs">${c.children.map(techHTML).join('')}</ol>
      </section>`).join('');
  }

  function techHTML(t) {
    const n = t.children.length;
    const subs = n ? `
      <ol class="subs" id="subs-${t.id}" hidden>${t.children.map(s => `
        <li><a class="cell sub${isWild(s) ? ' has-wild' : ''}" href="#${s.id}" data-id="${s.id}"><span class="cid">${s.id.split('.')[2]}</span><span class="nm" data-name="${esc(s.name)}">${esc(s.name)}</span>${wildDot(s)}</a></li>`).join('')}
      </ol>` : '';
    const toggle = n ? `<button type="button" class="tgl" aria-expanded="false" aria-controls="subs-${t.id}">${CHEVRON}</button>` : '';
    return `
      <li class="tech" data-id="${t.id}">
        <div class="tech-cell">
          <a class="cell${isWild(t) ? ' has-wild' : ''}" href="#${t.id}" data-id="${t.id}"><span class="cid">${t.id.split('.')[1]}</span><span class="nm" data-name="${esc(t.name)}">${esc(t.name)}</span>${wildDot(t)}</a>${toggle}
        </div>${subs}
      </li>`;
  }

  const userOpen = new Set();
  const forcedOpen = new Set();

  function applyExpansion() {
    const openCols = new Set();
    $$('.tech', grid).forEach(li => {
      const btn = $('.tgl', li);
      if (!btn) return;
      const t = byId.get(li.dataset.id);
      const open = userOpen.has(t.id) || forcedOpen.has(t.id);
      const n = t.children.length;
      if (open) openCols.add(classOf(t.id));
      li.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} ${n} sub-technique${n > 1 ? 's' : ''} of ${t.name}`);
      btn.title = open ? 'Hide sub-techniques' : 'Show sub-techniques';
      $('.subs', li).hidden = !open;
    });
    // columns with open sub-techniques are twice as wide; style.css sizes the cells so they fit
    grid.style.setProperty('--open-cols', String(openCols.size));
    frame.classList.toggle('wide', openCols.size > 0);
    fitNames();
    updateScrollHints();
  }

  const cellFor = id => id && (byId.get(id).level === 'class'
    ? $(`.col-title[data-id="${id}"]`, grid)
    : $(`a.cell[data-id="${id}"]`, grid));

  // ---------------------------------------------------------------- scroll hints
  const scroller = $('.matrix-scroll');
  const frame = $('.matrix-frame');
  const jump = $('#col-jump');
  function updateScrollHints() {
    const max = scroller.scrollWidth - scroller.clientWidth;
    frame.classList.toggle('can-left', scroller.scrollLeft > 4);
    frame.classList.toggle('can-right', scroller.scrollLeft < max - 4);
    jump.hidden = max <= 4;
  }

  // ---------------------------------------------------------------- search & incident highlight
  const qInput = $('#q');
  const status = $('#q-count');
  const incidentSel = $('#incident');
  // search matches the start of words in the paper's text (illustrations are not searched)
  const plain = s => String(s || '').replace(/`|\[\[|\]\]/g, '').toLowerCase();
  const haystack = new Map();
  byId.forEach((e, id) => haystack.set(id, [id, e.name, e.description, e.example].map(plain).join(' \u0001 ')));
  const termRe = t => new RegExp((/^\w/.test(t) ? '\\b' : '') + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  function highlight(hits, classHits) {
    clearHighlight(false);
    grid.classList.add('filtering');
    hits.forEach(id => { if (id.split('.').length === 3) forcedOpen.add(techOf(id)); });
    $$('.tech', grid).forEach(li => {
      const t = byId.get(li.dataset.id);
      const cell = $('.tech-cell', li);
      cell.classList.toggle('hit', hits.has(t.id));
      cell.classList.toggle('hit-sub', !hits.has(t.id) && t.children.some(s => hits.has(s.id)));
      $$('.cell.sub', li).forEach(a => a.classList.toggle('hit', hits.has(a.dataset.id)));
    });
    $$('.col', grid).forEach(col => {
      const cid = col.dataset.c;
      const any = classHits.has(cid) || Array.from(hits).some(h => classOf(h) === cid);
      col.classList.toggle('no-hit', !any);
      $('.col-head', col).classList.toggle('hit-class', classHits.has(cid));
    });
    applyExpansion();
  }

  function clearHighlight(apply = true) {
    grid.classList.remove('filtering');
    $$('.hit, .hit-sub, .no-hit, .hit-class', grid)
      .forEach(el => el.classList.remove('hit', 'hit-sub', 'no-hit', 'hit-class'));
    forcedOpen.clear();
    if (apply) applyExpansion();
  }

  function runSearch() {
    const q = qInput.value.trim();
    if (incidentSel.value) { incidentSel.value = ''; hideCase(); }
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean).map(termRe);
    if (!terms.length) { clearHighlight(); status.textContent = ''; return; }
    const hits = new Set();
    const classHits = new Set();
    nameHits.clear();
    byId.forEach((e, id) => {
      if (e.level === 'class') {
        const h = plain(e.id + ' ' + e.name);
        if (terms.every(t => t.test(h))) classHits.add(id);
      } else if (terms.every(t => t.test(haystack.get(id)))) {
        hits.add(id);
        if (terms.every(t => t.test(plain(id + ' ' + e.name)))) nameHits.add(id);
      }
    });
    highlight(hits, classHits);
    const n = hits.size;
    status.textContent = n
      ? `${n} ${n === 1 ? 'entry matches' : 'entries match'} “${q}”. Press Enter to open the first.`
      : `No technique or sub-technique matches “${q}”.`;
  }

  // Enter opens the first entry whose name matches, else the first match in matrix order
  const nameHits = new Set();
  function firstHit() {
    let first = null;
    for (const [id, e] of byId) {
      if (e.level === 'class') continue;
      const el = cellFor(id);
      if (!el || !(el.classList.contains('hit') || el.closest('.tech-cell.hit'))) continue;
      if (nameHits.has(id)) return id;
      if (!first) first = id;
    }
    return first;
  }

  // ---------------------------------------------------------------- incidents
  const linksHTML = inc => inc.links.map((u, k) =>
    ` · <a href="${esc(u)}" target="_blank" rel="noopener noreferrer">Disclosure${inc.links.length > 1 ? ' ' + (k + 1) : ''} ↗</a>`).join('');

  function showCase(inc) {
    const box = $('#case');
    const badges = inc.classes.map(c => `<span class="badge" data-c="${c}">${c}</span>`).join(' ');
    box.innerHTML = `
      <div class="case-title">${esc(inc.name)} <span class="muted">· ${esc(inc.system)} · ${esc(inc.date)}</span> ${badges}</div>
      <p>${rich(inc.text)}</p>
      <p class="muted"><b>Delivery, outside PIAtlas:</b> ${esc(inc.delivery)}</p>
      <p class="muted">Reported by ${esc(inc.by)}${linksHTML(inc)}</p>
      <button type="button" class="btn btn-small case-close">Clear</button>`;
    box.hidden = false;
    $('.case-close', box).addEventListener('click', () => {
      incidentSel.value = '';
      onIncident();
      incidentSel.focus();
    });
  }
  function hideCase() { $('#case').hidden = true; }

  function onIncident() {
    const v = incidentSel.value;
    status.textContent = '';
    if (v === '') { hideCase(); clearHighlight(); return; }
    qInput.value = '';
    const inc = INCIDENTS[Number(v)];
    highlight(new Set(inc.codes), new Set());
    showCase(inc);
  }

  // ---------------------------------------------------------------- detail panel
  const panel = $('#detail');
  const dBody = $('#d-body');
  const dCrumbs = $('#d-crumbs');
  let currentId = null;
  let lastTrigger = null;

  function crumbsHTML(e) {
    const parts = e.id.split('.');
    return parts.map((_, i) => {
      const pid = parts.slice(0, i + 1).join('.');
      const p = byId.get(pid);
      const label = (i === 0 ? p.id : pid.split('.').pop()) + ' ' + p.name;
      return pid === e.id
        ? `<span class="here" aria-current="location">${esc(label)}</span>`
        : `<a href="#${pid}">${esc(label)}</a>`;
    }).join('<span class="slash" aria-hidden="true">›</span>');
  }

  function illusHTML(il) {
    const mark = (text, m) => {
      const i = m ? text.indexOf(m) : -1;
      return i < 0 ? esc(text) : esc(text.slice(0, i)) + `<mark class="pl">${esc(m)}</mark>` + esc(text.slice(i + m.length));
    };
    const reveal = text => Array.from(text).map(ch => {
      const cp = ch.codePointAt(0);
      if (cp === 0x200B) return '<mark class="rv zw" title="U+200B zero-width space">·</mark>';
      if (cp > 0x7E) return `<mark class="rv" title="U+${cp.toString(16).toUpperCase().padStart(4, '0')}">${esc(ch)}</mark>`;
      return esc(ch);
    }).join('');
    let body;
    if (il.reveal) {
      body = `<p class="row-label">As written</p><p class="lit">${esc(il.text)}</p>
              <p class="row-label">With the hidden characters marked</p><p class="lit">${reveal(il.text)}</p>`;
    } else if (il.pre) {
      body = `<pre class="${il.text.includes('#####') ? 'art' : ''}">${mark(il.text, il.mark)}</pre>`;
    } else {
      body = `<p class="prose">${mark(il.text, il.mark)}</p>`;
    }
    return `<div class="illus"><p class="illus-head"><b>Illustration</b> · not from the paper</p>${body}${il.note ? `<p class="note">${esc(il.note)}</p>` : ''}</div>`;
  }

  function exampleHTML(e) {
    return `<section class="d-sec"><h3>Worked example</h3>
      <blockquote class="example">${rich(displayExample(e.example), { bare: false })}</blockquote>
      ${ILLUS[e.id] ? illusHTML(ILLUS[e.id]) : ''}
      <p class="src">From Appendix G</p>
    </section>`;
  }

  function incidentItem(inc, via) {
    return `<li>
      <div class="li-head"><b>${esc(inc.name)}</b><span class="li-meta">${esc(inc.system)} · ${esc(inc.date)}</span>${via ? `<span class="li-via">via ${chip(via)}</span>` : ''}</div>
      <p class="li-def">${rich(inc.text)}</p>
      <p class="li-meta"><b>Delivery, outside PIAtlas:</b> ${esc(inc.delivery)}</p>
      <p class="li-meta">Reported by ${esc(inc.by)}${linksHTML(inc)}</p>
    </li>`;
  }

  function incidentsHTML(e) {
    const items = [];
    const seen = new Set();
    cited(e.id).forEach(inc => { items.push([inc, null]); seen.add(inc.idx); });
    if (e.level === 'technique') {
      e.children.forEach(s => cited(s.id).forEach(inc => {
        if (!seen.has(inc.idx)) { items.push([inc, s.id]); seen.add(inc.idx); }
      }));
    }
    if (!items.length) return '';
    return `<section class="d-sec"><h3>Seen in disclosed incidents <span class="count">${items.length}</span></h3>
      <ul class="list">${items.map(([inc, via]) => incidentItem(inc, via)).join('')}</ul>
      <p class="src">From Table XXI. Delivery is outside the taxonomy.</p></section>`;
  }

  const rulesHTML = rules => `<details class="d-sec"><summary>Boundary rules <span class="count">${rules.length}</span></summary>
    <ul class="rules">${rules.map(r => `<li>${rich(r)}</li>`).join('')}</ul>
    <p class="src">Which entry applies when two seem to fit. From Section IV-C and Appendix G.</p></details>`;

  function corpusItem(x) {
    const text = x.described
      ? `<i>${esc(x.segments[0].t)}</i> <span class="muted">(described, not quoted)</span>`
      : `“${segHTML(x.segments)}”`;
    return `<li><p class="src-name">${esc(x.source)}${x.group === 'composite' ? ' · composite attack' : ''}</p>
      <p class="q">${text}</p>
      <ul class="effects">${x.effects.map(f => `<li data-c="${f.c}"><span class="badge">${f.c}</span><span>${esc(f.t)}</span></li>`).join('')}</ul></li>`;
  }

  function classBody(c) {
    const share = (label, v) => `<div class="share-row"><span>${label}</span><span class="val">${v.toFixed(1)}%</span>
      <div class="share-track" aria-hidden="true"><div class="share-fill" style="width:${v}%"></div></div></div>`;
    const corpus = CORPUS_EXAMPLES.filter(x => x.classes.includes(c.id));
    const incs = INCIDENTS.filter(inc => inc.classes.includes(c.id) || inc.variantClasses.includes(c.id));
    return `
      <dl class="glance">
        <div><dt>Acts on</dt><dd>${esc(c.actsOn)}</dd></div>
        <div><dt>Why it works</dt><dd>${esc(c.channel)}</dd></div>
        <div><dt>What counters it</dt><dd>${esc(c.lever)}</dd></div>
      </dl><p class="src">From Table IV</p>
      <section class="d-sec"><h3>Signature test</h3><p>${rich(c.signature)}</p><p class="src">From Section IV-C</p></section>
      <section class="d-sec"><h3>Worked example</h3>
        <blockquote class="example">${segHTML(c.oneRequest.segments)}</blockquote>
        <p class="src">The plain request with only this class's part changed, ${chip(c.oneRequest.entry)}. From Table XXIII.</p></section>
      ${corpus.length ? `<section class="d-sec"><h3>Real templates <span class="count">${corpus.length}</span></h3>
        <ul class="corpus">${corpus.map(corpusItem).join('')}</ul>
        <p class="src">Highlighted words carry the construction. From Table V.</p></section>` : ''}
      <section class="d-sec"><h3>Share of labeled records</h3>
        <div class="shares">${share('Curated benchmarks, 4,663 templates', c.shares.curated)}${share('Adaptive attackers, LLMail-Inject sample of 4,000', c.shares.adaptive)}</div>
        <p class="src">From Table XVI (production labels)</p></section>
      <section class="d-sec"><h3>Techniques <span class="count">${c.children.length}</span></h3>
        <p class="src">Techniques divide by ${esc(c.dividesBy)}. The list is ${esc(c.bounded)}.</p>
        <ul class="list">${c.children.map(t => `<li><div class="li-head"><span class="li-code">${t.id}</span><a href="#${t.id}">${esc(t.name)}</a>${wildMark(t)}</div><p class="li-def">Changes ${esc(t.changes)}</p></li>`).join('')}</ul></section>
      ${incs.length ? `<section class="d-sec"><h3>Disclosed incidents using ${c.id} <span class="count">${incs.length}</span></h3>
        <ul class="list">${incs.map(inc => `<li><div class="li-head"><b>${esc(inc.name)}</b><span class="li-meta">${esc(inc.system)} · ${esc(inc.date)}${inc.classes.includes(c.id) ? '' : ' · in a documented variant'}</span></div>
          <p class="li-def">${inc.codes.filter(k => classOf(k) === c.id).map(k => chip(k)).join(' ')}</p></li>`).join('')}</ul>
        <p class="src">From Table XXI</p></section>` : ''}`;
  }

  function techBody(t) {
    const c = byId.get(classOf(t.id));
    const subs = t.children.length ? `<section class="d-sec"><h3>Sub-techniques <span class="count">${t.children.length}</span></h3>
      <ul class="list">${t.children.map(s => `<li>
        <div class="li-head"><span class="li-code">${s.id}</span><a href="#${s.id}">${esc(s.name)}</a>${wildMark(s)}</div>
        <p class="li-def">${rich(s.description)}</p>
        <p class="li-ex">${rich(displayExample(s.example), { bare: false })}</p></li>`).join('')}</ul></section>` : '';
    return `
      <dl class="kv"><dt>What it changes</dt><dd>${esc(t.changes)}</dd><dt>Class divides by</dt><dd>${esc(c.dividesBy)}</dd></dl>
      ${exampleHTML(t)}${subs}${incidentsHTML(t)}`;
  }

  function subBody(s) {
    const t = byId.get(techOf(s.id));
    const siblings = t.children.filter(x => x.id !== s.id);
    return `${exampleHTML(s)}
      <section class="d-sec"><h3>Part of</h3>
        <ul class="list"><li><div class="li-head"><span class="li-code">${t.id}</span><a href="#${t.id}">${esc(t.name)}</a></div>
          <p class="li-def">${rich(t.description)}</p></li></ul>
        ${siblings.length ? `<p class="src">Other forms of ${esc(t.name)}</p><div class="siblings">${siblings.map(x => chip(x.id, x.id.split('.').pop() + ' ' + x.name)).join('')}</div>` : ''}
      </section>${incidentsHTML(s)}`;
  }

  function detailHTML(e) {
    const cid = classOf(e.id);
    const body = e.level === 'class' ? classBody(e) : e.level === 'technique' ? techBody(e) : subBody(e);
    return `<div data-c="${cid}">
      <div class="d-kicker"><span class="badge">${cid}</span><span>${LEVEL[e.level]}</span>${e.level === 'class' ? '' : `<code>${e.id}</code>`}</div>
      <h2 id="d-title" tabindex="-1">${esc(e.name)}</h2>
      <p class="d-desc">${rich(e.description)}</p>
      ${body}
      ${e.boundary && e.boundary.length ? rulesHTML(e.boundary) : ''}
      <p class="d-source"><b>Source in the paper:</b> ${esc(e.source)}</p>
    </div>`;
  }

  const motion = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

  function revealCell(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (window.innerWidth > 720) {
      const visibleRight = window.innerWidth - panel.getBoundingClientRect().width - 16;
      if (r.right > visibleRight) scroller.scrollBy({ left: r.right - visibleRight, behavior: motion() });
      else if (r.left < 16) scroller.scrollBy({ left: r.left - 16, behavior: motion() });
    }
    if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center', behavior: motion() });
  }

  function openDetail(id) {
    const e = byId.get(id);
    if (!e) return;
    if (e.level === 'sub-technique') { userOpen.add(techOf(id)); applyExpansion(); }
    currentId = id;
    $$('[aria-current="true"]', grid).forEach(el => el.removeAttribute('aria-current'));
    const cell = cellFor(id);
    if (cell) cell.setAttribute('aria-current', 'true');
    dCrumbs.innerHTML = crumbsHTML(e);
    dBody.innerHTML = detailHTML(e);
    dBody.scrollTop = 0;
    panel.hidden = false;
    document.body.classList.add('detail-open');
    requestAnimationFrame(() => panel.classList.add('open'));
    $('#d-title').focus({ preventScroll: true });
    revealCell(cell);
  }

  function closeDetail({ restoreFocus = true, clearHash = true } = {}) {
    if (panel.hidden) return;
    const id = currentId;
    currentId = null;
    panel.classList.remove('open');
    document.body.classList.remove('detail-open');
    $$('[aria-current="true"]', grid).forEach(el => el.removeAttribute('aria-current'));
    setTimeout(() => { if (!currentId) panel.hidden = true; }, 240);
    if (clearHash && ID_RE.test(decodeURIComponent(location.hash.slice(1)))) {
      history.pushState(null, '', location.pathname + location.search);
    }
    if (restoreFocus) {
      const el = lastTrigger && document.contains(lastTrigger) && !panel.contains(lastTrigger) ? lastTrigger : cellFor(id);
      if (el) el.focus({ preventScroll: true });
    }
  }

  function onHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (ID_RE.test(id) && byId.has(id)) openDetail(id);
    else if (!panel.hidden) closeDetail({ restoreFocus: false, clearHash: false });
  }

  // ---------------------------------------------------------------- copy helpers
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
  }
  function flash(button, text) {
    const label = $('span', button);
    const old = label.textContent;
    label.textContent = text;
    setTimeout(() => { label.textContent = old; }, 1600);
  }

  // ---------------------------------------------------------------- downloads: the taxonomy as CSV, JSON or Markdown
  // Built in the browser from TAXONOMY, so the files always match the matrix. They carry the paper's
  // text only (no illustrations). Literal strings keep their `code` marks; [[F1.T2]] links become F1.T2.
  const PAGE_URL = location.href.split(/[?#]/)[0];
  const exportText = s => String(s == null ? '' : s).replace(/\[\[([^\]]+)\]\]/g, '$1');
  const quoted = s => '“' + s + '”';

  // one flat record per entry, in matrix order; class and technique fields stay empty where they do not apply
  function exportRecords() {
    const rows = [];
    TAXONOMY.forEach(c => {
      rows.push({
        id: c.id, level: c.level, name: c.name, class: c, technique: null,
        description: exportText(c.description),
        example: quoted(exportText(c.oneRequest.segments.map(s => s.t).join(''))),
        exampleEntry: exportText(c.oneRequest.entry),
        partItChanges: c.part, actsOn: c.actsOn, whyItWorks: c.channel, whatCountersIt: c.lever,
        signatureTest: exportText(c.signature), techniquesDivideBy: c.dividesBy, howTheListIsBounded: c.bounded,
        boundaryRules: (c.boundary || []).map(exportText),
        source: c.source + '; Table XXIII (example)'
      });
      c.children.forEach(t => {
        rows.push({
          id: t.id, level: t.level, name: t.name, class: c, technique: t,
          description: exportText(t.description), example: exportText(displayExample(t.example)),
          changes: t.changes, boundaryRules: (t.boundary || []).map(exportText), source: t.source
        });
        t.children.forEach(s => rows.push({
          id: s.id, level: s.level, name: s.name, class: c, technique: t,
          description: exportText(s.description), example: exportText(displayExample(s.example)),
          boundaryRules: (s.boundary || []).map(exportText), source: s.source
        }));
      });
    });
    return rows;
  }

  const COUNTS = {
    classes: TAXONOMY.length,
    techniques: techniques.length,
    subTechniques: techniques.reduce((n, t) => n + t.children.length, 0)
  };
  const CSV_COLUMNS = [
    ['id', r => r.id], ['level', r => r.level], ['name', r => r.name],
    ['class_id', r => r.class.id], ['class_name', r => r.class.name],
    ['technique_id', r => r.technique ? r.technique.id : ''], ['technique_name', r => r.technique ? r.technique.name : ''],
    ['description', r => r.description], ['example', r => r.example], ['changes', r => r.changes],
    ['boundary_rules', r => r.boundaryRules.join(' ')],
    ['part_it_changes', r => r.partItChanges], ['acts_on', r => r.actsOn], ['why_it_works', r => r.whyItWorks],
    ['what_counters_it', r => r.whatCountersIt], ['signature_test', r => r.signatureTest],
    ['techniques_divide_by', r => r.techniquesDivideBy], ['how_the_list_is_bounded', r => r.howTheListIsBounded],
    ['source', r => r.source], ['url', r => PAGE_URL + '#' + r.id]
  ];

  // RFC 4180: CRLF rows, quotes doubled, fields quoted when needed; the byte-order mark tells Excel it is UTF-8
  function toCSV(rows) {
    const cell = v => {
      const s = v == null ? '' : String(v);
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [CSV_COLUMNS.map(([k]) => k).join(',')]
      .concat(rows.map(r => CSV_COLUMNS.map(([, get]) => cell(get(r))).join(',')));
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }

  function toJSON(rows) {
    const link = id => PAGE_URL + '#' + id;
    const rules = r => (r.boundaryRules.length ? { boundaryRules: r.boundaryRules } : {});
    const sub = r => ({
      id: r.id, level: r.level, name: r.name, description: r.description, example: r.example,
      ...rules(r), source: r.source, url: link(r.id)
    });
    const tech = r => ({
      id: r.id, level: r.level, name: r.name, description: r.description, changes: r.changes, example: r.example,
      ...rules(r), source: r.source, url: link(r.id),
      subTechniques: rows.filter(x => x.level === 'sub-technique' && x.technique.id === r.id).map(sub)
    });
    const cls = r => ({
      id: r.id, level: r.level, name: r.name, description: r.description,
      partItChanges: r.partItChanges, actsOn: r.actsOn, whyItWorks: r.whyItWorks, whatCountersIt: r.whatCountersIt,
      signatureTest: r.signatureTest, techniquesDivideBy: r.techniquesDivideBy, howTheListIsBounded: r.howTheListIsBounded,
      example: r.example, exampleEntry: r.exampleEntry, ...rules(r), source: r.source, url: link(r.id),
      techniques: rows.filter(x => x.level === 'technique' && x.class.id === r.id).map(tech)
    });
    return JSON.stringify({
      name: 'PIAtlas',
      description: 'A construction taxonomy of prompt-injection attacks: classes, techniques and sub-techniques with definitions, worked examples, boundary rules and sources in the paper.',
      paper: $('#paper-title').textContent.trim(),
      citation: $('#bibtex').textContent,
      url: PAGE_URL,
      counts: COUNTS,
      notes: [
        'IDs are stable, and gaps in their numbering are deliberate.',
        'Examples use one benign stand-in: an email assistant told to send notes to mallory@example.com.',
        'Literal strings are marked as Markdown inline code (`...`).',
        'Boundary rules say which entry applies when two seem to fit (Section IV-C and Appendix G).',
        'Illustrations shown on the project page are not from the paper and are not included.'
      ],
      classes: rows.filter(r => r.level === 'class').map(cls)
    }, null, 2) + '\n';
  }

  function toMarkdown(rows) {
    // escape Markdown outside `code` spans
    const md = s => String(s).split(/(`[^`]*`)/g).map(part =>
      part[0] === '`' ? part : part.replace(/[\\*_[\]<>]/g, '\\$&')).join('');
    const sameSource = level => {
      const set = new Set(rows.filter(r => r.level === level).map(r => r.source));
      return set.size === 1 ? Array.from(set)[0] : null;
    };
    const shared = { class: sameSource('class'), technique: sameSource('technique'), 'sub-technique': sameSource('sub-technique') };
    const out = [];
    const add = (...lines) => out.push(...lines);
    const facts = list => list.filter(([, v]) => v).map(([k, v]) => `- **${k}:** ${md(v)}`);
    const tail = r => {
      if (r.boundaryRules.length) add('', '**Boundary rules**', '', ...r.boundaryRules.map(b => '- ' + md(b)));
      if (!shared[r.level]) add('', `*Source: ${md(r.source)}*`);
      add('');
    };

    add(`# PIAtlas taxonomy`, '',
      `${COUNTS.classes} classes, ${COUNTS.techniques} techniques and ${COUNTS.subTechniques} sub-techniques from *${md($('#paper-title').textContent.trim())}*.`, '',
      `- Project page: <${PAGE_URL}>. Every entry has its own link, such as <${PAGE_URL}#F1.T2>.`,
      '- IDs are stable, and gaps in their numbering are deliberate.',
      '- Examples use one benign stand-in: an email assistant told to send notes to `mallory@example.com`.',
      '- Boundary rules say which entry applies when two seem to fit (Section IV-C and Appendix G).');
    const srcLines = [['Classes', shared.class], ['Techniques', shared.technique], ['Sub-techniques', shared['sub-technique']]]
      .filter(([, v]) => v).map(([k, v]) => `- Sources for ${k.toLowerCase()}: ${md(v)}.`);
    add(...srcLines, '', '## Classes', '', '| ID | Class | Part it changes | Techniques |', '| --- | --- | --- | ---: |');
    const cellMd = s => md(s).replace(/\|/g, '\\|');
    TAXONOMY.forEach(c => add(`| ${c.id} | ${cellMd(c.name)} | ${cellMd(c.part)} | ${c.children.length} |`));
    add('');

    rows.forEach(r => {
      if (r.level === 'class') {
        add(`## ${r.id} ${r.name}`, '', md(r.description), '', ...facts([
          ['Part it changes', r.partItChanges], ['Acts on', r.actsOn], ['Why it works', r.whyItWorks],
          ['What counters it', r.whatCountersIt], ['Signature test', r.signatureTest],
          ['Techniques divide by', `${r.techniquesDivideBy}; the list is ${r.howTheListIsBounded}`],
          ['Example', `${r.example} (${r.exampleEntry})`]
        ]));
      } else if (r.level === 'technique') {
        add(`### ${r.id} ${r.name}`, '', md(r.description), '', ...facts([['What it changes', r.changes], ['Example', r.example]]));
      } else {
        add(`#### ${r.id} ${r.name}`, '', md(r.description), '', ...facts([['Example', r.example]]));
      }
      tail(r);
    });
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  }

  const EXPORTS = {
    csv: { file: 'piatlas-taxonomy.csv', type: 'text/csv;charset=utf-8', build: toCSV },
    json: { file: 'piatlas-taxonomy.json', type: 'application/json;charset=utf-8', build: toJSON },
    md: { file: 'piatlas-taxonomy.md', type: 'text/markdown;charset=utf-8', build: toMarkdown }
  };
  const exportFile = fmt => EXPORTS[fmt].build(exportRecords());
  const kb = text => Math.max(1, Math.round(new Blob([text]).size / 1024)) + ' KB';

  function downloadExport(fmt) {
    const x = EXPORTS[fmt];
    const text = exportFile(fmt);
    const url = URL.createObjectURL(new Blob([text], { type: x.type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = x.file;
    a.hidden = true;
    a.addEventListener('click', ev => ev.stopPropagation());   // keep this click away from the page's handlers
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    $('#dl-status').textContent = `Downloading ${x.file}, ${kb(text)}.`;
  }

  function initDownloads() {
    const menu = $('#dl-menu');
    const summary = $('summary', menu);
    // file sizes on the download cards
    Object.keys(EXPORTS).forEach(fmt => {
      const el = $(`[data-size="${fmt}"]`);
      if (el) el.textContent = kb(exportFile(fmt));
    });
    document.addEventListener('click', ev => {
      const b = ev.target.closest('[data-export]');
      if (menu.open && (b || !menu.contains(ev.target))) {
        menu.open = false;
        if (b && menu.contains(b)) summary.focus();
      }
      if (b) downloadExport(b.dataset.export);
    });
    menu.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && menu.open) {
        ev.stopPropagation();
        menu.open = false;
        summary.focus();
      }
    });
    // close when keyboard focus moves on to another control (a click elsewhere is handled above)
    menu.addEventListener('focusout', ev => {
      if (ev.relatedTarget && !menu.contains(ev.relatedTarget)) menu.open = false;
    });
  }

  // ---------------------------------------------------------------- figure: one request, six constructions
  function initBuilder() {
    const allSix = ONE_REQUEST.find(r => !r.cls && /all/.test(r.part)).segments.filter(s => s.c);
    const core = ONE_REQUEST.find(r => r.part === 'none').segments.map(s => s.t).join('');
    const entryOf = {};
    const partOf = {};
    ONE_REQUEST.forEach(r => {
      if (r.cls) { entryOf[r.cls] = r.entry.replace(/\[\[|\]\]/g, ''); partOf[r.cls] = r.part; }
    });
    const active = new Set();
    const chips = $('#builder-chips');
    chips.innerHTML = TAXONOMY.map(c => `
      <button type="button" class="chip-btn" data-c="${c.id}" data-cls="${c.id}" aria-pressed="false" title="${esc(c.name)}">
        <span class="badge">${c.id}</span>${esc(partOf[c.id])}</button>`).join('') +
      '<button type="button" class="chip-btn ghost" data-set="all">All six</button>' +
      '<button type="button" class="chip-btn ghost" data-set="none">Plain request</button>';

    function compose() {
      const out = [];
      let requestPlaced = false;
      allSix.forEach(s => {
        if (s.c === 'F3') {          // the request sits where the F3 rewrite of it sits
          if (requestPlaced) return;
          requestPlaced = true;
          if (active.has('F3')) allSix.filter(x => x.c === 'F3').forEach((x, k) => out.push({ ...x, req: k === 0 }));
          else out.push({ t: core, req: true });
          return;
        }
        if (active.has(s.c)) out.push({ ...s });
      });
      out.forEach((s, i) => {          // the request starts a sentence, or continues "System:" / "then"
        if (!s.req) return;
        const prev = out[i - 1];
        if (!prev || /[.!?’”']$/.test(prev.t)) s.t = s.t[0].toUpperCase() + s.t.slice(1);
        else if (/(:|then)$/.test(prev.t)) s.t = s.t[0].toLowerCase() + s.t.slice(1);
      });
      return out;
    }

    function render() {
      $$('.chip-btn[data-cls]', chips).forEach(b => b.setAttribute('aria-pressed', String(active.has(b.dataset.cls))));
      $('#builder-text').innerHTML = compose().map(s => segHTML([s])).join(' ');
      const on = TAXONOMY.map(c => c.id).filter(c => active.has(c));
      $('#builder-entries').innerHTML = on.length
        ? `<span>Entries:</span> ${on.map(c => chip(entryOf[c])).join(' ')}`
        : `<span>Entry:</span> ${chip('F1.T1')} <span class="muted">the plain command, the default form of an instruction</span>`;
    }

    chips.addEventListener('click', ev => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.cls) { active.has(b.dataset.cls) ? active.delete(b.dataset.cls) : active.add(b.dataset.cls); }
      else if (b.dataset.set === 'all') TAXONOMY.forEach(c => active.add(c.id));
      else active.clear();
      render();
    });
    render();
  }

  // ---------------------------------------------------------------- figure: benchmark coverage heatmap
  const RAMP = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5',
    '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];
  const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lum = rgb => {
    const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrastRatio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  function rampColor(v) {
    // light: near-zero recedes to the light end; dark: near-zero recedes toward the dark surface
    const steps = document.documentElement.getAttribute('data-theme') === 'dark' ? RAMP.slice(3).reverse() : RAMP;
    const t = Math.min(1, Math.max(0, v / 100)) * (steps.length - 1);
    const i = Math.min(Math.floor(t), steps.length - 2);
    const f = t - i;
    const a = hexRGB(steps[i]);
    const b = hexRGB(steps[i + 1]);
    return a.map((x, k) => Math.round(x + (b[k] - x) * f));
  }

  function renderHeat() {
    const ids = TAXONOMY.map(c => c.id);
    const head = `<thead><tr><th scope="col">Source</th><th scope="col" class="num">Templates</th>${TAXONOMY.map(c =>
      `<th scope="col" class="cls" data-c="${c.id}"><span class="badge">${c.id}</span><span class="part">${esc(c.short)}</span></th>`).join('')}<th scope="col" class="cov">Cov.</th></tr></thead>`;
    let body = '<tbody>';
    let prev = null;
    BENCHMARKS.rows.forEach((r, ri) => {
      if (prev && r.group !== prev) body += `<tr class="sep" aria-hidden="true"><td colspan="${ids.length + 3}"></td></tr>`;
      prev = r.group;
      body += `<tr class="${r.group}"><th scope="row">${esc(r.source)}</th><td class="n">${r.n.toLocaleString('en-US')}</td>`;
      ids.forEach(c => {
        const v = r.values[c];
        if (v === 0) {
          body += `<td class="v zero" data-row="${ri}" data-cls="${c}">0</td>`;
        } else {
          const rgb = rampColor(v);
          const L = lum(rgb);
          const fg = contrastRatio(L, 1) >= contrastRatio(L, lum([11, 18, 32])) ? '#FFFFFF' : '#0B1220';
          body += `<td class="v" data-row="${ri}" data-cls="${c}" style="background:rgb(${rgb.join(',')});color:${fg}">${v}</td>`;
        }
      });
      body += `<td class="cov">${esc(r.cov)}</td></tr>`;
    });
    $('#heat').innerHTML = head + body + '</tbody>';
  }

  function initHeat() {
    renderHeat();
    $('#coverage-caption').textContent = 'From Table VI. ' + BENCHMARKS.caption;
    const tip = $('#tooltip');
    const table = $('#heat');
    const show = td => {
      const r = BENCHMARKS.rows[Number(td.dataset.row)];
      const c = byId.get(td.dataset.cls);
      tip.replaceChildren();
      const b = document.createElement('b');
      b.textContent = `${r.values[c.id]}%`;
      const line = document.createElement('span');
      line.className = 'tt-sub';
      line.textContent = `of ${r.source}'s ${r.n.toLocaleString('en-US')} labeled templates carry ${c.id} ${c.name}`;
      tip.append(b, line);
      tip.hidden = false;
    };
    const place = ev => {
      const pad = 14;
      const w = tip.offsetWidth;
      const h = tip.offsetHeight;
      let x = ev.clientX + pad;
      let y = ev.clientY + pad;
      if (x + w > window.innerWidth - 8) x = ev.clientX - w - pad;
      if (y + h > window.innerHeight - 8) y = ev.clientY - h - pad;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    };
    table.addEventListener('pointerover', ev => { const td = ev.target.closest('td.v'); if (td) show(td); });
    table.addEventListener('pointermove', ev => { if (!tip.hidden) place(ev); });
    table.addEventListener('pointerout', ev => { if (!ev.relatedTarget || !ev.relatedTarget.closest || !ev.relatedTarget.closest('td.v')) tip.hidden = true; });
    window.addEventListener('scroll', () => { tip.hidden = true; }, { passive: true });
  }

  // ---------------------------------------------------------------- day / night
  function initTheme() {
    const root = document.documentElement;
    const buttons = $$('.theme-switch [data-theme-set]');
    const scheme = $('meta[name="color-scheme"]');
    const meta = $('meta[name="theme-color"]');
    const apply = (theme, save) => {
      root.setAttribute('data-theme', theme);
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === theme)));
      if (scheme) scheme.setAttribute('content', theme);
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#080D15' : '#1C2840');
      if (save) {
        try { localStorage.setItem('piatlas-theme', theme); } catch (err) { /* storage blocked: still switch */ }
      }
      renderHeat();
    };
    // Day is the default whatever the system setting; the switch saves a choice for later visits
    buttons.forEach(b => b.addEventListener('click', () => apply(b.dataset.themeSet, true)));
    apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
  }

  // ---------------------------------------------------------------- top navigation state
  function initNav() {
    // The current section is the last one whose top has passed 35% of the window height. At the
    // bottom of the page, where the last sections cannot scroll that far, it is the section the
    // visitor jumped to if that section is in view, else the last section.
    const links = $$('.topnav a');
    const ids = links.map(a => a.dataset.nav);
    const sections = ids.map(id => document.getElementById(id));
    let queued = false;
    const update = () => {
      queued = false;
      const vh = window.innerHeight;
      const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
      const jumped = ids.indexOf(location.hash.slice(1));
      let current = null;
      if (atBottom) {
        current = jumped >= 0 && sections[jumped].getBoundingClientRect().top < vh ? ids[jumped] : ids[ids.length - 1];
      } else {
        sections.forEach((el, i) => { if (el.getBoundingClientRect().top <= vh * 0.35) current = ids[i]; });
      }
      links.forEach(a => {
        if (a.dataset.nav === current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('hashchange', queue);
    update();
  }

  // ---------------------------------------------------------------- wiring
  renderMatrix();
  jump.innerHTML = '<span class="jump-label">Jump to</span>' + TAXONOMY.map(c =>
    `<button type="button" data-c="${c.id}" data-jump="${c.id}" title="${esc(c.name)}"><span class="badge">${c.id}</span>${esc(c.short)}</button>`).join('');
  jump.addEventListener('click', ev => {
    const b = ev.target.closest('[data-jump]');
    if (!b) return;
    const col = $(`.col[data-c="${b.dataset.jump}"]`, grid);
    scroller.scrollTo({ left: Math.max(0, col.offsetLeft - 16), behavior: motion() });
  });
  INCIDENTS.forEach((inc, i) => incidentSel.insertAdjacentHTML('beforeend',
    `<option value="${i}">${esc(inc.name)} (${esc(inc.date)})</option>`));

  const params = new URLSearchParams(location.search);
  if (params.get('expand') === 'all') techniques.forEach(t => { if (t.children.length) userOpen.add(t.id); });
  try {
    if (params.get('ids') === '1' || localStorage.getItem('piatlas-ids') === '1') {
      $('#show-ids').checked = true;
      grid.classList.add('show-ids');
    }
  } catch (err) { /* storage unavailable: keep the default */ }
  applyExpansion();

  grid.addEventListener('click', ev => {
    const btn = ev.target.closest('.tgl');
    if (btn) {
      const id = btn.closest('.tech').dataset.id;
      if (btn.getAttribute('aria-expanded') === 'true') { userOpen.delete(id); forcedOpen.delete(id); }
      else userOpen.add(id);
      applyExpansion();
      return;
    }
    const link = ev.target.closest('a[data-id]');
    if (link) lastTrigger = link;
  });

  $('#expand-all').addEventListener('click', () => {
    techniques.forEach(t => { if (t.children.length) userOpen.add(t.id); });
    applyExpansion();
  });
  $('#collapse-all').addEventListener('click', () => {
    userOpen.clear();
    forcedOpen.clear();
    applyExpansion();
  });
  $('#show-ids').addEventListener('change', ev => {
    grid.classList.toggle('show-ids', ev.target.checked);
    fitNames();
    try { localStorage.setItem('piatlas-ids', ev.target.checked ? '1' : '0'); } catch (err) { /* ignore */ }
  });

  let qTimer = null;
  qInput.addEventListener('input', () => { clearTimeout(qTimer); qTimer = setTimeout(runSearch, 90); });
  qInput.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && qInput.value) {
      ev.stopPropagation();
      qInput.value = '';
      runSearch();
    } else if (ev.key === 'Enter') {
      clearTimeout(qTimer);
      runSearch();
      const id = firstHit();
      if (id) { lastTrigger = cellFor(id); location.hash = id; }
    }
  });
  incidentSel.addEventListener('change', onIncident);

  $('#d-close').addEventListener('click', () => closeDetail());
  const copyBtn = $('#d-copy');
  copyBtn.addEventListener('click', async () => {
    if (!currentId) return;
    const ok = await copyText(location.href.split('#')[0] + '#' + currentId);
    copyBtn.classList.toggle('copied', ok);
    copyBtn.setAttribute('aria-label', ok ? 'Link copied' : 'Copy failed');
    copyBtn.title = ok ? 'Link copied' : 'Copy failed';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.setAttribute('aria-label', 'Copy link to this entry');
      copyBtn.title = 'Copy link to this entry';
    }, 1600);
  });
  document.addEventListener('keydown', ev => {
    const typing = ev.target.closest && ev.target.closest('input, textarea, select');
    if (ev.key === 'Escape' && !panel.hidden) closeDetail();
    else if (ev.key === '/' && !typing && !ev.metaKey && !ev.ctrlKey) {
      ev.preventDefault();
      qInput.focus();
    }
  });
  document.addEventListener('click', ev => {
    const a = ev.target.closest('a.chip, .list a[href^="#F"]');
    if (a && !panel.contains(a)) lastTrigger = a;
  });

  $('#copy-bib').addEventListener('click', async ev => {
    const button = ev.currentTarget;
    const ok = await copyText($('#bibtex').textContent);
    flash(button, ok ? 'Copied' : 'Copy failed');
    $('#copy-status').textContent = ok ? 'BibTeX copied to the clipboard.' : 'Copy failed; select the text instead.';
  });

  scroller.addEventListener('scroll', updateScrollHints, { passive: true });
  let fitTimer = null;
  window.addEventListener('resize', () => {
    updateScrollHints();
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitNames, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);
  window.addEventListener('hashchange', onHash);

  initBuilder();
  initHeat();
  initTheme();
  initNav();
  initDownloads();
  updateScrollHints();
  onHash();
})();
