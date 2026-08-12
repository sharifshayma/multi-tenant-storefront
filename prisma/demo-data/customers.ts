export interface DemoCustomer {
  name: string;
  phone: string;
  email: string | null;
  city: string;
}

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { name: "Layla Haddad", phone: "+971 50 123 4567", email: "layla.h@example.com", city: "Dubai" },
  { name: "Omar Khalil", phone: "+966 55 234 5678", email: "omar.k@example.com", city: "Riyadh" },
  { name: "Nour Farouk", phone: "+20 100 345 6789", email: "nour.f@example.com", city: "Cairo" },
  { name: "Yousef Mansour", phone: "+962 79 456 7890", email: null, city: "Amman" },
  { name: "Salma Deeb", phone: "+971 52 567 8901", email: "salma.d@example.com", city: "Abu Dhabi" },
  { name: "Karim Nasser", phone: "+961 3 678 901", email: "karim.n@example.com", city: "Beirut" },
  { name: "Hana Suleiman", phone: "+966 56 789 0123", email: null, city: "Jeddah" },
  { name: "Tariq Aziz", phone: "+974 33 890 123", email: "tariq.a@example.com", city: "Doha" },
  { name: "Rania Fadel", phone: "+20 111 901 2345", email: "rania.f@example.com", city: "Alexandria" },
  { name: "Sami Barakat", phone: "+962 78 012 3456", email: null, city: "Irbid" },
  { name: "Dana Hijazi", phone: "+971 54 123 7890", email: "dana.h@example.com", city: "Sharjah" },
  { name: "Fadi Rahman", phone: "+973 36 234 890", email: "fadi.r@example.com", city: "Manama" },
  { name: "Maya Sabbagh", phone: "+965 66 345 901", email: null, city: "Kuwait City" },
  { name: "Ziad Toukan", phone: "+966 50 456 012", email: "ziad.t@example.com", city: "Dammam" },
  { name: "Lina Qassem", phone: "+20 122 567 1234", email: "lina.q@example.com", city: "Giza" },
  { name: "Bassam Odeh", phone: "+962 77 678 2345", email: null, city: "Zarqa" },
  { name: "Aya Mroue", phone: "+961 71 789 345", email: "aya.m@example.com", city: "Tripoli" },
  { name: "Rami Sleiman", phone: "+971 55 890 4567", email: "rami.s@example.com", city: "Dubai" },
  { name: "Hala Darwish", phone: "+966 53 901 5678", email: null, city: "Riyadh" },
  { name: "Jad Khoury", phone: "+974 55 012 678", email: "jad.k@example.com", city: "Doha" },
];
