// ===========================
// VOYAGR — Travel Website JS
// ===========================

// ---- NAV SCROLL EFFECT ----
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 80) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// ---- HAMBURGER MENU ----
const hamburger = document.getElementById('hamburger');
hamburger.addEventListener('click', () => {
  const links = document.querySelector('.nav-links');
  if (links.style.display === 'flex') {
    links.style.display = 'none';
  } else {
    links.style.display = 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'fixed';
    links.style.top = '70px';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(253,250,244,0.98)';
    links.style.backdropFilter = 'blur(12px)';
    links.style.padding = '24px';
    links.style.gap = '20px';
    links.style.zIndex = '99';
    links.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
    links.querySelectorAll('a').forEach(a => {
      a.style.color = '#1A1208';
      a.style.fontSize = '1.1rem';
    });
  }
});

// Close menu on link click
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelector('.nav-links').style.display = 'none';
  });
});

// ---- INTERSECTION OBSERVER ANIMATIONS ----
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

// Add fade-in class to elements
const animTargets = [
  '.dest-card',
  '.exp-card',
  '.testi-card',
  '.gallery-grid img',
  '.section-header',
  '.contact-left',
  '.contact-form',
];

animTargets.forEach(selector => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${i * 0.1}s`;
    observer.observe(el);
  });
});

// ---- FORM SUBMISSION ----
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const success = document.getElementById('formSuccess');

  btn.textContent = 'Sending...';
  btn.disabled = true;

  setTimeout(() => {
    btn.style.display = 'none';
    success.style.display = 'block';
    e.target.reset();
  }, 1500);
}

// ---- SMOOTH SCROLL ----
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ---- DESTINATION CARD PARALLAX ----
document.querySelectorAll('.dest-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `scale(1.02) perspective(500px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s ease';
  });
});

// ---- SEARCH BAR INTERACTION ----
document.querySelectorAll('.search-field input').forEach(input => {
  input.addEventListener('focus', () => {
    input.closest('.search-bar').style.boxShadow = '0 40px 100px rgba(26,18,8,0.25), 0 0 0 3px rgba(200,151,42,0.2)';
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      input.closest('.search-bar').style.boxShadow = '';
    }, 200);
  });
});

document.querySelector('.search-btn').addEventListener('click', () => {
  const dest = document.querySelector('.search-field input').value;
  if (dest) {
    document.querySelector('#destinations').scrollIntoView({ behavior: 'smooth' });
  }
});

console.log('🌍 Voyagr — Travel Website Loaded');
