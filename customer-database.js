// Customer Database Management System
class CustomerDatabase {
    constructor() {
        this.customers = this.loadCustomers();
        this.orders = this.loadOrders();
        this.carts = this.loadCarts();
    }

    // Load data from localStorage (will be replaced with real database in production)
    loadCustomers() {
        return JSON.parse(localStorage.getItem('customers') || '[]');
    }

    loadOrders() {
        return JSON.parse(localStorage.getItem('orders') || '[]');
    }

    loadCarts() {
        return JSON.parse(localStorage.getItem('persistent_carts') || '{}');
    }

    // Save data to localStorage
    saveCustomers() {
        localStorage.setItem('customers', JSON.stringify(this.customers));
    }

    saveOrders() {
        localStorage.setItem('orders', JSON.stringify(this.orders));
    }

    saveCarts() {
        localStorage.setItem('persistent_carts', JSON.stringify(this.carts));
    }

    // Customer management
    createCustomer(customerData) {
        const customer = {
            id: Date.now().toString(),
            ...customerData,
            profilePicture: null,
            phoneVerified: true, // Assume verified since they completed phone verification
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true
        };

        this.customers.push(customer);
        this.saveCustomers();
        return customer;
    }

    getCustomer(customerId) {
        return this.customers.find(c => c.id === customerId);
    }

    getCustomerByEmail(email) {
        return this.customers.find(c => c.email === email);
    }

    updateCustomer(customerId, updateData) {
        const customerIndex = this.customers.findIndex(c => c.id === customerId);
        if (customerIndex !== -1) {
            this.customers[customerIndex] = { ...this.customers[customerIndex], ...updateData };
            this.saveCustomers();
            return this.customers[customerIndex];
        }
        return null;
    }

    // Order management
    createOrder(customerId, orderData) {
        const order = {
            id: Date.now().toString(),
            customerId: customerId,
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.orders.push(order);
        this.saveOrders();
        return order;
    }

    getCustomerOrders(customerId) {
        return this.orders.filter(o => o.customerId === customerId);
    }

    // Cart management
    saveCustomerCart(customerId, cartItems) {
        this.carts[customerId] = {
            items: cartItems,
            lastUpdated: new Date().toISOString()
        };
        this.saveCarts();
    }

    getCustomerCart(customerId) {
        return this.carts[customerId]?.items || [];
    }

    clearCustomerCart(customerId) {
        delete this.carts[customerId];
        this.saveCarts();
    }

    // Profile picture management
    updateProfilePicture(customerId, imageDataUrl) {
        const customer = this.getCustomer(customerId);
        if (customer) {
            customer.profilePicture = imageDataUrl;
            this.updateCustomer(customerId, customer);
            return true;
        }
        return false;
    }

    // Authentication
    authenticateCustomer(email, password) {
        const customer = this.getCustomerByEmail(email);
        if (customer && customer.password === password) {
            customer.lastLogin = new Date().toISOString();
            this.updateCustomer(customer.id, customer);
            return customer;
        }
        return null;
    }

    // Session management
    setCurrentUser(customer) {
        localStorage.setItem('currentUser', JSON.stringify(customer));
        // Transfer temporary cart to persistent cart
        const tempCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (tempCart.length > 0) {
            this.saveCustomerCart(customer.id, tempCart);
            localStorage.removeItem('cart');
        }
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    logout() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            // Save current cart before logout
            const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (currentCart.length > 0) {
                this.saveCustomerCart(currentUser.id, currentCart);
            }
        }
        localStorage.removeItem('currentUser');
        localStorage.removeItem('cart');
    }

    // Statistics and analytics
    getCustomerStats(customerId) {
        const orders = this.getCustomerOrders(customerId);
        const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        return {
            totalOrders: orders.length,
            totalSpent: totalSpent,
            lastOrderDate: orders.length > 0 ? orders[orders.length - 1].createdAt : null,
            memberSince: this.getCustomer(customerId)?.createdAt
        };
    }
}

// Initialize global database instance
window.customerDB = new CustomerDatabase();

// Utility functions for easy access
window.CustomerAPI = {
    // Authentication
    login: (email, password) => customerDB.authenticateCustomer(email, password),
    logout: () => customerDB.logout(),
    getCurrentUser: () => customerDB.getCurrentUser(),
    
    // Registration
    register: (customerData) => customerDB.createCustomer(customerData),
    
    // Profile management
    updateProfile: (customerId, data) => customerDB.updateCustomer(customerId, data),
    updateProfilePicture: (customerId, imageData) => customerDB.updateProfilePicture(customerId, imageData),
    
    // Cart management
    saveCart: (customerId, items) => customerDB.saveCustomerCart(customerId, items),
    getCart: (customerId) => customerDB.getCustomerCart(customerId),
    
    // Order history
    getOrders: (customerId) => customerDB.getCustomerOrders(customerId),
    createOrder: (customerId, orderData) => customerDB.createOrder(customerId, orderData),
    
    // Statistics
    getStats: (customerId) => customerDB.getCustomerStats(customerId)
};

