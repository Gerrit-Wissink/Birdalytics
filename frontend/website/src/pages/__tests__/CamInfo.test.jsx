import { render, screen } from '@testing-library/react';
import CamInfo from '../../pages/camInfo';
import apiClient from '../../utils/apiClient';

jest.mock('../../utils/apiClient', () => ({
    get: jest.fn(),
}));

jest.mock('../../components/camera-table', () => () => <div>Mock Camera Table</div>);
jest.mock('../../components/add-camera-modal', () => () => <div>Mock Add Camera Modal</div>);
jest.mock('../../components/species-identification', () => () => <div>Mock Species Identification</div>);
jest.mock('../../components/camera-summary', () => () => <div>Mock Camera Summary</div>);
jest.mock('../../components/camera-sidebar', () => () => <div>Mock Camera Sidebar</div>);

describe('CamInfo empty states', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'fake-token');
        localStorage.setItem('tokenExpiry', '2099-01-01T00:00:00.000Z');
        window.location.hash = '';
        jest.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    test('shows no cameras state', async () => {
        apiClient.get.mockImplementation((url) => {
            if (url === '/boxes/record') {
                return Promise.resolve({
                    status: 200,
                    data: { data: [] }
                });
            }

            if (url === '/species') {
                return Promise.resolve({
                    status: 200,
                    data: { data: [] }
                });
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        render(<CamInfo />);

        expect(await screen.findByText(/no cameras yet/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add camera/i })).toBeInTheDocument();
    });

    test('shows select a camera state when selected id is invalid', async () => {
        window.location.hash = '#/camInfo?selected=999';

        apiClient.get.mockImplementation((url) => {
            if (url === '/boxes/record') {
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [{ birdbox_id: 1, birdbox_name: 'Box 1', records: [] }]
                    }
                });
            }

            if (url === '/species') {
                return Promise.resolve({
                    status: 200,
                    data: { data: [] }
                });
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        render(<CamInfo />);

        expect(await screen.findByText(/select a camera/i)).toBeInTheDocument();
    });

    test('shows selected camera name after fetch', async () => {
        apiClient.get.mockImplementation((url) => {
            if (url === '/boxes/record') {
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [{ birdbox_id: 1, birdbox_name: 'Box 1', records: [] }]
                    }
                });
            }

            if (url === '/species') {
                return Promise.resolve({
                    status: 200,
                    data: { data: [] }
                });
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        render(<CamInfo />);

        expect(await screen.findByText(/box 1/i)).toBeInTheDocument();
    });
});
