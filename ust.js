(() => {
  const carousel = document.getElementById('ust-carousel');
  const track = carousel.querySelector('.carousel-track');
  const slides = [...track.children];
  const dots = [...document.querySelectorAll('[data-ust-slide]')];
  const caption = document.getElementById('ust-caption');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0, position = 1, moving = false, timer, start = null;
  function place(animated = false) {
    if (!carousel.clientWidth) return;
    const width = slides[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    track.classList.toggle('is-animated', animated && !reduced);
    track.style.transform = `translate3d(${(carousel.clientWidth-width)/2-position*(width+gap)}px,0,0)`;
  }
  function labels() {
    dots.forEach((dot,i) => dot.setAttribute('aria-current', String(i === current)));
    slides.forEach((slide,i) => slide.setAttribute('aria-hidden', String(i !== position)));
    caption.textContent = `UST制作イメージ ${String(current+1).padStart(2,'0')}（仮画像）`;
  }
  function finish() {
    clearTimeout(timer);
    if (position === 0) position = 3;
    if (position === 4) position = 1;
    moving = false;place();labels();
  }
  function move(delta) {
    if (moving) return;
    moving = true;current = (current+delta+3)%3;position += delta;
    labels();place(true);timer = setTimeout(finish,reduced?0:550);
  }
  carousel.querySelector('.previous').addEventListener('click',() => move(-1));
  carousel.querySelector('.next').addEventListener('click',() => move(1));
  dots.forEach((dot,i) => dot.addEventListener('click',() => {
    if (moving) return;
    current=i;position=i+1;labels();place(true);
  }));
  track.addEventListener('transitionend',event => {
    if (event.target === track && event.propertyName === 'transform') finish();
  });
  carousel.addEventListener('keydown',event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();move(event.key === 'ArrowLeft'?-1:1);
  });
  carousel.addEventListener('pointerdown',event => {
    if (event.pointerType !== 'mouse' && !event.target.closest('button')) start={x:event.clientX,y:event.clientY};
  });
  carousel.addEventListener('pointerup',event => {
    if (!start) return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
    if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)) move(dx>0?-1:1);
  });
  carousel.addEventListener('pointercancel',() => {start=null;});
  window.addEventListener('resize',finish);
  window.addEventListener('hashchange',() => requestAnimationFrame(finish));
  labels();requestAnimationFrame(finish);
})();
