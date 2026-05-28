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
  BOARD_UPDATE_TITLE: "board:update-title",
  BOARD_UPDATE_DESCRIPTION: "board:update-description",

  LIST_CREATE: "list:create",
  LIST_DELETE: "list:delete",
  LIST_MOVE: "list:move",
  LIST_UPDATE_ALL: "list:update-all",
  LIST_MOVE_TO_BOARD: "list:move-to-board",
  LIST_UPDATE_TITLE: "list:update-title",

  CARD_CREATE: "card:create",
  CARD_DELETE: "card:delete",
  CARD_COPY: "card:copy",
  CARD_MOVE: "card:move",
  CARD_MOVE_BY_INDEX: "card:move-by-index",
  CARD_MOVE_TO_LIST: "card:move-to-list",
  CARD_UPDATE_OWNER: "card:update-owner",
  CARD_UPDATE_PRIORITY: "card:update-priority",
  CARD_UPDATE_TITLE: "card:update-title",
  CARD_UPDATE_HIGHLIGHT: "card:update-highlight",
  CARD_UPDATE_DESCRIPTION: "card:update-description",
  CARD_UPDATE_VERIFIED: "card:update-verified",
  CARD_UPDATE_DUE_DATE: "card:update-due-date",

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
  BOARD_INVITE_ACCEPTED: "board:invite-accepted",
  BOARD_TITLE_UPDATED: "board:title-updated",
  BOARD_DESCRIPTION_UPDATED: "board:description-updated",

  LIST_CREATED: "list:created",
  LIST_DELETED: "list:deleted",
  LIST_MOVED: "list:moved",
  LIST_UPDATED_ALL: "list:updated-all",
  LIST_MOVED_TO_BOARD: "list:moved-to-board",
  LIST_TITLE_UPDATED: "list:title-updated",

  CARD_CREATED: "card:created",
  CARD_DELETED: "card:deleted",
  CARD_COPIED: "card:copied",
  CARD_MOVED: "card:moved",
  CARD_MOVED_BY_INDEX: "card:moved-by-index",
  CARD_MOVED_TO_LIST: "card:moved-to-list",
  CARD_OWNER_UPDATED: "card:owner-updated",
  CARD_PRIORITY_UPDATED: "card:priority-updated",
  CARD_TITLE_UPDATED: "card:title-updated",
  CARD_HIGHLIGHT_UPDATED: "card:highlight-updated",
  CARD_DESCRIPTION_UPDATED: "card:description-updated",
  CARD_VERIFIED_UPDATED: "card:verified-updated",
  CARD_DUE_DATE_UPDATED: "card:due-date-updated",

  CHAT_RECEIVED: "chat:received",
  CHAT_DELETED: "chat:deleted",
  CHAT_CLEARED: "chat:cleared",

  COMMENT_CREATED: "comment:created",
  COMMENT_DELETED: "comment:deleted",

  ATTACHMENT_CREATED: "attachment:created",
  ATTACHMENT_DELETED: "attachment:deleted",
};
