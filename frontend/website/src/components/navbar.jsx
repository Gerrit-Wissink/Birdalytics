import { Link, NavLink, useNavigate } from "react-router-dom";
import './navbar.css';

export default function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear all stored authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('user');
        
        // Redirect to login page
        navigate('/login');
    };
   
    return (
        <>
            <nav>
                <Link to="/">
                    <img src="./images/GLTLogo.jpg" id="logo" alt="logo" />
                </Link>
                <div className="nav-links">
                    <div className="primary-nav">
                        <NavLink to="/cameras" className={({ isActive }) => (isActive ? 'active' : '')}>
                            <span>Cameras</span>
                        </NavLink>
                        <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
                            <span>Reports</span>
                        </NavLink>
                        <NavLink to="/upload">
                            <span id='upload'>Upload Data</span>
                        </NavLink>
                    </div>
                    <button onClick={handleLogout} id='logOut'>
                        Log Out
                    </button>
                
                </div>
            </nav>           
        </>
    );
}