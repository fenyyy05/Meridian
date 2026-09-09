const { z } = require('zod');

const schema = z.object({
  deadline: z.string().datetime().optional().nullable(),
});

console.log(schema.safeParse({ deadline: "2026-09-10T14:30" }));
console.log(schema.safeParse({ deadline: "2026-09-10T14:30:00.000Z" }));
