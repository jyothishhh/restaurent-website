// Kitchen Display System (KDS) Module

class KitchenController {
    constructor() {
        this.filterType = 'all';
        this.timerInterval = null;
    }

    init() {
        this.renderKDS();
        this.startTimer();
        window.erpStore.subscribe('order:created', () => {
            window.soundFx.playKitchenAlert();
            this.renderKDS();
        });
        window.erpStore.subscribe('order:updated', () => {
            this.renderKDS();
        });
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.updateElapsedTimes();
        }, 15000); // refresh elapsed times every 15s
    }

    setFilter(type) {
        window.soundFx.playClick();
        this.filterType = type;
        document.querySelectorAll('.kds-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === type);
        });
        this.renderKDS();
    }

    renderKDS() {
        const orders = window.erpStore.getOrders();
        
        const filtered = orders.filter(o => {
            if (this.filterType === 'all') return true;
            return o.type.toLowerCase() === this.filterType.toLowerCase();
        });

        const pendingCol = document.getElementById('kdsColPending');
        const cookingCol = document.getElementById('kdsColCooking');
        const readyCol = document.getElementById('kdsColReady');
        const completedCol = document.getElementById('kdsColCompleted');

        if (!pendingCol || !cookingCol || !readyCol || !completedCol) return;

        const pendingOrders = filtered.filter(o => o.status === 'pending');
        const cookingOrders = filtered.filter(o => o.status === 'cooking');
        const readyOrders = filtered.filter(o => o.status === 'ready');
        const completedOrders = filtered.filter(o => o.status === 'completed').slice(0, 5); // recent 5

        // Update count badges
        const pBadge = document.getElementById('kdsBadgePending');
        const cBadge = document.getElementById('kdsBadgeCooking');
        const rBadge = document.getElementById('kdsBadgeReady');
        const dBadge = document.getElementById('kdsBadgeCompleted');

        if (pBadge) pBadge.textContent = pendingOrders.length;
        if (cBadge) cBadge.textContent = cookingOrders.length;
        if (rBadge) rBadge.textContent = readyOrders.length;
        if (dBadge) dBadge.textContent = completedOrders.length;

        pendingCol.innerHTML = pendingOrders.length ? pendingOrders.map(o => this.renderTicket(o)).join('') : this.renderEmptyState('No new tickets');
        cookingCol.innerHTML = cookingOrders.length ? cookingOrders.map(o => this.renderTicket(o)).join('') : this.renderEmptyState('Station clear');
        readyCol.innerHTML = readyOrders.length ? readyOrders.map(o => this.renderTicket(o)).join('') : this.renderEmptyState('Nothing awaiting pickup');
        completedCol.innerHTML = completedOrders.length ? completedOrders.map(o => this.renderTicket(o)).join('') : this.renderEmptyState('No recent tickets');
    }

    renderEmptyState(text) {
        return `
            <div class="text-center py-5 text-muted opacity-50 my-auto">
                <i class="bi bi-clipboard-check fs-2 mb-2 d-block"></i>
                <small>${text}</small>
            </div>
        `;
    }

    renderTicket(order) {
        const elapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
        let timerClass = '';
        if (elapsedMins > 20) timerClass = 'timer-urgent';
        else if (elapsedMins > 10) timerClass = 'timer-warn';

        const totalItemsCount = order.items.reduce((sum, it) => sum + it.qty, 0);

        return `
            <div class="kds-ticket" id="ticket-${order.id}">
                <div class="ticket-timer-bar ${timerClass}"></div>
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold fs-6 text-warning">#${order.id}</span>
                    <span class="badge ${order.type === 'Dine-In' ? 'bg-primary' : 'bg-info text-dark'}">${order.type}</span>
                </div>
                <div class="d-flex justify-content-between small text-muted mb-2">
                    <span>${order.tableId ? `<i class="bi bi-geo-alt me-1"></i>${order.tableId}` : '<i class="bi bi-bag me-1"></i>Takeout'}</span>
                    <span class="fw-bold ${elapsedMins > 15 ? 'text-danger' : 'text-secondary'}" data-created="${order.createdAt}">
                        <i class="bi bi-clock me-1"></i>${elapsedMins}m ago
                    </span>
                </div>
                <div class="small fw-semibold text-truncate mb-2 text-secondary">
                    Guest: ${order.customerName} | Staff: ${order.serverName}
                </div>
                
                <div class="ticket-items-list mb-3">
                    ${order.items.map((item, idx) => `
                        <div class="ticket-item cursor-pointer" onclick="window.kitchen.toggleItemStrike('${order.id}', ${idx}, this)" title="Click to strike-off item">
                            <div>
                                <span class="badge bg-secondary me-2">${item.qty}x</span>
                                <span class="item-name">${item.name}</span>
                                ${item.notes ? `<div class="text-warning small fst-italic ms-4">Note: ${item.notes}</div>` : ''}
                            </div>
                            <i class="bi bi-check-circle text-muted check-icon"></i>
                        </div>
                    `).join('')}
                </div>

                <div class="d-flex gap-2">
                    ${this.renderActionButtons(order)}
                </div>
            </div>
        `;
    }

    renderActionButtons(order) {
        if (order.status === 'pending') {
            return `
                <button class="btn btn-sm btn-outline-warning w-100 fw-bold" onclick="window.kitchen.bumpOrder('${order.id}', 'cooking')">
                    <i class="bi bi-fire me-1"></i> Start Prep
                </button>
            `;
        } else if (order.status === 'cooking') {
            return `
                <button class="btn btn-sm btn-outline-secondary" onclick="window.kitchen.bumpOrder('${order.id}', 'pending')">
                    <i class="bi bi-arrow-left"></i>
                </button>
                <button class="btn btn-sm btn-warning w-100 fw-bold text-dark" onclick="window.kitchen.bumpOrder('${order.id}', 'ready')">
                    <i class="bi bi-bell-fill me-1"></i> Food Ready
                </button>
            `;
        } else if (order.status === 'ready') {
            return `
                <button class="btn btn-sm btn-outline-secondary" onclick="window.kitchen.bumpOrder('${order.id}', 'cooking')">
                    <i class="bi bi-arrow-left"></i>
                </button>
                <button class="btn btn-sm btn-success w-100 fw-bold" onclick="window.kitchen.bumpOrder('${order.id}', 'completed')">
                    <i class="bi bi-check-lg me-1"></i> Served / Done
                </button>
            `;
        } else {
            return `
                <button class="btn btn-sm btn-erp-secondary w-100" onclick="window.pos.showReceiptModal(window.erpStore.getOrders().find(o=>o.id==='${order.id}'))">
                    <i class="bi bi-receipt me-1"></i> Receipt
                </button>
            `;
        }
    }

    bumpOrder(orderId, newStatus) {
        window.soundFx.playClick();
        if (newStatus === 'ready') {
            window.soundFx.playChime();
        } else if (newStatus === 'completed') {
            window.soundFx.playCashRegister();
        }
        window.erpStore.updateOrderStatus(orderId, newStatus);
        window.app.showToast(`Order #${orderId} moved to ${newStatus.toUpperCase()}`, 'info');
    }

    toggleItemStrike(orderId, itemIdx, element) {
        window.soundFx.playClick();
        element.classList.toggle('text-decoration-line-through');
        element.classList.toggle('opacity-50');
        const icon = element.querySelector('.check-icon');
        if (icon) {
            icon.classList.toggle('text-success');
            icon.classList.toggle('text-muted');
        }
    }

    updateElapsedTimes() {
        document.querySelectorAll('[data-created]').forEach(el => {
            const created = el.getAttribute('data-created');
            if (created) {
                const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000);
                el.innerHTML = `<i class="bi bi-clock me-1"></i>${mins}m ago`;
            }
        });
    }
}

window.kitchen = new KitchenController();
