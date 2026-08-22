import "dotenv/config";

import mongoose from 'mongoose';
import User from '../models/User.js';
import Board from '../models/Board.js';
import BoardMembership from '../models/BoardMembership.js';
import List from '../models/List.js';
import Card from '../models/Card.js';

mongoose.set("strictQuery", true);
mongoose
    .connect(process.env.DB_CONNECTION)
    .catch((err) => console.log(err));

const LISTS = [
    { title: "Backlog", order: "a" },
    { title: "To Do", order: "b" },
    { title: "In Progress", order: "c" },
    { title: "Review", order: "d" },
    { title: "Done", order: "e" },
];

const CARDS = [
    {
        listTitle: "Backlog",
        cards: [
            {
                title: "Set up CI/CD pipeline",
                description: "Configure GitHub Actions for automated testing and deployment to staging.",
                priorityLevel: "high",
                order: "a"
            },
            {
                title: "Write API documentation",
                description: "Document all REST endpoints with request/response examples using OpenAPI spec.",
                priorityLevel: "medium",
                order: "b"
            },
            {
                title: "Add dark mode support",
                description: "Implement a dark mode toggle that persists user preference in localStorage.",
                priorityLevel: "low",
                order: "c"
            },
            {
                title: "Accessibility audit",
                description: "Run WCAG 2.1 AA audit on all pages and fix reported violations.",
                priorityLevel: "medium",
                order: "d"
            },
            {
                title: "Upgrade dependencies",
                description: "Bump all npm packages to latest semver-compatible versions and fix breaking changes.",
                priorityLevel: "low",
                order: "f"
            },
        ],
    },
    {
        listTitle: "To Do",
        cards: [
            {
                title: "User profile page",
                description: "Build a profile page where users can update their avatar, display name, and bio.",
                priorityLevel: "high",
                order: "a"
            },
            {
                title: "Email notification system",
                description: "Send email digests for board activity using a queue-based approach.",
                priorityLevel: "medium",
                order: "b"
            },
            {
                title: "Search functionality",
                description: "Full-text search across card titles and descriptions with debounced input.",
                priorityLevel: "high",
                order: "c"
            },
            {
                title: "Board templates",
                description: "Allow users to create boards from predefined templates for common workflows.",
                priorityLevel: "low",
                order: "d"
            },
            {
                title: "Database indexing",
                description: "Add compound indexes on frequently queried fields to improve read performance.",
                priorityLevel: "high",
                order: "e"
            },
        ],
    },
    {
        listTitle: "In Progress",
        cards: [
            {
                title: "Drag-and-drop reordering",
                description: "Implement card and list reordering with dnd-kit, including cross-list moves.",
                priorityLevel: "critical",
                order: "a"
            },
            {
                title: "Real-time collaboration",
                description: "Use Socket.io to broadcast card edits and list changes to all connected board members.",
                priorityLevel: "high",
                order: "b"
            },
            {
                title: "File attachments",
                description: "Allow users to attach images and documents to cards with preview support.",
                priorityLevel: "medium",
                order: "c"
            },
            {
                title: "Card labels system",
                description: "Implement color-coded labels that can be assigned to cards for categorization.",
                priorityLevel: "medium",
                order: "d"
            },
        ],
    },
    {
        listTitle: "Review",
        cards: [
            {
                title: "Fix card due-date validation",
                description: "Due dates should reject past dates when creating new cards. Currently only validates format.",
                priorityLevel: "medium",
                order: "a"
            },
            {
                title: "Rate limiter tuning",
                description: "Adjust rate limit thresholds based on production traffic patterns.",
                priorityLevel: "low",
                order: "b"
            },
            {
                title: "Socket reconnection logic",
                description: "Handle graceful reconnection when the server drops the WebSocket connection.",
                priorityLevel: "high",
                order: "c"
            },
            {
                title: "Optimistic UI updates",
                description: "Show card changes immediately before server confirmation, with rollback on failure.",
                priorityLevel: "medium",
                order: "d"
            },
        ],
    },
    {
        listTitle: "Done",
        cards: [
            {
                title: "Set up project scaffolding",
                description: "Initialize Vite + React client, Express + Mongoose server, and shared socket events.",
                priorityLevel: "none",
                order: "a",
                verified: true,
            },
            {
                title: "Implement JWT auth flow",
                description: "Cookie-based access + refresh tokens with middleware for protected routes.",
                priorityLevel: "none",
                order: "b",
                verified: true,
            },
            {
                title: "Board member management",
                description: "Add/remove members with role-based permissions and BoardMembership model.",
                priorityLevel: "none",
                order: "c",
                verified: true,
            },
            {
                title: "Input validation layer",
                description: "Joi-based request validation for all API endpoints with detailed error messages.",
                priorityLevel: "none",
                order: "d",
                verified: true,
            },
        ],
    },
];

const username = process.argv[2];

async function execute() {

    try {
        if (!username) {
            console.error('Usage: node cmds/seedBoard.js <username>');
            process.exit(1);
        }

        const user = await User.findOne({ username });
        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        const userId = user._id;

        const board = await Board.create({
            title: "Sample Project Board",
            description: "A demo board for testing purposes with sample lists and cards.",
            visibility: "private",
            createdBy: userId,
            stats: { listCount: LISTS.length, cardCount: CARDS.reduce((sum, l) => sum + l.cards.length, 0) },
        });

        await BoardMembership.create({
            boardId: board._id,
            userId,
            role: 'owner',
        });

        console.log(`Created board: ${board.title} (${board._id})`);

        const listDocs = await List.insertMany(
            LISTS.map((l) => ({ title: l.title, order: l.order, boardId: board._id }))
        );

        console.log(`Created ${listDocs.length} lists`);

        const listIdMap = {};
        for (const doc of listDocs) {
            listIdMap[doc.title] = doc._id;
        }

        const cardDocs = [];
        for (const group of CARDS) {
            for (const c of group.cards) {
                cardDocs.push({
                    listId: listIdMap[group.listTitle],
                    boardId: board._id,
                    title: c.title,
                    description: c.description,
                    order: c.order,
                    priorityLevel: c.priorityLevel,
                    verified: c.verified || false,
                });
            }
        }

        const insertedCards = await Card.insertMany(cardDocs);
        console.log(`Created ${insertedCards.length} cards`);

        console.log('Done!');
    } catch (error) {
        console.error('Seed failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

execute();
