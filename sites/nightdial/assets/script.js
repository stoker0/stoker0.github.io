/* ================= CONFIG ================= */

const SUPABASE_URL = "https://rdgeitiirgpufwugplfc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZ2VpdGlpcmdwdWZ3dWdwbGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTQxNzAsImV4cCI6MjA4NTAzMDE3MH0.-U9h7mI2i7Lf72n44zSDDk_y6Y1j-jfFroizpn-35gM";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* =============== LOCATION ================= */

const LOCATION_TTL = 1000 * 60 * 60 * 24; // 24h

async function getLocation() {
  const cached = JSON.parse(localStorage.getItem("nd_location"));
  if (cached && Date.now() - cached.time < LOCATION_TTL) {
    return cached;
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          time: Date.now()
        };
        localStorage.setItem("nd_location", JSON.stringify(loc));
        resolve(loc);
      },
      () => reject("Location required"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
}

/* =============== SUN TIMES ================= */

async function getSunTimes(lat, lon) {
  const res = await fetch(
    `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`
  );
  const data = await res.json();
  return {
    sunset: new Date(data.results.sunset),
    sunrise: new Date(data.results.sunrise)
  };
}

/* =============== NIGHT CHECK ================= */

function isNight(sunset, sunrise) {
  const now = new Date();
  return now > sunset || now < sunrise;
}

/* =============== COUNTDOWN ================= */

function startCountdown(nextTime) {
  const el = document.getElementById("countdown");

  setInterval(() => {
    const diff = nextTime - new Date();
    if (diff <= 0) location.reload();

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    el.textContent = `Next change in ${h}h ${m}m ${s}s`;
  }, 1000);
}

/* =============== USER ================= */

async function loadUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("username")
    .eq("id", session.user.id)
    .single();

  const bar = document.getElementById("userbar");
  bar.innerHTML = `
    online as <b>${profile.username}</b> ·
    <a href="#" id="logout">logout</a>
  `;

  document.getElementById("logout").onclick = async () => {
    await supabaseClient.auth.signOut();
    location.href = "login.html";
  };
}

/* =============== INIT ================= */

async function initNightDial() {
  try {
    const loc = await getLocation();
    const { sunset, sunrise } = await getSunTimes(loc.lat, loc.lon);

    const night = isNight(sunset, sunrise);
    const next = night ? sunrise : sunset;

    document.getElementById("status").textContent =
      night ? "NightDial is awake." : "NightDial is sleeping.";

    startCountdown(next);
  } catch {
    document.body.innerHTML = `
      <div class="wrap">
        <h2>Location Required</h2>
        <p>NightDial needs your location to know when night begins.</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  loadUser();
}