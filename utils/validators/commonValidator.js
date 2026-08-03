const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

const idParamSchema = z.object({
  id: objectIdSchema,
});

module.exports = {
  objectIdSchema,
  idParamSchema,
};
