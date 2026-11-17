const REPO = 'https://github.com/Rongkangqi/linux-kernel-lab';
const KEY = 'linux-kernel-lab.progress.v1';
const LAST = 'linux-kernel-lab.last.v1';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (v) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data, completed = new Set(), filter = '全部', taskStep = 0, toastTimer;
const getStored = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const putStored = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { toast('浏览器未允许本地保存，请导出进度备份。'); return false; } };
const docURL = id => `#/docs/${encodeURIComponent(id)}`;
const page = id => data.pages.find(p => p.id === id);
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3800); }
function saveProgress() { putStored(KEY, JSON.stringify({ version: 1, completed: [...completed] })); updateProgress(); }
function updateProgress() {
  $('#rail-count').textContent = `${completed.size} / ${data.pages.length}`;
  $('#rail-fill').style.width = `${100 * completed.size / data.pages.length}%`;
  renderNav();
}
function loadProgress() {
  try { const saved = JSON.parse(getStored(KEY)); if (saved?.version === 1 && Array.isArray(saved.completed)) completed = new Set(saved.completed.filter(id => page(id))); } catch { completed = new Set(); }
}
function routeInfo() {
  const hash = location.hash.slice(1) || '/';
  const [path, query = ''] = hash.split('?');
  return { path, section: new URLSearchParams(query).get('section') };
}
function navLink(url, label, icon, current) {
  return `<a class="nav-link ${current ? 'active' : ''}" href="${url}" ${current ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${icon}</span>${label}</a>`;
}
function renderNav() {
  const { path } = routeInfo();
  let html = `<div class="nav-primary">${navLink('#/', '学习概览', '▦', path === '/')}${navLink('#/roadmap', '学习路线', '⌁', path === '/roadmap')}${navLink('#/labs', '实验手册', '⌘', path === '/labs')}${navLink('#/platforms', '平台地图', '▧', path === '/platforms')}</div>`;
  for (const group of [...new Set(data.pages.map(p => p.group))]) {
    const entries = data.pages.filter(p => p.group === group);
    html += `<div class="nav-section"><div class="nav-label"><span>${esc(group)}</span><span>${String(entries.length).padStart(2,'0')}</span></div>`;
    for (const p of entries) {
      const number = p.title.match(/^(\d\d|L\d\d) · /)?.[1] || '·';
      const label = p.title.replace(/^(\d\d|L\d\d) · /,'');
      const active = path === `/docs/${p.id}`;
      html += `<a class="nav-link ${active ? 'active' : ''}" href="${docURL(p.id)}" ${active ? 'aria-current="page"' : ''}><span class="nav-number">${number}</span><span>${esc(label)}</span>${completed.has(p.id) ? '<span class="nav-check" aria-label="已完成">✓</span>' : ''}</a>`;
    }
    html += '</div>';
  }
  $('#nav').innerHTML = html;
}
function chip() {
  return `<svg class="chip-diagram" viewBox="0 0 350 275" aria-label="从应用，经内核，连接到 ARM64 芯片的学习路径" role="img">
  <defs><pattern id="pins" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M6 0v10" stroke="#8caa7b" stroke-width="3"/></pattern></defs>
  <path class="wire" d="M168 37V9H54v35M184 238v25h110v-40M53 132H12v75h42M289 127h45V52h-42"/>
  <circle class="wire-dot" cx="54" cy="44" r="3"/><circle class="wire-dot" cx="294" cy="223" r="3"/><circle class="wire-dot" cx="54" cy="207" r="3"/><circle class="wire-dot" cx="292" cy="52" r="3"/>
  <rect x="114" y="47" width="120" height="14" fill="url(#pins)"/><rect x="114" y="214" width="120" height="14" fill="url(#pins)"/>
  <g transform="translate(52 76) rotate(90)"><rect width="120" height="14" fill="url(#pins)"/></g><g transform="translate(297 76) rotate(90)"><rect width="120" height="14" fill="url(#pins)"/></g>
  <rect x="56" y="60" width="229" height="155" rx="12" fill="#e2ecd6" stroke="#b4c6a3"/>
  <rect x="66" y="70" width="209" height="135" rx="8" fill="#f2f6e9" stroke="#bdd0a9"/>
  <text x="171" y="92" text-anchor="middle" class="chip-sub">UNDERSTAND THE SYSTEM</text>
  <rect x="85" y="108" width="74" height="39" rx="5" fill="#d0e1bc" stroke="#a4bc8d"/><rect x="171" y="108" width="85" height="39" rx="5" fill="#dde8cf" stroke="#afc49b"/>
  <text x="122" y="132" text-anchor="middle" class="chip-label">ARM64</text><text x="214" y="132" text-anchor="middle" class="chip-label">KERNEL</text>
  <rect x="85" y="159" width="171" height="27" rx="4" fill="#e6eddc" stroke="#c1d1b1"/>
  <text x="171" y="177" text-anchor="middle">TASK · MEMORY · DEVICE</text>
  <rect x="16" y="28" width="77" height="24" rx="4" fill="#f7f9f1" stroke="#c9d8b9"/><text x="54" y="44" text-anchor="middle">USER SPACE</text>
  <rect x="250" y="39" width="84" height="24" rx="4" fill="#f7f9f1" stroke="#c9d8b9"/><text x="292" y="55" text-anchor="middle">EXPERIMENT</text>
  <rect x="14" y="195" width="80" height="24" rx="4" fill="#f7f9f1" stroke="#c9d8b9"/><text x="54" y="211" text-anchor="middle">SOURCE CODE</text>
  <rect x="255" y="211" width="79" height="24" rx="4" fill="#f7f9f1" stroke="#c9d8b9"/><text x="294" y="227" text-anchor="middle">RK3576</text></svg>`;
}
function stageCard(s) {
  return `<a class="stage-card ${completed.has(s.id) ? 'is-complete' : ''}" href="${docURL(s.id)}"><div class="stage-card-top"><span class="stage-number">${s.number}</span><span class="stage-weeks">${s.weeks}</span></div><h3>${s.title}</h3><p>${s.summary}</p><div class="stage-card-bottom"><span>${s.platform}</span><span class="stage-arrow">↗</span></div></a>`;
}
function platformCard(p, large = false) {
  return `<a class="platform-card ${p.color}" href="${docURL(p.id)}"><div class="platform-icon" aria-hidden="true">${({'platform-wsl':'>_','platform-qemu':'{ }','platform-rk3576':'▧','platform-compare':'⇄'})[p.id]}</div><h3>${p.name}</h3><div class="platform-label">${large ? p.arch : p.label}</div><p>${p.role}</p>${large ? `<div class="platform-limit">边界 / ${p.limit}</div>` : ''}<div class="platform-card-bottom"><span>${p.tag}</span><span>↗</span></div></a>`;
}
function sectionHeading(title, en, subtitle, url, action) {
  return `<div class="section-heading"><div><h2>${title}<span>${en}</span></h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${url ? `<a class="text-link" href="${url}">${action} <span>↗</span></a>` : ''}</div>`;
}
function home() {
  const lastId = getStored(LAST);
  const next = page(lastId) || data.pages.find(p => p.kind === 'lab' && !completed.has(p.id)) || page('start');
  const stageDone = data.stages.filter(s => completed.has(s.id)).length;
  return `<div class="welcome-line"><div class="eyebrow">THE KERNEL LEARNING PATH</div><span>每一个结论，都从一次实验开始。</span></div>
  <section class="hero"><div class="hero-copy"><div class="eyebrow">WSL2 → ARM64 → RK3576</div><h1>从一个 <em>task</em>，<br>走进整颗芯片。</h1><p>循着任务、内存与设备的线索，读懂 Linux 内核。<br>再把通用机制，落到真实的 ARM64 芯片上。</p><div class="hero-actions"><a class="button primary" href="${docURL('start')}">开始学习 <span>↗</span></a><a class="text-link" href="#/roadmap">浏览完整路线 <span>→</span></a></div></div><div class="hero-visual">${chip()}</div></section>
  <div class="stats-row"><div class="stat"><div class="stat-label">◷ 参考周期</div><div class="stat-value">32<small>周 / 自定节奏</small></div></div><div class="stat"><div class="stat-label">⌁ 系统学习</div><div class="stat-value">09<small>个阶段</small></div></div><div class="stat"><div class="stat-label">⌘ 实践验证</div><div class="stat-value">09<small>份实验手册</small></div></div><div class="stat"><div class="stat-label">✓ 已完成文档</div><div class="stat-value">${String(completed.size).padStart(2,'0')}<small>/ ${data.pages.length} 篇</small></div></div></div>
  <div class="dashboard-grid"><section class="continue-card"><div class="card-kicker"><span class="live-dot"></span> CONTINUE LEARNING</div><span class="step-circle">↗</span><h2>${esc(next.title)}</h2><p>${esc(next.summary)}。先写预测，再运行实验；让结果成为理解的证据。</p><div class="continue-bottom"><div class="continue-meta"><span>▧ ${next.platform}</span><span>◷ ${next.minutes ? `约 ${next.minutes} 分钟` : '按自己的节奏'}</span></div><a class="button light" href="${docURL(next.id)}">${lastId ? '继续阅读' : '打开第一个实验'} <span>→</span></a></div></section><section class="weekly-card"><div class="card-kicker">THIS WEEK / 第一周</div><h3>先把实验台搭好</h3><p>每周建议 5–8 小时。按验收推进，不用追赶日历。</p><div class="mini-checklist"><span>记录环境与源码版本</span><span>完成 PID / TID 观察</span><span>交付一份实验笔记</span></div></section></div>
  ${sectionHeading('一条主线，九个阶段','THE ROADMAP',`从可观察的现象，走向可解释的机制 · 阶段验收 ${stageDone} / 9`,'#/roadmap','查看周计划')}
  <div class="route-grid">${data.stages.map(stageCard).join('')}</div>
  ${sectionHeading('在合适的平台，验证合适的问题','THE PLATFORMS','','#/platforms','了解平台边界')}
  <div class="platform-grid">${data.platforms.map(p => platformCard(p)).join('')}</div>
  <section class="mechanism"><div><div class="card-kicker">A SMALL MENTAL MODEL</div><h3>被唤醒，不等于正在运行。</h3><p>一个等待数据的任务，要先变为可运行，再由调度器安排到 CPU。点一下，看看状态如何变化。</p><a class="text-link" href="${docURL('lab-wait')}">用管道实验验证 <span>↗</span></a></div><div><div class="state-row" aria-label="任务状态模型"><span class="state-node" data-state="0">sleeping</span><span class="state-arrow">→</span><span class="state-node" data-state="1">runnable</span><span class="state-arrow">→</span><span class="state-node" data-state="2">running</span></div><div class="mechanism-caption" id="state-caption" aria-live="polite"></div><div class="mechanism-controls"><button class="button small-button" id="state-next">发布事件，唤醒任务 →</button><button class="text-button" id="state-reset">重置</button></div></div></section>`;
}
function roadmap() {
  return `<div class="page-header"><div class="eyebrow">THE COMPLETE ROADMAP</div><h1>把内核，学成一条线。</h1><p>从一个用户请求出发，逐步连接任务、内存、架构与设备。32 周是参考安排；每一阶段，都有可检查的产出。</p><div class="page-header-actions"><a class="button primary" href="${docURL('roadmap')}">展开每周计划 ↗</a><a class="text-link" href="${docURL('method')}">学习方法 →</a></div></div><div class="roadmap-note"><span><strong>5–8 小时 / 周</strong> · 先掌握机制，再深入版本实现。完成阶段验收后继续。</span><a class="text-link" href="${docURL('capstone')}">看看最终能力目标 ↗</a></div><div class="roadmap-list">${data.stages.map(s => `<article class="roadmap-stage"><a class="roadmap-index" href="${docURL(s.id)}">${s.number}</a><div class="roadmap-main"><div class="roadmap-topline"><span>${s.weeks}</span><span>${s.platform}</span>${completed.has(s.id) ? '<span>✓ 文档已完成</span>' : ''}</div><h2><a href="${docURL(s.id)}">${s.title}</a></h2><p>${s.summary}</p><div class="topic-list">${s.topics.map(t => `<span>${t}</span>`).join('')}</div></div><div class="roadmap-deliverable"><span>阶段交付 / OUTCOME</span><p>${s.outcome}</p><a class="text-link" href="${docURL(s.id)}">进入阶段 →</a></div></article>`).join('')}</div>`;
}
function platforms() {
  return `<div class="page-header"><div class="eyebrow">FROM SOFTWARE TO SILICON</div><h1>同一个机制，四种观察视角。</h1><p>先在 WSL 中建立通用模型，再用 QEMU 获得可控内核，最后走进 RK3576 实机。RK3588 用作文档对照，无需先购买第二块板。</p></div><div class="platforms-large">${data.platforms.map(p => platformCard(p,true)).join('')}</div>${sectionHeading('不要把这四层混在一起','FOUR LAYERS','理解芯片架构，从分清问题所属层次开始。')}<div class="layer-stack"><div class="layer"><span>01 / ARCHITECTURE</span><h3>AArch64 架构</h3><p>指令、权限、异常与地址转换的规则。</p></div><div class="layer"><span>02 / CPU CORE</span><h3>Cortex 微架构</h3><p>执行、流水线、Cache 与具体实现。</p></div><div class="layer"><span>03 / SYSTEM ON CHIP</span><h3>RK3576 芯片</h3><p>CPU、DDR、互连、中断与外设的集成。</p></div><div class="layer"><span>04 / BOARD</span><h3>你的开发板</h3><p>供电、连接、启动介质、板级 DT 与 BSP。</p></div></div>`;
}
function labs() {
  const entries = data.pages.filter(p => p.kind === 'lab' && (filter === '全部' || p.platform === filter));
  return `<div class="page-header"><div class="eyebrow">OBSERVE. EXPLAIN. VERIFY.</div><h1>让机制，发生在眼前。</h1><p>每份实验都有预测、操作、观察、反例和验收。前期从 WSL 开始；架构和芯片实验需要相应环境，不把读过文档等同于验证完成。</p></div><div class="filter-bar" aria-label="按实验平台筛选">${['全部','WSL2','QEMU','RK3576'].map(f => `<button class="filter-button ${filter === f ? 'active' : ''}" data-filter="${f}" aria-pressed="${filter === f}">${f === '全部' ? '全部实验' : f}</button>`).join('')}<span class="filter-count">${String(entries.length).padStart(2,'0')} LABS</span></div><div class="lab-list">${entries.map(p => `<a class="lab-card" href="${docURL(p.id)}"><div class="lab-index">${p.title.slice(0,3)}</div><div><h3>${esc(p.title.slice(6))} ${completed.has(p.id) ? '✓' : ''}</h3><p>${esc(p.summary)}</p></div><div class="lab-meta"><span class="tag ${p.platform === 'RK3576' ? 'amber' : 'teal'}">${p.platform}</span><span>约 ${p.minutes} 分钟 ↗</span></div></a>`).join('')}</div>`;
}
function doc(p) {
  const index = data.pages.indexOf(p), prev = data.pages[index-1], next = data.pages[index+1];
  return `<div class="doc-layout"><article class="doc-article"><div class="doc-meta"><a href="#/">学习空间</a><span>/</span><span>${p.group}</span><span class="tag">${p.platform}</span></div><h1 class="doc-title">${esc(p.title)}</h1><p class="doc-subtitle">${esc(p.summary)}</p><div class="doc-actions"><button class="complete-button" id="complete-doc" data-id="${p.id}" aria-pressed="${completed.has(p.id)}"><span class="complete-symbol">${completed.has(p.id) ? '✓' : ''}</span>${completed.has(p.id) ? '已完成自测' : '通过自测，标记完成'}</button><a class="doc-source" href="${REPO}/blob/main/${p.source}" target="_blank" rel="noopener noreferrer">在 GitHub 阅读 ↗</a></div><div class="prose">${p.html.replace(/^<h1[^>]*>.*?<\/h1>\s*/,'')}</div><nav class="doc-pagination" aria-label="相邻文档">${prev ? `<a href="${docURL(prev.id)}"><small>← 上一篇</small><span>${esc(prev.title)}</span></a>` : '<span></span>'}${next ? `<a class="next" href="${docURL(next.id)}"><small>下一篇 →</small><span>${esc(next.title)}</span></a>` : ''}</nav><p class="doc-feedback">文档基线：2026-11-17 · 机制说明请结合实际源码版本。实机实验需按自己的板型与 BSP 验证。<br>发现问题？可在 GitHub 提交 Issue，并附上版本、命令与证据。</p></article><aside class="doc-toc" aria-label="本页目录"><div class="toc-title">ON THIS PAGE / 本页</div>${p.toc.map(t => `<a class="depth-${t.depth}" href="${docURL(p.id)}?section=${t.id}">${esc(t.title)}</a>`).join('')}<div class="doc-toc-bottom">先预测 · 再实验 · 回到源码<br>用自己的话，解释发生了什么。</div></aside></div>`;
}
function render() {
  const { path, section } = routeInfo();
  let html, title = '学习概览';
  if (path === '/') html = home();
  else if (path === '/roadmap') { html = roadmap(); title = '学习路线'; }
  else if (path === '/platforms') { html = platforms(); title = '平台地图'; }
  else if (path === '/labs') { html = labs(); title = '实验手册'; }
  else if (path.startsWith('/docs/')) {
    let id; try { id = decodeURIComponent(path.slice(6)); } catch { id = ''; }
    const p = page(id);
    if (p) { html = doc(p); title = p.title; putStored(LAST,p.id); }
  }
  if (!html) { html = '<div class="page-header"><div class="eyebrow">404 / PAGE NOT FOUND</div><h1>这条路径还没有文档。</h1><p>可以从学习路线继续，或搜索一个概念。</p><a class="button primary" href="#/roadmap">回到学习路线 →</a></div>'; title = '文档未找到'; }
  $('#main').innerHTML = html;
  $('#breadcrumb').innerHTML = `学习空间 <span>/</span> ${esc(title)}`;
  document.title = `${title} · Linux Kernel Lab`;
  renderNav(); closeDrawer();
  if (path === '/') updateState();
  $$('.prose table').forEach(table => { const wrapper = document.createElement('div'); wrapper.className='table-wrap'; wrapper.tabIndex=0; wrapper.setAttribute('role','region'); wrapper.setAttribute('aria-label','可横向滚动的表格'); table.before(wrapper); wrapper.append(table); });
  $$('.prose pre').forEach(pre => {
    const code = $('code',pre); if (!code) return;
    const label = document.createElement('span'); label.className='code-label'; label.textContent=code.className.replace('language-','') || 'TEXT';
    const button = document.createElement('button'); button.className='copy-code'; button.textContent='复制'; button.setAttribute('aria-label','复制这段代码');
    button.addEventListener('click',async () => { try { await navigator.clipboard.writeText(code.textContent); button.textContent='已复制 ✓'; setTimeout(() => { button.textContent='复制'; },1800); } catch { toast('无法自动复制，请选中代码手动复制。'); } }); pre.append(label,button);
  });
  $$('.prose a[href^="http"]').forEach(a => { a.target='_blank'; a.rel='noopener noreferrer'; });
  if (section && /^section-\d+$/.test(section)) requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView());
  else window.scrollTo({top:0,behavior:'instant'});
}
function updateState() {
  $$('.state-node').forEach((node,i) => { node.classList.toggle('active',i===taskStep); node.setAttribute('aria-current',i===taskStep ? 'step' : 'false'); });
  $('#state-caption').textContent = ['等待数据：条件不满足，任务睡眠。','数据到达：任务已可运行，仍可能在等待 CPU。','获得 CPU：调度器选择任务，继续检查条件并执行。'][taskStep];
  $('#state-next').textContent = ['发布事件，唤醒任务 →','调度到 CPU →','再次等待数据 ↻'][taskStep];
}
function closeDrawer() { $('#sidebar').classList.remove('open'); $('#backdrop').hidden=true; $('#menu-toggle').setAttribute('aria-expanded','false'); }
function openSearch() { $('#search-dialog').showModal(); search(); $('#search-input').focus(); }
function search() {
  const query = $('#search-input').value.trim().toLocaleLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  const matches = data.pages.filter(p => terms.every(t => `${p.title} ${p.summary} ${p.text}`.toLocaleLowerCase().includes(t)));
  if (query) matches.sort((a,b) => Number(b.title.toLocaleLowerCase().includes(query))-Number(a.title.toLocaleLowerCase().includes(query)));
  const results = query ? matches.slice(0,12) : ['start','lab-pid','tasks','arm64','drivers'].map(page);
  $('#search-results').innerHTML = results.length ? results.map(p => `<a class="search-result" href="${docURL(p.id)}"><strong>${esc(p.title)}</strong><small>${p.group}</small><p>${esc(p.summary)}</p></a>`).join('') : '<div class="search-no-result">没有找到相关文档。试试“任务”“MMU”或“DMA”。</div>';
}
function showProgress() {
  $('#progress-message').textContent = `已完成 ${completed.size} / ${data.pages.length} 篇文档的自测，${data.stages.filter(s => completed.has(s.id)).length} / 9 个阶段指南。`;
  $('#progress-list').innerHTML = data.pages.filter(p => completed.has(p.id)).map(p => `<div class="progress-doc"><a href="${docURL(p.id)}">✓ ${esc(p.title)}</a><button data-uncomplete="${p.id}" aria-label="取消完成：${esc(p.title)}">撤销</button></div>`).join('') || '<p class="small muted">从 L01 开始，完成实验与自测后再做标记。</p>';
}
function attachEvents() {
  window.addEventListener('hashchange',render);
  $('.skip-link').addEventListener('click',e => { e.preventDefault(); $('#main').focus(); });
  $('#nav').addEventListener('click',e => { if (e.target.closest('a')) closeDrawer(); });
  $('#menu-toggle').addEventListener('click',() => { const open = !$('#sidebar').classList.contains('open'); $('#sidebar').classList.toggle('open',open); $('#backdrop').hidden=!open; $('#menu-toggle').setAttribute('aria-expanded',String(open)); });
  $('#backdrop').addEventListener('click',closeDrawer);
  $('#search-open').addEventListener('click',openSearch); $('#mobile-search').addEventListener('click',openSearch);
  $('#search-input').addEventListener('input',search);
  $('#progress-open').addEventListener('click',() => { showProgress(); $('#progress-dialog').showModal(); });
  $$('[data-close]').forEach(b => b.addEventListener('click',() => document.getElementById(b.dataset.close).close()));
  document.addEventListener('keydown',e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k') { e.preventDefault(); if (!$('#search-dialog').open) openSearch(); }
    if (e.key==='Escape') closeDrawer();
    if ($('#search-dialog').open && ['ArrowDown','ArrowUp'].includes(e.key)) {
      const links = $$('.search-result'); if (!links.length) return;
      const current = links.indexOf(document.activeElement); const next = e.key==='ArrowDown' ? (current+1)%links.length : (current-1+links.length)%links.length;
      e.preventDefault(); links[next].focus();
    }
  });
  document.addEventListener('click',e => {
    if (e.target.closest('.search-result') || e.target.closest('.progress-doc a')) { $('#search-dialog').close(); $('#progress-dialog').close(); }
    const complete = e.target.closest('#complete-doc');
    if (complete) { const id=complete.dataset.id; if (completed.has(id)) completed.delete(id); else completed.add(id); saveProgress(); const y=window.scrollY; render(); window.scrollTo({top:y,behavior:'instant'}); $('#complete-doc').focus({preventScroll:true}); toast(completed.has(id) ? '已记录完成，继续用实验检验理解。' : '已取消完成标记。'); }
    const f=e.target.closest('[data-filter]'); if (f) { filter=f.dataset.filter; render(); $(`[data-filter="${filter}"]`).focus({preventScroll:true}); }
    if (e.target.closest('#state-next')) { taskStep=(taskStep+1)%3; updateState(); }
    if (e.target.closest('#state-reset')) { taskStep=0; updateState(); }
    const undo=e.target.closest('[data-uncomplete]'); if (undo) { completed.delete(undo.dataset.uncomplete); saveProgress(); render(); showProgress(); }
  });
  $('#export-progress').addEventListener('click',() => {
    const value = { version:1, exportedAt:new Date().toISOString(), completed:[...completed] };
    const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='linux-kernel-lab-progress.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); toast('进度备份已导出。');
  });
  $('#import-progress').addEventListener('click',() => $('#progress-file').click());
  $('#progress-file').addEventListener('change',async e => {
    const file=e.target.files[0]; if (!file) return;
    try {
      if (file.size>100000) throw new Error('size'); const saved=JSON.parse(await file.text());
      if (saved.version!==1 || !Array.isArray(saved.completed) || !saved.completed.every(id=>typeof id==='string' && !!page(id))) throw new Error('format');
      saved.completed.forEach(id=>completed.add(id)); saveProgress(); showProgress(); render(); toast('已合并导入的学习进度。');
    } catch { toast('备份格式无效，请选择本站导出的 JSON 文件。'); }
    e.target.value='';
  });
  $('#reset-progress').addEventListener('click',() => { if (confirm('清空此浏览器中全部完成标记？已导出的备份不受影响。')) { completed.clear(); saveProgress(); showProgress(); render(); toast('完成标记已清空。'); } });
  window.addEventListener('storage',e => { if (e.key===KEY) { loadProgress(); updateProgress(); render(); if ($('#progress-dialog').open) showProgress(); } });
}
async function init() {
  try {
    const response=await fetch('./content.json'); if (!response.ok) throw new Error('content');
    data=await response.json(); loadProgress(); updateProgress(); attachEvents(); render();
  } catch {
    $('#main').innerHTML='<div class="error-message"><h1>文档暂时未能载入。</h1><p>请检查网络后刷新页面，也可以直接阅读 GitHub 中的 Markdown 文档。</p><a class="button primary" href="https://github.com/Rongkangqi/linux-kernel-lab/tree/main/docs">打开 GitHub 文档 ↗</a></div>';
  }
}
init();
