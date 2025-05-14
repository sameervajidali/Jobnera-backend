import Job from '../models/Job.js';
import asyncHandler from '../utils/asyncHandler.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

// ─────────────────────────────────────────────────────────────
// GET /jobs/public
// ─────────────────────────────────────────────────────────────
export const getPublicJobs = asyncHandler(async (req, res) => {
  const { search = '', location = '', type, page = 1, limit = 10 } = req.query;
  const query = {
    title: { $regex: search, $options: 'i' },
    location: { $regex: location, $options: 'i' },
    ...(type && { jobType: type })
  };

  const jobs = await Job.find(query)
    .sort({ postedAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Job.countDocuments(query);
  res.json({ jobs, total });
});

// ─────────────────────────────────────────────────────────────
// GET /jobs/admin/jobs
// ─────────────────────────────────────────────────────────────
export const getAllJobsAdmin = asyncHandler(async (req, res) => {
  const jobs = await Job.find().sort({ createdAt: -1 });
  const { search = "", status, jobType, workType } = req.query;
  const query = {
    ...(search && { title: { $regex: search, $options: "i" } }),
    ...(status && { status }),
    ...(jobType && { jobType }),
    ...(workType && { workType }),
  };


  res.json({ jobs });
});

// ─────────────────────────────────────────────────────────────
// GET /jobs/:id
// ─────────────────────────────────────────────────────────────
export const getSingleJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
});

// ─────────────────────────────────────────────────────────────
// POST /jobs/admin/jobs
// ─────────────────────────────────────────────────────────────
export const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ message: 'Job created', job });
});

// ─────────────────────────────────────────────────────────────
// PUT /jobs/admin/jobs/:id
// ─────────────────────────────────────────────────────────────
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ message: 'Job updated', job });
});

// ─────────────────────────────────────────────────────────────
// DELETE /jobs/admin/jobs/:id
// ─────────────────────────────────────────────────────────────
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ message: 'Job deleted' });
});

// ─────────────────────────────────────────────────────────────
// POST /jobs/admin/jobs/bulk-upload
// ─────────────────────────────────────────────────────────────
export const bulkUploadJobs = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'CSV file is required' });
  }

  const jobs = [];
  const stream = Readable.from(req.file.buffer);

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => {
        if (data.title && data.applyLink && data.company && data.location) {
          jobs.push({
            title: data.title,
            company: data.company,
            location: data.location,
            workType: data.workType || 'Remote',
            jobType: data.jobType || 'Full-time',
            skills: data.skills?.split(',').map(s => s.trim()) || [],
            salaryRange: data.salaryRange || '',
            applyLink: data.applyLink,
            source: data.source || 'Manual',
            createdBy: req.user._id,
          });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  const inserted = await Job.insertMany(jobs);
  res.status(201).json({
    message: 'Jobs uploaded successfully',
    count: inserted.length
  });
});
