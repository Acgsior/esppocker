import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GroomingProvider } from '../../context/GroomingContext';
import { ThemeProvider } from '../../context/ThemeContext';
import GroomingBoard from '../GroomingBoard';
import { supabase, mockSupabaseResponse, clearSupabaseMocks } from '../../context/__mocks__/supabaseClient';

jest.mock('../../supabaseClient', () => ({
  supabase: require('../../context/__mocks__/supabaseClient').supabase,
}));

// Mock confetti to avoid canvas errors in jsdom
jest.mock('canvas-confetti', () => jest.fn());

jest.mock('../../context/GroomingContext', () => {
  const originalModule = jest.requireActual('../../context/GroomingContext');
  return {
    ...originalModule,
  };
});

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

const renderWithProviders = (ui, { route = '/grooming/room-1' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <GroomingProvider>
          <Routes>
            <Route path="/grooming/:id" element={ui} />
          </Routes>
        </GroomingProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('GroomingBoard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSupabaseMocks();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  });

  it('allows user to join, see voting, vote, and reveal', async () => {
    // 1. Initial Load Room
    mockSupabaseResponse('single', { id: 'room-1', name: 'Sprint Planning', status: 'voting', voting_options: ['1', '2', '3', '5'] });
    // Participants load
    supabase.order.mockResolvedValueOnce({ data: [], error: null });

    renderWithProviders(<GroomingBoard />);

    // Wait for join screen
    await waitFor(() => {
      expect(screen.getByText('Join Grooming')).toBeInTheDocument();
    });

    // 2. User fills nickname and joins
    const input = screen.getByLabelText(/Your Name/i);
    fireEvent.change(input, { target: { value: 'Morgan' } });
    
    // Mock join network calls
    mockSupabaseResponse('single', { id: 'room-1', name: 'Sprint Planning', status: 'voting', voting_options: ['1', '2', '3', '5'] });
    supabase.order.mockResolvedValueOnce({ data: [], error: null }); // existing participant check
    mockSupabaseResponse('single', { id: 'user-1', name: 'Morgan', room_id: 'room-1', is_observer: false, vote: null }); // insert user

    fireEvent.click(screen.getByRole('button', { name: /Join Table/i }));

    // Wait for the board to render
    await waitFor(() => {
      expect(screen.getByText('Grooming Controls')).toBeInTheDocument();
    });

    // Simulate real-time event for participant insert
    act(() => {
        const { mockCallbacks } = require('../../context/__mocks__/supabaseClient');
        if (mockCallbacks.participants) {
            mockCallbacks.participants({ eventType: 'INSERT', new: { id: 'user-1', name: 'Morgan', room_id: 'room-1', is_observer: false, vote: null } });
        }
    });

    // 3. User is in the board
    await waitFor(() => {
      expect(screen.getByText('Sprint Planning')).toBeInTheDocument();
      expect(screen.getByText('Voting in progress')).toBeInTheDocument();
    });

    // 4. Submit a vote
    supabase.update.mockReturnThis();
    supabase.eq.mockResolvedValueOnce({ error: null });

    const btn5 = screen.getByRole('button', { name: /5/i });
    fireEvent.click(btn5);

    await waitFor(() => {
      expect(supabase.update).toHaveBeenCalledWith({ vote: '5' });
    });

    // Simulate receiving broadcast for the new participant list (including the vote)
    // The optimistic update sets the local vote and participants list.
    // Wait for the optimistic update to propagate
    await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Reveal Points' })).not.toBeDisabled();
    });

    // 5. Reveal Points
    const revealBtn = screen.getByRole('button', { name: 'Reveal Points' });

    supabase.update.mockReturnThis();
    supabase.eq.mockResolvedValueOnce({ error: null }); // room update to revealed
    
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(supabase.update).toHaveBeenCalledWith({ status: 'revealed' });
    });

    // Mobile FAB reveal and start new
    // Simulate receiving room update event so local state reflects 'revealed'
    act(() => {
        const { mockCallbacks } = require('../../context/__mocks__/supabaseClient');
        if (mockCallbacks.rooms) {
            mockCallbacks.rooms({ new: { id: 'room-1', status: 'revealed', voting_options: ['1'] } });
        }
    });

    const mobileFABStartNew = screen.getByRole('button', { name: 'Start New Vote (Mobile)' });
    supabase.eq.mockResolvedValueOnce({ error: null }); // room update reset
    supabase.eq.mockResolvedValueOnce({ error: null }); // participants reset
    
    // We are resetting the mock here so we can exactly assert the next call
    supabase.update.mockClear(); 

    fireEvent.click(mobileFABStartNew);
    
    await waitFor(() => {
      expect(supabase.update).toHaveBeenCalledWith({ vote: null });
    });

    // Refresh test
    const refreshBtn = screen.getByTitle('Refresh');
    mockSupabaseResponse('single', { id: 'room-1', status: 'revealed' }); // load data mock
    supabase.order.mockResolvedValueOnce({ data: [], error: null });
    fireEvent.click(refreshBtn);
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('rooms');
    });

    // Copy URL test
    jest.useFakeTimers();
    const copyBtn = screen.getByTitle('Copy Link');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    jest.useRealTimers();

    // Leave test
    const leaveBtn = screen.getByTitle('Leave');
    supabase.eq.mockResolvedValueOnce({ error: null });
    fireEvent.click(leaveBtn);
    await waitFor(() => {
      expect(supabase.delete).toHaveBeenCalled();
    });
  });

  it('renders error state correctly', async () => {
    mockSupabaseResponse('single', null, new Error('Grooming not found'));
    
    renderWithProviders(<GroomingBoard />);
    
    await waitFor(() => {
      expect(screen.getByText('Grooming not found')).toBeInTheDocument();
      expect(screen.getByText('Failed to load grooming data.')).toBeInTheDocument();
    });
  });

  it('initializes nickname from cookie', async () => {
    document.cookie = "grooming_last_used_name=CookieUser; path=/";
    mockSupabaseResponse('single', { id: 'room-1', status: 'voting' });
    supabase.order.mockResolvedValueOnce({ data: [], error: null });

    renderWithProviders(<GroomingBoard />, { route: '/grooming/room-1' });

    await waitFor(() => {
      expect(screen.getByLabelText(/Your Name/i)).toHaveValue('CookieUser');
    });

    // clean up cookie
    document.cookie = "grooming_last_used_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  });

  it('allows joining as observer and tests mobile FAB reveal', async () => {
    mockSupabaseResponse('single', { id: 'room-2', name: 'Planning 2', status: 'voting', voting_options: ['1'] });
    supabase.order.mockResolvedValueOnce({ data: [], error: null }); // no existing

    renderWithProviders(<GroomingBoard />, { route: '/grooming/room-2' });

    await waitFor(() => {
      expect(screen.getByText('Join Grooming')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/Your Name/i);
    fireEvent.change(input, { target: { value: 'Observer' } });

    // Try joining with empty name (should return early)
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('button', { name: /Join Table/i }).closest('form'));
    
    // Now provide a valid name
    fireEvent.change(input, { target: { value: 'Observer' } });

    // Toggle observer
    const observerSwitch = screen.getByRole('switch');
    fireEvent.click(observerSwitch);

    mockSupabaseResponse('single', { id: 'room-2', status: 'voting' }); // room check
    supabase.order.mockResolvedValueOnce({ data: [], error: null }); // existing participant check
    mockSupabaseResponse('single', { id: 'user-2', name: 'Observer', room_id: 'room-2', is_observer: true, vote: null }); // insert

    fireEvent.click(screen.getByRole('button', { name: /Join Table/i }));

    await waitFor(() => {
      expect(screen.getByText('Grooming Controls')).toBeInTheDocument();
    });

    const mobileFABReveal = screen.getByRole('button', { name: 'Reveal Points (Mobile)' });
    
    // FAB is disabled since no votes
    expect(mobileFABReveal).toBeDisabled();

    // Now someone votes (simulate via callback)
    act(() => {
      const { mockCallbacks } = require('../../context/__mocks__/supabaseClient');
      if (mockCallbacks.participants) {
        mockCallbacks.participants({
          eventType: 'INSERT',
          new: { id: 'voter-1', name: 'Voter', is_observer: false, vote: '1' }
        });
      }
    });

    await waitFor(() => {
      expect(mobileFABReveal).not.toBeDisabled();
    });

    supabase.update.mockReturnThis();
    supabase.eq.mockResolvedValueOnce({ error: null }); // update room to revealed
    fireEvent.click(mobileFABReveal);

    await waitFor(() => {
      expect(supabase.update).toHaveBeenCalledWith({ status: 'revealed' });
    });
  });
});

