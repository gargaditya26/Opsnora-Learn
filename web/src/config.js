const publicValue=name=>String(import.meta.env[name]||'').trim();

export const publicConfig=Object.freeze({
  supportEmail:publicValue('VITE_SUPPORT_EMAIL'),
  adsenseClientId:publicValue('VITE_ADSENSE_CLIENT_ID')
});
