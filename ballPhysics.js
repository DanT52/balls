import { ctx } from './script.js';
import { getRandomColor, hexToRgb } from './colorUtils.js';
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
        this.collisionEffect = 0; // Collision effect timer (0-1)
        this.lastCollisionTime = 0; // When the last collision occurred
        this.collisionBrightnessFactor = 0.9 //how much to brighten ball on collision
    }

    updateGlowState(isDarkMode) {
        this.hasGlow = isDarkMode;
    }

    draw() {
        ctx.beginPath();
        
        // Calculate dynamic glow based on collision effect
        const baseGlow = this.hasGlow ? this.radius * 0.5 : 0;
        
        const totalGlow = baseGlow;
        
        if (totalGlow > 0) {
            ctx.shadowBlur = totalGlow;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }
        
        // Calculate brightness boost for collision effect
        let fillStyle = this.color;
        if (this.collisionEffect > 0) {
            // Create a brighter version of the ball's color
            const rgb = hexToRgb(this.color);
            if (rgb) {
                // Brighten the color based on collision effect
                const brightness = Math.min(255, rgb.r + (255 - rgb.r) * this.collisionEffect * this.collisionBrightnessFactor);
                const g = Math.min(255, rgb.g + (255 - rgb.g) * this.collisionEffect * this.collisionBrightnessFactor);
                const b = Math.min(255, rgb.b + (255 - rgb.b) * this.collisionEffect * this.collisionBrightnessFactor);
                fillStyle = `rgb(${Math.floor(brightness)}, ${Math.floor(g)}, ${Math.floor(b)})`;
            }
        }
        
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = fillStyle;
        ctx.fill();
        ctx.strokeStyle = this.hasGlow ? this.color : '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    // Update collision effect (to be called in animation loop)
    updateCollisionEffect(deltaTime) {
        if (this.collisionEffect > 0) {
            // Fade out over 1 second
            this.collisionEffect = Math.max(0, this.collisionEffect - deltaTime*4);
        }
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
        
        // Update collision effect
        this.updateCollisionEffect(deltaTime);
        
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
export function checkCollision(ball1, ball2, elasticity, onCollisionCallback = null) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = ball1.radius + ball2.radius;
    
    // these balls collided
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
        
        // Check if the collision velocity is high enough to trigger the visual effect
        // Calculate magnitude of relative velocity
        const relVelocityMagnitude = Math.sqrt(
            relativeVelocityX * relativeVelocityX + 
            relativeVelocityY * relativeVelocityY
        );
        
        // Threshold for "high velocity" collision (can be adjusted)
        const velocityThreshold = 5;
        
        if (relVelocityMagnitude > velocityThreshold) {
            // Set collision effect intensity based on relative velocity
            const now = performance.now();
            
            // Normalize collision intensity (clamp between 0.3 and 1)
            const collisionIntensity = Math.min(1, Math.max(0.3, relVelocityMagnitude / 20));
            
            // Only apply the collision effect if it would make the ball brighter
            // This prevents flickering when a minor collision follows a major one
            if (ball1.collisionEffect < collisionIntensity) {
                ball1.collisionEffect = collisionIntensity;
                ball1.lastCollisionTime = now;
            }
            
            if (ball2.collisionEffect < collisionIntensity) {
                ball2.collisionEffect = collisionIntensity;
                ball2.lastCollisionTime = now;
            }
        }
        
        // Execute the callback if provided
        if (onCollisionCallback) {
            onCollisionCallback(ball1, ball2, relVelocityMagnitude);
        }
        
        return true;
    }
    
    return false;
}
