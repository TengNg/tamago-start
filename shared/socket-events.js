/**
 * @readonly
 * @enum {string}
 */
export const SOCKET_EVENTS = {
  // ===========================
  // incoming (client -> server)
  // ===========================

  BOARD_JOIN: "board:join",
  BOARD_DISCONNECT: "board:disconnect",

  // ===========================
  // outgoing (server -> client)
  // ===========================

  BOARD_CLOSED: "board:closed",
  BOARD_UNAUTHORIZED: "board:unauthorized",
  BOARD_MEMBER_KICKED: "board:member-kicked",
  BOARD_MEMBER_LEFT: "board:member-left",
  BOARD_UPDATED: "board:updated",

  LIST_CREATED: "list:created",
  LIST_DELETED: "list:deleted",
  LIST_MOVED: "list:moved",
  LIST_MOVED_TO_BOARD: "list:moved-to-board",
  LIST_UPDATED: "list:updated",
  LIST_COPIED: "list:copied",

  CARD_CREATED: "card:created",
  CARD_DELETED: "card:deleted",
  CARD_COPIED: "card:copied",
  CARD_MOVED: "card:moved",
  CARD_UPDATED: "card:updated",

  CHAT_RECEIVED: "chat:received",
  CHAT_DELETED: "chat:deleted",
  CHAT_CLEARED: "chat:cleared",

  COMMENT_CREATED: "comment:created",
  COMMENT_DELETED: "comment:deleted",

  ATTACHMENT_CREATED: "attachment:created",
  ATTACHMENT_DELETED: "attachment:deleted",
};
