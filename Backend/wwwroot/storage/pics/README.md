Folder `pics` chứa ảnh bìa được phục vụ bởi backend tại `/storage/pics/<filename>`.

Hướng dẫn nhanh để liên kết ảnh vào album trong DB:

1) Copy ảnh thực vào thư mục này (hoặc upload bằng công cụ của bạn):

   PowerShell:
   ```powershell
   Copy-Item C:\path\to\my-cover.jpg Backend\wwwroot\storage\pics\my-cover.jpg
   ```

2) Cập nhật trường `CoverImageUrl` trong bảng `Albums` (MySQL):

   ```sql
   UPDATE Albums SET CoverImageUrl = '/storage/pics/my-cover.jpg' WHERE Id = '<AlbumId>';
   ```

3) Hoặc gọi endpoint PATCH API đã thêm:

   ```http
   PATCH /api/albums/{albumId}/cover
   Content-Type: application/json

   { "coverImageUrl": "/storage/pics/my-cover.jpg" }
   ```

Ghi chú:
- Nếu backend chạy trên `http://localhost:5000`, URL đầy đủ ảnh sẽ là `http://localhost:5000/storage/pics/my-cover.jpg`.
- Sau khi copy ảnh, có thể cần refresh frontend cache hoặc rebuild nếu dùng build-time assets.
