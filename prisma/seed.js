const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create game categories
  const puzzleCategory = await prisma.gameCategory.upsert({
    where: { slug: 'puzzle' },
    update: {},
    create: {
      name: 'Puzzle',
      slug: 'puzzle',
      description: 'Brain-teasing puzzle games',
      icon: '🧩',
      order: 1,
    },
  });

  const actionCategory = await prisma.gameCategory.upsert({
    where: { slug: 'action' },
    update: {},
    create: {
      name: 'Action',
      slug: 'action',
      description: 'Fast-paced action games',
      icon: '⚡',
      order: 2,
    },
  });

  const arcadeCategory = await prisma.gameCategory.upsert({
    where: { slug: 'arcade' },
    update: {},
    create: {
      name: 'Arcade',
      slug: 'arcade',
      description: 'Classic arcade-style games',
      icon: '🕹️',
      order: 3,
    },
  });

  // Create games
  const games = [
    {
      title: 'Memory Dots',
      slug: 'memdot',
      description: 'Test your memory! Remember the colored circles and click them when they turn white.',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: puzzleCategory.id,
      isFeatured: true,
      popularity: 100,
    },
    {
      title: 'Fill the Holes',
      slug: 'fill-the-holes',
      description: 'Fill all the holes to complete levels',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: puzzleCategory.id,
      isFeatured: true,
      popularity: 90,
    },
    {
      title: 'Clocks',
      slug: 'clocks',
      description: 'Time-based puzzle game',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: puzzleCategory.id,
      popularity: 80,
    },
    {
      title: 'Circle Path',
      slug: 'circle-path',
      description: 'Navigate through circular paths',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: arcadeCategory.id,
      popularity: 75,
    },
    {
      title: 'Box Jump',
      slug: 'box-jump',
      description: 'Jump between boxes in this platformer',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: actionCategory.id,
      popularity: 85,
    },
    {
      title: 'Boom Dots',
      slug: 'boom-dots',
      description: 'Explosive dot-connecting action',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: actionCategory.id,
      popularity: 70,
    },
    {
      title: '123',
      slug: '123',
      description: 'Number-based puzzle game',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: puzzleCategory.id,
      popularity: 65,
    },
    {
      title: 'Doodle Jump',
      slug: 'doodle-jump',
      description: 'Jump as high as you can',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: arcadeCategory.id,
      popularity: 95,
    },
    {
      title: 'Perfect Square',
      slug: 'perfect-square',
      description: 'Create perfect squares',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: puzzleCategory.id,
      popularity: 60,
    },
    {
      title: 'The Battle',
      slug: 'the-battle',
      description: 'Strategic battle game',
      thumbnail: '/images/game-placeholder.svg',
      provider: 'In-House',
      categoryId: actionCategory.id,
      popularity: 88,
    },
  ];

  console.log('🎮 Creating games...');
  for (const gameData of games) {
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: gameData,
      create: gameData,
    });
    console.log(`✅ Created/updated game: ${game.title} (${game.slug})`);
  }

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });