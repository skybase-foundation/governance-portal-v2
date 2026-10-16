/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

// Applies the persisted theme-ui color mode before React hydrates, so dark mode users don't see a
// light flash. Same script as theme-ui's InitializeColorMode, kept here so the CSP can allow it by a
// hash of this exact string (see lib/csp.js). Plain CommonJS because next.config.js requires it.
const COLOR_MODE_SCRIPT = `(function() { try {
  var mode = localStorage.getItem('theme-ui-color-mode');
  if (!mode) return
  document.documentElement.classList.add('theme-ui-' + mode);
} catch (e) {} })();`;

module.exports = { COLOR_MODE_SCRIPT };
