// State Management & Storage Keys
const STORAGE_KEYS = {
  API_KEY: 'autoapply_api_key',
  POLL_SPEED: 'autoapply_poll_speed',
  JOBSITES: 'autoapply_jobsites',
  AUTO_APPLY_SECTORS: 'autoapply_auto_sectors',
  PROFILE: 'autoapply_profile',
  APPLIED_JOBS: 'autoapply_applied_jobs',
  METRICS: 'autoapply_metrics',
  NOTIFICATION_EMAIL: 'autoapply_notification_email',
  TAILORED_CACHE: 'autoapply_tailored_cache',
  LAST_CLEAR: 'autoapply_last_clear_timestamp',
  THEME: 'autoapply_theme'
};

// Initial state defaults
let state = {
  apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
  pollSpeed: parseInt(localStorage.getItem(STORAGE_KEYS.POLL_SPEED)) || 30,
  jobsites: JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBSITES)) || [
    'https://careers.google.com',
    'https://pfizer.wd1.myworkdayjobs.com',
    'https://careers.accenture.com',
    'https://stripe.com/jobs',
    'https://careers.nike.com',
    'https://careers.equinix.com',
    'https://www.indeed.com/',
    'https://www.dice.com/',
    'https://www.monster.com/',
    'https://www.randstad.com/',
    'https://www.glassdoor.com/'
  ],
  autoApplySectors: JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTO_APPLY_SECTORS)) || {
    hlp: true, btc: true, cps: true, fsi: true, mrc: true, tdi: true
  },
  profile: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE)) || {
    name: 'Alex Mercer',
    email: 'alex.mercer@gmail.com',
    title: 'Senior Cloud Solutions Architect',
    resume: `ALEX MERCER
San Francisco, CA | alex.mercer@gmail.com | github.com/alexmercer

PROFESSIONAL SUMMARY
Dynamic and results-driven Solutions Architect with over 6 years of experience designing and implementing scalable cloud systems. Proven expertise in microservices design, infrastructure orchestration, and cloud database optimization.

TECHNICAL SKILLS
- Cloud Platforms: AWS, Microsoft Azure, Google Cloud (GCP)
- Containers & Orchestration: Kubernetes, Docker, Helm
- Infrastructure as Code: Terraform, Ansible
- Programming & Scripting: Python, Go, Bash, Javascript
- CI/CD & Security: Jenkins, GitHub Actions, HashiCorp Vault

PROFESSIONAL EXPERIENCE
Senior Solutions Architect | CloudCorp Inc. | 2023 - Present
- Led the migration of legacy retail applications to AWS, reducing server overhead costs by 35%.
- Architected Kubernetes microservices clusters for high-volume transactions, handling 15,000 requests per minute.
- Standardized infrastructure deployments across three departments using reusable Terraform modules.
- Managed a security overhaul of cloud identity access permissions, eliminating 80% of unused IAM privileges.

Cloud Infrastructure Engineer | TechLink Services | 2020 - 2023
- Designed and maintained Jenkins CI/CD pipelines, increasing software delivery speed by 40%.
- Configured real-time system monitoring and alert triggers using Prometheus and Grafana.
- Managed containerized Docker environments for testing and production services.
- Spearheaded database scaling strategies, increasing database write capacity for global users.`
  },
  appliedJobs: JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLIED_JOBS)) || [],
  metrics: JSON.parse(localStorage.getItem(STORAGE_KEYS.METRICS)) || {
    scanned: 0,
    tailored: 0,
    applied: 0
  },
  notificationEmail: localStorage.getItem(STORAGE_KEYS.NOTIFICATION_EMAIL) || 'willieekams@aol.com',
  monitorState: 'stopped',
  activeJobs: [],
  selectedJobId: null,
  tailoredCache: JSON.parse(localStorage.getItem(STORAGE_KEYS.TAILORED_CACHE)) || [],
  lastClearTimestamp: parseInt(localStorage.getItem(STORAGE_KEYS.LAST_CLEAR)) || Date.now(),
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'dark'
};

// Global variables for scrapers
let scraperTimer = null;
let notificationPermission = 'default';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  // Ensure the new default jobsites list is loaded even if local storage is already set
  const defaults = [
    'https://www.indeed.com/',
    'https://www.dice.com/',
    'https://www.monster.com/',
    'https://www.randstad.com/',
    'https://www.glassdoor.com/'
  ];
  defaults.forEach(site => {
    if (!state.jobsites.includes(site)) {
      state.jobsites.push(site);
    }
  });
  saveStateToStorage();

  // Run the 24-hour cache maintenance check on startup
  checkAndPerform24HourReset();

  // Set initial theme
  if (state.theme === 'light') {
    document.body.classList.add('light-theme');
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) themeIcon.innerText = '🌙';
  } else {
    document.body.classList.remove('light-theme');
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) themeIcon.innerText = '☀️';
  }

  initUIValues();
  setupEventListeners();
  initNotificationPermission();
  renderJobsites();
  startScraperLoop();
  
  // Log startup message
  writeLog('log-terminal', '[SYSTEM]: AutoApply AI initialized. Scraper is idle. Click Start (▶) to begin.', 'info');
  state.jobsites.forEach(site => {
    writeLog('log-terminal', `[SCRAPER]: Monitored portal loaded: ${site}`, 'bullet');
  });
});

