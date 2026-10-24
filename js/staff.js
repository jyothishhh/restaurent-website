// Staff & Shift Management Module

class StaffController {
    constructor() {}

    init() {
        this.renderStaffTable();
        window.erpStore.subscribe('erp_staff', () => {
            this.renderStaffTable();
            window.pos.populateServerSelect();
        });
    }

    renderStaffTable() {
        const tbody = document.getElementById('staffTableBody');
        if (!tbody) return;

        const staff = window.erpStore.getStaff();
        const settings = window.erpStore.getSettings();

        // Calculate KPIs
        const activeClockedIn = staff.filter(s => s.status === 'Clocked In').length;
        const totalWages = staff.reduce((sum, s) => sum + s.wagePerHour, 0);
        const projectedDailyPayroll = staff.reduce((sum, s) => {
            return s.status === 'Clocked In' ? sum + (s.wagePerHour * 8) : sum;
        }, 0);

        const activeEl = document.getElementById('staffActiveCountStat');
        const payrollEl = document.getElementById('staffPayrollStat');
        const totalEl = document.getElementById('staffTotalCountStat');

        if (activeEl) activeEl.textContent = activeClockedIn;
        if (payrollEl) payrollEl.textContent = `${settings.currency}${projectedDailyPayroll.toFixed(2)}`;
        if (totalEl) totalEl.textContent = staff.length;

        tbody.innerHTML = staff.map(member => {
            const isClockedIn = member.status === 'Clocked In';

            return `
                <tr>
                    <td><span class="badge bg-dark border">${member.id}</span></td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="user-avatar" style="width:32px; height:32px; font-size:0.75rem;">
                                ${member.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div>
                                <div class="fw-bold">${member.name}</div>
                                <div class="small text-muted"><i class="bi bi-telephone me-1"></i>${member.phone}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge bg-secondary">${member.role}</span></td>
                    <td>${member.shift}</td>
                    <td class="fw-semibold">${settings.currency}${member.wagePerHour.toFixed(2)}/hr</td>
                    <td>
                        <span class="badge ${isClockedIn ? 'bg-success' : 'bg-secondary'}">
                            ${isClockedIn ? 'CLOCKED IN' : 'OFF DUTY'}
                        </span>
                        ${isClockedIn && member.clockedInAt ? `<div class="small text-muted mt-1">Since: ${member.clockedInAt}</div>` : ''}
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm ${isClockedIn ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold"
                                onclick="window.staff.toggleClockIn('${member.id}')">
                            <i class="bi ${isClockedIn ? 'bi-box-arrow-left' : 'bi-box-arrow-in-right'} me-1"></i>
                            ${isClockedIn ? 'Clock Out' : 'Clock In'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    toggleClockIn(staffId) {
        window.soundFx.playClick();
        const staff = window.erpStore.getStaff();
        const member = staff.find(s => s.id === staffId);
        if (member) {
            if (member.status === 'Clocked In') {
                member.status = 'Clocked Out';
                member.clockedInAt = null;
                window.app.showToast(`${member.name} clocked out.`, 'info');
            } else {
                member.status = 'Clocked In';
                member.clockedInAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                window.app.showToast(`${member.name} clocked in!`, 'success');
            }
            window.erpStore.saveStaff(staff);
        }
    }

    addNewStaff(formData) {
        const staff = window.erpStore.getStaff();
        const newId = 'STF-' + String(staff.length + 1).padStart(2, '0');

        staff.push({
            id: newId,
            name: formData.name,
            role: formData.role,
            shift: formData.shift,
            wagePerHour: parseFloat(formData.wage),
            status: 'Clocked In',
            clockedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            phone: formData.phone || '+1 (555) 000-0000'
        });

        window.erpStore.saveStaff(staff);
        window.soundFx.playChime();
        window.app.showToast(`Welcomed ${formData.name} to the team!`, 'success');

        const modalEl = document.getElementById('newStaffModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
}

window.staff = new StaffController();
