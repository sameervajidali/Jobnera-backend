import Joi from 'joi';

export const blogPostSchema = Joi.object({
  title: Joi.string().min(5).max(150).required(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).lowercase(),  // <-- ADD THIS LINE!
  summary: Joi.string().max(300),
  content: Joi.string().min(10).required(),
  category: Joi.string().required(),
  tags: Joi.array().items(Joi.string()),
  coverImageUrl: Joi.string().uri().allow(''),
  deletedAt: { type: Date },
  status: Joi.string().valid('draft', 'review', 'published', 'archived').default('draft'),
});


export function validateBlogPost(body, partial = false) {
  const result = partial
    ? blogPostSchema.fork(Object.keys(body), field => field.optional()).validate(body)
    : blogPostSchema.validate(body);
  if (result.error) throw result.error;
}


export const blogTagSchema = Joi.object({
  name: Joi.string().min(2).max(48).required(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).lowercase(),
  description: Joi.string().max(512).allow(''),
  color: Joi.string().max(32).allow(''),
});


export const blogCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).lowercase(),
  description: Joi.string().max(1000).allow(''),
  icon: Joi.string().max(40).allow(''),
  order: Joi.number().integer().min(0).max(999),
  isVisible: Joi.boolean(),
  type: Joi.string().valid('quiz', 'blog', 'tutorial', 'resume', 'faq', 'all'),
});


export const blogCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  // If your comment form allows these:
  // status: Joi.string().valid('pending', 'approved', 'flagged'), // usually set by server/mod
  // parentComment: Joi.string().optional(), // Set by reply controller, not by user directly
});