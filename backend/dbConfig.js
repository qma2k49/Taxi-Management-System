const sql = require('mssql/msnodesqlv8');
const path = require('path');

// Ép dotenv đọc chính xác file .env nằm cùng thư mục với file dbConfig.js này
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    driver: 'ODBC Driver 17 for SQL Server',
    port: 1433,
    options: {
        encrypt: false, // Bắt buộc false nếu dùng localhost bình thường
        trustServerCertificate: true,
        trustedConnection: true // Bật tích hợp bảo mật Windows
    }
};

// Console log ra để kiểm tra xem biến môi trường đã nhận đúng chưa
console.log("Đang kết nối tới DB Server:", config.server);

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Đã kết nối thành công tới SQL Server!');
        return pool;
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối Database: ', err);
        process.exit(1);
    });

module.exports = { sql, poolPromise };