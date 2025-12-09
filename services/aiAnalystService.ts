
interface AnalysisResult {
    summary: string;
    score: number;
    insights: {
        type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        text: string;
        metric?: string;
        entityId?: string;
        entityName?: string;
        details?: {
            label: string;
            value: string;
        }[];
    }[];
    suggestedPrompts: string[];
}

export const analyzePerformance = (data: any[], level: string): AnalysisResult => {
    // 1. Setup & Baselines
    let summary = '';
    let score = 85;
    const insights: AnalysisResult['insights'] = [];
    const suggestedPrompts: string[] = [];

    const activeItems = data.filter(d => d.status === 'ACTIVE');
    const pausedItems = data.filter(d => d.status === 'PAUSED');
    const itemsToAnalyze = activeItems.length > 0 ? activeItems : data;

    // Calculate Global Baselines (Weighted Avg)
    let totalSpend = 0;
    let totalResults = 0;
    let totalRevenue = 0;

    itemsToAnalyze.forEach(item => {
        const i = item.insights || {};
        totalSpend += parseFloat(i.spend || '0');
        totalResults += parseInt(i.actions?.[0]?.value || '0'); // Simplification: assumes first action is result

        // Revenue Check
        const actionValues = i.action_values || [];
        const revObj = actionValues.find((v: any) => v.action_type.includes('purchase'));
        if (revObj) totalRevenue += parseFloat(revObj.value);
    });

    const accountCPA = totalResults > 0 ? totalSpend / totalResults : 0;
    const accountROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // 2. High-Level Health Check
    if (activeItems.length === 0 && data.length > 0) {
        summary = "All campaigns are paused. Review historical top performers to restart.";
        score = 50;
        insights.push({
            type: 'NEUTRAL',
            text: "No active campaigns.",
            metric: "Status",
            details: [{ label: "Action", value: "Review paused items" }]
        });
        suggestedPrompts.push("What was my best performing campaign historically?");
        return { summary, score, insights, suggestedPrompts };
    }

    if (totalSpend === 0) {
        summary = "Account is active but pending delivery. Check bid caps and audience sizes.";
        score = 60;
        return { summary, score, insights, suggestedPrompts: ["Help me troubleshoot zero delivery"] };
    }

    // 3. Heuristic: SCALE OPPORTUNITY (High ROAS + Low Spend share)
    const scaleCandidates = activeItems.filter(item => {
        const i = item.insights || {};
        const spend = parseFloat(i.spend || '0');

        let revenue = 0;
        const actionValues = i.action_values || [];
        const revObj = actionValues.find((v: any) => v.action_type.includes('purchase'));
        if (revObj) revenue = parseFloat(revObj.value);
        const roas = spend > 0 ? revenue / spend : 0;

        // Condition: ROAS > 2.0 or > 20% better than avg
        return roas > 2.0 || (accountROAS > 0 && roas > accountROAS * 1.2);
    });

    if (scaleCandidates.length > 0) {
        score += 10;
        const winner = scaleCandidates[0];
        const i = winner.insights || {};
        insights.push({
            type: 'POSITIVE',
            text: `${winner.name} is a scale candidate.`,
            metric: 'Scale Opportunity',
            entityId: winner.id,
            entityName: winner.name,
            details: [
                { label: 'Spend', value: `$${parseFloat(i.spend).toFixed(2)}` },
                { label: 'ROAS', value: `${((parseFloat(i.spend) > 0) ? (parseFloat(i.action_values?.[0]?.value || '0') / parseFloat(i.spend)) : 0).toFixed(2)}x` }
            ]
        });
        suggestedPrompts.push(`Create a scaling strategy for ${winner.name}`);
        if (!summary.includes("underperforming")) {
            summary = "Performance is strong. You have clear scaling opportunities.";
        }
    }

    // 4. Heuristic: THE KILL ZONE (High CPA or Low ROAS) -> EXCLUDE SCALE CANDIDATES
    const bleedingItems = activeItems.filter(item => {
        // EXCLUSION: If it is a scale candidate, it cannot be bleeding.
        if (scaleCandidates.find(c => c.id === item.id)) return false;

        const i = item.insights || {};
        const spend = parseFloat(i.spend || '0');
        if (spend < 50) return false; // Ignore low spenders

        const results = parseInt(i.actions?.[0]?.value || '0');
        const cpa = results > 0 ? spend / results : spend;

        let revenue = 0;
        const actionValues = i.action_values || [];
        const revObj = actionValues.find((v: any) => v.action_type.includes('purchase'));
        if (revObj) revenue = parseFloat(revObj.value);
        const roas = spend > 0 ? revenue / spend : 0;

        // Condition: CPA > 50% Avg OR ROAS < 0.8
        // Safe check: If ROAS is decent (> 1.2), don't kill even if CPA is high (could be high ticket)
        if (roas > 1.2) return false;

        const isHighCPA = accountCPA > 0 && cpa > (accountCPA * 1.5);
        const isLowROAS = accountROAS > 0 && roas < 0.8;

        return isHighCPA || isLowROAS;
    });

    if (bleedingItems.length > 0) {
        score -= 15;
        const badItem = bleedingItems[0]; // Top offender
        const i = badItem.insights || {};
        insights.push({
            type: 'NEGATIVE',
            text: `${badItem.name} is bleeding budget.`,
            metric: 'Kill Zone',
            entityId: badItem.id,
            entityName: badItem.name,
            details: [
                { label: 'Spend', value: `$${parseFloat(i.spend).toFixed(2)}` },
                { label: 'ROAS', value: i.roas ? `${parseFloat(i.roas).toFixed(2)}x` : 'N/A' },
                { label: 'CPA', value: i.cpa ? `$${parseFloat(i.cpa).toFixed(2)}` : 'High' }
            ]
        });
        // Only suggest this prompt if we haven't already suggested something for the same item (unlikely due to exclusion, but safe)
        if (!suggestedPrompts.some(p => p.includes(badItem.name))) {
            suggestedPrompts.push(`Analyze why ${badItem.name} is failing`);
        }
        summary = `${bleedingItems.length} active items are underperforming. Immediate attention required.`;
    }

    // 5. Heuristic: PREMATURE PAUSE (Historical)
    // Check if we paused something good recently (simplified: check paused items with high metrics)
    const prematurePauses = pausedItems.filter(item => {
        const i = item.insights || {};
        const spend = parseFloat(i.spend || '0');
        if (spend < 50) return false;

        // Simulating "Paused recently" check if we had date data easily accessibly per item history
        // For now, just check if metrics were excellent
        const results = parseInt(i.actions?.[0]?.value || '0');
        const cpa = results > 0 ? spend / results : spend;
        return accountCPA > 0 && cpa < (accountCPA * 0.8);
    });

    if (prematurePauses.length > 0) {
        insights.push({
            type: 'NEUTRAL',
            text: `${prematurePauses[0].name} was paused despite efficient CPA.`,
            metric: 'Premature Pause?',
            entityId: prematurePauses[0].id,
            entityName: prematurePauses[0].name,
            details: [
                { label: 'Last CPA', value: `$${(parseFloat(prematurePauses[0].insights?.spend) / parseInt(prematurePauses[0].insights?.actions?.[0]?.value || '1')).toFixed(2)}` }
            ]
        });
        suggestedPrompts.push(`Should I reactivate ${prematurePauses[0].name}?`);
    }

    // 6. Default / Fallback
    if (insights.length === 0) {
        summary = "Performance is stable. Keep monitoring for breakout trends.";
        score = 80;
        insights.push({ type: 'POSITIVE', text: "Stable Delivery", metric: "Healthy", details: [{ label: "Avg CPA", value: `$${accountCPA.toFixed(2)}` }] });
        suggestedPrompts.push("Forecast next week's performance");
    }

    return {
        summary,
        score: Math.min(100, Math.max(0, score)),
        insights: insights.slice(0, 4), // Cap at 4 chips
        suggestedPrompts: suggestedPrompts.slice(0, 3)
    };
};
