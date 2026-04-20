// AI API Handlers
// All AI-related API endpoints

import { AIService } from '../services/ai.js';
import {
  getMoodAnalysisPrompt,
  getPhotoDescriptionPrompt,
  getMessagePolishPrompt,
  getDatePlanningPrompt,
  getTopicGenerationPrompt,
  getRelationshipInsightPrompt
} from '../prompts/index.js';

export async function handleAIRequest(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/ai/', '');

  try {
    switch (path) {
      case 'analyze-mood':
        return await handleMoodAnalysis(request, env, user);
      case 'generate-photo-desc':
        return await handlePhotoDescription(request, env, user);
      case 'polish-message':
        return await handleMessagePolish(request, env, user);
      case 'plan-date':
        return await handleDatePlanning(request, env, user);
      case 'generate-topic':
        return await handleTopicGeneration(request, env, user);
      case 'relationship-insight':
        return await handleRelationshipInsight(request, env, user);
      case 'usage':
        return await handleAIUsage(request, env, user);
      case 'clear-cache':
        return await handleClearCache(request, env, user);
      default:
        return new Response('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('AI Handler Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      type: 'ai_error'
    }), {
      status: error.message.includes('rate limit') ? 429 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Mood Analysis Handler
async function handleMoodAnalysis(request, env, user) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { days = 30, moodData } = await request.json();

  const aiService = new AIService(env, user);
  const prompt = getMoodAnalysisPrompt(moodData, days);

  const result = await aiService.getResponse('mood', prompt);

  return new Response(JSON.stringify({
    success: true,
    analysis: result.content,
    fromCache: result.fromCache
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Photo Description Handler
async function handlePhotoDescription(request, env, user) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { filename, existingTags = [] } = await request.json();

  const aiService = new AIService(env, user);
  const prompt = getPhotoDescriptionPrompt(filename, existingTags);

  const result = await aiService.getResponse('photo', prompt);

  // Parse the response to extract description, tags, and poem
  const parsed = parsePhotoResponse(result.content);

  return new Response(JSON.stringify({
    success: true,
    description: parsed.description,
    tags: parsed.tags,
    poem: parsed.poem,
    fromCache: result.fromCache
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Message Polish Handler
async function handleMessagePolish(request, env, user) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { draft, styles = ['温馨', '幽默', '深情'] } = await request.json();

  const aiService = new AIService(env, user);
  const prompt = getMessagePolishPrompt(draft, styles);

  // Don't cache message polishing (privacy)
  const result = await aiService.callAI([
    { role: 'user', content: prompt }
  ]);

  return new Response(JSON.stringify({
    success: true,
    polished: parseMessagePolish(result.content),
    fromCache: false
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Date Planning Handler
async function handleDatePlanning(request, env, user) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { preferences, occasion, budget, duration } = await request.json();

  const aiService = new AIService(env, user);
  const prompt = getDatePlanningPrompt(preferences, occasion, budget, duration);

  const result = await aiService.getResponse('date', prompt);

  return new Response(JSON.stringify({
    success: true,
    plan: result.content,
    fromCache: result.fromCache
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Topic Generation Handler
async function handleTopicGeneration(request, env, user) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { category = 'general', relationshipStage = 'stable' } = await request.json();

  const aiService = new AIService(env, user);
  const prompt = getTopicGenerationPrompt(category, relationshipStage);

  const result = await aiService.getResponse('topic', prompt);

  return new Response(JSON.stringify({
    success: true,
    topics: parseTopics(result.content),
    fromCache: result.fromCache
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Relationship Insight Handler
async function handleRelationshipInsight(request, env, user) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { events, messages, moods, days = 7 } = await request.json();

  const aiService = new AIService(env, user);
  const prompt = getRelationshipInsightPrompt(events, messages, moods, days);

  const result = await aiService.getResponse('insight', prompt);

  return new Response(JSON.stringify({
    success: true,
    insight: result.content,
    fromCache: result.fromCache
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Usage Stats Handler
async function handleAIUsage(request, env, user) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const aiService = new AIService(env, user);
  const stats = await aiService.getUsageStats();

  return new Response(JSON.stringify({
    success: true,
    stats
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Clear Cache Handler
async function handleClearCache(request, env, user) {
  if (request.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 });
  }

  const aiService = new AIService(env, user);
  await aiService.clearCache();

  return new Response(JSON.stringify({
    success: true,
    message: 'AI cache cleared successfully'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper: Parse photo response
function parsePhotoResponse(content) {
  const result = {
    description: '',
    tags: [],
    poem: null
  };

  // Try to extract sections
  const descMatch = content.match(/描述 [:：]\s*([\s\S]*?)(?:标签 | 诗意|$)/);
  const tagsMatch = content.match(/标签 [:：]\s*\[([\s\S]*?)\]/);
  const poemMatch = content.match(/(?:诗意 | 诗)[:：]\s*([\s\S]*?)$/);

  if (descMatch) {
    result.description = descMatch[1].trim();
  } else {
    result.description = content.split('\n')[0].trim();
  }

  if (tagsMatch) {
    result.tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
  }

  if (poemMatch) {
    result.poem = poemMatch[1].trim();
  }

  return result;
}

// Helper: Parse message polish response
function parseMessagePolish(content) {
  const styles = {};
  const lines = content.split('\n');
  let currentStyle = 'default';

  for (const line of lines) {
    if (line.match(/^[**##]*\s*(温馨 | 幽默 | 深情|default)/i)) {
      currentStyle = line.replace(/[**#]/g, '').trim();
    } else if (line.trim() && currentStyle) {
      styles[currentStyle] = (styles[currentStyle] || '') + line.trim() + '\n';
    }
  }

  return styles;
}

// Helper: Parse topics response
function parseTopics(content) {
  const topics = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^[*\-•]?\s*(.+)$/);
    if (match && match[1].trim()) {
      topics.push(match[1].trim());
    }
  }

  return topics.slice(0, 10); // Max 10 topics
}

export default handleAIRequest;
