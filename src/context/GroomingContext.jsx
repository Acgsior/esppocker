import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useSupabaseSync } from './adapters/useSupabaseSync';
import { sessionService } from './services/sessionService';

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

    // Callbacks for Sync Adapter
    const syncCallbacks = {
        onRoomUpdate: (newRoomData) => setCurrentGrooming(newRoomData),
        onParticipantInsert: (newParticipant) => setParticipants(prev => [...prev, newParticipant]),
        onParticipantUpdate: (updatedParticipant) => {
            setParticipants(prev => prev.map(p => p.id === updatedParticipant.id ? updatedParticipant : p));
            setCurrentUser(prev => (prev && prev.id === updatedParticipant.id) ? updatedParticipant : prev);
        },
        onParticipantDelete: (deletedParticipant) => setParticipants(prev => prev.filter(p => p.id !== deletedParticipant.id)),
        onRoomAction: (payload) => {
            setActionBubble(payload);
            setTimeout(() => setActionBubble(null), 4000);
        },
        onForceRefresh: () => {
            if (currentGrooming?.id) {
                loadGroomingData(currentGrooming.id);
            }
        }
    };

    const { broadcastAction, broadcastRefresh } = useSupabaseSync(
        currentGrooming?.id,
        syncCallbacks
    );

    // Create a new grooming session
    const createGrooming = async (name, deck) => {
        setLoading(true);
        setError(null);
        try {
            const { data: existingGrooming } = await supabase
                .from('rooms')
                .select('id')
                .eq('name', name)
                .maybeSingle();

            if (existingGrooming) {
                await supabase.from('rooms').update({ voting_options: deck }).eq('id', existingGrooming.id);
                return existingGrooming.id;
            }

            const { data, error: insertError } = await supabase
                .from('rooms')
                .insert([{ name, voting_options: deck, status: 'voting' }])
                .select()
                .single();

            if (insertError) throw insertError;
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
            const { data: groomingData, error: groomingError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', groomingId)
                .single();

            if (groomingError || !groomingData) throw new Error('Grooming session not found or invalid.');

            const { data: existingParticipants, error: existingError } = await supabase
                .from('participants')
                .select('*')
                .eq('room_id', groomingId)
                .eq('name', participantName)
                .order('joined_at', { ascending: true });

            if (existingError) throw existingError;

            let participantData;
            if (existingParticipants && existingParticipants.length > 0) {
                const { data: updated, error: updateError } = await supabase
                    .from('participants')
                    .update({ is_observer: isObserver })
                    .eq('id', existingParticipants[0].id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                participantData = updated;

                if (existingParticipants.length > 1) {
                    const idsToDelete = existingParticipants.slice(1).map(p => p.id);
                    await supabase.from('participants').delete().in('id', idsToDelete);
                }
            } else {
                const { data: newParticipant, error: participantError } = await supabase
                    .from('participants')
                    .insert([{ room_id: groomingId, name: participantName, is_observer: isObserver }])
                    .select()
                    .single();

                if (participantError) throw participantError;
                participantData = newParticipant;
            }

            sessionService.saveSession(groomingId, participantData, isObserver);

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
        const savedUser = sessionService.getLocalSession(groomingId);

        if (savedUser) {
            const { data, error } = await supabase
                .from('participants')
                .select('*')
                .eq('id', savedUser.id)
                .eq('room_id', groomingId)
                .single();

            if (data && !error && data.name === savedUser.name) {
                setCurrentUser(data);
                return true;
            } else {
                sessionService.clearSession(groomingId);
                setCurrentUser(null);
            }
        }

        const globalNickname = sessionService.getGlobalNickname();
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
            if (participantId) {
                const { error } = await supabase.from('participants').delete().eq('id', participantId);
                if (error) throw error;
            }
            setCurrentUser(null);
            if (currentGrooming?.id) {
                sessionService.clearSession(currentGrooming.id);
            }
        } catch (err) {
            console.error('Failed to leave grooming:', err.message);
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

            if (currentUser) {
                broadcastAction({ userId: currentUser.id, type: 'reveal' });
            }
        } catch (err) {
            console.error('Failed to reveal points:', err.message);
        }
    };

    // Start new voting round
    const startNewVoting = async (groomingId) => {
        try {
            const { error: roomError } = await supabase
                .from('rooms')
                .update({ status: 'voting' })
                .eq('id', groomingId);

            if (roomError) throw roomError;

            const { error: resetError } = await supabase
                .from('participants')
                .update({ vote: null })
                .eq('room_id', groomingId);

            if (resetError) throw resetError;

            if (currentUser) {
                setCurrentUser(prev => ({ ...prev, vote: null }));
                broadcastAction({ userId: currentUser.id, type: 'start' });
            }
        } catch (err) {
            console.error('Failed to start new voting:', err.message);
        }
    };

    // Restart current vote (clear all points without changing status)
    const restartVote = async (groomingId) => {
        try {
            const { error: resetError } = await supabase
                .from('participants')
                .update({ vote: null })
                .eq('room_id', groomingId);

            if (resetError) throw resetError;

            if (currentUser) {
                setCurrentUser(prev => ({ ...prev, vote: null }));
                broadcastAction({ userId: currentUser.id, type: 'restart' });
            }
        } catch (err) {
            console.error('Failed to restart vote:', err.message);
        }
    };

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
        startNewVoting,
        restartVote
    };

    return (
        <GroomingContext.Provider value={value}>
            {children}
        </GroomingContext.Provider>
    );
};
