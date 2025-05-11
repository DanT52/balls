import { Ball, checkCollision } from './ballPhysics.js';
import { canvas, ctx, balls, mainBalls, animationId, setMainBalls, addMainBall, removeMainBall, setAnimationId, setSimulationRunning, isSimulationRunning } from './script.js';
import { getRandomColor } from './colorUtils.js';
import { getUIValues, getBalls } from './uiControls.js';

// Create the main ball based on launch side
export function createMainBall(ballSize, mainBallColor, launchSide, ballIndex = 0, ballCount = 1) {
    
    const radius = parseInt(ballSize);
    const color = mainBallColor || '#FF5252';
    let x, y;
    
    // Position the ball at the appropriate edge based on launch side
    switch (launchSide || 'left') {
        case 'left':
            x = radius;
            // If multiple balls on the same side, space them out vertically
            if (ballCount > 1) {
                const spacing = (canvas.height - 2 * radius) / (ballCount + 1);
                y = (ballIndex + 1) * spacing + radius;
            } else {
                y = canvas.height / 2;
            }
            break;
        case 'right':
            x = canvas.width - radius;
            // If multiple balls on the same side, space them out vertically
            if (ballCount > 1) {
                const spacing = (canvas.height - 2 * radius) / (ballCount + 1);
                y = (ballIndex + 1) * spacing + radius;
            } else {
                y = canvas.height / 2;
            }
            break;
        case 'top':
            // If multiple balls on the same side, space them out horizontally
            if (ballCount > 1) {
                const spacing = (canvas.width - 2 * radius) / (ballCount + 1);
                x = (ballIndex + 1) * spacing + radius;
            } else {
                x = canvas.width / 2;
            }
            y = radius;
            break;
        case 'bottom':
            // If multiple balls on the same side, space them out horizontally
            if (ballCount > 1) {
                const spacing = (canvas.width - 2 * radius) / (ballCount + 1);
                x = (ballIndex + 1) * spacing + radius;
            } else {
                x = canvas.width / 2;
            }
            y = canvas.height - radius;
            break;
        default:
            x = radius;
            y = canvas.height / 2;
    }
    
    return new Ball(x, y, radius, color);
}


// Break a specific main ball into smaller ones
export function breakMainBall(currentMainBall) {
    if (!currentMainBall) return;
    
    // Use ball's own properties for breaking instead of global UI values
    const numBalls = currentMainBall.numBalls || getUIValues().numBalls;
    const smallBallColor = currentMainBall.smallBallColor || getUIValues().smallBallColor;
    const smallRadius = currentMainBall.radius / Math.sqrt(numBalls);
    
    // Calculate total energy of the main ball
    const mainEnergy = 0.1 * currentMainBall.mass * (currentMainBall.vx * currentMainBall.vx + currentMainBall.vy * currentMainBall.vy);
    
    // Energy distribution factor - we'll distribute only part of the energy
    // to ensure we don't create excess energy
    const energyFactor = 0.9;
    
    for (let i = 0; i < numBalls; i++) {
        // Create balls in a circle around where the main ball was
        const angle = (i / numBalls) * Math.PI * 2;
        const newBall = new Ball(
            currentMainBall.x, 
            currentMainBall.y, 
            smallRadius,
            getRandomColor(smallBallColor)
        );
        
        // Base velocity component from main ball's momentum (scaled by mass)
        const baseVx = currentMainBall.vx * 0.1;
        const baseVy = currentMainBall.vy * 0.1;
        
        // Additional velocity component in random directions
        // Scale by sqrt(energy/mass) to maintain energy conservation
        const energyPerBall = energyFactor * mainEnergy / numBalls;
        const speedFactor = Math.sqrt(2 * energyPerBall / newBall.mass);
        
        // Give them velocity in different directions, but with controlled magnitude
        newBall.vx = baseVx + Math.cos(angle) * speedFactor * (0.6 + Math.random() * 0.4);
        newBall.vy = baseVy + Math.sin(angle) * speedFactor * (0.6 + Math.random() * 0.4);
        
        balls.push(newBall);
    }
    
    // Remove this specific ball from the mainBalls array
    removeMainBall(currentMainBall);
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
    const { gravity, friction, elasticity} = getUIValues();
    
    if (mainBalls.length > 0) {
        // Loop through all main balls
        for (let i = mainBalls.length - 1; i >= 0; i--) {
            const currentMainBall = mainBalls[i];
            if (!currentMainBall) continue;
            
            // Update main ball physics with delta time
            currentMainBall.update(gravity, friction, canvas.width, canvas.height, elasticity, deltaTime);
            
            // Get the starting wall of this ball
            const startWall = currentMainBall.launchSide || 'left';
            
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
                breakMainBall(currentMainBall);
            }
        }
    }
    
    // Update all small balls
    for (let i = 0; i < balls.length; i++) {
        balls[i].update(gravity, friction, canvas.width, canvas.height, elasticity, deltaTime);
        
        // Check collisions with other balls
        for (let j = i + 1; j < balls.length; j++) {
            checkCollision(balls[i], balls[j], elasticity);
        }
        
        // Check collision with all main balls
        for (const mainBall of mainBalls) {
            if (mainBall) {
                checkCollision(balls[i], mainBall, elasticity);
            }
        }
    }
    
    // Check collisions between main balls
    for (let i = 0; i < mainBalls.length; i++) {
        for (let j = i + 1; j < mainBalls.length; j++) {
            if (mainBalls[i] && mainBalls[j]) {
                // Define a callback function to break both balls on collision
                const breakBothBallsCallback = (ball1, ball2, velocity) => {
                    // Velocity threshold to determine if collision is strong enough to break the balls
                    const breakingVelocityThreshold = 5;
                    
                    if (velocity >= breakingVelocityThreshold) {
                        // Create temporary array of balls to break
                        const ballsToBreak = [ball1, ball2];
                        
                        // Break both balls
                        for (const ball of ballsToBreak) {
                            // Use setTimeout with 0ms to defer the breaking to avoid modification 
                            // of the array during iteration
                            setTimeout(() => breakMainBall(ball), 0);
                        }
                    }
                };
                
                // Check collision with the callback
                checkCollision(mainBalls[i], mainBalls[j], elasticity, breakBothBallsCallback);
            }
        }
    }
}

