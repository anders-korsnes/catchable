import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/require-auth.js';
import { listRegions, listTypes } from '../services/pokeapi.js';

export const referenceRouter = Router();

// Region/type lists are static reference data, but we still gate them behind auth
// so anonymous traffic can't spin up the cache. Cheap to relax later if needed.
referenceRouter.use(requireAuth);

referenceRouter.get(
  '/regions',
  asyncHandler(async (_req, res) => {
    const regions = await listRegions();
    res.json({ regions });
  }),
);

referenceRouter.get(
  '/types',
  asyncHandler(async (_req, res) => {
    const types = await listTypes();
    res.json({ types });
  }),
);
