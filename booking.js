document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');

    if (!bookingForm) {
        console.error('Booking form not found - cannot attach submit handler.');
        return;
    }

    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(bookingForm);
        const data = {
            fullName: formData.get('fullName') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || 'Not provided',
            serviceAddress: formData.get('serviceAddress') || '',
            service: formData.get('service') || 'Not specified',
            message: formData.get('message') || ''
        };

        await handleBookingSubmission(data);
    });

    async function handleBookingSubmission(data) {
        const submitButton = bookingForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        try {
            const [emailResult, sheetResult] = await Promise.allSettled([
                sendEmailNotification(data),
                sendBookingToSheet(data)
            ]);

            const emailFailed = emailResult.status === 'rejected';
            const sheetSkipped = sheetResult.status === 'fulfilled' && sheetResult.value && sheetResult.value.skipped;
            const sheetFailed = sheetResult.status === 'rejected';

            if (!emailFailed || (!sheetSkipped && !sheetFailed)) {
                if (sheetSkipped) {
                    console.warn('Google Sheet sync is not active yet. Add your Apps Script /exec URL in form-sheet-config.js.');
                } else if (sheetFailed) {
                    console.error('Sheet sync failed:', sheetResult.reason);
                }

                bookingForm.reset();
                window.location.href = 'confirmation.html?type=booking';
                return;
            }

            console.error('Email send failed:', emailResult.reason);
            alert('There was an error submitting your consultation request. Please email us directly at info@ev1media.com or call (239) 351-6598.');
        } catch (error) {
            console.error('Unexpected booking submission error:', error);
            alert('There was an unexpected error while submitting your consultation request. Please try again.');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    function sendEmailNotification(data) {
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS not loaded. Email notification skipped.');
        }

        const emailParams = {
            to_email: 'info@ev1media.com',
            from_name: data.fullName || 'Unknown',
            reply_to: data.email,
            from_email: data.email,
            phone_number: data.phone,
            service_type: data.service,
            service_address: data.serviceAddress,
            message_html: createEmailBody(data),
            submission_time: new Date().toLocaleString()
        };

        return emailjs.send('service_vt29dhf', 'template_16txbzw', emailParams);
    }

    function sendBookingToSheet(data) {
        if (!window.EV1MediaSheetBridge || typeof window.EV1MediaSheetBridge.submit !== 'function') {
            return Promise.resolve({ ok: false, skipped: true, reason: 'sheet-bridge-missing' });
        }

        return window.EV1MediaSheetBridge.submit('booking', data);
    }

    function createEmailBody(data) {
        return `
            <div style="font-family: Arial, sans-serif;">
                <h3 style="color: #1a73e8;">EV1 Media Services Service Request</h3>
                <p><strong>Full Name:</strong> ${escapeHtml(data.fullName)}</p>
                <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
                <p><strong>Service Location / Address:</strong> ${escapeHtml(data.serviceAddress)}</p>
                <p><strong>Service Needed:</strong> ${escapeHtml(data.service)}</p>
                <h3 style="color: #1a73e8;">Message / Project Details</h3>
                <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
                <p><strong>Next Step:</strong> Contact the client to confirm scheduling and next steps.</p>
            </div>
        `;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

});
