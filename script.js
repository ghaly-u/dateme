const invitation = document.querySelector('#invitation');
const reveal = document.querySelector('#reveal');
const yesButton = document.querySelector('#yes-button');
const noButton = document.querySelector('#no-button');
const noStaticButton = document.querySelector('#no-static-button');
const photo = document.querySelector('#date-photo');
const photoStatus = document.querySelector('#photo-status');
const noSlot = document.querySelector('.no-slot');
let escapeUntil = 0;
let moveCount = 0;
const defaultPhoto = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=85';

// Google Forms Configuration - REMPLACE FORM_ID ET LES entry_IDs
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScGfSLGoWAYIDY3xQ_rNy_QOxx_-Y1sV3i0Yv_QmY0IIsVf3A/formResponse';
const FORM_FIELDS = {
  'button': 'entry_503783214',      // Change entry_BUTTON_ID par l'ID du champ
  'timestamp': 'entry_925729964', // Change entry_TIMESTAMP_ID par l'ID du champ
};

// Fonction pour envoyer les clics à Google Forms
function trackClick(buttonName) {
  try {
    const formData = new FormData();
    formData.append(FORM_FIELDS.button, buttonName);
    formData.append(FORM_FIELDS.timestamp, new Date().toISOString());
    
    // Envoyer sans attendre la réponse (pour ne pas bloquer l'interface)
    fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    }).catch(e => console.log('Google Forms:', e));
  } catch (e) {
    console.log('Erreur tracking:', e);
  }
}

photo.addEventListener('error', () => {
  if (photo.src !== defaultPhoto) {
    photo.src = defaultPhoto;
    photo.alt = 'A bouquet of pink flowers';
  } else {
    photoStatus.textContent = 'The photo could not load.';
  }
});

try {
  const savedPhoto = localStorage.getItem('date-photo');
  if (savedPhoto) {
    photo.src = savedPhoto;
    photo.alt = 'A photo chosen just for you';
  }
} catch {}

function resetNoButton() {
  noButton.style.transform = '';
  noStaticButton.hidden = true;
  escapeUntil = 0;
  moveCount = 0;
}

function escapeNo(event) {
  if (event.cancelable) event.preventDefault();
  if (invitation.hidden || performance.now() < escapeUntil) return;
  const bounds = noButton.getBoundingClientRect();
  const origin = noSlot.getBoundingClientRect();
  const pointerX = event.clientX;
  const pointerY = event.clientY;
  const margin = 16;
  const maxLeft = Math.max(margin, document.documentElement.clientWidth - bounds.width - margin);
  const maxTop = Math.max(margin, window.innerHeight - bounds.height - margin);
  const obstacles = [yesButton, ...invitation.querySelectorAll('h1, p')]
    .map(element => element.getBoundingClientRect());
  let bestPosition = null;
  let bestDistance = -1;

  for (const horizontal of [-1, 0, 1]) {
    for (const vertical of [-1, 0, 1]) {
      if (horizontal === 0 && vertical === 0) continue;
      const left = Math.min(maxLeft, Math.max(margin, bounds.left + horizontal * (bounds.width + 64)));
      const top = Math.min(maxTop, Math.max(margin, bounds.top + vertical * (bounds.height + 64)));
      if (Math.hypot(left - bounds.left, top - bounds.top) < 60) continue;
      const overlaps = obstacles.some(obstacle =>
        left < obstacle.right + 12 && left + bounds.width > obstacle.left - 12 &&
        top < obstacle.bottom + 12 && top + bounds.height > obstacle.top - 12
      );
      if (overlaps) continue;
      const distance = Math.hypot(left + bounds.width / 2 - pointerX, top + bounds.height / 2 - pointerY);
      const score = distance - Math.abs(top - bounds.top) * 0.5;
      if (score > bestDistance) {
        bestDistance = score;
        bestPosition = { left, top };
      }
    }
  }

  if (!bestPosition) return;
  escapeUntil = performance.now() + 260;
  noButton.style.transform = `translate(${bestPosition.left - origin.left}px, ${bestPosition.top - origin.top}px)`;
  
  moveCount++;
  if (moveCount === 7) {
    noStaticButton.hidden = false;
  }
}

document.addEventListener('pointermove', event => {
  if (invitation.hidden || event.pointerType === 'touch') return;
  const bounds = noButton.getBoundingClientRect();
  const distanceX = Math.max(bounds.left - event.clientX, 0, event.clientX - bounds.right);
  const distanceY = Math.max(bounds.top - event.clientY, 0, event.clientY - bounds.bottom);
  if (Math.hypot(distanceX, distanceY) < 64) escapeNo(event);
});
noButton.addEventListener('pointerenter', escapeNo);
noButton.addEventListener('pointerdown', escapeNo);
noButton.addEventListener('click', escapeNo);
window.addEventListener('resize', resetNoButton);

noStaticButton.addEventListener('click', () => {
  photoStatus.innerHTML = '<img src="no_signal.png" alt="No signal image" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 9999; margin: 0;">';
});

yesButton.addEventListener('click', () => {
  invitation.hidden = true;
  reveal.hidden = false;
  photoStatus.textContent = '';
  document.querySelector('#reveal-title').focus({ preventScroll: true });
});

document.querySelector('#final-yes-button').addEventListener('click', () => {
  trackClick('Final Yes');
  photoStatus.innerHTML = 'Hmida never reached this stage and did not code the next part; please contact the administrator for further instructions.<br><img src="image.png" alt="Success image" style="max-width: 100%; height: auto; display: block; margin: 20px auto;">';
});

document.querySelector('#reset-button').addEventListener('click', () => {
  reveal.hidden = true;
  invitation.hidden = false;
  photoStatus.innerHTML = '';
  resetNoButton();
  yesButton.focus({ preventScroll: true });
});
