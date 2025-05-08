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
        // Normalize gravity to be time-dependent
        const gravityStep = gravity * deltaTime * 60; // Scale to maintain behavior at 60fps
        
        // Apply gravity
        this.vy += gravityStep;
        
        // Apply friction (scale for time-dependence)
        const frictionFactor = Math.pow(1 - friction, deltaTime * 60);
        this.vx *= frictionFactor;
        this.vy *= frictionFactor;
        
        // Update position (scale velocity by delta time)
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        
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

// Check collision between two balls
export function checkCollision(ball1, ball2, elasticity) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = ball1.radius + ball2.radius;
    
    if (distance < minDistance) {
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
        
        // Calculate impulse scalar
        const j = -(1 + e) * velocityAlongNormal / 
                   (1/ball1.mass + 1/ball2.mass);
        
        // Apply impulse
        const impulseX = j * nx;
        const impulseY = j * ny;
        
        ball1.vx -= impulseX / ball1.mass;
        ball1.vy -= impulseY / ball1.mass;
        ball2.vx += impulseX / ball2.mass;
        ball2.vy += impulseY / ball2.mass;
        
        // Move balls apart to prevent sticking
        const overlap = (minDistance - distance);
        const percent = 0.8; // Correction percentage
        const correctionX = percent * overlap * nx;
        const correctionY = percent * overlap * ny;
        
        // Weight correction by inverse mass
        const totalMass = ball1.mass + ball2.mass;
        const ball1Ratio = ball2.mass / totalMass;
        const ball2Ratio = ball1.mass / totalMass;
        
        ball1.x -= correctionX * ball1Ratio;
        ball1.y -= correctionY * ball1Ratio;
        ball2.x += correctionX * ball2Ratio; 
        ball2.y += correctionY * ball2Ratio;
        
        return true;
    }
    
    return false;
}
