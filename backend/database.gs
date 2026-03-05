const SHEETS = {
  USERS: "USERS",
  GURU: "GURU",
  PESERTA_DIDIK: "PESERTA_DIDIK",
  KURIKULUM: "KURIKULUM",
  PROGRESS_BELAJAR: "PROGRESS_BELAJAR",
  REQUEST_UJIAN: "REQUEST_UJIAN",
  HASIL_UJIAN: "HASIL_UJIAN",
  KAFALAH: "KAFALAH",
  SESSIONS: "SESSIONS",
  NOTIFIKASI: "NOTIFIKASI",
};

function getSheet(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  return sheet;
}

function getRows(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(String);
  const rows = [];

  for (let i = 1; i < values.length; i += 1) {
    const row = {};
    headers.forEach(function (header, index) {
      row[header] = values[i][index];
    });
    if (Object.values(row).some(function (v) { return v !== ""; })) {
      rows.push(row);
    }
  }

  return rows;
}

function appendRowByObject(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const row = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(obj, header) ? obj[header] : "";
  });
  sheet.appendRow(row);
}

function findRowIndexByField(sheetName, fieldName, value) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return -1;

  const headers = values[0].map(String);
  const fieldIndex = headers.indexOf(fieldName);
  if (fieldIndex === -1) throw new Error("Field not found: " + fieldName + " on " + sheetName);

  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i][fieldIndex]) === String(value)) {
      return i + 1;
    }
  }

  return -1;
}

function updateRowByField(sheetName, fieldName, value, updater) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) throw new Error("No data in " + sheetName);

  const headers = values[0].map(String);
  const fieldIndex = headers.indexOf(fieldName);
  if (fieldIndex === -1) throw new Error("Field not found: " + fieldName + " on " + sheetName);

  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i][fieldIndex]) === String(value)) {
      const rowObject = {};
      headers.forEach(function (h, idx) {
        rowObject[h] = values[i][idx];
      });

      const updated = updater(rowObject) || rowObject;
      const updatedRow = headers.map(function (h) {
        return Object.prototype.hasOwnProperty.call(updated, h) ? updated[h] : "";
      });

      sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
      return updated;
    }
  }

  throw new Error("Data not found on " + sheetName + " for " + fieldName + "=" + value);
}

function generateId(prefix) {
  return [prefix, Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMddHHmmss"), Utilities.getUuid().slice(0, 8)].join("_");
}

function nowIso() {
  return new Date().toISOString();
}

function addNotification(userId, type, message) {
  try {
    appendRowByObject(SHEETS.NOTIFIKASI, {
      id: generateId("NOTIF"),
      user_id: userId,
      jenis: type,
      pesan: message,
      created_at: nowIso(),
      status: "unread",
    });
  } catch (err) {
    // NOTIFIKASI sheet is optional.
  }
}
