// The public Awaken Heart demonstration is fictional and owned by each visitor's browser.
// Never expose or write the retired shared sample database from this endpoint.
import { freshDemo } from '@/lib/demo-session';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json(freshDemo(), { headers: { 'Cache-Control':'no-store' } });
}
export async function POST() {
  return Response.json({error:'visitor-demo-is-local'}, { status:403, headers:{'Cache-Control':'no-store'} });
}
