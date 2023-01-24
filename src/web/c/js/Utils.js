// Converts percentages to x, y values of canvas
export function getDrawValues(game, x, y, sizeX, sizeY) {
    let mSizeX = sizeX / 100;
    let mSizeY = sizeY / 100;

    let mX = (x + game.cameraX) / 100;
    let mY = (y + game.cameraY) / 100;

    return [mX * game.width, mY * game.height, mSizeX * game.width, mSizeY * game.height];
}