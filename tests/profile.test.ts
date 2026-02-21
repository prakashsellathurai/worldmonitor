
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { profileService } from '../src/services/profile';

describe('ProfileService', () => {
    // Mock localStorage
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value.toString();
            }),
            clear: vi.fn(() => {
                store = {};
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
        };
    })();

    beforeEach(() => {
        // Reset singleton state if possible or just use public methods to reset
        // Since profileService is a singleton instantiated on import, state might persist.
        // We'll rely on our resetProfile method if available or direct manipulation if exported.
        // Ideally we'd export the class too for testing, but let's see.

        vi.stubGlobal('localStorage', localStorageMock);
        profileService.resetProfile();
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize with default empty profile', () => {
        const profile = profileService.getProfile();
        expect(profile.name).toBe('');
        expect(profile.isConfigured).toBe(false);
    });

    it('should update profile correctly', () => {
        profileService.updateProfile({
            name: 'John Doe',
            headline: 'Developer',
            skills: ['JS', 'TS']
        });

        const profile = profileService.getProfile();
        expect(profile.name).toBe('John Doe');
        expect(profile.headline).toBe('Developer');
        expect(profile.skills).toEqual(['JS', 'TS']);
        expect(profile.isConfigured).toBe(true);
    });

    it('should simulate fetching LinkedIn profile', async () => {
        const result = await profileService.fetchLinkedInProfile('https://linkedin.com/in/testuser');

        expect(result.name).toBe('LinkedIn User');
        expect(result.skills).toContain('Leadership');
        expect(result.isConfigured).toBe(true);
    });

    it('should simulate fetching specific Prakash profile', async () => {
        const result = await profileService.fetchLinkedInProfile('https://linkedin.com/in/prakashsellathurai');

        expect(result.name).toBe('Prakash Sellathurai');
        expect(result.headline).toContain('Senior Software Engineer');
        expect(result.isConfigured).toBe(true);
    });

    it('should persist profile to localStorage on update', () => {
        profileService.updateProfile({ name: 'Jane Doe' });

        expect(localStorageMock.setItem).toHaveBeenCalledWith('wm-profile', expect.stringContaining('Jane Doe'));
    });

    it('should notify subscribers on change', () => {
        const listener = vi.fn();
        const unsubscribe = profileService.subscribe(listener);

        // Initial call
        expect(listener).toHaveBeenCalledTimes(1);

        profileService.updateProfile({ name: 'New Name' });

        // Called on update
        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));

        unsubscribe();
    });
});
