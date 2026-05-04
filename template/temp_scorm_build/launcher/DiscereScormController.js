(function () {
  const SCORM12 = "1.2";
  const courseVersion = window.courseData?.scormVersion || SCORM12;
  let isScorm12 = courseVersion === SCORM12;

  let api = null;
  let initialized = false;
  let available = false;

  function log(msg) {
    if (window.location.hostname === "localhost") {
      console.log(`[SCORM] ${msg}`);
    }
  }

  function findAPI() {
    function search(win) {
      if (!win) return null;
      if (win.API_1484_11) {
        log("API_1484_11 encontrada");
        return { api: win.API_1484_11, isScorm12: false };
      }
      if (win.API) {
        log("API encontrada");
        return { api: win.API, isScorm12: true };
      }

      if (win.parent && win.parent !== win) {
        const result = search(win.parent);
        if (result) return result;
      }

      if (win.opener && !win.opener.closed) {
        const result = search(win.opener);
        if (result) return result;
      }

      for (let i = 0; i < win.frames.length; i++) {
        const result = search(win.frames[i]);
        if (result) return result;
      }
      return null;
    }
    return search(window);
  }

  function initialize() {
    if (initialized) return true;
    const result = findAPI();
    if (!result) {
      log("❌ SCORM API não encontrada");
      return false;
    }

    api = result.api;
    isScorm12 = result.isScorm12;
    const initResult = isScorm12 ? api.LMSInitialize("") : api.Initialize("");

    initialized = initResult === "true" || initResult === true;
    available = initialized;

    if (initialized) {
      // Marca como “incomplete” no início do SCO
      const statusKey = isScorm12
        ? "cmi.core.lesson_status"
        : "cmi.completion_status";
      setValue(statusKey, "incomplete");
      commit();
      // Inicia heartbeat para commits periódicos
      startHeartbeat(20000);
    }

    return initialized;
  }

  function finishCourse() {
    const successMode = window.courseData?.successMode || "onComplete";

    if (isScorm12) {
      const statusKey = "cmi.core.lesson_status";

      if (successMode === "onComplete") {
        setValue(statusKey, "passed");
        //setScore(100, 100, 0); // Simula aprovação
      } else if (successMode === "onScore") {
        const raw = parseFloat(getValue("cmi.core.score.raw"));
        const max = parseFloat(getValue("cmi.core.score.max")) || 100;

        if (!isNaN(raw)) {
          const passed = raw >= 0.6 * max;
          setValue(statusKey, passed ? "passed" : "failed");
        } else {
          // Se não tem nota, só marca como completo
          setValue(statusKey, "completed");
        }
      } else {
        setValue(statusKey, "completed");
      }
    } else {
      setValue("cmi.completion_status", "completed");

      if (successMode === "onComplete") {
        setValue("cmi.success_status", "passed");
      } else if (successMode === "onScore") {
        const raw = parseFloat(getValue("cmi.score.raw"));
        const max = parseFloat(getValue("cmi.score.max")) || 100;

        if (!isNaN(raw)) {
          const passed = raw >= 0.6 * max;
          setValue("cmi.success_status", passed ? "passed" : "failed");
        }
      }
    }

    commit();
  }

  function terminateCourse() {
    const statusKey = isScorm12
      ? "cmi.core.lesson_status"
      : "cmi.completion_status";
    const currentStatus = getValue(statusKey);
    if (currentStatus !== "completed") {
      const exitKey = isScorm12 ? "cmi.core.exit" : "cmi.exit";
      setValue(exitKey, "suspend");
    }
    terminate();
  }

  function terminate() {
    if (!initialized || !available) return false;
    const res = isScorm12
      ? api.LMSFinish("") // SCORM 1.2
      : api.Terminate(""); // SCORM 2004

    if (res !== "true" && res !== true) {
      const code = isScorm12 ? api.LMSGetLastError() : api.GetLastError();
      const msg = isScorm12
        ? api.LMSGetErrorString(code)
        : api.GetErrorString(code);
      const diag = isScorm12 ? "" : api.GetDiagnostic(code);
      console.error(`[SCORM] Falha ao finalizar: ${msg} (${code}) ${diag}`);
    }

    initialized = false;
    available = false;
    return res === "true" || res === true;
  }

  function setValue(key, value) {
    if (!initialized || !available) return;
    const result = isScorm12
      ? api.LMSSetValue(key, value)
      : api.SetValue(key, value);

    if (result !== "true" && result !== true) {
      const code = isScorm12 ? api.LMSGetLastError() : api.GetLastError();
      const msg = isScorm12
        ? api.LMSGetErrorString(code)
        : api.GetErrorString(code);
      const diag = isScorm12 ? "" : api.GetDiagnostic(code);
      console.error(
        `[SCORM] Falha ao definir ${key}: ${msg} (${code}) ${diag}`
      );
    }

    return result === "true" || result === true;
  }

  function getValue(key) {
    if (!initialized || !available) return null;
    return isScorm12 ? api.LMSGetValue(key) : api.GetValue(key);
  }

  function commit() {
    if (!initialized || !available) return;
    const result = isScorm12 ? api.LMSCommit("") : api.Commit("");
    if (result !== "true" && result !== true) {
      const code = isScorm12 ? api.LMSGetLastError() : api.GetLastError();
      const msg = isScorm12
        ? api.LMSGetErrorString(code)
        : api.GetErrorString(code);
      const diag = isScorm12 ? "" : api.GetDiagnostic(code);
      console.error(`[SCORM] Falha ao fazer commit: ${msg} (${code}) ${diag}`);
    }
    return result === "true" || result === true;
  }

  function setBookmark(location) {
    const key = isScorm12 ? "cmi.core.lesson_location" : "cmi.location";
    setValue(key, location);
    commit();
  }

  function getBookmark() {
    const key = isScorm12 ? "cmi.core.lesson_location" : "cmi.location";
    return getValue(key);
  }

  function setProgress(value) {
    if (!isScorm12) {
      const clamped = Math.max(0, Math.min(1, value));
      setValue("cmi.progress_measure", clamped.toFixed(2));
      commit();
    }
  }

  function setScore(score, max = 100, min = 0) {
    if (isScorm12) {
      setValue("cmi.core.score.raw", score);
    } else {
      setValue("cmi.score.raw", score);
      setValue("cmi.score.max", max);
      setValue("cmi.score.min", min);
      setValue("cmi.score.scaled", (score / max).toFixed(2));
    }
    commit();
  }

  function recordInteraction(id, response, correct, type = "choice") {
    if (isScorm12) return;
    const count = parseInt(getValue("cmi.interactions._count")) || 0;
    setValue(`cmi.interactions.${count}.id`, id);
    setValue(`cmi.interactions.${count}.type`, type);
    setValue(`cmi.interactions.${count}.learner_response`, response);
    setValue(
      `cmi.interactions.${count}.result`,
      correct ? "correct" : "incorrect"
    );
    commit();
  }

  function setDataChunk(data) {
    console.log("[SCORM DEBUG] setDataChunk called with:", data);
    const result = setValue("cmi.suspend_data", data);
    console.log(
      "[SCORM DEBUG] LMSSetValue('cmi.suspend_data') returned:",
      result
    );
    const commitResult = commit();
    console.log(
      "[SCORM DEBUG] commit after setDataChunk returned:",
      commitResult
    );
  }

  function getDataChunk() {
    console.log("[SCORM DEBUG] getDataChunk: isScorm12 =", isScorm12);
    const val = getValue("cmi.suspend_data");
    console.log("[SCORM DEBUG] getDataChunk returned:", val);
    return val;
  }

  function getScormStatus() {
    const statusKey = isScorm12
      ? "cmi.core.lesson_status"
      : "cmi.completion_status";
    return getValue(statusKey);
  }

  function startHeartbeat(interval = 20000) {
    if (!initialized || !available) return;
    setInterval(() => {
      if (initialized && available) {
        log("💓 Commit automático");
        commit();
      }
    }, interval);
  }

  window.addEventListener("beforeunload", () => {
    if (initialized && available) {
      const statusKey = isScorm12
        ? "cmi.core.lesson_status"
        : "cmi.completion_status";
      const currentStatus = getValue(statusKey);

      if (currentStatus !== "completed") {
        const exitKey = isScorm12 ? "cmi.core.exit" : "cmi.exit";
        setValue(exitKey, "suspend");
        commit();
        terminate();
      } else {
        // Aguarda o commit de finalização antes de encerrar
        commit();
        setTimeout(() => terminate(), 300); // Tempo mínimo para o LMS processar
      }
    }
  });

  window.DiscereSCORM = {
    initialize,
    commit,
    setValue,
    getValue,
    terminate,
    setBookmark,
    getBookmark,
    setProgress,
    setScore,
    recordInteraction,
    setDataChunk,
    getDataChunk,
    startHeartbeat,
    finishCourse,
    terminateCourse,
    get isActive() {
      return initialized && available;
    },
    get isScorm12() {
      return isScorm12;
    },
  };

  window.DiscereSCORM.getScormStatus = getScormStatus;
})();