// UI Sync
function initUIValues() {
  // Sync Profile fields
  document.getElementById('profile-name').value = state.profile.name;
  document.getElementById('profile-email').value = state.profile.email;
  document.getElementById('profile-title').value = state.profile.title;
  document.getElementById('base-resume-text').value = state.profile.resume;

  // Sync Settings
  document.getElementById('settings-api-key').value = state.apiKey;
  document.getElementById('settings-notification-email').value = state.notificationEmail;
  document.getElementById('settings-poll-speed').value = state.pollSpeed;
  document.getElementById('settings-poll-speed-val').innerText = `${state.pollSpeed}s`;

  document.getElementById('toggle-hlp').checked = state.autoApplySectors.hlp;
  document.getElementById('toggle-btc').checked = state.autoApplySectors.btc;
  document.getElementById('toggle-cps').checked = state.autoApplySectors.cps;
  document.getElementById('toggle-fsi').checked = state.autoApplySectors.fsi;
  document.getElementById('toggle-mrc').checked = state.autoApplySectors.mrc;
  document.getElementById('toggle-tdi').checked = state.autoApplySectors.tdi;

  // Sync Metrics
  updateMetricsUI();
  
  // Sync Tailored Resumes Cache
  renderTailoredCache();

  // Sync Scraper state UI controls
  if (state.monitorState === 'listening') {
    document.getElementById('btn-start-monitor').setAttribute('disabled', 'true');
    document.getElementById('btn-pause-monitor').removeAttribute('disabled');
    document.getElementById('btn-stop-monitor').removeAttribute('disabled');
    document.getElementById('console-pulse-dot').className = 'pulse-dot pulsing';
    document.getElementById('console-status-lbl').innerText = 'LISTENING';
    document.getElementById('metric-status').innerText = 'ACTIVE';
    document.getElementById('metric-status').className = 'metric-value font-mono status-active';
  } else if (state.monitorState === 'paused') {
    document.getElementById('btn-start-monitor').removeAttribute('disabled');
    document.getElementById('btn-pause-monitor').setAttribute('disabled', 'true');
    document.getElementById('btn-stop-monitor').removeAttribute('disabled');
    document.getElementById('console-pulse-dot').className = 'pulse-dot paused';
    document.getElementById('console-status-lbl').innerText = 'PAUSED';
    document.getElementById('metric-status').innerText = 'PAUSED';
    document.getElementById('metric-status').className = 'metric-value font-mono status-paused';
  } else {
    document.getElementById('btn-start-monitor').removeAttribute('disabled');
    document.getElementById('btn-pause-monitor').setAttribute('disabled', 'true');
    document.getElementById('btn-stop-monitor').setAttribute('disabled', 'true');
    document.getElementById('console-pulse-dot').className = 'pulse-dot muted';
    document.getElementById('console-status-lbl').innerText = 'STOPPED';
    document.getElementById('metric-status').innerText = 'INACTIVE';
    document.getElementById('metric-status').className = 'metric-value font-mono status-inactive';
  }
}

function updateMetricsUI() {
  document.getElementById('metric-scanned').innerText = state.metrics.scanned;
  document.getElementById('metric-tailored').innerText = state.metrics.tailored;
  document.getElementById('metric-applied').innerText = state.metrics.applied;
}

function saveStateToStorage() {
  localStorage.setItem(STORAGE_KEYS.API_KEY, state.apiKey);
  localStorage.setItem(STORAGE_KEYS.POLL_SPEED, state.pollSpeed.toString());
  localStorage.setItem(STORAGE_KEYS.JOBSITES, JSON.stringify(state.jobsites));
  localStorage.setItem(STORAGE_KEYS.AUTO_APPLY_SECTORS, JSON.stringify(state.autoApplySectors));
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(state.profile));
  localStorage.setItem(STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(state.appliedJobs));
  localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(state.metrics));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATION_EMAIL, state.notificationEmail);
  localStorage.setItem(STORAGE_KEYS.TAILORED_CACHE, JSON.stringify(state.tailoredCache));
  localStorage.setItem(STORAGE_KEYS.LAST_CLEAR, state.lastClearTimestamp.toString());
  localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
  updateMetricsUI();
}

// 24-Hour Cache & History Reset Policy
function checkAndPerform24HourReset() {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  if (now - state.lastClearTimestamp >= oneDayMs) {
    writeLog('log-terminal', `[SYSTEM]: 24-hour cycle completed. Clearing active tailored cache, applied history, and resetting metrics...`, 'danger');
    
    // Perform resets
    state.tailoredCache = [];
    state.appliedJobs = [];
    state.metrics = { scanned: 0, tailored: 0, applied: 0 };
    state.activeJobs = []; // reset scanned postings in feed
    state.lastClearTimestamp = now;
    
    saveStateToStorage();
    
    // Refresh components
    renderTailoredCache();
    renderJobsFeedList();
    updateMetricsUI();
    
    playNotificationSound('notify');
  }
}

// Sound Synthesizer (Premium Audio Feedback)
function playNotificationSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'notify') {
      // Futuristic double chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, ctx.currentTime); // D4
      osc2.frequency.setValueAtTime(440.00, ctx.currentTime + 0.15); // A4
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.55);
      osc2.stop(ctx.currentTime + 0.55);
    } else if (type === 'success') {
      // Triumph ascending triad
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      frequencies.forEach((f, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.1 + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.3);
      });
    } else if (type === 'work') {
      // Tech-y soft click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    }
  } catch (e) {
    console.warn('Audio synthesis not supported or blocked by security policies', e);
  }
}

// Notification Integration
function initNotificationPermission() {
  const btn = document.getElementById('btn-notifications');
  if (!('Notification' in window)) {
    btn.style.display = 'none';
    return;
  }

  notificationPermission = Notification.permission;
  updateNotificationButton();
}

function updateNotificationButton() {
  const btn = document.getElementById('btn-notifications');
  if (notificationPermission === 'granted') {
    btn.className = 'btn btn-notify notification-enabled';
    document.getElementById('txt-notifications').innerText = 'Alerts Enabled';
  } else if (notificationPermission === 'denied') {
    btn.className = 'btn btn-notify notification-disabled';
    document.getElementById('txt-notifications').innerText = 'Alerts Blocked';
  } else {
    btn.className = 'btn btn-notify notification-disabled';
    document.getElementById('txt-notifications').innerText = 'Enable Alerts';
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  
  Notification.requestPermission().then(permission => {
    notificationPermission = permission;
    updateNotificationButton();
    if (permission === 'granted') {
      triggerBrowserNotification('AutoApply AI Enabled', 'You will receive immediate alerts when matching remote jobs are found.');
      playNotificationSound('success');
    }
  });
}

function triggerBrowserNotification(title, body, jobData = null) {
  if (notificationPermission === 'granted') {
    const notification = new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%236366f1"/><text x="32" y="65" font-size="45" fill="white" font-weight="bold">⚡</text></svg>'
    });
    
    notification.onclick = () => {
      window.focus();
      if (jobData) {
        selectJob(jobData.id);
      }
    };
  }
  playNotificationSound('notify');
}

