// Main Application Controller & View Router

class AppController {
    constructor() {
        this.currentView = 'dashboard';
        this.theme = localStorage.getItem('erp_theme') || 'dark';
    }

    init() {
        this.applyTheme(this.theme);
        this.setupNavigation();
        this.setupHeaderActions();
        this.setupSettingsView();
        this.renderDashboardKPIs();

        // Initialize child controllers
        if (window.pos) window.pos.init();
        if (window.kitchen) window.kitchen.init();
        if (window.tables) window.tables.init();
        if (window.inventory) window.inventory.init();
        if (window.menu) window.menu.init();
        if (window.staff) window.staff.init();
        if (window.reports) window.reports.init();

        // Subscribe to store changes to refresh dashboard
        window.erpStore.subscribe('order:created', (order) => {
            this.renderDashboardKPIs();
            this.addActivityItem(`New order #${order.id} placed for ${order.type} (${order.customerName})`, 'bi-receipt', 'text-warning');
        });
        window.erpStore.subscribe('order:updated', (order) => {
            this.renderDashboardKPIs();
            if (order.status === 'ready') {
                this.addActivityItem(`Order #${order.id} is cooked and ready for pickup!`, 'bi-bell-fill', 'text-success');
            } else if (order.status === 'completed') {
                this.addActivityItem(`Order #${order.id} completed & paid.`, 'bi-check-circle-fill', 'text-info');
            }
        });
        window.erpStore.subscribe('state:reset', () => {
            location.reload();
        });

        // Set live clock
        this.startClock();
    }

