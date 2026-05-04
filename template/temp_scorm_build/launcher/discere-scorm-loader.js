/**
 * discere-scorm-loader.js
 * Custom SCORM API loader - minimal implementation of SCORM API discovery
 * following the public SCORM RTE spec without infringing Rustici proprietary code.
 */

(function (window) {
  "use strict";

  /**
   * Busca a API SCORM 1.2 subindo na hierarquia de janelas.
   * @param {Window} win - janela inicial para busca
   * @returns {Object|null} - referência à API SCORM 1.2 ou null
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
   * Busca a API SCORM 2004 (API_1484_11) subindo na hierarquia de janelas.
   * @param {Window} win - janela inicial para busca
   * @returns {Object|null} - referência à API SCORM 2004 ou null
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
   * Em casos de pop-up ou janela separada, tenta buscar na window.opener.
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

  // Tenta SCORM 2004 primeiro, depois SCORM 1.2, e por fim em opener
  var scormAPI = findAPI2004(window) || findAPI(window) || findAPIInOpener();

  if (!scormAPI) {
    console.error("❌ SCORM API não encontrada pelo discere-scorm-loader.");
  } else {
    // Expondo no escopo global para o driver utilizar
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
