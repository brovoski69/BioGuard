// ═══════════════════════════════════════════════════════════════
// BioGuard — Physics Engine (Standalone Frontend)
// Mirrors backend calculations for offline use
// ═══════════════════════════════════════════════════════════════

import { JOINTS, JOINT_SAFE_LIMITS, CONDITION_MODIFIERS } from '../utils/constants.js';
import { clamp, calculateBMI } from '../utils/helpers.js';

export default class PhysicsEngine {
    constructor(profileData) {
        this.profile = profileData;
        this.bodyWeight = profileData.weight || 70;
        this.height = profileData.height || 170;
        this.age = profileData.age || 25;
        this.bodyType = profileData.body_type || 'mesomorph';
        this.conditions = profileData.health_conditions || [];
        this.gravity = 9.81;
    }

    // ── Core Force Calculation ───────────────────────────────
    calculateJointForces(postureAngles, externalLoad = 0) {
        const { trunk, knee, hip } = postureAngles;
        const bw = this.bodyWeight * this.gravity; // Body weight in Newtons
        const load = externalLoad * this.gravity;

        // Biomechanical force models (simplified)
        const forces = {
            knee: this._calcKneeForce(knee, bw, load),
            spine: this._calcSpineForce(trunk, bw, load),
            hip: this._calcHipForce(hip, bw, load),
            ankle: this._calcAnkleForce(knee, hip, bw, load),
            shoulder: this._calcShoulderForce(trunk, bw, load)
        };

        // Apply body type modifier
        const btMod = this._getBodyTypeModifier();
        Object.keys(forces).forEach(j => forces[j] *= btMod);

        return forces;
    }

    _calcKneeForce(kneeAngle, bw, load) {
        // Knee force increases with flexion angle
        const angleFactor = 1 + (Math.sin(kneeAngle * Math.PI / 180) * 3.5);
        const baseFraction = 0.65; // % of body weight on knees
        return (bw * baseFraction + load) * angleFactor;
    }

    _calcSpineForce(trunkAngle, bw, load) {
        // Spine compressive force increases with forward lean
        const angleFactor = 1 + (Math.sin(trunkAngle * Math.PI / 180) * 4.0);
        const baseFraction = 0.6;
        return (bw * baseFraction + load * 1.5) * angleFactor;
    }

    _calcHipForce(hipAngle, bw, load) {
        const angleFactor = 1 + (Math.sin(hipAngle * Math.PI / 180) * 2.8);
        const baseFraction = 0.55;
        return (bw * baseFraction + load * 0.8) * angleFactor;
    }

    _calcAnkleForce(kneeAngle, hipAngle, bw, load) {
        const avgAngle = (kneeAngle + hipAngle) / 2;
        const angleFactor = 1 + (Math.sin(avgAngle * Math.PI / 180) * 1.8);
        const baseFraction = 0.5;
        return (bw * baseFraction + load * 0.6) * angleFactor;
    }

    _calcShoulderForce(trunkAngle, bw, load) {
        const angleFactor = 1 + (Math.sin(trunkAngle * Math.PI / 180) * 1.5);
        const baseFraction = 0.15;
        return (bw * baseFraction + load * 2.0) * angleFactor;
    }

    _getBodyTypeModifier() {
        switch (this.bodyType) {
            case 'ectomorph': return 0.88;
            case 'endomorph': return 1.15;
            default: return 1.0;
        }
    }

    // ── Risk Score Calculation ────────────────────────────────
    calculateRiskScores(jointForces) {
        const scores = {};
        let conditionModifiers = this._getCombinedConditionModifiers();

        JOINTS.forEach(joint => {
            let baseRisk = (jointForces[joint] / JOINT_SAFE_LIMITS[joint]) * 50;
            
            // Apply age factor (risk increases with age)
            const ageFactor = this.age > 50 ? 1 + (this.age - 50) * 0.008 :
                              this.age < 20 ? 0.9 : 1.0;
            baseRisk *= ageFactor;

            // Apply health condition modifiers
            baseRisk *= (conditionModifiers[joint] || 1.0);

            scores[joint] = clamp(Math.round(baseRisk), 0, 100);
        });

        // Overall = weighted average (knee & spine weighted more)
        const weights = { knee: 0.25, spine: 0.25, hip: 0.2, ankle: 0.15, shoulder: 0.15 };
        scores.overall = Math.round(
            JOINTS.reduce((sum, j) => sum + scores[j] * weights[j], 0)
        );
        scores.overall = clamp(scores.overall, 0, 100);

        return scores;
    }

    _getCombinedConditionModifiers() {
        const combined = { knee: 1, spine: 1, hip: 1, ankle: 1, shoulder: 1 };
        this.conditions.forEach(cond => {
            const mod = CONDITION_MODIFIERS[cond];
            if (mod) {
                JOINTS.forEach(j => {
                    combined[j] = Math.max(combined[j], mod[j]);
                });
            }
        });
        return combined;
    }

