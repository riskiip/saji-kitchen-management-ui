// src/app/login/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/services/api'; // Kita akan buat fungsi ini

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await login({ username, password });
            if (response.token) {
                localStorage.setItem('authToken', response.token);
                router.push('/'); // Redirect ke halaman kasir
            }
        } catch (err) {
            setError('Username atau password salah.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleLogin} className="p-8 bg-white rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center text-red-700">Saji Cashier Login</h1>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="mb-4">
                    <label className="block mb-2">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700">
                    Login
                </button>
            </form>
        </div>
    );
}