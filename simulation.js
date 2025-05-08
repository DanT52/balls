import { Ball, checkCollision } from './ballPhysics.js';
import { canvas, ctx, balls, mainBall, animationId, setMainBall, setAnimationId, setSimulationRunning, isSimulationRunning } from './script.js';
import { getRandomColor } from './colorUtils.js';
import { getUIValues } from './uiControls.js';

// Create the main ball based on launch side
export function createMainBall() {
    const { ballSize, mainBallColor, launchSide } = getUIValues();
    const radius = parseInt(ballSize);
    const color = mainBallColor || '#FF5252';
    let x, y;
    
    // Position the ball at the appropriate edge based on launch side
    switch (launchSide || 'left') {
        case 'left':
            x = radius;
            y = canvas.height / 2;
            break;
        case 'right':
            x = canvas.width - radius;
            y = canvas.height / 2;
            break;
        case 'top':
            x = canvas.width / 2;
            y = radius;
            break;
        case 'bottom':
            x = canvas.width / 2;
            y = canvas.height - radius;
            break;
        default:
            x = radius;
            y = canvas.height / 2;
    }
    
    return new Ball(x, y, radius, color);
}

// Break the main ball into smaller ones
export function breakMainBall() {
    const { numBalls } = getUIValues();
    const currentMainBall = mainBall;
    const smallRadius = currentMainBall.radius / Math.sqrt(numBalls);
    
    // Calculate total energy of the main ball
    const mainEnergy = 0.5 * currentMainBall.mass * (currentMainBall.vx * currentMainBall.vx + currentMainBall.vy * currentMainBall.vy);
    
    // Energy distribution factor - we'll distribute only part of the energy
    // to ensure we don't create excess energy
    const energyFactor = 0.4;
    
    for (let i = 0; i < numBalls; i++) {
        // Create balls in a circle around where the main ball was
        const angle = (i / numBalls) * Math.PI * 2;
        const newBall = new Ball(
            currentMainBall.x, 
            currentMainBall.y, 
            smallRadius
        );
        
        // Base velocity component from main ball's momentum (scaled by mass)
        const baseVx = currentMainBall.vx * 0.5;
        const baseVy = currentMainBall.vy * 0.3;
        
        // Additional velocity component in random directions
        // Scale by sqrt(energy/mass) to maintain energy conservation
        const energyPerBall = energyFactor * mainEnergy / numBalls;
        const speedFactor = Math.sqrt(2 * energyPerBall / newBall.mass);
        
        // Give them velocity in different directions, but with controlled magnitude
        newBall.vx = baseVx + Math.cos(angle) * speedFactor * (0.6 + Math.random() * 0.4);
        newBall.vy = baseVy + Math.sin(angle) * speedFactor * (0.6 + Math.random() * 0.4);
        
        balls.push(newBall);
    }
    
    setMainBall(null);
}

let lastTimestamp = 0;

export function animate(timestamp = 0) {
    const { slowMotionFactor } = getUIValues();

    if (!lastTimestamp) lastTimestamp = timestamp;
    
    // Calculate delta time in seconds
    let deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    
    // Cap deltaTime to prevent large jumps after tab inactivity
    deltaTime = Math.min(deltaTime, 0.1);
    
    // Apply slow motion factor
    const effectiveDelta = deltaTime * slowMotionFactor;
    
    // Update physics with the scaled delta time
    updatePhysics(effectiveDelta);
    
    // Render the current state
    renderScene();

    const id = requestAnimationFrame(animate);
    setAnimationId(id);
}

