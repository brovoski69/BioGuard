// ═══════════════════════════════════════════════════════════════
// BioGuard — Constants & Configuration
// ═══════════════════════════════════════════════════════════════

// ── Risk Level Definitions ───────────────────────────────────
export const RISK_LEVELS = {
    MINIMAL:  { label: 'MINIMAL',  min: 0,  max: 19, color: '#00ff88', glow: 'rgba(0,255,136,0.5)' },
    LOW:      { label: 'LOW',      min: 20, max: 39, color: '#7dff7a', glow: 'rgba(125,255,122,0.5)' },
    MODERATE: { label: 'MODERATE', min: 40, max: 59, color: '#ffd700', glow: 'rgba(255,215,0,0.5)' },
    HIGH:     { label: 'HIGH',     min: 60, max: 79, color: '#ff3b3b', glow: 'rgba(255,59,59,0.5)' },
    CRITICAL: { label: 'CRITICAL', min: 80, max: 100, color: '#ff0040', glow: 'rgba(255,0,64,0.6)' }
};

// ── Joint Definitions ────────────────────────────────────────
export const JOINTS = ['knee', 'spine', 'hip', 'ankle', 'shoulder'];

export const JOINT_LABELS = {
    knee: 'Knee',
    spine: 'Spine',
    hip: 'Hip',
    ankle: 'Ankle',
    shoulder: 'Shoulder'
};

// Safe force limits in Newtons (approximate)
export const JOINT_SAFE_LIMITS = {
    knee: 3000,
    spine: 3400,
    hip: 2800,
    ankle: 2500,
    shoulder: 1200
};

// ── Scenario Data ────────────────────────────────────────────
export const SCENARIOS = {
    sitting_desk: {
        name: 'Sitting at Desk',
        icon: '🪑',
        category: 'work',
        description: 'Standard office desk posture with prolonged sitting.',
        defaultAngles: { trunk: 10, knee: 90, hip: 90 }
    },
    running: {
        name: 'Running',
        icon: '🏃',
        category: 'exercise',
        description: 'Jogging or running at moderate pace.',
        defaultAngles: { trunk: 15, knee: 45, hip: 65 }
    },
    heavy_lifting: {
        name: 'Heavy Lifting',
        icon: '🏋️',
        category: 'work',
        description: 'Lifting heavy objects from ground level.',
        defaultAngles: { trunk: 45, knee: 120, hip: 110 }
    },
    high_heels: {
        name: 'Walking in High Heels',
        icon: '👠',
        category: 'lifestyle',
        description: 'Walking with elevated heel footwear.',
        defaultAngles: { trunk: 5, knee: 10, hip: 15 }
    },
    standing_long: {
        name: 'Prolonged Standing',
        icon: '🧍',
        category: 'work',
        description: 'Standing in one position for extended periods.',
        defaultAngles: { trunk: 5, knee: 5, hip: 5 }
    },
    squatting: {
        name: 'Squatting',
        icon: '🏋️‍♂️',
        category: 'exercise',
        description: 'Deep squat exercise movement.',
        defaultAngles: { trunk: 30, knee: 140, hip: 130 }
    },
    cycling: {
        name: 'Cycling',
        icon: '🚴',
        category: 'exercise',
        description: 'Riding a bicycle at moderate intensity.',
        defaultAngles: { trunk: 35, knee: 75, hip: 80 }
    },
    climbing_stairs: {
        name: 'Climbing Stairs',
        icon: '🪜',
        category: 'daily',
        description: 'Walking up stairs at normal pace.',
        defaultAngles: { trunk: 10, knee: 70, hip: 65 }
    },
    gardening: {
        name: 'Gardening',
        icon: '🌱',
        category: 'leisure',
        description: 'Bending and kneeling for garden work.',
        defaultAngles: { trunk: 50, knee: 100, hip: 95 }
    },
    driving: {
        name: 'Driving',
        icon: '🚗',
        category: 'daily',
        description: 'Seated driving position in a vehicle.',
        defaultAngles: { trunk: 15, knee: 85, hip: 85 }
    },
    sleeping_side: {
        name: 'Side Sleeping',
        icon: '😴',
        category: 'rest',
        description: 'Lying on side during sleep.',
        defaultAngles: { trunk: 0, knee: 30, hip: 30 }
    },
    yoga_downdog: {
        name: 'Yoga - Downward Dog',
        icon: '🧘',
        category: 'exercise',
        description: 'Inverted V yoga pose stretching.',
        defaultAngles: { trunk: 90, knee: 10, hip: 90 }
    }
};

