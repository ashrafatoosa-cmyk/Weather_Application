// Open-Meteo APIs (No API key required)
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// DOM Elements
const countryInput = document.getElementById('country-search');
const cityInput = document.getElementById('city-search');
const suggestionsList = document.getElementById('search-results');
const weatherCard = document.getElementById('weather-card');
const loadingSpinner = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Weather DOM Elements
const locationNameEl = document.getElementById('location-name');
const currentDateEl = document.getElementById('current-date');
const tempValueEl = document.getElementById('temp-value');
const weatherDescEl = document.getElementById('weather-desc');
const windSpeedEl = document.getElementById('wind-speed');
const humidityEl = document.getElementById('humidity');
const feelsLikeEl = document.getElementById('feels-like');
const weatherIconEl = document.getElementById('weather-icon');

// Debounce helper
let debounceTimer;
const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
};

// Handle Input Changes
function handleSearchInput() {
    const country = countryInput.value.trim();
    const city = cityInput.value.trim();

    let query = '';
    if (city.length > 0 && country.length > 0) {
        query = `${city}, ${country}`;
    } else if (city.length > 0) {
        query = city;
    } else if (country.length > 0) {
        query = country;
    }

    if (query.length < 2) {
        suggestionsList.classList.add('hidden');
        return;
    }

    debounce(() => fetchSuggestions(query, country), 400);
}

countryInput.addEventListener('input', handleSearchInput);
cityInput.addEventListener('input', handleSearchInput);

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!countryInput.contains(e.target) && !cityInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.classList.add('hidden');
    }
});

