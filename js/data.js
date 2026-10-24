// Data Management & State Store for Restaurant ERP with LocalStorage persistence

const DEFAULT_SETTINGS = {
    restaurantName: "L'Aura Bistro & Bar",
    tagline: "Artisan Dining & Culinary Lounge",
    currency: "$",
    currencyCode: "USD",
    taxRate: 8.5, // 8.5% Sales Tax
    serviceCharge: 5.0, // 5% Service Charge
    address: "742 Evergreen Terrace, Culinary District, Metropolis",
    phone: "+1 (555) 438-2872",
    email: "manager@laurabistro.com",
    receiptFooter: "Thank you for dining with us! Follow @laurabistro",
    autoPrintReceipt: true,
    soundAlerts: true,
    lowStockAlerts: true
};

const DEFAULT_CATEGORIES = [
    { id: 'all', name: 'All Items', icon: 'bi-grid-fill' },
    { id: 'starters', name: 'Starters & Tapas', icon: 'bi-egg-fried' },
    { id: 'mains', name: 'Signature Mains', icon: 'bi-fire' },
    { id: 'pizza_pasta', name: 'Woodfired & Pasta', icon: 'bi-pie-chart-fill' },
    { id: 'burgers_grills', name: 'Burgers & Steaks', icon: 'bi-shield-shaded' },
    { id: 'desserts', name: 'Artisan Desserts', icon: 'bi-cake2' },
    { id: 'beverages', name: 'Cocktails & Brews', icon: 'bi-cup-straw' }
];

const DEFAULT_INVENTORY = [
    { id: 'INV-01', name: 'Prime Angus Beef Patty', category: 'Meat & Poultry', stock: 45, unit: 'pcs', minThreshold: 15, cost: 3.50 },
    { id: 'INV-02', name: 'Brioche Burger Buns', category: 'Bakery', stock: 60, unit: 'pcs', minThreshold: 20, cost: 0.60 },
    { id: 'INV-03', name: 'Aged Cheddar Cheese', category: 'Dairy', stock: 8.5, unit: 'kg', minThreshold: 3.0, cost: 9.00 },
    { id: 'INV-04', name: 'Italian Mozzarella Di Bufala', category: 'Dairy', stock: 12, unit: 'kg', minThreshold: 4.0, cost: 11.50 },
    { id: 'INV-05', name: '00 Pizza Flour Dough', category: 'Bakery', stock: 28, unit: 'kg', minThreshold: 10, cost: 2.10 },
    { id: 'INV-06', name: 'San Marzano Tomato Sauce', category: 'Produce & Canned', stock: 18.5, unit: 'L', minThreshold: 6.0, cost: 3.80 },
    { id: 'INV-07', name: 'Atlantic Salmon Fillet', category: 'Seafood', stock: 14, unit: 'kg', minThreshold: 5.0, cost: 16.00 },
    { id: 'INV-08', name: 'Black Truffle Oil', category: 'Oils & Condiments', stock: 4, unit: 'bottles', minThreshold: 2, cost: 24.00 },
    { id: 'INV-09', name: 'Arborio Risotto Rice', category: 'Dry Goods', stock: 15, unit: 'kg', minThreshold: 5, cost: 4.20 },
    { id: 'INV-10', name: 'Heavy Whipping Cream', category: 'Dairy', stock: 9, unit: 'L', minThreshold: 4, cost: 3.60 },
    { id: 'INV-11', name: 'Belgian Dark Chocolate 70%', category: 'Confectionery', stock: 6.5, unit: 'kg', minThreshold: 2.5, cost: 14.00 },
    { id: 'INV-12', name: 'Organic Arabica Espresso Beans', category: 'Beverages', stock: 10, unit: 'kg', minThreshold: 3, cost: 18.50 },
    { id: 'INV-13', name: 'Crispy French Fries Cut', category: 'Frozen', stock: 35, unit: 'kg', minThreshold: 12, cost: 2.20 },
    { id: 'INV-14', name: 'Fresh Sweet Basil', category: 'Produce & Herbs', stock: 2.2, unit: 'kg', minThreshold: 1.0, cost: 6.50 },
    { id: 'INV-15', name: 'Sparkling Mineral Water (750ml)', category: 'Beverages', stock: 48, unit: 'bottles', minThreshold: 15, cost: 1.10 }
];

