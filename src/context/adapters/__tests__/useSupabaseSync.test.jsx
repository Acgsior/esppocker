import { renderHook, act } from '@testing-library/react';
import { useSupabaseSync } from '../useSupabaseSync';
import { supabase, mockCallbacks, clearSupabaseMocks } from '../../__mocks__/supabaseClient';

jest.mock('../../../supabaseClient', () => ({
    supabase: require('../../__mocks__/supabaseClient').supabase,
}));

describe('useSupabaseSync adapter', () => {
    beforeEach(() => {
        clearSupabaseMocks();
        Object.keys(mockCallbacks).forEach(key => delete mockCallbacks[key]);
    });

    it('subscribes to channel and sets up callbacks', () => {
        const callbacks = {
            onRoomUpdate: jest.fn(),
            onParticipantInsert: jest.fn(),
            onParticipantUpdate: jest.fn(),
            onParticipantDelete: jest.fn(),
            onRoomAction: jest.fn(),
            onForceRefresh: jest.fn(),
        };

        const { unmount } = renderHook(() => useSupabaseSync('room-1', callbacks));

        expect(supabase.channel).toHaveBeenCalledWith('grooming_room-1', expect.any(Object));

        // Test room update
        act(() => {
            if (mockCallbacks.rooms) mockCallbacks.rooms({ new: { id: 'room-1' } });
        });
        expect(callbacks.onRoomUpdate).toHaveBeenCalledWith({ id: 'room-1' });

        // Test participant insert
        act(() => {
            if (mockCallbacks.participants) mockCallbacks.participants({ eventType: 'INSERT', new: { id: 'p1' } });
        });
        expect(callbacks.onParticipantInsert).toHaveBeenCalledWith({ id: 'p1' });

        // Test participant update
        act(() => {
            if (mockCallbacks.participants) mockCallbacks.participants({ eventType: 'UPDATE', new: { id: 'p1' } });
        });
        expect(callbacks.onParticipantUpdate).toHaveBeenCalledWith({ id: 'p1' });

        // Test participant delete
        act(() => {
            if (mockCallbacks.participants) mockCallbacks.participants({ eventType: 'DELETE', old: { id: 'p1' } });
        });
        expect(callbacks.onParticipantDelete).toHaveBeenCalledWith({ id: 'p1' });

        // Test broadcast action
        act(() => {
            if (mockCallbacks.broadcast_room_action) mockCallbacks.broadcast_room_action({ payload: { type: 'reveal' } });
        });
        expect(callbacks.onRoomAction).toHaveBeenCalledWith({ type: 'reveal' });

        // Test force refresh
        act(() => {
            if (mockCallbacks.broadcast_force_refresh) mockCallbacks.broadcast_force_refresh();
        });
        expect(callbacks.onForceRefresh).toHaveBeenCalled();

        unmount();
        expect(supabase.removeChannel).toHaveBeenCalled();
    });

    it('does not crash if callbacks are not provided', () => {
        const { unmount } = renderHook(() => useSupabaseSync('room-1', {}));
        
        expect(() => {
            act(() => {
                if (mockCallbacks.rooms) mockCallbacks.rooms({ new: { id: 'room-1' } });
                if (mockCallbacks.participants) mockCallbacks.participants({ eventType: 'INSERT', new: { id: 'p1' } });
                if (mockCallbacks.broadcast_room_action) mockCallbacks.broadcast_room_action({ payload: {} });
                if (mockCallbacks.broadcast_force_refresh) mockCallbacks.broadcast_force_refresh();
            });
        }).not.toThrow();

        unmount();
    });

    it('broadcast methods send messages to channel', () => {
        const { result, unmount } = renderHook(() => useSupabaseSync('room-1', {}));
        
        // Mock the send function on the channel
        const mockSend = jest.fn();
        supabase.channel.mockReturnValueOnce({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            send: mockSend
        });

        // Trigger a re-render/re-subscription to catch the mock
        unmount();
        const { result: newResult } = renderHook(() => useSupabaseSync('room-2', {}));

        act(() => {
            newResult.current.broadcastAction({ type: 'reveal' });
        });
        expect(mockSend).toHaveBeenCalledWith({
            type: 'broadcast',
            event: 'room_action',
            payload: { type: 'reveal' }
        });

        act(() => {
            newResult.current.broadcastRefresh();
        });
        expect(mockSend).toHaveBeenCalledWith({
            type: 'broadcast',
            event: 'force_refresh',
            payload: {}
        });
    });
});
