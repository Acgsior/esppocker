import { sessionService, getRoomCookieName, getOldRoomCookieName, GLOBAL_NICKNAME_COOKIE, OLD_GLOBAL_NICKNAME_COOKIE, LAST_USED_NAME_COOKIE } from '../sessionService';

describe('sessionService', () => {
    beforeEach(() => {
        // clear all cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    });

    it('saveSession: saves user data and global nickname', () => {
        const participantData = { id: 'p1', name: 'Alice' };
        sessionService.saveSession('room-1', participantData, true);

        expect(document.cookie).toContain(getRoomCookieName('room-1'));
        expect(document.cookie).toContain(LAST_USED_NAME_COOKIE);
        expect(document.cookie).toContain(GLOBAL_NICKNAME_COOKIE);

        const roomCookie = document.cookie.split('; ').find(row => row.startsWith(getRoomCookieName('room-1') + '='));
        const decoded = JSON.parse(decodeURIComponent(roomCookie.split('=')[1]));
        expect(decoded.name).toBe('Alice');
        expect(decoded.is_observer).toBe(true);
    });

    it('clearSession: removes the room cookie', () => {
        document.cookie = `${getRoomCookieName('room-1')}=some_data; path=/`;
        sessionService.clearSession('room-1');
        // after clear, jsdom makes the cookie disappear or empty
        expect(document.cookie).not.toContain(`${getRoomCookieName('room-1')}=some_data`);
    });

    it('clearGlobalSession: removes the global nickname cookie', () => {
        document.cookie = `${GLOBAL_NICKNAME_COOKIE}=Alice; path=/`;
        sessionService.clearGlobalSession();
        expect(document.cookie).not.toContain(`${GLOBAL_NICKNAME_COOKIE}=Alice`);
    });

    it('getLocalSession: migrates old poker_user cookie', () => {
        const expires = Date.now() + 100000;
        const userData = JSON.stringify({ id: 'p1', name: 'Bob', expires });
        document.cookie = `${getOldRoomCookieName('room-1')}=${encodeURIComponent(userData)}; path=/`;

        const session = sessionService.getLocalSession('room-1');
        expect(session).not.toBeNull();
        expect(session.name).toBe('Bob');
        expect(document.cookie).toContain(getRoomCookieName('room-1'));
        expect(document.cookie).not.toContain(`${getOldRoomCookieName('room-1')}=${encodeURIComponent(userData)}`);
    });

    it('getLocalSession: returns null if session is expired', () => {
        const expires = Date.now() - 10000; // past
        const userData = JSON.stringify({ id: 'p1', name: 'Bob', expires });
        document.cookie = `${getRoomCookieName('room-1')}=${encodeURIComponent(userData)}; path=/`;

        const session = sessionService.getLocalSession('room-1');
        expect(session).toBeNull();
    });

    it('getLocalSession: returns null if cookie data is invalid JSON', () => {
        document.cookie = `${getRoomCookieName('room-1')}=invalid_json; path=/`;
        const session = sessionService.getLocalSession('room-1');
        expect(session).toBeNull();
    });

    it('getGlobalNickname: migrates old poker_nickname cookie', () => {
        document.cookie = `${OLD_GLOBAL_NICKNAME_COOKIE}=Charlie; path=/`;
        const nickname = sessionService.getGlobalNickname();
        expect(nickname).toBe('Charlie');
        expect(document.cookie).toContain(`${GLOBAL_NICKNAME_COOKIE}=Charlie`);
    });
});
