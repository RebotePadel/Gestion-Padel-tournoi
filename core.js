(function() {
  const sections = {
    home: document.getElementById('home-root'),
    mdAdmin: document.getElementById('admin-root'),
    mdTv: document.getElementById('tv-root'),
    tournaments: document.getElementById('tournaments-root'),
    classic: document.getElementById('classic-root'),
    ligue: document.getElementById('ligue-root')
  };

  function hideAll() {
    Object.values(sections).forEach(sec => { if (sec) sec.style.display = 'none'; });
  }

  window.showSection = function(key) {
    hideAll();
    const target = sections[key];
    if (target) target.style.display = 'block';
    window.scrollTo(0, 0);
  };

  const btnHomeTournaments = document.getElementById('btn-home-tournaments');
  const btnHomeMd = document.getElementById('btn-home-md');
  const btnHomeLigue = document.getElementById('btn-home-ligue');
  const btnBackHomeFromMd = document.getElementById('btn-back-home-from-md');
  const btnBackHomeFromTv = document.getElementById('btn-back-home-from-tv');
  const btnBackHomeFromT = document.getElementById('btn-back-home-from-tournaments');
  const btnBackHomeFromLigue = document.getElementById('btn-back-home-from-ligue');
  const btnBackAdmin = document.getElementById('btn-back-admin');
  const btnGoTv = document.getElementById('btn-go-tv');
  const btnOpenClassic = document.getElementById('btn-open-classic');
  const btnBackFormats = document.getElementById('btn-back-formats');
  const btnClassicHome = document.getElementById('btn-classic-home');

  if (btnHomeTournaments) btnHomeTournaments.addEventListener('click', () => showSection('tournaments'));
  if (btnHomeMd) btnHomeMd.addEventListener('click', () => showSection('mdAdmin'));
  if (btnHomeLigue) btnHomeLigue.addEventListener('click', () => showSection('ligue'));
  if (btnBackHomeFromMd) btnBackHomeFromMd.addEventListener('click', () => showSection('home'));
  if (btnBackHomeFromTv) btnBackHomeFromTv.addEventListener('click', () => showSection('home'));
  if (btnBackHomeFromT) btnBackHomeFromT.addEventListener('click', () => showSection('home'));
  if (btnBackHomeFromLigue) btnBackHomeFromLigue.addEventListener('click', () => showSection('home'));
  if (btnBackAdmin) btnBackAdmin.addEventListener('click', () => showSection('mdAdmin'));
  if (btnGoTv) btnGoTv.addEventListener('click', () => showSection('mdTv'));

  function loadClassic() {
    const iframe = document.getElementById('classic-iframe');
    if (iframe && !iframe.src) {
      iframe.src = 'Tournoi classique V3.html';
    }
  }

  if (btnOpenClassic) btnOpenClassic.addEventListener('click', () => {
    loadClassic();
    showSection('classic');
  });

  if (btnBackFormats) btnBackFormats.addEventListener('click', () => showSection('tournaments'));
  if (btnClassicHome) btnClassicHome.addEventListener('click', () => showSection('home'));
})();
