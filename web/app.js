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
function sectionHeading(title, url, action) {
  return `<div class="section-heading"><h2>${title}</h2>${url ? `<a class="text-link" href="${url}">${action}</a>` : ''}</div>`;
}
function atlasCard(p) {
  return `<a class="atlas-card" href="${docURL(p.id)}"><span class="card-meta">${p.label}</span><h3>${p.name}</h3><p>${p.role}</p><div class="atlas-foot"><span>${p.arch}</span><span>${p.tag}</span></div></a>`;
}
function home() {
  const last = page(getStored(LAST));
  const next = last || page('start');
  const courses = [
    {period:'第 1–14 周', title:'Linux 内核基础', text:'在 RK3576 上追踪进程、缺页和 I/O，读懂一次系统调用经过的内核对象。',id:'foundations', mark:'task_struct'},
    {period:'第 15–32 周', title:'架构与板级开发', text:'用 K230 对照 ARM64 与 RISC-V，亲手构建 RK3576 根文件系统，追踪一次设备请求。',id:'arm64', mark:'arm64 / riscv'},
    {period:'第 33–38 周', title:'全志 RISC-V 进阶', text:'在 V821、V861 与 F101 上，研究异构核、Linux 调度与 FreeRTOS 中断响应。',id:'platform-v821', mark:'Linux / RTOS'}
  ];
  return `<section class="hero"><div class="hero-inner"><div class="hero-copy">
    <p class="hero-tag">ARM64 <i></i> RISC-V</p><h1>Linux 内核<br><span>与芯片架构</span></h1>
    <p class="hero-description">从 RK3576 上的第一个线程，到 K230 和全志芯片上的一次中断，沿着真实硬件学习内核。</p>
    <div class="hero-actions"><a class="button accent" href="${docURL(next.id)}">${last ? '继续阅读' : '从第 1 周开始'}</a><a class="button ghost" href="#/roadmap">查看学习路线</a></div>
    </div></div></section>
    <div class="home-wrap"><div class="course-facts"><div><b>32 <small>+ 6</small></b><span>周主线与全志进阶</span></div><div><b>5</b><span>个实机芯片平台</span></div><div><b>${data.pages.filter(p=>p.kind==='lab').length}</b><span>份实验手册</span></div><div><b>${data.pages.length}</b><span>篇学习文档</span></div></div>
    ${sectionHeading('学习路径','#/docs/roadmap','逐周查看')}
    <div class="tracks">${courses.map((c,i)=>`<a class="track tone-${i}" href="${docURL(c.id)}"><div class="track-top"><span>${c.period}</span><span class="track-mark">${c.mark}</span></div><h3>${c.title}</h3><p>${c.text}</p></a>`).join('')}</div>
    ${sectionHeading('芯片实验平台','#/platforms','查看平台与工具')}
    <div class="atlas home-atlas">${data.platforms.slice(0,5).map(atlasCard).join('')}</div>
    <section class="mechanism"><div><span class="card-meta">任务调度实验</span><h2>被唤醒的线程何时运行？</h2><p>改变任务状态，观察数据到达与获得 CPU 之间的间隔。</p><a class="text-link" href="${docURL('lab-wait')}">打开管道实验</a></div><div><div class="state-row" aria-label="任务状态"><span class="state-node" data-state="0">sleeping</span><span>›</span><span class="state-node" data-state="1">runnable</span><span>›</span><span class="state-node" data-state="2">running</span></div><p id="state-caption" aria-live="polite"></p><div class="mechanism-controls"><button class="button" id="state-next">唤醒任务</button><button class="text-button" id="state-reset">重置</button></div></div></section></div>`;
}
function routeRow(s) {
  return `<article class="route-row"><div class="route-period">${s.weeks}<small>${s.platform}</small></div><div><h3><a href="${docURL(s.id)}">${s.title}</a></h3><p>${s.summary}</p><div class="topic-list">${(s.topics || []).map(t=>`<span>${t}</span>`).join('')}</div></div><div class="route-result"><span class="card-meta">阶段交付</span><p>${s.outcome}</p><a class="text-link" href="${docURL(s.lab || s.id)}">${s.lab ? '配套实验' : '平台指南'}</a></div></article>`;
}
function pageIntro(title,text) {
  return `<header class="page-header"><h1>${title}</h1><p>${text}</p></header>`;
}
function roadmap() {
  return `<div class="page-wrap">${pageIntro('学习路线','每周参考 5–8 小时。先用 RK3576 建立工作基线，再在另一种架构上验证同一个机制。')}<div class="page-actions"><a class="button dark" href="${docURL('roadmap')}">阅读逐周计划</a><a class="text-link" href="${docURL('method')}">学习方法</a></div>
    ${sectionHeading('32 周内核主线')}<div class="route-list">${data.stages.map(routeRow).join('')}</div>
    ${sectionHeading('6 周全志进阶')}<div class="route-list">${data.extensions.map(routeRow).join('')}</div></div>`;
}
function platforms() {
  return `<div class="page-wrap">${pageIntro('芯片与实验平台','选中手里的板子，查看架构、软件配置与可验证的问题。')}
    ${sectionHeading('实机平台')}<div class="atlas">${data.platforms.slice(0,5).map(atlasCard).join('')}</div>
    ${sectionHeading('构建、仿真与选读')}<div class="atlas">${data.platforms.slice(5).map(atlasCard).join('')}</div>
    <div class="reading-pair"><a href="${docURL('arch-riscv')}">ARM64 与 RISC-V 异常对照</a><a href="${docURL('system-buildroot')}">从 Armbian 到 Buildroot</a></div></div>`;
}
function labs() {
  const all = data.pages.filter(p => p.kind === 'lab');
  const filters = ['全部', ...new Set(all.flatMap(p=>p.targets))];
  const entries = all.filter(p => filter === '全部' || p.targets.includes(filter));
  return `<div class="page-wrap">${pageIntro('实验手册','按平台选择实验。每份手册给出操作条件、观测方法与验收标准。')}<div class="filter-bar" aria-label="按实验平台筛选">${filters.map(f=>`<button class="filter-button ${filter===f?'active':''}" aria-pressed="${filter===f}" data-filter="${f}">${f}</button>`).join('')}<span class="filter-count">${entries.length} 份实验</span></div><div class="lab-list">${entries.map(p=>`<a class="lab-card" href="${docURL(p.id)}"><span class="lab-index">${p.title.slice(0,3)}</span><div><h3>${esc(p.title.slice(6))} ${completed.has(p.id)?'✓':''}</h3><p>${esc(p.summary)}</p></div><div class="lab-meta"><span>${p.platform}</span><span>约 ${p.minutes} 分钟</span></div></a>`).join('')}</div></div>`;
}
function doc(p) {
  const index = data.pages.indexOf(p), prev = data.pages[index-1], next = data.pages[index+1];
  return `<div class="doc-layout"><article class="doc-article"><div class="doc-meta"><a href="#/">学习空间</a><span>/</span><span>${p.group}</span><span class="tag">${p.platform}</span></div><h1 class="doc-title">${esc(p.title)}</h1><p class="doc-subtitle">${esc(p.summary)}</p><div class="doc-actions"><button class="complete-button" id="complete-doc" data-id="${p.id}" aria-pressed="${completed.has(p.id)}"><span class="complete-symbol">${completed.has(p.id) ? '✓' : ''}</span>${completed.has(p.id) ? '已完成自测' : '通过自测，标记完成'}</button><a class="doc-source" href="./${p.source}" download="${p.id}.md">下载本页 Markdown ↓</a></div><div class="prose">${p.html.replace(/^<h1[^>]*>.*?<\/h1>\s*/,'')}</div><nav class="doc-pagination" aria-label="相邻文档">${prev ? `<a href="${docURL(prev.id)}"><small>← 上一篇</small><span>${esc(prev.title)}</span></a>` : '<span></span>'}${next ? `<a class="next" href="${docURL(next.id)}"><small>下一篇 →</small><span>${esc(next.title)}</span></a>` : ''}</nav><p class="doc-feedback">课程更新 · ${data.updated} · 机制说明请结合实际源码版本。实机实验需按自己的板型与 BSP 验证。<br>可在 <a href="https://github.com/Rongkangqi/linux-kernel-lab/issues">GitHub Issues</a> 附上版本、命令与观察记录。</p></article><aside class="doc-toc" aria-label="本页目录"><div class="toc-title">ON THIS PAGE / 本页</div>${p.toc.map(t => `<a class="depth-${t.depth}" href="${docURL(p.id)}?section=${t.id}">${esc(t.title)}</a>`).join('')}</aside></div>`;
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
  document.body.classList.toggle('home', path === '/');
  $('#main').innerHTML = html;
  $$('.main-links a').forEach(a => {
    if (a.hash === location.hash || (path === '/' && a.hash === '#/')) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  document.title = `${title} · Linux Kernel Lab`;
  renderNav(); closeDrawer();
  if (path === '/') updateState();
  $$('.prose table').forEach(table => { const wrapper = document.createElement('div'); wrapper.className='table-wrap'; wrapper.tabIndex=0; wrapper.setAttribute('role','region'); wrapper.setAttribute('aria-label','可横向滚动的表格'); table.before(wrapper); wrapper.append(table); });
  $$('.prose pre').forEach(pre => {
    const code = $('code',pre); if (!code) return;
    if (path.startsWith('/docs/lab-') && code.className && !code.classList.contains('language-text')) {
      const lines = code.textContent.replace(/\n$/, '').split('\n');
      const numbers = document.createElement('span');
      numbers.className = 'code-line-numbers';
      numbers.setAttribute('aria-hidden', 'true');
      numbers.textContent = lines.map((_, index) => index + 1).join('\n');
      pre.classList.add('numbered-code');
      code.before(numbers);
    }
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
  $('#state-next').textContent = ['发布事件，唤醒任务','调度到 CPU','再次等待数据'][taskStep];
}
function closeDrawer() {
  const drawer = $('#sidebar');
  if (drawer.contains(document.activeElement)) $('#menu-toggle').focus({preventScroll:true});
  drawer.inert = true;
  drawer.classList.remove('open');
  $('#backdrop').hidden = true;
  $('#menu-toggle').setAttribute('aria-expanded','false');
}
function openSearch() { closeDrawer(); $('#search-dialog').showModal(); search(); $('#search-input').focus(); }
function search() {
  const query = $('#search-input').value.trim().toLocaleLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  const matches = data.pages.filter(p => terms.every(t => `${p.title} ${p.summary} ${p.text}`.toLocaleLowerCase().includes(t)));
  if (query) matches.sort((a,b) => Number(b.title.toLocaleLowerCase().includes(query))-Number(a.title.toLocaleLowerCase().includes(query)));
  const results = query ? matches.slice(0,12) : ['start','lab-pid','lab-fault','system-buildroot','platform-v861'].map(page);
  $('#search-results').innerHTML = results.length ? results.map(p => `<a class="search-result" href="${docURL(p.id)}"><strong>${esc(p.title)}</strong><small>${p.group}</small><p>${esc(p.summary)}</p></a>`).join('') : '<div class="search-no-result">没有找到相关文档。试试“任务”“MMU”或“DMA”。</div>';
}
function showProgress() {
  $('#progress-message').textContent = `已完成 ${completed.size} / ${data.pages.length} 篇文档的自测，${data.stages.filter(s => completed.has(s.id)).length} / ${data.stages.length} 个阶段指南。`;
  $('#progress-list').innerHTML = data.pages.filter(p => completed.has(p.id)).map(p => `<div class="progress-doc"><a href="${docURL(p.id)}">✓ ${esc(p.title)}</a><button data-uncomplete="${p.id}" aria-label="取消完成：${esc(p.title)}">撤销</button></div>`).join('') || '<p class="small muted">从 L01 开始，完成实验与自测后再做标记。</p>';
}
function attachEvents() {
  window.addEventListener('hashchange',render);
  $('.skip-link').addEventListener('click',e => { e.preventDefault(); $('#main').focus(); });
  $('#nav').addEventListener('click',e => { if (e.target.closest('a')) closeDrawer(); });
  $('#menu-toggle').addEventListener('click',() => {
    const drawer = $('#sidebar');
    if (!drawer.inert) { closeDrawer(); return; }
    drawer.inert = false;
    drawer.classList.add('open');
    $('#backdrop').hidden = false;
    $('#menu-toggle').setAttribute('aria-expanded','true');
    $('#close-menu').focus();
  });
  $('#close-menu').addEventListener('click',closeDrawer);
  $('#backdrop').addEventListener('click',closeDrawer);
  $('#search-open').addEventListener('click',openSearch);
  $('#search-input').addEventListener('input',search);
  $('#progress-open').addEventListener('click',() => { showProgress(); $('#progress-dialog').showModal(); });
  $$('[data-close]').forEach(b => b.addEventListener('click',() => document.getElementById(b.dataset.close).close()));
  document.addEventListener('keydown',e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k') { e.preventDefault(); if (!$('#search-dialog').open) openSearch(); }
    if (!$('#sidebar').inert && !document.querySelector('dialog[open]')) {
      if (e.key === 'Escape') closeDrawer();
      if (e.key === 'Tab') {
        const first = $('#close-menu'), last = $('#progress-open');
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
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
