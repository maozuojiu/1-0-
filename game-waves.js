(() => {
  const key = 'music-home:all-games-waves:v1';
  const taskDayKey = 'music-home:task-day:v1';
  const previewDayOffsetKey = 'music-home:preview-day-offset:v1';
  function todayDate() {
    const date = new Date();
    const offset = Math.max(0, Math.floor(Number(localStorage.getItem(previewDayOffsetKey)) || 0));
    date.setDate(date.getDate() + offset);
    return date;
  }
  function today() {
    const now = todayDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  function ensureTaskDay() {
    try {
      const day = today();
      const saved = localStorage.getItem(taskDayKey);
      if (saved === day) return false;
      if (saved) {
        localStorage.removeItem('music-home:jump-task-completed:v1');
        localStorage.removeItem('music-home:rhythm-task-completed:v1');
        localStorage.removeItem('music-home:task-share-count:v1');
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const item = localStorage.key(i);
          if (item?.startsWith('music-home:task-bonus:')) localStorage.removeItem(item);
        }
      }
      localStorage.setItem(taskDayKey, day);
      return Boolean(saved);
    } catch { return false; }
  }
  function advanceTaskDay() {
    try {
      const offset = Math.max(0, Math.floor(Number(localStorage.getItem(previewDayOffsetKey)) || 0));
      localStorage.setItem(previewDayOffsetKey, String(offset + 1));
    } catch { return false; }
    return ensureTaskDay();
  }
  ensureTaskDay();

  function legacyBestTotal() {
    let total = 0;
    try {
      const jump = JSON.parse(localStorage.getItem('jump-game-personal-best-v1') || 'null');
      if (Number.isFinite(jump?.waves) && jump.waves > 0) total += jump.waves;
    } catch {}
    try {
      const rhythm = Number(localStorage.getItem('rhythm-personal-best-waves-v1')) || 0;
      if (Number.isFinite(rhythm) && rhythm > 0) total += rhythm;
    } catch {}
    return total;
  }

  function get() {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const total = Math.max(0, Math.floor(Number(saved) || 0), Math.floor(Number(localStorage.getItem('music-home:waves:v1')) || 0));
        if (total !== Number(saved)) localStorage.setItem(key, String(total));
        return total;
      }
      const initial = Math.max(legacyBestTotal(), Math.floor(Number(localStorage.getItem('music-home:waves:v1')) || 0));
      localStorage.setItem(key, String(initial));
      return initial;
    } catch {
      return legacyBestTotal();
    }
  }

  function add(amount) {
    const earned = Math.max(0, Math.floor(Number(amount) || 0));
    if (!earned) return get();
    const next = get() + earned;
    try {
      localStorage.setItem(key, String(next));
      localStorage.setItem('music-home:waves:v1', String(next));
    } catch {}
    window.dispatchEvent(new CustomEvent('music-home:all-games-waves-updated', {detail:{total:next}}));
    return next;
  }

  function awardTask(taskId) {
    ensureTaskDay();
    const rewardKey = `music-home:task-bonus:${taskId}:v1`;
    try {
      if (localStorage.getItem(rewardKey) === '1') return false;
      localStorage.setItem(rewardKey, '1');
    } catch { return false; }
    add(5);
    return true;
  }

  window.gameWaveLedger = {key, get, add, awardTask, ensureTaskDay, advanceTaskDay, today, taskDayKey, previewDayOffsetKey};
})();
