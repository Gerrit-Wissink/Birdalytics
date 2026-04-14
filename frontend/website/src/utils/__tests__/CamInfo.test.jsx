import { render, screen } from '@testing-library/react';
import CamInfo from '../../pages/camInfo';

describe('CamInfo empty states', () => {
    test('shows no cameras state', () => {
        render(
            <CamInfo
                cameras={[]}
                selectedCamera={null}
            />
        );

        expect(screen.getByText(/no cameras yet/i)).toBeInTheDocument();
        expect(
            screen.getByText(/add a camera to start viewing summaries and images/i)
        ).toBeInTheDocument();
    });

    test('shows select a camera state', () => {
        render(
            <CamInfo
                cameras={[{ birdbox_id: 1, birdbox_name: 'Box 1', records: [] }]}
                selectedCamera={null}
            />
        );

        expect(screen.getByText(/select a camera/i)).toBeInTheDocument();
    });

    test('shows no records state for selected camera', () => {
        render(
            <CamInfo
                cameras={[{ birdbox_id: 1, birdbox_name: 'Box 1', records: [] }]}
                selectedCamera={{ birdbox_id: 1, birdbox_name: 'Box 1', records: [] }}
            />
        );

        expect(screen.getByText(/box 1/i)).toBeInTheDocument();
        expect(screen.getByText(/no records/i)).toBeInTheDocument();
    });
});
