export function handleApiError(error: any, fallbackMessage: string = 'Đã có lỗi xảy ra!') {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
        return; 
    }
    const message = error.response?.data?.message 
                 || error.response?.data 
                 || error.message 
                 || fallbackMessage;
    alert(String(message));
}