// Rendering function
function renderScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Main balls
    for (const mainBall of mainBalls) {
        if (mainBall) {
            mainBall.draw();
        }
    }

    // Other balls
    for (const ball of balls) {
        ball.draw();
    }
}

// Launch the main balls with angle and side
export function launchMainBall() {
    // Clear any existing animation to avoid needing double clicks
    if (isSimulationRunning && animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Get balls configuration from UI
    const ballConfigs = getBalls();
    
    // Clear existing main balls
    setMainBalls([]);
    
    // Always consider simulation to be starting fresh
    setSimulationRunning(true);
    
    // Group balls by sides to handle positioning
    const sideMap = {};
    ballConfigs.forEach(config => {
        const side = config.launchSide || 'left';
        if (!sideMap[side]) sideMap[side] = [];
        sideMap[side].push(config);
    });
    
    // Create all the main balls
    ballConfigs.forEach(config => {
        const { ballSize, mainBallColor, launchSide, numBalls, smallBallColor, 
                launchSpeed, launchAngle } = config;
        
        // Get the count of balls on this side for positioning
        const sideCount = sideMap[launchSide || 'left'].length;
        const ballIndex = sideMap[launchSide || 'left'].indexOf(config);
        
        // Create the ball with proper positioning
        const newBall = createMainBall(
            ballSize, 
            mainBallColor, 
            launchSide,
            ballIndex,
            sideCount
        );
        
        if (!newBall) {
            console.error("Failed to create main ball");
            return;
        }
        
        // Store the launch side and other properties on the ball object
        newBall.launchSide = launchSide || 'left';
        newBall.numBalls = numBalls;
        newBall.smallBallColor = smallBallColor;
        
        // Add ball to the mainBalls array
        addMainBall(newBall);
        
        // Convert angle from degrees to radians
        const angleRad = (launchAngle * Math.PI) / 180;
        const actualSpeed = parseInt(launchSpeed) || 10;
        
        // Set velocity based on launch side
        switch (newBall.launchSide) {
            case 'left':
                // From left: 0° is right, -90° is up, 90° is down
                newBall.vx = actualSpeed * Math.cos(angleRad);
                newBall.vy = actualSpeed * Math.sin(angleRad);
                break;
            case 'right':
                // From right: 0° is left, -90° is up, 90° is down
                newBall.vx = -actualSpeed * Math.cos(angleRad);
                newBall.vy = actualSpeed * Math.sin(angleRad);
                break;
            case 'top':
                // From top: 0° is down, -90° is left, 90° is right
                newBall.vx = actualSpeed * Math.sin(angleRad);
                newBall.vy = actualSpeed * Math.cos(angleRad);
                break;
            case 'bottom':
                // From bottom: 0° is up, -90° is left, 90° is right
                newBall.vx = actualSpeed * Math.sin(angleRad);
                newBall.vy = -actualSpeed * Math.cos(angleRad);
                break;
            default:
                // Default to left side launch
                newBall.vx = actualSpeed;
                newBall.vy = 0;
        }
    });
    
    // Start the animation immediately
    lastTimestamp = 0; // Reset timestamp
    animate();
}

// Reset the simulation
export function resetSimulation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    setMainBalls([]); // Clear the array of main balls
    balls.length = 0; // Clear the array of small balls
    setSimulationRunning(false);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset animation variables
    lastTimestamp = 0;
}

