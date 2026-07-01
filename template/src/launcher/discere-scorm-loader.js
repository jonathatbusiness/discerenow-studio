/**
 * discere-scorm-loader.js
 * Custom SCORM API loader - minimal implementation of SCORM API discovery
 * following the public SCORM RTE spec without infringing Rustici proprietary code.
 */

(function (window) {
  "use strict";

  /**
   * Searches the window hierarchy for the SCORM 1.2 API.
   * @param {Window} win - Window where the search starts.
   * @returns {Object|null} SCORM 1.2 API reference, when available.
   */
  function findAPI(win) {
    var maxTries = 500;
    while (win && maxTries > 0) {
      if (win.API) {
        return win.API;
      }
      if (win.parent === win) {
        break;
      }
      win = win.parent;
      maxTries--;
    }
    return null;
  }

  /**
   * Searches the window hierarchy for the SCORM 2004 API (API_1484_11).
   * @param {Window} win - Window where the search starts.
   * @returns {Object|null} SCORM 2004 API reference, when available.
   */
  function findAPI2004(win) {
    var maxTries = 500;
    while (win && maxTries > 0) {
      if (win.API_1484_11) {
        return win.API_1484_11;
      }
      if (win.parent === win) {
        break;
      }
      win = win.parent;
      maxTries--;
    }
    return null;
  }

  /**
   * Searches window.opener when the SCO runs in a pop-up or separate window.
   * @returns {Object|null}
   */
  function findAPIInOpener() {
    try {
      if (window.opener && !window.opener.closed) {
        var api = findAPI(window.opener) || findAPI2004(window.opener);
        return api;
      }
    } catch (e) {
      console.warn("Erro ao acessar window.opener ao buscar SCORM API", e);
    }
    return null;
  }

  // Prefer SCORM 2004, then SCORM 1.2, and finally search the opener.
  var scormAPI = findAPI2004(window) || findAPI(window) || findAPIInOpener();

  if (!scormAPI) {
    console.error("❌ SCORM API não encontrada pelo discere-scorm-loader.");
  } else {
    // Expose the resolved APIs for the SCORM driver.
    if (scormAPI.Initialize && typeof scormAPI.Initialize === "function") {
      window.API_1484_11 = scormAPI;
      console.log(
        "✔️ SCORM 2004 API encontrada e exposta como window.API_1484_11"
      );
    } else {
      window.API = scormAPI;
      console.log("✔️ SCORM 1.2 API encontrada e exposta como window.API");
    }
  }
})(window);
