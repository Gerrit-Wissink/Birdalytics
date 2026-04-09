import { useNavigate } from "react-router-dom";

export default function LogoutModal({ setShowModal }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
        localStorage.removeItem("user");
        navigate('/login');
    };

    return (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Confirm Logout</h3>
                <p>Are you sure you want to log out?</p>
                <div className="modal-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => setShowModal(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="import-btn"
                        onClick={handleLogout}
                        style={{
                                backgroundColor: 'var(--red-500)', 
                                color: 'white',
                            }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}