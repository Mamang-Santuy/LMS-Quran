const APP_CONFIG = {
  SESSION_HOURS: 8,
  ROLES: {
    SAYID: "SAYID",
    ADMIN: "ADMIN",
    GURU: "GURU",
  },
};

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      message: "LMS Bimbel Qur'an API is running",
      timestamp: new Date().toISOString(),
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = body.action;
    const payload = body.payload || {};
    const token = body.token || "";

    if (!action) {
      return jsonResponse(false, "Action is required");
    }

    let result;
    switch (action) {
      case "loginUser":
        result = loginUser(payload);
        break;
      case "getUserData":
        result = getUserData({ token });
        break;
      case "getSantriByGuru":
        result = getSantriByGuru({ token });
        break;
      case "saveProgress":
        result = saveProgress({ token, payload });
        break;
      case "requestUjian":
        result = requestUjian({ token, payload });
        break;
      case "approveUjian":
        result = approveUjian({ token, payload });
        break;
      case "saveHasilUjian":
        result = saveHasilUjian({ token, payload });
        break;
      case "getKafalah":
        result = getKafalah({ token, payload });
        break;
      case "getDashboardStats":
        result = getDashboardStats({ token });
        break;
      case "getRawRequestUjianForAdmin":
        result = getRawRequestUjianForAdmin({ token });
        break;
      default:
        return jsonResponse(false, "Unknown action: " + action);
    }

    return jsonResponse(true, "Success", result);
  } catch (err) {
    return jsonResponse(false, err.message || "Unexpected error");
  }
}

function jsonResponse(ok, message, data) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: ok,
      message: message,
      data: data || null,
      serverTime: new Date().toISOString(),
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
