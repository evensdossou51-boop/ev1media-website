document.addEventListener('DOMContentLoaded', function() {
    const intakeForm = document.getElementById('customSoftwareForm');

    if (!intakeForm) {
        console.error('Custom software intake form not found - cannot attach submit handler.');
        return;
    }

    intakeForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(intakeForm);
        const features = formData.getAll('csFeature').join(', ') || 'Not specified';

        const data = {
            name: formData.get('csName') || '',
            organization: formData.get('csOrganization') || '',
            email: formData.get('csEmail') || '',
            phone: formData.get('csPhone') || 'Not provided',
            organizationType: formData.get('csOrgType') || 'Not specified',
            projectDescription: formData.get('csProject') || '',
            problem: formData.get('csProblem') || '',
            features: features,
            currentTools: formData.get('csCurrentTools') || 'Not provided',
            expectedUsers: formData.get('csUsers') || 'Not specified',
            launchDate: formData.get('csLaunch') || 'Not specified',
            budget: formData.get('csBudget') || 'Not specified'
        };

        await handleIntakeSubmission(data);
    });

    async function handleIntakeSubmission(data) {
        const submitButton = intakeForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        try {
            const [emailResult, sheetResult] = await Promise.allSettled([
                sendEmailNotification(data),
                sendIntakeToSheet(data)
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

                intakeForm.reset();
                window.location.href = 'confirmation.html?type=custom-software';
                return;
            }

            console.error('Email send failed:', emailResult.reason);
            alert('There was an error submitting your project request. Please email us directly at info@ev1media.com or call (239) 351-6598.');
        } catch (error) {
            console.error('Unexpected intake submission error:', error);
            alert('There was an unexpected error while submitting your project request. Please try again.');
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
            from_name: data.name || 'Unknown',
            reply_to: data.email,
            from_email: data.email,
            phone_number: data.phone,
            service_type: 'Custom Software Project — ' + data.organizationType,
            message_html: createEmailBody(data),
            submission_time: new Date().toLocaleString()
        };

        return emailjs.send('service_vt29dhf', 'template_xo0vze1', emailParams);
    }

    function sendIntakeToSheet(data) {
        if (!window.EV1MediaSheetBridge || typeof window.EV1MediaSheetBridge.submit !== 'function') {
            return Promise.resolve({ ok: false, skipped: true, reason: 'sheet-bridge-missing' });
        }

        return window.EV1MediaSheetBridge.submit('custom-software', data);
    }

    function createEmailBody(data) {
        return `
            <div style="font-family: Arial, sans-serif;">
                <h3 style="color: #1a73e8;">Custom Software Project Request</h3>
                <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
                <p><strong>Organization:</strong> ${escapeHtml(data.organization)}</p>
                <p><strong>Organization Type:</strong> ${escapeHtml(data.organizationType)}</p>
                <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
                <p><strong>Expected Users:</strong> ${escapeHtml(data.expectedUsers)}</p>
                <p><strong>Desired Launch Date:</strong> ${escapeHtml(data.launchDate)}</p>
                <p><strong>Budget Range:</strong> ${escapeHtml(data.budget)}</p>
                <p><strong>Current Tools:</strong> ${escapeHtml(data.currentTools)}</p>
                <p><strong>Required Features:</strong> ${escapeHtml(data.features)}</p>
                <h3 style="color: #1a73e8;">What They Want Built</h3>
                <p>${escapeHtml(data.projectDescription).replace(/\n/g, '<br>')}</p>
                <h3 style="color: #1a73e8;">Problem They're Solving</h3>
                <p>${escapeHtml(data.problem).replace(/\n/g, '<br>')}</p>
                <p><strong>Next Step:</strong> Review the request and schedule a discovery call.</p>
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
