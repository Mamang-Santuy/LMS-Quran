function hashPassword(text) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text);
  return raw
    .map(function (b) {
      const v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? "0" + v : v;
    })
    .join("");
}

function createSession(user) {
  const expiresAt = new Date(Date.now() + APP_CONFIG.SESSION_HOURS * 60 * 60 * 1000);
  const token = Utilities.getUuid() + "." + Utilities.getUuid();

  appendRowByObject(SHEETS.SESSIONS, {
    token: token,
    user_id: user.id,
    role: user.role,
    expires_at: expiresAt.toISOString(),
    is_active: "true",
    created_at: nowIso(),
  });

  return {
    token: token,
    expiresAt: expiresAt.toISOString(),
  };
}

function validateSession(token) {
  if (!token) throw new Error("Session token is required");

  const sessions = getRows(SHEETS.SESSIONS);
  const users = getRows(SHEETS.USERS);
  const session = sessions.find(function (s) {
    return String(s.token) === String(token) && String(s.is_active) === "true";
  });

  if (!session) throw new Error("Session not found or inactive");
  if (new Date(session.expires_at).getTime() < Date.now()) {
    updateRowByField(SHEETS.SESSIONS, "token", token, function (row) {
      row.is_active = "false";
      return row;
    });
    throw new Error("Session expired");
  }

  const user = users.find(function (u) {
    return String(u.id) === String(session.user_id) && String(u.status).toLowerCase() === "aktif";
  });

  if (!user) throw new Error("User is inactive or not found");
  return user;
}

function requireRole(user, roles) {
  if (roles.indexOf(String(user.role)) === -1) {
    throw new Error("Access denied for role " + user.role);
  }
}

function loginUser(payload) {
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "").trim();

  if (!username || !password) throw new Error("Username and password are required");

  const users = getRows(SHEETS.USERS);
  const user = users.find(function (u) {
    return String(u.username).trim().toLowerCase() === username.toLowerCase();
  });

  if (!user) throw new Error("Username atau password salah");
  if (String(user.status).toLowerCase() !== "aktif") throw new Error("Akun tidak aktif");

  const isMatch = String(user.password) === password || String(user.password) === hashPassword(password);
  if (!isMatch) throw new Error("Username atau password salah");

  const session = createSession(user);
  return {
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      nama: user.nama,
      role: user.role,
      username: user.username,
    },
  };
}

function getUserData(params) {
  const user = validateSession(params.token);
  return {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    status: user.status,
  };
}
