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
let toggleSettingsBtn;
let togglePhysicsBtn;
let ballControlsPanel;
let physicsControlsPanel;
let launchSideSelect;
let launchAngleInput;
let launchAngleValue;

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
    toggleSettingsBtn = document.getElementById('toggle-settings');
    togglePhysicsBtn = document.getElementById('toggle-physics');
    ballControlsPanel = document.getElementById('ball-panel');
    physicsControlsPanel = document.getElementById('physics-panel');
    launchSideSelect = document.getElementById('launch-side');
    launchAngleInput = document.getElementById('launch-angle');
    launchAngleValue = document.getElementById('launch-angle-value');
    
    // Initialize components with default values in case they don't exist
    if (!launchSideSelect) {
        console.warn("Launch side select not found in DOM");
        // Create a default launch side select if not found
        const controlsBody = document.querySelector('.controls-body');
        if (controlsBody && !document.getElementById('launch-side')) {
            const launchSideDiv = document.createElement('div');
            launchSideDiv.innerHTML = `
                <label for="launch-side">Launch side:</label>
                <select id="launch-side">
                    <option value="left" selected>Left</option>
                    <option value="right">Right</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                </select>
            `;
            const launchSpeedElement = document.getElementById('launch-speed');
            if (launchSpeedElement) {
                launchSpeedElement.parentNode.after(launchSideDiv);
            } else {
                controlsBody.appendChild(launchSideDiv);
            }
            launchSideSelect = document.getElementById('launch-side');
        }
    }
    
    if (!launchAngleInput) console.warn("Launch angle input not found in DOM");
    if (!launchAngleValue) console.warn("Launch angle value not found in DOM");
    
    // Initialize dark mode first to prevent white flash
    initializeDarkMode();
    
    // Load saved settings if they exist
    loadSavedSettings();
    
    // Add event listeners
    launchBtn.addEventListener('click', launchMainBall);
    resetBtn.addEventListener('click', resetSimulation);
    darkModeToggle.addEventListener('change', toggleDarkMode);
    toggleSettingsBtn.addEventListener('click', toggleBallSettingsPanel);
    togglePhysicsBtn.addEventListener('click', togglePhysicsPanel);
    
    // Update slow motion display value
    slowMotionSlider.addEventListener('input', updateSlowMotionDisplay);
    
    // Update launch angle display value
    if (launchAngleInput) {
        launchAngleInput.addEventListener('input', updateLaunchAngleDisplay);
        // Initialize the display value
        updateLaunchAngleDisplay();
    }
    
    // Add change listeners to save settings
    const inputElements = [
        numBallsInput, ballSizeInput, launchSpeedInput,
        gravityInput, elasticityInput, frictionInput,
        mainBallColorPicker, smallBallColorPicker,
        slowMotionSlider, launchSideSelect, launchAngleInput
    ];
    
    inputElements.forEach(input => {
        input.addEventListener('change', saveSimulationSettings);
    });
    
    // Initialize panels state
    initializePanels();
}

// Initialize panels based on saved state
function initializePanels() {
    const isBallPanelOpen = localStorage.getItem('ballsSimulationBallPanelOpen') === 'true';
    const isPhysicsPanelOpen = localStorage.getItem('ballsSimulationPhysicsPanelOpen') === 'true';
    
    ballControlsPanel.classList.toggle('open', isBallPanelOpen);
    physicsControlsPanel.classList.toggle('open', isPhysicsPanelOpen);
    
    updateToggleButton(toggleSettingsBtn, isBallPanelOpen);
    updateToggleButton(togglePhysicsBtn, isPhysicsPanelOpen);
}

// Update toggle button appearance
function updateToggleButton(button, isActive) {
    button.setAttribute('aria-expanded', isActive);
    button.classList.toggle('active', isActive);
}

// Toggle the ball settings panel visibility
function toggleBallSettingsPanel() {
    const isOpen = ballControlsPanel.classList.toggle('open');
    localStorage.setItem('ballsSimulationBallPanelOpen', isOpen);
    updateToggleButton(toggleSettingsBtn, isOpen);
    
    // Close the other panel if this one is opening
    if (isOpen && physicsControlsPanel.classList.contains('open')) {
        physicsControlsPanel.classList.remove('open');
        localStorage.setItem('ballsSimulationPhysicsPanelOpen', false);
        updateToggleButton(togglePhysicsBtn, false);
    }
}

