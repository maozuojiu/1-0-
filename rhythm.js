(() => {
  const $ = s => document.querySelector(s);
  function resize(){const scale=Math.min(innerWidth/375,innerHeight/812,1);$('.screen').style.setProperty('--scale',scale);$('.viewport').style.width=`${375*scale}px`;$('.viewport').style.height=`${812*scale}px`;}
  addEventListener('resize',resize);resize();
  const slowCardKey='music-home:rhythm-slow-cards:v1';
  const reviveCardKey='music-home:rhythm-revive-cards:v1';
  function readCardCount(key){
    try {
      const count=Number(localStorage.getItem(key));
      return Number.isInteger(count)&&count>=0?count:0;
    } catch { return 0; }
  }
  function saveCardCount(key,count){try{localStorage.setItem(key,String(count));}catch{}}
  let paused=false,started=false,remaining=30,score=0,waves=0,perfectNotes=0,missedNotes=0,reviveShown=false,roundFinished=false,slowItems=readCardCount(slowCardKey),reviveItems=readCardCount(reviveCardKey),slowActive=false,slowTimer=0,slowRemaining=0,slowStartedAt=0,toastTimer,audio;
  const noteTotal=48;
  function waveReward(){
    return 5+Math.floor(perfectNotes*20/noteTotal);
  }
  function toast(message){$('.toast').textContent=message;$('.toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').hidden=true,1600);}
  function updateSlowButton(){
    $('.slow').disabled=slowItems===0||slowActive||!started||paused;
  }
  function stopSlowEffect(){
    clearTimeout(slowTimer);slowTimer=0;slowActive=false;slowRemaining=0;
    song.setPlaybackRate(1);updateSlowButton();
  }
  function armSlowTimer(){
    slowStartedAt=performance.now();
    slowTimer=setTimeout(stopSlowEffect,slowRemaining);
  }
  function freezeSlowTimer(freeze){
    if(!slowActive)return;
    if(freeze){
      clearTimeout(slowTimer);slowTimer=0;
      slowRemaining=Math.max(0,slowRemaining-(performance.now()-slowStartedAt));
    }else if(slowRemaining>0)armSlowTimer();
    else stopSlowEffect();
  }
  function showRevivePrompt(){
    pause(true,false);
    const prompt=$('#revive-prompt');prompt.hidden=false;
    [...screen.children].forEach(child=>child.inert=child!==prompt);
    $('#use-revive').focus({preventScroll:true});
  }
  function closeRevivePrompt(){
    $('#revive-prompt').hidden=true;
    [...screen.children].forEach(child=>child.inert=false);
  }
  let resumeRaf=0,resumeElapsed=0,resumeLast=null,resuming=false;
  function cancelResume(){cancelAnimationFrame(resumeRaf);resumeRaf=0;resuming=false;resumeLast=null;$('.resume').hidden=false;$('.resume-number').hidden=true;}
  function resumeTick(time){
    resumeRaf=0;if(document.hidden){resumeLast=null;return;}
    if(resumeLast!==null)resumeElapsed+=time-resumeLast;resumeLast=time;
    if(resumeElapsed>=3000){pause(false);return;}
    $('.resume-number').textContent=String(3-Math.floor(resumeElapsed/1000));
    resumeRaf=requestAnimationFrame(resumeTick);
  }
  function continueGame(){
    if(!paused||resuming)return;
    resuming=true;resumeElapsed=0;resumeLast=null;
    $('.pause-overlay').hidden=false;$('.resume').hidden=true;
    $('.resume-number').hidden=false;$('.resume-number').textContent='3';
    resumeRaf=requestAnimationFrame(resumeTick);
  }
  document.addEventListener('visibilitychange',()=>{
    if(!resuming)return;
    if(document.hidden){cancelAnimationFrame(resumeRaf);resumeRaf=0;resumeLast=null;}
    else if(!resumeRaf)resumeRaf=requestAnimationFrame(resumeTick);
  });
  function pause(value,showOverlay=true){cancelResume();paused=value;if(value)freezeSlowTimer(true);if(started){if(value)song.pause();else song.play();}if(!value)freezeSlowTimer(false);syncPlayback();syncGuidePlayback();for(const animation of motion.values()){if(value)animation.pause();else if(animation.playState==='paused')animation.play();}$('.pause').setAttribute('aria-pressed',String(value));$('.pause').setAttribute('aria-label',value?'继续':'暂停');$('.pause-overlay').hidden=!value||!showOverlay;updateSlowButton();}
  $('.pause').onclick=()=>paused?continueGame():pause(true);$('.resume').onclick=continueGame;
  function updatePowerCounts(){
    $('#slow-count').textContent=`x${slowItems}`;$('#revive-count').textContent=`x${reviveItems}`;
    $('.slow').setAttribute('aria-label',`乐曲减速，剩余${slowItems}张`);
    $('.revive').setAttribute('aria-label',`复活卡，剩余${reviveItems}张`);
    updateSlowButton();
  }
  $('.slow').onclick=()=>{
    if(!slowItems||slowActive||!started||paused)return;
    slowItems--;saveCardCount(slowCardKey,slowItems);slowActive=true;slowRemaining=10000;song.setPlaybackRate(.5);
    updatePowerCounts();updateSlowButton();armSlowTimer();
  };
  $('#give-up').onclick=()=>{closeRevivePrompt();endRound();};
  $('#use-revive').onclick=()=>{
    if(reviveItems<=0)return;
    reviveItems--;saveCardCount(reviveCardKey,reviveItems);missedNotes=0;reviveShown=false;updatePowerCounts();closeRevivePrompt();continueGame();
  };
  updatePowerCounts();updateSlowButton();
  $('.revive').onclick=()=>toast('暂无复活卡');
  $('.back').onclick=()=>{location.href='music-home/index.html';};
  const motion=new Map(), reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const frames=[...document.querySelectorAll('.drum-frame')],target=$('.target');
  const frameDuration=45/1.25;
  const canvas=document.createElement('canvas');
  canvas.className='drum-canvas';canvas.width=620;canvas.height=620;
  canvas.setAttribute('aria-hidden','true');
  const context=canvas.getContext('2d'),renderedFrames=[];
  function paintFrame(index){
    // Clear and paint synchronously on one persistent surface: no image-layer handoff.
    context.clearRect(0,0,canvas.width,canvas.height);
    context.drawImage(renderedFrames[index],0,0);
  }
  let frameIndex=0,elapsed=0,lastTime=null,raf=0,playing=false,queued=false,ready=false;
  function showFrame(index){
    if(index===frameIndex)return;
    paintFrame(index);frameIndex=index;
    canvas.dataset.frame=String(index);
  }
  function tick(time){
    raf=0;
    if(paused||document.hidden){lastTime=null;return;}
    if(lastTime!==null)elapsed+=time-lastTime;
    lastTime=time;
    if(elapsed>=frames.length*frameDuration){
      if(queued){queued=false;elapsed=0;}
      else{playing=false;lastTime=null;showFrame(0);return;}
    }
    showFrame(Math.min(frames.length-1,Math.floor(elapsed/frameDuration)));
    raf=requestAnimationFrame(tick);
  }
  function syncPlayback(){
    if(paused||document.hidden){cancelAnimationFrame(raf);raf=0;lastTime=null;}
    else if(playing&&!raf){lastTime=null;raf=requestAnimationFrame(tick);}
  }
  document.addEventListener('visibilitychange',syncPlayback);
  function drumMotion(){
    if(!ready||reducedMotion.matches)return;
    // Finish the current stroke and retain at most one follow-up stroke.
    if(playing){queued=true;return;}
    playing=true;elapsed=0;lastTime=null;showFrame(0);syncPlayback();
    motion.get(target)?.cancel();
    motion.set(target,target.animate([{transform:'none'},{transform:'scale(1.04)'},{transform:'none'}],{duration:220}));
  }
  function sound(){
    try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.frequency.setValueAtTime(160,now);osc.frequency.exponentialRampToValueAtTime(55,now+.13);gain.gain.setValueAtTime(.22,now);gain.gain.exponentialRampToValueAtTime(.001,now+.18);osc.connect(gain);gain.connect(audio.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start();osc.stop(now+.18);}catch{}
  }
  function beat(){
    if(paused||!ready||!results.hidden)return;
    if(guidePhase!=='done'){
      if(guidePhase==='step3'){drumMotion();sound();setGuidePhase('step4');}
      else if(guidePhase==='ready-hit'){
        drumMotion();sound();song.primeDuringCountdownFromGesture();setGuidePhase('countdown');
      }
      return;
    }
    if(remaining===0){remaining=30;score=0;waves=0;perfectNotes=0;$('#timer').textContent=30;}
    if(!started){song.reset();started=true;song.play();updateSlowButton();}
    else song.unlockFromGesture();
    const points=song.hit();
    if(points)$('#score').textContent=score+=points;
    drumMotion();sound();
  }
  let judgmentAnimation;
  function showJudgment(kind){
    const el=$('.judgment');
    judgmentAnimation?.cancel();
    el.textContent={perfect:'Perfect!',good:'Good!',miss:'miss'}[kind];
    el.dataset.kind=kind;
    judgmentAnimation=el.animate([
      {opacity:0,transform:'translateX(-50%) scale(.8)'},
      {opacity:1,transform:'translateX(-50%) scale(1.08)',offset:.18},
      {opacity:1,transform:'translateX(-50%) scale(1)',offset:.65},
      {opacity:0,transform:'translateX(-50%) translateY(-12px) scale(1)'}
    ],{duration:550});
  }
  const song=new RhythmSong({
    onJudge:showJudgment,
    onNoteJudged:kind=>{
      if(kind==='perfect')perfectNotes++;
      if(kind==='miss'){
        missedNotes++;
        if(missedNotes>=noteTotal/2&&!reviveShown){
          reviveShown=true;
          if(reviveItems>0)showRevivePrompt();else endRound();
        }
      }
      waves=waveReward();$('#waves').textContent=String(waves);
    },
    onTime:value=>{remaining=value;$('#timer').textContent=String(value);},
    onEnd:()=>endRound(),
    onBlocked:()=>{}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused)pause(true);});
  const results=$('#game-over');
  const bestKey='rhythm-personal-best-waves-v1',friendWaves=16;
  let bestWaves=0;try{bestWaves=Math.max(0,Number(localStorage.getItem(bestKey))||0);}catch{}
  async function shareResult(){
    const text=`我在音游小游戏中获得 ${Math.max(waves,bestWaves)} 音浪，排名 TOP ${Math.max(waves,bestWaves)>friendWaves?'1':'2'}！`;
    try{
      if(navigator.share)await navigator.share({title:'我的音游成绩',text});
      else{await navigator.clipboard.writeText(text);toast('成绩已复制，可粘贴分享');}
    }catch(error){if(error.name!=='AbortError')toast('暂时无法分享成绩');}
  }

  function hideResults(){
    results.hidden=true;
    [...screen.children].forEach(child=>child.inert=false);
  }
  function endRound(){
    if(roundFinished)return;
    roundFinished=true;
    window.gameWaveLedger?.ensureTaskDay();
    try { localStorage.setItem('music-home:rhythm-task-completed:v1', '1'); } catch {}
    window.gameWaveLedger?.awardTask('rhythm');
    song.stop();started=false;stopSlowEffect();remaining=0;$('#timer').textContent='0';
    cancelAnimationFrame(raf);raf=0;playing=false;queued=false;showFrame(0);
    motion.forEach(animation=>animation.cancel());motion.clear();
    const earnedWaves=waveReward();
    waves=earnedWaves;
    window.gameWaveLedger?.add(earnedWaves);
    $('.result-score').textContent=String(score);
    $('.result-score').style.fontSize=score>999?'56px':'76px';
    $('.result-waves').textContent=String(earnedWaves);
    if(waves>bestWaves){bestWaves=waves;try{localStorage.setItem(bestKey,String(bestWaves));}catch{}}
    $('#share-result').textContent='分享';results.hidden=false;
    [...screen.children].forEach(child=>child.inert=child!==results);
    results.focus({preventScroll:true});
  }
  function retryRound(){
    stopSlowEffect();
    roundFinished=false;
    song.reset();started=false;guide.classList.add("countdown-only");
    hideResults();pause(false,false);score=0;waves=0;perfectNotes=0;missedNotes=0;reviveShown=false;remaining=30;started=false;
    $('#score').textContent='0';$('#waves').textContent='0';$('#timer').textContent='30';
    showFrame(0);guide.hidden=false;shade.hidden=false;screen.classList.add('is-guiding');
    guideControls.forEach(el=>el.inert=true);setGuidePhase('countdown');
  }
  $('#retry-game').onclick=retryRound;
  $('#close-result').onclick=()=>{location.href='music-home/index.html';};
  $('#share-result').onclick=shareResult;
  results.addEventListener('keydown',event=>{
    if(event.key==='Escape'){$('#close-result').click();return;}
    if(event.key==='Tab'){
      const buttons=[...results.querySelectorAll('button')];
      const index=buttons.indexOf(document.activeElement);
      event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
    }
  });
  const beatButton=$('.beat');
  const guide=$('.guide'),shade=$('.guide-shade'),screen=$('.screen');
  const tutorialKey='rhythm-four-step-tutorial-v2';
  let tutorialComplete=false,tutorialInProgress=false;
  try{tutorialComplete=localStorage.getItem(tutorialKey)==='yes';}catch{}
  const timedGuidePhases=new Set(['step2','step4','countdown']);
  let guidePhase='loading',guideElapsed=0,guideLast=null,guideRaf=0;
  screen.addEventListener('pointerdown',event=>{
    if(paused||!ready)return;
    if(guidePhase==='step1'){
      event.preventDefault();event.stopPropagation();setGuidePhase('step2');return;
    }
    if(event.isTrusted&&guidePhase==='countdown')song.primeDuringCountdownFromGesture();
  },{capture:true});
  const guideControls=[$('.pause'),$('.slow'),$('.revive')];
  function setGuidePhase(phase){
    cancelAnimationFrame(guideRaf);guideRaf=0;
    guidePhase=phase;guide.dataset.phase=phase;screen.dataset.guidePhase=phase;
    guideElapsed=0;guideLast=null;
    const lesson=['step1','step2','step3','step4','ready-hit'].includes(phase);
    screen.dataset.lesson=String(lesson);
    $('.guide-number').hidden=phase!=='countdown';
    beatButton.disabled=!['step3','step4','ready-hit','done','countdown'].includes(phase);
    beatButton.querySelector('img').src=['step3','step4','ready-hit'].includes(phase)?assetUrl('assets/rhythm/tutorial/img1.svg'):assetUrl('assets/rhythm/img4.svg');
    const copy={
      step1:['第一步','「乐曲减速」道具可让节奏变慢','点击空白处继续'],
      step2:['第二步','使用「复活卡」道具复活','即将进入下一步'],
      step3:['第三步','音符到<span>判定圈</span>时点击！','点击右下方音符按钮'],
      step4:['第四步','看准时机，精准打击！','等待音符进入判定圈'],
      'ready-hit':['第四步','看准时机，精准打击！','点击右下方音符按钮']
    };
    if(copy[phase]){
      const [title,message,hint]=copy[phase];
      $('.lesson-title').textContent=title;$('.lesson-message').innerHTML=message;$('.lesson-hint').textContent=hint;
      $('.lesson-note').style.transform=phase==='ready-hit'?'translate(-90px,79px)':'none';
    }
    if(phase==='countdown')$('.guide-number').textContent='3';
    beatButton.setAttribute('aria-label',lesson?'点击，练习敲鼓':'敲击鼓点');
    if(timedGuidePhases.has(phase))guideRaf=requestAnimationFrame(guideTick);
  }
  function finishGuide(){
    setGuidePhase('done');guide.hidden=true;shade.hidden=true;
    screen.classList.remove('is-guiding');guideControls.forEach(el=>el.inert=false);
    beatButton.querySelector('img').src=assetUrl('assets/rhythm/img4.svg');
    beatButton.setAttribute('aria-label','敲击鼓点，开始游戏');
    if(tutorialInProgress){
      tutorialComplete=true;tutorialInProgress=false;
      try{localStorage.setItem(tutorialKey,'yes');}catch{}
    }
    started=true;song.startFromCountdown();
  }
  function guideTick(time){
    guideRaf=0;
    if(document.hidden||paused){guideLast=null;return;}
    if(guideLast!==null)guideElapsed+=time-guideLast;
    guideLast=time;
    if(guidePhase==='step2'&&guideElapsed>=2000){setGuidePhase('step3');return;}
    if(guidePhase==='step4'){
      const progress=Math.min(1,guideElapsed/3000);
      $('.lesson-note').style.transform=`translate(${-90*progress}px,${79*progress}px)`;
      if(progress===1){setGuidePhase('ready-hit');return;}
    }
    if(guidePhase==='countdown'){
      if(guideElapsed>=3000){finishGuide();return;}
      $('.guide-number').textContent=String(3-Math.floor(guideElapsed/1000));
    }
    if(timedGuidePhases.has(guidePhase))guideRaf=requestAnimationFrame(guideTick);
  }
  function beginGuide(forceTutorial=false){
    screen.classList.add('is-guiding');guideControls.forEach(el=>el.inert=true);
    guide.hidden=false;shade.hidden=false;
    tutorialInProgress=forceTutorial||!tutorialComplete;
    setGuidePhase(tutorialInProgress?'step1':'countdown');
  }
  function syncGuidePlayback(){
    if(document.hidden||paused){cancelAnimationFrame(guideRaf);guideRaf=0;guideLast=null;}
    else if(ready&&timedGuidePhases.has(guidePhase)&&!guideRaf){guideLast=null;guideRaf=requestAnimationFrame(guideTick);}
  }
  document.addEventListener('visibilitychange',syncGuidePlayback);
  beatButton.disabled=true;
  const noteImage=new Image();noteImage.src=assetUrl('assets/rhythm/note-single.png');
  Promise.all([...frames,noteImage,...guide.querySelectorAll('img'),$('.lesson-ring'),$('.lesson-note')].map(frame=>frame.decode())).then(()=>{
    // Rasterize every decoded image before enabling the first interaction.
    for(const frame of frames){
      const buffer=document.createElement('canvas');buffer.width=620;buffer.height=620;
      buffer.getContext('2d').drawImage(frame,0,0,620,620);renderedFrames.push(buffer);
    }
    paintFrame(0);canvas.dataset.frame='0';
    document.querySelector('.duck-position').append(canvas);
    frames.forEach(frame=>frame.hidden=true);
    ready=true;beatButton.disabled=false;beginGuide();
  }).catch(()=>toast('动作图片加载失败，请刷新页面重试'));

  beatButton.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;event.preventDefault();beat();});
  // Keyboard and assistive-technology activation still use click; physical taps fire only once.
  beatButton.addEventListener('click',event=>{if(event.detail===0)beat();});
  addEventListener('keydown',e=>{
    if(guidePhase==='step1'&&!paused&&['Space','Enter'].includes(e.code)){e.preventDefault();setGuidePhase('step2');return;}
    if(e.code==='Space'&&e.target===document.body){e.preventDefault();beat();}});

})();
