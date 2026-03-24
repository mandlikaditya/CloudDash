# CloudDash

A responsive cloud infrastructure monitoring dashboard built with vanilla HTML, CSS, and JavaScript.

## Features

### JavaScript Features
- **Real-Time Animated Charts** — Uses the HTML5 Canvas API to render live-updating CPU and memory usage line charts and a traffic-by-region donut chart. Data is simulated and scrolls in real time.
- **Dynamic Search & Filtering** — Two-layer filtering combines a text search (across server names, IPs, regions, and instance types) with a status dropdown. Results update instantly via DOM manipulation.
- **Dark/Light Theme Toggle** — Switches between dark and light themes using CSS custom properties and the [data-theme] attribute. User preference is saved in localStorage and persists across sessions.
- **Toast Notification System** — Infrastructure alerts slide in from the right with CSS animations and auto-dismiss after 5 seconds. New alerts are periodically simulated to demonstrate real-time notifications.

### CSS Highlights
- CSS custom properties for full theme support
- CSS Grid and Flexbox-based responsive layouts
- Keyframe animations (fadeSlide, pulse, toastIn, toastOut)
- Smooth transitions on hover, focus, and state changes
- Responsive design with media queries for tablet and mobile
- Glassmorphism effects and custom scrollbar styling

## Tech Stack
- HTML5
- CSS3
- JavaScript (ES6+)
- No external frameworks or libraries

## Getting Started

Clone the repository:
```bash
git clone https://github.com/mandlikaditya/CloudDash.git
```

Open `index.html` in a web browser.

No build tools or dependencies required.

## Project Structure
```
├── index.html    # Main HTML structure
├── styles.css    # All styles, theming, and responsive layout
└── app.js        # Application logic and interactive features
```

## Hosting

This is a static site and can be deployed to any hosting platform:
- GitHub Pages
- Netlify
- Vercel
- Any web server serving static files