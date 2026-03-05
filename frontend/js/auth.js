// 1. Dữ liệu giả lập (Mock Data) sao chép từ SQL Server
const mockUsers = [
    { id: 1, username: 'admin1', password: '123456', fullName: 'Quản trị viên Hệ thống', roleId: 1 },
    { id: 2, username: 'quanly_a', password: '123456', fullName: 'Điều phối viên A', roleId: 2 },
    { id: 3, username: 'taixe_hung', password: '123456', fullName: 'Trần Văn Hùng', roleId: 3 },
    { id: 4, username: 'taixe_manh', password: '123456', fullName: 'Lê Quang Mạnh', roleId: 3 },
    { id: 5, username: 'khach_hang_1', password: '123456', fullName: 'Nguyễn Thị B', roleId: 4 }
];

// Lấy các element từ DOM
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');

// 2. Lắng nghe sự kiện submit form đăng nhập
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Chặn hành vi load lại trang mặc định
        
        const userValue = document.getElementById('username').value.trim();
        const passValue = document.getElementById('password').value.trim();
        
        // 3. Kiểm tra thông tin (Thay thế cho việc gọi API xuống Backend)
        const authenticatedUser = mockUsers.find(
            user => user.username === userValue && user.password === passValue
        );
        
        if (authenticatedUser) {
            // Đăng nhập thành công: Lưu thông tin vào LocalStorage (giống như lưu Session)
            localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));
            
            // 4. Phân quyền và Điều hướng (Redirect)
            switch(authenticatedUser.roleId) {
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
            }
        } else {
            // Đăng nhập thất bại
            errorMessage.textContent = 'Sai tên đăng nhập hoặc mật khẩu!';
        }
    });
}

// 5. Hàm bảo vệ Route (Dùng cho các trang admin.html, manager.html, v.v.)
// Đoạn này sẽ được gọi ở các file HTML khác để chặn người dùng truy cập trái phép
function checkAuth(requiredRoleId) {
    const userJson = localStorage.getItem('currentUser');
    
    // Nếu chưa đăng nhập
    if (!userJson) {
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