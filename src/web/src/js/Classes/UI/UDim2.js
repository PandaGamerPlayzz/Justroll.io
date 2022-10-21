export class UDim2 {
    constructor(scaleX, offsetX, scaleY, offsetY) {
        this.scaleX = scaleX;
        this.offsetX = offsetX;
        this.scaleY = scaleY;
        this.offsetY = offsetY;
    }

    getAbsoluteValues() {
        return [canvas.width * this.scaleX + this.offsetX, canvas.height * this.scaleY + this.offsetY];
    }
}