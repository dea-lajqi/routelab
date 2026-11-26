/** Pure pathfinding algorithms. Importable in a browser and in Node tests. */

class MinHeap {
  constructor() { this.items = []; this.serial = 0; }
  push(node, priority) {
    const item = { node, priority, serial: this.serial++ };
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.compare(this.items[p], item) <= 0) break;
      this.items[i] = this.items[p];
      i = p;
    }
    this.items[i] = item;
  }
  pop() {
    const root = this.items[0];
    const end = this.items.pop();
    if (!this.items.length) return root;
    let i = 0;
    while (2 * i + 1 < this.items.length) {
      let child = 2 * i + 1;
      if (child + 1 < this.items.length && this.compare(this.items[child + 1], this.items[child]) < 0) child++;
      if (this.compare(end, this.items[child]) <= 0) break;
      this.items[i] = this.items[child];
      i = child;
    }
    this.items[i] = end;
    return root;
  }
  compare(a, b) { return a.priority - b.priority || a.serial - b.serial; }
  get size() { return this.items.length; }
}

function adjacent(index, rows, cols) {
  const r = Math.floor(index / cols), c = index % cols;
  const result = [];
  if (c < cols - 1) result.push(index + 1);
  if (r < rows - 1) result.push(index + cols);
  if (c > 0) result.push(index - 1);
  if (r > 0) result.push(index - cols);
  return result;
}

function enterCost(cell) { return cell.kind === 'weight' ? 5 : 1; }

function reconstruct(parent, start, goal) {
  if (start === goal) return [start];
  if (parent[goal] === -1) return [];
  const path = [];
  let current = goal;
  while (current !== -1) {
    path.push(current);
    if (current === start) break;
    current = parent[current];
  }
  return path.reverse();
}

/** @returns {{visitedOrder:number[], path:number[], steps:number|null, cost:number|null}} */
function runSearch(grid, rows, cols, start, goal, algorithm) {
  const n = rows * cols;
  if (grid.length !== n || ![start, goal].every(i => Number.isInteger(i) && i >= 0 && i < n)) {
    throw new Error('Invalid grid or endpoints');
  }
  if (!['bfs', 'dfs', 'dijkstra', 'astar'].includes(algorithm)) {
    throw new Error('Unknown algorithm');
  }
  const parent = Array(n).fill(-1);
  const visitedOrder = [];

  if (algorithm === 'bfs' || algorithm === 'dfs') {
    const frontier = [start];
    let head = 0;
    const seen = new Set([start]);
    while (algorithm === 'bfs' ? head < frontier.length : frontier.length > 0) {
      const current = algorithm === 'bfs' ? frontier[head++] : frontier.pop();
      visitedOrder.push(current);
      if (current === goal) break;
      const ns = adjacent(current, rows, cols);
      if (algorithm === 'dfs') ns.reverse();
      for (const next of ns) {
        if (grid[next].kind === 'wall' || seen.has(next)) continue;
        seen.add(next);
        parent[next] = current;
        frontier.push(next);
      }
    }
  } else {
    const distances = Array(n).fill(Infinity);
    const finalized = new Set();
    const frontier = new MinHeap();
    const heuristic = i => Math.abs(Math.floor(i / cols) - Math.floor(goal / cols)) + Math.abs(i % cols - goal % cols);
    distances[start] = 0;
    frontier.push(start, algorithm === 'astar' ? heuristic(start) : 0);
    while (frontier.size) {
      const { node: current } = frontier.pop();
      if (finalized.has(current)) continue;
      finalized.add(current);
      visitedOrder.push(current);
      if (current === goal) break;
      for (const next of adjacent(current, rows, cols)) {
        if (grid[next].kind === 'wall' || finalized.has(next)) continue;
        const tentative = distances[current] + enterCost(grid[next]);
        if (tentative < distances[next]) {
          distances[next] = tentative;
          parent[next] = current;
          frontier.push(next, tentative + (algorithm === 'astar' ? heuristic(next) : 0));
        }
      }
    }
  }

  const found = visitedOrder.includes(goal);
  const path = found ? reconstruct(parent, start, goal) : [];
  const cost = found ? path.slice(1).reduce((sum, i) => sum + enterCost(grid[i]), 0) : null;
  return { visitedOrder, path, steps: found ? path.length - 1 : null, cost };
}

if (typeof window !== "undefined") window.RouteLabAlgorithms = { runSearch };
if (typeof module !== "undefined" && module.exports) module.exports = { runSearch };
