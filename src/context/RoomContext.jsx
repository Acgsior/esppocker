import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const RoomContext = createContext();

export const useRoom = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
    const [currentRoom, setCurrentRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionBubble, setActionBubble] = useState(null);
    const [hoveredVote, setHoveredVote] = useState(null);
    const channelRef = useRef(null);
    const navigate = useNavigate();

    // Create a new room
    const createRoom = async (name, votingOptions) => {
        setLoading(true);
        setError(null);
        try {
            // Check if room with the same name already exists
            const { data: existingRoom } = await supabase
                .from('rooms')
                .select('id')
                .eq('name', name)
                .maybeSingle();

            if (existingRoom) {
                // Update voting options to the latest requested
                await supabase.from('rooms').update({ voting_options: votingOptions }).eq('id', existingRoom.id);
                return existingRoom.id;
            }

            const { data, error } = await supabase
                .from('rooms')
                .insert([{ name, voting_options: votingOptions, status: 'voting' }])
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

    // Join a room and create a participant
    const joinRoom = async (roomId, participantName, isObserver = false) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Check if room exists
            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .single();

            if (roomError || !roomData) throw new Error('Room not found or invalid.');

            // 2. Add or Update participant
            const { data: existingParticipants, error: existingError } = await supabase
                .from('participants')
                .select('*')
                .eq('room_id', roomId)
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
                    .insert([{ room_id: roomId, name: participantName, is_observer: isObserver }])
                    .select()
                    .single();

                if (participantError) throw participantError;
                participantData = newParticipant;
            }

            // 3. Save to local storage with 8-hour expiration
            const expiryTime = Date.now() + 8 * 60 * 60 * 1000;
            localStorage.setItem(
                `poker_user_${roomId}`,
                JSON.stringify({ ...participantData, is_observer: isObserver, expires: expiryTime })
            );

            // Save independent name for auto-fill in future forms
            localStorage.setItem('poker_last_used_name', participantName);

            // 4. Save global cookie for nickname persistence across rooms (8 hours)
            document.cookie = `poker_nickname=${encodeURIComponent(participantName)}; path=/; max-age=${60 * 60 * 8};`;

            setCurrentRoom(roomData);
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
    const checkSession = async (roomId) => {
        const savedUser = localStorage.getItem(`poker_user_${roomId}`);
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);

                // Check 8-hour expiration manually
                if (parsedUser.expires && Date.now() > parsedUser.expires) {
                    localStorage.removeItem(`poker_user_${roomId}`);
                    throw new Error('Session expired');
                }

                // Verify user still exists in DB and matches room and name
                const { data, error } = await supabase
                    .from('participants')
                    .select('*')
                    .eq('id', parsedUser.id)
                    .eq('room_id', roomId)
                    .single();

                if (data && !error && data.name === parsedUser.name) {
                    setCurrentUser(data);
                    return true;
                } else {
                    localStorage.removeItem(`poker_user_${roomId}`);
                    setCurrentUser(null);
                }
            } catch (e) {
                localStorage.removeItem(`poker_user_${roomId}`);
            }
        }

        // Check global cookie for automatic cross-room join
        const match = document.cookie.match(/(?:^|; )poker_nickname=([^;]+)/);
        const globalNickname = match ? decodeURIComponent(match[1]) : null;

        if (globalNickname) {
            const success = await joinRoom(roomId, globalNickname);
            return success;
        }

        return false;
    };

    // Load initial room data
    const loadRoomData = async (roomId) => {
        setLoading(true);
        try {
            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .single();

            if (roomError) throw new Error('Failed to load room data.');

            setCurrentRoom(roomData);

            const { data: participantsData, error: participantsError } = await supabase
                .from('participants')
                .select('*')
                .eq('room_id', roomId)
                .order('joined_at', { ascending: true });

            if (participantsError) throw participantsError;

            setParticipants(participantsData || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const leaveRoom = async (participantId) => {
        try {
            await supabase.from('participants').delete().eq('id', participantId);
            setCurrentUser(null);
        } catch (err) {
            console.error('Failed to leave room:', err.message);
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

    const submitVote = async (voteValue) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase
                .from('participants')
                .update({ vote: voteValue })
                .eq('id', currentUser.id);

            if (error) throw error;

            // Update local state optimistically
            setCurrentUser(prev => ({ ...prev, vote: voteValue }));
            setParticipants(prev => prev.map(p => p.id === currentUser.id ? { ...p, vote: voteValue } : p));
        } catch (err) {
            console.error('Failed to submit vote:', err.message);
        }
    };

    // Reveal cards
    const revealCards = async (roomId) => {
        try {
            const { error } = await supabase
                .from('rooms')
                .update({ status: 'revealed' })
                .eq('id', roomId);

            if (error) throw error;

            if (currentUser && channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'room_action',
                    payload: { userId: currentUser.id, type: 'reveal' }
                });
            }
        } catch (err) {
            console.error('Failed to reveal cards:', err.message);
        }
    };

    // Start new voting round
    const startNewVoting = async (roomId) => {
        try {
            // 1. Reset room status
            const { error: roomError } = await supabase
                .from('rooms')
                .update({ status: 'voting' })
                .eq('id', roomId);

            if (roomError) throw roomError;

            // 2. Reset all votes
            const { error: resetError } = await supabase
                .from('participants')
                .update({ vote: null })
                .eq('room_id', roomId);

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
        if (!currentRoom) return;

        // Unified Room channel with broadcast enabled
        const channel = supabase.channel(`poker_${currentRoom.id}`, {
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
                filter: `id=eq.${currentRoom.id}`
            }, (payload) => {
                setCurrentRoom(payload.new);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'participants',
                filter: `room_id=eq.${currentRoom.id}`
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
                loadRoomData(currentRoom.id);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [currentRoom?.id]);

    const value = {
        currentRoom,
        participants,
        currentUser,
        loading,
        error,
        actionBubble,
        hoveredVote,
        setHoveredVote,
        createRoom,
        joinRoom,
        leaveRoom,
        checkSession,
        loadRoomData,
        broadcastRefresh,
        submitVote,
        revealCards,
        startNewVoting
    };

    return (
        <RoomContext.Provider value={value}>
            {children}
        </RoomContext.Provider>
    );
};
