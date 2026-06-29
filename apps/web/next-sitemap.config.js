/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://krishisahayak.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/api/*', '/opengraph-image', '/*/opengraph-image'],
  transform: async (config, path) => {
    const overrides = {
      '/':        { priority: 1.0, changefreq: 'daily'  },
      '/market':  { priority: 0.9, changefreq: 'hourly' },
      '/news':    { priority: 0.8, changefreq: 'daily'  },
      '/schemes': { priority: 0.7, changefreq: 'weekly' },
    };
    const override = overrides[path] ?? {};
    return {
      loc: path,
      changefreq: override.changefreq ?? config.changefreq ?? 'weekly',
      priority: override.priority ?? config.priority ?? 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};
