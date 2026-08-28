export const calculateTopCompetencies = (usuarios) => {
    const counts = {};
    usuarios.forEach(u => {
        (u.competenciasTecnicas || []).forEach(c => {
            counts[c] = (counts[c] || 0) + 1;
        });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5); // Return top 5
};

export const calculateTopSectors = (usuarios) => {
    const counts = {};
    usuarios.forEach(u => {
        (u.sectoresExperiencia || []).forEach(s => {
            counts[s] = (counts[s] || 0) + 1;
        });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5);
};

export const calculateDistribution = (usuarios, key) => {
    const counts = {};
    let total = 0;
    usuarios.forEach(u => {
        const val = u[key];
        if (val) {
            counts[val] = (counts[val] || 0) + 1;
            total++;
        }
    });
    return { counts, total };
};

export const generateStrategicInsights = (usuarios, totalDatabaseCount) => {
    if (!usuarios || usuarios.length === 0) return ["No hay suficientes datos para generar insights en este momento."];

    const insights = [];

    // 1. Program concentration
    const { counts: progCounts } = calculateDistribution(usuarios, 'programaAcademico');
    const sortedProgs = Object.entries(progCounts).sort((a, b) => b[1] - a[1]);
    
    if (sortedProgs.length > 0) {
        const topProg = sortedProgs[0];
        const percentage = Math.round((topProg[1] / usuarios.length) * 100);
        if (percentage > 30) {
            insights.push(`El programa de **${topProg[0]}** concentra una alta participación, representando el **${percentage}%** de los perfiles listados.`);
        }
    }

    // 2. Multidisciplinary profiles (proxied by having >= 4 competencies)
    const multidisciplinaryCount = usuarios.filter(u => (u.competenciasTecnicas?.length || 0) >= 4).length;
    if (multidisciplinaryCount > 0) {
        const multiPerc = Math.round((multidisciplinaryCount / usuarios.length) * 100);
        if (multiPerc > 10) {
            insights.push(`El **${multiPerc}%** de los perfiles seleccionados tienen habilidades multidisciplinares (más de 4 competencias técnicas).`);
        }
    }

    // 3. Top competency
    const topComps = calculateTopCompetencies(usuarios);
    if (topComps.length > 0) {
        insights.push(`**${topComps[0][0]}** es la competencia con mayor disponibilidad dentro del segmento actual (${topComps[0][1]} perfiles).`);
    }

    // 4. Scarcity/Opportunity
    if (usuarios.length < (totalDatabaseCount * 0.1) && totalDatabaseCount > 10) {
        insights.push(`Atención: Este segmento representa menos del 10% de la red total, lo que podría indicar un **área de oportunidad** para nuevas convocatorias.`);
    }

    return insights;
};
