// Color utilities
export function hexToRgb(hex) {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

export function createShade(baseColor, variation) {
    // Convert hex to rgb
    const rgb = hexToRgb(baseColor);
    
    // Create a shade by adjusting each channel
    // The variation parameter should be between -0.5 and 0.5
    let r = Math.round(rgb.r + (variation * 100));
    let g = Math.round(rgb.g + (variation * 100));
    let b = Math.round(rgb.b + (variation * 100));
    
    // Ensure values are within 0-255
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Random color generator - now creates shades of selected color
export function getRandomColor() {
    const smallBallColorPicker = document.getElementById('small-ball-color');
    
    if (smallBallColorPicker) {
        const baseColor = smallBallColorPicker.value;
        // Create a random variation between -0.4 and 0.4
        const variation = (Math.random() * 0.8) - 0.4;
        return createShade(baseColor, variation);
    } else {
        // Fallback to original random colors
        const colors = [
            '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
            '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', 
            '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', 
            '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
