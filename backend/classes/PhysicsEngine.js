// The core biomechanics engine - calculates forces on joints based on posture and load
// All the physics math happens here

class PhysicsEngine {
    
    // Set up the engine with user's physical characteristics
    constructor(profileData) {
        this.age = profileData.age || 30;
        this.weight = profileData.weight || 70;
        this.height = profileData.height || 170;
        this.bodyType = profileData.body_type || 'mesomorph';
        this.healthConditions = profileData.health_conditions || [];

        this.bodyMass = this.weight;
        this.bmi = this.weight / Math.pow(this.height / 100, 2);
        
        // Figure out what force levels are safe for this person
        this.safeThresholds = this.calculateSafeThresholds();
        this.conditionMultipliers = this.calculateConditionMultipliers();
    }

    // Determine safe force limits - younger/healthier people can handle more
    calculateSafeThresholds() {
        // Starting point: what a healthy 25-year-old can handle (Newtons)
        const baseThresholds = {
            knee: 450, spine: 900, hip: 400, ankle: 350, shoulder: 300
        };

        // Joints get weaker as we age (about 0.8% per year after 25)
        const ageFactor = this.age <= 25 ? 1 : 1 - ((this.age - 25) * 0.008);
        
        // Higher BMI = joints under more constant stress = lower safe threshold
        const bmiFactor = this.bmi <= 25 ? 1 : 1 - ((this.bmi - 25) * 0.02);

        // Body frame affects what you can handle
        const bodyTypeFactors = {
            ectomorph: 0.9,   // Lighter frame
            mesomorph: 1.0,   // Athletic build
            endomorph: 0.95   // Heavier build
        };
        const bodyTypeFactor = bodyTypeFactors[this.bodyType] || 1;

        // Combine all factors
        const thresholds = {};
        for (const [joint, base] of Object.entries(baseThresholds)) {
            thresholds[joint] = base * ageFactor * bmiFactor * bodyTypeFactor;
        }

        return thresholds;
    }

