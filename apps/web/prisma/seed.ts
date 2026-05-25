import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  const adminUser = await db.user.upsert({
    where: { email: "admin@auntsex.com" },
    update: {},
    create: {
      name: "Admin",
      username: "admin",
      email: "admin@auntsex.com",
      role: UserRole.admin,
      hashedPassword,
      bio: "مدير المنصة",
      coins: 99999,
      points: 10000,
    },
  });
  console.log(`  ✅ Admin user: ${adminUser.email}`);

  await db.channel.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      name: "القناة الرسمية",
      avatar: "/default-avatar.svg",
      userId: adminUser.id,
    },
  });

  const giftTypes = [
    { name: "وردة", icon: "🌹", price: 5 },
    { name: "قلب", icon: "❤️", price: 10 },
    { name: "قبلة", icon: "💋", price: 20 },
    { name: "كيك", icon: "🎂", price: 30 },
    { name: "سيارة", icon: "🚗", price: 50 },
    { name: "يخت", icon: "🛥️", price: 100 },
    { name: "قلب نابض", icon: "💓", price: 150 },
    { name: "تاج", icon: "👑", price: 200 },
    { name: "ماسة", icon: "💎", price: 500 },
    { name: "صاروخ", icon: "🚀", price: 1000 },
  ];

  for (const gift of giftTypes) {
    const exists = await db.giftType.findFirst({ where: { name: gift.name } });
    if (!exists) {
      await db.giftType.create({ data: gift });
    }
  }
  console.log(`  ✅ ${giftTypes.length} gift types`);

  const coinPackages = [
    { name: "بداية", coins: 100, price: 1.99, stripePriceId: "" },
    { name: "عادي", coins: 500, price: 4.99, stripePriceId: "" },
    { name: "ممتاز", coins: 1500, price: 9.99, stripePriceId: "" },
    { name: "VIP كبير", coins: 5000, price: 24.99, stripePriceId: "" },
    { name: "ملوكي", coins: 15000, price: 49.99, stripePriceId: "" },
  ];

  for (const pkg of coinPackages) {
    const exists = await db.coinPackage.findFirst({ where: { name: pkg.name } });
    if (!exists) {
      await db.coinPackage.create({ data: pkg });
    }
  }
  console.log(`  ✅ ${coinPackages.length} coin packages`);

  await db.chatGroup.upsert({
    where: { id: "general" },
    update: {},
    create: {
      id: "general",
      name: "العام",
      description: "الدردشة العامة للمنصة",
    },
  });
  console.log("  ✅ Chat groups");

  console.log("\n🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
