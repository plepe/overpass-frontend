module.exports = {
  ID_ONLY: 0,
  TAGS: 1,
  META: 2,
  MEMBERS: 4,
  BBOX: 8,
  GEOM: 16,
  CENTER: 32,
  EMBED_GEOM: 64,
  BODY: 128, // geometry for nodes, list of members for way/relation
  ALL: 63,
  DEFAULT: 13,
  DEFAULT_EXPORT: 23
}
