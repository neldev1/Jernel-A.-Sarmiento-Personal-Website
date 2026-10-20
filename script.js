// ---------- Theme toggle ----------
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ---------- Nav scroll state ----------
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ---------- Scroll progress bar ----------
const scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = pct + '%';
});

// ---------- Active section nav highlighting ----------
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    }
  });
}, { rootMargin: '-45% 0px -45% 0px' });
sections.forEach(sec => sectionObserver.observe(sec));

// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ---------- Halftone portrait and cursor-following eyes ----------
const portrait = document.getElementById('profilePortrait');
const portraitImage = portrait.querySelector('.profile-portrait-fallback');
const portraitCanvas = document.getElementById('profilePortraitCanvas');
const portraitContext = portraitCanvas.getContext('2d', { willReadFrequently: true });

function renderHalftonePortrait() {
  const width = 320;
  const height = 400;
  portraitCanvas.width = width;
  portraitCanvas.height = height;

  const cropWidth = portraitImage.naturalHeight * (width / height);
  const cropX = (portraitImage.naturalWidth - cropWidth) / 2;
  portraitContext.fillStyle = '#080808';
  portraitContext.fillRect(0, 0, width, height);
  portraitContext.drawImage(
    portraitImage,
    cropX, 0, cropWidth, portraitImage.naturalHeight,
    0, 0, width, height
  );

  const frame = portraitContext.getImageData(0, 0, width, height);
  const pixels = frame.data;
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  // Remove only near-white pixels connected to the photo edges.
  const isBackground = (index) => {
    const offset = index * 4;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    return Math.min(red, green, blue) > 205 &&
      Math.max(red, green, blue) - Math.min(red, green, blue) < 32;
  };
  const addEdge = (index) => {
    if (!visited[index] && isBackground(index)) {
      visited[index] = 1;
      queue[tail++] = index;
    }
  };
  for (let x = 0; x < width; x++) {
    addEdge(x);
    addEdge((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    addEdge(y * width);
    addEdge(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) addEdge(index - 1);
    if (x < width - 1) addEdge(index + 1);
    if (y > 0) addEdge(index - width);
    if (y < height - 1) addEdge(index + width);
  }

  const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const offset = index * 4;
      if (visited[index]) {
        pixels[offset + 3] = 0;
        continue;
      }
      const luminance = pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114;
      const threshold = (bayer[y % 4][x % 4] + 0.5) * 16;
      const shade = luminance > threshold ? 255 : 0;
      pixels[offset] = shade;
      pixels[offset + 1] = shade;
      pixels[offset + 2] = shade;
    }
  }

  portraitContext.putImageData(frame, 0, 0);
  portraitImage.hidden = true;
  portraitCanvas.hidden = false;
}

if (portraitImage.complete && portraitImage.naturalWidth) {
  renderHalftonePortrait();
} else {
  portraitImage.addEventListener('load', renderHalftonePortrait, { once: true });
}

window.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  const bounds = portrait.getBoundingClientRect();
  const horizontal = (event.clientX - (bounds.left + bounds.width / 2)) / (window.innerWidth / 2);
  const vertical = (event.clientY - (bounds.top + bounds.height * 0.35)) / (window.innerHeight / 2);
  portrait.style.setProperty('--eye-x', `${Math.max(-1, Math.min(1, horizontal)) * 4}px`);
  portrait.style.setProperty('--eye-y', `${Math.max(-1, Math.min(1, vertical)) * 3}px`);
});

window.addEventListener('pointerout', (event) => {
  if (!event.relatedTarget) {
    portrait.style.setProperty('--eye-x', '0px');
    portrait.style.setProperty('--eye-y', '0px');
  }
});

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => observer.observe(el));

// ---------- Footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();
