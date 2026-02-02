import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

export default function LogIn() {
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
            const response = await fetch('http://localhost:8000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

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
            setError('Unable to connect to server. Please try again.');
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
                        {error && <p className="error-message">{error}</p>}
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