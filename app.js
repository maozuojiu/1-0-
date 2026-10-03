const viewport = document.querySelector('.viewport');
const fromLotteryTask = new URLSearchParams(location.search).get('from') === 'lottery-task';
const gameExitUrl = fromLotteryTask ? 'lottery.html' : 'music-home/index.html';
const lotteryJumpPendingKey = 'music-home:lottery-jump-pending:v1';
function fitScreen() {
  const scale = Math.min(innerWidth / 375, innerHeight / 812, 1);
  viewport.style.width = `${375 * scale}px`;
  viewport.style.height = `${812 * scale}px`;
  viewport.style.setProperty('--scale', scale);
}
addEventListener('resize', fitScreen);
fitScreen();

// Show each stage for one second, then reveal the game scene.
const countdown = document.querySelector('.countdown');
const ready = countdown.querySelector('.ready');
const number = countdown.querySelector('.countdown-number');
const banner = document.querySelector('.banner');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let countdownTimer;
function scheduleCountdown(callback, delay) {
  clearTimeout(countdownTimer);
  countdownTimer = setTimeout(() => {
    callback();
  }, delay);
}
let countdownAnimation, duckWarmAnimation;
let countdownStage = 0;
let countdownActive = false;
let countdownCuePending = false;
function sweepCountdownBanner() {
  if (reducedMotion.matches) return;
  banner.classList.remove('is-sweeping');
  void banner.offsetWidth;
  banner.classList.add('is-sweeping');
}
banner.addEventListener('animationend', event => {
  if (event.animationName === 'ribbon-sweep') banner.classList.remove('is-sweeping');
});
function showCountdownStage() {
  const label = ['准备', '3', '2', '1'][countdownStage];
  ready.hidden = countdownStage !== 0;
  number.hidden = countdownStage === 0;
  number.textContent = countdownStage === 0 ? '' : label;
  banner.setAttribute('aria-label', label);
  sweepCountdownBanner();
  if (countdownStage === 1) {
    countdownCuePending = true;
    playSound(countdownSound);
  }
  countdownAnimation?.cancel();
  duckWarmAnimation?.cancel();
  duckWarmAnimation = null;
  if (countdownStage === 3 && !reducedMotion.matches) {
    duckWarmAnimation = frontDuck.animate([
      {filter:'none'},
      {filter:'sepia(.18) saturate(1.08)'}
    ], {duration:1000,easing:'linear',fill:'forwards'});
  }
  if (!reducedMotion.matches) {
    const frames = [
      { opacity: 0, transform: 'translateY(12px) scale(.65)', offset: 0 },
      { opacity: 1, transform: 'translateY(-4px) scale(1.12)', offset: .2 },
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: .38 },
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: .8 },
      { opacity: countdownStage === 3 ? 1 : 0,
        transform: countdownStage === 3 ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(.94)', offset: 1 }
    ];
    countdownAnimation = countdown.animate(frames, { duration: 1000, easing: 'ease-out', fill: 'forwards' });
  }
  if (countdownStage < 3) {
    scheduleCountdown(() => { countdownStage++; showCountdownStage(); }, 1000);
  } else {
    scheduleCountdown(() => { countdownActive = false; enterGameScene(); }, 1000);
  }
}
function startCountdown() {
  clearTimeout(countdownTimer);
  soundsToResume = [];
  countdownActive = true;
  countdownCuePending = false;
  countdownSound.pause();
  countdownSound.currentTime = 0;
  resetGameScene();
  countdownStage = 0;
  showCountdownStage();
}
const screen = document.querySelector('.screen');
const character = document.querySelector('.character');
const gameScene = document.querySelector('.game-scene');
const gameWorld = document.querySelector('.game-world');
const gameUI = document.querySelector('.game-ui');
const frontDuck = character.querySelector('.duck');
const rearDuck = gameWorld.querySelector('.game-duck');
const facingTurnCanvas = gameWorld.querySelector('.game-facing-turn');
const facingFrames = Array.from({length:12}, (_, index) => {
  const image = new Image();
  image.src = assetUrl(`assets/facing-frames/${index + 1}.png`);
  return image;
});
const facingFramesReady = Promise.all(facingFrames.map(image => image.decode())).then(() => true, () => false);
let facingTurnRenderId = 0;
const closeBackDuck = character.querySelector('.back-duck');
let sceneRun = 0;
let sceneAnimations = [];
const turnCanvas = character.querySelector('.turn-sequence');
const turnDuration = (2 + 13 / 24) * 1000;
let turnRenderId = 0;
const turnFrames = Array.from({length:30}, (_, index) => {
  const image = new Image();
  image.src = assetUrl(`assets/turn-frames/${index + 1}.png`);
  return image;
});
const turnFramesReady = Promise.all(turnFrames.map(image => image.decode())).then(() => true, () => false);
function drawTurnFrame(progress) {
  const frame = turnFrames[Math.min(29, Math.floor(progress * 30))];
  const context = turnCanvas.getContext('2d');
  // Preserve the motion within each original canvas, including the jump.
  // Align the first pose to the ready duck and the last pose to the rear duck.
  const scale = 198 / 841 + (189 / 733 - 198 / 841) * progress;
  const center = 1133.5 + (1136 - 1133.5) * progress;
  const baseline = 1064 + (1021 - 1064) * progress;
  context.setTransform(2, 0, 0, 2, 0, 0);
  context.clearRect(0, 0, 280, 340);
  context.drawImage(frame, 140 - center * scale, 260 - baseline * scale,
    frame.naturalWidth * scale, frame.naturalHeight * scale);
}
function playTurnSequence() {
  turnCanvas.hidden = false;
  drawTurnFrame(0);
  const clock = turnCanvas.animate([{opacity:1}, {opacity:1}], {duration:turnDuration, fill:'both'});
  sceneAnimations.push(clock);
  const render = () => {
    drawTurnFrame(Math.min(1, Math.max(0, Number(clock.currentTime || 0) / turnDuration)));
    turnRenderId = requestAnimationFrame(render);
  };
  render();
  return clock.finished.then(() => { cancelAnimationFrame(turnRenderId); drawTurnFrame(1); }, () => {});
}
function resetGameScene() {
  cancelAnimationFrame(turnRenderId);
  cancelAnimationFrame(facingTurnRenderId);
  duckWarmAnimation?.cancel();
  duckWarmAnimation = null;
  frontDuck.style.filter = '';
  turnCanvas.hidden = true;
  facingTurnCanvas.hidden = true;
  rearDuck.style.visibility = '';
  frontDuck.style.visibility = '';
  gameWorld.querySelector('.game-shadow-left').style.visibility = '';
  gameWorld.querySelector('.game-duck-shadow').style.visibility = '';
  sceneRun++;
  resetPlayState();
  sceneAnimations.forEach(animation => animation.cancel());
  sceneAnimations = [];
  screen.classList.remove('is-playing');
  banner.hidden = false;
  character.hidden = false;
  gameScene.hidden = true;
}
function sceneAnimate(element, frames, duration, delay = 0, easing = 'cubic-bezier(.22,.7,.25,1)') {
  const animation = element.animate(frames, {
    duration, delay, easing, fill: 'both'
  });
  sceneAnimations.push(animation);
  return animation.finished.catch(() => {});
}
async function enterGameScene() {
  const run = sceneRun;
  const framesAvailable = await turnFramesReady;
  if (run !== sceneRun) return;
  const startingPlatformShadow = gameWorld.querySelector('.game-shadow-left');
  const startingContactShadow = gameWorld.querySelector('.game-duck-shadow');
  startingPlatformShadow.style.visibility = 'hidden';
  startingContactShadow.style.visibility = 'hidden';
  screen.classList.add('is-playing');
  gameScene.hidden = false;
  if (!reducedMotion.matches) {
    const animationStart = sceneAnimations.length;
    const tasks = [
      // Keep the opening drum fully opaque until its identical gameplay image takes over.
      sceneAnimate(character.querySelector('.drum'), [
        {transform:'translateY(0) scale(1,1)', offset:0},
        {transform:'translate(4.3px,33.5px) scale(1.46,2.385)', offset:.9},
        {transform:'translate(4.3px,33.5px) scale(1.46,2.385)', offset:1}
      ], turnDuration, 0, 'linear'),
      sceneAnimate(character.querySelector('.drum-shadow'), [
        {transform:'translate(0,0) scale(1,1)', offset:0},
        {transform:'translate(-52px,84px) rotate(-8.19deg) scale(1.75,3.2)', offset:.8},
        {transform:'translate(-52px,84px) rotate(-8.19deg) scale(1.75,3.2)', offset:1}
      ], turnDuration, 0, 'linear'),
      sceneAnimate(character.querySelector('.soft-shadow'), [
        {opacity:1, offset:0}, {opacity:0, offset:.9}, {opacity:0, offset:1}
      ], turnDuration, 0, 'linear'),
      ...['.game-orange'].map(selector =>
        sceneAnimate(gameWorld.querySelector(selector), [
          {opacity:0, offset:0},
          {opacity:0, offset:.9},
          {opacity:1, offset:1}
        ], turnDuration, 0, 'steps(1, end)')
      ),
      // The opening contact shadow travels with the shrinking character group.
      sceneAnimate(character.querySelector('.duck-shadow'), [
        {opacity:1,transform:'translate(6.22823px,-7.703828px) rotate(0deg) scale(2.094382645,.818368293)',easing:'ease-in-out'},
        {opacity:.4,transform:'translate(3px,-4px) rotate(-4deg) scale(2.105263158,1.4)',offset:.5,easing:'ease-in-out'},
        {opacity:1,transform:'rotate(-8.19deg) scale(2.392344498)',offset:.8},
        {opacity:1,transform:'rotate(-8.19deg) scale(2.392344498)',offset:1}
      ],turnDuration,0,'linear'),
      sceneAnimate(banner, [{opacity: 1}, {opacity: 0}], 500).then(() => {
        if (run === sceneRun) banner.hidden = true;
      }),
      framesAvailable ? playTurnSequence() : sceneAnimate(frontDuck, [{opacity:1},{opacity:1}], turnDuration),
      ...(framesAvailable ? [sceneAnimate(frontDuck, [{opacity:1},{opacity:0}], 85, 0, 'steps(1, end)')] : []),
      sceneAnimate(character, [
        {transform: 'translate(0,0) scale(1)', opacity: 1},
        {transform: 'translate(-12px,-10px) scale(.9)', opacity: 1, offset: .25},
        {transform: 'translate(-64px,-72px) scale(.418)', opacity: 1, offset: .9},
        {transform: 'translate(-64px,-72px) scale(.418)', opacity: 1}
      ], turnDuration, 0, 'ease-in-out'),
      sceneAnimate(gameWorld, [
        {transform: 'none', opacity: 0},
        {transform: 'none', opacity: 1}
      ], 700, 650),
      // Keep the transition duck opaque until the gameplay duck replaces it.
      sceneAnimate(rearDuck, [{opacity: 0}, {opacity: 1}], turnDuration, 0, 'steps(1, end)'),
      sceneAnimate(gameUI, [{opacity: 0}, {opacity: 1}], 350, turnDuration - 350)
    ];
    const sharedStart = document.timeline.currentTime;
    sceneAnimations.slice(animationStart).forEach(animation => { animation.startTime = sharedStart; });
    await Promise.all(tasks);
  }
  if (run !== sceneRun) return;
  banner.hidden = true;
  character.hidden = true;
  startingPlatformShadow.style.visibility = '';
  startingContactShadow.style.visibility = '';
  gameReady = true;
  screen.dispatchEvent(new CustomEvent('game-ready'));
}
// Each successful landing earns a step; advancing to the next drum earns a wave.
let gameReady = false, jumping = false, steps = 0, waves = 0, pressedAt = null;
let cumulativeWavesRecorded = false;
let jumpAnimations = [];
const progress = document.querySelector('.game-progress');
const progressValue = progress.querySelector('strong');
const stepValue = document.querySelector('.steps-value');
const waveValue = document.querySelector('.wave-value');
function recordLanding(advanced) {
  steps++;
  if (advanced) waves++;
  if (advanced && waves === 1) footShadow.classList.add('drum-shadow-tone');
  progressValue.textContent = ` x ${steps}`;
  stepValue.textContent = String(steps);
  waveValue.textContent = String(waves);
  progress.hidden = false;
  document.querySelector('.score').setAttribute('aria-label', `音浪 ${waves}，步数 ${steps}`);
  document.querySelector('.touch-hint').hidden = true;
  document.querySelector('.game-instruction').hidden = true;
}
const orangePlatform = document.querySelector('.game-orange');
const pinkPlatform = document.querySelector('.game-pink');
const orangeShadow = document.querySelector('.game-shadow-left');
const pinkShadow = document.querySelector('.game-shadow-right');
  const footShadow = document.querySelector('.game-duck-shadow');
