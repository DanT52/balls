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
let addBallBtn;

// Keep track of ball panels
let ballPanels = [];
let currentBallId = 1;

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
    addBallBtn = document.getElementById('add-ball-btn');
    
    // Initialize the first ball panel
    initializeFirstBallPanel();
    
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
    
    // Add event listener for adding a new ball panel
    if (addBallBtn) {
        addBallBtn.addEventListener('click', addNewBallPanel);
    }
    
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

// Initialize the first ball panel
function initializeFirstBallPanel() {
    if (ballControlsPanel) {
        // Get the value from the existing num-balls input for the first panel
        const existingNumBalls = numBallsInput ? parseInt(numBallsInput.value) : 70;
        
        const defaultSettings = getDefaultBallSettings(1);
        // Use the existing value in the DOM for the first panel
        defaultSettings.numBalls = existingNumBalls;
        
        ballPanels.push({
            id: 1,
            element: ballControlsPanel,
            settings: defaultSettings,
            position: 1
        });
    }
}

// Get default ball settings by ID
function getDefaultBallSettings(ballId) {
    return {
        id: ballId,
        ballSize: 100,
        numBalls: 70, // Add default small ball count
        launchSpeed: 15,
        launchSide: 'left',
        launchAngle: 0,
        mainBallColor: getRandomColor(),
        smallBallColor: getRandomColor()
    };
}

// Generate a random color for new balls
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Add a new ball panel
function addNewBallPanel() {
    currentBallId++;
    const ballId = currentBallId;
    
    // Create container for multiple ball panels if it doesn't exist
    let multiBallContainer = document.querySelector('.multi-ball-container');
    if (!multiBallContainer) {
        multiBallContainer = document.createElement('div');
        multiBallContainer.className = 'multi-ball-container';
        document.body.appendChild(multiBallContainer);
        
        // Update the title of the first ball panel to be consistent
        const firstBallHeader = ballPanels[0].element.querySelector('.controls-header h3');
        if (firstBallHeader) {
            firstBallHeader.textContent = 'Ball 1';
        }
        
        // Move the first ball panel into the container
        if (ballPanels.length > 0) {
            const firstBallPanel = ballPanels[0].element;
            firstBallPanel.classList.add('ball-panel-item');
            multiBallContainer.appendChild(firstBallPanel);
        }
    }
    
    // Create new ball panel
    const newBallPanel = document.createElement('div');
    newBallPanel.className = 'controls ball-controls ball-panel-item open';
    newBallPanel.id = `ball-panel-${ballId}`;
    
    // Generate new ball settings
    const defaultSettings = getDefaultBallSettings(ballId);
    
    // Create panel content with the current count (not the ID)
    const count = ballPanels.length + 1;
    newBallPanel.innerHTML = generateBallPanelHTML(ballId, defaultSettings, count);
    
    // Add the new panel to the container
    multiBallContainer.appendChild(newBallPanel);
    
    // Add to our ball panels array
    ballPanels.push({
        id: ballId,
        element: newBallPanel,
        settings: defaultSettings,
        position: count
    });
    
    // Add event listeners to the new panel's inputs
    setupBallPanelListeners(newBallPanel, ballId);
    
    // Save the updated ball panels
    saveMultiBallSettings();
}

