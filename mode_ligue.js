(function(){
  'use strict';

  var btnHomeLigue = document.getElementById('btn-home-ligue');
  var btnBackHomeFromLigue = document.getElementById('btn-back-home-from-ligue');
  var btnLigueN1 = document.getElementById('btn-ligue-n1');
  var btnLigueN2 = document.getElementById('btn-ligue-n2');
  var btnLigueN3 = document.getElementById('btn-ligue-n3');

  function hideLigueSections() {
    ['ligue-root', 'ligue-n1-root', 'ligue-n2-root', 'ligue-n3-root'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  function showLigueHome() {
    if (typeof window.hideAllSections === 'function') window.hideAllSections();
    hideLigueSections();
    var el = document.getElementById('ligue-root');
    if (el) el.style.display = 'block';
    window.scrollTo(0, 0);
  }

  function showLigueN1() {
    if (typeof window.hideAllSections === 'function') window.hideAllSections();
    hideLigueSections();
    var el = document.getElementById('ligue-n1-root');
    if (el) el.style.display = 'block';
    window.scrollTo(0, 0);
  }

  function showLigueN2() {
    if (typeof window.hideAllSections === 'function') window.hideAllSections();
    hideLigueSections();
    var el = document.getElementById('ligue-n2-root');
    if (el) el.style.display = 'block';
    window.scrollTo(0, 0);
  }

  function showLigueN3() {
    if (typeof window.hideAllSections === 'function') window.hideAllSections();
    hideLigueSections();
    var el = document.getElementById('ligue-n3-root');
    if (el) el.style.display = 'block';
    window.scrollTo(0, 0);
  }

  function goHome() {
    if (typeof window.showHome === 'function') window.showHome();
    else {
      if (typeof window.hideAllSections === 'function') window.hideAllSections();
      var home = document.getElementById('home-root');
      if (home) home.style.display = 'block';
    }
  }

  if (btnHomeLigue) btnHomeLigue.addEventListener('click', showLigueHome);
  if (btnBackHomeFromLigue) btnBackHomeFromLigue.addEventListener('click', goHome);
  if (btnLigueN1) btnLigueN1.addEventListener('click', showLigueN1);
  if (btnLigueN2) btnLigueN2.addEventListener('click', showLigueN2);
  if (btnLigueN3) btnLigueN3.addEventListener('click', showLigueN3);

  window.hideLigueSections = hideLigueSections;
  window.showLigueHome = showLigueHome;
  window.showLigueN1 = showLigueN1;
  window.showLigueN2 = showLigueN2;
  window.showLigueN3 = showLigueN3;
})();
