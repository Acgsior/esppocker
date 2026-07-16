import React from 'react';
import { render, screen } from '@testing-library/react';
import ParticipantList from '../ParticipantList';
import { useGrooming } from '../../context/GroomingContext';

jest.mock('../../context/GroomingContext', () => ({
  useGrooming: jest.fn(),
}));

describe('ParticipantList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Waiting for players to join..." when no voters', () => {
    useGrooming.mockReturnValue({
      participants: [],
      currentUser: { id: 'u1' },
      currentGrooming: { status: 'voting' },
    });
    render(<ParticipantList />);
    expect(screen.getByText('Waiting for players to join...')).toBeInTheDocument();
  });

  it('renders voters and their statuses in voting stage', () => {
    useGrooming.mockReturnValue({
      participants: [
        { id: 'u1', name: 'Alice', is_observer: false, vote: null },
        { id: 'u2', name: 'Bob', is_observer: false, vote: '5' },
      ],
      currentUser: { id: 'u1' },
      currentGrooming: { status: 'voting' },
    });
    render(<ParticipantList />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Thinking')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('(You)')).toBeInTheDocument(); // Alice is currentUser
  });

  it('renders voters in revealed stage with highest vote highlighted', () => {
    useGrooming.mockReturnValue({
      participants: [
        { id: 'u1', name: 'Alice', is_observer: false, vote: '5' },
        { id: 'u2', name: 'Bob', is_observer: false, vote: '5' },
        { id: 'u3', name: 'Charlie', is_observer: false, vote: '3' },
        { id: 'u4', name: 'Dave', is_observer: false, vote: null }, // skipped
        { id: 'u5', name: 'Eve', is_observer: false, vote: '1000' }, // length > 3
        { id: 'u5_2', name: 'Eve2', is_observer: false, vote: '1000' }, // make 1000 tie for highest
        { id: 'u6', name: 'Frank', is_observer: false, vote: '1-3' }, // hyphen
        { id: 'u7', name: 'George', is_observer: false, vote: '9999' }, // length > 3 but not highest
      ],
      currentUser: { id: 'u1' },
      currentGrooming: { status: 'revealed' },
      hoveredVote: '3', // hover effect test
    });
    render(<ParticipantList />);
    
    // Alice & Bob have 5 (count 2), Eve & Eve2 have 1000 (count 2). Both tie for highest!
    const topPicks = screen.getAllByText('Top Pick');
    expect(topPicks.length).toBe(4);

    // Charlie has 3 (count 1)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    
    // Dave has null
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    
    // Eve has 1000
    expect(screen.getAllByText('1000').length).toBeGreaterThan(0);

    // Frank has 1-3
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders observers and their action bubbles', () => {
    useGrooming.mockReturnValue({
      participants: [
        { id: 'o1', name: 'Watcher', is_observer: true, vote: null },
        { id: 'o2', name: 'Watcher2', is_observer: true, vote: null },
      ],
      currentUser: { id: 'o2' }, // Test not current user for o1
      currentGrooming: { status: 'voting' },
      actionBubble: { userId: 'o1', type: 'start' },
    });
    const { rerender } = render(<ParticipantList />);
    
    expect(screen.getByText('Observers')).toBeInTheDocument();
    expect(screen.getByText('Watcher')).toBeInTheDocument();
    
    // Action bubble 'start'
    expect(screen.getByText('Start New!')).toBeInTheDocument();

    useGrooming.mockReturnValue({
      participants: [
        { id: 'o1', name: 'Watcher', is_observer: true, vote: null },
      ],
      currentUser: { id: 'o1' },
      currentGrooming: { status: 'voting' },
      actionBubble: { userId: 'o1', type: 'reveal' },
    });
    rerender(<ParticipantList />);
    expect(screen.getByText('Open!')).toBeInTheDocument();
  });

  it('renders reveal action bubble for voters', () => {
    useGrooming.mockReturnValue({
      participants: [
        { id: 'u1', name: 'Alice', is_observer: false, vote: '5' },
      ],
      currentUser: { id: 'u2' },
      currentGrooming: { status: 'voting' },
      actionBubble: { userId: 'u1', type: 'reveal' },
    });
    const { rerender } = render(<ParticipantList />);
    
    expect(screen.getByText('Open!')).toBeInTheDocument();

    useGrooming.mockReturnValue({
      participants: [
        { id: 'u1', name: 'Alice', is_observer: false, vote: '5' },
      ],
      currentUser: { id: 'u2' },
      currentGrooming: { status: 'voting' },
      actionBubble: { userId: 'u1', type: 'start' },
    });
    rerender(<ParticipantList />);
    expect(screen.getByText('Start New!')).toBeInTheDocument();
  });

  it('renders restart action bubble for voters', () => {
    useGrooming.mockReturnValue({
      participants: [
        { id: 'u1', name: 'Alice', is_observer: false, vote: '5' },
      ],
      currentUser: { id: 'u2' },
      currentGrooming: { status: 'voting' },
      actionBubble: { userId: 'u1', type: 'restart' },
    });
    render(<ParticipantList />);
    
    expect(screen.getByText('Restart!')).toBeInTheDocument();
  });
});
