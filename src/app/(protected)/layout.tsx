"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    sub: string;
    authorities: string[];
    iat: number;
    exp: number;
}

export default function ProtectedLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');

        if (!token) {
            router.replace('/login');
            return;
        }

        try {
            const decodedToken: DecodedToken = jwtDecode(token);
            const isCashier = decodedToken.authorities.includes('CASHIER');

            // Cek token kadaluarsa dan role
            if (decodedToken.exp * 1000 < Date.now() || !isCashier) {
                localStorage.removeItem('authToken');
                router.replace('/login');
            } else {
                setIsAuthorized(true); // Pengguna sah, izinkan tampilkan konten
            }
        } catch (error) {
            localStorage.removeItem('authToken');
            router.replace('/login');
        }
    }, [router]);

    // Tampilkan loading atau null selama pengecekan, jangan tampilkan konten halaman
    if (!isAuthorized) {
        return null; // atau <p>Loading...</p>
    }

    return <>{children}</>; // Jika sudah terotorisasi, tampilkan halaman
}