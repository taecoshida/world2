// ─── Artificial Life — Rendering & UI ────────────────────────────
(() => {
    'use strict';

    // ─── Canvas Setup ─────────────────────────────────────────────
    const canvas = document.getElementById('world-canvas');
    const ctx = canvas.getContext('2d');
    const graphCanvas = document.getElementById('graph-canvas');
    const graphCtx = graphCanvas.getContext('2d');

    const TICK_INTERVAL = 1000 / 30; // 30 ticks/sec
    let lastTickTime = 0;
    let frameCount = 0;
    let fps = 0;
    let lastFpsTime = performance.now();
    let brushType = 'herbivore';

    function resizeCanvas() {
        const container = document.getElementById('canvas-container');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        graphCanvas.width = graphCanvas.parentElement.clientWidth - 32;
        graphCanvas.height = 140;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ─── Initialize simulation ───────────────────────────────────
    ALife.init();

    // ─── Main Loop ────────────────────────────────────────────────
    const TYPE_COLORS = {
        plant: { base: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' },
        herbivore: { base: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)' },
        predator: { base: '#ef4444', glow: 'rgba(239, 68, 68, 0.35)' },
    };

    function render(now) {
        requestAnimationFrame(render);

        // FPS counter
        frameCount++;
        if (now - lastFpsTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsTime = now;
            document.getElementById('fps-value').textContent = fps;
        }

        // Tick simulation at fixed rate
        if (now - lastTickTime >= TICK_INTERVAL) {
            lastTickTime = now;
            ALife.update();
            updateStats();
        }

        // ─── Draw ─────────────────────────────────────────────────
        const scaleX = canvas.width / ALife.WORLD.width;
        const scaleY = canvas.height / ALife.WORLD.height;
        const entities = ALife.entities();

        // Trail fade
        ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const e of entities) {
            const x = e.x * scaleX;
            const y = e.y * scaleY;
            const color = TYPE_COLORS[e.type];

            if (e.type === 'plant') {
                const size = 2 + Math.min(e.energy / 0.3, 2);
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = color.base;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x, y, size + 3, 0, Math.PI * 2);
                ctx.fillStyle = color.glow;
                ctx.fill();
            } else {
                const speed = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
                const angle = Math.atan2(e.vy, e.vx);
                const maxE = e.type === 'herbivore' ? 80 : 100;
                const energyRatio = Math.min(e.energy / maxE, 1);
                const size = e.type === 'herbivore' ? 4 : 5.5;

                // Glow
                const glowSize = size + 6 + speed * 2;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
                gradient.addColorStop(0, color.glow);
                gradient.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(x, y, glowSize, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Body
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);

                const hue = e.hue ?? (e.type === 'herbivore' ? 210 : 0);
                const sat = 70 + energyRatio * 20;
                const lit = 45 + energyRatio * 15;
                ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;

                ctx.beginPath();
                ctx.moveTo(size * 1.5, 0);
                ctx.quadraticCurveTo(0, -size, -size, 0);
                ctx.quadraticCurveTo(0, size, size * 1.5, 0);
                ctx.fill();

                // Eye
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.beginPath();
                ctx.arc(size * 0.4, 0, 1.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                // Energy bar
                const barWidth = 12;
                const barHeight = 2;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(x - barWidth / 2, y - size - 6, barWidth, barHeight);
                ctx.fillStyle = energyRatio > 0.3 ? color.base : '#f59e0b';
                ctx.fillRect(x - barWidth / 2, y - size - 6, barWidth * energyRatio, barHeight);
            }
        }

        drawGraph();
    }

    function updateStats() {
        const s = ALife.stats();
        document.getElementById('pop-plants').textContent = s.plants;
        document.getElementById('pop-herbs').textContent = s.herbivores;
        document.getElementById('pop-preds').textContent = s.predators;
        document.getElementById('entities-value').textContent = s.plants + s.herbivores + s.predators;
    }

    // ─── Population Graph ─────────────────────────────────────────
    function drawGraph() {
        const w = graphCanvas.width;
        const h = graphCanvas.height;
        const history = ALife.statsHistory();

        graphCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        graphCtx.fillRect(0, 0, w, h);

        if (history.length < 2) return;

        const maxVal = Math.max(10, ...history.map(s => Math.max(s.plants, s.herbivores, s.predators)));

        // Grid
        graphCtx.strokeStyle = 'rgba(255,255,255,0.05)';
        graphCtx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const gy = (h / 4) * i;
            graphCtx.beginPath();
            graphCtx.moveTo(0, gy);
            graphCtx.lineTo(w, gy);
            graphCtx.stroke();
        }

        graphCtx.fillStyle = 'rgba(255,255,255,0.2)';
        graphCtx.font = '9px Inter, sans-serif';
        graphCtx.fillText(maxVal.toString(), 4, 12);
        graphCtx.fillText('0', 4, h - 4);

        const lines = [
            { key: 'plants', color: [34, 197, 94], alpha: 0.2 },
            { key: 'herbivores', color: [59, 130, 246], alpha: 0.15 },
            { key: 'predators', color: [239, 68, 68], alpha: 0.15 },
        ];

        for (const line of lines) {
            const data = history.map(s => s[line.key]);
            const step = w / (data.length - 1);
            const [r, g, b] = line.color;

            // Fill area
            graphCtx.beginPath();
            graphCtx.moveTo(0, h);
            for (let i = 0; i < data.length; i++) {
                graphCtx.lineTo(i * step, h - (data[i] / maxVal) * (h - 10));
            }
            graphCtx.lineTo((data.length - 1) * step, h);
            graphCtx.closePath();
            graphCtx.fillStyle = `rgba(${r},${g},${b},${line.alpha})`;
            graphCtx.fill();

            // Line
            graphCtx.beginPath();
            for (let i = 0; i < data.length; i++) {
                const px = i * step;
                const py = h - (data[i] / maxVal) * (h - 10);
                if (i === 0) graphCtx.moveTo(px, py);
                else graphCtx.lineTo(px, py);
            }
            graphCtx.strokeStyle = `rgb(${r},${g},${b})`;
            graphCtx.lineWidth = 1.5;
            graphCtx.stroke();

            // End dot
            const lastVal = data[data.length - 1];
            const lastX = (data.length - 1) * step;
            const lastY = h - (lastVal / maxVal) * (h - 10);
            graphCtx.beginPath();
            graphCtx.arc(lastX, lastY, 3, 0, Math.PI * 2);
            graphCtx.fillStyle = `rgb(${r},${g},${b})`;
            graphCtx.fill();
        }
    }

    requestAnimationFrame(render);

    // ─── Controls ─────────────────────────────────────────────────

    // Spawn buttons
    document.getElementById('spawn-plant').addEventListener('click', () => {
        for (let i = 0; i < 5; i++) ALife.spawn('plant');
    });
    document.getElementById('spawn-herb').addEventListener('click', () => {
        for (let i = 0; i < 5; i++) ALife.spawn('herbivore');
    });
    document.getElementById('spawn-pred').addEventListener('click', () => {
        for (let i = 0; i < 3; i++) ALife.spawn('predator');
    });

    // Brush mode for canvas click
    const brushBtns = document.querySelectorAll('.brush-btn');
    brushBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            brushBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            brushType = btn.dataset.brush;
            updateSpawnIndicator();
        });
    });

    function updateSpawnIndicator() {
        const indicator = document.getElementById('spawn-indicator');
        const icon = document.getElementById('spawn-indicator-icon');
        const text = document.getElementById('spawn-indicator-text');
        const icons = { herbivore: '🐇', predator: '🐺', plant: '🌿' };
        const names = { herbivore: '草食動物', predator: '捕食者', plant: '植物' };
        icon.textContent = icons[brushType];
        text.textContent = names[brushType];
        indicator.className = `spawn-indicator ${brushType}-indicator`;
    }

    // Canvas click to spawn
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / canvas.width) * ALife.WORLD.width;
        const y = ((event.clientY - rect.top) / canvas.height) * ALife.WORLD.height;
        ALife.spawn(brushType, x, y);
    });

    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / canvas.width) * ALife.WORLD.width;
        const y = ((event.clientY - rect.top) / canvas.height) * ALife.WORLD.height;
        // Right-click always spawns predator
        ALife.spawn('predator', x, y);
    });

    // Show spawn indicator on canvas hover
    canvas.addEventListener('mouseenter', () => {
        document.getElementById('spawn-indicator').classList.remove('hidden');
        updateSpawnIndicator();
    });
    canvas.addEventListener('mouseleave', () => {
        document.getElementById('spawn-indicator').classList.add('hidden');
    });

    // Speed controls
    const speedBtns = document.querySelectorAll('.speed-btn');
    speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            speedBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const spd = parseInt(btn.dataset.speed);
            ALife.setSpeed(spd);
            document.getElementById('speed-value').textContent = spd === 0 ? '⏸' : `${spd}x`;
        });
    });

    // Environment sliders
    const controlMap = {
        'ctrl-plantRate': { key: 'plantSpawnRate', valId: 'val-plantRate' },
        'ctrl-herbSpeed': { key: 'herbivoreSpeed', valId: 'val-herbSpeed' },
        'ctrl-predSpeed': { key: 'predatorSpeed', valId: 'val-predSpeed' },
        'ctrl-herbVision': { key: 'herbivoreVision', valId: 'val-herbVision' },
        'ctrl-predVision': { key: 'predatorVision', valId: 'val-predVision' },
    };

    for (const [inputId, { key, valId }] of Object.entries(controlMap)) {
        const input = document.getElementById(inputId);
        input.addEventListener('input', () => {
            const val = parseFloat(input.value);
            document.getElementById(valId).textContent = val;
            ALife.config[key] = val;
        });
    }

    // Reset
    document.getElementById('reset-btn').addEventListener('click', () => {
        ALife.init();
        // Clear canvas
        ctx.fillStyle = 'rgba(10, 10, 15, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

})();
