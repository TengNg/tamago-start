import { isPastDue } from "./dateFormatter";

/**
 * @param {Card} card
 * @param {{
 *   search?: string | null;
 *   priorities?: string[];
 *   owners?: string[];
 *   stale?: string | null;
 *   verified?: string | null;
 *   members: BoardMember[];
 * }} filters
 * @returns {boolean}
 */
export function isCardVisibleByFilter(
    card,
    { search, priorities = [], owners = [], stale, verified, members },
) {
    const hasActiveFilter =
        !!search ||
        priorities.length > 0 ||
        owners.length > 0 ||
        stale === "true" ||
        verified === "true";

    if (!hasActiveFilter) {
        return true;
    }

    const searchValue = search?.toLowerCase() || "";
    const matchesSearch =
        !search || card.title.toLowerCase().includes(searchValue);

    const matchesPriority =
        priorities.length === 0 || priorities.includes(card.priorityLevel);

    const ownerName = card.owner
        ? members
              .find((m) => m.userId === card.owner)
              ?.username?.toLowerCase() || ""
        : null;
    const matchesOwner =
        owners.length === 0 ||
        (owners.includes("unassigned") && !ownerName) ||
        (!!ownerName && owners.includes(ownerName));

    const matchesStale = stale !== "true" || isPastDue(card.dueDate);

    const matchesVerified = verified !== "true" || !!card.verified;

    return (
        (search && matchesSearch) ||
        (priorities.length > 0 && matchesPriority) ||
        (owners.length > 0 && matchesOwner) ||
        (stale === "true" && matchesStale) ||
        (verified === "true" && matchesVerified)
    );
}

/**
 * @param {Card} card
 * @param {Parameters<typeof isCardVisibleByFilter>[1]} filters
 * @returns {Card}
 */
export function applyCardFilter(card, filters) {
    return {
        ...card,
        hiddenByFilter: !isCardVisibleByFilter(card, filters),
    };
}
