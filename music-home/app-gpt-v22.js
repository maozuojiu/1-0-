const page = document.querySelector('#page');
const viewport = document.querySelector('#viewport');
function fit() {
  const width = Math.min(window.innerWidth, 750);
  viewport.style.width = `${width}px`;
  viewport.style.height = `${1236 * width / 375}px`;
  page.style.transform = `scale(${width / 375})`;
  const checkinFrame = document.querySelector('.checkin-frame');
  if (checkinFrame) {
    // Use the supplied 1521x3248 artwork at the rendered home width, preserving
    // its exact aspect ratio and making the scrollable content exactly image-height.
    const homeWidth = viewport.getBoundingClientRect().width;
    checkinFrame.style.setProperty('--home-width', `${homeWidth}px`);
    const imageHeight = homeWidth * 3248 / 1521;
    checkinFrame.style.setProperty('--home-height', `${imageHeight}px`);
    checkinFrame.style.setProperty('--checkin-close-top', `${imageHeight * .122}px`);
    checkinFrame.style.setProperty('--checkin-close-height', `${imageHeight * .03}px`);
    checkinFrame.style.setProperty('--checkin-button-height', `${homeWidth * .68 * 216 / 1032}px`);
  }
  const rankingFrame = document.querySelector('.ranking-frame');
  if (rankingFrame) {
    const homeWidth = viewport.getBoundingClientRect().width;
    const rankingOverlay = document.querySelector('.ranking-overlay');
    rankingOverlay.style.setProperty('--ranking-home-width', `${homeWidth}px`);
    rankingOverlay.style.setProperty('--ranking-sheet-height', `${homeWidth * 812 / 375}px`);
    rankingOverlay.style.setProperty('--ranking-art-height', `${homeWidth * 691 / 375}px`);
    const taskOverlay = document.querySelector('.task-overlay');
    taskOverlay.style.setProperty('--task-home-width', `${homeWidth}px`);
    taskOverlay.style.setProperty('--task-sheet-height', `${homeWidth * 812 / 375}px`);
    taskOverlay.style.setProperty('--task-art-height', `${homeWidth * 2441 / 1504}px`);
    const taskScale = homeWidth / 1504;
    taskOverlay.style.setProperty('--task-checkin-left', `${1072 * taskScale}px`);
    taskOverlay.style.setProperty('--task-checkin-top', `${homeWidth * 812 / 375 - 2441 * taskScale + 838 * taskScale}px`);
    taskOverlay.style.setProperty('--task-checkin-width', `${308 * taskScale}px`);
    taskOverlay.style.setProperty('--task-checkin-height', `${126 * taskScale}px`);
    taskOverlay.style.setProperty('--task-jump-top', `${homeWidth*812/375-2441*taskScale+1100*taskScale}px`);
    taskOverlay.style.setProperty('--task-jump-left', `${1064*taskScale}px`);
    taskOverlay.style.setProperty('--task-rhythm-top', `${homeWidth*812/375-2441*taskScale+1360*taskScale}px`);
    taskOverlay.style.setProperty('--task-game-height', `${132*taskScale}px`);
    taskOverlay.style.setProperty('--task-share-top', `${homeWidth * 812 / 375 - 2441 * taskScale + 2147 * taskScale}px`);
    taskOverlay.style.setProperty('--task-share-height', `${132 * taskScale}px`);
    taskOverlay.style.setProperty('--task-share-count-left', `${813 * taskScale}px`);
    taskOverlay.style.setProperty('--task-share-count-top', `${homeWidth * 812 / 375 - 2441 * taskScale + 2132 * taskScale}px`);
    taskOverlay.style.setProperty('--task-share-count-width', `${34 * taskScale}px`);
    taskOverlay.style.setProperty('--task-share-count-height', `${54 * taskScale}px`);
    taskOverlay.style.setProperty('--task-share-count-font', `${52 * taskScale}px`);
    const shareOverlay = document.querySelector('.share-overlay');
    shareOverlay.style.setProperty('--share-home-width', `${homeWidth}px`);
    shareOverlay.style.setProperty('--share-sheet-height', `${homeWidth * 812 / 375}px`);
    document.querySelectorAll('.welcome-overlay').forEach(overlay => {
      overlay.style.setProperty('--welcome-home-width', `${homeWidth}px`);
      overlay.style.setProperty('--welcome-sheet-height', `${homeWidth * 812 / 375}px`);
    });
  }
}
fit();
window.addEventListener('resize', fit);
const dialog = document.querySelector('#notice');
function notice(title, message) {
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('p').textContent = message;
  dialog.showModal();
}
function control(label, x, y, w, h, action, href) {
  const el = document.createElement(href ? 'a' : 'button');
  el.className = 'hit';
  el.setAttribute('aria-label', label);
  el.title = label;
  el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  if (href) el.href = href;
  else { el.type = 'button'; el.addEventListener('click', action); }
  page.appendChild(el);
  return el;
}
control('返回', 10, 54, 32, 34, () => notice('活动主页', '你已在音浪兑好礼活动主页。'));
control('分享活动', 326, 53, 40, 35, () => openSharePopup(false));
control('音浪榜', 5, 270, 46, 57, () => openRanking());
control('日签处', 5, 331, 46, 57, () => openCheckin());
control('跳跳台', 324, 270, 47, 57, null, '../jump.html');
control('节拍厅', 324, 331, 47, 57, null, '../rhythm.html');
control('解锁造型', 100, 576, 175, 70, () => notice('解锁造型', '集齐 100 音浪即可解锁新造型。当前为页面演示，未连接账户数据。'));
control('拿奖品', 0, 570, 75, 76, null, '../lottery.html');
control('做任务', 301, 570, 74, 76, () => openTaskPopup());
const unlockRewardButton = control('100音浪造型奖励', 267, 187, 62, 75, event => {
  if (currentRewardStage() === 'fifth') claimStage5HundredReward(event);
  else openUnlockPopup();
});
['回森夏日曝光加持','回森会员体验权益','回森夏日星光特权'].forEach((name,i) => control(`获取${name}`,275,985+i*86,74,34,null,'../lottery.html'));

