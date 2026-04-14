import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';

export default function FloatingNavigationArrows({ onPrevious, onNext }) {
    const buttonStyle = {
        position: 'fixed',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: 'none',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 100,
        transition: 'background-color 0.2s',
        top: '50%',
        transform: 'translateY(-50%)',
    };

    return (
        <>
            <button
                onClick={onPrevious}
                style={{ ...buttonStyle, left: '20px' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                aria-label="Previous record"
            >
                <ChevronLeftRoundedIcon style={{ color: 'white', fontSize: '28px' }} />
            </button>
            
            <button
                onClick={onNext}
                style={{ ...buttonStyle, right: '20px' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                aria-label="Next record"
            >
                <ChevronRightRoundedIcon style={{ color: 'white', fontSize: '28px' }} />
            </button>
        </>
    );
}
