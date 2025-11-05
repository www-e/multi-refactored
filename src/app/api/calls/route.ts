import { NextResponse } from 'next/server'
import { callRecords } from '@/app/(dashboard)/dashboard/data/seed-data'

export async function GET() {
  return NextResponse.json(callRecords)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // إنشاء سجل اتصال جديد
    const newCall = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString()
    }
    
    // في التطبيق الحقيقي، سيتم حفظ البيانات في قاعدة البيانات
    
    return NextResponse.json(newCall, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في معالجة الطلب' },
      { status: 400 }
    )
  }
} 