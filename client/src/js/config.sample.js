angular
  .module("ricardo.config", [])
  .constant("BASE_API_URL", "http://localhost:5000")
  .constant("DEFAULT_REPORTING", "France")
  .constant("DEFAULT_PARTNER", "Italy")
  .constant("DEFAULT_CONTINENT", "Europe")
  .constant("DEFAULT_FLOW_TYPE", "bilateral")
  .constant("DEFAULT_CURRENCY", "sterling-pound")
  .constant("TABLE_HEADERS", [
    { field: "reporting_id", displayName: "reporting" },
    { field: "partner_id", displayName: "partner", sort: { direction: "asc", priority: 1 } },
    { field: "type", displayName: "partner type" },
    { field: "year", displayName: "year", sort: { direction: "asc", priority: 0 } },
    { field: "imp", displayName: "import" },
    { field: "exp", displayName: "export" },
    { field: "total", displayName: "total" },
    { field: "currency", displayName: "currency" },
    { field: "sources", displayName: "source" },
  ])
  .constant("WORLD_TABLE_HEADERS", [
    { field: "reporting_id", displayName: "reporting" },
    { field: "type", displayName: "reporting type" },
    { field: "partner_id", displayName: "partner", sort: { direction: "asc", priority: 1 } },
    { field: "year", displayName: "year", sort: { direction: "asc", priority: 0 } },
    { field: "imp", displayName: "import" },
    { field: "exp", displayName: "export" },
    { field: "total", displayName: "total" },
    { field: "currency", displayName: "currency" },
    { field: "sources", displayName: "source" },
  ])
  .constant("METADATA_TABLE_HEADERS", [
    { field: "reporting", displayName: "reporting" },
    { field: "year", displayName: "year", sort: { direction: "asc", priority: 0 } },
    { field: "expimp", displayName: "expimp" },
    { field: "partner", displayName: "partners", sort: { direction: "asc", priority: 1 } },
    { field: "reference", displayName: "world partner" },
    { field: "partner_intersect", displayName: "bilateral partners" },
    { field: "source", displayName: "source" },
    { field: "sourcetype", displayName: "sourcetype" },
    { field: "continent", displayName: "continent" },
    { field: "type", displayName: "reporting type" },
  ])
  .constant("LINE_CHART_CURRENCY", [
    { type: { value: "sterling", writable: true }, name: { value: "Sterling", writable: true } },
    { type: { value: "value", writable: true }, name: { value: "Percent", writable: true } },
  ])
  .constant("LINE_CHART_FLOW_TYPES", [
    { type: { value: "total", writable: true }, name: { value: "Total", writable: true } },
    { type: { value: "exp", writable: true }, name: { value: "Exports", writable: true } },
    { type: { value: "imp", writable: true }, name: { value: "Imports", writable: true } },
  ]);
