let canvas = document.getElementById("gameArea");
let ctx = canvas.getContext("2d")

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;


class Paddle {
    constructor(game) {
        this.gameWidth = game.gameWidth;
        this.width = 150;
        this.height = 20;

        this.maxSpeed = 7;
        this.speed = 0;

        this.position = {
            x: game.gameWidth / 2 - this.width / 2,
            y: game.gameHeight - this.height - 10
        };
    }

    moveLeft() {
        this.speed = -this.maxSpeed;
    }

    moveRight() {
        this.speed = this.maxSpeed;
    }

    stop() {
        this.speed = 0;
    }

    draw(ctx) {
        ctx.fillStyle = '#0ff';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

    }

    update(deltaTime) {

        this.position.x += this.speed;
        if (this.position.x < 0) this.position.x = 0;
        if (this.position.x > this.gameWidth - this.width) this.position.x = this.gameWidth - this.width;

    }
}

class Ball {
    constructor(game) {
        this.image = document.getElementById("img_ball");
        
        this.size = 25;
        this.gameWidth = game.gameWidth;
        this.gameHeight = game.gameHeight;
        this.game = game;
        this.reset();

    }

    reset() {
        this.position = {
            x: 10,
            y: 400
        };
        this.speed = {
            x: 4,
            y: -2
        };
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.position.x, this.position.y, this.size, this.size);
    }

    update(deltaTime) {
        this.position.x += this.speed.x;
        this.position.y += this.speed.y;

        if (this.position.x > this.gameWidth - this.size || this.position.x < 0) {
            this.speed.x = -this.speed.x;
        }

        if (this.position.y < 0) {
            this.speed.y = -this.speed.y;
        }

        if(this.position.y > this.gameHeight - this.size) {
            this.game.lives--;
            this.reset();
        }

        if (detectCollision(this, this.game.paddle)) {
            this.speed.y = -this.speed.y;
            this.position.y = this.game.paddle.position.y - this.size;
        }
    }
}

class Tile {
    constructor(game, position) {
        this.image = document.getElementById("img_tile");
        this.position = position;
        this.game = game;
        this.width = 80;
        this.height = 24;
        this.markedForDeletion = false;

    }

    update() {
        if (detectCollision(this.game.ball, this)) {
            this.game.ball.speed.y = -this.game.ball.speed.y;

            this.markedForDeletion = true;
        }


    }

    draw(ctx) {
        ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }
}

class InputHandler {
    constructor(paddle, game) {
        document.addEventListener("keydown", event => {
            switch (event.keyCode) {
                case 37:
                    paddle.moveLeft();
                    break;

                case 39:
                    paddle.moveRight();
                    break;

                case 27:
                    game.togglePause();
                    break;

                case 32:
                    game.start();
                    break;
            }
        });

        document.addEventListener("keyup", event => {
            switch (event.keyCode) {
                case 37:
                    if (paddle.speed < 0) paddle.stop();
                    break;

                case 39:
                    if (paddle.speed > 0) paddle.stop();
                    break;
            }
        });
    }
}

const GAMESTATE = {
    PAUSED: 0,
    RUNNING: 1,
    MENU: 2,
    GAMEOVER: 3,
    NEWLEVEL: 4
};

class Game {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.gamestate = GAMESTATE.MENU;
        this.paddle = new Paddle(this);
        this.ball = new Ball(this);
        this.gameObjects = [];
        this.tiles = [];
        this.lives = 3;
        this.levels = [LEVEL1, LEVEL2];
        this.currentLevel = 0;
        new InputHandler(this.paddle, this);

    }

    start() {

        if (this.gamestate !== GAMESTATE.MENU && this.gamestate !== GAMESTATE.NEWLEVEL) return;
        this.tiles = bulidLevel(this, this.levels[this.currentLevel]);

        this.ball.reset();

        this.gameObjects = [this.paddle, this.ball];

        this.gamestate = GAMESTATE.RUNNING;

    }

    update(deltaTime) {

        if (this.lives === 0) this.gamestate = GAMESTATE.GAMEOVER;
        if (this.gamestate == GAMESTATE.PAUSED || this.gamestate == GAMESTATE.MENU || this.gamestate === GAMESTATE.GAMEOVER) return;

        if (this.tiles.length === 0) {
            this.currentLevel++;
            this.gamestate = GAMESTATE.NEWLEVEL;
            this.start();
        }
        [...this.gameObjects, ...this.tiles].forEach(object => object.update(deltaTime));

        this.tiles = this.tiles.filter(object => !object.markedForDeletion);
    }

    draw(ctx) {

        [...this.gameObjects, ...this.tiles].forEach(object => object.draw(ctx));

        if (this.gamestate == GAMESTATE.PAUSED) {
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

            ctx.fill();

            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Paused", this.gameWidth / 2, this.gameHeight / 2);
        }

        if (this.gamestate == GAMESTATE.MENU) {
            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

            ctx.fill();

            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Press SPACEBAR to start", this.gameWidth / 2, this.gameHeight / 2);
        }

        if (this.gamestate == GAMESTATE.GAMEOVER) {
            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

            ctx.fill();

            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", this.gameWidth / 2, this.gameHeight / 2);
        }
    }

    togglePause() {
        if (this.gamestate == GAMESTATE.PAUSED) {
            this.gamestate = GAMESTATE.RUNNING;
        } else {
            this.gamestate = GAMESTATE.PAUSED;
        }
    }
}

const LEVEL1 = [
    //[1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    //[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    //[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0]
]

const LEVEL2 = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
]



let game = new Game(GAME_WIDTH, GAME_HEIGHT);


let lastTime = 0;

function gameLoop(timestamp) {
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    game.update(deltaTime);
    game.draw(ctx);

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

function bulidLevel(game, level) {
    let tiles = [];

    level.forEach((row, rowIndex) => {
        row.forEach((tile, tileIndex) => {
            if (tile === 1) {
                let position = {
                    x: 80 * tileIndex,
                    y: 75 + 24 * rowIndex
                };
                tiles.push(new Tile(game, position));
            }
        });
    });

    return tiles;
}

function detectCollision(ball, gameObject) {
    let bottomOfBall = ball.position.y + ball.size;
    let topOfBall = ball.position.y;
    let topOfObject = gameObject.position.y;
    let leftSideOfObject = gameObject.position.x;
    let rightSideOfObject = gameObject.position.x + gameObject.width;
    let bottomOfObject = gameObject.position.y + gameObject.height;


    if (bottomOfBall >= topOfObject &&
        topOfBall <= bottomOfObject &&
        ball.position.x >= leftSideOfObject &&
        ball.position.x + ball.size <= rightSideOfObject) {
        return true;
    } else {
        return false;
    }
}