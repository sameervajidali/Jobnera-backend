import Tutorial from '../models/Tutorial.js';
import TutorialCategory from '../models/TutorialCategory.js';
import mongoose from 'mongoose';
import Joi from 'joi';

// Validation schemas (can be extracted to separate file if preferred)


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

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().allow('').optional(),
});

const updateCategorySchema = createCategorySchema.fork(['name'], (schema) => schema.optional());

// Helper: pagination + filters parsing
function parseQueryParams(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const search = req.query.search ? req.query.search.trim() : null;
  const status = req.query.status || null;
  const category = req.query.category || null;
  const sortBy = req.query.sortBy || 'order';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
  return { page, limit, search, status, category, sortBy, sortOrder };
}

// ──────────────────────────────────────────────────────────────
// Public controllers
// ──────────────────────────────────────────────────────────────

export const getPublicTutorials = async (req, res) => {
  try {
    const { page, limit, search, status, category, sortBy, sortOrder } = parseQueryParams(req);

    // Only published tutorials visible publicly
    const filter = { status: 'published' };

    if (category && mongoose.Types.ObjectId.isValid(category)) filter.category = category;

    if (search) {
      filter.$text = { $search: search };
    }

    const total = await Tutorial.countDocuments(filter);
    const tutorials = await Tutorial.find(filter)
      .populate('category', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      data: tutorials,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getPublicTutorials error:', error);
    res.status(500).json({ message: 'Server error fetching tutorials' });
  }
};

export const getTutorialById = async (req, res) => {
  try {
    const { tutorialId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tutorialId))
      return res.status(400).json({ message: 'Invalid tutorial ID' });

    // Admins can view all; public only published
    let tutorialQuery = Tutorial.findById(tutorialId).populate('category', 'name');

    if (!req.user) {
      tutorialQuery = tutorialQuery.where({ status: 'published' });
    }

    const tutorial = await tutorialQuery.lean();
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });

    res.json(tutorial);
  } catch (error) {
    console.error('getTutorialById error:', error);
    res.status(500).json({ message: 'Server error fetching tutorial' });
  }
};

export const getTutorialCategories = async (_req, res) => {
  try {
    const categories = await TutorialCategory.find().sort('name').lean();
    res.json(categories);
  } catch (error) {
    console.error('getTutorialCategories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

// ──────────────────────────────────────────────────────────────
// Admin controllers
// ──────────────────────────────────────────────────────────────

export const createTutorial = async (req, res) => {
  try {
    const { error, value } = createTutorialSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation error', details: error.details });

    const tutorial = new Tutorial({
      ...value,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await tutorial.save();

    res.status(201).json({ message: 'Tutorial created', tutorial });
  } catch (error) {
    console.error('createTutorial error:', error);
    res.status(500).json({ message: 'Server error creating tutorial' });
  }
};

export const listTutorials = async (req, res) => {
  try {
    const { page, limit, search, status, category, sortBy, sortOrder } = parseQueryParams(req);

    const filter = {};
    if (status) filter.status = status;
    if (category && mongoose.Types.ObjectId.isValid(category)) filter.category = category;

    if (search) filter.$text = { $search: search };

    const total = await Tutorial.countDocuments(filter);
    const tutorials = await Tutorial.find(filter)
      .populate('category', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      data: tutorials,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('listTutorials error:', error);
    res.status(500).json({ message: 'Server error listing tutorials' });
  }
};

export const updateTutorial = async (req, res) => {
  try {
    const { tutorialId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tutorialId))
      return res.status(400).json({ message: 'Invalid tutorial ID' });

    const { error, value } = updateTutorialSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation error', details: error.details });

    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });

    Object.assign(tutorial, value);
    tutorial.updatedBy = req.user._id;
    await tutorial.save();

    res.json({ message: 'Tutorial updated', tutorial });
  } catch (error) {
    console.error('updateTutorial error:', error);
    res.status(500).json({ message: 'Server error updating tutorial' });
  }
};

export const deleteTutorial = async (req, res) => {
  try {
    const { tutorialId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tutorialId))
      return res.status(400).json({ message: 'Invalid tutorial ID' });

    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });

    await tutorial.remove();

    res.json({ message: 'Tutorial deleted' });
  } catch (error) {
    console.error('deleteTutorial error:', error);
    res.status(500).json({ message: 'Server error deleting tutorial' });
  }
};

export const bulkUpdateTutorials = async (req, res) => {
  try {
    const { ids, status, orderUpdates } = req.body;

    if (!Array.isArray(ids) || ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'Invalid tutorial IDs array' });
    }

    const updateFields = {};
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      updateFields.status = status;
    }

    if (orderUpdates && typeof orderUpdates === 'object') {
      // Update orders in bulk
      const bulkOps = Object.entries(orderUpdates).map(([tid, order]) => ({
        updateOne: {
          filter: { _id: tid },
          update: { order: parseInt(order, 10) || 0, updatedBy: req.user._id },
        },
      }));
      await Tutorial.bulkWrite(bulkOps);
    }

    if (Object.keys(updateFields).length) {
      await Tutorial.updateMany(
        { _id: { $in: ids } },
        { ...updateFields, updatedBy: req.user._id }
      );
    }

    res.json({ message: 'Bulk update successful' });
  } catch (error) {
    console.error('bulkUpdateTutorials error:', error);
    res.status(500).json({ message: 'Server error bulk updating tutorials' });
  }
};

// ──────────────────────────────────────────────────────────────
// Tutorial Categories Admin controllers
// ──────────────────────────────────────────────────────────────

export const createTutorialCategory = async (req, res) => {
  try {
    const { error, value } = createCategorySchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation error', details: error.details });

    // Check uniqueness
    const existing = await TutorialCategory.findOne({ name: value.name });
    if (existing) return res.status(400).json({ message: 'Category name already exists' });

    const category = new TutorialCategory(value);
    await category.save();

    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    console.error('createTutorialCategory error:', error);
    res.status(500).json({ message: 'Server error creating category' });
  }
};

export const listTutorialCategories = async (_req, res) => {
  try {
    const categories = await TutorialCategory.find().sort('name').lean();
    res.json(categories);
  } catch (error) {
    console.error('listTutorialCategories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

export const updateTutorialCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId))
      return res.status(400).json({ message: 'Invalid category ID' });

    const { error, value } = updateCategorySchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation error', details: error.details });

    const category = await TutorialCategory.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (value.name && value.name !== category.name) {
      const existing = await TutorialCategory.findOne({ name: value.name });
      if (existing) return res.status(400).json({ message: 'Category name already exists' });
    }

    Object.assign(category, value);
    await category.save();

    res.json({ message: 'Category updated', category });
  } catch (error) {
    console.error('updateTutorialCategory error:', error);
    res.status(500).json({ message: 'Server error updating category' });
  }
};

export const deleteTutorialCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId))
      return res.status(400).json({ message: 'Invalid category ID' });

    const category = await TutorialCategory.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Optional: check if any tutorials reference this category before deleting
    const tutorialsUsing = await Tutorial.exists({ category: categoryId });
    if (tutorialsUsing)
      return res.status(400).json({ message: 'Cannot delete category: Tutorials exist under this category' });

    await category.remove();

    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('deleteTutorialCategory error:', error);
    res.status(500).json({ message: 'Server error deleting category' });
  }
};
