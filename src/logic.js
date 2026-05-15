async function getWeather(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Network response was not ok");
  const data = await response.json();
  const weatherData = {
    title: data.currentConditions.conditions,
    address: data.address,
    temperature: data.currentConditions.temp,
    feelslike: data.currentConditions.feelslike,
    cloudCover: data.currentConditions.cloudcover,
    time: data.currentConditions.datetime,
  };
  return weatherData;
}

function toggleMode(mode) {
  return !mode;
}

function fToC(temp) {
  return (((temp - 32) * 5) / 9).toFixed(1) + " °C";
}

function cToF(temp) {
  return ((temp * 9) / 5 + 32).toFixed(1) + " °F";
}

export { getWeather, toggleMode, fToC, cToF };
