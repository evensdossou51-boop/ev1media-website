const SPREADSHEET_ID = "1PAo0gsPwsWK4BRWB3H79U5ulMAwP1Y-Pljdt20m1Wi0";

const SHEET_BY_FORM_TYPE = {
  contact: "Contact Submissions",
  booking: "Booking Submissions"
};

const CONTACT_HEADERS = [
  "Inquiry ID",
  "Submitted At",
  "Form Type",
  "Name",
  "Email",
  "Phone",
  "Inquiry Category",
  "Message",
  "Page URL",
  "Browser / Device",
  "Raw JSON",
  "Year",
  "Month",
  "Month Number",
  "Converted to Job?",
  "Inquiry Status",
  "Job Value",
  "Follow-Up Date",
  "Owner",
  "Notes"
];

const BOOKING_HEADERS = [
  "Inquiry ID",
  "Submitted At",
  "Form Type",
  "Name",
  "Email",
  "Phone",
  "Service Location",
  "Service Requested",
  "Project Details",
  "Page URL",
  "Browser / Device",
  "Raw JSON",
  "Year",
  "Month",
  "Month Number",
  "Converted to Job?",
  "Inquiry Status",
  "Job Value",
  "Follow-Up Date",
  "Owner",
  "Notes"
];

const TELEGRAM_BOT_TOKEN_PROPERTY = "TELEGRAM_BOT_TOKEN";
const TELEGRAM_CHAT_ID_PROPERTY = "TELEGRAM_CHAT_ID";

function doGet() {
  const status = getTelegramConfigStatus();
  return json_({
    ok: true,
    service: "EV1 Media inquiry API",
    telegramConfigured: status.configured
  });
}

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
    const headers = formType === "booking" ? BOOKING_HEADERS : CONTACT_HEADERS;
    const sheet = getOrCreateSheet_(spreadsheet, sheetName, headers);
    const lock = LockService.getScriptLock();

    lock.waitLock(30000);

    let inquiryId;
    let rowNumber;

    try {
      inquiryId = nextInquiryId_(sheet, formType === "booking" ? "BK" : "CT");
      const row = buildRow_(formType, inquiryId, payload, meta);
      sheet.appendRow(row);
      rowNumber = sheet.getLastRow();
      applyNewRowStructure_(sheet, formType, rowNumber, headers.length);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    let telegramSent = false;

    try {
      telegramSent = sendTelegramNotification_(formType, inquiryId, payload, meta);
    } catch (telegramError) {
      console.error("Telegram notification failed", telegramError);
    }

    return json_({
      ok: true,
      inquiryId: inquiryId,
      formType: formType,
      sheet: sheetName,
      rowNumber: rowNumber,
      telegramSent: telegramSent
    });
  } catch (error) {
    console.error("Inquiry processing failed", error);
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

function getOrCreateSheet_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);

  return sheet;
}

function nextInquiryId_(sheet, prefix) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return prefix + "-00001";
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  let highest = 0;

  ids.forEach(function (row) {
    const match = asString_(row[0]).match(new RegExp("^" + prefix + "-(\\d+)$"));

    if (match) {
      highest = Math.max(highest, Number(match[1]));
    }
  });

  return prefix + "-" + String(highest + 1).padStart(5, "0");
}

function buildRow_(formType, inquiryId, payload, meta) {
  const submittedAt = validDate_(meta.timestamp);
  const timeZone = SpreadsheetApp.openById(SPREADSHEET_ID).getSpreadsheetTimeZone();
  const year = Number(Utilities.formatDate(submittedAt, timeZone, "yyyy"));
  const month = Utilities.formatDate(submittedAt, timeZone, "MMMM");
  const monthNumber = Number(Utilities.formatDate(submittedAt, timeZone, "M"));
  const pageUrl = safeCellText_(meta.pageUrl);
  const userAgent = safeCellText_(meta.userAgent);
  const rawJson = JSON.stringify({ payload: payload, meta: meta });

  if (formType === "contact") {
    return [
      inquiryId,
      submittedAt,
      "Contact",
      safeCellText_(payload.name),
      safeCellText_(payload.email),
      safeCellText_(payload.phone),
      safeCellText_(payload.service),
      safeCellText_(payload.message),
      pageUrl,
      userAgent,
      rawJson,
      year,
      month,
      monthNumber,
      "No",
      "New Inquiry",
      "",
      "",
      "",
      ""
    ];
  }

  return [
    inquiryId,
    submittedAt,
    "Service Request",
    safeCellText_(payload.fullName),
    safeCellText_(payload.email),
    safeCellText_(payload.phone),
    safeCellText_(payload.serviceAddress),
    safeCellText_(payload.service),
    safeCellText_(payload.message),
    pageUrl,
    userAgent,
    rawJson,
    year,
    month,
    monthNumber,
    "No",
    "New Inquiry",
    "",
    "",
    "",
    ""
  ];
}

