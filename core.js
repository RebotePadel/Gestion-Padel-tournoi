(function() {
  'use strict';

  var sections = {
    home: document.getElementById('home-root'),
    admin: document.getElementById('admin-root'),
    tv: document.getElementById('tv-root'),
    tournaments: document.getElementById('tournaments-root'),
    classic: document.getElementById('classic-root'),
    ligue: document.getElementById('ligue-root'),
    ligueN1: document.getElementById('ligue-n1-root'),
    ligueN2: document.getElementById('ligue-n2-root'),
    ligueN3: document.getElementById('ligue-n3-root')
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
  function showLigueN1() { showSection('ligueN1'); }
  function showLigueN2() { showSection('ligueN2'); }
  function showLigueN3() { showSection('ligueN3'); }

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

  bind('btn-back-home-from-md', showHome);
  bind('btn-go-tv', showTV);
  bind('btn-back-admin', showAdmin);

  bind('btn-back-home-from-tournaments', showHome);

  bind('btn-back-home-from-classic', showHome);
  bind('btn-back-formats-from-classic', showTournaments);

  bind('btn-back-home-from-ligue', showHome);

  renderBackButton();

  window.hideAllSections = hideAllSections;
  window.showHome = showHome;
  window.showAdmin = showAdmin;
  window.showTV = showTV;
  window.showTournaments = showTournaments;
  window.showClassic = showClassic;
  window.showLigue = showLigue;
  window.showLigueN1 = showLigueN1;
  window.showLigueN2 = showLigueN2;
  window.showLigueN3 = showLigueN3;
  window.goBack = goBack;
})();
