import { Link, NavLink, useLocation } from "react-router-dom";
import './navbar.css';

export default function Navbar() {
   
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
                        <NavLink to="/upload" className={({ isActive }) => (isActive ? 'active' : '')}>
                            <span>Upload Data</span>
                        </NavLink>
                    </div>
                    <a href="#" id='logOut'>
                        Log Out
                    </a>
                
                </div>
            </nav>           
        </>
    );
}