// Generate HTML for a ball panel
function generateBallPanelHTML(ballId, settings, position) {
    // If position is not provided, use the ID (for backward compatibility)
    const displayPosition = position || ballId;
    
    return `
        <div class="controls-header">
            <h3>Ball ${displayPosition}</h3>
            ${displayPosition > 1 ? '<button class="remove-ball-btn" data-ball-id="' + ballId + '">×</button>' : ''}
        </div>
        <div class="controls-body" data-ball-id="${ballId}">
            <div>
                <label for="ball-size-${ballId}">Ball size:</label>
                <input type="number" id="ball-size-${ballId}" class="ball-size" min="20" max="100" value="${settings.ballSize}">
            </div>
            <div>
                <label for="num-balls-${ballId}">Small balls:</label>
                <input type="number" id="num-balls-${ballId}" class="num-balls" min="2" max="30" value="${settings.numBalls || 70}">
            </div>
            <div>
                <label for="launch-speed-${ballId}">Launch speed:</label>
                <input type="number" id="launch-speed-${ballId}" class="launch-speed" min="1" max="20" value="${settings.launchSpeed}">
            </div>
            <div>
                <label for="launch-side-${ballId}">Launch side:</label>
                <select id="launch-side-${ballId}" class="launch-side">
                    <option value="left" ${settings.launchSide === 'left' ? 'selected' : ''}>Left</option>
                    <option value="right" ${settings.launchSide === 'right' ? 'selected' : ''}>Right</option>
                    <option value="top" ${settings.launchSide === 'top' ? 'selected' : ''}>Top</option>
                    <option value="bottom" ${settings.launchSide === 'bottom' ? 'selected' : ''}>Bottom</option>
                </select>
            </div>
            <div>
                <label for="launch-angle-${ballId}">Launch angle (°):</label>
                <input type="range" id="launch-angle-${ballId}" class="launch-angle" min="-90" max="90" value="${settings.launchAngle}" step="5">
                <span id="launch-angle-value-${ballId}" class="slider-value">${settings.launchAngle}°</span>
            </div>
            <div>
                <label for="main-ball-color-${ballId}">Ball color:</label>
                <input type="color" id="main-ball-color-${ballId}" class="main-ball-color" value="${settings.mainBallColor}">
            </div>
            <div>
                <label for="small-ball-color-${ballId}">Small balls color:</label>
                <input type="color" id="small-ball-color-${ballId}" class="small-ball-color" value="${settings.smallBallColor}">
            </div>
        </div>
    `;
}

// Setup listeners for a new ball panel
function setupBallPanelListeners(panelElement, ballId) {
    // Setup launch angle input listener
    const launchAngleInput = panelElement.querySelector(`#launch-angle-${ballId}`);
    const launchAngleValue = panelElement.querySelector(`#launch-angle-value-${ballId}`);
    
    if (launchAngleInput && launchAngleValue) {
        launchAngleInput.addEventListener('input', function() {
            updateLaunchAngleDisplayById(ballId);
        });
        // Initialize display
        updateLaunchAngleDisplayById(ballId);
    }
    
    // Setup remove button listener
    const removeBtn = panelElement.querySelector(`.remove-ball-btn`);
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            removeBallPanel(ballId);
        });
    }
    
    // Add change listeners to save settings
    const inputElements = panelElement.querySelectorAll('input, select');
    inputElements.forEach(input => {
        input.addEventListener('change', saveMultiBallSettings);
    });
}

// Remove a ball panel
function removeBallPanel(ballId) {
    // Find the panel in our array
    const panelIndex = ballPanels.findIndex(panel => panel.id === ballId);
    
    if (panelIndex !== -1) {
        // Remove from DOM
        const panel = ballPanels[panelIndex].element;
        panel.remove();
        
        // Remove from array
        ballPanels.splice(panelIndex, 1);
        
        // If only one panel is left, move it back to its original position
        if (ballPanels.length === 1) {
            const multiBallContainer = document.querySelector('.multi-ball-container');
            if (multiBallContainer) {
                const lastPanel = ballPanels[0].element;
                
                // Reset the title of the first ball panel when it's alone
                const firstBallHeader = lastPanel.querySelector('.controls-header h3');
                if (firstBallHeader) {
                    firstBallHeader.textContent = 'Ball';
                }
                
                lastPanel.classList.remove('ball-panel-item');
                document.body.appendChild(lastPanel);
                multiBallContainer.remove();
            }
        } else {
            // Update the position numbers for all remaining panels
            updateBallPositions();
        }
        
        // Save updated settings
        saveMultiBallSettings();
    }
}