    // Health conditions make certain joints more vulnerable
    calculateConditionMultipliers() {
        const multipliers = { overall: 1, knee: 1, spine: 1, hip: 1 };

        // How much each condition increases risk (e.g., arthritis = 1.5x knee risk)
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

        // Stack up multipliers for all conditions the user has
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

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // THE MAIN CALCULATION - convert posture angles to actual forces on joints
    calculateJointForces(postureAngles, loadWeight = 0) {
        const { trunk = 0, knee = 0, hip = 0 } = postureAngles;
        const g = 9.81;
        const bodyWeight = this.bodyMass * g;
        const loadForce = loadWeight * g;

        // Moment arms scale with height (lever effect)
        const kneeMomentArm = this.height * 0.002;
        const spineMomentArm = this.height * 0.003;
        const hipMomentArm = this.height * 0.0015;

        // Knee: affected by knee bend angle and any load carried
        const kneeAngleRad = this.toRadians(knee);
        const kneeForce = (bodyWeight * 0.5 * Math.sin(kneeAngleRad)) + 
                          (loadForce * kneeMomentArm * Math.cos(kneeAngleRad));

        // Spine: trunk lean + any load adds compression
        const trunkAngleRad = this.toRadians(trunk);
        const spineForce = (bodyWeight * 0.6 * Math.sin(trunkAngleRad)) + 
                           (loadForce * (1 + spineMomentArm * Math.sin(trunkAngleRad)));

        // Hip: supports body weight plus distributes load
        const hipAngleRad = this.toRadians(hip);
        const hipForce = (bodyWeight * Math.cos(hipAngleRad) * 0.6) + 
                         (loadForce * hipMomentArm);

        // Ankle and shoulder are simpler calculations
        const ankleForce = bodyWeight * 0.3 + loadForce * 0.5;
        const shoulderForce = loadForce * 0.8;

        return {
            knee: Math.round(Math.abs(kneeForce)),
            spine: Math.round(Math.abs(spineForce)),
            hip: Math.round(Math.abs(hipForce)),
            ankle: Math.round(Math.abs(ankleForce)),
            shoulder: Math.round(Math.abs(shoulderForce))
        };
    }

    // Convert raw forces to risk scores (0-100 scale)
    calculateRiskScores(jointForces) {
        const riskScores = {};
        let totalRisk = 0;
        let jointCount = 0;

        for (const [joint, force] of Object.entries(jointForces)) {
            const threshold = this.safeThresholds[joint];
            if (threshold) {
                // Base risk is how close we are to the threshold
                let risk = (force / threshold) * 50;

                // Bump up risk if they have relevant health conditions
                const multiplier = this.conditionMultipliers[joint] || 1;
                risk *= multiplier;

                // Extra risk for older folks
                if (this.age > 50) {
                    risk *= 1 + ((this.age - 50) * 0.01);
                }

                riskScores[joint] = Math.min(100, Math.round(risk));
                totalRisk += riskScores[joint];
                jointCount++;
            }
        }

        // Overall score considers all joints plus general health
        const overallRisk = (totalRisk / jointCount) * (this.conditionMultipliers.overall || 1);
        riskScores.overall = Math.min(100, Math.round(overallRisk));

        return riskScores;
    }

    // Predict how risk accumulates over months/years of this activity
    projectLongTermDamage(riskScores, hoursPerDay = 8, daysPerWeek = 5) {
        const weeklyExposure = hoursPerDay * daysPerWeek;
        const exposureFactor = weeklyExposure / 40;

        // Younger bodies heal better
        const healingFactor = this.age <= 30 ? 0.8 : 
                              this.age <= 50 ? 0.6 : 
                              this.age <= 65 ? 0.4 : 0.2;

        const conditionSeverity = this.healthConditions.length * 0.1;

        const projections = {
            '6months': {}, '1year': {}, '2years': {}, '5years': {}, '10years': {}
        };

        // Damage compounds over time
        const timeFactors = {
            '6months': 1.1, '1year': 1.25, '2years': 1.5, '5years': 2.0, '10years': 3.0
        };

        for (const [joint, risk] of Object.entries(riskScores)) {
            for (const [period, timeFactor] of Object.entries(timeFactors)) {
                let cumulativeRisk = risk * timeFactor * exposureFactor;
                cumulativeRisk *= (1 - healingFactor * 0.3);
                cumulativeRisk *= (1 + conditionSeverity);
                
                // Damage accelerates as we age
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

    // Generate advice based on risk levels and user's specific situation
    getRecommendations(riskScores) {
        const recommendations = [];

        // Overall risk level advice
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

        // Joint-specific advice
        if (riskScores.knee >= 70) {
            recommendations.push("🦵 KNEE: Avoid deep squatting and prolonged kneeling. Use knee supports if necessary.");
            recommendations.push("Strengthen quadriceps and hamstrings to better support the knee joint.");
        } else if (riskScores.knee >= 50) {
            recommendations.push("🦵 KNEE: Maintain proper form during activities. Consider low-impact exercises like swimming.");
        }

        if (riskScores.spine >= 70) {
            recommendations.push("🔙 SPINE: Avoid heavy lifting and prolonged forward bending.");
            recommendations.push("Practice core strengthening exercises to support your lower back.");
        } else if (riskScores.spine >= 50) {
            recommendations.push("🔙 SPINE: Maintain neutral spine position. Use lumbar support when sitting.");
        }

        if (riskScores.hip >= 70) {
            recommendations.push("🦴 HIP: Limit activities requiring extreme hip flexion or rotation.");
            recommendations.push("Consider hip-strengthening exercises and stretching for hip flexors.");
        } else if (riskScores.hip >= 50) {
            recommendations.push("🦴 HIP: Include hip mobility exercises in your routine.");
        }

        // Age-specific tips
        if (this.age > 60) {
            recommendations.push("👴 AGE: Given your age, prioritize low-impact activities and ensure adequate recovery time.");
            recommendations.push("Consider calcium and vitamin D supplementation for bone health.");
        } else if (this.age > 45) {
            recommendations.push("👤 AGE: Focus on maintaining flexibility and joint mobility through regular stretching.");
        }

        // Condition-specific advice
        if (this.healthConditions.includes('arthritis')) {
            recommendations.push("🏥 ARTHRITIS: Keep joints moving with gentle range-of-motion exercises. Apply heat before activity.");
        }
        if (this.healthConditions.includes('osteoporosis')) {
            recommendations.push("🏥 OSTEOPOROSIS: Focus on weight-bearing exercises and avoid high-impact activities.");
        }
        if (this.healthConditions.includes('herniated_disc')) {
            recommendations.push("🏥 DISC: Avoid twisting motions and heavy lifting. Practice McKenzie exercises.");
        }

        // If risk is low, still give some general advice
        if (recommendations.length < 3) {
            recommendations.push("✅ Your current risk levels are within acceptable range. Maintain good posture habits.");
            recommendations.push("Continue regular physical activity while listening to your body's signals.");
        }

        recommendations.push("💧 Stay hydrated and maintain a balanced diet rich in anti-inflammatory foods.");
        recommendations.push("😴 Ensure adequate sleep (7-9 hours) for optimal recovery and joint health.");

        return recommendations;
    }

    // Quick risk level label
    getRiskLevel(score) {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'moderate';
        if (score >= 20) return 'low';
        return 'minimal';
    }

    // Run all calculations at once and return everything
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
