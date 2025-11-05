import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة إرسال رسالة بريد إلكتروني
    const emailData = {
      id: Date.now().toString(),
      to: body.email,
      subject: body.subject,
      body: body.body,
      type: body.type || 'html',
      status: 'sent',
      sentAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في الإرسال
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    
    return NextResponse.json({
      success: true,
      emailId: emailData.id,
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