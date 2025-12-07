
import { GoogleGenAI } from "@google/genai";
import { Campaign, AIAnalysisResult, AdPerformance } from "../types";

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
      As a Creative Strategist, audit this ad asset.
      
      DATA:
      - Name: ${ad.ad_name}
      - ${statusContext}
      - Spend: $${ad.spend}
      - ROAS: ${ad.roas?.toFixed(2)}
      - CPA: $${ad.cpa?.toFixed(2)}
      - CTR: ${ad.ctr}%
      - Thumb Stopping Rate (3s Play / Impr): ${ad.video_plays ? ((parseInt(ad.video_plays) / parseInt(ad.impressions)) * 100).toFixed(2) : 'N/A'}%
      
      ANALYSIS REQUIRED:
      1. **Hook Analysis**: Is the CTR healthy (>1%)? If not, critique the headline/thumbnail.
      2. **Conversion**: Is the ROAS healthy? If CTR is high but ROAS low, mention "Offer Mismatch".
      3. **Action**: 
         - If Active: Stop, Scale, or Iterate?
         - If Paused: Was this a premature pause (High ROAS) or justified (Low ROAS)?

      Keep it to 3 bullet points.
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
