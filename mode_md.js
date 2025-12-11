(function(){
'use strict';

// Racines scindées : admin M/D et TV M/D
var mdRoot = document.getElementById('md-root') || document.getElementById('admin-root') || document;
var mdAdminRoot = document.getElementById('admin-root') || mdRoot;
var mdTvRoot = document.getElementById('tv-root') || document;
function mdSel(selector) {
  return mdAdminRoot ? mdAdminRoot.querySelector(selector) : null;
}
/* Résumé corrections :
   - Rééquilibrage montées/descentes par terrain pour chaque roulement.
   - Gestion stricte du repos après 2 matchs consécutifs (6 à 16 équipes).
   - Calcul des roulements basé sur les résultats précédents + cohérence TV. */
/* SKINS */
var SKINS = {
  padelParc: {
    name: "Padel Parc",
    subtitle: "Gestionnaire de tournois & M/D – moteur officiel Padel Parc",
    placeholderTournamentName: "Soirée Padel Parc - Vendredi",
    logoUrl: "https://lh3.googleusercontent.com/p/AF1QipNpQrOfpCxdRelQ7dF2r-elyslV__xZz5mOazHu=s1360-w1360-h1020-rw",
    colors: {
      blueStrong: "#004b9b",
      blueMid: "#4d81b9",
      blueSoft: "#99b7d7",
      blueBg: "#e6edf5",
      accent: "#e5e339",
      bgDark: "#020617",
      card: "#0b1220",
      border: "#1e293b",
      text: "#f9fafb",
      muted: "#9ca3af",
      success: "#22c55e",
      danger: "#ef4444"
    }
  }
};

var ACTIVE_SKIN_KEY = "padelParc";
// Séparation explicite de l’historique du mode Montante/Descendante
var HISTORY_KEY = "tournament_history_md";

function applySkin() {
  var skin = SKINS[ACTIVE_SKIN_KEY];
  if (!skin) return;
  var root = document.documentElement;
  var c = skin.colors || {};
  if (c.blueStrong) root.style.setProperty('--blue-strong', c.blueStrong);
  if (c.blueMid)    root.style.setProperty('--blue-mid', c.blueMid);
  if (c.blueSoft)   root.style.setProperty('--blue-soft', c.blueSoft);
  if (c.blueBg)     root.style.setProperty('--blue-bg', c.blueBg);
  if (c.accent)     root.style.setProperty('--accent', c.accent);
  if (c.bgDark)     root.style.setProperty('--bg-dark', c.bgDark);
  if (c.card)       root.style.setProperty('--card', c.card);
  if (c.border)     root.style.setProperty('--border', c.border);
  if (c.text)       root.style.setProperty('--text', c.text);
  if (c.muted)      root.style.setProperty('--muted', c.muted);
  if (c.success)    root.style.setProperty('--success', c.success);
  if (c.danger)     root.style.setProperty('--danger', c.danger);

  var titleEl = mdSel("#app-title");
  var subtitleEl = mdSel("#app-subtitle");
  var logoEl = mdSel("#app-logo");
  var inputName = mdSel("#tournament-name");
  if (titleEl && skin.name) titleEl.textContent = skin.name;
  if (subtitleEl && skin.subtitle) subtitleEl.textContent = skin.subtitle;
  if (inputName && skin.placeholderTournamentName) {
    inputName.placeholder = skin.placeholderTournamentName;
  }
  if (logoEl) {
    if (skin.logoUrl) {
      logoEl.src = skin.logoUrl;
      logoEl.style.display = "block";
    } else logoEl.style.display = "none";
  }
  var tvLogo = mdTvRoot ? mdTvRoot.querySelector('#tv-logo') : null;
  if (tvLogo) {
    if (skin.logoUrl) {
      tvLogo.src = skin.logoUrl;
      tvLogo.style.display = "block";
    } else tvLogo.style.display = "none";
  }
}

/* STATE */
var state = {
  name: "",
  teamCount: 0,
  maxRoulements: 8,
  currentRoulement: 1,
  teams: [],
  stats: [],
  results: {},
  pairings: {}
};

/* DOM M/D EXISTANT */
var elName           = mdSel("#tournament-name");
var elTeamCount      = mdSel("#team-count");
var elMaxRoulements  = mdSel("#max-roulements");
var elBtnInitTeams   = mdSel("#btn-init-teams");
var elTeamsEdit      = mdSel("#teams-edit");
var elTeamsInfo      = mdSel("#teams-info");
var elBtnRandomNames = mdSel("#btn-random-names");
var elBtnStart       = mdSel("#btn-start");

var elTournamentSection = mdSel("#tournament-section");
var elTitleTournament   = mdSel("#title-tournament");
var elSubtitleTournament= mdSel("#subtitle-tournament");
var elChipRoulement     = mdSel("#chip-roulement");
var elChipTeams         = mdSel("#chip-teams");
var elLabelRoulement    = mdSel("#label-roulement");

var elMatchesGrid   = mdSel("#matches-grid");
var elRestList      = mdSel("#rest-list");
var elRanking       = mdSel("#ranking");
var elBtnPrevRound  = mdSel("#btn-prev-round");
var elBtnNextRound  = mdSel("#btn-next-round");

// Sélecteurs TV : scope sur la racine TV pour éviter les collisions avec le classique
var elTvTournoiName   = mdTvRoot ? mdTvRoot.querySelector("#tv-tournoi-name") : null;
var elTvRoulementInfo = mdTvRoot ? mdTvRoot.querySelector("#tv-roulement-info") : null;
var elTvLabelRoulement= mdTvRoot ? mdTvRoot.querySelector("#tv-label-roulement") : null;
var elTvCurrentList   = mdTvRoot ? mdTvRoot.querySelector("#tv-current-list") : null;
var elTvNextList      = mdTvRoot ? mdTvRoot.querySelector("#tv-next-list") : null;
var elTvPodium        = mdTvRoot ? mdTvRoot.querySelector("#tv-podium") : null;
var elTvRankingGrid   = mdTvRoot ? mdTvRoot.querySelector("#tv-ranking-grid") : null;

applySkin();
ensureHistoryUI();
enableCardCollapsing();

(function initTeamSelect() {
  for (var i = 6; i <= 16; i++) {
    var opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i + " équipes";
    if (i === 8) opt.selected = true;
    elTeamCount.appendChild(opt);
  }
})();

/* EVENTS ADMIN M/D */
elBtnInitTeams.addEventListener("click", function () {
  var name = (elName.value || "").trim();
  var n = parseInt(elTeamCount.value, 10);
  var maxR = parseInt(elMaxRoulements.value, 10);
  if (!name) { alert("Merci de saisir un nom de tournoi."); return; }
  if (isNaN(n) || n < 6 || n > 16) { alert("Le moteur gère entre 6 et 16 équipes."); return; }

  state.name = name;
  state.teamCount = n;
  state.maxRoulements = maxR;
  state.currentRoulement = 1;
  state.results = {};
  state.pairings = {};
  state.teams = [];
  for (var i = 1; i <= n; i++) state.teams.push({ id: i, name: "Équipe " + i });
  state.stats = [];
  for (var j = 0; j < state.teams.length; j++) {
    state.stats.push({ id: state.teams[j].id, name: state.teams[j].name, wins:0, losses:0, points:0, matches:0 });
  }
  renderTeamsEditor();
  elBtnStart.disabled = false;
  renderTvView();
});

// Générateur dédié aux noms aléatoires du mode M/D
function generateMDTeamNames() {
  return [
    "Vertical Smash","Padel Pulse","Vibora Crew","Lob & Roll","Court Commanders","Spin Doctors",
    "Moonballs","Padel Flow","Sidewall Squad","Retro Bandeja","Flash Dropshot","Power Alley",
    "Service Kick","Cross Winners","Night Rally","Tactical Lobs"
  ];
}

if (elBtnRandomNames) {
  elBtnRandomNames.addEventListener("click", function () {
    if (!state.teams.length) return;
    var baseNames = generateMDTeamNames();
    for (var i = 0; i < state.teams.length; i++) {
      var name = baseNames[i % baseNames.length] + " #" + (i + 1);
      state.teams[i].name = name;
      var s = findStatById(state.teams[i].id);
      if (s) s.name = name;
    }
    renderTeamsEditor();
    if (elTournamentSection && elTournamentSection.style.display !== "none") {
      renderRound();
      renderRanking();
    }
    renderTvView();
  });
}

elBtnStart.addEventListener("click", function () {
  if (!state.teams.length) { alert("Configure d’abord les équipes."); return; }
  state.currentRoulement = 1;
  state.results = {};
  state.pairings = {};
  for (var i = 0; i < state.stats.length; i++) {
    state.stats[i].wins = 0;
    state.stats[i].losses = 0;
    state.stats[i].points = 0;
    state.stats[i].matches = 0;
  }
  elTournamentSection.style.display = "block";
  elTitleTournament.textContent = state.name;
  elSubtitleTournament.textContent =
    state.teamCount + " équipes • " + state.maxRoulements + " roulements maximum • Montante / Descendante";
  updateTopBar();
  renderRound();
  renderRanking();
  renderTvView();
  if (typeof window.showAdmin === 'function') {
    window.showAdmin();
  }
  window.scrollTo(0, elTournamentSection.offsetTop - 10);
});

elBtnPrevRound.addEventListener("click", function () {
  if (state.currentRoulement > 1) {
    state.currentRoulement--;
    updateTopBar(); renderRound(); renderRanking(); renderTvView();
  }
});

elBtnNextRound.addEventListener("click", function () {
  if (state.currentRoulement < state.maxRoulements) {
    state.currentRoulement++;
    updateTopBar(); renderRound(); renderRanking(); renderTvView();
  }
});

/* RENDER ADMIN */
function renderTeamsEditor() {
  if (!state.teams.length) {
    elTeamsEdit.innerHTML = '<div class="empty">Configure d’abord le nombre d’équipes.</div>';
    elTeamsInfo.textContent = "";
    return;
  }
  var html = "";
  for (var i = 0; i < state.teams.length; i++) {
    var t = state.teams[i];
    html += '<div class="team-chip"><span>#' + t.id +
      '</span><input type="text" data-team-id="' + t.id + '" value="' +
      escapeHtml(t.name) + '" /></div>';
  }
  elTeamsEdit.innerHTML = html;
  elTeamsInfo.textContent = state.teamCount + " équipes configurées.";
  var inputs = elTeamsEdit.querySelectorAll("input[data-team-id]");
  for (var j = 0; j < inputs.length; j++) {
    inputs[j].addEventListener("input", function () {
      var id = parseInt(this.getAttribute("data-team-id"), 10);
      var team = findTeamById(id);
      if (team) {
        team.name = this.value.trim() || ("Équipe " + id);
        var s = findStatById(id);
        if (s) s.name = team.name;
        if (elTournamentSection.style.display !== "none") {
          renderRound(); renderRanking();
        }
        renderTvView();
      }
    });
  }
}

function updateTopBar() {
  elChipRoulement.textContent = "Roulement " + state.currentRoulement + " / " + state.maxRoulements;
  elChipTeams.textContent = state.teamCount + " équipe" + (state.teamCount > 1 ? "s" : "");
  elLabelRoulement.textContent = String(state.currentRoulement);
}

function renderRound() {
  var n = state.teamCount;
  if (!n) {
    elMatchesGrid.innerHTML = '<div class="empty">Aucun tournoi configuré.</div>';
    elRestList.innerHTML = "";
    return;
  }
  var info = getMatchesAndRestForRound(state.currentRoulement);
  var matches = info.matches;
  var rest = info.restTeams;
  if (!matches.length) {
    elMatchesGrid.innerHTML = '<div class="empty">Pas assez d’équipes pour générer des matchs.</div>';
  } else {
    var html = "";
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      var key = resultKey(state.currentRoulement, m.terrain);
      var res = state.results[key] || null;
      var isWinnerA = res && res.winnerId === m.teamA.id;
      var isWinnerB = res && res.winnerId === m.teamB.id;
      html += '<article class="match-card">' +
          '<div class="match-header"><span>Terrain ' + m.terrain +
          '</span><span>' + m.label + '</span></div>' +
          '<div class="teams-row">' +
            '<div class="team-row ' + (isWinnerA ? "winner" : "") + '">' +
              '<span class="team-name">' + escapeHtml(m.teamA.name) + '</span>' +
              '<button class="btn btn-small" data-role="win" data-roulement="' +
              state.currentRoulement + '" data-terrain="' + m.terrain +
              '" data-team-id="' + m.teamA.id + '">✅ Vainqueur</button>' +
            '</div>' +
            '<div class="team-row ' + (isWinnerB ? "winner" : "") + '">' +
              '<span class="team-name">' + escapeHtml(m.teamB.name) + '</span>' +
              '<button class="btn btn-small" data-role="win" data-roulement="' +
              state.currentRoulement + '" data-terrain="' + m.terrain +
              '" data-team-id="' + m.teamB.id + '">✅ Vainqueur</button>' +
            '</div>' +
          '</div>' +
          '<div class="status-line">' +
            (res ? "Résultat enregistré" : "En attente de résultat") +
          '</div>' +
        '</article>';
    }
    elMatchesGrid.innerHTML = html;
  }
  if (!rest.length) {
    elRestList.innerHTML = '<span class="small-muted">Aucune équipe au repos sur ce roulement.</span>';
  } else {
    var htmlRest = "";
    for (var j = 0; j < rest.length; j++) {
      htmlRest += '<span class="rest-pill">' + escapeHtml(rest[j].name) + '</span>';
    }
    elRestList.innerHTML = htmlRest;
  }
  attachWinnerButtons();
}

function attachWinnerButtons() {
  var buttons = elMatchesGrid.querySelectorAll("button[data-role='win']");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      var r = parseInt(this.getAttribute("data-roulement"), 10);
      var terrain = parseInt(this.getAttribute("data-terrain"), 10);
      var winnerId = parseInt(this.getAttribute("data-team-id"), 10);
      setWinner(r, terrain, winnerId);
    });
  }
}

