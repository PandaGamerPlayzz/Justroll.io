export class Level {
    constructor(levelLoader) {
        this.levelLoader = levelLoader;
        this.game = levelLoader.game;
    }
}

export class LevelLoader {
    constructor(game, starterLevelClass) {
        this.game = game;

        this.loadLevel(starterLevelClass);
    }

    loadLevel(levelClass) {
        this.currentLevel = new levelClass(this);
    }

    update(dt) {
        this.currentLevel.update(dt);
    }

    draw(ctx) {
        this.currentLevel.draw(ctx);
    }
}