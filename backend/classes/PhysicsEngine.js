/**
 * PhysicsEngine - Core biomechanics simulation engine
 * Calculates joint forces, risk scores, and long-term projections
 * Uses realistic biomechanics formulas adjusted for user profile
 */

class PhysicsEngine {
    /**
     * Initialize physics engine with user profile data
     * @param {Object} profileData - User profile (age, weight, height, health_conditions)
     */
    constructor(profileData) {
        this.age = profileData.age || 30;
        this.weight = profileData.weight || 70; // kg
        this.height = profileData.height || 170; // cm
        this.bodyType = profileData.body_type || 'mesomorph';
        this.healthConditions = profileData.health_conditions || [];

        // Calculate derived metrics
        this.bodyMass = this.weight; // kg
        this.bmi = this.weight / Math.pow(this.height / 100, 2);
        
        // Age-based safe thresholds (decrease with age)
        this.safeThresholds = this.calculateSafeThresholds();
        
        // Health condition multipliers
        this.conditionMultipliers = this.calculateConditionMultipliers();
    }

    /**
     * Calculate age-adjusted safe thresholds for joint forces
     * @returns {Object} Safe thresholds for each joint
     */
    calculateSafeThresholds() {
        // Base thresholds for a healthy 25-year-old (in Newtons)
        const baseThresholds = {
            knee: 450,
            spine: 900,
            hip: 400,
            ankle: 350,
            shoulder: 300
        };

        // Age degradation factor (starts declining after 25)
        const ageFactor = this.age <= 25 ? 1 : 1 - ((this.age - 25) * 0.008);
        
        // BMI adjustment (higher BMI = lower safe threshold)
        const bmiFactor = this.bmi <= 25 ? 1 : 1 - ((this.bmi - 25) * 0.02);

        // Body type adjustments
        const bodyTypeFactors = {
            ectomorph: 0.9,  // Lighter frame, lower thresholds
            mesomorph: 1.0, // Athletic build, standard
            endomorph: 0.95 // Heavier build, slightly lower
        };
        const bodyTypeFactor = bodyTypeFactors[this.bodyType] || 1;

        // Apply all factors to base thresholds
        const thresholds = {};
        for (const [joint, base] of Object.entries(baseThresholds)) {
            thresholds[joint] = base * ageFactor * bmiFactor * bodyTypeFactor;
        }

        return thresholds;
    }

