import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { runSearch } = require('../algorithms.js');
const plain = (rows, cols) => Array.from({ length: rows * cols }, () => ({ kind: 'empty' }));

test('BFS finds the fewest steps on an unweighted grid', () => {
  const grid = plain(4, 4);
  const result = runSearch(grid, 4, 4, 0, 15, 'bfs');
  assert.equal(result.steps, 6);
  assert.equal(result.cost, 6);
  assert.equal(result.path[0], 0);
  assert.equal(result.path.at(-1), 15);
});

test('Weighted routes: Dijkstra and A* avoid expensive squares', () => {
  const grid = plain(3, 5);
  for (const index of [6, 7, 8]) grid[index].kind = 'weight';
  const bfs = runSearch(grid, 3, 5, 5, 9, 'bfs');
  const d = runSearch(grid, 3, 5, 5, 9, 'dijkstra');
  const a = runSearch(grid, 3, 5, 5, 9, 'astar');
  assert.equal(bfs.steps, 4);
  assert.equal(bfs.cost, 16);
  assert.equal(d.cost, 6);
  assert.equal(a.cost, 6);
  assert.equal(d.steps, 6);
  assert.equal(a.steps, 6);
});

test('All algorithms report no path through a wall', () => {
  const grid = plain(3, 3);
  for (const index of [3, 4, 5]) grid[index].kind = 'wall';
  for (const algorithm of ['bfs', 'dfs', 'dijkstra', 'astar']) {
    const result = runSearch(grid, 3, 3, 0, 8, algorithm);
    assert.deepEqual(result.path, []);
    assert.equal(result.cost, null);
  }
});

test('Starting on goal gives zero distance', () => {
  for (const algorithm of ['bfs', 'dfs', 'dijkstra', 'astar']) {
    const result = runSearch(plain(2, 2), 2, 2, 0, 0, algorithm);
    assert.deepEqual(result.path, [0]);
    assert.equal(result.steps, 0);
    assert.equal(result.cost, 0);
  }
});

test('DFS returns a connected path', () => {
  const result = runSearch(plain(3, 3), 3, 3, 0, 8, 'dfs');
  assert.equal(result.path[0], 0);
  assert.equal(result.path.at(-1), 8);
  for (let i = 1; i < result.path.length; i++) {
    const p = result.path[i - 1], q = result.path[i];
    const dr = Math.abs(Math.floor(p / 3) - Math.floor(q / 3));
    const dc = Math.abs(p % 3 - q % 3);
    assert.equal(dr + dc, 1);
  }
});
