// Point of Sale (POS) Module

class POSController {
    constructor() {
        this.cart = [];
        this.activeCategory = 'all';
        this.searchQuery = '';
        this.orderType = 'Dine-In';
        this.selectedTableId = 'T-02';
        this.selectedServer = 'Marco Rossi';
        this.customerName = '';
        this.discountPercent = 0;
        this.discountFlat = 0;
        this.currentPaymentMethod = 'Cash';
    }

    init() {
        this.renderCategories();
        this.renderMenuGrid();
        this.renderCart();
        this.populateTableSelect();
        this.populateServerSelect();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search bar
        const searchInput = document.getElementById('posSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderMenuGrid();
            });
        }

        // Order Type buttons
        document.querySelectorAll('.order-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.orderType = btn.dataset.type;
                const tableWrap = document.getElementById('posTableSelectWrapper');
                if (tableWrap) {
                    tableWrap.style.display = this.orderType === 'Dine-In' ? 'block' : 'none';
                }
                this.renderCart();
            });
        });

        // Table select
        const tableSelect = document.getElementById('posTableSelect');
        if (tableSelect) {
            tableSelect.addEventListener('change', (e) => {
                this.selectedTableId = e.target.value;
            });
        }

        // Server select
        const serverSelect = document.getElementById('posServerSelect');
        if (serverSelect) {
            serverSelect.addEventListener('change', (e) => {
                this.selectedServer = e.target.value;
            });
        }

        // Customer Name
        const custInput = document.getElementById('posCustomerName');
        if (custInput) {
            custInput.addEventListener('input', (e) => {
                this.customerName = e.target.value;
            });
        }

        // Discount buttons
        document.querySelectorAll('.discount-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.discount-pill-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.discountPercent = parseFloat(btn.dataset.discount || 0);
                this.renderCart();
            });
        });

        // Tender amount input in payment modal
        const tenderInput = document.getElementById('tenderAmountInput');
        if (tenderInput) {
            tenderInput.addEventListener('input', () => {
                this.updateChangeCalculation();
            });
        }
    }

    renderCategories() {
        const container = document.getElementById('posCategoryContainer');
        if (!container) return;

        const categories = window.erpStore.getCategories();
        container.innerHTML = categories.map(cat => `
            <button class="category-pill ${this.activeCategory === cat.id ? 'active' : ''}" 
                    onclick="window.pos.setCategory('${cat.id}')">
                <i class="bi ${cat.icon}"></i>
                <span>${cat.name}</span>
            </button>
        `).join('');
    }

    setCategory(catId) {
        window.soundFx.playClick();
        this.activeCategory = catId;
        this.renderCategories();
        this.renderMenuGrid();
    }

    renderMenuGrid() {
        const grid = document.getElementById('posMenuGrid');
        if (!grid) return;

        const menu = window.erpStore.getMenu();
        const settings = window.erpStore.getSettings();

        const filtered = menu.filter(item => {
            const matchesCat = this.activeCategory === 'all' || item.category === this.activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(this.searchQuery) || 
                                  item.description.toLowerCase().includes(this.searchQuery);
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-search fs-1 mb-2 d-block opacity-50"></i>
                    <p class="mb-0">No dishes found matching criteria</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(item => `
            <div class="menu-card" onclick="window.pos.addToCart('${item.id}')">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="menu-card-icon">
                        <i class="bi ${this.getItemIcon(item.category)}"></i>
                    </div>
                    <div>
                        ${item.isVeg ? '<span class="badge-tag bg-success text-white me-1">Veg</span>' : ''}
                        ${item.isSpicy ? '<span class="badge-tag bg-danger text-white me-1"><i class="bi bi-fire"></i></span>' : ''}
                        ${item.isPopular ? '<span class="badge-tag bg-warning text-dark"><i class="bi bi-star-fill"></i></span>' : ''}
                    </div>
                </div>
                <div class="menu-card-title">${item.name}</div>
                <div class="menu-card-desc">${item.description}</div>
                <div class="d-flex justify-content-between align-items-center mt-auto pt-2">
                    <span class="menu-card-price">${settings.currency}${item.price.toFixed(2)}</span>
                    <button class="btn btn-sm btn-outline-warning rounded-circle d-flex align-items-center justify-content-center" style="width:32px; height:32px;">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getItemIcon(category) {
        const map = {
            'starters': 'bi-egg-fried',
            'mains': 'bi-fire',
            'pizza_pasta': 'bi-pie-chart-fill',
            'burgers_grills': 'bi-shield-shaded',
            'desserts': 'bi-cake2',
            'beverages': 'bi-cup-straw'
        };
        return map[category] || 'bi-cup-hot';
    }

    populateTableSelect() {
        const select = document.getElementById('posTableSelect');
        if (!select) return;

        const tables = window.erpStore.getTables();
        select.innerHTML = tables.map(t => `
            <option value="${t.id}" ${t.id === this.selectedTableId ? 'selected' : ''}>
                ${t.name} (${t.seats} seats - ${t.section}) [${t.status.toUpperCase()}]
            </option>
        `).join('');
    }

    populateServerSelect() {
        const select = document.getElementById('posServerSelect');
        if (!select) return;

        const staff = window.erpStore.getStaff();
        select.innerHTML = staff.map(s => `
            <option value="${s.name}" ${s.name === this.selectedServer ? 'selected' : ''}>
                ${s.name} (${s.role})
            </option>
        `).join('');
    }

    addToCart(itemId) {
        window.soundFx.playClick();
        const menu = window.erpStore.getMenu();
        const item = menu.find(m => m.id === itemId);
        if (!item) return;

        const existing = this.cart.find(c => c.itemId === itemId);
        if (existing) {
            existing.qty += 1;
        } else {
            this.cart.push({
                itemId: item.id,
                name: item.name,
                price: item.price,
                qty: 1,
                notes: '',
                prepStatus: 'pending'
            });
        }
        this.renderCart();
    }

    updateQty(itemId, delta) {
        window.soundFx.playClick();
        const item = this.cart.find(c => c.itemId === itemId);
        if (item) {
            item.qty += delta;
            if (item.qty <= 0) {
                this.cart = this.cart.filter(c => c.itemId !== itemId);
            }
        }
        this.renderCart();
    }

    updateItemNotes(itemId, notes) {
        const item = this.cart.find(c => c.itemId === itemId);
        if (item) {
            item.notes = notes;
        }
    }

    clearCart() {
        if (this.cart.length === 0) return;
        window.soundFx.playClick();
        this.cart = [];
        this.renderCart();
        window.app.showToast('Cart cleared', 'info');
    }

    calculateTotals() {
        const settings = window.erpStore.getSettings();
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        let discountAmount = 0;
        if (this.discountPercent > 0) {
            discountAmount = (subtotal * this.discountPercent) / 100;
        } else if (this.discountFlat > 0) {
            discountAmount = this.discountFlat;
        }

        const discountedSubtotal = Math.max(0, subtotal - discountAmount);
        const tax = (discountedSubtotal * settings.taxRate) / 100;
        const serviceCharge = this.orderType === 'Dine-In' ? (discountedSubtotal * settings.serviceCharge) / 100 : 0;
        const total = discountedSubtotal + tax + serviceCharge;

        return {
            subtotal,
            discountAmount,
            discountedSubtotal,
            tax,
            serviceCharge,
            total
        };
    }

    renderCart() {
        const container = document.getElementById('posCartItems');
        if (!container) return;

        const settings = window.erpStore.getSettings();
        const { subtotal, discountAmount, tax, serviceCharge, total } = this.calculateTotals();

        // Update count badge
        const countBadge = document.getElementById('posCartItemCount');
        if (countBadge) {
            const count = this.cart.reduce((acc, c) => acc + c.qty, 0);
            countBadge.textContent = `${count} item${count === 1 ? '' : 's'}`;
        }

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted my-auto">
                    <i class="bi bi-cart-x fs-1 mb-2 d-block opacity-40"></i>
                    <p class="mb-0">Ticket is empty</p>
                    <small>Tap dishes to add to this order</small>
                </div>
            `;
        } else {
            container.innerHTML = this.cart.map(item => `
                <div class="cart-item-row">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="fw-bold text-truncate me-2" style="max-width: 170px;" title="${item.name}">
                            ${item.name}
                        </div>
                        <div class="fw-bold text-warning">${settings.currency}${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <div class="d-flex align-items-center gap-1">
                            <button class="cart-qty-btn" onclick="window.pos.updateQty('${item.itemId}', -1)">-</button>
                            <span class="px-2 fw-bold">${item.qty}</span>
                            <button class="cart-qty-btn" onclick="window.pos.updateQty('${item.itemId}', 1)">+</button>
                        </div>
                        <input type="text" class="form-control form-control-sm py-0 px-2 ms-2 text-muted" 
                               style="font-size: 0.75rem; height: 26px;" 
                               placeholder="Special note (e.g. no onion)" 
                               value="${item.notes || ''}" 
                               onchange="window.pos.updateItemNotes('${item.itemId}', this.value)" />
                    </div>
                </div>
            `).join('');
        }

        // Update summary numbers
        const subtotalEl = document.getElementById('posSubtotal');
        const discountEl = document.getElementById('posDiscount');
        const taxEl = document.getElementById('posTax');
        const serviceEl = document.getElementById('posService');
        const totalEl = document.getElementById('posTotal');

        if (subtotalEl) subtotalEl.textContent = `${settings.currency}${subtotal.toFixed(2)}`;
        if (discountEl) discountEl.textContent = `-${settings.currency}${discountAmount.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `${settings.currency}${tax.toFixed(2)} (${settings.taxRate}%)`;
        if (serviceEl) serviceEl.textContent = `${settings.currency}${serviceCharge.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `${settings.currency}${total.toFixed(2)}`;

        // Checkout button state
        const checkoutBtn = document.getElementById('posCheckoutBtn');
        if (checkoutBtn) {
            checkoutBtn.disabled = this.cart.length === 0;
        }
    }

    openPaymentModal() {
        if (this.cart.length === 0) return;
        window.soundFx.playClick();

        const totals = this.calculateTotals();
        const settings = window.erpStore.getSettings();

        // Update modal display
        const modalTotal = document.getElementById('payModalDueTotal');
        if (modalTotal) modalTotal.textContent = `${settings.currency}${totals.total.toFixed(2)}`;

        const tenderInput = document.getElementById('tenderAmountInput');
        if (tenderInput) {
            tenderInput.value = totals.total.toFixed(2);
        }

        this.updateChangeCalculation();

        const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
        modal.show();
    }

    setPaymentMethod(method) {
        window.soundFx.playClick();
        this.currentPaymentMethod = method;
        document.querySelectorAll('.pay-method-pill').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === method);
        });

        const cashDiv = document.getElementById('cashCalculatorWrapper');
        if (cashDiv) {
            cashDiv.style.display = method === 'Cash' ? 'block' : 'none';
        }
    }

    setTenderPreset(amount) {
        window.soundFx.playClick();
        const input = document.getElementById('tenderAmountInput');
        if (input) {
            input.value = amount;
            this.updateChangeCalculation();
        }
    }

    updateChangeCalculation() {
        const totals = this.calculateTotals();
        const settings = window.erpStore.getSettings();
        const tenderInput = document.getElementById('tenderAmountInput');
        const changeDisplay = document.getElementById('payModalChangeDue');

        if (tenderInput && changeDisplay) {
            const tendered = parseFloat(tenderInput.value) || 0;
            const change = Math.max(0, tendered - totals.total);
            changeDisplay.textContent = `${settings.currency}${change.toFixed(2)}`;
        }
    }

    completeOrder(paymentStatus = 'paid') {
        if (this.cart.length === 0) return;

        const totals = this.calculateTotals();
        const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

        const newOrder = {
            id: orderId,
            tableId: this.orderType === 'Dine-In' ? this.selectedTableId : null,
            type: this.orderType,
            customerName: this.customerName.trim() || 'Walk-in Guest',
            serverName: this.selectedServer,
            items: JSON.parse(JSON.stringify(this.cart)),
            subtotal: totals.subtotal,
            tax: totals.tax,
            serviceCharge: totals.serviceCharge,
            discount: totals.discountAmount,
            total: totals.total,
            status: 'pending', // Starts in KDS Pending
            paymentStatus: paymentStatus,
            paymentMethod: paymentStatus === 'paid' ? this.currentPaymentMethod : null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        // Add to ERP store
        window.erpStore.addOrder(newOrder);

        // Sound effect
        if (paymentStatus === 'paid') {
            window.soundFx.playCashRegister();
        } else {
            window.soundFx.playKitchenAlert();
        }

        // Close modal
        const modalEl = document.getElementById('paymentModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();

        // Clear cart
        this.cart = [];
        this.renderCart();

        // Toast
        window.app.showToast(`Order #${orderId} created & sent to Kitchen!`, 'success');

        // Show receipt modal
        this.showReceiptModal(newOrder);
    }

    showReceiptModal(order) {
        const settings = window.erpStore.getSettings();
        const receiptHtml = `
            <div class="receipt-wrapper text-center">
                <div class="fw-bold fs-6">${settings.restaurantName}</div>
                <div class="small text-muted">${settings.tagline}</div>
                <div class="small">${settings.address}</div>
                <div class="small">Tel: ${settings.phone}</div>
                
                <div class="receipt-divider"></div>
                
                <div class="d-flex justify-content-between small">
                    <span>Order: <strong>${order.id}</strong></span>
                    <span>${order.type}</span>
                </div>
                <div class="d-flex justify-content-between small">
                    <span>${order.tableId ? 'Table: ' + order.tableId : 'Express'}</span>
                    <span>Server: ${order.serverName}</span>
                </div>
                <div class="d-flex justify-content-between small">
                    <span>Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>Time: ${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                
                <div class="receipt-double-divider"></div>

                <table class="w-100 text-start small">
                    <thead>
                        <tr class="border-bottom">
                            <th>ITEM</th>
                            <th class="text-center">QTY</th>
                            <th class="text-end">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(it => `
                            <tr>
                                <td class="py-1">${it.name}${it.notes ? `<br><small class="text-muted">(${it.notes})</small>` : ''}</td>
                                <td class="text-center py-1">${it.qty}</td>
                                <td class="text-end py-1">${settings.currency}${(it.price * it.qty).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="receipt-divider"></div>

                <div class="d-flex justify-content-between small">
                    <span>Subtotal:</span>
                    <span>${settings.currency}${order.subtotal.toFixed(2)}</span>
                </div>
                ${order.discount > 0 ? `
                <div class="d-flex justify-content-between small text-danger">
                    <span>Discount:</span>
                    <span>-${settings.currency}${order.discount.toFixed(2)}</span>
                </div>` : ''}
                <div class="d-flex justify-content-between small">
                    <span>Tax (${settings.taxRate}%):</span>
                    <span>${settings.currency}${order.tax.toFixed(2)}</span>
                </div>
                ${order.serviceCharge > 0 ? `
                <div class="d-flex justify-content-between small">
                    <span>Service Charge:</span>
                    <span>${settings.currency}${order.serviceCharge.toFixed(2)}</span>
                </div>` : ''}

                <div class="receipt-double-divider"></div>

                <div class="d-flex justify-content-between fw-bold fs-6">
                    <span>TOTAL:</span>
                    <span>${settings.currency}${order.total.toFixed(2)}</span>
                </div>

                <div class="d-flex justify-content-between small mt-1">
                    <span>Payment:</span>
                    <span>${order.paymentMethod || 'PENDING'} (${order.paymentStatus.toUpperCase()})</span>
                </div>

                <div class="receipt-divider"></div>
                <div class="small fst-italic mt-2">${settings.receiptFooter}</div>
                <div class="mt-3 text-center">
                    <div style="letter-spacing: 5px; font-weight: bold; font-family: monospace;">||| | ||||| || ||| ||||</div>
                    <small style="font-size: 10px;">AUTH-${Math.random().toString(36).substring(2, 10).toUpperCase()}</small>
                </div>
            </div>
        `;

        const container = document.getElementById('receiptPrintArea');
        if (container) {
            container.innerHTML = receiptHtml;
        }

        const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
        modal.show();
    }

    printReceipt() {
        window.print();
    }
}

window.pos = new POSController();
