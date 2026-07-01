import courseData from "../content/courseData";
const SUSPEND_KEY = "progressMap";
const keyPrefix = `${courseData.courseId}_`;

/**
 * Restores progress from suspend_data and updates localStorage.
 */
export function restoreFromSuspend(onFinish) {
  const api = window.DiscereSCORM;
  if (!api || !api.isActive) {
    console.log("[SCORM DEBUG] API não ativa – pulando restauração.");
    if (typeof onFinish === "function") onFinish();
    return;
  }

  // In SCORM mode, suspend_data is the source of truth instead of stale local state.
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      localStorage.removeItem(key);
      console.log(`[SCORM DEBUG] Cleared localStorage key: ${key}`);
    }
  });

  try {
    const raw = api.getDataChunk();
    console.log("[SCORM DEBUG] raw suspend_data from LMS:", raw);

    if (!raw) {
      console.warn("[SCORM DEBUG] suspend_data vazio.");
      if (typeof onFinish === "function") onFinish();
      return;
    }

    let data;
    try {
      data = JSON.parse(raw);
      console.log("[SCORM DEBUG] parsed data object:", data);
    } catch (e) {
      console.error("[SCORM DEBUG] JSON parse falhou:", e);
      data = {};
    }

    const progressMap = data[SUSPEND_KEY] || {};
    Object.entries(progressMap).forEach(([lessonKey, percent]) => {
      console.log(`[SCORM DEBUG] restaurando ${lessonKey} = ${percent}%`);

      const progressKey = `${keyPrefix}progress_${lessonKey}`;
      localStorage.setItem(progressKey, percent.toString());
      console.log(
        `[SCORM DEBUG] localStorage.setItem('${progressKey}', '${percent}')`
      );

      // Rebuild the visible-block state from the persisted percentage.
      const totalBlocks = 100;
      const vistosSimulados = Array.from(
        { length: Math.floor((percent / 100) * totalBlocks) },
        (_, i) => i
      );
      const seenKey = `${keyPrefix}seen_${lessonKey}`;
      localStorage.setItem(seenKey, JSON.stringify(vistosSimulados));
      console.log(
        `[SCORM DEBUG] localStorage.setItem('${seenKey}', '${JSON.stringify(
          vistosSimulados
        )}')`
      );

      if (percent === 100) {
        const compKey = `${keyPrefix}completedLessons`;
        const completed = JSON.parse(localStorage.getItem(compKey) || "[]");
        if (!completed.includes(lessonKey)) {
          completed.push(lessonKey);
          localStorage.setItem(compKey, JSON.stringify(completed));
          console.log(
            `[SCORM DEBUG] localStorage.setItem('${compKey}', '${JSON.stringify(
              completed
            )}')`
          );
        }
      }
    });

    if (typeof onFinish === "function") onFinish();
  } catch (err) {
    console.error("[SCORM DEBUG] Erro ao restaurar suspend_data:", err);
    if (typeof onFinish === "function") onFinish();
  }
}

/**
 * Stores the highest recorded percentage per lesson in suspend_data.
 */
export function syncToSuspend(lessonKey, newPercent) {
  const api = window.DiscereSCORM;
  if (!api || !api.isActive) {
    console.log("[SCORM DEBUG] API não ativa – pulando syncToSuspend.");
    return;
  }

  try {
    const raw = api.getDataChunk();
    console.log("[SCORM DEBUG] prea-sync raw suspend_data:", raw);

    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn("[SCORM DEBUG] JSON parse falhou (pre-sync):", e);
      data = {};
    }

    const map = data[SUSPEND_KEY] || {};
    const saved = map[lessonKey] || 0;

    if (newPercent > saved || newPercent === 100) {
      map[lessonKey] = newPercent;
      const updated = { [SUSPEND_KEY]: map };
      const jsonStr = JSON.stringify(updated);
      console.log("[SCORM DEBUG] saving JSON suspend_data:", jsonStr);
      api.setDataChunk(jsonStr);
      console.log(
        "[SCORM DEBUG] raw suspend_data after setDataChunk:",
        api.getDataChunk()
      );
      console.log("[SCORM DEBUG] final progressMap:", map);
    } else {
      console.log(
        `[SCORM DEBUG] sem atualização (salvo=${saved}%, new=${newPercent}%)`
      );
    }
  } catch (err) {
    console.error("[SCORM DEBUG] Erro no syncToSuspend:", err);
  }
}
