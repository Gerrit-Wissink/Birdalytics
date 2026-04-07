import React from 'react'
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
   
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation(); // Get current route

    // Close menu when navigating to a new page
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest("#sideMenu") && !event.target.closest("#burgerMenu")) {
                setIsOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isOpen]);

    const nav_links = (
        <>
            <NavLink to="/cameras" className={({ isActive }) => (isActive ? 'active' : '')}>
                <span>Cameras</span>
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
                <span>Reports</span>
            </NavLink>
            <NavLink to="/valgrid" className={({ isActive }) => (isActive ? 'active' : '')}>
                <span>Validation Grid</span>
            </NavLink>
            <NavLink to="/upload">
                <span id='upload'>Upload Data</span>
            </NavLink>
        </>
    )


    return (
        <>
            <nav id= 'hide-in-mobile'>
                <Link to="/">
                    <img src="./images/GLTLogo.jpg" id="logo" alt="logo" />
                </Link>
                <div className="nav-links">
                    <div className="primary-nav">
                        {nav_links}
                    </div>
                    <button onClick={handleLogout} id='logOut'>
                        Log Out
                    </button>
                
                </div>
            </nav>    

        {/* For Mobile Screens */}

        <nav id="mobileMenu"
        style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
        }}>
            <Link to="/">
                <img src="./images/GLTLogo.jpg" id="logo" alt="logo" />
            </Link>

            <div id = 'burgerMenu' 
            className={isOpen ? "active" : ""}
            onClick={() => setIsOpen(!isOpen)}>
                <div className="bar" id="bar1"></div>
                <div className="bar" id="bar2"></div>
                <div className="bar" id="bar3"></div>
            </div>
        </nav>

        <div id = 'sideMenu' className={isOpen ? "open" : "closed"}>
            <div id = 'sideText'>
                {nav_links}
            </div>
            <div>
                <button onClick={handleLogout} id='logOut'>
                        Log Out
                </button>
            </div>
        </div>       
        </>
    );
}