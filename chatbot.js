// Chat Widget Configuration
const WHATSAPP_NUMBER = '12393516598'; // Your WhatsApp Business number

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
            <img src="images/dj-avatar.png" alt="DJ Support" class="dj-avatar-img">
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
                        <div class="chat-title">Ev1media Support</div>
                        <div class="chat-status">Typically replies instantly</div>
                    </div>
                </div>
                <button class="chat-close" id="chat-close">×</button>
            </div>
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-container">
                <textarea id="chat-input" placeholder="Type your message..." rows="1"></textarea>
                <button id="chat-send">
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
            "👋 Hi! Welcome to Ev1media!",
            "I'm here to help you with our AV Solutions and Digital Marketing services.",
            "How can I assist you today?"
        ];
        
        setTimeout(() => {
            welcomeMessages.forEach((msg, index) => {
                setTimeout(() => {
                    this.addMessage(msg, 'bot');
                }, index * 800);
            });
        }, 1000);
    }

    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage(message, 'user');
            input.value = '';
            input.style.height = 'auto';
            
            // Simulate typing
            this.showTypingIndicator();
            
            // Get bot response
            setTimeout(() => {
                this.hideTypingIndicator();
                const response = this.getBotResponse(message);
                this.addMessage(response, 'bot');
            }, 1000 + Math.random() * 1000);
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(text)}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        this.messages.push({ text, sender, time: new Date() });
    }

    formatMessage(text) {
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        
        // Convert line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    getBotResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Store conversation context
        this.conversationContext.push(lowerMessage);
        this.userInfo.lastQuestion = message;
        
        // Check for name in message
        if (!this.userInfo.name && (lowerMessage.includes('my name is') || lowerMessage.includes("i'm ") || lowerMessage.includes("i am "))) {
            const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([a-zA-Z]+)/i);
            if (nameMatch) {
                this.userInfo.name = nameMatch[1];
                return `Nice to meet you, ${this.userInfo.name}! 😊 How can I help you today?`;
            }
        }
        
        // Greetings (check first to be friendly)
        if (lowerMessage.match(/^(hello|hi|hey|good morning|good afternoon|good evening|yo|sup|greetings)/)) {
            const greeting = this.userInfo.name ? `Hello again, ${this.userInfo.name}!` : "Hello!";
            return `${greeting} 👋 Thanks for reaching out to Ev1media!\n\nI can help you with:\n• AV Solutions & Sound Systems\n• Digital Marketing Services\n• Booking & Pricing\n• General Questions\n\nWhat would you like to know?`;
        }
        
        // Service inquiries with natural language
        if (this.matchesIntent(lowerMessage, ['service', 'what do you do', 'what do you offer', 'tell me about', 'what can you do', 'help me with'])) {
            return "We offer two main services:\n\n🎤 <strong>AV Solutions</strong> - Sound systems, lighting, video production, and live event services\n\n📱 <strong>Digital Marketing</strong> - Social media management, web design, advertising, and content creation\n\nWhich would you like to know more about?";
        }
        
        // Pricing with context awareness
        if (this.matchesIntent(lowerMessage, ['price', 'cost', 'how much', 'pricing', 'budget', 'afford', 'expensive', 'cheap', 'rate'])) {
            const lastContext = this.conversationContext.slice(-3).join(' ');
            let response = "Our pricing varies based on your specific needs:\n\n";
            
            if (lastContext.includes('sound') || lastContext.includes('av') || lastContext.includes('audio')) {
                response += "💰 <strong>AV Solutions:</strong>\n• Speech Package: $500-$800\n• Small Event: $800-$1,200\n• Medium Event: $1,200-$1,800\n• Large Event: $1,800-$2,500+\n";
            } else if (lastContext.includes('market') || lastContext.includes('website') || lastContext.includes('social')) {
                response += "💰 <strong>Digital Marketing:</strong>\n• Social Media: $300-$1,500/month\n• Web Design: $1,000-$5,000+\n• Advertising: $500-$3,000/month\n• Content Creation: $200-$1,000+\n";
            } else {
                response += "💰 AV Solutions: $500 - $5,000+\n💰 Digital Marketing: $200 - $5,000+\n";
            }
            
            response += "\nWould you like a custom quote? I can connect you with our team!";
            return response;
        }
        
        // Booking with urgency detection
        if (this.matchesIntent(lowerMessage, ['book', 'schedule', 'appointment', 'reserve', 'hire', 'rent', 'need', 'want to book', 'interested in'])) {
            return "Great! I'd love to help you book a service. You have a few options:\n\n📅 <a href='booking.html'><strong>Fill out our booking form</strong></a>\n📞 <strong>Call us:</strong> (239) 351-6598\n💬 <strong>WhatsApp:</strong> <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: 600;\">Chat on WhatsApp</button>\n\nOr I can connect you with our team right now. What works best for you?";
        }
        
        // AV Solutions with detailed understanding
        if (this.matchesIntent(lowerMessage, ['sound', 'audio', 'speaker', 'microphone', 'mic', 'av', 'equipment', 'system', 'lighting', 'video', 'camera', 'event', 'concert', 'church'])) {
            return "Our AV Solutions include:\n\n🎤 <strong>Sound System Rental</strong> (multiple packages available)\n📹 <strong>Video & Lighting</strong>\n🎬 <strong>Live Event Production</strong>\n⚙️ <strong>Installation & Setup</strong>\n\nAll sound packages include 1 mixer and 2 microphones. We also offer DJ services!\n\nWould you like to <a href='services.html'>view details</a>, <a href='booking.html'>book now</a>, or chat with our team on <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background: #25D366; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;\">WhatsApp</button>?";
        }
        
        // Digital Marketing with context
        if (this.matchesIntent(lowerMessage, ['market', 'social media', 'website', 'digital', 'facebook', 'instagram', 'online', 'web design', 'seo', 'advertising', 'content', 'brand'])) {
            return "Our Digital Marketing services include:\n\n📱 <strong>Social Media Management</strong>\n🌐 <strong>Web Design & Development</strong>\n📊 <strong>Digital Advertising</strong>\n✍️ <strong>Content Creation</strong>\n📧 <strong>Email Marketing</strong>\n🎯 <strong>Brand Strategy</strong>\n\nWould you like to <a href='services.html'>learn more</a>, <a href='booking.html'>start a project</a>, or discuss via <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background: #25D366; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;\">WhatsApp</button>?";
        }
        
        // Contact information
        if (this.matchesIntent(lowerMessage, ['contact', 'phone', 'email', 'reach', 'call', 'message', 'talk to', 'speak with'])) {
            return "You can reach us:\n\n📞 <strong>Phone:</strong> <a href='tel:+12393516598'>(239) 351-6598</a>\n📧 <strong>Email:</strong> <a href='mailto:info@ev1media.com'>info@ev1media.com</a>\n💬 <strong>WhatsApp:</strong> <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: 600;\">Message on WhatsApp</button>\n📍 <strong>Location:</strong> Serving Georgia & Florida\n\nWe're available 24/7! You can also <a href='contact.html'>visit our contact page</a>.";
        }
        
        // Hours/Availability
        if (this.matchesIntent(lowerMessage, ['hour', 'open', 'available', 'when', 'time', 'business hour'])) {
            return "We're available <strong>24/7</strong> to serve you! 🌟\n\nFor immediate assistance:\n📞 <strong>Call:</strong> (239) 351-6598\n💬 <strong>WhatsApp:</strong> <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: 600;\">Chat Now</button>\n\nHow can I help you today?";
        }
        
        // Location
        if (this.matchesIntent(lowerMessage, ['location', 'where', 'area', 'serve', 'travel', 'come to'])) {
            return "We serve churches and businesses in:\n\n📍 <strong>Georgia</strong>\n📍 <strong>Florida</strong>\n\nWe travel for events and can discuss your specific location. Where is your event or business located?";
        }
        
        // Packages
        if (this.matchesIntent(lowerMessage, ['package', 'option', 'what size', 'different type'])) {
            return "We offer several sound system packages:\n\n🎵 <strong>Speech Package:</strong> 2 speakers, 2 mics, 1 mixer ($500-$800)\n🎵 <strong>Small Event:</strong> 4 speakers, 4 mics, 1 mixer ($800-$1,200)\n🎵 <strong>Medium Event:</strong> 6 speakers, 6 mics, 1 mixer ($1,200-$1,800)\n🎵 <strong>Large Event:</strong> 8+ speakers, multiple mics ($1,800-$2,500+)\n🎵 <strong>Custom Package:</strong> Let's discuss your specific needs!\n\nAll packages include professional setup! Ready to <a href='booking.html'>book</a> or <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background: #25D366; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;\">discuss on WhatsApp</button>?";
        }
        
        // DJ Services
        if (this.matchesIntent(lowerMessage, ['dj', 'music', 'entertainment', 'party'])) {
            return "Yes! We offer DJ services as an add-on to our sound packages! 🎧\n\n💰 <strong>DJ Service:</strong> $300-$800 (depending on event duration)\n\nOur DJs can provide music for:\n• Weddings\n• Parties\n• Corporate Events\n• Church Events\n• And more!\n\nWant to discuss your event? <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: 600;\">Chat on WhatsApp</button>";
        }
        
        // Thanks/Appreciation
        if (this.matchesIntent(lowerMessage, ['thank', 'thanks', 'appreciate', 'awesome', 'great', 'perfect'])) {
            return "You're very welcome! � Is there anything else I can help you with today?";
        }
        
        // Yes/No responses (contextual)
        if (lowerMessage.match(/^(yes|yeah|yep|sure|ok|okay|y)$/)) {
            return "Great! How can I assist you further? Would you like to:\n\n📅 <a href='booking.html'>Book a service</a>\n💬 <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: 600;\">Chat with our team</button>\n📞 Call us at (239) 351-6598";
        }
        
        if (lowerMessage.match(/^(no|nope|nah|not really|n)$/)) {
            return "No problem! Feel free to ask me anything else, or I can connect you with our team for more personalized assistance. 😊";
        }
        
        // Goodbye
        if (this.matchesIntent(lowerMessage, ['bye', 'goodbye', 'see you', 'later', 'have a good'])) {
            return "Thank you for chatting with Ev1media! Have a great day! 👋\n\nFeel free to reach out anytime:\n📞 (239) 351-6598\n💬 <button onclick=\"chatWidget.connectToWhatsApp()\" style=\"background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;\">WhatsApp</button>";
        }
        
        // Unknown/Complex query - offer human assistance
        return this.getUnknownResponseWithSupport(message);
    }
    
    matchesIntent(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }
    
    getUnknownResponseWithSupport(userMessage) {
        const responses = [
            "I want to make sure you get the best answer! Let me connect you with our team who can help with your specific question.",
            "That's a great question! Our team can provide you with detailed information about that.",
            "I'd like to give you the most accurate information. Let me connect you with someone who specializes in this!"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // Send notification to WhatsApp with user's question
        this.notifyTeamOnWhatsApp(userMessage);
        
        return `${randomResponse}\n\n💬 <strong>Chat with our team now:</strong>\n<button onclick=\"chatWidget.connectToWhatsApp('${encodeURIComponent(userMessage)}')\" style=\"background: #25D366; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1em; margin-top: 10px; box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3);\">💬 Continue on WhatsApp</button>\n\n<em>You can also:</em>\n📞 Call: <a href='tel:+12393516598'>(239) 351-6598</a>\n📧 Email: <a href='mailto:info@ev1media.com'>info@ev1media.com</a>`;
    }
    
    connectToWhatsApp(customMessage = '') {
        const message = customMessage || this.userInfo.lastQuestion || 'Hi! I have a question about your services.';
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            `Hello! I was chatting on your website.\n\nMy question: ${message}\n\n${this.userInfo.name ? `My name: ${this.userInfo.name}` : ''}`
        )}`;
        window.open(whatsappURL, '_blank');
    }
    
    notifyTeamOnWhatsApp(userMessage) {
        // This creates a notification link that can be auto-sent
        const notificationMessage = `🔔 New Website Chat Inquiry!\n\nVisitor Question: "${userMessage}"\n\n${this.userInfo.name ? `Visitor Name: ${this.userInfo.name}\n` : ''}Time: ${new Date().toLocaleString()}\n\nConversation History:\n${this.conversationContext.slice(-5).join('\n')}`;
        
        // Log for debugging (in production, this could trigger an actual notification)
        console.log('Team Notification:', notificationMessage);
    }
}

// Initialize chat widget when page loads
let chatWidget;
document.addEventListener('DOMContentLoaded', () => {
    chatWidget = new ChatWidget();
});
