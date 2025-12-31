/**
 * SETTINGS.JS - Gestion de l'interface de paramètres
 * Interface à 5 onglets pour la configuration de l'application
 */

(function() {
  'use strict';

  // ========================================
  // CONFIGURATION & CONSTANTES
  // ========================================

  var STORAGE_KEYS = {
    club: 'club_settings',
    sponsors: 'sponsors_list',
    pong: 'pong_settings',
    exports: 'export_settings',
    activeTheme: 'active_theme',
    customThemes: 'custom_themes',
    editorState: 'theme_editor_state',
    activeTab: 'settings_active_tab',
    tvConfigMD: 'tv_config_md',
    tvConfigClassic: 'tv_config_classic',
    tvConfigAmericano: 'tv_config_americano',
    tvConfigSoloNight: 'tv_config_solonight',
    tvConfigsLibrary: 'tv_configs_library',
    sponsorsTVSettings: 'sponsors_tv_settings',
    pongTVWidget: 'pong_tv_widget'
  };

  var DEFAULT_SETTINGS = {
    club: {
      fullName: 'Padel Parc',
      shortName: 'Padel Parc',
      slogan: '',
      signatureColor: '#004b9b',
      logoDataUrl: null,
      address: '',
      phone: '',
      email: '',
      website: '',
      instagram: '',
      facebook: '',
      twitter: '',
      timezone: 'Europe/Paris',
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      language: 'fr'
    },
    sponsors: [],
    pong: {
      sponsorName: '',
      logoUrl: '',
      aiName: 'CPU',
      useThemeColors: true,
      ballColor: '#e5e339',
      playerPaddleColor: '#004b9b',
      aiPaddleColor: '#4d81b9',
      backgroundColor: '#020617',
      showLeaderboard: true,
      enableSounds: true,
      difficulty: 'medium',
      qrSize: 'medium',
      qrPosition: 'bottom-right'
    },
    exports: {
      template: 'moderne',
      leagueBackgroundUrl: null,
      backgroundOpacity: 0.3,
      darkFilter: true,
      enableBranding: true,
      brandingLogoUrl: null,
      footerText: 'Padel Parc',
      showQrCode: false,
      qrPosition: 'bottom-right',
      formats: {png: true, pdf: false, jpeg: false},
      quality: 150
    }
  };

  // ========================================
  // ÉTAT & RÉFÉRENCES DOM
  // ========================================

  var state = {
    activeTab: 'club',
    unsavedChanges: false,
    themesLibrary: null,
    currentSettings: {
      club: null,
      sponsors: null,
      pong: null,
      exports: null
    }
  };

  var refs = {
    tabs: {},
    panels: {},
    forms: {}
  };

  // ========================================
  // UTILITAIRES
  // ========================================

  function loadFromStorage(key, defaultValue) {
    try {
      var stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.error('Erreur chargement storage:', e);
      return defaultValue;
    }
  }

  function saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Erreur sauvegarde storage:', e);
      return false;
    }
  }

  function showNotification(message, type) {
    // Notification simple avec alert pour l'instant
    if (type === 'success') {
      alert('✅ ' + message);
    } else if (type === 'error') {
      alert('❌ ' + message);
    } else {
      alert(message);
    }
  }

  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // ========================================
  // NAVIGATION ENTRE ONGLETS
  // ========================================

  function initTabs() {
    var tabButtons = document.querySelectorAll('.settings-tab');
    var panels = document.querySelectorAll('.settings-panel');

    // Références
    tabButtons.forEach(function(btn) {
      var panelId = btn.getAttribute('data-panel');
      refs.tabs[panelId] = btn;
      refs.panels[panelId] = document.getElementById('panel-' + panelId);
    });

    // Event listeners
    tabButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var panelId = this.getAttribute('data-panel');
        switchTab(panelId);
      });
    });

    // Restaurer onglet actif ou utiliser hash URL
    var hash = window.location.hash.replace('#settings/', '');
    var savedTab = sessionStorage.getItem(STORAGE_KEYS.activeTab);
    var initialTab = hash || savedTab || 'club';

    switchTab(initialTab);

    // Gérer changements de hash
    window.addEventListener('hashchange', function() {
      var newHash = window.location.hash.replace('#settings/', '');
      if (newHash && refs.panels[newHash]) {
        switchTab(newHash);
      }
    });
  }

  function switchTab(tabId) {
    if (!refs.panels[tabId]) return;

    // Désactiver tous les onglets
    Object.keys(refs.tabs).forEach(function(key) {
      refs.tabs[key].classList.remove('active');
      refs.panels[key].classList.remove('active');
    });

    // Activer l'onglet sélectionné
    refs.tabs[tabId].classList.add('active');
    refs.panels[tabId].classList.add('active');

    // Sauvegarder état
    state.activeTab = tabId;
    sessionStorage.setItem(STORAGE_KEYS.activeTab, tabId);

    // Mettre à jour hash URL
    if (window.location.hash !== '#settings/' + tabId) {
      history.replaceState(null, null, '#settings/' + tabId);
    }
  }

  // ========================================
  // ONGLET CLUB
  // ========================================

  function initClubTab() {
    var panel = refs.panels.club;
    if (!panel) return;

    // Charger paramètres
    state.currentSettings.club = loadFromStorage(
      STORAGE_KEYS.club,
      DEFAULT_SETTINGS.club
    );

    // Références aux champs
    refs.forms.club = {
      fullName: panel.querySelector('#club-full-name'),
      shortName: panel.querySelector('#club-short-name'),
      slogan: panel.querySelector('#club-slogan'),
      signatureColor: panel.querySelector('#club-signature-color'),
      signatureColorValue: panel.querySelector('#club-signature-color-value'),
      logoUpload: panel.querySelector('#club-logo-upload'),
      logoPreview: panel.querySelector('#club-logo-preview'),
      address: panel.querySelector('#club-address'),
      phone: panel.querySelector('#club-phone'),
      email: panel.querySelector('#club-email'),
      website: panel.querySelector('#club-website'),
      instagram: panel.querySelector('#club-instagram'),
      facebook: panel.querySelector('#club-facebook'),
      twitter: panel.querySelector('#club-twitter'),
      timezone: panel.querySelector('#club-timezone'),
      currency: panel.querySelector('#club-currency'),
      dateFormat: panel.querySelector('#club-date-format'),
      language: panel.querySelector('#club-language'),
      saveBtn: panel.querySelector('#btn-save-club')
    };

    // Peupler les champs
    populateClubFields();

    // Color picker
    if (refs.forms.club.signatureColor) {
      refs.forms.club.signatureColor.addEventListener('input', function() {
        if (refs.forms.club.signatureColorValue) {
          refs.forms.club.signatureColorValue.textContent = this.value.toUpperCase();
        }
        markUnsaved();
      });
    }

    // Upload logo
    if (refs.forms.club.logoUpload) {
      refs.forms.club.logoUpload.addEventListener('change', function(e) {
        handleFileUpload(e, function(dataUrl) {
          state.currentSettings.club.logoDataUrl = dataUrl;
          if (refs.forms.club.logoPreview) {
            refs.forms.club.logoPreview.src = dataUrl;
            refs.forms.club.logoPreview.style.display = 'block';
          }
          markUnsaved();
        });
      });
    }

    // Sauvegarder
    if (refs.forms.club.saveBtn) {
      refs.forms.club.saveBtn.addEventListener('click', saveClubSettings);
    }

    // Auto-save sur changements
    Object.keys(refs.forms.club).forEach(function(key) {
      var field = refs.forms.club[key];
      if (field && field.tagName && (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA')) {
        field.addEventListener('input', debounce(markUnsaved, 300));
      }
    });
  }

  function populateClubFields() {
    var data = state.currentSettings.club;
    var form = refs.forms.club;

    if (form.fullName) form.fullName.value = data.fullName || '';
    if (form.shortName) form.shortName.value = data.shortName || '';
    if (form.slogan) form.slogan.value = data.slogan || '';
    if (form.signatureColor) {
      form.signatureColor.value = data.signatureColor || '#004b9b';
      if (form.signatureColorValue) {
        form.signatureColorValue.textContent = (data.signatureColor || '#004b9b').toUpperCase();
      }
    }
    if (form.address) form.address.value = data.address || '';
    if (form.phone) form.phone.value = data.phone || '';
    if (form.email) form.email.value = data.email || '';
    if (form.website) form.website.value = data.website || '';
    if (form.instagram) form.instagram.value = data.instagram || '';
    if (form.facebook) form.facebook.value = data.facebook || '';
    if (form.twitter) form.twitter.value = data.twitter || '';
    if (form.timezone) form.timezone.value = data.timezone || 'Europe/Paris';
    if (form.currency) form.currency.value = data.currency || 'EUR';
    if (form.dateFormat) form.dateFormat.value = data.dateFormat || 'DD/MM/YYYY';
    if (form.language) form.language.value = data.language || 'fr';

    if (data.logoDataUrl && form.logoPreview) {
      form.logoPreview.src = data.logoDataUrl;
      form.logoPreview.style.display = 'block';
    }
  }

  function saveClubSettings() {
    var form = refs.forms.club;

    state.currentSettings.club = {
      fullName: form.fullName ? form.fullName.value : '',
      shortName: form.shortName ? form.shortName.value : '',
      slogan: form.slogan ? form.slogan.value : '',
      signatureColor: form.signatureColor ? form.signatureColor.value : '#004b9b',
      logoDataUrl: state.currentSettings.club.logoDataUrl,
      address: form.address ? form.address.value : '',
      phone: form.phone ? form.phone.value : '',
      email: form.email ? form.email.value : '',
      website: form.website ? form.website.value : '',
      instagram: form.instagram ? form.instagram.value : '',
      facebook: form.facebook ? form.facebook.value : '',
      twitter: form.twitter ? form.twitter.value : '',
      timezone: form.timezone ? form.timezone.value : 'Europe/Paris',
      currency: form.currency ? form.currency.value : 'EUR',
      dateFormat: form.dateFormat ? form.dateFormat.value : 'DD/MM/YYYY',
      language: form.language ? form.language.value : 'fr'
    };

    if (saveToStorage(STORAGE_KEYS.club, state.currentSettings.club)) {
      showNotification('Paramètres du club sauvegardés', 'success');
      clearUnsaved();
    } else {
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  // ========================================
  // ONGLET SPONSORS
  // ========================================

  function initSponsorsTab() {
    var panel = refs.panels.sponsors;
    if (!panel) return;

    // Charger liste sponsors
    state.currentSettings.sponsors = loadFromStorage(
      STORAGE_KEYS.sponsors,
      DEFAULT_SETTINGS.sponsors
    );

    // Références
    refs.forms.sponsors = {
      name: panel.querySelector('#sponsor-name-input'),
      logoUpload: panel.querySelector('#sponsor-logo-input'),
      category: panel.querySelector('#sponsor-category-input'),
      url: panel.querySelector('#sponsor-url-input'),
      addBtn: panel.querySelector('#btn-add-new-sponsor'),
      listContainer: panel.querySelector('#sponsors-active-list')
    };

    // Bouton ajouter
    if (refs.forms.sponsors.addBtn) {
      refs.forms.sponsors.addBtn.addEventListener('click', addSponsor);
    }

    // Upload logo sponsor
    if (refs.forms.sponsors.logoUpload) {
      refs.forms.sponsors.logoUpload.addEventListener('change', function(e) {
        // Stocker temporairement pour utiliser lors de l'ajout
        handleFileUpload(e, function(dataUrl) {
          refs.forms.sponsors.logoUpload.dataset.logoData = dataUrl;
        });
      });
    }

    renderSponsorsList();

    // Initialiser contrôles TV widgets
    initTVWidgetsControls();
  }

  function addSponsor() {
    var form = refs.forms.sponsors;
    var name = form.name ? form.name.value.trim() : '';

    if (!name) {
      showNotification('Le nom du sponsor est requis', 'error');
      return;
    }

    var newSponsor = {
      id: 'sponsor_' + Date.now(),
      name: name,
      logoDataUrl: form.logoUpload && form.logoUpload.dataset.logoData ? form.logoUpload.dataset.logoData : null,
      category: form.category ? form.category.value : 'principal',
      url: form.url ? form.url.value : '',
      zones: {
        tvMd: true,
        tvClassic: true,
        tvAmericano: true,
        playerView: false,
        exports: false
      },
      duration: 10,
      priority: 3
    };

    state.currentSettings.sponsors.push(newSponsor);

    if (saveToStorage(STORAGE_KEYS.sponsors, state.currentSettings.sponsors)) {
      showNotification('Sponsor ajouté avec succès', 'success');

      // Reset form
      if (form.name) form.name.value = '';
      if (form.url) form.url.value = '';
      if (form.logoUpload) {
        form.logoUpload.value = '';
        delete form.logoUpload.dataset.logoData;
      }

      renderSponsorsList();
    } else {
      showNotification('Erreur lors de l\'ajout du sponsor', 'error');
    }
  }

  function deleteSponsor(sponsorId) {
    if (!confirm('Supprimer ce sponsor ?')) return;

    state.currentSettings.sponsors = state.currentSettings.sponsors.filter(function(s) {
      return s.id !== sponsorId;
    });

    if (saveToStorage(STORAGE_KEYS.sponsors, state.currentSettings.sponsors)) {
      showNotification('Sponsor supprimé', 'success');
      renderSponsorsList();
    } else {
      showNotification('Erreur lors de la suppression', 'error');
    }
  }

  function renderSponsorsList() {
    var container = refs.forms.sponsors.listContainer;
    if (!container) return;

    if (!state.currentSettings.sponsors || state.currentSettings.sponsors.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📢</div><div class="empty-state-text">Aucun sponsor configuré</div></div>';
      return;
    }

    var html = '<div class="sponsors-list">';
    state.currentSettings.sponsors.forEach(function(sponsor) {
      html += '<div class="sponsor-item" data-sponsor-id="' + sponsor.id + '">';
      html += '  <div class="sponsor-header">';

      if (sponsor.logoDataUrl) {
        html += '    <img src="' + sponsor.logoDataUrl + '" alt="Logo" class="sponsor-logo">';
      } else {
        html += '    <div class="sponsor-logo" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);">📢</div>';
      }

      html += '    <div class="sponsor-info">';
      html += '      <div class="sponsor-name">' + sponsor.name + '</div>';
      html += '      <div class="sponsor-category">' + (sponsor.category || 'Principal') + '</div>';
      html += '    </div>';
      html += '    <button class="custom-theme-btn" onclick="window.settingsDeleteSponsor(\'' + sponsor.id + '\')">🗑️ Supprimer</button>';
      html += '  </div>';

      // Zones actives
      var zones = [];
      if (sponsor.zones) {
        if (sponsor.zones.tvMd) zones.push('TV M/D');
        if (sponsor.zones.tvClassic) zones.push('TV Classic');
        if (sponsor.zones.tvAmericano) zones.push('TV Americano');
        if (sponsor.zones.playerView) zones.push('Vue Joueur');
        if (sponsor.zones.exports) zones.push('Exports');
      }

      if (zones.length > 0) {
        html += '  <div class="sponsor-zones">';
        zones.forEach(function(zone) {
          html += '<span class="sponsor-zone-tag">' + zone + '</span>';
        });
        html += '  </div>';
      }

      html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
  }

  // Exposer la fonction de suppression globalement
  window.settingsDeleteSponsor = deleteSponsor;

  // ========================================
  // TV WIDGETS CONTROLS (dans onglet Sponsors)
  // ========================================

  function initTVWidgetsControls() {
    console.log('[Settings] Initialisation contrôles TV widgets...');

    // Charger les paramètres sponsors TV
    var sponsorsTVSettings = loadFromStorage(STORAGE_KEYS.sponsorsTVSettings, null);
    if (sponsorsTVSettings && sponsorsTVSettings.modes) {
      var mdToggle = document.getElementById('sponsor-tv-md-toggle');
      var classicToggle = document.getElementById('sponsor-tv-classic-toggle');
      var americanoToggle = document.getElementById('sponsor-tv-americano-toggle');

      if (mdToggle) mdToggle.checked = sponsorsTVSettings.enabled && sponsorsTVSettings.modes.md;
      if (classicToggle) classicToggle.checked = sponsorsTVSettings.enabled && sponsorsTVSettings.modes.classic;
      if (americanoToggle) americanoToggle.checked = sponsorsTVSettings.enabled && sponsorsTVSettings.modes.americano;
    }

    // Charger les paramètres Pong TV
    var pongTVWidget = loadFromStorage(STORAGE_KEYS.pongTVWidget, null);
    if (pongTVWidget && pongTVWidget.modes) {
      var mdPongToggle = document.getElementById('pong-tv-md-toggle');
      var classicPongToggle = document.getElementById('pong-tv-classic-toggle');
      var americanoPongToggle = document.getElementById('pong-tv-americano-toggle');

      if (mdPongToggle) mdPongToggle.checked = pongTVWidget.enabled && pongTVWidget.modes.md;
      if (classicPongToggle) classicPongToggle.checked = pongTVWidget.enabled && pongTVWidget.modes.classic;
      if (americanoPongToggle) americanoPongToggle.checked = pongTVWidget.enabled && pongTVWidget.modes.americano;
    }

    // Bouton de sauvegarde
    var saveBtn = document.getElementById('btn-save-tv-widgets');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveTVWidgetsSettings);
    }
  }

  function saveTVWidgetsSettings() {
    console.log('[Settings] Sauvegarde paramètres TV widgets...');

    // Récupérer valeurs sponsors TV
    var mdToggle = document.getElementById('sponsor-tv-md-toggle');
    var classicToggle = document.getElementById('sponsor-tv-classic-toggle');
    var americanoToggle = document.getElementById('sponsor-tv-americano-toggle');

    var sponsorsTVSettings = {
      enabled: true,
      position: 'top-right',
      size: { width: 200, height: 80 },
      style: 'banner',
      duration: 5,
      transition: { type: 'fade', duration: 0.3 },
      fairRotation: true,
      modes: {
        md: mdToggle ? mdToggle.checked : true,
        classic: classicToggle ? classicToggle.checked : true,
        americano: americanoToggle ? americanoToggle.checked : true
      }
    };

    // Récupérer valeurs Pong TV
    var mdPongToggle = document.getElementById('pong-tv-md-toggle');
    var classicPongToggle = document.getElementById('pong-tv-classic-toggle');
    var americanoPongToggle = document.getElementById('pong-tv-americano-toggle');

    var pongTVWidget = {
      enabled: true,
      position: 'bottom-right',
      offset: { x: 20, y: 20 },
      size: 'medium',
      content: { qr: true, text: true, sponsor: true },
      customText: 'Scanne & joue !',
      style: { bg: 'semi', border: 'accent', radius: 12 },
      draggable: true,
      hideButton: true,
      modes: {
        md: mdPongToggle ? mdPongToggle.checked : true,
        classic: classicPongToggle ? classicPongToggle.checked : true,
        americano: americanoPongToggle ? americanoPongToggle.checked : false
      }
    };

    // Sauvegarder
    var success = true;
    success = saveToStorage(STORAGE_KEYS.sponsorsTVSettings, sponsorsTVSettings) && success;
    success = saveToStorage(STORAGE_KEYS.pongTVWidget, pongTVWidget) && success;

    if (success) {
      showNotification('Paramètres TV sauvegardés avec succès !', 'success');

      // Recharger le thème pour appliquer les changements immédiatement
      if (typeof window.reloadClubProfile === 'function') {
        window.reloadClubProfile();
      }

      // Mettre à jour la visibilité des widgets Pong
      if (typeof window.updatePongTvVisibility === 'function') {
        window.updatePongTvVisibility();
      }
    } else {
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  // ========================================
  // ONGLET PONG
  // ========================================

  function initPongTab() {
    var panel = refs.panels.pong;
    if (!panel) return;

    // Charger paramètres
    state.currentSettings.pong = loadFromStorage(
      STORAGE_KEYS.pong,
      DEFAULT_SETTINGS.pong
    );

    // Références
    refs.forms.pong = {
      sponsorName: panel.querySelector('#pong-sponsor-name'),
      logoUrl: panel.querySelector('#pong-logo-url'),
      aiName: panel.querySelector('#pong-ai-name'),
      useThemeColors: panel.querySelector('#pong-use-theme-colors'),
      ballColor: panel.querySelector('#pong-ball-color'),
      playerPaddleColor: panel.querySelector('#pong-player-paddle-color'),
      aiPaddleColor: panel.querySelector('#pong-ai-paddle-color'),
      backgroundColor: panel.querySelector('#pong-background-color'),
      showLeaderboard: panel.querySelector('#pong-show-leaderboard'),
      enableSounds: panel.querySelector('#pong-enable-sounds'),
      difficulty: panel.querySelector('#pong-difficulty'),
      qrSize: panel.querySelector('#pong-qr-size'),
      qrPosition: panel.querySelector('#pong-qr-position'),
      saveBtn: panel.querySelector('#btn-save-pong')
    };

    // Peupler les champs
    populatePongFields();

    // Sauvegarder
    if (refs.forms.pong.saveBtn) {
      refs.forms.pong.saveBtn.addEventListener('click', savePongSettings);
    }

    // Toggle theme colors
    if (refs.forms.pong.useThemeColors) {
      refs.forms.pong.useThemeColors.addEventListener('change', function() {
        var customColorsSection = panel.querySelector('.pong-custom-colors-section');
        if (customColorsSection) {
          customColorsSection.style.display = this.checked ? 'none' : 'block';
        }
      });
    }
  }

  function populatePongFields() {
    var data = state.currentSettings.pong;
    var form = refs.forms.pong;

    if (form.sponsorName) form.sponsorName.value = data.sponsorName || '';
    if (form.logoUrl) form.logoUrl.value = data.logoUrl || '';
    if (form.aiName) form.aiName.value = data.aiName || 'CPU';
    if (form.useThemeColors) form.useThemeColors.checked = data.useThemeColors !== false;
    if (form.ballColor) form.ballColor.value = data.ballColor || '#e5e339';
    if (form.playerPaddleColor) form.playerPaddleColor.value = data.playerPaddleColor || '#004b9b';
    if (form.aiPaddleColor) form.aiPaddleColor.value = data.aiPaddleColor || '#4d81b9';
    if (form.backgroundColor) form.backgroundColor.value = data.backgroundColor || '#020617';
    if (form.showLeaderboard) form.showLeaderboard.checked = data.showLeaderboard !== false;
    if (form.enableSounds) form.enableSounds.checked = data.enableSounds !== false;
    if (form.difficulty) form.difficulty.value = data.difficulty || 'medium';
    if (form.qrSize) form.qrSize.value = data.qrSize || 'medium';
    if (form.qrPosition) form.qrPosition.value = data.qrPosition || 'bottom-right';
  }

  function savePongSettings() {
    var form = refs.forms.pong;

    state.currentSettings.pong = {
      sponsorName: form.sponsorName ? form.sponsorName.value : '',
      logoUrl: form.logoUrl ? form.logoUrl.value : '',
      aiName: form.aiName ? form.aiName.value : 'CPU',
      useThemeColors: form.useThemeColors ? form.useThemeColors.checked : true,
      ballColor: form.ballColor ? form.ballColor.value : '#e5e339',
      playerPaddleColor: form.playerPaddleColor ? form.playerPaddleColor.value : '#004b9b',
      aiPaddleColor: form.aiPaddleColor ? form.aiPaddleColor.value : '#4d81b9',
      backgroundColor: form.backgroundColor ? form.backgroundColor.value : '#020617',
      showLeaderboard: form.showLeaderboard ? form.showLeaderboard.checked : true,
      enableSounds: form.enableSounds ? form.enableSounds.checked : true,
      difficulty: form.difficulty ? form.difficulty.value : 'medium',
      qrSize: form.qrSize ? form.qrSize.value : 'medium',
      qrPosition: form.qrPosition ? form.qrPosition.value : 'bottom-right'
    };

    if (saveToStorage(STORAGE_KEYS.pong, state.currentSettings.pong)) {
      showNotification('Configuration Pong sauvegardée', 'success');
      clearUnsaved();
    } else {
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  // ========================================
  // ONGLET EXPORTS
  // ========================================

  function initExportsTab() {
    var panel = refs.panels.exports;
    if (!panel) return;

    // Charger paramètres
    state.currentSettings.exports = loadFromStorage(
      STORAGE_KEYS.exports,
      DEFAULT_SETTINGS.exports
    );

    // Références
    refs.forms.exports = {
      templateRadios: panel.querySelectorAll('input[name="export-template"]'),
      backgroundUpload: panel.querySelector('#export-background-upload'),
      backgroundOpacity: panel.querySelector('#export-background-opacity'),
      opacityValue: panel.querySelector('#export-opacity-value'),
      darkFilter: panel.querySelector('#export-dark-filter'),
      enableBranding: panel.querySelector('#export-enable-branding'),
      brandingLogoUpload: panel.querySelector('#export-branding-logo-upload'),
      footerText: panel.querySelector('#export-footer-text'),
      showQrCode: panel.querySelector('#export-show-qr-code'),
      qrPosition: panel.querySelector('#export-qr-position'),
      formatPng: panel.querySelector('#export-format-png'),
      formatPdf: panel.querySelector('#export-format-pdf'),
      formatJpeg: panel.querySelector('#export-format-jpeg'),
      quality: panel.querySelector('#export-quality'),
      saveBtn: panel.querySelector('#btn-save-exports')
    };

    // Peupler les champs
    populateExportsFields();

    // Templates radio buttons - gérer la classe selected sur le label
    refs.forms.exports.templateRadios.forEach(function(radio) {
      radio.addEventListener('change', function() {
        // Retirer selected de tous les labels
        panel.querySelectorAll('.export-template-card').forEach(function(card) {
          card.classList.remove('selected');
        });
        // Ajouter selected au label parent du radio sélectionné
        if (this.checked) {
          this.closest('.export-template-card').classList.add('selected');
        }
      });
    });

    // Slider opacité
    if (refs.forms.exports.backgroundOpacity && refs.forms.exports.opacityValue) {
      refs.forms.exports.backgroundOpacity.addEventListener('input', function() {
        refs.forms.exports.opacityValue.textContent = this.value;
      });
    }

    // Sauvegarder
    if (refs.forms.exports.saveBtn) {
      refs.forms.exports.saveBtn.addEventListener('click', saveExportsSettings);
    }
  }

  function populateExportsFields() {
    var data = state.currentSettings.exports;
    var form = refs.forms.exports;

    // Template sélectionné
    var templateValue = data.template || 'moderne';
    form.templateRadios.forEach(function(radio) {
      if (radio.value === templateValue) {
        radio.checked = true;
        radio.closest('.export-template-card').classList.add('selected');
      }
    });

    if (form.backgroundOpacity) {
      form.backgroundOpacity.value = data.backgroundOpacity || 0.3;
      if (form.opacityValue) form.opacityValue.textContent = data.backgroundOpacity || 0.3;
    }
    if (form.darkFilter) form.darkFilter.checked = data.darkFilter !== false;
    if (form.enableBranding) form.enableBranding.checked = data.enableBranding !== false;
    if (form.footerText) form.footerText.value = data.footerText || 'Padel Parc';
    if (form.showQrCode) form.showQrCode.checked = data.showQrCode === true;
    if (form.qrPosition) form.qrPosition.value = data.qrPosition || 'bottom-right';
    if (form.formatPng) form.formatPng.checked = data.formats && data.formats.png !== false;
    if (form.formatPdf) form.formatPdf.checked = data.formats && data.formats.pdf === true;
    if (form.formatJpeg) form.formatJpeg.checked = data.formats && data.formats.jpeg === true;
    if (form.quality) form.quality.value = data.quality || 150;
  }

  function saveExportsSettings() {
    var form = refs.forms.exports;

    // Déterminer template sélectionné depuis les radio buttons
    var template = 'moderne';
    form.templateRadios.forEach(function(radio) {
      if (radio.checked) {
        template = radio.value;
      }
    });

    state.currentSettings.exports = {
      template: template,
      leagueBackgroundUrl: state.currentSettings.exports.leagueBackgroundUrl,
      backgroundOpacity: form.backgroundOpacity ? parseFloat(form.backgroundOpacity.value) : 0.3,
      darkFilter: form.darkFilter ? form.darkFilter.checked : true,
      enableBranding: form.enableBranding ? form.enableBranding.checked : true,
      brandingLogoUrl: state.currentSettings.exports.brandingLogoUrl,
      footerText: form.footerText ? form.footerText.value : 'Padel Parc',
      showQrCode: form.showQrCode ? form.showQrCode.checked : false,
      qrPosition: form.qrPosition ? form.qrPosition.value : 'bottom-right',
      formats: {
        png: form.formatPng ? form.formatPng.checked : true,
        pdf: form.formatPdf ? form.formatPdf.checked : false,
        jpeg: form.formatJpeg ? form.formatJpeg.checked : false
      },
      quality: form.quality ? parseInt(form.quality.value) : 150
    };

    if (saveToStorage(STORAGE_KEYS.exports, state.currentSettings.exports)) {
      showNotification('Préférences exports sauvegardées', 'success');
      clearUnsaved();
    } else {
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  // ========================================
  // ONGLET THÈME
  // ========================================

  function initThemeTab() {
    var panel = refs.panels.theme;
    if (!panel) return;

    // Charger bibliothèque de thèmes
    loadThemesLibrary();

    // Initialiser l'éditeur de thème personnalisé
    initThemeEditor();
  }

  // ========================================
  // ÉDITEUR DE THÈME PERSONNALISÉ
  // ========================================

  var themeEditorRefs = {};
  var currentEditorTheme = null;

  function initThemeEditor() {
    // Références aux champs
    themeEditorRefs = {
      primary: document.getElementById('theme-primary'),
      secondary: document.getElementById('theme-secondary'),
      accent: document.getElementById('theme-accent'),
      bg: document.getElementById('theme-bg'),
      card: document.getElementById('theme-card'),
      text: document.getElementById('theme-text'),
      title: document.getElementById('theme-title'),
      font: document.getElementById('theme-font'),
      borderRadius: document.getElementById('theme-border-radius'),
      buttonStyle: document.getElementById('theme-button-style'),
      bgStyle: document.getElementById('theme-bg-style'),
      bgImage: document.getElementById('theme-bg-image'),

      // Boutons d'action
      applyBtn: document.getElementById('btn-apply-theme'),
      saveBtn: document.getElementById('btn-save-custom-theme'),
      cancelBtn: document.getElementById('btn-cancel-theme'),
      resetBtn: document.getElementById('btn-reset-theme'),
      importBtn: document.getElementById('btn-import-theme'),
      exportBtn: document.getElementById('btn-export-theme'),

      // Liste des thèmes personnalisés
      customThemesList: document.getElementById('custom-themes-list'),
      unsavedIndicator: document.getElementById('theme-unsaved')
    };

    // Charger les valeurs actuelles
    loadCurrentThemeIntoEditor();

    // Event listeners
    if (themeEditorRefs.applyBtn) {
      themeEditorRefs.applyBtn.addEventListener('click', applyEditorTheme);
    }

    if (themeEditorRefs.saveBtn) {
      themeEditorRefs.saveBtn.addEventListener('click', saveCustomTheme);
    }

    if (themeEditorRefs.cancelBtn) {
      themeEditorRefs.cancelBtn.addEventListener('click', cancelThemeEdit);
    }

    if (themeEditorRefs.resetBtn) {
      themeEditorRefs.resetBtn.addEventListener('click', resetThemeToDefault);
    }

    if (themeEditorRefs.importBtn) {
      themeEditorRefs.importBtn.addEventListener('click', importTheme);
    }

    if (themeEditorRefs.exportBtn) {
      themeEditorRefs.exportBtn.addEventListener('click', exportCurrentTheme);
    }

    // Détecter les changements
    Object.keys(themeEditorRefs).forEach(function(key) {
      var field = themeEditorRefs[key];
      if (field && field.tagName && (field.tagName === 'INPUT' || field.tagName === 'SELECT')) {
        field.addEventListener('input', showUnsavedIndicator);
      }
    });

    // Charger et afficher les thèmes personnalisés
    renderCustomThemesList();
  }

  function loadCurrentThemeIntoEditor() {
    // Charger le thème actif ou utiliser les valeurs par défaut
    var savedTheme = loadFromStorage(STORAGE_KEYS.activeTheme, null);

    if (savedTheme && savedTheme.colors) {
      if (themeEditorRefs.primary) themeEditorRefs.primary.value = savedTheme.colors.primary || '#004b9b';
      if (themeEditorRefs.secondary) themeEditorRefs.secondary.value = savedTheme.colors.secondary || '#4d81b9';
      if (themeEditorRefs.accent) themeEditorRefs.accent.value = savedTheme.colors.accent || '#e5e339';
      if (themeEditorRefs.bg) themeEditorRefs.bg.value = savedTheme.colors.background || '#020617';
      if (themeEditorRefs.card) themeEditorRefs.card.value = savedTheme.colors.card || '#0b1220';
      if (themeEditorRefs.text) themeEditorRefs.text.value = savedTheme.colors.text || '#ffffff';
      if (themeEditorRefs.title) themeEditorRefs.title.value = savedTheme.colors.title || '#e5e339';
    } else {
      // Valeurs par défaut
      if (themeEditorRefs.primary) themeEditorRefs.primary.value = '#004b9b';
      if (themeEditorRefs.secondary) themeEditorRefs.secondary.value = '#4d81b9';
      if (themeEditorRefs.accent) themeEditorRefs.accent.value = '#e5e339';
      if (themeEditorRefs.bg) themeEditorRefs.bg.value = '#020617';
      if (themeEditorRefs.card) themeEditorRefs.card.value = '#0b1220';
      if (themeEditorRefs.text) themeEditorRefs.text.value = '#ffffff';
      if (themeEditorRefs.title) themeEditorRefs.title.value = '#e5e339';
    }
  }

  function applyEditorTheme() {
    if (!confirm('Appliquer ce thème personnalisé à l\'application ?')) return;

    var theme = {
      id: 'custom-' + Date.now(),
      name: 'Thème personnalisé',
      icon: '🎨',
      colors: {
        primary: themeEditorRefs.primary.value,
        secondary: themeEditorRefs.secondary.value,
        accent: themeEditorRefs.accent.value,
        background: themeEditorRefs.bg.value,
        card: themeEditorRefs.card.value,
        text: themeEditorRefs.text.value,
        title: themeEditorRefs.title.value,
        border: '#1e293b',
        muted: '#9ca3af'
      }
    };

    // Appliquer le thème
    var root = document.documentElement;
    if (theme.colors.primary) {
      root.style.setProperty('--brand-primary', theme.colors.primary);
      root.style.setProperty('--brand-primary-rgb', hexToRgb(theme.colors.primary));
    }
    if (theme.colors.secondary) {
      root.style.setProperty('--brand-secondary', theme.colors.secondary);
      root.style.setProperty('--brand-secondary-rgb', hexToRgb(theme.colors.secondary));
    }
    if (theme.colors.accent) {
      root.style.setProperty('--brand-accent', theme.colors.accent);
      root.style.setProperty('--brand-accent-rgb', hexToRgb(theme.colors.accent));
    }
    if (theme.colors.background) {
      root.style.setProperty('--brand-bg', theme.colors.background);
      root.style.setProperty('--brand-bg-rgb', hexToRgb(theme.colors.background));
    }
    if (theme.colors.card) {
      root.style.setProperty('--brand-card-bg', theme.colors.card);
      root.style.setProperty('--brand-card-bg-rgb', hexToRgb(theme.colors.card));
    }
    if (theme.colors.text) {
      root.style.setProperty('--brand-text', theme.colors.text);
      root.style.setProperty('--brand-text-rgb', hexToRgb(theme.colors.text));
    }
    if (theme.colors.title) {
      root.style.setProperty('--brand-title', theme.colors.title);
      root.style.setProperty('--brand-title-rgb', hexToRgb(theme.colors.title));
    }
    if (theme.colors.border) root.style.setProperty('--border', theme.colors.border);
    if (theme.colors.muted) root.style.setProperty('--muted', theme.colors.muted);

    // Variables des modes de jeu
    if (theme.colors.primary) root.style.setProperty('--blue-strong', theme.colors.primary);
    if (theme.colors.secondary) root.style.setProperty('--blue-mid', theme.colors.secondary);
    if (theme.colors.accent) {
      root.style.setProperty('--accent', theme.colors.accent);
      root.style.setProperty('--blue-soft', theme.colors.accent);
    }
    if (theme.colors.background) root.style.setProperty('--bg-dark', theme.colors.background);
    if (theme.colors.card) root.style.setProperty('--card', theme.colors.card);
    if (theme.colors.text) root.style.setProperty('--text', theme.colors.text);

    root.style.setProperty('--success', '#22c55e');
    root.style.setProperty('--danger', '#ef4444');

    // Sauvegarder comme thème actif
    saveToStorage(STORAGE_KEYS.activeTheme, theme);

    hideUnsavedIndicator();
    showNotification('Thème personnalisé appliqué!', 'success');
  }

  function saveCustomTheme() {
    var themeName = prompt('Nom de ce thème personnalisé:', 'Mon thème');
    if (!themeName) return;

    var newTheme = {
      id: 'custom-' + Date.now(),
      name: themeName,
      icon: '🎨',
      colors: {
        primary: themeEditorRefs.primary.value,
        secondary: themeEditorRefs.secondary.value,
        accent: themeEditorRefs.accent.value,
        background: themeEditorRefs.bg.value,
        card: themeEditorRefs.card.value,
        text: themeEditorRefs.text.value,
        title: themeEditorRefs.title.value,
        border: '#1e293b',
        muted: '#9ca3af'
      },
      createdAt: new Date().toISOString()
    };

    // Charger les thèmes existants
    var customThemes = loadFromStorage(STORAGE_KEYS.customThemes, []);
    customThemes.push(newTheme);

    // Sauvegarder
    if (saveToStorage(STORAGE_KEYS.customThemes, customThemes)) {
      showNotification('Thème "' + themeName + '" sauvegardé!', 'success');
      renderCustomThemesList();
      hideUnsavedIndicator();
    } else {
      showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  function cancelThemeEdit() {
    if (confirm('Annuler les modifications ?')) {
      loadCurrentThemeIntoEditor();
      hideUnsavedIndicator();
    }
  }

  function resetThemeToDefault() {
    if (!confirm('Réinitialiser au thème par défaut (Ocean Blue) ?')) return;

    // Trouver le thème Ocean Blue dans la bibliothèque
    var defaultTheme = state.themesLibrary.find(function(t) { return t.id === 'ocean-blue'; });

    if (defaultTheme) {
      // Charger dans l'éditeur
      if (themeEditorRefs.primary) themeEditorRefs.primary.value = defaultTheme.colors.primary;
      if (themeEditorRefs.secondary) themeEditorRefs.secondary.value = defaultTheme.colors.secondary;
      if (themeEditorRefs.accent) themeEditorRefs.accent.value = defaultTheme.colors.accent;
      if (themeEditorRefs.bg) themeEditorRefs.bg.value = defaultTheme.colors.background;
      if (themeEditorRefs.card) themeEditorRefs.card.value = defaultTheme.colors.card;
      if (themeEditorRefs.text) themeEditorRefs.text.value = defaultTheme.colors.text;
      if (themeEditorRefs.title) themeEditorRefs.title.value = defaultTheme.colors.title;

      showUnsavedIndicator();
      showNotification('Thème réinitialisé! Cliquez sur "Appliquer" pour confirmer.', 'success');
    }
  }

  function importTheme() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function(event) {
        try {
          var theme = JSON.parse(event.target.result);

          // Valider le thème
          if (!theme.colors || !theme.name) {
            throw new Error('Format invalide');
          }

          // Charger dans l'éditeur
          if (theme.colors.primary && themeEditorRefs.primary) themeEditorRefs.primary.value = theme.colors.primary;
          if (theme.colors.secondary && themeEditorRefs.secondary) themeEditorRefs.secondary.value = theme.colors.secondary;
          if (theme.colors.accent && themeEditorRefs.accent) themeEditorRefs.accent.value = theme.colors.accent;
          if (theme.colors.background && themeEditorRefs.bg) themeEditorRefs.bg.value = theme.colors.background;
          if (theme.colors.card && themeEditorRefs.card) themeEditorRefs.card.value = theme.colors.card;
          if (theme.colors.text && themeEditorRefs.text) themeEditorRefs.text.value = theme.colors.text;
          if (theme.colors.title && themeEditorRefs.title) themeEditorRefs.title.value = theme.colors.title;

          showNotification('Thème "' + theme.name + '" importé!', 'success');
          showUnsavedIndicator();
        } catch (error) {
          showNotification('Erreur: fichier invalide', 'error');
        }
      };
      reader.readAsText(file);
    });

    input.click();
  }

  function exportCurrentTheme() {
    var themeName = prompt('Nom du thème à exporter:', 'Mon thème');
    if (!themeName) return;

    var theme = {
      name: themeName,
      icon: '🎨',
      colors: {
        primary: themeEditorRefs.primary.value,
        secondary: themeEditorRefs.secondary.value,
        accent: themeEditorRefs.accent.value,
        background: themeEditorRefs.bg.value,
        card: themeEditorRefs.card.value,
        text: themeEditorRefs.text.value,
        title: themeEditorRefs.title.value
      },
      exportedAt: new Date().toISOString()
    };

    var dataStr = JSON.stringify(theme, null, 2);
    var dataBlob = new Blob([dataStr], {type: 'application/json'});
    var url = URL.createObjectURL(dataBlob);

    var link = document.createElement('a');
    link.href = url;
    link.download = themeName.toLowerCase().replace(/\s+/g, '-') + '-theme.json';
    link.click();

    URL.revokeObjectURL(url);
    showNotification('Thème exporté!', 'success');
  }

  function renderCustomThemesList() {
    if (!themeEditorRefs.customThemesList) return;

    var customThemes = loadFromStorage(STORAGE_KEYS.customThemes, []);

    if (customThemes.length === 0) {
      themeEditorRefs.customThemesList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎨</div><div class="empty-state-text">Aucun thème personnalisé</div></div>';
      return;
    }

    var html = '<div class="custom-themes-list">';
    customThemes.forEach(function(theme) {
      html += '<div class="custom-theme-item">';
      html += '  <span class="custom-theme-name">' + theme.icon + ' ' + theme.name + '</span>';
      html += '  <div class="custom-theme-actions">';
      html += '    <button class="custom-theme-btn" onclick="window.loadCustomTheme(\'' + theme.id + '\')">📥 Charger</button>';
      html += '    <button class="custom-theme-btn" onclick="window.deleteCustomTheme(\'' + theme.id + '\')">🗑️ Supprimer</button>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';

    themeEditorRefs.customThemesList.innerHTML = html;
  }

  function loadCustomThemeById(themeId) {
    var customThemes = loadFromStorage(STORAGE_KEYS.customThemes, []);
    var theme = customThemes.find(function(t) { return t.id === themeId; });

    if (!theme) return;

    // Charger dans l'éditeur
    if (theme.colors.primary && themeEditorRefs.primary) themeEditorRefs.primary.value = theme.colors.primary;
    if (theme.colors.secondary && themeEditorRefs.secondary) themeEditorRefs.secondary.value = theme.colors.secondary;
    if (theme.colors.accent && themeEditorRefs.accent) themeEditorRefs.accent.value = theme.colors.accent;
    if (theme.colors.background && themeEditorRefs.bg) themeEditorRefs.bg.value = theme.colors.background;
    if (theme.colors.card && themeEditorRefs.card) themeEditorRefs.card.value = theme.colors.card;
    if (theme.colors.text && themeEditorRefs.text) themeEditorRefs.text.value = theme.colors.text;
    if (theme.colors.title && themeEditorRefs.title) themeEditorRefs.title.value = theme.colors.title;

    showNotification('Thème "' + theme.name + '" chargé dans l\'éditeur', 'success');
    showUnsavedIndicator();
  }

  function deleteCustomThemeById(themeId) {
    if (!confirm('Supprimer ce thème personnalisé ?')) return;

    var customThemes = loadFromStorage(STORAGE_KEYS.customThemes, []);
    customThemes = customThemes.filter(function(t) { return t.id !== themeId; });

    if (saveToStorage(STORAGE_KEYS.customThemes, customThemes)) {
      showNotification('Thème supprimé', 'success');
      renderCustomThemesList();
    }
  }

  function showUnsavedIndicator() {
    if (themeEditorRefs.unsavedIndicator) {
      themeEditorRefs.unsavedIndicator.style.display = 'flex';
    }
  }

  function hideUnsavedIndicator() {
    if (themeEditorRefs.unsavedIndicator) {
      themeEditorRefs.unsavedIndicator.style.display = 'none';
    }
  }

  // Exposer les fonctions globalement pour les boutons onclick
  window.loadCustomTheme = loadCustomThemeById;
  window.deleteCustomTheme = deleteCustomThemeById;

  function loadThemesLibrary() {
    // Bibliothèque de thèmes intégrée (fallback si le fetch échoue)
    var themesData = [
      {
        id: "ocean-blue",
        name: "Ocean Blue",
        icon: "🌊",
        colors: {
          primary: "#0077be",
          secondary: "#4d9fd9",
          accent: "#00d4ff",
          background: "#001a2e",
          card: "#003152",
          text: "#e0f2ff",
          title: "#00d4ff",
          border: "#004d73",
          muted: "#7fb3d5"
        },
        palette: ["#0077be", "#4d9fd9", "#00d4ff", "#003152"]
      },
      {
        id: "fire-red",
        name: "Fire Red",
        icon: "🔥",
        colors: {
          primary: "#c41e3a",
          secondary: "#e74c3c",
          accent: "#ff6b6b",
          background: "#1a0000",
          card: "#2d0a0a",
          text: "#ffe5e5",
          title: "#ff6b6b",
          border: "#5c0f0f",
          muted: "#cc8888"
        },
        palette: ["#c41e3a", "#e74c3c", "#ff6b6b", "#2d0a0a"]
      },
      {
        id: "forest-green",
        name: "Forest Green",
        icon: "🌿",
        colors: {
          primary: "#2d7a3e",
          secondary: "#4caf50",
          accent: "#81c784",
          background: "#0a1f0f",
          card: "#1a3a24",
          text: "#e8f5e9",
          title: "#81c784",
          border: "#2e5c3a",
          muted: "#90c49a"
        },
        palette: ["#2d7a3e", "#4caf50", "#81c784", "#1a3a24"]
      },
      {
        id: "royal-purple",
        name: "Royal Purple",
        icon: "👑",
        colors: {
          primary: "#6a1b9a",
          secondary: "#8e24aa",
          accent: "#ce93d8",
          background: "#1a0a29",
          card: "#2d1540",
          text: "#f3e5f5",
          title: "#ce93d8",
          border: "#4a2663",
          muted: "#b084cc"
        },
        palette: ["#6a1b9a", "#8e24aa", "#ce93d8", "#2d1540"]
      },
      {
        id: "electric-yellow",
        name: "Electric Yellow",
        icon: "⚡",
        colors: {
          primary: "#f9a825",
          secondary: "#fdd835",
          accent: "#ffeb3b",
          background: "#1a1500",
          card: "#2d2400",
          text: "#fffde7",
          title: "#ffeb3b",
          border: "#5c4a00",
          muted: "#d4c36a"
        },
        palette: ["#f9a825", "#fdd835", "#ffeb3b", "#2d2400"]
      },
      {
        id: "midnight",
        name: "Midnight",
        icon: "🌙",
        colors: {
          primary: "#1e3a5f",
          secondary: "#2c5282",
          accent: "#90cdf4",
          background: "#0a0e1a",
          card: "#1a202c",
          text: "#e2e8f0",
          title: "#90cdf4",
          border: "#2d3748",
          muted: "#718096"
        },
        palette: ["#1e3a5f", "#2c5282", "#90cdf4", "#1a202c"]
      },
      {
        id: "sakura-pink",
        name: "Sakura Pink",
        icon: "🌸",
        colors: {
          primary: "#d81b60",
          secondary: "#ec407a",
          accent: "#f8bbd0",
          background: "#1f0a14",
          card: "#3a1528",
          text: "#fce4ec",
          title: "#f8bbd0",
          border: "#5c2642",
          muted: "#d4849b"
        },
        palette: ["#d81b60", "#ec407a", "#f8bbd0", "#3a1528"]
      },
      {
        id: "arctic-white",
        name: "Arctic White",
        icon: "🏔️",
        colors: {
          primary: "#455a64",
          secondary: "#607d8b",
          accent: "#b0bec5",
          background: "#0f1419",
          card: "#1e2730",
          text: "#eceff1",
          title: "#b0bec5",
          border: "#37474f",
          muted: "#90a4ae"
        },
        palette: ["#455a64", "#607d8b", "#b0bec5", "#1e2730"]
      }
    ];

    state.themesLibrary = themesData;
    renderThemesLibrary();

    // Essayer de charger depuis le fichier JSON en parallèle (optionnel)
    fetch('./themes-library.json')
      .then(function(response) {
        if (response.ok) return response.json();
        throw new Error('Fichier non trouvé');
      })
      .then(function(data) {
        if (data.themes && data.themes.length > 0) {
          state.themesLibrary = data.themes;
          renderThemesLibrary();
          console.log('[Settings] Thèmes chargés depuis le fichier JSON');
        }
      })
      .catch(function(error) {
        console.log('[Settings] Utilisation des thèmes intégrés (fichier JSON non disponible)');
      });
  }

  function renderThemesLibrary() {
    var container = document.getElementById('themes-library-grid');
    if (!container || !state.themesLibrary) return;

    var html = '';
    state.themesLibrary.forEach(function(theme) {
      html += '<div class="theme-card" data-theme-id="' + theme.id + '">';
      html += '  <div class="theme-card-header">';
      html += '    <span class="theme-card-icon">' + theme.icon + '</span>';
      html += '    <span class="theme-card-name">' + theme.name + '</span>';
      html += '  </div>';
      html += '  <div class="theme-palette">';
      theme.palette.forEach(function(color) {
        html += '<div class="theme-color-swatch" style="background-color: ' + color + '"></div>';
      });
      html += '  </div>';
      html += '  <button class="theme-apply-btn" data-theme-id="' + theme.id + '">Appliquer</button>';
      html += '</div>';
    });

    container.innerHTML = html;

    // Event listeners pour boutons Apply
    container.querySelectorAll('.theme-apply-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var themeId = this.getAttribute('data-theme-id');
        applyTheme(themeId);
      });
    });
  }

  // Helper pour convertir hex en RGB
  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
      parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16) :
      null;
  }

  function applyTheme(themeId) {
    var theme = state.themesLibrary.find(function(t) { return t.id === themeId; });
    if (!theme) return;

    if (confirm('Appliquer le thème "' + theme.name + '" à l\'application ?\n\nCela modifiera les couleurs de l\'interface et des modes de jeu.')) {
      // Appliquer les CSS variables principales
      var root = document.documentElement;
      if (theme.colors.primary) {
        root.style.setProperty('--brand-primary', theme.colors.primary);
        root.style.setProperty('--brand-primary-rgb', hexToRgb(theme.colors.primary));
      }
      if (theme.colors.secondary) {
        root.style.setProperty('--brand-secondary', theme.colors.secondary);
        root.style.setProperty('--brand-secondary-rgb', hexToRgb(theme.colors.secondary));
      }
      if (theme.colors.accent) {
        root.style.setProperty('--brand-accent', theme.colors.accent);
        root.style.setProperty('--brand-accent-rgb', hexToRgb(theme.colors.accent));
      }
      if (theme.colors.background) {
        root.style.setProperty('--brand-bg', theme.colors.background);
        root.style.setProperty('--brand-bg-rgb', hexToRgb(theme.colors.background));
      }
      if (theme.colors.card) {
        root.style.setProperty('--brand-card-bg', theme.colors.card);
        root.style.setProperty('--brand-card-bg-rgb', hexToRgb(theme.colors.card));
      }
      if (theme.colors.text) {
        root.style.setProperty('--brand-text', theme.colors.text);
        root.style.setProperty('--brand-text-rgb', hexToRgb(theme.colors.text));
      }
      if (theme.colors.title) {
        root.style.setProperty('--brand-title', theme.colors.title);
        root.style.setProperty('--brand-title-rgb', hexToRgb(theme.colors.title));
      }
      if (theme.colors.border) root.style.setProperty('--border', theme.colors.border);
      if (theme.colors.muted) root.style.setProperty('--muted', theme.colors.muted);

      // Appliquer aussi aux variables utilisées par les modes de jeu
      // Variables du moteur tournoi classique et autres modes
      if (theme.colors.primary) root.style.setProperty('--blue-strong', theme.colors.primary);
      if (theme.colors.secondary) root.style.setProperty('--blue-mid', theme.colors.secondary);
      if (theme.colors.accent) {
        root.style.setProperty('--accent', theme.colors.accent);
        root.style.setProperty('--blue-soft', theme.colors.accent);
      }
      if (theme.colors.background) root.style.setProperty('--bg-dark', theme.colors.background);
      if (theme.colors.card) root.style.setProperty('--card', theme.colors.card);
      if (theme.colors.text) root.style.setProperty('--text', theme.colors.text);

      // Variables de succès et danger (garder les mêmes pour cohérence)
      root.style.setProperty('--success', '#22c55e');
      root.style.setProperty('--danger', '#ef4444');

      // Sauvegarder dans localStorage pour persistance
      saveToStorage(STORAGE_KEYS.activeTheme, theme);

      showNotification('Thème "' + theme.name + '" appliqué avec succès!\n\nLes couleurs sont maintenant appliquées à toute l\'application.', 'success');
    }
  }

  // ========================================
  // RESTAURATION DU THÈME AU CHARGEMENT
  // ========================================

  function restoreSavedTheme() {
    var savedTheme = loadFromStorage(STORAGE_KEYS.activeTheme, null);
    if (!savedTheme || !savedTheme.colors) return;

    console.log('[Settings] Restauration du thème:', savedTheme.name);

    // Appliquer les CSS variables sans confirmation
    var root = document.documentElement;
    if (savedTheme.colors.primary) {
      root.style.setProperty('--brand-primary', savedTheme.colors.primary);
      root.style.setProperty('--brand-primary-rgb', hexToRgb(savedTheme.colors.primary));
    }
    if (savedTheme.colors.secondary) {
      root.style.setProperty('--brand-secondary', savedTheme.colors.secondary);
      root.style.setProperty('--brand-secondary-rgb', hexToRgb(savedTheme.colors.secondary));
    }
    if (savedTheme.colors.accent) {
      root.style.setProperty('--brand-accent', savedTheme.colors.accent);
      root.style.setProperty('--brand-accent-rgb', hexToRgb(savedTheme.colors.accent));
    }
    if (savedTheme.colors.background) {
      root.style.setProperty('--brand-bg', savedTheme.colors.background);
      root.style.setProperty('--brand-bg-rgb', hexToRgb(savedTheme.colors.background));
    }
    if (savedTheme.colors.card) {
      root.style.setProperty('--brand-card-bg', savedTheme.colors.card);
      root.style.setProperty('--brand-card-bg-rgb', hexToRgb(savedTheme.colors.card));
    }
    if (savedTheme.colors.text) {
      root.style.setProperty('--brand-text', savedTheme.colors.text);
      root.style.setProperty('--brand-text-rgb', hexToRgb(savedTheme.colors.text));
    }
    if (savedTheme.colors.title) {
      root.style.setProperty('--brand-title', savedTheme.colors.title);
      root.style.setProperty('--brand-title-rgb', hexToRgb(savedTheme.colors.title));
    }
    if (savedTheme.colors.border) root.style.setProperty('--border', savedTheme.colors.border);
    if (savedTheme.colors.muted) root.style.setProperty('--muted', savedTheme.colors.muted);

    // Variables des modes de jeu
    if (savedTheme.colors.primary) root.style.setProperty('--blue-strong', savedTheme.colors.primary);
    if (savedTheme.colors.secondary) root.style.setProperty('--blue-mid', savedTheme.colors.secondary);
    if (savedTheme.colors.accent) {
      root.style.setProperty('--accent', savedTheme.colors.accent);
      root.style.setProperty('--blue-soft', savedTheme.colors.accent);
    }
    if (savedTheme.colors.background) root.style.setProperty('--bg-dark', savedTheme.colors.background);
    if (savedTheme.colors.card) root.style.setProperty('--card', savedTheme.colors.card);
    if (savedTheme.colors.text) root.style.setProperty('--text', savedTheme.colors.text);

    root.style.setProperty('--success', '#22c55e');
    root.style.setProperty('--danger', '#ef4444');
  }

  // ========================================
  // GESTION FICHIERS
  // ========================================

  function handleFileUpload(event, callback) {
    var file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Le fichier doit être une image', 'error');
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      if (callback) callback(e.target.result);
    };
    reader.onerror = function() {
      showNotification('Erreur lecture du fichier', 'error');
    };
    reader.readAsDataURL(file);
  }

  // ========================================
  // GESTION MODIFICATIONS NON SAUVEGARDÉES
  // ========================================

  function markUnsaved() {
    state.unsavedChanges = true;
  }

  function clearUnsaved() {
    state.unsavedChanges = false;
  }

  // ========================================
  // ONGLET 6 : VUE TV
  // ========================================

  var tvViewState = {
    currentMode: 'md', // md, classic, americano, solonight
    currentConfig: null
  };

  var DEFAULT_TV_CONFIG = {
    id: '',
    name: 'Configuration par défaut',
    blocks: {
      current_matches: { enabled: true, duration: 10 },
      ranking: { enabled: true, duration: 8 },
      next_matches: { enabled: true, duration: 6 },
      podium: { enabled: true, duration: 5 },
      resting_teams: { enabled: false, duration: 5 },
      stats: { enabled: false, duration: 5 }
    },
    rotation: {
      enabled: true,
      order: ['current_matches', 'ranking', 'next_matches', 'podium'],
      pauseOnHover: true,
      showIndicator: true,
      transition: { type: 'fade', duration: 0.5 }
    },
    layout: {
      type: 'fullscreen',
      zones: { main: 'current_matches', secondary: 'ranking' },
      ratios: { main: 60, secondary: 40 }
    },
    animations: {
      enabled: true,
      confetti: { enabled: true, intensity: 3, colors: 'theme' },
      flash: { enabled: true, duration: 0.5 },
      badge: { enabled: true, duration: 5 },
      scale: { enabled: true, factor: 1.05 },
      sound: { enabled: false, volume: 50, type: 'ding' }
    },
    header: {
      enabled: true,
      logo: 'left',
      title: 'center',
      clock: 'right',
      live: true
    },
    footer: {
      enabled: false,
      text: '',
      align: 'center'
    }
  };

  function initTVViewTab() {
    console.log('[Settings] Init TV View tab');

    // Initialiser les sous-onglets (navigation mode)
    initTVModeTabs();

    // Initialiser les sliders
    initTVSliders();

    // Initialiser les toggles
    initTVToggles();

    // Initialiser drag & drop
    initTVDragDrop();

    // Initialiser les boutons d'action
    initTVActions();

    // Charger la config du mode actuel
    loadTVConfig(tvViewState.currentMode);

    // Afficher les configs sauvegardées
    renderSavedConfigs(tvViewState.currentMode);
  }

  function initTVModeTabs() {
    var modeTabs = document.querySelectorAll('.tvview-mode-tab');
    modeTabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var mode = this.getAttribute('data-mode');
        switchTVMode(mode);
      });
    });
  }

  function switchTVMode(mode) {
    tvViewState.currentMode = mode;

    // Update tab active state
    document.querySelectorAll('.tvview-mode-tab').forEach(function(tab) {
      tab.classList.remove('active');
    });
    document.querySelector('.tvview-mode-tab[data-mode="' + mode + '"]').classList.add('active');

    // Update panel active state
    document.querySelectorAll('.tvview-mode-panel').forEach(function(panel) {
      panel.classList.remove('active');
    });
    document.querySelector('.tvview-mode-panel[data-mode="' + mode + '"]').classList.add('active');

    // Load config for this mode
    loadTVConfig(mode);
  }

  function initTVSliders() {
    // Tous les sliders de durée
    var sliders = document.querySelectorAll('.duration-slider');
    sliders.forEach(function(slider) {
      slider.addEventListener('input', function() {
        updateSliderValue(this);
      });
    });

    // Initialiser les valeurs affichées
    sliders.forEach(function(slider) {
      updateSliderValue(slider);
    });
  }

  function updateSliderValue(slider) {
    var value = slider.value;
    var valueDisplay = slider.parentElement.querySelector('.duration-value');

    if (valueDisplay) {
      // Format selon le type de slider
      if (slider.id.includes('intensity')) {
        var labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
        valueDisplay.textContent = labels[value - 1] || value;
      } else if (slider.id.includes('volume')) {
        valueDisplay.textContent = value + '%';
      } else if (slider.id.includes('transition-duration')) {
        valueDisplay.textContent = value + 's';
      } else {
        valueDisplay.textContent = value + 's';
      }
    }
  }

  function initTVToggles() {
    // Toggle pour activer/désactiver sections
    var rotationToggle = document.getElementById('md-rotation-enabled');
    if (rotationToggle) {
      rotationToggle.addEventListener('change', function() {
        var settings = document.getElementById('md-rotation-settings');
        if (settings) {
          settings.style.display = this.checked ? 'block' : 'none';
        }
      });
    }

    var animationsToggle = document.getElementById('md-animations-enabled');
    if (animationsToggle) {
      animationsToggle.addEventListener('change', function() {
        var settings = document.getElementById('md-animations-settings');
        if (settings) {
          settings.style.display = this.checked ? 'block' : 'none';
        }
      });
    }

    var headerToggle = document.getElementById('md-header-enabled');
    if (headerToggle) {
      headerToggle.addEventListener('change', function() {
        var settings = document.getElementById('md-header-settings');
        if (settings) {
          settings.style.display = this.checked ? 'block' : 'none';
        }
      });
    }

    var footerToggle = document.getElementById('md-footer-enabled');
    if (footerToggle) {
      footerToggle.addEventListener('change', function() {
        var settings = document.getElementById('md-footer-settings');
        if (settings) {
          settings.style.display = this.checked ? 'block' : 'none';
        }
      });
    }

    // Toggle pour type de son custom
    var soundType = document.getElementById('md-sound-type');
    if (soundType) {
      soundType.addEventListener('change', function() {
        var uploadField = document.getElementById('md-sound-upload-field');
        if (uploadField) {
          uploadField.style.display = this.value === 'custom' ? 'block' : 'none';
        }
      });
    }
  }

  function initTVDragDrop() {
    var rotationOrder = document.getElementById('md-rotation-order');
    if (!rotationOrder) return;

    var draggingElement = null;

    rotationOrder.addEventListener('dragstart', function(e) {
      if (!e.target.classList.contains('rotation-item')) return;
      draggingElement = e.target;
      e.target.classList.add('dragging');
    });

    rotationOrder.addEventListener('dragend', function(e) {
      if (!e.target.classList.contains('rotation-item')) return;
      e.target.classList.remove('dragging');
      updateRotationNumbers();
    });

    rotationOrder.addEventListener('dragover', function(e) {
      e.preventDefault();
      var afterElement = getDragAfterElement(rotationOrder, e.clientY);
      if (afterElement == null) {
        rotationOrder.appendChild(draggingElement);
      } else {
        rotationOrder.insertBefore(draggingElement, afterElement);
      }
    });
  }

  function getDragAfterElement(container, y) {
    var draggableElements = Array.from(container.querySelectorAll('.rotation-item:not(.dragging)'));

    return draggableElements.reduce(function(closest, child) {
      var box = child.getBoundingClientRect();
      var offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function updateRotationNumbers() {
    var items = document.querySelectorAll('#md-rotation-order .rotation-item');
    items.forEach(function(item, index) {
      var numberSpan = item.querySelector('.rotation-number');
      if (numberSpan) {
        numberSpan.textContent = (index + 1) + '.';
      }
    });
  }

  function initTVActions() {
    // Sauvegarder config
    var saveBtn = document.getElementById('md-save-config');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        saveTVConfig(tvViewState.currentMode);
      });
    }

    // Dupliquer config
    var duplicateBtn = document.getElementById('md-duplicate-config');
    if (duplicateBtn) {
      duplicateBtn.addEventListener('click', function() {
        duplicateTVConfig(tvViewState.currentMode);
      });
    }

    // Réinitialiser config
    var resetBtn = document.getElementById('md-reset-config');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (confirm('Réinitialiser cette configuration aux valeurs par défaut ?')) {
          resetTVConfig(tvViewState.currentMode);
        }
      });
    }

    // Export config
    var exportBtn = document.getElementById('md-export-config');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        exportTVConfig(tvViewState.currentMode);
      });
    }

    // Import config
    var importBtn = document.getElementById('md-import-config');
    if (importBtn) {
      importBtn.addEventListener('click', function() {
        document.getElementById('md-import-file').click();
      });
    }

    var importFile = document.getElementById('md-import-file');
    if (importFile) {
      importFile.addEventListener('change', function(e) {
        importTVConfig(e.target.files[0], tvViewState.currentMode);
      });
    }

    // Tester animation
    var testBtn = document.getElementById('md-test-animation');
    if (testBtn) {
      testBtn.addEventListener('click', function() {
        testTVAnimation();
      });
    }

    // Appliquer aux modes sélectionnés
    var applyToModesBtn = document.getElementById('md-apply-to-modes');
    if (applyToModesBtn) {
      applyToModesBtn.addEventListener('click', function() {
        applyConfigToModes(tvViewState.currentMode);
      });
    }
  }

  function loadTVConfig(mode) {
    var storageKey = mode === 'md' ? STORAGE_KEYS.tvConfigMD :
                     mode === 'classic' ? STORAGE_KEYS.tvConfigClassic :
                     mode === 'americano' ? STORAGE_KEYS.tvConfigAmericano :
                     mode === 'solonight' ? STORAGE_KEYS.tvConfigSoloNight :
                     STORAGE_KEYS.tvConfigMD; // Fallback to MD

    var config = loadFromStorage(storageKey, null);

    if (!config) {
      config = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG));
      config.id = mode;
      config.name = 'Configuration ' + (mode === 'md' ? 'M/D' :
                                        mode === 'classic' ? 'Tournoi Classique' :
                                        mode === 'americano' ? 'Américano' :
                                        mode === 'solonight' ? 'Solo Night' : mode.toUpperCase());
    }

    tvViewState.currentConfig = config;
    applyTVConfigToUI(config, mode);
  }

  function applyTVConfigToUI(config, mode) {
    var prefix = mode; // md, classic, americano

    // Appliquer les checkboxes des blocs
    for (var blockId in config.blocks) {
      var checkbox = document.getElementById(prefix + '-block-' + blockId.replace('_', '-'));
      if (checkbox) {
        checkbox.checked = config.blocks[blockId].enabled;
      }
    }

    // Appliquer les durées
    for (var blockId in config.blocks) {
      var slider = document.getElementById(prefix + '-duration-' + blockId.replace('_', '-'));
      if (slider) {
        slider.value = config.blocks[blockId].duration;
        updateSliderValue(slider);
      }
    }

    // Appliquer rotation settings
    var rotationEnabled = document.getElementById(prefix + '-rotation-enabled');
    if (rotationEnabled) {
      rotationEnabled.checked = config.rotation.enabled;
      rotationEnabled.dispatchEvent(new Event('change'));
    }

    // Layout
    var layoutRadio = document.querySelector('input[name="' + prefix + '-layout"][value="' + config.layout.type + '"]');
    if (layoutRadio) {
      layoutRadio.checked = true;
    }

    // Animations
    var animationsEnabled = document.getElementById(prefix + '-animations-enabled');
    if (animationsEnabled) {
      animationsEnabled.checked = config.animations.enabled;
      animationsEnabled.dispatchEvent(new Event('change'));
    }

    // Header/Footer
    var headerEnabled = document.getElementById(prefix + '-header-enabled');
    if (headerEnabled) {
      headerEnabled.checked = config.header.enabled;
      headerEnabled.dispatchEvent(new Event('change'));
    }

    var footerEnabled = document.getElementById(prefix + '-footer-enabled');
    if (footerEnabled) {
      footerEnabled.checked = config.footer.enabled;
      footerEnabled.dispatchEvent(new Event('change'));
    }

    // Config name
    var configName = document.getElementById(prefix + '-config-name');
    if (configName) {
      configName.value = config.name;
    }
  }

  function saveTVConfig(mode) {
    var config = gatherTVConfigFromUI(mode);

    var storageKey = mode === 'md' ? STORAGE_KEYS.tvConfigMD :
                     mode === 'classic' ? STORAGE_KEYS.tvConfigClassic :
                     mode === 'americano' ? STORAGE_KEYS.tvConfigAmericano :
                     mode === 'solonight' ? STORAGE_KEYS.tvConfigSoloNight :
                     STORAGE_KEYS.tvConfigMD; // Fallback to MD

    // Sauvegarder la config principale
    saveToStorage(storageKey, config);
    tvViewState.currentConfig = config;

    // Sauvegarder aussi dans la bibliothèque
    var library = loadFromStorage(STORAGE_KEYS.tvConfigsLibrary, []);
    var existingIndex = library.findIndex(function(c) { return c.id === config.id; });

    if (existingIndex !== -1) {
      // Mettre à jour config existante
      library[existingIndex] = config;
    } else {
      // Ajouter nouvelle config
      library.push(config);
    }

    saveToStorage(STORAGE_KEYS.tvConfigsLibrary, library);

    // Recharger la liste des configs sauvegardées
    renderSavedConfigs(mode);

    // Mettre à jour la vue TV si elle est active
    if (mode === 'md' && typeof window.mdInitTVSystems === 'function') {
      // Réinitialiser les systèmes TV avec la nouvelle config
      if (typeof window.mdDestroyTVSystems === 'function') {
        window.mdDestroyTVSystems();
      }
      // Re-render la vue
      if (typeof window.mdRenderTvView === 'function') {
        window.mdRenderTvView();
      }
      // Réinitialiser avec la nouvelle config
      window.mdInitTVSystems();
    } else if (mode === 'classic' && typeof window.classicInitTVSystems === 'function') {
      // Réinitialiser les systèmes TV pour Classic
      if (typeof window.classicDestroyTVSystems === 'function') {
        window.classicDestroyTVSystems();
      }
      // Réinitialiser avec la nouvelle config
      window.classicInitTVSystems();
    } else if (mode === 'americano' && window.AMERICANO && typeof window.AMERICANO.initTVSystems === 'function') {
      // Réinitialiser les systèmes TV pour Americano
      if (typeof window.AMERICANO.destroyTVSystems === 'function') {
        window.AMERICANO.destroyTVSystems();
      }
      // Re-render la vue TV
      if (typeof window.AMERICANO.renderTv === 'function') {
        window.AMERICANO.renderTv();
      }
      // Réinitialiser avec la nouvelle config
      window.AMERICANO.initTVSystems();
    } else if (mode === 'solonight' && window.SOLONIGHT && typeof window.SOLONIGHT.initTVSystems === 'function') {
      // Réinitialiser les systèmes TV pour Solo Night
      if (typeof window.SOLONIGHT.destroyTVSystems === 'function') {
        window.SOLONIGHT.destroyTVSystems();
      }
      // Re-render la vue TV
      if (typeof window.SOLONIGHT.renderTv === 'function') {
        window.SOLONIGHT.renderTv();
      }
      // Réinitialiser avec la nouvelle config
      window.SOLONIGHT.initTVSystems();
    }

    showNotification('Configuration TV sauvegardée avec succès !', 'success');
  }

  function renderSavedConfigs(mode) {
    var container = document.getElementById(mode + '-saved-configs');
    if (!container) return;

    var library = loadFromStorage(STORAGE_KEYS.tvConfigsLibrary, []);
    var modeConfigs = library.filter(function(c) { return c.id === mode; });

    if (modeConfigs.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>💾</p><p>Aucune configuration sauvegardée</p></div>';
      return;
    }

    var html = '';
    modeConfigs.forEach(function(config) {
      html += '<div class="saved-config-item" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 8px;">';
      html += '  <div style="display: flex; justify-content: space-between; align-items: center;">';
      html += '    <div>';
      html += '      <div style="font-weight: 600; margin-bottom: 4px;">' + (config.name || 'Sans nom') + '</div>';
      html += '      <div style="font-size: 0.85rem; color: var(--muted);">';
      html += '        Rotation: ' + (config.rotation.enabled ? 'Activée' : 'Désactivée');
      html += '        • Layout: ' + config.layout.type;
      html += '      </div>';
      html += '    </div>';
      html += '    <button class="btn btn-secondary btn-small" onclick="window.settingsLoadTVConfig(\'' + mode + '\')">Charger</button>';
      html += '  </div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  function applyConfigToModes(sourceMode) {
    console.log('[Settings] Application config aux autres modes depuis:', sourceMode);

    // Récupérer la config source
    var sourceKey = sourceMode === 'md' ? STORAGE_KEYS.tvConfigMD :
                    sourceMode === 'classic' ? STORAGE_KEYS.tvConfigClassic :
                    STORAGE_KEYS.tvConfigAmericano;

    var sourceConfig = loadFromStorage(sourceKey, null);
    if (!sourceConfig) {
      showNotification('Aucune configuration à transférer', 'error');
      return;
    }

    // Récupérer les modes cibles sélectionnés
    var targetModes = [];
    if (sourceMode === 'md') {
      if (document.getElementById('md-apply-to-classic') && document.getElementById('md-apply-to-classic').checked) {
        targetModes.push('classic');
      }
      if (document.getElementById('md-apply-to-americano') && document.getElementById('md-apply-to-americano').checked) {
        targetModes.push('americano');
      }
    }

    if (targetModes.length === 0) {
      showNotification('Sélectionnez au moins un mode cible', 'warning');
      return;
    }

    // Appliquer la config à chaque mode cible
    var applied = 0;
    targetModes.forEach(function(targetMode) {
      // Créer une copie de la config
      var targetConfig = JSON.parse(JSON.stringify(sourceConfig));

      // Ajuster l'ID et le nom
      targetConfig.id = targetMode;
      targetConfig.name = 'Configuration ' + (targetMode === 'classic' ? 'Tournoi Classique' :
                                               targetMode === 'americano' ? 'Américano' : targetMode);

      // Sauvegarder dans le mode cible
      var targetKey = targetMode === 'md' ? STORAGE_KEYS.tvConfigMD :
                      targetMode === 'classic' ? STORAGE_KEYS.tvConfigClassic :
                      STORAGE_KEYS.tvConfigAmericano;

      if (saveToStorage(targetKey, targetConfig)) {
        applied++;

        // Aussi sauvegarder dans la bibliothèque
        var library = loadFromStorage(STORAGE_KEYS.tvConfigsLibrary, []);
        var existingIndex = library.findIndex(function(c) { return c.id === targetConfig.id; });
        if (existingIndex !== -1) {
          library[existingIndex] = targetConfig;
        } else {
          library.push(targetConfig);
        }
        saveToStorage(STORAGE_KEYS.tvConfigsLibrary, library);
      }
    });

    // Décocher les cases
    if (sourceMode === 'md') {
      var classicCheckbox = document.getElementById('md-apply-to-classic');
      var americanoCheckbox = document.getElementById('md-apply-to-americano');
      if (classicCheckbox) classicCheckbox.checked = false;
      if (americanoCheckbox) americanoCheckbox.checked = false;
    }

    if (applied > 0) {
      showNotification('Configuration appliquée à ' + applied + ' mode(s) !', 'success');
    } else {
      showNotification('Erreur lors du transfert', 'error');
    }
  }

  function gatherTVConfigFromUI(mode) {
    var prefix = mode;
    var config = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG));
    config.id = mode;

    // Nom de la config
    var configName = document.getElementById(prefix + '-config-name');
    if (configName) {
      config.name = configName.value;
    }

    // Blocs
    for (var blockId in config.blocks) {
      var checkbox = document.getElementById(prefix + '-block-' + blockId.replace('_', '-'));
      if (checkbox) {
        config.blocks[blockId].enabled = checkbox.checked;
      }

      var slider = document.getElementById(prefix + '-duration-' + blockId.replace('_', '-'));
      if (slider) {
        config.blocks[blockId].duration = parseInt(slider.value);
      }
    }

    // Rotation
    var rotationEnabled = document.getElementById(prefix + '-rotation-enabled');
    if (rotationEnabled) {
      config.rotation.enabled = rotationEnabled.checked;
    }

    // Gather rotation order from DOM
    var rotationItems = document.querySelectorAll('#' + prefix + '-rotation-order .rotation-item');
    config.rotation.order = Array.from(rotationItems).map(function(item) {
      return item.getAttribute('data-block');
    });

    // Layout
    var layoutRadio = document.querySelector('input[name="' + prefix + '-layout"]:checked');
    if (layoutRadio) {
      config.layout.type = layoutRadio.value;
    }

    // Animations
    var animationsEnabled = document.getElementById(prefix + '-animations-enabled');
    if (animationsEnabled) {
      config.animations.enabled = animationsEnabled.checked;
    }

    // Header
    var headerEnabled = document.getElementById(prefix + '-header-enabled');
    if (headerEnabled) {
      config.header.enabled = headerEnabled.checked;
    }

    // Footer
    var footerEnabled = document.getElementById(prefix + '-footer-enabled');
    if (footerEnabled) {
      config.footer.enabled = footerEnabled.checked;
    }

    var footerText = document.getElementById(prefix + '-footer-text');
    if (footerText) {
      config.footer.text = footerText.value;
    }

    return config;
  }

  function duplicateTVConfig(mode) {
    var config = gatherTVConfigFromUI(mode);
    config.name = config.name + ' (copie)';

    // TODO: Implement library management
    showNotification('Fonction de duplication en développement', 'info');
  }

  function resetTVConfig(mode) {
    var config = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG));
    config.id = mode;
    config.name = 'Configuration ' + mode.toUpperCase();

    applyTVConfigToUI(config, mode);
    saveTVConfig(mode);
  }

  function exportTVConfig(mode) {
    var config = gatherTVConfigFromUI(mode);

    var dataStr = JSON.stringify(config, null, 2);
    var dataBlob = new Blob([dataStr], { type: 'application/json' });
    var url = URL.createObjectURL(dataBlob);

    var link = document.createElement('a');
    link.download = 'tv-config-' + mode + '-' + Date.now() + '.json';
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
    showNotification('Configuration exportée !', 'success');
  }

  function importTVConfig(file, mode) {
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var config = JSON.parse(e.target.result);
        config.id = mode; // Force current mode

        applyTVConfigToUI(config, mode);
        saveTVConfig(mode);

        showNotification('Configuration importée avec succès !', 'success');
      } catch (err) {
        showNotification('Erreur lors de l\'import : fichier invalide', 'error');
      }
    };
    reader.readAsText(file);
  }

  function testTVAnimation() {
    showNotification('Test animation - Fonctionnalité en développement', 'info');
    // TODO: Trigger test confetti/animation
  }

  // ========================================
  // MIGRATION DES DONNÉES EXISTANTES
  // ========================================

  function migrateOldTVSettings() {
    // Vérifier si déjà migré
    if (localStorage.getItem('tv_migration_done')) {
      return;
    }

    console.log('[Settings] Migration des anciennes configs TV...');

    var migrationCount = 0;

    // 1. Migrer toggles sponsors TV (ancien système)
    var oldMdToggle = localStorage.getItem('app-sponsor-md-toggle');
    var oldClassicToggle = localStorage.getItem('app-sponsor-classic-toggle');

    if (oldMdToggle || oldClassicToggle) {
      var sponsorsTVSettings = {
        enabled: true,
        position: 'top-right',
        size: { width: 200, height: 80 },
        style: 'banner',
        duration: 5,
        transition: { type: 'fade', duration: 0.3 },
        fairRotation: true,
        modes: {
          md: oldMdToggle !== 'false',
          classic: oldClassicToggle !== 'false',
          americano: true
        }
      };
      saveToStorage(STORAGE_KEYS.sponsorsTVSettings, sponsorsTVSettings);
      migrationCount++;
      console.log('[Settings] ✓ Sponsors TV migrés');
    }

    // 2. Migrer positions widgets Pong (ancien système)
    var mdPongPos = localStorage.getItem('tvSponsorMdPos');
    var classicPongPos = localStorage.getItem('tvSponsorClassicPos');

    if (mdPongPos || classicPongPos) {
      // Parser les positions si elles existent
      var position = 'bottom-right'; // Valeur par défaut
      var offset = { x: 20, y: 20 };

      try {
        if (mdPongPos) {
          var pos = JSON.parse(mdPongPos);
          if (pos.x !== undefined && pos.y !== undefined) {
            offset = { x: pos.x, y: pos.y };
          }
        }
      } catch (e) {
        console.warn('[Settings] Erreur parsing position Pong:', e);
      }

      var pongTVWidget = {
        enabled: true,
        position: position,
        offset: offset,
        size: 'medium',
        content: { qr: true, text: true, sponsor: true },
        customText: 'Scanne & joue !',
        style: { bg: 'semi', border: 'accent', radius: 12 },
        draggable: true,
        hideButton: true,
        modes: { md: !!mdPongPos, classic: !!classicPongPos, americano: false }
      };
      saveToStorage(STORAGE_KEYS.pongTVWidget, pongTVWidget);
      migrationCount++;
      console.log('[Settings] ✓ Widget Pong migré');
    }

    // 3. Créer configs TV par défaut si elles n'existent pas
    if (!loadFromStorage(STORAGE_KEYS.tvConfigMD, null)) {
      var mdConfig = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG));
      mdConfig.id = 'md';
      mdConfig.name = 'Configuration M/D';
      saveToStorage(STORAGE_KEYS.tvConfigMD, mdConfig);
      migrationCount++;
      console.log('[Settings] ✓ Config TV M/D créée');
    }

    if (!loadFromStorage(STORAGE_KEYS.tvConfigClassic, null)) {
      var classicConfig = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG));
      classicConfig.id = 'classic';
      classicConfig.name = 'Configuration Tournoi Classique';
      saveToStorage(STORAGE_KEYS.tvConfigClassic, classicConfig);
      migrationCount++;
      console.log('[Settings] ✓ Config TV Classic créée');
    }

    if (!loadFromStorage(STORAGE_KEYS.tvConfigAmericano, null)) {
      var americanoConfig = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG));
      americanoConfig.id = 'americano';
      americanoConfig.name = 'Configuration Américano';
      saveToStorage(STORAGE_KEYS.tvConfigAmericano, americanoConfig);
      migrationCount++;
      console.log('[Settings] ✓ Config TV Américano créée');
    }

    if (!loadFromStorage(STORAGE_KEYS.tvConfigSoloNight, null)) {
      var solonightConfig = JSON.parse(JSON.stringify(DEFAULT_TV_CONFIG));
      solonightConfig.id = 'solonight';
      solonightConfig.name = 'Configuration Solo Night';
      saveToStorage(STORAGE_KEYS.tvConfigSoloNight, solonightConfig);
      migrationCount++;
      console.log('[Settings] ✓ Config TV Solo Night créée');
    }

    // Marquer migration comme terminée
    localStorage.setItem('tv_migration_done', 'true');

    if (migrationCount > 0) {
      console.log('[Settings] Migration terminée : ' + migrationCount + ' éléments migrés');
    } else {
      console.log('[Settings] Migration terminée : aucune donnée à migrer');
    }
  }

  // ========================================
  // INITIALISATION
  // ========================================

  function init() {
    console.log('[Settings] Initialisation...');

    // Restaurer le thème sauvegardé immédiatement (avant même de vérifier settings-root)
    // Cela permet d'appliquer le thème à toute l'application, pas seulement aux paramètres
    restoreSavedTheme();

    // Migrer les anciennes configurations TV
    migrateOldTVSettings();

    // Vérifier que nous sommes sur la page settings
    var settingsRoot = document.getElementById('settings-root');
    if (!settingsRoot) {
      console.log('[Settings] Page settings non trouvée, mais thème restauré');
      return;
    }

    // Initialiser navigation
    initTabs();

    // Initialiser chaque onglet
    initClubTab();
    initSponsorsTab();
    initPongTab();
    initExportsTab();
    initThemeTab();
    initTVViewTab();

    // Warning avant quitter si modifications non sauvegardées
    window.addEventListener('beforeunload', function(e) {
      if (state.unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées';
        return e.returnValue;
      }
    });

    console.log('[Settings] Initialisé avec succès');
  }

  // Lancer l'initialisation quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