const DEFAULT_MENU = [
    {
        id: 'MENU-01',
        name: 'Truffle Angus Cheeseburger',
        category: 'burgers_grills',
        price: 18.50,
        cost: 5.80,
        description: 'Prime Angus beef, melted aged cheddar, truffle aioli, crisp brioche bun with herb fries.',
        prepTime: 12,
        calories: 820,
        isVeg: false,
        isSpicy: false,
        isPopular: true,
        available: true,
        recipe: [
            { invId: 'INV-01', qty: 1 },
            { invId: 'INV-02', qty: 1 },
            { invId: 'INV-03', qty: 0.08 },
            { invId: 'INV-13', qty: 0.2 }
        ]
    },
    {
        id: 'MENU-02',
        name: 'Margherita Burrata Pizza',
        category: 'pizza_pasta',
        price: 16.00,
        cost: 4.20,
        description: 'San Marzano tomatoes, buffalo mozzarella, creamy burrata heart, fresh basil, extra virgin olive oil.',
        prepTime: 14,
        calories: 740,
        isVeg: true,
        isSpicy: false,
        isPopular: true,
        available: true,
        recipe: [
            { invId: 'INV-05', qty: 0.25 },
            { invId: 'INV-06', qty: 0.15 },
            { invId: 'INV-04', qty: 0.12 },
            { invId: 'INV-14', qty: 0.02 }
        ]
    },
    {
        id: 'MENU-03',
        name: 'Pan-Seared Atlantic Salmon',
        category: 'mains',
        price: 26.50,
        cost: 8.90,
        description: 'Crispy skin salmon fillet, saffron potato purée, asparagus, lemon dill velouté.',
        prepTime: 18,
        calories: 610,
        isVeg: false,
        isSpicy: false,
        isPopular: true,
        available: true,
        recipe: [
            { invId: 'INV-07', qty: 0.22 },
            { invId: 'INV-10', qty: 0.08 }
        ]
    },
    {
        id: 'MENU-04',
        name: 'Wild Mushroom Truffle Risotto',
        category: 'mains',
        price: 21.00,
        cost: 5.40,
        description: 'Carnaroli arborio rice, porcini mushrooms, parmesan emulsion, black truffle drizzle.',
        prepTime: 16,
        calories: 580,
        isVeg: true,
        isSpicy: false,
        isPopular: false,
        available: true,
        recipe: [
            { invId: 'INV-09', qty: 0.15 },
            { invId: 'INV-08', qty: 0.01 },
            { invId: 'INV-10', qty: 0.05 }
        ]
    },
    {
        id: 'MENU-05',
        name: 'Crispy Calamari Fritti',
        category: 'starters',
        price: 13.50,
        cost: 3.80,
        description: 'Tender baby squid tossed in citrus sea salt, served with smoked paprika garlic dip.',
        prepTime: 8,
        calories: 420,
        isVeg: false,
        isSpicy: true,
        isPopular: true,
        available: true,
        recipe: []
    },
    {
        id: 'MENU-06',
        name: 'Heirloom Tomato & Burrata Salad',
        category: 'starters',
        price: 14.00,
        cost: 3.90,
        description: 'Multi-colored heirloom tomatoes, creamy burrata, basil pesto, 12-year balsamic glaze.',
        prepTime: 6,
        calories: 360,
        isVeg: true,
        isSpicy: false,
        isPopular: false,
        available: true,
        recipe: [
            { invId: 'INV-04', qty: 0.1 },
            { invId: 'INV-14', qty: 0.02 }
        ]
    },
    {
        id: 'MENU-07',
        name: 'Warm Belgian Chocolate Lava Cake',
        category: 'desserts',
        price: 11.50,
        cost: 2.70,
        description: 'Molten Belgian dark chocolate center, Madagascar vanilla bean gelato, raspberry coulis.',
        prepTime: 10,
        calories: 520,
        isVeg: true,
        isSpicy: false,
        isPopular: true,
        available: true,
        recipe: [
            { invId: 'INV-11', qty: 0.08 },
            { invId: 'INV-10', qty: 0.05 }
        ]
    },
    {
        id: 'MENU-08',
        name: 'Smoked Bourbon Old Fashioned',
        category: 'beverages',
        price: 15.00,
        cost: 2.90,
        description: 'Kentucky Bourbon, demerara sugar, aromatic Angostura bitters, flamed orange peel, oak smoke.',
        prepTime: 4,
        calories: 180,
        isVeg: true,
        isSpicy: false,
        isPopular: true,
        available: true,
        recipe: []
    },
    {
        id: 'MENU-09',
        name: 'Handcrafted Espresso Double',
        category: 'beverages',
        price: 4.50,
        cost: 0.50,
        description: 'Double shot of organic single-origin Ethiopian Arabica espresso with rich crema.',
        prepTime: 3,
        calories: 5,
        isVeg: true,
        isSpicy: false,
        isPopular: false,
        available: true,
        recipe: [
            { invId: 'INV-12', qty: 0.018 }
        ]
    },
    {
        id: 'MENU-10',
        name: 'Rosemary Garlic Parmesan Fries',
        category: 'starters',
        price: 8.50,
        cost: 1.80,
        description: 'Hand-cut russet fries, shaved parmesan cheese, roasted garlic aioli, rosemary dust.',
        prepTime: 7,
        calories: 450,
        isVeg: true,
        isSpicy: false,
        isPopular: true,
        available: true,
        recipe: [
            { invId: 'INV-13', qty: 0.25 },
            { invId: 'INV-03', qty: 0.03 }
        ]
    }
];

