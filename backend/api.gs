function getSantriByGuru(params) {
  const user = validateSession(params.token);
  requireRole(user, [APP_CONFIG.ROLES.GURU, APP_CONFIG.ROLES.ADMIN, APP_CONFIG.ROLES.SAYID]);

  const allSantri = getRows(SHEETS.PESERTA_DIDIK);
  if (user.role === APP_CONFIG.ROLES.GURU) {
    return allSantri.filter(function (s) {
      return String(s.guru_id) === String(user.id) && String(s.status).toLowerCase() === "aktif";
    });
  }
  return allSantri;
}

function saveProgress(params) {
  const user = validateSession(params.token);
  requireRole(user, [APP_CONFIG.ROLES.GURU, APP_CONFIG.ROLES.ADMIN, APP_CONFIG.ROLES.SAYID]);

  const payload = params.payload || {};
  const santriId = payload.santri_id;
  const guruId = user.role === APP_CONFIG.ROLES.GURU ? user.id : payload.guru_id;

  if (!santriId || !guruId || !payload.materi || !payload.tanggal) {
    throw new Error("tanggal, santri_id, guru_id, materi wajib diisi");
  }

  appendRowByObject(SHEETS.PROGRESS_BELAJAR, {
    id: generateId("PRG"),
    tanggal: payload.tanggal,
    guru_id: guruId,
    santri_id: santriId,
    materi: payload.materi,
    catatan: payload.catatan || "",
  });

  return { saved: true };
}

function requestUjian(params) {
  const user = validateSession(params.token);
  requireRole(user, [APP_CONFIG.ROLES.GURU, APP_CONFIG.ROLES.ADMIN, APP_CONFIG.ROLES.SAYID]);

  const payload = params.payload || {};
  const santriId = payload.santri_id;
  const guruId = user.role === APP_CONFIG.ROLES.GURU ? user.id : payload.guru_id;

  if (!santriId || !guruId) throw new Error("santri_id dan guru_id wajib diisi");

  appendRowByObject(SHEETS.REQUEST_UJIAN, {
    id: generateId("REQ"),
    santri_id: santriId,
    guru_id: guruId,
    tanggal_request: nowIso(),
    status: "pending",
  });

  addNotification("ALL_ADMIN", "request_ujian", "Ada request ujian baru untuk santri " + santriId);

  return { requested: true };
}

function approveUjian(params) {
  const user = validateSession(params.token);
  requireRole(user, [APP_CONFIG.ROLES.ADMIN, APP_CONFIG.ROLES.SAYID]);

  const payload = params.payload || {};
  const requestId = payload.request_id;
  const decision = String(payload.status || "").toLowerCase();

  if (!requestId) throw new Error("request_id wajib diisi");
  if (["approved", "rejected"].indexOf(decision) === -1) {
    throw new Error("status harus approved atau rejected");
  }

  const updated = updateRowByField(SHEETS.REQUEST_UJIAN, "id", requestId, function (row) {
    row.status = decision;
    return row;
  });

  addNotification(updated.guru_id, "approval_ujian", "Request ujian " + requestId + " di-" + decision);

  return { approved: true, status: decision };
}

function saveHasilUjian(params) {
  const user = validateSession(params.token);
  requireRole(user, [APP_CONFIG.ROLES.GURU, APP_CONFIG.ROLES.ADMIN, APP_CONFIG.ROLES.SAYID]);

  const payload = params.payload || {};
  const santriId = payload.santri_id;
  const nilai = String(payload.nilai || "").toUpperCase();

  if (!santriId || !nilai) throw new Error("santri_id dan nilai wajib diisi");
  if (["LULUS", "REMEDIAL"].indexOf(nilai) === -1) throw new Error("nilai harus LULUS atau REMEDIAL");

  appendRowByObject(SHEETS.HASIL_UJIAN, {
    id: generateId("UJN"),
    santri_id: santriId,
    penguji_id: user.id,
    nilai: nilai,
    catatan: payload.catatan || "",
    tanggal: payload.tanggal || nowIso(),
  });

  if (nilai === "LULUS") {
    const updated = updateRowByField(SHEETS.PESERTA_DIDIK, "id_santri", santriId, function (row) {
      row.level = incrementLevelLabel(String(row.level || "Level 1"));
      return row;
    });
    return { saved: true, levelUpdatedTo: updated.level };
  }

  return { saved: true, levelUpdatedTo: null };
}

function incrementLevelLabel(levelText) {
  const matched = /Level\s+(\d+)/i.exec(levelText);
  if (!matched) return "Level 2";
  const levelNo = Number(matched[1]) + 1;
  return "Level " + levelNo;
}

function getKafalah(params) {
  const user = validateSession(params.token);
  requireRole(user, [APP_CONFIG.ROLES.GURU, APP_CONFIG.ROLES.ADMIN, APP_CONFIG.ROLES.SAYID]);

  const payload = params.payload || {};
  const allKafalah = getRows(SHEETS.KAFALAH);

  if (user.role === APP_CONFIG.ROLES.GURU) {
    return allKafalah.filter(function (k) {
      return String(k.guru_id) === String(user.id);
    });
  }

  if (payload.guru_id) {
    return allKafalah.filter(function (k) {
      return String(k.guru_id) === String(payload.guru_id);
    });
  }

  return allKafalah;
}

function getDashboardStats(params) {
  const user = validateSession(params.token);

  const guruAktif = getRows(SHEETS.GURU).filter(function (g) {
    return String(g.status).toLowerCase() === "aktif";
  }).length;

  const santriAktifRows = getRows(SHEETS.PESERTA_DIDIK).filter(function (s) {
    return String(s.status).toLowerCase() === "aktif";
  });

  const hasilUjian = getRows(SHEETS.HASIL_UJIAN);
  const requestUjianRows = getRows(SHEETS.REQUEST_UJIAN);
  const progressRows = getRows(SHEETS.PROGRESS_BELAJAR);

  if (user.role === APP_CONFIG.ROLES.GURU) {
    const mySantri = santriAktifRows.filter(function (s) {
      return String(s.guru_id) === String(user.id);
    });

    const mySantriIds = mySantri.map(function (s) { return String(s.id_santri); });
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const myProgressWeek = progressRows.filter(function (p) {
      return String(p.guru_id) === String(user.id) && new Date(p.tanggal).getTime() >= thisWeekStart.getTime();
    }).length;

    const myRequestPending = requestUjianRows.filter(function (r) {
      return String(r.guru_id) === String(user.id) && String(r.status) === "pending";
    }).length;

    return {
      role: user.role,
      jumlahSantri: mySantri.length,
      progressMingguIni: myProgressWeek,
      requestUjianPending: myRequestPending,
      jumlahLulus: hasilUjian.filter(function (h) {
        return mySantriIds.indexOf(String(h.santri_id)) >= 0 && String(h.nilai).toUpperCase() === "LULUS";
      }).length,
    };
  }

  return {
    role: user.role,
    jumlahSantriAktif: santriAktifRows.length,
    jumlahGuruAktif: guruAktif,
    jumlahSantriLulus: hasilUjian.filter(function (h) {
      return String(h.nilai).toUpperCase() === "LULUS";
    }).length,
    requestUjianPending: requestUjianRows.filter(function (r) {
      return String(r.status) === "pending";
    }).length,
  };
}

function getRawRequestUjianForAdmin(params) {
  const user = validateSession(params.token);
  requireRole(user, [APP_CONFIG.ROLES.ADMIN, APP_CONFIG.ROLES.SAYID]);
  return getRows(SHEETS.REQUEST_UJIAN);
}
