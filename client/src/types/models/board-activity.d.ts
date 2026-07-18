declare type BoardActivity = {
    _id: string;
    board: string;
    user: { username: string; createdAt: string };
    docModel: string;
    doc: { _id: string; title: string };
    docTitle: string;
    action: string;
    description: string;
    createdAt: string;
};
