// Menu Engineering & Recipe Costing Module

class MenuController {
    constructor() {
        this.activeFilter = 'all';
    }

    init() {
        this.renderMenuTable();
        this.setupEventListeners();
        window.erpStore.subscribe('erp_menu', () => {
            this.renderMenuTable();
            window.pos.renderMenuGrid();
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.menu-mgmt-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.menu-mgmt-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFilter = btn.dataset.cat;
                this.renderMenuTable();
            });
        });
    }

    renderMenuTable() {
        const tbody = document.getElementById('menuTableBody');
        if (!tbody) return;

        const menu = window.erpStore.getMenu();
        const settings = window.erpStore.getSettings();

        const filtered = menu.filter(item => {
            if (this.activeFilter === 'all') return true;
            return item.category === this.activeFilter;
        });

        tbody.innerHTML = filtered.map(item => {
            const profit = item.price - item.cost;
            const margin = Math.round((profit / item.price) * 100);
            const marginBadge = margin >= 70 ? 'bg-success' : margin >= 50 ? 'bg-warning text-dark' : 'bg-danger';

            return `
                <tr>
                    <td><span class="badge bg-dark border">${item.id}</span></td>
                    <td>
                        <div class="fw-bold">${item.name}</div>
                        <div class="small text-muted">${item.description}</div>
                    </td>
                    <td><span class="badge bg-secondary">${item.category}</span></td>
                    <td class="fw-bold text-warning">${settings.currency}${item.price.toFixed(2)}</td>
                    <td class="text-secondary">${settings.currency}${item.cost.toFixed(2)}</td>
                    <td>
                        <span class="badge ${marginBadge}">${margin}% Margin</span>
                        <div class="small text-muted mt-1">+${settings.currency}${profit.toFixed(2)}</div>
                    </td>
                    <td>
                        <span class="badge ${item.available ? 'bg-success' : 'bg-danger'}">
                            ${item.available ? 'Active' : '86\'d (Out)'}
                        </span>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm ${item.available ? 'btn-outline-danger' : 'btn-outline-success'} me-1" 
                                onclick="window.menu.toggleItemAvailability('${item.id}')"
                                title="${item.available ? '86 this dish' : 'Reactivate dish'}">
                            ${item.available ? '86 It' : 'Enable'}
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.menu.deleteDish('${item.id}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    toggleItemAvailability(itemId) {
        window.soundFx.playClick();
        const menu = window.erpStore.getMenu();
        const item = menu.find(m => m.id === itemId);
        if (item) {
            item.available = !item.available;
            window.erpStore.saveMenu(menu);
            window.app.showToast(`${item.name} is now ${item.available ? 'Available' : "86'd"}`);
        }
    }

    deleteDish(itemId) {
        if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
        let menu = window.erpStore.getMenu();
        menu = menu.filter(m => m.id !== itemId);
        window.erpStore.saveMenu(menu);
        window.app.showToast('Dish removed from menu', 'info');
    }

    addNewDish(formData) {
        const menu = window.erpStore.getMenu();
        const newId = 'MENU-' + String(menu.length + 1).padStart(2, '0');

        const newDish = {
            id: newId,
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            cost: parseFloat(formData.cost || (formData.price * 0.3)),
            description: formData.description,
            prepTime: parseInt(formData.prepTime || 12),
            calories: parseInt(formData.calories || 500),
            isVeg: formData.isVeg === true || formData.isVeg === 'true',
            isSpicy: formData.isSpicy === true || formData.isSpicy === 'true',
            isPopular: false,
            available: true,
            recipe: []
        };

        menu.push(newDish);
        window.erpStore.saveMenu(menu);
        window.soundFx.playChime();
        window.app.showToast(`Added ${newDish.name} to the menu!`, 'success');

        const modalEl = document.getElementById('newDishModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
}

window.menu = new MenuController();