// Fetch City Suggestions
async function fetchSuggestions(query, countryFilter) {
    try {
        const response = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(query)}&count=10&language=en&format=json`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            let filteredResults = data.results;

            if (countryFilter && countryFilter.length >= 2) {
                const lowerCountry = countryFilter.toLowerCase();
                const exactMatches = filteredResults.filter(city => city.country && city.country.toLowerCase().includes(lowerCountry));
                if (exactMatches.length > 0) {
                    filteredResults = exactMatches;
                }
            }

            displaySuggestions(filteredResults.slice(0, 5));
        } else {
            suggestionsList.classList.add('hidden');
        }
    } catch (error) {
        console.error("Geocoding API error:", error);
    }
}

// Display Suggestions
function displaySuggestions(results) {
    suggestionsList.innerHTML = '';

    results.forEach(city => {
        const li = document.createElement('li');

        let flag = '';
        if (city.country_code) {
            flag = city.country_code.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
        }

        const stateInfo = city.admin1 ? `, ${city.admin1}` : '';

        li.innerHTML = `
            <span class="country-flag">${flag}</span>
            <div class="suggestion-details">
                <div class="suggestion-city">${city.name}${stateInfo}</div>
                <div class="suggestion-country">${city.country}</div>
            </div>
        `;

        li.addEventListener('click', () => {
            countryInput.value = city.country;
            cityInput.value = city.name;
            suggestionsList.classList.add('hidden');
            fetchWeather(city.latitude, city.longitude, city.name, city.country);
        });

        suggestionsList.appendChild(li);
    });

    suggestionsList.className = 'suggestions-list glass';
    suggestionsList.classList.remove('hidden');
}

// Fetch Weather Data
async function fetchWeather(lat, lon, cityName, countryName) {
    hideError();
    weatherCard.classList.remove('show');
    weatherCard.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
            timezone: 'auto'
        });

        const response = await fetch(`${WEATHER_API}?${params.toString()}`);
        if (!response.ok) throw new Error('Weather data unavailable');

        const data = await response.json();
        updateWeatherUI(data.current, cityName, countryName);
    } catch (error) {
        showError(error.message);
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

// Map Weather Codes to Styles
function getWeatherInfo(code) {
    const timeOfDay = new Date().getHours() > 6 && new Date().getHours() < 19 ? "day" : "night";

    const weatherCodes = {
        0: { desc: 'Clear sky', icon: timeOfDay === 'day' ? 'fa-sun' : 'fa-moon', color: timeOfDay === 'day' ? ['#4facfe', '#00f2fe'] : ['#29323c', '#485563'] },
        1: { desc: 'Mainly clear', icon: timeOfDay === 'day' ? 'fa-cloud-sun' : 'fa-cloud-moon', color: timeOfDay === 'day' ? ['#4facfe', '#00f2fe'] : ['#29323c', '#485563'] },
        2: { desc: 'Partly cloudy', icon: timeOfDay === 'day' ? 'fa-cloud-sun' : 'fa-cloud-moon', color: ['#89f7fe', '#66a6ff'] },
        3: { desc: 'Overcast', icon: 'fa-cloud', color: ['#cfd9df', '#e2ebf0'] },
        45: { desc: 'Fog', icon: 'fa-smog', color: ['#bdc3c7', '#2c3e50'] },
        48: { desc: 'Depositing rime fog', icon: 'fa-smog', color: ['#bdc3c7', '#2c3e50'] },
        51: { desc: 'Light drizzle', icon: 'fa-cloud-rain', color: ['#a1c4fd', '#c2e9fb'] },
        53: { desc: 'Moderate drizzle', icon: 'fa-cloud-rain', color: ['#89f7fe', '#66a6ff'] },
        55: { desc: 'Dense drizzle', icon: 'fa-cloud-showers-heavy', color: ['#4facfe', '#00f2fe'] },
        61: { desc: 'Slight rain', icon: 'fa-cloud-rain', color: ['#a1c4fd', '#c2e9fb'] },
        63: { desc: 'Moderate rain', icon: 'fa-cloud-showers-heavy', color: ['#667eea', '#764ba2'] },
        65: { desc: 'Heavy rain', icon: 'fa-cloud-showers-water', color: ['#667eea', '#764ba2'] },
        71: { desc: 'Slight snow fall', icon: 'fa-snowflake', color: ['#e0c3fc', '#8ec5fc'] },
        73: { desc: 'Moderate snow fall', icon: 'fa-snowflake', color: ['#c2e9fb', '#a1c4fd'] },
        75: { desc: 'Heavy snow fall', icon: 'fa-snowflake', color: ['#89f7fe', '#66a6ff'] },
        77: { desc: 'Snow grains', icon: 'fa-snowflake', color: ['#e0c3fc', '#8ec5fc'] },
        80: { desc: 'Slight rain showers', icon: 'fa-cloud-rain', color: ['#8fd3f4', '#84fab0'] },
        81: { desc: 'Moderate rain showers', icon: 'fa-cloud-showers-heavy', color: ['#43e97b', '#38f9d7'] },
        82: { desc: 'Violent rain showers', icon: 'fa-cloud-showers-heavy', color: ['#0ba360', '#3cba92'] },
        95: { desc: 'Thunderstorm', icon: 'fa-cloud-bolt', color: ['#30cfd0', '#330867'] },
        96: { desc: 'Thunderstorm with slight hail', icon: 'fa-cloud-bolt', color: ['#30cfd0', '#330867'] },
        99: { desc: 'Thunderstorm with heavy hail', icon: 'fa-cloud-bolt', color: ['#16222a', '#3a6073'] }
    };

    return weatherCodes[code] || { desc: 'Unknown', icon: 'fa-cloud', color: ['#a8edea', '#fed6e3'] };
}

// Update DOM
function updateWeatherUI(current, city, country) {
    locationNameEl.textContent = `${city}, ${country}`;

    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    currentDateEl.textContent = now.toLocaleDateString('en-US', options);

    tempValueEl.textContent = Math.round(current.temperature_2m);
    windSpeedEl.textContent = `${current.wind_speed_10m} km/h`;
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;

    const weatherInfo = getWeatherInfo(current.weather_code);

    weatherDescEl.textContent = weatherInfo.desc;
    weatherIconEl.innerHTML = `<i class="fa-solid ${weatherInfo.icon}"></i>`;

    // Apply weather colorful theme to the icon
    weatherIconEl.style.setProperty('--icon-start', weatherInfo.color[0]);
    weatherIconEl.style.setProperty('--icon-end', weatherInfo.color[1]);

    weatherCard.classList.remove('hidden');
    setTimeout(() => {
        weatherCard.classList.add('show');
    }, 50);
}

function showError(msg) {
    errorText.textContent = msg;
    errorMessage.classList.remove('hidden');
    errorMessage.classList.add('glass');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    // Hidden initially
    weatherCard.classList.add('hidden');
});
