import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GroomingControls from '../GroomingControls';
import { useGrooming } from '../../context/GroomingContext';
import { useTheme } from '../../context/ThemeContext';

jest.mock('../../context/GroomingContext', () => ({
  useGrooming: jest.fn(),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

describe('GroomingControls Component', () => {
  const mockRevealCards = jest.fn();
  const mockStartNewVoting = jest.fn();
  const mockRestartVote = jest.fn();
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTheme.mockReturnValue({ theme: 'light', toggleTheme: mockToggleTheme });
  });

  it('renders nothing if currentGrooming is null', () => {
    useGrooming.mockReturnValue({ currentGrooming: null });
    const { container } = render(<GroomingControls />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Reveal Points button when voting and no one has voted', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', status: 'voting' },
      participants: [{ id: 'u1', vote: null }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
      restartVote: mockRestartVote,
    });
    render(<GroomingControls />);
    
    const btn = screen.getByRole('button', { name: /Reveal Points/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled(); // hasVotes = false
  });

  it('renders Reveal Points button enabled when voting and someone has voted', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', status: 'voting' },
      participants: [{ id: 'u1', vote: '5' }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
      restartVote: mockRestartVote,
    });
    render(<GroomingControls />);
    
    const btn = screen.getByRole('button', { name: /Reveal Points/i });
    expect(btn).not.toBeDisabled();
    
    fireEvent.click(btn);
    expect(mockRevealCards).toHaveBeenCalledWith('room-1');
  });

  it('renders Start New Vote button when revealed', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', status: 'revealed' },
      participants: [{ id: 'u1', vote: '5' }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
      restartVote: mockRestartVote,
    });
    render(<GroomingControls />);
    
    const btn = screen.getByRole('button', { name: /Start New Vote/i });
    expect(btn).toBeInTheDocument();
    
    fireEvent.click(btn);
    expect(mockStartNewVoting).toHaveBeenCalledWith('room-1');
  });

  it('toggles theme correctly', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', status: 'voting' },
      participants: [],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
      restartVote: mockRestartVote,
    });
    useTheme.mockReturnValue({ theme: 'dark', toggleTheme: mockToggleTheme });
    
    render(<GroomingControls />);
    
    const themeBtn = screen.getByTitle('Toggle Theme');
    fireEvent.click(themeBtn);
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  // --- Restart Vote tests ---

  it('renders Restart Vote button during voting phase', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', status: 'voting' },
      participants: [{ id: 'u1', vote: '5' }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
      restartVote: mockRestartVote,
    });
    render(<GroomingControls />);
    
    const btn = screen.getByTitle('Restart Vote');
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('disables Restart Vote button when no one has voted', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', status: 'voting' },
      participants: [{ id: 'u1', vote: null }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
      restartVote: mockRestartVote,
    });
    render(<GroomingControls />);
    
    const btn = screen.getByTitle('Restart Vote');
    expect(btn).toBeDisabled();
  });

  it('does not render Restart Vote button when revealed', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', status: 'revealed' },
      participants: [{ id: 'u1', vote: '5' }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
      restartVote: mockRestartVote,
    });
    render(<GroomingControls />);
    
    expect(screen.queryByTitle('Restart Vote')).not.toBeInTheDocument();
  });

  it('shows confirm modal on Restart Vote click and calls restartVote on confirm', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', status: 'voting' },
      participants: [{ id: 'u1', vote: '5' }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
      restartVote: mockRestartVote,
    });
    render(<GroomingControls />);
    
    // Click Restart Vote to open modal
    fireEvent.click(screen.getByTitle('Restart Vote'));
    
    // Modal should be visible
    expect(screen.getByText('All current votes will be cleared. Participants will need to vote again.')).toBeInTheDocument();
    
    // Click Restart to confirm
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    expect(mockRestartVote).toHaveBeenCalledWith('room-1');
  });

  it('closes confirm modal on Cancel click without calling restartVote', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { id: 'room-1', status: 'voting' },
      participants: [{ id: 'u1', vote: '5' }],
      revealCards: mockRevealCards,
      startNewVoting: mockStartNewVoting,
      restartVote: mockRestartVote,
    });
    render(<GroomingControls />);
    
    // Open modal
    fireEvent.click(screen.getByTitle('Restart Vote'));
    expect(screen.getByText('All current votes will be cleared. Participants will need to vote again.')).toBeInTheDocument();
    
    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockRestartVote).not.toHaveBeenCalled();
    
    // Modal should be dismissed
    expect(screen.queryByText('All current votes will be cleared. Participants will need to vote again.')).not.toBeInTheDocument();
  });
});

