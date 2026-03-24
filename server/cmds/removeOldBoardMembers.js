require('dotenv').config();

const mongoose = require('mongoose');
const Board = require('../models/Board');

mongoose.set("strictQuery", true);
mongoose
    .connect(process.env.DB_CONNECTION)
    .catch((err) => console.log(err));

async function execute() {
    try {
        console.log('Starting migration: remove board old members field');

        const updateResult = await Board.updateMany(
            { members: { $exists: true } },
            { $unset: { members: 1 } }
        );

        console.log(`Removed 'members' field from ${updateResult.modifiedCount} boards.`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

execute();
