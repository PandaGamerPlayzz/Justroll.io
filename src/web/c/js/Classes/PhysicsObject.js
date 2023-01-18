const ELLIPSE_POINT_DEGREES = 22.5;

function getEllipsePointsDegrees(centerX, centerY, a, b, stepSize, rotation) {
    let points = [];

    for (let t = 0; t <= 360; t += stepSize) {
        let rad = t * (Math.PI / 180);
        let x = a * Math.cos(rad);
        let y = b * Math.sin(rad);

        // Rotate the point
        let rotationRad = rotation * (Math.PI / 180);
        let xRot = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
        let yRot = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

        // Translate the point
        xRot += centerX;
        yRot += centerY;

        points.push({x: xRot, y: yRot});
    }

    return points;
}

function includeEllipseCenter(points, centerX, centerY) {
    points.push({x: centerX, y: centerY})

    return points;
}

function isPointInsideRectangle(pointX, pointY, rectX1, rectY1, rectX2, rectY2) {
    if (pointX >= rectX1 && pointX <= rectX2 && pointY >= rectY1 && pointY <= rectY2) {
        return true;
    }

    return false;
}

function isPointInsideEllipse(x, y, h, k, a, b, rotation) {
    // Convert rotation from degrees to radians
    let radians = (rotation * Math.PI) / 180;

    // Rotate the point's coordinates
    let xr = (x - h) * Math.cos(radians) - (y - k) * Math.sin(radians) + h;
    let yr = (x - h) * Math.sin(radians) + (y - k) * Math.cos(radians) + k;
    let result = (Math.pow((xr - h), 2) / Math.pow(a, 2)) + (Math.pow((yr - k), 2) / Math.pow(b, 2));
    
    return result <= 1;
}

export function collides(object1, object2) {
    if(object2.type == 'ellipse') object1, object2 = object2, object1;

    if(object1.type == 'ellipse' && object2.type == 'rect') {
        let ellipsePoints = getEllipsePointsDegrees(object1.x + object1.a, object1.y + object1.b, object1.a, object1.b, ELLIPSE_POINT_DEGREES, object1.rotation);
    
        for(let i = 0; i < ellipsePoints.length; i++) {
            if(isPointInsideRectangle(ellipsePoints[i].x, ellipsePoints[i].y, object2.x, object2.y, object2.x + object2.sizeX, object2.y + object2.sizeY)) return true;
        }
    } else if(object1.type == 'ellipse' && object2.type == 'ellipse') {
        let ellipse1Points = includeEllipseCenter(getEllipsePointsDegrees(object1.x + object1.a, object1.y + object1.b, object1.a, object1.b, ELLIPSE_POINT_DEGREES, object1.rotation), object1.x + object1.a, object1.y + object1.b);
    
        for(let i = 0; i < ellipse1Points.length; i++) {
            let point = ellipse1Points[i];

            if(isPointInsideEllipse(point.x, point.y, object2.x + object2.a, object2.y + object2.b, object2.a, object2.b, object2.rotation)) return true;
        }
    } else if(object1.type == 'rect' && object2.type == 'rect') {
        let rect1X1 = object1.x;
        let rect1X2 = object1.x + object1.sizeX;
        let rect1Y1 = object1.y;
        let rect1Y2 = object1.y + object1.sizeY;

        let rect2X1 = object2.x;
        let rect2X2 = object2.x + object2.sizeX;
        let rect2Y1 = object2.y;
        let rect2Y2 = object2.y + object2.sizeY;

        if (rect1X1 < rect2X2 && rect1X2 > rect2X1 && rect1Y1 < rect2Y2 && rect1Y2 > rect2Y1) {
            return true;
        }
    }

    return false;
}

export class PhysicsObject {
    constructor(game, sizeX, sizeY) {
        this.game = game;

        this.hasGravity = false;

        this.elasticity = 1;
        
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.dx = 0;
        this.dy = 0;
        this.dr = 0;
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
    }

    update(dt) {
        this.x += this.dx * dt;
        this.y += this.dy * dt;
        this.rotation += this.dr * dt;

        if(this.hasGravity) this.dy += 10 * dt;
    }
}

export class RectPhysicsObject extends PhysicsObject {
    constructor(game, sizeX, sizeY) {
        super(game, sizeX, sizeY);

        this.type = 'rect';
    }

    drawHitbox(ctx) {
        let rotationInRadians = this.rotation * Math.PI / 180;
        let width = this.sizeX;
        let height = this.sizeY;
        let x = this.x;
        let y = this.y;

        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.fill();
    }
}

export class EllipsePhysicsObject extends PhysicsObject {
    constructor(game, sizeX, sizeY) {
        super(game, sizeX, sizeY);

        this.type = 'ellipse';
    }

    get a() {
        if(this.sizeX > this.sizeY) {
            return this.sizeY / 2;
        } else {
            return this.sizeX / 2;
        }
    }

    get b() {
        if(this.sizeY > this.sizeX) {
            return this.sizeY / 2;
        } else {
            return this.sizeX / 2;
        }
    }

    drawHitbox(ctx) {
        let rotationInRadians = this.rotation * Math.PI / 180;
        let width = this.sizeX;
        let height = this.sizeY;
        let x = this.x + width * 0.5;
        let y = this.y + height * 0.5

        ctx.beginPath();
        ctx.ellipse(x, y, width * 0.5, height * 0.5, rotationInRadians, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.fill();

        if(this.game.showPoints) this.drawPoints(ctx, ELLIPSE_POINT_DEGREES);
    }

    drawPoints(ctx, stepSize) {
        let ellipsePoints = includeEllipseCenter(getEllipsePointsDegrees(this.x + this.a, this.y + this.b, this.a, this.b, stepSize, this.rotation), this.x + this.a, this.y + this.b);
    
        for(let i = 0; i < ellipsePoints.length; i++) {
            let point = ellipsePoints[i];

            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fill();
        }
    }
}