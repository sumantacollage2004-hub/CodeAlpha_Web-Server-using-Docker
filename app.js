/* ============================================================
   DOCKER WEB SERVER — app.js
   All interactivity: terminal, animations, data rendering
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════
   DATA DEFINITIONS
══════════════════════════════════════════════ */

const BASICS_CMDS = [
  { code: 'docker --version',               desc: 'Show installed Docker version' },
  { code: 'docker info',                    desc: 'Display system-wide Docker info' },
  { code: 'docker pull nginx:alpine',       desc: 'Pull Nginx image from Docker Hub' },
  { code: 'docker images',                  desc: 'List all locally available images' },
  { code: 'docker search nginx',            desc: 'Search Docker Hub for images' },
  { code: 'docker image inspect nginx',     desc: 'Inspect image metadata & layers' },
  { code: 'docker rmi nginx:alpine',        desc: 'Remove a local image' },
  { code: 'docker system prune -a',         desc: 'Remove all unused Docker objects' },
];

const DEPLOY_STEPS = [
  {
    step: '01', title: 'Pull the Nginx Image',
    desc: 'Download the official lightweight Nginx image from Docker Hub.',
    cmd: 'docker pull nginx:alpine'
  },
  {
    step: '02', title: 'Run the Web Server Container',
    desc: 'Start a container named "web" mapping host port 8080 → container port 80, running in detached mode.',
    cmd: 'docker run -d --name web -p 8080:80 nginx:alpine'
  },
  {
    step: '03', title: 'Verify It\'s Running',
    desc: 'Check the container list and confirm "web" has status "Up".',
    cmd: 'docker ps'
  },
  {
    step: '04', title: 'Serve Custom Files via Volume',
    desc: 'Mount a local folder into the container so Nginx serves your own HTML files.',
    cmd: 'docker run -d --name web -p 8080:80 -v $(pwd)/html:/usr/share/nginx/html:ro nginx:alpine'
  },
  {
    step: '05', title: 'Open in Browser',
    desc: 'Visit your containerised web server at localhost. You should see Nginx or your custom page.',
    cmd: 'open http://localhost:8080   # or curl http://localhost:8080'
  },
  {
    step: '06', title: 'Rebuild & Redeploy Changes',
    desc: 'Stop old container, remove it, then re-run with updated image or files.',
    cmd: 'docker stop web && docker rm web && docker run -d --name web -p 8080:80 nginx:alpine'
  },
];

const LIFECYCLE_STATES = [
  { id: 'created', icon: '📋', name: 'Created', cls: 'lc-created' },
  { id: 'running', icon: '▶', name: 'Running',  cls: 'lc-running' },
  { id: 'paused',  icon: '⏸', name: 'Paused',   cls: 'lc-paused' },
  { id: 'stopped', icon: '⏹', name: 'Stopped',  cls: 'lc-stopped' },
  { id: 'removed', icon: '🗑', name: 'Removed',  cls: 'lc-removed' },
];
const LIFECYCLE_ARROWS = [
  { cmd: 'docker start' },
  { cmd: 'docker pause' },
  { cmd: 'docker stop' },
  { cmd: 'docker rm'   },
];

const LIFECYCLE_CMDS = [
  { code: 'docker create nginx:alpine',     desc: 'Create container without starting it' },
  { code: 'docker start web',               desc: 'Start a stopped/created container' },
  { code: 'docker stop web',                desc: 'Gracefully stop a running container' },
  { code: 'docker kill web',                desc: 'Force-kill a container immediately' },
  { code: 'docker pause web',               desc: 'Freeze all processes in container' },
  { code: 'docker unpause web',             desc: 'Resume a paused container' },
  { code: 'docker restart web',             desc: 'Stop and restart a container' },
  { code: 'docker rm web',                  desc: 'Remove a stopped container' },
  { code: 'docker rm -f web',               desc: 'Force-remove even a running container' },
  { code: 'docker rename web server01',     desc: 'Rename an existing container' },
];

