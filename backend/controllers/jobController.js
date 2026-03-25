const Job = require('../models/Job');

class JobController {
    // Get all jobs
    static async getAllJobs(req, res) {
        try {
            const jobs = await Job.findAll({
                order: [['record_id']]
            });
            res.json({
                success: true,
                count: jobs.length,
                data: jobs
            });
        } catch (error) {
            console.error('Error in getAllJobs:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch jobs'
            });
        }
    }

    // Get single job
    static async getJob(req, res) {
        try {
            const { id } = req.params;
            const job = await Job.findByPk(id);

            if (!job) {
                return res.status(404).json({
                    success: false,
                    error: 'Job not found'
                });
            }

            res.json({
                success: true,
                data: job
            });
        } catch (error) {
            console.error('Error in getJob:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch job'
            });
        }
    }
}

module.exports = JobController;
