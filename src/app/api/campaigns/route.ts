import { NextResponse } from 'next/server'
import { campaigns } from '@/app/(dashboard)/dashboard/data/seed-data'

export async function GET() {
  return NextResponse.json(campaigns)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // إنشاء حملة جديدة
    const newCampaign = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString()
    }
    
    // في التطبيق الحقيقي، سيتم حفظ البيانات في قاعدة البيانات
    
    return NextResponse.json(newCampaign, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في معالجة الطلب' },
      { status: 400 }
    )
  }
} 