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
    activeTab: 'settings_active_tab'
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
      name: panel.querySelector('#sponsor-name'),
      logoUpload: panel.querySelector('#sponsor-logo-upload'),
      category: panel.querySelector('#sponsor-category'),
      url: panel.querySelector('#sponsor-url'),
      addBtn: panel.querySelector('#btn-add-new-sponsor'),
      listContainer: panel.querySelector('#sponsors-list-container')
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
      templateModerne: panel.querySelector('#template-moderne'),
      templateEpure: panel.querySelector('#template-epure'),
      templateSombre: panel.querySelector('#template-sombre'),
      templateSponsor: panel.querySelector('#template-sponsor'),
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

    // Templates radio buttons
    ['templateModerne', 'templateEpure', 'templateSombre', 'templateSponsor'].forEach(function(key) {
      if (refs.forms.exports[key]) {
        refs.forms.exports[key].addEventListener('change', function() {
          // Retirer selected de tous
          panel.querySelectorAll('.export-template-card').forEach(function(card) {
            card.classList.remove('selected');
          });
          // Ajouter selected au parent du radio
          this.closest('.export-template-card').classList.add('selected');
        });
      }
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
    var templateKey = 'template' + (data.template || 'moderne').charAt(0).toUpperCase() + (data.template || 'moderne').slice(1);
    if (form[templateKey]) {
      form[templateKey].checked = true;
      form[templateKey].closest('.export-template-card').classList.add('selected');
    }

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

    // Déterminer template sélectionné
    var template = 'moderne';
    if (form.templateEpure && form.templateEpure.checked) template = 'epure';
    else if (form.templateSombre && form.templateSombre.checked) template = 'sombre';
    else if (form.templateSponsor && form.templateSponsor.checked) template = 'sponsor';

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
  }

  function loadThemesLibrary() {
    fetch('themes-library.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Erreur chargement thèmes');
        return response.json();
      })
      .then(function(data) {
        state.themesLibrary = data.themes || [];
        renderThemesLibrary();
      })
      .catch(function(error) {
        console.error('Erreur chargement bibliothèque thèmes:', error);
        showNotification('Erreur chargement des thèmes', 'error');
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

  function applyTheme(themeId) {
    var theme = state.themesLibrary.find(function(t) { return t.id === themeId; });
    if (!theme) return;

    if (confirm('Appliquer le thème "' + theme.name + '" à l\'application ?\n\nCela modifiera les couleurs de l\'interface.')) {
      // Appliquer les CSS variables
      var root = document.documentElement;
      if (theme.colors.primary) root.style.setProperty('--brand-primary', theme.colors.primary);
      if (theme.colors.secondary) root.style.setProperty('--brand-secondary', theme.colors.secondary);
      if (theme.colors.accent) root.style.setProperty('--brand-accent', theme.colors.accent);
      if (theme.colors.background) root.style.setProperty('--brand-bg', theme.colors.background);
      if (theme.colors.card) root.style.setProperty('--brand-card-bg', theme.colors.card);
      if (theme.colors.text) root.style.setProperty('--brand-text', theme.colors.text);
      if (theme.colors.title) root.style.setProperty('--brand-title', theme.colors.title);
      if (theme.colors.border) root.style.setProperty('--border', theme.colors.border);
      if (theme.colors.muted) root.style.setProperty('--muted', theme.colors.muted);

      // Sauvegarder dans localStorage
      saveToStorage(STORAGE_KEYS.activeTheme, theme);

      showNotification('Thème "' + theme.name + '" appliqué avec succès!', 'success');
    }
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
  // INITIALISATION
  // ========================================

  function init() {
    // Vérifier que nous sommes sur la page settings
    var settingsRoot = document.getElementById('settings-root');
    if (!settingsRoot) return;

    console.log('[Settings] Initialisation...');

    // Initialiser navigation
    initTabs();

    // Initialiser chaque onglet
    initClubTab();
    initSponsorsTab();
    initPongTab();
    initExportsTab();
    initThemeTab();

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
