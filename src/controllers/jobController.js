// src/controllers/jobController.js
import Job from '../models/Job.js';
import asyncHandler from '../utils/asyncHandler.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

// ─────────────────────────────────────────────────────────────
// GET /jobs/public?search=&location=&type=&page=&limit=
// ─────────────────────────────────────────────────────────────
export const getPublicJobs = asyncHandler(async (req, res) => {
  const { search = '', location = '', type, page = 1, limit = 10 } = req.query;
  const query = {
    ...(search && { title: { $regex: search, $options: 'i' } }),
    ...(location && { location: { $regex: location, $options: 'i' } }),
    ...(type && { jobType: type }),
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort({ postedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(query)
  ]);

  res.json({ jobs, total, page: Number(page), limit: Number(limit) });
});

// ─────────────────────────────────────────────────────────────
// GET /jobs/admin?search=&status=&jobType=&workType=&page=&limit=
// ─────────────────────────────────────────────────────────────
export const getAllJobsAdmin = asyncHandler(async (req, res) => {
  const { search = '', status, jobType, workType, page = 1, limit = 25 } = req.query;
  const query = {
    ...(search && { title: { $regex: search, $options: 'i' } }),
    ...(status && { status }),
    ...(jobType && { jobType }),
    ...(workType && { workType }),
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Job.countDocuments(query)
  ]);

  res.json({ jobs, total, page: Number(page), limit: Number(limit) });
});

// ─────────────────────────────────────────────────────────────
// GET /jobs/:id
// ─────────────────────────────────────────────────────────────
export const getSingleJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).lean();
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
});

// ─────────────────────────────────────────────────────────────
// POST /jobs/admin
// ─────────────────────────────────────────────────────────────
export const createJob = asyncHandler(async (req, res) => {
  const payload = { ...req.body, createdBy: req.user._id };
  const job = await Job.create(payload);
  res.status(201).json({ message: 'Job created', job });
});

// ─────────────────────────────────────────────────────────────
// PUT /jobs/admin/:id
// ─────────────────────────────────────────────────────────────
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ message: 'Job updated', job });
});

// ─────────────────────────────────────────────────────────────
// DELETE /jobs/admin/:id
// ─────────────────────────────────────────────────────────────
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id).lean();
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ message: 'Job deleted' });
});

// ─────────────────────────────────────────────────────────────
// POST /jobs/admin/bulk-upload
// ─────────────────────────────────────────────────────────────
export const bulkUploadJobs = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'CSV file is required' });
  }

  const jobsToInsert = [];
  const stream = Readable.from(req.file.buffer);

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => {
        const { title, company, location, workType, jobType, skills, salaryRange, applyLink, source } = data;
        if (title && company && location && applyLink) {
          jobsToInsert.push({
            title: title.trim(),
            company: company.trim(),
            location: location.trim(),
            workType: WORK_TYPES.includes(workType) ? workType : 'Remote',
            jobType: JOB_TYPES.includes(jobType) ? jobType : 'Full-time',
            skills: skills ? skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [],
            salaryRange: salaryRange?.trim() || '',
            applyLink: applyLink.trim(),
            source: source?.trim() || 'Manual',
            createdBy: req.user._id
          });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  const inserted = await Job.insertMany(jobsToInsert);
  res.status(201).json({ message: 'Bulk upload successful', count: inserted.length });
});

// Constants for validator
export const FILTERABLE_FIELDS = ['status', 'jobType', 'workType'];
