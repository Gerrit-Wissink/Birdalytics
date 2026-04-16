import { render, screen, fireEvent } from '@testing-library/react';
import CameraCard from '../camera-card';

describe('CameraCard', () => {
    test('navigates to selected camera on click', () => {
        window.location.hash = '';

        render(
            <CameraCard
                camera={{ birdbox_id: 42, birdbox_name: 'Test Cam' }}
                image="test.jpg"
            />
        );

        fireEvent.click(screen.getByText(/test cam/i));

        expect(window.location.hash).toBe('#/camInfo?selected=42');
    });
});
