(function(){
  'use strict';

  var btnHomeLigue = document.getElementById('btn-home-league');
  var btnBackHomeFromLigue = document.getElementById('btn-back-home-from-league');
  var btnBackFormatsFromLigue = document.getElementById('btn-back-formats-from-league');

  function openLigue() {
    if (typeof window.hideAllSections === 'function') window.hideAllSections();
    var ligueSection = document.getElementById('league-root');
    if (ligueSection) ligueSection.style.display = 'block';
    window.scrollTo(0,0);
  }

  function backHome() {
    if (typeof window.showHome === 'function') window.showHome();
    else openSection('home-root');
  }

  function backFormats() {
    if (typeof window.showTournaments === 'function') window.showTournaments();
    else openSection('tournaments-root');
  }

  function openSection(id) {
    if (typeof window.hideAllSections === 'function') window.hideAllSections();
    var el = document.getElementById(id);
    if (el) el.style.display = 'block';
    window.scrollTo(0,0);
  }

  if (btnHomeLigue) btnHomeLigue.addEventListener('click', openLigue);
  if (btnBackHomeFromLigue) btnBackHomeFromLigue.addEventListener('click', backHome);
  if (btnBackFormatsFromLigue) btnBackFormatsFromLigue.addEventListener('click', backFormats);
})();
