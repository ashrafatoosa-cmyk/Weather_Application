# Aurora Weather Application

A beautiful, simple, and responsive weather application built with vanilla HTML, CSS, and JavaScript.

## Features
- **Dynamic Search:** Intelligent dual inputs for Country and City with live autocomplete suggestions.
- **Real-Time Weather Data:** Fast and accurate local condition reporting powered by the open-source [Open-Meteo API](https://open-meteo.com/).
- **Premium Design Aesthetics:** Stunning animated gradient backgrounds, sleek glassmorphism UI elements, and dynamic icons that adjust cleanly to light or dark themes.
- **Fully Responsive:** Works seamlessly across desktop, tablet, and mobile browsers.

## Technologies Used
- **HTML5:** Semantic structuring.
- **CSS3:** Modern design techniques including CSS Variables, Flexbox/Grid layouts, and CSS Keyframe Animations.
- **Vanilla JavaScript (ES6+):** Pure browser JS using the Fetch API, Async/Await routines, and DOM manipulation.
- **FontAwesome:** Scalable vector icons for weather states.

## How to Run Locally
Because this project uses plain HTML/CSS/JS without any bundled node dependencies, you don't need a complex setup environment to use it.
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/ashrafatoosa-cmyk/Weather_Application.git
   ```
2. Open the `index.html` file natively in any modern web browser.
3. Enjoy checking the weather!

## API Information
This project uniquely utilizes the Open-Meteo API suite which does not require any API registration tokens for its free public tier:
- Geocoding API (`https://geocoding-api.open-meteo.com/v1/search`)
- Weather Forecast API (`https://api.open-meteo.com/v1/forecast`)
