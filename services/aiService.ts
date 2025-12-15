
import { GoogleGenAI } from "@google/genai";
import { Campaign, AIAnalysisResult, AdPerformance, AdSet, Ad } from "../types";

// Helper to calculate blended metrics for context
const calculateBlendedMetrics = (campaigns: Campaign[]) => {
  let totalSpend = 0;
  let totalPurchases = 0;
  let totalRevenue = 0;
  let totalClicks = 0;
  let totalImpressions = 0;

  campaigns.forEach(c => {
    const insights = c.insights;
    if (!insights) return;

    const spend = parseFloat(insights.spend || '0');
    const clicks = parseInt(insights.clicks || '0');
    const imps = parseInt(insights.impressions || '0');

    // Find Purchase Value & Count
    const actionValues = insights.action_values || [];
    let revObj = actionValues.find((v: any) => v.action_type === 'omni_purchase' || v.action_type === 'purchase' || v.action_type === 'offsite_conversion.fb_pixel_purchase');
    if (!revObj) revObj = actionValues.find((v: any) => v.action_type.toLowerCase().includes('purchase') && !v.action_type.includes('cost'));
    const revenue = revObj ? parseFloat(revObj.value) : 0;

    const actions = insights.actions || [];
    let purchObj = actions.find((a: any) => a.action_type === 'omni_purchase' || a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
    if (!purchObj) purchObj = actions.find((a: any) => a.action_type.toLowerCase().includes('purchase'));
    const purchases = purchObj ? parseInt(purchObj.value) : 0;

    totalSpend += spend;
    totalRevenue += revenue;
    totalPurchases += purchases;
    totalClicks += clicks;
    totalImpressions += imps;
  });

  return {
    spend: totalSpend,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    cpa: totalPurchases > 0 ? totalSpend / totalPurchases : 0,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  };
};

export const analyzeCampaignPerformance = async (campaigns: Campaign[]): Promise<AIAnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 1. Calculate Baselines
    const accountStats = calculateBlendedMetrics(campaigns);

    // 2. Prepare Data Snapshot (Top 20 by spend to manage token limits)
    // We sort by spend to ensure we analyze where the money is going.
    const sortedCampaigns = [...campaigns].sort((a, b) => parseFloat(b.insights?.spend || '0') - parseFloat(a.insights?.spend || '0')).slice(0, 20);

    const campaignDataStr = sortedCampaigns.map(c => {
      const i = c.insights;
      if (!i) return null;

      const spend = parseFloat(i.spend || '0');
      if (spend < 10) return null; // Skip insignificant data

      // Calculate ROAS
      const actionValues = i.action_values || [];
      let revObj = actionValues.find((v: any) => v.action_type === 'omni_purchase' || v.action_type === 'purchase');
      if (!revObj) revObj = actionValues.find((v: any) => v.action_type.toLowerCase().includes('purchase'));
      const revenue = revObj ? parseFloat(revObj.value) : 0;
      const roas = spend > 0 ? revenue / spend : 0;

      // Calculate CPA
      const actions = i.actions || [];
      let purchObj = actions.find((a: any) => a.action_type === 'omni_purchase' || a.action_type === 'purchase');
      if (!purchObj) purchObj = actions.find((a: any) => a.action_type.toLowerCase().includes('purchase'));
      const purchases = purchObj ? parseInt(purchObj.value) : 0;
      const cpa = purchases > 0 ? spend / purchases : 0;

      return `
       - Name: "${c.name}"
         Status: ${c.status}
         Spend: $${spend.toFixed(0)}
         ROAS: ${roas.toFixed(2)}x
         CPA: $${cpa.toFixed(2)}
         CTR: ${i.ctr}%
         CPM: $${i.cpm}
         Freq: ${i.frequency}
       `;
    }).filter(Boolean).join('\n');

    const prompt = `
      You are a Senior Media Buyer & Strategist for Meta Ads (Expert Level).
      
      ACCOUNT BASELINES (Last 30 Days):
      - Blended ROAS: ${accountStats.roas.toFixed(2)}x
      - Blended CPA: $${accountStats.cpa.toFixed(2)}
      - Blended CTR: ${accountStats.ctr.toFixed(2)}%
      
      CAMPAIGN DATA (Top Spenders):
      ${campaignDataStr}
      
      YOUR MISSION:
      Analyze this data like a ruthless performance marketer. Ignore vanity metrics. Focus on Profit, ROAS, and Scale.
      **CRITICAL:** Pay attention to the 'Status'. Do NOT suggest pausing a campaign that is already PAUSED.
      
      OUTPUT FORMAT (Strict Markdown):
      
      ## 🦅 Executive Summary
      (1-2 sentences on overall account health. Are we profitable? Are we overspending?)

      ## 🚀 Scale Candidates (ACTIVE Only)
      (Identify ACTIVE campaigns with ROAS > ${accountStats.roas.toFixed(2)}x. Recommend budget increases. If no active winners, say so.)

      ## 🩸 The Kill Zone (ACTIVE Only)
      (Identify ACTIVE campaigns bleeding money (ROAS < 1.0 or High CPA). Recommend pausing. Be direct.)

      ## 🔍 Historical Learnings (PAUSED Items)
      (Briefly mention if any PAUSED campaigns were actually good (potential premature pause) or confirm why big spenders were paused.)

      ## 🧠 Tactical Optimization
      (Bullet points on specific actions: Bid Cap suggestions, Creative Fatigue warnings if Freq > 3, or funnel issues if CTR is high but ROAS is low.)

      Tone: Professional, Direct, Data-Driven. No fluff. Use emojis for readability.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "Could not generate analysis.";

    return {
      analysis: text,
      recommendations: [],
      sentiment: 'neutral'
    };

  } catch (error) {
    console.error("AI Analysis Failed", error);
    return {
      analysis: "Unable to connect to AI service currently. Please check your network or try again later.",
      recommendations: [],
      sentiment: 'neutral'
    };
  }
};

export const analyzeCreative = async (ad: AdPerformance): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const isPaused = ad.status === 'PAUSED' || ad.status === 'ARCHIVED';
    const statusContext = isPaused
      ? "STATUS: PAUSED (Do not suggest pausing. Analyze why it failed or if it should be revived)."
      : "STATUS: ACTIVE (Recommend Stop, Scale, or Optimize).";

    const prompt = `
      As a Senior Media Buyer & Creative Strategist, perform a "Deep Dive" audit on this ad asset.
      
      DATA:
      - Name: ${ad.ad_name}
      - ${statusContext}
      - Spend: $${ad.spend}
      - ROAS: ${ad.roas?.toFixed(2)}
      - CPA: $${ad.cpa?.toFixed(2)}
      - CTR: ${ad.ctr}%
      - Thumb Stopping Rate (3s Play / Impr): ${ad.video_plays ? ((parseInt(ad.video_plays) / parseInt(ad.impressions)) * 100).toFixed(2) : 'N/A'}%
      - Conversion Rate: ${ad.clicks && parseInt(ad.clicks) > 0 && ad.results ? ((parseFloat(ad.results) / parseInt(ad.clicks)) * 100).toFixed(2) : '0'}%
      
      ANALYSIS REQUIRED (Data-Driven from all angles):
      
      # 🧪 Hook & Hold Analysis
      (Analyze CTR & Thumb Stop Rate. Is the creative capturing attention? If CTR < 1%, provide specific visual/hook recommendations.)
      
      # 💰 Financial Logic
      (Analyze ROAS & CPA relative to spend. Is this profitable? Does the CPA justify the volume?)
      
      # 🎯 Conversion Harmony
      (Compare CTR vs. Conversion Rate. High CTR + Low Conv Rate = Offer/Landing Page Mismatch. Low CTR + High Conv Rate = Boring Creative but Good Product. Diagnose this.)
      
      # ⚡ ACTIONABLE VERDICT
      **[SELECT ONE: SCALE / PAUSE / ITERATE / REVIVE]**
      (Provide a clear, direct instruction on what to do with this ad right now.)
      
      Tone: Professional, Insightful, and Ruthless. Use markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (e) {
    return "Error analyzing creative.";
  }
}

