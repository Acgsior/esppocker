import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActiveGrooming from '../ActiveGrooming';
import { useGrooming } from '../../context/GroomingContext';

jest.mock('../../context/GroomingContext', () => ({
  useGrooming: jest.fn(),
}));

jest.mock('../PointDeck', () => () => <div data-testid="point-deck">PointDeck Mock</div>);
jest.mock('../ParticipantList', () => () => <div data-testid="participant-list">ParticipantList Mock</div>);
jest.mock('../GroomingControls', () => () => <div data-testid="grooming-controls">GroomingControls Mock</div>);
jest.mock('../VoteResults', () => () => <div data-testid="vote-results">VoteResults Mock</div>);

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <ActiveGrooming />
    </MemoryRouter>
  );
};

describe('ActiveGrooming Unit Tests', () => {
  let mockLeaveGrooming, mockLoadGroomingData, mockBroadcastRefresh, mockRevealCards, mockStartNewVoting;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLeaveGrooming = jest.fn().mockResolvedValue({});
    mockLoadGroomingData = jest.fn().mockResolvedValue({});
    mockBroadcastRefresh = jest.fn();
    mockRevealCards = jest.fn();
    mockStartNewVoting = jest.fn();

    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', name: 'Sprint Planning Room', status: 'voting' },
      currentUser: { id: 'user-1', name: 'Tester' },
      leaveGrooming: mockLeaveGrooming,
      loadGroomingData: mockLoadGroomingData,
      broadcastRefresh: mockBroadcastRefresh,
      participants: [{ id: 'user-1', vote: '5' }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
    });
  });

  it('renders correctly with mocked child components', () => {
    renderComponent();
    
    expect(screen.getByText('Sprint Planning Room')).toBeInTheDocument();
    expect(screen.getByText('Voting in progress')).toBeInTheDocument();
    expect(screen.getByText('Tester')).toBeInTheDocument();
    expect(screen.getByTestId('point-deck')).toBeInTheDocument();
    expect(screen.getByTestId('participant-list')).toBeInTheDocument();
    expect(screen.getByTestId('grooming-controls')).toBeInTheDocument();
    expect(screen.getByTestId('vote-results')).toBeInTheDocument();
  });

  it('calls leaveGrooming when Leave button is clicked', async () => {
    renderComponent();
    const leaveBtn = screen.getByTitle('Leave');
    await act(async () => {
      fireEvent.click(leaveBtn);
    });
    expect(mockLeaveGrooming).toHaveBeenCalledWith('user-1');
  });

  it('calls loadGroomingData and broadcastRefresh when Refresh button is clicked', async () => {
    renderComponent();
    const refreshBtn = screen.getByTitle('Refresh');
    await act(async () => {
      fireEvent.click(refreshBtn);
    });
    expect(mockLoadGroomingData).toHaveBeenCalledWith('room-1');
  });

  it('copies URL to clipboard when Copy Link is clicked', () => {
    jest.useFakeTimers();
    renderComponent();
    const copyBtn = screen.getByTitle('Copy Link');
    act(() => {
      fireEvent.click(copyBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost/');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    
    jest.useRealTimers();
  });

  it('mobile FAB calls revealCards when status is voting', () => {
    renderComponent();
    const fab = screen.getByRole('button', { name: 'Reveal Points (Mobile)' });
    expect(fab).not.toBeDisabled(); // because participants have votes
    fireEvent.click(fab);
    expect(mockRevealCards).toHaveBeenCalledWith('room-1');
  });

  it('mobile FAB calls startNewVoting when status is revealed', () => {
    useGrooming.mockReturnValueOnce({
      currentGrooming: { id: 'room-1', name: 'Sprint Planning Room', status: 'revealed' },
      currentUser: { id: 'user-1', name: 'Tester' },
      leaveGrooming: mockLeaveGrooming,
      loadGroomingData: mockLoadGroomingData,
      broadcastRefresh: mockBroadcastRefresh,
      participants: [{ id: 'user-1', vote: '5' }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
    });
    renderComponent();
    const fab = screen.getByRole('button', { name: 'Start New Vote (Mobile)' });
    fireEvent.click(fab);
    expect(mockStartNewVoting).toHaveBeenCalledWith('room-1');
  });
});
