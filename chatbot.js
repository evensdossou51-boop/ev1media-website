// EV1 Media AI Chat Widget
// The browser never receives an AI provider API key. Requests are proxied through
// the EV1 Media Google Apps Script web app, which reads secrets from Script Properties.

const WHATSAPP_NUMBER = "2393516598";
const EV1MEDIA_CHAT_ENDPOINT = "https://script.google.com/macros/s/AKfycbwE1jEa_6SSWJT0DGCC7Zs_mKgtoOsrprC6W2iLuth-7hgOrg-EE5FVBD5CDwfg05MVvQ/exec";

class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.userInfo = { name: "", lastQuestion: "" };
        this.sessionId = this.getOrCreateSessionId();
        this.init();
    }

    init() {
        this.createChatButton();
        this.createChatWindow();
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    getOrCreateSessionId() {
        const key = "ev1media_chat_session";
        let value = sessionStorage.getItem(key);

        if (!value) {
            value = "web-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
            sessionStorage.setItem(key, value);
        }

        return value;
    }

    createChatButton() {
        const button = document.createElement("div");
        button.id = "chat-button";
        button.innerHTML = `
            <img src="images/dj-avatar.png" alt="EV1 Media Support" class="dj-avatar-img">
            <span class="chat-notification" id="chat-notification">1</span>
        `;
        document.body.appendChild(button);
    }

    createChatWindow() {
        const chatWindow = document.createElement("div");
        chatWindow.id = "chat-window";
        chatWindow.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-status-dot"></div>
                    <div>
                        <div class="chat-title">EV1 Media Assistant</div>
                        <div class="chat-status">AI-assisted support</div>
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
        document.getElementById("chat-button").addEventListener("click", () => this.toggleChat());
        document.getElementById("chat-close").addEventListener("click", () => this.toggleChat());
        document.getElementById("chat-send").addEventListener("click", () => this.sendMessage());
        document.getElementById("chat-input").addEventListener("keypress", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById("chat-window");
        const chatButton = document.getElementById("chat-button");
        const notification = document.getElementById("chat-notification");

        if (this.isOpen) {
            chatWindow.classList.add("open");
            chatButton.classList.add("hidden");
            notification.style.display = "none";
            document.getElementById("chat-input").focus();
        } else {
            chatWindow.classList.remove("open");
            chatButton.classList.remove("hidden");
        }
    }

    addWelcomeMessage() {
        const welcomeMessages = [
            "Hi! Welcome to EV1 Media.",
            "I can help with custom AV integration, networking and custom software development.",
            "What are you looking to build or improve?"
        ];

        setTimeout(() => {
            welcomeMessages.forEach((message, index) => {
                setTimeout(() => this.addMessage(message, "bot"), index * 500);
            });
        }, 500);
    }

    async sendMessage() {
        const input = document.getElementById("chat-input");
        const sendButton = document.getElementById("chat-send");
        const message = input.value.trim();

        if (!message || sendButton.disabled) return;

        this.userInfo.lastQuestion = message;
        this.captureName(message);
        this.addMessage(message, "user");
        input.value = "";
        input.style.height = "auto";
        sendButton.disabled = true;
        this.showTypingIndicator();

        try {
            const result = await this.requestAI(message);
            this.hideTypingIndicator();

            if (result && result.ok && result.reply) {
                this.addMessage(result.reply, "bot", result.action || "");
            } else {
                const fallback = this.getFallbackResponse(message);
                this.addMessage(fallback.reply, "bot", fallback.action);
            }
        } catch (error) {
            console.warn("EV1 Media AI chat unavailable; using local fallback.", error);
            this.hideTypingIndicator();
            const fallback = this.getFallbackResponse(message);
            this.addMessage(fallback.reply, "bot", fallback.action);
        } finally {
            sendButton.disabled = false;
            input.focus();
        }
    }

    captureName(message) {
        if (this.userInfo.name) return;

        const match = message.match(/(?:my name is|i'm|i am)\s+([a-zA-ZÀ-ÿ'-]{2,30})/i);
        if (match) this.userInfo.name = match[1];
    }

    requestAI(message) {
        return new Promise((resolve, reject) => {
            const callbackName = "__ev1Chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
            const script = document.createElement("script");
            const priorHistory = this.messages
                .slice(0, -1)
                .slice(-6)
                .map((item) => ({
                    role: item.sender === "user" ? "user" : "assistant",
                    content: item.text.slice(0, 1000)
                }));

            const params = new URLSearchParams({
                action: "chat",
                callback: callbackName,
                message,
                history: JSON.stringify(priorHistory),
                sessionId: this.sessionId,
                page: window.location.href
            });

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error("Chat request timed out."));
            }, 15000);

            const cleanup = () => {
                clearTimeout(timeout);
                if (script.parentNode) script.parentNode.removeChild(script);
                try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
            };

            window[callbackName] = (payload) => {
                cleanup();
                resolve(payload);
            };

            script.onerror = () => {
                cleanup();
                reject(new Error("Chat endpoint could not be reached."));
            };

            script.src = EV1MEDIA_CHAT_ENDPOINT + "?" + params.toString();
            document.body.appendChild(script);
        });
    }

    addMessage(text, sender, action = "") {
        const messagesContainer = document.getElementById("chat-messages");
        const messageDiv = document.createElement("div");
        messageDiv.className = `chat-message ${sender}`;

        const actionHtml = sender === "bot" ? this.getActionHtml(action) : "";

        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(text)}${actionHtml}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.messages.push({ text, sender, time: new Date() });
    }

    formatMessage(text) {
        const safe = String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        return safe
            .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/\n/g, "<br>");
    }

    getActionHtml(action) {
        const actions = {
            booking: '<div style="margin-top:10px"><a href="booking.html"><strong>Request AV / Network Service →</strong></a></div>',
            software: '<div style="margin-top:10px"><a href="custom-software-intake.html"><strong>Start a Custom Software Project →</strong></a></div>',
            contact: '<div style="margin-top:10px"><a href="contact.html"><strong>Contact EV1 Media →</strong></a></div>',
            whatsapp: '<div style="margin-top:10px"><button onclick="chatWidget.connectToWhatsApp()" style="background:#25D366;color:white;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:600">Continue on WhatsApp</button></div>'
        };

        return actions[action] || "";
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById("chat-messages");
        const typingDiv = document.createElement("div");
        typingDiv.className = "chat-message bot typing-indicator";
        typingDiv.id = "typing-indicator";
        typingDiv.innerHTML = '<div class="message-content"><span></span><span></span><span></span></div>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById("typing-indicator");
        if (indicator) indicator.remove();
    }

    getFallbackResponse(message) {
        const text = message.toLowerCase();

        if (/\b(software|app|portal|dashboard|automation|workflow|database|platform|api|integration)\b/.test(text)) {
            return {
                reply: "Yes. EV1 Media builds custom software around an organization's workflow, including internal platforms, dashboards, portals, automations and integrations. Tell me what process you want to replace or improve.",
                action: "software"
            };
        }

        if (/\b(audio|sound|video|livestream|streaming|projection|display|av|network|wifi|wi-fi|cabling|rack|switch|vlan)\b/.test(text)) {
            return {
                reply: "EV1 Media designs custom AV and network systems around your space and workflow, including audio, video, livestreaming, projection, structured cabling, Wi-Fi and network infrastructure. Tell me what you have now and what you want to improve.",
                action: "booking"
            };
        }

        if (/\b(price|pricing|cost|quote|budget|how much)\b/.test(text)) {
            return {
                reply: "Pricing depends on the scope, equipment, installation conditions and software requirements. EV1 Media can prepare a project-specific quote after we understand what you need.",
                action: "contact"
            };
        }

        if (/\b(book|schedule|hire|start|project|consult|consultation)\b/.test(text)) {
            return {
                reply: "Absolutely. Tell me whether this is an AV/network project or a custom software project, and I can direct you to the right intake.",
                action: "contact"
            };
        }

        if (/^(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(text)) {
            return {
                reply: "Hello! I can help you with custom AV integration, networking and custom software development. What are you looking to build or improve?",
                action: ""
            };
        }

        return {
            reply: "I can help with EV1 Media's custom AV, networking and software services. If your question needs a team member, you can continue with us directly.",
            action: "whatsapp"
        };
    }

    connectToWhatsApp(customMessage = "") {
        const message = customMessage || this.userInfo.lastQuestion || "Hi! I have a question about EV1 Media services.";
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            `Hello! I was chatting with the EV1 Media website assistant.\n\nMy question: ${message}\n\n${this.userInfo.name ? `My name: ${this.userInfo.name}` : ""}`
        )}`;
        window.open(whatsappURL, "_blank", "noopener");
    }
}

let chatWidget;
document.addEventListener("DOMContentLoaded", () => {
    chatWidget = new ChatWidget();
});