// Update the display position numbers for all ball panels
function updateBallPositions() {
    const multiBallContainer = document.querySelector('.multi-ball-container');
    if (!multiBallContainer) return;
    
    // Get all panels in DOM order
    const panelElements = Array.from(multiBallContainer.querySelectorAll('.ball-controls'));
    
    // Update each panel with its new position
    panelElements.forEach((element, index) => {
        const position = index + 1;
        const header = element.querySelector('.controls-header h3');
        if (header) {
            header.textContent = `Ball ${position}`;
        }
        
        // Update the position in our data structure
        const panelData = ballPanels.find(panel => panel.element === element);
        if (panelData) {
            panelData.position = position;
        }
    });
}

// Update launch angle display for a specific ball panel
function updateLaunchAngleDisplayById(ballId) {
    const launchAngleInput = document.getElementById(`launch-angle-${ballId}`);
    const launchAngleValue = document.getElementById(`launch-angle-value-${ballId}`);
    
    if (launchAngleInput && launchAngleValue) {
        const value = launchAngleInput.value;
        let sign = parseInt(value) > 0 ? "+" : "";
        if (parseInt(value) === 0) sign = "";
        launchAngleValue.textContent = sign + value + '°';
    }
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
    // For multi-ball setups, toggle all panels
    const multiBallContainer = document.querySelector('.multi-ball-container');
    if (multiBallContainer) {
        const isAnyPanelOpen = ballPanels.some(panel => panel.element.classList.contains('open'));
        
        // Toggle all panels to the same state
        ballPanels.forEach(panel => {
            panel.element.classList.toggle('open', !isAnyPanelOpen);
        });
        
        localStorage.setItem('ballsSimulationBallPanelOpen', !isAnyPanelOpen);
        updateToggleButton(toggleSettingsBtn, !isAnyPanelOpen);
    } else {
        // Original behavior for single panel
        const isOpen = ballControlsPanel.classList.toggle('open');
        localStorage.setItem('ballsSimulationBallPanelOpen', isOpen);
        updateToggleButton(toggleSettingsBtn, isOpen);
    }
}

// Toggle the physics panel visibility
function togglePhysicsPanel() {
    const isOpen = physicsControlsPanel.classList.toggle('open');
    localStorage.setItem('ballsSimulationPhysicsPanelOpen', isOpen);
    updateToggleButton(togglePhysicsBtn, isOpen);
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

// Save multiple ball settings
function saveMultiBallSettings() {
    // Update each ball panel's settings object
    ballPanels.forEach(panel => {
        const id = panel.id;
        const ballSize = document.getElementById(`ball-size-${id}`)?.value || panel.settings.ballSize;
        const numBalls = document.getElementById(`num-balls-${id}`)?.value || panel.settings.numBalls;
        const launchSpeed = document.getElementById(`launch-speed-${id}`)?.value || panel.settings.launchSpeed;
        const launchSide = document.getElementById(`launch-side-${id}`)?.value || panel.settings.launchSide;
        const launchAngle = document.getElementById(`launch-angle-${id}`)?.value || panel.settings.launchAngle;
        const mainBallColor = document.getElementById(`main-ball-color-${id}`)?.value || panel.settings.mainBallColor;
        const smallBallColor = document.getElementById(`small-ball-color-${id}`)?.value || panel.settings.smallBallColor;
        
        panel.settings = {
            id,
            ballSize: parseInt(ballSize),
            numBalls: parseInt(numBalls),
            launchSpeed: parseInt(launchSpeed),
            launchSide,
            launchAngle: parseInt(launchAngle),
            mainBallColor,
            smallBallColor
        };
    });
    
    // Save to localStorage
    try {
        localStorage.setItem('ballsSimulationMultiBall', JSON.stringify(ballPanels.map(p => p.settings)));
    } catch (error) {
        console.error('Error saving multi-ball settings:', error);
    }
    
    // Also save to regular simulation settings for backwards compatibility
    saveSimulationSettings();
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
        launchAngle: parseInt(launchAngleInput?.value || 0),
        multiBalls: ballPanels.map(panel => panel.settings)
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
        
        // Load multi-ball settings
        loadMultiBallSettings();
    } catch (error) {
        console.error('Error loading saved settings:', error);
    }
}

