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