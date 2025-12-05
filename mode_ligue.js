(function() {
  'use strict';

  // Ligue interne : navigation, création, planification, scores, et vues thématiques par niveau.

  var STORAGE_KEY = 'padel_ligues_v1';
  var dayLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  var LEVEL_CLASS = {
    'ligue 1': 'ligue-theme-n1',
    'ligue 2': 'ligue-theme-n2',
    'ligue 3': 'ligue-theme-n3',
    'niveau 1': 'ligue-theme-n1',
    'niveau 2': 'ligue-theme-n2',
    'niveau 3': 'ligue-theme-n3'
  };

  var ligueState = loadState();
  var currentActiveId = null;
  var currentManageTab = 'calendar';
  var currentPlayerId = null;
  var currentPlayerTab = 'calendar';

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
    configDays: document.getElementById('ligue-config-days'),
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
    manageTabs: document.getElementById('ligue-manage-tabs'),
    manageCalendarNote: document.getElementById('ligue-calendar-note'),
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
    playerManageTeams: document.getElementById('ligue-player-manage-teams')
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { activeLeagues: [], finishedLeagues: [] };
      var parsed = JSON.parse(raw);
      if (!parsed.activeLeagues) parsed.activeLeagues = [];
      if (!parsed.finishedLeagues) parsed.finishedLeagues = [];
      migrateLevels(parsed);
      normalizeMatches(parsed);
      return parsed;
    } catch (e) {
      return { activeLeagues: [], finishedLeagues: [] };
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
      if (!lg.matches) lg.matches = [];
      lg.matches.forEach(function(m) { ensureMatchSets(m); computeMatchOutcome(m); });
      if (!lg.standings) lg.standings = buildStandings(lg.teams || []);
      recomputeStandings(lg);
    };
    if (state.activeLeagues) state.activeLeagues.forEach(hydrateLeague);
    if (state.finishedLeagues) state.finishedLeagues.forEach(function(lg) {
      if (!lg.matches) lg.matches = [];
      lg.matches.forEach(function(m) { ensureMatchSets(m); computeMatchOutcome(m); });
      if (!lg.standings) lg.standings = buildStandings(lg.teams || []);
    });
  }

  function applyTheme(container, level) {
    if (!container) return;
    ['ligue-theme-n1', 'ligue-theme-n2', 'ligue-theme-n3'].forEach(function(cls) { container.classList.remove(cls); });
    var normalized = normalizeLevel(level);
    var cls = LEVEL_CLASS[normalized.toLowerCase()];
    if (cls) container.classList.add(cls);
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
  bind(refs.configBackBtn, showLigueRoot);
  bind(refs.activeBackBtn, showLigueRoot);
  bind(refs.playerBackBtn, showLigueRoot);
  bind(refs.playerManageBackBtn, showLiguePlayerView);
  bind(refs.configGenerateBtn, handleGenerate);
  bind(refs.configAutoTeamsBtn, handleAutoTeams);
  bind(refs.closeBtn, handleCloseLeague);
  bind(refs.manageCloseBtn, handleCloseLeague);
  bind(refs.manageBackBtn, showLigueActive);

  if (refs.configLevel) refs.configLevel.addEventListener('change', function() { applyTheme(refs.configShell, refs.configLevel.value); });
  if (refs.configNbTeams) refs.configNbTeams.addEventListener('change', function() {
    var val = parseInt(refs.configNbTeams.value, 10);
    if (isNaN(val)) val = 8;
    val = Math.max(4, Math.min(20, val));
    refs.configNbTeams.value = val;
    renderTeamInputs(val);
  });

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

  initDays();
  renderTeamInputs(parseInt(refs.configNbTeams && refs.configNbTeams.value, 10) || 8);
  renderHistory();
  renderActiveList();

  function initDays() {
    if (!refs.configDays) return;
    refs.configDays.innerHTML = '';
    dayLabels.forEach(function(label, idx) {
      var wrap = document.createElement('label');
      wrap.className = 'ligue-badge';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = idx;
      cb.style.marginRight = '6px';
      wrap.appendChild(cb);
      wrap.appendChild(document.createTextNode(label));
      refs.configDays.appendChild(wrap);
    });
  }

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

  function collectDays() {
    var res = [];
    if (!refs.configDays) return res;
    var inputs = refs.configDays.querySelectorAll('input[type="checkbox"]');
    inputs.forEach(function(cb) { if (cb.checked) res.push(parseInt(cb.value, 10)); });
    return res;
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
    var days = collectDays();
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
    return { name: name, level: level, nbTeams: nbTeams, format: format, start: start, days: days, teams: teams };
  }

  function handleGenerate() {
    var cfg = validateConfig();
    if (cfg.error) { alert(cfg.error); return; }
    var leagueId = 'ligue_' + Date.now();
    var level = normalizeLevel(cfg.level);
    var matches = buildSchedule(cfg.teams, cfg.format === 'aller_retour');
    matches = assignDates(matches, cfg.start, cfg.days);
    var league = {
      id: leagueId,
      name: cfg.name,
      level: level,
      config: {
        nbTeams: cfg.nbTeams,
        format: cfg.format,
        startDate: cfg.start,
        allowedWeekdays: cfg.days
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

  function assignDates(matches, startDate, weekdays) {
    if (!startDate) return matches;
    var allowed = (weekdays && weekdays.length) ? weekdays : [1, 3, 5];
    var cursor = new Date(startDate + 'T00:00:00');
    matches.forEach(function(m) {
      cursor = findNextAllowed(cursor, allowed);
      m.date = cursor.toISOString().slice(0, 10);
      cursor.setDate(cursor.getDate() + 1);
    });
    return matches;
  }

  function findNextAllowed(date, allowed) {
    var d = new Date(date);
    for (var i = 0; i < 21; i++) {
      var day = (d.getDay() + 6) % 7; // Lundi = 0
      if (allowed.indexOf(day) !== -1) return d;
      d.setDate(d.getDate() + 1);
    }
    return d;
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
      card.appendChild(title);
      card.appendChild(meta);
      refs.historyList.appendChild(card);
    });
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
  }

  function clearPlayerPanels() {
    if (refs.playerManageCalendar) refs.playerManageCalendar.innerHTML = '';
    if (refs.playerManageStandings) refs.playerManageStandings.innerHTML = '';
    if (refs.playerManageResults) refs.playerManageResults.innerHTML = '';
    if (refs.playerManageTeams) refs.playerManageTeams.innerHTML = '';
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
      vs.innerHTML = '<span>' + home + '</span><span style="color:var(--muted);">vs</span><span>' + away + '</span>';
      var helper = document.createElement('div');
      helper.className = 'small-muted';
      helper.textContent = 'Score équipe A - Score équipe B (2 sets gagnants)';
      var scores = createSetInputs(league, m);
      row.appendChild(date);
      row.appendChild(vs);
      row.appendChild(helper);
      row.appendChild(scores);
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
      if (!m.played || outcome.setWins[0] === outcome.setWins[1]) return;
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

  function ensureMatchSets(match) {
    if (!match.sets || !Array.isArray(match.sets)) {
      match.sets = [{ home: null, away: null }, { home: null, away: null }, { home: null, away: null }];
    }
    while (match.sets.length < 3) match.sets.push({ home: null, away: null });
    match.sets = match.sets.map(function(set) {
      if (!set || typeof set !== 'object') return { home: null, away: null };
      var h = set.home;
      var a = set.away;
      var hh = (h === null || h === undefined || h === '') ? null : parseInt(h, 10);
      var aa = (a === null || a === undefined || a === '') ? null : parseInt(a, 10);
      return { home: isNaN(hh) ? null : hh, away: isNaN(aa) ? null : aa };
    });
    var hasExisting = match.sets.some(function(s) { return s.home !== null || s.away !== null; });
    if (!hasExisting && match.scores && match.scores[0] !== null && match.scores[1] !== null) {
      match.sets[0] = { home: match.scores[0], away: match.scores[1] };
    }
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
    match.scores = setWins;
    match.played = completed >= 2 && (setWins[0] === 2 || setWins[1] === 2);
    return { setWins: setWins, completed: completed };
  }

  function formatSets(match) {
    ensureMatchSets(match);
    var parts = match.sets
      .filter(function(set) { return set.home !== null && set.away !== null; })
      .map(function(set) { return set.home + ' - ' + set.away; });
    return parts.length ? parts.join(', ') : 'À jouer';
  }

  function updateSetScore(league, matchId, setIndex, side, value) {
    if (!league || !league.matches) return;
    var match = league.matches.find(function(m) { return m.id === matchId; });
    if (!match) return;
    ensureMatchSets(match);
    var parsed = value === '' ? null : parseInt(value, 10);
    if (isNaN(parsed)) parsed = null;
    if (!match.sets[setIndex]) match.sets[setIndex] = { home: null, away: null };
    if (side === '1') match.sets[setIndex].away = parsed; else match.sets[setIndex].home = parsed;
    computeMatchOutcome(match);
    recomputeStandings(league);
    saveState();
    if (refs.manageRoot && refs.manageRoot.style.display !== 'none') renderManageView(league);
    if (refs.activeRoot && refs.activeRoot.style.display !== 'none') renderActiveDetail(league);
    if (refs.playerManageRoot && refs.playerManageRoot.style.display !== 'none') renderPlayerManageView(league);
  }

  function createSetInputs(league, match) {
    ensureMatchSets(match);
    var wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    wrap.style.gap = '8px';
    wrap.style.marginTop = '8px';
    match.sets.forEach(function(set, idx) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.border = '1px solid #111827';
      card.style.padding = '8px';
      var label = document.createElement('div');
      label.className = 'tournaments-subtitle';
      label.textContent = 'Set ' + (idx + 1);
      var row = document.createElement('div');
      row.className = 'ligue-inline';
      row.style.justifyContent = 'space-between';
      var homeInput = document.createElement('input');
      homeInput.type = 'number';
      homeInput.min = '0';
      homeInput.placeholder = '6';
      homeInput.value = set.home !== null ? set.home : '';
      homeInput.dataset.matchId = match.id;
      homeInput.dataset.side = '0';
      homeInput.dataset.setIndex = String(idx);
      var sep = document.createElement('span');
      sep.textContent = '-';
      sep.style.color = 'var(--muted)';
      var awayInput = document.createElement('input');
      awayInput.type = 'number';
      awayInput.min = '0';
      awayInput.placeholder = '4';
      awayInput.value = set.away !== null ? set.away : '';
      awayInput.dataset.matchId = match.id;
      awayInput.dataset.side = '1';
      awayInput.dataset.setIndex = String(idx);
      homeInput.addEventListener('input', function(evt) { updateSetScore(league, match.id, idx, evt.target.dataset.side, evt.target.value); });
      awayInput.addEventListener('input', function(evt) { updateSetScore(league, match.id, idx, evt.target.dataset.side, evt.target.value); });
      row.appendChild(homeInput);
      row.appendChild(sep);
      row.appendChild(awayInput);
      card.appendChild(label);
      card.appendChild(row);
      wrap.appendChild(card);
    });
    return wrap;
  }

  function handleCloseLeague() {
    var league = getActiveLeague(currentActiveId);
    if (!league) return;
    if (!confirm('Clôturer la ligue "' + league.name + '" ?')) return;
    league.finishedAt = new Date().toISOString();
    ligueState.activeLeagues = ligueState.activeLeagues.filter(function(l) { return l.id !== league.id; });
    ligueState.finishedLeagues.push(league);
    currentActiveId = null;
    saveState();
    renderHistory();
    renderActiveList();
    renderActiveDetail(null);
    showLigueRoot();
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
    renderManageCalendar(league);
    renderManageStandings(league);
    renderManageResults(league);
    renderManageTeams(league);
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
      var title = document.createElement('div');
      title.className = 'ligue-inline';
      title.style.justifyContent = 'space-between';
      title.innerHTML = '<span>📅 Journée ' + m.round + '</span><span class="small-muted">' + (m.date || 'Date à définir') + '</span>';
      var vs = document.createElement('div');
      vs.className = 'ligue-inline';
      vs.style.justifyContent = 'space-between';
      vs.innerHTML = '<span>🎾 ' + teamName(league, m.home) + '</span><span style="color:var(--muted);">vs</span><span>' + teamName(league, m.away) + '</span>';
      var helper = document.createElement('div');
      helper.className = 'small-muted';
      helper.textContent = 'Score équipe A - Score équipe B (2 sets gagnants)';
      var scores = createSetInputs(league, m);
      var summary = document.createElement('div');
      summary.className = 'ligue-inline';
      summary.style.justifyContent = 'space-between';
      summary.style.marginTop = '6px';
      summary.innerHTML = '<span style="color:var(--muted);">Résultat</span><span>' + formatSets(m) + '</span>';
      card.appendChild(title);
      card.appendChild(vs);
      card.appendChild(helper);
      card.appendChild(scores);
      card.appendChild(summary);
      refs.manageCalendar.appendChild(card);
    });
  }

  function renderManageResults(league) {
    if (!refs.manageResults) return;
    refs.manageResults.innerHTML = '';
    var played = league.matches.filter(function(m) { return m.played && m.scores[0] !== null && m.scores[1] !== null; });
    if (!played.length) {
      refs.manageResults.innerHTML = '<div class="empty">Aucun résultat saisi pour l’instant.</div>';
      return;
    }
    played.forEach(function(m) {
      var outcome = computeMatchOutcome(m);
      var home = { id: m.home, name: teamName(league, m.home), setWins: outcome.setWins[0] };
      var away = { id: m.away, name: teamName(league, m.away), setWins: outcome.setWins[1] };
      var winner = home.setWins === away.setWins ? null : (home.setWins > away.setWins ? home : away);
      var card = document.createElement('div');
      card.className = 'ligue-match-card';
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
      scoreEl.textContent = formatSets(m);
      var awayEl = document.createElement('div');
      awayEl.className = 'ligue-result-team';
      awayEl.textContent = away.name;
      // Mise en avant du vainqueur avec la teinte de la ligue.
      if (winner) {
        if (winner.id === home.id) homeEl.classList.add('ligue-result-winner');
        if (winner.id === away.id) awayEl.classList.add('ligue-result-winner');
      }
      body.appendChild(homeEl);
      body.appendChild(scoreEl);
      body.appendChild(awayEl);
      card.appendChild(head);
      card.appendChild(body);
      refs.manageResults.appendChild(card);
    });
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
      var edit = document.createElement('div');
      edit.className = 'ligue-badge-accent';
      edit.textContent = '✏️ Modifier l\'équipe';
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
      var score = document.createElement('div');
      score.className = 'ligue-result-score';
      var formatted = formatSets(m);
      score.textContent = formatted;
      if (formatted === 'À jouer') score.style.color = 'var(--muted)';
      body.appendChild(vs);
      body.appendChild(score);
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
    var played = league.matches.filter(function(m) { return m.played; });
    if (!played.length) {
      refs.playerManageResults.innerHTML = '<div class="empty">Aucun match joué pour le moment.</div>';
      return;
    }
    played.forEach(function(m) {
      var home = teamById(league, m.home) || { id: m.home, name: m.home };
      var away = teamById(league, m.away) || { id: m.away, name: m.away };
      var sets = m.sets || [];
      var homeWins = sets.filter(function(s) { return s && s.home !== null && s.away !== null && s.home > s.away; }).length;
      var awayWins = sets.filter(function(s) { return s && s.home !== null && s.away !== null && s.away > s.home; }).length;
      var winner = homeWins > awayWins ? home : (awayWins > homeWins ? away : null);
      var card = document.createElement('div');
      card.className = 'ligue-match-card';
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
      scoreEl.textContent = formatSets(m);
      var awayEl = document.createElement('div');
      awayEl.className = 'ligue-result-team';
      awayEl.textContent = away.name;
      if (winner) {
        if (winner.id === home.id) homeEl.classList.add('ligue-result-winner');
        if (winner.id === away.id) awayEl.classList.add('ligue-result-winner');
      }
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


  window.hideLigueSections = hideLigueSections;
  window.showLigueRoot = showLigueRoot;
  window.showLigueConfig = showLigueConfig;
  window.showLigueActive = showLigueActive;
  window.showLigueManage = showLigueManage;
  window.showLiguePlayerView = showLiguePlayerView;
  window.showLiguePlayerManage = showLiguePlayerManage;
})();
