import Joi from 'joi';

export const createTutorialSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required(),
  slug: Joi.string().lowercase().trim().pattern(/^[a-z0-9-]+$/).required(),
  description: Joi.string().allow('').optional(),
  content: Joi.string().allow('').optional(),
  category: Joi.string().required(), // Enhance with ObjectId validation if needed

  videoUrl: Joi.string().uri().allow('', null),
  attachments: Joi.array().items(
    Joi.object({
      fileUrl: Joi.string().uri().required(),
      fileName: Joi.string().required(),
      fileType: Joi.string().required(),
    })
  ).optional(),

  tags: Joi.array().items(Joi.string()).default([]),
  level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').default('Beginner'),
  isPublished: Joi.boolean().default(false),
  estimatedReadTime: Joi.number().integer().min(1).max(60).default(5),
  thumbnail: Joi.string().uri().allow('', null),

  order: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),

  seo: Joi.object({
    metaTitle: Joi.string().max(255).allow('', null),
    metaDescription: Joi.string().max(500).allow('', null),
    metaKeywords: Joi.array().items(Joi.string()).optional(),
  }).optional()
});

// Allow partial updates by making required fields optional
export const updateTutorialSchema = createTutorialSchema.fork(
  ['title', 'category', 'slug'], 
  (schema) => schema.optional()
);
