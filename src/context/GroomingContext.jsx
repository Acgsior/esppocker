import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const GroomingContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useGrooming = () => useContext(GroomingContext);

export const GroomingProvider = ({ children }) => {
    const [currentGrooming, setCurrentGrooming] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionBubble, setActionBubble] = useState(null);
    const [hoveredVote, setHoveredVote] = useState(null);
    const channelRef = useRef(null);

    // Create a new grooming session
    const createGrooming = async (name, deck) => {
        setLoading(true);
        setError(null);
        try {
            // Check if grooming room with the same name already exists
            const { data: existingGrooming } = await supabase
                .from('rooms')
                .select('id')
                .eq('name', name)
                .maybeSingle();

            if (existingGrooming) {
                // Update deck to the latest requested
                await supabase.from('rooms').update({ voting_options: deck }).eq('id', existingGrooming.id);
                return existingGrooming.id;
            }

            const { data, error } = await supabase
                .from('rooms')
                .insert([{ name, voting_options: deck, status: 'voting' }])
                .select()
                .single();

            if (error) throw error;
            return data.id;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Join a grooming session and create a participant
    const joinGrooming = async (groomingId, participantName, isObserver = false) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Check if room exists
            const { data: groomingData, error: groomingError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', groomingId)
                .single();

            if (groomingError || !groomingData) throw new Error('Grooming session not found or invalid.');

            // 2. Add or Update participant
            const { data: existingParticipants, error: existingError } = await supabase
                .from('participants')
                .select('*')
                .eq('room_id', groomingId)
                .eq('name', participantName)
                .order('joined_at', { ascending: true });

            if (existingError) throw existingError;

            let participantData;
            if (existingParticipants && existingParticipants.length > 0) {
                // Update the first one to reuse it
                const { data: updated, error: updateError } = await supabase
                    .from('participants')
                    .update({ is_observer: isObserver })
                    .eq('id', existingParticipants[0].id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                participantData = updated;

                // Cleanup any dirty duplicate records
                if (existingParticipants.length > 1) {
                    const idsToDelete = existingParticipants.slice(1).map(p => p.id);
                    await supabase.from('participants').delete().in('id', idsToDelete);
                }
            } else {
                // Insert new participant
                const { data: newParticipant, error: participantError } = await supabase
                    .from('participants')
                    .insert([{ room_id: groomingId, name: participantName, is_observer: isObserver }])
                    .select()
                    .single();

                if (participantError) throw participantError;
                participantData = newParticipant;
            }

            // 3. Save to cookie with 8-hour expiration
            const expiryTime = Date.now() + 8 * 60 * 60 * 1000;
            const userData = JSON.stringify({ ...participantData, is_observer: isObserver, expires: expiryTime });
            
            // Migration: Delete old poker_user cookie if it exists
            document.cookie = `poker_user_${groomingId}=; path=/; max-age=0;`;
            document.cookie = `grooming_user_${groomingId}=${encodeURIComponent(userData)}; path=/; max-age=${60 * 60 * 8};`;

            // Save independent name for auto-fill in future forms
            document.cookie = `grooming_last_used_name=${encodeURIComponent(participantName)}; path=/; max-age=${60 * 60 * 24 * 30};`;

            // 4. Save global cookie for nickname persistence across rooms (8 hours)
            document.cookie = `grooming_nickname=${encodeURIComponent(participantName)}; path=/; max-age=${60 * 60 * 8};`;

            setCurrentGrooming(groomingData);
            setCurrentUser(participantData);

            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Check existing session
    const checkSession = async (groomingId) => {
        // Cookie Migration Logic
        const oldMatchUser = document.cookie.match(new RegExp(`(?:^|; )poker_user_${groomingId}=([^;]+)`));
        if (oldMatchUser) {
            document.cookie = `grooming_user_${groomingId}=${oldMatchUser[1]}; path=/; max-age=${60 * 60 * 8};`;
            document.cookie = `poker_user_${groomingId}=; path=/; max-age=0;`;
        }

        const matchUser = document.cookie.match(new RegExp(`(?:^|; )grooming_user_${groomingId}=([^;]+)`));
        const savedUser = matchUser ? decodeURIComponent(matchUser[1]) : null;

        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);

                // Check 8-hour expiration manually
                if (parsedUser.expires && Date.now() > parsedUser.expires) {
                    document.cookie = `grooming_user_${groomingId}=; path=/; max-age=0;`;
                    throw new Error('Session expired');
                }

                // Verify user still exists in DB and matches room and name
                const { data, error } = await supabase
                    .from('participants')
                    .select('*')
                    .eq('id', parsedUser.id)
                    .eq('room_id', groomingId)
                    .single();

                if (data && !error && data.name === parsedUser.name) {
                    setCurrentUser(data);
                    return true;
                } else {
                    document.cookie = `grooming_user_${groomingId}=; path=/; max-age=0;`;
                    setCurrentUser(null);
                }
            } catch {
                document.cookie = `grooming_user_${groomingId}=; path=/; max-age=0;`;
            }
        }

        // Global nickname migration
        const oldMatch = document.cookie.match(/(?:^|; )poker_nickname=([^;]+)/);
        if (oldMatch) {
            document.cookie = `grooming_nickname=${oldMatch[1]}; path=/; max-age=${60 * 60 * 8};`;
            document.cookie = `poker_nickname=; path=/; max-age=0;`;
        }

        // Check global cookie for automatic cross-room join
        const match = document.cookie.match(/(?:^|; )grooming_nickname=([^;]+)/);
        const globalNickname = match ? decodeURIComponent(match[1]) : null;

        if (globalNickname) {
            const success = await joinGrooming(groomingId, globalNickname);
            return success;
        }

        return false;
    };

    // Load initial grooming data
    const loadGroomingData = async (groomingId) => {
        setLoading(true);
        try {
            const { data: groomingData, error: groomingError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', groomingId)
                .single();

            if (groomingError) throw new Error('Failed to load grooming data.');

            setCurrentGrooming(groomingData);

            const { data: participantsData, error: participantsError } = await supabase
                .from('participants')
                .select('*')
                .eq('room_id', groomingId)
                .order('joined_at', { ascending: true });

            if (participantsError) throw participantsError;

            setParticipants(participantsData || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const leaveGrooming = async (participantId) => {
        try {
            const { error } = await supabase.from('participants').delete().eq('id', participantId);
            if (error) throw error;
            setCurrentUser(null);
        } catch (err) {
            console.error('Failed to leave grooming:', err.message);
        }
    };

    const broadcastRefresh = () => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'force_refresh',
                payload: {}
            });
        }
    };

    const submitVote = async (pointValue) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase
                .from('participants')
                .update({ vote: pointValue })
                .eq('id', currentUser.id);

            if (error) throw error;

            // Update local state optimistically
            setCurrentUser(prev => ({ ...prev, vote: pointValue }));
            setParticipants(prev => prev.map(p => p.id === currentUser.id ? { ...p, vote: pointValue } : p));
        } catch (err) {
            console.error('Failed to submit vote:', err.message);
        }
    };

    // Reveal points
    const revealCards = async (groomingId) => {
        try {
            const { error } = await supabase
                .from('rooms')
                .update({ status: 'revealed' })
                .eq('id', groomingId);

            if (error) throw error;

            if (currentUser && channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'room_action',
                    payload: { userId: currentUser.id, type: 'reveal' }
                });
            }
        } catch (err) {
            console.error('Failed to reveal points:', err.message);
        }
    };

    // Start new voting round
    const startNewVoting = async (groomingId) => {
        try {
            // 1. Reset room status
            const { error: roomError } = await supabase
                .from('rooms')
                .update({ status: 'voting' })
                .eq('id', groomingId);

            if (roomError) throw roomError;

            // 2. Reset all votes
            const { error: resetError } = await supabase
                .from('participants')
                .update({ vote: null })
                .eq('room_id', groomingId);

            if (resetError) throw resetError;

            // Optimistically clear local user vote
            if (currentUser) {
                setCurrentUser(prev => ({ ...prev, vote: null }));
            }

            if (currentUser && channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'room_action',
                    payload: { userId: currentUser.id, type: 'start' }
                });
            }
        } catch (err) {
            console.error('Failed to start new voting:', err.message);
        }
    };

    // Set up real-time subscriptions
    useEffect(() => {
        if (!currentGrooming) return;

        // Unified channel with broadcast enabled
        const channel = supabase.channel(`grooming_${currentGrooming.id}`, {
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
                filter: `id=eq.${currentGrooming.id}`
            }, (payload) => {
                setCurrentGrooming(payload.new);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'participants',
                filter: `room_id=eq.${currentGrooming.id}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setParticipants(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setParticipants(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
                    setCurrentUser(prevUser => (prevUser && prevUser.id === payload.new.id) ? payload.new : prevUser);
                } else if (payload.eventType === 'DELETE') {
                    setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
                }
            })
            .on('broadcast', { event: 'room_action' }, (payload) => {
                setActionBubble(payload.payload);
                setTimeout(() => setActionBubble(null), 4000);
            })
            .on('broadcast', { event: 'force_refresh' }, () => {
                loadGroomingData(currentGrooming.id);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentGrooming?.id]);

    const value = {
        currentGrooming,
        participants,
        currentUser,
        loading,
        error,
        actionBubble,
        hoveredVote,
        setHoveredVote,
        createGrooming,
        joinGrooming,
        leaveGrooming,
        checkSession,
        loadGroomingData,
        broadcastRefresh,
        submitVote,
        revealCards,
        startNewVoting
    };

    return (
        <GroomingContext.Provider value={value}>
            {children}
        </GroomingContext.Provider>
    );
};
