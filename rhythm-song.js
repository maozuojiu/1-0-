// The audio position is the single clock for music, note travel, and round duration.
class RhythmSong {
  constructor({onTime,onEnd,onBlocked,onJudge,onNoteJudged}){
    this.audio=new Audio(assetUrl('assets/rhythm/twinkle-30s.wav'));this.audio.preload='auto';
    this.layer=document.querySelector('.song-notes');this.onTime=onTime;this.onEnd=onEnd;this.onBlocked=onBlocked;this.onJudge=onJudge;this.onNoteJudged=onNoteJudged;
    this.raf=0;this.playId=0;this.active=false;this.notes=[];this.clockMode='audio';this.clockBase=0;this.clockStartedAt=0;this.playbackRate=1;this.primed=false;this.priming=null;this.unlocking=false;this.reset();
    this.audio.addEventListener('ended',()=>this.finish());
  }
  makeNotes(){
    const styles=[
      {src:assetUrl('assets/rhythm/note-single.png'),width:48,height:63},
      {src:assetUrl('assets/rhythm/guide/img8.png'),width:64,height:80},
      {src:assetUrl('assets/rhythm/note-coral.png'),width:48,height:63},
      {src:assetUrl('assets/rhythm/note-pink-pair.png'),width:52,height:65},
      {src:assetUrl('assets/rhythm/note-white-pink-pair.png'),width:52,height:65},
      {src:assetUrl('assets/rhythm/note-lavender.png'),width:48,height:63}
    ];
    // Pick each origin once per round, within the two side strips (375px design coordinates).
    this.notes=Array.from({length:48},(_,i)=>{
      const side=Math.random()<.5?0:1;
      const style=styles[Math.floor(Math.random()*styles.length)];
      return {time:1.5+i*.575,side,...style,startX:side?319+Math.random()*56:Math.random()*41,
        startY:side?129+Math.random()*312:122+Math.random()*296,hit:false,el:null};
    });
  }
  reset(){this.pause();this.playbackRate=1;this.audio.playbackRate=1;this.audio.currentTime=0;this.audio.muted=false;this.clockMode='audio';this.clockBase=0;this.clockStartedAt=0;this.primed=false;this.layer.replaceChildren();this.makeNotes();this.onTime?.(30);}
  position(now=performance.now()){return this.clockMode==='clock'?this.clockBase+(now-this.clockStartedAt)/1000*this.playbackRate:this.audio.currentTime;}
  setPlaybackRate(rate){
    if(rate===this.playbackRate)return;
    if(this.clockMode==='clock'){
      this.clockBase=this.position();this.clockStartedAt=performance.now();
    }
    this.playbackRate=rate;this.audio.playbackRate=rate;
  }
  primeDuringCountdownFromGesture(){
    if(this.primed||this.priming||this.active)return;
    this.audio.muted=true;this.audio.currentTime=0;
    this.priming=this.audio.play().then(()=>{this.primed=true;}).catch(()=>{this.audio.muted=false;}).finally(()=>{this.priming=null;});
  }
  async startFromCountdown(){
    if(this.priming)await this.priming;
    if(this.primed){
      const id=++this.playId;this.audio.currentTime=0;this.audio.muted=false;this.clockMode='audio';this.active=true;
      this.layer.replaceChildren();this.makeNotes();this.onTime?.(30);
      try{await this.audio.play();if(id===this.playId&&this.active)this.tick();}
      catch{if(id===this.playId){this.clockMode='clock';this.clockBase=0;this.clockStartedAt=performance.now();this.tick();}}
      return;
    }
    this.reset();await this.play();
  }
  async play(){
    const id=++this.playId;this.active=true;this.audio.muted=false;
    try{await this.audio.play();if(id===this.playId&&this.active){this.clockMode='audio';this.tick();}}
    catch{if(id!==this.playId)return;this.clockMode='clock';this.clockBase=this.audio.currentTime;this.clockStartedAt=performance.now();this.tick();this.onBlocked?.();}
  }
  async unlockFromGesture(){
    if(!this.active||this.clockMode!=='clock'||this.unlocking)return;
    this.unlocking=true;this.audio.currentTime=this.position();
    try{await this.audio.play();this.clockMode='audio';}catch{}finally{this.unlocking=false;}
  }
  pause(){if(this.active&&this.clockMode==='clock'){this.clockBase=this.position();this.audio.currentTime=this.clockBase;}this.playId++;this.active=false;this.audio.pause();cancelAnimationFrame(this.raf);this.raf=0;}
  stop(){this.pause();this.layer.replaceChildren();this.notes.forEach(n=>n.el=null);}
  tick=(time)=>{
    cancelAnimationFrame(this.raf);this.raf=0;if(!this.active)return;
    const t=this.position(time);this.onTime(Math.max(0,Math.ceil(30-t)));
    for(const n of this.notes){
      const delta=n.time-t;
      if(!n.hit&&delta<-.24){n.hit=true;this.onJudge?.("miss");this.onNoteJudged?.('miss');if(!this.active)return;}
      if(!n.hit&&delta<=1.4&&delta>=-.24){
        if(!n.el){n.el=new Image();n.el.src=n.src;n.el.className='song-note';n.el.alt='';n.el.width=n.width;n.el.height=n.height;this.layer.append(n.el);}
        const p=Math.min(1.18,(1.4-delta)/1.4);
        const x=n.startX+(186-n.startX)*p,y=n.startY+(298-n.startY)*p;
        n.el.style.transform=`translate3d(${x-n.width/2}px,${y-n.height/2}px,0)`;
        n.el.style.opacity=delta<0?String(Math.max(0,1+delta/.24)):'1';
      }else if(n.el){n.el.remove();n.el=null;}
    }
    if(t>=29.99){this.finish();return;}this.raf=requestAnimationFrame(this.tick);
  }
  innerCircleCoverage(n,t){
    const fraction=(n.time-t)/1.4;
    const x=(n.startX-186)*fraction-.2407,y=(n.startY-298)*fraction-.2407;
    const {width,height}=n,radius=36.9074;
    // Integrate the note's displayed footprint inside the inner circle.
    const strips=128,step=width/strips;
    let area=0;
    for(let i=0;i<strips;i++){
      const dx=x-width/2+(i+.5)*step;
      if(Math.abs(dx)>=radius)continue;
      const edge=Math.sqrt(radius*radius-dx*dx);
      area+=Math.max(0,Math.min(y+height/2,edge)-Math.max(y-height/2,-edge))*step;
    }
    return area/(width*height);
  }
  hit(){
    const t=this.position();
    // Judge the note center against the visible inner and outer circles.
    const candidates=this.notes.filter(n=>!n.hit&&n.time-t<=1.4&&n.time-t>=-.24)
      .map(n=>({n,distance:Math.hypot(n.startX-186,n.startY-298)*Math.abs(n.time-t)/1.4}))
      .filter(n=>n.distance<=70).sort((a,b)=>a.distance-b.distance);
    const candidate=candidates[0];
    if(!candidate){this.onJudge?.('miss');return 0;}
    const {n,distance}=candidate;n.hit=true;n.el?.remove();n.el=null;
    const perfect=distance<=30&&this.innerCircleCoverage(n,t)>.5;
    const kind=perfect?'perfect':'good';this.onJudge?.(kind);this.onNoteJudged?.(kind);return perfect?5:1;
  }
  finish(){if(!this.active)return;this.stop();this.onEnd();}
}
