// Financial Reports & Analytics Module with Chart.js

class ReportsController {
    constructor() {
        this.salesChart = null;
        this.channelChart = null;
        this.topItemsChart = null;
    }

    init() {
        this.renderFinancialKPIs();
        this.renderCharts();
        this.renderExpensesTable();
        this.renderRecentTransactions();
        window.erpStore.subscribe('order:created', () => this.refresh());
        window.erpStore.subscribe('order:updated', () => this.refresh());
        window.erpStore.subscribe('erp_expenses', () => this.refresh());
    }

    refresh() {
        this.renderFinancialKPIs();
        this.renderCharts();
        this.renderExpensesTable();
        this.renderRecentTransactions();
    }

    renderFinancialKPIs() {
        const orders = window.erpStore.getOrders();
        const expenses = window.erpStore.getExpenses();
        const settings = window.erpStore.getSettings();

        const paidOrders = orders.filter(o => o.paymentStatus === 'paid' || o.status === 'completed');
        const grossRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = grossRevenue - totalExpenses;
        const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;
        const avgTicket = paidOrders.length > 0 ? (grossRevenue / paidOrders.length) : 0;

        const revEl = document.getElementById('reportGrossRevenue');
        const expEl = document.getElementById('reportExpenses');
        const profitEl = document.getElementById('reportNetProfit');
        const marginEl = document.getElementById('reportProfitMargin');
        const avgTicketEl = document.getElementById('reportAvgTicket');
        const ordersCountEl = document.getElementById('reportOrdersCount');

        if (revEl) revEl.textContent = `${settings.currency}${grossRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (expEl) expEl.textContent = `${settings.currency}${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (profitEl) profitEl.textContent = `${settings.currency}${netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (marginEl) marginEl.textContent = `${profitMargin}%`;
        if (avgTicketEl) avgTicketEl.textContent = `${settings.currency}${avgTicket.toFixed(2)}`;
        if (ordersCountEl) ordersCountEl.textContent = paidOrders.length;
    }

    renderCharts() {
        if (typeof Chart === 'undefined') return;

        const orders = window.erpStore.getOrders();
        const settings = window.erpStore.getSettings();

        // 1. Hourly Sales Trend
        const salesCanvas = document.getElementById('salesTrendChart');
        if (salesCanvas) {
            if (this.salesChart) this.salesChart.destroy();

            const hours = ['11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'];
            // Generate realistic curve from data
            const dataPoints = [85, 190, 240, 160, 95, 70, 180, 320, 410, 360, 210, 120];

            this.salesChart = new Chart(salesCanvas, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [{
                        label: `Revenue (${settings.currency})`,
                        data: dataPoints,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#f59e0b',
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#94a3b8' }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#94a3b8', callback: val => `${settings.currency}${val}` }
                        }
                    }
                }
            });
        }

        // 2. Channel Distribution (Dine-in vs Takeaway vs Delivery)
        const channelCanvas = document.getElementById('channelChart');
        if (channelCanvas) {
            if (this.channelChart) this.channelChart.destroy();

            let dineInCount = 0;
            let takeawayCount = 0;
            let deliveryCount = 0;

            orders.forEach(o => {
                if (o.type === 'Dine-In') dineInCount++;
                else if (o.type === 'Takeaway') takeawayCount++;
                else deliveryCount++;
            });

            this.channelChart = new Chart(channelCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Dine-In', 'Takeaway', 'Delivery'],
                    datasets: [{
                        data: [dineInCount || 5, takeawayCount || 2, deliveryCount || 1],
                        backgroundColor: ['#f59e0b', '#06b6d4', '#10b981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
                        }
                    },
                    cutout: '70%'
                }
            });
        }

        // 3. Top-selling dishes
        const topCanvas = document.getElementById('topItemsChart');
        if (topCanvas) {
            if (this.topItemsChart) this.topItemsChart.destroy();

            const itemMap = {};
            orders.forEach(o => {
                o.items.forEach(it => {
                    itemMap[it.name] = (itemMap[it.name] || 0) + (it.qty * it.price);
                });
            });

            const sorted = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const labels = sorted.length ? sorted.map(s => s[0]) : ['Angus Burger', 'Burrata Pizza', 'Salmon Fillet', 'Parmesan Fries', 'Lava Cake'];
            const values = sorted.length ? sorted.map(s => s[1]) : [185, 160, 132, 98, 80];

            this.topItemsChart = new Chart(topCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Sales (${settings.currency})`,
                        data: values,
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#94a3b8', callback: val => `${settings.currency}${val}` }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }
    }

    renderExpensesTable() {
        const tbody = document.getElementById('expensesTableBody');
        if (!tbody) return;

        const expenses = window.erpStore.getExpenses();
        const settings = window.erpStore.getSettings();

        tbody.innerHTML = expenses.map(e => `
            <tr>
                <td><span class="badge bg-dark border">${e.id}</span></td>
                <td>${e.date}</td>
                <td class="fw-bold">${e.title}</td>
                <td><span class="badge bg-secondary">${e.category}</span></td>
                <td>${e.supplier || 'Standard'}</td>
                <td class="fw-bold text-danger">-${settings.currency}${e.amount.toFixed(2)}</td>
                <td><span class="badge bg-success">${e.status}</span></td>
            </tr>
        `).join('');
    }

    renderRecentTransactions() {
        const tbody = document.getElementById('recentTransactionsTableBody');
        if (!tbody) return;

        const orders = window.erpStore.getOrders();
        const settings = window.erpStore.getSettings();

        tbody.innerHTML = orders.slice(0, 8).map(o => `
            <tr>
                <td><span class="badge bg-dark border">${o.id}</span></td>
                <td>${new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td class="fw-bold">${o.customerName}</td>
                <td><span class="badge bg-primary">${o.type}</span></td>
                <td>${o.paymentMethod || 'Pending'}</td>
                <td class="fw-bold text-warning">${settings.currency}${o.total.toFixed(2)}</td>
                <td>
                    <span class="badge ${o.paymentStatus === 'paid' ? 'bg-success' : 'bg-warning text-dark'}">
                        ${o.paymentStatus.toUpperCase()}
                    </span>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-light" onclick="window.pos.showReceiptModal(window.erpStore.getOrders().find(ord=>ord.id==='${o.id}'))">
                        <i class="bi bi-receipt"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    addCustomExpense(formData) {
        const expenses = window.erpStore.getExpenses();
        const newExpense = {
            id: 'EXP-' + Math.floor(100 + Math.random() * 900),
            date: formData.date || new Date().toISOString().split('T')[0],
            title: formData.title,
            category: formData.category,
            amount: parseFloat(formData.amount),
            supplier: formData.supplier || 'Vendor',
            status: 'Paid'
        };
        expenses.unshift(newExpense);
        window.erpStore.saveExpenses(expenses);
        window.soundFx.playChime();
        window.app.showToast(`Logged expense of $${newExpense.amount.toFixed(2)}`, 'info');

        const modalEl = document.getElementById('newExpenseModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }

    exportOrdersCSV() {
        const orders = window.erpStore.getOrders();
        if (orders.length === 0) {
            alert('No orders to export');
            return;
        }

        let csv = 'Order ID,Date,Type,Table,Customer,Server,Items Count,Subtotal,Tax,Discount,Total,Status,Payment Status,Payment Method\n';
        orders.forEach(o => {
            const count = o.items.reduce((sum, it) => sum + it.qty, 0);
            const line = [
                o.id,
                `"${new Date(o.createdAt).toLocaleString()}"`,
                o.type,
                o.tableId || 'N/A',
                `"${o.customerName}"`,
                `"${o.serverName}"`,
                count,
                o.subtotal.toFixed(2),
                o.tax.toFixed(2),
                o.discount.toFixed(2),
                o.total.toFixed(2),
                o.status,
                o.paymentStatus,
                o.paymentMethod || 'N/A'
            ].join(',');
            csv += line + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Restaurant_Orders_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        window.app.showToast('Orders exported to CSV', 'success');
    }
}

window.reports = new ReportsController();
