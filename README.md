# Ứng dụng truyền phát nhạc TuneVault

TuneVault là một ứng dụng truyền phát nhạc full-stack được thiết kế để cung cấp cho người dùng trải nghiệm phong phú để khám phá, phát và quản lý các bản nhạc yêu thích của họ. Ứng dụng này có tính năng xác thực người dùng, phát nhạc, quản lý danh sách phát, duyệt album/nghệ sĩ, tải lên phương tiện, khả năng chia sẻ, thông báo theo thời gian thực và hệ thống yêu thích toàn diện cho các bài hát, album và danh sách phát.

## Tính năng

*   **Xác thực người dùng:** Đăng nhập, đăng ký và quản lý hồ sơ an toàn.
*   **Phát nhạc & video:** Phát liền mạch các mục phương tiện âm thanh và video.
*   **Quản lý danh sách phát:** Người dùng có thể tạo, xem và quản lý danh sách phát tùy chỉnh của mình, thêm hoặc xóa các bản nhạc theo ý muốn.
*   **Duyệt album & nghệ sĩ:** Khám phá nhạc được sắp xếp theo album và nghệ sĩ.
*   **Tải lên phương tiện:** Các nghệ sĩ và quản trị viên có khả năng tải lên nhạc và video mới lên nền tảng.
*   **Chia sẻ phương tiện:** Chia sẻ bài hát và danh sách phát với những người dùng khác.
*   **Thông báo theo thời gian thực:** Luôn cập nhật các tương tác và cập nhật theo thời gian thực qua SignalR.
*   **Hệ thống yêu thích:** Đánh dấu các bài hát, album và danh sách phát yêu thích của bạn để truy cập nhanh.
*   **Công cụ quản trị:** Quản lý vai trò người dùng và các tác vụ quản trị khác.

## Công nghệ được sử dụng