// Load multiple ball settings from localStorage
function loadMultiBallSettings() {
    try {
        const savedMultiBall = localStorage.getItem('ballsSimulationMultiBall');
        if (savedMultiBall) {
            const ballSettings = JSON.parse(savedMultiBall);
            
            // Only recreate panels if there are more than one ball settings
            if (ballSettings.length > 1) {
                // Get the saved panel visibility state (default to false - closed)
                const isPanelOpen = localStorage.getItem('ballsSimulationBallPanelOpen') === 'true';
                
                // Create container for multiple ball panels
                let multiBallContainer = document.querySelector('.multi-ball-container');
                if (!multiBallContainer) {
                    multiBallContainer = document.createElement('div');
                    multiBallContainer.className = 'multi-ball-container';
                    document.body.appendChild(multiBallContainer);
                }
                
                // Update the title of the first ball panel to show position
                const firstBallHeader = ballControlsPanel.querySelector('.controls-header h3');
                if (firstBallHeader) {
                    firstBallHeader.textContent = 'Ball 1';
                }
                
                // Create the first panel using existing DOM element
                ballPanels[0].settings = ballSettings[0];
                
                // Move the first ball panel into the container
                ballControlsPanel.classList.add('ball-panel-item');
                
                // Don't add the 'open' class if the panels should be closed initially
                if (!isPanelOpen) {
                    ballControlsPanel.classList.remove('open');
                }
                
                // Move to the container
                multiBallContainer.appendChild(ballControlsPanel);
                
                // Create additional ball panels
                for (let i = 1; i < ballSettings.length; i++) {
                    currentBallId = Math.max(currentBallId, ballSettings[i].id);
                    const ballId = ballSettings[i].id;
                    
                    // Create new ball panel
                    const newBallPanel = document.createElement('div');
                    // Only add 'open' class if the panels should be visible
                    newBallPanel.className = `controls ball-controls ball-panel-item ${isPanelOpen ? 'open' : ''}`;
                    newBallPanel.id = `ball-panel-${ballId}`;
                    
                    // Create panel content
                    const position = i + 1;
                    newBallPanel.innerHTML = generateBallPanelHTML(ballId, ballSettings[i], position);
                    
                    // Add the new panel to the container
                    multiBallContainer.appendChild(newBallPanel);
                    
                    // Add to our ball panels array
                    ballPanels.push({
                        id: ballId,
                        element: newBallPanel,
                        settings: ballSettings[i],
                        position: position
                    });
                    
                    // Setup event listeners
                    setupBallPanelListeners(newBallPanel, ballId);
                    
                    // Apply saved settings
                    const sizeInput = newBallPanel.querySelector(`#ball-size-${ballId}`);
                    const numBallsInput = newBallPanel.querySelector(`#num-balls-${ballId}`);
                    const speedInput = newBallPanel.querySelector(`#launch-speed-${ballId}`);
                    const sideSelect = newBallPanel.querySelector(`#launch-side-${ballId}`);
                    const angleInput = newBallPanel.querySelector(`#launch-angle-${ballId}`);
                    const mainColorInput = newBallPanel.querySelector(`#main-ball-color-${ballId}`);
                    const smallColorInput = newBallPanel.querySelector(`#small-ball-color-${ballId}`);
                    
                    if (sizeInput) sizeInput.value = ballSettings[i].ballSize;
                    if (numBallsInput) numBallsInput.value = ballSettings[i].numBalls || 70;
                    if (speedInput) speedInput.value = ballSettings[i].launchSpeed;
                    if (sideSelect) sideSelect.value = ballSettings[i].launchSide;
                    if (angleInput) {
                        angleInput.value = ballSettings[i].launchAngle;
                        updateLaunchAngleDisplayById(ballId);
                    }
                    if (mainColorInput) mainColorInput.value = ballSettings[i].mainBallColor;
                    if (smallColorInput) smallColorInput.value = ballSettings[i].smallBallColor;
                }
                
                // Make sure all positions are updated correctly
                updateBallPositions();
                
                // Update the toggle button state
                updateToggleButton(toggleSettingsBtn, isPanelOpen);
            }
        }
    } catch (error) {
        console.error('Error loading multi-ball settings:', error);
    }
}