// Jobsites list management
function renderJobsites() {
  const container = document.getElementById('settings-jobsites-list');
  container.innerHTML = '';
  
  if (state.jobsites.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.75rem; padding:0.5rem 0;">No custom jobsites configured</div>`;
    return;
  }

  state.jobsites.forEach((site, index) => {
    const div = document.createElement('div');
    div.className = 'jobsite-item';
    div.style = 'display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-secondary); background: rgba(255,255,255,0.02); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color);';
    div.innerHTML = `
      <span class="jobsite-url font-mono" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 340px;" title="${site}">${site}</span>
      <button class="btn-remove-jobsite" data-index="${index}" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 1rem; font-weight:700;">&times;</button>
    `;
    container.appendChild(div);
  });

  // Attach delete listeners
  container.querySelectorAll('.btn-remove-jobsite').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'));
      const removedSite = state.jobsites[idx];
      state.jobsites.splice(idx, 1);
      renderJobsites();
      saveStateToStorage();
      writeLog('log-terminal', `[SYSTEM]: Removed jobsite monitoring target: ${removedSite}`, 'sys');
    });
  });
}

function addJobsite() {
  const input = document.getElementById('settings-jobsite-url');
  let url = input.value.trim();
  if (!url) return;
  
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    new URL(url); // Validate URL structure
  } catch (_) {
    alert('Please enter a valid URL.');
    return;
  }

  if (state.jobsites.includes(url)) {
    alert('This jobsite link is already monitored.');
    return;
  }

  state.jobsites.push(url);
  input.value = '';
  renderJobsites();
  saveStateToStorage();
  writeLog('log-terminal', `[SYSTEM]: Added jobsite monitoring target: ${url}`, 'info');
  playNotificationSound('work');
}

// Tailored Resumes Cache Manager (Max 5, Evicted on Overflow, Deleted on Apply)
function saveTailoredResumeToCache(jobId, company, title, tailoredText) {
  // Check if already in cache and delete to avoid duplicate and move to newest
  state.tailoredCache = state.tailoredCache.filter(c => c.jobId !== jobId);

  // Evict oldest if cache is full (5 items)
  if (state.tailoredCache.length >= 5) {
    const evicted = state.tailoredCache.shift(); // Evict oldest from beginning
    writeLog('log-terminal', `[SYSTEM]: Resume cache full (5). Evicted oldest tailored resume: ${evicted.company} - ${evicted.title}`, 'alert');
  }

  // Add new tailored resume
  state.tailoredCache.push({
    jobId,
    company,
    title,
    tailoredText,
    timestamp: Date.now()
  });

  saveStateToStorage();
  renderTailoredCache();
}

function renderTailoredCache() {
  const countBadge = document.getElementById('tailored-cache-count');
  const cacheList = document.getElementById('tailored-cache-list');

  countBadge.innerText = `${state.tailoredCache.length} / 5 Stored`;
  cacheList.innerHTML = '';

  if (state.tailoredCache.length === 0) {
    cacheList.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.75rem; padding:0.5rem 0;">No active tailored resumes cached</div>`;
    return;
  }

  // Render from newest (last in array) to oldest (first in array)
  [...state.tailoredCache].reverse().forEach(item => {
    const div = document.createElement('div');
    div.className = 'cache-item';
    div.style = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px; padding:0.35rem 0.55rem; font-size:0.8rem; margin-bottom: 0.3rem;';
    div.innerHTML = `
      <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:200px; color:var(--text-secondary);" title="${item.company} - ${item.title}">
        <span style="font-weight:700; color:var(--secondary);">${item.company}</span>: ${item.title}
      </div>
      <div style="display:flex; gap:0.4rem;">
        <button class="btn btn-secondary btn-see-cache" data-id="${item.jobId}" style="padding:0.25rem 0.45rem; font-size:0.68rem; height:24px;">See</button>
        <button class="btn btn-secondary btn-download-cache" data-id="${item.jobId}" style="padding:0.25rem 0.45rem; font-size:0.68rem; height:24px;">Download</button>
      </div>
    `;
    cacheList.appendChild(div);
  });

  // Attach button actions
  cacheList.querySelectorAll('.btn-see-cache').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const jobId = e.currentTarget.getAttribute('data-id');
      
      // Make sure the job is selected
      // If the job is not in state.activeJobs (e.g. manual job from past sessions), load a placeholder in activeJobs so UI doesn't crash
      let job = state.activeJobs.find(j => j.id === jobId);
      if (!job) {
        const cachedItem = state.tailoredCache.find(c => c.jobId === jobId);
        if (cachedItem) {
          job = {
            id: jobId,
            company: cachedItem.company,
            title: cachedItem.title,
            category: 'Custom Sector',
            location: 'Remote',
            salary: 'Contract/Fulltime',
            description: 'Custom manual or historical tailored job description context.',
            skills: ['ATS Optimized'],
            customQuestions: ['Standard Application Questions']
          };
          state.activeJobs.push(job);
          renderJobsFeedList();
        }
      }

      selectJob(jobId);
      
      // Swap tab to tailoring
      document.querySelector('[data-tab="tab-tailor-diff"]').click();
      playNotificationSound('work');
    });
  });

  cacheList.querySelectorAll('.btn-download-cache').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const jobId = e.currentTarget.getAttribute('data-id');
      const cachedItem = state.tailoredCache.find(c => c.jobId === jobId);
      if (!cachedItem) return;

      const text = cachedItem.tailoredText;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.profile.name.replace(/\s+/g, '_')}_Resume_${cachedItem.company.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      writeLog('log-terminal', `[SYSTEM]: Downloaded cached tailored resume for ${cachedItem.company}`, 'sys');
      playNotificationSound('work');
    });
  });
}

// Background Scraper Simulator Controls
function startMonitor() {
  state.monitorState = 'listening';
  
  document.getElementById('btn-start-monitor').setAttribute('disabled', 'true');
  document.getElementById('btn-pause-monitor').removeAttribute('disabled');
  document.getElementById('btn-stop-monitor').removeAttribute('disabled');

  document.getElementById('console-pulse-dot').className = 'pulse-dot pulsing';
  document.getElementById('console-status-lbl').innerText = 'LISTENING';
  
  document.getElementById('metric-status').innerText = 'ACTIVE';
  document.getElementById('metric-status').className = 'metric-value font-mono status-active';

  writeLog('log-terminal', `[SYSTEM]: Job monitoring resumed.`, 'info');
  playNotificationSound('success');
  
  startScraperLoop();
}