    // ── Risk Level String ────────────────────────────────────
    getRiskLevel(score) {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'moderate';
        if (score >= 20) return 'low';
        return 'minimal';
    }

    // ── Long-Term Projection ─────────────────────────────────
    calculateLongTermProjection(riskScores, durationMinutes) {
        const durationFactor = Math.min(durationMinutes / 60, 8) / 8;
        const periods = ['6months', '1year', '2years', '5years', '10years'];
        const multipliers = [1.05, 1.12, 1.25, 1.5, 1.8];
        
        const projection = {};
        periods.forEach((period, i) => {
            projection[period] = {};
            JOINTS.forEach(joint => {
                const base = riskScores[joint];
                const growth = base * multipliers[i] * (0.7 + durationFactor * 0.6);
                projection[period][joint] = clamp(Math.round(growth), 0, 100);
            });
            // Overall for this period
            const weights = { knee: 0.25, spine: 0.25, hip: 0.2, ankle: 0.15, shoulder: 0.15 };
            projection[period].overall = Math.round(
                JOINTS.reduce((s, j) => s + projection[period][j] * weights[j], 0)
            );
            projection[period].overall = clamp(projection[period].overall, 0, 100);
        });
        
        return projection;
    }

    // ── Recommendations ──────────────────────────────────────
    getRecommendations(riskScores, scenarioName = '') {
        const recs = [];
        const overall = riskScores.overall;

        if (overall >= 80) {
            recs.push('⚠️ CRITICAL RISK: Immediately reduce activity intensity or stop. Consult a healthcare professional.');
        } else if (overall >= 60) {
            recs.push('⚠️ HIGH RISK: Reduce activity duration and consider alternative exercises.');
        }

        if (riskScores.knee >= 60) {
            recs.push('🦵 KNEE: Avoid deep squatting and high-impact activities. Use knee support if needed.');
        }
        if (riskScores.knee >= 40) {
            recs.push('🦵 KNEE: Warm up thoroughly before activity. Consider low-impact alternatives.');
        }

        if (riskScores.spine >= 60) {
            recs.push('🔙 SPINE: Maintain a neutral spine position. Avoid heavy lifting without proper form.');
        }
        if (riskScores.spine >= 40) {
            recs.push('🔙 SPINE: Take regular breaks to stretch. Use lumbar support when sitting.');
        }

        if (riskScores.hip >= 60) {
            recs.push('🦴 HIP: Limit prolonged sitting. Perform hip mobility exercises.');
        }

        if (riskScores.ankle >= 60) {
            recs.push('🦶 ANKLE: Wear supportive footwear. Avoid uneven surfaces.');
        }

        if (riskScores.shoulder >= 60) {
            recs.push('💪 SHOULDER: Avoid overhead activities. Strengthen rotator cuff muscles.');
        }

        // General recommendations
        recs.push('💧 Stay hydrated — proper hydration supports joint health and cartilage function.');
        recs.push('🧘 Practice regular stretching to maintain flexibility and joint range of motion.');

        if (this.age > 50) {
            recs.push('👴 Age consideration: Focus on low-impact exercises and allow more recovery time.');
        }

        const bmi = calculateBMI(this.bodyWeight, this.height);
        if (bmi > 30) {
            recs.push('⚖️ Weight management can significantly reduce joint stress, especially on knees and hips.');
        }

        this.conditions.forEach(cond => {
            if (cond === 'arthritis') recs.push('🦴 ARTHRITIS: Apply warm compresses before activity. Avoid repetitive joint stress.');
            if (cond === 'osteoporosis') recs.push('🦷 OSTEOPOROSIS: Avoid high-impact exercises. Focus on weight-bearing activities with proper support.');
            if (cond === 'sciatica') recs.push('⚡ SCIATICA: Avoid prolonged sitting. Use ergonomic seating and maintain lumbar curve.');
        });

        return recs;
    }

    // ── Full Analysis (API mirror) ───────────────────────────
    getFullAnalysis(postureAngles, externalLoad = 0, durationMinutes = 60) {
        const jointForces = this.calculateJointForces(postureAngles, externalLoad);
        const riskScores = this.calculateRiskScores(jointForces);
        const longTermProjection = this.calculateLongTermProjection(riskScores, durationMinutes);
        const recommendations = this.getRecommendations(riskScores);
        const riskLevel = this.getRiskLevel(riskScores.overall);
        const bmi = calculateBMI(this.bodyWeight, this.height);

        return {
            jointForces,
            riskScores,
            longTermProjection,
            recommendations,
            riskLevel,
            profileSummary: {
                name: this.profile.name || 'User',
                age: this.age,
                bmi: Math.round(bmi * 10) / 10,
                bodyType: this.bodyType,
                conditions: this.conditions
            }
        };
    }
}
