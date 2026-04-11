// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

// Service options for each category
const services = {
    'av-solutions': [
        { value: 'speech-package', label: 'Speech Package (2 Top Speakers + Mic)' },
        { value: 'full-system', label: 'Full System (2 Top + Subs)' },
        { value: 'custom', label: 'Custom Package' }
    ],
    'networking-it': [
        { value: 'structured-cabling', label: 'Structured Cabling and Rack Build' },
        { value: 'managed-network', label: 'Managed Network Setup' },
        { value: 'network-remediation', label: 'Network Cleanup and Optimization' },
        { value: 'streaming-support', label: 'Live Streaming Support' },
        { value: 'it-support', label: 'General IT Support and Troubleshooting' }
    ]
};

// Your WhatsApp number (use international format without + or spaces)
const WHATSAPP_NUMBER = '9564970720'; // Replace with your actual WhatsApp number

// DOM Elements
const serviceCategorySelect = document.getElementById('serviceCategory');
const specificServiceGroup = document.getElementById('specificServiceGroup');
const specificServiceSelect = document.getElementById('specificService');
const eventDetailsSection = document.getElementById('eventDetailsSection');
const projectDetailsSection = document.getElementById('projectDetailsSection');
const avSpecificQuestions = document.getElementById('avSpecificQuestions');
const networkingItQuestions = document.getElementById('networkingItQuestions');
const bookingForm = document.getElementById('bookingForm');

// Check if elements exist
if (!bookingForm) {
    console.error('Booking form not found!');
}

// Handle service category change
if (serviceCategorySelect) {
    serviceCategorySelect.addEventListener('change', function() {
    const category = this.value;
    
    console.log('Category selected:', category); // Debug log
    
    // Clear previous options
    specificServiceSelect.innerHTML = '<option value="">-- Choose Service --</option>';
    
    if (category) {
        console.log('Showing specific service dropdown'); // Debug log
        
        // Show specific service dropdown
        specificServiceGroup.style.display = 'block';
        specificServiceSelect.setAttribute('required', 'required');
        avSpecificQuestions.style.display = 'none';
        networkingItQuestions.style.display = 'none';
        
        // Populate specific services
        console.log('Available services:', services[category]); // Debug log
        services[category].forEach(service => {
            const option = document.createElement('option');
            option.value = service.value;
            option.textContent = service.label;
            specificServiceSelect.appendChild(option);
            console.log('Added option:', service.label); // Debug log
        });
        
        // Show/hide relevant sections
        if (category === 'av-solutions') {
            eventDetailsSection.style.display = 'block';
            projectDetailsSection.style.display = 'none';
            document.getElementById('additionalTitle').textContent = '4. Additional Information';
        } else if (category === 'networking-it') {
            eventDetailsSection.style.display = 'none';
            projectDetailsSection.style.display = 'block';
            document.getElementById('additionalTitle').textContent = '4. Additional Information';
        }
    } else {
        specificServiceGroup.style.display = 'none';
        specificServiceSelect.removeAttribute('required');
        eventDetailsSection.style.display = 'none';
        projectDetailsSection.style.display = 'none';
        avSpecificQuestions.style.display = 'none';
        networkingItQuestions.style.display = 'none';
    }
});
} else {
    console.error('Service category select not found!');
}

// Handle specific service change
if (specificServiceSelect) {
    specificServiceSelect.addEventListener('change', function() {
    const service = this.value;
    const category = serviceCategorySelect.value;
    
    if (category === 'av-solutions') {
        avSpecificQuestions.style.display = 'block';
        
        // Show package selection for sound system rental
        const packageGroup = document.getElementById('packageSelectionGroup');
        const djGroup = document.getElementById('djServiceGroup');
        const customEquipmentGroup = document.getElementById('customEquipmentGroup');
        
        if (service === 'speech-package' || service === 'full-system' || service === 'custom') {
            if (packageGroup) packageGroup.style.display = 'block';
            if (djGroup) djGroup.style.display = 'block';
            
            // Show custom equipment field only for custom package
            if (service === 'custom') {
                if (customEquipmentGroup) {
                    customEquipmentGroup.style.display = 'block';
                    document.getElementById('customEquipment').setAttribute('required', 'required');
                }
            } else {
                if (customEquipmentGroup) {
                    customEquipmentGroup.style.display = 'none';
                    document.getElementById('customEquipment').removeAttribute('required');
                }
            }
        } else {
            if (packageGroup) packageGroup.style.display = 'none';
            if (djGroup) djGroup.style.display = 'none';
            if (customEquipmentGroup) customEquipmentGroup.style.display = 'none';
        }
    } else if (category === 'networking-it') {
        networkingItQuestions.style.display = 'block';
    }
});
} else {
    console.error('Specific service select not found!');
}

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
if (document.getElementById('eventDate')) {
    document.getElementById('eventDate').setAttribute('min', today);
}
if (document.getElementById('projectStart')) {
    document.getElementById('projectStart').setAttribute('min', today);
}

// Form submission handler
if (bookingForm) {
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('Form submitted!'); // Debug log
        
        // Collect form data
        const formData = new FormData(bookingForm);
        const data = {};
        
        formData.forEach((value, key) => {
            if (key === 'equipment' || key === 'itNeeds') {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });
        
        console.log('Form data collected:', data); // Debug log
        
        await handleBookingSubmission(data);
    });
} else {
    console.error('Booking form not found - cannot attach submit handler!');
}

// Send email notification using EmailJS
function sendEmailNotification(data) {
    // Check if EmailJS is loaded
    if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS not loaded. Email notification skipped.');
    }
    
    // Prepare email template parameters - simplified to match template
    const emailParams = {
        to_email: 'infoev1media@gmail.com',
        from_name: data.fullName || 'Unknown',
        from_email: data.email || 'No email provided',
        phone_number: data.phone || 'No phone provided',
        service_type: `${getServiceCategoryLabel(data.serviceCategory)} - ${getSpecificServiceLabel(data.serviceCategory, data.specificService)}`,
        message_html: createEmailBody(data),
        submission_time: new Date().toLocaleString()
    };
    
    console.log('Sending email with params:', emailParams); // Debug log
    
    // Send email via EmailJS (using Our Services template: template_16txbzw)
    return emailjs.send('service_vt29dhf', 'template_16txbzw', emailParams);
}

async function handleBookingSubmission(data) {
    try {
        const [emailResult, sheetResult] = await Promise.allSettled([
            sendEmailNotification(data),
            sendBookingToSheet(data)
        ]);

        const emailFailed = emailResult.status === 'rejected';
        const sheetSkipped = sheetResult.status === 'fulfilled' && sheetResult.value && sheetResult.value.skipped;
        const sheetFailed = sheetResult.status === 'rejected';

        if (!emailFailed) {
            console.log('Email sent successfully!', emailResult.value && emailResult.value.status, emailResult.value && emailResult.value.text);
            resetBookingFormState();

            if (sheetSkipped) {
                alert('Your booking request was submitted successfully. Google Sheet sync is not active yet. Add your Apps Script /exec URL in form-sheet-config.js.');
            } else if (sheetFailed) {
                console.error('Sheet sync failed:', sheetResult.reason);
                alert('Your booking request was submitted successfully, but Google Sheet sync failed. Please check your Apps Script deployment.');
            } else {
                alert('Your booking request has been submitted successfully and logged to Google Sheets. We will contact you shortly.');
            }
            return;
        }

        if (!sheetSkipped && !sheetFailed) {
            alert('Email notification failed, but your booking was still saved to Google Sheets. Please contact us directly at infoev1media@gmail.com or call (239) 351-6598.');
            return;
        }

        console.error('Email send failed:', emailResult.reason);
        alert('There was an error submitting your booking. Please email us directly at infoev1media@gmail.com or call (239) 351-6598.');
    } catch (error) {
        console.error('Unexpected booking submission error:', error);
        alert('There was an unexpected error while submitting your booking. Please try again.');
    }
}

function resetBookingFormState() {
    bookingForm.reset();
    specificServiceGroup.style.display = 'none';
    eventDetailsSection.style.display = 'none';
    projectDetailsSection.style.display = 'none';
    avSpecificQuestions.style.display = 'none';
    networkingItQuestions.style.display = 'none';
}

