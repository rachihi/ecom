export const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string) => {
    return /^(0[3|5|7|8|9])+([0-9]{8})\b/.test(phone);
};
