const SPREADSHEET_ID = "1PAo0gsPwsWK4BRWB3H79U5ulMAwP1Y-Pljdt20m1Wi0";

const SHEET_BY_FORM_TYPE = {
  contact: "Contact Submissions",
  booking: "Booking Submissions",
  faq: "FAQ Submissions"
};

function doPost(e) {
  try {
    const body = parseBody_(e);
    const formType = asString_(body.formType).toLowerCase();
    const payload = body.payload || {};
    const meta = body.meta || {};
    const sheetName = SHEET_BY_FORM_TYPE[formType];

    if (!sheetName) {
      throw new Error("Unsupported formType: " + formType);
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error("Missing sheet tab: " + sheetName);
    }

    const row = buildRow_(formType, payload, meta);
    sheet.appendRow(row);

    return json_({
      ok: true,
      formType,
      sheet: sheetName,
      rowNumber: sheet.getLastRow()
    });
  } catch (error) {
    return json_({
      ok: false,
      error: asString_(error && error.message ? error.message : error)
    });
  }
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Empty POST body.");
  }
  return JSON.parse(e.postData.contents);
}

function buildRow_(formType, payload, meta) {
  const timestamp = asString_(meta.timestamp) || new Date().toISOString();
  const source = formType;
  const pageUrl = asString_(meta.pageUrl);
  const userAgent = asString_(meta.userAgent);
  const rawJson = JSON.stringify(payload);

  if (formType === "contact") {
    return [
      timestamp,
      source,
      asString_(payload.name),
      asString_(payload.email),
      asString_(payload.phone),
      asString_(payload.service),
      asString_(payload.message),
      pageUrl,
      userAgent,
      rawJson
    ];
  }

  if (formType === "booking") {
    return [
      timestamp,
      source,
      asString_(payload.fullName),
      asString_(payload.email),
      asString_(payload.phone),
      asString_(payload.organization),
      asString_(payload.serviceCategory),
      asString_(payload.specificService),
      asString_(payload.eventDate),
      asString_(payload.eventTime),
      asString_(payload.eventDuration),
      asString_(payload.eventLocation),
      asString_(payload.eventType),
      asString_(payload.attendees),
      asString_(payload.soundPackage),
      asString_(payload.djService),
      asString_(payload.customEquipment),
      csv_(payload.equipment),
      asString_(payload.venueType),
      asString_(payload.setupTime),
      asString_(payload.projectStart),
      asString_(payload.projectTimeline),
      asString_(payload.currentInfrastructure),
      csv_(payload.itNeeds),
      asString_(payload.serviceGoal),
      asString_(payload.budget),
      asString_(payload.paymentMethod),
      asString_(payload.depositPreference),
      asString_(payload.additionalComments),
      asString_(payload.referral),
      pageUrl,
      userAgent,
      rawJson
    ];
  }

  if (formType === "faq") {
    return [
      timestamp,
      source,
      asString_(payload.name),
      asString_(payload.email),
      asString_(payload.category),
      asString_(payload.question),
      pageUrl,
      userAgent,
      rawJson
    ];
  }

  throw new Error("Unhandled formType: " + formType);
}

function csv_(value) {
  if (Array.isArray(value)) {
    return value.map(asString_).filter(Boolean).join(", ");
  }
  return asString_(value);
}

function asString_(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
