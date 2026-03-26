/**
 * ReportManager - Handles report generation and storage
 * Manages report creation, PDF upload, and retrieval
 */

import { supabase } from './SupabaseClient.js';

class ReportManager {
    /**
     * Generate and save a new report
     * @param {string} userId - User UUID
     * @param {string} sessionId - Session UUID
     * @param {Object} reportData - Report data including recommendations, long_term_projection
     * @returns {Promise<{report: Object|null, error: Error|null}>}
     */
    async generateReport(userId, sessionId, reportData) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }
            if (!sessionId) {
                throw new Error('Session ID is required');
            }

            const { recommendations = [], long_term_projection = {}, pdf_url = null } = reportData;

            // Validate recommendations
            if (!Array.isArray(recommendations)) {
                throw new Error('Recommendations must be an array');
            }

            // Validate long_term_projection
            if (typeof long_term_projection !== 'object') {
                throw new Error('Long term projection must be an object');
            }

            const { data, error } = await supabase
                .from('reports')
                .insert({
                    user_id: userId,
                    session_id: sessionId,
                    recommendations,
                    long_term_projection,
                    pdf_url
                })
                .select()
                .single();

            if (error) throw error;

            return { report: data, error: null };
        } catch (error) {
            console.error('GenerateReport error:', error.message);
            return { report: null, error };
        }
    }

    /**
     * Upload PDF report to Supabase Storage
     * @param {string} userId - User UUID
     * @param {Blob} pdfBlob - PDF file blob
     * @param {string} fileName - Optional custom file name
     * @returns {Promise<{path: string|null, error: Error|null}>}
     */
    async uploadPDF(userId, pdfBlob, fileName = null) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }
            if (!pdfBlob) {
                throw new Error('PDF blob is required');
            }

            // Generate file name if not provided
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const finalFileName = fileName || `report_${timestamp}.pdf`;
            
            // File path: userId/filename (for RLS policy)
            const filePath = `${userId}/${finalFileName}`;

            const { data, error } = await supabase.storage
                .from('reports')
                .upload(filePath, pdfBlob, {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            return { path: data.path, error: null };
        } catch (error) {
            console.error('UploadPDF error:', error.message);
            return { path: null, error };
        }
    }

    /**
     * Get signed URL for PDF download
     * @param {string} filePath - File path in storage
     * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
     * @returns {Promise<{url: string|null, error: Error|null}>}
     */
    async getReportURL(filePath, expiresIn = 3600) {
        try {
            if (!filePath) {
                throw new Error('File path is required');
            }

            const { data, error } = await supabase.storage
                .from('reports')
                .createSignedUrl(filePath, expiresIn);

            if (error) throw error;

            return { url: data.signedUrl, error: null };
        } catch (error) {
            console.error('GetReportURL error:', error.message);
            return { url: null, error };
        }
    }

    /**
     * Get all reports for a user
     * @param {string} userId - User UUID
     * @param {Object} options - Query options (limit, offset)
     * @returns {Promise<{reports: Array|null, error: Error|null}>}
     */
    async getReports(userId, options = {}) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const { limit = 50, offset = 0 } = options;

            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    simulation_sessions (
                        scenario,
                        posture_angles,
                        joint_forces,
                        risk_scores,
                        created_at
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return { reports: data, error: null };
        } catch (error) {
            console.error('GetReports error:', error.message);
            return { reports: null, error };
        }
    }

    /**
     * Get a single report by ID
     * @param {string} reportId - Report UUID
     * @returns {Promise<{report: Object|null, error: Error|null}>}
     */
    async getReport(reportId) {
        try {
            if (!reportId) {
                throw new Error('Report ID is required');
            }

            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    simulation_sessions (
                        scenario,
                        posture_angles,
                        joint_forces,
                        risk_scores,
                        load_weight,
                        activity_duration,
                        created_at
                    )
                `)
                .eq('id', reportId)
                .single();

            if (error) throw error;

            return { report: data, error: null };
        } catch (error) {
            console.error('GetReport error:', error.message);
            return { report: null, error };
        }
    }

    /**
     * Update report with PDF URL
     * @param {string} reportId - Report UUID
     * @param {string} pdfUrl - PDF file URL/path
     * @returns {Promise<{report: Object|null, error: Error|null}>}
     */
    async updateReportPDF(reportId, pdfUrl) {
        try {
            if (!reportId) {
                throw new Error('Report ID is required');
            }

            const { data, error } = await supabase
                .from('reports')
                .update({ pdf_url: pdfUrl })
                .eq('id', reportId)
                .select()
                .single();

            if (error) throw error;

            return { report: data, error: null };
        } catch (error) {
            console.error('UpdateReportPDF error:', error.message);
            return { report: null, error };
        }
    }

    /**
     * Delete a report and its associated PDF
     * @param {string} reportId - Report UUID
     * @param {string} pdfPath - PDF file path (optional)
     * @returns {Promise<{success: boolean, error: Error|null}>}
     */
    async deleteReport(reportId, pdfPath = null) {
        try {
            if (!reportId) {
                throw new Error('Report ID is required');
            }

            // Delete PDF from storage if path provided
            if (pdfPath) {
                await supabase.storage
                    .from('reports')
                    .remove([pdfPath]);
            }

            // Delete report from database
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', reportId);

            if (error) throw error;

            return { success: true, error: null };
        } catch (error) {
            console.error('DeleteReport error:', error.message);
            return { success: false, error };
        }
    }

    /**
     * List all PDF files for a user from storage
     * @param {string} userId - User UUID
     * @returns {Promise<{files: Array|null, error: Error|null}>}
     */
    async listUserPDFs(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const { data, error } = await supabase.storage
                .from('reports')
                .list(userId, {
                    limit: 100,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) throw error;

            return { files: data, error: null };
        } catch (error) {
            console.error('ListUserPDFs error:', error.message);
            return { files: null, error };
        }
    }
}

export default ReportManager;
