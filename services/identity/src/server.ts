import dotenv from 'dotenv';
dotenv.config();

import { startIdentityServer } from "./infrastructure/server";

export const startIdentityService = startIdentityServer;

startIdentityServer();
