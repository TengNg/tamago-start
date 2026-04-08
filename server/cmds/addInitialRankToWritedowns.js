import "dotenv/config";

import mongoose from "mongoose";
import Writedown from "../models/Writedown.js";

mongoose.set("strictQuery", true);
mongoose
    .connect(process.env.DB_CONNECTION)
    .catch((err) => console.log(err));

async function execute() {
    try {
        const items = await Writedown.find({}).sort({ createdAt: 1 });

        const bulkOps = items.map((item, index) => ({
            updateOne: {
                filter: { _id: item._id },
                update: { $set: { order: (index).toString() } },
            },
        }));

        if (bulkOps.length > 0) {
            await Writedown.bulkWrite(bulkOps);
            console.log("[Writedown] Ranks updated successfully.");
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("[Writedown] Error updating ranks:", error);
        mongoose.connection.close();
    }
};

execute();
