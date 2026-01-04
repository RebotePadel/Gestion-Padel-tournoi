(function() {
  'use strict';

  var sections = {
    home: document.getElementById('home-root'),
    admin: document.getElementById('admin-root'),
    tv: document.getElementById('tv-root'),
    tournaments: document.getElementById('tournaments-root'),
    classic: document.getElementById('classic-root'),
    americano: document.getElementById('americano-root'),
    americanoTv: document.getElementById('americano-tv-root'),
    solonight: document.getElementById('solonight-root'),
    solonightTv: document.getElementById('solonight-tv-root'),
    ligue: document.getElementById('ligue-root'),
    ligueConfig: document.getElementById('ligue-config-root'),
    ligueActive: document.getElementById('ligue-active-root'),
    ligueManage: document.getElementById('ligue-manage-root'),
    liguePlayer: document.getElementById('ligue-player-root'),
    liguePlayerManage: document.getElementById('ligue-player-manage-root'),
    settings: document.getElementById('settings-root')
  };

  var PONG_STORAGE_KEY = 'padelPongConfig';
  var defaultPongConfig = { sponsorName: '', sponsorLogo: '', aiName: 'PadelBot', url: '/padel-pong.html' };
  var padelPongConfig = loadPongConfig();

  var current = 'home';
  var historyStack = [];

  var settingsTabs = []; 
  var pongRefs = {};

  function renderBackButton() {
    var btn = document.getElementById('btn-header-back');
    if (!btn) return;
    if (current === 'home') {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'inline-flex';
    }
  }

  function hideAllSections() {
    Object.keys(sections).forEach(function(key) {
      var el = sections[key];
      if (el) el.style.display = 'none';
    });
  }

  function showSection(key, options) {
    if (!sections[key]) return;
    var fromBack = options && options.fromBack;
    if (!fromBack && current && key !== current) {
      historyStack.push(current);
    }

    // Retirer tv-mode sauf pour les vues TV
    var tvSections = ['tv', 'americanoTv', 'solonightTv', 'liguePlayer', 'liguePlayerManage'];
    if (tvSections.indexOf(key) === -1) {
      document.body.classList.remove('tv-mode');
      // Nettoyer systèmes TV si on quitte une vue TV
      if (current && tvSections.indexOf(current) !== -1) {
        if (typeof window.mdDestroyTVSystems === 'function') {
          try { window.mdDestroyTVSystems(); } catch (e) { /* noop */ }
        }
      }
    }

    hideAllSections();
    sections[key].style.display = 'block';
    current = key;
    if (key === 'home') {
      historyStack = [];
    }
    renderBackButton();
    window.scrollTo(0, 0);

    if (key === 'settings') {
      activateSettingsTab('settings-panel-app');
    }
    updatePongTvVisibility();
  }

  function showHome() { showSection('home'); }
  function showAdmin() { showSection('admin'); }
  function showTV() {
    showSection('tv');
    document.body.classList.add('tv-mode'); // Masquer sidebar
    if (typeof window.mdRenderTvView === 'function') {
      try { window.mdRenderTvView(); } catch (e) { /* noop */ }
    }
    // Initialiser systèmes TV (rotation + animations)
    if (typeof window.mdInitTVSystems === 'function') {
      try { window.mdInitTVSystems(); } catch (e) { console.warn('TV init error:', e); }
    }
    updatePongTvVisibility();
  }
  function showTournaments() { showSection('tournaments'); }
  function showClassic() { showSection('classic'); }
  function showAmericano() {
    showSection('americano');
    if (window.AMERICANO && typeof window.AMERICANO.render === 'function') window.AMERICANO.render();
  }
  function showAmericanoTv() {
    showSection('americanoTv');
    document.body.classList.add('tv-mode'); // Masquer sidebar
    if (window.AMERICANO && typeof window.AMERICANO.renderTv === 'function') window.AMERICANO.renderTv();
  }
  function showSoloNight() {
    showSection('solonight');
    if (window.SOLONIGHT && typeof window.SOLONIGHT.render === 'function') window.SOLONIGHT.render();
  }
  function showSoloNightTv() {
    showSection('solonightTv');
    document.body.classList.add('tv-mode'); // Masquer sidebar
    if (window.SOLONIGHT && typeof window.SOLONIGHT.renderTv === 'function') window.SOLONIGHT.renderTv();
  }
  function showLigue() { showSection('ligue'); }
  function showLigueConfig() { showSection('ligueConfig'); }
  function showLigueActive() { showSection('ligueActive'); }
  function showLigueManage() { showSection('ligueManage'); }
  function showLiguePlayer() {
    showSection('liguePlayer');
    document.body.classList.add('tv-mode'); // Masquer sidebar
  }
  function showHomologue() { showSection('homologue'); }
  function showSettings() { showSection('settings'); }

  function goBack() {
    if (!historyStack.length) {
      showSection('home', { fromBack: true });
      return;
    }
    var prev = historyStack.pop();
    showSection(prev, { fromBack: true });
  }

  function bind(id, handler) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  }

  function loadPongConfig() {
    try {
      var raw = localStorage.getItem(PONG_STORAGE_KEY);
      if (raw) return Object.assign({}, defaultPongConfig, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return Object.assign({}, defaultPongConfig);
  }

  function savePongConfig() {
    try {
      localStorage.setItem(PONG_STORAGE_KEY, JSON.stringify(padelPongConfig));
    } catch (e) { /* noop */ }
  }

  function activateSettingsTab(targetId) {
    settingsTabs.forEach(function(btn) {
      var panelId = btn.getAttribute('data-target');
      if (!panelId) return;
      var panel = document.getElementById(panelId);
      var isActive = panelId === targetId;
      btn.classList[isActive ? 'add' : 'remove']('active');
      if (panel) panel.classList[isActive ? 'add' : 'remove']('active');
    });
  }

  function generateQr(targetId, text, size) {
    var target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = '';
    var content = text || '/padel-pong.html';
    try {
      if (typeof window.QRCode === 'function') {
        var qr = new window.QRCode(4, 1);
        qr.addData(content);
        qr.make();
        var mCount = qr.getModuleCount();
        var tile = (size || 140) / mCount;
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = Math.ceil(tile * mCount);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        for (var r = 0; r < mCount; r++) {
          for (var c = 0; c < mCount; c++) {
            if (qr.isDark(r, c)) {
              ctx.fillRect(Math.round(c * tile), Math.round(r * tile), Math.ceil(tile), Math.ceil(tile));
            }
          }
        }
        target.appendChild(canvas);
        return;
      }
    } catch (err) { /* fallback below */ }

    var fallback = document.createElement('div');
    fallback.textContent = content;
    fallback.className = 'small-muted';
    target.appendChild(fallback);
  }

  function makeDraggableAndResizable(el, dragHandle, resizeHandle) {
    if (!el) return;
    var pos = { x: 0, y: 0 };

    function onDragStart(e) {
      e.preventDefault();
      var startX = e.clientX;
      var startY = e.clientY;
      function onMove(ev) {
        ev.preventDefault();
        pos.x += ev.clientX - startX;
        pos.y += ev.clientY - startY;
        startX = ev.clientX;
        startY = ev.clientY;
        el.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      }
      function onEnd() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
    }

    function onResizeStart(e) {
      e.preventDefault();
      var startX = e.clientX;
      var startY = e.clientY;
      var startW = el.offsetWidth;
      var startH = el.offsetHeight;
      function onMove(ev) {
        ev.preventDefault();
        var newW = Math.max(180, startW + (ev.clientX - startX));
        var newH = Math.max(140, startH + (ev.clientY - startY));
        el.style.width = newW + 'px';
        el.style.height = newH + 'px';
      }
      function onEnd() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
    }

    if (dragHandle) dragHandle.addEventListener('mousedown', onDragStart);
    if (resizeHandle) resizeHandle.addEventListener('mousedown', onResizeStart);
  }

  function syncPongForm() {
    if (!pongRefs.settings) return;
    if (pongRefs.sponsor) pongRefs.sponsor.value = padelPongConfig.sponsorName || '';
    if (pongRefs.logo) pongRefs.logo.value = padelPongConfig.sponsorLogo || '';
    if (pongRefs.ai) pongRefs.ai.value = padelPongConfig.aiName || 'PadelBot';
    var meta = document.getElementById('pp-meta');
    if (meta) meta.textContent = 'Sponsor: ' + (padelPongConfig.sponsorName || '—') + ' • IA: ' + (padelPongConfig.aiName || 'PadelBot');
    generateQr('pp-qr', padelPongConfig.url, 150);
    generateQr('pong-tv-qr-md', padelPongConfig.url, 80);
    generateQr('pong-tv-qr-classic', padelPongConfig.url, 80);
    var nameMd = document.getElementById('pong-tv-name-md');
    var nameClassic = document.getElementById('pong-tv-name-classic');
    if (nameMd) nameMd.textContent = padelPongConfig.sponsorName || 'Padel Pong';
    if (nameClassic) nameClassic.textContent = padelPongConfig.sponsorName || 'Padel Pong';
  }

  function initPongSettings() {
    pongRefs.settings = document.getElementById('settings-panel-pong');
    if (!pongRefs.settings) return;
    pongRefs.sponsor = document.getElementById('pp-sponsor-name');
    pongRefs.logo = document.getElementById('pp-sponsor-logo');
    pongRefs.ai = document.getElementById('pp-ai-name');
    pongRefs.save = document.getElementById('pp-save-settings');
    pongRefs.open = document.getElementById('pp-open-game');

    if (pongRefs.save) pongRefs.save.addEventListener('click', function() {
      padelPongConfig.sponsorName = pongRefs.sponsor ? pongRefs.sponsor.value : '';
      padelPongConfig.sponsorLogo = pongRefs.logo ? pongRefs.logo.value : '';
      padelPongConfig.aiName = pongRefs.ai ? pongRefs.ai.value : 'PadelBot';
      savePongConfig();
      syncPongForm();
      updatePongTvVisibility();
    });

    if (pongRefs.open) pongRefs.open.addEventListener('click', function() {
      window.open(padelPongConfig.url, '_blank');
    });

    var card = document.getElementById('pp-card-draggable');
    makeDraggableAndResizable(card, card ? card.querySelector('.drag-handle') : null, card ? card.querySelector('.resize-handle') : null);
    syncPongForm();
  }

  function toggleTvWidget(id, show) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.display = show ? 'block' : 'none';
  }

  function initTvWidgets() {
    var md = document.getElementById('pong-tv-widget-md');
    var mdDrag = document.getElementById('pong-tv-drag-md');
    var mdResize = md ? md.querySelector('.resize-handle') : null;
    makeDraggableAndResizable(md, mdDrag, mdResize);
    var mdHide = document.getElementById('pong-tv-hide-md');
    if (mdHide) mdHide.addEventListener('click', function() { toggleTvWidget('pong-tv-widget-md', false); });

    var classic = document.getElementById('pong-tv-widget-classic');
    var classicDrag = document.getElementById('pong-tv-drag-classic');
    var classicResize = classic ? classic.querySelector('.resize-handle') : null;
    makeDraggableAndResizable(classic, classicDrag, classicResize);
    var classicHide = document.getElementById('pong-tv-hide-classic');
    if (classicHide) classicHide.addEventListener('click', function() { toggleTvWidget('pong-tv-widget-classic', false); });

    syncPongForm();
    updatePongTvVisibility();

    var classicOverlay = document.getElementById('tv-overlay');
    if (classicOverlay && typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function() { updatePongTvVisibility(); });
      obs.observe(classicOverlay, { attributes: true, attributeFilter: ['style', 'class'] });
    }
  }

  function updatePongTvVisibility() {
    var mdVisible = sections.tv && sections.tv.style.display !== 'none';
    var classicOverlay = document.getElementById('tv-overlay');
    var classicVisible = classicOverlay && classicOverlay.style.display !== 'none';
    var hasConfig = !!padelPongConfig;

    // Vérifier les nouveaux paramètres TV pour le widget Pong
    var pongTVWidget = null;
    try {
      var stored = localStorage.getItem('pong_tv_widget');
      if (stored) pongTVWidget = JSON.parse(stored);
    } catch (e) { }

    // M/D widget Pong
    var mdPongEnabled = true; // Par défaut activé (ancien comportement)
    if (pongTVWidget && pongTVWidget.modes) {
      mdPongEnabled = pongTVWidget.enabled && pongTVWidget.modes.md;
    }
    toggleTvWidget('pong-tv-widget-md', hasConfig && mdVisible && mdPongEnabled);

    // Classic widget Pong
    var classicPongEnabled = true;
    if (pongTVWidget && pongTVWidget.modes) {
      classicPongEnabled = pongTVWidget.enabled && pongTVWidget.modes.classic;
    }
    toggleTvWidget('pong-tv-widget-classic', hasConfig && classicVisible && classicPongEnabled);
  }

  function initSettingsTabs() {
    settingsTabs = Array.prototype.slice.call(document.querySelectorAll('.settings-tab'));
    settingsTabs.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var target = btn.getAttribute('data-target');
        activateSettingsTab(target);
      });
    });
  }

  bind('btn-header-back', goBack);

  bind('btn-home-tournaments', showTournaments);
  bind('btn-home-md', showAdmin);
  bind('btn-home-ligue', showLigue);
  bind('btn-home-homologue', showHomologue);
  bind('btn-settings-home', showHome);

  // Binding pour les boutons avec classe (plusieurs boutons "Vue joueur")
  var liguePlayerBtns = document.querySelectorAll('.btn-ligue-player-view');
  liguePlayerBtns.forEach(function(btn) {
    btn.addEventListener('click', showLiguePlayer);
  });

  bind('btn-back-home-from-md', showHome);
  bind('btn-go-tv', showTV);
  bind('btn-back-admin', showAdmin);

  bind('btn-back-home-from-tournaments', showHome);
  bind('btn-back-home-from-homologue', showHome);

  bind('btn-back-home-from-classic', showHome);
  bind('btn-back-formats-from-classic', showTournaments);
  bind('btn-open-americano', showAmericano);
  bind('btn-open-solonight', showSoloNight);
  bind('btn-americano-home', showHome);
  bind('btn-americano-formats', showTournaments);
  bind('btn-americano-open-tv', showAmericanoTv);
  bind('btn-americano-tv-back', showAmericano);

  bind('btn-solonight-home', showHome);
  bind('btn-solonight-formats', showTournaments);
  bind('btn-solonight-open-tv', showSoloNightTv);
  bind('btn-solonight-tv-back', showSoloNight);

  bind('btn-back-home-from-ligue', showHome);
  bind('btn-ligue-config', showLigueConfig);
  bind('btn-ligue-active', showLigueActive);
  bind('btn-ligue-config-back', showLigue);
  bind('btn-ligue-active-back', showLigue);
  bind('btn-ligue-manage-back', showLigueActive);
  bind('btn-ligue-player-back', showLigue);

  initSettingsTabs();
  initPongSettings();
  initTvWidgets();

  renderBackButton();

  window.hideAllSections = hideAllSections;
  window.showHome = showHome;
  window.showAdmin = showAdmin;
  window.showTV = showTV;
  window.showTournaments = showTournaments;
  window.showClassic = showClassic;
  window.showAmericano = showAmericano;
  window.showAmericanoTv = showAmericanoTv;
  window.showSoloNight = showSoloNight;
  window.showSoloNightTv = showSoloNightTv;
  window.showLigue = showLigue;
  window.showLigueConfig = showLigueConfig;
  window.showLigueActive = showLigueActive;
  window.showLigueManage = showLigueManage;
  window.showLiguePlayer = showLiguePlayer;
  window.showSettings = showSettings;
  window.navigateToSection = showSection;
  window.goBack = goBack;
  window.updatePongTvVisibility = updatePongTvVisibility;
})();
