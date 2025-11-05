import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة إرسال رسالة واتساب
    const messageData = {
      id: Date.now().toString(),
      to: body.phone,
      message: body.message,
      type: body.type || 'text',
      status: 'sent',
      sentAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في الإرسال
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    
    return NextResponse.json({
      success: true,
      messageId: messageData.id,
      status: 'sent',
      message: 'تم إرسال الرسالة بنجاح'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في إرسال الرسالة' 
      },
      { status: 400 }
    )
  }
} 