import { Ball, checkCollision } from './ballPhysics.js';
import { canvas, ctx, balls, mainBall, animationId, setMainBall, setAnimationId, setSimulationRunning, isSimulationRunning } from './script.js';
import { getRandomColor } from './colorUtils.js';
import { getUIValues } from './uiControls.js';

// Create the main ball
export function createMainBall() {
    const { ballSize, mainBallColor } = getUIValues();
    const radius = parseInt(ballSize);
    const color = mainBallColor || '#FF5252';
    return new Ball(radius * 2, canvas.height / 2, radius, color);
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
    const energyFactor = 0.85;
    
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

// Animation variables
let lastTimestamp = 0;
let slowMotionAccumulator = 0;

// Animation loop
export function animate(timestamp = 0) {
    const { slowMotionFactor } = getUIValues();
    
    // Calculate time delta
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // We accumulate time until we have enough to perform a physics update
    slowMotionAccumulator += deltaTime;
    const timeStep = 1000 / 60; // Target 60 updates per second
    const slowedTimeStep = timeStep * slowMotionFactor; // Invert the factor for correct behavior
    
    // Only update physics if enough time has accumulated
    if (slowMotionAccumulator >= slowedTimeStep) {
        slowMotionAccumulator = 0; // Reset accumulator
        updatePhysics(deltaTime);
    }
    
    // Always render the current state
    renderScene();
    
    const id = requestAnimationFrame(animate);
    setAnimationId(id);
}

// Physics update function (separated from rendering)
function updatePhysics(deltaTime) {
    const { gravity, friction, elasticity } = getUIValues();
    const currentMainBall = mainBall;
    
    if (currentMainBall) {
        currentMainBall.update(gravity, friction, canvas.width, canvas.height, elasticity);
        
        // Check if main ball reaches right side of screen
        if (currentMainBall.x + currentMainBall.radius > canvas.width * 0.8) {
            breakMainBall();
        }
    }
    
    // Always update all small balls (even when main ball is present)
    for (let i = 0; i < balls.length; i++) {
        balls[i].update(gravity, friction, canvas.width, canvas.height, elasticity);
        
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

// Rendering function (separated from physics)
function renderScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw main ball if it exists
    if (mainBall) {
        mainBall.draw();
    }
    
    // Draw all small balls
    for (let i = 0; i < balls.length; i++) {
        balls[i].draw();
    }
}

// Launch the main ball
export function launchMainBall() {
    const { launchSpeed } = getUIValues();
    
    // Create a new main ball even if simulation is already running
    // (Replaces existing main ball if there is one, but keeps small balls)
    if (mainBall) {
        setMainBall(null); // Remove reference to the old main ball
    }
    
    // If simulation is not running, start it
    if (!isSimulationRunning) {
        setSimulationRunning(true);
        animate();
    }
    
    // Create and launch new main ball
    const newMainBall = createMainBall();
    setMainBall(newMainBall);
    newMainBall.vx = launchSpeed;
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
    slowMotionAccumulator = 0;
}

// Save current simulation settings to localStorage
export function saveSimulationSettings() {
    const settings = getUIValues();
    localStorage.setItem('ballsSimulationSettings', JSON.stringify(settings));
}
