module.exports = obj => typeof obj === 'object' && obj.type && (obj.type === 'Feature' || obj.type === 'FeatureCollection')
