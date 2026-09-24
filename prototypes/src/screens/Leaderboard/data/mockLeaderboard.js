/**
 * data/mockLeaderboard.js
 *
 * Seed data for development, Storybook, and unit tests.
 * Replace with real API calls in production via the useLeaderboard hook.
 *
 * @typedef {{ id: number, name: string, state: string, xp: number, streak: number }} Farmer
 *
 * @typedef {{
 *   id:      number,
 *   name:    string,
 *   state:   string,
 *   weekly:  { xp: number, streak: number, rank: number },
 *   monthly: { xp: number, streak: number, rank: number },
 * }} CurrentUser
 */

/** @type {Farmer[]} Weekly leaderboard — pre-sorted descending by xp */
export const MOCK_WEEKLY_DATA = [
  { id:  1, name: "Rajinder Singh",    state: "Punjab",          xp: 12450, streak: 45 },
  { id:  2, name: "Suresh Patel",      state: "Gujarat",         xp: 11890, streak: 32 },
  { id:  3, name: "Ramesh Yadav",      state: "Uttar Pradesh",   xp: 11200, streak: 28 },
  { id:  4, name: "Priya Kumari",      state: "Haryana",         xp: 10650, streak: 38 },
  { id:  5, name: "Mohan Reddy",       state: "Andhra Pradesh",  xp:  9800, streak: 21 },
  { id:  6, name: "Kavitha Devi",      state: "Tamil Nadu",      xp:  9450, streak: 30 },
  { id:  7, name: "Gurpreet Kaur",     state: "Punjab",          xp:  9120, streak: 27 },
  { id:  8, name: "Narayan Sharma",    state: "Rajasthan",       xp:  8750, streak: 19 },
  { id:  9, name: "Sunita Bai",        state: "Madhya Pradesh",  xp:  8430, streak: 33 },
  { id: 10, name: "Arun Patil",        state: "Maharashtra",     xp:  8100, streak: 15 },
  { id: 11, name: "Lakshmidevi",       state: "Karnataka",       xp:  7890, streak: 24 },
  { id: 12, name: "Harish Bhatt",      state: "Gujarat",         xp:  7650, streak: 18 },
  { id: 13, name: "Meera Singh",       state: "Uttar Pradesh",   xp:  7320, streak: 22 },
  { id: 14, name: "Santosh Kumar",     state: "Bihar",           xp:  7100, streak: 12 },
  { id: 15, name: "Pooja Nair",        state: "Kerala",          xp:  6950, streak: 29 },
  { id: 16, name: "Dinesh Verma",      state: "Haryana",         xp:  6780, streak: 16 },
  { id: 17, name: "Rekha Rani",        state: "West Bengal",     xp:  6540, streak: 20 },
  { id: 18, name: "Mahesh Desai",      state: "Maharashtra",     xp:  6290, streak: 14 },
  { id: 19, name: "Sushila Devi",      state: "Rajasthan",       xp:  6100, streak: 25 },
  { id: 20, name: "Prakash Naidu",     state: "Andhra Pradesh",  xp:  5920, streak: 11 },
  { id: 21, name: "Anita Chatterjee",  state: "West Bengal",     xp:  5750, streak: 17 },
  { id: 22, name: "Rajan Pillai",      state: "Kerala",          xp:  5600, streak: 23 },
  { id: 23, name: "Neelam Maurya",     state: "Uttar Pradesh",   xp:  5450, streak:  9 },
  { id: 24, name: "Baljit Kaur",       state: "Punjab",          xp:  5280, streak: 31 },
  { id: 25, name: "Gopal Krishnan",    state: "Tamil Nadu",      xp:  5120, streak: 13 },
  { id: 26, name: "Savitri Pandey",    state: "Madhya Pradesh",  xp:  4960, streak: 26 },
  { id: 27, name: "Umesh Gupta",       state: "Bihar",           xp:  4810, streak:  8 },
  { id: 28, name: "Shantha Gowda",     state: "Karnataka",       xp:  4670, streak: 19 },
  { id: 29, name: "Vikram Choudhary",  state: "Rajasthan",       xp:  4520, streak: 14 },
  { id: 30, name: "Geeta Kumawat",     state: "Gujarat",         xp:  4380, streak: 22 },
  { id: 31, name: "Ashok Tanwar",      state: "Haryana",         xp:  4230, streak: 10 },
  { id: 32, name: "Bhavana Rao",       state: "Telangana",       xp:  4100, streak: 16 },
  { id: 33, name: "Satyanarayan",      state: "Andhra Pradesh",  xp:  3960, streak:  7 },
  { id: 34, name: "Kamla Devi",        state: "Uttar Pradesh",   xp:  3820, streak: 20 },
  { id: 35, name: "Tejpal Singh",      state: "Punjab",          xp:  3690, streak: 18 },
  { id: 36, name: "Indumati Patil",    state: "Maharashtra",     xp:  3550, streak: 12 },
  { id: 37, name: "Naresh Maida",      state: "Telangana",       xp:  3420, streak:  6 },
  { id: 38, name: "Durga Prasad",      state: "Bihar",           xp:  3290, streak: 15 },
  { id: 39, name: "Manju Bala",        state: "Haryana",         xp:  3160, streak:  9 },
  { id: 40, name: "Veeraswamy",        state: "Karnataka",       xp:  3040, streak: 11 },
  { id: 41, name: "Sudha Tiwari",      state: "Madhya Pradesh",  xp:  2920, streak: 13 },
  { id: 42, name: "Ranjit Borah",      state: "Assam",           xp:  2800, streak:  8 },
  { id: 43, name: "Padma Vasudevan",   state: "Kerala",          xp:  2690, streak: 17 },
  { id: 44, name: "Chetan Jagdale",    state: "Maharashtra",     xp:  2580, streak:  5 },
  { id: 45, name: "Hema Srinivasan",   state: "Tamil Nadu",      xp:  2470, streak: 10 },
  { id: 46, name: "Bhupender Malik",   state: "Haryana",         xp:  2360, streak:  7 },
  { id: 47, name: "Sarla Meena",       state: "Rajasthan",       xp:  2250, streak:  4 },
  { id: 48, name: "Raghunath Das",     state: "West Bengal",     xp:  2140, streak: 12 },
  { id: 49, name: "Komal Agarwal",     state: "Uttar Pradesh",   xp:  2030, streak:  6 },
  { id: 50, name: "Thimmaiah",         state: "Karnataka",       xp:  1930, streak:  9 },
];

/**
 * Monthly data — same farmers with cumulative (higher) XP and a deterministic
 * re-ordering. Generated via a pure transform so the ranking shift is
 * reproducible and SSR-safe (no Math.random).
 *
 * @type {Farmer[]}
 */
export const MOCK_MONTHLY_DATA = [...MOCK_WEEKLY_DATA]
  .map((f) => ({
    ...f,
    xp:     Math.floor(f.xp * 3.8 + (f.id * 113) % 900),
    streak: Math.min(f.streak + ((f.id * 3) % 20) + 10, 90),
  }))
  .sort((a, b) => b.xp - a.xp);

/** @type {CurrentUser} Logged-in user — outside top 50 in both periods */
export const MOCK_CURRENT_USER = {
  id:      999,
  name:    "Arjun Mehta",
  state:   "Gujarat",
  weekly:  { xp: 1420, streak:  8, rank: 67 },
  monthly: { xp: 4890, streak: 22, rank: 54 },
};
