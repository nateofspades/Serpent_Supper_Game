import { test } from "vitest";
import assert from "node:assert/strict";

// Dynamic import lets a missing implementation report a clear feature failure.
let Engine;
try {
  ({ Engine } = await import("../engine.js"));
} catch {}
test("a new game starts ready; start and ticks move a three-cell snake right", () => {
  assert.ok(Engine, "Engine must be implemented");
  const game = new Engine();
  assert.equal(game.status, "ready");
  game.start();
  const head = { ...game.snake[0] };
  game.tick();
  assert.deepEqual(game.snake[0], { x: head.x + 1, y: head.y });
  assert.equal(game.snake.length, 3);
});
test("eating grows the snake, scores ten points, speeds up and spawns only in free cells", () => {
  const game = new Engine({ random: () => 0 });
  game.start();
  const initial = game.interval;
  for (let i = 0; i < 8; i++) {
    game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
    assert.equal(game.tick(), "eat");
    assert.equal(game.score, (i + 1) * 10);
    assert.equal(game.snake.length, i + 4);
    assert.ok(
      !game.snake.some(
        (cell) => cell.x === game.food.x && cell.y === game.food.y,
      ),
    );
  }
  assert.ok(game.interval < initial);
  assert.ok(game.interval >= 65);
});
test("wall and self collisions end play, but entering the departing tail is legal", () => {
  const wall = new Engine();
  wall.start();
  for (let i = 0; i < 24; i++) wall.tick();
  assert.equal(wall.status, "over");
  const game = new Engine();
  game.start();
  game.snake = [
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 4, y: 4 },
    { x: 3, y: 4 },
    { x: 2, y: 4 },
  ];
  assert.equal(game.tick(), "lose");
  assert.equal(game.status, "over");
  const tail = new Engine();
  tail.start();
  tail.snake = [
    { x: 3, y: 3 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 4, y: 3 },
  ];
  tail.food = { x: 0, y: 0 };
  assert.equal(tail.tick(), "move");
  assert.equal(tail.status, "running");
});
test("filling the final free cell wins without an infinite food-spawn loop", () => {
  const game = new Engine({ size: 3 });
  game.start();
  game.snake = [
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 1 },
    { x: 1, y: 1 },
  ];
  game.food = { x: 2, y: 0 };
  assert.equal(game.tick(), "win");
  assert.equal(game.status, "won");
  assert.equal(game.food, null);
});
test("turns are queued per tick and cannot reverse, including rapid opposite inputs", () => {
  const game = new Engine();
  game.start();
  assert.equal(game.turn("left"), false);
  assert.equal(game.turn("up"), true);
  assert.equal(game.turn("left"), true);
  assert.equal(game.turn("down"), false); // queue bounded to two turns
  game.tick();
  assert.deepEqual(game.direction, { x: 0, y: -1 });
  game.tick();
  assert.deepEqual(game.direction, { x: -1, y: 0 });
  assert.equal(game.turn("right"), false);
  assert.equal(game.turn("unknown"), false);
});
test("pause freezes movement, resume continues, and restart resets all play state", () => {
  const game = new Engine();
  game.start();
  game.turn("up");
  game.togglePause();
  const previous = structuredClone(game.snake);
  game.tick();
  assert.equal(game.status, "paused");
  assert.deepEqual(game.snake, previous);
  assert.equal(game.turn("down"), false);
  game.togglePause();
  game.tick();
  assert.notDeepEqual(game.snake, previous);
  game.score = 100;
  game.restart();
  assert.equal(game.score, 0);
  assert.equal(game.status, "running");
  assert.equal(game.snake.length, 3);
  assert.deepEqual(game.direction, { x: 1, y: 0 });
});
