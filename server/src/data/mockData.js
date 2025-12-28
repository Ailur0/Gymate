export const mockProfiles = [
  {
    id: 'u1',
    name: 'Sarah',
    age: 24,
    gender: 'female',
    fitnessLevel: 'Beginner',
    primaryGoal: 'Lose weight',
    workoutTimes: ['Morning'],
    location: {
      city: 'Austin',
      latitude: 30.2672,
      longitude: -97.7431,
      distanceKm: 1.2,
    },
    interests: ['HIIT', 'Yoga'],
    bio: 'Marketing pro getting back into a routine.',
    verified: true,
  },
  {
    id: 'u2',
    name: 'Mike',
    age: 28,
    gender: 'male',
    fitnessLevel: 'Advanced',
    primaryGoal: 'Powerlifting meet',
    workoutTimes: ['Evening'],
    location: {
      city: 'Austin',
      latitude: 30.2600,
      longitude: -97.7500,
      distanceKm: 3.5,
    },
    interests: ['Powerlifting', 'CrossFit'],
    bio: 'Need a spotter to chase PRs.',
    verified: false,
  },
  {
    id: 'u3',
    name: 'Emma',
    age: 26,
    gender: 'female',
    fitnessLevel: 'Intermediate',
    primaryGoal: 'Try new workouts',
    workoutTimes: ['Afternoon', 'Evening'],
    location: {
      city: 'Austin',
      latitude: 30.2500,
      longitude: -97.7300,
      distanceKm: 2.1,
    },
    interests: ['Yoga', 'HIIT', 'Functional'],
    bio: 'Always down for a class swap.',
    verified: true,
  },
];

export const mockMatches = [
  {
    id: 'm1',
    members: ['u1', 'u2'],
    createdAt: Date.now() - 1000 * 60 * 60,
    lastMessage: 'See you at 6 PM!',
  },
];

export const mockMessages = {
  m1: [
    {
      id: 'msg1',
      senderId: 'u1',
      body: 'Want to hit chest day tomorrow?',
      sentAt: Date.now() - 1000 * 60 * 55,
    },
    {
      id: 'msg2',
      senderId: 'u2',
      body: 'Absolutely, 6 PM works?',
      sentAt: Date.now() - 1000 * 60 * 53,
    },
  ],
};