const DEFAULT_TABLES = [
    { id: 'T-01', name: 'Table 01', section: 'Main Hall', seats: 2, status: 'occupied', activeOrderId: 'ORD-1002', server: 'Sophia Bennett' },
    { id: 'T-02', name: 'Table 02', section: 'Main Hall', seats: 4, status: 'available', activeOrderId: null, server: 'Sophia Bennett' },
    { id: 'T-03', name: 'Table 03', section: 'Main Hall', seats: 4, status: 'occupied', activeOrderId: 'ORD-1001', server: 'Marco Rossi' },
    { id: 'T-04', name: 'Table 04', section: 'Main Hall', seats: 6, status: 'reserved', activeOrderId: null, server: 'Marco Rossi' },
    { id: 'T-05', name: 'Table 05', section: 'Patio Terrace', seats: 2, status: 'available', activeOrderId: null, server: 'Liam Gallagher' },
    { id: 'T-06', name: 'Table 06', section: 'Patio Terrace', seats: 4, status: 'cleaning', activeOrderId: null, server: 'Liam Gallagher' },
    { id: 'T-07', name: 'Table 07', section: 'Patio Terrace', seats: 4, status: 'available', activeOrderId: null, server: 'Liam Gallagher' },
    { id: 'T-08', name: 'Table 08', section: 'VIP Lounge', seats: 8, status: 'occupied', activeOrderId: 'ORD-1003', server: 'Sophia Bennett' },
    { id: 'T-09', name: 'Table 09', section: 'VIP Lounge', seats: 6, status: 'available', activeOrderId: null, server: 'Marco Rossi' },
    { id: 'T-10', name: 'Bar Counter 1', section: 'Cocktail Bar', seats: 2, status: 'available', activeOrderId: null, server: 'Elena Vance' },
    { id: 'T-11', name: 'Bar Counter 2', section: 'Cocktail Bar', seats: 2, status: 'occupied', activeOrderId: 'ORD-1004', server: 'Elena Vance' },
    { id: 'T-12', name: 'Bar Counter 3', section: 'Cocktail Bar', seats: 2, status: 'available', activeOrderId: null, server: 'Elena Vance' }
];

