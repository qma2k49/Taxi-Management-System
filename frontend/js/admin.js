// Bảo vệ trang: Chỉ Role 1 (Admin) mới được vào
checkAuth(1);

// Hiển thị tên Admin
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (currentUser) document.getElementById('admin-name').innerText = currentUser.fullName;

// ==========================================
// 1. LẤY VÀ HIỂN THỊ DANH SÁCH USER
// ==========================================
async function fetchUsers() {
    try {
        const response = await fetch('http://localhost:3000/api/users');
        const data = await response.json();

        if (data.success) {
            renderTable(data.data);
        }
    } catch (error) {
        console.error('Lỗi lấy dữ liệu:', error);
        document.getElementById('user-table-body').innerHTML = `<tr><td colspan="7">Lỗi kết nối máy chủ!</td></tr>`;
    }
}

function renderTable(users) {
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = ''; // Xóa chữ "Đang tải"

    users.forEach(user => {
        const statusBadge = user.IsActive
            ? `<span class="badge active">Hoạt động</span>`
            : `<span class="badge locked">Bị khóa</span>`;

        const toggleBtnText = user.IsActive ? 'Khóa' : 'Mở khóa';
        const newStatus = user.IsActive ? 0 : 1;

        const row = `
            <tr>
                <td>#${user.UserID}</td>
                <td><strong>${user.Username}</strong></td>
                <td>${user.FullName}</td>
                <td>${user.Phone || '---'}</td>
                <td>${user.RoleName}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-sm btn-warning" onclick="toggleUserStatus(${user.UserID}, ${newStatus})">
                        ${toggleBtnText}
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Gọi hàm lấy dữ liệu ngay khi mở trang
fetchUsers();

// ==========================================
// 2. KHÓA / MỞ KHÓA TÀI KHOẢN
// ==========================================
async function toggleUserStatus(userId, newStatus) {
    if (!confirm('Bạn có chắc chắn muốn thay đổi trạng thái tài khoản này?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/users/toggle-status/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: newStatus })
        });

        const data = await response.json();
        if (data.success) {
            fetchUsers(); // Tải lại bảng
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối máy chủ!');
    }
}

// ==========================================
// 3. XỬ LÝ FORM THÊM MỚI TÀI KHOẢN
// ==========================================
const modal = document.getElementById('addUserModal');
document.getElementById('btn-open-modal').addEventListener('click', () => modal.classList.remove('hidden'));
document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));

document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        username: document.getElementById('new-username').value,
        password: document.getElementById('new-password').value,
        fullName: document.getElementById('new-fullname').value,
        phone: document.getElementById('new-phone').value,
        roleId: parseInt(document.getElementById('new-role').value)
    };

    try {
        const response = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            alert('Thêm tài khoản thành công!');
            modal.classList.add('hidden');
            document.getElementById('addUserForm').reset();
            fetchUsers(); // Tải lại bảng để thấy user mới
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối máy chủ!');
    }
});

// ==========================================
// 4. CHUYỂN ĐỔI TAB (USERS & TAXIS)
// ==========================================
function switchTab(tab) {
    if (tab === 'users') {
        document.getElementById('section-users').classList.remove('hidden');
        document.getElementById('section-taxis').classList.add('hidden');
        document.getElementById('tab-users').classList.add('active');
        document.getElementById('tab-taxis').classList.remove('active');
        document.getElementById('main-title').innerText = 'Danh sách Người dùng';
        fetchUsers();
    } else if (tab === 'taxis') {
        document.getElementById('section-users').classList.add('hidden');
        document.getElementById('section-taxis').classList.remove('hidden');
        document.getElementById('tab-users').classList.remove('active');
        document.getElementById('tab-taxis').classList.add('active');
        document.getElementById('main-title').innerText = 'Quản lý Xe';
        fetchTaxis();
    }
}

// ==========================================
// 5. LẤY VÀ HIỂN THỊ DANH SÁCH TAXI
// ==========================================
async function fetchTaxis() {
    try {
        const response = await fetch('http://localhost:3000/api/taxis');
        const data = await response.json();

        if (data.success) {
            renderTaxiTable(data.data);
        }
    } catch (error) {
        console.error('Lỗi lấy dữ liệu Taxi:', error);
        document.getElementById('taxi-table-body').innerHTML = `<tr><td colspan="5">Lỗi kết nối máy chủ!</td></tr>`;
    }
}

function renderTaxiTable(taxis) {
    const tbody = document.getElementById('taxi-table-body');
    tbody.innerHTML = '';

    if (taxis.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có xe nào.</td></tr>`;
        return;
    }

    taxis.forEach(taxi => {
        let statusBadge = '';
        if (taxi.Status === 'Rảnh') {
            statusBadge = `<span class="badge active">${taxi.Status}</span>`;
        } else if (taxi.Status === 'Đang bận') {
            statusBadge = `<span class="badge warning" style="background-color: #ff9800; color: white;">${taxi.Status}</span>`;
        } else {
            statusBadge = `<span class="badge locked">${taxi.Status}</span>`;
        }

        const row = `
            <tr>
                <td>#${taxi.TaxiID}</td>
                <td><strong>${taxi.LicensePlate}</strong></td>
                <td>${taxi.VehicleType}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-sm btn-danger" onclick="deleteTaxi(${taxi.TaxiID})">Xóa</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ==========================================
// 6. XỬ LÝ FORM THÊM MỚI XE
// ==========================================
const taxiModal = document.getElementById('addTaxiModal');
document.getElementById('btn-open-taxi-modal').addEventListener('click', () => taxiModal.classList.remove('hidden'));
document.getElementById('btn-close-taxi-modal').addEventListener('click', () => taxiModal.classList.add('hidden'));

document.getElementById('addTaxiForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        licensePlate: document.getElementById('new-license-plate').value,
        vehicleType: document.getElementById('new-vehicle-type').value,
        status: 'Rảnh'
    };

    try {
        const response = await fetch('http://localhost:3000/api/taxis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            alert('Thêm xe thành công!');
            taxiModal.classList.add('hidden');
            document.getElementById('addTaxiForm').reset();
            fetchTaxis();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối máy chủ!');
    }
});

// ==========================================
// 7. XÓA XE
// ==========================================
async function deleteTaxi(taxiId) {
    if (!confirm('Bạn có chắc chắn muốn xóa chiếc xe này?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/taxis/${taxiId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            fetchTaxis();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối máy chủ!');
    }
}