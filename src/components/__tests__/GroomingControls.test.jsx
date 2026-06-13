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
    });
    useTheme.mockReturnValue({ theme: 'dark', toggleTheme: mockToggleTheme });
    
    render(<GroomingControls />);
    
    const themeBtn = screen.getByTitle('Toggle Theme');
    fireEvent.click(themeBtn);
    expect(mockToggleTheme).toHaveBeenCalled();
  });
});
