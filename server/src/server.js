import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import crypto from 'crypto';
import { authenticate } from './middlewares/authHook.js';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// In-Memory Database Fallback Store for local testing without PostgreSQL
const dbStore = {
  users: [
    {
      id: 'mock-user-analyst-id-2026',
      email: 'analista@sportluiz.com',
      password: 'senha123',
      subscriptionTier: 'FREE',
      createdAt: new Date(),
      stripeCustomerId: null
    },
    {
      id: 'mock-user-admin-id-2026',
      email: 'admin@fslsolution.com',
      password: 'admin123',
      subscriptionTier: 'ENTERPRISE',
      createdAt: new Date(),
      stripeCustomerId: null
    },
    {
      id: 'mock-user-sportluiz-admin-id-2026',
      email: 'admin@sportluiz.com',
      password: 'admin123',
      subscriptionTier: 'ENTERPRISE',
      createdAt: new Date(),
      stripeCustomerId: null
    }
  ],
  matches: [],
  events: []
};

let useInMemoryDb = false;

// Attempt database connection check at startup
try {
  await prisma.$connect();
  fastify.log.info("Banco de dados PostgreSQL conectado com sucesso.");
} catch (err) {
  fastify.log.warn("⚠️ ATENÇÃO: Não foi possível conectar ao PostgreSQL no localhost:5432.");
  fastify.log.warn("⚠️ Ativando banco de dados local em memória (Modo Sandbox de Teste).");
  useInMemoryDb = true;
}

// Database Abstraction Adapter
const db = {
  user: {
    create: async ({ data }) => {
      if (useInMemoryDb) {
        const user = { 
          id: crypto.randomUUID(), 
          ...data, 
          subscriptionTier: 'FREE', 
          createdAt: new Date(),
          stripeCustomerId: null
        };
        dbStore.users.push(user);
        return user;
      }
      return prisma.user.create({ data });
    },
    findUnique: async ({ where }) => {
      if (useInMemoryDb) {
        return dbStore.users.find(u => u.email === where.email || u.id === where.id) || null;
      }
      return prisma.user.findUnique({ where });
    },
    update: async ({ where, data }) => {
      if (useInMemoryDb) {
        const user = dbStore.users.find(u => u.id === where.id);
        if (user) Object.assign(user, data);
        return user;
      }
      return prisma.user.update({ where, data });
    },
    updateMany: async ({ where, data }) => {
      if (useInMemoryDb) {
        const users = dbStore.users.filter(u => u.stripeCustomerId === where.stripeCustomerId);
        users.forEach(u => Object.assign(u, data));
        return { count: users.length };
      }
      return prisma.user.updateMany({ where, data });
    }
  },
  match: {
    findMany: async ({ where }) => {
      if (useInMemoryDb) {
        return dbStore.matches
          .filter(m => m.userId === where.userId)
          .map(m => ({
            ...m,
            events: dbStore.events.filter(e => e.matchId === m.id)
          }))
          .sort((a, b) => b.date - a.date);
      }
      return prisma.match.findMany({ 
        where, 
        include: { events: true },
        orderBy: { date: 'desc' }
      });
    },
    create: async ({ data }) => {
      if (useInMemoryDb) {
        const match = { id: crypto.randomUUID(), ...data, date: new Date() };
        dbStore.matches.push(match);
        return match;
      }
      return prisma.match.create({ data });
    }
  },
  event: {
    count: async ({ where }) => {
      if (useInMemoryDb) {
        return dbStore.events.filter(e => e.matchId === where.matchId).length;
      }
      return prisma.event.count({ where });
    },
    create: async ({ data }) => {
      if (useInMemoryDb) {
        const event = { id: crypto.randomUUID(), ...data };
        dbStore.events.push(event);
        return event;
      }
      return prisma.event.create({ data });
    },
    findMany: async ({ where }) => {
      if (useInMemoryDb) {
        return dbStore.events.filter(e => e.matchId === where.matchId);
      }
      return prisma.event.findMany({ where });
    }
  }
};

// Handle mock/conditional stripe initialization to prevent crash if key is missing
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';
const stripe = new Stripe(stripeSecretKey);

// Registrar Plugins Corporativos
fastify.register(cors, { origin: true });
fastify.register(jwt, { secret: process.env.JWT_SECRET || 'SPORTLUIZ_SECRET_KEY_2026' });

// Decorador para expor o middleware de autenticação
fastify.decorate('authenticate', authenticate);

