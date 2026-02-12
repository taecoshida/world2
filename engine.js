// ─── Artificial Life — Client-Side Simulation Engine ─────────────
// This runs entirely in the browser — no server required.
// Designed for GitHub Pages deployment.

const ALife = (() => {
    'use strict';

    // ─── World Configuration ──────────────────────────────────────
    const WORLD = { width: 1200, height: 800 };

    const config = {
        plantSpawnRate: 0.03,
        maxPlants: 120,
        herbivoreSpeed: 1.8,
        predatorSpeed: 2.2,
        herbivoreVision: 120,
        predatorVision: 150,
        herbivoreBirthEnergy: 80,
        predatorBirthEnergy: 100,
        herbivoreEnergyDecay: 0.15,
        predatorEnergyDecay: 0.2,
        plantEnergy: 30,
        preyEnergy: 50,
    };

    let nextId = 1;
    let entities = [];
    let stats = { plants: 0, herbivores: 0, predators: 0 };
    let statsHistory = [];
    let speed = 1; // 0=paused, 1=normal, 2=fast, 4=very fast
    let tickCount = 0;

    // ─── Entity Factory ───────────────────────────────────────────
    function createEntity(type, x, y, extra = {}) {
        return {
            id: nextId++,
            type,
            x: x ?? Math.random() * WORLD.width,
            y: y ?? Math.random() * WORLD.height,
            energy: extra.energy ?? (type === 'plant' ? 1 : (type === 'herbivore' ? 60 : 70)),
            vx: 0,
            vy: 0,
            age: 0,
            hue: extra.hue ?? null,
        };
    }

    // ─── Init ─────────────────────────────────────────────────────
    function init() {
        entities = [];
        nextId = 1;
        statsHistory = [];
        tickCount = 0;

        for (let i = 0; i < 60; i++) entities.push(createEntity('plant'));
        for (let i = 0; i < 25; i++) entities.push(createEntity('herbivore', null, null, { hue: 120 + Math.random() * 40 }));
        for (let i = 0; i < 8; i++) entities.push(createEntity('predator', null, null, { hue: 0 + Math.random() * 30 }));
    }

    // ─── Helpers ──────────────────────────────────────────────────
    function distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function nearest(entity, targetType, vision) {
        let best = null;
        let bestDist = vision;
        for (const e of entities) {
            if (e.type !== targetType) continue;
            const d = distance(entity, e);
            if (d < bestDist) {
                bestDist = d;
                best = e;
            }
        }
        return best;
    }

    function moveToward(entity, target, spd) {
        const dx = target.x - entity.x;
        const dy = target.y - entity.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) return;
        entity.vx = (dx / d) * spd;
        entity.vy = (dy / d) * spd;
    }

    function wander(entity, spd) {
        entity.vx += (Math.random() - 0.5) * 0.5;
        entity.vy += (Math.random() - 0.5) * 0.5;
        const mag = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
        if (mag > spd) {
            entity.vx = (entity.vx / mag) * spd;
            entity.vy = (entity.vy / mag) * spd;
        }
    }

    function wrapPosition(entity) {
        if (entity.x < 0) entity.x += WORLD.width;
        if (entity.x > WORLD.width) entity.x -= WORLD.width;
        if (entity.y < 0) entity.y += WORLD.height;
        if (entity.y > WORLD.height) entity.y -= WORLD.height;
    }

    // ─── Tick ─────────────────────────────────────────────────────
    function tick() {
        const newEntities = [];

        // Spawn plants
        if (Math.random() < config.plantSpawnRate) {
            const plantCount = entities.filter(e => e.type === 'plant').length;
            if (plantCount < config.maxPlants) {
                entities.push(createEntity('plant'));
            }
        }

        for (const e of entities) {
            e.age++;

            if (e.type === 'plant') {
                e.energy = Math.min(e.energy + 0.01, 1);
                continue;
            }

            if (e.type === 'herbivore') {
                const food = nearest(e, 'plant', config.herbivoreVision);
                if (food) {
                    moveToward(e, food, config.herbivoreSpeed);
                    if (distance(e, food) < 10) {
                        e.energy += config.plantEnergy;
                        food.energy = -1;
                    }
                } else {
                    wander(e, config.herbivoreSpeed * 0.6);
                }

                const threat = nearest(e, 'predator', config.herbivoreVision * 0.8);
                if (threat) {
                    const dx = e.x - threat.x;
                    const dy = e.y - threat.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d > 0) {
                        e.vx = (dx / d) * config.herbivoreSpeed * 1.3;
                        e.vy = (dy / d) * config.herbivoreSpeed * 1.3;
                    }
                }

                e.energy -= config.herbivoreEnergyDecay;

                if (e.energy > config.herbivoreBirthEnergy) {
                    e.energy *= 0.5;
                    newEntities.push(createEntity('herbivore',
                        e.x + (Math.random() - 0.5) * 30,
                        e.y + (Math.random() - 0.5) * 30,
                        { hue: e.hue + (Math.random() - 0.5) * 10, energy: e.energy * 0.5 }
                    ));
                }
            }

            if (e.type === 'predator') {
                const prey = nearest(e, 'herbivore', config.predatorVision);
                if (prey) {
                    moveToward(e, prey, config.predatorSpeed);
                    if (distance(e, prey) < 12) {
                        e.energy += config.preyEnergy;
                        prey.energy = -1;
                    }
                } else {
                    wander(e, config.predatorSpeed * 0.5);
                }

                e.energy -= config.predatorEnergyDecay;

                if (e.energy > config.predatorBirthEnergy) {
                    e.energy *= 0.5;
                    newEntities.push(createEntity('predator',
                        e.x + (Math.random() - 0.5) * 30,
                        e.y + (Math.random() - 0.5) * 30,
                        { hue: e.hue + (Math.random() - 0.5) * 10, energy: e.energy * 0.5 }
                    ));
                }
            }

            e.x += e.vx;
            e.y += e.vy;
            e.vx *= 0.92;
            e.vy *= 0.92;
            wrapPosition(e);
        }

        entities.push(...newEntities);
        entities = entities.filter(e => e.energy > 0);

        // Auto-replenish
        const herbCount = entities.filter(e => e.type === 'herbivore').length;
        const predCount = entities.filter(e => e.type === 'predator').length;
        if (herbCount === 0) {
            for (let i = 0; i < 10; i++) {
                entities.push(createEntity('herbivore', null, null, { hue: 120 + Math.random() * 40 }));
            }
        }
        if (predCount === 0 && herbCount > 15) {
            for (let i = 0; i < 3; i++) {
                entities.push(createEntity('predator', null, null, { hue: 0 + Math.random() * 30 }));
            }
        }

        stats = {
            plants: entities.filter(e => e.type === 'plant').length,
            herbivores: entities.filter(e => e.type === 'herbivore').length,
            predators: entities.filter(e => e.type === 'predator').length,
        };

        tickCount++;
        if (tickCount % 2 === 0) {
            statsHistory.push({ ...stats });
            if (statsHistory.length > 300) statsHistory.shift();
        }
    }

    // ─── Public API ───────────────────────────────────────────────
    function spawn(type, x, y) {
        const extra = type === 'herbivore' ? { hue: 120 + Math.random() * 40 } :
            type === 'predator' ? { hue: 0 + Math.random() * 30 } : {};
        entities.push(createEntity(type, x, y, extra));
    }

    function setSpeed(s) { speed = s; }
    function getSpeed() { return speed; }

    function update() {
        for (let i = 0; i < speed; i++) {
            tick();
        }
    }

    return {
        WORLD,
        config,
        entities: () => entities,
        stats: () => stats,
        statsHistory: () => statsHistory,
        init,
        update,
        spawn,
        setSpeed,
        getSpeed,
    };
})();
