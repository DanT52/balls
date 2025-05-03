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
let mainBall = null;
let animationId = null;
let isSimulationRunning = false;
let isDarkMode = true; // Default to dark mode

// Export simulation state
export { balls, mainBall, animationId, isSimulationRunning, isDarkMode };
export const setMainBall = (ball) => mainBall = ball;
export const setAnimationId = (id) => animationId = id;
export const setSimulationRunning = (state) => isSimulationRunning = state;
export const setDarkMode = (state) => {
    isDarkMode = state;
    document.body.classList.toggle('dark-mode', state);
    canvas.classList.toggle('dark-mode', state);
    
    // Need to redraw any existing balls with/without glow
    if (mainBall) mainBall.updateGlowState(isDarkMode);
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
