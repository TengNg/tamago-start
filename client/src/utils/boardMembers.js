/**
 * @param {BoardMember[]} members
 * @param {string | null | undefined} userId
 * @returns {string | null}
 */
export function getUsernameByUserId(members, userId) {
    if (!userId) return null;
    const member = members.find((m) => m.userId === userId);
    return member?.username ?? null;
}
