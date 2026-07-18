/**
 * @readonly
 * @enum {string}
 */
export const SOCKET_EVENTS = {
  // ===========================
  // incoming (client -> server)
  // ===========================

  BOARD_JOIN: "board:join",
  BOARD_LEAVE: "board:leave",
  BOARD_KICK: "board:kick",
  BOARD_CLOSE: "board:close",
  BOARD_DISCONNECT: "board:disconnect",
  BOARD_UPDATE: "board:update-field",

  LIST_CREATE: "list:create",
  LIST_DELETE: "list:delete",
  LIST_MOVE: "list:move",
  LIST_UPDATE_ALL: "list:update-all",
  LIST_MOVE_TO_BOARD: "list:move-to-board",
  LIST_UPDATE: "list:update-field",

  CARD_CREATE: "card:create",
  CARD_DELETE: "card:delete",
  CARD_COPY: "card:copy",
  CARD_MOVE: "card:move",
  CARD_MOVE_BY_INDEX: "card:move-by-index",
  CARD_MOVE_TO_LIST: "card:move-to-list",
  CARD_UPDATE: "card:update-field",

  CHAT_SEND: "chat:send",
  CHAT_DELETE: "chat:delete",
  CHAT_CLEAR: "chat:clear",

  COMMENT_CREATE: "comment:create",
  COMMENT_DELETE: "comment:delete",

  ATTACHMENT_CREATE: "attachment:create",
  ATTACHMENT_DELETE: "attachment:delete",

  // ===========================
  // outgoing (server -> client)
  // ===========================

  BOARD_CLOSED: "board:closed",
  BOARD_UNAUTHORIZED: "board:unauthorized",
  BOARD_MEMBER_KICKED: "board:member-kicked",
  BOARD_MEMBER_JOINED: "board:member-joined",
  BOARD_MEMBER_LEFT: "board:member-left",
  BOARD_UPDATED: "board:updated",

  LIST_CREATED: "list:created",
  LIST_DELETED: "list:deleted",
  LIST_MOVED: "list:moved",
  LIST_UPDATED_ALL: "list:updated-all",
  LIST_MOVED_TO_BOARD: "list:moved-to-board",
  LIST_UPDATED: "list:updated",

  CARD_CREATED: "card:created",
  CARD_DELETED: "card:deleted",
  CARD_COPIED: "card:copied",
  CARD_MOVED: "card:moved",
  CARD_MOVED_BY_INDEX: "card:moved-by-index",
  CARD_MOVED_TO_LIST: "card:moved-to-list",
  CARD_UPDATED: "card:updated",

  CHAT_RECEIVED: "chat:received",
  CHAT_DELETED: "chat:deleted",
  CHAT_CLEARED: "chat:cleared",

  COMMENT_CREATED: "comment:created",
  COMMENT_DELETED: "comment:deleted",

  ATTACHMENT_CREATED: "attachment:created",
  ATTACHMENT_DELETED: "attachment:deleted",
};
