## Google Sheet Form Integration Setup

This project now writes website form submissions to:

- https://docs.google.com/spreadsheets/d/1PAo0gsPwsWK4BRWB3H79U5ulMAwP1Y-Pljdt20m1Wi0/edit

Tabs already prepared:

- `Contact Submissions`
- `Booking Submissions`
- `FAQ Submissions`

### 1. Deploy Apps Script Web App
1. Open [script.new](https://script.new/) while signed into your Google account.
2. Replace the default code with `google-apps-script/Code.gs`.
3. Save the project.
4. Click **Deploy** -> **New deployment**.
5. Select type: **Web app**.
6. Execute as: **Me**.
7. Who has access: **Anyone**.
8. Deploy and authorize.
9. Copy the generated Web App URL (ends with `/exec`).

### 2. Paste Web App URL into site config
1. Open `form-sheet-config.js`.
2. Replace:
   - `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE`
3. Save and redeploy your website.

After this, form submissions from `booking.html`, `contact.html`, and `faq.html` will be posted to the sheet.
