module.exports = {
    DEFAULT_BOARD_PERMISSIONS: {
        lists: {
            create: true,
            edit: true,
            delete: true,
            view: true
        },
        cards: {
            create: true,
            edit: true,
            delete: true,
            view: true,
            comments: {
                create: true,
                edit: true,
                delete: true,
                view: true
            },
            attachments: {
                create: true,
                delete: true,
                view: true
            }
        }
    }
}
