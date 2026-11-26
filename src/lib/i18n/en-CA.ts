// Every user-facing string (Canadian English) and, from T02 on, the number and date formatters.
// Components never hard-code copy: they read it from here. Q12: the app name is this one string.

export const enCA = {
  app: {
    name: "Calorie Snap",
    description: "Snap your plate, see what's left today.",
  },
  home: {
    title: "Calorie Snap",
    tagline: "Snap your plate, see what's left today.",
    comingSoon: "We're getting things ready. Check back soon.",
  },
} as const;
