import { NextResponse } from 'next/server'
import { properties } from '@/app/(dashboard)/dashboard/data/seed-data'

export async function GET() {
  return NextResponse.json(properties)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // إنشاء عقار جديد
    const newProperty = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString()
    }
    
    // في التطبيق الحقيقي، سيتم حفظ البيانات في قاعدة البيانات
    
    return NextResponse.json(newProperty, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في معالجة الطلب' },
      { status: 400 }
    )
  }
} 