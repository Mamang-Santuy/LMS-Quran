window.APP_CONFIG = {
  API_BASE_URL: "https://script.google.com/macros/s/AKfycbxYYmBO72VXBViV_yNPQg8jykgGQj00Cbdko-i21e_S0hLOVCtXEaxHo7E6Ui_l6w3I/exec",
};

async function apiCall(action, payload) {
  if (!window.APP_CONFIG.API_BASE_URL || window.APP_CONFIG.API_BASE_URL === "PASTE_WEBAPP_URL_HERE") {
    throw new Error("Set APP_CONFIG.API_BASE_URL terlebih dahulu");
  }

  const token = localStorage.getItem("lms_token") || "";

  const res = await fetch(window.APP_CONFIG.API_BASE_URL, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: action,
      token: token,
      payload: payload || {}
    })
  });

  const json = await res.json();

  if (!json.ok) throw new Error(json.message || "API error");

  return json.data;
}

function saveSession(loginData) {
  localStorage.setItem("lms_token", loginData.token);
  localStorage.setItem("lms_user", JSON.stringify(loginData.user));
  localStorage.setItem("lms_expires", loginData.expiresAt);
}

function getSessionUser() {
  const raw = localStorage.getItem("lms_user");
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem("lms_token");
  localStorage.removeItem("lms_user");
  localStorage.removeItem("lms_expires");
}

function requireAuth() {
  const token = localStorage.getItem("lms_token");
  const user = getSessionUser();
  if (!token || !user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

function fmtCurrency(num) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(num || 0));
}
