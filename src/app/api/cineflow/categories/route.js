import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/cineflow';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('model_id');
    if (!modelId) {
      return NextResponse.json({ success: false, error: 'model_id is required' }, { status: 400 });
    }

    const categories = await getCategories(modelId);
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
