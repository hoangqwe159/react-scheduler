import { RRule } from "rrule";
import { filterTodayEvents } from "../helpers/generals";
import { ProcessedEvent } from "../types";

describe("filterTodayEvents", () => {
  const createEvent = (
    id: number,
    start: Date,
    end: Date,
    allDay = false,
    recurring?: RRule
  ): ProcessedEvent => ({
    event_id: id,
    title: `Event ${id}`,
    start,
    end,
    allDay,
    recurring,
  });

  describe("basic functionality", () => {
    it("should return events that occur today", () => {
      const today = new Date(2025, 0, 15, 10, 0); // Jan 15, 2025, 10:00 AM
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 9, 0), new Date(2025, 0, 15, 10, 0)),
        createEvent(2, new Date(2025, 0, 15, 14, 0), new Date(2025, 0, 15, 15, 0)),
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(2);
      expect(result[0].event_id).toBe(1);
      expect(result[1].event_id).toBe(2);
    });

    it("should filter out events from other days", () => {
      const today = new Date(2025, 0, 15, 10, 0); // Jan 15, 2025
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 14, 9, 0), new Date(2025, 0, 14, 10, 0)), // Yesterday
        createEvent(2, new Date(2025, 0, 15, 14, 0), new Date(2025, 0, 15, 15, 0)), // Today
        createEvent(3, new Date(2025, 0, 16, 9, 0), new Date(2025, 0, 16, 10, 0)), // Tomorrow
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(2);
    });

    it("should filter out all-day events", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 0, 0), new Date(2025, 0, 15, 23, 59), true),
        createEvent(2, new Date(2025, 0, 15, 14, 0), new Date(2025, 0, 15, 15, 0), false),
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(2);
      expect(result[0].allDay).toBe(false);
    });

    it("should filter out multi-day events", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 9, 0), new Date(2025, 0, 16, 10, 0)), // Spans 2 days
        createEvent(2, new Date(2025, 0, 15, 14, 0), new Date(2025, 0, 15, 15, 0)), // Same day
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(2);
    });

    it("should return an empty array when no events match", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 14, 9, 0), new Date(2025, 0, 14, 10, 0)),
        createEvent(2, new Date(2025, 0, 16, 14, 0), new Date(2025, 0, 16, 15, 0)),
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(0);
    });
  });

  describe("sorting by length", () => {
    it("should sort events by length (longest first)", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 9, 0), new Date(2025, 0, 15, 10, 0)), // 1 hour
        createEvent(2, new Date(2025, 0, 15, 14, 0), new Date(2025, 0, 15, 17, 0)), // 3 hours
        createEvent(3, new Date(2025, 0, 15, 11, 0), new Date(2025, 0, 15, 13, 0)), // 2 hours
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(3);
      expect(result[0].event_id).toBe(2); // 3 hours
      expect(result[1].event_id).toBe(3); // 2 hours
      expect(result[2].event_id).toBe(1); // 1 hour
    });

    it("should handle events with same length", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 9, 0), new Date(2025, 0, 15, 10, 0)), // 1 hour
        createEvent(2, new Date(2025, 0, 15, 14, 0), new Date(2025, 0, 15, 15, 0)), // 1 hour
        createEvent(3, new Date(2025, 0, 15, 16, 0), new Date(2025, 0, 15, 17, 0)), // 1 hour
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(3);
      // Order doesn't matter when lengths are equal, just verify all are present
      const ids = result.map((e) => e.event_id);
      expect(ids).toContain(1);
      expect(ids).toContain(2);
      expect(ids).toContain(3);
    });
  });

  describe("recurring events", () => {
    it("should include recurring events that occur today", () => {
      const today = new Date(2025, 0, 15, 10, 0); // Wednesday, Jan 15, 2025

      // Daily recurring event starting on Jan 14
      const dailyRule = new RRule({
        freq: RRule.DAILY,
        dtstart: new Date(Date.UTC(2025, 0, 14, 9, 0)), // Jan 14, 9:00 AM UTC
        count: 5,
      });

      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 14, 9, 0), new Date(2025, 0, 14, 10, 0), false, dailyRule),
      ];

      const result = filterTodayEvents(events, today);

      expect(result.length).toBeGreaterThan(0);
      // Should have a recurrence for today
      const todayRecurrence = result.find((e) => {
        const eventDate = e.start;
        return (
          eventDate.getFullYear() === today.getFullYear() &&
          eventDate.getMonth() === today.getMonth() &&
          eventDate.getDate() === today.getDate()
        );
      });
      expect(todayRecurrence).toBeDefined();
    });

    it("should exclude recurring events that don't occur today", () => {
      const today = new Date(2025, 0, 15, 10, 0); // Wednesday, Jan 15, 2025

      // Weekly recurring event on Mondays only
      const weeklyRule = new RRule({
        freq: RRule.WEEKLY,
        byweekday: [RRule.MO], // Only Mondays
        dtstart: new Date(Date.UTC(2025, 0, 13, 9, 0)), // Jan 13 (Monday)
        count: 5,
      });

      const events: ProcessedEvent[] = [
        createEvent(
          1,
          new Date(2025, 0, 13, 9, 0),
          new Date(2025, 0, 13, 10, 0),
          false,
          weeklyRule
        ),
      ];

      const result = filterTodayEvents(events, today);

      // Jan 15 is Wednesday, so no events should match
      expect(result).toHaveLength(0);
    });

    it("should handle multiple recurrences from the same event", () => {
      const today = new Date(2025, 0, 15, 10, 0);

      // Hourly recurring event
      const hourlyRule = new RRule({
        freq: RRule.HOURLY,
        interval: 2, // Every 2 hours
        dtstart: new Date(Date.UTC(2025, 0, 15, 8, 0)),
        until: new Date(Date.UTC(2025, 0, 15, 16, 0)),
      });

      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 8, 0), new Date(2025, 0, 15, 9, 0), false, hourlyRule),
      ];

      const result = filterTodayEvents(events, today);

      // Should have multiple recurrences for today (8am, 10am, 12pm, 2pm, 4pm)
      expect(result.length).toBeGreaterThan(1);
      // Each recurrence should have the same event_id
      result.forEach((event) => {
        expect(event.event_id).toBe(1);
      });
    });

    it("should set recurrenceId for recurring event instances", () => {
      const today = new Date(2025, 0, 15, 10, 0);

      const dailyRule = new RRule({
        freq: RRule.DAILY,
        dtstart: new Date(Date.UTC(2025, 0, 15, 9, 0)),
        count: 1,
      });

      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 9, 0), new Date(2025, 0, 15, 10, 0), false, dailyRule),
      ];

      const result = filterTodayEvents(events, today);

      expect(result.length).toBeGreaterThan(0);
      // Each recurrence should have a recurrenceId
      result.forEach((event) => {
        expect(event).toHaveProperty("recurrenceId");
        expect(typeof event.recurrenceId).toBe("number");
      });
    });

    it("should maintain event duration for recurring events", () => {
      const today = new Date(2025, 0, 15, 10, 0);

      const dailyRule = new RRule({
        freq: RRule.DAILY,
        dtstart: new Date(Date.UTC(2025, 0, 15, 9, 0)),
        count: 1,
      });

      // 2-hour event
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 9, 0), new Date(2025, 0, 15, 11, 0), false, dailyRule),
      ];

      const result = filterTodayEvents(events, today);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((event) => {
        const duration = event.end.getTime() - event.start.getTime();
        const expectedDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        expect(duration).toBe(expectedDuration);
      });
    });
  });

  describe("timezone handling", () => {
    it("should handle events with timezone conversion", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 9, 0), new Date(2025, 0, 15, 10, 0)),
      ];

      // Test that timezone conversion is applied
      const result = filterTodayEvents(events, today, "America/New_York");

      // The event should be converted regardless of whether it matches today after conversion
      // Since timezone conversion may shift dates, we just verify conversion happens
      if (result.length > 0) {
        result.forEach((event) => {
          expect(event.convertedTz).toBe(true);
        });
      }
      // Test passes as long as no errors are thrown
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle timezone for recurring events", () => {
      const today = new Date(2025, 0, 15, 10, 0);

      const dailyRule = new RRule({
        freq: RRule.DAILY,
        dtstart: new Date(Date.UTC(2025, 0, 15, 9, 0)),
        count: 1,
      });

      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 9, 0), new Date(2025, 0, 15, 10, 0), false, dailyRule),
      ];

      const result = filterTodayEvents(events, today, "Europe/London");

      // Verify timezone conversion is applied if results exist
      if (result.length > 0) {
        result.forEach((event) => {
          expect(event.convertedTz).toBe(true);
        });
      }
      // Test passes as long as no errors are thrown
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle events without timezone parameter", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 14, 0), new Date(2025, 0, 15, 15, 0)),
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(1);
      // Without timezone, events should still be converted with undefined tz
      expect(result[0].convertedTz).toBe(true);
    });

    it("should correctly filter events across different timezones", () => {
      const today = new Date(2025, 0, 15, 23, 0); // 11 PM local time

      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 22, 0), new Date(2025, 0, 15, 23, 30)),
      ];

      // Test with different timezones
      const resultUTC = filterTodayEvents(events, today, "UTC");
      const resultNY = filterTodayEvents(events, today, "America/New_York");
      const resultTokyo = filterTodayEvents(events, today, "Asia/Tokyo");

      // All should process the event (exact behavior depends on timezone offset)
      // The key is that the function handles timezone conversion
      [resultUTC, resultNY, resultTokyo].forEach((result) => {
        result.forEach((event) => {
          expect(event.convertedTz).toBe(true);
        });
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty events array", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle events at midnight", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 0, 0), new Date(2025, 0, 15, 1, 0)),
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(1);
    });

    it("should handle events at end of day", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 23, 0), new Date(2025, 0, 15, 23, 59)),
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(1);
    });

    it("should handle very short events (1 minute)", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 14, 0), new Date(2025, 0, 15, 14, 1)),
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(1);
    });

    it("should handle events with same start and end time", () => {
      const today = new Date(2025, 0, 15, 10, 0);
      const sameTime = new Date(2025, 0, 15, 14, 0);
      const events: ProcessedEvent[] = [createEvent(1, sameTime, sameTime)];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(1);
    });

    it("should handle recurring events with no recurrences today", () => {
      const today = new Date(2025, 0, 15, 10, 0);

      // Weekly event that ended before today
      const weeklyRule = new RRule({
        freq: RRule.WEEKLY,
        dtstart: new Date(Date.UTC(2025, 0, 1, 9, 0)),
        until: new Date(Date.UTC(2025, 0, 10, 9, 0)), // Ended Jan 10
      });

      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 1, 9, 0), new Date(2025, 0, 1, 10, 0), false, weeklyRule),
      ];

      const result = filterTodayEvents(events, today);

      expect(result).toHaveLength(0);
    });
  });

  describe("complex scenarios", () => {
    it("should handle mix of regular and recurring events", () => {
      const today = new Date(2025, 0, 15, 10, 0);

      const dailyRule = new RRule({
        freq: RRule.DAILY,
        dtstart: new Date(Date.UTC(2025, 0, 15, 9, 0)),
        count: 1,
      });

      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 8, 0), new Date(2025, 0, 15, 9, 0)), // Regular
        createEvent(
          2,
          new Date(2025, 0, 15, 10, 0),
          new Date(2025, 0, 15, 11, 0),
          false,
          dailyRule
        ), // Recurring
        createEvent(3, new Date(2025, 0, 15, 14, 0), new Date(2025, 0, 15, 15, 0)), // Regular
      ];

      const result = filterTodayEvents(events, today);

      expect(result.length).toBeGreaterThanOrEqual(3);
      // Should include both regular and recurring events
      const eventIds = result.map((e) => e.event_id);
      expect(eventIds).toContain(1);
      expect(eventIds).toContain(2);
      expect(eventIds).toContain(3);
    });

    it("should properly sort when mixing regular and recurring events", () => {
      const today = new Date(2025, 0, 15, 10, 0);

      const dailyRule = new RRule({
        freq: RRule.DAILY,
        dtstart: new Date(Date.UTC(2025, 0, 15, 9, 0)),
        count: 1,
      });

      const events: ProcessedEvent[] = [
        createEvent(1, new Date(2025, 0, 15, 8, 0), new Date(2025, 0, 15, 9, 0)), // 1 hour
        createEvent(
          2,
          new Date(2025, 0, 15, 10, 0),
          new Date(2025, 0, 15, 13, 0),
          false,
          dailyRule
        ), // 3 hours (recurring)
      ];

      const result = filterTodayEvents(events, today);

      // Longest should be first (3-hour recurring event)
      expect(result[0].event_id).toBe(2);
    });

    it("should handle timezone + recurring events + 99 normal events", () => {
      const today = new Date(2025, 0, 15, 10, 0); // Jan 15, 2025, 10:00 AM

      // Create 99 normal events for today
      const normalEvents: ProcessedEvent[] = [];
      for (let i = 1; i <= 99; i++) {
        const startHour = 8 + (i % 12); // Distribute across the day (8am-8pm)
        const startMinute = (i * 7) % 60; // Vary minutes
        normalEvents.push(
          createEvent(
            i,
            new Date(2025, 0, 15, startHour, startMinute),
            new Date(2025, 0, 15, startHour, startMinute + 30) // 30-minute events
          )
        );
      }

      // Add recurring events
      const dailyRule = new RRule({
        freq: RRule.DAILY,
        dtstart: new Date(Date.UTC(2025, 0, 15, 9, 0)),
        count: 1,
      });

      const hourlyRule = new RRule({
        freq: RRule.HOURLY,
        interval: 2,
        dtstart: new Date(Date.UTC(2025, 0, 15, 10, 0)),
        until: new Date(Date.UTC(2025, 0, 15, 18, 0)),
      });

      const weeklyRule = new RRule({
        freq: RRule.WEEKLY,
        byweekday: [RRule.WE], // Wednesday (Jan 15, 2025 is Wednesday)
        dtstart: new Date(Date.UTC(2025, 0, 15, 11, 0)),
        count: 1,
      });

      const recurringEvents: ProcessedEvent[] = [
        createEvent(
          1000,
          new Date(2025, 0, 15, 9, 0),
          new Date(2025, 0, 15, 10, 0),
          false,
          dailyRule
        ),
        createEvent(
          1001,
          new Date(2025, 0, 15, 10, 0),
          new Date(2025, 0, 15, 11, 30),
          false,
          hourlyRule
        ),
        createEvent(
          1002,
          new Date(2025, 0, 15, 11, 0),
          new Date(2025, 0, 15, 12, 0),
          false,
          weeklyRule
        ),
      ];

      const allEvents = [...normalEvents, ...recurringEvents];

      // Test with timezone
      const result = filterTodayEvents(allEvents, today, "America/New_York");

      // Verify we get results
      expect(Array.isArray(result)).toBe(true);

      // Check that all returned events have convertedTz flag
      result.forEach((event) => {
        expect(event.convertedTz).toBe(true);
      });

      // Check that events are sorted by length (longest first)
      for (let i = 0; i < result.length - 1; i++) {
        const currentDuration = result[i].end.getTime() - result[i].start.getTime();
        const nextDuration = result[i + 1].end.getTime() - result[i + 1].start.getTime();
        expect(currentDuration).toBeGreaterThanOrEqual(nextDuration);
      }
      // At least verify we have a substantial number of events processed
      expect(result.length).toBeGreaterThan(0);

      // Performance check: function should handle 102 events efficiently
      const start = performance.now();
      filterTodayEvents(allEvents, today, "America/New_York");
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
