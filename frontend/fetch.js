/* ============================================================
   Source Finder — client
   ============================================================ */

const API = 'http://localhost:8000';

const state = {
  query: '',
  papers: [],
  sort: 'relevance',
  synthesis: null,   // set only when per-paper appraisals could not be split out
};

const SORTS = {
  relevance: p => -p.RelevanceScore,
  citations: p => -(p.CitationCount || 0),
  year:      p => -(p.Year || 0),
};

/* ---------- helpers ---------- */

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text == null ? '' : text).replace(/[&<>"']/g, m => map[m]);
}

// Statistical-table convention: no leading zero on a value that cannot exceed 1.
function formatScore(score) {
  const s = Math.max(0, Math.min(1, Number(score) || 0));
  return s.toFixed(3).replace(/^0/, '');
}

function meter(score) {
  const filled = Math.round(Math.max(0, Math.min(1, Number(score) || 0)) * 10);
  let ticks = '';
  for (let i = 0; i < 10; i++) ticks += `<i class="${i < filled ? 'on' : ''}"></i>`;
  return `<div class="meter" aria-hidden="true">${ticks}</div>`;
}

const ordinal = i => String(i + 1).padStart(2, '0');

/* ---------- LLM appraisal: split the numbered list back onto its papers ----------
   The system prompt asks for "a numbered list, one entry per paper, in the order
   provided", so entry n belongs to papers[n-1]. Attach each appraisal to its own
   paper; fall back to one whole-set synthesis if the shape isn't what we expect. */

function attachAppraisals(papers, summary) {
  if (!summary) return null;

  const marks = [];
  const re = /(?:^|\n)[ \t]*(?:\*\*)?(\d{1,3})[.)][ \t]+/g;
  let m;
  while ((m = re.exec(summary)) !== null) {
    marks.push({ n: parseInt(m[1], 10), start: m.index, end: re.lastIndex });
  }

  const usable =
    marks.length >= 2 &&
    marks.every((mk, i) => mk.n === i + 1) &&
    marks.length <= papers.length;

  if (!usable) return summary.trim();

  marks.forEach((mk, i) => {
    const stop = i + 1 < marks.length ? marks[i + 1].start : summary.length;
    papers[mk.n - 1]._appraisal = summary.slice(mk.end, stop).trim();
  });
  return null;
}

// Minimal renderer for the **Label:** ... structure the prompt asks for.
function renderAppraisal(text) {
  return text
    .split(/\n{2,}|\n(?=\s*\*\*)/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => {
      const head = block.match(/^\*\*(.+?)\*\*:?\s*/);
      if (head) {
        const rest = block.slice(head[0].length).replace(/\*\*/g, '');
        return `<p><span class="heading">${escapeHtml(head[1])}</span>${escapeHtml(rest)}</p>`;
      }
      return `<p>${escapeHtml(block.replace(/\*\*/g, ''))}</p>`;
    })
    .join('');
}

/* ---------- render ---------- */

function render() {
  const papers = [...state.papers].sort((a, b) => SORTS[state.sort](a) - SORTS[state.sort](b));

  const entries = papers.map((paper, i) => {
    const year = paper.Year ? `<span>Year <b>${paper.Year}</b></span>` : '';
    const cites = Number.isFinite(paper.CitationCount)
      ? `<span>Cited <b>${paper.CitationCount.toLocaleString()}</b></span>`
      : '';

    const abstract = paper.Abstract
      ? `<p class="abstract clamped" id="abs-${i}">${escapeHtml(paper.Abstract)}</p>`
      : `<p class="abstract abstract--none">No abstract deposited &mdash; scored on title alone.</p>`;

    const link = paper.URL
      ? `<a href="${escapeHtml(paper.URL)}" target="_blank" rel="noopener">Semantic Scholar &#8599;</a>`
      : '';
    const expand = paper.Abstract
      ? `<button type="button" data-expand="${i}">Full abstract</button>`
      : '';
    const appraise = paper._appraisal
      ? `<button type="button" class="primary" data-appraise="${paper.__id}">Read appraisal</button>`
      : '';

    return `
      <article class="entry">
        <div class="entry__rail">
          <div class="entry__ord">${ordinal(i)}</div>
          <div class="entry__score">${formatScore(paper.RelevanceScore)}</div>
          ${meter(paper.RelevanceScore)}
        </div>
        <div class="entry__body">
          <h3 class="entry__title">${
            paper.URL
              ? `<a href="${escapeHtml(paper.URL)}" target="_blank" rel="noopener">${escapeHtml(paper.Title)}</a>`
              : escapeHtml(paper.Title)
          }</h3>
          <div class="apparatus label">${year}${cites}</div>
          ${abstract}
          <div class="actions">${link}${expand}${appraise}</div>
        </div>
      </article>`;
  }).join('');

  const synthesis = state.synthesis ? `
    <div class="synthesis">
      <span class="label">Appraisal of the full set</span>
      <button type="button" class="primary" data-appraise="set"
        style="font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
               background:none;border:0;border-bottom:1px solid var(--vermillion);color:var(--ink);
               cursor:pointer;padding:0 0 2px">Read appraisal</button>
    </div>` : '';

  const sortButton = (key, text) =>
    `<button type="button" data-sort="${key}" aria-pressed="${state.sort === key}">${text}</button>`;

  document.getElementById('results').innerHTML = `
    ${synthesis}
    <section class="index">
      <div class="index__head">
        <span class="label">${papers.length} record${papers.length === 1 ? '' : 's'} &middot; &ldquo;${escapeHtml(state.query)}&rdquo;</span>
        <div class="sorts">
          ${sortButton('relevance', 'Relevance')}
          ${sortButton('citations', 'Citations')}
          ${sortButton('year', 'Year')}
        </div>
      </div>
      <div class="entries">${entries}</div>
    </section>`;
}