function applyNewRowStructure_(sheet, formType, rowNumber, columnCount) {
  const rowRange = sheet.getRange(rowNumber, 1, 1, columnCount);

  if (rowNumber > 2) {
    const exemplar = sheet.getRange(2, 1, 1, columnCount);
    exemplar.copyTo(rowRange, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    exemplar.copyTo(rowRange, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
  }

  sheet.getRange(rowNumber, 2).setNumberFormat("yyyy-mm-dd hh:mm");

  if (formType === "contact") {
    sheet.getRange(rowNumber, 17).setNumberFormat("$#,##0.00");
    sheet.getRange(rowNumber, 18).setNumberFormat("yyyy-mm-dd");
  } else {
    sheet.getRange(rowNumber, 18).setNumberFormat("$#,##0.00");
    sheet.getRange(rowNumber, 19).setNumberFormat("yyyy-mm-dd");
  }
}

function sendTelegramNotification_(formType, inquiryId, payload, meta) {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty(TELEGRAM_BOT_TOKEN_PROPERTY);
  const chatId = properties.getProperty(TELEGRAM_CHAT_ID_PROPERTY);

  if (!token || !chatId) {
    return false;
  }

  const lines = [
    "🔔 <b>New EV1 Media inquiry</b>",
    "",
    "<b>ID:</b> " + escapeTelegramHtml_(inquiryId),
    "<b>Type:</b> " + escapeTelegramHtml_(formType === "booking" ? "Service Request" : "Corporate Inquiry"),
    "<b>Name:</b> " + escapeTelegramHtml_(formType === "booking" ? payload.fullName : payload.name),
    "<b>Email:</b> " + escapeTelegramHtml_(payload.email),
    "<b>Phone:</b> " + escapeTelegramHtml_(payload.phone || "Not provided")
  ];

  if (formType === "booking") {
    lines.push("<b>Service:</b> " + escapeTelegramHtml_(payload.service || "Not specified"));
    lines.push("<b>Location:</b> " + escapeTelegramHtml_(payload.serviceAddress || "Not provided"));
    lines.push("<b>Project details:</b> " + escapeTelegramHtml_(payload.message || "Not provided"));
  } else {
    lines.push("<b>Inquiry category:</b> " + escapeTelegramHtml_(payload.service || "Not specified"));
    lines.push("<b>Message:</b> " + escapeTelegramHtml_(payload.message || "Not provided"));
  }

  if (meta.pageUrl) {
    lines.push("");
    lines.push("<b>Page:</b> " + escapeTelegramHtml_(meta.pageUrl));
  }

  const response = UrlFetchApp.fetch(
    "https://api.telegram.org/bot" + token + "/sendMessage",
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true
      }),
      muteHttpExceptions: true
    }
  );

  const statusCode = response.getResponseCode();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error("Telegram API returned " + statusCode + ": " + response.getContentText());
  }

  return true;
}

function getTelegramConfigStatus() {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty(TELEGRAM_BOT_TOKEN_PROPERTY);
  const chatId = properties.getProperty(TELEGRAM_CHAT_ID_PROPERTY);

  return {
    configured: Boolean(token && chatId),
    hasToken: Boolean(token),
    hasChatId: Boolean(chatId)
  };
}

function findTelegramChatIds() {
  const token = PropertiesService.getScriptProperties().getProperty(TELEGRAM_BOT_TOKEN_PROPERTY);

  if (!token) {
    throw new Error("Add TELEGRAM_BOT_TOKEN in Apps Script properties first.");
  }

  const response = UrlFetchApp.fetch(
    "https://api.telegram.org/bot" + token + "/getUpdates",
    { muteHttpExceptions: true }
  );
  const data = JSON.parse(response.getContentText());

  if (!data.ok) {
    throw new Error("Telegram getUpdates failed: " + response.getContentText());
  }

  const chatsById = {};

  (data.result || []).forEach(function (update) {
    const message = update.message || update.channel_post || update.edited_message;
    const chat = message && message.chat;

    if (chat) {
      chatsById[String(chat.id)] = {
        id: chat.id,
        type: chat.type,
        title: chat.title || "",
        username: chat.username || "",
        firstName: chat.first_name || ""
      };
    }
  });

  const chats = Object.keys(chatsById).map(function (key) {
    return chatsById[key];
  });

  console.log(JSON.stringify(chats, null, 2));
  return chats;
}

function testTelegramNotification() {
  const sent = sendTelegramNotification_(
    "contact",
    "TEST-00001",
    {
      name: "EV1 Media Website Test",
      email: "info@ev1media.com",
      phone: "(239) 351-6598",
      service: "General corporate inquiry",
      message: "Telegram inquiry notifications are connected."
    },
    {
      pageUrl: "https://ev1media.com/contact.html"
    }
  );

  if (!sent) {
    throw new Error("Telegram is not configured. Add the required script properties.");
  }

  return "Telegram test notification sent.";
}

function validDate_(value) {
  const date = value ? new Date(value) : new Date();

  if (isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function safeCellText_(value) {
  const text = asString_(value);

  if (/^[=+\\-@]/.test(text)) {
    return "'" + text;
  }

  return text;
}

function escapeTelegramHtml_(value) {
  return asString_(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
