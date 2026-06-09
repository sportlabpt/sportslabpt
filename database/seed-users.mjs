/**
 * Seed Script — Criar utilizadores admin no Supabase via Prisma
 * Executar com: node database/seed-users.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Foresp2026%40Marketing%23@db.tgqpijthkqgkoatkwlye.supabase.co:5432/postgres"
    }
  }
});

const users = [
  {
    email: 'admin@sportluiz.com',
    password: 'admin123',
    subscriptionTier: 'ENTERPRISE',
  },
  {
    email: 'admin@fslsolution.com',
    password: 'admin123',
    subscriptionTier: 'ENTERPRISE',
  },
  {
    email: 'analista@sportluiz.com',
    password: 'senha123',
    subscriptionTier: 'FREE',
  },
];

async function main() {
  console.log('🌱 Iniciando seed de utilizadores...\n');

  for (const user of users) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: user.email } });

      if (existing) {
        // Atualizar password e tier
        await prisma.user.update({
          where: { email: user.email },
          data: { 
            password: user.password,
            subscriptionTier: user.subscriptionTier 
          }
        });
        console.log(`✅ Atualizado: ${user.email} (tier: ${user.subscriptionTier})`);
      } else {
        await prisma.user.create({ data: user });
        console.log(`✅ Criado: ${user.email} (tier: ${user.subscriptionTier})`);
      }
    } catch (err) {
      console.error(`❌ Erro ao processar ${user.email}:`, err.message);
    }
  }

  console.log('\n📋 Credenciais de acesso:');
  console.log('  admin@sportluiz.com    → admin123  (ENTERPRISE)');
  console.log('  admin@fslsolution.com  → admin123  (ENTERPRISE)');
  console.log('  analista@sportluiz.com → senha123  (FREE)');
  console.log('\n✅ Seed concluído!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
