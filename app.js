const pages = [...document.querySelectorAll('[data-page]')];
const carousel = document.querySelector('#portfolio-carousel');
const track = document.querySelector('.carousel-track');
const slideNames = ['立ち絵', '動画イラスト', 'グッズイラスト'];
const dots = [...document.querySelectorAll('[data-slide]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentSlide = 1;
let position = 2;
let isMoving = false;
let motionTimer;
function updateCarouselLabels() {
  dots.forEach((dot, index) => {
    dot.setAttribute('aria-current', String(index === currentSlide));
  });
  document.getElementById('portfolio-caption').textContent = slideNames[currentSlide] + '（サンプル）';
  track.querySelectorAll('.portfolio-slide').forEach((slide, index) => {
    slide.setAttribute('aria-hidden', String(index !== currentSlide + 1));
  });
}
function placeTrack(animated = true) {
  if (!carousel || !carousel.clientWidth) return;
  track.classList.toggle('is-animated', animated && !reducedMotion);
  const slideWidth = track.firstElementChild.getBoundingClientRect().width;
  const gap = parseFloat(getComputedStyle(track).gap) || 0;
  const offset = (carousel.clientWidth - slideWidth) / 2 - position * (slideWidth + gap);
  track.style.transform = 'translate3d(' + offset + 'px,0,0)';
}
function finishMotion() {
  clearTimeout(motionTimer);
  if (position === 0) position = 3;
  if (position === 4) position = 1;
  placeTrack(false);
  isMoving = false;
}
function moveSlide(delta) {
  if (isMoving) return;
  isMoving = true;
  currentSlide = (currentSlide + delta + 3) % 3;
  position += delta;
  updateCarouselLabels();
  placeTrack(true);
  motionTimer = setTimeout(finishMotion, reducedMotion ? 0 : 550);
}
document.querySelector('.carousel-arrow.previous').addEventListener('click', () => moveSlide(-1));
document.querySelector('.carousel-arrow.next').addEventListener('click', () => moveSlide(1));
track.addEventListener('transitionend', event => {
  if (event.target === track && event.propertyName === 'transform') finishMotion();
});
dots.forEach(dot => dot.addEventListener('click', () => {
  if (isMoving) return;
  currentSlide = Number(dot.dataset.slide);
  position = currentSlide + 1;
  updateCarouselLabels();
  placeTrack(true);
}));
carousel.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveSlide(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
let pointerStart = null;
carousel.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' && !event.target.closest('button')) pointerStart = {x:event.clientX,y:event.clientY};
});
carousel.addEventListener('pointerup', event => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) moveSlide(dx > 0 ? -1 : 1);
});
carousel.addEventListener('pointercancel', () => { pointerStart = null; });
window.addEventListener('resize', () => { finishMotion(); });
function showPage() {
  const hash = location.hash.slice(1) || 'home';
  const target = pages.some(page => page.dataset.page === hash) ? hash : 'home';
  pages.forEach(page => { page.hidden = page.dataset.page !== target; });
  document.body.classList.toggle('is-home', target === 'home');
  document.querySelectorAll('nav a').forEach(link => {
    if (link.hash === '#' + target) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const titles = {home:'ホーム',terms:'規約',illustration:'イラスト',tuning:'調声',ust:'ust'};
  document.title = titles[target] + ' | MONOBILI COMMISSION';
  window.scrollTo({ top:0, behavior:'instant' });
  if (target === 'illustration') requestAnimationFrame(() => { finishMotion(); });
}
window.addEventListener('hashchange', showPage);
const formatMoney = value => '¥' + value.toLocaleString('ja-JP');
const clampCount = value => Math.max(0, Math.min(99, parseInt(value, 10) || 0));
const commonBackground = {none:0,simple:1000,design:2500,scene:4000,detailed:6000};
const illustrationRates = {
  standard: {
    base:3500, range:{face:2000,chest:3000,waist:3500,full:4500},
    style:{rough:500,line:2000}, color:{none:0,mono:1000,full:3000},
    expression:200,prop:200
  },
  sd: {
    base:2500, range:{face:1000,chest:1500,waist:2000,full:2500},
    style:{rough:500,line:1500}, color:{none:0,mono:500,full:2000},
    expression:500,prop:500
  }
};
function estimatePrice(selection) {
  const rates = illustrationRates[selection.bodyType];
  const parts = rates.range[selection.range];
  const style = rates.style[selection.style];
  const color = rates.color[selection.color];
  const basis = parts + style + color;
  const expression = rates.expression * clampCount(selection.expression);
  const prop = rates.prop * clampCount(selection.prop);
  const pose = basis * clampCount(selection.pose);
  // Divide by 1.5 and round only the combined outfit amount up to ¥100.
  const outfit = Math.ceil(basis * clampCount(selection.outfit) / 150) * 100;
  const background = commonBackground[selection.bg];
  const items = {base:rates.base,parts,style,color,expression,prop,pose,outfit,background};
  return {...items,total:Object.values(items).reduce((sum,price) => sum + price,0),minimum:selection.bg === 'detailed'};
}
const form = document.getElementById('estimate-form');
function updateEstimate() {
  const selected = name => form.querySelector('input[name="' + name + '"]:checked').value;
  const selection = {
    bodyType:selected('bodyType'), range:selected('range'), style:selected('style'),
    color:selected('color'), bg:selected('bg'),
    ...Object.fromEntries(['expression','prop','pose','outfit'].map(name => [name,document.getElementById(name).value]))
  };
  const result = estimatePrice(selection);
  document.getElementById('total').textContent = formatMoney(result.total) + (result.minimum ? '〜' : '');
  document.getElementById('mono-label').textContent = selection.bodyType === 'sd' ? 'モノクロ（単色塗り含む）' : 'モノクロ';
  const labels = {base:'基本料金',parts:'描画範囲',style:'仕上げ',color:'着色',expression:'表情差分',prop:'小物差分',pose:'ポーズ差分',outfit:'衣装差分',background:'背景'};
  document.getElementById('estimate-breakdown').innerHTML = Object.entries(labels).map(([key,label]) =>
    '<div><dt>' + label + '</dt><dd>' + formatMoney(result[key]) + (key === 'background' && result.minimum ? '〜' : '') + '</dd></div>'
  ).join('');
}
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', updateEstimate);
form.addEventListener('change', event => {
  if (event.target.type === 'number') event.target.value = clampCount(event.target.value);
  updateEstimate();
});
updateCarouselLabels();
showPage();
updateEstimate();
