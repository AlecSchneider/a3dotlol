import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly(
  "delete expired contact messages",
  { minuteUTC: 15 },
  internal.contact.purgeExpiredDeliveries,
);

export default crons;
