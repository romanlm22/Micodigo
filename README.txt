QUICKSTART

1) Requisitos: Node 20+, npm, npx
2) Instalar deps:
   npm install

3) Generar cliente Prisma + migraciones (crea dev.db):
   npx prisma generate
   npx prisma migrate dev --name init

4) Sembrar base con usuarios y tópicos de ejemplo:
   npm run db:seed

Credenciales de prueba:
  user@example.com / password123
  admin@example.com / admin123

5) Iniciar API en puerto 8080:
   npm run dev

6) Endpoints (protegidos con JWT excepto / y /auth/login):

   POST http://localhost:8080/auth/login
   body JSON: {"email":"user@example.com","password":"password123"}

   -> responde: {"token":"...","user":{...}}

   Usar el token con el header:
     Authorization: Bearer <token>

   GET  /topicos
   POST /topicos  (JSON: {"titulo":"...","mensaje":"...","nombreCurso":"..."})
   PUT  /topicos/:id
   DELETE /topicos/:id