const DEFAULT_STAFF = [
    { id: 'STF-01', name: 'Chef Laurent Vane', role: 'Executive Head Chef', shift: 'Morning & Prep', wagePerHour: 34.00, status: 'Clocked In', clockedInAt: '08:30 AM', phone: '+1 (555) 234-9811' },
    { id: 'STF-02', name: 'Marco Rossi', role: 'Floor Manager / Lead Captain', shift: 'All Day Service', wagePerHour: 26.50, status: 'Clocked In', clockedInAt: '10:00 AM', phone: '+1 (555) 873-1120' },
    { id: 'STF-03', name: 'Sophia Bennett', role: 'Senior Waiter & Sommelier', shift: 'Day Shift', wagePerHour: 20.00, status: 'Clocked In', clockedInAt: '10:15 AM', phone: '+1 (555) 431-7788' },
    { id: 'STF-04', name: 'Liam Gallagher', role: 'Barista & Server', shift: 'Evening Shift', wagePerHour: 18.50, status: 'Clocked Out', clockedInAt: null, phone: '+1 (555) 902-3344' },
    { id: 'STF-05', name: 'Elena Vance', role: 'Head Mixologist', shift: 'Evening & Night', wagePerHour: 24.00, status: 'Clocked In', clockedInAt: '11:00 AM', phone: '+1 (555) 674-5522' },
    { id: 'STF-06', name: 'Antoine Dubois', role: 'Sous Chef / Grill Master', shift: 'Day Shift', wagePerHour: 25.00, status: 'Clocked In', clockedInAt: '09:00 AM', phone: '+1 (555) 345-6677' }
];

