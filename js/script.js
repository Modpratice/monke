/**
 * Monkedex Vanilla JavaScript
 * Strict requirement: ONLY vanilla JavaScript, no external libraries.
 */

(function () {
  'use strict';

  // --- Theme Controller ---
  var themes = ['sepia', 'dark', 'light'];
  var themeIcons = { sepia: '▩', dark: '☾', light: '☀' };

  function initTheme() {
    var stored = localStorage.getItem('mdx-theme');
    if (!stored || (stored !== 'light' && stored !== 'dark' && stored !== 'sepia')) {
      stored = 'sepia'; // Sepia default matching screenshot
    }
    document.documentElement.dataset.theme = stored;
    updateThemeIcon(stored);
  }

  function updateThemeIcon(theme) {
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = themeIcons[theme] || '▩';
      var nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
      btn.title = 'Theme: ' + theme + ' (click to switch to ' + nextTheme + ')';
    }
  }

  function cycleTheme() {
    var current = document.documentElement.dataset.theme || 'sepia';
    var nextIndex = (themes.indexOf(current) + 1) % themes.length;
    var next = themes[nextIndex];
    document.documentElement.dataset.theme = next;
    localStorage.setItem('mdx-theme', next);
    updateThemeIcon(next);
    showToast('Theme switched to ' + next.toUpperCase());
  }

  // --- Wallet Controller ---
  var currentWallet = null;

  function initWallet() {
    try {
      var saved = JSON.parse(localStorage.getItem('monkedex.wallet'));
      if (saved && saved.account && saved.account.ordinalsAddress) {
        currentWallet = saved;
        updateWalletUI();
      }
    } catch (e) {
      currentWallet = null;
    }
  }

  function updateWalletUI() {
    var btn = document.getElementById('wallet-toggle');
    if (!btn) return;

    if (currentWallet && currentWallet.account && currentWallet.account.ordinalsAddress) {
      var addr = currentWallet.account.ordinalsAddress;
      btn.textContent = addr.slice(0, 4) + '…' + addr.slice(-4);
      btn.title = 'Connected: ' + addr;
      document.documentElement.dataset.wallet = '1';
    } else {
      btn.textContent = 'CONNECT';
      btn.title = 'Connect Bitcoin Taproot Wallet';
      delete document.documentElement.dataset.wallet;
    }

    var heroBtn = document.getElementById('hero-connect-btn');
    if (heroBtn) {
      if (currentWallet && currentWallet.account && currentWallet.account.ordinalsAddress) {
        var ha = currentWallet.account.ordinalsAddress;
        heroBtn.textContent = 'WALLET CONNECTED (' + ha.slice(0, 4) + '…' + ha.slice(-4) + ')';
      } else {
        heroBtn.textContent = 'CONNECT WALLET';
      }
    }
  }

  function openWalletModal() {
    var modal = document.getElementById('wallet-modal');
    if (modal) modal.hidden = false;
  }

  function closeWalletModal() {
    var modal = document.getElementById('wallet-modal');
    if (modal) modal.hidden = true;
  }

  function openMigrateModal() {
    var modal = document.getElementById('migrate-modal');
    if (!modal) return;
    modal.hidden = false;
    var walletStatus = document.getElementById('migrate-wallet-status');
    var assetCount = document.getElementById('migrate-asset-count');
    if (currentWallet && currentWallet.account && currentWallet.account.ordinalsAddress) {
      var a = currentWallet.account.ordinalsAddress;
      if (walletStatus) walletStatus.textContent = currentWallet.provider + ' (' + a.slice(0, 4) + '…' + a.slice(-4) + ')';
      if (assetCount) assetCount.innerHTML = '<span style="color:var(--accent);">3 Inscriptions Found</span> (#4107, #9691, #174)';
    } else {
      if (walletStatus) walletStatus.textContent = 'NOT CONNECTED (CLICK TO CONNECT)';
      if (assetCount) assetCount.textContent = 'Connect wallet to detect eligible legacy inscriptions';
    }
  }

  function closeMigrateModal() {
    var modal = document.getElementById('migrate-modal');
    if (modal) modal.hidden = true;
  }

  function connectWallet(providerName) {
    var randomHex = Math.random().toString(16).substring(2, 10);
    var simulatedAddress = 'bc1p' + randomHex + '9xy7k2q0p4' + providerName.toLowerCase().slice(0, 3);
    currentWallet = {
      provider: providerName,
      account: {
        ordinalsAddress: simulatedAddress,
        paymentAddress: simulatedAddress
      }
    };
    localStorage.setItem('monkedex.wallet', JSON.stringify(currentWallet));
    updateWalletUI();
    closeWalletModal();
    showToast('Connected to ' + providerName + ' (' + simulatedAddress.slice(0, 4) + '…' + simulatedAddress.slice(-4) + ')');
  }

  function disconnectWallet() {
    currentWallet = null;
    localStorage.removeItem('monkedex.wallet');
    updateWalletUI();
    closeWalletDropdown();
    showToast('Wallet disconnected');
  }

  function toggleWalletDropdown(e) {
    e.stopPropagation();
    if (!currentWallet) {
      openWalletModal();
      return;
    }
    var dropdown = document.getElementById('wallet-dropdown');
    if (dropdown) {
      dropdown.hidden = !dropdown.hidden;
    }
  }

  function closeWalletDropdown() {
    var dropdown = document.getElementById('wallet-dropdown');
    if (dropdown) dropdown.hidden = true;
  }

  // --- Toast notifications ---
  function showToast(message) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast ok';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2800);
  }

  // --- Monke Detail Modal ---
  var mockTraits = {
    bodies: ['Alien', 'Zombie', 'Ghost', 'Golden', 'Brown', 'Purple', 'Grey', 'Orange', 'Cyan'],
    hats: ['Bitcoin Top Hat', 'Wizard Blue', 'Viking Helmet', 'Cowboy', 'Crown', 'None', 'Cap Backwards', 'Bandana'],
    eyes: ['Laser Eyes', 'Sunglasses', 'Pixel Glasses', 'Eyepatch', 'Normal Eyes', 'Glowing Eyes'],
    mouths: ['Pipe', 'Cigarette', 'Bubblegum', 'Smile', 'Grin', 'Neutral', 'Vampire Teeth'],
    clothes: ['Hoodie Orange', 'Tuxedo', 'Kimono', 'Space Suit', 'Naked', 'Armor', 'Flannel']
  };

  function openMonkeDetail(id, title) {
    var modal = document.getElementById('monke-modal');
    if (!modal) return;

    var monkeId = id || '1';
    var rank = (parseInt(monkeId, 10) * 31 % 9999) + 1;
    var priceBtc = (0.025 + ((parseInt(monkeId, 10) % 50) * 0.0015)).toFixed(4);
    var priceUsd = Math.round(parseFloat(priceBtc) * 77120).toLocaleString();

    document.getElementById('modal-monke-id').textContent = 'MONKE #' + monkeId;
    document.getElementById('modal-monke-rank').textContent = 'RANK ' + rank + ' / 10,000';
    document.getElementById('modal-monke-price').textContent = priceBtc + ' BTC ($' + priceUsd + ')';

    var col = (parseInt(monkeId, 10) - 1) % 100;
    var row = Math.floor((parseInt(monkeId, 10) - 1) / 100);
    var art = document.getElementById('modal-monke-art');
    if (art) {
      art.style.setProperty('--col', col);
      art.style.setProperty('--row', row);
    }

    var traitsDiv = document.getElementById('modal-monke-traits');
    if (traitsDiv) {
      var b = mockTraits.bodies[parseInt(monkeId, 10) % mockTraits.bodies.length];
      var h = mockTraits.hats[(parseInt(monkeId, 10) * 3) % mockTraits.hats.length];
      var e = mockTraits.eyes[(parseInt(monkeId, 10) * 7) % mockTraits.eyes.length];
      var m = mockTraits.mouths[(parseInt(monkeId, 10) * 5) % mockTraits.mouths.length];
      traitsDiv.innerHTML = 
        '<div class="kv"><span class="k">BODY:</span> ' + b + '</div>' +
        '<div class="kv"><span class="k">HAT:</span> ' + h + '</div>' +
        '<div class="kv"><span class="k">EYES:</span> ' + e + '</div>' +
        '<div class="kv"><span class="k">MOUTH:</span> ' + m + '</div>' +
        '<div class="kv"><span class="k">INSCRIPTION:</span> #' + (83522 + (parseInt(monkeId, 10) * 2)) + '</div>';
    }

    modal.hidden = false;
  }

  function closeMonkeDetail() {
    var modal = document.getElementById('monke-modal');
    if (modal) modal.hidden = true;
  }

  // --- Watchlist ---
  function getWatchlist() {
    try {
      return JSON.parse(localStorage.getItem('monkedex.watchlist')) || [];
    } catch (e) {
      return [];
    }
  }

  function toggleWatchlist(id) {
    var list = getWatchlist();
    var idx = list.indexOf(id);
    if (idx >= 0) {
      list.splice(idx, 1);
      showToast('Removed Monke #' + id + ' from Watchlist');
    } else {
      list.push(id);
      showToast('Added Monke #' + id + ' to Watchlist ☆');
    }
    localStorage.setItem('monkedex.watchlist', JSON.stringify(list));
    renderWatchlist();
  }

  function openWatchlistModal() {
    var modal = document.getElementById('watchlist-modal');
    if (!modal) return;
    renderWatchlist();
    modal.hidden = false;
  }

  function closeWatchlistModal() {
    var modal = document.getElementById('watchlist-modal');
    if (modal) modal.hidden = true;
  }

  function renderWatchlist() {
    var container = document.getElementById('watchlist-items');
    if (!container) return;

    var list = getWatchlist();
    if (list.length === 0) {
      container.innerHTML = '<p class="dim">Nothing watched yet. Click any Monke to view details and add to your Watchlist.</p>';
      return;
    }

    var html = '<div class="monke-grid mini" style="--cols: 8">';
    for (var i = 0; i < list.length; i++) {
      var id = list[i];
      var col = (parseInt(id, 10) - 1) % 100;
      var row = Math.floor((parseInt(id, 10) - 1) / 100);
      html += '<a class="monke-tile" href="#monke-' + id + '" data-monke-id="' + id + '" title="Monke #' + id + '">' +
              '<span class="msprite" style="--col:' + col + ';--row:' + row + '"></span></a>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // --- Search Handler ---
  function handleSearch(e) {
    e.preventDefault();
    var input = document.querySelector('.search-form input');
    if (!input) return;
    var query = input.value.trim().toLowerCase();
    if (!query) return;

    // Check if query is a number
    var num = parseInt(query.replace(/[^0-9]/g, ''), 10);
    if (num >= 1 && num <= 10000) {
      openMonkeDetail(num.toString(), 'Monke #' + num);
      return;
    }

    showToast('Search query for "' + query + '" processed');
  }

  // --- Language Toggle ---
  function toggleLanguage() {
    var btn = document.getElementById('lang-toggle');
    if (!btn) return;
    var current = btn.textContent.trim();
    if (current === 'EN') {
      btn.textContent = 'ZH';
      showToast('Language: 中文 (Simplified Chinese)');
    } else {
      btn.textContent = 'EN';
      showToast('Language: English');
    }
  }

  // --- CRT Mode Toggle ---
  function toggleCRT() {
    var isCrt = document.documentElement.dataset.crt === '1';
    if (isCrt) {
      delete document.documentElement.dataset.crt;
      showToast('CRT Scanline Filter: OFF');
    } else {
      document.documentElement.dataset.crt = '1';
      showToast('CRT Scanline Filter: ON');
    }
  }

  // --- Event Bindings ---
  window.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initWallet();

    // Theme toggle
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', cycleTheme);
    }

    // Wallet toggle
    var walletBtn = document.getElementById('wallet-toggle');
    if (walletBtn) {
      walletBtn.addEventListener('click', toggleWalletDropdown);
    }

    // Language toggle
    var langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', toggleLanguage);
    }

    // Nav watchlist
    var navWatchlist = document.getElementById('nav-watchlist');
    if (navWatchlist) {
      navWatchlist.addEventListener('click', function (e) {
        e.preventDefault();
        openWatchlistModal();
      });
    }

    // Search form
    var searchForm = document.querySelector('.search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', handleSearch);
    }

    // Monke tile clicks
    document.body.addEventListener('click', function (e) {
      var tile = e.target.closest('.monke-tile');
      if (tile) {
        e.preventDefault();
        var href = tile.getAttribute('href') || '';
        var match = href.match(/\/(\d+)/) || href.match(/#monke-(\d+)/);
        var id = match ? match[1] : tile.getAttribute('data-monke-id') || '209';
        openMonkeDetail(id, tile.getAttribute('title') || ('Monke #' + id));
      }
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) {
          backdrop.hidden = true;
        }
      });
    });

    // Close wallet dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.wallet-wrap')) {
        closeWalletDropdown();
      }
    });

    // Wallet option buttons
    document.querySelectorAll('.wallet-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var provider = btn.getAttribute('data-provider') || 'Unisat';
        connectWallet(provider);
      });
    });

    // Disconnect button
    var disconnectBtn = document.getElementById('wallet-disconnect-btn');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', disconnectWallet);
    }

    // Detail modal actions
    var watchBtn = document.getElementById('modal-watch-btn');
    if (watchBtn) {
      watchBtn.addEventListener('click', function () {
        var idText = document.getElementById('modal-monke-id').textContent;
        var id = idText.replace(/\D/g, '');
        toggleWatchlist(id);
      });
    }

    var buyBtn = document.getElementById('modal-buy-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', function () {
        if (!currentWallet) {
          showToast('Please connect your Taproot wallet first');
          openWalletModal();
        } else {
          showToast('PSBT purchase signed! Broadcasted to Bitcoin mempool.');
          closeMonkeDetail();
        }
      });
    }

    // Hero action buttons
    var heroConnectBtn = document.getElementById('hero-connect-btn');
    if (heroConnectBtn) {
      heroConnectBtn.addEventListener('click', function () {
        window.location.href = 'Grah/index.html';
      });
    }

    var heroMigrateBtn = document.getElementById('hero-migrate-btn');
    if (heroMigrateBtn) {
      heroMigrateBtn.addEventListener('click', function () {
        window.location.href = 'Grah/index.html';
      });
    }

    var migrateConfirmBtn = document.getElementById('migrate-confirm-btn');
    if (migrateConfirmBtn) {
      migrateConfirmBtn.addEventListener('click', function () {
        if (!currentWallet) {
          showToast('Please connect wallet before migrating');
          openWalletModal();
          return;
        }
        migrateConfirmBtn.textContent = 'SIGNING BATCH PSBT…';
        migrateConfirmBtn.disabled = true;
        setTimeout(function () {
          migrateConfirmBtn.textContent = 'START MIGRATION';
          migrateConfirmBtn.disabled = false;
          closeMigrateModal();
          showToast('Migration batch broadcast! Inscriptions #4107, #9691, #174 upgraded.');
        }, 1500);
      });
    }
  });

  // Global exposure for inline onclick handlers if any
  window.cycleTheme = cycleTheme;
  window.openWalletModal = openWalletModal;
  window.closeWalletModal = closeWalletModal;
  window.openMigrateModal = openMigrateModal;
  window.closeMigrateModal = closeMigrateModal;
  window.closeMonkeDetail = closeMonkeDetail;
  window.closeWatchlistModal = closeWatchlistModal;
  window.toggleCRT = toggleCRT;
})();
