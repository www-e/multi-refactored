import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة إنشاء حملة جديدة
    const newCampaign = {
      id: Date.now().toString(),
      name: body.name,
      objective: body.objective,
      status: body.status || 'نشطة',
      budgetSAR: body.budgetSAR,
      startDate: body.startDate,
      endDate: body.endDate,
      calls: 0,
      qualified: 0,
      bookings: 0,
      revenueSAR: 0,
      costSAR: 0,
      roas: 0,
      createdAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في المعالجة
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    
    return NextResponse.json({
      success: true,
      campaign: newCampaign,
      message: 'تم إنشاء الحملة بنجاح'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في إنشاء الحملة' 
      },
      { status: 400 }
    )
  }
} 