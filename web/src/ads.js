import {publicConfig} from './config.js';

// Future ad integration boundary. It intentionally renders nothing until a
// publisher ID and an age-appropriate, non-personalized policy are configured.
export const adsEnabled=Boolean(publicConfig.adsenseClientId);
export function AdSlot(){return ''}