// Toggle the physics panel visibility
function togglePhysicsPanel() {
    const isOpen = physicsControlsPanel.classList.toggle('open');
    localStorage.setItem('ballsSimulationPhysicsPanelOpen', isOpen);
    updateToggleButton(togglePhysicsBtn, isOpen);
    
    // Close the other panel if this one is opening
    if (isOpen && ballControlsPanel.classList.contains('open')) {
        ballControlsPanel.classList.remove('open');
        localStorage.setItem('ballsSimulationBallPanelOpen', false);
        updateToggleButton(toggleSettingsBtn, false);
    }
}

// Initialize dark mode with a default of true (dark)
function initializeDarkMode() {
    const savedDarkMode = localStorage.getItem('ballsSimulationDarkMode');
    const isDark = savedDarkMode === null ? true : savedDarkMode === 'true';
    darkModeToggle.checked = isDark;
    setDarkMode(isDark);
}

function toggleDarkMode(e) {
    const isDark = e.target.checked;
    setDarkMode(isDark);
    localStorage.setItem('ballsSimulationDarkMode', isDark);
}

// Update the displayed value for slow motion
function updateSlowMotionDisplay() {
    const value = slowMotionSlider.value;
    const displayValue = parseFloat((value)).toFixed(1) + 'x';
    slowMotionValue.textContent = displayValue;
}

// Update the displayed value for launch angle
function updateLaunchAngleDisplay() {
    const value = launchAngleInput.value;
    let sign = parseInt(value) > 0 ? "+" : ""; // Add plus sign for positive values for clarity
    if (parseInt(value) === 0) sign = ""; // No sign for zero
    launchAngleValue.textContent = sign + value + '°';
}

// Get current values from UI controls
export function getUIValues() {
    const values = {
        numBalls: parseInt(numBallsInput?.value || 70),
        ballSize: parseInt(ballSizeInput?.value || 100),
        launchSpeed: parseInt(launchSpeedInput?.value || 15),
        gravity: parseFloat(gravityInput?.value || 0.3),
        elasticity: parseFloat(elasticityInput?.value || 0.6),
        friction: parseFloat(frictionInput?.value || 0.02),
        mainBallColor: mainBallColorPicker?.value || '#FF5252',
        smallBallColor: smallBallColorPicker?.value || '#448AFF',
        darkMode: darkModeToggle?.checked || true,
        slowMotionFactor: parseFloat(slowMotionSlider?.value || 0.5),
        launchSide: launchSideSelect?.value || 'left',
        launchAngle: parseInt(launchAngleInput?.value || 0)
    };
    
    return values;
}

// Load saved settings from localStorage
function loadSavedSettings() {
    try {
        // Dark mode is now handled by initializeDarkMode function
        
        // Load other simulation settings
        const savedSettings = localStorage.getItem('ballsSimulationSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Apply saved values to UI elements with null checks
            if (settings.numBalls && numBallsInput) numBallsInput.value = settings.numBalls;
            if (settings.ballSize && ballSizeInput) ballSizeInput.value = settings.ballSize;
            if (settings.launchSpeed && launchSpeedInput) launchSpeedInput.value = settings.launchSpeed;
            if (settings.gravity && gravityInput) gravityInput.value = settings.gravity;
            if (settings.elasticity && elasticityInput) elasticityInput.value = settings.elasticity;
            if (settings.friction && frictionInput) frictionInput.value = settings.friction;
            if (settings.mainBallColor && mainBallColorPicker) mainBallColorPicker.value = settings.mainBallColor;
            if (settings.smallBallColor && smallBallColorPicker) smallBallColorPicker.value = settings.smallBallColor;
            if (settings.slowMotionFactor && slowMotionSlider) {
                slowMotionSlider.value = settings.slowMotionFactor;
                updateSlowMotionDisplay();
            }
            if (settings.launchSide && launchSideSelect) launchSideSelect.value = settings.launchSide;
            if (settings.launchAngle !== undefined && launchAngleInput) {
                // Check if the saved value is in the old range (greater than 90)
                if (settings.launchAngle > 90) {
                    // Convert from old range to new range
                    settings.launchAngle = settings.launchAngle - 180;
                }
                launchAngleInput.value = settings.launchAngle;
                updateLaunchAngleDisplay();
            }
        }
    } catch (error) {
        console.error('Error loading saved settings:', error);
    }
}
