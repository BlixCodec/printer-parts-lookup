// Model compatibility mappings
// When searching for a model, also check these aliases
module.exports = {
  // AltaLink C8145/C8135 share consumables
  'C8145': ['C8135', 'C81xx', 'B8145', 'C8100', 'ALC8145', 'ALC8135'],
  'C8135': ['C8145', 'C81xx', 'B8145', 'C8100', 'ALC8145', 'ALC8135'],
  'C8235': ['C82xx', 'ALC8235'],
  
  // AltaLink B-series mono
  'B8255': ['B81xx', 'B82xx', 'B8255'],
  
  // WorkCentre 7835/7535 compatible
  'WC7835': ['WC7535', '7835', '7535', 'C8035', 'EC8036', 'EC7836'],
  
  // VersaLink B-series mono (share toner/drums)
  'B620': ['B600', 'B605', 'B605x', 'B610', 'B615', 'B625'],
  'B625': ['B600', 'B605', 'B605x', 'B610', 'B615', 'B620'],
  'B605': ['B600', 'B605x', 'B610', 'B615', 'B620', 'B625'],
  
  // VersaLink C-series color
  'C400': ['C405'],
  'C405': ['C400'],
  'C415': ['C415'],
  'C620': ['C620DN'],
  
  // WorkCentre 6655/Phaser 6600 family
  'WC6655': ['WC6605', 'PH6600', '6655', '6605'],
  
  // HP DesignJet
  'T790': ['HPDJT790', 'T790'],
  'T920': ['HPDJT920', 'T920'],
  
  // Phaser
  'Phaser3320': ['PH3320', '3320', 'Phaser 3320']
};