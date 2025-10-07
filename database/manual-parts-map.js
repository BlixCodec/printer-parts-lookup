// Manual part mappings for equipment where BarCloud descriptions
// don't include model codes in parseable format

module.exports = {
  // HP DesignJet T790 (44" wide format)
  'T790': [
    'C9403A',  // HP 72 Matte Black 130ml
    'C9370A',  // HP 72 Photo Black 130ml (if you stock it)
    'C9371A',  // HP 72 Cyan 130ml
    'C9372A',  // HP 72 Magenta 130ml
    'C9373A',  // HP 72 Yellow 130ml
    'C9374A',  // HP 72 Gray 130ml
  ],
  
  // HP DesignJet T920 (36" wide format)
  'T920': [
    'B3P06A',   // Printhead
    'C1Q12A',   // HP 727 300ml Matte Black
    'B3P20A',   // HP 727 130ml Magenta
    'B3P21A',   // HP 727 130ml Yellow
    'B3P23A',   // HP 727 130ml Photo Black
    'B3P22A',   // HP 727 130ml Matte Black (if you stock it)
    'B3P19A',   // HP 727 130ml Cyan (if you stock it)
    'B3P24A',   // HP 727 130ml Gray (if you stock it)
  ],
  
  // VersaLink B605S (same as B605)
  'B605': [
    '106R03946', // Already mapped but ensuring B605S variant works
    '101R00582', // Drum
    '115R00139', // Fuser
    '116R00009', // Transfer Roller
  ],
  
  // HP DesignJet T7100 (large format)
  'T7100': [
    'CM995A',    // 400ml Grey
  ],
  
  // Zebra label printers (if you add consumables later)
  'GX430': [
    'P1076000-006',  // Power supply (marked Do Not Order)
  ],
  
  'GX420': [
    'P1076000-006',  // Power supply (marked Do Not Order)
  ],
};