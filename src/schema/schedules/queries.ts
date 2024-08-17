import { builder } from "~/builder";
import { selectScheduleSchema } from "~/datasources/db/schema";
import { applicationError, ServiceErrors } from "~/errors";
import { schedulesFetcher } from "~/schema/schedules/schedulesFetcher";
import { ScheduleRef } from "~/schema/schedules/types";

builder.queryField("schedule", (t) =>
  t.field({
    description: "Get a schedule by its ID",
    type: ScheduleRef,
    args: {
      scheduleId: t.arg.string({ required: true }),
    },
    resolve: async (root, { scheduleId }, { DB, logger }) => {
      const schedules = await schedulesFetcher.searchSchedules({
        DB,
        search: { scheduleIds: [scheduleId] },
      });
      const schedule = schedules[0];

      if (!schedule) {
        throw applicationError(
          "Schedule not found",
          ServiceErrors.NOT_FOUND,
          logger,
        );
      }

      return selectScheduleSchema.parse(schedule);
    },
  }),
);
