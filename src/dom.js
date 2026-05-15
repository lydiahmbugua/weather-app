import { getWeather, toggleMode, toggleTemp, cToF, fToC } from "./logic.js";

let query =
  "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";
let restQuery = "?unitGroup=us&key=6B5TK9BPQXR9PVSAK29FAVJXD&contentType=json";
let isLight = true;
let isCelcius = false;
let lastTempF = null;
let lastFeelsLikeF = null;
let isFlipped = false;

// --- Search history & streak ---
let searchHistory = [];
let uniqueCities = new Set();

const container = document.querySelector(".container");

// ── Dark mode toggle ──────────────────────────────────────────────
const switchButton = document.createElement("button");
switchButton.classList.add("switch", "icon-btn");
switchButton.setAttribute("aria-label", "Toggle dark mode");
switchButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>`;

switchButton.addEventListener("click", () => {
  isLight = toggleMode(isLight);
  document.body.classList.toggle("dark", !isLight);
  switchButton.classList.toggle("active", !isLight);
});

// ── Search bar ────────────────────────────────────────────────────
const inputDiv = document.createElement("div");
inputDiv.classList.add("search-bar");

const cityInput = document.createElement("input");
cityInput.type = "text";
cityInput.placeholder = "Paris, Tokyo, Nairobi…";

const searchBtn = document.createElement("button");
searchBtn.classList.add("search-btn");
searchBtn.setAttribute("aria-label", "Search");
searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>`;

const tempButton = document.createElement("button");
tempButton.classList.add("temp-btn");
tempButton.textContent = "°F";

// ── City streak badge ─────────────────────────────────────────────
const streakBadge = document.createElement("span");
streakBadge.classList.add("streak-badge");
streakBadge.style.display = "none";

// ── Display area ──────────────────────────────────────────────────
const display = document.createElement("div");
display.classList.add("display");

// Weather particles canvas
const particlesEl = document.createElement("div");
particlesEl.classList.add("weather-particles");
display.appendChild(particlesEl);

const loader = document.createElement("div");
loader.classList.add("loader");
loader.innerHTML = `
  <div class="loader-blobs">
    <div class="blob blob1"></div>
    <div class="blob blob2"></div>
    <div class="blob blob3"></div>
  </div>
  <p class="loader-text">Fetching the skies…</p>`;

// ── Flip card for temperature ─────────────────────────────────────
const flipCardWrapper = document.createElement("div");
flipCardWrapper.classList.add("flip-card");
flipCardWrapper.setAttribute("title", "Click to see feels-like");

const flipInner = document.createElement("div");
flipInner.classList.add("flip-inner");

const flipFront = document.createElement("div");
flipFront.classList.add("flip-face", "flip-front");

const flipBack = document.createElement("div");
flipBack.classList.add("flip-face", "flip-back");

flipInner.append(flipFront, flipBack);
flipCardWrapper.appendChild(flipInner);

flipCardWrapper.addEventListener("click", () => {
  if (lastTempF === null) return;
  isFlipped = !isFlipped;
  flipInner.classList.toggle("flipped", isFlipped);
});

// ── Weather card ──────────────────────────────────────────────────
const weatherCard = document.createElement("div");
weatherCard.classList.add("weather-card");

const cardHeader = document.createElement("div");
cardHeader.classList.add("card-header");

const cityName = document.createElement("p");
cityName.classList.add("city-name");

cardHeader.appendChild(cityName);

const conditionWrap = document.createElement("div");
conditionWrap.classList.add("condition-wrap");

const weatherEmoji = document.createElement("span");
weatherEmoji.classList.add("weather-emoji");

const conditionText = document.createElement("p");
conditionText.classList.add("condition-text");

const timeDisplay = document.createElement("p");
timeDisplay.classList.add("time-display");

conditionWrap.append(weatherEmoji, conditionText);
weatherCard.append(cardHeader, conditionWrap, flipCardWrapper, timeDisplay);
display.append(loader, weatherCard);

// ── History pills row ─────────────────────────────────────────────
const historyRow = document.createElement("div");
historyRow.classList.add("history-row");

// ── Helpers ───────────────────────────────────────────────────────
function conditionToEmoji(condition = "") {
  const c = condition.toLowerCase();
  if (c.includes("snow")) return "❄️";
  if (c.includes("rain") || c.includes("drizzle")) return "🌧️";
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("fog") || c.includes("mist")) return "🌫️";
  if (c.includes("overcast") || c.includes("cloud")) return "☁️";
  if (c.includes("partly")) return "⛅";
  if (c.includes("clear") || c.includes("sun")) return "☀️";
  if (c.includes("wind")) return "💨";
  return "🌡️";
}

// Returns CSS custom property values for the weather-reactive gradient
function conditionToGradient(condition = "") {
  const c = condition.toLowerCase();
  if (c.includes("snow"))
    return {
      from: "#d6e8f5",
      to: "#bdd4e8",
      dark_from: "#1a2535",
      dark_to: "#0f1820",
    };
  if (c.includes("rain") || c.includes("drizzle"))
    return {
      from: "#c5cfe0",
      to: "#9aafc8",
      dark_from: "#151c2a",
      dark_to: "#0a1019",
    };
  if (c.includes("thunder") || c.includes("storm"))
    return {
      from: "#b8b0cc",
      to: "#7a6e99",
      dark_from: "#1a1525",
      dark_to: "#0d0a18",
    };
  if (c.includes("fog") || c.includes("mist"))
    return {
      from: "#d8d4cc",
      to: "#b8b2a8",
      dark_from: "#1e1c1a",
      dark_to: "#111010",
    };
  if (c.includes("overcast") || c.includes("cloud"))
    return {
      from: "#d4d8e0",
      to: "#b0b8c8",
      dark_from: "#181c20",
      dark_to: "#0e1014",
    };
  if (c.includes("partly"))
    return {
      from: "#e8dfc8",
      to: "#d4c898",
      dark_from: "#201c12",
      dark_to: "#14110a",
    };
  if (c.includes("clear") || c.includes("sun"))
    return {
      from: "#f5e8cc",
      to: "#f0d080",
      dark_from: "#241c08",
      dark_to: "#160f04",
    };
  if (c.includes("wind"))
    return {
      from: "#cce8e0",
      to: "#90c8b8",
      dark_from: "#0e1c18",
      dark_to: "#081410",
    };
  return {
    from: "#f0ebe3",
    to: "#e0d8cc",
    dark_from: "#0e0c0a",
    dark_to: "#1c1814",
  };
}