const MONITOR_CMDS = [
  { code: 'docker ps',                      desc: 'List running containers' },
  { code: 'docker ps -a',                   desc: 'List all containers (incl. stopped)' },
  { code: 'docker logs web',                desc: 'Show container stdout/stderr logs' },
  { code: 'docker logs -f web',             desc: 'Follow/stream container logs live' },
  { code: 'docker stats web',               desc: 'Live CPU, memory, network usage' },
  { code: 'docker inspect web',             desc: 'Detailed container JSON metadata' },
  { code: 'docker top web',                 desc: 'Show running processes inside container' },
  { code: 'docker exec -it web sh',         desc: 'Open interactive shell in container' },
  { code: 'docker events',                  desc: 'Stream real-time Docker events' },
  { code: 'docker diff web',                desc: 'Show filesystem changes in container' },
];

const TROUBLE_ITEMS = [
  {
    q: '❌ Port already in use — "Bind for 0.0.0.0:8080 failed"',
    a: 'Another process is using that port. Use <code>lsof -i :8080</code> or <code>netstat -tlnp | grep 8080</code> to find it. Kill the process or choose a different host port: <code>-p 9090:80</code>.'
  },
  {
    q: '❌ Container exits immediately after starting',
    a: 'The main process crashed. Check logs with <code>docker logs web</code>. For nginx, ensure the config is valid and no CMD override is suppressing it. Always add <code>daemon off;</code> to keep nginx in foreground.'
  },
  {
    q: '❌ Permission denied on mounted volume',
    a: 'The container user lacks read access to the host path. Fix with <code>chmod -R 755 ./html</code> or use <code>--user $(id -u):$(id -g)</code> flag when running the container.'
  },
  {
    q: '❌ "No space left on device" error',
    a: 'Docker images and stopped containers have filled the disk. Clean up with <code>docker system prune -a --volumes</code>. Check disk usage with <code>docker system df</code>.'
  },
  {
    q: '❌ Container running but website unreachable',
    a: 'Verify port mapping with <code>docker ps</code> and confirm the host port is correct. Check nginx logs with <code>docker logs web</code>. Ensure no firewall rule blocks the port. Test internally with <code>docker exec web wget -qO- localhost</code>.'
  },
];

const BEST_PRACTICES = [
  {
    icon: '🪶', title: 'Use Alpine-based Images',
    desc: 'Alpine images are 5-10x smaller than full OS images. Use nginx:alpine, node:alpine to reduce attack surface and pull times.',
    tag: 'Security & Performance'
  },
  {
    icon: '🔒', title: 'Never Run as Root',
    desc: 'Add USER directive in Dockerfile. Use --user flag at runtime. Root inside a container can escalate privileges if the container is compromised.',
    tag: 'Security'
  },
  {
    icon: '🏥', title: 'Define Health Checks',
    desc: 'Use HEALTHCHECK in Dockerfile or the healthcheck key in Compose so orchestrators can restart unhealthy containers automatically.',
    tag: 'Reliability'
  },
  {
    icon: '📝', title: 'Use .dockerignore',
    desc: 'Exclude node_modules, .git, .env, logs, and build artifacts from the Docker build context to speed up builds and avoid leaking secrets.',
    tag: 'Best Practice'
  },
  {
    icon: '🔄', title: 'Set Restart Policies',
    desc: 'Use --restart unless-stopped or restart: always in Compose so your web server survives host reboots and crashes automatically.',
    tag: 'Reliability'
  },
  {
    icon: '🔐', title: 'Manage Secrets Properly',
    desc: 'Never bake passwords into images. Use Docker secrets, environment variables from .env files, or external secret managers like Vault.',
    tag: 'Security'
  },
  {
    icon: '📦', title: 'Layer Caching Strategy',
    desc: 'Place COPY package.json and RUN npm install before COPY . . so npm install layer is cached unless dependencies change.',
    tag: 'Performance'
  },
  {
    icon: '🏷', title: 'Tag Images Semantically',
    desc: 'Never rely on :latest in production. Tag images with git SHA or semver: myapp:1.2.3 so you can always roll back to a known good state.',
    tag: 'Operations'
  },
];