// Local prototype identity: this browser profile. An account service is required
// to enforce one claim per authenticated user across browsers and devices.
const couponStoragePrefix = 'music-home:coupon-claimed:v1:';
const couponButtons = [...document.querySelectorAll('[data-coupon]')];
function hasClaimed(id) {
  try { return localStorage.getItem(couponStoragePrefix + id) === '1'; }
  catch { return false; }
}
function markClaimed(button) {
  button.disabled = true;
  button.textContent = '已领取';
  button.setAttribute('aria-label', button.closest('article').querySelector('h3').textContent + '，已领取');
}
couponButtons.forEach(button => {
  if (hasClaimed(button.dataset.coupon)) markClaimed(button);
  button.addEventListener('click', () => {
    if (button.disabled) return;
    try { localStorage.setItem(couponStoragePrefix + button.dataset.coupon, '1'); }
    catch {
      notice('无法保存领取记录', '浏览器存储不可用，请允许本站存储后重试。');
      return;
    }
    markClaimed(button);
    document.querySelector('#coupon-status').textContent = button.closest('article').querySelector('h3').textContent + '已领取';
  });
});
window.addEventListener('storage', event => {
  if (event.key === taskJumpKey || event.key === taskRhythmKey || event.key === null) renderTaskGameStatus();
  if (event.key?.startsWith(couponStoragePrefix) || event.key === null) {
    couponButtons.forEach(button => {
      if (hasClaimed(button.dataset.coupon)) markClaimed(button);
      else { button.disabled = false; button.textContent = '立即领取'; button.setAttribute('aria-label', '领取' + button.closest('article').querySelector('h3').textContent); }
    });
  }
});
const slider = document.querySelector('.coupon-slider');
let drag = null;
let suppressClick = false;
slider.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  suppressClick = false;
  drag = { id:event.pointerId, x:event.clientX, scroll:slider.scrollLeft, moved:false };
});
slider.addEventListener('pointermove', event => {
  if (!drag || drag.id !== event.pointerId) return;
  const dx = event.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) <= 5) return;
  drag.moved = true;
  slider.setPointerCapture(event.pointerId);
  slider.classList.add('dragging');
  const scale = page.getBoundingClientRect().width / 375;
  slider.scrollLeft = drag.scroll - dx / scale;
});
function finishDrag(event) {
  if (!drag || drag.id !== event.pointerId) return;
  suppressClick = drag.moved;
  if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
  slider.classList.remove('dragging');
  drag = null;
}
window.addEventListener('pointerup', finishDrag);
window.addEventListener('pointercancel', finishDrag);
slider.addEventListener('click', event => {
  if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
}, true);
slider.addEventListener('dragstart', event => event.preventDefault());
slider.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    slider.scrollBy({left:event.key === 'ArrowRight' ? 93 : -93,behavior:'smooth'});
  }
});

