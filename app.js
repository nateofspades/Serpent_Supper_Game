import { Engine } from "./engine.js";
import { MusicController } from "./music.js";

export const game = new Engine();
const $ = (id) => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");
let lastTick = performance.now();
// Storage is optional: private browsing must not break gameplay.
const storage = {
  get(key, fallback) {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* Session-only fallback. */
    }
  },
};
const storedBest = Number(storage.get("neon-snake-best", 0));
let best = Number.isFinite(storedBest) && storedBest >= 0 ? storedBest : 0;
export const music = new MusicController({
  AudioContext: window.AudioContext || window.webkitAudioContext,
  storage: {
    getItem: (key) => storage.get(key, null),
    setItem: (key, value) => storage.set(key, value),
  },
  getHidden: () => document.hidden,
});
function updateMusic() {
  $("music").setAttribute("aria-pressed", String(music.enabled));
  $("music").textContent = music.enabled ? "♫ Music on" : "♫ Music off";
}
$("music").addEventListener("click", async () => {
  await music.toggle();
  updateMusic();
});
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest?.("#music")) music.activate();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") music.activate();
});
document.addEventListener("visibilitychange", () => music.handleVisibility());
window.addEventListener("pageshow", () => music.handleInterruption());
updateMusic();

function updateUI() {
  if (game.score > best) {
    best = game.score;
    storage.set("neon-snake-best", best);
  }
  $("high-score").textContent = String(best).padStart(3, "0");
  $("score").textContent = String(game.score).padStart(3, "0");
  $("level").textContent = String(1 + Math.floor(game.score / 50)).padStart(
    2,
    "0",
  );
  const paused = game.status === "paused";
  $("pause").textContent = paused ? "▶ Resume" : "Ⅱ Pause";
  $("pause").disabled = !["running", "paused"].includes(game.status);
  const messages = {
    ready: "Ready to play",
    running: "In the zone",
    paused: "Taking a breather",
    over: "Round over",
    won: "Board complete",
  };
  $("status").textContent = messages[game.status];
  $("overlay").hidden = game.status === "running";
  if (game.status === "ready") return;
  $("overlay-kicker").textContent = paused
    ? "TAKE YOUR TIME"
    : game.status === "won"
      ? "EVERY LAST BITE"
      : "THERE’S ALWAYS ANOTHER ROUND";
  $("overlay-title").textContent = paused
    ? "Catch your breath."
    : game.status === "won"
      ? "You filled the board!"
      : "Game Over";
  $("overlay-message").textContent = paused
    ? "Your next bite can wait. Pick up right where you left off."
    : `Final score: ${game.score}. Ready to beat it?`;
  $("primary").textContent = paused ? "Resume" : "Play Again";
  $("overlay-hint").textContent = paused
    ? "SPACE TO RESUME"
    : "A FRESH START. A NEW HIGH SCORE.";
}

function draw() {
  const cell = canvas.width / game.size;
  ctx.fillStyle = "#0b130e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#b1f86c09";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= game.size; i++) {
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, canvas.height);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(canvas.width, i * cell);
  }
  ctx.stroke();
  if (game.food) {
    const x = (game.food.x + 0.5) * cell;
    const y = (game.food.y + 0.5) * cell;
    ctx.shadowColor = "#ff6369";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ff6369";
    ctx.beginPath();
    ctx.arc(x, y, cell * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffb4b7";
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, cell * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  // Draw tail first so the brighter head sits above the body.
  for (let i = game.snake.length - 1; i >= 0; i--) {
    const { x, y } = game.snake[i];
    ctx.fillStyle =
      i === 0 ? "#b1f86c" : `hsl(105 65% ${48 - Math.min(i, 30) * 0.5}%)`;
    ctx.shadowColor = "#91e05b";
    ctx.shadowBlur = i === 0 ? 14 : 0;
    ctx.beginPath();
    ctx.roundRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (i === 0) {
      const dx = game.direction.x,
        dy = game.direction.y;
      ctx.fillStyle = "#183018";
      for (const side of [-1, 1]) {
        const ex = (x + 0.5) * cell + dx * cell * 0.2 - dy * side * cell * 0.16;
        const ey = (y + 0.5) * cell + dy * cell * 0.2 + dx * side * cell * 0.16;
        ctx.beginPath();
        ctx.arc(ex, ey, cell * 0.055, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function resetTime() {
  lastTick = performance.now();
}
function pause() {
  game.togglePause();
  resetTime();
  updateUI();
}
function restart() {
  game.restart();
  resetTime();
  updateUI();
  draw();
}
$("primary").addEventListener("click", () => {
  if (game.status === "paused") pause();
  else if (game.status === "ready") {
    game.start();
    resetTime();
    updateUI();
  } else restart();
});
$("pause").addEventListener("click", pause);
$("restart").addEventListener("click", restart);
const controls = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};
document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const direction = controls[event.key] ?? controls[event.key.toLowerCase()];
  if (direction) {
    event.preventDefault();
    if (!event.repeat) game.turn(direction);
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) pause();
  }
});
document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => game.turn(button.dataset.direction));
});
function frame(now) {
  if (game.status === "running" && now - lastTick >= game.interval) {
    game.tick();
    lastTick = now;
    updateUI();
    draw();
  }
  requestAnimationFrame(frame);
}
updateUI();
draw();
requestAnimationFrame(frame);
