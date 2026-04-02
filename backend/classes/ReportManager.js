// Handles everything related to reports - creating them, storing PDFs, fetching history

import { supabase } from './SupabaseClient.js';

class ReportManager {
    
    // Create a new report from simulation results
    async generateReport(userId, sessionId, reportData) {
        try {
            if (!userId) throw new Error('User ID is required');
            if (!sessionId) throw new Error('Session ID is required');

            const { recommendations = [], long_term_projection = {}, pdf_url = null } = reportData;

            if (!Array.isArray(recommendations)) {
                throw new Error('Recommendations must be an array');
            }
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

    // Upload a PDF to Supabase storage - files go in userId/filename path
    async uploadPDF(userId, pdfBlob, fileName = null) {
        try {
            if (!userId) throw new Error('User ID is required');
            if (!pdfBlob) throw new Error('PDF blob is required');

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const finalFileName = fileName || `report_${timestamp}.pdf`;
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

    // Get a temporary download link for a PDF (expires in 1 hour by default)
    async getReportURL(filePath, expiresIn = 3600) {
        try {
            if (!filePath) throw new Error('File path is required');

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

    // Fetch all reports for a user - includes related session data
    async getReports(userId, options = {}) {
        try {
            if (!userId) throw new Error('User ID is required');

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

    // Get one report with full session details
    async getReport(reportId) {
        try {
            if (!reportId) throw new Error('Report ID is required');

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

    // Link a PDF file to an existing report
    async updateReportPDF(reportId, pdfUrl) {
        try {
            if (!reportId) throw new Error('Report ID is required');

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

    // Remove a report - also deletes the PDF file if a path is given
    async deleteReport(reportId, pdfPath = null) {
        try {
            if (!reportId) throw new Error('Report ID is required');

            if (pdfPath) {
                await supabase.storage.from('reports').remove([pdfPath]);
            }

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

    // List all PDF files a user has uploaded
    async listUserPDFs(userId) {
        try {
            if (!userId) throw new Error('User ID is required');

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
