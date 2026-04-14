import { render, screen, fireEvent } from '@testing-library/react';
import CameraCard from '../CameraCard';

describe('CameraCard', () => {
    test('navigates to selected camera on click', () => {
        const originalLocation = window.location;

        delete window.location;
        window.location = { href: '' };

        render(
            <CameraCard
                camera={{ birdbox_id: 42, birdbox_name: 'Test Cam' }}
                image="test.jpg"
            />
        );

        fireEvent.click(screen.getByText(/test cam/i));

        expect(window.location.href).toBe('/#/camInfo?selected=42');

        window.location = originalLocation;
    });
});
