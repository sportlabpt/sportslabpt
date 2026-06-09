// api/auth/register.js — Vercel Serverless Function (CommonJS)
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password são obrigatórios.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Falha ao registrar: E-mail já cadastrado.' });
    }

    const user = await prisma.user.create({
      data: { email, password, subscriptionTier: 'FREE' }
    });

    const secret = process.env.JWT_SECRET || 'SPORTLUIZ_SECRET_KEY_2026';
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, subscriptionTier: user.subscriptionTier }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Falha ao registrar: ' + err.message });
  } finally {
    await prisma.$disconnect();
  }
};
