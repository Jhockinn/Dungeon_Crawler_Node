function generateMaze(width, height, seed = null) {
    const mazeSeed = seed || Date.now().toString();

    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;

    const maze = Array(height).fill(null)
        .map(() => Array(width).fill(1));

    const stack = [];

    const start = { x: 1, y: 1 };
    maze[start.y][start.x] = 0;
    stack.push(start);

    const directions = [
        { dx: 0, dy: -2 },
        { dx: 2, dy: 0 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 }
    ];

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = [];

        for (const dir of directions) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;

            if (nx > 0 && nx < width - 1 &&
                ny > 0 && ny < height - 1 &&
                maze[ny][nx] === 1) {
                neighbors.push({ x: nx, y: ny, dx: dir.dx, dy: dir.dy });
            }
        }

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];

            const wallX = current.x + next.dx / 2;
            const wallY = current.y + next.dy / 2;
            maze[wallY][wallX] = 0;

            maze[next.y][next.x] = 0;

            stack.push({ x: next.x, y: next.y });
        } else {
            stack.pop();
        }
    }

    maze[1][0] = 0;
    maze[height - 2][width - 1] = 0;

    return {
        layout: maze,
        seed: mazeSeed,
        width,
        height
    };
}

module.exports = { generateMaze };
