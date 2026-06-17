 CREATE DATABASE IF NOT EXISTS spotify;
USE spotify;

-- 1. Bảng Người dùng (Tài khoản) 
CREATE TABLE Users (
    Id CHAR(36) PRIMARY KEY, -- Thay UNIQUEIDENTIFIER bằng CHAR(36) để lưu UUID
    Username VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash TEXT NOT NULL, -- Thay NVARCHAR(MAX) bằng TEXT
    Email VARCHAR(256) NOT NULL UNIQUE,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP -- Thay DATETIME2 và SYSUTCDATETIME()
);

-- 2. Bảng Hồ sơ chi tiết người dùng 
CREATE TABLE UserProfiles (
    UserId CHAR(36) PRIMARY KEY,
    FullName VARCHAR(256) NOT NULL,
    AvatarUrl VARCHAR(512) NULL,
    Bio TEXT NULL,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_UserProfiles_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 3. Bảng Nghệ sĩ 
CREATE TABLE Artists (
    Id CHAR(36) PRIMARY KEY,
    Name VARCHAR(256) NOT NULL,
    Bio TEXT NULL,
    AvatarUrl VARCHAR(512) NULL
);

-- 4. Bảng Album [cite: 211]
CREATE TABLE Albums (
    Id CHAR(36) PRIMARY KEY,
    Title VARCHAR(256) NOT NULL,
    CoverImageUrl VARCHAR(512) NULL,
    ArtistId CHAR(36) NOT NULL,
    ReleaseDate DATETIME NOT NULL,
    CONSTRAINT FK_Albums_Artists FOREIGN KEY (ArtistId) REFERENCES Artists(Id) ON DELETE CASCADE
);

-- 5. Bảng File Media (Audio / Video) 
CREATE TABLE MediaItems (
    Id CHAR(36) PRIMARY KEY,
    Title VARCHAR(256) NOT NULL,
    FilePath VARCHAR(512) NOT NULL, 
    Duration VARCHAR(10) NOT NULL, -- Thời lượng tính bằng phút và giây (Ví dụ: 1p30s = 1:30)
    MediaType VARCHAR(20) NOT NULL, -- 'Audio' hoặc 'Video'
    OwnerId CHAR(36) NOT NULL, 
    AlbumId CHAR(36) NULL,
    CoverImageUrl VARCHAR(512) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_MediaItems_Users FOREIGN KEY (OwnerId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MediaItems_Albums FOREIGN KEY (AlbumId) REFERENCES Albums(Id) ON DELETE SET NULL
);

-- 6. Bảng Danh sách phát (Playlist)
CREATE TABLE Playlists (
    Id CHAR(36) PRIMARY KEY,
    Name VARCHAR(256) NOT NULL,
    Description TEXT NULL,
    IsPublic TINYINT(1) NOT NULL DEFAULT 1, -- Trong MySQL, BIT hoặc TINYINT(1) đại diện cho Boolean
    CreatedByUserId CHAR(36) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Playlists_Users FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 7. Bảng trung gian liên kết Playlist và Bài hát 
CREATE TABLE PlaylistTracks (
    PlaylistId CHAR(36) NOT NULL,
    MediaItemId CHAR(36) NOT NULL,
    AddedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PlaylistId, MediaItemId), 
    CONSTRAINT FK_PlaylistTracks_Playlists FOREIGN KEY (PlaylistId) REFERENCES Playlists(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PlaylistTracks_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE
);

-- 8. Bảng Quản lý chia sẻ Media 
CREATE TABLE MediaShares (
    Id CHAR(36) PRIMARY KEY,
    SenderUserId CHAR(36) NOT NULL,
    ReceiverUserId CHAR(36) NOT NULL,
    MediaItemId CHAR(36) NULL, 
    PlaylistId CHAR(36) NULL, 
    SharedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_MediaShares_Sender FOREIGN KEY (SenderUserId) REFERENCES Users(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_MediaShares_Receiver FOREIGN KEY (ReceiverUserId) REFERENCES Users(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_MediaShares_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MediaShares_Playlists FOREIGN KEY (PlaylistId) REFERENCES Playlists(Id) ON DELETE CASCADE
);

-- 9. Bảng Quản lý Thông báo Real-time
CREATE TABLE Notifications (
    Id CHAR(36) PRIMARY KEY,
    UserId CHAR(36) NOT NULL, 
    Type VARCHAR(50) NOT NULL, -- 'Share', 'Follow', 'System'
    PayloadJson TEXT NOT NULL, 
    IsRead TINYINT(1) NOT NULL DEFAULT 0, 
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 10. Bảng Yêu thích 
CREATE TABLE Favorites (
    UserId CHAR(36) NOT NULL,
    MediaItemId CHAR(36) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserId, MediaItemId),
    CONSTRAINT FK_Favorites_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_Favorites_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE
);

-- 11. Bảng Lịch sử nghe
CREATE TABLE PlayHistories (
    Id CHAR(36) PRIMARY KEY,
    UserId CHAR(36) NOT NULL,
    MediaItemId CHAR(36) NOT NULL,
    PlayedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_PlayHistories_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PlayHistories_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE
);

-- 12. Bảng Theo dõi
CREATE TABLE Follows (
    FollowerId CHAR(36) NOT NULL, 
    TargetId CHAR(36) NOT NULL,   
    TargetType VARCHAR(20) NOT NULL,     -- 'User' hoặc 'Artist'
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (FollowerId, TargetId, TargetType),
    CONSTRAINT FK_Follows_Users FOREIGN KEY (FollowerId) REFERENCES Users(Id) ON DELETE CASCADE
);



-- Dữ liệu mẫu

-- Tạo các ID cố định dạng UUID string để thiết lập mối quan hệ
SET @UserAdmin    = '11111111-1111-1111-1111-111100000001'; -- Bảng 1 (Users): Số 01 là Admin
SET @UserCandidate= '22222222-2222-2222-2222-222200000002'; -- Bảng 1 (Users): Số 02 là Sinh viên
SET @ArtistId     = '33333333-3333-3333-3333-333300000003'; -- Bảng 3 (Artists): Số 03 là Sơn Tùng
SET @AlbumId      = '44444444-4444-4444-4444-444400000004'; -- Bảng 4 (Albums): Số 04 là Album
SET @Playlist1    = '66666666-6666-6666-6666-666600000001'; -- Bảng 6 (Playlists): Đuôi 01
SET @Playlist2    = '66666666-6666-6666-6666-666600000002'; -- Bảng 6 (Playlists): Đuôi 02


SET @Media1       = '77777777-7777-7777-7777-777700000001'; 
SET @Media2       = '77777777-7777-7777-7777-777700000002'; 
SET @Media3       = '77777777-7777-7777-7777-777700000003';

-- 1. Chèn tài khoản người dùng 

INSERT INTO Users (Id, Username, PasswordHash, Email) VALUES
(@UserAdmin, 'admin_sgu', '$2a$11$N9qo8uLOicGC2ZFlKOn55uNbfS/M1YI7pGep7Fv4/Uv.fG78kKeeS', 'admin@sgu.edu.vn'),  -- Mật khẩu: Admin@123
(@UserCandidate, 'candidate_sgu', '$2a$12$SgU2026TkV19b8P8R8XFeeeYvWGeApmvHeL7N6M2x7aZfRkm8l2CqY', 'candidate@sgu.edu.vn'); -- Mật khẩu: Student@123

-- 2. Chèn hồ sơ chi tiết
INSERT INTO UserProfiles (UserId, FullName, Bio) VALUES
(@UserAdmin, 'Quản trị viên SGU', 'Hệ thống quản trị viên ứng dụng nhạc.'),
(@UserCandidate, 'Sinh viên SGU', 'Tài khoản kiểm thử chức năng sinh viên.');

-- 3. Chèn Nghệ sĩ & Album mẫu
INSERT INTO Artists (Id, Name, Bio) VALUES 
(@ArtistId, 'Sơn Tùng M-TP', 'Nghệ sĩ nhạc Pop Việt Nam');

INSERT INTO Albums (Id, Title, ArtistId, ReleaseDate) VALUES 
(@AlbumId, 'Chúng Ta Của Tương Lai', @ArtistId, '2024-03-08');

-- 4. Chèn 10 Media Items (Trộn cả Audio và Video) 
INSERT INTO MediaItems (Id, Title, FilePath, Duration, MediaType, OwnerId, AlbumId, CoverImageUrl) VALUES
(@Media1, 'Chúng Ta Của Hiện Tại', '/storage/audio/chung_ta_cua_hien_tai.mp3', '5:02', 'Audio', @UserAdmin, @AlbumId, '/storage/pics/chung_ta_cua_hien_tai.jpg'),
(@Media2, 'Muộn Rồi Mà Sao Còn', '/storage/audio/muon_roi_ma_sao_con.mp3', '4:48', 'Audio', @UserAdmin, NULL, '/storage/pics/muon_roi_ma_sao_con.jpg'),
(@Media3, 'Video Live Concert SGU', '/storage/video/sgu_concert.mp4', '10:00', 'Video', @UserAdmin, NULL, NULL),
('77777777-7777-7777-7777-777700000004', 'Nơi Này Có Anh', '/storage/audio/noi_nay_co_anh.mp3', '4:38', 'Audio', @UserCandidate, NULL, '/storage/pics/noi_nay_co_anh.jpg'),
('77777777-7777-7777-7777-777700000005', 'Lạc Trôi', '/storage/audio/lac_troi.mp3', '4:32', 'Audio', @UserCandidate, NULL, '/storage/pics/lac_troi.jpg'),
('77777777-7777-7777-7777-777700000006', 'Hãy Trao Cho Anh', '/storage/audio/hay_trao_cho_anh.mp3', '4:22', 'Audio', @UserAdmin, NULL, '/storage/pics/hay_trao_cho_anh.jpg'),
('77777777-7777-7777-7777-777700000007', 'Chạy Ngay Đi', '/storage/audio/chay_ngay_di.mp3', '4:33', 'Audio', @UserAdmin, NULL, '/storage/pics/chay_ngay_di.jpg'),
('77777777-7777-7777-7777-777700000008', 'Chúng Ta Của Tương Lai', '/storage/video/chung_ta_cua_tuong_lai.mp4', '4:36', 'Video', @UserAdmin, @AlbumId, NULL),
('77777777-7777-7777-7777-777700000009', 'Âm Thầm Bên Em', '/storage/audio/am_tham_ben_em.mp3', '4:53', 'Audio', @UserCandidate, NULL, '/storage/pics/am_tham_ben_em.jpg'),
('77777777-7777-7777-7777-777700000010', 'Cơn Mưa Ngang Qua', '/storage/audio/con_mua_ngang_qua.mp3', '3:51', 'Audio', @UserCandidate, NULL, '/storage/pics/con_mua_ngang_qua.jpg');
    
-- 5. Chèn 2 Playlist mẫu 
INSERT INTO Playlists (Id, Name, Description, CreatedByUserId) VALUES
(@Playlist1, 'Nhạc Chill Cuối Tuần', 'Danh sách phát nhạc thư giãn', @UserAdmin),
(@Playlist2, 'Video Clip Đặc Sắc', 'Tuyển tập video chất lượng cao', @UserCandidate);

-- 6. Gán bài hát vào Playlist (Bảng trung gian)
INSERT INTO PlaylistTracks (PlaylistId, MediaItemId) VALUES
(@Playlist1, @Media1),
(@Playlist1, @Media2),
(@Playlist2, @Media3);

-- 7. Giả định User Sinh viên (candidate_sgu) đã nghe một số bài hát để AI có dữ liệu phân tích
INSERT INTO PlayHistories (Id, UserId, MediaItemId, PlayedAt) VALUES
(UUID(), @UserCandidate, @Media1, DATE_SUB(NOW(), INTERVAL 1 HOUR)), 
(UUID(), @UserCandidate, @Media2, DATE_SUB(NOW(), INTERVAL 45 MINUTE)), 
(UUID(), @UserCandidate, @Media3, DATE_SUB(NOW(), INTERVAL 30 MINUTE)), 
(UUID(), @UserCandidate, '77777777-7777-7777-7777-777700000004', DATE_SUB(NOW(), INTERVAL 15 MINUTE)), 
(UUID(), @UserCandidate, '77777777-7777-7777-7777-777700000005', DATE_SUB(NOW(), INTERVAL 5 MINUTE));

-- 8. Chèn dữ liệu mẫu cho bảng Theo dõi (Follows) - Để kiểm thử tính năng mạng xã hội âm nhạc
-- Sinh viên SGU nhấn Theo dõi Nghệ sĩ Sơn Tùng M-TP
INSERT INTO Follows (FollowerId, TargetId, TargetType) VALUES
(@UserCandidate, @ArtistId, 'Artist');

-- Quản trị viên SGU nhấn Theo dõi Sinh viên SGU (User follows User)
INSERT INTO Follows (FollowerId, TargetId, TargetType) VALUES
(@UserAdmin, @UserCandidate, 'User');

-- 9. Chèn dữ liệu mẫu cho bảng Yêu thích (Favorites) - Đánh dấu bài hát yêu thích
INSERT INTO Favorites (UserId, MediaItemId) VALUES
(@UserCandidate, @Media1),
(@UserCandidate, '77777777-7777-7777-7777-777700000005'),
(@UserAdmin, @Media2);

-- 10. Chèn dữ liệu mẫu cho bảng Thông báo (Notifications) - Để Frontend hiển thị badge số chưa đọc ngay khi vào app
INSERT INTO Notifications (Id, UserId, Type, PayloadJson, IsRead) VALUES
(
    UUID(), -- Đổi ở đây
    @UserCandidate, 
    'Share', 
    '{"SenderName": "admin_sgu", "MediaTitle": "Video Live Concert SGU", "Url": "/share-inbox"}', 
    0 
),
(
    UUID(), -- Đổi ở đây
    @UserCandidate, 
    'Follow', 
    '{"FollowerName": "admin_sgu", "Message": "đã bắt đầu theo dõi thư viện của bạn"}', 
    1 
);