const waveStorageKey = 'music-home:waves:v1';
const unlockedKey = 'music-home:style-unlocked:v1';
const stage3UnlockedKey = 'music-home:style-stage3-unlocked:v1';
const stage4UnlockedKey = 'music-home:style-stage4-unlocked:v1';
const stage5UnlockedKey = 'music-home:style-stage5-unlocked:v1';
const stage5CompletedCyclesKey = 'music-home:stage5-completed-cycles:v1';
let styleUnlocked = localStorage.getItem(unlockedKey) === '1';
let stage3Unlocked = localStorage.getItem(stage3UnlockedKey) === '1';
let stage4Unlocked = localStorage.getItem(stage4UnlockedKey) === '1';
let stage5Unlocked = localStorage.getItem(stage5UnlockedKey) === '1';
let stage5CompletedCycles = Math.max(0, Math.floor(Number(localStorage.getItem(stage5CompletedCyclesKey)) || 0));
if (stage5Unlocked) stage4Unlocked = true;
if (stage4Unlocked) stage3Unlocked = true;
if (stage3Unlocked) styleUnlocked = true;
let activeVenue = stage5Unlocked ? 'fifth' : stage4Unlocked ? 'fourth' : stage3Unlocked ? 'third' : styleUnlocked ? 'new' : 'old';
function currentRewardStage() {
  return stage5Unlocked ? 'fifth' : stage4Unlocked ? 'fourth' : stage3Unlocked ? 'third' : styleUnlocked ? 'new' : 'old';
}
function currentProgress() {
  const stage = currentRewardStage();
  if (stage === 'fifth') return Math.max(0, waves - 400 - 100 * stage5CompletedCycles);
  if (stage === 'fourth') return Math.max(0, waves - 300);
  if (stage === 'third') return Math.max(0, waves - 200);
  if (stage === 'new') return Math.max(0, waves - 100);
  return Math.min(waves, 100);
}
function renderUnlockedHome() {
  const rewardStage = currentRewardStage();
  const showNew = styleUnlocked && activeVenue === 'new';
  const showThird = stage3Unlocked && activeVenue === 'third';
  const showFourth = stage4Unlocked && activeVenue === 'fourth';
  const showFifth = stage5Unlocked && activeVenue === 'fifth';
  document.querySelectorAll('.unlocked-home-stage2').forEach(art => { art.hidden = !showNew; });
  document.querySelectorAll('.unlocked-home-stage3').forEach(art => { art.hidden = !showThird; });
  document.querySelectorAll('.unlocked-home-stage4').forEach(art => { art.hidden = !showFourth; });
  document.querySelectorAll('.unlocked-home-stage5').forEach(art => { art.hidden = !showFifth; });
  page.classList.toggle('is-unlocked', showNew || showThird || showFourth || showFifth);
  page.classList.toggle('is-stage5', rewardStage === 'fifth');
  const canUnlockStage2 = rewardStage === 'old' && waves >= 100;
  const canUnlockStage3 = rewardStage === 'new' && waves >= 200;
  const canUnlockStage4 = rewardStage === 'third' && waves >= 300;
  const canUnlockStage5 = rewardStage === 'fourth' && waves >= 400;
  const canClaimStage5Hundred = rewardStage === 'fifth' && currentProgress() >= 100;
  unlockRewardButton.disabled = !(canUnlockStage2 || canUnlockStage3 || canUnlockStage4 || canUnlockStage5 || canClaimStage5Hundred);
  const hundredClaimable = !unlockRewardButton.disabled && localStorage.getItem(hundredRewardKey(rewardStage)) !== '1';
  document.querySelector('[data-node-id="2370:8528"]').classList.toggle('is-claimable', hundredClaimable && rewardStage !== 'fifth');
  document.querySelector('.stage5-100-reward').classList.toggle('is-claimable', hundredClaimable && rewardStage === 'fifth');
  const nextStyle = rewardStage === 'old' ? {threshold:100,name:'西式古典造型'} : rewardStage === 'new' ? {threshold:200,name:'第三造型'} : rewardStage === 'third' ? {threshold:300,name:'民谣歌曲造型'} : rewardStage === 'fourth' ? {threshold:400,name:'民族摇滚造型'} : null;
  unlockRewardButton.setAttribute('aria-label', rewardStage === 'fifth' ? canClaimStage5Hundred ? '领取100音浪抽奖券并开启下一轮' : '本轮需要100音浪才能领取抽奖券' : waves < nextStyle.threshold ? `需要${nextStyle.threshold}累计音浪才能解锁${nextStyle.name}` : `领取${nextStyle.name}`);
  document.querySelector('[data-node-id="2370:8539"]').textContent = rewardStage === 'fifth' ? '抽奖券' : '新造型';
}
const rewardLevels = [
  { level:25, chances:1, storageKey:'music-home:reward-25-claimed:v1', wrapperId:'2370:8525', buttonId:'claim-25-reward', closedLeft:'111px', openedLeft:'113px' },
  { level:50, chances:1, storageKey:'music-home:reward-50-claimed:v1', wrapperId:'2370:8526', buttonId:'claim-50-reward', closedLeft:'163px', openedLeft:'165px', labelId:'2370:8537' },
  { level:75, chances:2, storageKey:'music-home:reward-75-claimed:v1', wrapperId:'2370:8527', buttonId:'claim-75-reward', closedLeft:'215px', openedLeft:'217px', labelId:'2370:8538' }
].map(item => {
  const wrapper = document.querySelector(`[data-node-id="${item.wrapperId}"]`);
  return { ...item, baseStorageKey:item.storageKey, wrapper, inner:wrapper.querySelector('.layer-43'), art:wrapper.querySelector('.layer-44'), icon:wrapper.querySelector('img'), button:document.querySelector(`#${item.buttonId}`), label:item.labelId ? document.querySelector(`[data-node-id="${item.labelId}"]`) : null, claimed:localStorage.getItem(item.storageKey) === '1' };
});
const waveOutput = document.querySelector('#current-waves');
const progressFill = document.querySelector('[data-node-id="2370:8523"]');
let waves = window.gameWaveLedger?.get() || 0;
function renderWaves() {
  renderUnlockedHome();
  const progress = currentProgress();
  const rewardStage = currentRewardStage();
  waveOutput.value = String(waves);
  waveOutput.textContent = String(waves);
  progressFill.style.display = progress > 0 ? 'block' : 'none';
  progressFill.style.width = `${219 * Math.min(progress, 100) / 100}px`;
  rewardLevels.forEach(item => {
    item.storageKey = rewardStage === 'fifth' ? `${item.baseStorageKey}:stage5${stage5CompletedCycles ? `:cycle${stage5CompletedCycles}` : ''}` : rewardStage === 'fourth' ? `${item.baseStorageKey}:stage4` : rewardStage === 'third' ? `${item.baseStorageKey}:stage3` : rewardStage === 'new' ? `${item.baseStorageKey}:stage2` : item.baseStorageKey;
    item.claimed = localStorage.getItem(item.storageKey) === '1';
    item.icon.src = item.claimed ? assetUrl('assets/img6.png') : assetUrl('assets/img7.png');
    if (item.claimed) {
      Object.assign(item.wrapper.style, {left:item.openedLeft,top:'194px',width:'37px',height:'36px'});
      item.inner.style.transform = 'none';
      Object.assign(item.art.style, {width:'37px',height:'36px'});
    } else {
      Object.assign(item.wrapper.style, {left:item.closedLeft,top:'',width:'',height:''});
      item.inner.style.transform = '';
      Object.assign(item.art.style, {width:'',height:''});
    }
    item.button.disabled = progress < item.level || item.claimed;
    item.wrapper.classList.toggle('is-claimable', !item.button.disabled);
    item.button.setAttribute('aria-label', progress < item.level ? `需要${item.level}音浪才能领取` : item.claimed ? `${item.level}音浪奖励已领取` : `领取${item.level}音浪奖励`);
    if (item.label) item.label.textContent = item.claimed ? '已获得' : '抽奖券';
  });
}
const checkinDateKey = 'music-home:checkin-last-date:v1';
const checkinStreakKey = 'music-home:checkin-streak:v1';
const checkinPreviewStreakKey = 'music-home:checkin-preview-streak:v1';
const checkinPreviewDateKey = 'music-home:checkin-preview-date:v1';
const checkinOverlay = document.querySelector('#checkin-modal');
const checkinClaim = document.querySelector('#checkin-claim');
const checkinClaimArt = document.querySelector('#checkin-claim-art');
const checkinDayOverlays = document.querySelector('#checkin-day-overlays');
let checkinState;
function dateStamp(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function getCheckinState() {
  const today = window.gameWaveLedger?.today() || dateStamp(new Date());
  const lastDate = localStorage.getItem(checkinDateKey) || '';
  const storedStreak = Number(localStorage.getItem(checkinStreakKey)) || 0;
  const [year, month, day] = today.split('-').map(Number);
  const yesterday = new Date(year, month - 1, day);
  yesterday.setDate(yesterday.getDate()-1);
  const continues = lastDate === dateStamp(yesterday);
  const missedDay = Boolean(lastDate && lastDate !== today && !continues);
  if (missedDay || localStorage.getItem(checkinPreviewDateKey) !== today) {
    localStorage.removeItem(checkinPreviewStreakKey);
    localStorage.removeItem(checkinPreviewDateKey);
  }
  let state;
  if (lastDate === today) {
    const streakTotal = Math.max(1, storedStreak);
    state = {today, streakTotal, day:(streakTotal - 1) % 7 + 1, claimed:true};
  } else {
    const streakTotal = continues ? Math.max(1, storedStreak) + 1 : 1;
    state = {today, streakTotal, day:(streakTotal - 1) % 7 + 1, claimed:false};
  }
  const previewStreak = Number(localStorage.getItem(checkinPreviewStreakKey));
  if (previewStreak >= 1) {
    return {...state, streakTotal:previewStreak, day:(previewStreak - 1) % 7 + 1, claimed:state.claimed && state.streakTotal === previewStreak};
  }
  return state;
}
function checkinReward(state) { return state.day === 7 ? 30 : state.streakTotal % 3 === 0 ? 16 : 8; }
function renderCheckin() {
  checkinState = getCheckinState();
  const reward = checkinReward(checkinState);
  checkinDayOverlays.replaceChildren();
  const tilePositions = [
    {day:1,left:216,top:1376,width:244,height:288},
    {day:2,left:492,top:1376,width:244,height:288},
    {day:3,left:768,top:1376,width:244,height:288},
    {day:4,left:1044,top:1376,width:244,height:288},
    {day:5,left:216,top:1752,width:244,height:288},
    {day:6,left:492,top:1752,width:244,height:288},
    {day:7,left:772,top:1752,width:524,height:292}
  ];
  tilePositions.forEach(tile => {
    const img = document.createElement('img');
    img.alt = '';
    img.className = `checkin-day-art${tile.day === checkinState.day ? ' is-selected' : ''}${tile.day === 7 ? ' is-day7' : ''}`;
    img.src = tile.day === 7
      ? assetUrl(`assets/checkin-day7-${tile.day === checkinState.day ? 'selected' : 'normal'}.png`)
      : assetUrl(`assets/checkin-day-${tile.day === checkinState.day ? 'selected' : 'normal'}.png`);
    img.style.left = `${tile.left / 1521 * 100}%`;
    img.style.top = `${tile.top / 3248 * 100}%`;
    img.style.width = `${tile.width / 1521 * 100}%`;
    img.style.height = `${tile.height / 3248 * 100}%`;
    checkinDayOverlays.append(img);
  });
  checkinClaim.classList.toggle('is-claimed', checkinState.claimed);
  checkinClaim.classList.toggle('has-f8', reward === 8);
  if (reward === 8 && !checkinState.claimed) {
    checkinClaimArt.hidden = true;
  } else {
    checkinClaimArt.hidden = false;
    checkinClaimArt.src = reward === 8
      ? assetUrl('assets/checkin-claimed-user.png')
      : assetUrl(`assets/checkin-${checkinState.claimed ? 'claimed' : 'claim'}-${reward}.png`);
  }
  checkinClaim.setAttribute('aria-label', checkinState.claimed ? `已领取${reward}音浪` : `立即领取${reward}音浪`);
  checkinClaim.disabled = checkinState.claimed;
}
function openCheckin() {
  renderCheckin();
  checkinOverlay.hidden = false;
  window.scrollTo({top:0,behavior:'instant'});
  document.querySelector('.checkin-close').focus({preventScroll:true});
}
function closeCheckin() { checkinOverlay.hidden = true; }
const rankingOverlay = document.querySelector('#ranking-modal');
const rankingScrollport = document.querySelector('.ranking-scrollport');
const rankingScrollbar = document.querySelector('.ranking-scrollbar');
const rankingScrollThumb = document.querySelector('.ranking-scroll-thumb');
const rankingPlayerScore = document.querySelector('#ranking-player-score');
const rankingPlayerWaves = document.querySelector('#ranking-player-waves');
const rankingPlayerRank = document.querySelector('#ranking-player-rank');
const rankingOpponentRanks = [...document.querySelectorAll('.ranking-opponent-rank')];
const sharePlayerRank = document.querySelector('#share-player-rank');
const shareNextGap = document.querySelector('#share-next-gap');
// The artwork contains a fixed demo leaderboard. Include its three lower,
// obscured places so the original 1380-wave example remains 12th.
const rankingDemoScores = [3200, 3100, 2888, 2766, 2665, 2500, 2200, 2100, 1900, 1700, 1500];
const taskOverlay = document.querySelector('#task-modal');
const taskScrollport = document.querySelector('.task-scrollport');
const taskCloseButton = document.querySelector('.task-close');
const taskCheckinButton = document.querySelector('.task-checkin-action');
const taskCheckinDoneArt = document.querySelector('.task-checkin-done');
const taskJumpButton = document.querySelector('.task-jump-action');
const taskRhythmButton = document.querySelector('.task-rhythm-action');
const taskJumpKey = 'music-home:jump-task-completed:v1';
const taskRhythmKey = 'music-home:rhythm-task-completed:v1';
const taskShareButton = document.querySelector('.task-share-action');
const taskShareDoneArt = document.querySelector('.task-share-done');
const taskShareProgress = document.querySelector('.task-share-progress');
const shareOverlay = document.querySelector('#share-modal');
const shareCloseButton = document.querySelector('.share-close');
const shareSaveButton = document.querySelector('.share-save');
const shareCountStorageKey = 'music-home:task-share-count:v1';
let shareCount = Math.min(5, Math.max(0, Math.floor(Number(localStorage.getItem(shareCountStorageKey)) || 0)));
let taskCloseTimer;
function refreshDailyTasks() {
  window.gameWaveLedger?.ensureTaskDay();
  shareCount = Math.min(5, Math.max(0, Math.floor(Number(localStorage.getItem(shareCountStorageKey)) || 0)));
  renderTaskCheckinButton();
  renderTaskGameStatus();
  renderTaskShareStatus();
}
function renderTaskCheckinButton() {
  const state = getCheckinState();
  const claimed = state.claimed;
  if (claimed) window.gameWaveLedger?.awardTask(`checkin-${state.today}`);
  taskCheckinDoneArt.hidden = !claimed;
  taskCheckinButton.disabled = claimed;
  taskCheckinButton.setAttribute('aria-label', claimed ? '已签到' : '去签到');
}
function renderTaskShareStatus() {
  const oldFifthShareReward = localStorage.getItem('music-home:task-bonus:share-five:v1') === '1';
  for (let share = 1; share <= shareCount; share++) {
    if (share === 5 && oldFifthShareReward) continue;
    window.gameWaveLedger?.awardTask(`share-${share}`);
  }
  taskShareProgress.textContent = String(shareCount);
  taskShareProgress.hidden = shareCount === 0;
  taskShareDoneArt.hidden = shareCount < 5;
  taskShareButton.disabled = shareCount >= 5;
  taskShareButton.setAttribute('aria-label', shareCount >= 5 ? '分享任务已完成' : `分享活动给好友，已分享${shareCount}次，共5次`);
}
function renderTaskGameStatus() {
  for (const [button, key, name] of [[taskJumpButton, taskJumpKey, '跳跳台'], [taskRhythmButton, taskRhythmKey, '节拍厅']]) {
    const completed = localStorage.getItem(key) === '1';
    if (completed) window.gameWaveLedger?.awardTask(key === taskJumpKey ? 'jump' : 'rhythm');
    button.disabled = completed;
    button.querySelector('img').hidden = !completed;
    button.setAttribute('aria-label', completed ? `${name}任务已完成` : `去${name}赚音浪`);
  }
}
taskJumpButton.addEventListener('click', () => { location.href = '../jump.html?from=music-home-task'; });
taskRhythmButton.addEventListener('click', () => { location.href = '../rhythm.html?from=music-home-task'; });
window.addEventListener('pageshow', () => {
  refreshDailyTasks();
  waves = window.gameWaveLedger?.get() || 0;
  renderWaves();
  renderRankingScore();
});
function renderRankingScore() {
  const total = window.gameWaveLedger?.get() || 0;
  const rank = 1 + rankingDemoScores.filter(score => score > total).length;
  const nextScore = [...rankingDemoScores].reverse().find(score => score > total);
  rankingPlayerWaves.value = String(total);
  rankingPlayerWaves.textContent = String(total);
  rankingPlayerScore.setAttribute('aria-label', `玩家累计音浪：${total}，第${rank}名`);
  rankingPlayerRank.value = String(rank);
  rankingPlayerRank.textContent = String(rank);
  rankingPlayerRank.setAttribute('aria-label', `我的排名：第${rank}名`);
  rankingOpponentRanks.forEach(output => {
    const originalRank = Number(output.dataset.originalRank);
    const newRank = originalRank + (total > Number(output.dataset.score) ? 1 : 0);
    output.hidden = newRank === originalRank;
    output.textContent = String(newRank);
  });
  sharePlayerRank.value = String(rank);
  sharePlayerRank.textContent = String(rank);
  document.querySelector('.share-rank-line').setAttribute('aria-label', `我的排名：第${rank}名`);
  shareNextGap.textContent = nextScore ? `距离上一名还差${nextScore - total}音浪` : '已是第1名';
  document.querySelector('.share-art').setAttribute('aria-label', `我的成绩 TOP ${rank} 分享页`);
  const scale = viewport.getBoundingClientRect().width / 375;
  rankingPlayerWaves.style.fontSize = `${20 * scale * Math.min(1, 4 / String(total).length)}px`;
}
renderRankingScore();
window.addEventListener('music-home:all-games-waves-updated', () => {
  waves = window.gameWaveLedger?.get() || 0;
  renderWaves();
  renderRankingScore();
});
let rankingCloseTimer;
function openTaskPopup() {
  window.clearTimeout(taskCloseTimer);
  closeCheckin();
  closeRanking();
  refreshDailyTasks();
  taskOverlay.hidden = false;
  taskScrollport.scrollTop = 0;
  taskScrollport.classList.remove('is-open');
  document.documentElement.classList.add('task-open');
  document.body.classList.add('task-open');
  void taskScrollport.offsetHeight;
  requestAnimationFrame(() => taskScrollport.classList.add('is-open'));
  taskCloseButton.focus({preventScroll:true});
}
function closeTaskPopup() {
  taskScrollport.classList.remove('is-open');
  window.clearTimeout(taskCloseTimer);
  taskCloseTimer = window.setTimeout(() => {
    taskOverlay.hidden = true;
    document.documentElement.classList.remove('task-open');
    document.body.classList.remove('task-open');
    document.querySelector('.hit[aria-label="做任务"]')?.focus({preventScroll:true});
  }, 360);
}
taskCheckinButton.addEventListener('click', () => {
  if (taskCheckinButton.disabled) return;
  window.clearTimeout(taskCloseTimer);
  taskScrollport.classList.remove('is-open');
  taskOverlay.hidden = true;
  document.documentElement.classList.remove('task-open');
  document.body.classList.remove('task-open');
  openCheckin();
});
let shareReturnToTask = false;
function openSharePopup(fromTask = false) {
  renderRankingScore();
  shareReturnToTask = fromTask;
  window.clearTimeout(taskCloseTimer);
  taskScrollport.classList.remove('is-open');
  taskOverlay.hidden = true;
  document.documentElement.classList.remove('task-open');
  document.body.classList.remove('task-open');
  shareOverlay.hidden = false;
  document.documentElement.classList.add('share-open');
  document.body.classList.add('share-open');
  shareCloseButton.focus({preventScroll:true});
}
function closeSharePopup() {
  shareOverlay.hidden = true;
  document.documentElement.classList.remove('share-open');
  document.body.classList.remove('share-open');
  if (shareReturnToTask) openTaskPopup();
  else document.querySelector('.hit[aria-label="分享活动"]')?.focus({preventScroll:true});
}
taskShareButton.addEventListener('click', () => openSharePopup(true));
async function createCurrentShareImage() {
  const art = document.querySelector('#share-source-art');
  await art.decode();
  const canvas = document.createElement('canvas');
  canvas.width = art.naturalWidth;
  canvas.height = art.naturalHeight;
  const context = canvas.getContext('2d');
  context.drawImage(art, 0, 0);
  context.fillStyle = '#fff';
  context.fillRect(canvas.width * .208, canvas.height * .225, canvas.width * .466, canvas.height * .094);
  const detailsGradient = context.createLinearGradient(0, canvas.height * .616, 0, canvas.height * .825);
  detailsGradient.addColorStop(0, '#ffe0ee');
  detailsGradient.addColorStop(.6524, '#fff9fd');
  detailsGradient.addColorStop(1, '#fff9fd');
  context.fillStyle = detailsGradient;
  context.fillRect(canvas.width * .315, canvas.height * .658, canvas.width * .355, canvas.height * .046);
  const rankGradient = context.createLinearGradient(0, canvas.height * .2325, 0, canvas.height * .3115);
  rankGradient.addColorStop(0, '#3e092e');
  rankGradient.addColorStop(1, '#650642');
  context.fillStyle = rankGradient;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `bold ${Math.round(canvas.width * .128)}px sans-serif`;
  context.fillText(`TOP ${sharePlayerRank.textContent}`, canvas.width * .445, canvas.height * .272);
  context.fillStyle = '#926e74';
  context.textAlign = 'left';
  context.font = `${Math.round(canvas.width * .026667)}px sans-serif`;
  context.fillText(shareNextGap.textContent, canvas.width * .323, canvas.height * .677);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('分享图片生成失败')), 'image/png'));
}
let shareSaving = false;
shareSaveButton.addEventListener('click', async () => {
  if (shareSaving) return;
  if (shareCount >= 5) return;
  shareSaving = true;
  shareSaveButton.disabled = true;
  shareCount += 1;
  try { localStorage.setItem(shareCountStorageKey, String(shareCount)); } catch {}
  renderTaskShareStatus();
  let shareImage;
  try { shareImage = await createCurrentShareImage(); } catch {}
  try {
    if (navigator.share && navigator.canShare) {
      const file = new File([shareImage || await (await fetch(assetUrl('assets/share-rank-12.png'))).blob()], '我的音浪成绩.png', {type:'image/png'});
      if (navigator.canShare({files:[file]})) {
        await navigator.share({files:[file], title:'我的音浪成绩'});
        return;
      }
    }
  } catch (error) {
    if (error?.name === 'AbortError') return;
  } finally {
    shareSaving = false;
    shareSaveButton.disabled = false;
  }
  const download = document.createElement('a');
  download.href = shareImage ? URL.createObjectURL(shareImage) : assetUrl('assets/share-rank-12.png');
  download.download = '我的音浪成绩.png';
  document.body.append(download);
  download.click();
  download.remove();
  if (shareImage) window.setTimeout(() => URL.revokeObjectURL(download.href), 60000);
});
shareCloseButton.addEventListener('click', closeSharePopup);
shareOverlay.addEventListener('click', event => {
  if (event.target === shareOverlay || event.target === shareOverlay.querySelector('.share-frame')) closeSharePopup();
});
taskCloseButton.addEventListener('click', closeTaskPopup);
taskOverlay.addEventListener('click', event => {
  if (event.target === taskOverlay) closeTaskPopup();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !taskOverlay.hidden) closeTaskPopup();
  if (event.key === 'Escape' && !shareOverlay.hidden) closeSharePopup();
});
function updateRankingScrollbar() {
  const viewHeight = rankingScrollport.clientHeight;
  const contentHeight = rankingScrollport.scrollHeight;
  const trackHeight = rankingScrollbar.clientHeight;
  if (!viewHeight || contentHeight <= viewHeight || !trackHeight) {
    rankingScrollbar.hidden = true;
    return;
  }
  rankingScrollbar.hidden = false;
  const thumbHeight = Math.max(40, trackHeight * viewHeight / contentHeight);
  const travel = trackHeight - thumbHeight;
  const progress = rankingScrollport.scrollTop / (contentHeight - viewHeight);
  rankingScrollThumb.style.height = `${thumbHeight}px`;
  rankingScrollThumb.style.transform = `translateY(${travel * progress}px)`;
}
function openRanking() {
  window.clearTimeout(rankingCloseTimer);
  closeCheckin();
  renderRankingScore();
  document.documentElement.classList.add('ranking-open');
  document.body.classList.add('ranking-open');
  rankingOverlay.hidden = false;
  rankingScrollport.scrollTop = 0;
  rankingScrollport.classList.remove('is-open');
  void rankingScrollport.offsetHeight;
  requestAnimationFrame(() => {
    rankingScrollport.classList.add('is-open');
    updateRankingScrollbar();
  });
  document.querySelector('.ranking-close').focus({preventScroll:true});
}
function closeRanking() {
  rankingScrollport.classList.remove('is-open');
  window.clearTimeout(rankingCloseTimer);
  rankingCloseTimer = window.setTimeout(() => {
    rankingOverlay.hidden = true;
    document.documentElement.classList.remove('ranking-open');
    document.body.classList.remove('ranking-open');
  }, 360);
}
document.querySelector('.ranking-close').addEventListener('click', closeRanking);
rankingScrollport.addEventListener('scroll', () => {
  updateRankingScrollbar();
}, {passive:true});
window.addEventListener('resize', updateRankingScrollbar);
let rankingDrag = null;
rankingScrollbar.addEventListener('pointerdown', event => {
  event.preventDefault();
  const trackRect = rankingScrollbar.getBoundingClientRect();
  const thumbRect = rankingScrollThumb.getBoundingClientRect();
  if (event.target === rankingScrollThumb) {
    rankingDrag = {pointerY:event.clientY, scrollTop:rankingScrollport.scrollTop, trackHeight:trackRect.height, thumbHeight:thumbRect.height};
  } else {
    const thumbTravel = trackRect.height - thumbRect.height;
    const ratio = (event.clientY - trackRect.top - thumbRect.height / 2) / Math.max(1, thumbTravel);
    rankingScrollport.scrollTop = Math.max(0, Math.min(1, ratio)) * (rankingScrollport.scrollHeight - rankingScrollport.clientHeight);
    rankingDrag = {pointerY:event.clientY, scrollTop:rankingScrollport.scrollTop, trackHeight:trackRect.height, thumbHeight:thumbRect.height};
  }
  rankingScrollbar.setPointerCapture(event.pointerId);
});
rankingScrollbar.addEventListener('pointermove', event => {
  if (!rankingDrag) return;
  const travel = rankingDrag.trackHeight - rankingDrag.thumbHeight;
  const scrollRange = rankingScrollport.scrollHeight - rankingScrollport.clientHeight;
  rankingScrollport.scrollTop = rankingDrag.scrollTop + (event.clientY - rankingDrag.pointerY) * scrollRange / Math.max(1, travel);
});
const stopRankingDrag = () => { rankingDrag = null; };
rankingScrollbar.addEventListener('pointerup', stopRankingDrag);
rankingScrollbar.addEventListener('pointercancel', stopRankingDrag);
rankingOverlay.addEventListener('click', event => {
  if (event.target === rankingOverlay) closeRanking();
});
document.querySelector('.checkin-close').addEventListener('click', closeCheckin);
checkinOverlay.addEventListener('click', event => {
  if (event.target === checkinOverlay) { closeCheckin(); return; }
  // The close glyph is part of the supplied artwork. Treat its image-relative
  // bounds as a click target too, so it works even if the transparent hitbox shifts.
  const frameRect = document.querySelector('.checkin-frame').getBoundingClientRect();
  const x = (event.clientX - frameRect.left) / frameRect.width;
  const y = (event.clientY - frameRect.top) / frameRect.height;
  if (x >= .84 && x <= .95 && y >= .11 && y <= .17) closeCheckin();
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!checkinOverlay.hidden) closeCheckin();
    if (!rankingOverlay.hidden) closeRanking();
  }
});
function scheduleMidnightCheckinRefresh() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  setTimeout(() => {
    try {
      localStorage.removeItem(checkinPreviewStreakKey);
      localStorage.removeItem(checkinPreviewDateKey);
    } catch {}
    refreshDailyTasks();
    if (!checkinOverlay.hidden) renderCheckin();
    scheduleMidnightCheckinRefresh();
  }, midnight.getTime() - now.getTime());
}
scheduleMidnightCheckinRefresh();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    refreshDailyTasks();
    if (!checkinOverlay.hidden) renderCheckin();
  }
});
checkinClaim.addEventListener('click', () => {
  if (!checkinState || checkinState.claimed) return;
  const reward = checkinReward(checkinState);
  window.gameWaveLedger?.add(reward);
  try {
    localStorage.setItem(checkinDateKey, checkinState.today);
    localStorage.setItem(checkinStreakKey, String(checkinState.streakTotal));
    localStorage.removeItem(checkinPreviewStreakKey);
    localStorage.removeItem(checkinPreviewDateKey);
  } catch {}
  renderWaves();
  renderCheckin();
  renderTaskCheckinButton();
});
renderWaves();
document.querySelector('#add-waves').addEventListener('click', () => {
  window.gameWaveLedger?.add(10);
});
document.querySelector('#add-checkin-day').addEventListener('click', () => {
  window.gameWaveLedger?.advanceTaskDay();
  const lotteryDayKey = 'music-home:lottery-day-offset:v1';
  const lotteryDay = Math.max(0, Math.floor(Number(localStorage.getItem(lotteryDayKey)) || 0)) + 1;
  try { localStorage.setItem(lotteryDayKey, String(lotteryDay)); } catch {}
  refreshDailyTasks();
  if (checkinOverlay.hidden) openCheckin();
  else renderCheckin();
});
function claimReward(item, event) {
  const progress = currentProgress();
  if (progress < item.level || item.claimed) return;
  if (progress >= 100 && currentRewardStage() !== 'fifth') openUnlockPopup();
  else claimAvailableRewards(progress, event);
}
function claimStage5HundredReward(event) {
  const progress = currentProgress();
  if (currentRewardStage() !== 'fifth' || progress < 100) return;
  claimAvailableRewards(progress, event);
}
function markClaimableRewards(progress) {
  const claimable = rewardLevels.filter(reward => progress >= reward.level && !reward.claimed);
  if (!claimable.length) return;
  for (const reward of claimable) {
    reward.claimed = true;
    try { localStorage.setItem(reward.storageKey, '1'); } catch {}
  }
  addLotteryChances(claimable.reduce((total, reward) => total + reward.chances, 0));
}
const lotteryChancesKey = 'music-home:lottery-chances:v1';
function addLotteryChances(amount) {
  const saved = Number(localStorage.getItem(lotteryChancesKey));
  const current = Number.isInteger(saved) && saved >= 0 ? saved : 0;
  try { localStorage.setItem(lotteryChancesKey, String(current + amount)); } catch {}
}
function claimHundredLotteryChance() {
  const stage = currentRewardStage();
  const key = hundredRewardKey(stage);
  if (localStorage.getItem(key) === '1') return;
  try { localStorage.setItem(key, '1'); } catch {}
  addLotteryChances(1);
}
function hundredRewardKey(stage) {
  return `music-home:reward-100-claimed:v1:${stage}${stage === 'fifth' ? `:cycle${stage5CompletedCycles}` : ''}`;
}
function claimAvailableRewards(progress, event) {
  markClaimableRewards(progress);
  if (progress >= 100) claimHundredLotteryChance();
  if (currentRewardStage() === 'fifth' && progress >= 100) {
    stage5CompletedCycles += 1;
    try { localStorage.setItem(stage5CompletedCyclesKey, String(stage5CompletedCycles)); } catch {}
  }
  renderWaves();
  const prizeButton = document.querySelector('.hit[aria-label="拿奖品"]');
  const prize = prizeButton.getBoundingClientRect();
  const fromX = event.clientX + window.scrollX;
  const fromY = event.clientY + window.scrollY;
  const toX = prize.left + window.scrollX + prize.width / 2;
  const toY = prize.top + window.scrollY + prize.height / 2;
  const cursor = document.createElement('div');
  cursor.id = 'reward-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="reward-glow-core"></span>';
  cursor.style.left = `${fromX}px`;
  cursor.style.top = `${fromY}px`;
  document.body.appendChild(cursor);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = cursor.animate([
    { left:`${fromX}px`, top:`${fromY}px`, transform:'translate(-50%,-50%) scale(.82)', opacity:1 },
    { left:`${toX}px`, top:`${toY}px`, transform:'translate(-50%,-50%) scale(1.18)', opacity:0 }
  ], { duration:reducedMotion ? 180 : 1800, easing:'ease-in-out', fill:'forwards' });
  window.scrollTo({top:Math.max(0,toY-window.innerHeight*.65),behavior:reducedMotion?'auto':'smooth'});
  motion.finished.then(() => {
    cursor.remove();
  }).catch(() => cursor.remove());
}
rewardLevels.forEach(item => item.button.addEventListener('click', event => claimReward(item, event)));
let venueSwipeStart = null;
function finishVenueSwipe(dx, dy) {
  if (!styleUnlocked || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
  const venues = stage5Unlocked ? ['old', 'new', 'third', 'fourth', 'fifth'] : stage4Unlocked ? ['old', 'new', 'third', 'fourth'] : stage3Unlocked ? ['old', 'new', 'third'] : ['old', 'new'];
  const currentIndex = venues.indexOf(activeVenue);
  const nextVenue = venues[Math.max(0, Math.min(venues.length - 1, currentIndex + (dx < 0 ? 1 : -1)))];
  if (nextVenue !== activeVenue) {
    activeVenue = nextVenue;
    renderWaves();
  }
}
page.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch') return;
  if (!styleUnlocked || event.target.closest('button,a,.coupon-slider')) return;
  venueSwipeStart = {x:event.clientX, y:event.clientY};
});
page.addEventListener('pointerup', event => {
  if (event.pointerType === 'touch') return;
  if (!venueSwipeStart || !styleUnlocked) return;
  const dx = event.clientX - venueSwipeStart.x;
  const dy = event.clientY - venueSwipeStart.y;
  venueSwipeStart = null;
  finishVenueSwipe(dx, dy);
});
page.addEventListener('pointercancel', () => { venueSwipeStart = null; });
let venueTouchStart = null;
page.addEventListener('touchstart', event => {
  if (!styleUnlocked || event.target.closest('button,a,.coupon-slider')) return;
  venueTouchStart = {x:event.touches[0].clientX, y:event.touches[0].clientY};
}, {passive:true});
page.addEventListener('touchend', event => {
  if (!venueTouchStart || !event.changedTouches.length) return;
  const touch = event.changedTouches[0];
  finishVenueSwipe(touch.clientX - venueTouchStart.x, touch.clientY - venueTouchStart.y);
  venueTouchStart = null;
}, {passive:true});
page.addEventListener('touchcancel', () => { venueTouchStart = null; }, {passive:true});
document.querySelector('#reset-all').addEventListener('click', () => {
  try {
    const resetKeys = new Set([
      waveStorageKey,
      ...rewardLevels.flatMap(item => [item.baseStorageKey, `${item.baseStorageKey}:stage2`, `${item.baseStorageKey}:stage3`, `${item.baseStorageKey}:stage4`, `${item.baseStorageKey}:stage5`]),
      checkinDateKey,
      checkinStreakKey,
      checkinPreviewStreakKey,
      checkinPreviewDateKey,
      shareCountStorageKey,
      window.gameWaveLedger?.taskDayKey,
      window.gameWaveLedger?.previewDayOffsetKey,
      'music-home:welcome-seen:v1',
      unlockedKey,
      stage3UnlockedKey,
      stage4UnlockedKey,
      stage5UnlockedKey,
      stage5CompletedCyclesKey,
      taskJumpKey,
      taskRhythmKey,
      'music-home:checkin-preview-day:v1',
      'music-home:all-games-waves:v1',
      'jump-game-personal-best-v1',
      'rhythm-personal-best-waves-v1',
      'rhythm-four-step-tutorial-v2',
      'music-home:lottery-progress:v1',
      'music-home:lottery-claimed:v1',
      'music-home:lottery-day-offset:v1',
      'music-home:lottery-chances:v1',
      'music-home:rhythm-revive-cards:v1',
      'music-home:rhythm-slow-cards:v1'
    ]);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(couponStoragePrefix) || key?.startsWith('music-home:task-bonus:') || key?.startsWith('music-home:reward-') || key?.startsWith('music-home:lottery-daily:') || resetKeys.has(key)) localStorage.removeItem(key);
    }
  } catch {}
  location.hash = '';
  location.reload();
});
window.addEventListener('storage', event => {
  if (event.key === window.gameWaveLedger?.taskDayKey) refreshDailyTasks();
  if (event.key === shareCountStorageKey || event.key === null) {
    shareCount = Math.min(5, Math.max(0, Math.floor(Number(localStorage.getItem(shareCountStorageKey)) || 0)));
    renderTaskShareStatus();
  }
  if (event.key === window.gameWaveLedger?.key || event.key === null) renderRankingScore();
  if (event.key === waveStorageKey || event.key === window.gameWaveLedger?.key || event.key?.startsWith('music-home:reward-') || event.key === stage5CompletedCyclesKey || event.key === null) {
    waves = window.gameWaveLedger?.get() || 0;
    stage5CompletedCycles = Math.max(0, Math.floor(Number(localStorage.getItem(stage5CompletedCyclesKey)) || 0));
    renderWaves();
  }
  if (event.key === unlockedKey || event.key === stage3UnlockedKey || event.key === stage4UnlockedKey || event.key === stage5UnlockedKey || event.key === null) {
    styleUnlocked = localStorage.getItem(unlockedKey) === '1';
    stage3Unlocked = localStorage.getItem(stage3UnlockedKey) === '1';
    stage4Unlocked = localStorage.getItem(stage4UnlockedKey) === '1';
    stage5Unlocked = localStorage.getItem(stage5UnlockedKey) === '1';
    if (stage5Unlocked) stage4Unlocked = true;
    if (stage4Unlocked) stage3Unlocked = true;
    if (stage3Unlocked) styleUnlocked = true;
    if (!styleUnlocked) activeVenue = 'old';
    else if (!stage3Unlocked && ['third', 'fourth', 'fifth'].includes(activeVenue)) activeVenue = 'new';
    else if (!stage4Unlocked && ['fourth', 'fifth'].includes(activeVenue)) activeVenue = 'third';
    else if (!stage5Unlocked && activeVenue === 'fifth') activeVenue = 'fourth';
    renderWaves();
  }
});
document.body.dataset.musicHomeVersion = 'figma-checkin-v22';
const welcomeOverlay = document.querySelector('#welcome-modal');
const welcomeSeenKey = 'music-home:welcome-seen:v1';
function closeWelcome() {
  welcomeOverlay.hidden = true;
  document.documentElement.classList.remove('welcome-open');
  document.body.classList.remove('welcome-open');
}
document.querySelector('.welcome-accept').addEventListener('click', closeWelcome);
document.querySelector('.welcome-close').addEventListener('click', closeWelcome);
document.querySelector('.welcome-show-off').addEventListener('click', () => {
  closeWelcome();
  openSharePopup(false);
});
welcomeOverlay.addEventListener('click', event => { if (event.target === welcomeOverlay) closeWelcome(); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !welcomeOverlay.hidden) closeWelcome(); });
if (localStorage.getItem(welcomeSeenKey) !== '1') {
  try { localStorage.setItem(welcomeSeenKey, '1'); } catch {}
  welcomeOverlay.hidden = false;
  document.documentElement.classList.add('welcome-open');
  document.body.classList.add('welcome-open');
  welcomeOverlay.focus({preventScroll:true});
}
const unlockOverlay = document.querySelector('#unlock-modal');
const stage3UnlockOverlay = document.querySelector('#unlock-stage3-modal');
const stage4UnlockOverlay = document.querySelector('#unlock-stage4-modal');
const stage5UnlockOverlay = document.querySelector('#unlock-stage5-modal');
function openUnlockPopup() {
  const stage = currentRewardStage();
  const overlay = stage === 'old' && waves >= 100 ? unlockOverlay : stage === 'new' && waves >= 200 ? stage3UnlockOverlay : stage === 'third' && waves >= 300 ? stage4UnlockOverlay : stage === 'fourth' && waves >= 400 ? stage5UnlockOverlay : null;
  if (!overlay) return;
  markClaimableRewards(currentProgress());
  claimHundredLotteryChance();
  renderWaves();
  overlay.hidden = false;
  document.documentElement.classList.add('welcome-open');
  document.body.classList.add('welcome-open');
  overlay.focus({preventScroll:true});
}
function closeUnlockPopup(overlay = unlockOverlay) {
  overlay.hidden = true;
  document.documentElement.classList.remove('welcome-open');
  document.body.classList.remove('welcome-open');
}
function acceptUnlockedStyle(share = false) {
  styleUnlocked = true;
  activeVenue = 'new';
  try { localStorage.setItem(unlockedKey, '1'); } catch {}
  renderWaves();
  closeUnlockPopup();
  if (share) openSharePopup(false);
}
function acceptStage3Style(share = false) {
  stage3Unlocked = true;
  activeVenue = 'third';
  try { localStorage.setItem(stage3UnlockedKey, '1'); } catch {}
  renderWaves();
  closeUnlockPopup(stage3UnlockOverlay);
  if (share) openSharePopup(false);
}
function acceptStage4Style(share = false) {
  stage4Unlocked = true;
  activeVenue = 'fourth';
  try { localStorage.setItem(stage4UnlockedKey, '1'); } catch {}
  renderWaves();
  closeUnlockPopup(stage4UnlockOverlay);
  if (share) openSharePopup(false);
}
function acceptStage5Style(share = false) {
  stage5Unlocked = true;
  activeVenue = 'fifth';
  try { localStorage.setItem(stage5UnlockedKey, '1'); } catch {}
  renderWaves();
  closeUnlockPopup(stage5UnlockOverlay);
  if (share) openSharePopup(false);
}
document.querySelector('.unlock-accept').addEventListener('click', () => acceptUnlockedStyle());
document.querySelector('.unlock-show-off').addEventListener('click', () => acceptUnlockedStyle(true));
document.querySelector('.unlock-close').addEventListener('click', closeUnlockPopup);
unlockOverlay.addEventListener('click', event => { if (event.target === unlockOverlay) closeUnlockPopup(); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !unlockOverlay.hidden) closeUnlockPopup(); });
document.querySelector('.unlock-stage3-accept').addEventListener('click', () => acceptStage3Style());
document.querySelector('.unlock-stage3-show-off').addEventListener('click', () => acceptStage3Style(true));
document.querySelector('.unlock-stage3-close').addEventListener('click', () => closeUnlockPopup(stage3UnlockOverlay));
stage3UnlockOverlay.addEventListener('click', event => { if (event.target === stage3UnlockOverlay) closeUnlockPopup(stage3UnlockOverlay); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !stage3UnlockOverlay.hidden) closeUnlockPopup(stage3UnlockOverlay); });
document.querySelector('.unlock-stage4-accept').addEventListener('click', () => acceptStage4Style());
document.querySelector('.unlock-stage4-show-off').addEventListener('click', () => acceptStage4Style(true));
document.querySelector('.unlock-stage4-close').addEventListener('click', () => closeUnlockPopup(stage4UnlockOverlay));
stage4UnlockOverlay.addEventListener('click', event => { if (event.target === stage4UnlockOverlay) closeUnlockPopup(stage4UnlockOverlay); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !stage4UnlockOverlay.hidden) closeUnlockPopup(stage4UnlockOverlay); });
document.querySelector('.unlock-stage5-accept').addEventListener('click', () => acceptStage5Style());
document.querySelector('.unlock-stage5-show-off').addEventListener('click', () => acceptStage5Style(true));
document.querySelector('.unlock-stage5-close').addEventListener('click', () => closeUnlockPopup(stage5UnlockOverlay));
stage5UnlockOverlay.addEventListener('click', event => { if (event.target === stage5UnlockOverlay) closeUnlockPopup(stage5UnlockOverlay); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !stage5UnlockOverlay.hidden) closeUnlockPopup(stage5UnlockOverlay); });
