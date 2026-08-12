export interface DemoBook {
  slug: string;
  title: string;
  description: string;
}
export interface DemoCollection {
  slug: string;
  title: string;
  description: string;
  priceMinor: number;
  bookSlugs: string[];
}
export interface DemoCustomCollection {
  slug: string;
  title: string;
  description: string;
  priceMinor: number;
  requiredCount: number;
}

export const books: DemoBook[] = [
  {
    slug: "stellas-solar-system",
    title: "Stella's Solar System Adventure",
    description:
      "Blast off into space with Stella! This interactive book takes young readers on a journey past roaring rockets and glowing planets. Packed with fun facts about our solar system, it is the perfect launchpad for little astronomers to learn about gravity, orbits, and the stars.",
  },
  {
    slug: "tiny-seed-journey",
    title: "The Tiny Seed's Big Journey",
    description:
      "Follow the incredible life cycle of a seed as it grows into a magnificent tree. With beautiful illustrations and easy-to-understand science, this book teaches children about photosynthesis, roots, and the everyday wonders of nature right in their own backyard.",
  },
  {
    slug: "rusty-robot-bridge",
    title: "Rusty the Robot Builds a Bridge",
    description:
      "Join Rusty the Robot as he uses basic engineering principles to help his friends cross a river! This engaging story introduces early STEM concepts, structural design, and the power of teamwork. Perfect for little tinkerers and future builders.",
  },
  {
    slug: "kitchen-science-lab",
    title: "My First Kitchen Science Lab",
    description:
      "Turn your kitchen into a laboratory! This hands-on book features 15 safe, easy, and exciting experiments that explain the basics of chemistry and physics using everyday household items. Step-by-step instructions make learning messy, fun, and highly educational.",
  },
  {
    slug: "great-shapes-mystery",
    title: "The Great Shapes Mystery",
    description:
      "Someone has stolen the town's missing triangles! Join Detective Daisy as she uses geometry, logic, and spatial reasoning to crack the case. A fun, interactive story that teaches children how to identify shapes, angles, and patterns in the real world.",
  },
  {
    slug: "coding-with-cody",
    title: "Coding with Cody the Caterpillar",
    description:
      "Cody needs to navigate a tricky garden maze to find his favorite leaf. By giving Cody simple, step-by-step instructions, young readers will learn the fundamentals of algorithms, sequencing, and basic coding concepts—no computer required!",
  },
  {
    slug: "amazing-human-machine",
    title: "Inside the Amazing Human Machine",
    description:
      "Shrink down to the size of a blood cell and take a guided tour of the human body! This fascinating book explains how the heart pumps, how lungs breathe, and how the brain controls it all, using kid-friendly diagrams and fun facts.",
  },
  {
    slug: "wind-and-water",
    title: "The Power of Wind and Water",
    description:
      "How do windmills spin and why do dams generate electricity? Discover the incredible science behind renewable energy. This colorful guide introduces kids to physics and sustainability, showing how we can harness nature to power our world.",
  },
  {
    slug: "meet-the-elements",
    title: "Meet the Elements: The Universe's Building Blocks",
    description:
      "Get to know the tiny particles that make up everything around us! This playful introduction to chemistry personifies the most common elements, teaching kids how oxygen, carbon, and hydrogen team up to create the world as we know it.",
  },
  {
    slug: "journey-to-earths-core",
    title: "Journey to the Core of the Earth",
    description:
      "Grab your pickaxe! This geological adventure takes kids beneath the dirt and soil, past fossilized dinosaur bones, through the rocky mantle, and all the way to the Earth's fiery core. A brilliant introduction to plate tectonics and volcanoes.",
  },
  {
    slug: "junior-paleontologist",
    title: "The Junior Paleontologist's Handbook",
    description:
      "Unearth the secrets of the dinosaurs! This interactive book acts as a field guide for aspiring fossil hunters. Learn how fossils are formed, how to identify ancient footprints, and what the Earth looked like millions of years ago.",
  },
  {
    slug: "busy-bees-big-job",
    title: "The Busy Bee's Big Job",
    description:
      "Follow Bella the Bee on her daily flight from flower to flower. This beautifully illustrated book highlights the vital role of pollinators in our ecosystem, teaching children about plant reproduction, nectar, and environmental conservation.",
  },
  {
    slug: "where-do-puddles-go",
    title: "Where Do Puddles Go? A Book About Weather",
    description:
      "Follow a single drop of water as it evaporates into the clouds, freezes into snow, and rains back down! This engaging story breaks down the water cycle and explains how different weather patterns are formed across the globe.",
  },
  {
    slug: "deep-dive-ocean",
    title: "Deep Dive: Zones of the Ocean",
    description:
      "Take a submarine ride from the sunlit coral reefs all the way down to the mysterious midnight zone! Children will discover bizarre deep-sea creatures, learn about water pressure, and understand the delicate balance of marine ecosystems.",
  },
];

export const collections: DemoCollection[] = [
  {
    slug: "space-earth",
    title: "Space & Earth Explorers",
    description:
      "Four cosmic and earthly adventures — from the solar system to the ocean floor, with stops for the water cycle and the planet's fiery core.",
    priceMinor: 6400,
    bookSlugs: [
      "stellas-solar-system",
      "journey-to-earths-core",
      "where-do-puddles-go",
      "deep-dive-ocean",
    ],
  },
  {
    slug: "living-world",
    title: "The Living World",
    description:
      "Four stories about living things — a growing seed, the human body, busy pollinators, and the dinosaurs that came before us.",
    priceMinor: 6400,
    bookSlugs: [
      "tiny-seed-journey",
      "amazing-human-machine",
      "busy-bees-big-job",
      "junior-paleontologist",
    ],
  },
  {
    slug: "build-code",
    title: "Build & Code",
    description:
      "Three hands-on adventures in engineering, geometry, and coding for little builders and problem-solvers.",
    priceMinor: 4900,
    bookSlugs: ["rusty-robot-bridge", "great-shapes-mystery", "coding-with-cody"],
  },
  {
    slug: "hands-on-science",
    title: "Hands-On Science Lab",
    description:
      "Three experiment-packed guides to chemistry, physics, and the science hiding in everyday life.",
    priceMinor: 5200,
    bookSlugs: ["kitchen-science-lab", "meet-the-elements", "wind-and-water"],
  },
];

export const customCollection: DemoCustomCollection = {
  slug: "build-your-own",
  title: "Build Your Own Bundle — Pick Any 5",
  description:
    "Choose any 5 books from the series at a discounted bundle price — your favorite stories, your way.",
  priceMinor: 8000,
  requiredCount: 5,
};
