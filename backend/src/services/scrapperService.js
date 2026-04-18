const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

let YoutubeTranscript;
try {
  YoutubeTranscript = require('youtube-transcript').YoutubeTranscript;
} catch (error) {
  YoutubeTranscript = null;
}

const REQUEST_TIMEOUT = 10000;
const MAX_TEXT_CHARS = 12000;

function normalizeText(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueStrings(values = [], limit = 10) {
  return Array.from(new Set(values.map(normalizeText).filter(Boolean))).slice(0, limit);
}

function detectPlatform(url = '') {
  const value = String(url).toLowerCase();
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube';
  if (value.includes('vimeo.com')) return 'vimeo';
  if (value.includes('github.com')) return 'github';
  if (value.includes('spotify.com') || value.includes('soundcloud.com')) return 'podcast';
  return 'generic';
}

function detectTypeFromMetadata(metadata = {}, hintType = null) {
  if (hintType && ['blog', 'repo', 'video', 'podcast'].includes(hintType)) {
    return hintType;
  }

  const platform = metadata.platform || '';
  const ogType = String(metadata.ogType || '').toLowerCase();

  if (platform === 'github') return 'repo';
  if (platform === 'youtube' || platform === 'vimeo') return 'video';
  if (platform === 'podcast') return 'podcast';
  if (ogType.includes('video')) return 'video';
  if (ogType.includes('podcast') || ogType.includes('music.song')) return 'podcast';

  return 'blog';
}

function extractYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    const watchId = parsed.searchParams.get('v');
    if (watchId) {
      return watchId;
    }

    const match = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

async function fetchOEmbed(url) {
  try {
    const endpoint = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const response = await axios.get(endpoint, { timeout: REQUEST_TIMEOUT });
    return response.data || {};
  } catch (error) {
    return {};
  }
}

async function fetchHtmlPage(url) {
  const response = await axios.get(url, {
    timeout: REQUEST_TIMEOUT,
    maxRedirects: 5,
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TechBitBot/1.0)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    validateStatus: status => status >= 200 && status < 400,
  });

  return {
    html: typeof response.data === 'string' ? response.data : '',
    finalUrl: response.request?.res?.responseUrl || url,
    contentType: response.headers?.['content-type'] || '',
  };
}

function extractHtmlMetadata(html, sourceUrl) {
  const $ = cheerio.load(html || '');

  const title =
    normalizeText($('meta[property="og:title"]').attr('content')) ||
    normalizeText($('meta[name="twitter:title"]').attr('content')) ||
    normalizeText($('title').first().text());

  const description =
    normalizeText($('meta[property="og:description"]').attr('content')) ||
    normalizeText($('meta[name="description"]').attr('content')) ||
    normalizeText($('meta[name="twitter:description"]').attr('content'));

  const author =
    normalizeText($('meta[name="author"]').attr('content')) ||
    normalizeText($('meta[property="article:author"]').attr('content')) ||
    normalizeText($('[rel="author"]').first().text());

  const ogType = normalizeText($('meta[property="og:type"]').attr('content'));
  const siteName = normalizeText($('meta[property="og:site_name"]').attr('content'));

  const tags = normalizeText($('meta[name="keywords"]').attr('content'))
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

  const headings = uniqueStrings(
    $('h1, h2, h3').map((_, el) => $(el).text()).get(),
    12
  );

  const snippets = uniqueStrings(
    $('article p, main p, p')
      .map((_, el) => $(el).text())
      .get()
      .filter(text => normalizeText(text).length > 60),
    10
  );

  return {
    url: sourceUrl,
    title,
    description,
    author,
    siteName,
    ogType,
    tags: uniqueStrings(tags, 10),
    headings,
    snippets,
    extractedText: normalizeText(snippets.join('\n')).slice(0, MAX_TEXT_CHARS),
  };
}

async function extractYouTubeTranscript(url) {
  if (!YoutubeTranscript) return [];

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return [];

  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (!Array.isArray(items)) return [];

    return items
      .map(item => normalizeText(item?.text || ''))
      .filter(Boolean)
      .slice(0, 300);
  } catch (error) {
    logger.warn('YouTube transcript unavailable', {
      url,
      error: error.message,
    });
    return [];
  }
}

async function scrapeUrlMetadata(url, hintType = null) {
  const platform = detectPlatform(url);
  const base = {
    url,
    platform,
    type: hintType || 'blog',
    title: '',
    description: '',
    author: '',
    siteName: '',
    ogType: '',
    contentType: '',
    tags: [],
    headings: [],
    snippets: [],
    transcript: [],
    extractedText: '',
  };

  try {
    const [oembedResult, pageResult, transcriptResult] = await Promise.allSettled([
      fetchOEmbed(url),
      fetchHtmlPage(url),
      platform === 'youtube' ? extractYouTubeTranscript(url) : Promise.resolve([]),
    ]);

    const oembed = oembedResult.status === 'fulfilled' ? oembedResult.value : {};
    const page = pageResult.status === 'fulfilled'
      ? pageResult.value
      : { html: '', finalUrl: url, contentType: '' };
    const transcript = transcriptResult.status === 'fulfilled' ? transcriptResult.value : [];

    const htmlMeta = page.html ? extractHtmlMetadata(page.html, page.finalUrl || url) : {};

    const merged = {
      ...base,
      ...htmlMeta,
      contentType: page.contentType || '',
      transcript,
      title: normalizeText(oembed.title || htmlMeta.title || ''),
      description: normalizeText(oembed.description || htmlMeta.description || ''),
      author: normalizeText(oembed.author_name || htmlMeta.author || ''),
      siteName: normalizeText(oembed.provider_name || htmlMeta.siteName || ''),
      tags: uniqueStrings([...(htmlMeta.tags || []), ...(oembed.tags || [])], 10),
      extractedText: normalizeText([
        htmlMeta.extractedText || '',
        transcript.slice(0, 120).join(' '),
        oembed.description || '',
      ].join('\n')).slice(0, MAX_TEXT_CHARS),
    };

    merged.type = detectTypeFromMetadata(merged, hintType);

    if (!merged.title) {
      try {
        const parsed = new URL(url);
        merged.title = normalizeText(`${parsed.hostname}${parsed.pathname.replace(/\//g, ' ')}`).slice(0, 180) || 'Resource';
      } catch (error) {
        merged.title = 'Resource';
      }
    }

    return merged;
  } catch (error) {
    logger.warn('Failed to scrape URL metadata', {
      url,
      error: error.message,
    });
    return base;
  }
}

function buildFallbackPostContent(metadata, requestedType) {
  const effectiveType = requestedType || metadata.type || 'blog';
  const title = metadata.title || 'Resource';

  const highlights = uniqueStrings([
    ...(metadata.headings || []),
    ...(metadata.snippets || []),
    ...((metadata.transcript || []).slice(0, 8)),
  ], 8);

  const lines = highlights.length > 0
    ? highlights.map(text => `- ${text}`).join('\n')
    : '- No detailed content could be extracted from this URL.';

  return `## ${title}

### Overview
This ${effectiveType} post was generated from scraped URL metadata.

### Extracted Highlights
${lines}

### Source
- URL: ${metadata.url}
- Platform: ${metadata.platform || 'generic'}
${metadata.author ? `- Author/Creator: ${metadata.author}` : ''}
${metadata.siteName ? `- Site: ${metadata.siteName}` : ''}`;
}

module.exports = {
  scrapeUrlMetadata,
  buildFallbackPostContent,
};
