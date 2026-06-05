const SPREADSHEET_ID = "1PAo0gsPwsWK4BRWB3H79U5ulMAwP1Y-Pljdt20m1Wi0";

const SHEET_BY_FORM_TYPE = {
  contact: "Contact Submissions",
  booking: "Booking Submissions"
};

const CONTACT_HEADERS = [
  "Timestamp",
  "Source",
  "Name",
  "Email",
  "Phone",
  "Service",
  "Message",
  "Page URL",
  "User Agent",
  "Raw JSON",
  "Year",
  "Month",
  "Month Number",
  "Converted to Job?",
  "Job Status",
  "Job Value",
  "Job Notes"
];

const BOOKING_HEADERS = [
  "Timestamp",
  "Source",
  "Full Name",
  "Email",
  "Phone",
  "Service Location / Address",
  "Service Needed",
  "Message / Project Details *",
  "Page URL",
  "User Agent",
  "Raw JSON",
  "Year",
  "Month",
  "Month Number",
  "Converted to Job?",
  "Job Status",
  "Job Value",
  "Job Notes"
];

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
    const sheet = getOrCreateSheet_(spreadsheet, sheetName, getHeaders_(formType));
    const row = buildRow_(formType, payload, meta);
    sheet.appendRow(row);
    setupMonthlyDashboard_(spreadsheet);
    setupJobsPipeline_(spreadsheet);

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

function setupMonthlyDashboard() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  setupMonthlyDashboard_(spreadsheet);
  setupJobsPipeline_(spreadsheet);
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Empty POST body.");
  }
  return JSON.parse(e.postData.contents);
}

function getHeaders_(formType) {
  return formType === "booking" ? BOOKING_HEADERS : CONTACT_HEADERS;
}

function getOrCreateSheet_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);

  return sheet;
}

function buildRow_(formType, payload, meta) {
  const timestamp = asString_(meta.timestamp) || new Date().toISOString();
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const monthNumber = date.getMonth() + 1;
  const month = Utilities.formatDate(date, Session.getScriptTimeZone(), "MMMM");
  const pageUrl = asString_(meta.pageUrl);
  const userAgent = asString_(meta.userAgent);
  const rawJson = JSON.stringify(payload);

  if (formType === "contact") {
    return [
      timestamp,
      "contact",
      asString_(payload.name),
      asString_(payload.email),
      asString_(payload.phone),
      asString_(payload.service),
      asString_(payload.message),
      pageUrl,
      userAgent,
      rawJson,
      year,
      month,
      monthNumber,
      "No",
      "New Inquiry",
      "",
      ""
    ];
  }

  if (formType === "booking") {
    return [
      timestamp,
      "booking",
      asString_(payload.fullName),
      asString_(payload.email),
      asString_(payload.phone),
      asString_(payload.serviceAddress),
      asString_(payload.service),
      asString_(payload.message),
      pageUrl,
      userAgent,
      rawJson,
      year,
      month,
      monthNumber,
      "No",
      "New Inquiry",
      "",
      ""
    ];
  }

  throw new Error("Unhandled formType: " + formType);
}