const DEFAULT_ORDERS = [
    {
        id: 'ORD-1001',
        tableId: 'T-03',
        type: 'Dine-In',
        customerName: 'Alexander Vance',
        serverName: 'Marco Rossi',
        items: [
            { itemId: 'MENU-01', name: 'Truffle Angus Cheeseburger', price: 18.50, qty: 2, notes: 'Medium rare, extra truffle', prepStatus: 'cooking' },
            { itemId: 'MENU-10', name: 'Rosemary Garlic Parmesan Fries', price: 8.50, qty: 1, notes: 'Crispy please', prepStatus: 'cooking' },
            { itemId: 'MENU-08', name: 'Smoked Bourbon Old Fashioned', price: 15.00, qty: 2, notes: 'Extra orange zest', prepStatus: 'ready' }
        ],
        subtotal: 75.50,
        tax: 6.42,
        serviceCharge: 3.78,
        discount: 0,
        total: 85.70,
        status: 'cooking', // 'pending', 'cooking', 'ready', 'served', 'completed'
        paymentStatus: 'unpaid',
        paymentMethod: null,
        createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        completedAt: null
    },
    {
        id: 'ORD-1002',
        tableId: 'T-01',
        type: 'Dine-In',
        customerName: 'Lady Claire Dupont',
        serverName: 'Sophia Bennett',
        items: [
            { itemId: 'MENU-03', name: 'Pan-Seared Atlantic Salmon', price: 26.50, qty: 1, notes: 'Sauce on side', prepStatus: 'ready' },
            { itemId: 'MENU-06', name: 'Heirloom Tomato & Burrata Salad', price: 14.00, qty: 1, notes: '', prepStatus: 'served' },
            { itemId: 'MENU-09', name: 'Handcrafted Espresso Double', price: 4.50, qty: 1, notes: 'Hot', prepStatus: 'ready' }
        ],
        subtotal: 45.00,
        tax: 3.83,
        serviceCharge: 2.25,
        discount: 0,
        total: 51.08,
        status: 'ready',
        paymentStatus: 'unpaid',
        paymentMethod: null,
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        completedAt: null
    },
    {
        id: 'ORD-1003',
        tableId: 'T-08',
        type: 'Dine-In',
        customerName: 'Executive Dinner Party',
        serverName: 'Sophia Bennett',
        items: [
            { itemId: 'MENU-02', name: 'Margherita Burrata Pizza', price: 16.00, qty: 3, notes: 'Well baked crust', prepStatus: 'pending' },
            { itemId: 'MENU-04', name: 'Wild Mushroom Truffle Risotto', price: 21.00, qty: 2, notes: 'Extra shaved parmesan', prepStatus: 'pending' },
            { itemId: 'MENU-05', name: 'Crispy Calamari Fritti', price: 13.50, qty: 2, notes: 'Extra lemon', prepStatus: 'cooking' },
            { itemId: 'MENU-08', name: 'Smoked Bourbon Old Fashioned', price: 15.00, qty: 4, notes: '', prepStatus: 'ready' }
        ],
        subtotal: 177.00,
        tax: 15.05,
        serviceCharge: 8.85,
        discount: 10.00,
        total: 190.90,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: null,
        createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        completedAt: null
    },
    {
        id: 'ORD-1004',
        tableId: 'T-11',
        type: 'Takeaway',
        customerName: 'Michael Chang',
        serverName: 'Elena Vance',
        items: [
            { itemId: 'MENU-01', name: 'Truffle Angus Cheeseburger', price: 18.50, qty: 1, notes: 'Takeout box', prepStatus: 'cooking' },
            { itemId: 'MENU-07', name: 'Warm Belgian Chocolate Lava Cake', price: 11.50, qty: 1, notes: 'Separate gelato', prepStatus: 'pending' }
        ],
        subtotal: 30.00,
        tax: 2.55,
        serviceCharge: 0,
        discount: 0,
        total: 32.55,
        status: 'cooking',
        paymentStatus: 'paid',
        paymentMethod: 'Card',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        completedAt: null
    },
    // Historical completed orders for analytics & reporting
    {
        id: 'ORD-0997',
        tableId: 'T-02',
        type: 'Dine-In',
        customerName: 'Jonathan Hayes',
        serverName: 'Sophia Bennett',
        items: [
            { itemId: 'MENU-02', name: 'Margherita Burrata Pizza', price: 16.00, qty: 1, notes: '', prepStatus: 'served' },
            { itemId: 'MENU-08', name: 'Smoked Bourbon Old Fashioned', price: 15.00, qty: 2, notes: '', prepStatus: 'served' }
        ],
        subtotal: 46.00,
        tax: 3.91,
        serviceCharge: 2.30,
        discount: 0,
        total: 52.21,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'UPI/QR',
        createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString()
    },
    {
        id: 'ORD-0998',
        tableId: 'T-05',
        type: 'Dine-In',
        customerName: 'Emma Watson',
        serverName: 'Liam Gallagher',
        items: [
            { itemId: 'MENU-03', name: 'Pan-Seared Atlantic Salmon', price: 26.50, qty: 2, notes: '', prepStatus: 'served' },
            { itemId: 'MENU-07', name: 'Warm Belgian Chocolate Lava Cake', price: 11.50, qty: 2, notes: '', prepStatus: 'served' }
        ],
        subtotal: 76.00,
        tax: 6.46,
        serviceCharge: 3.80,
        discount: 5.00,
        total: 81.26,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'Card',
        createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString()
    },
    {
        id: 'ORD-0999',
        tableId: 'T-07',
        type: 'Dine-In',
        customerName: 'Carlos Gomez',
        serverName: 'Marco Rossi',
        items: [
            { itemId: 'MENU-01', name: 'Truffle Angus Cheeseburger', price: 18.50, qty: 3, notes: '', prepStatus: 'served' },
            { itemId: 'MENU-10', name: 'Rosemary Garlic Parmesan Fries', price: 8.50, qty: 3, notes: '', prepStatus: 'served' },
            { itemId: 'MENU-09', name: 'Handcrafted Espresso Double', price: 4.50, qty: 2, notes: '', prepStatus: 'served' }
        ],
        subtotal: 90.00,
        tax: 7.65,
        serviceCharge: 4.50,
        discount: 0,
        total: 102.15,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'Cash',
        createdAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 230 * 60 * 1000).toISOString()
    }
];

