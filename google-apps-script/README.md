# EV1 Media inquiry system

Website submissions are stored in:

[EV1 Media Website Inquiries](https://docs.google.com/spreadsheets/d/1PAo0gsPwsWK4BRWB3H79U5ulMAwP1Y-Pljdt20m1Wi0/edit)

The workbook contains:

- `Monthly Dashboard` — totals, monthly activity, inquiry mix pie chart and pipeline metrics.
- `Contact Submissions` — corporate and venture inquiries.
- `Booking Submissions` — EV1 Media Solutions service requests.
- `Jobs Pipeline` — converted inquiries pulled automatically from both submission tabs.
- `Settings` — approved categories, statuses and conversion options.

## Deploy the Apps Script handler

1. Open the Apps Script project connected to the current web app.
2. Replace `Code.gs` with the repository version.
3. Save the project.
4. Open **Deploy → Manage deployments**.
5. Edit the active web-app deployment and choose **New version**.
6. Keep **Execute as: Me** and **Who has access: Anyone**.
7. Deploy. The existing `/exec` URL can remain in `form-sheet-config.js`.

## Configure Telegram notifications

Create a bot with Telegram’s official **@BotFather**, then send the bot one message.

In Apps Script, open **Project Settings → Script properties** and add:

- `TELEGRAM_BOT_TOKEN` — the token issued by BotFather.
- `TELEGRAM_CHAT_ID` — the private chat, group or channel ID that should receive alerts.

If the chat ID is unknown:

1. Add only `TELEGRAM_BOT_TOKEN`.
2. Send the bot a message in the destination chat.
3. Run `findTelegramChatIds()` in Apps Script.
4. Read the execution result or log and copy the correct ID into `TELEGRAM_CHAT_ID`.
5. Run `testTelegramNotification()`.

Bot tokens must remain in Apps Script properties. Never place them in website JavaScript or commit them to GitHub.

## Submission types

- `contact` writes corporate inquiries and sends a Telegram alert.
- `booking` writes service requests and sends a Telegram alert.

The handler assigns a unique inquiry ID, writes a real date/time value, preserves dashboard reporting fields and prevents spreadsheet-formula injection from visitor input.
