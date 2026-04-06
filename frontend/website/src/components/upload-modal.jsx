export default function UploadModal({isLoading, selectedBox, fileText, urlValue, setShowConfirmModal, handleConfirmUpload}) {
    return (
        <div className="modal-overlay" onClick={() => !isLoading && setShowConfirmModal(false)}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Confirm Upload</h3>
                <p>
                    You are about to upload to <strong>{selectedBox}</strong>.
                </p>

                {fileText && (
                    <p>
                        <strong>Files:</strong> {fileText}
                    </p>
                )}

                {urlValue.trim() && (
                    <p>
                        <strong>URL:</strong> {urlValue}
                    </p>
                )}

                <p className="confirm-warning">
                    Make sure this is the correct birdbox before continuing.
                </p>

                <div className="modal-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => setShowConfirmModal(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="import-btn"
                        onClick={handleConfirmUpload}
                        disabled={isLoading}
                        style={{backgroundColor: 'var(--green)'}}
                    >
                        {isLoading ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}