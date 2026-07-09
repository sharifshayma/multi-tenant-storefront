import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const books = [
  {
    slug: "amal-clooney",
    title: "أمل كلوني: صوت العدالة | Amal Clooney: The Voice of Justice",
    description:
      "قصة أمل كلوني الحقيقية، من طفولتها في بيروت إلى محامية عالمية تدافع عن العدالة وحقوق الإنسان. كتاب ملهم يعلّم الأطفال قيمة الشجاعة والدفاع عمّا هو صواب.",
  },
  {
    slug: "huda-kattan",
    title:
      "هدى قطّان: الفتاة التي أضاءت العالم | Huda Kattan: The Girl Who Shined Bright",
    description:
      "رحلة هدى قطّان من فتاة عراقية الجذور في تينيسي إلى رائدة أعمال عالمية في عالم الجمال. قصة عن الثقة بالنفس والإبداع وتحقيق الأحلام مهما كانت البدايات صعبة.",
  },
  {
    slug: "mo-salah",
    title: "محمد صلاح: الملك المصري | Mo Salah: The Egyptian King",
    description:
      "من قرية صغيرة في مصر إلى أعظم ملاعب العالم، تحكي هذه القصة كفاح محمد صلاح وإصراره وتواضعه رغم الشهرة، لتلهم الأطفال بأن الأحلام الكبيرة تبدأ بخطوة واحدة.",
  },
  {
    slug: "zaha-hadid",
    title: "زها حديد: ملكة المنحنيات | Zaha Hadid: The Queen of Curves",
    description:
      "قصة زها حديد، المعمارية العراقية التي غيّرت شكل العمارة العالمية بخيالها الجريء وإصرارها على كسر القواعد. إلهام للأطفال ليحلموا بلا حدود.",
  },
  {
    slug: "farouk-el-baz",
    title: "فاروق الباز: ملك القمر | Farouk El-Baz: The King of the Moon",
    description:
      "قصة فاروق الباز، العالم المصري الذي ساعد في استكشاف القمر، وتحوّل من طفل فضولي إلى عالم فضاء عالمي. حكاية عن قوة الفضول والعلم.",
  },
  {
    slug: "salem-saleh",
    title: "سالم صالح: الأستاذ الكبير | Salem Saleh: The Grandmaster",
    description:
      "قصة سالم صالح، بطل الشطرنج الإماراتي الذي تعلّم أن الهدوء والتفكير العميق يقودان إلى النصر. حكاية عن الصبر والتركيز وقوة العقل.",
  },
  {
    slug: "yusra-mardini",
    title:
      "يسرى مارديني: السبّاحة الأولمبية | Yusra Mardini: The Olympic Swimmer",
    description:
      "رحلة يسرى مارديني المؤثرة من دمشق إلى الألعاب الأولمبية، قصة عن الشجاعة والأمل التي أنقذت بها حياة آخرين في رحلة عبور البحر.",
  },
  {
    slug: "rami-malek",
    title: "رامي مالك: الممثل الهوليودي | Rami Malek: The Hollywood Star",
    description:
      "قصة رامي مالك، أول ممثل عربي يفوز بجائزة الأوسكار لأفضل ممثل، وكيف حافظ على هويته وثقته بنفسه ليحقق حلمه في هوليوود.",
  },
  {
    slug: "hazza-al-mansouri",
    title: "هزاع المنصوري: رائد الفضاء | Hazza Al Mansouri: The Astronaut",
    description:
      "من صحراء ليوا إلى محطة الفضاء الدولية، قصة هزاع المنصوري، أول رائد فضاء إماراتي، الذي أثبت أن الأحلام الكبيرة يمكن أن تصل إلى النجوم.",
  },
  {
    slug: "omar-yaghi",
    title: "عمر ياغي: صائد الماء | Omar Yaghi: The Water Catcher",
    description:
      "قصة عمر ياغي الحقيقية، من طفل فلسطيني في الأردن إلى عالم كيمياء حائز على جائزة نوبل، اخترع طريقة لاصطياد الماء من الهواء. حكاية عن الفضول والإصرار.",
  },
  {
    slug: "rama-duwaji",
    title:
      "راما دوجي: السيدة الأولى لمدينة نيويورك | Rama Duwaji: The First Lady of New York City",
    description:
      "قصة راما دوجي، الفنانة السورية الأصل التي تحوّل شغفها بالرسم إلى مسيرة فنية عالمية، لتصبح السيدة الأولى الأصغر سناً لمدينة نيويورك.",
  },
  {
    slug: "amjad-massad",
    title:
      "أمجد مسعد: المؤسس لشركة ريبلت | Amjad Massad: The Founder of Replit",
    description:
      "قصة أمجد مسعد الذي تعلّم البرمجة في مقهى إنترنت بالأردن، ليؤسس لاحقاً منصة Replit التي يستخدمها ملايين الأشخاص حول العالم لتعلّم البرمجة.",
  },
  {
    slug: "edward-said",
    title:
      "إدوارد سعيد: من أعاد رواية القصة | Edward Said: The Man Who Retold the Story",
    description:
      "قصة إدوارد سعيد، المولود في القدس، الذي كرّس حياته لتصحيح الصورة عن شعبه من خلال الكتابة والتعليم، وعلّم العالم أن لكل إنسان الحق في أن يروي قصته بنفسه.",
  },
  {
    slug: "achraf-hakimi",
    title: "أشرف حكيمي: أسد المغرب | Achraf Hakimi: The Lion of Morocco",
    description:
      "قصة أشرف حكيمي، الذي حقق حلمه بالكرة وقاد المغرب لتصبح أول منتخب أفريقي وعربي يصل لنصف نهائي كأس العالم، مؤكداً أن الإصرار والفخر بالجذور يصنعان الأبطال.",
  },
];