function sendBookingToSheet(data) {
    if (!window.EV1MediaSheetBridge || typeof window.EV1MediaSheetBridge.submit !== 'function') {
        return Promise.resolve({ ok: false, skipped: true, reason: 'sheet-bridge-missing' });
    }

    return window.EV1MediaSheetBridge.submit('booking', data);
}

function createEmailBody(data) {
    let body = '<div style="font-family: Arial, sans-serif;">';
    
    // Service Information
    body += '<h3 style="color: #1a73e8;">📋 Service Details</h3>';
    body += `<p><strong>Category:</strong> ${getServiceCategoryLabel(data.serviceCategory)}<br>`;
    body += `<strong>Service:</strong> ${getSpecificServiceLabel(data.serviceCategory, data.specificService)}</p>`;
    
    // Personal Information
    body += '<h3 style="color: #1a73e8;">👤 Client Information</h3>';
    body += `<p><strong>Name:</strong> ${data.fullName}<br>`;
    body += `<strong>Email:</strong> ${data.email}<br>`;
    body += `<strong>Phone:</strong> ${data.phone}<br>`;
    if (data.organization) {
        body += `<strong>Organization:</strong> ${data.organization}<br>`;
    }
    body += '</p>';
    
    // Event or Project Details
    if (data.serviceCategory === 'av-solutions' && data.eventDate) {
        body += '<h3 style="color: #1a73e8;">📅 Event Details</h3>';
        body += '<p>';
        body += `<strong>Date:</strong> ${formatDate(data.eventDate)}<br>`;
        if (data.eventTime) body += `<strong>Time:</strong> ${data.eventTime}<br>`;
        if (data.eventDuration) body += `<strong>Duration:</strong> ${data.eventDuration}<br>`;
        if (data.eventLocation) body += `<strong>Location:</strong> ${data.eventLocation}<br>`;
        if (data.eventType) body += `<strong>Event Type:</strong> ${data.eventType}<br>`;
        if (data.attendees) body += `<strong>Attendees:</strong> ${data.attendees}<br>`;
        body += '</p>';
        
        // Package information for sound rental
        if (data.soundPackage) {
            body += '<h3 style="color: #1a73e8;">🎵 Sound Package</h3>';
            body += `<p><strong>Package:</strong> ${data.soundPackage}<br>`;
            if (data.djService) {
                body += `<strong>DJ Service:</strong> ${data.djService}<br>`;
            }
            body += '</p>';
        }
        
        if (data.equipment && data.equipment.length > 0) {
            body += `<p><strong>Equipment Needed:</strong> ${data.equipment.join(', ')}<br>`;
        }
        if (data.venueType) body += `<strong>Venue Type:</strong> ${data.venueType}<br>`;
        if (data.setupTime) body += `<strong>Setup Service:</strong> ${data.setupTime}`;
        body += '</p>';
    } else if (data.serviceCategory === 'networking-it' && data.projectStart) {
        body += '<h3 style="color: #1a73e8;">💼 Project Details</h3>';
        body += '<p>';
        body += `<strong>Start Date:</strong> ${formatDate(data.projectStart)}<br>`;
        if (data.projectTimeline) body += `<strong>Timeline:</strong> ${data.projectTimeline}<br>`;
        if (data.currentInfrastructure) body += `<strong>Current Infrastructure:</strong> ${data.currentInfrastructure}<br>`;
        if (data.itNeeds && data.itNeeds.length > 0) {
            body += `<strong>Requested Services:</strong> ${data.itNeeds.join(', ')}<br>`;
        }
        if (data.serviceGoal) body += `<strong>Service Goal:</strong> ${data.serviceGoal}<br>`;
        body += '</p>';
    }
    
    // Budget & Payment
    body += '<h3 style="color: #1a73e8;">💰 Budget & Payment</h3>';
    body += '<p>';
    body += `<strong>Budget:</strong> ${data.budget}<br>`;
    body += `<strong>Payment Method:</strong> ${data.paymentMethod}<br>`;
    if (data.depositPreference) {
        body += `<strong>Deposit Preference:</strong> ${data.depositPreference}<br>`;
    }
    body += '</p>';
    
    // Additional Information
    if (data.additionalComments) {
        body += '<h3 style="color: #1a73e8;">💬 Additional Comments</h3>';
        body += `<p>${data.additionalComments}</p>`;
    }
    
    if (data.referral) {
        body += `<p><strong>Referral Source:</strong> ${data.referral}</p>`;
    }
    
    body += '</div>';
    return body;
}

