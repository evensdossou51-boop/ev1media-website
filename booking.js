// Service options for each category
const services = {
    'av-solutions': [
        { value: 'sound-rental', label: 'Sound System Rental' },
        { value: 'video-lighting', label: 'Video & Lighting' },
        { value: 'event-production', label: 'Live Event Production' },
        { value: 'installation', label: 'Installation & Setup' }
    ],
    'digital-marketing': [
        { value: 'social-media', label: 'Social Media Management' },
        { value: 'web-design', label: 'Web Design & Development' },
        { value: 'digital-ads', label: 'Digital Advertising' },
        { value: 'content-creation', label: 'Content Creation' },
        { value: 'email-marketing', label: 'Email Marketing' },
        { value: 'brand-strategy', label: 'Brand Strategy' }
    ]
};

// Your WhatsApp number (use international format without + or spaces)
const WHATSAPP_NUMBER = '12393516598'; // Replace with your actual WhatsApp number

// DOM Elements
const serviceCategorySelect = document.getElementById('serviceCategory');
const specificServiceGroup = document.getElementById('specificServiceGroup');
const specificServiceSelect = document.getElementById('specificService');
const eventDetailsSection = document.getElementById('eventDetailsSection');
const projectDetailsSection = document.getElementById('projectDetailsSection');
const avSpecificQuestions = document.getElementById('avSpecificQuestions');
const digitalMarketingQuestions = document.getElementById('digitalMarketingQuestions');
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
            document.getElementById('budgetTitle').textContent = '4. Budget & Payment';
            document.getElementById('additionalTitle').textContent = '5. Additional Information';
        } else if (category === 'digital-marketing') {
            eventDetailsSection.style.display = 'none';
            projectDetailsSection.style.display = 'block';
            document.getElementById('budgetTitle').textContent = '4. Budget & Payment';
            document.getElementById('additionalTitle').textContent = '5. Additional Information';
        }
    } else {
        specificServiceGroup.style.display = 'none';
        specificServiceSelect.removeAttribute('required');
        eventDetailsSection.style.display = 'none';
        projectDetailsSection.style.display = 'none';
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
        
        if (service === 'sound-rental') {
            packageGroup.style.display = 'block';
            djGroup.style.display = 'block';
        } else {
            packageGroup.style.display = 'none';
            djGroup.style.display = 'none';
        }
    } else if (category === 'digital-marketing') {
        digitalMarketingQuestions.style.display = 'block';
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
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        console.log('Form submitted!'); // Debug log
        
        // Collect form data
        const formData = new FormData(bookingForm);
        const data = {};
        
        formData.forEach((value, key) => {
            if (key === 'equipment' || key === 'platforms') {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });
        
        console.log('Form data collected:', data); // Debug log
        
        // Send email notification
        sendEmailNotification(data);
        
        // Create WhatsApp message
        const message = createWhatsAppMessage(data);
        
        // Send to WhatsApp
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp
        window.open(whatsappURL, '_blank');
        
        // Show confirmation
        alert('Your booking request has been submitted! You will receive a confirmation via WhatsApp and email.');
        
        // Optional: Reset form
        // bookingForm.reset();
    });
} else {
    console.error('Booking form not found - cannot attach submit handler!');
}

// Send email notification using EmailJS
function sendEmailNotification(data) {
    // Check if EmailJS is loaded
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS not loaded. Email notification skipped.');
        return;
    }
    
    // Prepare email template parameters
    const emailParams = {
        to_email: 'infoev1media@gmail.com', // Your email
        from_name: data.fullName || 'Unknown',
        from_email: data.email || 'No email provided',
        from_phone: data.phone || 'No phone provided',
        organization: data.organization || 'Not specified',
        service_category: getServiceCategoryLabel(data.serviceCategory),
        specific_service: getSpecificServiceLabel(data.serviceCategory, data.specificService),
        event_date: data.eventDate ? formatDate(data.eventDate) : 'Not specified',
        event_time: data.eventTime || 'Not specified',
        event_location: data.eventLocation || 'Not specified',
        event_duration: data.eventDuration || 'Not specified',
        event_type: data.eventType || 'Not specified',
        attendees: data.attendees || 'Not specified',
        sound_package: data.soundPackage ? data.soundPackage.split(' - ')[0] : 'Not applicable',
        dj_service: data.djService || 'Not applicable',
        budget: data.budget || 'Not specified',
        payment_method: data.paymentMethod || 'Not specified',
        additional_comments: data.additionalComments || 'None',
        referral: data.referral || 'Not specified',
        submission_time: new Date().toLocaleString(),
        message_body: createWhatsAppMessage(data) // Full details
    };
    
    // Send email via EmailJS
    emailjs.send('service_bdwty3g', 'eze0xqi', emailParams)
        .then(function(response) {
            console.log('Email sent successfully!', response.status, response.text);
            alert('✅ Email notification sent successfully!');
        }, function(error) {
            console.error('Email send failed:', error);
            alert('⚠️ Email notification failed, but WhatsApp message will still be sent.');
        });
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
    } else if (data.serviceCategory === 'digital-marketing' && data.projectStart) {
        message += '💼 PROJECT DETAILS\n';
        message += `Start Date: ${formatDate(data.projectStart)}\n`;
        if (data.projectTimeline) message += `Timeline: ${data.projectTimeline}\n`;
        if (data.currentWebsite) message += `Current Website: ${data.currentWebsite}\n`;
        
        if (data.platforms && data.platforms.length > 0) {
            message += `Platforms: ${data.platforms.join(', ')}\n`;
        }
        if (data.marketingGoal) message += `Marketing Goal: ${data.marketingGoal}\n`;
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
        'av-solutions': 'AV Solutions',
        'digital-marketing': 'Digital Marketing'
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