function setWinner(roulement, terrain, winnerId) {
  var info = getMatchesAndRestForRound(roulement);
  var matches = info.matches;
  var match = null;
  for (var i = 0; i < matches.length; i++) if (matches[i].terrain === terrain) { match = matches[i]; break; }
  if (!match) return;
  var teamAId = match.teamA.id;
  var teamBId = match.teamB.id;
  var loserId = (winnerId === teamAId) ? teamBId : teamAId;
  var key = resultKey(roulement, terrain);
  var prev = state.results[key] || null;
  if (prev) {
    var sWPrev = findStatById(prev.winnerId);
    var sLPrev = findStatById(prev.loserId);
    if (sWPrev && sLPrev) {
      sWPrev.points -= 3; sWPrev.wins -= 1; sWPrev.matches -= 1;
      sLPrev.losses -= 1; sLPrev.matches -= 1;
    }
  }
  state.results[key] = { winnerId: winnerId, loserId: loserId };
  var sW = findStatById(winnerId);
  var sL = findStatById(loserId);
  if (sW && sL) {
    sW.points += 3; sW.wins += 1; sW.matches += 1;
    sL.losses += 1; sL.matches += 1;
  }
  renderRound(); renderRanking(); renderTvView();
}

function getSortedStatsForRanking() {
  var statsCopy = state.stats.slice();
  statsCopy.sort(function (a, b) {
    if (b.points !== a.points) return b.points - a.points;
    if (a.matches !== b.matches) return a.matches - b.matches;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  return statsCopy;
}

function renderRanking() {
  if (!state.teams.length) {
    elRanking.innerHTML = '<div class="empty">Le classement apparaîtra ici.</div>';
    return;
  }
  var statsCopy = getSortedStatsForRanking();
  var anyMatch = statsCopy.some(function (s) { return s.matches > 0; });
  if (!anyMatch) {
    elRanking.innerHTML = '<div class="empty">Le classement apparaîtra dès les premiers résultats.</div>';
    return;
  }
  var html = "";
  for (var j = 0; j < statsCopy.length; j++) {
    var s = statsCopy[j];
    var pos = j + 1;
    html += '<div class="ranking-item">' +
      '<span class="ranking-pos">' + pos + '.</span>' +
      '<span class="ranking-name">' + escapeHtml(s.name) + '</span>' +
      '<span class="ranking-points">' + s.points + ' pts</span>' +
      '<span class="ranking-record">' + s.wins + 'V - ' + s.losses + 'D (' + s.matches + ' m.)</span>' +
      '</div>';
  }
  elRanking.innerHTML = html;
}

/* ENGINE 6–16 + CAS 16 PAIR/IMPAIR */
function planRoundFromStats(roulementNumber) {
  var n = state.teamCount;
  var stats = state.stats;
  if (!n || !stats.length) return { matches: [], restTeams: [] };

  var maxTerrains = Math.min(4, Math.floor(n / 2));
  var playingCount = maxTerrains * 2;
  if (playingCount < 2) return { matches: [], restTeams: [] };

  var restSlots = Math.max(0, n - playingCount);
  var candidates = [];

  if (roulementNumber === 1 || !state.pairings[roulementNumber - 1]) {
    var initial = stats.slice();
    initial.sort(function (a, b) {
      if (a.matches !== b.matches) return a.matches - b.matches;
      if (b.points !== a.points) return b.points - a.points;
      return a.id - b.id;
    });
    for (var i0 = 0; i0 < initial.length; i0++) {
      var t0 = findTeamById(initial[i0].id);
      if (t0) candidates.push({ team: t0, score: i0 });
    }
  } else {
    var prev = getMatchesAndRestForRound(roulementNumber - 1);
    var maxBase = maxTerrains * 2;
    var seen = {};

    for (var m = 0; m < prev.matches.length; m++) {
      var match = prev.matches[m];
      var baseA = (match.terrain - 1) * 2;
      var baseB = baseA + 1;
      var resKey = resultKey(roulementNumber - 1, match.terrain);
      var res = state.results[resKey];

      var adjA = baseA;
      var adjB = baseB;

      if (res) {
        if (res.winnerId === match.teamA.id) adjA = Math.max(0, baseA - 2);
        if (res.winnerId === match.teamB.id) adjB = Math.max(0, baseB - 2);
        if (res.loserId === match.teamA.id) adjA = baseA + 2;
        if (res.loserId === match.teamB.id) adjB = baseB + 2;
      }

      if (!seen[match.teamA.id]) {
        candidates.push({ team: match.teamA, score: adjA });
        seen[match.teamA.id] = true;
      }
      if (!seen[match.teamB.id]) {
        candidates.push({ team: match.teamB, score: adjB });
        seen[match.teamB.id] = true;
      }
    }

    for (var r = 0; r < prev.restTeams.length; r++) {
      var restTeam = prev.restTeams[r];
      if (!restTeam || seen[restTeam.id]) continue;
      candidates.push({ team: restTeam, score: maxBase + r });
      seen[restTeam.id] = true;
    }

    if (candidates.length < stats.length) {
      for (var s = 0; s < stats.length; s++) {
        var tStat = findTeamById(stats[s].id);
        if (tStat && !seen[tStat.id]) {
          candidates.push({ team: tStat, score: maxBase + restSlots + s });
          seen[tStat.id] = true;
        }
      }
    }
  }

  candidates.sort(function (a, b) {
    if (a.score !== b.score) return a.score - b.score;
    var sa = findStatById(a.team.id);
    var sb = findStatById(b.team.id);
    var pa = sa ? sa.points : 0;
    var pb = sb ? sb.points : 0;
    if (pb !== pa) return pb - pa;
    var ma = sa ? sa.matches : 0;
    var mb = sb ? sb.matches : 0;
    if (ma !== mb) return ma - mb;
    return a.team.id - b.team.id;
  });

  var playing = [];
  var rest = [];

  for (var c = 0; c < candidates.length; c++) {
    var candidate = candidates[c];
    var consec = getConsecutivePlays(candidate.team.id, roulementNumber - 1);
    var mustRest = consec >= 2 && rest.length < restSlots;
    if (mustRest) {
      rest.push(candidate.team);
    } else if (playing.length < playingCount) {
      playing.push(candidate.team);
    } else if (rest.length < restSlots) {
      rest.push(candidate.team);
    } else {
      playing.push(candidate.team);
    }
  }

  if (playing.length < playingCount && rest.length) {
    rest.sort(function (a, b) {
      var ca = getConsecutivePlays(a.id, roulementNumber - 1);
      var cb = getConsecutivePlays(b.id, roulementNumber - 1);
      if (ca !== cb) return ca - cb;
      return a.id - b.id;
    });
    while (playing.length < playingCount && rest.length) {
      playing.push(rest.shift());
    }
  }

  if (playing.length > playingCount) {
    while (playing.length > playingCount) {
      rest.push(playing.pop());
    }
  }

  var matches = [];
  for (var t = 1; t <= maxTerrains; t++) {
    var idxA = (t - 1) * 2;
    var idxB = idxA + 1;
    if (idxB >= playing.length) break;
    var teamA = playing[idxA];
    var teamB = playing[idxB];
    if (!teamA || !teamB) continue;

    var label = "";
    if (t === 1) label = "Terrain fort";
    else if (t === maxTerrains) label = "Terrain fun";
    else label = "Terrain intermédiaire";

    matches.push({
      terrain: t,
      teamA: teamA,
      teamB: teamB,
      label: label
    });
  }

  var restTeams = [];
  for (var rr = 0; rr < rest.length; rr++) restTeams.push(rest[rr]);
  return { matches: matches, restTeams: restTeams };
}

function getMatchesAndRestForRound(roulement) {
  var rec = state.pairings[roulement];
  if (!rec) {
    var planned = planRoundFromStats(roulement);
    var matchesRec = [];
    var restIds = [];
    for (var i = 0; i < planned.matches.length; i++) {
      var m = planned.matches[i];
      matchesRec.push({
        terrain: m.terrain,
        teamAId: m.teamA.id,
        teamBId: m.teamB.id,
        label: m.label
      });
    }
    for (var j = 0; j < planned.restTeams.length; j++) {
      restIds.push(planned.restTeams[j].id);
    }
    rec = { matches: matchesRec, restIds: restIds };
    state.pairings[roulement] = rec;
  }
  var outMatches = [];
  for (var k = 0; k < rec.matches.length; k++) {
    var mr = rec.matches[k];
    var teamA = findTeamById(mr.teamAId);
    var teamB = findTeamById(mr.teamBId);
    if (!teamA || !teamB) continue;
    outMatches.push({
      terrain: mr.terrain,
      teamA: teamA,
      teamB: teamB,
      label: mr.label
    });
  }
  var outRest = [];
  for (var x = 0; x < rec.restIds.length; x++) {
    var t = findTeamById(rec.restIds[x]);
    if (t) outRest.push(t);
  }
  return { matches: outMatches, restTeams: outRest };
}

/* VUE TV */
function renderTvView() {
  var nomTournoi = state.name || "Tournoi de padel";
  elTvTournoiName.textContent = nomTournoi;
  var infoText = "Roulement " + state.currentRoulement + " / " +
                 (state.maxRoulements || "–") + " • " +
                 (state.teamCount || 0) + " équipe" +
                 (state.teamCount > 1 ? "s" : "");
  elTvRoulementInfo.textContent = infoText;
  elTvLabelRoulement.textContent = String(state.currentRoulement);

  if (!state.teamCount || !state.teams.length) {
    elTvCurrentList.innerHTML = '<div class="tv-empty">Configure et lance un tournoi en mode admin.</div>';
    elTvNextList.innerHTML    = '<div class="tv-empty">Les matchs à venir apparaîtront ici.</div>';
    elTvPodium.innerHTML      = "";
    elTvRankingGrid.innerHTML = "";
    return;
  }

  var currentInfo = getMatchesAndRestForRound(state.currentRoulement);
  var matches = currentInfo.matches;
  if (!matches.length) {
    elTvCurrentList.innerHTML = '<div class="tv-empty">Pas assez d’équipes pour générer des matchs sur ce roulement.</div>';
  } else {
    var htmlCurrent = "";
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      var key = resultKey(state.currentRoulement, m.terrain);
      var res = state.results[key] || null;
      var tagText = res ? "Score validé" : "À jouer";
      var emoji = res ? "✅" : "🎾";
      htmlCurrent += '<div class="tv-match-card">' +
          '<div class="tv-match-top"><span>Terrain ' + m.terrain +
          ' • ' + escapeHtml(m.label) + '</span><span>' + emoji +
          ' ' + tagText + '</span></div>' +
          '<div class="tv-match-teams">' +
            '<div class="tv-match-team-line">' +
              '<span class="tv-match-team-name">' + escapeHtml(m.teamA.name) + '</span>' +
              '<span class="tv-match-tag">VS</span>' +
            '</div>' +
            '<div class="tv-match-team-line">' +
              '<span class="tv-match-team-name">' + escapeHtml(m.teamB.name) + '</span>' +
              '<span class="tv-match-tag">⭐</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }
    elTvCurrentList.innerHTML = htmlCurrent;
  }

  if (state.currentRoulement >= state.maxRoulements) {
    elTvNextList.innerHTML = '<div class="tv-empty">Fin de la soirée 👋 Merci à tous les joueurs !</div>';
  } else if (state.teamCount === 16) {
    var nextRoundIndex16 = state.currentRoulement + 1;
    var preview16 = getMatchesAndRestForRound(nextRoundIndex16);
    var nextMatches16 = preview16.matches;
    if (!nextMatches16.length) {
      elTvNextList.innerHTML = '<div class="tv-empty">Les matchs du prochain roulement seront visibles dès que le moteur aura suffisamment d\'infos.</div>';
    } else {
      var htmlNext16 = "";
      for (var j = 0; j < nextMatches16.length; j++) {
        var nm = nextMatches16[j];
        htmlNext16 += '<div class="tv-match-card tv-match-card-next">' +
            '<div class="tv-match-top"><span>Terrain ' + nm.terrain +
            '</span><span>⏭ À venir</span></div>' +
            '<div class="tv-match-teams">' +
              '<div class="tv-match-team-line">' +
                '<span class="tv-match-team-name">' + escapeHtml(nm.teamA.name) + '</span>' +
                '<span class="tv-match-tag">VS</span>' +
              '</div>' +
              '<div class="tv-match-team-line">' +
                '<span class="tv-match-team-name">' + escapeHtml(nm.teamB.name) + '</span>' +
                '<span class="tv-match-tag">🎯</span>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
      elTvNextList.innerHTML = htmlNext16;
    }
  } else {
    var allResultsKnown = true;
    for (var r = 0; r < matches.length; r++) {
      var keyCheck = resultKey(state.currentRoulement, matches[r].terrain);
      if (!state.results[keyCheck]) {
        allResultsKnown = false;
        break;
      }
    }

    if (!matches.length) {
      elTvNextList.innerHTML = '<div class="tv-empty">Les prochains matchs seront visibles dès que des matchs seront planifiés.</div>';
    } else if (!allResultsKnown) {
      var htmlNextPlaceholder = "";
      for (var t = 0; t < matches.length; t++) {
        var mt = matches[t];
        htmlNextPlaceholder += '' +
          '<div class="tv-match-card tv-match-card-next">' +
            '<div class="tv-match-top">' +
              '<span>Terrain ' + mt.terrain + '</span>' +
              '<span>🔄 En attente de résultats</span>' +
            '</div>' +
            '<div class="tv-match-teams">' +
              '<div class="tv-match-team-line">' +
                '<span class="tv-match-team-name">Vainqueur du T' + mt.terrain + '</span>' +
                '<span class="tv-match-tag">↑ monte</span>' +
              '</div>' +
              '<div class="tv-match-team-line">' +
                '<span class="tv-match-team-name">Perdant du T' + mt.terrain + '</span>' +
                '<span class="tv-match-tag">↓ descend</span>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
      elTvNextList.innerHTML = htmlNextPlaceholder;
    } else {
      var nextRoundIndex = state.currentRoulement + 1;
      var preview = getMatchesAndRestForRound(nextRoundIndex);
      var nextMatches = preview.matches;
      if (!nextMatches.length) {
        elTvNextList.innerHTML = '<div class="tv-empty">Les matchs du prochain roulement seront calculés après les résultats.</div>';
      } else {
        var htmlNext = "";
        for (var j2 = 0; j2 < nextMatches.length; j2++) {
          var nm2 = nextMatches[j2];
          htmlNext += '<div class="tv-match-card tv-match-card-next">' +
              '<div class="tv-match-top"><span>Terrain ' + nm2.terrain +
              '</span><span>⏭ À venir</span></div>' +
              '<div class="tv-match-teams">' +
                '<div class="tv-match-team-line">' +
                  '<span class="tv-match-team-name">' + escapeHtml(nm2.teamA.name) + '</span>' +
                  '<span class="tv-match-tag">VS</span>' +
                '</div>' +
                '<div class="tv-match-team-line">' +
                  '<span class="tv-match-team-name">' + escapeHtml(nm2.teamB.name) + '</span>' +
                  '<span class="tv-match-tag">🎯</span>' +
                '</div>' +
              '</div>' +
            '</div>';
        }
        elTvNextList.innerHTML = htmlNext;
      }
    }
  }

  var statsCopy = getSortedStatsForRanking();
  var anyMatch = statsCopy.some(function (s) { return s.matches > 0; });
  if (!anyMatch) {
    elTvPodium.innerHTML = "";
    elTvRankingGrid.innerHTML = '<div class="tv-empty">Le classement apparaîtra dès les premiers résultats.</div>';
    return;
  }

  var podium = statsCopy.slice(0, 3);
  var labels = ["🥇 1er", "🥈 2e", "🥉 3e"];
  var podiumHtml = "";
  for (var p = 0; p < podium.length; p++) {
    var sP = podium[p];
    podiumHtml += '<div class="tv-podium-item">' +
        '<div class="tv-podium-rank">' + labels[p] + '</div>' +
        '<div class="tv-podium-name">' + escapeHtml(sP.name) + '</div>' +
        '<div class="tv-podium-points">' + sP.points + ' pts • ' +
          sP.wins + 'V / ' + sP.losses + 'D</div>' +
      '</div>';
  }
  elTvPodium.innerHTML = podiumHtml;

  var restRank = statsCopy.slice(3);
  if (!restRank.length) {
    elTvRankingGrid.innerHTML = "";
  } else {
    var gridHtml = "";
    for (var x = 0; x < restRank.length; x++) {
      var sR = restRank[x];
      var posR = x + 4;
      gridHtml += '<div class="tv-ranking-item">' +
          '<span class="tv-ranking-pos">' + posR + '.</span>' +
          '<span class="tv-ranking-name">' + escapeHtml(sR.name) + '</span>' +
          '<span class="tv-ranking-points">' + sR.points + ' pts</span>' +
          '<span class="tv-ranking-record">' + sR.wins + 'V/' + sR.losses + 'D</span>' +
        '</div>';
    }
    elTvRankingGrid.innerHTML = gridHtml;
  }
}

/* UTILS */
function getConsecutivePlays(teamId, beforeRound) {
  var count = 0;
  for (var r = beforeRound; r >= 1; r--) {
    var rec = state.pairings[r];
    if (!rec) break;
    var played = false;
    for (var i = 0; i < rec.matches.length; i++) {
      var m = rec.matches[i];
      if (m.teamAId === teamId || m.teamBId === teamId) { played = true; break; }
    }
    if (played) count++; else break;
  }
  return count;
}

function resultKey(r, t) { return "R" + r + "-T" + t; }

function findTeamById(id) {
  for (var i = 0; i < state.teams.length; i++) if (state.teams[i].id === id) return state.teams[i];
  return null;
}

function findStatById(id) {
  for (var i = 0; i < state.stats.length; i++) if (state.stats[i].id === id) return state.stats[i];
  return null;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c] || c;
  });
}

/* COLLAPSIBLE CARDS */
function enableCardCollapsing() {
  var cards = document.querySelectorAll('#admin-root .card');
  cards.forEach(function(card){
    if (card.dataset.collapseApplied) return;
    card.dataset.collapseApplied = "1";
    card.style.position = card.style.position || "relative";
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '−';
    btn.title = 'Réduire';
    btn.className = 'collapse-toggle';
    btn.style.position = 'absolute';
    btn.style.top = '8px';
    btn.style.right = '8px';
    btn.style.background = 'transparent';
    btn.style.border = 'none';
    btn.style.color = 'var(--blue-soft)';
    btn.style.fontSize = '1.1rem';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', function(){
      toggleCardCollapse(card, btn);
    });
    card.insertBefore(btn, card.firstChild);
  });
}

