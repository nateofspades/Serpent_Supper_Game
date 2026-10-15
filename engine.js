// Pure game rules, independent of rendering and browser APIs.
export class Engine {
  constructor({ size = 24, random = Math.random } = {}) {
    this.size = size;
    this.random = random;
    this.reset();
  }
  reset() {
    const center = Math.floor(this.size / 2);
    this.snake = [0, 1, 2].map((offset) => ({ x: center - offset, y: center }));
    this.direction = { x: 1, y: 0 };
    this.turns = [];
    this.status = "ready";
    this.score = 0;
    this.spawnFood();
  }
  get interval() {
    return Math.max(65, 155 - (this.score / 10) * 4);
  }
  spawnFood() {
    const occupied = new Set(this.snake.map((cell) => `${cell.x},${cell.y}`));
    const free = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!occupied.has(`${x},${y}`)) free.push({ x, y });
      }
    }
    this.food = free[Math.floor(this.random() * free.length)] ?? null;
  }
  start() {
    if (this.status === "ready") this.status = "running";
  }
  restart() {
    this.reset();
    this.start();
  }
  togglePause() {
    if (this.status === "running") this.status = "paused";
    else if (this.status === "paused") this.status = "running";
  }
  turn(name) {
    const next = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    }[name];
    if (!next || this.status !== "running" || this.turns.length >= 2)
      return false;
    const last = this.turns.at(-1) ?? this.direction;
    if (next.x === -last.x && next.y === -last.y) return false;
    if (next.x === last.x && next.y === last.y) return false;
    this.turns.push(next);
    return true;
  }
  tick() {
    if (this.status !== "running") return;
    this.direction = this.turns.shift() ?? this.direction;
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y,
    };
    const eating =
      this.food && head.x === this.food.x && head.y === this.food.y;
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= this.size ||
      head.y >= this.size ||
      body.some((cell) => cell.x === head.x && cell.y === head.y)
    ) {
      this.status = "over";
      return "lose";
    }
    this.snake.unshift(head);
    if (eating) {
      this.score += 10;
      this.spawnFood();
      if (!this.food) {
        this.status = "won";
        return "win";
      }
      return "eat";
    }
    this.snake.pop();
    return "move";
  }
}
