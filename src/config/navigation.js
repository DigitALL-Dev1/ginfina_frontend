import rawGroups from './navigation.json';
import screenSpecs from './screenSpecs.json';

const byId = Object.fromEntries(screenSpecs.map((screen) => [screen.id, screen]));

export const navigationGroups = Object.entries(rawGroups).map(([label, config]) => {
  // Handle both array format (simple) and object format (with sections)
  if (Array.isArray(config)) {
    return {
      label,
      items: config.map((id) => byId[id]).filter(Boolean),
    };
  } else {
    // New format with sections
    return {
      label,
      items: config.screens ? config.screens.map((id) => byId[id]).filter(Boolean) : [],
      sections: config.sections || [],
    };
  }
});

export const screenById = byId;
