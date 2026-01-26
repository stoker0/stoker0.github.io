/* ========= CONFIG ========= */

const SUPABASE_URL = "https://rdgeitiirgpufwugplfc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZ2VpdGlpcmdwdWZ3dWdwbGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTQxNzAsImV4cCI6MjA4NTAzMDE3MH0.-U9h7mI2i7Lf72n44zSDDk_y6Y1j-jfFroizpn-35gM";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function loadUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("username, role")
    .eq("id", session.user.id)
    .single();

  if (!profile) return;

  const bar = document.createElement("div");
  bar.className = "nav";
  bar.innerHTML = `
    <span>online as <b>${profile.username}</b></span>
    · <a href="#" id="logoutBtn">logout</a>
  `;

  document.body.prepend(bar);

  document.getElementById("logoutBtn").onclick = async () => {
    await supabaseClient.auth.signOut();
    location.href = "login.html";
  };
}

async function requireLogin() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) location.href = "login.html";
}

/* ========= TIME ========= */

let isAdminOverride = localStorage.getItem("nd_admin_override") === "true";

function applyTimeTheme() {
  const hour = new Date().getHours();
  let night = hour >= 18 || hour < 6;

  if (isAdminOverride) night = true;

  document.body.classList.remove("day", "night");
  document.body.classList.add(night ? "night" : "day");

  return night;
}

/* ========= ADMIN ========= */

function toggleAdminOverride() {
  isAdminOverride = !isAdminOverride;
  localStorage.setItem("nd_admin_override", isAdminOverride);
  location.reload();
}

/* ========= INIT ========= */

document.addEventListener("DOMContentLoaded", () => {
  applyTimeTheme();
});