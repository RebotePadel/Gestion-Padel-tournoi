(function() {
  'use strict';

  var root = document.getElementById('solonight-root');
  if (!root) return;

  var tvRoot = document.getElementById('solonight-tv-root');
  var STORAGE_KEY = 'padel_solonight_state_v1';
  var MAX_COURTS = 4;
  var PLAYERS_PER_COURT = 4;
  var MAX_PLAYERS_PER_ROTATION = MAX_COURTS * PLAYERS_PER_COURT; // 16

  // Références DOM admin
  var refs = {
    name: root.querySelector('#solonight-name'),
    playerCount: root.querySelector('#solonight-player-count'),
    playersList: root.querySelector('#solonight-players-list'),
    rotationCount: root.querySelector('#solonight-rotation-count'),
    btnGenerate: root.querySelector('#solonight-btn-generate'),
    btnRegenerate: root.querySelector('#solonight-btn-regenerate'),
    planning: root.querySelector('#solonight-planning'),
    standings: root.querySelector('#solonight-standings'),
    status: root.querySelector('#solonight-status')
  };

  // Références DOM TV
  var tvRefs = tvRoot ? {
    logo: tvRoot.querySelector('#solonight-tv-logo'),
    name: tvRoot.querySelector('#solonight-tv-name'),
    meta: tvRoot.querySelector('#solonight-tv-meta'),
    current: tvRoot.querySelector('#solonight-tv-current'),
    standings: tvRoot.querySelector('#solonight-tv-standings'),
    sponsorBanner: tvRoot.querySelector('#solonight-tv-sponsor-banner'),
    sponsorLogo: tvRoot.querySelector('#solonight-tv-sponsor-logo'),
    sponsorName: tvRoot.querySelector('#solonight-tv-sponsor-name')
  } : {};

  // État par défaut
  function defaultState() {
    return {
      name: 'Solo Night',
      playerCount: 16,
      players: [],
      rotationCount: 8,
      rotations: [],
      results: {}, // matchId -> { winner: 'A' | 'B' }
      currentRotation: 0
    };
  }

  // Charger l'état
  function loadState() {
    var base = defaultState();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        base = Object.assign(base, parsed || {});
      }
    } catch (e) { /* ignore */ }
    ensurePlayers(base.playerCount, base);
    return base;
  }

  var state = loadState();

  // Sauvegarder l'état
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* noop */ }
  }

  // S'assurer qu'on a le bon nombre de joueurs
  function ensurePlayers(count, target) {
    var obj = target || state;
    obj.playerCount = Math.max(8, Math.min(24, count || obj.playerCount));
    if (!obj.players) obj.players = [];
    while (obj.players.length < obj.playerCount) {
      var idx = obj.players.length + 1;
      obj.players.push({
        id: 'P' + idx,
        name: 'Joueur ' + idx
      });
    }
    if (obj.players.length > obj.playerCount) {
      obj.players.length = obj.playerCount;
    }
  }

  // Utilitaires
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function playerName(id) {
    var p = state.players.find(function(x) { return x.id === id; });
    return p ? p.name : id;
  }

  function getDuoKey(p1, p2) {
    var ids = [p1, p2].sort();
    return ids[0] + '_' + ids[1];
  }

  // ========================================
  // ALGORITHME DE GÉNÉRATION SOUS CONTRAINTES
  // ========================================

  /**
   * Génère toutes les rotations avec contraintes :
   * 1) Partenaires uniques : deux joueurs ne peuvent être partenaires qu'une fois
   * 2) Duos adverses uniques par joueur : un joueur ne peut affronter le même duo adverse qu'une fois
   *
   * @returns {Array} Tableau des rotations ou null si impossible
   */
  function generateAllRotations() {
    var rotations = [];
    var playedWith = {}; // playerId -> Set(partnerId)
    var facedDuos = {}; // playerId -> Set(duoKey)

    // Initialiser les historiques
    state.players.forEach(function(p) {
      playedWith[p.id] = {};
      facedDuos[p.id] = {};
    });

    // Générer chaque rotation
    for (var r = 0; r < state.rotationCount; r++) {
      var rotation = generateOneRotation(playedWith, facedDuos, r + 1);

      if (!rotation) {
        // Impossible de générer cette rotation
        return null;
      }

      rotations.push(rotation);

      // Mettre à jour les historiques
      rotation.matches.forEach(function(match) {
        var teamA = match.teamA;
        var teamB = match.teamB;

        // Marquer les partenaires
        playedWith[teamA[0]][teamA[1]] = true;
        playedWith[teamA[1]][teamA[0]] = true;
        playedWith[teamB[0]][teamB[1]] = true;
        playedWith[teamB[1]][teamB[0]] = true;

        // Marquer les duos adverses
        var duoA = getDuoKey(teamA[0], teamA[1]);
        var duoB = getDuoKey(teamB[0], teamB[1]);

        // Chaque joueur de A a affronté le duo B
        facedDuos[teamA[0]][duoB] = true;
        facedDuos[teamA[1]][duoB] = true;

        // Chaque joueur de B a affronté le duo A
        facedDuos[teamB[0]][duoA] = true;
        facedDuos[teamB[1]][duoA] = true;
      });
    }

    return rotations;
  }

  /**
   * Génère une rotation (jusqu'à 4 matchs) sous contraintes
   * Utilise un algorithme de backtracking léger
   */
  function generateOneRotation(playedWith, facedDuos, rotationNumber) {
    var MAX_ATTEMPTS = 1000;
    var attempt = 0;

    while (attempt < MAX_ATTEMPTS) {
      attempt++;

      var availablePlayers = shuffle(state.players.map(function(p) { return p.id; }));
      var matches = [];
      var usedInRotation = {};

      // Essayer de créer jusqu'à 4 matchs
      for (var c = 0; c < MAX_COURTS; c++) {
        var match = findValidMatch(availablePlayers, usedInRotation, playedWith, facedDuos);

        if (!match) {
          // Impossible de créer un match valide
          break;
        }

        matches.push(match);

        // Marquer les joueurs comme utilisés dans cette rotation
        match.teamA.forEach(function(p) { usedInRotation[p] = true; });
        match.teamB.forEach(function(p) { usedInRotation[p] = true; });
      }

      // Vérifier qu'on a au moins créé quelques matchs
      // Pour les dernières rotations avec peu de combinaisons possibles,
      // on accepte au moins 2 matchs
      var minMatches = (rotationNumber <= state.rotationCount / 2) ? 3 : 2;

      if (matches.length >= minMatches) {
        // Rotation valide
        var pausedPlayers = state.players
          .map(function(p) { return p.id; })
          .filter(function(id) { return !usedInRotation[id]; });

        return {
          number: rotationNumber,
          matches: matches,
          paused: pausedPlayers
        };
      }
    }

    // Échec après MAX_ATTEMPTS tentatives
    return null;
  }

  /**
   * Trouve un match valide parmi les joueurs disponibles
   */
  function findValidMatch(availablePlayers, usedInRotation, playedWith, facedDuos) {
    var unused = availablePlayers.filter(function(id) { return !usedInRotation[id]; });

    if (unused.length < 4) return null;

    // Essayer différentes combinaisons
    for (var attempt = 0; attempt < 100; attempt++) {
      var selected = shuffle(unused).slice(0, 4);
      var p1 = selected[0], p2 = selected[1], p3 = selected[2], p4 = selected[3];

      // Tester différentes configurations de matchs
      var configs = [
        { teamA: [p1, p2], teamB: [p3, p4] },
        { teamA: [p1, p3], teamB: [p2, p4] },
        { teamA: [p1, p4], teamB: [p2, p3] }
      ];

      for (var i = 0; i < configs.length; i++) {
        var config = configs[i];
        if (isValidMatch(config.teamA, config.teamB, playedWith, facedDuos)) {
          return {
            id: 'M' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            court: 0, // Sera assigné plus tard
            teamA: config.teamA,
            teamB: config.teamB
          };
        }
      }
    }

    return null;
  }

  /**
   * Vérifie si un match est valide selon les contraintes
   */
  function isValidMatch(teamA, teamB, playedWith, facedDuos) {
    // Contrainte 1 : Les partenaires ne doivent pas avoir déjà joué ensemble
    if (playedWith[teamA[0]][teamA[1]] || playedWith[teamA[1]][teamA[0]]) return false;
    if (playedWith[teamB[0]][teamB[1]] || playedWith[teamB[1]][teamB[0]]) return false;

    // Contrainte 2 : Les joueurs ne doivent pas avoir déjà affronté ce duo adverse
    var duoA = getDuoKey(teamA[0], teamA[1]);
    var duoB = getDuoKey(teamB[0], teamB[1]);

    if (facedDuos[teamA[0]][duoB] || facedDuos[teamA[1]][duoB]) return false;
    if (facedDuos[teamB[0]][duoA] || facedDuos[teamB[1]][duoA]) return false;

    return true;
  }

  // Assigner les terrains aux matchs
  function assignCourts(rotations) {
    rotations.forEach(function(rotation) {
      rotation.matches.forEach(function(match, idx) {
        match.court = idx + 1;
      });
    });
  }

  // Valider le planning généré (fonction de test)
  function validatePlanningConstraints(rotations) {
    var errors = [];
    var allPartnerships = {};
    var allFacedDuos = {};

    state.players.forEach(function(p) {
      allPartnerships[p.id] = {};
      allFacedDuos[p.id] = {};
    });

    rotations.forEach(function(rotation, rIdx) {
      rotation.matches.forEach(function(match, mIdx) {
        var teamA = match.teamA;
        var teamB = match.teamB;

        // Vérifier partenaires uniques
        var duoA = getDuoKey(teamA[0], teamA[1]);
        if (allPartnerships[teamA[0]][teamA[1]]) {
          errors.push('Rotation ' + (rIdx + 1) + ', Match ' + (mIdx + 1) + ': ' +
                      playerName(teamA[0]) + ' et ' + playerName(teamA[1]) + ' ont déjà été partenaires');
        }
        allPartnerships[teamA[0]][teamA[1]] = true;
        allPartnerships[teamA[1]][teamA[0]] = true;

        var duoB = getDuoKey(teamB[0], teamB[1]);
        if (allPartnerships[teamB[0]][teamB[1]]) {
          errors.push('Rotation ' + (rIdx + 1) + ', Match ' + (mIdx + 1) + ': ' +
                      playerName(teamB[0]) + ' et ' + playerName(teamB[1]) + ' ont déjà été partenaires');
        }
        allPartnerships[teamB[0]][teamB[1]] = true;
        allPartnerships[teamB[1]][teamB[0]] = true;

        // Vérifier duos adverses uniques
        if (allFacedDuos[teamA[0]][duoB]) {
          errors.push('Rotation ' + (rIdx + 1) + ', Match ' + (mIdx + 1) + ': ' +
                      playerName(teamA[0]) + ' a déjà affronté le duo ' +
                      playerName(teamB[0]) + '/' + playerName(teamB[1]));
        }
        if (allFacedDuos[teamA[1]][duoB]) {
          errors.push('Rotation ' + (rIdx + 1) + ', Match ' + (mIdx + 1) + ': ' +
                      playerName(teamA[1]) + ' a déjà affronté le duo ' +
                      playerName(teamB[0]) + '/' + playerName(teamB[1]));
        }
        allFacedDuos[teamA[0]][duoB] = true;
        allFacedDuos[teamA[1]][duoB] = true;

        if (allFacedDuos[teamB[0]][duoA]) {
          errors.push('Rotation ' + (rIdx + 1) + ', Match ' + (mIdx + 1) + ': ' +
                      playerName(teamB[0]) + ' a déjà affronté le duo ' +
                      playerName(teamA[0]) + '/' + playerName(teamA[1]));
        }
        if (allFacedDuos[teamB[1]][duoA]) {
          errors.push('Rotation ' + (rIdx + 1) + ', Match ' + (mIdx + 1) + ': ' +
                      playerName(teamB[1]) + ' a déjà affronté le duo ' +
                      playerName(teamA[0]) + '/' + playerName(teamA[1]));
        }
        allFacedDuos[teamB[0]][duoA] = true;
        allFacedDuos[teamB[1]][duoA] = true;
      });
    });

    return errors;
  }

  // ========================================
  // UI RENDERING
  // ========================================

  function showStatus(message, type) {
    if (!refs.status) return;
    refs.status.textContent = message;
    refs.status.className = 'status-message ' + (type || 'info');
    refs.status.style.display = 'block';
    setTimeout(function() {
      if (refs.status) refs.status.style.display = 'none';
    }, 5000);
  }

  function renderPlayersList() {
    if (!refs.playersList) return;
    ensurePlayers(state.playerCount);

    refs.playersList.innerHTML = '';

    state.players.forEach(function(player, idx) {
      var row = document.createElement('div');
      row.className = 'solonight-player-row';

      var label = document.createElement('label');
      label.textContent = 'Joueur ' + (idx + 1);

      var input = document.createElement('input');
      input.type = 'text';
      input.value = player.name || '';
      input.placeholder = 'Nom du joueur';
      input.setAttribute('data-player-id', player.id);

      row.appendChild(label);
      row.appendChild(input);
      refs.playersList.appendChild(row);
    });
  }

  function collectPlayersFromForm() {
    if (!refs.playersList) return;
    var inputs = refs.playersList.querySelectorAll('input[data-player-id]');
    inputs.forEach(function(inp) {
      var id = inp.getAttribute('data-player-id');
      var player = state.players.find(function(p) { return p.id === id; });
      if (player) {
        player.name = inp.value.trim() || player.name;
      }
    });
  }

  function renderPlanning() {
    if (!refs.planning) return;

    if (!state.rotations || state.rotations.length === 0) {
      refs.planning.innerHTML = '<p class="small-muted">Aucun planning généré. Configurez les paramètres et cliquez sur "Générer les rotations".</p>';
      return;
    }

    refs.planning.innerHTML = '';

    // S'assurer que currentRotation est valide
    if (state.currentRotation === undefined || state.currentRotation < 0) {
      state.currentRotation = 0;
    }
    if (state.currentRotation >= state.rotations.length) {
      state.currentRotation = state.rotations.length - 1;
    }

    var rotation = state.rotations[state.currentRotation];
    if (!rotation) return;

    // Navigation des rotations
    var navDiv = document.createElement('div');
    navDiv.className = 'rotation-navigation';
    navDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px;';

    var btnPrev = document.createElement('button');
    btnPrev.className = 'btn btn-secondary';
    btnPrev.innerHTML = '← Précédent';
    btnPrev.disabled = state.currentRotation === 0;
    btnPrev.onclick = function() {
      if (state.currentRotation > 0) {
        state.currentRotation--;
        saveState();
        renderPlanning();
      }
    };

    var rotationIndicator = document.createElement('div');
    rotationIndicator.style.cssText = 'font-weight: 600; font-size: 1.1rem; color: var(--brand-accent); text-align: center;';
    rotationIndicator.textContent = 'Rotation ' + rotation.number + ' / ' + state.rotations.length;

    var btnNext = document.createElement('button');
    btnNext.className = 'btn btn-secondary';
    btnNext.innerHTML = 'Suivant →';
    btnNext.disabled = state.currentRotation === state.rotations.length - 1;
    btnNext.onclick = function() {
      if (state.currentRotation < state.rotations.length - 1) {
        state.currentRotation++;
        saveState();
        renderPlanning();
      }
    };

    navDiv.appendChild(btnPrev);
    navDiv.appendChild(rotationIndicator);
    navDiv.appendChild(btnNext);
    refs.planning.appendChild(navDiv);

    // Affichage de la rotation courante
    var section = document.createElement('div');
    section.className = 'rotation-section';

    var matchesContainer = document.createElement('div');
    matchesContainer.className = 'matches-container';

    rotation.matches.forEach(function(match) {
      var card = document.createElement('div');
      card.className = 'match-card';

      var courtLabel = document.createElement('div');
      courtLabel.className = 'court-label';
      courtLabel.textContent = 'Terrain ' + match.court;
      card.appendChild(courtLabel);

      var teams = document.createElement('div');
      teams.className = 'match-teams';

      var teamADiv = document.createElement('div');
      teamADiv.className = 'team';
      teamADiv.innerHTML = '<strong>Équipe A</strong><br>' +
                          playerName(match.teamA[0]) + ' + ' + playerName(match.teamA[1]);

      var vs = document.createElement('div');
      vs.className = 'vs';
      vs.textContent = 'VS';

      var teamBDiv = document.createElement('div');
      teamBDiv.className = 'team';
      teamBDiv.innerHTML = '<strong>Équipe B</strong><br>' +
                          playerName(match.teamB[0]) + ' + ' + playerName(match.teamB[1]);

      teams.appendChild(teamADiv);
      teams.appendChild(vs);
      teams.appendChild(teamBDiv);
      card.appendChild(teams);

      // Résultats
      var result = state.results[match.id];
      var resultDiv = document.createElement('div');
      resultDiv.className = 'match-result';

      if (result) {
        resultDiv.innerHTML = '<strong>Gagnant :</strong> Équipe ' + result.winner;
        var btnEdit = document.createElement('button');
        btnEdit.className = 'btn btn-secondary btn-small';
        btnEdit.textContent = 'Modifier';
        btnEdit.onclick = function() {
          delete state.results[match.id];
          saveState();
          render();
        };
        resultDiv.appendChild(btnEdit);
      } else {
        var btnA = document.createElement('button');
        btnA.className = 'btn btn-primary btn-small';
        btnA.textContent = 'Équipe A gagne';
        btnA.onclick = function() {
          state.results[match.id] = { winner: 'A' };
          saveState();
          render();
        };

        var btnB = document.createElement('button');
        btnB.className = 'btn btn-primary btn-small';
        btnB.textContent = 'Équipe B gagne';
        btnB.onclick = function() {
          state.results[match.id] = { winner: 'B' };
          saveState();
          render();
        };

        resultDiv.appendChild(btnA);
        resultDiv.appendChild(btnB);
      }

      card.appendChild(resultDiv);
      matchesContainer.appendChild(card);
    });

    section.appendChild(matchesContainer);

    // Joueurs en pause
    if (rotation.paused && rotation.paused.length > 0) {
      var pausedDiv = document.createElement('div');
      pausedDiv.className = 'paused-players';
      pausedDiv.innerHTML = '<strong>En pause :</strong> ' +
        rotation.paused.map(function(id) { return playerName(id); }).join(', ');
      section.appendChild(pausedDiv);
    }

    refs.planning.appendChild(section);
  }

  function renderStandings() {
    if (!refs.standings) return;

    // Calculer les victoires pour chaque joueur
    var standings = {};
    state.players.forEach(function(p) {
      standings[p.id] = { name: p.name, wins: 0, matches: 0 };
    });

    state.rotations.forEach(function(rotation) {
      rotation.matches.forEach(function(match) {
        var result = state.results[match.id];
        if (!result) return;

        var winners = result.winner === 'A' ? match.teamA : match.teamB;
        var losers = result.winner === 'A' ? match.teamB : match.teamA;

        winners.forEach(function(pid) {
          standings[pid].wins++;
          standings[pid].matches++;
        });

        losers.forEach(function(pid) {
          standings[pid].matches++;
        });
      });
    });

    // Trier par nombre de victoires (desc), puis par nombre de matchs (asc), puis alphabétique
    var sorted = Object.keys(standings).map(function(id) {
      return { id: id, data: standings[id] };
    }).sort(function(a, b) {
      if (b.data.wins !== a.data.wins) return b.data.wins - a.data.wins;
      if (a.data.matches !== b.data.matches) return a.data.matches - b.data.matches;
      return a.data.name.localeCompare(b.data.name);
    });

    refs.standings.innerHTML = '<h3>Classement</h3>';

    var table = document.createElement('table');
    table.className = 'standings-table';

    var thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Pos</th><th>Joueur</th><th>Victoires</th><th>Matchs joués</th></tr>';
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    sorted.forEach(function(item, idx) {
      var tr = document.createElement('tr');
      if (idx < 3) tr.className = 'podium-' + (idx + 1);

      tr.innerHTML = '<td>' + (idx + 1) + '</td>' +
                     '<td>' + item.data.name + '</td>' +
                     '<td>' + item.data.wins + '</td>' +
                     '<td>' + item.data.matches + '</td>';
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    refs.standings.appendChild(table);
  }

  function render() {
    if (refs.name) refs.name.value = state.name || 'Solo Night';
    if (refs.playerCount) refs.playerCount.value = state.playerCount || 16;
    if (refs.rotationCount) refs.rotationCount.value = state.rotationCount || 8;

    renderPlayersList();
    renderPlanning();
    renderStandings();

    if (refs.btnRegenerate) {
      refs.btnRegenerate.style.display = state.rotations.length > 0 ? 'inline-block' : 'none';
    }
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  if (refs.name) {
    refs.name.addEventListener('change', function() {
      state.name = refs.name.value;
      saveState();
    });
  }

  if (refs.playerCount) {
    refs.playerCount.addEventListener('change', function() {
      var newCount = parseInt(refs.playerCount.value, 10);
      if (newCount >= 8 && newCount <= 24) {
        state.playerCount = newCount;
        ensurePlayers(newCount);
        saveState();
        render();
      }
    });
  }

  if (refs.rotationCount) {
    refs.rotationCount.addEventListener('change', function() {
      var newCount = parseInt(refs.rotationCount.value, 10);
      if (newCount >= 1 && newCount <= 20) {
        state.rotationCount = newCount;
        saveState();
      }
    });
  }

  if (refs.btnGenerate) {
    refs.btnGenerate.addEventListener('click', function() {
      collectPlayersFromForm();
      saveState();

      showStatus('Génération en cours...', 'info');
      refs.btnGenerate.disabled = true;

      // Utiliser setTimeout pour ne pas bloquer l'UI
      setTimeout(function() {
        var rotations = generateAllRotations();

        if (!rotations) {
          showStatus('❌ Impossible de générer un planning valide avec ces paramètres. ' +
                    'Essayez de réduire le nombre de rotations ou d\'augmenter le nombre de joueurs.', 'error');
          refs.btnGenerate.disabled = false;
          return;
        }

        assignCourts(rotations);
        state.rotations = rotations;
        state.results = {};
        state.currentRotation = 0;
        saveState();

        // Valider (mode debug)
        var errors = validatePlanningConstraints(rotations);
        if (errors.length > 0) {
          console.warn('⚠️ Erreurs de contraintes détectées :', errors);
        } else {
          console.log('✅ Planning valide : toutes les contraintes respectées');
        }

        showStatus('✅ Planning généré avec succès ! ' + rotations.length + ' rotations créées.', 'success');
        refs.btnGenerate.disabled = false;
        render();
      }, 100);
    });
  }

  if (refs.btnRegenerate) {
    refs.btnRegenerate.addEventListener('click', function() {
      if (!confirm('Êtes-vous sûr de vouloir régénérer le planning ? Tous les résultats seront perdus.')) {
        return;
      }

      collectPlayersFromForm();
      saveState();

      showStatus('Régénération en cours...', 'info');
      refs.btnRegenerate.disabled = true;

      setTimeout(function() {
        var rotations = generateAllRotations();

        if (!rotations) {
          showStatus('❌ Impossible de générer un planning valide. Ajustez les paramètres.', 'error');
          refs.btnRegenerate.disabled = false;
          return;
        }

        assignCourts(rotations);
        state.rotations = rotations;
        state.results = {};
        state.currentRotation = 0;
        saveState();

        showStatus('✅ Planning régénéré avec succès !', 'success');
        refs.btnRegenerate.disabled = false;
        render();
      }, 100);
    });
  }

  // ========================================
  // VUE TV
  // ========================================

  function applyLogoToTv() {
    if (!tvRefs.logo) return;
    try {
      var profile = JSON.parse(localStorage.getItem('padel_theme_profile_v1') || '{}');
      if (profile && profile.logoDataUrl) {
        tvRefs.logo.src = profile.logoDataUrl;
        tvRefs.logo.style.height = '48px';
        tvRefs.logo.style.maxHeight = '48px';
        tvRefs.logo.style.width = 'auto';
      }
    } catch (err) {
      console.error('[Solo Night TV] Erreur chargement logo:', err);
    }
  }

  function applySponsorToTv() {
    console.log('[Solo Night TV] applySponsorToTv appelée');

    if (!tvRefs.sponsorBanner || !tvRefs.sponsorLogo || !tvRefs.sponsorName) {
      console.warn('[Solo Night TV] Éléments sponsor manquants:', {
        banner: !!tvRefs.sponsorBanner,
        logo: !!tvRefs.sponsorLogo,
        name: !!tvRefs.sponsorName
      });
      return;
    }

    try {
      // Vérifier si l'affichage des sponsors est activé pour Solo Night
      var sponsorsTVSettings = JSON.parse(localStorage.getItem('sponsors_tv_settings') || 'null');
      console.log('[Solo Night TV] Sponsors TV settings:', sponsorsTVSettings);

      if (!sponsorsTVSettings || !sponsorsTVSettings.enabled) {
        tvRefs.sponsorBanner.style.display = 'none';
        console.log('[Solo Night TV] Affichage sponsors globalement désactivé');
        return;
      }

      // Vérifier si activé pour Solo Night (par défaut: true si non défini)
      var solonightEnabled = sponsorsTVSettings.modes && sponsorsTVSettings.modes.solonight !== undefined
        ? sponsorsTVSettings.modes.solonight
        : true;

      if (!solonightEnabled) {
        tvRefs.sponsorBanner.style.display = 'none';
        console.log('[Solo Night TV] Affichage sponsors désactivé pour Solo Night');
        return;
      }

      // Charger les sponsors depuis localStorage
      var sponsors = JSON.parse(localStorage.getItem('sponsors_list') || '[]');
      console.log('[Solo Night TV] Sponsors chargés:', sponsors.length);

      // Filtrer les sponsors actifs
      var activeSponsors = sponsors.filter(function(s) {
        return s && s.logoData && s.name;
      });

      if (activeSponsors.length === 0) {
        // Pas de sponsors, cacher le bandeau
        tvRefs.sponsorBanner.style.display = 'none';
        console.log('[Solo Night TV] Aucun sponsor actif trouvé');
        return;
      }

      // Sélectionner le premier sponsor actif (TODO: rotation)
      var sponsor = activeSponsors[0];

      // Appliquer le logo et le nom
      tvRefs.sponsorLogo.src = sponsor.logoData;
      tvRefs.sponsorName.textContent = sponsor.name;

      // Afficher le bandeau
      tvRefs.sponsorBanner.style.display = 'flex';

      console.log('[Solo Night TV] Sponsor appliqué:', sponsor.name);
    } catch (err) {
      console.error('[Solo Night TV] Erreur chargement sponsor:', err);
      if (tvRefs.sponsorBanner) {
        tvRefs.sponsorBanner.style.display = 'none';
      }
    }
  }

  // Détermine l'index de la rotation en cours basée sur les scores
  function getCurrentRotationIndex() {
    // Parcourir les rotations pour trouver la première avec des scores incomplets
    for (var i = 0; i < state.rotations.length; i++) {
      var rotation = state.rotations[i];
      var hasIncompleteMatches = rotation.matches.some(function(match) {
        return !state.results[match.id];
      });

      if (hasIncompleteMatches) {
        return i; // Cette rotation a des matchs non terminés
      }
    }

    // Toutes les rotations sont terminées, retourner la dernière
    return Math.max(0, state.rotations.length - 1);
  }

  function renderTv() {
    if (!tvRoot) return;

    if (tvRefs.name) tvRefs.name.textContent = state.name || 'Solo Night';
    if (tvRefs.meta) {
      tvRefs.meta.textContent = state.players.length + ' joueurs • ' +
                                state.rotations.length + ' rotations';
    }

    // Afficher les matchs de la rotation en cours
    renderTvCurrentMatches();

    // Afficher les matchs à suivre
    renderTvNextMatches();

    // Classement
    renderTvStandings();

    // Appliquer le logo
    applyLogoToTv();

    // Appliquer le sponsor (désactivé temporairement pour debug)
    // applySponsorToTv();
  }

  function renderTvCurrentMatches() {
    if (!tvRefs.current) return;

    tvRefs.current.innerHTML = '';

    if (state.rotations.length === 0) {
      tvRefs.current.innerHTML = '<p class="small-muted">Aucun planning généré</p>';
      return;
    }

    var currentIndex = getCurrentRotationIndex();
    var currentRotation = state.rotations[currentIndex];

    if (!currentRotation) {
      tvRefs.current.innerHTML = '<p class="small-muted">Aucun match en cours</p>';
      return;
    }

    currentRotation.matches.forEach(function(match) {
      var card = document.createElement('div');
      card.className = 'tv-match-card';

      var result = state.results[match.id];
      var resultClass = result ? 'completed' : 'pending';
      card.classList.add(resultClass);

      card.innerHTML = '<div class="tv-court">Terrain ' + match.court + '</div>' +
                      '<div class="tv-teams">' +
                      '<div class="tv-team ' + (result && result.winner === 'A' ? 'winner' : '') + '">' +
                      playerName(match.teamA[0]) + '<br>' + playerName(match.teamA[1]) +
                      '</div>' +
                      '<div class="tv-vs">VS</div>' +
                      '<div class="tv-team ' + (result && result.winner === 'B' ? 'winner' : '') + '">' +
                      playerName(match.teamB[0]) + '<br>' + playerName(match.teamB[1]) +
                      '</div>' +
                      '</div>';

      tvRefs.current.appendChild(card);
    });
  }

  function renderTvNextMatches() {
    var nextContainer = tvRoot ? tvRoot.querySelector('#solonight-tv-next') : null;
    if (!nextContainer) return;

    nextContainer.innerHTML = '';

    if (state.rotations.length === 0) {
      nextContainer.innerHTML = '<p class="small-muted">Aucun planning généré</p>';
      return;
    }

    var currentIndex = getCurrentRotationIndex();
    var nextIndex = currentIndex + 1;

    if (nextIndex >= state.rotations.length) {
      nextContainer.innerHTML = '<p class="small-muted">Pas de prochaine rotation</p>';
      return;
    }

    var nextRotation = state.rotations[nextIndex];

    nextRotation.matches.forEach(function(match) {
      var card = document.createElement('div');
      card.className = 'tv-match-card upcoming';

      card.innerHTML = '<div class="tv-court">Terrain ' + match.court + '</div>' +
                      '<div class="tv-teams">' +
                      '<div class="tv-team">' +
                      playerName(match.teamA[0]) + '<br>' + playerName(match.teamA[1]) +
                      '</div>' +
                      '<div class="tv-vs">VS</div>' +
                      '<div class="tv-team">' +
                      playerName(match.teamB[0]) + '<br>' + playerName(match.teamB[1]) +
                      '</div>' +
                      '</div>';

      nextContainer.appendChild(card);
    });
  }

  function renderTvStandings() {
    if (!tvRefs.standings) return;

    // Calculer les standings
    var standings = {};
    state.players.forEach(function(p) {
      standings[p.id] = { name: p.name, wins: 0, matches: 0 };
    });

    state.rotations.forEach(function(rotation) {
      rotation.matches.forEach(function(match) {
        var result = state.results[match.id];
        if (!result) return;

        var winners = result.winner === 'A' ? match.teamA : match.teamB;
        var losers = result.winner === 'A' ? match.teamB : match.teamA;

        winners.forEach(function(pid) {
          standings[pid].wins++;
          standings[pid].matches++;
        });

        losers.forEach(function(pid) {
          standings[pid].matches++;
        });
      });
    });

    var sorted = Object.keys(standings).map(function(id) {
      return { id: id, data: standings[id] };
    }).sort(function(a, b) {
      if (b.data.wins !== a.data.wins) return b.data.wins - a.data.wins;
      if (a.data.matches !== b.data.matches) return a.data.matches - b.data.matches;
      return a.data.name.localeCompare(b.data.name);
    });

    // Vider et configurer le conteneur comme grille 2 colonnes
    tvRefs.standings.innerHTML = '';
    tvRefs.standings.className = 'tv-standings-grid';

    // Diviser en 2 colonnes
    var halfPoint = Math.ceil(sorted.length / 2);
    var leftColumn = sorted.slice(0, halfPoint);
    var rightColumn = sorted.slice(halfPoint);

    // Fonction pour créer une colonne
    function createColumn(items, startIndex) {
      var column = document.createElement('div');
      column.className = 'tv-standings-column';

      items.forEach(function(item, idx) {
        var globalIndex = startIndex + idx;
        var row = document.createElement('div');
        row.className = 'tv-standing-row';

        // Couleurs podium pour top 3
        var podiumClass = '';
        if (globalIndex === 0) podiumClass = 'podium-gold';
        else if (globalIndex === 1) podiumClass = 'podium-silver';
        else if (globalIndex === 2) podiumClass = 'podium-bronze';

        if (podiumClass) row.classList.add(podiumClass);

        row.innerHTML =
          '<span class="tv-rank">' + (globalIndex + 1) + '</span>' +
          '<span class="tv-player-name">' + item.data.name + '</span>' +
          '<span class="tv-wins">' + item.data.wins + ' V</span>';

        column.appendChild(row);
      });

      return column;
    }

    // Ajouter les colonnes directement au conteneur
    tvRefs.standings.appendChild(createColumn(leftColumn, 0));
    tvRefs.standings.appendChild(createColumn(rightColumn, halfPoint));
  }

  // ========================================
  // GESTION DES ONGLETS
  // ========================================

  function bindTabs() {
    var tabButtons = root ? root.querySelectorAll('[data-solonight-tab]') : [];
    var tabPanels = root ? root.querySelectorAll('[data-solonight-tab-panel]') : [];

    tabButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var targetTab = btn.getAttribute('data-solonight-tab');

        // Désactiver tous les boutons et panels
        tabButtons.forEach(function(b) { b.classList.remove('active'); });
        tabPanels.forEach(function(p) { p.classList.remove('active'); });

        // Activer le bouton et panel ciblé
        btn.classList.add('active');
        var targetPanel = root.querySelector('[data-solonight-tab-panel="' + targetTab + '"]');
        if (targetPanel) targetPanel.classList.add('active');

        // Si on active l'onglet TV, initialiser les systèmes TV
        if (targetTab === 'tv' && tvRoot) {
          renderTv();
          initTVSystems();
        }
      });
    });
  }

  // ========================================
  // GESTION DES COLLAPSE
  // ========================================

  function bindCollapse() {
    var collapseButtons = root ? root.querySelectorAll('.americano-collapse[data-target]') : [];

    collapseButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var targetId = btn.getAttribute('data-target');
        var targetBody = document.getElementById(targetId);

        if (targetBody) {
          var isCollapsed = targetBody.classList.toggle('americano-collapsed');
          btn.textContent = isCollapsed ? '+' : '−';
        }
      });
    });
  }

  // ========================================
  // MISE À JOUR DES MÉTADONNÉES
  // ========================================

  function updateMeta() {
    var metaEl = document.getElementById('solonight-meta');
    var roundMetaEl = document.getElementById('solonight-round-meta');

    if (metaEl) {
      metaEl.textContent = state.players.length + ' joueurs • ' +
                           (state.rotations.length || state.rotationCount) + ' rotations';
    }

    if (roundMetaEl) {
      if (state.rotations.length > 0) {
        roundMetaEl.textContent = 'Planning généré';
      } else {
        roundMetaEl.textContent = 'Planning non généré';
      }
    }
  }

  // ========================================
  // TV ROTATION & ANIMATIONS
  // ========================================

  var tvRotationManager = null;
  var tvAnimations = null;

  function initTVSystems() {
    console.log('[Solo Night TV] Initialisation systèmes TV...');

    // Charger config TV depuis localStorage
    var tvConfig = null;
    try {
      var stored = localStorage.getItem('tv_config_solonight');
      if (stored) {
        tvConfig = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[Solo Night TV] Erreur chargement config:', e);
    }

    // Appliquer layout au conteneur TV
    var tvMain = tvRoot ? tvRoot.querySelector('.tv-main') : null;
    if (!tvMain) {
      console.warn('[Solo Night TV] Conteneur .tv-main non trouvé');
      return;
    }

    // Déterminer le layout à appliquer
    var layoutType = 'fullscreen';
    if (tvConfig && tvConfig.layout && tvConfig.layout.type) {
      layoutType = tvConfig.layout.type;
    }

    // Retirer toutes les classes de layout existantes
    tvMain.classList.remove('layout-fullscreen', 'layout-split-vertical', 'layout-split-horizontal', 'layout-grid-2x2', 'layout-pip');

    // Ajouter la nouvelle classe de layout
    var layoutClass = 'layout-' + layoutType;
    tvMain.classList.add(layoutClass);
    console.log('[Solo Night TV] Layout appliqué:', layoutType);

    // Initialiser animations si config existe
    if (tvConfig && window.TVAnimations) {
      tvAnimations = new window.TVAnimations(tvConfig.animations || {});
      tvAnimations.init();
    }

    // Récupérer tous les blocs
    var allBlocks = tvMain.querySelectorAll('.tv-block');

    // Initialiser rotation si activée
    if (tvConfig && tvConfig.rotation && tvConfig.rotation.enabled && window.TVRotationManager) {
      tvRotationManager = new window.TVRotationManager(tvConfig, tvMain);
      if (tvRotationManager.init()) {
        tvRotationManager.start();
        console.log('[Solo Night TV] Rotation démarrée');
        return; // La rotation gère l'affichage des blocs
      } else {
        console.warn('[Solo Night TV] Échec initialisation rotation, affichage statique');
      }
    }

    // Affichage statique (rotation désactivée ou pas de config)
    if (tvConfig) {
      // Utiliser la config pour déterminer quels blocs afficher
      showStaticTVBlocks(tvConfig, tvMain);
      console.log('[Solo Night TV] Blocs statiques affichés selon config');
    } else {
      // Pas de config : afficher les blocs par défaut
      showDefaultTVBlocks(tvMain, layoutType, allBlocks);
      console.log('[Solo Night TV] Blocs par défaut affichés (pas de config)');
    }
  }

  // Afficher les blocs TV par défaut quand il n'y a pas de config
  function showDefaultTVBlocks(container, layoutType, allBlocks) {
    if (!container) return;

    // Cacher tous les blocs d'abord
    for (var i = 0; i < allBlocks.length; i++) {
      allBlocks[i].style.display = 'none';
      allBlocks[i].classList.remove('tv-block-active');
    }

    // Déterminer combien de blocs afficher selon le layout
    var blocksToShow = 1; // Par défaut: fullscreen
    if (layoutType === 'split-vertical' || layoutType === 'split-horizontal' || layoutType === 'pip') {
      blocksToShow = 2;
    } else if (layoutType === 'grid-2x2') {
      blocksToShow = 4;
    }

    // Afficher les premiers blocs
    for (var i = 0; i < Math.min(blocksToShow, allBlocks.length); i++) {
      allBlocks[i].style.display = 'block';
      allBlocks[i].classList.add('tv-block-active');
    }
  }

  // Afficher les blocs TV statiques quand la rotation est désactivée
  function showStaticTVBlocks(config, container) {
    if (!config || !container) return;

    // Récupérer tous les blocs TV
    var allBlocks = container.querySelectorAll('.tv-block');

    // Cacher tous les blocs d'abord
    for (var i = 0; i < allBlocks.length; i++) {
      allBlocks[i].style.display = 'none';
      allBlocks[i].classList.remove('tv-block-active');
    }

    // Filtrer les blocs activés
    var enabledBlocks = [];
    for (var i = 0; i < allBlocks.length; i++) {
      var block = allBlocks[i];
      var blockId = block.getAttribute('data-tv-block');
      if (blockId && config.blocks && config.blocks[blockId] && config.blocks[blockId].enabled) {
        enabledBlocks.push(block);
      }
    }

    // Si aucun bloc n'est activé, afficher tous les blocs disponibles par défaut
    if (enabledBlocks.length === 0) {
      console.warn('[Solo Night TV] Aucun bloc activé, affichage de tous les blocs par défaut');
      enabledBlocks = Array.from(allBlocks);
    }

    // Déterminer combien de blocs afficher selon le layout
    var layoutType = config.layout ? config.layout.type : 'fullscreen';
    var blocksToShow = 1; // Par défaut: fullscreen

    if (layoutType === 'split-vertical' || layoutType === 'split-horizontal' || layoutType === 'pip') {
      blocksToShow = 2;
    } else if (layoutType === 'grid-2x2') {
      blocksToShow = 4;
    }

    // Afficher les blocs en utilisant modulo pour remplir TOUS les slots
    for (var i = 0; i < blocksToShow; i++) {
      var blockIndex = i % enabledBlocks.length;
      var block = enabledBlocks[blockIndex];
      if (block) {
        block.style.display = 'block';
        block.classList.add('tv-block-active');
      }
    }
  }

  function destroyTVSystems() {
    console.log('[Solo Night TV] Destruction systèmes TV...');

    if (tvRotationManager) {
      tvRotationManager.destroy();
      tvRotationManager = null;
    }

    if (tvAnimations) {
      tvAnimations.destroy();
      tvAnimations = null;
    }
  }

  // ========================================
  // EXPOSITION GLOBALE
  // ========================================

  window.SOLONIGHT = {
    render: function() {
      render();
      updateMeta();
    },
    renderTv: renderTv,
    initTVSystems: initTVSystems,
    destroyTVSystems: destroyTVSystems,
    state: state,
    saveState: saveState
  };

  // ========================================
  // INITIALISATION
  // ========================================

  function init() {
    bindTabs();
    bindCollapse();
    render();
    updateMeta();

    // Initialiser les systèmes TV (layout, rotation, animations)
    if (tvRoot) {
      setTimeout(function() {
        initTVSystems();
      }, 100);
    }
  }

  // Rendu initial
  init();
})();
