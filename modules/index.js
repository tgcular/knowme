// Feature registry. To add a feature: create its routes under app/(app)/<name>, then list it here.
// `icon` is a name from components/Icon.js
export const modules = [
  { id: "diary", label: "Diary", href: "/home", icon: "book" },
  { id: "shared", label: "Shared", href: "/shared", icon: "heart" },
  { id: "friends", label: "Friends", href: "/friends", icon: "users" },
];
