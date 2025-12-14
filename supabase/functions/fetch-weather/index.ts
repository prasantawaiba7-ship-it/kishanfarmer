import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Open-Meteo API - free weather API, no key required
const OPEN_METEO_API = "https://api.open-meteo.com/v1/forecast";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, days = 7 } = await req.json();

    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    console.log(`Fetching weather for: ${latitude}, ${longitude}`);

    const url = new URL(OPEN_METEO_API);
    url.searchParams.set("latitude", latitude.toString());
    url.searchParams.set("longitude", longitude.toString());
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max");
    url.searchParams.set("forecast_days", days.toString());
    url.searchParams.set("timezone", "Asia/Kolkata");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();

    // Weather code to description mapping
    const weatherDescriptions: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail"
    };

    // Format current weather
    const current = {
      temperature: data.current?.temperature_2m,
      humidity: data.current?.relative_humidity_2m,
      precipitation: data.current?.precipitation,
      windSpeed: data.current?.wind_speed_10m,
      weatherCode: data.current?.weather_code,
      description: weatherDescriptions[data.current?.weather_code] || "Unknown"
    };

    // Format forecast
    const forecast = [];
    if (data.daily) {
      for (let i = 0; i < data.daily.time.length; i++) {
        forecast.push({
          date: data.daily.time[i],
          tempMax: data.daily.temperature_2m_max[i],
          tempMin: data.daily.temperature_2m_min[i],
          precipitation: data.daily.precipitation_sum[i],
          precipitationProbability: data.daily.precipitation_probability_max[i],
          windSpeedMax: data.daily.wind_speed_10m_max[i]
        });
      }
    }

    // Calculate farming-relevant metrics
    const avgTemp = forecast.reduce((sum, day) => sum + (day.tempMax + day.tempMin) / 2, 0) / forecast.length;
    const totalRainfall = forecast.reduce((sum, day) => sum + (day.precipitation || 0), 0);
    const rainyDays = forecast.filter(day => (day.precipitation || 0) > 1).length;

    // Farming advisory based on weather
    let farmingAdvisory = [];
    
    if (totalRainfall > 100) {
      farmingAdvisory.push("Heavy rainfall expected. Avoid irrigation and ensure proper drainage.");
    } else if (totalRainfall < 5) {
      farmingAdvisory.push("Low rainfall expected. Plan for supplemental irrigation.");
    }

    if (avgTemp > 35) {
      farmingAdvisory.push("High temperatures expected. Consider mulching and morning irrigation.");
    } else if (avgTemp < 15) {
      farmingAdvisory.push("Cool weather ahead. Good for rabi crops like wheat and mustard.");
    }

    if (current.weatherCode === 95 || current.weatherCode === 96 || current.weatherCode === 99) {
      farmingAdvisory.push("⚠️ Thunderstorm warning. Protect crops and avoid field work.");
    }

    return new Response(JSON.stringify({
      success: true,
      current,
      forecast,
      summary: {
        averageTemperature: avgTemp.toFixed(1),
        totalExpectedRainfall: totalRainfall.toFixed(1),
        rainyDays
      },
      farmingAdvisory,
      coordinates: { latitude, longitude },
      fetchedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Weather fetch error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
