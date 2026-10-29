// ============================================================
// NAVIGATION.JS: moving between pages (Welcome, Menu, Projects...)
// with a 3D "fly through" animation and a dissolve effect.
//
// Buttons with data-go="pageid" in index.html use this file.
// Forward: current page flies at you and breaks apart.
// Back:    current page sinks away and the previous one comes back.
// You normally don't need to edit this file.
// ============================================================

let currentPage = document.getElementById('welcome');
let zLayer = 1;        // keeps the newest page on top
let busy = false;      // stops double-clicks during an animation

const dmap = document.getElementById('dmap');     // the dissolve filter
const fx = document.getElementById('fx');          // cleared after the dissolve effect
const fxCtx = fx.getContext('2d');

// Smooth start-and-stop curve for animations
function ease(t) {
  return t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
}

// Runs fn(progress) from 0 to 1 over ms milliseconds, then calls done()
function run(ms, fn, done) {
  const t0 = performance.now();
  (function frame() {
    const k = Math.min(1, (performance.now() - t0) / ms);
    fn(k);
    if (k < 1) requestAnimationFrame(frame);
    else if (done) done();
  })();
}

// Makes a page look "broken up" (dissolving) while it moves
function dissolve(el, reverse) {
  el.style.filter = 'url(#dis)';
  run(950, k => dmap.setAttribute('scale', (reverse ? 1 - k : k) * 320), () => { el.style.filter = ''; });
  burst(reverse);
}

// Moves the floating objects out as the current page leaves.
function burst(reverse) {
  fx.width = innerWidth;
  fx.height = innerHeight;
  fxCtx.clearRect(0, 0, fx.width, fx.height);
  startBackgroundTransition(reverse);
}

// Switches to the page with this id. back = true plays the reverse animation.
function go(id, back) {
  const next = document.getElementById(id);
  if (next === currentPage || busy) return;
  busy = true;

  const old = currentPage;
  currentPage = next;

  old.classList.remove('set');
  next.classList.remove('set');
  next.style.display = 'block';
  zLayer += 2;
  next.style.transition = 'none';
  next.classList.remove('front', 'on');
  if (back) next.classList.add('front');
  void next.offsetWidth;               // forces the browser to apply the above
  next.style.transition = '';

  if (id === 'projects' && old.id !== 'project-detail') next.scrollTop = 0;

  if (!back) {
    old.style.zIndex = zLayer;
    next.style.zIndex = zLayer - 1;
    old.classList.remove('on');
    old.classList.add('front');
    dissolve(old, false);
  } else {
    next.style.zIndex = zLayer;
    old.style.zIndex = zLayer - 1;
    next.classList.remove('front');
    old.classList.remove('on');
    dissolve(next, true);
  }

  next.classList.add('on');
  setTimeout(() => {
    old.style.display = 'none';
    old.classList.remove('front');
    next.classList.add('set');
    busy = false;
  }, 1000);
}

// Connect every button that has data-go="..." to go()
document.querySelectorAll('[data-go]').forEach(btn =>
  btn.addEventListener('click', () => go(btn.dataset.go, btn.classList.contains('back')))
);