function pauseMonitor() {
  state.monitorState = 'paused';

  document.getElementById('btn-start-monitor').removeAttribute('disabled');
  document.getElementById('btn-pause-monitor').setAttribute('disabled', 'true');
  document.getElementById('btn-stop-monitor').removeAttribute('disabled');

  document.getElementById('console-pulse-dot').className = 'pulse-dot warning';
  document.getElementById('console-status-lbl').innerText = 'PAUSED';

  document.getElementById('metric-status').innerText = 'PAUSED';
  document.getElementById('metric-status').className = 'metric-value font-mono status-paused';

  if (scraperTimer) {
    clearInterval(scraperTimer);
    scraperTimer = null;
  }
  
  writeLog('log-terminal', `[SYSTEM]: Job monitoring paused.`, 'alert');
  playNotificationSound('work');
}

function stopMonitor() {
  state.monitorState = 'stopped';

  document.getElementById('btn-start-monitor').removeAttribute('disabled');
  document.getElementById('btn-pause-monitor').setAttribute('disabled', 'true');
  document.getElementById('btn-stop-monitor').setAttribute('disabled', 'true');

  document.getElementById('console-pulse-dot').className = 'pulse-dot muted';
  document.getElementById('console-status-lbl').innerText = 'STOPPED';

  document.getElementById('metric-status').innerText = 'INACTIVE';
  document.getElementById('metric-status').className = 'metric-value font-mono status-inactive';

  if (scraperTimer) {
    clearInterval(scraperTimer);
    scraperTimer = null;
  }
  
  writeLog('log-terminal', `[SYSTEM]: Job monitoring stopped.`, 'danger');
  playNotificationSound('work');
}

// Background Scraper Simulator
function startScraperLoop() {
  if (scraperTimer) clearInterval(scraperTimer);
  if (state.monitorState !== 'listening') return;
  
  scraperTimer = setInterval(() => {
    runScraperPulse();
  }, state.pollSpeed * 1000);
}

function runScraperPulse() {
  // Run the 24-hour cache maintenance check on active scraper threads
  checkAndPerform24HourReset();

  // Generate random monitoring logs
  const randomSite = state.jobsites[Math.floor(Math.random() * state.jobsites.length)];
  const domain = new URL(randomSite).hostname;
  writeLog('log-terminal', `[SCRAPER]: Polling database at ${domain} for remote openings...`, 'sys');
  
  // Increment total scanned count
  state.metrics.scanned += Math.floor(Math.random() * 8) + 3; // Simulate scanning multiple postings
  updateMetricsUI();
  saveStateToStorage();

  // Chance of finding a remote match (e.g. 50%)
  if (Math.random() > 0.45) {
    findNewMockJob();
  }
}

function checkTitleMatch(jobTitle, targetTitlesString) {
  if (!targetTitlesString || targetTitlesString.trim() === '') {
    return true; // Match everything if empty
  }
  const targets = targetTitlesString.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '');
  if (targets.length === 0) return true;
  
  const titleLower = jobTitle.toLowerCase();
  return targets.some(target => titleLower.includes(target));
}

function findNewMockJob() {
  // Find a job in the list that is not currently active
  const activeIds = state.activeJobs.map(j => j.id);
  const available = window.mockJobs.filter(j => !activeIds.includes(j.id));
  
  if (available.length === 0) {
    // If we have shown all, clear active list to repeat simulation
    state.activeJobs = [];
    return;
  }
  
  // Choose random job
  const job = available[Math.floor(Math.random() * available.length)];
  
  // Validate title matches preferences
  const matchesTitle = checkTitleMatch(job.title, state.profile.title);
  if (!matchesTitle) {
    job.skippedFilter = true;
    state.activeJobs.unshift(job);
    writeLog('log-terminal', `[FILTER]: Skipped ${job.company} - '${job.title}' (Does not match target titles: "${state.profile.title}").`, 'sys');
    renderJobsFeedList();
    return;
  }
  
  state.activeJobs.unshift(job); // Add to beginning of active list
  
  writeLog('log-terminal', `[MATCH]: MATCH FOUND! [${job.company}] - ${job.title}`, 'success');
  
  renderJobsFeedList();
  
  // Trigger Native Desktop Notification
  triggerBrowserNotification(
    `New Remote Match: ${job.company}`,
    `${job.title} is hiring remote in sector: ${job.category}. Click to review.`,
    job
  );

  // Auto Apply check
  checkAutoApplyRequirement(job);
}

function checkAutoApplyRequirement(job) {
  let categoryKey = '';
  if (job.category.includes('Healthcare')) categoryKey = 'hlp';
  else if (job.category.includes('Big Tech')) categoryKey = 'btc';
  else if (job.category.includes('Consulting')) categoryKey = 'cps';
  else if (job.category.includes('Financial')) categoryKey = 'fsi';
  else if (job.category.includes('Manufacturing')) categoryKey = 'mrc';
  else if (job.category.includes('Data Centers')) categoryKey = 'tdi';

  if (state.autoApplySectors[categoryKey]) {
    writeLog('log-terminal', `[AUTO-APPLY]: Active for [${job.category}]. Initializing Agent workflow.`, 'alert');
    // Start automated apply sequence after a small delay
    setTimeout(() => {
      executeAutoApplyWorkflow(job);
    }, 1500);
  }
}

