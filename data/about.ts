export type TextSegment = {
  text: string;
  accent?: boolean;
};

export type AboutContent = {
  portraitAlt: string;
  portraitSrc: string;
  contactQuote: TextSegment[];
  contactEmail: string;
  contactInstagramUrl: string;
  contactInstagramLabel: string;
};

export const aboutContent: AboutContent = {
  portraitAlt: "Camilo Luna portrait",
  portraitSrc: "/media/shoes1.jpeg",
  contactQuote: [
    { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor " },
    { text: "incididunt", accent: true },
    { text: " ut labore et dolore magna aliqua. Ut " },
    { text: "enim", accent: true },
    { text: " ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in " },
    { text: "voluptate", accent: true },
    { text: " velit esse cillum dolore eu fugiat nulla pariatur. " },
    { text: "Excepteur", accent: true },
    {
      text: " sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.",
    },
  ],
  contactEmail: "hello@caloid.com",
  contactInstagramUrl: "https://www.instagram.com/caloid",
  contactInstagramLabel: "Instagram",
};
