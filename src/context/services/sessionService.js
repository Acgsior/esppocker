export const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export const getRoomCookieName = (roomId) => `grooming_user_${roomId}`;
export const getOldRoomCookieName = (roomId) => `poker_user_${roomId}`;
export const GLOBAL_NICKNAME_COOKIE = 'grooming_nickname';
export const OLD_GLOBAL_NICKNAME_COOKIE = 'poker_nickname';
export const LAST_USED_NAME_COOKIE = 'grooming_last_used_name';

export const sessionService = {
    saveSession: (roomId, participantData, isObserver) => {
        const expiryTime = Date.now() + SESSION_DURATION;
        const userData = JSON.stringify({ ...participantData, is_observer: isObserver, expires: expiryTime });
        
        // Migration: Delete old poker_user cookie if it exists
        document.cookie = `${getOldRoomCookieName(roomId)}=; path=/; max-age=0;`;
        
        // Save new room user cookie
        document.cookie = `${getRoomCookieName(roomId)}=${encodeURIComponent(userData)}; path=/; max-age=${60 * 60 * 8};`;

        // Save independent name for auto-fill in future forms (30 days)
        document.cookie = `${LAST_USED_NAME_COOKIE}=${encodeURIComponent(participantData.name)}; path=/; max-age=${60 * 60 * 24 * 30};`;

        // Save global cookie for nickname persistence across rooms (8 hours)
        document.cookie = `${GLOBAL_NICKNAME_COOKIE}=${encodeURIComponent(participantData.name)}; path=/; max-age=${60 * 60 * 8};`;
    },

    clearSession: (roomId) => {
        document.cookie = `${getRoomCookieName(roomId)}=; path=/; max-age=0;`;
    },

    clearGlobalSession: () => {
        document.cookie = `${GLOBAL_NICKNAME_COOKIE}=; path=/; max-age=0;`;
    },

    getLocalSession: (roomId) => {
        // Cookie Migration Logic
        const oldMatchUser = document.cookie.match(new RegExp(`(?:^|; )${getOldRoomCookieName(roomId)}=([^;]+)`));
        if (oldMatchUser) {
            document.cookie = `${getRoomCookieName(roomId)}=${oldMatchUser[1]}; path=/; max-age=${60 * 60 * 8};`;
            document.cookie = `${getOldRoomCookieName(roomId)}=; path=/; max-age=0;`;
        }

        const matchUser = document.cookie.match(new RegExp(`(?:^|; )${getRoomCookieName(roomId)}=([^;]+)`));
        const savedUser = matchUser ? decodeURIComponent(matchUser[1]) : null;

        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                // Check 8-hour expiration manually
                if (parsedUser.expires && Date.now() > parsedUser.expires) {
                    sessionService.clearSession(roomId);
                    return null;
                }
                return parsedUser;
            } catch {
                sessionService.clearSession(roomId);
                return null;
            }
        }
        return null;
    },

    getGlobalNickname: () => {
        // Global nickname migration
        const oldMatch = document.cookie.match(new RegExp(`(?:^|; )${OLD_GLOBAL_NICKNAME_COOKIE}=([^;]+)`));
        if (oldMatch) {
            document.cookie = `${GLOBAL_NICKNAME_COOKIE}=${oldMatch[1]}; path=/; max-age=${60 * 60 * 8};`;
            document.cookie = `${OLD_GLOBAL_NICKNAME_COOKIE}=; path=/; max-age=0;`;
        }

        const match = document.cookie.match(new RegExp(`(?:^|; )${GLOBAL_NICKNAME_COOKIE}=([^;]+)`));
        return match ? decodeURIComponent(match[1]) : null;
    }
};
