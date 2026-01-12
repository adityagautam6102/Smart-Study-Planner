// Rotating quotes and fun facts for landing page
const landingQuotes = [
  "Small consistent steps beat occasional huge leaps — study smarter, not harder.",
  "Focus on progress, not perfection. One page at a time.",
  "Teach what you learn; it's the fastest way to master it.",
  "Short, focused study beats long, distracted sessions.",
  "Break down big goals into tiny daily wins."
];

const funFacts = [
  {title: "The 10-Min Boost", text: "A 10-minute review after class can increase retention significantly."},
  {title: "Spacing Works", text: "Studying in short sessions spaced over days helps memory more than cramming."},
  {title: "Active Recall", text: "Testing yourself is one of the most powerful study techniques."},
  {title: "Exercise Helps", text: "A quick walk boosts focus and memory formation."},
  {title: "Sleep Matters", text: "Sleep after studying helps consolidate memories."},
  {title: "Teach to Learn", text: "Explaining concepts aloud improves understanding and retention."}
];

function rotateQuote() {
  const el = document.getElementById('mainQuote');
  const meta = document.querySelector('.quote-meta');
  if (!el) return;
  let i = Math.floor(Math.random() * landingQuotes.length);
  el.textContent = landingQuotes[i];
  meta.textContent = `— Tip ${i + 1}`;
}

function populateFunFacts() {
  const grid = document.getElementById('factsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  // shuffle
  const shuffled = funFacts.sort(() => 0.5 - Math.random()).slice(0, 4);
  shuffled.forEach(f => {
    const card = document.createElement('div');
    card.className = 'fact-card';
    card.innerHTML = `<h3>${f.title}</h3><p>${f.text}</p>`;
    grid.appendChild(card);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  rotateQuote();
  populateFunFacts();
  setInterval(rotateQuote, 7000);
});
