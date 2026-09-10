import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function categorizeArticle(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('weather') || lower.includes('rain')) return 'weather';
  if (lower.includes('price') || lower.includes('mandi')) return 'market';
  if (lower.includes('scheme') || lower.includes('government')) return 'schemes';
  if (lower.includes('technology') || lower.includes('digital')) return 'technology';
  return 'general';
}

function deduplicateByUrl(articles: any[]): any[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const newsApiKey = Deno.env.get('NEWS_API_KEY') ?? '';

  try {
    const newsRes = await fetch(
      `https://newsapi.org/v2/everything?q=farmer+OR+agriculture+OR+krishi+India&language=en&pageSize=50&sortBy=publishedAt&apiKey=${newsApiKey}`
    );

    if (!newsRes.ok) {
      const errText = await newsRes.text();
      return new Response(
        JSON.stringify({ error: `NewsAPI error: ${newsRes.status}`, detail: errText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newsData = await newsRes.json();
    const articles = (newsData.articles ?? [])
      .filter((a: any) => a.url && a.title)
      .map((a: any) => ({
        title: a.title,
        summary: a.description ?? '',
        image: a.urlToImage ?? '',
        source: a.source?.name ?? 'NewsAPI',
        url: a.url,
        category: categorizeArticle(a.title + ' ' + (a.description ?? '')),
        published_at: a.publishedAt,
      }));

    const uniqueArticles = deduplicateByUrl(articles).slice(0, 100);

    if (uniqueArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('news_articles')
      .upsert(uniqueArticles, { onConflict: 'url', ignoreDuplicates: true });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, inserted: uniqueArticles.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});