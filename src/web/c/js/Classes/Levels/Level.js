export class Level {
    constructor(levelLoader) {
        this.levelLoader = levelLoader;
        this.game = levelLoader.game;

        this.levelMin = 0;
        this.levelMax = 100;

        this.physicsObjects = [];
    }

    drawHitboxs(ctx) {
        for(let i = 0; i < this.physicsObjects.length; i++) {
            this.physicsObjects[i].drawHitbox(ctx);
        }
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

        for(let i = 0; i < this.currentLevel.physicsObjects.length; i++) {
            this.currentLevel.physicsObjects[i].update(dt);
        }
    }

    draw(ctx) {
        this.currentLevel.draw(ctx);
        if(this.game.showHitboxes) this.currentLevel.drawHitboxs(ctx);
    }

    drawOnTop(ctx) {
        this.currentLevel.drawOnTop(ctx);
    }
}