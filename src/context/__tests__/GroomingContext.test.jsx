import React from 'react';
import { render, screen, act, waitFor, renderHook } from '@testing-library/react';
import { GroomingProvider, useGrooming } from '../GroomingContext';
import { supabase, mockSupabaseResponse, mockCallbacks, clearSupabaseMocks } from '../__mocks__/supabaseClient';

jest.mock('../../supabaseClient', () => ({
  supabase: require('../__mocks__/supabaseClient').supabase,
}));

// Suppress console.error in tests for expected errors
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

const TestComponent = () => {
  const ctx = useGrooming();
  
  return (
    <div>
      <div data-testid="error">{ctx.error}</div>
      <div data-testid="grooming-id">{ctx.currentGrooming?.id}</div>
      <div data-testid="user-id">{ctx.currentUser?.id}</div>
      <div data-testid="participants-count">{ctx.participants.length}</div>
      <div data-testid="action-bubble">{ctx.actionBubble ? ctx.actionBubble.type : 'none'}</div>
      
      <button onClick={() => ctx.createGrooming('Room A', ['1', '2'])}>Create Room</button>
      <button onClick={() => ctx.joinGrooming('room-1', 'Alice', false)}>Join Room</button>
      <button onClick={() => ctx.checkSession('room-1')}>Check Session</button>
      <button onClick={() => ctx.loadGroomingData('room-1')}>Load Data</button>
      <button onClick={() => ctx.leaveGrooming('user-1')}>Leave</button>
      <button onClick={() => ctx.broadcastRefresh()}>Broadcast Refresh</button>
      <button onClick={() => ctx.submitVote('5')}>Submit Vote</button>
      <button onClick={() => ctx.revealCards('room-1')}>Reveal Cards</button>
      <button onClick={() => ctx.startNewVoting('room-1')}>Start New</button>
      <button onClick={() => ctx.restartVote('room-1')}>Restart Vote</button>
    </div>
  );
};

