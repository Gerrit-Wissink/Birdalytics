import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import './login.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/users/login', { username, password });

            const data = response.data;

            if (data.success) {
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('tokenExpiry', data.expiresAt);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect to main page
                navigate('/');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            
            // Access status code
            const status = err.response?.status;
            const errorMessage = err.response?.data?.error;
            
            if (status === 401) {
                setError('Invalid username or password');
            } else if (status === 500) {
                setError('Server error. Please try again later.');
            } else if (status === 404) {
                setError('Server not found. Please contact support.');
            } else {
                setError(errorMessage || 'Login Failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <section id="login-container">
                <div id="login-logo">
                    <img src="./images/GLTLogo.jpg" alt="Genesee Land Trust Logo" />
                </div>
                <div id="login-box">
                    <h2>Birdalytics</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-box">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="input-box">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {error && <p className="error-message">{error}</p>}
                        <div className="button-box">
                            <button type="submit" disabled={isLoading}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>
                        <div className="forgot-password">
                            <a href="">Forgot password?</a>
                        </div>
                    </form>
                </div>
            </section>
        </>
    );
}