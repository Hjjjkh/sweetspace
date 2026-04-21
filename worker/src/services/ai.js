// Love Space AI Service
// OpenRouter API integration with caching and rate limiting

export class AIService {
  constructor(env, user) {
    this.env = env;
    this.user = user;
    this.apiKey = env.OPENROUTER_API_KEY;
    this.model = env.AI_MODEL || 'openrouter/elephant-alpha';
    this.rateLimit = parseInt(env.AI_RATE_LIMIT) || 100;
    this.cacheDays = parseInt(env.AI_CACHE_DAYS) || 30;
    this.timeout = parseInt(env.AI_TIMEOUT_MS) || 30000;
  }

  // Check if AI is enabled
  isEnabled() {
    return !!this.apiKey;
  }

  // Get user's AI usage today
  async getTodayUsage() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = Math.floor(today.getTime() / 1000);

      const result = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM ai_usage_log WHERE user_id = ? AND created_at >= ?'
      )
        .bind(this.user.id, todayStart)
        .first();

      return result.count || 0;
    } catch (e) {
      console.log('AI usage log table may not exist:', e.message);
      return 0;
    }
  }

  // Check rate limit
  async checkRateLimit() {
    try {
      const usage = await this.getTodayUsage();
      return {
        allowed: usage < this.rateLimit,
        remaining: Math.max(0, this.rateLimit - usage),
        total: this.rateLimit
      };
    } catch (e) {
      console.log('Rate limit check failed, allowing request:', e.message);
      // If rate limit check fails, allow the request anyway
      return {
        allowed: true,
        remaining: this.rateLimit,
        total: this.rateLimit
      };
    }
  }

  // Get cached response
  async getCachedResponse(requestType, content) {
    try {
      const requestHash = await this.md5(`${requestType}:${content}`);

      const cached = await this.env.DB.prepare(
        'SELECT response_content, metadata FROM ai_responses WHERE request_hash = ? AND expires_at > ? AND user_id = ?'
      )
        .bind(requestHash, Math.floor(Date.now() / 1000), this.user.id)
        .first();

      if (cached) {
        return {
          content: cached.response_content,
          metadata: cached.metadata ? JSON.parse(cached.metadata) : null,
          fromCache: true
        };
      }
    } catch (e) {
      console.log('AI cache table may not exist:', e.message);
    }

    return null;
  }

  // Cache AI response
  async cacheResponse(requestType, content, response, metadata = null) {
    try {
      const id = crypto.randomUUID();
      const requestHash = await this.md5(`${requestType}:${content}`);
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + (this.cacheDays * 24 * 60 * 60);

      await this.env.DB.prepare(
        `INSERT INTO ai_responses (id, user_id, request_type, request_hash, response_content, metadata, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          this.user.id,
          requestType,
          requestHash,
          response,
          metadata ? JSON.stringify(metadata) : null,
          now,
          expiresAt
        )
        .run();

      return id;
    } catch (e) {
      console.log('Failed to cache AI response:', e.message);
    }
  }

  // Log AI usage
  async logUsage(requestType, tokensUsed = null) {
    try {
      const id = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      await this.env.DB.prepare(
        'INSERT INTO ai_usage_log (id, user_id, request_type, tokens_used, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(id, this.user.id, requestType, tokensUsed, now)
        .run();
    } catch (e) {
      console.log('Failed to log AI usage:', e.message);
    }
  }

  // Call OpenRouter API
  async callAI(messages, maxTokens = 500, temperature = 0.7) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://love-space.pages.dev',
          'X-Title': 'Love Space',
          'User-Agent': 'LoveSpace/1.0'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: maxTokens,
          temperature
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || '',
        tokensUsed: data.usage?.total_tokens || null,
        model: data.model
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('AI request timeout');
      }
      throw error;
    }
  }

  // Main method: get AI response with caching
  async getResponse(requestType, prompt, systemPrompt = null) {
    // Check if AI is enabled
    if (!this.isEnabled()) {
      throw new Error('AI service is not enabled. Please configure OPENROUTER_API_KEY');
    }

    // Check rate limit
    const rateLimit = await this.checkRateLimit();
    if (!rateLimit.allowed) {
      throw new Error(`AI rate limit exceeded. Try again tomorrow. Remaining: ${rateLimit.remaining}`);
    }

    // Try cache first
    const cached = await this.getCachedResponse(requestType, prompt);
    if (cached) {
      return cached;
    }

    // Build messages
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    // Retry logic with exponential backoff
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await this.callAI(messages);

        // Cache the response
        await this.cacheResponse(requestType, prompt, result.content);

        // Log usage
        await this.logUsage(requestType, result.tokensUsed);

        return {
          content: result.content,
          fromCache: false,
          model: result.model
        };
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  // Clear user's AI cache
  async clearCache() {
    try {
      await this.env.DB.prepare(
        'DELETE FROM ai_responses WHERE user_id = ?'
      )
        .bind(this.user.id)
        .run();

      return { success: true };
    } catch (e) {
      console.log('Failed to clear cache:', e.message);
      throw e; // Re-throw so caller knows it failed
    }
  }

  // Get AI usage statistics
  async getUsageStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = Math.floor(today.getTime() / 1000);

      const todayUsage = await this.env.DB.prepare(
        'SELECT COUNT(*) as count, SUM(tokens_used) as total_tokens FROM ai_usage_log WHERE user_id = ? AND created_at >= ?'
      )
        .bind(this.user.id, todayStart)
        .first();

      const totalUsage = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM ai_usage_log WHERE user_id = ?'
      )
        .bind(this.user.id)
        .first();

      const cacheSize = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM ai_responses WHERE user_id = ?'
      )
        .bind(this.user.id)
        .first();

      return {
        today: {
          requests: todayUsage.count || 0,
          tokens: todayUsage.total_tokens || 0,
          limit: this.rateLimit,
          remaining: Math.max(0, this.rateLimit - (todayUsage.count || 0))
        },
        total: {
          requests: totalUsage.count || 0
        },
        cache: {
          size: cacheSize.count || 0,
          maxAge: this.cacheDays
        }
      };
    } catch (e) {
      console.log('Failed to get usage stats:', e.message);
      // Return default stats if tables don't exist
      return {
        today: { requests: 0, tokens: 0, limit: this.rateLimit, remaining: this.rateLimit },
        total: { requests: 0 },
        cache: { size: 0, maxAge: this.cacheDays }
      };
    }
  }

  // MD5 hash using Web Crypto API (compatible with Cloudflare Workers)
  async md5(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export default AIService;
