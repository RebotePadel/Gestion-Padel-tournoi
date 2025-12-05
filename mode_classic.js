(function(){
  'use strict';

  var btnOpenClassic = document.getElementById('btn-open-classic');
  var btnBackFormats = document.getElementById('btn-back-formats-from-classic');
  var btnClassicHome = document.getElementById('btn-back-home-from-classic');
  var iframe = document.getElementById('classic-iframe');

  function openClassic() {
    if (typeof window.hideAllSections === 'function') window.hideAllSections();
    var classicRoot = document.getElementById('classic-root');
    if (classicRoot) classicRoot.style.display = 'block';
    if (iframe && !iframe.src) {
      iframe.src = 'Tournoi-V4.html';
    }
    window.scrollTo(0,0);
  }

  function backToFormats() {
    if (typeof window.showTournaments === 'function') window.showTournaments();
    else if (typeof window.hideAllSections === 'function') {
      window.hideAllSections();
      var formats = document.getElementById('tournaments-root');
      if (formats) formats.style.display = 'block';
    }
  }

  function backHome() {
    if (typeof window.showHome === 'function') window.showHome();
    else if (typeof window.hideAllSections === 'function') {
      window.hideAllSections();
      var home = document.getElementById('home-root');
      if (home) home.style.display = 'block';
    }
  }

  if (btnOpenClassic) btnOpenClassic.addEventListener('click', openClassic);
  if (btnBackFormats) btnBackFormats.addEventListener('click', backToFormats);
  if (btnClassicHome) btnClassicHome.addEventListener('click', backHome);
})();
