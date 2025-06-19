const cheerio = require('cheerio');
const validator = require('validator');
const logger = require('../utils/logger');

class SEOAnalyzer {
  /**
   * Analyze HTML content for SEO factors
   * @param {string} html - Raw HTML content
   * @param {string} url - URL of the page
   * @param {Object} options - Analysis options
   * @returns {Object} Comprehensive SEO analysis results
   */
  async analyze(html, url, options = {}) {
    try {
      const $ = cheerio.load(html);
      const results = {
        url,
        timestamp: new Date().toISOString(),
        metadata: this.analyzeMetadata($),
        headings: this.analyzeHeadings($),
        links: this.analyzeLinks($, url),
        images: this.analyzeImages($),
        performance: this.analyzePerformance($),
        security: await this.analyzeSecurity(url),
        technical: this.analyzeTechnicalSEO($),
        accessibility: this.analyzeAccessibility($),
        structuredData: this.analyzeStructuredData($),
        mobile: this.analyzeMobileFriendliness($),
        contentQuality: this.analyzeContentQuality($),
        recommendations: []
      };

      // Generate recommendations based on analysis
      results.recommendations = this.generateRecommendations(results);
      
      // Calculate overall SEO score
      results.score = this.calculateOverallScore(results);

      return results;
    } catch (error) {
      logger.error('SEO analysis failed:', error);
      throw new Error(`SEO analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze metadata (title, description, keywords)
   */
  analyzeMetadata($) {
    const titles = $('title');
    const title = titles.first().text();
    const metaDescription = $('meta[name="description"]').attr('content');
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    const canonical = $('link[rel="canonical"]').attr('href');
    const robots = $('meta[name="robots"]').attr('content');

    const results = {
      title: {
        content: title,
        length: title ? title.length : 0,
        issues: []
      },
      description: {
        content: metaDescription,
        length: metaDescription ? metaDescription.length : 0,
        issues: []
      },
      keywords: metaKeywords ? metaKeywords.split(',').map(k => k.trim()) : [],
      canonical: canonical || null,
      robots: robots || null
    };

    // Title analysis
    if (titles.length === 0) {
      results.title.issues.push('Missing title tag');
    } else if (titles.length > 1) {
      results.title.issues.push('Multiple title tags found; only the first will be used');
    }

    if (!title) {
      results.title.issues.push('Missing title tag');
    } else {
      if (title.length < 30) results.title.issues.push('Title too short (< 30 characters)');
      if (title.length > 60) results.title.issues.push('Title too long (> 60 characters)');
    }

    // Description analysis
    if (!metaDescription) {
      results.description.issues.push('Missing meta description');
    } else {
      if (metaDescription.length < 120) results.description.issues.push('Description too short (< 120 characters)');
      if (metaDescription.length > 160) results.description.issues.push('Description too long (> 160 characters)');
    }

    return results;
  }

  /**
   * Analyze heading structure
   */
  analyzeHeadings($) {
    const headings = {
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
      issues: []
    };

    // Collect all headings
    for (let i = 1; i <= 6; i++) {
      $(`h${i}`).each((_, elem) => {
        headings[`h${i}`].push({
          text: $(elem).text().trim(),
          length: $(elem).text().trim().length
        });
      });
    }

    // Check for heading structure issues
    if (headings.h1.length === 0) {
      headings.issues.push('Missing H1 heading');
    }
    if (headings.h1.length > 1) {
      headings.issues.push('Multiple H1 headings found');
    }

    // Check heading hierarchy
    let previousLevel = 1;
    $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
      const currentLevel = parseInt(elem.tagName.toLowerCase().replace('h', ''));
      if (currentLevel - previousLevel > 1) {
        headings.issues.push(`Skipped heading level: from H${previousLevel} to H${currentLevel}`);
      }
      previousLevel = currentLevel;
    });

    return headings;
  }

  /**
   * Analyze links (internal, external, broken)
   */
  analyzeLinks($, baseUrl) {
    const links = {
      internal: [],
      external: [],
      broken: [],
      social: [],
      attributes: {
        nofollow: 0,
        sponsored: 0,
        ugc: 0
      },
      total: 0,
      issues: []
    };

    const baseHostname = new URL(baseUrl).hostname;

    $('a').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      const rel = $(elem).attr('rel') || '';

      if (!href) {
        links.broken.push({ text, reason: 'Missing href attribute' });
        return;
      }

      try {
        const url = new URL(href, baseUrl);
        const linkInfo = {
          url: url.href,
          text,
          rel
        };

        // Check link attributes
        if (rel.includes('nofollow')) links.attributes.nofollow++;
        if (rel.includes('sponsored')) links.attributes.sponsored++;
        if (rel.includes('ugc')) links.attributes.ugc++;

        // Categorize link
        if (url.hostname === baseHostname) {
          links.internal.push(linkInfo);
        } else {
          if (this.isSocialMediaLink(url.hostname)) {
            links.social.push(linkInfo);
          }
          links.external.push(linkInfo);
        }

      } catch (error) {
        links.broken.push({ text, href, reason: 'Invalid URL format' });
      }
    });

    links.total = links.internal.length + links.external.length;

    // Check for issues
    if (links.broken.length > 0) {
      links.issues.push(`Found ${links.broken.length} broken links`);
    }
    if (links.external.length > 0 && links.attributes.nofollow === 0) {
      links.issues.push('External links without nofollow attributes');
    }

    return links;
  }

  /**
   * Analyze images (alt text, size, optimization)
   */
  analyzeImages($) {
    const images = {
      total: 0,
      withAlt: 0,
      withoutAlt: [],
      large: [],
      issues: []
    };

    $('img').each((_, elem) => {
      const src = $(elem).attr('src');
      const alt = $(elem).attr('alt');
      const width = $(elem).attr('width');
      const height = $(elem).attr('height');

      images.total++;

      if (!alt) {
        images.withoutAlt.push({
          src,
          context: $(elem).parent().html()
        });
      } else {
        images.withAlt++;
      }

      // Check for missing dimensions
      if (!width || !height) {
        images.issues.push(`Image missing dimensions: ${src}`);
      }
    });

    if (images.withoutAlt.length > 0) {
      images.issues.push(`${images.withoutAlt.length} images missing alt text`);
    }

    return images;
  }

  /**
   * Analyze performance indicators
   */
  analyzePerformance($) {
    const performance = {
      resourceHints: {
        preload: [],
        preconnect: [],
        prefetch: []
      },
      deferredScripts: 0,
      asyncScripts: 0,
      totalScripts: 0,
      totalStyles: 0,
      issues: []
    };

    // Analyze resource hints
    $('link[rel="preload"]').each((_, elem) => {
      performance.resourceHints.preload.push($(elem).attr('href'));
    });

    $('link[rel="preconnect"]').each((_, elem) => {
      performance.resourceHints.preconnect.push($(elem).attr('href'));
    });

    $('link[rel="prefetch"]').each((_, elem) => {
      performance.resourceHints.prefetch.push($(elem).attr('href'));
    });

    // Analyze scripts
    $('script').each((_, elem) => {
      performance.totalScripts++;
      if ($(elem).attr('defer')) performance.deferredScripts++;
      if ($(elem).attr('async')) performance.asyncScripts++;
    });

    // Analyze styles
    performance.totalStyles = $('link[rel="stylesheet"]').length;

    // Check for performance issues
    if (performance.totalScripts > 0 && performance.deferredScripts === 0 && performance.asyncScripts === 0) {
      performance.issues.push('No deferred or async scripts found');
    }

    if (performance.totalStyles > 5) {
      performance.issues.push('High number of stylesheet files');
    }

    return performance;
  }

  /**
   * Analyze security aspects
   */
  async analyzeSecurity(url) {
    const security = {
      https: url.startsWith('https://'),
      headers: {},
      issues: []
    };

    if (!security.https) {
      security.issues.push('Site not served over HTTPS');
    }

    return security;
  }

  /**
   * Analyze technical SEO aspects
   */
  analyzeTechnicalSEO($) {
    const technical = {
      viewport: $('meta[name="viewport"]').attr('content'),
      charset: $('meta[charset]').attr('charset'),
      language: $('html').attr('lang'),
      doctype: $.root().find('doctype').length > 0,
      issues: []
    };

    if (!technical.viewport) {
      technical.issues.push('Missing viewport meta tag');
    }
    if (!technical.charset) {
      technical.issues.push('Missing charset declaration');
    }
    if (!technical.language) {
      technical.issues.push('Missing language declaration');
    }
    if (!technical.doctype) {
      technical.issues.push('Missing DOCTYPE declaration');
    }

    return technical;
  }

  /**
   * Analyze accessibility features
   */
  analyzeAccessibility($) {
    const accessibility = {
      ariaAttributes: 0,
      skipLinks: $('a[href^="#main"], a[href^="#content"]').length > 0,
      formLabels: $('form label').length,
      formInputs: $('form input').length,
      issues: []
    };

    // Count ARIA attributes
    $('[aria-label], [aria-describedby], [aria-hidden]').each(() => {
      accessibility.ariaAttributes++;
    });

    // Check for common accessibility issues
    if (!accessibility.skipLinks) {
      accessibility.issues.push('No skip navigation links found');
    }

    if (accessibility.formInputs > accessibility.formLabels) {
      accessibility.issues.push('Some form inputs missing labels');
    }

    return accessibility;
  }

  /**
   * Analyze structured data
   */
  analyzeStructuredData($) {
    const structuredData = {
      types: [],
      issues: []
    };

    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        if (data['@type']) {
          structuredData.types.push(data['@type']);
        }
      } catch (error) {
        structuredData.issues.push('Invalid JSON-LD structured data');
      }
    });

    return structuredData;
  }

  /**
   * Analyze mobile-friendliness
   */
  analyzeMobileFriendliness($) {
    const mobile = {
      viewport: $('meta[name="viewport"]').attr('content'),
      touchIcons: $('link[rel*="apple-touch-icon"]').length,
      tapTargets: this.analyzeTapTargets($),
      issues: []
    };

    if (!mobile.viewport) {
      mobile.issues.push('Missing viewport meta tag');
    } else if (!mobile.viewport.includes('width=device-width')) {
      mobile.issues.push('Viewport meta tag missing width=device-width');
    }

    if (mobile.tapTargets.small > 0) {
      mobile.issues.push(`${mobile.tapTargets.small} tap targets too small`);
    }

    return mobile;
  }

  /**
   * Analyze content quality
   */
  analyzeContentQuality($) {
    const content = {
      wordCount: this.countWords($('body').text()),
      paragraphs: $('p').length,
      lists: $('ul, ol').length,
      tables: $('table').length,
      issues: []
    };

    if (content.wordCount < 300) {
      content.issues.push('Content length below recommended minimum (300 words)');
    }

    if (content.paragraphs < 3) {
      content.issues.push('Too few paragraphs');
    }

    return content;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(results) {
    const recommendations = [];

    // Metadata recommendations
    if (results.metadata.title.issues.length > 0) {
      recommendations.push({
        category: 'Metadata',
        priority: 'High',
        issue: results.metadata.title.issues.join(', '),
        solution: 'Optimize title tag length (30-60 characters) and include primary keyword'
      });
    }

    if (results.metadata.description.issues.length > 0) {
      recommendations.push({
        category: 'Metadata',
        priority: 'High',
        issue: results.metadata.description.issues.join(', '),
        solution: 'Optimize meta description length (120-160 characters) and include call-to-action'
      });
    }

    // Content structure recommendations
    results.headings.issues.forEach(issue => {
      recommendations.push({
        category: 'Content Structure',
        priority: 'Medium',
        issue,
        solution: 'Implement proper heading hierarchy (H1-H6)'
      });
    });

    // Image optimization recommendations
    results.images.issues.forEach(issue => {
      recommendations.push({
        category: 'Images',
        priority: 'Medium',
        issue,
        solution: 'Add descriptive alt text and specify image dimensions'
      });
    });

    // Technical recommendations
    results.technical.issues.forEach(issue => {
      recommendations.push({
        category: 'Technical SEO',
        priority: 'High',
        issue,
        solution: 'Implement proper technical SEO elements'
      });
    });

    return recommendations;
  }

  /**
   * Calculate overall SEO score
   */
  calculateOverallScore(results) {
    let score = 100;
    const issues = [
      ...results.metadata.title.issues,
      ...results.metadata.description.issues,
      ...results.headings.issues,
      ...results.images.issues,
      ...results.technical.issues,
      ...results.accessibility.issues
    ];

    // Deduct points for each issue based on severity
    issues.forEach(issue => {
      if (issue.includes('Missing')) score -= 5;
      else if (issue.includes('Multiple')) score -= 3;
      else score -= 2;
    });

    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Helper: Count words in text
   */
  countWords(text) {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Helper: Analyze tap targets for mobile
   */
  analyzeTapTargets($) {
    const results = {
      total: 0,
      small: 0
    };

    $('a, button, input, select, textarea').each((_, elem) => {
      results.total++;
      // In a real implementation, we would check actual element dimensions
      // This is a simplified version
      if ($(elem).css('width') < '44px' || $(elem).css('height') < '44px') {
        results.small++;
      }
    });

    return results;
  }

  /**
   * Helper: Check if hostname is a social media site
   */
  isSocialMediaLink(hostname) {
    const socialDomains = [
      'facebook.com',
      'twitter.com',
      'linkedin.com',
      'instagram.com',
      'pinterest.com',
      'youtube.com'
    ];
    return socialDomains.some(domain => hostname.includes(domain));
  }
}

module.exports = new SEOAnalyzer();
