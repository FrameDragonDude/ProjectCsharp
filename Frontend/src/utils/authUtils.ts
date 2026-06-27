interface TokenPayload {
    nameid?: string;
    sub?: string;
    role?: string;
    [key: string]: any;
}

export const getDecodedTokenPayload = (): TokenPayload | null => {
    const token = localStorage.getItem('tunevault_token');
    if (!token) return null;
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64)) as TokenPayload;
        return decodedPayload;
    } catch {
        return null;
    }
};

export const getUserIdFromToken = () => {
    const payload = getDecodedTokenPayload();
    return payload?.nameid || payload?.sub || null;
};

export const getUserRoleFromToken = () => {
    const payload = getDecodedTokenPayload();
    return payload?.role || null;
}
