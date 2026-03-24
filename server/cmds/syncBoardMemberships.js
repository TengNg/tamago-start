require('dotenv').config();

const mongoose = require('mongoose');
const Board = require('../models/Board');
const BoardMembership = require('../models/BoardMembership');
const { DEFAULT_BOARD_PERMISSIONS } = require('../data/permissions');

mongoose.set("strictQuery", true);
mongoose
    .connect(process.env.DB_CONNECTION)
    .catch((err) => console.log(err));

async function execute() {
    try {
        console.log('Starting migration: sync BoardMembership documents with old board members field');

        const boards = await Board.find({})
            .select('_id createdBy members')
            .lean();

        console.log(`Found ${boards.length} boards to process.`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const board of boards) {
            const boardId = board._id;
            const ownerId = board.createdBy;
            const oldMembers = board.members || [];

            const ownerExists = await BoardMembership.exists({ boardId, userId: ownerId });
            if (!ownerExists) {
                await BoardMembership.create({
                    boardId,
                    userId: ownerId,
                    role: 'owner',
                    permissions: DEFAULT_BOARD_PERMISSIONS
                });
                createdCount++;
                console.log(`Created owner membership for board ${boardId}`);
            } else {
                skippedCount++;
            }

            for (const userId of oldMembers) {
                if (userId.toString() === ownerId.toString()) continue;

                const exists = await BoardMembership.exists({ boardId, userId });

                if (!exists) {
                    await BoardMembership.create({
                        boardId,
                        userId,
                        role: 'member',
                        permissions: DEFAULT_BOARD_PERMISSIONS
                    });
                    createdCount++;
                    console.log(`Created member for board ${boardId} →  user ${userId}`);
                } else {
                    skippedCount++;
                }
            }
        }

        console.log('Migration completed!');
        console.log(`-> New memberships created : ${createdCount}`);
        console.log(`-> Skipped (already existed): ${skippedCount}`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

execute();
