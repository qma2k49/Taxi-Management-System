const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

// Khởi tạo app Express
const app = express();
app.use(cors());
app.use(express.json()); // Để đọc được dữ liệu JSON gửi lên từ Frontend

// Import các file định tuyến API
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const fareRoutes = require('./routes/fare');

// Gắn tiền tố '/api/auth' cho các route bên trong file auth.js
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fare', fareRoutes);


// Khởi tạo HTTP server và nhúng Socket.io vào
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép mọi Frontend kết nối tới
        methods: ["GET", "POST"]
    }
});

// Import kết nối Database (để chắc chắn DB chạy trước khi server nhận request)
require('./dbConfig');

// Thiết lập kênh giao tiếp Real-time (Socket.io)
io.on('connection', (socket) => {
    console.log(`📡 Một thiết bị vừa kết nối (ID: ${socket.id})`);

    // Lắng nghe sự kiện Khách hàng đặt xe
    socket.on('customer_book_ride', (orderData) => {
        console.log('Khách hàng vừa đặt xe:', orderData);

        // Phát sóng (Broadcast) cuốc xe này tới TẤT CẢ màn hình Tài xế đang online
        io.emit('new_ride_request', orderData);
    });

    // Lắng nghe sự kiện Tài xế nhận cuốc
    socket.on('driver_accept_ride', (acceptData) => {
        console.log(`Tài xế ${acceptData.driverName} đã nhận cuốc: ${acceptData.orderId}`);

        // Báo tin vui ngược lại cho TẤT CẢ mọi người (đặc biệt là Khách hàng)
        io.emit('ride_accepted_success', acceptData);
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Thiết bị đã ngắt kết nối (ID: ${socket.id})`);
    });
});

// Chạy server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server Backend đang chạy tại http://localhost:${PORT}`);
});