export const SCENARIO_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'work', label: 'Work' },
    { id: 'exercise', label: 'Exercise' },
    { id: 'daily', label: 'Daily' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'leisure', label: 'Leisure' },
    { id: 'rest', label: 'Rest' }
];

// ── Health Conditions ────────────────────────────────────────
export const HEALTH_CONDITIONS = [
    { id: 'arthritis', name: 'Arthritis', affected: ['knee', 'hip', 'spine'] },
    { id: 'osteoporosis', name: 'Osteoporosis', affected: ['spine', 'hip'] },
    { id: 'herniated_disc', name: 'Herniated Disc', affected: ['spine'] },
    { id: 'knee_injury', name: 'Previous Knee Injury', affected: ['knee'] },
    { id: 'hip_replacement', name: 'Hip Replacement', affected: ['hip'] },
    { id: 'obesity', name: 'Obesity', affected: ['knee', 'hip', 'ankle'] },
    { id: 'scoliosis', name: 'Scoliosis', affected: ['spine'] },
    { id: 'sciatica', name: 'Sciatica', affected: ['spine', 'hip'] },
    { id: 'carpal_tunnel', name: 'Carpal Tunnel', affected: ['shoulder'] },
    { id: 'tendonitis', name: 'Tendonitis', affected: ['shoulder', 'knee'] },
    { id: 'bursitis', name: 'Bursitis', affected: ['shoulder', 'hip', 'knee'] },
    { id: 'fibromyalgia', name: 'Fibromyalgia', affected: ['spine', 'hip', 'knee', 'shoulder'] }
];
// Note: 'none' should be handled as empty array, not as a condition

// ── Body Types ───────────────────────────────────────────────
export const BODY_TYPES = [
    { id: 'ectomorph',  label: 'Ectomorph',  description: 'Lean & long build' },
    { id: 'mesomorph',  label: 'Mesomorph',  description: 'Athletic & muscular' },
    { id: 'endomorph',  label: 'Endomorph',  description: 'Broad & sturdy' }
];

// ── Duration Presets (minutes) ───────────────────────────────
export const DURATION_PRESETS = [
    { value: 15,  label: '15min' },
    { value: 30,  label: '30min' },
    { value: 60,  label: '1hr' },
    { value: 240, label: '4hr' },
    { value: 480, label: '8hr' }
];

// ── Health Condition Modifiers (affects risk calculation) ────
export const CONDITION_MODIFIERS = {
    arthritis:       { knee: 1.4, hip: 1.3, shoulder: 1.2, spine: 1.1, ankle: 1.1 },
    osteoporosis:    { spine: 1.5, hip: 1.4, knee: 1.2, ankle: 1.2, shoulder: 1.1 },
    herniated_disc:  { spine: 1.6, hip: 1.3, knee: 1.0, ankle: 1.0, shoulder: 1.0 },
    knee_injury:     { knee: 1.7, hip: 1.2, ankle: 1.3, spine: 1.0, shoulder: 1.0 },
    hip_replacement: { hip: 1.6, knee: 1.3, spine: 1.2, ankle: 1.1, shoulder: 1.0 },
    obesity:         { knee: 1.5, hip: 1.4, ankle: 1.5, spine: 1.3, shoulder: 1.1 },
    scoliosis:       { spine: 1.7, hip: 1.3, shoulder: 1.3, knee: 1.1, ankle: 1.0 },
    sciatica:        { spine: 1.5, hip: 1.4, knee: 1.2, ankle: 1.1, shoulder: 1.0 },
    carpal_tunnel:   { shoulder: 1.4, spine: 1.1, knee: 1.0, hip: 1.0, ankle: 1.0 },
    tendonitis:      { shoulder: 1.4, knee: 1.3, ankle: 1.3, hip: 1.1, spine: 1.0 },
    bursitis:        { shoulder: 1.5, hip: 1.4, knee: 1.3, ankle: 1.1, spine: 1.0 },
    fibromyalgia:    { knee: 1.3, spine: 1.3, hip: 1.3, ankle: 1.2, shoulder: 1.3 },
    none:            { knee: 1.0, spine: 1.0, hip: 1.0, ankle: 1.0, shoulder: 1.0 }
};
