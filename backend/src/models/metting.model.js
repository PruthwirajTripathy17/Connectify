import mongoose, { Schema } from "mongoose";

const mettingSchema = new Schema({
  user_id: { type: String, required: true },
  mettingCode: { type: String, required: true },
  date: { type: Date, default: Date.now, required: true },
});

const Metting = mongoose.model("Metting", mettingSchema);

export { Metting };