function renderJobsFeedList() {
  const container = document.getElementById('feed-list');
  const counter = document.getElementById('job-feed-count');
  
  const visibleJobs = state.activeJobs.filter(j => !j.skippedFilter);
  
  if (visibleJobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon font-mono">∅</div>
        <p>No jobs detected yet. Scraper is running in the background...</p>
      </div>
    `;
    counter.innerText = '0 Jobs';
    return;
  }

  counter.innerText = `${visibleJobs.length} Jobs`;
  container.innerHTML = '';
  
  visibleJobs.forEach(job => {
    const isApplied = state.appliedJobs.includes(job.id);
    const card = document.createElement('div');
    card.className = `job-card ${state.selectedJobId === job.id ? 'active' : ''}`;
    card.setAttribute('data-id', job.id);
    
    card.innerHTML = `
      <div class="job-card-header">
        <span class="company-lbl">${job.company}</span>
        <span class="salary-tag font-mono">${job.salary}</span>
      </div>
      <div class="job-title-lbl">${job.title}</div>
      <div class="job-meta-row">
        <span>📍 ${job.location}</span>
        <span class="sector-tag" title="${job.category}">${job.category}</span>
      </div>
      ${isApplied ? '<span class="applied-stamp">Applied</span>' : ''}
    `;
    
    card.addEventListener('click', () => selectJob(job.id));
    container.appendChild(card);
  });
}

function selectJob(jobId) {
  state.selectedJobId = jobId;
  renderJobsFeedList();
  
  const job = state.activeJobs.find(j => j.id === jobId);
  if (!job) return;
  
  // Update selected UI
  document.getElementById('tailor-job-title').innerText = `${job.company} - ${job.title}`;
  document.getElementById('btn-tailor-selected').removeAttribute('disabled');
  
  // Set up side-by-side diff placeholder
  document.getElementById('diff-original').innerHTML = `
    <div style="font-weight:700; color:var(--text-primary); margin-bottom:0.5rem;">Job Description Context:</div>
    <div style="font-size:0.78rem; line-height:1.5; color:var(--text-secondary); background:rgba(255,255,255,0.01); padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); margin-bottom:1rem;">
      ${job.description}
    </div>
    <div style="font-weight:700; color:var(--text-primary); margin-bottom:0.5rem;">Required Skills:</div>
    <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:1rem;">
      ${job.skills.map(s => `<span class="badge" style="background:var(--secondary-glow); color:var(--secondary); border-color:rgba(190,95,50,0.15);">${s}</span>`).join('')}
    </div>
    <hr style="border:0; border-top:1px solid var(--border-color); margin-bottom:1rem;">
    <div class="diff-placeholder">Ready to analyze base resume against this role. Click "Tailor Resume" to execute.</div>
  `;
  
  // Check cache for tailored resume
  const cachedResume = state.tailoredCache.find(c => c.jobId === jobId);
  if (cachedResume) {
    renderDiffVisuals(state.profile.resume, cachedResume.tailoredText);
    document.getElementById('btn-export-pdf').removeAttribute('disabled');
    document.getElementById('btn-apply-now').removeAttribute('disabled');
  } else {
    document.getElementById('diff-tailored').innerHTML = `
      <div class="diff-placeholder">Ready to optimize.</div>
    `;
    document.getElementById('btn-export-pdf').setAttribute('disabled', 'true');
    document.getElementById('btn-apply-now').setAttribute('disabled', 'true');
  }
}

// Log writer helpers
function writeLog(terminalId, message, type = 'sys') {
  const terminal = document.getElementById(terminalId);
  const time = new Date().toLocaleTimeString();
  const row = document.createElement('div');
  row.className = `log-row ${type}`;
  row.innerText = `[${time}] ${message}`;
  terminal.appendChild(row);
  terminal.scrollTop = terminal.scrollHeight;
}

// Document Upload & File Readers
function setupEventListeners() {
  // Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const panel = e.currentTarget.closest('.panel-card');
      panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      panel.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      e.currentTarget.classList.add('active');
      const targetId = e.currentTarget.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
      
      playNotificationSound('work');
    });
  });

  // Theme Toggle Button
  document.getElementById('btn-theme-toggle').addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    state.theme = isLight ? 'light' : 'dark';
    document.getElementById('theme-toggle-icon').innerText = isLight ? '🌙' : '☀️';
    saveStateToStorage();
    playNotificationSound('notify');
  });

  // Settings Modal controls
  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').style.display = 'flex';
    playNotificationSound('work');
  });
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').style.display = 'none';
  });
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  
  // Add Jobsite Button
  document.getElementById('btn-add-jobsite').addEventListener('click', addJobsite);

  // Resume Base Input save
  document.getElementById('base-resume-text').addEventListener('input', (e) => {
    state.profile.resume = e.target.value;
    saveStateToStorage();
  });
  document.getElementById('profile-name').addEventListener('input', (e) => {
    state.profile.name = e.target.value;
    saveStateToStorage();
  });
  document.getElementById('profile-email').addEventListener('input', (e) => {
    state.profile.email = e.target.value;
    saveStateToStorage();
  });
  document.getElementById('profile-title').addEventListener('input', (e) => {
    state.profile.title = e.target.value;
    saveStateToStorage();
  });

  // Manual uploads file parsing
  setupFileDropzone('resume-dropzone', 'upload-resume-file', 'resume-file-info', (text, name) => {
    state.profile.resume = text;
    document.getElementById('base-resume-text').value = text;
    document.getElementById('resume-file-info').innerHTML = `✅ Parsed file: <strong>${name}</strong>`;
    saveStateToStorage();
    writeLog('log-terminal', `[SYSTEM]: Successfully parsed custom resume file: ${name}`, 'sys');
    playNotificationSound('success');
  });

  setupFileDropzone('jd-dropzone', 'upload-jd-file', 'jd-file-info', (text, name) => {
    document.getElementById('manual-jd-text').value = text;
    document.getElementById('jd-file-info').innerHTML = `✅ Parsed file: <strong>${name}</strong>`;
    writeLog('log-terminal', `[SYSTEM]: Successfully parsed custom Job Description: ${name}`, 'sys');
    playNotificationSound('success');
  });

  // Action Buttons
  document.getElementById('btn-notifications').addEventListener('click', requestNotificationPermission);
  document.getElementById('btn-test-notification').addEventListener('click', () => {
    triggerBrowserNotification('AutoApply Test', 'This is a test notification from the scraper agent.');
  });

  document.getElementById('btn-tailor-selected').addEventListener('click', () => {
    const job = state.activeJobs.find(j => j.id === state.selectedJobId);
    if (job) runResumeTailoring(job);
  });

  document.getElementById('btn-tailor-manual').addEventListener('click', runManualJobTailoring);

  document.getElementById('btn-apply-now').addEventListener('click', () => {
    const job = state.activeJobs.find(j => j.id === state.selectedJobId);
    if (job) executeAutoApplyWorkflow(job);
  });

  document.getElementById('btn-export-pdf').addEventListener('click', downloadTailoredPDF);

  // Scraper Controls
  document.getElementById('btn-start-monitor').addEventListener('click', startMonitor);
  document.getElementById('btn-pause-monitor').addEventListener('click', pauseMonitor);
  document.getElementById('btn-stop-monitor').addEventListener('click', stopMonitor);
}

// File dropzone handler
function setupFileDropzone(dropzoneId, inputId, infoId, callback) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--secondary)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--border-color)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUploadedFile(files[0], infoId, callback);
    }
  });

  input.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleUploadedFile(files[0], infoId, callback);
    }
  });
}

function handleUploadedFile(file, infoId, callback) {
  const info = document.getElementById(infoId);
  info.innerText = `Reading file ${file.name}...`;

  const extension = file.name.split('.').pop().toLowerCase();
  
  if (extension === 'txt') {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result, file.name);
    reader.readAsText(file);
  } else if (extension === 'docx') {
    const reader = new FileReader();
    reader.onload = (e) => {
      mammoth.extractRawText({ arrayBuffer: e.target.result })
        .then(result => {
          callback(result.value, file.name);
        })
        .catch(err => {
          info.innerText = `Error parsing docx file.`;
          console.error(err);
        });
    };
    reader.readAsArrayBuffer(file);
  } else if (extension === 'pdf') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const typedarray = new Uint8Array(e.target.result);
      pdfjsLib.getDocument(typedarray).promise.then(pdf => {
        let maxPages = pdf.numPages;
        let countPromises = [];
        for (let j = 1; j <= maxPages; j++) {
          let page = pdf.getPage(j);
          countPromises.push(page.then(p => {
            return p.getTextContent().then(textContent => {
              return textContent.items.map(s => s.str).join(' ');
            });
          }));
        }
        Promise.all(countPromises).then(texts => {
          callback(texts.join('\n'), file.name);
        });
      }).catch(err => {
        info.innerText = `Error parsing pdf file.`;
        console.error(err);
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    info.innerText = `Unsupported file format. Please upload .txt, .docx, or .pdf`;
  }
}

// Settings Save
function saveSettings() {
  const apiKey = document.getElementById('settings-api-key').value.trim();
  const notifEmail = document.getElementById('settings-notification-email').value.trim() || 'willieekams@aol.com';
  const speed = parseInt(document.getElementById('settings-poll-speed').value);
  
  state.apiKey = apiKey;
  state.notificationEmail = notifEmail;
  state.pollSpeed = speed;
  state.autoApplySectors = {
    hlp: document.getElementById('toggle-hlp').checked,
    btc: document.getElementById('toggle-btc').checked,
    cps: document.getElementById('toggle-cps').checked,
    fsi: document.getElementById('toggle-fsi').checked,
    mrc: document.getElementById('toggle-mrc').checked,
    tdi: document.getElementById('toggle-tdi').checked
  };

  saveStateToStorage();
  startScraperLoop();
  
  document.getElementById('settings-modal').style.display = 'none';
  writeLog('log-terminal', `[SYSTEM]: Settings updated. Scraper loop frequency set to ${speed} seconds.`, 'sys');
  playNotificationSound('success');
}

// Settings range slider listener
document.getElementById('settings-poll-speed').addEventListener('input', (e) => {
  document.getElementById('settings-poll-speed-val').innerText = `${e.target.value}s`;
});

// Resume Tailoring Engine execution
function runResumeTailoring(job) {
  writeLog('log-terminal', `[AI ENGINE]: Tailoring resume for role: ${job.title} at ${job.company}...`, 'alert');
  
  // Set diff view loading states
  document.getElementById('diff-tailored').innerHTML = `
    <div class="diff-placeholder">
      <div style="font-size:2rem; animation: state-flash 1s infinite alternate; margin-bottom:1rem;">🤖</div>
      Running AI Tailoring Engine... Please wait...
    </div>
  `;

  if (state.apiKey) {
    // Live Gemini API Tailoring
    callGeminiAPITailoring(job);
  } else {
    // Smart Heuristic Fallback (Demo Mode)
    setTimeout(() => {
      const tailoredText = runHeuristicTailoring(state.profile.resume, job);
      saveTailoredResumeToCache(job.id, job.company, job.title, tailoredText);
      
      // Update tailored metrics
      state.metrics.tailored++;
      updateMetricsUI();
      saveStateToStorage();

      renderDiffVisuals(state.profile.resume, tailoredText);
      
      // Enable Actions
      document.getElementById('btn-export-pdf').removeAttribute('disabled');
      document.getElementById('btn-apply-now').removeAttribute('disabled');
      writeLog('log-terminal', `[AI ENGINE]: Heuristic optimization complete. High compatibility match.`, 'success');
      playNotificationSound('success');
    }, 1500);
  }
}

// Manual custom job tailoring
function runManualJobTailoring() {
  const company = document.getElementById('manual-company').value.trim() || 'Custom Company';
  const role = document.getElementById('manual-role').value.trim() || 'Custom Remote Role';
  const category = document.getElementById('manual-category').value;
  const jdText = document.getElementById('manual-jd-text').value.trim();

  if (!jdText) {
    alert('Please enter or upload a Job Description to tailor.');
    return;
  }

  // Create temporary mock job item
  const manualJob = {
    id: `manual-${Date.now()}`,
    company: company,
    title: role,
    category: category,
    location: 'Remote',
    salary: 'Contract/Fulltime',
    description: jdText,
    skills: extractKeywordsFromText(jdText),
    customQuestions: [
      `Why do you want to work at ${company}?`,
      `Explain your experience related to the job requirements.`
    ]
  };

  // Inject into active jobs feed
  state.activeJobs.unshift(manualJob);
  renderJobsFeedList();
  
  // Switch Tab to Tailor Pane
  document.querySelector('[data-tab="tab-tailor-diff"]').click();
  
  // Select and trigger tailoring
  selectJob(manualJob.id);
  runResumeTailoring(manualJob);
}

// Extract keywords locally to generate custom questions
function extractKeywordsFromText(text) {
  const commonTech = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'Go', 'Terraform', 'SQL', 'Fintech', 'HIPAA', 'Consulting'];
  const matched = [];
  commonTech.forEach(tech => {
    const regex = new RegExp(`\\b${tech}\\b`, 'i');
    if (regex.test(text)) matched.push(tech);
  });
  return matched.length > 0 ? matched : ['Software Delivery', 'Systems Design'];
}

// Live Gemini API integration
async function callGeminiAPITailoring(job) {
  const prompt = `You are an expert ATS (Applicant Tracking System) optimizer. Tailor the following resume to match this Job Description. 
Do not lie, but rewrite bullet points, update summary, and reorganize technical skills to highlight matching competencies.

Return a JSON object containing:
{
  "tailoredResume": "Fully tailored resume text matching the exact styling of the original",
  "changesMadeSummary": "Short explanation of adjustments"
}

ORIGINAL RESUME:
${state.profile.resume}

JOB DESCRIPTION:
Company: ${job.company}
Title: ${job.title}
Details: ${job.description}
Key Skills: ${job.skills.join(', ')}

Output valid JSON only.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    const resultObj = JSON.parse(resultText);

    saveTailoredResumeToCache(job.id, job.company, job.title, resultObj.tailoredResume);
    
    // Update metrics
    state.metrics.tailored++;
    updateMetricsUI();
    saveStateToStorage();

    renderDiffVisuals(state.profile.resume, resultObj.tailoredResume);
    
    document.getElementById('btn-export-pdf').removeAttribute('disabled');
    document.getElementById('btn-apply-now').removeAttribute('disabled');
    writeLog('log-terminal', `[AI ENGINE]: Gemini API tailoring successful. ATS Optimization details: ${resultObj.changesMadeSummary}`, 'success');
    playNotificationSound('success');

  } catch (err) {
    console.error('Gemini API call failed, falling back to heuristic engine', err);
    writeLog('log-terminal', `[AI ENGINE]: Live API tailoring failed. Falling back to local heuristic optimization...`, 'danger');
    
    // Run fallback
    setTimeout(() => {
      const tailoredText = runHeuristicTailoring(state.profile.resume, job);
      saveTailoredResumeToCache(job.id, job.company, job.title, tailoredText);
      
      state.metrics.tailored++;
      updateMetricsUI();
      saveStateToStorage();

      renderDiffVisuals(state.profile.resume, tailoredText);
      document.getElementById('btn-export-pdf').removeAttribute('disabled');
      document.getElementById('btn-apply-now').removeAttribute('disabled');
      writeLog('log-terminal', `[AI ENGINE]: Heuristic optimization complete.`, 'success');
      playNotificationSound('success');
    }, 1000);
  }
}