### Backend
*   **ASP.NET Core Web API (C#):** Xây dựng các API mạnh mẽ và có khả năng mở rộng.
*   **Entity Framework Core:** Công cụ ánh xạ quan hệ đối tượng để tương tác cơ sở dữ liệu liền mạch.
*   **MySQL:** Cơ sở dữ liệu quan hệ để lưu trữ dữ liệu.
*   **SignalR:** Cho phép giao tiếp theo thời gian thực cho các thông báo.
*   **Xác thực JWT:** Xác thực dựa trên mã thông báo an toàn để truy cập API.

### Frontend
*   **React:** Thư viện JavaScript dựa trên thành phần, khai báo để xây dựng giao diện người dùng.
*   **TypeScript:** Nâng cao chất lượng và khả năng bảo trì mã với kiểu tĩnh.
*   **Vite:** Công cụ xây dựng nhanh cho các dự án web hiện đại.
*   **Zustand:** Giải pháp quản lý trạng thái nhỏ, nhanh và có khả năng mở rộng.
*   **Axios:** Máy khách HTTP dựa trên Promise cho trình duyệt và Node.js.
*   **Tailwind CSS:** Khung CSS ưu tiên tiện ích để xây dựng nhanh chóng các thiết kế tùy chỉnh.
*   **Lucide React:** Bộ công cụ biểu tượng đẹp và nhất quán.

## Hướng dẫn cài đặt

Làm theo các bước sau để thiết lập và chạy ứng dụng TuneVault trên máy cục bộ của bạn.

### Điều kiện tiên quyết

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt các công cụ sau:
*   [.NET SDK](https://dotnet.microsoft.com/download) (Phiên bản 8.0 trở lên được khuyến nghị)
*   [Node.js](https://nodejs.org/en/download/) (Phiên bản LTS được khuyến nghị)
*   [MySQL Server](https://dev.mysql.com/downloads/mysql/)
*   [Git](https://git-scm.com/downloads)

### 1. Sao chép kho lưu trữ

```bash
git clone https://github.com/your-username/ProjectCsharp.git # Thay thế bằng URL kho lưu trữ thực tế của bạn
cd ProjectCsharp
```

### 2. Thiết lập cơ sở dữ liệu

TuneVault sử dụng MySQL. Bạn cần cấu hình chuỗi kết nối và áp dụng các di chuyển.

#### a. Cấu hình kết nối cơ sở dữ liệu

Mở `Backend/appsettings.json` và đảm bảo chuỗi kết nối MySQL của bạn được cấu hình chính xác. Cài đặt mặc định là:

```json
{
  "ConnectionStrings": {
    "SpotifyDb": "Server=localhost;Port=3306;Database=spotify;User Id=root;Password=123;Allow User Variables=true;"
  },
  // ... các cài đặt khác
}
```
Nếu máy chủ MySQL của bạn chạy trên một cổng khác, có ID người dùng hoặc mật khẩu khác, hãy cập nhật các giá trị này cho phù hợp.

#### b. Áp dụng các di chuyển cơ sở dữ liệu

Điều hướng đến thư mục `Backend` và áp dụng các di chuyển Entity Framework Core để tạo các bảng cần thiết:

```bash
cd Backend
dotnet ef database update --context TuneVaultDbContext -p Backend.csproj
cd .. # Quay lại thư mục gốc của dự án
```

#### c. Gieo dữ liệu ban đầu (Tùy chọn nhưng được khuyến nghị)

Nếu đây là một thiết lập mới và bạn muốn điền dữ liệu mẫu vào cơ sở dữ liệu của mình, hãy sử dụng tập lệnh `seed_data.sql` tôi đã tạo:

1.  Đảm bảo máy chủ MySQL của bạn đang chạy.
2.  Mở dòng lệnh hoặc thiết bị đầu cuối của bạn.
3.  Điều hướng đến thư mục gốc của dự án (`ProjectCsharp`).
4.  Thực thi tập lệnh `seed_data.sql` bằng ứng dụng khách MySQL. Thay thế `root` bằng tên người dùng MySQL của bạn và `123` bằng mật khẩu MySQL của bạn nếu chúng khác với tệp `appsettings.json`.

    ```bash
    mysql -u root -p spotify < seed_data.sql
    ```
    Bạn sẽ được nhắc nhập mật khẩu MySQL của mình (mặc định là `123` từ `appsettings.json`).

    *Nếu lệnh `mysql` không được nhận dạng, bạn có thể cần sử dụng đường dẫn đầy đủ đến tệp thực thi `mysql.exe` của mình (ví dụ: `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p spotify < seed_data.sql`) hoặc thêm MySQL vào biến môi trường PATH của hệ thống của bạn.*

### 3. Thiết lập và chạy Backend

1.  Điều hướng đến thư mục `Backend`:
    ```bash
    cd Backend
    ```
2.  Khôi phục các gói NuGet:
    ```bash
    dotnet restore
    ```
3.  Xây dựng dự án:
    ```bash
    dotnet build
    ```
4.  Chạy ứng dụng backend:
    ```bash
    dotnet run
    ```
    API backend thường sẽ chạy trên `https://localhost:7000` (hoặc `http://localhost:5000`).

### 4. Thiết lập và chạy Frontend

1.  Mở một terminal mới và điều hướng đến thư mục `Frontend`:
    ```bash
    cd Frontend
    ```
2.  Cài đặt các phụ thuộc npm:
    ```bash
    npm install
    ```
3.  Khởi động máy chủ phát triển frontend:
    ```bash
    npm run dev
    ```
    Ứng dụng frontend thường sẽ mở trong trình duyệt của bạn tại `http://localhost:5173`.

## Cấu trúc dự án

*   `Backend/`: Chứa dự án ASP.NET Core Web API.
    *   `Controllers/`: Các điểm cuối API.
    *   `Domain/`: Các mô hình thực thể và logic nghiệp vụ.
    *   `Infrastructure/`: Ngữ cảnh cơ sở dữ liệu và kho lưu trữ.
    *   `Migrations/`: Các di chuyển cơ sở dữ liệu Entity Framework Core.
    *   `Services/`: Các dịch vụ ứng dụng.
    *   `appsettings.json`: Cấu hình backend.
*   `Frontend/`: Chứa ứng dụng React/TypeScript.
    *   `public/`: Các tài sản tĩnh.
    *   `src/`: Các thành phần React, quản lý trạng thái (Zustand), dịch vụ.
        *   `features/`: Các mô-đun dành riêng cho tính năng (ví dụ: `auth`, `library`, `album`).
        *   `components/`: Các thành phần UI có thể tái sử dụng.
        *   `store/`: Các kho Zustand để quản lý trạng thái toàn cầu.
        *   `services/api/`: Tương tác máy khách API.
        *   `utils/`: Các hàm tiện ích.
    *   `package.json`: Các phụ thuộc và tập lệnh frontend.
*   `storage/`: Thư mục cho các tệp phương tiện (âm thanh, video, hình ảnh).
*   `TuneVault.sql`: Lược đồ cơ sở dữ liệu gốc và dữ liệu mẫu.
*   `seed_data.sql`: Các câu lệnh INSERT được trích xuất để gieo dữ liệu sau khi di chuyển.

## Đóng góp

Mọi đóng góp đều được hoan nghênh!.