// Physics update function
function updatePhysics(deltaTime) {
    const { gravity, friction, elasticity, launchSide } = getUIValues();
    const currentMainBall = mainBall;
    
    if (currentMainBall) {
        // Update main ball physics with delta time
        currentMainBall.update(gravity, friction, canvas.width, canvas.height, elasticity, deltaTime);
        
        // Get the starting wall based on launch side
        const startWall = launchSide || 'left';
        
        // Check if main ball reaches any edge of the screen EXCEPT its starting wall
        let reachedEdge = false;
        
        // Define edge thresholds with a small buffer (1% of canvas size)
        const rightEdgeThreshold = canvas.width * 0.99;
        const leftEdgeThreshold = canvas.width * 0.01;
        const bottomEdgeThreshold = canvas.height * 0.99;
        const topEdgeThreshold = canvas.height * 0.01;
        
        // Check walls based on which was NOT the starting wall
        if (startWall !== 'right' && currentMainBall.x + currentMainBall.radius > rightEdgeThreshold) {
            reachedEdge = true; // Hit right wall (and didn't start from right)
        } else if (startWall !== 'left' && currentMainBall.x - currentMainBall.radius < leftEdgeThreshold) {
            reachedEdge = true; // Hit left wall (and didn't start from left)
        } else if (startWall !== 'bottom' && currentMainBall.y + currentMainBall.radius > bottomEdgeThreshold) {
            reachedEdge = true; // Hit bottom wall (and didn't start from bottom)
        } else if (startWall !== 'top' && currentMainBall.y - currentMainBall.radius < topEdgeThreshold) {
            reachedEdge = true; // Hit top wall (and didn't start from top)
        }
        
        if (reachedEdge) {
            breakMainBall();
        }
    }
    
    // Update all small balls
    for (let i = 0; i < balls.length; i++) {
        balls[i].update(gravity, friction, canvas.width, canvas.height, elasticity, deltaTime);
        
        // Check collisions with other balls
        for (let j = i + 1; j < balls.length; j++) {
            checkCollision(balls[i], balls[j], elasticity);
        }
        
        // Check collision with main ball if it exists
        if (currentMainBall) {
            checkCollision(balls[i], currentMainBall, elasticity);
        }
    }
}

// Rendering function
function renderScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Main ball
    if (mainBall) {
        mainBall.draw();
    }

    // Other balls
    for (const ball of balls) {
        ball.draw();
    }
}

// Launch the main ball with angle and side
export function launchMainBall() {
    // Clear any existing animation to avoid needing double clicks
    if (isSimulationRunning && animationId) {
        cancelAnimationFrame(animationId);
    }
    
    const { launchSpeed, launchSide, launchAngle } = getUIValues();
    
    // Create a new main ball
    if (mainBall) {
        setMainBall(null); // Remove reference to the old main ball
    }
    
    // Always consider simulation to be starting fresh
    setSimulationRunning(true);
    
    // Create and launch new main ball
    const newMainBall = createMainBall();
    setMainBall(newMainBall);
    
    if (!newMainBall) {
        console.error("Failed to create main ball");
        return;
    }
    
    // Store the launch side on the ball object for reference
    newMainBall.launchSide = launchSide || 'left';
    
    // Convert angle from degrees to radians
    // Now angle range is -90 to 90 degrees: 
    // 0° is straight into canvas, negative is up, positive is down
    const angleRad = (launchAngle * Math.PI) / 180;
    
    // Apply velocity based on side and angle
    const actualSpeed = parseInt(launchSpeed) || 10;
    
    switch (launchSide || 'left') {
        case 'left':
            // From left: 0° is right, -90° is up, 90° is down
            newMainBall.vx = actualSpeed * Math.cos(angleRad);
            newMainBall.vy = actualSpeed * Math.sin(angleRad);
            break;
        case 'right':
            // From right: 0° is left, -90° is up, 90° is down
            newMainBall.vx = -actualSpeed * Math.cos(angleRad);
            newMainBall.vy = actualSpeed * Math.sin(angleRad);
            break;
        case 'top':
            // From top: 0° is down, -90° is left, 90° is right
            newMainBall.vx = actualSpeed * Math.sin(angleRad);
            newMainBall.vy = actualSpeed * Math.cos(angleRad);
            break;
        case 'bottom':
            // From bottom: 0° is up, -90° is left, 90° is right
            newMainBall.vx = actualSpeed * Math.sin(angleRad);
            newMainBall.vy = -actualSpeed * Math.cos(angleRad);
            break;
        default:
            // Default to left side launch
            newMainBall.vx = actualSpeed;
            newMainBall.vy = 0;
    }
    
    // Start the animation immediately (no need for double click)
    lastTimestamp = 0; // Reset timestamp
    animate();
}

// Reset the simulation
export function resetSimulation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    setMainBall(null);
    balls.length = 0; // Clear the array
    setSimulationRunning(false);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset animation variables
    lastTimestamp = 0;
}

// Save current simulation settings to localStorage
export function saveSimulationSettings() {
    const settings = getUIValues();
    localStorage.setItem('ballsSimulationSettings', JSON.stringify(settings));
}