// --- AUTHENTICATION ROUTES ---
fastify.post('/api/auth/register', async (request, reply) => {
  const { email, password } = request.body;
  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(400).send({ error: 'Falha ao registrar: E-mail já cadastrado.' });
    }
    const user = await db.user.create({
      data: { email, password }
    });
    const token = fastify.jwt.sign({ id: user.id, email: user.email });
    return reply.status(201).send({ token, user: { id: user.id, email: user.email, subscriptionTier: user.subscriptionTier } });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(400).send({ error: 'Falha ao registrar: Erro interno.' });
  }
});

fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return reply.status(401).send({ error: 'Credenciais inválidas.' });
    }
    const token = fastify.jwt.sign({ id: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, subscriptionTier: user.subscriptionTier } };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro no servidor.' });
  }
});

// --- MATCH & EVENT MONITORING ---
fastify.get('/api/matches', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  try {
    const matches = await db.match.findMany({
      where: { userId: request.user.id }
    });
    return matches;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro ao carregar partidas.' });
  }
});

fastify.post('/api/matches', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { opponent } = request.body;
  if (!opponent) {
    return reply.status(400).send({ error: 'O nome do oponente é obrigatório.' });
  }
  try {
    const match = await db.match.create({
      data: { opponent, userId: request.user.id }
    });
    return match;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro ao criar partida.' });
  }
});

fastify.post('/api/events', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { type, posX, posY, minute, matchId } = request.body;
  try {
    const user = await db.user.findUnique({ where: { id: request.user.id } });
    
    // Regra de Negócio SaaS: Limitação do plano gratuito
    if (user.subscriptionTier === 'FREE') {
      const eventCount = await db.event.count({ where: { matchId } });
      if (eventCount >= 15) {
        return reply.status(403).send({ 
          error: 'Limite do plano gratuito atingido (Máx: 15 eventos por partida). Faça upgrade para o plano PRO.' 
        });
      }
    }

    const event = await db.event.create({
      data: {
        type,
        posX: parseFloat(posX),
        posY: parseFloat(posY),
        minute: parseInt(minute),
        matchId
      }
    });
    return event;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro ao registrar evento.' });
  }
});

fastify.get('/api/matches/:matchId/analytics', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { matchId } = request.params;
  try {
    const events = await db.event.findMany({ where: { matchId } });
    
    const totalPasses = events.filter(e => e.type === 'PASS').length;
    const totalShots = events.filter(e => e.type === 'SHOT').length;
    const totalFouls = events.filter(e => e.type === 'FOUL').length;
    const totalGoals = events.filter(e => e.type === 'GOAL').length;

    return { totalPasses, totalShots, totalFouls, totalGoals, telemetry: events };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro ao gerar análise.' });
  }
});

// --- STRIPE BILLING CORE ---
fastify.post('/api/stripe/checkout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { priceId } = request.body;
  try {
    const user = await db.user.findUnique({ where: { id: request.user.id } });

    // In-memory bypass fallback checkout session for sandbox testing
    if (useInMemoryDb || stripeSecretKey === 'sk_test_mock_key') {
      const mockSessionUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?checkout_success=true`;
      
      // Simulate tier update directly for user in sandbox
      let targetTier = 'PRO';
      if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
        targetTier = 'ENTERPRISE';
      }
      await db.user.update({
        where: { id: user.id },
        data: { subscriptionTier: targetTier }
      });

      return { url: mockSessionUrl };
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?checkout_success=true`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/plans?checkout_canceled=true`,
    });
    return { url: session.url };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro ao gerar sessão de checkout.' });
  }
});

fastify.post('/api/stripe/webhook', { config: { rawBody: true } }, async (request, reply) => {
  const sig = request.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(request.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
  }

  if (stripeEvent.type === 'customer.subscription.created' || stripeEvent.type === 'customer.subscription.updated') {
    const subscription = stripeEvent.data.object;
    const customerId = subscription.customer;
    const planPriceId = subscription.items.data[0].price.id;

    let tier = 'PRO';
    if (planPriceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
      tier = 'ENTERPRISE';
    }

    await db.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { subscriptionTier: tier }
    });
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const subscription = stripeEvent.data.object;
    const customerId = subscription.customer;

    await db.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { subscriptionTier: 'FREE' }
    });
  }

  return reply.status(200).send({ received: true });
});

// Inicialização do Servidor Fastify
const startServer = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 5000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Se não estiver rodando no Vercel, inicie o servidor localmente
if (!process.env.VERCEL) {
  startServer();
}

export default fastify;