function toggleCardCollapse(card, btn) {
  var collapsed = card.dataset.collapsed === '1';
  setCardCollapsed(card, btn, !collapsed);
}

function setCardCollapsed(card, btn, collapsed) {
  card.dataset.collapsed = collapsed ? '1' : '0';
  btn.textContent = collapsed ? '+' : '−';
  var children = Array.prototype.slice.call(card.children);
  children.forEach(function(child){
    if (child === btn) return;
    if (child.tagName && child.tagName.toLowerCase() === 'h2') return;
    if (collapsed) {
      child.dataset.prevDisplay = child.style.display;
      child.style.display = 'none';
    } else {
      child.style.display = child.dataset.prevDisplay || '';
    }
  });
}

/* HISTORY */
function ensureHistoryUI() {
  var adminRoot = document.getElementById('admin-root');
  if (!adminRoot) return;
  if (document.getElementById('md-history-card')) return;

  var card = document.createElement('div');
  card.className = 'card';
  card.id = 'md-history-card';
  card.style.marginTop = '12px';

  var title = document.createElement('h2');
  title.textContent = 'Historique M/D';
  card.appendChild(title);

  var info = document.createElement('p');
  info.className = 'small-muted';
  info.textContent = 'Sauvegarde et rechargement rapides des configurations M/D.';
  card.appendChild(info);

  var actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '6px';
  actions.style.flexWrap = 'wrap';
  actions.style.alignItems = 'center';

  var saveBtn = document.createElement('button');
  saveBtn.id = 'md-btn-save-history';
  saveBtn.className = 'btn';
  saveBtn.textContent = '💾 Sauvegarder la M/D';
  saveBtn.addEventListener('click', handleSaveHistory);
  actions.appendChild(saveBtn);

  card.appendChild(actions);

  var list = document.createElement('div');
  list.id = 'md-history-list';
  list.className = 'card';
  list.style.marginTop = '8px';
  list.style.background = 'transparent';
  list.style.border = '1px dashed var(--border)';
  card.appendChild(list);

  adminRoot.appendChild(card);
  renderHistoryList();
}

