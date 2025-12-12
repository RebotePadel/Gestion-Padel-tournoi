(function() {
  'use strict';

  // Ligue interne : navigation, création, planification, scores, et vues thématiques par niveau.

  var STORAGE_KEY = 'padel_ligues_v1';
  var LEVEL_CLASS = {
    'ligue 1': 'ligue-theme-n1',
    'ligue 2': 'ligue-theme-n2',
    'ligue 3': 'ligue-theme-n3',
    'niveau 1': 'ligue-theme-n1',
    'niveau 2': 'ligue-theme-n2',
    'niveau 3': 'ligue-theme-n3'
  };

  var hadStoredState = false;
  var refs = {
    homeBtn: document.getElementById('btn-home-ligue'),
    backHomeBtn: document.getElementById('btn-back-home-from-ligue'),
    configBtn: document.getElementById('btn-ligue-config'),
    activeBtn: document.getElementById('btn-ligue-active'),
    playerBtn: document.getElementById('btn-ligue-player-view'),
    configBackBtn: document.getElementById('btn-ligue-config-back'),
    activeBackBtn: document.getElementById('btn-ligue-active-back'),
    playerBackBtn: document.getElementById('btn-ligue-player-back'),
    configGenerateBtn: document.getElementById('btn-ligue-config-generate'),
    configAutoTeamsBtn: document.getElementById('btn-ligue-generate-teams'),
    closeBtn: document.getElementById('btn-ligue-close'),
    manageCloseBtn: document.getElementById('btn-ligue-manage-close'),
    manageBackBtn: document.getElementById('btn-ligue-manage-back'),
    configShell: document.getElementById('ligue-config-shell'),
    activeShell: document.getElementById('ligue-active-shell'),
    manageShell: document.getElementById('ligue-manage-shell'),
    playerShell: document.getElementById('ligue-player-shell'),
    configRoot: document.getElementById('ligue-config-root'),
    activeRoot: document.getElementById('ligue-active-root'),
    manageRoot: document.getElementById('ligue-manage-root'),
    playerRoot: document.getElementById('ligue-player-root'),
    root: document.getElementById('ligue-root'),
    historyList: document.getElementById('ligue-history-list'),
    configName: document.getElementById('ligue-config-name'),
    configLevel: document.getElementById('ligue-config-level'),
    configNbTeams: document.getElementById('ligue-config-nbteams'),
    configFormat: document.getElementById('ligue-config-format'),
    configStart: document.getElementById('ligue-config-start'),
    configTeams: document.getElementById('ligue-config-teams'),
    activeList: document.getElementById('ligue-active-list'),
    detailTitle: document.getElementById('ligue-detail-title'),
    detailMeta: document.getElementById('ligue-detail-meta'),
    detailTeams: document.getElementById('ligue-detail-teams'),
    detailMatches: document.getElementById('ligue-detail-matches'),
    detailStandings: document.getElementById('ligue-detail-standings'),
    detailLevel: document.getElementById('ligue-detail-level'),
    detailManageLink: document.getElementById('ligue-detail-manage-link'),
    manageTitle: document.getElementById('ligue-manage-title'),
    manageMeta: document.getElementById('ligue-manage-meta'),
    manageLevel: document.getElementById('ligue-manage-level'),
    manageCalendar: document.getElementById('ligue-manage-calendar'),
    manageStandings: document.getElementById('ligue-manage-standings'),
    manageResults: document.getElementById('ligue-manage-results'),
    manageTeams: document.getElementById('ligue-manage-teams'),
    reglementStart: document.getElementById('ligue-reglement-start'),
    reglementEnd: document.getElementById('ligue-reglement-end'),
    manageTabs: document.getElementById('ligue-manage-tabs'),
    manageCalendarNote: document.getElementById('ligue-calendar-note'),
    dayExportSelect: document.getElementById('ligue-day-export-select'),
    dayExportBtn: document.getElementById('btn-ligue-day-export'),
    exportMatchesBtn: document.getElementById('btn-ligue-export-matches'),
    managePanels: {
      calendar: document.getElementById('panel-ligue-calendar'),
      standings: document.getElementById('panel-ligue-standings'),
      results: document.getElementById('panel-ligue-results'),
      teams: document.getElementById('panel-ligue-teams'),
      rules: document.getElementById('panel-ligue-rules')
    },
    manageTabButtons: {
      calendar: document.getElementById('tab-ligue-calendar'),
      standings: document.getElementById('tab-ligue-standings'),
      results: document.getElementById('tab-ligue-results'),
      teams: document.getElementById('tab-ligue-teams'),
      rules: document.getElementById('tab-ligue-rules')
    },
    playerList: document.getElementById('ligue-player-list'),
    playerManageRoot: document.getElementById('ligue-player-manage-root'),
    playerManageShell: document.getElementById('ligue-player-manage-shell'),
    playerManageTitle: document.getElementById('ligue-player-manage-title'),
    playerManageMeta: document.getElementById('ligue-player-manage-meta'),
    playerManageLevel: document.getElementById('ligue-player-manage-level'),
    playerManageBackBtn: document.getElementById('btn-ligue-player-manage-back'),
    playerManageTabs: document.getElementById('ligue-player-manage-tabs'),
    playerManagePanels: {
      calendar: document.getElementById('panel-player-calendar'),
      standings: document.getElementById('panel-player-standings'),
      results: document.getElementById('panel-player-results'),
      teams: document.getElementById('panel-player-teams'),
      rules: document.getElementById('panel-player-rules')
    },
    playerManageTabButtons: {
      calendar: document.getElementById('tab-player-calendar'),
      standings: document.getElementById('tab-player-standings'),
      results: document.getElementById('tab-player-results'),
      teams: document.getElementById('tab-player-teams'),
      rules: document.getElementById('tab-player-rules')
    },
    playerManageCalendar: document.getElementById('ligue-player-manage-calendar'),
    playerManageStandings: document.getElementById('ligue-player-manage-standings'),
    playerManageResults: document.getElementById('ligue-player-manage-results'),
    playerManageTeams: document.getElementById('ligue-player-manage-teams'),
    playerReglementStart: document.getElementById('ligue-player-reglement-start'),
    playerReglementEnd: document.getElementById('ligue-player-reglement-end')
  };
  var playerViewButtons = Array.prototype.slice.call(document.querySelectorAll('.btn-ligue-player-view'));

  if (refs.playerBtn) refs.playerBtn.textContent = '📱 Vue joueur';
  playerViewButtons.forEach(function(btn) { btn.textContent = '📱 Vue joueur'; });

  var ligueState = loadState();
  // Persist normalized state immediately only if we reloaded existing data
  if (hadStoredState && ligueState) saveState();
  var currentActiveId = null;
  var currentManageTab = 'calendar';
  var currentPlayerId = null;
  var currentPlayerTab = 'calendar';

  function loadState() {
    var empty = { activeLeagues: [], finishedLeagues: [] };
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      hadStoredState = !!raw;
      if (!raw) return empty;
      var parsed = JSON.parse(raw);
      if (!parsed.activeLeagues) parsed.activeLeagues = [];
      if (!parsed.finishedLeagues) parsed.finishedLeagues = [];
      migrateLevels(parsed);
      normalizeMatches(parsed);
      return parsed;
    } catch (e) {
      return empty;
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ligueState)); } catch (e) { /* noop */ }
  }

  function normalizeLevel(level) {
    var txt = (level || '').trim();
    var lower = txt.toLowerCase();
    if (lower.indexOf('niveau 1') === 0 || lower.indexOf('ligue 1') === 0) return 'Ligue 1';
    if (lower.indexOf('niveau 2') === 0 || lower.indexOf('ligue 2') === 0) return 'Ligue 2';
    if (lower.indexOf('niveau 3') === 0 || lower.indexOf('ligue 3') === 0) return 'Ligue 3';
    return 'Ligue 1';
  }

  function migrateLevels(state) {
    var normalizeLeague = function(lg) { if (lg && lg.level) lg.level = normalizeLevel(lg.level); };
    if (state.activeLeagues) state.activeLeagues.forEach(normalizeLeague);
    if (state.finishedLeagues) state.finishedLeagues.forEach(normalizeLeague);
  }

  function normalizeMatches(state) {
    var hydrateLeague = function(lg) {
      ensureReglementConfig(lg);
      if (!lg.matches) lg.matches = [];
      lg.matches.forEach(function(m) {
        ensureMatchSets(m);
        if (typeof m.validated === 'undefined') m.validated = !!m.played;
        computeMatchOutcome(m);
      });
      if (!lg.standings) lg.standings = buildStandings(lg.teams || []);
      recomputeStandings(lg);
    };
    if (state.activeLeagues) state.activeLeagues.forEach(hydrateLeague);
    if (state.finishedLeagues) state.finishedLeagues.forEach(function(lg) {
      ensureReglementConfig(lg);
      if (!lg.matches) lg.matches = [];
      lg.matches.forEach(function(m) {
        ensureMatchSets(m);
        if (typeof m.validated === 'undefined') m.validated = !!m.played;
        computeMatchOutcome(m);
      });
      if (!lg.standings) lg.standings = buildStandings(lg.teams || []);
    });
  }

  function ensureReglementConfig(lg) {
    if (!lg) return;
    if (!lg.config) lg.config = {};
    if (!lg.config.reglementStartDate) lg.config.reglementStartDate = lg.config.startDate || '';
    if (!lg.config.reglementEndDate) lg.config.reglementEndDate = '';
  }

  function applyTheme(container, level) {
    if (!container) return;
    ['ligue-theme-n1', 'ligue-theme-n2', 'ligue-theme-n3'].forEach(function(cls) { container.classList.remove(cls); });
    var normalized = normalizeLevel(level);
    var cls = LEVEL_CLASS[normalized.toLowerCase()];
    if (cls) container.classList.add(cls);
  }

  function slugifyName(txt) {
    return (txt || 'ligue').toString().toLowerCase().replace(/[^a-z0-9]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }

  function hideLigueSections() {
    ['ligue-root', 'ligue-config-root', 'ligue-active-root', 'ligue-manage-root', 'ligue-player-root', 'ligue-player-manage-root'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  function scrollTop() {
    try { window.scrollTo(0, 0); } catch (e) { /* noop */ }
  }

  function showLigueRoot() {
    if (typeof window.navigateToSection === 'function') {
      window.navigateToSection('ligue');
    } else {
      if (typeof window.hideAllSections === 'function') window.hideAllSections();
      hideLigueSections();
      if (refs.root) refs.root.style.display = 'block';
    }
    applyTheme(refs.configShell, null);
    applyTheme(refs.activeShell, null);
    applyTheme(refs.manageShell, null);
    renderHistory();
    scrollTop();
  }

  function showLigueConfig() {
    if (typeof window.navigateToSection === 'function') {
      window.navigateToSection('ligueConfig');
    } else {
      if (typeof window.hideAllSections === 'function') window.hideAllSections();
      hideLigueSections();
      if (refs.configRoot) refs.configRoot.style.display = 'block';
    }
    var level = refs.configLevel ? refs.configLevel.value : null;
    applyTheme(refs.configShell, level);
    scrollTop();
  }

  function showLigueActive(targetId) {
    if (typeof window.navigateToSection === 'function') {
      window.navigateToSection('ligueActive');
    } else {
      if (typeof window.hideAllSections === 'function') window.hideAllSections();
      hideLigueSections();
      if (refs.activeRoot) refs.activeRoot.style.display = 'block';
    }
    if (targetId) currentActiveId = targetId;
    var league = getActiveLeague(currentActiveId);
    renderActiveList();
    if (league) applyTheme(refs.activeShell, league.level); else applyTheme(refs.activeShell, null);
    renderActiveDetail(league);
    scrollTop();
  }

  function showLigueManage(targetId) {
    if (typeof window.navigateToSection === 'function') {
      window.navigateToSection('ligueManage');
    } else {
      if (typeof window.hideAllSections === 'function') window.hideAllSections();
      hideLigueSections();
      if (refs.manageRoot) refs.manageRoot.style.display = 'block';
    }
    if (targetId) currentActiveId = targetId;
    var league = getActiveLeague(currentActiveId);
    if (!league) {
      showLigueActive();
      return;
    }
    applyTheme(refs.manageShell, league.level);
    renderManageView(league);
    setActiveManageTab(currentManageTab || 'calendar');
    scrollTop();
  }

  function showLiguePlayerView(targetId) {
    if (typeof window.navigateToSection === 'function') {
      window.navigateToSection('liguePlayer');
    } else {
      if (typeof window.hideAllSections === 'function') window.hideAllSections();
      hideLigueSections();
      if (refs.playerRoot) refs.playerRoot.style.display = 'block';
    }
    if (targetId) currentPlayerId = targetId;
    renderPlayerList();
    scrollTop();
  }

  function showLiguePlayerManage(targetId) {
    if (typeof window.navigateToSection === 'function') {
      window.navigateToSection('liguePlayerManage');
    } else {
      if (typeof window.hideAllSections === 'function') window.hideAllSections();
      hideLigueSections();
      if (refs.playerManageRoot) refs.playerManageRoot.style.display = 'block';
    }
    if (targetId) currentPlayerId = targetId;
    var league = getActiveLeague(currentPlayerId);
    if (!league) {
      showLiguePlayerView();
      return;
    }
    applyTheme(refs.playerManageShell, league.level);
    renderPlayerManageView(league);
    setActivePlayerTab(currentPlayerTab || 'calendar');
    scrollTop();
  }

  function bind(btn, handler) { if (btn) btn.addEventListener('click', handler); }

  bind(refs.homeBtn, showLigueRoot);
  bind(refs.backHomeBtn, function() { if (typeof window.showHome === 'function') window.showHome(); else showLigueRoot(); });
  bind(refs.configBtn, showLigueConfig);
  bind(refs.activeBtn, showLigueActive);
  bind(refs.playerBtn, showLiguePlayerView);
  playerViewButtons.forEach(function(btn) { bind(btn, showLiguePlayerView); });
  bind(refs.configBackBtn, showLigueRoot);
  bind(refs.activeBackBtn, showLigueRoot);
  bind(refs.playerBackBtn, showLigueRoot);
  bind(refs.playerManageBackBtn, showLiguePlayerView);
  bind(refs.configGenerateBtn, handleGenerate);
  bind(refs.configAutoTeamsBtn, handleAutoTeams);
  bind(refs.closeBtn, handleCloseLeague);
  bind(refs.manageCloseBtn, handleCloseLeague);
  bind(refs.manageBackBtn, showLigueActive);
  bind(refs.exportMatchesBtn, handleExportMatches);
  bind(refs.dayExportBtn, handleDayExport);

  if (refs.configLevel) refs.configLevel.addEventListener('change', function() { applyTheme(refs.configShell, refs.configLevel.value); });
  if (refs.configNbTeams) refs.configNbTeams.addEventListener('change', function() {
    var val = parseInt(refs.configNbTeams.value, 10);
    if (isNaN(val)) val = 8;
    val = Math.max(4, Math.min(20, val));
    refs.configNbTeams.value = val;
    renderTeamInputs(val);
  });

  if (refs.reglementStart) refs.reglementStart.addEventListener('change', function(evt) { updateReglementDates(evt.target.value, refs.reglementEnd && refs.reglementEnd.value); });
  if (refs.reglementEnd) refs.reglementEnd.addEventListener('change', function(evt) { updateReglementDates(refs.reglementStart && refs.reglementStart.value, evt.target.value); });

  if (refs.manageTabs) {
    refs.manageTabs.addEventListener('click', function(evt) {
      var tab = evt.target && evt.target.dataset ? evt.target.dataset.tab : null;
      if (tab) setActiveManageTab(tab);
    });
  }

  if (refs.playerManageTabs) {
    refs.playerManageTabs.addEventListener('click', function(evt) {
      var tab = evt.target && evt.target.dataset ? evt.target.dataset.tab : null;
      if (tab) setActivePlayerTab(tab);
    });
  }

  renderTeamInputs(parseInt(refs.configNbTeams && refs.configNbTeams.value, 10) || 8);
  renderHistory();
  renderActiveList();
  renderPlayerList();
  window.addEventListener('beforeunload', saveState);

  function renderTeamInputs(count) {
    if (!refs.configTeams) return;
    refs.configTeams.innerHTML = '';
    for (var i = 1; i <= count; i++) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.border = '1px solid #111827';
      var title = document.createElement('h4');
      title.className = 'tournaments-title';
      title.textContent = 'Équipe ' + i;
      var nameField = document.createElement('div');
      nameField.className = 'ligue-field';
      var nameLabel = document.createElement('label');
      nameLabel.setAttribute('for', 'ligue-team-name-' + i);
      nameLabel.textContent = 'Nom de l\'équipe';
      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.id = 'ligue-team-name-' + i;
      nameInput.placeholder = 'Team ' + i;
      var playersField = document.createElement('div');
      playersField.className = 'ligue-field';
      var playersLabel = document.createElement('label');
      playersLabel.setAttribute('for', 'ligue-team-players-' + i);
      playersLabel.textContent = 'Joueurs (2 à 6)';
      var playersArea = document.createElement('textarea');
      playersArea.id = 'ligue-team-players-' + i;
      playersArea.placeholder = 'Un joueur par ligne';
      nameField.appendChild(nameLabel);
      nameField.appendChild(nameInput);
      playersField.appendChild(playersLabel);
      playersField.appendChild(playersArea);
      card.appendChild(title);
      card.appendChild(nameField);
      card.appendChild(playersField);
      refs.configTeams.appendChild(card);
    }
  }

  function collectTeams() {
    var teams = [];
    var count = parseInt(refs.configNbTeams && refs.configNbTeams.value, 10) || 0;
    for (var i = 1; i <= count; i++) {
      var nameInput = document.getElementById('ligue-team-name-' + i);
      var playerArea = document.getElementById('ligue-team-players-' + i);
      var name = nameInput ? nameInput.value.trim() : '';
      var players = [];
      if (playerArea) {
        playerArea.value.split(/\n|,/).forEach(function(p) {
          var s = p.trim();
          if (s) players.push(s);
        });
      }
      if (name) { teams.push({ id: 'T' + i, name: name, players: players }); }
    }
    return teams;
  }

  // Remplissage rapide des équipes avec des noms et joueurs aléatoires.
  function handleAutoTeams() {
    var count = parseInt(refs.configNbTeams && refs.configNbTeams.value, 10) || 0;
    if (count < 4 || count > 20) { alert('Merci de choisir entre 4 et 20 équipes.'); return; }
    renderTeamInputs(count);
    var teamPool = [
      'Smash & Co','Padel Kings','Rebote Squad','Ace Hunters','Blue Court','Los Lobos',
      'Night Session','Padel Crew','Volley Time','Padel Legends','Smash Attack','Team Bandeja',
      'Chiquita Gang','Padel Stars','Center Court','Last Minute','Padel Horizon','Spin Masters'
    ];
    var playerPool = ['Léo','Camille','Noé','Élise','Arthur','Sacha','Mila','Nina','Yanis','Émilie','Gaspard','Lina','Hugo','Jade','Lucas','Maé'];
    for (var i = 1; i <= count; i++) {
      var nameInput = document.getElementById('ligue-team-name-' + i);
      var playersArea = document.getElementById('ligue-team-players-' + i);
      if (nameInput) nameInput.value = teamPool[(i - 1) % teamPool.length] + ' #' + i;
      if (playersArea) {
        var roster = [];
        var rosterSize = 2 + Math.floor(Math.random() * 3);
        for (var j = 0; j < rosterSize; j++) {
          var pick = playerPool[(i + j) % playerPool.length];
          roster.push('🎾 ' + pick + ' ' + (10 + ((i + j) % 70)));
        }
        playersArea.value = roster.join('\n');
      }
    }
  }

  function validateConfig() {
    var name = refs.configName ? refs.configName.value.trim() : '';
    var level = refs.configLevel ? refs.configLevel.value : 'Ligue 1';
    var nbTeams = parseInt(refs.configNbTeams && refs.configNbTeams.value, 10) || 0;
    var format = refs.configFormat ? refs.configFormat.value : 'aller';
    var start = refs.configStart ? refs.configStart.value : '';
    var teams = collectTeams();

    if (!name) return { error: 'Nom de ligue requis.' };
    if (nbTeams < 4 || nbTeams > 20) return { error: 'Nombre d\'équipes entre 4 et 20.' };
    if (teams.length !== nbTeams) return { error: 'Merci de renseigner les ' + nbTeams + ' équipes.' };
    for (var i = 0; i < teams.length; i++) {
      if (teams[i].players.length < 2 || teams[i].players.length > 6) {
        return { error: 'Chaque équipe doit avoir entre 2 et 6 joueurs.' };
      }
    }
    if (!start) return { error: 'Date de début requise.' };
    return { name: name, level: level, nbTeams: nbTeams, format: format, start: start, teams: teams };
  }

  function handleGenerate() {
    var cfg = validateConfig();
    if (cfg.error) { alert(cfg.error); return; }
    var leagueId = 'ligue_' + Date.now();
    var level = normalizeLevel(cfg.level);
    var matches = buildSchedule(cfg.teams, cfg.format === 'aller_retour');
    matches = assignDates(matches, cfg.start);
    var league = {
      id: leagueId,
      name: cfg.name,
      level: level,
      config: {
        nbTeams: cfg.nbTeams,
        format: cfg.format,
        startDate: cfg.start,
        reglementStartDate: cfg.start,
        reglementEndDate: ''
      },
      teams: cfg.teams,
      matches: matches,
      standings: buildStandings(cfg.teams),
      createdAt: new Date().toISOString(),
      finishedAt: null
    };
    ligueState.activeLeagues.push(league);
    saveState();
    currentActiveId = leagueId;
    showLigueManage(leagueId);
  }

  function buildStandings(teams) {
    return teams.map(function(t) { return { teamId: t.id, name: t.name, played: 0, wins: 0, losses: 0, points: 0 }; });
  }

  function buildSchedule(teams, doubleRound) {
    var list = teams.slice();
    if (list.length % 2 === 1) list.push({ id: 'BYE', name: 'Repos', players: [] });
    var n = list.length;
    var rounds = n - 1;
    var half = n / 2;
    var schedule = [];
    for (var r = 0; r < rounds; r++) {
      for (var i = 0; i < half; i++) {
        var home = list[i];
        var away = list[n - 1 - i];
        if (home.id === 'BYE' || away.id === 'BYE') continue;
        schedule.push({ id: 'm_' + r + '_' + i + '_1', round: r + 1, home: home.id, away: away.id, date: null, scores: [null, null], sets: [{ home: null, away: null }, { home: null, away: null }, { home: null, away: null }], played: false });
        if (doubleRound) {
          schedule.push({ id: 'm_' + r + '_' + i + '_2', round: r + 1 + rounds, home: away.id, away: home.id, date: null, scores: [null, null], sets: [{ home: null, away: null }, { home: null, away: null }, { home: null, away: null }], played: false });
        }
      }
      var fixed = list[0];
      var rotate = list.slice(1);
      rotate.unshift(rotate.pop());
      list = [fixed].concat(rotate);
    }
    schedule.sort(function(a, b) { return a.round - b.round; });
    return schedule;
  }

  function assignDates(matches, startDate) {
    if (!startDate) return matches;
    var cursor = new Date(startDate + 'T00:00:00');
    matches.forEach(function(m) {
      m.date = cursor.toISOString().slice(0, 10);
      cursor.setDate(cursor.getDate() + 1);
    });
    return matches;
  }

  function renderHistory() {
    if (!refs.historyList) return;
    refs.historyList.innerHTML = '';
    if (!ligueState.finishedLeagues.length) {
      refs.historyList.innerHTML = '<div class="empty">Aucune ligue terminée pour l’instant.</div>';
      return;
    }
    ligueState.finishedLeagues.forEach(function(lg) {
      var card = document.createElement('div');
      card.className = 'card ligue-theme-shell';
      applyTheme(card, lg.level);
      var title = document.createElement('div');
      title.className = 'ligue-inline';
      var name = document.createElement('h4');
      name.className = 'tournaments-title';
      name.textContent = lg.name;
      var level = document.createElement('div');
      level.className = 'ligue-chip';
      level.textContent = lg.level;
      title.appendChild(name);
      title.appendChild(level);
      var meta = document.createElement('div');
      meta.className = 'small-muted';
      meta.textContent = 'Du ' + (lg.config.startDate || '—') + ' • clôturée le ' + (lg.finishedAt ? lg.finishedAt.slice(0, 10) : '—');
      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn btn-small ligue-history-btn';
      toggleBtn.textContent = '📊 Voir classement';
      toggleBtn.addEventListener('click', function() {
        openFinishedLeagueModal(lg);
      });
      var actions = document.createElement('div');
      actions.className = 'ligue-history-actions';
      actions.appendChild(toggleBtn);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(actions);
      refs.historyList.appendChild(card);
    });
  }

  function buildFinishedStandingsTable(league) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ligue-history-standings';
    if (!league || !league.standings || !league.standings.length) {
      wrapper.innerHTML = '<div class="empty">Classement indisponible pour cette ligue.</div>';
      return wrapper;
    }
    var table = document.createElement('table');
    table.className = 'ligue-standings';
    var thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>#</th><th>Équipe</th><th>J</th><th>V</th><th>D</th><th>Pts</th></tr>';
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    league.standings.forEach(function(s, idx) {
      var row = document.createElement('tr');
      row.innerHTML = '<td>' + (idx + 1) + '</td><td>' + (s.name || s.id) + '</td><td>' + (s.played || 0) + '</td><td>' + (s.wins || 0) + '</td><td>' + (s.losses || 0) + '</td><td>' + (s.points || 0) + '</td>';
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
  }

  function openFinishedLeagueModal(league) {
    if (!league || !(window.socialModal && window.socialModal.open)) return;
    var content = buildFinishedStandingsTable(league);
    window.socialModal.open({
      title: 'Classement – ' + (league.name || 'Ligue'),
      content: content,
      downloadLabel: 'Exporter image réseaux',
      onDownload: function() { triggerLeagueSocialExport(league); }
    });
  }

  function toggleFinishedLeagueStandings(league, container, btn) {
    if (!league || !container) return;
    var willShow = container.classList.contains('hidden') || !container.innerHTML;
    if (willShow) {
      container.innerHTML = '';
      if (!league.standings || !league.standings.length) {
        container.innerHTML = '<div class="empty">Classement indisponible pour cette ligue.</div>';
      } else {
        var table = document.createElement('table');
        table.className = 'ligue-standings';
        var thead = document.createElement('thead');
        thead.innerHTML = '<tr><th>#</th><th>Équipe</th><th>J</th><th>V</th><th>D</th><th>Pts</th></tr>';
        table.appendChild(thead);
        var tbody = document.createElement('tbody');
        league.standings.forEach(function(s, idx) {
          var row = document.createElement('tr');
          row.innerHTML = '<td>' + (idx + 1) + '</td><td>' + (s.name || s.id) + '</td><td>' + (s.played || 0) + '</td><td>' + (s.wins || 0) + '</td><td>' + (s.losses || 0) + '</td><td>' + (s.points || 0) + '</td>';
          tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);
      }
      container.classList.remove('hidden');
      if (btn) btn.textContent = 'Masquer le classement';
    } else {
      container.classList.add('hidden');
      container.innerHTML = '';
      if (btn) btn.textContent = 'Voir classement';
    }
  }

  function renderActiveList() {
    if (!refs.activeList) return;
    refs.activeList.innerHTML = '';
    if (!ligueState.activeLeagues.length) {
      refs.activeList.innerHTML = '<div class="empty">Aucune ligue active pour l’instant.</div>';
      return;
    }
    ligueState.activeLeagues.forEach(function(lg) {
      var card = document.createElement('div');
      card.className = 'card ligue-theme-shell';
      applyTheme(card, lg.level);
      var header = document.createElement('div');
      header.className = 'ligue-inline';
      var title = document.createElement('h4');
      title.className = 'tournaments-title';
      title.textContent = lg.name;
      var chip = document.createElement('div');
      chip.className = 'ligue-chip';
      chip.textContent = lg.level;
      header.appendChild(title);
      header.appendChild(chip);
      var meta = document.createElement('div');
      meta.className = 'small-muted';
      meta.textContent = (lg.config.startDate || 'Début ?') + ' • ' + lg.config.nbTeams + ' équipes • ' + (lg.config.format === 'aller_retour' ? 'Aller / Retour' : 'Aller');
      var btn = document.createElement('button');
      btn.className = 'btn btn-small';
      btn.textContent = 'Gérer';
      btn.addEventListener('click', function() {
        currentActiveId = lg.id;
        showLigueManage(lg.id);
      });
      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(btn);
    refs.activeList.appendChild(card);
    });
  }

  function renderPlayerList() {
    if (!refs.playerList) return;
    refs.playerList.innerHTML = '';
    if (!ligueState.activeLeagues.length) {
      refs.playerList.innerHTML = '<div class="empty">Aucune ligue active à afficher.</div>';
      return;
    }
    ligueState.activeLeagues.forEach(function(lg) {
      var card = document.createElement('div');
      card.className = 'card ligue-theme-shell';
      applyTheme(card, lg.level);
      var header = document.createElement('div');
      header.className = 'ligue-inline';
      var title = document.createElement('h4');
      title.className = 'tournaments-title';
      title.textContent = lg.name;
      var chip = document.createElement('div');
      chip.className = 'ligue-chip';
      chip.textContent = lg.level;
      header.appendChild(title);
      header.appendChild(chip);
      var meta = document.createElement('div');
      meta.className = 'small-muted';
      meta.textContent = (lg.config.startDate || 'Début ?') + ' • ' + lg.config.nbTeams + ' équipes';
      var btn = document.createElement('button');
      btn.className = 'btn btn-small';
      btn.textContent = 'Voir';
      btn.addEventListener('click', function() {
        currentPlayerId = lg.id;
        showLiguePlayerManage(lg.id);
      });
      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(btn);
      refs.playerList.appendChild(card);
    });
  }

  function getActiveLeague(id) {
    if (!id) return null;
    for (var i = 0; i < ligueState.activeLeagues.length; i++) {
      if (ligueState.activeLeagues[i].id === id) return ligueState.activeLeagues[i];
    }
    return null;
  }

  function renderActiveDetail(league) {
    if (!refs.detailTitle) return;
    if (!league) {
      refs.detailTitle.textContent = 'Sélectionne une ligue';
      refs.detailMeta.textContent = 'Aucune ligue sélectionnée.';
      refs.detailLevel.style.display = 'none';
      if (refs.detailManageLink) refs.detailManageLink.style.display = 'none';
      refs.detailTeams.innerHTML = '';
      refs.detailMatches.innerHTML = '';
      refs.detailStandings.innerHTML = '';
      return;
    }
    applyTheme(refs.activeShell, league.level);
    refs.detailTitle.textContent = league.name;
    refs.detailMeta.textContent = (league.config.startDate || '—') + ' • ' + league.config.nbTeams + ' équipes • ' + (league.config.format === 'aller_retour' ? 'Aller / Retour' : 'Aller');
    refs.detailLevel.textContent = league.level;
    refs.detailLevel.style.display = 'inline-flex';
    if (refs.detailManageLink) {
      refs.detailManageLink.style.display = 'inline-flex';
      refs.detailManageLink.onclick = function() { currentActiveId = league.id; showLigueManage(league.id); };
    }
    renderDetailTeams(league);
    renderMatches(league);
    renderStandings(league);
  }

  function renderPlayerManageView(league) {
    if (!refs.playerManageTitle) return;
    if (!league) {
      refs.playerManageTitle.textContent = 'Aucune ligue sélectionnée';
      refs.playerManageMeta.textContent = 'Sélectionne une ligue active pour accéder aux onglets.';
      if (refs.playerManageLevel) refs.playerManageLevel.style.display = 'none';
      clearPlayerPanels();
      return;
    }
    applyTheme(refs.playerManageShell, league.level);
    refs.playerManageTitle.textContent = league.name;
    refs.playerManageMeta.textContent = (league.config.startDate || '—') + ' • ' + league.config.nbTeams + ' équipes • ' + (league.config.format === 'aller_retour' ? 'Aller / Retour' : 'Aller simple');
    if (refs.playerManageLevel) {
      refs.playerManageLevel.textContent = league.level;
      refs.playerManageLevel.style.display = 'inline-flex';
    }
    recomputeStandings(league);
    renderPlayerManageCalendar(league);
    renderPlayerManageStandings(league);
    renderPlayerManageResults(league);
    renderPlayerManageTeams(league);
    renderPlayerManageRules(league);
  }

  function clearPlayerPanels() {
    if (refs.playerManageCalendar) refs.playerManageCalendar.innerHTML = '';
    if (refs.playerManageStandings) refs.playerManageStandings.innerHTML = '';
    if (refs.playerManageResults) refs.playerManageResults.innerHTML = '';
    if (refs.playerManageTeams) refs.playerManageTeams.innerHTML = '';
    if (refs.playerReglementStart) refs.playerReglementStart.textContent = '—';
    if (refs.playerReglementEnd) refs.playerReglementEnd.textContent = '—';
  }

  function renderDetailTeams(league) {
    if (!refs.detailTeams) return;
    refs.detailTeams.innerHTML = '';
    league.teams.forEach(function(t) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.border = '1px solid #111827';
      var title = document.createElement('div');
      title.className = 'ligue-inline';
      var name = document.createElement('div');
      name.className = 'tournaments-title';
      name.textContent = t.name;
      var players = document.createElement('div');
      players.className = 'small-muted';
      players.textContent = (t.players || []).join(', ');
      title.appendChild(name);
      card.appendChild(title);
      card.appendChild(players);
      refs.detailTeams.appendChild(card);
    });
  }

  function renderMatches(league) {
    if (!refs.detailMatches) return;
    refs.detailMatches.innerHTML = '';
    if (!league.matches.length) {
      refs.detailMatches.innerHTML = '<div class="empty">Aucun match programmé.</div>';
      return;
    }
    league.matches.forEach(function(m) {
      var row = document.createElement('div');
      row.className = 'ligue-match-row';
      var date = document.createElement('div');
      date.className = 'ligue-match-title';
      date.textContent = (m.date || 'Date à définir') + ' • Journée ' + m.round;
      var vs = document.createElement('div');
      vs.className = 'ligue-inline';
      vs.style.justifyContent = 'space-between';
      var home = teamName(league, m.home);
      var away = teamName(league, m.away);
      var summary = formatSets(m);
      vs.innerHTML = '<span>' + home + '</span><span style="color:var(--muted);">vs</span><span>' + away + '</span>';
      var status = document.createElement('div');
      status.className = 'small-muted';
      status.textContent = summary === 'À jouer' ? 'À jouer' : ('Score : ' + summary);
      row.appendChild(date);
      row.appendChild(vs);
      row.appendChild(status);
      refs.detailMatches.appendChild(row);
    });
  }

  function recomputeStandings(league) {
    var table = {};
    league.teams.forEach(function(t) {
      table[t.id] = { teamId: t.id, name: t.name, played: 0, wins: 0, losses: 0, points: 0 };
    });
    league.matches.forEach(function(m) {
      var outcome = computeMatchOutcome(m);
      if (!m.validated || outcome.setWins[0] === outcome.setWins[1]) return;
      table[m.home].played += 1;
      table[m.away].played += 1;
      if (outcome.setWins[0] > outcome.setWins[1]) {
        table[m.home].wins += 1;
        table[m.home].points += 3;
        table[m.away].losses += 1;
      } else if (outcome.setWins[1] > outcome.setWins[0]) {
        table[m.away].wins += 1;
        table[m.away].points += 3;
        table[m.home].losses += 1;
      }
    });
    league.standings = Object.values(table).sort(function(a, b) {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });
    renderStandings(league);
  }

  function renderStandings(league) {
    if (!refs.detailStandings) return;
    if (!league || !league.standings || !league.standings.length) {
      refs.detailStandings.innerHTML = '';
      return;
    }
    var html = '<tr><th>#</th><th>Équipe</th><th>J</th><th>V</th><th>D</th><th>Pts</th></tr>';
    league.standings.forEach(function(s, idx) {
      html += '<tr><td>' + (idx + 1) + '</td><td>' + s.name + '</td><td>' + s.played + '</td><td>' + s.wins + '</td><td>' + s.losses + '</td><td>' + s.points + '</td></tr>';
    });
    refs.detailStandings.innerHTML = html;
  }

  function teamName(league, id) {
    var team = league.teams.find(function(t) { return t.id === id; });
    return team ? team.name : id;
  }

  // Retrieve a full team object by id; used in player view rendering to avoid ReferenceError.
  function teamById(league, id) {
    if (!league || !league.teams) return null;
    return league.teams.find(function(t) { return t.id === id; }) || null;
  }

  function ensureMatchSets(match) {
    if (!match.sets || !Array.isArray(match.sets)) {
      match.sets = [{ home: null, away: null }, { home: null, away: null }, { home: null, away: null }];
    }
    while (match.sets.length < 3) match.sets.push({ home: null, away: null });
    match.sets = match.sets.slice(0, 3).map(function(set) {
      if (!set || typeof set !== 'object') return { home: null, away: null };
      var h = set.home;
      var a = set.away;
      var hh = (h === null || h === undefined || h === '') ? null : parseInt(h, 10);
      var aa = (a === null || a === undefined || a === '') ? null : parseInt(a, 10);
      return { home: isNaN(hh) ? null : hh, away: isNaN(aa) ? null : aa };
    });
    if (!Array.isArray(match.scores) || match.scores.length < 2) match.scores = [null, null];
  }

  function computeMatchOutcome(match) {
    ensureMatchSets(match);
    var setWins = [0, 0];
    var completed = 0;
    match.sets.forEach(function(set) {
      if (set.home === null || set.away === null) return;
      completed += 1;
      if (set.home > set.away) setWins[0] += 1;
      else if (set.away > set.home) setWins[1] += 1;
    });
    var winner = null;
    if (setWins[0] >= 2 || setWins[1] >= 2) {
      winner = setWins[0] > setWins[1] ? match.home : match.away;
    }
    var hasWinner = winner !== null && completed >= 2;
    match.scores = setWins;
    if (match.editing) {
      match.played = false;
      match.validated = false;
      match.winnerTeamId = null;
    } else {
      match.played = hasWinner;
      match.validated = hasWinner;
      match.winnerTeamId = hasWinner ? winner : null;
    }
    return { setWins: setWins, completed: completed, winner: match.winnerTeamId };
  }

  function formatSets(match) {
    ensureMatchSets(match);
    var parts = match.sets
      .filter(function(set) { return set.home !== null && set.away !== null; })
      .map(function(set) { return set.home + ' - ' + set.away; });
    return parts.length ? parts.join(' / ') : 'À jouer';
  }

  function updateReglementDates(start, end) {
    var league = getActiveLeague(currentActiveId);
    if (!league) return;
    league.config.reglementStartDate = start || '';
    league.config.reglementEndDate = end || '';
    saveState();
    renderManageRules(league);
    if (refs.playerManageRoot && refs.playerManageRoot.style.display !== 'none') renderPlayerManageRules(league);
  }

  function handleCloseLeague() {
    var league = getActiveLeague(currentActiveId);
    if (!league) return;
    if (!confirm('Clôturer la ligue "' + league.name + '" ?')) return;
    // Figé: s'assurer que le classement final est calculé avant archivage
    recomputeStandings(league);
    league.finishedAt = new Date().toISOString();
    ligueState.activeLeagues = ligueState.activeLeagues.filter(function(l) { return l.id !== league.id; });
    ligueState.finishedLeagues.push(league);
    currentActiveId = null;
    saveState();
    renderHistory();
    renderActiveList();
    renderActiveDetail(null);
    triggerLeagueSocialExport(league);
    showLigueRoot();
  }

  function triggerLeagueSocialExport(league) {
    if (!league || typeof window.buildSocialLeagueImage !== 'function') return;
    window.buildSocialLeagueImage(league).then(function(canvas) {
      var filename = 'ligue_' + slugifyName(league.name || 'ligue') + '_finale.png';
      if (window.socialModal && window.socialModal.preview) {
        window.socialModal.preview(canvas, 'Image réseaux – ' + (league.name || ''), filename);
      } else if (typeof window.exportSocialImage === 'function') {
        window.exportSocialImage(canvas, filename);
      }
    }).catch(function(err) { console.warn('Export social ligue', err); });
  }

  function setActiveManageTab(tab) {
    if (!refs.managePanels[tab]) tab = 'calendar';
    currentManageTab = tab;
    Object.keys(refs.managePanels).forEach(function(key) {
      var panel = refs.managePanels[key];
      var btn = refs.manageTabButtons[key];
      if (panel) panel.classList.toggle('hidden', key !== tab);
      if (btn) btn.classList.toggle('active', key === tab);
    });
  }

  function renderManageView(league) {
    if (!refs.manageTitle) return;
    if (!league) {
      refs.manageTitle.textContent = 'Aucune ligue sélectionnée';
      refs.manageMeta.textContent = 'Choisis une ligue active.';
      if (refs.manageLevel) refs.manageLevel.style.display = 'none';
      return;
    }
    applyTheme(refs.manageShell, league.level);
    refs.manageTitle.textContent = league.name;
    refs.manageMeta.textContent = '📅 Début ' + (league.config.startDate || '—') + ' • ' + league.config.nbTeams + ' équipes • ' + (league.config.format === 'aller_retour' ? 'Aller / Retour' : 'Aller simple');
    if (refs.manageLevel) {
      refs.manageLevel.textContent = league.level;
      refs.manageLevel.style.display = 'inline-flex';
    }
    renderDayExportOptions(league);
    renderManageCalendar(league);
    renderManageStandings(league);
    renderManageResults(league);
    renderManageTeams(league);
    renderManageRules(league);
  }

  function renderManageCalendar(league) {
    if (!refs.manageCalendar) return;
    refs.manageCalendar.innerHTML = '';
    if (!league.matches.length) {
      refs.manageCalendar.innerHTML = '<div class="empty">Aucun match programmé.</div>';
      return;
    }
    if (refs.manageCalendarNote) {
      var playedCount = league.matches.filter(function(m) { return m.played; }).length;
      var note = playedCount ? ('⏱️ ' + playedCount + ' / ' + league.matches.length + ' matchs joués') : 'Planification complète';
      refs.manageCalendarNote.textContent = note;
    }
    league.matches.forEach(function(m) {
      var card = document.createElement('div');
      card.className = 'ligue-match-card';
      if (m.validated) card.classList.add('ligue-match-validated');
      var title = document.createElement('div');
      title.className = 'ligue-inline';
      title.style.justifyContent = 'space-between';
      title.innerHTML = '<span>📅 Journée ' + m.round + '</span><span class="small-muted">' + (m.date || 'Date à définir') + '</span>';
      var vs = document.createElement('div');
      vs.className = 'ligue-inline';
      vs.style.justifyContent = 'space-between';
      vs.innerHTML = '<span>🎾 ' + teamName(league, m.home) + '</span><span style="color:var(--muted);">vs</span><span>' + teamName(league, m.away) + '</span>';
      var status = document.createElement('div');
      status.className = 'small-muted';
      status.textContent = m.played ? '✅ Match joué' : '⏳ À jouer';
      // Nouveau : date personnalisée pour chaque match de la ligue interne
      var dateRow = document.createElement('div');
      dateRow.className = 'ligue-inline';
      dateRow.style.justifyContent = 'space-between';
      dateRow.style.marginTop = '6px';
      var dateLabel = document.createElement('span');
      dateLabel.className = 'small-muted';
      dateLabel.textContent = '🗓️ Date du match';
      var dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.value = m.date || '';
      dateInput.className = 'btn-small';
      dateInput.style.borderRadius = '10px';
      dateInput.addEventListener('change', function() {
        m.date = dateInput.value || '';
        saveState();
        renderManageCalendar(league);
        renderPlayerManageCalendar(league);
      });
      dateRow.appendChild(dateLabel);
      dateRow.appendChild(dateInput);
      card.appendChild(title);
      card.appendChild(vs);
      card.appendChild(status);
      card.appendChild(dateRow);
      refs.manageCalendar.appendChild(card);
    });
  }

  // Render a calendar list into a given container, optionally with a filtered match set (used for exports)
  function renderCalendarInto(container, league, matchList) {
    if (!container || !league) return;
    container.innerHTML = '';
    var list = matchList && matchList.length ? matchList : league.matches || [];
    if (!list.length) {
      container.innerHTML = '<div class="empty">Aucun match programmé.</div>';
      return;
    }
    list.forEach(function(m) {
      var card = document.createElement('div');
      card.className = 'ligue-match-card';
      if (m.validated) card.classList.add('ligue-match-validated');
      var title = document.createElement('div');
      title.className = 'ligue-inline';
      title.style.justifyContent = 'space-between';
      title.innerHTML = '<span>📅 Journée ' + m.round + '</span><span class="small-muted">' + (m.date || 'Date à définir') + '</span>';
      var vs = document.createElement('div');
      vs.className = 'ligue-inline';
      vs.style.justifyContent = 'space-between';
      vs.innerHTML = '<span>🎾 ' + teamName(league, m.home) + '</span><span style="color:var(--muted);">vs</span><span>' + teamName(league, m.away) + '</span>';
      var status = document.createElement('div');
      status.className = 'small-muted';
      status.textContent = m.played ? '✅ Match joué' : '⏳ À jouer';
      card.appendChild(title);
      card.appendChild(vs);
      card.appendChild(status);
      container.appendChild(card);
    });
  }

  function renderDayExportOptions(league) {
    if (!refs.dayExportSelect) return;
    refs.dayExportSelect.innerHTML = '';
    if (!league || !league.matches || !league.matches.length) {
      var opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Aucune journée';
      refs.dayExportSelect.appendChild(opt);
      return;
    }
    var rounds = Array.from(new Set(league.matches.map(function(m) { return m.round; }).filter(Boolean))).sort(function(a, b) {
      return parseInt(a, 10) - parseInt(b, 10);
    });
    rounds.forEach(function(r, idx) {
      var opt = document.createElement('option');
      opt.value = r;
      opt.textContent = 'Journée ' + r;
      if (idx === 0) opt.selected = true;
      refs.dayExportSelect.appendChild(opt);
    });
  }

  function renderManageResults(league) {
    if (!refs.manageResults) return;
    refs.manageResults.innerHTML = '';
    if (!league.matches.length) {
      refs.manageResults.innerHTML = '<div class="empty">Aucun match programmé.</div>';
      return;
    }

    var hasFinished = false;
    league.matches.forEach(function(m) {
      var editingMode = m.editing || !m.validated;
      var card = buildResultCard(league, m, editingMode);
      if (!editingMode && m.validated) {
        hasFinished = true;
        card.classList.add('ligue-match-validated');
      }
      refs.manageResults.appendChild(card);
    });

    if (!hasFinished) {
      var info = document.createElement('div');
      info.className = 'small-muted';
      info.style.marginTop = '8px';
      info.textContent = 'Valide un score pour le voir ici et dans la vue joueur.';
      refs.manageResults.appendChild(info);
    }
  }

  function buildResultCard(league, match, editingMode) {
    ensureMatchSets(match);
    computeMatchOutcome(match);
    var home = { id: match.home, name: teamName(league, match.home) };
    var away = { id: match.away, name: teamName(league, match.away) };
    var card = document.createElement('div');
    card.className = 'ligue-match-card';

    var head = document.createElement('div');
    head.className = 'ligue-inline';
    head.style.justifyContent = 'space-between';
    var headLeft = document.createElement('span');
    headLeft.textContent = '🎾 Journée ' + match.round;
    var headRight = document.createElement('div');
    headRight.className = 'ligue-inline';
    headRight.style.gap = '8px';
    var dateEl = document.createElement('span');
    dateEl.className = 'small-muted';
    dateEl.textContent = match.date || 'Date à définir';
    headRight.appendChild(dateEl);
    if (!editingMode && match.played) {
      var badge = document.createElement('span');
      badge.className = 'ligue-badge ligue-badge-valid';
      badge.textContent = '✅ Validé';
      headRight.appendChild(badge);
    }
    head.appendChild(headLeft);
    head.appendChild(headRight);

    var body = document.createElement('div');
    body.className = 'ligue-inline ligue-result-row';
    body.style.justifyContent = 'space-between';
    var homeEl = document.createElement('div');
    homeEl.className = 'ligue-result-team';
    homeEl.textContent = home.name;
    var scoreEl = document.createElement('div');
    scoreEl.className = 'ligue-result-score';
    var awayEl = document.createElement('div');
    awayEl.className = 'ligue-result-team';
    awayEl.textContent = away.name;

    var inputWrap = document.createElement('div');
    inputWrap.className = 'ligue-score-area';
    inputWrap.style.display = editingMode ? 'grid' : 'none';
    inputWrap.style.gridTemplateColumns = 'repeat(1, minmax(0,1fr))';
    inputWrap.style.gap = '8px';

    var setInputs = [];
    if (editingMode) {
      [0, 1, 2].forEach(function(idx) {
        var row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '100px repeat(2, minmax(0,1fr))';
        row.style.gap = '8px';
        row.style.alignItems = 'center';
        row.className = 'ligue-score-area';
        var label = document.createElement('div');
        label.className = 'small-muted';
        label.textContent = 'Set ' + (idx + 1);
        var homeInput = document.createElement('input');
        homeInput.type = 'number';
        homeInput.min = '0';
        homeInput.max = '7';
        homeInput.placeholder = '6';
        homeInput.value = match.sets[idx] && match.sets[idx].home !== null ? match.sets[idx].home : '';
        var awayInput = document.createElement('input');
        awayInput.type = 'number';
        awayInput.min = '0';
        awayInput.max = '7';
        awayInput.placeholder = '4';
        awayInput.value = match.sets[idx] && match.sets[idx].away !== null ? match.sets[idx].away : '';
        setInputs.push({ home: homeInput, away: awayInput, index: idx });
        row.appendChild(label);
        row.appendChild(homeInput);
        row.appendChild(awayInput);
        inputWrap.appendChild(row);
      });
    }

    var actions = document.createElement('div');
    actions.className = 'ligue-inline ligue-score-area';
    actions.style.justifyContent = 'flex-end';

    if (editingMode) {
      var submit = document.createElement('button');
      submit.className = 'btn';
      submit.textContent = 'Valider le résultat';
      submit.addEventListener('click', function() { handleValidateResult(league, match, setInputs); });
      actions.appendChild(submit);
    } else {
      scoreEl.textContent = formatSets(match);
      if (match.winnerTeamId === home.id) homeEl.classList.add('winner-tag', 'match-winner');
      if (match.winnerTeamId === away.id) awayEl.classList.add('winner-tag', 'match-winner');
      var editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary btn-small';
      editBtn.textContent = 'Modifier le score';
      editBtn.addEventListener('click', function() {
        match.editing = true;
        match.played = false;
        match.validated = false;
        match.winnerTeamId = null;
        recomputeStandings(league);
        renderManageView(league);
      });
      actions.appendChild(editBtn);
    }

    var scoreSlot = editingMode ? document.createElement('div') : scoreEl;
    if (editingMode) {
      scoreSlot.className = 'ligue-result-score';
      scoreSlot.textContent = 'Saisie en cours';
    }
    body.appendChild(homeEl);
    body.appendChild(scoreSlot);
    body.appendChild(awayEl);
    card.appendChild(head);
    card.appendChild(body);
    card.appendChild(inputWrap);
    if (!editingMode) {
      var scoreRow = document.createElement('div');
      scoreRow.className = 'ligue-inline';
      scoreRow.style.justifyContent = 'center';
      scoreRow.style.margin = '8px 0';
      scoreRow.appendChild(scoreEl);
      card.appendChild(scoreRow);
    }
    card.appendChild(actions);
    return card;
  }

  function handleValidateResult(league, match, setInputs) {
    if (!league || !match) return;
    var sets = [];
    for (var i = 0; i < setInputs.length; i += 1) {
      var entry = setInputs[i];
      var homeVal = entry.home.value === '' ? null : parseInt(entry.home.value, 10);
      var awayVal = entry.away.value === '' ? null : parseInt(entry.away.value, 10);

      if (i < 2 && (homeVal === null || awayVal === null || isNaN(homeVal) || isNaN(awayVal))) {
        alert('Merci de saisir les scores complets sur les deux premiers sets (0 à 7).');
        return;
      }

      if (i === 2 && ((homeVal === null) !== (awayVal === null))) {
        alert('Renseigne les deux scores du set 3 ou laisse-les vides.');
        return;
      }

      if (homeVal !== null && (homeVal < 0 || homeVal > 7 || isNaN(homeVal))) { alert('Les scores doivent être entre 0 et 7.'); return; }
      if (awayVal !== null && (awayVal < 0 || awayVal > 7 || isNaN(awayVal))) { alert('Les scores doivent être entre 0 et 7.'); return; }

      sets.push({ home: homeVal, away: awayVal });
    }

    var setWins = [0, 0];
    var completedSets = 0;
    sets.forEach(function(s) {
      if (s.home === null || s.away === null) return;
      completedSets += 1;
      if (s.home > s.away) setWins[0] += 1; else if (s.away > s.home) setWins[1] += 1;
    });

    if (completedSets < 2) { alert('Au moins deux sets complets sont requis.'); return; }
    if (setWins[0] === setWins[1]) {
      if (!sets[2] || sets[2].home === null || sets[2].away === null) {
        alert('Match à égalité : ajoute le set 3 pour désigner un vainqueur.');
        return;
      }
    }

    match.sets = sets;
    match.editing = false;
    match.validated = true;
    computeMatchOutcome(match);
    recomputeStandings(league);
    saveState();
    renderManageView(league);
    renderActiveDetail(league);
    if (refs.playerManageRoot && refs.playerManageRoot.style.display !== 'none') {
      renderPlayerManageView(league);
    }
  }

  function renderManageStandings(league) {
    if (!refs.manageStandings) return;
    if (!league.standings || !league.standings.length) {
      refs.manageStandings.innerHTML = '';
      return;
    }
    var html = '<tr><th>#</th><th>Équipe</th><th>J</th><th>V</th><th>D</th><th>Pts</th></tr>';
    league.standings.forEach(function(s, idx) {
      var badge = '';
      if (idx === 0) badge = ' 🥇';
      else if (idx === 1) badge = ' 🥈';
      else if (idx === 2) badge = ' 🥉';
      html += '<tr><td>' + (idx + 1) + '</td><td>' + s.name + badge + '</td><td>' + s.played + '</td><td>' + s.wins + '</td><td>' + s.losses + '</td><td>' + s.points + '</td></tr>';
    });
    refs.manageStandings.innerHTML = html;
  }

  // Correction : bouton "Modifier les équipes" ligue interne
  function handleTeamEdit(league, team) {
    if (!league || !team) return;
    var newName = window.prompt('Nom de l\'équipe', team.name || '');
    if (newName === null) return;
    var existingPlayers = (team.players || []).join('\n');
    var newPlayers = window.prompt('Joueurs (un par ligne)', existingPlayers);
    if (newPlayers === null) return;
    var cleanedPlayers = newPlayers.split(/\n|,/).map(function(p) { return p.trim(); }).filter(Boolean);
    team.name = (newName || team.name || '').trim() || team.name;
    team.players = cleanedPlayers;
    recomputeStandings(league);
    saveState();
    renderManageTeams(league);
    renderManageStandings(league);
    renderManageResults(league);
    renderManageCalendar(league);
    renderPlayerManageView(league);
    renderActiveList();
    renderPlayerList();
  }

  function renderManageTeams(league) {
    if (!refs.manageTeams) return;
    refs.manageTeams.innerHTML = '';
    league.teams.forEach(function(t) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.border = '1px solid #111827';
      var head = document.createElement('div');
      head.className = 'ligue-inline';
      head.style.justifyContent = 'space-between';
      var title = document.createElement('div');
      title.className = 'tournaments-title';
      title.textContent = '👥 ' + t.name;
      var edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'ligue-badge-accent';
      edit.textContent = '✏️ Modifier l\'équipe';
      edit.addEventListener('click', function() { handleTeamEdit(league, t); });
      head.appendChild(title);
      head.appendChild(edit);
      var players = document.createElement('div');
      players.className = 'small-muted';
      players.textContent = (t.players || []).map(function(p) { return '🎾 ' + p; }).join(' • ');
      card.appendChild(head);
      card.appendChild(players);
    refs.manageTeams.appendChild(card);
    });
  }

  function renderManageRules(league) {
    if (!refs.reglementStart || !refs.reglementEnd) return;
    refs.reglementStart.value = (league && league.config && league.config.reglementStartDate) ? league.config.reglementStartDate : '';
    refs.reglementEnd.value = (league && league.config && league.config.reglementEndDate) ? league.config.reglementEndDate : '';
  }

  function handleExportMatches() {
    var league = getActiveLeague(currentActiveId);
    if (!league) { alert('Sélectionne une ligue à exporter.'); return; }
    setActiveManageTab('calendar');
    var mode = 1;
    try {
      var choice = window.prompt('Choix export : 1 = tous les matchs, 2 = par équipe', '1');
      mode = (choice && choice.trim() === '2') ? 2 : 1;
    } catch (e) { mode = 1; }
    var useImage = false;
    try { useImage = window.confirm('Exporter en image (PNG) ?\nOK pour PNG, Annuler pour PDF.'); } catch (e) { useImage = false; }
    if (mode === 1) {
      if (useImage) exportMatchesToImage(league); else exportMatchesToPrint(league);
      return;
    }

    var teams = league.teams || [];
    if (!teams.length) { alert('Aucune équipe disponible pour filtrer.'); return; }
    var listLabel = teams.map(function(t, idx) { return (idx + 1) + ' - ' + (t.name || t.id); }).join('\n');
    var selection = null;
    try {
      selection = window.prompt('Sélectionne les équipes à exporter (ex: 1,3,4):\n' + listLabel, '1');
    } catch (e) { selection = null; }
    if (!selection) { alert('Merci de choisir au moins une équipe.'); return; }
    var chosenIndexes = selection.split(/[ ,;]+/).map(function(val) { return parseInt(val, 10); }).filter(function(v) { return !isNaN(v); });
    var chosenIds = [];
    chosenIndexes.forEach(function(idx) {
      if (idx >= 1 && idx <= teams.length) {
        var team = teams[idx - 1];
        if (team && chosenIds.indexOf(team.id) === -1) chosenIds.push(team.id);
      }
    });
    if (!chosenIds.length) { alert('Merci de choisir au moins une équipe valide.'); return; }

    chosenIds.forEach(function(teamId) {
      var team = teams.find(function(t) { return t.id === teamId; }) || { id: teamId, name: teamId };
      var subset = (league.matches || []).filter(function(m) { return m.home === teamId || m.away === teamId; });
      if (!subset.length) return;
      var suffix = '_equipe_' + slugifyName(team.name || team.id);
      if (useImage) exportMatchesToImage(league, subset, suffix); else exportMatchesToPrint(league, subset, suffix);
    });
  }

  function handleDayExport() {
    var league = getActiveLeague(currentActiveId);
    if (!league) { alert('Sélectionne une ligue active.'); return; }
    var roundVal = refs.dayExportSelect ? parseInt(refs.dayExportSelect.value, 10) : NaN;
    if (isNaN(roundVal)) { alert('Choisis une journée à exporter.'); return; }
    if (!window.leagueExportBackgroundDataUrl) { alert('Merci de choisir un fond d’export dans les paramètres de la Ligue interne avant de générer l’export.'); return; }
    if (typeof window.buildSocialDayImage !== 'function') { alert('Export image réseaux indisponible.'); return; }
    window.buildSocialDayImage(league, roundVal, window.leagueExportBackgroundDataUrl).then(function(canvas) {
      var filename = 'ligue_' + slugifyName(league.name || 'ligue') + '_journee_' + roundVal + '.png';
      if (window.socialModal && window.socialModal.preview) {
        window.socialModal.preview(canvas, 'Résumé journée ' + roundVal + ' – ' + (league.name || ''), filename);
      } else if (typeof window.exportSocialImage === 'function') {
        window.exportSocialImage(canvas, filename);
      }
    }).catch(function(err) {
      console.warn('Export journée ligue', err);
      alert('Impossible de générer l\'image de la journée.');
    });
  }

  function exportMatchesToPrint(league, matches, suffix) {
    if (!league) return;
    var backup = null;
    if (matches && matches.length && refs.manageCalendar) {
      backup = refs.manageCalendar.innerHTML;
      renderCalendarInto(refs.manageCalendar, league, matches);
    }
    var originalTitle = document.title;
    if (suffix) document.title = (league.name || 'ligue') + suffix;
    document.body.classList.add('printing-matches');
    var cleanup = function() {
      document.body.classList.remove('printing-matches');
      if (backup !== null) renderManageCalendar(league);
      document.title = originalTitle;
    };
    setTimeout(function() {
      try { window.print(); } finally { setTimeout(cleanup, 150); }
    }, 40);
  }

  function exportMatchesToImage(league, matches, suffix) {
    if (!league || !refs.manageCalendar) return;
    if (!window.html2canvas) { alert('html2canvas est requis pour exporter en image.'); return; }
    var container = refs.manageCalendar;
    var backup = null;
    if (matches && matches.length) {
      backup = container.innerHTML;
      renderCalendarInto(container, league, matches);
    }
    setActiveManageTab('calendar');
    container.classList.add('ligue-export-hide-scores');
    window.html2canvas(container, { backgroundColor: null, scale: 2 }).then(function(canvas) {
      var link = document.createElement('a');
      var base = 'calendrier_' + (league.name || 'ligue');
      if (suffix) base += suffix;
      link.download = base + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(function() {
      alert('Export image impossible.');
    }).finally(function() {
      container.classList.remove('ligue-export-hide-scores');
      if (backup !== null) renderManageCalendar(league);
    });
  }

  function setActivePlayerTab(tab) {
    if (!refs.playerManagePanels[tab]) tab = 'calendar';
    currentPlayerTab = tab;
    Object.keys(refs.playerManagePanels).forEach(function(key) {
      var panel = refs.playerManagePanels[key];
      var btn = refs.playerManageTabButtons[key];
      if (panel) panel.classList.toggle('hidden', key !== tab);
      if (btn) btn.classList.toggle('active', key === tab);
    });
  }

  function renderPlayerManageCalendar(league) {
    if (!refs.playerManageCalendar) return;
    refs.playerManageCalendar.innerHTML = '';
    if (!league || !league.matches.length) {
      refs.playerManageCalendar.innerHTML = '<div class="empty">Aucun match programmé.</div>';
      return;
    }
    league.matches.forEach(function(m) {
      var card = document.createElement('div');
      card.className = 'ligue-match-card';
      var head = document.createElement('div');
      head.className = 'ligue-inline';
      head.style.justifyContent = 'space-between';
      head.innerHTML = '<span>📅 Journée ' + m.round + '</span><span class="small-muted">' + (m.date || 'Date à définir') + '</span>';
      var body = document.createElement('div');
      body.className = 'ligue-inline';
      body.style.justifyContent = 'space-between';
      var vs = document.createElement('div');
      vs.textContent = '🎾 ' + teamName(league, m.home) + ' vs ' + teamName(league, m.away);
      var status = document.createElement('div');
      status.className = 'small-muted';
      status.textContent = m.played ? '✅ Match joué' : '⏳ À jouer';
      body.appendChild(vs);
      body.appendChild(status);
      card.appendChild(head);
      card.appendChild(body);
      refs.playerManageCalendar.appendChild(card);
    });
  }

  function renderPlayerManageStandings(league) {
    if (!refs.playerManageStandings) return;
    if (!league || !league.standings || !league.standings.length) {
      refs.playerManageStandings.innerHTML = '';
      return;
    }
    var html = '<tr><th>#</th><th>Équipe</th><th>J</th><th>V</th><th>D</th><th>Pts</th></tr>';
    league.standings.forEach(function(s, idx) {
      var badge = '';
      if (idx === 0) badge = ' 🥇';
      else if (idx === 1) badge = ' 🥈';
      else if (idx === 2) badge = ' 🥉';
      html += '<tr><td>' + (idx + 1) + '</td><td>' + s.name + badge + '</td><td>' + s.played + '</td><td>' + s.wins + '</td><td>' + s.losses + '</td><td>' + s.points + '</td></tr>';
    });
    refs.playerManageStandings.innerHTML = html;
  }

  function renderPlayerManageResults(league) {
    if (!refs.playerManageResults) return;
    refs.playerManageResults.innerHTML = '';
    if (!league || !league.matches.length) {
      refs.playerManageResults.innerHTML = '<div class="empty">Aucun résultat pour l’instant.</div>';
      return;
    }
    // Player view must mirror admin but stay read-only: only keep validated matches
    var finished = league.matches.filter(function(m) { return !!m.validated; });
    if (!finished.length) {
      refs.playerManageResults.innerHTML = '<div class="empty">Aucun résultat pour l’instant.</div>';
      return;
    }
    finished.forEach(function(m) {
      ensureMatchSets(m);
      computeMatchOutcome(m);
      var home = teamById(league, m.home) || { id: m.home, name: m.home };
      var away = teamById(league, m.away) || { id: m.away, name: m.away };
      var winnerId = m.validated ? m.winnerTeamId : null;
      var scoreText = formatSets(m);
      var card = document.createElement('div');
      card.className = 'ligue-match-card';
      if (winnerId === home.id || winnerId === away.id) card.classList.add('ligue-match-winner-card');
      var head = document.createElement('div');
      head.className = 'ligue-inline';
      head.style.justifyContent = 'space-between';
      head.innerHTML = '<span>🎾 Journée ' + m.round + '</span><span class="small-muted">' + (m.date || 'Date à définir') + '</span>';
      var body = document.createElement('div');
      body.className = 'ligue-inline ligue-result-row';
      body.style.justifyContent = 'space-between';
      var homeEl = document.createElement('div');
      homeEl.className = 'ligue-result-team';
      homeEl.textContent = '🎾 ' + home.name;
      var scoreEl = document.createElement('div');
      scoreEl.className = 'ligue-result-score';
      scoreEl.textContent = scoreText;
      var awayEl = document.createElement('div');
      awayEl.className = 'ligue-result-team';
      awayEl.textContent = away.name;
      if (winnerId === home.id) homeEl.classList.add('winner-tag', 'match-winner');
      if (winnerId === away.id) awayEl.classList.add('winner-tag', 'match-winner');
      body.appendChild(homeEl);
      body.appendChild(scoreEl);
      body.appendChild(awayEl);
      card.appendChild(head);
      card.appendChild(body);
      refs.playerManageResults.appendChild(card);
    });
  }

  function renderPlayerManageTeams(league) {
    if (!refs.playerManageTeams) return;
    refs.playerManageTeams.innerHTML = '';
    if (!league || !league.teams) return;
    league.teams.forEach(function(t) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.border = '1px solid #111827';
      var head = document.createElement('div');
      head.className = 'ligue-inline';
      head.style.justifyContent = 'space-between';
      var title = document.createElement('div');
      title.className = 'tournaments-title';
      title.textContent = '👥 ' + t.name;
      head.appendChild(title);
      var players = document.createElement('div');
      players.className = 'small-muted';
      players.textContent = (t.players || []).map(function(p) { return '🎾 ' + p; }).join(' • ');
      card.appendChild(head);
      card.appendChild(players);
      refs.playerManageTeams.appendChild(card);
    });
  }

  function renderPlayerManageRules(league) {
    if (!refs.playerReglementStart || !refs.playerReglementEnd) return;
    refs.playerReglementStart.textContent = (league && league.config && league.config.reglementStartDate) ? league.config.reglementStartDate : '—';
    refs.playerReglementEnd.textContent = (league && league.config && league.config.reglementEndDate) ? league.config.reglementEndDate : '—';
  }


  window.hideLigueSections = hideLigueSections;
  window.showLigueRoot = showLigueRoot;
  window.showLigueConfig = showLigueConfig;
  window.showLigueActive = showLigueActive;
  window.showLigueManage = showLigueManage;
  window.showLiguePlayerView = showLiguePlayerView;
  window.showLiguePlayerManage = showLiguePlayerManage;
})();
