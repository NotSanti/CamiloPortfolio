export type AboutContent = {
  bioParagraphs: string[];
  creditsEnd: string;
  slogan: string;
  sloganRepeat: number;
  portraitAlt: string;
  portraitSrc: string;
  contactEmail: string;
  contactInstagramUrl: string;
  contactInstagramLabel: string;
  contactLinkedInUrl: string;
  contactLinkedInLabel: string;
};

export const aboutContent: AboutContent = {
  bioParagraphs: [
    "Born in Bogotá, Colombia, and currently residing in Montreal, Canada, Camilo Luna (CALOID) seamlessly integrates his immigrant experience into his artistic practice. After graduating from the Photography program at Dawson College, he began his career as a photographer, collaborating with recognized institutions and brands including SSENSE, InfluenceU, Matt and Nat, and Mano Cornuto. Through these collaborations and his work with artists and peers across the industry, he developed a strong foundation in visual storytelling that ultimately led him toward his lifelong aspiration of filmmaking.",
    "After completing the Film Production program at Concordia University, Camilo has expanded his practice into film and moving image, working across commercial, fashion, and artistic projects with clients such as KANUK, DODIEE, Vogue, GQ, Studio Rybko, and Sid Lee.",
    "Bridging photography and filmmaking, his practice is aimed at exploring a cinematic approach to image-making, with a focus on atmosphere, identity, and storytelling.",
  ],
  creditsEnd: "THE END",
  slogan: "WHY IS HE CALLED CALOID?",
  sloganRepeat: 12,
  portraitAlt: "Camilo Luna portrait",
  portraitSrc: "/media/shoes1.jpeg",
  contactEmail: "hello@caloid.com",
  contactInstagramUrl: "https://www.instagram.com/caloid",
  contactInstagramLabel: "Instagram",
  contactLinkedInUrl: "https://www.linkedin.com/in/caloid",
  contactLinkedInLabel: "LinkedIn",
};
