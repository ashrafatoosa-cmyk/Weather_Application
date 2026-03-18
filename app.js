// Open-Meteo APIs (No API key required) and Countries API
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const COUNTRIES_API = 'https://countriesnow.space/api/v0.1/countries';

// Background Slider Images
const bgImages = [
    'https://images.unsplash.com/photo-1504608524841-42ce6c20a016?q=80&w=2070&auto=format&fit=crop', // Lightning
    'https://images.unsplash.com/photo-1464617260814-2fc5f75e2f5b?q=80&w=2070&auto=format&fit=crop', // Sun/clouds
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2070&auto=format&fit=crop', // Rain
    'https://images.unsplash.com/photo-1478719059408-592965bf249b?q=80&w=2070&auto=format&fit=crop', // Snow
    'https://images.unsplash.com/photo-1423209086112-be2e4afcebf1?q=80&w=2102&auto=format&fit=crop'  // Fog
];

// DOM Elements
const countrySelect = document.getElementById('country-select');
const citySelect = document.getElementById('city-select');
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

let countriesData = [];

// Fetch Countries on load
async function fetchCountries() {
    try {
        const response = await fetch(COUNTRIES_API);
        const data = await response.json();
        
        if (!data.error) {
            countriesData = data.data;
            // Sort alphabetically naturally
            countriesData.sort((a,b) => a.country.localeCompare(b.country));
            
            countriesData.forEach(item => {
                const option = document.createElement('option');
                option.value = item.country;
                option.textContent = item.country;
                countrySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Failed to load countries:", error);
    }
}

// Setup Event Listeners
countrySelect.addEventListener('change', (e) => {
    const selectedCountry = e.target.value;
    citySelect.innerHTML = '<option value="">Select City</option>'; // reset
    citySelect.disabled = true;
    
    if (selectedCountry) {
        const countryInfo = countriesData.find(c => c.country === selectedCountry);
        if (countryInfo && countryInfo.cities.length > 0) {
            // Sort cities alphabetically
            const cities = countryInfo.cities.sort();
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
            citySelect.disabled = false;
        }
    }
});

citySelect.addEventListener('change', async (e) => {
    const selectedCity = e.target.value;
    const selectedCountry = countrySelect.value;
    
    if (selectedCity && selectedCountry) {
        // Find coordinates with Geocoding API
        try {
            loadingSpinner.classList.remove('hidden');
            weatherCard.classList.add('hidden');
            hideError();
            
            const query = `${selectedCity}, ${selectedCountry}`;
            const response = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const location = data.results[0];
                fetchWeather(location.latitude, location.longitude, location.name, location.country);
            } else {
                showError("Location not found visually. Try another city.");
                loadingSpinner.classList.add('hidden');
            }
        } catch (err) {
            showError("Error finding location coordinates.");
            loadingSpinner.classList.add('hidden');
        }
    }
});

// Initialize slider logic
function initSlider() {
    const sliderContainer = document.getElementById('bg-slider');
    if (!sliderContainer) return;
    
    bgImages.forEach((img, index) => {
        const slide = document.createElement('div');
        slide.className = `slide ${index === 0 ? 'active' : ''}`;
        slide.style.backgroundImage = `url('${img}')`;
        sliderContainer.appendChild(slide);
    });

    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 6000); // 6 seconds per slide
    }
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

// // Map Weather Codes to Styles and Particles
function getWeatherInfo(code) {
    const timeOfDay = new Date().getHours() > 6 && new Date().getHours() < 19 ? "day" : "night";
    
    // Particle types: 'none', 'rain', 'leaves'
    const weatherCodes = {
        0: { desc: 'Clear sky', icon: timeOfDay === 'day' ? 'fa-sun' : 'fa-moon', color: timeOfDay === 'day' ? ['#4facfe', '#00f2fe'] : ['#29323c', '#485563'], particles: 'none' },
        1: { desc: 'Mainly clear', icon: timeOfDay === 'day' ? 'fa-cloud-sun' : 'fa-cloud-moon', color: timeOfDay === 'day' ? ['#4facfe', '#00f2fe'] : ['#29323c', '#485563'], particles: 'none' },
        2: { desc: 'Partly cloudy', icon: timeOfDay === 'day' ? 'fa-cloud-sun' : 'fa-cloud-moon', color: ['#89f7fe', '#66a6ff'], particles: 'none' },
        3: { desc: 'Overcast', icon: 'fa-cloud', color: ['#cfd9df', '#e2ebf0'], particles: 'none' },
        45: { desc: 'Fog', icon: 'fa-smog', color: ['#bdc3c7', '#2c3e50'], particles: 'none' },
        48: { desc: 'Depositing rime fog', icon: 'fa-smog', color: ['#bdc3c7', '#2c3e50'], particles: 'none' },
        51: { desc: 'Light drizzle', icon: 'fa-cloud-rain', color: ['#a1c4fd', '#c2e9fb'], particles: 'rain' },
        53: { desc: 'Moderate drizzle', icon: 'fa-cloud-rain', color: ['#89f7fe', '#66a6ff'], particles: 'rain' },
        55: { desc: 'Dense drizzle', icon: 'fa-cloud-showers-heavy', color: ['#4facfe', '#00f2fe'], particles: 'rain' },
        61: { desc: 'Slight rain', icon: 'fa-cloud-rain', color: ['#a1c4fd', '#c2e9fb'], particles: 'rain' },
        63: { desc: 'Moderate rain', icon: 'fa-cloud-showers-heavy', color: ['#667eea', '#764ba2'], particles: 'rain' },
        65: { desc: 'Heavy rain', icon: 'fa-cloud-showers-water', color: ['#667eea', '#764ba2'], particles: 'rain' },
        71: { desc: 'Slight snow fall', icon: 'fa-snowflake', color: ['#e0c3fc', '#8ec5fc'], particles: 'none' },
        73: { desc: 'Moderate snow fall', icon: 'fa-snowflake', color: ['#c2e9fb', '#a1c4fd'], particles: 'none' },
        75: { desc: 'Heavy snow fall', icon: 'fa-snowflake', color: ['#89f7fe', '#66a6ff'], particles: 'none' },
        77: { desc: 'Snow grains', icon: 'fa-snowflake', color: ['#e0c3fc', '#8ec5fc'], particles: 'none' },
        80: { desc: 'Slight rain showers', icon: 'fa-cloud-rain', color: ['#8fd3f4', '#84fab0'], particles: 'rain' },
        81: { desc: 'Moderate rain showers', icon: 'fa-cloud-showers-heavy', color: ['#43e97b', '#38f9d7'], particles: 'rain' },
        82: { desc: 'Violent rain showers', icon: 'fa-cloud-showers-heavy', color: ['#0ba360', '#3cba92'], particles: 'rain' },
        95: { desc: 'Thunderstorm', icon: 'fa-cloud-bolt', color: ['#30cfd0', '#330867'], particles: 'rain' },
        96: { desc: 'Thunderstorm with slight hail', icon: 'fa-cloud-bolt', color: ['#30cfd0', '#330867'], particles: 'rain' },
        99: { desc: 'Thunderstorm with heavy hail', icon: 'fa-cloud-bolt', color: ['#16222a', '#3a6073'], particles: 'rain' }
    };
    
    // Add leaf particles for specific autumn contexts (e.g., cloudy/windy days)
    let info = weatherCodes[code] || { desc: 'Unknown', icon: 'fa-cloud', color: ['#a8edea', '#fed6e3'], particles: 'none' };
    if (info.particles === 'none' && (code === 3 || code === 2)) {
        info.particles = 'leaves';
    }
    
    return info;
}

// Particle System
let particleInterval;
function createParticles(type) {
    const container = document.getElementById('particles-container');
    container.innerHTML = '';
    clearInterval(particleInterval);
    
    if (type === 'none') return;
    
    particleInterval = setInterval(() => {
        const particle = document.createElement('div');
        particle.className = `particle ${type === 'rain' ? 'rain-drop' : 'leaf'}`;
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDuration = (Math.random() * 2 + (type === 'rain' ? 0.5 : 3)) + 's';
        particle.style.opacity = Math.random();
        
        container.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            particle.remove();
        }, 6000);
    }, type === 'rain' ? 50 : 300);
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
    
    // Apply particles
    createParticles(weatherInfo.particles);
    
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
    initSlider();
    fetchCountries();
    createParticles('leaves'); // Start with appealing default
    weatherCard.classList.add('hidden');
});