const FAKE_LOGS = [
  { ts: '2026-05-20T08:00:01Z', lvl: 'info',  msg: '172.17.0.1 - GET / HTTP/1.1 200 615' },
  { ts: '2026-05-20T08:00:03Z', lvl: 'info',  msg: '172.17.0.1 - GET /style.css HTTP/1.1 200 4218' },
  { ts: '2026-05-20T08:00:04Z', lvl: 'warn',  msg: '172.17.0.1 - GET /favicon.ico HTTP/1.1 404 153' },
  { ts: '2026-05-20T08:00:10Z', lvl: 'info',  msg: 'nginx: worker process 17 started' },
  { ts: '2026-05-20T08:01:22Z', lvl: 'info',  msg: '10.0.0.5 - POST /api/data HTTP/1.1 201 89' },
  { ts: '2026-05-20T08:02:11Z', lvl: 'error', msg: '172.17.0.2 - GET /admin HTTP/1.1 403 Forbidden' },
  { ts: '2026-05-20T08:03:45Z', lvl: 'info',  msg: 'health check: status 200 OK' },
  { ts: '2026-05-20T08:05:00Z', lvl: 'info',  msg: '172.17.0.1 - GET /about.html HTTP/1.1 200 980' },
];

/* ══════════════════════════════════════════════
   RENDER FUNCTIONS
══════════════════════════════════════════════ */

function renderCmdGrid(containerId, cmds) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = cmds.map(c => `
    <div class="cmd-item" onclick="copyText('${escHtml(c.code)}')">
      <span class="cmd-code">${escHtml(c.code)}</span>
      <span class="cmd-desc">${c.desc}</span>
    </div>
  `).join('');
}

function renderDeploySteps() {
  const el = document.getElementById('deploySteps');
  if (!el) return;
  el.innerHTML = DEPLOY_STEPS.map(s => `
    <div class="deploy-step">
      <div class="step-num">${s.step}</div>
      <div class="step-body">
        <h4>${s.title}</h4>
        <p>${s.desc}</p>
        <div class="step-cmd" onclick="copyText('${escHtml(s.cmd)}')">${escHtml(s.cmd)}</div>
      </div>
    </div>
  `).join('');
}

function renderLifecycle() {
  const el = document.getElementById('lifecycleFlow');
  if (!el) return;
  let html = '';
  LIFECYCLE_STATES.forEach((s, i) => {
    html += `
      <div class="lc-state">
        <div class="lc-circle ${s.cls}">${s.icon}</div>
        <div class="lc-name">${s.name}</div>
      </div>`;
    if (i < LIFECYCLE_ARROWS.length) {
      html += `
      <div class="lc-arrow">
        <span>→</span>
        <span class="la-cmd">${LIFECYCLE_ARROWS[i].cmd}</span>
      </div>`;
    }
  });
  el.innerHTML = html;
}

