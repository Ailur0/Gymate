import prisma from '../lib/prisma.js';
import { buildProfileUpdate, mapUserToProfile } from '../utils/profile.js';

export const getProfileById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  return mapUserToProfile(user);
};

export const listProfiles = async () => {
  const users = await prisma.user.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
  return users.map(mapUserToProfile);
};

export const upsertProfile = async (id, payload) => {
  const data = buildProfileUpdate(payload);
  const user = await prisma.user.update({
    where: { id },
    data,
  });
  return mapUserToProfile(user);
};

export const updateUserLocation = async (id, { lat, lng, name = null }) => {
  const user = await prisma.user.update({
    where: { id },
    data: {
      locationLat: lat,
      locationLng: lng,
      locationName: name,
    },
  });

  return mapUserToProfile(user);
};
