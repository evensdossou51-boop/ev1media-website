// EV1 Media Website Support Chatbot
// Rule-based assistant: no paid LLM/API required.

const WHATSAPP_NUMBER = '2393516598';

class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.conversationContext = [];
        this.userInfo = { name: '', lastQuestion: '' };
        this.init();
    }

    init() {
        this.createChatButton();
        this.createChatWindow();
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    createChatButton() {
        const button = document.createElement('div');
        button.id = 'chat-button';
        button.innerHTML = `
            <img src="images/dj-avatar.png" alt="EV1 Media Support" class="dj-avatar-img">
            <span class="chat-notification" id="chat-notification">1</span>
        `;
        document.body.appendChild(button);
    }

    createChatWindow() {
        const chatWindow = document.createElement('div');
        chatWindow.id = 'chat-window';
        chatWindow.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-status-dot"></div>
                    <div>
                        <div class="chat-title">EV1 Media Support</div>
                        <div class="chat-status">Typically replies instantly</div>
                    </div>
                </div>
                <button class="chat-close" id="chat-close" aria-label="Close chat">&times;</button>
            </div>
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-container">
                <textarea id="chat-input" placeholder="Ask about AV, networking or custom software..." rows="1" maxlength="1500"></textarea>
                <button id="chat-send" aria-label="Send message">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M2 10L18 2L10 18L8 11L2 10Z" fill="white"/>
                    </svg>
                </button>
            </div>
        `;
        document.body.appendChild(chatWindow);
    }

    setupEventListeners() {
        document.getElementById('chat-button').addEventListener('click', () => this.toggleChat());
        document.getElementById('chat-close').addEventListener('click', () => this.toggleChat());
        document.getElementById('chat-send').addEventListener('click', () => this.sendMessage());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('chat-window');
        const chatButton = document.getElementById('chat-button');
        const notification = document.getElementById('chat-notification');

        if (this.isOpen) {
            chatWindow.classList.add('open');
            chatButton.classList.add('hidden');
            notification.style.display = 'none';
        } else {
            chatWindow.classList.remove('open');
            chatButton.classList.remove('hidden');
        }
    }

    addWelcomeMessage() {
        const welcomeMessages = [
            "Hi! Welcome to EV1 Media!",
            "I can help with custom AV integration, livestreaming, networking, projection/display systems and custom software.",
            "What are you looking to build, upgrade or improve?"
        ];

        setTimeout(() => {
            welcomeMessages.forEach((msg, index) => {
                setTimeout(() => this.addMessage(msg, 'bot'), index * 650);
            });
        }, 700);
    }

    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';
        input.style.height = 'auto';
        this.showTypingIndicator();

        setTimeout(() => {
            this.hideTypingIndicator();
            this.addMessage(this.getBotResponse(message), 'bot');
        }, 700 + Math.random() * 700);
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(text, sender)}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.messages.push({ text, sender, time: new Date() });
    }

    formatMessage(text, sender) {
        let output = String(text);

        // Visitor messages are always escaped. Bot HTML is controlled by this file.
        if (sender === 'user') {
            output = output
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        output = output.replace(/\n/g, '<br>');
        return output;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<div class="message-content"><span></span><span></span><span></span></div>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    getBotResponse(message) {
        const lowerMessage = message.toLowerCase();
        this.conversationContext.push(lowerMessage);
        this.conversationContext = this.conversationContext.slice(-6);
        this.userInfo.lastQuestion = message;

        if (!this.userInfo.name && (lowerMessage.includes('my name is') || lowerMessage.includes("i'm ") || lowerMessage.includes("i am "))) {
            const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([a-zA-ZÀ-ÿ'-]+)/i);
            if (nameMatch) {
                this.userInfo.name = nameMatch[1];
                return `Nice to meet you, ${this.escapeText(this.userInfo.name)}! What can I help you with — AV/network integration or custom software?`;
            }
        }

        if (/^(hello|hi|hey|good morning|good afternoon|good evening|yo|greetings)\b/.test(lowerMessage)) {
            const greeting = this.userInfo.name ? `Hello again, ${this.escapeText(this.userInfo.name)}!` : 'Hello!';
            return `${greeting} EV1 Media provides custom technology solutions for churches, businesses and organizations.\n\nI can help with:\n• Custom AV integration\n• Audio systems\n• Livestream & video\n• Projection & displays\n• Networking & IT\n• Custom software development\n\nWhat do you need help with?`;
        }

        if (this.matchesIntent(lowerMessage, ['what do you do', 'what do you offer', 'all services', 'your services', 'services', 'capabilities', 'help me with'])) {
            return "<strong>EV1 Media services</strong>\n\n<strong>Custom AV Integration</strong> — AV system planning, upgrades and technical integration.\n\n<strong>Audio Systems</strong> — planning, upgrades, restoration, tuning, troubleshooting and signal-flow improvements.\n\n<strong>Livestream & Video</strong> — cameras, switching, streaming and production workflows.\n\n<strong>Projection & Displays</strong> — projectors, displays, presentation systems, lyrics and media routing.\n\n<strong>Networking & IT</strong> — structured cabling, Wi-Fi, rack cleanup/builds and stable network infrastructure.\n\n<strong>Custom Software Development</strong> — management platforms, dashboards, portals, databases, workflow automation and integrations built around your organization.\n\n<a href='solutions.html'>Explore AV & technical services</a> or <a href='custom-software.html'>explore custom software</a>.";
        }

        // Custom software comes before generic "system" / technical matches.
        if (this.matchesIntent(lowerMessage, [
            'software', 'app', 'application', 'dashboard', 'portal', 'database', 'automation',
            'automate', 'workflow', 'internal platform', 'management platform', 'custom platform',
            'api integration', 'integrate software', 'crm', 'employee system', 'reporting system'
        ])) {
            return "Yes — EV1 Media develops <strong>custom software built around your operation</strong>.\n\nWe can build:\n• Management platforms\n• Internal dashboards and reporting systems\n• Client, employee or member portals\n• Databases and internal tools\n• Workflow automation\n• API and system integrations\n\nCustom software is designed for churches, ministries, nonprofits and small businesses. Projects currently start at <strong>$2,000</strong>, with final pricing based on scope.\n\n<a href='custom-software.html'>View Custom Software</a> · <a href='custom-software-intake.html'>Start a Software Project</a>";
        }

        if (this.matchesIntent(lowerMessage, ['livestream', 'live stream', 'streaming', 'camera', 'video', 'switcher', 'atem', 'broadcast', 'production'])) {
            return "Our <strong>Livestream & Video</strong> work includes camera systems, video switching, streaming workflows and media-booth/production setup designed for dependable live communication.\n\nWe can evaluate an existing setup or design a customized system around your team and space.\n\n<a href='booking.html'>Request AV Service</a>";
        }

        if (this.matchesIntent(lowerMessage, ['projection', 'projector', 'display', 'screen', 'presentation', 'lyrics', 'media routing', 'video wall'])) {
            return "Our <strong>Projection & Display</strong> services include projectors, displays, presentation systems, lyrics/media workflows and media routing. We design the system around the room, content and people operating it.\n\n<a href='booking.html'>Request AV Service</a>";
        }

        if (this.matchesIntent(lowerMessage, ['network', 'networking', 'wifi', 'wi-fi', 'cabling', 'structured cabling', 'rack', 'switch', 'vlan', 'internet', 'ethernet', 'access point'])) {
            return "Our <strong>Networking & IT</strong> services include structured cabling, Wi-Fi, rack cleanup/builds and stable network infrastructure for AV, streaming and daily operations.\n\nWe can assess your current environment and design a network around your actual requirements.\n\n<a href='booking.html'>Start a Network Project</a>";
        }

        if (this.matchesIntent(lowerMessage, ['audio', 'sound', 'speaker', 'microphone', 'mic', 'mixer', 'console', 'signal flow', 'tuning', 'church sound'])) {
            return "Our <strong>Audio Systems</strong> services include system planning, upgrades, restoration, tuning, troubleshooting and clean signal-flow design. We focus on creating a reliable system that fits your room, workflow and team.\n\n<a href='booking.html'>Request Audio / AV Service</a>";
        }

        if (this.matchesIntent(lowerMessage, ['av', 'audio video', 'audiovisual', 'technical system', 'system integration', 'integration'])) {
            return "EV1 Media provides <strong>custom AV integration</strong> for churches, businesses and organizations. That can include audio, video, livestreaming, projection/display systems and the network infrastructure supporting them.\n\nTell me what you currently have and what you want to improve, or <a href='booking.html'>start a service request</a>.";
        }

        if (this.matchesIntent(lowerMessage, ['price', 'cost', 'how much', 'pricing', 'budget', 'quote', 'estimate', 'rate'])) {
            const recent = this.conversationContext.join(' ');
            if (this.matchesIntent(recent, ['software', 'app', 'dashboard', 'portal', 'automation', 'platform', 'database'])) {
                return "Custom software projects currently start at <strong>$2,000</strong>. Final pricing depends on scope, features, integrations, users and complexity.\n\n<a href='custom-software-intake.html'>Start the software intake</a> so the team can understand your project.";
            }

            return "AV and network pricing is <strong>custom to the project</strong> because equipment, system scope, installation conditions and existing infrastructure vary.\n\n<a href='booking.html'>Request a service quote</a> or contact our team with your current setup and desired outcome.";
        }

        if (this.matchesIntent(lowerMessage, ['book', 'schedule', 'appointment', 'hire', 'start a project', 'request service', 'interested in'])) {
            const recent = this.conversationContext.join(' ');
            if (this.matchesIntent(recent, ['software', 'app', 'dashboard', 'portal', 'automation', 'platform', 'database'])) {
                return "Great! For a custom software project, please complete our <a href='custom-software-intake.html'><strong>Custom Software Intake</strong></a>. That gives our team the information needed to understand your workflow, features and goals.";
            }

            return "Great! For AV, audio, livestream, projection or networking work, please complete our <a href='booking.html'><strong>Service Request</strong></a>. You can also call <a href='tel:+12393516598'>(239) 351-6598</a> or continue on WhatsApp.";
        }

        if (this.matchesIntent(lowerMessage, ['partnership', 'partner', 'press', 'media inquiry', 'corporate inquiry', 'investor', 'venture', 'corporate'])) {
            return "For partnerships, media requests or corporate inquiries, please use our <a href='contact.html'>contact form</a> or email <a href='mailto:info@ev1media.com'>info@ev1media.com</a>.";
        }

        if (this.matchesIntent(lowerMessage, ['contact', 'phone', 'email', 'reach', 'call', 'message', 'talk to', 'speak with', 'whatsapp'])) {
            return "You can reach EV1 Media here:\n\n<strong>Phone:</strong> <a href='tel:+12393516598'>(239) 351-6598</a>\n<strong>Email:</strong> <a href='mailto:info@ev1media.com'>info@ev1media.com</a>\n<strong>WhatsApp:</strong> <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background:#25D366;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;font-weight:600\">Message on WhatsApp</button>\n\nYou can also use our <a href='contact.html'>contact page</a>.";
        }

        if (this.matchesIntent(lowerMessage, ['location', 'where do you serve', 'service area', 'travel', 'come to'])) {
            return "EV1 Media serves clients in Florida. For projects outside your immediate area or larger installations, contact us with the project location so the team can confirm availability.";
        }

        if (this.matchesIntent(lowerMessage, ['thank', 'thanks', 'appreciate', 'awesome', 'great', 'perfect'])) {
            return "You're very welcome! Is there anything else you'd like to know about our AV, networking or custom software services?";
        }

        if (/^(yes|yeah|yep|sure|ok|okay|y)$/.test(lowerMessage)) {
            return "Great. Tell me which area you need help with: <strong>AV/audio</strong>, <strong>livestream/video</strong>, <strong>projection/displays</strong>, <strong>networking</strong>, or <strong>custom software</strong>.";
        }

        if (/^(no|nope|nah|not really|n)$/.test(lowerMessage)) {
            return "No problem. If you need anything else, I can help with EV1 Media's AV, networking and custom software services.";
        }

        if (this.matchesIntent(lowerMessage, ['bye', 'goodbye', 'see you', 'later', 'have a good'])) {
            return "Thank you for chatting with EV1 Media! You can reach us at <a href='tel:+12393516598'>(239) 351-6598</a> or <a href='mailto:info@ev1media.com'>info@ev1media.com</a>.";
        }

        return this.getUnknownResponseWithSupport(message);
    }

    matchesIntent(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    escapeText(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    getUnknownResponseWithSupport(userMessage) {
        return `I want to make sure you get an accurate answer. EV1 Media focuses on custom AV integration, audio, livestream/video, projection/displays, networking/IT and custom software development.\n\nIf your question is more specific, you can continue with our team:\n<button onclick="chatWidget.connectToWhatsApp()" style="background:#25D366;color:white;border:none;padding:10px 16px;border-radius:6px;cursor:pointer;font-weight:600;margin-top:8px">Continue on WhatsApp</button>\n\nCall: <a href='tel:+12393516598'>(239) 351-6598</a>\nEmail: <a href='mailto:info@ev1media.com'>info@ev1media.com</a>`;
    }

    connectToWhatsApp(customMessage = '') {
        const message = customMessage || this.userInfo.lastQuestion || 'Hi! I have a question about EV1 Media services.';
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            `Hello! I was chatting on the EV1 Media website.\n\nMy question: ${message}\n\n${this.userInfo.name ? `My name: ${this.userInfo.name}` : ''}`
        )}`;
        window.open(whatsappURL, '_blank', 'noopener');
    }
}

let chatWidget;
document.addEventListener('DOMContentLoaded', () => {
    chatWidget = new ChatWidget();
});