async function playFacingTurn(fromLeft, toLeft, x, y, run) {
  if (fromLeft === toLeft || reducedMotion.matches || !(await facingFramesReady) || run !== sceneRun) return;
  const context = facingTurnCanvas.getContext('2d');
  const duration = 1000 / 1.25;
  facingTurnCanvas.style.transform = `translate(${x}px,${y}px)`;
  facingTurnCanvas.hidden = false;
  rearDuck.style.visibility = 'hidden';
  const clock = facingTurnCanvas.animate([{opacity:1},{opacity:1}], {duration,fill:'forwards'});
  jumpAnimations.push(clock);
  const render = () => {
    const elapsed = Math.min(duration - 1, Math.max(0, Number(clock.currentTime || 0)));
    const index = Math.floor(elapsed * facingFrames.length / duration);
    const frame = facingFrames[fromLeft ? facingFrames.length - 1 - index : index];
    // Match the visible bounds and feet of both standing poses. The source
    // frames have wide transparent margins, so their canvas must be larger.
    const leftPose = fromLeft ? 1 - elapsed / duration : elapsed / duration;
    facingTurnCanvas.style.left = `${33 - 5 * leftPose}px`;
    facingTurnCanvas.style.top = `${390 - 2 * leftPose}px`;
    facingTurnCanvas.style.width = `${190 + 8 * leftPose}px`;
    facingTurnCanvas.style.height = facingTurnCanvas.style.width;
    context.clearRect(0,0,396,396);
    context.drawImage(frame,0,0,396,396);
    if (clock.playState !== 'finished' && clock.playState !== 'idle') {
      facingTurnRenderId = requestAnimationFrame(render);
    }
  };
  render();
  try { await clock.finished; } catch { /* A restart cancelled this turn. */ }
  cancelAnimationFrame(facingTurnRenderId);
  facingTurnCanvas.hidden = true;
  rearDuck.style.visibility = '';
  clock.cancel();
  jumpAnimations = jumpAnimations.filter(animation => animation !== clock);
}
const drumImages = [assetUrl('assets/drum-variant-1.png'),assetUrl('assets/drum-variant-2.png'),assetUrl('assets/drum-variant-3.png')];
let lastDrumIndex = -1;
let sameDrumStreak = 0;
function randomDrumIndex() {
  let index;
  if (sameDrumStreak >= 3) {
    index = Math.floor(Math.random() * (drumImages.length - 1));
    if (index >= lastDrumIndex) index++;
  } else {
    index = Math.floor(Math.random() * drumImages.length);
  }
  sameDrumStreak = index === lastDrumIndex ? sameDrumStreak + 1 : 1;
  lastDrumIndex = index;
  return index;
}
function useDrum(platform, index) {
  platform.classList.remove('first-drum');
  platform.dataset.drum = String(index + 1);
  platform.querySelector('img').src = drumImages[index];
}
let duckX = 0, duckY = 0;
let targetDx = 143, targetDy = -78;
let lastGeneratedSpacing = null;
let viewOffsetX = 0;
function setLandingPosition(x, y) {
  duckX = x; duckY = y;
  const facingLeft = targetDx < 0;
  rearDuck.classList.toggle('facing-left', facingLeft);
  const duckImage = facingLeft ? assetUrl('assets/game-duck-left.png') : assetUrl('assets/game-duck.png');
  if (rearDuck.getAttribute('src') !== duckImage) rearDuck.src = duckImage;
  rearDuck.style.transform = `translate(${x}px,${y}px)`;
  footShadow.style.transform = `translate(${x}px,${y}px) rotate(-8.19deg)`;
}
function resetPlayState() {
  gameReady = false; jumping = false; steps = 0; waves = 0; pressedAt = null;
  cumulativeWavesRecorded = false;
  cancelAnimationFrame(facingTurnRenderId);
  facingTurnCanvas.hidden = true;
  rearDuck.style.visibility = '';
  targetDx = 143; targetDy = -78;
  lastGeneratedSpacing = null;
  viewOffsetX = 0;
  gameWorld.style.left = '0px';
  gameWorld.querySelectorAll('.platform-transition').forEach(node => node.remove());
  lastDrumIndex = -1;
  sameDrumStreak = 0;
  orangePlatform.classList.add('first-drum');
  delete orangePlatform.dataset.drum;
  orangePlatform.querySelector('img').src = assetUrl('assets/drum.png');
  useDrum(pinkPlatform, randomDrumIndex());
  orangeShadow.classList.add('first-drum');
  orangeShadow.src = assetUrl('assets/drum-shadow.svg');
  footShadow.classList.remove('drum-shadow-tone');
  waveValue.textContent = '0';
  jumpAnimations.forEach(a => a.cancel()); jumpAnimations = [];
  progress.hidden = true; progressValue.textContent = ' x 0'; stepValue.textContent = '0';
  document.querySelector('.score').setAttribute('aria-label', '音浪 0，步数 0');
  orangePlatform.style.transform = ''; pinkPlatform.style.transform = '';
  orangeShadow.style.transform = ''; pinkShadow.style.transform = '';
  setLandingPosition(0, 0);
  footShadow.style.opacity = '';
  document.querySelector('.touch-hint').hidden = false;
  document.querySelector('.game-instruction').hidden = false;
}
function jumpDistance(held) {
  const legDuration = 1400;
  const phase = (Math.max(0, held) % (legDuration * 2)) / legDuration;
  const progress = phase <= 1 ? phase : 2 - phase;
  return .15 + progress * 1.85;
}
function duckFootPoint() {
  const bounds = rearDuck.getBoundingClientRect();
  return {x:bounds.left + bounds.width / 2, y:bounds.bottom - 1};
}
function predictedFootPoint(deltaX, deltaY) {
  const foot = duckFootPoint();
  const scale = screen.getBoundingClientRect().width / screen.offsetWidth;
  return {x:foot.x + deltaX * scale, y:foot.y + deltaY * scale};
}
function onPlatform(point, platform) {
  const image = platform.querySelector('img');
  const bounds = image.getBoundingClientRect();
  const drumType = platform.dataset.drum;
  const shape = drumType === '1'
    ? {cx:.67,cy:.26,rx:.306,ry:.22,ellipse:true}
    : drumType === '2'
      ? {cx:.686,cy:.257,rx:.272,ry:.194}
      : drumType === '3'
        ? {cx:.583,cy:.30,rx:.323,ry:.20}
        : {cx:.5,cy:.35,rx:.40,ry:.18,ellipse:true};
  const offsetX = Math.abs(point.x - (bounds.left + bounds.width * shape.cx));
  const offsetY = Math.abs(point.y - (bounds.top + bounds.height * shape.cy));
  const radiusX = bounds.width * shape.rx;
  const radiusY = bounds.height * shape.ry;
  if (shape.ellipse) return (offsetX / radiusX) ** 2 + (offsetY / radiusY) ** 2 <= 1;
  // The keyboard and xylophone top faces are diamond shaped in the isometric art.
  return offsetX / radiusX + offsetY / radiusY <= 1;
}
async function advance(held) {
  if (!gameReady || jumping) return;
  jumping = true;
  const run = sceneRun;
  const dx = targetDx, dy = targetDy;
  const power = jumpDistance(held);
  const startX = duckX, startY = duckY;
  const landX = startX + dx * power, landY = startY + dy * power;
  const targetPlatform = waves % 2 ? orangePlatform : pinkPlatform;
  const landsOnTarget = onPlatform(predictedFootPoint(landX - startX, landY - startY), targetPlatform);
  const height = 35 + Math.min(power, 1.6) * 55;
  const jumpDuration = reducedMotion.matches ? 1 : 620;
  const jump = rearDuck.animate([
    {transform:`translate(${startX}px,${startY}px)`},
    {transform:`translate(${(startX + landX) * .5}px,${(startY + landY) * .5 - height}px)`,offset:.5},
    {transform:`translate(${landX}px,${landY}px)`}
  ], {duration:jumpDuration,easing:'ease-in-out',fill:'forwards'});
  // Ground projection follows horizontal travel, without the duck's jump arc.
  const airShadow = footShadow.animate([
    {transform:`translate(${startX}px,${startY}px) rotate(-8.19deg) scale(1)`,opacity:1,easing:'ease-in-out'},
    {transform:`translate(${(startX+landX)*.5}px,${(startY+landY)*.5}px) rotate(-8.19deg) scale(.88)`,opacity:.4,offset:.5,easing:'ease-in-out'},
    {transform:`translate(${landX}px,${landY}px) rotate(-8.19deg) scale(1)`,opacity:1}
  ], {duration:reducedMotion.matches?1:620,easing:'ease-in-out',fill:'forwards'});
  const takeoffTime = document.timeline.currentTime;
  jump.startTime = takeoffTime;
  airShadow.startTime = takeoffTime;
  jumpAnimations.push(jump, airShadow);
  if (landsOnTarget) {
    const successCue = rearDuck.animate([{opacity:1},{opacity:1}], {
      duration:Math.max(1, jumpDuration - 400), easing:'linear', fill:'none'
    });
    successCue.startTime = takeoffTime;
    jumpAnimations.push(successCue);
    successCue.finished.then(() => {
      if (run === sceneRun) playSound(successSound);
    }).catch(() => {});
  }
  try { await Promise.all([jump.finished, airShadow.finished]); } catch { return; }
  if (run !== sceneRun) return;
  const landingPoint = duckFootPoint();
  const currentPlatform = waves % 2 ? pinkPlatform : orangePlatform;
  if (!onPlatform(landingPoint, targetPlatform)) {
    if (onPlatform(landingPoint, currentPlatform)) {
      recordLanding(false);
      setLandingPosition(landX, landY);
      jump.cancel(); airShadow.cancel(); jumpAnimations = []; jumping = false;
      footShadow.style.opacity = '';
      return;
    }
    gameReady = false;
    airShadow.cancel();
    footShadow.style.opacity = '0';
    const fall = rearDuck.animate([
      {transform:`translate(${landX}px,${landY}px)`,opacity:1},
      {transform:`translate(${landX}px,${landY+65}px) rotate(18deg)`,opacity:0}
    ],{duration:reducedMotion.matches?1:300,fill:'forwards'});
    playSound(failureSound);
    jumpAnimations.push(fall);
    try { await fall.finished; } catch { return; }
    if (run !== sceneRun) return;
    showResults();
    return;
  }
  recordLanding(true);
  // Keep a third drum ahead of the camera instead of teleporting the old one.
  const previousPlatform = waves % 2 ? orangePlatform : pinkPlatform;
  const previousShadow = waves % 2 ? orangeShadow : pinkShadow;
  const upcomingDrumIndex = randomDrumIndex();
  function platformCopy(x, y) {
    const layer = document.createElement('div');
    layer.className = 'platform-transition';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.transform = `translate(${x}px,${y}px)`;
    const newPlatform = previousPlatform.cloneNode(true);
    useDrum(newPlatform, upcomingDrumIndex);
    layer.appendChild(newPlatform);
    gameWorld.insertBefore(layer, gameWorld.firstChild);
    const shadowLayer = document.createElement('div');
    shadowLayer.className = 'platform-transition platform-shadow-layer';
    shadowLayer.style.transform = layer.style.transform;
    shadowLayer.setAttribute('aria-hidden', 'true');
    const newShadow = previousShadow.cloneNode(true);
    if (waves === 1) {
      newShadow.classList.remove('first-drum');
      newShadow.src = assetUrl('assets/game-shadow-left.svg');
    }
    shadowLayer.appendChild(newShadow);
    gameWorld.insertBefore(shadowLayer, gameWorld.firstChild);
    layer.shadowLayer = shadowLayer;
    return layer;
  }
  // Choose spacing once, before rendering the incoming drum. The clone starts
  // at the current drum, so add both the landing and next-generation vectors.
  const sustainableSpacings = [
    ...Array.from({length:14}, (_, index) => 126 + index),
    ...Array.from({length:14}, (_, index) => 151 + index)
  ];
  const spacingCandidates = lastGeneratedSpacing === null
    ? sustainableSpacings
    : sustainableSpacings.filter(value => Math.abs(value - lastGeneratedSpacing) >= 25);
  const nextSpacing = spacingCandidates[Math.floor(Math.random() * spacingCandidates.length)];
  lastGeneratedSpacing = nextSpacing;
  const drumCenterOffset = {1: {x: -1, y: 0}, 2: {x: 0, y: 2}, 3: {x: -3, y: -12}};
  const currentCenter = drumCenterOffset[targetPlatform.dataset.drum] ?? {x: 0, y: 0};
  const nextCenter = drumCenterOffset[upcomingDrumIndex + 1] ?? {x: 0, y: 0};
  const nextDx = nextSpacing * (Math.random() < .5 ? -1 : 1) + currentCenter.x - nextCenter.x;
  const nextViewOffsetX = nextDx < 0 ? 143 : 0;
  // Keep every drum type on the same perspective centerline. Account for
  // small artwork offsets around each top-face center, not the box bottoms.
  const nextDy = -Math.round(nextSpacing * 78 / 143) + currentCenter.y - nextCenter.y;
  const incoming = platformCopy(dx + nextDx, dy + nextDy);
  const outgoing = previousPlatform.cloneNode(true);
  const outgoingShadow = previousShadow.cloneNode(true);
  const shadowArrival = incoming.shadowLayer.animate([{opacity:0},{opacity:1}],
    {duration:reducedMotion.matches?1:400,easing:'ease-out',fill:'forwards'});
  const arrival = incoming.animate([{opacity:0},{opacity:1}],
    {duration:reducedMotion.matches?1:400,easing:'ease-out',fill:'forwards'});
  // Track the landing while the upcoming drum enters from the upper right.
  const camera = gameWorld.animate([{transform:'none'}, {transform:`translate(${nextViewOffsetX - viewOffsetX - dx}px,${-dy}px)`}],
    {duration:reducedMotion.matches ? 1 : 400,easing:'ease-in-out',fill:'forwards'});
  // Reveal the contact shadow immediately at the actual landing point.
  const shadowReveal = footShadow.animate([{opacity:1},{opacity:1}],
    {duration:reducedMotion.matches?1:80,fill:'forwards',easing:'ease-out'});
  const shadowTrack = footShadow.animate([
    {transform:`translate(${landX}px,${landY}px) rotate(-8.19deg)`},
    {transform:`translate(${landX}px,${landY}px) rotate(-8.19deg)`}
  ],{duration:reducedMotion.matches?1:400,fill:'forwards',easing:'ease-in-out'});
  const landingStart = document.timeline.currentTime;
  [camera, shadowReveal, shadowTrack, arrival, shadowArrival].forEach(animation => { animation.startTime = landingStart; });
  jumpAnimations.push(camera, shadowReveal, shadowTrack, arrival, shadowArrival);
  try { await Promise.all([camera.finished, shadowReveal.finished, shadowTrack.finished, arrival.finished, shadowArrival.finished]); } catch { return; }
  if (run !== sceneRun) return;
  // Preserve old drums in world space as the camera origin advances.
  gameWorld.querySelectorAll('.platform-retained').forEach(layer => {
    const x = Number(layer.dataset.x) - dx;
    const y = Number(layer.dataset.y) - dy;
    layer.dataset.x = String(x); layer.dataset.y = String(y);
    layer.style.transform = `translate(${x}px,${y}px)`;
    // Remove only after the entire drum has scrolled beyond the screen.
    if (y > 900) layer.remove();
  });
  const trailing = document.createElement('div');
  trailing.className = 'platform-transition platform-retained';
  trailing.dataset.x = String(-dx); trailing.dataset.y = String(-dy);
  trailing.setAttribute('aria-hidden', 'true');
  trailing.style.transform = `translate(${-dx}px,${-dy}px)`;
  trailing.appendChild(outgoing);
  gameWorld.insertBefore(trailing, gameWorld.firstChild);
  const trailingShadow = document.createElement('div');
  trailingShadow.className = 'platform-transition platform-retained platform-shadow-layer';
  trailingShadow.dataset.x = String(-dx); trailingShadow.dataset.y = String(-dy);
  trailingShadow.style.transform = trailing.style.transform;
  trailingShadow.setAttribute('aria-hidden', 'true');
  trailingShadow.appendChild(outgoingShadow);
  gameWorld.insertBefore(trailingShadow, gameWorld.firstChild);
  useDrum(previousPlatform, upcomingDrumIndex);
  previousShadow.classList.remove('first-drum');
  targetDx = nextDx;
  targetDy = nextDy;
  // CSS places orange at (0, 0) and pink at (143, -78). Subtract
  // those fixed asset origins, not the newly chosen spacing.
  orangePlatform.style.transform = waves % 2 ? `translate(${targetDx}px,${targetDy}px)` : '';
  pinkPlatform.style.transform = waves % 2 ? 'translate(-143px,78px)' : `translate(${targetDx - 143}px,${targetDy + 78}px)`;
  orangeShadow.style.transform = `${orangePlatform.style.transform} rotate(-8.19deg)`;
  pinkShadow.style.transform = `${pinkPlatform.style.transform} rotate(-8.19deg)`;
  // Rebase the scene after camera tracking, retaining the exact offset on the drum.
  const wasFacingLeft = rearDuck.classList.contains('facing-left');
  setLandingPosition(landX - dx, landY - dy);
  viewOffsetX = nextViewOffsetX;
  gameWorld.style.left = `${viewOffsetX}px`;
  jump.cancel(); airShadow.cancel(); camera.cancel(); shadowReveal.cancel(); shadowTrack.cancel(); jumpAnimations = [];
  footShadow.style.opacity = '';
  incoming.shadowLayer.remove(); shadowArrival.cancel();
  incoming.remove(); arrival.cancel();
  await playFacingTurn(wasFacingLeft, targetDx < 0, duckX, duckY, run);
  if (run !== sceneRun) return;
  jumping = false;
}
const chargeSound = new Audio(assetUrl('assets/charge.mp3'));
const successSound = new Audio(assetUrl('assets/success.mp3'));
const failureSound = new Audio(assetUrl('assets/failure.mp3'));
const countdownSound = new Audio(assetUrl('assets/countdown-321.mp3'));
const allSounds = [chargeSound, successSound, failureSound, countdownSound];
let soundsToResume = [];
allSounds.forEach(sound => { sound.preload = 'auto'; });
const soundToggle = document.querySelector('.music');
let soundEnabled = true;
soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.setAttribute('aria-label', soundEnabled ? '关闭所有音效' : '开启所有音效');
  if (!soundEnabled) {
    soundsToResume = allSounds.map(sound => !sound.paused && !sound.ended);
    allSounds.forEach(sound => {
      sound.pause();
    });
  } else {
    const countdownWasResumed = soundsToResume[3];
    allSounds.forEach((sound, index) => {
      if (soundsToResume[index]) sound.play().catch(() => {});
    });
    const chargeWasResumed = soundsToResume[0];
    soundsToResume = [];
    if (activePointer !== null && !chargeWasResumed) playSound(chargeSound, true);
    if (countdownCuePending && !countdownWasResumed && countdownSound.paused && countdownActive) {
      countdownSound.play().catch(() => {});
    }
  }
});
function playSound(sound, loop = false) {
  if (!soundEnabled) return;
  sound.pause();
  sound.currentTime = 0;
  sound.loop = loop;
  sound.play().catch(() => {});
}
countdownSound.addEventListener('ended', () => { countdownCuePending = false; });
function stopChargeSound() {
  chargeSound.pause();
  chargeSound.currentTime = 0;
  chargeSound.loop = false;
}
let activePointer = null, chargeAnimation;
function cancelCharge() {
  activePointer = null; pressedAt = null;
  chargeAnimation?.cancel(); chargeAnimation = null;
  stopChargeSound();
}
screen.addEventListener('pointerdown', event => {
  if (!gameReady || jumping || activePointer !== null || event.target.closest('button,dialog') || (event.pointerType === 'mouse' && event.button !== 0)) return;
  activePointer = event.pointerId;
  pressedAt = performance.now();
  screen.setPointerCapture(event.pointerId);
  playSound(chargeSound, true);
  if (!reducedMotion.matches) chargeAnimation = rearDuck.animate([
    {transform:`translate(${duckX}px,${duckY}px) scale(1,1)`},
    {transform:`translate(${duckX}px,${duckY}px) scale(1.13,.82)`}
  ],{duration:1400,iterations:Infinity,direction:'alternate',fill:'forwards',easing:'linear'});
});
screen.addEventListener('pointerup', event => {
  if (event.pointerId !== activePointer || pressedAt === null) return;
  const held = performance.now() - pressedAt;
  cancelCharge();
  advance(held);
});
screen.addEventListener('pointercancel', cancelCharge);
screen.addEventListener('lostpointercapture', cancelCharge);
addEventListener('blur', cancelCharge);
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelCharge(); });
const results = document.querySelector('#game-over');
const personalBestKey = 'jump-game-personal-best-v1';
const defaultFriend = {name: '喵宝爱吃糖醋鱼', waves: 29};
function getPersonalBest() {
  try {
    const saved = JSON.parse(localStorage.getItem(personalBestKey));
    if (saved && Number.isFinite(saved.waves) && Number.isFinite(saved.steps)) return saved;
  } catch {}
  return {steps: 0, waves: 0};
}
function savePersonalBest() {
  const best = getPersonalBest();
  if (waves > best.waves) {
    const nextBest = {steps, waves};
    try { localStorage.setItem(personalBestKey, JSON.stringify(nextBest)); } catch {}
    return nextBest;
  }
  return best;
}
function showResults() {
  if (fromLotteryTask) {
    try {
      const pending = Math.max(0, Math.floor(Number(localStorage.getItem(lotteryJumpPendingKey)) || 0));
      localStorage.setItem(lotteryJumpPendingKey, String(pending + 1));
    } catch {}
  }
  window.gameWaveLedger?.ensureTaskDay();
  try { localStorage.setItem('music-home:jump-task-completed:v1', '1'); } catch {}
  window.gameWaveLedger?.awardTask('jump');
  if (!cumulativeWavesRecorded) {
    window.gameWaveLedger?.add(waves);
    cumulativeWavesRecorded = true;
  }
  savePersonalBest();
  document.querySelector('.result-steps').textContent = String(steps);
  document.querySelector('.result-steps').style.fontSize = steps > 999 ? '56px' : '76px';
  document.querySelector('.result-waves').textContent = String(waves);
  results.hidden = false;
  for (const child of screen.children) if (child !== results) child.inert = true;
  document.querySelector('#retry-game').focus({preventScroll:true});
}
function replayFromResults() {
  results.hidden = true;
  for (const child of screen.children) child.inert = false;
  startCountdown();
}
document.querySelector('#retry-game').addEventListener('click', replayFromResults);
document.querySelector('#close-result').addEventListener('click', () => {
  location.href = gameExitUrl;
});
results.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    document.querySelector('#close-result').click();
  }
  if (event.key === 'Tab') {
    const buttons = [...results.querySelectorAll(':scope > button')];
    const index = buttons.indexOf(document.activeElement);
    event.preventDefault();
    buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
  }
});
document.querySelector('#share-result').addEventListener('click', async () => {
  const best = getPersonalBest();
  const text = `${best.steps}步，${best.waves}音浪`;
  try {
    if (navigator.share) await navigator.share({title:'我的跳一跳成绩',text});
    else await navigator.clipboard.writeText(text);
  } catch {}
});
// Wait for the original artwork so its first second is not spent loading.
if (document.readyState === 'complete') startCountdown();
else addEventListener('load', startCountdown, { once: true });
addEventListener('pagehide', () => clearTimeout(countdownTimer));
addEventListener('pageshow', event => { if (event.persisted) startCountdown(); });

document.querySelector('.back').addEventListener('click', () => {
  location.href = gameExitUrl;
});