export const generateAdCopy = async (productDescription: string, objective: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Generate "Direct Response" style Facebook Ad Copy.
      Product: ${productDescription}
      Objective: ${objective}
      
      Frameworks to use:
      1. PAS (Problem-Agitation-Solution)
      2. AIDA (Attention-Interest-Desire-Action)
      3. Storytelling (Testimonial style)
      
      Output 3 distinct variants.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Copy Gen Failed", error);
    return "Error generating copy.";
  }
};

export const generatePerformanceAudit = async (
  accountInsights: any,
  campaigns: Campaign[],
  adSets: AdSet[],
  ads: Ad[],
  breakdowns?: {
    placements?: any[],
    demographics?: any[],
    regions?: any[]
  },
  profile: string = 'sales', // Default to sales if not provided
  dateRange: string = 'Last 30 Days' // Default date range
): Promise<AIAnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- 1. DEFINE PROFILE GOALS & SUCCESS METRICS ---

    let objectiveTitle = "MAXIMIZE REVENUE (ROAS)";
    let primaryMetricLabel = "ROAS";
    let costMetricLabel = "CPA (Cost Per Purchase)";
    let primaryMetricKey = "roas"; // Key to look up in processed data
    let thresholdLabel = "ROAS";

    // Dynamic Metric Extraction Helper
    const getProfileMetrics = (insights: any) => {
      const spend = parseFloat(insights.spend || '0');

      if (profile === 'leads') {
        const leads = parseInt(insights.actions?.find((a: any) => a.action_type === 'lead')?.value || '0');
        return {
          mainValue: leads,
          mainLabel: 'Leads',
          costValue: leads > 0 ? spend / leads : 0,
          costLabel: 'CPL',
          isEfficiencyBadIfHigh: true // High CPL is bad, unlike High ROAS which is good
        };
      } else if (profile === 'engagement') {
        const eng = parseInt(insights.actions?.find((a: any) => a.action_type === 'post_engagement')?.value || '0');
        return {
          mainValue: eng,
          mainLabel: 'Engagements',
          costValue: eng > 0 ? spend / eng : 0,
          costLabel: 'CPE',
          isEfficiencyBadIfHigh: true
        };
      } else if (profile === 'messenger') {
        const msg = parseInt(insights.actions?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'messaging_conversation_started_7d')?.value || '0');
        return {
          mainValue: msg,
          mainLabel: 'Msgs',
          costValue: msg > 0 ? spend / msg : 0,
          costLabel: 'Cost/Msg',
          isEfficiencyBadIfHigh: true
        };
      }

      // Default: Sales
      const roas = insights.roas || (spend > 0 ? (parseFloat(insights.purchase_value || insights.action_values?.[0]?.value || '0') / spend) : 0);
      return {
        mainValue: roas,
        mainLabel: 'ROAS',
        costValue: insights.cost_per_result || 0,
        costLabel: 'CPA',
        isEfficiencyBadIfHigh: false // High ROAS is good
      };
    };

    // Set Context Strings based on Profile
    if (profile === 'leads') {
      objectiveTitle = "MAXIMIZE LEAD VOLUME & QUALITY";
      primaryMetricLabel = "Leads";
      costMetricLabel = "CPL (Cost Per Lead)";
      thresholdLabel = "CPL";
    } else if (profile === 'engagement') {
      objectiveTitle = "MAXIMIZE BRAND ENGAGEMENT";
      primaryMetricLabel = "Post Engagements";
      costMetricLabel = "CPE (Cost Per Engagement)";
      thresholdLabel = "CPE";
    } else if (profile === 'messenger') {
      objectiveTitle = "MAXIMIZE MESSAGING CONVERSATIONS";
      primaryMetricLabel = "New Conversations";
      costMetricLabel = "Cost Per Message";
      thresholdLabel = "Cost/Msg";
    }

    // --- 2. PRE-PROCESS DATA WITH DYNAMIC METRICS ---

    // A. Account Level Snapshot
    const accountStatsRaw = getProfileMetrics(accountInsights || {});
    const accountStats = {
      spend: parseFloat(accountInsights?.spend || '0'),
      primary: accountStatsRaw.mainValue,
      cost: accountStatsRaw.costValue,
      ctr: parseFloat(accountInsights?.ctr || '0'),
      frequency: parseFloat(accountInsights?.frequency || '0')
    };

    // B. Campaign Analysis (Active vs Paused)
    // Sort logic depends on profile: Sales uses Spend/ROAS, others might prioritize volume or cost
    // We stick to Spend desc for "Kill Zone" analysis as that's where risk is
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').sort((a, b) => parseFloat(b.insights?.spend || '0') - parseFloat(a.insights?.spend || '0'));
    const pausedCampaigns = campaigns.filter(c => c.status !== 'ACTIVE').sort((a, b) => parseFloat(b.insights?.spend || '0') - parseFloat(a.insights?.spend || '0')).slice(0, 5);

    const formatCampaign = (c: Campaign) => {
      const i = c.insights || {} as any;
      const spend = parseFloat(i.spend || '0');
      const metrics = getProfileMetrics({ ...i, roas: i.roas }); // Pass i.roas as fallback for sales

      const mainValStr = profile === 'sales' ? `${metrics.mainValue.toFixed(2)}x` : metrics.mainValue.toLocaleString();
      const costValStr = `$${metrics.costValue.toFixed(2)}`;

      return `- **${c.name}** | Spend: $${spend.toFixed(0)} | ${metrics.mainLabel}: ${mainValStr} | ${metrics.costLabel}: ${costValStr} | CTR: ${parseFloat(i.ctr || '0').toFixed(2)}%`;
    };

    // C. Ad Level Analysis
    const activeAds = ads.filter(a => a.status === 'ACTIVE' && parseFloat(a.insights?.spend || '0') > 50).sort((a, b) => parseFloat(b.insights?.spend || '0') - parseFloat(a.insights?.spend || '0'));

    // Detect Fatigue
    const fatiguedAds = activeAds.filter(a => parseFloat(a.insights?.frequency || '0') > 2.4).slice(0, 3).map(a => `${a.name} (Freq: ${a.insights?.frequency})`);

    // Detect Winners (Dynamic)
    const topAds = activeAds.filter(a => {
      const m = getProfileMetrics({ ...(a.insights || {}), roas: (a.insights as any)?.roas });
      if (profile === 'sales') return m.mainValue > accountStats.primary; // Higher ROAS is better
      return m.costValue < accountStats.cost && m.costValue > 0; // Lower CPL/CPE/MsgCost is better
    }).slice(0, 3).map(a => {
      const m = getProfileMetrics({ ...(a.insights || {}), roas: (a.insights as any)?.roas });
      return `${a.name} (${m.mainLabel}: ${profile === 'sales' ? m.mainValue.toFixed(2) + 'x' : m.mainValue})`;
    });

    // D. Breakdowns
    const topPlacement = breakdowns?.placements?.sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend))[0]?.publisher_platform || "N/A";
    const topAge = breakdowns?.demographics?.sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend))[0]?.age || "N/A";
    const topRegion = breakdowns?.regions?.sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend))[0]?.region || "N/A";

    // --- 3. CONSTRUCT DYNAMIC PROMPT ---

    const prompt = `
      You are a Senior Meta Ads Media Buyer conducting a "Deep Dive" Performance Audit.

      **CONTEXT:**
      - **AUDIT PROFILE:** ${profile.toUpperCase()}
      - **MAIN GOAL:** ${objectiveTitle}
      - This audit must be tailored specifically to optimize for **${primaryMetricLabel}**.

      **STYLE GUIDELINES:**
      - **Tone:** Direct, confident, professional, and actionable.
      - **Structure:** Follow the logical flow below EXACTLY.

      --- DATA SOURCE (${profile.toUpperCase()} OPTIMIZED) ---

      **1. 📊 GLOBAL ACCOUNT PERFORMANCE (Last 30 Days)**
      - Total Spend: $${accountStats.spend.toFixed(0)}
      - **Account ${primaryMetricLabel}: ${profile === 'sales' ? accountStats.primary.toFixed(2) + 'x' : accountStats.primary.toLocaleString()}**
      - **Account ${costMetricLabel}: $${accountStats.cost.toFixed(2)}**
      - CTR: ${accountStats.ctr.toFixed(2)}%

      **2. 🚀 ACTIVE CAMPAIGNS (Scale Candidates)**
      ${activeCampaigns.map(formatCampaign).join('\n')}

      **3. 🛑 PAUSED CAMPAIGNS (Historical Context)**
      ${pausedCampaigns.map(formatCampaign).join('\n')}

      **4. 🎨 CREATIVE INTELLIGENCE**
      - Potential Creative Fatigue (Freq > 2.4): ${fatiguedAds.length > 0 ? fatiguedAds.join(', ') : "No major fatigue detected yet."}
      - Top Performing Creatives (Best ${profile === 'sales' ? 'ROAS' : 'Cost Efficiency'}): ${topAds.length > 0 ? topAds.join(', ') : "N/A"}

      **5. 🌍 DELIVERY INSIGHTS**
      - Top Placement: ${topPlacement}
      - Top Demographic: ${topAge}

      --- YOUR OUTPUT REPORT (GENERATE THIS EXACTLY) ---

      # 🎯 Audit Scope: ${profile.toUpperCase()} Profile
      (1 sentence confirming this audit is strictly optimized for **${objectiveTitle}** based on the selected Data View of **${dateRange}**.)

      # 📈 Overall Performance Summary
      (1 short paragraph. Are we hitting our ${costMetricLabel} targets? Is the volume of ${primaryMetricLabel} sufficient?)

      # 🚀 Campaigns to Scale (ACTIVE Only)
      (Identify ACTIVE campaigns performing BETTER than account average (${profile === 'sales' ? 'higher ROAS' : 'lower ' + costMetricLabel}). Recommend budget increases for efficiency winners.)

      # 🛑 Campaigns to Stop Immediately (ACTIVE Only)
      (Identify ACTIVE campaigns with poor performance (${profile === 'sales' ? 'Low ROAS' : 'High ' + costMetricLabel}). Be ruthless.)

      # 🧠 Historical Learnings (PAUSED Campaigns)
      (Did we pause campaigns that actually had good ${costMetricLabel}? Or was pausing justified?)

      # 🛠 Tactical Optimization Plan
      (3-4 Bullet points. Be specific.)
      - **Focus on [Winner Name]:** [Action].
      - **Creative:** [Comment on fatigue].
      - **Audience:** [Comment on ${topPlacement} or ${topAge} validity for this goal].

      # ✅ Executive Takeaway
      (3 bullet points summarizing the plan).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "Could not generate analysis.";

    return {
      analysis: text,
      recommendations: [],
      sentiment: text.toLowerCase().includes('good') || text.toLowerCase().includes('scale') ? 'positive' : 'neutral'
    };

  } catch (error) {
    console.error("AI Audit Failed", error);
    return {
      analysis: "Unable to connect to AI service currently. Please check your network or try again later.",
      recommendations: [],
      sentiment: 'neutral'
    };
  }
};
