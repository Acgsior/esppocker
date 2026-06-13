import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PointDeck from '../PointDeck';
import { useGrooming } from '../../context/GroomingContext';

jest.mock('../../context/GroomingContext', () => ({
  useGrooming: jest.fn(),
}));

describe('PointDeck Component', () => {
  const submitVoteMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing if currentGrooming or currentUser is null', () => {
    useGrooming.mockReturnValue({ currentGrooming: null, currentUser: null, submitVote: submitVoteMock });
    const { container } = render(<PointDeck />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Observer Mode if user is observer', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { status: 'voting', voting_options: ['1', '2', '3'] },
      currentUser: { is_observer: true },
      submitVote: submitVoteMock,
    });
    render(<PointDeck />);
    expect(screen.getByText('Observer Mode')).toBeInTheDocument();
  });

  it('renders deck and allows voting', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { status: 'voting', voting_options: ['1', '2', '3'] },
      currentUser: { is_observer: false, vote: null },
      submitVote: submitVoteMock,
    });
    const { rerender } = render(<PointDeck />);
    
    const btn2 = screen.getByRole('button', { name: /2/i });
    fireEvent.click(btn2);
    expect(submitVoteMock).toHaveBeenCalledWith('2');

    // Test missing voting_options
    useGrooming.mockReturnValue({
      currentGrooming: { status: 'voting' },
      currentUser: { is_observer: false, vote: null },
      submitVote: submitVoteMock,
    });
    rerender(<PointDeck />);
    expect(screen.queryByRole('button', { name: /2/i })).not.toBeInTheDocument();
  });

  it('disables buttons when status is revealed', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { status: 'revealed', voting_options: ['1'] },
      currentUser: { is_observer: false, vote: '1' },
      submitVote: submitVoteMock,
    });
    render(<PointDeck />);
    
    const btn1 = screen.getByRole('button', { name: /1/i });
    expect(btn1).toBeDisabled();
  });

  it('toggles privacy mode', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { status: 'voting', voting_options: ['1-3'] },
      currentUser: { is_observer: false, vote: null },
      submitVote: submitVoteMock,
    });
    render(<PointDeck />);
    
    // Privacy is off initially
    expect(screen.queryByText('Hover to reveal')).not.toBeInTheDocument();
    
    // Click privacy toggle
    const toggleBtn = screen.getByTitle('Toggle Privacy Mode');
    fireEvent.click(toggleBtn);
    
    // Privacy should be on
    expect(screen.getByText('Hover to reveal')).toBeInTheDocument();
    
    // Click again to turn off
    fireEvent.click(toggleBtn);
    expect(screen.queryByText('Hover to reveal')).not.toBeInTheDocument();
  });

  it('renders custom range point with split values', () => {
    useGrooming.mockReturnValue({
      currentGrooming: { status: 'voting', voting_options: ['1-3'] },
      currentUser: { is_observer: false, vote: null },
      submitVote: submitVoteMock,
    });
    render(<PointDeck />);
    
    // custom range '1-3' splits into 1 and 3
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
