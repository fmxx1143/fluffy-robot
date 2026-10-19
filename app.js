/* ============ 广州早茶漫游指南 · H5 交互 ============ */
(function(){
  'use strict';

  var app = document.getElementById('app');
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  var pager = document.getElementById('pager');
  var cur = 0;

  /* ---------- 翻页指示 ---------- */
  pages.forEach(function(_,i){
    var d = document.createElement('i');
    if(i===0) d.className='on';
    pager.appendChild(d);
  });
  function updatePager(){
    Array.prototype.forEach.call(pager.children,function(d,i){ d.className = i===cur?'on':''; });
  }

  /* ---------- 当前页判定 ---------- */
  function onScroll(){
    var h = app.clientHeight, idx = Math.round(app.scrollTop/h);
    if(idx!==cur){ cur=idx; updatePager(); onPageEnter(cur); }
  }
  app.addEventListener('scroll', onScroll, {passive:true});

  /* ---------- 进入页面触发动画 ---------- */
  function onPageEnter(i){
    var p = pages[i]; if(!p) return;
    /* P11 价格条重启动画 */
    if(p.classList.contains('page-price')){
      var bars = p.querySelectorAll('.pb-bar i');
      bars.forEach(function(b){ b.style.animation='none'; b.offsetHeight; b.style.animation=''; });
    }
    /* P10/P12 视差 */
    applyParallax(i);
  }

  /* ---------- 陀螺仪 / 鼠标 视差 ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('.parallax, .page-city .city-bg, .page-street .street-bg'));
  function applyParallax(idx){
    parallaxEls.forEach(function(el){ el.style.transform='translate3d(0,0,0)'; });
  }
  function moveParallax(x,y){
    parallaxEls.forEach(function(el){
      var d = parseFloat(el.getAttribute('data-depth'))||0.04;
      var tx = (x*2-1)*30*d*10, ty = (y*2-1)*30*d*10;
      el.style.transform='translate3d('+tx+'px,'+ty+'px,0)';
    });
  }
  /* 陀螺仪 */
  function enableGyro(){
    if(!window.DeviceOrientationEvent) return;
    window.addEventListener('deviceorientation', function(e){
      var x = Math.max(-1,Math.min(1, (e.gamma||0)/30));
      var y = Math.max(-1,Math.min(1, (e.beta||0)/60));
      moveParallax(x+0.5, y+0.5);
    });
  }
  enableGyro();
  /* 鼠标（PC 预览） */
  document.addEventListener('mousemove', function(e){
    moveParallax(e.clientX/window.innerWidth, e.clientY/window.innerHeight);
  });

  /* ==================== P2 推门：拖拽开门 ==================== */
  var doorLeft = document.querySelector('.door-left');
  var doorRight = document.querySelector('.door-right');
  var doorScene = document.querySelector('.door-scene');
  var doorOpened = false;
  if(doorScene){
    var dragY=0, startY=0, dragging=false;
    function setDoor(p){
      p = Math.max(0,Math.min(1,p));
      doorLeft.style.transform = 'rotateY('+(-p*105)+'deg)';
      doorRight.style.transform = 'rotateY('+(p*105)+'deg)';
      if(p>0.6 && !doorOpened){
        doorOpened=true;
        setTimeout(function(){ go(3); }, 420);
      }
    }
    doorScene.addEventListener('touchstart', function(e){ dragging=true; startY=e.touches[0].clientY; dragY=0; }, {passive:true});
    doorScene.addEventListener('touchmove', function(e){
      if(!dragging) return;
      var dy = startY - e.touches[0].clientY;
      setDoor(Math.max(0, dy/180));
    }, {passive:true});
    doorScene.addEventListener('touchend', function(){ dragging=false; if(!doorOpened) setDoor(0); });
    /* 鼠标 */
    doorScene.addEventListener('mousedown', function(e){ dragging=true; startY=e.clientY; });
    document.addEventListener('mousemove', function(e){
      if(!dragging) return;
      var dy = startY - e.clientY;
      setDoor(Math.max(0, dy/180));
    });
    document.addEventListener('mouseup', function(){ dragging=false; if(!doorOpened) setDoor(0); });
    /* 兜底点击 */
    doorScene.addEventListener('click', function(){ if(!doorOpened){ doorOpened=true; setDoor(1); setTimeout(function(){go(3);},500);} });
  }

  /* ==================== P3 时间线：滑动横轴 ==================== */
  var tlTrack = document.getElementById('timelineTrack');
  if(tlTrack){
    var tlRect, tlProg = document.getElementById('timelineProgress');
    var tlTime = document.getElementById('tlTime'), tlDesc = document.getElementById('tlDesc');
    var tlData = {
      '5:00':{d:'烧水候位，伙计把茶壶洗好、蒸笼摆齐，等第一位街坊推门。'},
      '7:00':{d:'虾饺烧卖落单，一盅普洱滚水冲开，是老广最踏实的早餐。'},
      '9:00':{d:'街坊倾计，报纸摊开，一壶茶能坐到午饭。'},
      '11:00':{d:'翻台依旧，点心车推过走廊，喊一嗓「刚出笼」。'},
      '14:00':{d:'下午茶点，蛋挞与马拉糕配杯奶茶，午后的甜。'},
      '17:00':{d:'夜茶开锣，凤爪排骨与炒牛河，茶楼一天最热闹。'},
      '20:00':{d:'茶淡人散，伙计抹台收档，明日再来。'}
    };
    function setTl(pct){
      pct = Math.max(0,Math.min(100,pct));
      tlProg.style.width = pct+'%';
      var nodes = tlTrack.querySelectorAll('.tl-node');
      nodes.forEach(function(n){
        var x = parseFloat(n.getAttribute('data-x'));
        n.style.opacity = (Math.abs(x-pct)<14) ? '1' : '0.45';
      });
      var t = ['5:00','7:00','9:00','11:00','14:00','17:00','20:00'];
      var key = t[Math.round(pct/100*(t.length-1))];
      tlTime.textContent = key; tlDesc.textContent = tlData[key].d;
    }
    tlTrack.addEventListener('touchmove', function(e){
      e.preventDefault();
      var r = tlTrack.getBoundingClientRect();
      setTl((e.touches[0].clientX - r.left)/r.width*100);
    }, {passive:false});
    tlTrack.addEventListener('click', function(e){
      var r = tlTrack.getBoundingClientRect();
      setTl((e.clientX - r.left)/r.width*100);
    });
    setTl(16);
  }

  /* ==================== P4 一盅两件：点击弹层 ==================== */
  var modal = document.getElementById('modal');
  var modalTitle = document.getElementById('modalTitle');
  var modalDesc = document.getElementById('modalDesc');
  var modalEmoji = document.getElementById('modalEmoji');
  document.querySelectorAll('.ds-card').forEach(function(card){
    card.addEventListener('click', function(){
      modalEmoji.textContent = card.querySelector('.ds-emoji').textContent;
      modalTitle.textContent = card.getAttribute('data-name');
      modalDesc.textContent = card.getAttribute('data-desc');
      modal.classList.add('show');
      playPop();
    });
  });
  document.getElementById('modalClose').addEventListener('click', function(){ modal.classList.remove('show'); });
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.classList.remove('show'); });

  /* ==================== P5 点单：点击计数 ==================== */
  var odCount = document.getElementById('odCount');
  var odTotal = document.getElementById('odTotal');
  var odSum = 0, odNum = 0;
  document.querySelectorAll('.od-item').forEach(function(item){
    item.addEventListener('click', function(){
      var p = parseInt(item.getAttribute('data-price'),10);
      if(item.classList.contains('on')){
        item.classList.remove('on');
        item.querySelector('.od-btn').textContent='＋';
        odSum-=p; odNum--;
      } else {
        item.classList.add('on');
        item.querySelector('.od-btn').textContent='✓';
        odSum+=p; odNum++;
        playPop();
      }
      odCount.textContent = odNum;
      odTotal.textContent = '¥'+odSum;
    });
  });

  /* ==================== P6 揭盖：长按 ==================== */
  var brewLid = document.getElementById('brewLid');
  var brewSteam = document.getElementById('brewSteam');
  var brewProgress = document.getElementById('brewProgress');
  var brewTip = document.getElementById('brewTip');
  var pressTimer=null, pressing=false, pressProg=0, brewDone=false;
  function startPress(){
    if(brewDone) return;
    pressing=true; pressProg=0;
    pressTimer = setInterval(function(){
      pressProg += 3;
      brewProgress.style.width = Math.min(100,pressProg)+'%';
      brewLid.style.transform = 'translateY('+(-pressProg*0.9)+'px) rotate('+(-pressProg*0.4)+'deg)';
      if(pressProg>=100){ finishBrew(); }
    }, 30);
  }
  function endPress(){
    clearInterval(pressTimer);
    if(!brewDone){
      pressing=false;
      brewProgress.style.width='0%';
      brewLid.style.transform='';
    }
  }
  function finishBrew(){
    clearInterval(pressTimer); pressing=false; brewDone=true;
    brewSteam.style.opacity='1';
    brewTip.textContent='茶已冲开，闻到了吗？';
    playPop();
    setTimeout(function(){ if(brewDone){ go(7); } }, 900);
  }
  if(brewLid){
    brewLid.addEventListener('touchstart', function(e){ e.preventDefault(); startPress(); }, {passive:false});
    brewLid.addEventListener('touchend', endPress);
    brewLid.addEventListener('mousedown', function(e){ e.preventDefault(); startPress(); });
    document.addEventListener('mouseup', endPress);
  }

  /* ==================== P7 老茶客：点击切换 ==================== */
  var ppQuote = document.getElementById('ppQuote');
  document.querySelectorAll('.pp-avatar').forEach(function(av){
    av.addEventListener('click', function(){
      document.querySelectorAll('.pp-avatar').forEach(function(a){ a.classList.remove('active'); });
      av.classList.add('active');
      ppQuote.textContent = av.getAttribute('data-quote');
      playPop();
    });
  });

  /* ==================== P8 图鉴：滑动 ==================== */
  var albumTrack = document.getElementById('albumTrack');
  if(albumTrack){
    var abWrap = document.querySelector('.album-wrap');
    var abDots = document.getElementById('albumDots');
    var abStartX=0, abCur=0, abIndex=0, abW=0, abDrag=false;
    function setAlbum(i){
      abW = abWrap.clientWidth;
      abIndex = Math.max(0,Math.min(2,i));
      albumTrack.style.transform = 'translate3d('+(-abIndex*abW)+'px,0,0)';
      Array.prototype.forEach.call(abDots.children, function(d,k){ d.className = k===abIndex?'on':''; });
    }
    albumTrack.addEventListener('touchstart', function(e){ abDrag=true; abStartX=e.touches[0].clientX; abCur=abIndex; }, {passive:true});
    albumTrack.addEventListener('touchmove', function(e){
      if(!abDrag) return;
      var dx = e.touches[0].clientX - abStartX;
      abW = abWrap.clientWidth;
      albumTrack.style.transform = 'translate3d('+(-abCur*abW+dx)+'px,0,0)';
    }, {passive:true});
    albumTrack.addEventListener('touchend', function(e){
      abDrag=false;
      var dx = (e.changedTouches?e.changedTouches[0].clientX:0) - abStartX;
      var next = abCur - (dx>40?1:dx<-40?-1:0);
      setAlbum(next);
    });
    window.addEventListener('resize', function(){ setAlbum(abIndex); });
    setAlbum(0);
  }

  /* ==================== P9 规矩：点击展开 ==================== */
  document.querySelectorAll('.rl-item').forEach(function(rl){
    rl.addEventListener('click', function(){
      var open = rl.classList.contains('show');
      document.querySelectorAll('.rl-item').forEach(function(r){ r.classList.remove('show'); });
      if(!open){ rl.classList.add('show'); playPop(); }
    });
  });

  /* ==================== P13 盖章 ==================== */
  var stampMark = document.getElementById('stampMark');
  var stampPress = document.getElementById('stampPress');
  var stampDate = document.getElementById('stampDate');
  var now = new Date();
  stampDate.textContent = now.getFullYear()+'.'+(now.getMonth()+1);
  stampPress.addEventListener('click', function(){
    stampMark.classList.add('done');
    stampPress.classList.add('hide');
    playPop();
    /* 盖章后自动前进 */
    setTimeout(function(){ go(14); }, 1100);
  });

  /* ==================== P15 分享卡片 ==================== */
  var scBtn = document.getElementById('scBtn');
  var scInput = document.getElementById('scInput');
  var scName = document.getElementById('scName');
  var scStamp = document.getElementById('scStamp');
  var scCard = document.getElementById('shareCard');
  var stamps = ['广','茶','叹','一盅两件','粤'];
  var stampIdx = 0;
  function genCard(){
    var name = scInput.value.trim() || '你的名字';
    scName.textContent = name;
    var d = new Date();
    document.getElementById('scDate').textContent = d.getFullYear()+'.'+(d.getMonth()+1)+'.'+(d.getDate()<10?'0':'')+d.getDate();
    scStamp.textContent = stamps[stampIdx % stamps.length];
    stampIdx++;
    scCard.style.transform='scale(.96)';
    setTimeout(function(){ scCard.style.transform=''; },160);
    playPop();
  }
  scBtn.addEventListener('click', genCard);
  /* 简易保存：转为图片（依赖 canvas，失败则提示截图） */
  document.getElementById('scDown').addEventListener('click', function(){
    if(window.html2canvas){
      html2canvas(scCard).then(function(c){
        var a = document.createElement('a');
        a.download='广州早茶漫游指南.png';
        a.href=c.toDataURL('image/png');
        a.click();
      });
    } else {
      alert('已为卡片生成名称，可用手机截图保存这张卡片～');
    }
  });

  /* ---------- 翻页 ---------- */
  function go(i){
    i = Math.max(0, Math.min(pages.length-1, i));
    app.scrollTo({top: i*app.clientHeight, behavior:'smooth'});
  }
  /* 滚轮 / 键盘 */
  var wheelLock=false;
  window.addEventListener('wheel', function(e){
    if(wheelLock) return;
    wheelLock=true;
    go(cur + (e.deltaY>0?1:-1));
    setTimeout(function(){ wheelLock=false; }, 700);
  }, {passive:true});
  document.addEventListener('keydown', function(e){
    if(e.key==='ArrowDown'||e.key==='PageDown') go(cur+1);
    if(e.key==='ArrowUp'||e.key==='PageUp') go(cur-1);
  });

  /* ---------- WebAudio 合成音效（揭盖/点击） ---------- */
  var AC = window.AudioContext || window.webkitAudioContext;
  function playPop(){
    if(!AC) return;
    try{
      var ctx = playPop._ctx || (playPop._ctx = new AC());
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(700, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime+0.06);
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.14);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime+0.16);
    }catch(e){}
  }

  /* 初始定位 */
  updatePager();
})();
