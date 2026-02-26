// ============================================================
// CHAINSENTINEL AI – MAIN JS UTILITIES
// ============================================================

// ---- Navbar scroll effect
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 20);
});

// ---- Intersection Observer for animate-fade-up
const fadeEls = document.querySelectorAll('.animate-fade-up');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; e.target.classList.remove('animate-fade-up'); } });
  }, { threshold: 0.1 });
  fadeEls.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(30px)'; el.style.transition = 'opacity 0.7s ease, transform 0.7s ease'; io.observe(el); });
}

// ---- Toast notification system
window.CS = window.CS || {};
CS.toast = function(msg, type = 'info', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { info: 'ℹ️', success: '✅', danger: '🚨', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(120%)'; t.style.transition = 'all 0.4s'; setTimeout(() => t.remove(), 400); }, duration);
};

// ---- Copy to clipboard helper
CS.copy = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = 'var(--accent-green)';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 2000);
  });
};

// ---- Number counter animation
CS.animateCount = function(el, target, duration = 1500, suffix = '') {
  const start = parseInt(el.textContent) || 0;
  const range = target - start;
  const startTime = performance.now();
  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + range * ease).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// ---- Mini line chart helper (Canvas)
CS.drawSparkline = function(canvas, data, color = '#00d4ff') {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const min = Math.min(...data), max = Math.max(...data);
  const scaleY = (v) => H - ((v - min) / (max - min + 1)) * (H - 8) - 4;
  const scaleX = (i) => (i / (data.length - 1)) * W;

  ctx.clearRect(0, 0, W, H);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color + '44'); grad.addColorStop(1, color + '00');
  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(scaleX(i), scaleY(v)) : ctx.lineTo(scaleX(i), scaleY(v)));
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath();
  data.forEach((v, i) => i === 0 ? ctx.moveTo(scaleX(i), scaleY(v)) : ctx.lineTo(scaleX(i), scaleY(v)));
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
};

// ---- Simulate AI typing effect
CS.typeText = function(el, text, speed = 18) {
  el.textContent = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.textContent = '▋'; cursor.style.animation = 'blink 1s infinite';
  el.appendChild(cursor);
  const interval = setInterval(() => {
    if (i < text.length) {
      cursor.insertAdjacentText('beforebegin', text[i++]);
    } else {
      clearInterval(interval);
      setTimeout(() => cursor.remove(), 600);
    }
  }, speed);
};

// ---- Format address
CS.shortAddr = (addr) => addr.length > 10 ? addr.slice(0, 6) + '…' + addr.slice(-4) : addr;

// ---- Random float
CS.rand = (min, max) => min + Math.random() * (max - min);

// ---- Random int
CS.randInt = (min, max) => Math.floor(CS.rand(min, max));

// ---- Generate random Ethereum-like address
CS.fakeAddr = () => '0x' + [...Array(40)].map(() => Math.floor(Math.random()*16).toString(16)).join('');

// ---- Progress bar animate
CS.animateProgress = function(barEl, pct) {
  barEl.style.width = '0%';
  setTimeout(() => { barEl.style.width = pct + '%'; }, 100);
};

// ---- Live clock
function updateClock() {
  const clockEls = document.querySelectorAll('.live-clock');
  const now = new Date();
  const str = now.toUTCString().replace('GMT', 'UTC');
  clockEls.forEach(el => el.textContent = str);
}
setInterval(updateClock, 1000);
updateClock();

// ---- Ripple effect on buttons
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,255,255,0.25);transform:scale(0);animation:ripple 0.5s linear;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;pointer-events:none;`;
    btn.style.position = 'relative'; btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});
// Add ripple keyframe
const style = document.createElement('style');
style.textContent = '@keyframes ripple { to { transform: scale(2); opacity: 0; } }';
document.head.appendChild(style);

console.log('%c🛡️ ChainSentinel AI — Prototype', 'color:#00d4ff;font-size:16px;font-weight:bold;');
console.log('%cAI-powered Web3 Security Intelligence Platform', 'color:#8fa3c0;');