function getHistoryEntries() {
  try {
    var raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveHistoryEntries(entries) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)); } catch (e) { /* ignore */ }
}

function handleSaveHistory() {
  if (!state.teamCount || !state.teams.length) { alert('Configure et lance une M/D avant de sauvegarder.'); return; }
  var label = prompt('Nom de la sauvegarde ?', state.name || 'Montante/Descendante');
  if (!label) return;
  var entries = getHistoryEntries();
  var snapshot = {
    label: label,
    savedAt: Date.now(),
    state: JSON.parse(JSON.stringify(state))
  };
  entries.unshift(snapshot);
  saveHistoryEntries(entries);
  renderHistoryList();
}

function renderHistoryList() {
  var list = document.getElementById('md-history-list');
  if (!list) return;
  var entries = getHistoryEntries();
  if (!entries.length) {
    list.innerHTML = '<div class="empty">Aucune sauvegarde pour l’instant.</div>';
    return;
  }

  list.innerHTML = '';
  entries.forEach(function(entry, idx){
    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.gap = '6px';
    row.style.padding = '6px 8px';
    row.style.borderBottom = '1px solid var(--border)';

    var left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';
    var title = document.createElement('strong');
    title.textContent = entry.label || 'Sauvegarde';
    var meta = document.createElement('span');
    meta.className = 'small-muted';
    var date = new Date(entry.savedAt || Date.now());
    meta.textContent = date.toLocaleString();
    left.appendChild(title);
    left.appendChild(meta);

    var actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';

    var loadBtn = document.createElement('button');
    loadBtn.className = 'btn btn-secondary btn-small';
    loadBtn.textContent = 'Charger';
    loadBtn.addEventListener('click', function(){
      loadHistoryEntry(entry);
    });

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-secondary btn-small';
    deleteBtn.textContent = 'Supprimer';
    deleteBtn.addEventListener('click', function(){
      if (!confirm('Supprimer cette sauvegarde ?')) return;
      var refreshed = getHistoryEntries();
      refreshed.splice(idx,1);
      saveHistoryEntries(refreshed);
      renderHistoryList();
    });

    actions.appendChild(loadBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(left);
    row.appendChild(actions);
    list.appendChild(row);
  });
}

function loadHistoryEntry(entry) {
  if (!entry || !entry.state) return;
  var snap = entry.state;
  state.name = snap.name || '';
  state.teamCount = snap.teamCount || 0;
  state.maxRoulements = snap.maxRoulements || 0;
  state.currentRoulement = snap.currentRoulement || 1;
  state.teams = Array.isArray(snap.teams) ? snap.teams : [];
  state.stats = Array.isArray(snap.stats) ? snap.stats : [];
  state.results = snap.results || {};
  state.pairings = snap.pairings || {};

  if (elName) elName.value = state.name;
  if (elTeamCount) elTeamCount.value = String(state.teamCount);
  if (elMaxRoulements) elMaxRoulements.value = String(state.maxRoulements);

  renderTeamsEditor();
  if (state.teams.length) {
    elTournamentSection.style.display = 'block';
    elBtnStart.disabled = false;
  }
  updateTopBar();
  renderRound();
  renderRanking();
  renderTvView();
  window.scrollTo(0, elTournamentSection.offsetTop - 10);
}
window.mdRenderTvView = renderTvView;
})();