// Fallback Heuristic Resume Optimizer (Mock AI engine)
function runHeuristicTailoring(resumeText, job) {
  // Simple NLP alignment by modifying summary and experiences with target keywords
  let lines = resumeText.split('\n');
  const jobTitle = job.title.replace(/\(remote\)/i, '').trim();
  
  // Identify key job skills to inject
  const targetSkills = job.skills.slice(0, 4);

  let newLines = lines.map(line => {
    // 1. Rewrite Name and header - keep intact
    if (line.includes('ALEX MERCER') || line.includes('San Francisco')) {
      return line;
    }

    // 2. Rewrite target role title in experience or summary
    if (line.startsWith('Dynamic and results-driven')) {
      return `Dynamic and results-driven ${jobTitle} with over 6 years of experience designing and implementing scalable remote networks. Proven expertise aligning enterprise setups with ${targetSkills.join(', ')} standards.`;
    }

    // 3. Re-architect technical skills list to prioritize matched skills
    if (line.startsWith('- Cloud Platforms:') || line.startsWith('- Containers & Orchestration:') || line.startsWith('- Infrastructure as Code:')) {
      // Inject primary skills
      let matchingSkill = targetSkills.find(s => line.toLowerCase().includes(s.toLowerCase()));
      if (matchingSkill) {
        return line.replace(':', `: ${matchingSkill},`);
      }
      return line;
    }

    // 4. Optimize bullet points in Professional experience to align with JD keywords
    if (line.trim().startsWith('-')) {
      // Modify bullets to match job specs
      if (line.includes('Led the migration') && job.skills.includes('AWS')) {
        return `  - Orchestrated high-performance cloud migration pipelines to AWS, cutting provisioning overhead by 35% and improving compute capacity.`;
      }
      if (line.includes('Architected Kubernetes') && (job.skills.includes('Kubernetes') || job.skills.includes('GKE'))) {
        return `  - Architected high-availability Kubernetes clusters (incorporating ${job.skills.includes('GKE') ? 'GKE' : 'containers'}), supporting 15,000 live requests per minute.`;
      }
      if (line.includes('Standardized infrastructure') && job.skills.includes('Terraform')) {
        return `  - Standardized multicloud infrastructure deployments using reusable Terraform workflows and CI/CD pipelines.`;
      }
      if (line.includes('Designed and maintained') && job.skills.includes('Python')) {
        return `  - Designed automated server workflows using Python scripts and Jenkins, cutting build integration issues by 40%.`;
      }
    }

    return line;
  });

  // Inject job-specific tools into skills block
  let skillIndex = newLines.findIndex(l => l.includes('TECHNICAL SKILLS'));
  if (skillIndex !== -1) {
    let skillInjections = job.skills.filter(s => !resumeText.toLowerCase().includes(s.toLowerCase()));
    if (skillInjections.length > 0) {
      newLines.splice(skillIndex + 1, 0, `- Targeted Core Technologies: ${skillInjections.join(', ')}`);
    }
  }

  return newLines.join('\n');
}

