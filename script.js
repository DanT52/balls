// Import modules
import { Ball, checkCollision } from './ballPhysics.js';
import { createMainBall, breakMainBall, animate, resetSimulation } from './simulation.js';
import { setupUIControls, getUIValues } from './uiControls.js';

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Export canvas context for other modules to use
export { canvas, ctx };

// Setup global simulation state
let balls = [];
let mainBalls = []; // Changed from single mainBall to array of mainBalls
let animationId = null;
let isSimulationRunning = false;
let isDarkMode = true; // Default to dark mode

// Export simulation state
export { balls, mainBalls, animationId, isSimulationRunning, isDarkMode };
export const setMainBalls = (ballsArray) => mainBalls = ballsArray; // Updated to set array
export const addMainBall = (ball) => mainBalls.push(ball); // Add a ball to the mainBalls array
export const removeMainBall = (ball) => {
    const index = mainBalls.indexOf(ball);
    if (index !== -1) {
        mainBalls.splice(index, 1);
    }
};
export const setAnimationId = (id) => animationId = id;
export const setSimulationRunning = (state) => isSimulationRunning = state;
export const setDarkMode = (state) => {
    isDarkMode = state;
    document.body.classList.toggle('dark-mode', state);
    canvas.classList.toggle('dark-mode', state);
    
    // Need to redraw any existing balls with/without glow
    mainBalls.forEach(ball => ball && ball.updateGlowState(isDarkMode)); // Updated for array
    balls.forEach(ball => ball.updateGlowState(isDarkMode));
};

// Initialize the application
function init() {
    setupUIControls();
    
    // Resize canvas when window is resized
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    // Dark mode is now handled in loadSavedSettings()
}

// Start the application
init();
