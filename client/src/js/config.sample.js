angular
  .module("ricardo.config", [])
  .constant("BASE_API_URL", "http://localhost:5000")
  .constant("DEFAULT_REPORTING", "France")
  .constant("DEFAULT_PARTNER", "Italy")
  .constant("DEFAULT_CONTINENT", "Europe")
  .constant("TABLE_HEADERS", [
    { field: "reporting_id", displayName: "reporting" },
    { field: "partner_id", displayName: "partner" },
    { field: "type", displayName: "partner type" },
    { field: "year", displayName: "year" },
    { field: "imp", displayName: "import" },
    { field: "exp", displayName: "export" },
    { field: "total", displayName: "total" },
    { field: "currency", displayName: "currency" },
    { field: "sources", displayName: "source" },
  ])
  .constant("WORLD_TABLE_HEADERS", [
    { field: "reporting_id", displayName: "reporting" },
    { field: "type", displayName: "reporting type" },
    { field: "partner_id", displayName: "partner" },
    { field: "year", displayName: "year" },
    { field: "imp", displayName: "import" },
    { field: "exp", displayName: "export" },
    { field: "total", displayName: "total" },
    { field: "currency", displayName: "currency" },
    { field: "sources", displayName: "source" },
  ])
  .constant("METADATA_TABLE_HEADERS", [
    { field: "reporting", displayName: "reporting" },
    { field: "year", displayName: "year" },
    { field: "expimp", displayName: "expimp" },
    { field: "partner", displayName: "partners" },
    { field: "reference", displayName: "world partner" },
    { field: "partner_intersect", displayName: "bilateral partners" },
    { field: "source", displayName: "source" },
    { field: "sourcetype", displayName: "sourcetype" },
    { field: "continent", displayName: "continent" },
    { field: "type", displayName: "reporting type" },
  ]);
