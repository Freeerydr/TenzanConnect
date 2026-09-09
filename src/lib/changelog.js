// Bump APP_VERSION and prepend a new entry to CHANGELOG with every release
// that has user-facing changes worth announcing. WhatsNewModal shows the
// single newest entry once per device, the first time someone opens the app
// after that version ships — split into a "for everyone" section and a
// "for admins" section (the admin section only renders for admins).
export const APP_VERSION = "2026.09.09-1";

export const CHANGELOG = [
  {
    version: "2026.09.09-1",
    date: "September 9, 2026",
    forEveryone: [
      "You can now remove a photo you attached to a feed post before sending it.",
      "Fixed the Send button getting stuck disabled when you attach a photo without typing a caption.",
      "\"Private with Keith\" now takes you straight to the class schedule to book a lesson.",
    ],
    forAdmins: [
      "Fixed \"Cannot load members\" when promoting someone to admin.",
      "Removing a member now fully deletes their data (posts, attendance, journal entries, messages, etc.) instead of leaving it behind.",
      "The belt promotions feature has been removed — belt rank is now set directly on each member's own profile.",
    ],
  },
];