const DEFAULT_RESERVATIONS = [
    { id: 'RES-01', guestName: 'Lord Sterling & Party', phone: '+1 (555) 234-9988', guests: 6, tableId: 'T-04', date: new Date().toISOString().split('T')[0], time: '19:30', status: 'confirmed', notes: 'Anniversary celebration, prefers vintage champagne recommendation' },
    { id: 'RES-02', guestName: 'Dr. Evelyn Reed', phone: '+1 (555) 782-3400', guests: 2, tableId: 'T-07', date: new Date().toISOString().split('T')[0], time: '20:15', status: 'confirmed', notes: 'Window view requested, gluten allergy' },
    { id: 'RES-03', guestName: 'Marcus Wright', phone: '+1 (555) 912-8877', guests: 4, tableId: 'T-02', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '13:00', status: 'confirmed', notes: 'Business lunch presentation' }
];

const DEFAULT_EXPENSES = [
    { id: 'EXP-01', date: new Date().toISOString().split('T')[0], title: 'Fresh Dairy & Cheese Restock', category: 'Inventory Supply', amount: 165.00, supplier: 'Alpine Artisan Dairies', status: 'Paid' },
    { id: 'EXP-02', date: new Date().toISOString().split('T')[0], title: 'Daily Organic Herbs & Produce', category: 'Inventory Supply', amount: 84.50, supplier: 'Green Valley Farms', status: 'Paid' },
    { id: 'EXP-03', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], title: 'Kitchen Gas & Utility Refill', category: 'Utilities', amount: 220.00, supplier: 'City Metro Gas', status: 'Paid' },
    { id: 'EXP-04', date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], title: 'Wine & Spirits Consignment', category: 'Beverages', amount: 480.00, supplier: 'Vanguard Fine Cellars', status: 'Paid' }
];

// ERP State Store
class ERPStore {
    constructor() {
        this.subscribers = {};
        this.init();
    }

    init() {
        if (!localStorage.getItem('restaurant_erp_initialized')) {
            this.resetToDefaults();
        }
    }

    resetToDefaults() {
        localStorage.setItem('erp_settings', JSON.stringify(DEFAULT_SETTINGS));
        localStorage.setItem('erp_categories', JSON.stringify(DEFAULT_CATEGORIES));
        localStorage.setItem('erp_inventory', JSON.stringify(DEFAULT_INVENTORY));
        localStorage.setItem('erp_menu', JSON.stringify(DEFAULT_MENU));
        localStorage.setItem('erp_tables', JSON.stringify(DEFAULT_TABLES));
        localStorage.setItem('erp_orders', JSON.stringify(DEFAULT_ORDERS));
        localStorage.setItem('erp_reservations', JSON.stringify(DEFAULT_RESERVATIONS));
        localStorage.setItem('erp_staff', JSON.stringify(DEFAULT_STAFF));
        localStorage.setItem('erp_expenses', JSON.stringify(DEFAULT_EXPENSES));
        localStorage.setItem('restaurant_erp_initialized', 'true');
        this.emit('state:reset');
    }

