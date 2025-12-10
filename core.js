(function() {
  'use strict';

  var sections = {
    home: document.getElementById('home-root'),
    admin: document.getElementById('admin-root'),
    tv: document.getElementById('tv-root'),
    tournaments: document.getElementById('tournaments-root'),
    classic: document.getElementById('classic-root'),
    ligue: document.getElementById('ligue-root'),
    ligueConfig: document.getElementById('ligue-config-root'),
    ligueActive: document.getElementById('ligue-active-root'),
    ligueManage: document.getElementById('ligue-manage-root'),
    liguePlayer: document.getElementById('ligue-player-root'),
    liguePlayerManage: document.getElementById('ligue-player-manage-root'),
    settings: document.getElementById('settings-root')
  };

  var current = 'home';
  var historyStack = [];

  function renderBackButton() {
    var btn = document.getElementById('btn-header-back');
    if (!btn) return;
    if (current === 'home') {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'inline-flex';
    }
  }

  function renderSettingsButton() {
    var btn = document.getElementById('btn-open-settings');
    if (!btn) return;
    if (current === 'home') {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
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
    hideAllSections();
    sections[key].style.display = 'block';
    current = key;
    if (key === 'home') {
      historyStack = [];
    }
    renderBackButton();
    renderSettingsButton();
    window.scrollTo(0, 0);
  }

  function showHome() { showSection('home'); }
  function showAdmin() { showSection('admin'); }
  function showTV() {
    showSection('tv');
    if (typeof window.mdRenderTvView === 'function') {
      try { window.mdRenderTvView(); } catch (e) { /* noop */ }
    }
  }
  function showTournaments() { showSection('tournaments'); }
  function showClassic() { showSection('classic'); }
  function showLigue() { showSection('ligue'); }
  function showLigueConfig() { showSection('ligueConfig'); }
  function showLigueActive() { showSection('ligueActive'); }
  function showLigueManage() { showSection('ligueManage'); }
  function showLiguePlayer() { showSection('liguePlayer'); }
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

  bind('btn-header-back', goBack);

  bind('btn-home-tournaments', showTournaments);
  bind('btn-home-md', showAdmin);
  bind('btn-home-ligue', showLigue);
  bind('btn-open-settings', showSettings);
  bind('btn-settings-home', showHome);

  bind('btn-ligue-player-view', showLiguePlayer);

  bind('btn-back-home-from-md', showHome);
  bind('btn-go-tv', showTV);
  bind('btn-back-admin', showAdmin);

  bind('btn-back-home-from-tournaments', showHome);

  bind('btn-back-home-from-classic', showHome);
  bind('btn-back-formats-from-classic', showTournaments);

  bind('btn-back-home-from-ligue', showHome);
  bind('btn-ligue-config', showLigueConfig);
  bind('btn-ligue-active', showLigueActive);
  bind('btn-ligue-config-back', showLigue);
  bind('btn-ligue-active-back', showLigue);
  bind('btn-ligue-manage-back', showLigueActive);
  bind('btn-ligue-player-back', showLigue);

  renderBackButton();
  renderSettingsButton();

  window.hideAllSections = hideAllSections;
  window.showHome = showHome;
  window.showAdmin = showAdmin;
  window.showTV = showTV;
  window.showTournaments = showTournaments;
  window.showClassic = showClassic;
  window.showLigue = showLigue;
  window.showLigueConfig = showLigueConfig;
  window.showLigueActive = showLigueActive;
  window.showLigueManage = showLigueManage;
  window.showLiguePlayer = showLiguePlayer;
  window.showSettings = showSettings;
  window.navigateToSection = showSection;
  window.goBack = goBack;

  // -------------------------------------------------------------
  //      PARAMÉTRAGE DU MINI-JEU PADEL PONG (SPONSOR / IA)
  // -------------------------------------------------------------
  var sponsorInput = document.getElementById('pp-sponsor-name');
  var logoInput = document.getElementById('pp-sponsor-logo');
  var aiInput = document.getElementById('pp-ai-name');
  var saveBtn = document.getElementById('pp-save-settings');

  // Si les éléments existent sur la page (mode paramètres)
  if (sponsorInput && logoInput && aiInput && saveBtn) {
    // 1) Pré-remplir les champs avec la config existante
    try {
      var stored = localStorage.getItem('padelPongConfig');
      if (stored) {
        var cfg = JSON.parse(stored);
        if (cfg.sponsorName) sponsorInput.value = cfg.sponsorName;
        if (cfg.sponsorLogoUrl) logoInput.value = cfg.sponsorLogoUrl;
        if (cfg.aiName) aiInput.value = cfg.aiName;
      }
    } catch (e) {
      console.warn('Impossible de lire la config Padel Pong', e);
    }

    // 2) Sauvegarder la config quand on clique sur le bouton
    saveBtn.addEventListener('click', function () {
      var config = {
        sponsorName: sponsorInput.value.trim() || 'Padel Parc',
        sponsorLogoUrl: logoInput.value.trim() || 'padel-parc-logo.png',
        aiName: aiInput.value.trim() || 'IA Padel Parc'
      };

      localStorage.setItem('padelPongConfig', JSON.stringify(config));
      alert('Paramètres du mini-jeu enregistrés !');
    });
  }
})();
