# Accessibility Features for Visual Disabilities

Based on WCAG 2.1 guidelines and research from Guaraná Technologies

## Features Implemented

### 1. High Contrast Mode
- **Black background** (#000000) with **white text** (#ffffff)
- **Yellow borders** (#ffff00) on interactive elements
- **Cyan links** (#00ffff) with underline
- **Magenta focus rings** (#ff00ff) with 4px thickness
- Meets WCAG AAA contrast requirements (7:1 minimum)

### 2. Large Text Mode
- **120% base font size** increase
- Minimum touch target: **56px** (up from 44px)
- Increased heading sizes for better readability
- Enhanced input field sizes

### 3. Reduced Motion Mode
- Disables all animations and transitions
- Respects `prefers-reduced-motion` system preference
- Instant state changes instead of animated transitions

### 4. Screen Reader Support
- Skip to main content link (keyboard accessible)
- Proper heading hierarchy (H1 → H2 → H3)
- ARIA labels on all interactive elements
- `aria-expanded` for dropdown menus
- `aria-live` regions for dynamic content
- `role` attributes for custom widgets

### 5. Visual Enhancements
- Focus indicators with high visibility
- Touch targets minimum 44px (56px in large text mode)
- Clear error states with color + icon + text
- Status messages that don't rely solely on color

## How to Use

1. Click the **Eye icon** in the top navigation bar
2. Toggle any of the three accessibility modes:
   - **High Contrast**: Black/yellow high visibility theme
   - **Large Text**: Bigger fonts and touch targets
   - **Reduced Motion**: Disable animations
3. Settings persist across sessions (saved in localStorage)

## Keyboard Shortcuts

- Press **Tab** to navigate through interactive elements
- **Enter/Space** to activate buttons and links
- **Escape** to close modals and dropdowns
- **Skip Link**: Press Tab on page load to see "Skip to main content"

## WCAG Compliance

- ✅ **Perceivable**: Text alternatives, captions, color contrast
- ✅ **Operable**: Keyboard accessible, enough time, seizures
- ✅ **Understandable**: Readable, predictable, input assistance
- ✅ **Robust**: Compatible with assistive technologies

## Testing

Tested with:
- Keyboard-only navigation
- Screen readers (VoiceOver, NVDA)
- High contrast mode (Windows HC themes)
- Browser zoom up to 200%
- Color blindness simulators
