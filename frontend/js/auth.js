// Lấy các element từ DOM
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');

// 1. Lắng nghe sự kiện submit form đăng nhập
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault(); // Chặn hành vi load lại trang mặc định

        const usernameValue = document.getElementById('username').value.trim();
        const passwordValue = document.getElementById('password').value.trim();

        // Đổi nút thành trạng thái đang tải
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'Đang xử lý...';
        submitBtn.disabled = true;

        try {
            // 2. Gọi API Đăng nhập từ Backend
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usernameValue,
                    password: passwordValue
                })
            });

            const data = await response.json();

            // 3. Xử lý kết quả trả về từ Server
            if (response.ok && data.success) {
                // Đăng nhập thành công: Lưu Token và thông tin User
                localStorage.setItem('token', data.token); // Lưu chiếc "thẻ từ" JWT
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                // 4. Phân quyền và Điều hướng (Redirect)
                switch (data.user.roleId) {
                    case 1:
                        window.location.href = 'admin.html';
                        break;
                    case 2:
                        window.location.href = 'manager.html';
                        break;
                    case 3:
                        window.location.href = 'driver.html';
                        break;
                    case 4:
                        window.location.href = 'customer.html';
                        break;
                    default:
                        errorMessage.textContent = 'Quyền truy cập không hợp lệ!';
                        submitBtn.innerText = originalBtnText;
                        submitBtn.disabled = false;
                }
            } else {
                // Đăng nhập thất bại (Sai pass, tài khoản không tồn tại...)
                errorMessage.textContent = data.message || 'Sai tên đăng nhập hoặc mật khẩu!';
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            errorMessage.textContent = 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại Backend!';
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// 5. Hàm bảo vệ Route (Kiểm tra Token và Quyền)
function checkAuth(requiredRoleId) {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('currentUser');

    // Nếu không có Token hoặc không có thông tin User -> Chưa đăng nhập
    if (!token || !userJson) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userJson);

    // Nếu sai Role (ví dụ Khách hàng cố vào trang Admin)
    if (user.roleId !== requiredRoleId) {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = 'index.html'; // Đẩy về trang đăng nhập
    }
}

// 6. Hàm Đăng xuất dùng chung
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}