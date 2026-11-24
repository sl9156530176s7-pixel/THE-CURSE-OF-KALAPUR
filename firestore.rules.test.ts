/**
 * Phase 0 Adversarial Rules Specification Tests ("Dirty Dozen")
 * Verifies every privilege-escalation, shadow-field, email-spoof, and resource-poisoning
 * vector is rejected by firestore.rules.
 */

export const OWNER_EMAIL = 'sl9156530176s7@gmail.com';

export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated list on /downloads',
    operation: 'list',
    path: '/downloads',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unauthenticated get on /ratings',
    operation: 'get',
    path: '/ratings/sample_rating_1',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Email spoof attack with email_verified=false',
    operation: 'list',
    path: '/downloads',
    auth: { uid: 'spoof-uid', email: OWNER_EMAIL, email_verified: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Verified non-owner attempts list on /downloads',
    operation: 'list',
    path: '/downloads',
    auth: { uid: 'player-123', email: 'player@gmail.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow ghost field injection on /downloads create',
    operation: 'create',
    path: '/downloads/dl_test_ghost',
    auth: null,
    payload: {
      appId: 'curse-of-kalapur',
      deviceClientId: 'dev_abc123',
      platform: 'android',
      browser: 'Chrome Android',
      installType: 'pwa_installed',
      appVersion: '2.6.0',
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Client-forged createdAt timestamp on /downloads create',
    operation: 'create',
    path: '/downloads/dl_test_time',
    auth: null,
    payload: {
      appId: 'curse-of-kalapur',
      deviceClientId: 'dev_abc123',
      platform: 'android',
      browser: 'Chrome Android',
      installType: 'pwa_installed',
      appVersion: '2.6.0',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Invalid platform enum on /downloads create',
    operation: 'create',
    path: '/downloads/dl_test_platform',
    auth: null,
    payload: {
      appId: 'curse-of-kalapur',
      deviceClientId: 'dev_abc123',
      platform: 'hacked_os',
      browser: 'Chrome',
      installType: 'pwa_installed',
      appVersion: '2.6.0',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Oversized 50KB comment denial-of-wallet on /ratings create',
    operation: 'create',
    path: '/ratings/rate_test_big',
    auth: null,
    payload: {
      appId: 'curse-of-kalapur',
      deviceClientId: 'dev_abc123',
      stars: 5,
      comment: 'X'.repeat(50000),
      platform: 'desktop',
      appVersion: '2.6.0',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Out-of-range stars on /ratings create',
    operation: 'create',
    path: '/ratings/rate_test_stars',
    auth: null,
    payload: {
      appId: 'curse-of-kalapur',
      deviceClientId: 'dev_abc123',
      stars: 99,
      comment: 'Invalid stars',
      platform: 'desktop',
      appVersion: '2.6.0',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'ID poisoning >128 chars on /downloads create',
    operation: 'create',
    path: `/downloads/${'a'.repeat(160)}`,
    auth: null,
    payload: {
      appId: 'curse-of-kalapur',
      deviceClientId: 'dev_abc123',
      platform: 'android',
      browser: 'Chrome',
      installType: 'pwa_installed',
      appVersion: '2.6.0',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Non-owner tries to delete a player rating',
    operation: 'delete',
    path: '/ratings/sample_rating_1',
    auth: { uid: 'player-123', email: 'player@gmail.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Attacker attempts self-promotion in /admins',
    operation: 'create',
    path: '/admins/attacker-uid',
    auth: { uid: 'attacker-uid', email: 'attacker@gmail.com', email_verified: true },
    payload: {
      email: 'attacker@gmail.com',
    },
    expected: 'PERMISSION_DENIED',
  },
];
