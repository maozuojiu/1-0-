const screen=document.querySelector('.screen'),viewport=document.querySelector('.viewport');
function fit(){const s=viewport.clientWidth/375;screen.style.transform=`scale(${s})`;viewport.style.height=`${1052*s}px`}
new ResizeObserver(fit).observe(viewport);fit();
const dialog=document.querySelector('dialog');
function show(title,copy){document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-copy').textContent=copy;dialog.showModal()}
document.querySelector('.close-dialog').onclick=()=>dialog.close();
dialog.onclick=e=>{if(e.target===dialog&& (e.offsetX<0||e.offsetX>dialog.clientWidth||e.offsetY<0||e.offsetY>dialog.clientHeight))dialog.close()};
document.querySelector('.back').onclick=()=>{location.href='music-home/index.html'};
function share(){openDailyShare()}
document.querySelector('.share').onclick=share;
document.querySelector('.guide').onclick=()=>show('奖品攻略','奖池展示：iPhone18、999￥红包、WatchSE3、金币和优酷月卡。页面中的概率为设计稿文案，真实活动规则尚未接入。');
document.querySelectorAll('[data-prize]').forEach(b=>b.onclick=()=>show(b.dataset.prize,'这是设计稿中的奖品展示，实际奖品领取需接入活动服务。'));
const draw=document.querySelector('.draw');
const slotImages=[...document.querySelectorAll('.reel-slot')];
const slotPrizeImages={phone:assetUrl('assets/lottery/slot-phone.png'),envelope:assetUrl('assets/lottery/slot-envelope.png'),watch:assetUrl('assets/lottery/slot-watch.png')};
const firstTierRewardTable=[
  {id:'1-yuan',name:'1元券',image:assetUrl('assets/lottery/first-tier-1-yuan.png'),weight:1980,ratio:.7485},
  {id:'revive-card',name:'复活卡',image:assetUrl('assets/lottery/first-tier-revive-card.png'),weight:1980,ratio:.7152},
  {id:'slow-card',name:'减速卡',image:assetUrl('assets/lottery/first-tier-slow-card.png'),weight:1980,ratio:.7152},
  {id:'2-yuan',name:'2元券',image:assetUrl('assets/lottery/first-tier-2-yuan.png'),weight:1980,ratio:.7485},
  {id:'5-yuan',name:'5元券',image:assetUrl('assets/lottery/first-tier-5-yuan.png'),weight:1980,ratio:.7485},
  {id:'10-yuan',name:'10元券',image:assetUrl('assets/lottery/first-tier-10-yuan.png'),weight:70,ratio:.7485},
  {id:'40-yuan',name:'40元券',image:assetUrl('assets/lottery/first-tier-40-yuan.png'),weight:30,ratio:.7152},
  {id:'60-yuan',name:'60元券',image:assetUrl('assets/lottery/first-tier-60-yuan.png'),weight:10,ratio:.7515}
];
const secondTierRewardTable=[
  {id:'plush-1',name:'森小肥毛绒公仔',image:assetUrl('assets/lottery/second-tier-plush-1.png'),ratio:.7485},
  {id:'plush-2',name:'森小肥毛绒公仔',image:assetUrl('assets/lottery/second-tier-plush-2.png'),ratio:.7485},
  {id:'plush-3',name:'森小肥毛绒公仔',image:assetUrl('assets/lottery/second-tier-plush-3.png'),ratio:.7485},
  {id:'plush-4',name:'森小肥毛绒公仔',image:assetUrl('assets/lottery/second-tier-plush-4.png'),ratio:.7485},
  {id:'plush-5',name:'森小肥毛绒公仔',image:assetUrl('assets/lottery/second-tier-plush-5.png'),ratio:.7485}
];
const thirdTierRewardTable=[
  {id:'100-yuan',name:'100元红包',image:assetUrl('assets/lottery/third-tier-100-yuan.png'),ratio:.7485,weight:600},
  {id:'666-yuan',name:'666元大红包',image:assetUrl('assets/lottery/third-tier-666-yuan.png'),ratio:.7485,weight:300},
  {id:'999-yuan',name:'999元大红包',image:assetUrl('assets/lottery/third-tier-999-yuan.png'),ratio:.7485,weight:100}
];
const fourthTierReward={id:'watch-se3',name:'WatchSE3',image:assetUrl('assets/lottery/fourth-tier-watch.png'),ratio:.7485};
const fifthTierReward={id:'iphone-17-pro-max',name:'iPhone17ProMax',image:assetUrl('assets/lottery/fifth-tier-iphone.png'),ratio:.7485};
function rollSecondTierReward(){
  return secondTierRewardTable[Math.floor(Math.random()*secondTierRewardTable.length)];
}
function rollThirdTierReward(){
  let roll=Math.floor(Math.random()*1000);
  for(const reward of thirdTierRewardTable){
    if(roll<reward.weight)return reward;
    roll-=reward.weight;
  }
  return thirdTierRewardTable[0];
}
function rollFirstTierReward(){
  let roll=Math.floor(Math.random()*10010);
  for(const reward of firstTierRewardTable){
    if(roll<reward.weight)return reward;
    roll-=reward.weight;
  }
  return firstTierRewardTable[0];
}
function rollLotteryTier(){
  const roll=Math.floor(Math.random()*10000000);
  const mixed=prize=>{
    const prizes=['envelope','envelope',prize];
    const target=Math.floor(Math.random()*3);
    [prizes[target],prizes[2]]=[prizes[2],prizes[target]];
    return prizes;
  };
  if(roll<9600000)return {name:'第一档',odds:'96%',prizes:['envelope','envelope','envelope']};
  if(roll<9980000)return {name:'第二档',odds:'3.8%',prizes:mixed('watch')};
  if(roll<9999900)return {name:'第三档',odds:'0.199%',prizes:mixed('phone')};
  if(roll<9999960)return {name:'第四档',odds:'0.0006%',prizes:['watch','watch','watch']};
  return {name:'第五档',odds:'0.0004%',prizes:['phone','phone','phone']};
}
draw.onclick=()=>{
  if(availableChances<1){
    show('抽奖机会不足','完成下方日常任务可获得抽奖机会。');
    return;
  }
  availableChances-=1;
  saveLotteryChances();
  draw.disabled=true;
  const result=rollLotteryTier();
  screen.classList.add('drawing');
  window.setTimeout(()=>{
    result.prizes.forEach((prize,index)=>{
      slotImages[index].src=slotPrizeImages[prize];
      slotImages[index].alt={envelope:'红包',watch:'手表',phone:'手机'}[prize];
    });
    screen.classList.remove('drawing');
    draw.disabled=false;
    const prizeNames={envelope:'红包',watch:'手表',phone:'手机'};
    if(result.name==='第一档'){
      openRewardImage(rollFirstTierReward());
    }else if(result.name==='第二档'){
      openRewardImage(rollSecondTierReward());
    }else if(result.name==='第三档'){
      openRewardImage(rollThirdTierReward());
    }else if(result.name==='第四档'){
      openRewardImage(fourthTierReward);
    }else if(result.name==='第五档'){
      openRewardImage(fifthTierReward);
    }else{
      show(`抽中${result.name}`,`${result.prizes.map(prize=>prizeNames[prize]).join('、')}\n本档概率：${result.odds}`);
    }
  },900);
};


const progressStorageKey = 'music-home:lottery-progress:v1';
const claimedStorageKey = 'music-home:lottery-claimed:v1';
const dailyTaskKeyPrefix = 'music-home:lottery-daily:';
const rewardLevels = [0, 25, 50, 75, 100];
function readSavedProgress() {
  try {
    let completed = 0;
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(dailyTaskKeyPrefix)) continue;
      try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(saved)) completed += new Set(saved.filter(id => Number.isInteger(id) && id >= 0 && id <= 3)).size;
      } catch {}
    }
    return Math.min(100, completed);
  } catch { return 0; }
}
function readClaimedRewards() {
  try {
    const saved = JSON.parse(localStorage.getItem(claimedStorageKey));
    return new Set([0, ...(Array.isArray(saved) ? saved.filter(level => rewardLevels.includes(level)) : [])]);
  } catch { return new Set([0]); }
}
function saveLotteryState() {
  try {
    localStorage.setItem(progressStorageKey, String(lotteryProgress));
    localStorage.setItem(claimedStorageKey, JSON.stringify([...claimedRewards]));
  } catch { /* The page stays usable when storage is unavailable. */ }
}
let lotteryProgress = readSavedProgress();
const claimedRewards = readClaimedRewards();
const progressBar = document.querySelector('.live-progress-track');
const rewardPopup = document.querySelector('#reward-popup');
function openRewardImage(reward){
  const inventoryKey = {
    'revive-card':'music-home:rhythm-revive-cards:v1',
    'slow-card':'music-home:rhythm-slow-cards:v1'
  }[reward.id];
  if (inventoryKey) {
    try {
      const saved = Number(localStorage.getItem(inventoryKey));
      const count = Number.isInteger(saved) && saved >= 0 ? saved : 0;
      localStorage.setItem(inventoryKey, String(count + 1));
    } catch {}
  }
  const art=document.querySelector('#reward-popup-art');
  art.src=reward.image;
  art.alt=`恭喜获得${reward.name}`;
  rewardPopup.classList.remove('coupon');
  rewardPopup.style.setProperty('--reward-ratio',String(reward.ratio));
  rewardPopup.setAttribute('aria-label',art.alt);
  document.body.classList.add('reward-open');
  rewardPopup.showModal();
}
const dailyShareModal = document.querySelector('#daily-share-modal');
const taskDayOffsetKey = 'music-home:lottery-day-offset:v1';
const lotteryChanceKey = 'music-home:lottery-chances:v1';
const lotteryJumpPendingKey = 'music-home:lottery-jump-pending:v1';
let availableChances = 0;
try {
  const savedChances=Number(localStorage.getItem(lotteryChanceKey));
  if(Number.isInteger(savedChances)&&savedChances>=0)availableChances=savedChances;
} catch {}
function saveLotteryChances(){
  try{localStorage.setItem(lotteryChanceKey,String(availableChances));}catch{}
  const count=document.querySelector('#chance-count');
  if(count)count.textContent=String(availableChances);
  const button=document.querySelector('.chance');
  if(button)button.setAttribute('aria-label',`抽奖机会，剩余${availableChances}次`);
}
let taskDayOffset = 0;
try { taskDayOffset = Math.max(0, Math.floor(Number(localStorage.getItem(taskDayOffsetKey)) || 0)); } catch {}
function currentTaskDate() {
  const date = new Date(Date.now() + taskDayOffset * 86400000);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function readDailyTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(dailyTaskKeyPrefix + currentTaskDate()));
    return new Set(Array.isArray(saved) ? saved.filter(id => Number.isInteger(id) && id >= 0 && id <= 3) : []);
  } catch { return new Set(); }
}
let completedDailyTasks = readDailyTasks();
function saveDailyTasks() {
  try { localStorage.setItem(dailyTaskKeyPrefix + currentTaskDate(), JSON.stringify([...completedDailyTasks])); } catch {}
}
function renderDailyTasks() {
  document.querySelectorAll('[data-task]').forEach(button => {
    const complete = completedDailyTasks.has(Number(button.dataset.task));
    button.classList.toggle('is-complete', complete);
    button.textContent = complete ? '已获取' : '去获取';
    button.setAttribute('aria-label', complete ? '已获取' : '去获取');
    button.disabled = complete;
  });
}
function completeDailyTask(id) {
  if (completedDailyTasks.has(id)) return false;
  completedDailyTasks.add(id);
  saveDailyTasks();
  availableChances+=1;
  saveLotteryChances();
  lotteryProgress = Math.min(100, lotteryProgress + 1);
  saveLotteryState();
  renderLotteryProgress();
  renderDailyTasks();
  return true;
}
function collectFinishedJumpGames() {
  let pending = 0;
  try {
    pending = Math.max(0, Math.floor(Number(localStorage.getItem(lotteryJumpPendingKey)) || 0));
    localStorage.removeItem(lotteryJumpPendingKey);
  } catch {}
  if (pending) completeDailyTask(2);
}
const rewardNames = {25:'1.99元红包',50:'30元代金券',75:'6.99元红包',100:'9.9元红包'};
function renderLotteryProgress() {
  progressBar.setAttribute('aria-valuenow', String(lotteryProgress));
  document.querySelector('.live-progress-fill').style.width = `${lotteryProgress}%`;
  document.querySelectorAll('.milestone').forEach(button => {
    const level = Number(button.dataset.level);
    const claimed = claimedRewards.has(level);
    const eligible = level > 0 && lotteryProgress >= level && !claimed;
    button.disabled = !eligible;
    button.classList.toggle('is-claimable', eligible);
    button.setAttribute('aria-label', `${rewardNames[level] || (level === 0 ? '0.99元红包' : '超级大奖')}，${claimed ? '已获得' : eligible ? '可领取' : `需要${level}点进度`}`);
    if (level < 100) {
      button.querySelector('img').src = assetUrl(`assets/lottery/envelope-${claimed ? 'open' : 'closed'}.png`);
      button.querySelector('.milestone-label').textContent = claimed
        ? '已获得'
        : {25:'返现金',50:'代金券',75:'返现金'}[level];
    }
  });
}
document.querySelectorAll('[data-task]').forEach(button => button.addEventListener('click', () => {
  const id = Number(button.dataset.task);
  if (id === 0) completeDailyTask(0);
  if (id === 2) location.href = 'jump.html?from=lottery-task';
  if (id === 3) openDailyShare();
}));
function openDailyShare() {
  dailyShareModal.hidden = false;
  document.documentElement.classList.add('daily-share-open');
  document.body.classList.add('daily-share-open');
  dailyShareModal.querySelector('.daily-share-close').focus({preventScroll:true});
}
function closeDailyShare() {
  dailyShareModal.hidden = true;
  document.documentElement.classList.remove('daily-share-open');
  document.body.classList.remove('daily-share-open');
}
dailyShareModal.querySelector('.daily-share-close').addEventListener('click', closeDailyShare);
dailyShareModal.addEventListener('click', event => { if (event.target === dailyShareModal) closeDailyShare(); });
dailyShareModal.querySelector('.daily-share-save').addEventListener('click', () => {
  completeDailyTask(3);
  closeDailyShare();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !dailyShareModal.hidden) closeDailyShare();
});
document.querySelectorAll('.milestone').forEach(button => button.addEventListener('click', () => {
  const level = Number(button.dataset.level);
  if (lotteryProgress < level || claimedRewards.has(level)) return;
  claimedRewards.add(level);
  saveLotteryState();
  renderLotteryProgress();
  const art = document.querySelector('#reward-popup-art');
  art.src = assetUrl(`assets/lottery/reward-${level}.png`);
  art.alt = `恭喜获得${rewardNames[level]}`;
  rewardPopup.classList.toggle('coupon', level === 50);
  rewardPopup.style.setProperty('--reward-ratio', level === 50 ? '0.7153' : '0.7485');
  rewardPopup.setAttribute('aria-label', art.alt);
  document.body.classList.add('reward-open');
  rewardPopup.showModal();
}));
function closeRewardPopup(){rewardPopup.close()}
document.querySelector('.reward-accept').addEventListener('click', closeRewardPopup);
document.querySelector('.reward-dismiss').addEventListener('click', closeRewardPopup);
rewardPopup.addEventListener('close',()=>document.body.classList.remove('reward-open'));
renderLotteryProgress();
renderDailyTasks();
saveLotteryChances();
collectFinishedJumpGames();
saveLotteryState();
