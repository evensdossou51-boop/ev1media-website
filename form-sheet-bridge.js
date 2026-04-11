(function () {
    function getConfig() {
        return window.EV1MEDIA_SHEETS || {};
    }

    function isConfigured() {
        const { webAppUrl } = getConfig();
        return typeof webAppUrl === "string" &&
            webAppUrl.startsWith("https://script.google.com/macros/s/") &&
            webAppUrl.endsWith("/exec");
    }

    async function submit(formType, payload) {
        if (!isConfigured()) {
            return { ok: false, skipped: true, reason: "web-app-url-not-configured" };
        }

        const { webAppUrl, spreadsheetId } = getConfig();
        const envelope = {
            formType,
            payload,
            meta: {
                timestamp: new Date().toISOString(),
                pageUrl: window.location.href,
                userAgent: navigator.userAgent,
                spreadsheetId
            }
        };

        // Apps Script Web Apps do not reliably return CORS headers.
        // Use no-cors as a fire-and-forget write.
        await fetch(webAppUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(envelope)
        });

        return { ok: true };
    }

    window.EV1MediaSheetBridge = { isConfigured, submit };
})();
