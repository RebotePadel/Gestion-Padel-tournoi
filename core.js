(function () {
  'use strict';

  var sections = {
    home: document.getElementById('home-root'),
    mdAdmin: document.getElementById('admin-root'),
    mdTv: document.getElementById('tv-root'),
    tournaments: document.getElementById('tournaments-root'),
    classic: document.getElementById('classic-root'),
    league: document.getElementById('league-root')
  };

  function setDisplay(el, visible) {
    if (!el) return;
    el.style.display = visible ? 'block' : 'none';
  }

  function showScreen(screen) {
    setDisplay(sections.home, screen === 'home');
    setDisplay(sections.mdAdmin, screen === 'md-admin');
    setDisplay(sections.mdTv, screen === 'md-tv');
    setDisplay(sections.tournaments, screen === 'tournaments');
    setDisplay(sections.classic, screen === 'classic');
    setDisplay(sections.league, screen === 'league');
  }

  window.showScreen = showScreen;

  function scrollTop() {
    window.scrollTo(0, 0);
  }

  var btnHomeTournaments = document.getElementById('btn-home-tournaments');
  if (btnHomeTournaments) {
    btnHomeTournaments.addEventListener('click', function () {
      showScreen('tournaments');
      scrollTop();
    });
  }

  var btnHomeMd = document.getElementById('btn-home-md');
  if (btnHomeMd) {
    btnHomeMd.addEventListener('click', function () {
      showScreen('md-admin');
      scrollTop();
    });
  }

  var btnHomeLeague = document.getElementById('btn-home-league');
  if (btnHomeLeague) {
    btnHomeLeague.addEventListener('click', function () {
      showScreen('league');
      scrollTop();
    });
  }

  var btnBackHomeFromMd = document.getElementById('btn-back-home-from-md');
  if (btnBackHomeFromMd) {
    btnBackHomeFromMd.addEventListener('click', function () {
      showScreen('home');
      scrollTop();
    });
  }

  var btnBackHomeFromTournaments = document.getElementById('btn-back-home-from-tournaments');
  if (btnBackHomeFromTournaments) {
    btnBackHomeFromTournaments.addEventListener('click', function () {
      showScreen('home');
      scrollTop();
    });
  }

  var btnBackHomeFromLeague = document.getElementById('btn-back-home-from-league');
  if (btnBackHomeFromLeague) {
    btnBackHomeFromLeague.addEventListener('click', function () {
      showScreen('home');
      scrollTop();
    });
  }

  var btnBackFormatsFromLeague = document.getElementById('btn-back-formats-from-league');
  if (btnBackFormatsFromLeague) {
    btnBackFormatsFromLeague.addEventListener('click', function () {
      showScreen('tournaments');
      scrollTop();
    });
  }

  var btnOpenClassic = document.getElementById('btn-open-classic');
  if (btnOpenClassic) {
    btnOpenClassic.addEventListener('click', function () {
      showScreen('classic');
      scrollTop();
    });
  }

  var btnBackHomeFromClassic = document.getElementById('btn-back-home-from-classic');
  if (btnBackHomeFromClassic) {
    btnBackHomeFromClassic.addEventListener('click', function () {
      showScreen('home');
      scrollTop();
    });
  }

  var btnBackFormatsFromClassic = document.getElementById('btn-back-formats-from-classic');
  if (btnBackFormatsFromClassic) {
    btnBackFormatsFromClassic.addEventListener('click', function () {
      showScreen('tournaments');
      scrollTop();
    });
  }
})();
