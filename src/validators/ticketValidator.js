// src/validators/ticketValidator.js
import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/)
});

// src/validators/ticketValidator.js
import { z } from 'zod';

export const createTicketSchema = z
  .object({
    subject:     z.string().min(5),
    description: z.string().min(10),       // accept description
    priority:    z.enum(['low','medium','high']).optional()
  })
  .transform(({ subject, description, priority }) => ({
    subject,
    message: description,                  // rename it here
    priority
  }));


export const updateTicketSchema = z.object({
  status:   z.enum(['open','in_progress','closed']).optional(),
  priority: z.enum(['low','medium','high']).optional()
});

export const commentSchema = z.object({
  text: z.string().min(1)
});
