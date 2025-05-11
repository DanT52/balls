import { launchMainBall, resetSimulation } from './simulation.js';
import { isDarkMode, setDarkMode } from './script.js';
import { getSettingsFromURL, updateURL, applyPhysicsSettings} from './urlparsing.js';

// UI elements references

let gravityInput;
let elasticityInput;
let frictionInput;

let launchBtn;
let resetBtn;
let darkModeToggle;
let slowMotionSlider;
let slowMotionValue;
let toggleSettingsBtn;
let togglePhysicsBtn;
let physicsControlsPanel;

let addBallBtn;

// Keep track of ball panels
let ballPanels = [];
let currentBallId = 1;
let isBallPanelOpen = false;
// Setup UI controls and event listeners
export function setupUIControls() {

    gravityInput = document.getElementById('gravity');
    elasticityInput = document.getElementById('elasticity');
    frictionInput = document.getElementById('friction');

    launchBtn = document.getElementById('launch-btn');
    resetBtn = document.getElementById('reset-btn');
    darkModeToggle = document.getElementById('dark-mode-toggle');
    slowMotionSlider = document.getElementById('slow-motion');
    slowMotionValue = document.getElementById('slow-motion-value');
    toggleSettingsBtn = document.getElementById('toggle-settings');
    togglePhysicsBtn = document.getElementById('toggle-physics');

    physicsControlsPanel = document.getElementById('physics-panel');
    addBallBtn = document.getElementById('add-ball-btn');
    
    
    // Initialize dark mode first to prevent white flash
    initializeDarkMode();
    
    // Load settings with URL parameters taking priority over localStorage
    loadSavedSettings();
    
    // Add event listeners
    launchBtn.addEventListener('click', launchMainBall);
    resetBtn.addEventListener('click', resetSimulation);
    darkModeToggle.addEventListener('change', toggleDarkMode);
    toggleSettingsBtn.addEventListener('click', toggleBallSettingsPanel);
    togglePhysicsBtn.addEventListener('click', togglePhysicsPanel);
    
    // Add event listener for adding a new ball panel
    addBallBtn.addEventListener('click', () => {
        if (!isBallPanelOpen) {
            toggleBallSettingsPanel();
        }
        addNewBallPanel();
    });
    
    
    // Update slow motion display value
    slowMotionSlider.addEventListener('input', updateSlowMotionDisplay);
    

    // Add change listeners to save settings
    const inputElements = [
        gravityInput, elasticityInput, frictionInput,
        slowMotionSlider
    ];
    
    inputElements.forEach(input => {
        input.addEventListener('change', () => {
            saveSimulationSettings();
            updateURL(); // Update URL when physics settings change
        });
    });
    
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
function addNewBallPanel(e, DefaultSettings, open ="open") {
    currentBallId++;
    const ballId = currentBallId;
    
    
    let multiBallContainer = document.querySelector('.multi-ball-container');
    
    // If this is the first panel being added, ensure container exists
    if (!multiBallContainer) {
        multiBallContainer = document.createElement('div');
        multiBallContainer.className = 'multi-ball-container';
        document.body.appendChild(multiBallContainer);
    }
    
    // Create new ball panel
    const newBallPanel = document.createElement('div');
    newBallPanel.className = `controls ball-controls ball-panel-item ${open}`;
    newBallPanel.id = `ball-panel-${ballId}`;
    
    
    // Generate settings: use provided or default
    const ballSettings = DefaultSettings || getDefaultBallSettings(ballId);
   
    
    // Create panel content with the current count (not the ID)
    const count = ballPanels.length + 1;
    newBallPanel.innerHTML = generateBallPanelHTML(ballId, ballSettings, count);
    
    // Add the new panel to the container
    multiBallContainer.appendChild(newBallPanel);
    
    // Add to our ball panels array
    ballPanels.push({
        id: ballId,
        element: newBallPanel,
        settings: ballSettings,
        position: count
    });
    
    // Add event listeners to the new panel's inputs
    setupBallPanelListeners(newBallPanel, ballId);
    
    // Save the updated ball panels
    saveMultiBallSettings();
    
    // Scroll to the new panel - smooth scrolling for better UX
    setTimeout(() => {
        newBallPanel.scrollIntoView({ behavior: 'smooth', inline: 'end' });
    }, 100);
}

// Generate HTML for a ball panel
function generateBallPanelHTML(ballId, settings, position) {
    // If position is not provided, use the ID (for backward compatibility)
    const displayPosition = position || ballId;
    
    return `
        <div class="controls-header">
            <h3>Ball ${displayPosition}</h3>
            <button class="remove-ball-btn" data-ball-id="' + ballId + '">×</button>
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
        
        
        updateBallPositions();
        
        
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


// Update toggle button appearance
function updateToggleButton(button, isActive) {
    button.setAttribute('aria-expanded', isActive);
    button.classList.toggle('active', isActive);
}

// Toggle the ball settings panel visibility
function toggleBallSettingsPanel() {
    // toggle all panels
    const isAnyPanelOpen = ballPanels.some(panel => panel.element.classList.contains('open'));
    
    // Toggle all panels to the same state
    ballPanels.forEach(panel => {
        panel.element.classList.toggle('open', !isAnyPanelOpen);
    });
    
    //localStorage.setItem('ballsSimulationBallPanelOpen', !isAnyPanelOpen);
    updateToggleButton(toggleSettingsBtn, !isAnyPanelOpen);
    isBallPanelOpen = !isAnyPanelOpen;
    
    // Adjust positioning for mobile - ensure panels are visible when opened
    if (!isAnyPanelOpen) {
        const container = document.querySelector('.multi-ball-container');
        if (container && container.scrollLeft === 0 && container.children.length > 0) {
            container.children[0].scrollIntoView({ behavior: 'smooth', inline: 'start' });
        }
    }
}

// Toggle the physics panel visibility
function togglePhysicsPanel() {
    const isOpen = physicsControlsPanel.classList.toggle('open');
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
    
    // Update URL with new settings
    updateURL();
}

// Get current values from UI controls
export function getUIValues() { 
    const values = {
        gravity: parseFloat(gravityInput?.value || 0.3),
        elasticity: parseFloat(elasticityInput?.value || 0.6),
        friction: parseFloat(frictionInput?.value || 0.02),

        darkMode: darkModeToggle?.checked || true,
        slowMotionFactor: parseFloat(slowMotionSlider?.value || 0.5),
    };
    
    return values;
}

export function getBalls() {
    return ballPanels.map(panel => panel.settings);
}

// Load saved settings from localStorage or URL
function loadSavedSettings() {
    try {
        // First check for URL parameters
        const urlConfig = getSettingsFromURL();
        
        if (urlConfig && urlConfig.physics && urlConfig.balls) {
            // Apply physics settings from URL
            applyPhysicsSettings(urlConfig.physics);
            
            // Clear existing ball panels
            ballPanels.forEach(p => p.element?.remove());
            ballPanels = [];
            currentBallId = 0;
            
            // Create ball panels from URL settings
            if (Array.isArray(urlConfig.balls) && urlConfig.balls.length > 0) {
                urlConfig.balls.forEach(ballSettings => {
                    addNewBallPanel(null, ballSettings, "");
                });
                isBallPanelOpen = true;
                updateToggleButton(toggleSettingsBtn, true);
            } else {
                // If no balls in URL, add default ball
                addNewBallPanel();
            }
            return; // Skip localStorage loading
        }
        
        // If no URL config, load from localStorage as before
        const savedSettings = localStorage.getItem('ballsSimulationSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            if (settings.gravity && gravityInput) gravityInput.value = settings.gravity;
            if (settings.elasticity && elasticityInput) elasticityInput.value = settings.elasticity;
            if (settings.friction && frictionInput) frictionInput.value = settings.friction;
            if (settings.slowMotionFactor && slowMotionSlider) {
                slowMotionSlider.value = settings.slowMotionFactor;
                updateSlowMotionDisplay();
            }
        }
        
        // Load multi-ball settings
        loadMultiBallSettings();
        
        // Update URL to reflect loaded settings
        updateURL();
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
            // recreate balls if there was any
            if (ballSettings.length > 0) {

                // Create additional ball panels
                for (let i = 0; i < ballSettings.length; i++) {
                    addNewBallPanel(null, ballSettings[i], "")
                }
                
            }
        }
    } catch (error) {
        console.error('Error loading multi-ball settings:', error);
    }
}

// Save current simulation settings to localStorage
function saveSimulationSettings() {
    const settings = getUIValues();
    localStorage.setItem('ballsSimulationSettings', JSON.stringify(settings));
    
    // Update URL with new settings
    updateURL();
}
