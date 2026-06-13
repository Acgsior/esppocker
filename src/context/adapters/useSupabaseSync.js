import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

/**
 * Sync Adapter handling real-time pub/sub logic with Supabase.
 * By keeping this separate, GroomingContext only deals with React state.
 */
export function useSupabaseSync(roomId, callbacks) {
    const channelRef = useRef(null);
    const callbacksRef = useRef(callbacks);

    // Keep callbacks fresh to prevent stale closures and infinite re-subscribing
    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        if (!roomId) return;

        const channel = supabase.channel(`grooming_${roomId}`, {
            config: {
                broadcast: { self: true },
            },
        });

        channelRef.current = channel;

        channel
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${roomId}`
            }, (payload) => {
                if (callbacksRef.current.onRoomUpdate) {
                    callbacksRef.current.onRoomUpdate(payload.new);
                }
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'participants',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT' && callbacksRef.current.onParticipantInsert) {
                    callbacksRef.current.onParticipantInsert(payload.new);
                } else if (payload.eventType === 'UPDATE' && callbacksRef.current.onParticipantUpdate) {
                    callbacksRef.current.onParticipantUpdate(payload.new);
                } else if (payload.eventType === 'DELETE' && callbacksRef.current.onParticipantDelete) {
                    callbacksRef.current.onParticipantDelete(payload.old);
                }
            })
            .on('broadcast', { event: 'room_action' }, (payload) => {
                if (callbacksRef.current.onRoomAction) {
                    callbacksRef.current.onRoomAction(payload.payload);
                }
            })
            .on('broadcast', { event: 'force_refresh' }, () => {
                if (callbacksRef.current.onForceRefresh) {
                    callbacksRef.current.onForceRefresh();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [roomId]);

    const broadcastAction = useCallback((payload) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'room_action',
                payload: payload
            });
        }
    }, []);

    const broadcastRefresh = useCallback(() => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'force_refresh',
                payload: {}
            });
        }
    }, []);

    return { broadcastAction, broadcastRefresh };
}
