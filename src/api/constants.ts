export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const Permissions = {
  PETS_READ: "pets:read",
  PETS_WRITE: "pets:write",
  PETS_DELETE: "pets:delete",
  VACCINATIONS_WRITE: "vaccinations:write",
  EVENTS_WRITE: "events:write",
  MEMBERS_READ: "members:read",
  MEMBERS_WRITE: "members:write",
  REQUESTS_READ: "requests:read",
  REQUESTS_WRITE: "requests:write",
} as const;
