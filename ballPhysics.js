import { ctx } from './script.js';
import { getRandomColor } from './colorUtils.js';
import { isDarkMode } from './script.js';

// Ball class
export class Ball {
    constructor(x, y, radius, color = getRandomColor()) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.mass = radius * radius * Math.PI; // Mass proportional to area
        this.hasGlow = isDarkMode; // Initialize based on current dark mode state
    }

    updateGlowState(isDarkMode) {
        this.hasGlow = isDarkMode;
    }

    draw() {
        ctx.beginPath();
        
        // Add basic glow effect in dark mode
        if (this.hasGlow) {
            ctx.shadowBlur = this.radius * 0.5;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.hasGlow ? this.color : '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }

    update(gravity, friction, canvasWidth, canvasHeight, elasticity, deltaTime) {
        // Apply gravity
        this.vy += gravity;
        
        // Apply friction
        this.vx *= (1 - friction);
        this.vy *= (1 - friction);
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off walls
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = -this.vx * elasticity;
        } else if (this.x + this.radius > canvasWidth) {
            this.x = canvasWidth - this.radius;
            this.vx = -this.vx * elasticity;
        }
        
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = -this.vy * elasticity;
        } else if (this.y + this.radius > canvasHeight) {
            this.y = canvasHeight - this.radius;
            this.vy = -this.vy * elasticity;
        }
    }
}

// Check collision between two balls - keep the physics part
export function checkCollision(ball1, ball2, elasticity) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < ball1.radius + ball2.radius) {
        // Calculate collision normal
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate relative velocity
        const relativeVelocityX = ball2.vx - ball1.vx;
        const relativeVelocityY = ball2.vy - ball1.vy;
        
        // Calculate relative velocity in terms of normal direction
        const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;
        
        // Do not resolve if objects are moving away from each other
        if (velocityAlongNormal > 0) return false;
        
        // Calculate restitution (elasticity)
        const e = elasticity;
        
        // Calculate impulse scalar - corrected formula for conservation of momentum
        const j = -(1 + e) * velocityAlongNormal / 
                   (1/ball1.mass + 1/ball2.mass);
        
        // Apply impulse
        ball1.vx -= (j * nx) / ball1.mass;
        ball1.vy -= (j * ny) / ball1.mass;
        ball2.vx += (j * nx) / ball2.mass;
        ball2.vy += (j * ny) / ball2.mass;
        
        // Move balls apart to prevent sticking
        const overlap = (ball1.radius + ball2.radius - distance) / 2;
        const moveX = overlap * nx;
        const moveY = overlap * ny;
        
        ball1.x -= moveX;
        ball1.y -= moveY;
        ball2.x += moveX;
        ball2.y += moveY;
        
        return true;
    }
    
    return false;
}
