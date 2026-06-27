interface TokenPayload {
    nameid?: string;
    sub?: string;
    [key: string]: any;
}
export const getUserIdFromToken = () => {
    const token = localStorage.getItem('tunevault_token');
    if (!token) return null;
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64)) as TokenPayload;
        return decodedPayload.nameid || decodedPayload.sub;
    } catch {
        return null;
    }
};