import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly(
  "delete expired contact messages",
  { minuteUTC: 15 },
  internal.contact.purgeExpiredDeliveries,
);

crons.hourly(
  "delete expired email consent records",
  { minuteUTC: 30 },
  internal.newsletter.purgeExpired,
);

export default crons;
