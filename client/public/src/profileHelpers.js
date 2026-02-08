// Profile image and avatar helpers

// Generate initials from a display name or username
export function getInitials(name) {
  if (!name) return "?";

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    // Single word - take first two characters
    return words[0].substring(0, 2).toUpperCase();
  }
  // Multiple words - take first character of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Generate a consistent color based on the name (for initials background)
export function getAvatarColor(name) {
  if (!name) return "#6b46c1"; // Default purple

  const colors = [
    "#e53e3e", // red
    "#dd6b20", // orange
    "#d69e2e", // yellow
    "#38a169", // green
    "#319795", // teal
    "#3182ce", // blue
    "#5a67d8", // indigo
    "#805ad5", // purple
    "#d53f8c", // pink
  ];

  // Simple hash of the name to pick a color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Generate HTML for a profile avatar (image or initials)
export function getAvatarHtml(participant, size = 40) {
  const name = participant.displayName || participant.username || "User";
  const profileImage = participant.profileImage;

  if (profileImage) {
    return `
      <div class="avatar avatar-image" style="width: ${size}px; height: ${size}px;">
        <img src="${profileImage}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
      </div>
    `;
  }

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const fontSize = Math.round(size * 0.4);

  return `
    <div class="avatar avatar-initials" style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${bgColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: ${fontSize}px;
    ">${initials}</div>
  `;
}

// Get just the avatar URL or null for initials
export function getAvatarUrl(participant) {
  return participant?.profileImage || null;
}
