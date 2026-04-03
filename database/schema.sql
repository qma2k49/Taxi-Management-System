-- Tạo bảng Taxis
CREATE TABLE Taxis (
    TaxiID INT IDENTITY(1,1) PRIMARY KEY,
    LicensePlate VARCHAR(50) NOT NULL UNIQUE,
    VehicleType NVARCHAR(50) NOT NULL, -- Ví dụ: 4 chỗ, 7 chỗ
    Status NVARCHAR(50) DEFAULT N'Rảnh', -- 'Rảnh', 'Đang bận', 'Bảo trì'
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Tạo bảng Orders
CREATE TABLE Orders (
    OrderID VARCHAR(50) PRIMARY KEY,
    CustomerID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    DriverID INT NULL FOREIGN KEY REFERENCES Users(UserID), -- Sẽ có giá trị khi tài xế nhận cuốc
    PickupLat FLOAT NOT NULL,
    PickupLng FLOAT NOT NULL,
    DropoffLat FLOAT NOT NULL,
    DropoffLng FLOAT NOT NULL,
    DistanceKM FLOAT NOT NULL,
    EstimatedPrice FLOAT NOT NULL,
    Status NVARCHAR(50) DEFAULT N'Đang chờ', -- 'Đang chờ', 'Đã nhận', 'Hoàn thành', 'Hủy'
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO
