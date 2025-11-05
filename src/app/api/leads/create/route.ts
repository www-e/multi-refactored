import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة إنشاء عميل محتمل جديد
    const newLead = {
      id: Date.now().toString(),
      name: body.name,
      phone: body.phone,
      email: body.email,
      budgetSAR: body.budgetSAR,
      preferredNeighborhoods: body.preferredNeighborhoods || [],
      moveInDate: body.moveInDate,
      source: body.source || 'voice_agent',
      status: 'جديد',
      createdAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في المعالجة
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    
    return NextResponse.json({
      success: true,
      lead: newLead,
      message: 'تم إنشاء العميل المحتمل بنجاح'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في إنشاء العميل المحتمل' 
      },
      { status: 400 }
    )
  }
} 