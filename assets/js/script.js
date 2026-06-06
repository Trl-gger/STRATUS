/* ==========================================================================
   STRATUS — Weather App JavaScript Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Elements Selection
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const typedSpan = document.querySelector('.autocomplete-typed');
  const ghostSpan = document.querySelector('.autocomplete-ghost');
  const autocompleteOverlay = document.querySelector('.autocomplete-overlay');
  
  const unitToggle = document.getElementById('unit-toggle');
  const recentSearchesContainer = document.getElementById('recent-searches');
  
  const loadingSpinner = document.getElementById('loading-spinner');
  const errorMessagePanel = document.getElementById('error-message');
  const errorTextEl = document.getElementById('error-text');
  
  const weatherCard = document.getElementById('weather-card');
  const cityNameEl = document.getElementById('city-name');
  const countryNameEl = document.getElementById('country-name');
  const weatherEmojiEl = document.getElementById('weather-emoji');
  const currentTempEl = document.getElementById('current-temp');
  const weatherDescEl = document.getElementById('weather-desc');
  const feelsLikeValEl = document.getElementById('feels-like-val');
  const humidityValEl = document.getElementById('humidity-val');
  const windValEl = document.getElementById('wind-val');

  // 2. Application State
  let currentUnit = localStorage.getItem('stratus_unit') || 'C';
  let rawData = null; // Stores weather data in Celsius for client-side toggling
  let activeSuggestion = null; // Current selected autocomplete city object
  let debounceTimeout = null;
  let recentSearches = JSON.parse(localStorage.getItem('stratus_recent') || '[]');

  // 3. WMO Weather Code to Slovak Emoji & Label Mapper
  function mapWmoCode(code) {
    // 0: Jasno
    if (code === 0) return { emoji: '☀️', text: 'Jasno' };
    // 1–3: Čiastočne oblačno
    if (code >= 1 && code <= 3) return { emoji: '🌤️', text: 'Čiastočne oblačno' };
    // 45–48: Hmla
    if (code >= 45 && code <= 48) return { emoji: '🌫️', text: 'Hmla' };
    // 51–67: Dážď
    if (code >= 51 && code <= 67) return { emoji: '🌧️', text: 'Dážď' };
    // 71–77: Sneh
    if (code >= 71 && code <= 77) return { emoji: '❄️', text: 'Sneh' };
    // 80–82: Prehánky
    if (code >= 80 && code <= 82) return { emoji: '🌦️', text: 'Prehánky' };
    // 95–99: Búrka
    if (code >= 95 && code <= 99) return { emoji: '⛈️', text: 'Búrka' };
    
    return { emoji: '❓', text: 'Neznáme počasie' };
  }

  // 4. Utility Functions
  function convertToFahrenheit(celsius) {
    return (celsius * 9) / 5 + 32;
  }

  function clearGhostText() {
    ghostSpan.textContent = '';
    activeSuggestion = null;
  }

  function showLoading() {
    loadingSpinner.classList.remove('hidden');
  }

  function hideLoading() {
    loadingSpinner.classList.add('hidden');
  }

  function showError(msg) {
    errorTextEl.textContent = msg;
    errorMessagePanel.classList.remove('hidden');
  }

  function hideError() {
    errorMessagePanel.classList.add('hidden');
  }

  function showWeatherCard() {
    weatherCard.classList.remove('hidden');
  }

  const hideWeatherCard = () => {
    weatherCard.classList.add('hidden');
  };

  // 5. Autocomplete Functionality
  function syncOverlayScroll() {
    autocompleteOverlay.scrollLeft = searchInput.scrollLeft;
  }

  searchInput.addEventListener('scroll', syncOverlayScroll);

  searchInput.addEventListener('input', () => {
    const val = searchInput.value;
    typedSpan.textContent = val.replace(/ /g, '\u00A0');
    clearGhostText();
    syncOverlayScroll();

    clearTimeout(debounceTimeout);
    if (!val.trim()) {
      return;
    }

    debounceTimeout = setTimeout(() => {
      fetchSuggestions(val.trim());
    }, 300);
  });

  async function fetchSuggestions(query) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      // Ensure the query matches current input to prevent race conditions
      const currentVal = searchInput.value;
      if (currentVal.trim().toLowerCase() !== query.toLowerCase()) {
        return;
      }

      if (data.results && data.results.length > 0) {
        const queryLower = currentVal.toLowerCase();
        // Find the first result that matches prefix case-insensitively
        const match = data.results.find(r => r.name.toLowerCase().startsWith(queryLower));
        
        if (match) {
          activeSuggestion = match;
          // Set suffix (e.g. input "lon" -> match "London" -> suffix "don")
          const suffix = match.name.slice(currentVal.length);
          ghostSpan.textContent = suffix;
          typedSpan.textContent = currentVal.replace(/ /g, '\u00A0');
          syncOverlayScroll();
          return;
        }
      }
      clearGhostText();
    } catch (e) {
      clearGhostText();
    }
  }

  // 6. Keyboard & Mouse Search Actions
  searchInput.addEventListener('keydown', (e) => {
    // Autocomplete with Tab or Right Arrow
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && activeSuggestion && ghostSpan.textContent) {
      // If ArrowRight, only autocomplete when cursor is at the end of the text
      if (e.key === 'ArrowRight') {
        if (searchInput.selectionStart !== searchInput.value.length) {
          return;
        }
      }
      e.preventDefault();
      searchInput.value = activeSuggestion.name;
      clearGhostText();
      typedSpan.textContent = searchInput.value.replace(/ /g, '\u00A0');
      syncOverlayScroll();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch(searchInput.value);
    }
  });

  searchButton.addEventListener('click', () => {
    triggerSearch(searchInput.value);
  });

  // 7. API Integration (Search & Weather Fetch)
  async function triggerSearch(query) {
    if (!query || !query.trim()) return;
    query = query.trim();

    // Reset autocomplete UI
    clearGhostText();
    typedSpan.textContent = query.replace(/ /g, '\u00A0');

    // Blur input
    searchInput.blur();

    showLoading();
    hideError();
    hideWeatherCard();

    try {
      // Step A: Geocoding lookup
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) {
        throw new Error('network_error');
      }

      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        showError('Mesto sa nenašlo. Skús iný názov.');
        return;
      }

      // Select top result
      const city = geoData.results[0];
      const lat = city.latitude;
      const lon = city.longitude;
      const cityName = city.name;
      const countryName = city.country || '';

      // Step B: Weather forecast fetch
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) {
        throw new Error('network_error');
      }

      const weatherData = await weatherRes.json();
      const current = weatherData.current;

      if (!current) {
        throw new Error('data_error');
      }

      // Store weather data locally (always raw Celsius values)
      rawData = {
        tempC: current.temperature_2m,
        feelsC: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        cityName: cityName,
        countryName: countryName,
        weatherCode: current.weather_code
      };

      // Sync UI
      renderWeather();
      addToRecent(cityName, countryName);

    } catch (error) {
      console.error(error);
      showError('Nepodarilo sa načítať dáta. Skontroluj pripojenie.');
    } finally {
      hideLoading();
    }
  }

  // 8. Render Current Weather Card
  function renderWeather() {
    if (!rawData) return;

    cityNameEl.textContent = rawData.cityName;
    countryNameEl.textContent = rawData.countryName;

    const wmo = mapWmoCode(rawData.weatherCode);
    weatherEmojiEl.textContent = wmo.emoji;
    weatherDescEl.textContent = wmo.text;

    humidityValEl.textContent = Math.round(rawData.humidity);
    windValEl.textContent = Math.round(rawData.windSpeed);

    let temp = rawData.tempC;
    let feels = rawData.feelsC;

    if (currentUnit === 'F') {
      temp = convertToFahrenheit(temp);
      feels = convertToFahrenheit(feels);
    }

    currentTempEl.textContent = Math.round(temp);
    feelsLikeValEl.textContent = Math.round(feels);

    // Update Celsius/Fahrenheit units across labels
    document.querySelectorAll('.temp-unit').forEach(el => {
      el.textContent = `°${currentUnit}`;
    });

    showWeatherCard();
  }

  // 9. °C / °F Unit Toggle sliding behavior
  function updateToggleUI() {
    if (currentUnit === 'F') {
      unitToggle.classList.add('fahrenheit');
      unitToggle.setAttribute('aria-checked', 'true');
    } else {
      unitToggle.classList.remove('fahrenheit');
      unitToggle.setAttribute('aria-checked', 'false');
    }
  }

  unitToggle.addEventListener('click', () => {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    localStorage.setItem('stratus_unit', currentUnit);
    updateToggleUI();
    renderWeather();
  });

  unitToggle.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      unitToggle.click();
    }
  });

  // 10. Recent Searches Storage Manager
  function addToRecent(city, country) {
    const searchString = country ? `${city}, ${country}` : city;
    
    // Remove duplicates to push this item to the top
    recentSearches = recentSearches.filter(s => s.toLowerCase() !== searchString.toLowerCase());
    
    // Insert at front
    recentSearches.unshift(searchString);

    // Caps size to 5
    if (recentSearches.length > 5) {
      recentSearches = recentSearches.slice(0, 5);
    }

    localStorage.setItem('stratus_recent', JSON.stringify(recentSearches));
    renderRecentTags();
  }

  function renderRecentTags() {
    recentSearchesContainer.innerHTML = '';
    const section = document.querySelector('.recent-searches-section');

    if (recentSearches.length === 0) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');

    recentSearches.forEach(searchString => {
      const tag = document.createElement('button');
      // Adding both recent-tag styling and glass-panel structural classes
      tag.className = 'recent-tag glass-panel';
      tag.textContent = searchString;
      
      tag.addEventListener('click', () => {
        searchInput.value = searchString;
        triggerSearch(searchString);
      });

      recentSearchesContainer.appendChild(tag);
    });
  }

  // 11. Initial Startup
  function init() {
    updateToggleUI();
    renderRecentTags();
    
    // Load first item of recent search or auto-load a default city (Bratislava) to welcome the user
    if (recentSearches.length > 0) {
      triggerSearch(recentSearches[0]);
    } else {
      triggerSearch('Bratislava');
    }
  }

  init();
});
