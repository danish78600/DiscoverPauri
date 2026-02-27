import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Trek from "../models/trek.model.js";

dotenv.config();

async function upsertTrek(trek) {
  const { slug, ...rest } = trek;
  if (!slug) throw new Error("seed trek is missing slug");

  return Trek.findOneAndUpdate(
    { slug },
    { slug, ...rest },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
}

async function main() {
  await connectDB();

  const treks = [
    {
      title: "Khirsu Trek",
      slug: "khirsu-trek",
      summary: "Easy walk/trek around Khirsu with peaceful Himalayan views.",
      description:
        "Village: Khirsu\nDistrict: Pauri\nCoordinates: 30.12°N, 78.79°E\n\nTaxi idea: Pickup Kotdwar / Rishikesh / Pauri, show estimate ₹2,500–₹4,000 from Rishikesh, and a ‘Book Local Driver’ CTA.",
      difficulty: "easy",
      durationDays: 1,
      bestSeason: ["March–June", "September–November"],
      location: {
        village: "Khirsu",
        district: "Pauri",
        distanceFromPauriKm: 15,
        distanceFromPauriText: "~15 km from Pauri town",
        coordinates: { lat: 30.12, lng: 78.79 },
      },
      stayOptions: [
        "GMVN Tourist Rest House (Khirsu)",
        "Local homestays in Khirsu village",
        "Budget guesthouses in Pauri",
      ],
      taxi: {
        pickupOptions: ["Kotdwar", "Rishikesh", "Pauri"],
        priceEstimateInr: { min: 2500, max: 4000, note: "From Rishikesh" },
        ctaLabel: "Book Local Driver",
        notes: ["Show price estimate in UI"],
      },
      isFeatured: true,
    },
    {
      title: "Tara Kund Trek",
      slug: "tara-kund-trek",
      summary:
        "Trek route near Tarkeshwar Mahadev Temple and surrounding forest trails.",
      description:
        "Near Tarkeshwar Mahadev Temple (~36 km from Pauri)\nCoordinates: 30.05°N, 78.90°E\n\nTaxi integration: Route Pauri → Tarkeshwar → trek base; local jeep option for last stretch.",
      difficulty: "moderate",
      durationDays: 1,
      bestSeason: ["April–June", "September–November"],
      location: {
        district: "Pauri",
        distanceFromPauriKm: 36,
        distanceFromPauriText: "~36 km from Pauri",
        coordinates: { lat: 30.05, lng: 78.9 },
      },
      stayOptions: [
        "Forest rest houses",
        "Homestays near Tarkeshwar",
        "Camping (with permission)",
      ],
      taxi: {
        route: "Pauri → Tarkeshwar → Trek base",
        recommendedVehicle: "Local jeep (last stretch)",
        notes: ["Local jeep option for last stretch"],
      },
    },
    {
      title: "Kandoliya Devta Trek",
      slug: "kandoliya-devta-trek",
      summary: "Beginner-friendly short trek near Kandoliya Temple in Pauri.",
      description:
        "Near Kandoliya Temple, Pauri (2–3 km from main town)\nBest time: All year (avoid heavy monsoon)\n\nTaxi integration: Auto / local taxi from Pauri bus stand; offer a half-day sightseeing package.",
      difficulty: "easy",
      durationDays: 1,
      bestSeason: ["All year"],
      location: {
        district: "Pauri",
        distanceFromPauriText: "2–3 km from main town",
      },
      stayOptions: ["Hotels in Pauri town", "Village homestays"],
      taxi: {
        route: "Pauri bus stand → Kandoliya",
        notes: ["Auto / local taxi", "Add half-day sightseeing package option"],
      },
    },
    {
      title: "Nag Tibba Trek",
      slug: "nag-tibba-trek",
      summary: "Popular Garhwal trek accessible via Pantwari (near Mussoorie).",
      description:
        "Base village: Pantwari (near Mussoorie)\nCoordinates: 30.49°N, 78.10°E\n\nTaxi integration: Rishikesh → Pantwari; show shared taxi option; add a ‘Snow Trek Package’ filter.",
      difficulty: "moderate",
      durationDays: 2,
      bestSeason: ["October–April"],
      location: {
        village: "Pantwari",
        region: "Garhwal",
        coordinates: { lat: 30.49, lng: 78.1 },
      },
      stayOptions: [
        "Campsites",
        "Homestays in Pantwari",
        "Budget hotels in Mussoorie",
      ],
      taxi: {
        pickupOptions: ["Rishikesh"],
        route: "Rishikesh → Pantwari",
        notes: ["Show shared taxi option", "Snow trek package idea"],
      },
    },
    {
      title: "Doodhatoli Trek",
      slug: "doodhatoli-trek",
      summary:
        "Moderate trek/camping region spread across Pauri & Chamoli districts.",
      description:
        "Region: Doodhatoli (Pauri & Chamoli)\n\nTaxi integration: Kotdwar / Pauri pickup; recommend 4x4 jeep where needed.",
      difficulty: "moderate",
      durationDays: 3,
      bestSeason: ["May–June", "September–October"],
      location: {
        district: "Pauri & Chamoli",
        region: "Doodhatoli",
      },
      stayOptions: [
        "Village homestays",
        "Camping (popular here)",
        "Local forest rest houses",
      ],
      taxi: {
        pickupOptions: ["Kotdwar", "Pauri"],
        recommendedVehicle: "4x4 jeep recommended",
        notes: ["4x4 jeep recommendation for certain stretches"],
      },
      isFeatured: true,
    },
  ];

  const results = [];
  for (const trek of treks) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await upsertTrek(trek);
    results.push({ title: doc.title, slug: doc.slug, id: doc._id.toString() });
  }

  // eslint-disable-next-line no-console
  console.log("Seeded/updated treks:");
  // eslint-disable-next-line no-console
  console.table(results);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", err);
    process.exit(1);
  });