function renderStats() {
  const cpuPct = Math.floor(Math.random() * 35 + 5);
  const memPct = Math.floor(Math.random() * 40 + 20);
  const netKB  = (Math.random() * 900 + 100).toFixed(1);

  const el = document.getElementById('statsRow');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-tile">
      <div class="s-label">CPU Usage</div>
      <div class="s-val">${cpuPct}%</div>
      <div class="s-bar"><div class="s-fill cpu" style="width:${cpuPct}%"></div></div>
    </div>
    <div class="stat-tile">
      <div class="s-label">Memory</div>
      <div class="s-val">${memPct}%</div>
      <div class="s-bar"><div class="s-fill mem" style="width:${memPct}%"></div></div>
    </div>
    <div class="stat-tile">
      <div class="s-label">Net I/O</div>
      <div class="s-val">${netKB} KB/s</div>
      <div class="s-bar"><div class="s-fill net" style="width:${Math.min(netKB/10,100)}%"></div></div>
    </div>
    <div class="stat-tile">
      <div class="s-label">Uptime</div>
      <div class="s-val">2h 14m</div>
    </div>
  `;
}

function renderLogs() {
  const el = document.getElementById('logsOutput');
  if (!el) return;
  el.innerHTML = FAKE_LOGS.map(l => `
    <div class="log-line">
      <span class="ts">${l.ts}</span>
      <span class="lvl ${l.lvl}">[${l.lvl.toUpperCase()}]</span>
      <span class="msg">${l.msg}</span>
    </div>
  `).join('');
  el.scrollTop = el.scrollHeight;
}

function renderTrouble() {
  const el = document.getElementById('troubleList');
  if (!el) return;
  el.innerHTML = TROUBLE_ITEMS.map((t, i) => `
    <div class="trouble-item" data-idx="${i}">
      <div class="trouble-q">
        <span>${t.q}</span>
        <span class="t-toggle">▼</span>
      </div>
      <div class="trouble-a">${t.a}</div>
    </div>
  `).join('');
  el.querySelectorAll('.trouble-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('open');
    });
  });
}

function renderBestPractices() {
  const el = document.getElementById('bpGrid');
  if (!el) return;
  el.innerHTML = BEST_PRACTICES.map(b => `
    <div class="bp-card">
      <div class="bp-icon">${b.icon}</div>
      <h4>${b.title}</h4>
      <p>${b.desc}</p>
      <span class="bp-tag">${b.tag}</span>
    </div>
  `).join('');
}

function renderFloatingProgress() {
  const el = document.getElementById('fpModules');
  if (!el) return;
  const sections = ['basics','deploy','lifecycle','monitor','bestpractices'];
  el.innerHTML = sections.map(s => `
    <div class="fp-dot" data-section="${s}" title="${s}" onclick="scrollToSection('${s}')"></div>
  `).join('');
}

/* ══════════════════════════════════════════════
   TERMINAL
══════════════════════════════════════════════ */

const TERMINAL_CMDS = {
  'docker --version':            () => ['Docker version 26.1.0, build a89ceafea9'],
  'docker ps':                   () => [
    'CONTAINER ID   IMAGE          COMMAND                  CREATED       STATUS        PORTS                  NAMES',
    'a1b2c3d4e5f6   nginx:alpine   "/docker-entrypoint.…"   2 hours ago   Up 2 hours   0.0.0.0:8080->80/tcp   web'
  ],
  'docker images':               () => [
    'REPOSITORY   TAG       IMAGE ID       CREATED        SIZE',
    'nginx        alpine    7e1a4e2d9c5b   3 days ago     23.4MB',
    'mysql        8         a9f5b62d7e1c   5 days ago     578MB',
    'node         alpine    c3d2e1f0b9a8   1 week ago     182MB'
  ],
  'docker info':                 () => [
    'Client: Docker Engine - Community',
    'Server Version: 26.1.0',
    'Containers: 3  Running: 2  Paused: 0  Stopped: 1',
    'Images: 8',
    'OS: Linux',
    'Architecture: x86_64',
    'CPUs: 4',
    'Total Memory: 7.771GiB',
  ],
  'docker pull nginx:alpine':    () => [
    'alpine: Pulling from library/nginx',
    'Digest: sha256:7a4b5fde…',
    'Status: Image is up to date for nginx:alpine',
    'docker.io/library/nginx:alpine'
  ],
  'docker stats web':            () => [
    'CONTAINER ID   NAME   CPU %   MEM USAGE / LIMIT     MEM %   NET I/O',
    `a1b2c3d4e5f6   web    ${(Math.random()*3+0.5).toFixed(2)}%   ${(Math.random()*20+10).toFixed(0)}MiB / 7.77GiB   ${(Math.random()*1+0.2).toFixed(2)}%   1.2MB / 880kB`
  ],
  'docker logs web':             () => FAKE_LOGS.map(l => `${l.ts} [${l.lvl.toUpperCase()}] ${l.msg}`),
  'docker system prune -a':      () => [
    'WARNING! This will remove all unused images, containers, volumes, and networks.',
    'Are you sure you want to continue? [y/N] y',
    'Deleted Images: 4',
    'Total reclaimed space: 842MB'
  ],
  'help': () => [
    'Available commands (try them!):',
    '  docker --version',
    '  docker info',
    '  docker ps',
    '  docker images',
    '  docker pull nginx:alpine',
    '  docker stats web',
    '  docker logs web',
    '  docker system prune -a',
    '  clear',
  ],
  'clear': () => { return '__clear__'; },
};

function initTerminal() {
  const overlay  = document.getElementById('terminalOverlay');
  const output   = document.getElementById('terminalOutput');
  const input    = document.getElementById('terminalInput');
  const toggle   = document.getElementById('terminalToggle');
  const close    = document.getElementById('terminalClose');

  const history = [];
  let histIdx   = -1;

  function open() {
    overlay.classList.add('open');
    input.focus();
    if (output.children.length === 0) printLine('Type help to see available commands.', 'info');
  }
  function close_() { overlay.classList.remove('open'); }

  toggle.addEventListener('click', open);
  close.addEventListener('click', close_);
  overlay.addEventListener('click', e => { if (e.target === overlay) close_(); });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      if (!cmd) return;
      history.unshift(cmd);
      histIdx = -1;
      printLine('$ ' + cmd, 'cmd');
      input.value = '';
      processCmd(cmd);
    }
    if (e.key === 'ArrowUp') {
      histIdx = Math.min(histIdx + 1, history.length - 1);
      input.value = history[histIdx] || '';
    }
    if (e.key === 'ArrowDown') {
      histIdx = Math.max(histIdx - 1, -1);
      input.value = histIdx >= 0 ? history[histIdx] : '';
    }
  });

  function processCmd(cmd) {
    const key = Object.keys(TERMINAL_CMDS).find(k => cmd.toLowerCase() === k.toLowerCase()
      || cmd.toLowerCase().startsWith(k.toLowerCase()));
    if (key) {
      const result = TERMINAL_CMDS[key]();
      if (result === '__clear__') { output.innerHTML = ''; return; }
      setTimeout(() => {
        result.forEach((line, i) => {
          setTimeout(() => printLine(line, 'out'), i * 40);
        });
        setTimeout(() => output.scrollTop = output.scrollHeight, result.length * 40 + 50);
      }, 100);
    } else {
      setTimeout(() => {
        printLine(`bash: ${cmd}: command not found`, 'err');
        printLine('Type help for available commands.', 'info');
      }, 100);
    }
  }

  function printLine(text, cls = 'out') {
    const div = document.createElement('div');
    div.className = `t-line ${cls}`;
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }
}

/* ══════════════════════════════════════════════
   SCROLL / PROGRESS
══════════════════════════════════════════════ */

function updateProgress() {
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  const bar = document.getElementById('progressBar');
  if (bar) bar.style.width = pct + '%';

  // Nav & floating dots active state
  const sections = ['basics','deploy','lifecycle','monitor','bestpractices'];
  let activeSection = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.getBoundingClientRect().top <= 120) activeSection = id;
  });

  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.section === activeSection);
  });
  document.querySelectorAll('.fp-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.section === activeSection);
  });
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ══════════════════════════════════════════════
   CONTAINER DIAGRAM HOVER
══════════════════════════════════════════════ */
function initDiagram() {
  const tip = document.getElementById('diagramTooltip');
  document.querySelectorAll('.d-container').forEach(c => {
    c.addEventListener('mouseenter', () => {
      if (tip) { tip.textContent = c.dataset.tip; tip.style.opacity = '1'; }
      c.classList.add('active');
    });
    c.addEventListener('mouseleave', () => {
      if (tip) tip.style.opacity = '0';
      c.classList.remove('active');
    });
  });

  // Animate containers blinking
  setInterval(() => {
    const running = document.querySelectorAll('.d-status.running');
    running.forEach(s => { s.style.opacity = s.style.opacity === '0.2' ? '1' : '0.2'; });
  }, 800);
}

/* ══════════════════════════════════════════════
   COPY HELPERS
══════════════════════════════════════════════ */

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard ✓');
  }).catch(() => {
    showToast('Copy failed — paste manually');
  });
}

function copyCode(btn) {
  const code = btn.nextElementSibling.textContent.trim();
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 2000);
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ══════════════════════════════════════════════
   INTERSECTION OBSERVER — stagger entrance
══════════════════════════════════════════════ */

function initObserver() {
  const targets = document.querySelectorAll(
    '.concept-card, .bp-card, .cmd-item, .trouble-item, .deploy-step'
  );
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  targets.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity .4s ease ${(i % 8) * 0.06}s, transform .4s ease ${(i % 8) * 0.06}s`;
    obs.observe(el);
  });
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Render all dynamic content
  renderCmdGrid('basicsCmds', BASICS_CMDS);
  renderDeploySteps();
  renderLifecycle();
  renderCmdGrid('lifecycleCmds', LIFECYCLE_CMDS);
  renderStats();
  renderLogs();
  renderCmdGrid('monitorCmds', MONITOR_CMDS);
  renderTrouble();
  renderBestPractices();
  renderFloatingProgress();

  // Year in footer
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // Terminal
  initTerminal();

  // Diagram
  initDiagram();

  // Scroll progress & nav
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Refresh stats button
  document.getElementById('refreshStats')?.addEventListener('click', () => {
    renderStats();
    renderLogs();
    showToast('Stats refreshed');
  });

  // Stagger entrance animation
  setTimeout(initObserver, 100);

  // Auto-refresh stats every 8s
  setInterval(renderStats, 8000);
});