// Spawn weather particles based on condition
function spawnParticles(condition = "") {
  particlesEl.innerHTML = "";
  particlesEl.className = "weather-particles";

  const c = condition.toLowerCase();
  let type = null;
  if (c.includes("rain") || c.includes("drizzle")) type = "rain";
  else if (c.includes("snow")) type = "snow";
  else if (c.includes("fog") || c.includes("mist")) type = "fog";

  if (!type) return;
  particlesEl.classList.add(`particles-${type}`);

  const count = type === "fog" ? 6 : 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.classList.add("particle");
    p.style.setProperty("--x", `${Math.random() * 100}%`);
    p.style.setProperty("--delay", `${(Math.random() * 2).toFixed(2)}s`);
    p.style.setProperty("--dur", `${(0.8 + Math.random() * 1.2).toFixed(2)}s`);
    p.style.setProperty("--size", `${2 + Math.random() * 3}px`);
    particlesEl.appendChild(p);
  }
}

function updateTempDisplays() {
  if (lastTempF === null) return;
  const mainTemp = isCelcius ? fToC(lastTempF) : lastTempF + " °F";
  const feelsTemp =
    lastFeelsLikeF !== null
      ? isCelcius
        ? fToC(lastFeelsLikeF)
        : lastFeelsLikeF + " °F"
      : "—";

  flipFront.innerHTML = `<p class="temp-display">${mainTemp}</p>`;
  flipBack.innerHTML = `<p class="temp-display feels-label">Feels like<br><span>${feelsTemp}</span></p>`;
}

function updateHistoryPills() {
  historyRow.innerHTML = "";
  if (searchHistory.length === 0) return;
  searchHistory.forEach((city) => {
    const pill = document.createElement("button");
    pill.classList.add("history-pill");
    pill.textContent = city;
    pill.addEventListener("click", () => {
      cityInput.value = city;
      handleSearch();
    });
    historyRow.appendChild(pill);
  });
}

function updateStreakBadge() {
  const count = uniqueCities.size;
  if (count < 2) {
    streakBadge.style.display = "none";
    return;
  }
  streakBadge.style.display = "inline-flex";
  streakBadge.textContent = `🌍 ×${count}`;
}

// ── Main search handler ───────────────────────────────────────────
async function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) {
    cityInput.classList.add("shake");
    setTimeout(() => cityInput.classList.remove("shake"), 500);
    return;
  }

  loader.classList.add("visible");
  weatherCard.classList.remove("visible");
  weatherCard.classList.add("hidden");
  display.classList.add("loading");
  isFlipped = false;
  flipInner.classList.remove("flipped");

  cityInput.value = "";

  try {
    const url = query + encodeURIComponent(city) + restQuery;
    const data = await getWeather(url);

    // Reactive background
    const grad = conditionToGradient(data.title);
    document.documentElement.style.setProperty(
      "--bg",
      isLight ? grad.from : grad.dark_from,
    );
    document.documentElement.style.setProperty(
      "--surface",
      isLight ? grad.to : grad.dark_to,
    );

    // Particles
    spawnParticles(data.title);

    cityName.textContent = data.address.toUpperCase();
    conditionText.textContent = data.title;
    weatherEmoji.textContent = conditionToEmoji(data.title);
    timeDisplay.textContent = `Local time: ${data.time}`;

    lastTempF = data.temperature;
    lastFeelsLikeF = data.feelslike ?? null;
    updateTempDisplays();

    // History
    const normalised = data.address.split(",")[0].trim();
    searchHistory = [
      normalised,
      ...searchHistory.filter((c) => c !== normalised),
    ].slice(0, 5);
    uniqueCities.add(normalised.toLowerCase());
    updateHistoryPills();
    updateStreakBadge();

    loader.classList.remove("visible");
    display.classList.remove("loading");
    weatherCard.classList.remove("hidden");
    weatherCard.classList.add("visible");
  } catch (err) {
    loader.classList.remove("visible");
    display.classList.remove("loading");
    weatherCard.classList.remove("hidden");
    weatherCard.classList.add("visible");
    cityName.textContent = "Oops!";
    conditionText.textContent = "City not found or API error.";
    weatherEmoji.textContent = "🤷";
    flipFront.innerHTML = `<p class="temp-display"></p>`;
    flipBack.innerHTML = `<p class="temp-display feels-label"></p>`;
    timeDisplay.textContent = "";
    particlesEl.innerHTML = "";
  }
}

// ── Event listeners ───────────────────────────────────────────────
searchBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleSearch();
});
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

tempButton.addEventListener("click", () => {
  isCelcius = toggleMode(isCelcius);
  tempButton.textContent = isCelcius ? "°C" : "°F";
  updateTempDisplays();
});

// ── Assemble DOM ──────────────────────────────────────────────────
inputDiv.append(cityInput, searchBtn, tempButton, streakBadge, switchButton);
container.append(inputDiv, historyRow, display);

export default container;
