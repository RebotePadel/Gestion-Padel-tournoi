(function(){
  'use strict';

  var leagueRoot = document.getElementById('league-root');
  var btnHome = document.getElementById('btn-back-home-from-league');
  var btnFormats = document.getElementById('btn-back-formats-from-league');

  if (btnHome) {
    btnHome.addEventListener('click', function(){
      if (window.showScreen) window.showScreen('home');
      window.scrollTo(0,0);
    });
  }

  if (btnFormats) {
    btnFormats.addEventListener('click', function(){
      if (window.showScreen) window.showScreen('tournaments');
      window.scrollTo(0,0);
    });
  }

  // Placeholder hook in case future logic needs to run when league is shown
  if (leagueRoot) {
    leagueRoot.dataset.ready = 'true';
  }
})();
