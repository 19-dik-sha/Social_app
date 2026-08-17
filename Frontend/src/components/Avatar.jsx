const BASE_URL = '/api';

export default function Avatar({ user, size = 40 }) {
  const initials = user?.username ? user.username[0].toUpperCase() : '?';
  const src = user?.profile_picture
    ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${BASE_URL}${user.profile_picture}`)
    : null;

  if (src) {
    return (
      <img
        src={src}
        alt={user.username}
        className="avatar"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
