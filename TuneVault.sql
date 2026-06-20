CREATE DATABASE IF NOT EXISTS spotify;
USE spotify;


-- 1. Bảng Vai trò (Roles)
CREATE TABLE Roles (
    Id INT PRIMARY KEY AUTO_INCREMENT, -- Số tự nhiên tự tăng
    Name VARCHAR(50) NOT NULL UNIQUE,  -- 'Admin', 'Artist', 'User'
    Description VARCHAR(256) NULL
);

-- 2. Bảng Danh mục Hành động độc lập (Permissions)
CREATE TABLE Permissions (
    Id INT PRIMARY KEY AUTO_INCREMENT, -- Số tự nhiên tự tăng
    Code VARCHAR(100) NOT NULL UNIQUE, -- Mã định danh hành động (Ví dụ: 'MEDIA_UPLOAD')
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(256) NULL
);

-- 3. Bảng trung gian liên kết Vai trò và Hành động (RolePermissions)
CREATE TABLE RolePermissions (
    RoleId INT NOT NULL,
    PermissionId INT NOT NULL,
    PRIMARY KEY (RoleId, PermissionId),
    CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE,
    CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES Permissions(Id) ON DELETE CASCADE
);

-- 4. Bảng Người dùng (Tài khoản lõi)
CREATE TABLE Users (
    Id INT PRIMARY KEY AUTO_INCREMENT, -- Đăng ký mới sẽ tự tăng lên 4, 5, 6...
    Username VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash TEXT NOT NULL, 
    Email VARCHAR(256) NOT NULL UNIQUE,
    RoleId INT NOT NULL,             
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE RESTRICT
);

