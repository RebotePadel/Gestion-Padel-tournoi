(function() {
  'use strict';

  var root = document.getElementById('americano-root');
  if (!root) return;

  var tvRoot = document.getElementById('americano-tv-root');
  var STORAGE_KEY = 'padel_americano_state_v1';
  var MAX_COURTS = 4;
  var timerInterval = null;

  var refs = {
    name: root.querySelector('#americano-name'),
    teamCount: root.querySelector('#americano-team-count'),
    games: root.querySelector('#americano-games'),
    teamHint: root.querySelector('#americano-team-hint'),
    teamsList: root.querySelector('#americano-teams-list'),
    meta: root.querySelector('#americano-meta'),
    roundMeta: root.querySelector('#americano-round-meta'),
    rounds: root.querySelector('#americano-rounds'),
    standings: root.querySelector('#americano-standings'),
    status: root.querySelector('#americano-status'),
    timerMinutes: root.querySelector('#americano-timer-minutes'),
    timerDisplay: root.querySelector('#americano-timer-display'),
    timerStatus: root.querySelector('#americano-timer-status')
  };

  var tvRefs = tvRoot ? {
    name: tvRoot.querySelector('#americano-tv-name'),
    meta: tvRoot.querySelector('#americano-tv-meta'),
    round: tvRoot.querySelector('#americano-tv-round'),
    current: tvRoot.querySelector('#americano-tv-current'),
    next: tvRoot.querySelector('#americano-tv-next'),
    standings: tvRoot.querySelector('#americano-tv-standings'),
    timer: tvRoot.querySelector('#americano-tv-timer'),
    logo: tvRoot.querySelector('#americano-tv-logo'),
    banner: tvRoot.querySelector('#americano-tv-sponsor-banner'),
    bannerLogo: tvRoot.querySelector('#americano-tv-sponsor-logo'),
    bannerName: tvRoot.querySelector('#americano-tv-sponsor-name')
  } : {};

  function defaultState() {
    return {
      name: 'Américano',
      gamesTo: 6,
      teamCount: 8,
      teams: [],
      matches: [],
      rounds: [],
      currentRound: 1,
      timer: { duration: 720, remaining: 720, running: false, lastTick: null }
    };
  }

  function loadState() {
    var base = defaultState();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        base = Object.assign(base, parsed || {});
      }
    } catch (e) { /* ignore */ }
    ensureTeams(base.teamCount, base);
    if (!base.timer) base.timer = { duration: 720, remaining: 720, running: false, lastTick: null };
    return base;
  }

  var state = loadState();

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* noop */ }
  }

  function ensureTeams(count, target) {
    var obj = target || state;
    obj.teamCount = Math.max(8, Math.min(24, count || obj.teamCount));
    if (!obj.teams) obj.teams = [];
    while (obj.teams.length < obj.teamCount) {
      var idx = obj.teams.length + 1;
      obj.teams.push({ id: 'A' + idx, name: 'Équipe ' + idx, players: ['Joueur 1', 'Joueur 2'] });
    }
    if (obj.teams.length > obj.teamCount) obj.teams.length = obj.teamCount;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function teamName(id) {
    var t = state.teams.find(function(x) { return x.id === id; });
    return t ? t.name : id;
  }

  function renderTeamsList() {
    ensureTeams(state.teamCount);
    if (!refs.teamsList) return;
    refs.teamsList.innerHTML = '';
    var header = document.createElement('div');
    header.className = 'americano-team-row';
    var h1 = document.createElement('div'); h1.className = 'americano-team-cell'; h1.textContent = 'Équipe';
    var h2 = document.createElement('div'); h2.className = 'americano-team-cell'; h2.textContent = 'Joueur 1';
    var h3 = document.createElement('div'); h3.className = 'americano-team-cell'; h3.textContent = 'Joueur 2';
    header.appendChild(h1); header.appendChild(h2); header.appendChild(h3);
    refs.teamsList.appendChild(header);
    state.teams.forEach(function(team, idx) {
      var row = document.createElement('div');
      row.className = 'americano-team-row';

      var colTeam = document.createElement('div');
      colTeam.className = 'americano-team-cell';
      var label = document.createElement('label');
      label.textContent = 'Équipe ' + (idx + 1);
      var input = document.createElement('input');
      input.type = 'text';
      input.value = team.name || '';
      input.setAttribute('data-team-name', team.id);
      input.placeholder = 'Nom de l’équipe';
      colTeam.appendChild(label);
      colTeam.appendChild(input);

      var colP1 = document.createElement('div');
      colP1.className = 'americano-team-cell';
      var p1 = document.createElement('input');
      p1.type = 'text';
      p1.value = (team.players && team.players[0]) || '';
      p1.placeholder = 'Joueur 1';
      p1.setAttribute('data-team-player-a', team.id);
      colP1.appendChild(p1);

      var colP2 = document.createElement('div');
      colP2.className = 'americano-team-cell';
      var p2 = document.createElement('input');
      p2.type = 'text';
      p2.value = (team.players && team.players[1]) || '';
      p2.placeholder = 'Joueur 2';
      p2.setAttribute('data-team-player-b', team.id);
      colP2.appendChild(p2);

      row.appendChild(colTeam);
      row.appendChild(colP1);
      row.appendChild(colP2);
      refs.teamsList.appendChild(row);
    });
  }

  function collectTeamsFromForm() {
    if (!refs.teamsList) return;
    var nameInputs = refs.teamsList.querySelectorAll('[data-team-name]');
    nameInputs.forEach(function(inp) {
      var id = inp.getAttribute('data-team-name');
      var team = state.teams.find(function(t) { return t.id === id; });
      if (team) {
        team.name = inp.value.trim() || team.name;
      }
    });
    var p1Inputs = refs.teamsList.querySelectorAll('[data-team-player-a]');
    p1Inputs.forEach(function(inp) {
      var id = inp.getAttribute('data-team-player-a');
      var team = state.teams.find(function(t) { return t.id === id; });
      if (team) {
        if (!team.players) team.players = [];
        team.players[0] = inp.value.trim();
      }
    });
    var p2Inputs = refs.teamsList.querySelectorAll('[data-team-player-b]');
    p2Inputs.forEach(function(inp) {
      var id = inp.getAttribute('data-team-player-b');
      var team = state.teams.find(function(t) { return t.id === id; });
      if (team) {
        if (!team.players) team.players = [];
        team.players[1] = inp.value.trim();
      }
    });
  }

  function generateRandomNames() {
    var bank = ['Padel King', 'Blue Smash', 'Padel Crew', 'Les Volées', 'Backhand Bros', 'Padel Stars', 'Service Gagnant', 'Volley Flash', 'Padel Rise', 'Golden Point', 'Full Ace', 'Slice & Win', 'Padel City', 'Team Drive', 'Lift Squad', 'Padel Shock'];
    var pool = shuffle(bank).slice(0, state.teamCount);
    state.teams.forEach(function(t, idx) { t.name = pool[idx] || t.name; });
    renderTeamsList();
    saveState();
  }

  function generateRandomTeams() {
    collectTeamsFromForm();
    var pool = [];
    state.teams.forEach(function(team) {
      if (team.players && team.players.length) {
        team.players.forEach(function(p) { if (p) pool.push(p.trim()); });
      }
    });
    var needed = state.teamCount * 2;
    var bank = ['Alex', 'Sam', 'Leo', 'Noa', 'Eli', 'Mila', 'Liam', 'Zoe', 'Nico', 'Maya', 'Rafa', 'Toma', 'Gabi', 'Luca', 'Nina', 'Sacha', 'Jo', 'Malo', 'Elio', 'Sofia', 'Ivy', 'Noah', 'Alma', 'Mira'];
    var idx = 0;
    while (pool.length < needed) {
      pool.push(bank[idx % bank.length] + ' ' + (Math.floor(idx / bank.length) + 1));
      idx += 1;
    }
    pool = shuffle(pool).slice(0, needed);
    ensureTeams(state.teamCount);
    for (var i = 0; i < state.teamCount; i++) {
      var team = state.teams[i];
      team.name = team.name || ('Équipe ' + (i + 1));
      team.players = [pool[i * 2] || ('J' + (i * 2 + 1)), pool[i * 2 + 1] || ('J' + (i * 2 + 2))];
    }
    renderTeamsList();
    saveState();
    if (refs.teamHint) refs.teamHint.textContent = 'Équipes générées aléatoirement.';
  }

  function buildMatches() {
    collectTeamsFromForm();
    var teams = state.teams.slice();
    var matches = [];
    var id = 1;
    for (var i = 0; i < teams.length; i++) {
      for (var j = i + 1; j < teams.length; j++) {
        matches.push({ id: 'm' + id++, teamA: teams[i].id, teamB: teams[j].id, round: null, court: null, scoreA: null, scoreB: null, status: 'pending' });
      }
    }

    var meta = {};
    teams.forEach(function(t) { meta[t.id] = { lastRound: -5, streak: 0, played: 0 }; });
    var rounds = [];
    var pending = matches.slice();
    var roundIndex = 1;

    while (pending.length) {
      var used = {};
      var chosen = [];
      pending.sort(function(a, b) {
        var la = meta[a.teamA].played + meta[a.teamB].played;
        var lb = meta[b.teamA].played + meta[b.teamB].played;
        return la - lb;
      });

      for (var k = 0; k < pending.length; k++) {
        if (chosen.length >= MAX_COURTS) break;
        var cand = pending[k];
        if (used[cand.teamA] || used[cand.teamB]) continue;
        var blockA = (roundIndex - meta[cand.teamA].lastRound === 1 && meta[cand.teamA].streak >= 2);
        var blockB = (roundIndex - meta[cand.teamB].lastRound === 1 && meta[cand.teamB].streak >= 2);
        if (blockA || blockB) continue;
        chosen.push(cand);
        used[cand.teamA] = true;
        used[cand.teamB] = true;
      }

      if (!chosen.length) {
        roundIndex += 1;
        if (roundIndex > 200) break;
        continue;
      }

      chosen.forEach(function(m, idx) {
        m.round = roundIndex;
        m.court = idx + 1;
        meta[m.teamA].played += 1;
        meta[m.teamB].played += 1;
        meta[m.teamA].streak = (roundIndex - meta[m.teamA].lastRound === 1) ? meta[m.teamA].streak + 1 : 1;
        meta[m.teamB].streak = (roundIndex - meta[m.teamB].lastRound === 1) ? meta[m.teamB].streak + 1 : 1;
        meta[m.teamA].lastRound = roundIndex;
        meta[m.teamB].lastRound = roundIndex;
      });

      rounds.push({ round: roundIndex, matches: chosen.map(function(m) { return m.id; }) });
      pending = pending.filter(function(m) { return chosen.indexOf(m) === -1; });
      roundIndex += 1;
    }

    state.matches = matches;
    state.rounds = rounds;
    state.currentRound = 1;
    updateMetaChips();
    saveState();
  }

  function updateMetaChips() {
    if (refs.meta) refs.meta.textContent = state.teamCount + ' équipes • ' + state.matches.length + ' matchs';
    if (refs.roundMeta) refs.roundMeta.textContent = state.rounds.length ? (state.rounds.length + ' roulements') : 'Planning non généré';
  }

  function formatScore(match) {
    if (match.scoreA === null || match.scoreB === null) return '—';
    return match.scoreA + ' – ' + match.scoreB;
  }

  function applyScore(matchId, scoreA, scoreB) {
    var match = state.matches.find(function(m) { return m.id === matchId; });
    if (!match) return;
    var max = state.gamesTo || 6;
    if (isNaN(scoreA) || isNaN(scoreB)) return;
    if (scoreA === scoreB) return;
    if (scoreA !== max && scoreB !== max) return;
    if (scoreA < 0 || scoreB < 0) return;
    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.status = 'done';
    updateStandings();
    saveState();
    renderAll();
  }

  function generateRandomScores() {
    var max = state.gamesTo || 6;
    state.matches.forEach(function(m) {
      if (m.status === 'done') return;
      var win = Math.random() < 0.5;
      var a = win ? max : Math.floor(Math.random() * max);
      var b = win ? Math.floor(Math.random() * max) : max;
      if (a === b) b = Math.max(0, max - 1);
      m.scoreA = a;
      m.scoreB = b;
      m.status = 'done';
    });
    updateStandings();
    saveState();
    renderAll();
    if (refs.status) refs.status.textContent = 'Scores générés';
  }

  function updateStandings() {
    var map = {};
    state.teams.forEach(function(t) {
      map[t.id] = { id: t.id, name: t.name, played: 0, wins: 0, losses: 0, gf: 0, ga: 0, diff: 0 };
    });

    state.matches.forEach(function(m) {
      if (m.scoreA === null || m.scoreB === null) return;
      var home = map[m.teamA];
      var away = map[m.teamB];
      if (!home || !away) return;
      home.played += 1; away.played += 1;
      home.gf += m.scoreA; home.ga += m.scoreB;
      away.gf += m.scoreB; away.ga += m.scoreA;
      if (m.scoreA > m.scoreB) { home.wins += 1; away.losses += 1; }
      else { away.wins += 1; home.losses += 1; }
    });

    state.teams.forEach(function(t) {
      var line = map[t.id];
      line.diff = line.gf - line.ga;
    });

    var standings = Object.keys(map).map(function(k) { return map[k]; });

    standings.sort(function(a, b) {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.diff !== a.diff) return b.diff - a.diff;
      var head = headToHead(a.id, b.id);
      if (head !== 0) return head;
      return b.gf - a.gf;
    });

    state.standings = standings;
  }

  function headToHead(idA, idB) {
    var match = state.matches.find(function(m) {
      return (m.teamA === idA && m.teamB === idB) || (m.teamA === idB && m.teamB === idA);
    });
    if (!match || match.scoreA === null || match.scoreB === null) return 0;
    if (match.teamA === idA) return match.scoreA > match.scoreB ? -1 : 1;
    return match.scoreB > match.scoreA ? -1 : 1;
  }

  function renderStandings() {
    updateStandings();
    if (!refs.standings) return;
    refs.standings.innerHTML = '';
    if (!state.standings.length) {
      refs.standings.innerHTML = '<tr><td class="small-muted">Aucune donnée pour le moment.</td></tr>';
      return;
    }
    var head = document.createElement('tr');
    ['Rang','Équipe','J','V','D','Jeux +','Jeux -','GA'].forEach(function(lbl) {
      var th = document.createElement('th'); th.textContent = lbl; head.appendChild(th);
    });
    refs.standings.appendChild(head);
    state.standings.forEach(function(line, idx) {
      var tr = document.createElement('tr');
      [idx+1, line.name, line.played, line.wins, line.losses, line.gf, line.ga, line.diff].forEach(function(val) {
        var td = document.createElement('td'); td.textContent = val; tr.appendChild(td);
      });
      refs.standings.appendChild(tr);
    });
  }

  function fitText(ctx, text, maxWidth, baseSize, minSize) {
    var size = baseSize;
    while (size > minSize) {
      ctx.font = size + 'px sans-serif';
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    return size;
  }

  function renderRounds() {
    if (!refs.rounds) return;
    refs.rounds.innerHTML = '';
    if (!state.rounds.length) {
      refs.rounds.innerHTML = '<div class="empty">Génère le planning pour voir les roulements.</div>';
      return;
    }
    state.rounds.forEach(function(r) {
      var card = document.createElement('div');
      card.className = 'americano-round-card';
      var title = document.createElement('div');
      title.className = 'americano-inline';
      title.innerHTML = '<strong>Roulement ' + r.round + '</strong><span class="small-muted">' + r.matches.length + ' match(s)</span>';
      card.appendChild(title);

      r.matches.forEach(function(id) {
        var m = state.matches.find(function(x) { return x.id === id; });
        if (!m) return;
        var row = document.createElement('div');
        row.className = 'americano-match-row';
        row.setAttribute('data-match-id', m.id);

        var teamA = document.createElement('div');
        teamA.className = 'americano-team left';
        teamA.textContent = teamName(m.teamA);
        var vs = document.createElement('div');
        vs.className = 'americano-vs';
        vs.textContent = 'vs';
        var teamB = document.createElement('div');
        teamB.className = 'americano-team right';
        teamB.textContent = teamName(m.teamB);

        var scoreWrap = document.createElement('div');
        scoreWrap.className = 'americano-score-row';
        var left = document.createElement('div'); left.style.flex = '1'; left.style.textAlign = 'left'; left.textContent = 'Terrain ' + m.court;

        var inputs = document.createElement('div');
        inputs.className = 'americano-score-inputs';
        var inA = document.createElement('input'); inA.type = 'number'; inA.min = 0; inA.value = m.scoreA !== null ? m.scoreA : '';
        inA.setAttribute('data-score-a', m.id);
        var inB = document.createElement('input'); inB.type = 'number'; inB.min = 0; inB.value = m.scoreB !== null ? m.scoreB : '';
        inB.setAttribute('data-score-b', m.id);
        var btn = document.createElement('button'); btn.className = 'btn btn-secondary btn-small'; btn.textContent = 'Valider';
        btn.setAttribute('data-validate', m.id);
        inputs.appendChild(inA); inputs.appendChild(document.createTextNode('–')); inputs.appendChild(inB); inputs.appendChild(btn);

        var scoreLabel = document.createElement('div');
        scoreLabel.style.minWidth = '90px';
        scoreLabel.style.textAlign = 'right';
        scoreLabel.textContent = formatScore(m);

        scoreWrap.appendChild(left);
        scoreWrap.appendChild(inputs);
        scoreWrap.appendChild(scoreLabel);

        row.appendChild(teamA);
        row.appendChild(vs);
        row.appendChild(teamB);
        row.appendChild(scoreWrap);
        card.appendChild(row);
      });

      refs.rounds.appendChild(card);
    });
  }

  function renderTvList(target, matches, isCurrent) {
    if (!target) return;
    target.innerHTML = '';
    if (!matches.length) {
      target.innerHTML = '<div class="tv-empty">Aucun match.</div>';
      return;
    }
    matches.forEach(function(m) {
      var card = document.createElement('div');
      card.className = 'tv-match-card' + (isCurrent ? '' : ' tv-match-card-next');
      var top = document.createElement('div'); top.className = 'tv-match-top'; top.textContent = 'Terrain ' + m.court;
      var teams = document.createElement('div'); teams.className = 'tv-match-teams';
      var lineA = document.createElement('div'); lineA.className = 'tv-match-team-line';
      var aName = document.createElement('div'); aName.className = 'tv-team-name'; aName.textContent = teamName(m.teamA);
      var aScore = document.createElement('div'); aScore.className = 'tv-score'; aScore.textContent = m.scoreA === null ? '–' : m.scoreA;
      lineA.appendChild(aName); lineA.appendChild(aScore);
      var lineB = document.createElement('div'); lineB.className = 'tv-match-team-line';
      var bName = document.createElement('div'); bName.className = 'tv-team-name'; bName.textContent = teamName(m.teamB);
      var bScore = document.createElement('div'); bScore.className = 'tv-score'; bScore.textContent = m.scoreB === null ? '–' : m.scoreB;
      lineB.appendChild(bName); lineB.appendChild(bScore);
      teams.appendChild(lineA); teams.appendChild(lineB);
      card.appendChild(top); card.appendChild(teams);
      target.appendChild(card);
    });
  }

  function renderTvStandings() {
    if (!tvRefs.standings) return;
    tvRefs.standings.innerHTML = '';
    if (!state.standings.length) {
      tvRefs.standings.innerHTML = '<div class="tv-empty">Classement en attente.</div>';
      return;
    }
    state.standings.forEach(function(line, idx) {
      var row = document.createElement('div');
      row.className = 'tv-ranking-row';
      row.innerHTML = '<span>#' + (idx + 1) + '</span><span>' + line.name + '</span><span>' + line.wins + 'V / ' + line.losses + 'D</span><span>GA ' + line.diff + '</span>';
      tvRefs.standings.appendChild(row);
    });
  }

  function renderTv() {
    if (tvRefs.name) tvRefs.name.textContent = state.name || 'Américano';
    if (tvRefs.meta) tvRefs.meta.textContent = state.teamCount + ' équipes • ' + (state.rounds.length || 0) + ' roulements';
    if (tvRefs.round) tvRefs.round.textContent = state.currentRound || 1;
    if (tvRefs.timer) tvRefs.timer.textContent = formatTimer();

    var current = state.rounds.find(function(r) {
      return r.matches.some(function(id) { var m = state.matches.find(function(x) { return x.id === id; }); return m && m.status !== 'done'; });
    }) || state.rounds[0];
    var currentRoundNumber = current ? current.round : (state.rounds[0] ? state.rounds[0].round : 1);
    state.currentRound = currentRoundNumber;
    if (tvRefs.round) tvRefs.round.textContent = currentRoundNumber;
    var nextIdx = current ? state.rounds.indexOf(current) + 1 : -1;
    var next = nextIdx >= 0 ? state.rounds[nextIdx] : null;

    var currentMatches = current ? current.matches.map(function(id) { return state.matches.find(function(x) { return x.id === id; }); }).filter(Boolean) : [];
    var nextMatches = next ? next.matches.map(function(id) { return state.matches.find(function(x) { return x.id === id; }); }).filter(Boolean) : [];
    renderTvList(tvRefs.current, currentMatches, true);
    renderTvList(tvRefs.next, nextMatches, false);
    renderTvStandings();
    applySponsorToTv();
    applyLogoToTv();
  }

  function applyLogoToTv() {
    if (!tvRefs.logo) return;
    try {
      var profile = JSON.parse(localStorage.getItem('padel_theme_profile_v1') || '{}');
      if (profile && profile.logoDataUrl) {
        tvRefs.logo.src = profile.logoDataUrl;
        tvRefs.logo.style.display = 'block';
      }
    } catch (e) { /* noop */ }
  }

  function getActiveSponsor(profile) {
    if (!profile || !profile.sponsors) return null;
    var active = profile.sponsors.find(function(s) { return s.id === profile.activeSponsorId && s.enabledTv !== false; });
    if (!active) active = profile.sponsors.find(function(s) { return s.enabledTv !== false; }) || null;
    return active;
  }

  function applySponsorToTv() {
    if (!tvRefs.banner) return;
    try {
      var profile = JSON.parse(localStorage.getItem('padel_theme_profile_v1') || '{}');
      var active = getActiveSponsor(profile);
      var enabled = profile ? profile.tvSponsorAmericano !== false : true;
      if (!enabled || !active || (!active.logoDataUrl && !active.name)) {
        tvRefs.banner.style.display = 'none';
        return;
      }
      tvRefs.banner.style.display = 'inline-flex';
      if (tvRefs.bannerLogo) {
        if (active.logoDataUrl) {
          tvRefs.bannerLogo.src = active.logoDataUrl;
          tvRefs.bannerLogo.style.display = 'block';
        } else {
          tvRefs.bannerLogo.removeAttribute('src');
          tvRefs.bannerLogo.style.display = 'none';
        }
      }
      if (tvRefs.bannerName) tvRefs.bannerName.textContent = active.name || '';
    } catch (e) { tvRefs.banner.style.display = 'none'; }
  }

  function updateTimerFromState() {
    if (refs.timerDisplay) refs.timerDisplay.textContent = formatTimer();
    if (refs.timerStatus) refs.timerStatus.textContent = state.timer.running ? 'Timer en cours' : 'Timer en pause';
    if (tvRefs.timer) tvRefs.timer.textContent = formatTimer();
  }

  function formatTimer() {
    var sec = Math.max(0, Math.floor(state.timer.remaining || 0));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
  }

  function tickTimer() {
    if (!state.timer.running) return;
    var now = Date.now();
    if (!state.timer.lastTick) state.timer.lastTick = now;
    var delta = Math.floor((now - state.timer.lastTick) / 1000);
    if (delta <= 0) return;
    state.timer.lastTick = now;
    state.timer.remaining = Math.max(0, state.timer.remaining - delta);
    if (state.timer.remaining === 0) state.timer.running = false;
    updateTimerFromState();
    saveState();
  }

  function startTimer() {
    var base = parseInt(refs.timerMinutes && refs.timerMinutes.value, 10);
    if (base && !state.timer.running && state.timer.remaining === 0) {
      state.timer.remaining = base * 60;
      state.timer.duration = base * 60;
    } else if (base && !state.timer.running && state.timer.remaining === state.timer.duration) {
      state.timer.duration = base * 60;
      state.timer.remaining = base * 60;
    }
    state.timer.running = true;
    state.timer.lastTick = Date.now();
    if (!timerInterval) timerInterval = setInterval(tickTimer, 1000);
    updateTimerFromState();
    saveState();
  }

  function pauseTimer() {
    state.timer.running = false;
    state.timer.lastTick = null;
    updateTimerFromState();
    saveState();
  }

  function resetTimer() {
    var base = parseInt(refs.timerMinutes && refs.timerMinutes.value, 10) || 12;
    state.timer.duration = base * 60;
    state.timer.remaining = state.timer.duration;
    state.timer.running = false;
    state.timer.lastTick = null;
    updateTimerFromState();
    saveState();
  }

  function renderAll() {
    updateMetaChips();
    renderTeamsList();
    renderRounds();
    renderStandings();
    updateTimerFromState();
    renderTv();
    if (refs.name) refs.name.value = state.name || '';
    if (refs.games) refs.games.value = String(state.gamesTo || 6);
    if (refs.teamCount && refs.teamCount.value !== String(state.teamCount)) refs.teamCount.value = state.teamCount;
    if (refs.status) refs.status.textContent = state.rounds.length ? 'Planning généré' : 'Planning à générer';
  }

  function setTeamCountOptions() {
    if (!refs.teamCount) return;
    if (!refs.teamCount.options.length) {
      for (var n = 8; n <= 24; n += 2) {
        var opt = document.createElement('option');
        opt.value = n; opt.textContent = n;
        refs.teamCount.appendChild(opt);
      }
    }
    refs.teamCount.value = state.teamCount;
  }

  function setName(val) { state.name = val || 'Américano'; saveState(); renderTv(); }

  // UI ONLY : collapse/expand des blocs Américano
  function toggleAmericanoCard(targetId, btn) {
    var body = document.getElementById(targetId);
    if (!body) return;
    var hidden = body.style.display === 'none';
    body.style.display = hidden ? 'flex' : 'none';
    if (btn) btn.textContent = hidden ? '−' : '+';
  }

  function bindAmericanoCollapse() {
    var buttons = root ? root.querySelectorAll('.americano-collapse') : [];
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var targetId = btn.getAttribute('data-target');
        toggleAmericanoCard(targetId, btn);
      });
    });
  }

  function handleScoreClick(e) {
    var target = e.target;
    var matchId = target.getAttribute('data-validate');
    if (!matchId) return;
    var inputA = root.querySelector('[data-score-a="' + matchId + '"]');
    var inputB = root.querySelector('[data-score-b="' + matchId + '"]');
    var a = parseInt(inputA && inputA.value, 10);
    var b = parseInt(inputB && inputB.value, 10);
    applyScore(matchId, a, b);
  }

  function bindEvents() {
    if (refs.teamCount) refs.teamCount.addEventListener('change', function() {
      var val = parseInt(this.value, 10) || 8;
      ensureTeams(val);
      renderTeamsList();
      saveState();
    });

    if (refs.games) refs.games.addEventListener('change', function() {
      state.gamesTo = parseInt(this.value, 10) || 6;
      saveState();
    });

    if (refs.name) refs.name.addEventListener('input', function() { setName(this.value); });
    if (refs.teamsList) refs.teamsList.addEventListener('input', function() {
      collectTeamsFromForm();
      saveState();
    });
    var btnGenerate = document.getElementById('btn-americano-generate');
    if (btnGenerate) btnGenerate.addEventListener('click', function() { buildMatches(); renderAll(); });

    var btnReset = document.getElementById('btn-americano-reset');
    if (btnReset) btnReset.addEventListener('click', function() { state = defaultState(); saveState(); renderAll(); });

    var btnRandTeams = document.getElementById('btn-americano-random-teams');
    if (btnRandTeams) btnRandTeams.addEventListener('click', generateRandomTeams);

    var btnRandNames = document.getElementById('btn-americano-random-names');
    if (btnRandNames) btnRandNames.addEventListener('click', generateRandomNames);

    var btnRandScores = document.getElementById('btn-americano-random-scores');
    if (btnRandScores) btnRandScores.addEventListener('click', generateRandomScores);

    if (refs.rounds) refs.rounds.addEventListener('click', handleScoreClick);

    var start = document.getElementById('btn-americano-timer-start');
    var pause = document.getElementById('btn-americano-timer-pause');
    var reset = document.getElementById('btn-americano-timer-reset');
    if (start) start.addEventListener('click', startTimer);
    if (pause) pause.addEventListener('click', pauseTimer);
    if (reset) reset.addEventListener('click', resetTimer);
  }

  function init() {
    setTeamCountOptions();
    renderTeamsList();
    renderAll();
    bindEvents();
    bindAmericanoCollapse();
    if (window.showAmericano && typeof window.showAmericano === 'function' && root && root.style.display !== 'none') {
      window.showAmericano();
    }
    if (state.timer.running) state.timer.lastTick = Date.now();
    if (!timerInterval) timerInterval = setInterval(tickTimer, 1000);
  }

  window.AMERICANO = {
    render: renderAll,
    renderTv: renderTv,
    init: init
  };

  init();
})();
