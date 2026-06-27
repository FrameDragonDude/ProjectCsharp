import axios from 'axios';

const axiosClient = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
	headers: {
		'Content-Type': 'application/json',
	},
});

axiosClient.interceptors.request.use((config) => {
	const token = localStorage.getItem('tunevault_token');

	if (token && config.headers) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            alert('Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập!');
            
            localStorage.removeItem('tunevault_token');
            
            // Đá người dùng văng ra trang Login (chỉ bật dòng dưới nếu bạn muốn ép buộc)
            // window.location.href = '/login'; 
        }

        else if (error.response?.status === 403) {
            const message = error.response.data?.message || 'Bạn không có quyền thực hiện hành động này!';
            alert(`🚫 Từ chối truy cập: ${message}`);
        }

        else if (error.response?.status === 404) {
            console.error('Không tìm thấy dữ liệu (404 Not Found).');
        }

        return Promise.reject(error);
    }
);
export default axiosClient;