    /**
     * Calculate risk multipliers based on health conditions
     * @returns {Object} Multipliers for risk calculation
     */
    calculateConditionMultipliers() {
        const multipliers = {
            overall: 1,
            knee: 1,
            spine: 1,
            hip: 1
        };

        const conditionEffects = {
            arthritis: { knee: 1.5, hip: 1.4, spine: 1.2, overall: 1.3 },
            osteoporosis: { knee: 1.3, hip: 1.5, spine: 1.6, overall: 1.4 },
            herniated_disc: { spine: 1.8, hip: 1.2, overall: 1.3 },
            knee_injury: { knee: 1.6, hip: 1.1, overall: 1.2 },
            hip_replacement: { hip: 1.7, knee: 1.2, overall: 1.3 },
            obesity: { knee: 1.4, hip: 1.3, spine: 1.3, overall: 1.3 },
            scoliosis: { spine: 1.5, hip: 1.2, overall: 1.2 },
            sciatica: { spine: 1.4, hip: 1.3, overall: 1.2 }
        };

        for (const condition of this.healthConditions) {
            const effects = conditionEffects[condition.toLowerCase()];
            if (effects) {
                for (const [joint, factor] of Object.entries(effects)) {
                    multipliers[joint] = (multipliers[joint] || 1) * factor;
                }
            }
        }

        return multipliers;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Calculate joint forces based on posture angles and load
     * @param {Object} postureAngles - Angles for trunk, knee, hip (in degrees)
     * @param {number} loadWeight - External load weight in kg
     * @returns {Object} Forces on each joint in Newtons
     */
    calculateJointForces(postureAngles, loadWeight = 0) {
        const { trunk = 0, knee = 0, hip = 0 } = postureAngles;
        const g = 9.81; // Gravity constant
        const bodyWeight = this.bodyMass * g; // Body weight in Newtons
        const loadForce = loadWeight * g; // Load in Newtons

        // Moment arm calculations (approximate, based on body proportions)
        const kneeMomentArm = this.height * 0.002; // ~0.34m for 170cm person
        const spineMomentArm = this.height * 0.003; // ~0.51m for 170cm person
        const hipMomentArm = this.height * 0.0015; // ~0.255m for 170cm person

        // Knee force calculation
        // F_knee = (bodyWeight × 0.5 × sin(kneeAngle)) + (load × momentArm)
        const kneeAngleRad = this.toRadians(knee);
        const kneeForce = (bodyWeight * 0.5 * Math.sin(kneeAngleRad)) + 
                          (loadForce * kneeMomentArm * Math.cos(kneeAngleRad));

        // Spinal compression calculation
        // F_spine = bodyWeight × sin(trunkAngle) + load
        const trunkAngleRad = this.toRadians(trunk);
        const spineForce = (bodyWeight * 0.6 * Math.sin(trunkAngleRad)) + 
                           (loadForce * (1 + spineMomentArm * Math.sin(trunkAngleRad)));

        // Hip force calculation
        // F_hip = bodyWeight × cos(hipAngle) × 0.6
        const hipAngleRad = this.toRadians(hip);
        const hipForce = (bodyWeight * Math.cos(hipAngleRad) * 0.6) + 
                         (loadForce * hipMomentArm);

        // Ankle force (derived from ground reaction force)
        const ankleForce = bodyWeight * 0.3 + loadForce * 0.5;

        // Shoulder force (for carrying loads)
        const shoulderForce = loadForce * 0.8;

        return {
            knee: Math.round(Math.abs(kneeForce)),
            spine: Math.round(Math.abs(spineForce)),
            hip: Math.round(Math.abs(hipForce)),
            ankle: Math.round(Math.abs(ankleForce)),
            shoulder: Math.round(Math.abs(shoulderForce))
        };
    }

    /**
     * Calculate risk scores based on joint forces
     * @param {Object} jointForces - Forces on each joint
     * @returns {Object} Risk scores (0-100) for each joint
     */
    calculateRiskScores(jointForces) {
        const riskScores = {};
        let totalRisk = 0;
        let jointCount = 0;

        for (const [joint, force] of Object.entries(jointForces)) {
            const threshold = this.safeThresholds[joint];
            if (threshold) {
                // Calculate base risk as percentage of threshold
                let risk = (force / threshold) * 50;

                // Apply condition multipliers
                const multiplier = this.conditionMultipliers[joint] || 1;
                risk *= multiplier;

                // Apply age factor for additional risk
                if (this.age > 50) {
                    risk *= 1 + ((this.age - 50) * 0.01);
                }

                // Cap at 100
                riskScores[joint] = Math.min(100, Math.round(risk));
                totalRisk += riskScores[joint];
                jointCount++;
            }
        }

        // Calculate overall risk with condition multiplier
        const overallRisk = (totalRisk / jointCount) * (this.conditionMultipliers.overall || 1);
        riskScores.overall = Math.min(100, Math.round(overallRisk));

        return riskScores;
    }

    /**
     * Project long-term cumulative damage
     * @param {Object} riskScores - Current risk scores
     * @param {number} hoursPerDay - Hours of activity per day
     * @param {number} daysPerWeek - Days of activity per week
     * @returns {Object} Projected risk scores at various time intervals
     */
    projectLongTermDamage(riskScores, hoursPerDay = 8, daysPerWeek = 5) {
        // Activity exposure factor
        const weeklyExposure = hoursPerDay * daysPerWeek;
        const exposureFactor = weeklyExposure / 40; // Normalized to 40-hour week

        // Age-based healing factor (decreases with age)
        const healingFactor = this.age <= 30 ? 0.8 : 
                              this.age <= 50 ? 0.6 : 
                              this.age <= 65 ? 0.4 : 0.2;

        // Condition severity factor
        const conditionSeverity = this.healthConditions.length * 0.1;

        const projections = {
            '6months': {},
            '1year': {},
            '2years': {},
            '5years': {},
            '10years': {}
        };

        // Time multipliers for cumulative damage
        const timeFactors = {
            '6months': 1.1,
            '1year': 1.25,
            '2years': 1.5,
            '5years': 2.0,
            '10years': 3.0
        };

        for (const [joint, risk] of Object.entries(riskScores)) {
            for (const [period, timeFactor] of Object.entries(timeFactors)) {
                // Calculate cumulative risk
                let cumulativeRisk = risk * timeFactor * exposureFactor;
                
                // Reduce by healing factor
                cumulativeRisk *= (1 - healingFactor * 0.3);
                
                // Add condition severity
                cumulativeRisk *= (1 + conditionSeverity);
                
                // Age acceleration (damage accumulates faster with age)
                if (this.age > 40) {
                    const yearsFromNow = parseInt(period) || 0.5;
                    const futureAge = this.age + yearsFromNow;
                    cumulativeRisk *= 1 + ((futureAge - 40) * 0.01);
                }

                projections[period][joint] = Math.min(100, Math.round(cumulativeRisk));
            }
        }

        return projections;
    }

    /**
     * Generate personalized recommendations based on risk scores
     * @param {Object} riskScores - Current risk scores
     * @returns {Array<string>} Array of recommendation strings
     */
    getRecommendations(riskScores) {
        const recommendations = [];

        // Overall risk recommendations
        if (riskScores.overall >= 80) {
            recommendations.push("⚠️ CRITICAL: Your current activity poses significant risk. Consult a healthcare professional immediately.");
            recommendations.push("Consider complete rest or switching to a low-impact alternative activity.");
        } else if (riskScores.overall >= 60) {
            recommendations.push("⚠️ HIGH RISK: Reduce activity intensity and duration significantly.");
            recommendations.push("Schedule a consultation with a physiotherapist for personalized guidance.");
        } else if (riskScores.overall >= 40) {
            recommendations.push("⚡ MODERATE RISK: Take regular breaks and monitor for any discomfort.");
            recommendations.push("Consider ergonomic adjustments to reduce strain.");
        }

        // Knee-specific recommendations
        if (riskScores.knee >= 70) {
            recommendations.push("🦵 KNEE: Avoid deep squatting and prolonged kneeling. Use knee supports if necessary.");
            recommendations.push("Strengthen quadriceps and hamstrings to better support the knee joint.");
        } else if (riskScores.knee >= 50) {
            recommendations.push("🦵 KNEE: Maintain proper form during activities. Consider low-impact exercises like swimming.");
        }

        // Spine-specific recommendations
        if (riskScores.spine >= 70) {
            recommendations.push("🔙 SPINE: Avoid heavy lifting and prolonged forward bending.");
            recommendations.push("Practice core strengthening exercises to support your lower back.");
        } else if (riskScores.spine >= 50) {
            recommendations.push("🔙 SPINE: Maintain neutral spine position. Use lumbar support when sitting.");
        }

        // Hip-specific recommendations
        if (riskScores.hip >= 70) {
            recommendations.push("🦴 HIP: Limit activities requiring extreme hip flexion or rotation.");
            recommendations.push("Consider hip-strengthening exercises and stretching for hip flexors.");
        } else if (riskScores.hip >= 50) {
            recommendations.push("🦴 HIP: Include hip mobility exercises in your routine.");
        }

        // Age-specific recommendations
        if (this.age > 60) {
            recommendations.push("👴 AGE: Given your age, prioritize low-impact activities and ensure adequate recovery time.");
            recommendations.push("Consider calcium and vitamin D supplementation for bone health.");
        } else if (this.age > 45) {
            recommendations.push("👤 AGE: Focus on maintaining flexibility and joint mobility through regular stretching.");
        }

        // Health condition-specific recommendations
        if (this.healthConditions.includes('arthritis')) {
            recommendations.push("🏥 ARTHRITIS: Keep joints moving with gentle range-of-motion exercises. Apply heat before activity.");
        }
        if (this.healthConditions.includes('osteoporosis')) {
            recommendations.push("🏥 OSTEOPOROSIS: Focus on weight-bearing exercises and avoid high-impact activities.");
        }
        if (this.healthConditions.includes('herniated_disc')) {
            recommendations.push("🏥 DISC: Avoid twisting motions and heavy lifting. Practice McKenzie exercises.");
        }

        // General wellness recommendations
        if (recommendations.length < 3) {
            recommendations.push("✅ Your current risk levels are within acceptable range. Maintain good posture habits.");
            recommendations.push("Continue regular physical activity while listening to your body's signals.");
        }

        recommendations.push("💧 Stay hydrated and maintain a balanced diet rich in anti-inflammatory foods.");
        recommendations.push("😴 Ensure adequate sleep (7-9 hours) for optimal recovery and joint health.");

        return recommendations;
    }

    /**
     * Get risk level category
     * @param {number} score - Risk score (0-100)
     * @returns {string} Risk level category
     */
    getRiskLevel(score) {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'moderate';
        if (score >= 20) return 'low';
        return 'minimal';
    }

    /**
     * Get comprehensive analysis summary
     * @param {Object} postureAngles - Posture angles
     * @param {number} loadWeight - External load
     * @returns {Object} Complete analysis with forces, risks, projections, and recommendations
     */
    getFullAnalysis(postureAngles, loadWeight = 0) {
        const jointForces = this.calculateJointForces(postureAngles, loadWeight);
        const riskScores = this.calculateRiskScores(jointForces);
        const longTermProjection = this.projectLongTermDamage(riskScores);
        const recommendations = this.getRecommendations(riskScores);

        return {
            jointForces,
            riskScores,
            longTermProjection,
            recommendations,
            riskLevel: this.getRiskLevel(riskScores.overall),
            profileSummary: {
                age: this.age,
                weight: this.weight,
                height: this.height,
                bmi: Math.round(this.bmi * 10) / 10,
                bodyType: this.bodyType,
                healthConditions: this.healthConditions
            }
        };
    }
}

export default PhysicsEngine;