function createWhatsAppMessage(data) {
    let message = '🎯 NEW BOOKING REQUEST - Ev1media\n\n';
    
    // Service Information
    message += '📋 SERVICE DETAILS\n';
    message += `Category: ${getServiceCategoryLabel(data.serviceCategory)}\n`;
    message += `Service: ${getSpecificServiceLabel(data.serviceCategory, data.specificService)}\n\n`;
    
    // Personal Information
    message += '👤 CLIENT INFORMATION\n';
    message += `Name: ${data.fullName}\n`;
    message += `Email: ${data.email}\n`;
    message += `Phone: ${data.phone}\n`;
    if (data.organization) {
        message += `Organization: ${data.organization}\n`;
    }
    message += '\n';
    
    // Event or Project Details
    if (data.serviceCategory === 'av-solutions' && data.eventDate) {
        message += '📅 EVENT DETAILS\n';
        message += `Date: ${formatDate(data.eventDate)}\n`;
        if (data.eventTime) message += `Time: ${data.eventTime}\n`;
        if (data.eventDuration) message += `Duration: ${data.eventDuration}\n`;
        if (data.eventLocation) message += `Location: ${data.eventLocation}\n`;
        if (data.eventType) message += `Event Type: ${data.eventType}\n`;
        if (data.attendees) message += `Attendees: ${data.attendees}\n`;
        
        // Package information for sound rental
        if (data.soundPackage) {
            message += `\n🎵 SOUND PACKAGE\n`;
            message += `Package: ${data.soundPackage}\n`;
            if (data.djService) {
                message += `DJ Service: ${data.djService}\n`;
            }
        }
        
        if (data.equipment && data.equipment.length > 0) {
            message += `\n📦 Equipment Needed: ${data.equipment.join(', ')}\n`;
        }
        if (data.venueType) message += `Venue Type: ${data.venueType}\n`;
        if (data.setupTime) message += `Setup Service: ${data.setupTime}\n`;
        message += '\n';
    } else if (data.serviceCategory === 'networking-it' && data.projectStart) {
        message += '💼 PROJECT DETAILS\n';
        message += `Start Date: ${formatDate(data.projectStart)}\n`;
        if (data.projectTimeline) message += `Timeline: ${data.projectTimeline}\n`;
        if (data.currentInfrastructure) message += `Current Infrastructure: ${data.currentInfrastructure}\n`;
        
        if (data.itNeeds && data.itNeeds.length > 0) {
            message += `Requested Services: ${data.itNeeds.join(', ')}\n`;
        }
        if (data.serviceGoal) message += `Service Goal: ${data.serviceGoal}\n`;
        message += '\n';
    }
    
    // Budget & Payment
    message += '💰 BUDGET & PAYMENT\n';
    message += `Budget: ${data.budget}\n`;
    message += `Payment Method: ${data.paymentMethod}\n`;
    if (data.depositPreference) {
        message += `Deposit Preference: ${data.depositPreference}\n`;
    }
    message += '\n';
    
    // Additional Information
    if (data.additionalComments) {
        message += '💬 ADDITIONAL COMMENTS\n';
        message += `${data.additionalComments}\n\n`;
    }
    
    if (data.referral) {
        message += `Referral Source: ${data.referral}\n`;
    }
    
    message += '\n---\n';
    message += '⏰ Booking submitted: ' + new Date().toLocaleString();
    
    return message;
}

function getServiceCategoryLabel(category) {
    const labels = {
        'av-solutions': 'Audio Services',
        'networking-it': 'Networking and IT Services'
    };
    return labels[category] || category;
}

function getSpecificServiceLabel(category, service) {
    const serviceList = services[category];
    if (!serviceList) return service;
    
    const found = serviceList.find(s => s.value === service);
    return found ? found.label : service;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

}); // End of DOMContentLoaded



