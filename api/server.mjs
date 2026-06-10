import fastify from '../server/src/server.js';

export default async function handler(req, res) {
  // Garantir que o app Fastify esteja totalmente pronto
  await fastify.ready();
  
  // Delegar a requisição Serverless nativa (Node.js) para o Fastify lidar
  fastify.server.emit('request', req, res);
}