-- 5. Bảng Hồ sơ chi tiết người dùng (Quan hệ mở rộng 1-1 từ Users)
CREATE TABLE UserProfiles (
    UserId INT PRIMARY KEY,           -- Lấy đúng số Id từ bảng Users sang, không để tự tăng độc lập
    FullName VARCHAR(256) NOT NULL,
    AvatarUrl VARCHAR(512) NULL,
    Bio TEXT NULL,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_UserProfiles_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 6. Bảng Nghệ sĩ (Bảng hồ sơ nghệ thuật, ĐỒNG BỘ ID 1-1 TỪ USERS)
CREATE TABLE Artists (
    Id INT PRIMARY KEY,               -- Nhận đúng số Id từ bên Users sang khi được duyệt nâng cấp
    Name VARCHAR(256) NOT NULL,
    Bio TEXT NULL,
    AvatarUrl VARCHAR(512) NULL,
    CONSTRAINT FK_Artists_Users FOREIGN KEY (Id) REFERENCES Users(Id) ON DELETE CASCADE
);


-- 7. Bảng Album
CREATE TABLE Albums (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Title VARCHAR(256) NOT NULL,
    CoverImageUrl VARCHAR(512) NULL,
    ArtistId INT NOT NULL,            
    ReleaseDate DATETIME NOT NULL,
    CONSTRAINT FK_Albums_Artists FOREIGN KEY (ArtistId) REFERENCES Artists(Id) ON DELETE CASCADE
);

-- 8. Bảng Tệp tin Media (Audio / Video)
CREATE TABLE MediaItems (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Title VARCHAR(256) NOT NULL,
    FilePath VARCHAR(512) NOT NULL, 
    Duration VARCHAR(10) NOT NULL, 
    MediaType VARCHAR(20) NOT NULL,        
    OwnerId INT NOT NULL,             
    AlbumId INT NULL,
    CoverImageUrl VARCHAR(512) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_MediaItems_Users FOREIGN KEY (OwnerId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MediaItems_Albums FOREIGN KEY (AlbumId) REFERENCES Albums(Id) ON DELETE SET NULL
);

-- 9. Bảng Danh sách phát (Playlist)
CREATE TABLE Playlists (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Name VARCHAR(256) NOT NULL,
    Description TEXT NULL,
    IsPublic TINYINT(1) NOT NULL DEFAULT 1, 
    CreatedByUserId INT NOT NULL,     
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Playlists_Users FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 10. Bảng trung gian liên kết Playlist và Bài hát
CREATE TABLE PlaylistTracks (
    PlaylistId INT NOT NULL,
    MediaItemId INT NOT NULL,
    AddedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PlaylistId, MediaItemId), 
    CONSTRAINT FK_PlaylistTracks_Playlists FOREIGN KEY (PlaylistId) REFERENCES Playlists(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PlaylistTracks_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE
);

-- 11. Bảng Quản lý chia sẻ Media
CREATE TABLE MediaShares (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    SenderUserId INT NOT NULL,
    ReceiverUserId INT NOT NULL,
    MediaItemId INT NULL, 
    PlaylistId INT NULL, 
    SharedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_MediaShares_Sender FOREIGN KEY (SenderUserId) REFERENCES Users(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_MediaShares_Receiver FOREIGN KEY (ReceiverUserId) REFERENCES Users(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_MediaShares_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MediaShares_Playlists FOREIGN KEY (PlaylistId) REFERENCES Playlists(Id) ON DELETE CASCADE
);

-- 12. Bảng Quản lý Thông báo Real-time
CREATE TABLE Notifications (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    UserId INT NOT NULL, 
    Type VARCHAR(50) NOT NULL,             
    PayloadJson TEXT NOT NULL, 
    IsRead TINYINT(1) NOT NULL DEFAULT 0, 
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 13. Bảng Yêu thích
CREATE TABLE Favorites (
    UserId INT NOT NULL,
    MediaItemId INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserId, MediaItemId),
    CONSTRAINT FK_Favorites_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_Favorites_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE
);

-- 14. Bảng Lịch sử nghe nhạc
CREATE TABLE PlayHistories (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    UserId INT NOT NULL,
    MediaItemId INT NOT NULL,
    PlayedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_PlayHistories_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PlayHistories_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE
);

-- 15. Bảng Theo dõi
CREATE TABLE Follows (
    FollowerId INT NOT NULL, 
    TargetId INT NOT NULL,   
    TargetType VARCHAR(20) NOT NULL,       
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (FollowerId, TargetId, TargetType),
    CONSTRAINT FK_Follows_Users FOREIGN KEY (FollowerId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 1. Nạp danh mục Vai trò (Roles)
INSERT INTO Roles (Id, Name, Description) VALUES
(1, 'Admin', 'Quản trị viên toàn quyền hệ thống'),
(2, 'Artist', 'Nghệ sĩ phát hành âm nhạc, quản lý Album'),
(3, 'User', 'Người dùng nghe nhạc cơ bản, tạo playlist');

-- 2. Nạp danh mục Hành động cụ thể (Permissions)
INSERT INTO Permissions (Id, Code, Name, Description) VALUES
(1, 'PLAYLIST_CREATE', 'Tạo danh sách phát', 'Cho phép khởi tạo playlist cá nhân'),
(2, 'MEDIA_UPLOAD', 'Tải lên tài nguyên nhạc', 'Đặc quyền upload file nhạc'),
(3, 'ALBUM_MANAGE', 'Quản lý kho Album', 'Cho phép tạo và chỉnh sửa album cá nhân'),
(4, 'USER_MODERATE', 'Điều hành tài khoản', 'Quyền phê duyệt/khóa tài khoản');

-- 3. Gán quyền chi tiết vào các Vai trò (RolePermissions)
INSERT INTO RolePermissions (RoleId, PermissionId) VALUES 
(3, 1), -- Nhóm USER (3) được Tạo Playlist (1)
(2, 1), (2, 2), (2, 3), -- Nhóm ARTIST (2) được Tạo Playlist, Tải nhạc, Quản lý Album
(1, 1), (1, 2), (1, 3), (1, 4); -- Nhóm ADMIN (1) hốt trọn bộ tất cả các quyền

-- 4. Chèn tài khoản lõi (Users)
INSERT INTO Users (Id, Username, PasswordHash, Email, RoleId) VALUES
(1, 'admin_sgu', '$2a$11$N9qo8uLOicGC2ZFlKOn55uNbfS/M1YI7pGep7Fv4/Uv.fG78kKeeS', 'admin@sgu.edu.vn', 1),     -- Admin sở hữu Id số 1
(2, 'candidate_sgu', '$2a$12$SgU2026TkV19b8P8R8XFeeeYvWGeApmvHeL7N6M2x7aZfRkm8l2CqY', 'candidate@sgu.edu.vn', 3), -- User sở hữu Id số 2
(3, 'sontung_mtp', '$2a$12$SgU2026TkV19b8P8R8XFeeeYvWGeApmvHeL7N6M2x7aZfRkm8l2CqY', 'sontung@sgu.edu.vn', 2);   -- Artist sở hữu Id số 3

-- 5. Chèn hồ sơ tài khoản tương ứng (UserProfiles)
INSERT INTO UserProfiles (UserId, FullName, Bio) VALUES
(1, 'Quản trị viên SGU', 'Hệ thống quản trị viên ứng dụng nhạc.'),
(2, 'Sinh viên SGU', 'Tài khoản kiểm thử chức năng sinh viên.'),
(3, 'Hồ sơ gốc Sơn Tùng', 'Tài khoản cá nhân của Nguyễn Thanh Tùng.');

-- 6. Chèn Hồ sơ Nghệ sĩ (Id phải dùng đúng số 3 để ăn khớp 1-1 với tài khoản Users của Sơn Tùng)
INSERT INTO Artists (Id, Name, Bio, AvatarUrl) VALUES 
(3, 'Sơn Tùng M-TP', 'Nghệ sĩ nhạc Pop Việt Nam', '/storage/avatars/sontung_avatar.jpg');

-- 7. Chèn Album mẫu của Nghệ sĩ
INSERT INTO Albums (Id, Title, ArtistId, ReleaseDate) VALUES 
(1, 'Chúng Ta Của Tương Lai', 3, '2024-03-08');

-- 8. Chèn danh sách các bài hát (Mọi ID đều là số tự nhiên gõ tay trực tiếp)
INSERT INTO MediaItems (Id, Title, FilePath, Duration, MediaType, OwnerId, AlbumId, CoverImageUrl) VALUES
(1, 'Chúng Ta Của Hiện Tại', '/storage/audio/chung_ta_cua_hien_tai.mp3', '5:02', 'Audio', 3, 1, '/storage/pics/chung_ta_cua_hien_tai.jpg'),
(2, 'Muộn Rồi Mà Sao Còn', '/storage/audio/muon_roi_ma_sao_con.mp3', '4:48', 'Audio', 3, NULL, '/storage/pics/muon_roi_ma_sao_con.jpg'),
(3, 'Video Live Concert SGU', '/storage/video/sgu_concert.mp4', '10:00', 'Video', 1, NULL, NULL),
(4, 'Nơi Này Có Anh', '/storage/audio/noi_nay_co_anh.mp3', '4:38', 'Audio', 3, NULL, '/storage/pics/noi_nay_co_anh.jpg'),
(5, 'Lạc Trôi', '/storage/audio/lac_troi.mp3', '4:32', 'Audio', 3, NULL, '/storage/pics/lac_troi.jpg'),
(6, 'Hãy Trao Cho Anh', '/storage/audio/hay_trao_cho_anh.mp3', '4:22', 'Audio', 3, NULL, '/storage/pics/hay_trao_cho_anh.jpg'),
(7, 'Chạy Ngay Đi', '/storage/audio/chay_ngay_di.mp3', '4:33', 'Audio', 3, NULL, '/storage/pics/chay_ngay_di.jpg'),
(8, 'Chúng Ta Của Tương Lai', '/storage/video/chung_ta_cua_tuong_lai.mp4', '4:36', 'Video', 3, 1, NULL),
(9, 'Âm Thầm Bên Em', '/storage/audio/am_tham_ben_em.mp3', '4:53', 'Audio', 3, NULL, '/storage/pics/am_tham_ben_em.jpg'),
(10, 'Cơn Mưa Ngang Qua', '/storage/audio/con_mua_ngang_qua.mp3', '3:51', 'Audio', 3, NULL, '/storage/pics/con_mua_ngang_qua.jpg');
    
-- 9. Chèn 2 Playlist mẫu
INSERT INTO Playlists (Id, Name, Description, CreatedByUserId) VALUES
(1, 'Nhạc Chill Cuối Tuần', 'Danh sách phát nhạc thư giãn', 1),
(2, 'Video Clip Đặc Sắc', 'Tuyển tập video chất lượng cao', 2);

-- 10. Gán bài hát vào Playlist (Bảng trung gian)
INSERT INTO PlaylistTracks (PlaylistId, MediaItemId) VALUES
(1, 1), (1, 2), (2, 3);

-- 11. Giả lập Lịch sử nghe nhạc
INSERT INTO PlayHistories (Id, UserId, MediaItemId, PlayedAt) VALUES
(1, 2, 1, DATE_SUB(NOW(), INTERVAL 1 HOUR)), 
(2, 2, 2, DATE_SUB(NOW(), INTERVAL 45 MINUTE));

-- 12. Mạng xã hội âm nhạc (Theo dõi nghệ sĩ)
INSERT INTO Follows (FollowerId, TargetId, TargetType) VALUES
(2, 3, 'Artist'),
(1, 2, 'User');

-- 13. Đánh dấu yêu thích bài hát
INSERT INTO Favorites (UserId, MediaItemId) VALUES
(2, 1), (1, 2);

-- 14. Hộp thư thông báo real-time
INSERT INTO Notifications (Id, UserId, Type, PayloadJson, IsRead) VALUES
(1, 2, 'Share', '{"SenderName": "admin_sgu", "MediaTitle": "Video Live Concert SGU", "Url": "/share-inbox"}', 0);