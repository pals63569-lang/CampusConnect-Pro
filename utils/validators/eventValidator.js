const { z } = require("zod");

const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["Tech", "Cultural", "Sports", "Workshop", "Seminar", "Other"]),
  date: z.string().or(z.date()),
  time: z.string().optional(),
  venue: z.string().min(2, "Venue is required"),
  capacity: z.number().int().positive().or(z.string().transform((val) => parseInt(val, 10))),
  departmentName: z.string().optional(),
  tags: z.string().or(z.array(z.string())).optional(),
  speakerBio: z.string().optional(),
  speakerImage: z.string().optional(),
  agenda: z.string().or(z.array(z.any())).optional(),
});

const eventQuerySchema = z.object({
  page: z.string().transform((v) => parseInt(v, 10)).optional().default("1"),
  limit: z.string().transform((v) => parseInt(v, 10)).optional().default("10"),
  search: z.string().optional(),
  category: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(["Upcoming", "Ongoing", "Completed", "Cancelled"]).optional(),
  sort: z.string().optional(),
});

module.exports = {
  createEventSchema,
  eventQuerySchema,
};
