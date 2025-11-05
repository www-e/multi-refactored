import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة إنشاء حجز جديد
    const newBooking = {
      id: Date.now().toString(),
      propertyId: body.propertyId,
      contact: {
        name: body.contactName,
        phone: body.contactPhone,
        email: body.contactEmail
      },
      startDate: body.startDate,
      endDate: body.endDate,
      priceSAR: body.priceSAR,
      status: 'معلق',
      source: 'voice_agent',
      createdAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في المعالجة
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    
    return NextResponse.json({
      success: true,
      booking: newBooking,
      message: 'تم إنشاء الحجز بنجاح'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في إنشاء الحجز' 
      },
      { status: 400 }
    )
  }
} 