function setupMonthlyDashboard_(spreadsheet) {
  const dashboardName = "Monthly Dashboard";
  const sheet = getOrCreateDashboardSheet_(spreadsheet, dashboardName);

  sheet.clear();
  sheet.getRange("A1").setValue("EV1Media Submission Dashboard");
  sheet.getRange("A2").setValue("Year");
  sheet.getRange("B2").setFormula("=YEAR(TODAY())");
  sheet.getRange("A4:F4").setValues([[
    "Total This Year",
    "=SUM(D8:D19)",
    "Contact",
    "=SUM(B8:B19)",
    "Service Requests",
    "=SUM(C8:C19)"
  ]]);
  sheet.getRange("A6").setValue("Monthly Breakdown");
  sheet.getRange("A7:D7").setValues([["Month", "Contact", "Service Request", "Total"]]);

  const monthRows = [
    ["January", 1],
    ["February", 2],
    ["March", 3],
    ["April", 4],
    ["May", 5],
    ["June", 6],
    ["July", 7],
    ["August", 8],
    ["September", 9],
    ["October", 10],
    ["November", 11],
    ["December", 12]
  ];

  monthRows.forEach(function (row, index) {
    const sheetRow = index + 8;
    sheet.getRange(sheetRow, 1).setValue(row[0]);
    sheet.getRange(sheetRow, 2).setFormula("=COUNTIFS('Contact Submissions'!$K:$K,$B$2,'Contact Submissions'!$M:$M," + row[1] + ")");
    sheet.getRange(sheetRow, 3).setFormula("=COUNTIFS('Booking Submissions'!$L:$L,$B$2,'Booking Submissions'!$N:$N," + row[1] + ")");
    sheet.getRange(sheetRow, 4).setFormula("=SUM(B" + sheetRow + ":C" + sheetRow + ")");
  });

  sheet.getRange("A22:B25").setValues([
    ["Conversion Summary", ""],
    ["Converted Jobs", "=COUNTIF('Contact Submissions'!N:N,\"Yes\")+COUNTIF('Booking Submissions'!O:O,\"Yes\")"],
    ["Open Inquiries", "=MAX(0,SUM(D8:D19)-B23)"],
    ["Total Submissions", "=SUM(D8:D19)"]
  ]);

  sheet.getRange("A1:F1").merge();
  sheet.getRange("A1").setFontSize(18).setFontWeight("bold");
  sheet.getRange("A7:D7").setFontWeight("bold");
  sheet.getRange("A22:B22").setFontWeight("bold");
  sheet.autoResizeColumns(1, 6);

  sheet.getCharts().forEach(function (chart) {
    sheet.removeChart(chart);
  });

  const monthlyChart = sheet.newChart()
    .asColumnChart()
    .addRange(sheet.getRange("A7:D19"))
    .setPosition(6, 6, 0, 0)
    .setOption("title", "Website Submissions by Month")
    .setOption("legend", { position: "bottom" })
    .setOption("hAxis", { title: "Month" })
    .setOption("vAxis", { title: "Submissions", minValue: 0 })
    .build();

  const conversionChart = sheet.newChart()
    .asPieChart()
    .addRange(sheet.getRange("A23:B24"))
    .setPosition(22, 6, 0, 0)
    .setOption("title", "Submissions Converted Into Jobs")
    .setOption("legend", { position: "right" })
    .build();

  sheet.insertChart(monthlyChart);
  sheet.insertChart(conversionChart);
}

function setupJobsPipeline_(spreadsheet) {
  const sheet = getOrCreateDashboardSheet_(spreadsheet, "Jobs Pipeline");

  sheet.clear();
  sheet.getRange("A1").setValue("Jobs Pipeline");
  sheet.getRange("A2").setValue("Mark Converted to Job? = Yes on Contact Submissions or Booking Submissions. Converted inquiries will appear below.");
  sheet.getRange("A4:K4").setValues([[
    "Timestamp",
    "Source",
    "Name",
    "Email",
    "Phone",
    "Service Location",
    "Service",
    "Message / Project Details *",
    "Job Status",
    "Job Value",
    "Job Notes"
  ]]);
  sheet.getRange("A5").setFormula(
    "=IFERROR(VSTACK(" +
      "FILTER({'Contact Submissions'!A2:A,'Contact Submissions'!B2:B,'Contact Submissions'!C2:C,'Contact Submissions'!D2:D,'Contact Submissions'!E2:E,IF('Contact Submissions'!A2:A<>\"\",\"\",),'Contact Submissions'!F2:F,'Contact Submissions'!G2:G,'Contact Submissions'!O2:O,'Contact Submissions'!P2:P,'Contact Submissions'!Q2:Q},'Contact Submissions'!N2:N=\"Yes\")," +
      "FILTER({'Booking Submissions'!A2:A,'Booking Submissions'!B2:B,'Booking Submissions'!C2:C,'Booking Submissions'!D2:D,'Booking Submissions'!E2:E,'Booking Submissions'!F2:F,'Booking Submissions'!G2:G,'Booking Submissions'!H2:H,'Booking Submissions'!P2:P,'Booking Submissions'!Q2:Q,'Booking Submissions'!R2:R},'Booking Submissions'!O2:O=\"Yes\")" +
    "),\"No converted jobs yet\")"
  );

  sheet.getRange("A1:K1").setFontSize(18).setFontWeight("bold");
  sheet.getRange("A4:K4").setFontWeight("bold");
  sheet.autoResizeColumns(1, 11);
}

function getOrCreateDashboardSheet_(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
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
