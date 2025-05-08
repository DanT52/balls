import { launchMainBall, resetSimulation, saveSimulationSettings } from './simulation.js';
import { isDarkMode, setDarkMode } from './script.js';

// UI elements references
let numBallsInput;
let ballSizeInput;
let launchSpeedInput;
let gravityInput;
let elasticityInput;
let frictionInput;
let mainBallColorPicker;
let smallBallColorPicker;
let launchBtn;
let resetBtn;
let darkModeToggle;
let slowMotionSlider;
let slowMotionValue;

// Setup UI controls and event listeners
export function setupUIControls() {
    // Get references to UI elements
    numBallsInput = document.getElementById('num-balls');
    ballSizeInput = document.getElementById('ball-size');
    launchSpeedInput = document.getElementById('launch-speed');
    gravityInput = document.getElementById('gravity');
    elasticityInput = document.getElementById('elasticity');
    frictionInput = document.getElementById('friction');
    mainBallColorPicker = document.getElementById('main-ball-color');
    smallBallColorPicker = document.getElementById('small-ball-color');
    launchBtn = document.getElementById('launch-btn');
    resetBtn = document.getElementById('reset-btn');
    darkModeToggle = document.getElementById('dark-mode-toggle');
    slowMotionSlider = document.getElementById('slow-motion');
    slowMotionValue = document.getElementById('slow-motion-value');
    
    // Load saved settings if they exist
    loadSavedSettings();
    
    // Add event listeners
    launchBtn.addEventListener('click', launchMainBall);
    resetBtn.addEventListener('click', resetSimulation);
    darkModeToggle.addEventListener('change', toggleDarkMode);
    
    // Update slow motion display value
    slowMotionSlider.addEventListener('input', updateSlowMotionDisplay);
    
    // Add change listeners to save settings
    const inputElements = [
        numBallsInput, ballSizeInput, launchSpeedInput,
        gravityInput, elasticityInput, frictionInput,
        mainBallColorPicker, smallBallColorPicker,
        slowMotionSlider
    ];
    
    inputElements.forEach(input => {
        input.addEventListener('change', saveSimulationSettings);
    });
}

function toggleDarkMode(e) {
    const isDark = e.target.checked;
    setDarkMode(isDark);
    localStorage.setItem('ballsSimulationDarkMode', isDark);
}

// Update the displayed value for slow motion
function updateSlowMotionDisplay() {
    const value = slowMotionSlider.value;
    console.log(value)
    const displayValue = parseFloat((value)).toFixed(1) + 'x';
    slowMotionValue.textContent = displayValue;
}

// Get current values from UI controls
export function getUIValues() {
    return {
        numBalls: parseInt(numBallsInput.value),
        ballSize: parseInt(ballSizeInput.value),
        launchSpeed: parseInt(launchSpeedInput.value),
        gravity: parseFloat(gravityInput.value),
        elasticity: parseFloat(elasticityInput.value),
        friction: parseFloat(frictionInput.value),
        mainBallColor: mainBallColorPicker.value,
        smallBallColor: smallBallColorPicker.value,
        darkMode: darkModeToggle.checked,
        slowMotionFactor: parseFloat(slowMotionSlider.value)
    };
}

// Load saved settings from localStorage
function loadSavedSettings() {
    try {
        // Load dark mode setting
        const savedDarkMode = localStorage.getItem('ballsSimulationDarkMode');
        if (savedDarkMode !== null) {
            const isDark = savedDarkMode === 'true';
            darkModeToggle.checked = isDark;
            setDarkMode(isDark);
        }
        
        // Load other simulation settings
        const savedSettings = localStorage.getItem('ballsSimulationSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Apply saved values to UI elements
            if (settings.numBalls) numBallsInput.value = settings.numBalls;
            if (settings.ballSize) ballSizeInput.value = settings.ballSize;
            if (settings.launchSpeed) launchSpeedInput.value = settings.launchSpeed;
            if (settings.gravity) gravityInput.value = settings.gravity;
            if (settings.elasticity) elasticityInput.value = settings.elasticity;
            if (settings.friction) frictionInput.value = settings.friction;
            if (settings.mainBallColor) mainBallColorPicker.value = settings.mainBallColor;
            if (settings.smallBallColor) smallBallColorPicker.value = settings.smallBallColor;
            if (settings.slowMotionFactor) {
                slowMotionSlider.value = settings.slowMotionFactor;
                updateSlowMotionDisplay();
            }
        }
    } catch (error) {
        console.error('Error loading saved settings:', error);
        // Continue with default values if there's an error
    }
}
