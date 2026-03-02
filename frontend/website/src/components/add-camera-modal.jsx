import '../pages/cameras.css';


export default function AddCameraModal({ handleCancelModal, handleAddCamera }) {
    return (
        <div className="modal-overlay" onClick={handleCancelModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Camera</h2>
                    <button className="modal-close" onClick={handleCancelModal}>✕</button>
                </div>
                <form onSubmit={handleAddCamera}>
                    <div className="form-group">
                        <label htmlFor="cameraName">Camera Name <span className="required">*</span></label>
                        <input 
                            type="text" 
                            id="cameraName" 
                            name="cameraName"
                            placeholder="New Camera 1..."
                            value={formData.cameraName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="location">Camera Location <span className="required">*</span></label>
                        <input 
                            type="text" 
                            id="location" 
                            name="location"
                            placeholder="MacKay Wildlife Reserve"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="installationDate">Installation Date</label>
                        <input 
                            type="text" 
                            id="installationDate" 
                            name="installationDate"
                            placeholder="YYYY-MM-DD (Ex. 2025-12-31)"
                            value={formData.installationDate}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="coordinates">Camera Coordinates</label>
                        <input 
                            type="text" 
                            id="coordinates" 
                            name="coordinates"
                            placeholder="12.345,-98.765"
                            value={formData.coordinates}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="modal-buttons">
                        <button type="button" className="cancel-btn" onClick={handleCancelModal}>Cancel</button>
                        <button type="submit" className="add-btn">Add</button>
                    </div>
                </form>
            </div>
        </div>
    );
}