// Universal Account Widget System (Header Integration)
window.AccountWidget = {
    init: function() {
        this.integrateIntoHeader();
    },

    integrateIntoHeader: function() {
        // Look for existing navigation or header
        const nav = document.querySelector('nav ul') || document.querySelector('.nav ul') || document.querySelector('header ul');
        
        if (nav) {
            this.addToNavigation(nav);
        } else {
            // Fallback: try to find a contact link and add after it
            const contactLink = document.querySelector('a[href*="contact"], a[href="#contact"]');
            if (contactLink && contactLink.parentElement) {
                this.addAfterContact(contactLink);
            }
        }
    },

    addToNavigation: function(nav) {
        // Check if account item already exists
        if (document.getElementById('accountNavItem')) {
            this.updateAccountDisplay();
            return;
        }

        // Create account navigation item
        const accountItem = document.createElement('li');
        accountItem.id = 'accountNavItem';
        accountItem.style.position = 'relative';
        
        nav.appendChild(accountItem);
        this.updateAccountDisplay();
    },

    addAfterContact: function(contactLink) {
        // Check if account item already exists
        if (document.getElementById('accountNavItem')) {
            this.updateAccountDisplay();
            return;
        }

        // Create account item after contact
        const accountItem = document.createElement('span');
        accountItem.id = 'accountNavItem';
        accountItem.style.marginLeft = '20px';
        accountItem.style.position = 'relative';
        
        // Insert after contact link's parent
        contactLink.parentElement.insertAdjacentElement('afterend', accountItem);
        this.updateAccountDisplay();
    },

    updateAccountDisplay: function() {
        const currentUser = CustomerAPI.getCurrentUser();
        const accountItem = document.getElementById('accountNavItem');

        if (!accountItem) return;

        if (currentUser) {
            // User is logged in - show profile with name
            const initials = (currentUser.firstName?.[0] || '') + (currentUser.lastName?.[0] || '');
            const profilePic = currentUser.profilePicture 
                ? `<img src="${currentUser.profilePicture}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; margin-right: 8px; vertical-align: middle;">`
                : `<div style="width: 28px; height: 28px; border-radius: 50%; background: #007bff; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; margin-right: 8px; vertical-align: middle;">${initials}</div>`;

            accountItem.innerHTML = `
                <a href="#" onclick="AccountWidget.toggleDropdown(); return false;" style="
                    display: inline-flex;
                    align-items: center;
                    text-decoration: none;
                    color: inherit;
                    padding: 8px 12px;
                    border-radius: 20px;
                    transition: all 0.3s;
                    border: 1px solid transparent;
                " onmouseover="this.style.backgroundColor='rgba(0,123,255,0.1)'; this.style.borderColor='#007bff';" onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='transparent';">
                    ${profilePic}
                    <span style="font-size: 14px;">${currentUser.firstName}</span>
                    <i class="fas fa-chevron-down" style="font-size: 10px; margin-left: 6px;"></i>
                </a>
                <div id="accountDropdown" style="
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                    min-width: 180px;
                    display: none;
                    margin-top: 8px;
                    border: 1px solid #e0e0e0;
                    z-index: 1000;
                ">
                    <div style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
                        <div style="font-weight: 600; color: #333; font-size: 14px;">${currentUser.firstName} ${currentUser.lastName}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 2px;">${currentUser.email}</div>
                    </div>
                    <div style="padding: 8px 0;">
                        <a href="account.html" style="
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            padding: 10px 12px;
                            color: #333;
                            text-decoration: none;
                            transition: background 0.2s;
                            font-size: 14px;
                        " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
                            <i class="fas fa-user" style="width: 14px; font-size: 12px;"></i>
                            <span>My Account</span>
                        </a>
                        <a href="sound-rental.html" style="
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            padding: 10px 12px;
                            color: #333;
                            text-decoration: none;
                            transition: background 0.2s;
                            font-size: 14px;
                        " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
                            <i class="fas fa-shopping-bag" style="width: 14px; font-size: 12px;"></i>
                            <span>Services</span>
                        </a>
                        <hr style="margin: 8px 0; border: none; border-top: 1px solid #f0f0f0;">
                        <a href="#" onclick="AccountWidget.logout(); return false;" style="
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            padding: 10px 12px;
                            color: #dc3545;
                            text-decoration: none;
                            transition: background 0.2s;
                            font-size: 14px;
                        " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
                            <i class="fas fa-sign-out-alt" style="width: 14px; font-size: 12px;"></i>
                            <span>Logout</span>
                        </a>
                    </div>
                </div>
            `;
        } else {
            // User is not logged in - show login with person icon
            accountItem.innerHTML = `
                <a href="login.html" style="
                    display: inline-flex;
                    align-items: center;
                    text-decoration: none;
                    color: inherit;
                    padding: 8px 12px;
                    border-radius: 20px;
                    transition: all 0.3s;
                    border: 1px solid transparent;
                " onmouseover="this.style.backgroundColor='rgba(0,123,255,0.1)'; this.style.borderColor='#007bff';" onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='transparent';">
                    <i class="fas fa-user" style="font-size: 16px; margin-right: 8px;"></i>
                    <span style="font-size: 14px;">Login</span>
                </a>
            `;
        }

        // Add click outside listener
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('accountDropdown');
            const accountItem = document.getElementById('accountNavItem');
            if (dropdown && accountItem && !accountItem.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },

    toggleDropdown: function() {
        const dropdown = document.getElementById('accountDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    },

    logout: function() {
        CustomerAPI.logout();
        this.updateAccountDisplay();
        // Close dropdown
        const dropdown = document.getElementById('accountDropdown');
        if (dropdown) dropdown.style.display = 'none';
        // Optionally redirect to home page
        if (window.location.pathname.includes('account.html')) {
            window.location.href = 'index.html';
        }
    }
};

// Auto-initialize the account widget when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Small delay to ensure other scripts have loaded
        setTimeout(() => AccountWidget.init(), 100);
    });
} else {
    // DOM is already loaded
    setTimeout(() => AccountWidget.init(), 100);
}