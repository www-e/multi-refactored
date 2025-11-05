import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة معالجة الدفع
    const paymentData = {
      id: Date.now().toString(),
      amount: body.amount,
      currency: body.currency || 'SAR',
      method: body.method || 'credit_card',
      status: 'processing',
      createdAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في المعالجة
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // محاكاة نجاح الدفع
    paymentData.status = 'completed'
    
    
    return NextResponse.json({
      success: true,
      paymentId: paymentData.id,
      status: 'completed',
      message: 'تم معالجة الدفع بنجاح',
      transactionId: `TXN_${Date.now()}`
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في معالجة الدفع' 
      },
      { status: 400 }
    )
  }
} 