function showStatus(kind, label, body) {
  document.getElementById('results').innerHTML = `
    <section class="status ${kind === 'error' ? 'status--error' : ''}">
      <div class="label">${label}</div>
      <p>${body}</p>
    </section>`;
}

/* ---------- modal ---------- */

function openAppraisal(id) {
  const paper = id === 'set' ? null : state.papers.find(p => p.__id === id);
  const text = paper ? paper._appraisal : state.synthesis;
  const index = paper ? state.papers.indexOf(paper) : -1;

  document.getElementById('modalOrd').textContent = paper ? ordinal(index) : '§';
  document.getElementById('modalKicker').textContent = paper ? 'Appraisal' : 'Appraisal of the full set';
  document.getElementById('modalTitle').textContent = paper ? paper.Title : `“${state.query}”`;
  document.getElementById('modalBody').innerHTML = renderAppraisal(text || '');
  document.getElementById('modal').hidden = false;
}

function closeModal() { document.getElementById('modal').hidden = true; }

/* ---------- search ---------- */

async function runSearch(query, limit, includeLLM) {
  const button = document.getElementById('submit');
  button.disabled = true;
  button.textContent = 'Working';

  state.query = query;
  showStatus('wait', 'Querying', `Retrieving records for &ldquo;${escapeHtml(query)}&rdquo;, then embedding
    and scoring each one.${includeLLM ? ' An LLM appraisal follows.' : ''}<span class="caret"></span>`);

  try {
    const response = await fetch(`${API}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit, include_llm: includeLLM }),
    });
    const data = await response.json();

    if (!response.ok) {
      showStatus('error', 'Request failed', escapeHtml(data.detail || response.statusText));
      return;
    }
    if (!data.results || data.results.length === 0) {
      showStatus('wait', 'No records', `Semantic Scholar returned nothing for
        &ldquo;${escapeHtml(query)}&rdquo;. Try broader terms.`);
      return;
    }

    data.results.forEach((p, i) => { p.__id = 'p' + i; });
    state.papers = data.results;
    state.sort = 'relevance';
    state.synthesis = attachAppraisals(state.papers, data.llm_summary);
    render();
  } catch (error) {
    showStatus('error', 'No connection', `Could not reach the API at ${API}. ` +
      escapeHtml(error.message));
  } finally {
    button.disabled = false;
    button.textContent = 'Search';
  }
}

/* ---------- wiring ---------- */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('form').addEventListener('submit', e => {
    e.preventDefault();
    runSearch(
      document.getElementById('query').value.trim(),
      parseInt(document.getElementById('limit').value, 10),
      document.getElementById('llm').checked
    );
  });

  // One delegated listener for every control inside the results region.
  document.getElementById('results').addEventListener('click', e => {
    const target = e.target.closest('[data-sort], [data-expand], [data-appraise]');
    if (!target) return;

    if (target.dataset.sort) {
      state.sort = target.dataset.sort;
      render();
    } else if (target.dataset.expand !== undefined) {
      const abs = document.getElementById('abs-' + target.dataset.expand);
      const clamped = abs.classList.toggle('clamped');
      target.textContent = clamped ? 'Full abstract' : 'Collapse';
    } else {
      openAppraisal(target.dataset.appraise);
    }
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ?demo=1 loads fixture data so the layout can be worked on without hitting
  // Semantic Scholar or spending OpenAI calls. demo.js is fetched only then.
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') {
    const script = document.createElement('script');
    script.src = 'demo.js';
    script.onload = () => {
      document.getElementById('query').value = window.DEMO.query;
      document.getElementById('llm').checked = true;
      state.query = window.DEMO.query;
      window.DEMO.results.forEach((p, i) => { p.__id = 'p' + i; });
      state.papers = window.DEMO.results;
      state.synthesis = attachAppraisals(state.papers, window.DEMO.llm_summary);
      render();
      // &open=N opens entry N's appraisal straight away, for inspecting the modal.
      if (params.has('open')) openAppraisal('p' + (parseInt(params.get('open'), 10) - 1));
    };
    document.head.appendChild(script);
  }
});
