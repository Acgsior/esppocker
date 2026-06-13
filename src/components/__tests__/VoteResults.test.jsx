import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import VoteResults from '../VoteResults';
import { useGrooming } from '../../context/GroomingContext';
import confetti from 'canvas-confetti';

jest.mock('../../context/GroomingContext', () => ({
  useGrooming: jest.fn(),
}));

jest.mock('canvas-confetti', () => {
  return jest.fn();
});

describe('VoteResults Component', () => {
  const setHoveredVoteMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 16));
  });

  afterEach(() => {
    jest.useRealTimers();
    if (window.requestAnimationFrame.mockRestore) {
      window.requestAnimationFrame.mockRestore();
    }
  });

  it('renders nothing if not revealed', () => {
    useGrooming.mockReturnValue({
      participants: [],
      currentGrooming: { status: 'voting' },
      setHoveredVote: setHoveredVoteMock,
    });
    const { container } = render(<VoteResults />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "No votes to display" if no one voted', () => {
    useGrooming.mockReturnValue({
      participants: [{ id: '1', vote: null, is_observer: false }],
      currentGrooming: { status: 'revealed' },
      setHoveredVote: setHoveredVoteMock,
    });
    render(<VoteResults />);
    expect(screen.getByText('No votes to display.')).toBeInTheDocument();
  });

  it('renders "No votes to display" if only observers voted or participants is null', () => {
    useGrooming.mockReturnValue({
      participants: null, // Test branch where participants is falsy
      currentGrooming: { status: 'revealed' },
      setHoveredVote: setHoveredVoteMock,
    });
    const { rerender } = render(<VoteResults />);
    expect(screen.getByText('No votes to display.')).toBeInTheDocument();

    useGrooming.mockReturnValue({
      participants: [{ id: '1', vote: '5', is_observer: true }], // observer with a vote
      currentGrooming: { status: 'revealed' },
      setHoveredVote: setHoveredVoteMock,
    });
    rerender(<VoteResults />);
    expect(screen.getByText('No votes to display.')).toBeInTheDocument();
  });

  it('renders results and highlights highest', () => {
    useGrooming.mockReturnValue({
      participants: [
        { id: '1', vote: '5', is_observer: false },
        { id: '2', vote: '5', is_observer: false },
        { id: '3', vote: '3', is_observer: false },
        { id: '4', vote: 'skip', is_observer: false }, // Should not trigger consensus
      ],
      currentGrooming: { status: 'revealed' },
      setHoveredVote: setHoveredVoteMock,
    });
    render(<VoteResults />);
    
    // '5' has 2 votes (50%)
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 votes
    expect(screen.getByText('(50%)')).toBeInTheDocument();

    // '3' has 1 vote (25%)
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // 'skip' has 1 vote (25%)
    expect(screen.getByText('skip')).toBeInTheDocument();
  });

  it('triggers celebration confetti when consensus is reached', () => {
    useGrooming.mockReturnValue({
      participants: [
        { id: '1', vote: '5', is_observer: false },
        { id: '2', vote: '5', is_observer: false },
      ], // consensus
      currentGrooming: { status: 'revealed' },
      setHoveredVote: setHoveredVoteMock,
    });

    render(<VoteResults />);
    
    // Confetti should have been called
    expect(confetti).toHaveBeenCalled();

    // Fast-forward to run through the requestAnimationFrame loop
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    // Should stop calling after duration
    const callCount = confetti.mock.calls.length;
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(confetti.mock.calls.length).toBe(callCount);
  });

  it('handles mouse enter and leave for hoveredVote', () => {
    useGrooming.mockReturnValue({
      participants: [
        { id: '1', vote: '5', is_observer: false },
      ],
      currentGrooming: { status: 'revealed' },
      setHoveredVote: setHoveredVoteMock,
    });
    
    const { container } = render(<VoteResults />);
    // Find the row for vote '5'
    // It is the div with onMouseEnter, which is the parent of the badge
    const voteRow = screen.getByText('5').closest('div').parentElement;
    
    fireEvent.mouseEnter(voteRow);
    expect(setHoveredVoteMock).toHaveBeenCalledWith('5');
    
    fireEvent.mouseLeave(voteRow);
    expect(setHoveredVoteMock).toHaveBeenCalledWith(null);
  });
  
  it('handles missing setHoveredVote gracefully', () => {
    useGrooming.mockReturnValue({
      participants: [{ id: '1', vote: '5', is_observer: false }],
      currentGrooming: { status: 'revealed' },
      // setHoveredVote omitted
    });
    const { container } = render(<VoteResults />);
    const voteRow = screen.getByText('5').closest('div').parentElement;
    
    fireEvent.mouseEnter(voteRow);
    fireEvent.mouseLeave(voteRow);
    // Should not throw
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
