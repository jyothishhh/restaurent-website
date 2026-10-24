// Inventory & Stock Control Module

class InventoryController {
    constructor() {
        this.activeCategory = 'all';
        this.searchQuery = '';
    }

    init() {
        this.renderInventory();
        this.setupEventListeners();
        window.erpStore.subscribe('erp_inventory', () => {
            this.renderInventory();
        });
    }

    setupEventListeners() {
        const search = document.getElementById('invSearchInput');
        if (search) {
            search.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderInventory();
            });
        }

        const catSelect = document.getElementById('invCategoryFilter');
        if (catSelect) {
            catSelect.addEventListener('change', (e) => {
                this.activeCategory = e.target.value;
                this.renderInventory();
            });
        }
    }

    renderInventory() {
        const tbody = document.getElementById('inventoryTableBody');
        if (!tbody) return;

        const inventory = window.erpStore.getInventory();
        const settings = window.erpStore.getSettings();

        // Calculate KPI values
        let totalValuation = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        inventory.forEach(item => {
            totalValuation += item.stock * item.cost;
            if (item.stock <= 0) outOfStockCount++;
            else if (item.stock <= item.minThreshold) lowStockCount++;
        });

        const valEl = document.getElementById('invValuationStat');
        const lowEl = document.getElementById('invLowStockStat');
        const outEl = document.getElementById('invOutOfStockStat');
        const totalItemsEl = document.getElementById('invTotalItemsStat');

        if (valEl) valEl.textContent = `${settings.currency}${totalValuation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (lowEl) lowEl.textContent = lowStockCount;
        if (outEl) outEl.textContent = outOfStockCount;
        if (totalItemsEl) totalItemsEl.textContent = inventory.length;

        // Filter
        const filtered = inventory.filter(item => {
            const matchesCat = this.activeCategory === 'all' || item.category === this.activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(this.searchQuery) || item.id.toLowerCase().includes(this.searchQuery);
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-box-seam fs-2 d-block mb-2 opacity-50"></i>
                        No inventory items found matching criteria
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(item => {
            const isOutOfStock = item.stock <= 0;
            const isLowStock = !isOutOfStock && item.stock <= item.minThreshold;
            const statusBadge = isOutOfStock 
                ? '<span class="badge bg-danger">OUT OF STOCK</span>' 
                : isLowStock 
                    ? '<span class="badge bg-warning text-dark"><i class="bi bi-exclamation-triangle-fill me-1"></i>LOW STOCK</span>' 
                    : '<span class="badge bg-success">HEALTHY</span>';

            const totalItemVal = (item.stock * item.cost).toFixed(2);

            return `
                <tr>
                    <td><span class="badge bg-dark border">${item.id}</span></td>
                    <td class="fw-bold">${item.name}</td>
                    <td><span class="badge bg-secondary">${item.category}</span></td>
                    <td>
                        <span class="fs-6 fw-bold ${isOutOfStock ? 'text-danger' : isLowStock ? 'text-warning' : 'text-primary'}">
                            ${item.stock} ${item.unit}
                        </span>
                        <div class="small text-muted">Min: ${item.minThreshold} ${item.unit}</div>
                    </td>
                    <td>${settings.currency}${item.cost.toFixed(2)} / ${item.unit}</td>
                    <td class="fw-semibold">${settings.currency}${totalItemVal}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        <div class="d-inline-flex gap-1">
                            <button class="btn btn-sm btn-outline-warning" onclick="window.inventory.openRestockModal('${item.id}')" title="Restock / Purchase">
                                <i class="bi bi-plus-circle"></i> Restock
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="window.inventory.openWastageModal('${item.id}')" title="Log Spoilage / Wastage">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openRestockModal(itemId) {
        window.soundFx.playClick();
        const inventory = window.erpStore.getInventory();
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        const select = document.getElementById('restockItemSelect');
        if (select) {
            select.innerHTML = inventory.map(i => `
                <option value="${i.id}" ${i.id === itemId ? 'selected' : ''}>${i.name} (Current: ${i.stock} ${i.unit})</option>
            `).join('');
        }

        const qtyInput = document.getElementById('restockQtyInput');
        const costInput = document.getElementById('restockUnitCostInput');
        if (qtyInput) qtyInput.value = 10;
        if (costInput) costInput.value = item.cost;

        const modal = new bootstrap.Modal(document.getElementById('restockModal'));
        modal.show();
    }

    confirmRestock(formData) {
        const inventory = window.erpStore.getInventory();
        const item = inventory.find(i => i.id === formData.itemId);
        if (!item) return;

        const qty = parseFloat(formData.quantity);
        const cost = parseFloat(formData.unitCost);
        const supplier = formData.supplier || 'Standard Supplier';
        const totalExpense = qty * cost;

        // Update Stock
        item.stock = parseFloat((item.stock + qty).toFixed(2));
        item.cost = cost; // update to latest cost
        window.erpStore.saveInventory(inventory);

        // Record Purchase in Expenses
        const expenses = window.erpStore.getExpenses();
        const newExpense = {
            id: 'EXP-' + Math.floor(100 + Math.random() * 900),
            date: new Date().toISOString().split('T')[0],
            title: `PO: Restocked ${qty} ${item.unit} ${item.name}`,
            category: 'Inventory Supply',
            amount: totalExpense,
            supplier: supplier,
            status: 'Paid'
        };
        expenses.unshift(newExpense);
        window.erpStore.saveExpenses(expenses);

        window.soundFx.playChime();
        window.app.showToast(`Restocked ${qty} ${item.unit} of ${item.name}. Expense of $${totalExpense.toFixed(2)} recorded.`, 'success');

        const modalEl = document.getElementById('restockModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }

    openWastageModal(itemId) {
        window.soundFx.playClick();
        const inventory = window.erpStore.getInventory();
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        const reason = prompt(`Log Wastage / Spoilage for ${item.name} (Current Stock: ${item.stock} ${item.unit})\nEnter quantity to write off:`, "1");
        if (!reason) return;

        const qty = parseFloat(reason);
        if (isNaN(qty) || qty <= 0) {
            alert('Invalid quantity entered');
            return;
        }

        if (qty > item.stock) {
            alert(`Cannot waste more than current stock (${item.stock} ${item.unit})`);
            return;
        }

        item.stock = parseFloat((item.stock - qty).toFixed(2));
        window.erpStore.saveInventory(inventory);

        // Log Expense as wastage loss
        const expenses = window.erpStore.getExpenses();
        expenses.unshift({
            id: 'EXP-' + Math.floor(100 + Math.random() * 900),
            date: new Date().toISOString().split('T')[0],
            title: `Spoilage Write-Off: ${qty} ${item.unit} ${item.name}`,
            category: 'Wastage Loss',
            amount: parseFloat((qty * item.cost).toFixed(2)),
            supplier: 'Kitchen Waste Log',
            status: 'Logged'
        });
        window.erpStore.saveExpenses(expenses);

        window.app.showToast(`Logged write-off of ${qty} ${item.unit} ${item.name}`, 'warning');
    }

    addNewIngredient(formData) {
        const inventory = window.erpStore.getInventory();
        const newId = 'INV-' + String(inventory.length + 1).padStart(2, '0');
        
        inventory.push({
            id: newId,
            name: formData.name,
            category: formData.category,
            stock: parseFloat(formData.stock),
            unit: formData.unit,
            minThreshold: parseFloat(formData.minThreshold),
            cost: parseFloat(formData.cost)
        });

        window.erpStore.saveInventory(inventory);
        window.soundFx.playChime();
        window.app.showToast(`Added new raw material ${formData.name}`, 'success');

        const modalEl = document.getElementById('newIngredientModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
}

window.inventory = new InventoryController();
