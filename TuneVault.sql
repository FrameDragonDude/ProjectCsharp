CREATE DATABASE IF NOT EXISTS spotify;
USE spotify;

CREATE TABLE Roles (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Name VARCHAR(50) NOT NULL UNIQUE,  
    Description VARCHAR(256) NULL
);

CREATE TABLE Permissions (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Code VARCHAR(100) NOT NULL UNIQUE, 
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(256) NULL
);

CREATE TABLE RolePermissions (
    RoleId INT NOT NULL,
    PermissionId INT NOT NULL,
    PRIMARY KEY (RoleId, PermissionId),
    CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE,
    CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES Permissions(Id) ON DELETE CASCADE
);

CREATE TABLE Users (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Username VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash TEXT NOT NULL, 
    Email VARCHAR(256) NOT NULL UNIQUE,
    RoleId INT NOT NULL,             
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE RESTRICT
);

CREATE TABLE UserProfiles (
    UserId INT PRIMARY KEY,           
    FullName VARCHAR(256) NOT NULL,
    AvatarUrl VARCHAR(512) NULL,
    Bio TEXT NULL,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_UserProfiles_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE TABLE Artists (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Name VARCHAR(256) NOT NULL,
    Bio TEXT NULL,
    AvatarUrl VARCHAR(512) NULL,
    UserId INT NOT NULL UNIQUE,        
    CONSTRAINT FK_Artists_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE TABLE Albums (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Title VARCHAR(256) NOT NULL,
    CoverImageUrl VARCHAR(512) NULL,
    ArtistId INT NOT NULL,                        
    ReleaseDate DATETIME NOT NULL,
    CONSTRAINT FK_Albums_Artists FOREIGN KEY (ArtistId) REFERENCES Artists(Id) ON DELETE CASCADE
);

CREATE TABLE MediaItems (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Title VARCHAR(256) NOT NULL,
    FilePath VARCHAR(512) NOT NULL, 
    Duration VARCHAR(10) NOT NULL, 
    MediaType VARCHAR(20) NOT NULL,        
    ArtistId INT NULL,                 
    AlbumId INT NULL,
    CoverImageUrl VARCHAR(512) NULL,
    Description LONGTEXT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_MediaItems_Artists FOREIGN KEY (ArtistId) REFERENCES Artists(Id) ON DELETE SET NULL,
    CONSTRAINT FK_MediaItems_Albums FOREIGN KEY (AlbumId) REFERENCES Albums(Id) ON DELETE SET NULL
);

CREATE TABLE Playlists (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    Name VARCHAR(256) NOT NULL,
    Description TEXT NULL,
    IsPublic TINYINT(1) NOT NULL DEFAULT 1, 
    CreatedByUserId INT NOT NULL,     
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Playlists_Users FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE TABLE PlaylistTracks (
    PlaylistId INT NOT NULL,
    MediaItemId INT NOT NULL,
    AddedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PlaylistId, MediaItemId), 
    CONSTRAINT FK_PlaylistTracks_Playlists FOREIGN KEY (PlaylistId) REFERENCES Playlists(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PlaylistTracks_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE
);

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

CREATE TABLE Notifications (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    UserId INT NOT NULL, 
    Type VARCHAR(50) NOT NULL,             
    PayloadJson TEXT NOT NULL, 
    IsRead TINYINT(1) NOT NULL DEFAULT 0, 
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE TABLE Favorites (
    UserId INT NOT NULL,
    MediaItemId INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserId, MediaItemId),
    CONSTRAINT FK_Favorites_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_Favorites_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE
);

CREATE TABLE PlayHistories (
    Id INT PRIMARY KEY AUTO_INCREMENT, 
    UserId INT NOT NULL,
    MediaItemId INT NOT NULL,
    PlayedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_PlayHistories_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PlayHistories_MediaItems FOREIGN KEY (MediaItemId) REFERENCES MediaItems(Id) ON DELETE CASCADE
);

CREATE TABLE Follows (
    FollowerId INT NOT NULL, 
    TargetId INT NOT NULL,   
    TargetType VARCHAR(20) NOT NULL,       
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (FollowerId, TargetId, TargetType),
    CONSTRAINT FK_Follows_Users FOREIGN KEY (FollowerId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- DỮ LIỆU MẪU HỆ THỐNG
INSERT INTO Roles (Id, Name, Description) VALUES
(1, 'Admin', 'Quản trị viên toàn quyền hệ thống'),
(2, 'Artist', 'Nghệ sĩ phát hành âm nhạc, quản lý Album'),
(3, 'User', 'Người dùng nghe nhạc cơ bản, tạo playlist');

INSERT INTO Permissions (Id, Code, Name, Description) VALUES
(1, 'PLAYLIST_CREATE', 'Tạo danh sách phát', 'Cho phép khởi tạo playlist cá nhân'),
(2, 'MEDIA_UPLOAD', 'Tải lên tài nguyên nhạc', 'Đặc quyền upload file nhạc'),
(3, 'ALBUM_MANAGE', 'Quản lý kho Album', 'Cho phép tạo và chỉnh sửa album cá nhân'),
(4, 'USER_MODERATE', 'Điều hành tài khoản', 'Quyền phê duyệt/khóa tài khoản');

INSERT INTO RolePermissions (RoleId, PermissionId) VALUES 
(3, 1), 
(2, 1), (2, 2), (2, 3), 
(1, 1), (1, 2), (1, 3), (1, 4);

INSERT INTO Users (Id, Username, PasswordHash, Email, RoleId) VALUES
(1, 'admin_sgu', '$2a$11$N9qo8uLOicGC2ZFlKOn55uNbfS/M1YI7pGep7Fv4/Uv.fG78kKeeS', 'admin@sgu.edu.vn', 1),     
(2, 'candidate_sgu', '$2a$12$SgU2026TkV19b8P8R8XFeeeYvWGeApmvHeL7N6M2x7aZfRkm8l2CqY', 'candidate@sgu.edu.vn', 3), 
(3, 'sontung_mtp', '$2a$12$SgU2026TkV19b8P8R8XFeeeYvWGeApmvHeL7N6M2x7aZfRkm8l2CqY', 'sontung@sgu.edu.vn', 2);   

INSERT INTO UserProfiles (UserId, FullName, Bio) VALUES
(1, 'Quản trị viên SGU', 'Hệ thống quản trị viên ứng dụng nhạc.'),
(2, 'Sinh viên SGU', 'Tài khoản kiểm thử chức năng sinh viên.'),
(3, 'Hồ sơ gốc Sơn Tùng', 'Tài khoản cá nhân của Nguyễn Thanh Tùng.');

INSERT INTO Artists (Id, Name, Bio, AvatarUrl, UserId) VALUES 
(1, 'Sơn Tùng M-TP', 'Nghệ sĩ nhạc Pop Việt Nam', '/storage/avatars/sontung_avatar.jpg', 3);

INSERT INTO Albums (Id, Title, ArtistId, ReleaseDate) VALUES 
(1, 'Chúng Ta Của Tương Lai', 1, '2024-03-08');

-- KHÔI PHỤC ĐẦY ĐỦ 9 DỮ LIỆU MẪU CHO MEDIAITEMSpermissions
-- Cấu trúc: Id, Title, FilePath, Duration, MediaType, ArtistId, AlbumId, CoverImageUrl
INSERT INTO MediaItems (Id, Title, FilePath, Duration, MediaType, ArtistId, AlbumId, CoverImageUrl, Description) VALUES
(1, 'Chúng Ta Của Hiện Tại', '/storage/audio/chung_ta_cua_hien_tai.mp3', '5:02', 'Audio', 1, 1, '/storage/pics/chung_ta_cua_hien_tai.jpg', 'Chúng Ta Của Hiện Tại' ), 
(2, 'Muộn Rồi Mà Sao Còn', '/storage/audio/muon_roi_ma_sao_con.mp3', '4:48', 'Audio', 1, NULL, '/storage/pics/muon_roi_ma_sao_con.jpg', 'Muộn Rồi Mà Sao Còn'), 
(3, 'Chúng Ta Của Tương Lai', '/storage/audio/chung_ta_cua_tuong_lai.mp4', '4:15', 'Video', 1, 1, '/storage/pics/chung_ta_cua_tuong_lai.jpg', 'Chúng Ta Của Tương Lai'),
(4, 'Lạc Trôi', '/storage/audio/lac_troi.mp3', '3:52', 'Audio', 1, NULL, '/storage/pics/lac_troi.jpg', 'Lạc Trôi'),
(5, 'Hãy Trao Cho Anh', '/storage/audio/hay_trao_cho_anh.mp3', '4:05', 'Audio', 1, NULL, '/storage/pics/hay_trao_cho_anh.jpg', 'Hãy Trao Cho Anh'),
(6, 'Chạy Ngay Đi', '/storage/audio/chay_ngay_di.mp3', '4:00', 'Audio', 1, NULL, '/storage/pics/chay_ngay_di.jpg', 'Chạy Ngay Đi'),
(7, 'Nơi Này Có Anh', '/storage/audio/noi_nay_co_anh.mp3', '4:20', 'Audio', 1, NULL, '/storage/pics/noi_nay_co_anh.jpg', 'Nơi Này Có Anh'),
(8, 'Âm Thầm Bên Em', '/storage/audio/am_tham_ben_em.mp3', '4:53', 'Audio', 1, NULL, '/storage/pics/am_tham_ben_em.jpg', 'Âm Thầm Bên Em'),
(9, 'Cơn Mưa Ngang Qua', '/storage/audio/con_mua_ngang_qua.mp3', '3:51', 'Audio', 1, NULL, '/storage/pics/con_mua_ngang_qua.jpg', 'Cơn Mưa Ngang Qua'),
(10, 'Chắc Ai Đó Sẽ Về', '/storage/audio/chac_ai_do_se_ve.mp4', '5:15', 'Video', 1, NULL, '/storage/pics/chac_ai_do_se_ve.jpg', 'Chắc Ai Đó Sẽ Về'),
(11, 'Buông Đôi Tay Nhau Ra', '/storage/audio/buong_doi_tay_nhau_ra.mp4', '4:49', 'Video', 1, NULL, '/storage/pics/buong_doi_tay_nhau_ra.jpg', 'Buông Đôi Tay Nhau Ra');

INSERT INTO Playlists (Id, Name, Description, CreatedByUserId) VALUES
(1, 'Nhạc Chill Cuối Tuần', 'Danh sách phát nhạc thư giãn', 1),
(2, 'Video Clip Đặc Sắc', 'Tuyển tập video chất lượng cao', 2);

INSERT INTO PlaylistTracks (PlaylistId, MediaItemId) VALUES
(1, 1), (1, 2), (2, 9);

INSERT INTO PlayHistories (Id, UserId, MediaItemId, PlayedAt) VALUES
(1, 2, 1, DATE_SUB(NOW(), INTERVAL 1 HOUR)), 
(2, 2, 2, DATE_SUB(NOW(), INTERVAL 45 MINUTE));

INSERT INTO Follows (FollowerId, TargetId, TargetType) VALUES
(2, 1, 'Artist'),
(1, 2, 'User');

INSERT INTO Favorites (UserId, MediaItemId) VALUES
(2, 1), (1, 2);

INSERT INTO Notifications (Id, UserId, Type, PayloadJson, IsRead) VALUES
(1, 2, 'Share', '{"SenderName": "admin_sgu", "MediaTitle": "Video Live Concert SGU", "Url": "/share-inbox"}', 0);