import {
  getProfileById,
  listProfiles as listProfilesService,
  upsertProfile as upsertProfileService,
  updateUserLocation,
} from '../services/profile.service.js';

export const listProfiles = async (req, res, next) => {
  try {
    const profiles = await listProfilesService();
    return res.json(profiles);
  } catch (error) {
    return next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

export const upsertProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, age, fitnessLevel } = req.body;
    if (!name || !age || !fitnessLevel) {
      return res.status(400).json({ message: 'Name, age, and fitness level are required' });
    }

    const profile = await upsertProfileService(userId, req.body);
    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { lat, lng, name } = req.body;
    const latitude = Number(lat ?? req.body.latitude);
    const longitude = Number(lng ?? req.body.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: 'Valid lat and lng are required' });
    }

    const profile = await updateUserLocation(userId, {
      lat: latitude,
      lng: longitude,
      name,
    });

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};