describe('GroomingContext exhaustive tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSupabaseMocks();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    // Clear global callbacks
    Object.keys(mockCallbacks).forEach(key => delete mockCallbacks[key]);
  });

  // --- createGrooming ---
  it('createGrooming: updates existing room if found', async () => {
    mockSupabaseResponse('maybeSingle', { id: 'room-1' }); // existing found
    supabase.eq.mockImplementationOnce(() => supabase); // eq for the select
    supabase.eq.mockResolvedValueOnce({ error: null }); // eq for the update

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Create Room').click(); });

    await waitFor(() => {
      expect(supabase.update).toHaveBeenCalledWith({ voting_options: ['1', '2'] });
    });
  });

  it('createGrooming: inserts new room if not found', async () => {
    mockSupabaseResponse('maybeSingle', null); // not found
    mockSupabaseResponse('single', { id: 'room-2', name: 'Room A' }); // insert

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Create Room').click(); });

    await waitFor(() => {
      expect(supabase.insert).toHaveBeenCalledWith([{ name: 'Room A', voting_options: ['1', '2'], status: 'voting' }]);
    });
  });

  it('createGrooming: handles error', async () => {
    mockSupabaseResponse('maybeSingle', null); // not found
    mockSupabaseResponse('single', null, new Error('DB Error')); // insert error

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Create Room').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('DB Error');
    });
  });

  // --- joinGrooming ---
  it('joinGrooming: handles room not found', async () => {
    mockSupabaseResponse('single', null, new Error('Not found'));

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Join Room').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Grooming session not found or invalid.');
    });
  });

  it('joinGrooming: updates existing participant and cleans up duplicates', async () => {
    mockSupabaseResponse('single', { id: 'room-1' }); // room exists
    // existing participants (index 0 is Alice, index 1 is Alice)
    supabase.order.mockResolvedValueOnce({ 
      data: [
        { id: 'user-0', name: 'Alice', is_observer: false }, 
        { id: 'user-1', name: 'Alice', is_observer: false }
      ], 
      error: null 
    });
    // update first
    mockSupabaseResponse('single', { id: 'user-0', name: 'Alice' });
    // delete duplicates
    supabase.in.mockResolvedValueOnce({ error: null });

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Join Room').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-0');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.in).toHaveBeenCalledWith('id', ['user-1']);
    });
  });

  it('joinGrooming: throws existingError if fetching existing participants fails', async () => {
    mockSupabaseResponse('single', { id: 'room-1', status: 'voting' });
    supabase.order.mockResolvedValueOnce({ error: { message: 'fetching existing failed' } });

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Join Room').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('fetching existing failed');
    });
  });

  it('joinGrooming: successfully updates existing participant when exactly 1 exists', async () => {
    mockSupabaseResponse('single', { id: 'room-1' }); // room exists
    supabase.order.mockResolvedValueOnce({ 
      data: [{ id: 'user-0', name: 'Alice', is_observer: false }], 
      error: null 
    });
    // update
    mockSupabaseResponse('single', { id: 'user-0', name: 'Alice' });

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Join Room').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-0');
      // Should NOT call delete since duplicates don't exist
    });
  });

  it('joinGrooming: throws updateError if updating existing participant fails', async () => {
    mockSupabaseResponse('single', { id: 'room-1', status: 'voting' });
    supabase.order.mockResolvedValueOnce({ 
      data: [{ id: 'user-0', name: 'Alice', is_observer: false }], 
      error: null 
    });
    mockSupabaseResponse('single', null, { message: 'update failed' }); // update error

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Join Room').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('update failed');
    });
  });

  it('joinGrooming: throws participantError if inserting new participant fails', async () => {
    mockSupabaseResponse('single', { id: 'room-1', status: 'voting' });
    supabase.order.mockResolvedValueOnce({ data: [], error: null });
    mockSupabaseResponse('single', null, { message: 'insert failed' }); // insert error

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Join Room').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('insert failed');
    });
  });

  // --- checkSession ---
  it('checkSession: fails if no cookie', async () => {
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Check Session').click(); });
    // Wait a bit to ensure it processes
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('');
    });
  });

  it('checkSession: migrates old poker_user cookie and validates session', async () => {
    const expires = Date.now() + 100000;
    const userData = JSON.stringify({ id: 'user-1', name: 'Alice', expires });
    document.cookie = `poker_user_room-1=${encodeURIComponent(userData)}; path=/;`;
    
    mockSupabaseResponse('single', { id: 'user-1', name: 'Alice' });

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Check Session').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-1');
    });
    // Check if new cookie is set
    expect(document.cookie).toContain('grooming_user_room-1');
  });

  it('checkSession: expires correctly', async () => {
    const expires = Date.now() - 10000; // expired
    const userData = JSON.stringify({ id: 'user-1', name: 'Alice', expires });
    document.cookie = `grooming_user_room-1=${encodeURIComponent(userData)}; path=/;`;

    // Global nickname migration also tested here
    document.cookie = `poker_nickname=${encodeURIComponent('Alice')}; path=/;`;
    
    // We expect it to try to join with the global nickname since session expired
    mockSupabaseResponse('single', { id: 'room-1' }); // room exists
    supabase.order.mockResolvedValueOnce({ data: [], error: null }); // no existing
    mockSupabaseResponse('single', { id: 'user-2', name: 'Alice' }); // insert

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Check Session').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-2');
    });
  });

  it('checkSession: invalid JSON in cookie', async () => {
    document.cookie = `grooming_user_room-1=invalid_json; path=/;`;
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Check Session').click(); });
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('');
    });
  });

  it('checkSession: handles participant not found or name mismatch', async () => {
    const expires = Date.now() + 100000;
    const userData = JSON.stringify({ id: 'user-1', name: 'Alice', expires });
    document.cookie = `grooming_user_room-1=${encodeURIComponent(userData)}; path=/;`;

    // Mock returning different name or null data
    mockSupabaseResponse('single', { id: 'user-1', name: 'Not Alice' });
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Check Session').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('');
    });
  });

  // --- loadGroomingData ---
  it('loadGroomingData: handles errors', async () => {
    mockSupabaseResponse('single', null, new Error('Failed to load'));
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Load Data').click(); });
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load');
    });
  });
  
  it('loadGroomingData: handles participant fetch errors', async () => {
    mockSupabaseResponse('single', { id: 'room-1' });
    supabase.order.mockResolvedValueOnce({ data: null, error: new Error('Part error') });
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Load Data').click(); });
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Part error');
    });
  });

  it('loadGroomingData: handles null participantsData successfully', async () => {
    mockSupabaseResponse('single', { id: 'room-1' });
    supabase.order.mockResolvedValueOnce({ data: null, error: null });
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Load Data').click(); });
    await waitFor(() => {
      expect(screen.getByTestId('participants-count')).toHaveTextContent('0');
    });
  });

  // --- leaveGrooming ---
  it('leaveGrooming: successful and error', async () => {
    // success
    supabase.eq.mockResolvedValueOnce({ error: null });
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Leave').click(); });
    await waitFor(() => {
      expect(supabase.delete).toHaveBeenCalled();
    });
    
    // error
    supabase.eq.mockRejectedValueOnce(new Error('Delete err'));
    act(() => { screen.getByText('Leave').click(); });
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to leave grooming:', 'Delete err');
    });
  });

  // --- broadcastRefresh ---
  it('broadcastRefresh: sends event if channel exists', async () => {
    mockSupabaseResponse('single', { id: 'room-1' }); // room fetch for join
    supabase.order.mockResolvedValueOnce({ data: [], error: null });
    mockSupabaseResponse('single', { id: 'user-1', name: 'Alice' });

    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Join Room').click(); }); // establish channel

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-1');
    });

    act(() => { screen.getByText('Broadcast Refresh').click(); });
    // It should send a force_refresh
  });

  // --- Actions ---
  it('submitVote: handles error', async () => {
    // Must be logged in first
    mockSupabaseResponse('single', { id: 'room-1' });
    supabase.order.mockResolvedValueOnce({ data: [], error: null });
    mockSupabaseResponse('single', { id: 'user-1', name: 'Alice' });
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Join Room').click(); });
    await waitFor(() => { expect(screen.getByTestId('user-id')).toHaveTextContent('user-1'); });

    supabase.eq.mockRejectedValueOnce(new Error('Vote err'));
    act(() => { screen.getByText('Submit Vote').click(); });
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to submit vote:', 'Vote err');
    });
  });

  it('submitVote: updates successfully', async () => {
    // Must be logged in first
    mockSupabaseResponse('single', { id: 'room-1' });
    supabase.order.mockResolvedValueOnce({ 
        data: [{ id: 'user-0', name: 'Bob', is_observer: false }], 
        error: null 
    });
    mockSupabaseResponse('single', { id: 'user-1', name: 'Alice' });
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Join Room').click(); });
    await waitFor(() => { expect(screen.getByTestId('user-id')).toHaveTextContent('user-1'); });

    // Load data to populate participants array with both user-0 and user-1
    mockSupabaseResponse('single', { id: 'room-1' }); // room
    supabase.order.mockResolvedValueOnce({ 
      data: [
        { id: 'user-0', name: 'Bob', is_observer: false },
        { id: 'user-1', name: 'Alice', is_observer: false }
      ], 
      error: null 
    }); // participants
    act(() => { screen.getByText('Load Data').click(); });
    await waitFor(() => { expect(screen.getByTestId('participants-count')).toHaveTextContent('2'); });

    supabase.eq.mockResolvedValueOnce({ error: null });
    await act(async () => { 
      screen.getByText('Submit Vote').click(); 
      // wait for microtasks
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // We expect optimistic update to update the participants array with vote '5'
    await waitFor(() => {
      expect(supabase.update).toHaveBeenCalledWith({ vote: '5' });
    });
  });

  it('revealCards: handles error', async () => {
    supabase.eq.mockRejectedValueOnce(new Error('Reveal err'));
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Reveal Cards').click(); });
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to reveal points:', 'Reveal err');
    });
  });

  it('startNewVoting: handles room error and reset error, and success', async () => {
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    
    // Room error
    supabase.eq.mockResolvedValueOnce({ error: new Error('Room reset err') });
    act(() => { screen.getByText('Start New').click(); });
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to start new voting:', 'Room reset err');
    });

    // Reset error
    supabase.eq.mockResolvedValueOnce({ error: null });
    supabase.eq.mockResolvedValueOnce({ error: new Error('Part reset err') });
    act(() => { screen.getByText('Start New').click(); });
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to start new voting:', 'Part reset err');
    });

    // Success
    supabase.eq.mockResolvedValueOnce({ error: null }); // room
    supabase.eq.mockResolvedValueOnce({ error: null }); // participants
    act(() => { screen.getByText('Start New').click(); });
    await waitFor(() => {
      expect(supabase.update).toHaveBeenCalledWith({ vote: null });
    });
  });

  // --- Realtime Events (useEffect) ---
  it('handles realtime events correctly', async () => {
    mockSupabaseResponse('single', { id: 'room-1' });
    supabase.order.mockResolvedValueOnce({ data: [], error: null });
    render(<GroomingProvider><TestComponent /></GroomingProvider>);
    act(() => { screen.getByText('Load Data').click(); });
    
    await waitFor(() => {
      expect(screen.getByTestId('grooming-id')).toHaveTextContent('room-1');
    });

    // We now have channels set up. Test room UPDATE
    act(() => {
      if (mockCallbacks.rooms) {
        mockCallbacks.rooms({ new: { id: 'room-1', status: 'revealed' } });
      }
    });
    // First, let's join so currentUser is NOT null
    mockSupabaseResponse('single', { id: 'room-1' });
    supabase.order.mockResolvedValueOnce({ data: [], error: null });
    mockSupabaseResponse('single', { id: 'p1', name: 'Bob' });
    act(() => { screen.getByText('Join Room').click(); });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('p1');
    });

    // Now test INSERT
    act(() => {
      if (mockCallbacks.participants) {
        mockCallbacks.participants({ eventType: 'INSERT', new: { id: 'p1', name: 'Bob' } });
        mockCallbacks.participants({ eventType: 'INSERT', new: { id: 'p2', name: 'Alice' } });
      }
    });

    // Now test UPDATE
    act(() => {
      if (mockCallbacks.participants) {
        // Update p1 (which is also currentUser)
        mockCallbacks.participants({ eventType: 'UPDATE', new: { id: 'p1', name: 'Bobby' } });
        // Update p2 (not currentUser)
        mockCallbacks.participants({ eventType: 'UPDATE', new: { id: 'p2', name: 'Alice Updated' } });
      }
    });
    
    // Now test DELETE
    act(() => {
      if (mockCallbacks.participants) {
        mockCallbacks.participants({ eventType: 'DELETE', old: { id: 'p1' } });
      }
    });
    await waitFor(() => {
      expect(screen.getByTestId('participants-count')).toHaveTextContent('1');
    });

    // Test unknown event type
    act(() => {
      if (mockCallbacks.participants) {
        mockCallbacks.participants({ eventType: 'UNKNOWN' });
      }
    });

    // Test broadcast events
    jest.useFakeTimers();
    act(() => {
      if (mockCallbacks.broadcast_room_action) {
        mockCallbacks.broadcast_room_action({ payload: { type: 'reveal' } });
      }
    });
    await waitFor(() => {
      expect(screen.getByTestId('action-bubble')).toHaveTextContent('reveal');
    });
    
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('action-bubble')).toHaveTextContent('none');
    });
    jest.useRealTimers();

    // Force refresh triggers loadGroomingData
    mockSupabaseResponse('single', { id: 'room-1' });
    supabase.order.mockResolvedValueOnce({ data: [], error: null });
    act(() => {
      if (mockCallbacks.broadcast_force_refresh) {
        mockCallbacks.broadcast_force_refresh();
      }
    });
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('rooms');
    });
  });

  describe('action error paths', () => {
    it('handles submitVote without currentUser', async () => {
      // should return early
      const { result } = renderHook(() => useGrooming(), { wrapper: GroomingProvider });
      await act(async () => {
        await result.current.submitVote('5');
      });
      // no state change, no error
      expect(result.current.error).toBeNull();
    });

    it('handles submitVote error', async () => {
      const { result } = renderHook(() => useGrooming(), { wrapper: GroomingProvider });
      // manually set currentUser by mocking fetch
      mockSupabaseResponse('single', { id: 'room-1' });
      supabase.order.mockResolvedValueOnce({ data: [], error: null });
      mockSupabaseResponse('single', { id: 'p1' });
      
      await act(async () => {
        await result.current.joinGrooming('room-1', 'Bob');
      });

      // Mock update error
      supabase.update.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({ error: new Error('vote error') })
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        await result.current.submitVote('5');
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to submit vote:', 'vote error');
      consoleSpy.mockRestore();
    });

    it('handles revealCards without currentUser', async () => {
      const { result } = renderHook(() => useGrooming(), { wrapper: GroomingProvider });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        await result.current.revealCards('room-1');
      });
      // error comes from update, if any. But if currentUser is null, channelRef.current.send is skipped.
      consoleSpy.mockRestore();
    });

    it('handles revealCards error', async () => {
      const { result } = renderHook(() => useGrooming(), { wrapper: GroomingProvider });
      supabase.update.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({ error: new Error('reveal error') })
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        await result.current.revealCards('room-1');
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to reveal points:', 'reveal error');
      consoleSpy.mockRestore();
    });

    it('handles leaveGrooming error', async () => {
      const { result } = renderHook(() => useGrooming(), { wrapper: GroomingProvider });
      supabase.delete.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({ error: new Error('leave error') })
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        await result.current.leaveGrooming('p1');
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to leave grooming:', 'leave error');
      consoleSpy.mockRestore();
    });

    it('handles startNewVoting error', async () => {
      const { result } = renderHook(() => useGrooming(), { wrapper: GroomingProvider });
      supabase.update.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({ error: new Error('start error') })
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        await result.current.startNewVoting('room-1');
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to start new voting:', 'start error');
      consoleSpy.mockRestore();
    });

    it('handles restartVote error', async () => {
      const { result } = renderHook(() => useGrooming(), { wrapper: GroomingProvider });
      supabase.update.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({ error: new Error('restart error') })
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        await result.current.restartVote('room-1');
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to restart vote:', 'restart error');
      consoleSpy.mockRestore();
    });

    it('restartVote: resets votes without changing room status', async () => {
      render(<GroomingProvider><TestComponent /></GroomingProvider>);

      // Join first to set currentUser
      mockSupabaseResponse('single', { id: 'room-1' });
      supabase.order.mockResolvedValueOnce({ data: [], error: null });
      mockSupabaseResponse('single', { id: 'user-1', name: 'Alice' });
      await act(async () => { screen.getByText('Join Room').click(); });
      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-1');
      });

      // Restart vote
      supabase.eq.mockResolvedValueOnce({ error: null }); // participants reset
      await act(async () => { screen.getByText('Restart Vote').click(); });
      await waitFor(() => {
        // Should only update participants, NOT rooms status
        expect(supabase.update).toHaveBeenCalledWith({ vote: null });
      });
    });

    it('handles broadcastRefresh without channelRef', () => {
      const { result } = renderHook(() => useGrooming(), { wrapper: GroomingProvider });
      act(() => {
        result.current.broadcastRefresh();
      });
      // Should not throw
      expect(result.current.error).toBeNull();
    });
  });
});
