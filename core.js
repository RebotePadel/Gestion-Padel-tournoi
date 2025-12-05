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

  function hideAllSections() {
    Object.keys(sections).forEach(function(key) {
      var el = sections[key];
      if (el) el.style.display = 'none';
    });
  }

  function showSection(key) {
    hideAllSections();
    var el = sections[key];
    if (el) el.style.display = 'block';
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

  function bind(id, handler) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  }

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

  window.hideAllSections = hideAllSections;
  window.showHome = showHome;
  window.showAdmin = showAdmin;
  window.showTV = showTV;
  window.showTournaments = showTournaments;
  window.showClassic = showClassic;
  window.showLigue = showLigue;
})();
