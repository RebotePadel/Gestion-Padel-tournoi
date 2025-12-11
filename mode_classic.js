(function(){
  'use strict';

  var btnOpenClassic = document.getElementById('btn-open-classic');
  var btnBackFormats = document.getElementById('btn-back-formats-from-classic');
  var btnClassicHome = document.getElementById('btn-back-home-from-classic');

  function openClassic() {
    if (typeof window.showClassic === 'function') {
      window.showClassic();
    } else {
      if (typeof window.hideAllSections === 'function') window.hideAllSections();
      var classicRoot = document.getElementById('classic-root');
      if (classicRoot) classicRoot.style.display = 'block';
      window.scrollTo(0,0);
    }
  }

  function backToFormats() {
    if (typeof window.showTournaments === 'function') {
      window.showTournaments();
    } else if (typeof window.hideAllSections === 'function') {
      window.hideAllSections();
      var formats = document.getElementById('tournaments-root');
      if (formats) formats.style.display = 'block';
    }
  }

  function backHome() {
    if (typeof window.showHome === 'function') {
      window.showHome();
    } else if (typeof window.hideAllSections === 'function') {
      window.hideAllSections();
      var home = document.getElementById('home-root');
      if (home) home.style.display = 'block';
    }
  }

  if (btnOpenClassic) btnOpenClassic.addEventListener('click', openClassic);
  if (btnBackFormats) btnBackFormats.addEventListener('click', backToFormats);
  if (btnClassicHome) btnClassicHome.addEventListener('click', backHome);

    const POOLS = ["A","B","C","D"];
    // Séparation explicite de l’historique du mode classique
    const HISTORY_KEY = "brainbox_tournament_history_classic";

    const state = {
      name: "",
      teams: [],           // {id, name}
      pools: {},           // A,B,C,D -> [teamId...]
      poolMatches: [],     // {id, pool, teamA, teamB, index}
      poolResults: {},     // matchId -> {winnerId, gamesA, gamesB}
      bracketsReady: false,
      bracketResults: {},  // "main-QF1" -> {winnerId, loserId}
      finalRanking: [],
      setsPerMatch: 3,
      gamesPerSet: 6,
      poolTerrains: { A:null, B:null, C:null, D:null },
      bracketTerrains: {},
      teamCount: 16,
      poolCount: 4,
      finalFormat: "16-main-conso",
      logo: ""
    };

    /* DOM */
    const elTournamentName    = document.getElementById("tournament-name");
    const elHeaderTournament  = document.getElementById("header-tournament-name");
    const elAdminSubtitle     = document.getElementById("admin-subtitle");
    const elTeamsGrid         = document.getElementById("teams-grid");
    const elBtnRandomNames    = document.querySelector("#classic-root #btn-random-names");
    const elBtnGeneratePools  = document.getElementById("btn-generate-pools");
    const elConfigInfo        = document.getElementById("config-info");
    const elSetsPerMatch      = document.getElementById("sets-per-match");
    const elGamesPerSet       = document.getElementById("games-per-set");
    const elTeamCount         = document.getElementById("team-count");
    const elTerrainA          = document.getElementById("terrain-pool-A");
    const elTerrainB          = document.getElementById("terrain-pool-B");
    const elTerrainC          = document.getElementById("terrain-pool-C");
    const elTerrainD          = document.getElementById("terrain-pool-D");

    const elPoolsGrid         = document.getElementById("pools-grid");
    const elPoolsStatus       = document.getElementById("pools-status");
    const elBtnGenerateBr     = document.getElementById("btn-generate-brackets");
    const elBtnRandomPools    = document.getElementById("btn-random-pools");
    const elBtnSaveHistory    = document.getElementById("btn-save-history");
    const elHistoryList       = document.getElementById("history-list");

    const elBracketMainContainer = document.getElementById("bracket-main-container");
    const elBracketConsoContainer= document.getElementById("bracket-conso-container");
    const elBracketsStatus    = document.getElementById("brackets-status");
    const elFinalRankingBox   = document.getElementById("final-ranking-container");
    const elFinalRankingList  = document.getElementById("final-ranking-list");
    const elClassementPhrase  = document.getElementById("classement-phrase");
    const elClassementMessage = document.getElementById("classement-message");
    const elClassementPodium  = document.getElementById("classement-podium");

    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels  = document.querySelectorAll(".tab-panel");

    // Logo
    const elLogoUpload   = document.getElementById("logo-upload");
    const elLogoPreview  = document.getElementById("logo-preview");
    const elLogoHelper   = document.getElementById("logo-helper");
    const elHomeLogoUpload  = document.getElementById("home-logo-upload");
    const elHomeLogoPreview = document.getElementById("home-logo-preview");
    const elHomeLogoHelper  = document.getElementById("home-logo-helper");

    // TV
    const elTvOverlay     = document.getElementById("tv-overlay");
    const elBtnOpenTv     = document.getElementById("btn-open-tv");
    const elBtnCloseTv    = document.getElementById("btn-close-tv");
    const elTvTitle       = document.getElementById("tv-title");
    const elTvSubtitle    = document.getElementById("tv-subtitle");
    const elTvPhaseTag    = document.getElementById("tv-phase-tag");
    const elTvMain        = document.querySelector(".tv-main");
    const elTvLeftTitle   = document.getElementById("tv-left-title");
    const elTvRightTitle  = document.getElementById("tv-right-title");
    const elTvLeftList    = document.getElementById("tv-left-list");
    const elTvRightList   = document.getElementById("tv-right-list");
    const elTvLogo        = document.getElementById("tv-logo");
    const elTvBracketRow  = document.getElementById("tv-bracket-row");
    const elTvMainTree    = document.getElementById("tv-main-bracket-tree");
    const elTvConsoTree   = document.getElementById("tv-conso-bracket-tree");
    const elTvFinalRanking= document.getElementById("tv-final-ranking");

    /* INIT TEAMS INPUTS */
    function initTeamsInputs() {
      const fragment = document.createDocumentFragment();
      for (let i = 1; i <= state.teamCount; i++) {
        const row = document.createElement("div");
        row.className = "team-input-row";
        const label = document.createElement("div");
        label.className = "team-label";
        label.textContent = i + ".";
        const input = document.createElement("input");
        input.type = "text";
        input.dataset.teamIndex = i-1;
        input.placeholder = "Équipe " + i;
        input.value = "";
        row.appendChild(label);
        row.appendChild(input);
        fragment.appendChild(row);
      }
      elTeamsGrid.innerHTML = "";
      elTeamsGrid.appendChild(fragment);
    }
    initTeamsInputs();

    elTeamCount.value = String(state.teamCount);
    refreshSubtitles();

    elTeamCount.addEventListener("change", () => {
      const previousValues = Array.from(elTeamsGrid.querySelectorAll("input[data-team-index]"), inp => inp.value);
      const selected = parseInt(elTeamCount.value, 10);
      state.teamCount = Math.min(Math.max(selected, 8), 24);
      state.poolCount = computePoolCount(state.teamCount);
      state.finalFormat = state.teamCount >= 12 ? "16-main-conso" : "8-main";
      initTeamsInputs();
      const inputs = elTeamsGrid.querySelectorAll("input[data-team-index]");
      inputs.forEach((inp, idx) => {
        if (previousValues[idx]) inp.value = previousValues[idx];
      });
      elConfigInfo.textContent = `Prévu pour ${state.teamCount} équipes (${state.poolCount} poules).`;
      refreshSubtitles();
    });

    /* HELPERS */
    function computePoolCount(teamCount) {
      if (teamCount <= 8) return 2;
      if (teamCount <= 12) return 3;
      return 4;
    }

    function getOverallSeeding() {
      const entries = [];
      const activePools = getActivePools();

      activePools.forEach(pool => {
        const stats = getPoolStats(pool);
        if (stats.length) {
          stats.forEach((s, idx) => {
            entries.push({
              teamId: s.teamId,
              pool,
              pos: idx + 1,
              wins: s.wins,
              gamesFor: s.gamesFor,
              gamesAgainst: s.gamesAgainst
            });
          });
        } else {
          const ids = state.pools[pool] || [];
          ids.forEach((id, idx) => {
            entries.push({
              teamId: id,
              pool,
              pos: idx + 1,
              wins: 0,
              gamesFor: 0,
              gamesAgainst: 0
            });
          });
        }
      });

      entries.sort((a, b) => {
        if (a.pos !== b.pos) return a.pos - b.pos;
        if (b.wins !== a.wins) return b.wins - a.wins;
        const diffA = a.gamesFor - a.gamesAgainst;
        const diffB = b.gamesFor - b.gamesAgainst;
        if (diffB !== diffA) return diffB - diffA;
        if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor;
        return a.teamId - b.teamId;
      });

      return entries.map(e => e.teamId);
    }

    function getActivePools() {
      return POOLS.slice(0, state.poolCount || POOLS.length);
    }

    function distributeTeamsAcrossPools(teams, poolCount) {
      const poolNames = POOLS.slice(0, poolCount);
      const pools = {};
      poolNames.forEach(p => pools[p] = []);

      const baseSize = Math.floor(teams.length / poolCount);
      const extra = teams.length % poolCount;
      const targetSizes = poolNames.map((_, idx) => baseSize + (idx < extra ? 1 : 0));

      let cursor = 0;
      teams.forEach(team => {
        while (pools[poolNames[cursor]].length >= targetSizes[cursor]) {
          cursor = (cursor + 1) % poolCount;
        }
        pools[poolNames[cursor]].push(team.id);
        cursor = (cursor + 1) % poolCount;
      });

      return pools;
    }

    function ensureTeamsFromInputs() {
      const inputs = elTeamsGrid.querySelectorAll("input[data-team-index]");
      const teams = [];
      inputs.forEach((inp, idx) => {
        const id = idx + 1;
        const nameRaw = (inp.value || "").trim();
        teams.push({ id, name: nameRaw || ("Équipe " + id) });
      });
      state.teams = teams;
      state.teamCount = teams.length;
      return teams;
    }

    function findTeamById(id) {
      return state.teams.find(t => t.id === id) || null;
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, c => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
      }[c] || c));
    }

    function rankLabel(pos) {
      if (pos === 1) return "1er";
      return pos + "e";
    }

    function getTournamentSubtitle() {
      const total = state.teamCount || 16;
      return `Poules + tableaux • ${total} équipes`;
    }

    function refreshSubtitles() {
      const label = getTournamentSubtitle();
      if (elTvSubtitle) elTvSubtitle.textContent = label;
      if (elAdminSubtitle) {
        const poolsLabel = state.poolCount ? `${state.poolCount} poules` : "";
        elAdminSubtitle.textContent = poolsLabel ? `${label} • ${poolsLabel}` : label;
      }
    }

    function getTerrainForPool(pool) {
      if (!getActivePools().includes(pool)) return null;
      return state.poolTerrains[pool] || null;
    }

    function setTabEnabled(tabName, enabled) {
      tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabName) {
          if (enabled) btn.classList.remove("disabled");
          else btn.classList.add("disabled");
        }
      });
    }

    function showTab(tabName) {
      tabButtons.forEach(btn => {
        const isTarget = btn.dataset.tab === tabName;
        if (isTarget) btn.classList.add("active");
        else btn.classList.remove("active");
      });

      tabPanels.forEach(panel => {
        const id = panel.id.replace("tab-","");
        if (id === tabName) panel.classList.add("active");
        else panel.classList.remove("active");
      });
    }

    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("disabled")) return;
        const tab = btn.dataset.tab;
        showTab(tab);
      });
    });

    function setLogoSource(src) {
      const finalSrc = src || "";
      state.logo = finalSrc;

      if (elLogoPreview) {
        elLogoPreview.src = finalSrc;
        elLogoPreview.style.display = finalSrc ? "block" : "none";
      }

      if (elHomeLogoPreview) {
        elHomeLogoPreview.src = finalSrc;
        elHomeLogoPreview.style.display = finalSrc ? "block" : "none";
      }

      const classicRoot = document.getElementById("classic-root");
      const tvLogos = classicRoot ? Array.from(classicRoot.querySelectorAll("#tv-logo")) : [];
      if (!tvLogos.length && elTvLogo) tvLogos.push(elTvLogo);
      tvLogos.forEach(img => {
        if (finalSrc) {
          img.src = finalSrc;
          img.style.height = "72px";
          img.style.width = "72px";
          img.style.display = "block";
        } else {
          img.style.display = "none";
          img.removeAttribute("src");
        }
      });

      const appLogo = document.getElementById("app-logo");
      if (appLogo) {
        if (finalSrc) {
          appLogo.src = finalSrc;
          appLogo.style.display = "block";
        } else {
          appLogo.removeAttribute("src");
          appLogo.style.display = "none";
        }
      }

      updateLogoHelper();
    }

    function updateLogoHelper() {
      const hasLogo = !!state.logo;
      const poolsReady = state.poolMatches && state.poolMatches.length > 0;
      if (elLogoHelper) elLogoHelper.style.display = hasLogo && poolsReady ? "none" : "block";
      if (elHomeLogoHelper) elHomeLogoHelper.style.display = hasLogo ? "none" : "block";
    }

    /* LOGO UPLOAD */
    function bindLogoUpload(input) {
      if (!input) return;
      input.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          setLogoSource(ev.target.result);
        };
        reader.readAsDataURL(file);
      });
    }

    bindLogoUpload(elHomeLogoUpload);

    /* RANDOM NAMES */
    if (elBtnRandomNames) {
      elBtnRandomNames.addEventListener("click", () => {
        const baseNames = [
          "Smash & Co","Padel Kings","Rebote Squad","Ace Hunters","Blue Court","Los Lobos",
          "Night Session","Padel Crew","Volley Time","Padel Legends","Smash Attack","Team Bandeja",
          "Chiquita Gang","Padel Stars","Center Court","Last Minute"
        ];
        const inputs = elTeamsGrid.querySelectorAll("input[data-team-index]");
        inputs.forEach((inp, idx) => {
          const name = baseNames[idx % baseNames.length] + " #" + (idx + 1);
          inp.value = name;
        });
        ensureTeamsFromInputs();
        elConfigInfo.textContent = "Noms aléatoires appliqués. Tu peux modifier à la main si besoin.";
      });
    }

    /* GENERATE POOLS */
    elBtnGeneratePools.addEventListener("click", () => {
      state.name = (elTournamentName.value || "").trim() || "Tournoi de padel";
      elHeaderTournament.textContent = state.name.toUpperCase();

      ensureTeamsFromInputs();
      state.teamCount = state.teams.length;
      state.poolCount = computePoolCount(state.teamCount);
      state.finalFormat = state.teamCount >= 12 ? "16-main-conso" : "8-main";
      refreshSubtitles();
      if (state.teamCount < 8 || state.teamCount > 24 || state.teamCount % 2 !== 0) {
        alert("Merci de choisir un nombre d’équipes pair entre 8 et 24.");
        return;
      }

      state.setsPerMatch = parseInt(elSetsPerMatch.value,10) || 3;
      state.gamesPerSet = parseInt(elGamesPerSet.value,10) || 6;

      state.poolTerrains = {
        A: elTerrainA.value || null,
        B: elTerrainB.value || null,
        C: elTerrainC.value || null,
        D: elTerrainD.value || null
      };

      // Reset state
      state.poolResults = {};
      state.bracketResults = {};
      state.finalRanking = [];
      state.bracketsReady = false;
      elFinalRankingBox.style.display = "none";
      elFinalRankingList.innerHTML = "";

      state.pools = distributeTeamsAcrossPools(state.teams, state.poolCount);

      generatePoolMatches();
      updateLogoHelper();
      renderPools();
      elBtnGenerateBr.disabled = !areAllPoolMatchesDone();
      elPoolsStatus.textContent = "Étape 1/3 : Poules en cours";
      elBracketMainContainer.innerHTML = '<div class="empty">Les tableaux apparaîtront après la validation de tous les matchs de poules.</div>';
      elBracketConsoContainer.innerHTML = '<div class="empty">Les tableaux apparaîtront après la validation de tous les matchs de poules.</div>';
      elBracketsStatus.textContent = "Étape 2/3 : Tableaux à générer";

      elConfigInfo.textContent = "Poules générées. Saisis les scores de chaque match de poule.";
      setTabEnabled("poules", true);
      showTab("poules");
      updateTv();
    });

    /* POOL MATCH GENERATION – OPTIMIZED ORDER */
    function generatePoolMatches() {
      state.poolMatches = [];
      let matchIdCounter = 1;
      for (const pool of getActivePools()) {
        const ids = state.pools[pool];
        if (!ids || ids.length < 2) continue;

        const rawMatches = [];
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            rawMatches.push({
              pool,
              teamA: ids[i],
              teamB: ids[j]
            });
          }
        }

        const ordered = orderMatchesWithStreakLimit(rawMatches);
        ordered.forEach((m, idx) => {
          state.poolMatches.push({
            id: "P" + matchIdCounter++,
            pool,
            teamA: m.teamA,
            teamB: m.teamB,
            index: idx + 1
          });
        });
      }
    }

    function orderMatchesWithStreakLimit(matches) {
      const remaining = [...matches];
      const ordered = [];
      let lastParticipants = new Set();
      let streak = {};

      while (remaining.length) {
        let pickIndex = remaining.findIndex(m => {
          const participants = [m.teamA, m.teamB];
          return participants.every(t => (lastParticipants.has(t) ? (streak[t] || 1) + 1 : 1) <= 2);
        });

        if (pickIndex === -1) {
          // Aucun match ne respecte la contrainte : on réinitialise la série pour débloquer la rotation
          lastParticipants = new Set();
          streak = {};
          pickIndex = 0;
        }

        const [next] = remaining.splice(pickIndex, 1);
        ordered.push(next);

        const participants = [next.teamA, next.teamB];
        const newStreak = {};
        participants.forEach(t => {
          newStreak[t] = lastParticipants.has(t) ? (streak[t] || 1) + 1 : 1;
        });
        lastParticipants = new Set(participants);
        streak = newStreak;
      }

      return ordered;
    }


    function randomizeAllPoolResults() {
      if (!state.poolMatches.length) return;
      const maxGames = state.setsPerMatch * state.gamesPerSet;
      state.poolMatches.forEach(m => {
        let a = Math.floor(Math.random() * (maxGames + 1));
        let b = Math.floor(Math.random() * (maxGames + 1));
        if (a === b) {
          if (a < maxGames) a++;
          else if (b > 0) b--;
        }
        const winnerId = a > b ? m.teamA : m.teamB;
        state.poolResults[m.id] = { winnerId, gamesA:a, gamesB:b };
      });
      renderPools();
      const done = areAllPoolMatchesDone();
      elBtnGenerateBr.disabled = !done;
      if (done) {
        elPoolsStatus.textContent = "Étape 1/3 : Poules terminées ✅";
        elConfigInfo.textContent = "Tous les matchs de poule ont un résultat. Tu peux générer les tableaux.";
      } else {
        elConfigInfo.textContent = "Résultats en cours de saisie dans les poules...";
      }
      updateTv();
    }

    function getPoolMatches(pool) {
      return state.poolMatches.filter(m => m.pool === pool);
    }

    function getPoolStats(pool) {
      const ids = state.pools[pool] || [];
      const stats = ids.map(id => ({
        teamId: id,
        wins: 0,
        losses: 0,
        matches: 0,
        gamesFor: 0,
        gamesAgainst: 0
      }));

      for (const m of getPoolMatches(pool)) {
        const res = state.poolResults[m.id];
        if (!res) continue;
        const {winnerId, gamesA, gamesB} = res;
        const a = stats.find(s => s.teamId === m.teamA);
        const b = stats.find(s => s.teamId === m.teamB);
        if (!a || !b) continue;

        a.matches++; b.matches++;
        a.gamesFor += gamesA;
        a.gamesAgainst += gamesB;
        b.gamesFor += gamesB;
        b.gamesAgainst += gamesA;

        if (winnerId === m.teamA) {
          a.wins++; b.losses++;
        } else {
          b.wins++; a.losses++;
        }
      }

      stats.sort((a,b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor;
        if (a.matches !== b.matches) return a.matches - b.matches;
        return a.teamId - b.teamId;
      });

      return stats;
    }

    function getPoolRankingWithPositions(pool) {
      const stats = getPoolStats(pool);
      if (!stats.length) {
        const ids = state.pools[pool] || [];
        return ids.map((id, idx) => ({ pos: idx+1, teamId: id }));
      }
      return stats.map((s, index) => ({
        pos: index+1,
        teamId: s.teamId
      }));
    }

    function areAllPoolMatchesDone() {
      const total = state.poolMatches.length;
      const done = Object.keys(state.poolResults).length;
      return total > 0 && done === total;
    }

    function getTeamPoolPlace(teamId) {
      for (const pool of getActivePools()) {
        const ranking = getPoolRankingWithPositions(pool);
        const entry = ranking.find(r => r.teamId === teamId);
        if (entry) return entry.pos;
      }
      return null;
    }

    /* RENDER POULES */
    function renderPools() {
      const activePools = getActivePools();
      if (!activePools.length || activePools.some(p => !state.pools[p] || !state.pools[p].length)) {
        elPoolsGrid.innerHTML = '<div class="empty">Commence par générer les poules dans l’onglet Configuration.</div>';
        return;
      }
      const frag = document.createDocumentFragment();

      const themeByPool = { A:"theme-A", B:"theme-B", C:"theme-C", D:"theme-D" };

      for (const pool of activePools) {
        const card = document.createElement("article");
        card.className = "pool-card " + themeByPool[pool];

        // Header avec collapse
        const header = document.createElement("div");
        header.className = "pool-card-header";

        const titleBlock = document.createElement("div");
        const title = document.createElement("div");
        title.className = "pool-title";
        title.textContent = "Poule " + pool;
        const subtitle = document.createElement("div");
        subtitle.className = "pool-subtitle";
        const terr = getTerrainForPool(pool);
        subtitle.textContent = terr ? ("Terrain " + terr) : "Terrain non attribué";
        titleBlock.appendChild(title);
        titleBlock.appendChild(subtitle);

        header.appendChild(titleBlock);

        const tools = document.createElement("div");
        tools.style.display = "flex";
        tools.style.gap = "6px";
        tools.style.alignItems = "center";

        const chip = document.createElement("span");
        chip.className = "badge";
        const teamCount = (state.pools[pool] || []).length;
        const matchCount = teamCount > 1 ? (teamCount * (teamCount - 1)) / 2 : 0;
        chip.textContent = `${teamCount} équipes • ${matchCount} matchs`;
        tools.appendChild(chip);

        const collapse = document.createElement("button");
        collapse.className = "collapse-toggle";
        const bodyId = "pool-body-" + pool;
        collapse.dataset.target = bodyId;
        collapse.textContent = "−";
        tools.appendChild(collapse);

        header.appendChild(tools);
        card.appendChild(header);

        const body = document.createElement("div");
        body.id = bodyId;
        body.className = "card-body";

        // Classement
        const rankingDiv = document.createElement("div");
        rankingDiv.className = "pool-ranking";

        const stats = getPoolStats(pool);
        const ids = state.pools[pool];
        const baseList = stats.length ? stats : ids.map(id => ({
          teamId: id,
          wins:0, losses:0, matches:0, gamesFor:0, gamesAgainst:0
        }));

        baseList.forEach((s, index) => {
          const row = document.createElement("div");
          row.className = "pool-ranking-row";

          const pos = document.createElement("span");
          pos.className = "pool-ranking-pos";
          pos.textContent = (index+1) + ".";

          const name = document.createElement("span");
          name.className = "pool-ranking-name";
          const team = findTeamById(s.teamId);
          name.textContent = team ? team.name : ("Équipe " + s.teamId);

          const pts = document.createElement("span");
          pts.className = "pool-ranking-points";
          const points = s.wins * 3;
          pts.textContent = points + " pts";

          row.appendChild(pos);
          row.appendChild(name);
          row.appendChild(pts);
          rankingDiv.appendChild(row);
        });

        body.appendChild(rankingDiv);

        // Prochain match
        const matches = getPoolMatches(pool);
        const nextMatch = matches.find(m => !state.poolResults[m.id]);
        const nextDiv = document.createElement("div");
        nextDiv.className = "pool-next";

        if (nextMatch) {
          const teamA = findTeamById(nextMatch.teamA);
          const teamB = findTeamById(nextMatch.teamB);
          const titleNext = document.createElement("div");
          titleNext.className = "pool-next-title";
          titleNext.textContent = "Prochain match : Match " + nextMatch.index;
          nextDiv.appendChild(titleNext);

          const line = document.createElement("div");
          line.className = "pool-next-line";

          const nA = document.createElement("span");
          nA.className = "pool-next-name";
          nA.textContent = teamA ? teamA.name : ("Équipe " + nextMatch.teamA);

          const vs = document.createElement("span");
          vs.textContent = "VS";
          vs.style.color = "#e5e7eb";
          vs.style.fontWeight = "700";

          const nB = document.createElement("span");
          nB.className = "pool-next-name";
          nB.textContent = teamB ? teamB.name : ("Équipe " + nextMatch.teamB);

          line.appendChild(nA);
          line.appendChild(vs);
          line.appendChild(nB);
          nextDiv.appendChild(line);

          const note = document.createElement("div");
          note.className = "pool-next-note";
          note.textContent = "Saisis le score dans la liste des matchs pour actualiser le classement.";
          nextDiv.appendChild(note);
        } else {
          const titleNext = document.createElement("div");
          titleNext.className = "pool-next-title";
          titleNext.textContent = "Tous les matchs de poule ont été joués ✅";
          nextDiv.appendChild(titleNext);
        }

        body.appendChild(nextDiv);

        // Bouton liste des matchs
        const toggleLine = document.createElement("div");
        toggleLine.className = "pool-matches-toggle";

        const info = document.createElement("span");
        info.className = "small-muted";
        info.textContent = "Clique sur la liste pour gérer les 6 matchs de cette poule.";
        toggleLine.appendChild(info);

        const btnList = document.createElement("button");
        btnList.className = "btn btn-small btn-secondary";
        btnList.textContent = "📋 Liste des matchs";
        const listId = "pool-matches-" + pool;
        btnList.dataset.targetList = listId;
        toggleLine.appendChild(btnList);

        body.appendChild(toggleLine);

        // Liste des matchs
        const listDiv = document.createElement("div");
        listDiv.id = listId;
        listDiv.className = "pool-matches-list";

        matches.forEach(m => {
          const row = document.createElement("div");
          row.className = "pool-match-row";
          const existing = state.poolResults[m.id];
          if (existing) row.classList.add("played");

          const headerRow = document.createElement("div");
          headerRow.className = "pool-match-header";

          const title = document.createElement("span");
          title.className = "pool-match-title";
          title.textContent = "Match " + m.index;

          const badge = document.createElement("span");
          badge.className = "badge";
          badge.textContent = "Poule " + pool + (getTerrainForPool(pool) ? (" • Terrain " + getTerrainForPool(pool)) : "");

          headerRow.appendChild(title);
          headerRow.appendChild(badge);
          row.appendChild(headerRow);

          const teamsRow = document.createElement("div");
          teamsRow.className = "pool-match-teams";

          const teamA = findTeamById(m.teamA);
          const teamB = findTeamById(m.teamB);

          const spanA = document.createElement("span");
          spanA.className = "pool-match-team-name";
          spanA.textContent = teamA ? teamA.name : ("Équipe " + m.teamA);

          const spanB = document.createElement("span");
          spanB.className = "pool-match-team-name";
          spanB.textContent = teamB ? teamB.name : ("Équipe " + m.teamB);

          const vsWrap = document.createElement("div");
          vsWrap.style.display = "flex";
          vsWrap.style.justifyContent = "space-between";
          vsWrap.style.gap = "4px";

          vsWrap.appendChild(spanA);
          const vs = document.createElement("span");
          vs.textContent = "VS";
          vs.style.color = "#e5e7eb";
          vs.style.fontWeight = "700";
          vsWrap.appendChild(vs);
          vsWrap.appendChild(spanB);

          teamsRow.appendChild(vsWrap);
          row.appendChild(teamsRow);

          // Scores (A - B)
          const scoreRow = document.createElement("div");
          scoreRow.className = "pool-match-score";

          const inputA = document.createElement("input");
          inputA.type = "number";
          inputA.className = "pool-score-input";
          inputA.min = "0";
          inputA.max = String(state.setsPerMatch * state.gamesPerSet);
          inputA.dataset.matchId = m.id;
          inputA.dataset.teamSide = "A";

          const sep = document.createElement("span");
          sep.className = "pool-score-separator";
          sep.textContent = "-";

          const inputB = document.createElement("input");
          inputB.type = "number";
          inputB.className = "pool-score-input";
          inputB.min = "0";
          inputB.max = String(state.setsPerMatch * state.gamesPerSet);
          inputB.dataset.matchId = m.id;
          inputB.dataset.teamSide = "B";

          if (existing) {
            inputA.value = existing.gamesA;
            inputB.value = existing.gamesB;
          }

          scoreRow.appendChild(inputA);
          scoreRow.appendChild(sep);
          scoreRow.appendChild(inputB);
          row.appendChild(scoreRow);

          // Actions
          const actions = document.createElement("div");
          actions.className = "pool-match-actions";

          const btnSave = document.createElement("button");
          btnSave.className = "btn btn-small btn-secondary";
          btnSave.textContent = "💾 Enregistrer le résultat";
          btnSave.dataset.role = "save-score";
          btnSave.dataset.matchId = m.id;
          actions.appendChild(btnSave);

          if (existing) {
            const btnReset = document.createElement("button");
            btnReset.className = "btn btn-small btn-ghost";
            btnReset.textContent = "↩ Modifier / annuler";
            btnReset.dataset.role = "reset-score";
            btnReset.dataset.matchId = m.id;
            actions.appendChild(btnReset);
          }

          row.appendChild(actions);

          const status = document.createElement("div");
          status.className = "status-line";

          if (existing) {
            const wTeam = findTeamById(existing.winnerId);
            status.textContent = "Match joué : " +
              existing.gamesA + " - " + existing.gamesB +
              " • Vainqueur : " + (wTeam ? wTeam.name : ("Équipe " + existing.winnerId));
          } else {
            status.textContent = "En attente de résultat";
          }

          row.appendChild(status);
          listDiv.appendChild(row);
        });

        body.appendChild(listDiv);
        card.appendChild(body);
        frag.appendChild(card);
      }

      elPoolsGrid.innerHTML = "";
      elPoolsGrid.appendChild(frag);

      attachCollapseHandlers();
      attachPoolListToggleHandlers();
      attachScoreSaveHandlers();
      attachScoreResetHandlers();
    }

    function attachPoolListToggleHandlers() {
      const buttons = document.querySelectorAll("button[data-target-list]");
      buttons.forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.targetList;
          const list = document.getElementById(id);
          if (!list) return;
          const isHidden = list.style.display === "none";
          list.style.display = isHidden ? "block" : "none";
          btn.textContent = isHidden ? "📋 Masquer les matchs" : "📋 Liste des matchs";
        };
      });
    }

    function attachScoreSaveHandlers() {
      const buttons = document.querySelectorAll("button[data-role='save-score']");
      buttons.forEach(btn => {
        btn.onclick = () => {
          const matchId = btn.dataset.matchId;
          const inputs = document.querySelectorAll("input[data-match-id='" + matchId + "']");
          let gamesA = null, gamesB = null;
          inputs.forEach(inp => {
            const v = parseInt(inp.value,10);
            if (inp.dataset.teamSide === "A") gamesA = isNaN(v) ? null : v;
            else gamesB = isNaN(v) ? null : v;
          });
          if (gamesA === null || gamesB === null) {
            alert("Merci de saisir les jeux gagnés par chaque équipe.");
            return;
          }
          const maxGames = state.setsPerMatch * state.gamesPerSet;
          if (gamesA < 0 || gamesB < 0 || gamesA > maxGames || gamesB > maxGames) {
            alert("Le nombre de jeux doit être compris entre 0 et " + maxGames + ".");
            return;
          }
          if (gamesA === gamesB) {
            alert("Il doit y avoir un vainqueur (pas d’égalité sur les jeux).");
            return;
          }
          const match = state.poolMatches.find(m => m.id === matchId);
          if (!match) return;
          const winnerId = gamesA > gamesB ? match.teamA : match.teamB;
          state.poolResults[matchId] = { winnerId, gamesA, gamesB };

          renderPools();
          const done = areAllPoolMatchesDone();
          elBtnGenerateBr.disabled = !done;
          if (done) {
            elPoolsStatus.textContent = "Étape 1/3 : Poules terminées ✅";
            elConfigInfo.textContent = "Toutes les poules sont terminées. Tu peux générer les tableaux.";
          } else {
            elConfigInfo.textContent = "Résultats en cours de saisie dans les poules...";
          }
          updateTv();
        };
      });
    }

    function attachScoreResetHandlers() {
      const buttons = document.querySelectorAll("button[data-role='reset-score']");
      buttons.forEach(btn => {
        btn.onclick = () => {
          const matchId = btn.dataset.matchId;
          delete state.poolResults[matchId];
          renderPools();
          elBtnGenerateBr.disabled = !areAllPoolMatchesDone();
          elPoolsStatus.textContent = "Étape 1/3 : Poules en cours";
          state.bracketsReady = false;
          elBracketsStatus.textContent = "Étape 2/3 : Tableaux à générer";
          elBracketMainContainer.innerHTML = '<div class="empty">Les tableaux apparaîtront après la validation de tous les matchs de poules.</div>';
          elBracketConsoContainer.innerHTML = '<div class="empty">Les tableaux apparaîtront après la validation de tous les matchs de poules.</div>';
          state.bracketResults = {};
          state.finalRanking = [];
          elFinalRankingBox.style.display = "none";
          elFinalRankingList.innerHTML = "";
          setTabEnabled("main", false);
          setTabEnabled("conso", false);
          updateTv();
        };
      });
    }

    if (elBtnRandomPools) {
      elBtnRandomPools.addEventListener("click", () => {
        if (!state.poolMatches.length) {
          alert("Les poules ne sont pas encore générées.");
          return;
        }
        if (confirm("Générer des scores aléatoires pour tous les matchs de poules ?")) {
          randomizeAllPoolResults();
        }
      });
    }

    /* COLLAPSE HANDLERS */
    function attachCollapseHandlers() {
      const buttons = document.querySelectorAll(".collapse-toggle");
      buttons.forEach(btn => {
        btn.onclick = () => {
          const targetId = btn.dataset.target;
          if (!targetId) return;
          const body = document.getElementById(targetId);
          if (!body) return;
          const isHidden = body.style.display === "none";
          body.style.display = isHidden ? "block" : "none";
          btn.textContent = isHidden ? "−" : "+";
        };
      });
    }

    /* BRACKETS */
    elBtnGenerateBr.addEventListener("click", () => {
      if (!areAllPoolMatchesDone()) {
        alert("Il faut d’abord terminer tous les matchs de poule.");
        return;
      }
      buildBrackets();
      autoAssignBracketTerrains();
      renderBrackets();
      elBracketsStatus.textContent = "Étape 2/3 : Tableaux en cours";
      state.bracketsReady = true;
      setTabEnabled("main", true);
      setTabEnabled("conso", Object.keys(getBracketMatchDef("conso")).length > 0);
      updateTv();
    });

    function getBracketMatchDef(bracketType) {
      if (state.finalFormat === "8-main") {
        if (bracketType === "main") {
          return {
            QF1: { label: "Quart 1", seeds: [1,8] },
            QF2: { label: "Quart 2", seeds: [4,5] },
            QF3: { label: "Quart 3", seeds: [2,7] },
            QF4: { label: "Quart 4", seeds: [3,6] },

            SF1: { label: "Demi 1", winnersOf: ["QF1","QF2"] },
            SF2: { label: "Demi 2", winnersOf: ["QF3","QF4"] },

            FINAL: { label: "Finale", winnersOf: ["SF1","SF2"] },
            SMALL_FINAL: { label: "Match 3e place", losersOf: ["SF1","SF2"] },

            PLACE_5_6: { label: "Match 5/6", losersOf: ["QF1","QF2"] },
            PLACE_7_8: { label: "Match 7/8", losersOf: ["QF3","QF4"] }
          };
        }

        if (state.teamCount > 8) {
          const extraMatches = {};
          if (state.teamCount >= 10) {
            extraMatches.PLACE_9_10 = { label: "Match 9/10", seeds: [9,10] };
          }
          return extraMatches;
        }
        return {};
      }

      const main = {
        QF1: { label: "Quart 1", seeds: [1,8] },
        QF2: { label: "Quart 2", seeds: [4,5] },
        QF3: { label: "Quart 3", seeds: [2,7] },
        QF4: { label: "Quart 4", seeds: [3,6] },

        SF1: { label: "Demi 1", winnersOf: ["QF1","QF2"] },
        SF2: { label: "Demi 2", winnersOf: ["QF3","QF4"] },

        FINAL: { label: "Finale", winnersOf: ["SF1","SF2"] },
        SMALL_FINAL: { label: "Match 3e place", losersOf: ["SF1","SF2"] },

        PLACE_5_6: { label: "Match 5/6", losersOf: ["QF1","QF2"] },
        PLACE_7_8: { label: "Match 7/8", losersOf: ["QF3","QF4"] }
      };

      const conso = {};

      if (state.teamCount >= 16) {
        Object.assign(conso, {
          QF1: { label: "Quart 1", seeds: [9,16] },
          QF2: { label: "Quart 2", seeds: [12,13] },
          QF3: { label: "Quart 3", seeds: [10,15] },
          QF4: { label: "Quart 4", seeds: [11,14] },

          SF1: { label: "Demi 1", winnersOf: ["QF1","QF2"] },
          SF2: { label: "Demi 2", winnersOf: ["QF3","QF4"] },

          FINAL: { label: "Finale consolante", winnersOf: ["SF1","SF2"] },
          SMALL_FINAL: { label: "Match 11/12", losersOf: ["SF1","SF2"] },

          PLACE_13_14: { label: "Match 13/14", losersOf: ["QF1","QF2"] },
          PLACE_15_16: { label: "Match 15/16", losersOf: ["QF3","QF4"] }
        });
      } else if (state.teamCount >= 12) {
        Object.assign(conso, {
          SF1: { label: "Demi 1", seeds: [9,12] },
          SF2: { label: "Demi 2", seeds: [10,11] },
          FINAL: { label: "Finale consolante", winnersOf: ["SF1","SF2"] },
          SMALL_FINAL: { label: "Match 11/12", losersOf: ["SF1","SF2"] }
        });
      }

      return bracketType === "main" ? main : conso;
    }

    function buildBrackets() {
      state.bracketResults = {};
    }

    function autoAssignBracketTerrains() {
      const mainDef = getBracketMatchDef("main");
      const consoDef = getBracketMatchDef("conso");
      const mainTerrains = ["1","2"];
      const consoTerrains = ["3","4"];
      state.bracketTerrains = state.bracketTerrains || {};
      let i = 0;
      Object.keys(mainDef).forEach(key => {
        const id = "main-" + key;
        if (!state.bracketTerrains[id]) {
          state.bracketTerrains[id] = mainTerrains[i % mainTerrains.length];
          i++;
        }
      });
      i = 0;
      Object.keys(consoDef).forEach(key => {
        const id = "conso-" + key;
        if (!state.bracketTerrains[id]) {
          state.bracketTerrains[id] = consoTerrains[i % consoTerrains.length];
          i++;
        }
      });
    }

    function resolvePoolPlace(code) {
      const pos = parseInt(code[0],10);
      const pool = code[1];
      const ranking = getPoolRankingWithPositions(pool);
      const entry = ranking.find(r => r.pos === pos);
      return entry ? entry.teamId : null;
    }

    function getBracketResult(bracketType, matchKey) {
      const id = bracketType + "-" + matchKey;
      return state.bracketResults[id] || null;
    }

    function setBracketWinner(bracketType, matchKey, winnerId) {
      const [team1, team2] = getBracketMatchTeams(bracketType, matchKey);
      if (!team1 || !team2) return;
      const loserId = winnerId === team1 ? team2 : team1;
      const id = bracketType + "-" + matchKey;
      state.bracketResults[id] = { winnerId, loserId };
      renderBrackets();
      updateFinalRankingIfComplete();
      updateTv();
    }

    function clearBracketResultCascade(bracketType, matchKey) {
      const defMap = getBracketMatchDef(bracketType);

      function clearRecursive(key) {
        const id = bracketType + "-" + key;
        if (state.bracketResults[id]) {
          delete state.bracketResults[id];
        }
        // Trouver les matchs qui dépendent de ce key
        for (const [k, def] of Object.entries(defMap)) {
          if (def.winnersOf && def.winnersOf.includes(key)) {
            clearRecursive(k);
          }
          if (def.losersOf && def.losersOf.includes(key)) {
            clearRecursive(k);
          }
        }
      }

      clearRecursive(matchKey);
      state.finalRanking = [];
      elFinalRankingBox.style.display = "none";
      elFinalRankingList.innerHTML = "";
      elBracketsStatus.textContent = "Étape 2/3 : Tableaux en cours";
    }

    function getBracketMatchTeams(bracketType, matchKey) {
      const defMap = getBracketMatchDef(bracketType);
      const def = defMap[matchKey];
      if (!def) return [null,null];

      if (def.from) {
        const t1 = resolvePoolPlace(def.from[0]);
        const t2 = resolvePoolPlace(def.from[1]);
        return [t1, t2];
      }

      if (def.seeds) {
        const seeding = getOverallSeeding();
        const t1 = seeding[def.seeds[0] - 1] || null;
        const t2 = seeding[def.seeds[1] - 1] || null;
        return [t1, t2];
      }

      function teamFromPrev(source, wl) {
        const res = getBracketResult(bracketType, source);
        if (!res) return null;
        return wl === "winner" ? res.winnerId : res.loserId;
      }

      if (def.winnersOf) {
        const t1 = teamFromPrev(def.winnersOf[0], "winner");
        const t2 = teamFromPrev(def.winnersOf[1], "winner");
        return [t1, t2];
      }

    if (def.losersOf) {
      const t1 = teamFromPrev(def.losersOf[0], "loser");
      const t2 = teamFromPrev(def.losersOf[1], "loser");
      return [t1, t2];
    }

    return [null,null];
  }

  function buildBracketTree(bracketType, defMap, extraClass = "") {
    const keys = Object.keys(defMap);
    if (!keys.length) return null;

    const tree = document.createElement("div");
    tree.className = "bracket-tree" + (extraClass ? " " + extraClass : "");

    const stages = [
      { label: "Quarts de finale", keys: ["QF1","QF2","QF3","QF4"], rowClass: "stage-qf-row", stageClass: "stage-qf" },
      { label: "Demies",          keys: ["SF1","SF2"],                    rowClass: "stage-sf-row", stageClass: "stage-sf" },
      { label: "Finale",          keys: ["FINAL"],                         rowClass: "stage-final-row", stageClass: "stage-final final-node" }
    ];

    stages.forEach(stage => {
      const availableKeys = stage.keys.filter(k => defMap[k]);
      if (!availableKeys.length) return;

      const block = document.createElement("div");
      block.className = "bracket-stage-block " + stage.rowClass + "-block";

      const title = document.createElement("div");
      title.className = "bracket-column-title";
      title.textContent = stage.label;
      block.appendChild(title);

      const row = document.createElement("div");
      row.className = "bracket-stage-row " + stage.rowClass;

      availableKeys.forEach((key, idx) => {
        const stageClass = stage.stageClass + (stage.rowClass === "stage-sf-row" ? (idx === 0 ? " sf-top" : " sf-bottom") : "");
        row.appendChild(renderBracketMatch(bracketType, key, defMap, stageClass));
      });

      block.appendChild(row);
      tree.appendChild(block);
    });

    return tree;
  }

  function renderBrackets() {
      if (!areAllPoolMatchesDone()) {
        elBracketMainContainer.innerHTML = '<div class="empty">Les tableaux apparaîtront après la validation de tous les matchs de poules.</div>';
        elBracketConsoContainer.innerHTML = '<div class="empty">Les tableaux apparaîtront après la validation de tous les matchs de poules.</div>';
        return;
      }

      const mainDef = getBracketMatchDef("main");
      const consoDef = getBracketMatchDef("conso");

      // ================= TABLEAU PRINCIPAL =================
      const mainCard = document.createElement("article");
      mainCard.className = "bracket-card";
      const mainTitle = document.createElement("div");
      mainTitle.className = "bracket-title";
      mainTitle.innerHTML = '<span>Tableau principal</span><span class="badge">1–8</span>';
      mainCard.appendChild(mainTitle);

      const mainTree = buildBracketTree("main", mainDef);
      if (mainTree) mainCard.appendChild(mainTree);

      const mainPlacementCard = document.createElement("article");
      mainPlacementCard.className = "bracket-card";
      const mainPlacementTitle = document.createElement("div");
      mainPlacementTitle.className = "bracket-title";
      mainPlacementTitle.innerHTML = '<span>Matchs de classement (1–8)</span>';
      mainPlacementCard.appendChild(mainPlacementTitle);

      const mainPlacementBody = document.createElement("div");
      ["SMALL_FINAL","PLACE_5_6","PLACE_7_8"].forEach(key => {
        const stageClass = key === "SMALL_FINAL" ? "stage-small-final" : "stage-placement";
        mainPlacementBody.appendChild(renderBracketMatch("main", key, mainDef, stageClass));
      });
      mainPlacementCard.appendChild(mainPlacementBody);

      elBracketMainContainer.innerHTML = "";
      elBracketMainContainer.appendChild(mainCard);
      elBracketMainContainer.appendChild(mainPlacementCard);

      // ================= TABLEAU CONSOLANTE / CLASSEMENT =================
      const consoKeys = Object.keys(consoDef);
      if (!consoKeys.length) {
        elBracketConsoContainer.innerHTML = '<div class="empty">Ce format utilise uniquement le tableau principal.</div>';
      } else {
        const consoCard = document.createElement("article");
        consoCard.className = "bracket-card";
        const consoTitle = document.createElement("div");
        consoTitle.className = "bracket-title";
        const consoRange = state.teamCount >= 16 ? "9–16" : "9–12";
        const consoLabel = state.teamCount >= 12 ? "Tableau consolante" : "Classement complémentaire";
        consoTitle.innerHTML = `<span>${consoLabel}</span><span class="badge">${consoRange}</span>`;
        consoCard.appendChild(consoTitle);

        const consoTree = buildBracketTree("conso", consoDef);

        if (consoTree) {
          consoCard.appendChild(consoTree);

          const consoPlacementCard = document.createElement("article");
          consoPlacementCard.className = "bracket-card";
          const consoPlacementTitle = document.createElement("div");
          consoPlacementTitle.className = "bracket-title";
          consoPlacementTitle.innerHTML = `<span>Matchs de classement (${consoRange})</span>`;
          consoPlacementCard.appendChild(consoPlacementTitle);

          const consoPlacementBody = document.createElement("div");
          ["SMALL_FINAL","PLACE_13_14","PLACE_15_16"].forEach(key => {
            if (!consoDef[key]) return;
            const stageClass = key === "SMALL_FINAL" ? "stage-small-final" : "stage-placement";
            consoPlacementBody.appendChild(renderBracketMatch("conso", key, consoDef, stageClass));
          });
          consoPlacementCard.appendChild(consoPlacementBody);

          elBracketConsoContainer.innerHTML = "";
          elBracketConsoContainer.appendChild(consoCard);
          if (consoPlacementBody.childNodes.length) {
            elBracketConsoContainer.appendChild(consoPlacementCard);
          }
        } else {
          const consoPlacementBody = document.createElement("div");
          consoPlacementBody.style.display = "flex";
          consoPlacementBody.style.flexDirection = "column";
          consoPlacementBody.style.gap = "12px";
          consoKeys.forEach(key => {
            consoPlacementBody.appendChild(renderBracketMatch("conso", key, consoDef, "stage-placement"));
          });
          consoCard.appendChild(consoPlacementBody);
          elBracketConsoContainer.innerHTML = "";
          elBracketConsoContainer.appendChild(consoCard);
        }
      }

      attachCollapseHandlers();
    }

    function renderBracketMatch(bracketType, key, defMap, stageClass) {
      const def = defMap[key];
      const [team1Id, team2Id] = getBracketMatchTeams(bracketType, key);
      const res = getBracketResult(bracketType, key);
      const matchId = bracketType + "-" + key;

      const row = document.createElement("article");
      row.className = "bracket-match-row " + stageClass;
      if (res) row.classList.add("played");

      const teamsDiv = document.createElement("div");
      teamsDiv.className = "bracket-match-teams";

      const labelFromId = (id) => {
        if (!id) return "En attente de résultat précédent…";
        const team = findTeamById(id);
        return team ? team.name : ("Équipe " + id);
      };

      const label1 = labelFromId(team1Id);
      const label2 = labelFromId(team2Id);

      const header = document.createElement("div");
      header.className = "bracket-match-header";
      header.innerHTML = `<span>${def.label} ; ${label1} vs ${label2}</span><span class="badge">${key}</span>`;
      row.appendChild(header);

      const line1 = document.createElement("div");
      line1.className = "bracket-team-line";
      const name1 = document.createElement("span");
      name1.className = "bracket-team-name";

      if (team1Id) {
        const isWinner = res && res.winnerId === team1Id;
        if (isWinner) name1.classList.add("bracket-team-winner");
        name1.textContent = label1;
      } else {
        name1.textContent = label1;
        name1.style.color = "#9ca3af";
      }
      line1.appendChild(name1);

      const line2 = document.createElement("div");
      line2.className = "bracket-team-line";
      const name2 = document.createElement("span");
      name2.className = "bracket-team-name";

      if (team2Id) {
        const isWinner = res && res.winnerId === team2Id;
        if (isWinner) name2.classList.add("bracket-team-winner");
        name2.textContent = label2;
      } else {
        name2.textContent = label2;
        name2.style.color = "#9ca3af";
      }
      line2.appendChild(name2);

      teamsDiv.appendChild(line1);
      teamsDiv.appendChild(line2);
      row.appendChild(teamsDiv);

      const terrainLine = document.createElement("div");
      terrainLine.className = "status-line";
      terrainLine.style.display = "flex";
      terrainLine.style.justifyContent = "space-between";
      terrainLine.style.alignItems = "center";
      terrainLine.style.marginTop = "4px";

      const terrainLabel = document.createElement("span");
      terrainLabel.textContent = "Terrain :";

      const terrainSelect = document.createElement("select");
      terrainSelect.style.width = "140px";
      terrainSelect.style.borderRadius = "999px";
      terrainSelect.style.border = "1px solid #1e293b";
      terrainSelect.style.background = "#020617";
      terrainSelect.style.color = "#f9fafb";
      terrainSelect.style.padding = "2px 6px";
      terrainSelect.style.fontSize = "11px";

      const terrainOptions = bracketType === "main" ? ["1","2"] : ["3","4"];
      let currentTerrain = state.bracketTerrains[matchId];
      if (!currentTerrain) {
        currentTerrain = bracketType === "main" ? terrainOptions[0] : terrainOptions[0];
        state.bracketTerrains[matchId] = currentTerrain;
      }
      terrainOptions.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = "Terrain " + t;
        if (t === currentTerrain) opt.selected = true;
        terrainSelect.appendChild(opt);
      });

      terrainSelect.addEventListener("change", () => {
        state.bracketTerrains[matchId] = terrainSelect.value;
        updateTv();
      });

      terrainLine.appendChild(terrainLabel);
      terrainLine.appendChild(terrainSelect);
      row.appendChild(terrainLine);

      const status = document.createElement("div");
      status.className = "status-line";

      if (!team1Id || !team2Id) {
        status.textContent = "Match bloqué tant que les matchs précédents ne sont pas terminés.";
        row.appendChild(status);
        return row;
      }

      if (res) {
        const wTeam = findTeamById(res.winnerId);
        status.textContent = "Vainqueur : " + (wTeam ? wTeam.name : ("Équipe " + res.winnerId));
        row.appendChild(status);

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.justifyContent = "flex-end";
        actions.style.gap = "6px";
        actions.style.marginTop = "4px";

        const btnReset = document.createElement("button");
        btnReset.className = "btn btn-small btn-ghost";
        btnReset.textContent = "↩ Modifier / annuler";
        btnReset.addEventListener("click", () => {
          clearBracketResultCascade(bracketType, key);
          renderBrackets();
          updateTv();
        });

        actions.appendChild(btnReset);
        row.appendChild(actions);
      } else {
        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.justifyContent = "flex-end";
        actions.style.gap = "6px";
        actions.style.marginTop = "4px";

        const btn1 = document.createElement("button");
        btn1.className = "btn btn-small btn-secondary";
        btn1.textContent = "✅ " + (findTeamById(team1Id)?.name || "Équipe " + team1Id);
        btn1.addEventListener("click", () => setBracketWinner(bracketType, key, team1Id));

        const btn2 = document.createElement("button");
        btn2.className = "btn btn-small btn-secondary";
        btn2.textContent = "✅ " + (findTeamById(team2Id)?.name || "Équipe " + team2Id);
        btn2.addEventListener("click", () => setBracketWinner(bracketType, key, team2Id));

        actions.appendChild(btn1);
        actions.appendChild(btn2);
        row.appendChild(actions);

        status.textContent = "En attente de résultat";
        row.appendChild(status);
      }

      return row;
    }

    function updateFinalRankingIfComplete() {
      if (!state.bracketsReady) return;

      const defMain = getBracketMatchDef("main");
      const defConso = getBracketMatchDef("conso");

      const playable = (type, defMap) => Object.keys(defMap).filter(k => {
        const [t1, t2] = getBracketMatchTeams(type, k);
        return t1 && t2;
      });

      const allDoneMain = playable("main", defMain).every(k => !!getBracketResult("main", k));
      const allDoneConso = playable("conso", defConso).every(k => !!getBracketResult("conso", k));

      if (!allDoneMain || !allDoneConso) return;

      const ranking = [];

      const finalMain = getBracketResult("main","FINAL");
      const smallMain = getBracketResult("main","SMALL_FINAL");
      const p5_6 = getBracketResult("main","PLACE_5_6");
      const p7_8 = getBracketResult("main","PLACE_7_8");

      if (finalMain) {
        ranking.push({ pos:1, teamId: finalMain.winnerId });
        ranking.push({ pos:2, teamId: finalMain.loserId });
      }
      if (smallMain) {
        ranking.push({ pos:3, teamId: smallMain.winnerId });
        ranking.push({ pos:4, teamId: smallMain.loserId });
      }
      if (p5_6) {
        ranking.push({ pos:5, teamId: p5_6.winnerId });
        ranking.push({ pos:6, teamId: p5_6.loserId });
      }
      if (p7_8) {
        ranking.push({ pos:7, teamId: p7_8.winnerId });
        ranking.push({ pos:8, teamId: p7_8.loserId });
      }

      if (Object.keys(defConso).length) {
        const finalConso = getBracketResult("conso","FINAL");
        const smallConso = getBracketResult("conso","SMALL_FINAL");
        const p13_14 = getBracketResult("conso","PLACE_13_14");
        const p15_16 = getBracketResult("conso","PLACE_15_16");
        const p9_10 = getBracketResult("conso","PLACE_9_10");

        if (finalConso) {
          const base = state.teamCount >= 16 ? 9 : 9;
          ranking.push({ pos:base, teamId: finalConso.winnerId });
          ranking.push({ pos:base+1, teamId: finalConso.loserId });
        }
        if (smallConso) {
          const baseSmall = state.teamCount >= 16 ? 11 : 11;
          ranking.push({ pos:baseSmall, teamId: smallConso.winnerId });
          ranking.push({ pos:baseSmall+1, teamId: smallConso.loserId });
        }
        if (p13_14) {
          ranking.push({ pos:13, teamId: p13_14.winnerId });
          ranking.push({ pos:14, teamId: p13_14.loserId });
        }
        if (p15_16) {
          ranking.push({ pos:15, teamId: p15_16.winnerId });
          ranking.push({ pos:16, teamId: p15_16.loserId });
        }
        if (p9_10) {
          ranking.push({ pos:9, teamId: p9_10.winnerId });
          ranking.push({ pos:10, teamId: p9_10.loserId });
        }
      }

      const used = new Set(ranking.map(r => r.teamId));
      const extras = [];
      getActivePools().forEach(pool => {
        getPoolRankingWithPositions(pool).forEach(entry => {
          if (!used.has(entry.teamId)) extras.push(entry.teamId);
        });
      });

      let pos = ranking.length + 1;
      extras.forEach(id => ranking.push({ pos: pos++, teamId: id }));

      if (ranking.length) {
        state.finalRanking = ranking;
        renderFinalRanking();
        setTabEnabled("classement", true);
        showTab("classement");
      }
    }

    function renderFinalRanking() {
      if (!state.finalRanking || !state.finalRanking.length) return;

      elFinalRankingBox.style.display = "block";
      const rankingTitle = document.getElementById("final-ranking-title");
      if (rankingTitle) rankingTitle.textContent = `Classement complet (1 → ${state.finalRanking.length})`;
      state.finalRanking.sort((a,b) => a.pos - b.pos);

      const frag = document.createDocumentFragment();
      state.finalRanking.forEach(entry => {
        const team = findTeamById(entry.teamId);
        const row = document.createElement("div");
        row.className = "final-ranking-row";
        const posSpan = document.createElement("span");
        posSpan.className = "final-ranking-pos";
        posSpan.textContent = entry.pos + ".";
        const nameSpan = document.createElement("span");
        nameSpan.className = "final-ranking-name";
        nameSpan.textContent = team ? team.name : ("Équipe " + entry.teamId);
        row.appendChild(posSpan);
        row.appendChild(nameSpan);
        frag.appendChild(row);
      });
      elFinalRankingList.innerHTML = "";
      elFinalRankingList.appendChild(frag);

      if (elClassementPodium) {
        elClassementPodium.innerHTML = "";
        const getByPos = (p) => state.finalRanking.find(r => r.pos === p) || null;
        const first  = getByPos(1);
        const second = getByPos(2);
        const third  = getByPos(3);

        const cols = [];

        const col2 = document.createElement("div");
        col2.className = "podium-col podium-col--second";
        const emoji2 = document.createElement("div");
        emoji2.className = "podium-emoji";
        emoji2.textContent = "🥈";
        const rank2 = document.createElement("div");
        rank2.className = "podium-rank";
        rank2.textContent = "2e";
        const name2 = document.createElement("div");
        name2.className = "podium-name";
        name2.textContent = second ? (findTeamById(second.teamId)?.name || ("Équipe " + second.teamId)) : "-";
        col2.appendChild(emoji2);
        col2.appendChild(rank2);
        col2.appendChild(name2);
        cols.push(col2);

        const col1 = document.createElement("div");
        col1.className = "podium-col podium-col--first";
        const emoji1 = document.createElement("div");
        emoji1.className = "podium-emoji";
        emoji1.textContent = "🏆";
        const rank1 = document.createElement("div");
        rank1.className = "podium-rank";
        rank1.textContent = "1er";
        const name1 = document.createElement("div");
        name1.className = "podium-name";
        name1.textContent = first ? (findTeamById(first.teamId)?.name || ("Équipe " + first.teamId)) : "-";
        col1.appendChild(emoji1);
        col1.appendChild(rank1);
        col1.appendChild(name1);
        cols.push(col1);

        const col3 = document.createElement("div");
        col3.className = "podium-col podium-col--third";
        const emoji3 = document.createElement("div");
        emoji3.className = "podium-emoji";
        emoji3.textContent = "🥇";
        const rank3 = document.createElement("div");
        rank3.className = "podium-rank";
        rank3.textContent = "3e";
        const name3 = document.createElement("div");
        name3.className = "podium-name";
        name3.textContent = third ? (findTeamById(third.teamId)?.name || ("Équipe " + third.teamId)) : "-";
        col3.appendChild(emoji3);
        col3.appendChild(rank3);
        col3.appendChild(name3);
        cols.push(col3);

        cols.forEach(c => elClassementPodium.appendChild(c));
      }

      elBracketsStatus.textContent = "Étape 3/3 : Tournoi terminé ✅";
    }

    /* VUE TV */
    elBtnOpenTv.addEventListener("click", () => {
      elTvOverlay.style.display = "block";
      updateTv();
    });

    elBtnCloseTv.addEventListener("click", () => {
      elTvOverlay.style.display = "none";
    });

    function updateTv() {
      const name = state.name || "Tournoi de padel";
      elTvTitle.textContent = name.toUpperCase();
      refreshSubtitles();

      const hasFinalRanking = state.finalRanking && state.finalRanking.length > 0;
      const finalsDone = hasFinalRanking;

      if (finalsDone) {
        elTvPhaseTag.textContent = "CLASSEMENT";
        elTvLeftTitle.textContent = "Classement final";
        elTvRightTitle.textContent = "";
        if (elTvMain) elTvMain.style.display = "none";
        if (elTvBracketRow) elTvBracketRow.style.display = "none";
        if (elTvFinalRanking) {
          elTvFinalRanking.style.display = "block";
          renderTvFinalRanking();
        }
        return;
      } else {
        if (elTvMain) elTvMain.style.display = "grid";
        if (elTvBracketRow) elTvBracketRow.style.display = state.bracketsReady ? "grid" : "none";
        if (elTvFinalRanking) elTvFinalRanking.style.display = "none";
      }

      if (!areAllPoolMatchesDone()) {
        elTvPhaseTag.textContent = "POULES";
        elTvLeftTitle.textContent = "Matchs en cours par terrain";
        elTvRightTitle.textContent = "Prochains matchs par terrain";
        updateTvPoules();
      } else if (!state.bracketsReady) {
        elTvPhaseTag.textContent = "TRANSITION";
        elTvLeftTitle.textContent = "Phase de transition";
        elTvRightTitle.textContent = "Tableaux à générer";
        elTvLeftList.innerHTML = '<div class="empty">Les poules sont terminées. Génère les tableaux pour continuer.</div>';
        elTvRightList.innerHTML = '<div class="empty">En attente de génération des tableaux.</div>';
      } else {
        const hasConso = Object.keys(getBracketMatchDef("conso")).length > 0;
        elTvPhaseTag.textContent = "TABLEAUX";
        elTvLeftTitle.textContent = "Tableau principal – matchs";
        elTvRightTitle.textContent = hasConso ? "Tableau consolante – matchs" : "Matchs de classement";
        updateTvBrackets();
      }
    }

    function updateTvPoules() {
      const currentCards = [];
      const nextCards = [];

      for (const pool of getActivePools()) {
        const terrain = getTerrainForPool(pool);
        if (!terrain) continue;
        const matches = getPoolMatches(pool);
        const pending = matches.filter(m => !state.poolResults[m.id]);
        if (!pending.length) continue;

        const currentMatch = pending[0];
        const nextMatch = pending[1] || null;

        const addCard = (match, list) => {
          const teamA = findTeamById(match.teamA);
          const teamB = findTeamById(match.teamB);
          const plA = getTeamPoolPlace(match.teamA);
          const plB = getTeamPoolPlace(match.teamB);
          list.push({
            title: "Terrain " + terrain + " • Poule " + match.pool,
            subtitle: "Match " + match.index,
            teamA: teamA ? teamA.name : ("Équipe " + match.teamA),
            teamB: teamB ? teamB.name : ("Équipe " + match.teamB),
            pool: match.pool,
            teamAId: match.teamA,
            teamBId: match.teamB,
            placeA: plA,
            placeB: plB
          });
        };

        addCard(currentMatch, currentCards);
        if (nextMatch) {
          addCard(nextMatch, nextCards);
        }
      }

      renderTvMatchCards(currentCards, elTvLeftList);
      renderTvMatchCards(nextCards, elTvRightList, "upcoming");
    }

    function updateTvBrackets() {
      const mainDef = getBracketMatchDef("main");
      const consoDef = getBracketMatchDef("conso");

      const mainCards = [];
      const consoCards = [];

      Object.keys(mainDef).forEach(key => {
        const [t1,t2] = getBracketMatchTeams("main", key);
        if (!t1 || !t2) return;
        const res = getBracketResult("main", key);
        if (res) return; // on n’affiche ici que les matchs non joués
        const teamA = findTeamById(t1);
        const teamB = findTeamById(t2);
        const plA = getTeamPoolPlace(t1);
        const plB = getTeamPoolPlace(t2);
        const terrainMain = state.bracketTerrains && state.bracketTerrains["main-" + key] ? state.bracketTerrains["main-" + key] : "1";
        mainCards.push({
          title: mainDef[key].label + " • Terrain " + terrainMain,
          subtitle: key,
          teamA: teamA ? teamA.name : ("Équipe " + t1),
          teamB: teamB ? teamB.name : ("Équipe " + t2),
          pool: null,
          teamAId: t1,
          teamBId: t2,
          placeA: plA,
          placeB: plB
        });
      });

      Object.keys(consoDef).forEach(key => {
        const [t1,t2] = getBracketMatchTeams("conso", key);
        if (!t1 || !t2) return;
        const res = getBracketResult("conso", key);
        if (res) return;
        const teamA = findTeamById(t1);
        const teamB = findTeamById(t2);
        const plA = getTeamPoolPlace(t1);
        const plB = getTeamPoolPlace(t2);
        const terrainConso = state.bracketTerrains && state.bracketTerrains["conso-" + key] ? state.bracketTerrains["conso-" + key] : "3";
        consoCards.push({
          title: consoDef[key].label + " • Terrain " + terrainConso,
          subtitle: key,
          teamA: teamA ? teamA.name : ("Équipe " + t1),
          teamB: teamB ? teamB.name : ("Équipe " + t2),
          pool: null,
          teamAId: t1,
          teamBId: t2,
          placeA: plA,
        placeB: plB
        });
      });

      renderTvMatchCards(mainCards, elTvLeftList);
      renderTvMatchCards(consoCards, elTvRightList);
      renderTvBracketTrees(mainDef, consoDef);
    }

    function renderTvBracketTrees(mainDef, consoDef) {
      if (!elTvBracketRow || !elTvMainTree || !elTvConsoTree) return;
      const visible = state.bracketsReady;
      elTvBracketRow.style.display = visible ? "grid" : "none";
      if (!visible) return;

      const renderStage = (container, defMap, bracketType) => {
        container.innerHTML = "";
        const stageView = buildTvStageView(defMap, bracketType);
        if (stageView) {
          container.appendChild(stageView);
        } else {
          container.innerHTML = '<div class="empty">Aucun arbre disponible.</div>';
        }
      };

      renderStage(elTvMainTree, mainDef, "main");
      renderStage(elTvConsoTree, consoDef, "conso");
    }

    function renderTvFinalRanking() {
      if (!elTvFinalRanking || !state.finalRanking || !state.finalRanking.length) return;
      const frag = document.createDocumentFragment();

      const title = document.createElement("h3");
      title.textContent = "Classement final";
      frag.appendChild(title);

      const podium = document.createElement("div");
      podium.className = "tv-ranking-podium";

      const getByPos = (p) => state.finalRanking.find(r => r.pos === p) || null;
      const podiumDefs = [
        { pos:2, rank:"2e", emoji:"🥈" },
        { pos:1, rank:"1er", emoji:"🏆" },
        { pos:3, rank:"3e", emoji:"🥇" }
      ];

      podiumDefs.forEach(def => {
        const entry = getByPos(def.pos);
        const col = document.createElement("div");
        col.className = "tv-podium-col";
        const em = document.createElement("span");
        em.className = "tv-podium-emoji";
        em.textContent = def.emoji;
        const rk = document.createElement("div");
        rk.className = "tv-podium-rank";
        rk.textContent = def.rank;
        const nm = document.createElement("div");
        nm.className = "tv-podium-name";
        nm.textContent = entry ? (findTeamById(entry.teamId)?.name || ("Équipe " + entry.teamId)) : "-";
        col.appendChild(em);
        col.appendChild(rk);
        col.appendChild(nm);
        podium.appendChild(col);
      });

      frag.appendChild(podium);

      const list = document.createElement("div");
      list.className = "tv-ranking-list";

      state.finalRanking
        .slice()
        .sort((a,b) => a.pos - b.pos)
        .forEach(entry => {
          const row = document.createElement("div");
          row.className = "tv-ranking-row";
          const pos = document.createElement("span");
          pos.className = "tv-ranking-pos";
          pos.textContent = entry.pos + ".";
          const name = document.createElement("span");
          name.textContent = findTeamById(entry.teamId)?.name || ("Équipe " + entry.teamId);
          row.appendChild(pos);
          row.appendChild(name);
          list.appendChild(row);
        });

      frag.appendChild(list);

      elTvFinalRanking.innerHTML = "";
      elTvFinalRanking.appendChild(frag);
    }

    function buildTvStageView(defMap, bracketType) {
      const stageOrder = [
        { key: "QF", label: "Quarts de finale", matches: ["QF1","QF2","QF3","QF4"] },
        { key: "SF", label: "Demi-finales", matches: ["SF1","SF2"] },
        { key: "FINAL", label: "Finale", matches: ["FINAL"] }
      ];

      const pickStage = () => {
        let lastAvailable = null;
        for (const stage of stageOrder) {
          const keys = stage.matches.filter(k => defMap[k]);
          if (!keys.length) continue;
          lastAvailable = stage;
          const hasPending = keys.some(k => !getBracketResult(bracketType, k));
          if (hasPending) return stage;
        }
        return lastAvailable;
      };

      const stage = pickStage();
      if (!stage) return null;

      const keys = stage.matches.filter(k => defMap[k]);
      const view = document.createElement("div");
      view.className = "tv-stage-view";

      const header = document.createElement("div");
      header.className = "tv-stage-header";
      header.textContent = stage.label;
      view.appendChild(header);

      const strip = document.createElement("div");
      strip.className = "tv-stage-strip stage-" + stage.key.toLowerCase();

      keys.forEach(key => {
        const card = renderTvStageCard(bracketType, key, defMap);
        if (card) strip.appendChild(card);
      });

      if (!strip.childNodes.length) return null;
      view.appendChild(strip);
      return view;
    }

    function renderTvStageCard(bracketType, key, defMap) {
      const [t1,t2] = getBracketMatchTeams(bracketType, key);
      if (!t1 || !t2) return null;
      const res = getBracketResult(bracketType, key);
      const def = defMap[key];

      const card = document.createElement("div");
      card.className = "tv-stage-card" + (res ? " played" : "");

      const top = document.createElement("div");
      top.className = "tv-match-top";
      top.innerHTML = `<span>${def.label}</span><span>${key}</span>`;
      card.appendChild(top);

      const teams = document.createElement("div");
      teams.className = "tv-match-teams";

      const line1 = document.createElement("div");
      line1.className = "tv-team-line";
      const name1 = document.createElement("span");
      name1.className = "tv-team-name";
      const teamA = findTeamById(t1);
      name1.textContent = teamA ? teamA.name : "Équipe " + t1;
      if (res && res.winnerId === t1) name1.classList.add("bracket-team-winner");
      const tag1 = document.createElement("span");
      tag1.className = "tv-tag";
      tag1.textContent = res ? (res.winnerId === t1 ? "Vainqueur" : "Défaite") : "VS";
      line1.appendChild(name1);
      line1.appendChild(tag1);

      const line2 = document.createElement("div");
      line2.className = "tv-team-line";
      const name2 = document.createElement("span");
      name2.className = "tv-team-name";
      const teamB = findTeamById(t2);
      name2.textContent = teamB ? teamB.name : "Équipe " + t2;
      if (res && res.winnerId === t2) name2.classList.add("bracket-team-winner");
      const tag2 = document.createElement("span");
      tag2.className = "tv-tag";
      tag2.textContent = res ? (res.winnerId === t2 ? "Vainqueur" : "Défaite") : "🎾";
      line2.appendChild(name2);
      line2.appendChild(tag2);

      teams.appendChild(line1);
      teams.appendChild(line2);
      card.appendChild(teams);

      return card;
    }

    function renderTvMatchCards(cards, container, variant = "current") {
      if (!cards.length) {
        container.innerHTML = '<div class="empty">Aucun match à afficher.</div>';
        return;
      }
      const frag = document.createDocumentFragment();
      cards.forEach(c => {
        const card = document.createElement("div");
        card.className = "tv-match-card" + (variant === "upcoming" ? " upcoming" : "");

        const top = document.createElement("div");
        top.className = "tv-match-top";
        top.innerHTML = `<span>${escapeHtml(c.title)}</span><span>${escapeHtml(c.subtitle)}</span>`;
        card.appendChild(top);

        const teamsDiv = document.createElement("div");
        teamsDiv.className = "tv-match-teams";

        const line1 = document.createElement("div");
        line1.className = "tv-team-line";
        const name1 = document.createElement("span");
        name1.className = "tv-team-name";
        const suffixA = c.placeA ? (" (" + rankLabel(c.placeA) + ")") : "";
        name1.textContent = c.teamA + suffixA;
        const tag1 = document.createElement("span");
        tag1.className = "tv-tag";
        tag1.textContent = "VS";
        line1.appendChild(name1);
        line1.appendChild(tag1);

        const line2 = document.createElement("div");
        line2.className = "tv-team-line";
        const name2 = document.createElement("span");
        name2.className = "tv-team-name";
        const suffixB = c.placeB ? (" (" + rankLabel(c.placeB) + ")") : "";
        name2.textContent = c.teamB + suffixB;
        const tag2 = document.createElement("span");
        tag2.className = "tv-tag";
        tag2.textContent = "🎾";
        line2.appendChild(name2);
        line2.appendChild(tag2);

        teamsDiv.appendChild(line1);
        teamsDiv.appendChild(line2);
        card.appendChild(teamsDiv);

        frag.appendChild(card);
      });
      container.innerHTML = "";
      container.appendChild(frag);
    }

    /* HISTORIQUE */
    function getHistoryList() {
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error(e);
        return [];
      }
    }

    function saveHistoryList(list) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    }

    function renderHistory() {
      if (!elHistoryList) return;
      const list = getHistoryList();
      if (!list.length) {
        elHistoryList.innerHTML = '<div class="empty">Aucune sauvegarde pour le moment.</div>';
        return;
      }
      const frag = document.createDocumentFragment();
      list.forEach(item => {
        const row = document.createElement("div");
        row.className = "pool-ranking-row";

        const title = document.createElement("div");
        title.className = "pool-team";
        title.style.fontWeight = "700";
        title.textContent = `${item.state?.name || "Tournoi"} (${item.state?.teamCount || item.inputs?.length || "?"} équipes)`;

        const meta = document.createElement("div");
        meta.className = "pool-points";
        const date = new Date(item.savedAt || Date.now());
        meta.textContent = date.toLocaleString();

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "6px";

        const loadBtn = document.createElement("button");
        loadBtn.className = "btn btn-small btn-secondary";
        loadBtn.textContent = "↩ Charger";
        loadBtn.addEventListener("click", () => loadHistoryEntry(item.id));

        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-small btn-ghost";
        delBtn.textContent = "🗑 Supprimer";
        delBtn.addEventListener("click", () => deleteHistoryEntry(item.id));

        actions.appendChild(loadBtn);
        actions.appendChild(delBtn);

        row.appendChild(title);
        row.appendChild(meta);
        row.appendChild(actions);
        frag.appendChild(row);
      });
      elHistoryList.innerHTML = "";
      elHistoryList.appendChild(frag);
    }

    function saveCurrentToHistory() {
      ensureTeamsFromInputs();
      const snapshot = {
        id: Date.now(),
        savedAt: new Date().toISOString(),
        state: JSON.parse(JSON.stringify(state)),
        inputs: Array.from(elTeamsGrid.querySelectorAll("input[data-team-index]"), inp => inp.value),
        config: {
          name: elTournamentName.value,
          sets: elSetsPerMatch.value,
          games: elGamesPerSet.value,
          terrains: { ...state.poolTerrains },
          message: elClassementMessage?.value || "",
          logo: elLogoPreview?.src || ""
        }
      };
      const list = getHistoryList();
      list.unshift(snapshot);
      saveHistoryList(list.slice(0, 15));
      renderHistory();
      elConfigInfo.textContent = "Tournoi sauvegardé dans l’historique local.";
    }

    function loadHistoryEntry(id) {
      const list = getHistoryList();
      const entry = list.find(it => it.id === id);
      if (!entry) return;

      Object.assign(state, entry.state || {});
      elTournamentName.value = entry.config?.name || state.name || "";
      elHeaderTournament.textContent = (state.name || "TOURNOI").toUpperCase();
      elSetsPerMatch.value = state.setsPerMatch;
      elGamesPerSet.value = state.gamesPerSet;
      elTeamCount.value = state.teamCount;
      state.poolCount = computePoolCount(state.teamCount);
      state.finalFormat = state.teamCount >= 12 ? "16-main-conso" : "8-main";
      refreshSubtitles();
      elConfigInfo.textContent = `Prévu pour ${state.teamCount} équipes (${state.poolCount} poules).`;
      initTeamsInputs();
      const inputs = elTeamsGrid.querySelectorAll("input[data-team-index]");
      inputs.forEach((inp, idx) => {
        inp.value = entry.inputs && entry.inputs[idx] ? entry.inputs[idx] : (state.teams[idx]?.name || "");
      });
      ensureTeamsFromInputs();

      elTerrainA.value = state.poolTerrains.A || "";
      elTerrainB.value = state.poolTerrains.B || "";
      elTerrainC.value = state.poolTerrains.C || "";
      elTerrainD.value = state.poolTerrains.D || "";
      if (elClassementMessage && entry.config) {
        elClassementMessage.value = entry.config.message || "";
        elClassementPhrase.textContent = entry.config.message || "";
      }
      if (entry.config) {
        setLogoSource(entry.config.logo || "");
      }

      renderPools();
      renderBrackets();
      renderFinalRanking();
      elBtnGenerateBr.disabled = !areAllPoolMatchesDone();
      elPoolsStatus.textContent = areAllPoolMatchesDone() ? "Étape 1/3 : Poules terminées ✅" : "Étape 1/3 : Poules en cours";
      elBracketsStatus.textContent = state.bracketsReady ? "Étape 2/3 : Tableaux en cours" : "Étape 2/3 : Tableaux à générer";
      setTabEnabled("poules", true);
      setTabEnabled("main", true);
      setTabEnabled("conso", Object.keys(getBracketMatchDef("conso")).length > 0);
      if (state.finalRanking.length) setTabEnabled("classement", true);
      showTab("poules");
      updateTv();
    }

    function deleteHistoryEntry(id) {
      const confirmDelete = confirm("Supprimer définitivement ce tournoi de l’historique ?");
      if (!confirmDelete) return;
      const list = getHistoryList().filter(it => it.id !== id);
      saveHistoryList(list);
      renderHistory();
    }

    if (elBtnSaveHistory) {
      elBtnSaveHistory.addEventListener("click", saveCurrentToHistory);
    }

    renderHistory();
    setLogoSource(elLogoPreview?.src || "");
    updateLogoHelper();

    if (elClassementMessage && elClassementPhrase) {
      elClassementMessage.addEventListener("input", () => {
        elClassementPhrase.textContent = elClassementMessage.value || "";
      });
    }

    // Initial collapse handlers
    attachCollapseHandlers();
})();