    // Generic Storage Helpers
    get(key, fallback = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            console.error('Storage parse error:', key, e);
            return fallback;
        }
    }

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        this.emit(key, value);
    }

    // Specific Domain Accessors
    getSettings() { return this.get('erp_settings', DEFAULT_SETTINGS); }
    saveSettings(settings) { this.set('erp_settings', settings); }

    getCategories() { return this.get('erp_categories', DEFAULT_CATEGORIES); }

    getInventory() { return this.get('erp_inventory', DEFAULT_INVENTORY); }
    saveInventory(inv) { this.set('erp_inventory', inv); }

    getMenu() { return this.get('erp_menu', DEFAULT_MENU); }
    saveMenu(menu) { this.set('erp_menu', menu); }

    getTables() { return this.get('erp_tables', DEFAULT_TABLES); }
    saveTables(tables) { this.set('erp_tables', tables); }

    getOrders() { return this.get('erp_orders', DEFAULT_ORDERS); }
    saveOrders(orders) { this.set('erp_orders', orders); }

    getReservations() { return this.get('erp_reservations', DEFAULT_RESERVATIONS); }
    saveReservations(res) { this.set('erp_reservations', res); }

    getStaff() { return this.get('erp_staff', DEFAULT_STAFF); }
    saveStaff(staff) { this.set('erp_staff', staff); }

    getExpenses() { return this.get('erp_expenses', DEFAULT_EXPENSES); }
    saveExpenses(exp) { this.set('erp_expenses', exp); }

    // Business Logic Utilities
    addOrder(order) {
        const orders = this.getOrders();
        orders.unshift(order);
        this.saveOrders(orders);

        // Update table status if Dine-In
        if (order.type === 'Dine-In' && order.tableId) {
            const tables = this.getTables();
            const table = tables.find(t => t.id === order.tableId);
            if (table) {
                table.status = 'occupied';
                table.activeOrderId = order.id;
                this.saveTables(tables);
            }
        }

        // Deduct inventory items based on recipe
        this.deductInventoryForOrder(order);

        this.emit('order:created', order);
        return order;
    }

    updateOrderStatus(orderId, status) {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            if (status === 'completed') {
                order.completedAt = new Date().toISOString();
                // Release table
                if (order.tableId) {
                    const tables = this.getTables();
                    const table = tables.find(t => t.id === order.tableId);
                    if (table && table.activeOrderId === order.id) {
                        table.status = 'cleaning';
                        table.activeOrderId = null;
                        this.saveTables(tables);
                    }
                }
            }
            this.saveOrders(orders);
            this.emit('order:updated', order);
        }
    }

    deductInventoryForOrder(order) {
        const menu = this.getMenu();
        const inventory = this.getInventory();
        let changed = false;

        order.items.forEach(item => {
            const menuItem = menu.find(m => m.id === item.itemId);
            if (menuItem && menuItem.recipe && menuItem.recipe.length > 0) {
                menuItem.recipe.forEach(ing => {
                    const invItem = inventory.find(i => i.id === ing.invId);
                    if (invItem) {
                        const required = ing.qty * item.qty;
                        invItem.stock = Math.max(0, parseFloat((invItem.stock - required).toFixed(2)));
                        changed = true;
                    }
                });
            }
        });

        if (changed) {
            this.saveInventory(inventory);
        }
    }

    // Pub / Sub
    subscribe(event, callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }
        this.subscribers[event].push(callback);
    }

    emit(event, payload) {
        if (this.subscribers[event]) {
            this.subscribers[event].forEach(cb => {
                try { cb(payload); } catch (e) { console.error('Event error', event, e); }
            });
        }
    }

    // Export / Import JSON for ERP Backups
    exportBackupJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            settings: this.getSettings(),
            categories: this.getCategories(),
            inventory: this.getInventory(),
            menu: this.getMenu(),
            tables: this.getTables(),
            orders: this.getOrders(),
            reservations: this.getReservations(),
            staff: this.getStaff(),
            expenses: this.getExpenses()
        };
        return JSON.stringify(data, null, 2);
    }

    importBackupJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.settings) this.saveSettings(data.settings);
            if (data.categories) this.set('erp_categories', data.categories);
            if (data.inventory) this.saveInventory(data.inventory);
            if (data.menu) this.saveMenu(data.menu);
            if (data.tables) this.saveTables(data.tables);
            if (data.orders) this.saveOrders(data.orders);
            if (data.reservations) this.saveReservations(data.reservations);
            if (data.staff) this.saveStaff(data.staff);
            if (data.expenses) this.saveExpenses(data.expenses);
            this.emit('state:reset');
            return true;
        } catch (e) {
            console.error('Import failed', e);
            return false;
        }
    }
}

window.erpStore = new ERPStore();