const collections = [
  {
    slug: "women-leaders",
    title: "قائدات ملهمات",
    description:
      "خمس قصص عن نساء عربيات غيّرن مجالاتهن بالشجاعة والإصرار — من القانون والعمارة إلى الرياضة والفن.",
    priceNis: 175,
    bookSlugs: ["amal-clooney", "huda-kattan", "zaha-hadid", "yusra-mardini", "rama-duwaji"],
  },
  {
    slug: "science",
    title: "علماء ومبتكرون",
    description: "أربع قصص عن عقول عربية أبدعت في العلم والفضاء والتكنولوجيا.",
    priceNis: 140,
    bookSlugs: ["farouk-el-baz", "hazza-al-mansouri", "omar-yaghi", "amjad-massad"],
  },
  {
    slug: "activism",
    title: "أصوات التغيير",
    description: "أربع قصص عن أشخاص استخدموا أصواتهم للدفاع عن العدالة والهوية والإنسانية.",
    priceNis: 140,
    bookSlugs: ["amal-clooney", "yusra-mardini", "rama-duwaji", "edward-said"],
  },
  {
    slug: "sports",
    title: "أبطال الرياضة",
    description: "أربع قصص عن أبطال عرب أثبتوا للعالم قوة الإصرار في الملاعب.",
    priceNis: 140,
    bookSlugs: ["mo-salah", "achraf-hakimi", "yusra-mardini", "salem-saleh"],
  },
];

const customCollection = {
  slug: "build-your-own",
  title: "اختاري ٥ كتب بنفسك",
  description:
    "اختاري أي ٥ كتب من السلسلة بسعر مخفّض — نفس القصص المفضلة لديكِ، بسعر أفضل.",
  priceNis: 175,
  requiredCount: 5,
};

async function main() {
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    await prisma.book.upsert({
      where: { slug: book.slug },
      update: {
        title: book.title,
        description: book.description,
        position: i,
      },
      create: {
        slug: book.slug,
        title: book.title,
        description: book.description,
        coverImage: `/images/books/${book.slug}/cover.jpg`,
        position: i,
      },
    });
  }
  console.log(`Seeded ${books.length} books.`);

  for (let i = 0; i < collections.length; i++) {
    const c = collections[i];
    const collection = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        description: c.description,
        priceNis: c.priceNis,
        position: i,
      },
      create: {
        slug: c.slug,
        title: c.title,
        description: c.description,
        priceNis: c.priceNis,
        position: i,
      },
    });

    const bookRecords = await prisma.book.findMany({
      where: { slug: { in: c.bookSlugs } },
      select: { id: true, slug: true },
    });
    const bookIdBySlug = new Map(bookRecords.map((b) => [b.slug, b.id]));

    for (let j = 0; j < c.bookSlugs.length; j++) {
      const bookId = bookIdBySlug.get(c.bookSlugs[j]);
      if (!bookId) continue;
      await prisma.collectionBook.upsert({
        where: { collectionId_bookId: { collectionId: collection.id, bookId } },
        update: { sortOrder: j },
        create: { collectionId: collection.id, bookId, sortOrder: j },
      });
    }
  }
  console.log(`Seeded ${collections.length} fixed collections.`);

  await prisma.collection.upsert({
    where: { slug: customCollection.slug },
    update: {
      title: customCollection.title,
      description: customCollection.description,
      priceNis: customCollection.priceNis,
      isCustom: true,
      requiredCount: customCollection.requiredCount,
      position: collections.length,
    },
    create: {
      slug: customCollection.slug,
      title: customCollection.title,
      description: customCollection.description,
      priceNis: customCollection.priceNis,
      isCustom: true,
      requiredCount: customCollection.requiredCount,
      position: collections.length,
    },
  });
  console.log("Seeded custom build-your-own collection.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