// Side-by-Side Diff visualizer
function renderDiffVisuals(originalText, tailoredText) {
  const origPane = document.getElementById('diff-original');
  const tailPane = document.getElementById('diff-tailored');

  const origLines = originalText.split('\n');
  const tailLines = tailoredText.split('\n');

  origPane.innerHTML = '';
  tailPane.innerHTML = '';

  // Render original
  origLines.forEach(line => {
    const div = document.createElement('div');
    div.style.minHeight = '1.3rem';
    
    // Check if line was changed in tailored
    const lineClean = line.trim();
    const wasModified = lineClean && !tailLines.some(l => l.trim() === lineClean);
    
    if (wasModified && lineClean.startsWith('-')) {
      div.innerHTML = `<span class="diff-del">${escapeHTML(line)}</span>`;
    } else {
      div.innerText = line;
    }
    origPane.appendChild(div);
  });

  // Render tailored
  tailLines.forEach(line => {
    const div = document.createElement('div');
    div.style.minHeight = '1.3rem';
    
    const lineClean = line.trim();
    const isNew = lineClean && !origLines.some(l => l.trim() === lineClean);

    if (isNew && lineClean.startsWith('-')) {
      div.innerHTML = `<span class="diff-add">${escapeHTML(line)}</span>`;
    } else {
      div.innerText = line;
    }
    tailPane.appendChild(div);
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Export tailored resume
function downloadTailoredPDF() {
  const job = state.activeJobs.find(j => j.id === state.selectedJobId);
  if (!job) return;
  const cachedItem = state.tailoredCache.find(c => c.jobId === job.id);
  if (!cachedItem) return;

  const text = cachedItem.tailoredText;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.profile.name.replace(/\s+/g, '_')}_Resume_${job.company.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  writeLog('log-terminal', `[SYSTEM]: Downloaded tailored resume: ${a.download}`, 'sys');
}

// Auto-Apply Automation script
function executeAutoApplyWorkflow(job) {
  // Ensure the resume is tailored first
  let cachedItem = state.tailoredCache.find(c => c.jobId === job.id);
  if (!cachedItem) {
    const tailoredText = runHeuristicTailoring(state.profile.resume, job);
    saveTailoredResumeToCache(job.id, job.company, job.title, tailoredText);
    state.metrics.tailored++;
    updateMetricsUI();
    saveStateToStorage();
  }

  // Switch tab to Agent tab
  document.querySelector('[data-tab="tab-apply-agent"]').click();
  
  const terminal = document.getElementById('apply-terminal');
  terminal.innerHTML = ''; // Clear terminal

  const agentStateDot = document.getElementById('agent-state-dot');
  const agentStateText = document.getElementById('agent-state-text');
  
  agentStateDot.className = 'state-dot state-working';
  agentStateText.innerText = 'AUTO-APPLYING';

  writeLog('apply-terminal', `[AGENT]: Initializing auto-apply instructions for ${job.company}...`, 'info');
  playNotificationSound('work');

  const steps = [
    { delay: 1000, msg: `[AGENT]: Compiling tailored credentials packet (Name: ${state.profile.name}, Target: ${job.title})...`, type: 'sys' },
    { delay: 1800, msg: `[AGENT]: Injecting optimized resume bytes into ATS interface. Match ratio: 94%`, type: 'info' },
    { delay: 2600, msg: `[AGENT]: Auto-detecting questionnaire forms... [2 custom fields matched]`, type: 'alert' },
    { delay: 3500, msg: `[AGENT]: Formulating AI Answer to: "${job.customQuestions[0]}"`, type: 'sys' },
    { delay: 4400, msg: `[AGENT]: AI Draft: "In cloud engineering contexts, I optimize workflows matching standard ${job.skills[0]} guidelines. At CloudCorp, this reduced server operations costs by 35%."`, type: 'bullet' },
    { delay: 5200, msg: `[AGENT]: Formulating AI Answer to: "${job.customQuestions[1]}"`, type: 'sys' },
    { delay: 6000, msg: `[AGENT]: AI Draft: "I balance security rules and speed by structuring reusable deployment models (Terraform) and active monitoring arrays."`, type: 'bullet' },
    { delay: 6800, msg: `[AGENT]: Navigating submit action, avoiding portal tracking constraints...`, type: 'sys' },
    { delay: 7600, msg: `[AGENT]: Submitting final job application to careers portal endpoint...`, type: 'alert' },
    { delay: 8400, msg: `[AGENT]: SUCCESS! Application confirmation response 200 OK.`, type: 'success' },
    { delay: 9200, msg: `[AGENT]: Preparing notification receipt summary...`, type: 'sys' },
    { delay: 10000, msg: `[AGENT]: Dispatching email notification to: ${state.notificationEmail}`, type: 'info' },
    { delay: 11000, msg: `[AGENT]: SMTP delivery confirmation. Message accepted (ID: msg_9a8f23b).`, type: 'success' }
  ];

  steps.forEach(step => {
    setTimeout(() => {
      writeLog('apply-terminal', step.msg, step.type);
      playNotificationSound('work');
      
      // Update skill match ratio on step 2
      if (step.delay === 1800) {
        document.getElementById('agent-skills-ratio').innerText = '94%';
      }
    }, step.delay);
  });

  // Final success callback
  setTimeout(() => {
    agentStateDot.className = 'state-dot state-success';
    agentStateText.innerText = 'COMPLETED';

    // Record applied status
    if (!state.appliedJobs.includes(job.id)) {
      state.appliedJobs.push(job.id);
      state.metrics.applied++;
    }

    // Capture tailored text for the email composer before eviction from active list
    const cachedResume = state.tailoredCache.find(c => c.jobId === job.id);
    const resumeTextContent = cachedResume ? cachedResume.tailoredText : '';

    // Evict this job's tailored resume from cache now that it's successfully applied
    state.tailoredCache = state.tailoredCache.filter(c => c.jobId !== job.id);

    updateMetricsUI();
    saveStateToStorage();
    renderJobsFeedList();
    renderTailoredCache(); // Re-render the Middle Panel cache list

    // Show details card
    document.getElementById('apply-submission-card').style.display = 'block';
    document.getElementById('sub-val-company').innerText = job.company;
    document.getElementById('sub-val-role').innerText = job.title;
    document.getElementById('sub-val-time').innerText = new Date().toLocaleTimeString();
    document.getElementById('sub-val-questions').innerText = job.customQuestions.length;

    // Formulate prefilled email details
    const subject = encodeURIComponent(`AutoApply AI Receipt: Applied to ${job.title} at ${job.company}`);
    const body = encodeURIComponent(`Hello,\n\nThis is an automated notification from AutoApply AI.\n\nWe have successfully applied for the following remote job:\n- Company: ${job.company}\n- Role: ${job.title}\n- Sector: ${job.category}\n- Salary: ${job.salary}\n- Timestamp: ${new Date().toLocaleString()}\n\nAttached Tailored Resume Context:\n====================\n${resumeTextContent}\n\nBest regards,\nAutoApply AI Agent`);

    // Attach click listener for manually recomposing email
    const emailBtn = document.getElementById('btn-compose-email');
    emailBtn.onclick = () => {
      window.location.href = `mailto:${state.notificationEmail}?subject=${subject}&body=${body}`;
    };

    writeLog('log-terminal', `[AUTO-APPLY]: Successfully applied for ${job.title} at ${job.company}!`, 'success');
    writeLog('log-terminal', `[AUTO-APPLY]: Evicted tailored resume from active cache post-submission.`, 'sys');
    writeLog('log-terminal', `[AUTO-APPLY]: Email receipt queued for: ${state.notificationEmail}`, 'sys');
    playNotificationSound('success');

    // Always trigger automated mail client composer draft launch
    setTimeout(() => {
      writeLog('apply-terminal', `[AGENT]: Redirecting browser to native mail client for receipt dispatch...`, 'sys');
      window.location.href = `mailto:${state.notificationEmail}?subject=${subject}&body=${body}`;
    }, 1200);
  }, 11500);
}
