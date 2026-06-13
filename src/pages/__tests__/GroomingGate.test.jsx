import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GroomingGate from '../GroomingGate';
import { useGrooming } from '../../context/GroomingContext';

jest.mock('../../context/GroomingContext', () => ({
  useGrooming: jest.fn(),
}));

jest.mock('../../components/ActiveGrooming', () => {
  return function MockActiveGrooming() {
    return <div data-testid="active-grooming">Active Grooming Mock</div>;
  };
});

const renderComponent = () => {
  return render(
    <MemoryRouter initialEntries={['/grooming/test-room']}>
      <Routes>
        <Route path="/grooming/:id" element={<GroomingGate />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('GroomingGate Unit Tests', () => {
  let mockLoadGroomingData, mockCheckSession, mockJoinGrooming;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadGroomingData = jest.fn().mockResolvedValue({});
    mockCheckSession = jest.fn().mockResolvedValue({});
    mockJoinGrooming = jest.fn().mockResolvedValue({});

    useGrooming.mockReturnValue({
      currentGrooming: null,
      currentUser: null,
      error: null,
      loadGroomingData: mockLoadGroomingData,
      checkSession: mockCheckSession,
      joinGrooming: mockJoinGrooming,
    });
  });

  it('renders loading state initially', async () => {
    // Delay resolution so we can see loading state
    let resolveLoad;
    mockLoadGroomingData.mockImplementation(() => new Promise((resolve) => { resolveLoad = resolve; }));
    
    renderComponent();
    
    expect(screen.getByText('Brewing your session...')).toBeInTheDocument();
    
    // Resolve to let useEffect finish cleanly
    resolveLoad();
    await waitFor(() => expect(mockLoadGroomingData).toHaveBeenCalled());
  });

  it('renders error state when there is an error', async () => {
    useGrooming.mockReturnValue({
      currentGrooming: null,
      currentUser: null,
      error: 'Room not found',
      loadGroomingData: mockLoadGroomingData,
      checkSession: mockCheckSession,
      joinGrooming: mockJoinGrooming,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Room not found')).toBeInTheDocument();
    });
  });

  it('renders join form when user is not joined', async () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'test-room', name: 'Test Room' },
      currentUser: null,
      error: null,
      loadGroomingData: mockLoadGroomingData,
      checkSession: mockCheckSession,
      joinGrooming: mockJoinGrooming,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Join Grooming')).toBeInTheDocument();
      expect(screen.getByText('Test Room')).toBeInTheDocument();
    });

    // Test form submission
    const input = screen.getByLabelText(/Your Name/i);
    fireEvent.change(input, { target: { value: 'Tester' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Join Table/i }).closest('form'));
    
    await waitFor(() => {
      expect(mockJoinGrooming).toHaveBeenCalledWith('test-room', 'Tester', false);
    });
  });

  it('renders ActiveGrooming when user is joined', async () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'test-room', name: 'Test Room' },
      currentUser: { id: 'user-1', name: 'Tester' },
      error: null,
      loadGroomingData: mockLoadGroomingData,
      checkSession: mockCheckSession,
      joinGrooming: mockJoinGrooming,
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('active-grooming')).toBeInTheDocument();
    });
  });
});