    startClock() {
        const clockEl = document.getElementById('headerClock');
        const update = () => {
            if (clockEl) {
                const now = new Date();
                clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
        };
        update();
        setInterval(update, 1000);
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view) {
                    this.switchView(view);
                }
            });
        });
    }

    switchView(viewName) {
        window.soundFx.playClick();
        this.currentView = viewName;

        // Update nav items
        document.querySelectorAll('.nav-item-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        const targetPane = document.getElementById(`view-${viewName}`);
        if (targetPane) {
            targetPane.classList.add('active');
        }

        // Update header title
        const titles = {
            'dashboard': '<i class="bi bi-speedometer2 text-warning me-2"></i>Executive Overview',
            'pos': '<i class="bi bi-terminal text-warning me-2"></i>Point of Sale & Billing',
            'kitchen': '<i class="bi bi-fire text-warning me-2"></i>Live Kitchen Display (KDS)',
            'tables': '<i class="bi bi-grid-3x3-gap text-warning me-2"></i>Floor Plan & Reservations',
            'inventory': '<i class="bi bi-box-seam text-warning me-2"></i>Inventory & Supply Chain',
            'menu': '<i class="bi bi-book text-warning me-2"></i>Menu & Recipe Costing',
            'staff': '<i class="bi bi-people text-warning me-2"></i>Staff Roster & Payroll',
            'reports': '<i class="bi bi-graph-up-arrow text-warning me-2"></i>Financial Reports & Analytics',
            'settings': '<i class="bi bi-gear text-warning me-2"></i>System Settings'
        };
        const titleEl = document.getElementById('currentViewTitle');
        if (titleEl && titles[viewName]) {
            titleEl.innerHTML = titles[viewName];
        }

        // Sub-controller triggers on view entrance
        if (viewName === 'kitchen' && window.kitchen) window.kitchen.renderKDS();
        if (viewName === 'tables' && window.tables) window.tables.renderFloorPlan();
        if (viewName === 'inventory' && window.inventory) window.inventory.renderInventory();
        if (viewName === 'reports' && window.reports) window.reports.refresh();
        if (viewName === 'dashboard') this.renderDashboardKPIs();
    }

    setupHeaderActions() {
        // Theme toggle
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.theme = this.theme === 'dark' ? 'light' : 'dark';
                this.applyTheme(this.theme);
            });
        }

        // Audio mute toggle
        const audioBtn = document.getElementById('audioToggleBtn');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                window.soundFx.enabled = !window.soundFx.enabled;
                audioBtn.innerHTML = window.soundFx.enabled ? '<i class="bi bi-volume-up"></i>' : '<i class="bi bi-volume-mute"></i>';
                this.showToast(`Sound effects ${window.soundFx.enabled ? 'Enabled' : 'Muted'}`, 'info');
            });
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('erp_theme', theme);
        const icon = document.querySelector('#themeToggleBtn i');
        if (icon) {
            icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
        }
    }

    renderDashboardKPIs() {
        const orders = window.erpStore.getOrders();
        const tables = window.erpStore.getTables();
        const inventory = window.erpStore.getInventory();
        const settings = window.erpStore.getSettings();

        // 1. Today's Revenue
        const paidOrders = orders.filter(o => o.paymentStatus === 'paid' || o.status === 'completed');
        const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
        const revEl = document.getElementById('dashTodayRevenue');
        if (revEl) revEl.textContent = `${settings.currency}${revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        // 2. Active Orders
        const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
        const activeOrdersEl = document.getElementById('dashActiveOrders');
        if (activeOrdersEl) activeOrdersEl.textContent = activeOrders.length;

        // 3. Table Occupancy
        const occupied = tables.filter(t => t.status === 'occupied').length;
        const totalTables = tables.length;
        const occupancyRate = totalTables > 0 ? Math.round((occupied / totalTables) * 100) : 0;
        const occEl = document.getElementById('dashOccupancyRate');
        if (occEl) occEl.textContent = `${occupancyRate}%`;

        // 4. Low stock alerts
        const lowStock = inventory.filter(i => i.stock <= i.minThreshold).length;
        const lowStockEl = document.getElementById('dashLowStock');
        if (lowStockEl) lowStockEl.textContent = lowStock;

        // 5. Avg Ticket
        const avgTicket = paidOrders.length > 0 ? (revenue / paidOrders.length) : 0;
        const avgEl = document.getElementById('dashAvgTicket');
        if (avgEl) avgEl.textContent = `${settings.currency}${avgTicket.toFixed(2)}`;

        // Update nav counters
        const kdsNavCounter = document.getElementById('navCounterKDS');
        if (kdsNavCounter) kdsNavCounter.textContent = activeOrders.length;

        const invNavCounter = document.getElementById('navCounterInv');
        if (invNavCounter) invNavCounter.textContent = lowStock;
    }

    addActivityItem(text, icon = 'bi-info-circle', iconColor = 'text-warning') {
        const list = document.getElementById('dashActivityStream');
        if (!list) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const li = document.createElement('div');
        li.className = 'd-flex align-items-center gap-3 py-2 border-bottom border-subtle';
        li.innerHTML = `
            <div class="stat-icon-wrapper bg-dark border" style="width: 34px; height: 34px; font-size: 1rem;">
                <i class="bi ${icon} ${iconColor}"></i>
            </div>
            <div class="flex-grow-1 small">
                <div class="fw-semibold text-primary">${text}</div>
                <div class="text-muted" style="font-size:0.75rem;">${time}</div>
            </div>
        `;

        list.insertBefore(li, list.firstChild);
        if (list.children.length > 8) {
            list.removeChild(list.lastChild);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            'success': 'bi-check-circle-fill text-success',
            'warning': 'bi-exclamation-triangle-fill text-warning',
            'danger': 'bi-x-circle-fill text-danger',
            'info': 'bi-info-circle-fill text-info'
        };

        const toast = document.createElement('div');
        toast.className = 'erp-toast';
        toast.innerHTML = `
            <i class="bi ${icons[type] || icons.info} fs-5"></i>
            <span class="flex-grow-1">${message}</span>
            <button class="btn-close btn-close-white ms-auto" style="font-size:0.7rem;"></button>
        `;

        toast.querySelector('.btn-close').addEventListener('click', () => toast.remove());
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(15px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    setupSettingsView() {
        const form = document.getElementById('settingsForm');
        if (!form) return;

        const settings = window.erpStore.getSettings();

        // Populate fields
        const map = {
            'settingRestName': 'restaurantName',
            'settingTagline': 'tagline',
            'settingCurrency': 'currency',
            'settingTaxRate': 'taxRate',
            'settingServiceCharge': 'serviceCharge',
            'settingPhone': 'phone',
            'settingAddress': 'address',
            'settingReceiptFooter': 'receiptFooter'
        };

        Object.entries(map).forEach(([inputElId, settingKey]) => {
            const input = document.getElementById(inputElId);
            if (input && settings[settingKey] !== undefined) {
                input.value = settings[settingKey];
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const updated = {
                ...settings,
                restaurantName: document.getElementById('settingRestName').value,
                tagline: document.getElementById('settingTagline').value,
                currency: document.getElementById('settingCurrency').value,
                taxRate: parseFloat(document.getElementById('settingTaxRate').value) || 0,
                serviceCharge: parseFloat(document.getElementById('settingServiceCharge').value) || 0,
                phone: document.getElementById('settingPhone').value,
                address: document.getElementById('settingAddress').value,
                receiptFooter: document.getElementById('settingReceiptFooter').value
            };

            window.erpStore.saveSettings(updated);
            window.soundFx.playChime();
            this.showToast('System settings saved successfully!', 'success');
            setTimeout(() => location.reload(), 800);
        });

        // Backup export button
        const exportBtn = document.getElementById('exportBackupBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const json = window.erpStore.exportBackupJSON();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Restaurant_ERP_Backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                this.showToast('Full ERP Database Backup downloaded!', 'success');
            });
        }

        // Backup import file input
        const importInput = document.getElementById('importBackupFileInput');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const success = window.erpStore.importBackupJSON(event.target.result);
                    if (success) {
                        this.showToast('Database restored successfully!', 'success');
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        alert('Failed to parse backup JSON file.');
                    }
                };
                reader.readAsText(file);
            });
        }

        // Reset to demo data button
        const resetBtn = document.getElementById('resetDemoDataBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to restore default demo records? Any custom orders or menu edits will be reset.')) {
                    window.erpStore.resetToDefaults();
                    this.showToast('Database reset to factory demo values.', 'warning');
                }
            });
        }
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
    window.app.init();
});
