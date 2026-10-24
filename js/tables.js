// Tables & Floor Management Module

class TableController {
    constructor() {
        this.activeSection = 'all';
    }

    init() {
        this.renderFloorPlan();
        this.renderReservations();
        this.setupEventListeners();
        window.erpStore.subscribe('erp_tables', () => {
            this.renderFloorPlan();
        });
        window.erpStore.subscribe('erp_reservations', () => {
            this.renderReservations();
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.floor-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.floor-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeSection = btn.dataset.section;
                this.renderFloorPlan();
            });
        });
    }

    renderFloorPlan() {
        const grid = document.getElementById('floorPlanGrid');
        if (!grid) return;

        const tables = window.erpStore.getTables();
        const orders = window.erpStore.getOrders();
        const settings = window.erpStore.getSettings();

        const filtered = tables.filter(t => {
            if (this.activeSection === 'all') return true;
            return t.section === this.activeSection;
        });

        // Occupancy counts
        const total = tables.length;
        const occupied = tables.filter(t => t.status === 'occupied').length;
        const available = tables.filter(t => t.status === 'available').length;
        const reserved = tables.filter(t => t.status === 'reserved').length;
        const occupancyRate = Math.round((occupied / total) * 100);

        const occEl = document.getElementById('floorOccupancyStat');
        const availEl = document.getElementById('floorAvailableStat');
        const resEl = document.getElementById('floorReservedStat');
        if (occEl) occEl.textContent = `${occupancyRate}% (${occupied}/${total})`;
        if (availEl) availEl.textContent = available;
        if (resEl) resEl.textContent = reserved;

        grid.innerHTML = filtered.map(t => {
            let activeOrder = null;
            if (t.activeOrderId) {
                activeOrder = orders.find(o => o.id === t.activeOrderId);
            }

            return `
                <div class="table-card ${t.status}" onclick="window.tables.handleTableClick('${t.id}')">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge ${this.getStatusBadgeClass(t.status)} text-uppercase">${t.status}</span>
                        <span class="small text-muted"><i class="bi bi-people-fill me-1"></i>${t.seats} seats</span>
                    </div>

                    <div class="table-shape-indicator">
                        <i class="bi ${this.getTableIcon(t.section, t.seats)} text-secondary"></i>
                    </div>

                    <div class="text-center">
                        <h6 class="fw-bold mb-1">${t.name}</h6>
                        <div class="small text-muted">${t.section}</div>
                    </div>

                    <div class="mt-3 pt-2 border-top border-secondary border-opacity-25 small">
                        ${activeOrder ? `
                            <div class="d-flex justify-content-between text-warning fw-bold">
                                <span>Order #${activeOrder.id}</span>
                                <span>${settings.currency}${activeOrder.total.toFixed(2)}</span>
                            </div>
                            <div class="d-flex justify-content-between text-muted mt-1">
                                <span>Guest: ${activeOrder.customerName}</span>
                                <span>${activeOrder.status}</span>
                            </div>
                        ` : `
                            <div class="d-flex justify-content-between text-muted">
                                <span>Server:</span>
                                <span class="fw-semibold">${t.server || 'Unassigned'}</span>
                            </div>
                        `}
                    </div>

                    <div class="mt-2 text-center">
                        ${this.renderTableQuickAction(t)}
                    </div>
                </div>
            `;
        }).join('');
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'available': return 'bg-success';
            case 'occupied': return 'bg-warning text-dark';
            case 'reserved': return 'bg-info text-dark';
            case 'cleaning': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    getTableIcon(section, seats) {
        if (section.includes('Bar')) return 'bi-cup-straw';
        if (seats >= 6) return 'bi-grid-3x3-gap-fill';
        return 'bi-square-fill';
    }

    renderTableQuickAction(table) {
        if (table.status === 'available') {
            return `<button class="btn btn-sm btn-outline-success w-100 py-1" onclick="event.stopPropagation(); window.tables.openPosForTable('${table.id}')"><i class="bi bi-plus-circle me-1"></i>New Order</button>`;
        } else if (table.status === 'occupied') {
            return `<button class="btn btn-sm btn-outline-warning w-100 py-1" onclick="event.stopPropagation(); window.tables.viewTableOrder('${table.activeOrderId}')"><i class="bi bi-receipt me-1"></i>View Bill</button>`;
        } else if (table.status === 'cleaning') {
            return `<button class="btn btn-sm btn-outline-primary w-100 py-1" onclick="event.stopPropagation(); window.tables.markTableReady('${table.id}')"><i class="bi bi-check2-circle me-1"></i>Mark Clean</button>`;
        } else {
            return `<button class="btn btn-sm btn-outline-info w-100 py-1" onclick="event.stopPropagation(); window.tables.seatReservationTable('${table.id}')"><i class="bi bi-person-check me-1"></i>Seat Guest</button>`;
        }
    }

    handleTableClick(tableId) {
        window.soundFx.playClick();
        const tables = window.erpStore.getTables();
        const table = tables.find(t => t.id === tableId);
        if (!table) return;

        if (table.status === 'available') {
            this.openPosForTable(tableId);
        } else if (table.status === 'occupied' && table.activeOrderId) {
            this.viewTableOrder(table.activeOrderId);
        } else if (table.status === 'cleaning') {
            this.markTableReady(tableId);
        } else if (table.status === 'reserved') {
            this.seatReservationTable(tableId);
        }
    }

    openPosForTable(tableId) {
        window.app.switchView('pos');
        const posTableSelect = document.getElementById('posTableSelect');
        if (posTableSelect) {
            posTableSelect.value = tableId;
            window.pos.selectedTableId = tableId;
        }
        window.app.showToast(`Selected ${tableId} for new ticket`, 'info');
    }

    viewTableOrder(orderId) {
        const orders = window.erpStore.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            window.pos.showReceiptModal(order);
        }
    }

    markTableReady(tableId) {
        window.soundFx.playClick();
        const tables = window.erpStore.getTables();
        const table = tables.find(t => t.id === tableId);
        if (table) {
            table.status = 'available';
            window.erpStore.saveTables(tables);
            window.app.showToast(`${table.name} is now clean and available`, 'success');
        }
    }

    seatReservationTable(tableId) {
        window.soundFx.playClick();
        const tables = window.erpStore.getTables();
        const table = tables.find(t => t.id === tableId);
        if (table) {
            this.openPosForTable(tableId);
        }
    }

    renderReservations() {
        const tbody = document.getElementById('reservationTableBody');
        if (!tbody) return;

        const reservations = window.erpStore.getReservations();
        tbody.innerHTML = reservations.map(r => `
            <tr>
                <td class="fw-bold">${r.guestName}</td>
                <td><i class="bi bi-telephone me-1 text-muted"></i>${r.phone}</td>
                <td><span class="badge bg-secondary">${r.guests} Pax</span></td>
                <td><span class="badge bg-dark border">${r.tableId}</span></td>
                <td>${r.date} @ ${r.time}</td>
                <td><span class="badge ${r.status === 'confirmed' ? 'bg-info text-dark' : 'bg-success'}">${r.status}</span></td>
                <td class="small text-muted">${r.notes || '—'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-warning" onclick="window.tables.seatGuestFromRes('${r.id}')" title="Seat Guest">
                        <i class="bi bi-box-arrow-in-right"></i> Seat
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="window.tables.cancelReservation('${r.id}')" title="Cancel">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    seatGuestFromRes(resId) {
        const reservations = window.erpStore.getReservations();
        const res = reservations.find(r => r.id === resId);
        if (res) {
            res.status = 'seated';
            window.erpStore.saveReservations(reservations);
            this.openPosForTable(res.tableId);
            window.pos.customerName = res.guestName;
            const custInput = document.getElementById('posCustomerName');
            if (custInput) custInput.value = res.guestName;
        }
    }

    cancelReservation(resId) {
        if (!confirm('Cancel this reservation?')) return;
        let reservations = window.erpStore.getReservations();
        reservations = reservations.filter(r => r.id !== resId);
        window.erpStore.saveReservations(reservations);
        window.app.showToast('Reservation removed', 'info');
    }

    addNewReservation(formData) {
        const reservations = window.erpStore.getReservations();
        const newRes = {
            id: 'RES-' + Math.floor(100 + Math.random() * 900),
            guestName: formData.guestName,
            phone: formData.phone,
            guests: parseInt(formData.guests),
            tableId: formData.tableId,
            date: formData.date,
            time: formData.time,
            status: 'confirmed',
            notes: formData.notes
        };
        reservations.push(newRes);
        window.erpStore.saveReservations(reservations);

        // Update table to reserved
        const tables = window.erpStore.getTables();
        const table = tables.find(t => t.id === formData.tableId);
        if (table && table.status === 'available') {
            table.status = 'reserved';
            window.erpStore.saveTables(tables);
        }

        window.app.showToast(`Reservation confirmed for ${newRes.guestName}!`, 'success');
    }
}

window.tables = new TableController();
