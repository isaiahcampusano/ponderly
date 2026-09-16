const KEY = 'ponderly-votes-v1';
let debates = [];
let stories = {};
let state = JSON.parse(localStorage.getItem(KEY) || '{"votes":{},"total":0,"streak":0,"last":""}');

const save = () => {
  localStorage.setItem(KEY, JSON.stringify(state));
  document.querySelectorAll('[data-streak]').forEach((element) => {
    element.textContent = `🔥 ${state.streak}-day streak · ${state.total} votes`;
    element.classList.toggle('show', state.total > 0);
  });
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function storyPanel(d) {
  const story = stories[d.slug];
  if (!story) return '';
  const image = story.image;
  const srcset = image && image.srcset
    ? (Array.isArray(image.srcset) ? image.srcset.join(', ') : image.srcset)
    : '';
  const imageMarkup = image ? `
    <figure class="story-figure">
      <div class="story-image-frame">
        <img src="${escapeHtml(image.src)}"${srcset ? ` srcset="${escapeHtml(srcset)}"` : ''}
          alt="${escapeHtml(image.alt || '')}" loading="lazy" decoding="async">
        <div class="story-image-fallback" aria-hidden="true">Ponderly story</div>
      </div>
      ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ''}
    </figure>` : '';
  return `<details class="story-panel">
    <summary>Read a story<span aria-hidden="true">↗</span></summary>
    <div class="story-content">
      ${imageMarkup}
      <div><div class="eyebrow">${escapeHtml(story.perspective || 'Perspective')}</div>
      <h4>${escapeHtml(story.title)}</h4><p>${escapeHtml(story.story)}</p></div>
    </div>
  </details>`;
}

function vote(id, choice, root) {
  const d = debates.find((item) => item.slug === id);
  if (!d) return;
  const prior = state.votes[id];
  if (!prior) {
    state.total++;
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    state.streak = state.last === yesterday ? state.streak + 1 : 1;
    state.last = new Date().toISOString().slice(0, 10);
    state.votes[id] = choice;
  }
  const total = d.votes + (prior ? 0 : 1);
  const agree = d.agreePct / 100 * d.votes + (prior ? 0 : choice === 'agree' ? 1 : 0);
  const pct = Math.round(agree / total * 100);
  root.querySelector('.vote-buttons').style.display = 'none';
  root.querySelector('.result').classList.add('show');
  root.querySelector('.agree-fill').style.width = `${pct}%`;
  root.querySelector('[data-agree]').textContent = `${pct}% Agree`;
  root.querySelector('[data-disagree]').textContent = `${100 - pct}% Disagree`;
  root.querySelector('[data-choice]').textContent = `You voted ${choice === 'agree' ? 'Agree' : 'Disagree'}. ${choice === 'agree' ? pct : 100 - pct}% of readers agree with you.`;
  save();
}

function card(d, hero = false) {
  return `<div class="${hero ? 'vote-card' : 'debate-card'}" data-id="${escapeHtml(d.slug)}">
    <div class="category">${hero ? 'Ponderly' : escapeHtml(d.category)}</div>
    <h${hero ? 2 : 3}>${escapeHtml(d.statement)}</h${hero ? 2 : 3}>
    ${hero ? `<div class="vote-buttons"><button data-v="agree">Agree</button><button data-v="disagree">Disagree</button></div>
      <div class="result"><div class="result-bar"><span class="agree-fill" style="width:${d.agreePct}%"></span></div>
      <div class="result-labels"><span data-agree>${d.agreePct}% Agree</span><span data-disagree>${d.disagreePct}% Disagree</span></div>
      <div class="meta">${(d.votes / 1000).toFixed(1)}k votes · <span data-choice></span></div></div>
      ${storyPanel(d)}<a class="view-more" href="article/${escapeHtml(d.slug)}/">Read both sides →</a>`
      : `<div class="result-bar"><span class="agree-fill" style="width:${d.agreePct}%"></span></div>
      <div class="result-labels"><span>${d.agreePct}%</span><span>${d.disagreePct}%</span></div>
      <div class="meta">${(d.votes / 1000).toFixed(1)}k votes</div>${storyPanel(d)}`}
  </div>`;
}

function bindStoryImages(root = document) {
  root.querySelectorAll('.story-figure img').forEach((image) => {
    image.addEventListener('error', () => {
      image.closest('.story-image-frame').classList.add('image-failed');
      image.remove();
    }, { once: true });
  });
}

function setSocialImage(story) {
  if (!story || !story.image || !story.image.src) return;
  document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((meta) => meta.remove());
  [['property', 'og:image'], ['name', 'twitter:image']].forEach(([attribute, value]) => {
    const meta = document.createElement('meta');
    meta.setAttribute(attribute, value);
    meta.content = new URL(story.image.src, document.baseURI).href;
    document.head.appendChild(meta);
  });
}

function feed(items) {
  const element = document.querySelector('#feed');
  if (element) {
    element.innerHTML = items.map((item) => card(item)).join('');
    bindStoryImages(element);
  }
}

async function init() {
  [debates, stories] = await Promise.all([
    fetch('data/debates.json').then((response) => response.json()),
    fetch('data/stories.json').then((response) => response.json())
  ]);
  const slug = location.pathname.match(/article\/([^/]+)/)?.[1];
  if (slug) {
    const d = debates.find((item) => item.slug === slug);
    if (!d) return;
    document.title = `${d.statement} — Ponderly`;
    setSocialImage(stories[d.slug]);
    document.querySelector('#article').innerHTML = `<div class="category">${escapeHtml(d.category)} · ${escapeHtml(d.date)}</div>
      <h1>${escapeHtml(d.statement)}</h1>${card(d, true).replace('class="vote-card"', 'class="vote-card article-vote"')}
      <div class="cases"><section class="case"><div class="eyebrow">The case for</div><h2>Could this be true?</h2><p>${escapeHtml(d.caseFor)}</p></section>
      <section class="case against"><div class="eyebrow">The case against</div><h2>What might we miss?</h2><p>${escapeHtml(d.caseAgainst)}</p></section></div>
      <h2>Related debates</h2><div class="grid">${debates.filter((item) => item.slug !== d.slug).slice(0, 3).map((item) => card(item)).join('')}</div>`;
    const article = document.querySelector('.article-vote');
    bindVote(d, article);
    bindStoryImages(document.querySelector('#article'));
  } else {
    const hero = document.querySelector('#hero');
    if (hero) {
      let index = 0;
      const render = () => {
        hero.innerHTML = card(debates[index], true);
        bindVote(debates[index], hero);
        bindStoryImages(hero);
      };
      render();
      document.querySelector('#refresh').onclick = () => { index = (index + 1) % debates.length; render(); };
    }
    feed(debates);
    const chips = document.querySelector('#chips');
    if (chips) {
      chips.innerHTML = [...new Set(debates.map((item) => item.category))].map((category) => `<button class="chip">${escapeHtml(category)}</button>`).join('');
      chips.querySelectorAll('button').forEach((button) => button.onclick = () => {
        chips.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        feed(debates.filter((item) => item.category === button.textContent));
      });
    }
  }
  save();
}

function bindVote(d, root) {
  root.querySelectorAll('[data-v]').forEach((button) => button.onclick = () => vote(d.slug, button.dataset.v, root));
}

init();
